# HU TOOLSET EXAMINATION · 2026-08-10

Full impeccable examination of all 8 tools + the Atlas. Method: four parallel
assessments (Career Tree deep-dive, flagship cross-review, secondary cross-review,
deterministic sweep) synthesized here. Evidence lines cite real source. The
Career Tree section is the NEXT COMMIT scope per David's call.

---

## THE PORTFOLIO VERDICT

The repeated failures are not design failures. They are PROPAGATION failures.

Rules enforced by an API never regress: the 250ms phone motion cap lives inside
HUKit.dcap and holds in every tool that calls it. Rules enforced only by
documentation regress in every file that predates or copy-pastes them: the 44px
touch floor, the Lucide-only icon rule, the 699px phone line, the one-sheet
promise. The maps' twin chrome (~250 duplicated lines between operators and
multi-lens) has already diverged once: multi-lens got the 44px phone pass,
operators never did. The reference implementation currently fails its own floor.

Conclusion that should drive the roadmap: EXTRACT THE CHROME INTO THE KIT.
Every doc-enforced rule that moves into shared code stops rotting.

Also load-bearing: the detector's directory sweep SKIPS .njk files. The four
.njk tools (compass, career-tree, iceberg, multi-lens) have never been in a
casual sweep. Run them by name.

---

## WHAT WORKS · the shared grammar earning its keep (keep, codify, extract)

1. THE ONE-STEP-BACK CONTRACT. Hardware back, Esc, and the X walk the same
   single-step path in operators, multi-lens, and compass. No exit loses more
   than one level. This is the toolset's signature process move.
2. HUKIT IS REAL. dcap (motion cap + reduced-motion in one function), one sheet
   with detents, backGuard, locate. Where it's used, the budget never regresses.
3. URL-ADDRESSABLE STATE, 3 of 4 flagships: push-on-scope / replace-on-tweak /
   restore-before-paint + copy-link chips. Share, refresh, back all just work.
4. FACES STATE THEIR VALUE. Search pill carries the query+count, metric pill
   carries metric+year, scope chip IS the breadcrumb. No mystery canvases.
5. LIVE REGIONS IN ALL FOUR FLAGSHIPS + 3 of 4 secondaries, same
   clear-then-rAF implementation.
6. THE SELECTOR-POP CONTRACT propagated correctly to vendor, iceberg, atlas
   (Esc, focus return, arrow walking, phone sheet form, 44px hover:none bumps).
7. EMPTY STATES TEACH THE FIRST TAP in every flagship + multi-lens's
   demonstrated-use coach (the model onboarding).
8. ▸/◆ catalog markers, layers/pin concept icons, complete light-theme blocks:
   consistent fleet-wide.
9. ZERO hover-scale anywhere in the fleet. The house held that line.

---

## REPEATED PITFALLS · ranked by user impact

| # | Pattern | Where | Severity |
|---|---|---|---|
| 1 | BESPOKE OVERLAYS instead of HUKit.sheet: no Esc, no backGuard, no detents. Each tool reinvented the inspector | vendor detail, iceberg #rp, atlas HUD/conn/help, sql drawers (best bespoke), hospital phone panel (animates height 0→440px) | HIGH · the defining pitfall |
| 2 | TOUCH FLOOR breaches | operators gv-pills 38px (no phone bump); multi-lens ovbtn 40px; career-tree tabs 38/close 34/corner controls 22px; atlas closes 26px + cf-chips ~21px; iceberg rpMobClose 22px; sql quick-btns ~27px; hospital dep chips | HIGH · a third of traffic is phones |
| 3 | HISTORY MODEL failures | ATLAS: replaceState for everything → hardware back EXITS THE SITE from every deep-link arrival (the site's most consequential nav bug; every article funnels here). Hospital: no URL state at all, refresh loses everything. Career tree: pushes history but never wires backGuard | HIGH |
| 4 | BREAKPOINT DRIFT off the 699 line | hospital 767 · iceberg 768 · sql 640 · vendor 700 · atlas 768 · career-tree runs 699+700+720 in ONE file | MED-HIGH |
| 5 | PHONE FEATURE-DROPPING instead of reflow | hospital hides its ONLY filter ≤767; iceberg hides ALL guidance ≤768; career-tree hides every hint line | MED-HIGH |
| 6 | SUB-11px FUNCTIONAL TEXT: 214 declarations fleet-wide (career-tree 60, hospital 37 incl. 7px, iceberg 24, atlas 23, maps 19+19, sql 15, compass 9, vendor 8) | all | MED (queued Legibility Floor migration) |
| 7 | transition:all — 36 instances (career-tree 9, iceberg 6, atlas 7, sql 5, vendor 5, hospital 3, compass 1; maps clean) | 8 files | MED, mechanical |
| 8 | DUPLICATED-DIVERGED CHROME: gv/lv twin (~250 lines, diverged once already); selector-pop JS pasted 3× | maps, vendor/iceberg/atlas | HIGH leverage |
| 9 | LAYOUT-PROPERTY animation: hospital height 0→440 sheet; iceberg height .3s; career-tree max-height/height + margin-top; vendor width morphs; knob left .15s in both maps | 6 files | MED |
| 10 | ICON DRIFT: emoji/glyphs where Lucide is law (sql 🏆🔍💡, multi-lens 📊 in the PRIMARY selector, hospital emoji hints, atlas + − ⊙ ? unlabeled, ✕ everywhere) | ALL tools | LOW each, systemic |
| 11 | NO KEYBOARD PATH: hospital has zero keydown handlers file-wide; units unreachable | hospital | HIGH for that tool |
| 12 | Half-built tablists (role=tab, click-only) | both maps | MED |
| 13 | Selection color forks: iceberg PURPLE GLOW + scale (only Ink State violation left), sql blue (documented), atlas purple crumbs | 3 tools | MED |
| 14 | Timer-based guidance; em dashes in hospital UI copy; dead CSS (vendor, iceberg); CDN runtimes (sql, atlas); atlas 9.4MB graph on idle for EVERY visitor incl. phones | misc | LOW-MED |

---

## THE CAREER TREE · next-commit scope

### The skitter, diagnosed (ranked)
1. **LOD text pop at k=0.5, zero hysteresis, fired mid-gesture** (L6007-6008 →
   styleTiles L2330-2338): crossing 0.5 hard-toggles display:none on ~158 tile
   titles and rewrites attrs, DURING the wheel/pinch. THE zoom skitter.
2. **Header type recomputed every zoom tick** (syncHeadType L5639-5645 writes
   font-size per tick; updateHeadClip reads layout per tick): labels "swim"
   against tiles while zooming.
3. **The world re-flies on every tap** (onNodeClick L2372-2379): every select =
   full board tween (520ms) + fit flight + a competing revealNode tween; every
   DESELECT (incl. sloppy empty-canvas taps and sheet swipe-downs) re-expands
   the board AND flies the camera home. Nothing holds still for two taps. THE
   tap jumpiness, worst on phone.
4. **Double/triple camera fits on view entry** (setView L5944-5946: two rAF fits
   + a 180ms setTimeout fit; ResizeObserver refits again).
5. Hover cost on desktop (full edge restyle per hex enter/leave + per-move
   getBoundingClientRect), 9× transition:all, phone sheet animates
   max-height/height, sticky hover on touch. No hover-scale (absent, good).

### The commit plan (David's focus: easier to use, follow, less skittery, better on phones)

1. **(M) Steady the zoom.** Hysteresis band around k=0.5 (enter <0.45, exit
   >0.55), opacity fade instead of display toggle, restyle at gesture END only;
   stop per-tick font-size writes in syncHeadType (quantize to 2-3 steps or
   counter-scale via transform).
2. **(M) One motion per tap.** On phone, deselect/sheet-dismiss parks the
   camera (no fitDefaultGroup flight); kill the 180ms settle-refit double-jump
   in setView; fit supersedes revealNode explicitly instead of interrupting.
3. **(S) Phone floors + anchor.** Tabs/buttons 38→44 (L1035-38), closes 34→44
   (L1221), tile corner controls ≥28px padded hit areas (L1015-17); shell
   height → calc(100dvh - nav) (L16); zoom floor so hexes never render below a
   tappable size (L5995).
4. **(S) Wire HUKit.backGuard** (the maps' proven pattern) so hardware back
   walks the X path instead of unwinding tab history under an open sheet.
5. **(M) Teachable first tap.** Pin pair ("I've held this role / aiming for
   it") moves to the TOP of the panel (currently LAST of 8 blocks, below the
   fold at dt-half); snapped/collapsed board state gets a named chip in the
   applied strip ("Focused: X · Show all"); restore ONE hint line per board on
   phone (hintsMin already retires it after first gesture).

Queued, not this commit: touch-capable My Path reorder (HTML5 DnD is dead on
phones), one wheel contract instead of three, the 60-instance 11px migration,
enumerate the 9 transition:all (L36, 47, 259, 264, 272, 375, 686, 779, 789).

### Build anchors (so the build session hunts nothing)

File layout: style L13-1223 · markup L1224-1608 · script L1611-6526. The file
is 488KB: use Grep + targeted Read slices, never whole-file reads.

- Item 1 (zoom): zoom handler L6007-6008 → styleTiles L2330-2338 (called from
  L2283 region); syncHeadType L5639-5645 + updateHeadClip L5646-5653 (layout
  reads per tick); edu/atlas boards do the same threshold via CSS class at
  L5019 and L5380 (cheaper; give them the same hysteresis).
- Item 2 (one motion per tap): onNodeClick L2372-2379 (render(true) + fit at
  L2377 vs revealNode's competing 280ms tween at L2568, 2574-2594); deselect
  paths = empty-canvas tap L6019 and dismissPanel L2607-2612 (both run full
  expand + fitDefaultGroup); setView triple-fit L5944-5946 (two rAF + 180ms
  setTimeout); ResizeObserver refit L6013-6016. Board tween clock L2076
  (520ms desktop / 250 phone).
- Item 3 (floors): phone tabs/buttons 38px L1035-1038; panel/modal closes 34px
  L1221; tile corner controls 22px L1015-1017; atlas lens 40px L1058; edu
  zoombar 40px L1101; desktop zoombar 26px L145; shell height L16
  (100vh - 64px → 100dvh - phone nav); scaleExtent min 0.07 L5995.
- Item 4 (backGuard): HUKit.sheet call L6391; popstate handler registers ~L5919
  (backGuard.consumed() must be checked FIRST there); history pushes at L5943
  (tabs), L6076, L6279 (presets/survey). Pattern source: operators-map
  L746-754/1156-1201 or multi-lens L521-525.
- Item 5 (teachable first tap): pin pair renders LAST at L2537-2542 → move to
  top of panel body (after title, before summary/BLS); applied strip renderer
  L5942 region (add "Focused: <group> · Show all" chip when board is snapped);
  phone hint hiding L1043 (restore ONE line per board); hintsMin retire logic
  L6451-6453; Free-look toggle title-only label L1266.

### Verification checklist for the build

- Zoom slowly through k≈0.5 on the career board: labels FADE once, no popping,
  no mid-gesture stall; repeat on edu + atlas boards.
- Tap a hex, tap empty canvas, swipe the sheet down: camera moves ONCE on
  select, does NOT fly home on deselect/dismiss (phone).
- Enter each tab: camera lands once, no 180ms re-jump.
- Phone (his device): every tab/close/corner control ≥44px; sheet peek fully
  visible with URL bar expanded (dvh fix); hardware back with sheet open =
  closes sheet, does NOT switch tabs or exit; second back = normal history.
- Pin pair visible at dt-half without scrolling; snapped state shows the
  Focused chip; chip's "Show all" restores; one hint line present per board
  until first gesture.
- Reduced motion: all the above with zero animation. Both themes. 699px only
  (the file's stray 700/720 queries should collapse to 699 while in there).
- No-browser verify workflow: curl + node vm parse on built page, logic repro
  in node; final feel QA is DAVID ON HIS PHONE (the skitter is a felt bug;
  server at localhost:8080, kill orphans first per reference_dev_server).

Heuristic mini-scores: H1 status 3 · H3 control 2 · H6 recognition 2 ·
H7 efficiency 4 (the tool's best dimension) · H8 minimalism 2.

---

## CROSS-TOOL RECOMMENDATIONS · sized

**S · the fleet-day batch (one session, mostly mechanical):**
- Touch-floor parity: copy multi-lens's 44px block into operators; bump ovbtn/pinbtn to 44
- Purge all 36 transition:all (name the properties)
- Esc closes the topmost transient in vendor/iceberg/atlas (3 lines each)
- role="status" on both maps' status chips
- Delete dead CSS (vendor controls-bar block, iceberg #bb + unreachable scale branch)
- SQL: localStorage for solved/hints; emoji → Lucide
- Hospital: em-dash copy scrub (voice-kernel hard stop)

**M · per-tool retrofits (a session each):**
- HOSPITAL PROCESS RETROFIT: phone panel → HUKit.sheet (deletes the height
  animation, buys detents/backGuard/Esc); keyboard path (tabindex+keydown on
  units, buttons for dep chips); ?unit= param; 699/1099 lines; phone filter home
- ATLAS: history model → push-on-scope like the iceberg's own serializer
  (fixes the back-exits-site bug, the #1 nav defect); toolbar to Lucide with
  aria-labels; transient-surface exclusivity; gate the 9.4MB idle prefetch
  behind PHONE_MQ/intent
- ICEBERG: re-ink selection (retire the purple glow+scale for Ink State);
  restore phone guidance inside the layer sheet
- VENDOR: serialize q/sort/open-vendor; detail panel → 250ms transform +
  Esc/backGuard; sort select → selector-pop
- ICON AMNESTY across all tools (Lucide table from HU-TOOL-SHELL.md)

**L · the structural payoff (before any NEW tool is built):**
- EXTRACT THE MAP-TWIN CHROME into the kit (bar row, status chip, cluster,
  insets, legend, drawer tabs + X-walker, right-dock + resize). Two field-tested
  tools prove it stable; the divergence proves copy-paste is rotting it.
- CONVERGE THE FOUR BESPOKE INSPECTORS onto HUKit.sheet ("one bottom sheet
  site-wide" for the half of the fleet that never got it) + kit the selector-pop JS.
- ATLAS PHASE 5 decision (phone restack vs desktop-first) when GoatCounter
  mobile share justifies it.

**Sequencing:** Career Tree commit first (this doc's middle section IS the
scope). Then the S fleet-day. Then hospital + atlas retrofits. Kit extraction
before any new tool joins the fleet.
