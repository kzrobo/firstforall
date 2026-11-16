import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ManualReader } from "@/components/reader/ManualReader";
import { getI18n } from "@/i18n/server";
import { isHubCategory } from "@/lib/hub/categories";
import { toReaderTranslations } from "@/lib/hub/documents";
import { getPublishedEntry } from "@/lib/hub/repository";
import { resolveReaderTarget } from "@/lib/manuals/reader-nav";

type Props = { params: Promise<{ category: string; slug: string }>; searchParams: Promise<{ lang?: string; page?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, slug } = await params;
  const r = isHubCategory(category) ? await getPublishedEntry(category, slug) : null;
  return { title: r?.ok && r.data ? `${r.data.entry.title} — Reader` : "Reader", robots: { index: false } };
}

/** Reads a published hub entry's PDF (comic, booklet…) in the same reader as the manual library. */
export default async function EntryReaderPage({ params, searchParams }: Props) {
  const [{ category, slug }, sp, { t, locale }] = await Promise.all([params, searchParams, getI18n()]);
  if (!isHubCategory(category)) notFound();
  const result = await getPublishedEntry(category, slug);
  if (!result.ok) return <p className="mx-auto max-w-content px-5 py-20 text-ink-muted lg:px-10">{t.hub.notConfigured}</p>;
  const entry = result.data?.entry;
  if (!entry || entry.documents.length === 0) notFound();
  const translations = toReaderTranslations(entry.id, entry.documents);
  // Without ?lang=: the interface language when that edition exists, else English, else the first document.
  const { translation, page } = resolveReaderTarget(translations, sp, [locale, "en"]);
  if (!translation) notFound();
  const base = `/mavericks/${category}/${encodeURIComponent(slug)}`;
  return (
    <ManualReader
      key={translation.id}
      manual={{ slug: entry.slug, title: entry.title }}
      translations={translations}
      current={translation}
      initialPage={page}
      t={t.reader}
      locale={locale}
      basePath={`${base}/read`}
      backHref={base}
    />
  );
}
