/** Display names for document languages (BCP 47). Unknown tags fall back to Intl.DisplayNames. */
const KNOWN: Record<string, { english: string; native: string }> = {
  en: { english: "English", native: "English" },
  kk: { english: "Kazakh", native: "Қазақша" },
  ru: { english: "Russian", native: "Русский" },
  es: { english: "Spanish", native: "Español" },
  // Community translation languages of the BIOBUZZ TU07 manual
  id: { english: "Indonesian", native: "Bahasa Indonesia" },
  "zh-Hans": { english: "Chinese (Simplified)", native: "简体中文" },
  ja: { english: "Japanese", native: "日本語" },
  ko: { english: "Korean", native: "한국어" },
  pt: { english: "Portuguese", native: "Português" },
  tr: { english: "Turkish", native: "Türkçe" },
  uk: { english: "Ukrainian", native: "Українська" },
  uz: { english: "Uzbek", native: "Oʻzbekcha" },
};

/**
 * Names of the core languages in each interface language. Fixed here (not Intl) because
 * Node and browsers ship different CLDR data, which caused hydration mismatches in kk.
 */
const NAMES: Record<string, Record<string, string>> = {
  en: { en: "English", kk: "Kazakh", ru: "Russian", es: "Spanish",
    id: "Indonesian", "zh-Hans": "Chinese (Simplified)", ja: "Japanese", ko: "Korean", pt: "Portuguese", tr: "Turkish", uk: "Ukrainian", uz: "Uzbek" },
  kk: { en: "Ағылшын", kk: "Қазақша", ru: "Орыс", es: "Испан",
    id: "Индонезия", "zh-Hans": "Қытай (жеңілдетілген)", ja: "Жапон", ko: "Корей", pt: "Португал", tr: "Түрік", uk: "Украин", uz: "Өзбек" },
  ru: { en: "Английский", kk: "Казахский", ru: "Русский", es: "Испанский",
    id: "Индонезийский", "zh-Hans": "Китайский (упрощённый)", ja: "Японский", ko: "Корейский", pt: "Португальский", tr: "Турецкий", uk: "Украинский", uz: "Узбекский" },
  es: { en: "Inglés", kk: "Kazajo", ru: "Ruso", es: "Español",
    id: "Indonesio", "zh-Hans": "Chino (simplificado)", ja: "Japonés", ko: "Coreano", pt: "Portugués", tr: "Turco", uk: "Ucraniano", uz: "Uzbeko" },
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
