import type { Metadata } from "next";
import { ManualLibrary } from "@/components/manuals/ManualLibrary";
import { getI18n } from "@/i18n/server";
import { listPublishedManuals } from "@/lib/manuals/repository";

export const metadata: Metadata = { title: "Manual library" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function ManualsPage({ searchParams }: Props) {
  const [{ t, locale }, sp, result] = await Promise.all([getI18n(), searchParams, listPublishedManuals()]);
  const message = !result.ok ? (result.reason === "not_configured" ? t.manuals.notConfigured : t.reader.error)
    : result.data.length === 0 ? t.manuals.emptyLibrary : null;

  return (
    <>
      <header className="bg-paper">
        <div className="mx-auto grid max-w-content gap-x-16 gap-y-5 px-5 pb-10 pt-14 lg:grid-cols-12 lg:px-10 lg:pt-20">
          <div className="lg:col-span-7">
            <p className="t-label text-ink-muted">{t.nav.manuals}</p>
            <h1 className="t-h1 mt-4 text-navy">{t.manuals.title}</h1>
          </div>
          <p className="self-end text-ink-muted lg:col-span-5">{t.manuals.intro}</p>
        </div>
      </header>
      {message ? (
        <div className="border-t border-line">
          <p className="mx-auto max-w-content px-5 py-16 text-ink-muted lg:px-10">{message}</p>
        </div>
      ) : (
        <ManualLibrary
          manuals={result.ok ? result.data : []}
          t={t}
          locale={locale}
          initial={{ q: one(sp.q), language: one(sp.lang), season: one(sp.season), category: one(sp.category) }}
        />
      )}
    </>
  );
}
