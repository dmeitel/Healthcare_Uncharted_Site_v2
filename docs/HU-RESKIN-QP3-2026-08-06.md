# HU RESKIN · QUIET PRECISION + CARTOGRAPHIC QUIET
### The base-coat spec · 2026-08-06 · applies to EVERY page pass

David picked the doctrine chain in the Reskin Lab: Signal Boost, then B1 Quiet Precision, then QP3 Cartographic Quiet. His stated anti-goal, verbatim: "feel a little more natural and clean formed instead of AI Generated fast and dirty." This doc is the mechanical law for applying it. DESIGN.md carries the named rules; this carries the exact transformations.

The site-wide layer (hu-global.css) already carries the base coat: solid-teal active chips, ruled `.hu-stat` figures, no-glow buttons, the `.hu-ticks` utility, masthead `.tool-bar`. Page passes handle what page-LOCAL style blocks duplicate or override.

---

## THE TRANSFORMATIONS (apply in page-local `<style>` blocks)

**1. ZERO GLOW.** Delete every decorative glow:
- `box-shadow: 0 0 Npx rgba(78,205,196,…)` and any other zero-offset colored halo: DELETE the shadow (keep the element).
- Colored hover glows on buttons (`box-shadow: 0 8px 24px rgba(27,95,168,.35)` and kin): DELETE the shadow, KEEP the background brighten and the translateY(-1px) lift.
- Legitimate shadows STAY: sheets (`0 -12px 40px rgba(0,0,0,.45)`), FABs (`0 4px 16px rgba(0,0,0,.4)`), hover card-lift (`0 12px 40px rgba(0,0,0,.45)`), floating panels (`var(--shadow)`). These have offsets and carry black, not accent.

**2. GRADIENTS DIE.** 
- Gradient ACCENT BARS (`background:linear-gradient(90deg, …)` on a 2-4px strip): flatten to one solid hue (`background:var(--teal)` or the strip's dominant color).
- Gradient logo/avatar boxes (`linear-gradient(135deg,var(--blue),var(--teal))`): flatten to `var(--blue)` with a 1px `var(--border2)` border. (Real brand SVG images are untouched.)
- Gradient panel washes (`linear-gradient(135deg, rgba(accent,.16), …)` as a callout/panel background): remove per transformation 3.
- Gradient text (background-clip): weight or size instead.
- EXCEPTION: gradients that ARE data or scenery (choropleth ramps, chart fills, the iceberg's water depth, the game's world, hero atmosphere washes at under ~6% alpha) stay. When unsure whether a gradient is decoration or scenery: decoration dies, scenery stays.

**3. CALLOUTS = MARGIN NOTES (The Margin Note Rule).** Any boxed/tinted aside (notice, warning, insight, key-point panel):
```css
/* FROM: background tint + border + radius + padding box */
/* TO: */ border-left:3px solid var(--amber); padding:6px 0 6px 14px; background:none; border-radius:0;
```
Keep the accent hue the box used (amber for caution, lens hues where earned, teal only if it was pointing). Titles 12px/700, body text `var(--t2)`. Light theme: amber flips to `var(--amber-dk)` when used as TEXT; the 3px rule itself may stay bright.

**4. STAT TILES = RULED FIGURES (The Ruled Figure Rule).** Page-local stat boxes (filled tile + radius + border):
```css
/* TO: */ background:none; border:none; border-radius:0; border-top:2px solid var(--border2); padding:8px 2px 0;
```
Value keeps its Outfit 800 size; add `font-variant-numeric:tabular-nums`. Caption stays mono 9px uppercase `var(--t3)`.

**5. BODY 400.** `font-weight:300` on any prose/description on dark becomes 400. (Display faces at 300 do not exist here; this is about DM Sans.)

**6. ACTIVE = SOLID INK (The Ink State Rule).** Page-local chip/toggle/pill actives that use tinted washes (`rgba(78,205,196,.1-.2)` fills):
```css
/* TO: */ background:var(--teal); border-color:var(--teal); color:#062024; font-weight:700;
```
Tab-style actives may instead use ink + `border-bottom:2px solid var(--teal)`. Light theme: `[data-theme="light"]` flips teal TEXT to `var(--teal-dk)`; the solid-fill active keeps #062024 ink (it passes on both themes).

**7. SURVEY TICKS (The Survey Tick Rule).** OUTER surfaces only: the page's main report cards, drawer/pin cards, hero panels. Use the global utility:
```html
<div class="card hu-ticks">…
```
or copy the pattern locally when the element already uses ::before/::after for something else, using a nested `<i class="tick" aria-hidden="true"></i>` pair. 10px arms, 1px `var(--border2)`, top-left + bottom-right, inset 5px. NEVER accent-colored, NEVER on nested elements, NEVER on tiny chips. 2 to 6 ticked surfaces per page is the ceiling; ticks everywhere read as wallpaper.

**8. MONO CAPTIONS (The Caption Rule).** Fact-row labels inside tools (label: value pairs): label becomes `font-family:var(--mono); font-size:9.5px; letter-spacing:.12em; text-transform:uppercase; color:var(--t2);`. FOG BLUE, not Faded Ink: t3 captions failed David's QA on open dark ground (2026-08-06 round 1). Faded Ink stays for source lines, meta, and section labels that should recede. The VALUE keeps body/mono per the Data Speaks Mono rule. Editorial prose labels are NOT captions; do not caption article text.

**9. TRACKED-CAPS NAMES, drawer scale only.** Pin-card and drawer-card NAMES inside tools: `font-size:14px; text-transform:uppercase; letter-spacing:.09em;` (weight stays 800). Page H1s, section titles, and editorial card titles STAY mixed-case. If a name can exceed ~40 characters (article titles, career roles), leave it mixed-case.

**10. MARKERS ON CATALOG ROWS.** Selection/catalog rows in tools lead with `content:'▸ '` in `var(--t4)`; the selected row flips to `content:'◆ '` in `var(--teal)` (`var(--teal-dk)` on light). Only where rows are PICKED (metric catalogs, layer lists), not on every list on the site.

**11. TOOLBAR = MASTHEAD.** Page-local toolbar clones: `border-bottom:2px solid var(--border2)` (up from 1px `var(--border)`), kicker may lead with `'─ '` (U+2500 box-drawing, in `var(--border2)`). The global `.tool-bar` already does this.

---

## HARD STOPS (the voice kernel applies to code)

- NO em dashes (—) anywhere: UI strings, aria-labels, CSS comments, `content:` glyphs. The lead glyph is U+2500 `─`, not an em dash. If you touch a line that already has one, replace it (comma, period, middot, or restructure). Pre-existing `&mdash;`/`—` in base.njk chrome is DAVID'S CALL; do not touch base.njk copy.
- Middots (·) join fragments. CAPS for emphasis, never bold-inside-prose.
- No new fonts, hues, radii steps, or shadow values. The existing ladder is the system.
- No behavior changes: JS, HTML structure, copy, links, aria all stay unless a class swap is required for a style hook. NEVER rename an id or an existing class that JS reads.
- MapLibre/canvas internals are OUT OF SCOPE (map paint, markers, popup internals owned by map JS). Map CHROME (drawers, cards, chips, toolbars, sheets) is IN scope.
- The 44px touch floor, 699px phone line, and reduced-motion guards must survive every edit.
- Light theme: every changed rule gets checked against `[data-theme="light"]`; add the flip variant when accent is used as text.

## OUT OF SCOPE ENTIRELY
- `/secret-menu/reskin-lab/` (the lab itself), `/secret-menu/hospital-price-finder/` (parked project; inherits the global layer only), `/secret-menu/uncharted-general/` (the game is its own world; only kill outright glows/gradient-accent-bars in its site-chrome edges if any, leave the game boards alone), `brand/` assets, `_archive/`.

## VERIFY (every page pass, before reporting done)
1. `grep -c "—"` on the touched file: count must not RISE (target: fall to 0 in style blocks + UI strings you touched).
2. No `linear-gradient` left except data/scenery exceptions; no `box-shadow:0 0`.
3. No `font-weight:300` on prose.
4. File still builds: page renders through `npx @11ty/eleventy` (or confirm the file is plain HTML passthrough).
5. Inline `<script>` blocks still parse (node vm.Script) if you touched near one.
