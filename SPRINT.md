# SPRINT

The current week of work, one goal, task by task. The map for the quarter is
docs/HU-DEV-PLAN-2026-Q4.md; this file is the week. Read it after DECISIONS.md at the start of
every session.

---

## HOW THIS WORKS

- **One sprint at a time, Monday to Friday, one goal in one sentence.** The definition of done is
  something David can see or play on Friday, never "the code is in".
- **Every task names an owner:** David, Claude in the session, or a named agent. Every task has an
  acceptance line. A task with no acceptance line is not a task, it is a wish.
- **Changing the sprint is allowed and expected.** David says the new goal in the conversation.
  Claude rewrites the task table, moves anything displaced back to its month in the plan, and
  writes one line under CHANGES saying what moved and why. Nothing is silently dropped.
- **Unfinished work moves forward, visibly.** A task not done by Friday goes to the top of the next
  sprint with its original date beside it, or back to the plan with a reason.
- **The sprint closes with numbers.** Friday's result in the LOG, one line in the plan's log, and
  the next sprint drafted for David's yes.
- **Gates do not move for a sprint.** `npm run verify` green and `npm run phone` clean before any
  ship. David commits, pushes and posts.

Task statuses: TODO · DOING · DONE · BLOCKED (say on what) · MOVED (say where).

---

## SPRINT 1 · Mon 2026-09-21 to Fri 2026-09-25

**Goal:** The Table in the hospital game plays over the internet again, and David tests it on
Friday.

**Definition of done:** On Friday David hosts a table from one device, joins from a second device
that is NOT the same browser, takes a seat on each side, plays through at least one quarter, and
both screens show the same hospital. If a guest reloads mid-game, they get back in with the code.

**The one hard dependency:** the site has to be DEPLOYED by Thursday evening for a phone to reach
it over the internet, and that means David's commit and push. The uncommitted tree goes with it.
If the diagram session is mid-flight Thursday, that session's files are the only ones to hold
back.

| Day | # | Task | Owner | Acceptance | Status |
|---|---|---|---|---|---|
| Mon | D1 | Open the Supabase dashboard on the main account. Restore the project if it offers to; otherwise create a new free project (any region, no extra settings). Paste the project URL and the publishable key into the conversation. This is DECISIONS row S. | David, 10 min | A URL of the form `https://<ref>.supabase.co` and a key starting `sb_publishable_` are in the conversation | TODO |
| Mon | C1 | Point the game at the live host: the `SUPA` constant in the hospital game and the `connect-src` entry in netlify.toml (https and wss). Add `tests/backend-host.test.js`: the host named in the page equals the host named in the CSP, and the vendored supabase-js file is referenced by the page. | Claude | `npm run verify` green with the new test in the count | TODO |
| Mon | C2 | `.github/workflows/verify.yml`: on every push, `npm ci` then `npm run verify`; on a cron every three days, a GET to `<host>/rest/v1/` with the publishable key so the free project never idles a week. Publishable key in a repo secret, host in a repo variable. | Claude | The workflow file passes `actionlint`-level sanity (valid YAML, the two jobs), and David sees it run green on his Thursday push | TODO |
| Tue | C3 | The real round trip. A one-off script, `scripts/backend-check.js`, runnable as `npm run backend:check`: two Playwright contexts load the built game, one hosts, one joins by code, claims Clinical, the host starts a run, the guest sends one hire, and the script asserts the guest's packed run equals the host's. Runs against the real relay, so it stays OUT of `npm test`. | Claude | The script prints the room code, the seat, and "identical" and exits 0 | TODO |
| Tue | C4 | Reload audit. With C3's harness: reload the guest mid-run, reload the host mid-run, and simulate a phone backgrounding the tab (page hidden 60 s). Report what each does today in one paragraph. If a guest cannot rejoin with the code and their nickname, C6 is built Wednesday; otherwise C6 is cut. | Claude | The paragraph is in this file under NOTES with the three outcomes | TODO |
| Wed | C5 | The table UI on a phone: the host lobby, the join screen, the seat picker and the guest's board at 360 and 699. Targets under 44 px, clipping, and the room code readable at arm's length. Fix what fails. | hu-mobile-tester, then Claude | `npm run phone -- secret-menu/uncharted-general/` clean, and the agent's screenshots at 360 show the code and the seats without scrolling | TODO |
| Wed | C6 | Guest rejoin: a guest who reloads re-enters the code and nickname and the host re-seats them into their old chair and sends the current envelope. Host restore: the host's tab keeps the last envelope in sessionStorage and offers "resume this table" on reload. Only if C4 says it is needed. | Claude | C3's script gains a reload step and still prints "identical" | TODO |
| Thu | D2 | Commit and push. Confirm the deploy finished in the Netlify dashboard for `healthcare-uncharted` (the project that serves the domain; the other three are the trap). | David | The served CSP names the new host: `curl -sI https://healthcareuncharted.com \| grep -i supabase` | TODO |
| Thu | C7 | Post-deploy check on the live domain, not localhost: the CSP header, the vendored supabase-js loads, zero console errors, and a table hosts from the browser pane. | Claude | A screenshot of a live lobby with a room code on healthcareuncharted.com | TODO |
| Thu | D3 | Dry run, ten minutes, if David has them Thursday evening: David hosts from his phone, Claude joins from the browser pane, takes the Clinical seat, hires one nurse. | David + Claude | Both screens show the hire | TODO |
| Fri | D4 | The test. A friend on their own device, or David's phone plus his laptop. Five lines afterwards under LOG: did the join work first try; did anyone reload and what happened; what confused the guest; what did the seats argue about; would you play a full year. | David | Five lines in the LOG | TODO |

**Cut from this week, back to the plan (no work lost):** the kit extraction (plan week 2), the
skill demo registry line, the RSS and Field Notes rows (DECISIONS 8 and 9 stand on their own).

**What could go wrong, and the answer:**
- The dashboard offers no restore and the new project has a new ref. That is the expected case;
  C1 is written for it.
- The diagram session cannot land by Thursday. Commit everything else; the sprint needs the two
  game files and netlify.toml, nothing in `src/learn/`.
- The relay works on the laptop and not on the phone. That is a CSP or a phone-lobby problem, and
  C7 and C5 are there to catch it before Friday.
- Friday shows the host-must-stay-online model hurting (a backgrounded phone drops the table).
  That is the plan's named trigger for Cloudflare Durable Objects; it goes on DECISIONS, not into
  this sprint.

---

## NOTES

(C4 writes its reload paragraph here.)

---

## CHANGES

- 2026-09-20 · Sprint 1 written from plan week 1, re-aimed on David's ask: "by the end of this
  week's sprint I would like to get the multiplayer function of one of my games up and running
  and set up so I can test it on Friday." The kit extraction moved from week 1 to week 2, where
  the plan already had it.

---

## LOG

(Friday's five lines go here, then one line in the plan's section 11.)
