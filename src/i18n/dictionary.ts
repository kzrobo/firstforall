import en, { type Dictionary } from "./dictionaries/en";
import es from "./dictionaries/es";
import kk from "./dictionaries/kk";
import ru from "./dictionaries/ru";
import type { UiLocale } from "./config";
import type { DeepPartial } from "./types";

const partials: Record<UiLocale, DeepPartial<Dictionary>> = { en, kk, ru, es };

/** Deep-merges a partial dictionary over English so missing strings fall back safely. */
export function mergeDictionary<T extends object>(base: T, override: DeepPartial<T> | undefined): T {
  if (!override) return base;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(override)) {
    const baseValue = (base as Record<string, unknown>)[key];
    if (value && typeof value === "object" && baseValue && typeof baseValue === "object") {
      out[key] = mergeDictionary(baseValue as object, value as DeepPartial<object>);
    } else if (value !== undefined) {
      out[key] = value;
    }
  }
  return out as T;
}

const cache = new Map<UiLocale, Dictionary>();

export function getDictionary(locale: UiLocale): Dictionary {
  let dict = cache.get(locale);
  if (!dict) {
    dict = mergeDictionary(en, partials[locale]);
    cache.set(locale, dict);
  }
  return dict;
}

export type { Dictionary };
