# SPRINT

The current piece of work, one goal, as numbered steps in the order they depend on each other.
The map for the quarter is docs/HU-DEV-PLAN-2026-Q4.md; this file is what is being done right
now. Read it after DECISIONS.md at the start of every session.

---

## START HERE · picking this back up

**WHERE THIS LANDED, 2026-09-22.** David's frame (below) held: no new content until the
foundation does. Two things got built under it.

**1. THE QA SYSTEM, three tiers by WHO DECIDES.** `npm run qa` is the one command.
   - TIER 1, machine decides: build, types, 225 tests, the nine-viewport sweep. Fails.
   - TIER 2, machine measures, the number only goes down: shell drift (145), over-long meta
     descriptions (30), duplicate titles (0), and per-tool first-screen density. Fails on a rise.
   - TIER 3, David decides: look, feel, whether a stranger can use it. No script gets a vote.
     `npm run review` and docs/HU-REVIEW-QA-2026-09-22.md are how it reaches him.
   New instruments: `scripts/qa.js`, `scripts/density.js` (words, controls, inputs and chrome
   above the fold), `scripts/tool-compare.js`, `scripts/meta-screen.js`, `scripts/review.js` (the
   two-pane review screen, plus two mirrored browser tabs). 1920x1080 joined the viewport ladder
   because David reviews at 2132 and nothing had ever checked above 1280; it found nothing, which
   is the useful answer. The sweep also fails on HIDDEN BUT SHOWN (an element marked hidden that
   a display rule keeps on screen); it found four site-wide, and one global rule in hu-global.css
   cleared all four. Sweep a POPULATED url for any blank-start tool, or it tests an empty page.

**2. THE COST OF LIVING TOOL, round 3**, run as the trial for tool-layer QA. It asked FOURTEEN
   questions before answering one; it asks three. 342 words and 14 inputs at desktop down to 229
   and 5. Full record in docs/HU-DESIGN-PHASE-LOG.md round 3. Highlights a session needs: pay now
   sits with each place (which deleted the Same-pay toggle); hours are PER YEAR, which corrected
   arithmetic that paid travelers for 52 weeks they do not work; the seven budget lines prefill
   from county rent and state cost indexes; `HUKit.peek` is finally wired on a tool.

**THE HONEST GAP, unchanged.** Nothing measures whether a page is UNDERSTOOD. Density measures
weight. The proxies (inputs before a first answer, words on the first screen) are good targets and
bad proof. The only instrument for comprehension is a person who has not seen it.

**2026-09-23, THE TOOL REVIEW** (docs/HU-TOOL-REVIEW-2026-09-23.md): all eight tools measured
against the ten rules the cost of living tool now sets. Only that tool uses the "i" badge or the
site fold. Ten defects are Claude's to fix, and the gate missed four of them.

**2026-09-23, THE PRE-PUSH CHECK** (David: "QA and check all information on site and we will do a
commit and push"). The full `npm run qa`, plus four information checks that no gate runs:
- Counts agree with their data everywhere they are printed: 5,366 hospitals, 158 vendors, 62
  metrics in seven lens groups.
- The search index (23,000+ page references), the sitemap and the feed name no missing page.
- OUTBOUND LINKS: 455 checked, 17 looked dead. Eleven were fixed:
  - Nine now point to the source's new address (AMA twice, ECRI, ACGME, CCHP, NRHA, NCSL, CAAHEP,
    AHA).
  - Two point to a web-archive copy marked "(archived copy)", because the original is gone: the
    2015 FDA testosterone notice and the Lorna Breen foundation page.
  - Six were left alone. They work in a browser or block robots: ACEND twice (a login
    handshake), medicaid.gov twice, oig.hhs.gov and coalitionforhealthai.org.
- Three deleted pages had no redirect and would have gone 404 on the push: the AI Skills page,
  the skill demo and Atlas Craft. They now 301 to /tools/ and /atlas/ (netlify.toml).
- The gate itself: the sweep outgrew the 30 minutes `npm run qa` allowed it and reported FAIL
  after being killed mid-page with nothing found. The limit is now 60 minutes. The sweep should
  get faster before it gets longer, by running pages in parallel. The goat tracker failed on
  GoatCounter's rate limit (429), so the harness now refuses calls to its live API.
- `scripts/build-datamap.js` was broken by the Atlas Craft removal (half an entry left behind).
  It is repaired, and the Data Observatory's map was regenerated without the dead node.
- RESULT: 49 of 50 pages clean at all nine viewports, and verify at 225/225. The one red page is
  follow-up 10.

### AFTER THE 2026-09-23 COMMIT AND PUSH, in order

1. **Confirm the deploy. DONE 2026-09-23.** Production is `ready` on 47c0781 ("Major update
   again"). /tools/cost-of-living/ serves 200; /tools/assignment-compass/, /tools/ai-skills/,
   /tools/skill-demo/ and /atlas/craft/ all 301 to the right place; the new source links are
   live on /learn/sources/.
2. **Netlify cleanup (David's hands).** Delete `healthcareuncharted` (a09e2c0f) and
   `verdant-treacle-8c70aa`. The one WITH the hyphen is live. Until both are gone, every push
   builds three times. Steps are in DECISIONS.md.
3. **Tool review batch 1 (Claude, no input).** The ten defects in section 3 of the review, plus
   three new sweep checks:
   - FLOATING OVER A CONTROL
   - CUT BY ITS CONTAINER
   - a SLOW-DATA pass that holds data files back two seconds
   The worst defects: the Career Tree's phone error when its data is slow, the Blueprint panel
   covering the building, and the "Pati…" metric name.
   **DONE 2026-09-23, nine of ten, the tenth narrowed.** The three checks are in `npm run phone`,
   each proven to fail on the unfixed pages and on a planted test page first. The Career Tree no
   longer errors on slow data, the Blueprint opens on the hospital, the metric name reads in full,
   and the other six are fixed. The tool bars that wrap (defect 7): SQL Mystery's no longer stays
   pinned; fitting either on one row is the tool-chrome shell's call (item 9).
   The new checks also found faults the review had not: text cut at tablet widths on
   System Layers and the population map (Rankings was off screen at 700), the oxygen-cuts chart's
   percentages, the laws page's eras grid, the Sources search (26px wide on a phone), and three
   search placeholders cut mid-word. All fixed. Full sweep: 48 of 49 pages clean, the one red page
   is item 10. Shots in tmp/tool-review-batch1/.
4. **DECISIONS T1 to T3 (David).**
   - Make the ten rules the standard (DESIGN.md Tier 3).
   - Cut System Layers' 113 unsourced numbers.
   - Name the next tool. Recommended: Vendor Directory, then Career Tree.
5. **A standing link check (Claude).** Turn the one-off outbound check into
   `scripts/link-check.js`. Run it monthly, NOT in the gate, because outside sites fail for
   reasons that are not ours. Open the six unverifiable links once in a real browser.
   **DONE 2026-09-23.** `npm run links` (build first). First run: 456 links, 0 dead, 49 unsure
   (publisher and congress.gov bot walls, LinkedIn), 11 moved to a new host. The browser check
   overturned half of the old "works in a browser" list: both medicaid.gov links were really gone
   and the CHAI coalition had moved to chai.org, so all three now point at the live pages. The
   two ACEND links do work in a browser and are marked as such. Next run: late October.
6. **Theme-pass spin-offs: THEY DID NOT SHIP (checked 2026-09-23 after the push).** Each task ran
   three times in its own worktree under .claude/worktrees/, and none was committed or brought
   back to main:
   - The Atlas phone search bar: `fervent-lehmann` and `elated-jepsen`.
   - The timeline keyboard: `zen-mendel` is the fullest; `lucid-dubinsky` and `magical-lalande`
     are partial.
   - A third fix found along the way, the sheet X painting under the grabber so a tap resizes
     instead of closing (Atlas, Cost of Living, Device Assembly), with a regression test:
     `elated-torvalds`.
   All six are based on 3f41307. Their data-build and derived JSON changes are rebuild noise.
   **DONE 2026-09-23, in main, uncommitted.** On the Atlas the search sits inside the map and
   no longer covers the breadcrumb, the breadcrumb gets its own row from 700 to 1099, and the
   sheet X takes the tap (the fix is in hu-global.css, so Cost of Living and Device Assembly get
   it too). On the timeline the rail rows are buttons: Tab, Enter and Previous/Next all work.
   Verify 226/226, phone gate clean on all three pages. Worktrees removed and their diffs kept in
   tmp/worktree-patches/. The six claude/* branches are still there because deleting them was
   refused by the permission prompt. They only point at 3f41307, so they are harmless.
   Later the same day: the six side sessions were archived on David's yes, which released the
   folders, and the six empty folders are gone. The branch names stay until David deletes them
   (GitHub Desktop, Branch menu); they carry nothing.
7. **Information freshness, one line each:**
   - Career Tree pay is BLS wage year May 2024; check for a newer edition.
   - The Vendor Directory needs a "status checked" date (its data was compiled 2026-08-10).
   - The Operations map's source line says "current" where it should give a date.
   - The Hospital Blueprint has no source line at all.
   **DONE 2026-09-23, except the re-pull.** The Vendor Directory says "vendor statuses compiled
   Aug 10, 2026"; the Operations map says "pulled June 2026"; the Blueprint now says it is a
   composite hospital whose numbers are illustrations, not cited data. BLS HAS a newer edition,
   checked live 2026-09-23: May 2025 wages came out 2026-05-15, and the respiratory therapist page
   reads $82,280 where the Career Tree still shows the May 2024 $80,450. Re-pulling the tree's
   pay is open.
   **Re-pull DONE 2026-09-23.** The Handbook was already on its 2025-35 edition, so all 49
   occupations moved together: pay, the 10th to 90th range, growth and openings. A new fetcher,
   `npm run pull:ooh` (scripts/pull/ooh.js, dry run by default, `pull:all` picks it up), reads
   each Handbook page and the Employment Projections table and cross-checks every median against
   it; next September it is one command. What changed that a reader would notice: respiratory
   therapists $82,280 and growth 12% to 9% (the new projection, confirmed on the page);
   physicians $275,930, an exact median now instead of "$239,200+"; health specialties teachers
   $147,570 to $107,310 (the old figure was not the median; the table's is); a pay range now
   shows on 46 of 49 occupations (was 14) and openings on all 49 (was 5). The two roles whose number comes
   from the table (health specialties teachers, clinical and counseling psychologists) and
   ophthalmic technicians (their wage page is gone) link to the table. Source line, Sources
   entry and the growth legend say 2025. Verify 229/229, Career Tree clean at nine viewports.
8. **Cost of living, what is left.** The ~546 words (explanation behind an "i", warnings David
   rules on one by one, live output that stays), and the From side's "Rate there" label.
9. **The tool-chrome shell.** Five pages hand-roll a bar that two share, and a tool's name
   renders at 14, 15 or 17px on a phone depending on the tool.
10. **Device Assembly on a portrait phone (David's call).** 28 labels drawn on the game art (HR,
    SpO2, SHARPS, GLOVES, and the wall screen's "HINT 1/4") render at 2.5 to 3.7px at 360 and 430,
    so the sweep fails the page. Nothing in this batch caused it: the page's only changes were a
    light-theme colour and the sideways-phone query, and neither applies to a portrait phone. David
    waived the design floors on this surface ("go wild"), but the wall screen is text meant to be
    read. It belongs with his pending phone play at 360. Either the game gets a phone layout, or
    the art is marked as a magnifiable scene so the gate exempts it on his ruling.
    **DONE 2026-09-23 on David's pick from three mockups at 360: "B, copy under the wall."** Where
    the bedside screen is under 150px on the glass (an upright phone), its words read out directly
    under the wall as real text with 44px tabs (Order, Hint, Alerts, Test, Note), one fixed height
    so the screen turning pages never moves Complete, and the floating toast goes quiet because the
    readout carries it. Sideways phones and desktop are unchanged. The wall svg is marked
    `data-drawing`: the phone gate now skips the type, stroke and ink floors for text and lines
    printed on it (his "go wild" waiver on this surface) and prints the count on every phone line.
    Device Assembly is clean at all nine viewports; 51/51 of its tests, verify 229/229.
    Follow-up the same evening (David: "the double chart seems unneeded"): where the readout
    shows, the wall stops drawing the screen, so an upright phone has one copy, not two.
13. **Device Assembly, the patient who moves. DONE 2026-09-23** (David: "can we make it so his
    body can move around the wall like anything else? that functionality will matter when we start
    making complex semi mazes"). His calls: the level places him and the sandbox lets you drag him;
    one row lower after the tutorials with longer tubing. Built: the patient is his three pieces, a
    level names his spot, the sandbox drags him with his cannula; the body is four columns of
    shoulders instead of a wall of blanket; Level 1 on sit a row lower with the real 14 ft cannula
    (Salter 1600-14, checked today); Level 2 and the sandbox keep the old spot because their masks
    only come with 7 ft tubing. Six pars re-derived. 5 new tests, verify 234/234, phone gate clean.
    Record: docs/HU-DESIGN-PHASE-LOG.md, Round 17. The mazes themselves are not built.
14. **The other games, bug pass. DONE 2026-09-23** (David: "play them and find the bugs or confirm
    what strange stuff i was seeing"). Three read-only hunters played and fuzzed Alarm Fatigue,
    Uncharted Regional and ER Charge; Claude hunted the NaN in Uncharted General. THE NaN: not
    reproduced. 36 full browser games of the hospital game with every slider (custom start, pay,
    overhead) at random and extreme values, all four ownerships, tooltips and bar widths scanned:
    zero. Regional has no sliders; ER's only NaN path needs hand-edited browser storage (now
    guarded). If David sees it again, a screenshot or the save string pins it.
    Fixed in Uncharted Regional: "Look at the region" was a dead end (a Why-it-ended button now);
    adding a line charged twice on a second tap (the menu closes); access goals lost at the number
    they asked for (judged at the rounding shown); a spend goal lost to a red net said only spend;
    hints outlived their quarter and their term; bad stored settings broke the start menu; the
    Copied label lied on failure; a restored Suburban Boom did nothing; phone targets to 44px;
    pop-ups are keyboard dialogs (the hospital game's focus helper, ported).
    Fixed in ER Charge: desktop clicks were swallowed by the five-a-second redraw (the board holds
    still under a press); keyboard focus survives the redraw; STAT Labs, Priority CT, Fast Track
    and Rapid Response refuse a patient they cannot help and speed a step already underway, and
    Rapid Response's text no longer promises a wait that stops hurting; a patient who walked out
    stays selected no more; the phone card tip stays on screen; "critical patients handled" counts
    criticals that reached a bed; head counts lost their "+"; a queue-free shift says so; bad stored
    settings fall back. tests/games-cleanup.test.js (5). Open for David: Regional's strain never
    builds (a balance call, see DECISIONS or the chat).
    Fixed in Alarm Fatigue (the public game, 14 from its hunter): on phones the family and Joint
    Commission cards covered the big button (a centre tap hit a card 89 of 90 times); they now sit
    above it, grow upward and follow the button as the monitor bank fills. The 360 monitor tile
    shows the whole heart rate; the 1800 report stops asking about beds reading "--" and pumps
    mid-fault; the lunch and clock-out screens clear the top bar and open at the top; the Code
    Blue box and the chat window scroll on a sideways phone; no Code Blue fires during lunch;
    Restart asks before wiping a big shift; the free-tech card leaves when a tech is bought and no
    longer blocks break reminders; Biomed puts the bag name back; "Need 0 more" rounds up;
    lunch cannot be bought mid-report; overtime after 1800 no longer raises the lunch price or
    awards the after-lunch badge; the IT badge waits for the close; the sideways card's Clock in
    clocks in; the test hook window.__af now needs __UG_TEST (games.md), and scripts/phone-qa.js
    sets it. Left alone on purpose: the med-due sheet over the button (a deliberate bottom sheet),
    and the lunch line "by 1300 your ears" at an early lunch (copy, David's).
11. **Script type warnings.** `npm run check:scripts` (not part of the gate) reports about 113
    type errors across 11 scripts, most in the backend checkers and phone-qa.js. None came from
    this batch. Either make it green and add it to verify, or delete the command.
    **DONE 2026-09-23: made green and added to `npm run verify`.** It had grown to 132, and none
    was a real bug: 96 were the games' test hooks (declared once in types/test-hooks.d.ts), the
    rest type notes in 12 scripts. The call: keep it, because the phone sweep it covers grows
    every week.
12. **The hospital game bug pass. DONE 2026-09-23, David's ask ("go back to the uncharted
    General game and fix some of the issues and bugs").** Found by a seeded fuzz (650+ quarters
    through the real verbs), a scripted walk of a run at 360 and 1280, fifteen forced rare
    screens, and a keyboard-only playthrough. The fuzz found no crash, no NaN and no broken text.
    What was wrong, all fixed in src/secret-menu/uncharted-general/index.html:
    - The Start bar on the start menu stuck 30px above the menu's bottom edge, so the name box
      showed through underneath it.
    - Spend the first quarter's cash before building and every build card greyed out while the
      hint still said "Build". The hint and the build menu now name the gap and the way back
      (a unit's Undo, or Borrow).
    - The staffing steppers (RN, Tech, physicians, travelers) were 25 and 28px on a phone and the
      pay sliders 16px tall: 44px now, phone only. The steppers and sliders had no accessible names.
    - A seat's hire or expand named its unit by list position, so a closure landing first sent it
      to the wrong unit or crashed the host. Unit verbs carry the unit id now; a stale draft pick
      is dropped instead of thrown.
    - No pop-up handled a keyboard: focus stayed behind it, and every hire redraw threw focus to
      the top of the page. Now a pop-up is a real dialog (focus in, Tab stays in, Escape is Cancel,
      focus back to the opener) and a redrawn board keeps focus on the same control.
    - "eat a 8-point reputation hit" reads "an 8-point".
    Proof: tests/uncharted-general-guards.test.js (3 new), `npm test` 229/229, tsc clean, the phone
    gate clean at all nine viewports. Balance was not touched. The fuzz script and the Playwright
    walks are one-offs in tmp/ug-bugs/, not gates.
15. **The games track, 2026-09-23 (David: "what are our next steps", on the review's order).**
    The order: (1) Alarm Fatigue's fixes and (2) the shared menus into it; (3) Uncharted General,
    menus plus a sticky Run bar, a "short by" line and Continue; (4) Device Assembly, sideways,
    Tutorial 1, the hint wording, the fault titles; (5) Regional, a warning before a missed goal;
    (6) the expansions, one game at a time. Docs: docs/HU-GAME-REVIEW-2026-09-23.md,
    docs/HU-GAME-MENUS-2026-09-23.md, docs/HU-GAME-EXPANSION-2026-09-23.md.
    **Steps 1 and 2 DONE 2026-09-23.** Alarm Fatigue loads the kit (hu-kit.js?v=20260923, its own
    stamp because the other pages pin a kit without the menu pieces) and uses all of them: the
    "?" and Menu in the bar (Restart, Learn and the site menu are rows now), the how-to card on a
    first visit with Clock in (it replaced the "turn sideways" notice, whose rotate tip now shows
    on an upright phone only), Settings with More time (the code clock 30 to 45 s), Show sounds as
    text (every sound that carries news, named as in the mixer) and Hints, plus a Sound mix row to
    the eleven sliders. Any card pauses the floor: live() and six loops read away(), tones stop,
    the audio context parks. On David's answers: a DNR room gets a rapid response and never a
    code, and the card names the code status; adenosine and atropine left the code drugs
    (magnesium for torsades stays, flagged to him). The code text takes the patient's pronoun from
    the nurse brain. The first falling sat of a shift says the rule once (Hints). A phone clock
    rides beside the task count. Below 380px the "?" yields so the bar stays one row with Silence
    keeping its word (Help is the menu's second row). Also: "1 task clicked", the lunch shake
    under reduced motion.
    Proof: a Playwright walk at 360, 740x360 and 1280 (tmp/af-kit/check.js, result.json, shots),
    the phone gate clean at nine viewports, verify 267/267. Still open on this game: a Continue
    after reload needs the engine to hold its state in one object first; the rapid response card's
    body can disagree with its question (a comfortable 94% or a post-op patient under Room 5's
    "working to breathe"), content
    for David; NSVT still clips at 1280; the med card still takes focus.
    **Step 3 DONE 2026-09-23 (David: "lets keep rolling").** Uncharted General on the kit
    (hu-kit.js?v=20260923): the "?" and Menu beside the back link (Resume, Help, Restart as "Start
    a new run?", Leave, Site menu; no Settings row, nothing to slow or caption in a turn-based
    silent game); the how-to waits for the first board, not the start screen. THE GOAL LINE beside
    Run, the goal's own test on the projection (the same call runQuarter makes, so it is exact):
    "Short by $308k", "On track: 1,369 of 1,185 patients", red when cash ends below zero. Run on a
    projected miss or a red quarter asks first ("Run it anyway"). An upright phone puts the map
    under the goal and pins Run with the goal line to the bottom (chrome 18% at 360, budget 20);
    a sideways phone keeps the old order, since a pinned bar would take ~30%. CONTINUE: a solo run
    autosaves its save string after every render, the start screen opens with "Continue your run ·
    Year 1, Quarter 2 · Dr. Vega, MD", a finished run is forgotten the moment it ends (or Continue
    would undo a loss), Restart forgets it, a table is left to the kit. Also: Esc leaves the Chart
    Room, choice effects in their own colors (a morale hit was green), "Cash after" red below zero,
    reduced motion (burn pulse, carousel, the hint scroll), and the bankruptcy post-mortem names a
    crisis that took most of the loss instead of blaming staffing. On a phone the back link reads
    "← Secret Menu", as Device Assembly's does. Proof: tmp/ug-kit/check.js at 360, 740x360 and
    1280 (start, build, Q1, the goal line, a forced miss, the warning, Menu, reload, Continue,
    Restart), zero console errors, the phone gate clean at nine viewports. Not done: the start
    screen is still the 46-control form (the Balatro tabs from the menus doc, section 3.4), the
    solver's staffing-only loop, the payer spread (DECISIONS 16).
    **Step 4 DONE 2026-09-23, except Level 3.** Device Assembly on the kit: Walls (the button said Levels, the page
    WALLS), the "?" and Menu (Resume, Help, Settings with More time, "Reset this wall?", Leave, Site menu; the Secret
    Menu link and the site menu moved into it; the "?" yields under 380px, as on Alarm Fatigue). The result card closes
    on Esc and the phone back gesture (the keydown handler used to return early while it was up), traps Tab, and Esc
    with nothing to step back opens the menu. Reset can be undone. A reload resumes the last wall (progress dropped
    'last' on load). Undo keeps the tubing's name. The blender's drag ghost no longer draws rotate(NaN). Touch is told to
    tap and use the dock. Tutorials rest on the HINT page. A sideways phone fits the wall to the screen's height (290 of
    360: the rail, the outlets and the patient together). Tutorial 1 puts the cannula on the nose first (step one used to
    walk the player into TOO SHORT) and loses the spare tubing that did nothing. Every "test it / submit it" says press
    Complete. The fault walls are titled by their orders, not their answers. David's calls: Level 5 parked, Tutorial 3's
    order rewritten (DECISIONS log). The phone gate learned that an open modal card is not chrome (the first-visit how-to
    is bar-shaped on a phone and read as 35%). Proof: tmp/da-kit/, the three changed games clean at nine viewports, verify
    267/267. LEVEL 3 WAITS on one answer from David: what carries the gas from the high-flow flowmeter into the chamber.
    **Level 3 DONE 2026-09-23 (David: "keep rolling", no answer on the dry side, so the game's own dry side stands).**
    A heated breathing circuit joined the part database ("Heated breathing circuit", 22 mm, its source note is Fisher &
    Paykel's RT302 kit page); the rule that a humidified high-flow circuit must be the heated one, with a rain-out line
    when it is not; the cart carries it; par re-set. Building it found Level 3 could not be finished before, whatever
    the player did. Only the dry side (flowmeter to chamber) is still the game's guess, and it stays in DECISIONS 16.
    Proof: the Device Assembly tests 74/74.
    **Step 5 DONE 2026-09-23.** Uncharted Regional on the kit: the "?" and Menu (Resume, Help, "Start a new term?",
    Leave, Site menu), the how-to after the first board, every `data-def` through HUKit.peek. The goal line beside Run
    in the goal's own words ("Short by 12 points", "Over the cap by $75k", "In the red by $X") and "Run it anyway"
    before a projected miss. Each goal type's own loss line. An upright phone pins Run and the goal line (18% at 360).
    Continue after a reload, forgotten when a term ends. A restore no longer re-rolls the goal or the event (a reload
    was a free do-over). Esc on the result and end cards, an "i" beside each shared service, served % colored against
    the goal, focus kept after a change. Balance and G1 untouched. Proof: tests/uncharted-regional-kit.test.js (10),
    tmp/regional-kit/ (74 checks at three sizes), the phone gate clean at nine viewports. Owner vetoes listed in the
    DECISIONS log.
    **ER Charge on the kit DONE 2026-09-24 (menus contract, maintenance; its first minute and balance untouched, no
    phase).** It never loaded the kit before. The "?" and Menu (Resume, Help, Settings, "Restart the shift?", Leave,
    Site menu), any open card holds the shift clock, More time runs it at two thirds, the how-to opens on a first
    visit in place of the start card. Pause stays a plain toggle (a paused board can still be scrolled and read on a
    phone, a card over it cannot); Resume clears it. Defects: the critical and target pulses hold under reduced
    motion, "1 batched step", the start and end cards are real dialogs (focus in, Tab kept, Esc to the menu). The
    STAT Labs tooltip was already fixed. The kit's how-to opened scrolled to its action on a sideways phone, rules
    1 and 2 out of sight, in every game; fixed in hu-kit.js (the card's body starts at the top, the action keeps
    focus). Proof: tests/er-charge-kit.test.js (10), tmp/er-kit/walk.js 82/82 at three sizes, the phone gate clean
    at nine viewports.
    **Uncharted General's start screen DONE 2026-09-24 (the "next piece" from step 3; reading-load phase).** The
    46-control form is a four-tab card: Continue, New run, Scenarios, The Table (a real tab strip, arrow keys, 44 px).
    New run opens on the CEO carousel and one Start; difficulty, ownership, size and length fold under "Change the
    run", which reads back "Normal · Nonprofit · Community · Endless" when closed. Continue opens first when a solo run
    is saved, with the restore box under it. The Table opens first for a host, a guest or a table to resume. First
    paint at 360: 48 words and a card 4.2 screens tall, to 38 words on one screen; a returning player 57 words to 20.
    Start names the scenario when one is picked. Locked ownerships say how to earn them on tap, not only on hover.
    scripts/phone-qa.js taught to open the table tab. Proof: tests/uncharted-general-start.test.js (8), all 60 of
    the game's tests, tmp/ug-start/ (68 checks at three sizes), the phone gate clean at nine viewports.
17. **Alarm Fatigue, real or nuisance, 2026-09-24 (David's approved expansion, DECISIONS 17).** BUILT, not yet
    played by David; it changes the central mechanic of the site's one public game. Each pulse ox alarm is drawn real
    or nuisance, about 7 in 10 nuisance (Sendelbach and Funk 2013: 72 to 99 percent of clinical alarms are false),
    weighted by the brain sheet (Room 22's pneumonia on 3L runs real 55%, Room 8's wanderer mostly motion; Room 7's
    secret untouched). The clue is on the tile: a real one slides a point a tick with a full signal bar; motion
    bounces with an amber flickering bar (and a jittering strip with tele); a probe off drops off a cliff with an
    empty bar. SILENCE (the button) ends a nuisance and only mutes a real one, which keeps falling and codes at 80
    ("You silenced it at 89. It kept falling."). CHECK (the sat box) is a 3 second walk: the task button reads "In
    Room 4" and earns nothing; a real catch pays 4x, a nuisance 1x with a reason. Unanswered nuisances clear in 18 to
    30 s. The end report counts real alarms caught and silenced; the how-to teaches the two verbs; the first real and
    the first nuisance each get a one-line hint with the action. A code after a SILENCED real alarm pays half, the
    other half "went to the safety report", because a code paid 60 times a catch and letting a real one fall was the
    best play. Proof: tests/alarm-fatigue-alarms.test.js (18, the alarm logic in its own block), tmp/af-real/walk.js
    at three sizes, scripts/phone-qa.js 19/19, the phone gate clean at nine viewports.
    **The whole list, 2026-09-24:** `npm run verify` 339/339; the phone gate clean at nine viewports on all seven
    changed pages; phone-qa.js 19/19 (it had gone stale on three counts: the how-to cards, the table tab, the
    article's reading-shell heading); the real relay checked for Ballpark, Device Assembly and Uncharted General.
16. **Vital Stats (built as Ballpark; renamed 2026-09-24, David: "Vital Stats is good, allows us to expand onto it with more data sets"), the multiplayer game, 2026-09-23 (David: "i want you to make a new game that is multiplayer... turn
    based or phased base and everyone has to make a choice during that phase... healthcare related... place it in the
    secret menu").** BUILT and play-test ready at /secret-menu/vital-stats/. A party game in the Wits and Wagers mold: a
    real number from American healthcare, everyone guesses at once, then everyone bets two chips on whose guess is
    closest without going over (long shots pay up to 5 to 1, the low slot 6), the answer arrives with its source and
    check date, most chips after 5, 7 or 10 rounds wins, and the last round allows all in. 2 to 8 players; bots fill a
    table (up to six of seven: Priya · RT, Marcus · CFO, a charge nurse, a hospitalist and a coder among them). Rooms: a four-letter code and an invite link, over the same relay
    as The Table (host-authoritative, hu-table.js), or tabs of one browser with no internet. The kit learned two
    things for it: an any-seat verb ('*', the host stamps the sender's chair) and auto seating (first come, first
    seated; watchers when all eight are taken). The question bank: 208 questions in five categories
    (scripts/build-vital-stats.js, 45 hand-curated and checked live, the rest built from the site's own sourced data),
    tests/vital-stats-questions.test.js. The engine: one JSON state, dispatchAct, HURng seed, bots on the host's clock,
    tests/vital-stats.test.js (9, including a three-browser fake bus). Menus by the contract. A returning host gets
    unseen questions before repeats. Proof: `npm run backend:check:vs` (three real browsers over the real relay, two
    rounds, every copy identical to the host's), the phone gate clean at nine viewports, Playwright shots of every
    phase at 360, 740x360 and 1280 in tmp/bp/.
    **State games DONE 2026-09-24 (David, after playing it: "this functionality is good. in the create a room i want to
    be able to ask questions that are state by state, or select a list of states that its from... now we can add and
    twist").** The lobby has "Where the numbers come from": The whole U.S. (the everyday mix, unchanged at 208) or State
    by state, with a Pick states card (51 toggles, the four Census regions as quick picks, None picked = every state) and
    a live count ("58 questions match"; "Only 3 match, so the game runs 3 rounds"; Deal disabled at none). The bank now
    writes every state metric and every per-state count for all fifty states and DC: 1,390 questions, 1,271 about one
    state, 17 to 32 per state (37 KB gzipped, one file). Each carries its state and its template, so a deal never asks the
    same kind of question twice and spreads the rounds across the picked states. A state question wears its state beside
    the category. Found on the way: "Lock it in" sent the guess and the lock as two intents; over the real relay the
    lock could land first and freeze that player until the clock ran out (two of three live runs failed). They are one
    intent now; three of three pass. Proof: tests/vital-stats.test.js (13), the bank tests (11), verify 343/343, the phone
    gate clean at nine viewports, tmp/bp/states.js (lobby, picker, a Utah and Idaho deal, a guest's read-only view).
    **Three twists DONE 2026-09-24 (David: "yeah lets do those 3 ideas").** (1) THE REVEAL STRIP: a state question's
    answer shows every state's answer to the same question as dots low to high, the asked state lit in gold, the two
    ends labelled, and its place read from the nearer end ("Utah: 3rd lowest of 51"); a log scale where the spread
    passes 8x (hospital counts); built on the host from the bank and carried in the state. (2) PAY BY STATE: a new
    pull, scripts/pull/oews-states.js (npm run pull:oews-states), BLS OEWS May 2025 state medians for ten jobs (RN, RT,
    LPN, NP, PA, pharmacist, rad tech, nursing assistant, medical assistant, health services manager) through the BLS
    public API, 510 of 510 figures, cached, into src/assets/data/state-pay.json; 510 new questions, two of them (RNs in
    California, RTs in Utah) in the everyday mix. Every state now has 27 to 42 questions. (3) HOME TURF: each player
    names a home state in the lobby (a card like Pick states, their own verb through their own chair); the host deals
    one round per home state, spaced through the game, and the closest guess on it pays double whoever makes it
    ("Dana defended home turf" or "Sam took Dana's home turf"); the round wears a "Home turf: Dana" tag; the host
    can turn it off. Also: the deal keeps one category from taking more than its share. Proof: tests/vital-stats.test.js
    (16), verify 346/346, the phone gate clean at nine viewports, tmp/bp/twists.js at three sizes, and the real-relay
    check now has a guest set a home state (npm run backend:check:vs).
    **Question variety DONE 2026-09-24 (David: "the questions lack variety or different sayings").** Every template
    has two or three sayings, picked by a hash of the question's id so the bank stays deterministic ("Out of every 100
    adults in...", "Half the households in Utah earned more than...", "Half the people in Maine are older than...").
    Four new forms from the same numbers: ONE IN N ("About one in how many adults in West Virginia smoked?", answers
    print "1 in 5"), A PLACE ("Rank the fifty states and DC by adult obesity, highest first. What place is Utah?",
    answers print "#41"), PER HOUR (the OEWS annual median over 2,080 hours, the BLS full-time year), and HOW MANY
    STATES (eight lines across the map, each chosen to land in the middle: 13 states pay RNs a median of $100,000 or
    more). Plus the gap between the best- and lowest-paid state for four jobs. A form shares its template with the
    plain question, so a game never asks the same fact twice. The page speaks each form (the label, the hint, the
    placeholder, bots kept inside a place's range); a rank or one-in-N question has no strip (one in N runs backwards).
    The bank: 3,325 questions (89 KB gzipped), the everyday mix 240, each state 51 to 70. The most common opening in the
    everyday mix is now 18 percent of it, and tests/vital-stats-questions.test.js holds that under 25 with at least 20
    openings. Proof: 29 Ballpark tests, verify 348/348, the phone gate clean, the real-relay check, tmp/bp/forms.js.
    **Renamed Vital Stats 2026-09-24.** Every file, the address (/secret-menu/vital-stats/), the code names (VitalStatsEngine,
    window.__vs, the vs- class prefix, vs- storage keys, the vs-room- relay channel), npm run build:vital-stats and
    npm run backend:check:vs. Verify 348/348, the phone gate clean, the real relay identical across three browsers.

---

## THE FRAME, SET BY DAVID 2026-09-22

**THE FRAME, SET BY DAVID 2026-09-22.** Read this before anything else in this file.

His words: "we keep making content that works as a standalone within its own... single time use.
the end goal for me is to have tools and pages and references that i use and others can use, and
they can jump write to it on phone, laptop, tablet or computer and have it look good and feel
easy to understand and follow. before we continue down more content generation i want to really
focus on that... our 3 month plan can continue but the frame of what we have been doing the last
few sessions has to help create a better foundation for us to work off of."

So: **no new content until the foundation holds.** The quarter plan is not cancelled; every task
in it now has to leave the site more consistent than it found it, or it waits.

WHAT THE FOUNDATION PROBLEM ACTUALLY IS, measured 2026-09-22 rather than guessed. Every reading
page declared its own hero, eyebrow, headings, paragraph, cards and callout, because
docs/HU-PAGE-RECIPES.md told each one to copy a block and rename the prefix. Forks drift:

| the same element | how many different values | across |
|---|---|---|
| h1 size | 5 | 14 pages |
| hero padding | 8, no majority at all | 13 pages |
| eyebrow letter-spacing | 8 | 41 declarations |
| paragraph line-height | 4 | 15 declarations |
| h2 size | 2 | 13 pages |

Nothing there is broken, which is why no gate ever caught it. It is the difference between
consistent and almost-consistent, and almost-consistent is the thing a reader feels and cannot
name. The recipe also taught the MINORITY value for both headings, so a page built correctly
from the instructions came out unlike most of the site.

THE ANSWER, started 2026-09-22:
1. **`.hu-read`, the shared reading shell, is in hu-global.css.** Its numbers are the majority
   values already on the site, so adopting it moves the fewest pages the least distance.
2. **Proof shipped:** /secret-menu/patient-journeys/ went from 56 lines of page CSS to 19, and
   the 19 are genuinely unique to it. Clean at all eight viewports, verify green at 222.
3. **The recipe is rewritten** to point at the shell instead of teaching the fork.
4. **The gate exists: `tests/reading-shell.test.js`, a ratchet.** Built BEFORE the migration
   rather than after, so the work has a definition of done instead of needing David's eyes to
   confirm it. A page may lose shell declarations, never gain them; a new page starts at zero.
   Proven to fail by putting drift back into a clean page. `scripts/shell-drift.js` prints the
   table; `scripts/shell-convert.js` does one page and REFUSES anything that is not pure type.
5. **First migration pass done 2026-09-22: 225 declarations down to 145, 12 of 31 pages clean.**
   Verify green at 225 tests, every converted page clean at eight viewports.
   Two things were found by doing it, not by looking:
   - **`DM Serif Display` was never loaded.** Eleven Learn articles set their headings in it and
     the site only ever requested DM Sans, IBM Plex Mono and Outfit, so those headings rendered
     in whatever serif the DEVICE fell back to. Headings that change by device is the literal
     form of David's complaint. CLAUDE.md names three fonts and the serif is not one, so it was
     treated as drift and the headings moved to Outfit. Visible change on eleven pages.
   - **Article prose is 17px and `--t-body` is 15px**, so a naive conversion would have shrunk
     the text on the pages he reads most. The role was missing from the ladder rather than the
     pages being wrong: `--t-prose` (17 desktop / 18 phone) now exists and the shell uses it.

**WHAT IS LEFT, and why it stopped here.** The remaining 145 are `card`, `grid`, `hero`, `note`
and `link`. Unlike type, those carry real page design: a hero gradient, a card hover border, a
column count. `shell-convert.js` refuses them on purpose, because losing a page's look to a
migration regex is a worse outcome than the drift. Merging them is a design call per page and
David is reviewing page by page next. The other two shells (tool pages, games) have not been
started; the realistic target is three shells that agree, not one that covers everything.

Bespoke CSS is not the enemy and must not be "fixed": a diagram, a board, a figure stays
page-scoped. Only the shell is shared, because only the shell should be identical.

---

## THE PHONE PASS, 2026-09-21

David read the site on his own phone against a dev server on
the house wifi and sent twelve screenshots. Uncommitted work sits in the tree; he commits it.
What changed, and why it is worth knowing before touching any of it:

- **The bare `nav {}` rule in hu-global.css is now scoped to `nav[aria-label="Primary"]`.** As a
  bare element selector it matched all six <nav> elements on the site and forced each to the
  header's height, sticky, z-index and blur. On the 4Ps page that locked the section nav to 64px
  while its links wrapped to 231px, so three of the four painted over the article text. If a page
  nav suddenly loses its background, this is why: give it its own, the way .rr-topnav now does.
- **The footer has two weights.** Home and About get the full one; everything else gets
  `.footer-lean`, which drops the Field Notes form, the Source Policy and the Tools column.
  David's call, his words: they "do not need to be at the bottom of every learn module." A learn
  module's footer went 1756px to 385px. Support stayed on every page because he did not ask for it
  to move.
- **The phone gate has a sixth floor: SPILL.** Content taller or wider than its own box while
  overflow is visible, which paints outside the box over whatever is below. Every other check read
  those pages CLEAN, which is how the 4Ps nav shipped. It found six more pages; all fixed.
  An ancestor that clips or scrolls contains the overflow, so carousels and pannable diagrams
  are not flagged.
- **The SQL mystery was hiding the task.** `.case-desc` was capped at 190px inside a
  viewport-locked shell while a case is about 334px, so "Your mission", the sentence that says
  what to do, was never on screen at 360. The phone column scrolls with the page now.

Written 2026-09-21 at David's ask, at the end of a long session. Everything below was green when
it was written: 221 tests, both live multiplayer checks, the 19-step phone QA, and every public
page passing `npm run phone` at 360. David commits and pushes this himself.

**PUSHED AND VERIFIED LIVE, 2026-09-21.** Commit `3f41307`. The first CI run in this repo's
history went green on push. The deploy landed on healthcareuncharted.com and everything was
re-checked against the LIVE site, not localhost: both multiplayer relay checks (a hospital table
through reloads on both sides, and a two-wall assembly race) and the full 19-step phone QA, all
passing against the real domain. So the work is not just committed, it is serving.

**What state things are in.**
- The Table plays over the internet, in both games, through reloads on both sides.
- The three shared kits exist (`hu-save`, `hu-rng`, `hu-table`) plus `HUKit.peek` for
  explain-on-demand, and the engine contract is written at `.claude/rules/games.md`.
- All three games have had the reading-load pass David asked for. The design phase on them is
  OPEN and closes when he says they feel like web games (CLAUDE.md, OPEN PHASES).
- Every chart on the site has a phone drawing. The phone gate now enforces three floors: type
  size, line contrast, and label contrast plus weight and tracking.
- `npm run qa:phone` runs David's mechanical QA himself, 19 steps with a screenshot each.
- Publicity is PARKED by his call. The two launch posts are drafts and are NOT to be revised or
  scheduled. Game night waits.

**The first thing to do next session.** Read DECISIONS.md. Ten questions are open and nine of
them need David's eyes or his accounts, not Claude's time. Do not start new building while that
list sits; three separate sessions have now found questions on it that shipped work had already
answered, so re-verify each against the repo before working it.

**Deliberately held, both by David on 2026-09-21, not forgotten.**
- **Article 06 on FHIR.** The only gap left in the Learn numbering. Pure writing, nothing blocks
  it, and the pattern to copy is Article 11 at `/learn/alarm-fatigue/`.
- **The quarterly data refresh.** Needs a Census API key Claude does not have, rewrites the
  datasets behind both maps, and the plan schedules it for December. It wants a deliberate
  sitting, not a spare half hour.

**Also waiting on him, not on work.**
- **The leaderboards** (plan month 3) wait on whether publicity comes back this quarter. They are
  the "infrastructure for greater things" piece: a scores table, row-level security, and a
  server-side plausibility check so a leaderboard cannot be pasted into.
- **Alarm Fatigue** needs improving before anyone is pointed at it, in his words, but what
  bothers him about it is still unknown. The answer decides whether that is a copy pass, a pacing
  change, or something structural, so ask before building.

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

## SPRINT 0 · THE PAGE OVER PAGE REVIEW  ·  everything else is stopped

David, 2026-09-21, after reading the site on his own phone: "Cancel all content additions in
our plan until we do a page over page review for phone vert and horizontal and web page look
at feel." That is the whole week. Nothing below this line starts until this finishes.

**Stopped by that instruction, not dropped.** Article 06 on FHIR, the quarterly data refresh,
and every other content addition in docs/HU-DEV-PLAN-2026-Q4.md. They keep their place in the
plan's months. Sprints 1 to 3 below are multiplayer and kit work, already shipped or already
his to call, and they are not content additions, but nothing new starts on them either.

**What the review is.** Every public page, three ways: phone portrait at 360, phone LANDSCAPE,
and desktop. Each one read the whole way DOWN, not just at first paint. His words: "When we
test a page for web stuff we need to scroll down the whole page not just part of it." That is
a real gap in the harness as it stood: every check ran once, at the top, at one orientation.

**The three things he named.**
1. **Headers are inconsistent across the site.** His screenshots show at least four different
   grammars: the full site header, a TOOL header with no search, a game header whose controls
   CHANGE between portrait and landscape, and pages with no header at all.
2. **The harness only read the top of a page.** Fixed before the review runs, not after.
3. **The AI tools page.** "I dont know why there is a page for AI tools." It is on the
   decisions list rather than deleted on a guess.

**Done when** every page has been seen at all three sizes, the header grammar is one decision
he has signed off, and the harness reads whole pages in both orientations.

### The first full read, 2026-09-21

All 54 pages, three viewports, each read the whole way down.

| viewport | pages failing |
|---|---|
| 360x740, phone upright | 4 |
| 740x360, phone on its side | **22** |
| 1280x900, desktop | 1 (a harness artifact, the analytics API is cross-origin) |

**Landscape is the whole story, and the 22 share one cause.** Every breakpoint on this site
tests WIDTH. A phone on its side is 740px wide, which is over the 699px line, so the site
decides it is a desktop and serves desktop things to a touch screen held in two hands:

1. **The desktop menu.** Seven mouse-sized link targets. This is the same fact David saw as
   "inconsistent headers": the header changes when the phone turns. FIXED, the nav block now
   reads `(max-width:699px), (max-height:500px)`. Sub-44px targets on a landscape article
   went 12 to 5, and desktop is untouched. The height clause catches landscape phones,
   which run 360 to 430px tall, and not tablets or laptop windows.
2. **The desktop chart.** The PHONE CHART SWAP is keyed to 699px too, so landscape gets the
   wide drawing and its small type. That is what the type-floor failures on the Learn and
   Rounds pages are. NOT fixed: which drawing a wide short window should get is a look
   decision, and the phone twin is authored at 320 units for a narrow column.
3. **The chrome budget cannot be met in landscape as written.** It is 20% of viewport height (css.md, DESIGN.md and the gate all say 20; this line said 15);
   at 360px tall that is 54px, and the site nav alone is 64px. Every landscape page is over
   before anything else loads. Either the bar shrinks when the screen is short or the budget
   means something different sideways. NOT fixed, it is a decision.

Points 2 and 3 wait on question H, because both are answered by the same call about what the
header and the page owe a phone held sideways.

### The fix pass, 2026-09-21, on David's "do a full sweep and fix these issues"

Points 2 and 3 above were DONE rather than left waiting, because both turned out to be the
same one-line decision the nav already took: the phone test follows the SHORTER side.

- **The chart swap** now reads `(max-width:699px), (max-height:500px)`. Landscape was being
  served the desktop drawing, whose labels are sized for a 720-unit canvas and landed at 4
  to 7px. That was every type-floor failure in landscape.
- **The nav bar is 48px when the screen is short** (`@media (max-height:500px)` on
  `--nav-bar-h` and `--nav-h`, the two tokens everything downstream rides). 64px in a 360px
  screen was 18%, over the budget before anything else loaded. 48px is 13% and still holds
  the 44px touch target with room either side.
- **A sixth floor, LABELS PAST THEIR BOX.** The collision check only ever compared text to
  TEXT, so a caption centred in a rect and simply too wide for it was invisible: SVG has no
  overflow rule to catch it either. Proven against the bug that prompted it before being
  trusted: with the old markup restored the gate reports
  `LABEL PAST ITS BOX by 68px: "one shared shelf" is 140px in a 72px box` and fails the page.
  Site-wide it found exactly one more, ELIGIBILITY on the Change Healthcare page, 96px in an
  85px node. Both fixed; the whole site now reads zero in both orientations.

**Still David's, untouched on purpose.** What the header SAYS. Seven grammars are in use and
picking one is a look decision, not an engineering one, so question H stands. What changed
here is only the mechanism: the same controls now appear whichever way the phone is held.

### The viewport ladder and the play check, 2026-09-21

David: "why are you not testing and reviewing pages on this phone scale? I want every page
to be able to look good on phone, and web/Tablet/Computer and when it has response size
changes." The method is written up at docs/HU-VIEWPORT-METHOD-2026-09-21.md. What changed:

- **Eight viewports, not three.** 360x740, 430x932, 699x900, 700x900, 768x1024, 1024x768,
  1280x900, 740x360. The pair either side of 699 is deliberate: a breakpoint is where
  layouts break, and nothing had ever been tested inside one.
- **Layout checks run at EVERY size.** They were gated to phone, so tablet and desktop
  printed n/a and passed without being checked at all. Phone PHYSICS (44px targets, type
  floor, chrome budget) stay phone-only, because they are about a thumb and a small screen.
- **scripts/play-check.js.** Everything else reads a page sitting still, which is why the
  mid-shift overlaps David photographed were invisible: those panels do not exist until a
  floor has been bought. It uses the game's own ?afdev=full hatch to stand up a maxed unit,
  then reports anything opaque parked on a control or a readout.

**What the ladder found on its first run, all above phone width, none of it seen before:**
- The desktop nav needs 723px and appears at 700, so EVERY page scrolled sideways in the
  23px band from 700 to 722. Fixed by tightening the links in that band only.
- Atlas Craft's toolbar held 1426px of controls at 1280 and pushed Reset 146px off the edge.
  It had a phone rule only. It scrolls at every width now.
- The Laws and Paradoxes hero: the italic descender on "Paradoxes" hung 11px below its own
  h1. Leading could not fix it (raising line-height grows the content too), so the glyph got
  padding instead. /learn/jevons-paradox/ reported the same fault and turned out to be a
  redirect stub pointing at that page.

**Still open on the game:** play-check names two faults it has not fixed. The clicker covers
the monitor tiles (84%) and event widgets land on the big button (75%). David called the
game good after the tab and call-light fixes, so these wait for his word rather than a sixth
unprompted pass at that layout.
### Alarm Fatigue on a phone, 2026-09-21

David played it and sent notes as he went. What landed:
- The HU hex is back in the title bar, at his ask. It had been hidden to save room; the
  shift clock yielded instead, because the console sub-line already reads the time.
- The console no longer selects its own text. A tap that drifted a pixel was highlighting
  the readout instead of pressing the button, which is what "can only be clicked every few
  times" was.
- The pumps ride above the monitor bank, his call.
- The button is centred at 281px with a 40px lane either side, and shrinks 54px to 44px as
  the console fills. 44 is the floor.
- Call lights are ONE column on a phone held upright (60px, was 106px in two). The console
  reserves 78px of right wall instead of 124px and keeps the difference.

**What did NOT land, and the lesson.** Four passes went into lanes, a single scrolling
surface and a fixed dock, all of them answering HOW to scroll. David: "i dont want any
scrolling on the page, there is room for all the buttons in the mock up we had and i feel
like we have got off course." He had asked at the very start whether everything could scale
to fit and still be selectable, and the answer given was that scaling was the wrong lever.
It was the right lever. All of that scrolling work is reverted; the floor is a fixed frame,
the chart is a clipped backdrop, the console floats, nothing scrolls.

**The real remaining task is FIT.** Measured at 360 on a busy shift: the console can use
592px and wants 606px (pumps 110 + bank 150 + button and readout 146 + two shop cards 200).
It misses by 14px, and the button's own shrink already returns 10 of those. A THIRD shop
card is what actually breaks it, at 114px over. So this is tightening, not restructuring.

**He also said something worth keeping:** "i think part of it is you take my responses to
literally. You moved things around to accommodate my ask but made decisions about other
items that dont make sense." That is what displaced the monitor bank: solving "button at the
centre" as geometry and letting everything else fall where it landed.

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

- 2026-09-23 · **Theme pass, inserted inside Sprint 0.** David: "the Dark and light themes on
  the website need to be reviewed and updated... every page needs to be able to do both." Every
  page now renders in both themes (the three hospital games, ARMA, Camp Nauvoo, the Rounds
  figures, the Data Observatory and all card thumbnails got a real light theme; the Alarm Fatigue
  EHR got a real dark one) and every text element measured clears 4.5:1 composited in both. The
  whole-site scanner is tmp/theme-scan/scan.js. Nothing displaced; two defects found on the way
  went out as their own tasks (the Atlas phone search bar covering the breadcrumb; the home
  respiratory timeline's rail items not keyboard reachable).

- 2026-09-21 · **Re-aimed to Sprint 0, the page over page review.** David's instruction after
  reading the site on his phone: "Cancel all content additions in our plan until we do a page
  over page review for phone vert and horizontal and web page look at feel." Article 06 and the
  data refresh were already held by him on 09-21; this widens that to every content addition in
  the quarter plan. Nothing is dropped, it all keeps its month. Three findings of his open the
  sprint: headers are inconsistent site-wide, the phone harness only ever read the top of a page
  at one orientation, and the AI tools page has no agreed reason to exist.

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
