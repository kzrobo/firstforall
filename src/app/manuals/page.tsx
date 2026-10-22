import type { Metadata } from "next";
import { ManualLibrary } from "@/components/manuals/ManualLibrary";
import { Notice } from "@/components/ui/Notice";
import { getI18n } from "@/i18n/server";
import { listPublishedManuals } from "@/lib/manuals/repository";

export const metadata: Metadata = { title: "Manual library" };
export const revalidate = 60;

export default async function ManualsPage() {
  const { t, locale } = await getI18n();
  const result = await listPublishedManuals();
  return (
    <div className="mx-auto max-w-content px-5 py-16 lg:px-8 lg:py-20">
      <p className="eyebrow">{t.nav.manuals}</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-[-0.025em] text-navy md:text-5xl">{t.manuals.title}</h1>
      <p className="mt-5 max-w-2xl text-lg text-ink-muted">{t.manuals.intro}</p>
      <div className="mt-12">
        {!result.ok ? (
          <Notice tone="warning">{result.reason === "not_configured" ? t.manuals.notConfigured : t.reader.error}</Notice>
        ) : result.data.length === 0 ? (
          <Notice>{t.manuals.emptyLibrary}</Notice>
        ) : (
          <ManualLibrary manuals={result.data} t={t} locale={locale} />
        )}
      </div>
    </div>
  );
}
