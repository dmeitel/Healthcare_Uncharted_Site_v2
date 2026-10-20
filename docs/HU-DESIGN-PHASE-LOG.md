# HU Design Phase Log

The full record of every declared design phase: what was opened on which ruling, what shipped in
each round, what was reverted, what closed. Moved out of CLAUDE.md on 2026-09-18 so the instruction
file carries current state only (a changelog inside the instructions was being loaded into every
session). APPEND HERE when a round ships; UPDATE the compact block in CLAUDE.md to match.

## Record as of 2026-09-18 (verbatim from CLAUDE.md)

**Device Assembly game feel · opened 2026-09-16 on David's ruling: "first we need to
polish the game feel."** Named surface: src/secret-menu/device-assembly/index.html only.
What is open: motion, feedback on every action (place, join, pull off, test, submit),
timers and the test read, input response. Tier 1 and 2 bind: 44px targets, reduced
motion honored (the file already has a prefers-reduced-motion block), transform and
opacity only, the kit primitives. NOT open: the engine (evaluate, functionTest, score),
the level data, the part database, the copy. Sequence ruled by David: feel polish FIRST,
then the research backlog in docs/HU-RT-REDDIT-RESEARCH-2026-09-16.md section 11 (fault
mode, NRB level, copy reframe, share card, phone QA gate). Reference David gave: NandGame,
"smoother drag and drop", "the connection of things cleanly understood"; its mechanics are
read out in docs/HU-DEVICE-ASSEMBLY-FEEL-2026-09-16.md. ROUND 1 (the hand) SHIPPED
2026-09-16: persistent drop rect (no rebuild on pointer move), ghost follows the pointer
1:1 with a lift, verb bar outside the part at 44px on phones, transition toasts, overlay
entrance, three-phase test flow (reveal, march, fade), settle and joint ring, press
feedback, three motion tokens. ROUND 1 ADDENDUM SHIPPED 2026-09-17 on David's read ("the
nipple adapter should move with it ... like folder selection on a desktop"): THE ASSEMBLY
RULE (green joints and jumpers move as one cluster, amber/red do not, fixed outlets never;
clusterOf/moveGroup in the engine, group ghost + per-part drop rects) and ROPED SELECTION
(marquee on empty wall, shift-click, delete-only verb bar, drag any member moves the set).
ROUND 2 PART 1 SHIPPED 2026-09-17 on David's brief
("symbols people can learn or already established standards"): CONNECTOR GLYPHS, one symbol
per standard in #daDefs, shape = the connector's silhouette (ISO cone/socket, barb, DISS
hex, Ohio diamond, Chemetron pin, NEMA, Luer), fill = gender, color = NFPA 99 gas; on the
wall, the cart, the spec sheet and a legend; text gauge chips gone from the wall; 20 px
floor on phones. Round 2 part 2 (card backing behind parts, lighter tubing, larger joints,
a phone magnifier) awaits David's call. Closing this phase means
writing the game's feel grammar into DESIGN.md Tier 3.

**Cost of Living Comparison (the compass) · opened 2026-08-30 on David's brief: "make it
more like SmartAsset Cost of Living Calculator or other finance apps", easier to understand
and use.** The archetype: one plain-sentence answer first, minimal jargon, progressive
disclosure. ROUND 1 SHIPPED same day: THE ANSWER card leads the results (the breakeven
equivalence as a sentence: "$78,624 in Salt Lake County, UT goes about as far as $100,159
in Sacramento County, CA", live-updating, county-aware, with the monthly consequence as the
sub); the example state now announces itself via an amber chip on that card ("Example
numbers · edit anything to make them yours") that drops on first edit; jargon stripped
site-of-tool-wide ("The assignment" -> "The new location" in form + JS strings, "Breakeven"
-> "The pay you would need there", "Monthly ledger" -> "Monthly costs, side by side",
"Presets" -> "Try an example"). ROUND 2, THE REAL RESTRUCTURE, awaits David's read: on
phones the form stack buries the answer below a full screen of dropdowns; the SmartAsset
move is a compact question-band (two places + pay) at the top with the detail sections
folded behind it. Closing this phase = the answer-first grammar into DESIGN.md Tier 3.

**The merged band (nav + tool toolbar) · opened 2026-08-30 on David's go ("yes lets
move on it, i want to see that").** Named surface: the chrome band on tool pages that
declare `nav_merged: true`. The mechanism is site-shared and shipped: `--nav-h` (the
layout offset) splits from `--nav-bar-h` (the bar's physical height); a merged page
sets the offset to 0 so every shell and sticky reflows to full height, the real nav
parks offscreen, and the toolbar carries a `.tb-brand` mark plus a `[data-nav-summon]`
control that slides the one true nav down over the canvas (Esc, outside tap, or the
control dismisses; the links dropdown folds with the bar; reduced-motion drops the
transition; nothing is duplicated). ROLLED OUT 2026-08-30 on David’s approval ("we can apply this in other places"): ALL EIGHT toolbar pages are merged (atlas, craft, career-tree, hospital-map, iceberg, sql-mystery, assignment-compass, observatory). Career-tree’s phone answer: brand and toolbar summon yield, the site menu rides the bottom tab bar as a fifth item (.hct-site), and the tool’s tab wiring is scoped to [data-view]. NOT converted: the two MapLibre maps (own chrome, twins rule, their own session) and the hub pages (full nav + bottom bar by design). AWAITING David’s device QA of all eight. Closing this phase
means writing the merged band into DESIGN.md Tier 3.

**Learn + Rounds reading surface · opened 2026-08-24 · PARKED same day by David's
call.** His words: the articles "will need like complete rewrites and tooling in the
future", the pages "do not follow a format nor is there consistency in the writing
style", so no more reading-surface work until he reopens it; focus is Tools, Atlas,
and the Secret Menu. What was built in rounds 1 and 2 below is content-agnostic
chrome (it reads any article regardless of format) and stands unless he wants it
pulled. Original record: The archetype: NYT-app-grade
reading, floated 2026-08-23 and unvetoed. The audit found the TYPE already right
(17px/1.78, ~40ch measure, editorial mastheads, callouts) and left it alone; the gaps
were the experience layer. Round 1 shipped: the KEEP READING handoff (authored
readingOrder in _data/learn.js, posted order for Rounds; no article dead-ends into
the footer any more), a 2px reading-progress hairline, and the nav yielding on
read-down / returning on scroll-up (phones only, focus-within brings it back,
reduced-motion drops the transition). Tier 1 and 2 bound throughout: tokens only,
transform-only motion under 250ms, 44px targets. Round 2 shipped same day: READING
MEMORY (hu-reading in localStorage, on-device only, saves your spot per article),
the CONTINUE READING card on both section indexes (most recent unfinished article,
progress track, resumes via #continue), SHARE at the end of every article (native
sheet on phones, copy-link elsewhere), and finishing an article now EARNS its Learn
index tick, closing the read-ticks script's own documented honest limit (it could
only mark on click, so deep-link arrivals never ticked). The rn-* card classes are
deliberately unscoped: one grammar serves the handoff and the continue card. Phase
stays open pending David's device read; closing it means writing "the reading
grammar" into DESIGN.md Tier 3.

**The Atlas · opened and CLOSED 2026-08-23 by David's ruling, phone flow REVERTED.**
His words: "the grid a core concept with the hex tiles. other tools can change but not
the Atlas, its the brain/Grid of the whole website." A browse-flow replacement for the
phone canvas shipped for hours and was fully reverted. THE RULING, now Tier 4 identity:
the hex grid IS the atlas, on every device; pinch and zoom are the phone answer. What
survived the phase: the back-guard consumed() fix in the hash restore path (a real bug),
and the hpf-* kit components (the career tree remains their consumer).

**My Path (career tree) · opened and CLOSED 2026-08-23, shipped.** One component: the
STATUS CARD at the top of My Path, the Strava read the tool's archetype demanded: goal,
requirements done, years/exams/fees to go, and the single next action, live-updating as
requirements get ticked. Built on the card grammar; all data pre-existed (the bill, the
checklists). Core design ruled GOOD, no redesign: the gap was emotional (worksheet vs
companion), closed by this one summary.

**The two MapLibre maps · opened 2026-08-23 · CLOSED 2026-08-23, shipped.**
Tier 3 in DESIGN.md now carries "The map instrument grammar", which is what shipped.
The change budget applies to the maps again; the grammar below is the record of the phase.
`src/tools/multi-lens-map/` and `src/tools/operators-map/`, plus their modules.

They open together because they are one instrument in two datasets: same shell, same
kit primitives, same chrome grammar. A change to one that is not made to the other is
a hand-rolled twin, which Tier 2 still forbids.

WHAT IS OPEN: the chrome. The floating controls, the sheet and how it is entered, the
information hierarchy at rest, and the path into the deep data. David's brief, in his
words: the buttons are all over, there are too many icons placed over each other, and
it should be easier to navigate into the deep data. His references are Watch Duty,
Zillow, AllTrails, FlightRadar24 and Strava, none of which are animation showcases;
they are all dense functional tools, so this is an interaction-quality phase, not a
decoration one.

WHAT IS NOT OPEN, even here: the choropleth encoding and the data layer's identity.
The palette anchors, the sourcing captions and the Earned Color Rule are Tier 2 and
Tier 4. The map still stays neutral at rest and every number still walks back to a
source.

Closing this phase means rewriting DESIGN.md Tier 3 to describe the chrome that
actually shipped.

## 2026-09-18 · Device Assembly game feel · Round 2 part 2 shipped

Card backing behind every device, adapter and interface; tubing one weight lighter with a thinner ink outline; joint nodes counter-scaled to 8 px on screen with check/bang/x state marks; the cart search box lifted to the 44 px floor (found by the new phone harness). The phone magnifier was deferred. Last item on the phase build list; closing the phase (the feel grammar into DESIGN.md Tier 3) awaits David. Record: docs/HU-DEVICE-ASSEMBLY-FEEL-2026-09-16.md section 3.

## 2026-09-18 · Device Assembly game feel · Round 3, the hand part 2

On David's read that part movement was "still clunky and not as clean as a web game": no wall rebuild at pickup, rects cached and moves coalesced per frame, the ghost glides onto the cell (or home, or into the trash) with the landed part hidden until it arrives, stale-ghost hardening. Same day he ruled polish not done and all seven backlog items into the alpha. Record: docs/HU-DEVICE-ASSEMBLY-FEEL-2026-09-16.md section 3.

## 2026-09-18 · Device Assembly · the alpha pass

On David's ruling that all seven backlog items go into the alpha: find-the-fault mode with three walls, the non-rebreather level, the copy reframe, the wall share card, the phone harness gate, the nurses/EMS line, the NBRC TMC mapping (Section II, Assemble / Troubleshoot Devices). Status table in docs/HU-RT-REDDIT-RESEARCH-2026-09-16.md section 11. The feel phase stays open by his call.

## 2026-09-19 · Device Assembly game feel · Round 4, first alpha play

On David's read of the test environment ("cannot move the oxygen tubing", "a transparency issue", "side menus and pop ups... start with simple and have it expand"): press a run and pull lifts its nearer end; the part in the hand is opaque and leaves a dashed slot with its ports hidden; the level panel, spec sheet, brief card and fault reveal fold to simple-first behind one details primitive. Record: docs/HU-DEVICE-ASSEMBLY-FEEL-2026-09-16.md section 3.

## 2026-09-19 · Device Assembly · Round 5, repair and menuing

On David's read ("it should be fix it and make it working again", "easy to step into and out of"): find-the-fault became a repair with Show me as a two-star hint; the title card resumes the last wall, folds the walls into four counted groups, offers Back to the wall; finished walls skip the brief; Esc steps out of any card; the tester hatch opens locks instead of faking progress. Record: docs/HU-DEVICE-ASSEMBLY-FEEL-2026-09-16.md section 3.

## 2026-09-19 · Device Assembly · Round 6, the room and the quiet wall

On David's third read ("transparent backgrounds to connectors", "move the body from left to right... the back end to swap and move things around for the different puzzle types", "so many things pop up when you hover"): layout became data a level names (ROOMS.left/right, builds and extras in zone columns), the body moved four columns right, which is as far as the 7 ft lead, the 13 ft sampling line and the 10 ft cords allow; the female glyphs fill nothing and adapters carry no card; the tooltip is gone (the status line reads), name chips come with selection, the verbs dock in the spec sheet for a mouse; the cart rail's duplicate brief is gone and the test read folds the lines not on the order. He also ruled the alpha does not launch until the polish is really worked. Record: docs/HU-DEVICE-ASSEMBLY-FEEL-2026-09-16.md section 3.

## 2026-09-19 · Device Assembly · Round 7, go wild

On David's fourth read ("the side panel looks too complicated", "the list of supplies shifts down", "we do not need check marks at each connection point... makes it hard to select them", "make the patient more visually appealing... disregard any design standards... go wild"): nothing draws on a seated joint; a port's press target is the outer half-disc so the part's face is grabbable; a part in the hand goes down where you click; the cart keeps its scroll; the patient redrawn and the wall given depth; the sheet simplified to name, one sentence, Connects, dials, with the catalog folded. Ruling recorded in CLAUDE.md: on this surface the standards yield to the game. Record: docs/HU-DEVICE-ASSEMBLY-FEEL-2026-09-16.md section 3.

## 2026-09-19 · Device Assembly · Round 8, the visual overhaul

On David's fifth read ("update the device art, overhaul the whole visual build for the game but keep the function the same"): the drawing system was re-skinned under every part (one soft navy ink; edges derived from each fill at two thirds the width; lighter plastics and glass), the outlet plates, flowmeter and bubble humidifier redrawn, tubing outlined in its own tone, the rail brushed, one soft drop shadow per part. Function untouched. Record: docs/HU-DEVICE-ASSEMBLY-FEEL-2026-09-16.md section 3.

## 2026-09-19 · Device Assembly · Round 9, the hand pass

On David's read of Round 8 ("a step in the right direction, keep moving in this direction"): the rest of the catalog redrawn in the Round 8 system (the source, blender, suction regulator, tree, heated humidifier, the masks, the jars), with dials that are dials and glints on glass and metal; toasts one at a time. Record: docs/HU-DEVICE-ASSEMBLY-FEEL-2026-09-16.md section 3.

## 2026-09-19 · Device Assembly · Round 10, the wall screen

On David's ask ("a computer screen on the headwall... swap between the order and the errors... so the pop-ups and the details have a place to be"): the bedside computer replaces the order card, with ORDER, ALERTS and TEST pages; alerts show there for a few seconds instead of floating (a phone keeps the card); the test read stays on it until the wall changes. Record: docs/HU-DEVICE-ASSEMBLY-FEEL-2026-09-16.md section 3.

## 2026-09-19 · Device Assembly · Round 11, the screen as the console

On David's read ("more of the info built into that mini computer screen... all the pieces on the field"): four tappable pages (ORDER, HINT, ALERTS, TEST), the hint on a step change, the failing reason on the test page, the floating card only where the screen is too small to read, the floating verb bar hidden for any fine pointer. Record: docs/HU-DEVICE-ASSEMBLY-FEEL-2026-09-16.md section 3.

## 2026-09-19 · Device Assembly · Round 12, scale

On David's read ("the scale still feels really wrong"): the fixtures grew to their real footprints (monitor 2x3, gloves 2x1, sanitizer 1x2, clock 2x2), the bed spans the wall, the screen sits on an arm over the foot of the bed. The capnography run to the monitor is twelve cells now. Record: docs/HU-DEVICE-ASSEMBLY-FEEL-2026-09-16.md section 3.

## 2026-09-19 · Device Assembly · Round 13, nothing pops

On David's ask ("a place for those pop-ups and menu selections to live so they don't pop up every time"): the brief card is gone (the scenario and par moved to the screen's NOTE page and the level panel; the first step shows on the screen), and the touch verbs live in a fixed dock beside the trash. Record: docs/HU-DEVICE-ASSEMBLY-FEEL-2026-09-16.md section 3.

## 2026-09-19 · Device Assembly · Round 14, the mirror

On David's ask ("patient interfaces that can swap from left to right"): a part can be mirrored (Flip, F) with its art mirrored and its words reading forward; a room's patient can face the other way and an interface dropped on that nose mirrors itself. ROOMS.mirror and ?room=mirror for testing; no shipped level mirrored. Record: docs/HU-DEVICE-ASSEMBLY-FEEL-2026-09-16.md section 3.

## 2026-09-19 · Device Assembly · Round 15, the start menu is the wall

On David's ask ("integrate this first pop-up menu into the game"): the title card is gone; the game opens on the last wall; the walls are a tappable WALLS page on the bedside screen and a fold of buttons in the level panel; the pitch is a fold. Record: docs/HU-DEVICE-ASSEMBLY-FEEL-2026-09-16.md section 3.

## 2026-09-19 · Device Assembly · alpha called, phase parked

David: "any last clean up before I call this an alpha and work on something else." Clean-up shipped (dead code, stale comments, the CLAUDE.md block compacted, memory consolidated). The feel phase is PARKED at the alpha, not closed; closing means the wall grammar into DESIGN.md Tier 3.

---

## ROUND 3 · Cost of Living Comparison · 2026-09-22

Opened by David: "its extreamly complex, hard to follow easiliy, the visuals are all over the
place and it does not create the user experince we want." Run as the trial for the tool-layer QA
work, so every change was measured before and after with `scripts/density.js`.

WHAT THE MEASUREMENT SAID FIRST. The tool asked FOURTEEN questions before it answered one: two
locations, two optional counties, rate, hours, profession, and seven monthly budget lines. 342
words and 28 controls on the first screen at desktop. For scale, 364 words on the Device Assembly
wall is what opened the games phase as "too crowded".

THE CAUSE WAS ONE ATTRIBUTE. Round 2 had already built the three-question band correctly, but the
fine-tune fold shipped `open` and JavaScript only closed it on phones. Desktop never got round 2.
Closing it exposed a second trap: `.ac-more > summary` was `display:none` on desktop, so a closed
fold had no handle and its controls became unreachable. The summary now shows at every width.

WHAT SHIPPED, each on David's answer to a question asked with a recommendation:
- **Three inputs before an answer** (from, to, rate). Counties, profession, filing status and the
  seven cost lines moved behind the fold.
- **The seven budget lines prefill from data.** Housing from real county rent (ZORI, then ACS);
  the other six from that state's MERIC category index against a national baseline now cited to
  the BLS Consumer Expenditure Survey 2024. Mississippi fills housing at $1,065 and groceries at
  $447; Hawaii at $4,536 and $654. A line you type is yours and later location changes leave it.
- **The example chip rail removed.** It sat between the visitor and the question.
- **Plain language.** Twelve replacements: "Utah / mo left over" became "Utah, left over each
  month", the ledger head "Δ/mo" became "Difference". `/hr` and `/night` kept, because that is
  how travel contracts quote those numbers.
- **The compare row**, on his read: "like google translate, side by side of the two locations
  with an arrow from one to the other, and you can hit it to swap." The swap carries counties
  with their states and pay with its place.
- **Pay per place.** Each side owns its own pay field, so you fill whichever you know. This
  DELETED the "Same pay / The offer pays differently" toggle, whose only job was to reveal a
  control the engine already handled when empty.
- **Hours per YEAR, not per week.** Weekly hours times 52 paid a traveler for every week of the
  year; three 13-week contracts is 39. This corrected the arithmetic, not just the label.
- **The peek grammar, finally used here.** `HUKit.peek` existed since the games phase and this
  tool had zero badges against 604 words of prose. Three badges so far.

NUMBERS: 342 words and 14 inputs to 229 and 5 at desktop. Verify green at 225, clean at all nine
viewports throughout.

TWO INSTRUMENT FAILURES WORTH KEEPING. `density.js` measured hidden inputs as visible, because
content inside a closed `<details>` keeps its layout box (content-visibility skips paint, not
layout), and nearly reported a working fix as a failure. And a `npm run verify` whose output was
piped through grep swallowed a real TypeScript error; it was caught only by running verify plainly.

STILL OPEN ON THIS SURFACE: about 546 words of prose, split into explanation that should be
peeked, genuine warnings (tax home, flood risk) that are the tool's best content and should NOT
be hidden without David ruling on each, and live status lines that are output rather than clutter.
Numbeo's API was priced and declined: $260/month, no free tier, and its sixty-line granularity is
the opposite of the compilation David asked for.

## ROUND 3, continued · Cost of Living Comparison · 2026-09-22

Written 2026-09-23 because the rest of round 3 shipped without a log entry, and the next tool
rebuild copies from this record. Each item was David's read in the conversation.

- **Trays drop from the top instead of a side panel.** David: "a menu that drops down from the
  top." Three trays under the compare row: Narrow it down (the counties; statewide is the default
  because David asked for "state wide and then you have the option" to go finer), Bonus and
  stipend (its own tray, since he could not find it inside fine-tune), and Fine-tune. Each one
  is the new site fold, `.hu-fold--drop` in hu-global.css.
- **One fold for the site.** "we need a think of a standard for expandable and colapslable
  containers." `.hu-fold` is a details/summary, lifted from the assembly game's fold. `--panel`
  gives a collapsible card and `--drop` gives a tray. The result cards use `--panel`.
- **Bonus and stipend.** A one-time bonus spreads over the contract (weeks divided by 4.345), and
  the weekly stipend has a per-scenario Taxed/Untaxed toggle. A taxed stipend joins gross pay; an
  untaxed one is added after tax. Both round-trip through the link (bn, wk, st).
- **The answer comes first and in plain words.** "You'd keep $1,435 more a month in Utah", then
  the two paychecks in one line. The hook came from David: "have a better starting phrase there
  somthing that hooks the user."
- **Blank start.** "can start with the page blank?" Until there are two places and a pay, only the
  answer card shows (`.is-blank`). THE QA LESSON: every automated check then tested an empty
  page, so blank-start tools are swept with a populated address as well.
- **Summary, Chart, Detail.** "different views like basic and complex and graphed." Three toggle
  chips switch `data-view`. Summary is built to be screenshotted, with the source line inside the
  card.
- **No image buttons.** "people will just screneshot it." Both Save buttons, the canvas and the
  drawing code are gone.
- **The chart grid.** "some of the scaling on the chart is messed up." The flex row added gaps and
  padding on top of 100%. A grid takes them out of the bar's width instead, and measured
  overshoot went to 0. Spent segments are hollow and the kept segment is solid, because the
  palette's grays sat too close to the accents. The kept segment carries no label, since white on
  teal measured 3.46:1.
- **Money-moves colours.** The bars were red and green, and green sat under Utah's teal at a
  normal-vision Delta E of 5.0. They are now amber (costs more there) and gray (costs less). Amber
  is the tool's one colour for "worse for you".
- **Links restore the real numbers.** A shared link used to restore the national baseline costs.
  It now localizes costs first and lets the link override them.
- **The footer flows.** "the bottom is locked into place i don't think we want to always be
  showing." The shell no longer pins it.
- **Provenance behind "i" badges.** "things like this should be hidden behind an i Hover." Four
  badges so far.

NUMBERS at first paint: blank, 88 words and 5 inputs on a phone and 96 words at desktop. With a
populated link, 85 and 117.

THE TEN RULES this round produced are written up in docs/HU-TOOL-REVIEW-2026-09-23.md section 1.
They become DESIGN.md Tier 3 when David closes this phase (DECISIONS T1).

## 2026-09-23 · Device Assembly · Round 16, the screen reads out on an upright phone

Under the reading-load phase. At 360 and 430 the wall renders at 0.41 to 0.49 of its drawn size, so the bedside screen's hint (the whole tutorial) was 7px and the outlet labels 3 to 5px. David chose from three mockups at 360 ("B, copy under the wall"; the others were leave it, or the same copy under Complete and Reset). Where the screen is under 150px on the glass, its current page reads out directly under the wall as real text, with 44px tabs that turn the same page the wall's tabs do. One fixed height (the page name and four lines, a long chart note scrolls inside), because the screen turns pages by itself and a growing box moved Complete by up to 166px. The floating toast is quiet there now; the readout carries it. The wall and the readout share the words through `screenHintTag`, `screenNoteText`, `screenOrderLines` and `TEST_IDLE`, so they cannot drift. The wall svg carries `data-drawing`, and the phone gate skips its printed labels and its line and label contrast on that mark alone, printing the count (his "go wild" waiver; the 44px floor still applies). Sideways and desktop unchanged. Clean at all nine viewports. Same evening, David looking at it in the review screen: "the double chart seems unneeded". Where the readout shows, the wall no longer draws the screen at all (its corner is plain wall); turning the phone sideways crosses the 150 px line and puts it back on the wall.

## 2026-09-23 · Device Assembly · Round 17, the patient moves

David: "we do not have to give that much space on the board for his body. after the demo rounds he should not be that high up on the wall, in fact can we make it so his body can move around the wall like anything else? that functionality will matter when we start making complex semi mazes for everything to be pipped through." His calls, each from a short list with a recommendation: the level places him and the sandbox lets you drag him; one row lower after the tutorials, with longer tubing rather than an extension.

What shipped. The patient is wherever his three pieces are: `syncFace` reads the face, nose and neck off the cheek after a build, a move, an undo and a wall off the wire, so the save and the table carry his position with nothing new in either. A level names his spot with `face` (zone columns, like extras); `movePatient` lets the player drag him, the sandbox only, with whatever is seated on his face coming along (`patientGroup`, through the existing group move). The body art is `patientArt(fx, fy)`, drawn by the wall and by the drag ghost alike, cut from a gown and blanket that filled the wall from the chin to the floor, seven columns wide, to shoulders under a short blanket, four columns wide. Level 1 on sit one row lower (`LOWER`), and the cannula on those walls is the Salter Labs 1600-14 with 14 ft of tubing, a catalog part checked 2026-09-23. Level 2 keeps the room's spot, and so does the sandbox: their masks are only sold with 7 ft tubing, measured one foot short a row lower. Pars re-derived from the reference builds shifted with him: Level 1 and timed 13 cells 8 ft, High flow 23 and 10, Trach collar 13 and 8, CPAP 23 and 9, Capnography 12 and 7. The bedside screen's wall arm is left out where it would run into him.

## 2026-09-23 · Reading load · the shared game menus, in the kit

On David's approval of the game review's order ("ok that sounds like a good plan", DECISIONS 15). One set of menu pieces, built once in the kit the way `HUKit.peek` was, and not yet wired into any game because another session was editing all five: `HUKit.dialog` (a native dialog; X, Esc and the phone back gesture close it, only the top card of a stack responds, one shared back guard for the stack), `HUKit.gameMenu` (Resume, Help, Settings, Restart, Leave, Site menu, in that order, plus the toolbar "Menu" button), `HUKit.settings` (toggle rows, remembered, storage failures fall back to defaults; `HUKit.settings.assist` carries More time, Show sounds as text and Hints), `HUKit.howTo` (first visit only, then the "?"), and `HUKit.confirm` (the button names the act; the kit throws on Yes and OK). On a phone a card is a bottom sheet and a card opened over another hides the one beneath; sideways the menu goes two across; desktop centres it. New classes are `.hu-dlg-*` and `.hu-gm-*`, existing tokens only. 28 tests in tests/hu-kit.menu.test.js, a contrast row for the danger verb (dark --red on --surface, 4.77), verify green at 267. The ten rules are in .claude/rules/games.md. Shots: tmp/kit-menu/.

## 2026-09-23 · Reading load · Alarm Fatigue on the shared menus

The first game onto the kit's menu pieces, on the review's order (docs/HU-GAME-REVIEW-2026-09-23.md, section 5) and David's three answers. The bar holds one menu at every width: the "?" and Menu, with Restart, Learn and the site menu as rows inside it (the phone-only popover is gone). The how-to card opens on a first visit with a Clock in button and replaces the "turn your phone sideways" notice, which had been telling sideways phones to turn sideways; its rotate tip now shows on an upright phone only. Settings carries More time (the code clock 30 to 45 s), Show sounds as text (the mixer's names for every sound that carries news, the klaxon named for the emergency on screen) and Hints, plus a Sound mix row to the eleven sliders. Any open card pauses the floor through `live()`/`away()`, stops new tones and parks the audio. The Code Blue reads the room's patient from the nurse brain for the pronoun and the code status: a DNR room gets a rapid response that names it, never a code. Adenosine and atropine left the code drugs. A phone clock rides beside the task count; the first falling sat of a shift says the rule once. Silence kept its word on the phone: the 2026-09-21 rule stands, and the row fits at 360 with it. Proof: tmp/af-kit/ (a Playwright walk at 360, 740x360 and 1280), the phone gate clean at nine viewports, verify 267/267.

## 2026-09-23 · Reading load · Uncharted General: the goal line, the Run bar, Continue

The second game onto the kit, on the review's order (section 3.2 of docs/HU-GAME-REVIEW-2026-09-23.md). The "?" and Menu sit beside the back link (no Settings row: nothing to slow or caption). The goal line beside Run judges the projection with the goal's own test, the same call `runQuarter` makes, so "Short by $308k" is the answer and not an estimate; the safety incidents that roll after the goal check are the one thing it cannot see. Run on a projected miss or a red quarter asks once, "Run it anyway". An upright phone reorders to goal, map, then the side panels, with Run and the goal line pinned to the bottom edge (18% chrome at 360); a sideways phone keeps the old order because a pinned bar would cost ~30% of a 360px screen. A solo run autosaves its save string and the start screen opens on "Continue your run"; a finished run is forgotten when it ends so Continue can never undo a loss. Smaller: Esc leaves the Chart Room, choice effects colored by sign, "Cash after" red below zero, reduced motion honored, the bankruptcy post-mortem names a crisis that took most of the loss. Proof in tmp/ug-kit/; phone gate clean at nine viewports.

## 2026-09-23 · Device Assembly · the review's fixes, the menus, and three RT calls

Under the reading-load phase and the parked feel phase ("go wild" still stands on this surface), on the review's section 3.3 and David's answers. Walls, "?" and Menu in the bar (the "?" yields under 380px); the result card closes on Esc and the back gesture and traps Tab; Reset can be undone; the last wall resumes; tutorials rest on the HINT page; a sideways phone fits the wall to the height. Tutorial 1 starts on the nose. Every step says press Complete. The fault walls are titled by the order. Bubble CPAP is parked (David); Tutorial 3's order is a simple mask at 2 L/min that the player has to catch (David). Level 3's rebuild waits on the dry-gas line, the one piece no source settled. Proof in tmp/da-kit/.

## 2026-09-23 · Device Assembly · Level 3 rebuilt

David said keep rolling without answering the dry-gas line, so the game's own dry side stands and the rest was built: a heated breathing circuit in the part database (its source note is Fisher & Paykel's RT302 kit), the rule that humidified high flow needs the heated circuit, a rain-out line when it is not, the cart, the par. The old Level 3 turned out to be unfinishable whatever the player did. The dry side stays in DECISIONS 16.

## 2026-09-23 · Uncharted Regional · the review's fixes and the menus

Not in the reading-load phase by name, so this round is fixes and the menus contract (binding since DECISIONS 15), with no change to balance or the failure model. The "?" and Menu, the how-to after the first board, every `data-def` through `HUKit.peek`. The goal line beside Run in the goal's own words ("Short by 12 points", "Over the cap by $75k"), "Run it anyway" before a projected miss, each goal type's own loss line. An upright phone pins Run and the goal line (18% chrome at 360). Continue after a reload; a restore no longer re-rolls the goal or the event. Esc on the result and end cards, an "i" beside each shared service, served % colored against the goal. Proof in tmp/regional-kit/; phone gate clean at nine viewports.

## 2026-09-23 · Ballpark · a new game, built to the menus contract

Not a phase: a new surface, built to the games rules from the first line. Its look borrows the site's type and the other games' accents (Outfit display, IBM Plex Mono numbers, HU teal as the one accent, the site gold for chips and odds, teal-ink for the light theme). New, and scoped to #bp: the felt background and the eight player colors, because a table of eight needs eight colors a player can tell apart. The phone answer: one column, the phase's one action pinned under the thumb on an upright phone, the player rail as a sideways strip, the home screen ordered title, then Play, then the three steps. Proof in tmp/bp/ (every phase at 360, 740x360 and 1280) and the real-relay check.

## 2026-09-24 · Reading load · Uncharted General's start screen as tabs

The review's item 4 ("the start screen is a settings form, 46 controls, the CEO choice at the bottom") on the menus doc's Balatro brief. Four tabs (Continue, New run, Scenarios, The Table); New run leads with the CEO carousel and one Start, the four run settings under one `.hu-fold` that reads its choices back when closed. First paint at 360: 48 words in a card 4.2 screens tall became 38 on one screen; a returning player's 57 became 20. Proof in tmp/ug-start/.

## 2026-09-24 · Reading load · Alarm Fatigue's real or nuisance alarms

The approved expansion (DECISIONS 17), so a rules change on this surface by David's yes, not by the phase. One new visual element: a signal bar beside each SpO2 number, in the tile's own warn and ok colors. CHECK is the sat box itself with a small label; a second 44 px button cost 33 px per monitor row on a phone, the label costs 13. On eight monitors at desktop the heart rate and rhythm take their own row, as the phone tile already did. Proof in tmp/af-real/.

## 2026-09-24 · The kit · the how-to opens at its first rule

Found on ER Charge at 740x360: focusing the how-to's action button scrolled the card past rules 1 and 2 in every game. The card's body now starts at the top and the action keeps focus. One line in hu-kit.js.

## 2026-10-03 · Device Assembly expansion · Stage A, dealt walls and the daily wall

The reopened phase (DECISIONS 17, N1 to N3), on David's "go ahead and start device assembly stage A". New on the surface: a Puzzles group at the top of Walls (the daily wall, a random wall, the three days before today); four new things a room can hold (a capped outlet drawn as a crossed-out outlet, a Chemetron oxygen outlet labeled CHEM O2, an oxygen bottle on a cart, a home concentrator with a cord); the twist named in red capitals under the order on the bedside screen and in the phone readout; a compact result card for dealt walls (score, the line against par, the share line, the streak, the six score rows folded under "Score breakdown") so Share is on the first screen of a 360 phone; a par build drawn as the race's ghost. Nothing new in the palette: the red is the readout's existing fail red (#b3261e). Proof: tests/device-assembly-gen.test.js and tests/device-assembly-save.test.js, the phone gate clean at nine sizes on the default wall and on two dealt walls, Playwright shots in tmp/da-stage-a/.

## 2026-10-04 · Device Assembly expansion · A5, the shift

The reopened phase, on David's "go ahead and start the shift". New on the surface: "The shift" in the Puzzles group; a card between walls (the score on one line, the next wall's order and complication under a teal rule, three bonus buttons as full-width choice rows on the existing raised surface and border tokens, 44 px and up, a teal focus ring); a dead white outlet drawn as the white outlet dimmed with the red slash the capped outlet already uses; the end card leads with the score, the share line and the buttons, with the five walls folded under "Each wall" so a 360 phone sees Share without scrolling. The cart's part pictures now carry the wall's `data-drawing` mark (a nebulizer's dial label is art at that size). Nothing new in the palette. Proof: tests/device-assembly-shift.test.js, the phone gate clean at nine sizes on a shift, Playwright runs at 1280x800, 360x740 and 740x360 in tmp/da-shift/.

## 2026-10-04 · Device Assembly expansion · A6, your own walls and the race

The reopened phase, on David's "go ahead and start A6". New on the surface, all as cards over the wall in the game's own tokens: the race portal in Vital Stats' order (three steps, a name, Race bots as the primary, Create a room, a code box); the room card (the code in mono at 34 to 48 px, Copy invite link, a white-backed QR code on a laptop, Show QR code on a phone, Big screen, the room's list, the wall and bots settings as 44 px segmented buttons and a stepper, Start pinned to the card's foot on a phone); a big screen that stacks the code, the QR and the list; the finish card; the race list (place, name, a bot tag, parts and failed tests or a time, a Ghost toggle); the wall maker (six rows of segmented choices with anything that cannot be built greyed out, the order line and its buttons pinned to the card's foot). The bar's status chip shows the race clock and then your place; on a phone it is just the clock, and the Walls button steps aside while any clock shows so the bar keeps one row (this also mended the timed wall at 360). Nothing new in the palette. Proof: the phone gate clean at nine sizes on the wall, an invite link and a made wall; Playwright runs at 1280x800 and 360x740 in tmp/da-a6/; the live relay check.

## 2026-10-04 · Device Assembly expansion · Stage B, a rehab room and someone's home

The reopened phase, on David's "go ahead and start stage B". New on the surface: a wall colour per place (the hospital's blue unchanged; a rehab room's green, #27504f to #183736; a living room's warm brown, #5a4636 to #3a2c21, each with its own dot colour); no rail band in a home; a rehab headwall with empty stretches between its plates; furniture drawn in the part style (a floor lamp with a soft glow, a potted plant, a side table with a glass and the remote, a curtained window, a bookcase with photos); the patient in a plum recliner with a headrest cushion and two arms, in a blue-grey sweater under a terracotta throw, at home only; the bedside screen without its wall arm at home. Nothing changes for a hospital wall. Proof: tests/device-assembly-place.test.js, the phone gate clean at nine sizes on a home and a rehab room, Playwright shots in tmp/da-b/.

## 2026-10-04 · Device Assembly expansion · the new places in the maker and the shift

On David's "go ahead and add the new places to the maker and shift". New on the surface: a first row in the wall maker, The place (Hospital, A rehab room, Someone's home), in the maker's existing segmented buttons; the order and twist rows change with it. The shift's cards carry each place's problems in its own words (a storm coming, the outlet by the chair, the oxygen outlet over the bed). Nothing new in the palette. Proof: the maker and a home shift in Playwright at 1280 and 360 (tmp/da-b2/), the phone gate clean on a home shift and a made rehab wall.

## 2026-10-04 · Device Assembly expansion · Stage C, the first ventilator walls

On David's "lets move onto stage c". New on the surface: a Ventilators group on the wall list; an ICU bed space (the
usual headwall gases, the red outlets on the ventilator's side, the monitor, and the bedside screen on the empty left of
the wall, its arm mounted on its right when it sits on the left edge); art for the ventilator (its screen shows the
FiO2), the endotracheal tube on the patient, the Y, the HME, the filter and the mesh neb; the oxygen hose in the
oxygen tubing's green, thicker. A wall that passes with a rule's note reads "System complete, with a note" and the
note rides the test and the result. Record: docs/HU-DECISIONS-LOG.md, LOG, "STAGE C".

## 2026-10-04 · Device Assembly expansion · Stage C, the rest

On David's "go ahead and build the rest of stage c". New on the surface: art for nineteen parts in the same vocabulary
(the portable ventilator, the trach at the neck, a full face mask with the blue non-vented elbow, the exhalation port
with its slots, the bleed-in with a green barb, the pressure valve, a one-square spacer with its inhaler, the MDI
elbow, the jet neb's cup, the closed suction elbow with its catheter dashed red, the CO2 adapter's yellow line, the
water trap, the flex tube, the bag, battery suction, the conserving cylinder marked PULSE, the humidifier bottle with a
barb each side); a boom outlet at bed height on the suction wall; a living room whose bedside screen sits on the left;
An ICU bed in Puzzles and in the maker; the ICU wall in the hospital's colour. The vent's screen shows its own FiO2 and
the number opens the setting. Record: docs/HU-DECISIONS-LOG.md, LOG, "STAGE C, THE REST".


## 2026-10-04 · The Data Observatory as the back office · OPENED and round 1

David: "the Data Observatory tab is going to be the best place for us to build in website infrastructure... start working on just like a admin menu that eventually we privatize". New on the surface: a row of four tabs inside the Observatory's one top bar (the site's toggle chips, the current one filled; on a phone they take the bar's second row and slide sideways), and three new pages under it. Process: where the last window left off, the open, work and close steps with the blocks each uses as small colored chips, every instrument as a brick with two studs on top colored by who decides (blue the machine fails it, amber the machine measures, teal David decides, green makes or fetches, grey keeps the record), and the push history with the areas each push touched. Site: every live page as a brick on its area's baseplate, green at Phase 2, amber at Phase 1, dashed when unmeasured, with marks for locked, reviewed, changes not pushed and an open design phase; a picked brick opens its detail beside the plates, or under its own plate below 1100px. Traffic: the Goat Tracker unchanged under the shared bar, its h1 now "Site traffic". The one new literal color is the Data map's own validated blue, #3f87e8, used in dark only. Styles: src/assets/css/observatory.css. Proof: verify green (502 tests), tests/admin-hub.test.js, the phone gate on the four tabs and the secret menu, Playwright shots at 1440 and 390 in both themes in tmp/obs-hub/.

## 2026-10-04 · The hub and the Data Observatory · round 2, the hub moves to David's computer

On David's "yes to both, go ahead and build the hub" (DECISIONS HUB1 and HUB2). The Process and Site pages of round 1 left the site before they were pushed; the Data Observatory's tab row is two tabs, Data map and Traffic. The hub is five screens under /__hub in the site's own tokens and tool bar: the board (a focus card ringed in teal with its five stage pills, done ones checked and the current one filled; three lanes under it, Up next, Waiting on you, Inbox; a dashed box per Inbox idea and a form to add one; a QR code for his phone), the run sheet (five stage boxes with the current one ringed and tagged "here", then Open, Work and Close as three columns of checks with a green tick, a red cross or a plain ring, and picture thumbnails under a work step), the QA list (three counts and the machine's line, then items grouped as Back for another look, To look at, With Claude, Good; each with its link, a before and now pair, and two outline buttons that fill green or amber once chosen; his note on an amber wash, the fix on a teal one), Site and Library (round 1's bricks and blocks, unchanged). Round 1's stylesheet split: the site keeps the tab row (src/assets/css/observatory.css), the rest is scripts/hub/hub.css. Nothing new in the palette. Proof: tests/hub.test.js, an end-to-end run at phone size through every save in both themes, the phone gate on the five screens, pictures in tmp/hub/shots/hub/.

## 2026-10-04 to 05 · Device Assembly game feel · REOPENED, the cleanup before the playtest (K1 to K8)

On David's first playtest ("I can never tell what I'm doing wrong or why it's not working") and his yes ("Yes complete
that build in full order"). New on the surface: a miss card that sits low with no dim and names one place; a pulsing red
ring where the gas stops and a dashed one where it has to get to; rings and tags on wrong joints (amber #f2b32b with dark
ink, a darker red #c23b35 with white so the tag text clears contrast, teal for a run that came off, green #3fb27a for a
run that fits) that open their reason on a tap; parts the outlets do not reach at 42% opacity; every connector redrawn
as one plain shape per kind (diamond, square, hexagon, triangle, wide triangle, big and small circle, plug, pentagon),
the outlets' rings replaced by their slots; green and amber halos round the ports a held part fits; a dashed route with
its verdict while tubing is pulled; one walls card and one Help card; a compact phone cart (count on the corner, names
on two lines); zoom buttons stacked over the trash. No new color outside those named, all of which were already the
game's state colors except #c23b35. Proof: verify green, the puzzle checks, `npm run da:qa` (38 walls clean, Tutorial 1
by touch), the phone gate clean at nine sizes, pictures in tmp/hub/shots/device-assembly/05 and 06 and tmp/da-look/k/.

## 2026-10-05 · Device Assembly game feel · the complexity stars come off

David, starting his full QA: the assembly complexity stars on the System functional card, "I don't think we want to
include that all the time so maybe just remove that from in general right now". Gone from every result card; `score()`
still works them out. Proof: the pass card at 390 and 1440 (tmp/da-look/pass-*.png).

## 2026-10-05 · The hub · the QA list folds what is marked good

David: "Can we create like some folders or some sub tabs for different things that have been marked good or just like
make them smaller or collapsible". New on the hub: a row of folder chips over the list (the site's toggle chips, one per
group, each with what is left in it); the Good section one closed fold of one-line rows with a green edge, each opening
to the whole item. The Puzzles sheet folds its good walls the same way. Nothing new in the palette.

## 2026-10-05 · Device Assembly game feel · the cart, the bin and the verbs (his QA note)

David, after his QA: "The device assembly game mechanics now feel really good I think the drag and drop and the way
everything looks and holds together is solid let's take a little closer look at the menuing for the cart all the
devices as well as like the trash bin... there's got to be maybe a better standard or a more approachable model for
these menus". The build-game model, three ways. The cart is a tray: kind tabs (the site's toggle chips, a count each,
an amber dot on the tab holding an adapter a joint waits on) over tiles, two to a row at a desk and one row on a phone;
a tile is the part's picture, its name, its connector shapes and its count in the corner; the mono line naming each
connector standard left the tile for the spec sheet. The bin left the wall: a dashed teal strip, Back to cart, rises
along the foot of the wall only while a part is held from it, and the cart takes a teal ring as the other place to drop
it; the zoom buttons took the corner (the right side on a phone, where the verbs sit left). The verbs' icons carry
their words. Nothing new in the palette. Proof: the phone gate clean at nine sizes, pictures in tmp/da-look/k/tray-*.png
and tmp/hub/shots/device-assembly/07.

## 2026-10-05 · Device Assembly game feel · THE SCREEN (his second note)

David: "the phone view for it does not fit well within the windows or within the borders that we have pretty set".
The cause: the phone checks emulated a whole 390 x 844 screen, and a phone's browser leaves far less (Safari on an
iPhone 15 about 393 x 659 with its bars up, an SE about 375 x 548), so the cart and Complete fell off the bottom. Now a
phone held upright is one screen at 100dvh and nothing scrolls; the wall takes what is left and fits it (323 px on the
iPhone 15 with bars, 212 on the SE, 410 on a Pro Max); Complete and Reset (its icon) sit at the bottom right in the
tray's tab row; the zoom buttons lie flat on the wall's corner; the hint's step moved into its tab. The bedside screen
stays under the wall, his Round 16 pick. Nothing new in the palette. The standard is written into the hu-game-shell
skill. Proof: five real screens fit in `npm run da:qa`, the phone gate clean at nine sizes, tmp/da-look/screen-*.png.

## 2026-10-05 · Device Assembly game feel · Complete gets its own row (his third note)

David: "flipping between the different devices on the phone is not going to be easy because of the way the complete
button overrides it maybe we give the complete and reset button their own row". On an upright phone the bar left the
tray's tab row and became the last row of the screen, under the parts: Complete first and wide, Reset (and Show me and
Cancel when they show) with the word under the icon, like the part's verbs. The tabs got the whole width back (All,
Devices, Tubing and Adapters show at 393). The cost is the wall: 266 px on the iPhone 15 with bars (was 323), 155 on
the SE (was 212); the puzzle sheet now calls a wall under 180 small, play it zoomed, rather than failing it.
Found in the same window and fixed: (1) the fit had a 160 px floor, and at the SE's new size the wall flipped between
fitted and full width forever, so it showed cut off; the floor is gone on an upright phone. (2) Since THE SCREEN the
zoom buttons sat on top of the part's buttons whenever a part was picked, hiding Put back and Undo, at every phone
size; the dock was also measured before Undo was set, so it ran off a small screen. Now the dock keeps the wall's
bottom-left corner and slides into the margin rather than off the screen, the zoom buttons step up where the two would
meet, and beside a small wall they stand in the margin (`placeVerbs`, `.zoom-up`, `.zoom-side`). The puzzle sheet's
real-screen check now picks a part and fails if the two meet. Nothing new in the palette.
Also found by the same window's full QA, through the phone QA's race step (which still drove the old two-wall race
and was rewritten for THE RACE): on a phone, Race and Make a wall in the walls list did nothing, and the walls button
on a result card opened the list and shut it at once, since the walls became one kit card on 2026-10-04. Every card,
the walls list and the spec sheet arm the phone's back gesture with a history entry and step history back when they
close; the step landed after the next card had opened, and that card read it as a back press. `afterBack(fn)` opens
the next one once the step has landed (the walls rows, showLevels from a result card, the panel's Race button). The
phone QA now plays the race the way a player reaches it, from Walls on the phone and the invite link on the laptop.

## 2026-10-05 · Device Assembly game feel · his Puzzles-sheet notes (window d)

David marked 19 walls on the Puzzles sheet (8 good, 11 notes) and sent: "if something's going to be a power outlet I
think we need to have a unique icon for that... both male and female... just seeing circles as connectors isn't always
good". Built: the plug is a plug (blades on a body, the cord below) and the receptacle an outlet's face (slots over the
ground hole); a seated cord end drops its green dot, a cord leaves its device through a boot, a coiled cord shows its plug
on the device, a hanging cord shows it on its end, and a powered device's cart tile shows the plug. From the notes: a wall
part let go off the wall goes back on the cart (l2); the screen stays on Order outside the tutorials (lnrb); the timed
wall's SpO2 chip stacks on a phone so the bar is one row (l1t); the saved card has a footer band and keeps the wall's
shape (l5); an interface on the face turns its lead toward its run, in the plan too, and only where that side has a way
(f5). Found on the way: every vent wall's screen read "undefined L/min"; a puzzle test now holds every wall's screen. No
dealt wall changed (60 compared with the last commit). The ventilator notes (v1 to v3), the headwall space (l3), decoys
(f3) and the picture standard are the beta plan, docs/HU-DEVICE-ASSEMBLY-BETA-1-PLAN-2026-10-05.md.

## 2026-10-05 · Device Assembly · beta session one, built (window e)

David: "yes to all three, go ahead and build the beta plan" (DECISIONS B1 to B3). Built in order, every step tested:
the mechanics (a part dropped on a run goes in at the nearer joint, and at a direct joint the outer side slides out a
square; out again, the joint closes; cords, hoses and sampling lines lie over things; runs cross; Swap for a part's or a
run's twin); the ventilators (oxygen and air; the vent cart with its humidifier on the pole and a build with its ports
underneath; the circuit in its bag, laid in one piece, Ventilator 1 keeping the loose pieces; the dead space rule; the
air hose yellow); the paths (five, four to six walls each, written and made walls mixed; Next walks the path; the bar
says where you are on it); a stored answer for every authored wall, so the puzzle sheet tries every break; the extension
cord, a decoy that works and fails for a named reason. Every vent wall's par was recomputed from its new reference
finish. Dealt walls: the ICU deals changed (on the cart, ICU_V 2); freeing the cords changed a few hospital codes' par
and five codes' deals (two home, three future days or shifts); no daily wall through 2026-10-06 changed; GEN_V was not
bumped, because bumping it re-deals every wall. The level menu is two mockups, cards and a map, for his pick (B4).

## 2026-10-06 · Device Assembly · the front door, and the move to the Fun shelf

On David's picks (DECISIONS B5, B6 and B7: "yes to all three", then "dock and A, go ahead and build both"). The game
opens on a home screen: a first visit leads with Start the training; a visit after leads with today's wall, then your
path with Continue, then every other way to play as tiles (Training, Paths, Random wall in four places, The shift, Race,
Make a wall); Paths is B4's map, kept as a card. The bar's action is Home (was Walls). Links still open what they name.
The game moved to /fun/device-assembly/, marked beta, with a Fun shelf card; the old address forwards; every part has
a plain address and the address follows the wall on screen. A defect found on the way: the daily streak was saved and
never read back. Doors B and C and the walls-card mockups came out. The rounds before this, and the reasoning, are in
the beta plan and the decisions log.

## 2026-10-06 · Pages with views: the switch · opened and built

Opened on DECISIONS L1 (David, on the fracture post: the view buttons "are not really easy to see or are easy to lose
as things scroll"), built on L2 ("dock and A, go ahead and build both") after two mockups, docked at the foot of a
phone or pinned at the top; the pinned one failed the phone check's one-top-bar rule. Shipped to the build: the boxed
switch (.hu-seg) on the fracture post, Laws and Paradoxes, Request Routing, Process Engineering and the home page's tool
groups; the dock (hu-views.js) on the three whose views run long, stepping past three views and carrying the fracture
post's layer buttons; a card at the end of each view handing you to the next; a slide from the side you went; one glow
the first time the switch follows you down. Laws and Paradoxes keeps its desk sidebar, which already worked. The
standard: the hu-view-switch skill and tests/view-switch.test.js. Awaiting his QA.

## 2026-10-07 · Device Assembly · his Puzzles-sheet notes, ventilators first (window b)

David, after marking the whole sheet: the vent QA "is dependent on a larger fix where we have different ventilator types
or different ventilator options with the ports on different sides ... consider every configuration". Built: four vent
cart builds (both ports on one side, both underneath, one each side, one top and one underneath), each flipping, so
eight configurations; every one sets up and passes on the ICU wall, has a setup wall on the puzzle sheet (icu:VB29,
VB72, VB50, VB86, VB0, VB34, VB8, VB66) and is dealt (ICU_V 3); Ventilator 8, the same bed space laid out the other way,
the cart on the patient's left (ICU_LEFT); Ventilators 2, 3 and V3 on the new builds. Cords, hoses and sampling lines
go round parts and still cross other runs (Level 2); a part set down on one re-routes it. Swap on a tap: a twin picked on
the cart and a tapped run swap in place. The sandbox's headwall is loose pieces. The rest of the notes: the screen never
turns pages by itself (a message is a strip at its foot); the shift's bonus pick is gone (Next wall); Levels 1 timed, 3
and 5 stand in rooms of their own; Find the fault 2 runs off an extension cord; Find the fault 6, a non-rebreather at
6 L/min; one finish card for every wall (Next, Share, Build it again, Home; See par build in the breakdown; no raw link
on the card; a dealt place reads "Someone's home · wall QA1"). The hub's Puzzles sheet filters by group (?group=). No
daily wall already dealt changed; the ICU deals did (no daily ICU wall before 2026-10-14).

## 2026-10-08 · Device Assembly · the door's flavor lines go behind the "i"

David's QA note on the beta list (the Fun shelf check): "flavor text shouldn't be something that's always face up".
The door had a sentence under every tile and card, which games.md menu rule 9 already rules out (an item shows its name
and one number). Now each tile and card is its name and, where it has one, its number (Training 5 of 5, your path, the
streak); the sentence is behind a small "i" through HUKit.peek: a mouse hovers, a keyboard focuses, a thumb taps the
"i" and nothing starts. The Random wall card's four places the same. The door went from 76 words to 49.

## 2026-10-08 · Flavor text off phones; the switch sized to its names; the three role doors out

David, on the Tools page's shelf lines ("for the move you are weighing", "practice on real data models"): "there is
still to much Flavor Text like this. over all its fine in web page but should not appear on phones." A tagline beside a
shelf heading is now `.hu-flavor`, dropped at the phone query by hu-global.css: 11 of them on Tools, Learn, Rounds and
the Secret Menu (DESIGN.md, The Two Surfaces, rule 8; tests/flavor-text.test.js). The game door's sentences went behind
the "i" earlier the same night, which reads the same note more strictly for a game menu (games.md rule 9).
Then, on the home page's tool groups: "the main menu and button changes do not look good on web or phone, there are
centering issues and font scaling issues." Measured: on a desk the boxed switch stretched across the column, 13px names
in boxes up to 258px wide; on a phone "Maps & Systems" had 3px on each side. Now `.hu-seg` on a desk is as wide as its
names, every box the width of the longest, names at the body size (15px); on a phone it fills the row with short names
(`.lg`/`.sm`: Careers, Maps, Learn on the home page) and long ones may wrap, centered. The fracture post, Process
Engineering and Request Routing take the same switch.
And, on the search panel: "this feels redundant at this point. maybe we move away from these Three Ways in paths or
archetypes." The three role doors (I work in healthcare, I work with the data, I make the calls) came out of the search
panel and the home page; the pages they pointed to stay. Search opens on Jump in, then New on the site.

## 2026-10-08 · The two maps' menus · A and B built (DECISIONS M1)

Opened and built the same night on David's "yes do A now and B." after the review (docs/HU-MAP-MENUS-REVIEW-2026-10-08.md).
Both maps, the twins rule held. A, the defect fixes: a card at the peek shows its name and its number (the Details and
Display tabs and the kicker step out there); the phone's back gesture closes the hospital map's search, and Esc and back
close the info card every tool shares (the kit now hands a back press to the guard opened last, and any page can ask
`HUKit.backConsumed()`); the hospital map's desk drawer keeps its top padding; tabs and map-label rows are 44px targets;
12px labels are 13px on a phone; each number is said once on a card; the catalog search takes the whole sheet on a phone
with no scroll inside a scroll; List, Share and one locate label on both maps; place names in the same caps. B, the game
menu rules: the metric definition, the rank and the trend explainers behind an "i"; one Color, Size, Pin switch over the
Population Health Map's catalog instead of a Size and a Pin button on all 72 rows; one Add, Only switch over the hospital
map's chips instead of an "only" inside each; one "?" per map ("Reading the map", HUKit.howTo, never opening by itself)
in place of the first-visit coach and the 55-word paragraph; three search examples instead of a sentence repeating the
placeholder; on a short screen Display opens full height. Measured with the review's own driver (tmp/map-menu-after/):
the Display panel on a phone opens on 24 words with metrics showing (it was 48, 30 of them prose, and none); the whole
panel is 289 words (593); a parked state card shows UTAH 79.5 yrs. Held by tests/map-menus.test.js and a two-guard test
in tests/hu-kit.menu.test.js. Not in this pass: one hospital in three row layouts, the school program rows, and part C.

## 2026-10-10 to 11 · The hub · one look per page, and the Ideas tab

Two changes on the hub, both in its open phase. ONE LOOK PER PAGE (ship night, 2026-10-10): the same 14 changed pages sat on
three QA lists (the maps, the view switch, the hub), so a page marked on any list since the last push now counts on every
list the push carries, unless the page changed after the mark, when it reopens as "Changed since your Good of ..."
(`pageMarks` in scripts/hub/qa.js; `touchedPages` returns each page's last change as `when`). The QA tab's switcher shows
every list the push carries, not only the two in focus. David's night went from about 53 marks to 21. THE IDEAS TAB
(2026-10-11, David: "spend a few hours coming up with ideas and adding them all to a page on the hub for us to review...
all rules are off... i will do responses and QA statements for all of them like i do with the games"): /__hub/ideas, a
QA item per idea with its report folded under the pitch (what, why, the evidence with links and check dates, effort and
cost, risks, the first step), pictures and a "Try the mockup" link where a look is involved, and three answers (Yes,
Maybe, No) with a note that keeps a draft; a Yes can send itself to the board's Inbox once. Ideas live in
data-build/ideas.json, answers in data-build/qa/ideas.json. Sections as chips, which scroll sideways in one row on a
phone; a "Start here" shortlist numbered in Claude's order. Mockups are served read-only from tmp/hub/mocks under
/__hub/mocks/ (share cards, a main-menu home, five skins). New in the palette: nothing on the hub itself (the Yes, Maybe
and No fills reuse the QA list's phase colors); the skin mockups propose new colors by design, each flagged on its card.
Proof: tests/hub.test.js (24, including an idea's answers and its one Inbox send), the type check, phone and desk
pictures with no card wider than a 390 px screen.

## 2026-10-11 · The brass instruments look, site-wide · opened and built (DECISIONS BR1 to BR3)

Opened on David's answer to BR1 to BR3: "do a whole site wide refresh and then i will do a page by page review and QA in
the tool. That will serve as our final point/Review on these first batch of pages." The list it ran:
docs/HU-SITE-REFRESH-2026-10-11.md; the guide every page pass followed: docs/HU-BRASS-LOOK-2026-10-11.md.

- THE SHARED LOOK: one section at the end of hu-global.css. Tokens for night and day (brass, keys, faces, glass, depth,
  the four region marks), the recipes as custom properties, and every shared piece restyled on its surface only: the
  top bar (keys, Fun added, brass on the section you are in, a menu key under 1100px), buttons (brass for the main act,
  keys for the rest), chips and the switch (brass when on), the view switch (keys in a recessed track), cards (faces;
  catalog cards framed in brass), the kit's dialogs and menus, fields and stat tiles (glass), the tool and game bars,
  the bottom bar (Tools, Fun, Search, Learn, More), the footer (with the trust pages' links), and pages that glide
  (a cross-fade between pages, off under reduced motion). No glow anywhere except the Secret Beacon.
- HOME: the compass rose in a brass dial (components/compass-rose.njk, generated from the brand rose: no plate, no glow,
  lines 1.6 times, a day twin in the light colors); the earned map now spreads from the dial and keeps clear of the
  words; four section keys with counts; the h1 is "Healthcare doesn't come with a map" and the mission heading a label
  (the writing checker's two "heading that sells" findings).
- FUN: its own page at /fun/ (BR3); the games light Fun in the top bar; the Tools page keeps one line pointing there.
- THE PAGE PASSES (five helpers, one set of files each): the six tools, the two maps and the Atlas, Learn, Rounds and the
  secret menu and the utility pages, the six games' chrome. Play screens, map layers and data colors untouched.
- ALSO: Alarm Fatigue's helpers no longer take a CHECK tap; System Layers and the Career Tree hold one bar row on a
  phone; dated source lines on five tools; the phone gate reads every size in night AND day, exempts a brand mark
  (data-brand) the way it exempts a game drawing, and its line check now honours the zoom-scene rule the other checks
  already did.

Closing: David's page-by-page review on /__review (a Night and a Day mark per page). DESIGN.md's Tier 3 already
describes the look as built.

### 2026-10-11 · The brass look, round 2: David's first review notes

His notes on the main pages (data-build/page-reviews.json); Learn's modules and the tools wait for after today's upgrades.
- THE TOP BAR: no Home key (the logo goes home), no Atlas key (it is on the Tools shelf); seven keys fit from 860px, so
  the menu key now starts under 860 instead of 1100.
- HOME: the example searches under the box are gone; the hero is one centered column at every width, the phone's
  order (dial, heading, line, search, then the four section keys in a row, two by two under 860px).
- FIELDS GO LIGHT IN DAY ("the search bar is not the correct color for the day theme", Learn and Rounds; the secret menu
  "doesn't work for days"): new field and track tokens in hu-global.css (--field-bg, --field-well, --field-ink,
  --field-sub, --field-line, --track-bg, --track-well), glass at night and a white well in day. Every search box, input
  and recessed segment track on the site moved to them; readouts (clocks, scores, the year pill, stat tiles, KPIs) stay
  glass in both modes. The secret menu's list rows ride the same tokens.
- ABOUT: the guest section is a shelf (the shared kicker over a rule, the guest a framed face); a "My card, to share" key
  under LinkedIn opens the new card page, /me/ (a framed face: photo cropped to head and shoulders, name, letters, role,
  one line, LinkedIn in brass, the site, Share, and a QR code to the card; its own link preview, card-me.png).
- FUN: the standfirst under the title is gone.
- ALARM FATIGUE: a burst of presses is one "+N" over the button that adds up and goes about a second after the last
  press (`pressFloat`); the message floats keep their stack and reading time.
- THE CHROME'S TYPE: the top bar and footer set the site font, so the two guest pieces' serif body no longer reaches them.
- READING PAGES: .hu-read no longer paints its own flat background, so the page's top gradient meets the top bar the
  way it does on every other page.
- LEARN (the helper's pass, finished): module headers framed, panels faces, link cards pressable, choices keys with brass
  when on; the amber chart lines take the darker amber in day; the sources search on the field tokens.

### 2026-10-11 · Device Assembly: the daily year, the first month built (DY2)

On David's "yes to the daily walls, start oct 25". Plan: docs/HU-DEVICE-ASSEMBLY-DAILY-PLAN-2026-10-11.md. Section 3d of
src/fun/device-assembly/index.html.
- THE CALENDAR AND THE CLIMB: from wall #23 (Sunday 2026-10-25) `genLevel` hands a day to `yearLevel`; the weekday picks
  the kind (YEAR_KIND), `yearHospital` / `yearPlace` re-deal until the wall's par sits in its band (YEAR_BAND, or the
  twist's own `band`); the first month is YEAR_PLAN; a day past it takes its kind's pool; a day the year cannot deal
  falls back to the old dealer. tests/device-assembly-daily.test.js pins 77 old walls (#1 to #22, random, made, rooms,
  shifts) in tests/device-assembly-pins.json and holds the month.
- MONDAYS: YEAR_ROOMS (the bed in the middle, the split rail; kept out of ROOMS), `deadRoom`, the far bed; `anyO2`
  feeds from the nearest oxygen outlet (`far` the farthest). TUESDAYS: `decoyN`, `decoyPool`, `cartAdd` on a twist;
  `L.noLabels` (cart names hidden until a part's sheet is opened, `seenSheets`); `expiredTwin` (exp- parts, a red line on
  the sheet, a rule in `evaluate`). WEDNESDAYS: `L.orderLines` (the screen's order), SHORTHAND with the long form behind
  an "i" (`L.orderLong`), read the chart, written beats verbal on an ICU bed; THE GOAL, NOT THE DEVICE (`req.goal`,
  `goalFor` reads the order against the interface chosen). THURSDAYS: DECOR sink, sterile field, curtain, placed against
  the solution's path (`barrierBox`, `curtainLine`, a twist's `obstacles` function). FRIDAYS: `makeFault` (one or two of
  the shift's faults on a solved wall), `makeHandoff` (`it.taped`, refused by every move verb, kept in snapshots, drawn
  with `tapeSVG`); a daily fault card counts for the streak (`genFaultFinish`, `dailyStreak`). SATURDAYS: Halloween
  (`halloweenDecor`), `stackTwists`, the bottle across the room (`BOTTLE_FAR`, src `cyl-far`). SUNDAYS: a three-wall
  story (`yearStoryPlan`, Y codes, `plan.len`, `plan.noFault`, YEAR_STORIES), wall one under the day's id, its end
  marking the day done.
- TEACH WALLS: YEAR_TEACH (find the fault: f1; the goal: `teach:goal`), played first the first time (`teachFirst`,
  `teachThen`), then kept under "New on the daily" in the walls list. THE CARD: "Monday · #24", the wall's name.
- Changed from the plan in the build, each written into the plan: Sundays have no parts band; Going home is at home only;
  Nov 14 puts the bottle across the room (a humidified bottle needs a DISS cylinder, now in December).

## 2026-10-11 · The brass look · the day theme, sharper (LT1 and LT2)

His review: day read washed out and hazy on Tools and Rounds; Vital Stats kept dark pieces in day. Measured: white panels
sat 1.12 to 1 on #EEF2F7 and only a 32px shadow at 16% set them off; white keys on white panels; the prose inks were fine.
Three options drawn (A sharper edges, B a deeper ground, C both); he picked C, then asked for other shades of white, and of
five (cool slate, clinical blue, neutral grey, warm paper, bright white) picked COOL SLATE. Applied in hu-global.css: the
day page #E1E7EF (#EDF1F6 at the top and in the browser bar, base.njk), panel edges #B4C0CF, panel feet #F9FBFD, keys
#FFFFFF to #E3E9F1 on a #A7B4C5 floor with a fine inset rim, shadows 2 to 10px (--key-lift, --brass-lift, --panel-lift,
the cards, .rn-card, .tool-bar, .icon-btn), and --depth lighter (.10) so a page's own wide shadow fades instead of
fogging. Every day ink still clears 4.5 on the ground (the lowest: amber words 4.60, teal words 4.66); tests/contrast.test.js
gained three rows. Night unchanged. The same window: Vital Stats' name, room code and answer boxes on the field tokens
(the room chip stays glass, a readout), its cards on the tight shadow; the secret menu's stamps ("Game · Playable · v1")
became a pin beside each name (icon and one word). Pictures: /__hub/mocks/light-theme.html, light-shades.html; the run
sheet. Then his picks LG1 "on a key" and HM1 "three columns" (the columns later gave way to HM2, below): the logo is a key in every bar (.nav-brand, .tb-brand), and
home's groups on a desk are headings over three columns (900px up; 700 to 899 stacked; the phone keeps the switch; panes
off by .is-off, named by their heading on a desk). The sweep caught four Learn modules' day diagram lines at 2.8:1 on the
slate ground (--teal-dk strokes, Request Routing's green branch): their day accent is --dgm-flow (4.0) and --green-dk.

## 2026-10-11 · The brass look · one standard Learn card (LC1)

His review: the Learn cards were cluttered (lens tags at the top, colored map pills at the bottom, "Framework · Mental
Model · Interactive" under them; on a phone the first card was a whole screen). Drawn three ways (now, A dots, B small
words); he picked B. On /learn/: a card is its number and lens words on one line (.ac-head; .ac-tag a small mono word in
the muted ink with a dot in its lens color, --dot), the title and three lines of the description; the whole card is the
link. The map pills left the 16 module cards and the 2 talk cards (every module page carries its own Atlas links), and
so did the footer line and arrow. The guest byline stays as a lens word. Phone gate clean at nine sizes in both themes.

## 2026-10-11 · The brass look · home's three picks and a short footer (HM2)

He did not like the three columns live and asked what a good home page holds: what the site is and one way in, the best
few things (the rest a link away), what is new, who is behind it, a short footer. Of three options he picked A: on a desk,
"Start here" is three picks in one row (src/index.html .hv-picks: the Population Health Map, the Cost of Living
Comparison and Vital Stats, by tools.js id) and an All tools key, and the catalog is the phone's only; the columns came
out. Shared fix found on the way: .hc-desc no longer grows (a clamped description showed a fourth line in a stretched
card); .hc-meta sits at the card's foot. The footer: Field Notes off ("scrap the field notes for now"), Support a top-row
column, a phone footer of the support button, the copyright and the policy links. The sweep caught five more Learn
modules' day diagram lines on --teal-dk; their day accent is --dgm-flow.

## 2026-10-11 · The brass look · the hex grid, the Atlas on the map (HX1, HX2)

He wanted the hex grid kept and made "more dynamic". Three ideas ran live on the real home page (A wakes up, B explore it, C the
sections on the map); he picked C and asked for Atlas items and tile depth, then "atlas zones at 10px, no raised ground". Built
in src/index.html: the honeycomb at rest (an offscreen canvas per size and theme, a ping from the compass on arrival), the seven
Atlas zones as 10 px raised tiles (two lower sides drawn darker, the top face tinted, no glow), routed to the compass with A*
that prices edges under the words and the dial at twelve times; one zone in play at a time (2.2 s turns, a pointer or a keyboard
focus takes over, the tile lifts 6 px and its route runs as a moving dash); .hv-zone links over the tiles open /atlas/#zone, so
a keyboard reaches them with a visible ring. A phone (the shorter side under 700) gets routes arriving in the zone colors. Reduced
motion: all drawn, none moving. The loop pauses off screen and in a hidden tab. The press advances the zone or sends a route; the
Secret Menu tile's cadence is unchanged. The Earned Scenery Rule is retired. Phone gate clean on home.

## 2026-10-11 · The brass look · his full review worked (window i)

On his page-by-page review, every page night and day. Shared: the Share button left read-next.njk (and reading.js);
`.hu-src-fold` folds the sources on eleven Learn modules. Home: the hex world has a pace (AWAKE 30 s, SLOW 10 s, WAKE 14 s;
the dash offset accumulates so slowing never jumps; the loop stops at rest and `kick()` draws single frames); the secret
tile is a raised tile with its route (`drawSecretRoute` under the zones, `drawSecretTile` over them, `smHover` lift, no
shadow glow, placement fully on screen). Day theme: the Observatory band and the Traffic tiles on the field tokens (his
note overrides "readouts dark in both modes" there), the SQL editor and the hospital game's save box as fields; the
review screen's chrome themed. The oxygen module on the shared shell (guest palettes retired, his ruling). The data
sources and process engineering drawings fixed for overflow and the phone. The phase can close on BR4.

## 2026-10-12 · The brass look · the About page, every author the same card (AB2)

His pick A. The site's own story first in the reading column, then one author card per person on the shared reading grid
(components/author-card.njk, data in src/_data/authors.js): a framed face, a brass-ringed photo, mono credentials and role, the
bio's second half behind "More about", credentials as glass tiles, pieces as keys with a brass rule. The guest green retired.
Phone: a small photo beside the name, tags hidden; 6,434 px to 4,747 px at 390.

## 2026-10-12 · The brass look · CLOSED (BR4)

David: "yes close the brass phase", after his page-by-page review of every page in both themes and the window that worked
his notes. DESIGN.md Tier 3 rewritten from what shipped (the cool slate day ground and tight shadows, fields light in day,
readouts glass except a page's header band of numbers, no glow anywhere now that the secret tile is raised, no author
palettes, the home honeycomb with the Atlas zones, quiet reading-page endings, a short home and footer); the colors, elevation
and components sections brought level (the Secret Beacon and the Earned Scenery Rule retired; the Learn card, the author card
and the logo key added). The change budget governs the look again. The block CLAUDE.md carried while the phase was open,
verbatim, for the record:

> **The brass instruments look, site-wide · OPEN 2026-10-11** (DECISIONS BR1 to BR3; David: "ok lets make these
> changes along with any other changes that can be done by the AI. do a whole site wide refresh and then i will do a page
> by page review and QA in the tool"). Surface: THE WHOLE SITE'S LOOK, every page under src/ in both themes. The list, in
> order: docs/HU-SITE-REFRESH-2026-10-11.md. The look: round 3.1 of docs/HU-DESIGN-DIRECTION-2026-10-11.md (mockup
> tmp/hub/mocks/round31.html): raised keys that press (navy at night, white in day), brass for the one main act on a
> screen, the section you are in and the frames; recessed glass for readouts, dark in both modes, and fields (search,
> inputs, segment tracks) on the field tokens, glass at night and light in day (his first review notes, 2026-10-11); in day the
> cool slate ground #E1E7EF under white panels with tight 2 to 10px shadows and a fine rim on every key (LT1, LT2); framed faces
> for panels; NO GLOW; the compass rose in a brass dial on home (the light rose in day, heavier lines when drawn big), on a honeycomb where the
> seven Atlas zones stand as raised tiles routed to it and linking into the Atlas (HX2; a phone gets routes in the zone colors; the secret tile, when the taps call it, stands raised and routed the same way, no glow; the map slows after 20 seconds and rests at 30, a hover or a press wakes it, his review 2026-10-11); Fun
> its own section at /fun/ between Tools and Learn. What the phase does NOT open: any page's words (except meta
> descriptions and the writing checker's findings, item 22 and 23 of the list), the engines, levels and data of the games,
> the maps' layers, zones, routes and nodes, the identity in LOAD-BEARING below. The seven LOCKED pages take the new look
> through the shared pieces only (hu-global.css, rounds.css, the layout) plus the ledger's small fixes; their own styles
> stay. The other Learn and Rounds pages (a parked surface, so no rewrites and no new tooling) may dress their own
> controls and panels in the recipes (keys, faces, glass): a change of surface, never of layout or words. Tier 1 and Tier 2
> bind throughout. Closing =
> David's page-by-page review (day and night marks on /__review), then DESIGN.md Tier 3 describes the new look.

## 2026-10-12 · Device Assembly game feel · phone play (P1, P2)

David played the game on his phone after the a36e2ff push: "I couldn't plug things in or connect things very easily with my
fingers the menu at the bottom felt like it was taking up the screen all the time". Measured at the screens a phone browser
really leaves (375 x 548, 393 x 659): the wall was 28% and 41% of the screen, its squares 11 and 19 px, and a thumb that missed
by 10 to 20 px rebuilt 12 of 112 wall runs. Plan docs/HU-PHONE-PLAY-PLAN-2026-10-12.md, section 7 the result. Shipped to his QA
(board steps 83 to 89, his phone play is step 90): the bottom of an upright phone's screen (one line of order that opens whole,
one slim row of parts with All parts, a picked part's buttons in that row with Done and Move, Undo beside Complete, nothing on
the wall while a part is held; the wall to 56% of an SE and the full width of an iPhone 15); presses and their clicks read at the
exact point (Chrome's touch adjustment had handed them to ports); the game aiming for you on touch (the nearest place a part
fits within 44 px, the nearest port a run can take, a press near an open port starts its run, the held part decides so the
bottom rows are reachable); a tap is a tap (10 px slop, no unplugging on a press, no double-tap Turn or pull-off on touch); the
buzz and its Settings row. The standard behind it is the hu-game-shell skill's "a finger is not a mouse" (twelve rules) and the
Touch section of .claude/rules/games.md; the gate is `npm run da:thumb`. The desk layout and play did not change.

## 2026-10-14 · Daily Huddle, the hex trivia board · OPENED, round 1 at QA (DH1 to DH3)

Opened on David's "Yes this all looks awesome, Lets build its core functions out get me a functional demo and QA list/Review
test list on the hub and we will start the refinement process from there." Surface: src/secret-menu/daily-huddle/ and its bank.
Round 1 (the working demo) is at his QA (board card daily-huddle, step 97): a 19-tile board laid out like the Atlas, six zones of
three around a brass compass, raised tiles on a floor in the Atlas zone colors in both themes, held tiles filled with a brass rim
and brass joints between them, closed tiles as dark glass; the question as a side card on a desk from 1100 px and a dialog over
the board below that; the answer card with the right option in green, the values behind every option, the source and its check
date, and the link into the tool that shows the number. Measured: tiles 72 to 87 px on real phone screens, taps 14 and 22 px
off-centre open the tile aimed at every time, `npm run phone` clean at nine sizes on the start screen, the board and the list.
Plan and build record: docs/HU-HEX-TRIVIA-PLAN-2026-10-14.md, sections 2 and 10.

## 2026-10-14 · Reading load on all three games · Alarm Fatigue's console on a laptop

A defect round, from David's ask to check every tool-shell page with a real mouse wheel ("Do this task here", the follow-up to
that audit). On a full floor (every monitor and pump bought, the core cards waiting) the console ran past the foot of the floor,
which clips, and nothing scrolled: the pumps' Hang buttons sat at y=800 in a 768 px window at 1024x768, at y=904 on the Prophet
skin at 1280x900, and at 1366x768 two of three waiting cards never showed. Built, at his QA with the rest of the phase: where
the pumps ride inside the console (under 1040 px wide or 740 px tall, and Prophet at every size) the console ends 8 px above the
floor and scrolls, as it already did on a phone; from 1040 by 740 up on the other EHRs the waiting cards stand in a 220 px column
beside the button, as tall as its block, and scroll inside it, so the console never grows when a card arrives and the button
stops jumping; the short-window rule ends the console 100 px short of the floor instead of 64 (it left 28 px under the window).
Measured with page.mouse.wheel only, three cards waiting, both skins: every control reachable at 360x740, 740x360, 768x1024,
1024x768, 1280x600, 1280x720, 1280x900, 1366x768, 1440x900 and 1920x1080; `npm run phone` clean at nine sizes. Pictures and the
probe: tmp/wheel-probe/.

## 2026-10-14 · Device Assembly game feel · the daily by thumb (his phone play, step 90)

David played the daily (wall #12, a ventilator setup in the ICU) on his Android phone: "not physically possible, like i
couldn't get it to work. my finger still does not line up with the touch screen ... i also cannot drop down the cart of tools",
and asked for a touch test and a check that every piece is on the cart. Measured with real touches (CDP, three device pixels to
the CSS pixel) at 375 x 548, 393 x 659, 360 x 740 and 430 x 932. The wall's own mapping was right; the aim was not. A hose's end
rides 40 px above the thumb and only ports in reach of the end counted, so a thumb set on the outlet it meant left the hose
loose 12 times in 15; 20 px off, the oxygen hose went into the air outlet one square over. A pull from a tray tile that started
more sideways than up was taken as a tray scroll, so a straight pull from the Vent cart, the circuit or the HME toward the far
side of the wall (34 to 45 degrees) never lifted the part. The daily's cart held four parts and All parts only showed past four,
so the cart could not be opened. The FiO2 dial opened under the foot of the screen with 35 x 36 px buttons. Built, at his QA:
the end of a run and a held part each have two aims, what is drawn above the thumb and the thumb itself, the nearer counting, and
a port the run fits beats a nearer one it does not (`portNear`, `aimLanding`); a place within reach of the thumb counts as on
the wall; the tray's row scrolls itself (`rowSwipe`) so a pull that rises lifts the part from any tile; All parts leads the row
on every cart of two parts or more; the dial scrolls into view once the sheet settles and is 44 px on a phone. The thumb test
(`npm run da:thumb`) was rewritten so it would have caught this: it plays today's daily to Complete, reaches the tray by touch
alone, drags as two players (one watching the part, one putting the thumb on the place), turns, flips and sets parts with the
row's buttons, and lays a circuit from its bag; run against the old page it fails on exactly his two complaints. Every wall's
cart is now held to its answer (357 walls in tests/device-assembly-puzzles.test.js, every one holds; a pill on the hub's Puzzles
sheet). Not changed: on
the daily the circuit lays from only a few cart spots and says "move closer" where the fix is Flip (a level question, its own
session).

## 2026-10-14 · Daily Huddle, the hex trivia board · round 2, the QA reset and your field (DH4, DH5)

David, 2026-10-14: "for this QA i need you to be able to reset it, I also think we should include a prefernce for RT, RN, MD/DO, RX etc. or maybe also like acute, ambulatory". Built, at his QA: ?reset=1 forgets every board the browser has played and the first-visit how-to mark; Practice opens a
card and Make a board gains a row for your field (Any, RT, RN, MD/DO, Pharmacy), remembered, carried in a made link, leaning about a
third of a practice or made board toward that profession (pharmacy about a fifth); today's board never leans. The picked key in a
row of choices now shows (the kit's brass), and a board dealt from a card keeps its address on a phone. `npm run phone` clean at
nine sizes. The record: docs/HU-DECISIONS-LOG.md, LOG.

## 2026-10-14 · Daily Huddle, the hex trivia board · round 3, no miss limit and numbers to pick (DH6, DH7)

David, 2026-10-14: "this is all very hard, I have to google most of these even with multi choice, not sure we should give misses as a max of three because people are garrented to miss some". Built, at his QA: no miss limit on today's, past and practice boards (Make a board keeps 1, 3, 5 and defaults to No
limit); every number tile is four answers sized so a sense of scale finds the right one, the bedside math as near misses; no
keyboard on any tile now. The deal is untouched. The record: docs/HU-DECISIONS-LOG.md, LOG.

## 2026-10-15 · Device Assembly game feel · a circuit that will not lay says the fix that works

David on the daily of 2026-10-14, a ventilator wall: "not physically possible, like i couldn't get it to work". Measured with the
engine at every spot the cart can stand, as dropped and flipped: the cart comes off the cart with its ports on its right, and the
wall's answer stands it right of the bed, flipped. Dropped there as it comes, its ports face the wall, and the circuit bag said
"Move the ventilator closer". The cart stands on 210 spots there and the circuit failed from 166. The message reported
whichever of the bag's sixteen tries ran last. At the 40 spots where a flip alone fixed it, nothing said Flip. 59 gave a reason
and no fix (something in the way, no room for the Y, and a circuit already on for a cart parked with a port on the tube), and 4
said to come closer where nothing closer works. Built as a defect fix, with no rule changed (`circuitMiss`). The bag now tries
the flip from the same spot for real. Then it tries a square each way, as the cart stands and flipped, and names the move that
lays. Failing those it says why: too close, a port blocked by the floor or a fixture, ports facing away, or too far; each is
tested to have a working spot that way. The fix leads. A phone's one-line screen and the desk's alert strip cut a message off
after about 45 letters, so the reason goes second. A bag that will not lay now goes back on the cart and the row shows the
parts again. The failed lay had let go of the hand while the row kept the bag's Turn and Flip, so the Flip a player pressed after
reading the message flipped nothing; now a tap on the ventilator brings up its own Flip. The new test (tests/device-assembly-vent-miss.test.js) plays every spot on the
daily and on a cart with its ports underneath, one with a port each side, and the plain ventilator, and applies each fix. Not built, and on
DECISIONS.md as P3: whether the cart should land facing the patient by itself. No part turns unless it seats a joint, and a cart
seats none, so that is a new rule and his call.

## 2026-10-15 · Daily Huddle, the hex trivia board · round 4, the lifelines (DH8, DH9)

David, 2026-10-15, after asking for "some life lines. or hints, think of other online trivia games": 50:50, Hint and Swap, "Free,
once each". Built, at his QA: three keys under the answers on every question card and one "i" at the end of the row for the
sentences. A badge inside each key first: on a phone its 44 px tap area covered half the key, so a thumb on 50:50 opened the
explanation instead, and the "i" got a 44 px column of its own. 50:50 leaves the right answer and one wrong, the same two for
everyone; Hint is one line from the same data, built into the bank (the 50-state median, how many states are in a compact, the
formula); Swap brings a question from the same zone with the same dots. A used key wears the kit's OFF look and says Used; the
share line counts them, and a clean board says nothing. On a phone the open card gave its Back to the board key to the lifelines
(the X and the back gesture close it), and under 600 px tall the card tightens: every question with its hint fits an iPhone SE's
375x548 with nothing to scroll. The kit's peek now draws inside an open dialog. `npm run phone` clean at nine sizes, `npm run
verify` green. The record: docs/HU-DECISIONS-LOG.md, LOG.

## 2026-10-15 · Daily Huddle, the hex trivia board · round 5, no dots (DH10)

David, 2026-10-15: "at this point not sure we need the dots just tiles will do", then "Time and misses". Built, at his QA: no dot
anywhere a player looks (tiles, the card, the status bar, the rules, the finish); an open tile is its name alone, the compass its
rose; the result is "Crossed in 1:42" and the misses, on the finish card and the share line, and a board with no clock counts up
in the bar. The deal is untouched (730 daily boards the same as git HEAD). `npm run phone` clean at nine sizes. The record:
docs/HU-DECISIONS-LOG.md, LOG.

## 2026-10-15 · Headwall (Device Assembly until 2026-10-15) · the name and the address (HW1)

David, 2026-10-15: "i want to change the name of device assembly to headwall, somthing catchier", then "Name and address".
Built: Headwall wherever a player or a reader sees the name. That means the page title, the game bar, the menu, the race cards, the
share lines ("Headwall #12", "Headwall shift ...") and the saved wall card with its footer address, the Fun shelf card, site search,
the link preview card and the hub's Puzzles and Library. The shelf card opens on what a headwall is, the panel of gas outlets behind
a hospital bed, since the name is a word from the unit and the naming rule asks for what a thing is. The game moved to /fun/headwall/
with its twelve plain addresses. /fun/device-assembly/* and the older /secret-menu/device-assembly/* forward to it with a 301 in
one hop, and a link's ?wall=, ?build= or ?room= rides along (tests/device-assembly-move.test.js reads netlify.toml). Kept on purpose,
so saves and counts carry over: the storage keys, the ids, the play counters' event paths, the og card and thumbnail file names, the
scripts and the test files. The game bar's name is one word now, so it has no teal accent word. The record: docs/HU-DECISIONS-LOG.md, LOG.

## 2026-10-15 · Daily Huddle, the hex trivia board · round 6, onto the Fun shelf

David, 2026-10-15, on his read through the hub: "Move the daily huddle game to fun it should not sit on the secret Menu. Daily
huddle is good now." Built: the game is at /fun/daily-huddle/ (src/fun/daily-huddle/), the fourth card on the Fun shelf, read
from tools.js like the others, marked Beta (Stages 2 and 3 are not built), with its own shelf picture (the board, a question's
picks, the clock; scripts/build-tool-thumbs.js) and share card (scripts/build-share-cards.js; the Fun card now says 4 games).
It is indexed, in the collections and found by site search; Leave goes to Fun; the secret menu no longer lists it. The old
address forwards with a 301, query and all, so made-board links and ?reset=1 still open (netlify.toml,
tests/huddle-move.test.js). The saves never named the address. Same day, his note on the Odd codes tile for Y93.D1 ("not sure
this question is right"): the answer was right; the explanation now says what Y93 codes record and gives each wrong answer its
own code, checked live against the NLM ICD-10-CM tables. `npm run phone` clean at nine sizes on /fun/daily-huddle/, /fun/ and
/secret-menu/; `npm run verify` 672 of 672.

## 2026-10-15 · Headwall game feel · a puzzle keeps quiet, and the screen is the order and the hint

David, 2026-10-15, on his read through the hub: "it should not jump to the hint section or say what the last move is during
the play. the whole point is that its a puzzle game it also feels like we do not need test and note tabs if we are not going to
put anything specificly usefull there." What he saw: every move put a strip on the bedside screen ("Connected: patient nose and
mouth to nasal cannula patient side"), and on a phone that strip replaced the one line under the wall; a joint's message said
whether it was right before Complete did; Complete turned the screen to its Test page; a hint read in the phone's sheet stayed
on the line after the sheet closed. Built: outside the five training walls a move that worked says nothing (`moveToast`, 26
messages: connected, swapped, in line, turned to fit, tubing on, came off, pulled off, back on the cart, undone, the dials and
the rest), and neither does whether a joint is right; a move that did not happen still says why, and acts off the wall (a copy,
a save, the race, a resumed wall) still answer. The screen is two pages, Order and Hint (`pageOf`); Complete leaves it on the
order, and the phone's line is the order unless a training wall's step is the lesson. Test went: before Complete it said "Not
tested yet", after it the miss card, the ring on the wall and the side panel carry the read. Note went: the chart note is the
wall's premise (on the written walls it is the clue, "His secretions are thick now", where the hint is the answer), so it sits
with the order, under it on the phone's sheet and behind a Note tag on the glass where no side panel stands beside the wall
(700 to 999 px; the panel shows it from 1000). Par took the move counts' place at the order's foot, and reads "1 part", not "1
parts", there and on the side panel.

## 2026-10-15 · Headwall expansion · the bag on every artificial airway (BAG1, BAG2)

David, 2026-10-15, before the push: "On any patient with an artificial airway we have to have a bag on the headwall, it can
either be missing and have to be placed on the wall like everything else, or it can already be on the wall and fill in space
that has to be worked around"; asked, "On the wall is enough", and "Hold the push". Built: VENT_RULES.airwayBag, judged last,
so the bag is named once the build is otherwise right (BAG_WHY, on the miss card and, new, as a red line in the system check:
any order rule that failed with every line ticked now gets that line). Level 4, Ventilators 1 and 8: the bag on the cart, the
hint says to put it up. Ventilators 2 to 5 and the ventilator faults: hanging in the top-left corner under the call light,
fixed (beside the build, on Ventilator 2 it threw a 20 px drag off on the smallest phone). Dealt walls, two or more squares
clear of the build: `addBag` after the deal, its own stream (`da-bag-v1|id`), half each way, faults always hanging; `bagShift` hangs one
for a whole shift; `bagUid` gives a hung bag the id a fresh wall gives it, so the puzzle sheet matches answer to wall. From
daily #14; eleven pins re-taken on purpose (tests/device-assembly-pins.json says why). Found on the way and left for its own
session: a Friday fault wall sets every fixed piece down twice (the built wall and the room both place them).

## 2026-10-15 · Headwall expansion · a built wall holds each fixed piece once

Found while hanging the bag into stored answers, and fixed on David's word ("Do this task here"). A wall that arrives as a
whole stored answer (the daily year's Friday fault, `makeFault`, and the hand-off, `makeHandoff`) restored the answer, fixed
pieces and all, and `newState` then set the room's fixed pieces down again: 44 pieces on a 22-piece wall. Now `newState` places
the room's pieces only on a wall that does not already hold them; the written faults build on a bare wall first and are as
they were. Both builders restore the stored answer as it stands, so a bag hung after the deal arrives with the wall, and a
hand-off's bag always hangs (from the cart it would come back up taped). No deal and no pin moved.
tests/device-assembly-once.test.js holds every wall to it.

## 2026-10-16 · Daily Huddle, the hex trivia board · round 7, no time limit (DH11)

David, 2026-10-16: "why is the daily huddle board timed? or if its going to be timed can we make it 5 minutes, or everytime you
answer a question you get time back?", then "No limit, time is the score". Built: today's board and practice start with no
clock (clock 0), so the bar counts up from the first tile and the finish reads "Crossed in 1:42" as before. A team board
keeps its clock pick. Words: the door card, the how-to, the page description, the Fun shelf card, the share card and the hub's
QA row. `npm run phone` clean at nine sizes on /fun/daily-huddle/ and /fun/; `npm run verify` 682 of 682.

## 2026-10-16 · Headwall game feel · the ventilator shows a ventilator waveform

David, 2026-10-16, on his hub QA with a picture of the vent's screen: "Vent should have a vent waveform not an EKG waveform".
The ventilator art (ART.vent, which the vent carts draw too) had a QRS spike on its screen. Now `ventWave` draws two breaths
of the airway pressure trace in volume control: PEEP as the baseline, a quick rise, the ramp to the peak, the drop to the
plateau, the fall back to PEEP and the pause, kept under the FiO2 readout. The patient monitor keeps its EKG. Headwall tests
189 of 189; pictures at a desk and a phone in tmp/hw-quiet/shots. Then, same day: "can you make it a bit more dynamic, like
the ekg". It moves now, the way the monitor's ECG does: `ventY` is one breath's shape, `ventPath` draws two breaths across the
screen, and `monitorLoop` redraws every `.ventTrace` each frame on the monitor's breath (14 a minute, so it keeps time with the
capnogram); a flipped cart draws it mirrored first so it still reads left to right, and reduced motion holds it still
(checked in a browser: two frames 0.9 s apart differ, and with reduced motion they do not).

## 2026-10-16 · Headwall game feel · a thumb on a place takes it, and daily #19 by thumb

Found on 2026-10-15 while checking the resuscitation bag, and picked up on David's word ("Do this task here"): daily wall #19
(2026-10-21, an ICU wall with an inline nebulizer) failed the thumb test's drags at every phone size, with or without its bag.
The test plays today's daily as a gate, so it would have failed on the 21st. Three causes, two in the test and one in the game.
The test laid a circuit bag last, so the nebulizer was dropped before there was a limb, landed on the tube's free end, and the
bag was refused: it now lays the bag where the answer built the Y (`kit.after` in scripts/da-thumb.js). A press 20 px off the
air hose's loose end picked up the cord, whose end is drawn a square away; that is the game being right, and the test's player
now presses again, once, when the wrong run comes up, as it already did when a press picked up nothing. (A first version of
that check read tubing off the tray as the wrong run, because the game hangs it on the port first and runs the link from its
free end; it failed Level 2 in the copy David pushed in d13093f, and is fixed here.) The game: a drag lifts the part 47 to 51
px, about two squares, and the Y's two arms are two squares apart, so a thumb on the inspiratory arm drew the nebulizer onto
the expiratory arm and it went in there, at 375 x 548. Now a thumb resting inside a place the part fits takes that place
(`aimLanding`); anywhere else nothing changed, and the drop box shows the same place the drop takes. Claude's call, on the
grounds that it is how David says he plays ("my finger still does not line up", 2026-10-14) and that it broke nothing: tried
first on a patched copy of the built site, every gated drag row passed on nine walls at six sizes. Pictures of the two rules
at 375 x 548: tmp/hw-quiet/shots/arm-A-held.png (before) and arm-B-held.png (now). Gates: `npm run da:thumb` with #19 added,
152 of 152 gated runs; `npm run da:qa` 79 of 79; `npm run verify` 685 of 685; `npm run phone -- /fun/headwall/` clean.

## 2026-10-16 · Headwall game feel · a tap beside a run's end, then beside the far port

From the original session's list ("clear out all the outstanding tasks"): on 2026-10-12 the thumb test's ungated "tap 20px"
row passed 12 of 28 (t1, t2 and Ventilator 2 at four phones); since 2026-10-14 Tutorial 2 missed at every size, the cannula
tubing left loose. The cause: a tap beside a run's end (on bare wall, within reach) starts the run through `openPortNear`, and
does two things to swallow that tap's own click: it hushes clicks for 300 ms and arms the run (`byNear`, `armed`). The click
landed in the hush and returned before the line that disarms, so the armed run ate the NEXT tap, the one beside the barb. A
tap dead on the barb still worked (an exact port is read first), which is why only taps that missed both times failed. Now a
hushed click disarms a run started beside its port. Today's daily still misses in that row, for another reason: its answer
lays the cannula's 7 ft in exactly 7 squares, and a concentrator set down on open wall goes where the thumb is, so 20 px (about a
square at these sizes) left it a foot short; the wall says so. Gates: `npm run da:thumb` 152 of 152 gated, tap 20px 12 of 28;
`npm run da:qa` 79 of 79; `npm run verify` 686 of 686; `npm run phone -- /fun/headwall/` clean.

## 2026-10-16 · Daily Huddle, the hex trivia board · round 8, the polish pass before David's QA

David, 2026-10-16: "before i do the Qa on those review, do a full QA check finger check, writing etc and visuals so that i
am just looking at the most recent polish". A thumb play-through (tmp/hw-quiet/hdthumb.js) played today's board at the four
screens a phone browser really leaves (375 x 548, 393 x 659, 360 x 640, 430 x 746), a desk and the day theme: a top tile, a
right answer, a miss on purpose, 50:50 and Hint, a full crossing, then Practice, Make a board and Past boards, with every card
measured for scrolling and every key for 44 px. Found and fixed: on the SE the start screen ran 10 px past the screen (Make a
board, Practice and Past boards under the fold), the answer card scrolled inside itself with Back to the board under the fold
on a long answer, and the finish ran past the screen; on the small Android the finish ran past it. Now the short-phone block
tightens the start screen and the cards, Back to the board is pinned to the foot of the card on a phone, and the share line
sets at the phone label size. On a desk the tile names met the hex borders: a name is measured once drawn (and again when the
web font lands) and shrinks to 52 of the hex's 71 units, never under 13 px on screen, so a phone keeps its size; two short
words ("Odd codes", "Health IT") take two lines. Clean after: the play-through at all six, `npm run phone` at nine sizes, 37
Huddle tests; the writing checker on every word the play-through saw: no must-fix.

## 2026-10-16 · the polish pass before David's page review (several surfaces)

David, 2026-10-16: "before i do the Qa on those review, do a full QA check finger check, writing etc and visuals so that i
am just looking at the most recent polish". Three reviewers photographed the hubs, the games and every Learn page at a phone
and a desk, night and day (tmp/visual-pass/hubs, learn1, learn2); seven fixers confirmed each finding by eye before changing
anything and fixed the defects only. By surface:
- Reading load on all three games. Alarm Fatigue: the Clock in panel sits under room 4's box instead of across its Labs and
  Meds line (`placeStage`); the phone plate behind it only while the panel scrolls; the day chart readable (the dimmed chart at
  .92 in day, 4.5 to 5.4:1, was 2.3 to 2.5); the banner names room 4's own patient (`openChartOf`); the Prophet banner on the
  night teal in both themes, white on it 4.9:1 (the gold name is white now). Uncharted General: the five stat tiles share one
  grid on an upright phone; the footer shadow shows only while something runs under it; debt reads $0.
- The hub and the Data Observatory. Data map: stat labels whole, box labels measured and trimmed inside their box, the map packs
  to the pane at 1280, the totals line breaks only between its pieces. Traffic: the last chart date ends at the edge; the
  Alarm Fatigue card shows the game's events again (GoatCounter reads include_paths as one comma list).
- Pages with views: the switch. Process Engineering's desk switch was stretched and wrapped by its own 17 px serif names; it
  now sits at the shared size, as wide as its names, like the other three.
- Not in a phase, fixed as defects under the change budget: Uncharted Regional (the same stat grid, the How the region works
  toggle, the term buttons in one row, the objective card no longer stretched); the home page's New on the site rows on one
  grid; the footer and every tool's attribution strip draw their dots between items, never at a line's end; SQL Mystery's
  Schema label and Intern chip; About's Support button gap; the scrollbar corner. Learn (parked, defects only): Laws and
  Paradoxes has a phone drawing for every chart (19), labels at 12.7 px or more at 360, phase labels from 1.8:1 to 6:1, and
  five label collisions fixed; Process Engineering's improvement loop labels inside their boxes; 4Ps, Patient Data Record, EHR
  Architecture, The Payer, Change Healthcare, Data Sources, Oxygen and the dev blog each lost their reported faults (a figure
  under the type floor, labels past their boxes, three small reds under 4.5:1 now on `--red-dk`, a broken column); an italic
  word in a heading no longer swallows the space after it; a phone eyebrow that wraps leaves no dot hanging, one that fits
  stays one line. hu-global.css is now ?v=20261016a, since the footer's markup and its CSS changed together.
Left for David, look decisions held until his review: Headwall's slim parts row cuts long names; the path crumb reads
"Ventilators 3" where the panel says "Ventilator 2"; Make a board's clock still defaults to 3 minutes after DH11; a phone table
as cards on 4Ps (the site has no shared pattern; the fracture post has a page one).

## 2026-10-18 · Daily Huddle, the hex trivia board · round 9, Keep playing, a bigger bank, today's puzzles
David, after his phone QA of both dailies ("I have tested both on phone and they are working well"): "a continuation button on
daily huddle after they make a line incase they want to play the whole board"; "I kept getting ones I have seen ... expand the
list a large amount and build a process to add to that list as we incorporate new data to the site"; "a page on fun that has a
link of all the daily puzzles of today, like the NYT app".
- KEEP PLAYING. A finished board with tiles left offers Keep playing on its result. The board plays on in a phase of its own
  (`extra`): the clock stays where the board ended, no lifelines, and the result never moves (`G.x` keeps the counts at the
  end; `missCount`, `tilesLeft`, `ended`). The finish adds "Whole board: N of 19 right", and the share line adds "N of 19
  right" after the result. On a phone the status bar carries the way back, See the result. Reopening a board played on goes to
  its result. tests/huddle.test.js.
- THE BANK GROWS IN VERSIONS. A question added later carries `b`, the version it joined; a board deals only from its own
  version: dated boards from `BANK_DAYS` (version 2 from 2026-10-20, board #7), made codes from their `-b2` ending, practice
  from the whole bank. New questions go at the end of the bank, so old deals draw the same. The six boards already dealt live
  (Oct 14 to 19) and two old made codes are pinned in tests/huddle-pins.json.
- THE BANK, 2,764 questions in 1,008 kinds (was 1,057 in 323), every zone at 150 or more and 40 kinds or more (Health
  Tech 188, was 16). Ten feeds in scripts/huddle/feeds/ read the site's own data files (the map's state and county
  measures, the license compacts, taxes and living costs, credentials and pass rates, hospital cost reports, schools, state
  pay, bedside math, the Vendor Directory), each taking its source and check date from its file; `npm run huddle:report`.
  The spot checks dropped two impossible cost-report rows (Hennepin's 5,152 residents on 347 beds), cut build notes out of
  the source lines, and called Louisiana's parishes parishes. VENDOR FACTS WERE NEVER SOURCED, so 504 were checked live
  (scripts/data/vendor-checks.json): 426 agreed, and a vendor question is made only from a checked fact, with its source.
  The ones that disagreed are errors on the live Vendor Directory page, proposed as their own task.
- THE VERSION RULE (`versionBank`): a question keeps its version and place once its version has dealt a daily; one no
  source makes any more stays frozen as `gone`; new data opens a new version three days out (`--from=`). A version whose
  first day has not come is open and changes freely. The page reads each version's first day from the bank.
- TILE NAMES FIT AND SPREAD. A practice board's picture showed the new "Headquarters" running out of its hex (a phone keeps
  the type floor, so a label never shrinks there) and three of them on one board. Five names became two short words (Home
  base, Health orgs, Exam boards, Who accredits, Household size), measured in the board's font against "Workforce" (68.5
  units, the widest single word that fits); a test holds every name to it. From version 2 a deal also prefers a family the
  board does not hold yet, as a wedge always has: repeats fell from 1.83 to 0.85 a board and none shows three times.
- TODAY'S PUZZLES at /fun/today/: the Fun shelf's own card for each daily (Headwall's wall, Daily Huddle's board), today's
  number and where you stand on it from what each game saves (Not played yet, In progress, Solved with a streak, Crossed in
  m:ss), and a brass button that opens today's puzzle itself. The Fun shelf's hero links to it. The shelf card's styles moved
  to components/fun-shelf-style.njk so both pages draw the same card. tests/fun-today.test.js.
- THE SHELF (same day, David: "can we make that button a bit bigger or give it its own shelf"): the Fun page's hero button
  became a Today's puzzles shelf of compact cards (no picture; two across on a phone) above an All the games shelf, labeled
  in the Tools page's layout with the shared kicker. Cards and script are shared with /fun/today/: src/_data/dailies.js,
  components/fun-today.njk (dailyCard), assets/js/fun-today.js.

## 2026-10-18 · The hub · Puzzles marks save again, and finished work folds away
David: "the QA and puzzles zones on the Hub page seem to not be working correctly ... it feels like stuff we have discussed is
still front and center and not being put away or pushed into like an archive folder."
- The Puzzles sheet kept its marks under the card that started it (device-assembly); that card shipped and left the board, so
  every mark failed with "No card device-assembly". The sheet's marks now go straight to their own file (`qaLib.SHEET`, the
  same file, so his 48 marks carry over); no card is looked up. A Good can carry a remark (his "it looks fine, its not complex
  but thats ok" had nowhere to go but Needs a tweak): type it, press Good.
- What is finished folds away by itself, read from the files: a David QA step on a card whose list is clear counts as done
  and leaves Waiting on you (`qaDone`); a card that passed QA shows Ship on its track; done steps fold under "N steps done";
  the Inbox shows its newest five; the QA tab opens on a list with something left and folds clear lists into Finished lists;
  the Puzzles sheet leads with groups that have walls left and folds finished groups; answered ideas fold under each section.
  One fold look, the Good fold's (`fold`, `.hub-good`; `.hub-shut` is the Up next fold's look).

## 2026-10-18 · Headwall expansion · a daily wall is never a training wall
David's note on the Puzzles sheet, daily #23 (Sunday 2026-10-25, Respiratory Care Week): "it looks fine, its not complex but
thats ok, but we still want some level of challenge in the daily puzzle compared to the training walls." Measured over the
year: Monday to Saturday every daily wall carries a twist, but a Sunday story's first wall takes no complication, and four
of the year's stories opened on a plain cannula (Tutorial 1 to 3 again). `yearStoryPlan` now starts a hospital or rehab
story that opens on a plain cannula one step in, still three walls (`shiftPlan`'s `from`): Respiratory Care Week runs
humidified oxygen, a non-rebreather, then heated high flow; the rehab cough Sundays start on humidified oxygen. Home stories
keep their cannula (the concentrator and its outlet are the wall), random shifts start at the top as before, and walls #1 to
#22 are untouched (the pins hold). Re-dealt: Sundays Oct 25, Nov 22, Nov 29, Dec 13 and later Sundays with those stories.
tests/device-assembly-daily.test.js holds it. The hub's command line sends a puzzle wall back without a board card too.

## 2026-10-18 · Daily Huddle, the hex trivia board · round 10, the center tile is the Wild card
David's QA note on Keep playing: "in general i think we need to fix the compass in the center, i do not think people will
understand that." The center tile was solid brass with a small compass needle and no words, the one tile on the board that
did not say what it was. Two options were mocked on board #5 at phone and desk (tmp/compass/): an ordinary tile with its
category name inside a brass ring, or the solid brass tile labeled Wild card. Claude recommended the ring, since a wild card
counts as anything in most games and this tile does not; David picked the Wild card ("the center stays solid brass and says
Wild card, with the category shown once it's opened"). The tile reads Wild card on two lines like any two-word tile; the
question card's title, the side card's kicker and the list after the board read "Wild card: <category>"; the screen reader
label is "Wild card, <zone>, <state>". The deal is untouched (the center still holds the zone out of the ring), so every
board already played replays as it was. The compass needle drawing and its .hd-ink rule are gone; a held center tile's
check mark takes the brass ink. The share line still marks a held center tile in yellow.

## 2026-10-18 · Headwall game feel · a run from a barb ends on hung tubing's loose end

`npm run da:qa`'s quick pass failed on today's daily, #16 (day:2026-10-18), at the SE, the iPhone 15, the small Android and
the tall Android, in the drag where the player watches the end above the thumb and misses by 20 px. The Pro Max passed: its
squares are bigger. The 7 ft oxygen tubing never joined the coupler's barb to the portable cylinder's outlet. The two barbs
face the same way a square apart (27 px at 393 x 659), and tubing picked on the cart hangs on the nearer one when it is
pressed: 20 px off the coupler's barb was 19 px from the cylinder's outlet, so the tubing went on the cylinder. The test's
player saw the run start from the wrong end, let it go, pressed the coupler's barb again and pulled to the cylinder. Its
outlet had the tubing on it, so the end found the loose end, and the wall refused it ("That is a loose end. Pick it up and
run it to a port"). A phone player could do exactly that today. The engine already joined a port to a loose end
(`connectPorts` turns the pair round); the refusal was the page's, and the loose end was never offered as a target. Now a
run from an open port, with no tubing of its own, ends on hung tubing's loose end: the loose end rings as a target the way
an open port does, the aim weighs it like one (`portNear`; it fits when it seats on the port the run came from), and its
free end goes onto the port the run started from (`looseTakes`, `finishLink`). A lead's own tubing, a loose end and a run
pulled off a port still refuse it: each brings tubing of its own, and two ends of tubing need a coupler. Claude's call; the
test is unchanged. tests/device-assembly-phone.test.js holds it. Gates: `npm run da:thumb` 136 of 136 gated runs and 60 of
60 checks at six sizes; its ungated 20 px rows still miss on Tutorials 3 to 5 and Level 2, the same walls they missed with the
fix taken out (tried at the SE on a copy of the built page), and the thumb-on-the-place row now rebuilds today's daily;
`npm run da:qa` 79 of 79 walls, 305 breaks located, 5 of 5 screens; tests/device-assembly-*.test.js 192 of 192.

## 2026-10-19 · Daily Huddle, the hex trivia board · the normals checked, and a bank that is never cached
From the 1.0 analysis, on David's yes. His QA check dh-normals read "The normals are drafts for your check as an RRT... mark any
range you would change", and he marked it Good with no changes on 2026-10-18, so under DH2 the sixteen normals are checked: their
draft flags are gone from scripts/data/huddle-curated.json, and the answer card no longer prints "A draft value, still being
checked before launch." The rebuilt bank differs only in those flags (2,771 questions, same order, version 2 still first deals
Oct 20). tests/huddle-questions.test.js now names the sixteen he checked and holds any normal added later to draft until he checks
it. The bank fetch takes cache:'no-cache', as Vital Stats' does: /assets/data caches for an hour plus seven days of
stale-while-revalidate, so a returning player's first board on a new version's first day could have dealt from the old bank.

## 2026-10-19 · the phone gate reads every view; what it found (Laws and Paradoxes, Request Routing)

The gate (`npm run phone`) had only ever read the view a page shows as it loads, so the nine Laws and Paradoxes charts at
7 px found by eye on 2026-10-16 had all passed it. It now shows each view hidden at load and reads it with the same checks
(scripts/lib/view-walk.js), at the phone sizes, the first phone size in day and 1280; tests/view-walk.test.js holds it, and
tests/view-switch.test.js holds every page of views to a switch the walk can find (Laws and Paradoxes' plain buttons carry
`data-views`). David held 1.0 for what it found. Fixed as defects on the parked reading surface: Laws and Paradoxes' chart
lines, box edges, connectors and arrowheads move from the border colour (1.4:1) to `--dgm-line`, the token hu-global.css made
for diagram structure, and the "1 hr" label on the day teal takes clinical white (4.6:1); Request Routing's flowchart gets a
phone drawing beside the wide one (320 units, no label under 13.6 px at 360, two-line labels where needed), its pocket card
wraps on a phone, and its arrowheads take their lines' colour. Three false positives in the gate's spill check went with it:
an inline word's font room under a big title, a figure set wider than its column on purpose, and a hidden panel's empty box.

## 2026-10-20 · Phase 1 cleared for 1.0 (several surfaces)

David, 2026-10-19, on the page ledger's Phase 1 list: "can we get all of those phase 1 issues resolved before we push 1.0?"
After the night's push, helpers worked the list; 64 of 65 pages reached Phase 2. The reading layout: the Learn header band, its
glow and its aside became shared classes in hu-global.css (`.hu-read-band`, `--glow`, `.hu-read-hero-inner--aside`) with a flush
pressable card (`.rn-card--flush`); 34 more pages moved onto the shared shell, and the drift counter learned digit prefixes (22
declarations it had read as zero). Games (the "Reading load on all three games" phase, and maintenance on the others): the engine
contract on Alarm Fatigue, ER Charge, Daily Huddle, Vital Stats and Uncharted Regional, with nothing a player sees changed; Alarm
Fatigue's phone layout docks the cards that come to you above the button so nothing covers the monitors or the button in the late
game, and decorative layers no longer take taps. The play check runs in `npm run qa`. Camp Nauvoo is left for his call (CN1).
