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
