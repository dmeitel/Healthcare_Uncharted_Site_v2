---
name: teal-ink-migration
description: Ruled classification method for teal-dk to teal-ink light-theme migration; validated verdicts and which files are done
metadata:
  type: project
---

David's ruled decision (2026-08-16): light-theme teal TEXT below WCAG-large migrates --teal-dk (#1B9A90, 3.46:1 on white) to --teal-ink (#0D7268, 5.9:1). Icons, borders, gradients, and large text KEEP teal-dk.

**Why:** teal-dk fails 4.5:1 for normal text but passes 3:1 for non-text; one token swap per rule keeps diffs reviewable.

**How to apply:** Verify rendered size/weight from the BASE rule, never the class name. WCAG-large = >=24px regular or >=18.66px bold (15px/800 is NOT large). Rulings validated in the 2026-08-16/17 eight-file run:
- Control HOVER states count as text (vendor .ms-arrow:hover migrated at 17px glyph).
- Glyph-as-icon KEEPS teal-dk ONLY when its actual backdrop holds 3:1. On teal-tinted wells it fails: multi-lens .lv-metric .car (26% teal well, 2.9:1) and iceberg .hi:hover (14% wash, 2.84:1) both MIGRATED for the icon floor, not the text rule. Same glyph on white (.mn::before diamond, 3.46:1) KEPT, matching hu-global .pop-opt::after.
- Local theme ALIAS with theme-neutral consumers: repoint the light alias (1 value) instead of adding per-consumer overrides (the-payer --jp-teal). Accept non-text side effects if they stay >=3:1.
- rgba(27,154,144,x) BACKGROUND tints under dark ink are fine; the hex grep misses them, sweep for "27,154,144".
- Twin files (multi-lens/operators) must carry matching verdicts on shared selectors.
- Shared multi-selector declaration with MIXED verdicts: extract the passing selectors (large text, non-text glyphs) into their own teal-dk keep-rule with a comment, swap the rest. One added rule beats darkening elements that already pass (career-tree 1057-1070 block is the precedent).
- teal-dk as BACKGROUND under #fff text = separate FLAGGED bucket, David's call, do not touch (career-tree line 87 .hct-p-tabs button.on, 3.46:1, still open).

DONE (2026-08-17): multi-lens-map, operators-map, vendor-directory, hospital-map, sql-mystery, iceberg-map, hospital-price-finder, learn/the-payer, career-tree (incl. d3 pin to 7.9.0). Atlas was already migrated by another owner. Still carrying teal-dk light-theme small text (other owners): src/index.html, assignment-compass, data-observatory, hu-global (.section-tag, .nav-link.active, .hu-stat .v.hi, .hu-sr-row .why, .hu-bbar .bb-item.on).

Residual-tail sweep DONE (2026-08-17, second run): about (5 text rules), learn/index (5 migrated; ✓ tick, ◆ marker, hover arrows, h1 em kept), learn/sources (4), 404 (hover color only, hover border kept), rounds.css (SHARED across all rounds posts: group split, stat-num 32px/700 kept on its own teal-dk line, 5 text selectors + ref-link hover migrated), jevons redirect link, process-engineering .bn-t.teal SVG text fill (11px; .bn-dot kept), hitech --jp-teal alias (text-only consumers, per the alias precedent). camp-nauvoo: --hu-teal-dark defined but unused, no light theme = clean. --jp-accent-d defined in every jp-article head with ZERO consumers = dead token, left alone.

ALIAS PRECEDENT BOUNDARY: the alias-repoint precedent (line above) holds when consumers are text-only or near-text-only (the-payer: 1 svg stroke ride-along; hitech: none). It does NOT stretch to the jp-article template remap `--jp-accent: var(--teal-dk)` (alias feeds 13-23 consumers incl. the 86px serif hero em, whole SVG figures, and every accent border; repoint = restyle).

JP-ARTICLE FLAG RULED (David 2026-08-17): template-level `--jp-accent-text` step. Base block gets `--jp-accent-text: var(--jp-accent);` right under `--jp-accent:` (dark byte-identical); light remap block gets `--jp-accent-text: var(--teal-ink);`. Then per consumer: normal-size text color + SVG TEXT fill -> --jp-accent-text; WCAG-large em (h1 44-86px, h2 28-42px, stat .n em 38px) KEEP; borders/::before lines/eyebrow dot bg/SVG figure strokes-fills/hover border-color/dotted link underline KEEP; the 13px `.jp-source::before` "·" marker KEEPS per the white-backdrop glyph precedent. In `.jp-p a`, swap color only; the `border-bottom:1px dotted var(--jp-accent)` stays.

DONE (2026-08-17): ai-in-healthcare (11 migrated/23), healthcare-gap (9/20), leading-the-ai-transition (8/16), change-healthcare-stress-test (7/13) by one run; process-engineering (29 declarations migrated incl. 3 inline body links/63), laws-and-paradoxes (19 incl. 4 inline SVG loop-text styles/47), healthcare-data-sources (18/36), ehr-architecture (11/20) by the other. ALL EIGHT jp-article pages now carry the --jp-accent-text step. Extra verdicts from the second four:
- SVG text never earns KEPT-large: viewBox scaling drops it below large at phone widths (laws .jp-gc-mult 26px serif ~14px at 360w; pe .gx-title .em 21px). Both MIGRATED. Large-keep is only for HTML text with px floors (h1/h2 em clamps, 120px hero stat, 30px dm-letter, 26px cs-metric .v).
- color+border in one declaration (.jp-loop-play, .kit-copy, a:hover): swap the color property only, border property stays; currentColor play-icon rides to teal-ink, passes.
- Legend key (.jp-pc-leg.use) migrated with its currentColor swatch ride-along.
- pe .gx-hit.good dots over the 14% bull wash KEPT under David's explicit non-text-SVG-keeps ruling for this family (tighter than the iceberg 3:1-floor verdict; his ruling wins here).
NEW FLAGGED (accent bg under light text, untouched): laws .lpv-inbar "1 hr" (12px/700, fill --jp-bg) inside .lpv-bar-teal, ~3.26:1 light theme; joins career-tree line-87 .hct-p-tabs button.on in that bucket. STILL OPEN, other owners: hu-global/index/assignment-compass/data-observatory tail.
