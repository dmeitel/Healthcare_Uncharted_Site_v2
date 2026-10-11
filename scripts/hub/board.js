#!/usr/bin/env node
'use strict';
/**
 * board.js · the sprint as one list.
 *
 *   npm run board                         print the board, and re-print SPRINT.md's NOW section from it
 *   npm run board -- --check              exit 1 if the board breaks a rule or SPRINT.md is out of step
 *   npm run board -- step 3 done          set a step's status: next | doing | done | waiting "on what"
 *   npm run board -- stage hub QA         move a card along Plan, Build, QA, Tweaks, Ship
 *   npm run board -- lane hub done        move a card: focus | next | inbox | done
 *   npm run board -- inbox "Title" "One line"      a new idea, parked until David promotes it
 *   npm run board -- promote <id>         Inbox to Up next (David's call; the hub has the same button)
 *   npm run board -- drop <id>            take a card off the board (David's call; say why in CHANGES)
 *
 * WHY. David, 2026-10-04: "a visualization of our Sprint boards or what we are going to focus on
 * next so that we can use those visualizations to talk about what tasks are going to be followed
 * and not just follow mindlessly", and "new items might come but then of course we want them added
 * to the planning board and then we want them to be kind of promoted".
 *
 * ONE LIST. The source is data-build/board.json. The hub draws it; SPRINT.md's NOW section is
 * printed from it between two markers, so a session still reads plain text at the start and the
 * two cannot disagree (tests/hub.test.js fails when they do). Reading tables back out of prose is
 * what slipped twice on 2026-10-04, which is why the file is the source and the prose is the print.
 *
 * THE RULES IT HOLDS. Focus holds two cards at most, one primary and one secondary. Nothing is
 * worked from the Inbox. Every step has an owner and a "done when". Plan:
 * docs/HU-ADMIN-HUB-PLAN-2026-10-04.md.
 */
const fs = require('fs');
const path = require('path');
const { ROOT, today } = require('../lib/session');

const FILE = path.join(ROOT, 'data-build', 'board.json');
const SPRINT = path.join(ROOT, 'SPRINT.md');
const DECISIONS = path.join(ROOT, 'DECISIONS.md');
const STAGES = ['Plan', 'Build', 'QA', 'Tweaks', 'Ship'];
const LANES = ['focus', 'next', 'inbox', 'done'];
const STATUSES = ['next', 'doing', 'done', 'waiting'];
const START = '<!-- board:start (printed from data-build/board.json by `npm run board`; change the file, not this block) -->';
const END = '<!-- board:end -->';

/** @typedef {{n:number, text:string, who:string, done?:string, status:string, on?:string, at?:string}} Step */
/** @typedef {{id:string, title:string, lane:string, role?:string, stage?:string, goal?:string, done?:string, says?:string, plan?:string, line?:string, added?:string, finished?:string, steps?:Step[], qa?:{id:string, text:string, link?:string, group?:string, try?:string, look?:string}[], qaPages?:boolean, shipTitle?:string, shipped?:string[], live?:string[]}} Card */
/** @typedef {{n:number, text:string, status:string, at?:string}} Ask */
/** @typedef {{cards:Card[], asks:Ask[]}} Board */

/** @param {string} [file] @returns {Board} */
function load(file = FILE) {
  const b = JSON.parse(fs.readFileSync(file, 'utf8'));
  b.cards = b.cards || [];
  b.asks = b.asks || [];
  return b;
}

/** Every rule the board holds, as sentences. Empty means it is sound. @param {Board} b */
function problems(b) {
  const out = [];
  const ids = new Set();
  const nums = new Set();
  for (const c of b.cards) {
    if (!c.id || !/^[a-z0-9-]+$/.test(c.id)) out.push(`a card has no usable id: ${JSON.stringify(c.id)}`);
    if (ids.has(c.id)) out.push(`two cards share the id ${c.id}`);
    ids.add(c.id);
    if (!c.title) out.push(`${c.id} has no title`);
    if (!LANES.includes(c.lane)) out.push(`${c.id} is in no lane: ${c.lane}`);
    if (c.stage && !STAGES.includes(c.stage)) out.push(`${c.id} has an unknown stage: ${c.stage}`);
    if (c.lane === 'focus' && !c.stage) out.push(`${c.id} is in focus with no stage`);
    for (const s of c.steps || []) {
      if (nums.has(s.n)) out.push(`two steps share the number ${s.n}`);
      nums.add(s.n);
      if (!s.text || !s.who) out.push(`step ${s.n} needs its words and an owner`);
      if (!STATUSES.includes(s.status)) out.push(`step ${s.n} has an unknown status: ${s.status}`);
      if (s.status === 'waiting' && !s.on) out.push(`step ${s.n} is waiting, on what?`);
    }
  }
  for (const a of b.asks) {
    if (nums.has(a.n)) out.push(`two steps share the number ${a.n}`);
    nums.add(a.n);
  }
  const focus = b.cards.filter((c) => c.lane === 'focus');
  if (focus.length > 2) out.push(`Focus holds two at most; it has ${focus.length}: ${focus.map((c) => c.title).join(', ')}`);
  for (const role of ['primary', 'secondary']) {
    const n = b.cards.filter((c) => (c.lane === 'focus' || c.lane === 'next') && c.role === role).length;
    if (n > 1) out.push(`only one ${role} focus at a time; there are ${n}`);
  }
  return out;
}

/** @param {Step|Ask} s */
function statusText(s) {
  if (s.status === 'done') return 'DONE' + (s.at ? ' ' + s.at : '');
  if (s.status === 'doing') return 'DOING';
  if (s.status === 'waiting') return 'WAITING on ' + (/** @type {Step} */ (s).on || 'David');
  if (s.status === 'open') return "WAITING on David's OK";
  return 'NEXT';
}

const cell = (/** @type {string|undefined} */ s) => String(s || '').replace(/\|/g, '\\|').replace(/\n/g, ' ');

/** The NOW section of SPRINT.md, printed from the board. @param {Board} b */
function print(b) {
  const L = [];
  const lane = (/** @type {string} */ l) => b.cards.filter((c) => c.lane === l);
  const table = (/** @type {Card} */ c) => {
    if (!c.steps || !c.steps.length) return;
    L.push('', '| # | Step | Owner | Done when | Status |', '|---|---|---|---|---|');
    for (const s of c.steps) L.push(`| ${s.n} | ${cell(s.text)} | ${cell(s.who)} | ${cell(s.done)} | ${statusText(s)} |`);
  };
  L.push('The board, printed. The picture of it is the hub: `npm run hub`, then /__hub. Stage names: ' + STAGES.join(', ') + '.');
  for (const c of lane('focus')) {
    L.push('', `### Focus${c.role ? ' · ' + c.role : ''} · ${c.title} · stage: ${c.stage}`, '');
    if (c.goal) L.push(c.goal);
    if (c.done) L.push('Done looks like: ' + c.done);
    if (c.plan) L.push('Plan: ' + c.plan);
    table(c);
  }
  for (const c of lane('next')) {
    L.push('', `### Up next${c.role ? ' · ' + c.role : ''} · ${c.title}`, '');
    if (c.says) L.push(c.says);
    if (c.goal) L.push(c.goal);
    table(c);
  }
  const asks = b.asks.filter((a) => a.status !== 'done');
  if (asks.length) {
    L.push('', '### Waiting on David, small', '', '| # | Step | Status |', '|---|---|---|');
    for (const a of asks) L.push(`| ${a.n} | ${cell(a.text)} | ${statusText(a)} |`);
    L.push('', 'More of his are in DECISIONS.md: the open questions, and "Yours to do".');
  }
  const inbox = lane('inbox');
  L.push('', '### Inbox · parked, not dropped', '', 'Nothing here is worked until David promotes it.', '');
  if (!inbox.length) L.push('(empty)');
  for (const c of inbox) L.push(`- **${c.title}**${c.line ? ' ' + c.line : ''}${c.added ? ' (added ' + c.added + ')' : ''}`);
  const done = lane('done');
  if (done.length) {
    L.push('', '### Done since the last push', '');
    for (const c of done) L.push(`- **${c.title}**${c.finished ? ', ' + c.finished : ''}`);
  }
  return L.join('\n') + '\n';
}

/** SPRINT.md with its NOW block replaced by the board's print. @param {Board} b @param {string} [text] */
function printed(b, text = fs.readFileSync(SPRINT, 'utf8')) {
  const a = text.indexOf(START), z = text.indexOf(END);
  if (a < 0 || z < 0) throw new Error('SPRINT.md has no board markers. The NOW section needs "' + START + '" and "' + END + '".');
  return text.slice(0, a + START.length) + '\n' + print(b) + text.slice(z);
}

/** @param {Board} b */
function inStep(b) {
  const text = fs.readFileSync(SPRINT, 'utf8').replace(/\r\n/g, '\n');
  return printed(b, text) === text;
}

/** Write the board, then re-print SPRINT.md from it. Refuses a board that breaks a rule.
 *  @param {Board} b @param {string} [file] */
function save(b, file = FILE) {
  const bad = problems(b);
  if (bad.length) throw new Error('The board breaks its rules: ' + bad.join('; '));
  fs.writeFileSync(file, JSON.stringify(b, null, 2) + '\n');
  if (file === FILE) {
    const text = fs.readFileSync(SPRINT, 'utf8').replace(/\r\n/g, '\n');
    const next = printed(b, text);
    if (next !== text) fs.writeFileSync(SPRINT, next);
  }
}

/** What is David's move right now: his unblocked steps on cards in play, and the small asks.
 *  @param {Board} b @returns {{n:number, text:string, card:string, cardId:string}[]} */
function waiting(b) {
  const out = [];
  for (const c of b.cards.filter((x) => x.lane === 'focus' || x.lane === 'next')) {
    for (const s of c.steps || []) {
      const his = /^David/.test(s.who);
      if (his && (s.status === 'next' || s.status === 'doing' || (s.status === 'waiting' && s.on === 'David'))) out.push({ n: s.n, text: s.text, card: c.title, cardId: c.id });
    }
  }
  for (const a of b.asks.filter((x) => x.status !== 'done')) out.push({ n: a.n, text: a.text, card: '', cardId: '' });
  return out;
}

/** The open questions in DECISIONS.md, in its own order: the id and the question in bold.
 *  @returns {{id:string, text:string}[]} */
function decisions() {
  let md = '';
  try { md = fs.readFileSync(DECISIONS, 'utf8').replace(/\r\n/g, '\n'); } catch { return []; }
  const a = md.indexOf('## NEEDS YOU');
  const z = md.indexOf('\n## ', a + 5);
  const block = a < 0 ? '' : md.slice(a, z < 0 ? undefined : z);
  const out = [];
  for (const line of block.split('\n')) {
    const row = line.match(/^\| ([A-Za-z0-9]+) \| (.*)$/);
    if (row && row[1] !== '#') {
      const q = row[2].match(/\*\*(.+?)\*\*/);
      out.push({ id: row[1], text: q ? q[1] : row[2].slice(0, 90) });
    }
    const todo = line.match(/^- \*\*(.+?)\*\*/);
    if (todo) out.push({ id: 'to do', text: todo[1] });
  }
  return out;
}

/** @param {Board} b @param {number} n */
function findStep(b, n) {
  for (const c of b.cards) for (const s of c.steps || []) if (s.n === n) return s;
  return b.asks.find((a) => a.n === n) || null;
}

/** A new idea goes to the Inbox and nowhere else. @param {Board} b @param {string} title @param {string} [line] */
function addInbox(b, title, line = '') {
  const clean = (/** @type {string} */ s) => String(s || '').replace(/\s+/g, ' ').trim();
  title = clean(title).slice(0, 80);
  if (!title) throw new Error('An idea needs a name.');
  let id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'idea';
  while (b.cards.some((c) => c.id === id)) id += '-2';
  b.cards.push({ id, title, lane: 'inbox', line: clean(line).slice(0, 240), added: today() });
  return id;
}

/** Inbox to Up next. Focus is filled in a Plan conversation, not by a button. @param {Board} b @param {string} id */
function promote(b, id) {
  const c = b.cards.find((x) => x.id === id);
  if (!c) throw new Error('No card ' + id);
  if (c.lane !== 'inbox') throw new Error(c.title + ' is not in the Inbox.');
  c.lane = 'next';
  return c;
}

function cli() {
  const args = process.argv.slice(2);
  const b = load();
  const [verb, a1, a2, a3] = args;
  if (verb === '--check') {
    const bad = problems(b);
    if (!inStep(b)) bad.push('SPRINT.md is out of step with the board: run `npm run board`');
    bad.forEach((p) => console.log('  ' + p));
    console.log(bad.length ? 'The board needs attention.' : 'The board is sound and SPRINT.md matches it.');
    process.exit(bad.length ? 1 : 0);
  }
  if (verb === 'step') {
    const s = findStep(b, Number(a1));
    if (!s) throw new Error('No step ' + a1);
    if (!STATUSES.includes(a2)) throw new Error('A status is one of: ' + STATUSES.join(', '));
    if (!('who' in s)) {
      s.status = a2 === 'done' ? 'done' : 'open';   // a small ask is open until David answers it
    } else {
      const st = /** @type {Step} */ (s);
      st.status = a2;
      if (a2 === 'waiting') st.on = a3 || 'David'; else delete st.on;
    }
    if (a2 === 'done') s.at = today(); else delete s.at;
  } else if (verb === 'stage') {
    const c = b.cards.find((x) => x.id === a1);
    if (!c) throw new Error('No card ' + a1);
    if (!STAGES.includes(a2)) throw new Error('A stage is one of: ' + STAGES.join(', '));
    c.stage = a2;
  } else if (verb === 'lane') {
    const c = b.cards.find((x) => x.id === a1);
    if (!c) throw new Error('No card ' + a1);
    if (!LANES.includes(a2)) throw new Error('A lane is one of: ' + LANES.join(', '));
    c.lane = a2;
    if (a2 === 'done') c.finished = today();
  } else if (verb === 'inbox') {
    console.log('Added to the Inbox: ' + addInbox(b, a1, a2));
  } else if (verb === 'promote') {
    console.log('Promoted to Up next: ' + promote(b, a1).title);
  } else if (verb === 'drop') {
    const c = b.cards.find((x) => x.id === a1);
    if (!c) throw new Error('No card ' + a1);
    if (c.lane === 'focus') throw new Error(c.title + ' is in focus. Move it out first.');
    b.cards = b.cards.filter((x) => x.id !== a1);
    console.log('Dropped: ' + c.title + '. Nothing is dropped silently: add a line to CHANGES in SPRINT.md.');
  } else if (verb) {
    throw new Error('Unknown: ' + verb + '. See the top of scripts/hub/board.js.');
  }
  const before = fs.readFileSync(SPRINT, 'utf8');
  save(b);
  const lanes = { focus: 'FOCUS', next: 'UP NEXT', inbox: 'INBOX', done: 'DONE' };
  for (const l of LANES) {
    const cards = b.cards.filter((c) => c.lane === l);
    if (!cards.length) continue;
    console.log('\n' + lanes[/** @type {'focus'} */ (l)]);
    for (const c of cards) {
      const open = (c.steps || []).filter((s) => s.status !== 'done').length;
      console.log(`  ${c.title}${c.role ? ' (' + c.role + ')' : ''}${c.stage && l === 'focus' ? ' · ' + c.stage : ''}${c.steps ? ' · ' + open + ' step(s) open' : ''}`);
    }
  }
  const w = waiting(b);
  console.log('\nWAITING ON DAVID');
  if (!w.length) console.log('  nothing');
  for (const x of w) console.log(`  ${x.n}. ${x.text.replace(/\*\*/g, '').slice(0, 96)}`);
  console.log('\n' + (fs.readFileSync(SPRINT, 'utf8') === before ? 'SPRINT.md already matches.' : 'SPRINT.md re-printed from the board.'));
}

if (require.main === module) {
  try { cli(); } catch (e) { console.error(String(e && /** @type {Error} */ (e).message || e)); process.exit(1); }
}

module.exports = { FILE, STAGES, LANES, START, END, load, save, problems, print, printed, inStep, waiting, decisions, findStep, addInbox, promote, statusText };
