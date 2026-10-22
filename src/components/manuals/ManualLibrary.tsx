"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Dictionary } from "@/i18n/dictionary";
import { languageName } from "@/lib/languages";
import { EMPTY_FILTERS, facetValues, filterManuals, type LibraryFilters } from "@/lib/manuals/filters";
import type { Manual } from "@/lib/manuals/types";
import { DocumentThumb } from "./DocumentThumb";
import { readerHref } from "./format";

type Facet = "season" | "language" | "category";

export function ManualLibrary({ manuals, t, locale, initial }: { manuals: Manual[]; t: Dictionary; locale: string; initial: Partial<LibraryFilters> }) {
  const [f, setF] = useState<LibraryFilters>({ ...EMPTY_FILTERS, ...initial });
  const [filtersOpen, setFiltersOpen] = useState(false);
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

  return (
    <>
      {/* Search band */}
      <div id="search" className="border-b border-line bg-paper">
        <div className="mx-auto max-w-content px-5 pb-8 lg:px-10">
          <label className="flex items-center gap-3 border-b-2 border-navy">
            <svg aria-hidden className="size-5 text-navy" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>
            <span className="sr-only">{t.manuals.search}</span>
            <input
              type="search"
              value={f.q}
              onChange={(e) => set({ q: e.target.value })}
              placeholder={t.landing.searchPlaceholder}
              className="h-14 w-full bg-transparent text-[18px] placeholder:text-ink-faint focus:outline-none"
            />
          </label>
        </div>
      </div>

      <div className="mx-auto grid max-w-content gap-x-14 px-5 py-10 lg:grid-cols-12 lg:px-10 lg:py-14">
        {/* Filters */}
        <aside className="lg:col-span-3" aria-label="Filters">
          <button type="button" onClick={() => setFiltersOpen((v) => !v)} aria-expanded={filtersOpen}
            className="mb-6 flex w-full items-center justify-between border-y border-line py-3 text-[15px] font-medium lg:hidden">
            Filters{active ? ` (${active})` : ""}<span aria-hidden>{filtersOpen ? "−" : "+"}</span>
          </button>
          <div className={`${filtersOpen ? "block" : "hidden"} space-y-9 pb-8 lg:block`}>
            {groups.map((g) => (
              <fieldset key={g.key}>
                <legend className="t-label text-ink-muted">{g.label}</legend>
                <ul className="mt-3 space-y-0.5">
                  {[{ value: "", label: t.manuals.all }, ...g.values].map((v) => {
                    const on = f[g.key] === v.value;
                    return (
                      <li key={v.value || "all"}>
                        <label className={`flex cursor-pointer items-center gap-3 py-1.5 text-[15px] ${on ? "font-semibold text-navy" : "text-ink-muted hover:text-navy"}`}>
                          <input type="radio" name={g.key} checked={on} onChange={() => set({ [g.key]: v.value })} className="sr-only peer" />
                          <span aria-hidden className={`h-4 w-[2px] ${on ? "bg-honey" : "bg-transparent"}`} />
                          <span className="peer-focus-visible:underline">{v.label}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </fieldset>
            ))}
          </div>
        </aside>

        {/* Results */}
        <div className="lg:col-span-9">
          <div className="flex items-baseline justify-between border-b border-line pb-4">
            <p className="text-[14px] text-ink-muted" aria-live="polite"><span className="t-num font-semibold text-ink">{results.length}</span> / {manuals.length}</p>
            <label className="flex items-center gap-2 text-[14px] text-ink-muted">
              {t.manuals.sort}
              <select value={f.sort} onChange={(e) => set({ sort: e.target.value as LibraryFilters["sort"] })} className="bg-transparent font-medium text-ink">
                <option value="newest">{t.manuals.sortNewest}</option>
                <option value="title">{t.manuals.sortTitle}</option>
              </select>
            </label>
          </div>

          {results.length === 0 ? (
            <p className="py-16 text-ink-muted">{t.manuals.empty}</p>
          ) : (
            <ul className="grid grid-cols-2 gap-x-6 gap-y-12 pt-10 sm:grid-cols-3 lg:gap-x-8 xl:grid-cols-4">
              {results.map((m) => (
                <li key={m.id} className="group flex flex-col">
                  <Link href={`/manuals/${m.slug}`} className="block transition-transform duration-200 group-hover:-translate-y-1" tabIndex={-1} aria-hidden>
                    <DocumentThumb manual={m} />
                  </Link>
                  <p className="mt-5 text-[13px] font-medium text-tech t-num">{m.season} · <span className="capitalize">{m.category}</span></p>
                  <h2 className="mt-1 text-[16px] font-semibold leading-snug text-navy">
                    <Link href={`/manuals/${m.slug}`} className="hover:underline">{m.title}</Link>
                  </h2>
                  <p className="mt-1.5 text-[13px] text-ink-muted">{t.manuals.revision} {m.revision}</p>
                  <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[13px]" aria-label={t.manuals.translations}>
                    {m.translations.map((tr) => (
                      <li key={tr.id}>
                        <Link href={readerHref(m.slug, tr.language)} title={`${t.manuals.read}: ${languageName(tr.language, locale)}`}
                          className={`font-semibold uppercase tracking-[0.05em] hover:underline ${f.language === tr.language ? "text-navy underline decoration-honey decoration-2 underline-offset-4" : "text-tech"}`}>
                          {tr.language}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
