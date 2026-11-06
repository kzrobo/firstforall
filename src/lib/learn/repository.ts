import "server-only";
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { categoryName, categoryRowSchema, lessonRowSchema, sortLessons, type Lesson, type LessonCategory } from "./types";

const BASE_COLUMNS =
  "id, slug, youtube_id, title, description, category_id, language_code, duration_seconds, is_featured, status, display_order, published_at, updated_at";
const SYNC_COLUMNS =
  "source, locked_fields, thumbnail_url, youtube_title, youtube_description, youtube_published_at, youtube_duration_seconds, youtube_availability, youtube_unavailable_reason, youtube_synced_at";
const LESSON_COLUMNS = `${BASE_COLUMNS}, ${SYNC_COLUMNS}`;
/** 42703 = undefined column: the YouTube migration has not run on this database yet. */
const missingSyncColumns = (code?: string) => code === "42703";
type Rows = { data: unknown[] | null; error: { code?: string; message: string } | null };
/** Runs a lessons query with the YouTube columns, retrying without them on a pre-migration database. */
async function selectLessons(build: (columns: string) => PromiseLike<Rows>): Promise<Rows> {
  const r = await build(LESSON_COLUMNS);
  return r.error && missingSyncColumns(r.error.code) ? build(BASE_COLUMNS) : r;
}

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
      source: r.source, thumbnailUrl: r.thumbnail_url, lockedFields: r.locked_fields,
      youtube: {
        title: r.youtube_title, description: r.youtube_description, publishedAt: r.youtube_published_at, durationSeconds: r.youtube_duration_seconds,
        availability: r.youtube_availability, unavailableReason: r.youtube_unavailable_reason, syncedAt: r.youtube_synced_at,
      },
    }];
  });
}

/** Published lessons only — even for signed-in editors, the public site never shows drafts. */
export const listPublishedLessons = cache(async (locale: string): Promise<LearnResult<{ lessons: Lesson[]; categories: LessonCategory[] }>> => {
  const cats = await listCategories(locale);
  if (!cats.ok) return cats;
  const supabase = (await createSupabaseServerClient())!;
  // Videos that became private or were removed on YouTube stay out of the public library.
  const { data, error } = await selectLessons((cols) => {
    const q = supabase.from("lessons").select(cols).eq("status", "published");
    return cols === LESSON_COLUMNS ? q.or("youtube_availability.is.null,youtube_availability.eq.available") : q;
  });
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
  const { data, error } = await selectLessons((cols) => supabase.from("lessons").select(cols).order("display_order").order("created_at", { ascending: false }));
  if (error) return { ok: false, reason: "error", message: error.message };
  return { ok: true, data: { lessons: toLessons(data ?? [], cats.data), categories: cats.data } };
}

export async function getLessonForAdmin(id: string, locale: string) {
  const all = await listAllLessonsForAdmin(locale);
  if (!all.ok) return all;
  return { ok: true as const, data: all.data.lessons.find((l) => l.id === id) ?? null, categories: all.data.categories };
}
