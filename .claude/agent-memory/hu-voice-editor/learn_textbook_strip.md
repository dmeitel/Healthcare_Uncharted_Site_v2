---
name: learn-textbook-strip
description: The 2026-08-27 full textbook strip of the Learn register across eight pages; the calibration page, the precedent that a strip overrides prior budget-holders, per-page keepers, and one open fact conflict
metadata:
  type: project
---

2026-08-27: David ordered a FULL TEXTBOOK STRIP of `/learn/*`, not the usual
survive-by-default trim. The writing disappears, headings label, engineered punchlines go,
every fact, number, citation and link stays byte-identical. Eight pages, ~112 edits. All
COMMITTED as of 2026-09-19.

Merged 2026-09-19 from two files covering the same operation on different pages.

**The calibration page is `src/learn/process-engineering/index.html`.** David stripped it
himself and handed the before/after pairs over as the quality bar. Read it before starting
any further Learn page. The pattern: aphorism pairs fold into one ordinary sentence,
`**Verdict.** explanation` blocks become plain prose, and first-person that carries real
experience SURVIVES with only the staging calmed.

**Pages done:** request-routing (15 edits), healthcare-data-sources (18),
leading-the-ai-transition (13), the-payer (11), patient-data-record, healthcare-gap,
hitech-to-cures, change-healthcare-stress-test (~55 across those four). Em dash count 0
in all eight.

**Out of bounds by his instruction:** `/rounds/`, guest pages, sources and reference blocks,
disclosures, and quiz copy inside `<script>` (code).

## THE PRECEDENT: a strip overrides earlier budget-holders

Two things [[learn-policy-voice-pass]] deliberately preserved were rewritten here on David's
approval. The hitech anadiplosis chain ("Certified criteria became feature lists, feature
lists became screens...") is gone, now "Certified criteria turned into feature lists, and
those features turned into the screens clinicians work in all day." And "The two-tier system
is a line item you can point to" is now "The result is a two-tier system."

The lesson: a keeper ledger protects against CHURN, not against a new standard David has
signed off on. Check the ledger, check whether the current instruction supersedes it, then
say which one you followed. See [[voice-keepers-superseded]].

## Calibration that worked, mirror this

Fold the fragment verdict into its host sentence. Merge antithesis flip pairs into one plain
sentence. Replace colon-drop reveals with a plain subject-verb opening. Keep three-item
content by making the items arrive unevenly (two clauses plus one, or a semicolon plus a
short tail). Drop CAPS that only add drama, keep CAPS that mark a real contrast.

## Deliberate KEEPS, do not "fix" these next pass

- hitech hero close "So Congress passed another law to free the data it had paid to create."
  Ruled KEPT: the irony is in the facts, not in a device.
- healthcare-gap "a WORKFORCE gap wearing a geography costume". The same phrase is in
  `src/_data/learn.js` card desc; killing one desyncs the pair.
- healthcare-gap "Multiplication by zero" h2 and its body line: sustained analogy reasoned
  inside, which the kernel allows.
- change-healthcare pull quote (a deliberate duplicate of a body sentence) and "a crisis with
  a treasury department attached".
- patient-data-record "The registration data is not the boring part... it is the regulated
  part" and "So 'your record' is not one file in one place". That page's negation keepers.
- A10 "The pilot phase is over. This is infrastructure."
- the-payer "Fifteen percent of a bigger number is a bigger number."
- request-routing "If it has a cable or a queue, it is theirs."

## Judgment calls worth defending or reversing

- request-routing's hero opened on four staccato class names that duplicated the hero card
  list two inches away. Folded into one sentence; the four classes still arrive in order.
- Pull quotes were rewritten in place, never deleted, so the component keeps its content.
  Where a pull echoed a body aphorism (A10's "book club"), body and pull were rewritten to
  the SAME new sentence, which is the existing convention on those pages.
- Fragment tails on the six data-sources category notes were varied rather than normalized,
  so the six siblings no longer share one template.

## OPEN: a fact conflict nobody has ruled on

`hitech-to-cures` says "nine percent of American hospitals had a basic EHR" in the hero (and
9% in the SVG and the meta description) while the body cites the NEJM 2009 survey at "7.6%
with even a basic one". Both are sourced (the ONC trend series versus Jha/NEJM) but the page
swaps between them without saying so. Flagged, never changed. This is on DECISIONS.md.

## A logic bug fixed in passing, not a voice edit

change-healthcare's last line read "It is a one-sentence email. The entire event you just
read about happens if one company answers it honestly." That inverted the meaning. Now: "It
is a one-sentence email, and an honest answer to it would have surfaced the exact gap that
started everything above."

**Why:** the site-wide prose audit found Learn DENSER in aphorisms than Rounds (60%, the laws
page 81%), and the Learn register per kernel v1.2 is textbook: the writing disappears.
**How to apply:** when the next Learn page comes in, mirror process-engineering, not the old
trim.
