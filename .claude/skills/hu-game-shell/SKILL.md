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
day, and Device Assembly is the reference build (src/fun/device-assembly/, THE SCREEN).

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

## Checks before a game ships

- `node --test tests/game-shell.test.js` and the game's own tests.
- `npm run phone -- /the/game/` clean at all nine viewports; the bar is ONE row at 360x740 and
  740x360.
- A board or puzzle game: the real phone screens with nothing to scroll (`npm run da:qa` checks
  Device Assembly at five; copy its `screens()` for another game).
- Screenshots of the first screen at 360x740 and 1280x800 next to Vital Stats'.
