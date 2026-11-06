import { describe, expect, it } from "vitest";
import {
  categoryFromPlaylists, isAllowedThumbnail, lessonDuration, normalizeLanguage, parseIsoDuration, pickThumbnail, planSync,
  slugFromTitle, uniqueSlug, unavailableReason, type ExistingLesson, type PlanInput, type VideoInfo,
} from "@/lib/youtube/plan";

const CH = "UCvNENrJ9fRJP4nO4YZu5jsg";
const CAT_BASICS = "00000000-0000-0000-0000-000000000001";
const CAT_PROG = "00000000-0000-0000-0000-000000000004";

const video = (id: string, p: Partial<VideoInfo> = {}): VideoInfo => ({
  id, channelId: CH, title: `Lesson ${id}`, description: `About ${id}`, publishedAt: "2026-11-01T10:00:00Z", durationSeconds: 600,
  thumbnailUrl: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`, privacyStatus: "public", uploadStatus: "processed", embeddable: true,
  liveBroadcastContent: "none", defaultAudioLanguage: "en", ...p,
});

const row = (id: string, p: Partial<ExistingLesson> = {}): ExistingLesson => ({
  id: `row-${id}`, slug: `lesson-${id.toLowerCase()}`, youtube_id: id, source: "youtube", locked_fields: [],
  title: `Lesson ${id}`, description: `About ${id}`, category_id: CAT_BASICS, duration_seconds: 600,
  youtube_title: `Lesson ${id}`, youtube_description: `About ${id}`, youtube_published_at: "2026-11-01T10:00:00Z", youtube_duration_seconds: 600,
  thumbnail_url: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`, youtube_playlist_ids: [], youtube_availability: "available", youtube_unavailable_reason: null, ...p,
});

const input = (p: Partial<PlanInput>): PlanInput => ({
  settings: { channelId: CH, autoPublish: true, defaultCategoryId: CAT_BASICS, defaultLanguage: "en" },
  mappings: [], membership: new Map(), requestedIds: [], videos: [], existing: [], ignoredIds: new Set(), takenSlugs: new Set(), now: "2026-11-07T12:00:00Z", ...p,
});

describe("YouTube helpers", () => {
  it("parses ISO 8601 durations", () => {
    expect(parseIsoDuration("PT12M5S")).toBe(725);
    expect(parseIsoDuration("PT1H2M3S")).toBe(3723);
    expect(parseIsoDuration("P1DT1S")).toBe(86401);
    expect(parseIsoDuration("P0D")).toBeNull();
    expect(parseIsoDuration("garbage")).toBeNull();
    expect(lessonDuration(86401)).toBeNull();
  });
  it("accepts thumbnails only from YouTube's CDN (or an explicit local test origin)", () => {
    expect(pickThumbnail({ default: { url: "https://i.ytimg.com/vi/a/default.jpg" }, maxres: { url: "https://i.ytimg.com/vi/a/maxresdefault.jpg" } })).toBe("https://i.ytimg.com/vi/a/maxresdefault.jpg");
    expect(pickThumbnail({ maxres: { url: "https://evil.example/x.jpg" }, high: { url: "https://i9.ytimg.com/vi/a/hq.jpg" } })).toBe("https://i9.ytimg.com/vi/a/hq.jpg");
    expect(isAllowedThumbnail("http://localhost:4010/thumbs/a.svg", "http://localhost:4010")).toBe(true);
    expect(isAllowedThumbnail("http://localhost:4010/thumbs/a.svg", null)).toBe(false);
    expect(isAllowedThumbnail("http://attacker:4010/x", "http://attacker:4010")).toBe(false);
  });
  it("explains why a video cannot be shown", () => {
    expect(unavailableReason(video("a"), CH)).toBeNull();
    expect(unavailableReason(undefined, CH)).toBe("removed");
    expect(unavailableReason(video("a", { privacyStatus: "private" }), CH)).toBe("private");
    expect(unavailableReason(video("a", { privacyStatus: "unlisted" }), CH)).toBe("unlisted");
    expect(unavailableReason(video("a", { liveBroadcastContent: "upcoming" }), CH)).toBe("live_or_upcoming");
    expect(unavailableReason(video("a", { embeddable: false }), CH)).toBe("not_embeddable");
    expect(unavailableReason(video("a", { channelId: "UCother0000000000000000a" }), CH)).toBe("other_channel");
  });
  it("normalises languages and makes slugs in all four languages", () => {
    expect(normalizeLanguage("en-US")).toBe("en");
    expect(normalizeLanguage("kk")).toBe("kk");
    expect(normalizeLanguage("zxx")).toBeNull();
    expect(slugFromTitle("Робот құрастыру: шасси")).toBe("robot-qurastyru-shassi");
    expect(slugFromTitle("Основы программирования")).toBe("osnovy-programmirovaniya");
    expect(slugFromTitle("Diseño de la pinza")).toBe("diseno-de-la-pinza");
    expect(uniqueSlug("Intro", "abcDEF_1234", new Set(["intro"]))).toBe("intro-abcdef-1234");
    expect(uniqueSlug("!!!", "abcDEF_1234", new Set())).toBe("video-abcdef-1234");
  });
  it("picks the playlist category with the lowest priority", () => {
    const membership = new Map([["v1", ["PLb", "PLa"]]]);
    expect(categoryFromPlaylists("v1", membership, [{ playlistId: "PLa", categoryId: "A", priority: 2 }, { playlistId: "PLb", categoryId: "B", priority: 1 }])).toBe("B");
    expect(categoryFromPlaylists("v2", membership, [{ playlistId: "PLa", categoryId: "A", priority: 0 }])).toBeNull();
  });
});

describe("planSync", () => {
  it("imports new public videos once, with a unique slug, and publishes them when auto-publish is on", () => {
    const plan = planSync(input({
      requestedIds: ["vidAAAAAAA1", "vidBBBBBBB2"],
      videos: [video("vidAAAAAAA1", { title: "Intro" }), video("vidBBBBBBB2", { title: "Intro", defaultAudioLanguage: "kk" })],
      takenSlugs: new Set(["intro"]),
    }));
    expect(plan.inserts.map((i) => i.slug)).toEqual(["intro-vidaaaaaaa1", "intro-vidbbbbbbb2"]);
    expect(plan.inserts[0]).toMatchObject({ source: "youtube", status: "published", published_at: "2026-11-01T10:00:00Z", category_id: CAT_BASICS, language_code: "en", duration_seconds: 600, youtube_availability: "available" });
    expect(plan.inserts[1].language_code).toBe("kk");
  });
  it("imports as drafts when auto-publish is off", () => {
    const plan = planSync(input({ settings: { channelId: CH, autoPublish: false, defaultCategoryId: CAT_BASICS, defaultLanguage: "en" }, requestedIds: ["vidAAAAAAA1"], videos: [video("vidAAAAAAA1")] }));
    expect(plan.inserts[0]).toMatchObject({ status: "draft", published_at: null });
  });
  it("skips private, upcoming, unembeddable, other-channel and ignored videos", () => {
    const plan = planSync(input({
      requestedIds: ["private0001", "upcoming001", "noembed0001", "otherchan01", "ignored0001"],
      videos: [video("private0001", { privacyStatus: "private" }), video("upcoming001", { liveBroadcastContent: "upcoming" }), video("noembed0001", { embeddable: false }), video("otherchan01", { channelId: "UCother0000000000000000a" }), video("ignored0001")],
      ignoredIds: new Set(["ignored0001"]),
    }));
    expect(plan.inserts).toHaveLength(0);
    expect(plan.skipped.map((s) => s.reason).sort()).toEqual(["ignored", "live_or_upcoming", "not_embeddable", "other_channel", "private"]);
  });
  it("is idempotent: an unchanged video produces no update", () => {
    const plan = planSync(input({ requestedIds: ["vidAAAAAAA1"], videos: [video("vidAAAAAAA1")], existing: [row("vidAAAAAAA1")] }));
    expect(plan.inserts).toHaveLength(0);
    expect(plan.updates).toHaveLength(0);
    expect(plan.unchanged).toBe(1);
  });
  it("never creates a second lesson for a video that already has one", () => {
    const plan = planSync(input({ requestedIds: ["vidAAAAAAA1", "vidAAAAAAA1"], videos: [video("vidAAAAAAA1")], existing: [row("vidAAAAAAA1", { source: "manual", youtube_availability: null })] }));
    expect(plan.inserts).toHaveLength(0);
  });
  it("updates unlocked editorial fields and keeps locked (admin-edited) ones", () => {
    const plan = planSync(input({
      requestedIds: ["vidAAAAAAA1"],
      videos: [video("vidAAAAAAA1", { title: "New YouTube title", description: "New text", durationSeconds: 700 })],
      existing: [row("vidAAAAAAA1", { title: "Admin title", locked_fields: ["title"] })],
    }));
    expect(plan.updates).toHaveLength(1);
    const patch = plan.updates[0].patch;
    expect(patch.title).toBeUndefined();
    expect(patch).toMatchObject({ description: "New text", duration_seconds: 700, youtube_title: "New YouTube title", youtube_description: "New text" });
  });
  it("moves a video to its playlist category unless the category was edited, and keeps it when no playlist maps it", () => {
    const mappings = [{ playlistId: "PLprog", categoryId: CAT_PROG, priority: 0 }];
    const membership = new Map([["vidAAAAAAA1", ["PLprog"]], ["vidBBBBBBB2", ["PLprog"]]]);
    const plan = planSync(input({
      mappings, membership, requestedIds: ["vidAAAAAAA1", "vidBBBBBBB2", "vidCCCCCCC3"],
      videos: [video("vidAAAAAAA1"), video("vidBBBBBBB2"), video("vidCCCCCCC3")],
      existing: [row("vidAAAAAAA1"), row("vidBBBBBBB2", { locked_fields: ["category_id"] }), row("vidCCCCCCC3", { category_id: CAT_PROG })],
    }));
    const byId = Object.fromEntries(plan.updates.map((u) => [u.youtube_id, u.patch]));
    expect(byId.vidAAAAAAA1).toMatchObject({ category_id: CAT_PROG, youtube_playlist_ids: ["PLprog"] });
    expect(byId.vidBBBBBBB2.category_id).toBeUndefined();
    expect(byId.vidCCCCCCC3).toBeUndefined(); // unchanged: no mapped playlist, current category kept
  });
  it("adopts a hand-made lesson for a channel video without changing what visitors see", () => {
    const plan = planSync(input({
      requestedIds: ["vidAAAAAAA1"], videos: [video("vidAAAAAAA1", { title: "YouTube title" })],
      existing: [row("vidAAAAAAA1", { source: "manual", youtube_availability: null, title: "Hand-written title", youtube_title: null })],
    }));
    const patch = plan.updates[0].patch;
    expect(patch.locked_fields).toEqual(["title", "description", "category_id", "duration_seconds"]);
    expect(patch.title).toBeUndefined();
    expect(patch).toMatchObject({ youtube_title: "YouTube title", youtube_availability: "available" });
  });
  it("leaves hand-made lessons alone when their video is not a public video of our channel", () => {
    const plan = planSync(input({
      requestedIds: ["vidAAAAAAA1"], videos: [video("vidAAAAAAA1", { privacyStatus: "private" })],
      existing: [row("vidAAAAAAA1", { source: "manual", youtube_availability: null })],
    }));
    expect(plan.updates).toHaveLength(0);
  });
  it("marks removed or private videos unavailable, and available again when they return", () => {
    const gone = planSync(input({ requestedIds: ["vidAAAAAAA1"], videos: [], existing: [row("vidAAAAAAA1")] }));
    expect(gone.updates[0].patch).toMatchObject({ youtube_availability: "unavailable", youtube_unavailable_reason: "removed" });
    const priv = planSync(input({ requestedIds: ["vidAAAAAAA1"], videos: [video("vidAAAAAAA1", { privacyStatus: "private" })], existing: [row("vidAAAAAAA1")] }));
    expect(priv.updates[0].patch).toMatchObject({ youtube_availability: "unavailable", youtube_unavailable_reason: "private" });
    const back = planSync(input({ requestedIds: ["vidAAAAAAA1"], videos: [video("vidAAAAAAA1")], existing: [row("vidAAAAAAA1", { youtube_availability: "unavailable", youtube_unavailable_reason: "private" })] }));
    expect(back.updates[0].patch).toMatchObject({ youtube_availability: "available", youtube_unavailable_reason: null });
  });
  it("never changes status, featured flag, order or language of an existing lesson", () => {
    const plan = planSync(input({ requestedIds: ["vidAAAAAAA1"], videos: [video("vidAAAAAAA1", { title: "Changed", defaultAudioLanguage: "ru" })], existing: [row("vidAAAAAAA1")] }));
    const keys = Object.keys(plan.updates[0].patch);
    for (const k of ["status", "is_featured", "display_order", "language_code", "slug"]) expect(keys).not.toContain(k);
  });
});

describe("YouTube sync migration invariants", async () => {
  const { readFileSync } = await import("node:fs");
  const sql = readFileSync(new URL("../../supabase/migrations/20261107000000_youtube_sync.sql", import.meta.url), "utf8");
  it("enables RLS on every new table", () => {
    const tables = [...sql.matchAll(/create table public\.(\w+)/g)].map((m) => m[1]);
    expect(tables.length).toBe(4);
    for (const t of tables) expect(sql).toContain(`alter table public.${t} enable row level security`);
  });
  it("guarantees one lesson per YouTube video and one running sync at a time", () => {
    expect(sql).toContain("create unique index lessons_youtube_id_key on public.lessons (youtube_id)");
    expect(sql).toMatch(/create unique index youtube_sync_runs_one_running[^;]+where status = 'running'/);
  });
  it("lets only the server job write the run log, and only YouTube's CDN as thumbnail host", () => {
    expect(sql).not.toMatch(/on public\.youtube_sync_runs\s+for (insert|update|all)/);
    expect(sql).toContain("thumbnail_url ~ '^https://i[0-9]?\\.ytimg\\.com/'");
  });
  it("keeps existing lessons as hand-made with nothing locked", () => {
    expect(sql).toContain("add column source text not null default 'manual'");
    expect(sql).toContain("add column locked_fields text[] not null default '{}'");
  });
});
