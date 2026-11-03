"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Dictionary } from "@/i18n/dictionary";
import { plural } from "@/i18n/plural";
import { languageName } from "@/lib/languages";
import { EMPTY_FILTERS, facetValues, filterManuals, type LibraryFilters } from "@/lib/manuals/filters";
import type { Manual } from "@/lib/manuals/types";
import { DocumentThumb } from "./DocumentThumb";
import { readerHref } from "./format";

type Facet = "season" | "language" | "category";

export function ManualLibrary({ manuals, t, locale, initial }: { manuals: Manual[]; t: Dictionary; locale: string; initial: Partial<LibraryFilters> }) {
  const [f, setF] = useState<LibraryFilters>({ ...EMPTY_FILTERS, ...initial });
  const facets = useMemo(() => facetValues(manuals), [manuals]);
  const results = useMemo(() => filterManuals(manuals, f), [manuals, f]);
  const set = (patch: Partial<LibraryFilters>) => setF((prev) => ({ ...prev, ...patch }));

  // Keep the URL shareable without a navigation round-trip.
  useEffect(() => {
    const qs = new URLSearchParams();
    if (f.q) qs.set("q", f.q);
    if (f.language) qs.set("lang", f.language);
    if (f.season) qs.set("season", f.season);
    if (f.category) qs.set("category", f.category);
    window.history.replaceState(window.history.state, "", qs.size ? `/manuals?${qs}` : "/manuals");
  }, [f.q, f.language, f.season, f.category]);

  const groups: { key: Facet; label: string; values: { value: string; label: string }[] }[] = [
    { key: "language", label: t.manuals.language, values: facets.languages.map((v) => ({ value: v, label: languageName(v, locale) })) },
    { key: "season", label: t.manuals.season, values: facets.seasons.map((v) => ({ value: v, label: v })) },
    { key: "category", label: t.manuals.category, values: facets.categories.map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) })) },
  ];
  const active = groups.filter((g) => f[g.key]).length;

  const languageGroup = groups.find((g) => g.key === "language")!;
  const selectGroups = groups.filter((g) => g.key !== "language");
  const select = (on: boolean) =>
    `h-10 w-full appearance-none border-b bg-transparent pr-7 text-[15px] focus:border-rule focus:outline-none ${on ? "border-accent font-medium text-ink" : "border-line-strong text-ink"}`;

  return (
    <div className="mx-auto max-w-content px-5 lg:px-10">
      {/* Search */}
      <label id="search" className="flex scroll-mt-24 items-center gap-4 border-b-2 border-rule">
        <svg aria-hidden className="size-5 shrink-0 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>
        <span className="sr-only">{t.manuals.search}</span>
        <input
          type="search"
          value={f.q}
          onChange={(e) => set({ q: e.target.value })}
          placeholder={t.manuals.searchPlaceholder}
          className="h-16 w-full bg-transparent text-[18px] placeholder:text-ink-faint focus:outline-none lg:text-[20px]"
        />
      </label>

      {/* Filters: language first (it is why people come), then season, category, sort */}
      <div className="grid gap-x-6 gap-y-6 border-b border-line py-6 lg:grid-cols-12 lg:items-end">
        <fieldset className="lg:col-span-6">
          <legend className="t-index mb-2">{languageGroup.label}</legend>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {[{ value: "", label: t.manuals.all }, ...languageGroup.values].map((v) => {
              const on = f.language === v.value;
              return (
                <button key={v.value || "all"} type="button" aria-pressed={on} onClick={() => set({ language: v.value })}
                  className={`h-9 border-b-2 text-[15px] transition-colors ${on ? "border-accent font-medium text-ink" : "border-transparent text-ink-muted hover:text-ink"}`}>
                  {v.label}
                </button>
              );
            })}
          </div>
        </fieldset>
        {selectGroups.map((g) => (
          <label key={g.key} className="relative block lg:col-span-2">
            <span className="t-index">{g.label}</span>
            <select value={f[g.key]} onChange={(e) => set({ [g.key]: e.target.value })} className={`mt-1 ${select(Boolean(f[g.key]))}`}>
              <option value="">{t.manuals.all}</option>
              {g.values.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
            </select>
            <svg aria-hidden className="pointer-events-none absolute bottom-3.5 right-1 size-3 text-ink-muted" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m3 4.5 3 3 3-3" /></svg>
          </label>
        ))}
        <label className="relative block lg:col-span-2">
          <span className="t-index">{t.manuals.sort}</span>
          <select value={f.sort} onChange={(e) => set({ sort: e.target.value as LibraryFilters["sort"] })} className={`mt-1 ${select(false)}`}>
            <option value="newest">{t.manuals.sortNewest}</option>
            <option value="title">{t.manuals.sortTitle}</option>
          </select>
          <svg aria-hidden className="pointer-events-none absolute bottom-3.5 right-1 size-3 text-ink-muted" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m3 4.5 3 3 3-3" /></svg>
        </label>
      </div>

      <div className="flex items-baseline justify-between py-4 text-[14px] text-ink-muted">
        <p aria-live="polite"><span className="t-num font-semibold text-ink">{results.length}</span> / <span className="t-num">{manuals.length}</span> {plural(locale, manuals.length, { one: t.manuals.document, few: t.manuals.documentsFew, many: t.manuals.documents })}</p>
        {(active > 0 || f.q) && (
          <button type="button" onClick={() => set({ q: "", season: "", language: "", category: "" })} className="link-rule text-ink">{t.manuals.clear}</button>
        )}
      </div>

      {results.length === 0 ? (
        <p className="border-t border-line py-16 text-ink-muted">{t.manuals.empty}</p>
      ) : results.length <= 3 ? (
        /* Few documents: a publication index — one full row per manual, cover beside its details */
        <ul className="border-t border-rule pb-24 lg:pb-32">
          {results.map((m) => (
            <li key={m.id} className="grid gap-x-6 gap-y-6 border-b border-line py-8 sm:grid-cols-[160px_1fr] lg:grid-cols-12 lg:py-10">
              <Link href={`/manuals/${m.slug}`} tabIndex={-1} aria-hidden className="img-zoom block w-[132px] overflow-hidden sm:w-auto lg:col-span-2">
                <DocumentThumb manual={m} />
              </Link>
              <div className="lg:col-span-5 lg:col-start-4">
                <p className="t-index">{m.season}{m.seasonName ? ` · ${m.seasonName}` : ""} · <span className="capitalize">{m.category}</span></p>
                <h2 className="t-h2 mt-2 text-ink"><Link href={`/manuals/${m.slug}`} className="hover:underline hover:decoration-1 hover:underline-offset-4">{m.title}</Link></h2>
                {m.description && <p className="mt-3 max-w-lg text-[15px] text-ink-muted">{m.description}</p>}
                <p className="mt-3 text-[13px] text-ink-faint">{t.manuals.revision} {m.revision}</p>
              </div>
              <ul className="self-start border-t border-line sm:col-start-2 lg:col-span-4 lg:col-start-9" aria-label={t.manuals.translations}>
                {m.translations.map((tr) => (
                  <li key={tr.id} className="flex items-baseline justify-between gap-4 border-b border-line py-3">
                    <Link href={readerHref(m.slug, tr.language)} className={`text-[15px] font-medium hover:underline hover:underline-offset-4 ${f.language === tr.language ? "text-accent" : "text-ink"}`}>
                      {languageName(tr.language, locale)}
                    </Link>
                    <span className="flex gap-4 text-[13px]">
                      <Link href={readerHref(m.slug, tr.language)} className="text-tech hover:underline">{t.manuals.read}</Link>
                      <a href={tr.fileUrl} download className="text-ink-faint hover:text-ink">PDF</a>
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="divide-y divide-line border-t border-line pb-24 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-16 sm:divide-y-0 sm:border-0 sm:pt-6 lg:grid-cols-3 lg:pb-32 xl:grid-cols-4">
          {results.map((m) => (
            <li key={m.id} className="group grid grid-cols-[96px_1fr] gap-x-5 py-6 sm:block sm:py-0">
              <Link href={`/manuals/${m.slug}`} tabIndex={-1} aria-hidden
                className="img-zoom block self-start overflow-hidden shadow-[0_1px_2px_rgba(0,16,43,0.08)] transition-shadow duration-300 sm:group-hover:shadow-[0_28px_50px_-30px_rgba(0,16,43,0.45)]">
                <DocumentThumb manual={m} />
              </Link>
              <div className="sm:mt-5">
                <p className="t-index">{m.season}{m.seasonName ? ` · ${m.seasonName}` : ""}</p>
                <h2 className="mt-1.5 text-[17px] font-medium leading-snug tracking-[-0.01em] text-ink sm:text-[18px]">
                  <Link href={`/manuals/${m.slug}`} className="decoration-1 underline-offset-4 group-hover:underline">{m.title}</Link>
                </h2>
                <p className="mt-1.5 text-[13px] text-ink-muted"><span className="capitalize">{m.category}</span> · {t.manuals.revision} {m.revision}</p>
                <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-3 text-[14px]" aria-label={t.manuals.translations}>
                  {m.translations.map((tr) => (
                    <li key={tr.id}>
                      <Link href={readerHref(m.slug, tr.language)} title={t.manuals.read}
                        className={`link-rule ${f.language === tr.language ? "font-medium text-ink decoration-accent decoration-2" : "text-tech decoration-line-strong"}`}>
                        {languageName(tr.language, locale)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
