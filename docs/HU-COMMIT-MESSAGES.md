# Commit messages

Adopted 2026-10-04 (David: "I want to start doing standardized ones"). David commits from GitHub Desktop or the
terminal; when a piece of work is done, Claude drafts the message in this shape and David pastes it.

## The title (GitHub Desktop's Summary box)

- Under 60 characters. It says what changed, in plain words, so the history reads as a list of what the site got.
- One area: lead with the area and a colon. `Device Assembly: ventilator walls`. `Cost of Living: answer card`.
- Several areas: name the biggest two or three. `Device Assembly A to C, writing checker, QA toolkit`.
- No period at the end, no em dash, no "update", "fixes" or "changes" on their own.

## The description

Four labeled blocks, in this order. Leave out a block that has nothing in it.

```
What
- one line per piece of work, the thing a visitor or David would notice

Why
- David's ask, or the defect it fixes, and where it is logged (DECISIONS.md, SPRINT.md)

Checks
- npm run verify: N tests green
- npm run phone: clean at nine viewports on the pages that changed
- anything else that was proved (a data check, a live relay check)

Goes live with this push
- any page that becomes public, or changes what visitors see, and any open question about it
```

## Habits

- Smaller commits read better: one commit per finished sprint item where it can be done.
- The repo is public. Before a commit, Claude checks what is going in (new files, secrets, personal details,
  anything that should stay out) and says so.
