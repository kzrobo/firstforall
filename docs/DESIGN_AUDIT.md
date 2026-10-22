# Design audit — 2026-10-22 (before redesign)
Screenshots taken against a local mock API with a generated test PDF.
- Hero: empty navy grid, oversized two-colour headline, no media composition.
- Rhythm: every section = honey eyebrow + centered-container heading + paragraph. Seven identical beats.
- Empty states rendered as large boxes (film 21:9 dashed box, notice bars) → most of the page is placeholder.
- Two full navy slabs + navy footer → page reads dark despite "light" direction.
- Header: emblem JPG shows its black square; single flat bar, no hierarchy; CTA button is a yellow pill-like block.
- Library: text list, no document thumbnails, select-box filter row typical of dashboards.
- Reader: `scrollIntoView` scrolled the window (toolbar lost, footer visible inside reader). Mobile toolbar wraps to 4 rows.
