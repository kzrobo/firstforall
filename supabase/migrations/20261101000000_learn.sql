-- LEARN / FTC Builder Academy: categories and YouTube lessons.
-- Lessons store only a validated 11-character YouTube video id — never embed HTML.

create table public.lesson_categories (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  -- Interface names per UI locale, e.g. {"en": "FTC Basics", "kk": "..."}; English is required.
  names         jsonb not null check (names ? 'en'),
  display_order integer not null default 0,
  created_at    timestamptz not null default now()
);

create table public.lessons (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  youtube_id       text not null check (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  title            text not null check (char_length(title) between 2 and 160),
  description      text check (description is null or char_length(description) <= 4000),
  category_id      uuid not null references public.lesson_categories (id) on delete restrict,
  language_code    text not null check (language_code ~ '^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$'), -- spoken language (BCP 47)
  duration_seconds integer check (duration_seconds is null or duration_seconds between 1 and 86400),
  is_featured      boolean not null default false,
  status           public.publication_state not null default 'draft',
  display_order    integer not null default 0,
  created_by       uuid references auth.users (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  published_at     timestamptz
);
create index lessons_public_order on public.lessons (status, display_order, published_at desc);
create unique index lessons_single_featured on public.lessons (is_featured) where is_featured;

create trigger lessons_touch before update on public.lessons for each row execute function public.touch_updated_at();

create or replace function public.stamp_lesson_publication() returns trigger language plpgsql as $$
begin
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    new.published_at = coalesce(new.published_at, now());
  end if;
  return new;
end $$;
create trigger lessons_publication before insert or update on public.lessons
  for each row execute function public.stamp_lesson_publication();

alter table public.lesson_categories enable row level security;
alter table public.lessons enable row level security;

create policy "public reads categories" on public.lesson_categories for select using (true);
create policy "super admins manage categories" on public.lesson_categories
  for all using (public.current_role() = 'super_admin') with check (public.current_role() = 'super_admin');

create policy "public reads published lessons" on public.lessons
  for select using (status = 'published' or public.is_team_member());
create policy "team inserts lessons" on public.lessons
  for insert with check (public.is_team_member() and (status <> 'published' or public.can_publish()));
create policy "team updates lessons" on public.lessons
  for update using (public.is_team_member())
  with check (status <> 'published' or public.can_publish());
create policy "publishers delete lessons" on public.lessons
  for delete using (public.can_publish());

insert into public.lesson_categories (slug, names, display_order) values
  ('ftc-basics',     '{"en":"FTC Basics","kk":"FTC негіздері","ru":"Основы FTC","es":"Fundamentos de FTC"}', 1),
  ('cad-design',     '{"en":"CAD & Design","kk":"CAD және жобалау","ru":"CAD и проектирование","es":"CAD y diseño"}', 2),
  ('robot-building', '{"en":"Robot Building","kk":"Робот құрастыру","ru":"Сборка робота","es":"Construcción del robot"}', 3),
  ('programming',    '{"en":"Programming","kk":"Бағдарламалау","ru":"Программирование","es":"Programación"}', 4)
on conflict (slug) do nothing;
