# Review and QA list · 2026-09-22

For David's page by page pass over everything changed on 2026-09-21 and 09-22 and not yet
committed. Written because the session ended with 84 changed files, eleven articles that look
different, and a site-wide layout rule that behaves differently when a phone is turned sideways.

Nothing here needs a command. Two ways to do the pass, both already running.

---

## HOW TO LOOK

**Two mirrored tabs (what you asked for).** Two tabs are open in the pane: one emulating a phone
at 375x812, one a desktop at 1440x900, both on the review server. Navigate in EITHER and the
other follows to the same page. The sync is a few lines the review server appends to each page
it serves, so the site itself is untouched and nothing ships.

**The split screen**, if you want both views in one window: `npm run review`, then
`http://localhost:8081/__review`. Page picker, arrow keys to step through all 52, `t` toggles
light and dark in both panes at once, and a 360 / 390 / 430 / landscape switch. The phone pane
is a real viewport at that width, scaled visually when the window is short, not a squashed frame.

Either way, `npm run build` first if anything looks stale. The review server reads `_site`.

---

## 1 · LOOK AT THESE FIRST · eleven articles changed how they read

Their headings were set in `DM Serif Display`, a font the site never actually loaded. They have
been rendering in whatever serif each device falls back to: Georgia on Windows, something else on
Android, something else again on iOS. CLAUDE.md names three fonts and that is not one, so the
headings moved to Outfit. Prose held at 17px through a new `--t-prose` token, so nothing shrank.

**This is the largest visual change of the session and the one most likely to be wrong.**

| Page | Path |
|---|---|
| The Payer | /learn/the-payer/ |
| AI in Healthcare | /learn/ai-in-healthcare/ |
| EHR Architecture | /learn/ehr-architecture/ |
| The Healthcare Gap | /learn/healthcare-gap/ |
| HITECH to Cures | /learn/hitech-to-cures/ |
| Leading the AI Transition | /learn/leading-the-ai-transition/ |
| Change Healthcare Stress Test | /learn/change-healthcare-stress-test/ |
| Process Engineering | /learn/process-engineering/ |
| Laws and Paradoxes | /learn/laws-and-paradoxes/ |
| Healthcare Data Sources | /learn/healthcare-data-sources/ |
| Request Routing | /learn/request-routing/ |

What to judge: do the headings still feel like articles rather than like tool pages? The serif
was carrying an editorial signal, and moving to the display face removes it. If the answer is
"these should be serif," say so and the fix is loading the font properly rather than reverting.

---

## 2 · NINETEEN PAGES MOVED ONTO THE SHARED SHELL

Their hero, eyebrow, headings and paragraphs now come from one place (`.hu-read` in
hu-global.css) instead of each page carrying its own copy. Anything genuinely that page's own
design was deliberately left alone.

The eleven above, plus: /learn/alarm-fatigue/, /learn/patient-data-record/,
/learn/home-respiratory-timeline/, /secret-menu/patient-journeys/.

What to look for: a heading that is now noticeably bigger or smaller than it was, spacing that
went tight or loose, an eyebrow that lost its dot separators, a paragraph that changed width.

**The first seven were converted before the converter was tightened**, so they deserve a closer
read than the rest: the-payer, ehr-architecture, healthcare-gap, hitech-to-cures,
leading-the-ai-transition, change-healthcare-stress-test, ai-in-healthcare.

---

## 3 · EVERY PAGE, TURNED SIDEWAYS

A phone is now decided by the SHORTER side of the screen, not the width. Before this, a phone
held sideways was 740px wide, over the 699 line, so it was served the desktop nav, desktop
charts, the desktop tool shell and the desktop dock. 76 breakpoints were converted.

Two visible consequences to check by rotating the phone on any page:

- **The bottom tab bar disappears in landscape** and the hamburger comes back in the top nav.
  Both together were 105px of a 360px-tall screen, 29% against a 20% ceiling. The bottom bar is
  a portrait idea: held sideways your thumbs are at the left and right edges, not the bottom.
- **The career tree's view switcher lies down** into one scrolling row instead of two stacked
  rows of icon-over-label. It was 113px, now 45.

Rotate on: the home page, /learn/, /rounds/, /tools/, /secret-menu/, /tools/career-tree/.

---

## 4 · NEW, DELETED AND RENAMED

| What | Where | Check |
|---|---|---|
| **Patient Populations**, new draft | /secret-menu/patient-journeys/ | Does it read as a useful starting point? Twenty patient states across three journeys, built from the career tree's hidden Populations data. Has NOT had a voice pass and the twenty states are not checked against a source. |
| **Cost of Living**, renamed | /tools/cost-of-living/ | The old /tools/assignment-compass/ URL 301s here. Check the old link still lands. |
| **Career tree counters** | /tools/career-tree/ | Now read ROLES HELD, CREDS HELD, SKILLS HELD, GOALS. The contradiction you photographed should be gone. |
| **AI tools pages**, deleted | gone | /tools/ should have no AI skills card, and the AI in Healthcare article should have no link to it. |
| **Atlas Craft**, deleted | gone | /atlas/ should have no Craft launch button bottom-right. |

---

## 5 · THE REST · a normal pass

52 pages total. Everything not listed above was touched only by the breakpoint conversion, so
portrait should be unchanged and landscape is the thing to try.

Hubs: / · /about/ · /learn/ · /rounds/ · /tools/ · /atlas/ · /secret-menu/
Learn: the eleven above plus /learn/4ps-framework/ · /learn/jevons-paradox/ ·
/learn/oxygen-payment-cuts/ · /learn/sources/ · /learn/talks/arma-2026/ · /learn/talks/msrc-2026/
Tools: /tools/cost-of-living/ · /tools/career-tree/ · /tools/hospital-map/ ·
/tools/iceberg-map/ · /tools/multi-lens-map/ · /tools/operators-map/ · /tools/sql-mystery/ ·
/tools/vendor-directory/
Games and secret menu: /fun/alarm-fatigue/ · /secret-menu/device-assembly/ ·
/secret-menu/uncharted-general/ · /secret-menu/er-charge/ · /secret-menu/health-system/ ·
/secret-menu/camp-nauvoo/ · /secret-menu/goat-tracker/ · /secret-menu/data-observatory/ ·
/secret-menu/hospital-price-finder/ · /secret-menu/patient-journeys/

---

## 6 · DO NOT REPORT THESE · they are deliberate

Recorded so a real finding is not lost in a list of things somebody already decided.

- **Device Assembly's painted board labels at 2.5 to 7px.** That is your open question, not a
  regression. Whether those need to read on a phone is part of the call.
- **The Vendor Directory state cartogram** (51 squares at 28px) and its 8px carousel dots. Design
  elements; 44px would make the map enormous and the dot row 1,100px wide.
- **The hospital map and Atlas pinch-zoom surfaces.** Deliberately oversized scenes inside a
  clipped frame, panned by a transform. Nothing is unreachable.
- **The two MapLibre maps keeping their own chrome.** CLAUDE.md excludes them from the merged
  band by the twins rule.
- **The career tree hiding its brand at 375px.** The row is full and the menu rides the thumb zone.
- **Hub pages dropping the hamburger** in portrait. They carry the bottom tab bar instead.
- **Goat Tracker failing the automated gate.** The harness polls the live GoatCounter API a dozen
  times per viewport and gets rate-limited. The page is fine.

---

## 7 · STILL WAITING ON YOU, unrelated to the visual pass

- **Cost of living, phone layout** (DECISIONS 2). A phone redesign built three weeks ago and never
  read. Does the first screen answer the question without scrolling?
- **Netlify** (DECISIONS 10). Delete `healthcareuncharted` (id a09e2c0f) at app.netlify.com; the
  sandbox blocked the delete here. And say what `verdant-treacle-8c70aa` was for, since it builds
  from no repo and last published in March, so it was left alone.
- **The commit.** 84 changed files. Worth deciding whether you want fixes from this review folded
  in before you commit, or a commit now and a second one after.

---

## 8 · WHAT THE AUTOMATED GATES ALREADY SAY

So the pass can be about whether it looks GOOD, not whether it is broken.

- `npm run verify`: 225 tests, 0 failures.
- `npm run phone` across 52 pages and eight viewports (360x740, 430x932, 699x900, 700x900,
  768x1024, 1024x768, 1280x900, 740x360), reading each page the whole way down: **two failures,
  both listed in section 6 as deliberate or known.**
- Zero console errors, zero horizontal overflow, zero clipped content, zero spilling boxes, zero
  text under the type floor, chrome inside budget, on every other page at every size.

What no gate can tell you is whether a page is worth reading, whether the hierarchy is right, or
whether a screen feels crowded. That is the whole point of your pass.
