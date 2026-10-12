# The site-wide refresh · 2026-10-11

CLOSED 2026-10-12 (DECISIONS BR4, "yes close the brass phase"). What shipped is DESIGN.md Tier 3; this file is the record of
how it got there.

David, 2026-10-11: "ok lets make these changes along with any other changes that can be done by the AI. do a whole
site wide refresh and then i will do a page by page review and QA in the tool. That will serve as our final
point/Review on these first batch of pages and change for the website and help serve as a mile marker going forward.
take a look at all notes outstanding, make a list of the total changes you are going to execute, do them in order
and QA all work... I will be reviewing each page in day and night themes, so please make sure all of those steps are
ready."

That answers BR1 (the whole site, now), BR2 (brass joins the brand colors, raised keys replace the flat look) and
BR3 (Fun becomes its own section, the games leave the Tools shelf). The look is round 3.1 of the design direction
(docs/HU-DESIGN-DIRECTION-2026-10-11.md), with the heavier lines from the line weights card.

The notes read for this list: every answer and note on the hub's Ideas tab (42 answered), every QA list on the hub
(all Good but one old Device Assembly recheck), the board's Inbox (13 cards), DECISIONS.md, and the page ledger's
failing checks (33 meta descriptions, 19 pages repeating the shared reading layout, 12 pages with writing findings,
4 source lines without a date).

## The list, in the order it runs

### 0 · Set up
1. Record the answers (BR1 to BR3 to the decisions log), open the design phase "The brass instruments look,
   site-wide" in CLAUDE.md, and add brass to the brand colors in DESIGN.md.
2. The board: this milestone in focus; the page-over-page review card becomes its QA; the heavier lines card's QA
   rides the same review.

### 1 · The shared look (every page changes at once)
3. The tokens for night and day: brass, keys, faces, glass, depth. The six brand colors do not change.
4. The top bar: keys for the sections, Fun added between Tools and Learn, brass on the section you are in, the
   theme switch as a key; the compact tool bar and the phone menu.
5. Buttons: brass for the one main act on a screen, navy keys (white keys in day) for the rest; pressed, focus and
   off states.
6. Cards and panels: framed faces; clickable cards as raised keys.
7. Chips, pills, the view switch (keys in a recessed track) and toggles (switches, brass when on).
8. Fields and readouts: search boxes and selects as recessed glass, dark in both modes; stat tiles as readouts.
   (Changed on David's review: fields are a light well in day now; readouts stay glass in both modes.)
9. The kit's cards: dialogs, sheets, the peek card, how-to, the game menu, confirm.
10. The footer, with links to the trust pages.
11. Pages that glide: a cross-fade between pages, off under reduced motion.

### 2 · The front door
12. Home: the compass rose in a brass dial (the light rose in day, heavier lines), the earned map still on a tap,
    the search as a glass field, the four region keys with counts, the tool groups in the new look.
13. The Fun page at /fun/ (the Monitor idea, in brass): the three public games.
14. The Tools shelf in frames; its Fun shelf becomes one line pointing to Fun.

### 3 · Each section's own pages
15. Tools: the toolbars and panels of every tool in keys; System Layers' three rows of controls on a phone and the
    Career Tree's missing name on a phone (the Inbox's "two tool bars"); dated source lines on the Atlas, Hospital
    Blueprint, the Population Health Map and the SQL mystery.
16. The two maps: panels, cards, drawers and search in the new look, both maps alike; the map itself untouched.
17. Games: the game bar and menus on every game; Alarm Fatigue's helpers no longer cover the CHECK buttons (Inbox).
18. Learn: the index and every module; module headers framed; page copies of the shared reading layout removed (19
    pages). Words unchanged.
19. Rounds: the index and every essay in the new reading look. Words unchanged.
20. The secret menu: its index as the captain's log; its pages take the shared pieces.
21. About, 404, thanks and the Atlas.

### 4 · The page ledger's small fixes
22. Meta descriptions to 70 to 165 characters on the 33 pages outside it (locked pages included: a meta description
    is an allowed fix).
23. The writing checker's findings on 12 pages, fixed with the smallest edit; every edit listed in the close note for
    the review.

### 5 · The Yes cards the AI can do
24. Close the pdf.js hole in the Career Tree's LinkedIn import (a setting and a test).
25. Security quick wins: a cross-origin opener policy, security.txt, and integrity checks on the pinned CDN files, with
    a test that fails when one is missing. Self-hosting GoatCounter's script means fetching it from GoatCounter, which
    waits for David's OK.
26. robots.txt lets AI search engines cite the site; the training crawlers stay blocked.
27. Share cards that say what the page is, in the new look, for the pages the launch links (home, Tools, Fun, the
    three games, the two maps).
28. A sitemap that tells the truth (Search Console's half that is not David's).
29. Tagged links for each launch channel, so GoatCounter shows what each post brought.
30. The trust pages (privacy, terms, disclaimer, accessibility) and an /ai page, drafted from the site's real data
    flows and rules, linked from the footer.
31. Two documents for David: the dated RC Week launch plan, and the employer-safe checklist.
32. GitHub: the two workflow actions pinned to exact versions, and a test that fails if a hook appears in the settings
    files.

### 6 · QA before David's
33. Every page at the nine sizes in night AND day (the phone gate gains a day run).
34. The contrast test on the new tokens, the design hook, `npm run verify`, the old-pages check, the link check.
35. Pictures of every page in both modes, filed to the hub.
36. DESIGN.md's Tier 3 rewritten to describe the new look; the design hook's summary refreshed.

### 7 · David's review, ready
37. The review screen (/__review): a Day mark and a Night mark on every page, each with a note; a mark older than the
    page's last change shows as changed; it opens on the first page not yet reviewed. The hub's Site tab shows both
    marks on every brick.
38. The close note and the commit message.

### 8 · After the refresh (outside the review)
39. A year of daily walls: the new daily modes David asked for on 2026-10-10 ("lets get all of those generated"), from
    a future daily on, so no past wall changes.
40. Device Assembly's last open recheck (the first-visit link, 2026-10-05).

## David's alone
- Delete the two old Netlify projects, look at the credit balance, turn on auto-recharge (before the launch).
- Search Console and Bing: add the property and paste the record at the registrar.
- GitHub's four free security switches; whether the repo stays public (the fracture details are in DECISIONS.md).
- The employer policies; R1, R6 and T1; playing Alarm Fatigue's real-or-nuisance alarms; the friend test.
- The OK to fetch GoatCounter's script for hosting it on the site.

## Not in this batch, and why
- The skin switcher, Night Shift, Chart Paper, Device Panel, Green Screen and HU-DOS: the one look replaces skins
  (and HU-DOS "just does not hit", his later note).
- The role picker on home: a Maybe that "would need more work".
- Today's Shift and Waveform of the Day (Yes): new games, each its own milestone after the review.
- The dithered art (Yes): it touches every picture on the site; after the review.
- The Maybes (pipeline gap, nursing homes, recall watch, trust layer, watchtower, USRC demo, one share line) and the
  Nos (the Arcade, the RC Week Cup).

## What does not change
The compass rose, the hex grid and the secret menu (identity); the maps' layers, zones, routes and nodes; the six
brand colors; the fonts; every page's words except the meta descriptions and the writing checker's fixes; the
engines, levels and data of the games. Tier 1 and Tier 2 of DESIGN.md hold throughout: the 44 px touch floor, the
contrast floor, reduced motion, the shared primitives.

## For your review: calls made, and things waiting on you

How to review: open /__review (the hub's server, `npm run hub`). It opens on the first page that still needs a look.
Look at the desktop and phone frames, type your thoughts in the notes bar under the header, and press the green button
(or m, or Ctrl+Enter in the notes): at night it saves and shows the same page in day; in day it saves and opens the next
page. A page that changed since your last look starts with an empty box and your earlier note shown faintly; nothing you
wrote is ever erased. A mark turns amber if the page changes after it.

Calls I made that you may want to undo:
- Home's heading is "Healthcare doesn't come with a map" (the round 3 mockups' line); "So we made one." is gone, and the
  mission heading reads "Mapping the connections between the components". Both were the writing checker's "a heading
  that sells".
- The phone's bottom bar on the hub pages is Tools, Fun, Search, Learn, More; Home moved to the logo so Search stays in
  the middle of five.
- The top bar is seven keys now (Tools, Fun, Learn, Rounds, About, the theme, search) and folds into a menu key under
  860px wide. Home and the Atlas left it on your review note; the logo goes home and the Atlas is reached from Tools.
- The footer's Support link is a key, not brass, so a page's own main act is the only brass key on screen.
- The trust pages and /ai are drafts in your voice. /ai says copy often starts as an AI draft written to your voice
  notes that you then edit; make sure that is true as written.

Waiting on your ruling:
- The day rose's N, S and E letters are faint (1.7 to 3.5 to 1). They are the brand's own light colors, so I left them;
  say if you want deeper ones.
- The Atlas's zone lines in day are faint against the pale ground (1.7 to 2.4 to 1). The phone check now treats the hex
  terrain the way it already treated its labels (a pinch-zoom scene, your 2026-08-23 ruling); the lines can be deepened
  in day if you want.
- The writing checker's findings on your locked Rounds essays and talks, and on Camp Nauvoo, are left as written: they
  are your own voice. Most are journal and book titles in italics (citation style, a false positive); the rest are
  "rather than" phrasing, a few "not X" turns, the alarm list in "The Bedside Task List Only Grows", one short closer in
  the Steward piece and "infuriating" in "Clinician Burnout Is a Workplace Problem". Rule on any you want changed.
- The draft Patient Populations module (secret menu) keeps two findings that come from the Career Tree's own role data.

Found and left for later (outside a surface pass):
- The Career Tree's toolbar wraps to a second row on the Education view at 1280 and on My Path and the Career Matrix at
  1100. The live site does the same.
- Alarm Fatigue: the big Clock in panel, the med card, the huddle card and toasts can sit over CHECK buttons
  (scripts/play-check.js). The walking helpers no longer do.
- Camp Nauvoo stands alone (it does not load the shared stylesheet), so it is not in the new look; its missing type
  sizes are fixed.
- Hosting GoatCounter's script on the site waits for your OK to fetch it.

## Your review notes (2026-10-11), and what each got

You reviewed the main pages and left Learn's modules and the tools for after today's upgrades. On your notes:

- Every page, the top bar: the Home key and the Atlas key are gone. The logo is the way home; the Atlas is on the Tools
  shelf. Seven keys fit from 860px wide, so tablets keep the bar instead of the menu key.
- Home: the four example searches under the box are gone. The hero is one centered column like the phone: the compass
  in the middle, the heading, the line and the search under it, then the four section keys in a row (two by two on a
  narrow screen).
- About: the guest section is a shelf now ("Guest voices" over a rule, the guest a framed card) instead of the
  "External Voices" divider. Under your LinkedIn key, "My card, to share" opens the new card page.
- The card page, /me/: your photo, name, letters and role, one line about the site, Connect on LinkedIn, Open the site,
  Share this card (the phone's share sheet, or it copies the link), and a QR code that opens the card. Every fact on it
  was already on the About page. It has its own link preview. The address is healthcareuncharted.com/me/; say if you
  want a different one.
- Fun: the line under the title is gone.
- Alarm Fatigue: mashing the button no longer stacks the "+N" chips. A burst of presses is one number that adds up
  over the button and goes about a second after the last press (thirty fast presses: one "+32" chip, gone by 1.9
  seconds). The other messages keep their reading time.
- Learn, Rounds and the secret menu: every search field and box on the site was dark glass in both modes. In day they
  are light wells now (white, a soft inset, dark ink); at night they stay glass. The secret menu's list rows follow
  the same rule. Readouts (a clock, a score, a year) stay dark glass in both modes, because they are displays.
- Device Assembly, Vital Stats and the Atlas: no change, as you said. The Device Assembly landing at desk width and
  Vital Stats' screen scaling are on the list for their next rounds.


## Your second review notes (2026-10-11, evening), and where each goes

Your night and day marks and notes from this run are archived word for word in
data-build/archive/page-reviews-2026-10-11.json; the review screen starts fresh for the next run.

- THE LIGHT THEME (Tools: "a little bit more washed out... hard to see the distinctions"; Rounds: "doesn't feel as
  clean or crisp to read"; Vital Stats: parts "still in the dark theme"). The first job of the next run, before the
  content passes. A first look at the numbers: in day the panels are white (#FFFFFF to #F4F7FB) on a ground of #EEF2F7,
  barely apart, and the only thing setting them off is a soft shadow at 16% (night uses 45%), blurred over 8 to 16 px;
  white keys sit on white panels. That reads as washed out and hazy. Rounds has no day surfaces of its own (its day
  rules only darken a few inks on the essays for contrast); its panels, edges and shadows are the shared ones, so it
  is the shared look, not your eyes. The next run measures it, shows two or
  three sharper options at a phone and a desk (a crisper edge and a tighter shadow; a slightly deeper ground; both), and
  applies the one you pick everywhere. Vital Stats' dark pieces in day are a defect fixed in the same pass.
  DRAWN (2026-10-11, window e): the options are on the hub's flip page, /__hub/mocks/light-theme.html, six pages at a
  phone and a desk. A, sharper edges: shadows tight under each panel and key (two to ten pixels instead of 32), a firmer
  hairline (#B4C0CF), a fine rim on every key and a deeper key floor. B, a deeper ground: #E1E7EF under the panels
  (#EDF1F6 at the top of the page) and whiter panel feet (#F9FBFD); panel against ground goes from 1.12 to 1.24. C, both.
  Night is the same in all three; on the C ground the tightest day inks are teal text at 4.66 and amber at 4.60, both
  over 4.5. Recommendation C (DECISIONS LT1). FIXED the same window: Vital Stats' name, room code and answer boxes were
  dark glass in day; they are wells on the field tokens now (the room chip stays glass, it is a readout).
  HIS PICK (2026-10-11): C, and "is there any other shades of white that might be better". Five shades drawn on C's edges
  (/__hub/mocks/light-shades.html): Cool slate (C as drawn), Clinical blue (#DDE6F1 page), Neutral grey (#E5E6E9), Warm paper
  (#EAE5DB page, #FFFEFB panels) and Bright white (#F4F6F9). Every day ink passes on each (the lowest, amber words, 4.54).
  Warm paper's cost: the tool pictures, charts and figures are drawn in cool blues. Recommendation Cool slate (DECISIONS LT2).
  APPLIED (2026-10-11, "go with cool slate"): C and Cool slate on every page in hu-global.css; the browser bar in day is
  #EDF1F6. THE SECRET MENU done the same window: the stamps are gone, a pin beside each name says Game, Vision, Instrument or
  Reading. THE LOGO AND HOME'S BUTTONS: his picks, "on a key and three columns", BUILT the same night: the logo is a raised
  key in the top bar and in every tool and game bar; on a desk home's three groups are headings over three columns (a tablet
  stacks them, the phone keeps its switch). FIXED by the sweep: four Learn modules' diagram lines in day (their teal and
  Request Routing's green branch read 2.8:1 on the slate ground) take the diagram teal and the deep green.
- HOME. The three group buttons under the tools (Career and pay, Maps and systems, Learn and play) feel redundant, and
  on a desk they sit left instead of centered; the phone is right as it is. The logo in the top bar should read as the
  way home ("a slight shadow or something"). Both are on the board as tweaks, with options to pick from.
- THE FOOTER (2026-10-11, "i think we scrap the field notes for now, it makes the lower bar section to large"; on a
  phone "its a long scroll too"): DONE. The Field Notes form is off the footer (/thanks/ stays, unlinked, for its return),
  Support is the last column of the top row, and a phone's footer is the support button, the copyright and the policy
  links. The Privacy page says there is no signup now. HOME UNDER THE HERO: he did not like the three columns live and
  asked what a good home page holds; three options drawn (/__hub/mocks/home-options.html, DECISIONS HM2). BUILT on "go
  with A": on a desk, "Start here" is three picks in one row (the Population Health Map, the Cost of Living Comparison,
  Vital Stats) and an All tools key; the phone keeps its switch. The three columns came out.
- THE HEX GRID (2026-10-11, "any ideas for the hex grid? i want to keep it but maybe there is a way to make it more
  dynamic"): today it draws only after a press of the compass and holds still. Three ideas run live on the real home page
  at /__hub/mocks/hex-hero.html: A the map wakes up, B explore it, C the site on the map (DECISIONS HX1). He picked C and
  asked for Atlas items and taller tiles: the seven Atlas zones as raised tiles (a click opens the Atlas there), a tile
  height slider and a raised-ground switch added for his settings (HX2). BUILT on "atlas zones at 10px, no raised ground":
  the honeycomb from the start, the seven zones as raised tiles that take turns and open the Atlas, routes round the words; a
  phone gets routes in the zone colors; the eight taps unchanged.
- THE SECRET MENU. The flavor text on the left of each card ("Game · playable · v1") goes; a small pin by the card's
  name, with the sentence behind an "i" like the game door, takes its place.
- LEARN. The cards are cluttered (the lens tags at the top and the bottom, plus "framework", "mental model",
  "interactive"). One standard card for every module is the first job of the Learn pass. DRAWN (2026-10-11): both options
  keep the number, the title and two or three lines of the description, and drop the map pills (every module page carries
  its own Atlas links) and the format line; A shrinks the lens tags to dots with the filter rail as the key, B keeps them as
  small words with their dot (/__hub/mocks/learn-card.html, DECISIONS LC1, recommendation B). BUILT on his "go with B"
  the same night: all 16 module cards and the 2 talk cards; the guest byline stays as a lens word.
- THE LEARN AND TOOLS REVIEW, STARTED 2026-10-11 ("ok start the learn modules and tools review"): the review screen walks
  a RUN (data-build/review-run.json): the 17 Learn pages in the order /learn/ lists them, then the 8 tools in /tools/ order.
  The two talks are locked and the Atlas was marked good, so they are not in it. The picker lists the run first, the board
  opens on it, and the one button and its counter stay inside it until every run page has both marks.
- DEVICE ASSEMBLY. The theme is fine; its menus and flavor text get their pass at the approved version.
- VITAL STATS. UI scaling for a first-time player, still on the list.
- About, Disclaimer, Accessibility, /ai, Terms, Thanks, the card page, Privacy, Fun, Alarm Fatigue and the Atlas: good as
  they are (/ai to grow later).

## Your third review notes (2026-10-11, night: the full review), and what each got

Every page carries a night and a day mark. Notes word for word are in data-build/page-reviews.json. Window 2026-10-11-i.

- DONE. The Share button is off every Learn module and every Rounds piece (the shared end-of-article block; the five
  locked Rounds pieces took it too, on your note "no rounds page needs a share this button"). Sources fold shut on eleven
  Learn modules (a closed list, "Show all N sources"); Alarm Fatigue has no sources list (one source line per section,
  kept), and Request Routing's "Lineage and kin" is not a sources list (kept, it is your model module).
- DONE. Home: the map slows after 20 seconds and rests at 30 (no frames drawn after that); a hover, a focus or a press on
  the compass wakes it for another spell. Day and night behave the same.
- DONE, your mid-review note. The secret tile stands like a zone: a raised green tile with its own route from the
  compass, lifting on hover, no glow; same eight-tap triggers; on a phone it finds open ground and stays fully on screen.
- DONE. Day theme: the Data Observatory's stats band, the Traffic tiles, the SQL editor and the hospital game's save box
  go light in day (fields and wells on the field tokens). A sweep of every tool, game and hub page in day found nothing
  else: what stays dark is glass readouts and game screens, on purpose. The review screen's own chrome follows the theme.
- DONE. The 4Ps module's section links stay at the top on a phone, never pinned. The secret menu has no search box.
- DONE. Five pages left the review for good (accessibility, AI, disclaimer, privacy, terms):
  data-build/review-finished.json, yours alone.
- DONE. The oxygen payment module (the guest piece) wears the standard Learn look in both themes: no palette of its own,
  the table and the detail panel as cards, the shared callout and stat tiles; not one word changed. Your ruling recorded:
  guest authors no longer get their own palette.
- DONE. Healthcare Data Sources: every box its text overflowed, every crossed line and the cut-off header fixed at desk
  and phone. The full visual redesign you asked about is on the Inbox.
- DONE. Process Engineering: every drawing fits a phone. The swim lanes turn into four columns with the visit running down the page; Six Sigma, BPMN and the constraint funnel got phone drawings they never had; the bottle is redrawn for the phone; the PDSA loop now plays on a phone. Left for later: tablet widths (700 to 1024) still show the desk drawings small.
- NEW, your mid-review note: THE DEV BLOG on the secret menu, /secret-menu/blog/, with its feedback tracker; post 1 is
  the Site 1.0 release, written in your voice from the repo's history for your read (DECISIONS BL1).
- TO THE INBOX (future phases, one card each): Learn visuals; the older tools on a phone; one standard for what you can
  click on a map; new card art for the tools; the Atlas; SQL Mystery as a game; Vendor Directory and Operations Map
  content; the secret menu games; Patient Populations as a module; the Price Finder; the Reference Appendix as a sortable
  list; About for more than one author (DECISIONS AB1; DRAWN on his "yes draw the about page options": two layouts on
  /__hub/mocks/about-authors.html, A every author the same card, B a lead author and contributors, his pick is AB2; BUILT on "go with A", 2026-10-12: the site first, then every author on the same card from src/_data/authors.js).
- Request Routing is your example of how modules are built from now on (recorded in memory and here).
