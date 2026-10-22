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

      <div className="mx-auto max-w-content px-5 py-8 lg:px-10 lg:py-10">
        {/* Filters — one quiet row, so results get the full width */}
        <div className="flex flex-wrap items-end gap-x-8 gap-y-4 border-b border-line pb-5">
          {groups.map((g) => (
            <label key={g.key} className="flex min-w-[9.5rem] flex-1 flex-col sm:flex-none">
              <span className="t-label text-ink-muted">{g.label}</span>
              <select
                value={f[g.key]}
                onChange={(e) => set({ [g.key]: e.target.value })}
                className={`mt-1.5 h-10 border-b bg-transparent pr-6 text-[15px] focus:outline-none ${f[g.key] ? "border-honey font-semibold text-navy" : "border-line-strong text-ink"}`}
              >
                <option value="">{t.manuals.all}</option>
                {g.values.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
              </select>
            </label>
          ))}
          {active > 0 && (
            <button type="button" onClick={() => set({ season: "", language: "", category: "" })} className="h-10 text-[14px] text-tech hover:underline">
              × {t.manuals.all}
            </button>
          )}
          <div className="ml-auto flex items-center gap-6">
            <p className="text-[14px] text-ink-muted" aria-live="polite"><span className="t-num font-semibold text-ink">{results.length}</span> / {manuals.length}</p>
            <label className="flex items-center gap-2 text-[14px] text-ink-muted">
              {t.manuals.sort}
              <select value={f.sort} onChange={(e) => set({ sort: e.target.value as LibraryFilters["sort"] })} className="bg-transparent font-medium text-ink">
                <option value="newest">{t.manuals.sortNewest}</option>
                <option value="title">{t.manuals.sortTitle}</option>
              </select>
            </label>
          </div>
        </div>

        {results.length === 0 ? (
          <p className="py-16 text-ink-muted">{t.manuals.empty}</p>
        ) : (
          <ul className="divide-y divide-line sm:grid sm:grid-cols-2 sm:gap-x-10 sm:gap-y-16 sm:divide-y-0 sm:pt-12 lg:grid-cols-3 lg:gap-x-14">
            {results.map((m) => (
              <li key={m.id} className="group grid grid-cols-[104px_1fr] gap-x-5 py-7 sm:block sm:py-0">
                <Link href={`/manuals/${m.slug}`} tabIndex={-1} aria-hidden
                  className="block self-start shadow-[0_1px_2px_rgba(14,22,32,0.06)] transition-[transform,box-shadow] duration-200 sm:group-hover:-translate-y-1 sm:group-hover:shadow-[0_30px_50px_-30px_rgba(14,22,32,0.4)]">
                  <DocumentThumb manual={m} />
                </Link>
                <div className="sm:mt-6">
                  <p className="text-[13px] font-medium text-tech t-num">{m.season}{m.seasonName ? ` · ${m.seasonName}` : ""}</p>
                  <h2 className="mt-1.5 text-[18px] font-semibold leading-snug tracking-[-0.01em] text-navy sm:text-[20px]">
                    <Link href={`/manuals/${m.slug}`} className="hover:underline">{m.title}</Link>
                  </h2>
                  <p className="mt-2 text-[13px] text-ink-muted"><span className="capitalize">{m.category}</span> · {t.manuals.revision} {m.revision}</p>
                  <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-line pt-3 text-[14px]" aria-label={t.manuals.translations}>
                    {m.translations.map((tr) => (
                      <li key={tr.id}>
                        <Link href={readerHref(m.slug, tr.language)} title={t.manuals.read}
                          className={`font-medium hover:underline ${f.language === tr.language ? "text-navy underline decoration-honey decoration-2 underline-offset-4" : "text-tech"}`}>
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
    </>
  );
}
