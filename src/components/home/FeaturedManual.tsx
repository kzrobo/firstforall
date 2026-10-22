import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionary";
import { languageName } from "@/lib/languages";
import type { Manual } from "@/lib/manuals/types";
import { ManualCover } from "@/components/manuals/ManualCover";
import { readerHref } from "@/components/manuals/format";
import { Notice } from "@/components/ui/Notice";

export function FeaturedManual({ t, manual, locale, notConfigured }: { t: Dictionary; manual: Manual | null; locale: string; notConfigured: boolean }) {
  return (
    <section aria-labelledby="featured-title" className="mx-auto max-w-content px-5 py-20 lg:px-8 lg:py-28">
      <p className="eyebrow">{t.home.featuredEyebrow}</p>
      {!manual ? (
        <div className="mt-8 max-w-2xl">
          <h2 id="featured-title" className="sr-only">{t.home.featuredEyebrow}</h2>
          <Notice>{notConfigured ? t.manuals.notConfigured : t.home.featuredEmpty}</Notice>
        </div>
      ) : (
        <div className="mt-10 grid items-start gap-12 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
          <Link href={`/manuals/${manual.slug}`} className="block max-w-sm shadow-[0_30px_60px_-30px_rgba(0,27,61,0.35)]">
            <ManualCover manual={manual} />
          </Link>
          <div className="md:pt-6">
            <p className="text-sm font-medium text-tech">{manual.season}{manual.seasonName ? ` · ${manual.seasonName}` : ""}</p>
            <h2 id="featured-title" className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.02em] text-navy md:text-5xl">{manual.title}</h2>
            {manual.description && <p className="mt-6 max-w-prose text-lg leading-relaxed text-ink-muted">{manual.description}</p>}
            <dl className="mt-8 grid max-w-md grid-cols-2 gap-y-4 border-t border-line pt-6 text-sm">
              <dt className="text-ink-muted">{t.manuals.revision}</dt><dd className="font-medium">{manual.revision}</dd>
              <dt className="text-ink-muted">{t.manuals.translations}</dt>
              <dd className="font-medium">{manual.translations.map((tr) => languageName(tr.language, locale)).join(", ") || "—"}</dd>
            </dl>
            {manual.translations[0] && (
              <div className="mt-10 flex flex-wrap gap-4">
                <Link href={readerHref(manual.slug, manual.translations[0].language)} className="inline-flex h-12 items-center rounded-md bg-navy px-6 text-[15px] font-semibold text-white hover:bg-navy-800">
                  {t.manuals.read}
                </Link>
                <a href={manual.translations[0].fileUrl} download className="inline-flex h-12 items-center rounded-md border border-navy/25 px-6 text-[15px] font-semibold text-navy hover:border-navy">
                  {t.manuals.download}
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
