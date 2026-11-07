import { languageName } from "@/lib/languages";
import type { Manual, ManualTranslation } from "./types";

/**
 * Language-first library: which document language a visitor sees, and which edition of each manual
 * that means. Pure — the pages pass in the URL, this visit's saved choice and the interface language.
 */

/** Session cookie (no expiry) holding the PDF language a visitor picked during this visit. */
export const MANUAL_LANGUAGE_COOKIE = "ffa_manual_lang";

/** How the shown language was chosen. */
export type LanguageOrigin = "url" | "saved" | "interface" | "fallback";

export interface LanguageChoice {
  /** Language to show, or null when nothing is published. */
  language: string | null;
  origin: LanguageOrigin;
  /** The language that was wanted but has no published edition (the visitor is told). */
  missing: string | null;
}

/** BCP 47-shaped tag, any letter case (URLs and cookies may arrive as "zh-hans"). */
const TAG = /^[a-z]{2,3}(-[a-z0-9]{2,8})*$/i;
const lower = (s: string) => s.toLowerCase();
const base = (s: string) => lower(s).split("-")[0];

/** Finds `tag` among `available`: exact match (case-insensitive) first, then the same primary language. */
export function matchLanguage(tag: string | null | undefined, available: readonly string[]): string | null {
  if (!tag || !TAG.test(tag)) return null;
  return available.find((a) => lower(a) === lower(tag)) ?? available.find((a) => base(a) === base(tag)) ?? null;
}

/** Every language with at least one published edition, in `manuals`. */
export function publishedLanguages(manuals: readonly Manual[]): string[] {
  return [...new Set(manuals.flatMap((m) => m.translations.map((t) => t.language)))];
}

/** Display order: English (the official source language) first, then by name in the interface language. */
export function orderLanguages(languages: readonly string[], locale: string): string[] {
  const name = (l: string) => languageName(l, locale);
  return [...languages].sort((a, b) => Number(base(b) === "en") - Number(base(a) === "en") || name(a).localeCompare(name(b), locale));
}

/** English if it is available, otherwise the first available language. */
export function fallbackLanguage(available: readonly string[]): string | null {
  return matchLanguage("en", available) ?? available[0] ?? null;
}

/**
 * Picks the library language. Priority: the URL (?lang=, shareable) → the choice saved during this visit
 * → the website's interface language → English. A requested or interface language without a published
 * edition is reported in `missing` so the page can say that it fell back.
 */
export function chooseLibraryLanguage(
  available: readonly string[],
  input: { requested?: string | null; saved?: string | null; interfaceLocale: string },
): LanguageChoice {
  const fallback = fallbackLanguage(available);
  if (input.requested) {
    const hit = matchLanguage(input.requested, available);
    if (hit) return { language: hit, origin: "url", missing: null };
    return { language: fallback, origin: "fallback", missing: TAG.test(input.requested) ? input.requested : null };
  }
  const saved = matchLanguage(input.saved, available);
  if (saved) return { language: saved, origin: "saved", missing: null };
  const ui = matchLanguage(input.interfaceLocale, available);
  if (ui) return { language: ui, origin: "interface", missing: null };
  return { language: fallback, origin: "fallback", missing: input.interfaceLocale };
}

/** The edition of `manual` in `language`, or its English/source edition marked as a fallback. */
export function editionFor(manual: Manual, language: string | null): { edition: ManualTranslation | null; fallback: boolean } {
  const langs = manual.translations.map((t) => t.language);
  const hit = matchLanguage(language, langs);
  if (hit) return { edition: manual.translations.find((t) => t.language === hit)!, fallback: false };
  const fb = matchLanguage("en", langs);
  const edition = manual.translations.find((t) => t.language === fb) ?? manual.translations.find((t) => t.isSource) ?? manual.translations[0] ?? null;
  return { edition, fallback: edition !== null };
}

/** Splits manuals into those published in `language` and those shown in English for now. */
export function groupByLanguage(manuals: readonly Manual[], language: string | null): { matching: Manual[]; other: Manual[] } {
  const matching: Manual[] = [], other: Manual[] = [];
  for (const m of manuals) (editionFor(m, language).fallback ? other : matching).push(m);
  return { matching, other };
}
