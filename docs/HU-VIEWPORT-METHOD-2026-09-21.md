# Reviewing scale and spacing at every viewport

Written 2026-09-21, from a session where David read the site on his own phone and found a
string of faults that every automated check had called CLEAN. This is what those faults had
in common and how to find the next one. It is a method, not a list of fixes.

---

## 1. One cause was behind most of it: breakpoints that test WIDTH

Every media query on this site asked how WIDE the screen is and inferred the device from it.
A phone on its side is 740px wide. That is over the 699px line, so the site decided it was a
desktop and served desktop things to a touch screen held in two hands.

It surfaced as six unrelated-looking bugs:

| symptom | actual cause |
|---|---|
| the header changed when the phone rotated | nav collapse keyed to `max-width:699px` |
| chart labels at 4 to 7px in landscape | the PHONE CHART SWAP keyed to width |
| the cost of living chart squeezed to 392px | the tool shell's stacking keyed to width |
| second bars did not shrink sideways | their own phone rules keyed to width |
| 22 of 54 pages failed landscape | all of the above |
| the bottleneck diagram's labels stayed desktop-sized | its phone rule keyed to width |

**The rule now:** a phone is decided by the SHORTER side of the screen, not the width. In CSS
that is `@media (max-width:699px), (max-height:500px)`. In the harness it is
`Math.min(w, h) <= 699`. When something is right at 360 and wrong at 740x360, look for a
width-only media query before looking at anything else.

---

## 2. The failure patterns, and how each one hid

Each of these passed every check that existed at the time. That is the point: they are the
shapes a fault takes when the obvious checks cannot see it.

**Content spilling out of a fixed-height box.** The 4Ps section nav was a 64px box holding
231px of links, so three of the four painted over the article text. The document neither
scrolled nor clipped, so overflow and clipping checks both read clean. An element was simply
lying about its height. Found on 7 pages once looked for.

**A label wider than the box it labels.** "one shared shelf" rendered 140px inside a 72px
shelf and hung 34px out each side across the incoming arrows. The collision check compared
text to *other text*, so text overflowing its own container was invisible. SVG has no
overflow rule to catch it either.

**A bare element selector leaking.** `nav { }` matched all six `<nav>` elements on the site
and forced each to the header's height, sticky and blur. That is what made the 4Ps nav a
64px box in the first place. The same trap had already bitten the phone bottom bar once and
been patched locally instead of at the selector.

**Sticky is not stuck.** The chrome check counted a sticky element as a top bar while it was
still sitting at y=561 in the middle of the page, unpinned. It reported 129px of chrome on a
page that never shows more than 64px. A bar earns the name by touching an edge.

**Summing what overlaps.** Chrome was measured by adding bar heights. Two bars sharing a
strip double-counted. Measure the UNION of the bands they occupy.

**Checks gated to "phone".** Layout checks only ran when the viewport was a phone, so tablet
and desktop printed `n/a` and passed without being checked at all. A layout fault is a fault
at every size. Only phone PHYSICS (44px touch targets, the type floor, the chrome budget)
belong to phones.

**Reading only the top of the page.** Every check ran once, at scroll 0. Anything that only
goes wrong further down was invisible by construction.

**A phone-only `@media` block placed BEFORE the rule it overrides.** Loses at equal
specificity. This has cost time in more than one session. Either put it after, or qualify the
selector (`nav.section-nav` beats `.section-nav`).

**JavaScript that writes inline styles beats CSS, always.** `placeStage()` computed
`H*0.53 - h/2` and wrote it to `style.top`. A CSS fix for the same property could not win,
and the layout broke in a way that read as a CSS bug. If a layout will not obey the
stylesheet, grep for `.style.` on that property before rewriting the CSS again.

---

## 3. The checks that exist now

`npm run phone -- <paths>` runs all of these. Eight viewports by default: 360x740, 430x932,
699x900, 700x900, 768x1024, 1024x768, 1280x900, 740x360. The pair either side of 699 is
deliberate, because a breakpoint is where layouts break.

Every page is read the whole way DOWN, in screen-sized steps, and the findings merged.

| check | catches | runs at |
|---|---|---|
| console errors | broken scripts | every size |
| horizontal overflow | the page scrolls sideways | every size |
| CLIPPED | content cut off by `overflow-x:hidden` | every size |
| COLLIDE | two SVG labels overlapping | every size |
| SPILL | content taller or wider than its own box | every size |
| LABEL PAST ITS BOX | a label wider than the rect it sits in | every size |
| sub-44px targets | unhittable controls (warning) | phone only |
| type floor | text under the readable minimum | phone only |
| faint lines / dim labels | diagram contrast below 3:1 / 4.5:1 | phone only |
| chrome budget | fixed bars over 20% of the screen, or 2 stacked | phone only |

---

## 4. The method

1. **Test a ladder, not spot sizes.** Clean at 360 and clean at 1280 says nothing about 470.
2. **Include the breakpoint edges.** 699 and 700 are one pixel apart and different layouts.
3. **Read the whole page.** A check that runs at scroll 0 tests a screenshot, not a page.
4. **Split checks by what they mean.** Layout at every size, physics at phone.
5. **When a new check finds something, prove it catches the bug it was written for.** Put the
   old markup back and confirm the gate fails. A check that has never failed is a check that
   has never been tested. The label-overflow floor was verified this way before being trusted.
6. **When a fault appears at one size and not another, suspect the breakpoint first.**
7. **Read the comment before writing the question.** A contact sheet of sixteen page-tops made
   a designed set of exceptions look like chaos, and produced a decision request for something
   that had already been decided, with the reasons sitting in the code. A screenshot shows you
   WHAT differs, never whether it was meant to.

---

## 5. What this still does not cover

**Interactive state.** Every check loads a page and reads it. Nothing starts a game, opens a
panel, fills a form or plays a shift. The Alarm Fatigue overlaps David photographed mid-shift
are invisible to all of it: swept across eleven widths, the page is clean at every one,
because idle those panels do not exist. This is the largest remaining hole and it is a
different kind of work from the ladder.

**Whether it looks GOOD.** Every floor here is a "not broken" test. Nothing measures rhythm,
balance or whether a screen feels crowded. That reading is David's and the harness exists to
stop wasting it on faults a script can find.
