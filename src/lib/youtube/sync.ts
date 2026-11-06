import "server-only";
import { revalidatePath } from "next/cache";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { createYouTubeClient, YouTubeApiError, type YouTubeClient } from "./api";
import { planSync, type ExistingLesson, type PlaylistMapping } from "./plan";

const SKIP_REASON: Record<string, string> = {
  private: "private", unlisted: "unlisted", processing: "still processing", live_or_upcoming: "live or upcoming stream",
  not_embeddable: "embedding switched off", other_channel: "other channel", removed: "removed",
};

/**
 * One synchronisation run: YouTube channel uploads → LEARN lessons.
 * Quota: ~1 unit per 50 uploads + 1 per 50 videos + 1 per mapped playlist page (a few units per run;
 * the default daily quota is 10,000). The public site only reads the database, so a YouTube outage
 * or an exhausted quota never affects visitors — the run is logged as an error and retried next time.
 */

export type SyncTrigger = "schedule" | "admin" | "cli";
export interface SyncSummary {
  status: "ok" | "error" | "skipped";
  message: string;
  found: number; inserted: number; updated: number; unchanged: number; unavailable: number; quotaUnits: number;
  runId?: string;
}

const EXISTING_COLUMNS =
  "id, slug, youtube_id, source, locked_fields, title, description, category_id, duration_seconds, youtube_title, youtube_description, youtube_published_at, youtube_duration_seconds, thumbnail_url, youtube_playlist_ids, youtube_availability, youtube_unavailable_reason";
const MAX_UPLOAD_PAGES = Math.max(1, Math.min(40, Number(process.env.YOUTUBE_SYNC_MAX_PAGES) || 20)); // ≤ 1,000 videos at the default
const LOCK_MINUTES = 10;

const empty = (status: SyncSummary["status"], message: string): SyncSummary => ({ status, message, found: 0, inserted: 0, updated: 0, unchanged: 0, unavailable: 0, quotaUnits: 0 });

export function youTubeSyncConfig() {
  return {
    apiKey: Boolean(process.env.YOUTUBE_API_KEY),
    serviceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    cronSecret: Boolean(process.env.CRON_SECRET),
  };
}

export async function runYouTubeSync(trigger: SyncTrigger, deps: { client?: YouTubeClient } = {}): Promise<SyncSummary> {
  const db = createSupabaseServiceClient();
  if (!db) return empty("error", "SUPABASE_SERVICE_ROLE_KEY (or the Supabase URL) is not set on the server.");
  const key = process.env.YOUTUBE_API_KEY;

  const log = async (row: Record<string, unknown>) => {
    const { data } = await db.from("youtube_sync_runs").insert({ trigger, ...row }).select("id").single();
    return data?.id as string | undefined;
  };

  const { data: settings, error: settingsError } = await db.from("youtube_sync_settings").select("channel_id, enabled, auto_publish, default_category_id, default_language").maybeSingle();
  if (settingsError || !settings) return empty("error", `Sync settings unavailable: ${settingsError?.message ?? "no settings row (run the migration)"}`);
  if (!key && !deps.client) {
    const s = empty("skipped", "YOUTUBE_API_KEY is not set on the server. Nothing was imported.");
    return { ...s, runId: await log({ status: "skipped", finished_at: new Date().toISOString(), message: s.message }) };
  }
  if (!settings.enabled) {
    const s = empty("skipped", "Automatic import is switched off in the admin settings.");
    return { ...s, runId: await log({ status: "skipped", finished_at: new Date().toISOString(), message: s.message }) };
  }

  // One run at a time. The lock is the 'running' row itself (a unique index allows only one).
  // A run that crashed without finishing releases the lock after LOCK_MINUTES.
  const stale = new Date(Date.now() - LOCK_MINUTES * 60_000).toISOString();
  await db.from("youtube_sync_runs").update({ status: "error", finished_at: new Date().toISOString(), message: "Did not finish (timed out or the server stopped)." })
    .eq("status", "running").lt("started_at", stale);
  const { data: lock, error: lockError } = await db.from("youtube_sync_runs").insert({ trigger, status: "running" }).select("id").single();
  if (lockError?.code === "23505") return empty("skipped", "Another sync is already running.");
  if (lockError || !lock) return empty("error", `Could not start the run log: ${lockError?.message ?? "unknown error"}`);
  const runId = lock.id as string;

  const yt = deps.client ?? createYouTubeClient(key!);
  const finish = async (s: SyncSummary) => {
    if (runId) {
      await db.from("youtube_sync_runs").update({
        status: s.status, finished_at: new Date().toISOString(), found: s.found, inserted: s.inserted, updated: s.updated,
        unchanged: s.unchanged, unavailable: s.unavailable, quota_units: yt.quotaUnits(), message: s.message.slice(0, 2000),
      }).eq("id", runId);
    }
    return { ...s, quotaUnits: yt.quotaUnits(), runId };
  };

  try {
    const [{ data: mapRows }, { data: rows, error: rowsError }, { data: ignoredRows }, { data: categories }] = await Promise.all([
      db.from("youtube_playlist_categories").select("playlist_id, category_id, priority"),
      db.from("lessons").select(EXISTING_COLUMNS),
      db.from("youtube_ignored_videos").select("youtube_id"),
      db.from("lesson_categories").select("id").order("display_order"),
    ]);
    if (rowsError) throw new Error(`Could not read lessons: ${rowsError.message}`);
    const defaultCategoryId = settings.default_category_id ?? categories?.[0]?.id;
    if (!defaultCategoryId) throw new Error("No lesson category exists to file new videos under.");
    const existing = (rows ?? []) as ExistingLesson[];
    const mappings: PlaylistMapping[] = (mapRows ?? []).map((m) => ({ playlistId: m.playlist_id, categoryId: m.category_id, priority: m.priority }));

    const uploads = await yt.uploadIds(settings.channel_id, MAX_UPLOAD_PAGES);
    const membership = new Map<string, string[]>();
    for (const m of mappings) {
      try {
        for (const id of await yt.playlistIds(m.playlistId, 10)) membership.set(id, [...(membership.get(id) ?? []), m.playlistId]);
      } catch (e) {
        // A deleted or private playlist must not stop the run; its videos keep their category.
        if (!(e instanceof YouTubeApiError && e.status === 404)) throw e;
      }
    }
    const tracked = existing.filter((r) => r.source === "youtube" || r.youtube_availability !== null).map((r) => r.youtube_id);
    const requestedIds = [...new Set([...uploads, ...tracked])];
    const videos = await yt.videos(requestedIds);

    const plan = planSync({
      settings: { channelId: settings.channel_id, autoPublish: settings.auto_publish, defaultCategoryId, defaultLanguage: settings.default_language },
      mappings, membership, requestedIds, videos, existing,
      ignoredIds: new Set((ignoredRows ?? []).map((r) => r.youtube_id)),
      takenSlugs: new Set(existing.map((r) => r.slug)),
      now: new Date().toISOString(),
    });

    let inserted = 0, updated = 0;
    const problems: string[] = [];
    for (const row of plan.inserts) {
      // ON CONFLICT (youtube_id) DO NOTHING: a concurrent run or a hand-made lesson can never be duplicated.
      let { data, error } = await db.from("lessons").upsert(row, { onConflict: "youtube_id", ignoreDuplicates: true }).select("id");
      if (error?.code === "23505") {
        // Slug taken in the meantime: fall back to the video-id slug.
        ({ data, error } = await db.from("lessons").upsert({ ...row, slug: `video-${row.youtube_id.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}` }, { onConflict: "youtube_id", ignoreDuplicates: true }).select("id"));
      }
      if (error) problems.push(`${row.youtube_id}: ${error.message}`);
      else if (data?.length) inserted++;
    }
    for (const u of plan.updates) {
      const { error } = await db.from("lessons").update(u.patch).eq("id", u.id);
      if (error) problems.push(`${u.youtube_id}: ${error.message}`);
      else updated++;
    }
    if (inserted || updated) { revalidatePath("/learn", "layout"); revalidatePath("/"); }

    const skipped = plan.skipped.filter((s) => s.reason !== "ignored");
    const message = [
      `${uploads.length} public uploads checked.`,
      inserted ? `${inserted} new lesson${inserted === 1 ? "" : "s"} imported.` : "No new videos.",
      skipped.length ? `${skipped.length} not imported (${[...new Set(skipped.map((s) => SKIP_REASON[s.reason] ?? s.reason))].join(", ")}).` : "",
      problems.length ? `Problems: ${problems.slice(0, 5).join("; ")}` : "",
    ].filter(Boolean).join(" ");
    return await finish({ status: problems.length ? "error" : "ok", message, found: uploads.length, inserted, updated, unchanged: plan.unchanged, unavailable: plan.unavailable, quotaUnits: 0 });
  } catch (e) {
    const message = e instanceof YouTubeApiError
      ? (e.reason === "quotaExceeded" || e.reason === "dailyLimitExceeded" ? "YouTube API quota is used up for today; the next run will try again." : e.message)
      : `Sync failed: ${e instanceof Error ? e.message : "unknown error"}`;
    return await finish({ ...empty("error", `${message} Nothing was changed.`) });
  }
}
