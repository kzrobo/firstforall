/** YouTube link handling. Only an 11-character video id is ever stored or embedded. */

const ID = /^[A-Za-z0-9_-]{11}$/;
const HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be", "www.youtube-nocookie.com", "youtube-nocookie.com"]);

export function isYouTubeId(value: string): boolean {
  return ID.test(value);
}

/**
 * Extracts the video id from a pasted YouTube link. Accepts watch, youtu.be, shorts,
 * live and embed URLs (http or https). Returns null for anything else — including
 * iframe snippets, playlists without a video and other domains.
 */
export function parseYouTubeUrl(input: string): string | null {
  const raw = input.trim();
  if (!raw || raw.length > 500 || /[\s<>"']/.test(raw)) return null;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.toLowerCase();
  if (!HOSTS.has(host)) return null;

  let candidate: string | null = null;
  if (host === "youtu.be") {
    candidate = url.pathname.split("/")[1] ?? null;
  } else if (url.pathname === "/watch") {
    candidate = url.searchParams.get("v");
  } else {
    const [, kind, id] = url.pathname.split("/");
    if (kind === "shorts" || kind === "embed" || kind === "live" || kind === "v") candidate = id ?? null;
  }
  return candidate && isYouTubeId(candidate) ? candidate : null;
}

export function youTubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}

/** Privacy-enhanced embed (no cookies until the visitor plays the video). */
export function youTubeEmbedUrl(id: string, opts: { autoplay?: boolean } = {}): string {
  const qs = new URLSearchParams({ rel: "0", modestbranding: "1", playsinline: "1" });
  if (opts.autoplay) qs.set("autoplay", "1");
  return `https://www.youtube-nocookie.com/embed/${id}?${qs}`;
}

/** Thumbnail candidates, best first. maxres does not exist for every video; hq always does. */
export function youTubeThumbnails(id: string): { maxres: string; hq: string } {
  return { maxres: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`, hq: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` };
}

/** "12:05" or "1:02:03" → seconds. Empty → null. Invalid → NaN. */
export function parseDuration(value: string): number | null {
  const v = value.trim();
  if (!v) return null;
  if (!/^\d{1,2}(:\d{1,2}){0,2}$/.test(v)) return Number.NaN;
  const parts = v.split(":").map(Number);
  if (parts.slice(1).some((p) => p > 59)) return Number.NaN;
  return parts.reduce((acc, p) => acc * 60 + p, 0) || Number.NaN;
}

export function formatDuration(seconds: number | null): string | null {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = seconds % 60;
  const mm = h ? String(m).padStart(2, "0") : String(m);
  return `${h ? `${h}:` : ""}${mm}:${String(s).padStart(2, "0")}`;
}

export function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return base;
}
