#!/usr/bin/env node
// Runs the YouTube → LEARN sync on a deployed site (or a local `next start`) by calling its
// protected endpoint. Usage:
//   CRON_SECRET=… node scripts/youtube-sync.mjs https://your-site.example
//   CRON_SECRET=… npm run youtube:sync -- http://localhost:3000
// The YouTube API key never leaves the server; this script only needs the cron secret.
const base = (process.argv[2] || process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "");
const secret = process.env.CRON_SECRET;
if (!base || !secret) {
  console.error("Usage: CRON_SECRET=… node scripts/youtube-sync.mjs <site-url>   (or set SITE_URL)");
  process.exit(2);
}
const res = await fetch(`${base}/api/cron/youtube-sync?trigger=cli`, { method: "POST", headers: { Authorization: `Bearer ${secret}` }, signal: AbortSignal.timeout(90_000) })
  .catch((e) => { console.error(`Could not reach ${base}: ${e.message}`); process.exit(1); });
const body = await res.json().catch(() => ({ status: "error", message: `HTTP ${res.status}` }));
console.log(`${body.status}: ${body.message}`);
if (body.found !== undefined) console.log(`found ${body.found} · inserted ${body.inserted} · updated ${body.updated} · unchanged ${body.unchanged} · unavailable ${body.unavailable} · quota ${body.quotaUnits} units`);
process.exit(body.status === "error" ? 1 : 0);
