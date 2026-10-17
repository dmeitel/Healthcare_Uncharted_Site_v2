---
name: hu-game-shell
description: The one top bar and the start patterns every game on the site uses. Load before building a new game, changing any game's top bar, start screen, lobby or menus, or moving a game onto the shell.
---

# The game shell

David, 2026-10-03: "a consistent menuing system... for anything from the vital stats games to the
nurse clicking games, and it's really just like the starting off menus or the top bar... right now
our best designed portal for a game is the vital stats and it's kind of easy to set up and run. And
if it's a single player game we don't need something that complex but if it's going to have
multiplayer elements it needs to be as clean and as easy to set up as that one." Then: the Vital
Stats opening "shouldn't be a hard or fast rule" (DECISIONS N2).

Plan and measurements: docs/HU-CONSISTENCY-TOOLKIT-2026-10-03.md, section 2.6. Menus:
.claude/rules/games.md (the menus contract still holds in full).

## FIRM: the bar

Every game wears src/_includes/components/game-bar.njk and nothing else at the top.

```
---
layout: base.njk
nav_merged: true          # the site menu lives inside Menu, never as a second bar
...
---
{% from "components/game-bar.njk" import gameBar %}
{% raw %}
... the page ...
{% endraw %}{% call gameBar({ name: 'Vital', accent: 'Stats', tagline: 'The healthcare numbers game', kitId: 'vsKit' }) %}
    <span class="vs-roomchip" id="vsRoom" hidden></span>
{% endcall %}{% raw %}
... the rest of the page ...
{% endraw %}
```

- ORDER, fixed: the HU mark, the name (the accent word in a span), the tagline (desktop only),
  then on the right the caller block (ONE status, such as a clock or a room code, and at most ONE
  game action, such as Silence or Home), then the kit's "?" and Menu, mounted by the game's
  script into `#kitId` with `HUKit.howTo(...).button()` and `HUKit.gameMenu(...).button()`.
- The game's script mounts into the kit span; it never builds its own "?" or Menu.
- ALLOWED in a game's own CSS: the bar's surface (background, backdrop-filter, its bottom border,
  shadow) and the colour of the accent word (`.tool-bar-title span`). NOTHING ELSE: not the bar's
  height, padding or gap, not the name's size or colour, not the kit buttons. hu-global.css owns
  them under THE GAME BAR: icon-only 44px buttons on a phone, the "?" yielding below 380px (Help is
  always the menu's second row), the kicker and the tagline gone on a phone.
- If a game needs more than one status and one action in the bar, the rest belongs in Menu or in
  Settings (`HUKit.settings`), not in the bar.
- tests/game-shell.test.js holds all of this and fails on any game that drifts.

## FIRM: multiplayer is as easy as Vital Stats

A game with a room (anything on hu-table.js) starts the way Vital Stats does: a name, Play with
bots as the primary, Create a room, a code box to join; the room card with its code, its link,
its QR code (hu-qr.js) and Big screen; a lobby where every setting has a default so the first tap
on Deal works; a game link that carries the settings. Read src/fun/vital-stats/index.html first;
copy its order and its words, not its code by hand.

## DEFAULT, not a rule: the solo start

A single-player game reaches first for a start screen that says what the game is in one sentence
and three short steps (Vital Stats' Guess, Reveal, Score row), with ONE primary button that plays
or continues. A game may instead open straight onto play, with the how-to card on a first visit
(menus rule 4). David's ruling: not every game needs it.

## FIRM: a phone is one screen (a board or puzzle game)

David, 2026-10-05, on Device Assembly: "the phone view for it does not fit well within the windows
or within the borders that we have pretty set. Is there a standard or a skill set or a training
guide on how to design... top down games or puzzle like games like this that are both web and
phone friendly". There is no one standard. This is the site's, built from three sources read that
day, and Headwall (Device Assembly until 2026-10-15) is the reference build (src/fun/headwall/, THE SCREEN).

1. THE GAME IS THE SCREEN. Held upright, the game is exactly the visible height (`100dvh`, with a
   `100vh` fallback) and the page never scrolls. A real phone browser leaves far less than the
   device: Safari on an iPhone 15 shows about 393 x 659 with its bars up, an iPhone SE about
   375 x 548. Emulating 390 x 844 hides the problem; test the real sizes. (web.dev, "The large,
   small, and dynamic viewport units": the small viewport is the safe size that always fits.)
2. THE BOARD FITS WHAT IS LEFT. Lay out the chrome first; the board takes the rest and scales to
   fit inside it, keeping its shape and leaving margins (the FIT mode web game engines default
   to). Never size the board to the width and let the chrome fall off the bottom. Zoom (pinch, a
   double tap, buttons) is the answer to a small board, not a scroll.
3. CENTER FOR PLAY, CORNERS FOR HANDS, TOP FOR MENUS. The board in the middle, clear. The action
   that ends a turn (Complete, Deal, End turn) at the foot of the screen in the thumb's reach, in a
   row of its own: beside a row of tabs it crowds them (David, 2026-10-05). Menus and help at the top. (Apple, WWDC26 "Make your game great with touch": thumb regions for frequent
   actions, the top for less frequent ones, keep the center clear, respect the safe areas.)
4. CONTROLS ON THE BOARD'S OWN CORNERS. A button that floats over the board sits on the board's
   corner wherever the fit puts it, never on the frame around a letterboxed board. Two groups on
   the same edge step apart where they would meet, and a group wider than the board slides into
   the margin, never off the screen. Beside a small board with room in the margin, a group may
   stand just outside the board's corner, so it covers none of it.
5. WORDS ON A PHONE ARE FEW AND TAPPABLE. A fixed strip of text (a hint, the order) gets two lines
   and scrolls inside itself; the rest is one tap away. Icon buttons that do things carry their
   word under the icon. Every target stays 44 px.
6. SIDEWAYS IS ITS OWN LAYOUT. A phone on its side fits the board to the height and may scroll to
   the cart; it is checked at 740 x 360.

The skills that go deeper: `apple-design` (gestures, sheets, safe areas, springs), `impeccable` in
its adapt mode (layouts across sizes), `emil-design-eng` (the feel of drag and drop).

## FIRM: a finger is not a mouse (a board or puzzle game)

David, 2026-10-12, after playing Device Assembly on his phone: "I couldn't plug things in or connect
things very easily with my fingers the menu at the bottom felt like it was taking up the screen all
the time". Measured that night at the screens a phone browser really leaves: the wall was 28% of an
iPhone SE's screen with 11 px squares, and a thumb that missed by 10 to 20 px rebuilt 12 of 112 wall
runs. Every HTML button already passed 44 px; the faults lived inside the board drawing, where no
check looked. Plan, sources and numbers: docs/HU-PHONE-PLAY-PLAN-2026-10-12.md. Headwall is
the reference build (search PHONE PLAY in src/fun/headwall/index.html).

1. ANYTHING YOU PRESS IS 44 PX AT THE REAL SCREEN, board targets included, however small they are
   drawn. A touch lands within about 7 mm of where it is meant at the screen's centre and 12 mm at
   its corners (Hoober); an iPhone has about 6 CSS px to the millimetre. A port may keep the part's
   face for the part (the outer half of its disc), but it reaches 22 px out and 12 px in.
2. THE GAME DECIDES WHAT WAS PRESSED FROM THE EXACT POINT, never from `event.target` alone. Chrome
   moves a touch to the nearest thing it judges pressable (touch adjustment): in the game a mouse in
   the middle of a small part picked it up and a touch at the same point took its port. Read
   `document.elementsFromPoint`; where two press areas overlap, the nearer centre wins, not the one
   drawn last (Headwall's `hitAt`).
3. EVERY MOVE WORKS WITH TAPS ALONE: tap a piece, tap where it goes; tap a port, tap a port; a piece
   already on the board has a Move. Dragging stays as the quick way (WCAG 2.2, 2.5.7).
4. THE GAME AIMS FOR YOU. On touch a piece lands on the nearest place it fits within a fingertip
   (44 px) of the aim, and the end of a run on the nearest port that can take it; only those places
   light, and the one it will take shows before the finger lifts. Where nothing fits that close it
   lands where it is. A mouse places exactly (`landingsFor`, `aimLanding`, `portNear`). A drag has
   TWO aims, the piece drawn above the thumb and the thumb itself, and the nearer counts: people put
   the thumb on the place they mean (David on the daily, 2026-10-14: "my finger still does not line
   up with the touch screen"; with the end riding 40 px above, a thumb on an outlet left the hose
   loose 12 times in 15). A place that FITS beats a nearer one that does not: an oxygen hose 20 px
   off went into the air outlet one square over. A thumb RESTING INSIDE a place the piece fits takes
   it, ahead of the place under the drawn piece: the lift is about two squares, so two places two
   squares apart (the arms of a Y) were a coin toss (Headwall, 2026-10-16).
5. WHAT YOU HOLD RIDES CLEAR OF THE THUMB, AND THE PIECE DECIDES. A held piece is drawn above the
   thumb, and where the piece is drawn decides where it lands, so the thumb may leave the board to
   reach the bottom rows; a piece pulled off the board goes back to the tray. The end of a run rides
   above the thumb the same way, once the thumb has really moved. A place within reach of the thumb
   (rule 4) counts as on the board even when the piece above it has left the top edge.
6. NOTHING SITS ON THE BOARD WHILE YOU AIM: no button dock, no drop strip, no zoom buttons while a
   piece is in the hand. A picked piece's buttons and the drop-back zone take the tray's row, where
   the thumb already is.
7. THE BOARD GETS THE SCREEN: on an upright phone it is as wide as the screen allows or at least 55%
   of its height. Status is one line that opens whole on a tap; the tray is one slim row whose full
   list opens as a sheet; rows keep one height whatever they show, so the board never refits under a
   thumb.
8. A TAP IS A TAP. On touch a drag starts at 10 px (a mouse at 4); a sideways swipe on a tray is the
   tray scrolling. Nothing destructive happens on the press: a run comes off when it is pulled, a tap
   on its port picks it (WCAG 2.5.2). THE TRAY DECIDES, NOT THE BROWSER: left to `touch-action: pan-x`,
   the browser claims any pull that starts more sideways than up, so a straight pull from a tile to
   the far side of the board never lifts the piece (David, 2026-10-14: "i also cannot drop down the
   cart of tools"). The tray takes every touch and scrolls itself; a pull that rises at more than
   about 25 degrees lifts the piece, a flatter swipe scrolls, and only where there is more tray to see
   (Headwall's `rowSwipe`). The tray always has a way to open whole (All parts).
9. A MISS COSTS NOTHING: a drop that fits nowhere goes back where it came from, and the screen says
   why in a few words.
10. A CONNECTION IS SEEN, AND FELT WHERE THE PHONE ALLOWS: it snaps and pops, and buzzes on phones
    that can (`navigator.vibrate`, Android; Safari on iPhone cannot), with a Settings row to turn it
    off. Never the only signal.
11. UNDO IS ONE TAP AND ALWAYS ON SCREEN, beside the action that ends the turn.
12. TESTED LIKE A THUMB. The touch test plays at the screens a phone browser leaves (375 x 548,
    393 x 659, 360 x 640, 430 x 746) at three device pixels to the CSS pixel, sends moves about 16 ms
    apart the way a touchscreen does (moves sent with no time between read as a flick, and Chrome
    swallows the next tap), and misses on purpose: at 10 px every wall rebuilds by drag and by taps
    alone; at 20 px every wall rebuilds by drag for a player who looks at the drop preview; taps 20 px
    off are counted, not gated. It drags as two players, one watching the piece above the thumb and
    one putting the thumb on the place. It reaches the tray by touch alone (a straight pull from the
    tile, the tray swiped, the sheet opened by a tap; nothing clicked or scrolled by script), turns
    and sets pieces with the game's own buttons, and plays the wall people actually play (Headwall:
    Assembly: today's daily, to Complete). The 2026-10-12 test passed while David could not build the
    daily: it never played a dealt wall, opened the tray by script and always pulled a piece straight
    up first. A test that aims to the pixel proves nothing about a thumb. Headwall's is
    `npm run da:thumb` (scripts/da-thumb.js); the helpers any game can use are scripts/lib/thumb.js.

## Checks before a game ships

- `node --test tests/game-shell.test.js` and the game's own tests.
- `npm run phone -- /the/game/` clean at all nine viewports; the bar is ONE row at 360x740 and
  740x360.
- A board or puzzle game: the real phone screens with nothing to scroll (`npm run da:qa` checks
  Headwall at five; copy its `screens()` for another game).
- A board or puzzle game: the thumb test passes (a finger is not a mouse, rule 12; scripts/lib/thumb.js).
- Screenshots of the first screen at 360x740 and 1280x800 next to Vital Stats'.
