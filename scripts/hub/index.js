'use strict';
/**
 * index.js · the hub's addresses. scripts/review.js hands every request here first; anything
 * under /__hub is answered, the rest goes on to the review screen and the built site.
 *
 * WHY IT LIVES ON THE REVIEW SERVER. David, 2026-10-04 (DECISIONS HUB1): the hub is on his
 * computer only. scripts/review.js already was the one server that never ships: it serves the
 * built site, the /__review screen, and saves his marks. The hub is the same idea grown up, so it
 * shares the address. Nothing under /__ exists in _site.
 *
 * WHAT THE HUB MAY DO. It reads files and draws them. It writes three things, each to one fixed
 * file: a QA mark (data-build/qa/<card>.json), a new Inbox idea and a promotion (data-build/
 * board.json, which re-prints SPRINT.md). It runs NO commands: the server listens on the home
 * network so his phone can reach it, and a button that ran a script would be a way to run things
 * on this computer from that network. The checks and the build are run by a session.
 */
const fs = require('fs');
const os = require('os');
const net = require('net');
const path = require('path');
const pages = require('./pages');
const boardLib = require('./board');
const qaLib = require('./qa');
const { ROOT } = require('../lib/session');

const HERE = __dirname;
const SHOTS = path.join(ROOT, 'tmp', 'hub', 'shots');

/** This computer's addresses on the home network. */
function lan() {
  const out = [];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const a of list || []) if (a.family === 'IPv4' && !a.internal) out.push(a.address);
  }
  // a 192.168 address is the home router's; virtual adapters come after it
  return out.sort((a, b) => Number(b.startsWith('192.168.')) - Number(a.startsWith('192.168.')));
}

/** @param {number} port @returns {Promise<boolean>} */
function listening(port) {
  return new Promise((resolve) => {
    const s = net.connect({ port, host: '127.0.0.1' });
    const done = (/** @type {boolean} */ v) => { s.destroy(); resolve(v); };
    s.setTimeout(300, () => done(false));
    s.on('connect', () => done(true));
    s.on('error', () => done(false));
  });
}

/** @param {import('http').ServerResponse} res @param {number} code @param {any} body */
function json(res, code, body) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

/** @param {import('http').ServerResponse} res @param {string} html */
function html(res, html) {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(html);
}

/** A page is only allowed to post to the server it came from.
 *  @param {import('http').IncomingMessage} req */
function sameOrigin(req) {
  const o = req.headers.origin;
  if (!o) return true;   // a same-origin fetch from some browsers, or a script on this computer
  try { return new URL(o).host === req.headers.host; } catch { return false; }
}

/** @param {import('http').IncomingMessage} req @returns {Promise<any>} */
function body(req) {
  return new Promise((resolve, reject) => {
    let s = '';
    req.on('data', (c) => { s += c; if (s.length > 1e5) { reject(new Error('Too long.')); req.destroy(); } });
    req.on('end', () => { try { resolve(JSON.parse(s || '{}')); } catch { reject(new Error('Not readable.')); } });
    req.on('error', reject);
  });
}

/** Answer a request under /__hub. Returns false when the address is not the hub's.
 *  @param {import('http').IncomingMessage} req @param {import('http').ServerResponse} res @param {{port:number}} ctx */
function handle(req, res, ctx) {
  const url = (req.url || '').split('?')[0].replace(/\/+$/, '') || '/';
  if (url !== '/__hub' && !url.startsWith('/__hub/')) return false;

  const guard = (/** @type {() => any} */ fn) => {
    Promise.resolve().then(fn).catch((e) => {
      if (!res.headersSent) { res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' }); }
      res.end(pages.layout({ title: 'Something broke', tab: '', body: `<div class="obs-head"><h1>This screen could not be drawn</h1><p>${pages.esc(String(e && e.message || e))}</p><p>Tell Claude what you tapped. Nothing was lost; the files are untouched.</p></div>` }));
    });
    return true;
  };

  if (req.method === 'POST') {
    if (!sameOrigin(req)) { json(res, 403, { error: 'That came from another site.' }); return true; }
    body(req).then((b) => {
      if (url === '/__hub/api/qa') {
        const card = qaLib.cardFor(String(b.card || ''));
        const saved = qaLib.mark(card.id, String(b.item || ''), String(b.mark || ''), String(b.note || ''));
        return json(res, 200, { ok: true, saved, counts: qaLib.counts(qaLib.items(card)) });
      }
      if (url === '/__hub/api/inbox') {
        const board = boardLib.load();
        const id = boardLib.addInbox(board, String(b.title || ''), String(b.line || ''));
        boardLib.save(board);
        return json(res, 200, { ok: true, id });
      }
      if (url === '/__hub/api/promote') {
        const board = boardLib.load();
        const c = boardLib.promote(board, String(b.id || ''));
        boardLib.save(board);
        return json(res, 200, { ok: true, id: c.id });
      }
      return json(res, 404, { error: 'No such action.' });
    }).catch((e) => json(res, 400, { error: String(e && e.message || e) }));
    return true;
  }

  if (url === '/__hub/ping') { json(res, 200, { ok: true }); return true; }
  if (url === '/__hub/hub.css' || url === '/__hub/client.js') {
    const file = path.join(HERE, url === '/__hub/hub.css' ? 'hub.css' : 'client.js');
    res.writeHead(200, { 'Content-Type': (url.endsWith('.css') ? 'text/css' : 'text/javascript') + '; charset=utf-8', 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(res);
    return true;
  }
  if (url.startsWith('/__hub/shots/')) {
    const file = path.join(SHOTS, decodeURIComponent(url.slice('/__hub/shots/'.length)));
    if (!file.startsWith(SHOTS + path.sep) || !/\.(png|jpe?g)$/i.test(file) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return true; }
    res.writeHead(200, { 'Content-Type': /\.png$/i.test(file) ? 'image/png' : 'image/jpeg', 'Cache-Control': 'no-store' });   /* the puzzle sheet files jpegs: 76 pictures stay small */
    fs.createReadStream(file).pipe(res);
    return true;
  }

  if (url === '/__hub') {
    return guard(async () => {
      const [dev, writing] = await Promise.all([listening(8080), listening(8084)]);
      const addrs = lan();
      const screens = [
        { name: 'The hub, the review screen and the built site.', up: true, where: `This screen, on port ${ctx.port}.`, how: '' },
        { name: 'The dev server.', up: dev, where: 'The site, rebuilt on every save, on port 8080.', how: 'Claude starts it when a window needs it.' },
        { name: 'The writing screen.', up: writing, where: 'Port 8084.', how: 'Say "open the writing screen".' },
      ];
      html(res, pages.board({ port: ctx.port, lan: addrs, screens }));
    });
  }
  if (url === '/__hub/run') return guard(() => html(res, pages.run()));
  if (url === '/__hub/qa') {
    const q = new URL(req.url || '', 'http://x').searchParams, pick = q.get('card') || '', folder = q.get('group') || '';
    return guard(() => html(res, pages.qa(/^[a-z0-9-]{1,60}$/.test(pick) ? pick : '', /^[a-z0-9-]{1,80}$/.test(folder) ? folder : '')));
  }
  if (url === '/__hub/site') return guard(() => html(res, pages.site()));
  if (url === '/__hub/plan') {
    const pick = new URL(req.url || '', 'http://x').searchParams.get('card') || '';
    return guard(() => html(res, pages.plan(/^[a-z0-9-]{1,60}$/.test(pick) ? pick : '')));
  }
  if (url === '/__hub/puzzles') {
    const only = new URL(req.url || '', 'http://x').searchParams.get('group') || '';
    return guard(() => html(res, pages.puzzles(/^[a-z0-9-]{1,40}$/.test(only) ? only : '')));
  }
  if (url === '/__hub/library') return guard(() => html(res, pages.library()));

  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(pages.layout({ title: 'Not found', tab: '', body: '<div class="obs-head"><h1>No such screen</h1><p>The hub has the board, the run sheet, the QA list, the site blocks and the library.</p></div>' }));
  return true;
}

module.exports = { handle, lan };
