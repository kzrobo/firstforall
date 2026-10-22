import type { Manual, ManualTranslation } from "@/lib/manuals/types";

// Test-only fixtures. Never imported by application code.
export function translation(p: Partial<ManualTranslation> & { language: string }): ManualTranslation {
  return { id: `t-${p.language}`, isSource: false, revision: "A", credit: null, pageCount: 100, fileSizeBytes: null,
    fileUrl: `https://example.test/${p.language}.pdf`, sectionMap: null, publishedAt: null, ...p };
}

export function manual(p: Partial<Manual> & { slug: string }): Manual {
  return { id: `m-${p.slug}`, title: p.slug, season: "2025-2026", seasonName: null, category: "competition", description: null,
    coverUrl: null, sourceUrl: null, sourceLanguage: "en", revision: "A", isFeatured: false, updatedAt: "", translations: [], ...p };
}
