---
name: hospital-map-audit-2026-08-16
description: Hospital Blueprint audit findings snapshot, open blockers, and what NOT to re-propose
metadata:
  type: project
---

2026-08-16 audit of src/tools/hospital-map/index.html (post-retrofit: HUKit.sheet, button units/chips, ?unit=, 699 line, em-dash scrub).

Top open defects (verify fixed before re-flagging):
- BLOCKER: duplicate unit ids `stepdown` (f10+f3), `dialysis` (f11+f3), `infusion` (f11+f3) -> UNIT_MAP collision serves FL3 content for FL10/FL11 clicks; highlight hits first DOM match; ?unit= ambiguous.
- '§init' lastScope sentinel makes the FIRST unit click replaceState -> back exits site on fresh visits (Atlas bug class).
- findAndOpenDep substring match: ~98 dep chips with parentheticals are dead buttons; 'ICU' chip opens Neonatal ICU.
- Bottom bar overlaps .hm-mobile-hint (z140<150) and .pz-reset-btn on phones.
- Stale comment l.3093 "the blueprint has no URL serializer" contradicts the serializer 30 lines above it.
- Scrub artifacts: ~8 mid-dot " · " mid-sentence + 10 colon-pair parentheticals; "genuinely" in CVICU overview; "navigating" (figurative) in HR overview.
- No h1 anywhere on tool pages (base.njk supplies none; .tool-bar-title is a span). Site-wide, lives in the layout chain.

Do NOT flag: the illustrative building-zone emoji (and welcome-hint emoji) are an OPEN EDITORIAL QUESTION for David, not a defect. Dark/light scene palettes being hardcoded rgba is the scene-tool precedent, only flag contrast failures.

**Why:** the parent asked for regression-hunting on this retrofit; these are the confirmed regressions vs pre-existing classes.
**How to apply:** next hospital-map audit, diff against this list first. See [[recurring-defect-classes]].
