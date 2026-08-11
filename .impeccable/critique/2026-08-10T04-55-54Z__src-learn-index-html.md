---
target: the learn menu
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-08-10T04-55-54Z
slug: src-learn-index-html
---
Method: dual-agent (A: design review · B: detector evidence)

# Critique: Learn Hub Index (src/learn/index.html) — 2026-08-09

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Rail counts respond live, but filtered-in cards can lack the visible matching tag; Talks filter promises 2, viewport shows 0 + a quip; no live region |
| 2 | Match System / Real World | 2 | "Who It's For" mislabels subject as audience (Article 04 is ABOUT payers, not FOR payers); nav "Learn" vs title "Explore" |
| 3 | User Control and Freedom | 2 | Single-select only; filters write no URL state on a deep-link-doctrine site; empty state has no clear-filter action |
| 4 | Consistency and Standards | 2 | Patient/provider hues INVERTED between tag and atlas-pill vocabularies on the same card; AI and Guest share #4ecb8d; "?" arrows |
| 5 | Error Prevention | 3 | Little can go wrong; coming-soon correctly unclickable; the Talks dead-end is the one trap |
| 6 | Recognition Rather Than Recall | 3 | Everything visible, but reader memorizes which of three pill vocabularies means what |
| 7 | Flexibility and Efficiency | 2 | "/" accelerator + sticky rail good; no multi-select, no sort, no shareable filter state, no start-here accelerator |
| 8 | Aesthetic and Minimalist Design | 2 | ~100 pill-shaped objects on one page; six-layer card anatomy; two near-identical callouts; dead CSS ships |
| 9 | Error Recovery | 2 | Authored empty states with no action in them |
| 10 | Help and Documentation | 1 | The 4Ps explainer card was REMOVED (its CSS is a fossil at src lines 68-82); no term definitions; zero where-to-start |
| **Total** | | **21/40** | **Acceptable — significant improvements needed** |

## Design Specificity Verdict

Split verdict, and the split is the whole story. The FLESH is deeply authored: hero copy, search suggestions, card descriptions carrying real numbers (19% denials, $35B, 192.7M records), guest attribution, atlas deep links. The SKELETON is category-interchangeable: swap the copy and this is a real-estate listing page or a course-platform catalog. The one structural element that is unmistakably THIS product — atlas pills wiring every card into the system map — is treated as card garnish rather than the page's organizing idea. Authored skin on a commodity chassis.

Deterministic scan: 0 findings under project config (3 side-tab suppressions = David-confirmed documented vocabulary). Raw run: 3 side-tab only. Built-page-only extra: 1 dark-glow false positive (light-theme shadow evaluated against dark ground — analyzer can't see theme scoping). All 4 imgs have alt. Browser overlay skipped: no browser automation tool exposed. The detector-clean/21-40 gap is the textbook case: a clean scan is a floor, not a verdict.

## Priority Issues

- **[P1] Live glyph corruption: "?" where arrows belong.** Both talk-card footers and the Article 06 coming-soon footer render a literal "?" (byte 0x3F) instead of an arrow — in source, build, and live page. Reads as a broken page on the two highest-credibility items (CME talks). Fix: restore the arrow on talk cards; honest text-only footer on coming-soon. Command: /impeccable polish
- **[P1] The sequence is being wasted.** Content carries visible spines (Article 01→10, "Series" ×4, Methods, Field Guides) but the grid interleaves three numbering systems in one unlabeled shelf, sets the number at 11px faded ink BELOW the tag pills, parks Coming Soon mid-flow, offers no start-here. For clinicians leveling up and students sent here, order IS the pedagogy; the page hides its own syllabus. Fix: route-over-shelf hybrid (see ideology answer). Command: /impeccable shape
- **[P1] The phone filter is the degraded one, and phones are a third of traffic.** Below 1100px: 11 flat chips, no group labels, no counts, no overflow signal (Talks/Guest invisible off-screen on 390px), non-sticky bar, 42px chips under the site's own 44px floor. Fix: 44px chips, overflow affordance, ideally one "Filter" trigger opening the detent sheet with the grouped rail. Command: /impeccable adapt
- **[P2] Three-way taxonomy color collision.** .tag-patient blue/#6aabff + .tag-provider teal vs global .fp-patient TEAL + .fp-provider BLUE — meanings swapped inches apart on the same card. AI and Guest share one green. Filters match cards showing no corresponding visible tag (Method 02, Articles 04/07). Fix: unify on the global lens palette; distinct Guest hue; display every filterable tag or stop tagging invisible dimensions. Command: /impeccable polish
- **[P2] Accessibility below the site's own reference implementation.** Chip-row buttons lack aria-pressed (rail has it); no live region announces results; the 13-card catalog has NO heading (outline = h1 + one 11px h2); callout titles are divs; .tag-interop light text under 4.5:1 where the Deep-Step Rule prescribes #C22F2F. Fix: mirror aria-pressed, one aria-live results counter, real h2 on the grid, deep-step interop text. Command: /impeccable harden
- **[P3] Housekeeping.** Dead .framework-card CSS; "node on the map" said three times; nav "Learn" vs title "Explore"; no URL filter state; hover lift -3px vs DESIGN.md -4px; .ac-title 16px/600 body font vs hc-title Outfit 800 17px vs DESIGN.md 20px (three answers, one question); alt-bg class may have lost its backing style. Command: /impeccable polish

## Persona Red Flags

**Jordan (first-timer clinician):** nav says "Learn," tab says "Explore." "Who It's For → Patient" teaches the wrong lesson (it means ABOUT the patient player). Has never heard "4Ps" and the explainer card is gone. Article 06's dimmed card with "?" reads as broken.

**Casey (one-handed phone user):** sees ~4 of 11 chips with no hint the rest exist; filter bar scrolls away (desktop got the sticky rail, Casey got the leftovers); ~25px atlas pills sit on top of the card's stretched link = coin-flip tap targets; "Talks" filter answers with an empty viewport and a joke.

**Sam (screen reader/keyboard):** active chip set is silent (no aria-pressed, no live region — the site's own Hospital Ops Map reference implementation has both); headings list contains h1 + one 11px h2, so the entire 13-article catalog is invisible to heading navigation; ~56 tab stops through the grid with no skip.

**The RT student (sent by a professor, wants WHERE TO START):** nothing says "start here"; strongest ordering signal (Article 01) is 11px faded ink third in the card's reading order; after 01, Article 02 is four cards away; "respiratory" appears nowhere as an entry point on an RT founder's site; "Method/Field Guide/Article/Series" = four content words, zero definitions.

## Minor Observations

- One Signal Rule strains: teal is the active chip, provider tag, every hover border, the hero em, both callout badges — six jobs, one pointer.
- Rail counts include talk cards under an aside labeled "Filter articles."
- Guest cards break the number column; grid anatomy shifts mid-flow.
- Coming-soon parked mid-grid instead of reading as a legible gap in a sequence.
- The workmanship under the page (anchor retention, honest comments) is better than the model on top of it.

## Cognitive Load

Failed: single focus, phone chunking (11 flat chips), one-thing-at-a-time (six-layer cards), ≤4 options (11 chips / 13 undifferentiated cards / 4 destinations per card), working memory (three pill vocabularies, two with swapped hues), progressive disclosure. Passed: rail chunking, partial grouping/hierarchy. 6 of 8 failed = high cognitive load.

## Emotional Journey

Peak at entry (hero + search, the best 90 seconds happen in the first 10). Valleys: mid-grid sameness around cards 6-10 + the "?" coming-soon; the Talks dead-end; the phone reader's trek back up to a scrolled-away filter bar. End: the Atlas callout carries the page's best idea, quietest element, after 15 cards. Trust-positive, energy-negative ending.

## Questions to Consider

1. If every article is "a node on the map," why is the map the LAST thing on the page instead of the organizing principle of it?
2. The site already wrote a curriculum (01→10, "Series" ×4). Who decided the tags outrank the syllabus?
3. Who has ever wanted to filter educational content by "Payer" BEFORE knowing what a payer is? The filter presumes the literacy the page exists to build.
4. What tells a reader the tools hub is a toolbox (grab anything) and the learn hub is a course of study (order matters)? Right now: nothing.

## The Ideology Answer: Catalog vs Curriculum

The V3 conversion made the page LOOK better and CHOOSE worse. A pure catalog treats articles as interchangeable inventory; these articles are explicitly NOT interchangeable (01 is the framework everything hangs off; 02-05 walk the four players in order). Real-estate grammar works when the user arrives knowing their query; learners arrive NOT knowing their query — that is what makes them learners. But a locked curriculum (forced sequence, progress gates) is also wrong for working professionals arriving mid-path on phones. The site's native ideology, stated in its own hero, is a MAP WITH A ROUTE DRAWN ON IT.

**Recommended hybrid — "the route over the shelf":**
1. A "Start here" series strip between hero and grid: mono numbers 01→10 as stepper nodes, 01 marked as trailhead, 06 shown honestly as a gap, read-state ticks via localStorage.
2. Regroup the grid under the shelf-header grammar already on the page: "The Series · read in order" (sorted by number) / "Methods & Field Guides" / "Field Reports · guest authors" / "Talks".
3. Demote filtering to a secondary lens: keep the rail, rename "Who It's For" → "The Player"/"Covers", make Talks selection scroll to the talks shelf.
4. Promote the number in card anatomy: number + genre above the tags, or fused into the title ("01 · The Four Players...").
5. Adjacent scope, the payoff: prev/next series navigation on article pages so the route is walkable once inside.

The tools hub earned its catalog: tools ARE inventory. The learn hub should be the same family at the material level and a different species at the structural level: shelves with a drawn route instead of a wall with a filter.
