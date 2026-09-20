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
| 0b | **The cost of living tool clips its scope badge by 45px**, so "Housing: Zillow county rents · rest: sta…" just stops. | It is the line that tells the reader where the numbers come from, and it is cut mid-word at 360. | Queue it. That tool is in an open design phase with round 2 already awaiting your read, so a separate edit would collide with work you have not looked at. Fold it into your round 2 pass. | 2026-09-19 |
| 1 | **The Device Assembly game.** Play it once on your phone and say alpha or not alpha. | You called alpha on 2026-09-19 without playing the shipped build on a real phone at the 360 px floor. Fifteen polish rounds went in on screenshots. | Play it once. If it holds, Claude drafts the launch post for your edit. Nothing else on that surface until you do. | 2026-09-19 |
| 2 | **The cost of living tool, phone layout.** Round 2 folded the question band up top and the detail behind it. Yes or redo? | It is the second-most-used tool and the phone version is the one strangers hit first. Round 2 has been built and unread for three weeks. | Look at it on your phone for sixty seconds. If the first screen answers the question without scrolling, it ships. | 2026-08-30 |
| 3 | **The Pop Health Multi-Lens Map name.** Rename it to what it is, or keep it? | Your own naming rule from 2026-08-30 says tools get named what people would search for. Every other tool got renamed under it. This one was skipped because you named it yourself. | Rename it. Something with "population health" in the title, old name kept as a search key so it still comes up. But it is your name, so it is your call. | 2026-08-30 |
| 4 | **The hidden Roles/Populations toggle on the career tree.** Delete it or bring it back? | It is set to display:none and unreachable at every screen width, but its twenty nodes still ship in the data on every page load. Dead weight either way. | Delete the toggle and the twenty orphan nodes. If you meant to keep the feature, say so and Claude wires it back instead. | 2026-08-17 |
| 5 | **The merged nav and toolbar band.** Automated pass is done and clean. Do you still want to eyeball it, or close the phase? | Swept 2026-09-20 with the repaired gate at 360 and 699 across all eight: atlas, cost of living, career tree, hospital map, system layers, SQL mystery, skill demo, vendor directory. Zero console errors, zero overflow, zero clipping except the one known scope badge. Three touch-floor misses found and fixed while in there. | Close the phase and write the merged band into DESIGN.md Tier 3. The automated read is clean and the band is the same shared mechanism on every page, so eyeballing eight pages would tell you what one already did. Open it again if a page ever feels wrong. | 2026-08-30 |
| 6 | **Rounds 04, "The Problem and the Product".** Voice pass. | Written and sitting. Rounds is the one section in full voice, and Claude should not be the last reader on a first-person piece. | Read it once and mark what does not sound like you. Claude fixes from your marks rather than guessing. | 2026-08-10 |
| 7 | **The HITECH article contradicts itself on one number.** The hero says nine percent of hospitals had a basic EHR; the body says 7.6 percent. | Both are sourced (the ONC trend series versus the Jha NEJM 2009 survey) but the page swaps between them without telling the reader. It is a published factual inconsistency. | Keep 9% in the hero, and add four words to the body line naming the survey it comes from. Two sources measuring different things is a fine answer; silently using both is not. | 2026-08-27 |
| 8 | **The Field Notes signup promises something the site cannot do.** The footer says "When something ships, you hear about it." Soften the copy, or build sending later? | The form collects correctly as of 2026-09-20, but nothing can send TO those addresses, and you stopped the newsletter work the same night. Every person who signs up is told they will hear from you. | Soften the copy now, one line, no new machinery. Something that promises a list and not a schedule. Revisit sending only if the list grows enough to be worth $33 a month, which is what automatic send-on-publish costs at every provider checked. | 2026-09-20 |
| 9 | **The RSS feed built on 2026-09-20 is uncommitted.** Keep it or revert it? | Built as the input for a newsletter you then stopped. It stands alone as a reader feature, but it was not something you asked for on its own. Three files, verified green, nothing pushed. | Keep it. Zero maintenance, no cost, some readers use feeds directly, and it is the input if sending ever comes back. One move to revert if you would rather have a clean tree. | 2026-09-20 |
| 10 | **Three Netlify projects build from this repo on every push.** Delete the extras? | `healthcare-uncharted` serves the domain. `healthcareuncharted` and a private project on your other Google account build the same commits and serve nobody. You are spending three builds per push to publish one site. | Delete the two that serve nobody, after confirming neither holds a domain or a setting you want. Not urgent, invisible to visitors, purely your build minutes. | 2026-09-20 |

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

- **2026-09-20** FULL SITE SWEPT AND CORRECTED, on your instruction, secret menu excluded.
  All 44 public pages at 360 and 699: **zero console errors, zero horizontal overflow, zero
  clipped content.** Seven real layout defects fixed, the worst being the laws-and-paradoxes
  page scrolling sideways to 1305px at 360. Touch floor raised on ~30 control groups. Stale
  cache stamps on hu-global.css and hu-kit.js bumped, which would otherwise have served
  returning visitors old CSS and an old kit after deploy. What was deliberately left alone,
  with reasons, is in the sweep memory: the Vendor Directory state cartogram, the hospital
  blueprint's pinch-zoom surface, the carousel dots, the desktop-gated Atlas Craft controls,
  and citation links covered by WCAG's inline exception.
- **2026-09-20** MERGED BAND SWEPT, all eight pages, 360 and 699, with the repaired gate.
  Clean: no console errors, no overflow, no clipping beyond the known cost-of-living scope
  badge. Three touch-floor misses found and fixed in passing: the SQL Mystery schema toggles
  (seven full-width buttons at 36px), and the Vendor Directory sector arrows (30px), filter
  selects (32px) and search input (42px). All raised on touch only, desktop untouched.
  Deliberately left: the Vendor Directory state cartogram (51 squares at 28px, a design
  element, 44px would make the map enormous) and its 8px carousel dots (25 sectors times 44px
  would be an 1,100px row, and the arrows and swipe do the same job).
- **2026-09-20** ICON SUBSET. The full Lucide UMD loaded from unpkg on every page: 80 KB over
  the wire, 355 KB to parse, ~1,500 icons for the 96 this site uses, behind a third-party
  round trip. `scripts/build-icons.js` now generates a self-hosted subset (5.3 KB gzipped),
  and unpkg is out of the CSP. About 74 KB and 336 KB of parsing saved per page. Measurement
  also said NOT to touch images (they sit in fixed CSS boxes, so no layout shift) or font
  weights (they sit in fixed CSS boxes, and it is a variable font).
- **2026-09-20** FONT REQUEST TRIMMED, on David's approval. DM Sans was asking for an
  optical-size axis that costs 39% per file (23,100 vs 14,092 bytes) and buys 0.13px across 31
  characters at 15px, plus a weight 300 that nothing used. Both dropped; italic kept after
  checking ten pages and finding it genuinely used. Combined with the icon subset, pages are
  about 110 KB lighter over the wire: /learn/ 358 to 246 KB, /about/ 390 to 277 KB,
  vendor-directory 374 to 275 KB.
- **2026-09-20** THE EMAIL SIGNUP HAD NEVER WORKED. The Field Notes form in the footer went
  up 2026-07-07 (commit 9bc9e3d) and captured nothing for ten weeks. The markup was always
  correct; Netlify's site-level form detection was off (`ignore_html_forms: true`), so no form
  was ever registered and the POST was never intercepted. Nothing was collected and nothing
  was lost. Fixed by enabling form detection on the production project and redeploying, since
  forms register at DEPLOY time and the toggle alone does nothing. Verified end to end: form
  registered with both fields and the honeypot, a real browser submission stored, `/thanks/`
  served. David then stopped the sending work and turned the notification back off; the form
  keeps collecting either way.
- **2026-09-20** FOUR Netlify projects render this repo across TWO Google accounts, which is
  why an hour went into finding the right one. `healthcare-uncharted` (12eaf952) holds the
  domain; `www` CNAMEs to it and its ETag matches the live site. A private project on the
  other account serves an identical copy that 404s to the public, so it looks correct on
  screen and is not. The repo's `.netlify/state.json` pointed at a third, non-production
  project: repointed at production (gitignored, local only, old value in `state.json.bak`).
- **2026-09-20** RSS feed built at `/feed.xml` from `collections.featuredPages`, the same
  curated list the home page uses, so `featured: true` stays the one switch that publishes
  something. Adds `dateRFC822` to `.eleventy.js` and a discovery link to `base.njk`. Twelve
  items, parses clean, verify green at 157, phone clean at 360 and 699. UNCOMMITTED pending
  question 9.
- **2026-09-20** Automatic send-on-publish is paid at every provider checked: Kit $33/mo,
  Buttondown +$9/mo, MailerLite from $12/mo. Free tiers cover manual broadcasts only. Also
  worth recording: the CSP's `form-action 'self'` blocks posting the signup form directly to
  any mail provider, the same wall that ruled out the Ko-fi widget. Any future sending setup
  keeps the form on Netlify and moves addresses separately.
- **2026-09-19** CORRECTION: an earlier entry here said the hospital map clipped 27 items and
  recommended fixing it. That was wrong. `.hm-campus-col` is a `makePinchZoom` surface, the
  same phone answer ruled for the Atlas: a deliberately oversized scene inside an
  overflow-hidden frame, panned by a JS transform. Nothing is unreachable. The gate now
  recognises a driven transform and reports 0 there, while still catching the real clipping on
  Rounds.
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
