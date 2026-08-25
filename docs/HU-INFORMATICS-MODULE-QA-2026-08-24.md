# HU INFORMATICS MODULE · DEVICE QA · 2026-08-24
### /learn/request-routing/ · "Informatics Work: Routing Requests" · Method 03
### Status: feature-complete, audited (hu-auditor + hu-mobile-tester + hu-polish), ALL UNCOMMITTED

Twelve build rounds and a three-agent audit pass in one day. The suite is 41/41, the
phone tester passed 360/390/430 after the sticky-rail fix, and every audit finding is
either fixed or listed under YOUR CALLS below. What is left is the part only a person
holding a phone can do.

---

## THE DEVICE PASS · in order

1. **The tab rail vs the site nav.** Scroll deep into tab 1, then scroll up. The
   section rail should dock BELOW the site nav (top:64px), and the logo, hamburger,
   and search must stay tappable everywhere on the page. This was the one real mobile
   defect found; it is fixed, and it is the first thing to confirm on real hardware.
2. **The flowsheet at arm's length.** Tab 2, full read. The small mono labels render
   around 8px at 360 wide. The audit flags this against the 11px floor; the counter
   position is that the phone-first vertical layout was chosen over side-scroll.
   Your eyes decide (see YOUR CALLS).
3. **Both JPG downloads.** Flowsheet tab and the lifecycle figure on tab 1. Each
   should land a file and open clean. Toggle light theme and download again for the
   white-background versions.
4. **The pocket card.** Reference tab, Copy the card, paste into Teams or a note.
   Line wrapping should survive (all lines are 74 characters or fewer).
5. **The router and the drill.** Walk the router to a verdict, change an early answer
   midway (the stale-project bug is fixed; the track question must clear), then run
   the full 8-item drill. Judge the drill's LENGTH: is eight brisk or one screen too
   long on a phone?
6. **The bridge.** Tap every party card open and closed. The expanded text now lives
   outside the button (screen readers get it as content, and it is selectable).
7. **The operating day.** Tick boxes tonight, confirm they persist on reload, confirm
   they reset tomorrow morning (resets at local midnight).
8. **Light theme, whole page.** Class colors flip to their dark-text steps, focus ring
   is teal-ink, nothing washes out.
9. **Deep links.** Text yourself /learn/request-routing/#flowsheet and #reference;
   each should open on its tab.

---

## YOUR CALLS · open decisions, none blocking commit

- **--purple-dk token.** The page carries #574A9E locally for light-theme purple text.
  Bless it and it should be promoted to hu-global next to --red-dk and friends.
- **SVG label size on phones.** ~8px effective at 360 for the mono annotations.
  Options: accept (body copy repeats everything), or min-width the figures with
  internal side-scroll to hit the 11px floor. Audit says floor; the build says the
  full-view vertical read was the point.
- **Reading-chrome semantics.** First tabbed module under the progress hairline and
  finish-tick: a reader "finishes" at tab-1 bottom without opening tabs 2-4. The
  chrome is content-agnostic by design; is that acceptable for tabbed modules?
- **Body type 16px vs the M01 17px precedent.** One-line change if you want parity.
- **Slug and shelf.** /learn/request-routing/ and "Method 03" both kept after the
  retitle; both cheap to change before commit, expensive after deploy.

## CONSCIOUSLY KEPT · so nobody "fixes" them later

- "Technical deep dive" in the capability-development checklist: your own source
  phrasing, kept over the audit's style nit.
- The JPG buttons store a byte count on the button element: the only headless test
  hook for the exports.
- The classification tree has no download button: it is stateful (lights per class)
  and the exporter deliberately excludes interactive figures.
- The tab-1 pipeline figure and both animated dots are GONE, on your ruling plus two
  independent audit verdicts. The lifecycle figure and the flowsheet carry the story.

## AFTER YOUR PASS

Commit is yours. Post-deploy: watch GoatCounter for /learn/request-routing/, and the
share-worthy artifacts are the two JPGs and the pocket card.
