# Device Assembly: the plan for beta session one

Written in window 2026-10-05-d. It comes from David's QA marks on the Puzzles sheet (19 walls: 8 good, 11 notes) and
the note he sent with them: "if something's going to be a power outlet I think we need to have a unique icon for that... please take
a look at some of my focus notes on the ventilator section I think all the ventilators section is going to be improved
in general by some of our larger thinking about how ventilators fit... consider anymore enhancements we can do from
here otherwise once we get the different variations and a set of puzzles and menuing set up I feel like this will be
good for beta session one."

BUILT 2026-10-05 (window e) on David's yes to all three (DECISIONS B1 to B3), except the level menu, which is two
mockups waiting on his pick (B4). What was built beyond the plan: the joint slide (V5 at a joint where two parts seat
directly), the vent's hoses and sampling lines lying over things like cords, and a tap that picks a run. This was a PLAN. It needed David's yes before any of section 3 onward was built. Section 1 was built in the same window as
tweaks; section 2 says what his notes asked that this plan answers.

## 1. Built in this window (tweaks, at his next look)

| His note | What changed |
|---|---|
| Power needs its own icon, male and female | The plug is a plug (blades on a body, the cord below) and the receptacle is an outlet's face (two slots over the ground hole). A seated plug carries no green dot; a cord leaves its device through a boot; a device whose cord is not out shows its plug where you pull it from; a hanging cord shows the plug on its end; the cart tile of a powered device shows the plug. |
| l2: no trash bin; "drag it off the play field" | A wall part let go anywhere off the wall goes back on the cart. The Back to cart strip lights while it is out there. The patient stays; Undo brings a part back. |
| lnrb: keep the order up unless they pick tips | Outside the tutorials the bedside screen stays on Order and never turns to Hint by itself. The tutorials still lead with their steps (he marked t1 to t5 good). |
| l1t: the phone's top bar does not look right | On the timed wall the SpO2 chip pushed the bar onto two rows from 380 to about 420 px wide. The chip is now its label over its number on a phone (47 px, was 90); the bar is one row at 360, 393 and 430. |
| l5: the URL overlaps on the saved picture | The wall was drawn to 1052 of 1080 and the logo and link were drawn over it. The card now has a footer band of its own, and the wall fits at its own shape (it was squeezed square). |
| f5: the cannula, left and right | An interface's own tubing now leaves from the cheek nearer the port it runs to: the cannula turns itself, in the route preview too, and stays put where only its own side has a way through. No dealt wall changed (60 compared). |
| Found on the way | Every ventilator wall's bedside screen showed "L/min" with no number in front of it. It reads the vent order now (Ventilator, 40% FiO2, humidified, by endotracheal tube), and a puzzle test holds every wall's screen to a whole order. |

## 2. What the notes asked that is not built

- v1, v2, v3: the ventilator section as a whole (section 3).
- l2, second half: switch a circuit between heated and unheated with a button once it is picked (section 4, M3).
- l3: the headwall runs out of room; runs only go straight down; let cords lie over things (section 4, M1 and M2).
- f3 (his note describes f2, the unplugged heater): a red herring on the cart. A bubble humidifier there would not be
  one. Humidified oxygen at 4 L/min by cannula is what a bubble humidifier is for, and the wall's own scenario says the
  heater is more than the order needs, so the test would rightly pass it. Decoys are a level design rule (section 5, P3).
- l5, second half: one standard for every picture the site saves (section 7).

## 3. The ventilators

His notes, in order. v1: "I'm not exactly sure how to get the [Y] and the limbs to work properly... we also need to
consider how the patient tubing will fit with everything else on screen maybe we need extensions or more Dead Space which
could be insane and we also need to make sure that our ventilators connect to oxygen and air so they can blend gas
properly." v2: "the ventilator configuration only works because of the specific import and export valves being on the
side... ports on either side... top and bottom or side to side maybe we have a couple different ventilator setups... the
humidification is going to be kind of attached to the ventilator [cart] that it is smaller or more in line... sometimes
instead of using a humidifier they're just gonna use a HME." v3: "devices that are going to go in line... how they
orient themselves either automatically when you drop them in there or if the line automatically connects itself or if
you try to connect something into an already connected circuit."

| Item | What it is |
|---|---|
| V1 Two gases | The ICU ventilator takes an oxygen hose AND an air hose and blends inside, the way a compressor-less ICU vent does; without air it fails the test, and the test says so. A turbine ventilator (home, transport and noninvasive) keeps one oxygen hose or a bleed-in. Today there is one vent, written as a turbine with an oxygen hose. |
| V2 The vent cart | The ventilator, its humidifier and the circuit's hanger are one footprint on a pole, the way the cart rolls in: the humidifier sits on the vent's side, in line, and smaller. The wall stops paying for two separate devices and the space between them. |
| V3 Port layouts | Three ventilator layouts with the same rules: ports on the right side, on the left side, and on the bottom. A wall names its layout; the generator deals them. Not one real model, the way the vent is representative today; the spec sheet says so. |
| V4 The circuit as one piece | A circuit comes out of its bag as one thing: two limbs and the Y, heated or not. Drop it on the vent and it lays itself from the inspiratory port, through the humidifier, to the Y and back to the expiratory port; the Y goes on the tube. The puzzle on most vent walls becomes what goes in line and where. v1 keeps the loose pieces, because laying a circuit by hand is its lesson. |
| V5 In line | Drop a part on a run and the run opens: the part seats between the two ends, turned the way the gas goes (a filter on the expiratory side, a neb before the Y). Pull it out and the run closes again. This is his v3 note, and it serves every wall, not only the vent ones. |
| V6 Room at the patient | A short extension (a flex tube) between the Y and the tube; on the dead-space rule's terms, an extension on the patient side of the Y is a teaching fault of its own (his "more Dead Space which could be insane"). |
| V7 HME or heater | Every vent wall can be either, by its order; the dealt ICU walls already deal both. |

## 4. Mechanics for every wall

| Item | What it is |
|---|---|
| M1 Cords lie over things | A power cord is drawn as a loose line that may cross parts and tubing. It takes no squares, so it never blocks a run (his l3 note). It still has a reach and still has to find a live outlet. |
| M2 Runs cross | Two runs may cross at a right angle with a small hop, so a wall does not run out of room at the top. |
| M3 Swap | A picked part with a twin on the cart (a heated and an unheated circuit, a 7 ft and a 14 ft cannula) shows a Swap button, and swapping keeps its runs (his l2 note). |

## 5. Level design and pathways

| Item | What it is |
|---|---|
| P1 Pathways | The walls become short paths with a start and an end: Oxygen on the floor, Humidity and aerosol, High flow, Find the fault and Ventilators; Away from the hospital (rehab and home) after them. Each is four to six walls, easy to hard, and the pass card's Next goes to the next one on the path. |
| P2 Variations | Each authored wall can be dealt again with the room mirrored, the outlets moved or the source changed (the generator already does this for the dealt walls), so a path has replay without new writing. |
| P3 Decoys | A cart can carry a part that looks like it helps and is wrong for a reason the test names: an extension cord (not allowed at the bedside), an air flowmeter on an oxygen order, a 15 mm piece on a 22 mm job. A decoy is never a right answer in disguise, which is why f2's bubble humidifier cannot be one. |
| P4 A set of puzzles for the beta | Every path filled to four walls at least, every wall on the Puzzles sheet with a stored answer, so the sheet tries every break of every wall (today the 27 authored walls have none). |

## 6. The level menu

The walls card becomes the paths: one row per path with how far along you are and the next wall ready to play. Today's
wall, a random deal, the race and the maker sit together above them. This is a look decision, so it comes to David as
two mockups at phone and desktop before it is built.

## 7. One standard for saved pictures

One frame for every picture the site saves: the 1080 square, a title band, the content box, and a footer band with the
logo and the link that nothing draws over. Device Assembly's card is the first one built to it this window. Alarm
Fatigue's share card, the Rounds cards and the other tools follow. It is an Inbox card, since it reaches past this
surface.

## 8. The order to build it in

1. V5 In line, M1 cords, M2 crossings: the mechanics every later wall leans on.
2. V1 two gases, V2 the vent cart, V3 port layouts, V4 the circuit piece, V6, V7: the ventilator section rebuilt.
3. P1 to P4: the paths, filled, with answers stored and decoys where they teach.
4. The level menu, after David picks a mockup; the picture standard across the tools when he promotes it.
5. QA at the milestone: his list, the Puzzles sheet, `npm run qa`. Then beta session one.

## 9. For David (also in DECISIONS.md)

1. Yes to this plan, in this order? Recommendation: yes; section 8 puts the shared mechanics first so the vent rebuild
   and the paths are built on them once.
2. The circuit as one piece (V4) on most vent walls, with v1 keeping the loose pieces to teach it? Recommendation: yes.
3. Which paths are in beta session one? Recommendation: Oxygen on the floor, Humidity and aerosol, High flow, Find the
   fault and Ventilators; rehab and home follow in beta two.
