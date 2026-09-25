# DECISIONS

Everything waiting on David, in one place. Built 2026-09-19 because four design phases,
nineteen docs and a 20 KB CLAUDE.md had open questions scattered across all of them with
no single list.

---

## HOW THIS WORKS

Four rules, written to fix four specific failures.

1. **If it is not on this list, it is not waiting on you.** One file. Claude updates it at
   the end of every session. No open question lives only inside a chat message.

2. **Every question arrives with a recommendation.** "You pick" is always a valid answer
   and means Claude takes the recommendation and moves. You never have to generate an
   option from scratch.

3. **Three questions at a time, maximum.** If there are more, they wait in the table below
   until the first three are answered.

4. **Plain names, not file paths.** A question says what a thing is before it says where it
   lives. "The cost of living tool" comes before the filename, never instead of it.

5. **Questions are about what you want, never about how to build it.** If a question needs a
   technical term to ask, it is not your question: Claude decides, says what it decided in one
   plain sentence, and you veto by looking at the result. When a question is about how something
   looks or feels, it arrives with a picture of each option at phone and desktop width, or a
   way to try it, before you are asked to choose. (2026-09-20, your words: "the agent will ask
   me questions that I cannot understand or answer... I cannot make the tiny decisions.") Your reply "not my question", on anything, means Claude decides and says what it decided.

6. **Small change, then look.** Every task ends with something you can see: a screenshot at
   phone and desktop width in the chat, or a page to open on your phone. You never run a
   command to test. If you cannot see it, it is not done.

A fifth rule for Claude: no question goes on this list unless the answer changes what gets
built. Taste checks are not decisions. If Claude can pick a reasonable default and be wrong
cheaply, Claude picks and says so.

---

## NEEDS YOU

Ranked. The top three are the live ones; the rest wait their turn by rule 3.

**2026-09-21, second pass: David worked the list and four rows came off it.** 13 answered
(delete), 11 answered (kill it), 1 answered (alpha stands, optimization continues on the open
design phase), P answered (keep the plan). What is left is three he asked to have explained
(B, 4, 12), one he asked a question back about (10), and one he said he can do (6). Content
additions stay cancelled until the page over page review is done.

**2026-09-23, 10 answered: delete both.** David: "Delete the project and Verdant Thing. Those are not needed." Checked read-only first: `healthcareuncharted` (a09e2c0f) and `verdant-treacle-8c70aa` (9fdd2a68) have no custom domain, no aliases, no forms and no submissions; healthcareuncharted.com is served by `healthcare-uncharted` (12eaf952), which is untouched. The deletion itself is permanent, so it stays in David's hands: app.netlify.com, signed in as eitelmdavid@gmail.com, open each project, Project configuration, Danger zone, Delete project. Delete ONLY those two. The one WITH the hyphen, `healthcare-uncharted`, is the live site.

**2026-09-23, theme pass: no new questions.** Every call in it was a build call (which deeper
shade, which fix for a label on the hospital map's painted sky) and Claude made it; the screenshots
are the veto. Two defects it found run as their own tasks, not here.

| # | The question | Why it matters | Claude recommends | Open since |
|---|---|---|---|---|
| T1 | **Should the cost of living tool become the standard for every tool?** That means closing its design phase and writing its ten rules into DESIGN.md: answer first, explanations behind an "i", one fold, views, plain words, a source and date on every number, links that restore, the chart rules, little chrome, the phone as the shorter side. | You asked to take its lessons to the other tools. Until the rules are written down, nothing holds a tool to them and each rebuild argues from scratch. The full list with every tool measured against it is docs/HU-TOOL-REVIEW-2026-09-23.md. | Yes. What is left on the tool (about 546 words to sort) becomes ordinary maintenance under the written rules. | 2026-09-23 |
| T2 | **System Layers shows 113 numbers with no source.** Cut them, or have Claude hunt a source for each and cut what has none? | 301 "By the numbers" tiles; 188 name a source, 113 do not, and some read as invented ("8m 42s" average time, "98.2%" eligibility accuracy). The tool has no source line or date at all. | Cut them now. The 188 sourced tiles stay, and any that matter come back later with a source. | 2026-09-23 |
| T3 | **Which tool gets the cost of living treatment next?** Naming it opens its design phase. | Every tool not named stays under the change budget, so defects get fixed but nothing is redesigned. | The Vendor Directory (70 screens tall on a phone, the list starts below the first screen), then the Career Tree. | 2026-09-23 |
| G1 | **Uncharted Regional's staff strain never builds. Make it real?** | A playtest ran 28,571 quarters: strain peaked at 7 and no nurse ever quit, because it recovers 12 a quarter and can rise at most 9. So the strain warning never shows and the $45k a quarter Float Pool buys nothing. | Yes: strain recovers a little slower than the fastest it can build, so a hospital run flat out for a few quarters starts losing nurses and the Float Pool earns its price. | 2026-09-23 |
| 16 | WAITING (rule 3). **The rest of the clinical flags in the game review.** Alarm Fatigue's and three of Device Assembly's are ANSWERED (log, 2026-09-23). Left: Level 3's dry-gas line (Level 3 was rebuilt without it 2026-09-23, keeping the game's own dry side; log), the capnography connector and Level 2's title in Device Assembly; ED flow in ER Charge; the payer spread in both hospital games. Section 4 of docs/HU-GAME-REVIEW-2026-09-23.md. | They are RT and clinical calls a reviewer cannot make, and a respiratory audience will screenshot any that are wrong. | The dry-gas line first: the one piece of Level 3 still the game's guess. The payer spread is verified: RAND puts private plans at 254 percent of Medicare in 2022; the games use about 120. | 2026-09-23 |
| 17 | WAITING (rule 3). **The other four expansions.** Alarm Fatigue's is ANSWERED and BUILT 2026-09-24 (real or nuisance; play it before the push, log). Left: Device Assembly, the order changes mid-shift; Uncharted General, payer contract offers; ER Charge, triage at the door plus EMS calling ahead; Regional, a board that forgives one miss. docs/HU-GAME-EXPANSION-2026-09-23.md, with two alternatives for each. | An expansion changes a game's rules, so choosing one opens that game's design phase. | Yes to all four, each after that game's fixes. ER Charge waits until you choose to open it. | 2026-09-23 |

---

## PARKED ON PURPOSE

Not debt. You stopped these deliberately and they stay stopped until you say otherwise.
Listed so they stop reading like unfinished work.

- **The Learn and Rounds reading surface.** Parked 2026-08-24, your words: "complete
  rewrites and tooling in the future." Two rounds shipped and stand.
- **Where the AI skills live long term.** Deferred 2026-09-18, your words: "put them on the
  site for now, we can decide storage/growth at a later date."
- **Surveys and the backend.** Parked.
- **The hospital price finder.** Parked, living in the secret menu.
- **The Atlas phone browse flow.** Closed and reverted 2026-08-23 on your ruling. The hex
  grid is identity, pinch and zoom is the phone answer. Not reopening.

---

## CLAUDE HANDLES THESE

No decision needed. Listed so you can veto any of them.

- **Device Assembly round 2 part 2** (card backing behind parts, lighter tubing, larger
  joints, a phone magnifier). Recommendation: skip it. You called alpha. This is polish on
  polish and the surface has had fifteen rounds.
- **Vendor Directory QA.** Claude runs the auditor and brings you failures only.
- **The attending tier and the seven-role voice pass** on the career matrix. Claude drafts,
  you edit.
- **Article 06 on FHIR.** Drafted when you want it, not before.
- **HSTS preload.** Staying off. It is a one-way door with a slow exit and the site does not
  need it.

---

## LOG

- **2026-09-24** PRE-PUSH QA, GREEN (David: "I will do a commit after you do a full scan QA run and test"). npm run qa on a
  clean build: build, types and tests ok, the viewport sweep clean on all 51 pages at nine viewports (54 minutes); Tier 2 held
  after one fix (the Vital Stats description was 190 characters, now 145, so over-long descriptions sit at the ceiling of 30).
  verify 348/348. The phone playthrough 19/19. The real relay identical for the hospital game, Device Assembly and Vital
  Stats. Links: 476 checked, the one "dead" (oig.hhs.gov) was a local DNS miss and loads; 49 unsure are bot walls; the link
  check now also reads the Vital Stats question bank (65 of 66 ok, the NAPLEX PDF is a bot wall, opened in a browser).
  Left for later, not blocking: 11 links whose sources moved host still work through a redirect.

- **2026-09-24** FIRST VISITS MATCH THE PHONE'S LIGHT OR DARK SETTING, David: "yeah im down for that, think it would be neat."
  A choice made with the site's toggle still wins on every visit. With no choice made, the page takes the device's setting
  and follows it if the device switches while the page is open, until the visitor picks one. base.njk and Camp Nauvoo (the
  one page with its own head). The QA scripts are pinned to dark, the side they have always measured. Proof:
  tmp/theme-follow.js (13 cases), verify 348/348.

- **2026-09-24** BALLPARK IS NOW VITAL STATS, David: "Vital Stats is good, allows us to expand onto it with more data sets and
  other ideas, the core function is there and i like it." Renamed everywhere before its first push: the page and its address
  (/secret-menu/vital-stats/), the secret menu card, the question bank and its builder, the tests and the relay check. The
  log entries below keep the old name as it was when they were written.

- **2026-09-23** BALLPARK, THE NEW MULTIPLAYER GAME, BUILT on David's challenge ("make a new game that is
  multiplayer... turn based or phased base and everyone has to make a choice during that phase... healthcare
  related... name it whatever you like"). Every call in it was Claude's, stated here so David can veto by playing:
  THE NAME is Ballpark ("a ballpark figure"). THE GAME is Wits and Wagers' shape (guess, then bet on the guesses)
  because it is the one party format where a player who knows nothing can still win by reading the table, which
  suits a room of mixed roles. THE NUMBERS are real, each with its source and check date on the reveal. BOTS fill a
  table so one person can play alone. NO ACCOUNTS: a name and a four-letter code, the relay The Table already uses.
  Open for David, none blocking: whether the question bank should lean harder into RT and informatics numbers (it is
  mostly workforce, 67 of 208, then health 51, hospitals 37, money 29, coverage 24); the bank's wage questions read
  the BLS refresh that rides this same commit. The three explanation lines that came from general knowledge were
  checked live 2026-09-24 and carry their source in scripts/build-ballpark.js: the Amish settlement line (Young
  Center, true), the critical access line (true), and the rural emergency hospital line, which said Medicare created
  the designation in 2023 and now says it began in 2023 (Congress created it in 2021).

- **2026-09-24** BALLPARK'S THREE TWISTS, BUILT on David's yes ("lets do those 3 ideas"): the reveal strip, pay by
  state, home turf. Claude's calls, veto by playing: home turf's bonus goes to whoever guesses closest, locals or not
  (a visitor who beats the locals "took" it), rather than only to the locals; one turf round per home state, and two
  players from the same state share one; bots have no home; turf is on by default and the host can switch it off; a
  county question gets no strip (a county per state is not a state). The pay pull used 21 of the BLS public API's 25
  free requests for the day; it caches, so re-running it costs nothing until --refresh.

- **2026-09-24** BALLPARK STATE GAMES, BUILT on David's ask ("ask questions that are state by state, or select a list
  of states"). Claude's calls, veto by playing: "State by state" is a second choice beside The whole U.S., not a
  replacement, so the everyday game is unchanged; no states picked means every state; the quick picks are the Census
  Bureau's four regions (DC sits in the South, as the Census puts it); a state game never asks the same kind of
  question twice and spreads its rounds across the picked states; a pick too narrow to fill the rounds plays shorter
  instead of repeating. Workforce is thin per state (unemployment only), because the site has no state pay data yet;
  state RN and RT pay from BLS would fix that and is the obvious next pull. Claude's follow-up, no decision: the
  table kit cannot tell a guest when one of its moves was lost if the host broadcast anything else in the meantime.

- **2026-09-24** ALARM FATIGUE'S REAL OR NUISANCE ALARMS, BUILT on David's yes (row 17). Settle it by playing, not by
  reading: is a 3 second walk the right price for CHECK, and is 7 in 10 nuisance the right mix (both are one number
  each at the top of the alarm block)? Claude's calls, veto by playing: CHECK is the sat box itself, labelled, not a
  second button (a second 44 px button made every monitor row 33 px taller on a phone); a code after an alarm you
  silenced pays half and says the rest went to the safety report (before that, letting a real alarm fall paid 60
  times more than catching it); a nuisance nobody answers clears itself in 18 to 30 seconds. Known, not new: on a
  sideways phone about 95 px of the monitors shows above the task button (13 px less than before); the telemetry
  strip still flickers at random, so a real alarm can look like motion there for a moment.

- **2026-09-24** UNCHARTED GENERAL'S START SCREEN, no question needed (SPRINT item 15). Calls David can veto by
  playing: Continue is always a tab (a pasted save needs a home) but opens first only with a saved run; The Table
  opens first when hosting, a guest, or holding a table under 12 hours old; the CEO paragraph sits behind its "i" on
  the start card (the mid-run CEO swap keeps the full card); Start stays pinned at the card's foot, under the fold;
  Start names the scenario when one is picked; the subtitle line under the title is gone. An old quirk left alone:
  picking a scenario and unpicking it keeps that scenario's settings.

- **2026-09-24** ER CHARGE ON THE SHARED MENUS, no question needed (SPRINT item 15). Calls David can veto by
  playing: Restart deals a fresh shift at the same difficulty (the hospital games go back to their start menus);
  a first-time player starts on Normal from the how-to's Clock in without seeing the difficulty choice; after a tap
  on Clock in, focus stays off the board (moving it drew a ring that looked like a selection); the 120-word
  paragraph on the start card is unchanged because ER is in no design phase.

- **2026-09-23** UNCHARTED REGIONAL, STEP 5, no question needed (SPRINT item 15). Calls David can veto by playing:
  Esc on the start card or the payer table opens the game menu (neither card has a way back); Esc on a result card
  continues to the next quarter; with a saved term, Continue is the main button; a reload on a result card opens the
  next quarter (the result already counted); short of an access goal turns Region served amber, not red; the payer
  table's odds are colored gain green, loss red, as in the hospital game; the old "New here?" guide still opens on
  quarter one beside the new how-to card.

- **2026-09-23** DEVICE ASSEMBLY LEVEL 3, REBUILT without the dry-side answer (David said keep rolling; the question
  stays in row 16). The heated circuit side is sourced (Fisher & Paykel RT302); the flowmeter to chamber link is the
  game's existing one. Building it found the old Level 3 could not be finished at all.

- **2026-09-23** DEVICE ASSEMBLY'S THREE RT CALLS, ANSWERED on the recommendation. Level 3 (high flow): rebuild it the real way. Level 5 (bubble CPAP): hide it until there is an infant patient. Tutorial 3: the order becomes a simple mask at 2 L/min, and the player catches it. Built: Level 5 is parked (kept for the engine tests, out of every list a player sees, Capnography is now Level 5); Tutorial 3 reads "Order: oxygen by simple mask at 2 L/min... Read that order twice", both interfaces still answer it so the mask fails on its own spec (at least 5 L/min, or the patient rebreathes CO2) and the cannula passes, the RT's call to get the order changed. Level 3 is NOT rebuilt yet: Fisher & Paykel's RT302 kit (a heated MicroCell circuit, the MR290 chamber and Optiflow+) confirms the heated side, but no source found says how the gas gets from the high-flow flowmeter into the chamber, so that one detail went back to David instead of being guessed.

- **2026-09-23** UNCHARTED GENERAL, STEP 3 OF THE GAMES TRACK, no question needed (SPRINT item 15):
  the shared menus, the goal line beside Run ("Short by $308k", exact), a warning before a losing
  quarter, an upright phone's pinned Run bar, and Continue after a reload. Every call in it was a
  build call. The start screen's 46 controls are the next thing on this game, not done here.

- **2026-09-23** ALARM FATIGUE'S CLINICAL CALLS AND ITS EXPANSION, ANSWERED. David, all three on
  the recommendation: a DNR room gets a rapid response and never a code ("No code, rapid
  response"); the code drugs are arrest drugs only; the expansion is real or nuisance alarms,
  after the fixes. Built the same night (SPRINT item 15): the DNR card names the code status,
  adenosine and atropine are out. Magnesium for torsades stayed, because it is an arrest drug and
  the answer was "arrest drugs only", but the question listed only epi, amiodarone and lidocaine,
  so it is his to veto. The pronoun fix was not a question; it follows the nurse brain.

- **2026-09-23** 15 ANSWERED, 17 ADDED. David, on the review's recommended order: "ok that sounds
  like a good plan." Read as a yes to the order and to question 15, since step 2 of that order IS
  the shared menu rulebook. The shared menu pieces (a dialog, the game menu, settings with three
  assist switches, the how-to card, a named-verb confirm) are being built in the kit now, without
  touching the games, because another session is editing them. The ten rules go into
  .claude/rules/games.md once the pieces land, so the rule can name them. His follow-up: "keep in
  the theme of the games or their core ideas, but expand upon them. we want them to be fun an
  accessable." Answered with docs/HU-GAME-EXPANSION-2026-09-23.md: a one-sentence core idea per
  game, a five-point test every expansion must pass, the assist switches, and three options per
  game with one recommended (question 17).

- **2026-09-23** GAME REVIEW, all five games, on David's ask: "ok can you do a scan and review of
  all games give me an evaluation." Written to docs/HU-GAME-REVIEW-2026-09-23.md with a scorecard,
  a verdict per game, what the five share, the clinical reads (question 16) and a recommended
  order. Headline: the phone gate passes all five clean, and every game still loses a new player
  on a phone in a way the gate cannot see. Every game scores 2 on menus; sideways is the worst view
  in all five; no run survives a reload in any of them. Two ER Charge defects a reviewer reported
  (lost clicks, lost focus) did not reproduce on a re-run and were first called false. CORRECTED
  the same night: they were real, and the other session had fixed both in between (SPRINT item 14).
  Nothing in the games was changed by this review.

- **2026-09-23** GAME MENUS, on David's question: "For all of our games the menuing should not
  be hard to figure out and should follow what the best and highest rated and consumed apps do.
  what do we need to do for that goal to be achived?" Answered with docs/HU-GAME-MENUS-2026-09-23.md:
  what Apple's guidelines and the Game Accessibility Guidelines already require (checked live),
  one app to copy per menu job, the words to use in a draft prompt, a ten-rule contract, and all
  three games measured against it. The cause of the inconsistency is structural: no shared menu
  component, so each game built its own overlay and every rule has to be fixed three times.
  Four defects came out of the read and are Claude's to fix: Alarm Fatigue tells a phone that is
  already sideways to turn sideways, and that notice's "Clock in" button does not clock in;
  Device Assembly's results card ignores Esc; Uncharted General's start screen, Chart Room and
  end screen have no close control. None were touched, because another session was editing the
  games at the time. Nothing built. Question 15 waits behind T1 to T3.

- **2026-09-22** QUESTION 2 OVERTAKEN BY A REBUILD, not answered. It asked David to read the
  unread round 2 phone layout. He opened the tool instead and said: "its extreamly complex, hard
  to follow easiliy, the visuals are all over the place." So round 3 happened, and round 2's
  phone restructure went with it. The tool asked FOURTEEN questions before answering one; it now
  asks three. 342 words and 14 inputs at desktop down to 229 and 5. Full record in
  docs/HU-DESIGN-PHASE-LOG.md, round 3.
  The cause is worth carrying: round 2 HAD built the right thing, but the fine-tune fold shipped
  `open` and JS only closed it on phones, so desktop never received the redesign. A question
  asking David to read a layout he had already been given, that had never actually reached his
  screen.
  Numbeo's API was priced at his suggestion and declined: $260/month, no free tier, and sixty
  line items is the opposite of the compilation he asked for. The breakdown he admired already
  existed in the tool, buried under 604 words.

- **2026-09-21** 6 CLOSED, 10 PART DONE. **Rounds 04: "passes voice check for now."** Closed on
  David's read, which is the only read that closes a voice question on a first-person piece.
  **10, the Netlify projects:** the account was listed rather than assumed, and the picture was not
  the one the question described. THREE projects on the reachable account: `healthcare-uncharted`
  (12eaf952) holds healthcareuncharted.com and is production; `healthcareuncharted` (a09e2c0f)
  builds the same repo and same branch on every push with no domain and no aliases, which is the
  one to delete; `verdant-treacle-8c70aa` builds from NO repo and last published 2026-03-22, so it
  is not a duplicate of this site and was deliberately left alone pending David saying what it was.
  The fourth project is on his other Google account and is unreachable from here.
  Claude ran the delete and the sandbox refused it as an irreversible deletion. Not worked around.

- **2026-09-21** THREE MORE ANSWERED, AND 4 TURNED INTO A BUILD.
  **12, the career tree counters: RELABELLED.** ROLES HELD, CREDS HELD, SKILLS HELD, GOALS. The
  code confirmed the reading before the change: the three counters filter `nodeLayer === 'current'`
  and Goals counts `future`, so the numbers were always right and only the labels were silent.
  **B, the eight tool pages: CLOSED ON THE AUTOMATED READ**, his call. The merged band phase can
  now be written into DESIGN.md Tier 3. It was eight pages; the skill demo was one of them and was
  deleted the same hour, so it closes on seven.
  **4, the hidden Populations switch: NOT deleted.** David: "I want to wire it back up to
  something, maybe convert it to a learn article and link it to the atlas... who are the consumers
  or players in healthcare... for now, make a learn artcle with that page and its build/info and
  place it in the Secret Menu." Built: `/secret-menu/patient-journeys/`, "Patient Populations: The
  Twenty States Healthcare Serves". Three journeys (acuity 8, maternal 6, newborn 6), banded by
  tier, three Atlas deep links, and a closing section on where the content came from and how the
  page is built. It READS the nodes out of career-tree.json through a new `src/_data/patientJourneys.js`
  rather than copying them, so the article and the tool cannot drift; the data file counts the
  twenty and refuses to build a set that has changed shape. Clean at all eight viewports, verify
  green at 222. Still open on it and deliberately so: the writing has had no voice pass, the twenty
  states are not checked against a source, and the career tree's switch is still hidden.

- **2026-09-21** DAVID WORKED THE LIST. Four answered, two things deleted.
  **13, the AI tools page: DELETE, done.** Gone: `/tools/ai-skills/`, `/tools/skill-demo/`,
  `src/_data/skillsEcosystem.json`, the tools-hub card, the search row, the inbound card on the
  AI-in-healthcare article, and the thumbnail entry. docs/HU-PAGE-RECIPES.md had been naming both
  pages as the examples to copy a new page FROM, so it was repointed at the vendor directory and
  the SQL mystery; docs/HU-AI-SKILLS-LAUNCH-2026-09-18.md is now marked as a record of something
  removed. Verify green at 222.
  **11, Atlas Craft: KILLED, done.** His words: "Atlas Craft is cancled idea, kill it." Gone:
  `src/atlas/craft.njk` (519 KB, the whole graph was baked into the page), the launch link and its
  styles on the Atlas, and its three entries in the data map. `scripts/build-entities.js` STAYS:
  it also writes `search-graph.json`, which is the Atlas's own search, so it is not craft-only.
  **1, Device Assembly: "is in alpha but it still needs major optimization."** Read as alpha
  stands and the feel phase stays open rather than closing. Off the questions list, back onto the
  design phase where it belongs.
  **P, the three-month plan: "keep that."** Approved as written. Months 2 and 3 still get his
  markup as they arrive, which is what the row always said.

- **2026-09-21** A SWEEP OF EVERY DOCUMENT THAT STEERS FUTURE WORK, on David's question: "are there
  documents out there that conflict with the new goals or build designs that we are setting as
  standards?" There were, in two kinds.
  RULES THAT DISAGREED. The shorter-side phone rule set this week was written into `docs/`, which
  CLAUDE.md ranks BELOW its own file and below `.claude/rules/`. Five higher-ranked documents still
  said the opposite, two of them in the words "never another breakpoint", so the next session
  following the rules correctly would have rebuilt the bug. Realigned: CLAUDE.md, .claude/rules/css.md,
  .claude/rules/games.md, DESIGN.md, docs/HU-PAGE-RECIPES.md, docs/HU-HANDOFF-BRIEF.md,
  docs/HU-TOOL-SHELL.md, SPRINT.md, docs/HU-DEV-PLAN-2026-Q4.md, and the mobile-tester agent spec.
  The handoff brief, which is what an OUTSIDE session is given, also still listed unpkg as an allowed
  script source; it left the CSP on 2026-09-20, so a page built on that brief ships broken.
  FACTS THAT HAD GONE STALE. The quarter plan's headline finding #2 was "the multiplayer cannot
  connect"; it was restored the same day the plan was written, and the endpoint answers today.
  PRODUCT.md asserted the retired tool name as settled terminology and carried a job title two roles
  out of date. Worst of the set: docs/HU-AI-SKILLS-LAUNCH-2026-09-18.md describes, under "What
  shipped into the repo", a passthrough and a zip that would publish David's PRIVATE skills. None of
  it exists in the repo, which is correct, but the document says it shipped. It now opens with a
  warning not to rebuild it.
  One new question came out of it, 14, the colorblind theme, because PRODUCT.md recorded a design
  decision that no other file had any trace of. David answered it the moment he saw it ("forget the
  color blind theme"), so the row was withdrawn the same hour and the PRODUCT.md line is gone. Net
  new questions from the sweep: zero.

- **2026-09-21** THE AI TOOLS QUESTION IS NOW 13, NOT S. David: "what do you mean mine List s?"
  Fair. S had already been used for the multiplayer backend question, closed 2026-09-20, so the
  same letter pointed at two unrelated things and the reference was unreadable. Labels are not
  reused from here on, closed or not: the next question takes the next unused number.

- **2026-09-21** QUESTION H WITHDRAWN, and it should never have been asked. It claimed seven
  competing header designs and asked David to pick one. He pushed back: "is this harder than it
  needs to be for some reason? this feels like a dumb stumbling block." He was right. The
  question was built by photographing sixteen page-tops and counting differences WITHOUT
  reading why they exist. Reading the code instead: the hub pages drop the hamburger because
  they carry the bottom tab bar; the two MapLibre maps are excluded from the toolbar rollout by
  CLAUDE.md itself ("own chrome, twins rule"); the career tree hides its brand at 375px with a
  comment saying the row is full and the menu rides the thumb zone; the cost of living tool
  drops its kicker for a one-row toolbar on the atlas precedent; the games are full-screen
  surfaces. Three patterns and a set of reasoned exceptions, not chaos.
  Two things WERE broken and are fixed: the header changed when the phone rotated (a
  width-only breakpoint, so a 740px-wide landscape phone was served the desktop menu), and
  Camp Nauvoo's header wrapped to two lines inside a 56px bar.
  The lesson for the next session: a screenshot shows you WHAT differs, never whether it was
  meant to. Read the comment before you write the question.

- **2026-09-21** THE PHONE PASS, from David's own device. He read the site on his phone and sent
  twelve screenshots. The headline defect was real and had shipped: the 4Ps section nav was a 64px
  box holding 231px of links, so three of the four floated over the article text with no background
  behind them. Root cause was a bare `nav {}` rule in hu-global.css matching every <nav> on the site
  and forcing each one to the header's height, sticky and blur. It is now scoped to
  nav[aria-label="Primary"], the selector reading.js already used. The same trap had been patched
  locally once before, on the phone bottom bar.
  His instruction on the footer is done: the Field Notes signup and the Source Policy now appear on
  home and About only, and every other page carries a lean footer. A learn module's footer went from
  1756px to 385px.
  A new check went into the phone gate, for content spilling outside its own box, because every
  existing check read those pages CLEAN. It found six more pages with the same class of fault; all
  six are fixed and all 54 pages pass it. Also fixed on the way: the SQL mystery hid the "Your
  mission" line, the one sentence that says what to do, behind a 190px cap on a phone.

- **2026-09-21** QUESTION A DONE, not decided. The question offered a middle path, "do the three or
  four charts that carry an argument and leave the decorative ones wide." All nineteen were done
  instead, because the work turned out to be less about hand-drawing and more about finding the
  three shapes underneath: a PICTURE takes a second drawing; a CONTROL with room in its boxes keeps
  its drawing and takes bigger type; a CONTROL that cannot keep its shape takes a second drawing
  plus a one-line script change so both copies still respond. Once those were named the rest was
  repetition. Ten pages, and every public page on the site now passes the phone gate at 360.
  Two floors were added to the gate on the way, for line contrast and for label contrast, weight
  and tracking, so none of it can quietly come back.

- **2026-09-20** TWO MORE ALREADY-ANSWERED QUESTIONS CLOSED, same failure as the four before them.
  - **0a, the 4Ps pills under the touch floor.** hu-global.css already carries
    `@media (hover:none){ a.fp{ min-height:44px } }`, and it works: all 54 pills on the Learn hub
    measure exactly 44 on a touch viewport and the gate reports zero sub-44 targets there and on
    Rounds. The recommendation on the list said "accept for now"; somebody had already fixed it.
  - **0b, the cost of living scope badge cut off by 45px.** It reads in full at 360 now
    ("Housing: Zillow county rents · rest: state index", 292px inside a 294px box), and the gate
    reports zero clipping on that tool. Nothing was waiting on the round 2 read after all.
  A sweep of all 42 public pages replaced question B's stale claim with a measurement, and turned up
  the real backlog: 14 pages fail the phone gate at 360, four on chrome and ten on chart labels
  under the type floor. The ten are question A, and the per-page counts are now in SPRINT.md.

- **2026-09-20** QUESTIONS B AND 5 WERE THE SAME QUESTION, merged into B: both asked David to play
  the same eight tool pages, one to unblock six other surfaces and one to close the merged band's
  design phase. Its "open since" keeps 5's date, 2026-08-30, because that is when he was first asked.
- **2026-09-20** QUESTION 8 CLOSED, TAKEN UNDER RULE 5 (the row itself was left on the list by mistake for one session and removed once spotted). The footer promised "When something ships, you hear
  about it" to every person who signed up, and nothing can send to those addresses. The other option
  in the question, building sending, is off the table by his own call, so only one answer was live
  and it did not need him. The line now reads "Leave an address and you go on the list", which is
  what actually happens. His veto is reading it.

- **2026-09-20** FOUR QUESTIONS CLOSED BECAUSE THEY WERE ALREADY ANSWERED. Read back against the
  repo, not against the list. This is the failure the list exists to prevent, so it is worth naming:
  a question that stays after the work lands costs David the same attention as a real one, and he
  cannot tell which is which by looking.
  - **0, citations cut off on phones in Rounds.** Fixed and committed in `5452a02`: rounds.css
    keeps the nowrap on desktop and lets `.rounds-post .cite` wrap below 699. The comment above
    the rule records the 452px measurement that found it. Open 1 day.
  - **3, the map's name.** Renamed 2026-09-19 to U.S. Population Health Map, exactly the
    recommendation: the slug and the id stay, and the old names live on as search keys in
    tools.js so it still comes up. Open 21 days.
  - **7, the HITECH article's two EHR numbers.** Also exactly the recommendation, and already
    live: the hero keeps nine percent, and the body now names both surveys and says they drew
    different samples and agreed. Open 24 days.
  - **9, keep the RSS feed or revert it.** David answered it himself by committing `src/feed.njk`
    in `f7b37d7`. Open 0 days.

- **2026-09-20** QUESTION S RESOLVED, and Sprint 1 with it. The backend was PAUSED, not gone: a
  paused free project has no DNS at all, which is what made it look deleted. David restored it
  from the dashboard (same address, no repoint). Built and proven the same day: a keep-alive
  ping and the verify gate on GitHub, a test that the game and the CSP name the same host, a
  two-browser round trip through the live relay, host resume and guest rejoin after a reload
  (the audit showed a host reload used to kill the table), a join queue in the transport, the
  lobby through the phone gate, and David hosting from his phone with the laptop as guest.
  Verify green at 176. His push and the friend test ride into Sprint 2 as step 0. Sprint 2
  takes the plan question 2 by its recommendation under rule 5 (Device Assembly is the second
  game on the table kit); he can veto by looking.
- **2026-09-20** THE THREE-MONTH PLAN. David asked for a full analysis and a development plan
  (multiplayer games, content growth, infrastructure). Written to docs/HU-DEV-PLAN-2026-Q4.md as a
  DRAFT for his markup (question P). What the analysis measured: July 179 views, August 162,
  September 1 to 20 1,600, of which about 1,500 came in the week after one Reddit post about
  Alarm Fatigue (peak 532 on Sep 12); 56% of the trailing 90 days is reddit.com; the best single
  Learn page had 7 views and the best Rounds post 6; the game held 48% of its measured sessions
  past two minutes. The Supabase host the hospital game's Table points at NO LONGER RESOLVES
  (question S). Four of the five games have the engine shape multiplayer needs; Alarm Fatigue
  does not and has no tests. No CI, no scaffold, and the RSS feed carries 12 of 44 pages. The
  multiplayer market was researched (plan section 6): stay on Supabase this quarter, Cloudflare
  Durable Objects is the escape hatch, Hathora is dead and InstantDB is sunsetting. Nothing was
  built. A second session was editing this file the same day (rows A and B); its rows were left
  as found.
- **2026-09-20** THE COMFORT SCALE, THE GATE, AND ONE BAD HOUR. Shipped after David read the
  preview on his phone: seven type tokens, every phone step its desktop value plus 2, and
  about 1,900 font-size literals migrated onto them. Zero literals left in the 12 to 16px
  band. Zero overflow and zero clipping across 53 pages, which was the risk worth checking.
  `npm run phone` now also fails on SVG LABEL COLLISION, because the fix for small diagram
  text is bigger diagram text and the two pull against each other; a pinch-zoom scene is
  exempt. It found one real defect, a value label and a reference annotation overlapping 60%
  on the burnout post at EVERY size, desktop included. Fixed. Both figures on that post were
  redrawn as phone charts, which is the pattern for the remaining eighteen.
  THE BAD HOUR, recorded because the shape of it matters more than the bug: editing a CSS
  comment left a closer with no opener, the parser swallowed the whole
  `@media (max-width:699px)` token block as part of an invalid selector, and the comfort
  scale applied to NOTHING. It hid because the gate reads its floor from `--t-micro`, so the
  token falling back to its desktop 11px quietly lowered the gate to 11 and every page
  reported clean at a size the standard forbids. I reported it shipped and verified. It was
  not. Caught only by querying the token directly when a diagram measured 11.4px against a
  12px token. `tests/type-scale.test.js` now pins comment balance and the floors as literal
  numbers, proven by reintroducing the bug. A gate that reads its threshold from the thing it
  checks has to be told what that threshold may not be.

- **2026-09-20** THE TWO SURFACES. David: "it appears we are trying to squeeze the regular
  website onto a phone screen." Measured, and he was right. Across 20 pages at 360 and 1280,
  92 to 100 percent of text rendered at the IDENTICAL pixel size on both; controls matched
  only 20 to 40 percent, because tap targets had been patched to 44px one at a time over a
  year. The site had been made to FUNCTION on a phone and never once DESIGNED for one.
  The cause was structural: nine spacing tokens, a full color ladder, and ZERO size tokens.
  All 723 font sizes were literals, so there was nowhere a phone type decision could be made
  and none ever was. DESIGN.md's own 11px floor, adopted 2026-08-09, had been quietly
  violated 4,044 times, down to 2.5px, because it named a number with no token behind it and
  no gate in front of it. Fixed in four parts: the standard (DESIGN.md "The Two Surfaces",
  Tier 1, the Legibility Floor Rule, .claude/rules/css.md); the tokens (--t-body, --t-ui,
  --t-label, --t-micro, each with a desktop and a phone value); the gate (`npm run phone`
  now FAILS on text under the floor and on chrome over 15 percent, reading the floors from
  the tokens so the two cannot drift); and the start of the migration (hu-global.css, the
  vendor directory, the sources ledger). 163 tests pass. Still open: 2,033 sub-floor elements
  across 279 rules, and the two questions at the top of this file.
- **2026-09-20** PUSHED TO PROD AND VERIFIED LIVE. Checked against
  `healthcareuncharted.com`, not the local build, because this push changed the CSP, swapped
  where icons come from and bumped nine cache stamps, and any of those failing takes the icons
  off every page. The served CSP no longer lists unpkg. `hu-icons.js`, `hu-global.css`,
  `hu-kit.js` and `feed.xml` all resolve. Fourteen pages loaded headless at 360: every
  `data-lucide` placeholder replaced, zero console errors, zero CSP violations, no overflow,
  the support link present on all of them. Both maps boot at zoom 2.01 on a 360 phone and show
  the lower 48 coast to coast, which is the fix that had the race condition, so it was worth
  confirming on real hardware rather than trusting the unit test.
- **2026-09-20** FULL SITE SWEPT AND CORRECTED, on your instruction, secret menu excluded.
  All 44 public pages at 360 and 699: **zero console errors, zero horizontal overflow, zero
  clipped content.** Seven real layout defects fixed, the worst being the laws-and-paradoxes
  page scrolling sideways to 1305px at 360. Touch floor raised on ~30 control groups. Stale
  cache stamps on hu-global.css and hu-kit.js bumped, which would otherwise have served
  returning visitors old CSS and an old kit after deploy. What was deliberately left alone,
  with reasons, is in the sweep memory: the Vendor Directory state cartogram, the hospital
  blueprint's pinch-zoom surface, the carousel dots, the desktop-gated Atlas Craft controls,
  and citation links covered by WCAG's inline exception.
- **2026-09-20** MERGED BAND SWEPT, all eight pages, 360 and 699, with the repaired gate.
  Clean: no console errors, no overflow, no clipping beyond the known cost-of-living scope
  badge. Three touch-floor misses found and fixed in passing: the SQL Mystery schema toggles
  (seven full-width buttons at 36px), and the Vendor Directory sector arrows (30px), filter
  selects (32px) and search input (42px). All raised on touch only, desktop untouched.
  Deliberately left: the Vendor Directory state cartogram (51 squares at 28px, a design
  element, 44px would make the map enormous) and its 8px carousel dots (25 sectors times 44px
  would be an 1,100px row, and the arrows and swipe do the same job).
- **2026-09-20** ICON SUBSET. The full Lucide UMD loaded from unpkg on every page: 80 KB over
  the wire, 355 KB to parse, ~1,500 icons for the 96 this site uses, behind a third-party
  round trip. `scripts/build-icons.js` now generates a self-hosted subset (5.3 KB gzipped),
  and unpkg is out of the CSP. About 74 KB and 336 KB of parsing saved per page. Measurement
  also said NOT to touch images (they sit in fixed CSS boxes, so no layout shift) or font
  weights (they sit in fixed CSS boxes, and it is a variable font).
- **2026-09-20** FONT REQUEST TRIMMED, on David's approval. DM Sans was asking for an
  optical-size axis that costs 39% per file (23,100 vs 14,092 bytes) and buys 0.13px across 31
  characters at 15px, plus a weight 300 that nothing used. Both dropped; italic kept after
  checking ten pages and finding it genuinely used. Combined with the icon subset, pages are
  about 110 KB lighter over the wire: /learn/ 358 to 246 KB, /about/ 390 to 277 KB,
  vendor-directory 374 to 275 KB.
- **2026-09-20** THE EMAIL SIGNUP HAD NEVER WORKED. The Field Notes form in the footer went
  up 2026-07-07 (commit 9bc9e3d) and captured nothing for ten weeks. The markup was always
  correct; Netlify's site-level form detection was off (`ignore_html_forms: true`), so no form
  was ever registered and the POST was never intercepted. Nothing was collected and nothing
  was lost. Fixed by enabling form detection on the production project and redeploying, since
  forms register at DEPLOY time and the toggle alone does nothing. Verified end to end: form
  registered with both fields and the honeypot, a real browser submission stored, `/thanks/`
  served. David then stopped the sending work and turned the notification back off; the form
  keeps collecting either way.
- **2026-09-20** FOUR Netlify projects render this repo across TWO Google accounts, which is
  why an hour went into finding the right one. `healthcare-uncharted` (12eaf952) holds the
  domain; `www` CNAMEs to it and its ETag matches the live site. A private project on the
  other account serves an identical copy that 404s to the public, so it looks correct on
  screen and is not. The repo's `.netlify/state.json` pointed at a third, non-production
  project: repointed at production (gitignored, local only, old value in `state.json.bak`).
- **2026-09-20** RSS feed built at `/feed.xml` from `collections.featuredPages`, the same
  curated list the home page uses, so `featured: true` stays the one switch that publishes
  something. Adds `dateRFC822` to `.eleventy.js` and a discovery link to `base.njk`. Twelve
  items, parses clean, verify green at 157, phone clean at 360 and 699. UNCOMMITTED pending
  question 9.
- **2026-09-20** Automatic send-on-publish is paid at every provider checked: Kit $33/mo,
  Buttondown +$9/mo, MailerLite from $12/mo. Free tiers cover manual broadcasts only. Also
  worth recording: the CSP's `form-action 'self'` blocks posting the signup form directly to
  any mail provider, the same wall that ruled out the Ko-fi widget. Any future sending setup
  keeps the form on Netlify and moves addresses separately.
- **2026-09-19** CORRECTION: an earlier entry here said the hospital map clipped 27 items and
  recommended fixing it. That was wrong. `.hm-campus-col` is a `makePinchZoom` surface, the
  same phone answer ruled for the Atlas: a deliberately oversized scene inside an
  overflow-hidden frame, panned by a JS transform. Nothing is unreachable. The gate now
  recognises a driven transform and reports 0 there, while still catching the real clipping on
  Rounds.
- **2026-09-19** THE PHONE GATE WAS INERT. `scripts/phone-check.js` compared
  `document.documentElement.scrollWidth` against `window.innerWidth`, but with Playwright's
  `isMobile: true` Chromium grows the LAYOUT viewport to fit overflowing content, so
  `innerWidth` becomes the content width and the comparison compares a number to itself.
  Measured on a Rounds post: the context was set to 360 and `innerWidth` reported 499, exactly
  the width of the overflow. The overflow check could never fail. It now measures against the
  device width we asked for, and it also reports CLIPPED content, which is what
  `overflow-x: hidden` turns an overflow into. Serverless 404s are exempted, since Netlify
  functions cannot exist in a static harness.
- **2026-09-19** Support link LIVE at `https://ko-fi.com/healthcareuncharted`, verified in a
  browser before wiring (a bare curl there returns 403 from bot protection, which is not a
  missing page). Renders in the footer, on About, under Rounds posts and in the tool strip.
- **2026-09-19** Support link added, off until a Ko-fi URL is pasted into `_data/site.js`.
  A plain outbound link, never a widget: the CSP blocks third-party script, iframe, remote
  image and cross-origin form post, and loosening four directives for a tip jar is not a trade
  worth making.
- **2026-09-19** FIXED, no decision left: both U.S. maps forbade seeing the whole country
  on a phone. They shared a hardcoded desktop camera (`center:[-96.5,39.3] zoom:3.6
  minZoom:2.8`); at 360 px that showed 36% of the width of the lower 48, and the floor
  capped it at 63%, so no amount of pinching reached the country. Replaced with
  `HUKit.conusView()`, which fits the lower 48 to the real container. Desktop returns the
  shipped frame bit for bit; only viewports too narrow to hold the country change. Seven
  regression tests added, and they fail against the old camera at every phone width.
- **2026-09-19** File created. Thirteen open threads found scattered across CLAUDE.md, the
  design phase log, and four memory files. Sorted into the three lists above. Verify gate
  green at the time of writing: build clean, types clean, 149 of 149 tests passing.
