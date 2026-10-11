'use strict';
/**
 * old-pages.js · a page that leaves the live site leaves a forward behind, or is let go on purpose.
 *
 * WHY. David, 2026-10-07: "Can we build in a function to make sure we delete old pages or archive them so they don't
 * get found". The live site is built clean on every push, so a page that moved or was removed simply stops existing
 * there. Anyone still holding its address (a search result, a Reddit post, a bookmark, a QR code) then lands on a 404.
 * So every page the last push carried that this build no longer makes must either forward (a redirect in netlify.toml,
 * the way the Goat Tracker and Device Assembly moved) or be listed in data-build/gone-pages.json as let go on purpose,
 * with the reason. A gone page 404s and drops out of search; it stays in git history if it is ever wanted back.
 *
 * WHERE IT RUNS. `npm run close` lists every such page and is NOT READY while one has neither; `npm run ship` refuses;
 * tests/old-pages.test.js fails in `npm test`. The comparison is against origin/main, the last push this computer knows.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const GONE = path.join(ROOT, 'data-build', 'gone-pages.json');
const PAGE = /\.(html|njk|md|liquid)$/;
const NOT_PAGES = /^src\/(_includes|_data|assets|downloads|brand)\//;

/** a template's own permalink: undefined if it has none, false if it makes no page */
function permalinkOf(text) {
  const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!fm) return undefined;
  const m = /^permalink:\s*(.+?)\s*$/m.exec(fm[1]);
  if (!m) return undefined;
  const v = m[1].replace(/^["']|["']$/g, '');
  return v === 'false' ? false : v;
}

/** the address a page template makes, or null for one that makes none or several (a paginated template) */
function urlOf(file, text) {
  const p = permalinkOf(text);
  if (p === false) return null;
  const fm = (/^---\r?\n([\s\S]*?)\r?\n---/.exec(text) || ['', ''])[1];
  if (/^pagination:/m.test(fm)) return null;
  if (p) return /{{|{%/.test(p) ? null : ('/' + p.replace(/^\/+/, '')).replace(/index\.html$/, '');
  const rel = file.replace(/\\/g, '/').replace(/^src\//, '').replace(PAGE, '');
  if (rel === 'index') return '/';
  return '/' + rel.replace(/(^|\/)index$/, '$1').replace(/\/?$/, '/');
}

const isPage = (f) => PAGE.test(f) && f.startsWith('src/') && !NOT_PAGES.test(f);

/** every page address a commit made, from git: Map url -> file */
function pagesAt(ref) {
  const ls = spawnSync('git', ['ls-tree', '-r', '--name-only', ref, '--', 'src'], { cwd: ROOT, encoding: 'utf8' });
  if (ls.status !== 0) return null;
  const files = ls.stdout.split('\n').filter(isPage);
  const cat = spawnSync('git', ['cat-file', '--batch'], { cwd: ROOT, input: files.map((f) => ref + ':' + f).join('\n') + '\n', maxBuffer: 256 * 1024 * 1024 });
  if (cat.status !== 0) return null;
  const buf = cat.stdout, out = new Map();
  let at = 0;
  for (const f of files) {
    const nl = buf.indexOf(10, at);
    const head = buf.slice(at, nl).toString('utf8').split(' ');
    const size = +head[2] || 0;
    const text = buf.slice(nl + 1, nl + 1 + size).toString('utf8');
    at = nl + 1 + size + 1;
    const u = urlOf(f, text);
    if (u) out.set(u, f);
  }
  return out;
}

/** every page address the working copy makes: Map url -> file */
function pagesNow() {
  const out = new Map();
  (function walk(dir) {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const f = dir + '/' + e.name;
      if (e.isDirectory()) { if (!NOT_PAGES.test(f + '/')) walk(f); continue; }
      if (!isPage(f)) continue;
      const u = urlOf(f, fs.readFileSync(path.join(ROOT, f), 'utf8'));
      if (u) out.set(u, f);
    }
  })('src');
  return out;
}

/** the addresses netlify.toml forwards */
function forwards() {
  const toml = fs.readFileSync(path.join(ROOT, 'netlify.toml'), 'utf8');
  return [...toml.matchAll(/^\s*from\s*=\s*"([^"]+)"/gm)].map((m) => m[1]);
}

/** does a forward catch this address: the same address (with or without the closing slash), or a splat above it */
function forwarded(url, froms) {
  const bare = (u) => u.replace(/\/+$/, '');
  return froms.some((f) => f.endsWith('/*') ? (url.startsWith(f.slice(0, -1)) || bare(url) === bare(f.slice(0, -2))) : bare(f) === bare(url));
}

function goneList() {
  try { return JSON.parse(fs.readFileSync(GONE, 'utf8')); } catch (e) { return {}; }
}

/**
 * The pages the last push carried that this build no longer makes, and what happens to each.
 * @returns {{ ref: string, error: string, left: Array<{ url: string, file: string, how: 'forward' | 'gone' | '' }> }}
 */
function leftPages(ref = 'origin/main') {
  const before = pagesAt(ref);
  if (!before) return { ref, error: 'there is no pushed commit to compare with (' + ref + ')', left: [] };
  const now = pagesNow(), froms = forwards(), gone = goneList();
  const left = [];
  for (const [url, file] of before) {
    if (now.has(url)) continue;
    left.push({ url, file, how: forwarded(url, froms) ? 'forward' : Object.prototype.hasOwnProperty.call(gone, url) ? 'gone' : '' });
  }
  return { ref, error: '', left: left.sort((a, b) => a.url.localeCompare(b.url)) };
}

module.exports = { leftPages, urlOf, permalinkOf, forwarded, pagesNow, pagesAt, GONE };
