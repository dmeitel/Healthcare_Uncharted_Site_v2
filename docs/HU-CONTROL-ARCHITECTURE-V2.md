# HU Control Architecture v2 — Selectors over chip rows

**Status: STANDARD — ROLLED OUT TO ALL TOOLS 2026-07-09.** Pilot reviewed and approved by David; the remaining tools migrated the same day (parallel agents, one per file, each verified with a headless node harness against the real code). Summary rules live in HU-TOOL-SHELL.md (Control Architecture v2 section); this doc keeps the rationale, migration table, and serializer convention.

**Rollout outcomes (2026-07-09):**
- **Operators Map** (reference): Dataset + Metric selectors, county overlay in the metric popover + applied strip, quintile-band legend isolates, type legend filters, URL views, 3 preset Views behind the pin.
- **Multi-Lens Map**: left metric panel gone at all widths (canvas takes the column); Metric selector with lens sections + search-within (~48 options); detail card relocated to the Inspector dock (now reachable on phone, it wasn't before); bespoke mobile metric sheet deleted; URL views (lens/metric-slug/year/trend/mode/grain/state/vs) with legacy #hash upgrade; 4 preset Views.
- **Atlas**: chip row + separate legend unified into ONE Layers panel (toggles + connections + legend key), same surface every width; applied strip tracks layer state incl. "Expanded: N nodes"; hash deep-links untouched by design.
- **Vendor Directory**: sidebar stays ≥1100px; Sector selector below (replacing a native mobile <select>, and covering the 860-1099 squeeze band); applied sector chip; ?sector= URLs.
- **Career Tree**: Metric selector; 8 pathway dropdowns → one Pathways filter panel with live face count; "Pathways: N hidden" chip; ?view/metric/hide/hidepw URLs (hide and hidepw split because three slugs are both family and pathway).
- **Iceberg Map**: Focus + Visibility merged into one popover (both were desktop-only before — phones had NO filter access); hidden-layer chips; ?n/sub/focus/hide URLs.
- **Hospital Blueprint**: no structural change needed (legend-only chrome). **SQL Mystery**: exempt (editor).

**Convention clarifications from the rollout** (now canonical, also reflected in the shell doc):
1. **Phone bottom-docking applies to DEDICATED selector strips** (Operators). A toolbar that mixes selectors with identity chrome (tabs, breadcrumbs, My Path) stays put — popovers still open as bottom sheets, which is where the thumb actually interacts.
2. **Multi-select toggle rows use `aria-pressed`** (single-select rows use `aria-selected`); the global .pop-opt check mark now supports both.
3. **Search-within is required at >12 options in a FLAT list.** A well-grouped panel (.pop-sec sections) can defer it to roughly double that; Multi-Lens (~48, searchable) vs Vendor (21, grouped, no search) bracket the call.
4. **Popover triggers carry `[aria-haspopup]`** and the outside-click closer keys on that attribute, not on .selector — icon-btn triggers (the Views pin) are legitimate.
5. **Session preferences (colorblind mode, the 123 toggle, Lines) never serialize** — view config only. Primitives (`.selector`, `.selector-pop`, `.pop-sec`/`.pop-opt`, `.applied-strip`) are live in hu-global.css; the Operators Map is converted. Pilot decisions, per the crit: county overlay joined the metric popover as its own section (applied strip shows it, ✕ clears it); applied strip sits under the bar (open question 2, option A); direct-manipulation legend baked in (U.S. quintile bands tap-to-isolate, state-view type legend tap-to-filter); phone selectors dock at the BOTTOM in the thumb zone and their popovers open as sheets; 44px coarse-pointer floor applied globally (selector, pop-opt, toggle-chip, icon-btn). After sign-off this doc's rules move into HU-TOOL-SHELL.md as STANDARD and the remaining tools migrate per the table below.

This is the next tier after the Tool Shell + instrument skin rollout: unifying not just how tools LOOK but how their controls WORK, so the data owns the screen and every tool operates the same way.

## The problem this solves

Every tool grew its own control surface: chip rows (Operators), a permanent metric panel (Multi-Lens), a sector sidebar (Vendor), toolbar buttons (Atlas). Three costs: vertical space stolen from the data, a new layout to learn per tool, and no shared muscle memory. The research consensus is progressive disclosure with visible state: hide the CONTROLS, never hide the CHOICES. Information overload is the top complaint in data-dense UIs (~47% of users in one study). The trap to avoid: collapsing a filter into a popup with no visible trace of what's applied trades clutter for confusion.

## The three primitives

### 1. The Selector
A compact tool-bar control: concept icon + current value + chevron. `[layers] Hospitals ▾` · `[bar-chart-2] Total hospitals ▾`. Click opens a popover listing options (single-select). The current choice IS the button face, so state stays visible by construction.
- Semantics: W3C APG combobox/listbox. Esc closes and returns focus; arrows navigate; outside click dismisses; ONE popover open at a time.
- Phone: the popover renders as the existing `.shell-sheet` bottom sheet instead.
- Build on: `.toggle-chip` visual language + `.pop-head` header + the exploration icon vocabulary (HU-TOOL-SHELL.md).

### 2. The Filter Panel
For multi-select / complex filtering (Atlas layers, Vendor sectors). A popover with the `.pop-head` header (icon + mono title + ✕), option groups inside, immediate-apply. Popovers have a complexity ceiling: big filter sets get a panel or sheet, never a cramped popover.
- Semantics: non-modal dialog (APG dialog pattern for focus behavior).

### 3. The Applied Strip
A slim strip of removable chips (each with ✕) under the tool-bar, appearing ONLY when non-default state is active and not visible on a selector face (multiple layers on, compare mode, county overlay). Default view = zero strip = pure data.

## The rules

1. **Rule of Two.** At most two always-visible control clusters per tool: the primary mode switcher + one context control. Everything else lives in selectors/panels.
2. **Same concept, same position, every tool.** Order in the tool-bar: wordmark → dataset selector → metric selector → spacer → view/time controls → help. Combined with the icon vocabulary, learning one tool = learning all of them.
3. **State always visible.** On a selector face or in the applied strip. Never a mystery why the map looks the way it does.
4. **Primary mode stays exposed.** Lens tabs (Multi-Lens), view tabs (Career Tree): a tool's identity-level switch earns permanent chrome. Frequent-use-stays-inline is consistent across the filter-UX literature.
5. **Popover contract (all of them).** Esc closes + returns focus to trigger; outside click closes; one open at a time; focus management per APG; phone = bottom sheet; icons from the standard vocabulary; JS-injected icons need inline SVG or a guarded `lucide.createIcons()` re-call.

## Per-tool migration sketch

| Tool | Becomes selectors | Stays exposed | Notes |
|---|---|---|---|
| Operators Map | RESOURCE row, COLOR BY row | (nothing else needed) | ~110px of chip rows → ~36px; county layer joins the metric popover in state view. PILOT HERE. |
| Multi-Lens Map | Left metric panel → selector popover (groups become sections) | Lens tabs, bottom bar (time/mode/view) | Biggest single data-space reclaim on the site. |
| Atlas | Layer toggles + legend unify into ONE filter panel | Search, breadcrumb | Same surface desktop and phone (today: hidden desktop panel vs mobile sheet). |
| Vendor Directory | Sector sidebar below desktop width | Sidebar on wide desktop (it's a browsing surface) | Applied strip shows active sector. |
| Career Tree | BLS color mode, education filters | View tabs, My Path | |
| Iceberg Map | Layer filter chips | Breadcrumb | |
| Hospital Blueprint | Category emphasis (if kept) | Legend | Lightest touch. |
| SQL Mystery | (none — it's an editor) | Case list, schema | Exempt; note why in the doc when implemented. |

## URL-addressable views — the serializer convention (crit #3, piloted here)

Every configured view is a URL; the bare path is the default view. Moves into HU-TOOL-SHELL.md with the rest of this doc after review. The rules, proven on the Operators pilot:

1. **Query params, short names, defaults omitted.** `?res=dialysis&metric=star&state=TX&org=…&county=patient:2&band=3&hide=psych,ltac&fac=450057`. A default value never appears in the URL, so serializing the default state yields an empty query.
2. **Stable keys, never indexes.** Metrics serialize by their `k` key so reordering a metric list doesn't break shared links.
3. **Push on scope, replace on tweak.** View-scope changes (us↔state↔org) push a history entry; in-view adjustments (metric, overlay, filters, facility select) replace it. Back walks views, not every metric flip.
4. **Restore before first paint.** `applyURLState()` runs in init after data load, ahead of the first render — including fetching a non-default dataset if the URL names one. Invalid params degrade silently to defaults, and the first render re-serializes, so a mangled shared link self-normalizes.
5. **popstate = reset to defaults, re-apply from URL, render.** One code path for back/forward; a guard flag stops the render from re-writing the URL mid-restore.
6. **Serialize committed state only.** Camera transform, hover, open popovers, and the county PROFILE selection stay out of the URL (the county overlay metric is in). The 123-numbers toggle is a session preference, not view config — out.

## Sequencing

1. Codify `.selector`, `.selector-pop`, `.applied-strip` primitives in hu-global.css + this doc moves from PROPOSAL to STANDARD inside HU-TOOL-SHELL.md.
2. Pilot on Operators Map (reference implementation; clearest before/after).
3. David reviews. Then rollout, tool by tool, same agent pattern as the skin rollout.

## Open questions for the review

- Multi-Lens metric panel: full selector conversion, or selector only below desktop width? (The panel doubles as a browsing surface; the Vendor sidebar precedent says keep-on-wide is legitimate.)
- Applied strip position: under the tool-bar (pushes canvas) vs floating over the canvas top edge (covers data). Research favors always-visible over overlay; pilot should try under-bar first.
- Do selector popovers need search-within for long lists (Multi-Lens has ~40 metrics)? Probably yes at >12 options; APG combobox supports it.

## Sources

- Pencil & Paper, enterprise filter UX: https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-filtering
- Pencil & Paper, dashboard UX: https://www.pencilandpaper.io/articles/ux-pattern-analysis-data-dashboards
- UXPin, Filter UI & UX (2026): https://www.uxpin.com/studio/blog/filter-ui-and-ux/
- Eleken, popover UX limits: https://www.eleken.co/blog-posts/popover-ux
- Aufait, dashboard filter design: https://www.aufaitux.com/blog/dashboard-filter-design-guide/
- W3C ARIA Authoring Practices (combobox, disclosure, dialog): https://www.w3.org/WAI/ARIA/apg/patterns/
- Good Practices, filter chips: https://goodpractices.design/components/filter-chips
- Setproduct, sidebar vs top bar vs inline filters: https://www.setproduct.com/blog/filter-ui-design
- UI-Patterns, progressive disclosure: https://ui-patterns.com/patterns/ProgressiveDisclosure
