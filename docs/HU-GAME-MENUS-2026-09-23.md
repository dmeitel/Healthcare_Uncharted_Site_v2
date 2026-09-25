# Game menus · the reference shelf and the prompt words · 2026-09-23

David, 2026-09-23: "There are great apps out there that already use clean UIs for items and
settings and I feel like we should be coping those a bit more. For all of our games the menuing
should not be hard to figure out and should follow what the best and highest rated and consumed
apps do."

WHAT THIS IS. Four things a session needs before it drafts or builds any game menu:
- the rules the platforms already wrote down (section 1)
- one app to copy for each menu job (section 2)
- the words to use in a prompt, so a draft names a real pattern instead of an adjective (section 3)
- a proposed menu contract (section 4), with where the three games stand against it (section 5)

STATUS. Reference, ranked with `docs/`. It sits under the open reading-load phase (CLAUDE.md),
which already names all three games. The contract in section 4 is BINDING since 2026-09-23: David
said yes (DECISIONS 15) and it is written into `.claude/rules/games.md`, with the kit pieces that
carry it (`HUKit.dialog`, `gameMenu`, `settings`, `howTo`, `confirm`).

HOW IT WAS MADE. Every game was read, not just looked at: a code inventory of every menu, card,
overlay and button label in all three, plus first-screen shots and word counts at 360 and 1280
(scratchpad, not kept). The platform rules and the reference apps were checked live on the date
above. Nothing in the games was changed. Another session was editing them at the time.

---

## 1 · What the platforms already say

Checked live 2026-09-23. These are the floor. Nothing below contradicts them.

From Apple's Human Interface Guidelines ([Designing for games](https://developer.apple.com/design/human-interface-guidelines/designing-for-games),
[Settings](https://developer.apple.com/design/human-interface-guidelines/settings),
[Onboarding](https://developer.apple.com/design/human-interface-guidelines/onboarding),
[Menus, in-game menus](https://developer.apple.com/design/human-interface-guidelines/menus)):
- Let people play right away, on good defaults. Setup they could skip should not stand in front
  of play.
- Teach through play. A written tutorial is a reference people can open, never a gate. If they
  skip it, do not show it again, but keep it easy to find in help or settings.
- Prefer small tips placed next to the thing they explain over one long onboarding flow. That
  is our peek, word for word.
- Minimize the number of settings. Do not rebuild a system setting (dark mode, reduced motion)
  inside the game; follow the device.
- Options for the task at hand live on the screen they affect, not in a settings area.
- In a game, "players often use the Esc (Escape) key" to open settings.
- Buttons at least 44 by 44. In-game menus stay legible at every aspect ratio and in both
  orientations.

From the [Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/full-list/),
the basic tier:
- "Allow the game to be started without the need to navigate through multiple levels of menus"
- "Ensure that all settings are saved/remembered"
- "Include interactive tutorials"
- "Use an easily readable default font size"
- Intermediate: a reminder of the controls and the current objective during play, and
  contextual in-game help.

---

## 2 · The reference shelf, one app per menu job

The idea: every menu job already has a winner that millions of people have learned. We copy the
SHAPE (what is on the screen, in what order, where it sits) and keep our own look. Nobody's art,
icons or copy comes with it.

Balatro and DREDGE won Apple Design Awards in 2025 (Delight and Fun, and Interaction;
[source](https://developer.apple.com/design/awards/2025/)). The rest are here because they are
the ones a stranger has most likely already used, which is the whole point of copying them.

| Menu job | Copy | Take exactly this |
|---|---|---|
| First screen | Wordle (NYT Games) | One big play button. A "?" and a gear as small icons in the top corner. Nothing asked before the first move. |
| Start a run, pick up a run | Balatro, the Play panel | Three tabs: New Run, Continue, Challenges. It opens on Continue when a run is unfinished ([source](https://balatrowiki.org/w/Main_menu)). The deck and stake come pre-chosen, so Play then Play starts a game. Locked options show, greyed, with how to earn them. |
| How to play | Wordle, "How To Play" | A card that opens BY ITSELF on the first visit only: three rules, then examples. After that it lives behind the "?" forever. |
| Settings | Wordle, the gear | A short list of rows. Each row is a label, one line under it saying what it does, and a switch on the right. Changes apply the moment you flip them. No Save button. |
| Pause or game menu | Any console game | Resume first and biggest. Help, Settings, Restart in the middle. Leave last. Esc opens it and Esc closes it. |
| Items and upgrades | Balatro, the joker cards | The card face carries the art, the name and one number. Hover or tap shows the full effect with the key number highlighted. The price sits on a tag under the card. |
| Pick one reward | Slay the Spire, the card reward | Three cards in a row, pick one, and a Skip button under them. |
| Level select | Angry Birds, Cut the Rope | A grid of numbered tiles with the stars earned on each. Locked tiles show a lock. The next one to play is the one that stands out. |
| Play with friends | Jackbox | A 4-letter room code. Join takes the code and a name, then Play. The first player in is the VIP and gets the only Start button, "Everybody's In" ([source](https://support.jackboxgames.com/hc/en-us/articles/15794759479959-How-do-I-join-a-game)). |
| Results | Wordle, Statistics | The result first, then four numbers (Played, Win %, Current Streak, Max Streak), a bar chart, a Share button and a countdown to the next one. |
| Are you sure? | iPhone, "Delete Photo" | The button says the action ("Delete Photo"), never "Yes" or "OK". The destructive one is red. Cancel sits apart from it. |

Where to look when a job is not on this shelf: the [Game UI Database](https://www.gameuidatabase.com/)
files screenshots of shipped games by screen type (Pause, Settings: Options, Inventory, Modal:
Option & Menu, Item/Ability: Selection Menu and so on). Copy from a game in the same genre, and
write the game and the screen name into the prompt.

---

## 3 · The prompt words

### 3.1 Say the name, not the description

A description makes the model invent. A name makes it copy something that already works. The
left column is how it tends to get said; the middle is the word to use instead.

| When you mean | Say | It looks like | Ours, if we have one |
|---|---|---|---|
| a box in the middle you have to deal with | modal card | Wordle's How To Play | each game has its own; the kit has none yet |
| a panel that slides up from the bottom | bottom sheet | the place card in Apple Maps | `HUKit.sheet` |
| a little box that explains a thing on hover or tap | peek (a tooltip that also works on tap) | a Balatro joker's description | `HUKit.peek` and the "i" badge, `.hu-i` |
| a menu that drops down from the top | tray | a drop-down filter bar | `.hu-fold--drop` |
| a section you can open and close | fold | any FAQ list | `.hu-fold` |
| a small message that shows and goes away | toast | Gmail's "Message sent · Undo" | each game has its own |
| the numbers that stay on screen while you play | HUD | the score and lives in any game | |
| the row of buttons that switches screens | tab bar | the bottom of Instagram | |
| two to four choices in one row, one lit | segmented control | Easy / Normal / Hard | the hospital game's start menu |
| an on and off switch with a label | toggle row | a row in Wordle's settings | |
| the button that matters most | primary button | Wordle's Play | |
| the quieter button next to it | secondary button | | |
| a button that just looks like words | text button | "Not now" | |
| the button that destroys something | destructive button, named with its verb | "Delete Photo" | |
| the three dots | overflow menu | the ⋮ on a Gmail message | |
| the three lines | hamburger | the site menu | the site's ☰ |
| an arrow pointing at a button in a tutorial | coach mark | first-run tips in most apps | |
| a screen with nothing in it yet | empty state | an empty inbox | |
| pick a level | level select | Angry Birds | the assembly game's WALLS page |
| pick one of three | draft pick | Slay the Spire's card reward | the hospital game's enhancement draft |
| the first thing you see | start screen, or "drop straight in" when there is none | Wordle | |

### 3.2 Words that do nothing in a prompt

"Clean", "simple", "intuitive", "modern", "sleek", "polished", "user friendly", "less
cluttered". Every model already believes its output is all of these, so the word changes
nothing. Replace each one with a reference and a number:

- NOT "make the settings clean". SAY "settings like Wordle's gear: at most five toggle rows, one
  line of help under each, applied on the switch".
- NOT "simplify the start screen". SAY "start screen like Balatro's Play panel: defaults chosen,
  one primary button, first paint under 40 words at 360".

### 3.3 The draft prompt

```
SCREEN   what the player would call it, in which game
JOB      what the player does here, in one sentence
COPY     the app and the screen, plus the one to three things to take from it
KEEP     what stays ours: the palette, the peek for anything longer than a label,
         44 px targets, Esc and the phone back gesture close it
LIMITS   words at first paint, how many buttons, how many choices
SHOW ME  a screenshot at 360 and at desktop, before and after
```

### 3.4 One filled example per game

Uncharted General, the start screen:
```
SCREEN   the start screen, Uncharted General
JOB      a new player starts a run in one tap; a returning player picks up where they left off
COPY     Balatro's Play panel: tabs for New run / Continue / Scenarios, opening on Continue
         when a run is saved; everything pre-chosen so Start works on the first tap
KEEP     the CEO carousel, the locked ownerships shown greyed with how to earn them
LIMITS   first paint under 60 words at 360; one primary button; The Table moves to its own tab
SHOW ME  360 and 1280, before and after
```

Alarm Fatigue, the menu:
```
SCREEN   the game menu, Alarm Fatigue
JOB      from anywhere in a shift: resume, change the sound, restart, or leave
COPY     a console pause menu: Resume first, Leave last; Wordle's settings rows for sound
KEEP     the phone game menu that exists today (it is already this shape), the 11 sliders
         folded behind one "Sound mix" row
LIMITS   one menu button in the same corner at every width; five rows or fewer
SHOW ME  360, 740x360 sideways, and 1280
```

Device Assembly, the level select:
```
SCREEN   the walls list, Device Assembly
JOB      pick a wall, see which are done and how well
COPY     Angry Birds' level grid: numbered tiles, stars on each, locks on the rest,
         the next wall to play stands out
KEEP     the bedside screen as where it lives; the four groups
LIMITS   one name for it everywhere (it is "Levels" on the button and "Walls" on the page today)
SHOW ME  360 and 1280
```

---

## 4 · The menu contract, proposed

Ten rules. The last column says whether a test can hold the rule or a person has to judge it.

| # | Rule | Detail | Test? |
|---|---|---|---|
| 1 | One primary button on the first screen, and it starts or resumes play | Everything else has a default. | yes, count primaries at first paint |
| 2 | One game menu button, in the same corner of every game | It opens one card: Resume, Help, Settings, Restart, Leave, and the site menu as the last row. Alarm Fatigue's phone menu is already most of this (Sound settings, Restart shift, Back to Learn, Site menu), so this copies a pattern from our own code. | yes |
| 3 | Every card and sheet closes three ways | An X in the top right, Esc, and the phone back gesture. With nothing open, Esc opens the game menu. | yes |
| 4 | Help is a "?" that opens a how-to-play card | It opens by itself on the first visit only. | yes |
| 5 | Settings are a few toggle rows, remembered between visits | Nothing that repeats a device setting: motion follows the device, the theme follows the site. | partly, that it is remembered |
| 6 | The same words for the same act in all three games | The game may dress up its play button ("Clock in" is good), never the system verbs. Proposed set: Continue, New run, Restart, Help, Settings, Leave, Share, Next. | yes, a word list |
| 7 | The primary button comes first | Left in a row, top in a stack. Cancel is never the primary. | yes |
| 8 | A destructive action asks once, and its button says the verb | "Restart the shift", not "Yes". Nothing destructive happens on one tap with no way back. | partly |
| 9 | An item shows its name and one number; the paragraph is a peek | The reading-load phase's own grammar, applied to menus. | yes, density is already built |
| 10 | Every menu fits sideways | At 740x360 every menu reads and every button is reachable. | yes, the phone gate already runs 740x360 |

---

## 5 · Where the three games stand

From the code inventory, 2026-09-23.

| Contract rule | Alarm Fatigue | Device Assembly | Uncharted General |
|---|---|---|---|
| 1 One primary on the first screen | YES, "Clock in" on the floor | YES, opens on the wall with Complete | PARTLY: one Start button and good defaults, so one tap does start, but about 30 controls sit in front of it |
| 2 One game menu, same corner | phone only | no; "Levels" button plus the site menu | no; "Save this run" and "RUN THE QUARTER" in the side column |
| 3 X, Esc and back close everything | X and Esc yes, back gesture no | the sheet yes; the results card has no X and Esc cannot reach it | no X anywhere; Esc works only where there is a Cancel; no back guard |
| 4 A "?" with a first-visit card | none | the hint page and folds, no "?" | a "New here?" toggle in the briefing |
| 5 Settings, remembered | sound in two places (a popover, and alarm voices in a shop tab) | none | start screen only, not reachable mid-run |
| 6 The same words | Restart / Restart shift / Clock in tomorrow | Reset / Restart / Run it again / Build it again | Start a New Run |
| 7 Primary first | yes | yes | no, primary last and Cancel first |
| 8 Destructive asks with a verb | a browser `confirm()`, only past 500 tasks | Reset rebuilds the wall at once | yes ("Close the unit", "Fire the CEO") |
| 9 Name and one number, peek for more | upgrades show the paragraph inline | cart shows name and count, spec sheet for more | uses peeks already |
| 10 Fits sideways | not yet measured per menu | not yet measured per menu | not yet measured per menu |

None of the three uses a shared menu component. Each built its own overlay (`#ehrPanel` and
`#soundMenu`; `.da-overlay`; `#ug-overlay`), so every rule above has to be fixed three times.
That is the actual cause of the inconsistency, and the reason the fix starts in the kit.

DEFECTS FOUND ON THE WAY. Claude's to fix. None were touched, because another session was
editing the games.
- Alarm Fatigue tells a phone that is ALREADY sideways to "Turn your phone sideways". The notice
  shows on any phone-sized screen, and `(max-height:500px)` matches landscape
  (`src/fun/alarm-fatigue/index.html`, the small-screen notice near line 5716).
- The same notice's button says "Clock in" but only closes the notice; the shift does not
  start. Two buttons with one label and two different jobs.
- Device Assembly's results card cannot be closed with Esc. The page keydown handler returns
  early whenever the overlay is open (near line 2904), so the overlay branch of `escapeStep()`
  never runs from the keyboard.
- Uncharted General's start screen, Chart Room, end screen and event choices have no close
  control and ignore Esc.
- A trap for later: Device Assembly's cart buttons already carry `data-def` with a raw part id,
  the default trigger `HUKit.peek` listens for. Wiring peek into that game unchanged would pop
  a card reading the part id on every cart item.

---

## 6 · What it takes, in order

1. This document. David reads the shelf in section 2; any app he would rather copy, he names,
   and the row changes.
2. The contract goes into `.claude/rules/games.md` on David's yes (DECISIONS 15). From then on
   every session building a game menu works to it, and every draft prompt uses section 3.
3. The menu pieces get built ONCE, in the kit:
   - a modal card that closes the three ways
   - the game menu
   - a settings list with toggle rows that remember themselves
   - a how-to-play card that opens once
   - a results card
   - a pick-one card
   - a confirm that names its verb
   These serve the three named surfaces, the same way `HUKit.peek` was built for this phase.
4. Alarm Fatigue converts first, since it is the public game and the one going out for
   publicity. Uncharted General next, for the heaviest first screen. Device Assembly last: it
   has its own parked phase, and the best start of the three already.
5. A gate, `tests/game-menus.test.js`, holds every rule with a yes in the test column.
6. A stranger test on each game. Hand the phone to someone who has never seen it and say only
   "start a game, turn the sound off, then get back to where you were". Do not help. Count the
   taps and write down every place they stop. No script measures whether a menu is understood;
   a person is the only instrument that does.
