/**
 * The hub (2026-10-04): the board, the run sheet, the QA list, and the open and close routines
 * that feed them. Plan: docs/HU-ADMIN-HUB-PLAN-2026-10-04.md.
 *
 * The hub is a screen on David's computer that never ships, so nothing here is about how a page
 * of the site looks. It is about the promises the hub makes: the board and SPRINT.md are one list,
 * focus holds two at most, a QA mark survives, a tweak comes back only when it is fixed, the
 * picture of the toolkit names every command, and nothing of the hub is in the site's source.
 */
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const kit = require('../scripts/hub/kit.js');
const board = require('../scripts/hub/board.js');
const qa = require('../scripts/hub/qa.js');
const run = require('../scripts/hub/run.js');
const devlog = require('../scripts/hub/devlog.js');
const session = require('../scripts/lib/session.js');

const BUILT = fs.existsSync(path.join(ROOT, '_site', 'secret-menu', 'data-observatory', 'index.html'));
const tmp = (/** @type {string} */ name) => path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'hu-hub-')), name);

/* ── the picture of the toolkit ─────────────────────────────────────────── */

test('every npm script has a block in the Library', () => {
  const scripts = Object.keys(require('../package.json').scripts);
  const named = new Set();
  for (const b of kit.blocks) {
    for (const s of [b.how, ...(b.covers || [])]) {
      for (const m of String(s).matchAll(/npm (?:run )?([\w:-]+)/g)) named.add(m[1]);
    }
  }
  const missing = scripts.filter((s) => !named.has(s));
  assert.deepEqual(missing, [], 'add a block (or a covers entry) in scripts/hub/kit.js for: ' + missing.join(', '));
});

test('every block is whole, and every stage and step names real blocks', () => {
  const kinds = new Set(kit.kinds.map((k) => k.id));
  const sets = new Set(kit.sets.map((s) => s.id));
  const ids = new Set();
  for (const b of kit.blocks) {
    assert.ok(!ids.has(b.id), 'duplicate block id ' + b.id);
    ids.add(b.id);
    assert.ok(kinds.has(b.kind), b.id + ': unknown kind ' + b.kind);
    assert.ok(sets.has(b.set), b.id + ': unknown set ' + b.set);
    for (const k of ['name', 'how', 'what']) assert.ok(b[k] && String(b[k]).trim(), b.id + ' has no ' + k);
    assert.ok(Array.isArray(b.when) && b.when.length, b.id + ' says nothing about when it is used');
  }
  for (const stage of kit.loop) for (const step of stage.steps) for (const id of step.blocks) assert.ok(kit.byId[id], `${stage.id} / ${step.name} names a block that does not exist: ${id}`);
  for (const m of kit.milestone) for (const id of m.blocks) assert.ok(kit.byId[id], `${m.id} names a block that does not exist: ${id}`);
  assert.deepEqual(kit.loop.map((s) => s.id), ['open', 'work', 'close']);
  assert.deepEqual(kit.milestone.map((m) => m.id), board.STAGES, 'the Library and the board name the same five stages');
  assert.deepEqual(kit.milestone.filter((m) => m.david).map((m) => m.id), ['Plan', 'QA', 'Ship'], "David's hands are on three of the five");
});

/* ── the hub never ships ────────────────────────────────────────────────── */

test('nothing of the hub is in the site\'s source', () => {
  for (const gone of ['src/secret-menu/data-observatory/process', 'src/secret-menu/data-observatory/site', 'src/secret-menu/goat-tracker', 'src/_data/devKit.js', 'src/_data/devlog.json']) {
    assert.ok(!fs.existsSync(path.join(ROOT, gone)), gone + ' should not exist: the hub lives in scripts/hub/');
  }
  /** @param {string} dir @returns {string[]} */
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
  const hits = walk(path.join(ROOT, 'src')).filter((f) => /\.(?:njk|html|js|css|md|json)$/.test(f) && fs.statSync(f).size < 2e6).filter((f) => fs.readFileSync(f, 'utf8').includes('/__hub'));
  assert.deepEqual(hits.map((f) => path.relative(ROOT, f)), [], 'the site must not link to the hub; the way back is the marker the hub\'s own server fills in');
  const tabs = fs.readFileSync(path.join(ROOT, 'src/_includes/components/obs-tabs.njk'), 'utf8');
  assert.ok(tabs.includes("id: 'data'") && tabs.includes("id: 'traffic'"), 'the site keeps Data map and Traffic');
  assert.ok(!/id: '(?:process|site)'/.test(tabs), 'Process and Site are not tabs on the site');
  assert.ok(tabs.includes('<!--hub-link-->'), 'the marker the hub\'s server swaps for the way back');
});

test('built, each of the two tabs marks exactly itself as the current page', { skip: !BUILT }, () => {
  const urls = { data: '/secret-menu/data-observatory/', traffic: '/secret-menu/data-observatory/traffic/' };
  for (const [id, url] of Object.entries(urls)) {
    const html = fs.readFileSync(path.join(ROOT, '_site', url, 'index.html'), 'utf8');
    const nav = (html.match(/<nav class="obs-tabs"[\s\S]*?<\/nav>/) || [''])[0];
    const links = [...nav.matchAll(/<a [^>]*>/g)];
    assert.equal(links.length, 2, id + ': two tabs');
    const current = links.filter((m) => m[0].includes('aria-current="page"'));
    assert.equal(current.length, 1, id + ': one tab marked current');
    assert.ok(current[0][0].includes(`href="${url}"`), id + ': the current tab is this page');
    assert.equal((html.match(/<h1\b/g) || []).length, 1, id + ': one h1');
  }
});

test('the old Goat Tracker address moves to the Traffic tab', () => {
  const toml = fs.readFileSync(path.join(ROOT, 'netlify.toml'), 'utf8');
  assert.match(toml, /from = "\/secret-menu\/goat-tracker\/\*"\s+to = "\/secret-menu\/data-observatory\/traffic\/"\s+status = 301/);
});

test('the site says which commit it was built from', () => {
  const tpl = fs.readFileSync(path.join(ROOT, 'src/version.njk'), 'utf8');
  assert.match(tpl, /permalink: \/version\.txt/);
  assert.match(fs.readFileSync(path.join(ROOT, 'src/_data/build.js'), 'utf8'), /COMMIT_REF/, 'the ship step compares the live site against this');
});

/* ── locks, notes, phases ───────────────────────────────────────────────── */

test('every lock names a live page and a real date', () => {
  // DECISIONS O1 and O2 (2026-10-04). A lock on a mistyped address would lock nothing and say nothing.
  const locks = JSON.parse(fs.readFileSync(path.join(ROOT, 'data-build/page-locks.json'), 'utf8'));
  const urls = Object.keys(locks).filter((k) => /^\/(?!\/)/.test(k));   // '//' is the file's comment
  assert.ok(urls.length >= 7, 'the first seven locks are in place');
  for (const u of urls) {
    const dir = path.join(ROOT, 'src', u);
    const src = ['index.html', 'index.njk', 'index.md'].map((f) => path.join(dir, f)).find((f) => fs.existsSync(f));
    assert.ok(src, u + ' is not a page in src/');
    assert.equal(session.urlOf(path.relative(ROOT, src).split(path.sep).join('/')), u, u + ' builds to that address');
    assert.match(locks[u].since, /^\d{4}-\d{2}-\d{2}$/, u + ' has a date');
    assert.ok(!Number.isNaN(Date.parse(locks[u].since)), u + ' has a real date');
  }
});

test('a close note in the README shape parses into its lists', () => {
  const file = tmp('2026-10-04.md');
  fs.writeFileSync(file, [
    '---', 'date: 2026-10-04', 'title: "A window"', 'pushed: ""', '---', '',
    '## Did', '- one thing', '- another thing', '  that wraps', '',
    '## Left half done', '- a half', '', '## Next', '- first', '- second', '',
    '## Waiting on David', '- a question', '', '## Checks', '- npm run verify: green', '',
  ].join('\n'));
  const n = devlog.parseNote(file);
  assert.equal(n.date, '2026-10-04');
  assert.equal(n.id, '2026-10-04');
  assert.equal(n.title, 'A window');
  assert.deepEqual(n.did, ['one thing', 'another thing that wraps']);
  assert.deepEqual(n.left, ['a half']);
  assert.deepEqual(n.next, ['first', 'second']);
  assert.deepEqual(n.waiting, ['a question']);
  assert.deepEqual(n.checks, ['npm run verify: green']);
});

test('a later window the same day reads as the newest, and the next note takes the next letter', () => {
  // the open card reads sessions()[0]; YYYY-MM-DD-b.md must beat YYYY-MM-DD.md
  const files = devlog.sessions().map((n) => path.basename(n.file));
  const day = (/** @type {string} */ f) => f.slice(0, 10);
  const letter = (/** @type {string} */ f) => (f.match(/^\d{4}-\d{2}-\d{2}-([a-z])\.md$/) || [, 'a'])[1];
  for (let i = 1; i < files.length; i++) {
    if (day(files[i]) === day(files[i - 1])) assert.ok(letter(files[i - 1]) > letter(files[i]), `${files[i - 1]} is listed as newer than ${files[i]}`);
    else assert.ok(day(files[i - 1]) > day(files[i]), 'newest day first');
  }
  assert.equal(devlog.nextNoteId('1999-01-01'), '1999-01-01', 'a day with no note starts plain');
  if (files.length) {
    const newest = files[0];
    const next = devlog.nextNoteId(day(newest));
    assert.equal(next, day(newest) + '-' + String.fromCharCode(letter(newest).charCodeAt(0) + 1));
  }
});

test('the design phases read out of CLAUDE.md', () => {
  const ps = devlog.phases();
  assert.ok(ps.length >= 1, 'CLAUDE.md OPEN PHASES has entries');
  for (const p of ps) {
    assert.ok(p.name && !p.name.includes('**'), 'a clean name: ' + p.name);
    assert.ok(['open', 'parked'].includes(p.state));
  }
  // the latest word wins: a phase parked and then reopened reads open (the game-feel phase, 2026-10-04)
  const feel = ps.find((p) => /game feel/.test(p.name));
  if (feel && /REOPENED/.test(require('fs').readFileSync(path.join(ROOT, 'CLAUDE.md'), 'utf8'))) assert.equal(feel.state, 'open');
});

test('one clock: a date and a time in Mountain time', () => {
  assert.match(session.today(), /^\d{4}-\d{2}-\d{2}$/);
  assert.match(session.stamp(), /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
  // 02:30 UTC on the 5th is still the evening of the 4th in Utah: the slip of 2026-10-04
  assert.equal(session.today(new Date('2026-10-05T02:30:00Z')), '2026-10-04');
  assert.equal(session.stamp(new Date('2026-10-05T02:30:00Z')), '2026-10-04 20:30');
});

test('changed files map to the right area and the right page', () => {
  assert.equal(devlog.areaOfPath('src/tools/cost-of-living/index.njk'), 'tools');
  assert.equal(devlog.areaOfPath('src/secret-menu/data-observatory/index.njk'), 'admin');
  assert.equal(devlog.areaOfPath('src/secret-menu/device-assembly/index.html'), 'secret');
  assert.equal(devlog.areaOfPath('src/assets/data/derived/datamap.json'), 'data');
  assert.equal(devlog.areaOfPath('scripts/qa.js'), 'platform');
  assert.equal(devlog.areaOfPath('DECISIONS.md'), 'records');
  assert.equal(session.urlOf('src/tools/cost-of-living/index.njk'), '/tools/cost-of-living/');
  assert.equal(session.urlOf('src/assets/css/hu-global.css'), null);
  assert.equal(session.urlOf('src/sitemap.njk'), null, 'a feed is not a page');
  assert.equal(session.urlOf('src/version.njk'), null, 'the version stamp is not a page');
  assert.equal(session.pageBeside('src/secret-menu/data-observatory/traffic/anything.js'), '/secret-menu/data-observatory/traffic/', 'a file beside a page belongs to that page');
  assert.ok(session.SHARED.test('src/assets/css/hu-global.css'));
  assert.ok(session.SHARED.test('src/_includes/base.njk'));
  assert.ok(!session.SHARED.test('src/_includes/components/obs-tabs.njk'), 'the Observatory\'s own parts are not site-wide');
  const t = session.touchedPages();
  assert.ok(Array.isArray(t.pages) && Array.isArray(t.shared) && Array.isArray(t.changed));
});

/* ── the board ──────────────────────────────────────────────────────────── */

test('the board is sound, and SPRINT.md is printed from it', () => {
  const b = board.load();
  assert.deepEqual(board.problems(b), []);
  assert.ok(board.inStep(b), 'SPRINT.md is out of step with data-build/board.json: run `npm run board`');
  const text = fs.readFileSync(path.join(ROOT, 'SPRINT.md'), 'utf8');
  assert.ok(text.includes(board.START) && text.includes(board.END), 'SPRINT.md keeps the two markers');
});

test('the board holds its rules: two in focus, one primary, a waiting step says on what', () => {
  /** @returns {import('../scripts/hub/board.js').Board} */
  const make = () => ({
    cards: [
      { id: 'a', title: 'A', lane: 'focus', role: 'primary', stage: 'Build', steps: [{ n: 1, text: 'Do it', who: 'Claude', status: 'next' }] },
      { id: 'b', title: 'B', lane: 'focus', role: 'secondary', stage: 'Plan', steps: [{ n: 2, text: 'Say yes', who: 'David', status: 'next' }, { n: 3, text: 'Later', who: 'David', status: 'waiting', on: 'step 2' }] },
      { id: 'c', title: 'C', lane: 'inbox' },
    ],
    asks: [{ n: 4, text: 'A small ask', status: 'open' }],
  });
  assert.deepEqual(board.problems(make()), []);

  const three = make();
  three.cards[2].lane = 'focus'; three.cards[2].stage = 'Plan';
  assert.ok(board.problems(three).some((p) => /two at most/.test(p)), 'a third card in focus is refused');

  const twoPrimary = make();
  twoPrimary.cards[1].role = 'primary';
  assert.ok(board.problems(twoPrimary).some((p) => /only one primary/.test(p)));

  const vague = make();
  delete vague.cards[1].steps[1].on;
  assert.ok(board.problems(vague).some((p) => /waiting, on what/.test(p)));

  const b = make();
  assert.deepEqual(board.waiting(b).map((w) => w.n), [2, 4], "David's unblocked step and the small ask; the blocked step is not his move yet");

  const id = board.addInbox(b, '  A new   idea ', 'One line');
  const card = b.cards.find((c) => c.id === id);
  assert.equal(card.lane, 'inbox', 'a new idea goes to the Inbox and nowhere else');
  assert.equal(card.title, 'A new idea');
  assert.throws(() => board.addInbox(b, '   '), /needs a name/);
  assert.equal(board.promote(b, id).lane, 'next', 'promoting moves it to Up next, not into focus');
  assert.throws(() => board.promote(b, 'a'), /not in the Inbox/);

  const out = board.print(b);
  for (const part of ['### Focus · primary · A · stage: Build', '### Focus · secondary · B · stage: Plan', '### Up next · A new idea', '### Waiting on David, small', '### Inbox']) assert.ok(out.includes(part), 'the print has: ' + part);
  assert.ok(out.includes('| 3 | Later | David |  | WAITING on step 2 |'));
});

test('the board reads the open questions out of DECISIONS.md', () => {
  const d = board.decisions();
  assert.ok(Array.isArray(d));
  for (const x of d) { assert.ok(x.id && x.text, 'each has an id and its question'); assert.ok(!x.text.includes('**')); }
});

/* ── the QA list ────────────────────────────────────────────────────────── */

test('a QA item goes: to look at, needs a tweak, back for another look, good', () => {
  const dir = path.dirname(tmp('x'));
  /** @type {import('../scripts/hub/board.js').Card} */
  const card = { id: 'test-card', title: 'Test', lane: 'focus', stage: 'QA', qa: [{ id: 'one', text: 'The first thing', link: '/__hub' }, { id: 'two', text: 'The second thing' }] };
  const list = () => qa.items(card, { dir, pages: ['/tools/'] });

  assert.deepEqual(list().map((i) => i.id), ['check:one', 'check:two', 'page:/tools/'], 'the written checks, then the pages that changed');
  assert.deepEqual(qa.counts(list()), { total: 3, todo: 3, good: 0, tweak: 0, recheck: 0, clear: false });

  assert.throws(() => qa.mark('test-card', 'check:one', 'tweak', '  ', dir), /Say what to change/, 'a tweak needs its note');
  assert.throws(() => qa.mark('test-card', 'check:one', 'maybe', '', dir), /good or tweak/);
  assert.throws(() => qa.mark('test-card', '../escape', 'good', '', dir), /No such item/);

  qa.mark('test-card', 'check:one', 'tweak', 'The title is cut off on my phone.', dir);
  qa.mark('test-card', 'check:two', 'good', '', dir);
  let l = list();
  assert.equal(l[0].state, 'tweak');
  assert.equal(l[0].note, 'The title is cut off on my phone.');
  assert.equal(l[1].state, 'good');

  assert.throws(() => qa.fixed('test-card', 'check:two', 'x', dir), /no open tweak/);
  assert.throws(() => qa.fixed('test-card', 'check:one', '', dir), /Say what changed/);
  qa.fixed('test-card', 'check:one', 'The title wraps to two lines now.', dir);
  l = list();
  assert.equal(l[0].state, 'recheck', 'fixed, so it goes back to David');
  assert.equal(l[0].fix, 'The title wraps to two lines now.');
  assert.equal(l[0].note, 'The title is cut off on my phone.', 'his note stays with it');
  assert.equal(qa.counts(l).clear, false);

  qa.mark('test-card', 'check:one', 'good', '', dir);
  qa.mark('test-card', 'page:/tools/', 'good', '', dir);
  l = list();
  assert.equal(qa.counts(l).clear, true, 'every item good: the list is clear');
  assert.equal(l[0].rounds, 1, 'it remembers the item came back once');

  const saved = JSON.parse(fs.readFileSync(path.join(dir, 'test-card.json'), 'utf8'));
  assert.equal(saved.items['check:one'].history.length, 2, 'the tweak and the fix are kept as history');
});

test('a page looked at on one list counts on every list the push carries, until it changes again', () => {
  const dir = path.dirname(tmp('x'));
  /** @type {import('../scripts/hub/board.js').Card} */
  const a = { id: 'maps', title: 'Maps', lane: 'focus', stage: 'QA', qa: [] };
  /** @type {import('../scripts/hub/board.js').Card} */
  const b = { id: 'views', title: 'Views', lane: 'next', stage: 'QA', qa: [] };
  const later = Date.now() + 5 * 60000;   // the page's last change, five minutes after the mark
  const list = (/** @type {any} */ card, /** @type {Record<string, number>} */ when = {}) => qa.items(card, { dir, pages: ['/learn/x/', '/learn/y/'], when, pushed: '' });

  qa.mark('maps', 'page:/learn/x/', 'good', '', dir);
  qa.mark('maps', 'page:/learn/y/', 'tweak', 'The heading wraps.', dir);
  assert.deepEqual(list(b).map((i) => i.state), ['good', 'tweak'], 'marked on the maps list, so marked on the views list');
  assert.equal(list(b)[1].note, 'The heading wraps.');

  const stale = list(b, { '/learn/x/': later })[0];
  assert.equal(stale.state, 'todo', 'the page changed after its Good, so it is looked at again');
  assert.equal(stale.stale, true);
  assert.equal(list(a, { '/learn/x/': later })[0].state, 'todo', 'on its own list too');

  assert.deepEqual(Object.keys(qa.pageMarks(dir, '9999-01-01 00:00')), [], 'marks from before the last push belong to that push');
});

test('an idea takes Yes, Maybe or No with a note, keeps it, and a Yes goes to the Inbox once', () => {
  const ideas = require('../scripts/hub/ideas.js');
  const dir = path.dirname(tmp('x'));
  const opt = { file: path.join(dir, 'ideas.json'), marks: path.join(dir, 'marks.json'), board: path.join(dir, 'board.json') };
  fs.writeFileSync(opt.file, JSON.stringify({ sections: [{ id: 'games', title: 'New games' }], ideas: [
    { id: 'vent-game', section: 'games', title: 'A ventilator game', pitch: 'Run a vent for a shift.' },
    { id: 'retro', section: 'themes', title: 'A retro theme', pitch: 'The site as a monitor.', wild: true },
  ] }));
  fs.writeFileSync(opt.board, JSON.stringify({ cards: [], asks: [] }));

  assert.deepEqual(ideas.counts(ideas.items(opt)), { total: 2, todo: 2, yes: 0, maybe: 0, no: 0 });
  assert.throws(() => ideas.answer('nope', 'yes', '', opt), /No such idea/);
  assert.throws(() => ideas.answer('vent-game', 'sure', '', opt), /Yes, Maybe or No/);
  assert.throws(() => ideas.answer('vent-game', '', '  ', opt), /or write a note/, 'nothing to save');
  assert.throws(() => ideas.toInbox('vent-game', opt), /Say Yes/, 'only a Yes goes to the board');

  ideas.answer('vent-game', 'maybe', 'After the launch.', opt);
  ideas.answer('vent-game', '', 'After the launch, with RT faculty.', opt);
  let it = ideas.items(opt)[0];
  assert.equal(it.state, 'maybe', 'a note alone keeps the answer');
  assert.equal(it.note, 'After the launch, with RT faculty.');
  ideas.answer('retro', 'no', '', opt);
  ideas.answer('vent-game', 'yes', 'Do it.', opt);
  assert.deepEqual(ideas.counts(ideas.items(opt)), { total: 2, todo: 0, yes: 1, maybe: 0, no: 1 });

  const card = ideas.toInbox('vent-game', opt);
  assert.equal(ideas.toInbox('vent-game', opt), card, 'sent once, the same card after');
  const b = JSON.parse(fs.readFileSync(opt.board, 'utf8'));
  assert.equal(b.cards.length, 1);
  assert.equal(b.cards[0].lane, 'inbox');
  assert.ok(b.cards[0].line.includes('Do it.'), 'his note goes with it');
  assert.equal(ideas.items(opt)[0].inbox, card);
  const saved = JSON.parse(fs.readFileSync(opt.marks, 'utf8'));
  assert.equal(saved.items['idea:vent-game'].history.length, 2, 'the two earlier answers are kept');

  // Claude answers his note on the card; his answer stays his, and the reply survives his next answer
  assert.throws(() => ideas.reply('vent-game', '  ', opt), /needs words/);
  ideas.reply('vent-game', 'Planned after the launch.', opt);
  assert.equal(ideas.items(opt)[0].reply, 'Planned after the launch.');
  assert.equal(ideas.items(opt)[0].state, 'yes', 'a reply never changes his answer');
  ideas.answer('vent-game', 'maybe', 'Thinking about it.', opt);
  assert.equal(ideas.items(opt)[0].reply, 'Planned after the launch.', 'the reply survives his next answer');
  ideas.reply('retro', 'A note on an idea he said no to.', opt);
  assert.equal(ideas.items(opt)[1].state, 'no');
});

test('a picture is found by its page, the newest step last', () => {
  assert.equal(qa.slug('/__hub/run'), 'hub-run');
  assert.equal(qa.slug('/secret-menu/data-observatory/#top'), 'secret-menu-data-observatory');
  assert.equal(qa.slug('/'), 'home');
  // a game's setups differ only in the query, and each needs its own picture
  assert.notEqual(qa.slug('/secret-menu/device-assembly/?wall=day:2026-10-04'), qa.slug('/secret-menu/device-assembly/?wall=shift:ABC'));
  assert.deepEqual([...qa.SIZES], ['phone', 'landscape', 'tablet', 'desktop']);
});

test('a playtest list is its setups only, with what to try and what to look for', () => {
  const dir = path.dirname(tmp('x'));
  /** @type {import('../scripts/hub/board.js').Card} */
  const card = { id: 'play', title: 'Play', lane: 'focus', stage: 'Plan', qaPages: false, qa: [
    { id: 'a', text: 'Today\'s wall on a phone', link: '/secret-menu/device-assembly/', group: 'Phone, upright', try: 'Build it', look: 'Anything fiddly' },
  ] };
  const list = qa.items(card, { dir });
  assert.deepEqual(list.map((i) => i.id), ['check:a'], 'no pages from the diff on a playtest');
  assert.equal(list[0].group, 'Phone, upright');
  assert.equal(list[0].how, 'Build it');
  assert.equal(list[0].look, 'Anything fiddly');

  const clear = { id: 'done-card', title: 'Done', lane: 'focus', stage: 'Ship', qaPages: false, qa: [] };
  const b = { cards: [clear, card], asks: [] };
  assert.equal(qa.defaultCard(b).id, 'play', 'with two in focus, the QA tab opens the list that needs David');
});

/* ── the run sheet ──────────────────────────────────────────────────────── */

test('the run sheet remembers a window: opened, worked, closed', () => {
  const file = tmp('run.json');
  const w = run.openWindow([{ id: 'note', label: 'Read the last close note', ok: true, summary: 'ok' }], file);
  assert.match(w.id, /^\d{4}-\d{2}-\d{2}(?:-[a-z])?$/, 'a window is named for the close note it will get');
  assert.equal(w.open.length, 1);
  assert.match(w.open[0].at, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);

  run.work({ label: 'Built the board', summary: '2 pictures', shots: [{ page: '/__hub', phone: '/__hub/shots/x/01-a/hub-phone.png' }] }, file);
  run.openWindow([{ id: 'note', label: 'Read the last close note', ok: true, summary: 'again' }], file);
  let s = run.read(file);
  assert.equal(s.window.work.length, 1, 'opening again in the same window keeps the work');
  assert.equal(s.window.open[0].summary, 'again');

  run.closeWindow([{ id: 'verify', label: 'Tests', ok: false, summary: 'failed' }], { done: false }, file);
  assert.equal(run.read(file).window.closed, '', 'a failed close leaves the window open');
  run.closeWindow([{ id: 'verify', label: 'Tests', ok: true, summary: 'green' }], { done: true }, file);
  assert.match(run.read(file).window.closed, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);

  run.openWindow([], file);
  s = run.read(file);
  assert.equal(s.history.length, 1, 'the closed window moved to the history');
  assert.equal(s.window.work.length, 0, 'and a new one started');

  run.gate({ ok: true, minutes: 41, summary: 'all of it' }, file);
  assert.equal(run.read(file).gate.minutes, 41);
});

/* ── the server ─────────────────────────────────────────────────────────── */

test('the hub answers at /__hub and refuses what it should', { skip: !BUILT }, async () => {
  const { start } = require('../scripts/review.js');
  const server = await start(0, { quiet: true });
  const at = 'http://localhost:' + server.port;
  try {
    for (const [url, has] of [['/__hub', 'The board'], ['/__hub/run', 'Run sheet'], ['/__hub/qa', 'QA list|Playtest'], ['/__hub/site', 'Site blocks'], ['/__hub/library', 'Library'], ['/__hub/ideas', 'Ideas']]) {
      const r = await fetch(at + url);
      assert.equal(r.status, 200, url);
      const html = await r.text();
      // the QA tab is headed "Playtest" when the card it opens is a Plan-stage playtest
      assert.ok(has.split('|').some((h) => html.includes('<h1>' + h)), url + ' has its heading');
      assert.ok(!/\bundefined\b|\[object Object\]|\bNaN\b/.test(html.replace(/<script[\s\S]*?<\/script>/g, '')), url + ' printed a raw value');
      assert.equal((html.match(/<h1\b/g) || []).length, 1, url + ': one h1');
      assert.ok(html.includes('noindex'), url + ' asks not to be indexed, in case it is ever served by mistake');
    }
    // the QA list's folders and its folded Good (2026-10-05): a folder shows its own items, and a marked item folds
    const b = JSON.parse(fs.readFileSync(path.join(ROOT, 'data-build/board.json'), 'utf8'));
    const withQa = b.cards.find((c) => c.lane === 'focus' && (c.qa || []).length > 1 && new Set(c.qa.map((q) => q.group)).size > 1);
    if (withQa) {
      const g = withQa.qa[0].group, slug = g.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const html = await (await fetch(at + '/__hub/qa?card=' + withQa.id + '&group=' + slug)).text();
      assert.ok(html.includes('hub-folders'), 'the folders row');
      const shown = (html.match(/<li class="hub-qa-item"/g) || []).length;
      assert.equal(shown, withQa.qa.filter((q) => q.group === g).length, 'a folder holds its own items and nothing else');
      assert.equal((await fetch(at + '/__hub/qa?card=' + withQa.id + '&group=..%2F')).status, 200, 'a bad folder is ignored, not an error');
    }
    const hubList = await (await fetch(at + '/__hub/qa?card=hub')).text();
    if (/data-state="good"/.test(hubList)) assert.ok(/<details class="hub-good">/.test(hubList) && !/<details class="hub-good" open/.test(hubList), 'the Good items fold away, closed');
    assert.equal((await fetch(at + '/__hub/puzzles')).status, 200);
    assert.equal((await fetch(at + '/__hub/hub.css')).status, 200);
    assert.equal((await fetch(at + '/__hub/client.js')).status, 200);
    assert.equal((await fetch(at + '/__hub/nope')).status, 404);
    assert.equal((await fetch(at + '/__hub/shots/..%2F..%2Fpackage.json')).status, 404, 'a picture address cannot climb out of the pictures folder');

    const post = (/** @type {string} */ url, /** @type {any} */ body, /** @type {Record<string,string>} */ headers = {}) => fetch(at + url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
    assert.equal((await post('/__hub/api/inbox', { title: 'x' }, { Origin: 'https://example.com' })).status, 403, 'a page on another site cannot post here');
    assert.equal((await post('/__hub/api/inbox', { title: '   ' })).status, 400, 'an idea needs a name');
    assert.equal((await post('/__hub/api/promote', { id: 'no-such-card' })).status, 400);
    assert.equal((await post('/__hub/api/qa', { card: 'no-such-card', item: 'check:x', mark: 'good' })).status, 400);
    assert.equal((await post('/__hub/api/idea', { id: 'no-such-idea', mark: 'yes' })).status, 400, 'an answer needs a real idea');
    assert.equal((await fetch(at + '/__hub/mocks/..%2F..%2Fpackage.json')).status, 404, 'a mockup address cannot climb out of the mockups folder');
    assert.equal((await post('/__hub/api/nothing', {})).status, 404);

    const page = await (await fetch(at + '/secret-menu/data-observatory/')).text();
    assert.ok(page.includes('href="/__hub">Hub</a>'), 'served from the hub, the Data map carries the way back');
    assert.ok(!fs.readFileSync(path.join(ROOT, '_site/secret-menu/data-observatory/index.html'), 'utf8').includes('href="/__hub"'), 'and the built page itself does not');
  } finally {
    await server.close();
  }
});

test('a plan reads in the hub: headings, lists, both table shapes, everything escaped', () => {
  const pages = require('../scripts/hub/pages.js');
  const h = pages.mdDoc([
    '# Title', '### A dated subtitle', '', 'A **bold** word and `code`.', '',
    '- one', '- two <script>', '', '| | |', '|---|---|', '| Page | 527 KB |', '', '| A | B |', '|---|---|', '| 1 | 2 |',
  ].join('\n'));
  assert.match(h, /<h2>Title<\/h2>/);
  assert.match(h, /<h4>A dated subtitle<\/h4>/);
  assert.match(h, /<strong>bold<\/strong>/);
  assert.match(h, /<li>two &lt;script&gt;<\/li>/, 'escaped');
  assert.match(h, /<table><tbody><tr><td>Page<\/td>/, 'an empty header row keeps its first data row as data');
  assert.match(h, /<thead><tr><th>A<\/th><th>B<\/th><\/tr><\/thead>/);
  assert.ok(!/<script>/.test(h));
});

test('the hub\'s browser script parses', () => {
  const src = fs.readFileSync(path.join(ROOT, 'scripts/hub/client.js'), 'utf8');
  assert.doesNotThrow(() => new vm.Script(src, { filename: 'client.js' }));
});
