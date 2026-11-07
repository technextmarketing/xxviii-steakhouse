# XXVIII · Twenty-Eight Steakhouse — Design Brief v1 (2026-11-07)

Client: a new premium dry-aged steakhouse (Manila, BGC area, placeholder). Agency: TechNext (do NOT show TechNext anywhere on these pages — client isolation).
Project root: `C:\Users\leuss\ClaudeWork\xxviii-steakhouse` · preview server: `python -m http.server 4628 --bind 127.0.0.1 --directory <root>` → http://127.0.0.1:4628/

## 0. Deliverables and file ownership (each builder owns ONLY its folder)
| # | Deliverable | Path | Owner |
|---|---|---|---|
| 1 | Website (one long home page + reserve flow) | `index.html`, `site/` (css, js) | website builder |
| 2 | Brand kit + all marketing materials (interactive guidelines) | `brand/` | brand builder |
| 3 | Menu flipbook (+ printable PDF menu) | `menu/` | flipbook builder |
| 4 | Marketing showcase (campaign + social + ads + email, with PNG exports) | `showcase/` | showcase builder |

SHARED, READ-ONLY for builders (ask the lead to change): `assets/css/brand.css`, `assets/data/xxviii.js`, `assets/logo/*`, `assets/fonts/*`, `assets/vendor/*`, `assets/img/*`.
Each page links the shared layer with relative paths (`../assets/...` from a subfolder) and must work over http AND from `file://` (classic scripts, no ES-module imports of local files, no fetch() of local JSON — read `window.XXVIII`).

## 1. The brand in one breath
**Twenty-eight days.** That is how long good beef takes to become great: still, cold, quiet, patient. *We don't rush the beef, so we never rush you.*
- Name: Twenty-Eight. Mark: **XXVIII** (Roman numerals; logo + signage). Running text: "Twenty-Eight". NEVER write the name as "28" (Manila competitors sell "28-day aged" steaks). The numeral 28 may appear only as a day count ("Aged 28 days").
- Values: Patience · Craft · Honesty (every steak lists its age) · Gathering (never hurried).
- Taglines: "Some things can't be hurried." (primary) · "Worth the wait." · "Time is the finest ingredient."
- Brand touches: glass dry-ageing room by the entrance with a board showing each cut's day; every steak arrives with a small card "Aged 28 days. Cut today. Yours tonight."; house signature **The Twenty-Eight** (bone-in ribeye, 28 days, cultured butter aged beside it); house cocktail **Patience** (beef-fat-washed Old Fashioned, stirred slowly, one clear ice cube).
- Menu sections renamed: Day One · The First Course · From the Garden · The Ageing Room · The Long Wait (45-day sharing cuts) · Alongside · Beyond the Ageing Room (our addition) · The Last Course. All data is in `window.XXVIII` (assets/data/xxviii.js) — use it, never retype prices/names.

## 2. Look: dark, quiet, warm. Modern steakhouse, not a heritage pastiche
Derived from the client's photographs: dark walnut tables, oxblood leather banquettes, warm brass lamp bokeh, white plates. The pages should feel like the dining room: low light, one warm pool of light on the food.
- Colour tokens (brand.css): `--char #141110` ground · `--char-2/3` raised · `--ox #7a1e24` oxblood · `--brass #c29a5b` brushed brass (+ `--brass-grad` for the mark only) · `--bone #efe7da` text · `--ash #a39686` secondary. Brass is precious: rules, numerals, focus, one CTA. No other hues. No violet, no blue, no neon, no pure white/black.
- Type (self-hosted, already in brand.css): **Gloock** display (headlines, dish names, the mark) · **Big Shoulders** labels, day counters, prices, nav, tags (condensed, wide-tracked caps) · **Hanken Grotesk** body. No other fonts. No italic display. Headlines are short and big; labels are tiny and wide-tracked; the contrast between the two IS the look.
- Shape: square (radius 2px max). Hairline brass rules, the diamond rule (`.rule-diamond`), the clipped-corner ageing tag (`.age-tag`), the butcher-tag silhouette (logo/xxviii-tag-*.svg).
- Texture: subtle film grain (`.grain`), soft radial warm light pools, vignettes. Photos are the hero; never place text over the food itself.
- Buttons: ONE pair only — `.btn.btn-solid` (brass) + `.btn.btn-line` (hairline). Verb + object ("Reserve a table", "See the menu").
- Logos: use the SVG files in assets/logo (primary/horizontal/wordmark/monogram/seal/tag × brass/bone/char/ox). Don't redraw the mark in live text for the logo itself.

## 3. Photography (client's own, 50 dishes)
`assets/img/plated/<slug>-{lg 1600|md 800|sm 420}.webp` — square shots on the dark walnut table in the restaurant.
`assets/img/cutout/<slug>-{lg 1200|sm 600}.webp` — the same plate cut out on transparency (trimmed). Cutouts are the interactive material: float, rotate, stack, orbit, reveal under a light. Use `XXVIII.img(slug,'plated'|'cutout','md')` (set `window.XXVIII_BASE='../'` in subfolder pages BEFORE using it).
Slugs = the `img` / `cutout` fields in the data. Extra: `bone-marrow-white` (plated, white-plate shot), `bone-marrow` (cutout, white plate), `wagyu-tallow-white`/`wagyu-tallow`.
Rules: `<img>` with width/height + `loading="lazy"` below the fold + `decoding="async"`; hero image eager + `fetchpriority="high"`; srcset sm/md/lg. No captions explaining pictures. Never show a photo twice in the same viewport.

## 4. Motion language ("patience")
The user asked for HIGHLY interactive and animated — deliver it, but in the brand's tempo: slow, weighted, confident. Nothing bounces, nothing is frantic.
- Libraries (vendored, classic scripts): `assets/vendor/gsap.min.js`, `ScrollTrigger.min.js`, `SplitText.min.js`, `Flip.min.js` (GSAP 3.13, all free), `lenis.min.js` (smooth scroll). Read the GSAP skill notes in `_research/skills/gsap-*.md` (official GreenSock agent skills) before using ScrollTrigger: register plugins, use `gsap.matchMedia()` for desktop/mobile + reduced motion, `ScrollTrigger.refresh()` after images load, kill on resize, never animate layout props (width/height/top/left) — transforms + opacity + clip-path + filter only.
- Eases: `power3.out` / `expo.out` for arrivals, `power2.inOut` for scrubs; durations .8–1.4 s for reveals, 2–4 s for ambient loops. Exits faster than entrances.
- Signature moves to reuse across pages: (a) **day counter** — Big Shoulders numerals rolling 01→28 (odometer, tabular nums); (b) **brass light sweep** across the mark/headlines (`--brass-grad` background-position); (c) **SplitText line reveals** (lines rise from a mask, 0.08 s stagger); (d) **clip-path wipes** on photos (inset reveal), with a slow 1.06→1.0 scale settle; (e) cutouts float + rotate with pointer parallax (max 8°), cast a soft shadow; (f) the **ageing tag** swinging gently on its string.
- `prefers-reduced-motion: reduce` → everything visible and static, counters show final values, no smooth scroll, no parallax. Content must NEVER stay hidden if JS fails (start states set by JS, not CSS, or use a `.js` class gate).
- Performance: 60 fps target; no layout thrash; images lazy; at most one WebGL context per page (only if it earns its place; CSS/Canvas2D preferred). Pause off-screen loops (IntersectionObserver). Page weight: lazy-load everything below the fold.

## 5. Copy rules
UK English spelling. Short. Headlines ≤ 7 words; section intros one line; cards ≤ 14 words. Adviser-calm, never salesy, no exclamation marks, no "indulge", "elevate", "culinary journey", "mouth-watering", "unforgettable". Don't invent awards, reviews, press quotes, chef names or customer names — where a slot needs one, use a clearly marked placeholder in the data or omit the slot. Prices via `XXVIII.peso()`. Contacts are placeholders from `XXVIII.brand.contact` (keep `.example` domain and the 0000 phone).

## 6. Quality gate (each builder, before reporting)
1. Serve over http (port 4628 server, or your own `python -m http.server <port>` on a free port 46xx; kill it after). Capture screenshots with `python C:/Users/leuss/ClaudeWork/qa/proposal-bir-cas/cdp_shot.py <url> <outdir> <width>` (full page, walks the page so reveals fire; `--rm` for reduced motion) at 1440, 1024, 768, 390. Put shots in `qa/shots/<deliverable>/`. LOOK at every slice yourself and fix what you see.
2. Zero console errors. No horizontal scroll at 320–1920. No text overflow/clipping (write a JS check: any element whose scrollWidth > clientWidth + 1 among text nodes, and any element extending past the viewport).
3. Keyboard: every control reachable, visible focus, Esc closes overlays, dialogs trap focus, `aria-*` correct. Touch targets ≥ 44 px on mobile.
4. Contrast: body ≥ 4.5:1, large text ≥ 3:1 (bone on char 15:1; ash on char ~6:1; brass on char ~7:1 — brass text on oxblood fails for small text: use bone there).
5. Reduced motion pass. JS-disabled pass (content readable).
6. Grep your files: no "TechNext", "technext", no other client names, no lorem ipsum, no "28 Steakhouse" (the name is never the numeral), no TODO.
7. Report in ≤ 15 lines: what you built (sections), interactions list, QA results, open issues, files.
