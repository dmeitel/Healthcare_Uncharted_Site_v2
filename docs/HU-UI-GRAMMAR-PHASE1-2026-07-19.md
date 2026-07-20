# UI GRAMMAR · PHASE 1: Career Tree Phone Discipline
### Build notes, 2026-07-19. Reference implementation of the HU-UI-GRAMMAR budget rules.

One file changed: src/tools/healthcare-career-tree/index.njk. Desktop behavior is intentionally untouched except two small upgrades noted below. Everything else is gated behind the phone breakpoint.

ONE breakpoint now: 699px, the same line where the site-wide selector-pop becomes a bottom sheet (hu-global.css). The old 600px and 640px phone blocks folded into it.

---

## What changed, by budget rule

**Rule 5 · Motion: 250ms ceiling on phones.**
Every tween now routes through a `dcap()` helper: full 520ms on desktop, capped at 250ms on phones, zero under prefers-reduced-motion. That covers all three board renders, every camera fit, the zoom buttons, and the view cross-fade. This is the "delay" fix. The board should feel snappy now, not syrupy.

**Rule 1 · One transient surface on phone.**
Opening any selector sheet (Pathways, Metric, Views, Help, Search) closes the detail panel. Opening the detail panel closes any selector sheet. On desktop nothing changes, two surfaces are still allowed there.

**Rule 3 · The detail panel is now a detent sheet on phones.**
Grabber bar at the top plus the X. Three positions: peek (just the title), half (the default, ~52% of screen), full (~92%). Drag the grabber to move between them, tap it to flip half/full, drag it down past the bottom to dismiss. The board above stays live at peek and half. Swipe-dismiss runs the exact same code path as the X, so snap-mode cleanup still happens.

**AOE chrome collapse.**
- The Focus lens dock no longer floats over the canvas. On phones it becomes a horizontal rail attached to the top of the board frame. Nothing covers hexes anymore.
- The zone-tally HUD is one scrollable row, and it gets out of the way twice over: it fades while your finger owns the camera (pan or pinch), and while the detail sheet is open.
- The inline search box and its counter retire on phones (see search below). The Select button stays.

**One search placement.**
On phones the ONLY search is the magnifier in the toolbar, which opens the bottom-sheet search. To make that honest, the global search now also covers CREDENTIALS: type "nclex" or "rrt" and a Credentials section appears, picking one jumps to the Education Matrix with the card selected and framed. This works on desktop too, which means desktop gained a search corpus it never had. The edu and AOE inline searches still exist on desktop.

**Education Matrix aside.**
On phones the credential detail column stops competing with the board. It is hidden entirely until you select a credential, then it appears as a block under the board (capped at 44% of screen height).

**Guides pre-collapse on phones.**
The hint lines and the board blurb never render at phone width. Same idea as hints-min, just from the very start. The Help "?" still carries the full legend.

**Toolbar collapses to essentials.**
The − / + zoom buttons hide on phones (pinch does that job; Fit stays). The board-docked zoombars on Education and AOE already had 40px targets and stay.

## Surface count at 390px, AOE view (the worst offender)

BEFORE: title row wrapping to 2-3 rows (title + hint + Select + search + counter), lens dock floating on the canvas, HUD floating on the canvas, plus whatever transient was open. Floating surfaces over the canvas: two, sometimes three.

AFTER: one title row (title + Select), lens as part of the board frame, ONE floating surface (the HUD row) that yields to gestures and sheets, at most one transient. That is inside budget.

---

## Test plan (phone, ~390px)

1. Land on the page. My Path should be the first view (it always was, confirmed as the contract now).
2. Career Matrix: tap a hex. The sheet opens at HALF. Drag the grabber up (full), down (peek), down again past the bottom (dismisses, board expands back if it was snapped).
3. With the sheet open, tap the Pathways selector. The sheet should CLOSE as the selector opens. And the reverse.
4. Tap the toolbar magnifier, type "nclex". Expect a Credentials section. Pick one. Should land on the Education Matrix with the card selected and centered.
5. Education Matrix: no search box in the header row. Select a credential, the detail block appears BELOW the board. Deselect (tap the board background), it disappears.
6. AOE: Focus rail sits on top of the board frame, no floating island. Pan the board with a finger, the bottom tally chips fade while moving, return when you stop.
7. Open a tile's detail on AOE: the tally chips stay hidden while the sheet is up.
8. Everything that moves should finish in a quarter second. If anything still feels like it is dragging, that is a bug against rule 5.
9. Rotate to landscape and back. Nothing should stack or double up.
10. Desktop spot-check: panel still docks right, selectors still pop from their buttons, − / + visible, edu and AOE inline searches still there, credentials now show in the global search.

## Watch list

- Camera centering when the edu detail block appears: the focus tween measures the board BEFORE the block takes its height, so the selected card can land slightly high. Cosmetic; on the Phase 2 list when the aside converges on the shared sheet.
- The lens rail scrolls horizontally when the four pills overflow ~360px. No wrap by design.
- The AOE inline search losing its filter-highlight behavior on phones is deliberate: the pick-and-jump grammar replaces filter-while-typing at phone width. Desktop keeps both.
- The 66vh sheet became 52dvh at half. If half feels too short for role detail, bump `#hct-panel` max-height in the 699px block.
- Multi-select bar and the detail sheet both own the bottom edge; they cannot appear together today (select mode taps do not open panels). If that ever changes, revisit.

## Verification record

- Eleventy build clean (v3.1.5, 42 files).
- All 6 inline scripts on the built page parse (vm.Script), JSON-LD valid.
- 19/19 static wiring checks (phone flag, dcap coverage with zero raw durations left, transient rule both directions, detents, lens rail, HUD yields, search unification, edu aside).
- Logic repro on the built source: credentials search section renders from eduCards, deduplicates repeated faces, falls back to the creds file before the edu board has rendered, no-match and empty-query paths correct. 5/5.
- Not verifiable headless: grabber drag feel, gesture fade timing, detent snap points. That is the phone test above.

Rollback: this is one file. `git checkout -- src/tools/healthcare-career-tree/index.njk` before committing, or revert the commit after.
