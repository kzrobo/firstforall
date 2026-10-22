import "server-only";
import { cache } from "react";
import { z } from "zod";
import { publicStorageUrl } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const mediaRef = z.object({ path: z.string().min(1), alt: z.string().optional() });

export interface SiteMedia { heroVideo: string | null; heroPoster: string | null; filmVideo: string | null; filmPoster: string | null }

export const getSiteMedia = cache(async (): Promise<SiteMedia> => {
  const empty: SiteMedia = { heroVideo: null, heroPoster: null, filmVideo: null, filmPoster: null };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return empty;
  const { data } = await supabase.from("site_settings").select("key, value");
  const url = (key: string) => {
    const parsed = mediaRef.safeParse(data?.find((r) => r.key === key)?.value);
    return parsed.success ? publicStorageUrl("public-media", parsed.data.path) : null;
  };
  return { heroVideo: url("hero_video"), heroPoster: url("hero_poster"), filmVideo: url("film_video"), filmPoster: url("film_poster") };
});

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
