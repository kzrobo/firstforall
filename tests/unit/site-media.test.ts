import { describe, expect, it } from "vitest";
import { parseSiteMedia } from "@/lib/site/repository";

describe("site media parsing", () => {
  it("returns empty slots without data", () => {
    const m = parseSiteMedia(null);
    expect(m.heroVideo).toBeNull();
    expect(m.photoPair).toEqual([]);
  });
  it("maps storage paths, alt text and captions", () => {
    const m = parseSiteMedia([
      { key: "hero_video", value: { path: "hero/team.mp4", alt: "Team at the field" } },
      { key: "photo_pair", value: { items: [{ path: "a.jpg", alt: "A", caption: "Outreach" }, { path: "b.jpg", alt: "B" }] } },
    ]);
    expect(m.heroVideo?.url).toMatch(/\/storage\/v1\/object\/public\/public-media\/hero\/team\.mp4$/);
    expect(m.heroVideo?.alt).toBe("Team at the field");
    expect(m.photoPair.map((p) => p.caption)).toEqual(["Outreach", null]);
  });
  it("ignores malformed values instead of crashing", () => {
    const m = parseSiteMedia([{ key: "photo_feature", value: { nope: true } }, { key: "photo_pair", value: "x" }]);
    expect(m.photoFeature).toBeNull();
    expect(m.photoPair).toEqual([]);
  });
});
