#!/usr/bin/env node
// Import real FTC manuals (original PDFs, byte-for-byte) into the manual library.
//
//   node scripts/import-manuals.mjs validate <manifest.json>            # local only: checks every PDF, prints the inventory
//   NEXT_PUBLIC_SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… \
//   node scripts/import-manuals.mjs import <manifest.json> [--publish]  # uploads + creates rows (draft unless --publish)
//
// The manifest (see docs/manuals-import.example.json) describes each file: which manual edition it belongs to
// (slug, title, season, version / Team Update), its language and whether it is the official source.
// Nothing is guessed: missing metadata is an error. Files are uploaded unmodified. Existing manuals or
// translations are never overwritten: a (manual, language) pair that already exists is reported and skipped.
// Uses the server-only service-role key; never ship it to the browser.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const [cmd, manifestPath, ...flags] = process.argv.slice(2);
const fail = (m) => { console.error(`✗ ${m}`); process.exit(1); };
if (!["validate", "import"].includes(cmd) || !manifestPath) fail("usage: import-manuals.mjs validate|import <manifest.json> [--publish]");

const CATEGORIES = ["competition", "game", "engineering", "safety", "other"];
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const LANG = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/;
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const baseDir = path.dirname(path.resolve(manifestPath));
const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
const pdfAssets = path.join(process.cwd(), "node_modules", "pdfjs-dist");

async function inspect(entry) {
  const problems = [];
  for (const k of ["file", "slug", "title", "season", "category", "version", "language"]) if (!entry[k]) problems.push(`missing "${k}"`);
  if (typeof entry.isSource !== "boolean") problems.push(`"isSource" must be true or false`);
  if (entry.slug && !SLUG.test(entry.slug)) problems.push(`slug "${entry.slug}" must be lowercase words joined by "-"`);
  if (entry.language && !LANG.test(entry.language)) problems.push(`language "${entry.language}" is not a BCP 47 tag`);
  if (entry.category && !CATEGORIES.includes(entry.category)) problems.push(`category must be one of ${CATEGORIES.join(", ")}`);
  let bytes = null, pages = null, text = "", title = null;
  try { bytes = readFileSync(path.resolve(baseDir, entry.file ?? "")); } catch { problems.push(`file not found: ${entry.file}`); }
  if (bytes && bytes.subarray(0, 5).toString() !== "%PDF-") problems.push("not a PDF (missing %PDF header)");
  if (bytes && !problems.length) {
    try {
      const doc = await pdfjs.getDocument({ data: new Uint8Array(bytes), isEvalSupported: false, verbosity: 0,
        cMapUrl: `${pdfAssets}/cmaps/`, cMapPacked: true, standardFontDataUrl: `${pdfAssets}/standard_fonts/` }).promise;
      pages = doc.numPages;
      title = (await doc.getMetadata()).info?.Title ?? null;
      for (let i = 1; i <= Math.min(3, pages) && text.length < 400; i++) text += (await (await doc.getPage(i)).getTextContent()).items.map((it) => it.str ?? "").join(" ");
      await doc.destroy();
    } catch (e) { problems.push(`PDF could not be opened: ${e.message}`); }
  }
  const sha256 = bytes ? createHash("sha256").update(bytes).digest("hex") : null;
  return { entry, bytes, pages, searchable: text.trim().length > 20, sample: text.trim().slice(0, 60), title, sha256, problems };
}

const rows = [];
for (const entry of manifest.files ?? []) rows.push(await inspect(entry));
if (!rows.length) fail("manifest has no files");
// Duplicates inside the manifest: same edition + language, or the same file twice
const seen = new Map();
for (const r of rows) {
  for (const key of [`${r.entry.slug}|${r.entry.language}`, `sha:${r.sha256}`]) {
    if (key.endsWith("|undefined") || key === "sha:null") continue;
    if (seen.has(key)) r.problems.push(`duplicate of ${seen.get(key)}`); else seen.set(key, r.entry.file);
  }
}
// One official source per edition
const sources = {};
for (const r of rows) if (r.entry.isSource) sources[r.entry.slug] = (sources[r.entry.slug] ?? 0) + 1;
for (const r of rows) if (sources[r.entry.slug] > 1 && r.entry.isSource) r.problems.push("more than one official source for this edition");

console.log("\nInventory");
console.log(["file", "language", "season", "version / TU", "pages", "source", "searchable", "sha256", "status"].join(" | "));
for (const r of rows) {
  const e = r.entry;
  console.log([e.file, e.language, e.season, [e.version, e.teamUpdate ? `TU ${e.teamUpdate}` : null].filter(Boolean).join(" · "), r.pages ?? "?",
    e.isSource ? "official" : "community", r.searchable ? "yes" : "no text layer", r.sha256?.slice(0, 12) ?? "-", r.problems.length ? `✗ ${r.problems.join("; ")}` : "✓ valid"].join(" | "));
}
const bad = rows.filter((r) => r.problems.length);
if (bad.length) fail(`${bad.length} file(s) need attention; nothing was imported`);
if (cmd === "validate") { console.log(`\n✓ ${rows.length} file(s) valid. Nothing was uploaded.`); process.exit(0); }

// ---- import ----
const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) fail("import needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (server-side only)");
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const publish = flags.includes("--publish");
const status = publish ? "published" : "draft";
const now = publish ? new Date().toISOString() : null;

const { data: bucket, error: be } = await supabase.storage.getBucket("manuals-public");
if (be || !bucket) fail(`bucket manuals-public not reachable: ${be?.message}`);
if (bucket.allowed_mime_types?.length && !bucket.allowed_mime_types.includes("application/pdf")) fail("bucket manuals-public does not accept application/pdf");
const largest = Math.max(...rows.map((r) => r.bytes.length));
if (bucket.file_size_limit && largest > Number(bucket.file_size_limit)) fail(`a file (${largest} bytes) exceeds the bucket limit (${bucket.file_size_limit})`);
console.log(`\nStorage ${new URL(url).host}: manuals-public public=${bucket.public}, limit=${bucket.file_size_limit ?? "none"} — importing as ${status}`);

const bySlug = Object.groupBy(rows, (r) => r.entry.slug);
for (const [slug, group] of Object.entries(bySlug)) {
  const head = (group.find((r) => r.entry.isSource) ?? group[0]).entry;
  let { data: manual, error } = await supabase.from("manuals").select("id, revision, status").eq("slug", slug).maybeSingle();
  if (error) fail(`manuals lookup: ${error.message}`);
  if (!manual) {
    const ins = await supabase.from("manuals").insert({
      slug, title: head.title, season: head.season, season_name: head.seasonName ?? null, category: head.category,
      description: head.description ?? null, source_url: head.sourceUrl ?? null, source_language: group.find((r) => r.entry.isSource)?.entry.language ?? "en",
      revision: head.teamUpdate ? `${head.version} · TU ${head.teamUpdate}` : head.version, status, published_at: now,
    }).select("id, revision, status").single();
    if (ins.error) fail(`create ${slug}: ${ins.error.message}`);
    manual = ins.data; console.log(`  + manual ${slug} (${status})`);
  } else console.log(`  = manual ${slug} exists (revision ${manual.revision}, ${manual.status}) — adding missing languages only`);

  for (const r of group) {
    const e = r.entry;
    const { data: existing } = await supabase.from("manual_translations").select("id, revision").eq("manual_id", manual.id).eq("language_code", e.language).maybeSingle();
    if (existing) { console.log(`  · ${slug} [${e.language}] already exists (revision ${existing.revision}) — skipped, not overwritten`); continue; }
    const filePath = `${slug}/${e.language}-${r.sha256.slice(0, 12)}.pdf`;
    const up = await supabase.storage.from("manuals-public").upload(filePath, r.bytes, { contentType: "application/pdf", upsert: false, cacheControl: "31536000" });
    if (up.error) fail(`upload ${e.file}: ${up.error.message}`);
    const { error: te } = await supabase.from("manual_translations").insert({
      manual_id: manual.id, language_code: e.language, is_source: e.isSource, file_path: filePath, file_size_bytes: r.bytes.length,
      revision: e.teamUpdate ? `${e.version} · TU ${e.teamUpdate}` : e.version, source_revision: e.sourceVersion ?? null,
      translation_credit: e.translationCredit ?? null, page_count: r.pages, status, published_at: now,
    });
    if (te) fail(`translation row ${slug} [${e.language}]: ${te.message} (file stays at ${filePath})`);
    console.log(`  ✓ ${slug} [${e.language}] ${r.pages} pages → manuals-public/${filePath}`);
  }
}
console.log(publish ? "\n✓ Imported and published." : "\n✓ Imported as drafts. Review in the reader as a team member, then publish.");
