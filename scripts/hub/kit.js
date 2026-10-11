/**
 * kit · the blocks the hub's Library draws: every instrument, screen, skill, agent and record we
 * build the site with, and what each stage of a milestone and a window uses.
 *
 * One block per thing. `how` is what to type or say; `kind` is who decides (the tiers in
 * scripts/qa.js), `when` is where it sits in the process. The long detail behind each block is
 * docs/HU-QA-TOOLKIT.md; this file is the short face of it. tests/hub.test.js holds every npm
 * script in package.json to a block here, so a new command cannot go missing from the picture.
 *
 * It lived in src/_data/devKit.js for one day (2026-10-04), when the Process tab was a page of
 * the site. The hub is a screen on David's computer only, so the list moved out of src/ with it.
 *
 * David, 2026-10-04: "think of like a little LEGO set and all the different blocks that we use".
 */
const kit = {
  kinds: [
    { id: 'gate', label: 'The machine decides', note: 'Fails on its own. Tier 1.' },
    { id: 'ratchet', label: 'The machine measures', note: 'A number that may only go down. Tier 2.' },
    { id: 'eyes', label: 'David decides', note: 'A screen or a panel for a person. Tier 3.' },
    { id: 'maker', label: 'Makes or fetches', note: 'Builds the site or pulls data. Checks nothing.' },
    { id: 'record', label: 'Keeps the record', note: 'Where a window is written down.' },
  ],

  sets: [
    { id: 'window', label: 'A window and a milestone' },
    { id: 'view', label: 'View: phone, desktop, type, layout' },
    { id: 'writing', label: 'Writing and voice' },
    { id: 'consistency', label: 'Consistency across pages' },
    { id: 'function', label: 'Function: code, links, the relay' },
    { id: 'data', label: 'Data and the build' },
    { id: 'crew', label: 'Skills and agents' },
    { id: 'records', label: 'Records and rules' },
  ],

  blocks: [
    // ── open and close ──
    { id: 'open', set: 'window', kind: 'record', name: 'Open a window', how: 'npm run open',
      what: 'Last close note, open design phases, git state, the ledger, what is running.',
      when: ['open'], shows: 'Terminal; Claude reads it to you',
      more: 'The short card prints by itself at the start of every Claude session. The full one starts a window on the run sheet. Add --baseline to run the tests first, so the window is known to start green, and --live to ask the live site and the game relay.' },
    { id: 'close', set: 'window', kind: 'gate', name: 'Close a window', how: 'npm run close',
      what: 'Finds the pages the diff touched, runs the final checks on them, lists what is left.',
      when: ['close'], shows: 'Terminal; the Checks lines go into the commit message',
      more: 'Works out the touched pages from git, not from memory. A change to a shared file (the global stylesheet, the kit, the layout) means the whole site gets swept.' },
    { id: 'notes', set: 'window', kind: 'record', name: 'Close notes', how: 'docs/sessions/',
      what: 'One short note per window: did, left half done, next, waiting on David.',
      when: ['open', 'close'], shows: 'The run sheet, under Windows' },
    { id: 'hub', set: 'window', kind: 'eyes', name: 'The hub', how: 'npm run hub',
      what: 'The board, the run sheet, the QA list and the site blocks. On this computer only.',
      when: ['open', 'work', 'qa', 'ship'], shows: 'localhost:8081/__hub',
      more: 'One address for the screens that never ship: the hub, the review screen, and the built site. Your phone reaches it over home wifi. It shows what is true now and saves your QA marks; it runs nothing by itself.' },
    { id: 'shots', set: 'window', kind: 'record', name: 'Pictures', how: 'npm run shots',
      what: 'A phone and a desktop picture of each page named, filed under the milestone.',
      when: ['work'], shows: 'The run sheet and the QA list',
      more: 'Name the step, then the pages, after a double dash. The before picture is the same page on the live site, which is what the last push left.' },
    { id: 'da-qa', set: 'view', kind: 'gate', name: 'Puzzle sheet', how: 'npm run da:qa',
      what: 'Device Assembly: every wall opened by its link at a phone and a desk, pictured empty and built, every break checked for where it stops, and Tutorial 1 played by touch.',
      when: ['work', 'qa'], shows: 'The hub, Puzzles: localhost:8081/__hub/puzzles',
      more: 'A new wall is on the sheet by itself. The engine half, that every dealt wall solves and every break says where, runs in every verify (tests/device-assembly-puzzles.test.js).' },
    { id: 'qa-list', set: 'window', kind: 'eyes', name: 'The QA list', how: 'The hub, QA tab',
      what: 'Everything a milestone changed, each with a link and a before and after. Good, or Needs a tweak with a note.',
      when: ['qa'], shows: 'localhost:8081/__hub/qa',
      more: 'Built from git, so nothing that changed is left off. A note becomes a tweak; when it is fixed, only that item comes back.' },
    { id: 'ship', set: 'window', kind: 'gate', name: 'Ship a milestone', how: 'npm run ship',
      what: 'Checks the QA list is clear, then writes the release note and the commit message. After the push, checks the live site.',
      when: ['ship'], shows: 'Terminal; docs/releases/',
      more: 'It never commits or pushes. After the push, run it again with --live: it waits for the live site to report the pushed commit, then files the milestone under Done.' },
    { id: 'serve', set: 'window', kind: 'maker', name: 'Dev server', how: 'npm start',
      what: 'The site on this computer, rebuilt on every save.',
      when: ['open', 'work'], shows: 'localhost:8080',
      more: 'A long-running server caches the _data folder. If a data change looks ignored, a one-off build fixes it.' },

    // ── view ──
    { id: 'phone', set: 'view', kind: 'gate', name: 'Phone sweep', how: 'npm run phone',
      what: 'Reads a page top to bottom at nine screen sizes, upright and on its side.',
      when: ['work', 'close'], shows: 'Terminal; screenshots in tmp/phone/',
      more: 'Name the pages after a double dash: npm run phone -- /tools/ /learn/. Fails on console errors, sideways overflow, text under the type floor, more than one top bar, chrome over 20% of a phone, colliding labels, things floating over a control, things cut by their box, and a page that breaks while its data is slow.' },
    { id: 'qa', set: 'view', kind: 'gate', name: 'The full gate', how: 'npm run qa',
      what: 'Build, types, every test, the sweep over every page, then the two ratchets.',
      when: ['qa'], shows: 'Terminal; the run sheet keeps the result',
      more: 'Up to an hour with the sweep. It runs before David looks at a milestone, so what he sees is already machine-clean. --fast skips the build and the sweep.' },
    { id: 'review', set: 'view', kind: 'eyes', name: 'Review screen', how: 'npm run review',
      what: 'A page at desktop and phone width side by side, linked, with the Board of every page.',
      when: ['work', 'close'], shows: 'localhost:8081/__review',
      more: 't flips light and dark; the arrow keys step through every page. The Board is where your Reviewed marks are kept.' },
    { id: 'density', set: 'view', kind: 'ratchet', name: 'Density count', how: 'node scripts/density.js /page/',
      what: 'Words, controls and chrome on the first screen. Pass two pages to compare.',
      when: ['work'], shows: 'Terminal' },
    { id: 'tokens', set: 'view', kind: 'gate', name: 'Type and contrast tests', how: 'npm test',
      what: 'The type floors and every color pair in both themes, against DESIGN.md.',
      when: ['work', 'close'], shows: 'Terminal' },

    // ── writing ──
    { id: 'writing-check', set: 'writing', kind: 'gate', name: 'Writing checker', how: 'npm run writing:check',
      what: 'Patient information, professional tone and the voice rules, on a page or a draft.',
      when: ['work', 'close'], shows: 'Terminal',
      more: 'Name a page or a file after a double dash: npm run writing:check -- /rounds/some-piece/. Must fix (a patient identifier or an em dash) fails. Fix and Read again are for a person.' },
    { id: 'writing-screen', set: 'writing', kind: 'eyes', name: 'Writing screen', how: 'npm run writing',
      what: 'Paste a draft or pick a page; every finding painted on the text.',
      when: ['work'], shows: 'localhost:8084/__writing' },
    { id: 'panel', set: 'writing', kind: 'eyes', name: 'Reviewer panel', how: 'Ask: the reviewer panel on a page',
      what: 'Four readers on one text: a medical director, an administrator, a technologist, a voice editor.',
      when: ['work'], shows: 'The writing screen' },
    { id: 'voice-tests', set: 'writing', kind: 'ratchet', name: 'Voice ratchet', how: 'npm test',
      what: 'Each page\'s voice findings may only go down; no patient identifier on any page.',
      when: ['close'], shows: 'Terminal' },

    // ── consistency ──
    { id: 'ledger', set: 'consistency', kind: 'ratchet', name: 'Page ledger', how: 'npm run ledger',
      what: 'Every live page, its kind, the checks for that kind, and its phase.',
      when: ['open', 'close'], shows: 'The Site tab',
      more: 'The phase is computed, never typed. Phase 2 passes every check for its kind; Phase 1 names what holds it back.' },
    { id: 'shell-drift', set: 'consistency', kind: 'ratchet', name: 'Shell drift', how: 'npm run qa',
      what: 'How often a reading page redeclares what the shared reading layout owns.',
      when: ['close'], shows: 'Terminal' },
    { id: 'meta', set: 'consistency', kind: 'ratchet', name: 'Titles and descriptions', how: 'npm run qa',
      what: 'Missing, long or shared titles and descriptions across every page.',
      when: ['close'], shows: 'Terminal' },
    { id: 'game-shell', set: 'consistency', kind: 'gate', name: 'The game bar', how: 'npm test',
      what: 'Every game wears the one top bar and builds its menus from the kit.',
      when: ['close'], shows: 'Terminal' },
    { id: 'tool-compare', set: 'consistency', kind: 'ratchet', name: 'Tool compare', how: 'node scripts/tool-compare.js',
      what: 'The top band and the controls under it, on every tool, side by side.',
      when: ['work'], shows: 'Terminal' },

    // ── function ──
    { id: 'verify', set: 'function', kind: 'gate', name: 'Verify', how: 'npm run verify',
      what: 'Build, both type checks and every test. The gate before anything ships.',
      when: ['work', 'close'], shows: 'Terminal',
      covers: ['npm run check', 'npm run check:scripts', 'npm test', 'npm run test'] },
    { id: 'links', set: 'function', kind: 'gate', name: 'Link check', how: 'npm run links',
      what: 'Every link that leaves the site. Monthly, not in the gate.',
      when: ['monthly'], shows: 'Terminal; tmp/link-check/' },
    { id: 'relay', set: 'function', kind: 'gate', name: 'Relay round trips', how: 'npm run backend:check',
      what: 'Headless players over the live relay; every guest\'s game must match the host\'s.',
      when: ['open', 'close'], shows: 'Terminal',
      covers: ['npm run backend:check:da', 'npm run backend:check:vs'] },
    { id: 'phone-qa', set: 'function', kind: 'gate', name: 'Phone QA run', how: 'npm run qa:phone',
      what: 'A phone against a laptop through a race, a hospital table and a share card.',
      when: ['close'], shows: 'Terminal; tmp/qa/' },

    // ── data ──
    { id: 'build', set: 'data', kind: 'maker', name: 'Build', how: 'npm run build',
      what: 'Data, entities, icons, then the whole site into _site.',
      when: ['work'], shows: '_site/',
      covers: ['npm run build:data', 'npm run build:entities', 'npm run build:icons', 'npm run build:geo', 'npm run build:suppliers', 'npm run build:vital-stats'] },
    { id: 'pulls', set: 'data', kind: 'maker', name: 'Data pulls', how: 'npm run pull:all',
      what: 'Fetches from the public sources: CDC PLACES, Census, BLS, CMS, IPEDS and more.',
      when: ['monthly'], shows: 'Dry run unless --write',
      covers: ['npm run pull:places', 'npm run pull:acs', 'npm run pull:chr', 'npm run pull:bls', 'npm run pull:ooh', 'npm run pull:oews-states', 'npm run pull:hcris', 'npm run pull:ipeds', 'npm run pull:accred', 'npm run pull:saipe', 'npm run pull:sahie'] },
    { id: 'schools', set: 'data', kind: 'gate', name: 'Schools cross-check', how: 'npm run check:schools',
      what: 'The schools layer against what the accreditors list, program by program.',
      when: ['monthly'], shows: 'docs/HU-SCHOOLS-CROSSCHECK.md' },
    { id: 'datamap', set: 'data', kind: 'maker', name: 'Data map', how: 'node scripts/build-datamap.js',
      what: 'Redraws the Data map tab from the real files.',
      when: ['as needed'], shows: 'The Data map tab' },

    // ── crew ──
    { id: 'hu-voice', set: 'crew', kind: 'eyes', name: 'Voice rules', how: 'Skill: hu-voice',
      what: 'Loaded before any prose: meta tags, card blurbs, alt text, UI copy.',
      when: ['work'], shows: 'Claude' },
    { id: 'game-shell-skill', set: 'crew', kind: 'eyes', name: 'Game shell', how: 'Skill: hu-game-shell',
      what: 'The one top bar and start patterns, loaded before any game work.',
      when: ['work'], shows: 'Claude' },
    { id: 'auditor', set: 'crew', kind: 'eyes', name: 'Auditor', how: 'Agent: hu-auditor',
      what: 'A read-only audit of one page, findings ranked, nothing edited.',
      when: ['work'], shows: 'Claude' },
    { id: 'mobile', set: 'crew', kind: 'eyes', name: 'Mobile tester', how: 'Agent: hu-mobile-tester',
      what: 'Works the touch interactions at phone width and takes screenshots.',
      when: ['work'], shows: 'Claude' },
    { id: 'fixers', set: 'crew', kind: 'eyes', name: 'Fixers', how: 'Agents: hu-a11y-fixer, hu-voice-editor, hu-polish',
      what: 'Accessibility fixes, prose that reads generated, drift inside the design system.',
      when: ['work'], shows: 'Claude' },

    // ── records ──
    { id: 'claude-md', set: 'records', kind: 'record', name: 'The kernel', how: 'CLAUDE.md',
      what: 'Precedence, the change budget, open design phases, the voice. Everything first.',
      when: ['open'], shows: 'Claude reads it every session' },
    { id: 'board', set: 'records', kind: 'record', name: 'The board', how: 'npm run board',
      what: 'The sprint as cards: focus, up next, waiting on David, inbox. It prints SPRINT.md.',
      when: ['open', 'close'], shows: 'The hub, home',
      more: 'One list in one file, data-build/board.json. The board draws it and SPRINT.md is printed from it, so the two cannot disagree. Focus holds two at most; anything new waits in the Inbox until David promotes it.' },
    { id: 'decisions', set: 'records', kind: 'record', name: 'Decisions', how: 'DECISIONS.md',
      what: 'Only what is waiting on David. Three at a time, each with a recommendation.',
      when: ['open', 'close'], shows: 'The repo root' },
    { id: 'sprint', set: 'records', kind: 'record', name: 'Sprint', how: 'SPRINT.md',
      what: 'The board, printed as text for a session to read at the start.',
      when: ['open', 'close'], shows: 'The repo root' },
    { id: 'decisions-log', set: 'records', kind: 'record', name: 'Decisions log', how: 'docs/HU-DECISIONS-LOG.md',
      what: 'Every answered question, its answer, and what got built on it.',
      when: ['close'], shows: 'docs/' },
    { id: 'sprint-log', set: 'records', kind: 'record', name: 'Sprint log', how: 'docs/HU-SPRINT-LOG.md',
      what: 'Every finished step, newest first.',
      when: ['close'], shows: 'docs/' },
    { id: 'phase-log', set: 'records', kind: 'record', name: 'Design phase log', how: 'docs/HU-DESIGN-PHASE-LOG.md',
      what: 'Every design round: what shipped, when, on which ruling.',
      when: ['close'], shows: 'docs/' },
    { id: 'commit-shape', set: 'records', kind: 'record', name: 'Commit message', how: 'docs/HU-COMMIT-MESSAGES.md',
      what: 'Claude drafts it in this shape: What, Why, Checks, Goes live. David pastes and pushes.',
      when: ['close'], shows: 'GitHub Desktop' },
  ],

  // A milestone, stage by stage. `david` marks the stages his hands are on.
  milestone: [
    { id: 'Plan', david: true, text: 'The focus item gets a goal in one sentence, a done-looks-like line and its steps. David says yes, or changes it.', blocks: ['board', 'decisions'] },
    { id: 'Build', david: false, text: 'One or more windows. Each opens and closes by the routine, and every step files a phone and a desktop picture. Nobody asks David to look.', blocks: ['open', 'shots', 'close'] },
    { id: 'QA', david: true, text: 'The machine goes first, over the whole site. Then David, on his phone and at his desk: Good, or Needs a tweak with a note.', blocks: ['qa', 'qa-list', 'review'] },
    { id: 'Tweaks', david: false, text: 'His notes are the list. Claude fixes them, and only the changed items come back to him.', blocks: ['qa-list', 'shots'] },
    { id: 'Ship', david: true, text: 'The release note, the commit message, the push, and a check that the live site is on it. Then David picks what is promoted.', blocks: ['ship', 'commit-shape', 'board'] },
  ],

  // A window, step by step. `blocks` names the ids above that a step uses.
  loop: [
    { id: 'open', label: 'Open', sub: 'start of a window', steps: [
      { name: 'Read where we left off', text: 'The last close note: what got done, what was left half done, what starts now.', blocks: ['open', 'notes'] },
      { name: 'Check what is waiting', text: 'The board, the decisions waiting on David, which design phases are open.', blocks: ['board', 'decisions', 'claude-md'] },
      { name: 'Check the live pieces', text: 'The site answers on the last push, the game relay is up, no side copy is holding work back from main.', blocks: ['open', 'relay'] },
      { name: 'Bring the screens up', text: 'The hub, with the board on screen. A baseline run of the tests, so the window starts green.', blocks: ['hub', 'verify'] },
      { name: 'Agree the step', text: 'Claude says which step is next and why. David says go, or points somewhere else.', blocks: ['board'] },
    ] },
    { id: 'work', label: 'Work', sub: 'the build', steps: [
      { name: 'Name the phase', text: 'Maintenance, where the change budget rules, or a named surface in an open design phase.', blocks: ['claude-md'] },
      { name: 'Build the smallest change', text: 'Reuse the kit and the tokens before anything new.', blocks: ['serve', 'build'] },
      { name: 'Gate as we go', text: 'Tests for the code, the sweep for the page, the checker for the words.', blocks: ['verify', 'phone', 'writing-check'] },
      { name: 'File the pictures', text: 'A phone and a desktop picture of what changed, kept with the milestone. David looks when he wants to.', blocks: ['shots'] },
    ] },
    { id: 'close', label: 'Close', sub: 'end of a window', steps: [
      { name: 'Final checks', text: 'Verify, then the sweep and the writing checker on every page the diff touched.', blocks: ['close', 'verify', 'phone', 'writing-check'] },
      { name: 'Nothing stranded', text: 'No side copy holding work, nothing in the public repo that should stay out.', blocks: ['close'] },
      { name: 'Write it down', text: 'The close note. Answered questions and finished steps move to their logs, so the two lists stay short.', blocks: ['notes', 'board', 'decisions-log', 'sprint-log', 'phase-log', 'ledger'] },
      { name: 'A save point', text: 'Claude drafts the commit message. David commits; the push waits for the milestone.', blocks: ['commit-shape'] },
    ] },
  ],
};

// Lookups the templates need: a block by id (the loop's chips), and each set with its blocks.
kit.byId = Object.fromEntries(kit.blocks.map((b) => [b.id, b]));
kit.kindLabel = Object.fromEntries(kit.kinds.map((k) => [k.id, k.label]));
for (const s of kit.sets) s.blocks = kit.blocks.filter((b) => b.set === s.id);

module.exports = kit;
