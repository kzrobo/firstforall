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

export const BUNDLED_MEDIA: Partial<Record<"heroPoster" | "aboutHero", MediaItem>> = {
  // Bottom-weighted crop keeps both rows of faces and drops most of the partner banner behind them.
  heroPoster: { url: TEAM_PORTRAIT, alt: portraitAlt, caption: portraitCaption, focus: "50% 100%", focusMobile: "50% 100%", layout: "wide", aspect: 4 / 3 },
  aboutHero: { url: TEAM_PORTRAIT, alt: portraitAlt, caption: portraitCaption, focus: "50% 70%", focusMobile: "50% 58%", layout: "wide", aspect: 4 / 3 },
};
