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
