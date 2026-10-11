# Device Assembly · the deep dive
### 2026-10-04 · for the Plan stage · nothing in it is built

David, 2026-10-04: "let's do a deep dive look at any skills or any new tech that we should try to bring to the
game try to help it and then set up a testing for different setups and I will do the QA notes just like the last
time." Earlier the same day he named the goal: "some optimization... some visualization improvements... more
streamlined effects... simpler or easier to follow processes."

Three reads went into this, each one checked against the file, with line numbers. A code audit of the game, a
motion and feel audit run on the improve-animations method, and a check of which newer browser features actually
work on phones, iPhone Safari above all, as of October 2026. Line numbers are in
src/secret-menu/device-assembly/index.html.

This is a menu, not a plan. His playtest notes and this list become one ranked build list for his yes, and that
list is the next milestone.

---

## 0 · On one screen

1. **The payoff is hidden.** Complete starts the gas drawing through the circuit and opens the result card in the
   same tick (L4863), so the gas plays behind an 84% dim with a blur. Tutorial 1 tells the player to "watch the gas
   go" (L1080). The best moment in the game happens behind a card.
2. **On a phone the thumb covers the part.** At 360 wide a cell is 24.6 px (L3555), the dragged part sits centred
   under the finger (L4373), there is no zoom, and the button dock covers the bottom two rows of the wall.
3. **The cart fights scrolling.** Every part in the cart blocks touch scrolling (L47), so swiping the cart sideways
   picks up a part instead.
4. **Turning a part mid-drag needs a keyboard or a right-click** (L4620, L4626). Tutorial 5 still tells touch
   players "Right-click turns a part" (L1131).
5. **Every move rebuilds the whole wall.** About 700 SVG shapes, each with a drop-shadow filter, are rewritten from
   one string on every render (L3912), and the connection check runs about three times per render. A heart monitor
   on every hospital wall redraws every frame, forever (L4727). That is the likeliest source of "clunky" on a
   mid-range phone. It has not been measured.
6. **About 830 KB of JavaScript runs before the wall paints,** including the 214 KB multiplayer library that only
   the race uses (L505-510).
7. **iPhones have no vibration for web pages, and the game makes no sound.** On an iPhone, sound is the only way to
   give a "click" when a part seats. And Safari may clear a player's saved progress after 7 days without a visit
   (WebKit's policy since 2020; whether it still holds in 2026 is unverified).

---

## 1 · The game today, in numbers

| | |
|---|---|
| Page | 527 KB in one file: JS 479 KB (91%), CSS 38 KB, part and level data 116 KB of the JS |
| Content | 28 authored walls, 96 parts, generated walls in five places (hospital, rehab, home, ICU, made) |
| Drawing | Inline SVG, 840 units square, 14 by 14 cells of 60 units |
| A move | A full rebuild of the wall (47 places call render); the cart is the one part that skips when unchanged |
| Always running | The monitor every frame; the timed clock every 250 ms; the race every 500 ms; two endless CSS animations |
| Input | Pointer events only; drag after 4 px; tap a cart part then a cell; tap or pull to lay tubing |
| Phone, 360 wide | Wall 344 px, cell 24.6 px, port targets 44 by 22 px (wider than a cell, so neighbours overlap) |
| Feedback | Motion only. No sound (L5053), no vibration |
| Saves | localStorage: progress, one wall in progress, race name and settings |
| Tests | 16 files, 110 tests, all on the engine. Nothing tests drawing, touch, the address parser, timing or phone layout |

Already shipped, so not proposed again: fifteen polish rounds (docs/HU-DEVICE-ASSEMBLY-FEEL-2026-09-16.md section 3),
the room, the mirror, the bedside screen, the readout under the wall on phones, the ghost lift and glide, the
settle pop, the joint ring, the gas draw-on.

---

## 2 · What could be built, by what a player would feel

Size: S fits inside one window, M is about one window, L is more. Each is a candidate, not a commitment.

### A · The payoff and the feedback

| # | What the player feels now | The change | Size |
|---|---|---|---|
| A1 | Complete, and a card covers the moment | Hold the card until the gas has landed (the reveal time the code already works out, plus 250 ms, at most 1.5 s). A tap skips. Light each part as the gas reaches it, not all at once. On a pass, one green ring at the patient | S |
| A2 | A refused drop shakes the whole wall | Shake only the part; ring a refused connection or a new amber or red joint in its own colour (today only green joints ring, L4198). Delete the wall shake | S |
| A3 | Tubing appears all at once; a turn snaps | Draw a new run from its first port as it is laid, then ring the far end. Show the turn as a quick rotate, the flip as a quick mirror | S |
| A4 | Silence | Short synthesized clicks for seat, connect, refuse, pass and fail: no sound files, no change to the site's security policy. Started from the first tap; on iPhone set to mix with the player's music so the silent switch still mutes it. A Settings toggle | M |
| A5 | Nothing in the hand | On Android, a 10 ms vibration on a seat and on the result, behind a Settings toggle. iPhone cannot do this from a web page | S |

### B · Touch

| # | What the player feels now | The change | Size |
|---|---|---|---|
| B1 | The thumb hides where the part lands | On touch, lift the part about 56 px above the finger and aim with the part, not the finger | S |
| B2 | Swiping the cart picks up a part | The cart scrolls sideways; a drag starts on an upward pull | S |
| B3 | Laying tubing by finger is guesswork | The tube end snaps to the nearest port within reach, coloured green, amber or red before you let go (mice already get this) | M |
| B4 | No way to turn a part while holding it on a phone | A touch way to turn mid-drag: a second finger's tap, or the Turn button working while a part is held | S |
| B5 | Cart tap, then cell tap: the part appears from nowhere, by its corner | The part flies from the cart to the cell and lands by its centre | S |
| B6 | The wall is small on a phone | Pinch to zoom the wall. The magnifier was decided against on 2026-09-16; this is the other answer | L |

### C · Easier to follow

| # | What the player feels now | The change | Size |
|---|---|---|---|
| C1 | Where can this part go? | While a part is held, softly outline the cells where it would make a green joint | M |
| C2 | The tube is too short, found out after letting go | While pulling tubing, show the real route and say "3 ft short" before release | M |
| C3 | A fail says what is wrong, not where | A red ring where the gas stopped, kept until the wall changes | S |
| C4 | The bedside readout turns pages by itself on every connect | Turn pages only for amber, red and new steps; green connects already ring | S |
| C5 | Touch players are told to right-click | Say how to turn a part on the device in hand. A copy fix to a shipped game: a defect, so maintenance | S |
| C6 | 364 words before the first move | The reading-load phase, open since 2026-09-20: short labels on screen, the paragraph behind a tap (HUKit.peek, which this game does not use yet) | M |

### D · Speed

| # | Now | The change | Size |
|---|---|---|---|
| D0 | Nobody has measured it | Measure first: frame times and time to first wall with a phone's processor simulated (four times slower), before and after anything below | S |
| D1 | The race library loads for everyone | Load it only when someone opens the race | S |
| D2 | The monitor redraws every frame forever, even with reduced motion | Redraw only while visible and moving; stop it under reduced motion | S |
| D3 | A shadow filter on every part, a blur behind every card | Drop the per-part filter for a cheaper shadow; drop the blur (the dim already hides the wall) | S |
| D4 | Every move rebuilds 700 shapes | Change only what moved | L |

### E · Keeping progress, and sharing

| # | Now | The change | Size |
|---|---|---|---|
| E1 | Progress can vanish on iPhone after a week away | Make the game installable to the Home Screen (a manifest, an icon, one gentle hint), ask the browser to keep its storage, and make the build link easy to copy as a backup | M |
| E2 | The share card downloads | Share it straight to Messages or WhatsApp where the phone allows, download where it does not | S |

### F · Defects the audit found (maintenance, fixable without a plan)

- `?room=mirror` and `?room=left`, the tester hatches, also open the race portal as room "MIRR" or "LEFT" (L5093).
- A random ICU wall's share link (`?wall=icu:...`) opens nothing: the address reader does not accept `icu:` (L5085).
- A panel section the player opened closes again on the next move (L4048).
- The daily wall: 8 of 14 days from #5 to #18 are home cannula walls.
- scripts/phone-qa.js, the scripted phone check, points at controls the game no longer has.

---

## 3 · Browser features, as of October 2026

| Use | Why |
|---|---|
| Web Animations and `linear()` easing | Spring-like settles and shakes in a few lines, on every browser, easy to switch off for reduced motion |
| Web Audio, with `navigator.audioSession = "ambient"` on iPhone | The iPhone's only stand-in for a haptic tick |
| `navigator.vibrate`, Android only | A tick where it exists; nothing breaks where it does not |
| View Transitions, same-page | Wall-to-wall changes in the shift and bedside screen pages, under 250 ms, never during a drag |
| `svh` units and container queries | The wall sized to its box, steady when Safari's toolbar shrinks, either way up |
| Web Share with files | The share card straight into Messages |
| A web app manifest and `storage.persist()` | Protection for saves on iPhone |

| Wait | Why |
|---|---|
| CSS anchor positioning | Not yet on every browser; keep placing tooltips in code |

| Skip | Why |
|---|---|
| Canvas or WebGL instead of SVG | A few hundred shapes is not where SVG struggles; the cost is the full rebuild (D4) |
| The iPhone "switch" haptic trick | A hack, reportedly already closed in iOS 26.5 |
| Fullscreen on iPhone | iPhone allows it for video only; Add to Home Screen is the answer there |
| Raw and coalesced pointer events | Parts snap to cells, so in-between points add nothing |

Sources, read 2026-10-04: webstatus.dev, caniuse.com, MDN, web.dev, the WebKit blog. Two details are unverified
and marked so above (the 7-day rule in 2026, and the haptic trick's patch). Puzzle games that wrote up the same
problems: Red Blob Games, "Draggable objects" (updated 2026-05-01); the Huewords devlog on iOS Safari drag and
drop (2024-05-30); Simon Tatham's puzzle collection, pointer capture in WebKit (2023-03-01).

---

## 4 · Skills and tools to bring in

| What | For |
|---|---|
| improve-animations | Ran for this audit; turns the A and B items into exact implementation plans |
| review-animations | A craft review after the motion is built, before David's QA |
| apple-design, emil-design-eng | Drag, lift and spring physics for B1, B3, A1 |
| prototype | Builds two or three real versions of one feel change behind a picker, so David can try each on his phone and pick. Good for A1's timing or B3's snapping. It runs only when David asks for it by name |
| impeccable, in its distill and onboard modes | The reading load, C6 |
| hu-game-shell | The start screen the expansion plan named and never built: Today's wall as the one primary button |
| The hu-mobile-tester agent | Touch checks between builds |
| A real-browser play test (new) | Playwright can drive touch drags; a test that plays a wall by touch, and one for the address reader, would have caught the two link defects in F |
| Real-device testing services | Not proposed: a paid service is David's call, and his phone is the device that matters |

---

## 5 · What I would build first

Pending his notes, which can reorder all of it. One milestone of small items with the largest change in feel:

- **Measure** (D0), so the before and after are numbers.
- **The payoff:** A1, A2, C3.
- **Touch:** B1, B2, B4, C5.
- **Speed:** D1, D2, D3.
- **Defects:** the five in F.

Then a second milestone: sound (A4, A5), snapping tubing with the route preview (B3, C2), seat spots (C1), and
Add to Home Screen (E1). Pinch zoom (B6) and changing only what moved (D4) are larger and wait for the
measurements to say they are needed.

Saying yes to a list like this reopens the game-feel phase, parked at alpha since 2026-09-19. The engine, the level
data and the part database stay as they are; none of the items above needs them changed.

---

## 6 · David's first pass, and the cleanup before the playtest

David played it the same night and stopped. "When I select the links on the hub it always takes me to the random
wall that is set up not the specific mission or tutorial lesson." Then: "it's never fully clear when something is
not connected properly or if it's not working right." On the blender: "The blender should be able to connect
straight to the wall or use the high flow meter is supposed to connect to the wall and then into the blender it
doesn't make sense." His idea: "specific like male and female... geometric images for something to be clearly from
the wall or from an adapter one to adapter 2." On the menus: "a little too complex or maybe it will focus too much on
minimalism and maybe we need something that's a little bit more clean cut." And the ruling: "I don't think we can
properly QA or review the entire build until we get that cleaned up." The set dressing (the sharps box, the gloves,
the clock) waits, his call: "eventually."

Then a random high-flow wall, 8K4M20, built to the end with every dot green but one: "like how does this fail?" Then
Ventilator 2, every dot green and six red lines on the test: "and how does this not work?" And his summary: "The
functionality is there but the understanding why things don't connect and sometimes not knowing if it is actually
physically possible to map it on the whole headwall is a problem like I can never tell what I'm doing wrong or why
it's not working I just get an alert that says it's not." On scale: "maybe the scale of things so it's a little bit
easier in some cases and then we clutter the wall up with more random objects."

### What was found

- **The links.** Six of the fourteen playtest links named no wall (the tutorial, the ventilator, the fault, the
  maker, the race, the first visit), and the game's address reader only knew the dealt walls. So the game resumed
  the wall last open, which for him was a random one. FIXED the same window: a link can now name any wall
  (`?wall=t1`, `?wall=v1`, `?wall=today`, `?wall=icu:...`, `?wall=make:new`, `?wall=race:new`), the room hatches no
  longer open the race portal (F1), the ICU links work (F2), and the playtest links point at the copy the hub
  serves, which is the build being fixed. tests/device-assembly-links.test.js holds every link on the board to a
  wall the game opens.
- **How 8K4M20 fails.** The oxygen tubing runs from the nipple adapter straight onto the heated humidifier's
  chamber. The chamber's inlet is a 22 mm cone; oxygen tubing only pushes onto a barb. The adapter that bridges
  them, the 22 mm socket x barb, was still on the cart. The game knew, and said so three times, all of them easy
  to miss: a toast that disappeared, an amber dot the size of a pinhead among a dozen green ones, and "1 need an
  adapter" in the smallest type on the page.
- **How Ventilator 2 fails.** Rebuilt from his picture, the test reads the same six lines word for word. He slid the
  humidifier up against the ventilator. Their ports sit one row apart, so they do not join, and the move pulled off
  the short 22 mm tube that joined them; a toast said "Tubing came off" for a few seconds. From then on the
  ventilator breathes into nothing, and the test reports it as six failures (no source, no flow control, no
  humidity, no interface, no FiO2) without once saying the tube between the ventilator and the humidifier is gone.
- **The blender.** The game already does what he described first: the blender's two probes seat straight in the
  oxygen and air outlets side by side, and the high-flow flowmeter threads onto the blender's bottom. Nothing on the
  wall shows it. The high-flow flowmeter is the wall flowmeter's body in a different tint, and its top, a DISS nut
  that cannot go in a wall outlet, is a 20 px symbol half hidden under the part.
- **The connectors.** Every port already carries a symbol (shape for the kind, filled for male, hollow for female,
  colour for the gas). On a phone they draw 20 px wide; two that meet sit on top of each other, so a mismatch looks
  like a match.
- **The menus.** The list of walls lives in three places (the Walls button, the side panel's Walls section, the
  bedside screen's WALLS page). Help lives in five (the "?", and the panel's How the wall works, Connectors, Turning
  parts and keys, What this is), with the screen's HINT page beside them. The desktop side panel has seven folded
  sections. On a phone the hint for a held part reads "Right-click or R turns it. Esc puts it back", and the cart
  starts at the bottom edge of the screen, so every part is a scroll down and a drag back up.

### The cleanup, in the order I would build it

The two walls fail the same way: the game knows the one place the gas stops and says something else. So the first
four answer "why doesn't it work", the next two "can it even go there", the last two are the clean cut.

| # | What the player gets | Size |
|---|---|---|
| K1 | **The test says where it stops.** Complete names the first place the gas stops, in one sentence, and rings that spot on the wall: "The breath stops at the ventilator's inspiratory port: nothing is on it." One cause, not six red lines that all mean the same break. | S |
| K2 | **A broken joint you cannot miss.** An amber or red joint draws large, with a tag on the wall saying what is wrong and the fix ("needs the 22 mm socket x barb, on the cart"), and that part lit on the cart. A move that pulls tubing off leaves a mark where it was. Both stay until fixed. | S |
| K3 | **Gas you can see while you build.** Every part the outlet's gas reaches is lit; everything past a break is dimmed. A break is where the colour stops. | M |
| K4 | **Connectors as plain shapes, his idea.** One bold shape per kind of connector, the same shape male and female: a tab that sticks out of the part, a slot cut into it. Colour is the gas. About twice today's size, on the edge of the part, never under it. Two that fit close into one shape; two that do not, sit side by side and plainly differ. The shapes get a card in Help. | M |
| K5 | **Where it goes.** While a part is held, every port it fits glows green and every port that would need an adapter glows amber; a spot it cannot go shows why before you let go (C1 in section 2). | M |
| K6 | **Will it reach.** While tubing is pulled, the route it will take shows, and "2 ft short" or "no way through" before you let go (B3 and C2). | M |
| K7 | **One place for each job.** One list of walls, behind the Walls button. One Help, behind the "?", holding the four help sections and the shape card. The side panel keeps the order and the part you picked. The bedside screen keeps Order, Hint and Test; Alerts folds into K2's tags. | M |
| K8 | **The phone.** The wall and the cart on one screen, hints in touch words ("tap Turn", not "right-click"), and turning a part you are holding by touch (B4, C5). | M |

**Scale.** His other idea, bigger parts on a simpler wall with clutter added for the hard ones, is the larger
change: fewer, bigger squares means re-laying all 28 authored walls and re-tuning the generator. The cheaper answer
comes first: the wall zooms to where you are working (pinch on a phone, a button at a desk), and nothing is
re-laid. If the parts still read too small after K1 to K8 and the zoom, the bigger grid is its own milestone.

Then the playtest again, on the same fourteen links, and section 5's list after it, reordered by what he finds.

None of it touches the engine's rules, the level data or the part database: what the game judges stays as it is,
only what it shows and says changes. Saying yes to it reopens the game-feel phase, parked since 2026-09-19.

### Built, 2026-10-04 to 05

All eight, in order, then zoom, on his yes. Where each lives is in CLAUDE.md's phase entry. Three things came along:
deep dive A1 (the pass card waits for the gas to land, at most 1.5 s), C3 (the ring where it stopped stays until the wall
changes) and B1, B2 and B4 (the part above the thumb, the cart scrolls sideways, a second finger turns). Two defects
turned up while building and were fixed: a link a messenger escaped (`gen%3AK3F9QX`) opened nothing, and his note's
"8K4M20" was 8K4M2O, a letter O; the codes mix O and 0, which is worth fixing for new codes, not old ones.

The puzzle QA system he asked for: tests/device-assembly-puzzles.test.js runs in every verify and holds every dealt wall
to solving, every break of a solved wall to saying where it broke (109 breaks across 47 walls on the first run, every
one located), and every hint to touch words. `npm run da:qa` opens every wall by its link at a phone and a desk,
pictures it, re-checks its breaks and plays Tutorial 1 by touch; the hub's Puzzles screen shows the result, and a wall
takes a mark like a QA item. A new wall is on the sheet by itself. What it cannot check yet: the 27 authored walls carry
no stored answer, so their breaks are not tried. Giving each one its answer (a `solution` snapshot, the way dealt walls
carry theirs) is the next step for the sheet.

### Weighed, and where each could go next

| What | Built | The other way, if the QA says so |
|---|---|---|
| Saying where it stops | A low card with one sentence, the ring on the wall | No card at all: the ring, the tag and the readout only |
| Showing the gas | Dim what it does not reach | Light what it reaches (a glow in the gas color) and leave the rest |
| The shapes | Plain geometry, tab and slot, about twice the old size | The part's own outline notched like a puzzle piece; or the bore and gas written on every joint |
| The live help | On, with a Settings row to turn it off | Off by default on the hard walls (the shift, the race), on for tutorials |
| Scale | Zoom (pinch, buttons, wheel, keys, double tap) | A bigger grid with fewer squares, then clutter for the hard walls: it re-lays all 28 walls and the generator |
| The menus | One card per job | A phone tray under the wall with Walls, Help and the verbs in one row |

