# Content model
- `manuals` — master: slug, title, season, season_name, category, description, cover_path, source_url, source_language, revision, is_featured (max one), status, timestamps.
- `manual_translations` — one per (manual, BCP 47 language): file_path, file_size_bytes, revision, status, translation_credit, source_revision, page_count, `section_map` `[{key,page}]`, ingestion_status, timestamps.
  - Trigger: publish only if master is published and page_count set; changing file_path marks ingestion `stale`.
- `team_members` — role `super_admin|editor`, `can_publish` for editors.
- `sponsors` — only `confirmed=true` is public.
- `site_settings` — media refs (hero_video, hero_poster, film_video, film_poster…).
- Storage: `manuals-public` (public), `manuals-draft` (private), `public-media`.
Planned: `guides`, `guide_feedback`, `ai_chunks` (pgvector; manual/translation/season/revision/lang/page/section).
