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

### Focus · primary · Device Assembly: beta session one · stage: QA

Build the beta plan: the mechanics every wall leans on, the ventilators rethought, the paths of walls with decoys and stored answers, and the level menu, so Device Assembly is ready for beta session one.
Done looks like: Every step below built and checked, his pick on the level menu built, and his QA list for the beta marked.
Plan: docs/HU-DEVICE-ASSEMBLY-BETA-1-PLAN-2026-10-05.md

| # | Step | Owner | Done when | Status |
|---|---|---|---|---|
| 18 | **The mechanics:** a part dropped on a run seats in line and the run closes when it comes out; power cords lie over things; two runs can cross. | Claude | In the tests and pictured at a phone and a desk | DONE 2026-10-05 |
| 19 | **The ventilators:** oxygen and air, the vent cart with its humidifier, three port layouts, the circuit as one piece (Ventilator 1 keeps the loose pieces), the extension, HME or heater. | Claude | Every vent wall passes the puzzle sheet | DONE 2026-10-05 |
| 20 | **The paths:** oxygen on the floor, humidity and aerosol, high flow, find the fault and ventilators, four to six walls each, with variations, decoys that fail for a named reason, and a stored answer for every wall. | Claude | Every wall on the Puzzles sheet with its breaks tried | DONE 2026-10-05 |
| 21 | **The front door, three mockups** at phone and desktop width, for his pick: today first, the map as home, or straight onto the wall with a bar of parts. He picked A (DECISIONS B7). | Claude, then David | His pick | DONE 2026-10-06 |
| 22 | **The front door and the addresses, built** on his pick: the door; the game on the Fun shelf at /fun/device-assembly/ with the old address forwarding; a plain address for every part (/today/, /training/, /paths/ and each path, /shift/, /race/, /make/); the daily's share line linking that day's own address. | Claude | Pictured at a phone and a desk | DONE 2026-10-06 |
| 23 | **QA for beta session one:** play the list and mark it. | David | Every item marked | NEXT |
| 32 | **His Puzzles-sheet notes, worked** (ventilators first): four vent cart builds, eight ways a cart stands, a setup wall for each on the sheet; Ventilator 8 on the other side of the bed; cords round parts; Swap on a tap; the sandbox headwall loose; the screen never turning by itself; the shift without the bonus pick; rooms for the simple walls; Find the fault 2 on an extension cord and Find the fault 6; one finish card. Every note written back on his sheet. | Claude | npm run verify and npm run da:qa green; every note back for another look | DONE 2026-10-07 |
| 33 | **Ventilators only, on the Puzzles sheet** (/__hub/puzzles?group=ventilators): the eight configuration walls, Ventilator 8, and his three notes back for another look. | David | Every ventilator wall marked | DONE 2026-10-08 |
| 24 | **The launch post,** docs/HU-LAUNCH-POST-DEVICE-ASSEMBLY.md, at beta session one. | David | Posted, or his edits back | WAITING on the beta QA |

### Focus · The two maps' menus · stage: QA

Plan: docs/HU-MAP-MENUS-REVIEW-2026-10-08.md

| # | Step | Owner | Done when | Status |
|---|---|---|---|---|
| 34 | **A. Defect fixes** from the review: a card at the peek shows its name and value; back and Esc close the search panel and the info card; the desk drawer strip; 44px tabs and label rows; 13px labels on a phone; each number once; the coach on the metric; the catalog search full height; one word per act; prose in the sans face. | Claude | Pictured at a phone and a desk; npm run verify and npm run phone clean on both maps | DONE 2026-10-08 |
| 35 | **B. The game menu rules** on both maps: explanations behind an i; one Color, Size, Pin switch over the catalog instead of buttons on every row (Add, Only on the hospital map); one ? per map instead of the coach; three search examples; List and Share on both. | Claude | Pictured; words at first paint measured against the review | DONE 2026-10-08 |
| 36 | **QA: the two maps' menus,** at a phone and a desk. | David | Every item marked | NEXT |

### Up next · The hub

David, 2026-10-04: "the first item is to build out this dashboard make everything work and visualize our process the best we can in this admin space"; then "yes to both, go ahead and build the hub" (DECISIONS HUB1, HUB2)
The back office as a working screen on David's computer: the sprint board, the process drawn live, and his QA list.

| # | Step | Owner | Done when | Status |
|---|---|---|---|---|
| 1 | **Go on the plan,** and answers to HUB1 (the hub on his computer only) and HUB2 (save now, push at the milestone). | David | His go in the chat | DONE 2026-10-04 |
| 2 | **The front door and the board.** One address, home is the board drawn from one file, Process and Site move in and come off the live site. | Claude | The board shows this sprint on his phone and his desk | DONE 2026-10-04 |
| 3 | **The run sheet.** Open and close write each step's result where the hub reads it; every build step files a phone and a desktop picture. | Claude | A window opened and closed lights the sheet by itself | DONE 2026-10-04 |
| 4 | **The QA list and Ship.** The full machine gate, what changed with a before and after, Good or Needs a tweak with a note, the release steps. | Claude | The list is ready for step 5 | DONE 2026-10-04 |
| 5 | **Milestone QA of the hub,** on its own QA list, phone and desk. Then tweaks until his list is empty. | David, then Claude | His list is empty | DONE 2026-10-04 |
| 6 | **Ship.** In GitHub Desktop, "Commit to main" whenever you like; that is a save point. "Push origin" waits for both QA lists to be clear (the folder button marks the rest of a folder Good): the push now carries the game's cleanup too, so it is one push for both. The message is in tmp/commit-message.txt. Then Claude checks the live site is on it. | David, then Claude | Live on that commit | WAITING on David, when both QA lists are clear |

### Up next · secondary · A Routine Fracture

The broken arm Rounds piece, a review draft in the secret menu since 2026-10-03.

| # | Step | Owner | Done when | Status |
|---|---|---|---|---|
| 12 | **Outside the repo:** his manager's read, his follow-up visit (the "What comes next" cards), the explanations of benefits (a dated cost update). | David | He says each has happened | NEXT |
| 13 | **DECISIONS R1 and the rest of R6:** whether places and people are named, and three details only he knows. | David | Answered | NEXT |
| 14 | **The fifth panel's notes,** then the publish-to-Rounds checklist at the top of the page. | Claude, when he says | The piece is in Rounds on his yes | WAITING on steps 12 and 13 |

### Up next · Pages with views people can find


| # | Step | Owner | Done when | Status |
|---|---|---|---|---|
| 25 | **The switch, two mockups** on the fracture post: docked at the foot of a phone (?switch=dock) or pinned at the top (?switch=top), the same on a desk. | Claude | Pictured at phone and desktop; the phone check run on both | DONE 2026-10-06 |
| 26 | **His pick** between the two: the dock (DECISIONS L2). | David | His pick | DONE 2026-10-06 |
| 27 | **The switch, built** on the fracture post on his pick; the other mockup taken out. | Claude | Pictured at a phone and a desk | DONE 2026-10-06 |
| 28 | **The Learn pages,** in one pass: Laws and Paradoxes, Process Engineering, Request Routing and the home page's tool groups. | Claude | Pictured at a phone and a desk | DONE 2026-10-06 |
| 29 | **The standard written down:** the hu-view-switch skill and tests/view-switch.test.js (built 2026-10-06); DESIGN.md Tier 3 when he closes the phase. | Claude | The test in verify | WAITING on David, closing the phase after his QA |
| 30 | **QA:** the switch on each page, at a phone and a desk. | David | Every item marked | NEXT |

### Up next · A year of daily walls

David, 2026-10-10, on DY1's three recommendations: "yeah all that of that sounds good". A weekly climb (easy Monday, hard Saturday, Sunday a story day), joke days on Saturdays only, and a one-wall teach the first time a rule shows up, one or two new modes a month.
A year of daily walls for Device Assembly that change what the puzzle asks you to do, not only where the oxygen comes from.

| # | Step | Owner | Done when | Status |
|---|---|---|---|---|
| 37 | **The plan:** the first month of dailies laid out day by day on the weekly climb, the modes it needs built first, and the teaching wall for each new rule, with pictures of a Monday and a Saturday. | Claude | His yes to the plan | WAITING on Device Assembly: beta session one |
| 38 | **His yes** to the first month. | David | His yes in the chat | NEXT |

### Waiting on David, small

| # | Step | Status |
|---|---|---|
| 15 | **OK to remove the empty side worktree** (angry-engelbart). It holds nothing; the open card checks that every time. | WAITING on David's OK |

More of his are in DECISIONS.md: the open questions, and "Yours to do".

### Inbox · parked, not dropped

Nothing here is worked until David promotes it.

- **The page over page review** Open since 2026-09-21: every page at phone upright, phone sideways and desktop, with his Reviewed mark. 0 of 55. Each milestone's QA covers the pages that milestone touches. (added 2026-10-04)
- **Alarm Fatigue's real-or-nuisance alarms** Built 2026-09-24, never played by him; then its launch post, docs/HU-LAUNCH-POST-ALARM-FATIGUE.md. (added 2026-10-04)
- **The friend test** Open since old Sprint 1: a friend on their own phone and network joins a table by code. (added 2026-10-04)
- **Two tool bars left from 2026-10-03** System Layers' three rows of controls on a phone, and the Career Tree's missing tool name on a phone. (added 2026-10-04)
- **Alarm Fatigue: the floor's helpers cover CHECK** Found by play-check in the full QA, 2026-10-05: on a fully bought floor the walking techs, the float RN, the family and the surveyor sit on the monitors' CHECK buttons and take the tap, at 360 to 699. Pictures: tmp/play-*.png. (added 2026-10-05)
- **One standard for saved pictures** David on the Device Assembly card, 2026-10-05: "consider visual standardization or print standardization across any tools that print out Jpegs". The 1080 frame with a footer nothing draws over; Device Assembly's card is the first. (added 2026-10-05)

### Done since the last push

- **Device Assembly**, 2026-10-05
- **Old pages cleaned up**, 2026-10-07
<!-- board:end -->

---

## CHANGES

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
