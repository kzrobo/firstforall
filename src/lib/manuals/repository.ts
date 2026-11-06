import "server-only";
import { cache } from "react";
import { publicStorageUrl } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { manualRowSchema, type Manual } from "./types";

const SELECT = `id, slug, title, season, season_name, category, description, cover_path, source_url,
  source_language, revision, is_featured, updated_at,
  manual_translations ( id, manual_id, language_code, is_source, file_path, file_size_bytes, revision, status,
    translation_credit, page_count, section_map, published_at )`;

export type RepoResult<T> = { ok: true; data: T } | { ok: false; reason: "not_configured" | "error"; message?: string };

/** Draft files live in the private 'manuals-draft' bucket; only published files are in 'manuals-public'. */
export const DRAFT_BUCKET = "manuals-draft";
export const PUBLIC_BUCKET = "manuals-public";

function toManual(raw: unknown, opts: { includeDrafts?: boolean; signed?: Map<string, string> } = {}): Manual | null {
  const parsed = manualRowSchema.safeParse(raw);
  if (!parsed.success) return null;
  const row = parsed.data;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    season: row.season,
    seasonName: row.season_name,
    category: row.category,
    description: row.description,
    coverUrl: row.cover_path ? publicStorageUrl("public-media", row.cover_path) : null,
    sourceUrl: row.source_url,
    sourceLanguage: row.source_language,
    revision: row.revision,
    isFeatured: row.is_featured,
    updatedAt: row.updated_at,
    // Defence in depth: RLS already hides drafts from the public, but the public site
    // must never render a non-published translation even for a signed-in editor.
    translations: row.manual_translations
      .filter((t) => opts.includeDrafts || t.status === "published")
      .map((t) => ({
        ...(opts.includeDrafts ? { status: t.status } : {}),
        id: t.id,
        language: t.language_code,
        isSource: t.is_source,
        revision: t.revision,
        credit: t.translation_credit,
        pageCount: t.page_count,
        fileSizeBytes: t.file_size_bytes,
        fileUrl: t.status === "published" ? publicStorageUrl(PUBLIC_BUCKET, t.file_path) : opts.signed?.get(t.file_path) ?? publicStorageUrl(PUBLIC_BUCKET, t.file_path),
        sectionMap: t.section_map,
        publishedAt: t.published_at,
      }))
      .sort((a, b) => Number(b.isSource) - Number(a.isSource) || a.language.localeCompare(b.language)),
  };
}

/** Team preview: every manual and translation the signed-in member may read (RLS decides), drafts included. Admin routes only. */
export interface TeamManual { manual: Manual; status: "draft" | "in_review" | "published" | "archived" }

export async function listManualsForTeam(): Promise<RepoResult<TeamManual[]>> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, reason: "not_configured" };
  const { data, error } = await supabase.from("manuals").select(`status, ${SELECT}`).order("season", { ascending: false }).order("title");
  if (error) return { ok: false, reason: "error", message: error.message };
  // Unpublished files: one-hour signed links from the private bucket (storage RLS: team members only).
  // Files imported before drafts moved to the private bucket fall back to their public path.
  const draftPaths = (data ?? []).flatMap((m) => ((m as { manual_translations?: { file_path: string; status: string }[] }).manual_translations ?? [])
    .filter((t) => t.status !== "published").map((t) => t.file_path));
  const signed = new Map<string, string>();
  if (draftPaths.length) {
    const { data: urls } = await supabase.storage.from(DRAFT_BUCKET).createSignedUrls(draftPaths, 3600);
    for (const u of urls ?? []) if (u.signedUrl && u.path && !u.error) signed.set(u.path, u.signedUrl);
  }
  return {
    ok: true,
    data: (data ?? []).flatMap((raw) => {
      const manual = toManual(raw, { includeDrafts: true, signed });
      return manual ? [{ manual, status: (raw as { status: TeamManual["status"] }).status }] : [];
    }),
  };
}

export async function getManualForTeam(slug: string): Promise<RepoResult<TeamManual | null>> {
  const r = await listManualsForTeam();
  return r.ok ? { ok: true, data: r.data.find((m) => m.manual.slug === slug) ?? null } : r;
}

export const listPublishedManuals = cache(async (): Promise<RepoResult<Manual[]>> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, reason: "not_configured" };
  const { data, error } = await supabase
    .from("manuals")
    .select(SELECT)
    .eq("status", "published")
    .order("season", { ascending: false })
    .order("title");
  if (error) return { ok: false, reason: "error", message: error.message };
  return { ok: true, data: (data ?? []).map((r) => toManual(r)).filter((m): m is Manual => m !== null) };
});

export const getPublishedManual = cache(async (slug: string): Promise<RepoResult<Manual | null>> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, reason: "not_configured" };
  const { data, error } = await supabase
    .from("manuals")
    .select(SELECT)
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();
  if (error) return { ok: false, reason: "error", message: error.message };
  return { ok: true, data: data ? toManual(data) : null };
});
