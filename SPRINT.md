# SPRINT

The current piece of work, as numbered steps in the order they depend on each other. The map for the
quarter is docs/HU-DEV-PLAN-2026-Q4.md; this file is what is being done right now. Read it after
DECISIONS.md at the start of every session.

Cut to what is open on 2026-10-04 (David: "go ahead and trim DECISIONS and SPRINT"). It had grown to
120 KB of finished steps. Everything that was in it, word for word, is docs/HU-SPRINT-LOG.md.

---

## START HERE · 2026-10-04, late

- **The hub is built and waits on David's QA.** All three stages went in on his "yes to both, go ahead and build
  the hub": the board, the run sheet, the QA list, pictures, Ship. It is at the QA stage. His list is the hub's own
  QA tab: `npm run hub`, then /__hub/qa (in a session, the preview entry `hu-hub`).
- **Then:** tweaks from his notes (`node scripts/hub/qa.js` lists them; `... fixed <item> "what changed"` sends
  one back), then Ship (`npm run ship`). After that the sprint proper: Device Assembly primary, A Routine Fracture
  secondary. Nothing else until one of those is done; anything new goes to the Inbox.
- **Live:** everything through b5dcc82, pushed 2026-10-04. NOTHING SINCE IS PUSHED. A close is a save point now
  (commit, no push; DECISIONS HUB2); the push is the hub's Ship.
- **The NOW section below is printed from the board** (data-build/board.json). Change it with `npm run board`.
- **QA is at milestones** (CLAUDE.md ALWAYS TRUE). Do not ask him to look after each step; file the pictures.

## THE FRAME, STILL IN FORCE

- 2026-09-22, David: "before we continue down more content generation i want to really focus on that... our 3
  month plan can continue but the frame of what we have been doing the last few sessions has to help create a
  better foundation for us to work off of." So no new content until the foundation holds. Every task has to
  leave the site more consistent than it found it, or it waits.
- 2026-09-21, David: "Cancel all content additions in our plan until we do a page over page review for phone
  vert and horizontal and web page look at feel." Still standing. The one exception he made in conversation is
  the broken-arm Rounds piece (2026-10-02), now a review draft in the secret menu.
- Games and tools keep moving under their open design phases (CLAUDE.md, OPEN PHASES).

## HOW THIS WORKS

- **One sprint at a time, one goal in one sentence, and a definition of done David can see or
  play.** Never "the code is in".
- **Steps, not days.** The steps are numbered in dependency order. David moves through them as
  fast as his time allows; a step is never scheduled to a weekday. Any date in this file is a
  deadline for something outside the repo (a friend, a deploy), not a plan.
- **Every step names an owner:** David, Claude in the session, or a named agent. Every step has an
  acceptance line. A step with no acceptance line is not a step, it is a wish.
- **David's steps are written in plain words, click by click.** He never runs a command. Before
  each of his steps, Claude has shown him what to expect.
- **Every Claude step files its pictures, phone width and desktop width; David looks at milestones.** His
  ruling, 2026-10-04: "I really don't want to do QA on anything until we have made major milestones."
  `npm run shots -- "What changed" /page/` files them; the hub shows them. A look-or-feel decision that blocks
  the build still comes to him with a picture of each option.
- **Changing the sprint is allowed and expected.** David says the new goal in the conversation.
  Claude rewrites the steps, moves anything displaced back to its month in the plan, and writes
  one line under CHANGES saying what moved and why. Nothing is silently dropped.
- **The sprint closes with numbers.** The result in the LOG, one line in the plan's log, and the
  next sprint drafted for David's yes.
- **Gates do not move for a sprint.** `npm run verify` green and `npm run phone` clean before any
  ship. David commits, pushes and posts.

Step statuses: NEXT · DOING · DONE · WAITING (say on what) · MOVED (say where).
- **Finished steps leave this file at the close of the window that finishes them.** They go to the top of
  docs/HU-SPRINT-LOG.md, under "Since the split". This file holds only what is open. (2026-10-04)

---

## NOW

<!-- board:start (printed from data-build/board.json by `npm run board`; change the file, not this block) -->
The board, printed. The picture of it is the hub: `npm run hub`, then /__hub. Stage names: Plan, Build, QA, Tweaks, Ship.

### Focus · primary · Phone play · stage: QA

Device Assembly plays by thumb on a real phone: the game aims for you, every move works with taps, and the wall gets most of the screen; the twelve rules behind it hold every game.
Done looks like: The thumb test passes at four real phone screens (10 and 20 px misses, drag and taps alone), the wall is at least 55% of the screen on the SE and iPhone 15, and David marks his phone play good on the hub's QA list.
Plan: docs/HU-PHONE-PLAY-PLAN-2026-10-12.md

| # | Step | Owner | Done when | Status |
|---|---|---|---|---|
| 83 | **The thumb test, first:** a touch test that misses like a person (10 and 20 px, eight directions), by drag and by taps alone, at 375x548, 393x659, 360x640 and 430x746, plus the layout checks; it replaces the robot test in da:qa. | Claude | It runs and its first report shows today's failures on the hub | DONE 2026-10-12 |
| 84 | **The bottom of the screen:** the order as one line, the tray as one slim row that turns into the picked part's buttons and the Back to cart zone, Undo beside Complete; nothing floats over the wall. | Claude | The wall is at least 55% of the screen at 375x548 and 393x659 (today 28% and 41%); nothing over the wall while a part is held; no scroll | DONE 2026-10-13 |
| 85 | **A tap is a tap:** touch drags start after 10 px; a tubed port unplugs only when pulled; press areas go to the nearest port or part; the tray swipe scrolls without a ghost. | Claude | The thumb test's wobble checks pass | DONE 2026-10-13 |
| 86 | **The game aims for you:** a held part or tubing end lands on the nearest place it fits within 44 px, only those places lit; the bottom rows reachable. | Claude | Every drag in the thumb test lands with a 20 px miss | DONE 2026-10-13 |
| 87 | **Everything by taps:** tap a part or tubing on the tray, tap a lit place; tap a wall part to move it; the phone hints teach the tap way. | Claude | Tutorials 1 to 5 and Level 2 solve with zero drags at all four phone screens | DONE 2026-10-13 |
| 88 | **The feel of a connection:** the snap checked on touch at the new sizes; a buzz on phones that can, with a Settings row, on by default. | Claude | The setting is remembered; pictures filed | DONE 2026-10-13 |
| 89 | **Write the standard down, then measure the other games:** the twelve rules into the hu-game-shell skill and games.md, the thumb test made shareable, Uncharted General, Alarm Fatigue and Vital Stats measured. | Claude | The skill section is in and the three-game report is filed | DONE 2026-10-13 |
| 90 | **His QA:** he plays it on his phone over the home wifi and marks the hub's QA list. | David | His QA list is clear | NEXT |

### Focus · secondary · Daily Huddle · stage: QA

The daily trivia board: the day's 19 tiles in the Atlas zones, cross from the top row to the bottom with no time limit and no miss limit, your time and misses as the result, three lifelines, a share line, practice, past boards and team boards, on one phone screen, on the Fun shelf.
Done looks like: David plays today's board on his phone and a desk, and marks the hub's QA list; his notes start the refinement rounds.
Plan: docs/HU-HEX-TRIVIA-PLAN-2026-10-14.md

| # | Step | Owner | Done when | Status |
|---|---|---|---|---|
| 91 | **The question bank:** scripts/build-huddle.js turns Vital Stats' bank, the license compacts, clinical math and the hand-checked sets (normals, laws, health tech, odd codes) into tile questions, each with its source and check date. | Claude | tests/huddle-questions.test.js passes and every zone can fill its tiles every day | DONE 2026-10-14 |
| 92 | **The engine:** the board dealt by date (six zones around the compass, the seventh in the compass), crossing, misses, the clock, the dots score, save and resume, all plain data through one dispatcher. | Claude | tests/huddle.test.js passes: the same date deals the same board, every board can be crossed, a save restores | DONE 2026-10-14 |
| 93 | **The page:** the start screen, the board, the question card, the answer with its source, the finish card and the share line, on one phone screen; the board reads the exact press point. | Claude | npm run phone clean at nine viewports and a scripted play-through at phone and desk | DONE 2026-10-14 |
| 94 | **Make a board, practice and past boards:** a link carries the board, the clock and the misses; practice is any board, untimed if you like; past days replay as practice. | Claude | A made link opens the same board in a fresh browser | DONE 2026-10-14 |
| 95 | **Menus from the kit:** the how-to, the game menu, Settings with More time, and a question list for checking the bank. | Claude | tests/game-shell.test.js passes with the new game in it | DONE 2026-10-14 |
| 96 | **The QA list and pictures** on the hub. | Claude | The card's QA list shows on /__hub/qa with phone and desk pictures | DONE 2026-10-14 |
| 97 | **His QA:** he plays today's board on his phone and a desk and marks the hub's QA list. | David | Every check marked Good or Needs a tweak with a note | NEXT |

### Up next · A Routine Fracture

The broken arm Rounds piece, a review draft in the secret menu since 2026-10-03.

| # | Step | Owner | Done when | Status |
|---|---|---|---|---|
| 12 | **Outside the repo:** his manager's read, his follow-up visit (the "What comes next" cards), the explanations of benefits (a dated cost update). | David | He says each has happened | NEXT |
| 13 | **DECISIONS R1 and the rest of R6:** whether places and people are named, and three details only he knows. | David | Answered | NEXT |
| 14 | **The fifth panel's notes,** then the publish-to-Rounds checklist at the top of the page. | Claude, when he says | The piece is in Rounds on his yes | WAITING on steps 12 and 13 |

### Up next · A year of daily walls

David, 2026-10-11: "yes to the daily walls, start oct 25" (DY2). On his DY1 answers of 2026-10-10: a weekly climb (easy Monday, hard Saturday, Sunday a story day), joke days on Saturdays only, a one-wall teach the first time a new mode shows up, one or two new modes a month.
A year of daily walls for Device Assembly that change what the puzzle asks you to do, not only where the oxygen comes from.

| # | Step | Owner | Done when | Status |
|---|---|---|---|---|
| 37 | **The plan:** the first month of dailies laid out day by day on the weekly climb, the modes it needs built first, and the teaching wall for each new rule, with pictures of a Monday and a Saturday. | Claude | His yes to the plan | DONE 2026-10-11 |
| 38 | **His yes** to the first month. | David | His yes in the chat | DONE 2026-10-11 |
| 54 | **The calendar and the climb, and the month sheet** (plan pieces 1 and 2): the year turns on at wall #23, the weekday picks the kind, the dealer re-deals until the wall sits in its band, today's dealer is the fallback; tests pin walls #1 to #22 and hold every day of the month. | Claude | Walls #1 to #22 unchanged by test; every day #23 to #51 deals, solves, sits in its band and differs from the others; verify green | DONE 2026-10-11 |
| 55 | **Mondays and Tuesdays** (pieces 3 and 4): the bed in the middle, the far bed, the split rail, dead outlets; just enough, supply dumped everything, the labels fell off, expired. | Claude | Each one deals on its day in the month sheet; pictures filed | DONE 2026-10-11 |
| 56 | **Wednesdays and Thursdays** (pieces 5 and 6): shorthand, read the chart, written beats verbal; the sink, the sterile field, the curtain. | Claude | Each one deals on its day in the month sheet; pictures filed | DONE 2026-10-11 |
| 57 | **Mode 1, find the fault** (piece 7): the daily breaks a solved wall with the shift's faults, two faults, the hand-off, and its teach wall. | Claude | Oct 30, Nov 6, Nov 13 and Nov 20 deal and their faults are findable; the teach wall plays first the first time | DONE 2026-10-11 |
| 58 | **Saturdays** (piece 8): twists that stack, a bottle that feeds a real build, the Halloween dressing. | Claude | Every Saturday of the month is 5 parts or more, or stacked; pictures filed | DONE 2026-10-11 |
| 59 | **Sundays** (piece 9): three walls from the shift's stories (and Going home) as one daily with one result card. | Claude | Every Sunday deals three walls and counts once toward the streak | DONE 2026-10-11 |
| 60 | **Mode 2, the goal, not the device** (piece 10), and its teach wall, for World COPD Day. | Claude | Nov 18 accepts any setup that meets the target and explains a working miss; the teach wall plays first | DONE 2026-10-11 |
| 61 | **The daily card and the teach shelf** (piece 11), the month on the hub's Puzzles screen, the phone gate on the game. | Claude | The card names the day; npm run da:qa pictures the month; npm run phone clean on /fun/device-assembly/ | DONE 2026-10-11 |
| 62 | **His QA** of the month on the hub's Puzzles screen, by Oct 20 to ride the refresh push (Oct 22 at the latest). | David | His QA list is clear | WAITING on his QA of the month on the hub's Puzzles screen (group The daily year) and the card's pictures, by Oct 20 |

### Up next · Heavier lines on the logo and the rose

His yes on the Ideas card line-weights, 2026-10-11 ("yeah lets make the change", then "Lets move forward with these changes"). Its QA rides the site-wide refresh review.
The logo mark reads as one object at the sizes the site draws it small, and the home rose answers a tap where it is drawn.

| # | Step | Owner | Done when | Status |
|---|---|---|---|---|
| 39 | **The logo mark:** the hex outline from 18 to 26 of 512 units in hu-mark, hu-mark-dark, hu-mark-outline and favicon.svg, their PNGs, the favicons and app icons regenerated, and the icon cache stamps bumped. | Claude | The new outline shows in the bars, the tool pages and the browser tab; verify green | DONE 2026-10-11 |
| 40 | **The home rose on a phone:** the tap area lines up with the rose the canvas draws (today it sits 14 px higher). | Claude | Measured at 360, 390, 740x360 and 1280: the centers match; the phone gate clean on / | DONE 2026-10-11 |
| 41 | **A rose drawn big:** its lines grow with it (1.6 times in the dial), written into the design direction for the brass look, and the dial mockup defaults to the heavier lines. | Claude | Written down; the mockup shows it | DONE 2026-10-11 |
| 42 | **His QA** on the hub: the logo in the bars and the tab, the home rose on his phone. | David | His QA list is clear | WAITING on his QA list on the hub |

### Up next · The other games by thumb


### Inbox · parked, not dropped

Nothing here is worked until David promotes it.

- **Alarm Fatigue's real-or-nuisance alarms** Built 2026-09-24, never played by him; then its launch post, docs/HU-LAUNCH-POST-ALARM-FATIGUE.md. (added 2026-10-04)
- **The friend test** Open since old Sprint 1: a friend on their own phone and network joins a table by code. (added 2026-10-04)
- **Two tool bars left from 2026-10-03** System Layers' three rows of controls on a phone, and the Career Tree's missing tool name on a phone. (added 2026-10-04)
- **Alarm Fatigue: the floor's helpers cover CHECK** Found by play-check in the full QA, 2026-10-05: on a fully bought floor the walking techs, the float RN, the family and the surveyor sit on the monitors' CHECK buttons and take the tap, at 360 to 699. Pictures: tmp/play-*.png. (added 2026-10-05)
- **One standard for saved pictures** David on the Device Assembly card, 2026-10-05: "consider visual standardization or print standardization across any tools that print out Jpegs". The 1080 frame with a footer nothing draws over; Device Assembly's card is the first. (added 2026-10-05)
- **Make sure a busy launch month cannot pause the site** From the Ideas tab: The site's Netlify account is on monthly credits: 1,000 a month, 15 per deploy. When they run out, every site on the account is paused and forms are refused. The duplicate project you ruled to delete on September 23 stil (added 2026-10-11)
- **Decide what of the back office stays public** From the Ideas tab: The site's GitHub repo is public. Anyone can read CLAUDE.md, DECISIONS.md, SPRINT.md, the board and the voice profile today, and DECISIONS.md carries the medical details from the fracture questions (R6). A launch puts mo (added 2026-10-11)
- **A trademark look before spending on the brand** From the Ideas tab: The USPTO has no HEALTHCARE UNCHARTED mark, which is good. But UNCHARTED alone is crowded, and Sony holds it for video game software, which sits close to games named "Uncharted General" and "Uncharted Regional". David: y (added 2026-10-11)
- **An employer-safe launch checklist** From the Ideas tab: One page you clear before the LinkedIn post: read your employer's social media, outside activity and conflict-of-interest policies, keep the "not affiliated" line, no internal screenshots or logos, and run the post throu (added 2026-10-11)
- **Decide on AI answer engines** From the Ideas tab: robots.txt blocks ChatGPT's and Perplexity's search bots, not just their training bots, so the site cannot be cited in ChatGPT search at all. (added 2026-10-11)
- **Free GitHub protections, and a hook tripwire** From the Ideas tab: Turn on the free protections for a public repo (secret scanning, push protection, Dependabot, code scanning), pin the two workflow actions to exact versions, and add a test that fails if a hook appears in the settings fi (added 2026-10-11)
- **Security header quick wins** From the Ideas tab: Self-host GoatCounter's script, add integrity checks to the six pinned library files from CDNs, add a cross-origin opener policy, and publish a security.txt. Cheap trust signals that informatics readers check. (added 2026-10-11)
- **Learn visuals: diagrams and motion** His review 2026-10-11: AI in Healthcare, Alarm Fatigue, Change Healthcare, Healthcare Gap and Leading the AI Transition could use diagrams or animation; Healthcare Data Sources needs a full visual redesign (its defects were fixed); EHR Arch (added 2026-10-11)
- **Older tools on a phone** His review 2026-10-11: the Career Tree and the System Layers map are cluttered on a phone; the Hospital Map needs fewer, clearer places to tap instead of everything being clickable. One phone method for system maps. (added 2026-10-11)
- **One standard for what you can click on a map** His review 2026-10-11: on the Population Health Map and the Operations Map it should be obvious what can be clicked, picked or filtered (a toggle or radio look people know); easier dragging and getting around on phone and desk. (added 2026-10-11)
- **New card art for the tools** His review 2026-10-11: the Career Tree card could show a branching tree, maps should show maps (Operations Map, Vendor Directory too), and the same art should appear wherever a tool is linked. (added 2026-10-11)
- **The Atlas, a content and visual phase** His review 2026-10-11: fine as it is, but more detail is possible (islands, deeper zones) and the look could follow the newer visual practice. (added 2026-10-11)
- **Clinical SQL Mystery as a game** His review 2026-10-11: levels like Device Assembly, bigger public datasets, pulling data to solve things; look at existing SQL training sites and repos, aligned to healthcare. (added 2026-10-11)
- **Vendor Directory and Operations Map content growth** His review 2026-10-11: vendor terminology and item classes, maybe the device SKUs from Device Assembly; the Operations Map data set grows as content. (added 2026-10-11)
- **The secret menu games, a menus and visuals phase** His review 2026-10-11: Uncharted Regional's dashboards need to be actionable without overwhelming (look at other games); Uncharted General needs the new visual practice and more game feel; ER Charge could take the newer menu rules. (added 2026-10-11)
- **Patient Populations as a Learn module** His review 2026-10-11: close to a Learn module; more sourcing first, then visuals. Stays on the secret menu until then. (added 2026-10-11)
- **The Hospital Price Finder, later** His review 2026-10-11: a good project to come back to as the site grows; its data files caused big size problems. (added 2026-10-11)
- **The Reference Appendix as a sortable list** His review 2026-10-11: as the site grows, the sources page may need a database-like way to sort and search. (added 2026-10-11)
- **The About page for more than one author** His review 2026-10-11: plan the page shape for guest and staff authors now (no content change yet), and make the phone version simpler. (added 2026-10-11)
- **The dev blog's voice and notes** His note 2026-10-12: the blog looks ok but the little one-liners read as AI; work on the dev notes and the blog's voice with him later. (added 2026-10-12)
<!-- board:end -->

---

## CHANGES

- 2026-10-14 · **Daily Huddle moves into focus as secondary, at Build, on David's "Yes this all looks awesome, Lets build its core functions out get me a functional demo and QA list/Review test list on the hub"** (DH1 to DH3 answered with the recommendations). Steps 91 to 97; his QA is step 97. A year of daily walls stays in Up next with its QA step 62 (by Oct 20) unchanged; it gives up the secondary label because focus and Up next hold one secondary.

- 2026-10-13 · **The other games by thumb promoted to Up next on David's word** ("promote the other games by thumb card"). Alarm Fatigue, Vital Stats and Uncharted General against the phone play standard; the measurements are docs/HU-PHONE-PLAY-THREE-GAMES-2026-10-13.md. It gets its plan and steps when it moves into focus; Phone play stays primary at QA. Nothing dropped.

- 2026-10-13 · **Phone play built, at QA** (steps 83 to 89 done in window 2026-10-12-b): the thumb test passes on all four phones. His phone play is step 90, six checks on the hub's QA list. The other three games' fixes are a new Inbox card, The other games by thumb. Nothing dropped.

- 2026-10-12 · **Phone play moves into focus as primary, at Plan, on David's note after playing Device Assembly on his phone** ("I couldn't plug things in or connect things very easily with my fingers the menu at the bottom felt like it was taking up the screen all the time"). Plan: docs/HU-PHONE-PLAY-PLAN-2026-10-12.md, steps 83 to 90, his yes to both came the same window ("yes to both, go ahead and build it"), so it moved to Build. A year of daily walls stays in Up next on his QA (step 62, by Oct 20). Nothing dropped.

- 2026-10-11 · **Learn modules and tools, page by page moves into focus, at Build, on David's "ok start the learn modules and tools review"**. The review screen walks a run of the 17 Learn pages and the 8 tools (data-build/review-run.json); the standard Learn card is drawn for his pick (LC1). A year of daily walls steps back to Up next while it waits on his QA (step 62, by Oct 20). Nothing dropped.

- 2026-10-11 · **The site-wide refresh moves to Tweaks on David's review of the main pages**; his notes archived (data-build/archive/page-reviews-2026-10-11.json). The light theme comes first ("a little bit less blurred out or sharp"), then the small tweaks from his notes. The page over page review card becomes Learn modules and tools, page by page, for after it. Nothing dropped.

- 2026-10-11 · **A year of daily walls moved into focus as secondary, at Build, on David's yes to DY2** ("yes to the daily walls,
  start oct 25"). Build steps 54 to 61, his QA step 62. A Routine Fracture steps back from secondary to Up next; it waits on
  him (step 12, his manager's read, and R1) either way. Nothing dropped.

- 2026-10-11 · **The site-wide refresh moved into focus as primary, on David's answer to BR1 to BR3** ("do a whole site wide
  refresh and then i will do a page by page review and QA in the tool"). The page over page review moves from the Inbox to Up
  next as its QA. Heavier lines on the logo and the rose steps back to Up next; its QA rides the same review. Nothing dropped.

- 2026-10-10 · **A year of daily walls moved from the Inbox to Up next, on David's yes to DY1** ("yeah all that of that sounds
  good"). Its Plan step waits on tonight's push; nothing else moved.

- 2026-10-08 · **The two maps' menus moved into focus from the Inbox, on David's yes to M1** ("yes do A now and B."). The hub card
  steps back to Up next: it is done and waits only for the same push as beta session one. Nothing dropped.

- 2026-10-07 · **Old pages cleaned up, built straight to done on David's ask in the moment** ("make sure we delete
  old pages or archive them so they don't get found"). Nothing else moved.

- 2026-10-06 · **Pages with views moved up from the Inbox, on David's yes to L1.** After reading the fracture post in
  production he asked for a way to keep a page's views in reach; "yes to all three, go ahead with the pictures" opened
  a phase on the switch and started its mockups. Beta session one's menu steps now point at the front door (B7); B4 is
  superseded by it. Nothing dropped.

- 2026-10-05, night · **Device Assembly's playtest milestone closed; beta session one is in focus.** David played the
  Puzzles sheet and marked it ("everything else feels very good and clean"), then said yes to the beta plan: "yes to
  all three, go ahead and build the beta plan". The playtest card is done (it ships with the hub in one push); its
  launch-post step moved to the beta card. Nothing dropped.

- 2026-10-04, late · **The Device Assembly playtest paused for a cleanup, on David's first pass.** "I don't think we
  can properly QA or review the entire build until we get that cleaned up." The links that sent every setup to the
  last random wall were fixed the same window; the rest is the cleanup list, steps 16 and 17, before the playtest
  (step 9) runs again. Nothing dropped.

- 2026-10-04, evening · **Re-aimed by David to the hub, then Device Assembly, then the broken arm piece.** "Right
  now the first item is to build out this dashboard... the first big item is still going to be the device assembly
  game... with a secondary focus being on the rounds of the broken arm... That's all we really want to focus on
  until either one of those is done." Moved, not dropped: the page over page review, Alarm Fatigue's alarm play
  and post, the friend test and the two tool bars went to the Inbox; his Device Assembly phone play and its launch
  post became steps 7 and 10; the full sweep folded into step 4; the commit and push became HUB2. Same evening,
  his ruling that QA happens at milestones, not after each step.

- 2026-10-04 · **Cut to what is open, on David's ask** ("go ahead and trim DECISIONS and SPRINT"). Nothing
  dropped: every word of the old file is docs/HU-SPRINT-LOG.md, and every open step is above. Old Sprints 1 to 3
  each ended on steps that were David's; those are steps 3 to 7 now, and the rest of those sprints was done.
  DECISIONS.md was cut the same way, its answers and LOG to docs/HU-DECISIONS-LOG.md.

- 2026-10-04 · **A development routine and the back office, inserted by David in conversation.** "Start to
  consider a startup and closing process for any of our development windows", pictured as a second tab on the
  Data Observatory. Built the same day: `npm run open` (also printed into every new session by a SessionStart
  hook), `npm run close`, close notes in docs/sessions/, and the Data Observatory as four tabs: Data map,
  Process, Site and Traffic (the Goat Tracker moved in, its old address 301s). Nothing displaced. DECISIONS
  O1 and O2 answered 2026-10-04 (go with the recommendations): seven pages locked, the lock rule in CLAUDE.md.

- 2026-10-02 · **A new Rounds piece, inserted by David in conversation.** His own broken-arm week,
  mapped onto the System Layers tool's eight layers. Read as lifting the content hold for this one
  piece only; nothing else displaced. The working notes and the map preview live in private/, which
  git ignores, because this repo is public and they hold his medical details (DECISIONS R1, R2).

- 2026-10-03 · **The broken-arm piece is held for review.** David's manager reads a private copy first, and it
  waits until after his next follow-up visit (DECISIONS R2 answered, R5 open). Same day, his call: it
  moved to the secret menu as a review draft (/secret-menu/a-routine-fracture/, noindex), and src/ is
  now the working copy. Not listed in Rounds until he says it ships. Renamed "A Routine Fracture" the same
  day; the raw material moved to an archive outside the repo, to delete after it publishes.

Older changes: docs/HU-SPRINT-LOG.md.
