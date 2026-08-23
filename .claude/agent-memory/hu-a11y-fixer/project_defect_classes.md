---
name: defect-classes-and-origins
description: Recurring a11y defect classes on this site and the shared include/CSS files they originate in; fix the partial, not the eight pages
metadata:
  type: project
---

Site-wide audit 2026-08-22 (read-only). Six defect classes recur, and most trace to a SHARED file, so one diff there beats eight page diffs.

**Why:** a defect in `hu-global.css`, `base.njk`, `hu-kit.js`, `rounds.css` or `components/tool-attribution.njk` multiplies across every page that loads it. Ranking by origin file, not by page count, is how the fix budget stays small.

**How to apply:** when a new finding lands, check whether it belongs to one of these classes first; if so, fix at the origin and re-check the consumers rather than patching the page in front of you.

1. **Teal-as-text with no light-theme override.** Origin `src/assets/css/hu-global.css`. The `[data-theme="light"]` override list (lines ~48-51 plus scattered per-component rules) covers some consumers and misses others. Missed shared chrome as of this audit: `.eyebrow` / `.section-eyebrow-v2`, `.tool-bar-title span` (the tool h1 accent), `.tool-attribution .ta-brand span` + `a:hover` + `--fixed .ta-toggle:hover`, `.nav-theme-btn:hover`, `.hu-fab:hover/.is-on`, `.btn-ghost:hover`, `.btn-secondary`, and the base `a { color:var(--brand-primary) }`. Brand teal is 1.72:1 on the light page bg. See [[teal-ink-migration]] for the ruled classification method.
2. **Div/span with an onclick and no role+tabindex+key handler.** Per-page, not shared, but it clusters in the hand-coded tools: iceberg-map, sql-mystery, learn/talks/arma-2026. Semantic `<button>` is the fix, not ARIA.
3. **Focusable control with no key handler.** Origin `src/assets/js/hu-kit.js` `sheet()` — the injected `.hu-sheet-grab` button is pointer-only, so every tool that adopts the kit sheet ships one named, tabbable no-op. Same shape appears in JS-built `role="switch"` spans when the delegated Enter/Space listener is bound to the wrong container.
4. **Custom tabs that never announce state.** Origin: per-page. `src/index.html` has the CORRECT reference implementation (role tablist/tab/tabpanel + aria-controls + aria-selected updated + arrow keys). Copy that one. laws-and-paradoxes and multi-lens-map both diverge from it in different directions.
5. **Focus indicator removed or absent.** Origin `hu-global.css` (`.fs-input:focus { outline:none }` in the footer form, which is on every page) and `src/assets/css/rounds.css` (zero focus rules for all four Rounds posts).
6. **Redundant `aria-label` overriding real content.** Buttons/inputs that already have a `<label for>` or visible text get an `aria-label` on top, which replaces the visible name and breaks 2.5.3. Shows up in assignment-compass, the `.hv-search` / `.lv-inset` buttons, and laws' `.jp-loop-play`.

Palette gap worth knowing: `--amber-dk` exists as the light-theme deep step but there is NO `--green-dk` or `--red-dk`. `--green #2D9B6F` is 3.48:1 and `--red #DF5752` is 3.73:1 on white, so both FAIL 4.5:1 as small text in light theme (assignment-compass ledger deltas). `--blue-hi #2478d4` is 4.46:1 with white text, a hair under AA, and that one is a brand-fill decision for David.
