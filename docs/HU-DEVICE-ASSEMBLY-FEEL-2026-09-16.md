# Device Assembly · the feel phase
### Opened 2026-09-16 on David's ruling: "first we need to polish the game feel." Reference: NandGame.
### This is the phase record. CLAUDE.md OPEN PHASES names the surface; DESIGN.md Tier 3 gets rewritten from what ships here.

---

## 0 · The brief, in David's words

The core concept works. The tactile experience and the visuals "kinda suck." NandGame (nandgame.com) has smoother drag and drop; its visuals are not perfect, but "the connection of things and the mapping of work is cleanly understood."

So two targets: the hand (how dragging, connecting and testing feel) and the eye (can you see at a glance what is joined to what). The hand comes first.

---

## 1 · What NandGame actually does (read from its DOM, CSS and bundle, 2026-09-16)

It is worth being precise, because the lesson is not "add animation." NandGame has almost no motion.

| Mechanic | NandGame | Device Assembly today |
|---|---|---|
| Moving a part | The node itself moves with the cursor (absolute `top`/`left` on a div), drops exactly where released, no grid. While dragging, the node gets `pointer-events: none` and a higher z-index so targets under it still receive events | A separate ghost follows the cursor, then JUMPS to the snapped cell whenever it is over the wall. The original stays fully drawn. The whole SVG wall is rebuilt on every mouse move |
| Placement grid | None. Free placement | 14 by 14 grid. Load-bearing: routing, jumpers and par all depend on it. Stays |
| Starting a wire | Drag from a connector. Every valid target gets a green dashed outline animated with `steps(4)` at 0.34 s (marching ants). Hovering a target thickens its outline to 8 px. The drop target goes green at 4 px on drag-over | Press and pull, or click then click. Candidate ports pulse in opacity; hovering previews green, amber or red. The pulse restarts every time the wall rebuilds, so it stutters exactly while aiming |
| Connectors | 20 px white circles, 2 px black stroke, the pin label in bold inside the circle, a 28 px outline ring around it as the hit and highlight area | 11 to 14 px dots on the part's edge, a tiny gauge chip beside them, 44 px invisible hit circles |
| Parts | White card (`.node-box`, min 80 by 48) with a hard 3 px shadow; inputs on top, outputs on the bottom, always | Hand-drawn SVG art with no backing, ports on any side depending on rotation |
| Wires | 6 px black lines on a pointer-events-none overlay layer; value dots at joints | 6 to 10 px colored tubing with an ink outline, colored joint nodes, gauge chips |
| Feedback | Value badges (0/1) on wires; an error message floats top-right of a node | Toasts at the top of the wall, a coach line, the test read in the right panel |
| Motion | One keyframe (the marching ants). Bootstrap's 150 ms `ease-in-out` on form controls. Nothing else | Seven durations, five easings, all keyframes on the frequent elements |

The read: NandGame feels smooth because nothing between the hand and the object is in the way. Ours has a ghost, a snap jump and a full rebuild between them. Fix those three and the drag feels like NandGame without copying its look.

---

## 2 · The audit that preceded this brief (vetted, file:line in src/secret-menu/device-assembly/index.html)

| # | Severity | Finding | Fix |
|---|---|---|---|
| 1 | HIGH | Full SVG rebuild on every pointer move while holding or dragging (2005, 1928, 1604). Restarts the candidate pulse and the flow dashes | Update only the preview rect on move; keep the pulse elements stable |
| 2 | HIGH | Toasts, the most frequent feedback, run a 3.6 s keyframe with `ease`; the entrance alone is ~290 ms and cannot be interrupted (96, 99, 1610) | Transition-based: 150 ms in, timed fade out, oldest fades |
| 3 | HIGH | Corner verbs (30 px, 40 px on phones) sit on the part's corners where the lead ring is; a click aimed at the ring hits the spec button (86 to 90, 270, 1793) | Verb bar top-right OUTSIDE the part; 44 px on phones |
| 4 | MEDIUM | Ghost positioned with `left`/`top` and snaps to the cell with no easing (1923 to 1927, 100) | Ghost follows the cursor 1:1 via transform; the drop rect is the snap indicator; original dims while moving |
| 5 | MEDIUM | Overlay and modal hard-cut in (165 to 167, 2159) | 200 ms ease-out enter, modal scale .97 to 1 |
| 6 | MEDIUM | Test flow dashes stop dead at 4.2 s (1659) | Gas travels outlet to patient, marches, then fades |
| 7 | MEDIUM | No press feedback anywhere (70, 41, 76, 175) | `:active` scale .97, 120 ms |
| 8 | LOW | Reduced motion removes the toast fade entirely (273 to 276) | Keep a 150 ms opacity fade |
| 9 | LOW | No motion tokens (66, 96, 148, 213, 232, 241) | `--da-ease`, `--da-fast`, `--da-move` on `.da` |

---

## 3 · Build list for the phase

ROUND 1 SHIPPED 2026-09-16, all seven items below, verified in the pane: the drop rect is the same DOM element across pointer moves with the wall's child count unchanged (no rebuild); a synthetic drag creates the ghost with the lift class and a translate3d transform, and the drop lands the part with the settle class; the verb bar sits clear of the part on desktop and phone with 44 px buttons at 375 px; the joint ring fires on a green connection; the modal reads opacity 0 and scale .97 at 60 ms and lands by 400 ms; the flow reveal arms a 450 ms dashoffset transition with a 140 ms depth delay, switches to marching at about 670 ms and fades out 3.6 s later. Engine tests 35 of 35. One pre-existing defect found and fixed on the way: hidden verb buttons still painted, so a fixed part showed rotate and delete.

TRAP for the next verifier: the browser pane throttles timers to one-second ticks when the tab is not the fronted one (document.hidden stays true), so timed phases measure late and the fade and clear collapse into one tick. Measure with a MutationObserver inside the page, and read the timings, not the screenshots.

Round 1, the hand (this session):

1. Preview layer: the drop rect is a persistent element updated in place; no rebuild on move.
2. Drag: ghost follows the pointer 1:1 with `translate3d`, lifts to 1.04 on pickup; the original part dims to 35% while it is being moved; the drop rect shows the landing cell.
3. Verbs: one bar, top-right outside the part, 44 px targets on phones, 36 px on desktop.
4. Toasts on transitions with the site curve; oldest fades; reduced motion keeps opacity.
5. Overlay entrance; press feedback on every button; the three tokens.
6. Test: gas-travel reveal along the evaluated path, then marching, then a 400 ms fade.
7. Settle on placement (scale .96 to 1) and a one-shot ring on a joint that turns green.

ROUND 1 ADDENDUM SHIPPED 2026-09-17: THE ASSEMBLY RULE AND ROPED SELECTION. David's read on the drag: "the icons are still a bit too sticky ... when I drag one item like the flow meter, the nipple adapter should move with it ... like folder selection on a computer desktop." What shipped:

- Parts that are physically mated move as one. A green adjacency joint or a jumper holds; an amber joint (adapter still missing) or a red one does not; fixed wall outlets never come along, so a flowmeter pulled off its outlet takes its adapter and leaves the wall. Engine: `clusterOf`, `moveGroupCheck`, `moveGroup` (all or nothing; tubing between two moved parts slides with them when its old path still fits, every other run touching the group re-routes or comes off). The ghost draws the whole group at its offsets, every member dims on the wall, and the drop preview shows one rect per part. A cluster drag ends with the dragged part selected and a "Moved together" toast; rotation mid-drag is refused for a group.
- Roped selection, the desktop rule. Press on empty wall and pull: a dashed marquee selects every part it touches. Shift-click adds or removes one. With two or more selected, the verb bar rides the group's box and offers only the way back to the cart; Delete and the trash send them all back; Esc clears; the coach line says what is selected. Dragging any member moves the set and keeps it selected.
- Five engine tests in tests/device-assembly-group.test.js: the cluster from either end, the outlet excluded, a group move keeping its joint green, a blocked move refused whole, a red joint left behind, and a run to a part left behind re-routing. Verified in the pane with synthetic pointer events end to end. 40 tests pass.

TRAP for the pane: synthetic `keydown` and `contextmenu` events hang the javascript tool (45 s timeout). Drive the game through click and pointer events on its own buttons.

ROUND 2, PART 1 SHIPPED 2026-09-17: THE CONNECTOR GLYPHS. David's brief: "something better than just the text name of the connector, either specific icons or symbols that people can learn or already established standards." What shipped is a symbol per standard, drawn in a 24-unit box that points in the mating direction, with three channels a therapist already knows:

| Channel | Rule | Source |
|---|---|---|
| Shape | The connector's own silhouette: ISO cone and socket (22 wider than 15), the barbed nipple (the Christmas tree), the DISS hex nut and threaded nipple, the Ohio diamond for Ohmeda quick-connects, the round pinned face for Chemetron, the two-blade plug and receptacle, the Luer tip and hub | ISO 5356-1, CGA V-5, ISO 80369-7, NEMA 5-15, the manufacturers' own shapes |
| Fill | Solid is male, hollow (dark cut) is female | The game's existing legend |
| Color | Green oxygen, yellow medical air, white vacuum, the same colors as the rail outlets; gray for breathing-circuit cones that carry no gas; slate for power; CO2 gray for the sampling line | NFPA 99 gas color code |

Where the glyphs appear: on every port on the wall (the text gauge chips are gone), on each cart row beside the part name, on every connection row of the spec sheet, and in a Connectors legend in the level panel that names each standard once. Text stays in the tooltip and the spec sheet, never on the wall. Symbols live in one hidden `<svg id="daDefs">` and are placed with `<use>`; the glyph box is 28 wall units or whatever keeps it at 20 px on screen, so a phone counter-scales them (the site's canvas-label rule). A test now asserts every gas and power port has a male and a female glyph and a gas color. Verified in the pane at 990, 640 and 375 px widths; tests 35 of 35.

Known limit, David's read: it is harder on a phone than a monitor. A 14 by 14 wall at 360 px gives 25 px cells; a 20 px glyph is the floor, not a fix. The phone answer, if he wants one, is pinch and zoom on the wall (the Atlas ruling) or a tap-to-magnify on a port.

ROUND 2, PART 2 SHIPPED 2026-09-18, on David's "get back to the game, I want to get an alpha out soon." All three proposals, verified in the pane at 1280 and by the phone harness at 360 (no console errors, no overflow, no target under 44 px):

- A card behind every device, adapter and interface (`cardSVG`): a light backing (#e6ecf2) with a 1.5 unit ink edge and a short hard shadow (an ink rect offset 3 units at .30), drawn under the footprint and the art. Sources, fixtures and the patient carry none. The art is untouched.
- Tubing one weight lighter (`TUBE_STYLE` o2 5, 22 mm 8, 15 mm 7, cord 3, suction 6, CO2 3) with the ink outline at 2 units instead of 3; the 22 mm dash overlay at 3; the flow overlay floors at 2.5.
- Joint nodes hold 8 px on any screen (`jointR` = max(9, 8/scale), the glyph rule applied to nodes; tube ends `endR` = max(6, 5.5/scale)) and carry their state in ink: a check for green, a bang for amber, an x for red (`NODE_MARK`, class `.nmk`, scaled with the node). The pop ring on a joint that turns green follows the same radius.
- The phone magnifier was NOT built: the counter-scaled glyphs and joints are the phone answer for now, and pinch and zoom stays the Atlas ruling if it is ever needed.
- One Tier 1 fix found by the new phone harness: the cart search box measured 36 px; it is 44 px on coarse pointers now.

ROUND 3 SHIPPED 2026-09-18: THE HAND, PART 2. David's read after Round 2 part 2: "the movement of icons is still clunky and not as clean as a web game." The audit found four causes in the drag path and shipped four fixes:

1. Picking up a wall part rebuilt the whole wall (`renderBoard`) before the ghost appeared: the hitch on every grab. Now `dimWall` toggles the moving class on the existing elements in place.
2. Every pointer move wrote the ghost transform and then read three element rectangles (board, trash, cart dock), forcing a synchronous layout per event. Rects are read once at pickup (`dragRects`, refreshed on scroll and resize) and moves are coalesced to one update per frame through `requestAnimationFrame`; the drop preview redraws only when the landing cell or its verdict changes (`drag.pvKey`). Measured: 0.008 ms per pointer move.
3. On release the ghost vanished and the part popped into its cell. Now the ghost SETS THE PART DOWN: `ghostTo` glides it onto the landing cell over 150 ms on the site curve (lift scale off), while the landed parts render hidden under class `landing` and come out when the ghost arrives, the dragged one with the settle pop. A refused drop glides the ghost back to where it came from and un-dims the originals; a cart part that cannot land fades; a trash drop shrinks the ghost into the trash (`ghostGone`). Reduced motion skips every glide.
4. A drag that never got its pointerup left a ghost behind and a part dimmed; `beginDrag` now clears any stale ghost and dim first. Also: the ghost shadow is lighter (8/12 px, .45).

Verified in the pane at 1280 with synthetic pointer events: one ghost during a drag and none 320 ms after; the glide class and the set-down at release; the placed part hidden at release and revealed with a settle; a wall move landing on the right cell with no rebuild at pickup; a refused drop on the rail shaking the wall, gliding home, and leaving the part un-dimmed. Trap for the next verifier: animation frames do not run while the Browser pane is hidden, so a frame-wait helper hangs the javascript tool and mid-drag ghost tracking cannot be measured there; drive drags synchronously and assert on the release path.

ROUND 4 SHIPPED 2026-09-19, ON DAVID'S FIRST PLAY OF THE ALPHA TEST ENVIRONMENT. His read: "cannot move the oxygen tubing", "the visuals look better but I think we have a transparency issue", "the side menus and pop ups are a bit problematic. We need to start with simple and have it expand to detail if needed." What shipped:

1. Press a run and pull. The interaction law only offered the port press and the double-click; the gesture people reach for is grabbing the tube itself. Now a press anywhere on a run lifts its nearer end into the hand (a lead's far end always) through the existing `beginReplug`, with the rubber band following; release on a port re-lays it, release elsewhere leaves it pulled off, Undo puts it back. Jumpers (zero-length runs) are excluded.
2. Nothing see-through in the hand. The ghost is opaque (was .92) and the part's place on the wall is a dashed teal SLOT: the art, card, shadow and labels go `visibility:hidden`, only the footprint outline stays, and the part's own ports and glyphs hide with it (`.cn` groups now carry `data-uid`; `dimWall` toggles `.moving` on `.it`, `.cn` and `.pt`). The 35 percent dim that read as a transparency glitch is gone.
3. Simple first, detail on demand. One `<details class="da-fold">` primitive, mono summary line with a triangle, 44 px on coarse pointers, reduced to a hairline rule at rest. The level panel keeps the kicker, title, brief and the coach hint; "How the wall works" (open on tutorials only), "Connectors" and "Turning parts and keys" fold. The spec sheet keeps the category, name, description, flow range, connections, dials and the adapter note; manufacturer, model, footprint, orientation, needs, provides, fits and source fold behind "Details, fits and source". The brief card before a level keeps the order line; the scene and the par fold behind "About this wall", open on tutorials and fault walls where the scene is the teaching. The fault reveal keeps what was wrong and what to do; the test's own lines fold.

Verified in the pane on the sandbox with synthetic pointer events: a run laid from the cannula lead to the tree barb; a press on the run body raised the rubber band and the status read "tubing not joined" while pulling; release on empty wall left it pulled off and Undo restored it; on a wall drag the part carried class moving with its body hidden, a 6/5 dashed slot, four ports and glyphs hidden, and an opaque ghost; the spec sheet opened on Connections alone with the fold below. Engine and site tests 58 of 58.

ROUND 5 SHIPPED 2026-09-19, ON DAVID'S SECOND READ: "the find what's wrong shouldn't just be point out the error, it should be fix it and make it working again. We could also improve the menuing a bit. The game is supposed to be easy to step into and out of."

- FIND THE FAULT IS A REPAIR. The wall arrives broken and fully editable; the order is met by fixing what is on it (the tubing to the other tree, the cord into a receptacle, the line into the port), and Submit judges it like any wall. The coach carries two steps: fix it (clears when the wall works), then submit. "Show me" is a ghost button in the bottom bar on fault walls: it rings the part and says what is wrong, and it costs two stars (five for finding it yourself, three with the hint). The success card reads "Wall fixed" with the fault named. The tap-to-answer mechanic, the strikes and the reveal-as-ending are gone; `faultMatches` stays as the culprit lookup.
- STEP IN. The title card leads with one button: "Start with the tutorial" on a first visit, otherwise "Continue" to the last wall you left open, or "Play again" if you finished it. The walls sit in four folded groups (Tutorial, Levels, Find the fault, Sandbox) with "n of m done" on each summary; the group holding the next wall is open. The pitch paragraph folds behind "What this is" once anything has been played. A wall you have finished opens straight onto the bench with no brief card. The tester hatch (?unlock=1) now opens the locks instead of faking progress, so briefs and firsts still happen.
- STEP OUT. "Back to the wall" on the title card once a wall has been opened (a timed clock resumes). Esc steps out of any card: the brief opens the wall, everything else closes.

Verified in the pane with synthetic events, start to finish on Find the fault 1: brief, editable wall, Show me ringing both culprits, the run pulled off the air tree and re-laid on the oxygen tree, the coach flipping to "It works. Submit it.", submit landing on "Wall fixed" with three stars, progress saving the last wall, and the title card offering Continue, the counts, and the way back. Engine and site tests 59 of 59.

ROUND 6 SHIPPED 2026-09-19, ON DAVID'S THIRD READ: "I am not ready to launch the alpha until we really work on the polish of the game. There should be transparent backgrounds to connectors. We should move the body from left to right; we will be building puzzles so we will need to have the back end to swap and move things around for the different puzzle types. We need to clean up and optimize some of the menuing and work on cleaning the whole look up for a web game. There are so many things that pop up when you hover and move around, it's a bit distracting."

1. THE ROOM. Layout is data a level names. `ROOMS.left` is the original wall and `ROOMS.right` is the default now; a level can say `room:'left'` or carry a room object inline. A room is a rail (fourteen plates), the fixtures, the face (with the nose and the neck squares) and the order card. The ASSEMBLY ZONE, the six gas columns with the face under the oxygen pair, keeps its shape in every room and `room.dx` says where it starts, so the fault builds and a level's `extras` (the tutorial source, the shelf and the IV pole) are written once, in zone columns, and follow the room. A new puzzle type is a new room, not a new board. The engine tests keep playing in the left room by name; tests/device-assembly-room.test.js proves the right room is the same puzzle moved over (seats, pars, faults, repairs).
   The body moved four columns right, and four is the wall's own limit. The cannula lead is 7 ft, so the oxygen pair has to sit over the ear column: the source moves with the patient or the tutorial cannot be solved. The 13 ft sampling line and the 10 ft cords leave over the RIGHT ear, so the monitor and a plain receptacle have to stay east of the zone or the capnography wall and the unplugged-humidifier wall cannot be repaired. Moving the body to the far right needs a smaller cell (say six inches), which is every par rewritten. That is a decision for David, not a polish round. The right rail reads: call, switch, data, receptacle, red, red | O2, O2, AIR, AIR, VAC, VAC | O2 (over the monitor, no room under it, the same trap as before), receptacle.
2. CONNECTORS SEE-THROUGH. The eight female glyphs (the sockets, the tubing end, the DISS nut, the quick-connects, the receptacle, the luer port) carried a dark fill that read as a box behind every hollow connector. They fill nothing now: the wall or the card shows inside them. Adapters (the trees, the socket and cone adapters, the coupler) carry no card; a connector floats on the wall, only devices and interfaces sit on a card.
3. NOTHING FLOATS. The tooltip is gone. What a port or a joint has to say reads in the status line under the wall while the pointer is on it, and the line hands back the counts when the pointer leaves (the empty "Green:" on a lead is fixed on the way). The name chip comes with selection, not with the pointer. With a mouse at desktop width the verb bar never floats over the wall: Turn (R), Set it and Back to cart are docked in the spec sheet, which opens on select; touch keeps the bar, because no sheet is open and there is no key to press.
4. MENUING. The cart rail no longer repeats the level panel's kicker, title and order. The test read shows the lines that are on the order; the ones that are not fold behind "Not on this order" with a count.

Verified in the pane at 1280: the wall opens with the plates on the left and the patient under the oxygen pair; a flowmeter, a tree and a cannula placed by synthetic pointer events, the cannula lead laid from its ring to the tree barb (four connected, one run); the status line read "Electrical outlet · Receptacle · NEMA 5-15 receptacle · outlet" on a port and the joint's green reason on a joint, then went back to the counts; the spec sheet for the selected flowmeter carried "Back to cart" (no Turn, it is upright) with the floating bar at display none; Test system folded three lines behind "Not on this order 3"; one name chip visible, the selected part's. Verify 143 of 143; the phone harness clean at 360 and 699.

ROUND 6 FIX, the same day, on David's read of the build ("the whole screen shakes when you hover over something, as it tries to fill in the text"): the status line under the wall wrapped when a read was longer than the counts, the bar grew, the board wrap shrank, and the wall refit under the pointer. The line now keeps a two-line height wherever a pointer can hover and clips a longer read at two lines, so the bar never changes size. Measured in the pane at 1280 (the line beside the buttons) and at 1000 (the line on its own row): board top and height, bar height and line height identical before, during and after a read. Verify 143 of 143; the harness clean at 360 and 699.

ROUND 7 SHIPPED 2026-09-19, ON DAVID'S FOURTH READ: "the side panel looks too complicated. For some reason when I click on the screen the list of supplies on the cart shifts down. We do not need check marks at each connection point once it's made; the check marks and any other image over the item make it hard to select them and move them around. We need to make the patient a bit more visually appealing, and at this point I would disregard any design standards we have set or rules we are following to try and improve the game for real. Like go wild with it, because this just does not look good."

His ruling widens the phase: on this surface the standards and rules are off the table where they stand between the game and looking good. The 44 px targets and reduced motion cost nothing and stayed.

1. NOTHING ON A SEATED JOINT. A joint that seats draws nothing at all; the pulse at the moment it seats is the whole feedback. A bang or an x still marks a joint that is amber or red. The tube end caps stay (they are the tubing, not a verdict). A fixture's port (an outlet, a receptacle, the monitor) draws its ring only while a run is looking for it, so the rail is clean.
2. THE PART'S FACE IS THE PART'S. A port's press target was a full disc the size of a thumb, centered on the part's edge; two of them covered a one-square adapter and every press started a run instead of a drag. The target is now the OUTER half of the disc, on the connector side. A seated joint has no target; a port with tubing on it keeps its outer half for the pull-off. And a part in the hand goes down where you click whatever is drawn there (the click used to be eaten by a ring).
3. THE CART KEEPS ITS PLACE. Every click on the wall rebuilt the cart list and threw its scroll away, so the list jumped back to the top. It rebuilds only when something on it changed, and keeps its scroll when it does.
4. THE PATIENT. A pillow with a shadow under the head and two creases, a rounder face with open eyes, a glint, brows, cheeks and a smile, hair with a highlight strand, ears, a gown with a v-neck and a dot print, and a blanket pulled up to the chest with a fold. Two tones and an ink edge, like the parts. The nose and mouth still sit in the free square the interface goes on; the pillow stops short of the ear column. The PATIENT label is gone, and so is the card behind an interface: a cannula on the nose sat on a white square that read as a bandage, so interfaces float like the connectors do and only devices carry a card. The wall has depth now: a soft vertical gradient, a shadow under the rail, quieter dots.
5. THE SHEET. It opens on what you need at the bench: the name, one sentence, "Connects" as one quiet line per port (state dot, glyph, the connector's short name, in/out), the flow range, the dials. The whole description, maker and model, the standards by their full names with their tiers, fits and the source fold under "Details, fits and source". The VERIFIED chips live in the fold now.

ROUND 8 SHIPPED 2026-09-19, ON DAVID'S FIFTH READ: "yeah, let's update the device art, overhaul the whole visual build for the game but keep the function the same."

The function is untouched: the engine, the levels, the parts database, the interaction. What changed is the drawing system under every part, so forty drawings re-skinned at once and the ones you look at most were redrawn by hand.
- ONE SOFT INK. The black line (#102340) around everything is a soft navy (#2b4468) everywhere: the part art, the connector glyphs, the joint caps, the marks, the patient.
- EDGES FROM THE FILL. The rect and circle helpers no longer draw an ink outline; each shape's edge is its own fill thirty percent darker, at two thirds the old width. Plastic reads as plastic, green as green, red as red. Plastics and glass a shade lighter; a water tone and a skin tone are named constants; the face behind an interface is the patient's skin.
- REDRAWN: the outlet plates (a dark socket with a gas-colored ring and a glint on a brushed rail), the flowmeter (a glass tube with a glint and a five-tick scale, a chrome ball, a round knob with a highlight), the bubble humidifier (a jar with a glint and a fill line). The monitor bezel is a lighter slate.
- TUBING outlines are the tube's own darker tone, one weight lighter; the corrugated and suction tubing are whiter.
- THE WALL: the rail is a brushed gradient with a shadow under it; every part casts one soft drop shadow (an SVG filter on the part group), so the hard offset shadow behind a card is gone and the card edge is a light gray; the board ground is a deeper navy.

Verified in the pane at 1280 on the sandbox: two flowmeters, a bubble and a heated humidifier, a suction regulator, a tree and a cannula placed and a run laid; the filter resolves on every part; the cart icons carry the same art. Verify 143 of 143; the phone harness clean at 360 and 699.

ROUND 9 SHIPPED 2026-09-19, ON DAVID'S READ OF ROUND 8: "I like these changes, I think they are a step in the right direction. Let's keep moving in this direction."

The hand pass on the rest of the catalog, in the Round 8 system: the tutorial oxygen source now matches the flowmeter (glass tube, glint, scale, chrome ball, a glint on the nut); the blender has a real dial (a white face, seven ticks, a needle that turns with the setting) and a dark readout; the suction regulator has a gauge with ticks and a red needle and a glint on its mode knob; the nipple adapter's nut has a glint and its tree a tonal edge; the heated humidifier has a heater plate under the chamber, a fill line, a glint and a green power light; the five masks (simple, non-rebreather, Venturi, aerosol via the mask path, trach collar) have a tonal edge, a glint and softer straps, and the Venturi's jet color shows on the wall now (it sat inside the tap group, whose rects are forced transparent); the nebulizer, the CPAP generator and the suction canister have a glint on the jar. Two helpers carry it: GL (a glint) and DIAL (a dial with ticks and a needle).
Toasts show one at a time: a new one replaces the last instead of stacking three deep over the rail.

Verified in the pane on the sandbox with the blender, suction regulator and canister, heated humidifier, high-flow flowmeter, four masks, the nebulizer and a tree on the wall. Verify 143 of 143; the phone harness clean at 360 and 699.

ROUND 10 SHIPPED 2026-09-19, ON DAVID'S ASK: "we should put a computer screen on the headwall and have it display alerts or other info. Maybe swap between the order and the errors; let's get that hashed out so the pop-ups and the details have a place to be."

THE WALL SCREEN. The bedside computer sits where the order card was (the room's order region, so it moves with the room): a dark bezel on a mount, a light screen with three tabs, ORDER, ALERTS, TEST, and a power light. It shows the order. When something happens (what a toast used to float over the rail: connected, pulled off, not functional, the length used) it shows that instead for four and a half seconds with a colored stripe, then goes back. After Test system it shows the read: the verdict and a check or a cross per line that is on the order, and it stays there until the wall changes. The alerts keep the last three; the earlier one reads as a footer line.
On the wall the floating toast is gone (it still exists for a screen reader, aria-live, but it is not seen). On a phone the screen is too small to read, so the floating card stays there. The status line under the wall keeps the counts and the hover read.

Verified through Playwright at 1400: a flowmeter, a bubble humidifier and a cannula placed and the lead laid; the screen read "CONNECTED / Nasal cannula tubing end to Bubble humid. outlet barb. 7 ft used, straight run." with "earlier: Connected"; the DOM toast carried the sr class; Test system put "SYSTEM FUNCTIONAL" and five checked lines on the screen, and it was still there five seconds later. Verify 143 of 143; the phone harness clean at 360 and 699.

ROUND 10 FIX, the same day, on David's read ("is this nose supposed to be big? why is the NC so massive"): every interface drew a skin-colored disc behind itself so it would read as a face on the cart, and on the patient that disc landed on the nose and read as a giant nose. The discs are gone from all six interface drawings. The cannula and the high-flow cannula are redrawn as what they are: two clear prongs on a small hub with thin tubing running out to both sides, the right one reaching the lead port. Captured at close range through Playwright: the prongs sit under the nose, the tubing runs over the cheek to the ear column. Verify 143 of 143; the harness clean.

ROUND 11 SHIPPED 2026-09-19, ON DAVID'S READ OF THE SCREEN: "good improvements, let's get more of the info built into that mini computer screen within the game; we want all the pieces on the field, as that is how we will create the challenge in the game."

The screen is the console now. Four pages, and the tabs are buttons you tap: ORDER (the resting page), HINT (the current step, up to seven lines, the step number in the corner), ALERTS (the latest with its stripe and up to three lines, the two before it as footer lines), TEST (the verdict, a check or a cross per line on the order, and the first failing reason in red; "Not tested yet" before a test). A new step turns the screen to HINT for five seconds; an alert turns it to ALERTS for four and a half; when both land in the same tick, the alert shows first and the hint follows it, then the screen rests on the order (or on the test read while the wall has not changed since the test).
The floating card is decided by the screen's size on the glass, not by the layout: wherever the screen renders 150 px wide or more it carries the alert alone; below that (a 360 phone) the card still floats. The floating verb bar is hidden for any fine pointer at any width now; David plays zoomed in, where the phone layout kicks in on a desktop.

Verified through Playwright at 1400, 600 and 360: parts placed on Tutorial 5, the lead laid, the screen reading each connection; the card carried the sr class at 1400 and 600 and showed at 360; the ALERTS, HINT and TEST tabs turned the page; a build without a humidifier tested NOT FUNCTIONAL with "The order calls for humidity. None in the path." in red under the lines. Verify 143 of 143; the phone harness clean at 360 and 699.

ROUND 11 FIX, the same day, on David's read ("this should be a bit larger, the text is really hard to make out"): the screen's region grew from four squares by three to five by four in both rooms (the order region, so it is room data), and the type on it grew with it: tabs 9.5, the hint 11.5 on a 14 line, alerts 12, the test lines 11.5, the order head 19. The bed narrowed a little on the right (gown and blanket ends at the ear column) so the screen never sits on the blanket. On a 1400 desktop the screen is now 236 by 184 px. Verify 143 of 143; the harness clean.

ROUND 12 SHIPPED 2026-09-19, ON DAVID'S READ: "the scale still feels really wrong."

The parts were already drawn to one scale (a square is about three inches; the face is three squares), but the fixtures and the bed were not: a clock the size of a fist, a glove box smaller than a hand, a hand sanitizer the size of a mask, a patient monitor the size of a humidifier, a bed three squares wide with cartoon shoulders. That is what read as wrong.
- FIXTURES at their real footprints where the wall has room: the patient monitor is two by three (its CO2 port on the underside moved down with it, and a free square is kept under it), the glove box two by one, the sanitizer one by two, the clock two by two with a face that fills it and hands that follow its size. The sharps bin stays one by two: a small bin is real, and a bigger one would close the lane the routing tests use. The shelf and the IV pole are puzzle obstacles and stay as they are.
- THE BED spans the wall the way a bed spans a headwall: a four-square pillow, shoulders five squares wide, a blanket across six. The head is unchanged (the nose square fixes it).
- THE SCREEN sits on an arm with a wall plate, reaching over the foot of the bed, so it can overlap the blanket the way a bedside workstation does.
The capnography test that counted the sampling run to the monitor now expects twelve cells instead of thirteen (the port sits one row lower).

Verified through Playwright at 1400 on Tutorial 5 with a flowmeter, a tree and a cannula and a failing test on the screen; the room test still finds every fixture on the wall with nothing overlapping. Verify 143 of 143; the phone harness clean at 360 and 699.

ROUND 12 FIX, the same day, on David's read of the hint page ("can we find a better way to scale this text?"): the screen picked one type size and left the panel empty around a short hint. The text is sized to its box now: fitBlock tries sizes from large to small, wraps each to the box width, and keeps the largest whose lines fit the height (an ellipsis only at the floor). A four-line hint reads at 16, the longest tutorial hint at 12 across eight lines; alerts, the test rows and the failing reason size the same way; the order grew to 24, 18 and 16. Captured through Playwright on Tutorial 4 (short) and Tutorial 5 (long). Verify 143 of 143; the harness clean.

ROUND 13 SHIPPED 2026-09-19, ON DAVID'S ASK: "can we find a place for those pop-ups and menu selections to live so they don't pop up every time?"

- NO BRIEF CARD. A wall opens the moment you pick it. The order is on the screen, the scenario and the par live on the screen's new NOTE page ("Chart note", sized to the box) and in the level panel under "About this wall", and the first step shows on the screen for six seconds. The card that opened every wall is gone; the success card at the end and the Show me card stay, one is an ending and the other is asked for.
- THE VERB DOCK. On touch the rotate, spec, set and back-to-cart buttons used to float beside whatever you selected. They live in one place now: a dock beside the trash at the foot of the wall, always there, dimmed when nothing is selected, live when something is. A mouse never sees it; it has the sheet and the keys.
- The level panel opens on About this wall (open on tutorials and fault walls), then How the wall works, Connectors, Turning parts and keys.

Verified through Playwright: on a desktop, Tutorial 4 opened with no overlay, the screen on HINT 1/4, the panel with About this wall first, and the NOTE page carrying the scenario and the par across eight lines; on an iPad Mini profile the dock sat at the foot of the wall with its buttons dimmed, then live once a flowmeter was selected. Verify 143 of 143; the phone harness clean at 360 and 699.

ROUND 14 SHIPPED 2026-09-19, ON DAVID'S ASK: "I think we need to have patient interfaces that can swap from left to right."

- THE MIRROR. A part can face the other way. A mirrored part keeps its footprint and swaps its columns and its east and west sides after the rotation, and its art draws mirrored with its words still reading forward. Flip (F) works on the part in your hand, on a selected part, in the touch dock and on the spec sheet; undo keeps it. A bubble humidifier flipped points its barb west; a cannula flipped faces a patient on its right and sends its tubing over the left ear.
- THE PATIENT CAN FACE THE OTHER WAY. A room says face.flip and the cheek sits right of the nose with its port looking left, the hair covers the nose and the cheek, and the left ear column is the open one; the patient art draws as one mirrored piece. An interface dropped on that nose mirrors itself: the mirror is part of auto-orient, tried before any turn so it wins a tie with a half turn (a half turn would seat too, upside down). The straight build in a mirrored room is the same seven feet with the same one bend, on the other side.
- ROOMS.mirror is the right room with the patient facing left, and ?room=mirror (or left) is a tester hatch that opens every wall in that room. No shipped level is mirrored; it is there for the puzzles to come.

Six tests in tests/device-assembly-flip.test.js: the sides swap, undo keeps the mirror, the mirrored cheek seats a mirrored cannula and refuses a plain one, auto-orient mirrors a dropped cannula, the mirrored straight build, and nothing mirrored by default. Verified through Playwright: on the mirror room a cannula dropped on the nose mirrored itself, its lead ring sat left of the nose and the run reached the tree; on the sandbox F mirrored a selected humidifier, its barb port moving from the right edge to the left and its art carrying the mirror transform. Verify 149 of 149; the phone harness clean at 360 and 699.
TRAP: a regex with a backslash written through a Bash heredoc lost the backslash in transit (the room hatch matched nothing); write such scripts with the Write tool.

ALPHA CALLED 2026-09-19 by David after Round 15 ("ok that's good, any last clean up before I call this an alpha and work on something else"). The feel phase is parked here, not closed: closing it means the wall grammar written into DESIGN.md Tier 3. Clean-up at the call: the dead title-card alias and the dead brief parameter removed, stale comments fixed, the CLAUDE.md phase block compacted to the current state, the memory consolidated.

ROUND 15 SHIPPED 2026-09-19, ON DAVID'S ASK: "is there a way to integrate this first pop-up menu into the game? We do not have a start screen menu for the RN task game, so we should be able to come up with something for this."

- NO TITLE CARD. The game opens on the wall you left, or the first tutorial, with the first step on the screen. Nothing sits over the wall at the start.
- THE WALLS ARE A SCREEN PAGE. The Levels button turns the bedside screen to WALLS: the four groups with their counts, then the walls of a group as rows you tap (the current wall marked, the locked ones dimmed and not tappable, done and best at the right, a back row in the header). Esc leaves the page. The success card's Levels button goes there too.
- THE WALLS ARE ALSO A PANEL FOLD. The level panel carries a "Walls" fold of real buttons (keyboard-reachable), and a "What this is" fold with the old card's pitch and the NBRC footnote. On a phone, where the screen is too small to read, the Levels button opens the panel sheet on the Walls fold instead.

Verified through Playwright: a fresh desktop load opened on Tutorial 1 with no overlay and the hint on the screen; Levels turned the screen to WALLS with four groups; Tutorial opened five rows with four locked; tapping the first row started it; the panel showed About this wall, Walls, How the wall works, Connectors, Turning parts and keys, What this is, with sixteen wall buttons and fourteen locked. At 360 the Levels button opened the sheet on the Walls fold. Verify 149 of 149; the phone harness clean at 360 and 699.

Round 2 part 2 had been the last proposal on the original build list. Closing the phase means writing the feel grammar (the hand, the assembly rule, roped selection, the connector glyphs, the cards, the joint marks, the three motion tokens) into DESIGN.md Tier 3; that is David's call, and the alpha backlog in docs/HU-RT-REDDIT-RESEARCH-2026-09-16.md section 11 is what follows it.

Not in this phase: the engine, the level data, the copy, the grid.

---

## 4 · Tier 1 and 2 checks that bind here

44 px touch floor on every target the thumb uses. Transform and opacity only. Reduced motion honored, fades kept. Site curve `cubic-bezier(.2,.8,.2,1)`; 150 ms state changes, 220 to 280 ms structural moves, 250 ms ceiling on phones (HUKit.dcap).
