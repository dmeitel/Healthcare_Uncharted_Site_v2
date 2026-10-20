# Daily Huddle: a hex trivia board built on Vital Stats (plan)

Written 2026-10-14, after the "phone updates" commit (0c67168). David, 2026-10-13: "I want to start working on a new game that
is an extension of vital stats. Its similar to this game https://dailydozentrivia.com/ IT should be a hex grid and use trivia
from our different data sets and semi mirror the Atlas. It should also have a timer and a player counter. the categories
should vary, and amongst there being a daily one like the Headwall game, i also want people to be able to make custom ones
to send to their team or play with like the Vital stats game." And: "Think about all the different configurations or types
of trivia we could do, Drug dosage, health stats, normals and much more. this is a good chance to consider all of the
datasets we could add to the sites database and build some fun games along with it."

STATUS: BUILD. David, 2026-10-14: "Yes this all looks awesome, Lets build its core functions out get me a functional demo and QA list/Review test list on the hub". DH1 to DH3 answered with the recommendations (docs/HU-DECISIONS-LOG.md). Stage 1 is being built; the phase line below is history. On his yes, the new surface opens a design
phase and Stage 1 starts. The working name is Daily Huddle; it is a working name, and he can change it by saying so.

Pictures: tmp/trivia-mock/shots/ (a mockup, not the game: night theme, the site's brass tokens, the Atlas zone colors).

## 1. What the research found

Four threads ran 2026-10-13/14: the games out there, the healthcare trivia out there, the site's own data, and the open
datasets we could add. Sources are in section 9.

**Daily Dozen Trivia, read from its live code** (it has no rules page). A 3x3 board, nine questions, a new board at 6 AM
Eastern. One guess per square, typed into a box that autocompletes from a closed answer list, so spelling never decides.
One retry on a missed square after all nine ("Double Dip"). The clock counts UP from the first tap and the time decides the
points: 10 a square under 3 minutes, 5 under 5, 2 under 7, 1 after. After the game, each square shows the share of players
who got it, refreshed every 10 minutes. Old boards are practice, untimed. A Barstool login holds the streak and the
leaderboard. "Players Today" sits in the header.

**Blockbusters**, the TV quiz played on a hex board, is the one trivia game where the hexes do something: each side races
to link its two edges. Its bonus round, Gold Run, is one player crossing the board against a 60 second clock, and a pass
blacks out that hex so the route has to go around it. That is the core of this plan.

**The open space.** No daily web trivia game on a hex board turned up. The healthcare dailies that exist (Doctordle,
iatroX Rounds, Meddle; Drugle as an iPhone app) are diagnosis and vocabulary for medical students. Nothing was found for
nurses, RTs, pharmacy, informatics, or how the system works (costs, policy, workforce, devices); nothing mixes disciplines
on one board; none shows the share of players who got a question; nothing lets an educator make a board for a team.

**What makes a daily stick:** one board for everyone, numbered; a share line that shows how you did and gives nothing away;
streaks; a difficulty you can see before you choose; "x% got this" after; an archive of missed days; about 3 minutes.
**What breaks one:** answers that read two ways, typed answers that fail on spelling, long sessions, running out of
questions (seven a day is about 2,550 a year), looking answers up, and in healthcare, clinical facts that go stale.

**What the site already has** (section 4 has the full list):

- Vital Stats' banks: 3,675 everyday and state questions and 23,641 health system questions, every one with its source, data
  year, check date and a link into the tool that shows the number. The scoring that rewards being close.
- The table kit: rooms up to 48, teams, the QR join, the big screen, game links that carry the settings.
- Device Assembly's daily: ids by date in Mountain time, numbered from day one, a share line, made puzzles sent as links.
- The Atlas: 7 zones around the compass (Medical Science, Provider, Patient, Public Health, Health Tech, Policy, Payer),
  119 tiles, deep links by zone and tile.
- Ideas already answered on the hub: Today's Shift (Yes), Waveform of the Day (Yes). Open: Huddle mode, the quiz bowl room,
  the RC Week game hour, The Daily Gas, one share line, a gentle streak.

## 2. The game

A hex board of 19 tiles laid out like a small Atlas: the compass in the middle, and six zones around it, three tiles each,
in the Atlas' own colors. Each tile is a category with one question behind it, and one to three dots that say how hard it
is. Tap a tile, answer, and it is yours; miss and it closes. Get a chain of your tiles from the top of the board to the
bottom before the clock runs out.

**The daily, "cross the board".** Everyone gets the same board, numbered from launch day, new at Mountain midnight. Three
minutes and three misses. Any tile can be played at any time; you have crossed when tiles you hold touch from the top row to
the bottom row. The shortest crossing is five tiles. The score is the dots on the tiles you crossed with, so the safe road
down the edge scores 5 and the bold road through the middle scores 13: the choice every day is how much to risk. Crossing
first, then score, then time left decides the day's ranking.

- The compass is the day's special and the hardest tile: today's ABG to read, a waveform to name, the day's Vital Stats
  number. That is where the two Yes ideas plug in without becoming two more dailies. A crossing through it marks the share
  line.
- The share line, shaped like the board: offset rows of squares, green for a tile you held, red for a miss, dark for the
  rest, with the board number, the score and the time. No answers in it.
- After the board: every tile opens with its answer, its source and check date, the share of today's players who got it,
  and a link to the place on the site that shows it (the Atlas tile, the map, the Career Tree card).

**The other modes**, all on the same board and the same rules:

| Mode | What it is | Built on |
|---|---|---|
| Daily | One board a day for everyone, timed, ranked | Device Assembly's day ids and share line |
| Archive | Any past day, untimed, practice only | The same dealer, by date |
| Make a board | Pick the zones, the pack (everyone, nursing, RT, pharmacy, leaders, students, one state, one health system), the clock and the misses; get a link. Everyone who opens it plays the same board, and a results list shows who played it | Vital Stats' game links; Device Assembly's made walls |
| Live | A room on the table kit: two or three teams race to cross. A hex board has three pairs of opposite sides, so three teams each get their own direction. The big screen shows the board; phones answer. This is the unit huddle, the RC Week game hour and the quiz bowl practice room | Vital Stats' rooms, teams, QR join and big screen |
| Practice | A random board, any time, with a choice of clock | The dealer with a random seed |

**What we considered and did not pick.** A seven hex "clear the board" daily (the six tiles and the compass, answer them all,
Daily Dozen's shape). It is simpler and has nothing to decide: the hexes are decoration. It is in the pictures as the other
option for DH1.

## 3. The question families (the configurations)

Ten ways to ask, each one a single tap or a short number on a phone. A board mixes them; a family names which ones it uses.

| Format | How you answer | Scored | Good for |
|---|---|---|---|
| Pick one of four | Four keys | Right or wrong | Names, classes, which state, which agency |
| Higher or lower | Two keys | Right or wrong | Two states, two drugs, two hospitals |
| The number | Type it (Vital Stats' reader: 82k, 1.2 million) | Within a band counts (Vital Stats' tiers) | Counts, pay, prices, rates |
| The range | Pick the right range of four | Right or wrong | Normals |
| Real or fake | Two keys | Right or wrong | ICD-10 codes, drug names, syndromes |
| Put in order | Tap four in order | All right or wrong | Years, ranks |
| On the map | Tap a state on a hex map of the U.S. | Right or wrong | Highest, lowest, first |
| Match | Tap three pairs | All right or wrong | Brand to generic, law to year |
| Clinical math | Type the answer | Exact to the stated rounding | Doses as arithmetic, drips, tank duration, IBW |
| Odd one out | Four keys | Right or wrong | Classes, compacts, programs |

No free-typed names in the first build: four keys answer the spelling problem, and a phone answers four keys faster than
Daily Dozen's search box.

The families, by Atlas zone. "Have" means the data is already in the site; "Add" is a pull from section 5.

| Zone | Family | Have or add | Example |
|---|---|---|---|
| Medical Science | Normals (ABG, vitals, CBC, BMP) | Add, a small sourced table | Normal arterial pH in an adult? |
| Medical Science | Drug names and classes | Add (FDA) | Which one is not a beta blocker? |
| Medical Science | Clinical math | Generated, no data | An E cylinder at 1,800 psi at 4 L/min lasts how many minutes? |
| Medical Science | Firsts and Nobel prizes | Add | Put these in the order they were first approved |
| Provider | Pay | Have (BLS, state pay) | Median RT pay in Utah? |
| Provider | Hospitals and systems | Have (cost reports, CMS) | Which Intermountain hospital has the most beds? |
| Provider | Careers and exams | Have (Career Tree, pass rates) | NCLEX-RN first-time pass rate? |
| Provider | Schools | Have (IPEDS, accreditors) | How many accredited RT programs in Texas? |
| Patient | Patient costs | Have, Utah only; add national | What a hospital charges for an MRI |
| Patient | Hospital stars and patient ratings | Have stars; add patient survey | Higher or lower: two hospitals' ratings |
| Public Health | State health | Have (72 measures, counties) | Which state had the lowest uninsured rate? |
| Public Health | Life span and causes of death | Add (CDC) | Life expectancy in Mississippi? |
| Payer | Medicare and Medicaid | Have in part; add spending | Medicare's most expensive drug last year? |
| Payer | Drug prices | Add (Medicaid's pharmacy price survey) | Higher or lower: two generics' price a tablet |
| Policy | Laws and years | Have (Learn modules); needs sources | Put HIPAA, EMTALA, the ACA and HITECH in order |
| Policy | License compacts | Have | Is Utah in the Nurse Licensure Compact? |
| Health Tech | Real or fake code | Add (ICD-10-CM) | W61.62XA: real or fake? |
| Health Tech | Devices and recalls | Add (FDA); Device Assembly's parts | Name this connector |
| Health Tech | EHR and standards | Have (Learn, Atlas); needs sources | What does the F in FHIR stand for? |

## 4. The data the site already holds

The game starts on data we have, so Stage 1 needs no new pull. From the inventory (2026-10-14):

- **Ready:** Vital Stats' banks (above); state health (72 measures, 51 states, each with its source and date), counties
  (19 measures, about 3,100 counties), state pay for 10 jobs, national pay and outlook for 49 occupations, exam pass rates and
  fees (47 credentials), the hospital roster (5,366) and cost reports (4,984 hospitals, 350 systems), schools and programs
  (2,191 schools, 3,539 programs, accreditors), dialysis clinics (7,557; DaVita 2,800 against Fresenius 2,772 is a good
  one), surgery centers, equipment and pharmacy suppliers, the license compacts, state taxes and cost of living.
- **Usable with sources added:** the Career Tree's roles, the Atlas tiles, Laws and Paradoxes, Process Engineering, the
  home respiratory timeline. Their facts carry no source line today, so each gets an entry in the sources ledger before it
  becomes a question.
- **Not for questions:** the POS staff counts (wrong for hospitals David knows), the hand-entered state measures the Vital
  Stats builder already refuses (Utah's hospital count reads 37 against CMS's 52), the vendor directory (no sources;
  since 2026-10-18 a vendor question is made only from a fact checked live, scripts/data/vendor-checks.json, with that
  check's source and date),
  Utah-only prices for a national board, the Career Tree's rough pay.

## 5. New datasets, ranked

Checked live 2026-10-13/14: the data fetched and the reuse terms read where they could be. Ranked by good questions per hour
of pipeline work. Every one is a U.S. government or open source the site can derive facts from.

| # | Dataset | What it adds | Reuse | Care |
|---|---|---|---|---|
| 1 | ICD-10-CM code descriptions (CMS) | Real or fake code: W61.62XA is "struck by duck", W56.22XA "struck by orca" | Government file | None for descriptions |
| 2 | Medicare Part D spending by drug (CMS) | Brand and generic pairs, higher or lower, what Medicare spent (Eliquis, $20.77 billion in 2024) | Government work | Gross spending, before rebates |
| 3 | Nobel Prize API | Physiology or Medicine laureates and what they found | CC0 | None |
| 4 | Drugs@FDA, the Orange Book, novel approvals (openFDA) | Which came first, first approvals, patents, boxed warnings | CC0 / public domain | A patent date is not when generics arrive |
| 5 | National Health Expenditure (CMS) and Mortality in the U.S. (NCHS) | About 30 headline numbers: $5.3 trillion and $15,474 a person in 2024; life expectancy 79.0 | Government | Curated, with the year on each |
| 6 | WHO essential medicines (the eEML) | Is it on the essential list? | CC BY 3.0 IGO | Use the eEML, not the PDF (non-commercial) |
| 7 | Open Payments national summaries (CMS) | What industry paid physicians, in total | Government | Totals only, never a named clinician |
| 8 | CDC growth charts and the NHLBI children's blood pressure tables | Children's normals, when they come | Government | Label the 2004 tables as 2004 |
| 9 | NHANES 2021 to 2023 (CDC) | Population numbers: the pulse half of adults are under, the median glucose | Statistical use only | Needs the survey weights |
| 10 | Wikidata eponyms | Who a disease is named after, who invented what | CC0 | Needs a hand cleanup |

Next after those: RxNorm (brand to generic), NADAC (what a pharmacy pays a tablet), hospital stars and the patient survey
(HCAHPS, joins the hospital data the site has by CCN), HRSA shortage areas, FDA drug shortages (date-stamped, they change
weekly).

**Avoid:** the ISMP lists (all rights reserved, internal use only), the A.D.A.M. encyclopedia normals on MedlinePlus, CPT
descriptions (the AMA's, and they ride inside CMS's fee schedule files), SNOMED CT, WHO's ATC/DDD, the PALS and AHA tables,
DrugBank. **With care:** WHO's Global Health Observatory (public health use only, no commercial promotion), OECD (license not
confirmed), KFF (check each indicator), StatPearls (cite single facts, never copy a table), anything that names a clinician
(Open Payments, NPPES, the prescriber files: totals only), adverse event and MAUDE counts (reports, never risk).

## 6. Clinical content: doses and normals

**Doses.** No free, reusable source of standard adult doses exists. RxNorm gives strengths, not doses; FDA labels are free
text that changes with the indication, the form and the kidneys; WHO's defined daily dose is a statistic and its terms forbid
changing it; DrugBank is paused and non-commercial. A dose question also teaches its wrong answers: every wrong key is a
plausible wrong dose, and players remember what they saw. So the plan (DH2): doses only as arithmetic, with every number given
in the question (an order, a concentration, a weight, a rate), which tests the skill and states nothing about a drug. Any
later label fact would be hand-written, cite the label version, fail a test when the label changes, and get a pharmacist's
read; never high-alert drugs, children's weights, drips or kidney adjustments.

**Normals.** No open machine-readable set exists either: LOINC names tests but holds no ranges, MedlinePlus' lab pages give no
numbers, and the encyclopedia pages that do are copyrighted. A normal range is a fact, so the site can state it in its own
words and cite where it is published. The first set is about 30 adult values (ABG, vitals, CBC, BMP) that David writes or
checks as an RRT, each with a public source and "typical adult range; labs vary". Population numbers come from NHANES, worked
out by the site. Children's normals wait for the CDC and NHLBI tables.

## 7. The build, in stages

Each stage ends playable, and each is its own milestone (Plan, Build, QA, Tweaks, Ship).

1. **The daily, solo, on the data we have.** The engine on the games contract (one plain state, `dispatchAct`, `packSave`
   through hu-save, the seeded generator); the dealer that builds a board from the banks by date, with pins so a past board
   never changes; the board as one phone screen under the finger standard; the share line; the archive; the how-to card and
   the game menu from the kit. A question sheet like Device Assembly's puzzle sheet: every dealt board has a crossing, every
   question has a source and a date, every one reads at 360. Built in the secret menu first, the way every game here starts.
2. **The counter and the make-a-board link.** Players today and the share who got each tile (section 8); made boards as
   links with a results list; a gentle streak with a day off a week.
3. **Live.** Rooms on the table kit, two or three teams crossing along their own axes, the big screen and QR join. The
   relay check joins `npm run backend:check`.
4. **The new families**, in the order of section 5, each with its pull script, its sources ledger entries, its tests, and
   where it fits, a home on a tool page too (drug spending is a map layer before it is a trivia tile).

## 8. Calls Claude made (veto by looking)

- The working name is Daily Huddle: a huddle is the team's daily meeting, and a made board is a huddle for your team. It
  sits beside the Huddle mode idea on the hub rather than against it.
- It starts in the secret menu and moves to the Fun shelf at launch, the same move Vital Stats and Device Assembly made.
- The clock counts down from 3:00. Settings offers More time (half again), and the share line says when it was on.
- "Players today" stays hidden until 50 people have played that day, so a quiet morning never reads as an empty game. The
  count and the per-tile shares come from one anonymous write per finished board (a day number, the tiles and the result, no
  name and no account), on the Supabase project the rooms already use. No logins.
- One hex helper for the game (the Atlas, the Career Tree and the home page each draw hexes their own way today; the Atlas
  keeps its own, it is load-bearing).
- A board is dealt so every zone appears, no two tiles share a template, and a crossing exists at every difficulty.

## 9. Sources

Games: the live code of dailydozentrivia.com (its `/_next/static/chunks/` bundles, read 2026-10-14);
https://en.wikipedia.org/wiki/Blockbusters_(British_game_show); https://en.wikipedia.org/wiki/Immaculate_Grid;
https://thrice.geekswhodrink.com/; https://costcodle.com/; https://support.kahoot.com/hc/articles/115002303908;
https://doctordle.org/; https://meddle-game.com/; https://www.iatrox.com/blog/games-like-doctordle-free-daily-diagnosis-games;
https://apps.apple.com/us/app/drugle/id1661359629; https://officialgamerules.org/game-rules/hexaquest-rules/.
Site data: the inventory of src/_data, src/assets/data and data-build, 2026-10-14.
Datasets: https://open.fda.gov/apis/drug/ and https://open.fda.gov/terms/; https://www.fda.gov/drugs/novel-drug-approvals-fda;
https://lhncbc.nlm.nih.gov/RxNav/TermsofService.html; https://data.medicaid.gov; https://data.cms.gov;
https://list.essentialmeds.org; https://www.cms.gov/medicare/coding-billing/icd-10-codes; https://api.nobelprize.org/2.1/;
https://query.wikidata.org; https://wwwn.cdc.gov/nchs/nhanes/; https://www.cdc.gov/growthcharts/cdc-data-files.htm;
https://www.nhlbi.nih.gov/files/docs/guidelines/child_tbl.pdf; https://www.cdc.gov/nchs/products/databriefs/db548.htm;
https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data/historical;
https://openpaymentsdata.cms.gov; https://wonder.cdc.gov/wonder/help/wonder-api.html; https://ghoapi.azureedge.net/api/;
https://medlineplus.gov/lab-tests/; https://data.hrsa.gov/data/download. ICD-10-CM W61.62XA checked 2026-10-14
(https://www.findacode.com/icd-10-cm/w61.62xa-struck-duck-initial-encounter-icd10cm-code.html).

## 10. Built 2026-10-14 (Stage 1, the demo), and what the build found

On David's yes, the same window. The card is `daily-huddle` on the board, steps 91 to 97; his QA is step 97, eleven checks on
the hub's QA list.

- **The game:** src/fun/daily-huddle/index.html (src/secret-menu/daily-huddle/ until 2026-10-15) (the engine in `#hd-engine`: `deal`, `newGame`, `dispatchAct`,
  `crossing`, `canCross`, `packSave`/`applySave`, `madeCode`/`parseMade`, `shareText`, the Mountain-time day). Today's
  board, practice (`?board=practice`), past days (`?board=day:YYYY-MM-DD`, untimed), made boards (`?board=my:CODE`, the
  seed, the clock and the misses), the question list for checking the bank (`?list=all`, `?list=normals`, `?list=<zone>`).
  Board #1 is 2026-10-14 for the demo; DAY_ONE moves to launch day at Ship, and the pins of past boards go in then.
- **The bank:** scripts/build-huddle.js writes src/assets/data/huddle-questions.json, 1,057 questions (Provider 485,
  Public Health 277, Medical Science 84, Patient 78, Payer 62, Policy 55, Health Tech 16). Vital Stats' state templates
  became "which of four states" (2 dots), "which of two" (1 dot) and the state's own number (3 dots, within 10 percent);
  Vital Stats' national numbers count within 15 percent; clinical math is 80 generated questions with every number given;
  42 hand-checked questions (16 normals, all drafts for David's check; 10 laws; 10 health IT; 6 odd codes) carry a verbatim
  quote from a source read live 2026-10-14. `npm run build:huddle`; `node scripts/build-huddle.js --check` fails a stale bank.
- **The board, measured:** at the screens a phone browser really leaves (375 x 548, 393 x 659, 360 x 640, 430 x 746) a tile
  is 72 to 87 px wide, and a tap 14 px off its centre opened the tile aimed at 456 times in 456 (22 px off: 456 in 456). The
  board screen is one screen on an upright phone; on its side the board keeps a readable size and the page scrolls.
  `npm run phone` is clean at nine sizes, night and day, on the start screen, the board and the question list.
- **Tests:** tests/huddle.test.js (13: the shape, a year of dealt boards, crossing, misses, the clock, saves, made codes,
  the share line, the Mountain day) and tests/huddle-questions.test.js (7: sources and dates, one right answer, every zone
  can fill its wedge, the voice rules, DH2's lines, the bank matches its builder).
- **What the build found:** the kit's dialogs live outside the game's root, so a game's colour variables must be declared on
  its dialogs too (the right answer first drew dark on dark on a phone); a disabled key wears the kit's faded OFF look, so an
  answer's keys are drawn as plain blocks; text on a gradient fill reads as text on the page to the phone gate, so the compass
  is solid brass; between 700 and 1099 px a side panel left the board too small for a thumb, so the question opens as a card
  over the board there too.
- **Not in this stage:** the players-today counter and the share who got each tile (Stage 2, a database table that needs
  David's yes, since it reaches outside the repo), a results list for a made board (Stage 2), live rooms (Stage 3), a thumb
  test in the repo's gates (scripts/lib/thumb.js; the check above ran as a one-off), a thumbnail for the secret menu card.
