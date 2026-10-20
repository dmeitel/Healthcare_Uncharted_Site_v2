'use strict';
/**
 * home.js · the hub's home: what to do next, drawn from what is true right now (2026-10-18).
 *
 * WHY. David, 2026-10-18: "the board run sheet QA puzzles and ideas are all kind of static and it's hard to see when
 * things are updated or changed ... Ultimately what I need is a dashboard that shows me actual items and information
 * that I can make decisions on post review and to get us to our final checkdowns for our next pushes ... I want to see
 * the data that'll help with decision making and help grow the site". So the home answers four questions, in this
 * order, and leaves the background to the other tabs:
 *
 *   1. THE NEXT PUSH: what is left before it, whose move each step is (his QA, Claude's fixes, the full check, his save
 *      and push), each with its count and a link.
 *   2. YOUR NEXT LOOKS: one ranked list across QA, decisions, ideas, puzzles and the page review; what holds up the
 *      push first. Each row is one thing to open.
 *   3. WHAT CHANGED: the newest events across the hub's files (fixes sent back, pictures filed, saves and pushes, ideas
 *      answered, the puzzle sheet's run), each with its time; anything since his last visit is marked New (the browser
 *      remembers the visit, nothing is written here).
 *   4. THE SITE: views this week against last week and the pages people opened, read live from GoatCounter in the
 *      browser with the read-only token the Traffic tab already carries.
 *
 * Like every hub screen it only reads files; it writes nothing and runs no commands (scripts/hub/index.js).
 */
const fs = require('fs');
const path = require('path');
const { ROOT, git, stamp } = require('../lib/session');
const boardLib = require('./board');
const qaLib = require('./qa');
const ideasLib = require('./ideas');
const runLib = require('./run');
const devlog = require('./devlog');

/** a stamp the hub writes ("2026-10-18 15:09", Mountain time on this computer), or an ISO time, as ms; 0 when unknown */
const ms = (/** @type {any} */ s) => {
  if (!s) return 0;
  const t = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(s) ? Date.parse(String(s).replace(' ', 'T')) : /^\d{4}-\d{2}-\d{2}$/.test(s) ? Date.parse(s + 'T12:00') : Date.parse(s);
  return isFinite(t) ? t : 0;
};
const readJson = (/** @type {string} */ f) => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8')); } catch (e) { return null; } };

/** the open questions in DECISIONS.md with Claude's recommendation, in the file's order */
function decisions() {
  let md = '';
  try { md = fs.readFileSync(path.join(ROOT, 'DECISIONS.md'), 'utf8').replace(/\r\n/g, '\n'); } catch (e) { return { open: [], todo: [] }; }
  const a = md.indexOf('## NEEDS YOU'), z = md.indexOf('\n## ', a + 5);
  const block = a < 0 ? '' : md.slice(a, z < 0 ? undefined : z);
  const open = [];
  for (const line of block.split('\n')) {
    const m = /^\| ([A-Za-z0-9]+) \| (.*) \|\s*$/.exec(line);
    if (!m || m[1] === '#') continue;
    const cells = m[2].split(/\s\|\s/);
    const q = (cells[0].match(/\*\*(.+?)\*\*/) || [])[1] || cells[0].slice(0, 120);
    open.push({ id: m[1], q, waiting: /^WAITING/.test(cells[0]), rec: (cells[2] || '').replace(/\*\*/g, ''), since: cells[3] || '' });
  }
  const t = md.indexOf('### Yours to do'), tz = md.indexOf('\n## ', t);
  const todo = t < 0 ? [] : md.slice(t, tz < 0 ? undefined : tz).split('\n').map((l) => (l.match(/^- \*\*(.+?)\*\*/) || [])[1]).filter(Boolean);
  return { open: open.filter((d) => !d.waiting), todo };
}

/** the QA lists that count for the next push, and every item still open on them, each page once */
function qaOpen(b) {
  const lists = b.cards.filter((x) => ((x.qa || []).length || x.qaPages !== false) && (x.lane === 'focus' || (x.lane === 'next' && ['QA', 'Tweaks', 'Ship'].includes(x.stage || ''))))
    .sort((x, y) => Number(y.lane === 'focus') - Number(x.lane === 'focus'));
  const seen = new Map();
  for (const c of lists) {
    for (const it of qaLib.items(c)) {
      if (seen.has(it.id)) continue;
      seen.set(it.id, { ...it, card: c.id, cardTitle: c.title });
    }
  }
  return [...seen.values()];
}

/** the puzzle sheet: groups with walls not yet marked good */
function puzzles() {
  const rep = readJson('tmp/da-qa/report.json');
  if (!rep) return { at: '', groups: [], walls: 0 };
  const marks = qaLib.readMarks(qaLib.SHEET).items || {};
  const by = new Map();
  for (const w of rep.walls || []) {
    const m = marks['wall:' + w.id] || {};
    if (m.mark === 'good') continue;
    by.set(w.group, (by.get(w.group) || 0) + 1);
  }
  const groups = [...by.entries()].map(([g, n]) => ({ g, n, slug: g.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }));
  return { at: rep.at || '', groups, walls: (rep.walls || []).length };
}

/** the page review: live pages whose night or day mark is missing or older than the page */
function pageReview() {
  const s = devlog.site();
  if (!s) return { stale: 0, never: 0, total: 0 };
  const done = (/** @type {any} */ r) => r.night && r.day && !r.nightChanged && !r.dayChanged;
  const stale = s.rows.filter((/** @type {any} */ r) => (r.night || r.day) && !done(r)).length;
  const never = s.rows.filter((/** @type {any} */ r) => !r.night && !r.day).length;
  return { stale, never, total: s.rows.length };
}

/** a stamp as a short day, "Oct 16" @param {string} s */
const short = (s) => { const t = ms(s); return t ? new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : String(s || ''); };
/** a recommendation to its first sentences, whole, under about 200 characters @param {string} s */
const sentences = (s) => { const parts = String(s || '').match(/[^.!?]+[.!?]+(\s|$)/g) || [String(s || '')]; let out = ''; for (const p of parts) { if (out && (out + p).length > 200) break; out += p; } return out.trim(); };

/** the push: what is left, whose move each step is */
function push(open) {
  const gate = runLib.read().gate;
  const ahead = Number(git(['rev-list', '--count', 'origin/main..HEAD']) || 0);
  const dirty = git(['status', '--porcelain']).split('\n').filter(Boolean);
  // only a change to the site itself makes the full check stale: the board, the marks and the notes are the hub's own record
  const site = (/** @type {string} */ f) => /^(src\/|netlify\.toml$|\.eleventy\.js$|package\.json$)/.test(f);
  const newest = dirty.filter((l) => site(l.slice(3).trim().replace(/^"|"$/g, ''))).reduce((t, l) => { try { return Math.max(t, fs.statSync(path.join(ROOT, l.slice(3).trim().replace(/^"|"$/g, ''))).mtimeMs); } catch (e) { return t; } }, 0);
  const lastPush = git(['log', '-1', '--format=%cI', 'origin/main']);
  const look = open.filter((i) => i.state === 'todo' || i.state === 'recheck').length;
  const tweak = open.filter((i) => i.state === 'tweak').length;
  const gateFresh = !!(gate && gate.ok && ms(gate.at) >= newest);
  const steps = [
    { who: 'You', name: 'Look over the QA list', done: look === 0, count: look ? look + ' to look at' : 'clear', href: '/__hub/qa' },
    { who: 'Claude', name: 'Fix what you sent back', done: tweak === 0, count: tweak ? tweak + ' with Claude' : 'none waiting', href: '/__hub/qa' },
    { who: 'Claude', name: 'Run the full check', done: gateFresh, count: !gate ? 'not run yet' : gateFresh ? 'passed ' + short(gate.at) : gate.ok ? 'due: files changed since ' + short(gate.at) : 'FAILED ' + short(gate.at), href: '/__hub/run' },
    { who: 'You', name: 'Save (commit)', done: dirty.length === 0, count: dirty.length ? dirty.length + ' files not saved' : 'all saved', href: '' },
    { who: 'You', name: 'Push', done: ahead === 0 && dirty.length === 0, count: ahead ? ahead + (ahead === 1 ? ' save' : ' saves') + ' waiting' : dirty.length ? 'after the save' : 'nothing to push', href: '' },
  ];
  return { steps, left: steps.filter((s) => !s.done).length, lastPush, look, tweak };
}

/** his notes waiting on Claude: every Needs a tweak on a QA list or the puzzle sheet, newest first, with his words */
function withClaude(b) {
  const out = [];
  let files = [];
  try { files = fs.readdirSync(qaLib.DIR).filter((f) => f.endsWith('.json') && f !== 'ideas.json'); } catch (e) { /* none */ }
  for (const f of files) {
    const card = f.slice(0, -5), sheet = card === qaLib.SHEET;
    const c = b.cards.find((x) => x.id === card);
    if (!sheet && !c) continue;   // a list whose card has shipped has nothing open
    for (const [id, m] of Object.entries(qaLib.readMarks(card).items)) {
      if (m.mark !== 'tweak') continue;
      const qa = !sheet && c ? (c.qa || []).find((q) => 'check:' + q.id === id) : null;
      out.push({ t: ms(m.at), where: sheet ? 'Puzzles' : c.title, what: qa ? qa.text.split(':')[0] : id.replace(/^(check|page|wall):/, ''), note: m.note || '', href: sheet ? '/__hub/puzzles' : '/__hub/qa?card=' + card });
    }
  }
  return out.sort((x, y) => y.t - x.t);
}

/** the newest events across the hub's files, newest first */
function events(b) {
  const out = [];
  // fixes Claude sent back, and remarks on Good
  let files = [];
  try { files = fs.readdirSync(qaLib.DIR).filter((f) => f.endsWith('.json') && f !== 'ideas.json'); } catch (e) { /* none */ }
  for (const f of files) {
    const card = f.slice(0, -5), title = card === qaLib.SHEET ? 'Puzzles' : ((b.cards.find((c) => c.id === card) || {}).title || card);
    for (const [id, m] of Object.entries(qaLib.readMarks(card).items)) {
      if (m.mark === 'recheck' && m.fix) out.push({ t: ms(m.at), kind: 'Fixed', text: `${title}: ${id.replace(/^(check|page|wall):/, '')} is back for another look`, href: card === qaLib.SHEET ? '/__hub/puzzles' : '/__hub/qa?card=' + card });
    }
  }
  // pictures filed this window
  const run = runLib.read();
  for (const e of (run.window && run.window.work) || []) out.push({ t: ms(e.at), kind: 'Pictures', text: e.label, href: '/__hub/run' });
  if (run.window && run.window.closed) out.push({ t: ms(run.window.closed), kind: 'Closed', text: 'The window closed: ready to save', href: '/__hub/run' });
  // saves and pushes
  for (const line of git(['log', '-6', '--format=%cI%x1f%s']).split('\n').filter(Boolean)) {
    const [at, s] = line.split('\x1f');
    out.push({ t: ms(at), kind: 'Saved', text: s, href: '' });
  }
  // ideas Claude answered
  for (const it of ideasLib.items()) if (it.reply && it.replyAt) out.push({ t: ms(it.replyAt), kind: 'Idea', text: 'Claude answered your note on ' + it.title, href: '/__hub/ideas' });
  // the puzzle sheet's run
  const pz = readJson('tmp/da-qa/report.json');
  if (pz && pz.at) out.push({ t: ms(pz.at), kind: 'Puzzles', text: `The puzzle sheet ran: ${(pz.walls || []).length} walls pictured and checked`, href: '/__hub/puzzles' });
  return out.filter((e) => e.t).sort((x, y) => y.t - x.t).slice(0, 12);
}

/** the ranked list of things to open: what holds up the push first */
function queue(open, D, P, I, R) {
  const rows = [];
  // a check's name is its words up to the first colon or full stop ("Keep playing: cross today's board..." is Keep playing)
  const short = (/** @type {string} */ t) => String(t).split(/[:.]\s/)[0];
  const qaRow = (/** @type {any} */ i) => ({ kind: 'QA', text: i.kind === 'check' ? short(i.text) : i.text, why: i.state === 'recheck' ? 'fixed since your note' : i.kind === 'page' ? 'a page that changed' : i.group || 'a check', href: '/__hub/qa?card=' + i.card, t: ms(i.at) });
  for (const i of open.filter((x) => x.state === 'recheck')) rows.push(qaRow(i));
  for (const i of open.filter((x) => x.state === 'todo' && x.kind === 'check')) rows.push(qaRow(i));
  for (const i of open.filter((x) => x.state === 'todo' && x.kind === 'page')) rows.push(qaRow(i));
  for (const d of D.open.slice(0, 3)) rows.push({ kind: 'Decision', text: d.q, why: 'open since ' + d.since, href: '#decisions', t: 0 });
  const ideas = I.filter((i) => i.state === 'todo').sort((a, b) => (a.pick || 999) - (b.pick || 999));
  for (const i of ideas.slice(0, 2)) rows.push({ kind: 'Idea', text: i.title, why: i.pick ? 'number ' + i.pick + ' on the shortlist' : 'not answered', href: '/__hub/ideas' + (i.pick ? '?group=start' : ''), t: 0 });
  for (const g of P.groups) rows.push({ kind: 'Puzzles', text: `${g.g}: ${g.n} ${g.n === 1 ? 'wall' : 'walls'} to look at`, why: 'never holds up a push', href: '/__hub/puzzles?group=' + g.slug, t: 0 });
  if (R.stale) rows.push({ kind: 'Page review', text: `${R.stale} pages changed since your night and day marks`, why: 'the page-by-page review', href: '/__review', t: 0 });
  return { rows, ideasLeft: ideas.length };
}

/** @param {{port:number}} ctx */
function page(ctx) {
  const { layout, esc, icon } = require('./pages');
  const b = boardLib.load();
  const open = qaOpen(b);
  const P = push(open);
  const D = decisions();
  const Z = puzzles();
  const R = pageReview();
  const I = ideasLib.items();
  const Q = queue(open.filter((i) => i.state !== 'good'), D, Z, I, R);
  const E = events(b);
  const W = withClaude(b);
  const ago = (/** @type {number} */ t) => `<time data-t="${t}" datetime="${new Date(t).toISOString()}">${esc(new Date(t).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }))}</time>`;
  const go = (/** @type {string} */ href, /** @type {string} */ inner) => (href ? `<a href="${esc(href)}">${inner}</a>` : `<span>${inner}</span>`);

  const pushCard = `<section class="hh-card hh-push" aria-labelledby="hhPush">
  <div class="hh-head"><h2 id="hhPush">${P.left ? `The next push: ${P.left} ${P.left === 1 ? 'step' : 'steps'} left` : 'Ready to push'}</h2>
    <span class="w">${P.lastPush ? 'last push ' + ago(ms(P.lastPush)) : ''}</span></div>
  <ol class="hh-steps">${P.steps.map((s) => `<li class="${s.done ? 'is-done' : ''}">
    <span class="hh-mark">${icon(s.done ? 'circle-check' : 'circle')}<span class="obs-sr">${s.done ? 'done' : 'to do'}</span></span>
    <span class="hh-step">${go(s.href, esc(s.name))}<span class="w">${esc(s.who === 'You' ? 'your move' : "Claude's move")}</span></span>
    <span class="hh-count" data-who="${esc(s.who === 'You' ? 'your move' : "Claude's move")}">${esc(s.count)}</span>
  </li>`).join('')}</ol>
  <p class="w">Puzzle marks and the page review never hold up a push.</p>
</section>`;

  const shown = Q.rows.slice(0, 8);
  const queueCard = `<section class="hh-card" aria-labelledby="hhQueue">
  <div class="hh-head"><h2 id="hhQueue">Your next looks</h2><span class="w">${Q.rows.length ? Q.rows.length + ' in all' : ''}</span></div>
  ${shown.length ? `<ol class="hh-queue">${shown.map((r) => `<li data-t="${r.t || ''}">
    <span class="hh-tag is-${esc(r.kind.toLowerCase().replace(/\s+/g, '-'))}">${esc(r.kind)}</span>
    <a class="hh-what" href="${esc(r.href)}">${esc(r.text)}</a>
    <span class="w">${esc(r.why)}</span>
  </li>`).join('')}</ol>` : '<p class="hub-empty">Nothing waiting on you. The next move is Claude\'s.</p>'}
  ${Q.rows.length > shown.length ? `<p class="w">${Q.rows.length - shown.length} more after these: ${Q.ideasLeft} ideas to answer in all, the rest on their tabs.</p>` : ''}
</section>`;

  const notesCard = W.length ? `<section class="hh-card" aria-labelledby="hhNotes">
  <div class="hh-head"><h2 id="hhNotes">Your notes with Claude</h2><span class="w">${W.length} waiting</span></div>
  <ul class="hh-dec">${W.map((n) => `<li data-t="${n.t}"><b>${esc(n.where)}: ${esc(n.what)}</b><span class="hh-rec">“${esc(n.note)}”</span><span class="w">sent ${ago(n.t)} · comes back to you as Back for another look</span></li>`).join('')}</ul>
</section>` : '';

  const decCard = `<section class="hh-card" id="decisions" aria-labelledby="hhDec">
  <div class="hh-head"><h2 id="hhDec">Decisions waiting on you</h2><span class="w">${D.open.length} open</span></div>
  ${D.open.length ? `<ul class="hh-dec">${D.open.slice(0, 3).map((d) => `<li><b>${esc(d.q)}</b>${d.rec ? `<span class="hh-rec"><b>Claude recommends:</b> ${esc(sentences(d.rec))}</span>` : ''}<span class="w">${esc(d.id)} · open since ${esc(d.since)}</span></li>`).join('')}</ul>` : '<p class="hub-empty">None open.</p>'}
  ${D.open.length > 3 ? `<p class="w">${D.open.length - 3} more wait their turn in DECISIONS.md.</p>` : ''}
  ${D.todo.length ? `<p class="hh-sub">Yours to do, no decision needed</p><ul class="hh-todo">${D.todo.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
  <p class="w">Answer in the chat with Claude; the list updates when the answer is written down.</p>
</section>`;

  const feedCard = `<section class="hh-card" aria-labelledby="hhFeed">
  <div class="hh-head"><h2 id="hhFeed">What changed</h2><span class="w" id="hhNewCount"></span></div>
  ${E.length ? `<ol class="hh-feed">${E.map((e) => `<li data-t="${e.t}"><span class="hh-tag is-${esc(e.kind.toLowerCase())}">${esc(e.kind)}</span>${go(e.href, esc(e.text))}${ago(e.t)}</li>`).join('')}</ol>` : '<p class="hub-empty">Nothing recorded yet.</p>'}
</section>`;

  const siteCard = `<section class="hh-card" aria-labelledby="hhSite">
  <div class="hh-head"><h2 id="hhSite">The site this week</h2><a class="w" href="/secret-menu/data-observatory/traffic/">Traffic tab</a></div>
  <div id="hhTraffic" class="hh-traffic"><p class="w">Reading GoatCounter…</p></div>
</section>`;

  const body = `<div class="obs-head hh-top">
  <h1>Home</h1>
  <p class="w">As of ${esc(new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }))}. It reads the files again when you come back to it.</p>
</div>
<div class="hh-grid" id="hubHome">
  <div class="hh-col">${pushCard}${queueCard}${notesCard}</div>
  <div class="hh-col">${decCard}${siteCard}${feedCard}</div>
</div>`;
  return layout({ title: 'Home', tab: 'home', body });
}

module.exports = { page, decisions, push, queue, events, withClaude, qaOpen, puzzles, pageReview };
