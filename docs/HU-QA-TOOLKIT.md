# The QA toolkit map

2026-10-03. Every instrument that checks this site: what it checks, who decides, how it runs and where its result shows.
It answers docs/HU-CONSISTENCY-TOOLKIT-2026-10-03.md section 2.5. When an instrument is added, changed or retired, change its row here.

---

## How to use this

One command runs the gate: `npm run qa`. It builds the site, runs the type check and every test, reads every page down at nine screen sizes, then reads two numbers that may only go down. `npm run qa -- /learn/new/` sweeps only the page named; `npm run qa -- --fast` skips the build and the sweep. The tiers come from the top of scripts/qa.js: TIER 1, the machine decides and fails; TIER 2, the machine measures and the number may only go down; TIER 3, David decides and no script gets a vote.

David's screens are for Tier 3. `npm run review`, then http://localhost:8081/__review, puts a page at desktop and phone width side by side, linked, so a click in one moves the other; `t` flips light and dark, the arrow keys step through every page. `npm run writing`, then http://localhost:8084/__writing, checks a pasted draft or a site page against the writing rules and paints each finding on the text.

Today every instrument prints its result and forgets it. The page ledger (one row per page, every check with its date, David's review note) and the board (every page in one table inside the review screen) are PLANNED in docs/HU-CONSISTENCY-TOOLKIT-2026-10-03.md sections 2.1 and 2.4, and not built. Until they exist, "where the result shows" below means the terminal, a screenshot folder, or one of the two screens.

---

## The commands

| Command | What it runs |
|---|---|
| `npm run qa` | scripts/qa.js: build, `check`, `test`, the viewport sweep over every page, then shell-drift and meta-screen as ratchets |
| `npm run verify` | build, `check`, `check:scripts`, `test`. The pre-ship gate CLAUDE.md names; no sweep |
| `npm test` | every file in tests/ (58 today) through node --test |
| `npm run check` | the type check over the shared JS in src/assets/js/ and the tests (tsconfig.json) |
| `npm run check:scripts` | the type check over scripts/ (tsconfig.scripts.json) |
| `npm run phone -- <path>` | scripts/phone-check.js on the pages named; with no path, the home page, /tools/ and /learn/ |
| `npm run review` | scripts/review.js, the side-by-side screen |
| `npm run writing` | scripts/writing.js, the writing screen |
| `npm run writing:check -- <target>` | scripts/writing-check.js on a file, a saved draft, a page, or `--all` |
| `npm run links` | scripts/link-check.js |
| `npm run qa:phone` | scripts/phone-qa.js |
| `npm run backend:check`, `backend:check:da`, `backend:check:vs` | the three real-relay round trips |
| `npm run check:schools` | scripts/check-schools.js |

No npm command runs density.js, tool-compare.js, play-check.js, svg-collision-check.js or shell-convert.js; each is `node scripts/<name>.js`.

---

## VIEW: layout, phone and desktop, type, contrast, overflow, chrome

| Instrument | What it checks | Tier | How it runs | Where the result shows |
|---|---|---|---|---|
| scripts/phone-check.js, the viewport sweep | Each page read top to bottom at 360x740, 430x932, 699x900, 700x900, 768x1024, 1024x768, 1280x900, 1920x1080 and 740x360 (a phone on its side), in dark. FAILS on: console errors; sideways overflow; text under the phone type floor (read from the tokens); more than one top bar, or chrome over 20% of a phone screen; labels colliding in a drawing; boxes spilling; hidden things showing; labels past their box; anything floating over a control; anything cut by its container; faint lines and dim labels inside drawings. A slow-data pass holds every data file back two seconds and fails on errors or floating while loading. WARNS only: targets under 44px, content clipped at the screen edge, 100vh without 100dvh. | 1 | `npm run qa` (every page, up to an hour); `npm run phone -- <path>` | Terminal; screenshots in tmp/phone/ |
| tests/type-scale.test.js | The type tokens: every stylesheet's comments balance, the phone block is reachable and raises every size, the floors hold the numbers DESIGN.md names, the phone block tests the shorter side, no stylesheet writes a font size under the floor as a literal. | 1 | `npm test` | Terminal |
| tests/contrast.test.js | Every documented fill-and-ink pair in the color tokens of hu-global.css, in both themes, against the ratio DESIGN.md states. | 1 | `npm test` | Terminal |
| scripts/density.js | The first screen only: words of visible text, controls, controls a person must touch before the page tells them anything, share of the screen that is chrome. Pass two paths to compare them. | 2 by design, but no ceiling is recorded, so it cannot fail | By hand: `node scripts/density.js /path/ [/other/]` | Terminal |
| scripts/svg-collision-check.js | Labels overlapping inside a drawing, one page at 360 in dark. A one-off from 2026-09-20 for the laws page: it hardcodes this computer's repo path and that page's classes. The same check now runs inside the sweep on every page. | 1, one-off | By hand: `node scripts/svg-collision-check.js learn/laws-and-paradoxes/ [folder]` | Terminal; a screenshot if a folder is given |
| scripts/review.js, the review screen | Checks nothing itself. Shows a page at desktop and at phone width (360, 390, 430, or 740x360) side by side, in either theme, reloading when the page changes. | 3 | `npm run review` after a build | David's eyes, at /__review |

---

## VOICE AND WRITING

Every row here reads one rule file, scripts/lib/writing-rules.js: three layers (patient information, professional tone, HU voice), three levels (Must fix, Fix, Read again) and the register of the page (Rounds, Learn, Tools and games, other site pages, work writing, advocacy). A guest piece gets the patient and em dash rules only.

| Instrument | What it checks | Tier | How it runs | Where the result shows |
|---|---|---|---|---|
| scripts/writing-check.js | A Markdown or text file, a saved draft, one built page (read after its scripts draw), or every built page. Exits 1 on any Must fix: a patient identifier or an em dash. `--all --baseline` rewrites tests/writing-baseline.json. | 1 on Must fix; Fix and Read again are reported for a person | By hand: `npm run writing:check -- <target>` | Terminal, or `--json` |
| scripts/writing.js, the writing screen | The same rules on a screen, for a pasted draft (on the site or off it) or a picked page. Saved drafts and panel notes go to private/writing/, which git ignores. | 3: the findings are machine, the call is David's | `npm run writing` | The screen at /__writing |
| tests/writing-phi.test.js | No patient identifier on any built page or in the Rounds story files; no location data in any image, and no camera data in any Rounds photo. | 1 | `npm test` | Terminal |
| tests/writing-voice.test.js | Each page's Fix findings (voice and tone) against tests/writing-baseline.json. A page may lose findings, never gain them; a page not in the file must have none. | 2, a ratchet that fails inside `npm test` | `npm test` | Terminal |
| tests/writing-rules.test.js | The checker itself: each of David's 2026-10-03 rulings fires, and the voice profile's pre-AI calibration passages come back with nothing to fix. | 1 | `npm test` | Terminal |
| tests/site-build.test.js, its voice checks | No em dash in rendered text or hidden in JS strings; no banned vocabulary in rendered copy. | 1 | `npm test` | Terminal |
| The reviewer panel (the hu-writing-review skill) | Four read-only readers on one text: a medical director, a healthcare administrator, a healthcare technologist, a voice editor. Each returns a verdict and up to eight notes. | 3: judgment, on David's request | Ask: "run the reviewer panel on X" | private/writing/panel/, shown on the writing screen |

---

## CONSISTENCY ACROSS PAGES: reading shell, tool compare, meta

| Instrument | What it checks | Tier | How it runs | Where the result shows |
|---|---|---|---|---|
| scripts/shell-drift.js | Per reading page, how many times it redeclares something the shared .hu-read shell owns: hero, eyebrow, headings, standfirst, paragraph, note, card, grid, link. | 2: `npm run qa` fails if the total rises above 145 | `npm run qa`; by hand `node scripts/shell-drift.js` | Terminal table |
| tests/reading-shell.test.js | The same count, page by page, against the baseline written in the test: no page gains, the total only moves down, and the shell keeps the majority values it was built from. | 2, a ratchet that fails inside `npm test` | `npm test` | Terminal |
| scripts/shell-convert.js | Not a check. Moves one reading page's typographic rules onto .hu-read; prints the plan unless given `--write`, and skips any rule that carries the page's own design. | None: the tool that brings the Tier 2 number down | By hand, one page at a time | Terminal |
| scripts/tool-compare.js | The merged band and the controls under it on eight tool pages and the Atlas, at 1440 and 390, printing every value that is not the same everywhere. It reports disagreement, not defects: the maps differ on purpose. | 2 in spirit; no ceiling, and `npm run qa` does not run it | By hand: `node scripts/tool-compare.js` | Terminal |
| scripts/meta-screen.js | Every built page's title and description: missing, long (over 165 characters, cut off in search), short (under 70), and any two pages sharing one. | 2: `npm run qa` fails on more than 30 long descriptions or any duplicate | `npm run qa`; by hand | Terminal |
| tests/site-build.test.js, its metadata and kit checks | Every page carries a title, a description and one brand suffix; no tool has drifted back off the shared kit. | 1 | `npm test` | Terminal |
| tests/tool-source-lines.test.js | Every public tool page with the attribution strip gives a source line of at least 12 characters, with no em dash. | 1 | `npm test` | Terminal |
| tests/neutral-measures.test.js | Every Population Health Map measure says which way it reads; the neutral ramp is the Career Tree's pay ramp, so the map brings no new color. | 1 | `npm test` | Terminal |

---

## FUNCTION: tests, play checks, links, backend

| Instrument | What it checks | Tier | How it runs | Where the result shows |
|---|---|---|---|---|
| The type checks | tsc over plain JavaScript with JSDoc: the shared JS in src/assets/js/ and the tests, then everything in scripts/. Script inside page templates is out of its reach. | 1 | `npm run check` (in qa and verify); `npm run check:scripts` (in verify only) | Terminal |
| tests/site-build.test.js, the rest | Against the built site: every inline script parses, inline styles balance, JSON-LD is valid, every internal link and asset resolves, every page has an h1, every image has alt text, every link has a name, click handlers sit only on real controls and role="button" has a tab stop, shipped data files are valid JSON. Builds first if _site is missing. | 1 | `npm test` | Terminal |
| tests/icons.test.js | Every icon name used in src/ ships in the self-hosted subset, none extra, the same API the site calls, still small, nothing loaded from a third party. | 1 | `npm test` | Terminal |
| tests/system-layers-numbers.test.js | Every number on a System Layers card names who published it. | 1 | `npm test` | Terminal |
| The site kit tests | hu-kit.pop, hu-kit.sheet, hu-kit.urlstate, hu-kit.conusview, hu-kit.peek: the shared pieces the tools are built from. | 1 | `npm test` | Terminal |
| Tool and dataset tests | career-phone-flow, schools-crosscheck, schools-map, suppliers, telehealth-measure. | 1 | `npm test` | Terminal |
| scripts/check-schools.js | The Schools layer against what the accreditors list, program by program; names too far apart to call are marked unsure for a person. | A report | `npm run check:schools` | data-build/schools-crosscheck.json and docs/HU-SCHOOLS-CROSSCHECK.md |
| scripts/link-check.js | Every link that leaves the built site, plus the source links in the data files tools draw. DEAD (404, 410, a host gone) exits 1; UNSURE (401, 403, 429, 5xx, timeout) is for a person to open in a browser. | 1 for DEAD; kept out of the gate on purpose | By hand, meant monthly, after a build: `npm run links` | Terminal; `tmp/link-check/<date>.json` |
| scripts/play-check.js | Plays Alarm Fatigue with the whole floor bought (`?afdev=full`) at 360, 430, 507 and 699 and asks whether any panel that stays on screen covers a control or a live readout. Its selectors are that game's, so it checks no other. | 1 when run; not in qa | By hand, with the dev server on 8080: `node scripts/play-check.js` | Terminal; `tmp/play-<width>.png` |
| scripts/phone-qa.js | David's QA list run by script, a 360x740 phone against a 1280x800 laptop: a Device Assembly race, a hospital table with an offer and a countersign, Alarm Fatigue's share card, Article 11's sources and links. | 1 when run; not in the gate (it uses the internet relay) | `npm run qa:phone` with the dev server, or `npm run qa:phone -- <live URL>` | Terminal; tmp/qa/ |
| backend-check.js, backend-check-da.js, backend-check-vital-stats.js | Headless browsers play a real round trip over the live relay (Uncharted General, Device Assembly, Vital Stats) and assert every guest's copy of the game is byte for byte the host's. | 1 when run; out of `npm test` on purpose | `npm run backend:check`, `:da`, `:vs`, against the dev server or a live URL | Terminal; screenshots in tmp/ |
| tests/backend-host.test.js | Each multiplayer game names the same backend as the CSP in netlify.toml, ships a publishable key only, and loads the client before the table kit. | 1 | `npm test` | Terminal |

---

## GAMES

The contract is .claude/rules/games.md: the engine as data plus verbs, saves, the table kit as the only network code, the ten menu rules, the test hook. Games also pass through everything above: the sweep, the writing rules in the Tools and games register, and play-check, phone-qa and the backend round trips under FUNCTION.

| Instrument | What it checks | Tier | How it runs | Where the result shows |
|---|---|---|---|---|
| tests/hu-kit.menu.test.js | The menu kit: every card is a dialog with an X named Close; Esc and the phone back gesture close one card at a time; confirm names the act and refuses "Yes" and "OK"; settings are remembered per game; the how-to opens by itself on a first visit only. It tests the kit, not whether each game uses it (all six games call it today). | 1 | `npm test` | Terminal |
| The table kit tests | hu-table, hu-save, hu-rng, hu-qr: seats and the envelope, save strings, the seeded generator, the QR join code. | 1 | `npm test` | Terminal |
| Per-game tests (31 files) | alarm-fatigue-alarms, alarm-fatigue-cleanup; device-assembly plus alpha, flip, group, merge, patient, room, space, table, track; er-charge, er-charge-kit; games-cleanup (Regional and ER Charge); uncharted-general capstone, guards, offers, resume, rng, save, start, table, v11, v2; uncharted-regional, uncharted-regional-kit; vital-stats, vital-stats-links, vital-stats-questions, vital-stats-systems. Each loads the game's script through its test hook; the multiplayer games carry fake-bus tests (two sandboxes, the guest's run identical to the host's). | 1 | `npm test` | Terminal |
| scripts/density.js, on a game | The words at first paint, the measure that opened the reading-load phase (364 on the assembly wall, 216 on the hospital start menu, 155 on the RN floor). See VIEW. | 2, no ceiling | By hand | Terminal |

---

## Skills and agents

| Skill or agent | What it is for |
|---|---|
| hu-voice (skill) | The voice rules beyond the kernel: hard rules, structural budgets per page, banned words, a check before handing prose over. Load before writing any prose, including meta tags, alt text and UI copy. |
| hu-writing-review (skill) | Runs the writing checker on a draft or a page, then, when David asks, the four-reader panel. Prose written for David should reach him with no Must fix and no Fix. |
| impeccable (skill) | An outside design skill (version 4.0.4) for critique, audit, polish and redesign of an interface. Outside a declared design phase the change budget still rules, so its taste is not a reason to change a shipped page. |
| The other skills in .claude/skills/ | animate, animate-expo, animation-vocabulary, apple-design, ask-sonner, emil-design-eng, find-animation-opportunities, improve-animations, pick-ui-library, prototype, review-animations, write-swift: general design, motion and code help. None is a QA instrument. |
| hu-auditor (agent) | Read-only audit of one page: structure, AI writing tells, visual consistency, function, accessibility, performance, meta. Returns a ranked findings table and edits nothing. |
| hu-voice-editor (agent) | Rewrites prose that reads as generated, keeping every fact. After the auditor flags copy, or when new copy is written. |
| hu-mobile-tester (agent) | Phone-width testing: starts from `npm run phone`, then works the touch interactions, reads console errors and takes screenshots. Read-only. |
| hu-a11y-fixer (agent) | Fixes the accessibility and interaction defects the auditor or the mobile tester found: keyboard traps, mouse-only controls, alt text on paired images, missing names, contrast, form labels. |
| hu-polish (agent) | Finds drift inside the existing design system: spacing, raw hex outside the tokens, components that left their siblings, unfinished states. Never proposes a new direction. |

---

## The rules and the law

| File | What it governs |
|---|---|
| CLAUDE.md | Everything first: precedence, the change budget, the open design phases, ALWAYS TRUE (no em dashes, the 360 floor, a phone is the shorter side, the nine-size sweep before a page ships), the voice kernel and the NO LIST. |
| DESIGN.md | The design system, in four tiers. TIER 1 physics, never suspended: the 44px touch floor, the phone type floor, one top bar inside 20%, both themes, the motion cap. TIER 2 system: HUKit, tokens, shared partials. TIER 3 this era's look, suspended on a surface in a declared design phase. TIER 4 identity: no em dashes, every number captioned with its source, the 4Ps as pills only. |
| .claude/rules/templates.md | Templates: card text clamped by CSS, never cut in the template; alt text on paired dark and light images; an h1 that means something; names on icon-only controls; no passthrough copy over processed templates. |
| .claude/rules/css.md | CSS: tokens before raw hex, 100dvh, reduced motion, transform and opacity only, every state finished, the 44px and type floors, one top bar on a phone, a second drawing for a chart on a phone. |
| .claude/rules/tools.md | Interactive tools: touch first, touch-action on the surface only, Esc walks back one level, HUKit before hand-rolled pieces, state in the URL. |
| .claude/rules/games.md | Games: the engine contract, saves and the wire, the kit as the only network code, the ten menu rules, the test hook. |
| docs/HU-INSTRUMENT-GRAMMAR-2026-08-11.md | How the maps and tools behave: the seven laws, the enforcement ladder, the checklist for a new build. |
| docs/HU-TOOL-SHELL.md | The tool layout: regions, breakpoints, classes. |
| docs/HU-PAGE-RECIPES.md | Three page skeletons copied from shipped pages. Start a new page here. |
| docs/HU-HANDOFF-BRIEF.md | What an outside session must know before it builds anything for the site. |
| docs/voice-profile.md | The full voice profile from two recordings and about 40 pre-AI pieces; the calibration passages are section 7. |
| docs/HU-VIEWPORT-METHOD-2026-09-21.md | Why width-only breakpoints broke pages held sideways, and the method for finding the next fault of that kind. |
| docs/HU-GAME-MENUS-2026-09-23.md | The apps to copy for each menu job and the words to use in a prompt; the source of the menu rules now in games.md. |

---

## Gaps

What a page review needs that no instrument covers today.

- Understanding. Whether a stranger knows what to do, and whether a page looks good, reads well or feels crowded. Only a person can judge that; density.js gives a count, not a verdict.
- Memory. No instrument keeps a page's result or David's verdict on it. The ledger and the board are planned, not built.
- The light theme. The sweep runs in dark only. The light side was swept once, on 2026-09-23, by a one-off (tmp/theme-scan/scan.js) that is not a standing check. contrast.test.js covers the token pairs in both themes, not the rendered pages.
- Text contrast on the page. The sweep measures contrast only for labels and lines inside drawings. Ordinary page text is covered only through the token pairs.
- The touch floor. DESIGN.md puts 44px targets in Tier 1, but the sweep only warns on them, as it does for content clipped at the edge and for 100vh.
- Motion and the keyboard. Nothing site-wide checks reduced motion (one game test does, ER Charge's), visible focus, or that every control can be reached by keyboard. site-build checks only that click handlers sit on real controls and that role="button" has a tab stop.
- Dates on sources. CLAUDE.md wants data-driven content to carry its check date. tests/tool-source-lines.test.js checks that a source line exists, not that it has a date, though docs/HU-CONSISTENCY-TOOLKIT-2026-10-03.md section 2.3 says it does.
- `npm run qa` is not everything. It skips `check:scripts`, which `npm run verify` runs, and tool-compare.js, which its own header lists. density.js and play-check.js are not in it either. Links, phone-qa and the backend checks stay out on purpose: they need the internet or a running server.
- Measures nobody holds. density.js and tool-compare.js have no recorded ceiling, so neither can fail.
- Play. play-check.js plays Alarm Fatigue only. No other game is checked mid-play for panels covering controls, beyond the flows phone-qa walks.
- The game shell. Nothing checks that each game's top bar and start screen follow one standard (planned, section 2.6), or that each game stays wired to the menu kit.
- Docs out of step. docs/HU-PAGE-RECIPES.md says the phone check should be clean "at 360 and 699", and .claude/rules/games.md says "eight default viewports". CLAUDE.md and phone-check.js run nine and say not to narrow to 360 and 699. scripts/qa.js names docs/HU-REVIEW-QA-2026-09-22.md as "the checklist", but that file is the review list for the changes of 21 and 22 September, not a standing checklist.
