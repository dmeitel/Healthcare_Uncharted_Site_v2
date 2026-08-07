---
name: Healthcare Uncharted
description: A practitioner's field atlas of the U.S. healthcare system, built on real public data
colors:
  signal-teal: "#4ECDC4"
  signal-teal-deep: "#1B9A90"
  chart-blue: "#1B5FA8"
  chart-blue-bright: "#2478d4"
  beacon-amber: "#E8A838"
  beacon-amber-deep: "#946905"
  landfall-green: "#2D9B6F"
  reef-red: "#DF5752"
  meridian-purple: "#7C6FCD"
  deep-water: "#0a0f1a"
  chart-surface: "#0f1825"
  raised-chart: "#162030"
  chart-shelf: "#1c2a40"
  paper-white: "#FFFFFF"
  fog-blue: "#b8cfe8"
  faded-ink: "#7E9CBF"
  depth-mark: "#2a4060"
  sounding-line: "#1a2d48"
  sounding-line-bold: "#24405e"
  ink-on-signal: "#062024"
  guest-green: "#4ecb8d"
  guest-green-deep: "#2D9B6F"
  type-learn: "#6aabff"
  type-talk: "#5DBF87"
  type-reference: "#a99ee8"
  type-rounds: "#7B92AB"
  lens-policy: "#b59ff5"
  lens-policy-base: "#8B5CF6"
  lens-techeco: "#38b6f0"
  lens-techeco-base: "#0EA5E9"
  lens-medsci: "#FF6B6B"
  chart-blue-mid: "#2D4A8A"
  deep-step-teal: "#0F7A72"
  deep-step-teal-chip: "#0D7268"
  deep-step-provider: "#1d5fae"
  deep-step-policy: "#6A45D8"
  deep-step-pubhealth: "#23794e"
  deep-step-techeco: "#0e6f96"
  deep-step-medsci: "#C22F2F"
typography:
  display:
    fontFamily: "Outfit, Trebuchet MS, sans-serif"
    fontSize: "clamp(40px, 6vw, 64px)"
    fontWeight: 800
    lineHeight: 1.0
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Outfit, Trebuchet MS, sans-serif"
    fontSize: "clamp(24px, 3vw, 38px)"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Outfit, Trebuchet MS, sans-serif"
    fontSize: "20px"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  body:
    fontFamily: "DM Sans, Trebuchet MS, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "IBM Plex Mono, Courier New, monospace"
    fontSize: "10px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.14em"
  scale:
    cap-85: "8.5px"
    cap-9: "9px"
    cap-95: "9.5px"
    label-10: "10px"
    label-105: "10.5px"
    meta-11: "11px"
    meta-115: "11.5px"
    ui-12: "12px"
    ui-125: "12.5px"
    ui-13: "13px"
    ui-135: "13.5px"
    ui-14: "14px"
    ui-145: "14.5px"
    body-15: "15px"
    body-16: "16px"
    lede-17: "17px"
    lede-18: "18px"
    lede-19: "19px"
    title-20: "20px"
    title-21: "21px"
    stat-22: "22px"
    display-24: "24px"
    stat-25: "25px"
    display-26: "26px"
    display-28: "28px"
    display-30: "30px"
    display-32: "32px"
    display-36: "36px"
rounded:
  hairline: "2px"
  bar: "3px"
  tick: "4px"
  micro: "5px"
  icon: "6px"
  xs: "7px"
  sm: "8px"
  mark: "9px"
  md: "10px"
  chip: "11px"
  lg: "12px"
  plate: "14px"
  xl: "16px"
  badge: "20px"
  pill: "999px"
spacing:
  space-1: "4px"
  space-2: "8px"
  space-3: "12px"
  space-4: "16px"
  space-5: "24px"
  space-6: "32px"
  space-7: "48px"
  space-8: "64px"
  space-9: "96px"
components:
  button-primary:
    backgroundColor: "{colors.chart-blue}"
    textColor: "{colors.paper-white}"
    rounded: "{rounded.md}"
    padding: "13px 26px"
  button-primary-hover:
    backgroundColor: "{colors.chart-blue-bright}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.fog-blue}"
    rounded: "{rounded.md}"
    padding: "13px 26px"
  button-secondary:
    backgroundColor: "rgba(78,205,196,.08)"
    textColor: "{colors.signal-teal}"
    rounded: "{rounded.md}"
    padding: "13px 26px"
  chip:
    backgroundColor: "{colors.raised-chart}"
    textColor: "{colors.fog-blue}"
    rounded: "{rounded.pill}"
    padding: "7px 13px"
  card:
    backgroundColor: "{colors.chart-surface}"
    rounded: "{rounded.lg}"
    padding: "24px"
  stat-tile:
    backgroundColor: "transparent"
    borderTop: "2px solid {colors.sounding-line-bold}"
    padding: "8px 2px 0"
  tag:
    backgroundColor: "{colors.raised-chart}"
    textColor: "{colors.faded-ink}"
    rounded: "{rounded.sm}"
    padding: "3px 9px"
---

# Design System: Healthcare Uncharted

## Overview

**Creative North Star: "The Field Atlas"**

Healthcare Uncharted looks like a working explorer's atlas of the healthcare system: dense with real data, annotated in monospace, built to be used in the field rather than admired on a shelf. Every surface starts from deep navy water, and the content IS the light: white display type, fog-blue prose, and one teal signal that marks where the reader should look next. Data is never decoration here. Numbers arrive with their sources, maps carry real coordinates, and the interface treats the reader like the person at the chart table, not a passenger.

The system is tactile and confident. Cards lift when you reach for them, buttons press, and arrows slide toward where you are going, all inside a strict motion budget (150ms state changes, 280ms structural moves, 250ms ceiling on phones, stillness under reduced motion). Density is medium-high and unapologetic: this is an atlas, and atlases are full. What keeps the fullness readable is discipline, one-pixel sounding lines around every container, a four-step tonal ladder instead of shadow soup, and monospace labels that caption everything like coordinates on a chart.

**The Quiet Precision era (adopted 2026-08-06, from the Reskin Lab: Signal Boost, then Quiet Precision, then Cartographic Quiet).** Hierarchy comes from type and space, not from effects. State is ink and weight, never a halo. Boxes dissolve into rules: stat tiles stand on a 2px top rule instead of sitting in a filled box, callouts read as margin notes on open ground, toolbars are mastheads over one strong rule. The cartographic layer whispers on top: hairline survey ticks at two corners of outer surfaces, drawn in border gray and never in accent; names at drawer-card scale in tracked caps; fact labels as mono captions; tiny geometric markers leading catalog rows. The stated anti-goal, in the founder's words: nothing that feels AI generated fast and dirty. Glows, gradient accent bars, tinted callout panels, and 300-weight body on dark are all retired.

**Key Characteristics:**
- Dark-first: deep navy pages where content carries the light; a full light theme exists and flips by token, never by redesign
- One teal signal (#4ECDC4) does the pointing; chart blue (#1B5FA8) does the acting
- State is ink and weight: selection reads as a solid fill or an ink change plus weight, never a glow
- Monospace is the voice of data: every label, source line, and coordinate is IBM Plex Mono, small and letterspaced
- Bordered, tonal depth; shadows are reserved for things that move or float
- Real data density, phone-honest: 44px touch floor and a one-transient-surface rule on every interactive tool

## Colors

A nautical chart at night: four depths of navy water, paper-white and fog-blue ink, one teal signal, and a small set of beacon hues that only light when data calls for them.

### Primary
- **Signal Teal** (#4ECDC4): the brand's one pointing finger. Active nav states, selected chips, live values, focus rings, the wordmark accent. In code it is `--teal`. On light surfaces it flips to **Signal Teal Deep** (#1B9A90, `--teal-dk`) whenever used as text, because the bright step fails contrast on white.
- **Chart Blue** (#1B5FA8): the action color. Primary buttons, the nav pill, subscribe. Hover brightens to **Chart Blue Bright** (#2478d4). Chart Blue acts; Signal Teal points.

### Secondary
- **Beacon Amber** (#E8A838): warnings, draw modes, "lo" stat states, the lab notice. Text-on-light flips to **Beacon Amber Deep** (#946905).
- **Landfall Green** (#2D9B6F): positive signals and guest accents. The Secret Menu runs a brighter guest step (#4ecb8d) as its section identity; that value is deliberate incumbent vocabulary, not drift.
- **Reef Red** (#DF5752): negative signals and the medical-science lens.
- **Meridian Purple** (#7C6FCD): the policy lens.

### Neutral
- **Deep Water** (#0a0f1a): the page itself (`--dark`). Light theme: #EEF2F7.
- **Chart Surface** (#0f1825): cards and footer (`--surface`). Light: #FFFFFF.
- **Raised Chart** (#162030): chips, tags, inputs, stat tiles (`--raised`). Light: #E2E8F0.
- **Chart Shelf** (#1c2a40): the highest resting step (`--raised2`).
- **Paper White** (#FFFFFF): headlines and primary text (`--t1`). Light: #001117.
- **Fog Blue** (#b8cfe8): body prose and secondary text (`--t2`). Light: #2D3748.
- **Faded Ink** (#7E9CBF): captions, meta, labels (`--t3`). Light: #4A5568. Lifted from #5A7898 on 2026-08-07: the old step sat at 3.2 to 4.2 contrast on the dark surfaces and failed small text everywhere. The old value survives only as a GRAPHIC fill (chart bars, gridlines) where 3:1 is the bar.
- **Depth Mark** (#2a4060): the faintest text step and dotted underlines (`--t4`).
- **Sounding Line** (#1a2d48) and **Sounding Line Bold** (#24405e): the one-pixel borders that draw every container (`--border`, `--border2`).
- **Ink on Signal** (#062024): the only text color allowed on a solid Signal Teal fill; it is deep water read as ink (The Ink State Rule).

### Working Vocabulary (incumbent, documented 2026-08-06)
- **Content-type badges** (one hue per content type, tints at 12 to 14% alpha): Tools ride Signal Teal, Learn #6aabff, Talks #5DBF87, Lab Beacon Amber, Reference #a99ee8, Rounds #7B92AB (`--type-*` tokens).
- **Lens-pill brights**: policy #b59ff5, tech/economy #38b6f0, medical science #FF6B6B alongside the named accents. Their tint BASES (the rgba anchors behind the 12 to 16% fills) are #8B5CF6 (policy) and #0EA5E9 (tech/economy).
- **Deep steps for light surfaces** (The Deep-Step Rule's per-lens dark values): teal #0F7A72 (#0D7268 on tinted chips), provider #1d5fae, policy #6A45D8, public health #23794e, tech #0e6f96, med-sci #C22F2F.
- **Guest green** #4ecb8d: the Secret Menu's section identity, deep step #2D9B6F.
- **Chart Blue Mid** #2D4A8A: the button hover midpoint token (`--brand-blue-mid`).

### Named Rules
**The One Signal Rule.** Signal Teal points at one thing per view: the active state, the live value, the place to look. If teal is everywhere, it is nowhere. Chart Blue owns actions so teal can stay a signal.

**The Deep-Step Rule.** Any accent used as TEXT on a light surface drops to its deep step (`--teal-dk`, `--amber-dk`, or the per-lens dark values). Tinted backgrounds keep the bright hue; text never does.

**The Earned Color Rule.** Data color appears only when the reader chose the metric. Maps rest in neutral teal-tinted fills until a lens or shading is picked; a tint nobody asked for reads as unexplained decoration.

**The Ink State Rule.** State is ink and weight, never light. Active means a solid teal fill with deep-water ink (#062024) and weight 700, or an ink shift plus a rule; it never means a glow, halo, or tinted wash. If an element needs to say "you are here," it says it the way print does: darker, heavier, ruled.

## Typography

**Display Font:** Outfit (with Trebuchet MS fallback)
**Body Font:** DM Sans (with Trebuchet MS, system-ui fallback)
**Label/Mono Font:** IBM Plex Mono (with Courier New fallback)

**Character:** Confident geometry over warm prose over instrument labels. Outfit at weight 800 with tight tracking gives headlines the stamped-title feel of an atlas cover; DM Sans at light weights keeps long reading calm; Plex Mono captions everything that is data, small, uppercase, letterspaced like coordinates.

### Hierarchy
- **Display** (800, clamp(40px, 6vw, 64px), line-height 1.0, tracking -0.03em): page heroes only. One per page. Page H1s and section titles stay mixed-case; tracked caps never climb to page scale.
- **Headline** (800, clamp(24px, 3vw, 38px), tracking -0.02em): section titles.
- **Title** (800, 20px, line-height 1.15): card titles. Drawer-card and pin-card NAMES inside tools run the cartographic variant: 14px, uppercase, tracking 0.09em.
- **Body** (400, 13 to 16px, line-height 1.65 to 1.75): prose. The 300 weight is retired on dark; thin-on-dark reads generated. Max measure ~65ch (620 to 680px containers).
- **Label** (500 to 700, 9 to 11px, uppercase, tracking 0.08 to 0.16em, always Plex Mono): eyebrows, source lines, stat captions, meta, table headers.
- **Working sizes inside tools** legitimately run 8.5 to 12.5px (fact rows, chip text, drawer meta); these in-between steps are incumbent vocabulary, not drift.

### Named Rules
**The Data Speaks Mono Rule.** If a string is a value, a unit, a source, a date, or a coordinate, it is set in IBM Plex Mono. If it is a sentence, it is DM Sans. No exceptions; this is how readers learn what is checkable.

**The CAPS Rule.** Emphasis is CAPS or a heavier weight, never italics and never bold-inside-prose. UI strings follow the same voice kernel as editorial: no em dashes, middots (·) join fragments.

**The Caption Rule.** Fact-row labels and data captions are mono captions: 9.5px, uppercase, tracked 0.12em or wider, FOG BLUE (`--t2`). Faded Ink captions failed David's QA on open dark ground once the tile boxes dissolved (2026-08-06); Faded Ink is reserved for source lines, meta, and section labels that should recede. Names at drawer-card scale go tracked caps (14px / 0.09em); page H1s and editorial card titles stay mixed-case Outfit 800. Values keep `font-variant-numeric: tabular-nums` wherever figures align vertically.

## Layout

Content lives in 1080 to 1100px centered containers with clamp() padding (20px floor to 80px at desktop). Sections breathe with clamp(56px, 8vh, 96px) vertical padding. Card collections use auto-fit grids (minmax 280 to 320px) that collapse to one column without media queries. The spacing scale runs 4/8/12/16/24/32/48/64/96 (`--space-1` through `--space-9`); card interiors sit at 24px, section breaks at 48 to 64px.

The phone line is 699px everywhere (matching `HUKit.PHONE_MQ`); a secondary 1099px line governs when map drawers dock right versus rise as bottom sheets. The nav is a 64px sticky bar with backdrop blur that collapses to a 44px hamburger and 48px-tall menu rows under 699px.

Interactive tools follow the full-map standard from docs/HU-UI-GRAMMAR.md: an edge-to-edge canvas, floating chrome in a bottom-center cluster, one detent sheet (peek 120px / half 52dvh / full 92dvh), and the budget rules: 44px touch floor, at most one transient surface, ~300KB first-paint fetch, GPS on tap only.

## Elevation & Depth

Depth is drawn, not cast. The four-step tonal ladder (Deep Water to Chart Surface to Raised Chart to Chart Shelf) plus one-pixel Sounding Line borders establish every plane; almost nothing floats at rest. Shadows are reserved for two jobs: things that MOVE (a card lifting on hover, a button pressing) and things that FLOAT above the canvas (sheets, FABs, sticky chrome). Sticky surfaces add backdrop blur (16px) over transparent color-mix backgrounds so the page shows through like water under glass.

### Shadow Vocabulary
- **Ambient** (`box-shadow: 0 8px 40px rgba(0,0,0,.5)`): the default `--shadow`, big, soft, low. For floating panels.
- **Card lift** (`0 12px 40px rgba(0,0,0,.45)`): appears only with the hover translateY(-4px).
- **FAB rest** (`0 4px 16px rgba(0,0,0,.4)`): the one resting shadow, earned by floating over a map canvas.
- **Sheet** (`0 -12px 40px rgba(0,0,0,.45)`): upward, under bottom sheets.
- **RETIRED (Quiet Precision, 2026-08-06):** the CTA glow and the signal glow. Zero-offset halos and colored hover glows are out of the vocabulary everywhere; hover states brighten and lift, they do not radiate.

### Named Rules
**The Border-First Rule.** If a container needs definition at rest, it gets a Sounding Line border and a tonal step, never a shadow. A shadow at rest must be justified by floating above a live canvas.

**The Survey Tick Rule.** Outer surfaces (content cards, pin cards, drawer panels, report containers) may carry two hairline corner ticks: 10px arms, 1px, Sounding Line Bold, top-left and bottom-right, inset about 5px. Ticks are drawn in border gray, NEVER in an accent hue, and never on nested elements; the frame is marked the way a chart plate is, quietly and at the edge.

**The Hub Lift Rule (V3 hub surfaces, locked 2026-08-06).** The hub pages (home, tools, learn indexes) are PRODUCT surfaces, not documents: their catalog cards and the search box carry RESTING elevation as an interaction affordance. Vocabulary: search box `0 12px 32px rgba(0,0,0,.55)`, catalog cards `0 10px 28px rgba(0,0,0,.45)` on the Raised-Chart-plus (#131f30 family) step. This is a scoped exception to the Border-First Rule, which continues to govern reading and editorial surfaces unchanged. Source: the V3 Field Office comp (docs/HU-V3-HOME-BUILD-SPEC-2026-08-06.md).

**The Earned Scenery Rule (V3, 2026-08-06).** The home hero's canvas world (hex panel + routes) draws only when the reader taps the compass rose; at rest the ground is clean. The Earned Color Rule applied to scenery: atmosphere is a reward, not a preload. The 8-tap secret and route rerolls ride the same tap path; reduced motion reveals without animation.

## Shapes

Soft-cornered rectangles in a strict ladder: 7px nav links, 8px inputs and tags, 10px buttons and stat tiles, 12px cards (`--radius`), 16px sheet tops, 999px pills for anything that filters or labels (chips, section tags, lens pills), and perfect circles only for FABs and dots. Corners never mix within a component family. Map markers are simple geometric symbols (cross, triangle, hexagon), never literal pictograms. Accent edges arrive as 3px left borders (lab notice, guest cards, framework callouts) with the radius zeroed on that edge.

## Components

Tactile and confident: controls respond to touch like they enjoy it, one state at a time, inside the motion budget.

### Buttons
- **Shape:** softly rounded (10px)
- **Primary:** Chart Blue (#1B5FA8) with white text, 13px 26px padding, 600 weight at 14px
- **Hover:** brightens to #2478d4 and lifts translateY(-1px). No glow; the press is the feedback.
- **Ghost:** transparent with Sounding Line Bold border, Fog Blue text; border and text turn Signal Teal on hover
- **Secondary:** teal-tinted fill (rgba(78,205,196,.08)) with Signal Teal text and a .25-alpha teal border

### Chips (the hu-chip standard)
- **Style:** Raised Chart fill, Sounding Line border, Fog Blue text at 12px/600, pill radius, 7px 13px padding
- **State:** `.on` = SOLID Signal Teal fill, deep-water ink (#062024), weight 700 (The Ink State Rule); hover borders teal; 44px min-height on touch
- **Doctrine:** chips apply state, they never navigate

### Cards / Containers
- **Corner Style:** 12px
- **Background:** Chart Surface over Deep Water pages; Raised Chart for nested items
- **Shadow Strategy:** flat at rest with a Sounding Line border; hover lifts -4px with the card-lift shadow and a type-colored border
- **Internal Padding:** 24px (22px 18px on phones)
- **Meta:** every card carries a mono meta line and mono tags; the whole card is the tap target with a stretched link

### Inputs / Fields
- **Style:** Raised Chart fill, Sounding Line border, 8px radius, 9px 13px padding, Faded Ink placeholder
- **Focus:** border shifts to half-alpha Signal Teal; no glow, no outline besides the border

### Navigation
- **Style:** 64px sticky bar, blurred translucent Deep Water, Sounding Line bottom border
- **Links:** 13px/500 Fog Blue, 7px radius; hover fills Raised Chart; active turns Signal Teal (deep step on light)
- **Phone:** 44px hamburger, full-width 48px menu rows, Atlas pill and theme toggle as sized rows

### Stat Tiles (signature)
- **The Ruled Figure Rule.** One value, one label: Outfit 800 at 20px over a 9.5px uppercase mono caption in Fog Blue, standing on a 2px Sounding Line Bold TOP RULE with no fill and no border box. The figure owns the ground it sits on, the way a table in print does. `.hi` values go Signal Teal, `.lo` go Beacon Amber; values set tabular-nums. Grids of two to four, never tables.

### Callouts (signature)
- **The Margin Note Rule.** Warnings and asides are margin notes, not panels: a 3px accent left rule (Beacon Amber for cautions, per-lens hues where earned) against open ground, 14px of lead-in padding, no background tint, no border box, no radius. The editor writes in the margin; the page does not build a little room for the remark.

### Tool Chrome (signature)
- Toolbars are mastheads: the tool name over one strong 2px Sounding Line Bold bottom rule, kicker in mono caps, no boxed bar treatment. The kicker may lead with a quiet `─ ` dash in border gray (U+2500, never an em dash).
- Catalog and selection rows lead with tiny geometric markers: `▸ ` in Depth Mark at rest, flipping to a filled `◆ ` in Signal Teal when selected (deep step on light). Wayfinding by glyph, quieter than any border.

### Detent Sheet (signature)
- The one bottom-sheet implementation (HUKit.sheet): 16px top corners, upward sheet shadow, injected grabber (44x4px bar), peek/half/full detents, drag with flick velocity, hardware back walks the X button's path on phones.

### Lens Pills (signature)
- The 4Ps and Atlas-zone vocabulary: pill-shaped mono tags tinted per lens (patient teal, provider blue, payer amber, policy purple, and kin) at 12% alpha fills with .34-alpha borders. Lenses render as pills and section headers, never as page chrome.

## Do's and Don'ts

### Do:
- **Do** point with Signal Teal and act with Chart Blue; keep the two jobs separate.
- **Do** caption every data element in Plex Mono with its source; a number without a walkable source does not ship.
- **Do** draw containers with Sounding Line borders and tonal steps; save shadows for movement and floating chrome.
- **Do** keep the 44px touch floor, the 699px phone line, and the 250ms phone motion cap on every interactive surface.
- **Do** let cards lift (-4px), buttons press, and arrows slide; tactile response is the brand's handshake, within the budget.
- **Do** flip accent text to its deep step on light surfaces (The Deep-Step Rule).
- **Do** dissolve boxes into rules where the content can stand on open ground: ruled stat figures, margin-note callouts, masthead toolbars.
- **Do** check every reskinned surface in BOTH themes; a rule that vanishes on light is a regression, not a style.

### Don't:
- **Don't** use em dashes anywhere, including UI strings, aria labels, and CSS comments; middots join fragments.
- **Don't** color data the reader did not ask for; resting maps stay neutral (The Earned Color Rule).
- **Don't** ship literal pictogram icons on maps or dashboards; geometric symbols only.
- **Don't** stack transient surfaces; one sheet, drawer, or overlay at a time on phones.
- **Don't** render the 4Ps as page structure or labeled headers; they are pills and picker sections only.
- **Don't** introduce new fonts, new accent hues, or a fifth tonal step; the ladder is the system.
- **Don't** glow: no zero-offset halos, no colored hover radiance, no box-shadow as emphasis (The Ink State Rule).
- **Don't** run gradient accent bars or gradient text; accents are solid, one hue, drawn like rules.
- **Don't** set body or description text at weight 300 on dark; 400 is the floor.
- **Don't** put survey ticks on nested elements or draw them in accent color; two corners, border gray, outer surfaces only (The Survey Tick Rule).
