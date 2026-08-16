---
name: recurring-defect-classes
description: Defect classes that recur across HU tool audits, with the files they cluster in
metadata:
  type: project
---

Recurring defect classes (first logged 2026-08-16, hospital-map audit):

1. DIV-WITH-CLICK chrome survives retrofits. Retrofits convert the obvious controls (units, chips, legend) to buttons but miss secondary chrome: marquee signs, infra badges, ground zones, generated rows with inline onclick. Grep `onclick=` and `addEventListener('click'` on non-button elements every audit.
2. LOW-ALPHA SUB-11PX TEXT fails contrast in BOTH themes. Scene-painted tools (hospital-map, likely operators/atlas) use rgba(140,180,215,.35-.55) and rgba(78,205,196,.3-.5) at 7-10px. Ratios land 1.9-3.4:1. The 11px functional floor lives in .claude/rules/css.md.
3. MECHANICAL EM-DASH SCRUBS leave two artifact shapes: mid-dot " · " inside sentences, and colon-pair parentheticals ("X: interjection: is ..."). Both read as typos. Check any page that had a scrub pass.
4. NEGATION-CONTRAST density in department/entry data far exceeds the hu-voice budget of ONE. Site grep ", not |not just|rather than" = 287 (2026-08-16); worst: career-tree (54), laws-and-paradoxes (28), hospital-map (17).
5. FIRST-INTERACTION replaceState: '§init' sentinel patterns make the first scope selection replace instead of push, reproducing the Atlas back-exits-site bug. Check every tool's serializer.
6. PHONE BOTTOM BAR (base.njk renders it for navPage home/tools/learn/rounds/secret, z-index 150, ~56px) overlaps tool-fixed chrome: anything fixed/absolute at bottom<56px with z<150 hides behind it; body padding-bottom only saves static flow.
7. Duplicate data ids in hand-authored unit arrays collide in id->object maps and in querySelector('[data-unit-id]') highlights.

**Why:** these came out of the 2026-08-16 hospital-map audit and match bug classes David already paid to fix elsewhere (Atlas back-guard, ink-state, 44px floor).
**How to apply:** run these as a checklist before the eight-category pass; grep site-wide when one instance appears.
