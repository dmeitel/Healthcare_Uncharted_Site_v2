---
name: recurring-defect-classes
description: The one checklist of defect classes that repeat across HU pages, merged from four separate 2026-08-16 audits (atlas, hospital-map, operators-map, multi-lens-map), with the files each class clusters in
metadata:
  type: project
---

Grep these before writing any findings table. Merged 2026-09-19 from four files that each
claimed to be this list (operators-map, atlas, hospital-map and multi-lens audits, all
2026-08-16). Two of them even shared this same `name:`, so agents were reading whichever one
loaded and missing the rest.

**Why:** these are structural habits in shared scaffolding, not one-off typos. The map tools
copy each other's machinery verbatim, so a defect in one is almost always in its sibling.

**How to apply:** grep the sibling tool before calling anything page-local. Check
[[blessed-do-not-reflag]] before reporting anything here.

## Keyboard and semantics

1. **Click-only divs and spans as controls.** `role="switch" tabindex="0"` spans with
   delegated click handlers and no Enter/Space keydown. Also generated rows with inline
   `onclick`, marquee signs, infra badges, ground zones. Clusters: operators-map
   gvLabState/gvLabCity (~L1346), multi-lens lvMoreSw/lvLabState/lvLabCity, atlas .find-row
   /.conn-row/.hud-drow/.fd-chip/.abc-item, hospital-map secondary chrome. Grep `onclick=`
   and `addEventListener('click'` on non-button elements every audit.
2. **Nested interactives inside buttons.** Action spans routed by `e.target` inside a real
   button: gvPillClr (in gvPill, L282), `.gv-only` inside `.hu-chip`, ovbtn/pinbtn in
   multi-lens. Pointer-only, and they pollute the parent's accessible name.
3. **Accessible names that lie or go missing.** Static `aria-label` hiding a live readout
   (lvMetricBtn hides metric/position/year). `title` updated on state change while
   `aria-label` is not (gvDraw when it becomes "clear"). The in-file precedent that does it
   right is updateScopeChip.
4. **No h1 on full-map tool pages**, drawer sections jumping straight to h5 (multi-lens
   6x h5 / 0x h1, operators-map 0x h1). base.njk supplies no heading.
5. **Closed kit sheets stay in the tab order.** `.shell-sheet:not(.open)` is transform
   off-screen only (hu-global.css ~L822) and `hu-kit.js` sheet() sets no inert or
   visibility. Every tool using HUKit.sheet inherits invisible tabbable content.
6. **Hand-rolled close buttons** instead of the `.icon-btn` primitive (hu-global.css:577):
   atlas #hud-close, #help-close, #conn-panel-close.
7. **No noscript anywhere in src/.** Every tool renders inert chrome with JS off.

## Contrast and theme

8. **Sub-11px low-alpha text fails in both themes.** Scene-painted tools use
   rgba(140,180,215,.35-.6) and rgba(78,205,196,.3-.5) at 7 to 10.5px, landing 1.9 to 3.4:1.
   The 11px functional floor is in `.claude/rules/css.md`. Caveat: 9.5-10px mono CAPTIONS are
   the QP3 Caption Rule precedent sitewide, so only flag sub-11px text that is INTERACTIVE
   (`.gv-only` at 8.5px and clickable counts).
9. **Light-theme gaps on JS-set SVG attributes.** Presentation attributes need explicit
   `[data-theme='light']` overrides. Atlas `.exp-sub` (fill #E2EEF4, 1.19:1 on light) missed
   while `.az-lbl` got it (line 357); frontier hexes missed while moat tiles got it.
10. **Light-theme teal hover.** `:hover { color/border: var(--teal) }` without the
    `--teal-dk` override the same file applies to resting states. #4ECDC4 on white is 1.9:1.

## Phone layout

11. **The phone bottom bar overlaps tool chrome.** base.njk (~L216) keys the hu-bbar on
    `navPage == 'tools'`, so every tool DETAIL page gets the fixed z-150, ~56px bar, not just
    the hub. All 8 files in src/tools/ set `navPage: tools`. Anything fixed or absolute at
    bottom under 56px with z below 150 hides behind it; body padding-bottom only saves static
    flow. Landed with the V3 phase 3 base.njk edit, so confirm intent with David before
    calling it a regression twice.
12. **Absolute overlays keyed to the 52px toolbar height** break when the phone toolbar wraps
    (atlas #atlas-find at top:64px under a ~106px wrapped toolbar).
13. **Missing prefers-reduced-motion** where siblings have it (vendor-directory:126,
    career-tree:166, hospital-map:896). Atlas routeFlow is infinite. Note that HUKit.dcap
    returning 0 plus gated CSS handles this centrally on the tools that adopted the kit.

## State and navigation

14. **First-interaction replaceState.** The `'§init'` sentinel pattern makes the first scope
    selection replace instead of push, reproducing the Atlas back-exits-site bug. Check every
    tool's serializer.
15. **V1 leftovers after a tool promotion.** operators-map v2 kept the pilot's aria-label
    ("Hospital map demo") and dropped v1 URL params other pages still link
    (`?metric=cah` from /learn/healthcare-gap/). After any v1-to-v2 swap, grep the whole src
    tree for links INTO the tool and diff param handling.
16. **Help panels drift behind UI retrofits.** Atlas help still described a reset glyph that
    changed, a removed HUD grip bar, a "bottom of the screen" HUD and "diamond markers".
    Whenever a retrofit lands, diff the help copy against the new chrome.
17. **Duplicate ids in hand-authored arrays** collide in id-to-object maps and in
    `querySelector('[data-unit-id]')` highlights.

## Copy and data

18. **Em dashes leak through three doors:** visible UI strings, dataset definition strings
    (`desc:'...'`, metricsConfig economics/0), and frontmatter descriptions that feed og and
    twitter meta. Atlas had 21. Prose pages got voice passes; the JS data blobs did not. Also
    `—` used as an empty-value glyph (multi-lens, 11 spots).
19. **Mechanical em-dash scrubs leave two artifact shapes:** a mid-dot " · " stranded inside a
    sentence, and colon-pair parentheticals ("X: interjection: is ..."). Both read as typos.
    Check any page that had a scrub pass.
20. **Negation-contrast density in data far exceeds the hu-voice budget of one.** Site grep
    `, not |not just|rather than` hit 287 on 2026-08-16. Worst: career-tree (54),
    laws-and-paradoxes (28), hospital-map (17).
21. **Triads and the "list. verdict." card rhythm** across descs (71 runs of three sentences
    within five words of each other across ~188 atlas descs), with repeated devices
    ("alert fatigue" x4, "chronically underfunded" x2).
22. **Stale dated facts in descs.** Olive AI (defunct 2023) still listed, a 2024 premium
    figure, a "changing in 2025" OMB line.
23. **Meta descriptions on tools run long** (operators-map 275 chars) and mirror the
    `src/_data/tools.js` desc nearly verbatim.
24. **Duplicated tiles and facts** between a zone node and an expansion sub (Quality
    Measurement x2, PBM x2, one MA line verbatim x2). Search shows the twins.

## New Learn-module classes (added 2026-09-20 from the Article 11 audit, see [[alarm-fatigue-audit]])

25. **A new Learn module drops the hero furniture its siblings carry.** request-routing:434-438,
    the-payer:196-198 and process-engineering:471-473 all put a `.card-fps` Atlas strip in the
    hero, plus a byline and a hero bottom hairline (`.rr-hero{border-bottom}`); the alarm-fatigue
    hero has none of the three, so the Atlas deep links exist only on the index card. Diff any
    new module's hero against RR before calling its Atlas links "present".
26. **Sources cited in-page as plain text while references.js holds the URL.** The page's
    `.afe-src` lines link only the DOI; the TJC, Perspectives and ECRI URLs sit in
    src/_data/references.js (CURATED top) and never reach the reader. The-payer (`.jp-source`,
    line 367+) links every source and ends with a pointer to /learn/sources/. The footer
    Source Policy promises "Each factual claim is linked to its source".
27. **Blue-fill hover to the literal `#2478d4`.** That is `--blue-hi`; white text on it is
    4.45:1 and hu-global.css:22 says so in its own comment and names `--blue-deep` as the
    hover token. Grep `hover{[^}]*#2478d4` on every new page. RR and skill-demo already use
    `--blue-deep`.
28. **`display:block; overflow-x:auto` on a `<table>` at 699** instead of the wrapper div the
    two sibling modules use (request-routing:216 `.rr-tblwrap`, process-engineering:358
    `.pe-tblwrap`). Same visible result, drops table semantics in some engines.

Also: Learn prose type is now on three different steps across modules (15px --t-body,
16px --t-lede, 17px literal). The 08-23 audit ruled 17px/1.78 the precedent; the 09-20
token comment calls --t-body "prose". Unresolved, flag it as drift and let David rule.
