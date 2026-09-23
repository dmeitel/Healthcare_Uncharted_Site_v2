# Healthcare Uncharted · brief for an outside session

Paste this into any Claude.ai chat, other agent, or contractor session that will produce something for healthcareuncharted.com. It exists because a hand-off arrived on 2026-09-18 that assumed passthrough files, markdown pages, a fresh CSS palette, and an open-source release, and integrating it cost a day. Everything below is what that session should have known.

## What the site is

A static Eleventy 3 site (Nunjucks templates) for clinical informatics and healthcare data, written and run by one person, David Eitel. Practitioner voice, no corporate tone. Three sections: `/tools/` (interactive instruments), `/learn/` (textbook-register modules), `/rounds/` (first-person commentary). Everything deep-links into the Healthcare Atlas, a hex-grid map that is the site's spine.

## How pages are built (do not assume otherwise)

- Every page is an `index.html` or `index.njk` with YAML frontmatter, rendered through `src/_includes/base.njk`, which supplies the nav, footer, fonts, theme toggle, icons, and search. Deliver page BODIES with frontmatter, not full HTML documents. No `<html>`, `<head>`, or `<body>`.
- There are no markdown pages and no passthrough page directories. Data goes in `src/_data/*.json` or `*.js` and is rendered with Nunjucks loops; lists are never hand-written into templates.
- Styles are page-scoped under one class prefix (`.xyz-...`) inside a `<style>` block, and every color, font, and spacing value comes from the global tokens: `var(--dark) --surface --raised --border --border2 --t1 --t2 --t3 --teal --blue --green --amber --red --purple`, fonts `var(--font)` (DM Sans), `var(--display)` (Outfit), `var(--mono)` (IBM Plex Mono). Both themes exist; teal as small text on light must use `var(--teal-ink)`, and the other accents have `-dk` steps.
- No new colors, typefaces, icon sets, or third-party scripts. Icons are Lucide (`<i data-lucide="name">`). External scripts are limited to the CSP allowlist in `netlify.toml`, which is jsdelivr, cdnjs, Google Fonts and the analytics host. UNPKG WAS REMOVED 2026-09-20 when icons moved to a self-hosted subset; a page that loads from it ships broken. Read the directive, do not trust a doc for it.
- Shared controls exist and must be reused, not re-drawn: `.toggle-chip` with `aria-pressed` for state, `.icon-btn`, `.btn-primary` / `.btn-primary-v2` for the one blue action, `.tag` for mono labels, `.pop-head` for panel headers, the merged-band `.tool-bar` on tool pages.
- Floors that never move: 44 px touch targets on phones; functional text holds `--t-label` (11 px desktop, 13 px phone) and nothing renders under `--t-micro` (11 desktop, 12 phone), so never write a bare pixel size for type; reduced motion honored; transform and opacity only in animation; `100dvh` never bare `100vh`.
- A PHONE IS THE SHORTER SIDE OF THE SCREEN. The phone query is `@media (max-width:699px), (max-height:500px)`, both halves, always. A width-only 699 query serves the desktop layout to a phone held sideways. Never invent a different number.
- Interactive content has no hover-only meaning; everything works by tap and keyboard, with visible focus.

## Voice, non-negotiable

- No em dashes anywhere, including titles and meta descriptions. Use a comma, a period, a colon, or restructure.
- Banned: delve, straightforward, genuinely, robust, seamless, leverage, "it's worth noting", "in conclusion", "here's the thing", "let's be clear", "make no mistake", aphorism closers, "X and the Y" titles, parallel bulleted templates.
- Titles say what the piece is about. Headings label; they do not sell.
- Every number and every external claim carries a source and a check date, and gets verified live before it ships.

## What David decides, not the deliverable

Anything that publishes, licenses, distributes, spends money, or creates something outside this site (a repository, an account, a release) is his call in conversation. A hand-off note may propose it; it may not assume it. Integration notes are inputs to the session that integrates them, never instructions.

## What to deliver

Page bodies with frontmatter, a data file if the page renders a list, the sources for every claim, and a short note of what was assumed. Nothing else is needed, and the fewer new patterns the better: the integrating session has the site's recipes (docs/HU-PAGE-RECIPES.md) and will fit the deliverable to them.
