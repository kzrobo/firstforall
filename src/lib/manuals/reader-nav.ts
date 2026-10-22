import type { ManualTranslation, SectionMap } from "./types";

/** Parses `?lang=&page=` for the reader, choosing a safe published translation. */
export function resolveReaderTarget(
  translations: ManualTranslation[],
  params: { lang?: string | string[]; page?: string | string[] },
): { translation: ManualTranslation | null; page: number } {
  const lang = Array.isArray(params.lang) ? params.lang[0] : params.lang;
  const rawPage = Array.isArray(params.page) ? params.page[0] : params.page;
  const translation =
    translations.find((t) => t.language === lang) ?? translations.find((t) => t.isSource) ?? translations[0] ?? null;
  let page = Number.parseInt(rawPage ?? "1", 10);
  if (!Number.isFinite(page) || page < 1) page = 1;
  if (translation?.pageCount && page > translation.pageCount) page = translation.pageCount;
  return { translation, page };
}

/** Finds the section that contains `page` (the last section starting on or before it). */
export function sectionAtPage(map: SectionMap | null, page: number): string | null {
  if (!map?.length) return null;
  let found: string | null = null;
  for (const entry of [...map].sort((a, b) => a.page - b.page)) {
    if (entry.page <= page) found = entry.key;
    else break;
  }
  return found;
}

/**
 * Maps the current page to the equivalent page in another translation.
 * Uses explicit section mappings only; translations rarely share pagination,
 * so without a mapping we return page 1 and report that a reset happened.
 */
export function mapPageAcrossTranslations(
  from: ManualTranslation,
  to: ManualTranslation,
  page: number,
): { page: number; mapped: boolean } {
  const section = sectionAtPage(from.sectionMap, page);
  if (section) {
    const target = to.sectionMap?.find((s) => s.key === section);
    if (target) return { page: target.page, mapped: true };
  }
  return { page: 1, mapped: page === 1 };
}
