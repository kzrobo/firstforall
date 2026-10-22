import type { Manual } from "./types";

export interface LibraryFilters {
  q: string;
  season: string;
  language: string;
  category: string;
  sort: "newest" | "title";
}

export const EMPTY_FILTERS: LibraryFilters = { q: "", season: "", language: "", category: "", sort: "newest" };

export function filterManuals(manuals: Manual[], f: LibraryFilters): Manual[] {
  const q = f.q.trim().toLocaleLowerCase();
  const out = manuals.filter((m) => {
    if (f.season && m.season !== f.season) return false;
    if (f.category && m.category !== f.category) return false;
    if (f.language && !m.translations.some((t) => t.language === f.language)) return false;
    if (q) {
      const hay = [m.title, m.description ?? "", m.season, m.seasonName ?? "", m.category].join(" ").toLocaleLowerCase();
      if (!q.split(/\s+/).every((word) => hay.includes(word))) return false;
    }
    return true;
  });
  return out.sort((a, b) =>
    f.sort === "title" ? a.title.localeCompare(b.title) : b.season.localeCompare(a.season) || a.title.localeCompare(b.title),
  );
}

export function facetValues(manuals: Manual[]) {
  return {
    seasons: [...new Set(manuals.map((m) => m.season))].sort().reverse(),
    languages: [...new Set(manuals.flatMap((m) => m.translations.map((t) => t.language)))].sort(),
    categories: [...new Set(manuals.map((m) => m.category))].sort(),
  };
}
