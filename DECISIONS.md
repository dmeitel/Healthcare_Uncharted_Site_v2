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

**2026-10-01, night: the game relay is offline, and only you can bring it back.** RESOLVED 2026-10-02: David restored it
and every relay check passed. Kept below for the record; the keepalive SQL in the next paragraph is the part still open. Every multiplayer room (Vital Stats,
The Table, Device Assembly) runs through the free Supabase project at `swntgsmpcqyuapkkyaqj.supabase.co`. That address
stopped existing in public DNS that night (checked against Google's and Cloudflare's resolvers), which is what a paused
project looks like. The every-three-days keep-awake check passed at 17:53 UTC the same day and Supabase's status page shows
no outage, so the dashboard will have to say why. Steps: supabase.com, sign in, open the project, and if it says Paused,
press Restore. Same address, nothing to change on the site. Games with bots, and tabs of one browser, still work meanwhile.

**2026-10-02, why it paused, and the one step that stops it happening again.** Supabase's own page on pausing
(supabase.com/docs/guides/platform/free-project-pausing, read 2026-10-02) says a free project pauses after 7 days with
too few "user queries" to its database, and that the owner gets a warning email about a week before. The games never
query the database: rooms run on its live-messaging side, which does not count. The keep-awake check was reading a table
that does not exist, and that answer comes back without the database running a query, so it showed the project was up
without keeping it up. Claude changed the check to run every day and to pass only on a real read. It needs a real
table to read, and creating one is a write to your Supabase account, so it is yours. After Restore, open the project,
choose SQL Editor, paste these four lines, and press Run:

    create table if not exists public.keepalive (id int primary key);
    insert into public.keepalive (id) values (1) on conflict do nothing;
    alter table public.keepalive enable row level security;
    create policy "anyone can read the keepalive row" on public.keepalive for select to anon using (true);
    grant select on public.keepalive to anon;

(The fifth line was added 2026-10-02 after the first four ran: this project does not hand new tables to the public
key on its own, and the read came back "permission denied" until the grant.)

It holds one number and nothing else, so reading it reveals nothing. Until it exists, the daily check fails and emails you,
which is the point: a passing check now means the project is actually being kept awake.

**2026-09-23, theme pass: no new questions.** Every call in it was a build call (which deeper
shade, which fix for a label on the hospital map's painted sky) and Claude made it; the screenshots
are the veto. Two defects it found run as their own tasks, not here.

**2026-10-02, a new Rounds piece: the broken arm week.** David asked for it in the conversation, which Claude reads
as lifting the 2026-09-21 content hold for this one piece (CLAUDE.md precedence 1 over SPRINT.md). Plan and interview
notes: private/broken-arm-status.md (the raw notes moved to an archive outside the repo on 2026-10-03), in a folder git ignores, because this repo is public on GitHub and
the notes hold his medical details. R1 and R2 are live now; T3 waits its turn by rule 3.

| # | The question | Why it matters | Claude recommends | Open since |
|---|---|---|---|---|
| R1 | **Does the broken arm piece name the places and the people?** | It decides whether the piece reads as a patient's week or as a review of named facilities. Your telling (2026-10-02) puts both EDs and the ortho clinic inside your employer's medical group, so this is your employer's care and billing, written from inside. | No clinician names. Places described by what they are and how far apart: a small community ED ten minutes away, the trauma center down the road, an ortho clinic two towns south. Whether to run it past your employer's policy on public writing first is yours. | 2026-10-02 |
| R4 | ANSWERED 2026-10-02, David: "yes go wide". Built as the default: up to 1120px on a desktop, this figure only, phones unchanged; checked at 700, 1024, 1280 and 1920 with no sideways overflow. Original question: **Can the broken arm swim lane run wider than the text column on a desktop?** Up to 1120px instead of the 760px column; phones are unchanged. Screenshots 1 and 4 in the chat, 2026-10-02. | It is a new layout move for the site (CLAUDE.md: no new layout concepts without asking). In the column each lane is about 95px and most rows wrap to four lines; wide, they read in one or two, and the closed week is 1,696px instead of 1,962px. | Yes, for this figure only, on desktop only. The text around it stays in the column. | 2026-10-02 |
| R3 | ANSWERED 2026-10-02 (later superseded by the swim lane he described the same day): the grid, with the iceberg's best parts folded in. David: "the previous version I think did look this overall is a little bit more confusing so I think there's some middle ground." Built: the step card names the tool's own boxes, any box can be followed across the week, and the whole week shows the most-hit boxes. The iceberg version stays in private/ for reference only. Original question: **Which map carries the broken arm piece: the iceberg bands or the grid?** Both are built as private previews (private/broken-arm-map/preview-berg.html and preview.html), screenshots in the chat 2026-10-02. | You asked why the grid was chosen; it was Claude's call, made without showing you an alternative. The iceberg version is your own System Layers tool with the week lit through it and a tap on any card to see every step that hit it; the grid shows the week's order and shape in one picture. | The iceberg version: it is the map you meant, it teaches a reader your tool, and its counts (Billing 9 times, Registration 6) make the point on their own. The order in time lives in the prose. | 2026-10-02 |
| R2 | ANSWERED 2026-10-03, David: hold it. His manager reads it first, and it waits until after his next follow-up visit. Later the same day David moved it to the secret menu for review ("I don't think my website gets that much traffic I think hiding it in the secret menu is fine"), under the name "A Routine Fracture", accepting that the site and this repo are public: /secret-menu/a-routine-fracture/, noindex, out of the sitemap and site search, listed on the secret menu's "In the Back" shelf. The files in src/ are the working copy from here on. Original question: **Ship the broken arm piece now, or hold it until the bills come?** | The money is mostly underneath the waterline still. It surfaced once: a payment at the surgery center when you believed you had already met your out-of-pocket maximum (amount in the private notes, kept out of this public file). | Write it now while the week is fresh. That payment is the money node, and whether it comes back is the open question; add a dated update when the explanations of benefits land. | 2026-10-02 |
| R5 | **Does the broken arm piece stay in your own voice, or become a hypothetical case?** | Your manager is reviewing your first-person account. A hypothetical case puts distance between the piece and your employer, but it rewrites all twenty steps in the third person and loses the reason you wanted to share it ("this is what I used to keep my mind busy"). | Keep it first person for your manager's read, and convert only if your manager or the policy asks for distance. If it does, the honest version is a teaching case "based on the author's own week", not a made-up patient. | 2026-10-03 |
| S1 | ANSWERED 2026-10-03, David: "go with both, show new programs and campus marks". BUILT the same day (log). Original question: **Should the Schools layer show accredited programs that have not graduated anyone yet?** Noorda College of Osteopathic Medicine and Weber State's PA program are the local examples; nationally that is 52 PA, 9 DO, 7 MD and 56 RT programs, plus a handful of schools too new for the federal data at all. | The map draws a program only when it graduated people in 2023-24, so a student looking for schools today does not see the newest ones. The cross-check (docs/HU-SCHOOLS-CROSSCHECK.md) has the full list from the accreditors themselves. | Yes, marked as new with no graduate count, kept out of every count and rank so the numbers stay the federal year's. | 2026-10-03 |
| S2 | ANSWERED 2026-10-03 with S1, BUILT (log). Original question: **Should a program's other campuses get their own marks?** Rocky Vista University teaches DOs in Ivins, Utah, but IPEDS counts them in Parker, Colorado, so Utah shows no Rocky Vista mark. Today the Parker card says "Also taught at Billings, MT · Ivins, UT". | 42 DO, 29 RT, 11 PA and 7 MD campuses sit away from where the federal data counts them. A mark is where someone looking in Utah would look. | Yes: a campus mark that opens the main school's card and says its graduates are counted there. | 2026-10-03 |
| T1 | **Should the cost of living tool become the standard for every tool?** That means closing its design phase and writing its ten rules into DESIGN.md: answer first, explanations behind an "i", one fold, views, plain words, a source and date on every number, links that restore, the chart rules, little chrome, the phone as the shorter side. | You asked to take its lessons to the other tools. Until the rules are written down, nothing holds a tool to them and each rebuild argues from scratch. The full list with every tool measured against it is docs/HU-TOOL-REVIEW-2026-09-23.md. | Yes. What is left on the tool (about 546 words to sort) becomes ordinary maintenance under the written rules. | 2026-09-23 |
| T2 | ANSWERED 2026-10-03, David picked "cut them now and keep the ones that cite a source". BUILT the same night (log). Original question: **System Layers shows 113 numbers with no source.** Cut them, or have Claude hunt a source for each and cut what has none? | 301 "By the numbers" tiles; 188 name a source, 113 do not, and some read as invented ("8m 42s" average time, "98.2%" eligibility accuracy). The tool has no source line or date at all. | Cut them now. The 188 sourced tiles stay, and any that matter come back later with a source. | 2026-09-23 |
| T3 | **Which tool gets the cost of living treatment next?** Naming it opens its design phase. | Every tool not named stays under the change budget, so defects get fixed but nothing is redesigned. | The Vendor Directory (70 screens tall on a phone, the list starts below the first screen), then the Career Tree. | 2026-09-23 |
| G1 | **Uncharted Regional's staff strain never builds. Make it real?** | A playtest ran 28,571 quarters: strain peaked at 7 and no nurse ever quit, because it recovers 12 a quarter and can rise at most 9. So the strain warning never shows and the $45k a quarter Float Pool buys nothing. | Yes: strain recovers a little slower than the fastest it can build, so a hospital run flat out for a few quarters starts losing nurses and the Float Pool earns its price. | 2026-09-23 |
| M1 | ANSWERED 2026-10-03, David: "go, fix the telehealth measure next". BUILT the same night (log): replaced with Medicare telehealth use from CMS. Original question: **The Population Health Map's "Telehealth adoption" measure has no traceable source.** Keep it, or take it off the map until one is found? | Its source reads "Mixed: AHA, payer reports" and its method "various sources"; the one link was AHA's telehealth page, which moved (fixed 2026-10-03), and nothing on it gives state numbers. It is one of the older hand-entered measures the Vital Stats builder already leaves out because spot checks found some that no longer match. | Take it off until a state-level source is found, the way T2 recommends for the System Layers tiles. The other 71 measures keep their sources. | 2026-10-03 |
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

- **2026-10-03, very late, after the cut** SYSTEM LAYERS GETS ITS SOURCE LINE (David: "go, add the source line next"). The
  last tool without one. Its strip (behind the ⓘ, like every tool) now reads: "An editorial map of how care moves, not
  a dataset · each number on a card names its publisher in brackets; numbers with no source removed Oct. 3, 2026." The
  date says only what was done that day: every number was checked for a named publisher, not each figure re-verified.
  A test now holds every public tool page to having a source line (all ten do; the secret menu's Data Observatory is
  exempt as an internal page). 412 tests; phone gate clean.

- **2026-10-03, very late** SYSTEM LAYERS KEEPS ONLY SOURCED NUMBERS (T2, David: cut the unsourced ones, keep
  the ones that cite a source). Of 301 "By the numbers" tiles, 113 named no source, and 12 more had brackets that said
  what, not who ("(Avg.)", "(US)", "(individual)", "(STEMI)"). All 125 are gone from the file itself, not hidden, since
  the repo is public: among them "8m 42s" average registration time, "98.2%" eligibility accuracy, "#1 Market Share"
  and "99.9% Uptime SLA" on the EHR card. Two real figures had their source in their words and were kept with a proper
  tag after a check against IRS Revenue Procedure 2023-23: the 2024 HDHP minimum deductible ($1,600) and HSA limit
  ($4,150), self-only. 176 numbers remain, every one naming its source; 35 cards now show no numbers and read cleanly
  without the section (what happens, who, which systems, the pain points). A test fails if an unsourced number comes
  back. Found on the way and fixed: at 700 to 768 wide the breadcrumb bar clipped a deep trail, so on Registration it
  showed "Healthy Patient → Minor Illness" and hid the card you were on; it now scrolls and opens on its end. Still open
  from the tool review for this tool: a source line and date for the page. 410 tests; phone gate clean.

- **2026-10-03, last of the night** NEUTRAL MEASURES SHOWN AS NEUTRAL (David: "go, fix the neutral measures next").
  The Population Health Map drew its 15 measures with no better or worse (median age, the population shares, hospital
  and critical access counts, Medicare enrollment share, Certificate of Need scope, household size, Medicare
  telehealth use) on the red-to-teal "worse → better" scale, so a young state read red, and its card said
  "#51 of 51, 1 = best" (Utah's median age). They now shade slate to amber under "lower → higher", the Career Tree's
  pay ramp, so no color is new; rank "1 = highest" with no good or bad tint; the rankings list reads "Highest first";
  and a comparison says "FL higher", not "better". Measures with a better end are unchanged (the uninsured rate still
  reads worse → better, "UT better"). The Hospital Operations Map's county shading only offers measures with a
  better end, so it needed nothing. DESIGN.md Tier 3: "Only a measure with a better end says better". Checked at 360 and
  1280, light and dark. 408 tests; phone gate clean.

- **2026-10-03, later** THE TELEHEALTH MEASURE FIXED (M1, David: "go, fix the telehealth measure next"). The Population
  Health Map's "Telehealth adoption" claimed the share of outpatient visits by telehealth, from "mixed: AHA, payer
  reports", with numbers nothing could trace (every one a round quarter point, and North Dakota the highest). No public
  source gives that for every state and payer, so the measure is now what one does: Medicare telehealth use, from
  CMS's Medicare Telehealth Trends (release of 2026-09-16, the full year 2025): the share of people in Original
  Medicare who had a telehealth visit, out of those with any service Medicare allows by telehealth. National 23.3%;
  California 40.3% highest, Iowa 10.1% lowest, Utah 17.6% (checked against the live CMS API). North Dakota, the old
  top, is 10.4%. Its card says whose visits it counts (Original Medicare only, not Medicare Advantage or private
  plans). New pull, `node scripts/pull/telehealth.js --write`, which finds CMS's current file each quarter. The map
  also stopped drawing an invented history for it: a fixed 8% a year growth made a smooth climb, while CMS's claims
  show 47.9% in 2020 falling since, so the measure shows its real year only. Old links to "telehealth-adoption" still
  open it, and the Atlas's two telehealth tiles still point to it. On the way: the accreditor pull wrote its file on a
  dry run (pull/all.js runs every pull), now fixed and tested for every pull. Seen, not fixed here (its own task): the
  map draws its 15 neutral measures as if higher were better ("worse → better", "1 = best"). 405 tests; phone clean.

- **2026-10-03, late** SUPPLIER DATA REFRESHED (David: "go, refresh the supplier data next"). The map's equipment
  supplier, optical, orthotics and pharmacy layers now come from CMS's Medical Equipment Suppliers release of
  2026-09-27, fetched 2026-10-03. They had been built from a June 6 copy: the build reused its cached download forever
  and nothing printed its age, so even this morning's supply-type work ran on June data. Now `npm run build:suppliers --
  --refresh` downloads the current release, and every file and the supplier card say which release it is ("released
  Sept. 27, 2026, checked Oct. 3, 2026"; the card used to say "June 2026 pull" by hand). What changed: pharmacies
  40,606 to 40,617 (766 new, 755 gone), home equipment 6,367 to 6,263, optical 5,023 to 4,922, orthotics 4,566 to
  4,462. The per-state pharmacy files the map loads were rebuilt to match, and 573 hospital cards' same-ZIP pharmacy
  counts moved with them (nothing else on those cards changed). Two defects found on the way: rebuilding the pharmacy
  files also rewrote the map's state outlines from an older source missing Puerto Rico (put back from the commit;
  the builder now has a pharmacy-only mode and refuses to drop a state), and the search pill read "Search 0
  pharmacies" after picking a state until its pharmacies loaded (now it recounts). One more seen in the screenshots: on
  a phone, a long value squeezed a one-word label under itself ("SPECIALTY" on a supplier card); labels now keep their
  longest word whole, and the program, campus and hospital cards were rechecked after. Tests hold the release date, one
  release across all four files, and the pharmacy files matching the list. 402 tests; phone gate clean.

- **2026-10-03, night** NEW PROGRAMS AND CAMPUS MARKS (David: "go with both, show new programs and campus marks",
  S1 and S2). The Schools layer now draws, as hollow mortarboards and hollow program buttons, what the accreditors list
  and the federal year does not count: 76 accredited programs with no graduates yet at schools already on the map
  (Weber State's PA program shows as a hollow button in its pop-out and a "New, no graduates yet" row on its card), 17
  new schools, 7 schools outside the federal data (Noorda, Meritus, Orlando's osteopathic college, Alice L. Walton,
  Kaiser Permanente's school, USUHS, and the military programs at Fort Sam Houston as one mark), and 64 campuses whose
  graduates count under their main school (Rocky Vista in Ivins, Utah and Billings, Montana; LECOM's four campuses;
  Penn State in Hershey). Each mark's card says why it is hollow, where it was placed (the school's federal location,
  CoARC's street address through the Census geocoder, an address checked on the school's own site, or the center of the
  city the accreditor names) and who accredits it; a campus card opens its main school. They live in their own map
  source, so no count, rank, ring or list changes: Utah still shows 3 PA programs. Only strong name matches become
  marks (weaker calls stay in the report), schools outside the federal data come only from the hand-checked table, and
  the four hollow marks that would sit on a filled school step a few pixels aside (Noorda beside Rocky Mountain
  University). Search finds them ("noorda", "rocky vista utah"). Reading the first list by hand caught five wrong
  matches before any reached the map (St. Mary's Medical Center in West Virginia matched to a college in Indiana, among
  them); the rules and eight more hand pairs fixed them. DESIGN.md Tier 3: "Hollow means on the map, outside the counts".
  401 tests; phone gate clean on the three new card kinds.

- **2026-10-03, evening** THE ACCREDITOR CROSS-CHECK (David: "go, start the accreditor cross-check", after asking how we
  know the school data is solid). Every program the Schools layer draws from IPEDS is now held against the accreditor's
  own list: LCME (MD), AACOM (DO), ARC-PA (PA), CoARC (RT), CCNE and ACEN (nursing), all public pages read 2026-10-03.
  `npm run pull:accred` saves names, places, statuses and dates (never a director's email or phone; a test holds that);
  `npm run check:schools` matches each program to a federal school and writes docs/HU-SCHOOLS-CROSSCHECK.md. Results:
  every MD and DO program on the map is on its accreditor's list, and every accredited one is accounted for. Not in the
  federal data: Noorda, Meritus, Orlando COM, Alice L. Walton, Kaiser Permanente's school, and the military schools.
  Three schools were renamed in 2026 after the federal year (Mississippi College, the MGH Institute, SHSU's osteopathic
  college; checked against their own announcements). One real defect, fixed: 18 respiratory therapy programs
  (Salt Lake Community College, Carrington College's campuses, Mandl, Kettering, Highline) file their degrees under the
  old "Respiratory Therapy Technician" code, which the map did not count. It now does, at associate and bachelor's: RT
  went from 375 schools to 393 and 6,495 graduates to 6,880; Utah now has four RT programs, not three. Vital Stats
  rebuilt (3,675 questions). Program cards for MD, DO, PA and RT now say who accredits them and any other campus
  ("Rocky Vista University ... Also taught at Billings, MT · Ivins, UT"). Nursing stays in the report: accreditation is
  voluntary there, and DNP doctorates are filed under too many codes to call. A test fails if the school file changes
  without a fresh check, or if a hand-checked pair outlives its accreditor row. 400 tests; phone gate clean.

- **2026-10-03, last** THE SCHOOLS MAP FOLDED INTO THE HOSPITAL OPERATIONS MAP (David: "take it and absorb it into the
  healthcare operations map", with a school icon that pops out into the program icons when selected, and good search
  for schools and programs). Schools is now a layer on the hospital map (Layers, or ?layers=school), with a Programs
  pill beside Types. A school is ONE mark, a mortarboard, however many programs it lists: the three Rocky Mountain
  marks in south Provo were its PA, NP and DNP programs fanned around one address, which read as three schools. Tap a
  school and its programs pop out around it on spokes, one button each in the program's shape and color; a button
  opens that program's card (graduates, place in the state, share of the state's graduates, nearest other program),
  and Back returns to the school. The school card lists its programs and its three nearest hospitals, which open
  their own cards. Search finds schools and programs with the layer off ("respiratory therapy utah" gives Weber State,
  Utah Valley and Utah Tech; picking one turns the layer on and opens its RT card). Rings count schools as their own
  slice. The /tools/healthcare-schools-map/ page, its Tools card, thumbnails and share card are gone; the operations
  map's card and share card now say healthcare schools. All 344 Vital Stats school questions now open the operations
  map with the Schools layer on, and their answers recompute from the same file in the tests. Noorda College of
  Osteopathic Medicine (Provo) is NOT in the federal college data at all: it only became eligible for federal student
  aid after its first class graduated in 2025, and the IPEDS year on the map is 2023-24. Phone gate clean on four
  views; checked in a browser at 360 and 1280, light and dark.

- **2026-10-03, later still** C1 ANSWERED: RINGS (David: "go with B, rings"). Both facility maps now draw a cluster as a
  ring sliced by what is in it, in the icons' colors, with the count in the middle, and break into the real icons a zoom
  level sooner (clusterMaxZoom 7, was 10; a 30px catch radius, was 46). The ?look= switch and the spread-only path are
  deleted; DESIGN.md Tier 3 (the instrument grammar) now says "a cluster shows its mix". Checked in a browser on both
  maps, dark and light, phone and desktop: a tap on a ring zooms in, and a filter rebuilds the rings (critical access
  only gives all-gold rings). The phone gate's floating-over-a-control check measured overlap only, so it flagged the
  rings where they pass UNDER the drawer and the map's credit button; it now asks the browser what is painted on top at
  the overlap, and a temporary test page proved it still flags a caption painted over a button (clickable or not) and
  skips one hidden under a panel. 394 tests; phone gate clean on both maps, the Population Health Map and Vital Stats.

- **2026-10-03, late night** HOSPITALS UNDER THE SCHOOLS, AND THREE CLUSTER LOOKS TO PICK FROM (David: "overlay the
  nearest healthcare systems or hospitals next to Med schools or nursing schools... a toggleable", and the blue bubbles
  could be "a better way... help with granularity"). Built: the schools map has a Hospitals layer (Layers, or
  ?hospitals=on), muted grey crosses under the school icons, never counted with the programs; a tap opens a short
  hospital card (type, beds, stars, system, ER) that links to its full card on the hospital map; a state or county card
  counts the hospitals there while the layer is on; and every school card lists its three nearest hospitals with miles,
  beds and system (Utah Valley University: Orem Community 1.6 mi, Timpanogos Regional 2.3, Aspen Grove Behavioral 3.4).
  RN programs became circles so the cross means only a hospital on that map. For the clusters, two looks are built
  behind a temporary ?look= switch: A, spread (icons from zoom 8 instead of 11, a smaller catch radius), and B, rings
  (spread plus a ring around each cluster sliced by what is inside, in the icons' colors). Comparison pictures went to
  David; question C1 below. Proof: 394 tests, phone gate clean on both maps, with the hospital layer on and on a school
  card.

- **2026-10-03, night** STEP 5, MAP POLISH (David: "go, start step 5 map polish"). Six fixes, each a defect:
  (1) On a phone, a scoped view squeezed the search box ("Search 3,596 equipment suppliers" showed a sixth of itself):
  the back chip now reads short on a phone ("◀ U.S.", "◀ UT", "◀ Exit"; the full sentence stays its spoken label), and
  with a place open the box drops its count (the List button and the card carry it). Both facility maps.
  (2) The phone gate counted a card that a link opened (?fac=, ?state=, ?sys=) as 120px of chrome on both U.S. maps; it
  now treats an open detail sheet the address asked for as content, the way it already treated a dialog. Checked first
  that the sheet is closed at rest on all five pages that have one, so a sheet open on a bare address still counts.
  (3) The Population Health Map's year control faded whole to 50% on a one-year measure, so the map showed through and
  the year went dim; now only its disabled arrows are faint. (4) Vital Stats' answer box showed a big grey 82000 (82k on
  a desktop) on every question, which anchors a guess and read as nonsense on "how many schools in Utah" (answer: 3); the
  box is empty now and the hint underneath says how to type big numbers without naming one. (5) Source links on the
  Population Health Map: the RN and RT staffing measures pointed at BLS pages that no longer exist (now the May 2022
  state estimates, their vintage), AHA's telehealth page moved, and six more redirected after agency site moves; all
  point at the live page now (17 measures), and the PLACES pull writes the new address too. Census table links answer a
  script with 403 but open in a browser, so they stay. (6) The data observatory now lists the cost report file and the
  school file, their sources, pull scripts and the schools map (77 nodes, 101 links). Looked into and left: the "found
  null" console warning on zoom comes from OpenFreeMap's light basemap itself (it shows with none of our code loaded,
  and not on the dark style). Proof: 394 tests, phone gate clean on both facility maps, the Population Health Map and
  Vital Stats, including the scoped views that failed before; the schools map's national counts still read off the
  search box.

- **2026-10-03, evening** STEP 4, EQUIPMENT SUPPLIER TYPES ON THE HOSPITAL OPERATIONS MAP (David: "go, start step 4
  equipment supplier types"). CMS's supplier file lists what each location carries, 86 categories in CMS's own words; the
  map had never read that column. Now the home equipment, orthotics and optical layers can be filtered by what a supplier
  carries, in 13 plain groups: oxygen; CPAP and BiPAP; ventilators and airway care; nebulizers; wheelchairs, scooters and
  walkers; hospital beds, lifts and commodes; diabetes supplies; feeding and infusion; wound, ostomy and urology; braces
  and prostheses; glasses and contacts; stimulators and other devices; Part B drugs. Utah has 77 home equipment
  suppliers and 48 carry oxygen. Claude's calls, veto by looking: the groups (every CMS category sits in exactly one;
  the build names any new category CMS adds so it is not lost); a supplier shows when it carries ANY chosen group, the
  way hospital types work; a "Supplies" readout pill beside Layers and Types while an equipment layer is on; the filter
  rides the link (?supplies=oxygen); pharmacies are left out, since their lists are drugs and glucose meters. A
  supplier's card now has a kicker that says what it is, its CMS specialty in plain case ("medical supply company with
  respiratory therapist"), whether it accepts Medicare assignment (Medicare.gov: agreeing to charge only the deductible
  and coinsurance; about a third of home equipment suppliers do), its supply groups as chips and every CMS category
  behind a disclosure. Dropped: the competitive bidding flag, which is zero for every supplier. Fixed in passing: the
  orthotics layer's suppliers drew with the long-term acute hospital icon and showed no count on their layer chip,
  because the file names that kind "orthotics-prosthetics". Data: the same June 2026 pull, rebuilt; pharmacy and state
  count files came out byte-identical. CMS updated the supplier file 2026-09-27; refreshing it is one command and also
  refreshes the pharmacies. Proof: Utah's oxygen count on the map equals the file's (48 of 77); a new test holds every
  category to one group and every supplier's mask to its categories; 394 tests; the hospital map's 290 and the schools
  map's 339 answer checks re-run after the engine change; phone gate clean on both maps. A filtered state view on a
  phone still trips the two step 5 items (the squeezed search box, a card counted as chrome).

- **2026-10-03, later** STEP 3, VITAL STATS SCHOOL QUESTIONS (David: "go, add the Vital Stats school questions"). 344 new
  questions in the Workforce category, built from the same school file the Healthcare Schools Map draws, so every
  answer is on the map: how many U.S. schools awarded each of the seven programs; how many RN, RT, PA, MD and DO degrees
  the country awarded; the most one school awarded (Chamberlain's 7,843 RN degrees, with the online note; Boise State's
  190 RT, mostly bachelor's; Indiana's 349 MDs; Lake Erie's 640 DOs; Lynchburg's 440 PAs); each state's count of RN, RT,
  PA and MD schools; each state's place by RT schools and its RT and PA degrees; and two Utah programs (Weber State's
  67 RT degrees, the University of Utah's 111 MDs). 26 are in the everyday mix, the rest deal in state games. Claude's
  calls, veto by playing: one wording per question naming the degree and the school year, with a line under it saying
  what counts (RN to BSN finishers included; DNP apart from NP); the answer line says when a school is mostly online
  and when one degree level dominates. Each answer screen links to its view: the program filter (the search box now
  says how many programs are on under a filter, on both maps), a state's card under that filter, or the school's own
  card. Links: 3,505 of 3,669 everyday and state questions open on their exact number (was 3,166 of 3,325); the 5
  national degree totals are near, since the map shows them by state and school, not added up. Proof: all 339 exact
  answers read off the live map in a browser (200 views), a new test recomputes every one from the file, 391 tests,
  phone gate clean on the game, the schools map and the hospital map.

- **2026-10-03** STEP 3, THE HEALTHCARE SCHOOLS MAP (David: "go, start step 3 schools map"). New page,
  /tools/healthcare-schools-map/, with its own card on the Tools page (Careers & Pay shelf), a share card and a
  thumbnail. Every U.S. school that graduated at least one student in 2023-24 in seven programs: registered nursing
  (2,016 schools), nurse practitioner (373), doctor of nursing practice (313), MD (149), DO (36), physician assistant
  (259), respiratory therapy (375); 2,187 schools, 3,521 programs. Source: IPEDS, the federal college survey (NCES), by
  a new pull, scripts/pull/ipeds.js. It runs on the Hospital Operations Map's own engine and shell (same camera,
  drill, search, draw, locate, links), so a fix to one map is a fix to both; the hospital page's built HTML was proved
  byte-identical before the two pages diverged on purpose. Claude's calls, veto by looking:
  (1) One dot per program, so the chips and counts count programs; a school's programs fan out around its point so
  each can be tapped. (2) A program's card: graduates that year by degree level, its place in the state, its share of
  the state's graduates in that program, the nearest other school with it, the school's other programs, its website.
  (3) DNP is its own program. The University of Utah files its nurse practitioner doctorate under registered nursing
  at the doctorate level, and the DNP code mixes NP doctorates with DNPs for nurse leaders, so neither can be counted
  as NP honestly. (4) Online schools are flagged. Western Governors puts 5,750 graduates in Salt Lake City, Chamberlain
  11,392 in Illinois, Capella 8,000 in Minnesota; a card shows the share of students studying only online, and a state
  card says how many of its graduates come from mostly online schools (Utah: 6,662 of 10,736). (5) The label says
  provisional. NCES's schedule page lists the final 2023-24 data for 2026-09-08, but on 2026-10-03 the file was still
  the provisional one posted 2025-09-21, so the pull reads each file's own dictionary for its release line and the
  label will correct itself on a re-run. Also fixed on both maps: at tablet widths the loading message sat on the List,
  Draw and Locate buttons whenever a card was open, and a shared link no longer says "tap a state to zoom in"; search
  now matches every word in any order, and state names. Proof: 5 new tests (390 in all), phone gate clean on the new
  page at all nine sizes, and the hospital map's 290 type and 548 state checks re-run after the engine change, all
  matching (14 of the state ones read empty while other checks loaded the server, and matched on a second run alone). Left
  open: on a phone, a card opened by a link counts as chrome over the budget (the same on hospital links; the
  landscape problem in docs/HU-BUILD-HARDENING-2026-08-22.md); the data observatory map (scripts/build-datamap.js)
  lists neither this file nor the cost report file.

- **2026-10-02, late night** STEP 2, SYSTEM CARDS GAINED A BY TYPE BREAKDOWN (David: "go, add the by type line"). A
  health system's card on the Hospital Operations Map now opens with "By type": its hospitals by kind, most first, then
  how many sit outside a metro area by the county CMS records. Intermountain reads Acute care 23, Critical access 7,
  Children's 1, Outside a metro area 11 of 31. Claude's calls, veto by looking: By type sits above By state because it is
  short; the metro row says "outside a metro area" so it is never confused with the map's "Rural emergency" hospital
  type; that row appears a moment after the card, when the Provider of Services file lands. Links: 23,606 of 23,641
  health system questions now open on their exact number (was 23,316); the 35 left are the systems' own published
  figures, which the map does not carry by design. Across both games 26,772 of 26,966. Also fixed in passing, a defect:
  the search box's clear X showed all the time, even with nothing to clear, and at 360 on a system or state view it sat
  on the placeholder text; it now shows only after a search pick. Proof: all 290 critical access and metro questions
  across 174 systems matched the card in a browser, 385 tests, phone gate clean on the map page. Still open for step 5
  (older than this work, same on a state view): at 360 a scoped view squeezes the search box to "Search…", and the load
  message says "tap a state to zoom in" even when a link opened a system or a state.

- **2026-10-02, late night** STEP 2, SYSTEM CARDS GAINED A BY STATE BREAKDOWN (David: "go, add the by state breakdown to
  the system card"). A health system's card on the Hospital Operations Map now lists each state it is in, with its
  hospitals there out of every hospital the map shows in that state and its share: Intermountain reads Utah 22 of 52
  (42%), Colorado 5 of 97, Montana 3 of 63, Idaho 1 of 48. Claude's calls, veto by looking: biggest state first; the
  state's total counts whatever hospital types are showing, like the rest of the card; the new sections are spaced like
  the card's Services block. Links: 23,316 of 23,641 health system questions now open on their exact number (was
  22,768); across both games 26,482 of 26,966. Left: a system's rural and critical access counts (290), the systems' own
  published figures, and the everyday list's 137 near and 22 with no page. Proof: all 548 state and share questions across
  148 systems matched the card in a browser, 385 tests, phone gate clean.

- **2026-10-02, late night** STEP 2, HOSPITAL CARDS GAINED THEIR MEDICARE COST REPORTS (David: "go, put the cost report
  numbers on the hospital cards"). On the Hospital Operations Map, a hospital's card now has a "Medicare cost report"
  section: beds on its cost report, ICU beds, inpatient discharges, average stay, beds in use on an average day, Medicare
  and Medicaid share of inpatient days, employees (FTE) and resident physicians (FTE), with the fiscal year and source. A
  health system's card adds the same totals across its hospitals. Claude's calls, veto by looking: the numbers come from
  a file the Vital Stats builder writes with the questions' own formulas, so a card and a question can never disagree
  (a refactor proved it: all 251 game files came out byte for byte the same); where the cost report gives residents, the
  card drops the older Provider of Services resident count (Intermountain Medical Center: 75 FTE on the cost report, 19 in
  the old file); VA hospitals, which file no cost report, show no section. Links: 22,768 of 23,641 health system questions
  now open on their exact number (was 349). Left: a system's hospitals in one state, its rural and critical access counts,
  its share of a state, and the systems' own published figures. Proof: a new test checks every cost report question's
  answer against the card its link opens (22,000+), the cards read right in a browser at phone and desktop, 385 tests,
  phone gate clean.

- **2026-10-02, late night** STEP 2, RANKINGS CLOSED (David: "go, do the rankings next"). Claude's calls, veto by playing:
  the Population Health Map numbers places "1 = best", so the four rank questions where lower is better (adult obesity,
  smoking, uninsured, high blood pressure) now ask "lowest first" and their answer is the place the map shows; income and
  age were already "highest first", the map's way; a build check stops the two from drifting apart. The Hospital
  Operations Map's state card gained one row, "Rank among the 50 states: #37 by count, most first", counting whatever
  layers and hospital types are showing, the way a hospital's card already places it by beds; DC and the territories
  get no rank. Links: 3,166 of 3,325 questions now open on their exact number (was 2,814). Proof: all 302 health ranks
  match the map's own ranking rule, all 50 hospital ranks match the state card in a browser, 384 tests, phone gate clean
  on both maps and the game. The work list is one living file now, docs/HU-VITAL-STATS-LINKS.md. Left there: the health
  system cards (cost report numbers, most system questions), hospital counts the map cannot filter (96: five-star,
  for-profit, no emergency room), 22 U.S. totals, 22 facts with no page, and a handful of counts and gaps.

- **2026-10-02, late night** STEP 2, FIRST GAP CLOSED: PAY BY STATE IS ON THE POPULATION HEALTH MAP (David: "go, put pay
  by state on the population health map"). The Clinical lens has ten new measures, one per job (registered nurse,
  respiratory therapist, LPN, nurse practitioner, physician assistant, pharmacist, radiologic technologist, nursing
  assistant, medical assistant, health services manager): BLS OEWS May 2025 state medians for all 50 states and DC, from
  the same pull that feeds the game (scripts/pull/oews-states.js now writes both), source page checked live 2026-10-02.
  Claude's calls, veto by looking: they sit in the Clinical lens next to the nurse and therapist staffing measures, as
  "<job> median pay"; higher pay colors as better; the state card adds a "Per hour" row (the yearly median over BLS's
  2,080-hour year), so the game's hourly questions land on their own number too; the card's national average now rounds
  to whole dollars. The site says 72 metrics now (it said 62) in the tool card, the map's page description, its welcome
  line and its share image. Links: 2,814 of 3,325 questions now open on their exact number (was 1,794); the next biggest
  gap is the 352 state ranks. Proof: 384 tests, every pay measure opened on Utah with BLS's figure, the 45 distinct map
  views the game links to all hold, phone gate clean on the map and the game.

- **2026-10-02, night** VITAL STATS STEP 1 BUILT: EVERY ANSWER LINKS TO WHERE ITS NUMBER LIVES (David approved the
  five-step order: links first, then the gaps they show, then schools, then equipment types, then map polish). The
  answer screen now has one link, for example "See Utah on the U.S. Population Health Map", that opens a new tab on the
  exact view: the measure and state (or county) on the Population Health Map; the hospital type, dialysis or surgery
  layer, health system or single hospital on the Hospital Operations Map; the job or exam on the Career Tree. Claude's
  calls, veto by playing: the link shows only after the reveal, so nobody can look an answer up mid-round; a new tab,
  so the game keeps your seat. Coverage: 3,303 of 3,325 everyday and state questions and all 23,641 health system
  questions link somewhere; 1,794 and 349 of them open on a view that shows the exact number. The rest open on the right
  place without the number yet, and docs/HU-VITAL-STATS-LINKS.md lists them biggest first: pay by state for a
  job (1,026, on no map), state ranks (352), hospital card numbers from the cost reports (most system questions), and 22
  national facts with no page. That list is step 2. Proof: a test checks every link against the tool's own data, and in
  a browser every distinct map view (35) and every linked Career Tree card (33) opened on the right thing.

- **2026-10-02, evening** PUSHED (29b2430, "vital stats game") AND CHECKED LIVE. GitHub's check passed. On
  healthcareuncharted.com: the game at /fun/vital-stats/; the old address answers 301 with its room code kept; the Tools
  page's Fun shelf with both games; no games left on Learn; Vital Stats first in "New on the site"; sitemap, feed and
  search carry it; every file it loads answers. Over the real relay on the live site: three browsers played trivia and
  an Intermountain game identically, and a phone joined a room from the QR code read off the live big screen.

- **2026-10-02, evening** KEEPALIVE TABLE DONE. David ran the five lines; the daily check's exact request now answers
  200 with the one row, so it is a real database read that counts toward keeping the free project awake. The pause
  question is closed; the daily schedule starts with the next push.

- **2026-10-02, evening** THE FUN SHELF MOVED TO THE TOOLS PAGE on David's ruling ("Games and other things that we would
  put in the Fun section should go under the Tools tab not the Learn tab and maybe have a subsection for just fun
  tools"). The Tools page has a fourth shelf, Fun, after Learn & Play; both games ride the same tools list as every
  other tool (cluster `fun`), the Tools tab lights up on them, their Leave rows and Alarm Fatigue's "Back to Tools"
  links go to it, and an old link to the Learn page's Fun shelf lands on the new one. Claude's call: the addresses stay
  /fun/alarm-fatigue/ and /fun/vital-stats/, so nothing already shared breaks. Verify 380 green, phone gate clean on
  Tools, Learn and both games.

- **2026-10-02, evening** GAME SERVER RESTORED by David; it resolves again. Over the real relay, all green: Vital Stats
  trivia, betting, a health system game and teams (three browsers each, every copy identical), the hospital game's
  resume and rejoin, Device Assembly's race, and a phone joining a room from the QR code read off the big screen. The
  keepalive table was not there yet (404), so the SQL step above is still David's.

- **2026-10-02** David on the pre-push list and the screenshots: "all looks good to me". Vital Stats stays featured (home
  page and RSS). Still open before the push: the game server is offline (DNS checked again this morning, still gone), and
  the real-relay check waits on it.

- **2026-10-01, late** VITAL STATS TOUCHED UP AND MOVED TO THE FUN SHELF on David's ask ("a clean up or a touch up on the
  UI for the whole tool and then we can move it to the tool section or the fun section in learn"). Claude's calls, veto
  by looking: the Fun shelf, because Alarm Fatigue set the pattern there (/fun/<game>/, a card on the Learn page's Fun
  shelf); the address is now /fun/vital-stats/ and the old one forwards with its room code; it is featured, so it leads
  "New on the site" on the home page and goes out in the RSS feed, as Alarm Fatigue did at launch; it left the secret menu.
  Two read-only reviews (the site auditor and the polish reviewer) found about fifty things; fixed: on any laptop or tablet
  the lobby could not scroll, so the deal button was out of reach (the tool shell pinned the page); home turf never paid
  in Trivia (now the closest guess gets its 2 twice, as betting doubles its 3); a game with bots now holds the answer until
  Next instead of 10 seconds; Restart in the menu restarts (it used to leave), Esc opens the menu; a new screen starts at
  its top and at its question; a lobby change swaps only the part that changed and keeps focus on the pressed control;
  phones are no longer told to type "82k" on a keypad with no k; type under the floor, faked bold numbers, light-theme
  chip edges, the BOT tag hidden on phones, a toast over the phone's button, a two-row toolbar in a room on an iPhone,
  thirty-odd hand-set styles, and the table changing width from screen to screen. The shared table kit now tells a host
  when the game server does not answer, for every multiplayer game. Left as Claude's call: no Settings card (the lobby's
  Clock already gives Relaxed time); the explain-on-tap cards stay a phase for the three games named in CLAUDE.md. Proof:
  380 tests, the phone gate clean on the game, Learn, the secret menu and the home page, every fix measured in a browser.

- **2026-10-01, night** VITAL STATS: TRIVIA BY DEFAULT, GAME LINKS, QR CODE JOIN, BUILT on David's ask ("set as default
  mode as trivia... select all the details before you send out the link... make something and send to somebody... a QR
  code sign up for big screens"). A new table plays Trivia; Guess and bet is the other style. Claude's calls, veto by
  playing: the host's last lobby comes back next visit (style, rounds, clock, source, teams, topics; never the bots); the
  bots lobby has Create a room, and the settings come along; Copy game link turns a lobby's settings into a link anyone can
  open and play at their own table, with fresh questions each time (the link carries settings, not a question list); a
  room card shows its QR code on a laptop and has Big screen, which fills the screen with the code, the room letters, who
  is in, live, and the Deal button; on a phone the same view opens from Show QR code. The QR code is drawn on the page by
  a new kit file (src/assets/js/hu-qr.js), no outside library. Proof: 377 tests; 338 codes of every size decoded by an
  independent reader; in real browsers the code read off a screenshot of the big screen opened the room on a second
  screen, the count went to 2, and Deal started the game. The internet relay could not be tested that night (see NEEDS
  YOU), so the joins ran over the same-browser transport.

- **2026-10-01** VITAL STATS TRIVIA MODE, BUILT on David's ask ("a version of the game that doesn't have the betting...
  a large trivia game with a fun group of people"). Lobby: Game style, Guess and bet or Trivia. Claude's calls, veto by
  playing: no betting means no board, so trivia seats everyone up to 48 each for themselves (betting stays eight, the rest
  watch, and switching styles moves people in and out); points by how far off, over or under: within 5 percent 5, 10
  percent 4, 20 percent 3, 35 percent 2, 50 percent 1, and the closest guess 2 more; a rank question counts places off
  instead (exact 5, one place 4, three 3, six 2, ten 1); trivia can run 15 rounds; a big room's reveal, rail and final
  table show the top ten and you. Works with teams and with health system games. Proof: 369 tests, the real relay
  identical for trivia alone and trivia in teams.

- **2026-10-01** VITAL STATS TEAM PLAY, BUILT on David's pick ("Teams", for company-sized games). In a room the host picks
  Play as: Each person or Teams, and 2 to 8 teams. Up to 48 people; everyone lands on the smallest team and can switch in the
  lobby. Claude's calls, veto by playing: anyone on a team can type the team's guess and place its chips, and the first lock
  counts ("Locked in by Dana" shows to the team); teams are named Day Shift, Night Shift, Swing Shift, Float Pool, Rapid
  Response, Code Team, Charge Desk and Weekend Crew; bots can still sit in, as their own entries, in the places teams leave;
  no home turf in team play; a team with nobody on it sits the game out. Under it, a change to the shared table kit every
  multiplayer game uses, opt-in so the others are untouched: the relay (Supabase, free plan, checked live today) counts each
  message once per receiver and allows 100 a second, so guests now send to the host alone and a big room's updates are spaced
  out. Proof: 365 tests, three-browser real-relay checks for team play, a normal game and a health system game, and the
  hospital game and Device Assembly relay checks still identical.

- **2026-10-01** VITAL STATS QUESTIONS, ONE WORDING EACH, on David's read after playing: "there is some variation but I
  think it also leads to misinterpretation... make it so it can't be misinterpreted even if there needs to be subtext".
  Every kind of question now has ONE wording that names what is counted, where and when, and a line under it where a
  definition decides the number ("Medicare Advantage plans included. Counted in days spent in a bed, not in people.").
  The retired sayings ("Half the households earned more than...", "Out of every 100 adults, how many...") are gone and a
  test keeps them gone; another test fails if the same fact is ever asked two ways. Claude's calls, veto by playing: the
  9/24 variety rule loosened from a quarter of openings to a third, because "What percent of" now opens 28 percent of the
  everyday mix and that sameness is the point; the line under the question shows while guessing, betting and at the
  reveal. His other question, answered: 8 players a table (bots take seats), everyone past 8 watches; the relay's free
  plan allows about 200 connections across all the games. What a company-sized table should be is his next call.

- **2026-10-01** VITAL STATS HEALTH SYSTEM GAMES, BUILT on David's ask ("stats about specific hospital systems... a fun game
  that you can play with people within your company"). Claude's calls, veto by playing: every system that can fill a game is
  in the picker (250), his four first; Northwell Health is the East Coast pick; public numbers only, nothing from inside
  Intermountain; Medicare and Medicaid shares count managed care (without it Primary Children's reads 13 percent Medicaid
  instead of 44); the federal list's hospital count (31 for Intermountain) and the system's own (34, one virtual) are both
  asked, never in one game; home turf is off in a system game; burn beds and the federal staff counts are left out because
  they failed a spot check against hospitals David knows (McKay-Dee with 58 nurses). Open, and it is his to do, not a
  decision: read docs/HU-VITAL-STATS-INTERMOUNTAIN-CHECK-2026-10-01.md and flag any wrong row. Same day, his call: no staging
  branch, everything stays on main; the test server is the dev server on the home wifi.

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
