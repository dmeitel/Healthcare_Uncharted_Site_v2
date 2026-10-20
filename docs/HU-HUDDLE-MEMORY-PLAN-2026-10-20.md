# Daily Huddle remembers what it dealt: the plan (DH12)

2026-10-20. David, on DECISIONS DH12: "Yes to DH12 as you recommend: the daily remembers what it dealt from a board
nobody has played yet, the normals capped, and new questions for the thin categories with explanations. Plan it first."

## Where it stands

Every daily board is drawn fresh from its own seed. Inside one board no question repeats; across days nothing is
remembered. A check that dealt all 365 boards from Oct 20 to next Oct 19 (tmp/huddle-year/) found:

- A daily player meets a question from an earlier board on about 2 of 19 tiles in October, 10 by December, 14 by March.
- A board spends about 2.7 tiles a day on each of the seven categories. So a category needs about 163 questions before a
  60-day memory can keep every question away for 60 days.
- The bank has 2,771 questions. Policy 172, Patient 184, Health Tech 195 and Medical Science 228 sit at or just above that
  line; Payer 301, Public Health 583 and Provider 1,108 are comfortable.
- Medical Science is 212 dose-math questions and the 16 normal ranges. The normals land on 315 of the 365 boards.
- 968 questions have no explanation line on the answer card: Provider 419, Public Health 296, Payer 148, Patient 83,
  Policy 19, Health Tech 3.

## The plan, four parts

1. THE DAILY REMEMBERS. From a start board, each daily keeps every question it has dealt in the last 60 days off the board.
   Where a category runs short, it takes the question it dealt longest ago, so a board always fills. Everyone still gets
   the same board on the same day, and a past day replays exactly as it was dealt. Practice boards and made boards stay as
   they are; only the daily remembers.
2. THE START BOARD IS ONE NOBODY HAS PLAYED. Every board dealt before it stays exactly as it was, held by the pins in
   tests/huddle-pins.json, which grow to cover every board already played. The aim is board #12, Sunday Oct 25, the
   first day of RC Week. If the build cannot ship by the evening of Oct 24, the start moves to the first day after the ship.
   The rule is fixed either way: no board anyone has played ever changes.
3. THE NORMALS ARE CAPPED. A board carries one normal-range tile at most, and the 60-day memory keeps each of the 16 away
   two months, so a daily player sees about two a week instead of one nearly every day. Medical Science fills the rest
   from its dose math.
4. MORE QUESTIONS WHERE THE BANK IS THIN, EACH WITH ITS EXPLANATION.
   - Policy, Patient and Health Tech each grow to 300 or more (about 350 new questions), so the memory has room and a
     question comes back no sooner than about three and a half months.
   - New questions come the way the bank already grows: written from the site's own data files (the maps' measures, the
     license compacts, the patient populations, the vendor facts checked live), each with its source and year. Nothing is
     made up, drugs only as facts and doses only as math with every number in the question (DH2).
   - Every question in the bank gets an explanation line: the 968 missing ones are written from the same data row the
     question came from (the fact, its source and its year), and a test holds every new one to having one.
   - The new questions arrive as bank version 3, dealt from its first day only, so they change no board already dealt.

## What you check (QA)

- A sample sheet on the hub: 20 new questions from each of the three grown categories, with their answers and
  explanations, Good or Needs a tweak like the puzzle sheet. Clinical wording is yours to pass, as the normals were.
- Today's board on your phone the first day the memory is on.
- The year check run again, now with memory: the numbers above, before and after.

## Done when

- A year of daily boards from the start board deals 19 tiles each and crosses on right answers, with no question back
  inside 60 days wherever its category has room, and the normals at one a board at most.
- Every board dealt before the start board is identical to what was dealt (the pins).
- Policy, Patient and Health Tech hold 300 or more questions each, and every question in the bank has an explanation line.
- The phone check, the full check and the Daily Huddle tests pass; your sample sheet is Good.

## What could go wrong, and the answer

- A category runs out inside 60 days on a busy stretch: the oldest-first fallback fills the board, and the year check
  counts how often it happens.
- A new bank version is added later: it is dealt from its own first day, so the remembered boards before it stay the same,
  and a test holds that.
- The site's data changes under a question (a measure updated): the bank keeps a question's version and place once dealt
  (the existing version rule), and the feeds open a new version for the new data.
