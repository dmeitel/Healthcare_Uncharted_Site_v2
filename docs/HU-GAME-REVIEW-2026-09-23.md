# Game review · 2026-09-23

David, 2026-09-23: "ok can you do a scan and review of all games give me an evaluation"

WHAT WAS REVIEWED. The five games: Alarm Fatigue (public, /fun/), and in the secret menu
Uncharted General, Device Assembly, ER Charge Nurse and Uncharted Regional. Camp Nauvoo is a
vision page, not a game. The SQL mystery is a tool.

HOW. Each game was played as a stranger would play it, at a 360 phone, a 740x360 phone held
sideways and a 1280 desktop, then pushed to its late game through its test hook. Each was read
against the menu contract in docs/HU-GAME-MENUS-2026-09-23.md and the engine contract in
.claude/rules/games.md. The phone gate ran all five at its nine viewports. Seeded bots played
hundreds of runs of the three strategy games to see what a naive player and a good player get.
Screenshots and every throwaway script are in tmp/game-review/<game>/. Nothing in the games was
changed. Another session was editing Uncharted Regional during the review; it was scored as it
stood with those edits.

FIXED DURING THE REVIEW, NOT FALSE. CORRECTED 2026-09-23 LATER. Two ER Charge defects a reviewer
reported were real when it played: about half of normal-speed mouse clicks were lost to the 200 ms
board rebuild, and keyboard focus was destroyed by it. The other session fixed both at 20:43 (the
board now holds still under a press, `pressing`; focus survives the redraw; SPRINT item 14), and
the re-run that found 120 of 120 clicks landing ran after that fix. An earlier version of this
paragraph called them false. They were not; the re-run was measuring a different build. The lesson:
when a re-run disagrees with a reviewer, check whether the file changed in between before calling
the reviewer wrong.

FIXED SINCE THE REVIEW by the other session the same evening (SPRINT item 14), so struck from the
lists below where noted: in Alarm Fatigue, the notice's Clock in now clocks in, Restart asks before
wiping a big shift (it reads what the shift earned), the cards over the big button moved, the Code
Blue box scrolls on a sideways phone, and the test hook needs `__UG_TEST`; in ER Charge, the charge
cards refuse patients they cannot help, Rapid Response's text, and the end card's head counts lost
their plus signs; in Uncharted Regional, "Look at the region" has a way back, the double charge,
access goals judged as the screen rounds, bad stored settings, 44px phone targets and keyboard
dialogs.

Every other defect below was reproduced by a reviewer. The ones that matter most were also read
in the code for this document: the DNR room, the arrest drugs, the Restart guard, the sideways
wall, the first tutorial step, the fault titles and both games' payer rates.

---

## 1 · The verdict

| Game | Ready for strangers? | The best thing in it | The one thing most in the way |
|---|---|---|---|
| Alarm Fatigue | On desktop, yes. On a phone, not yet. | The button is the shift, and Room 7 teaches the real lesson | The phone start: a wrong notice, a fake Clock in, and clinical errors a nurse will screenshot |
| Uncharted General | No | "How it was winnable": a priced, concrete answer after every loss | On a phone one quarter means scrolling 3 to 7 screens, and Run lets you commit a quarter the game already projected as lost |
| Device Assembly | Desktop alpha, yes. Phone, no. | The equipment is real and the game explains why a part fits or fails | Sideways the wall cannot be seen, and the first tutorial step walks you into a failure |
| ER Charge Nurse | No | The ED physics: boarding, walkouts, providers as the bottleneck | The first minute: six patients, nine beds, placed in ten seconds, then fifty seconds of nothing |
| Uncharted Regional | No, closest of the secret-menu three | The projection panel shows the exact quarter before you commit | One missed objective ends the term with no warning, and the loss advice is wrong for spend goals |

The phone gate passed all five: no console errors, no overflow, no clipping, no text under the
floor at any of nine viewports. That is worth saying plainly, and it is also why this review
exists. Every problem above is one the gate cannot see.

### The scorecard

1 is broken, 3 works with visible problems, 5 is as good as the reference apps. Device Assembly's
progression row scores its puzzle curve.

| | Alarm Fatigue | Uncharted General | Device Assembly | ER Charge | Regional |
|---|---|---|---|---|---|
| First minute | 3 | 2 | 3 | 2 | 2 |
| Menus (the ten rules) | 2 | 2 | 2 | 2 | 2 |
| Reading load | 3 | 3 | 3 | 2 | 2 |
| Core loop and feel | 4 | 3 | 4 | 2 | 3 |
| Progression and replay | 3 | 3 | 2 | 1 | 2 |
| Healthcare truth | 3 | 3 | 4 | 3 | 3 |
| Phone, upright | 3 | 2 | 3 | 2 | 2 |
| Phone, sideways | 2 | 1 | 1 | 2 | 2 |
| Keyboard and access | 3 | 3 | 3 | 2 | 3 |
| Stability | 4 | 3 | 3 | 3 | 4 |
| Engine contract | 1 | 3 | 2 | 1 | 3 |

ER Charge's keyboard and stability scores are for the build after the other session's fixes; as
the reviewer played it, both were 1.

---

## 2 · What all five share

These are the findings worth more than any single game's list, because one fix reaches all five.

1. EVERY GAME SCORES 2 ON MENUS. None has a game menu, a "?" for help, or cards that all close
   on an X, Esc and the phone back gesture. This is the gap docs/HU-GAME-MENUS-2026-09-23.md was
   written for, now confirmed on all five instead of three.
2. SIDEWAYS IS THE WORST VIEW IN EVERY GAME. Device Assembly and Uncharted General score 1; the
   other three score 2. The phone gate runs 740x360 and passes it, because nothing overflows.
   What it cannot see is that the thing you need is not on the screen.
3. NO RUN SURVIVES A RELOAD. A refresh, an evicted tab or the back gesture drops the player to
   the start in all five. The two hospital games already have save strings, and hu-save.js exists;
   nothing calls them automatically. A Continue button is the single most common feature of every
   reference app on the shelf.
4. THE GAME KNOWS BEFORE THE PLAYER DOES. Uncharted General projects the quarter and lets you
   press Run on a projected bankruptcy. Regional's projection is exact and one miss ends the term.
   Alarm Fatigue's one lethal rule (an ignored desat becomes a code in about 20 seconds) is never
   said. A single line, "short by $307k" or "tap before it hits 80", would move more new players
   than any other change in this document.
5. COMMERCIAL PAYS ABOUT 1.2 TIMES MEDICARE IN BOTH HOSPITAL GAMES. Uncharted General sets 1.14
   against 0.97 (line 964); Regional 1.15 against 0.95 (line 250). RAND's round 5 study found
   private plans paid hospitals 254 percent of what Medicare would have paid in 2022
   ([RAND, checked 2026-09-23](https://www.rand.org/news/press/2024/05/13.html)). The biggest
   margin lever in hospital finance reads as trivial in both games. How far toward the real
   number a game should go is a design call; the current number is not defensible as it stands.
6. REDUCED MOTION IS HALF HONORED. Alarm Fatigue's techs still walk and its break card shakes;
   Uncharted General has no reduced-motion rule at all; ER Charge's critical pulse ignores it.
7. THE ENGINE CONTRACT SPLITS THE FIVE IN TWO. Uncharted General and Regional are close (a
   dispatcher, save strings, a test hook). Device Assembly is deterministic but has no dispatcher.
   Alarm Fatigue and ER Charge have none of it, and Alarm Fatigue, the one strangers actually play,
   has zero tests. That is why none of its defects below were caught.

---

## 3 · Game by game

### 3.1 Alarm Fatigue

What the traffic already says (recorded in docs/HU-DEV-PLAN-2026-Q4.md): one Reddit post, about
1,500 views in a week, and 48 percent of measured sessions lasted past two minutes. The desktop
game works and the review agrees.

The first minute on a phone. A modal says "Turn your phone sideways". Its button says "Clock in"
and only closes the modal; the shift starts on the second tap. At about 41 seconds, Room 4 codes
from a desat the player was never told mattered: dose math, a klaxon, the button dead for 31
seconds. A non-clinician is most likely to quit right there.

Problems, most costly first:
1. The phone start. The notice matches a phone held sideways too, `(max-height:500px)`, and its
   button does not clock in (line 5716 onward). Smallest fix: show it upright only, and relabel
   the button "Got it".
2. The one rule that kills you is never stated. Smallest fix: one peek on the first CLEAR ("tap
   before it hits 80"), and a first-visit "?" card with three rules.
3. Runs die easily. Restart asks only when the BALANCE is over 500 (`S.tasks`, line 5583), so a
   run that earned 250,000 and just spent it reloads with no question. Nothing resumes after a
   reload.
4. No clock on phones. The clock is hidden at phone size (line 1347), and the line under the
   button stops showing the time after the first purchase. The 0600 to 1800 arc disappears.
5. Clinical errors, all read in the code:
   - Room 5, Alvarez, is DNR/DNI in the nurse brain (line 1602), and the code logic never reads
     code status, so she can code.
   - The code text always says "He's down" (line 2742), including for a 71-year-old woman.
   - Adenosine and atropine sit in the code dose pool (lines 2649 to 2650). Neither belongs in a
     hypoxic arrest.

Protect: the button's shift-start labels, the pick-up cards under the button (progress with no
menu), Room 7 and its clues, alarms that get quieter every time you silence them, and the 1800
hand-off quiz.

Smaller defects: "Stay for overtime" turns the lunch item into "Another lunch break"; sideways,
the console covers the chart tabs and the code box's header sits under the toolbar; a med card
steals keyboard focus and the next Enter hits a random step ("WRONG PATIENT", 3 of 3 runs);
"NSVT" clips to "NS…" at 1280, which reads as normal sinus; "1 tasks clicked"; "+1" numbers draw
over the open Task List; the Hire a tech text says techs clear pumps and meds, which the engine
correctly forbids; the test hook is exposed to everyone instead of only under `__UG_TEST`.

### 3.2 Uncharted General

The first minute. One tap starts a run from a start screen of 538 words and 46 controls. The
board's only goal is "Break ground on your first new unit", and at 360 the build slot is about
four screens down. The obvious move, RUN THE QUARTER, scrolls the page to the map.

What 300 seeded runs said (Normal, default settings, 100 each):

| Player | An endless run ends at | A one-year run completed |
|---|---|---|
| Builds, then does nothing | median quarter 3 | 5% |
| Adds an RN to every understaffed unit | median quarter 4 | 16% (48% on Easy) |
| Follows the game's own "how it was winnable" line | median quarter 6 | 76% (88% on Easy) |

The teaching line works; players who read it do five times better. The solver's hires across 257
winning quarters were 531 RNs, 644 techs, and no physicians and no expansions, so the loop
narrows to staffing.

Problems, most costly first:
1. The phone splits the loop across 3 to 7 screens (Run at y 732, projected net at 1,227, the
   first unit card at 3,213). Smallest fix: a sticky bottom bar on phones with Run and the
   projected net.
2. Run commits a quarter the game already knows is lost. The goal card has no on-track line and
   "Cash after" never turns red (line 2347). Smallest fix: "Short by $307k" under the goal, and a
   confirm when projected cash is below zero.
3. Solo runs vanish on reload, tab eviction or back. The Table host saves; solo does not.
4. The start screen is a settings form. The CEO choice, the most flavorful decision, is last.
   The fill-in prompt for this is already written: docs/HU-GAME-MENUS-2026-09-23.md, section 3.4.
5. The bankruptcy post-mortem blames staffing for event losses (`diagnoseBankruptcy`, line
   1364): a billing cyberattack that cut revenue 35 percent was reported as "payroll and overhead
   outran" it.

Protect: "how it was winnable", every event keeping a free option with its effects printed, the
boss and season rhythm, the three-card draft at desktop, and the engineering (seeded dice, save
strings that double as the multiplayer message, 55 passing tests, a real dialog focus manager).

Smaller defects: the Chart Room ignores Esc and its only exit is below the fold; every choice
effect renders green, including "morale hit" and "−3 reputation" (line 87); keyboard focus after
building lands on the off-screen Run button; 8px CEO carousel dots.

### 3.3 Device Assembly

The first minute. At 1280 it opens straight onto Tutorial 1 and wins in five actions. Step one
says "put it down anywhere on the wall" (line 816); anywhere on the left half of the wall is too
far for the cannula's 7 ft lead, so the tutorial's own instruction produces "TOO SHORT". The T1
cart also holds spare tubing that does nothing when dragged. At 360, tap-to-hold works (five taps,
two scrolls). Sideways, the first screen is the rail and a flowmeter: no patient, no cart, no
Complete.

Problems, most costly first:
1. Sideways phones. `fitBoard` (line 1864) sizes the wall to the full width whenever the screen
   counts as a phone, whatever its height. Smallest fix: sideways, fit both sides.
2. Tutorial 1 sets up its own failure. Smallest fix: step one becomes "drag the cannula onto the
   patient's nose", and the spare tubing leaves the T1 cart.
3. Instructions that vanish or are wrong. Hints hold five seconds and alerts replace them; nine
   step texts say "Test the system" or "submit" but the only button is Complete; touch screens
   are told "Right-click or R turns it."
4. Cards trap the player. No card closes with Esc (the keydown handler returns early while one
   is open, line 2904), none has an X, the back gesture leaves the page, and Reset wipes the wall
   with no undo.
5. The fault walls publish their answers. "The tubing on the wrong tree" (line 955) is the
   title, shown in the walls list even while locked; pressing Complete on the broken wall names
   the fault for free, while Show me costs two stars.

The difficulty curve is the one design problem here, and it is level data, under the change
budget: Tutorial 5, Level 1, Timed and Level 2 are the same three-part build (first-try scores of
98 and 100), then High flow jumps to eight parts, a dial and a power cord.

Protect: keyed probes and DISS versus barb with the adapter named, the failure messages ("A nasal
cannula tops out at 6 L/min. The order is 15 L/min."), parts that seat themselves, the
press-and-pull tubing, the full keyboard path, and the SpO2 clock.

Smaller defects: a console error on every blender drag from the cart (`rotate(NaN …)`, the ghost
reads "undefined%"); an alert reads "undefined end to Nipple adapter barb" after an undo; a reload
lands on Tutorial 1 instead of the last wall; focus leaves an aria-modal card on Tab.

### 3.4 ER Charge Nurse

The first minute. A 120-word card, one tap to start, six patients placed in about ten seconds,
then about fifty seconds of watching. At 60 seconds the score is 0 and the waiting room says
"Empty. Enjoy it while it lasts."

Problems, most costly first:
1. The first minute is dead. Six patients against nine beds (line 164) means no choice. Smallest
   fix, data only: more patients than beds, and two or three already mid-workup.
2. Placement is barely a decision. The waiting room is pre-sorted in triage order (line 437), so
   "first patient, first bed" is near the best play: a bot doing only that scored A in 13 of 25
   Normal shifts. "Neighbor" means the next bed number, so on the desktop grid 04 and 05 are
   neighbors and 01 and 05, one above the other, are not.
3. The phone buries the decisions: one column 2,442px tall, resources at 1,694, cards at 1,964,
   and card descriptions render off the right edge.
4. No way to learn or leave. Pause freezes the clock and says "Resume", but there is no menu
   behind it: no help, no restart, no leave, and no Esc.
5. No reason for a second shift: no saved best, no unlocks, no share.

Protect: admits boarding in their beds, walkouts costing points, the post-shift report naming
the bottleneck in patient-minutes, tap-tap and drag both working, and the pure tick behind the
test hook.

Smaller defects: the end card prints counts with plus signs (+37 +18 +10 +2 −56) under a FINAL
SCORE of 102, so the rows read as points that do not add up; "1 batched steps"; Rapid Response
promises "their wait stops hurting", but patients in beds never lose patience; the critical pulse
ignores reduced motion.

### 3.5 Uncharted Regional

The first minute. Take the term sits below the fold on a phone, under a filled Restore button.
The board opens with "Region served 78%" in red while the goal asks for 77. Press Run: cleared.
Quarter 2 asks you to run under $5.08M; press Run: BOARD LOST CONFIDENCE, with $1.70M in cash.

Problems, most costly first:
1. One missed objective ends the term, with no warning. A player who only presses Run lost all
   40 Normal terms (median quarter 3) and won all 40 on Easy. The projection is exact, so the game
   knows. Smallest fix: an on-track or off-track tag on the goal card. Making a miss cost cash or
   trust instead of the term is a design change.
2. The loss advice is wrong for spend goals: "how it was winnable" says hire and add lines, and
   both raise spend.
3. Phone order: the goal at 616, Run at 1,425, the stepper the first note points to at 4,671.
4. Shared services are free money. At the open, Group Purchasing nets +$251k a quarter and the
   system EHR +$199k, a $60k-a-quarter switch that pays from day one. On touch, tapping a service
   buys it and hides its description.
5. Reading load: 536 to 542 words on the board at every width.

Protect: the projection panel as an honest answer sheet, and the lessons that come from the
mechanics (distance, the wage cliff past 82 percent of the pool, zones that remember), each under
test.

Smaller defects: save and restore re-rolls the quarter's goal and event, a free do-over on any
bad quarter (30 restores from one position gave 3 goal types and 6 events); Esc does nothing on
the start, result and end cards; the goal behind the start card differs from the one dealt after
Take the term; the grade came out C in 233 of 240 bot terms whatever the bot did.

---

## 4 · Clinical reads only David can make

Each of these came out of the review and each is a judgement for an RT and former ICU clinician,
not for a reviewer. Nothing changes until he reads them.

Device Assembly:
- Level 3, high flow (lines 905 to 914): 35 L/min through a Christmas tree and small-bore O2
  tubing into the chamber, then unheated 22 mm tubing onto an Optiflow interface. The reviewer's
  understanding is that the real setup uses a dry-gas line and a heated-wire circuit.
- Level 5: bubble CPAP (prongs, 8 L/min, 5 cm H2O), a neonatal therapy, played on the adult
  patient.
- Tutorial 3's order, "2 L/min by nasal cannula or simple mask" (line 836), which no prescriber
  writes; the lesson under it (a mask needs 5 L/min) is right.
- Level 2's title, "2 L cannula or 15 L non-rebreather", reads as a choice between two orders.
- The capnography sampling line ends in a Luer, marked "inferred" in the part's own source note.

Alarm Fatigue:
- The DNR room that can code, the pronoun, and the arrest drug pool (section 3.1).
- A design-truth question: every desat in the game is real and lethal, while real alarm fatigue
  comes from most alarms being false. Is that inversion the point, or a flaw?

ER Charge Nurse:
- Every patient gets "Triage and vitals" at the bed, but the ESI level already shows in the lobby.
- Chest pain's ECG waits for a bed, against a door-to-ECG target of ten minutes.
- Strokes and traumas walk into the waiting room; most arrive by EMS.
- Rapid Response is an inpatient team, played here as an ED card.

The hospital games:
- The payer spread (section 2, item 5).
- "Q3 Respiratory Season" with no fiscal-year framing reads as summer, the low point for flu.
- Uncharted General's Respiratory and Pulmonary unit is staffed by RNs and techs, with no
  respiratory therapists.
- Regional tags maternity as commercial-leaning, while Medicaid pays for about four in ten US
  births. The tag also changes nothing in the math.

---

## 5 · What to do, in order

Recommended. The defects in steps 1 to 3 are Claude's under the change budget or the open
reading-load phase; nothing in them needs a question.

1. ALARM FATIGUE'S PHONE START AND ITS DEFECTS. It is the public game and the one going back out
   for publicity. The notice, the Clock in button, the Restart guard, the phone clock, the peek on
   the first CLEAR, the pronoun, and the smaller list. The DNR room and the drug pool wait for
   David's read in section 4 only because they are clinical.
2. THE SHARED MENU PIECES from docs/HU-GAME-MENUS-2026-09-23.md, section 6. One build closes the
   X, Esc, back and "?" gap in all five at once, which is cheaper than five separate fixes.
3. AUTOSAVE AND A CONTINUE BUTTON in all five, on hu-save.js.
4. UNCHARTED GENERAL'S PHONE LOOP: the sticky Run bar and the on-track line.
5. DEVICE ASSEMBLY: sideways, Tutorial 1, the instruction wording, the fault titles, then the
   curve.
6. REGIONAL AND ER CHARGE are in no design phase. Their defects fit the change budget; their
   first minute, failure model and shared-service costs are design changes, and need David to
   open a phase. Recommended: open Regional after steps 1 to 5; leave ER Charge parked, because
   its fixes are structural (a new first minute, the engine contract) and its audience question
   is unanswered.

Not covered: real phones, a real back swipe, screen readers, audio quality, the light theme, and
the live multiplayer relay (deliberately not exercised).
