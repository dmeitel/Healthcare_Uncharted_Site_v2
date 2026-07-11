# Career Tree Doctrine — what this tool is, and what it refuses to be

**Status: DIRECTION, agreed 2026-07-11.** This is the practice ideology for the Career Tree as it grows into a planning layer. The 2026-07-11 build batch (onboarding, search, line focus, snap, layer model, sideways doors) implements the first half of this. The survey and credential data implement the second half. When a feature idea shows up, test it against this document before writing code.

---

## The one-line identity

A map of every healthcare career, drawn from public data, that a person can stand in front of and find themselves.

Not a matching service. Not an advising product. Not a database with a login. A MAP. People look at maps. They orient, they trace routes, they leave. The tool succeeds when someone walks away knowing what to search next, not when it captures them.

## The grammar

Every serious career-planning tool runs the same four beats: Profile, Match, Plan, Track. We run them too, but on our terms.

**Profile** is a short intake, not an account. Three or four questions in plain language: where are you now, what pulls you, how far do you want to go. The answers configure the map. They never leave the browser.

**Match** is reality data on credentials, not odds on people. Pass rates, program length, cost bands, from NBRC, NCLEX, ARRT, PANCE and their peers. National numbers, cited in the ledger like everything else on this site. We tell you the exam is hard. We do not pretend to know YOUR odds.

**Plan** is the gap between the path you have and the path you pinned. Prerequisite chains make the Education Matrix read as sequences instead of shelves. Next Steps derives the plan. The user authors the destination; the tool fills in the road.

**Track** is the have-it and working-toward states on every pin. That is the whole tracker. No streaks, no nudges, no email.

## Principles the build already proved

1. **The ladder is edges. The doors are a rule.** Real promotions get drawn lines. Lateral mobility, the truth that anyone can move sideways into informatics, industry, administration, government, or education at any rung, is a RULE surfaced as doors in the panel. Hand-authoring lateral edges would make spaghetti, and spaghetti maps lie by being unreadable.

2. **Selection is focus.** Click a role and the board collapses to its career line, with the specialties it touches snapped adjacent. The map answers the question you just asked. Free look is one tap away for people who want the whole wall back.

3. **Onboarding is a state, not a tour.** The welcome exists only while the build is empty. Pin one thing and it is gone forever. No coach marks, no dismissal cookies, no popup asking how we are doing.

4. **Ask at the moment of adding, in spoken language.** "This role. Where does it fit your story?" beats a mode toggle the user set three views ago. Every add names its referent and asks a human question. Nobody should have to learn our container names to use our buttons.

5. **Show everything first, then filter.** New builds start in All. Current and Future are lenses on one life, not separate documents.

6. **Search is a jump, not a filter.** Type a role, land on it, line lit, panel open. The search exists so the 153-hex wall never has to be hunted by pan.

7. **One motion clock.** Layout and camera tween together, same duration, same easing. Anything that pops while something else glides reads as broken.

## What we refuse

- **Program-level data.** Match likelihoods, school-by-school pass rates, applicant statistics. That road ends at a database company with a login page. The tools that do it well already exist; we link out to them where it helps.
- **Accounts and capture.** The build lives in localStorage with save and load codes. If the tool is good, people come back on their own.
- **Predictions about a person.** We publish what the credential costs and what the exam's national pass rate is. We never compute anyone's chances. The difference between information and prophecy is the whole ethics of this thing.
- **Urgency mechanics.** No progress guilt, no completion percentages on someone's LIFE. The map waits.

## Who it is for

The respiratory therapist at the bedside wondering whether informatics is a real door. The high schooler who only knows the word "nurse." The manager deciding whether the next degree is worth it. The counselor at a career fair with one browser tab. All of them get the same map, configured by their own answers, priced in public numbers.

The founder of this site walked CRT to RRT to informatics without a map. This is the one he wishes existed.

## Build order from here

1. Commit the 2026-07-11 batch. It is the chassis.
2. Intake survey in the welcome slot. A preset generator wearing a questionnaire.
3. Credential reality data for the top ~30 credentials, through references.js.
4. Prerequisite chains in the education data.
5. Then stop and watch GoatCounter before deciding anything else.
