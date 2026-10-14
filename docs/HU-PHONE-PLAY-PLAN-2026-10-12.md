# Phone play: making Device Assembly work by thumb

Written in window 2026-10-12-b, after the 2026-10-12 push (a36e2ff). David played Device Assembly on his phone and wrote:
"it really wasn't that polished I couldn't plug things in or connect things very easily with my fingers the menu at the
bottom felt like it was taking up the screen all the time I feel like there is some best practices that we can develop
for phone and game systems that we need to look at".

BUILT in the same window on David's yes to both ("yes to both, go ahead and build it"); section 7 says what was built and what was
learned on the way. Surface: src/fun/device-assembly/,
inside the open "Device Assembly game feel" phase; the standard in section 3 goes into the hu-game-shell skill and
.claude/rules/games.md, so every game is held to it.

## 1. What he found, measured

Measured 2026-10-12 with Playwright at the screen a phone browser actually leaves you (the hu-game-shell skill's own
rule: Safari on an iPhone SE shows about 375 x 548, an iPhone 15 about 393 x 659).

| | iPhone SE (375 x 548) | iPhone 15 (393 x 659) |
|---|---|---|
| The wall, Level 2 | 156 px square, 28% of the screen | 267 px square, 41% |
| One grid square | 11 px | 19 px |
| Everything under the wall (screen readout, part tabs, part tiles, Complete) | 319 px, 58% | 319 px, 48% |
| A fingertip covers | about four squares | about two squares |
| Tutorial 1, tubing pulled to the barb with the thumb 6 to 20 px off | fails 3 to 5 times in 8 | holds at 20 px |

Tutorial 1 is the easiest wall in the game: one part, one place it can go, so the game puts it there whatever the
aim (the cannula drop held at a 20 px miss on both phones). Busier walls put outlets one square apart, which is 11 px
on the SE.

The touch test we already run (`npm run da:qa`) passed. It aims to the exact pixel, on a 390 x 844 screen, which is
the size our own standard says hides the problem. It proves the game CAN be played by touch, not that a thumb can.

Every HTML button in all four games already meets 44 px at 375 x 548 (only Uncharted General's pager dots and the
kit's "i" badges read small, and the badges carry a larger invisible target by design). So the site's checks pass the
games. The trouble is inside the board drawing, where no check looks.

Pictures: tmp/hub/mocks/phone-touch/ (compare.png is today beside the two directions in section 5).

## 2. Why, in the code

Found by reading src/fun/device-assembly/index.html (a code map, then the five claims that matter checked by hand).

Why a finger cannot plug things in:

1. The squares are 11 to 19 px and nothing aims for you. The drop square is plain rounding from where the held part
   is drawn (`moveGhost`, about line 5877). There is no pull toward a port the part fits; the rings that show where it
   fits are a picture, not a target.
2. The held part rides 42 to 55 px above the thumb, and the landing square comes from the part, but the game checks
   the FINGER is on the wall (`moveGhost` 5874, the drop at 5958). So the bottom two to four rows of the wall cannot
   be reached by dragging from the cart. The patient's neck is row 10; the lowest row an SE thumb reaches is row 10.
3. The Back to cart strip appears over the bottom of the wall while you move a part that is already on the wall, and
   it is checked before the wall (5954, its CSS at 230). On both phones it sits over the rows a thumb uses to aim at
   the patient's face. Moving a part onto the patient usually ends with "Back on the cart".
4. The button dock (Turn, Flip, Swap, Details, Put back, Undo) sits on the wall's bottom corner from the first move
   onward, because Undo keeps it up (5673). On the SE it covers the nose.
5. A press on a port that has tubing on it pulls the tubing off at once, with no allowance for a wobble (6083). A tap
   meant to look at a run unplugs it.
6. A drag starts after 4 px of movement, the same for a mouse and a thumb (5918). A slightly wobbly tap on a part
   moves it up two to four rows.
7. Port dots and the tubing ring Tutorial 1 asks you to press are drawn at 2 to 8 px. Tubing lines are pressable over
   4 to 7 px.
8. A port's press area (22 px) reaches over the neighbouring part on these small squares, so trying to grab a part
   can start a run instead.
9. Pulling tubing has no lift and no snap: the thumb covers the port it is aiming at, and the release must land inside
   that port's press area exactly (6021).

Why the bottom takes the screen: the readout (110 px), the part tabs (50), the two-line part tiles (101) and Complete
(57) are always there, and nothing in them folds or steps aside (the code calls the dock "permanent", 5453). The
site's phone check only measures bars that are pinned, so this dock was never held to its 20% budget.

## 3. The standard: a finger is not a mouse

Twelve rules for any game played on a board (Device Assembly now; Uncharted General, Alarm Fatigue and whatever comes
next). They go into the hu-game-shell skill as a FIRM section beside "a phone is one screen", and into games.md. Each
is checked by the thumb test (step 83), at the real phone screens, never at 390 x 844.

1. **Anything you press is 44 px at the real phone screen, whatever it is drawn at.** Ports, parts and runs included,
   not just buttons. A touch lands within about 7 mm at the screen's centre and 12 mm at its corners (Hoober); on an
   iPhone a millimetre is about 6 CSS px, so 44 px is the honest floor (Apple 44 pt; WCAG 2.5.5).
2. **Two press areas never overlap.** Where they would, the nearer centre wins, not whichever was drawn last (the
   bubble cursor, Grossman and Balakrishnan 2005).
3. **Every move works with taps alone.** Tap a part, then tap where it goes; tap a port, then tap a port. Dragging
   stays as the quick way. (WCAG 2.2, 2.5.7 Dragging Movements, level AA: a drag needs a single-tap alternative.
   Apple's game controls guidance: let players tap objects to select them.)
4. **The game aims for you.** When you let go or tap, the part goes to the nearest place it fits within a fingertip
   (44 px) of your aim, not to the exact square under it. Nothing lights that cannot take it, and the place that WILL
   take it brightens before you let go (Apple's drag and drop guidance; Flow Free's endpoint cue).
5. **What you hold is never hidden by your thumb, and the edges still work.** The held part shows clear of the thumb;
   the place it lands decides, so the thumb may leave the board to reach the bottom rows (Vogel and Baudisch, "Shift",
   2007: plain touch missed up to 81% of small targets; lifting the view clear of the finger cut it to 4 to 14%).
6. **Nothing sits over the board while you aim.** Buttons, drop strips and trays step aside while a part is held
   (Apple: hide controls that are not relevant; keep the centre clear).
7. **The board gets most of the screen.** On a phone held upright the board is as wide as the screen allows or at least
   55% of the screen's height (a square board on a narrow phone runs out of width first: 344 of 360 px is 54% of a
   640 px screen), measured at the four real phone screens. Folded things (the order, the tray's tabs) are one tap away (Material's bottom
   sheet peek; Apple's sheets).
8. **A tap is a tap.** On touch a drag starts after 10 px of movement, never 4 (Android's touch slop is 8 dp). Nothing
   destructive happens on the press itself: a run comes off when you pull it, not when you touch it (WCAG 2.5.2: act
   on release).
9. **A miss costs nothing.** A drop that fits nowhere goes back where it came from, with a few words saying why (Apple;
   WCAG 2.5.2).
10. **A connection you make is one you can see, and feel where the phone allows.** It snaps (about 100 ms), shows a
    seated state, and buzzes on phones that support it (Android Chrome; Safari on iPhone does not, so it is never the
    only signal).
11. **Undo is one tap and always on screen** (Townscaper keeps undo on screen; WCAG 2.5.2).
12. **Tested like a thumb.** The touch test misses on purpose (10 and 20 px, eight directions) and plays the walls by
    drag and by taps alone, at four real phone screens, with moves about 16 ms apart the way a touchscreen reports them.
    At 10 px every wall rebuilds by drag and by taps; at 20 px every wall rebuilds by drag for a player who looks at the
    drop preview (and presses again when a press picks the part instead of its port); taps 20 px off are counted, not
    gated, because a tap that far off lands on the neighbouring outlet and there is no preview to see first. A test that
    aims to the pixel proves nothing about a thumb.

## 4. The build, in order

Steps 83 to 90 on the board. Claude builds 83 to 89; nothing comes to David until step 90, the milestone's QA.

**83 · The thumb test, first.** Measure before cutting. A touch play test that misses like a person, at 375 x 548,
393 x 659, 360 x 640 and 430 x 746: Tutorials 1 to 5, Level 2 and Ventilator 2, by drag and by taps alone, each aim
off by 10 and 20 px in eight directions; six-pixel wobbles that must stay taps; moving a part already on the wall onto
the patient; and the layout checks (the wall's share of the screen, nothing over the wall while a part is held, every
press area on the wall 44 px). It replaces the robot test in `npm run da:qa` and shows on the hub's Puzzles screen.
Done when it runs and its first report shows today's failures, so every later step is measured against it.

**84 · The bottom of the screen.** Direction A in the picture (section 5):
- The bedside screen becomes one line under the wall: the order in a sentence ("Heated high flow, 30 L/min, 40%"), and
  messages flash in it. A tap opens the full screen (Order, Hint, Test, Note) as a card over the wall that closes on its
  X, Esc and the back gesture. Tutorials keep two lines, because there the step is the lesson.
- The tray becomes one slim row: the part's picture, a one-line name, its count. The kind tabs move into a card that
  opens from an All parts tile at the row's start. (Names stay: the HF and O2 flowmeters look the same at icon size.)
- When a part on the wall is picked, that same row shows its buttons (Turn, Flip, Swap, Details, Put back). Nothing
  floats over the wall any more.
- While a part is held, the row becomes the Back to cart drop zone, where the thumb already is. The strip over the
  wall goes.
- The foot of the screen is Undo, Complete, Reset. Undo is always there.
- A phone on its side keeps its own layout, checked at 740 x 360. The desk layout does not change.
Done when the wall is at least 55% of the screen at 375 x 548 and 393 x 659 (today 28% and 41%), the thumb test finds
nothing over the wall while a part is held, and nothing on the page scrolls.

**85 · A tap is a tap.** Touch drags start after 10 px. A press on a port with tubing picks the run and unplugs only
when pulled. A press area belongs to the nearest port or part, so a port never reaches over its neighbour. A sideways
swipe on the tray scrolls it and an upward pull lifts the part, decided by direction, with no ghost flashing up first.
Done when the thumb test's wobble checks pass.

**86 · The game aims for you.** A held part lands on the nearest place it fits within 44 px of where it is aimed (a
joint it seats, the patient's face, a run it goes in line on), and only those places are lit; the one it will take
brightens before you let go. The thumb may leave the wall: where the part is drawn decides, so the bottom rows can be
reached. A tubing end lands on the nearest port it fits within 44 px, with the route showing while you pull, and
rides clear of the thumb like a part. Where nothing fits, a part still sets down on the square it is over (free
placement, as today). Touch and pen only; a mouse places exactly, as David already passed at the desk.
Done when every drag in the thumb test lands with a 20 px miss.

**87 · Everything by taps.** Tap a part on the tray: it is in your hand, the places it fits light up, tap one and it
seats (with the same 44 px reach). Tap tubing on the tray: the ports it can start from light up, tap one, then the
ports it can reach light up, tap one. Tap a part on the wall: its buttons come up in the row, and tapping a lit place
moves it there. On a phone the hints teach the tap way first (the touch words already switch by `touchText`; the
hints that only describe dragging are a defect, fixed under the change budget).
Done when Tutorials 1 to 5 and Level 2 solve with zero drags at all four phone screens.

**88 · The feel of a connection.** A seat snaps and pops (the motion exists; it gets checked on touch at the new
sizes) and buzzes on phones that can, with a Settings row, "Buzz when something connects", on by default and
remembered. Reduced motion keeps its fades.
Done when the setting is remembered and the pictures are filed.

**89 · Write the standard down, then measure the other games.** Section 3 into the hu-game-shell skill and games.md;
the thumb test's helpers made shareable so another game can use them; then Uncharted General, Alarm Fatigue and Vital
Stats measured against the twelve rules, with a short report of what fails. Their fixes are the next milestone, not
this one (DECISIONS P2).
Done when the skill section is in and the report is filed.

**90 · QA, David.** He plays it on his phone over the home wifi (the test server, no staging) and marks the hub's QA
list. Then Tweaks, then Ship.

The gates do not move: `npm run verify` green, `npm run da:qa` (with the thumb test) clean, `npm run phone --
/fun/device-assembly/` clean at nine sizes, every step's pictures filed with `npm run shots`.

## 5. Calls Claude made (veto by looking)

- **Direction A, one slim row, over B, parts behind a button.** On an iPhone 15 both give the wall the same 377 px
  (the wall is as wide as the phone already), and B costs an extra tap for every part. B only wins on the SE, by 4 px
  a square. Picture: tmp/hub/mocks/phone-touch/compare.png.
- **No magnifier.** It was decided against on 2026-09-16, and that still holds: the lit places, the 44 px reach and the
  part riding clear of the thumb do the job a loupe would, without a second picture to read.
- **No bigger grid.** Fewer, larger squares was noted as its own milestone on 2026-10-04 and would re-deal every wall.
  The game aiming for you makes square size matter far less.
- **The engine, the walls and the parts do not change.** Every change is in how a touch becomes a move; the moves are
  the same verbs, so saves, links, races and the daily walls are untouched.
- **The buzz is Android only**, because Safari on an iPhone has no web vibration (caniuse, checked 2026-10-12). iPhone
  players get the snap and the seated look.
- **DECISIONS "Device Assembly round 2 part 2"** (a phone magnifier among other polish, recommended skip) is replaced by
  this plan; the row comes off the list.

## 6. Sources

Checked live 2026-10-12.

- Hoober, touch accuracy by screen region: https://www.uxmatters.com/mt/archives/2017/07/design-for-fingers-touch-and-people-part-3.php
- Parhi, Karlson and Bederson 2006, thumb target sizes (9.2 to 9.6 mm): https://dx.doi.org/10.1145/1152215.1152260
- Vogel and Baudisch 2007, "Shift": https://projects.csail.mit.edu/hci-reading/papers/chi2007-vogel.pdf
- Grossman and Balakrishnan 2005, the bubble cursor: https://www.dgp.toronto.edu/papers/tgrossman_CHI2005.pdf
- Apple HIG, accessibility (44 pt): https://developer.apple.com/design/human-interface-guidelines/accessibility
- Apple HIG, game controls: https://developer.apple.com/design/human-interface-guidelines/game-controls
- Apple HIG, drag and drop: https://developer.apple.com/design/human-interface-guidelines/drag-and-drop
- Apple HIG, sheets: https://developer.apple.com/design/human-interface-guidelines/sheets
- Apple, "Make your game great with touch" (WWDC26): https://developer.apple.com/videos/play/wwdc2026/358/
- Apple, "Design advanced games for Apple platforms" (WWDC24): https://developer.apple.com/videos/play/wwdc2024/10085/
- WCAG 2.2, 2.5.7 Dragging Movements: https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html
- WCAG 2.2, 2.5.2 Pointer Cancellation: https://www.w3.org/WAI/WCAG22/Understanding/pointer-cancellation.html
- WCAG 2.2, 2.5.5 Target Size (Enhanced): https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html
- Material bottom sheets (peek height, 48 dp handle): https://github.com/material-components/material-components-android/blob/master/docs/components/BottomSheet.md
- Android touch slop: https://developer.android.com/develop/ui/views/touch-and-input/gestures/viewgroup
- Web vibration support: https://caniuse.com/vibration
- Flow Free's play: https://strategywiki.org/wiki/Flow_Free/Gameplay
- Townscaper on touch: https://www.tapsmart.com/news/townscaper-review/
- MDN, touch-action: https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action

## 7. Built, and what the build found

Built in window 2026-10-12-b on David's yes to P1 and P2. Every step was measured by the thumb test before and after.

| | Before (a36e2ff) | After |
|---|---|---|
| The wall on an iPhone SE's real screen | 156 px, 28% | 309 px, 56% |
| The wall on an iPhone 15's real screen | 267 px, 41% | 377 px, the full width |
| Phone play checks passing (each phone) | 2 to 3 of 9 | 11 of 11 |
| Wall runs rebuilt by a thumb 10 or 20 px off | 12 of 112 | every gated run (section 3, rule 12) |

Five things the build found that the plan did not know:

- **Chrome moves a touch.** Its touch adjustment hands a press, and the click it makes, to the nearest thing it judges
  pressable. On these walls that was a part's port: a press on a small part started a run, and a tap on the cannula
  started its tubing. The wall now reads the element at the exact point (`hitAt`), and a click reads the point its press
  made (`downAt`). Rule 2 of the standard says so for every game.
- **A double tap turned parts.** Chrome sends a double-click for two quick taps, and the game's double-click turned a part
  and pulled a run off. A thumb that missed and tried again turned the part. On touch a double tap does neither now.
- **A tap on the ring finished the run.** The first version of "the end rides above the thumb" looked above a plain tap for
  a port to finish on. The lift and the reach now wait until the thumb has really moved.
- **A run's preview can be trusted.** At 20 px a thumb lands on the next outlet over, a square farther away, and a heater
  cord that does not reach powers nothing. The route on the wall says so before the finger lifts, and a player who reads it
  slides over; the test does the same, for parts and for runs.
- **Synthetic touches lie about speed.** Moves sent with no time between them read as a flick, and Chrome swallows the next
  tap. That looked like a game bug for an hour. The test now moves at a touchscreen's pace (16 ms), and the standard's
  rule 12 says so.

Not built, on purpose: a magnifier (decided against 2026-09-16; the lit places and the reach do its job), a bigger grid, any
change to the engine, the walls or the parts. The other three games were measured (docs/HU-PHONE-PLAY-THREE-GAMES-2026-10-13.md);
their fixes wait on the Inbox as The other games by thumb.
