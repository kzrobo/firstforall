import { describe, expect, it } from "vitest";
import { UI_LOCALES, negotiateLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionary";
import en from "@/i18n/dictionaries/en";

function keys(obj: object, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) => (v && typeof v === "object" ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]));
}

describe("i18n", () => {
  it("negotiates from Accept-Language", () => {
    expect(negotiateLocale("kk-KZ,ru;q=0.8")).toBe("kk");
    expect(negotiateLocale("fr-FR,es;q=0.5")).toBe("es");
    expect(negotiateLocale(undefined)).toBe("en");
  });
  it("every locale resolves every English key (fallback works)", () => {
    for (const l of UI_LOCALES) expect(keys(getDictionary(l))).toEqual(keys(en));
  });
  it("non-English locales actually translate the hero and navigation", () => {
    for (const l of ["kk", "ru", "es"] as const) {
      expect(getDictionary(l).nav.manuals).not.toBe(en.nav.manuals);
      expect(getDictionary(l).hero.subtitle).not.toBe(en.hero.subtitle);
    }
  });
});
