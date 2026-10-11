#!/usr/bin/env node
'use strict';
/**
 * ship.js · the last stage of a milestone.
 *
 *   npm run ship               is it ready? Then the release note and the commit message.
 *   npm run ship -- --live     after David's push: wait for the live site to report that commit,
 *                              then file the milestone under Done
 *   --card <id>                a card other than the one in focus
 *   --force                    write the release note with QA items still open (it says so)
 *
 * WHY. David, 2026-10-04, on the order of a milestone: "building out development then doing a
 * real QA... and then the reiterations and then the ending push notes close workflow". A close
 * saves a window; this is the other ending, the one that puts work in front of visitors. It will
 * not write a release note while his QA list has anything open or the full machine gate has not
 * passed, because those two are what "ready" means (docs/HU-ADMIN-HUB-PLAN-2026-10-04.md).
 *
 * IT NEVER COMMITS OR PUSHES. David does both. The first run hands him the words; the second,
 * after he says "pushed", checks that the live site is really on that commit. The site says which
 * commit it was built from at /version.txt (src/version.njk, from Netlify's COMMIT_REF), so the
 * check is a comparison and not a guess.
 */
const fs = require('fs');
const path = require('path');
const board = require('./hub/board');
const qa = require('./hub/qa');
const run = require('./hub/run');
const devlog = require('./hub/devlog');
const { ROOT, git, today, touchedPages } = require('./lib/session');
const oldPages = require('./lib/old-pages');

const args = process.argv.slice(2);
const LIVE = args.includes('--live');
const FORCE = args.includes('--force');
const ci = args.indexOf('--card');
const RELEASES = path.join(ROOT, 'docs', 'releases');
const SPRINT_LOG = path.join(ROOT, 'docs', 'HU-SPRINT-LOG.md');
const SITE = 'https://healthcareuncharted.com';

const plain = (/** @type {string} */ s) => s.replace(/\*\*/g, '');
const wait = (/** @type {number} */ ms) => new Promise((r) => setTimeout(r, ms));

/** The close notes written since the last push: their "Did" lines are what shipped. */
function unpushed() { return devlog.sessions().filter((n) => !n.pushed).reverse(); }

/** @param {import('./hub/board').Card} card */
function prepare(card) {
  const list = qa.items(card);
  const c = qa.counts(list);
  const gate = run.read().gate;
  const day = today();
  console.log(`SHIP · ${card.title} · ${day}\n`);

  let ready = true;
  console.log('IS IT READY');
  if (c.clear) console.log(`  QA list: clear. ${c.total} item(s), all marked good by David.`);
  else {
    ready = false;
    console.log(`  QA list: NOT CLEAR. ${c.todo} to look at, ${c.tweak} with Claude, ${c.recheck} back for another look, ${c.good} good.`);
    for (const it of list.filter((i) => i.state !== 'good')) console.log(`    ${it.state.padEnd(8)} ${it.id}`);
  }
  if (gate && gate.ok) console.log(`  Machine gate: passed ${gate.at}, in ${gate.minutes} min.`);
  else { ready = false; console.log(`  Machine gate: ${gate ? 'FAILED ' + gate.at : 'not run for this milestone'}. Run npm run qa.`); }
  const gone = oldPages.leftPages(), lost = gone.left.filter((p) => !p.how);
  if (lost.length) { ready = false; console.log(`  Old addresses: ${lost.length} page(s) the live site has would 404 after this push: ${lost.map((p) => p.url).join(', ')}. Add a redirect in netlify.toml, or list each in data-build/gone-pages.json.`); }
  else if (gone.left.length) console.log(`  Old addresses: ${gone.left.length} page(s) leave the live site; each forwards or is let go on purpose.`);
  const w = run.read().window;
  if (w && !w.closed) console.log(`  Window ${w.id} is still open. Close it first if it changed anything (npm run close).`);
  if (!ready && !FORCE) {
    console.log('\nNOT READY. Nothing was written.');
    process.exit(1);
  }

  const notes = unpushed();
  /* WHAT SHIPPED is the milestone's agreed checks, the ones David marked Good, not the windows'
     "Did" lines: those are true the day they are written and can be undone later in the same
     milestone (the hub's first ship copied a morning's lines about four tabs the evening took
     back). A card can name its shipped work outright in `shipped`. The windows go in by title. */
  const delivered = card.shipped && card.shipped.length ? card.shipped : (card.qa || []).map((q) => q.text);
  const { pages } = touchedPages(git(['rev-parse', '--verify', '--quiet', 'origin/main']) ? 'origin/main' : undefined);
  const rounds = list.filter((i) => i.rounds > 0).length;

  fs.mkdirSync(RELEASES, { recursive: true });
  const file = path.join(RELEASES, `${day}-${card.id}.md`);
  const note = [
    '---', `date: ${day}`, `milestone: "${card.title}"`, 'commit: ""', '---', '',
    `# ${card.title}`, '',
    card.goal || '', '',
    '## What shipped', '',
    ...(delivered.length ? delivered.map((d) => '- ' + d) : ['- ' + (card.goal || card.title)]), '',
    '## QA', '',
    `- ${c.total} item(s) on David's list: ${c.good} good${c.clear ? '' : `, ${c.total - c.good} STILL OPEN (shipped with --force)`}.`,
    `- ${rounds} item(s) came back for a second look after a tweak.`,
    gate ? `- The machine went first: ${gate.ok ? 'passed' : 'FAILED'} ${gate.at}, ${gate.minutes} min. ${gate.summary}` : '- The full machine gate was not run (shipped with --force).', '',
    '## Pages this changes on the live site', '',
    ...(pages.length ? pages.map((p) => '- ' + p) : ['- none']), '',
    '## Windows since the last push', '',
    ...notes.map((n) => `- ${n.id}: ${n.title}`), '',
    'Each window\'s close note, in docs/sessions/, says what it did on the day.', '',
  ].join('\n');
  fs.writeFileSync(file, note);

  const named = card.shipTitle || card.title;
  const title = named.length <= 60 ? named : named.slice(0, 57) + '...';
  const msg = [
    'TITLE (GitHub Desktop\'s Summary box)', '', title, '', 'DESCRIPTION', '',
    'What', ...(delivered.length ? delivered.slice(0, 12).map((d) => '- ' + d) : ['- ' + (card.goal || card.title)]), '',
    'Windows since the last push', ...notes.map((n) => '- ' + n.title), '',
    'Why', `- ${card.says ? plain(card.says) : card.goal || card.title}${card.plan ? ' (' + card.plan + ')' : ''}`, '',
    'Checks',
    gate ? `- npm run qa: ${gate.ok ? 'passed' : 'FAILED'} ${gate.at}. ${gate.summary}` : '- npm run qa: not run',
    `- David's QA list: ${c.good} of ${c.total} good${rounds ? ', ' + rounds + ' after a tweak' : ''}`, '',
    'Goes live with this push', ...(pages.length ? pages.map((p) => '- ' + p) : ['- no page a visitor sees changes']), ...(card.live || []).map((l) => '- ' + l), '',
  ].join('\n');
  fs.mkdirSync(path.join(ROOT, 'tmp'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'tmp', 'commit-message.txt'), msg);

  console.log(`\nWRITTEN\n  The release note: ${path.relative(ROOT, file).split(path.sep).join('/')}\n  The commit message: tmp/commit-message.txt`);
  console.log('\nDAVID\'S PART\n  1. In GitHub Desktop, commit anything listed (the message is in tmp/commit-message.txt).\n  2. Press "Push origin".\n  3. Say "pushed". Claude then runs: npm run ship -- --live');
}

/** @param {import('./hub/board').Card} card */
async function live(card) {
  const head = git(['rev-parse', 'HEAD']);
  const short = head.slice(0, 7);
  const ahead = Number(git(['rev-list', '--count', 'origin/main..HEAD']) || 0);
  console.log(`SHIP, the live check · ${card.title}\n`);
  if (ahead) { console.log(`  ${ahead} commit(s) are saved and not pushed yet. Push first.`); process.exit(1); }
  const dirty = git(['status', '--porcelain']).split('\n').filter(Boolean).length;
  if (dirty) console.log(`  Note: ${dirty} file(s) are not committed, so they are not part of this push.`);

  process.stdout.write(`  Waiting for ${SITE} to report ${short} `);
  let on = '';
  for (let i = 0; i < 40; i++) {   // a Netlify build takes a minute or two; give it ten
    try {
      const r = await fetch(SITE + '/version.txt?t=' + Date.now(), { signal: AbortSignal.timeout(8000), headers: { 'Cache-Control': 'no-cache' } });
      on = r.ok ? (await r.text()).trim() : '';
    } catch (e) { on = ''; }
    if (on === head) break;
    process.stdout.write('.');
    await wait(15000);
  }
  console.log('');
  if (on !== head) {
    console.log(`  The live site reports "${on || 'nothing'}", not ${short}. Check the deploy on Netlify (the project WITH the hyphen), then run this again.`);
    process.exit(1);
  }
  console.log(`  The live site is on ${short}.`);

  // the record: which notes this push carried, the release note's commit, the board
  const day = today();
  for (const n of devlog.sessions().filter((x) => !x.pushed)) {
    const f = path.join(ROOT, n.file);
    const text = fs.readFileSync(f, 'utf8');
    fs.writeFileSync(f, /^pushed:.*$/m.test(text) ? text.replace(/^pushed:.*$/m, `pushed: "${short}"`) : text.replace(/^---\n/, `---\npushed: "${short}"\n`));
  }
  if (fs.existsSync(RELEASES)) {
    const mine = fs.readdirSync(RELEASES).filter((f) => f.endsWith('-' + card.id + '.md')).sort().pop();
    if (mine) {
      const f = path.join(RELEASES, mine);
      fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace(/^commit: ""$/m, `commit: "${short}"`));
    }
  }
  const b = board.load();
  const mineCard = b.cards.find((x) => x.id === card.id);
  if (mineCard) { mineCard.lane = 'done'; mineCard.stage = 'Ship'; mineCard.finished = day; for (const s of mineCard.steps || []) if (s.status !== 'done') { s.status = 'done'; s.at = day; delete s.on; } }
  // everything finished since the last push is now live: it leaves the board for the sprint log
  const shipped = b.cards.filter((x) => x.lane === 'done');
  const lines = shipped.map((x) => `- ${day} · **${x.title}** shipped on ${short}.${(x.steps || []).length ? ' Steps: ' + (x.steps || []).map((s) => `${s.n} ${plain(s.text).split(/[.:,]/)[0]}`).join('; ') + '.' : ''}`);
  if (fs.existsSync(SPRINT_LOG) && lines.length) {
    const log = fs.readFileSync(SPRINT_LOG, 'utf8').replace(/\r\n/g, '\n');
    const mark = '## Since the split\n\n';
    const at = log.indexOf(mark);
    if (at > -1) fs.writeFileSync(SPRINT_LOG, log.slice(0, at + mark.length) + lines.join('\n') + '\n' + log.slice(at + mark.length).replace(/^\(nothing yet\)\n\n?/, '\n'));
  }
  b.cards = b.cards.filter((x) => x.lane !== 'done');
  // whatever was waiting on this milestone can move now
  for (const x of b.cards) for (const s of x.steps || []) if (s.status === 'waiting' && s.on && s.on.toLowerCase() === card.title.toLowerCase()) { s.status = 'next'; delete s.on; }
  board.save(b);

  console.log(`\nSHIPPED. ${shipped.length} card(s) moved to docs/HU-SPRINT-LOG.md, and the close notes carry ${short}.`);
  const next = b.cards.filter((x) => x.lane === 'next').map((x) => x.title + (x.role ? ' (' + x.role + ')' : ''));
  console.log(next.length ? `Focus is empty. Up next: ${next.join(', ')}. David picks what is promoted, and its Plan stage starts.` : 'Focus is empty and nothing is queued.');
  console.log('These record changes are not committed; they ride with the next save.');
}

async function main() {
  const card = qa.cardFor(ci > -1 ? args[ci + 1] : undefined);
  if (LIVE) await live(card); else prepare(card);
}

main().catch((e) => { console.error(String(e && e.message || e)); process.exit(1); });
