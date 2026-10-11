# Close notes

One note per development window, written at the close (`npm run close` lists it as missing until
it exists) and read at the next open (`npm run open`, and the SessionStart hook). The hub's run
sheet draws them under "Windows". Started 2026-10-04.

Name: `YYYY-MM-DD.md`, or `YYYY-MM-DD-b.md` for a second window the same day. `npm run open` picks
the name when it starts the window and says it; the close looks for exactly that file. `pushed` is
filled in by `npm run ship -- --live`, with the commit that carried the note to the live site. Keep each list short;
the detail lives in SPRINT.md, DECISIONS.md and the design phase log. No patient details, no keys,
nothing that should not be in a public repo.

```
---
date: 2026-10-04
title: "Short name of what this window did"
pushed: ""            # the commit hash once David pushes, filled in at the next open
---

## Did
- one line per finished piece, the thing David would notice

## Left half done
- anything started and not finished, and where it stands

## Next
- what the next window should start on, in order

## Waiting on David
- at most three questions, each with a recommendation (the same ones go in DECISIONS.md)

## Checks
- the lines npm run close printed for the commit message
```
