import "server-only";
import { cache } from "react";
import { publicStorageUrl } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { HUB_CATEGORIES, type HubCategory } from "./categories";
import { countryCentroids } from "./countries";
import { resolvePosition, type GlobePoint } from "./geo";
import { sortEntries, toHubEntry, type HubEntry } from "./types";

const COLUMNS = `id, category, slug, title, subtitle, summary, sections, stage, event_date, season, country_code, city,
  latitude, longitude, team_name, team_number, logo_path, cover_path, media, milestones, video_youtube_id,
  collaborators, related_ids, is_featured, display_order, status, published_at, updated_at`;

const url = (path: string) => (path.startsWith("/") ? path : publicStorageUrl("public-media", path));

export type HubResult<T> = { ok: true; data: T } | { ok: false; reason: "not_configured" | "error"; message?: string };

/** All published entries (public site never shows drafts, even to signed-in editors). */
export const listPublishedEntries = cache(async (): Promise<HubResult<HubEntry[]>> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, reason: "not_configured" };
  const { data, error } = await supabase.from("hub_entries").select(COLUMNS).eq("status", "published");
  if (error) return { ok: false, reason: "error", message: error.message };
  return { ok: true, data: sortEntries((data ?? []).map((r) => toHubEntry(r, url)).filter((e): e is HubEntry => e !== null)) };
});

export async function listCategory(category: HubCategory): Promise<HubResult<HubEntry[]>> {
  const all = await listPublishedEntries();
  return all.ok ? { ok: true, data: all.data.filter((e) => e.category === category) } : all;
}

export async function getPublishedEntry(category: HubCategory, slug: string): Promise<HubResult<{ entry: HubEntry; related: HubEntry[] } | null>> {
  const all = await listPublishedEntries();
  if (!all.ok) return all;
  const entry = all.data.find((e) => e.category === category && e.slug === slug);
  if (!entry) return { ok: true, data: null };
  const byId = new Map(all.data.map((e) => [e.id, e]));
  const related = entry.relatedIds.map((id) => byId.get(id)).filter((e): e is HubEntry => Boolean(e));
  return { ok: true, data: { entry, related } };
}

export async function categoryCounts(): Promise<Record<HubCategory, number> | null> {
  const all = await listPublishedEntries();
  if (!all.ok) return null;
  return Object.fromEntries(HUB_CATEGORIES.map((c) => [c, all.data.filter((e) => e.category === c).length])) as Record<HubCategory, number>;
}

/** Globe markers for published collaborations; entries without any usable location are listed but not placed. */
export function toGlobePoints(entries: HubEntry[]): GlobePoint[] {
  const centroids = countryCentroids();
  return entries.flatMap((e) => {
    const pos = resolvePosition(e, centroids);
    if (!pos || !e.countryCode) return [];
    return [{ id: e.id, slug: e.slug, teamName: e.teamName ?? e.title, teamNumber: e.teamNumber, countryCode: e.countryCode, city: e.city, logoUrl: e.logoUrl, ...pos }];
  });
}

/** Admin: every entry the signed-in member may see (RLS decides). */
export async function listAllEntriesForAdmin(): Promise<HubResult<HubEntry[]>> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, reason: "not_configured" };
  const { data, error } = await supabase.from("hub_entries").select(COLUMNS).order("category").order("display_order").order("updated_at", { ascending: false });
  if (error) return { ok: false, reason: "error", message: error.message };
  return { ok: true, data: (data ?? []).map((r) => toHubEntry(r, url)).filter((e): e is HubEntry => e !== null) };
}
