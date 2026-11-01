# Implementation plan
- [x] **A** Scaffold, tokens, header/footer, video hero, homepage, i18n (4 locales), schema + RLS, sign-in, admin guard.
- [x] **Redesign** (DESIGN_AUDIT.md). 
- [~] **B** Library, overview, PDF reader (zoom, fit, outline, search, download, fullscreen, page links, language switch). Remaining: admin upload flow; E2E against local Supabase with fixture PDF.
- [ ] **C** Admin CRUD + upload validation + draft preview (signed URLs), global search (Postgres FTS + PDF text), bookmarks.
- [ ] **D** Ingestion → chunks → embeddings (pgvector), `/api/ai` with citations, widget + `/ai`, stale invalidation.
- [ ] **E** Guides (sanitized Markdown, code copy, attachments, STL viewer), gallery, sponsors admin, media library.
- [ ] **F** Playwright E2E, axe a11y audit, security review, perf.
- [x] **Editorial redesign + LEARN (2026-11-01)**: light Swiss-editorial system, new IA (Home / Manuals / Learn / About), LEARN archive + lesson pages, secure lesson admin (create/edit/publish/unpublish/feature/order/delete), migration `20261101000000_learn.sql`. Verified against a local Postgres + PostgREST + GoTrue stack with real RLS.

