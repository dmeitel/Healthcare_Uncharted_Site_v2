---
name: verification-traps
description: Traps met while verifying contrast on this site: shared scratchpad clobbering, port collisions, stylesheet order for injected CSS, pinch-zoom scaled scenes
metadata:
  type: reference
---

Traps met 2026-09-23 while verifying contrast fixes; each one cost a wrong reading before it was caught.

- **The session scratchpad is shared with sibling agents** launched by the same coordinator. A file named solve.js was overwritten mid-task by another agent's script. Keep your own scripts in a private subfolder of the scratchpad with non-generic names.
- **Fixed test-server ports collide** with other sessions (EADDRINUSE). Listen on port 0 and read server.address().port.
- **Injected test CSS loses to page CSS**: tool pages carry their <style> in the body, so a Playwright addStyleTag in <head> comes EARLIER in document order and loses at equal specificity. Use !important in experiments, or the result is silently "no change".
- **getComputedStyle is live**: read the color BEFORE making the text transparent for a ground screenshot, or every ratio reads 1.0.
- **The hospital map's phone view is a pinch-zoom scene scaled to ~0.48**, so pixel checks at 390 measure anti-aliased 5px glyphs; compare against the 1280 run before calling a phone-only result a defect.

Related: [[defect-classes-and-origins]] (classes 10 and 12 are where these bite).
