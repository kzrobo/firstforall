// Shared rules for MAVERICKS hub import manifests (used by scripts/import-hub.mjs and unit tests).
// Keep CATEGORY_SECTIONS in sync with src/lib/hub/categories.ts — a unit test enforces it.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

export const CATEGORY_SECTIONS = {
  inspires: ["problem", "solution", "approach", "results", "impact"],
  connects: ["overview", "topics", "outcomes"],
  builds: ["challenge", "design", "iterations", "results"],
  teaches: ["overview", "format", "materials", "results"],
  reaches: ["overview", "audience", "activities", "outcomes"],
  achieves: ["overview", "result", "evidence"],
  sustains: ["overview", "approach", "impact"],
};
export const STAGES = ["concept", "in_development", "prototype", "pilot", "active", "completed", "paused"];
export const KINDS = ["photo", "screenshot", "graphic"];
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** JPEG / PNG / WebP by magic bytes (same rule as the admin upload). */
export function sniffImage(b) {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: "jpg", type: "image/jpeg" };
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { ext: "png", type: "image/png" };
  if (b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP") return { ext: "webp", type: "image/webp" };
  return null;
}

/**
 * Checks a manifest without touching the network. Returns one report per entry
 * ({ entry, images: [{file, bytes, sha256, type, alt, caption, kind}], logo, problems }) plus manifest-wide problems.
 */
export function checkManifest(manifest, baseDir, read = readFileSync) {
  const entries = Array.isArray(manifest?.entries) ? manifest.entries : [];
  const global = entries.length ? [] : ["manifest has no entries"];
  const seenSlugs = new Set(), seenHashes = new Map();
  const reports = entries.map((e) => {
    const problems = [];
    if (!CATEGORY_SECTIONS[e.category]) problems.push(`unknown category "${e.category}"`);
    if (!e.slug || !SLUG.test(e.slug) || e.slug.length > 80) problems.push(`invalid slug "${e.slug}"`);
    const key = `${e.category}/${e.slug}`;
    if (seenSlugs.has(key)) problems.push(`duplicate entry ${key}`); else seenSlugs.add(key);
    if (typeof e.title !== "string" || e.title.length < 2 || e.title.length > 160) problems.push("title must be 2–160 characters");
    if (e.subtitle && e.subtitle.length > 240) problems.push("subtitle longer than 240 characters");
    if (e.summary && e.summary.length > 800) problems.push("summary longer than 800 characters");
    if (e.stage != null && !STAGES.includes(e.stage)) problems.push(`unknown stage "${e.stage}"`);
    for (const k of Object.keys(e.sections ?? {})) if (!CATEGORY_SECTIONS[e.category]?.includes(k)) problems.push(`section "${k}" is not used by ${e.category}`);
    const images = [];
    for (const m of e.media ?? []) {
      if (!KINDS.includes(m.kind ?? "photo")) problems.push(`${m.file}: unknown kind "${m.kind}"`);
      if (!m.alt || m.alt.length > 300) problems.push(`${m.file}: alt text is required (≤ 300 characters)`);
      let bytes;
      try { bytes = read(path.resolve(baseDir, m.file)); } catch { problems.push(`${m.file}: file not found`); continue; }
      const t = sniffImage(bytes);
      if (!t) { problems.push(`${m.file}: not a JPEG, PNG or WebP image`); continue; }
      if (bytes.length > MAX_IMAGE_BYTES) problems.push(`${m.file}: larger than 8 MB`);
      const sha256 = createHash("sha256").update(bytes).digest("hex");
      if (seenHashes.has(sha256)) problems.push(`${m.file}: same image as ${seenHashes.get(sha256)} (no duplicate photographs)`); else seenHashes.set(sha256, m.file);
      images.push({ file: m.file, bytes, sha256, ...t, alt: m.alt, caption: m.caption, kind: m.kind ?? "photo" });
    }
    if (e.cover && !(e.media ?? []).some((m) => m.file === e.cover)) problems.push(`cover "${e.cover}" must be one of the entry's media files`);
    // Partner team, place and logo (MAVERICKS Connects). All optional; give only verified facts.
    if (e.team != null) {
      if (typeof e.team.name !== "string" || e.team.name.length < 1 || e.team.name.length > 120) problems.push("team.name must be 1–120 characters");
      if (e.team.number != null && !(Number.isInteger(e.team.number) && e.team.number >= 1 && e.team.number <= 999999)) problems.push(`team.number must be an FTC number (1–999999), got ${e.team.number}`);
    }
    const loc = e.location;
    if (loc != null) {
      if (loc.countryCode != null && !/^[A-Z]{2}$/.test(loc.countryCode)) problems.push(`location.countryCode must be ISO 3166-1 alpha-2 (e.g. "KZ"), got "${loc.countryCode}"`);
      if (loc.city != null && (typeof loc.city !== "string" || loc.city.length > 80)) problems.push("location.city must be ≤ 80 characters");
      const hasLat = loc.latitude != null, hasLng = loc.longitude != null;
      if (hasLat !== hasLng) problems.push("location needs both latitude and longitude, or neither");
      if (hasLat && !(typeof loc.latitude === "number" && Math.abs(loc.latitude) <= 90)) problems.push("location.latitude must be between -90 and 90");
      if (hasLng && !(typeof loc.longitude === "number" && Math.abs(loc.longitude) <= 180)) problems.push("location.longitude must be between -180 and 180");
      if (hasLat && !loc.city) problems.push("exact coordinates need the city they belong to");
    }
    let logo = null;
    if (e.logo != null) {
      let bytes;
      try { bytes = read(path.resolve(baseDir, e.logo)); } catch { problems.push(`logo ${e.logo}: file not found`); }
      if (bytes) {
        const t = sniffImage(bytes);
        if (!t) problems.push(`logo ${e.logo}: not a JPEG, PNG or WebP image`);
        else if (bytes.length > MAX_IMAGE_BYTES) problems.push(`logo ${e.logo}: larger than 8 MB`);
        else logo = { file: e.logo, bytes, sha256: createHash("sha256").update(bytes).digest("hex"), ...t };
      }
    }
    return { entry: e, images, logo, problems };
  });
  return { reports, problems: global };
}
