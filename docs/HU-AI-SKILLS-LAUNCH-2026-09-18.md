# HU AI Skills Launch · 2026-09-18

Three deliverables, three destinations. This is the record of what was built into the site, where it lives, what was changed from the hand-off notes, and what has to happen before it goes live.

> **THE TWO PAGES THIS DOCUMENT DESCRIBES WERE DELETED 2026-09-21** on David's call
> ("the AI tools page, delete"), DECISIONS question 13: `/tools/ai-skills/`, `/tools/skill-demo/`,
> their hub card, their search rows, `src/_data/skillsEcosystem.json` and the thumbnail entry are
> all gone. This file is now a record of something that was built and removed. Do not rebuild from it.
>
> **ALSO CORRECTED 2026-09-21. Parts of this document describe a distribution
> pipeline that DOES NOT EXIST and MUST NOT be rebuilt from these notes.**
>
> Verified against the repo on 2026-09-21: there is no `skills/` folder, no
> `scripts/build-skills-zip.js`, no `/downloads/skills/` passthrough, no `hu-skills.zip`, and no
> `downloadUrl` or `filesUrl` in `skillsEcosystem.json`. `src/downloads/` holds David's own
> conference PDFs and nothing else. The five skills are his PRIVATE tools, parked outside this
> repo at `Documents/hu-skills`: no repo, no download, no license.
>
> The sections below that describe a passthrough, a zip built on every build, and files "readable
> raw in the browser" came from an outside hand-off that assumed an open-source release David
> never asked for. CLAUDE.md records that assumption as the mistake it was. Anything in here that
> publishes, licenses or distributes his skills is an INPUT that was rejected, not a plan.
>
> Also note: the two pages this document describes, `/tools/ai-skills/` and `/tools/skill-demo/`,
> are DECISIONS question 13 and may be deleted. Do not build on them.

## What shipped into the repo

| Deliverable | Where | Notes |
|---|---|---|
| Field guide page | `src/tools/ai-skills/index.html` → `/tools/ai-skills/` | Reference-type tool page (the vendor directory is its sibling). Hero via the shared `page-hero` macro, reading body, six-repo card grid, the two built skills, a margin-note warning, tool attribution. |
| Data | `src/_data/skillsEcosystem.json` | The six repos, the two built skills, `repoUrl`, `specUrl`, and the `updated` date. The page and the demo both read it. Adding or removing a repo is an edit here only; never hand-edit the rendered list. |
| Demo | `src/tools/skill-demo/index.html` → `/tools/skill-demo/` | Merged-band tool page. Simulated run, real loading mechanics. Kit chips for task and skill state, one blue verb, margin-note verdicts, flagged phrases as `<mark>` with a visible numbered notes list (no hover-only meaning), one polite live region that announces the finished run. |
| Catalog | `src/_data/tools.js` (`ai-skills`, cluster `learn-play`, type `reference`) | Home page shelf, Tools index, and the search index all render from this. |
| Thumb | `scripts/build-tool-thumbs.js` (`ai-skills`) → `src/assets/images/tool-thumbs/ai-skills.png` | Same overwrite contract as every other thumb: a real screenshot with the same filename replaces it. |
| Search | `src/search-index.njk` | One hand-listed line for the demo (the guide is indexed through tools.js). |

## What changed from the hand-off notes

- **Not a passthrough.** The notes said to serve the demo by passthrough "like Alarm Fatigue". Alarm Fatigue is a Nunjucks-processed page with frontmatter, and `.claude/rules/templates.md` bans passthrough on directories with processed templates. Both new pages are processed pages on `base.njk`.
- **Not markdown.** No page in `src/` is markdown, so `ai-skills.md` became `index.html` with the same Nunjucks loop. No `templateEngineOverride`.
- **No new classes.** `.hu-cta` mapped to the existing `.btn-primary-v2`; `.hu-tag` mapped to the existing `.tag`.
- **Demo restyled onto tokens.** The dropped file redefined `--blue`, `--teal`, `--mono` and friends at `:root`, which HU-TOOL-SHELL rule 8 forbids. Every color now rides a global token with the deep step on light. Its custom switch became a `.toggle-chip` with `aria-pressed`; its 820px and 680px breakpoints became the 699px phone line.
- **Copy passed through the voice kernel.** Aphorism closers cut to one, parallel triads broken up, the "Read this before you install" section kept its warning. The stale "north of 90,000 stars" became "north of 280,000" after checking the GitHub API (288,535 on 2026-09-18). Every other entry was verified live the same day.
- **One honest line added.** The page says both skills are first drafts that have not run against a real ticket. Delete it once they have.

## Where the skills live (decided 2026-09-18: on the site, not a GitHub repo)

David's call: "put them on the site for now, we can decide storage/growth at a later date." The hand-off notes had assumed a separate `healthcare-uncharted/skills` repo; nothing needs one yet.

```
skills/                              (repo root, OUTSIDE src/ so Eleventy never renders the frontmatter)
├── README.md                        (what these are, install, the supply-chain warning, license placeholder)
├── epic-build-change-doc/SKILL.md
├── clinical-workflow-analysis/SKILL.md
├── request-triage/SKILL.md
├── data-request-spec/SKILL.md
└── cds-alert-review/SKILL.md
```

- `.eleventy.js` passes the folder through to `/downloads/skills/`, so every file is readable raw in the browser.
- `scripts/build-skills-zip.js` (dependency-free, STORE entries, own CRC32) writes `/downloads/hu-skills.zip` from the `eleventy.after` hook on every build, locally and on Netlify. Nothing is committed.
- `skillsEcosystem.json` carries `downloadUrl` and `filesUrl`; the page's two buttons and per-skill links, and the demo's footer, read those. A GitHub repo later means adding a `repoUrl` field and repointing those same three places.

## Round 2, same day: three more skills

David's go on the recommended order. Added to the staged repo and to the `built` array in `skillsEcosystem.json`, which the page renders:

| Skill | Grounded in |
|---|---|
| `request-triage` | The M03 request-routing standard as published on the site: three tests in order, the project modifier, domain, the scope ladder, the lead and executor table, the five precedence rules, and the two lines that hold everywhere. |
| `data-request-spec` | Population, grain, and time window as the three hidden decisions; a definitions table with every filter's source labeled; minimum necessary; a validation plan the requester runs. |
| `cds-alert-review` | The Five Rights of CDS, silent-run volume estimates, coded override reasons, retirement criteria written before go-live, and a measurement plan that distinguishes "fired" from "worked." |

Site-side, same round: the demo gained a third task (route a request, with a per-task "instructions loaded" line); the field guide deep-links two Atlas tiles (Clinical Informatics, CDSS & AI Tools) and the Atlas lists it back, because `atlasContentLinks.js` now walks `tools.js` entries that carry `atlasLinks`; the Learn AI module's link cards gained the field guide. Held back on purpose, per the agreed gate: `tip-sheet-from-change-doc` and `shadowing-plan` wait until the five have been run on real tickets.

## Round 4, same day: the skills are NOT distributed

David's ruling, in his words: "I just wanted to pull repo data to help make the site better, I do not want to grant rights or provide license for anyone to take my stuff." So the hand-off's "skills repo" idea is dead in both forms, GitHub and on-site. Reverted: the `skills/` passthrough, the zip hook and `scripts/build-skills-zip.js`, the download buttons, the per-skill raw links, the install paragraph, and the demo footer's download link. The page keeps its purpose (the six repos and the demo) and lists the five skills as descriptions only, under "Five skills I wrote for my own team," with a "Write your own" button to the spec's quickstart in place of any download. The five SKILL.md files and a private README (all rights reserved) are parked at `C:\Users\david\Documents\hu-skills\`, outside the repo; to use them himself, David copies the folders into `~/.claude/skills/`. No license is needed because nothing is offered.

## Pre-publish checklist

- [ ] No license: the skills are private (Round 4). Nothing on the site offers them.
- [ ] Optional, for David's own use: copy the parked folders into `~/.claude/skills/` and run them on real tickets.
- [ ] Rebuild and run `npm test` (the build test checks links, em dashes, banned words, the h1 floor).
- [ ] Nothing blocks the push: the page and the demo are self-contained.

## QA done 2026-09-18

Build clean, `tests/site-build.test.js` 13/13. In the pane: both pages render with no console or server errors; the demo runs both ways (skill installed: nine trace lines, seven structured sections, the good verdict; not installed: six lines, the flagged paragraphs, the five notes, the bad verdict); the live region announces each finish; phone width (375px) stacks the panels and wraps the toolbar; the Tools index shows the new card. One defect found and fixed during QA: a page-scoped `.aisk a { color }` outspecified `.btn-primary-v2` and painted the hero button's label teal on teal. Both pages now exclude kit classes from their link rule.
