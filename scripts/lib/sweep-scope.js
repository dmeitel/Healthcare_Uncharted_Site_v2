'use strict';
/**
 * sweep-scope.js · which pages the full check's viewport sweep reads (2026-10-21).
 *
 * David, 2026-10-21: "some of these checks end up going massivly long because they are doing whole site sweeps do we
 * really need to do that/?", then "Yes, make the check sweep only the pages a change touches, with the whole site when a
 * shared file changes." The sweep read all 63 pages at nine sizes in both themes, 57 minutes, for a push that changed one
 * page (Daily Huddle and its question file).
 *
 * The rule, file by file, for everything that changed since the last push (origin/main, committed or not):
 *   - a file every page loads (the site layout, hu-global.css, the kit, the brand; scripts/lib/session.js SHARED) -> the
 *     WHOLE SITE; so do the phone check itself, the build's config and the locked packages;
 *   - a page's own template, or a file in its folder -> that page;
 *   - an asset (a script, a stylesheet, a data file, an image) -> the pages whose built HTML names it, or names a script
 *     or stylesheet that names it; more than SPREAD pages -> the whole site;
 *   - a layout piece or a global data file -> the pages whose templates name it, followed through the layout pieces that
 *     name it (blog-feedback.njk reaches the blog's pages); the site layout, base.njk, anywhere on the way -> the whole site;
 *   - anything under src/ the rules cannot place -> the WHOLE SITE. Unsure is never a reason to skip a page.
 * Files outside src/ (docs, tests, scripts, the board) build nothing a visitor sees and add no page.
 * Each decision carries its reason, and the check prints them, so a short sweep never reads as a full one.
 */
const fs = require('fs');
const path = require('path');
const { ROOT, changedFiles, urlOf, pageBeside, SHARED, PARTS, git } = require('./session');

const SITE = path.join(ROOT, '_site');
const SPREAD = 15;   // an asset more pages than this load is as good as shared
/** Outside src/, the files whose change can move any page or how a page is read: the build's config, the packages, and
 *  the phone check itself. This file is not one: it picks which pages are read, not how, and tests/sweep-scope.test.js
 *  holds its rules. */
const WHOLE_OUTSIDE = /^(?:\.eleventy\.js|package-lock\.json|scripts\/phone-check\.js|scripts\/phone-batches\.js|scripts\/lib\/view-walk\.js)$/;
/** Under src/, files that build no page and change none (the crawler file, the install manifest, the security contact). */
const NO_PAGE = /^src\/(?:robots\.txt|site\.webmanifest|\.well-known\/)/;

function walk(dir, out = []) {
  let list = [];
  try { list = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of list) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } };

/**
 * @param {{ref?:string, changed?:{code:string,file:string}[], live?:string[], html?:Record<string,string>}} [o]
 *   ref: what to compare against (default origin/main when this computer knows it, else the last commit); changed, live
 *   and html stand in for git, the ledger and the built pages in a test
 * @returns {{whole:boolean, pages:string[], why:string[], files:number}}
 */
function sweepScope(o = {}) {
  const ref = o.ref !== undefined ? o.ref : (git(['rev-parse', '--verify', '--quiet', 'origin/main']) ? 'origin/main' : undefined);
  const changed = o.changed || changedFiles(ref);
  const live = o.live || [...require('../ledger').liveUrls().keys()].filter((u) => fs.existsSync(path.join(SITE, u, 'index.html')));
  /** @type {Record<string,string>} */
  const html = o.html || Object.fromEntries(live.map((u) => [u, read(path.join(SITE, u, 'index.html'))]));
  const liveSet = new Set(live);
  const pages = new Set();
  const why = [];
  let whole = false;
  const all = (file, reason) => { whole = true; why.push(`${file}: ${reason}, so the whole site`); };
  const some = (file, us, reason) => {
    const keep = us.filter((u) => liveSet.has(u));
    keep.forEach((u) => pages.add(u));
    why.push(`${file}: ${reason}${keep.length ? ' (' + keep.join(', ') + ')' : ''}`);
  };

  // the scripts and stylesheets under src/assets, read once, for the pages an asset reaches through them
  let assetText = null;
  const assetFiles = () => {
    if (assetText) return assetText;
    assetText = {};
    // without their comments: hu-global.css names hu-views.js in a note, and every page loads hu-global.css
    for (const f of walk(path.join(ROOT, 'src', 'assets'))) {
      if (/\.(?:js|mjs|css)$/.test(f)) assetText[rel(f)] = read(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    }
    return assetText;
  };
  /** the live pages whose built HTML names `needle` */
  const naming = (needle) => live.filter((u) => html[u] && html[u].includes(needle));
  /** pages an asset reaches: named in a page, or in a script or stylesheet a page loads, three steps deep at most */
  function reach(file) {
    const pub = '/' + file.replace(/^src\//, '');
    const base = path.basename(file);
    const found = new Set([...naming(pub), ...naming(base)]);
    let wave = [base];
    const seen = new Set([file]);
    for (let step = 0; step < 3 && wave.length; step++) {
      const next = [];
      for (const [f, text] of Object.entries(assetFiles())) {
        if (seen.has(f) || !wave.some((b) => text.includes(b))) continue;
        seen.add(f);
        naming('/' + f.replace(/^src\//, '')).forEach((u) => found.add(u));
        next.push(path.basename(f));
      }
      wave = next;
    }
    return [...found];
  }
  /** the templates under src, read once */
  let tpl = null;
  const templates = () => {
    if (tpl) return tpl;
    tpl = {};
    for (const f of walk(path.join(ROOT, 'src'))) {
      const r = rel(f);
      if (/\.(?:html|njk|md|11ty\.js)$/.test(r) && !/^src\/(?:_data|assets)\//.test(r)) tpl[r] = read(f);
    }
    return tpl;
  };
  /** the pages whose templates name `word`, followed through the layout pieces that name it (blog-feedback.njk reaches
   *  the blog's pages); null when the site layout, base.njk, is on the way or the trail runs deeper than four pieces */
  function namedBy(word, depth = 0, seen = new Set(), asData = false) {
    if (depth > 4) return null;
    const esc = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // a data file is named by its key used as a variable, inside {{ }} or {% %} or as data.key in a .11ty.js page, not by
    // the same word in prose ("site", "rounds" and "facility" are words too)
    // (and not as a quoted word or a piece of an address either: base.njk's section == 'rounds' and page.url == '/tools/'
    // name a section and a page, not the data files)
    const re = asData ? new RegExp('(?:\\{\\{|\\{%)[^}]*?(?<![\\w.$\'"/-])' + esc + '(?![\\w$\'"/-])|\\bdata\\.' + esc + '\\b')
      : new RegExp('(?:^|[^A-Za-z0-9_$])' + esc + '(?:[^A-Za-z0-9_$]|$)');
    const us = new Set();
    for (const [r, text] of Object.entries(templates())) {
      if (seen.has(r) || !re.test(text)) continue;
      if (/^src\/_includes\//.test(r)) {
        if (r === 'src/_includes/base.njk') return null;
        seen.add(r);
        const up = namedBy(r.replace(/^src\/_includes\//, ''), depth + 1, seen);
        if (up === null) return null;
        up.forEach((u) => us.add(u));
        continue;
      }
      const u = urlOf(r) || pageBeside(r);
      if (u) us.add(u);
    }
    return [...us];
  }

  for (const { code, file } of changed) {
    if (!file.startsWith('src/')) {
      if (WHOLE_OUTSIDE.test(file)) all(file, 'the build or the gate itself changed');
      continue;
    }
    if (NO_PAGE.test(file)) continue;
    const gone = code.includes('D');
    if (file === 'src/_includes/base.njk') { all(file, 'every page is built on it'); continue; }
    // a layout piece is placed below by who names it; the rest of SHARED (the global stylesheet, the kit, the brand) is
    // loaded by every page
    if (SHARED.test(file) && !file.startsWith('src/_includes/')) { if (!gone) all(file, 'every page loads it'); continue; }
    const part = PARTS.find((p) => p.test.test(file));
    if (part) { some(file, part.pages, 'the pages that use it'); continue; }

    if (/^src\/(?:assets|downloads)\//.test(file)) {
      const us = reach(file);
      if (us.length > SPREAD) all(file, `${us.length} pages load it`);
      else if (us.length) some(file, us, 'the pages that load it');
      else if (gone) why.push(`${file}: removed, and no page names it`);
      else all(file, 'no page names it, so the check cannot tell which pages it moves');
      continue;
    }
    if (gone) continue;   // a removed page has nothing left to read; the build fails on a removed piece still in use
    if (/^src\/_data\//.test(file)) {
      const us = namedBy(path.basename(file).replace(/\.(?:js|json|cjs|mjs)$/, ''), 0, new Set(), true);
      if (us === null) all(file, 'the site layout reads it');
      else if (us.length) some(file, us, 'the pages that read it');
      else all(file, 'no template names it, so the check cannot tell which pages it moves');
      continue;
    }
    if (/^src\/_includes\//.test(file)) {
      const name = file.replace(/^src\/_includes\//, '');
      const us = namedBy(name);
      if (us === null) all(file, 'the site layout uses it');
      else if (us.length) some(file, us, 'the pages that use it');
      else all(file, 'no template names it, so the check cannot tell which pages it moves');
      continue;
    }
    const u = urlOf(file) || pageBeside(file);
    if (u) {
      // a template that writes pages of its own (a .11ty.js beside a page) reaches the pages under that page too
      const us = /\.11ty\.js$/.test(file) ? live.filter((x) => x.startsWith(u)) : [u];
      some(file, us, /\.11ty\.js$/.test(file) ? 'the pages it writes' : 'its page');
      continue;
    }
    all(file, 'the check cannot tell which page it belongs to');
  }
  return { whole, pages: whole ? live.slice().sort() : [...pages].sort(), why, files: changed.length };
}

module.exports = { sweepScope, SPREAD, WHOLE_OUTSIDE };

if (require.main === module) {
  const s = sweepScope();
  console.log(`\nThe sweep for ${s.files} changed file(s): ${s.whole ? 'THE WHOLE SITE' : s.pages.length + ' page(s)'}\n`);
  s.why.forEach((w) => console.log('  ' + w));
  if (!s.whole) s.pages.forEach((u) => console.log('  sweeps ' + u));
}
