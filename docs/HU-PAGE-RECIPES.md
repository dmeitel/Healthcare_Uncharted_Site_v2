# HU Page Recipes

Three skeletons, copied from pages that shipped. Each session used to re-read base.njk, a sibling page, and the shell doc before writing one page; start here instead. The law behind these lives in docs/HU-TOOL-SHELL.md (chrome), docs/HU-INSTRUMENT-GRAMMAR-2026-08-11.md (interaction), DESIGN.md (tiers), and CLAUDE.md (voice). When a recipe and the law disagree, the law wins and this file is wrong.

Before any of them ships: `npm run verify` green, `npm run phone -- <path>` clean at 360 and 699, both themes looked at, no em dashes, every claim sourced.

---

## 1 · A reading page under /tools (a Reference-type tool)

Shipped example: `src/tools/vendor-directory/index.html`. (This used to name `src/tools/ai-skills/index.html` first; that page was DELETED 2026-09-21 on David's call, DECISIONS question 13.) Full nav, no merged band, footer suppressed, tool attribution at the foot.

```
---
layout: base.njk
title: "What The Page Is About"
description: "One or two plain sentences. No em dashes. This is the meta description and the hero sub."
navPage: tools
section: tool
category: informatics
tags: [one, two, three]
framework_4p: [provider]
featured: false
date: 2026-09-18
status: published
read_time: "8 min"
no_footer: true
og_image: /assets/images/tool-thumbs/<id>.png
---
{% from "components/page-hero.njk" import pageHero %}
<style>
  .xyz{ --xyz-accent:var(--teal); color:var(--t2); }
  [data-theme="light"] .xyz{ --xyz-accent:var(--teal-ink); }
  /* link color scoped to prose: a bare `.xyz a` outranks the kit buttons (css.md) */
  .xyz-p a{ color:var(--xyz-accent); }
  .xyz :focus-visible{ outline:2px solid var(--xyz-accent); outline-offset:2px; }
  .xyz-body{ max-width:1100px; margin:0 auto; padding:0 clamp(20px,5vw,80px) 56px; }
  .xyz-sec{ margin:44px 0 0; scroll-margin-top:calc(var(--nav-h) + 20px); }
  .xyz-h2{ font-family:var(--display); font-size:clamp(22px,2.6vw,30px); font-weight:700; letter-spacing:-.015em; line-height:1.15; color:var(--t1); margin:0 0 14px; }
  .xyz-p{ font-size:16px; line-height:1.72; color:var(--t2); max-width:70ch; margin:0 0 16px; }
  .xyz-grid{ display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); gap:14px; }
  .xyz-card{ background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:18px 20px 16px; transition:transform .2s, border-color .2s; }
  .xyz-card:hover{ transform:translateY(-4px); border-color:var(--xyz-accent); }
  .xyz-note{ border-left:3px solid var(--amber); padding:4px 0 4px 14px; max-width:70ch; }   /* the Margin Note Rule: rule, no box */
  @media (max-width:699px), (max-height:500px){ .xyz-grid{ grid-template-columns:1fr; } }
  @media (prefers-reduced-motion:reduce){ .xyz-card{ transition:none; } .xyz-card:hover{ transform:none; } }
</style>

<div class="xyz">
{{ pageHero("Tools · Kicker", title, description, [
  { url: "/somewhere/", label: "Primary action", primary: true },
  { url: "/elsewhere/", label: "Secondary" }
]) }}
<article class="xyz-body">
  <section class="xyz-sec" aria-label="Opening">
    <p class="xyz-p">Start mid-thought. Short paragraphs.</p>
  </section>
  <section class="xyz-sec" id="list">
    <h2 class="xyz-h2">A heading that labels</h2>
    <div class="xyz-grid">
    {%- for entry in myData.entries %}
      <article class="xyz-card"><span class="tag">{{ entry.category }}</span> ... </article>
    {%- endfor %}
    </div>
  </section>
</article>
{% set ta_source = 'Source name · where it came from' %}
{% set ta_source_href = 'https://example.org' %}
{% include "components/tool-attribution.njk" %}
</div>
```

Register it: one entry in `src/_data/tools.js` (id, cluster, keys for search, title in search terms, desc, url, type `reference`, badge, tags, optional `atlasLinks`), one vignette in `scripts/build-tool-thumbs.js` under the same id, then `node scripts/build-tool-thumbs.js`. The home page, the Tools index, and the search index render from tools.js; nothing is hand-listed.

---

## 2 · A merged-band tool page (an interactive instrument)

Shipped example: `src/tools/sql-mystery/index.html`. (This used to name `src/tools/skill-demo/index.html` as the small one; that page was DELETED 2026-09-21, DECISIONS question 13.) The toolbar IS the nav on these pages: `nav_merged: true` parks the real nav offscreen and the `[data-nav-summon]` control brings it down.

```
---
layout: base.njk
nav_merged: true
navPage: tools
title: "The Tool Name"
description: "What it does, in one sentence."
section: tool
category: informatics
tags: [one, two]
framework_4p: [provider]
featured: false
date: 2026-09-18
status: published
has_interactive: true
no_footer: true
og_image: /assets/images/tool-thumbs/<id>.png
---
<style>
  .xyz{ --xyz-accent:var(--teal); font-family:var(--font); color:var(--t2); }
  [data-theme="light"] .xyz{ --xyz-accent:var(--teal-ink); }
  .xyz a:not(.toggle-chip):not(.tb-brand){ color:var(--xyz-accent); }   /* kit chrome keeps its own ink */
  .xyz-wrap{ max-width:1100px; margin:0 auto; padding:26px clamp(16px,4vw,40px) 44px; }
  .xyz-panel{ background:var(--surface); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
  .xyz-panel .pop-head{ background:var(--raised); }
  .xyz-vh{ position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; }
  @media (max-width:699px), (max-height:500px){ /* stack. BOTH halves: a phone on its side is 740px wide */ }
  @media (prefers-reduced-motion:reduce){ /* every transition off */ }
</style>

<div class="xyz">
<header class="tool-bar">
  <a class="tb-brand" href="/" aria-label="Healthcare Uncharted, home">
    <img src="/brand/hu-mark-dark.svg" alt="" class="hu-logo-ondark">
    <img src="/brand/hu-mark.svg" alt="" class="hu-logo-onlight">
  </a>
  <span class="tool-bar-kicker">Tool</span>
  <h1 class="tool-bar-title">The tool <span>name</span></h1>
  <span class="tool-bar-crumb">Mono meta · retires on phones</span>
  <span class="tool-bar-spacer"></span>
  <div class="tool-bar-actions">
    <a href="/tools/" class="toggle-chip">&#8592; All tools</a>
    <button class="icon-btn" data-nav-summon type="button" aria-expanded="false" aria-label="Site menu" title="Site menu"><i data-lucide="menu" aria-hidden="true"></i></button>
  </div>
</header>

<noscript><p class="hu-noscript">This tool runs entirely in your browser and needs JavaScript turned on. Nothing you do here is sent to a server.</p></noscript>
<div class="xyz-vh" id="xyzLive" aria-live="polite" aria-atomic="true"></div>

<div class="xyz-wrap">
  <div role="group" aria-label="Mode">
    <button type="button" class="toggle-chip" aria-pressed="true">Mode A</button>
    <button type="button" class="toggle-chip" aria-pressed="false">Mode B</button>
  </div>
  <button type="button" class="btn-primary" id="xyzRun">The one blue verb</button>
  <section class="xyz-panel" aria-labelledby="xyzH">
    <div class="pop-head"><h2 class="pop-head-title" id="xyzH"><i data-lucide="terminal" aria-hidden="true"></i>Panel</h2></div>
    ...
  </section>
</div>

{% set ta_source = 'Source · caption' %}
{% include "components/tool-attribution.njk" %}
</div>

{% raw %}
<script>
(function(){
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // state, then wiring; announce committed changes through #xyzLive only
})();
</script>
{% endraw %}
```

Rules that bite: `{% raw %}` around the script if it contains anything that looks like Nunjucks; one live region, committed changes only; chips carry `aria-pressed`; `.icon-btn` for icon controls with an `aria-label`; JS-injected Lucide icons need `lucide.createIcons()` after insertion. A canvas tool (map, grid, drag) uses `.hu-shell` and HUKit instead of a plain wrap; read docs/HU-TOOL-SHELL.md first.

---

## 3 · A Learn module

> **REWRITTEN 2026-09-22. Do NOT copy the CSS block below into a new page.**
>
> That instruction is what made every reading page on this site a private fork, and forks drift.
> Measured across the pages that each declared their own shell: five different h1 sizes on 14
> pages, eight different hero paddings on 13, eight different eyebrow letter-spacings, four
> different paragraph line-heights. The template below taught the MINORITY value for both
> headings, so a page built correctly from this file came out looking unlike most of the site.
>
> **A reading page now uses the `.hu-read` shell in hu-global.css and writes almost no CSS.**
> The classes: `hu-read` on the wrapper, then `hu-read-hero-inner`, `hu-read-eyebrow`,
> `hu-read-h1`, `hu-read-standfirst`, `hu-read-body`, `hu-read-section`, `hu-read-kicker`,
> `hu-read-h2`, `hu-read-h3`, `hu-read-p`, `hu-read-note`, `hu-read-grid`, `hu-read-card`,
> `hu-read-links`, `hu-read-link`. A `<p>` inside `.hu-read` is already styled.
>
> Worked example: `src/secret-menu/patient-journeys/index.html`, 19 lines of page CSS, and the
> 19 are genuinely unique to it. Bespoke things (a diagram, a figure, a board) STAY page-scoped
> under their own prefix. That is not drift, that is the page. Only the shell is shared, because
> only the shell should be identical everywhere.
>
> The block below is kept as a record of the old pattern and to show what the shell replaced.



Shipped example: `src/learn/request-routing/index.html` (editorial), `src/learn/ai-in-healthcare/index.html`. Textbook register: the writing disappears, headings label, no personality added.

```
---
layout: base.njk
section: learn
title: "Subject: What This Module Covers"
description: "What a reader will know afterward. No em dashes."
navPage: learn
status: published
date: 2026-09-18
---
<style>
  .xyz{ --xyz-accent:var(--teal); background:var(--dark); color:var(--t2); font-family:var(--font); line-height:1.66; }
  [data-theme="light"] .xyz{ --xyz-accent:var(--teal-ink); }
  .xyz-hero-inner{ max-width:1100px; margin:0 auto; padding:76px 36px 56px; }
  .xyz-eyebrow{ font-family:var(--mono); font-size:11px; letter-spacing:.22em; text-transform:uppercase; color:var(--xyz-accent); margin-bottom:20px; }
  .xyz-h1{ font-family:var(--display); font-weight:700; font-size:clamp(40px,6vw,64px); line-height:1.04; letter-spacing:-.02em; color:var(--t1); margin:0 0 22px; }
  .xyz-hero-sub{ font-size:18px; line-height:1.55; color:var(--t2); max-width:620px; }
  .xyz-body{ max-width:1100px; margin:0 auto; padding:0 36px 40px; }
  .xyz-section{ margin:64px 0 0; scroll-margin-top:calc(var(--nav-h) + 26px); }
  .xyz-kick{ font-family:var(--mono); font-size:11px; letter-spacing:.2em; text-transform:uppercase; color:var(--xyz-accent); font-weight:600; margin-bottom:10px; }
  .xyz-h2{ font-family:var(--display); font-size:clamp(24px,3vw,38px); font-weight:700; letter-spacing:-.015em; line-height:1.12; color:var(--t1); margin:0 0 18px; }
  .xyz-p{ font-size:16px; line-height:1.72; color:var(--t2); max-width:70ch; margin:0 0 18px; }
  .xyz-callout{ border-left:3px solid var(--amber); padding:4px 0 4px 14px; max-width:76ch; margin:22px 0; }
  @media (max-width:820px){ .xyz-hero-inner{ padding:54px 22px 40px; } .xyz-body{ padding:0 22px 32px; } }
</style>

<div class="xyz">
  <header class="xyz-hero"><div class="xyz-hero-inner">
    <div class="xyz-eyebrow">Module NN · Category</div>
    <h1 class="xyz-h1">The subject.</h1>
    <p class="xyz-hero-sub">What the module covers, in one breath.</p>
  </div></header>
  <div class="xyz-body">
    <section class="xyz-section" id="one">
      <div class="xyz-kick">Part 1</div>
      <h2 class="xyz-h2">A heading that labels</h2>
      <p class="xyz-p">...</p>
    </section>
  </div>
</div>
```

Register it: one entry in `src/_data/learn.js` `modules` (id, num, category, ps, title, desc, url, tags, status `live`, featured, `atlasLinks` with at least one real Atlas tile), and add the URL to `learn.readingOrder` so the keep-reading handoff knows where it sits. The reading chrome (progress hairline, nav yield, reading memory, share, the keep-reading card) arrives from `section: learn` automatically. Sources go through `src/_data/references.js`, and the module cites them; the Learn appendix renders from that file.
