/**
 * MAVERICKS FTC #24034 roster, as published in the team's own Instagram member posts
 * (names from the post artwork, roles from the posts' text layer). First names only.
 * Portraits: public/media/team/members/<name>.jpg, 3:4, extracted from the same posts.
 * Roles are the team's own titles and are shown as written (not translated).
 */
export interface TeamMember {
  name: string; role: string; photo: string; focus?: string;
  /** Documented team leadership (Captain, Tech team captain) — shown first on /mavericks/team */
  lead?: boolean;
  /** Still to be confirmed by the team (not shown to visitors). Re-checked 2026-11-05 against posts 20, 23, 24, 28. */
  verify?: string;
}

const p = (name: string) => `/media/team/members/${name.toLowerCase()}.jpg`;

export const TEAM: TeamMember[] = [
  { name: "Murat", role: "Captain", photo: p("Murat"), lead: true },
  { name: "Aruzhan", role: "Tech team captain", photo: p("Aruzhan"), lead: true },
  { name: "Nursaya", role: "Lead coder", photo: p("Nursaya") },
  { name: "Makhambet", role: "Web developer", photo: p("Makhambet") },
  { name: "Aisulu", role: "Web designer", photo: p("Aisulu") },
  { name: "Nurdos", role: "Main builder, driver", photo: p("Nurdos") },
  { name: "Alikhan", role: "Builder", photo: p("Alikhan") },
  { name: "Erdaulet", role: "Engineer", photo: p("Erdaulet"), verify: "Spelling read from stylised lettering (post 24)." },
  { name: "Adem", role: "Cader", photo: p("Adem"), verify: "Role printed as \"cader\" in post 28 — possibly CAD designer; confirm wording." },
  { name: "Asqar", role: "Outreach coordinator", photo: p("Asqar"), verify: "Spelling read from stylised lettering (post 23)." },
  { name: "Aidana", role: "Head of inspire", photo: p("Aidana") },
  { name: "Kaussar", role: "Content creator", photo: p("Kaussar"), verify: "Spelling read from stylised lettering (post 20)." },
  { name: "Adina", role: "Documentation", photo: p("Adina") },
  { name: "Dilnaz", role: "Designer", photo: p("Dilnaz") },
];
