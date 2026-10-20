---
paths:
  - "src/fun/headwall/**"
  - "tests/device-assembly-*"
  - "scripts/da-qa.js"
  - "scripts/da-thumb.js"
  - "scripts/lib/thumb.js"
---

# Headwall · the two open design phases in full

Moved out of CLAUDE.md on 2026-10-18 so the file every session reads stays short. CLAUDE.md keeps each
phase's header, its surface and David's ruling in force, and points here. The two blocks below are the
CLAUDE.md text exactly as it stood, in the same order; nothing was reworded. The rulings that override
site standards on this surface stay in CLAUDE.md, so its PRECEDENCE still applies to them. The
round-by-round history is in docs/HU-DESIGN-PHASE-LOG.md.

**Headwall (Device Assembly until 2026-10-15) expansion · REOPENED 2026-10-03** (DECISIONS 17 and N1 to N3; plan docs/HU-DEVICE-ASSEMBLY-EXPANSION-2026-10-03.md). Surface: src/fun/headwall/.
Three stages in order: replayable on today's parts (today's wall, generated walls, the shift), then rehab and home,
then ventilators from David's marks on the plan's rule sheet. Generated walls run "from realistic to completely
insane" (no oxygen, no air, only suction, bring in a bottle). Stage A1 to A4 BUILT 2026-10-03: every wall change goes
through `dispatchAct` and the wall saves after each one (`packSave`/`applySave`, localStorage hu-da-wall); dealt walls
come from `genWall(seed)` (RECIPES x TWISTS, solution first, the engine must pass it; any change to them re-deals every
wall, old links and past daily walls included, so bump GEN_V and say so); the daily wall is `day:YYYY-MM-DD` in Mountain time, #1 on
2026-10-03; a wall link is `?wall=day:...` or `?wall=gen:CODE`. Tests: tests/device-assembly-gen.test.js and
-save.test.js. A5 THE SHIFT built 2026-10-04: section "3c" (`shiftPlan(code)` searches the complications so every
wall solves; a complication must break the wall before's build, `compBites`; `shiftAdvance` is the verb between walls
and tops up the cart; wall 5's fault comes from YOUR build via `FAULT_DO`); ids `shift:CODE:k`, link `?wall=shift:CODE`;
tests/device-assembly-shift.test.js. A6 built 2026-10-04: made walls `my:` (`makeWall` through the same `dealWall` as
the generator; a `mirror` flag on made walls only, so dealt walls never change), sandbox build links (`?build=`, the
HUDA1. save string), and THE RACE replacing the two-wall race (hu-table autoSeat p1..p8, verbs progress/submit '*',
host judges with `raceJudge`, bots via `raceTick`, `racePack` drops walls past four builders; tests
device-assembly-table and -make; live check `npm run backend:check:da`). Stage A is done. STAGE B built 2026-10-04:
section "3c2" (`genPlaceWall` / `dealPlace`, `rehabRoom`, `homeRoom`, `placeSource`, `homeLink`; ids `rehab:CODE` and
`home:CODE`; the hospital dealer untouched and `dayPlace` only from wall #4, so no dealt wall changes); a room's
`noRail` sets GRID.rail to -1 and `withGrid` restores it; `isSource` parts from the cart; tests
device-assembly-place. The maker and the shift visit the places too (2026-10-04): `placeOfTwist` reads the place from
a made wall's twist; a shift wall carries its whole `room` (`compRoom`, `applyRoom`, `shiftWallBuild`), SHIFT_V 2.
STAGE C BUILT 2026-10-04 (David: "lets move onto stage c", then "go ahead and build the rest of stage c"; the rule
sheet read "looks right, no changes" the same night): ten authored vent walls (`v1`..`v7`, `vf1`..`vf3`, group Ventilators, open from the start) and
two home oxygen faults (`f4`, `f5`, `ownRoom`), in `ICU_ROOM()`, `ICU_BOOM()` (a vacuum outlet at bed height) and
`LIVING()` (screens on the left); the ICU as a fourth dealt place, section "3c3" (`dealIcu`, `VENT_RECIPES`,
`recipeOf`, `ICU_SPOTS` from searches, `ICU_TWISTS`, `underScreen`; ids `icu:CODE`; the daily wall from #5, `ICU_DAY`;
the shift's "A night on the ventilator", SHIFT_V 3). Parts flagged `vc` stay off the hospital bench; side ports are
`term` (`ev.termHits`); a `battery` device runs unplugged with a note; the sheet's rules are switches in `VENT_RULES`,
so David's marks flip lines, not code; `level.after` builds a wall after the room is up; tests device-assembly-vent and
-vent2. THE DAILY YEAR (DY2, 2026-10-11, "yes to the daily walls, start oct 25"; plan
docs/HU-DEVICE-ASSEMBLY-DAILY-PLAN-2026-10-11.md): from wall #23 (Sunday 2026-10-25) the daily follows the weekly climb
(Monday a new room, Tuesday the cart, Wednesday the order, Thursday barriers, Friday take it apart, Saturday hard and the
jokes, Sunday a three-wall story), each day re-dealt into its band; walls #1 to #22 never change (a test pins them), and
a day the year cannot deal falls back to the old dealer. New MODES (find the fault, the goal not the device) get a teach
wall the first time; new TWISTS just name themselves on the wall. BUILT 2026-10-11 (section 3d; the month YEAR_PLAN, kinds
YEAR_KIND, bands YEAR_BAND, twists YEAR_TWISTS, teach walls YEAR_TEACH; tests/device-assembly-daily.test.js and its pins;
the log in docs/HU-DESIGN-PHASE-LOG.md), at his QA by Oct 20. The rulings below still hold.

**Headwall (Device Assembly until 2026-10-15) game feel · OPEN since 2026-09-16, PARKED AT ALPHA 2026-09-19, REOPENED 2026-10-04** for the
cleanup before the playtest (David: "Yes complete that build in full order"; the list is K1 to K8 in
docs/HU-DEVICE-ASSEMBLY-DEEP-DIVE-2026-10-04.md section 6, built 2026-10-04 to 05, at his QA). What it left on the
surface: THE STOP (`whereItStops`: a failed test names the one place the gas stops, rings it, and the miss card sits
low with no dim); PROBLEMS ON THE WALL (`problemsSVG`: a wrong joint is ringed and tagged in a few words, the tag opens
the reason through HUKit.peek; a run a move pulled off leaves a mark, `st.lost`; the adapter a joint needs is lit on the
cart); LIVE GAS (parts the outlets do not reach dim); THE SHAPES (one plain shape per connector kind, male a tab, female
the same shape as a slot, the outlets are slots, the bore written upright); WHERE IT GOES (`fitTargets`, `landingAt`:
a held part rings the ports it fits and the drop preview says Seats here, Needs an adapter or Won't fit here); WILL IT
REACH (`planRun`: the route before you let go); ONE PLACE PER JOB (one walls card, one Help card holding the old panel
folds, the screen's tabs Order and Hint since 2026-10-15); THE PHONE (one screen, the dock only when it has something to do,
touch words through `touchText`, the part above the thumb, a sideways swipe scrolls the cart, a second finger turns);
ZOOM (`VIEW`: pinch, buttons, Ctrl and the wheel, keys, a double tap; nothing is re-laid); a Settings row, Show problems
as I build, that turns the live help off. Find-the-fault walls keep all of it quiet until their first Complete.
After his QA (2026-10-05, "a better standard or a more approachable model for these menus"): THE TRAY (the cart is kind
tabs over tiles, `cartTab`; a tile is the picture, the name, the connector shapes and the count, the small print on the
spec sheet); NO BIN (the Back to cart strip, `#trash.show`, appears only while a wall part is held, and the cart lights
as a drop target, `#cartDock.drop-ok`); the dock's verbs carry their words (Turn, Flip, Details, Put back, Undo); the
complexity stars are off the result card (`score()` still works them out). THE SCREEN (his next note, "the phone view
for it does not fit well within the windows"): a phone held upright is one screen, `100dvh`, nothing scrolls; the wall
fits what is left (`onePhoneScreen()`, contain-fit in `fitBoard`, no floor: a floor made the SE flip between two sizes);
Complete and Reset are a row of their own at the foot, under the parts (`placeBar()` moves `#submitBar` into `#cartDock`;
his next note: beside the tabs it crowded them); the zoom buttons and the verbs sit on the wall's corners (`--wall-x`,
`--wall-y`) and step apart where they would meet (`placeVerbs`, `.zoom-up`; beside a small wall the zoom stands in the
margin, `.zoom-side`); the hint's step is in its tab. On a phone, a card that opens as another closes waits for the
closing one's history step (`afterBack`), or it hears the step as a back press and shuts. His Puzzles-sheet notes
(2026-10-05, window d): POWER has its own shapes (`nema-m` a plug, `nema-f` an outlet's face; `plugAt`, `bootAt`; a
seated cord end carries no dot); a wall part let go off the wall goes back on the cart; outside the tutorials the screen
never turns to Hint by itself (`hintLeads`); the timed wall's SpO2 chip stacks on a phone (`satChip`); the saved card has
a footer band and keeps the wall's shape (`wallCard`); an interface on the face turns its lead toward its run
(`faceLead`); a vent order reads on the screen (`screenOrderLines`).
BETA SESSION ONE (his yes to B1 to B3, 2026-10-05; plan docs/HU-DEVICE-ASSEMBLY-BETA-1-PLAN-2026-10-05.md), built: IN LINE
(`inlinePlan`/`insertInline`, verb `inline`: a part with ports on opposite sides dropped on a run goes in at the nearer
joint; on a part seated straight onto another, the outer side slides out a square, `jointPlan`/`sideOf`; out again, the
joint closes, `inlineRejoins`/`jointCloses`); cords, vent hoses and sampling lines lie over things (`isCord`, free routing,
a second draw pass); runs cross at straight squares (`crossAxes`, a gap drawn under the top run); SWAP (verb `swap`,
`twinsOf`: same connectors, cycles; a tap picks a run, a pull still unplugs); the ICU vent takes oxygen AND air
(`twoGas`, both hoses checked); THE VENT CART (`vent-cart`, `vent-cart-low` with ports underneath, the humidifier on its
pole, one cord); THE CIRCUIT IN ITS BAG (`circuit-heated`, `circuit-plain`, verb `kit`, `layCircuit`/`outerPort`/`layFrom`;
Ventilator 1 keeps the loose pieces); dead space (VENT_RULES.deadSpace: two flex tubes fail); PATHS (`PATHS`, `pathOf`,
`pathNext`, `kickerOf`, `crumbOf`; five paths, written and made walls mixed; More walls holds home and rehab for beta two);
a stored ANSWER for every authored wall (`answerOf`, `ANSWER_BY_HAND`, lazy `L.solution`; the puzzle sheet tries every
break); the extension cord decoy (`ext-cord`, `onExtension`). ICU deals are on the cart (`icuCart`, `ICU_CART_SPOTS`,
ICU_V 2). THE FRONT DOOR (B7, BUILT 2026-10-06, at his QA): the game opens on a home screen (`doorA`, `openDoor`; the Home button and the result cards' Home come back to it): a first visit leads with Start the training; a visit after with today's wall, then your path with Continue, then tiles (Training, Paths, Random wall in four places, The shift, Race, Make a wall); Paths is B4's map as a card (`menuTracks`). A link to a wall, a room, a race or a build opens what it names; the wall loaded behind the door counts nothing (`bootQuiet`). THE MOVE (B6): the game is on the Fun shelf at src/fun/headwall/ since the rename (THE NAME, below), marked beta; both old addresses 301 there (netlify.toml); every part has a plain address (src/fun/headwall/parts.11ty.js: /today/, /training/, /paths/ and each path, /random/, /shift/, /race/, /make/), and the address follows the wall on screen (`addressOf`, `setAddress`, `gameRoot`); tests/device-assembly-door.test.js. The standard behind it is in the hu-game-shell skill, "a phone is one screen"; `npm run da:qa`
checks five real phone screens.
HIS PUZZLES-SHEET NOTES (2026-10-07, window b; log in docs/HU-DESIGN-PHASE-LOG.md): FOUR VENT BUILDS (`VENT_BUILDS`: `vent-cart` one side, `-low` underneath, `-split` a port each side, `-stack` top and bottom; each flips, eight configurations; `ICU_CART_SPOTS` rows are [x,y,flipped,build]; `icuTryBuild` tries the wall's own build first; ICU_V 3; a setup wall per configuration on the sheet, icu:VB29 VB72 VB50 VB86 VB0 VB34 VB8 VB66, tests/device-assembly-vent-builds.test.js); Ventilator 8 (`v8`, `ICU_LEFT()`, the cart on the patient's left); cords, hoses and sampling lines go ROUND parts and cross runs (`occupancy` holds item cells, `cordsClear` re-routes one a part lands on); Swap on a tap (a twin picked on the cart, then a run); the sandbox headwall is loose pieces (`it.wall`, each moves alone); the screen never turns by itself (a message is `S.screen.flash`, a strip at its foot); A PUZZLE KEEPS QUIET (2026-10-15, David: "it should not jump to the hint section or say what the last move is during the play"): outside the five training walls a move that worked says nothing (`moveToast`), only a refused move says why, and Complete leaves the screen on the order; the screen is Order and Hint (`pageOf`), the chart note sits with the order (the phone's sheet; on the glass a Note tag where no side panel shows, under 1000 px) and par sits at its foot where the move counts were; the shift has no bonus pick; Levels 1 timed, 3 and 5 in rooms of their own; Find the fault 2 on an extension cord; Find the fault 6 (`f6`, a non-rebreather at 6); ONE FINISH CARD (`finishBtns`: Next, Share, Build it again, Home; Share leads on the daily and made walls; See par build in the breakdown). The hub's Puzzles sheet takes `?group=`. THE DOOR'S SENTENCES ARE BEHIND THE "i" (2026-10-08, his note: flavor text never face up): a tile or card is its name and one number; `peekDef`, `PEEK_I`, `peekBadge`, `notPeek` (a tap on the badge never plays), `HUKit.peek` on `.da-peek[data-def]`.
PHONE PLAY (2026-10-12, his yes to P1 and P2 after his own phone play: "I couldn't plug things in or connect things very easily
with my fingers"; plan docs/HU-PHONE-PLAY-PLAN-2026-10-12.md; the standard is the hu-game-shell skill's "a finger is not a mouse"),
built at his QA: an upright phone's bedside screen is ONE LINE that opens whole as a sheet (`screenLine`, `openScreenFull`); the tray is
ONE SLIM ROW with All parts opening the full list as a sheet (`openTray`); a part picked by a tap puts its buttons IN THE ROW, with
Done and Move (`rowVerbs`, `moveSel`), and Undo sits at the foot beside Complete; nothing sits on the wall while a part is held. What
was pressed is read at the EXACT POINT, presses and the clicks they make alike (`hitAt`, `downAt`): Chrome's touch adjustment had
handed presses on small parts to their ports. On touch THE GAME AIMS: a part lands on the nearest place it fits within 44 px
(`landingsFor`, `aimLanding`), a run's end on the nearest port that can take it (`portNear`, the end riding `TUBE_LIFT` above the
thumb once it moves), a press near an open port on bare wall, the patient or a fixture starts its run (`openPortNear`); the held
part's own position decides, so the bottom rows are reachable and a part pulled off the wall goes back (`ghostPoint`). Touch drags
start at 10 px; a plugged-in port unplugs only when pulled; Settings has Buzz when something connects (`buzz`). The thumb test:
`npm run da:thumb` (scripts/da-thumb.js, helpers scripts/lib/thumb.js), its quick pass inside `npm run da:qa`.
THE DAILY BY THUMB (2026-10-14, his phone play: "my finger still does not line up", "i also cannot drop down the cart of tools"):
a run's end and a held part each have TWO aims, what is drawn above the thumb and the thumb itself, and a port the run fits beats
a nearer one it does not (`portNear`, `aimLanding`), and a thumb resting inside a place the part fits takes that place (2026-10-16:
the drag lifts the part two squares, the Y's arms are two squares apart, so the drawn part had won the wrong arm); the row scrolls itself, so a rising pull lifts from any tile (`rowSwipe`);
All parts on every cart of two or more. The thumb test plays today's daily to Complete, reaches the tray by touch alone and
drags as two players; every wall's cart is held to its answer (tests/device-assembly-puzzles.test.js).
A circuit that will not lay names, fix first, a fix that works from where the ventilator stands: Flip, one square a way, back,
closer (`circuitMiss`; tests/device-assembly-vent-miss.test.js plays every spot). THE BAG (2026-10-15, BAG1 and BAG2: "On any patient with an artificial airway we have to have a bag on the headwall"; "On the wall is enough"): `VENT_RULES.airwayBag`, a wall with an ET tube or a trach that carries `bag` ('cart' or 'wall') fails without a resuscitation bag on the wall; dealt walls take it after the deal (`addBag`, `bagShift`, `bagUid`) so no deal changes, daily walls from #14 (`BAG_DAY`); eleven pins re-taken on purpose; tests/device-assembly-bag.test.js. The cart lands facing the patient (P3, 2026-10-16, `ventFace` in `autoOrient`; Flip still turns it).
The puzzle QA system: tests/device-assembly-puzzles.test.js in verify, `npm run da:qa`, the hub's Puzzles screen.
THE NAME (HW1, 2026-10-15, David: "Name and address"): Headwall wherever a player or reader sees it, at /fun/headwall/; the
old Fun shelf address and the older secret menu one 301 to it in one hop, plain addresses and query links included
(netlify.toml; tests/device-assembly-move.test.js). What kept the old name on purpose, so saves and counts carry over: the
storage keys (hu-da and the rest), the ids (da, `__da`, `__DA_HOOK`), the play counters' event paths, the og and thumbnail
file names, the scripts (da:qa, da:thumb) and the test files (tests/device-assembly-*).
Surface: src/fun/headwall/ (index.html, and parts.11ty.js, the plain addresses) only.
Fifteen rounds shipped 2026-09-16 to 2026-09-19 on David's reads; every one is recorded in
docs/HU-DESIGN-PHASE-LOG.md and in docs/HU-DEVICE-ASSEMBLY-FEEL-2026-09-16.md section 3. What a session
needs before touching the surface:
- David's rulings, in force: polish is what makes it a web game ("still clunky" 2026-09-18); "disregard any
  design standards... go wild" (2026-09-19), so on THIS surface Tier 3 is gone and Tier 1 and 2 yield where
  they stand between the game and looking good (44 px targets and reduced motion kept, they cost nothing);
  the engine, the level data, the part database and the copy stay under the change budget.
- The mechanisms that exist now, so nobody rebuilds them: THE ROOM (layout is data a level names,
  ROOMS.left/right/mirror, builds and extras in zone columns, the body four columns right and no further
  without a smaller cell, David's call); THE PATIENT (Round 17: he is his three pieces, a level's `face`
  places him, `movePatient` lets the sandbox drag him, Level 1 on lie a row lower with the 14 ft cannula);
  THE MIRROR (it.f, Flip F, auto-orient tries it first, a room's
  patient can face the other way); THE WALL SCREEN (the bedside computer: ORDER and HINT pages since
  2026-10-15, TEST and NOTE gone, an alert showing for a moment with no tab, tappable, text sized to the box; where the screen is under 150 px it reads out under
  the wall as real text with 44 px tabs, Round 16, and the wall svg is `data-drawing` for the phone gate); NOTHING FLOATS otherwise, except what the cleanup put there on David's word, the problem tags and the stop (no title card, no brief card, no tooltip, no marks on seated joints, the
  status line reads, the touch verbs in a dock at the foot of the wall with their words, on an upright phone in the tray's row since PHONE PLAY, the mouse verbs on the spec sheet); the art
  system (one soft ink, edges from the fill, glints, one soft shadow per part, the patient and the bed at
  scale). Tester hatches: ?unlock=1 opens every wall, ?room=mirror|left picks the room.
- Gates: `npm run verify` (tests/device-assembly-*.test.js, the puzzle checks among them), `npm run da:qa` before a
  new wall ships, and the phone harness at its nine sizes. Visual checks: a Playwright one-off with NODE_PATH=node_modules screenshotting #board into tmp/
  (the pane's own screenshots render tiny when the pane is narrow).
- Closing the phase later means writing the wall grammar into DESIGN.md Tier 3. Still David's: the launch
  post, his phone play at 360, and the commit (everything is uncommitted). The alpha backlog table is
docs/HU-RT-REDDIT-RESEARCH-2026-09-16.md section 11. Reference: NandGame
(docs/HU-DEVICE-ASSEMBLY-FEEL-2026-09-16.md).
