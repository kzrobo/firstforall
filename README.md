# FIRST FOR ALL — MANUAL FOR ALL

Community platform by MAVERICKS FTC #24034 for multilingual FTC documentation. Not an official FIRST product.

## Configuration
1. Create a Supabase project; run `supabase/migrations/*.sql` (`supabase db push` or SQL editor).
2. Copy `.env.example` → `.env.local`; fill `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Create your user in Supabase Auth, then grant the founder role:
   `insert into team_members (user_id, role) values ('<auth-user-uuid>', 'super_admin');`
4. Until the admin upload UI lands (Milestone C): upload the PDF to bucket `manuals-public`, insert rows into
   `manuals` and `manual_translations` (`status='published'`, `page_count` set; master first).
5. Hero/film video: upload to `public-media`, then
   `insert into site_settings (key, value) values ('hero_video', '{"path":"hero.mp4"}');`

## Develop
```bash
npm install
npm run dev     # http://localhost:3000
npm test
npm run build
```
See `docs/` for spec, architecture, content model and plan.
