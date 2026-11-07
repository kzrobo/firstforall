import { describe, expect, it } from "vitest";
import { chooseLibraryLanguage, editionFor, fallbackLanguage, groupByLanguage, matchLanguage, orderLanguages, publishedLanguages } from "@/lib/manuals/language";
import { resolveReaderTarget } from "@/lib/manuals/reader-nav";
import { manual, translation } from "./fixtures";

const TWELVE = ["en", "es", "id", "ja", "kk", "ko", "pt", "ru", "tr", "uk", "uz", "zh-Hans"];
const biobuzz = manual({ slug: "biobuzz", season: "2026-2027", translations: TWELVE.map((l) => translation({ language: l, isSource: l === "en" })) });
const older = manual({ slug: "older", season: "2025-2026", translations: [translation({ language: "en", isSource: true }), translation({ language: "kk" })] });

describe("matchLanguage", () => {
  it("matches exactly, case-insensitively, then by primary language", () => {
    expect(matchLanguage("zh-hans", TWELVE)).toBe("zh-Hans");
    expect(matchLanguage("zh", TWELVE)).toBe("zh-Hans");
    expect(matchLanguage("pt-BR", TWELVE)).toBe("pt");
    expect(matchLanguage("fr", TWELVE)).toBeNull();
  });
  it("rejects anything that is not a language tag", () => {
    expect(matchLanguage("../etc", TWELVE)).toBeNull();
    expect(matchLanguage("", TWELVE)).toBeNull();
    expect(matchLanguage(null, TWELVE)).toBeNull();
  });
});

describe("library language", () => {
  it("lists only languages that have published editions", () => {
    expect(publishedLanguages([biobuzz, older]).sort()).toEqual([...TWELVE].sort());
    expect(publishedLanguages([])).toEqual([]);
  });
  it("orders English first, then by name in the interface language", () => {
    expect(orderLanguages(["ja", "kk", "en", "de"], "en")).toEqual(["en", "de", "ja", "kk"]);
    expect(orderLanguages(["ru", "kk", "en"], "ru")[0]).toBe("en");
  });
  it("defaults to the interface language for each UI locale", () => {
    for (const ui of ["en", "kk", "ru", "es"]) expect(chooseLibraryLanguage(TWELVE, { interfaceLocale: ui })).toEqual({ language: ui, origin: "interface", missing: null });
  });
  it("prefers the URL, then the choice saved during this visit", () => {
    expect(chooseLibraryLanguage(TWELVE, { requested: "ja", saved: "ko", interfaceLocale: "kk" })).toMatchObject({ language: "ja", origin: "url" });
    expect(chooseLibraryLanguage(TWELVE, { saved: "ko", interfaceLocale: "kk" })).toMatchObject({ language: "ko", origin: "saved" });
    expect(chooseLibraryLanguage(TWELVE, { saved: "fr", interfaceLocale: "kk" })).toMatchObject({ language: "kk", origin: "interface" });
  });
  it("falls back to English and reports what was missing", () => {
    expect(chooseLibraryLanguage(["en", "ja"], { interfaceLocale: "kk" })).toEqual({ language: "en", origin: "fallback", missing: "kk" });
    expect(chooseLibraryLanguage(TWELVE, { requested: "fr", interfaceLocale: "ru" })).toEqual({ language: "en", origin: "fallback", missing: "fr" });
    expect(chooseLibraryLanguage(TWELVE, { requested: "<script>", interfaceLocale: "ru" }).missing).toBeNull();
    expect(chooseLibraryLanguage([], { interfaceLocale: "en" }).language).toBeNull();
    expect(fallbackLanguage(["ja", "ko"])).toBe("ja");
  });
});

describe("editions", () => {
  it("returns the edition in the chosen language", () => {
    for (const l of TWELVE) expect(editionFor(biobuzz, l)).toEqual({ edition: biobuzz.translations.find((t) => t.language === l), fallback: false });
  });
  it("shows the English edition, marked as a fallback, when a manual lacks the language", () => {
    const r = editionFor(older, "ja");
    expect(r.fallback).toBe(true);
    expect(r.edition?.language).toBe("en");
    expect(groupByLanguage([biobuzz, older], "ja")).toEqual({ matching: [biobuzz], other: [older] });
    expect(groupByLanguage([biobuzz, older], "kk").other).toEqual([]);
  });
  it("has no edition for a manual without published translations", () => {
    expect(editionFor(manual({ slug: "empty" }), "en")).toEqual({ edition: null, fallback: false });
  });
});

describe("reader preference", () => {
  const tr = biobuzz.translations;
  it("an explicit ?lang= always wins", () => {
    expect(resolveReaderTarget(tr, { lang: "ja" }, ["ko", "kk"]).translation?.language).toBe("ja");
  });
  it("without ?lang= opens the saved, then the interface language", () => {
    expect(resolveReaderTarget(tr, {}, ["ko", "kk"]).translation?.language).toBe("ko");
    expect(resolveReaderTarget(tr, {}, [null, "ru"]).translation?.language).toBe("ru");
    expect(resolveReaderTarget(tr, {}, ["fr"]).translation?.language).toBe("en");
  });
});
