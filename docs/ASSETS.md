# Photography & media checklist

## Integrated (2026-11-02)
| File | Source | Used in |
|---|---|---|
| `public/media/team/mavericks-team-2026.jpg` (1280×960) | Team portrait supplied by MAVERICKS (also in the "Our dream team" post) | Home hero (bottom-anchored 16:9 crop), About opening (21:9) — via `src/content/media.ts` |
| `public/media/team/members/*.jpg` (14 × 3:4, ≤ 1200×1600, EXIF stripped) | Photos extracted from the team's own Figma "Instagram post" PDFs (posts 15, 18–30) | About → team roster, via `src/content/team.ts` (names from the post artwork, roles from the posts' text) |
| `public/brand/mavericks-emblem.jpg`, `mavericks-emblem-light.jpg` | Official emblem | Header, footer, hero caption, home closing band |

## Excluded
- `IMG_4497.MOV` — a montage of other teams at another organisation's event (not MAVERICKS footage). Treated as a visual reference only; **must not be published** without the rights holder's permission. It is not in the repo. If written permission arrives: encode a ≤ 15 s muted loop (H.264 MP4 + VP9 WebM, ~1–2 MB each), upload to `public-media/hero/`, set `hero_video` `{"path","webm","alt"}` and `hero_poster`. Until then the full-screen hero renders the emblem composition (never the team photo).
- `mavericks-wordmark.jpg` — kept in the repo, not used: its metallic lettering conflicts with the site's typography.
- The Instagram post layouts themselves (frames, ornaments, metallic names) — only the photographs were reused.

## Still wanted
- The original, full-resolution camera file of the team portrait (current copy is 1280 px wide and slightly soft full-bleed).
- Real MAVERICKS video for `hero_video` (muted loop, 10–15 s), robot/competition/workshop/outreach photos for `team_gallery`.
- Confirmation of name spellings and of the role "Cader" (Adem) in `src/content/team.ts`.

## Slots

Upload files to the `public-media` Supabase Storage bucket, then set the slot in `site_settings`:

```sql
insert into site_settings (key, value) values
  ('hero_poster', '{"path":"home/hero.jpg","alt":"MAVERICKS members assembling the drivetrain","focus":"60% 40%","focusMobile":"55% 35%"}')
on conflict (key) do update set value = excluded.value;
```

`focus` / `focusMobile` are CSS object-position percentages ("x% y%") that keep the subject in frame when cropped.

| Slot (key) | Where | Shape | Recommended file | What to photograph |
|---|---|---|---|---|
| `hero_video` (`path` MP4, optional `webm`) | Home hero, full viewport behind the nav | 16:9 source, cropped to any screen (use `focus`/`focusMobile`) | MP4 H.264 + WebM VP9, 1920×1080, ≤ 15 s loop, no audio, ≤ 4 MB | Footage you own or are licensed to use: building, testing, a match |
| `hero_poster` | Home hero — first frame, reduced-motion and data-saver fallback | 16:9 | JPG ≥ 1920 px, a frame of the video | Same moment as the video's first frame |
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
