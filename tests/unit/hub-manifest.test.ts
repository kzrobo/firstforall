import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CATEGORY_SECTIONS as SCRIPT_SECTIONS, KINDS, checkManifest } from "../../scripts/lib/hub-manifest.mjs";
import { CATEGORY_SECTIONS } from "@/lib/hub/categories";
import { mediaItemSchema } from "@/lib/hub/types";

const jpeg = (n: number) => Buffer.from([0xff, 0xd8, 0xff, 0xe0, n, n >> 8, 1, 2, 3]);
const fakeRead = (map: Record<string, Buffer>) =>
  ((p: string) => { const k = Object.keys(map).find((f) => p.endsWith(f)); if (!k) throw new Error("missing"); return map[k]; }) as unknown as typeof readFileSync;

describe("hub import manifest rules", () => {
  it("stay in sync with the app's categories and media kinds", () => {
    expect(SCRIPT_SECTIONS).toEqual(CATEGORY_SECTIONS);
    expect(KINDS).toEqual(mediaItemSchema.shape.kind.removeDefault().options);
  });
  it("reject duplicates, missing alt text, non-images, foreign sections and a cover outside the gallery", () => {
    const m = { entries: [
      { category: "inspires", slug: "a", title: "Project A", sections: { overview: "x" }, cover: "z.jpg",
        media: [{ file: "1.jpg", alt: "one" }, { file: "2.jpg", alt: "" }, { file: "3.jpg", alt: "dup" }, { file: "4.txt", alt: "text" }] },
      { category: "inspires", slug: "a", title: "Project A again", media: [] },
    ] };
    const r = checkManifest(m, "/x", fakeRead({ "1.jpg": jpeg(1), "2.jpg": jpeg(2), "3.jpg": jpeg(1), "4.txt": Buffer.from("hello") }));
    const all = r.reports.flatMap((x: { problems: string[] }) => x.problems).join("\n");
    expect(all).toMatch(/section "overview" is not used by inspires/);
    expect(all).toMatch(/2\.jpg: alt text is required/);
    expect(all).toMatch(/3\.jpg: same image as 1\.jpg/);
    expect(all).toMatch(/4\.txt: not a JPEG, PNG or WebP/);
    expect(all).toMatch(/cover "z\.jpg" must be one of/);
    expect(all).toMatch(/duplicate entry inspires\/a/);
  });
  it("accepts the committed Drive manifest (6 entries, drafts only, every image unique)", () => {
    const manifest = JSON.parse(readFileSync("docs/hub/drive-2026-11-06.manifest.json", "utf8"));
    const files = manifest.entries.flatMap((e: { media: { file: string }[] }) => e.media.map((m) => m.file));
    const r = checkManifest(manifest, "/x", fakeRead(Object.fromEntries(files.map((f: string, i: number) => [f, jpeg(i + 1)]))));
    expect(r.reports.map((x: { problems: string[] }) => x.problems)).toEqual(Array(6).fill([]));
    expect(files).toHaveLength(26);
    expect(manifest.entries.some((e: Record<string, unknown>) => "status" in e || "publish" in e)).toBe(false);
  });
});

describe("hub manifest: partner team, place and logo (MAVERICKS Connects)", () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 7]);
  it("accepts verified team, city coordinates, a country-only place and a logo", () => {
    const m = { entries: [
      { category: "connects", slug: "fox", title: "Foxslide", team: { name: "Foxslide", number: 29029 }, logo: "fox.png",
        location: { countryCode: "KZ", city: "Almaty", latitude: 43.2389, longitude: 76.8897 } },
      { category: "connects", slug: "pan", title: "Pandurata", team: { name: "Pandurata", number: 26523 }, location: { countryCode: "ID" } },
    ] };
    const r = checkManifest(m, "/x", fakeRead({ "fox.png": png }));
    expect(r.reports.map((x: { problems: string[] }) => x.problems)).toEqual([[], []]);
    expect(r.reports[0].logo).toMatchObject({ file: "fox.png", ext: "png", type: "image/png" });
    expect(r.reports[1].logo).toBeNull();
  });
  it("rejects bad numbers, country codes, half coordinates, coordinates without a city and non-image logos", () => {
    const m = { entries: [
      { category: "connects", slug: "a", title: "A team", team: { name: "A", number: 0 }, location: { countryCode: "kz" } },
      { category: "connects", slug: "b", title: "B team", team: { name: "" }, location: { countryCode: "KZ", city: "Almaty", latitude: 43 } },
      { category: "connects", slug: "c", title: "C team", location: { countryCode: "KZ", latitude: 43, longitude: 200 }, logo: "c.txt" },
    ] };
    const r = checkManifest(m, "/x", fakeRead({ "c.txt": Buffer.from("hello") }));
    expect(r.reports[0].problems.join(" ")).toMatch(/FTC number.*countryCode|countryCode/);
    expect(r.reports[0].problems).toHaveLength(2);
    expect(r.reports[1].problems.join(" ")).toMatch(/team.name.*both latitude/);
    expect(r.reports[2].problems.join(" ")).toMatch(/longitude must be.*city they belong to.*not a JPEG/);
  });
});
