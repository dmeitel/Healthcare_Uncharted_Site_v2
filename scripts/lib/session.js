'use strict';
/**
 * session.js · what the open and close routines, the hub and the ship step all need: git, one
 * clock, the side worktrees, and which live page a changed file belongs to.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'src');

/** @param {string[]} a @returns {string} */
function git(a) {
  try { return execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return ''; }
}

/** @param {string} f repo-relative @returns {any} */
function readJson(f) {
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8')); } catch { return null; }
}

/* ONE CLOCK. The site keeps Mountain time (the daily wall is `day:YYYY-MM-DD` there), and on
   2026-10-04 a shell reading UTC put the next day's date on seven locks and a close note. Every
   date and time a routine writes comes from these two, never from a bare `new Date()` string. */
const TZ = 'America/Denver';

/** Today's date in Mountain time, YYYY-MM-DD. @param {Date} [d] */
function today(d = new Date()) { return d.toLocaleDateString('en-CA', { timeZone: TZ }); }

/** A moment in Mountain time, "YYYY-MM-DD HH:mm". @param {Date} [d] */
function stamp(d = new Date()) {
  const t = d.toLocaleTimeString('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false });
  return today(d) + ' ' + t;
}

/** @param {string} d YYYY-MM-DD, "YYYY-MM-DD HH:mm" or ISO @returns {number|null} */
function daysAgo(d) {
  const t = Date.parse(String(d).replace(' ', 'T'));
  return Number.isNaN(t) ? null : Math.floor((Date.now() - t) / 86400000);
}

/** @param {number|null} n */
const ago = (n) => (n == null ? 'never' : n === 0 ? 'today' : n === 1 ? 'yesterday' : n + ' days ago');

/** Every worktree but this one, with what it holds that main does not. The 2026-09-23 trap:
 *  six side tasks finished in .claude/worktrees/ and none of it shipped.
 *  @returns {{name:string, dir:string, branch:string, dirty:number, ahead:number}[]} */
function sideTrees() {
  const blocks = git(['worktree', 'list', '--porcelain']).split(/\n\n+/).filter(Boolean);
  const here = path.resolve(ROOT).toLowerCase();
  return blocks.map((b) => {
    const dir = (b.match(/^worktree (.+)$/m) || [])[1] || '';
    const br = ((b.match(/^branch (.+)$/m) || [])[1] || '').replace('refs/heads/', '');
    return { dir, br };
  }).filter((t) => t.dir && path.resolve(t.dir).toLowerCase() !== here).map((t) => {
    let dirty = 0;
    try { dirty = execFileSync('git', ['-C', t.dir, 'status', '--porcelain'], { encoding: 'utf8' }).split('\n').filter(Boolean).length; } catch { dirty = -1; }
    const ahead = t.br ? Number(git(['rev-list', '--count', 'HEAD..' + t.br]) || 0) : 0;
    return { name: path.basename(t.dir), dir: t.dir, branch: t.br, dirty, ahead };
  });
}

/** Every file that differs, one path each, untracked ones included.
 *  With no `ref`: against the last commit (what a close checks). With a ref such as
 *  'origin/main': everything since that point, committed or not (what a milestone's QA covers).
 *  @param {string} [ref] @returns {{code:string, file:string}[]} */
function changedFiles(ref) {
  const clean = (/** @type {string} */ f) => f.trim().replace(/^"|"$/g, '');
  if (!ref) {
    return git(['status', '--porcelain', '-uall']).split('\n').filter(Boolean).map((l) => {
      let f = l.slice(3);
      if (f.includes(' -> ')) f = f.split(' -> ')[1];
      return { code: l.slice(0, 2), file: clean(f) };
    });
  }
  const out = git(['diff', '--name-status', ref]).split('\n').filter(Boolean).map((l) => {
    const parts = l.split('\t');
    return { code: parts[0].slice(0, 1).padEnd(2), file: clean(parts[parts.length - 1]) };
  });
  for (const f of git(['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean)) out.push({ code: '??', file: clean(f) });
  return out;
}

/** The address a page template builds to, the way scripts/ledger.js works it out: a permalink
 *  in its front matter, or its folder. Null for anything that is not a page.
 *  @param {string} rel repo-relative path under src/ @returns {string|null} */
function urlOf(rel) {
  const r = rel.replace(/^src\//, '');
  if (!/^src\//.test(rel) || /^(?:_includes|_data|assets|brand)\//.test(r) || !/\.(?:html|njk|md)$/.test(r)) return null;
  let head = '';
  try { head = fs.readFileSync(path.join(ROOT, rel), 'utf8').slice(0, 2500); } catch { return null; }
  const fm = head.startsWith('---') ? head.slice(3, head.indexOf('\n---', 3)) : '';
  const pl = fm.match(/^permalink:\s*["']?([^"'\n]+?)["']?\s*$/m);
  if (pl && /^false$/i.test(pl[1])) return null;
  if (pl) {
    const u = (pl[1].startsWith('/') ? pl[1] : '/' + pl[1]).replace(/index\.html$/, '');
    return /\.(?:xml|txt|json)$/.test(u) ? null : u;   // a feed or a stamp is not a page
  }
  const noExt = r.replace(/\.(?:html|njk|md)$/, '');
  const url = noExt === 'index' ? '/' : noExt.endsWith('/index') ? '/' + noExt.slice(0, -5) : '/' + noExt + '/';
  return url.replace(/index\.html$/, '');
}

/** Files every page loads. A change to one of them can move any page, so the whole site is due
 *  a sweep, not just the pages beside it. */
const SHARED = /^src\/(?:_includes\/base\.njk|_includes\/components\/(?!obs-)|assets\/css\/hu-global\.css|assets\/js\/hu-(?:kit|search|icons|table|save|rng)\.js|brand\/)/;

/** Shared pieces that belong to a known set of pages, not to every page. */
const PARTS = [
  { test: /^src\/(?:_includes\/components\/obs-|assets\/css\/observatory\.css)/, pages: ['/secret-menu/data-observatory/', '/secret-menu/data-observatory/traffic/'] },
];

/** A page's own files sit beside it: walk up from a changed file to the nearest page template.
 *  @param {string} file repo-relative @returns {string|null} */
function pageBeside(file) {
  if (!file.startsWith('src/')) return null;
  let dir = path.dirname(path.join(ROOT, file));
  while (dir.startsWith(SRC) && dir !== SRC) {
    for (const name of ['index.html', 'index.njk', 'index.md']) {
      const f = path.join(dir, name);
      if (fs.existsSync(f)) return urlOf(path.relative(ROOT, f).split(path.sep).join('/'));
    }
    dir = path.dirname(dir);
  }
  return null;
}

/** Which live pages a set of changes touches. Worked out from git, never from memory. `when` is
 *  each page's last change (the newest of its files, ms), so a QA mark older than it is stale.
 *  @param {string} [ref] see changedFiles
 *  @returns {{changed:{code:string,file:string}[], pages:string[], shared:string[], when:Record<string, number>}} */
function touchedPages(ref) {
  const changed = changedFiles(ref);
  /** @type {Set<string>} */
  const pages = new Set();
  const shared = [];
  /** @type {Record<string, number>} */
  const when = {};
  const add = (/** @type {string} */ u, /** @type {string} */ file) => {
    pages.add(u);
    try { const t = fs.statSync(path.join(ROOT, file)).mtimeMs; if (!(when[u] >= t)) when[u] = t; } catch { /* gone */ }
  };
  for (const { code, file } of changed) {
    if (code.includes('D')) continue;   // a deleted page has nothing left to check
    if (SHARED.test(file)) { shared.push(file); continue; }
    const part = PARTS.find((p) => p.test.test(file));
    if (part) { part.pages.forEach((u) => add(u, file)); continue; }
    if (/^src\/(?:_includes|_data|assets|brand)\//.test(file)) continue;
    const u = urlOf(file) || pageBeside(file);
    if (u) add(u, file);
  }
  return { changed, pages: [...pages].filter((u) => u !== '/404.html').sort(), shared, when };
}

module.exports = { ROOT, TZ, git, readJson, today, stamp, daysAgo, ago, sideTrees, changedFiles, urlOf, pageBeside, touchedPages, SHARED, PARTS };
