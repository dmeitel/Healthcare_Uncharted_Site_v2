# Device Assembly: from a learning wall to a daily puzzle

### 2026-10-03 · PLAN · STAGE A BUILT 2026-10-03 to 2026-10-04 (A1 to A6) · STAGE B BUILT 2026-10-04 (without the 10 L concentrator and the conserving device) · STAGE C BUILT 2026-10-04 (ten vent walls, two home oxygen faults, the ICU as a dealt place; section 5 judged as written) · the record is DECISIONS.md LOG · section 5 READ by David 2026-10-04: "looks right, no changes"

David, 2026-10-03: "we have a solid starting build point but we need to consider expansion stuff
like ventilators instead of oxygen and air, we need to consider the filters that are placed
between different limbs and whether or not medication goes through those filters, we need to
consider different environments like instead of a traditional head wall it could be like a rehab
facility or a home care facility in which case the head wall has really different configurations
including random configurations... replayability or daily puzzle ability... a middle ground of a
drag and drop or puzzle style game... not necessarily just a learning tool but a really fun puzzle
tool."

Sources for this plan: three read-only passes on 2026-10-03 (the engine, the other games' replay
mechanics, outside research with URLs). The research notes with every URL are kept in section 7.

---

## 1 · What the game is today

- 57 parts, 16 walls (5 tutorials, 6 levels, 3 fault walls, the sandbox, one parked), 14 connector
  standards, 75 tests. Families: low-flow oxygen, bubble and heated humidity, cool aerosol and
  trach, heated high flow, capnography and suction.
- WHAT IS CHEAP, because it is data: new parts on existing connectors, new walls and carts, new
  rooms and obstacles, fault walls, and a seeded daily that draws from authored pieces.
- WHAT COSTS SOME CODE (three to five known places): new requirement rules, new connectors with
  their art, an order that changes mid-wall, a wall generator, a daily share card.
- WHAT IS A REBUILD: a true solver, gas that leaves a ventilator and comes back (the expiratory
  limb) or branches sideways (an inline nebulizer), scoring the whole circuit, a room with no
  headwall rail, and any change to the cell size (every par rewritten).
- What it does not have yet that every other game on the site does: one saved state, a dispatcher,
  the seeded generator (hu-rng.js), a save string (hu-save.js). The engine is already fully
  deterministic (no Math.random), so adding them is plumbing, not a rewrite.
- Par is hand-entered per wall and the score stops at par, so beating par is invisible today.

## 2 · What makes a puzzle worth coming back to (research, section 7)

- ONE PUZZLE A DAY FOR EVERYONE. Wordle's scarcity ("three minutes a day") and a share grid that
  shows the struggle without the answer. Every post is about the same puzzle, which is why it spreads.
- BUILD, TEST, SEE WHY, RETRY FREE. Opus Magnum, Poly Bridge, Pipe Mania: any working machine
  advances; the score is several dimensions (cost, size, speed) and players chase their own.
- ALWAYS SOLVABLE BY CONSTRUCTION. Generate the solution first, then hide it (the Flow Free and
  Sokoban generators), or generate and check with a reliable checker (Simon Tatham: "as long as the
  checker is reliable, the code that generates candidates doesn't have to be"). Device Assembly's
  rules engine already is that checker.
- SHORT RUNS WITH MODIFIERS ANNOUNCED AHEAD. Slay the Spire's Daily Climb (one seed, three
  modifiers), Into the Breach (you see what is coming). The site's own Uncharted General does this
  with its "brews" one quarter ahead.

## 3 · The plan, in three stages

### Stage A · Replayable, on today's parts

A1. **The engine contract.** One saved state, a dispatcher, the seeded generator and a save
    string, per .claude/rules/games.md. Walls become plain data. This is what makes everything
    below possible, and it gives Device Assembly what the other games already have: Continue after
    a reload, and a wall that can travel as a link.
A2. **The wall generator.** From realistic to completely absurd, by David's ruling (DECISIONS N3,
    2026-10-03: "they should vary from realistic to completely insane because there can also be
    some jokes involved"). His examples are the first twists: no oxygen; no air, so nothing can
    blend; only oxygen; only air; only suction; bring in a bottle of oxygen or a pump. Each twist is
    named on the wall's order screen, so the joke lands as a joke. Solution first: pick an order, place a known-good build for it through
    the engine, take par from the engine's own score, then add decoy parts to the cart and
    obstacles (a bed rail, an IV pole, a monitor) only where the solution does not run. The rules
    engine checks every wall before anyone sees it. Seeded, so a wall is a short code anyone can
    replay.
A3. **Today's wall.** One wall a day, the same for everyone, changing at midnight Mountain time.
    A share line in the Wordle manner, one square per test and no parts named ("Device Assembly
    #12 · 2 tests · 1 part under par"), a streak, a countdown to tomorrow's, and earlier days to
    practice on.
A4. **A score worth chasing.** Parts, feet of tubing, connections, tests run and time, each against
    par, with beating par counted (today it stops at par), a letter grade, and "how it was
    winnable": the par build shown as a ghost over yours, using the race's ghost wall that exists.
A5. **The shift.** Five walls, one patient, and the order changes between them (the expansion
    already on file: wean high flow to a cannula, step up to a non-rebreather, add a neb), so you
    rework the setup on the wall instead of starting clean. Each next wall's complication is
    announced ahead (an outlet capped, no air on this wall, a power cut). Between walls, pick one
    of three bonuses (spare tubing, an adapter kit, thirty more seconds). The last wall is a fault
    wall. A grade at the end.
A6. **Your own walls, and races.** A wall link carries the order, the room, the decoys and the
    clock, the way a Vital Stats game link carries its settings. A sandbox build goes out as a
    code. The two-wall race moves onto the Vital Stats portal: bots, a room code, a QR code, more
    than two players.

### Stage B · New places

B1. **Rehab or skilled nursing room.** Fewer outlets (piped oxygen and suction, often no medical
    air; Utah's rule for rehab hospitals requires piped oxygen and suction for a quarter of beds),
    portable equipment brought in.
B2. **Home.** No headwall at all: an oxygen concentrator (most run 0.5 to 5 L/min, some to 10), a
    small cylinder with a regulator or a conserving device, a bubble humidifier, a power strip,
    tubing up to the maker's limit. The patient in a recliner, not a bed.
B3. **Random layouts inside each place,** always ones that could exist.
    Engine work this stage needs: oxygen sources the room places anywhere (not only the rail),
    a flow range on a device (a 5 L concentrator cannot run 6), and a room with no rail.

### Stage C · Ventilators (built 2026-10-04 on David's "lets move onto stage c" and "build the rest of stage c"; section 5 read right with no changes)

C1. **The rule sheet** in section 5, marked right, wrong or change by David.
C2. **Engine:** a patient with an airway (an endotracheal tube or a trach), a three-port Y, gas
    that leaves the ventilator and comes back through the expiratory limb, a side branch for an
    inline nebulizer, and a score for the whole circuit.
C3. **Parts:** the ventilator, a dual-limb heated circuit, a single-limb circuit with an
    exhalation port, an HME, inspiratory and expiratory filters, the Y, a flex tube, a closed
    suction catheter, the capnography adapter (exists), a mesh nebulizer, a jet nebulizer, an MDI
    spacer, a water trap.
C4. **Walls:** set up a ventilator; add a treatment to a ventilated patient (where the neb goes,
    what comes off, what filter goes on); swap an HME for heated humidity; a home ventilator with
    oxygen bled in; fault walls (an HME left on a heated circuit, a neb behind an HME, no
    expiratory filter during aerosol).

## 4 · The menus

Built on the game shell (docs/HU-CONSISTENCY-TOOLKIT-2026-10-03.md, 2.6). Solo: the start screen
says what the game is in a sentence and three steps, with one primary button, Today's wall, and
the rest behind it (The shift, Walls, Sandbox). Party: the Vital Stats portal for a race.

## 5 · Rule sheet for David's RT read

READ 2026-10-04, David: "the rule sheet looks right, no changes." The game judges every line below as
written; the two unverified items stay unjudged.

Each line: the rule as the game would enforce it, then the source. Mark each right, wrong, or
change. Two items could not be verified and are his call outright.

1. An HME and a heated humidifier on the same circuit fails: the HME floods and occludes. (NHS
   England patient safety alert, 76 incidents [24]; a bench test where every circuit with both
   occluded within 24 hours [25].)
2. An inline nebulizer or MDI with the HME still in place fails: the drug is trapped; remove or
   bypass the HME. (AARC humidification guideline [19]; 2023 aerosol consensus [26].)
3. An HME with bloody or thick copious secretions, a large leak (exhaled volume under 70% of
   delivered) or a temperature under 32 C fails: listed contraindications. [19]
4. An HME on low tidal volume ventilation or on noninvasive ventilation warns. [19]
5. Aerosol with no expiratory filter warns: the ventilator's expiratory sensors are exposed. [26]
6. A jet nebulizer driven from outside the ventilator warns: the added flow changes tidal volume
   and triggering. [26][28]
7. An MDI in the circuit without a spacer before the Y fails. [26]
8. On noninvasive ventilation, a nebulizer on the ventilator side of the exhalation port warns: it
   goes between the port and the mask. [26]
9. A passive single-limb circuit with no exhalation port, or the port blocked, fails: the patient
   rebreathes. [31]
10. Oxygen bled in at the device outlet with no pressure valve warns: fire risk. [31]
11. A humidifier above the patient, or condensate drained back into it, fails: condensate can reach
    the airway. [17][19]
12. A home ventilator patient who cannot breathe unassisted for four hours, with no backup
    ventilator, bag or battery suction, fails. (AARC home ventilation guideline [30].)
13. An ordered flow above the concentrator's range fails: it cannot deliver it. [34][36][37]
14. A bubble humidifier on a pulse-dose device, or a humidifier connected backwards, fails. [34][37]
15. Concentrator tubing over the maker's limit (50 ft on one common 10 L model) fails; a small
    cylinder with tubing over 7 ft warns (it can tip). [37][38]

NOT VERIFIED, David's call: the order of the HME, closed suction catheter, flex tube and
capnography adapter at the patient end of the circuit; and whether skilled nursing and long-term
acute care rooms pipe medical air (the FGI tables are paywalled).

In the game, products are named generically (the site's vendor-neutral rule); the sources above
name the manuals they came from.

## 6 · Size and order

Stage A is the fun and needs no new clinical content: A1 and A2 first (a session each), then A3
and A4 together (a session), then A5 and A6. Stage B needs the no-rail engine work, then is mostly
data. Stage C needs the rule sheet back and the gas-logic rebuild, then is mostly data. Each step
ends with something David can play on his phone.

## 7 · Research notes (2026-10-03)

[1] boston.com, Wordle's origin, 2022 · [2] Wikipedia, Wordle · [3] Tom's Guide, the Wordle archive ·
[4] Wikipedia, Connections · [5] Woot forum, Costcodle share format · [6] Engadget, Tradle ·
[7] Wikipedia, Opus Magnum · [8] Game Developer, Road to the IGF: Zachtronics · [9] MacStories,
Poly Bridge · [10] Wikipedia, Pipe Mania · [11] Wikipedia, Flow Free · [12] arxiv.org/pdf/2605.15458
(Flow Free generation, seen as a snippet only) · [13] ianparberry.com/research/sokoban ·
[14] chiark.greenend.org.uk/~sgtatham/quasiblog/mines-solver · [15] Slay the Spire 2 Daily Climb
guide (snippet) · [16] Game Developer, Into the Breach (snippet) ·
[17] Fisher & Paykel ventilator circuit IFU, resources.fphcare.com/content/950-vent-ui-z85001.pdf ·
[18] Draeger expiratory filters (snippet) · [19] AARC Clinical Practice Guideline, humidification
during invasive and noninvasive ventilation, 2012, aarc.org/wp-content/uploads/2014/08/12.05.0782.pdf ·
[20] Gradian humidifier one-pager (snippet) · [21] Masimo CO2 airway adapter IFU ·
[22] Trilogy 202 quick start guide · [23] Astral brochure · [24] NHS England patient safety alert,
humidification devices, 2019, england.nhs.uk/wp-content/uploads/2019/12/psa-humidification-devices.pdf ·
[25] PMC4470931, HME with heated humidifier bench test · [26] Li et al., Ann Intensive Care 2023,
aerosol delivery during mechanical ventilation consensus, PMC10338422 · [27] PubMed 36300182,
nebulizer position bench study · [28] Frontiers in Medicine 2022, 10.3389/fmed.2022.1004551 ·
[29] respiratory-therapy.com, the 2024 Trilogy Evo aerosol advisory · [30] AARC guideline, long-term
invasive ventilation in the home, aarc.org/wp-content/uploads/2014/08/08.07.1056.pdf ·
[31] DreamStation CPAP user manual · [32] Utah Admin. Code R432-9-3 · [33] Oregon OAR 411-090-0190 ·
[34] AARC guideline, oxygen therapy in the home or alternate site, aarc.org/wp-content/uploads/2014/08/08.07.1063.pdf ·
[35] APSF, pipeline pressure primer (snippet) · [36] EverFlo spec sheet · [37] Platinum 10 owner's
manual · [38] Apria conserving device manual · [39] Respir Care 2011;56:1950 · [40] The Global Fund,
cylinder valves technical brief.

Checked 2026-10-03 by the research pass; PMC and PubMed pages were read through Europe PMC.
"Snippet" means the claim was seen in a search result only.
