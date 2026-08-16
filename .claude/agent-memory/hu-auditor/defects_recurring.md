---
name: defects-recurring
description: Recurring defect classes found in the 2026-08-16 Atlas audit and the files where they cluster
metadata:
  type: project
---

Recurring defect classes (first recorded audit: src/atlas/index.njk, 2026-08-16).
**Why:** these are structural habits, not one-offs; expect them on every tool page.
**How to apply:** grep for each class before writing findings on any page.

- Em dashes in DATA-STRING copy (desc:'...' fields) and frontmatter descriptions. Atlas had 21 visible incl. meta -> og/twitter. The prose pages got voice passes; the JS data blobs did not.
- Light-theme gaps on JS-SET SVG attrs: presentation attributes need explicit [data-theme='light'] CSS overrides. Atlas .exp-sub labels (fill #E2EEF4, 1.19:1 on light) missed while .az-lbl got the override (line 357). Also frontier hexes vs moat tiles (moat overridden, frontier not).
- Help panels drift behind UI retrofits: atlas help still described ⊙ reset (now crosshair), the removed HUD grip bar, "bottom of the screen" HUD, "diamond markers". Whenever a retrofit lands, diff the help copy against the new chrome.
- Click-only divs/spans as controls: .find-row, .conn-row, .hud-drow, .fd-chip, breadcrumb .abc-item. Keyboard dead ends.
- Hand-rolled close buttons (#hud-close/#help-close/#conn-panel-close) instead of the .icon-btn primitive (hu-global.css:577) used in the same file's popover.
- Missing prefers-reduced-motion while vendor-directory:126, career-tree:166, hospital-map:896 all have it. Atlas routeFlow is infinite.
- Low-alpha steel-blue text rgba(140,180,2xx, .4-.6) fails 4.5:1 everywhere it appears (breadcrumb 2.97/3.29, hint 2.42, chips ~4.0, subs ~3.0-3.8).
- Absolute-positioned overlays keyed to the 52px toolbar height break when the phone toolbar wraps (atlas #atlas-find top:64px under a ~106px wrapped toolbar).
- Duplicated tiles/facts between a zone node and an expansion sub (Quality Measurement x2, PBM x2, MA >50% verbatim x2): search shows the twins.
- Triads + "list. verdict." card rhythm across all ~188 descs (71 runs of 3 sentences within 5 words); devices repeat ("chronically underfunded" x2, "primary failure mode" x2, "alert fatigue" x4, "the X everything else sits on" also on hub cards).
- Stale dated facts in descs: Olive AI (defunct 2023) still listed, $174.70 (2024) premium, "changing in 2025" OMB line.
