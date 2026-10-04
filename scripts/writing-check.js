#!/usr/bin/env node
'use strict';
/**
 * writing-check.js · the writing checker on the command line. Same rules as the review screen
 * (scripts/lib/writing-rules.js); this is how a session checks prose before handing it over,
 * and how the reviewer panel gets its machine findings.
 *
 *   npm run writing:check -- <draft.md>                  a file, Markdown or plain text
 *   npm run writing:check -- <name>                      a draft saved from the screen
 *   npm run writing:check -- /rounds/some-piece/         a built page, read after its scripts draw
 *   npm run writing:check -- --all                       every built page, static text, one table
 *   npm run writing:check -- --all --baseline            rewrite tests/writing-baseline.json
 *
 *   --voice <rounds|learn|tools|site|professional|advocacy>   the register (pages pick their own)
 *   --json                                                    machine-readable
 *   --text                                                    print the text as read, and its fingerprint
 *                                                             (what the reviewer panel reads)
 *
 * Exits 1 when anything is a must-fix, so a script can stop on it.
 */
const fs = require('fs');
const path = require('path');
const W = require('./lib/writing-rules');
const { readImageMeta, describe } = require('./lib/image-meta');

const ROOT = path.join(__dirname, '..');
const SITE = path.join(ROOT, '_site');
const DRAFTS = path.join(ROOT, 'private', 'writing', 'drafts');
const BASELINE = path.join(ROOT, 'tests', 'writing-baseline.json');

const args = process.argv.slice(2);
const flag = (/** @type {string} */ k) => args.includes(k);
const opt = (/** @type {string} */ k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const targets = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1] === '--voice'));
const VOICE = opt('--voice');
const JSON_OUT = flag('--json');

/** Every built page as [url, html], redirect stubs skipped. */
function builtPages() {
  const out = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (!(dir === SITE && /^(assets|brand)$/.test(e.name))) walk(p); }
      else if (e.name === 'index.html') {
        const html = fs.readFileSync(p, 'utf8');
        if (/http-equiv=["']refresh["']/i.test(html.slice(0, 1500))) continue;
        const rel = path.relative(SITE, p).split(path.sep).slice(0, -1).join('/');
        out.push(['/' + (rel ? rel + '/' : ''), html]);
      }
    }
  })(SITE);
  return out.sort((a, b) => a[0].localeCompare(b[0]));
}

/** The static-text check the gates use: what a built page ships, no browser. @param {string} url @param {string} html */
function staticCheck(url, html) {
  const x = W.htmlToBlocks(html);
  return W.check(x.blocks, { register: VOICE || W.registerForPath(url, html), guest: x.guest, links: x.links });
}

/** @param {any} r @param {string} label @param {{src:string, note:string, bad:boolean}[]} [photos] */
function print(r, label, photos) {
  if (JSON_OUT) {
    console.log(JSON.stringify({ label, register: r.register, counts: r.counts, stats: r.stats, piece: r.piece, photos: photos || [], flags: r.flags.map((/** @type {any} */ f) => Object.assign({ name: W.RULES[f.rule].name, why: W.RULES[f.rule].why, source: W.SOURCES[W.RULES[f.rule].src] }, f, { block: r.blocks ? r.blocks[f.b] && r.blocks[f.b].kind : undefined })) }, null, 2));
    return;
  }
  const reg = W.REGISTERS.find(x => x.id === r.register);
  console.log('');
  console.log(reg.name + ' · ' + label + ' · ' + r.stats.words + ' words, reading grade about ' + r.stats.grade);
  console.log('  ' + r.counts.block + ' must fix · ' + r.counts.warn + ' fix · ' + r.counts.check + ' read again');
  for (const layer of ['phi', 'pro', 'voice']) {
    const fs_ = r.flags.filter((/** @type {any} */ f) => f.layer === layer);
    console.log('');
    console.log(W.LAYERS[layer].name.toUpperCase() + (fs_.length ? '' : '  nothing found'));
    for (const f of fs_) {
      const rule = W.RULES[f.rule];
      console.log('  ' + W.LEVELS[f.level].name.toLowerCase().padEnd(11) + rule.name);
      console.log('             "' + f.text.replace(/\s+/g, ' ').slice(0, 110) + (f.text.length > 110 ? '…' : '') + '"');
      console.log('             ' + (f.msg ? f.msg + ' ' : '') + rule.why + (f.fix ? ' Try: ' + f.fix : ''));
    }
  }
  if (r.piece && r.piece.length) {
    console.log('');
    console.log('THE PIECE');
    for (const p of r.piece) console.log('  ' + (p.state === 'pass' ? 'yes  ' : p.state === 'miss' ? 'no   ' : 'judge') + '  ' + p.label + (p.note ? ': ' + String(p.note).slice(0, 100) : ''));
  }
  if (photos && photos.length) {
    console.log('');
    const bad = photos.filter(p => p.bad);
    console.log('PHOTOS  ' + photos.length + (bad.length ? ', ' + bad.length + ' carry hidden data' : ', all clean'));
    for (const p of bad) console.log('  ' + p.src + ': ' + p.note);
  }
  console.log('');
}

/** A built page read the way the screen reads it: in a browser, after its scripts draw. @param {string} url */
async function livePage(url) {
  const { chromium } = require('playwright');
  const server = await require('./writing.js').start(0);
  const port = /** @type {any} */ (server.address()).port;
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto('http://localhost:' + port + url, { waitUntil: 'load' });
    await page.waitForTimeout(900);
    await page.addScriptTag({ path: path.join(__dirname, 'lib', 'writing-rules.js') });
    const x = await page.evaluate(() => /** @type {any} */ (window).HUWriting.extractBlocks(document));
    const html = fs.readFileSync(path.join(SITE, url, 'index.html'), 'utf8');
    const r = W.check(x.blocks, { register: VOICE || W.registerForPath(url, html), guest: x.guest, links: x.links });
    r.blocks = x.blocks;
    const photos = x.images.map((/** @type {string} */ src) => {
      const rel = src.replace(/^https?:\/\/[^/]+/, '').split('?')[0];
      const file = rel.startsWith('/assets/') ? path.join(ROOT, 'src', 'assets', rel.slice(8)) : path.join(SITE, rel);
      if (!fs.existsSync(file)) return { src, note: 'not in the build', bad: false };
      const m = readImageMeta(fs.readFileSync(file));
      return { src, note: describe(m), bad: m.gps || m.exif || m.xmp || m.iptc };
    });
    return { r, photos };
  } finally { await browser.close(); server.close(); }
}

async function main() {
  if (flag('--all')) {
    if (!fs.existsSync(SITE)) { console.error('No _site/. Run `npm run build` first.'); process.exit(2); }
    const rows = builtPages().map(([url, html]) => { const r = staticCheck(url, html); return { url, reg: r.register, counts: r.counts }; });
    if (flag('--baseline')) {
      /** @type {Object<string, number>} */
      const base = {};
      for (const row of rows) if (row.counts.warn) base[row.url] = row.counts.warn;
      const doc = { '//': 'Voice and tone "fix" findings per built page, from npm run writing:check -- --all --baseline. A page may lose findings, never gain them; a page not listed must have none. Raise a number only on purpose, and say why in the commit.', pages: base };
      fs.writeFileSync(BASELINE, JSON.stringify(doc, null, 2) + '\n');
      console.log('Wrote ' + path.relative(ROOT, BASELINE) + ': ' + Object.keys(base).length + ' pages, ' + Object.values(base).reduce((a, b) => a + b, 0) + ' findings.');
      return;
    }
    if (JSON_OUT) { console.log(JSON.stringify(rows, null, 2)); return; }
    console.log('page'.padEnd(52) + 'voice'.padEnd(14) + 'must fix  fix  read again');
    for (const row of rows) console.log(row.url.padEnd(52) + row.reg.padEnd(14) + String(row.counts.block).padStart(8) + String(row.counts.warn).padStart(5) + String(row.counts.check).padStart(12));
    const t = rows.reduce((a, r) => ({ block: a.block + r.counts.block, warn: a.warn + r.counts.warn, check: a.check + r.counts.check }), { block: 0, warn: 0, check: 0 });
    console.log('\n' + rows.length + ' pages: ' + t.block + ' must fix, ' + t.warn + ' fix, ' + t.check + ' read again. Static text only; a page\'s drawn text needs its own path.');
    if (t.block) process.exitCode = 1;
    return;
  }
  if (!targets.length) { console.log(fs.readFileSync(__filename, 'utf8').match(/\/\*\*[\s\S]*?\*\//)[0]); process.exit(2); }

  for (const raw of targets) {
    // Git Bash rewrites "/rounds/x/" into "C:/Program Files/Git/rounds/x/"; take the site path back.
    const t = raw.replace(/^[A-Za-z]:[\\/]Program Files[\\/]Git(?=[\\/])/, '').replace(/\\/g, '/');
    let r, label = t, photos;
    if (t.startsWith('/')) {
      const url = t.endsWith('/') ? t : t + '/';
      if (!fs.existsSync(path.join(SITE, url, 'index.html'))) { console.error(url + ' is not in _site. Build first.'); process.exitCode = 2; continue; }
      ({ r, photos } = await livePage(url));
    } else if (fs.existsSync(t)) {
      r = W.checkText(fs.readFileSync(t, 'utf8'), { register: VOICE || 'rounds' });
    } else {
      const f = path.join(DRAFTS, require('./writing.js').slugify(t) + '.json');
      if (!fs.existsSync(f)) { console.error('No file and no saved draft called "' + t + '".'); process.exitCode = 2; continue; }
      const d = JSON.parse(fs.readFileSync(f, 'utf8'));
      r = W.checkText(d.text, { register: VOICE || d.register });
      label = d.title + ' (saved draft)';
    }
    if (flag('--text')) {
      // The panel reads exactly this. The fingerprint is of the plain text, the same way the
      // screen computes it, so a panel can be marked as read on an older version.
      const plain = r.blocks.map((/** @type {any} */ b) => b.text).join('\n');
      console.log('<!-- ' + label + ' · ' + r.register + ' · fingerprint ' + W.hashText(plain) + ' -->\n');
      console.log(W.blocksToText(r.blocks));
      continue;
    }
    print(r, label, photos);
    if (r.counts.block) process.exitCode = 1;
  }
}

main().catch(e => { console.error(e); process.exit(2); });
