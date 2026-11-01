import "server-only";
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { categoryName, categoryRowSchema, lessonRowSchema, sortLessons, type Lesson, type LessonCategory } from "./types";

const LESSON_COLUMNS =
  "id, slug, youtube_id, title, description, category_id, language_code, duration_seconds, is_featured, status, display_order, published_at, updated_at";

export type LearnResult<T> = { ok: true; data: T } | { ok: false; reason: "not_configured" | "error"; message?: string };

async function loadCategories(locale: string): Promise<LearnResult<LessonCategory[]>> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, reason: "not_configured" };
  const { data, error } = await supabase.from("lesson_categories").select("id, slug, names, display_order").order("display_order");
  if (error) return { ok: false, reason: "error", message: error.message };
  return {
    ok: true,
    data: (data ?? []).flatMap((row) => {
      const p = categoryRowSchema.safeParse(row);
      return p.success ? [{ id: p.data.id, slug: p.data.slug, names: p.data.names, order: p.data.display_order, name: categoryName(p.data.names, locale) }] : [];
    }),
  };
}

export const listCategories = cache(loadCategories);

function toLessons(rows: unknown[], categories: LessonCategory[]): Lesson[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  return rows.flatMap((row) => {
    const p = lessonRowSchema.safeParse(row);
    const category = p.success ? byId.get(p.data.category_id) : undefined;
    if (!p.success || !category) return [];
    const r = p.data;
    return [{
      id: r.id, slug: r.slug, youtubeId: r.youtube_id, title: r.title, description: r.description, category,
      language: r.language_code, durationSeconds: r.duration_seconds, isFeatured: r.is_featured, status: r.status,
      order: r.display_order, publishedAt: r.published_at, updatedAt: r.updated_at,
    }];
  });
}

/** Published lessons only — even for signed-in editors, the public site never shows drafts. */
export const listPublishedLessons = cache(async (locale: string): Promise<LearnResult<{ lessons: Lesson[]; categories: LessonCategory[] }>> => {
  const cats = await listCategories(locale);
  if (!cats.ok) return cats;
  const supabase = (await createSupabaseServerClient())!;
  const { data, error } = await supabase.from("lessons").select(LESSON_COLUMNS).eq("status", "published");
  if (error) return { ok: false, reason: "error", message: error.message };
  return { ok: true, data: { lessons: sortLessons(toLessons(data ?? [], cats.data)), categories: cats.data } };
});

export const getPublishedLesson = cache(async (slug: string, locale: string) => {
  const all = await listPublishedLessons(locale);
  if (!all.ok) return all;
  return { ok: true as const, data: all.data.lessons.find((l) => l.slug === slug) ?? null, related: all.data.lessons };
});

/** Admin view: every lesson the signed-in team member may see (RLS decides). */
export async function listAllLessonsForAdmin(locale: string): Promise<LearnResult<{ lessons: Lesson[]; categories: LessonCategory[] }>> {
  const cats = await loadCategories(locale);
  if (!cats.ok) return cats;
  const supabase = (await createSupabaseServerClient())!;
  const { data, error } = await supabase.from("lessons").select(LESSON_COLUMNS).order("display_order").order("created_at", { ascending: false });
  if (error) return { ok: false, reason: "error", message: error.message };
  return { ok: true, data: { lessons: toLessons(data ?? [], cats.data), categories: cats.data } };
}

export async function getLessonForAdmin(id: string, locale: string) {
  const all = await listAllLessonsForAdmin(locale);
  if (!all.ok) return all;
  return { ok: true as const, data: all.data.lessons.find((l) => l.id === id) ?? null, categories: all.data.categories };
}
