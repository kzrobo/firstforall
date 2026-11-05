# FIRST FOR ALL — MANUAL FOR ALL (MAVERICKS FTC #24034)

Documentation-first platform for multilingual FTC manuals. Community project — never present as official FIRST.

## Stack
Next.js 15 App Router · TypeScript strict · Tailwind v4 (tokens in `src/app/globals.css`) · Supabase (Postgres/Auth/Storage, RLS) · PDF.js · Zod · Vitest.

## Design system (light editorial, 2026-11-05)
- Tokens in `src/app/globals.css` `@theme`: white `#FFFFFF` (`canvas`, ~85% of the site), neutral `#F7F7F5` (`paper`: the occasional section, admin workspace, reader chrome), ink `#111111`, secondary `#555555` (`ink-muted`), metadata `#6B6B6B` (`ink-faint`, ≥ 5:1), MAVERICKS navy `#00102B` (`navy`/`accent`: primary buttons, active marks, brand type), light cool blue `#DCE8F5` (`mist`: rare highlights, stage tags). Hairlines `line`, section rules `rule`, input borders `line-strong` (≥ 3:1).
- Over photography/video use the `.on-media` scope (same token names, inverted to white); `.on-canvas` resets inside it. The hero video gets a navy tint, never a white wash.
- No neon, glow, glassmorphism, decorative gradients, floating shapes, numbered section labels or uppercase eyebrows. PDF pages stay white — never recolour documents.
- Type: Unbounded only for display lines and page titles (`.t-display`, `.t-h1`) and the FIRST FOR ALL lockup. Everything else is Inter: `.t-h2`/`.t-h3` (semibold, tight), `.t-statement`, `.t-lead`, `.t-index`/`.t-label`/`.t-meta` (≥ 14px). Sentence case; nothing under 13px.
- Primary action `.btn-primary` (navy, 6px radius); `.btn-secondary` outline; text links `.link-arrow`/`.link-rule`. Photos get a 3px radius; pills only for filters.
- 12-column grid, `gap-x-6`, container `max-w-content` + `px-5 lg:px-10`. Every section composes differently; avoid card grids.
- Real media only. Bundled team media in `src/content/media.ts` + `src/content/team.ts` (DB slots override); see `docs/ASSETS.md`. The gallery shows only real `team_gallery` photos and is hidden when empty.

## Layout
- `src/i18n/` — UI locales en/kk/ru/es; dictionaries fall back to English. UI language ≠ document language.
- `src/lib/manuals/` — Zod types, server repository (published only), pure filter + reader-nav logic.
- `src/components/reader/` — PDF.js reader (lazy page rendering, outline, search, zoom). Every `getDocument` uses `PDF_OPTIONS` (cmaps + standard fonts copied to `public/pdfjs` by `scripts/copy-pdfjs-assets.mjs`); without them non-embedded CJK text silently disappears.
- `scripts/import-manuals.mjs` — validate/import real manual PDFs from a manifest (unmodified files, draft by default, never overwrites).
- `src/lib/learn/` + `src/app/learn`, `src/app/admin/lessons` — LEARN (YouTube lessons). Only validated 11-char video ids are stored; embeds are click-to-play youtube-nocookie.
- `src/app/mavericks/team` — the 14-member roster (`src/content/team.ts`; `lead` = documented leadership, `verify` = still to confirm, never shown). `HubNav` links overview · seven directions · team.
- `src/lib/hub/` + `src/app/mavericks`, `src/app/admin/hub` — MAVERICKS hub (7 editorial categories, not FIRST award titles). `hub_entries` table; per-category sections in `categories.ts`. Connects globe = `src/components/hub/globe/` (react-globe.gl, client-only; origin Shymkent; city coords only when entered, else country centroid labelled as such; the archive list is the keyboard path).
- Home hero is a full-viewport background video (`hero_video` slot: MP4 + WebM, optional portrait `mobile`/`mobileWebm`; `hero_poster` + `hero_poster_mobile`), with a subtle midnight overlay under white type. The current clip is third-party event footage used with the rights holder's permission for website use (confirmed by the team 2026-11-04) — website only. Upload/verify with `scripts/hero-video.mjs`. The emblem is branding; it only fills the hero if no video is configured — never the team group photo.
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
