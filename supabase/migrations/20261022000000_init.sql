-- FIRST FOR ALL — initial schema
-- Roles, master manuals, translations, sponsors, site settings, storage and RLS.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------------
create type public.app_role as enum ('super_admin', 'editor');

create table public.team_members (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  role        public.app_role not null,
  display_name text,
  can_publish boolean not null default false,
  created_at  timestamptz not null default now()
);
alter table public.team_members enable row level security;

create or replace function public.current_role()
returns public.app_role language sql stable security definer set search_path = public as $$
  select role from public.team_members where user_id = auth.uid()
$$;

create or replace function public.is_team_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.team_members where user_id = auth.uid())
$$;

create or replace function public.can_publish()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.team_members
    where user_id = auth.uid() and (role = 'super_admin' or can_publish)
  )
$$;

create policy "members read team" on public.team_members
  for select using (public.is_team_member());
create policy "super admins manage team" on public.team_members
  for all using (public.current_role() = 'super_admin')
  with check (public.current_role() = 'super_admin');

-- ---------------------------------------------------------------------------
-- Manuals
-- ---------------------------------------------------------------------------
create type public.publication_state as enum ('draft', 'in_review', 'published', 'archived');
create type public.ingestion_status as enum ('pending', 'processing', 'indexed', 'failed', 'stale');

create table public.manuals (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title           text not null check (char_length(title) between 2 and 200),
  season          text not null,              -- e.g. '2025-2026'
  season_name     text,                       -- e.g. 'DECODE'
  category        text not null check (category in ('competition', 'game', 'engineering', 'safety', 'other')),
  description     text,
  cover_path      text,                       -- storage path in 'public-media'
  source_url      text,                       -- official FIRST source reference
  source_language text not null default 'en',
  revision        text not null,
  is_featured     boolean not null default false,
  status          public.publication_state not null default 'draft',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  published_at    timestamptz
);
create unique index manuals_single_featured on public.manuals (is_featured) where is_featured;

create table public.manual_translations (
  id                 uuid primary key default gen_random_uuid(),
  manual_id          uuid not null references public.manuals (id) on delete cascade,
  language_code      text not null check (language_code ~ '^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$'), -- BCP 47
  is_source          boolean not null default false,
  file_path          text not null,           -- storage path ('manuals-draft' or 'manuals-public')
  file_size_bytes    bigint,
  revision           text not null,
  status             public.publication_state not null default 'draft',
  translation_credit text,
  source_revision    text,                    -- revision of the source document this translates
  page_count         integer check (page_count > 0),
  section_map        jsonb,                   -- [{ "key": "4.5", "page": 31 }] used for cross-language jumps
  ingestion_status   public.ingestion_status not null default 'pending',
  uploaded_at        timestamptz not null default now(),
  published_at       timestamptz,
  updated_at         timestamptz not null default now(),
  unique (manual_id, language_code)
);
create index manual_translations_manual on public.manual_translations (manual_id);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger manuals_touch before update on public.manuals for each row execute function public.touch_updated_at();
create trigger translations_touch before update on public.manual_translations for each row execute function public.touch_updated_at();

-- A translation may only be published when its master manual is published.
create or replace function public.guard_translation_publish() returns trigger language plpgsql as $$
begin
  if new.status = 'published' then
    if not exists (select 1 from public.manuals m where m.id = new.manual_id and m.status = 'published') then
      raise exception 'Master manual must be published before its translations';
    end if;
    if new.page_count is null then
      raise exception 'page_count is required before publication';
    end if;
    new.published_at = coalesce(new.published_at, now());
  end if;
  -- Any file change invalidates previous AI indexing.
  if tg_op = 'UPDATE' and new.file_path is distinct from old.file_path then
    new.ingestion_status = 'stale';
  end if;
  return new;
end $$;
create trigger translations_guard before insert or update on public.manual_translations
  for each row execute function public.guard_translation_publish();

alter table public.manuals enable row level security;
alter table public.manual_translations enable row level security;

create policy "public reads published manuals" on public.manuals
  for select using (status = 'published' or public.is_team_member());
create policy "team inserts manuals" on public.manuals
  for insert with check (public.is_team_member() and (status <> 'published' or public.can_publish()));
create policy "team updates manuals" on public.manuals
  for update using (public.is_team_member())
  with check (status <> 'published' or public.can_publish());
create policy "super admins delete manuals" on public.manuals
  for delete using (public.current_role() = 'super_admin');

create policy "public reads published translations" on public.manual_translations
  for select using (
    (status = 'published' and exists (select 1 from public.manuals m where m.id = manual_id and m.status = 'published'))
    or public.is_team_member()
  );
create policy "team inserts translations" on public.manual_translations
  for insert with check (public.is_team_member() and (status <> 'published' or public.can_publish()));
create policy "team updates translations" on public.manual_translations
  for update using (public.is_team_member())
  with check (status <> 'published' or public.can_publish());
create policy "super admins delete translations" on public.manual_translations
  for delete using (public.current_role() = 'super_admin');

-- ---------------------------------------------------------------------------
-- Sponsors and site settings
-- ---------------------------------------------------------------------------
create table public.sponsors (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  logo_path     text,
  url           text check (url is null or url ~ '^https://'),
  description   text,
  category      text not null default 'partner',
  display_order integer not null default 0,
  confirmed     boolean not null default false,
  created_at    timestamptz not null default now()
);
alter table public.sponsors enable row level security;
create policy "public reads confirmed sponsors" on public.sponsors
  for select using (confirmed or public.is_team_member());
create policy "super admins manage sponsors" on public.sponsors
  for all using (public.current_role() = 'super_admin') with check (public.current_role() = 'super_admin');

create table public.site_settings (
  key        text primary key check (key in ('hero_video', 'hero_poster', 'film_video', 'film_poster', 'contact_email', 'social_links')),
  value      jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;
create policy "public reads settings" on public.site_settings for select using (true);
create policy "super admins manage settings" on public.site_settings
  for all using (public.current_role() = 'super_admin') with check (public.current_role() = 'super_admin');

-- ---------------------------------------------------------------------------
-- Storage: public bucket for published assets, private bucket for drafts
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('manuals-public', 'manuals-public', true, 104857600, array['application/pdf']),
  ('manuals-draft',  'manuals-draft',  false, 104857600, array['application/pdf']),
  ('public-media',   'public-media',   true, 524288000, array['image/jpeg','image/png','image/webp','video/mp4'])
on conflict (id) do nothing;

create policy "team writes manual files" on storage.objects
  for insert with check (bucket_id in ('manuals-draft', 'manuals-public', 'public-media') and public.is_team_member());
create policy "team updates manual files" on storage.objects
  for update using (bucket_id in ('manuals-draft', 'manuals-public', 'public-media') and public.is_team_member());
create policy "team reads drafts" on storage.objects
  for select using (bucket_id = 'manuals-draft' and public.is_team_member());
create policy "super admins delete files" on storage.objects
  for delete using (public.current_role() = 'super_admin');
