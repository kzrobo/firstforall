import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentThumb } from "@/components/manuals/DocumentThumb";
import { formatBytes, readerHref } from "@/components/manuals/format";
import { Notice } from "@/components/ui/Notice";
import { UI_LOCALES } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { languageName } from "@/lib/languages";
import { getPublishedManual } from "@/lib/manuals/repository";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const r = await getPublishedManual((await params).slug);
  return r.ok && r.data ? { title: r.data.title, description: r.data.description ?? undefined } : { title: "Manual" };
}

export default async function ManualOverviewPage({ params }: Props) {
  const { slug } = await params;
  const { t, locale } = await getI18n();
  const result = await getPublishedManual(slug);
  if (!result.ok) {
    return <div className="mx-auto max-w-content px-5 py-20 lg:px-10"><Notice tone="warning">{t.manuals.notConfigured}</Notice></div>;
  }
  const manual = result.data;
  if (!manual) notFound();
  const published = new Set(manual.translations.map((tr) => tr.language));
  const missingUi = UI_LOCALES.filter((l) => !published.has(l));

  const primary = manual.translations.find((tr) => tr.isSource) ?? manual.translations[0];

  return (
    <article>
      <header className="border-b border-line bg-paper">
        <div className="mx-auto max-w-content px-5 pt-8 lg:px-10">
          <nav aria-label="Breadcrumb" className="text-[14px] text-ink-muted">
            <Link href="/manuals" className="hover:text-navy">{t.nav.manuals}</Link><span aria-hidden className="mx-2">/</span>{manual.season}
          </nav>
        </div>
        <div className="mx-auto grid max-w-content gap-x-8 lg:gap-x-16 gap-y-10 px-5 pb-14 pt-10 md:grid-cols-12 lg:px-10 lg:pb-20">
          <div className="max-w-[260px] md:col-span-4 md:max-w-none lg:col-span-3">
            <DocumentThumb manual={manual} />
          </div>
          <div className="md:col-span-8 lg:col-span-8 lg:col-start-5">
            <p className="text-[14px] font-medium text-tech t-num">{manual.season}{manual.seasonName ? ` · ${manual.seasonName}` : ""} · <span className="capitalize">{manual.category}</span></p>
            <h1 className="t-h1 mt-3 text-navy">{manual.title}</h1>
            {manual.description && <p className="t-lead mt-6 max-w-prose text-ink-muted">{manual.description}</p>}
            {primary && (
              <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
                <Link href={readerHref(manual.slug, primary.language)} className="font-display inline-flex h-12 items-center bg-navy px-6 text-[14px] font-medium text-white hover:bg-navy-800">
                  {t.manuals.read}
                </Link>
                <a href={primary.fileUrl} download className="link-arrow text-[15px] text-navy">{t.manuals.download}</a>
              </div>
            )}
            <dl className="mt-10 grid max-w-xl grid-cols-2 gap-6 border-t border-line pt-6 text-[14px] sm:grid-cols-3">
              <div><dt className="text-ink-muted">{t.manuals.revision}</dt><dd className="mt-1 font-semibold">{manual.revision}</dd></div>
              <div><dt className="text-ink-muted">{t.manuals.translations}</dt><dd className="mt-1 font-semibold t-num">{manual.translations.length}</dd></div>
              {manual.sourceUrl && (
                <div><dt className="text-ink-muted">{t.manuals.source}</dt>
                  <dd className="mt-1"><a href={manual.sourceUrl} rel="noopener noreferrer" target="_blank" className="font-semibold text-tech hover:underline">firstinspires.org ↗</a></dd></div>
              )}
            </dl>
          </div>
        </div>
      </header>

      <section aria-labelledby="tr-title" className="mx-auto max-w-content px-5 py-14 lg:px-10 lg:py-20">
        <h2 id="tr-title" className="t-h3 text-navy">{t.manuals.translations}</h2>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-[15px]">
            <thead>
              <tr className="border-b-2 border-navy t-label text-ink-muted">
                <th className="py-3 pr-4 font-semibold">{t.manuals.language}</th>
                <th className="py-3 pr-4 font-semibold">{t.manuals.revision}</th>
                <th className="py-3 pr-4 font-semibold">{t.manuals.translatedBy}</th>
                <th className="py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {manual.translations.map((tr) => (
                <tr key={tr.id} className="border-b border-line">
                  <td className="py-4 pr-4">
                    <span className="font-semibold text-navy">{languageName(tr.language, locale)}</span>
                    <span className="mt-0.5 block text-[13px] text-ink-muted">{tr.isSource ? t.manuals.official : t.manuals.community}</span>
                  </td>
                  <td className="py-4 pr-4 t-num">{tr.revision}{tr.pageCount ? <span className="text-ink-muted"> · {tr.pageCount} {t.manuals.pages}</span> : null}</td>
                  <td className="py-4 pr-4 text-ink-muted">{tr.credit ?? "—"}</td>
                  <td className="whitespace-nowrap py-4 text-right">
                    <Link href={readerHref(manual.slug, tr.language)} className="font-semibold text-tech hover:underline">{t.manuals.read}</Link>
                    <a href={tr.fileUrl} download className="ml-6 text-ink-muted hover:text-navy">PDF{formatBytes(tr.fileSizeBytes) ? ` · ${formatBytes(tr.fileSizeBytes)}` : ""}</a>
                  </td>
                </tr>
              ))}
              {missingUi.map((l) => (
                <tr key={l} className="border-b border-line text-ink-faint">
                  <td className="py-4 pr-4">{languageName(l, locale)}</td>
                  <td colSpan={3} className="py-4">{t.manuals.unavailable}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </article>
  );
}
