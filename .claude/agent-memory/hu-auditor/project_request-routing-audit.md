---
name: request-routing-audit
description: Learn M03 request-routing pre-ship audit 2026-08-24 - defect classes found, where the voice budget breaks on new editorial pages, contrast math for the accent tokens
metadata:
  type: project
---

Audited /learn/request-routing/ (Learn module M03) 2026-08-24, pre-publish. See [[career-tree-audit]] for the prior recurring-defect list; several classes recurred here.

**Recurring defect classes CONFIRMED on a second surface (check first on every new editorial page):**
- Negation-contrast blowout on NEW pages: budget is 1/page, this page shipped ~9 (four "X, never Y" alone). Site-wide ", never " = 22 hits / 11 files; career-tree 5, request-routing 4 are the top two. New prose gets written over-budget; the em-dash suite cannot catch it.
- Dark-theme accent-as-small-text AA fails: --blue-hi #2478d4 is 3.9:1 on --surface / 3.7:1 on --raised; --purple #7C6FCD is 4.2:1 / 3.9:1. Light theme got dedicated -dk/-ink text steps (hu-global.css:15-22); dark theme has none, so pages use raw accents for 10-15px text. The fp pills (hu-global.css:507) already solve this with lighter dark-theme hues; that is the precedent.
- Missing dark-step token forces literals: page hardcodes #574A9E because no --purple-dk exists. Same class as the pre-token dark-green inventions the hu-global comment (lines 17-19) describes.
- Stale/optimistic hardcoded numbers: "~14 min read" byline vs ~5,000 visible words (~19-22 min). Same class as career-tree "158 roles".
- Focus outline not theme-flipped: page-scoped `:focus-visible` teal is 1.72:1 on the light ground; hu-global.css:148 flips fs-input outlines to --teal-ink and is the precedent.
- Hardcoded nav offsets: 76 (JS scroll) and 90 (scroll-margin-top) on the same page; the --nav-h refactor is already queued in David's user-level memory.

**Seams specific to Learn modules:**
- Hand-coded index card desc vs learn.js desc vs frontmatter description can diverge; M03 card ends "ready to steal", the other two end "written down". learn.js + frontmatter matched; the card drifted.
- Tab-sectioned modules vs the reading chrome: read-progress/finish-tick measure scroll of the DEFAULT tab only; a reader earns the finish tick without opening tabs 2-4. Content-agnostic chrome meeting tabbed content; flagged, not ruled on.
- Learn body type precedent is 17px/1.78 (process-engineering .jp-p, index.html:123, ruled RIGHT in the 08-23 audit); M03 uses 16px/1.72 .rr-p.
- Rhetorical device reuse across Method modules: "Tuesday" as ordinary-day device is in both M01 (line 674) and M03 (line 1242).

**Function bug class worth re-checking on any branching quiz:** answer-changing leaves later steps visible with stale state. M03 router: change Q3 yes->no and the PROJECT question stays on screen; user can produce "Optimization / Project / Demand record", which the page's own callout (line 708) forbids.

**No fixes rejected by David yet on this page** (first audit, pre-publish). Learn/Rounds reading surface is PARKED by his 2026-08-24 ruling; do not propose reading-experience redesigns, only defect/consistency findings.
