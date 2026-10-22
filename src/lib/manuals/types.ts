import { z } from "zod";

export const MANUAL_CATEGORIES = ["competition", "game", "engineering", "safety", "other"] as const;
export type ManualCategory = (typeof MANUAL_CATEGORIES)[number];

export const sectionMapSchema = z.array(z.object({ key: z.string().min(1), page: z.number().int().positive() }));

export const translationRowSchema = z.object({
  id: z.string().uuid(),
  manual_id: z.string().uuid(),
  language_code: z.string(),
  is_source: z.boolean(),
  file_path: z.string(),
  file_size_bytes: z.number().nullable(),
  revision: z.string(),
  status: z.enum(["draft", "in_review", "published", "archived"]),
  translation_credit: z.string().nullable(),
  page_count: z.number().int().nullable(),
  section_map: sectionMapSchema.nullable().catch(null),
  published_at: z.string().nullable(),
});

export const manualRowSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  season: z.string(),
  season_name: z.string().nullable(),
  category: z.enum(MANUAL_CATEGORIES),
  description: z.string().nullable(),
  cover_path: z.string().nullable(),
  source_url: z.string().nullable(),
  source_language: z.string(),
  revision: z.string(),
  is_featured: z.boolean(),
  updated_at: z.string(),
  manual_translations: z.array(translationRowSchema).default([]),
});

export type SectionMap = z.infer<typeof sectionMapSchema>;

export interface ManualTranslation {
  id: string;
  language: string;
  isSource: boolean;
  revision: string;
  credit: string | null;
  pageCount: number | null;
  fileSizeBytes: number | null;
  fileUrl: string;
  sectionMap: SectionMap | null;
  publishedAt: string | null;
}

export interface Manual {
  id: string;
  slug: string;
  title: string;
  season: string;
  seasonName: string | null;
  category: ManualCategory;
  description: string | null;
  coverUrl: string | null;
  sourceUrl: string | null;
  sourceLanguage: string;
  revision: string;
  isFeatured: boolean;
  updatedAt: string;
  translations: ManualTranslation[];
}
