import { z } from "zod";
import { ALL_SECTION_KEYS, CATEGORY_SECTIONS, HUB_CATEGORIES, PROJECT_STAGES, type HubCategory, type ProjectStage, type SectionKey } from "./categories";

export const mediaItemSchema = z.object({
  path: z.string().min(1).max(300),
  alt: z.string().max(300).default(""),
  caption: z.string().max(300).optional(),
  kind: z.enum(["photo", "screenshot"]).default("photo"),
});
export const milestoneSchema = z.object({ date: z.string().max(20), label: z.string().min(1).max(200) });

export const hubRowSchema = z.object({
  id: z.string().uuid(),
  category: z.enum(HUB_CATEGORIES),
  slug: z.string(),
  title: z.string(),
  subtitle: z.string().nullable(),
  summary: z.string().nullable(),
  sections: z.record(z.string(), z.unknown()).catch({}),
  stage: z.enum(PROJECT_STAGES).nullable(),
  event_date: z.string().nullable(),
  season: z.string().nullable(),
  country_code: z.string().nullable(),
  city: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  team_name: z.string().nullable(),
  team_number: z.number().int().nullable(),
  logo_path: z.string().nullable(),
  cover_path: z.string().nullable(),
  media: z.array(z.unknown()).catch([]),
  milestones: z.array(z.unknown()).catch([]),
  video_youtube_id: z.string().nullable(),
  collaborators: z.array(z.string()).catch([]),
  related_ids: z.array(z.string()).catch([]),
  is_featured: z.boolean(),
  display_order: z.number().int(),
  status: z.enum(["draft", "in_review", "published", "archived"]),
  published_at: z.string().nullable(),
  updated_at: z.string(),
});

export interface HubMedia { url: string; path: string; alt: string; caption: string | null; kind: "photo" | "screenshot" }
export interface Milestone { date: string; label: string }

export interface HubEntry {
  id: string;
  category: HubCategory;
  slug: string;
  title: string;
  subtitle: string | null;
  summary: string | null;
  sections: Partial<Record<SectionKey, string>>;
  stage: ProjectStage | null;
  eventDate: string | null;
  season: string | null;
  countryCode: string | null;
  city: string | null;
  /** Exact coordinates only when the city is verified */
  latitude: number | null;
  longitude: number | null;
  teamName: string | null;
  teamNumber: number | null;
  logoUrl: string | null;
  logoPath: string | null;
  coverUrl: string | null;
  coverPath: string | null;
  media: HubMedia[];
  milestones: Milestone[];
  videoId: string | null;
  collaborators: string[];
  relatedIds: string[];
  isFeatured: boolean;
  order: number;
  status: "draft" | "in_review" | "published" | "archived";
  publishedAt: string | null;
  updatedAt: string;
}

/** Keeps only the section keys a category is allowed to show, trimmed and non-empty. */
export function cleanSections(category: HubCategory, raw: Record<string, unknown>): Partial<Record<SectionKey, string>> {
  const allowed = CATEGORY_SECTIONS[category] as readonly string[];
  const out: Partial<Record<SectionKey, string>> = {};
  for (const key of ALL_SECTION_KEYS) {
    const v = raw[key];
    if (allowed.includes(key) && typeof v === "string" && v.trim()) out[key] = v.trim().slice(0, 4000);
  }
  return out;
}

export function toHubEntry(raw: unknown, publicUrl: (path: string) => string): HubEntry | null {
  const p = hubRowSchema.safeParse(raw);
  if (!p.success) return null;
  const r = p.data;
  const media = r.media.flatMap((m) => {
    const x = mediaItemSchema.safeParse(m);
    return x.success ? [{ url: publicUrl(x.data.path), path: x.data.path, alt: x.data.alt, caption: x.data.caption ?? null, kind: x.data.kind }] : [];
  });
  const milestones = r.milestones.flatMap((m) => { const x = milestoneSchema.safeParse(m); return x.success ? [x.data] : []; });
  return {
    id: r.id, category: r.category, slug: r.slug, title: r.title, subtitle: r.subtitle, summary: r.summary,
    sections: cleanSections(r.category, r.sections), stage: r.stage, eventDate: r.event_date, season: r.season,
    countryCode: r.country_code, city: r.city, latitude: r.latitude, longitude: r.longitude,
    teamName: r.team_name, teamNumber: r.team_number,
    logoUrl: r.logo_path ? publicUrl(r.logo_path) : null, logoPath: r.logo_path,
    coverUrl: r.cover_path ? publicUrl(r.cover_path) : null, coverPath: r.cover_path,
    media, milestones, videoId: r.video_youtube_id, collaborators: r.collaborators, relatedIds: r.related_ids,
    isFeatured: r.is_featured, order: r.display_order, status: r.status, publishedAt: r.published_at, updatedAt: r.updated_at,
  };
}

/** Featured first, then editor order, then most recent event/publication. */
export function sortEntries(entries: HubEntry[]): HubEntry[] {
  return [...entries].sort(
    (a, b) => Number(b.isFeatured) - Number(a.isFeatured) || a.order - b.order ||
      (b.eventDate ?? b.publishedAt ?? "").localeCompare(a.eventDate ?? a.publishedAt ?? ""),
  );
}
