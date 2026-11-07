# XXVIII menu book: visual-first audit (7 Nov 2026)

Brief from the client: "properly audit the menu, specially text placement. image is the priority, 2nd is the text. make sure focus on showcasing visual."

Target: the live book at `https://technextmarketing.github.io/xxviii-steakhouse/menu/index.html` (source `menu/live/live.js`, `menu/live/live.css`, print `menu/print.html` → `menu/out/xxviii-menu.pdf`).

## Method

- Real headless Chrome over CDP (not the in-app browser pane, which stalls animation), fresh profile per size.
- The book driven by its own page turning: `LIVE.Book.goTo(k)` for k = 1 … 10, frames taken after the turn settles (3.4 s on the Ageing Room so the Day 1 → 28 sweep finishes).
- Phone and tablet course cards: each card scrolled inside `#cards` and stitched from viewport frames.
- **Sizes:**
  - 1440x900 and 1180x1000 show the 3D book.
  - 768x1024 is portrait, so it gets the course cards, as does 390x844.
- **Measures per page:**
  - **Photo share:** % of the page covered by visible photographs, clipped by their frames.
  - **Hero share:** the largest single picture as a % of the page.
  - **Text on photo:** text lines over a non-cut-out photograph.
  - **Ink clipping:** each glyph's ink box measured against every clipping ancestor (canvas `actualBoundingBox*`), clip-aware for zoomed crops and the odometer's hidden digits.
  - **One-word title lines:** V/GF badges are not counted as words.
  - **Emptiness:** `__emptiness`, the QA suite's 15 % rule.
  - **Margins and folios:** content-box insets, folio and running-head positions.
- **Flip check:** open the cover the moment the gate allows, `next()` through every spread and back, and sample every animation frame for images on visible or turning faces that are not decoded (`data-src` left, `!complete` or `naturalWidth == 0`).
- **Tools and frames** (outside the repo, in the shared notes folder `menu-visual/`):
  - `_tools/capture.py`, `metrics.js`, `check2.js`, `flipcheck.py`.
  - Frames in `before/` (live site) and `after/` (this build).

## Scores

Image-lead (1–5): how strongly the photography leads (hero size, crop, sharpness, scale against the text). Text (1–5): never over food, on the grid, consistent margins and folios, no orphans or one-word lines, no clipped glyphs, hierarchy, breathing room.

Margins and folios were consistent before and after on every page: the content box is inset 33 / 42 / 27 / 36 px (L) and 33 / 36 / 27 / 42 px (R) at 1440, the running head sits 33 px down, and the folio sits 27 px up. These scale with the page at 1180.

| Spread (1440 / 1180) | Image before | Image after | Text before | Text after | What changed |
|---|---|---|---|---|---|
| Cover | 5 | 5 | 5 | 5 | Unchanged (gate, foil, preload hairline) |
| 1 Dining room · Day One | 3 | 5 | 1 | 5 | Story was set on the dining-room photo under a veil (8 text lines on the photo); now the photo leads at the top and the story sits below on paper |
| 2 First Course | 3 | 5 | 2 | 5 | Plates 21 % → bigger alternating rows; 3 one-word title lines → 0; thin 13 % macro band removed; a close-up of each dish under its place card; empty 15 % → 3–4 % |
| 3 Garden · Kitchen | 4 | 4 | 3 | 5 | "Caesar, Prepared / Tableside" and "The Classic / Wedge" one-word lines fixed |
| 4 Ageing Room | 4 | 4 | 4 | 5 | Room strip 10.5 % → 15.5 % of the page; odometer given side room (no edge cut); 45-day rows unchanged ("Ready · hung earlier") |
| 5 Twenty-Eight · Sauces | 5 | 5 | 3 | 5 | Sauce ring re-seated: long names on the wide rows, so no "Chimichurri / Verde"-type one-word lines |
| 6 Long Wait | 4 | 5 | 3 | 5 | Enhancements: tiny cut-outs (truffle, marrow crust ~3 % of the page) → board photographs cropped to the plate |
| 7 Alongside · Beyond | 2 | 4 | 1 | 5 | Sides: eight thumbnail bowls with captions colliding ("Nutmeg, parmesan." over "Wild"; "sherry." over the footer) → a grid of real table photographs; lobster hero 14 % → 24 % of the page |
| 8 Doneness · Last Course | 4 | 4 | 3 | 5 | "55– / 57 °C" never splits; dessert names one line |
| 9 Bar · Good to know | 3 | 5 | 1 | 5 | Patience and the drinks list were set on the bar photo (8 lines); now the photo is on top and the type below |
| Back cover | 5 | 5 | 5 | 5 | Unchanged |
| Phone cards 390x844 | 4 | 4 | 2 | 5 | **P0 fixed:** Sauces & Butters labels were drawn over the filet plate and the sauce photos collapsed to dots (stale `.t--ring` card CSS); now a 2-column grid with a picture per sauce |
| Tablet cards 768x1024 | 4 | 4 | 2 | 5 | Same sauce-card fix |

## Measured before → after

- **Photo share at 1440** (same at 1180), by page:
  - **First Course:** L 37 → 47 %, R 35 → 52 %.
  - **Garden L:** 30 → 35 %.
  - **Ageing Room R:** 21 → 25 %.
  - **Sauces R:** 44 → 47 %.
  - **Long Wait R:** 34 → 39 %.
  - **Alongside:** L 20 → 29 %, R 27 → 36 %.
  - **Dining room L and Bar L:** 100 → 41 %. These went from a full-bleed ground under text to a photo-only frame with no type on it.
- **Text lines on a photograph:** 16 → 0 at each book size.
- **Text over pictures** (clip-aware): 42 → 0 hits per book size. On the Ageing Room the before count includes 9 odometer-digit artefacts; with the hidden-glyph rule it is 0.
- **One-word title lines:** 24 → 0 per book size.
- **Emptiness, worst page:** 15 % → 14 %. The First Course went from 15 / 10 % to 3 / 4 %. Every page in the PDF is at 14 % or under.
- **Clipped glyphs:** 0 at every size, after the clip-aware rule. On cards, one odometer digit was cut at the page edge before; now 0.
- **Text outside its page:** 0.
- **Console errors:** 0 at every size.
- **Half-loaded images:** 0. The mid-turn sample at every `goTo` found none, and neither did the flip check: 2,621 frames at 1440 and 2,568 at 1180, opening in about 840 ms.

## Fix list (all applied)

| # | Spread | Selector | Change |
|---|---|---|---|
| 1 | 1 L | `[data-sp=day-one].pg--l` | Removed `.bg` ground + `.veil--top/--bottom`; new `figure.story__ph > img.story__im` (main dining room, `object-position 34% 58%`) bleeding to both page edges under the running head (`flex 1.35; margin 0 -9.36% 1em -7.6%`); `.story__lead` 2.1 → 1.62em, `.story__honest` 1.5 → 1.3em, `.values` gap .9 → .6em, `dd` colour `--desc` |
| 2 | 9 L | `[data-sp=bar].pg--l` | Same treatment: `figure.barp__ph` (bar, `46% 52%`); `.barp__n` 3.8 → 3em with the price on the same row (`.barp__house` 2-col grid); list header no longer `--light`; `.dr .t__n` 1.45em |
| 3 | 2 L+R | `.tbl` | `tbl--a/--b` → `tbl--z`: three full-width rows per page, alternating `t--wide` / `t--wide t--flip` (columns 1.25fr / 1fr); `.tbl .t__n` 1.4em; `.mac--band` removed; `.t__crop` close-up under each place card (`FCX` focal points in `live.js`) |
| 4 | 3 L | `.g4 .t__n`, `nmCls` | Names 1.42em; three-word names longer than 22 letters get `.t__n--long` (`.nl` at .8em) so "Caesar, Prepared Tableside" holds one line |
| 5 | all | `nm()` | Three-word names (≤ 26 letters) never break; four words or more break only mid-name (first two and last two words bound with no-break spaces) |
| 6 | all | `withMk()`, `.mk` | Dietary marks ride on the name's last word (`.nw` wrapper, ` `), `.mk` nowrap |
| 7 | 4 L | `.odo__d` | `padding: 0 .08em` (side bearing of "3" no longer cut by the window) |
| 8 | 4 R | `.room__strip` | Height 10.5 % → 15.5 % |
| 9 | 5 R | `RING`, `.rg`, `rgName` | Positions with widths per sauce (short names at the sides, long ones on the 40 % bottom row); names ≤ 20 letters on one line; `.rg__n` letter-spacing .14 → .1em; removed the `nth-child` width rule |
| 10 | 6 R | `.e4` | Enhancements use `X.block(img,'md')` as `t--photo t--board` (`object-position 56% 56%`, scale 1.3); `.e4` flex .95 → 1.05 |
| 11 | 7 L | `.s8` | Sides use `X.img(img,'plated','md')` as `t--photo t--side` (`50% 66%`, scale 1.42); names 1.3em; gap .85em |
| 12 | 7 R | `.beyond__*`, `.b3` | `beyond__top` flex 1.4/1.25; hero `margin -.6em -16% 0 4%`, image scale 1.12; `.b3` columns 44 % / 1fr; names 1.3em (no overlap of "Beurre blanc…" with "Herb-Crusted") |
| 13 | 8 L | `.done__g`, `.nw` | Columns .95fr / 1.12fr (slices larger); "55–57 °C" wrapped in `.nw` |
| 14 | 8 R | `.dt .t__n` | 1.45em so "Dark Chocolate Fondant V" fits on one line |
| 15 | cards | `.card .rg`, `.card .rg__ph`, `.card .story__ph/.barp__ph`, `.card .t__crop` | Sauce grid static (`width:auto !important`), 34vw pictures; photo-top pages 74vw edge to edge; crops 40vw |
| 16 | print | `_src/compress_pdf.py` | Save with `garbage=4` (merges the identical page-edge shading on every page); photos 115 dpi q 52, masks q 70; page 2 is no longer a "ground" page. 20 pages, 5.95 MB (was 5.85 MB) |

## Kept as they were (checked)

- **Seamless flips:** every page is preloaded and decoded behind the cover; no lazy loading. `Preload.fit` now picks larger files for the bigger pictures automatically.
- **Cover gate:** the cover lifts only once the first spreads are decoded and painted.
- **Shadow:** locked to the book, moved in the same rAF tick by `Book.apply()`; untouched.
- **45-day rows:** they read "Ready · hung earlier" at opening (QA test passes).
- **Phone course cards:** they keep their preload.
- **Assets:**
  - Every dish is still pictured, with prices and ages from `assets/data/xxviii.js`.
  - The interiors and all five dry-age room shots are used.
  - No cabinet photo anywhere.

## QA

- **`python -B menu/tools/run_qa.py`:**
  - 1440x900: 40 pass, 0 fail.
  - 1180x1000: 40 pass, 0 fail.
  - 768x1024: 17 pass, 0 fail.
  - 390x844: 17 pass, 0 fail.
  - 1440x900 reduced motion: 40 pass, 0 fail.
  - Page turn p95 12.6 ms.
- **`_src/render.py`:** overflow [], clipped titles [], emptiness ≤ 14 % per page, type ≥ 12.7 pt.

## Round 2: smaller type, bigger pictures (client: "make the text smaller make the image bigger")

- **Type, desktop:**
  - Course titles `.hd__t` 2.55 → 2.3em.
  - Dish names `.t__n` 1.7 → 1.45em. In context: `.tbl` 1.25, `.g4` 1.25, sides and enhancements 1.12, `.b3` 1.2, `.dt` 1.3, `.bt__n` 1.5, `.t28__n` 2.1em.
  - Prices 1.3 → 1.15em; descriptions .9em (sides and enhancements .84em).
  - Story lead 1.45em, Patience 2.6em, kitchen line 1.5em.
- **Type, phones:** descriptions stay at 16 px (QA legibility rule).
- **Pictures:**
  - First Course plates 1.25fr → 1.4fr of each row.
  - Dessert plates 39 → 42 % wide, re-spaced (captions 128 % of the plate).
  - Photo share at 1440: Garden L 35 → 40 %, Long Wait L 36 → 39 % and R 39 → 45 %, Alongside L 29 → 39 % and R 36 → 43 %.
- **Checks:**
  - Emptiness ≤ 14 % on every page at every size.
  - 0 clipped glyphs, 0 text on photographs, 0 one-word title lines, 0 console errors.
  - QA suite all pass: 40 / 40 / 17 / 17 tests, plus reduced motion.
  - Flip check: 0 half-loaded images over 2,045 frames.
  - PDF 5.78 MB (photos 110 dpi).
