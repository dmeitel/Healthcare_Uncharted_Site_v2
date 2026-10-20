'use strict';
/**
 * ideas.js · the Ideas tab: a long list of ideas for the site, each with its report, and David's answer to each.
 *
 * WHY. David, 2026-10-11, after the beta push: "spend a few hours coming up with ideas and adding them all to a page
 * on the hub for us to review... new themes, logos, games, tools, animations, ways to improve site functionality,
 * security or other ideas", "all rules are off, consider anything and everything, give me accurate reports and i will
 * do responses and QA statements for all of them like i do with the games." The end goal he named: publish the site
 * on LinkedIn and the RT and healthcare platforms at the end of October, then grow it with a small team.
 *
 * TWO FILES. The ideas are data-build/ideas.json, written by a session from research it checked live (every outside
 * claim carries its link and the day it was checked). His answers are data-build/qa/ideas.json, written only by the
 * hub: Yes, Maybe or No, a note, and whether a Yes went to the board's Inbox. An answer is never lost when the ideas
 * file is rewritten, because answers are kept by the idea's id.
 */
const fs = require('fs');
const path = require('path');
const { ROOT, stamp } = require('../lib/session');

const FILE = path.join(ROOT, 'data-build', 'ideas.json');
const MARKS = path.join(ROOT, 'data-build', 'qa', 'ideas.json');
const MARK = /** @type {const} */ (['yes', 'maybe', 'no']);
const MARK_WORD = { yes: 'Yes', maybe: 'Maybe', no: 'No' };

/** @typedef {{text:string, url?:string, checked?:string}} Evidence */
/** @typedef {{id:string, section:string, title:string, pitch:string, what?:string, why?:string, evidence?:Evidence[], effort?:string, cost?:string, risks?:string, first?:string, wild?:boolean, touches?:string[], pictures?:{src:string, alt:string, size?:string}[], mock?:string, pick?:number}} Idea */
/** @typedef {{checked?:string, intro?:string, sections:{id:string, title:string, line?:string}[], ideas:Idea[]}} IdeaFile */

/** @param {string} [file] @returns {IdeaFile} */
function load(file = FILE) {
  try {
    const d = JSON.parse(fs.readFileSync(file, 'utf8'));
    return { checked: d.checked || '', intro: d.intro || '', sections: d.sections || [], ideas: d.ideas || [] };
  } catch { return { checked: '', intro: '', sections: [], ideas: [] }; }
}

/** @param {string} [file] */
function readMarks(file = MARKS) {
  try { const m = JSON.parse(fs.readFileSync(file, 'utf8')); m.items = m.items || {}; return m; } catch { return { card: 'ideas', started: '', items: {} }; }
}

/** @param {any} marks @param {string} [file] */
function writeMarks(marks, file = MARKS) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const items = Object.fromEntries(Object.keys(marks.items).sort().map((k) => [k, marks.items[k]]));
  fs.writeFileSync(file, JSON.stringify({ ...marks, items }, null, 2) + '\n');
}

/** Every idea with its answer. @param {{file?:string, marks?:string}} [opt] */
function items(opt = {}) {
  const d = load(opt.file);
  const m = readMarks(opt.marks).items;
  return d.ideas.map((it) => {
    const a = m['idea:' + it.id] || {};
    return { ...it, state: MARK.includes(a.mark) ? a.mark : 'todo', note: a.note || '', at: a.at || '', inbox: a.inbox || '', reply: a.reply || '', replyAt: a.replyAt || '' };
  });
}

/** @param {{state:string}[]} list */
function counts(list) {
  const n = (/** @type {string} */ s) => list.filter((i) => i.state === s).length;
  return { total: list.length, todo: n('todo'), yes: n('yes'), maybe: n('maybe'), no: n('no') };
}

/** David's answer to one idea. A mark is Yes, Maybe or No; '' keeps the mark he has and saves the note alone.
 *  @param {string} id @param {string} mark @param {string} note @param {{file?:string, marks?:string}} [opt] */
function answer(id, mark, note, opt = {}) {
  const idea = load(opt.file).ideas.find((i) => i.id === id);
  if (!idea) throw new Error('No such idea.');
  if (mark && !MARK.includes(/** @type {any} */ (mark))) throw new Error('An answer is Yes, Maybe or No.');
  note = String(note || '').replace(/\r\n/g, '\n').trim().slice(0, 4000);
  const marks = readMarks(opt.marks);
  if (!marks.started) marks.started = stamp();
  const key = 'idea:' + id, prev = marks.items[key];
  if (!mark && !(prev && prev.mark) && !note) throw new Error('Pick Yes, Maybe or No, or write a note.');
  const history = prev ? [...(prev.history || []), { mark: prev.mark || '', note: prev.note || '', at: prev.at || '' }] : [];
  marks.items[key] = { mark: mark || (prev && prev.mark) || '', note, at: stamp(), inbox: (prev && prev.inbox) || '', reply: (prev && prev.reply) || '', replyAt: (prev && prev.replyAt) || '', history };
  writeMarks(marks, opt.marks);
  return marks.items[key];
}

/** Claude's answer to his note, shown on the card under it. It never changes his answer.
 *  @param {string} id @param {string} text @param {{file?:string, marks?:string}} [opt] */
function reply(id, text, opt = {}) {
  if (!load(opt.file).ideas.find((i) => i.id === id)) throw new Error('No such idea.');
  text = String(text || '').replace(/\r\n/g, '\n').trim().slice(0, 6000);
  if (!text) throw new Error('A reply needs words.');
  const marks = readMarks(opt.marks), key = 'idea:' + id;
  const prev = marks.items[key] || { mark: '', note: '', at: '', inbox: '', history: [] };
  marks.items[key] = { ...prev, reply: text, replyAt: stamp() };
  writeMarks(marks, opt.marks);
  return marks.items[key];
}

/** A Yes goes to the board's Inbox, once. @param {string} id @param {{file?:string, marks?:string, board?:string}} [opt] */
function toInbox(id, opt = {}) {
  const idea = load(opt.file).ideas.find((i) => i.id === id);
  if (!idea) throw new Error('No such idea.');
  const marks = readMarks(opt.marks), key = 'idea:' + id, a = marks.items[key];
  if (!a || a.mark !== 'yes') throw new Error('Say Yes to it first.');
  if (a.inbox) return a.inbox;
  const boardLib = require('./board');
  const b = boardLib.load(opt.board);
  const card = boardLib.addInbox(b, idea.title, 'From the Ideas tab: ' + idea.pitch + (a.note ? ' David: ' + a.note : ''));
  boardLib.save(b, opt.board);
  a.inbox = card;
  writeMarks(marks, opt.marks);
  return card;
}

/* ── the screen ─────────────────────────────────────────────────────────── */

/** @param {string} [only] a section id from ?group=, or 'start' for the shortlist */
function page(only) {
  const { layout, esc, icon } = require('./pages');
  const d = load();
  const list = items();
  const c = counts(list);
  const bySection = (/** @type {string} */ s) => s === 'start' ? list.filter((i) => i.pick).sort((a, b) => (a.pick || 0) - (b.pick || 0)) : list.filter((i) => i.section === s);
  const sections = [{ id: 'start', title: 'Start here', line: 'The shortlist, in the order Claude would do it. 1 to 13 before the launch (Respiratory Care Week, October 25 to 31); 14 on, after it.' }, ...d.sections];
  const pick = sections.find((s) => s.id === only) ? only : '';
  const left = (/** @type {any[]} */ its) => its.filter((i) => i.state === 'todo').length;
  const chip = (/** @type {{id:string,title:string}} */ s, /** @type {any[]} */ its) => {
    const on = (pick || '') === s.id, n = left(its);
    return `<a class="toggle-chip${on ? ' on' : ''}" href="/__hub/ideas${s.id ? '?group=' + esc(s.id) : ''}"${on ? ' aria-current="page"' : ''}>${esc(s.title)} · ${its.length ? (n ? n + ' to answer' : 'answered') : 'none yet'}</a>`;
  };
  const folders = `<nav class="hub-switch hub-folders hub-idea-folders" aria-label="Kinds of idea">${chip({ id: '', title: 'All' }, list)}${sections.filter((s) => bySection(s.id).length || s.id === pick).map((s) => chip(s, bySection(s.id))).join('')}</nav>`;

  const ev = (/** @type {Evidence[]} */ e) => e && e.length ? `<ul class="hub-idea-ev">${e.map((x) => `<li>${x.url ? `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.text)}</a>` : esc(x.text)}${x.checked ? ` <span class="w">checked ${esc(x.checked)}</span>` : ''}</li>`).join('')}</ul>` : '';
  const row = (/** @type {string} */ k, /** @type {string|undefined} */ v) => v ? `<dt>${k}</dt><dd>${esc(v)}</dd>` : '';
  const one = (/** @type {any} */ it) => {
    const pills = [
      it.wild ? '<span class="obs-pill is-wild">Wild</span>' : '',
      it.effort ? `<span class="obs-pill">Effort ${esc(it.effort)}</span>` : '',
      it.cost ? `<span class="obs-pill">${esc(it.cost)}</span>` : '',
      ...(it.touches || []).map((/** @type {string} */ t) => `<span class="obs-pill is-touch">Touches ${esc(t)}</span>`),
    ].join('');
    const pics = (it.pictures || []).map((/** @type {any} */ p) => `<figure><a href="/__hub/shots/${esc(p.src)}"><img src="/__hub/shots/${esc(p.src)}" alt="${esc(p.alt)}" loading="lazy" class="is-${esc(p.size || 'desktop')}"></a><figcaption>${esc(p.alt)}</figcaption></figure>`).join('');
    const tid = 'i-' + it.id;
    const status = it.at ? `${esc(MARK_WORD[/** @type {'yes'} */ (it.state)] || 'A note')}, ${esc(it.at)}` : '';
    return `<li class="hub-qa-item hub-idea" data-state="${esc(it.state)}" data-idea="${esc(it.id)}">
  <div class="hub-qa-top"><h3>${it.pick ? `<span class="hub-idea-n">${it.pick}</span>` : ''}${esc(it.title)}</h3><span class="hub-idea-pills">${pills}</span></div>
  <p class="hub-idea-pitch">${esc(it.pitch)}</p>
  ${pics ? `<div class="hub-pair">${pics}</div>` : ''}
  ${it.mock ? `<a class="go" href="/__hub/mocks/${esc(it.mock)}" target="_blank" rel="noopener">Try the mockup ${icon('arrow-right')}</a>` : ''}
  <details class="hub-idea-more"><summary>The report</summary><dl>
    ${row('What it is', it.what)}${row('Why it brings people', it.why)}
    ${it.evidence && it.evidence.length ? `<dt>The evidence</dt><dd>${ev(it.evidence)}</dd>` : ''}
    ${row('Effort and cost', [it.effort && 'Effort ' + it.effort, it.cost].filter(Boolean).join(', '))}${row('Risks', it.risks)}${row('The first step', it.first)}
  </dl></details>
  <div class="hub-actions">
    ${MARK.map((m) => `<button class="hub-btn hub-pick is-${m}" type="button" data-idea-mark="${m}" aria-pressed="${it.state === m}">${icon(m === 'yes' ? 'check' : m === 'no' ? 'x' : 'clock')}${MARK_WORD[m]}</button>`).join('')}
    <span class="w">${status}</span>
  </div>
  ${it.reply ? `<p class="hub-fix"><b>Claude:</b> ${esc(it.reply)}${it.replyAt ? ` <span class="w">${esc(it.replyAt)}</span>` : ''}</p>` : ''}
  <div class="hub-idea-note">
    <label class="obs-lab" for="${tid}">Your response</label>
    <textarea class="hub-input" id="${tid}" rows="2" maxlength="4000">${esc(it.note)}</textarea>
    <div class="hub-row"><span class="hub-err" role="alert"></span>
      ${it.inbox ? `<span class="w">${icon('inbox')}On the board's Inbox</span>` : it.state === 'yes' ? `<button class="hub-btn" type="button" data-idea-inbox>${icon('inbox')}Send to the Inbox</button>` : ''}
      <button class="hub-btn hub-btn--go" type="button" data-idea-save>Save the note</button></div>
  </div>
</li>`;
  };
  const block = (/** @type {{id:string,title:string,line?:string}} */ s) => {
    const its = bySection(s.id);
    if (!its.length) return '';
    /* answered ideas fold under the open ones (2026-10-18: "stuff we have discussed is still front and center") */
    const open = its.filter((i) => i.state === 'todo'), done = its.filter((i) => i.state !== 'todo');
    const fold = done.length ? `<details class="hub-good"><summary><span class="obs-h2">Answered <small>${done.length} · folded; open to change an answer</small></span></summary><ul class="hub-qa">${done.map(one).join('')}</ul></details>` : '';
    return `<h2 class="obs-h2" id="g-${esc(s.id)}">${esc(s.title)} <small>${its.length}${left(its) ? ' · ' + left(its) + ' to answer' : ' · answered'}</small></h2>${s.line ? `<p class="hub-idea-line">${esc(s.line)}</p>` : ''}${open.length ? `<ul class="hub-qa">${open.map(one).join('')}</ul>` : ''}${fold}`;
  };
  const shown = pick ? [sections.find((s) => s.id === pick)] : sections.filter((s) => s.id !== 'start');
  /* the design direction, when there is one, leads the page ahead of the shortlist (2026-10-11) */
  const lead = sections.filter((s) => s.id === 'direction');
  const body = `<div class="obs-head">
  <h1>Ideas <span class="hub-of">· for the launch and after</span></h1>
  <p>${esc(d.intro || 'Every idea from the research, with its report. Answer each one Yes, Maybe or No, and say why in the box; a Yes can go straight to the board\'s Inbox.')}</p>
  ${d.checked ? `<p class="w">Every outside fact in a report was checked live on ${esc(d.checked)}, and links to where it came from.</p>` : ''}
  <p class="hub-idea-line"><a class="go" href="/__hub/mocks/at-a-glance.html" target="_blank" rel="noopener">The ideas at a glance ${icon('arrow-right')}</a> <a class="go" href="/__hub/mocks/compare-skins.html" target="_blank" rel="noopener">Five skins side by side ${icon('arrow-right')}</a></p>
</div>
${folders}
<div class="obs-cards hub-qa-sum hub-idea-sum">
  <div class="obs-card"><p class="obs-lab">To answer</p><p class="obs-big">${c.todo} <small>of ${c.total}</small></p></div>
  <div class="obs-card"><p class="obs-lab">Yes</p><p class="obs-big">${c.yes}</p></div>
  <div class="obs-card"><p class="obs-lab">Maybe</p><p class="obs-big">${c.maybe}</p></div>
  <div class="obs-card"><p class="obs-lab">No</p><p class="obs-big">${c.no}</p></div>
</div>
${c.total ? (pick ? '' : lead.map(block).join('') + block(sections[0])) + shown.filter((s) => pick || !lead.includes(s)).map((s) => s ? block(s) : '').join('') : '<p class="hub-alert">The research is still running. The ideas land here as each report is written up.</p>'}`;
  return layout({ title: 'Ideas', tab: 'ideas', body });
}

module.exports = { FILE, MARKS, MARK, load, readMarks, items, counts, answer, reply, toInbox, page };

if (require.main === module) {
  // node scripts/hub/ideas.js reply <id> "text"   Claude answers his note on a card
  const [verb, id, text] = process.argv.slice(2);
  try { if (verb === 'reply') { reply(id, text); console.log('Replied on ' + id); } else console.log('node scripts/hub/ideas.js reply <id> "text"'); }
  catch (e) { console.error(String(e && /** @type {Error} */ (e).message || e)); process.exit(1); }
}
