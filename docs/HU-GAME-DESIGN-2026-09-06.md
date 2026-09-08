# Healthcare Uncharted · Systems Game Design
### Roguelite architecture, the shared simulation, and Healthcare D&D
### 2026-09-06 · Design analysis for David's review. Everything labeled "existing mechanic" is verified against the shipped game at src/secret-menu/uncharted-general/index.html; everything else is labeled recommendation or long-term concept.
### STATUS 2026-09-07: v1.1 (Board Report, seasons, forecast, travelers), v2 (ownership classes, pathways, safety, anchored goals, programs, closures, unlocks), and v3 (The Table, internet play over Supabase) ARE BUILT and verified. §12 records the infrastructure as it actually runs.
### STATUS 2026-09-08: THE LADDER GREW A BOTTOM RUNG. "ER Charge Nurse" (/secret-menu/er-charge/) is built from David's 2026-09-08 brief: a REAL-TIME 12-minutes-for-12-hours ED flow game (Overcooked pacing, charge-nurse orchestration). One tick engine in sim-minutes; tap-to-place beds; six resources with acuity-first auto-claim (the player orchestrates, never micro-assigns); recipe previews on every bed card; batching bonus for same-step-behind-same-step; criticals that deteriorate instead of walking out; boarding that gridlocks beds; six one-way charge cards logged as well-timed vs quiet; a postmortem that names the bottleneck in patient-minutes and audits every card. Balance was fit by bot pairs (naive vs card-playing) until the skill gap was ~70 points and Normal punished inattention with walkouts. The ecosystem ladder now runs ER CHARGE NURSE → HOSPITAL (Uncharted General) → HEALTH SYSTEM (Uncharted Regional) → public health → policy, exactly the §25 progression in David's brief. ER multiplayer (shared waiting room, asymmetric nurse roles) is deferred: real-time state sync is a harder transport problem than the turn-based Table and comes after solo proves fun.
### STATUS 2026-09-07 LATER: GAME 2 IS BUILT. "Uncharted Regional" (/secret-menu/health-system/) implements §8's health-system design as a compressed engine: three facilities across three zones, demand allocated by DISTANCE BAND (locals claim their hospital first; only 55%/25% of a zone travels one zone over / across the region, so centralization taxes access exactly as designed), one shared workforce pool (overhiring anywhere raises the wage index everywhere), shared services, annual payer negotiation priced by market share with printed odds, zone trust with a revolt loss, projection-anchored goals (an honest lite of the flagship's feasibility engine), and a four-axis System Report. Emergent and kept: closing a line can RAISE a staffing-starved facility's remaining capacity. Deliberately deferred for Game 2: multiplayer seats (competing teams need server-held state, §12's tripwire), scenarios/codex, facility acquisition and construction. The world-state variables in §8's triage now exist as this game's ZONES/pool/trust model.

---

## 0 · Verdict up front

The shipped Hospital Operations Game is a better foundation than the brief assumes. Its constraint-diagnosis core (three throughput ceilings, the binding-limit readout), its attributable-failure machinery (feasibility-sized goals, "how it was winnable" post-mortems), and its lag-tax burnout system are unusual and worth protecting. Those ARE the identity.

What the game lacks is a reason to make strategic choices. Every run converges on the same play: find the binding constraint, buy it out, repeat. There is no score, no build identity beyond the CEO card, no risk to manage, and no decision whose cost arrives later in a form the player chose. The fix is not more realism and not more resources. It is four additions: something to optimize FOR (a scored end-state), something to bet AGAINST (forecastable uncertainty), something to BE (run-defining ownership classes), and units that TALK to each other (derived demand). Almost everything else in this document hangs off those four.

---

## 1 · What is already strong (keep, mostly untouched)

| Existing mechanic | Why it works | Player behavior it creates | What it teaches | Roguelite value |
|---|---|---|---|---|
| Three-ceiling throughput (demand / capacity / staffing) with the binding-limit label on every card | The whole game state reduces to a readable diagnosis | Bottleneck hunting, targeted spend | Theory of constraints, the core skill of operations | The "one more fix" pull |
| Feasibility-sized goals + "How it was winnable" post-mortem | Failure is always attributable | Players study losses instead of blaming dice | Operations problems have findable answers | Drives re-runs; see §3 for the cost |
| Burnout assessed AFTER the goal clears | The quarter you barely survived bills you in people, one quarter later | Players learn to leave slack | Workforce attrition as the delayed price of running hot | The best delayed-consequence mechanic in the game |
| Payer mix as a consequence of build order, gated by difficulty | Strategy is expressed through architecture, not menus | Service-line portfolio thinking | Payer economics without a lecture | Progressive complexity disclosure done right |
| Choice events with a guaranteed free option, goal sized after the pick | Decisions, never traps | Players engage instead of flinching | Real crises have only bad-and-worse options | Encounter variety |
| CEO archetypes + the No-CEO option | A one-card run seed that bends every formula | Players build around the trait | Leadership style shapes institutional incentives | The current source of run identity |
| Boss quarter cadence, Q2/Q4 draft rewards | Balatro pacing: breathe, breathe, spike | Reserve management toward Q4 | Budget-cycle rhythm | Tension curve |
| The lean goal | Inverts the growth reflex occasionally | Restraint as a valid quarter | Stewardship vs growth | Variety |
| Per-unit undo inside the quarter, physicians exempt | Planning-phase feel without save-scumming | Experimentation | Floor staffing is adjustable; medical staff decisions are political | Low-friction tactics |
| Save strings | Runs are portable and shareable | Seed-sharing culture is possible | n/a | Community surface |

Two smaller things also worth protecting: the fire-the-CEO valve (a real pressure-release decision with a governance cost) and the money scale ($k units, real-ish magnitudes) which keeps the fiction credible without accounting detail.

---

## 2 · What the roguelite is missing

Audited against the standard roguelite checklist, honestly:

- **Run-to-run variation: weak.** The event deck shuffles, but the strategy space does not. CEO choice is the only pre-run identity lever, and hospital size is a difficulty dial wearing a costume.
- **Build diversity and synergies: absent.** All 16 units are revenue machines with different coefficients. Nothing combos. A cardiac-center build and a safety-net build differ in arithmetic, not in play.
- **Risk/reward decisions: absent.** Nothing in the game is a bet. Every number shown is certain; every purchase resolves deterministically. The only randomness sits between quarters, where the player cannot answer it.
- **Irreversible decisions: nearly absent.** Construction is the only commitment. You cannot close a service line at all, which removes one of the most dramatic real decisions in healthcare.
- **Opportunity cost: thin.** Cash is the only scarce thing, and goals scale to your cash. The game rarely forces "this OR that."
- **Discovery, unlocks, meta-progression: absent.** All content is face-up from run one. Nothing carries between runs but skill.
- **A satisfying end-state: absent.** Endless mode ends in guaranteed loss with no score. Finite mode ends with a paragraph. There is nothing to optimize for, compare, or brag about.
- **Meaningful failure: partial.** Post-mortems are excellent, but because goals re-size to your current weakened state every quarter (§3), the interesting failure modes are mostly cash and morale floors, not the objectives.

Missing things I do NOT recommend adding: procedural maps, item economies, permadeath drama beyond what exists, any morality meter. None of them serve the teaching goal.

---

## 3 · The critical question: guaranteed solvability

**Existing mechanic, precisely:** each quarter's goal is sized against a greedy best-effort simulation of your CURRENT hospital, after the quarter's event is known and after any choice-event decision. So the board never asks for anything unreachable from where you stand today.

**The two-sided finding.** First: this system is the game's soul and its post-mortems depend on it. Do not remove it. Second: as built, it quietly removes two whole categories of play.

1. **It removes forecasting.** Since the goal absorbs whatever the event did, and the event is fully known before you act, the quarter is a deterministic allocation puzzle. The player never prepares, never insures, never holds a reserve against a risk. There is no such thing as a bet.
2. **It forgives decline.** A shrinking, mismanaged hospital gets shrinking goals. The feasibility anchor tracks you downward, so chronic mismanagement is re-based every quarter. Long-term consequences leak in only through the cash and morale floors and through burnout. The board, in this game, is infinitely understanding. Real boards are not, and that gap is a missed lesson.

**Recommendation: keep fairness, change what is guaranteed.** Guarantee INFORMATION SUFFICIENCY (the player could have seen it coming) and SEASON-level feasibility, not quarter-level absolution. Three channels, all of which preserve "the game never cheated me":

- **Seasons (known information).** Q3 is respiratory season, every year, printed on the calendar. Demand pressure that is fully predictable creates preparation play: staff up early, or accept the squeeze. Zero unfairness; pure planning.
- **Brewing crises (probabilistic, telegraphed).** Some events stop arriving cold. The forecast panel shows them a quarter out with honest odds and a mechanical source: "Early flu activity reported: 60% surge next quarter." "Payer contract expires next quarter." "Burnout Critical in 2 units: turnover likely." Preparation verbs answer them: temp staffing contracts at a premium, an incident-response retainer that caps cyberattack losses, a diversion agreement. When the 60% event lands on an unprepared player, the post-mortem gets a new line: what the warning said, and what preparation was available. That is a "you knew this could happen" failure, the exact target the brief names.
- **Expectation anchoring (the board stops forgiving).** Goal targets become a blend of the feasible ceiling (current system) and the board's EXPECTATION (your delivered trajectory: trailing results plus the growth trend). Easy stays 100% feasible. Normal blends roughly 75/25, Hard roughly 55/45. The expectation line is drawn on the performance chart, visible at all times. Now sustained decline eventually breaks the guarantee, LEGIBLY: you watch the expectation line and your reality diverge for quarters before it kills you. "The board does not care what is feasible" is among the truest sentences in healthcare management, and it becomes a difficulty feature instead of an unfairness.

Add one source of in-quarter, player-CHOSEN variance from the safety system (§6.3): running a unit past its safe load is a visible gamble with printed odds. That gives Hard-mode players a risk dial they control, which is the honest way to add luck to a fair game.

---

## 4 · The 18XX reading

The transferable principles, not the trains: scarce capital with competing uses, timing as the skill, commitments that outlive the decision, forced reinvestment cycles (train rust), and positions that interlock with other actors. Hospital translations, sorted by decision character:

| Decision | Horizon | Reversibility | Risk shape | 18XX ancestor |
|---|---|---|---|---|
| Hire floor staff | Short | Reversible (severance + morale) | Low | Running trains |
| Raise wages | Medium | Sticky downward (cutting pay should sting more than raising it) | Low, compounding | Dividend policy |
| Expand a unit | Medium | Irreversible | Medium | Track laying |
| Build a service line | Long | Irreversible-ish | High upside | Route building |
| CLOSE a service line (new) | Long | Irreversible, community backlash, regulatory friction | Defensive, painful | Abandoning a route |
| Borrow | Short cash, long drag | Reversible at interest | Medium | Loans/emergency money |
| Equipment/tech generations (new) | Long | Aging clock, replace early or break down late | Timing bet | TRAIN RUST, the purest import |
| Prevention/community programs (new) | Very long | Reversible but slow to mature | Strategic, revenue-negative | Investing in another company's route |
| Payer contract terms (exists as event; could become a negotiation) | Annual | Committed for the term | Medium | Contract/market positioning |

The deepest 18XX idea, two-pocket economics (company treasury vs player wealth), maps onto OWNERSHIP: whose money is it, and what does the owner demand? That becomes the class system in §6.1, and at system scale, the tension between system HQ capital and facility budgets.

The train-rust import deserves emphasis: a capital renewal clock (imaging fleets age, EHR generations obsolete) creates the timing pressure and boom/bust rhythm 18XX games run on, and it is a real thing hospital CFOs literally schedule. One clock, two or three asset classes, no more.

---

## 5 · Diagnosis: the ten problems, ranked

| # | Problem | Why it matters | Current cause | Recommended fix | Teaches | Gameplay effect |
|---|---|---|---|---|---|---|
| 1 | No end-state or score | Nothing to optimize for; endless mode ends in unscored death | endScreen prints a paragraph | The Board Report: a graded multi-axis scorecard (§6.4) | The quadruple aim as lived tradeoffs | Every run gains a purpose and a comparison |
| 2 | Zero risk, total certainty | No forecasting, insurance, or reserves; quarters are solved, not played | Events known before action; goals absorb events | Seasons + telegraphed crises + preparation verbs (§3) | Risk management, preparedness | Adds the missing decision category |
| 3 | Runs converge | Replayability ceiling; no strategic identity | Only CEO differentiates; all units are interchangeable revenue | Ownership classes (§6.1) + derived-demand pathways (§6.2) | Governance shapes strategy; hospitals are systems of services | Distinct archetypes worth re-running |
| 4 | The board forgives decline | Long-term consequences muted; only cash/morale floors kill | Goals re-anchor to current feasibility every quarter | Expectation-anchored goal blending (§3) | Institutions judge you against expectations, not your excuses | Decline becomes a visible, legible threat |
| 5 | Quality does not exist | Half the game's own thesis (access, affordability, QUALITY) is absent | No mechanic | Safety-load system (§6.3) | Volume vs safety | A player-controlled risk dial |
| 6 | No discovery or meta-progression | All content face-up from run one | No unlock structure | Unlock tracks + scenario seeds + a codex (§6.5) | Real-world scenarios, one per unlock | Long-arc retention |
| 7 | Units never interact | No combos, no build language | Independent unit arithmetic | Derived demand between units (§6.2) | Referral flows, care pathways | Synergy hunting, the roguelite drug |
| 8 | Demand is a scripted hand | The world is not real; growth pressure is invisible fiat | grow = 2.5% × quarter + small rep term | Near term: make growth legible on-screen and partly earned. Long term: demand becomes an output of the world state (§8) | Where patients actually come from | Growth becomes a system, not a treadmill |
| 9 | No prevention lever | The ecosystem's central conflict is absent from game one | No mechanic | Community programs (§6.6): pay now, ED demand falls later, revenue dips, access score rises | The prevention paradox, in miniature | Plants the Game 3 discovery early |
| 10 | Crises lack the opportunity half | Events are punishments; real disruptions redistribute | Passive events are pure debuffs | Rework a third of the deck to problem + opening (competitor closure = surge AND market share; disaster = costs AND emergency funding eligibility) | Disruption creates winners | Events become decisions even when passive |

Explicitly NOT problems, despite the checklist: the deterministic in-quarter math (it carries the diagnosis pedagogy), the small event deck (expandable content, not a design flaw), and the guaranteed-free-option rule on choice events (keep forever).

---

## 6 · Hospital Roguelite v2

Everything in §5 assembled into one design. Existing mechanics stay unless named. Each major addition carries its five-part justification inline.

### 6.1 Ownership classes (recommended change, the big one)

Chosen at run start, before the CEO. The class sets the Board Report's scoring weights, one unique mechanic, one standing constraint, and event exposure. The CEO becomes the subclass. Starter class is Nonprofit; the rest unlock.

| Class | Score weights lean | Unique mechanic | Standing constraint | Event exposure |
|---|---|---|---|---|
| Nonprofit Community | Balanced | Foundation: donation events amplified, an annual fundraising action | Charity-care floor: safety-net share must stay above a line | Community expectations |
| For-Profit / PE-backed | Margin ×2 | Investor capital injections on demand | Quarterly margin covenant: a standing second goal | Reputation gains dampened; exit-pressure events |
| Public District | Access ×2 | Tax levy: a small guaranteed income floor | Service closures require a public fight; wage pressure events | Political events |
| Academic Medical Center | Quality + workforce ×1.5 | Residency pipeline: cheaper labor that matures into hires | Teaching overhead on every unit | Grant and accreditation events |

Justification: (1) solves run convergence at the root; (2) creates behavior: players plan builds around the covenant or the charity floor from turn one; (3) teaches that GOVERNANCE, not management skill, explains much of why hospitals behave differently, the least-understood fact in the field; (4) replayability: four class × six CEO combinations with real texture; (5) complexity cost: four rule bundles, mitigated by unlock gating so a new player sees exactly one.

### 6.2 Derived demand: units that feed each other (recommended change)

Some unit demand stops being scripted and becomes generated by other units' throughput. OR patients generate rehab demand. ED overflow boards into Med/Surg when the ED is staff-limited (boarding, named on the card). Cardiology and Imaging lift each other's effective staffing capacity. OR plus ICU unlocks a complex-surgery demand tier at premium revenue. Telehealth siphons a share of low-acuity ED demand.

Justification: (1) solves unit non-interaction; (2) behavior: build-order becomes pathway design, players chase combos; (3) teaches referral flows and why hospitals are portfolios, not collections; (4) replayability: synergy discovery is the genre's engine; (5) complexity: each link is one data edge on the existing demand model, and CRITICALLY, derived demand is the exact abstraction the health-system game needs later, when the edges cross facilities. Build once, reuse at the next scale.

### 6.3 The safety system (recommended change, the quality axis)

Each unit has a safe load, roughly 92% of staffing capacity, adjusted by physician coverage. Throughput above it accrues visible INCIDENT RISK with printed odds. Incidents are probabilistic events: a fall, a medication error, a sentinel event on the bad end, costing cash, reputation, and the Quality grade. Slack staffing, safety upgrades, and good morale lower the odds.

Distinct from burnout on purpose: burnout is the CHRONIC price of running hot, paid in people over quarters. Safety is the ACUTE gamble of running hot, paid in incidents this quarter. Same cause, different time signatures, different answers, and only safety is a bet the player consciously places. Justification: (1) fills the missing quality axis; (2) behavior: the 98%-load quarter becomes a decision with odds instead of free money; (3) teaches the volume-safety frontier; (4) adds the only in-quarter randomness, fully player-purchased; (5) complexity: one meter per unit, one event family.

### 6.4 The Board Report (recommended change, the end-state)

Every run ends with a graded report, win or lose: MARGIN (cumulative net, ending cash, debt), ACCESS (lifetime service level, breadth of lines, safety-net share), QUALITY (incident record, safe-load discipline), WORKFORCE (average morale, total turnover, peak burnout). Per-axis letter grades, a composite weighted by ownership class, and a shareable summary (the save-string pipe already exists). Finite victories get the report as the trophy; endless deaths get it as the epitaph.

Justification: (1) solves the no-end-state problem; (2) behavior: players choose what to maximize and discover the axes fight each other; (3) teaches the quadruple aim without ever naming it, and WITHOUT a morality system: a PE run that grades A/D/C/B is a legitimate strategy, described, not judged; (4) replayability: grade chasing, class-specific leaderboard framing; (5) complexity: display-layer math over stats the engine already tracks. The single cheapest high-impact item in this document.

### 6.5 Meta-progression and discovery (recommended change)

Unlock VARIETY, never power. Classes and CEOs unlock via achievements (post a margin streak to unlock PE; run a year at Access A to unlock Public District). Scenario seeds unlock as authored challenge runs drawn from real situations: the rural OB desert, the post-pandemic staffing cliff, the cyberattack month, the PE flip. A codex (the Chart Room) logs every event, synergy, and incident the player has seen. Nothing numerical carries between runs.

Justification: (1) retention arc and discovery; (2) behavior: goal-directed re-runs; (3) each scenario is a real-world teaching case, which is the site's stated model (challenges from real situations); (4) replayability is the whole point; (5) complexity: localStorage plus content authoring, no engine change.

### 6.6 Community programs (recommended change, the prevention seed)

One panel, two or three programs (ED diversion clinic, chronic disease management). Each costs cash per quarter, takes three or four quarters to mature, then durably reduces ED/Med-Surg base demand while boosting the Access grade. Net revenue impact: slightly negative. Capacity and burnout impact: meaningfully positive.

Justification: (1) plants the ecosystem's central conflict inside game one; (2) behavior: late-run players discover prevention as a capacity strategy; (3) teaches THE lesson (what is good for the community can be bad for the income statement) with no villain; (4) modest replay value, high transfer value to Game 3; (5) complexity: one demand modifier with a delay timer.

### 6.7 The loop at four time scales

- **Quarter (tactical):** read the forecast, prepare or gamble, fix the binding constraint, place or decline the safety bet, run it. Resolution order unchanged from today, with incidents resolving after the goal check, beside burnout.
- **Year (operational):** the seasonal calendar (Q3 surge, Q4 boss plus budget), the Q2/Q4 drafts, the year-end board review where expectations re-anchor.
- **Run (strategic):** class identity, pathway build-out, the capital renewal clock ticking, programs maturing, the expectation line converging on you. Ends in the Board Report.
- **Meta:** unlocks, scenarios, the codex, seed sharing.

Failure states: the existing four, plus expectation-driven goal failure (legible decline) and incident catastrophes (purchased risk). Victory: finite-run completion, now graded. Scoring: the Board Report. The "decision that saves this quarter weakens next year" requirement is now satisfied structurally: austerity and overload feed burnout AND safety; prevention trades revenue for future slack; the covenant rewards margin moves that starve the workforce axis; the renewal clock punishes deferred capital exactly one generation later.

---

## 7 · The healthcare economic engine (shared across all four games)

Seven primitives power every layer. The hospital game implements them with constants where later games grow systems. That sentence is the architecture: **every hardcoded constant in game one is an API surface for games two through four.**

| Primitive | In the hospital game today | Becomes, at larger scales |
|---|---|---|
| DEMAND (by acuity and payer) | Scripted ramp + payer profiles | Allocated by region, competition, access; modified by prevention; ultimately by population health |
| WORKFORCE (count, pay, burnout, skill) | Hire-anytime at fixed prices | A regional labor MARKET: shortages, poaching, pipelines, licensure policy |
| CAPACITY (physical, aging) | Capacity numbers + construction | Regional bed/service inventory; renewal cycles; certificate-of-need policy |
| MONEY (operating) | Cash, the hull | Facility P&Ls rolling into system finance, payer pools, public budgets |
| CAPITAL (committed, timed) | Capex + build quarters + loans | Capital markets, bond ratings, system allocation fights |
| TRUST (reputation, community) | Reputation stat | Community trust as a regional stock that policy and closures move |
| INFORMATION (forecasts) | The forecast panel | The asymmetric-information currency of multiplayer: who knows what, and what a forecast is worth |

Scarcity: money short-term, workforce mid-term, trust long-term. Compounding advantages: pathways (derived demand), workforce stability, trust. Strategic traps, deliberately: the margin covenant, deferred capital renewal, growth that outruns the labor pool. Tradeable (multiplayer): capacity (transfers), money (rates, funding), information (forecasts), commitments (contracts). Externalities: wages set regional floors, closures dump demand on neighbors, prevention helps everyone's capacity and no one's revenue.

---

## 8 · Shared simulation architecture

One world, four lenses, entered from the bottom:

```
POLICY / PAYER        sets: reimbursement rates, coverage mix, public
   |                        health funding, licensure, taxes
   v
PUBLIC HEALTH         moves: disease burden, prevention, preparedness,
   |                        community trust
   v
HEALTH SYSTEM         allocates: capital, service lines, transfers,
   |                        shared services, market position
   v
HOSPITAL  (SHIPPED)   operates: staffing, capacity, flow, quality, cash
   |
   v
COMMUNITY / WORLD STATE   population, age mix, disease burden, coverage,
                          workforce pool, economy, trust
        ^                                            |
        +----- outcomes feed back up every layer ----+
```

**World-state variables, triaged** (the anti-spreadsheet discipline):

- **Core (must exist, single digits of them):** population size and age mix, disease burden index, coverage mix (the four payers), regional workforce pool, community trust, an economy index.
- **Derived (calculated, never stored):** demand by acuity, labor prices, uninsured rate, utilization.
- **Hidden (simulation only):** true underlying disease trends, event probability tables.
- **Player-visible (per role):** each seat sees the derived views its real-world counterpart would see, which is the §9 information asymmetry for free.
- **Narrative:** everything else. If a variable would only ever be read in a briefing, it is a sentence, not a number.

**The feedback loop map** (polarity, delay, who can touch it):

| Loop | Shape | Delay | Danger | Who holds the lever |
|---|---|---|---|---|
| Financial: revenue → investment → capacity → volume → revenue | Reinforcing | Quarters | Overbuild into a downturn | Hospital, System |
| Workforce: pay → morale → retention → staffing → workload → burnout → retention | Reinforcing both directions | Quarters | THE death spiral; already implemented via burnout | Hospital |
| Population: population health → utilization → demand → access → population health | Balancing | Years | Erodes silently | Public Health, weakly Hospital |
| Policy: policy → incentives → org behavior → outcomes → political pressure → policy | Balancing, oscillates | Years | Overcorrection whiplash | Policy |
| Technology: tech → efficiency → capacity → reinvestment need → future efficiency | Reinforcing with a rust clock | Years | Deferred renewal cliff | Hospital, System |
| Prevention: prevention → less disease → less utilization → less revenue → defunding pressure | Balancing against itself | Years | The tragic loop; the game's thesis | Public Health vs everyone's margins |
| Crisis: shock → demand spike → strain → outcomes → reputation → demand | Reinforcing, fast | Weeks | Runaway during events | GM ignites, players fight |

Sequencing rule: the world-state model stays a DESIGN FICTION until the health-system game is real. Game one only needs its constants documented as future variables. Building the world model first is the spreadsheet trap the brief warns about, wearing an architecture costume.

**Game 2 (Health System) in one paragraph:** the hospital becomes a CARD. Each facility runs a compressed version of the game-one engine (same rules, lower resolution), and the player plays allocation: capital across facilities, service-line placement (duplicate cardiology or centralize it), transfer agreements, shared services, one payer negotiation per year. Derived demand edges now cross facilities, which is why §6.2 builds them now. The designed lesson, on purpose: the best hospital strategy is sometimes the wrong system strategy (the flagship wants the cardiology line that the region needs at the community site).

**Game 3 (Public Health):** the prevention seed grown into the whole garden, played against the population loop's delays. **Game 4 (Policy):** see §12; recommended as a GM toolkit and scenario layer before it is ever a standalone game.

---

## 9 · Multiplayer: Healthcare D&D

**The founding constraint:** multiplayer v1 is the EXISTING hospital game dealt out as seats, not a new game. Same engine, same board, same quarters. (Room code + nickname joining is already ruled; the solo game is already the tutorial by design.)

**Seats (3 players + GM is the target; scales 2-5):**

| Seat | Owns (verbs) | Private information | Personal scorecard lean |
|---|---|---|---|
| CEO / Operations | Build, expand, austerity, programs; ties break through them | Board expectation detail, event forecasts | Composite + Access |
| CFO / Finance | Budget sign-off on every spend, loans, payer terms, the covenant | True cash forecast, renewal clock, covenant math | Margin |
| Chief Clinical Officer | Staffing, pay, physician hires, safety load, privileges | Burnout detail per unit, incident odds, turnover warnings | Quality + Workforce |
| GM (the world) | Event deck, forecasts, and ALL external hats: payer, government, community | Everything hidden | n/a |

With five players, split CEO/Operations in two; with two, fold Finance into CEO. The CFO-as-separate-seat only earns its chair at four-plus humans.

**The quarterly ritual (the actual game):** GM briefing (the situation, the forecast, any external offer) → planning (each seat proposes within its verbs; money requires Finance, people require Clinical, direction requires CEO) → commit → resolve → post-mortem read aloud. Negotiation is not a rules module; it EMERGES from verb ownership plus information asymmetry: Finance literally cannot see burnout detail, Clinical literally cannot sign spending. The moment the CCO says "I need two RNs in the ED" and the CFO says "show me why," the game is working.

**External actors as GM hats, not player seats (v1):** the GM plays the payer's contract offer, the state's emergency funding with strings, the community's demand to keep OB open. Scripted offer cards make this playable by a novice GM: each card is a deal with a price ("The payer offers +5% rates if you hit 95% service two straight quarters"). Crisis events follow the problem-plus-opportunity rule from §5.10 and are sized to require at least two seats to answer, which is the coordination engine.

**Cooperative structure: semi-cooperative, no traitor.** The run survives or dies TOGETHER (shared loss conditions, unchanged), but the Board Report grades each seat's axes separately. Tension comes from legitimate competing objectives, never from hidden sabotage; a traitor mechanic would teach exactly the wrong lesson about why healthcare stakeholders conflict. Voting exists only for irreversible acts: closures, class-defining choices, firing the CEO (the mechanic already exists and becomes delicious with a human in the chair). Competitive-institutions-within-a-cooperative-ecosystem arrives later, at system scale, when two hospital TEAMS share one region and one workforce pool.

---

## 10 · Learning architecture

| Game | The player does | The player learns | Misconception challenged | Systems skill built | Transfers forward |
|---|---|---|---|---|---|
| Hospital (solo) | Diagnose constraints, allocate under a board's eye, place safety bets, weather seasons | Operations under constraint; every lever moves three things | "Hospitals fail because people are lazy or dumb" | Bottleneck thinking; delayed cost accounting | The vocabulary and dashboard literacy every later seat assumes |
| Hospital (multiplayer) | Argue for a slice of a shared budget from a partial view | Your colleague's "obstruction" is their legitimate objective | "We all want the same thing" | Negotiation under asymmetric information | Role empathy for scale two |
| Health System | Allocate capital and service lines across facilities | Portfolio logic; local excellence vs regional design | "More hospitals and more services = better care" | Network and portfolio thinking | Sets up the payer/regional view |
| Public Health | Invest in slow loops against fast crises | Prevention economics and delay | "Healthcare produces health" | Stock-and-flow reasoning | The population view policy needs |
| Policy (GM layer first) | Pull incentive levers, watch four layers respond | Second- and third-order consequences | "Policy is a dial you set to the right value" | Feedback-loop anticipation | The full-system view; GM mastery |

The discovery ladder the brief specifies (improve a metric → hurt the system → need another player → their incentives differ → negotiate → today's fix is next year's crisis) maps one-to-one onto: solo Board Report → multiplayer seats → GM offers → expectation anchoring plus the renewal clock. No step requires a lecture; every step is a mechanic above.

---

## 11 · Build order

**MVP: shipped.** The current game already proves the core loop (46 tests, playable, portable saves). The concept is proven; the brief's MVP question is answered by the repo.

**v1.1, "The Board Report" (small, next):** the scored end screen, the seasonal calendar, forecast panel v1 with two or three telegraphed events, and one preparation verb (temp staffing). Cheapest set that adds an end-state AND the feel of risk. Proves the two riskiest design bets before any deep work.

**v2, "Run Identity" (the big single-player revision):** ownership classes, derived-demand pathways, the safety system, expectation-anchored goals, community programs, service closure, the renewal clock, unlocks + scenarios + codex. Order within v2: classes and pathways first (identity), safety and anchoring second (pressure), meta last (retention).

**v3, "The Table":** seats on the same engine, GM console and offer cards, room codes. No new simulation.

**v4, the ecosystem:** health-system game on the hospital-as-card engine; then public health; policy as GM tooling throughout, standalone only if it ever earns it.

Rule for all of it: nothing from v2 starts until David has played v1.1 and the Board Report's axes feel right, because every later layer scores against those axes.

---

## 12 · The infrastructure as built (2026-09-07)

The record of what actually runs, so future games are designed WITH it instead of around it.

**The mental model: a relay, not a server.** There is no game server. The whole game runs in the
host's browser tab. Supabase Realtime is a walkie-talkie tower: browsers tuned to the same channel
(`ug-table-MDER`) pass small messages through it, and it stores NOTHING. No accounts, no rows, no
history. When the last player leaves, the table never existed. That is why multiplayer costs $0 and
has no maintenance: nothing is running when nobody is playing.

```
   HOST BROWSER (the authoritative run)
      |  state envelope (the save-string format)     ^  seat intents (verb + data)
      v                                              |
   SUPABASE RELAY  channel ug-table-<CODE>, holds nothing
      |                                              ^
      v                                              |
   GUEST BROWSERS (render state; own one seat's verbs)
```

**Concurrency is free.** Every table is a channel name; channels are independent. N simultaneous
tables of one game, and different games side by side, coexist on one Supabase project by channel
prefix (`ug-table-`, `hb-table-` for the Health Board, and so on). One project serves the entire
multiplayer catalog. Room codes have ~280k combinations; a live collision is lottery-odds and
costs one confused lobby.

**The ceilings (free tier, verified 2026-09-07):** 200 concurrent connections (~50 four-person
tables at once, across ALL games), 2M realtime messages/month (a game night burns 1-2k, so roughly
a thousand game nights a month), 256KB per message (envelopes run 10-30KB). The one limit that
actually bites: a free project PAUSES after ~7 idle days; a paused project means tables cannot
connect until someone hits restore in the dashboard. If that gets annoying, a keep-alive ping is a
ten-minute fix, and the $25/mo Pro tier removes pausing and raises connections to 500. That is the
entire scaling story at this site's scale.

**What the host-authoritative model buys and what it costs.** Buys: zero cost, zero data
liability (nothing to breach), cheat-proof guests (the host validates every intent), and built-in
disaster recovery (a dead host pastes the save string into a new table; the save system and the
network are the same machinery). Costs, by design: the host must stay online (game-night shape,
not play-across-days), a reload leaves the table (rejoin is a build item, not an architecture
limit), room codes are a social gate not a security gate (friends yes, strangers no), and the
host CAN cheat, which is fine because the host is the GM.

**The tripwire for moving state server-side.** The day the roadmap needs persistent async games,
stranger matchmaking, leaderboards, or COMPETING teams sharing one world (the health-system game's
eventual shape, where the host would also be a rival), authoritative state moves into the database
half of the same Supabase project behind row-level security. Nothing built so far is thrown away:
the pure-data state, pack/unpack serialization, and the verb-permission table are exactly what a
server version needs. The transport is a plug; that day we change the plug.

**Three rules for every future game:**
1. Engine = pure data + a verb table. State serializes to JSON; every mutation is `(verb, data)`
   through one dispatcher. Uncharted General's payoff: its save system became its network protocol
   for free. Build the Health Board this way and multiplayer costs a week, not a rewrite.
2. The second multiplayer game extracts the table kit (lobby, seats, transport, sync) into a
   shared module. Not before: one consumer is not a pattern.
3. One Supabase project until it hurts. Games share it by channel prefix; the parked survey tool
   uses the database half of the same project when it wakes.

## 13 · Where this document pushes back on the brief

1. **Do not build the shared world-state model now.** Design it on paper (done, §8), implement it never, until game two exists. Premature world models are the giant-spreadsheet failure the brief itself bans.
2. **The Policy game is the weakest of the four as a standalone.** Low verb density, high abstraction, menus all the way down. Policy is the GM's hat and the scenario layer's author for a long time before, if ever, it is a solo game. The brief's own constraint 16 (prioritize interesting decisions) argues this.
3. **The role list conflates two different multiplayer games.** CEO/CFO/Clinical are seats INSIDE one institution; Payer/Government/Community/Public Health are actors BETWEEN institutions. The first is v3 and playable with friends soon. The second needs the system scale and should not be attempted first. Sequence them; do not design one lobby for both.
4. **Equity metrics before equity mechanics would be tokenism.** An "equity score" bolted onto the current engine measures nothing the player can affect. The honest path: safety-net share and access ARE the v2 equity surface; population-level equity waits for the population.
5. **Several realistic systems would make the game worse and are refused on purpose:** claims adjudication detail, disease taxonomies, geography before the system game, individual patient records. Realism budget goes to incentives and delays, where the learning is.
6. **One brief assumption endorsed loudly:** preserving the current game's identity. The constraint-diagnosis core plus attributable failure is the moat. Nothing in this document replaces it; everything sharpens what it is FOR.

---

*Grounding note: the playbook of record for the shipped mechanics referenced throughout is the 2026-09-06 manual (conversation deliverable; recommended home docs/HU-HOSPITAL-GAME-MANUAL.md). Formulas cited there were read from the live code and are accurate as of commit-pending state on that date.*
