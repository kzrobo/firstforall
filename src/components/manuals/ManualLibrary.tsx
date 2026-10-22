"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Dictionary } from "@/i18n/dictionary";
import { languageName } from "@/lib/languages";
import { EMPTY_FILTERS, facetValues, filterManuals, type LibraryFilters } from "@/lib/manuals/filters";
import type { Manual } from "@/lib/manuals/types";
import { formatBytes, readerHref } from "./format";

export function ManualLibrary({ manuals, t, locale }: { manuals: Manual[]; t: Dictionary; locale: string }) {
  const [f, setF] = useState<LibraryFilters>(EMPTY_FILTERS);
  const facets = useMemo(() => facetValues(manuals), [manuals]);
  const results = useMemo(() => filterManuals(manuals, f), [manuals, f]);
  const set = (patch: Partial<LibraryFilters>) => setF((prev) => ({ ...prev, ...patch }));
  const select = "h-11 w-full rounded-md border border-line bg-paper px-3 text-[15px]";

  return (
    <div>
      <div className="grid gap-3 border-y border-line py-5 md:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
        <label className="block" id="search">
          <span className="sr-only">{t.manuals.search}</span>
          <input type="search" value={f.q} onChange={(e) => set({ q: e.target.value })} placeholder={t.manuals.search} className={select} />
        </label>
        <label><span className="sr-only">{t.manuals.season}</span>
          <select className={select} value={f.season} onChange={(e) => set({ season: e.target.value })}>
            <option value="">{t.manuals.season}: {t.manuals.all}</option>
            {facets.seasons.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label><span className="sr-only">{t.manuals.language}</span>
          <select className={select} value={f.language} onChange={(e) => set({ language: e.target.value })}>
            <option value="">{t.manuals.language}: {t.manuals.all}</option>
            {facets.languages.map((l) => <option key={l} value={l}>{languageName(l, locale)}</option>)}
          </select>
        </label>
        <label><span className="sr-only">{t.manuals.category}</span>
          <select className={select} value={f.category} onChange={(e) => set({ category: e.target.value })}>
            <option value="">{t.manuals.category}: {t.manuals.all}</option>
            {facets.categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label><span className="sr-only">{t.manuals.sort}</span>
          <select className={select} value={f.sort} onChange={(e) => set({ sort: e.target.value as LibraryFilters["sort"] })}>
            <option value="newest">{t.manuals.sortNewest}</option>
            <option value="title">{t.manuals.sortTitle}</option>
          </select>
        </label>
      </div>

      <p className="sr-only" aria-live="polite">{results.length}</p>
      {results.length === 0 ? (
        <p className="py-16 text-ink-muted">{t.manuals.empty}</p>
      ) : (
        <ul className="divide-y divide-line">
          {results.map((m) => (
            <li key={m.id} className="grid gap-4 py-8 md:grid-cols-[minmax(0,6fr)_minmax(0,6fr)] md:gap-12">
              <div>
                <p className="text-sm text-tech">{m.season}{m.seasonName ? ` · ${m.seasonName}` : ""} · <span className="capitalize">{m.category}</span></p>
                <h2 className="mt-1.5 text-2xl font-semibold tracking-[-0.01em] text-navy">
                  <Link href={`/manuals/${m.slug}`} className="hover:underline">{m.title}</Link>
                </h2>
                {m.description && <p className="mt-3 line-clamp-3 text-ink-muted">{m.description}</p>}
                <p className="mt-3 text-sm text-ink-muted">{t.manuals.revision} {m.revision}</p>
              </div>
              <ul className="self-center text-[15px]" aria-label={t.manuals.translations}>
                {m.translations.map((tr) => (
                  <li key={tr.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-line py-2.5 last:border-0">
                    <span className="font-medium">
                      {languageName(tr.language, locale)}
                      <span className="ml-2 text-xs font-normal text-ink-muted">{tr.isSource ? t.manuals.official : t.manuals.community}</span>
                    </span>
                    <span className="flex gap-4 text-sm">
                      <Link className="font-semibold text-tech hover:underline" href={readerHref(m.slug, tr.language)}>{t.manuals.read}</Link>
                      <a className="text-ink-muted hover:text-navy" href={tr.fileUrl} download>
                        PDF{formatBytes(tr.fileSizeBytes) ? ` · ${formatBytes(tr.fileSizeBytes)}` : ""}
                      </a>
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
