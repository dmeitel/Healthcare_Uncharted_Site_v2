---
name: writing-checker-locked-pages-2026-10-19
description: 2026-10-19 checker-fix pass on 7 LOCKED pages (5 Rounds + ArMA/MSRC talks); 17 edits, the one negation kept per page, italic-title false positives, talk handouts as the record of what was said; David's accept list pending
metadata:
  type: project
---

17 one-sentence edits to clear writing-checker FIX items so the pages reach Phase 2 for 1.0.
Change list for David: tmp/phase1/writing-changes.md. UNCOMMITTED; checks were NOT run by me
(no shell in that session), traced by hand against scripts/lib/writing-rules.js.

**The one negation-contrast kept per page (do not strip in a later pass):**
- ai-promise-vs-bill: "now closed in the final accounts rather than forecast"
- problem-and-product: "a condition of deployment rather than a courtesy" (label "policy, not heroics" cut)
- task-list-only-grows: "found at 0300 rather than at shift change" ("Silence, not Mute" cut; likeliest reject)
- wound-and-workload: "aimed at the system rather than the individual"
- arma-2026: "Not just consulted at the end. Actually involved..." (verbatim on take-home + slide 17)
- msrc-2026: "as a clinical evaluator, not just a training session attendee" (matches the reference card)
- steward-postmortem's one short closer kept: "The peer-reviewed evidence base extends with them."

**Rulings worth reusing:**
- The checker keeps the FIRST negation as a check and fixes the rest, so keeping a later one means
  rewriting the earlier ones.
- voice.emphasis items on these Rounds pages were ALL italic titles (journals, a newspaper, a book, a
  bill). Left as false positives under APA 7. The page ledger reads static HTML, where marks are
  deleted, so emphasis never blocks Phase 2; only the live check shows them.
- Talks: the PDFs in src/downloads/ are the record of what was said. Pick the keeper that matches the
  handout; drop web-only foils.
- steward: the checker reads each sector-card h4 as a section, so a card's short last sentence counts
  as a section closer. Fixed with a semicolon join.

**Fact flag, unchanged:** arma-2026 says HB 2175 "effective July 1, 2026"; its slides say June 30, 2026.

**Pending:** David's accepts vs his own rewrites. The second list is the useful one. Related:
[[rounds-voice-pass]], [[emdash-holdout-pages]].
