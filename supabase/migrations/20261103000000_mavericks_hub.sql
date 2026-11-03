-- MAVERICKS hub: one content table for the seven editorial categories
-- (inspires, connects, builds, teaches, reaches, achieves, sustains).
-- Category-specific text lives in `sections` (validated per category by the app);
-- everything else is shared. Images go to the existing public-media bucket under hub/.

create type public.hub_category as enum ('inspires', 'connects', 'builds', 'teaches', 'reaches', 'achieves', 'sustains');
-- Honest development states: nothing is "completed" unless set so by the team.
create type public.project_stage as enum ('concept', 'in_development', 'prototype', 'pilot', 'active', 'completed', 'paused');

create table public.hub_entries (
  id               uuid primary key default gen_random_uuid(),
  category         public.hub_category not null,
  slug             text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  title            text not null check (char_length(title) between 2 and 160),
  subtitle         text check (subtitle is null or char_length(subtitle) <= 240),
  summary          text check (summary is null or char_length(summary) <= 800),
  -- {"problem": "...", "solution": "...", "topics": "...", ...}; keys checked by the app
  sections         jsonb not null default '{}' check (jsonb_typeof(sections) = 'object'),
  stage            public.project_stage,
  event_date       date,
  season           text check (season is null or char_length(season) <= 40),
  -- Location: ISO 3166-1 alpha-2 country; exact coordinates only when the city is verified.
  country_code     text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  city             text check (city is null or char_length(city) <= 80),
  latitude         double precision check (latitude is null or latitude between -90 and 90),
  longitude        double precision check (longitude is null or longitude between -180 and 180),
  -- Partner team (connects); FTC number only when verified.
  team_name        text check (team_name is null or char_length(team_name) <= 120),
  team_number      integer check (team_number is null or team_number between 1 and 999999),
  logo_path        text,
  cover_path       text,
  -- [{"path": "hub/...", "alt": "...", "caption": "...", "kind": "photo" | "screenshot"}]
  media            jsonb not null default '[]' check (jsonb_typeof(media) = 'array'),
  -- [{"date": "2026-03", "label": "..."}]
  milestones       jsonb not null default '[]' check (jsonb_typeof(milestones) = 'array'),
  video_youtube_id text check (video_youtube_id is null or video_youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  collaborators    text[] not null default '{}',
  related_ids      uuid[] not null default '{}',
  is_featured      boolean not null default false,
  display_order    integer not null default 0,
  status           public.publication_state not null default 'draft',
  created_by       uuid references auth.users (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  published_at     timestamptz,
  unique (category, slug),
  check ((latitude is null) = (longitude is null))
);
create index hub_entries_public on public.hub_entries (category, status, display_order);

create trigger hub_entries_touch before update on public.hub_entries
  for each row execute function public.touch_updated_at();
-- Reuses the generic publication stamp from the LEARN migration (sets published_at once).
create trigger hub_entries_publication before insert or update on public.hub_entries
  for each row execute function public.stamp_lesson_publication();

alter table public.hub_entries enable row level security;

create policy "public reads published hub entries" on public.hub_entries
  for select using (status = 'published' or public.is_team_member());
create policy "team inserts hub entries" on public.hub_entries
  for insert with check (public.is_team_member() and (status <> 'published' or public.can_publish()));
create policy "team updates hub entries" on public.hub_entries
  for update using (public.is_team_member())
  with check (status <> 'published' or public.can_publish());
create policy "publishers delete hub entries" on public.hub_entries
  for delete using (public.can_publish());
