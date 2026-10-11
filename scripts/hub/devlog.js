'use strict';
/**
 * devlog.js · the history and the page blocks the hub draws, worked out when asked for.
 *
 * Four things that never met until 2026-10-04: the push history (git), the close notes
 * (docs/sessions/), the open design phases (CLAUDE.md) and the page ledger (tmp/ledger/ledger.json,
 * from `npm run ledger`). For one day this wrote src/_data/devlog.json for two pages of the site.
 * The hub is a screen on David's computer, so it reads them live and nothing is a build behind.
 */
const fs = require('fs');
const path = require('path');
const { ROOT, TZ, git } = require('../lib/session');

const SESSIONS = path.join(ROOT, 'docs', 'sessions');
const LEDGER = path.join(ROOT, 'tmp', 'ledger', 'ledger.json');
const LOCKS = path.join(ROOT, 'data-build', 'page-locks.json');
const REVIEWS = path.join(ROOT, 'data-build', 'page-reviews.json');

/** The areas of the site, in the order the Site tab lays them out. `test` reads a repo path for
 *  the push history; `url` reads a page address for the blocks. First match wins, so the
 *  observatory sits ahead of the rest of the secret menu. */
const AREAS = [
  { id: 'front', label: 'Front door', url: /^\/(?:$|about\/|thanks\/|404\.html)/, test: /^src\/(?:index\.html|about\/|thanks\/|404\.)/ },
  { id: 'tools', label: 'Tools', url: /^\/tools\//, test: /^src\/tools\// },
  { id: 'fun', label: 'Fun', url: /^\/fun\//, test: /^src\/fun\// },
  { id: 'atlas', label: 'Atlas', url: /^\/atlas\//, test: /^src\/atlas\// },
  { id: 'learn', label: 'Learn', url: /^\/learn\//, test: /^src\/learn\// },
  { id: 'rounds', label: 'Rounds', url: /^\/rounds\//, test: /^src\/rounds\// },
  { id: 'admin', label: 'Data Observatory', url: /^\/secret-menu\/data-observatory\//, test: /^src\/secret-menu\/data-observatory\// },
  { id: 'secret', label: 'Secret menu', url: /^\/secret-menu\//, test: /^src\/secret-menu\// },
  { id: 'data', label: 'Data', url: /^$/, test: /^(?:src\/assets\/data\/|src\/_data\/|scripts\/pull\/|data-build\/)/ },
  { id: 'platform', label: 'Platform', url: /^$/, test: /^(?:src\/assets\/|src\/_includes\/|scripts\/|tests\/|types\/|package|netlify\.toml|\.claude\/|eleventy|tsconfig)/ },
  { id: 'records', label: 'Records', url: /^$/, test: /^(?:docs\/|CLAUDE\.md|DECISIONS\.md|SPRINT\.md|DESIGN\.md|PRODUCT\.md|DATA\.md)/ },
];

/** Short names for the blocks where a page's own title is a sentence. */
const SHORT = {
  '/': 'Home', '/learn/': 'Learn hub', '/rounds/': 'Rounds hub', '/tools/': 'Tools hub',
  '/secret-menu/': 'Secret menu hub', '/404.html': 'Not found page', '/thanks/': 'Signup thanks',
};

/** @param {string} file @returns {any} */
function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

/** @param {string} p repo-relative path */
function areaOfPath(p) {
  const a = AREAS.find((x) => x.test.test(p));
  return a ? a.id : 'platform';
}

/** @type {{head:string, list:any[], last:Map<string,string>}|null} */
let logCache = null;

/** One pass over the history: every push, newest first, with the areas it touched, and the date
 *  each file last changed. Held until the head commit moves. */
function history() {
  const head = git(['rev-parse', 'HEAD']);
  if (logCache && logCache.head === head) return logCache;
  const raw = git(['log', '--date=short', '--name-only', '--format=%x1e%h%x1f%ad%x1f%s']);
  /** @type {Map<string,string>} */
  const last = new Map();
  const list = raw.split('\x1e').filter(Boolean).map((chunk) => {
    const [first, ...files] = chunk.split('\n');
    const [hash, date, title] = first.split('\x1f');
    /** @type {Record<string, number>} */
    const areas = {};
    for (const f of files.map((s) => s.trim()).filter(Boolean)) {
      const a = areaOfPath(f);
      areas[a] = (areas[a] || 0) + 1;
      if (!last.has(f)) last.set(f, date);
    }
    const n = Object.values(areas).reduce((s, v) => s + v, 0);
    // the areas a visitor would see, in layout order, for the timeline's labels
    const seen = AREAS.filter((a) => areas[a.id]).map((a) => a.label);
    return { hash, date, title, files: n, areas, seen };
  });
  logCache = { head, list, last };
  return logCache;
}

function commits() { return history().list; }

/** A close note: docs/sessions/YYYY-MM-DD[-b].md. Front matter (date, title, pushed) then lists
 *  under "## Did", "## Left half done", "## Next", "## Waiting on David" and "## Checks".
 *  @param {string} file */
function parseNote(file) {
  const text = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  /** @type {Record<string, string>} */
  const fm = {};
  let body = text;
  if (text.startsWith('---\n')) {
    const end = text.indexOf('\n---', 4);
    for (const line of text.slice(4, end).split('\n')) {
      const m = line.match(/^(\w+):\s*"?(.*?)"?\s*$/);
      if (m) fm[m[1]] = m[2];
    }
    body = text.slice(end + 4);
  }
  /** @type {Record<string, string[]>} */
  const lists = {};
  let cur = '';
  for (const line of body.split('\n')) {
    const h = line.match(/^##\s+(.+?)\s*$/);
    if (h) { cur = h[1].toLowerCase(); lists[cur] = []; continue; }
    const b = line.match(/^\s*-\s+(.+)$/);
    if (b && cur) lists[cur].push(b[1].trim());
    else if (cur && line.trim() && lists[cur].length) lists[cur][lists[cur].length - 1] += ' ' + line.trim();
  }
  const pick = (/** @type {string} */ k) => lists[k] || [];
  return {
    file: path.relative(ROOT, file).split(path.sep).join('/'),
    id: path.basename(file, '.md'),
    date: fm.date || path.basename(file).slice(0, 10),
    title: fm.title || '',
    pushed: fm.pushed || '',
    did: pick('did'), left: pick('left half done'), next: pick('next'),
    waiting: pick('waiting on david'), checks: pick('checks'),
  };
}

/** Every close note, newest window first. */
function sessions() {
  if (!fs.existsSync(SESSIONS)) return [];
  // a day's first note is YYYY-MM-DD.md and its second YYYY-MM-DD-b.md; plain sorting puts "-b"
  // before ".md", so the first note sorts as "-a" and the newest window always comes first
  const key = (/** @type {string} */ f) => f.replace(/^(\d{4}-\d{2}-\d{2})\.md$/, '$1-a.md');
  return fs.readdirSync(SESSIONS)
    .filter((f) => /^\d{4}-\d{2}-\d{2}.*\.md$/.test(f))
    .sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0)).reverse()
    .map((f) => parseNote(path.join(SESSIONS, f)));
}

/** The name the next close note takes: today's date, then -b, -c and on for later windows. @param {string} day */
function nextNoteId(day) {
  if (!fs.existsSync(SESSIONS)) return day;
  const have = fs.readdirSync(SESSIONS).filter((f) => f.startsWith(day) && f.endsWith('.md'));
  if (!have.length) return day;
  const letters = have.map((f) => (f.match(/^\d{4}-\d{2}-\d{2}-([a-z])\.md$/) || [, 'a'])[1]).sort();
  return day + '-' + String.fromCharCode(letters[letters.length - 1].charCodeAt(0) + 1);
}

/** The design phases as CLAUDE.md lists them under OPEN PHASES: each entry is a paragraph that
 *  starts with a bold "Name · OPEN ..." line. Any src/ path named in the entry marks the pages
 *  under it. */
function phases() {
  const md = fs.readFileSync(path.join(ROOT, 'CLAUDE.md'), 'utf8').replace(/\r\n/g, '\n');
  const start = md.indexOf('### OPEN PHASES');
  if (start < 0) return [];
  const end = md.indexOf('\nCLOSED, details in the log', start);
  const block = md.slice(start, end < 0 ? undefined : end);
  const parts = block.split(/\n(?=\*\*[^*\n]+ · )/).slice(1);
  return parts.map((p) => {
    const head = (p.match(/^\*\*([^*]+)\*\*/) || ['', p.split('\n')[0]])[1];
    const name = head.split(' · ')[0].trim();
    const last = [...head.matchAll(/\b(OPEN|PARKED|REOPENED)\b/g)].pop();   // the latest word wins: PARKED AT ALPHA, REOPENED is open
    const state = last && last[1] === 'PARKED' ? 'parked' : 'open';
    const since = (head.match(/\d{4}-\d{2}-\d{2}/) || [''])[0];
    const paths = [...new Set((p.match(/src\/[\w\-/.]+/g) || []).map((s) => s.replace(/[.,;]+$/, '')))];
    return { name, state, since, paths };
  });
}

/** @param {string} title @param {string} url */
function shortName(title, url) {
  if (SHORT[url]) return SHORT[url];
  // a talk is named for its event: three pages would otherwise all read "AI in Healthcare"
  if (/^\/learn\/talks\//.test(url) && title.includes(' · ')) return 'Talk: ' + title.split(' · ').pop().trim();
  return title.split(/: | · /)[0].trim();
}

/** Every live page as a block: the ledger's rows with their area, last change, lock and phase
 *  marks. Null when `npm run ledger` has not run on this computer yet. */
function site() {
  const ledger = readJson(LEDGER);
  if (!ledger || !Array.isArray(ledger.rows)) return null;
  const phaseList = phases();
  const locks = readJson(LOCKS) || {};
  const reviews = readJson(REVIEWS) || {};
  const last = history().last;
  const dirty = new Set(git(['status', '--porcelain', '-uall']).split('\n').filter(Boolean).map((l) => l.slice(3).trim().replace(/^"|"$/g, '')));
  const rows = ledger.rows.map((/** @type {any} */ r) => {
    const area = (AREAS.find((a) => a.url.test(r.url)) || { id: 'front' }).id;
    const dir = r.src ? r.src.replace(/[^/]+$/, '') : '';
    const inPhase = phaseList.filter((p) => p.paths.some((q) => (r.src || '').startsWith(q) || (q.endsWith('/') && dir.startsWith(q)))).map((p) => p.name + (p.state === 'parked' ? ' (parked)' : ''));
    const lock = locks[r.url] || null;
    const rev = reviews[r.url] || r.review || null;
    return {
      url: r.url, title: r.title, short: shortName(r.title || r.url, r.url), area, kind: r.kind,
      phase: r.phase, holds: r.holds || [],
      changed: (r.src && last.get(r.src)) || '', uncommitted: r.src ? dirty.has(r.src) : false,
      locked: lock ? (lock.since || 'yes') : '', lockNote: lock && lock.note ? lock.note : '',
      reviewed: rev ? (rev.date || rev.at || 'yes') : '',
      phases: inPhase,
    };
  });
  const count = (/** @type {any[]} */ rs) => ({
    pages: rs.length,
    p2: rs.filter((r) => r.phase === 2).length,
    p1: rs.filter((r) => r.phase === 1).length,
    pq: rs.filter((r) => r.phase !== 1 && r.phase !== 2).length,
    locked: rs.filter((r) => r.locked).length,
    reviewed: rs.filter((r) => r.reviewed).length,
    uncommitted: rs.filter((r) => r.uncommitted).length,
  });
  const byArea = AREAS.map((a) => {
    const rs = rows.filter((/** @type {any} */ r) => r.area === a.id);
    return { id: a.id, label: a.label, ...count(rs), rows: rs };
  }).filter((a) => a.pages);
  // the ledger stamps UTC; an evening run in Utah is already tomorrow there, so the date is Mountain time
  const at = ledger.at ? new Date(ledger.at).toLocaleDateString('en-CA', { timeZone: TZ }) : '';
  return { at, summary: count(rows), byArea, rows };
}

module.exports = { AREAS, commits, history, sessions, parseNote, nextNoteId, phases, site, areaOfPath, shortName };
