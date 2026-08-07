---
target: Assignment Compass tool
total_score: 33
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-08-06T05-43-49Z
slug: src-tools-assignment-compass-index-njk
---
Method: dual-agent (A: isolated design review · B: isolated detector evidence)

# Critique: Assignment Compass (src/tools/assignment-compass/index.njk)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Live data-vintage badges everywhere, but no pending state on county/per diem fetches; stale tiles linger during refetch |
| 2 | Match System / Real World | 4 | "Below that number you are paying to work there"; recruiter/stipend/fully-built is the audience's native tongue |
| 3 | User Control and Freedom | 2 | Icon-only reset wipes a hand-built scenario to preset 0; replaceState-only URL means no undo, no back |
| 4 | Consistency and Standards | 3 | Rides the shared kit well, but the methodology sheet is hand-wired instead of HUKit.sheet; hu-kit.js never loads |
| 5 | Error Prevention | 3 | Inputs clamped and validated; gross=0 and same-state comparisons produce confident nonsense silently |
| 6 | Recognition Rather Than Recall | 4 | Everything labeled with hints; results prose restates the inputs; nothing held in the head |
| 7 | Flexibility and Efficiency | 4 | Presets, full URL state, hourly/annual modes, county grain, expert ratio overrides |
| 8 | Aesthetic and Minimalist Design | 3 | Dense but disciplined; the stipend caveat repeats four times and nearly every card murmurs a hint |
| 9 | Error Recovery | 3 | Boot failure announced plainly; per diem degrades to labeled offline badge; county fetch failure only whispers via scope badge |
| 10 | Help and Documentation | 4 | The methodology sheet's "What it does not do" list with an IRS primary source is the best help pattern on the site |
| **Total** | | **33/40** | **Good** |

## Design Specificity Verdict

**Authored, deeply. No generic cost-of-living site could ship this unchanged.** The framing is "Where you are now" vs "The assignment," not City A/City B. The per diem card names the reader's leverage ("that is your negotiation room"). License logistics carry compact-aware routing and a conflict-of-interest disclosure on the RCIC line that is unfakeable positioning. The blind-spot cards argue against the tool's own output, which a conversion-driven site would never do. Where it leans generic: the diverging bar chart is stock, Lucide icons are stock, and teal is spent three ways at once (assignment channel, card-head icons, links), diluting The One Signal Rule.

**Deterministic scan**: 29 findings, 1 warning + 28 advisories, all on the built page (the detector cannot read .njk source; grep confirmed the flagged CSS originates there). The one warning (side-tab accent on the blind-spot cards) is a false positive per DESIGN.md's blessed 3px accent-edge language, with one real nuance: DESIGN.md specifies the radius zeroed on the accent edge and .ac-spot keeps 8px corners. Of the 27 font-size advisories, most are calibration noise (13px, 13.5px, 9 to 11px mono all sit in DESIGN.md's documented prose ranges); real residue: a 22px stat-value override where the kit spec says 20px, and fifteen 11.5/12/12.5px sizes living in the undocumented gap between label and body ramps. 5 of 5 inline scripts parse. Page serves 200.

**Visual overlays**: skipped; no browser automation available this session. The CLI scan is the deterministic evidence for this run.

## Overall Impression

This is the most product-specific tool on the site, and its honesty architecture (live data vintages, a non-computed list, a disclosed author stake) exceeds the site's own sourcing standard. The copy layer does real UX labor. What holds it back is implementation debt on exactly the disciplines the site already solved elsewhere: the phone touch floor, sheet accessibility, and back-button grammar all have house patterns the page does not ride. The single biggest opportunity is structural: the named persona (a travel RT with two offers) cannot actually do her task, because the tool is architected for one gross applied to both columns.

## What's Working

1. **The honesty architecture is the product.** Tax year and COL quarter live in the footer, FY on per diem, ZORI month on rent, ACS vintage on the profile, a scope badge naming every estimate's grain, and a methodology sheet that lists what the tool does NOT compute, with an IRS primary source. Trust-critical math ships as a pure, Node-testable engine.
2. **Worked-example-first onboarding.** The page lands already answered: preset 0 (Travel RT: SLC to Sacramento) fills everything, so first value arrives in zero interactions and the presets double as teaching cases. URL state means interruptions cost nothing.
3. **The copy layer does the reassurance work.** Every number is escorted by a sentence saying what it is, what it is not, and what to do with it. Practitioner voice doing UX labor at the high-stakes moment.

## Priority Issues

- **[P1] The 44px touch floor collapses across the phone form.** The page's own CSS outspecifies the kit floor: toggle chips 38px, cost inputs 36px, assumption inputs 32px, on the money-changing controls, with a third of traffic on phones. Fix: delete the 38px override and scope the phone bump with selectors that win specificity. Suggested command: /impeccable adapt
- **[P1] The methodology sheet fails keyboard and screen-reader users three ways.** Closed, it is only translated off-screen, so its close button and ten source links are ghost tab stops; opened, focus never moves in and the trigger has no aria-expanded; on phones, hardware back exits the page because hu-kit.js (and the site's backGuard) never loads. Fix: ride HUKit.sheet + backGuard like the maps, toggle inert, move focus, mirror aria-expanded. Suggested command: /impeccable harden
- **[P1] Icon-only destructive reset with no confirm and no undo.** One mistap replaces a ten-minute hand-built scenario with preset 0, unrecoverable because the URL uses replaceState only. Fix: snapshot the outgoing querystring and offer one-shot restore, or pushState before applying reset so back recovers it. Suggested command: /impeccable harden
- **[P2] The delta bars are illegible on phones.** 11px SVG text in a fixed 640-unit viewBox renders ~6.5px at 390px width. The ledger carries the same numbers, hence P2. Fix: hide the SVG under 699px and let the ledger's colored delta column be the phone chart. Suggested command: /impeccable adapt
- **[P2] On phones the answer lives below ~14 stacked controls.** After any mid-form edit the recomputed bottom line is off-screen with no sticky readout or jump link. Fix: a one-line sticky strip (two locations + signed delta, tap scrolls to results). Suggested command: /impeccable adapt

## Persona Red Flags

**Jordan (first-timer)**: nothing marks the pre-filled numbers as an EXAMPLE; he may read the bottom line as an answer about himself. "Fully built" is traveler slang he has never heard. The assumptions accordion opens onto unexplained MERIC ratio algebra. The cost-reference toggle is the one control with no hint.

**Casey (one thumb, interrupted)**: the sub-44px control cluster is her whole form experience; the third preset is off-screen at 390px with hidden scrollbars; the bars are unreadable; sheet-open plus hardware back exits the page, the exact trap round 22 fixed on the maps. Genuine save: URL state plus correct numeric keyboards.

**Sam (screen reader + keyboard)**: the closed sheet is a ghost tab-stop field, the worst single defect on the page. Real wins exist: debounced live-region announcements, aria-pressed everywhere, labeled groups, the chart deferring to the table. Ledger th cells lack scope; dynamic card appearances go unannounced.

**Dana (travel RT, two offers, 15 minutes)**: her real comparison is OFFER A vs OFFER B, but the tool takes one gross applied to both columns; she runs it twice and diffs by hand. If the per diem function is offline she negotiates from the standard-rate floor, which understates high-cost counties; the badge is honest, the consequence unstated. Her endpoint (a screenshot into a recruiter chat) has no designed artifact.

## Minor Observations

- The static grabber renders on the sheet but nothing drags: an affordance that lies. Sheet transition is 280ms against the 250ms phone cap and ignores reduced motion (kit-level, inherited).
- The tool's own shipped HTML comment and the served engine's header carry em dashes; DESIGN.md's ban covers comments. The title/og/aria em dashes are base-chrome, the standing site-wide call.
- 22px stat-value override vs the kit's 20px spec; the 2px legend-swatch radius is an undocumented case; blind-spot cards keep 8px corners where the accent-edge language zeroes them.
- Insurance scaling by the misc index is admitted only in an engine comment, not in the methodology sheet.
- Per diem county matching is name-substring based; "St. Louis" class mismatches silently fall to standard rate.
- Same-state comparison renders an all-flat ledger with no notice. Assumption overrides are excluded from the shared URL.
- Craft worth crediting: true minus U+2212 in signed formatting, and the a/an endorsement grammar comment ("U-states sound like consonants").

## Questions to Consider

1. The named persona cannot do her actual task. Should this be a two-offer tool? The engine is pure and stateless; the cost is UI, not math.
2. The journey ends on a settings accordion. What if it ended on the negotiation card, screenshot-ready in the Rounds share-card idiom?
3. The tool knows the GSA cap and the recruiter quotes a stipend. Why not let those two numbers meet? One optional input would make the page's best sentence computable instead of rhetorical.
