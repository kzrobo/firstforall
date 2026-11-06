import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sql = readFileSync(new URL("../../supabase/migrations/20261022000000_init.sql", import.meta.url), "utf8");

describe("database security invariants", () => {
  it("enables RLS on every public table", () => {
    const tables = [...sql.matchAll(/create table public\.(\w+)/g)].map((m) => m[1]);
    for (const t of tables) expect(sql).toContain(`alter table public.${t} enable row level security`);
  });
  it("only exposes published manuals and translations publicly", () => {
    expect(sql).toMatch(/public reads published manuals[\s\S]+status = 'published'/);
    expect(sql).toMatch(/public reads published translations[\s\S]+m\.status = 'published'/);
  });
  it("keeps drafts in a private bucket", () => {
    // Whitespace-insensitive: the draft bucket row must say public = false.
    expect(sql).toMatch(/\(\s*'manuals-draft'\s*,\s*'manuals-draft'\s*,\s*false\s*,/);
    expect(sql).not.toMatch(/\(\s*'manuals-draft'\s*,\s*'manuals-draft'\s*,\s*true/);
  });
  it("invalidates AI indexing when a translation file changes", () => {
    expect(sql).toContain("new.ingestion_status = 'stale'");
  });
});
