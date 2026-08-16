---
name: recurring-defect-classes
description: Defect classes that repeat across HU tool pages, with the files where they cluster (first logged 2026-08-16, multi-lens audit)
metadata:
  type: project
---

Recurring defect classes observed in the 2026-08-16 multi-lens-map audit. Check these first on any tool-page audit.

**Why:** the map tools share copy-pasted machinery (multi-lens borrows operators-map patterns verbatim, e.g. `gv-sr-meta`), so a defect in one is almost always in the other.

**How to apply:** grep the sibling tool before calling anything page-local.

- KEYBOARD-DEAD SWITCHES: `<span role="switch" tabindex="0">` wired with click-only handlers, no Enter/Space keydown, and the Map-labels pair has no accessible name. Cluster: src/tools/multi-lens-map/index.njk (lvMoreSw, lvLabState, lvLabCity), src/tools/operators-map/index.html:1346-47 (gvLabState/gvLabCity).
- NO H1 ON TOOL PAGES: full-map tools have zero h1 and drawer sections jump straight to h5 (multi-lens: 6×h5, 0×h1 in _site; operators-map also 0×h1). base.njk provides no heading.
- PHONE BOTTOM BAR vs FULL-MAP TOOLS: base.njk line 216 keys the hu-bbar on `navPage == 'tools'`, so every TOOL page (not just the hub) gets the fixed z-150 bar, overlapping bottom-anchored tool controls (z-110). All 8 files in src/tools/ set navPage: tools.
- NESTED PSEUDO-BUTTONS: action spans (`ovbtn`/`pinbtn`) inside a real `<button>`, routed by e.target — pointer-only, and they pollute the option's accessible name.
- STATIC aria-label OVERRIDING A LIVE READOUT: lvMetricBtn's label hides the current metric/position/year from SR users.
- SUB-11px FUNCTIONAL MONO TEXT: 9-10.5px captions/legends across both map tools despite the 11px floor in .claude/rules/css.md.
- NO NOSCRIPT anywhere in src/ — every tool renders inert chrome with JS off.
- EM DASHES leak in two ways: visible UI strings (multi-lens Display-tab pin copy) and dataset defn strings (metricsConfig economics/0); also '—' as empty-value glyph (multi-lens only, 11 spots).
- LIGHT-THEME TEAL HOVER: `:hover { color/border: var(--teal) }` without the `[data-theme="light"] … --teal-dk` override the same file applies to resting states (#4ECDC4 on white = 1.9:1).
