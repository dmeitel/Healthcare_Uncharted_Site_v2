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

## Adoption checklist for a new tool

- [ ] Front matter: `layout: base.njk`, `no_footer: true`, `navPage: tools`
- [ ] Wrap the app in `.hu-shell`; regions per the shape above
- [ ] `.tool-bar` with kicker "Tool" + `.tool-bar-title` wordmark (`<span>` = teal word)
- [ ] Filters as `.toggle-chip` in `.shell-deck-row`s
- [ ] Phone pass at 375px: nothing overflows, everything reachable, tap twins exist
- [ ] Attribution strip present
- [ ] Fonts via `var(--font)/var(--display)/var(--mono)`; colors via global tokens or scoped names
