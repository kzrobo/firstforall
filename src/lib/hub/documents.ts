import { z } from "zod";
import { matchLanguage } from "@/lib/manuals/language";
import type { ManualTranslation } from "@/lib/manuals/types";

/**
 * Readable PDF documents attached to a hub entry (a comic, a booklet…), one per language.
 * Stored in hub_entries.documents; files live in the public 'manuals-public' bucket. Pure: no I/O.
 */
export const HUB_DOCUMENT_BUCKET = "manuals-public";

export const documentItemSchema = z.object({
  path: z.string().regex(/^hub\/[a-z]+\/[a-z0-9-]+\/[A-Za-z0-9-]+\.pdf$/).max(300),
  language: z.string().regex(/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/),
  pages: z.number().int().positive().nullable().optional(),
  bytes: z.number().int().positive().nullable().optional(),
});

export interface HubDocument { url: string; path: string; language: string; pages: number | null; bytes: number | null }

/** Valid documents only, at most one per language (the first wins). */
export function toDocuments(raw: unknown[], url: (path: string) => string): HubDocument[] {
  const seen = new Set<string>();
  return raw.flatMap((item) => {
    const p = documentItemSchema.safeParse(item);
    if (!p.success || seen.has(p.data.language.toLowerCase())) return [];
    seen.add(p.data.language.toLowerCase());
    return [{ url: url(p.data.path), path: p.data.path, language: p.data.language, pages: p.data.pages ?? null, bytes: p.data.bytes ?? null }];
  });
}

/** Reading order: the visitor's interface language first when it exists, then English, then the rest as stored. */
export function orderDocuments(docs: readonly HubDocument[], interfaceLocale: string): HubDocument[] {
  const langs = docs.map((d) => d.language);
  const first = matchLanguage(interfaceLocale, langs), en = matchLanguage("en", langs);
  const rank = (d: HubDocument) => (d.language === first ? 0 : d.language === en ? 1 : 2);
  return docs.map((d, i) => ({ d, i })).sort((a, b) => rank(a.d) - rank(b.d) || a.i - b.i).map((x) => x.d);
}

/** The shape the PDF reader works with (the same reader as the manual library). */
export function toReaderTranslations(entryId: string, docs: readonly HubDocument[]): ManualTranslation[] {
  return docs.map((d) => ({
    id: `${entryId}-${d.language}`, language: d.language, isSource: false, revision: "", credit: null,
    pageCount: d.pages, fileSizeBytes: d.bytes, fileUrl: d.url, sectionMap: null, publishedAt: null,
  }));
}

export function documentReaderHref(category: string, slug: string, language: string): string {
  return `/mavericks/${category}/${encodeURIComponent(slug)}/read?lang=${encodeURIComponent(language)}`;
}
