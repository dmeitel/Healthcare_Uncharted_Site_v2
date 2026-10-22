# The hub redesign · plan
### 2026-10-20 · PLAN · YES the same night (DECISIONS HB1, all three: "Build it after version 4 ships") · card: The hub redesign (`hub-home`), at Build, waiting on the version 4 ship

David, 2026-10-20: "I think we are ready to refresh the hub design and build. The board and run sheet no longer seem to
show relevant information, and the QA and Puzzles screens overlap in usage too."

David, 2026-10-18, on the card this folds into: "the board run sheet QA puzzles and ideas are all kind of static and it's
hard to see when things are updated or changed ... what I need is a dashboard that shows me actual items and information
that I can make decisions on post review and to get us to our final checkdowns for our next pushes".

This is that card's Plan stage, not a second home. Its step 105 ("make it the hub's front page, and what to trim from the
other tabs") is answered by this plan's yes.

Pictures, every screen now and proposed, at phone (390 wide) and desk (1440): the sheet at
`/__hub/mocks/hub-redesign/index.html` on the hub. The files are in tmp/hub/shots/hub-home/02-the-hub-as-it-stands/ and
03-the-redesign-proposal/. The proposal pictures are mockups drawn from the hub's own files tonight, so every number in
them is real; nothing in them saves.

The hub is in an OPEN design phase (CLAUDE.md, "The hub and the Data Observatory"), so new layout is allowed here. Tier 1
and 2 still bind: 44 px targets, the type floor, contrast, both themes, the phone as the shorter side.

---

## 0 · The plan on one screen

1. **Four places instead of eight tabs and four links.** Today, Look, Board and Site across the top, and a More menu for
   Log, Library, Review, Data map, Traffic and The site. On a phone the row fits with nothing scrolling sideways.
2. **Today is the front door.** It is the home prototype, finished: the card in focus with its stage and what is left
   before the push, Your move with each thing on it once, what changed since you last looked, and the site's week. It
   takes over the Board's focus card, the Board's Waiting on you lane, and the run sheet's stage cards.
3. **Look is QA and Puzzles as one list.** Three folders: For the next push (holds up Ship), Headwall walls (never does),
   and Pages, night and day (a count, and the way into the review screen). One item card, one pair of buttons, one fold.
4. **The Board becomes the plan of work.** Up next, Inbox and Done, with Ideas as its second view.
5. **The run sheet becomes the Log, under More.** The history by day. A window shows only on the day it was opened.
6. **The files, the board's verbs, the review screen and the rule that the hub runs no commands do not change.**

---

## 1 · The walk: each screen tonight

Measured at 10:48 PM on Oct 20 with the hub's own server, phone 390 x 844 and desk 1440 x 900, dark theme. "Screens" is
the page's height over the window's; "words" counts what is drawn in the main column.

| Screen | What it is for | What it shows tonight | What you do there | Phone · desk |
|---|---|---|---|---|
| **Home** (`/__hub/home`, the prototype) | One place that says what is left before the push | The next push, 3 steps left: the QA list clear, nothing with Claude, the full check due, 22 files not saved, the push. Six next looks (three decisions, two ideas, 39 pages changed since your night and day marks). Six decisions and three to-dos. The traffic card. Twelve changes | Nothing yet. It is not the front door, and it saves nothing | 4.1 · 1.7 screens, 522 words |
| **Board** (`/__hub`, the front door) | The sprint | Daily Huddle version 4 at Ship, step 117 Doing, three steps folded. Up next: A Routine Fracture, The other games by thumb (an empty box: no goal, no steps), The hub home. Waiting on you: four steps, two of which (12 and 13) restate R1 and R6, listed again under them. Three to-dos. Inbox 25, five face up. The add-an-idea form. What is running and the phone code | Read the focus card. The promotions on record came by your word in the chat, not the button | 5.3 · 2.3 screens, 1,838 words |
| **Run sheet** (`/__hub/run`) | The process filling itself in | Five stage cards for the card in focus, with QA marked "here" while the Board says Ship. "This window: 2026-10-18-c, closed 23:21", two days and two windows old: the windows of Oct 19 and Oct 20 never ran the full open, so nothing wrote the sheet. Six close notes in full. Eight of 127 commits, labelled pushes | Nothing. It is read only, and what it shows is old | 18.5 · 8.3 screens, 5,267 words |
| **QA** (`/__hub/qa`) | A milestone's list | "Nothing to look at right now" and one folded finished list (version 4, 21 of 21 Good) | Mark in bursts: version 4's 21 Goods within one minute at 22:31; on Oct 18 at 14:09 three lists cleared in the same minute. Five Needs a tweak notes and one remark across the ten card lists on file | 1 · 1 screen, 51 words |
| **Puzzles** (`/__hub/puzzles`) | Headwall's every wall, pictured and checked | 79 walls, all Good. Five summary cards (one a 90-word paragraph about thumbs), nine chips all reading "done", every group folded | This is where you write: 20 Needs a tweak notes and 32 remarks on Goods, Oct 5 to Oct 18, against six on all ten card lists | 3.1 · 1 screen of summary over a sheet with nothing left |
| **Ideas** (`/__hub/ideas`) | Answering the research ideas | 154 ideas, 113 to answer, 19 section chips | Answered 43 in one sitting on Oct 11 (10:26 to 12:46), none since. "Answer the Ideas tab" sits in Yours to do | 73.6 · 51.4 screens |
| **Site** (`/__hub/site`) | Every live page as a block | 65 pages in 8 areas, the standard, locks and your night and day marks | Read. The marks are made on the review screen | 6.3 · 3 screens |
| **Library** (`/__hub/library`) | How the work runs, and every tool | The five stages, the window, 47 blocks | Reference | 14.4 · 4.7 screens |
| **Review** (`/__review`, its own screen) | Night and day marks, page by page | Two frames, the notes bar, the run's counter | 130 marks on 65 pages, Oct 12 to Oct 20 | its own chrome |

On a phone the tab row holds twelve chips. At 390 wide five show (Home, Board, Run sheet, QA, Puzzles) and the other
seven sit off the right edge.

---

## 2 · What is wrong

1. **The front door is mostly background.** The Board opens on the one focus card, then 25 Inbox ideas, the add form, and
   the phone code. What you can act on tonight is two lines of it.
2. **The same thing is said three times, and the three disagree.** The card in focus is at Ship on the Board, at QA
   ("here") on the run sheet, and "3 steps left" on Home. Decisions show on Home twice (Your next looks, and their own
   card) and on the Board once. Steps 12 and 13 are R1 and R6 in other words.
3. **Two screens show old facts as current.** The run sheet's window block is whichever window last ran the full open,
   two days ago tonight. The QA list's "The machine went first" line shows the last full check even when the site changed
   after it; Home already checks for that, QA does not.
4. **QA and Puzzles are one screen drawn twice.** Same item card, same Good and Needs a tweak, same fold, same chips, same
   Mark all row. They differ in where the items come from and in whether they hold up a push. The review screen marks
   pages as well, and the QA list's "pages that changed" are those same pages.
5. **A mark is filed under a card.** Tonight a QA page loaded before its card existed sent the old card's id, and your
   marks failed until you reloaded. The puzzle marks left the cards for the same reason on Oct 18.

---

## 3 · The proposal

| Place | What it answers | What it takes from today |
|---|---|---|
| **Today** | What is left before the push, and what is my move? | Home; the Board's focus card and Waiting on you; the run sheet's stage cards |
| **Look** | What is waiting for my eyes? | QA, Puzzles, and the count of pages for the night and day review |
| **Board** | What comes after this? | The Board's Up next, Inbox and Done; Ideas as its second view |
| **Site** | How is every page doing? | Unchanged |
| **More** | Everything else | Log (the run sheet's history), Library, Review, Data map, Traffic, The site |

### Today

- **In focus.** The card's title, its five stages, and the steps left before the push with whose move each one is. The
  steps already done fold into one line. At 11:30 PM that reads Ship: the QA list clear, nothing with Claude and the full
  check passed (11:29 PM) on one line, then the two steps left, the save and the push. On a phone the five stages become
  "at Ship" beside the label, so Your move starts on the first screen.
- **Your move.** One list, each thing once: anything on Look that holds up the push, then the top three decisions with
  Claude's recommendation in a sentence, then your board steps that are not a decision in other words, then Yours to do.
  Tonight that is seven rows: HB1 (this plan), R1, R6, step 12 (outside the repo), and the three to-dos. Step 105 is
  HB1 in other words and step 13 is R1 and R6, so neither gets a row of its own; step 117, the push, sits in the
  In focus card above.
- **What is not on it, in one line.** Headwall's walls (all 79 Good), 113 ideas to answer when you want, and 39 pages
  changed since your night and day marks, each one tap away.
- **Since you last looked.** The newest seven events, with the whole Log one tap away.
- **The site this week.** As the prototype has it, read live from GoatCounter, with the Site tab's count under it.
- **This computer**, folded at the foot: what is running, and the code for your phone.

### Look

- **Three folders as tiles at the top, each with its count.** For the next push: the card's written checks and the pages
  changed since the last push; it holds up Ship. Headwall walls: from the puzzle sheet; it never holds up a push. Pages,
  night and day: the count, and a button into the review screen at the first page that needs a look. The review keeps
  its own screen with its two frames. On a phone the three sit in one row, a short name and a number, so the list
  starts on the first screen.
- **One list under the folder you pick.** The same item card, Good or Needs a tweak with a note, Mark all Good, and Good
  folding away.
- **The machine's line tells the truth.** When the site changed after the last full check, it says so.
- **The puzzle sheet's five cards become one line** (79 of 79 clean, every break says where, the thumb test on five
  phones), with the detail one tap away.
- **A wall comes back by itself** when the sheet finds it new or changed after your Good, the way a page does today.
- **When nothing is open, one line says so,** and the folders still show their counts.
- `/__hub/qa` and `/__hub/puzzles` forward to Look.

### Board

- **A switch at the top: Board, Ideas.** Ideas is the same file and the same Yes, Maybe or No; it moves under the Board
  because answering an idea is deciding what might be built.
- **In focus becomes one line** pointing at Today.
- **Up next, the Inbox** (newest five, the rest folded, the add form) **and Done since the last push.**
- **A card with no plan says so.** Tonight "The other games by thumb" draws as an empty box.
- **The waiting lane, the decisions and the to-dos leave** for Today; what is running and the phone code go to Today's
  foot.

### Log, under More

- **The run sheet's history, by day, newest first:** each window's title with what it did folded under it and its
  pictures, each full check, each push.
- **"This window" shows only on the day the window was opened.** No more two-day-old windows drawn as current.
- **The five stage cards leave.** The stage lives on Today; what each stage means stays in the Library.

### On a phone

The row is Today, Look, Board, Site and More: five chips, nothing off the edge at 360. Look carries its count in brass
when something waits.

---

## 4 · What does not change

- The files: data-build/board.json, the QA marks in data-build/qa/, the puzzle sheet's own marks file, the ideas and
  their answers, data-build/page-reviews.json, tmp/hub/run.json. Nothing is migrated.
- The board's verbs, SPRINT.md printed from the board, `npm run shots`, `npm run da:qa`, `node scripts/hub/qa.js fixed`.
- The review screen, the Site tab and the Library, as they are.
- The hub runs no commands and writes the same five things: a QA mark, a review mark, an idea's answer, an Inbox idea, a
  promotion.

---

## 5 · Build, after your yes

| # | Step | Owner | Done when |
|---|---|---|---|
| 105 | **Your yes on this plan** (DECISIONS HB1) | David | He says yes, or what to change |
| 118 | **Today and the row.** Today at `/__hub` (the old `/__hub/home` forwards), the five-place row with More, the Board as the plan of work with Ideas as its second view | Claude | Today draws from the files at phone and desk with no errors; every old address forwards; pictures filed |
| 119 | **Look and the Log.** QA and Puzzles as one list in three folders; a mark belongs to the thing marked; the machine's line says when the site changed after the check; the run sheet as the Log | Claude | Every mark on file still shows where it was; a mark from a page loaded before its card existed saves; pictures filed |
| 120 | **Your QA** on the hub's own Look list, phone and desk | David | Every item Good |

Size: two build windows, then your QA. That is an estimate; if it runs past three, stop and ship what works.

The build waits until version 4 of the Daily Huddle bank has shipped, because that ship is writing to the board and the
QA files this week.

---

## 6 · Build notes, Claude's calls

None of these is your question. Each can be vetoed by looking at the result.

1. **A mark belongs to the thing marked.** A check, a page and a wall each have one id, and the server works out which
   list it sits on. A mark that arrives naming a card no longer on the board is filed under the list that holds the item
   today instead of failing. The marks files stay where they are.
2. **One freshness rule for the full check.** Home's rule (the check is stale when a site file changed after it ran)
   becomes the one Today, Look and Ship all read.
3. **A window is drawn only on its own day.** Separately: the full open (`npm run open -- --baseline`) has not run since
   Oct 18, which is why the sheet is old. The Log's rule keeps an old window off the screen whether or not it runs.
4. **Old addresses forward inside the hub:** `/__hub/home`, `/__hub/qa`, `/__hub/puzzles`, `/__hub/run`, `/__hub/ideas`.
5. **A wall goes stale like a page.** When the sheet's newest picture of a wall is newer than your Good, the wall comes
   back to Look.
6. **Tests.** tests/hub.test.js keeps every route answering; new tests: a mark saves with a stale card id; Today lists
   each decision once; the row has five places; QA and Puzzles addresses forward to Look.

---

## 7 · Question for David

One row in DECISIONS.md, HB1, in three parts, each with a recommendation: Today as the front door with four places; QA
and Puzzles as one Look list; the run sheet as a Log under More.

---

## 8 · Risks

- **Losing a mark in the merge.** 241 QA and wall marks are on file, plus 43 idea answers. Step 119 is not done until
  every one shows where it was.
- **Today growing into a second Board.** The guard is the rule on it: four cards, each thing once, the rest one tap away.
- **The other three windows of the week.** The version 4 ship, then the next card in focus, both write the board and the
  QA files. The build starts after the ship, and each step restarts the hub's server, which reads its code once.
