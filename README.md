# FIRST FOR ALL — MANUAL FOR ALL

Community platform by MAVERICKS FTC #24034 for multilingual FTC documentation. Not an official FIRST product.

## Configuration
1. Create a Supabase project; run `supabase/migrations/*.sql` (`supabase db push` or SQL editor).
2. Copy `.env.example` → `.env.local`; fill `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Create your user in Supabase Auth, then grant the founder role:
   `insert into team_members (user_id, role) values ('<auth-user-uuid>', 'super_admin');`
4. Until the admin upload UI lands (Milestone C): upload the PDF to bucket `manuals-public`, insert rows into
   `manuals` and `manual_translations` (`status='published'`, `page_count` set; master first).
5. Hero video (only footage you have the rights to): apply the migrations, then on a trusted machine
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/hero-video.mjs verify          # checks bucket + slots
   NEXT_PUBLIC_SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/hero-video.mjs upload <dir> --set  # uploads 6 files, switches the homepage
   ```
   Without `--set` it only uploads and prints the SQL. File list and encoding settings: `docs/ASSETS.md`.

## MAVERICKS hub (`/mavericks`)
Apply `supabase/migrations/20261103000000_mavericks_hub.sql`. Then **Admin → MAVERICKS hub → New entry**:
- pick a category (Inspires, Connects, Builds, Teaches, Reaches, Achieves, Sustains) — the form shows only that category's fields;
- **Connects** (globe): partner team name, FTC number, logo, country, city and — for a city-accurate marker — latitude/longitude
  (e.g. Berlin `52.52`, `13.405`). No city → the marker sits at the country centre and is labelled "country-level";
- add screenshots/photos (JPEG/PNG/WebP ≤ 8 MB, alt text), milestones as `2026-03 | Prototype tested` lines, topics/outcomes in the sections;
- save as **Draft**, then **Published** (founders/editors with `can_publish`). Drafts and archived entries never reach public pages or the globe.
Only enter facts you can document — leave unknown fields empty.

## LEARN lessons
Sign in at `/login`, open **Admin → Lessons → Add lesson**, paste a YouTube link (watch, youtu.be or Shorts), add a title,
category and spoken language, then save as draft or publish (founders and editors with `can_publish`). Apply
`supabase/migrations/20261101000000_learn.sql` first; it creates the tables, policies and the four starter categories.

## Photos
See `docs/ASSETS.md` for every photo/video slot, its shape and how to set it.

## Develop
```bash
npm install
npm run dev     # http://localhost:3000
npm test
npm run build
```
See `docs/` for spec, architecture, content model and plan.
