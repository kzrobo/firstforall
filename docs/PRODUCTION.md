# FIRST FOR ALL — production setup (status 2026-11-07)

## Where things are
| | |
|---|---|
| Private preview (team password) | https://firstforall-git-main-nursaya.vercel.app — every page asks for `SITE_ACCESS_PASSWORD` |
| Production address | https://firstforall.vercel.app — **nothing deployed yet** (production builds paused) |
| Vercel | team `nursaya`, project `firstforall`, linked to `kzrobo/firstforall` (`main`) |
| Supabase | project `xujypljqstjgueaeamfs` — all 7 migrations applied and recorded in `supabase_migrations.schema_migrations` |
| Admin | `/admin` — one super_admin (the founder account); public sign-ups are disabled |

## Content (all drafts until the team publishes)
- **Manuals:** BIOBUZZ Competition Manual TU07 — English source + 11 community translations (12 PDFs, 2,028 pages),
  byte-identical to the Drive originals, stored in the **private** `manuals-draft` bucket. Review in
  *Admin → Manuals → Preview*; **Publish edition** copies the files to the public library.
- **MAVERICKS hub:** 6 entries (GFAA, Discover BIOBUZZ, Mentoring Clutch, Access Control, One manual many languages,
  Greenhack Qazaqstan) with 26 images. Open review notes (e.g. Greenhack: MAVERICKS' role; partner names) are in
  `docs/hub/drive-2026-11-06.manifest.json` — resolve them before publishing.
- **LEARN:** 5 videos imported from FTC Builder Academy as drafts. Map playlists to categories and check the spoken
  language in *Admin → Lessons → Settings & playlists*, then publish.
- **Homepage video:** `public-media/hero/202611070454/` (MP4 + WebM, desktop + mobile, posters).

## Environment variables (Vercel, never in git)
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable key), `NEXT_PUBLIC_SITE_URL` — public.
`SUPABASE_SERVICE_ROLE_KEY` (dedicated secret key `vercel_server`), `CRON_SECRET`, `YOUTUBE_API_KEY`,
`SITE_ACCESS_PASSWORD` — Sensitive. Remove `SITE_ACCESS_PASSWORD` only when the team decides to go public.

## YouTube sync
- Auto-publish is **off**: new videos arrive as drafts.
- Schedule: Vercel Cron, daily 04:17 UTC (`vercel.json`) — **runs on production deployments only**, i.e. after going
  public. Until then use *Admin → Lessons → Sync now*. Hourly runs: add GitHub secrets `SITE_URL` and `CRON_SECRET`
  (`.github/workflows/youtube-sync.yml`; rotate `CRON_SECRET` in Vercel to a value you know).

## Going public (only with the team's approval)
1. Publish the reviewed manuals, hub entries and lessons in the admin.
2. Vercel → project → Settings → Git → clear the *Ignored Build Step* (it currently skips production builds).
3. Remove `SITE_ACCESS_PASSWORD` (or keep it for a private production) and redeploy `main` to production.

## Security checks done (2026-11-07)
Anonymous visitors: 0 rows from every table holding drafts or team data; draft PDFs unreachable (private bucket,
no public copy, bucket listing denied); auth admin API denied; every anonymous insert rejected, updates/deletes
affect 0 rows. Gate: all pages 401 without the password, `noindex`; `/api/cron/*` keeps its own secret;
Next's static assets and image optimizer bypass the gate by design but only serve code and already-public images.
