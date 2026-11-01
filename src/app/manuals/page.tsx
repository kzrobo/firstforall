import type { Metadata } from "next";
import { ManualLibrary } from "@/components/manuals/ManualLibrary";
import { getI18n } from "@/i18n/server";
import { listPublishedManuals } from "@/lib/manuals/repository";

export const metadata: Metadata = { title: "Manual library", description: "FTC competition manuals in English, Kazakh, Russian and Spanish, each linked to its official English source." };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function ManualsPage({ searchParams }: Props) {
  const [{ t, locale }, sp, result] = await Promise.all([getI18n(), searchParams, listPublishedManuals()]);
  const message = !result.ok ? (result.reason === "not_configured" ? t.manuals.notConfigured : t.reader.error)
    : result.data.length === 0 ? t.manuals.emptyLibrary : null;

  return (
    <>
      <header className="mx-auto max-w-content px-5 pb-10 pt-12 lg:px-10 lg:pb-14 lg:pt-20">
        <div className="grid gap-x-6 gap-y-6 lg:grid-cols-12">
          <p className="t-index lg:col-span-3">{t.home.libraryIndex}</p>
          <h1 className="t-display text-navy lg:col-span-5">{t.manuals.title}</h1>
          <p className="t-lead max-w-md self-end text-ink-muted lg:col-span-4">{t.manuals.intro}</p>
        </div>
      </header>
      {message ? (
        <div className="mx-auto max-w-content px-5 pb-24 lg:px-10">
          <p className="border-t border-navy pt-6 text-ink-muted">{message}</p>
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
