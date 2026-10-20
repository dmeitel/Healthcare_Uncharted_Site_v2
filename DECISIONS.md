# DECISIONS

Everything waiting on David, in one place. Built 2026-09-19 because four design phases,
nineteen docs and a 20 KB CLAUDE.md had open questions scattered across all of them with
no single list.

Cut to what is open on 2026-10-04 (David: "go ahead and trim DECISIONS and SPRINT"). It had grown to
140 KB, almost all of it answers and history. Every answered question, the notes that used to lead this
list, and the full LOG of what was built on each answer are in docs/HU-DECISIONS-LOG.md. Find a row there
by its id ("N1", "T2") and a LOG entry by its capitals ("STAGE C").

---

## HOW THIS WORKS

Six rules, each written to fix a specific failure.

1. **If it is not on this list, it is not waiting on you.** One file. Claude updates it at
   the end of every session. No open question lives only inside a chat message.

2. **Every question arrives with a recommendation.** "You pick" is always a valid answer
   and means Claude takes the recommendation and moves. You never have to generate an
   option from scratch.

3. **Three questions at a time, maximum.** If there are more, they wait in the table below
   until the first three are answered.

4. **Plain names, not file paths.** A question says what a thing is before it says where it
   lives. "The cost of living tool" comes before the filename, never instead of it.

5. **Questions are about what you want, never about how to build it.** If a question needs a
   technical term to ask, it is not your question: Claude decides, says what it decided in one
   plain sentence, and you veto by looking at the result. When a question is about how something
   looks or feels, it arrives with a picture of each option at phone and desktop width, or a
   way to try it, before you are asked to choose. (2026-09-20, your words: "the agent will ask
   me questions that I cannot understand or answer... I cannot make the tiny decisions.") Your reply "not my question", on anything, means Claude decides and says what it decided.

6. **You look at milestones, never by running a command.** The pictures are still taken at every
   step, at phone and desktop width, and they are filed on the hub, not sent to you. You look at a
   milestone's QA, and when a decision about look or feel blocks the build.
   CHANGED 2026-10-04, your words: "I really don't want to do QA on anything until we have made
   major milestones." Before that this rule was "small change, then look": every task ended with
   a screenshot in the chat.

One more rule, for Claude: no question goes on this list unless the answer changes what gets
built. Taste checks are not decisions. If Claude can pick a reasonable default and be wrong
cheaply, Claude picks and says so.

Answered rows leave this file in the session they are answered. The row moves, answer and all, to the top of
the answered table in docs/HU-DECISIONS-LOG.md, and what got built on it goes at the top of that file's LOG.
This file holds only what is open. (2026-10-04)

---

## NEEDS YOU

Ranked. The top three are the live ones; the rest wait their turn by rule 3.

| # | The question | Why it matters | Claude recommends | Open since |
|---|---|---|---|---|
| R1 | **Does the broken arm piece name the places and the people?** | It decides whether the piece reads as a patient's week or as a review of named facilities. Your telling (2026-10-02) puts both EDs and the ortho clinic inside your employer's medical group, so this is your employer's care and billing, written from inside. | No clinician names. Places described by what they are and how far apart: a small community ED ten minutes away, the trauma center down the road, an ortho clinic two towns south. Whether to run it past your employer's policy on public writing first is yours. | 2026-10-02 |
| R6 | **Three things only you know, for the broken arm piece.** PARTLY ANSWERED 2026-10-04, later, in the round-3 fix session: pain medicine did go in before the transfer drive, an ambulance was offered and Dave chose the car and signed a form for it, and the operative report is in the portal (the recovery cards quote it). All BUILT on the page, with the other answers from that session (all in network, the 6 came as the block wore off, no copay at either ED or the clinic, public scheduling lines, new prescriptions from the surgeon, the PCP heard the week from Dave, the care partner is the emergency contact, pain medicine as needed on day 8). After the fourth panel, also answered and BUILT: the check-in 8 was mostly the payment; Dave was already near the yearly maximum; the health plan is the employer's own (now in the About box); a clinician showed the CT and the surgeon showed the surgery X-rays at the surgery center; no copay at the PCP either; the surgery center had Dave sign its own surgical consent (counted in the tally); the operative report's route and whether the joint held before surgery stay unknown. Still open below: a real quote, the RT detail, and whether the plate-removal cause and timing come from the operative report. (1) ANSWERED 2026-10-04, David: "the pain hit 10 before sedation, not during". BUILT: the page says "peaked in the first ED at a 10, before the first sedation", and the first-sedation card reads "Going in, before the sedation" under its meter. (2) Optional, from memory, whenever: what the ED physician said when surgery was ruled out for the night, or what the surgeon said about the plate (a real quote); what you noticed as an RT while respiratory therapy watched your airway under ketamine; and why anxiety went from 3 on Monday to 8 at surgery check-in. The second panel (2026-10-04) asked for all three; each would be one sentence. If the chart shows them: who gave the etomidate, whether pain medicine went in before the transfer drive, and whether the splint comes off at Thursday's visit. Two more from the third panel (2026-10-04), both quick: is the surgery center's operative report in your patient portal now (it decides whether that record crossed back to the health system, a solid step or a "not yet"); and does "removed because they cause irritation, usually around a year out" come from the surgeon's note (if not, the card should say "a year or more out, once the bone has healed"). (3) ANSWERED 2026-10-04, David: "the surgery x-rays were photos I took of the screen". BUILT: the caption now ends "photographed from a screen", matching the ED X-ray caption. | The 2026-10-04 reviewer panel raised all three; the rest of its fixes were BUILT the same day. A 10 during sedation reads to an ED physician as sedation that failed, in your own system. | Answer (1) before your manager reads it. (2) and (3) whenever. | 2026-10-04 |
| T1 | **Should the cost of living tool become the standard for every tool?** That means closing its design phase and writing its ten rules into DESIGN.md: answer first, explanations behind an "i", one fold, views, plain words, a source and date on every number, links that restore, the chart rules, little chrome, the phone as the shorter side. | You asked to take its lessons to the other tools. Until the rules are written down, nothing holds a tool to them and each rebuild argues from scratch. The full list with every tool measured against it is docs/HU-TOOL-REVIEW-2026-09-23.md. | Yes. What is left on the tool (about 546 words to sort) becomes ordinary maintenance under the written rules. | 2026-09-23 |
| T3 | **Which tool gets the cost of living treatment next?** Naming it opens its design phase. | Every tool not named stays under the change budget, so defects get fixed but nothing is redesigned. | The Vendor Directory (70 screens tall on a phone, the list starts below the first screen), then the Career Tree. | 2026-09-23 |
| G1 | **Uncharted Regional's staff strain never builds. Make it real?** | A playtest ran 28,571 quarters: strain peaked at 7 and no nurse ever quit, because it recovers 12 a quarter and can rise at most 9. So the strain warning never shows and the $45k a quarter Float Pool buys nothing. | Yes: strain recovers a little slower than the fastest it can build, so a hospital run flat out for a few quarters starts losing nurses and the Float Pool earns its price. | 2026-09-23 |
| DH12 | WAITING (rule 3). **Daily Huddle repeats its questions. Teach the daily to remember?** A check dealt all 365 boards from Oct 20 to next Oct 19 (2026-10-19): every one deals 19 tiles and can be crossed, but the dealer draws each day fresh, so a daily player meets a question from an earlier board on about 2 tiles a board in October, 10 by December and 14 by March. The thinnest zones run out of new questions first (Policy after about 63 days, Patient 67, Health Tech 71), the 16 normal ranges turn up on 315 of the 365 boards, and 968 questions have no explanation line on the answer card. | It decides whether the daily feels new after the first month, which is when a daily game keeps or loses its players. | After launch: the daily remembers what it dealt and keeps a question away for 60 days where its zone has enough, starting on a board nobody has played yet (the boards already dealt stay as they were); the normals capped at a few a month; the next questions written for Policy, Patient and Health Tech first, with an explanation line on each. | 2026-10-19 |
| LK1 | WAITING (rule 3). **Four small look calls, held on your word until your review (2026-10-16).** (a) Headwall's slim parts row cuts long names (the cannulas, the oxygen tubing lengths, the vent cart types). (b) Headwall's top line reads "Ventilators 3 · Ventilator 2": the wall's place on its path beside the wall's own number. (c) Daily Huddle's Make a board still starts its clock at 3 minutes, though today's board has no limit since DH11. (d) On a phone the 4Ps "Same record, four lenses" table scrolls sideways instead of stacking. | Each is a small change you would see on every visit to that screen; none blocks the 1.0 push. | (a) a short tag on each tile for its length or type (7 ft, Low), so the name can stay short; (b) drop the path's number from that line, "Ventilators · Ventilator 2" (the result card already says where on the path the wall sits); (c) No limit as Make a board's default, the clock kept as a pick; (d) stack the table as cards on a phone, as the fracture post's tables do. Pictures of each at phone and desk come with the question when you pick it up. | 2026-10-16 |
| 16 | WAITING (rule 3). **The rest of the clinical flags in the game review.** Alarm Fatigue's and three of Device Assembly's are ANSWERED (log, 2026-09-23). Left: Level 3's dry-gas line (Level 3 was rebuilt without it 2026-09-23, keeping the game's own dry side; log), the capnography connector and Level 2's title in Device Assembly; ED flow in ER Charge; the payer spread in both hospital games. Section 4 of docs/HU-GAME-REVIEW-2026-09-23.md. | They are RT and clinical calls a reviewer cannot make, and a respiratory audience will screenshot any that are wrong. | The dry-gas line first: the one piece of Level 3 still the game's guess. The payer spread is verified: RAND puts private plans at 254 percent of Medicare in 2022; the games use about 120. | 2026-09-23 |
| 17 | DEVICE ASSEMBLY CHOSEN 2026-10-03 by David, his own list (ventilators and filters, rehab and home, a daily and random puzzle): docs/HU-DEVICE-ASSEMBLY-EXPANSION-2026-10-03.md, order in N1. The rest still WAITING (rule 3). **The other four expansions.** Alarm Fatigue's is ANSWERED and BUILT 2026-09-24 (real or nuisance; play it before the push, log). Left: Device Assembly, the order changes mid-shift; Uncharted General, payer contract offers; ER Charge, triage at the door plus EMS calling ahead; Regional, a board that forgives one miss. docs/HU-GAME-EXPANSION-2026-09-23.md, with two alternatives for each. | An expansion changes a game's rules, so choosing one opens that game's design phase. | Yes to all four, each after that game's fixes. ER Charge waits until you choose to open it. | 2026-09-23 |

### Yours to do, no decision needed

- **Delete two old Netlify projects, BEFORE THE LAUNCH.** Answered 2026-09-23 (row 10, "Delete the project and Verdant
  Thing"), still not done on 2026-10-11. On app.netlify.com, open `healthcareuncharted` (a09e2c0f) and
  `verdant-treacle-8c70aa` (9fdd2a68); for each, Project configuration, Danger zone, Delete project. Delete ONLY those
  two: the one WITH the hyphen, `healthcare-uncharted`, is the live site. Why it is urgent now (research, 2026-10-11):
  the account is on Netlify's credit plan, 1,000 credits a month and 15 per production deploy, and at zero credits every
  site on the account pauses and forms are refused. `healthcareuncharted` still deploys on every push (17 seconds before
  production on 2026-10-11), so each push costs double. While you are there: look at this month's balance under Usage
  and Billing, and consider turning on auto-recharge for October and November. The Ideas tab has the full report
  ("Make sure a busy launch month cannot pause the site").
- **Answer the Ideas tab on the hub.** 143 ideas from a night of research, each with its report; Yes, Maybe or No and
  a note, like the puzzle sheet. Start with "Start here": 1 to 13 are the before-launch list. /__hub/ideas.
- **The cost of living tool's warnings, one ruling each.** On 2026-10-03 their explanations moved behind an "i"
  and the warnings themselves were left for you to rule on one at a time. Claude lays the list out again, with a
  picture of each, when you want to do it.

---

## PARKED ON PURPOSE

Not debt. You stopped these deliberately and they stay stopped until you say otherwise.
Listed so they stop reading like unfinished work.

- **The Learn and Rounds reading surface.** Parked 2026-08-24, your words: "complete
  rewrites and tooling in the future." Two rounds shipped and stand.
- **Where the AI skills live long term.** Deferred 2026-09-18, your words: "put them on the
  site for now, we can decide storage/growth at a later date."
- **Surveys and the backend.** Parked.
- **The hospital price finder.** Parked, living in the secret menu.
- **The Atlas phone browse flow.** Closed and reverted 2026-08-23 on your ruling. The hex
  grid is identity, pinch and zoom is the phone answer. Not reopening.

---

## CLAUDE HANDLES THESE

No decision needed. Listed so you can veto any of them.

- **How the new look behaves** (BR1 to BR3 answered 2026-10-11, the phase closed 2026-10-12 on BR4; DESIGN.md Tier 3 is the rule now). In day mode the readouts stay dark glass and the inputs go light (your first review), except the Data Observatory band and the Traffic tiles, which go light on your 2026-10-11 note; the compass rose and its dial follow the mode. The fonts stay. The two maps themselves are untouched; their panels and buttons take the keys. The games' play screens keep their own look and their top bar takes the new one. The rollout runs as milestones with your QA at each, and DESIGN.md is rewritten to describe what shipped. The open design phases (the merged band, the map menus, the view switch, the cost of living tool, the games' reading load) keep their own work; their look rides on the shared pieces.
- **The bottom of Device Assembly's phone screen goes to direction A** (one line of order, one slim row of parts,
  Undo beside Complete), not B (parts behind a button): on an iPhone 15 both give the wall the same 377 px and B costs a
  tap for every part. Picture: tmp/hub/mocks/phone-touch/compare.png. Built only on P1. (2026-10-12; it replaces the
  old "Device Assembly round 2 part 2" row, a phone magnifier among other polish: the phone play plan does a
  magnifier's job without one.)
- **Vendor Directory QA.** Claude runs the auditor and brings you failures only.
- **The attending tier and the seven-role voice pass** on the career matrix. Claude drafts,
  you edit.
- **Article 06 on FHIR.** Drafted when you want it, not before.
- **HSTS preload.** Staying off. It is a one-way door with a slow exit and the site does not
  need it.

---
