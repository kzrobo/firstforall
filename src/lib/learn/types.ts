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
