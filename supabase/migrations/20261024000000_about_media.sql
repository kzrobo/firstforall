-- About page photography and the team gallery.
-- Media values may now carry focal points for cropping: "focus": "50% 30%", "focusMobile": "60% 40%".
-- team_gallery items may set "layout": "wide" | "tall" | "standard".
alter table public.site_settings drop constraint if exists site_settings_key_check;
alter table public.site_settings add constraint site_settings_key_check check (key in (
  'hero_video', 'hero_poster', 'hero_poster_mobile',
  'film_video', 'film_poster',
  'photo_feature', 'photo_pair', 'photo_initiative',
  'about_hero', 'about_story', 'team_gallery',
  'contact_email', 'social_links'
));
