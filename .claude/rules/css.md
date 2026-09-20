---
paths:
  - "src/**/*.css"
---

# CSS

- Color and spacing come from the token set in src/assets/css/hu-global.css.
  No NEW raw hex in shared/component CSS when a token exists. (Tool pages
  carry deliberate local palettes; extending one is allowed, inventing a new
  color is a question for David.)
- 100dvh, never bare 100vh, on anything full-height. When supporting old
  engines, write the vh line first and the dvh line immediately after.
- Respect prefers-reduced-motion on every transition and animation.
- Animate transform and opacity, never height/width/margin/top/left.
  transition: all is banned (the impeccable detector enforces both).
- Watch specificity between section-level and element selectors. Padding and
  margin rules cancel each other here regularly, and the symptom shows up
  three components away.
- Every interactive component has hover, focus, active, and disabled states
  in both themes.
- Floors: 44px touch targets on phones, the phone line is 699px. Never
  hand-roll a different breakpoint.
- Type comes from the scale, never from a literal: --t-body, --t-ui,
  --t-label, --t-micro. Each carries a desktop value in :root and a phone
  value in the 699px block under it, and a phone value is never smaller than
  its desktop one. Functional text holds --t-label (13px phone, 11px desktop);
  nothing renders below --t-micro. DESIGN.md, "The Two Surfaces", has the why.
  `npm run phone` FAILS on anything under --t-micro and reports the band
  between the two floors as the migration backlog.
- Exempt from the floor: the SCENE of a surface the reader can pinch-zoom
  (the Atlas hex grid, the hospital blueprint), marked with data-zoom-scene.
  Its UI is not exempt. A panel, tab strip or status line that reports state
  holds the floor whatever the terrain does.
- A phone gets ONE top bar: the site nav OR a page toolbar, never both stacked,
  plus at most one bottom bar, inside 20% of the viewport. The gate fails on
  either violation and says which. The browser takes another quarter we do not
  control. When a page needs its own sticky bar, the nav yields: that is what
  the merged band (--nav-h vs --nav-bar-h, [data-nav-summon]) is for, and every
  converted tool page passes this while every unconverted one does not.
- A wrapped filter strip is a desktop toolbar. At 360 a row of chips wraps to
  four rows and eats a third of the screen. One row that scrolls sideways
  (flex-wrap:nowrap + overflow-x:auto) is the phone form.
- A CHART DOES NOT SCALE TO A PHONE, IT GETS A SECOND DRAWING. font-size inside
  a viewBox is in user units, so text shrinks with the geometry. Counter-scaling
  it back was measured and fails: coordinates do not move with the type, so
  paired labels collide and two-line labels at a fixed gap overlap their own
  second line at ANY size that clears the floor. Ship a phone drawing beside the
  wide one, marked .hu-chart-tall and .hu-chart-wide (hu-global.css does the
  swap at 699). Author it near 320 units wide, which renders about 1:1 in the
  reading column, and keep every font-size at 13 units or more. Worked example:
  src/rounds/wound-and-workload/index.html, both figures.
  The swap classes are DOUBLED (.hu-chart-wide.hu-chart-wide) because container
  rules are element-qualified: rounds.css `.figure svg{display:block}` is (0,1,1)
  and beat a single class.
- `npm run phone` fails on SVG LABEL COLLISION as well as the type floor, because
  the two pull against each other: the fix for small diagram text is bigger
  diagram text. A pinch-zoom scene is exempt, tested by walking up from the TEXT
  element, since the Atlas carries its transform on a <g> inside the drawing.
- Anything position:fixed to the viewport bottom carries
  env(safe-area-inset-bottom) padding.
- A page-scoped link rule (`.page a { color }`, specificity 0,1,1) outranks every kit
  control class (`.btn-primary-v2`, `.toggle-chip`, `.tb-brand`, 0,1,0) and paints the link
  color over their ink: a teal label on a teal fill (2026-09-18). Scope link color to prose
  containers, or exclude the kit classes with :not().
- tests/contrast.test.js holds the token pairs DESIGN.md measures; a new fill-and-ink pair
  gets a row there before it ships.
