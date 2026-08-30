---
name: laws-page-textbook-strip
description: 2026-08-27 FULL textbook strip of src/learn/laws-and-paradoxes/index.html (9 panels, ~70 edits); goodhart panel was David's own calibration; kills the 2026-08-17 per-tab keepers; pull-quote policy + flags
metadata:
  type: project
---

2026-08-27: the ten-tab field guide got the FULL TEXTBOOK STRIP. ~70 edits, ALL
UNCOMMITTED. David stripped the GOODHART panel himself and handed it over as the
calibration; the other nine were done against it.

**What his goodhart pass established (the bar for this page):**
"The economist who watched a target break." -> "Origin: the Bank of England, 1975."
"Watch a measure detach from reality." -> "How a measure detaches."
"What actually works." -> "What resists the law."
Counter-callout label "The honest version" -> "The limits of the law".
Invented pull quote -> Goodhart's REAL 1975 sentence, attributed.
So: h2s become labels, CAPS drama goes, fragment verdicts fold into their host
sentence, and an invented pull is replaced by a real cited quotation.

**PULL-QUOTE POLICY APPLIED (worth reusing):** every `.jp-pull` on the page is now
either a real attributed quotation from that panel's own cited source, or a plain
statement. Conway got the canonical 1968 Datamation sentence ("Any organization that
designs a system will produce a design whose structure is a copy of the
organization's communication structure."). Roemer, framing, amara, hype, bullwhip
and jensen got PLAIN STATEMENTS because I could not verify a verbatim line from
Roemer & Shain, T&K 1981, Amara, Gartner, Lee 1997 or Huang. Never guessed.

**THE 2026-08-17 PER-TAB KEEPERS ARE DEAD.** [[learn-voice-pass]] logged ten
laws-page budget-holders; David's work list named most of them explicitly, so
Jevons "Efficiency did not bend the curve. It steepened it.", Roemer "The bed does
not wait politely...", the T&K pull, Conway's "photograph the organization" pull,
Amara's "disappointment phase" pull, Hype's "It is not an obituary.", Bullwhip's
pull and Jensen's pull are all gone. Same precedent as
[[learn-textbook-strip-pass]]: a keeper ledger protects against churn, not against
a register change he signed off on.

**Deliberately LEFT STANDING (do not "fix" next pass):**
- Framing thesis "whoever writes the problem statement has already picked the
  solution" (the #framing tab's anchor line, load-bearing identity).
- Productivity "The EHR did not fail to do work. It generated new work." (panel's
  one negation; not on his list).
- Jensen "Its hard limit is not capital. It is megawatts." (panel's one negation).
- Bullwhip "Visibility, not bigger buffers, is what flattens the whip." and "The
  whip cracked back." (the named analogy reasoned inside, which the kernel allows).
- Jevons hero "27x" stat card and the "more than 25x" prose, still both true of
  3M-to-80M+ (flagged in the old ledger, still not a defect).

**DESYNC CREATED ON PURPOSE:** the laws page said "cited 224 times and tested never"
and so does `src/rounds/problem-and-product/index.html:99` (figure caption). His work
list named the Learn instance; Rounds keeps the full voice, so only Learn changed.
The twin in Rounds is intact and correct.

**FLAGGED, NOT CHANGED:** the page's front-matter `description` lists nine of the ten
laws and omits the Hype Cycle. Adding it would be a claim change, so it is his call.

**Why:** kernel v1.2 puts /learn/* in textbook register and the 2026-08-26 audit
found this page the worst offender on the site (81% aphorism density).
**How to apply:** log what David accepted vs rewrote after his QA. Highest red-pen
risk: the new h2 labels ("Practical checks.", "Four healthcare cases.", "Conway's
claim.", "The five phases."), the six plain-statement pull quotes, and the counter
labels that replaced the three "Hold this in tension" twins.
