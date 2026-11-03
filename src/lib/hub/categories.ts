/**
 * The seven MAVERICKS categories. These are the team's own editorial language, inspired by
 * FTC community values — they are NOT FIRST award titles and must never be presented as awards.
 */
export const HUB_CATEGORIES = ["inspires", "connects", "builds", "teaches", "reaches", "achieves", "sustains"] as const;
export type HubCategory = (typeof HUB_CATEGORIES)[number];

export function isHubCategory(v: string): v is HubCategory {
  return (HUB_CATEGORIES as readonly string[]).includes(v);
}

/** Display name: the brand word stays English in every language, like a product name. */
export function categoryTitle(c: HubCategory): string {
  return `MAVERICKS ${c.charAt(0).toUpperCase()}${c.slice(1)}`;
}

/** Text sections each category may use, in reading order. Keys are stored in hub_entries.sections. */
export const CATEGORY_SECTIONS = {
  inspires: ["problem", "solution", "approach", "results", "impact"],
  connects: ["overview", "topics", "outcomes"],
  builds: ["challenge", "design", "iterations", "results"],
  teaches: ["overview", "format", "materials", "results"],
  reaches: ["overview", "audience", "activities", "outcomes"],
  achieves: ["overview", "result", "evidence"],
  sustains: ["overview", "approach", "impact"],
} as const satisfies Record<HubCategory, readonly string[]>;

export type SectionKey = (typeof CATEGORY_SECTIONS)[HubCategory][number];
export const ALL_SECTION_KEYS = [...new Set(Object.values(CATEGORY_SECTIONS).flat())] as SectionKey[];

/** Which shared fields a category uses (drives admin form and public layout). */
export const CATEGORY_FIELDS: Record<HubCategory, { stage: boolean; location: boolean; team: boolean; date: boolean; season: boolean }> = {
  inspires: { stage: true, location: false, team: false, date: false, season: false },
  connects: { stage: false, location: true, team: true, date: true, season: false },
  builds: { stage: true, location: false, team: false, date: false, season: true },
  teaches: { stage: false, location: true, team: false, date: true, season: false },
  reaches: { stage: false, location: true, team: false, date: true, season: false },
  achieves: { stage: false, location: true, team: false, date: true, season: true },
  sustains: { stage: true, location: false, team: false, date: false, season: false },
};

export const PROJECT_STAGES = ["concept", "in_development", "prototype", "pilot", "active", "completed", "paused"] as const;
export type ProjectStage = (typeof PROJECT_STAGES)[number];
