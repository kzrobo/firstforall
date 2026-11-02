/**
 * MAVERICKS FTC #24034 roster, as published in the team's own Instagram member posts
 * (names from the post artwork, roles from the posts' text layer). First names only.
 * Portraits: public/media/team/members/<name>.jpg, 3:4, extracted from the same posts.
 * Roles are the team's own titles and are shown as written (not translated).
 */
export interface TeamMember { name: string; role: string; photo: string; focus?: string }

const p = (name: string) => `/media/team/members/${name.toLowerCase()}.jpg`;

export const TEAM: TeamMember[] = [
  { name: "Murat", role: "Captain", photo: p("Murat") },
  { name: "Aruzhan", role: "Tech team captain", photo: p("Aruzhan") },
  { name: "Nursaya", role: "Lead coder", photo: p("Nursaya") },
  { name: "Makhambet", role: "Web developer", photo: p("Makhambet") },
  { name: "Aisulu", role: "Web designer", photo: p("Aisulu") },
  { name: "Nurdos", role: "Main builder, driver", photo: p("Nurdos") },
  { name: "Alikhan", role: "Builder", photo: p("Alikhan") },
  { name: "Erdaulet", role: "Engineer", photo: p("Erdaulet") },
  { name: "Adem", role: "Cader", photo: p("Adem") }, // as written in the source post; confirm wording with the team
  { name: "Asqar", role: "Outreach coordinator", photo: p("Asqar") },
  { name: "Aidana", role: "Head of inspire", photo: p("Aidana") },
  { name: "Kaussar", role: "Content creator", photo: p("Kaussar") },
  { name: "Adina", role: "Documentation", photo: p("Adina") },
  { name: "Dilnaz", role: "Designer", photo: p("Dilnaz") },
];
