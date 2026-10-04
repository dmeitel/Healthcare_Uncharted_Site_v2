# The consistency toolkit: one ledger, one board, one map

### 2026-10-03 · PLAN, for David's yes · nothing built yet

David, 2026-10-03: "we need to build a consistency tool that we can use for voice and view and
everything else. I think there's quite a few tools or rules or skills that we've put in place but
I don't know that we've created them all or built them into a single system or toolkit that we can
review page by page. I'd also like us to start to categorize pages as ones that are maybe in phase
one of the website versus phase two," so the older pages get brought up over time.

The same aim, earlier in his words: "tools and pages and references that I use and others can use,
and they can jump right to it on phone, laptop, tablet or computer and have it look good and feel
easy to understand" (2026-09-22), and "I can go page by page and compare the views and contents and
make adjustments" (2026-09-22).

---

## 1 · What already exists, and what is missing

The checks are good, and since 2026-09-22 they even run from one command: `npm run qa`, in three
tiers by who decides (TIER 1 the machine decides, TIER 2 a number that may only go down, TIER 3
David decides). What is missing is not another check. It is three things:

1. **No page has a record.** Each instrument prints its own report and forgets it. Nothing says
   "this page passed the phone sweep on 09-24, has two voice findings, was last looked at by David
   on 09-21". So a page-by-page review has nowhere to start and nowhere to write down what was found.
2. **No page has a generation.** A page built on 2026-07-10 and one built last night are held to
   the same rules today, but nothing says which ones were BUILT to those rules and which ones were
   built before they existed. That is the phase David is asking for.
3. **No map of the toolkit.** Fourteen QA scripts, a dozen site-wide gate tests, three skills and five agents
   are described across CLAUDE.md, SPRINT.md, DESIGN.md, three rules files and a dozen docs. A
   session finds the ones it happens to read.

## 2 · The plan

### 2.1 The page ledger (the record)

One file, one row per page: its address, its KIND (reading page, tool, game, hub), its PHASE, the
result of every check for its kind with the date it was measured, and David's review (date and a
note). `npm run ledger` refreshes the fast checks in seconds; the slow ones (the nine-viewport phone
sweep) write their result into the ledger whenever they run, with the date, so nothing is re-run
just to look at it.

### 2.2 Phases (the generation)

- **Phase 1, first build.** Made before today's standard for its kind, and not yet brought up to it.
- **Phase 2, current standard.** Passes every check for its kind.
- **Reviewed.** A separate mark, never automatic: David looked at it on his phone and his laptop
  after it reached Phase 2, with the date and his note.

The phase is COMPUTED from the checks, never typed by hand, so it cannot go stale. When a new rule
lands, a page that fails it drops back to Phase 1 and shows which rule did it. That is the point:
the list of Phase 1 pages is the upgrade backlog, always current, and a Tier 2 ratchet in `npm run
qa` lets it shrink and never grow.

### 2.3 The standard per kind (no new rules; each one is already written somewhere)

| Every page | Source of the rule |
|---|---|
| Phone sweep clean at all nine viewports, whole page read down | CLAUDE.md ALWAYS TRUE; scripts/phone-check.js |
| Writing: no must-fix, no fix | the writing checker (2026-10-03) |
| Title, description, one brand suffix, h1, alt text | tests/site-build.test.js |
| One top bar on a phone, inside 20% | .claude/rules/css.md |

| Reading pages (Learn, Rounds, hubs) | |
|---|---|
| On the shared reading shell: no page-level shell declarations | tests/reading-shell.test.js |
| Type from the scale, nothing under the floor | DESIGN.md "The Two Surfaces"; phone gate |
| Rounds only: the Rounds checklist (the checker shows it; David judges the judgment items) | CLAUDE.md, Rounds-specific |

| Tools | |
|---|---|
| A source line with a date | tests/tool-source-lines.test.js |
| The merged band on a phone | CLAUDE.md, the merged band |
| The ten Cost of Living rules, measured where a script can (first-screen words, explanations behind an "i", links that restore) | DECISIONS T1, still David's call |

| Games | |
|---|---|
| The menus contract, ten rules | .claude/rules/games.md, tests/hu-kit.menu.test.js |
| The engine contract: one JSON state, one dispatcher, the seeded generator, a save | .claude/rules/games.md |

A first rough count from two of these (writing and the reading shell) on 2026-10-03: Learn 9 of 21
pass both, Rounds 1 of 7, other site pages 2 of 7. Tools and games pass these two (17 of 18) but
have their own standards still to be measured.

### 2.4 The board (the one screen)

The side-by-side review screen (`npm run review`, /__review) gains a BOARD: every page in one
table, grouped by phase and kind, each row naming what keeps it in Phase 1. Pick a page and it
opens the way review does now, phone and desktop side by side, with a third panel: that page's
checks and dates, its writing findings painted on its text (the writing screen's rules, same file),
its phone sweep result per viewport, and a note box that saves David's review into the ledger.
That is the page-by-page review he described, in one place, with somewhere to write down what he
found.

### 2.5 The toolkit map (the one document)

docs/HU-QA-TOOLKIT.md: every instrument, what it checks, its tier, when it runs and where its
result shows on the board. CLAUDE.md points to it once instead of naming tools in six places.

### 2.6 Games: the game shell

David, 2026-10-03: "a consistent menuing system... for anything from the vital stats games to the
nurse clicking games, and it's really just like the starting off menus or the top bar... right now
our best designed portal for a game is the vital stats and it's kind of easy to set up and run. And
if it's a single player game we don't need something that complex but if it's going to have
multiplayer elements it needs to be as clean and as easy to set up as that one."

MEASURED 2026-10-03, every game as a first-time visitor sees it (tmp/game-shell/, sheets at 360
and 1280):

| Game | Top bar | Name on a phone | First thing a new visitor gets |
|---|---|---|---|
| Vital Stats | game bar, 58px | 17px | a start screen that explains itself: name, Play with bots, Create a room, a code box |
| Alarm Fatigue | game bar, 50px | 14px | a how-to card over the game board |
| Device Assembly | game bar, 58px | 16px | a how-to card, then straight onto Tutorial 1 |
| Uncharted General | the whole site menu, 64px | none | a how-to card, then a start card over a dimmed page |
| Uncharted Regional | the whole site menu, 64px | none | a how-to card, then a start card; 690 words on the first screen |
| ER Charge | the whole site menu, 64px | none | a how-to card, then a start card |

Three top bars, three name sizes, four ways to begin. The menus contract (.claude/rules/games.md,
2026-09-23) made the MENU the same everywhere; nothing yet makes the BAR and the START the same.

THE STANDARD, built from Vital Stats:
- **One game bar** on every game: the HU mark, the game's name at one size (17px phone, 15px
  desktop, the tool bar's), then on the right one status slot (a clock, a room code), at most one
  game action (Silence, Walls), the "?" and Menu, in that order. The site menu lives inside Menu
  (the merged band), never as a second bar.
- **Solo start** (one player), A DEFAULT, NOT A RULE (David, 2026-10-03: "I don't think that's
  always going to be necessary so it shouldn't be a hard or fast rule"): a new game reaches first
  for a start screen that explains itself in one sentence and three short steps (Vital Stats'
  Guess, Reveal, Score row) with ONE primary button. Menus rule 4 (the how-to on a first visit)
  stands, and a game may open straight onto play.
- **Party start** (any game with multiplayer): Vital Stats' portal exactly. A name, Play with bots
  as the primary, Create a room, a code box to join; the room card with its code, link, QR and big
  screen; a lobby whose every setting has a default, so Deal works on the first tap.
- **Built from the kit, never by hand.** The shell becomes one kit piece (with the menu pieces in
  hu-kit.js), Vital Stats moves onto it first as the reference, then each game in turn.
- **Held by a test** that loads every game and checks the bar's order and sizes and the start
  rules, and by a skill, hu-game-shell, that tells a session how to start any new game from it.
  The ledger's game standard includes it.

FIRM, by David's words: the bar and the menu are the same in every game, and a multiplayer game is
as clean and easy to set up as Vital Stats. A DEFAULT: the solo start. (DECISIONS N2, 2026-10-03.)

## 3 · Order and size

1. The map (an hour; it is an inventory).
2. The ledger and `npm run ledger` over the fast checks, phases computed (a session).
3. The board in the review screen (a session).
4. The Tier 2 ratchet on Phase 1 pages, and the phone sweep writing into the ledger.
5. The game shell: the kit piece from Vital Stats, the test and the skill, then each game's bar and
   start moved onto it, one game at a time, Device Assembly second so its expansion is built on it.

Each step ends with something David can see: the map as a page, then the board with every page's
phase on it, then each game's first screen before and after at phone and desktop width.

Claude's call, stated so David can veto: the phase is computed from the checks, with his
"Reviewed" mark kept separate, and a page drops back to Phase 1 when a new rule lands, because a
hand-set label goes stale.

## 4 · Questions for David

Asked with the Device Assembly plan (docs/HU-DEVICE-ASSEMBLY-EXPANSION-2026-10-03.md), three at
a time.
