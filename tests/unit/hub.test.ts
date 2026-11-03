import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { plural } from "@/i18n/plural";
import { CATEGORY_SECTIONS, HUB_CATEGORIES, categoryTitle, isHubCategory } from "@/lib/hub/categories";
import { ORIGIN, angularDistance, clusterPoints, resolvePosition, type GlobePoint } from "@/lib/hub/geo";
import { cleanSections, sortEntries, toHubEntry } from "@/lib/hub/types";

const centroids = { DE: [10.4, 51.1] as [number, number], KZ: [67.3, 48.2] as [number, number] };
const pt = (id: string, lat: number, lng: number): GlobePoint => ({ id, slug: id, teamName: id, teamNumber: null, countryCode: "DE", city: null, logoUrl: null, lat, lng, precision: "city" });

describe("hub categories", () => {
  it("has exactly the seven categories in order", () => {
    expect(HUB_CATEGORIES).toEqual(["inspires", "connects", "builds", "teaches", "reaches", "achieves", "sustains"]);
    expect(categoryTitle("connects")).toBe("MAVERICKS Connects");
    expect(isHubCategory("awards")).toBe(false);
  });
  it("only keeps the sections a category allows", () => {
    expect(cleanSections("connects", { topics: " Drivetrains ", problem: "not for connects", outcomes: "" })).toEqual({ topics: "Drivetrains" });
    expect(Object.keys(CATEGORY_SECTIONS.inspires)).toHaveLength(5);
  });
});

describe("globe positions", () => {
  it("uses verified coordinates when present", () => {
    expect(resolvePosition({ latitude: 52.5, longitude: 13.4, countryCode: "DE" }, centroids)).toEqual({ lat: 52.5, lng: 13.4, precision: "city" });
  });
  it("falls back to the country centroid and never invents a city", () => {
    expect(resolvePosition({ latitude: null, longitude: null, countryCode: "DE" }, centroids)).toEqual({ lat: 51.1, lng: 10.4, precision: "country" });
  });
  it("does not place entries without a known country", () => {
    expect(resolvePosition({ latitude: null, longitude: null, countryCode: "ZZ" }, centroids)).toBeNull();
    expect(resolvePosition({ latitude: null, longitude: null, countryCode: null }, centroids)).toBeNull();
  });
  it("measures great-circle distance", () => {
    expect(angularDistance({ lat: 0, lng: 0 }, { lat: 0, lng: 90 })).toBeCloseTo(90, 5);
    expect(angularDistance(ORIGIN, ORIGIN)).toBeCloseTo(0, 5);
  });
  it("clusters nearby teams so logos never overlap", () => {
    const c = clusterPoints([pt("a", 52.5, 13.4), pt("b", 52.52, 13.41), pt("c", 40.4, -3.7)]);
    expect(c.map((x) => x.points.map((p) => p.id))).toEqual([["a", "b"], ["c"]]);
  });
});

describe("entry mapping", () => {
  const row = {
    id: "11111111-1111-4111-8111-111111111111", category: "inspires", slug: "x", title: "X", subtitle: null, summary: null,
    sections: { problem: "P", topics: "not allowed here" }, stage: "prototype", event_date: null, season: null, country_code: null, city: null,
    latitude: null, longitude: null, team_name: null, team_number: null, logo_path: null, cover_path: "hub/a.jpg",
    media: [{ path: "hub/b.jpg", alt: "B" }, { nope: 1 }], milestones: [{ date: "2026-03", label: "Prototype" }, {}],
    video_youtube_id: null, collaborators: [], related_ids: [], is_featured: false, display_order: 0, status: "published",
    published_at: null, updated_at: "",
  };
  it("maps rows, drops malformed media and disallowed sections", () => {
    const e = toHubEntry(row, (p) => `/s/${p}`)!;
    expect(e.sections).toEqual({ problem: "P" });
    expect(e.media.map((m) => m.url)).toEqual(["/s/hub/b.jpg"]);
    expect(e.milestones).toHaveLength(1);
    expect(e.coverUrl).toBe("/s/hub/a.jpg");
  });
  it("sorts featured first", () => {
    const a = toHubEntry(row, (p) => p)!, b = { ...a, id: "b", isFeatured: true, order: 9 };
    expect(sortEntries([a, b]).map((e) => e.id)).toEqual(["b", a.id]);
  });
});

describe("hub migration invariants", () => {
  const sql = readFileSync(new URL("../../supabase/migrations/20261103000000_mavericks_hub.sql", import.meta.url), "utf8");
  it("enables RLS and hides drafts", () => {
    expect(sql).toContain("alter table public.hub_entries enable row level security");
    expect(sql).toMatch(/public reads published hub entries[\s\S]+status = 'published'/);
  });
  it("requires coordinates as a pair and validates countries", () => {
    expect(sql).toContain("check ((latitude is null) = (longitude is null))");
    expect(sql).toContain("country_code ~ '^[A-Z]{2}$'");
  });
});

import { checkImage, parseList, parseMilestones, sniffImage, storagePathFor } from "@/lib/hub/uploads";

describe("upload validation", () => {
  const jpg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  const webp = new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 ");
  const svg = new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script>");
  it("identifies images by content", () => {
    expect(sniffImage(jpg)).toBe("image/jpeg");
    expect(sniffImage(png)).toBe("image/png");
    expect(sniffImage(webp)).toBe("image/webp");
    expect(sniffImage(svg)).toBeNull();
  });
  it("rejects SVG renamed to .png, empty and oversized files", () => {
    expect(checkImage("logo.png", 500, svg).ok).toBe(false);
    expect(checkImage("a.jpg", 0, jpg).ok).toBe(false);
    expect(checkImage("a.jpg", 9 * 1024 * 1024, jpg).ok).toBe(false);
    expect(checkImage("a.jpg", 1000, jpg)).toEqual({ ok: true, type: "image/jpeg" });
  });
  it("builds safe storage paths", () => {
    expect(storagePathFor("connects/../x", "abc", "image/png")).toBe("hub/connectsx/abc.png");
  });
  it("parses milestones and lists", () => {
    expect(parseMilestones("2026-03 | First call\nno label line\n2026-05|Prototype | v2")).toEqual([
      { date: "2026-03", label: "First call" }, { date: "2026-05", label: "Prototype | v2" },
    ]);
    expect(parseList("A, B\nA\n  ")).toEqual(["A", "B"]);
  });
});

describe("plural", () => {
  const ru = { one: "документ", few: "документа", many: "документов" };
  it("picks Russian forms", () => {
    expect([1, 2, 5, 11, 21, 22].map((n) => plural("ru", n, ru))).toEqual(["документ", "документа", "документов", "документов", "документ", "документа"]);
  });
  it("uses one/other in English", () => {
    const en = { one: "document", few: "documents", many: "documents" };
    expect(plural("en", 1, en)).toBe("document");
    expect(plural("en", 2, en)).toBe("documents");
  });
});
