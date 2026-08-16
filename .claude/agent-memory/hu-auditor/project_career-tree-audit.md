---
name: career-tree-audit
description: Career Tree audit 2026-08-16 - known-open exemptions David gave, recurring defect classes, where they cluster
metadata:
  type: project
---

Audited /tools/career-tree/ 2026-08-16 (post-decks v23 promote).

**Known-open, DO NOT RE-REPORT (David's list, given in the brief):** phone board framing (dedicated phone build queued), SVG canvas text under 11px (canvas-scale exempt), 24px on-canvas .hct-cact buttons (queued), CLS 0.215 on init (known). Decks interaction model (collapsed board, look/focus split, hex slivers, floating right card, Connections tab) is deliberate; never propose reverting it. docs/HU-INSTRUMENT-GRAMMAR-2026-08-11.md is the law.

**Recurring defect classes found (check these first next audit):**
- Stale hardcoded counts: "158 real roles" in 4 visible strings (index.njk 1390, 1570, 4278, 4303) vs 164 nodes in career-tree.json. Same class as vendor-directory's "158 vendors" literal. Any tool that advertises a dataset count in a string literal drifts.
- Em dashes in DATA files, not templates: career-tree.json pathway/zone blurbs carried 3. Template JS/CSS comments are full of em dashes (not visible copy; do not flag).
- "X, not quotes" negation device family on 3 tools: career-tree legend 4605, assignment-compass 390, hospital-price-finder 110.
- --teal-dk (#1B9A90, hu-global.css:14) is 3.46:1 on white; pages map small text to it in light mode. career-tree already concedes this once (comment at inline CSS ~line 1070, one-off #0D7268 fix). Site-wide token issue.
- Dark-theme hint-text alphas (0.5-0.55 on near-black) land 3.3-4.0:1: .bp-dash-lbl, .bp-hint, .hct-blurb, .bp-bill-fine, .edu-detail-empty.
- div.bp-addmenu-item menus (More menu + Add section) are keyboard-unreachable divs.
- SVG role="button" without tabindex on .hct-hexact slivers (~line 3005).
- Modals (#hct-welcome-modal, #bp-station-modal, #bp-data-modal) have no dialog role/aria-modal/focus trap.
- Meta description + tools.js:158 card desc still claim the retired Patients "second track" (toggle hidden at index.njk 1398-1405).

**Precedent notes:** no <noscript> anywhere in src (site-wide). d3@7 unpinned+blocking matches atlas + data-observatory. Gold literal #E8C547 coexists with token --amber #E8A838 on career-tree, multi-lens-map, operators-map. h1 present on assignment-compass/vendor-directory/atlas, absent on career-tree/hospital-map/operators-map (mixed precedent).

**No fixes rejected by David yet** (first recorded audit under this memory). Base.njk em dash was previously "his call" per the user-level memory; do not push it.
