#!/usr/bin/env node
'use strict';
/**
 * review.js — the server for the screens that never ship: the hub and the side-by-side review.
 *
 *   npm run hub              then open http://localhost:8081/__hub      (the board, the run sheet, QA)
 *   npm run review           the same server; http://localhost:8081/__review
 *
 * THE HUB (2026-10-04, DECISIONS HUB1) lives here too: scripts/hub/index.js answers everything
 * under /__hub before the rest of this file sees the request. One server, one address, so David
 * has one thing to open on his computer and on his phone.
 *
 * WHY THIS EXISTS. David reviews the site by opening pages on a phone and a laptop and holding
 * them next to each other, which is slow and means the two views are never on the same page at
 * the same moment. This serves the BUILT site and a review UI from ONE origin, so the desktop
 * frame and the phone frame can be driven together: pick a page once, see both, and when you
 * click a link in the desktop frame the phone frame follows it.
 *
 * It is a DEV TOOL and deliberately lives in scripts/ rather than src/, so it can never ship.
 * Same-origin is the whole trick: the site sets X-Frame-Options SAMEORIGIN and frame-ancestors
 * 'self', so a review page served from anywhere else could not frame these pages at all.
 *
 * Run `npm run build` first, or the pages will be whatever the last build left.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const MIRROR = require('./mirror-snippet');
const hub = require('./hub');

const ROOT = path.join(__dirname, '..');
const SITE = path.join(ROOT, '_site');
const ASSETS = path.join(ROOT, 'src', 'assets');
const PORT = Number(process.env.REVIEW_PORT || 8081);
const PORT_FILE = path.join(ROOT, 'tmp', 'hub', 'server.json');
/* The two Data Observatory pages on the site carry an empty marker in their tab row. Served from
   here, it becomes the way back to the hub; on the live site it stays a comment. */
const HUB_LINK = '<a class="toggle-chip" href="/__hub">Hub</a>';
/** @param {Buffer} data */
const page = (data) => data.toString('utf8').replace('<!--hub-link-->', HUB_LINK).replace('</body>', MIRROR + '</body>');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.ttf': 'font/ttf', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
  '.wasm': 'application/wasm', '.pdf': 'application/pdf', '.csv': 'text/csv',
};

/** Every built page, as a URL path, shallowest first then alphabetical. */
function pages() {
  const out = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name === 'index.html') {
        /* Skip redirect stubs. /SM/ is a deliberate shortcut that bounces to /secret-menu/, and
           listing it traps the stepper: next lands on /SM/, the redirect snaps the index back to
           /secret-menu/, and next sends you to /SM/ again, forever. A page that immediately
           becomes another page is not a page you can review. */
        const head = fs.readFileSync(p, 'utf8').slice(0, 1200);
        if (/http-equiv=["']refresh["']/i.test(head)) continue;
        const rel = path.relative(SITE, p).split(path.sep).slice(0, -1).join('/');
        out.push('/' + (rel ? rel + '/' : ''));
      }
    }
  })(SITE);
  return out.sort((a, b) => {
    const da = a.split('/').length, db = b.split('/').length;
    return da - db || a.localeCompare(b);
  });
}

/** @type {{t:number, body:string}|null} */
let ledgerCache = null;
let bound = PORT;

const server = http.createServer((req, res) => {
  if (hub.handle(req, res, { port: bound })) return;
  const url = req.url.split('?')[0];

  if (url === '/__review' || url === '/__review/') {
    const html = fs.readFileSync(path.join(__dirname, 'review.html'));
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(html);
  }
  /* THE RUN (2026-10-11): the pages this round of the review walks, in order (data-build/review-run.json, read fresh) */
  if (url === '/__review/run.json') {
    let run = null;
    try { run = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data-build', 'review-run.json'), 'utf8')); } catch (e) { run = null; }
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify(run && Array.isArray(run.pages) ? { name: run.name, since: run.since, pages: run.pages } : null));
  }
  if (url === '/__review/pages.json') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify(pages()));
  }
  /* THE BOARD (2026-10-03, docs/HU-CONSISTENCY-TOOLKIT-2026-10-03.md). The page ledger, worked
     out fresh (a few seconds, so held for 20), the writing rules so a page's findings can be read
     off the desktop frame, and David's "Reviewed" mark saved where git keeps it. */
  if (url === '/__review/ledger.json') {
    const now = Date.now();
    if (!ledgerCache || now - ledgerCache.t > 20000 || req.url.includes('fresh=1')) ledgerCache = { t: now, body: JSON.stringify(require('./ledger').compute()) };
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    return res.end(ledgerCache.body);
  }
  if (url === '/__review/rules.js') {
    res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store' });
    return res.end(fs.readFileSync(path.join(__dirname, 'lib', 'writing-rules.js')));
  }
  if (url === '/__review/review' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 1e5) req.destroy(); });
    req.on('end', () => {
      try {
        // a mark per theme since 2026-10-11 (scripts/lib/reviews.js): the screen sends the theme it was looking in
        const { page, note, reviewed, theme } = JSON.parse(body || '{}');
        const which = theme === 'light' || theme === 'day' ? 'day' : 'night';
        const review = require('./lib/reviews').set(page, which, note, reviewed);
        ledgerCache = null;
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true, review }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: String(e && e.message || e) }));
      }
    });
    return;
  }
  /* LIVE (2026-09-23, David: "let me see in real time the changes"). The review screen polls this
     and reloads both frames when it moves: the newest time among the page as the dev server last
     built it and the shared CSS and JS. */
  if (url === '/__review/stamp') {
    const p = new URL(req.url, 'http://x').searchParams.get('p') || '/';
    const page = path.join(SITE, decodeURIComponent(p), 'index.html');
    let t = 0;
    const stat = (f) => { try { t = Math.max(t, fs.statSync(f).mtimeMs); } catch (e) { /* not built yet */ } };
    if (page.startsWith(SITE)) stat(page);
    for (const d of ['css', 'js']) {
      const dir = path.join(ASSETS, d);
      try { for (const f of fs.readdirSync(dir)) stat(path.join(dir, f)); } catch (e) { /* no such folder */ }
    }
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify({ t }));
  }

  /* /assets/ comes straight from src/assets. The build copies that folder unchanged, but the dev
     server only writes it on a full build, so _site/assets lags an edit and Live would reload into
     stale CSS and JS. */
  if (url.startsWith('/assets/')) {
    const src = path.join(ASSETS, decodeURIComponent(url.slice('/assets/'.length)));
    if (src.startsWith(ASSETS) && fs.existsSync(src) && fs.statSync(src).isFile()) {
      res.writeHead(200, { 'Content-Type': MIME[path.extname(src).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      return fs.createReadStream(src).pipe(res);
    }
  }

  let file = path.join(SITE, decodeURIComponent(url));
  if (url.endsWith('/')) file = path.join(file, 'index.html');
  if (!file.startsWith(SITE)) { res.writeHead(403); return res.end(); }

  fs.readFile(file, (err, data) => {
    if (err) {
      // a directory URL without its trailing slash, then the 404 page
      const alt = path.join(SITE, decodeURIComponent(url), 'index.html');
      return fs.readFile(alt, (e2, d2) => {
        if (!e2) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          return res.end(page(d2));
        }
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>404</h1><p>' + url + ' is not in _site. Rebuild?</p>');
      });
    }
    const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
    if (type.startsWith('text/html')) {
      res.writeHead(200, { 'Content-Type': type });
      return res.end(page(data));
    }
    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  });
});

/** Start the server. Port 0 takes any free port (the picture script and the tests use that).
 *  @param {number} [port] @param {{quiet?:boolean}} [opt] @returns {Promise<{port:number, close:() => Promise<void>}>} */
function start(port = PORT, opt = {}) {
  if (!fs.existsSync(SITE)) throw new Error('No _site/ directory. Run `npm run build` first.');
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, () => {
      bound = /** @type {import('net').AddressInfo} */ (server.address()).port;
      const named = port !== 0;   // only the server someone opened on purpose is "the hub"
      if (named) {
        fs.mkdirSync(path.dirname(PORT_FILE), { recursive: true });
        fs.writeFileSync(PORT_FILE, JSON.stringify({ port: bound, pid: process.pid }) + '\n');
        const gone = () => { try { fs.rmSync(PORT_FILE); } catch (e) { /* already gone */ } };
        process.on('exit', gone);
        for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { gone(); process.exit(0); });
      }
      if (!opt.quiet) {
        const addr = hub.lan()[0];
        console.log('');
        console.log('  The hub:        http://localhost:' + bound + '/__hub');
        if (addr) console.log('  On your phone:  http://' + addr + ':' + bound + '/__hub   (home wifi)');
        console.log('  Review screen:  http://localhost:' + bound + '/__review');
        console.log('  Serving _site with ' + pages().length + ' pages. Rebuild with `npm run build` to refresh.');
        console.log('  Ctrl+C to stop.');
        console.log('');
      }
      resolve({ port: bound, close: () => new Promise((done) => server.close(() => done())) });
    });
  });
}

// run directly, or required by a launcher that has named the port (.claude/launch.json does)
if (require.main === module || process.env.REVIEW_PORT) {
  start().catch((e) => {
    if (e && e.code === 'EADDRINUSE') { console.log('The hub is already running: http://localhost:' + PORT + '/__hub'); process.exit(0); }
    console.error(String(e && e.message || e));
    process.exit(1);
  });
}

module.exports = { start, PORT_FILE };
