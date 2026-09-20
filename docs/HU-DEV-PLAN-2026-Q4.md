# Healthcare Uncharted · Development plan, 2026-09-21 to 2026-12-20
### Thirteen weeks, three streams: games, content, platform.
### Written 2026-09-20 from a full read of the site, the live traffic, the five games, the backend, and the multiplayer market. DRAFT for David's markup. Nothing here is built. The three decisions it needs are in DECISIONS.md.

---

## 0 · The plan on one screen

What the analysis found:

1. **The games bring strangers.** One Reddit post about Alarm Fatigue on 2026-09-10 produced about 1,500 views in seven days, eight times the site's previous MONTHLY traffic. Individual Rounds and Learn pages get single digits each over 90 days.
2. **The multiplayer that shipped 2026-09-07 cannot connect today.** The Supabase host named in the hospital game and in the CSP no longer resolves (checked from the local resolver and from Cloudflare's public one). Paused or deleted, the dashboard will say which; either way no browser reaches it.
3. **Four of the five games are built the way multiplayer needs** (a state object, a verb table or pure operations, save strings). The most-played one, Alarm Fatigue, is not, and it has no tests.
4. **The plumbing runs only on a laptop.** No CI, no scaffold for a new post, the RSS feed carries 12 of 44 pages, and 60 files sit uncommitted.
5. **The table kit lives inside one game.** The design doc's own rule says the second multiplayer game extracts it. This quarter builds the second one.

The quarter, one line per month:

- **Month 1 · Foundation.** Commit the open tree, bring the backend back with a keep-alive, add CI, extract the table kit, launch Device Assembly to r/respiratorytherapy.
- **Month 2 · The table plays.** GM console and rejoin on The Table, Device Assembly two-player on the kit, game night #1, the Alarm Fatigue companion page, the second launch post.
- **Month 3 · Persistence.** The database half of Supabase (leaderboards, table snapshots) behind row-level security, the hospital game's front-door decision, the quarterly data refresh, the retro.

Targets for 2026-12-20, against the baseline in §1:

| Measure | Now | Target |
|---|---|---|
| Daily views with no launch in the window | 5 to 15 | 25 |
| Launch posts | 1 | 3 more, one per month |
| Games on the shared table kit | 0 (the kit is inline in one game) | 2 |
| Humans at one table over the internet | 0 verified | one game night, 3 or more |
| Rounds shipped / Learn shipped | 1 / 0 in September | 3 / 2 |
| Tests | 145, run by hand | 200 or more, CI green on every push |
| Backend | unreachable | alive, keep-alive, one leaderboard |

---

## 1 · Where the site stands

### 1.1 Traffic

Read live 2026-09-20 through the tracker's read-only token.

| Month | Views |
|---|---|
| July 2026 | 179 |
| August 2026 | 162 |
| September 1 to 20 | 1,600 |

The spike, daily: Sep 10: 85 · Sep 11: 275 · Sep 12: 532 · Sep 13: 342 · Sep 14: 166 · Sep 15: 51 · Sep 16: 48. About 1,500 in a week. Before it the site ran about 5 a day; the four days after ran 7, 28, 15 and 8.

Referrers, 90 days: reddit.com 1,089 of 1,940 (56%); direct or unknown 390; Google 58; Bing 9. Reddit is the only distribution channel the site has ever had that moved a number.

Top pages, 90 days:

| Views | Page |
|---|---|
| 467 | /fun/alarm-fatigue |
| 167 | / |
| 65 | /learn |
| 47 | /tools |
| 27 | /secret-menu |
| 19 | the operators map (arriving on the OLD slug, so links in the wild use it) |
| 17 | the population health map |
| 15 | /atlas |
| 12 | /rounds |
| 11 | the cost of living tool |
| 8 | the career tree |
| 7 | the best single Learn page |
| 6 | the best single Rounds post |

The Alarm Fatigue funnel, 30 days (events fire on pagehide, so these are exit buckets): 308 clock-ins; 247 sessions reported a length; 118 lasted over 2 minutes (48%), 71 over 5 (29%), 28 over 15 (11%); 99 reached the first code. Score at exit: 84 under 100 tasks, 58 in the hundreds, 38 in the thousands, 33 in the ten-thousands, 19 in the hundred-thousands, 18 over a million.

A clicker holding half its Reddit walk-ins past two minutes is a working game. The site's editorial has never had a distribution event this size.

The market, sized through the Arctic Shift archive (posts per month, June to August 2026): r/respiratorytherapy 247 to 281; r/incremental_games 1,271 to 1,360; r/nursing about 3,200; r/emergencymedicine 367 to 462; r/healthIT 134 to 167; r/ClinicalInformatics under 10.

### 1.2 Content

| Section | Count | Last shipped | Notes |
|---|---|---|---|
| Rounds | 5 | 2026-09-10 | Posted May 6, Jun 3, Jun 18, Aug 10, Sep 10. Zero in July. |
| Learn | 15 | 2026-08-24 (M03) | Zero in September. Article 06 (FHIR) was never written; the numbering skips it. |
| Tools | 9 registered | 2026-09-18 | The skill demo page exists on disk but is not in tools.js, so the index, home and search cannot see it. |
| Games, public | 1 | 2026-09-09 | Alarm Fatigue. |
| Games, secret menu | 4 | 2026-09-19 | Hospital, regional, ER charge, device assembly. |
| Talks | 2 | 2026-05-02 | |

Every month for six months shipped something (4 to 9 items). September was games only.

The pipeline is a recipes doc, not a tool. A Rounds post is a hand-built page plus a rounds.js entry plus an OG card. A Learn module adds a learn.js entry, a readingOrder line and citations in references.js. There is no `npm run new`. The RSS feed built 2026-09-20 carries only `featured: true` pages, which is 12; most Learn modules and tools never appear. Field Notes collects addresses (fixed 2026-09-20) and still promises sending. Sitemap, robots, canonical and JSON-LD all exist.

### 1.3 The games, as built

| Game | Lines | Engine split | Save string | Random | Tests | Multiplayer |
|---|---|---|---|---|---|---|
| Uncharted General (hospital) | 2,995 | `dispatchAct` verb table + pure quarter sim | HUG1 | Math.random | 5 files | The Table: built, tested with a fake bus, UNREACHABLE on the internet today |
| Uncharted Regional | 765 | `dispatchAct` | HUS1 | Math.random | 1 | none; competing teams need server-held state |
| ER Charge Nurse | 594 | `tick(dt)` takes sim minutes, no verb table | none | Math.random | 1 | none; real-time sync deferred until solo proves fun |
| Device Assembly | 2,871 | pure operations, no dispatcher | progress only | NONE, fully deterministic | 7 files | none |
| Alarm Fatigue | 5,503 | DOM-bound, no pure tick, WebAudio inline | none | Math.random | NONE | none |

Duplicated across the games, each written again by hand: settings save, toast or flash hint, close overlay, start menu, end screen, the deflate save-string pair (the hospital and regional copies differ by one prefix), and the test-hook boilerplate. `hu-kit.js` carries no game code at all.

### 1.4 Platform

- Static Eleventy on Netlify. CSP enforced. `'unsafe-inline'` stays because every game is an inline script. `connect-src` allows exactly one backend host.
- Supabase project `swntgsmpcqyuapkkyaqj`: NXDOMAIN from two resolvers on 2026-09-20. Free projects pause after a week idle; the design doc predicted this on 2026-09-07 and named a keep-alive ping as the fix. The ping was never built.
- One Netlify function (the GSA per diem proxy). Netlify Forms collecting. Four Netlify projects build every push and one serves the domain.
- Gates: `npm run verify` (build, tsc, 145 tests) and `npm run phone` (Playwright at 360 and 699, floors read from the type tokens). They run only when a session runs them.
- 60 files uncommitted (the two-surfaces migration and the phone sweep). A second session is working the diagram reflow today; this plan does not touch those files.
- Design phases: Device Assembly parked at alpha, cost of living round 2 unread, merged band awaiting close, reading surface parked.

### 1.5 The multiplayer market

Researched 2026-09-20; the full table with limits, prices and CSP entries is in §6. Two stacks fit a static site with this CSP at $0 to $25 a month:

- **Supabase**, already wired. Realtime broadcast as the relay now; Postgres, row-level security and Edge Functions when state has to live on a server. Free tier: 200 concurrent connections, 2M messages a month, 500K function calls; pauses after a week idle. Pro is $25 and removes the pause.
- **Cloudflare Durable Objects through partyserver.** One object per room, native WebSockets, hibernation so an idle room costs nothing, free tier generous. It fixes the three costs of the host-authoritative model (host must stay online, a reload leaves the table, no server referee). It also means a second codebase, a second account and a second deploy.

Dead or dying since the last look: Hathora (shut down 2026-05-05), InstantDB (signups closed 2026-08-22). PartyKit's own platform is stale; `cloudflare/partykit` is the successor.

Recommendation: stay on Supabase this quarter. It is built, tested, free, and the transport is a plug by design. Durable Objects is the named escape hatch, triggered by game night #1 if host-online turns out to hurt.

---

## 2 · Rules the plan runs under

All David's, already ruled. Listed so no session re-litigates them.

- Room code plus nickname, no accounts, the public site stays login-free (2026-09-01).
- The solo game IS the multiplayer tutorial; one engine holds all seats (2026-09-02).
- Engine = pure data + a verb table; the save format is the wire format; the second multiplayer game extracts the kit, not the first; one Supabase project until it hurts (design doc §12).
- No health data through the site; surveys parked (2026-09-01, 2026-09-02). Nothing here touches them.
- Uncharted General stays in the secret menu until he says otherwise (2026-09-02). §7 asks him to revisit that with the traffic in hand.
- David commits, deploys and posts. Verify and phone gates before any ship. The voice kernel on every word, launch posts included.
- Money: $0 today. Ceiling $25 a month, and only if the pause outlives a keep-alive.

---

## 3 · Month 1 · Foundation (Sep 21 to Oct 18)

**Week 1, Sep 21 to 27. Land the tree.**
- David commits the open work once the diagram session lands. Two DECISIONS rows close in passing: keep the RSS feed (9) and soften the Field Notes line (8).
- Backend: open the Supabase dashboard. Restore if paused. If gone, a new project on the main account; the change is two lines, the `SUPA` constant in the hospital game and the `connect-src` entry. Verify a live two-browser table before anything else is built on it.
- Keep-alive plus CI in one GitHub Actions workflow: a cron every three days hits the REST endpoint with the publishable key, and every push runs `npm run verify`. Scheduled workflows on a public repo switch off after 60 days without a push, which this repo will not hit. A new test fails the build when the host in the game and the host in the CSP differ.
- Register the skill demo in tools.js, or mark it hidden on purpose. One line either way.

**Week 2, Sep 28 to Oct 4. Extract.**
- `hu-save.js`: the deflate save-string pair with a prefix parameter. The hospital and regional games consume it; that is two consumers already, so the rule is satisfied.
- `hu-rng.js`: a seeded generator (mulberry32) whose seed rides the save. The hospital game adopts it first, so tests stop pinning Math.random and a run can be replayed from its string.
- `hu-table.js`: lobby, seats, roster, intents, envelope, the transport plug (BroadcastChannel for same-browser, Supabase for the internet), a rejoin hook. Lifted from lines 2578 to 2740 of the hospital game; the table tests move with it; the hospital game is consumer one.
- `.claude/rules/games.md`: the engine contract in ten lines, so the next game is built on it without reading three docs.

**Week 3, Oct 5 to 11. Launch one.**
- David plays Device Assembly at 360 on his phone (DECISIONS 1). If it holds, the launch post to r/respiratorytherapy in his voice, the share card attached, the post saying desktop if his read says so. GoatCounter events on the game the way Alarm Fatigue has them, so the funnel can be read.
- Rounds 06 chosen and drafted. Recommended: the launch, first person, what 1,500 strangers did with a hospital clicker, the Reddit thread quoted, the funnel numbers above. It is the one Rounds topic with real figures already on hand.

**Week 4, Oct 12 to 18. Consumer two.**
- Device Assembly "two walls": a room code, two players, the same order, the host runs both boards, the guest sends place, rotate, flip and connect as intents, the first correct submit wins, the other wall shows as a ghost. The engine is deterministic and the intents are tiny, which is why it is the cheapest second consumer of the kit and the one with a proven audience. (§7 Q2.)
- Rounds 06 ships.

---

## 4 · Month 2 · The table plays (Oct 19 to Nov 15)

**Weeks 5 and 6, Oct 19 to Nov 1. The Table complete.**
- The GM console and offer cards from the design doc's §9, the v3 pieces not yet built. Guest rejoin by code plus nickname. Host restore from sessionStorage on reload. The lobby at 360.
- Learn: an Alarm Fatigue companion page, the evidence behind the game (the Joint Commission's alarm safety goal and its sentinel event alert on alarms, every figure verified live when written and dated). Linked from the game's huddle and the Learn shelf. The most-visited page on the site currently leads nowhere; this turns its traffic into reading.

**Week 7, Nov 2 to 8. Game night #1.**
- Three humans plus David as GM, over the internet, on the kit. A postmortem in docs/HU-GAME-NIGHT-01.md: what broke, what the seats argued about, and whether host-online hurt. That last answer is the Durable Objects trigger.
- Tuning from the postmortem.

**Week 8, Nov 9 to 15. Launch two.**
- Alarm Fatigue share card: a 1080 "my shift" card (tasks, clock-out time, achievements) on the site's canvas pattern. Then a post to r/incremental_games, 1,300 posts a month, where idle clickers live. Track it the same way.
- Rounds 07 drafted.

---

## 5 · Month 3 · Persistence (Nov 16 to Dec 20)

**Weeks 9 and 10, Nov 16 to 29, Thanksgiving inside. Cross the tripwire on purpose.**
- Supabase Postgres: a `scores` table (game, nickname, score, duration, achievements, created_at) and a `table_snapshots` table (room, save string, updated_at, expiry). Row-level security: public read, and inserts only through an Edge Function that checks plausibility (a tasks-per-minute ceiling, duration against score, achievement consistency) so a leaderboard cannot be pasted into. Leaderboards on Alarm Fatigue and Device Assembly, nickname only, a privacy line on the page. A backup export script.
- Rounds 07 ships.

**Weeks 11 and 12, Nov 30 to Dec 13. The front door.**
- If ruled yes (§7 Q3): Uncharted General leaves the secret menu as "Hospital Operations Game" with onboarding and the table entry, and that is launch three. If ruled no: Uncharted Regional gets its thumb and a polish pass, and launch three is the ER game to r/emergencymedicine after a phone pass.
- Learn: Article 06 on FHIR. David said "when you want it"; it fills the numbering gap, the site already cites FHIR on every footer, and it is the informatics piece the Learn shelf is missing.
- The quarterly CMS data refresh: run the pull scripts, check the dates the maps display.

**Week 13, Dec 14 to 20. Retro.**
- The numbers against the baseline in §1. DESIGN.md Tier 3 write-ups for any phase that closed. The next quarter's plan, written from this one's log.

---

## 6 · Platform backlog

| Item | Why | When |
|---|---|---|
| GitHub Actions: verify on push, phone gate weekly | The gates exist and nothing runs them unless a session does | Month 1 |
| Keep-alive cron on the Supabase REST endpoint | Free projects pause after a week; that is why multiplayer is down | Month 1 |
| `hu-save.js`, `hu-rng.js`, `hu-table.js` | Three copies become one; the second multiplayer game needs the kit | Month 1 |
| A CSP consistency test | The backend host is named in two files and they drifted silently | Month 1 |
| `npm run new -- round <slug>` and `learn <id>` | A post costs an hour of scaffolding before a word is written | Month 1, one session |
| RSS carries every published page; `date` on every Learn and tool page | 12 of 44 pages in the feed; several sort to epoch zero | Month 1 |
| OG cards for the games and JSON-LD for them | Launch posts unfurl on Reddit from the OG image | Month 2 |
| `hu-game.js` (settings, toast, overlay, start and end screens) | Five hand copies today; extract when the third game moves onto the kit | Month 2 |
| Alarm Fatigue: a pure tick and a verb table, as far as the leaderboard validator needs | No tests, no replay, no way to check a submitted score | Month 2 to 3 |
| Supabase Postgres, RLS, one Edge Function, a backup export | Leaderboards and table snapshots are the tripwire the design doc named | Month 3 |
| Delete the two idle Netlify projects | Three builds per push for one site (DECISIONS 10) | Any week, David's hands |
| Move the game scripts out of the HTML so `'unsafe-inline'` can go | A real hardening step with no consumer benefit yet | NOT this quarter |

The market table, so nobody researches it twice (all checked 2026-09-20; free tiers as published):

| Backend | Free tier | Next tier | Fits this site | Verdict |
|---|---|---|---|---|
| Supabase Realtime + Postgres + Edge Functions | 200 conns, 2M msgs/mo, 500K calls, pauses after 7 idle days | $25/mo | Yes, wired | Stay |
| Cloudflare Durable Objects (partyserver) | 100K req/day, hibernating rooms | $5/mo | Yes, second origin in `connect-src` | Escape hatch |
| Convex, SpacetimeDB, Rivet | Generous | $20 to $25/mo | Yes | Fine products; a second platform for no gain this quarter |
| Colyseus, socket.io, Nakama | Software free | $15/mo hosting or a VPS | Needs a Node or Go host kept alive | No |
| Liveblocks, Ably, Pusher | Metered pub/sub | $29 to $49/mo | Yes | Next tier over budget; no referee |
| Firebase | Free without a card | Pay as you go | Server logic needs a card on file | No |
| Playroom Kit | 10 users a day | $10/mo | WebRTC bypasses the CSP entirely | No |
| Netlify Functions + Blobs | 300 credits/mo hard cap | $9/mo | Same origin, no WebSockets | Turn-based moves and leaderboards only; not needed while Supabase stands |
| Hathora, InstantDB | | | | Dead / sunsetting; drop from any note that names them |

Every backend above needs `https://` and `wss://` entries for its host in `connect-src`. None of the JS SDKs need `'unsafe-eval'`; Automerge needs `'wasm-unsafe-eval'`, which the CSP already carries for sql.js.

---

## 7 · Decisions the plan needs

Three, on DECISIONS.md, each with a recommendation. Everything else in this document Claude picks by the rules in §2.

1. **The backend host is gone from DNS. Restore the project or make a new one?** Recommend whichever the dashboard offers first; a new project is a two-line change and the keep-alive goes in the same week either way.
2. **Which game is the second consumer of the table kit?** Device Assembly two walls (recommended: deterministic, tiny intents, the r/respiratorytherapy audience already answered once), versus ER Charge co-op (real-time sync, the hard transport problem the design doc deferred), versus regional teams (needs server-held state, the month 3 tripwire).
3. **Does the hospital game leave the secret menu this quarter?** Recommend yes, in month 3, gated on game night #1 going well, under the banked public name. His 2026-09-02 ruling was no; the traffic since says the games are the front door, so the question is worth asking again with numbers.

Queued behind those, in the order they come up: crossing the tripwire for leaderboards (month 3, Claude will ask when the week arrives), the r/incremental_games post (David posts, so his call on the day), the content cadence itself (one Rounds a month, one Learn every six weeks; say if that is too much).

---

## 8 · Tooling to add

Local, cheap, and each one pays back within the quarter:

| Add | What it does |
|---|---|
| `.claude/rules/games.md` | The engine contract: state is data, every mutation is a verb through one dispatcher, the seed rides the save, the test hook under `__UG_TEST`, no DOM in the tick, the kit's transport is the only network code |
| `hu-playtester` agent | The bot-pair balance run that ER Charge did by hand, generalized: two scripted players, N runs, the skill gap and the loss rate as a table |
| A launch skill | The checklist a launch has failed on before: phone gate, share card, OG image, the registry entry, RSS, GoatCounter events, the subreddit's posting norms from the research doc, and a post draft in David's voice for his edit |
| `scripts/new-page.js` | The scaffold behind `npm run new` |
| `docs/HU-BACKEND.md` | The schema, the policies, the function, the keep-alive, the two files that name the host, and how to rotate the key |

Skills for David himself, in the order the plan needs them: Supabase row-level security and one Edge Function (month 3 depends on it), GitHub Actions basics (month 1), the bot-pair method for balancing (game night tuning), and the posting rhythm on the subs above (he has done it once and it worked).

Repos worth studying, none worth adopting for transport this quarter (stars and last push from the GitHub API, 2026-09-20):

| Repo | Stars | Pushed | Use |
|---|---|---|---|
| boardgameio/boardgame.io | 12,435 | 2026-09-18 | Read its move, phase and `playerView` model before building the GM console; private seat information is exactly what `playerView` strips |
| cloudflare/partykit (partyserver) | 1,270 | 2026-08-03 | The escape hatch if host-online hurts |
| supabase/supabase-js | 4,565 | 2026-09-18 | In use, vendored at 2.115.0; check for a bump in month 1 |
| yjs/yjs, automerge/automerge | 22,816 / 6,616 | 2026-09 | CRDTs merge, they do not referee; only if the assembly wall ever becomes a shared drawing |
| colyseus/colyseus, socketio/socket.io | 7,312 / 63,201 | 2026-09 | Need a long-running host; no |
| partykit/partykit | 5,716 | 2026-01-29 | Stale; superseded |
| 11ty/eleventy-plugin-rss | 114 | 2026-06-29 | The hand-rolled feed works; leave it |

A search of the shared skill catalog for multiplayer, Supabase, game design and content planning returned nothing on 2026-09-20; the local additions above cover the gap.

---

## 9 · Sprints

This plan is the map. The week is SPRINT.md at the repo root, read after DECISIONS.md at the start of every session.

- **A sprint** is Monday to Friday, one goal in one sentence, and a definition of done David can see or play on Friday. Every task has an owner (David, Claude, or a named agent from §10) and an acceptance line.
- **Re-aiming a week is the normal case, not an exception.** David states the new goal in the conversation. Claude rewrites the sprint's task table, moves what it displaces back to its month here, and logs the change in SPRINT.md. The month plans above are where displaced work waits; nothing is dropped without a line saying so.
- **Unfinished tasks move forward visibly**, to the top of the next sprint with their original date, or back here with a reason.
- **A session** reads DECISIONS.md, then SPRINT.md, takes the next open task, runs the gates, updates both files, and appends one line to §11 when something ships.
- **A month** ends with the numbers pasted into §11 (30-day views, top pages, the game events) and the next month adjusted from them, not from the plan as written.
- **What changes the plan early:** a launch post that lands badly (rethink the sub and the post, not the game); the backend pausing twice despite the ping (Pro or Durable Objects, David's money either way); David's time running short (drop the platform stream first and never the launch, because the launches are what moved the number).

Sprint 1 (2026-09-21 to 25) is written: the hospital game's Table back on the internet, David testing it Friday. It is week 1 of month 1 with the kit extraction moved to week 2, where the plan already had it.

---

## 10 · Who does which task

Every task in a sprint names one of these. The gates run in this order before anything ships: auditor, mobile tester, a11y fixer if the first two found something, voice editor on every word a reader sees, polish only when a phase is closing.

| Owner | Runs | On what | Never |
|---|---|---|---|
| David | Dashboards, accounts, commits, pushes, posts, playtests on his phone, every ruling in DECISIONS.md | Anything that publishes, spends, or reaches outside the repo | Asked to generate options from scratch; every question arrives with a recommendation |
| Claude, in session | Code, tests, data, docs, the two-line changes, the live checks with the browser pane, the sprint and decision files | Every task not named below | Commit, push, post, or touch a surface another session has open |
| `hu-auditor` (read-only) | The full-page audit: structure, AI tells, visual consistency, function, accessibility, performance, meta | Any page before it ships or is promoted: the Alarm Fatigue companion page, a promoted game, a new Rounds post | Edits |
| `hu-mobile-tester` (read-only) | 360, 390 and 430 px loads, screenshots, touch interactions, console errors | Every lobby, game board, tool page, or launch page change | Edits |
| `hu-a11y-fixer` | Keyboard traps, div-as-button controls, missing names, contrast, form labels | After the auditor or mobile tester reports function or accessibility findings | New visual direction |
| `hu-voice-editor` | The voice kernel on prose: no em dashes, no aphorism closers, no parallel templates, no banned words | Launch posts, Rounds drafts, Learn pages, share-card lines, UI copy, meta descriptions | Facts (it keeps every one) |
| `hu-polish` | Spacing drift, off-token colors, siblings that diverged, unfinished states | When a design phase closes and its grammar goes into DESIGN.md Tier 3 | New visual direction |
| `Explore` agents | Read-only surveys of the repo when a question spans many files | Inventory questions before a plan or a refactor | Edits |
| `general-purpose` agents | Web research with sources and check dates | Market and product questions (the multiplayer table in §6 was one) | Site copy |
| `hu-playtester` (to build, month 2) | Two scripted players, N runs, the skill gap and the loss rate as a table | Balance passes after game night, before a launch | Judgment on fun; that is David's phone |

A task line, so every sprint row reads the same: **what** (one sentence), **owner**, **acceptance** (what is true when it is done, checkable by someone else), **gate** (verify, phone, or both), **status**.

---

## 11 · Log

Append as items ship. One line each: date, what, the number if there is one.

- 2026-09-20 · Plan written. Baseline: 5 to 15 views a day organic; 1,940 views and 1,089 Reddit referrals in the trailing 90 days; 145 tests; backend unreachable.
- 2026-09-20 · Sprint mechanism added (§9, §10, SPRINT.md). Sprint 1 written on David's Friday goal.
