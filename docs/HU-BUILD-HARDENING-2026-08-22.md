# HU BUILD HARDENING · 2026-08-22
### Tests, type checking, and the path off 1.1MB of inline JavaScript

Written after David asked whether the site should move off vanilla JS on Eleventy as
scope grows. The answer was no, and this is what we did instead.

---

## 1 · WHY NOT A FRAMEWORK

The measurements that settled it:

| | |
|---|---|
| Inline tool JS | **1.1 MB** across 8 tools |
| Largest single file | career-tree, **7,836 lines** (416KB JS + 119KB CSS) |
| Shared, reusable JS | **860 lines** (hu-kit 443, hu-search 209, compass-engine 208) |
| Full build | **1.3s** for 54 pages |
| Tests / type checks before today | **0 / 0** |

Eleventy is not the constraint. A React or Next migration would rewrite seven D3 and
MapLibre instruments over months, would still leave 416KB of Career Tree logic (just
in `.tsx`), and would cost the things that make this site work: zero-JS content pages,
a static deploy with no server, second-long builds, and SEO simplicity for the Learn
and Rounds writing that is half the site's purpose.

A framework earns its place when you need accounts, auth, server-side
personalization, a backend, or shared client state across routes. This site has none
of those. It is a content site with instruments embedded in it.

**What actually hurt, evidenced by the 2026-08-17/18 sessions:**

1. No module system. Four copies of the same popover had quietly diverged across four
   files before the kit extraction.
2. No type checking. A refactor deleted a local and left three reads behind: a
   guaranteed runtime `ReferenceError`, caught by luck and a grep.
3. No tests. Five harnesses had to be written from scratch to have any safety net.
4. Single-file tools. 7,836 lines with markup, CSS, and JS interleaved.
5. 119KB of hand-managed CSS in one file, which is how a cascade-order bug survived
   two attempted fixes.

None of those require a framework. All are fixed by modules, types, and tests.

---

## 2 · WHAT SHIPPED TODAY

**Tests** (`npm test`). Node's built-in runner, zero new dependencies.

| File | Covers |
|---|---|
| `tests/helpers/dom.js` | one shared DOM stub + isolated kit loader (the harnesses had duplicated it) |
| `tests/hu-kit.pop.test.js` | the popover contract, including every drift the four hand-rolled copies had, and the late-settling-width regression from run-4 QA |
| `tests/hu-kit.urlstate.test.js` | push vs replace, seeded arrivals, suspend/begin/end, mark, Safari history throws, hash mode |
| `tests/career-phone-flow.test.js` | executes the SHIPPED `renderPhoneFlow` against the real dataset |
| `tests/site-build.test.js` | whole-site integrity: parse, links, voice rules, meta, a11y floors, kit drift, data validity |

35 tests, ~0.8s.

**Type checking** (`npm run check`). `tsc --checkJs --noEmit`. No TypeScript syntax;
plain `.js` stays plain `.js`. Types come from JSDoc, inference, and
`types/globals.d.ts`, which declares the full `window.HUKit` API so every call site is
verified instead of shrugged at.

Scope is deliberately small: `src/assets/js/`, `types/`, `tests/`. The 1.1MB of inline
tool JS is unreachable by `tsc` while it stays inside `<script>` tags. **Widening this
net is the whole point of section 3.**

`npm run check:scripts` is opt-in and NOT part of `verify`. A first pass over
`scripts/` found 11 errors and zero real bugs: every one was TypeScript widening a
heterogeneous array literal. A gate that always fails is a gate everyone ignores.

**One command:** `npm run verify` = build, then check, then test.

---

## 3 · THE ROADMAP · inline JS to modules

The sequence, smallest and safest first. **One tool per session**, each verified by
`npm run verify` before moving on.

| Order | Tool | Inline JS | Status |
|---|---|---|---|
| 1 | vendor-directory | 25KB | DONE 08-22 |
| 2 | assignment-compass | 42KB | DONE 08-22 |
| 3 | multi-lens-map | 73KB | DONE 08-22 |
| 4 | operators-map | 88KB | DONE 08-22 |
| 5 | iceberg-map | 120KB | DONE 08-22 · page 170KB to 49KB |
| 6 | atlas | 165KB | |
| 7 | hospital-map | 174KB | |
| 8 | career-tree | 416KB | last, and probably split across sessions |

**What iceberg added to the pattern.** It was the first tool carrying inline
`onclick` attributes, and module scope breaks those outright: the functions stop
being global. They became `data-node` / `data-subnode` plus one delegated listener
per container, which is also what the elements needed anyway, since both panels
rebuild by `innerHTML` and would drop any directly bound handler. Expect the same
on hospital-map and career-tree. Inline handlers are separately a CSP problem:
`script-src 'unsafe-inline'` is what permits them, so they have to go regardless.

**The move, per tool:** lift the inline `<script>` body into
`src/assets/js/tools/<tool>.js`, load it with `<script type="module" src="...">`,
export nothing the page does not need, and let `tsc` see it for the first time.

**What each migration buys:**

- The browser can cache that JS across pages. Today it is re-downloaded inside every
  HTML response.
- `tsc --checkJs` starts covering it, which is where bug class #2 above dies.
- The file becomes reviewable and diffable.
- When the last inline script is gone, `'unsafe-inline'` can come out of the
  `script-src` directive in `netlify.toml`, where a comment currently explains it is
  there specifically for inline tool scripts. That is a real security improvement and
  it is the milestone worth aiming at.

**The eight tools are necessary but not sufficient for the CSP milestone.**
Measured 08-22 after iceberg landed: every page carries 2,189 bytes of inline JS
from base.njk in four blocks (nav hamburger, theme toggle, the `lucide.createIcons()`
one-liner, and a 307-byte head IIFE). Three of the four can move to a shared chrome
module. The head IIFE cannot: it is the anti-FOUC theme setter and has to run
synchronously before first paint, so it needs a CSP hash rather than a file. Three
more pages outside the roadmap also hold real inline payloads: atlas/craft (482KB,
prototype), secret-menu/uncharted-general (121KB), and the home-respiratory-timeline
article (61KB). None of them blocks the tools work, but `'unsafe-inline'` cannot
come out of netlify.toml until they are all handled.

**Only after all eight:** consider a bundler (esbuild) if load time demands it.
Not before. Nothing here requires one.

---

## 4 · THE LADDER, CONTINUED

The instrument grammar's enforcement ladder (docs/HU-INSTRUMENT-GRAMMAR-2026-08-11.md
section 3) still has two rows open. Both need browser verification across several
tools, so they want a session with the mobile tester available.

- `.hu-drawer` class-set in hu-global (donors: `#lvSheet`, `#hct-panel` v21)
- `hu-canvas-labels.js` (donor: career-tree's quantized counter-scale, fit ladder, LOD
  hysteresis). The most entangled piece; it touches the tree's render loop.

`HUKit.pop` and `HUKit.urlState` came off that ladder on 2026-08-17.

---

## 5 · DESIGN SKILLS

Emil Kowalski's skill set is installed via
`npx skills@latest add emilkowalski/skills`. The installer writes to `.agents/skills/`
and symlinks into `.claude/skills/`; both are gitignored, so each machine installs its
own rather than vendoring a duplicated tree of Windows-fragile symlinks.
`skills-lock.json` IS tracked, so the versions are reproducible.

Relevant to this stack: `emil-design-eng`, `review-animations`, `improve-animations`,
`find-animation-opportunities`, `animation-vocabulary`, `apple-design`.
Not relevant: `animate-expo` (React Native), `ask-sonner` (React), `write-swift`.

**Precedence question still open for David.** These skills cover the same ground as
`.claude/rules/css.md` (transform/opacity only, `transition: all` banned,
`prefers-reduced-motion` respected) and `HUKit.dcap` (250ms phone cap, 0 under reduced
motion). CLAUDE.md's precedence block lists rules above the `hu-voice` skill but says
nothing about third-party skills. Until that line exists, house rules win and the
skills advise.

---

## 6 · OPEN: LANDSCAPE PHONE MAP FIT (needs a design call, not a patch)

Found during the multi-lens migration, attempted twice, **not solved**. Recorded here
so the next attempt starts from the evidence instead of the symptom.

**The symptom.** On a landscape phone (844x390) selecting a state barely zooms, or
zooms out. Both maps.

**Why it is not a padding bug.** `HUKit.phone()` is the 699px CSS line and measures
width only, so landscape takes the desktop branch. But fixing the branch does not fix
the fit:

| attempt | pad (shell 326px) | fit box | result |
|---|---|---|---|
| original | 130 + 150 = 280 | 46px | barely zooms |
| attempt 1: use the phone pad | 118 + 212 = 330 | **negative** | MapLibre logs "Map cannot fit within canvas" and refuses to move at all |
| attempt 2 (current): clamp the pad to the container | 95 + 171 | 60px | no warning, but zooms OUT: 3.60 → 3.03 on Colorado |

**The arithmetic that settles it.** `fitBounds` takes the smaller of the width-fit and
height-fit zooms, and in an 804x60 letterbox the height always binds. Colorado spans
about 0.1075 of mercator, so a 60px box asks for worldSize 3,506px, i.e. zoom 2.78.
At the boot zoom of 3.60 Colorado already renders about **89px tall**, so *any* fit box
under ~89px is a zoom-out by construction. Zoom 4.5 would need a ~198px box.

The actual landscape chrome is roughly 232px of the 326px shell (a 120px peek sheet,
the 46px floating bar, its 34px offset, the top pill row), which leaves ~94px. No pad
arithmetic reaches a useful zoom while the peek sheet eats 37% of the viewport.

**Two honest routes, David's call:**

1. *Minimum diff.* Refuse to fit when the fit would pull the camera backwards: ask
   `map.cameraForBounds()` first and `easeTo` the centre at the current zoom instead.
   Careful: a plain "never zoom out" rule breaks legitimate zoom-outs (county → state
   → US), so it needs to fire only on the letterbox case.
2. *Real fix.* Give landscape its own chrome: a shorter peek detent (~64px) and the
   floating bar off-centre. That makes a ~180px box and a genuine 4.4 zoom possible.

**Detection warning for whoever picks this up:** the defect used to announce itself in
the console and no longer does. A clean console does not mean the fit worked. Hook the
MapLibre constructor and read `map.getZoom()` before and after; the recipe is in
`.claude/agent-memory/hu-mobile-tester/reference_test_harness_quirks.md`.
