# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: healthcare movers and shakers. Innovators and leaders who can sit in ANY role: clinical (RT, RN, physician), technical (informatics, health IT, data), operational, or policy. The site is built so that people driving change in healthcare find value regardless of which chair they sit in.

Per-surface audiences are deliberate and specific (confirmed by David): each tool and module is designed with a particular group in mind. The Career Tree serves students and career-changers. The maps serve data-curious clinicians, informaticists, and policy people. Learn modules serve clinicians leveling up into systems thinking. Rounds serves current-events readers. Site-level tradeoffs favor the innovator/leader reader; surface-level tradeoffs favor that surface's named group.

Operating fact: roughly a third of traffic is phones (GoatCounter, July 2026).

## Product Purpose

Healthcare Uncharted is David Eitel's practitioner-perspective brand on healthcare AI, workforce policy, and leadership, carried by interactive tools built on real public data (CMS, Census, CDC, BLS) plus editorial (Learn modules, Rounds posts, talks).

Success is all four of these at once, none ranked above the others (confirmed): an authority engine for the recognized practitioner voice, audience growth, a teaching resource for students and clinicians, and a launchpad for whatever comes later. The site grows by shipping new tools and expansions driven by user feedback and David's personal need. The workshop is the product.

## Positioning

A practitioner's insider perspective, not an analyst's overview and not a corporate blog. David came up through clinical respiratory therapy (RRT, MHA, MSRT) and now works systems, policy, and technology levers from inside Intermountain Health and UVU. Two things a neighboring site could not truthfully copy: that lived clinical-to-informatics vantage point, and the traceability discipline. Every number on the site walks back to a public source, through documented pipelines, with the honest gaps stated instead of papered over.

## Operating Context

- Solo operation. David writes, builds, QAs on his own devices, and commits/pushes manually. Claude assists in sessions; nothing ships without his sign-off.
- Static Eleventy site deployed on Netlify. No backend, no accounts, no server state.
- Data flows in through build scripts (scripts/) that pull public sources, cache raw files locally (gitignored), and ship compact derived JSON. Quarterly refresh rhythm for CMS-based datasets.
- GoatCounter is the only analytics; an in-site dashboard reads it at /secret-menu/goat-tracker/.
- The Secret Menu (/secret-menu/) is the back room: betas, experiments, and parked projects live there noindexed until promoted or resumed. Current example: the Utah hospital price finder, parked by David's call until he reopens the price project.

## Capabilities and Constraints

- Nine-plus interactive tools; the two production MapLibre maps (Hospital Operations, Pop Health Multi-Lens) are the flagships. docs/HU-UI-GRAMMAR.md governs interactive surface design (budget rules: 44px touch floor, 250ms phone motion cap, one transient surface, lazy data discipline).
- Deploy weight is watched; large datasets shard or lazy-load. First-paint fetch budget ~300KB on tools.
- Site-wide theming: dark default plus light, toggled, with a future site-wide colorblind theme decided but not built.
- Terminology that is settled: the multi-lens tool is the "Pop Health Multi-Lens Map," never "the 4Ps map" (the 4Ps is a framework tag, rendered as pills, never a backbone).
- UNDECIDED (explicitly, David 2026-07-30): monetization, paywall, sponsorship, and independence stances. No hard lines committed yet; do not assert any of them in copy or design, and do not fabricate a stance.

## Brand Commitments

- The HU Voice Kernel in CLAUDE.md is binding for all delivered content: practitioner voice, no em dashes ever, CAPS for emphasis, no AI tells, no corporate smoothness. It governs UI strings as well as prose.
- Identity: David Eitel, RRT, MHA, MSRT. Senior Clinical Informatics Analyst at Intermountain Health, adjunct faculty at UVU, founder of Healthcare Uncharted.
- Palette anchors: HU Blue #1B5FA8, HU Teal #4ECDC4, Clinical White #F6F9FC, Dark #0d1117. Fonts: Outfit (display), DM Sans (body), IBM Plex Mono (data/mono). Tokens live in src/assets/css/hu-global.css; logo assets in src/brand/.
- Sourcing standard: cite reliable .gov and reputable health organizations (KFF-tier); foundational references for concepts, then applied to healthcare. references.js is the single sourcing ledger.

## Evidence on Hand

- Real datasets shipped in src/assets/data/: 5,366 US hospitals (us-hospitals.json), POS enrichment (hospital-enrich.json), county metrics (countyData.json), suppliers, dialysis, ASCs, Utah price-transparency extracts (hospital-prices.json, hospital-cdm-ut.json), state metrics (stateData.json).
- The data observatory (/secret-menu/data-observatory/) renders the full source-to-tool lineage from src/assets/data/derived/datamap.json.
- Published articles across Learn and Rounds with share cards, two conference talks (ARMA 2026, MSRC), and an appendix of 100+ cited references.
- GoatCounter live traffic data (172 views/30d as of late July 2026; launch phase).
- ABSENT, never fabricate: testimonials, case studies, press mentions, customer counts, partnerships.

## Product Principles

1. Built for movers and shakers, addressed one group at a time. The site courts healthcare innovators in every role; each individual surface names its specific reader and serves them first.
2. Sourced or absent. A number without a walkable trail to a public source does not ship; honest gaps beat smooth estimates.
3. The workshop is the product. New tools come from personal need and user feedback, ship as betas in the back room, and earn promotion with evidence.
4. Practitioner voice, never vendor gloss. Insider reality outranks hype in both editorial and interface copy.
5. Meet readers on the device they brought. A third of the audience is on phones; interactive surfaces obey the phone budget rules before they ship.

## Accessibility & Inclusion

No external compliance requirement established. Internal standard: the Hospital Operations Map is the site's accessibility reference implementation (live regions, aria-pressed chips, keyboard-focusable states, reduced-motion discipline), and the UI grammar's budget rules (44px touch floor, motion caps) apply to every interactive surface.
