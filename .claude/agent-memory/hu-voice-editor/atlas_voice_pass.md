---
name: atlas-voice-pass
description: 2026-08-16 atlas/index.njk desc-string pass done (11 edits, uncommitted); which devices were deliberately KEPT as budget-holders; craft.njk data blob desync note
metadata:
  type: project
---

2026-08-16: voice pass on zone/node/route `desc:` strings in src/atlas/index.njk. 11 edits, all uncommitted. Worked from a completed hu-auditor defect list (did not re-audit).

**Deliberately KEPT, do not strip in future passes:**
- Negation-contrast budget (1): "sees what the note says, not what happened" (NLP node, ~796). Auditor and editor agreed it earns it.
- Triad budget (1): "Understaffed, underseen, undervalued" (Respiratory Therapy node, ~857). Kept as the page's one deliberate triad: it's David's home discipline (RRT), and the hammering "under-" prefix is the grievance, not template rhythm. No authored twin in the repo.
- "alert fatigue" verbatim kept at CDSS nodes only (~888, ~1775); predictive (~799) and RPM (~805) now describe the phenomenon without the phrase.
- "Chronically underfunded" kept at Patient Navigators (~1820); community-health (~1000) varied to "leans on hard and funds thin". NOTE: hospital-map/index.html:1969 also has "Chronically underfunded." (revenue string) — cross-file twin left alone, out of scope this pass.
- "everything else sits on" kept at medsci zone desc (~778); biostatistics (~834) varied.

**Not touched on purpose (auditor didn't flag; don't re-audit):**
- ~935 encounter desc "Each generates data, billing, and downstream decisions" is a cousin of the fixed ~1179 route triad.
- ~925 second sentence "Insurance status, geography, and cost" (subject list, not rhetorical triad).
- ~888 "Alert fatigue, black-box concerns, and the workflow integration problem" (list, not flagged).

**Desync note:** src/atlas/craft.njk line 436 embeds a generated `/*__CRAFT_DATA__*/` blob (from src/assets/data/derived/search-graph.json) that still carries the OLD desc strings. Data files, out of scope; resolves when the datamap/search-graph build re-runs.

**Why:** future voice passes on this file must not "fix" the two budget-holders or re-introduce the deduped devices.
**How to apply:** any prose work in src/atlas/index.njk or adjacent tool descs checks this ledger first. Accept/rewrote ledger pending David's QA, same as [[hospital-map-voice-pass]].
