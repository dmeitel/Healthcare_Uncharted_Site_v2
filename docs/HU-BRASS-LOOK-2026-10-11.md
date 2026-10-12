# The brass instruments look · how a page wears it

The working guide for the site-wide refresh (docs/HU-SITE-REFRESH-2026-10-11.md), written 2026-10-11 so every page
pass dresses its controls the same way. When the refresh ships, DESIGN.md's Tier 3 is rewritten from this.

## The idea in one paragraph

The site is a set of instruments. Things you press are KEYS: raised on a floor, a fine brass edge along the top, and
they sink when pressed. BRASS marks three things only: the one main act on a screen, the place you are or the choice
that is on, and the frame of a featured panel. Panels are FACES. READOUTS (a clock, a score, a year, a stat) are recessed
GLASS, dark in both themes the way a device's screen is in daylight. FIELDS (a search box, an input, a recessed track of
segments) are recessed wells: glass at night, a light well in day (David's review, 2026-10-11: the dark fields "not the
correct color for the day theme"). Night is the navy the site already had; day is a white chassis with
the same brass. There is NO GLOW anywhere: shadows fall downward in --depth, and nothing lights up.

## The recipes (all in hu-global.css, last section)

Use the class in markup when the element is new or simple; use the properties when a page already styles its own
control and only its surface should change.

| Piece | Class | Or, on a page's own selector |
|---|---|---|
| Key | `.hu-key` | `background:var(--key-bg); color:var(--key-ink); border:1px solid transparent; border-top-color:var(--brass-rim); box-shadow:var(--key-lift); border-radius:10px;` and `:active { transform:translateY(3px); box-shadow:var(--key-down); }` |
| Brass key (main act, current, on) | `.hu-brass` | `background:var(--brass-bg); color:var(--brass-ink); border:1px solid transparent; box-shadow:var(--brass-lift);` and `:active { transform:translateY(3px); box-shadow:var(--brass-down); }` |
| Face (a panel, a card) | | `background:var(--face-bg); border:1px solid var(--border); box-shadow:0 10px 22px var(--depth); border-radius:12px to 16px;` |
| Framed face (a featured panel) | | `background:var(--face-bg) padding-box, var(--frame-bg) border-box; border:2px solid transparent; border-radius:16px; box-shadow:var(--panel-lift);` |
| Glass (a readout, a screen) | | `background:var(--glass); box-shadow:var(--glass-well); color:var(--glass-ink);` |
| Field (a search, an input) | | `background:var(--field-bg); box-shadow:var(--field-well); color:var(--field-ink);` placeholder `var(--field-sub)` |
| Track (segments sit in it) | | `background:var(--track-bg); box-shadow:var(--track-well);` |

Hover on a key: `filter:brightness(1.08)` at night, `brightness(.97)` in day, and the top edge to `var(--brass)` (day:
`var(--brass-lo)`). Off: `opacity:.45`, no floor, `cursor:not-allowed`. Focus stays the site's teal ring
(`outline:2px solid var(--teal)`, `var(--teal-dk)` in day). Transitions only under
`@media (prefers-reduced-motion: no-preference)`.

Inks: `--key-ink` and `--key-sub` on keys; `--brass-ink` is the ONLY ink on a brass fill; `--brass-text` is brass as
text (it changes with the theme); on glass use `--glass-ink`, `--glass-sub`, `--glass-teal`, `--glass-amber`, which do
NOT change with the theme because glass stays dark. On a field use `--field-ink` and `--field-sub`, which DO change. A light-theme rule that darkens an ink (`[data-theme="light"] ...
{ color:var(--teal-dk) }`) must not reach text that sits on glass.

Regions, as small solid marks (a dot, a label), never a fill or a glow: `--region-tools`, `--region-fun`,
`--region-learn`, `--region-rounds` (each has its day step built in).

## The rules

1. Brass is scarce. One brass main act per screen; brass for the current tab, view, filter or switch; brass frames
   only on featured panels (catalog cards, the home dial, a module header). Body text is never brass.
2. No glow. No colored blur in box-shadow, no text-shadow, no halo on hover or focus. `--depth` shadows only.
3. Surface, not structure. Keep each page's layout, sizes, spacing, words and behavior. A refresh pass changes
   backgrounds, borders, shadows and inks.
4. Both themes, every time. Look at night and day at a phone and a desk before calling a page done.
5. The floors hold: 44 px targets on a phone, 4.5:1 for text, the type scale, reduced motion.
6. Tokens over hex. A page with a deliberate local palette may keep it; no new colors.
7. Data colors stay data colors: lens pills, map ramps, chart series and game art are not restyled.
8. The seven locked pages keep their own styles; they change only through the shared pieces.

## Checking a page

The dev server runs at http://localhost:8080 and rebuilds on save. Run the gate in both themes against it:

    MSYS_NO_PATHCONV=1 node scripts/phone-check.js /path/ --base http://localhost:8080 --no-slow

Clean means no FAIL row at any size, night or day.
