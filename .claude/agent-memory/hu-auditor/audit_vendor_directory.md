---
name: audit-vendor-directory
description: Recurring defect classes found in the 2026-08-16 vendor-directory audit, plus the blessed/known-open list to not re-report
metadata:
  type: project
---

2026-08-16 audit of src/tools/vendor-directory/index.html (post URL-state retrofit).

**Recurring defect classes (check these first on re-audit):**
- Copy tells live in the DATA files, not the templates. vendors.json carried 33 negation-contrast constructions (8 "not just", 12 "rather than", 6 "instead of"), a 9x "quietly" tic, 5x "Watch whether..." watch-line openers, and 26 monotone 3-sentence runs. Audit src/assets/data/*.json prose fields, not just the page.
- Light-theme accent legibility done via `filter:brightness(.68) saturate(1.4)` (page CSS, `[data-theme="light"] .vc-tag`) instead of explicit token overrides; result: every tag/status chip ~2.4-3.6:1 in light theme. The correct precedent is the explicit per-hue overrides in the same file (hqt l1-l4 light rules) and hu-global.css teal-dk pattern.
- The "what sector / which layers / proven, emerging, or cautionary" triad is quadruplicated: meta desc, hero sub, src/_data/tools.js:54, src/learn/process-engineering/index.html:946.
- Page-local controls (.vd-cat, .ms-arrow, .ms-dot) skip the explicit :focus-visible treatment that global controls (.icon-btn/.selector/.pop-opt, hu-global.css ~587-651) and the page's own .hqt all have.
- Breakpoint drift: page uses max-width:700px (2x) against the declared 699px phone line; hu-global.css itself still has two 700px stragglers (lines ~244, 327).
- Scribe market-share slide sums to 101% with "Other" mid-list (SHARE_SLIDES, Menlo data).

**Blessed / known-open, do NOT re-report:**
- Vendor cards are div[onclick] with no keyboard path: QUEUED fix, David knows.
- .hqt 28px dense tile grid: by design.
- 47-value sector palette + .ms-fill chart-bar width motion: David-blessed in .impeccable/config.json.
- En dashes in numeric ranges ($600–800, 1–2): site precedent (hq-legend uses &ndash;), not an em-dash violation. Zero true em dashes in vendors.json.
- no_footer on tools: uniform across all 10 tool/atlas pages, not an inconsistency.
- Hand-rolled popover logic vs HUKit: kit extraction is a queued site-wide project, not a per-page defect.

**No David-rejected fixes recorded yet for this page.**
