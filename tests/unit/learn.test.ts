import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { categoryName, sortLessons, type Lesson } from "@/lib/learn/types";

const cat = { id: "c", slug: "ftc-basics", name: "FTC Basics", names: { en: "FTC Basics", kk: "FTC негіздері" }, order: 1 };
const lesson = (p: Partial<Lesson>): Lesson => ({
  id: p.id ?? "x", slug: "s", youtubeId: "testfixture", title: "t", description: null, category: cat, language: "en",
  durationSeconds: null, isFeatured: false, status: "published", order: 0, publishedAt: "2026-01-01", updatedAt: "", ...p,
});

describe("lessons", () => {
  it("orders featured first, then display order, then newest", () => {
    const out = sortLessons([
      lesson({ id: "old", publishedAt: "2026-01-01" }),
      lesson({ id: "new", publishedAt: "2026-03-01" }),
      lesson({ id: "first", order: -1 }),
      lesson({ id: "feat", isFeatured: true, order: 5 }),
    ]);
    expect(out.map((l) => l.id)).toEqual(["feat", "first", "new", "old"]);
  });
  it("names categories in the UI language with English fallback", () => {
    expect(categoryName(cat.names, "kk")).toBe("FTC негіздері");
    expect(categoryName(cat.names, "es")).toBe("FTC Basics");
  });
});

describe("learn migration invariants", () => {
  const sql = readFileSync(new URL("../../supabase/migrations/20261101000000_learn.sql", import.meta.url), "utf8");
  it("stores only validated YouTube ids", () => expect(sql).toContain("youtube_id ~ '^[A-Za-z0-9_-]{11}$'"));
  it("enables RLS and hides drafts from the public", () => {
    expect(sql).toContain("alter table public.lessons enable row level security");
    expect(sql).toMatch(/public reads published lessons[\s\S]+status = 'published'/);
  });
  it("allows only one featured lesson", () => expect(sql).toContain("lessons_single_featured"));
});
