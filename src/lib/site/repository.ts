import "server-only";
import { cache } from "react";
import { z } from "zod";
import { publicStorageUrl } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const mediaRef = z.object({ path: z.string().min(1), alt: z.string().default(""), caption: z.string().optional() });
const mediaList = z.object({ items: z.array(mediaRef).max(12) });

/** One uploaded image or video from the `public-media` bucket, with its description. */
export interface MediaItem { url: string; alt: string; caption: string | null }

export interface SiteMedia {
  heroVideo: MediaItem | null;
  heroPoster: MediaItem | null;
  heroPosterMobile: MediaItem | null;
  filmVideo: MediaItem | null;
  filmPoster: MediaItem | null;
  photoFeature: MediaItem | null;
  photoInitiative: MediaItem | null;
  photoPair: MediaItem[];
}

const toItem = (r: z.infer<typeof mediaRef>): MediaItem => ({
  url: publicStorageUrl("public-media", r.path), alt: r.alt, caption: r.caption ?? null,
});

/** Pure parser so it can be unit-tested without a database. */
export function parseSiteMedia(rows: { key: string; value: unknown }[] | null | undefined): SiteMedia {
  const value = (key: string) => rows?.find((r) => r.key === key)?.value;
  const one = (key: string) => { const p = mediaRef.safeParse(value(key)); return p.success ? toItem(p.data) : null; };
  const many = (key: string) => { const p = mediaList.safeParse(value(key)); return p.success ? p.data.items.map(toItem) : []; };
  return {
    heroVideo: one("hero_video"), heroPoster: one("hero_poster"), heroPosterMobile: one("hero_poster_mobile"),
    filmVideo: one("film_video"), filmPoster: one("film_poster"),
    photoFeature: one("photo_feature"), photoInitiative: one("photo_initiative"), photoPair: many("photo_pair"),
  };
}

export const getSiteMedia = cache(async (): Promise<SiteMedia> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return parseSiteMedia(null);
  const { data } = await supabase.from("site_settings").select("key, value");
  return parseSiteMedia(data);
});

/**
 * Empty media slots are hidden from visitors in production. In development (or with
 * SHOW_MEDIA_SLOTS=1) they render as labelled frames so the layout can be reviewed.
 */
export function showEmptyMediaSlots(): boolean {
  return process.env.SHOW_MEDIA_SLOTS === "1" || process.env.NODE_ENV !== "production";
}

export interface Sponsor { id: string; name: string; logoUrl: string | null; url: string | null; description: string | null; category: string }

export const listSponsors = cache(async (): Promise<Sponsor[]> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("sponsors")
    .select("id, name, logo_path, url, description, category")
    .eq("confirmed", true)
    .order("display_order");
  return (data ?? []).map((s) => ({
    id: s.id, name: s.name, url: s.url, description: s.description, category: s.category,
    logoUrl: s.logo_path ? publicStorageUrl("public-media", s.logo_path) : null,
  }));
});
