-- LEARN: automatic import of FTC Builder Academy videos from YouTube (Data API v3).
--
-- Editorial columns (title, description, category, duration, status, order, featured) stay the
-- source of truth for the website. YouTube's own values are kept separately in youtube_* columns,
-- and the sync writes an editorial column only while it is not in locked_fields — an admin edit
-- locks the field, so automatic updates never overwrite manual work.
-- Existing rows are not modified: they get source = 'manual' and empty YouTube metadata.

-- 1 · Duplicate guard. One lesson per YouTube video, enforced by the database.
do $$
declare dupes text;
begin
  select string_agg(youtube_id, ', ') into dupes
  from (select youtube_id from public.lessons group by youtube_id having count(*) > 1) d;
  if dupes is not null then
    raise exception 'Lessons share YouTube videos (%). Merge or delete the duplicates, then rerun this migration.', dupes;
  end if;
end $$;
create unique index lessons_youtube_id_key on public.lessons (youtube_id);

-- 2 · YouTube metadata on lessons
alter table public.lessons
  add column source text not null default 'manual' check (source in ('manual', 'youtube')),
  add column locked_fields text[] not null default '{}'
    check (locked_fields <@ array['title', 'description', 'category_id', 'duration_seconds']::text[]),
  add column youtube_title text check (youtube_title is null or char_length(youtube_title) <= 300),
  add column youtube_description text check (youtube_description is null or char_length(youtube_description) <= 10000),
  add column youtube_published_at timestamptz,
  add column youtube_duration_seconds integer check (youtube_duration_seconds is null or youtube_duration_seconds >= 0),
  -- Only YouTube's image CDN is accepted (the sync validates; the check is the backstop).
  add column thumbnail_url text check (thumbnail_url is null or thumbnail_url ~ '^https://i[0-9]?\.ytimg\.com/' or thumbnail_url ~ '^http://(localhost|127\.0\.0\.1):[0-9]+/'),
  add column youtube_playlist_ids text[] not null default '{}',
  -- 'available' · 'unavailable' (private, deleted, not embeddable…): hidden from the public site until it is back.
  add column youtube_availability text check (youtube_availability in ('available', 'unavailable')),
  add column youtube_unavailable_reason text check (youtube_unavailable_reason is null or char_length(youtube_unavailable_reason) <= 120),
  add column youtube_synced_at timestamptz;

-- 3 · Sync settings (one row) and playlist → category mapping
create table public.youtube_sync_settings (
  id                  boolean primary key default true check (id),
  channel_id          text not null default 'UCvNENrJ9fRJP4nO4YZu5jsg' check (channel_id ~ '^UC[A-Za-z0-9_-]{22}$'),
  enabled             boolean not null default true,
  -- New videos go live on /learn automatically; switch off to review them as drafts first.
  auto_publish        boolean not null default true,
  default_category_id uuid references public.lesson_categories (id) on delete set null,
  default_language    text not null default 'en' check (default_language ~ '^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$'),
  updated_at          timestamptz not null default now()
);
insert into public.youtube_sync_settings (id, default_category_id)
  values (true, (select id from public.lesson_categories order by display_order limit 1))
  on conflict (id) do nothing;

create table public.youtube_playlist_categories (
  playlist_id    text primary key check (playlist_id ~ '^[A-Za-z0-9_-]{10,64}$'),
  playlist_title text check (playlist_title is null or char_length(playlist_title) <= 300),
  category_id    uuid not null references public.lesson_categories (id) on delete cascade,
  -- When a video is in several mapped playlists, the lowest priority wins.
  priority       integer not null default 0,
  created_at     timestamptz not null default now()
);

-- 4 · Run log (written by the server job only, read by the team)
create table public.youtube_sync_runs (
  id          uuid primary key default gen_random_uuid(),
  trigger     text not null check (trigger in ('schedule', 'admin', 'cli')),
  status      text not null default 'running' check (status in ('running', 'ok', 'error', 'skipped')),
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  found       integer not null default 0,
  inserted    integer not null default 0,
  updated     integer not null default 0,
  unchanged   integer not null default 0,
  unavailable integer not null default 0,
  quota_units integer not null default 0,
  message     text check (message is null or char_length(message) <= 2000)
);
create index youtube_sync_runs_recent on public.youtube_sync_runs (started_at desc);
-- The run lock: at most one run can be 'running' at a time (a second concurrent start fails and is skipped).
create unique index youtube_sync_runs_one_running on public.youtube_sync_runs ((true)) where status = 'running';

alter table public.youtube_sync_settings enable row level security;
alter table public.youtube_playlist_categories enable row level security;
alter table public.youtube_sync_runs enable row level security;

create policy "team reads sync settings" on public.youtube_sync_settings for select using (public.is_team_member());
create policy "publishers change sync settings" on public.youtube_sync_settings
  for update using (public.can_publish()) with check (public.can_publish());
create policy "team reads playlist mapping" on public.youtube_playlist_categories for select using (public.is_team_member());
create policy "publishers manage playlist mapping" on public.youtube_playlist_categories
  for all using (public.can_publish()) with check (public.can_publish());
create policy "team reads sync runs" on public.youtube_sync_runs for select using (public.is_team_member());
-- No insert/update policy on youtube_sync_runs: only the server job (service role) writes it.

create trigger youtube_sync_settings_touch before update on public.youtube_sync_settings
  for each row execute function public.touch_updated_at();

-- 5 · Videos an admin deleted from the library: the sync never re-imports them (until allowed again).
create table public.youtube_ignored_videos (
  youtube_id text primary key check (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  title      text check (title is null or char_length(title) <= 300),
  created_at timestamptz not null default now()
);
alter table public.youtube_ignored_videos enable row level security;
create policy "team reads ignored videos" on public.youtube_ignored_videos for select using (public.is_team_member());
create policy "publishers manage ignored videos" on public.youtube_ignored_videos
  for all using (public.can_publish()) with check (public.can_publish());
