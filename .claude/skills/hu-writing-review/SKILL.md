---
name: hu-writing-review
description: Run the writing checker and the reviewer panel on a draft or a site page. Use when David says "run the reviewer panel on <name>", "check this writing", or pastes prose for review, and before handing over any prose written for him (site copy, Rounds, LinkedIn, work email, advocacy letters).
---

# The writing review: the checker, then the panel

Built 2026-10-03 on David's ask for "a QA tool that would look at writing, PHI standards, and make
sure that we are always staying within a good format or good professional standing with our
writing but also staying within our vernacular tone", and for pasted drafts.

Two layers. Run the first on anything; run the second when David asks for it.

## 1 · The checker (rules, instant, no judgment)

Same rules everywhere: `scripts/lib/writing-rules.js`.

- David's screen: `npm run writing`, or `preview_start` with the `hu-writing` config, then
  `/__writing`. Paste a draft or pick a site page. A link opens straight onto one:
  `/__writing#page=/rounds/some-piece/` or `/__writing#draft=<name>`.
- Command line, for a session checking its own prose before handing it over:
  - `npm run writing:check -- <file.md>` (pass `--voice professional` etc. for off-site writing)
  - `npm run writing:check -- <saved draft name>`
  - `npm run writing:check -- /rounds/some-piece/` (reads the page after its scripts draw)
  - `npm run writing:check -- --all` (every built page, static text)
- Levels: MUST FIX (a patient identifier or an em dash; nothing ships), FIX (breaks a written
  rule), READ AGAIN (often a problem, sometimes right). Every finding names its source: the
  kernel, the hu-voice skill, the voice profile, HIPAA Safe Harbor, or David's own dated words.
- Gates in `npm test`: `tests/writing-phi.test.js` (no patient identifier on any built page,
  in the Rounds story files, or in any image's hidden data) and `tests/writing-voice.test.js`
  (a ratchet on FIX findings per page against `tests/writing-baseline.json`).

Prose Claude writes for David should come back with zero MUST FIX and zero FIX before he sees it,
or with each remaining FIX named and explained in one plain sentence.

## 2 · The reviewer panel (judgment, on request)

David's words, 2026-10-03: "it needs a professional review... reviewed from the perspective of a
healthcare administrator or a technology specialist or a clinician", and "pretend that you are a
medical director or a healthcare technologist looking at this case example... was this too
personal, was this not professional enough, what questions or follow-up information would you
want, what pieces of information feel wrong or do not seem to be supported by my clinical
experience".

When David says "run the reviewer panel on X":

1. Find X. A saved draft lives in `private/writing/drafts/<name>.json` (the screen saves there);
   a page is a path like `/secret-menu/a-routine-fracture/`.
2. Write the text as read, with its fingerprint, to the private folder (git ignores it; a draft
   can hold exactly the patient detail this exists to catch, and the repo is public):
   `node scripts/writing-check.js <X> --text > private/writing/panel/<id>.text.md`
   and the machine findings beside it with `--json > private/writing/panel/<id>.machine.json`.
   `<id>` is the panel file's name: `draft-<name>` or `page-<path with slashes as dashes>`
   (`scripts/writing.js` exports `panelFile(id)`, which gives the exact path).
3. Spawn the four readers in parallel (general-purpose agents, READ-ONLY: they must not edit
   any file). Each gets the text file's path, the register, and one lens:
   - **Medical director.** Clinical accuracy. Does every clinical claim hold up for someone who
     has run the floor? What feels wrong or unsupported? Any patient-safety or privacy risk?
   - **Healthcare administrator.** Operations, billing and finance accuracy. Professional
     standing: is it too personal for a piece that could be presented, and how does it read to
     the writer's employer and manager?
   - **Healthcare technologist.** Records, systems and data flow. Is each EHR, portal, order and
     record step described correctly and in vendor-neutral words?
   - **Voice editor.** The kernel in CLAUDE.md and docs/voice-profile.md. Does it sound like
     David, and where does it read as AI? Load the hu-voice skill first.
   Each returns JSON only: `{ "role": "...", "verdict": "one plain sentence", "notes": [ { "quote":
   "exact words from the text, short", "note": "what and why, plainly", "kind": "fix" | "question"
   | "keep" } ] }`, at most eight notes, quotes copied exactly. No em dashes in any note.
4. Write `private/writing/panel/<id>.json`:
   `{ "id": "page:/x/" or "draft:<name>", "title": "...", "ran": "YYYY-MM-DD", "fingerprint":
   "<from the --text header>", "reviewers": [ ...the four... ] }`.
   The screen reads it and says so when the text has changed since.
5. Tell David in two or three plain sentences what the panel agreed on and where it split, and
   point him at the screen. Do not paste the notes into the chat.

Never put a panel's notes, or any draft text, anywhere but `private/writing/`.
