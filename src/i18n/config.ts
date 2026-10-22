export const UI_LOCALES = ["en", "kk", "ru", "es"] as const;
export type UiLocale = (typeof UI_LOCALES)[number];
export const DEFAULT_LOCALE: UiLocale = "en";
export const LOCALE_COOKIE = "ffa_locale";

export const LOCALE_LABELS: Record<UiLocale, string> = {
  en: "English",
  kk: "Қазақша",
  ru: "Русский",
  es: "Español",
};

export function isUiLocale(value: unknown): value is UiLocale {
  return typeof value === "string" && (UI_LOCALES as readonly string[]).includes(value);
}

/** Picks the best UI locale from an Accept-Language header. */
export function negotiateLocale(acceptLanguage: string | null | undefined): UiLocale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const ranked = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: tag.toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { tag } of ranked) {
    const base = tag.split("-")[0];
    if (isUiLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}
