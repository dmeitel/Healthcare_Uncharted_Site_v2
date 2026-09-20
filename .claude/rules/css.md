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
- Floors: 44px touch targets on phones, 11px functional text (counter-scaled
  SVG canvas text exempt), the phone line is 699px. Never hand-roll a
  different breakpoint.
- Anything position:fixed to the viewport bottom carries
  env(safe-area-inset-bottom) padding.
- A page-scoped link rule (`.page a { color }`, specificity 0,1,1) outranks every kit
  control class (`.btn-primary-v2`, `.toggle-chip`, `.tb-brand`, 0,1,0) and paints the link
  color over their ink: a teal label on a teal fill (2026-09-18). Scope link color to prose
  containers, or exclude the kit classes with :not().
- tests/contrast.test.js holds the token pairs DESIGN.md measures; a new fill-and-ink pair
  gets a row there before it ships.
