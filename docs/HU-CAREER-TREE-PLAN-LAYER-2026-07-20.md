# Career Tree: The Plan Layer + Arrival Layer, 2026-07-20

**Status: BUILT, verified headless (26/26), awaiting David's device QA.** This closes the four flow-doc bricks (HU-CAREER-TREE-FLOW.md build order 2 through 5) plus the OG image thread. All in one session, all uncommitted.

## What went in

### 1. Checklists (flow stage 5)
Requirement items are now facts you hold or don't, tickable in two places that share one store:
- Next Steps: every future ROLE carries its req items as tickable rows. Every future CREDENTIAL carries its Getting-in items (entrance exams, prereqs, hours) the same way. The bold line shows "2 of 3 in hand". A count, never a percentage. No guilt bars on a life.
- The role panel: a PINNED role's Requirements list becomes the same checklist ("tap what you hold"). Unpinned roles keep the plain list.
- Storage: `build.checks`, keyed `r|roleId|item` / `c|credId|item` (item text normalized). Rides save/load codes and the migrator. Ticking updates every rendered copy in place.
- Tap target: rows grow to ~44px on phone per the UI grammar floor.

### 2. Plan totals, "The bill" (flow stage 5)
Top of Next Steps when a road exists: rough years of school, board exam count, summed exam fees, over pinned future education plus the plan's still-unpinned requirements.
- Years walk the degree ladder from your highest CURRENT education level (cumulative map: Cert 0.75 / AS 2 / BS 4 / MS 6.25 / Doc 8.5; sideways programs at or below your level add standalone time).
- Fees parse the creds file's posted fee strings: parentheticals dropped, retake/reapplicant pricing excluded, member/nonmember pairs take the public price. Spot-checked against all 47 credentials.
- The fineprint names every credential counted and says plainly that tuition is not guessed.

### 3. Arrival layer (flow stage 1)
- **Deep links**: `?role=`, `?cred=`, `?area=` open the tool on that tile (career board snap / education matrix / expertise map). Applied once; the next interaction scrubs the param. Articles can now land a reader on a specific tile.
- **Article links live**: healthcare-gap links "respiratory therapy" to `?role=rrt` and "the pipeline" to `?role=rn`; Rounds 03 gains a "The Nursing Ladder" footprint chip.
- **Presets**: three authored routes join the pin menu: The nursing ladder (`?role=rn`), Bedside to informatics (`?role=clin-informatics`), The exams scored (`?view=edu&emetric=pass`).
- **Share card**: "⬇ Share card" in ⋯ More renders a 1080×1080 branded card (name, tagline, role → goal, counts, the bill's years and exams, tile chips, build-yours footer). Composed from build data, always the dark brand look, exact 1080 via html2canvas scale 1. Same CDN dependency as the JPEG export.

### 4. leadsTo enrichment (flow stage 3)
Four real role edges added to career-tree.json; each resurrects a cut education road, verified by the edge repro (47 → 51 edges, no unintended fans):
- bh-tech → bcba (draws RBT → MS-ABA; the canonical ABA road)
- coder → rhit (draws CPC → AS-HIM)
- ophthalmic-tech → rad-tech (draws COT → AS-RAD; also fixes a dead-end role)
- cns → crna (draws MSN → DNAP; the ICU-native MSN road into anesthesia)

**Consciously NOT added: CRCST → AS-ST.** The AS-ST card holds only Surgical First Assistant, so drawing that road would claim SPD tech leads straight to first assist. False. The real road (SPD to surgical tech school) already exists in the role graph as sterile-proc → surg-tech; the board geometry can't draw it as a degree road without lying.

### 5. OG images
`scripts/build-og-cards.js` (new; sharp is now a devDependency) renders branded 1200×630 cards to src/brand/: og-operators-map.jpg, og-multi-lens-map.jpg, og-career-tree.jpg. Front matter wired on all three tools; base.njk already read `og_image`. These are composed brand cards, not screenshots. To swap in real screenshots later: overwrite the JPEGs, same filenames, done.

### 6. GoatCounter read (2026-07-20)
30 days: 63 visits total. Last 7: homepage 28, /learn 14, operators map 3, career tree 2, multi-lens 1. The maps only became production on 07-19, so this is mostly launch-day and self-testing noise. No Atlas verdict possible yet. Check again in 2 to 3 weeks.

## Device QA list
1. Next Steps with a goal pinned: bill shows, numbers sane, checklist rows tick and untick, ticking does NOT flip the parent step, tapping the step still moves it to Current.
2. Role panel on a pinned role: requirements tickable, tick state matches Next Steps.
3. Ticks survive reload and Save/Load codes.
4. ⋯ More → Share card downloads a 1080×1080 JPEG that looks composed on a phone build and an empty build.
5. Preset pin: all six entries; the two role presets snap the board and open the panel.
6. From healthcare-gap, tap "respiratory therapy": lands on the career board snapped to RRT with the panel open.
7. Education Matrix: behavioral lane shows RBT → MS-ABA, revenue shows CPC → AS-HIM, imaging shows COT → AS-RAD, nursing shows MSN → DNAP.
8. Share a map or career-tree URL into Slack/LinkedIn preview: the branded card shows (post-deploy only).

## Watch list
- Checklist rows on long credentials (RN has 8 Getting-in items): Next Steps gets tall. If it reads noisy, the next lever is collapsing checklists behind the progress count.
- Bill years on exotic builds (MD/DO after Doc, spec-cert-only roads) round to defensible but blunt numbers.
- Share card with 14+ pinned tiles truncates the chip strip silently at 14.
- The deep-link param stays in the URL until the first interaction. Deliberate (back button honesty), but watch for confusion.
