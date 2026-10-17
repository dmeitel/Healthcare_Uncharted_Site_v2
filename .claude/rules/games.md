# Games · the engine contract

Applies to every game page under src/fun/ and src/secret-menu/, and to the shared game kit under
src/assets/js/. Written 2026-09-20 from what the hospital game already does and what the table
kit needs from any game that joins it (docs/HU-GAME-DESIGN-2026-09-06.md section 12).

## The engine is data plus verbs

- All game state lives in ONE plain object. It serializes to JSON with nothing lost: no
  functions, no DOM nodes, no live catalog objects inside it. Catalog things (a CEO, a part, a
  level) travel as ids and re-link on restore.
- Every mutation is a verb through one dispatcher, `dispatchAct(verb, data)`. UI handlers call
  the dispatcher; they never edit state directly. This is what lets a guest send a verb as an
  intent and the host apply it.
- Rendering reads state and writes the DOM. The tick, the turn, the quarter and the scoring
  never touch the DOM. If a function both computes and paints, split it.
- Randomness comes from the game's seeded generator (`hu-rng.js` once it exists), never bare
  `Math.random()` inside the engine. The seed rides the save, so a run replays from its string
  and a test pins a seed instead of monkey-patching `Math.random`.

## Saves and the wire

- A run packs to one object (`packSave`) and unpacks from it (`applySave`), both UI-free and
  callable headless. The string form is the kit's `hu-save.js`: a prefix, then base64 of
  deflated JSON, with an uncompressed fallback prefix.
- The packed save IS the multiplayer envelope. A game that can save can be dealt out as seats;
  a game that cannot save is not ready for the table.
- Seat ownership is a table, `VERB_SEAT`, mapping every verb to a seat or to `host`. Verbs not in
  the table are local. The host refuses any intent whose seat is not held by the sender.

## The kit is the only network code

- No game page opens its own socket, channel or fetch to the relay. `hu-table.js` owns the
  lobby, the seats, the roster, the envelope, resume and rejoin, and the transport (same-browser
  and internet, with the join queue). A game adapts to the kit; it does not fork it.
- The backend host is named in one place per game and must match the CSP; a test enforces it
  (`tests/backend-host.test.js` is the pattern).
- A room bigger than about eight people turns on the kit's `inbox` (guests talk to the host alone,
  by REST) and `spacing` (the host's broadcasts held apart as the room grows). The relay counts a
  message once per receiver and the free plan allows 100 a second, so without them one busy moment
  in a 24-person room disconnects people. Vital Stats' team play is the pattern (2026-10-01).

## Menus

Adopted 2026-09-23 on David's yes (DECISIONS 15). The reference apps, the prompt words and the
reasoning are in docs/HU-GAME-MENUS-2026-09-23.md; where each game stands is in
docs/HU-GAME-REVIEW-2026-09-23.md. A game's menus are built from the kit, never by hand:
`HUKit.dialog` (every card), `HUKit.gameMenu`, `HUKit.settings` (with `HUKit.settings.assist`),
`HUKit.howTo` and `HUKit.confirm`. Tests in tests/hu-kit.menu.test.js.

1. The first screen has one primary button, and it starts or resumes play. Everything else has a
   default.
2. One game menu button (`gameMenu().button()`), in the same corner in every game: Resume, Help,
   Settings, Restart, Leave, Site menu, in that order.
3. Every card closes on its X, on Esc and on the phone back gesture. With nothing open, Esc opens
   the game menu.
4. Help is the "?" (`howTo().button()`); the how-to card opens by itself on the first visit only.
   Where a phone bar cannot hold the "?" in one row, it may yield below 380px, never the menu:
   Help is always the menu's second row (Alarm Fatigue, 2026-09-23).
5. Settings are toggle rows, remembered between visits. Nothing repeats a device setting: motion
   follows the device, the theme follows the site. A game with a clock offers More time; a game
   built on sound offers Show sounds as text.
6. The same words for the same act in every game: Continue, New run, Restart, Help, Settings,
   Leave, Share, Next. A game may dress up its play button ("Clock in"), never the system verbs.
7. The primary button comes first, left in a row or top in a stack. Cancel is never the primary.
8. A destructive act asks once through `HUKit.confirm`, and the button names the act. The kit
   refuses "Yes" and "OK".
9. An item shows its name and one number; the paragraph goes behind `HUKit.peek`.
10. Every menu reads and every button is reachable at 740x360.

## Touch

Adopted 2026-10-12 on David's yes (DECISIONS P1 and P2), after he played Device Assembly on his
phone and could not plug things in. The twelve rules are the hu-game-shell skill's "a finger is not a
mouse"; the plan and the numbers are docs/HU-PHONE-PLAY-PLAN-2026-10-12.md. In short, for any game
played on a board:

1. Anything pressed is 44 px at the real phone screen, board targets included.
2. What was pressed is read from the exact point (`document.elementsFromPoint`), not `event.target`:
   Chrome moves a touch to the nearest thing it judges pressable. The nearer centre wins an overlap.
3. Every move works with taps alone; dragging is the quick way (WCAG 2.5.7).
4. On touch the game aims: a piece lands on the nearest place it fits within 44 px of the aim, and a
   drag has two aims, the piece drawn above the thumb and the thumb itself (2026-10-14). A place that
   fits beats a nearer one that does not, and a thumb resting inside a place the piece fits takes it
   (2026-10-16).
5. Nothing sits on the board while a piece is held; the board gets the screen.
6. A drag starts at 10 px on touch; nothing destructive happens on the press (WCAG 2.5.2). A tray
   decides between its own scroll and a pull that lifts a piece; the browser's pan-x does not.
7. The touch test plays at the four real phone screens, moves at a touchscreen's pace and misses on
   purpose (scripts/lib/thumb.js), reaches the tray by touch alone, and plays the wall people play
   (Headwall: today's daily, to Complete). A test that aims to the pixel proves nothing.

## Tests

- Every game exposes a test hook when `window.__UG_TEST` is set before its script runs:
  `window.__<short>` (`__ug`, `__hs`, `__er`, `__da`) carrying the engine functions, the state,
  the dispatcher and the settings. Tests load the inline script into a vm sandbox with the strict
  DOM stub in `tests/helpers/`.
- A multiplayer game has a fake-bus test (two sandboxes, JSON-cloned messages, the guest's
  packed run byte-identical to the host's after every intent) and appears in
  `scripts/backend-check.js` so the real relay is checked before a deploy.
- The top bar is the shared game bar (src/_includes/components/game-bar.njk), held by
  tests/game-shell.test.js; the skill hu-game-shell has the standard (2026-10-03).
- A puzzle game holds its puzzles to a sheet: every dealt one solves, every break of a solved one says where it broke,
  every hint reads on a phone (tests/device-assembly-puzzles.test.js), and a browser run pictures every one at a phone
  and a desk (`npm run da:qa`, drawn on the hub's Puzzles screen). A new puzzle is on the sheet before it ships.
- `npm run verify` green and `npm run phone -- <path>` clean across its nine default viewports
  (portrait, landscape and both sides of the 699 line) before a game ships.
- A board or puzzle game passes its thumb test (the Touch section above). Headwall's is
  `npm run da:thumb`, and `npm run da:qa` runs its quick pass.
  The pane's screenshots can time out; Playwright shots into tmp/ are the reliable proof.

## What stays under the change budget

The engine, the level data, the part database and the copy of a shipped game are maintenance
unless David opens a design phase on that surface (CLAUDE.md, DECLARED DESIGN PHASE). Polish
rounds on a game in an open phase are free; rewrites of its rules are not.
