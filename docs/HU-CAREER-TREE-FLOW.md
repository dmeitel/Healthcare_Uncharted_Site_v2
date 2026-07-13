# The Career Tree — Product Flow & User Cycle

**Status: DIRECTION, drafted 2026-07-12.** The doctrine (HU-CAREER-TREE-DOCTRINE.md) says what this tool is. This doc says what a PERSON does with it, visit after visit. Every feature idea should name the stage it serves. If it doesn't serve a stage, it's decoration.

The planning-tool grammar came from the med-side references (Residency Explorer, FREIDA, MedMap, Texas STAR, admit.org, matchpal, Thalamus). What they prove: people want Profile → Match → Plan → Track. What we refuse from them stands in the doctrine: no program directories, no accounts, no odds on a person. Their remaining unmined ideas are folded into the stages below.

---

## The cycle

One person. Seven beats. The tool succeeds when someone completes the loop and comes back to move a tile from dashed to solid.

### 1. ARRIVE
How they land: a Rounds/Learn article deep-link, a shared URL, a career-fair browser tab, the tools index.
- **Built:** URL state carries everything (?view, ?hidepw, ?lens, ?emetric). Survey modal greets an empty path.
- **Missing:** Authored preset views (the pins exist for other tools; the Career Tree has ZERO editorial entries — "The bedside-to-informatics route", "No-degree entry points", "The nursing ladder"). Share cards for a build (the JPEG export exists but there's no 1080² branded share card like Rounds get). Article-to-tile deep links are at ~14% (the atlas linking audit).

### 2. ORIENT — "this is me"
Four questions become a seeded sheet. Character creation ends at the character.
- **Built:** Survey (status/pull/education/reach + conditional role/credential pickers), LinkedIn PDF import, identity bar.
- **Missing:** Nothing structural. Copy iterations only.

### 3. EXPLORE — "what's out there"
The loop: My Path → Career Matrix → Education Matrix → Areas of Expertise → back.
- **Built:** This week. One board grammar, snap, filters, heatmaps, lens, flow links, jumps.
- **Missing:** leadsTo enrichment (the role graph is thin in places — the cut-but-real education roads listed in memory: behavior tech → BCBA, coder → HIM, sterile processing → surgical tech).

### 4. CLAIM — "this is mine, that's next"
Pin have/aiming everywhere; rings speak one language.
- **Built:** Explicit pairs on every panel, multi-select on the atlas, suggest strip.
- **Missing:** Nothing structural.

### 5. PLAN — "the road, priced"
The gap between the path you have and the path you pinned, in public numbers.
- **Built:** Next Steps derives the plan. Credential reality (pass rate / fee / length / prose chain). Ladder edges on the Education Matrix.
- **Missing — the biggest hole in the product, in three parts:**
  - **The on-ramp (pre-healthcare).** Nothing tells a high schooler or career changer what standing at the DOOR requires: entrance exams (TEAS, HESI A2, MCAT, GRE, CASPer), prerequisite coursework (A&P, chem, stats), required hours (PA patient-care hours, CRNA ICU years, shadowing). This is MedMap's whole product, generalized to every profession — and it's authorable data on ~30 credentials, sourced from the same org sites already in references.js.
  - **Checklists.** Role req[] items and entry requirements should be tickable on My Path, feeding Next Steps. This is Track deepening, not urgency mechanics — requirements are things you hold or don't, same as credentials. (No percentages on a life. A checklist on an exam's prerequisites is a fact sheet, not a guilt bar.)
  - **Plan totals.** A pinned goal should read as a bill: ~N years of school, ~$X in exam fees, M exams. All derivable from data we already hold once the on-ramp exists.

### 6. ACT — leave and do the thing
The map's job ends at the trailhead. They go apply, enroll, study.
- **Built:** Source links per credential (the org's own page).
- **Missing:** "Find a program" outbound links per credential — NOT a directory (refused), just the accreditor's own program-locator page (CoARC, CCNE, CAAHEP, ARC-PA locators). One authored URL per credential. The tools that do directories well already exist; we hand people to them.

### 7. RETURN — move a tile
Come back, flip dashed to solid, re-plan. The only honest retention loop a no-account tool has.
- **Built:** localStorage build, save/load codes, the ✓ flip on every tile.
- **Missing:** The share card (stage 1) is also the return hook — a build someone posted is a build they come back to update. GoatCounter tells us if the loop actually cycles; the Goat Tracker is live for exactly this.

---

## Build order from here

1. **The on-ramp data** (stage 5): extend career-tree-creds.json per credential with entry requirements — exams, prereq courses, hours — plus accreditor program-locator URLs (stage 6). Sourced per the sourcing standard, cited in references.js. Surfaces in the credential panels and the Education Matrix.
2. **Checklists** (stage 5): req items become tickable, stored on the build, feeding Next Steps.
3. **Plan totals** (stage 5): the bill, computed on the Next Steps card.
4. **Arrival layer** (stage 1): authored preset views + a build share card + article deep-links.
5. **leadsTo enrichment** (stage 3): the thin role-graph seams, which also resurrect the cut education roads.
6. Then stop and watch GoatCounter before deciding anything else.
