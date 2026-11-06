import { describe, expect, it } from "vitest";
import { toGalleryItems } from "@/lib/hub/gallery";
import type { HubEntry } from "@/lib/hub/types";

const base = (o: Partial<HubEntry>): HubEntry => ({
  id: "1", category: "inspires", slug: "a", title: "A", subtitle: null, summary: null, sections: {}, stage: null, eventDate: null, season: null,
  countryCode: null, city: null, latitude: null, longitude: null, teamName: null, teamNumber: null, logoUrl: null, logoPath: null,
  coverUrl: null, coverPath: null, media: [], milestones: [], videoId: null, collaborators: [], relatedIds: [], isFeatured: false, order: 0,
  status: "published", publishedAt: null, ...o,
} as HubEntry);
const m = (path: string, kind: "photo" | "screenshot" | "graphic", alt = path) => ({ url: `/u/${path}`, path, alt, caption: null, kind });

describe("toGalleryItems", () => {
  it("uses the cover and its alt text, links with the given href", () => {
    const [g] = toGalleryItems([base({ coverUrl: "/u/c.jpg", coverPath: "c.jpg", media: [m("x.jpg", "photo"), m("c.jpg", "graphic", "Cover alt")], subtitle: "Sub" })], (e) => `/p/${e.slug}`);
    expect(g).toMatchObject({ image: "/u/c.jpg", alt: "Cover alt", href: "/p/a", description: "Sub", category: "MAVERICKS Inspires" });
  });
  it("falls back to the first photo/graphic before a call screenshot", () => {
    const [g] = toGalleryItems([base({ media: [m("s.jpg", "screenshot"), m("p.jpg", "photo", "Photo")] })], () => "/");
    expect(g.image).toBe("/u/p.jpg"); expect(g.alt).toBe("Photo");
  });
  it("skips entries without any real image (no placeholders)", () => {
    expect(toGalleryItems([base({}), base({ id: "2", summary: "S", media: [m("s.jpg", "screenshot")] })], () => "/")).toHaveLength(1);
  });
  it("uses the summary when there is no subtitle", () => {
    expect(toGalleryItems([base({ summary: "Sum", coverUrl: "/u/c.jpg" })], () => "/")[0].description).toBe("Sum");
  });
});
