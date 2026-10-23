# Learn module: AI systems thinking, the plan

2026-10-21. David: "I want to start working on a module in learn that is an introductry to AI systems thinking,
something for healthcare leaders and operations staff to consider how agents can help build standard work. and its not
abouty finding the perfect flow but more like a recipe of different ingredents, this is somthing that we will expand
upon when we train AI adoption in business and informatics workflows."

His answers the same day (DECISIONS AS1 to AS3): a reader writes their own recipe; the worked example is informatics
with operations beside it; and the card, with this: "remember this is going to be our first article that goes into depth
on AI usage for the individual or like a training guide so we need to consider the layers or maybe the levels that we
have to build into this the recipe analogy works because it would sound good in like A speaking presentation but it
also helps people understand that it's not a one stop shop it's about adding different spices to workflow that you
really understand".

This is the brief for his yes. Labels: CONFIRMED (he said it), INFERRED (the site points there), ASSUMED (a default
chosen so the work can move; he can veto by reading it).

## Outcome

A healthcare leader or operations lead finishes the module able to take one routine task from their own team and write
its recipe: what an agent would need to do it to standard (CONFIRMED, AS1). It is the site's first in-depth piece on
using AI as an individual, and it doubles as a training guide, so it is built in levels a reader climbs and a trainer
can teach one at a time (CONFIRMED).

The idea the whole module turns on (CONFIRMED, his words): AI is the spices, and the dish is a workflow you already
understand. A recipe names ingredients, gives a method, and expects the cook to adjust. Nobody seasons a dish they have
never cooked. So the first level is knowing the work, before any tool, and every later level adds an ingredient to work
the reader can already do by hand. There is no one-stop shop and no perfect flow to find. The analogy also has to hold
up spoken aloud, since it will be presented (CONFIRMED).

## The levels (ASSUMED; the names and the cut may move as it is written)

1. KNOW THE DISH. The workflow you understand: its job, its steps, what done looks like, where it goes wrong. Standard
   work in one screen, linked to Process Engineering. Without this level no ingredient helps, and the module says so.
2. ONE COOK, ONE RECIPE. A person using AI on their own task: the ingredients an individual controls. The job and what
   done looks like, the context it reads, an example of good work, the check before anything is used. This is where
   most people start, and where the habit of tasting before serving is built.
3. THE KITCHEN. An agent taking steps with tools inside a team's standard work: what it may touch, who signs off, the
   record it keeps, and the ingredients that are never optional. The informatics worked example lives here.
4. THE MENU. A preview only, for the training to come: recipes shared across a department and governed like a
   formulary, linked to Leading the AI Transition. One short section that points ahead.

The recipe card follows the levels (CONFIRMED that there is a card, AS3): the reader fills in the level 1 lines first
(the task, done looks like, the steps), then level 2 (what it reads, a good example, the check), then level 3 (what it
may touch, who signs off, the record). A trainer can stop a session at any level. Nothing typed is saved or sent
anywhere; the reader can print it or copy it.

## Where it sits

- Learn, the Methods shelf, as M04 after Process Engineering (M01), Where Healthcare Data Lives (M02) and Informatics
  Work: Routing Requests (M03). INFERRED: the Methods are the site's "how the work is done" modules, and this builds on
  Process Engineering's standard work.
- It links out rather than repeating: standard work to Process Engineering, governance to Leading the AI Transition,
  value against hype to AI in Healthcare, the request queue to Request Routing.
- Working title: "AI Systems Thinking: A Recipe for Standard Work with Agents", at /learn/ai-systems-thinking/. ASSUMED;
  the title says what it is about.
- Register: Learn's textbook register (CLAUDE.md). The writing disappears, headings label, no personality added. The
  recipe is the module's one extended analogy, and the reasoning happens inside it.
- The levels are views a reader moves between (the page-with-views standard, the hu-view-switch skill), or one long
  page with the levels as numbered parts. ASSUMED: one page with numbered parts and a sticky level marker, since a
  training reads it in order; the switch is the fallback if it runs long on a phone.

## The worked example (CONFIRMED, AS2)

One full recipe from informatics work, triaging requests in a queue (no employer, no coworker, no real request), built
up level by level: the standard work as a person does it, then an individual using AI to draft the classification, then
an agent that reads the queue, drafts, and hands each one to a person to sign off. Beside each ingredient, a short
operations example (a staffing huddle packet, a prior authorization packet, a supply count), so a leader outside
informatics sees their own work.

## Out of scope

- No vendor or product recommendations, and no named employer or team.
- No build instructions for agents (code, prompts, platforms). The module stays on how to think about the work.
- David's private skills are not published or described on the site (2026-09-23 ruling).
- The training itself and the level 4 governance in depth; this is the module they build on.

## Pass conditions (required unless marked)

- Registered in src/_data/learn.js (id, num M04, category, title, desc, url, tags, status, at least one real Atlas
  tile) and in learn.readingOrder after Request Routing; the Learn index lists it.
- Built on the shared reading shell (`.hu-read` classes); page CSS only for what is unique to it (the card, the levels).
- The writing checker on the page: zero must-fix, every fix fixed or explained; no em dashes; headings label.
- Every outside claim (a statistic, a definition attributed to a body) has a source read live, with its check date.
- The phone gate clean at all nine sizes in both themes; the card works with a keyboard and at 360 wide.
- Each level has its own anchor, so a training can open the page at level 2.
- His QA on the hub: the page at phone and desktop; the levels and the card read right to a leader who has not used an
  agent; the analogy holds when read aloud.
- The card saves as a Markdown file that reads like a recipe card (replaced printing on his ask, 2026-10-21).

## Stop points

- Publishing is his push. Nothing goes outside the repo.
- If the module would name his employer, a coworker or a real request, it stops for his yes first.

## Built, first draft (2026-10-21, after his yes to the levels)

- The page: src/learn/ai-systems-thinking/index.html on the shared reading shell, about 2,060 words, reading grade about
  6.4. Each level's kicker carries its name (Level 2 · One cook, one recipe) over a heading that labels (AI on your own
  task), because the writing checker counts "One cook, one recipe" as a heading that sells and the voice ratchet holds a
  new page to zero findings. The level names stay everywhere else: the level links, the card, the worked example.
- Level 3 carries the request queue as a finished recipe card; the blank card at the end saves as a Markdown recipe file (his ask, 2026-10-21: "it should create a mark down file that is like a recipe card") or copies the same text
  alone, and nothing typed is stored or sent.
- Two outside numbers, both read live 2026-10-21 (tmp/ai-module-facts-2026-10-21.md): the AMA's 2026 physician survey
  (72% use at least one of 17 named AI uses, self-reported) and the AMA's prior authorization survey fielded December
  2025 (40 a week, 13 hours of physician and staff time, among physicians who do them; an advocacy survey).
- Registered: learn.js (M04, Method), the reading order after Request Routing, a Method 04 card on the Learn index.
- Checks: the writing checker 0 must-fix and 0 fix; the phone gate clean at nine sizes in both themes on the module and
  /learn/; npm test 763 of 763; Copy tried in the browser. Pictures filed on the hub.

## Standards review (2026-10-21, his question: "does this module follow a framework or other public standards? are we using systems thinking correctly?")

Every framework below was read live today (tmp/ai-module-frameworks-2026-10-21.md, with quotes, dates and reuse terms).

What holds:
- Standard work. The module's definition matches the public health-care one, Plsek's AHRQ PSNet perspective (2015):
  standard work "captures the current best-known way to do something." It is not cited yet.
- The improvement loop. The weekly review that edits the recipe is the IHI Model for Improvement's Plan-Do-Study-Act,
  testing a change on a small scale. Named in the text, not cited.
- Human oversight. The stop points, the named sign-off and the record line up with NIST's AI Risk Management Framework
  (GOVERN 3.2, MAP 3.5) and with the Joint Commission and CHAI guidance of September 2025 (governance, privacy, monitoring,
  education). The rule on patient information matches the Joint Commission's 2026 certification guide, which expects a
  policy that keeps PHI out of public AI tools. None of these is cited yet.
- "It fills the gaps with facts that sound right" is what NIST AI 600-1 calls confabulation; unnamed and uncited.
- The site's own rules: the writing checker at 0, 0, 0; the textbook register; both outside numbers sourced and dated;
  no doses; the phone gate clean.

What does not:
- SYSTEMS THINKING IS IN THE TITLE AND BARELY IN THE TEXT. WHO's report (Alliance HPSR, 2009) defines it as "an approach
  to problem solving that views 'problems' as part of a wider, dynamic system", and its core ideas are feedback loops,
  time delays, emergent behavior, unintended effects and leverage points. The module has one feedback loop (the weekly
  review) and clear boundaries, and nothing on how a recipe changes the system around the task: faster triage bringing
  more requests (a reinforcing loop, and the site's Jevons paradox module), people checking less once the drafts are
  usually right (automation bias, NIST AI 600-1 and AHRQ 2009), errors that surface weeks later (delays), or where a
  small change moves the most (a leverage point: the standard, before the prompt). As written it is process thinking,
  Lean standard work with a person in the loop, under a systems thinking title.
- The frameworks it already follows are not cited, which the site's sourcing rule asks for.

Two ways to fix it, his call:
- A. Make it earn the title: a section on the system around the recipe, with a loop drawing (the balancing loop of the
  check and the review, the reinforcing loop of speed and volume, automation bias, a delay, the leverage point), cited to
  WHO 2009 and CDC's free "Thinking in Systems" pages; and a short box that lines the four levels up with the public
  frameworks (IHI's PDSA, standard work as PSNet states it, NIST's AI RMF functions, the Joint Commission and CHAI
  elements), with those sources added. Recommended: it is what the title promises and what the training will need.
- B. Retitle it to what it is (AI and standard work, as a recipe) and drop systems thinking, citing the frameworks it
  already follows.

Care when citing (from the report): attribute to WHO only what WHO says (not the iceberg, not reinforcing and balancing
loops, which are CDC's and others'); NIST AI 600-1 was written under an executive order since rescinded and NIST says the
AI RMF is being revised, so cite both "as of October 2026"; the Joint Commission and CHAI guidance is voluntary.

## Retitled (2026-10-22, on AS4)

David: "Retitle it to AI and standard work as a recipe, drop systems thinking, and add the citations it is missing."
The module is now "AI and Standard Work: A Recipe for Healthcare Teams", at /learn/ai-standard-work/. This plan keeps
its first name as the record of how the module began. Each framework is named in the sentence it supports and cited in the
sources: AHRQ PSNet (standard work), IHI's Model for Improvement (the PDSA loop), NIST's AI RMF (human oversight, the
four functions), NIST AI 600-1 (confabulation), the Joint Commission and CHAI guidance (governance, monitoring,
training) and the Joint Commission's 2026 certification guide (protected health information out of public AI tools).

## Plain first (2026-10-22)

David: "the design update is good, i think the visuals could be improved, also i think we need to consider rolling back
on the metaphor a little, lets get it straight and to the point first and then we can add in metaphor and style".
The module is now "AI and Standard Work for Healthcare Teams". The recipe language is gone from the words a reader sees:
the levels are Know the workflow, AI on your own task, Agents in a team workflow and AI across a department; the section
on why a recipe fits became "Where a rule is enough" (#rules); the card at the end is the task planner and saves
ai-task-plan-<task>.md. Every fact, number and source stayed. The class names in the code (.ast-recipe, .ast-pantry,
.ast-plate) are from the recipe draft and were left alone; a later pass that brings the metaphor back can use them.

The five figures were redrawn: the two vocabularies as one table with an arrow column (one card a pair on a phone); the
keyword rules beside AI with a check, with the rule answers in one column and a review line that runs back to the
instructions; the four levels as a numbered stepper with what each adds as tags; the Monday prompt with a numbered badge
on each sentence and a key beside it (brass for the check, which a person does); the request queue as a real loop
drawing, six steps around a ring at a desk and a column with a return line on a phone.

## Three additions (2026-10-22)

David compared the module with a Word guide of his own, an operating guide for running agents on a manager's own work,
and chose "Add the top three to the module before QA: measuring whether it works (with a baseline and a small pilot),
AI as a thinking partner, and separating facts from guesses."

- Measuring whether it works (#measure, between Level 3 and Level 4): the baseline is counted at Level 1, before any tool;
  the pilot is one task, one team, a few weeks, every result checked, IHI's small-scale test; four counts in a table
  (time for the whole task, corrections at the check, errors that get through, actions without approval); the check is
  the balancing measure. Sources: IHI's How to Improve (the second question) and Establishing Measures (balancing
  measures), both read 2026-10-22.
- Using AI to think a problem through (an h3 at the end of Level 2): the assistant used before anything is made, with an
  example prompt that asks for assumptions and the case against the plan. NIST AI 600-1's human-AI configuration risk
  names over-reliance (read in the PDF's own text 2026-10-22; "automation bias" could not be read there, so it is not cited).
- Facts apart from guesses (Level 2, the fifth part): a paragraph, line 6 of the numbered prompt and its key, the worked
  plan, the levels figure, and a planner part (`facts`). The planner's workflow section gains the baseline (`ast-now`).

Left out of the guide on purpose: the Microsoft tool picker (one vendor, dates fast), the daily routine (personal
productivity, the wrong register for Learn), the named agent team (a later module). Nothing was copied from its wording.
