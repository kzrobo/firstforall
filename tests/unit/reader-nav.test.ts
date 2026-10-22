import { describe, expect, it } from "vitest";
import { mapPageAcrossTranslations, resolveReaderTarget, sectionAtPage } from "@/lib/manuals/reader-nav";
import { translation } from "./fixtures";

const en = translation({ language: "en", isSource: true, pageCount: 120, sectionMap: [{ key: "1", page: 1 }, { key: "4", page: 27 }, { key: "5", page: 40 }] });
const kk = translation({ language: "kk", pageCount: 140, sectionMap: [{ key: "1", page: 1 }, { key: "4", page: 33 }, { key: "5", page: 49 }] });
const es = translation({ language: "es", pageCount: 125 });

describe("resolveReaderTarget", () => {
  it("opens the requested language and page", () => {
    expect(resolveReaderTarget([en, kk], { lang: "kk", page: "27" })).toEqual({ translation: kk, page: 27 });
  });
  it("falls back to the source document for an unpublished language", () => {
    expect(resolveReaderTarget([en, kk], { lang: "ru" }).translation).toBe(en);
  });
  it("clamps invalid and out-of-range pages", () => {
    expect(resolveReaderTarget([en], { page: "-4" }).page).toBe(1);
    expect(resolveReaderTarget([en], { page: "abc" }).page).toBe(1);
    expect(resolveReaderTarget([en], { page: "9999" }).page).toBe(120);
  });
  it("returns null when nothing is published", () => {
    expect(resolveReaderTarget([], {}).translation).toBeNull();
  });
});

describe("cross-language page mapping", () => {
  it("finds the containing section", () => {
    expect(sectionAtPage(en.sectionMap, 30)).toBe("4");
    expect(sectionAtPage(null, 30)).toBeNull();
  });
  it("preserves the equivalent section when both maps exist", () => {
    expect(mapPageAcrossTranslations(en, kk, 30)).toEqual({ page: 33, mapped: true });
  });
  it("never assumes identical pagination without a mapping", () => {
    expect(mapPageAcrossTranslations(en, es, 30)).toEqual({ page: 1, mapped: false });
  });
});
