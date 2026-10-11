# The two maps' menus, read against the game menu rules

2026-10-08. A read-only review; nothing on either map changed. David: "based on our game building experience i think we
need to go look back at the map menuing and see if we can apply skills for it", with a phone picture of the Population
Health Map's Display panel. Both maps were driven in a browser at 390x844, 1440x900 and 740x360 and every panel opened;
106 pictures and the scripts are in tmp/map-menu-review/ (`{lv|gv}-{phone|desk|land}-NN-panel.png`). LV is the U.S.
Population Health Map, GV the U.S. Hospital Operations Map.

The standard: .claude/rules/games.md, Menus (rule 9: an item shows its name and one number, the paragraph goes behind
HUKit.peek); DESIGN.md, The Two Surfaces, rule 8 (flavor text stays on the desk); the hu-view-switch and hu-game-shell
skills; HUKit.peek, dialog, settings and howTo, which already exist.

## What a panel puts on screen when it opens

Words visible at first paint (all of the panel's words, scrolled, in brackets). Map labels are drawn on the canvas and
are not counted.

| Panel | Phone | Desk | 740x360 |
|---|---|---|---|
| LV at rest | 15 | 39 | 15 |
| LV Display, NP scope (his picture) | 48 (593) | 85 | 18 |
| LV Rankings | 76 | 97 | 33 |
| LV state card | 7 (61) | 56 | 7 |
| GV at rest | 16 | 29 | 16 |
| GV Display | 24 (56) | 56 | 10 |
| GV search, empty | 20 | 20 | 20 |
| GV facility card | 4 (167) | 102 | 4 |
| GV state card | 3 (72) | 71 | 3 |

Of LV Display's 593 words, 144 are "Size" and "Pin" on all 72 rows, and 131 are five sentences of explanation. On a
phone it opens on 48 words, 30 of them prose, and no metric row in sight. GV's Display is already chips, a name and one
count each; it is the model for LV's.

## Population Health Map

- Every card opens at the 120px peek showing only "Details · Display" and "METRIC · LIFE EXPECTANCY AT BIRTH"; "UTAH
  79.5 yrs" sits at 836px on an 844px screen. GV's cards do the same. (lv-phone-01b-state-tap.png)
- 72 catalog rows each carry "Size" and "Pin", and the names wrap ("NP scope of / practice"). Size and Pin are spans
  inside the row's button, so a keyboard cannot reach them. (lv-phone-03b-display-policy-full.png)
- Face-up prose: "Every lens, every metric lives here. Tap one and the map repaints.", the Overlay and Pinned paragraphs,
  "Reading the map" (55 words), set in mono. "The card holds what the map can't." is an aphorism closer.
- The catalog search puts its results below the fold (the list starts at 810 of 844px), inside a 44vh scroll inside a
  scroll. (lv-phone-04-catalog-search.png)
- The first-visit coach, "Tap to change what the map shows", points at "Rankings · 51" at every size, and on a phone
  lifts the dock under the locate button and the info button.
- The state card says "79.5 yrs" and "#3 of 51" twice each; "1 = best on this metric", the trend legend and "Best first ·
  tap a state to open it" are face up.
- NP scope of practice prints "1/2/3 tier" codes on the states instead of the words.

## Hospital Operations Map

- The search panel closes on X and Esc, but the phone's back gesture leaves the map. (gv-phone-02-search-empty.png)
- On a desk the Details · Display strip is cut off in every drawer: in facility-map.njk the base #gvSheet padding (line
  295) overrides padding-top:12px (line 128). LV has the two the other way round.
- "only" is a 29x15 span inside each chip button, out of a keyboard's reach, and the "ONLY = SOLO" line exists to
  explain it.
- Cards say "52" and "8" twice; one hospital shows in three different row layouts (List, the scope card, a school's
  nearest hospitals).
- Empty search repeats its own placeholder in 20 words, and the placeholder is cut off at 390.

## Both maps

- Tabs measure 148x31; the map-label switches 34x19, with only the switch tappable.
- Kickers, source lines, meta and table labels are 12px on a phone, under the 13px floor for functional text. The phone
  gate passes them because 12 is its absolute minimum, and it never opens a sheet (scripts/phone-check.js line 352).
- The info card (the "i" in the tool bar, tool-attribution.njk, on about a dozen tool pages) ignores Esc, and the
  phone's back gesture leaves the page.
- Different words for the same act: "Rankings · 51" against "List · 5,315 in view"; "Copy link to this view" against
  "🔗 Copy link to this view" (the games say Share); the locate button is "Find my state and county" on one and "Show my
  location on the map" on the other; the card name is "UTAH" on one and "Utah" on the other.

Where it lives: the 120px peek, the 34x19 switch and the extra check mark on a selected catalog row are in
hu-global.css; the info card is tool-attribution.njk; the tabs, peek layout and type sizes are copied by hand into
multi-lens-map/index.njk and facility-map.njk and have drifted (the GV padding bug is the proof). LV's Display panel,
catalog rows and coach are in multi-lens-map.js; GV's search panel and the "only" chips are in operators-map.js.

## The plan, in three parts

A. Defect fixes under the rules already in force. Every twin fix lands in both maps.
1. A card at the peek shows the name and the value, not the tabs.
2. The phone's back gesture closes GV's search.
3. The info card closes on Esc and the back gesture (one fix, every tool page that has it).
4. GV's padding order.
5. Tabs to 44px; the whole map-label row is the target.
6. Kickers and source lines to 13px on a phone.
7. Each number once per card.
8. The coach points at the metric.
9. The catalog search opens to full height, with no scroll inside a scroll.
10. One label for Copy link, one for locate, one case for a card's name.
11. The prose in the sans face; the aphorism closer cut.

B. The game menu grammar. This changes the look of a surface whose design phase closed on 2026-08-23, so it waits for
David's yes.
1. LV's metric definition and the Overlay and Pinned paragraphs go behind an "i" (HUKit.peek).
2. "Every lens, every metric lives here..." goes; the search box already says it.
3. Catalog rows show the name only. One switch at the top, Color · Size · Pin, sets what a tap does. GV's chips get
   the same, Add · Only.
4. One "?" per map (HUKit.howTo) holds "Reading the map"; the coach goes.
5. GV's search hint becomes three examples to tap.
6. One word per act across both maps: List with a count, and Share.
LV Display's phone first paint goes from about 48 words and no metrics to about 25 with four or five metrics showing.

C. Bigger, a design phase of its own.
1. One map shell instead of two hand-copied stylesheets.
2. No Details · Display tabs on a phone; Display opens from the dock.
3. One map menu (Help, labels, Share).
4. The sideways phone dock, which covers about a third of the map.
5. Category values as words instead of "3 tier".
6. A phone gate that opens panels.
