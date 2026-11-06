import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { youTubeSyncConfig } from "./sync";

export interface SyncRun {
  id: string; trigger: string; status: string; started_at: string; finished_at: string | null;
  found: number; inserted: number; updated: number; unchanged: number; unavailable: number; quota_units: number; message: string | null;
}
export interface SyncOverview {
  migrated: boolean;
  config: ReturnType<typeof youTubeSyncConfig>;
  settings: { channel_id: string; enabled: boolean; auto_publish: boolean; default_category_id: string | null; default_language: string } | null;
  runs: SyncRun[];
  mappings: { playlist_id: string; playlist_title: string | null; category_id: string; priority: number }[];
  ignored: { youtube_id: string; title: string | null; created_at: string }[];
}

/** What the admin sees about the YouTube sync, read as the signed-in team member (RLS applies). */
export async function getSyncOverview(runLimit = 10): Promise<SyncOverview> {
  const config = youTubeSyncConfig();
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { migrated: false, config, settings: null, runs: [], mappings: [], ignored: [] };
  const [settings, runs, mappings, ignored] = await Promise.all([
    supabase.from("youtube_sync_settings").select("channel_id, enabled, auto_publish, default_category_id, default_language").maybeSingle(),
    supabase.from("youtube_sync_runs").select("id, trigger, status, started_at, finished_at, found, inserted, updated, unchanged, unavailable, quota_units, message").order("started_at", { ascending: false }).limit(runLimit),
    supabase.from("youtube_playlist_categories").select("playlist_id, playlist_title, category_id, priority").order("priority"),
    supabase.from("youtube_ignored_videos").select("youtube_id, title, created_at").order("created_at", { ascending: false }),
  ]);
  return {
    migrated: !settings.error,
    config,
    settings: settings.data ?? null,
    runs: (runs.data ?? []) as SyncRun[],
    mappings: mappings.data ?? [],
    ignored: ignored.data ?? [],
  };
}
