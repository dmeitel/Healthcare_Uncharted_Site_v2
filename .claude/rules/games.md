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

## Tests

- Every game exposes a test hook when `window.__UG_TEST` is set before its script runs:
  `window.__<short>` (`__ug`, `__hs`, `__er`, `__da`) carrying the engine functions, the state,
  the dispatcher and the settings. Tests load the inline script into a vm sandbox with the strict
  DOM stub in `tests/helpers/`.
- A multiplayer game has a fake-bus test (two sandboxes, JSON-cloned messages, the guest's
  packed run byte-identical to the host's after every intent) and appears in
  `scripts/backend-check.js` so the real relay is checked before a deploy.
- `npm run verify` green and `npm run phone -- <path>` clean across its eight default viewports
  (portrait, landscape and both sides of the 699 line) before a game ships.
  The pane's screenshots can time out; Playwright shots into tmp/ are the reliable proof.

## What stays under the change budget

The engine, the level data, the part database and the copy of a shipped game are maintenance
unless David opens a design phase on that surface (CLAUDE.md, DECLARED DESIGN PHASE). Polish
rounds on a game in an open phase are free; rewrites of its rules are not.
