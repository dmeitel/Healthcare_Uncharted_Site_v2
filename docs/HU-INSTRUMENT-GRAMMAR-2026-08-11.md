# HU INSTRUMENT GRAMMAR · 2026-08-11
### The shared design language of the maps and the Career Tree, and the build logic that keeps it from rotting

Written at David's ask at the close of the decks arc: "look at how the Tools maps and the
Career Tree design can be described and how we can optimize our build logic to follow our
impeccable design enhancements."

This sits ON TOP of three existing docs and does not repeat them:
- docs/HU-TOOL-SHELL.md owns the LAYOUT (regions, breakpoints, classes)
- docs/HU-UI-GRAMMAR.md owns the SURFACE CLASSIFICATION (2026-07-19 audit + phone discipline)
- docs/HU-TOOLS-EXAM-2026-08-10.md owns the DIAGNOSIS (what works, pitfalls, sequencing)

This doc owns the INTERACTION LANGUAGE and the ENFORCEMENT LADDER.

---

## 1 · WHY THIS EXISTS NOW

The decks arc settled it. The Pop Health Multi-Lens Map's drawer grammar moved onto the
Career Tree without a fight. The hubs' form-and-function rule became the tree's on-hex
verbs. The tree's look/focus split is a rule the maps half-followed by instinct and never
named. The language transfers. David's read: "the design elements of our build are
starting to work in multiple locations."

That is the moment to write the language down, because the exam doc proved the other half
of the story: rules enforced by an API never regress, rules enforced by a document rot in
every copy-paste. HUKit.dcap has never been violated. The 44px floor, written in three
docs, was breached in seven tools.

So this doc does two things. Names the laws. Then assigns each law an enforcement tier,
with a target tier and a donor implementation, so "follow the design system" stops being
a memory exercise.

---

## 2 · THE INSTRUMENT GRAMMAR · seven laws

Every canvas tool (both maps, the Career Tree, the Atlas, the Iceberg) is an INSTRUMENT:
a full-bleed working surface with floating chrome. These are the laws an instrument obeys,
with the tools that prove each one.

**LAW 1 · THE CANVAS IS THE PAGE.**
The working surface fills the viewport. Chrome floats OVER it with air; nothing docks
edge-to-edge except by explicit exception. Proof: MapLibre full-bleed in both maps; the
Career Tree board; the tree's v21 card retiring its full-height dock.

**LAW 2 · CHROME FLOATS, HUGS, AND CONVERTS.**
The detail surface is a floating drawer on desktop (10-12px air, radius 14, hugs its
content, internal scroll) and the SAME content as a detent bottom sheet on phone. One
content tree, two homes. Proof: multi-lens #lvSheet (right 12px, resizable) · Career Tree
#hct-panel v21 (top/right 10px) · every phone sheet through HUKit.sheet. The drawer can
carry a second menu as tabs in its fixed chrome (multi-lens Details|Display · tree
Details|Connections).

**LAW 3 · VERBS RIDE THEIR SUBJECTS.**
An action lives ON the thing it acts on, not in a bar that describes it from far away.
Proof: tree v24-25 (Focus line = the hex's own bottom sliver · fold ✕ and Simplify on the
column box · open-all on the zone box · Fold all floating on the field corner · Pathways
button retired because folding IS the filter) · maps (steppers flank the metric pill,
legend toggles live in the legend). The top bar keeps only verbs with no natural subject:
view tabs, metric, fit, free look, search.

**LAW 4 · READING IS FREE. MOVING IS EXPLICIT.**
A click that asks for information never reorganizes the view. Selection (whose card is
open) and focus (what the board is organized around) are SEPARATE STATE. Camera flights
and relayouts happen only on an explicit verb: Focus line, a search jump, a preset, Fit.
Proof: the tree's selectedId/focusId split, David-approved ("i like the way it sticks
around"). The maps follow it by instinct (hover isolates, click selects, nothing reframes
the map to show a popup). This is now the named rule for every future instrument.

**LAW 5 · ONE STEP BACK, EVERY DOOR.**
Hardware back, Esc, the X, and the empty tap walk the SAME single-step path: transient
popover → card/sheet → focus → grain (fan → spine → deck) → free. No gesture ever loses
more than one level. Proof: fleet backGuard contract + the tree's Esc walk. The exam
calls this the toolset's signature process move.

**LAW 6 · THE STATE ALWAYS HAS A FACE.**
Every non-default state is visible and dismissible: URL-addressable (push on scope,
replace on tweak, restore before paint), faces carry their value (metric pill says
metric + year, search pill says query + count), filter state renders as a removable chip.
Nothing invisible steers the canvas.

**LAW 7 · LEGIBLE AT EVERY ZOOM, TAPPABLE AT EVERY SIZE.**
Canvas type counter-scales against zoom with a quantized write-cache (no per-tick
thrash), every label runs a FIT LADDER (full → short → floated → hidden) instead of
overlapping a neighbor, LOD flips through a hysteresis band and fades (never pops), and
fits reserve fixed chrome (axis strips, open drawers) in BOTH the scale and the bounds so
"visible" and "reachable" always agree. Floors: 44px touch targets, 11px functional text
(counter-scaled canvas text exempt by design), the 699 phone line, dcap motion. Donor:
the Career Tree's v20-26 label and camera system, the fleet's best implementation.

The finish laws stay where they live: Quiet Precision materials (HU-RESKIN-QP3), the Ink
State Rule (state changes ink, never glow or scale), Lucide-only icons, the voice kernel
in every UI string.

---

## 3 · THE ENFORCEMENT LADDER · how build logic follows the system

Three tiers. The build-logic optimization is MOVING RULES UP THE LADDER.

- **T3 · DOC-ENFORCED** — written down, honored by memory. Rots.
- **T2 · CLASS-ENFORCED** — a shared CSS class or hook rule. Using it is easier than
  hand-rolling, and the detector flags drift at edit time.
- **T1 · API-ENFORCED** — a HUKit call. The budget physically cannot regress.

| Law / rule | Today | Target | Donor · path |
|---|---|---|---|
| Motion cap + reduced motion | T1 (HUKit.dcap) | T1 | done, never violated |
| Bottom sheet + detents | T1 (HUKit.sheet) | T1 | converge the 5 bespoke inspectors onto it (exam pitfall #1) |
| Hardware back | T1 (HUKit.backGuard) | T1 | wire the last holdouts (atlas history model first) |
| Phone line 699 | T3 (4 tools drifted) | T1 | export HUKit.PHONE_MQ + phone(); rule: never hand-roll the media query |
| Floating drawer (Law 2) | T3 (copy-pasted CSS, diverged) | T2 | donors: #lvSheet + #hct-panel v21 → a .hu-drawer class-set in hu-global (desktop float, radius, hug, tab strip) with HUKit.sheet already owning its phone form |
| Selector-pop | T3 (JS pasted 3×) | T1 | HUKit.pop(): open/close, Esc, focus return, arrow walk, phone sheet form |
| URL state convention | T3 (3 of 4 flagships, hand-rolled) | T2 | small HUKit.urlState helper for push/replace/restore; the convention doc stays the law |
| Canvas label kit (Law 7) | T3 (tree has it, others don't) | T2 | extract the tree's primitives (quantized counter-scale, write cache, measure cache, fit ladder) into hu-canvas-labels.js for atlas + iceberg + future boards |
| Look/focus split (Law 4) | T3 (tree only, unnamed elsewhere) | T3, but SPEC'D | it is 20 lines of state, per-tool wiring; enforce via the new-build checklist below, not an API |
| 44px / 11px floors | T3 → partially T2 | T2 | hu-global utilities + impeccable detector rules; the hook already runs on edit |
| transition:all / layout-prop animation bans | T2 (detector catches) | T2 | keep; the hook is the enforcement |
| Ink State, voice kernel, verbs-ride-subjects | T3 | T3 | design judgment; the checklist asks the question, a human answers it |

**The build-logic rule that falls out: a new tool may not hand-roll anything on the T1
or T2 rows.** If HUKit or hu-global has it, the tool calls it. If a tool needs a variant,
the variant goes INTO the kit first (the CRCST rule for code: no divergent copies).

---

## 4 · SEQUENCING · unchanged from the exam, enriched by the arc

1. **David's phone QA + commit of the decks arc** (in flight).
2. **S fleet-day** (exam list: touch floors, transition:all purge, Esc parity, dead CSS,
   em-dash scrub, SQL localStorage).
3. **Hospital + Atlas process retrofits** (atlas history model = the #1 nav defect).
4. **KIT EXTRACTION before any new tool**: map-twin chrome + the four bespoke inspectors
   onto HUKit.sheet + selector-pop into the kit + the NEW donations this arc created:
   the .hu-drawer class-set and hu-canvas-labels.js.
5. **The Career Tree phone build** conversation applies Law 2's "one content tree, two
   homes" at the BOARD level (the hubs precedent: one view for computers, another for
   phones) — the first new build that gets gated by the checklist below.

---

## 5 · THE NEW-BUILD CHECKLIST · the impeccable gate

Before any new instrument (or major retrofit) ships, it answers YES to all of these:

1. Shell: built on HU-TOOL-SHELL regions, no restyled regions.
2. Primitives: HUKit for sheet, back, motion, phone line, selector-pop; .hu-drawer for
   the desktop detail surface. Zero hand-rolled twins.
3. Law 3 pass: every verb was ASKED "can this live on its subject?" before it went in a bar.
4. Law 4 pass: information clicks provably never relayout (the look/focus split or the
   tool's equivalent).
5. Law 5 pass: back/Esc/X/empty-tap walk one level, verified on a phone.
6. Law 6 pass: state serialized, faces carry values, filters chip.
7. Law 7 pass: labels fit-laddered, LOD hysteresis, fits reserve chrome, floors met.
8. Detector clean, or every finding file-ignored with David's explicit blessing.
9. Verify workflow ran: curl + vm parse + a logic repro per moving part (the no-headless
   discipline from reference_dev_server).
10. Voice: zero em dashes in UI strings, CAPS for emphasis, no AI tells.

The checklist is the doc-enforced tier doing what only it can do: making a human ask the
right question at the right moment. Everything below it on the ladder is code.
