import "server-only";
import { cache } from "react";
import { z } from "zod";
import { publicStorageUrl } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const focus = z.string().regex(/^\d{1,3}% \d{1,3}%$/);
const mediaRef = z.object({
  path: z.string().min(1),
  alt: z.string().default(""),
  caption: z.string().optional(),
  focus: focus.optional(),
  focusMobile: focus.optional(),
  layout: z.enum(["wide", "tall", "standard"]).optional(),
  /** Optional WebM (VP9) version of a video slot, offered before the MP4 for wider codec support. */
  webm: z.string().min(1).optional(),
  /** Optional lighter portrait versions of a video slot for phones (MP4 + WebM). */
  mobile: z.string().min(1).optional(),
  mobileWebm: z.string().min(1).optional(),
  /** Pixel size of the original; lets the gallery keep each photo's natural proportions. */
  width: z.number().int().positive().max(20000).optional(),
  height: z.number().int().positive().max(20000).optional(),
});
const mediaList = z.object({ items: z.array(mediaRef).max(24) });

/** One uploaded image or video from the `public-media` bucket, with its description. */
export interface MediaItem {
  url: string;
  alt: string;
  caption: string | null;
  /** CSS object-position focal point, e.g. "50% 30%" */
  focus: string;
  focusMobile: string;
  layout: "wide" | "tall" | "standard";
  /** width ÷ height: from the stored pixel size, else from the layout hint */
  aspect: number;
  /** Alternative WebM source (video slots only) */
  webmUrl?: string | null;
  /** Portrait phone sources (video slots only) */
  mobileUrl?: string | null;
  mobileWebmUrl?: string | null;
}

const LAYOUT_ASPECT = { wide: 3 / 2, tall: 3 / 4, standard: 4 / 3 } as const;

export interface SiteMedia {
  heroVideo: MediaItem | null;
  heroPoster: MediaItem | null;
  heroPosterMobile: MediaItem | null;
  filmVideo: MediaItem | null;
  filmPoster: MediaItem | null;
  photoFeature: MediaItem | null;
  photoInitiative: MediaItem | null;
  photoPair: MediaItem[];
  aboutHero: MediaItem | null;
  aboutStory: MediaItem | null;
  /** Team photograph used where the homepage introduces MAVERICKS */
  teamFeature: MediaItem | null;
  teamGallery: MediaItem[];
}

const toItem = (r: z.infer<typeof mediaRef>): MediaItem => ({
  url: publicStorageUrl("public-media", r.path), alt: r.alt, caption: r.caption ?? null,
  focus: r.focus ?? "50% 50%", focusMobile: r.focusMobile ?? r.focus ?? "50% 50%", layout: r.layout ?? "standard",
  aspect: r.width && r.height ? r.width / r.height : LAYOUT_ASPECT[r.layout ?? "standard"],
  webmUrl: r.webm ? publicStorageUrl("public-media", r.webm) : null,
  mobileUrl: r.mobile ? publicStorageUrl("public-media", r.mobile) : null,
  mobileWebmUrl: r.mobileWebm ? publicStorageUrl("public-media", r.mobileWebm) : null,
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
    aboutHero: one("about_hero"), aboutStory: one("about_story"), teamGallery: many("team_gallery"),
    teamFeature: null,
  };
}

/** Fills empty slots from the bundled authentic media; database values always take priority. */
export function withBundledMedia(media: SiteMedia, bundled: Partial<Record<keyof SiteMedia, MediaItem>>): SiteMedia {
  const out = { ...media };
  for (const [key, item] of Object.entries(bundled) as [keyof SiteMedia, MediaItem][]) {
    if (out[key] === null) (out as Record<string, unknown>)[key] = item;
  }
  return out;
}

export const getSiteMedia = cache(async (): Promise<SiteMedia> => {
  const { BUNDLED_MEDIA } = await import("@/content/media");
  const supabase = await createSupabaseServerClient();
  if (!supabase) return withBundledMedia(parseSiteMedia(null), BUNDLED_MEDIA);
  const { data } = await supabase.from("site_settings").select("key, value");
  return withBundledMedia(parseSiteMedia(data), BUNDLED_MEDIA);
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
