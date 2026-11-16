import { describe, expect, it } from "vitest";
import { documentReaderHref, orderDocuments, toDocuments, toReaderTranslations } from "@/lib/hub/documents";
import { resolveReaderTarget } from "@/lib/manuals/reader-nav";

const url = (p: string) => `https://cdn.test/${p}`;
const raw = [
  { path: "hub/inspires/lumen/en-aaaaaaaaaaaa.pdf", language: "en", pages: 36, bytes: 35973887 },
  { path: "hub/inspires/lumen/kk-bbbbbbbbbbbb.pdf", language: "kk", pages: 36, bytes: 36232660 },
  { path: "hub/inspires/lumen/ru-cccccccccccc.pdf", language: "ru", pages: 36 },
];

describe("hub documents", () => {
  it("keeps valid PDFs only, one per language", () => {
    const docs = toDocuments([...raw, { path: "hub/inspires/lumen/en-dddddddddddd.pdf", language: "EN" }, { path: "../../etc/passwd", language: "en" },
      { path: "hub/inspires/lumen/x.exe", language: "es" }, "nonsense", { path: "hub/inspires/lumen/es-eeeeeeeeeeee.pdf", language: "not a tag" }], url);
    expect(docs.map((d) => d.language)).toEqual(["en", "kk", "ru"]);
    expect(docs[0]).toEqual({ url: "https://cdn.test/hub/inspires/lumen/en-aaaaaaaaaaaa.pdf", path: "hub/inspires/lumen/en-aaaaaaaaaaaa.pdf", language: "en", pages: 36, bytes: 35973887 });
    expect(docs[2].bytes).toBeNull();
  });
  it("puts the interface language first, then English", () => {
    const docs = toDocuments(raw, url);
    expect(orderDocuments(docs, "kk").map((d) => d.language)).toEqual(["kk", "en", "ru"]);
    expect(orderDocuments(docs, "ru").map((d) => d.language)).toEqual(["ru", "en", "kk"]);
    expect(orderDocuments(docs, "es").map((d) => d.language)).toEqual(["en", "kk", "ru"]);
    expect(orderDocuments([], "en")).toEqual([]);
  });
  it("opens in the reader: ?lang= wins, else the interface language, else English", () => {
    const tr = toReaderTranslations("entry-1", toDocuments(raw, url));
    expect(tr.map((t) => t.id)).toEqual(["entry-1-en", "entry-1-kk", "entry-1-ru"]);
    expect(resolveReaderTarget(tr, { lang: "ru", page: "5" }, ["kk", "en"])).toMatchObject({ translation: { language: "ru" }, page: 5 });
    expect(resolveReaderTarget(tr, {}, ["kk", "en"]).translation?.language).toBe("kk");
    expect(resolveReaderTarget(tr, {}, ["es", "en"]).translation?.language).toBe("en");
    expect(resolveReaderTarget(tr, { page: "99" }, ["en"]).page).toBe(36);
  });
  it("builds reader links", () => {
    expect(documentReaderHref("inspires", "lumen", "zh-Hans")).toBe("/mavericks/inspires/lumen/read?lang=zh-Hans");
  });
});
