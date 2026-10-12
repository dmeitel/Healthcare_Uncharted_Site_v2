# A design direction: one instrument per region

2026-10-11. A proposal for David's yes, not a ruling. Nothing here is built, and nothing here opens a design phase by
itself. Pictures: the hub's Ideas tab, card "One instrument per region" (mockups in tmp/hub/mocks/direction.html, shots
in tmp/hub/shots/ideas/dir-*.png).

## Where it came from

David, on the Ideas tab, 2026-10-11: "I add more notes to the design elements. I think we can find something that
continues on the lines of thinking you have. Lets drill down on the design notes and ideas and come up with something
that we can use for a good long while." His answers on the look, the same day:

- Yes: the skin switcher; Monitor ("maybe a full design for a fun menu and move the games out side of tools"); pages
  that glide; HU-DOS for the secret menu; the dithered art style.
- Maybe, with a question: Night Shift ("what about branding standards and color?"); Chart Paper ("not sure exactly how
  we can integrate it and keep the site theme and originality"); Device Panel ("take all design patterns and notes and
  consider what works and keeps with our theme"). Maybe: the bolder Fun shelf skin; the home page as a main menu ("it
  would need more work").
- No: Green Screen; the arcade shelf.

His three questions point the same way. Five skins that each repaint the whole site compete with the brand and with
each other. The site already has a north star (DESIGN.md: "The Field Atlas", an explorer's chart at night) and already
gives each section its own color. So the direction is not a sixth skin. It is the atlas the site already is, with a
different clinical instrument for reading each region of it.

## The idea in one line

The site is the Field Atlas. Each region of the atlas is read through one instrument from the clinician's world, and
the instrument shows only in three places: the region's channel color, one surface, and one signature moment.
Everything else is the shared chassis, which does not change.

## The chassis: what never changes

All of it exists today and stays exactly as it is:

- Deep Water navy (#0a0f1a), the surfaces and borders, Paper White and Fog Blue text, and the light theme that flips
  by token.
- Signal Teal points at one thing per view (the One Signal Rule); Chart Blue acts.
- The compass rose, the hex grid, the secret menu and the map information model (load-bearing, CLAUDE.md).
- Outfit, DM Sans and IBM Plex Mono; every data label in Plex Mono with its source.
- The instrument grammar for tools and maps, the Ink State Rule, the 44 px touch floor, the motion budget, reduced
  motion everywhere.

## The regions

| Region | Its instrument | Channel color (contrast on Deep Water) | Its surface | Its one signature moment |
|---|---|---|---|---|
| Home | The atlas table | Signal Teal (9.90) | The compass on the hex grid, unchanged | Pick a role, then one Continue button that names where you left off; each region shown as a live channel with one real number (8 tools, 3 games, 17 modules, 5 essays) |
| Tools | The field instruments | Signal Teal (9.90) | The instrument grammar, unchanged | None new. The tools already are the instruments. |
| Fun | The bedside monitor | Beacon Amber #E8A838 (9.20) | A darker monitor glass behind the games | Each game is a channel (a label, a trace, a big readout); Alarm Fatigue's channel shows an alarm chip; Today's Shift sits under the monitor |
| Learn | The reference chart | Learn blue #6aabff (8.10), the content-type color it already has | A band on a module's header, in the region's color at low opacity, never under paragraphs. Two versions: A, a square measuring grid; B, the atlas's own hex cells fading in from the edge (recommended, see below) | Diagrams draw themselves as you arrive |
| Rounds | The rhythm strip | Rounds slate #7B92AB (5.97), the color it already has | The reading page, unchanged | A rhythm strip under the bar is the reading progress; the teal mark is where you are |
| Secret menu | HU-DOS | Guest green #4ecb8d (9.35), its identity already | An old desktop in phosphor green | Windows and icons; each secret is a file; the 8-tap secret stays the way in |

Where the old skin ideas went:

- Monitor became Fun's instrument, which is what David's note asked for. Its new ECG green is gone: Fun uses Beacon
  Amber, and each game's trace uses a brand color (Reef Red for alarms, Landfall Green for equipment).
- Chart Paper became Learn's graticule and Rounds' rhythm strip. The square grid only appears as a header band and in
  print, and it uses the region's own color, so it reads as this site's chart and not a borrowed ECG sheet. That is the
  originality answer: the grid is a measuring surface on an atlas, which is what an atlas has.
- Night Shift became Dim, a display mode (below), built only from brand colors.
- Device Panel stays where it belongs: Device Assembly's own front door is equipment, so a panel look can live there.
  The compass rose as a knob is dropped; the compass stays as it is.
- Green Screen and the arcade shelf: No, per David. The secret menu's own green carries what was good about the
  terminal look into HU-DOS.

## Display modes: light conditions, not skins

The skin switcher (a Yes) becomes a Display menu with three modes. The regions bring their instruments by themselves,
so the switcher no longer has to carry looks; it carries light.

- **Light**: today's light theme.
- **Dark**: today's dark theme.
- **Dim**, the night watch: a bridge dims its instruments at night so the watch can still see. The same navy and teal at
  lower light, no pure white anywhere. Primary text is Fog Blue (#b8cfe8, 12.45 on the Dim ground), captions Faded Ink
  (#7E9CBF, 7.01), teal at 80 percent (#3ea49d, 6.64). One new value: a deeper water step for the ground, #060910. Every
  pair clears 4.5 to 1.

## One motion signature, and one texture

- **The trace.** Anything that arrives draws itself left to right, the way a monitor trace or a plotter pen does: a
  channel's waveform, a Learn diagram, the rhythm strip, the mark on a first visit. Inside the existing budget (280 ms
  structural moves); under reduced motion it is simply drawn.
- **Pages that glide.** Cross-document view transitions (a Yes): a page change cross-fades instead of flashing white,
  CSS only, inside the reduced-motion check.
- **Dithered pictures.** The dither pipeline (a Yes) tints every photograph or illustration in its region's channel
  color, so art from different sources looks like it belongs to the same atlas.

## What is new, all of it

Counted from the mockup: six values the design system does not have yet. A darker monitor glass for Fun (#05080e, and
#04060b in Dim), HU-DOS phosphor text (#bff3d6, on its green ground), Dim's ground step (#060910) and its matching
surfaces, and one headline size on the Fun header. Everything else in the mockups is an existing token. For comparison,
the five separate skins added about thirty.

## How it would be adopted

Each step opens a design phase on its named surface only, per CLAUDE.md, and closes by writing its piece into DESIGN.md
Tier 3. In order:

1. **Fun becomes its own region.** One new page at /fun/ (today that address has no page) and Fun in the main menu. The
   games already live at /fun/ addresses, so nothing moves and nothing needs a redirect; the Tools page's Fun shelf
   points to it. The Monitor look on that page only.
2. **The trace and pages that glide.** Site-wide, CSS only, behind reduced motion.
3. **Dim.** The Display menu with Light, Dark and Dim.
4. **The secret menu as HU-DOS.** Its index page only.
5. **Learn's graticule band and Rounds' rhythm strip.** The reading surface is parked by David's 2026-08-24 ruling, so
   this waits until he reopens it.
6. **The dither pipeline.** When the first new pictures arrive.
7. **The home page as a main menu.** Last, because it needs David's six roles and what each leads with.

## Why it should last

- A new region is three choices, not a redesign: a channel color from the vocabulary the site already has, one
  instrument from the clinician's world, one signature moment.
- A new game is a new channel on the Fun monitor. A new tool joins the instruments. A season is an overlay on the
  trace (a different strip for RC Week), not a new theme.
- It never asks the brand to change. The palette, the type, the compass and the hex grid carry every region, and each
  instrument is clinical, which is the one thing a general design site cannot copy.

## Open, for David

1. Fun as its own region before the launch (October 25)? Claude recommends yes, in its plain form: one new page, and
   the games, which are the launch's front door, get a home at /fun/. Everything else after the launch.
2. Fun's channel color: Beacon Amber (recommended; it reads as a monitor's yellow and is already a brand color) or
   Reef Red (stronger, but red already means alarm and negative).
3. Learn's header band: A, a square measuring grid, or B, the atlas's own hex cells fading in from the edge? Claude
   recommends B. The design check flags a square grid behind a header as a common generated look, which is exactly
   David's originality worry about Chart Paper; the hex cells are this site's own.

Claude's call, David's to veto: Dim is site-wide, not reading pages only, because a Display menu that changes by page
would surprise people.

## Round two (same day)

David on round one: "I like these ideas in general but i think we are missing some of the three dimentional buttons
and more visual pop. One thing i do want to keep is the compass rose on the home page... most of them feel flat
compared to some of our previous ideas. The Doss theme on the secret menu just does not hit well for me. Lets try
another interation or maybe its not just visuals but theme and color too."

So round two is three concepts, each answering "flat" a different way, each with raised buttons that sink when pressed
and the compass rose (the real brand artwork, without its dark backing plate) as the home page's centerpiece. Mockups:
tmp/hub/mocks/round2.html (?c=lit|way|brass&view=home|fun) and the comparison sheet round2-compare.html; the card
"Round two: three concepts with depth" on the Ideas tab.

1. **Backlit Instruments.** Light: bezels, recessed glass glowing in each region's color, keys that stand up and press.
   The compass rose is a lit dial. No new palette colors.
2. **Wayfinding.** Color and theme: light-first hospital signage. Colored floor lines lead to each region, buttons are
   raised sign plates with a color band and a number, games are numbered rooms. The compass rose is the YOU ARE HERE
   board.
3. **Brass and Chart.** Material: the compass rose in a brass bezel at the center of home, the four regions engraved on
   plates at its compass points, games as brass gauges. Adds one color, brass (#C9A35B text on navy 7.91; engraved ink
   on brass 8.43).

HU-DOS is dropped. Each concept has its own door for the secret menu (a service panel, a STAFF ONLY door, the captain's
log), mocked once David picks. Carried over from round one under any concept: Fun as its own section at /fun/, Dim, pages
that glide. Every new color pair was computed and clears 4.5 to 1 (white on Landfall Green, 3.48, was replaced by dark
ink). Glow on a selected state breaks today's Ink State Rule; a design phase on the surface can suspend it.

## Round three (same day)

David on round two: "ok i like the backit linstraments, remember not every tool is for RTs either, we dont need to only
consider them as our target. I dont love the Glow Affect, but i do like the Brass and how it makes things pop. The white
design is good but i think it doesnt blend into well with what we already have."

Round three, brass-trimmed instruments: Backlit's structure with no glow (depth from light on edges and shadow under
them), brass for the pop (the compass ring, the main buttons, the place you are in the menu, thin bezels on panels),
the site's own navy so it blends, and copy for everyone (roles: Clinician, Informatics, Leader, Policy, Student, Just
looking; each game says who it is for). The secret menu becomes the captain's log. Mockups: tmp/hub/mocks/round3.html
(?view=home|fun|learn|secret) and round3-sheet.html. Every button meets the 44 px floor; every new pair clears 4.5 to 1.
Brass is an addition to the palette for David to approve, not a change to the six anchors.

## Round 3.1 (same day): day and night

David on round three: "yeah i kind of like that alot more than what what we have, how does it work for day and night
mode? the metalic looks nice, continue this mock up a bit and lets keep going, i like the idea in princple but i want
to see more before we do a whole run."

Round 3.1 shows every page in both of the site's modes and adds the Tools shelf, a tool page around the real Population
Health Map (live screenshots in each mode, the map untouched), a Rounds essay and a controls sheet (buttons resting,
pressed, focused and off; switches, a three-way choice, chips, a field, a readout). Day mode is the site's light theme
with a white chassis; the brass is unchanged; instrument screens (readouts, inputs) stay dark in
daylight like a real device's screen; keys flip to white with the same brass edge; region colors use the site's deep
steps for light. Mockups: tmp/hub/mocks/round31.html (?view=home|fun|tools|tool|learn|rounds|secret|kit&mode=dark|light)
and round31-sheet.html. Every control meets 44 px; every pair clears 4.5 to 1.

His note on 3.1 (2026-10-11): "the only issue i have is that on the light/Day theme, the Compass rose is still its dark
theme. We have a light theme of ot the compas rose too it should show that... other than that i like the updates over
all." Fixed in the mockup: day mode now draws the light rose (the colors the home page's drawCompass() uses on the light
theme) on a light dial face, and the night rose lost the hero art's soft glow so both match the live home page.

## Line weights (2026-10-11)

His question: do the lines and borders on the compass rose and the logo need to be thicker, and are we breaking any
graphic design rules. Measured: the mark's hex outline is 18 of 512 units, so 0.84 px at 24 px (the game bar and
toolbars), 0.98 px at 28 px (tool pages) and about 0.65 px in the 16 px favicon; the menu icon beside it is about
1.17 px. The header and footer lockups (1.6 px and 2.4 px) are fine. The live home rose draws fixed 2 px lines on a
sharpened canvas and is right for its size; in the round 3.1 dial it is three times bigger and its lines read thin
against the brass ring. No accessibility rule is broken (logotypes are exempt from contrast). Shown on the hub as the
Ideas card line-weights, with a sheet (tmp/hub/mocks/lines.html): a heavier small mark (26 units) and a heavier dial
rose (1.6x, faint ticks raised). Found on the way: on phones the home page draws the rose 14 px below its tap area.

His answer (2026-10-11, Yes on the card): "yeah lets make the change." Built the same day (board card "Heavier lines on
the logo and the rose"): the mark's hex outline is 26 of 512 units in hu-mark, hu-mark-dark, hu-mark-outline and
favicon.svg, their PNGs and every favicon and app icon are regenerated, and the icon cache stamps in base.njk are
v=20261011. The header and footer lockups keep their outlines. The home page's phone rule no longer moves the rose's
button to 78 px, so the tap area sits on the drawn rose at every width. THE RULE FOR A ROSE DRAWN BIG, for the brass
look: the rose's lines grow with it. At the home page's size (about 120 px) they stay the fixed 2 px the canvas draws;
in the dial (three times that) every line is 1.6 times its hero weight and the minor ticks go from 40 to 65 percent.
round31.html now shows the heavier rose by default (?lines=now for the old weights).
