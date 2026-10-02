---
name: confirmed-patterns
description: House patterns confirmed by audit (teal steps, focus-ring law, solid-button hover, DESIGN.md spacing/shape scales, game-chrome precedents, hu-shell clip trap, blessed one-offs incl. #574A9E, rr SMIL dot, Vital Stats local look)
metadata:
  type: project
---

Patterns confirmed while auditing, with the file/line where the precedent lives.

**Light-theme teal steps (Tier 2, token comments are the law).** hu-global.css:14-15:
`--teal-dk #1B9A90` = teal on light for icons/borders/large text ONLY; `--teal-ink #0D7268`
= teal as small TEXT on light (David 2026-08-16). Sibling Learn modules all re-step teal
on light (learn/index.html:32-33,87-88; process-engineering:45-46; sources:66-69).
**How to apply:** any raw `var(--teal)` that survives into light theme on a meaning-bearing
element is drift, not a local choice.

**Focus-ring law.** `outline:2px solid var(--teal)` PLUS a `[data-theme="light"]` override
to teal-ink/teal-dk, everywhere in hu-global.css (147-148, 394, 693, 732-735). A page-local
focus rule without the light override is drift from this.

**Solid-button hover.** The house's filled/primary buttons DO get a hover:
hu-global.css:328 `.btn-primary-v2:hover{opacity:.92}`. Filled buttons with no hover state
are unfinished, not minimal.

**Blessed / deliberate (do not re-flag):**
- `#574A9E` in src/learn/request-routing/index.html:26 = light-theme purple TEXT step
  (same job as --red-dk etc.), flagged for David, deliberate.
- Literal brand hexes #4ECDC4/#DF5752/#2D9B6F in the #rrPipe dot (request-routing:551-556):
  SMIL `<animate>` values cannot take CSS vars, and a CSS fill would override the SMIL fill
  animation, so the base `fill` attribute must also stay literal. Verified confined there.
- .impeccable/config.json ignore list: shadow alphas (rgba(0,0,0,.4/.45/.5/.55)), the 3px
  side-tab Margin Note Rule edges (secret-menu, rounds, learn, about), hu-global detent
  sheet transition. All David-confirmed.

**Structure notes for request-routing (M03):** page-scoped rr-* classes on HU tokens;
`--rr-accent` (teal / teal-ink on light) is the page's own themed accent, defined at line
19/27; the four class accents ride `--fix/--enh/--opt/--nw` with `-t` text steps. Type
sits on the documented DESIGN.md ramp except one inline clamp(24px,3vw,32px) (line 947).

**DESIGN.md scales (confirmed 2026-10-01).** Spacing: 4/8/12/16/24/32/48/64/96 (DESIGN.md
front matter). Shapes ladder (DESIGN.md "Shapes", Tier 3): 8 inputs, 10 buttons, 12 cards
(--radius), 16 sheet tops, 999 pills; "corners never mix within a component family". Kit
buttons (.hu-gm-btn/.hu-gm-q/.hu-dlg-btn/.hu-gm-row) are all 10px. DESIGN.md Inputs: focus is
border-only, so a field with border focus is NOT drift.

**Game chrome precedents (games.md + siblings).** Toolbar: `backdrop-filter:none` on a static
shell bar (AF:52, DA:24). Kicker hidden at all widths (AF:58, DA:25). The "?" yields under 380
(AF:896, DA:352); phone bar gap 6 / padding 10 (AF:1347). escOpens in AF, ER, HS, UG (not DA,
not VS as of 2026-10-01). Restart verb must name a restart (AF 'Restart the shift', DA 'Reset
the wall'). Fun-shelf leave href is '/tools/#fun' (AF:5876; the shelf moved from Learn to Tools 2026-10-02).

**Traps.** `.hu-shell` is fixed-height + overflow:hidden above the phone line (hu-global
1165-1169, unlocked only at 1241): a SCROLLING page that wears it clips at every desktop size
(Vital Stats lobby, 2026-10-01). `npm run phone` reads first paint only, so in-game screens
(bet/reveal/final) escape the type floor; drive them with `window.__VS_HOOK`/`__UG_TEST` hooks
in Playwright. Playwright's default colorScheme is light and the site follows it: pass
`colorScheme:'dark'` for a real dark pass. No `.visually-hidden`/`.sr-only` utility exists in
site CSS.

**Vital Stats local patterns (blessed, do not re-flag).** The palette block `#vs, .vs-picker
{--felt...}` + light twin; transparent toolbar over the felt; 16px card radius and 22px card
padding (internally consistent); teal `--acc` primary; big-screen clamps L127-132.

Related: [[audit-scope-rules]]
