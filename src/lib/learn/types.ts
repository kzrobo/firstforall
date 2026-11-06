import { z } from "zod";

export const categoryRowSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  names: z.record(z.string(), z.string()),
  display_order: z.number(),
});

export const lessonRowSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  youtube_id: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
  title: z.string(),
  description: z.string().nullable(),
  category_id: z.string().uuid(),
  language_code: z.string(),
  duration_seconds: z.number().int().nullable(),
  is_featured: z.boolean(),
  status: z.enum(["draft", "in_review", "published", "archived"]),
  display_order: z.number().int(),
  published_at: z.string().nullable(),
  updated_at: z.string(),
  // YouTube sync columns (absent before the 20261107 migration — defaults keep old databases working)
  source: z.enum(["manual", "youtube"]).default("manual"),
  locked_fields: z.array(z.string()).default([]),
  thumbnail_url: z.string().nullable().default(null),
  youtube_title: z.string().nullable().default(null),
  youtube_description: z.string().nullable().default(null),
  youtube_published_at: z.string().nullable().default(null),
  youtube_duration_seconds: z.number().int().nullable().default(null),
  youtube_availability: z.enum(["available", "unavailable"]).nullable().default(null),
  youtube_unavailable_reason: z.string().nullable().default(null),
  youtube_synced_at: z.string().nullable().default(null),
});

export interface LessonCategory { id: string; slug: string; name: string; names: Record<string, string>; order: number }

export interface Lesson {
  id: string;
  slug: string;
  youtubeId: string;
  title: string;
  description: string | null;
  category: LessonCategory;
  language: string;
  durationSeconds: number | null;
  isFeatured: boolean;
  status: "draft" | "in_review" | "published" | "archived";
  order: number;
  publishedAt: string | null;
  updatedAt: string;
  /** "youtube" = imported automatically from the channel; "manual" = added in the admin */
  source: "manual" | "youtube";
  thumbnailUrl: string | null;
  /** Editorial fields an admin changed; the sync no longer writes them */
  lockedFields: string[];
  /** YouTube's own values (null for lessons the sync has never seen) */
  youtube: {
    title: string | null; description: string | null; publishedAt: string | null; durationSeconds: number | null;
    availability: "available" | "unavailable" | null; unavailableReason: string | null; syncedAt: string | null;
  };
}

/** Fresh = published within the last 14 days (shown as "New" on /learn). */
export function isNewLesson(l: Lesson, now = Date.now()): boolean {
  const t = Date.parse(l.youtube.publishedAt ?? l.publishedAt ?? "");
  return Number.isFinite(t) && now - t < 14 * 86_400_000 && now >= t;
}

export function categoryName(names: Record<string, string>, locale: string): string {
  return names[locale] ?? names.en ?? Object.values(names)[0] ?? "";
}

/** Public ordering: featured first, then editor-defined order, then newest. */
export function sortLessons(lessons: Lesson[]): Lesson[] {
  return [...lessons].sort(
    (a, b) =>
      Number(b.isFeatured) - Number(a.isFeatured) ||
      a.order - b.order ||
      (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""),
  );
}
