# YouTube → LEARN automatic import

New public videos on the **FTC Builder Academy** channel (`UCvNENrJ9fRJP4nO4YZu5jsg`) appear on `/learn`
without anyone pasting a link. Lessons added by hand in the admin keep working exactly as before.

## How it works

```
scheduler (hourly) ──POST + Bearer CRON_SECRET──▶ /api/cron/youtube-sync
                                                        │  YOUTUBE_API_KEY (server only)
                                                        ▼
                         YouTube Data API v3: playlistItems (uploads + mapped playlists), videos
                                                        │  plan (src/lib/youtube/plan.ts, pure + unit-tested)
                                                        ▼
                         Supabase `lessons` (service role)  +  `youtube_sync_runs` log
```

- **What is imported:** public, processed, embeddable, non-live videos of the channel. Title, description,
  thumbnail, publication date, duration, video id (the watch URL is built from it). Spoken language from
  YouTube's audio language, else the default in the settings.
- **No duplicates:** one lesson per video id, enforced by a unique index; inserts use `ON CONFLICT DO NOTHING`.
  A lesson someone already added by hand for a channel video is *adopted*: all its fields are locked, nothing
  visible changes.
- **Your edits are never overwritten:** YouTube's values are stored in separate `youtube_*` columns. Editing
  a lesson's title, description, category or duration locks that field ("Keep in sync with YouTube" boxes
  on the edit page). Status, featured, order and language are never changed by the sync after import.
- **Categories:** map channel playlists to lesson categories in *Admin → Lessons → Settings & playlists*.
  Unmapped videos use the default category.
- **Unavailable videos** (made private, deleted, embedding switched off) are hidden from `/learn`, never
  deleted, and come back automatically when public again.
- **Deleted lessons stay deleted:** deleting an imported lesson records the video as ignored; allow it again
  on the settings page.
- **Failures are harmless:** visitors only read the database. A YouTube outage, wrong key or exhausted
  quota is logged as a failed run and retried next hour; nothing changes.
- **Quota:** about 1 unit per 50 videos per list call — a few units per run, ~100–200 a day hourly,
  against the default 10,000/day. Each run's units are shown in the run log.
- **Privacy:** thumbnails come from YouTube's image CDN; the player is the privacy-enhanced
  `youtube-nocookie.com` embed and loads only when a visitor presses play.

## Remaining setup (production)

1. **Apply the migration** `supabase/migrations/20261107000000_youtube_sync.sql` to the production database
   (`supabase db push`, or paste it into the SQL editor). It stops with a clear message if two lessons
   already share a video — merge those first. Existing lessons are not modified.
2. **Create a YouTube Data API key** — Google Cloud Console → *APIs & Services* → enable
   **YouTube Data API v3** → *Credentials* → *Create credentials → API key*. Restrict it:
   *API restrictions → YouTube Data API v3* (no application restriction is needed for a server key).
3. **Set server environment variables** on the hosting provider (never `NEXT_PUBLIC_`, never in git):
   - `YOUTUBE_API_KEY` — the key from step 2
   - `SUPABASE_SERVICE_ROLE_KEY` — Supabase → *Project settings → API → service_role*
   - `CRON_SECRET` — a long random string, e.g. `openssl rand -hex 32`
4. **Turn on the schedule** — choose one:
   - **GitHub Actions (included, any host):** add repository secrets `SITE_URL` (e.g. `https://…`) and
     `CRON_SECRET` (same value as step 3). `.github/workflows/youtube-sync.yml` then runs hourly; until
     both secrets exist it only prints a notice. Run it once by hand from the *Actions* tab.
   - **Vercel Cron:** add to `vercel.json`
     `{"crons":[{"path":"/api/cron/youtube-sync","schedule":"23 * * * *"}]}` — Vercel sends
     `Authorization: Bearer $CRON_SECRET` automatically. (Hobby plans allow one run per day: use `"23 6 * * *"`.)
5. **First run:** *Admin → Lessons → Sync now*, or `CRON_SECRET=… npm run youtube:sync -- https://your-site`.
   Check *Settings & playlists → Recent runs*, then map the channel's playlists to categories.

Settings to review first: **Publish new videos right away** (on by default — switch off to receive new
videos as drafts) and the **default category / language**.

## Local testing without a key

```bash
node scripts/dev/mock-youtube-api.mjs 4010     # serves clearly labelled LOCAL TEST videos
YOUTUBE_API_BASE=http://localhost:4010 YOUTUBE_API_KEY=local-test-key \
SUPABASE_SERVICE_ROLE_KEY=<local service key> CRON_SECRET=local-secret npm run start
curl -X POST localhost:4010/__mock/state -d '{"videos":[{"id":"LTvideo0001","title":"LOCAL TEST — demo","publishedAt":"2026-11-01T10:00:00Z"}]}'
CRON_SECRET=local-secret npm run youtube:sync -- http://localhost:3000
```

Rules are unit-tested in `tests/unit/youtube-sync.test.ts`.
