-- MAVERICKS hub: readable PDF documents on an entry (e.g. a comic or booklet in several languages).
-- [{"path": "hub/<category>/<slug>/<lang>-<sha12>.pdf", "language": "kk", "pages": 36, "bytes": 36232660}]
-- Files live in the public 'manuals-public' bucket (PDF only, 50 MB per file); one document per language.
-- Additive and safe to re-run: existing rows get an empty list.
alter table public.hub_entries
  add column if not exists documents jsonb not null default '[]';

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'hub_entries_documents_is_array') then
    alter table public.hub_entries
      add constraint hub_entries_documents_is_array check (jsonb_typeof(documents) = 'array');
  end if;
end $$;
