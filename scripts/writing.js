#!/usr/bin/env node
'use strict';
/**
 * writing.js · the writing review screen.
 *
 *   npm run writing          then open http://localhost:8084/__writing
 *
 * WHY THIS EXISTS. David, 2026-10-03: "a QA tool that would look at writing, PHI standards, and
 * make sure that we are always staying within a good format or good professional standing with
 * our writing but also staying within our vernacular tone", built like the side-by-side review
 * screen, and for pasted drafts as well as site pages ("include pasted drafts").
 *
 * Two ways in. PASTE A DRAFT: anything David writes, on the site or off it (LinkedIn, work email,
 * a letter to a legislator), checked as he types against the register he picks. A SITE PAGE: a
 * built page, loaded in a hidden same-origin frame so its scripts draw first, then read from the
 * live DOM. The rules are scripts/lib/writing-rules.js, the same file the gates run.
 *
 * Saved drafts and reviewer-panel notes live in private/writing/, which git ignores: a draft can
 * hold exactly the patient detail this tool exists to catch, and this repo is public.
 *
 * A DEV TOOL, like review.js: it lives in scripts/ and can never ship.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const W = require('./lib/writing-rules');
const { readImageMeta, describe } = require('./lib/image-meta');

const ROOT = path.join(__dirname, '..');
const SITE = path.join(ROOT, '_site');
const ASSETS = path.join(ROOT, 'src', 'assets');
const PRIVATE = path.join(ROOT, 'private', 'writing');
const DRAFTS = path.join(PRIVATE, 'drafts');
const PANEL = path.join(PRIVATE, 'panel');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.ttf': 'font/ttf', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
};

/** Every built page with its title and register, shallowest first. Redirect stubs are skipped. */
function pages() {
  const out = [];
  if (!fs.existsSync(SITE)) return out;
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (!(dir === SITE && /^(assets|brand)$/.test(e.name))) walk(p); }
      else if (e.name === 'index.html') {
        const html = fs.readFileSync(p, 'utf8');
        if (/http-equiv=["']refresh["']/i.test(html.slice(0, 1500))) continue;
        const rel = path.relative(SITE, p).split(path.sep).slice(0, -1).join('/');
        const url = '/' + (rel ? rel + '/' : '');
        const title = W.decode((html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || url).replace(/\s+/g, ' ').replace(/\s*[|·]\s*Healthcare Uncharted\s*$/, '').trim();
        out.push({ path: url, title, register: W.registerForPath(url, html), guest: /Chrysalis Ashton/.test(html) });
      }
    }
  })(SITE);
  return out.sort((a, b) => a.path.split('/').length - b.path.split('/').length || a.path.localeCompare(b.path));
}

/** @param {string} s */
function slugify(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60); }
/** A panel file's name for a draft ("draft:<slug>") or a page ("page:/rounds/x/"). @param {string} id */
function panelFile(id) { return path.join(PANEL, slugify(id.replace(':', '-')) + '.json'); }

/** @param {http.ServerResponse} res @param {number} code @param {any} body */
function json(res, code, body) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

/** @param {http.IncomingMessage} req @returns {Promise<any>} */
function readBody(req) {
  return new Promise((resolve, reject) => {
    let n = 0; const chunks = [];
    req.on('data', c => { n += c.length; if (n > 2e6) { reject(new Error('too big')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

/** @param {http.IncomingMessage} req @param {http.ServerResponse} res */
async function handle(req, res) {
  const u = new URL(req.url, 'http://x');
  const url = u.pathname;

  if (url === '/__writing' || url === '/__writing/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    return res.end(fs.readFileSync(path.join(__dirname, 'writing.html')));
  }
  if (url === '/__writing/rules.js') {
    res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store' });
    return res.end(fs.readFileSync(path.join(__dirname, 'lib', 'writing-rules.js')));
  }
  if (url === '/__writing/pages.json') return json(res, 200, pages());

  if (url === '/__writing/drafts.json') {
    const list = [];
    if (fs.existsSync(DRAFTS)) {
      for (const f of fs.readdirSync(DRAFTS)) {
        if (!f.endsWith('.json')) continue;
        try {
          const d = JSON.parse(fs.readFileSync(path.join(DRAFTS, f), 'utf8'));
          list.push({ slug: f.slice(0, -5), title: d.title, register: d.register, saved: d.saved, words: (d.text || '').split(/\s+/).filter(Boolean).length, panel: fs.existsSync(panelFile('draft:' + f.slice(0, -5))) });
        } catch (e) { /* a broken file is skipped, not fatal */ }
      }
    }
    return json(res, 200, list.sort((a, b) => String(b.saved).localeCompare(String(a.saved))));
  }
  if (url === '/__writing/draft' && req.method === 'GET') {
    const f = path.join(DRAFTS, slugify(u.searchParams.get('slug')) + '.json');
    return fs.existsSync(f) ? json(res, 200, JSON.parse(fs.readFileSync(f, 'utf8'))) : json(res, 404, { error: 'no such draft' });
  }
  if (url === '/__writing/draft' && req.method === 'POST') {
    let body;
    try { body = await readBody(req); } catch (e) { return json(res, 400, { error: 'unreadable draft' }); }
    const text = String(body.text || '');
    if (!text.trim()) return json(res, 400, { error: 'empty draft' });
    const title = String(body.title || text.trim().split('\n')[0]).slice(0, 120);
    const slug = slugify(body.slug) || slugify(title) || 'draft-' + Date.now();
    fs.mkdirSync(DRAFTS, { recursive: true });
    const register = W.REGISTERS.some(r => r.id === body.register) ? body.register : 'rounds';
    fs.writeFileSync(path.join(DRAFTS, slug + '.json'), JSON.stringify({ title, register, text, saved: new Date().toISOString() }, null, 2));
    return json(res, 200, { slug });
  }
  if (url === '/__writing/panel') {
    const f = panelFile(String(u.searchParams.get('id') || ''));
    return fs.existsSync(f) ? json(res, 200, JSON.parse(fs.readFileSync(f, 'utf8'))) : json(res, 200, { none: true, file: path.relative(ROOT, f).split(path.sep).join('/') });
  }
  if (url === '/__writing/imgmeta') {
    const src = String(u.searchParams.get('src') || '').split('?')[0];
    const rel = decodeURIComponent(src.replace(/^https?:\/\/[^/]+/, ''));
    let file = '';
    if (rel.startsWith('/assets/')) file = path.join(ASSETS, rel.slice('/assets/'.length));
    else if (rel.startsWith('/')) file = path.join(SITE, rel);
    if (!file || !(file.startsWith(ASSETS) || file.startsWith(SITE)) || !fs.existsSync(file)) return json(res, 404, { error: 'not found' });
    const m = readImageMeta(fs.readFileSync(file));
    return json(res, 200, Object.assign(m, { note: describe(m) }));
  }

  // The built site, so a page loads same-origin in the screen's frame. /assets/ comes from
  // src/assets, which the dev server only copies on a full build (review.js has the same rule).
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
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    const alt = path.join(SITE, decodeURIComponent(url), 'index.html');
    if (fs.existsSync(alt)) file = alt;
    else { res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }); return res.end('<h1>404</h1><p>' + url + ' is not in _site. Rebuild?</p>'); }
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(res);
}

/** Start the screen. Port 0 picks a free one (the command line uses that). @param {number} port */
function start(port) {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => { handle(req, res).catch(e => { try { json(res, 500, { error: String(e && e.message || e) }); } catch (x) { /* already sent */ } }); });
    server.listen(port, () => resolve(server));
  });
}

if (require.main === module) {
  const PORT = Number(process.env.WRITING_PORT || process.env.PORT || 8084);
  start(PORT).then(() => {
    console.log('');
    console.log('  Writing review:  http://localhost:' + PORT + '/__writing');
    console.log('  ' + pages().length + ' built pages to pick from; drafts save to private/writing/ (git ignores it).');
    console.log('  Ctrl+C to stop.');
    console.log('');
  });
}

module.exports = { start, pages, slugify, panelFile, PRIVATE, DRAFTS, PANEL };
