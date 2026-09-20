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
| A | **Diagram reflow: pattern proven, one page done, twelve to go.** | The approach is settled and there is a worked example to copy: a chart gets a SECOND drawing authored near 320 units wide, swapped at 699 by `.hu-chart-tall` / `.hu-chart-wide` in hu-global.css. Both figures on the burnout Rounds post are done and the page is clean at 360, 699 and 1024: zero under the floor, zero collisions, desktop untouched. What is left is the same job on the other twelve pages, roughly 18 drawings, mostly the `lpv` family on laws-and-paradoxes and `gx` on process engineering. | Keep going the same way, one page at a time, but it is real hand work: each drawing needs its coordinates rewritten and its labels checked by eye, because the gate cannot tell you a chart is ugly, only that it is legible. Roughly a page per sitting. If you would rather spend the time elsewhere, the honest middle is to do the three or four charts that carry an argument and leave the decorative ones wide. | 2026-09-20 |
| B | **The merged band QA is now blocking six pages.** Play the eight converted tool pages on your phone and say yes or no. | It was already on this list as item 5, but it has stopped being a tidy-up and become a blocker: six surfaces stack two top bars and fail the chrome rule, and the merged band is the shipped mechanism that fixes all six. Nothing moves on them until you look. `/fun/alarm-fatigue/` also crossed the line today, 19 to 24 percent, because the comfort scale made its clicker bar taller. | Play them, then I convert the six. The eight are atlas, cost of living, career tree, hospital map, system layers, SQL mystery, skill demo, vendor directory. | 2026-09-20 |
| P | **The three-month plan.** Read docs/HU-DEV-PLAN-2026-Q4.md and mark it up: approve, cut, or reorder. | It is the working plan for 2026-09-21 to 12-20 (games, content, platform), built from the live traffic (one Reddit post = about 1,500 views in a week; the games are the front door), the games audit, the backend state and the multiplayer market. Nothing in it is built. Two questions inside it are its gates: which game is the second consumer of the table kit (recommended: Device Assembly two walls), and whether the hospital game leaves the secret menu in month 3 (recommended: yes, gated on game night #1; your 2026-09-02 ruling was no, and the numbers since are why it is being asked again). | Approve month 1 as written and mark up months 2 and 3 as they arrive. "You pick" on the two inner questions means Device Assembly second and the front door in month 3. | 2026-09-20 |
| S | **The multiplayer backend is gone from DNS.** Restore the Supabase project, or make a new one? | The host in the hospital game and in the CSP (`swntgsmpcqyuapkkyaqj.supabase.co`) returned NXDOMAIN from two resolvers on 2026-09-20, so The Table cannot connect for anyone. Free projects pause after a week idle, which the design doc predicted on 2026-09-07; the keep-alive ping named there was never built. Whether it is paused or deleted is only visible in your dashboard. | Open the dashboard on the main account. Restore if it offers to; otherwise a new free project. Either way Claude makes the two-line change (the `SUPA` constant, the `connect-src` entry), adds a GitHub Actions cron ping every three days, and a test that fails when the two files name different hosts. | 2026-09-20 |
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

- **2026-09-20** THE THREE-MONTH PLAN. David asked for a full analysis and a development plan
  (multiplayer games, content growth, infrastructure). Written to docs/HU-DEV-PLAN-2026-Q4.md as a
  DRAFT for his markup (question P). What the analysis measured: July 179 views, August 162,
  September 1 to 20 1,600, of which about 1,500 came in the week after one Reddit post about
  Alarm Fatigue (peak 532 on Sep 12); 56% of the trailing 90 days is reddit.com; the best single
  Learn page had 7 views and the best Rounds post 6; the game held 48% of its measured sessions
  past two minutes. The Supabase host the hospital game's Table points at NO LONGER RESOLVES
  (question S). Four of the five games have the engine shape multiplayer needs; Alarm Fatigue
  does not and has no tests. No CI, no scaffold, and the RSS feed carries 12 of 44 pages. The
  multiplayer market was researched (plan section 6): stay on Supabase this quarter, Cloudflare
  Durable Objects is the escape hatch, Hathora is dead and InstantDB is sunsetting. Nothing was
  built. A second session was editing this file the same day (rows A and B); its rows were left
  as found.
- **2026-09-20** THE COMFORT SCALE, THE GATE, AND ONE BAD HOUR. Shipped after David read the
  preview on his phone: seven type tokens, every phone step its desktop value plus 2, and
  about 1,900 font-size literals migrated onto them. Zero literals left in the 12 to 16px
  band. Zero overflow and zero clipping across 53 pages, which was the risk worth checking.
  `npm run phone` now also fails on SVG LABEL COLLISION, because the fix for small diagram
  text is bigger diagram text and the two pull against each other; a pinch-zoom scene is
  exempt. It found one real defect, a value label and a reference annotation overlapping 60%
  on the burnout post at EVERY size, desktop included. Fixed. Both figures on that post were
  redrawn as phone charts, which is the pattern for the remaining eighteen.
  THE BAD HOUR, recorded because the shape of it matters more than the bug: editing a CSS
  comment left a closer with no opener, the parser swallowed the whole
  `@media (max-width:699px)` token block as part of an invalid selector, and the comfort
  scale applied to NOTHING. It hid because the gate reads its floor from `--t-micro`, so the
  token falling back to its desktop 11px quietly lowered the gate to 11 and every page
  reported clean at a size the standard forbids. I reported it shipped and verified. It was
  not. Caught only by querying the token directly when a diagram measured 11.4px against a
  12px token. `tests/type-scale.test.js` now pins comment balance and the floors as literal
  numbers, proven by reintroducing the bug. A gate that reads its threshold from the thing it
  checks has to be told what that threshold may not be.

- **2026-09-20** THE TWO SURFACES. David: "it appears we are trying to squeeze the regular
  website onto a phone screen." Measured, and he was right. Across 20 pages at 360 and 1280,
  92 to 100 percent of text rendered at the IDENTICAL pixel size on both; controls matched
  only 20 to 40 percent, because tap targets had been patched to 44px one at a time over a
  year. The site had been made to FUNCTION on a phone and never once DESIGNED for one.
  The cause was structural: nine spacing tokens, a full color ladder, and ZERO size tokens.
  All 723 font sizes were literals, so there was nowhere a phone type decision could be made
  and none ever was. DESIGN.md's own 11px floor, adopted 2026-08-09, had been quietly
  violated 4,044 times, down to 2.5px, because it named a number with no token behind it and
  no gate in front of it. Fixed in four parts: the standard (DESIGN.md "The Two Surfaces",
  Tier 1, the Legibility Floor Rule, .claude/rules/css.md); the tokens (--t-body, --t-ui,
  --t-label, --t-micro, each with a desktop and a phone value); the gate (`npm run phone`
  now FAILS on text under the floor and on chrome over 15 percent, reading the floors from
  the tokens so the two cannot drift); and the start of the migration (hu-global.css, the
  vendor directory, the sources ledger). 163 tests pass. Still open: 2,033 sub-floor elements
  across 279 rules, and the two questions at the top of this file.
- **2026-09-20** PUSHED TO PROD AND VERIFIED LIVE. Checked against
  `healthcareuncharted.com`, not the local build, because this push changed the CSP, swapped
  where icons come from and bumped nine cache stamps, and any of those failing takes the icons
  off every page. The served CSP no longer lists unpkg. `hu-icons.js`, `hu-global.css`,
  `hu-kit.js` and `feed.xml` all resolve. Fourteen pages loaded headless at 360: every
  `data-lucide` placeholder replaced, zero console errors, zero CSP violations, no overflow,
  the support link present on all of them. Both maps boot at zoom 2.01 on a 360 phone and show
  the lower 48 coast to coast, which is the fix that had the race condition, so it was worth
  confirming on real hardware rather than trusting the unit test.
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
