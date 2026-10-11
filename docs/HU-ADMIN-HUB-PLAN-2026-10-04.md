# The hub and the milestone process · plan
### 2026-10-04 · PLAN · BUILT the same evening on David's "yes to both, go ahead and build the hub" (all three stages) · awaiting his milestone QA

What changed in the building is in section 9. The record is docs/HU-DECISIONS-LOG.md, LOG, "THE HUB".

David, 2026-10-04, in three pieces:

- "we want to get all of our kind of processes built up so that they can be automatically done and followed when
  we start new development... from start to review to finish to end all automated or at least sequenced properly
  and visually located in the admin hub"
- "a visualization of our Sprint boards or what we are going to focus on next so that we can use those
  visualizations to talk about what tasks are going to be followed and not just follow mindlessly"
- "I really don't want to do QA on anything until we have made major milestones at which point we'll do QA and
  tweaks which we should build into that process"

And the order he set: the hub first. Then the sprint, with Device Assembly as the primary focus and the broken arm
Rounds piece as the secondary. Nothing else until one of those is done; anything new goes on the board and waits to
be promoted.

---

## 0 · The plan on one screen

1. **The process gets a second, larger loop.** Today it ends at the window: open, work, close. A MILESTONE is
   added around it: Plan, Build, QA, Tweaks, Ship. David's hands are on three of the five: he says yes to the plan,
   he does the QA, he pushes. Build and Tweaks run without asking him anything.
2. **The hub becomes a working screen, on David's computer only** (and his phone at home). Its home is the board.
   The live site keeps the Data map and Traffic. Recommended; it is question HUB1.
3. **The board is the sprint.** Focus (one primary, one secondary), Up next, Waiting on David, Inbox, Done. The
   board and SPRINT.md are one list kept in one place, so they cannot disagree.
4. **The process draws itself.** Each step of a window and a milestone lights up on the hub as it happens, with its
   time, its result and its pictures. Nobody has to trust that a step ran.
5. **Then the sprint.** Device Assembly starts with the QA its last milestone never got; A Routine Fracture waits
   mostly on things outside the repo.

---

## 1 · Where we stand

Built on 2026-10-04 and working: the open card (prints by itself at the start of a session), the close routine
(finds the pages a window touched and checks those), close notes, the Data Observatory as four tabs, the first seven
locks, and DECISIONS.md and SPRINT.md cut to what is open.

What that leaves short of what David described:

| Piece | Today | The gap |
|---|---|---|
| Process tab | Describes the steps and the tools | A poster. It cannot say which step this window is on, or what a step found |
| Open and close | Run as commands; results print and scroll away | Nothing on a screen shows they ran, or links to what they produced |
| The process itself | Ends at the window | No milestone: no place for a plan to be agreed, for David's QA, for tweaks, for a release |
| David's QA | Asked for after every step (CLAUDE.md: "every task ends with something he can see") | The opposite of what he asked for today. Nothing collects his notes or turns them into fixes |
| The sprint | A table in a text file | No picture, no lanes, no limit on what is in play, nowhere for a new idea to wait |
| Site tab | 55 pages, 7 locked | A snapshot from the last build; it goes stale between builds |
| Screens | The site, the review screen, the writing screen | Three addresses, nothing joining them |
| Pictures | Taken by hand, sent to the chat | No standing record per step or per milestone |
| Public or private | Process and Site ship to the live site on the next push | Undecided (HUB1) |

---

## 2 · The process

### The milestone, five stages

| Stage | What happens | Who | David's part |
|---|---|---|---|
| 1 · Plan | The focus item gets a goal in one sentence, a "done looks like" line, and its steps, on the board | David and Claude, talking over the board | Says yes, or changes it |
| 2 · Build | One or more windows. Each opens and closes by the routine. Every step files a phone picture and a desktop picture | Claude | Nothing. He can look at the hub any time; nobody asks him to |
| 3 · QA | The machine goes first: the full gate over the whole site. Then the QA pack: everything that changed, one line each, with a link and a before and after | The machine, then David on his phone and at his desk | Marks each item good, or writes what to change |
| 4 · Tweaks | His notes become cards. Claude fixes them. Only the changed items come back | Claude, then David | Rechecks only what changed, until the list is empty |
| 5 · Ship | Final gate, release note, commit message, the push, a check that the live site is on that push. The board files the milestone under Done and asks what gets promoted | Claude prepares, David pushes | Pushes; picks what is next |

### The window, three stages (inside Build and Tweaks)

- **Open**, automatic, about a minute: the last close note, the state of the repo, the screens brought up, a
  baseline check so we know the window starts green, and the board on screen. Then one sentence each way: Claude
  says which step is next and why, David says go or points somewhere else. This is the guard against following the
  list mindlessly.
- **Work.** Machine checks as the work goes. Pictures filed to the hub at each step.
- **Close**, automatic: the checks on what changed, nothing stranded, the close note, a commit message for a save
  point.

"Automatic" means Claude runs it without being asked, the hub shows that it ran and what it found, and nothing in
it needs David.

### Rules this changes

| Rule today | Becomes | Status |
|---|---|---|
| "Every task ends with something he can see" (CLAUDE.md), "Small change, then look" (DECISIONS rule 6), "two screenshots in the chat" (SPRINT.md) | Every step files its pictures to the hub. David is asked to look at milestone QA | His ruling of 2026-10-04, recorded in CLAUDE.md the same day; the filing itself is built in stage 2 below |
| A commit and a push together, when a batch feels done | A commit at each close as a save point; the push at Ship, after his QA | Proposed (HUB2) |
| The sprint is a text table | The sprint is the board | Proposed, this plan |

One thing stays as it is: a look-or-feel DECISION that blocks the build still comes to him with a picture of each
option (DECISIONS rule 5). That is a decision, not QA.

---

## 3 · The hub

### On this computer only (recommended, HUB1)

Three reasons. A page on the live site can only show what was true at the last push, and the hub has to show what
is true now: which step is running, what the last check found, which servers are up. It has to take David's QA
marks and notes, and a static page cannot save anything. And nothing about how the site gets built, what is
waiting on whom, or a draft's review status then needs a ruling on whether it is fit to publish.

The live site keeps what is already public and useful away from home: the Data map and Traffic. The Process and
Site tabs built on 2026-10-04 move into the hub; nothing is thrown away.

How David reaches it:

- In a session, Claude brings it up at open.
- Outside a session, a shortcut on his desktop, "HU hub", that starts it and opens it. One double-click.
- On his phone, the same address over home wifi, the way he reaches the test server today.
- Away from home, Claude sends a picture of the board to the chat.

The pattern already exists: the review screen and the writing screen are both screens that live only on his
computer and are never part of the site.

### The screens

| Screen | What it shows |
|---|---|
| **Board** (home) | The sprint: Focus, Up next, Waiting on David, Inbox, Done since the last push. Each focus item shows where it is on Plan, Build, QA, Tweaks, Ship |
| **Run sheet** | The milestone and the current window as a checklist that fills itself in: each step, when it ran, what it found, its pictures |
| **QA pack** | At the QA stage: everything that changed, each with a link, a before and after, and two buttons, Good and Needs a tweak, with a note |
| **Site** | Every page as a block: standard met, locked, reviewed (built 2026-10-04) |
| **Review, Writing** | The two screens that exist today, reached from the same front door |
| **Library** | Every tool as a block, for training (the lower half of today's Process tab) |
| **Data map, Traffic** | As they are; also on the live site |

### The board's rules

- **Focus holds two at most:** one primary, one secondary. David's words: "That's all we really want to focus on
  until either one of those is done."
- **Anything new lands in the Inbox** with its date and one line. It is promoted only by David, in a Plan
  conversation or when a focus slot comes free. Nothing is worked from the Inbox.
- **Every card says** what done looks like, who has the next move, and what it is waiting on.
- **Waiting on David** is its own lane across everything, so his list is one glance.
- **One list.** The board and SPRINT.md are the same list kept in one place. A session still reads a plain file at
  the start; David reads the board.

---

## 4 · Build order

One milestone, "The hub", in three build stages. David's QA comes once, at the end, per his ruling. A sketch of the
board went to the chat with this plan so the direction is checked before anything is built.

| Stage | What gets built | Done when |
|---|---|---|
| 1 · The front door and the board | One address. Home is the board, drawn from the sprint. Process and Site move in and come off the live site. The desktop shortcut | The board shows today's sprint on his phone and his desk; the live build has no Process or Site page |
| 2 · The run sheet | Open and close write each step's result where the hub reads it. Every build step files a phone and a desktop picture | Opening and closing a window lights the sheet with no hand-typing; the pictures are on the card |
| 3 · The QA pack and Ship | The full machine gate, then the list of what changed with before and after; Good and Needs a tweak with a note; notes become cards; Ship does the release note, the commit message and the live check | The hub's own milestone QA is done on its own QA pack |

Size: about three build windows before his QA. That is an estimate. If it runs past four, stop and ship what works.

The first real test is the next milestone: Device Assembly runs every stage through the hub.

---

## 5 · The sprint after the hub

### Primary · Device Assembly

David: "we still have some optimization that we need to do, some visualization improvements, and we need to kind of
build out more streamlined effects for the games, maybe simpler or easier to follow processes."

In the new model, the expansion (Stage A to C) is a milestone that was built and shipped and never got its QA: live
since b5dcc82, never played by David on a phone. So the track starts there.

1. **The QA it never got.** David plays it once on his phone: today's wall, a shift, a race, a home, a ventilator
   wall. No notes format; he says what he saw.
2. **A scoping review, Claude's, at the same time.** Every mode at phone and desktop width, measured: the words and
   the taps before a first play, where a new player loses the thread, which effects could be plainer, how heavy the
   page is (the game is one 527 KB page).
3. **The Plan stage.** Both feed one ranked list on the board, with pictures. David picks what is in. That list is
   the milestone.

Known going in: the reading-load phase is still open (364 words on the wall at desktop when it opened); the feel
phase is parked at alpha after fifteen rounds; two clinical flags only he can call (the capnography connector,
Level 2's title; DECISIONS 16); the launch post is drafted and waits on his phone play.

### Secondary · A Routine Fracture (the broken arm piece)

A review draft in the secret menu since 2026-10-03. Most of what it waits on is outside the repo:

- His manager's read.
- His follow-up visit, for the "What comes next" cards.
- The explanations of benefits, for a dated cost update.
- DECISIONS R1 (whether places and people are named) and the rest of R6 (three details only he knows).

Claude's part, when he says: the fifth reviewer panel's notes, then the publish-to-Rounds checklist at the top of
the page.

### Inbox, parked by this re-aim and not dropped

The page over page review; Alarm Fatigue's real-or-nuisance alarms (built, never played by him); the friend test;
the two tool bars left from 2026-10-03.

---

## 6 · Questions for David

Both are in DECISIONS.md.

- **HUB1 · Should the hub live only on your computer?** Recommended: yes. The live site keeps the Data map and
  Traffic.
- **HUB2 · Save the work now, push at the milestone?** Recommended: commit today's work as a save point and hold
  the push until the hub passes your QA. Pushing now would put Process and Site on the live site, and HUB1 would
  take them off again.

---

## 7 · Build notes, Claude's calls

How it gets built is not David's question. These are the calls, written down so the session that builds it does
not re-derive them. Each can be vetoed by looking at the result.

1. **Where it runs.** One local server, grown from scripts/review.js, which already serves the built site, the
   `/__review` screen, and takes David's marks by POST into data-build/page-reviews.json. The hub is `/__hub`
   (the board), with `/__hub/run`, `/__hub/qa`, `/__hub/site` and `/__hub/library` beside it. Nothing under `/__`
   exists in `_site`, so it cannot ship. The writing screen keeps its own server at first and is linked from the
   front door.
2. **Process and Site leave `src/`.** The hub renders them at request time from the same sources (src/_data/devKit.js,
   the functions in scripts/build-devlog.js), so they are never a build behind. The live Data map and Traffic pages
   keep a two-tab bar. The hub's styles move out of src/assets so no unused file ships. tests/admin-hub.test.js
   flips: the built site must NOT contain the two pages.
3. **One list.** The source is a structured file, data-build/board.json: lanes, cards (id, title, lane, role, stage,
   goal, done-looks-like, owner, waiting-on, steps, date added). SPRINT.md's NOW section is printed from it between
   two markers, and a test fails when they disagree. Reading tables back out of prose is what slipped twice on
   2026-10-04; the file is the source for that reason.
4. **Run state.** tmp/hub/run.json, git-ignored because it describes this computer: the milestone and its stage,
   and the current window's steps with time, pass or fail, one line and a link. scripts/session-open.js and
   session-close.js already compute everything they print; they write it here too. One helper marks a step from
   inside a window. One clock helper, local time, used everywhere (the UTC slip of 2026-10-04).
5. **Pictures.** One script: milestone, step, addresses in; phone (390) and desktop (1440) out, under
   tmp/hub/shots/. The "before" is the same address shot at the Plan stage. Scrolls are instant and the script
   waits for the page to settle (the smooth-scroll trap).
6. **The QA pack.** Built from git: the pages touched since the last pushed commit (scripts/lib/session.js already
   maps a file to its page), plus the card's done-looks-like lines. Marks save to data-build/qa/, one file per
   milestone, committed, because they are his record. A "Needs a tweak" note becomes a card under the milestone.
7. **Ship.** `npm run ship`: the full gate, a release note drawn from the close notes since the last push, the
   commit message as a file. After his push, the live check compares the commit the live site reports with the one
   pushed. That needs the build to stamp its commit somewhere public (Netlify provides it at build time); one small
   text file does it.
8. **The shortcut.** A small launcher in the repo that starts the hub and opens it. Putting a shortcut to it on
   his desktop touches outside the repo, so that is asked at build time.
9. **His phone.** The server listens on the home network. The hub's front door shows its own address as a QR code
   (src/assets/js/hu-qr.js exists). Windows Firewall is the known blocker if the phone cannot load it.
10. **Gates for the hub itself.** It is a tool for one computer, so it stays out of the page ledger. It still has
    to work at 360 wide and in both themes, because his phone is where he does QA. One test file: the routes
    answer, the board file and SPRINT.md agree, nothing of the hub lands in `_site`.

---

## 8 · Risks

- **A hub on one computer is up only when something starts it.** The session does, and the shortcut does. If he
  wants the board from anywhere, a read-only copy can go on the live site later; that is a small addition, not a
  rebuild.
- **Building process and not product.** The cap in section 4 is the guard.
- **No look per step means a wrong turn is found later.** The Plan stage, the sketch before the build, and
  decisions that still come with pictures are the guard. If a milestone's QA finds something a look would have
  caught on day one, the stage it should have been caught in gets a checkpoint.

---

## 9 · As built, 2026-10-04

Built as planned, with five differences worth knowing.

- **The "before" picture is the live site.** Section 7 said to photograph a page at the Plan stage. The last push
  is, by definition, what a page looked like before the milestone, so `npm run shots -- --before` photographs the
  same address on healthcareuncharted.com. Nobody has to remember to take one.
- **Tweaks are not copied onto the board.** Section 3 called a tweak note "a card". It is one item on the QA list
  in one file, and the board's focus card shows the count. One copy, so the two cannot disagree.
- **The hub runs no commands.** It listens on the home network so his phone can reach it; a button that started a
  script would be a way to run things on this computer from that network. The checks and the build are run by a
  session. What the hub writes: a QA mark, an Inbox idea, a promotion.
- **The files moved.** The block list is scripts/hub/kit.js and the history reader is scripts/hub/devlog.js (they
  were src/_data/devKit.js and scripts/build-devlog.js for one day). The test file is tests/hub.test.js.
- **The desktop shortcut was made on his yes, the same evening** ("yes make the desktop shortcut"): "HU hub" on
  his desktop, pointing at hu-hub.cmd at the repo root, which starts the hub and opens it. A small minimized window
  named HU hub stays open while it runs; closing that window stops the hub. If the hub is already running, the
  second copy says so and stops, and the browser opens either way.
