-- Configurable homepage photography/video slots.
-- Values: { "path": "<public-media path>", "alt": "...", "caption": "..." }
--   or for multi-image slots: { "items": [ { "path", "alt", "caption" }, ... ] }
alter table public.site_settings drop constraint if exists site_settings_key_check;
alter table public.site_settings add constraint site_settings_key_check check (key in (
  'hero_video', 'hero_poster', 'hero_poster_mobile',
  'film_video', 'film_poster',
  'photo_feature', 'photo_pair', 'photo_initiative',
  'contact_email', 'social_links'
));
