/** Display names for document languages (BCP 47). Unknown tags fall back to Intl.DisplayNames. */
const KNOWN: Record<string, { english: string; native: string }> = {
  en: { english: "English", native: "English" },
  kk: { english: "Kazakh", native: "Қазақша" },
  ru: { english: "Russian", native: "Русский" },
  es: { english: "Spanish", native: "Español" },
};

/**
 * Names of the core languages in each interface language. Fixed here (not Intl) because
 * Node and browsers ship different CLDR data, which caused hydration mismatches in kk.
 */
const NAMES: Record<string, Record<string, string>> = {
  en: { en: "English", kk: "Kazakh", ru: "Russian", es: "Spanish" },
  kk: { en: "Ағылшын", kk: "Қазақша", ru: "Орыс", es: "Испан" },
  ru: { en: "Английский", kk: "Казахский", ru: "Русский", es: "Испанский" },
  es: { en: "Inglés", kk: "Kazajo", ru: "Ruso", es: "Español" },
};

const BCP47 = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/;

export function isLanguageTag(tag: string): boolean {
  return BCP47.test(tag);
}

export function languageName(tag: string, displayLocale = "en"): string {
  const fixed = NAMES[displayLocale]?.[tag];
  if (fixed) return fixed;
  const base = KNOWN[tag];
  if (base && displayLocale === tag) return base.native;
  try {
    const name = new Intl.DisplayNames([displayLocale], { type: "language" }).of(tag);
    if (name && name !== tag) return name.charAt(0).toLocaleUpperCase(displayLocale) + name.slice(1);
  } catch {
    // fall through
  }
  return base?.english ?? tag;
}

export function nativeLanguageName(tag: string): string {
  return KNOWN[tag]?.native ?? languageName(tag, tag);
}
