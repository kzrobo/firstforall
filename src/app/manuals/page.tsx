import type { Metadata } from "next";
import { ManualLibrary } from "@/components/manuals/ManualLibrary";
import { getI18n } from "@/i18n/server";
import { chooseLibraryLanguage, orderLanguages, publishedLanguages } from "@/lib/manuals/language";
import { listPublishedManuals } from "@/lib/manuals/repository";
import { getSavedManualLanguage } from "@/lib/manuals/saved-language";

export const metadata: Metadata = { title: "Manual library", description: "FTC competition manuals in many languages: choose a language and read the edition directly, each linked to its official English source." };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function ManualsPage({ searchParams }: Props) {
  const [{ t, locale }, sp, result, saved] = await Promise.all([getI18n(), searchParams, listPublishedManuals(), getSavedManualLanguage()]);
  const message = !result.ok ? (result.reason === "not_configured" ? t.manuals.notConfigured : t.reader.error)
    : result.data.length === 0 ? t.manuals.emptyLibrary : null;
  const manuals = result.ok ? result.data : [];
  // Only languages with a published edition are offered; drafts and archived editions never reach this list.
  const languages = orderLanguages(publishedLanguages(manuals), locale);
  const choice = chooseLibraryLanguage(languages, { requested: one(sp.lang) || null, saved, interfaceLocale: locale });

  return (
    <>
      <header className="mx-auto grid max-w-content gap-x-6 gap-y-5 px-5 pb-10 pt-14 lg:grid-cols-12 lg:px-10 lg:pb-14 lg:pt-24">
        <h1 className="t-h1 text-ink lg:col-span-6">{t.manuals.title}</h1>
        <p className="t-lead max-w-xl text-ink-muted lg:col-span-5 lg:col-start-8 lg:pt-2">{t.manuals.intro}</p>
      </header>
      {message ? (
        <div className="mx-auto max-w-content px-5 pb-24 lg:px-10">
          <p className="border-t border-rule pt-6 text-ink-muted">{message}</p>
        </div>
      ) : (
        <ManualLibrary
          key={`${choice.language}-${choice.origin}`}
          manuals={manuals}
          languages={languages}
          choice={choice}
          t={t}
          locale={locale}
          initial={{ q: one(sp.q), season: one(sp.season), category: one(sp.category) }}
        />
      )}
    </>
  );
}
