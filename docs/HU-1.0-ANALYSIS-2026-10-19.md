# Healthcare Uncharted at 1.0 · the whole-site analysis

Written 2026-10-19, overnight before David's 1.0 review, on his ask: "Consider any skills, ideas, templates, Goals that
we need to consider. Expand beyond inital paramters and provide me a full analysis of the sites features, tools,
functions and overall value to viewers so that we can make 1.0 a Really solid start to the future development of the
site."

How it was made: six read-only reviews ran in parallel (tools and maps, games, reading content, platform and operations,
the plans already on file, and an outside look at comparable sites). Every claim below points at a file or a dated
source. Where two reviews disagreed, the code was read to settle it, and the settled answer is what appears here. This
is a reference doc (it ranks with the rest of docs/); nothing in it is a ruling until David says so.

---

## 1. The short version

Healthcare Uncharted at 1.0 is 64 live pages: nine tools and the Atlas, four public games plus three in the secret menu,
16 Learn modules, five Rounds essays and two talks, all held by a 705-test suite and a 48-minute full check that loads
every page at nine screen sizes in both themes. For a site one person runs, that quality floor is unusual.

What it is, from the outside: the one place found where someone who has worked the bedside and the informatics desk
builds tools, games and essays on the same data, for the people the physician and investor writers mostly skip: RTs,
nurses, informaticists, travelers and students. Any single piece has a stronger competitor somewhere. Having all of
them in one place, from a respiratory therapist, does not.

The five strongest assets:

- Headwall. No free browser game found anywhere teaches equipment setup; the vent simulators are apps and none covers
  the wall. 79 walls, a daily, a year of daily walls from RC Week.
- The Hospital Operations Map. 5,366 hospitals, 7,557 dialysis sites, 5,611 surgery centers, suppliers and schools on
  one map, federal sources pulled June to October 2026. Nothing comparable is free in one place.
- The Cost of Living Comparison. It answers a real decision in one sentence and does the after-tax step the job boards
  skip, with the federal per diem fetched live.
- Request Routing and the informatics modules. A working team standard from inside an informatics shop; nobody else
  publishes that.
- The platform. An enforced security policy, disciplined data fetchers, privacy-respecting analytics, and a gate most
  small sites never build.

The five biggest gaps:

- No way back. The email signup came down on 2026-10-11, so RSS is the only channel the site owns, and Daily Huddle has
  no streak. Launch traffic has nowhere to land.
- Nothing new to read since 2026-09-20. The content freeze did its job (the page review is marked done), but a
  returning reader finds only games.
- Workforce and leadership are the thinnest pillars, though the brand promises both, and the RT compact David advocates
  for has no writing at all.
- Data that is aging in the flagship map (40 of its 72 measures last pulled in early 2025) and no way to take data out
  (no CSV, no citable view), which policy readers and informaticists expect.
- The back office is public. The GitHub repo is public, and DECISIONS.md row R6 carries David's own medical details,
  beside employer-related docs. Git history keeps them even after a delete.

---

## 2. Fix before the push

These are tomorrow's touch-ups, the ones that matter in front of a launch audience. Small means minutes; nothing here is
a redesign.

| # | What | Why it matters | Size | Who |
|---|---|---|---|---|
| 1 | Daily Huddle prints "A draft value, still being checked before launch." on the 16 clinical normals (src/fun/daily-huddle/index.html:830; draft:true on 16 rows of scripts/data/huddle-curated.json). David's QA check read "The normals are drafts for your check as an RRT... mark any range you would change", and he marked it Good with no changes on 2026-10-18, so under DH2 they are checked. | RTs see "draft" on ABG and vitals answers in RC Week. | S | Claude, on David's Good |
| 2 | Daily Huddle fetches its bank with no cache bypass (index.html:1256), while /assets/data/* caches for an hour plus seven days of stale-while-revalidate (netlify.toml:178). Vital Stats already fetches with no-cache (src/fun/vital-stats/index.html:973). | A returning player's first board on Oct 20 can deal from yesterday's cached bank, then change on reload. | S | Claude |
| 3 | Push by Monday night, Oct 19. Bank version 2 first deals Tuesday Oct 20; boards #1 to #6 are pinned. | After the 20th, a late push re-deals boards people already played, unless the version date moves to the push day. | S | David |
| 4 | Netlify: the duplicate project still deploys on every push (DECISIONS, Yours to do, since 2026-09-23), auto-recharge is off, and netlify.toml has no rule to skip docs-only deploys. | At zero credits every site on the account pauses and shows "Site not available". | S | David, in the dashboard |
| 5 | The public repo. DECISIONS.md R6 (medical details), docs/HU-EMPLOYER-CHECKLIST-2026-10-11.md, docs/HU-VITAL-STATS-INTERMOUNTAIN-CHECK-2026-10-01.md, agent memory files and review marks are all tracked. | Launch posts send readers to the site; the repo is one click away. | S to decide | David (Question 1, section 10) |
| 6 | The Vendor Directory's source line says "vendor statuses compiled Aug 10, 2026" (src/tools/vendor-directory/index.html:454) though the data was checked 2026-10-18; its hero ends on "Some are proven. Some are cautionary tales." (line 348), an antithesis flip the voice rules ban; its description promises a "proven" status the data does not have (133 Active, 3 Emerging, 4 Cautionary, 4 Discontinued). | A wrong date and a promise the page does not keep, on a page informaticists will check. | S | Claude |
| 7 | The Ko-fi "Support the work" link is live (src/_data/site.js:42, since 2026-09-19), while the employer checklist calls it "currently off" and the conflict-of-interest read is undone. | Income from a site that names an employer, before the policy read. | S | David: read the policy, or empty one string |
| 8 | "72 metrics" on the Population Health Map counts five measures twice (income, unemployment, housing burden, food insecurity, cost of living sit in two lenses), so it is 67 distinct (src/_data/tools.js:13 and the page description). | A count claim a policy reader can disprove. | S | Claude |
| 9 | Headwall's three open RT calls (DECISIONS row 16): the capnography port is inferred (src/fun/headwall/index.html:899), Level 2's title reads as a choice between two orders (line 1551), Level 3's flowmeter-to-chamber link is the game's guess. | This audience screenshots exactly these. | S each | David's clinical call, or hide those walls for RC Week |
| 10 | The Atlas source line still says "vendors Aug 10" (src/atlas/index.njk:873). | Same stale date as 6. | S | Claude |

Done the morning of 2026-10-19, on David's yes: items 1, 2, 6, 8 and 10. The normals no longer read as drafts (the bank
changed only in those 16 flags; a normal added later stays a draft until he checks it, and the test holds that); the bank
skips the browser cache; the Vendor Directory says "vendor facts checked Oct. 18, 2026", drops the antithesis and promises
"a status on each, from active to cautionary"; the map says 67 metrics in all three places; the Atlas line says "vendor
directory checked Oct. 18, 2026". 705 tests green; six pages clean at nine sizes, night and day.

Already done the night before: the Fun page's title now matches its heading ("Healthcare games and daily puzzles"), so a link to
/fun/ no longer previews as "Fun". It goes live with the 1.0 push and is checked after the full check finishes.

Two process notes for the review itself. First, many review and QA marks of 2026-10-18 were set on David's word ("consider
all QA finished clean"), with no fresh look behind them: twelve Learn pages, About, the blog, and the last items on the Daily
Huddle and Headwall lists. The two changes nobody has looked at on a phone are the Wild card and Headwall's Sunday daily
walls. Second, the ledger snapshot was taken four minutes before those bulk marks, so its "changed" flags read stale
until the next `npm run ledger`.

---

## 3. What 1.0 is, in numbers

| | Count | Source |
|---|---|---|
| Live pages | 64 (34 at Phase 2, 30 at Phase 1) | tmp/ledger/ledger.json, 2026-10-19 |
| What holds Phase 1 pages | 18 not on the shared reading layout, 9 with writing fixes open, 5 games missing the engine contract, 1 meta problem | same |
| Tools | 8 on /tools/, the Atlas, 2 in the secret menu | src/_data/tools.js |
| Games | 4 public (Headwall, Daily Huddle, Alarm Fatigue, Vital Stats), 3 secret (Uncharted General, Uncharted Regional, ER Charge Nurse) | src/fun/, src/secret-menu/ |
| Reading | 16 Learn modules (2 by a guest author), 5 Rounds, 2 talks, 5 policy pages | src/_data/learn.js, rounds.js |
| Tests | 705 passing, 97 files, 14,073 lines; 57 of the 97 files are game tests | tests/ |
| Full check | passed 2026-10-18 23:10 in 48 minutes; the 1.0 run was in progress at the time of writing | tmp/hub/run.json |
| Ideas on the hub | 143: 23 Yes, 15 Maybe, 3 No, 102 unanswered | data-build/ideas.json, data-build/qa/ideas.json |
| Board Inbox | 25 cards | SPRINT.md |
| Design phases open | 9 | CLAUDE.md |

---

## 4. The site, area by area

### Tools and maps

Every tool page is at Phase 2 and clean at nine sizes. Each carries one open item, "toolstd: judge, not written down yet"
(DECISIONS T1): the cost of living rules were never made the standard, so every later rebuild argues from scratch.

| Tool | For | Value | Data freshness | The gap |
|---|---|---|---|---|
| Hospital Operations Map | informaticists, ops, students, job seekers | 5 | CMS June 2026, suppliers 2026-09-27, cost reports pulled 2026-10-01 | beds and coordinates still from a legacy merge; no export |
| Cost of Living Comparison | nurses, RTs, travelers | 5 | MERIC Q1 2026, 2025 tax tables, live per diem | 2026 tax tables are out; the warnings wait on David's rulings |
| Population Health Map | policy, public health, students | 4 | 40 of 72 measures retrieved Jan to Mar 2025 | aging data, estimated trends, no export, red-to-teal scale breaks chart rule 8 |
| Career Tree | students, career changers | 4 | BLS May 2025, checked 2026-09-23 | 42 of 164 roles show hand estimates its own data says "must be verified before publishing"; cluttered on a phone |
| Vendor Directory | informaticists, buyers | 3 | checked 2026-10-18 | about 70 phone screens tall, no fold, stale date line |
| Healthcare System Layers | students, new hires | 3 | 176 sourced numbers | dated phone layout, no "i" explainers |
| Hospital Blueprint | students, non-clinical staff | 3 | illustration, not cited | no evidence behind staffing and billing claims; hard to aim on a phone |
| Clinical SQL Mystery | informatics students, analysts | 3 | synthetic | four cases is a demo |
| Healthcare Atlas | explorers; the site's spine | 3 | mixed dates | abstract to a newcomer; a phone that taps one hex downloads the 11.5 MB graph (about 1.1 MB compressed) |

What this audience expects and does not find: data out (CSV or a citable view) on either map, the vendor list or the
career data; real time series instead of estimated trends; metro-level pay where state medians hide the gaps travelers
care about; a standalone licensure compact map (the data lives only inside Cost of Living, src/_data/licensure.json); a
public "data last updated" page (the Data Observatory has one, but it is hidden); and a healthcare AI tool of any kind,
though AI is the brand's first pillar (an FDA AI-enabled device list or a state AI law tracker would fit).

Due for a refresh: the Population Health Map's policy lens (all 2025-02/03), physician supply and life expectancy (2022,
and life expectancy is the landing measure), cancer mortality (2021), RN and RT supply on 2022 wage data beside 2025 pay;
the compass's 2025 tax year; the facility files (pulled early June; CMS refreshes on a cycle); credential pass rates
(boards publish yearly). Refreshes are manual; scripts/pull/ has 14 dry-run fetchers and nothing schedules them.

### Games

| Game | Status | For | Value | The gap |
|---|---|---|---|---|
| Headwall | public, beta | RTs, RT students | 5 | three open RT calls (row 16); the first-visit tutorials still miss the 20 px near-miss rows of the thumb test |
| Daily Huddle | public, beta | everyone clinical | 4 | no streak; the bank leans on lookup trivia (Schools 379, Pay 321, State health 257, Counties 223, against Clinical math 212 and Normals 16) |
| Alarm Fatigue | public | nurses | 4 | a reload loses the shift; fails 7 of 12 touch rules (docs/HU-PHONE-PLAY-THREE-GAMES-2026-10-13.md) |
| Vital Stats | public | groups, educators, managers | 3 | on a small phone the fixed dock covers the last guess, and a tap there locks the round |
| Uncharted General | secret | admin, policy | 3 | payer spread 1.14 against RAND's 254% of Medicare; the respiratory unit has no RTs |
| Uncharted Regional | secret | admin, policy | 2 | G1: strain can never build, so nurses never quit |
| ER Charge Nurse | secret | ED nurses | 2 | the dead first minute; parked |

The two dailies and /fun/today/ are the retention spine; nothing else gives a reason to come back tomorrow. RTs are
served best. Informaticists get almost nothing aimed at them in the games. Only Headwall was rebuilt to the finger
standard; the other public games fail it, and their fix card ("The other games by thumb") has no steps. Only Headwall and
Uncharted General meet the engine contract, so two of the four public games cannot resume a run.

The multiplayer relay is one free Supabase project: 200 concurrent connections across the whole site (about four full
48-seat Vital Stats rooms), 100 messages a second, a pause after seven quiet days (it paused twice, now held by a daily
keepalive job). The live relay checks are not part of the test suite; the last recorded all-green run found was
2026-10-02. Pro is $25 a month.

### Reading

| Area | Pieces | Register | Freshness | State |
|---|---|---|---|---|
| Learn | 16 (14 David, 2 guest) | textbook | 2026-04-27 to 09-20 | 7 at Phase 2, 9 held by the shared reading layout |
| Rounds | 5 | first person | May 6 to Sep 10 | all locked since 10-04; four of five lack a quoted person |
| Talks | 2 | talk record | Apr, May | locked |
| Secret prose | fracture draft, Patient Populations, Camp Nauvoo | draft | Oct, Sep | the fracture piece waits on R1, R6 and the manager's read |

Healthcare AI is the strongest pillar (modules 07 and 10, two Rounds, both talks), and clinical informatics is close
behind (eight modules). Workforce policy is thin (three pieces; nothing on RT workforce, staffing law or the Respiratory Care
Interstate Compact, whose Atlas tile has no writing; nothing on AI and jobs, though the brand line promises "who it's
leaving behind"); leadership is thinnest (one Learn card carries the Leadership filter; no Rounds piece draws on David's
move to team manager).

Four promised pieces have no draft: Learn 06 on FHIR (the numbering skips it), Rounds 06 and 07 (06 is the launch
story), and Patient Populations as a module. The Atlas has writing on 37 of 101 top-level tiles, and some of those gaps
are only mislinks: The Payer covers claims and prior auth but does not link those tiles. Each is a one-line fix in
src/_data/learn.js.

Almost no reading links to Headwall, Daily Huddle or Vital Stats (History of Home RT and the home
oxygen piece are obvious Headwall companions), and the RSS feed carries only 2 of 16 Learn modules because it needs
featured plus published in front matter (.eleventy.js line 97). Voice risk sits mostly in the secret menu (Camp Nauvoo)
and the two talks; all five Rounds still fail the Rounds checklist, which their locks allow fixing in place. The dev blog
post carries "By David Eitel" but was drafted by Claude, and David has said its one-liners read as AI. Learn figures such
as "71% of hospitals" carry no check date.

About: David's author card lists none of his pieces (his works list is empty), the bio omits the manager title and UVU,
and it uses bold and italic for emphasis, which the voice rules ban.

### Platform and operations

Strengths: the gate (705 tests, three ratchets that only let numbers fall, CI on every push with pinned actions); security
well above the norm (enforced CSP, HSTS, COOP, integrity hashes, a hook tripwire, no secrets in the repo); addresses kept
(15 redirects, an old-pages test, a post-build prune); disciplined data fetchers that refuse to write on drift;
cookie-free analytics; process memory (37 close notes, 7 release notes, the hub).

Weaknesses, most costly first:

- The deploy does not honor the gate. Netlify deploys every push whatever CI says; its build runs only Eleventy; nothing
  pins the Node version; it installs with npm install, where npm ci would hold the exact versions. The phone sweep, the main layout and accessibility check, runs
  only on David's computer.
- Tests skew to games (Headwall alone is 35% of all test lines); the flagship tools get little beyond the site-build test.
- Accessibility enforcement is partial: under-44 px targets only warn though DESIGN.md calls them Tier 1, no axe or
  pa11y, no site-wide check for focus, keyboard reach or reduced motion.
- No performance budget (about 48 MB of data deployed, no content hashing, hand-bumped ?v= stamps) and nothing watches
  production (no error reporting, no uptime check).
- Docs have drifted (HU-QA-TOOLKIT.md says 58 tests; HU-HANDOFF-BRIEF.md predates the hub; the Inbox holds six cards that
  are already built).
- Commits land as large batches with short messages, and generated data files are committed.
- Context is heavy even after last night's trim: a session reads about 72 KB before it starts.

Onboarding gaps for a first teammate: no README, CONTRIBUTING or LICENSE; no setup guide (Node version, Playwright's
browser, the Census and GSA keys); no line between generated and hand-written files; no architecture overview of the
shared kit; no glossary for window, close, ship, card, phase, tier, lock; no roles (locks, review marks and QA approval
are "David's alone"); Windows-only assumptions.

---

## 5. Value to viewers, by audience

| Audience | What they get today | Best first path | What is missing |
|---|---|---|---|
| RTs and RT students | Headwall, Huddle normals and clinical math, Career Tree, Cost of Living, the home RT history | /fun/headwall/ then /fun/today/ | a stated link to board exam topics, an educator view, any writing on the RT compact or RT workforce |
| Nurses | Alarm Fatigue, Cost of Living, Huddle | /fun/alarm-fatigue/ | Alarm Fatigue that survives a reload and plays by thumb; nurse-specific reading beyond alarm fatigue |
| Travelers | Cost of Living's after-tax answer with live per diem | /tools/cost-of-living/ | type in a package and compare it to a staff job; metro pay; a saved, shareable comparison |
| Informaticists | Request Routing, Process Engineering, Data Sources, EHR Architecture, the Operations Map, Vendor Directory, SQL Mystery | /learn/request-routing/ | a usable Vendor Directory, more SQL cases, informatics reference tools (certified health IT, FHIR and TEFCA endpoints), anything in the games |
| Students and educators | Career Tree, Learn, the games | /tools/career-tree/ | a class kit, assignable walls, a teacher's view |
| Policy and public health | Population Health Map, the Payer and policy modules | /tools/multi-lens-map/ | fresh data, real trends, CSV out, a citable methods note per measure |
| Leaders | Leading the AI Transition | /learn/ | a leadership pillar at all |

The site's value is highest where David's own seat is: RT practice, informatics method, and the cost of a decision in
dollars. It is lowest where it repeats what larger sites already do better without adding that seat.

---

## 6. From the outside

Checked 2026-10-18 with about ten searches; URLs are in the outside review's notes.

- Health data maps (KFF State Health Facts, County Health Rankings, CDC PLACES): broader and more authoritative, with
  downloads, trends and custom reports. HU's difference is facility layers and population measures on one map, written
  by someone who has worked a bedside. A search summary said County Health Rankings' funding ends in December 2026; the
  fetched pages did not confirm it, so treat it as unverified.
- Career and pay tools (the BLS handbook, travel boards): trusted medians and live job volume. HU's difference is the
  after-tax step for a specific county, which nobody found does.
- Education games (Doctordle and other daily diagnosis games; Hamilton's VenTrainer app): the daily diagnosis lane is
  crowded and exam-aligned. HU's difference is Headwall (setup, in a browser, no install) and Huddle's system-side
  questions. Keep Huddle on the system side; as "another medical Wordle" it loses.
- Practitioner writing (Out-of-Pocket, Eric Topol's Ground Truths, physician informaticists): far larger audiences, owned
  channels. HU's difference is the RT and informatics seat and essays that sit next to tools holding the same data. It
  lacks volume and any channel it owns.

Opportunities the comparison suggests: take Headwall to RT programs, starting with UVU, with a teacher link and board
exam topic tags; frame the compass as "read a travel package before you sign"; build a way back (a Huddle streak and a
weekly digest); use the RT identity on purpose (a guest piece in a larger newsletter, Huddle's made boards offered to
unit educators); and, only if the County Health Rankings news proves true, become a place to keep using county data,
with downloads and citable sources.

Risks: the diagnosis-game lane; data authority (one stale layer costs trust in the rest, so check dates must stay
visible); scale (if a ventilator maker adds setup scenarios to its free app, Headwall's gap narrows).

---

## 7. Plans on file, and where they drift

Stated goals: the Q4 plan's targets for 2026-12-20 (docs/HU-DEV-PLAN-2026-Q4.md): 25 daily views with no launch running,
three more launch posts, two games on the table kit, one game night, three Rounds and two Learn, a $25 a month ceiling.
The Ideas tab's end goal: publish at the end of October, "then grow it with a small team". The launch calendar
(docs/HU-LAUNCH-PLAN-RC-WEEK-2026.md): a LinkedIn teaser Oct 21, the USRC demo Oct 23, a Reddit post Oct 25, the main
LinkedIn launch Oct 28, then nurses, informatics, AARC, COPD Day, a Show HN in December.

Drift worth settling:

- The launch calendar carries items David never said Yes to: the game hour page (unanswered and unbuilt, while the
  Oct 25 post is built around it), the LinkedIn newsletter (unanswered, and the Oct 28 launch assumes it), the USRC demo and the
  pipeline post (Maybe). No board card mentions RC Week or LinkedIn, six days out.
- The launch leans on Alarm Fatigue (nurses week) and Vital Stats (the game hour), the two public games that fail the
  phone standard.
- The Q4 plan stopped logging on 2026-09-20; its November collides with the launch plan's, and its month-3 nickname
  leaderboards cut against DH3 (no accounts, no public names).
- The content freeze is still "in force" while the plan targets three Rounds and two Learn.
- Old names: the launch plan's teaser says "Device Assembly walls"; the launch post draft predates the Headwall rename.
- The AI skills page was deleted around 2026-09-23 (a 301 to /tools/), but DECISIONS still parks the skills as "on the
  site for now".
- DECISIONS rule 1 says nothing waits on David unless it is listed there, yet five of his items (Search Console, the
  GitHub switches, the public repo, the employer policies, self-hosting GoatCounter) live only in
  docs/HU-SITE-REFRESH-2026-10-11.md.

Gaps no plan covers: growth after December; measuring value beyond page counts (no retention measure, no learning
outcome for the educational claims); partnerships (11 of 12 community ideas unanswered); team onboarding; revenue beyond
Ko-fi (no sponsor policy); a content cadence with an end to the freeze; governance across nine open design phases.

---

## 8. Skills, templates, ideas and goals

### Skills

What exists: in the repo, hu-voice, hu-writing-review, hu-game-shell, hu-view-switch and impeccable, plus five agents
(auditor, voice editor, mobile tester, accessibility fixer, polish). Privately, David's six skills, with
intent-to-execution installed for every session on 2026-10-18. The private ones stay private (his ruling of 2026-09-18).

Worth adding, each one because a recurring job keeps being done from memory:

- hu-release. Tonight's readiness list as a skill: what a script cannot check before a push (draft labels, stale date
  lines, count claims, the public repo, credits, employer items, marks set on his word), then the ship and the live
  check. It makes the 1.0 pass repeatable for 1.1.
- hu-data-refresh. A runbook for the 14 fetchers: dry run, read the drift, write, update the check dates and source
  lines, re-run the ledger, on a quarterly calendar per dataset. The aging policy lens is the first customer.
- hu-launch-post. Drafts a LinkedIn or Reddit post in David's voice with the right tracking tag, runs the patient check
  and the employer checklist, and never posts. The launch plan has eleven posts ahead.
- hu-clinical-review. The reviewer panel's medical director lens, pointed at game content: every wall, normal and
  alarm read the way an RT or a charge nurse would. Row 16 shows the need.
- A page scaffold as a skill plus `npm run new`. The Learn hub cards are hand-listed and duplicate learn.js, so a new
  module needs two edits; docs/HU-PAGE-RECIPES.md already holds the steps.

### Templates

- A per-tool "data and methods" page: sources, vintage, caveats, what changed, and a download. It answers the data
  authority risk and gives policy readers something to cite.
- A public "What's new" page for returning readers (the unanswered /now idea), fed by the release notes ship.js already
  writes.
- A class kit and game hour kit: one page and a printable sheet per game, for RT programs and unit educators.
- Launch post templates (a LinkedIn document post, an image-first Reddit post) with the tag table filled in.
- A Rounds template that carries the Rounds rules: scene first, a quoted person, a question left open.
- A guest author template (src/_data/authors.js already supports guests).

### Ideas from this analysis

New ones (proposed for the hub's Ideas tab, section "After 1.0"):

1. Data out: a CSV download and a citable link for the current view on both maps.
2. A public data freshness page, so every tool's vintage is visible in one place.
3. A Daily Huddle streak, to match Headwall's.
4. A teacher link for Headwall: assign walls, see who finished, with board exam topic tags.
5. Weight RC Week's Huddle boards toward clinical and workforce kinds and away from county lookups.
6. A healthcare AI tracker: FDA AI-enabled devices and state AI laws, the brand's first pillar given a tool.
7. A standalone licensure compact map from the data Cost of Living already holds.
8. Workforce writing: the Respiratory Care Interstate Compact, and AI and jobs.
9. Link reading and games both ways (the home RT pieces with Headwall; Huddle answers with the Learn page behind them).
10. Deploy only after the tests pass, pin Node, and skip deploys for docs-only pushes.
11. Accessibility and production checks inside the existing harness: axe in the phone sweep, the 44 px warning as a
    ratchet, and page errors counted through GoatCounter events.
12. A human front door: a README, a setup guide and a glossary, before the first teammate.

Already on the Ideas tab and worth answering first (unanswered): the LinkedIn newsletter, the RC Week game hour, relay
headroom, the weekly numbers agent, a contributor guide, guest authors without git, a sponsor policy, the class kit, an
awareness calendar, and the data refresh agent.

### Goals for 1.x

Proposed, for David to keep, change or drop. Each has a number GoatCounter or the repo can show.

| Goal | How it is measured | By |
|---|---|---|
| 25 daily views with no launch running (the Q4 target, kept) | GoatCounter, a quiet week's average | 2026-12-20 |
| Returning daily players | the dailies' events, reported weekly | weekly from Oct 25 |
| An audience the site owns | a signup back up, then a first list | signup by Oct 28, list by Dec 20 |
| Every tool inside its refresh window, and no draft label ever public | a public freshness page; a test that fails on a draft flag | Dec 18 |
| The reading cadence the Q4 plan set: one Rounds a month, one Learn every six weeks | published dates | from the month the freeze lifts |
| One RT program using Headwall in a class | a teacher link in use | spring 2027 |
| A deploy that honors the tests, and accessibility checks that fail a push | CI and the phone harness | Dec 18 |
| A README and contributor guide | the files exist and a newcomer can follow them | before the first teammate |

---

## 9. After 1.0: thirty, sixty, ninety days

- To Nov 18 (RC Week through AARC Congress): run the launch; read the numbers weekly; fix what launch surfaces first
  (the Vital Stats dock, Alarm Fatigue's save and thumb); put a signup back; refresh the policy lens.
- To Dec 18: data out and the freshness page; the workforce writing; the class kit with UVU; the deploy gate; the back
  office split from the public repo; the README.
- To Jan 17: the healthcare AI tracker; a decision on Huddle's players-today counter; the first teammate onboarded; a
  date for the hosting move the hosting report recommends for next year.

---

## 10. Three questions for David

Each comes with a recommendation; "you pick" means Claude takes it.

1. The public repo, before launch traffic arrives. Recommendation: make the GitHub repo private now and decide later
   what to open. It is the smallest change that takes R6's medical details and the employer documents out of view, and
   Netlify can build from a private repo. One thing to check first: private repos on GitHub's free plan get a monthly
   allowance of Actions minutes, and the test run on every push plus the daily keepalive job would draw on it.
2. The content freeze. Recommendation: lift it now that the page review is marked done, with the cadence the Q4 plan
   set, and make the first piece the one RC Week needs: the RT compact or RT workforce.
3. A way back for launch visitors. Recommendation: bring the email signup back before Oct 28, smaller than before (one
   line on Today's puzzles and at the end of each Rounds, with the footer left clear), so the newsletter in the launch plan has
   somewhere to send people.
