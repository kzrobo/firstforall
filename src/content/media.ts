import type { MediaItem } from "@/lib/site/repository";

/**
 * Authentic MAVERICKS media bundled with the site. Used when the matching site_settings slot
 * is empty, so real photography shows even before Supabase is configured. A slot set in the
 * database always wins. Add only genuine team media here — see docs/ASSETS.md.
 */
const TEAM_PORTRAIT = "/media/team/mavericks-team-2026.jpg"; // 1280×960, supplied by the team

const portraitAlt =
  "MAVERICKS FTC #24034 team members in school uniforms, posing together in the hall of Nazarbayev Intellectual School";
const portraitCaption = "MAVERICKS FTC #24034 at Nazarbayev Intellectual School.";

// The homepage hero is video-first (site_settings hero_video + hero_poster). It never falls back
// to the team photo; without a licensed video it shows the emblem composition instead.
export const BUNDLED_MEDIA: Partial<Record<"aboutHero" | "teamFeature", MediaItem>> = {
  teamFeature: { url: TEAM_PORTRAIT, alt: portraitAlt, caption: portraitCaption, focus: "50% 72%", focusMobile: "50% 60%", layout: "wide", aspect: 4 / 3 },
  aboutHero: { url: TEAM_PORTRAIT, alt: portraitAlt, caption: portraitCaption, focus: "50% 70%", focusMobile: "50% 58%", layout: "wide", aspect: 4 / 3 },
};
