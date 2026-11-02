# FIRST FOR ALL — MANUAL FOR ALL (MAVERICKS FTC #24034)

Documentation-first platform for multilingual FTC manuals. Community project — never present as official FIRST.

## Stack
Next.js 15 App Router · TypeScript strict · Tailwind v4 (tokens in `src/app/globals.css`) · Supabase (Postgres/Auth/Storage, RLS) · PDF.js · Zod · Vitest.

## Design system (dark editorial, from the MAVERICKS emblem)
- Tokens in `src/app/globals.css` `@theme`, sampled from the emblem: midnight `#020A1D` (page), deep navy `#071431` (`paper`: alternate sections, surfaces, inputs), indigo `#171638` (one band per page), soft white `#F5F8FF` (`ink`), cool grey-blue `#A9B4CC` / `#8893AE` (muted/faint), ice blue `#93C5FA` (`accent`/`tech`: links, active states — sparingly). All text pairs ≥ AA; input borders `line-strong` ≥ 3:1.
- No neon, glow, glassmorphism or decorative gradients; the only gradients are tonal fades that let photos dissolve into the page. PDF pages stay white — never invert documents.
- Type: Unbounded 400/500/600 for display & headings via `.t-display .t-h1 .t-h2 .t-h3 .t-statement`; Inter for reading, forms, tables, metadata, admin and the whole PDF reader. Sentence case.
- Primary action = `.btn-primary` (soft-white block, midnight text). One accent mark per page at most.
- 12-column grid, `gap-x-6`, container `max-w-content` + `px-5 lg:px-10`. Vary section openings; don't repeat one formula.
- Real media only. Bundled team media in `src/content/media.ts` + `src/content/team.ts` (DB slots override); see `docs/ASSETS.md`. Never publish third-party footage.

## Layout
- `src/i18n/` — UI locales en/kk/ru/es; dictionaries fall back to English. UI language ≠ document language.
- `src/lib/manuals/` — Zod types, server repository (published only), pure filter + reader-nav logic.
- `src/components/reader/` — PDF.js reader (lazy page rendering, outline, search, zoom).
- `src/lib/learn/` + `src/app/learn`, `src/app/admin/lessons` — LEARN (YouTube lessons). Only validated 11-char video ids are stored; embeds are click-to-play youtube-nocookie.
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
