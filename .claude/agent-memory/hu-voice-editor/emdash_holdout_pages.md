---
name: emdash-holdout-pages
description: 2026-08-18 em-dash-only punctuation pass on 4ps-framework + talks/arma-2026, the last two pages violating the no-em-dash rule; uncommitted, ledger pending David's QA
metadata:
  type: project
---

Two pages were never covered by the voice rounds and were the site's last
em-dash holdouts. Both cleared 2026-08-18 in a punctuation-only pass (no voice
edits, no fact edits): `src/learn/4ps-framework/index.html` (22 prose dashes)
and `src/learn/talks/arma-2026/index.html` (33 prose dashes). Zero remain in
prose. UNCOMMITTED.

**Why:** CLAUDE.md ALWAYS TRUE bans em dashes everywhere including titles and
meta descriptions. A prior mechanical scrub on another page swapped every dash
for the same character and produced mid-sentence artifacts plus broken colon
pairs that needed hand repair, so this pass varied the replacement per sentence
(comma / colon / period / parens / restructure).

**How to apply:** If a future pass reopens either page, the dash work is done;
do not re-scan for dashes, and do not treat the new colons and parens as
scaffolding to strip. The 9 remaining dashes in 4ps-framework are all inside
HTML and JS comments (SVG node markers, function comments) and are deliberately
left, since comments are invisible to readers.

Rulings made, worth reusing:
- Citation line `<cite>— framing adapted from Tommy Douglas...</cite>` became
  `<cite>Framing adapted from Tommy Douglas...</cite>`. Dash dropped, first word
  capitalized, still reads as attribution.
- `says "we use AI" — ask which layer` became a comma inside the closing quote,
  US convention, in both places the construction appears on the ArMA page.
- Trailing dash before a list took a colon OR a period-plus-fragment, alternated
  so no single POV panel got two identical colon-lists.

Not yet known: which of these David keeps and which he rewrites himself. Fill
that ledger after his QA. Related: [[learn_voice_pass]], [[learn_articles_voice_pass]].
