#!/usr/bin/env node
// Import real MAVERICKS hub content (projects, events, collaborations) from a manifest.
//
//   node scripts/import-hub.mjs validate <manifest.json>     # local checks only, uploads nothing
//   NEXT_PUBLIC_SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/import-hub.mjs import <manifest.json>
//
// Entries are ALWAYS created as drafts (publish later in Admin → MAVERICKS hub after review). An entry whose
// category/slug already exists is skipped, never overwritten. Images are stored once per content hash at
// public-media/hub/<category>/<slug>/<sha12>.<ext>. Text must come from the team's own materials; leave a
// field out rather than guess. The service-role key is server-side only.
import { readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { checkManifest } from "./lib/hub-manifest.mjs";

const [cmd, manifestPath] = process.argv.slice(2);
const fail = (m) => { console.error(`✗ ${m}`); process.exit(1); };
if (!["validate", "import"].includes(cmd) || !manifestPath) fail("usage: import-hub.mjs validate|import <manifest.json>");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const { reports, problems } = checkManifest(manifest, path.dirname(path.resolve(manifestPath)));

console.log("\nEntries");
for (const r of reports) {
  const e = r.entry;
  const missing = ["subtitle", "summary", "eventDate", "stage"].filter((k) => e[k] == null).join(", ");
  console.log(`${r.problems.length ? "✗" : "✓"} ${e.category}/${e.slug} — "${e.title}" · ${r.images.length} image(s) · sections: ${Object.keys(e.sections ?? {}).join(", ") || "none"} · not given: ${missing || "—"}`);
  for (const p of r.problems) console.log(`    ✗ ${p}`);
  for (const f of e.review ?? []) console.log(`    ⚠ review: ${f}`);
}
const bad = reports.filter((r) => r.problems.length).length + problems.length;
problems.forEach((p) => console.log(`✗ ${p}`));
if (bad) fail(`${bad} problem(s); nothing was imported`);
if (cmd === "validate") { console.log(`\n✓ ${reports.length} entr(ies) valid. Nothing was uploaded.`); process.exit(0); }

const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) fail("import needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (server-side only)");
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const { data: bucket, error: be } = await supabase.storage.getBucket("public-media");
if (be || !bucket) fail(`bucket public-media not reachable: ${be?.message}`);
console.log(`\nStorage ${new URL(url).host}: public-media public=${bucket.public} — importing as DRAFTS`);

for (const { entry: e, images } of reports) {
  const { data: existing, error } = await supabase.from("hub_entries").select("id, status").eq("category", e.category).eq("slug", e.slug).maybeSingle();
  if (error) fail(`lookup ${e.category}/${e.slug}: ${error.message}`);
  if (existing) { console.log(`  · ${e.category}/${e.slug} already exists (${existing.status}) — skipped, not overwritten`); continue; }
  const stored = {};
  for (const img of images) {
    const p = `hub/${e.category}/${e.slug}/${img.sha256.slice(0, 12)}.${img.ext}`;
    const up = await supabase.storage.from("public-media").upload(p, img.bytes, { contentType: img.type, upsert: false, cacheControl: "31536000" });
    if (up.error && !/exists|duplicate/i.test(up.error.message)) fail(`upload ${img.file}: ${up.error.message}`);
    stored[img.file] = p;
  }
  const media = images.map((img) => ({ path: stored[img.file], alt: img.alt, ...(img.caption ? { caption: img.caption } : {}), kind: img.kind }));
  const { error: ie } = await supabase.from("hub_entries").insert({
    category: e.category, slug: e.slug, title: e.title, subtitle: e.subtitle ?? null, summary: e.summary ?? null,
    sections: e.sections ?? {}, stage: e.stage ?? null, event_date: e.eventDate ?? null, season: e.season ?? null,
    collaborators: e.collaborators ?? [], cover_path: e.cover ? stored[e.cover] : media[0]?.path ?? null, media,
    display_order: e.order ?? 0, status: "draft",
  });
  if (ie) fail(`create ${e.category}/${e.slug}: ${ie.message}`);
  console.log(`  + ${e.category}/${e.slug} (draft) · ${media.length} image(s)`);
}
console.log("\n✓ Imported as drafts. Review at /admin/hub (Preview), complete missing facts, then publish.");
