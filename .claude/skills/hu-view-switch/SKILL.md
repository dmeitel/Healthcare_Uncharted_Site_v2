---
name: hu-view-switch
description: The site's standard for a page with views or layers (tabs that swap what the page shows) - the boxed switch, the dock a phone gets, the hand-off between views, and the motion allowed. Load before adding tabs, views, sections or layer buttons to any page, or changing the ones on the fracture post, Laws and Paradoxes, Request Routing, Process Engineering or the home page.
---

# The view switch

David, 2026-10-06, after reading the fracture post in production: "the tab buttons to go between the story the paper
trail and the whole map are not really easy to see or are easy to lose as things scroll... it's easy to miss on some
of our pages what has tabs or what has different layers behind it because there's not really a visual indicator or an
animation that shows that there is something to be clicked." He opened a phase on the switch (DECISIONS L1) and picked
the dock from two mockups (L2: "dock and A, go ahead and build both").

The pieces: `.hu-seg` and the dock's styles in hu-global.css (THE VIEW SWITCH), `src/assets/js/hu-views.js`
(`HUViews.dock`, `HUViews.slide`, `HUViews.next`, no dependencies), and tests/view-switch.test.js.

## FIRM

1. IT LOOKS LIKE A SWITCH. Boxed choices, the one on screen filled in teal with dark ink. Not a row of underlined
   words: that reads as headings. Up to three or four short names: `.hu-seg`, one row. Names that do not fit a phone
   row: add `wrap-phone`, two by two. Many choices (Laws and Paradoxes' ten): boxed chips in a strip that scrolls
   sideways, the one on screen kept in view.
   SIZE (2026-10-08, David: "centering issues and font scaling issues"): on a desk the switch is as wide as its
   names, every box the width of the longest, the names at the body size; it never stretches across the column. On a
   phone it fills the row. A long name gets a short one for the phone: `<span class="lg">Careers &amp; Pay</span>
   <span class="sm">Careers</span>` (the fracture post and the home page).
2. A PHONE GETS ONE TOP BAR. The site bar is it, so the page's switch never pins on a phone; it stays where it is,
   at the top of the views. On a desk it may pin under the site bar.
3. IT NEVER LEAVES REACH. Where the views run more than a couple of phone screens, call `HUViews.dock`: once the
   page's switch has scrolled away, a dock slides up at the foot of the screen with the same views. Up to three: all of
   them as one segmented row. More: back, the view's name with "n of N" (a tap lists them all), forward. Layer buttons
   ride along behind a Layers button, lent to a panel over the dock and given back when it closes. The dock and its
   panel close on Esc, a tap outside and the phone's back gesture. A switch over about one screen needs no dock.
4. EACH VIEW HANDS YOU TO THE NEXT. `HUViews.next` puts a card at the end of each view: "Next view, 2 of 3", the
   name, a line in the page's own words, a button that names the act ("Read the paper trail"). The last one goes back
   to the first.
5. MOTION ONLY WHERE IT TEACHES, inside DESIGN.md's budget (150 ms state changes, 280 ms moves, 250 ms on a phone):
   the dock slides in, a new view slides in from the side you went (`HUViews.slide`), and the first time the switch
   follows you down a page the next view glows once (remembered per page). Under reduced motion none of it moves.
6. THE PAGE OWNS ITS VIEWS. The dock calls the page's own select and asks which view is on screen; the page calls
   `dock.sync()` after it changes view. A long way back is a jump (`behavior: 'instant'`; `'auto'` takes the site's
   smooth scroll) and then the view slides in.

## Wiring a page

```html
<script src="/assets/js/hu-views.js?v=20261006"></script>   <!-- before the page's own script -->
```
```js
let vdock = null;                                   // declared before the page first selects a view
function select(i) { /* the page's own */ if (vdock) vdock.sync(); }
if (window.HUViews) {
  vdock = HUViews.dock({ row: switchRow, region: viewsElement /* or () => the view on screen */, names, tabs,
    label: 'What the views are called', key: 'page-name', current: () => index, select: i => select(i),
    layers: { el: layerButtons, label: 'Show under every step', on: i => i === 0 } });   // layers optional
  panels.forEach((p, i) => HUViews.next(p, { kicker, title, text, button, go }));
}
```
Then add the page to DOCKED, SHORT or OWN in tests/view-switch.test.js; a page with a tablist on none of the lists
fails it. The reference builds: the fracture post (three views, layers), Laws and Paradoxes (ten, the stepping dock),
Request Routing (four sections, the region follows the section on screen).

## Watch for

- A page with the phone's bottom bar (`.hu-bbar`, the home page): the dock would sit on it. None has both today.
- A page CSS rule like `[data-theme="light"] .x[aria-selected="true"] { color:... }` outranks `.hu-seg` and leaves
  teal text on a teal fill. Take the page's old selected-state rules out when the switch moves to `.hu-seg`.
- The reading pages do not load the kit (hu-kit.js); hu-views.js is standalone for that reason.

Closing the phase writes this into DESIGN.md Tier 3; until then this file and the test are the standard.
