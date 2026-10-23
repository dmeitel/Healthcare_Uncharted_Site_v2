---
date: 2026-10-22
milestone: "A Routine Fracture, and AI and Standard Work"
commit: ""
---

# A Routine Fracture, and AI and Standard Work

Two cards shipped together: the broken arm piece moved from the secret menu into Rounds, and a new Learn module.

## What shipped

- Rounds 06, Tracing a Broken Arm Through the Healthcare System (/rounds/a-routine-fracture/), posted 2026-10-22, four
  weeks after the injury. A review draft in the secret menu since 2026-10-03; the old address forwards. "Where Dave is now"
  follows the story to the three-week visit, and the insurance lines are dated as of October 22.
- Learn Method 04, AI and Standard Work for Healthcare Teams (/learn/ai-standard-work/): four levels from knowing a workflow
  to AI across a department, measuring with a baseline and a pilot, AI as a thinking partner, facts kept apart from
  guesses, nine sources read live, and a task planner that saves a Markdown file in the browser and sends nothing.
- Contents on both: a rail that marks the section you are in on a wide screen, a closed fold on a tablet, folded sections
  on a phone. On the fracture post's phone view the bottom bar is the switch: Contents and the four views as tabs, each
  view keeping its place.
- The full check sweeps only the pages a change touches, the whole site when a shared file changes.

## QA

- David's lists: 4 of 4 good on A Routine Fracture's, 14 of 14 on the module's.
- The phone gate ran clean at nine sizes, night and day, on every page that changed, during the windows.
- npm run verify: 769 tests green. Writing checker: no must-fix; the module 0 fix, the fracture piece 0 fix.
- Shipped with `npm run ship -- --force` on David's call: the full pre-push sweep (every page, since the layout and the
  stylesheet changed) was still running at the push. Its result is the first thing the next window reads.

## Pages this changes on the live site

- /learn/
- /learn/ai-standard-work/
- /rounds/a-routine-fracture/ (new, public and indexed)
- /secret-menu/ (the fracture card is gone; /secret-menu/a-routine-fracture/ forwards)
- every page, lightly: the shared stylesheet and layout (the contents block, the view bar)

## Still open on the Rounds piece

- DECISIONS R1 (names; the page names no people or places, as recommended) and R6; his manager's read; the fifth
  reviewer panel's notes of 2026-10-04, never applied.

## Windows since the last push

- 2026-10-21: Daily Huddle version 4 live, and the full check's sweep follows the change
- 2026-10-21-b: AI and Standard Work module, page contents, and A Routine Fracture in Rounds

Each window's close note, in docs/sessions/, says what it did on the day.
