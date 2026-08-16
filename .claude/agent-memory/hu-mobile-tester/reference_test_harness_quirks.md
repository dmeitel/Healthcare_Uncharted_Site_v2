---
name: test-harness-quirks
description: Playwright/measurement quirks specific to testing this site (screenshot paths, canvas hit-testing, false positives)
metadata:
  type: reference
---

- Screenshot save path MUST use lowercase drive letter: `c:/Users/david/...` — capital `C:` fails the allowed-roots check in browser_take_screenshot. tmp/mobile/ under the project root works.
- Career-tree and atlas boards are SVG canvases with `touch-action:none`; a11y snapshot `box=` coords for hex children can be pre-transform — trust elementFromPoint + getBoundingClientRect instead.
- Career-tree deck controls are `g.hct-cact` (rect+path, no aria-label); find them by class, not label.
- Tap-target sweeps return many false positives from closed drawers/dialogs (bp-* blueprint cards, conn-panel, help modals). Filter by walking ancestors for display:none AND sanity-check against a screenshot before reporting.
- Detail sheets here often stay mounted after close (hu-drawer pattern) — check visibility/class (`rp-open`), not just presence.
- Buffered PerformanceObserver layout-shift works for CLS after the fact; the "Deprecated API for given entry type" console warning is from the probe itself, not the site.
- goatcounter "not counting because of: localhost" warning is expected noise on every page.
