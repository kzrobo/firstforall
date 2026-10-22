# Architecture
- **Rendering:** Server Components fetch via `src/lib/*/repository.ts` (request-scoped Supabase client, RLS as the visitor). Client components only for interactivity.
- **Security:** RLS on every table; `is_team_member()`, `can_publish()`, `current_role()` (security definer). `getTeamSession()` guards `/admin` server-side. No public sign-up.
- **i18n:** cookie `ffa_locale` → Accept-Language → `en`. Dictionaries deep-merged over English. Inter Latin + Cyrillic(-ext) covers kk/ru/es.
- **Reader:** PDF.js dynamic import; fixed-size page slots rendered to canvas only near viewport. URL synced to `?lang=&page=`. Language switch uses `mapPageAcrossTranslations` (section map → else page 1 + notice).
- **Design system:** `@theme` tokens (canvas, navy, tech blue, honey accent, moss, line); Inter; asymmetric editorial grids; honey-rule eyebrows as the BioBuzz motif.
- **AI (planned):** server route → retrieve published `ai_chunks` → Claude with passages as quoted data → citations validated against retrieved chunk IDs only; rate-limited.
