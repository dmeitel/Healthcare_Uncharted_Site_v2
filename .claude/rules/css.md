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
