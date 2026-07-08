# HU Tool Shell v1

The standard layout for every interactive tool on Healthcare Uncharted. One spec, three rendered modes. If a tool doesn't fit this shell, that's a design conversation, not a license to hand-roll.

## The shape

```
.hu-shell                          fixed cockpit on desktop, stack on phone
  .tool-bar                        identity: kicker + title + crumb + actions
  .shell-deck                      optional; filter/chip rows
    .shell-deck-row                one row: .shell-deck-label + .toggle-chip's
  .shell-main
    .shell-dock--left              optional; metric pickers, nav trees
    .shell-canvas                  the map/viz; position:relative
    .shell-dock--right             optional; rankings, detail, stats
  .shell-foot                      legend, time controls, .tool-attribution
```

All classes live in `src/assets/css/hu-global.css` (HU TOOL SHELL section). Tools add their own content styling inside the regions; they do not restyle the regions.

## Breakpoints — use these, not your own

| Mode    | Width       | Behavior |
|---------|-------------|----------|
| Desktop | >= 1100px   | Fixed cockpit. `height: calc(100dvh - 64px)`, no page scroll. Docks 300px. |
| Tablet  | 700-1099px  | Same cockpit, docks narrow to 260px. Drop a dock entirely if two don't fit. |
| Phone   | < 700px     | Page scrolls. Canvas becomes a 62dvh block, docks stack below in flow. Chip rows scroll horizontally. |

## Rules

1. **Canvas is touch-locked.** Direct `svg`/`canvas` children of `.shell-canvas` get `touch-action:none` automatically. Pan/zoom via d3.zoom or pointer events; the page must never fight a finger.
2. **Hover must have a tap twin.** Any data revealed on `:hover` (tooltips, isolates) needs a tap/click path that shows the same data. Test with `@media (hover:none)`.
3. **Detail panels on phone are sheets.** Add `shell-dock--sheet` to a dock that should slide up over the canvas instead of stacking (toggle `.open` in JS). Standalone `.shell-sheet` works at any size for tutorials/detail views.
4. **Authoring canvases gate, they don't reflow.** A drag-drop editor that can't work at 375px renders a `.shell-gate` (auto-appears < 900px) with a one-line explanation and a link somewhere useful.
5. **Attribution lives in `.shell-foot`** (preferred) or floats via `.tool-attribution--fixed`. Every tool carries it: the site footer is suppressed on tools.
6. **Chips are `.toggle-chip`.** Active = teal fill + #062024 text. No new pill inventions.
7. **Z-scale:** nav 200, tool-bar 150, shell-gate 180, attribution 120, docks 50, sheet 300, modal 400. Don't freelance z-indexes above 400.
8. **No page-level token redefinitions.** Scene palettes use scoped names (`--craft-*`, `--sql-*`). Global names (`--dark`, `--teal`, `--font`, ...) always mean what hu-global.css says.

## Icons — one vocabulary, everywhere

Lucide only (pinned sitewide in base.njk). Never emoji, never one-off SVG glyphs for standard actions, never color-alone meaning. 16px, stroke 1.75 (the `.icon-btn` primitive handles this). Every icon-only control carries `aria-label`.

| Function | Lucide name | | Function | Lucide name |
|---|---|---|---|---|
| Filter | `sliders-horizontal` | | Close / dismiss | `x` |
| Search | `search` | | Legend / map key | `map` |
| Layers | `layers` | | Info / about | `info` |
| Reset view | `rotate-ccw` | | Download / export | `download` |
| Zoom in / out | `zoom-in` / `zoom-out` | | Back | `arrow-left` |
| External link | `arrow-up-right` | | Settings | `settings-2` |

Primitives in hu-global.css: `.icon-btn` (28px square, border, teal active via `.on`/`aria-pressed`) and `.pop-head` (popover/panel header: teal icon + mono uppercase title + auto-margin close `.icon-btn`). Constraint: base.njk runs `lucide.createIcons()` once at end of body — icons in STATIC markup render automatically; JS-INJECTED icons must call `lucide.createIcons()` after insertion (or inline the SVG). Corollary: keep labels/headers that carry icons OUT of JS-rebuilt containers — static label, sibling div for the re-rendered chips.

### Exploration semantics — same concept, same icon, every tool

These name the CONCEPTS a data tool exposes. A concept keeps its icon across tools even when the control differs (chip row on one tool, segmented control on another).

| Concept | Lucide | Appears as |
|---|---|---|
| Dataset / resource ("what am I looking at") | `layers` | deck-row label icon |
| Metric / color-by ("what colors the map") | `bar-chart-2` | deck-row label icon, metric pickers |
| Granularity (state ↔ county grain) | `layout-grid` | deck-row label icon, grain segmented control |
| Time (year, snapshot ↔ change) | `calendar` | time controls |
| Trend / change mode | `trending-up` | change-mode toggle, trend panels |
| Compare | `arrow-left-right` | compare-mode toggle |
| Rankings / top-N | `list-ordered` | rankings panels |
| Guide / tutorial | `help-circle` | tool-bar `.icon-btn` |
| Sources / citations | `book-open` | sources popovers, attribution links |
| Pin / save a selection | `pin` | career-tree path, saved views |

Exception that proves the rule: the Multi-Lens Map's lens badges (P/C/O/S/L/B letter-in-color) are brand iconography for the lens system itself — they stay letters, standardized in shape/size, not replaced with Lucide. Icons on labels render 11px, teal (`--teal-dk` on light), and always sit BESIDE the text label, never instead of it.

## Accessibility — required on every tool

The Operators Map (`src/tools/healthcare-operators-map/index.html`) is the reference implementation. Copy its patterns; don't reinvent them.

- **One live region.** A single visually-hidden `aria-live="polite"` div (use the `.vh` utility) with an `announce(msg)` helper. Announce COMMITTED state changes only: selection, zoom target, resource/filter switch, load result. Never hover, never mousemove, never per-keystroke.
- **The status banner is a `role="status"`.** And guard the assignment: only rewrite its text when it actually changes, or every render re-fires an announcement.
- **Chips carry `aria-pressed`.** Every `.toggle-chip`, single-select rows included. One scheme everywhere. No half-built tablists: `role="tab"` promises arrow keys and tabpanels, and if you're not building those, stay with buttons. Wrap each chip row in `role="group"` + `aria-label`.
- **Focus is visible.** `:focus-visible{outline:2px solid var(--teal);outline-offset:2px}` on chips, dock buttons, canvas controls. SVG shapes swap the outline for a teal stroke.
- **Reduced motion.** `const dur=ms=>matchMedia('(prefers-reduced-motion: reduce)').matches?0:ms;` and every large-movement animation (camera zoom, fly-to, fan-out) goes through it. Subtle CSS transitions on chips/panels can stay.
- **Fetch failure is a human sentence.** "Couldn't load the map data. Check your connection and refresh." In the canvas, styled with tokens, AND pushed through the live region. Never a bare "Failed".
- **Hover needs a tap twin AND a keyboard twin.** Rule 2 covers touch. Keyboard: focusable shapes with `role="button"` + Enter/Space wired to the same handler as click. When there are too many targets to tab (hundreds of facility dots), don't fake it: make search or a dock list the keyboard path and keep the map dots pointer-only.
- **Headings are real.** Visually-hidden `h1` for the tool name, dock panel titles as `h2`. No skipped levels, no styled divs pretending to be headings.
- **SVG canvases scale, they don't re-render.** The standard (Operators Map is the reference): draw ONCE into a fixed logical viewBox (e.g. `0 0 975 610` for Albers USA), `preserveAspectRatio="xMidYMid meet"`, CSS `width/height:100%` — the browser scales the vector for free, so resize/rotation/emulation costs zero JS and zero jank. `vector-effect: non-scaling-stroke` on hairline outlines so they stay crisp. NO ResizeObserver for geometry. Responsive POLICY (skip leader-line callouts, default number labels off) keys to ONE `matchMedia` threshold with a single `change` listener that re-renders once at the crossing — and respects an explicit user toggle over the default (track a `touched` flag). Never announce() from that listener. On phone, shape the canvas to the content: override the shell's 62dvh with an `aspect-ratio` matching the viewBox so the drawing fills the frame. Density that can't survive phone scale is SKIPPED below the threshold, not squeezed — secondary surfaces (tap strip, inspector) carry the data. Exception: canvases whose text must stay 1:1 readable (the Observatory DAG) keep a fixed min-width inside a horizontal scroller instead of scaling.

## Adoption checklist for a new tool

- [ ] Front matter: `layout: base.njk`, `no_footer: true`, `navPage: tools`
- [ ] Wrap the app in `.hu-shell`; regions per the shape above
- [ ] `.tool-bar` with kicker "Tool" + `.tool-bar-title` wordmark (`<span>` = teal word)
- [ ] Filters as `.toggle-chip` in `.shell-deck-row`s
- [ ] Phone pass at 375px: nothing overflows, everything reachable, tap twins exist
- [ ] Attribution strip present
- [ ] Fonts via `var(--font)/var(--display)/var(--mono)`; colors via global tokens or scoped names
