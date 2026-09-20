---
name: blessed-do-not-reflag
description: Everything David has blessed, accepted, queued or already fixed; plus the audit conventions he expects. Check before writing any finding.
metadata:
  type: feedback
---

Do not re-report these. State as of 2026-08-16 unless noted. Merged 2026-09-19 from
`audit_scope_rules.md`, which was a second copy of this same list.

**Why:** David tracks these himself and the coordinator already ruled on them. Re-proposing
them burns his QA time, which is the scarcest thing in this project.

**How to apply:** check this list, then [[recurring-defect-classes]], before writing a
findings table.

## Blessed by David

- The TYPES categorical palette and the multi-lens local palette entries in
  `.impeccable/config.json` (SCALE choropleth reds, ambers, teals, #062024 ink).
- The GoatCounter read-only token sitting face-up in source. His explicit call.
- "Educational use, not clinical advice" repeating on every tool page, via the shared
  `tool-attribution.njk` strip. Count it against the negation-contrast budget, but do not
  propose rewording it per page.
- The em dash in base.njk. Base-layout em dashes are out of scope; page-local copy is still
  fair game.
- 9.5 to 10px mono CAPTIONS are the QP3 Caption Rule precedent sitewide. Only flag sub-11px
  text that is INTERACTIVE.
- dvh-only heights on map shells match the multi-lens precedent. Only hu-global carries the
  vh fallback pair.

## Accepted or queued, not defects

- The 768px media block awaiting the 699/1099 migration. Queued.
- HUKit adoption and HUD backGuard on the Atlas. Queued.
- Layers, routes and expansions not serialized into the URL. Accepted for v1.

## Already fixed before the audit ran

- 2026-08-16 session: `transition:all` removal, the ovbtn/pinbtn 44px touch floor,
  `role="status"` on #lvStatus and #gvStatus, the bar-chart icon swap on lvMetricBtn, and the
  gv-pill row 44px floor.
- prefers-reduced-motion is handled centrally by `HUKit.dcap` returning 0 plus gated CSS
  animations on every tool that adopted the kit. Verified good.

## Audit conventions David expects

- Rank findings by READER impact, not by how easy the fix is.
- Every finding carries an exact line number or a quote.
- Never edit and never offer to fix. The auditor reports.
- Read the task brief's known-open list first.
