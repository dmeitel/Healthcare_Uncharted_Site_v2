---
paths:
  - "src/tools/**/*"
  - "src/atlas/**/*"
---

# Interactive tools

- Every tool works with touch: pan, pinch, tap. Hover-only information is
  unreachable on the devices most visitors use.
- touch-action is scoped to the interactive surface only (canvas, svg, drag
  grabber), never the page or body.
- Any dialog or sheet closes on Escape and returns focus where it came from.
  Escape walks ONE level per press (the one-step-back contract): popover,
  then card/sheet, then focus state, then grain. Never collapse two levels
  on one press.
- Use HUKit primitives (sheet, backGuard, dcap, phone) instead of hand-rolled
  twins. If a tool needs a variant, the variant goes into the kit first.
- The laws live in docs/HU-INSTRUMENT-GRAMMAR-2026-08-11.md: canvas is the
  page, chrome floats and converts, verbs ride their subjects, reading is
  free and moving is explicit, one step back, state has a face, legible at
  every zoom. New tool work passes its checklist (section 5) before shipping.
- URL-addressable state: push on scope change, replace on tweak, restore
  before first paint.
