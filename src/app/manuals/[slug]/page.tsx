import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ManualCover } from "@/components/manuals/ManualCover";
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
    return <div className="mx-auto max-w-content px-5 py-20 lg:px-8"><Notice tone="warning">{t.manuals.notConfigured}</Notice></div>;
  }
  const manual = result.data;
  if (!manual) notFound();
  const published = new Set(manual.translations.map((tr) => tr.language));
  const missingUi = UI_LOCALES.filter((l) => !published.has(l));

  return (
    <div className="mx-auto max-w-content px-5 py-16 lg:px-8 lg:py-20">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-muted"><Link href="/manuals" className="hover:text-navy">{t.nav.manuals}</Link> / {manual.season}</nav>
      <div className="mt-10 grid gap-12 md:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-20">
        <div className="max-w-xs"><ManualCover manual={manual} /></div>
        <div>
          <p className="text-sm font-medium text-tech">{manual.season}{manual.seasonName ? ` · ${manual.seasonName}` : ""}</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.025em] text-navy md:text-5xl">{manual.title}</h1>
          {manual.description && <p className="mt-6 max-w-prose text-lg leading-relaxed text-ink-muted">{manual.description}</p>}
          <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-3 text-sm">
            <div><dt className="text-ink-muted">{t.manuals.revision}</dt><dd className="font-medium">{manual.revision}</dd></div>
            {manual.sourceUrl && (
              <div><dt className="text-ink-muted">{t.manuals.source}</dt>
                <dd><a href={manual.sourceUrl} rel="noopener noreferrer" target="_blank" className="font-medium text-tech hover:underline">firstinspires.org ↗</a></dd></div>
            )}
          </dl>

          <h2 className="mt-14 text-xl font-semibold text-navy">{t.manuals.translations}</h2>
          <table className="mt-4 w-full text-left text-[15px]">
            <thead className="border-b border-line text-xs uppercase tracking-wider text-ink-muted">
              <tr><th className="py-2 font-medium">{t.manuals.language}</th><th className="py-2 font-medium">{t.manuals.revision}</th><th className="hidden py-2 font-medium sm:table-cell">{t.manuals.translatedBy}</th><th className="py-2"><span className="sr-only">Actions</span></th></tr>
            </thead>
            <tbody>
              {manual.translations.map((tr) => (
                <tr key={tr.id} className="border-b border-line">
                  <td className="py-3.5 font-medium">{languageName(tr.language, locale)}<span className="ml-2 text-xs font-normal text-ink-muted">{tr.isSource ? t.manuals.official : t.manuals.community}</span></td>
                  <td className="py-3.5">{tr.revision}{tr.pageCount ? <span className="text-ink-muted"> · {tr.pageCount} {t.manuals.pages}</span> : null}</td>
                  <td className="hidden py-3.5 text-ink-muted sm:table-cell">{tr.credit ?? "—"}</td>
                  <td className="py-3.5 text-right">
                    <Link href={readerHref(manual.slug, tr.language)} className="font-semibold text-tech hover:underline">{t.manuals.read}</Link>
                    <a href={tr.fileUrl} download className="ml-4 text-ink-muted hover:text-navy">PDF{formatBytes(tr.fileSizeBytes) ? ` · ${formatBytes(tr.fileSizeBytes)}` : ""}</a>
                  </td>
                </tr>
              ))}
              {missingUi.map((l) => (
                <tr key={l} className="border-b border-line text-ink-muted">
                  <td className="py-3.5">{languageName(l, locale)}</td><td colSpan={3} className="py-3.5">{t.manuals.unavailable}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
