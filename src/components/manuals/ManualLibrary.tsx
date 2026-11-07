"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Dictionary } from "@/i18n/dictionary";
import { languageName, nativeLanguageName } from "@/lib/languages";
import { EMPTY_FILTERS, facetValues, filterManuals, type LibraryFilters } from "@/lib/manuals/filters";
import { editionFor, groupByLanguage, matchLanguage, type LanguageChoice } from "@/lib/manuals/language";
import type { Manual, ManualTranslation } from "@/lib/manuals/types";
import { DocumentThumb } from "./DocumentThumb";
import { formatBytes, readerHref } from "./format";
import { rememberManualLanguage } from "./remember-language";

type Origin = LanguageChoice["origin"] | "chosen";
type Props = {
  manuals: Manual[];
  /** Languages with published editions, already in display order. */
  languages: string[];
  choice: LanguageChoice;
  t: Dictionary;
  locale: string;
  initial: Partial<LibraryFilters>;
};

const fill = (s: string, vars: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? "");

/**
 * Language-first manual library: the visitor picks a document language first; every manual below then shows
 * its edition in that language (cover = that PDF's first page) with a direct "Read manual" link.
 */
export function ManualLibrary({ manuals, languages, choice, t, locale, initial }: Props) {
  // Back/forward can restore this page from the router cache with the props of its first render,
  // so the language in the URL wins over the server's choice.
  const fromUrl = matchLanguage(useSearchParams().get("lang"), languages);
  const [language, setLanguage] = useState(fromUrl ?? choice.language);
  const [origin, setOrigin] = useState<Origin>(fromUrl && fromUrl !== choice.language ? "url" : choice.origin);
  const [f, setF] = useState<LibraryFilters>({ ...EMPTY_FILTERS, ...initial, language: "" });
  const set = (patch: Partial<LibraryFilters>) => setF((prev) => ({ ...prev, ...patch }));
  const facets = useMemo(() => facetValues(manuals), [manuals]);
  const results = useMemo(() => filterManuals(manuals, f), [manuals, f]);
  const { matching, other } = useMemo(() => groupByLanguage(results, language), [results, language]);
  const t2 = t.manuals;

  const choose = (l: string) => {
    setLanguage(l);
    setOrigin("chosen");
    rememberManualLanguage(l);
  };

  // Keep the URL shareable (?lang= once the visitor has chosen) without adding history entries.
  useEffect(() => {
    const qs = new URLSearchParams();
    if (language && (origin === "chosen" || origin === "url")) qs.set("lang", language);
    if (f.q) qs.set("q", f.q);
    if (f.season) qs.set("season", f.season);
    if (f.category) qs.set("category", f.category);
    const next = qs.size ? `/manuals?${qs}` : "/manuals";
    if (next !== window.location.pathname + window.location.search) window.history.replaceState(null, "", next);
  }, [language, origin, f.q, f.season, f.category]);

  const name = (l: string) => languageName(l, locale);
  const status =
    choice.missing && origin === "fallback" ? null
      : origin === "interface" ? t2.matchedInterface
        : origin === "saved" ? t2.savedChoice : null;

  return (
    <div className="mx-auto max-w-content px-5 pb-24 lg:px-10 lg:pb-32">
      {/* 1 · Language first */}
      <section aria-labelledby="lang-title" className="border-t border-rule pt-8 lg:pt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h2 id="lang-title" className="t-h3 text-ink">{t2.chooseLanguage}</h2>
          <p className="t-meta">{fill(t2.languagesAvailable, { n: String(languages.length) })}</p>
        </div>
        <p className="mt-1.5 max-w-xl text-[15px] text-ink-muted">{t2.chooseLanguageHint}</p>
        <fieldset className="mt-6">
          <legend className="sr-only">{t2.chooseLanguage}</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {languages.map((l) => {
              const on = l === language;
              const native = nativeLanguageName(l), local = name(l);
              return (
                <label key={l}
                  className={`relative flex min-h-[62px] cursor-pointer flex-col justify-center rounded-md border px-4 py-2 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-navy lg:min-h-[68px] ${on ? "border-navy bg-navy text-white" : "border-line bg-canvas text-ink hover:border-ink"}`}>
                  <input type="radio" name="manual-language" value={l} checked={on} onChange={() => choose(l)} className="sr-only" />
                  <span lang={l} className="text-[16px] font-semibold leading-tight lg:text-[17px]">{native}</span>
                  {local !== native && <span className={`mt-0.5 text-[13px] leading-tight ${on ? "text-white/80" : "text-ink-muted"}`}>{local}</span>}
                  {on && (
                    <svg aria-hidden viewBox="0 0 16 16" className="absolute right-3 top-3 size-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3.5 8.5 3 3 6-7" /></svg>
                  )}
                </label>
              );
            })}
          </div>
        </fieldset>
        <div aria-live="polite" className="mt-4 min-h-[1.5rem]">
          {choice.missing && origin === "fallback" && language ? (
            <p className="inline-block rounded-md bg-accent-pale px-4 py-2.5 text-[15px] text-ink">
              {fill(t2.notInLanguage, { language: name(choice.missing), fallback: name(language) })}
            </p>
          ) : status ? <p className="t-meta">{status}</p> : null}
        </div>
      </section>

      {/* 2 · Search and filters, only once there is more than one manual to choose from */}
      {manuals.length > 1 && (
        <Filters f={f} set={set} facets={facets} t={t} />
      )}

      {/* 3 · Editions in the chosen language */}
      {results.length === 0 ? (
        <p className="mt-10 border-t border-line py-16 text-ink-muted">{t2.empty}</p>
      ) : (
        <>
          {matching.length > 0 && (matching.length <= 3 ? (
            <div className="mt-10 space-y-12 lg:mt-14">
              {matching.map((m) => <Edition key={m.id} manual={m} edition={editionFor(m, language).edition!} t={t} locale={locale} />)}
            </div>
          ) : (
            <Compact manuals={matching} language={language} t={t} locale={locale} />
          ))}
          {other.length > 0 && language && (
            <section aria-labelledby="other-title" className="mt-14">
              <h2 id="other-title" className="t-h3 border-t border-rule pt-6 text-ink">{fill(t2.notYetIn, { language: name(language) })}</h2>
              <Compact manuals={other} language={language} t={t} locale={locale} />
            </section>
          )}
        </>
      )}
    </div>
  );
}

/** One manual in the chosen language: cover, title, edition facts and the reading action, as one block. */
function Edition({ manual: m, edition: e, t, locale }: { manual: Manual; edition: ManualTranslation; t: Dictionary; locale: string }) {
  const t2 = t.manuals;
  const source = m.translations.find((x) => x.isSource && x.id !== e.id);
  const size = formatBytes(e.fileSizeBytes);
  const href = readerHref(m.slug, e.language);
  return (
    <article aria-labelledby={`ed-${m.id}`}
      className="grid grid-cols-[104px_1fr] gap-x-5 gap-y-7 border-t border-line pt-8 first:border-t-0 first:pt-0 sm:grid-cols-[208px_1fr] sm:gap-x-10 lg:grid-cols-12 lg:gap-x-6">
      <Link href={href} tabIndex={-1} aria-hidden className="img-zoom block self-start overflow-hidden rounded-[3px] shadow-[0_1px_2px_rgba(0,0,0,0.06)] sm:row-span-2 lg:col-span-3">
        <DocumentThumb manual={m} edition={e} />
      </Link>
      <div className="self-center sm:self-end lg:col-span-8 lg:col-start-5">
        <p className="t-index">{m.season}{m.seasonName ? ` · ${m.seasonName}` : ""} · <span className="capitalize">{m.category}</span></p>
        <h3 id={`ed-${m.id}`} className="t-h2 mt-2 text-ink">{m.title}</h3>
        <p className="mt-3 text-[18px] font-semibold leading-snug text-ink sm:text-[20px]">
          <span lang={e.language}>{nativeLanguageName(e.language)}</span>
          <span className="font-normal text-ink-muted"> · {e.isSource ? t2.official : t2.community}</span>
        </p>
      </div>
      <div className="col-span-2 sm:col-span-1 sm:col-start-2 lg:col-span-8 lg:col-start-5">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-t border-line pt-5 text-[15px] sm:grid-cols-4">
          <Fact label={t2.language} value={languageName(e.language, locale)} />
          <Fact label={t2.season} value={m.seasonName ? `${m.season} · ${m.seasonName}` : m.season} />
          <Fact label={t2.revision} value={e.revision} />
          {e.pageCount ? <Fact label={t2.pageCount} value={String(e.pageCount)} /> : null}
        </dl>
        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
          <Link href={href} className="btn-primary">{t2.readManual}</Link>
          <a href={e.fileUrl} download className="link-arrow text-[15px] text-ink">{t2.download}{size ? <span className="t-num font-normal text-ink-muted">{size}</span> : null}</a>
          {source && <Link href={readerHref(m.slug, source.language)} className="link-rule text-[15px] text-ink-muted hover:text-ink">{t2.compareOriginal} ({languageName(source.language, locale)})</Link>}
        </div>
        {e.credit && <p className="mt-6 text-[14px] text-ink-muted">{t2.translatedBy}: {e.credit}</p>}
      </div>
    </article>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[14px] text-ink-muted">{label}</dt>
      <dd className="t-num mt-1 font-semibold text-ink">{value}</dd>
    </div>
  );
}

/** Many manuals: a compact index, each with its edition in the chosen language (or English for now). */
function Compact({ manuals, language, t, locale }: { manuals: Manual[]; language: string | null; t: Dictionary; locale: string }) {
  return (
    <ul className="mt-6 divide-y divide-line border-t border-line sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-14 sm:divide-y-0 sm:border-0 lg:grid-cols-3 xl:grid-cols-4">
      {manuals.map((m) => {
        const { edition: e, fallback } = editionFor(m, language);
        if (!e) return null;
        const href = readerHref(m.slug, e.language);
        return (
          <li key={m.id} className="group grid grid-cols-[96px_1fr] gap-x-5 py-6 sm:block sm:py-0">
            <Link href={href} tabIndex={-1} aria-hidden className="img-zoom block self-start overflow-hidden rounded-[3px] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
              <DocumentThumb manual={m} edition={e} />
            </Link>
            <div className="sm:mt-5">
              <p className="t-index">{m.season}{m.seasonName ? ` · ${m.seasonName}` : ""}</p>
              <h3 className="mt-1.5 text-[17px] font-semibold leading-snug tracking-[-0.01em] text-ink sm:text-[18px]">{m.title}</h3>
              <p className="mt-1.5 text-[14px] text-ink-muted">{languageName(e.language, locale)}{fallback ? "" : ` · ${e.isSource ? t.manuals.official : t.manuals.community}`} · {t.manuals.revision} {e.revision}</p>
              <Link href={href} className="link-arrow mt-3 text-[15px] text-ink">{t.manuals.readManual}</Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Filters({ f, set, facets, t }: { f: LibraryFilters; set: (p: Partial<LibraryFilters>) => void; facets: ReturnType<typeof facetValues>; t: Dictionary }) {
  const t2 = t.manuals;
  const select = (on: boolean) =>
    `mt-1 h-10 w-full appearance-none border-b bg-transparent pr-7 text-[15px] focus:border-rule focus:outline-none ${on ? "border-accent font-medium text-ink" : "border-line-strong text-ink"}`;
  const chevron = <svg aria-hidden className="pointer-events-none absolute bottom-3.5 right-1 size-3 text-ink-muted" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m3 4.5 3 3 3-3" /></svg>;
  const groups = [
    { key: "season" as const, label: t2.season, values: facets.seasons.map((v) => ({ value: v, label: v })) },
    { key: "category" as const, label: t2.category, values: facets.categories.map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) })) },
  ];
  return (
    <div id="search" className="mt-10 grid scroll-mt-24 gap-x-6 gap-y-5 border-t border-line pt-6 lg:grid-cols-12 lg:items-end">
      <label className="flex items-center gap-3 border-b border-line-strong focus-within:border-ink lg:col-span-6">
        <svg aria-hidden className="size-5 shrink-0 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>
        <span className="sr-only">{t2.search}</span>
        <input type="search" value={f.q} onChange={(e) => set({ q: e.target.value })} placeholder={t2.searchPlaceholder}
          className="h-11 w-full bg-transparent text-[16px] placeholder:text-ink-faint focus:outline-none" />
      </label>
      {groups.map((g) => (
        <label key={g.key} className="relative block lg:col-span-2">
          <span className="t-index">{g.label}</span>
          <select value={f[g.key]} onChange={(e) => set({ [g.key]: e.target.value })} className={select(Boolean(f[g.key]))}>
            <option value="">{t2.all}</option>
            {g.values.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
          </select>
          {chevron}
        </label>
      ))}
      <label className="relative block lg:col-span-2">
        <span className="t-index">{t2.sort}</span>
        <select value={f.sort} onChange={(e) => set({ sort: e.target.value as LibraryFilters["sort"] })} className={select(false)}>
          <option value="newest">{t2.sortNewest}</option>
          <option value="title">{t2.sortTitle}</option>
        </select>
        {chevron}
      </label>
    </div>
  );
}
