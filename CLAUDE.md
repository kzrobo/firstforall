# FIRST FOR ALL — MANUAL FOR ALL (MAVERICKS FTC #24034)

Documentation-first platform for multilingual FTC manuals. Community project — never present as official FIRST.

## Stack
Next.js 15 App Router · TypeScript strict · Tailwind v4 (tokens in `src/app/globals.css`) · Supabase (Postgres/Auth/Storage, RLS) · PDF.js · Zod · Vitest.

## Layout
- `src/i18n/` — UI locales en/kk/ru/es; dictionaries fall back to English. UI language ≠ document language.
- `src/lib/manuals/` — Zod types, server repository (published only), pure filter + reader-nav logic.
- `src/components/reader/` — PDF.js reader (lazy page rendering, outline, search, zoom).
- `supabase/migrations/` — schema + RLS. Security lives in DB + server, never client-side hiding.

## Commands
`npm run dev` · `npm run build` · `npm run typecheck` · `npm run lint` · `npm test`

## Rules
- No fake data: no invented manuals, sponsors, stats, photos, AI answers. Use empty/upload-ready states.
- Public pages show only `status = 'published'` rows (RLS + repository filter).
- Never assume translations share pagination; map pages only via `section_map`.
- Secrets server-side only. No service-role key in client code.
- Ship only features that work end-to-end; unfinished ones say so.
- Keep `build`, `lint`, `test` green; add unit tests for pure logic.
