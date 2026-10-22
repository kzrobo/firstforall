import { describe, expect, it } from "vitest";
import { EMPTY_FILTERS, facetValues, filterManuals } from "@/lib/manuals/filters";
import { manual, translation } from "./fixtures";

const list = [
  manual({ slug: "comp-25", title: "Competition Manual", season: "2025-2026", translations: [translation({ language: "en" }), translation({ language: "kk" })] }),
  manual({ slug: "game-24", title: "Game Manual Part 2", season: "2024-2025", category: "game", translations: [translation({ language: "en" })] }),
];

describe("library filters", () => {
  it("sorts newest season first by default", () => {
    expect(filterManuals(list, EMPTY_FILTERS).map((m) => m.slug)).toEqual(["comp-25", "game-24"]);
  });
  it("filters by language, season, category and text", () => {
    expect(filterManuals(list, { ...EMPTY_FILTERS, language: "kk" }).map((m) => m.slug)).toEqual(["comp-25"]);
    expect(filterManuals(list, { ...EMPTY_FILTERS, season: "2024-2025" }).map((m) => m.slug)).toEqual(["game-24"]);
    expect(filterManuals(list, { ...EMPTY_FILTERS, category: "game" })).toHaveLength(1);
    expect(filterManuals(list, { ...EMPTY_FILTERS, q: "part 2 game" }).map((m) => m.slug)).toEqual(["game-24"]);
  });
  it("derives facets only from published data", () => {
    expect(facetValues(list)).toEqual({ seasons: ["2025-2026", "2024-2025"], languages: ["en", "kk"], categories: ["competition", "game"] });
  });
});
