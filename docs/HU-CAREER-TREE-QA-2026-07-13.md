# Career Tree · QA Notes · 2026-07-13 batch

Uncommitted delta on top of 8317aac. Six files: the tool (index.njk), four data files, references.js.
Everything below was verified by build, parse, and logic repro before handoff. Full record at the bottom.

---

## What this batch is

One sentence: the tool now speaks ONE grammar on all four surfaces, and your pins follow you everywhere.

### My Path became the narrative sheet
- Numbered story sections top to bottom: ① Career Path (who you are, what you're becoming) ② Education (the road) ③ Areas of Expertise (four zone tracks side by side) ④ Next Steps (promoted to its own gold panel).
- The stations BAR is gone. Each numbered header carries a guide chip with that station's state. The first incomplete one wears the pulsing arrow. Clicking a chip opens the same focused picker popups as before.
- Notes, Strengths, Other moved to a "Your notes" appendix dash below. Still draggable, still resizable.
- Toolbar pruned: Goals-only stays, Save/Load + Export JPEG + Reset build live in one ⋯ More menu.
- One-time spotlight: after the survey, the four section numbers flash in sequence. localStorage key `hct-guided`. Clear it to see the cascade again.
- Views fade and rise on switch. Reduced-motion users get none of it.

### Career Matrix, selection rebuilt
- The career line = LADDER + DOORS. Rungs expand only inside the selected role's discipline. A cross-discipline edge shows the far tile (the door) but never expands through it. The old blind closure lit half the board for convergent roles (Senior CIA pulled in 29 tiles across 8 families; now 19 tiles, one full lane plus skinny door lanes).
- One road per door. Several rungs can share a door (RRT and ACCS both lead to CIA) but only the tier-closest rung draws the line. A road from the selected tile always wins. No door is ever left roadless.
- Door↔door edges never draw. Two doors with their own edge (RN→BSN riding along) were redrawing the foreign ladder the snap left off.
- Edge elbows run in the band gap next to the source row. The old midpoint routing ran horizontals dead across intermediate tile rows.
- Pathway and discipline headers hide themselves when wider than their lane. Long titles over one-tile door lanes were overprinting neighbors.

### Education Matrix
- Snap is discipline-grain. Click a respiratory credential, get the Respiratory lane plus Any-field. Pathway-grain showed all of therapeutic.
- Every lane has its own family-colored sub-container, career style.
- Specialty certs band: tiles render fully (a missing-field crash was blanking every board cert after CCRN), and the degree→cert lines are gone. Boards ride a license; prerequisites live in the panel's "Rides on".
- Any-field grew the whole generic ladder: BLS, ACLS, Lifeguard at the certificate band, generic AS, BS, the masters row, and a Doctorate card (PhD / EdD / DrPH, jobs: research scientist, psychologist, dean). PhD itself lives in the faculty lane because that ladder owns it.
- Snapped fit centers the lane in the leftover width instead of hugging the axis.

### Areas of Expertise
- Snap is group-grain. Clicking a skill used to frame all 92 skill-zone tiles; now it frames the tile's group row (worst case 21).
- Parked zones actually disappear now. A CSS ordering bug let the selection dim resurrect other zones' tiles at 28% on top of the snapped lanes. That was the "overlap mess".
- Camera fights ended: any wheel or drag interrupts an in-flight fit tween. And all three boards now treat sub-6px mouse drift as a click, so empty-space deselect works every time (d3's default tolerance is zero pixels).

### The shelf: ON YOUR PATH, on all three boards
- While snapped, everything you've claimed that fell off the visible field gathers in an "On your path" shelf: own container, band-true positions, zone/family colors, rings intact, always lit, no roads.
- Clicking a shelf tile snaps to ITS home lane/group/line. Your pins double as navigation.
- Cross-pull: holding a JOB counts as holding its credential. A pinned CRT role rings and shelves the CRT card on the Education Matrix without a separate education pin. Degrees are deliberately NOT inferred from jobs, many roads lead to one degree.
- Forked concurrent roles ride the shelf too (the first cut missed them).

### Data deltas
- career-tree.json: 158 roles, 235 growth tiles / 29 groups, 10 specialty certs.
- career-tree-creds.json: 47 credentials, 68 faceMap keys, 47/47 entry blocks, 43 with pass rates.
- career-tree-bls.json: 122 roleMap entries, all resolve.
- growth-detail: 235/235 how/show.
- references.js: loads clean, includes the NBRC 2025 refresh and BCEN.

---

## Test plan for the next few days

**My Path flow**
1. Fresh browser (or clear localStorage): land flat, "Start here →" lit, run the survey, watch the number cascade fire once.
2. Follow the arrows: name a start, pick a destination, pin the road, claim expertise. The arrow should walk ①→②→③ and the chips should read your state back.
3. ⋯ More menu: Save/Load round trip, Export JPEG (check zone sections and the plan render), Reset build.
4. Drag, resize, rename cards in the notes appendix. Add a second Other.

**Career Matrix**
5. Select your own role, then a far one (informatics from respiratory). The snap should read: full home lane, one tile per connected lane, one line per door, no lines through tiles, headers not overlapping.
6. Check the shelf: every pin you hold that is not on the field, including forks, staggered, not touching.
7. Click a shelf pin: it should snap to that pin's line. Click empty space: full board back, every time, even with a sloppy hand.

**Education Matrix**
8. Click a respiratory credential: Respiratory + Any-field only, centered, sub-containers visible.
9. Spec certs: all ten labeled, dotted outlines, no lines from degrees, "Rides on" in the panel.
10. Any-field: BLS / ACLS / Lifeguard at certificate, AS → BS → masters → Doctorate ladder, "stepping stone" subs.
11. Cross-pull: with CRT/RRT roles pinned but no education entries, the CRT card should ring and shelf.

**Areas of Expertise**
12. Click a tile: its group row frames close, other zones GONE (not ghosts), your claimed tiles from elsewhere on the shelf.
13. Scroll hard mid-snap, drag mid-fit: no rubber-banding, camera obeys you instantly.
14. Lens + snap together, search while snapped (search releases the snap by design).

**Cross-cutting**
15. Light mode pass on all four surfaces (the shelf chrome uses fallback colors, worth a look).
16. Phone width: sheet sections stack, zones go 1-col, toolbar menu reachable.
17. URL params still round-trip: ?view / ?lens / ?hidepw / ?emetric.

## Watch list (conscious behaviors, not bugs)

- Pins whose family lane is on the board as a DOOR lane still ride the shelf (informatics pins shelf even when a CMIO door lane is up). Rule-consistent; flag it if it reads wrong.
- The shelf exists only while snapped. If you want it on the resting board, that is a design conversation.
- Lifeguard is one tile deletion if it does not earn its place.
- RRT→ACCS pins show no connecting line when both ride along as doors of someone else's line (door↔door rule).
- Zone cards on the sheet no longer honor custom titles (headers are fixed now).
- base.njk title separator em dash is still site-wide, untouched, your call.

## Verification record (all green, 2026-07-13)

- Eleventy build clean, 42 files.
- Inline scripts parse: career-tree 6/6, atlas 6/6, home 6/6.
- Data: leadsTo 0 dangling, faceMap 68→47 all resolve, BLS 122 all resolve, growth-detail 235/235, references.js loads.
- Narrative sheet repros: migrate filter, guide state machine (empty / mid / full), dash text-only, spotlight flag.
- Lineage repros across 6 selections: door dedup leaves 0 roadless doors everywhere.
- Shelf repros: forks included, honeycomb stagger, edu lane checks, all four new Any-field cards land in __any.

Rollback note: the pre-transformation radial AOE + iceberg Education Matrix live at archive/career-tree-2026-07-12-radial-aoe-iceberg-edu.njk.
