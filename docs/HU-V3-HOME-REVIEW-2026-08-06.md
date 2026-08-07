# HU V3 · HOME PAGE DESIGN REVIEW
### 2026-08-06 · David's review-team protocol · review only, no code changed
### North star: instrument, not document. Zillow model. Audience event: first test users.

---

## Executive Summary

**Strengths.** The hero's live status panel is the most product-true element on the page: real counts from real collections, mono captions, updated stamp. The canvas honeycomb + compass easter egg is genuine brand character no template has. Start Here is the right IDEA (three roles, three doors) and its copy is strong. Sources are cited on the front door, which no competitor does. The QP3 pass left it clean of AI tells.

**Weaknesses.** The page is a DOCUMENT: nine stacked sections, three different card grammars, reading top to bottom, with the product buried. The primary CTA sends first-timers to the Atlas, the most abstract surface, while the tools you call the site's best work sit fourth, showing only 3 of 8 by order number (the compass, order 8, never appears in that row). There is NO SEARCH anywhere: `SEARCH_DATA` (line 635) has no consumer, it is dead code. The featured carousel shows one ~900px card at a time, hiding 80% of featured content behind clicks. Phone gets the same stack shrunk, exactly the pattern the Zillow model rejects. Roughly a third of the page below the fold is about-the-author mass duplicating /about/.

**Priority scores (10 = ship-ready for test users):**
Purpose clarity 5 · Journey efficiency 4 · IA 4 · Navigation 5 · Desktop UX 5 · Mobile UX 3 · Visual consistency 6 · Accessibility 7 · Performance 7 · Scalability 4

**High-impact opportunities:** (1) action-first front door with real generated search; (2) a phone-native home that is its own view; (3) tools promoted from row four to the show; (4) one card grammar.

---

## Detailed Findings

### Purpose
The 5-second test half passes. A first-timer learns WHAT this is (mapping healthcare's hidden systems, the headline and hero atmosphere do that well) but not WHAT TO DO. The single primary button, "Explore the Atlas" (line 400), routes to the hardest-to-parse surface on the site. The intended action for a first visit, per the phase brief, is "get into a tool that matches my role," and that action is a scroll-and-a-half away in Start Here. Evidence: the hero reserves 88vh (line 18) with content bottom-anchored; the value-action block arrives at section three.

### User Journey
Travel clinician (a core test-user face) to the Assignment Compass: nav → Tools → scan an 8-card flat grid → click. Three interactions plus a scan, and zero home-body paths lead there (the tools row shows first-3-by-order; the compass is order 8). Zillow's law: the primary action is one interaction from landing. Analyst path is the best journey on the page (Start Here card 2 → SQL game direct). Rounds → Learn → About ordering below is coherent. There's no "return visitor" journey at all: nothing surfaces what changed since last visit except the carousel's date stamps.

### Information Architecture
Nine sections, three card grammars (`featured-card`, `start-card`, global `card`), two voices (product rows vs marketing/about mass). The stats bar (lines 550-573) is editorial trivia, four fixed history facts, on the same page as a LIVE status panel; the instrument version of this page would let live data do all the talking. About section + credentials strip + footer bio = the author appears three times before the footer. Curation is implicit everywhere: `order` numbers pick the tools row, hand-flags pick the carousel, a hand-typed dead array was the search index. Nothing on this page is generated from the real content graph except the status counts.

### Navigation
Five nav links + Atlas pill, no search entry, no command affordance, footer lists hand-curated (the compass was missing until yesterday). SEARCH IS DEAD CODE: `SEARCH_DATA` defined, never consumed, no input rendered. For a "structured learning platform," all discovery currently rides five nav labels and luck. Breadcrumbs are a non-issue on home but the absence of any global search is the single largest navigation deficit for the whole V3 phase.

### Desktop Experience
Content capped at 1100px; on a 27-inch display the page is a centered column with acres of dark margin, a document behavior. The carousel spends a full section row to show ONE card. The hero's bottom-anchored layout means a 1440p first paint is ~70% atmosphere. The status panel and the canvas are the two elements already speaking instrument language; neither is leveraged as layout. No two-pane behavior exists anywhere on the page.

### Mobile Experience
The phone pass (lines 348-358) fixes real crimes (hero height, button wrap, 44px carousel controls) but the EXPERIENCE is the desktop stack reordered by nothing: phone users get hero → carousel → start → tools → rounds → stats → citations → about → creds. Thumb-zone: empty. Bottom of screen: nothing docked, no persistent action, the nav is top-hamburger. Start Here CTAs are 12px text links (line 284), under the 44px floor as tap targets. The canvas animation still initializes on phones (draw-once, so cost is bounded, but it's first-paint work for atmosphere the phone barely shows).

### Visual Design
Post-QP3 the page is consistent in finish but FLAT in David's own verdict, and the review agrees on cause: the page has almost no elevation hierarchy; every section sits on the same plane with hairline separations. Zillow-family products separate zones with surface changes and real card elevation. The three card grammars also fight: featured cards are 32px-padded plates, start cards are raised tiles with top-edge accents, tool cards are the global card. One grammar should win.

### Accessibility
Good bones: skip link, compass button carries a real aria-label, reduced-motion guard on the secret tile, focus-visible styles present, light theme flips complete. Findings: `scrollIntoView({behavior:'smooth'})` in the carousel isn't gated by prefers-reduced-motion; start-CTA tap targets under floor; carousel lacks `aria-roledescription="carousel"` and slide position announcement; 10px mono at `--t3` on `--dark` sits near the 4.5:1 boundary (the caption-ink lesson from the reskin QA applies here too).

### Performance
Bounded: canvas draws once, no scroll listeners of note, one lazy image. External deps (fonts, lucide from unpkg, GoatCounter) are the only third-party weight. Dead SEARCH_DATA ships ~2KB of never-read JS. Not a bottleneck page.

### Scalability
Double the site and home degrades silently: tools row still shows 3-by-order, carousel grows linearly (one visible at a time), footer and any hand lists drift (proven by the compass incident), and there is still no search. The page has no mechanism that gets BETTER with more content, which is the defining property the Zillow model would give it.

---

## Recommended Changes

### High Impact
1. **Action-first front door.** The top of the page becomes one decision block: a real search/command input ("Where do you want to go?") plus the three role paths as immediate, tappable entries. Benefit: the 5-second test passes for DOING, not just being; every test user lands one interaction from their tool. Complexity: high (layout concept + search build). Effort: the concepts board decides shape; build ~2-3 sessions.
2. **Generated global search.** Build the index at build time from tools.js + learn/rounds/talk collections + atlas nodes; one search component, available site-wide (nav entry + `/` shortcut); delete the dead array. Benefit: kills the hand-list drift class forever, makes 2x scale a non-event. Complexity: medium. Effort: ~1 session, mostly index generation.
3. **Phone home is its own view.** Phone-first stack: search + role paths + top tools in the first screen, canvas reduced to a compact brand band (or deferred), about/stats mass collapsed or dropped on phone. Candidate: persistent bottom action bar (ties to the chrome question). Benefit: this IS the Zillow split on the highest-traffic page. Complexity: medium-high, coupled to chrome. Effort: part of the same build as #1.
4. **Tools become the show.** The tools presentation moves up and shows the real shape of the catalog (the travel-work and infrastructure clusters from the phase brief), fed from tools.js, not order-number truncation. Benefit: the product sells itself; the compass class of invisibility can't recur. Complexity: low-medium. Effort: <1 session once grammar is chosen.
5. **One card grammar.** Retire the one-at-a-time carousel (rail of 2-3 visible cards, or a ranked "new on the site" list fed by dates) and unify featured/start/tool cards on one component with variants. Benefit: consistency, less code, denser signal. Complexity: medium. Effort: ~1 session.

### Medium Impact
6. Promote LIVE data over trivia: the stats bar either becomes live observatory numbers (facilities mapped, datasets tracked, last pull dates) or moves to Learn. The hero status panel grammar is the template.
7. About mass consolidates to one compact strip; /about/ owns the story.
8. Touch floors on start CTAs; carousel a11y attributes; gate smooth-scroll behind prefers-reduced-motion; recheck 10px/t3 contrast spots.

### Low Impact
9. Delete dead SEARCH_DATA once real search ships. Citations bar folds into the stats treatment. Lab-notice copy refresh ("Map section active" assumes context a first-timer lacks).

---

## Future Considerations
- Return-visitor memory (localStorage recents: "pick up where you left off," last tool, last article) — the Zillow "saved homes" instinct without accounts.
- Per-role landing variants once test-user data shows which door dominates.
- The bottom-bar chrome question should be settled at the chrome/concepts stage, not per-page.

## Questions (for David before the concepts board)
1. The hero canvas + compass easter egg: keep as a compact brand moment (my recommendation), keep full-bleed as today, or let concepts drop it entirely? It is the page's soul but also its biggest space spender.
2. Is home selling to OUTSIDERS first (test users arriving cold) or serving RETURNERS first? Changes what the first screen holds. My recommendation for this milestone: outsiders first.
3. Primary first-time reader, one face: the working clinician curious about the system? The traveler? The analyst? (Start Here's three doors stay either way; this only decides who the FIRST screen speaks to.)
