#!/usr/bin/env node
// Homepage hero video: verify the media storage, then upload the files and point the homepage at them.
// Run by an admin on a trusted machine. It needs the server-only service-role key, which must never be
// committed or exposed to the browser.
//
//   NEXT_PUBLIC_SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/hero-video.mjs verify
//   NEXT_PUBLIC_SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/hero-video.mjs upload <dir> [--set]
//
// <dir> must contain: hero-desktop.mp4, hero-desktop.webm, hero-mobile.mp4, hero-mobile.webm,
// hero-poster-desktop.jpg, hero-poster-mobile.jpg. Files go to public-media/hero/<version>/ (new
// folder per upload, so caches never serve an old clip). `--set` also updates the homepage slots
// (site_settings hero_video, hero_poster, hero_poster_mobile); without it nothing on the site changes.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "public-media";
const FILES = {
  "hero-desktop.mp4": "video/mp4",
  "hero-desktop.webm": "video/webm",
  "hero-mobile.mp4": "video/mp4",
  "hero-mobile.webm": "video/webm",
  "hero-poster-desktop.jpg": "image/jpeg",
  "hero-poster-mobile.jpg": "image/jpeg",
};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const [cmd, dir, ...flags] = process.argv.slice(2);
const fail = (msg) => { console.error(`✗ ${msg}`); process.exit(1); };
if (!["verify", "upload"].includes(cmd)) fail("usage: hero-video.mjs verify | upload <dir> [--set]");
if (!url || !key) fail("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (server-side only).");
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

async function verify() {
  console.log(`Storage at ${new URL(url).host}`);
  const { data: b, error } = await supabase.storage.getBucket(BUCKET);
  if (error || !b) fail(`bucket "${BUCKET}" not found or not readable: ${error?.message ?? "no data"}`);
  const problems = [];
  console.log(`  bucket ${BUCKET}: public=${b.public}, size limit=${b.file_size_limit ?? "none"}, types=${(b.allowed_mime_types ?? ["any"]).join(", ")}`);
  if (!b.public) problems.push("bucket is not public (visitors could not load the video)");
  const allowed = b.allowed_mime_types;
  for (const t of new Set(Object.values(FILES))) if (allowed?.length && !allowed.includes(t)) problems.push(`bucket does not accept ${t}${t === "video/webm" ? " — apply supabase/migrations/20261104000000_public_media_webm.sql" : ""}`);
  const { data: rows, error: e2 } = await supabase.from("site_settings").select("key, value").in("key", ["hero_video", "hero_poster", "hero_poster_mobile"]);
  if (e2) problems.push(`site_settings not readable: ${e2.message}`);
  else console.log(`  current homepage slots: ${rows.length ? rows.map((r) => `${r.key}=${r.value?.path}`).join(", ") : "none (emblem fallback)"}`);
  if (problems.length) { problems.forEach((p) => console.error(`✗ ${p}`)); process.exit(1); }
  console.log("✓ storage is ready for the hero video");
}

async function upload() {
  if (!dir) fail("upload needs the folder with the encoded files");
  await verify();
  const version = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "");
  const base = `hero/${version}`;
  for (const [name, contentType] of Object.entries(FILES)) {
    const bytes = await readFile(path.join(dir, name)).catch(() => fail(`missing ${name} in ${dir}`));
    const { error } = await supabase.storage.from(BUCKET).upload(`${base}/${name}`, bytes, { contentType, cacheControl: "31536000", upsert: false });
    if (error) fail(`upload ${name}: ${error.message}`);
    const pub = supabase.storage.from(BUCKET).getPublicUrl(`${base}/${name}`).data.publicUrl;
    const head = await fetch(pub, { method: "HEAD" });
    const type = head.headers.get("content-type");
    if (!head.ok || !type?.startsWith(contentType)) fail(`${name} is not served correctly (${head.status}, ${type})`);
    console.log(`  ✓ ${base}/${name}  ${(bytes.length / 1024).toFixed(0)} KB  ${type}`);
  }
  const slots = [
    { key: "hero_video", value: { path: `${base}/hero-desktop.mp4`, webm: `${base}/hero-desktop.webm`, mobile: `${base}/hero-mobile.mp4`, mobileWebm: `${base}/hero-mobile.webm`, alt: "" } },
    { key: "hero_poster", value: { path: `${base}/hero-poster-desktop.jpg`, alt: "" } },
    { key: "hero_poster_mobile", value: { path: `${base}/hero-poster-mobile.jpg`, alt: "" } },
  ];
  if (!flags.includes("--set")) {
    console.log("\nUploaded. The homepage is unchanged. To switch it on, re-run with --set, or apply:");
    for (const s of slots) console.log(`  insert into site_settings (key, value) values ('${s.key}', '${JSON.stringify(s.value)}') on conflict (key) do update set value = excluded.value;`);
    return;
  }
  const { error } = await supabase.from("site_settings").upsert(slots, { onConflict: "key" });
  if (error) fail(`site_settings: ${error.message}`);
  console.log("✓ homepage now uses this video");
}

await (cmd === "verify" ? verify() : upload());
