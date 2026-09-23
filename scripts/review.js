#!/usr/bin/env node
'use strict';
/**
 * review.js — the side-by-side review screen.
 *
 *   npm run review           then open http://localhost:8081/__review
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

const ROOT = path.join(__dirname, '..');
const SITE = path.join(ROOT, '_site');
const PORT = Number(process.env.REVIEW_PORT || 8081);

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

if (!fs.existsSync(SITE)) {
  console.error('No _site/ directory. Run `npm run build` first.');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];

  if (url === '/__review' || url === '/__review/') {
    const html = fs.readFileSync(path.join(__dirname, 'review.html'));
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(html);
  }
  if (url === '/__review/pages.json') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify(pages()));
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
          return res.end(d2.toString('utf8').replace('</body>', MIRROR + '</body>'));
        }
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>404</h1><p>' + url + ' is not in _site. Rebuild?</p>');
      });
    }
    const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
    if (type.startsWith('text/html')) {
      const body = data.toString('utf8').replace('</body>', MIRROR + '</body>');
      res.writeHead(200, { 'Content-Type': type });
      return res.end(body);
    }
    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  });
});

server.listen(PORT, () => {
  const n = pages().length;
  console.log('');
  console.log('  Review screen:  http://localhost:' + PORT + '/__review');
  console.log('  Serving _site with ' + n + ' pages. Rebuild with `npm run build` to refresh.');
  console.log('  Ctrl+C to stop.');
  console.log('');
});
