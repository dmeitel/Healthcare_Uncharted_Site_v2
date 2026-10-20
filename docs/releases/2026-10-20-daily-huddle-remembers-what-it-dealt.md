---
date: 2026-10-20
milestone: "Daily Huddle remembers what it dealt"
commit: ""
---

# Daily Huddle remembers what it dealt

A daily that stays fresh past the first month: no question back inside 60 days where its category has room, the normal ranges about twice a week, and Policy, Patient and Health Tech grown to 300 or more questions, every question with its explanation.

## What shipped

- The daily remembers what it dealt: from board #12 (Sunday, Oct 25) each daily keeps every question from the last 60 days off its board, taking the one dealt longest ago where a category runs short.
- The normal ranges come at most one a board, and only when the three boards before had none.
- Boards #1 to #11 stay exactly as they were dealt, held by pins (tests/huddle-pins.json, tests/huddle-memory.test.js).
- Bank version 3, first dealt Oct 25: 3,186 questions, from 2,771. Policy 320, Patient 313 and Health Tech 307, from the site's own data and state laws checked live (scripts/data/huddle-law-checks.json).
- Every question has its explanation on the answer card; 968 were written.
- A year of dailies with the memory: questions back inside 30 days went from 1,800 to 0, and December from 8.3 seen-before tiles a board to 2.1.
- Also in this push: the Cost of Living Comparison's 2025 federal standard deduction ($15,750 single, $31,500 joint), and the plan for the next data sets (docs/HU-HUDDLE-DATA-SETS-PLAN-2026-10-20.md).

## QA

- 4 item(s) on David's list: 4 good.
- 0 item(s) came back for a second look after a tweak.
- The machine went first: passed 2026-10-20 13:45, 57 min. 7 checks over the whole site, every page at nine screen sizes.

## Pages this changes on the live site

- /fun/daily-huddle/
- /tools/cost-of-living/

## Windows since the last push


Each window's close note, in docs/sessions/, says what it did on the day.
