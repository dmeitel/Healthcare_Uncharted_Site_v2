---
name: vital-stats-audit
description: Vital Stats game pre-publish audit 2026-10-01 (secret menu to /fun/vital-stats/) - the move happening concurrently, what was clean, the browser harness that reaches every screen, and the known-deliberate exemptions
metadata:
  type: project
---

Audited src/secret-menu/vital-stats/index.html on 2026-10-01 at night, before an optimization pass and the move to
/fun/vital-stats/. There were 32 findings, and the table lives in tmp/vs-polish/audit.md. See [[recurring-defect-classes]] 29 to 35.

**Trap: the move ran in another session WHILE the audit ran.** netlify.toml (redirect L104), src/learn/index.html
(card L705), src/search-index.njk (L23 already pointing at /fun/vital-stats/) and build-tool-thumbs.js all changed
mid-audit, and the sm-vital-stats thumbs were deleted while src/secret-menu/index.html still referenced them.
The page source itself held still, which I checked with `stat` before writing. Frame move items as "check against the move"
and do not report a half-done move as a broken link.

**Exemptions the brief named (do not report):** the big-screen code clamp(48px, 8vw, 112px); the local
`#vs, .vs-picker{ --felt… }` palette; engine and page in one file (the engine block is separate).

**Clean here, spot-check only:** zero em dashes in the source, the built meta and all 31k bank strings; zero banned words;
negation-contrast 1 (L1605); every text pair passes in both themes (the light palette is already deep); reduced
motion handled; no overflow at 360, 740x360 or 1280; every name escaped.

**Harness that reaches every screen** (tmp/vs-polish/walk*.js): set `window.__VS_HOOK=true` in addInitScript and
`window.__vs` exposes { E, G, act, render, mode, T }. Set localStorage vs-name and hu-howto-vs=1. Route
`**/.11ty/reload-client.js` and `**/vendor/supabase-*.js` to empty bodies, and rooms then fall back to same-browser tabs,
so one context with two pages gives you a host and a guest. On an upright phone the `.vs-main .vs-act` is
display:none and the dock holds the copy, so wait with `state:'attached'` and click `.vs-dock [...]`.

**What surprised me:** the worst defects only showed at 740x360 (scroll carry-over) or with a second tab (lobby
rebuild under a join, guests' dead-looking settings). A single-tab 360 walk would have missed four of the top seven.
