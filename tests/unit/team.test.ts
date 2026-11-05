import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { TEAM } from "@/content/team";

describe("MAVERICKS roster", () => {
  it("keeps all 14 members from the team's own posts, each once", () => {
    expect(TEAM).toHaveLength(14);
    expect(new Set(TEAM.map((m) => m.name)).size).toBe(14);
  });
  it("has a real portrait file for every member", () => {
    for (const m of TEAM) expect(existsSync(path.join(process.cwd(), "public", m.photo)), m.photo).toBe(true);
  });
  it("leads only with the documented leadership roles", () => {
    expect(TEAM.filter((m) => m.lead).map((m) => m.role)).toEqual(["Captain", "Tech team captain"]);
  });
  it("keeps uncertain spellings and roles flagged for confirmation, unchanged", () => {
    const flagged = Object.fromEntries(TEAM.filter((m) => m.verify).map((m) => [m.name, m.role]));
    expect(flagged).toEqual({ Erdaulet: "Engineer", Adem: "Cader", Asqar: "Outreach coordinator", Kaussar: "Content creator" });
  });
});
