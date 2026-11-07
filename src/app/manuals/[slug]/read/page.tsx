import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ManualReader } from "@/components/reader/ManualReader";
import { Notice } from "@/components/ui/Notice";
import { getI18n } from "@/i18n/server";
import { getPublishedManual } from "@/lib/manuals/repository";
import { resolveReaderTarget } from "@/lib/manuals/reader-nav";
import { getSavedManualLanguage } from "@/lib/manuals/saved-language";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string; page?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const r = await getPublishedManual((await params).slug);
  return { title: r.ok && r.data ? `${r.data.title} — Reader` : "Reader", robots: { index: false } };
}

export default async function ReaderPage({ params, searchParams }: Props) {
  const [{ slug }, sp, { t, locale }, saved] = await Promise.all([params, searchParams, getI18n(), getSavedManualLanguage()]);
  const result = await getPublishedManual(slug);
  if (!result.ok) return <div className="mx-auto max-w-content px-5 py-20"><Notice tone="warning">{t.manuals.notConfigured}</Notice></div>;
  if (!result.data) notFound();
  const { translation, page } = resolveReaderTarget(result.data.translations, sp, [saved, locale]);
  if (!translation) notFound();
  return (
    <ManualReader
      key={translation.id}
      manual={{ slug: result.data.slug, title: result.data.title }}
      translations={result.data.translations}
      current={translation}
      initialPage={page}
      t={t.reader}
      locale={locale}
    />
  );
}
