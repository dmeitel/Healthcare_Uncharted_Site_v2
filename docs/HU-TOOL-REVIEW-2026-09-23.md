# Tool review · 2026-09-23

David, 2026-09-23: "i like this update for the tool and i think we can take the lessons from it
and apply it to other tools... do any other needed reviews of the information or scans of the
other tools and pull together a list of improvments we can make to those tools to meet our
desired specs."

HOW THIS WAS DONE. Every tool was measured rather than only looked at:
- first-screen density with `scripts/density.js`
- the shared chrome with `scripts/tool-compare.js`
- a code census of which cost of living patterns each tool uses
- screenshots at a 390 phone and a 1440 desktop, in tmp/toolreview/
- a targeted probe for every problem the screenshots suggested

Everything listed as a defect was reproduced and measured. Nothing was changed.

NOT IN THIS REVIEW:
- Light and dark theme, because another session owns it.
- The three games, which have their own open phase.
- The Atlas beyond two small defects, because its phase is closed and the hex grid is identity.

---

## 1 · THE STANDARD, as the cost of living tool now sets it

These ten rules are drawn from what shipped in round 3. They are the yardstick for every tool
below. They become binding once they are written into DESIGN.md Tier 3, which is question 1 at
the bottom.

1. **Answer first.** The first screen tells the visitor something before it asks for much. On
   the cost of living tool that is three inputs, then one plain sentence: "You'd keep $1,435 more
   a month in Utah."
2. **A short label goes on screen and the explanation goes behind an "i".** That is `HUKit.peek`:
   hover on a desktop, tap on a phone. No how-to paragraphs on the page.
3. **One fold.** Anything that opens and closes is the site fold (`.hu-fold`, a details/summary).
   Settings live in trays that drop from the top, never in side panels.
4. **Views instead of everything at once.** When the output has layers, show Summary, Chart and
   Detail one at a time.
5. **Plain words.** No abbreviation a stranger has to decode. "Δ/mo" became "Difference".
6. **Every number says where it came from and when.** The tool carries a source line with a
   date, and each number's own source sits behind an "i".
7. **A link brings back the same screen.** The address holds the scenario, and a shared link
   restores it exactly.
8. **Charts follow the chart rules:**
   - no red/green pair, and one colour for "worse for you"
   - text in ink, never in a series colour
   - bars that fit their box
   - the same numbers available as a table
9. **Little chrome.** Only the nav stays pinned, the footer flows with the page, and no floating
   message covers a control.
10. **The phone is the shorter side of the screen.** Clean at all nine viewports, with 44px
    targets and nothing cut off.

---

## 2 · WHERE EACH TOOL STANDS

| Tool | First screen, phone (words / inputs) | Desktop words | "i" badges | Site folds | Source line with a date | Pinned on a phone | Biggest gap |
|---|---|---|---|---|---|---|---|
| Cost of Living (the reference) | 88 / 5 | 96 | 4 | 25 | yes | 64px, 8% | 546 words still to sort |
| Career Tree | 79 / 2 | 171 | 0 | 0 | yes, May 2024 | 177px, 21% | how-to text in every section |
| Hospital Blueprint | 436 / 0 | 278 | 0 | 0 | NO SOURCE LINE | 197px, 23% | too much at once; panel hides the building |
| System Layers | 105 / 0 | 250 | 0 | 0 | NO SOURCE LINE | 64px | 113 numbers with no source |
| Population Health Map | 22 / 0 | 65 | 0 | 0 | per metric, one tap | 64px | closest to the standard |
| Hospital Operations Map | 33 / 0 | 50 | 0 | 0 | says "current", no date | 64px | closest to the standard |
| Clinical SQL Mystery | 163 / 1 | 206 | 0 | 0 | n/a, synthetic data and says so | 170px, 20% | two-row bar pinned on a phone |
| Vendor Directory | 139 / 1 | 156 | 0 | 0 | sources, no date | 64px | 70 screens tall on a phone |

Notes on the numbers:
- Most of the 436 words on the Hospital Blueprint phone screen are department labels too small
  to read. Very little of it is prose.
- The pinned heights come from tool-compare at 390 x 844. SQL Mystery was re-measured by probe:
  a 64px nav plus a 106px tool bar. Tool-compare's 310 also counted two headers inside panels
  that sit off screen.

THE PATTERN IN ONE LINE: the cost of living tool is the only tool using the "i" badge or the
site fold. Every other tool explains itself with sentences on screen or hover-only tooltips, and
hover never happens on a phone.

---

## 3 · BATCH 1 · DEFECTS. Claude's call, no input needed

Each of these was reproduced and measured. None changes a design; they make the tools do what
they already say they do.

1. **Career Tree, phone: a script error when the career data loads slowly.** One drawing step
   (the track spiral) reads the data before it has arrived. It showed up once on its own during
   this review, and every time once the data was slowed by two seconds. The fix is a one-line
   guard. (`renderSpiral` in src/assets/js/tools/career-tree.js)
2. **Career Tree, phone: the stats row is cut off at both ends.** Roles held, Creds held, Skills
   held and Goals make a row 413px wide on a 390px screen. (`#bp-vitals`)
3. **Career Tree, phone: the bottom tab bar wraps.** It has five tabs, so "Site" drops onto a
   second row and the bar grows to 113px, 13% of the screen. (`#hct-tabs`)
4. **Hospital Blueprint, desktop: the side panel covers the building.** It hides about 240px at
   1440 and more than half the building at 1280. Infusion, Dialysis and PT/OT/ST sit underneath
   and only appear if you scroll sideways. (`#detailPanel` over `#hospitalStack`)
5. **Population Health Map, desktop: the metric name is cut to "Pati…".** Showing that name is
   the whole job of the metric picker.
6. **System Layers, desktop: text runs into controls.** The faint "System layers 8 deep"
   watermark runs under the pin and reset buttons. The "Healthcare Uncharted // System map v1.0"
   caption runs across the left panel's border.
7. **System Layers and Clinical SQL Mystery, phone: the tool bar wraps into two rows.** On SQL
   Mystery that bar stays pinned under the nav, so 20% of the phone screen is chrome.
8. **Both U.S. maps, phone, first few seconds: the loading message overlaps a control.** On the
   Population map it overlaps the metric card by 15px at 360, 390 and 430. On the Operations map
   at 360 it overlaps the draw button. It fades by about four seconds and the controls stay
   tappable, so this is minor, but it is the first thing anyone sees.
9. **Cost of Living, phone: two of the three fold headers wrap.** "Narrow it / down" breaks onto
   two lines and the header grows from 44px to 50px.
10. **Atlas:** on a phone the search placeholder is cut mid-word. On desktop the "PUBLIC HEALTH"
    label prints over the Patient hexes.

**The QA gate missed 2, 6 and 8, and missed 1 unless the data was slow.** Three additions to the
sweep, all Tier 1 and all Claude's call:
- FLOATING OVER A CONTROL: a positioned message or badge overlapping a button or input.
- CUT BY ITS CONTAINER: a row wider than the box that clips it.
- A SLOW-DATA PASS that holds every data file back two seconds.

---

## 4 · BATCH 2 · BRINGING EACH TOOL TO THE STANDARD

These change how a tool looks and works, so each tool needs a design phase opened by name. Under
CLAUDE.md, every surface that isn't named stays under the change budget. The recommended order
starts with the biggest gap for the least work.

### 4.1 Vendor Directory, recommended first

It is the furthest from rule 1 and one of the smallest tools to change (870 lines).

- **Answer first (rule 1).** On a phone the first vendor appears 1,100px down, below the first
  screen, under a hero paragraph and the headquarters map. Lead with search and the list. The map
  becomes a filter tray (rule 3) or a view of its own (rule 4).
- **One fold (rules 3 and 4).** All 158 vendors render as full 356px cards. That makes the page
  59,000px tall on a phone (70 screens) and 19,700px on a desktop (22). Each vendor could be a
  compact row that opens into its card.
- **A date (rule 6).** The status calls ("proven", "cautionary") carry no date. The data was last
  compiled 2026-08-10 and the page never says so. The source line should say when the statuses
  were checked.
- **"i" (rule 2).** The map's instruction sentence moves behind an "i".
- **Voice, only if you want the hero touched.** It ends on "Some are proven. Some are cautionary
  tales.", which is the antithesis pair the voice kernel bans.

### 4.2 Career Tree

It is the biggest tool on the site (8,257 lines) and the one doing the most explaining.

- **"i" (rule 2).** Every section has a how-to sentence under its header, such as "Hit + and type
  a name to search real roles", plus three separate hint pills. 42 tips are hover-only title
  tooltips that never appear on a phone. All of it moves behind "i" badges.
- **Answer first (rule 1).** The blank sheet offers four places to start at once: the Start here
  banner, Your name, the Goal box, and the + hexes. There should be one start, the four questions
  behind Start here.
- **One fold (rule 3).** Every open/close control is hand-built. None uses the site fold.
- **The plan share card downloads as an image.** You took image buttons off the cost of living
  tool. Whether this one goes too is parked below.
- **Information.** Pay comes from the BLS handbook, wage year May 2024. Check whether BLS has
  published a newer edition, and re-pull if it has. Not verified yet.

### 4.3 System Layers

- **Information first (rule 6).** The map has 301 "By the numbers" tiles. 188 name a source and
  113 do not. Some of the 113 look invented, among them "8m 42s" average time, "98.2%"
  eligibility accuracy and "~$400" annual cost. The tool has no source line and no date. On a
  site that stakes itself on sourcing, a number with no source does more harm than an empty
  tile. (Question 2.)
- **"i" (rule 2).** The left panel is a permanent legend plus a five-line How to use list. Put
  the legend behind an "i" and drop the how-to or put it there too. That frees the left third of
  the desktop screen for the map.
- Most of the 250 words on the desktop first screen are that panel.

### 4.4 Hospital Blueprint

- **Answer first and "i" (rules 1 and 2).** The desktop panel opens on a how-to card: a headline,
  a paragraph, and four "bold phrase: sentence" rows, which is the parallel-block template the
  voice kernel bans. Cut it to one line and an "i".
- **Little chrome (rule 9).** On a phone 197px is pinned (the nav, a 96px sub bar, a 37px hint),
  23% of the screen.
- **Density.** The phone's first screen holds 436 words and 105 controls, mostly department labels
  too small to read at that zoom. The phone view might open on one wing or floor rather than the
  whole building. That is a look-and-feel call, so it would come to you with screenshots.
- **Source (rule 6).** This is the only tool with no source line at all. Staffing ratios, patient
  flow and billing models are presented as fact. Cite them, or label the building as an
  illustrative model.
- Defect 4 above lives here too.

### 4.5 The two U.S. maps, Population Health and Hospital Operations

These are the closest to the standard already. A phone first screen holds 22 and 33 words, the
answer is on that screen, and the population map keeps each metric's source one tap away. Their
look is DESIGN.md's "map instrument grammar" from a closed phase, so anything beyond defects
means reopening that phase.

- **Chart rules (rule 8), population map.** The colour scale runs red, orange, yellow, teal from
  worse to better. The chart rules call for one hue getting darker, or two hues with a gray middle.
  A rainbow reads as categories and is hard on colour-blind readers. Fixing it means running the
  palette validator and getting your yes, because it changes the look of the flagship tool.
- **Base map labels, both maps.** City names such as Los Angeles, Chicago and Detroit print over
  the state values.
- **Plain words (rule 5), operations map.** The first screen shows "5,366 hospitals" and "5,315
  in view" together and never explains the missing 51.
- **Date (rule 6), operations map.** The source line says "current" where it should give a date.
- **Two hints at once, population map.** At first paint the loading message and a "Tap to change
  what the map shows" callout both sit over the controls. One is enough.

### 4.6 Clinical SQL Mystery

This is more game than tool. The case story is the content and it stays.

- **Little chrome (rule 9).** See defect 7.
- It has its own "← All Tools" button, which no other tool has.
- **Voice, small.** "Your mission" and "currently admitted" use bold and italic for emphasis. The
  kernel says CAPS.

### 4.7 Cost of Living, what is left

- The ~546 words already on the ladder: explanation goes behind an "i", warnings get your ruling
  one by one, and live output stays.
- Both pay fields are labelled "Rate there". The From side is the visitor's own pay, and the
  answer sentence calls it "your $84,240 here", so that label should read as theirs.

---

## 5 · ACROSS EVERY TOOL

- **The tool bars disagree.** The tool's name renders at 14, 15 or 17px on a phone depending on
  the tool. The shared tool-bar shell, already on the ladder, fixes that once for all of them.
- **A ratchet for the standard.** Once the standard is written down, a Tier 2 ratchet like the
  reading-shell one could count explanations still sitting on screen or in hover-only titles,
  and only let that number go down.

---

## 6 · QUESTIONS, also in DECISIONS.md

1. **Should the cost of living tool become the standard?** That means closing its design phase
   and writing the ten rules above into DESIGN.md, so every tool is held to them. CLAUDE
   RECOMMENDS YES. What is left on it (the 546 words) becomes ordinary maintenance under the
   written rules.
2. **What happens to System Layers' 113 numbers with no source?** One option is to cut them.
   The other is for Claude to find a source for each one and cut whatever has none. CLAUDE
   RECOMMENDS CUTTING THEM NOW. The 188 sourced tiles stay, and any that matter can come back
   with a source later.
3. **Which tool goes next, and can its design phase open?** CLAUDE RECOMMENDS the Vendor
   Directory, then the Career Tree.

Parked until those three are answered: does the Career Tree share card keep its image download?
Claude would keep it. A whole career plan does not fit one screenshot; the cost of living
summary does.
