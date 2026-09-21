---
name: alarm-fatigue-audit
description: Learn Article 11 /learn/alarm-fatigue/ pre-ship audit 2026-09-20 - what was clean, what recurred from M03, the concurrent-edit trap, and the checks that are now scripted
metadata:
  type: project
---

Audited /learn/alarm-fatigue/ (Article 11, companion to the /fun/alarm-fatigue/ game) 2026-09-20, same day it was written. Source at 18:17:05, build at 18:17:09. See [[request-routing-audit]] for the Learn-module seams this confirmed.

**Trap: the file was being voice-edited WHILE the audit ran.** Between my first and second read the callout aphorism ("a floor, not a count"), two colon-drops, "ordinary furniture", and the X-and-the-Y h2 ("What the game models, and what it leaves out") were all rewritten by another session. Re-read the source and `stat` source vs _site before writing any copy finding on a page written the same day.

**Clean on this page (do not re-check from scratch, spot-check):** zero em dashes in source, build, title and meta; zero banned vocabulary; negation-contrast exactly 1 (line 114, inside budget); focus outline theme-flipped via `--afe-accent` (the M03 defect, fixed here); all body type on `--t-*` tokens; every number in Parts 1 to 4 sits above a source line with "Checked 2026-09-20"; phone gate CLEAN at 360/699/1024; the game facts the page asserts (0600 to 1800 shift, hire-a-tech, the wear mechanic at game line 1687) all verified in src/fun/alarm-fatigue/index.html; both Atlas ids resolve (atlas.js 158 nursing, 186 informatics, provider zone, applyHash splits zone/node); DOI resolves 200; ECRI PDF 200; jointcommission.org returns 403 to curl (bot block, not a dead link).

**Recurred from M03:** index-card desc truncated against learn.js desc (card drops "hospitals to do about it"); prose token step differs from siblings (this page --t-body 15px, M03 --t-lede 16px, payer/PE 17px literal).

**New to this page (added to [[recurring-defect-classes]] 25 to 28):** hero dropped the sibling `.card-fps` Atlas strip, byline and bottom hairline; 3 of 4 sources unlinked in-page while references.js carries all four URLs; button hover to literal `#2478d4` (white on it 4.45:1) where `--blue-deep` is the precedent; `display:block` on the table at 699 instead of the `.rr-tblwrap`/`.pe-tblwrap` wrapper.

**Not yet ruled by David:** "Part N" kickers (only Learn module that numbers them), the paragraph-then-list restatement of the four NPSG elements (lines 100 vs 101-106), the game-tagline echo ("hear the one that matters") on four surfaces.

Sentence script that produced the distribution lives in the session scratchpad only; it is 25 lines of node (split `<p>`/`<li>` text on `[.!?] + capital`, bucket, and flag runs of three within five words). Rewrite it rather than hunting for it.
