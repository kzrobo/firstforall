# Photography & media checklist

No team photographs or footage have been received yet (only the MAVERICKS emblem files in `public/brand/`).
Every slot below is wired and tested; it shows nothing to visitors until a file is set, and a labelled frame in development.

Upload files to the `public-media` Supabase Storage bucket, then set the slot in `site_settings`:

```sql
insert into site_settings (key, value) values
  ('hero_poster', '{"path":"home/hero.jpg","alt":"MAVERICKS members assembling the drivetrain","focus":"60% 40%","focusMobile":"55% 35%"}')
on conflict (key) do update set value = excluded.value;
```

`focus` / `focusMobile` are CSS object-position percentages ("x% y%") that keep the subject in frame when cropped.

| Slot (key) | Where | Shape | Recommended file | What to photograph |
|---|---|---|---|---|
| `hero_video` | Home hero, right panel | fills panel (≈ 4:5 desktop, 16:10 tablet, 4:5 phone) | MP4 H.264, 1920×1080+, ≤ 15 s loop, muted, ≤ 8 MB | Real team footage: building, testing, a match |
| `hero_poster` | Home hero (shown until/without video, and on phones) | as above | JPG/WebP ≥ 2000 px long edge | Strongest single team photo; subject off-centre |
| `hero_poster_mobile` | Home hero on phones (optional) | 4:5 | ≥ 1200×1500 | Tighter crop of the same moment |
| `film_video` + `film_poster` | "Watch the film" dialog in the hero | 16:9 | MP4, poster 1920×1080 | Season film / promo video |
| `photo_feature` | Home (04) Team, large image | 4:5 | ≥ 1600×2000 | Team portrait or robot work, vertical |
| `photo_pair` (`items[0..1]`) | Home (04) Team, two small images | 4:3 each | ≥ 1200×900 | Details: CAD screen, wiring, pit, outreach |
| `about_hero` | About opening, full width | 21:9 desktop, 4:5 phone | ≥ 2800×1200 | Wide team photo (competition or workshop) |
| `about_story` | About (01) Who we are | 4:5 | ≥ 1200×1500 | Members at work |
| `photo_initiative` | About (02) (optional, legacy key) | 4:3 | ≥ 1600×1200 | Translation / teaching / outreach moment |
| `team_gallery` (`items`, each with `"layout": "wide" \| "tall" \| "standard"`) | About (04) Gallery mosaic | wide 3:2 · tall fills two rows · standard 4:3 | ≥ 1600 px long edge | Build season, competitions, workshops, outreach |

Gallery tips: start with a `wide`, follow with a `tall`, then two `standard`; do not repeat images to fill space.
Always write `alt` text that describes the photo (people, activity, place) — it is read by screen readers.
