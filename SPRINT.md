# SPRINT

The current piece of work, one goal, as numbered steps in the order they depend on each other.
The map for the quarter is docs/HU-DEV-PLAN-2026-Q4.md; this file is what is being done right
now. Read it after DECISIONS.md at the start of every session.

---

## HOW THIS WORKS

- **One sprint at a time, one goal in one sentence, and a definition of done David can see or
  play.** Never "the code is in".
- **Steps, not days.** The steps are numbered in dependency order. David moves through them as
  fast as his time allows; a step is never scheduled to a weekday. Any date in this file is a
  deadline for something outside the repo (a friend, a deploy), not a plan.
- **Every step names an owner:** David, Claude in the session, or a named agent. Every step has an
  acceptance line. A step with no acceptance line is not a step, it is a wish.
- **David's steps are written in plain words, click by click.** He never runs a command. Before
  each of his steps, Claude has shown him what to expect.
- **Every Claude step ends with something David can see:** two screenshots in the chat, one at
  phone width and one at desktop width, or a page to open on his phone.
- **Changing the sprint is allowed and expected.** David says the new goal in the conversation.
  Claude rewrites the steps, moves anything displaced back to its month in the plan, and writes
  one line under CHANGES saying what moved and why. Nothing is silently dropped.
- **The sprint closes with numbers.** The result in the LOG, one line in the plan's log, and the
  next sprint drafted for David's yes.
- **Gates do not move for a sprint.** `npm run verify` green and `npm run phone` clean before any
  ship. David commits, pushes and posts.

Step statuses: NEXT · DOING · DONE · WAITING (say on what) · MOVED (say where).

---

## SPRINT 1 · The Table plays over the internet again

**Goal:** The hospital game's multiplayer connects over the internet again, and David tests it
on his own devices, then with a friend.

**Definition of done:** David hosts a table from one device, joins from a second device that is
NOT the same browser, takes a seat on each side, plays through at least one quarter, and both
screens show the same hospital. If a guest reloads mid-game, they get back in with the code.

**The one outside deadline:** a friend on another network can only join once the site is
deployed, which is David's push (step 7). Everything before it works on the home wifi through
Claude's dev server.

### The steps

| # | Step | Owner | Acceptance | Status |
|---|---|---|---|---|
| 1 | **Bring the backend back.** Restore the sleeping project, or make a new one. Plain-words instructions below. This is DECISIONS row S. | David, 10 min | David has said "restored", or pasted the project URL and the publishable key, or signed in inside the browser pane and told Claude | DONE 2026-09-20 16:40. It was PAUSED, not deleted (a paused project has no DNS at all, which is why it looked gone). Restored under the same address, so no code repoint was needed. |
| 2 | **Point the game at it.** The `SUPA` constant in the hospital game and the `connect-src` entry in netlify.toml (https and wss). A new test, `tests/backend-host.test.js`: the host in the page equals the host in the CSP, and the page references the vendored supabase-js. The GitHub Actions workflow: `npm run verify` on every push, plus a ping to the backend every three days so it never sleeps again. | Claude | `npm run verify` green with the new test in the count; the workflow file in `.github/workflows/`; David sees the test output line in the chat | DONE 2026-09-20. No repoint needed (same address). `tests/backend-host.test.js` 3 of 3; `.github/workflows/verify.yml` (verify on push, ping every three days, nothing to configure); verify green. |
| 3 | **The real round trip.** `scripts/backend-check.js`, run as `npm run backend:check`: two headless browsers load the game, one hosts, one joins by code, claims Clinical, the host starts a run, the guest sends one hire, and the script asserts the guest's packed run equals the host's. It talks to the real relay, so it stays OUT of `npm test`. | Claude | The script prints the room code, the seat, and "identical" and exits 0; a screenshot of both screens side by side in the chat | DONE 2026-09-20. `npm run backend:check`: table XZKA over the internet transport, guest seated Clinical, hire applied, identical. Screenshots in the chat. |
| 4 | **The reload audit, and rejoin if needed.** With step 3's harness: reload the guest mid-run, reload the host mid-run, hide the page 60 seconds as a backgrounded phone would. Write what each does today under NOTES. If a guest cannot get back in with the code and their nickname, build it: the host re-seats them and sends the current state; the host's own tab keeps the last state and offers "resume this table" on reload. | Claude | The NOTES paragraph; if rejoin was built, step 3's script gains a reload step and still prints "identical" | DONE 2026-09-20. Built: the host's tab remembers the table and its last state and offers "Resume table XXXX" on the start menu (same code, so guests need do nothing); guests get "Rejoin table XXXX as Name" with one tap; an unanswered knock says what to do; a move the host did not hear gets a "try it again" hint after 2.5 s; outgoing messages wait until the relay channel has joined. 5 new unit tests (`tests/uncharted-general-resume.test.js`), verify green at 176, and `npm run backend:check` now reloads both sides through the live relay: "host reload · resumed · identical", "guest reload · rejoined with one tap · identical". |
| 5 | **The lobby on a phone.** The host lobby, the join screen, the seat picker and the guest's board at 360 and 699 wide. Targets under 44 px, clipping, the room code readable at arm's length. Fix what fails. | hu-mobile-tester, then Claude | `npm run phone -- secret-menu/uncharted-general/` clean; two screenshots in the chat, the code and the seats visible at phone width without scrolling | DONE 2026-09-20. Found and fixed at 360: the join row showed before "Join a table" was tapped (a display rule beat `hidden`); the ownership and hospital rows ran past the modal and made the whole start menu scroll sideways; Host, Join, Close and the tutorial toggle sat at 38 px; the run-length buttons and CEO arrows were under 44; the sticky Start bar plus the nav was 21% of the screen against a 20% budget. Phone gate now ok at 360, 699 and 1024 (chrome 18%); the six remaining sub-44 targets are the CEO carousel dots, the same deliberate exception as the vendor directory's dots. The code reads at 34 px on one line; the seat picker fits with no sideways scroll. Verify green at 176. |
| 6 | **David's first test, no push needed.** On the home wifi: phone opens the dev server address below and hosts a table; laptop opens the same address and joins with the code; one quarter each. Tell Claude what happened in plain words. | David, 15 min | David's read in the chat: joined first try or not, anything that confused him | DONE 2026-09-20. Phone hosted table ZQRQ through the dev server on the home wifi, laptop joined by code and saw the seat picker; David: "looks like its working. for all steps" (join, hire, run the quarter, both reloads). |
| 7 | **Commit and push**, then say "pushed". If GitHub emails a red X afterwards, paste the email in the chat; reading it is Claude's job. | David | David has said "pushed" | WAITING on David (2026-09-20: "i will test those steps later"); carried into Sprint 2 as its step 0 |
| 8 | **The live-site check.** On healthcareuncharted.com, not localhost: the deploy finished on `healthcare-uncharted` (the project that serves the domain; the other three are the trap), the served CSP names the new host, the vendored supabase-js loads, zero console errors, and a table hosts from the browser pane. | Claude | A screenshot in the chat of a live lobby with a room code on healthcareuncharted.com | WAITING on 7 |
| 9 | **The friend test.** A friend on their own phone, on their own network, joins David's table by code. One quarter. Then five lines from David in his own words: did the join work first try; did anyone reload and what happened; what confused the guest; what did the seats argue about; would you play a full year. | David + a friend, 20 min | Five lines under LOG | WAITING on 8 |

Alongside, any time before step 9: **ask a friend** for twenty minutes on their own phone. Two
minutes, a name and a time in the chat.

### Step 1 in plain words

Go to supabase.com and sign in with the Google account that serves the site (eitelmdavid). If the
project is not on that account, check your other Google account before creating a new one, and
save whichever login works in your password manager so the account question never comes back.
You are looking for a project whose address contains the letters `swntgsmpcqyuapkkyaqj`.

- If it is there with a Restore button: click Restore, wait until it says it is running, and tell
  me "restored".
- If it is not there at all: click New project, give it any name, pick any region, let it make a
  database password (save that in your password manager; I never need it), and click Create.
  When it finishes, open Project Settings, then the API page, and paste two things into this
  chat: the Project URL (it looks like https://something.supabase.co) and the key labelled
  "publishable" (it starts with sb_publishable_). Both are safe to paste; the publishable key is
  designed to ship inside the game's page, and the old one is already in the repo. Skip anything
  labelled "secret" or "service"; I never need those. If one ever gets pasted by accident, say so
  and we rotate it, which is a button on the same settings page.
- Or, if you would rather not hunt: sign in to supabase.com inside this app's browser pane and
  tell me. I will read the two values off the settings page for you and say what I am about to
  click before I click it.

### Step 6 in plain words

While my dev server is running (I say so in the chat), open this on your phone on the home wifi:

    http://192.168.86.227:8080/secret-menu/uncharted-general/

Host a table there. Open the same address on your laptop and join with the four-letter code.
Verified 2026-09-20 that the server answers on that address. If the phone cannot load it,
Windows Firewall is the likely reason: allow Node.js on private networks when it asks, once. The
address changes if the laptop gets a new one from the router; I check it each session.

You are judging one thing in steps 6 and 9: did it connect and stay connected. Whether it is fun
is the game-night question in November.

### Cut from this sprint, back to the plan

The kit extraction (plan week 2), the skill demo registry line, the RSS and Field Notes rows
(DECISIONS 8 and 9 stand on their own). No work lost.

### What could go wrong, and the answer

- The dashboard offers no restore and the new project has a new address. That is the expected
  case; step 2 is written for it.
- The relay works on the laptop and not on the phone. That is a CSP or a phone-lobby problem,
  and steps 5, 6 and 8 are there to catch it before the friend.
- The push cannot happen for a while. Steps 1 to 6 do not need it; only the friend does.
- The room code is a social gate, not a lock: anyone holding the four letters can join. Fine for
  friends. If David ever wants strangers at a table, the plan's month 2 adds host approval of
  each join.
- Step 6 or 9 shows a backgrounded phone dropping the table. That is the plan's named trigger for
  moving rooms to a server (Cloudflare Durable Objects); it goes on DECISIONS, not into this
  sprint.
- The free backend sleeps again despite the ping. The honest fix is the $25 a month tier, David's
  call when it happens.

**Sprint 1 result (2026-09-20):** steps 1 to 6 done in one day. The backend is awake with a
keep-alive, the relay round trip is proven both ways through reloads, the lobby passes the phone
gate, and David played host from his phone with the laptop as guest. Steps 7 to 9 (push, live
check, the friend) wait on David and ride along as step 0 of the next sprint.

---

## SPRINT 2 · The table kit, with a second game on it

**Goal:** The multiplayer machinery lives in one shared kit instead of inside the hospital game,
and a second game plays on it: Device Assembly, two players, same wall, first correct build wins.

**Definition of done:** Two people on two devices open Device Assembly, one hosts, the other
joins by code, both build the same order, and the first correct submit wins while the other
player's wall is visible as a ghost. The hospital game still passes every table test on the
shared kit. Gates green.

**Why this order (plan month 1, weeks 2 and 4, and the design doc's own rule):** the kit is
extracted WITH its second consumer, not before. Device Assembly is the cheapest second game
(its engine is deterministic and its moves are tiny) and the one whose audience already
answered once on r/respiratorytherapy.

**Decision taken under rule 5, David can veto by looking:** the second game is Device Assembly.
The alternatives (ER Charge co-op, regional teams) stay in the plan at month 3 and beyond.

### The steps

| # | Step | Owner | Acceptance | Status |
|---|---|---|---|---|
| 0 | **Sprint 1's tail.** Push, say "pushed"; Claude checks the live site; a friend joins a hospital table by code. | David, then Claude, then David + a friend | The live-site screenshot; five lines from the friend test | WAITING on David |
| 1 | **The engine contract**, written down once: `.claude/rules/games.md`. State is data, every mutation is a verb through one dispatcher, the seed rides the save, the test hook, no DOM in the tick, the kit is the only network code. | Claude | The file exists and the next steps follow it | DONE 2026-09-20: `.claude/rules/games.md` |
| 2 | **`hu-save.js`.** The deflate save-string pair with a prefix parameter, lifted from the hospital and regional games (two hand copies today). Both games consume it; their save tests still pass. | Claude | Verify green; the two games' save code is gone from the pages | DONE 2026-09-20: `src/assets/js/hu-save.js` (`HUSave.codec(prefix)`), both games call it, 5 kit tests, the headless harness loads kits before the page, verify green at 181, live relay check still identical both ways |
| 3 | **`hu-rng.js`.** A seeded generator whose seed rides the save. The hospital game adopts it, so tests stop pinning Math.random and a run replays from its string. | Claude | Verify green; one test replays a quarter from a seed and gets the same numbers | DONE 2026-09-20: `src/assets/js/hu-rng.js` (`HURng.make(seed)`, state saves and restores to the draw); the hospital game rolls every in-run die through `roll()`, mints a seed per run, saves seed and position, restores them from a string; tests pin `ug.pinDice(fn)` instead of Math.random; 4 kit tests + 5 replay tests; verify green at 190. The regional game keeps Math.random until it joins the table. |
| 4 | **`hu-table.js`.** Lobby, seats, roster, intents, envelope, the transport plug (same-browser and internet, with the join queue), memo, resume, rejoin. Lifted from the hospital game, which becomes consumer one. The table and resume tests move to the kit; `npm run backend:check` still prints identical both ways. | Claude | Verify green; the hospital page's table section is a thin adapter over the kit | DONE 2026-09-20: `src/assets/js/hu-table.js` (`HUTable.create({channelPrefix, memoKey, backend, seats, verbSeat, hooks...})` owns state, transport with the join queue, lobby protocol, memo, resume, rejoin, intent routing); the hospital page keeps its seats, verbs, save format and screens and passes eight hooks; the table section went from ~220 lines to ~60; every existing table, resume, save and replay test passes unchanged; verify green at 190; `npm run backend:check` identical both ways through reloads on the kit-backed page. |
| 5 | **Device Assembly, two walls.** Room code and names on the level select; the host runs both boards; the guest's place, rotate, flip, connect and submit travel as intents; the other wall shows as a ghost; the first correct submit wins and the success card says who. On the kit, nothing new in the transport. | Claude | Headless test: two sandboxes on the fake bus, both boards identical after each intent, the win recorded once; a second backend check for this game prints identical | DONE 2026-09-20. "Two walls" fold in the level panel (name, Host, Join by code, Resume, Rejoin); the host picks the wall and the guest's board opens on it; each wall stays local (a drag costs no round trip) and its snapshot crosses after every change; the other wall draws as a ghost; a submit is judged by the host with the real engine; the first working build wins once, on both screens; a forged submit from outside the chair dies at the host; the host tab resumes the race after a reload. 5 tests in `tests/device-assembly-table.test.js` (62 for the game in all), the backend test now covers both games, `npm run backend:check:da`: table KKXS, guest built and won, identical. |
| 6 | **Two walls on a phone.** The level select with the table block, the ghost wall, and the win card at 360 and 699. Fix what fails. | hu-mobile-tester, then Claude | Phone gate clean; two screenshots in the chat | DONE 2026-09-20. Measured at 360 and 699 over the live relay: the fold, the join row (hidden until tapped), the code at 34 px on one line, the joining overlay, the ghost wall (present, 2 children), the win card on both screens. Nothing under 44 px, no text under 12 px, no overflow. No fixes needed; shots in the chat. |
| 7 | **The race: phone hosts, laptop joins**, both build the 2 L cannula wall, one submits first. | Claude's phone QA script (`npm run qa:phone`), then David on a real phone for feel | 19 of 19 steps green; David's read in the chat | DONE 2026-09-20 by the script (an emulated 360 phone hosts, the laptop joins by code, both walls mirror byte for byte, Sam wins on both screens; screenshots in tmp/qa/); the real-phone read is folded into Sprint 3 step 7 |
| 8 | **Push**, then the live check, then Device Assembly's launch decision (DECISIONS 1: David's phone play at 360, then the post to r/respiratorytherapy in his voice). | David, Claude, David | "pushed"; a live screenshot; David's alpha call | WAITING on 7 |

### Cut from this sprint, still in the plan

The scaffold script, the RSS scope and the Field Notes line (DECISIONS 8 and 9), the skill demo
registry line (decided under rule 5: it stays reachable from the field guide only, no separate
tool card; one line here is the record), Rounds 06.

---

## SPRINT 3 · Month 2 of the plan, the Claude-only parts first

Opened 2026-09-20 on David's "do everything you can from this list, then I will do the testing
and QA again." Sprint 2's steps 7 and 8 and Sprint 1's tail stay his; this sprint is what does
not need his hands, in the plan's month 2 order.

| # | Step | Owner | Acceptance | Status |
|---|---|---|---|---|
| 1 | **The launch post for Device Assembly**, drafted in David's voice for his edit, built on the subreddit research (image first, Student RT flair, the builder named, free, no DM gating, the floor's way said out loud). | Claude | docs/HU-LAUNCH-POST-DEVICE-ASSEMBLY.md | DONE 2026-09-20 |
| 2 | **The GM console and offer cards** on the hospital table (design doc section 9, the v3 pieces). Three cards (a payer rate deal, state money with strings, a community promise); the host puts one on the table; the CEO seat accepts or declines; a contract needs Finance to countersign; undecided when the quarter runs, it lapses; sealed, it becomes a deal judged every quarter that pays out or breaks; offers and deals ride the save. Solo play never sees them. | Claude | 7 tests on the fake bus with a CEO and a Finance guest; verify green; the console and the offer visible in the browser at 1280 and 360 | DONE 2026-09-20: `tests/uncharted-general-offers.test.js`, verify green at 206, live relay check still identical, buttons at 44 px on a phone; screenshots in the chat |
| 3 | **The Alarm Fatigue share card**: a 1080 square of the shift (clock-out time, tasks, interruptions, codes, caught and missed, breaks bought, achievements) on the lunch, shift-end and clock-out screens, downloaded as a JPEG, nothing sent. Title and numbers only, per the site's card rule. | Claude | The card draws in a real browser and the file opens; the phone gate on the game unchanged | DONE 2026-09-20: `shiftCard(kind)` in the game, a Share card button on all three end screens, drawn headless at 85 KB; in the chat |
| 4 | **The second launch post**, Alarm Fatigue to r/incremental_games, drafted for David's edit. | Claude | docs/HU-LAUNCH-POST-ALARM-FATIGUE.md | DONE 2026-09-20 |
| 5 | **Game night #1 prep**: a one-page runbook for the host (how to set the table, the seats, the offer cards, what to write down after). | Claude | docs/HU-GAME-NIGHT-01.md | DONE 2026-09-20 |
| 6 | **The Alarm Fatigue companion Learn page**, the evidence behind the game, every figure verified live and dated, in the Learn register, on the page recipe, linked from the game's huddle and the Learn shelf. | Claude, then hu-auditor and hu-voice-editor | Verify and phone gates green; the auditor's findings table with nothing above minor | DONE 2026-09-20 · built at `/learn/alarm-fatigue/` (Article 11, Clinical Safety); every figure verified 2026-09-20 against Sentinel Event Alert 50, Drew 2014, Joint Commission Perspectives July 2013 and ECRI 2015; registered in learn.js, the reading order, the hub card, the sources ledger, and linked from the game; verify green at 206; phone gate clean (one inline DOI link under 44 px, the citation exception); voice pass applied (six edits, one fact wording tightened); auditor's table of 15 (two high, four medium, nine low) applied in full 2026-09-20, see NOTES; verify green at 206; phone gate CLEAN at 360/699/1024 |
| 8 | **The Device Assembly funnel** (plan month 1, week 3, the one Claude-only item still open there): GoatCounter events the way Alarm Fatigue has them, so the launch post can be read. | Claude | Events fire in a real browser, a QA load fires nothing, tests green | DONE 2026-09-20 · five events (first wall opened, first tutorial finished, first missed submit, table hosted, table joined) plus two buckets on the way out (minutes, walls finished); counts only, nothing identifying; silent under `?dadev`, `?unlock=1` and both script hooks, so `npm run qa:phone` cannot file scripted hosts as real ones; 4 tests; proven in a real browser |
| 9 | **Reading load, all three games** (David's 2026-09-20 ruling, CLAUDE.md OPEN PHASES). Simplify each screen to what a player needs to act, and put the explanation one hover or one tap away. | Claude, then David's read | Words on the first screen down, and nothing lost: it is all still reachable | DOING · `HUKit.peek` built and tested (8 tests); assembly wall 364 words to 141 at desktop; hospital start menu 216 to 185 at desktop and 133 to 86 on a phone, every setting now explained by its own option on hover and by one badge per row on a thumb; the RN game's door card 43 words to 15. Assembly UI rebuilt on David's read of the screenshot: the hint bar above the wall is gone (the bedside monitor's HINT page already carried the same step), the build counts moved onto the monitor's ORDER page, and the four-button row became Complete and Reset. Undo moved into the board's verb dock and only takes width once there is history. 13 words at 360 and 103 at desktop, from 46 and 364. Hospital run panels done too: the standing paragraphs under the controls mostly REPEATED the badge two inches above them, so the duplicates went and what they knew that the badge did not was folded in. 517 words to 396 on a phone, 558 to 437 at desktop. What is left on those panels is live state, not explanation |
| 10 | **The open questions, worked through** (David: "lets take a crack at those items in number 3"). | Claude, what does not need David | Questions closed or unblocked, and the ones that are truly his named | DONE 2026-09-20 · two more were already answered and got closed; a sweep of all 42 public pages replaced a stale claim with a measurement; every chrome failure on the site fixed; one gate bug found and fixed; question A scoped page by page |
| 7 | **David's part, now short.** (a) On his real phone, one race and one hospital table with the laptop, for feel and for what a backgrounded phone tab does, which no script can fake. (b) Read the two post drafts, docs/HU-LAUNCH-POST-DEVICE-ASSEMBLY.md and docs/HU-LAUNCH-POST-ALARM-FATIGUE.md, and change what is not his voice. (c) Commit and push, say "pushed". Everything else on the old list ran green in the phone QA script on 2026-09-20 (19 of 19 steps, screenshots in tmp/qa/). | David | His read in the chat; "pushed" | NEXT (yours) |

---

## NOTES

**The diagram type rule, all three parts (2026-09-21).** David, zoomed into two labels after the
ink pass: "i think it looks better for sure. but i still think there has to be a better plan for
text contrast on these images." He was right that a colour is not a plan. Measured, and the
diagnosis was exact: everything in the diagrams that READ well was weight 600, and everything that
read weakly was the same configuration every time, monospace at weight 400 with wide tracking.

Three things decide whether small light-on-dark type reads, and the site was managing one:
- **Contrast.** Done in the previous pass, `--dgm-ink` at about 9:1.
- **Weight.** Light on dark optically thins, because the bright glyph bleeds into the dark field,
  which is why the same font looks heavier on a white page. A monospace face is thin to begin with.
  So a diagram label owes 500, and mono at or under 13px owes 600.
- **Tracking.** Past about .14em a small word stops having a shape and reads as separate letters.
  The section labels were at .16em.

Written once, in hu-global: `--dgm-weight` 500, `--dgm-weight-label` 600, and a single rule,
`svg text:not([font-weight]) { font-weight: var(--dgm-weight) }`. That `:not` is load-bearing and
worth remembering: a CSS rule beats an SVG PRESENTATION ATTRIBUTE, so a bare `svg text` weight rule
would have quietly flattened every `font-weight="700"` title in the rounds charts.

The gate measures all three now, and two bugs in it were worth fixing while they were fresh.
Tracking is measured against the AUTHORED size, not the rendered one, because letter-spacing and
font-size are both in user units inside a viewBox and shrink together; dividing by rendered pixels
invents tracking that is not there. And the scene exemption has to walk up from the TEXT, not from
the svg, because the Atlas carries its pan and zoom on a group INSIDE the drawing. The type floor
had already learned that one and left a note; the new check now reuses its test rather than its own.

Every diagram on the site clears all three except the Steward postmortem's wide drawing, which is
one of the two charts still waiting for its phone twin.



**The ink floor (2026-09-21).** David, after the line pass: "the grey text just still does not look
clear enough or pop enough." Measured, and it was the same failure one level up. The section labels
inside the data diagrams ("PUBLIC SOURCES", "THE PIPELINE", "sources") drew at 1.8:1, because a 4px
decorative dot and a label a reader has to read both reached for `--t4`. Exactly the trap the border
token had: one value doing two jobs.

So the palette gained `--dgm-ink`, the muted voice INSIDE a figure: #9BB3CE, 8.8:1 on the page and
8.3:1 on a figure's own surface, against the 4.5:1 that is only the legal minimum. Quieter than a
title, comfortably readable rather than barely legal. Light pair #3A4F6B at 7.9:1. Repointed across
the data pages, the patient record, process engineering, request routing and the causal loop, which
moved that text from between 1.8 and 5.4 to between 8.1 and 9.9.

And the gate grew a third floor to sit beside the type floor and the stroke floor. This one has to
see what is UNDER the text, because a dark label on a white pill is correct and a naive check reads
it as 1:1; it walks the drawing for a filled shape whose box contains the label before falling back
to the page. It uses WCAG's own thresholds, 4.5:1 and 3:1 once the text is large. It immediately
caught something real that the eye had missed: the red class name in the request tree sat at 4.4
against its own tinted card. That one is now the size and weight it deserves, since the outcome IS
the answer the tree gives, and it clears at large-text weight.

Three floors now: is it big enough, is the line visible, is the label dark enough.



**The stroke floor (2026-09-20).** David, on the redrawn charts: "lines need to be clearly visable
on all diagrams... with so much of the same color we need to make sure we make things clear and
pop." He was right, and it had a number. Measured across every diagram on the site, EVERY connector
drew between 1.3 and 1.9 to 1 against its background. WCAG asks 3:1 of a graphic that carries
meaning, and a phone in daylight asks for more.

The cause was one token doing two jobs. A card's edge and a diagram's connector both reached for
`--border2`, and they are not the same thing: an edge is decoration and is allowed to whisper,
while the line between two boxes IS the claim that one leads to the other. So the palette gained
two tokens that say what they are for, and the card borders were left alone:
- `--dgm-line` #51739F, 3.9:1 on the dark page. Structure: box edges, axes, rules.
- `--dgm-flow` the teal accent, 9.8:1. Movement: arrows, the path, the direction.

That also answers the "so much of the same color" half. The flow now reads as one colour and the
furniture as another, so a diagram has a direction you can follow instead of a field of navy.
Both have light-mode pairs (#647C99 and #0F7F78, 4.1:1 and 4.6:1).

Every diagram on the site was repointed, 16 pages, and `npm run phone` now measures it: a stroke
under 3:1 inside a figure-sized svg fails the page, named and numbered, the way the type floor
does. A stroke painted in the surface colour is a halo (it punches a dot out of the line beneath
it) and is not counted. The sweep found five pages my own ten-page audit had missed, which is the
argument for putting it in the gate rather than in a checklist.



**The chart reflow, DONE, ten pages of ten (2026-09-21).** The phone-chart contract in
hu-global.css is the method: a chart authored for a wide column cannot be rescued by scaling,
because font-size inside a viewBox is in user units and shrinks with the drawing, so a chart that
matters on a phone ships a SECOND drawing sized for one. Done and clean at 360 and 1024:
- `/rounds/task-list-only-grows/` · the emergency-nursing time split, labels above their bars.
- `/rounds/problem-and-product/` · both figures, the pseudoaddiction count and the sepsis AUC.
- `/rounds/ai-promise-vs-bill/` · the Medicare AI volume pairs and the national spending bars.
- `/learn/healthcare-data-sources/` · the hero diagram plus the sources-to-shelf-to-storefront flow,
  rebuilt as three stacked bands.

Two things worth knowing before the next one. The hero on the data-sources page is the ONE chart on
the site a size bump fixes honestly: it draws at 320 units into a 312px column, so it was already
1:1 and its 12-unit type simply landed at 11.7px. Every other failure needed a second drawing. And
the contract's "320 units renders about 1:1" is only true in the reading column; the flow figure on
that same page draws into a 250px box, a 0.78 scale, so its twin sets its own type sizes rather than
inheriting the wide drawing's.

Also done: `/learn/4ps-framework/` and `/learn/laws-and-paradoxes/`. Those two taught the other half
of the method. The four-player diagram and the causal loop are both CONTROLS, not pictures: their
nodes are buttons and the loop animates, so neither could simply ship a second static drawing. The
four-player one took bigger type in the drawing it has, which works because its 160-unit node boxes
had the room; the two lines inside each node then collided, and a phone-only translate moved them
apart. The causal loop did get a twin, and the animation now lights a step by its data value rather
than by its position, so whichever drawing is on screen plays.

Also done: `/learn/patient-data-record/` and `/learn/request-routing/`. The patient record stacks:
three encounters that sat side by side become three cards down the page, each absorbing the contents
pill that used to sit under it, so one card says what a visit was and what it holds. Request routing
took both of its drawings. The eight-step lifecycle kept its shape and changed its proportions, with
the long uppercase captions wrapped rather than run out of their boxes. The decision tree could not
keep its shape at all, because a YES cannot sit to the right of its test on a phone, so it runs
straight down: test, the YES outcome inset under it, and the NO line carrying on to the next test.
That tree lights a path when a class tab is picked, which it does off one attribute on the svg, so
the twin carries the same groups and the script now sets the attribute on both drawings.

Finished with `/rounds/steward-postmortem/` and `/learn/process-engineering/`. The Steward flow is
the biggest drawing on the site and the one that most needed this: three actors side by side with a
cascade beneath, which on a phone becomes one column where the money that moved between the actors
is the label on the arrow joining them. Process engineering held four of very different shapes: a
swim lane (four lanes read left to right become five steps read top to bottom, each carrying the
lane it belongs to, which is the hand-off the diagram is actually about), the eight wastes (a 4x2
grid to a single column, because that figure draws into a 208px box and two columns cannot hold
readable type at a 0.65 scale), the value stream (the wide one names every wait above and below the
bar; the phone one keeps the bar and moves the names into two lines under it, because the RATIO is
the argument), and the PDSA cycle, the last animated diagram, which got the same treatment as the
causal loop. Its groups carried a bare `data-node` with no index, so both drawings were numbered
and the animation now lights a step by value.

**Every public page on the site passes the phone gate at 360.** Nineteen drawings, ten pages, and
the three floors (type, stroke, ink) all clean across 42 pages.

Two more traps worth carrying forward. A phone-only media query has to sit AFTER the rules it
overrides or it loses at equal specificity, which cost two passes on the MRI curve. And bigger type
in an existing drawing almost always creates a collision somewhere, because the original spacing was
chosen for the original size; budget a second pass for it every time.



**Every page on the site is now inside the chrome budget (2026-09-20).** A sweep of all 42 public
pages at 360 found four failures, not the six the decisions list remembered, and only one of them
stacked bars. Each had its own small cause and each is fixed:
- **The respiratory timeline**, 22%. Six filter chips and a label wrapped to four rows inside a
  sticky bar. One row that scrolls sideways: 178px to 126px.
- **The Sources appendix**, 26%. Same shape, same fix on its filter rail: 210px to 129px.
- **The hospital map**, 24%. The legend rail is a full-width flex row that sat BEFORE the last
  icon button in the DOM, so that one 44px control was pushed onto a third line of bar. Ordering
  the rail last lets the brand, the title and the button share a row: 189px to 133px.
- **The SQL tool**, 37% and the only one stacking bars. Two causes. Its score, a back chip and the
  menu button wrapped to two rows, so the back chip retires on a phone the way Alarm Fatigue's
  already does. And the gate was wrong about the rest (below).

**A gate bug, and the second one this month.** The SQL tool's two slide-in panels are parked by
translating them off the SIDE of the screen, not by hiding them, so each panel's own sticky header
reported a perfectly normal vertical box while sitting entirely off screen. The chrome check only
measured vertical overlap, so it counted both as stacked top bars and called a clean page 37%.
It now requires horizontal overlap too. Worth remembering as a pattern: this gate has twice
reported a page as broken (and once as clean) because of what it forgot to measure, so a surprising
reading is worth confirming in the browser before anyone rebuilds a page around it.

**What is actually left, measured.** Ten pages fail at 360 on one thing: text inside charts under
the type floor, 246 elements in total. That is question A and nothing else. Worst first:
steward-postmortem 45, process-engineering 41, request-routing 38 (plus 3 colliding labels),
ai-promise-vs-bill 26, patient-data-record 25, healthcare-data-sources 20, problem-and-product 17,
laws-and-paradoxes 15, task-list-only-grows 11, 4ps-framework 8. The fix is the proven one from the
burnout post: a second drawing authored near 320 units wide, swapped at 699. It is hand work, a
page per sitting, because the gate can only tell you a chart is legible, never that it is good.



**The hospital game's run panels (2026-09-20).** The measurement is worth keeping: on the first
screen of a run there are only 73 words at 360, but the whole page held 517, because the panels
stack below the fold and each one explained itself in a paragraph under its controls. Ranking the
panels by word count pointed straight at it: Operations 99, Financing 63, Medical Staff 47.

The finding was better than the fix deserved. Most of those paragraphs repeated a definition the
panel ALREADY offered from the little "i" beside its heading. Operations spent 31 words explaining
community programs directly under buttons whose own badge explains community programs. So the
duplicates went, the two or three facts a paragraph knew that its badge did not were folded into
the definition, and four ownership levers that had no badge got one. The `info()` helper now renders
a real button instead of a span, which means every badge in the game answers a keyboard as well as
a mouse and a thumb, and the game's own 14px badge style was dropped so there is one badge look.

What deliberately stayed: anything that reads the CURRENT state rather than the rules. The line
under the overhead slider now says only what this setting costs you; what the lever IS moved to the
badge. Pay drift, traveler packs in force, and the debt cap are numbers, not explanations.



**Device Assembly's one judging button (2026-09-20).** David: "We also dont need a Test and Submit
in the game, It should be just one complete and one Reset." The trap in that, and it would have
been a quiet break: "Test system" was ALSO the multiplayer submit. `raceSubmit` had exactly one
caller in the whole page and it was that button, so deleting Test would have left a guest unable to
finish a race while every test stayed green, because the fake-bus tests call `raceSubmit` directly.
Complete now runs `runTest()` first, which keeps the gas-flow animation, the bedside screen's TEST
page and the race entry, and then judges. The live two-wall check was re-run and passes.

Three smaller things went with it. The hint bar above the wall is gone because the bedside monitor
already showed the same step on its HINT page, word for word. The counts that sat under the buttons
now print on the monitor's ORDER page, under the order they measure. Undo left the button row for
the board's verb dock, and is hidden until there is history, so the dock keeps the width it had (a
sixth permanent icon pushed it across the monitor at 360). All the copy that named "Test" or
"Submit" was rewritten to name Complete.



**Publicity is parked (David, 2026-09-20).** "As far as posting anything online for now we will
hold off on that, we got good data from the RN game but we still need to improve that one too
before we push for publicity." So: the two launch posts stay as drafts and are NOT to be revised
or scheduled ("for item 2 we need to hold on those until much later"), the Device Assembly launch
in the plan's month 1 week 3 and the Alarm Fatigue launch in month 2 week 8 are both suspended, and
game night #1 waits on the games feeling right. Nothing is dropped; the drafts and the runbook keep.
The Device Assembly funnel built earlier the same night still earns its place: it is what will
measure the launch whenever it happens, and it had to exist before the post, not after.

**What crowding actually measured (2026-09-20).** Words on screen at first paint, before a player
does anything. The assembly wall at desktop was the worst at 364, and the cause was two of its four
reference sections being forced open on exactly the levels a beginner sees; the wall already teaches
itself through the coach bar and the bedside screen, so they open closed now. The hospital start
menu was a settings form that explained itself in standing paragraphs under every row. The RN game
met a phone with a 43-word card and a button reading "Clock in anyway".



**Alarm Fatigue's phone dock (2026-09-20, CLOSED the same night).** The gate failed at 360 on the
chrome budget alone: the dock was 177 px of 800, 22% against a 20% ceiling. Measuring it turned up a
second thing nobody had named. The line at the bottom of the dock rotates every 15 seconds, and at
360 the longer lines wrap to two while the shorter ones do not, so the dock grew and shrank by 20 px
under the player's thumb and shoved the console with it. One tightening pass fixed both: the button
goes 64 to 54 px (the touch floor is 44 and it is a full-width target), the readout loses 6 px of
gap and 7 px of padding, and the rotating line reserves its second line so the height never moves.
149 px at both 360 and 699, 19%, and the dock holds still through the shortest and the longest line.
Nothing was cut and no text truncates. Before and after screenshots went to David; his veto is
"the button feels small".

**Sprint 2 step 6, the assembly page's phone gate (2026-09-20).** The race screens are clean, but
`npm run phone -- secret-menu/device-assembly/` FAILS on the type floor: 28 elements at 360 and
23 at 699, all of them the board's painted labels ("LIGHT", "DATA", "HR", "SpO2", "SHARPS",
"CALL", "GLOVES" at 2.5 to 5.7 px) and the wall screen's "HINT 1/4" at 3.7 to 7.3 px. None are
the race's. The type-floor check is new today and this board's art predates it; the page passed
the older gate. Not changed: the board is the surface David called alpha with "go wild", and
whether the wall reads at 360 is his phone call (DECISIONS row 1). Recorded there as context.

**Step 4, the reload audit (2026-09-20, against the live relay, table NWZB).** A GUEST who
reloads lands on the start menu with nothing remembered; if they type the code and their name
again they get the run back AND their seat back without re-claiming it (the host still holds
their name against the chair), and their next action lands and echoes identically. So guest
rejoin works today; what is missing is memory: the code and the name have to be retyped. A HOST
who reloads kills the table: the run is gone, the code is gone, and the guests sit at a dead
table with a seat that answers to nobody. A hidden tab for 15 seconds changed nothing, but a
desktop browser cannot fake what a phone does to a backgrounded tab; step 6 is the real answer.
Decision (Claude's, under rule 5): build the host's "resume this table" (the host's tab keeps
the last state and the code; on reload the start menu offers to resume, and the guests already
on that code pick the state straight back up) and a one-tap "rejoin" for guests that remembers
the code and the name. The host case is the one that ends a game night on a phone.

---

**Sprint 3 step 6, the auditor's table on Article 11 (2026-09-20).** Fifteen findings, all applied
in one pass because the page had not shipped, so the change budget did not bind. The two highs: the
page body had no Atlas links (the two the hub card carries now sit in the hero, the sibling
`.card-fps` strip) and three of the four sources were plain text (every source line now links, in
a new tab like the-payer's, plus the one-line pointer to the Reference Appendix). The mediums: the
play button's hover used a literal blue that misses AA (now the documented `--blue-deep` token);
the prose sat one token step below M03, the only other tokenised Learn page (now `--t-lede`, Claude's
call, the reader-facing result is the screenshot); the four NPSG elements were stated twice in a
row (once now, the list carries the detail); the hero lacked the byline row and the bottom hairline
every sibling hero has. The lows: the h1 now equals the title, the kickers label instead of
numbering ("The mechanism", "The count", "The harm", "The rule", "The model"), one triad and one
sentence-length run broken up, the game box speaks in the page's own words, the table sits in a
scrolling wrapper instead of turning the table into a block, the hub card matches learn.js, and the
meta description is under 160 characters. What the gate still lists: six inline citation links
under 44 px tall, the inline-link exception the auditor already named for the DOI; not a defect.

**The phone QA script (2026-09-20).** David asked why the QA list was his when most of it could be
a script's. It could. `npm run qa:phone` (scripts/phone-qa.js) is an emulated phone (360 by 740,
touch) and a laptop doing his list against the dev server, or the live site when given its address:
the phone hosts an assembly race and the laptop joins by code and both build the first wall; the phone
hosts a hospital table, the laptop takes Finance, the GM plays the state's offer, the CEO accepts on
the phone, Finance countersigns on the laptop; the phone clocks in to Alarm Fatigue, takes the lunch
break, taps Share card, and the picture it downloads is saved; the phone reads Article 11, taps through
to the game, finds the card on the Learn shelf. Nineteen steps, a screenshot each, in tmp/qa/. It is
not in `npm test` because it talks to the internet relay. Its first two runs found two defects a
real thumb would have hit on Friday:
- The lunch and clock-out screens in Alarm Fatigue could not scroll, so on a phone screen shorter
  than the card the Share card button (and Pick the shift back up) sat below the bottom edge,
  unreachable. The overlay scrolls now; a short card still centers; the sunset stays fixed behind.
- The table kit's join window: a guest whose first knock and one-shot seat claim went out before the
  host's relay channel had joined (a phone on wifi takes one to five seconds) was heard by nobody,
  and the host's next queued state broadcast reached the guest and stopped its knocking. The guest
  then sat at a table that did not list it, unseated, and every move came back "That is the Wall B
  seat. Make the case to whoever holds it." The kit now knocks until the host's roster names the
  guest and re-sends the seat claim while the chair is open; tests/hu-table.test.js stages the window
  on a fake bus with a deaf host. Both live relay checks re-run green after the fix.
What the script cannot do, and stays David's: be a real phone (a backgrounded tab on iOS or Android,
a thumb on glass) and say whether a thing looks right.

**The Device Assembly funnel (2026-09-20).** Reading month 1 of the plan against what is built
turned up one Claude-only item still open: "GoatCounter events on the game the way Alarm Fatigue
has them, so the funnel can be read." It matters before the launch post, not after, because
without it the post goes to r/respiratorytherapy and nobody can tell whether a stranger opened a
wall, finished the first one, or ever tried a table. Five events and two exit buckets, copied from
Alarm Fatigue's pattern line for line: counts only, no identity. The one thing that game did not
have to think about is the QA guard. The check scripts and the phone QA script set `__DA_HOOK`,
so an unguarded page would have filed every scripted host and join as a real player the first time
`npm run qa:phone` ran against the live site; the page is silent under both tester hatches and
both hooks, and a test holds that shut. Proven in a real browser: the wall opens and fires, two bad
submits fire one miss between them, hosting fires, and the test hook is absent on a normal visit.
The first attempt at that proof was wrong and worth remembering: `count.js` replaces
`window.goatcounter` when it loads, so a recorder installed before the page settles catches the
first event and then silently loses the rest.

**What the Device Assembly phone gate still says (2026-09-20).** Unchanged by any of tonight: 28
elements under the type floor at 360 and 23 at 699, all of them the board's painted labels. That is
DECISIONS question 1, David's call, and nothing here touched it.

## CHANGES

- 2026-09-20 · Sprint 1 written from plan week 1, re-aimed on David's ask: "by the end of this
  week's sprint I would like to get the multiplayer function of one of my games up and running
  and set up so I can test it on Friday." The kit extraction moved from week 1 to week 2, where
  the plan already had it.
- 2026-09-20 · Rewritten from days to numbered steps on David's ask ("instead of planning these
  by days we need to do it by steps"). Same work; his first test moved BEFORE the push, on the
  home wifi, so nothing waits on a deploy except the friend.

---

**2026-09-20 (Sprint 2 step 7 and most of Sprint 3 step 7 moved from David to a script).** The mechanical
QA is now `npm run qa:phone`; David's list shrank to the real-phone feel read, the two post drafts, and the
push. Nothing dropped: the script found and Claude fixed two defects on the way (see NOTES).

- 2026-09-20 · The decisions list read back against the repo instead of against itself. Four of
  sixteen questions were already answered by work that had shipped (the Rounds citation wrap, the
  map rename, the HITECH numbers, and the RSS feed, which David settled by committing it), two more
  were the same question in different words, and one had only one live answer left and did not need
  him. Twelve real questions remain. The full accounting is in DECISIONS.md's own log.

## LOG

(The five lines from step 9 go here, then one line in the plan's section 11.)

2026-09-20 · phone QA script built and run: 19 of 19 green after two fixes (the Alarm Fatigue lunch overlay scroll; the table kit's join window). Verify 209, both live relay checks green.
