# DECISIONS

Everything waiting on David, in one place. Built 2026-09-19 because four design phases,
nineteen docs and a 20 KB CLAUDE.md had open questions scattered across all of them with
no single list.

---

## HOW THIS WORKS

Four rules, written to fix four specific failures.

1. **If it is not on this list, it is not waiting on you.** One file. Claude updates it at
   the end of every session. No open question lives only inside a chat message.

2. **Every question arrives with a recommendation.** "You pick" is always a valid answer
   and means Claude takes the recommendation and moves. You never have to generate an
   option from scratch.

3. **Three questions at a time, maximum.** If there are more, they wait in the table below
   until the first three are answered.

4. **Plain names, not file paths.** A question says what a thing is before it says where it
   lives. "The cost of living tool" comes before the filename, never instead of it.

A fifth rule for Claude: no question goes on this list unless the answer changes what gets
built. Taste checks are not decisions. If Claude can pick a reasonable default and be wrong
cheaply, Claude picks and says so.

---

## NEEDS YOU

Ranked. The top three are the live ones; the rest wait their turn by rule 3.

| # | The question | Why it matters | Claude recommends | Open since |
|---|---|---|---|---|
| 0 | **Citations are cut off on phones in Rounds posts.** Reopen the parked reading surface to fix it, or leave it? | `span.cite` is `white-space: nowrap` and renders 452px wide in a 360px viewport. `body { overflow-x: hidden }` clips it, so the page does not scroll sideways and your phone gate reports CLEAN, but the reader just loses the end of the citation. Found on the Steward post; likely every Rounds post with a multi-source citation. | Let it wrap at phone widths. It is a one-line CSS change and it does not touch any of the round 1 or round 2 reading work. But the surface is parked by your ruling, so it needs your word first. | 2026-09-19 |
| 0a | **The 4Ps pills are 28px tall, the touch floor is 44.** Raise them, or accept it? | 52 of them on the Learn hub, 15 on Rounds, and they appear on cards across both. They are real links into the Atlas, and 28px is a hard Tier 1 floor violation, not a rounding error. | Accept for now, revisit with the reading surface. Raising to 44 nearly doubles their height on every card, and expanding the hit area invisibly makes adjacent wrapped rows overlap, which trades a small-target problem for a mis-tap problem. This is a density decision, not a cleanup. | 2026-09-19 |
| 0b | **Two tools cut text off on phones.** Fix now or queue? | Found by the repaired phone gate. The hospital map clips 27 items at 360, including the marquee call to action "click to explore hospital types & design". The cost of living tool clips its scope badge by 45px, so "Housing: Zillow county rents · rest: sta…" just stops. Both are text a reader is meant to act on. | Fix the hospital map, queue the other. The cost of living tool is in an open design phase with round 2 already awaiting your read, so a separate edit there would collide with work you have not looked at yet. | 2026-09-19 |
| 1 | **The Device Assembly game.** Play it once on your phone and say alpha or not alpha. | You called alpha on 2026-09-19 without playing the shipped build on a real phone at the 360 px floor. Fifteen polish rounds went in on screenshots. | Play it once. If it holds, Claude drafts the launch post for your edit. Nothing else on that surface until you do. | 2026-09-19 |
| 2 | **The cost of living tool, phone layout.** Round 2 folded the question band up top and the detail behind it. Yes or redo? | It is the second-most-used tool and the phone version is the one strangers hit first. Round 2 has been built and unread for three weeks. | Look at it on your phone for sixty seconds. If the first screen answers the question without scrolling, it ships. | 2026-08-30 |
| 3 | **The Pop Health Multi-Lens Map name.** Rename it to what it is, or keep it? | Your own naming rule from 2026-08-30 says tools get named what people would search for. Every other tool got renamed under it. This one was skipped because you named it yourself. | Rename it. Something with "population health" in the title, old name kept as a search key so it still comes up. But it is your name, so it is your call. | 2026-08-30 |
| 4 | **The hidden Roles/Populations toggle on the career tree.** Delete it or bring it back? | It is set to display:none and unreachable at every screen width, but its twenty nodes still ship in the data on every page load. Dead weight either way. | Delete the toggle and the twenty orphan nodes. If you meant to keep the feature, say so and Claude wires it back instead. | 2026-08-17 |
| 5 | **The merged nav and toolbar band** across eight tool pages. Sign off or list what is wrong. | It shipped to all eight pages on your approval and has never had your device read. It is the top of every tool page. | Claude runs the automated phone check on all eight first and brings you only the ones that fail. You should not eyeball eight pages. | 2026-08-30 |
| 6 | **Rounds 04, "The Problem and the Product".** Voice pass. | Written and sitting. Rounds is the one section in full voice, and Claude should not be the last reader on a first-person piece. | Read it once and mark what does not sound like you. Claude fixes from your marks rather than guessing. | 2026-08-10 |
| 7 | **The HITECH article contradicts itself on one number.** The hero says nine percent of hospitals had a basic EHR; the body says 7.6 percent. | Both are sourced (the ONC trend series versus the Jha NEJM 2009 survey) but the page swaps between them without telling the reader. It is a published factual inconsistency. | Keep 9% in the hero, and add four words to the body line naming the survey it comes from. Two sources measuring different things is a fine answer; silently using both is not. | 2026-08-27 |

---

## PARKED ON PURPOSE

Not debt. You stopped these deliberately and they stay stopped until you say otherwise.
Listed so they stop reading like unfinished work.

- **The Learn and Rounds reading surface.** Parked 2026-08-24, your words: "complete
  rewrites and tooling in the future." Two rounds shipped and stand.
- **Where the AI skills live long term.** Deferred 2026-09-18, your words: "put them on the
  site for now, we can decide storage/growth at a later date."
- **Surveys and the backend.** Parked.
- **The hospital price finder.** Parked, living in the secret menu.
- **The Atlas phone browse flow.** Closed and reverted 2026-08-23 on your ruling. The hex
  grid is identity, pinch and zoom is the phone answer. Not reopening.

---

## CLAUDE HANDLES THESE

No decision needed. Listed so you can veto any of them.

- **Device Assembly round 2 part 2** (card backing behind parts, lighter tubing, larger
  joints, a phone magnifier). Recommendation: skip it. You called alpha. This is polish on
  polish and the surface has had fifteen rounds.
- **Vendor Directory QA.** Claude runs the auditor and brings you failures only.
- **The attending tier and the seven-role voice pass** on the career matrix. Claude drafts,
  you edit.
- **Article 06 on FHIR.** Drafted when you want it, not before.
- **HSTS preload.** Staying off. It is a one-way door with a slow exit and the site does not
  need it.

---

## LOG

- **2026-09-19** THE PHONE GATE WAS INERT. `scripts/phone-check.js` compared
  `document.documentElement.scrollWidth` against `window.innerWidth`, but with Playwright's
  `isMobile: true` Chromium grows the LAYOUT viewport to fit overflowing content, so
  `innerWidth` becomes the content width and the comparison compares a number to itself.
  Measured on a Rounds post: the context was set to 360 and `innerWidth` reported 499, exactly
  the width of the overflow. The overflow check could never fail. It now measures against the
  device width we asked for, and it also reports CLIPPED content, which is what
  `overflow-x: hidden` turns an overflow into. Serverless 404s are exempted, since Netlify
  functions cannot exist in a static harness.
- **2026-09-19** Support link LIVE at `https://ko-fi.com/healthcareuncharted`, verified in a
  browser before wiring (a bare curl there returns 403 from bot protection, which is not a
  missing page). Renders in the footer, on About, under Rounds posts and in the tool strip.
- **2026-09-19** Support link added, off until a Ko-fi URL is pasted into `_data/site.js`.
  A plain outbound link, never a widget: the CSP blocks third-party script, iframe, remote
  image and cross-origin form post, and loosening four directives for a tip jar is not a trade
  worth making.
- **2026-09-19** FIXED, no decision left: both U.S. maps forbade seeing the whole country
  on a phone. They shared a hardcoded desktop camera (`center:[-96.5,39.3] zoom:3.6
  minZoom:2.8`); at 360 px that showed 36% of the width of the lower 48, and the floor
  capped it at 63%, so no amount of pinching reached the country. Replaced with
  `HUKit.conusView()`, which fits the lower 48 to the real container. Desktop returns the
  shipped frame bit for bit; only viewports too narrow to hold the country change. Seven
  regression tests added, and they fail against the old camera at every phone width.
- **2026-09-19** File created. Thirteen open threads found scattered across CLAUDE.md, the
  design phase log, and four memory files. Sorted into the three lists above. Verify gate
  green at the time of writing: build clean, types clean, 149 of 149 tests passing.
