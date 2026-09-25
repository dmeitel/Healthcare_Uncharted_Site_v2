# Game expansion · growing each game from its core idea · 2026-09-23

David, 2026-09-23: "while we do that i think we also need to try to keep in the theme of the games
or their core ideas, but expand upon them. we want them to be fun an accessable."

STATUS. Proposals. An expansion changes a game's rules, which the change budget forbids without a
design phase (CLAUDE.md), so picking one for a game opens that game's phase for that expansion.
Each game gets its fixes from docs/HU-GAME-REVIEW-2026-09-23.md first. An expansion should land on
a game that already works, or the new part inherits the old problems.

SIZES. S is about one session of work, M a few sessions, L a week or more.

---

## 1 · The test every expansion has to pass

1. It grows out of the game's core idea, the one sentence under each game below. If nobody can
   say which part of that sentence it deepens, it is a bolt-on.
2. It adds a new decision. More walls, more events and more patients are content. Content is
   fine, but it is not an expansion.
3. A shipped game already proves the kind of fun. Each option names one.
4. A stranger learns it in one screen: the short label on screen, the paragraph in a peek,
   taught by doing it once.
5. It works on a phone and with the assist switches on (section 2).

---

## 2 · Accessible, for every game

Accessible means two things here, and the games need both.

EASY TO PICK UP. The menu contract (docs/HU-GAME-MENUS-2026-09-23.md), teaching through play
instead of paragraphs, and a Continue button so a run survives a reload. The review found none of
the five has all three.

PLAYABLE BY MORE PEOPLE. The Game Accessibility Guidelines' basic tier is the floor. On top of it,
three assist switches, built once in the kit (under way 2026-09-23) and shown in every game that
can use them:
- MORE TIME. Timers run slower. The reference is Celeste's Assist Mode, which lets any player slow
  the game down, and the game is still loved for its difficulty. For us: Alarm Fatigue's 30 second
  code timer, Device Assembly's SpO2 clock and timed walls, and ER Charge's whole clock. The two
  turn-based hospital games need none.
- SHOW SOUNDS AS TEXT. Alarm Fatigue is built on sound. A player who cannot hear it cannot hear
  the alarms that ARE the game. Every alarm and cue also appears as a word on screen.
- HINTS. On by default for a first run, off for players who want the puzzle clean.

And what the review found missing, which is fixing, not expanding: reduced motion honored
everywhere, color never the only signal (Uncharted General prints bad effects in green), a
keyboard path through every game, and a tap for every drag.

---

## 3 · Game by game

### 3.1 Alarm Fatigue

CORE IDEA: The work never stops, the alarms train you to stop hearing them, and one of them was
real.

What already carries it: the button is the shift, alarms get quieter each time you silence them,
and Room 7's quiet heart rate that the techs never catch.

| Expansion | The new decision | Fun, proven by | Why it stays true | Size |
|---|---|---|---|---|
| REAL OR NUISANCE. Most alarms become false (a lead off, a patient moving, a probe off the finger, a kinked line) and a few are real. The clue is on screen: the waveform, the nurse brain, the room. | Not just clearing an alarm but reading it: silence, check, or escalate | Papers, Please (inspect, decide, against a clock) | This IS alarm fatigue. It also answers the review's design-truth question: today every desat is real, which is the opposite of the floor. | M |
| THE NEXT SHIFT. Clocking out carries something forward (seniority, a preceptor, a unit you know), and the next shift is harder: nights, step-down, a float to peds. | What to carry forward | Idle-game prestige (Cookie Clicker's ascension) | Nurses get better and the assignments get heavier | M, after a save exists |
| TODAY'S SHIFT. One seeded shift a day, the same for everyone, with a card to share how it went. | None new; the pull is comparison | Wordle | A shift everyone worked, compared afterwards | S, once the engine has a seed (38 bare random calls today) |

RECOMMENDED: REAL OR NUISANCE. It is the thesis, and it changes the central mechanic of the
site's only public game, so it gets your read before anything is built.

### 3.2 Device Assembly

CORE IDEA: Build what the order calls for, the real way, and know why every part fits.

What already carries it: keyed probes, DISS against barb with the adapter named, failure messages
in RT words, the SpO2 clock, and fix-the-fault.

| Expansion | The new decision | Fun, proven by | Why it stays true | Size |
|---|---|---|---|---|
| THE ORDER CHANGES. One patient across a shift. The order changes (wean high flow to a cannula, escalate a cannula to a non-rebreather, add a neb) and you rework the setup already on the wall instead of building fresh. | What to keep, what to swap, the fastest safe change | Opus Magnum and the other Zachtronics puzzles that make you rework a working machine | It is how the job goes: nobody builds from an empty wall twice in a shift | M |
| COMPARE YOUR BUILD. After a wall, see where your parts, feet of tubing and time fall against everyone who played it. | Chasing the cleanest setup | Opus Magnum's solution histograms | There is a cleanest setup, and RTs argue about it | M, needs stored scores (the quarter plan's scores table) |
| NEW DEVICE FAMILIES in the NBRC outline's order: aerosol, suction, trach collar, CPAP and BiPAP interfaces, a vent circuit last. | Comes with each family | NandGame, one chapter at a time | The TMC outline already maps to the levels | M per family, and each needs your RT read |

RECOMMENDED: THE ORDER CHANGES, after the difficulty curve is fixed. The review found four
near-identical three-part walls and then an eight-part wall; the new walls fill that gap.

### 3.3 Uncharted General

CORE IDEA: Find the constraint that binds, pay to break it, and live with the bill that arrives
later.

What already carries it: the three ceilings with the binding label on every card, burnout billed
a quarter late, and "how it was winnable".

| Expansion | The new decision | Fun, proven by | Why it stays true | Size |
|---|---|---|---|---|
| THE PAYER TABLE. Contract offers arrive as events: a commercial insurer offers a rate for a volume or quality promise. Accept, counter, or walk. With a realistic spread (RAND: 254 percent of Medicare in 2022), payer mix becomes the biggest lever in the game. | A bet on your own future performance | The offer cards already designed for The Table's game master (design doc section 9, not built) | The biggest fight in hospital finance, and the game currently makes it look trivial | M. The same cards become the game master's hand at The Table. |
| EVERY LEVER EARNS ITS PLACE. In 257 winning quarters the solver never hired a physician or expanded. Give each lever a job only it can do: physicians lift a service line's ceiling, and an expansion is the only answer to a demand ceiling. | Which lever, instead of more RNs | Slay the Spire, where every card type has a job no other type does | Hospitals do not solve everything with floor staff | M, mostly tuning |
| MORE REAL SCENARIOS, like the rural OB desert: a cyberattack year, a travel-nurse market, a merger offer. | Comes with each scenario | The roguelite challenge run | Each is a headline from the last five years | S each |

RECOMMENDED: THE PAYER TABLE.

### 3.4 ER Charge Nurse

CORE IDEA: You run the board, not the bedside: flow, bottlenecks, and the bed you do not have.

What already carries it: admits boarding in ED beds, walkouts, and the report that names the
bottleneck in patient-minutes.

| Expansion | The new decision | Fun, proven by | Why it stays true | Size |
|---|---|---|---|---|
| THE DOOR. Patients arrive untriaged, with a complaint and a glance of vitals. You set the acuity, and a wrong call comes back later (the under-called chest pain). | The decision the review found missing: today the lobby arrives pre-sorted | Papers, Please, and Overcooked's order tickets | The acuity call decides every later move on the board. One seam: in a real ED a triage nurse makes it, not the charge nurse, so the game folds two jobs into one. Your call. | M |
| THE RADIO. EMS calls ahead ("stroke alert, eight minutes out"). Hold a bed or gamble it. | A bet against the clock | Mini Metro, planning for what is coming | It also fixes the review's flag that strokes and traumas walk in through the lobby | S to M |
| SHIFTS WITH NAMES: Saturday night, flu surge, a mass-casualty drill. Seeded, with a best score kept. | Comes with each shift | Overcooked's level list | Every ED has these nights | S to M |

RECOMMENDED: THE DOOR and THE RADIO together. Between them they replace the dead first minute.
ER Charge is in no design phase and the review recommended parking it, so this waits for you to
open it.

### 3.5 Uncharted Regional

CORE IDEA: Three hospitals, one region: what is best for one building can be worst for the
system.

What already carries it: the exact projection before you commit, distance taxing access, and the
shared labor pool with its wage cliff.

| Expansion | The new decision | Fun, proven by | Why it stays true | Size |
|---|---|---|---|---|
| A BOARD WITH PATIENCE. A missed goal costs trust, not the term; the board acts when trust runs out. | When to take a miss on purpose to set up next year | Frostpunk's hope and discontent meters | Boards forgive a bad quarter, not a pattern | S. It is also the review's number one problem. |
| THE MAP. Zones on a map where patients visibly travel, and a closed line visibly lengthens the trip. Most of the 540 words on the board become the picture. | Where to put a service, seen instead of read | Mini Metro | Distance is the lesson, so the lesson should be visible | L |

RECOMMENDED: A BOARD WITH PATIENCE, then THE MAP.

---

## 4 · The thread through all five

The design doc calls the games a ladder: the ER, the hospital, the system. None of the games says
so. A line on each end card pointing up a rung ("You ran the board. Now run the building.") costs
almost nothing, and it is how a player who finishes one game finds the next. It is a link, not a
system. S.

---

## 5 · Order

For each game: the review's fixes, then the assist switches, then its recommended expansion. The
games go in the review's order: Alarm Fatigue, Uncharted General, Device Assembly, Uncharted
Regional. ER Charge only when you open it.

The question for you is DECISIONS 17: are these the right five picks? Choosing one opens that
game's design phase for it.
