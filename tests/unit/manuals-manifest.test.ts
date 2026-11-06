import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { languageName, nativeLanguageName } from "@/lib/languages";

type Entry = { file: string; slug: string; season: string; version: string; language: string; isSource: boolean; sourceVersion?: string };
const manifest = JSON.parse(readFileSync("docs/manuals/biobuzz-2026-2027-tu07.manifest.json", "utf8")) as { files: Entry[] };

describe("BIOBUZZ TU07 import manifest", () => {
  it("lists the 12 Drive files as one TU07 edition, one language each", () => {
    expect(manifest.files).toHaveLength(12);
    expect(new Set(manifest.files.map((f) => f.slug)).size).toBe(1);
    expect(new Set(manifest.files.map((f) => f.language)).size).toBe(12);
    expect(manifest.files.every((f) => f.season === "2026-2027" && f.version === "TU07")).toBe(true);
  });
  it("keeps English as the only official source; every translation names its source version", () => {
    expect(manifest.files.filter((f) => f.isSource).map((f) => f.language)).toEqual(["en"]);
    expect(manifest.files.filter((f) => !f.isSource).every((f) => f.sourceVersion === "TU07")).toBe(true);
  });
  it("has fixed display names for every language in all four interface languages", () => {
    for (const { language } of manifest.files) {
      for (const ui of ["en", "kk", "ru", "es"]) expect(languageName(language, ui), `${language}/${ui}`).not.toBe(language);
      expect(nativeLanguageName(language)).not.toBe(language);
    }
  });
});
