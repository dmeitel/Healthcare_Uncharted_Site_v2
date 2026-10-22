# Daily Huddle's new data sets: the plan

2026-10-20. David, on adding lab normals and drug classes and working through the ranked list of data sets in
docs/HU-HEX-TRIVIA-PLAN-2026-10-14.md: "yeah all of those sound good". This is the plan for his yes. The sources were
checked live today; the full notes are in tmp/huddle-v4/sources-2026-10-20.md and summed up below.

## Where it stands

Bank version 3 holds 3,186 questions, and every category has 300 or more but one. Medical Science has 228, and 212 of them
are dose math. The other 16 are the adult normal ranges, which the daily deals one board in four at most. There is nothing
about drugs except the math (DH2: drugs only as facts, doses only as math). Health Tech has six ICD-10 codes, the odd ones
(struck by a duck, struck by an orca).

So the category a clinician would expect to be the deepest is the thinnest, and it is mostly arithmetic.

## What the live checks found (2026-10-20)

- DRUG CLASSES. The FDA gives every drug an "established pharmacologic class" (Beta-Adrenergic Blocker, HMG-CoA Reductase
  Inhibitor), and it is free to reuse: openFDA is CC0, and NLM's RxClass needs no license (NLM asks for a "courtesy of
  NLM" line and no logo). The class has to come from RxClass, not the label data. On the labels, metoprolol came back
  as a thiazide diuretic, because its combination pills carry the water pill's class, and sertraline came back with no
  class at all. RxClass returned the right class for nine of the ten drugs tried. Gabapentin has no class there, so a
  drug like it is left out. Only the FDA's class names are used, never the SNOMED ones, which carry their own license.
- WHICH DRUGS. Medicare Part D Spending by Drug, 2024 (a government work), counts claims by drug. The top ten:
  atorvastatin 73.4 million claims, then amlodipine, levothyroxine, gabapentin, losartan, lisinopril, metformin, metoprolol
  succinate, rosuvastatin and omeprazole. It is Medicare only and counts refills, which is fine for "the drugs people
  actually take". Each drug has a total row and a row per maker, and only the total counts.
- A FIRST PULL (after his yes, into tmp/huddle-v4/drugs.json). Of the 200 drugs Medicare filled most, 151 have one FDA
  class, across 83 classes; 34 of those classes have two drugs or more, enough for "which of these is a statin?". The
  combination pills have no class of their own and are left out. Two traps showed up: estradiol came back as a
  radioactive diagnostic agent, from a tracer product, and some single drugs (mirtazapine, buspirone) came back with none
  under a salt name. So the build reads each class through a hand-written list of plain names, and you read that list.
- LAB NORMALS. There is still no free source with the numbers. The fullest public set is ABIM's Laboratory Test Reference
  Ranges, January 2026, the sheet its board exams use. It is copyrighted, so the site states each value in its own words
  and cites it, one value to a question, never the table. MedlinePlus (public domain) gives numbers for only three: the
  cholesterol targets, triglycerides and A1c. The NIH Clinical Center's guide is not public. ABIM's live site is behind a
  bot check, so the values were read from an archived copy dated Oct 5. Your read against the real sheet is the check.
  ABIM has no INR line.
- ICD-10-CM. The code set in effect is fiscal year 2027, since Oct 1: 74,879 codes, free to download from CMS and the CDC.
  Neither states a license in writing. The site quotes a code and its short description, nothing more, and every code
  question says which year it is valid for.

## The plan, in three milestones

Each milestone is its own Plan, Build, QA, Tweaks and Ship, and each arrives as a new bank version dealt from its own
first day. The memory treats new questions like any others, and no board anyone has played changes (the pins).

1. MEDICAL SCIENCE (bank version 4). Medical Science grows from 228 to about 450.
   - The normals go from 16 to about 35. The new ones are from ABIM: PT, aPTT, AST, ALT, total bilirubin, albumin,
     calcium, magnesium, phosphorus, creatinine (women and men), lactate, hematocrit (women and men) and hemoglobin for
     men. From MedlinePlus: total cholesterol, LDL, HDL, triglycerides and A1c. Each says "typical adult range; labs
     vary", like the 16 now. They stay drafts until you check them (DH2).
   - Drug classes come from the 200 drugs Medicare filled most in 2024. There are two questions. "Which class is
     lisinopril in?" and "Which of these is a statin?" Answers use the name a clinician says (statin, beta blocker,
     ACE inhibitor), with the FDA's name and the source in the explanation. A wrong answer is always a real class and
     never half right: amlodipine never offers both "calcium channel blocker" and "dihydropyridine calcium channel
     blocker". Generic names only. No doses, no what-it-treats (that changes with the label).
   - With about 35 normals the spacing loosens. The daily still deals one normal a board at most, but more often than
     one board in four, about every other day. That change runs from version 4's first day, and the year check proves
     the memory still holds.
2. CODES AND MONEY (version 5). ICD-10 codes in Health Tech: the odd ones people enjoy, and everyday ones a coder or a
   nurse sees, each with its fiscal year. Medicare Part D spending by drug in Payer (gross spending, before rebates,
   and the question says so). The national health spending and mortality headline numbers in Payer and Public Health.
3. HISTORY AND FIRSTS (version 6). Nobel Prizes in Physiology or Medicine. First FDA approvals (a patent date is not
   when generics arrive). The WHO essential medicines list (from its open eEML, not the PDF). Diseases named after
   people. Most of these land in Medical Science.

Later, each when it is ready: what industry paid physicians as national totals only (Open Payments, never a named
clinician), population numbers from NHANES, and children's normals from the CDC growth charts and NHLBI tables.

Every source is checked live again when its milestone is built, and every question carries its source and year.

## What you check (QA), per milestone

- Version 4: every new normal range, one at a time, against the ABIM sheet and your own read as an RRT; the list of class
  names as the answers say them; a sample sheet of the drug class questions, Good or Needs a tweak.
- Versions 5 and 6: a sample sheet each, like version 3's.

## Your call

1. The lab list above, from 16 to about 35. Add or cut any? I recommend it as it stands. Troponin is left out: its
   cutoff depends on the lab's own test, so no one number is right.
2. Yes to the plan, or what to change.

## Done when (version 4)

- Medical Science holds about 450 questions, every one with its explanation and source.
- Every new normal is checked by you; no drug question names a dose or a use.
- A year of dailies from version 4's first day deals clean, with the memory holding and one normal a board at most.
- Every board dealt before that day is unchanged (the pins), and the full check passes.

## What could go wrong

- The FDA changes a drug's class. The class list is read again at each bank build; a changed class opens a new version,
  and the old question is frozen, the same rule the bank already uses for changed data.
- A wrong answer teaches the wrong thing. Wrong answers are real classes and never the right one's parent or child, and
  your QA reads the class list whole.
- ABIM's archived copy differs from the live sheet. You read each value against the real sheet before it ships.

## Built, version 4 (2026-10-20, after his yes)

- 269 new questions, first dealt Friday Oct 30 (board #17). Medical Science goes from 228 to 497.
- The drug classes: 251 questions, 159 of "which class is it in" and 92 of "which of these is", from the 200 drugs
  Medicare filled most (scripts/huddle/pull-drug-classes.js, `npm run huddle:drugs`; the feed is
  scripts/huddle/feeds/drug-classes.js). RxClass needed one fix the first pull missed: it files some drugs under a precise
  form ("lisinopril anhydrous"), so those count and a different ingredient does not. 120 tile names in
  scripts/data/huddle-drug-class-names.json. Left out on purpose: trazodone, carbamazepine and penicillin V (the reasons
  are in the file).
- The normals: 18 more as drafts, 34 in all. Every one cites a public page read live today (tmp/huddle-v4/normals-quotes.md),
  NCBI Bookshelf, NHLBI or MedlinePlus, with the ABIM value beside it for his read. Where the sources disagree on a range
  (calcium, magnesium, phosphate, hematocrit), the wrong answers sit far from all of them. AST and ALT are left out: the
  sources give 5 to 30 and 4 to 36, ABIM 10 to 40, and the lab decides. Bilirubin and lactate are asked as the line the
  source draws (under 1 mg/dL; above 2 mmol/L is hyperlactatemia), since no source gives a two-ended range.
- The spacing: from version 4's first day a normal range can come every other board. A year from Oct 30: 3.0 a week on
  average, 4 at most, all 34 dealt; about one drug class tile a board; no question back inside 60 days.
- Boards #12 to #48 are pinned as version 3 deals them (tests/huddle-pins.json, memoryDays); every one before version 4's
  first day is held. A version the live site has is now closed even before its first day (scripts/huddle/lib.js
  versionBank), the gap this ship would otherwise have fallen into.
- If the push lands after Oct 29, the first day moves with `npm run build:huddle -- --from=<the day after the push>`.
