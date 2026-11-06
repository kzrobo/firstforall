import "server-only";
import { z } from "zod";
import { parseIsoDuration, pickThumbnail, type VideoInfo } from "./plan";

/**
 * Minimal YouTube Data API v3 client. Server-only: the key comes from YOUTUBE_API_KEY and travels
 * in the X-Goog-Api-Key header (never in a URL, a log line or the browser).
 * Every list call costs 1 quota unit; the client counts them for the run log.
 */

export const DEFAULT_API_BASE = "https://www.googleapis.com/youtube/v3";

export class YouTubeApiError extends Error {
  constructor(public status: number, public reason: string, message: string) { super(message); this.name = "YouTubeApiError"; }
  /** Errors that will not fix themselves by retrying in the same run. */
  get permanent() { return [400, 401, 403, 404].includes(this.status); }
}

const errorBody = z.object({ error: z.object({ message: z.string().optional(), errors: z.array(z.object({ reason: z.string().optional() })).optional() }) });

export interface YouTubeClient {
  quotaUnits: () => number;
  /** Public uploads of a channel, newest first (ids only). */
  uploadIds: (channelId: string, maxPages: number) => Promise<string[]>;
  playlistIds: (playlistId: string, maxPages: number) => Promise<string[]>;
  videos: (ids: string[]) => Promise<VideoInfo[]>;
  channelPlaylists: (channelId: string) => Promise<{ id: string; title: string; itemCount: number | null }[]>;
}

export function apiBase(): string {
  return (process.env.YOUTUBE_API_BASE || DEFAULT_API_BASE).replace(/\/+$/, "");
}

/** Test origin whose thumbnails are accepted — only when the API base points at a local mock. */
export function testThumbnailOrigin(): string | null {
  const base = apiBase();
  return /^http:\/\/(localhost|127\.0\.0\.1):\d+/.test(base) ? new URL(base).origin : null;
}

export function createYouTubeClient(key: string, opts: { fetchImpl?: typeof fetch; timeoutMs?: number } = {}): YouTubeClient {
  const doFetch = opts.fetchImpl ?? fetch;
  const base = apiBase();
  const thumbOrigin = testThumbnailOrigin();
  let units = 0;

  async function get(path: string, params: Record<string, string>): Promise<unknown> {
    const url = `${base}/${path}?${new URLSearchParams(params)}`;
    let lastErr: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt) await new Promise((r) => setTimeout(r, 800 * 2 ** (attempt - 1)));
      try {
        units++;
        const res = await doFetch(url, { headers: { "X-Goog-Api-Key": key, Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(opts.timeoutMs ?? 10_000) });
        if (res.ok) return await res.json();
        const parsed = errorBody.safeParse(await res.json().catch(() => null));
        const reason = parsed.success ? parsed.data.error.errors?.[0]?.reason ?? "error" : "error";
        const err = new YouTubeApiError(res.status, reason, `YouTube API ${path}: ${res.status} ${reason}${parsed.success && parsed.data.error.message ? ` — ${parsed.data.error.message.slice(0, 200)}` : ""}`);
        if (err.permanent) throw err; // quota, bad key, not found: retrying only burns quota
        lastErr = err;
      } catch (e) {
        if (e instanceof YouTubeApiError && e.permanent) throw e;
        lastErr = e;
      }
    }
    throw lastErr instanceof YouTubeApiError ? lastErr : new YouTubeApiError(0, "network", `YouTube API ${path}: unreachable (${lastErr instanceof Error ? lastErr.name : "error"})`);
  }

  const listPage = z.object({ nextPageToken: z.string().optional(), items: z.array(z.unknown()).default([]) });
  const playlistItem = z.object({ contentDetails: z.object({ videoId: z.string() }) });

  async function playlistIds(playlistId: string, maxPages: number) {
    const ids: string[] = [];
    let pageToken: string | undefined;
    for (let page = 0; page < maxPages; page++) {
      const body = listPage.parse(await get("playlistItems", { part: "contentDetails", playlistId, maxResults: "50", ...(pageToken ? { pageToken } : {}) }));
      for (const item of body.items) { const p = playlistItem.safeParse(item); if (p.success) ids.push(p.data.contentDetails.videoId); }
      pageToken = body.nextPageToken;
      if (!pageToken) break;
    }
    return ids;
  }

  const video = z.object({
    id: z.string(),
    snippet: z.object({
      channelId: z.string(), title: z.string().default(""), description: z.string().default(""), publishedAt: z.string().optional(),
      liveBroadcastContent: z.string().default("none"), defaultAudioLanguage: z.string().optional(), defaultLanguage: z.string().optional(),
      thumbnails: z.record(z.string(), z.object({ url: z.string().optional() })).optional(),
    }),
    contentDetails: z.object({ duration: z.string().optional() }).optional(),
    status: z.object({ privacyStatus: z.string().default("private"), uploadStatus: z.string().default("processed"), embeddable: z.boolean().default(true) }).optional(),
  });

  return {
    quotaUnits: () => units,
    // The uploads playlist of channel UCxxxx is UUxxxx — no extra channels.list call needed.
    uploadIds: (channelId, maxPages) => playlistIds(`UU${channelId.slice(2)}`, maxPages),
    playlistIds,
    async videos(ids) {
      const out: VideoInfo[] = [];
      for (let i = 0; i < ids.length; i += 50) {
        const body = listPage.parse(await get("videos", { part: "snippet,contentDetails,status", id: ids.slice(i, i + 50).join(","), maxResults: "50" }));
        for (const item of body.items) {
          const p = video.safeParse(item);
          if (!p.success) continue;
          const v = p.data;
          out.push({
            id: v.id, channelId: v.snippet.channelId, title: v.snippet.title, description: v.snippet.description,
            publishedAt: v.snippet.publishedAt ?? null, durationSeconds: parseIsoDuration(v.contentDetails?.duration),
            thumbnailUrl: pickThumbnail(v.snippet.thumbnails, thumbOrigin),
            privacyStatus: v.status?.privacyStatus ?? "private", uploadStatus: v.status?.uploadStatus ?? "processed", embeddable: v.status?.embeddable ?? true,
            liveBroadcastContent: v.snippet.liveBroadcastContent, defaultAudioLanguage: v.snippet.defaultAudioLanguage ?? v.snippet.defaultLanguage ?? null,
          });
        }
      }
      return out;
    },
    async channelPlaylists(channelId) {
      const item = z.object({ id: z.string(), snippet: z.object({ title: z.string() }), contentDetails: z.object({ itemCount: z.number() }).optional() });
      const out: { id: string; title: string; itemCount: number | null }[] = [];
      let pageToken: string | undefined;
      for (let page = 0; page < 4; page++) {
        const body = listPage.parse(await get("playlists", { part: "snippet,contentDetails", channelId, maxResults: "50", ...(pageToken ? { pageToken } : {}) }));
        for (const it of body.items) { const p = item.safeParse(it); if (p.success) out.push({ id: p.data.id, title: p.data.snippet.title, itemCount: p.data.contentDetails?.itemCount ?? null }); }
        pageToken = body.nextPageToken;
        if (!pageToken) break;
      }
      return out;
    },
  };
}
