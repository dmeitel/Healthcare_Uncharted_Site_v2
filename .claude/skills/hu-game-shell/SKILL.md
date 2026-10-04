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
  game action, such as Silence or Walls), then the kit's "?" and Menu, mounted by the game's
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

## Checks before a game ships

- `node --test tests/game-shell.test.js` and the game's own tests.
- `npm run phone -- /the/game/` clean at all nine viewports; the bar is ONE row at 360x740 and
  740x360.
- Screenshots of the first screen at 360x740 and 1280x800 next to Vital Stats'.
