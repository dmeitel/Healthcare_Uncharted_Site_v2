---
name: audit-recurring-defects
description: Recurring defect classes found auditing operators-map 2026-08-16; where they cluster and what is David-blessed (do not re-flag)
metadata:
  type: project
---

Recurring defect classes (first recorded audit: operators-map, 2026-08-16).

**Why:** these are structural patterns, not one-off typos; they will recur on sibling tools built from the same scaffold.

**How to apply:** check these first on any tool-page audit, especially the two MapLibre maps.

1. V1 leftovers after tool promotions. operators-map v2 kept the pilot's aria-label ("Hospital map demo") and dropped v1 URL params other pages still link (?metric=cah from /learn/healthcare-gap/). After any v1-to-v2 swap, grep the whole src tree for links INTO the tool and diff param handling.
2. Span switches, click-only. role="switch" tabindex="0" spans with delegated click handlers, no Enter/Space keydown, no accessible name. Both maps: operators-map gvLabState/gvLabCity (~L1346), multi-lens lvLabState/lvLabCity (~L1369). lvMoreSw at least has an aria-label.
3. Closed kit sheets stay in tab order. .shell-sheet:not(.open) is transform-off-screen only (hu-global.css ~L822); hu-kit.js sheet() sets no inert/visibility. Every tool using HUKit.sheet inherits invisible tabbable content.
4. Nested interactives inside buttons: gvPillClr (span role=button inside gvPill button, L282) and .gv-only spans inside .hu-chip buttons. Keyboard-unreachable secondary actions.
5. base.njk phone bottom bar condition (navPage == tools/learn/...) catches TOOL DETAIL pages, not just hubs; all 7 tools set navPage: tools. On phones the fixed bar (z150, 56px) overlays map thumb clusters (z110) and the fixed attribution chip (z120). Landed with the V3 phase 3 base.njk edit. Verify intent with David before assuming regression twice.
6. Stale aria-labels on state-changing icon controls: gvDraw updates title but not aria-label when it becomes "clear". The scope chip (updateScopeChip) does it right; that is the in-file precedent.
7. Meta descriptions on tools run long (operators-map: 275 chars) and carry a parallel triad mirrored nearly verbatim in src/_data/tools.js desc.

David-blessed / do NOT re-flag:
- TYPES categorical palette (.impeccable/config.json).
- gv-pill row 44px + role=status on #gvStatus: fixed in the 2026-08-16 session.
- 9.5-10px mono CAPTIONS are the QP3 Caption Rule precedent sitewide; only flag sub-11px text that is INTERACTIVE (.gv-only is 8.5px and clickable, that one counts).
- dvh-only heights on map shells match the multi-lens precedent; only hu-global carries the vh fallback pair.
- prefers-reduced-motion is handled centrally by HUKit.dcap (returns 0) plus gated CSS animations; verified good.
