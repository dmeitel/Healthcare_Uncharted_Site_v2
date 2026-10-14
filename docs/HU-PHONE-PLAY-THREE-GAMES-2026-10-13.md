# Phone play: the other three games, measured

Step 89 of the phone play milestone (docs/HU-PHONE-PLAY-PLAN-2026-10-12.md; DECISIONS P2: Device Assembly first, the other three measured at the end, their fixes a milestone of their own). Measured by an agent in window 2026-10-12-b against the hu-game-shell skill's "a finger is not a mouse"; nothing in the games was changed.

Measured 2026-10-13 at 375x548 and 393x659: CDP touches (10 px radius), a mouse at the same points as the control. Scripts, numbers and screenshots were kept on David's computer under tmp/phone-play/ (not in the repo). None is a board game, so rules 4 and 5 rarely apply.

## Alarm Fatigue

Just clocked in, mid shift, and the full floor (?afdev=full).

| Rule | Result | Evidence |
|---|---|---|
| 1 Press areas | fail | Chart Themes, Achievements, Dashboard tabs 34 px tall; "Delete all" 81x32. The floor passes: CHECK 52x47, SILENCE 68x71, call lights 44x44. |
| 2 Exact point | pass | Helpers picked from the exact point (index.html:3503). CHECK and SILENCE, 4 px apart: touch and mouse both got the aimed one. |
| 3 Taps alone | pass | The inbox drag has a tap path: tap the row, tap a reply. |
| 4 Aims for you | n/a | Nothing is placed. |
| 5 Held piece | fail | The dragged row is centred under the finger (line 714). |
| 6 Nothing on board | fail | The sticky big-button block covers 125 px of the monitor bank at 375; rooms 7 and 8 sat under it. Pop-up cards land on monitors and call lights. |
| 7 Board gets screen | fail | One screen, floor 90%, but the console scrolls inside itself (427 px window over 830 to 1,100 px) and the big button shrinks 54 to 44 px as you buy (line 5994). |
| 8 A tap is a tap | fail | Drag starts at 4 px on touch (line 3771); a tap with 6 px of roll on an inbox row was lost, both screens. |
| 9 Miss costs nothing | pass | A short drop leaves the row in place. |
| 10 Seen and felt | fail | Float text and chime; the buzz is for alarms only, no Settings row. |
| 11 Undo | n/a | Real time, no turn. |
| 12 Thumb test | fail | Only centre-aimed taps at 360x740 (phone-qa.js) and an overlap check (play-check.js). |

Fixes, in order:
1. Inbox drag threshold 10 px on touch (line 3771). One line.
2. Nothing sticky or popping up over CHECK, SILENCE or a call light.
3. Chart tabs and Delete all to 44 px, then a thumb test with scripts/lib/thumb.js.

## Vital Stats

Solo with bots, Trivia and Guess and bet, every phase.

| Rule | Result | Evidence |
|---|---|---|
| 1 Press areas | pass | Guess rows 313x44 to 46, dock buttons 351x48. Nit: source link 42 px. |
| 2 Exact point | pass | Reads e.target.closest (line 1729), but rows are full width, 10 px apart; no probe moved on a still board. |
| 3 Taps alone | pass | No drags. |
| 4, 5 | n/a | Nothing placed or held. |
| 6 Nothing on board | fail | The fixed dock (69 px) sits on the card. At 375 the last guess is wholly under it: a tap on that guess pressed Done betting and locked the round with no chips. |
| 7 Board gets screen | fail | 9 of 10 play screens scroll. A guess row grows 46 to 74 px when a chip lands; rows below moved 28 to 56 px in 3 of 4 watched rounds, and probes landed on the neighbouring guess. |
| 8 A tap is a tap | pass | Nothing happens on press. |
| 9 Miss costs nothing | fail | The dock miss ends your betting. |
| 10 Seen and felt | fail | No buzz, no Settings. |
| 11 Undo | fail | A chip comes back on a second tap; Lock it in and Done betting are final. |
| 12 Thumb test | fail | backend-check-vital-stats.js presses with page.click. |

Fixes, in order:
1. The last row clears the dock at first paint (375x548 fails), and Done betting with no chips asks first.
2. Every guess row keeps its chip line, so a landing chip never moves the board.
3. A thumb test on the bet board while the bots bet.

## Uncharted General

A run from the start card: first paint, then the unit cards.

| Rule | Result | Evidence |
|---|---|---|
| 1 Press areas | fail | Twelve explainer lines open a peek on a tap: 20 px tall (physician, incident odds), 28 px (burnout), payer bar 6 px. Steppers 44x44 and "i" badges (44 px area) pass. |
| 2 Exact point | fail | Reads e.target.closest (index.html:3236). Touches 3 px inside an incident odds or physician line: 7 of 12 fired "Fewer RNs" or "Fewer Techs" below. Mouse, same points: 0 of 12. |
| 3 Taps alone | pass | No drags; a tap on a slider's track sets it. |
| 4, 5 | n/a | Nothing placed or held. |
| 6 Nothing on board | fail | Run dock 70 px plus sticky bar 57 px, 23% of 548; a burnout bar ran under the dock and a tap there hit RUN THE QUARTER. |
| 7 Board gets screen | fail | Page 4,476 px at 375 (8.2 screens). Unit cards start at y 572: none on the first screen at 375. |
| 8 A tap is a tap | fail | Sliders set on press: a scroll starting on the RN slider moved the page 165 px and RN pay 100% to 115%. |
| 9 Miss costs nothing | fail | The rule 2 miss cuts a nurse silently. |
| 10 Seen and felt | fail | No buzz, no Settings. |
| 11 Undo | fail | Undo is in each card, not beside Run; physicians and renewals have none. |
| 12 Thumb test | fail | phone-qa.js taps element centres at 360x740 only. |

Fixes, in order:
1. Decide presses from the exact point (Device Assembly's hitAt), or move the 20 px lines' sentences to the badges. It is the Device Assembly fault, and it costs staff.
2. Steppers for pay and overhead. Found in passing, on a desk: a mouse click on a pay slider goes through the click funnel with no value (line 3292), RN pay reads NaN%, and after one quarter cash and morale are NaN.
3. Unit cards on the first screen, Undo beside Run. A layout change, the owner's call.
