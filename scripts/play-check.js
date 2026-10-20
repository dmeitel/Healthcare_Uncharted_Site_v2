// THE PLAY CHECK.
// Everything else in this repo loads a page and reads it sitting still. That is why David
// kept finding overlaps on his phone that every gate called CLEAN: the things that collide
// in Alarm Fatigue (the pump panel, the monitor bank, the call board, toasts, sticky notes,
// the med-pass card) do not EXIST until a shift is running. Idle, the page is clean at every
// width I can test, and idle is not the game.
//
// So this one plays. It starts the shift, advances it, and then asks the only question that
// matters for a floor full of floating panels: is anything covering anything else that a
// player needs to read or press?
//
//   node scripts/play-check.js                      all sizes, default page, serving _site itself
//   node scripts/play-check.js --widths 360,740x360 pick sizes (a width, or WIDTHxHEIGHT)
//   node scripts/play-check.js --base http://localhost:8081   against a running server
//   node scripts/play-check.js --ticks 400          play it further in
//
// Exit 1 if a real overlap is found.
'use strict';
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const http = require('http');

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(n); return i > -1 ? argv[i + 1] : d; };
// --base: a running server. Without it the check serves _site itself, the way scripts/phone-check.js does, so
// `npm run qa` can run it with no server up (2026-10-19: it found Alarm Fatigue's late-game panels covering the
// monitors on a phone, a fault no gate saw because nothing ran this check).
let BASE = opt('--base', null);
const SITE = path.join(__dirname, '..', '_site');
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.webp': 'image/webp', '.mp3': 'audio/mpeg' };
function serveSite() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p.endsWith('/')) p += 'index.html';
      let f = path.join(SITE, p);
      if (!f.startsWith(SITE)) { res.writeHead(403); return res.end(); }
      if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
      if (!fs.existsSync(f)) { res.writeHead(404); return res.end('not found'); }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve({ srv, url: 'http://127.0.0.1:' + /** @type {import('net').AddressInfo} */ (srv.address()).port }));
  });
}
// ?afdev=full is the game's own tester hatch: it clocks in and buys the whole floor, so the
// maxed-out unit (pumps, monitor bank, call board, every widget) is up in one load. Clicking
// the button 4000 times never got there, because the panels are BOUGHT, not earned by taps.
const PATH = opt('--path', '/fun/alarm-fatigue/?afdev=full');
// a width, or WIDTHxHEIGHT for a phone on its side (740x360); the height is 820 otherwise
const SIZES = opt('--widths', '360,390,430,507,699,740x360,1280').split(',').map((t) => {
  const m = String(t).trim().match(/^(\d+)(?:x(\d+))?$/);
  return m ? { w: Number(m[1]), h: m[2] ? Number(m[2]) : 820 } : null;
}).filter(Boolean);
const TICKS = Number(opt('--ticks', '260'));

// What a player has to be able to read or press. A toast that briefly covers a monitor is
// the game talking; a panel parked on top of a control is a defect. So: only PERSISTENT
// things count, and only when they cover something INTERACTIVE or a live readout.
const FIND_OVERLAPS = () => {
  const name = (e) => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') +
    (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : '');

  const vis = (e) => {
    const cs = getComputedStyle(e);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.6) return false;
    const r = e.getBoundingClientRect();
    return r.width > 8 && r.height > 8 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
  };

  // the things a player acts on
  const targets = [...document.querySelectorAll(
    '#bigBtn, .room, .bank-tile, .pump button, .pump, .ehr-tab, .shopcard, .card, [data-act], button.hit'
  )].filter(vis)
    // the walking helpers let taps fall through since 2026-10-11 (the CHECK fix): one passing over a panel is not a
    // covered control, so they are not targets
    .filter((e) => !e.matches('.tech, .widget.family, .widget.surveyor, .pizza'));

  // the things that float over the floor and stay there
  const floaters = [...document.querySelectorAll('.widget, .callboard, #bank, #pumpRow, .stage, .clicker, .shopcard, .ehrp, .gamemenu, .soundmenu')]
    .filter(vis)
    .filter((e) => { const cs = getComputedStyle(e); return cs.position === 'absolute' || cs.position === 'fixed' || cs.position === 'sticky'; });

  const hits = [];
  for (const t of targets) {
    const tr = t.getBoundingClientRect();
    for (const f of floaters) {
      if (f === t || f.contains(t) || t.contains(f)) continue;
      const fr = f.getBoundingClientRect();
      const ox = Math.min(tr.right, fr.right) - Math.max(tr.left, fr.left);
      const oy = Math.min(tr.bottom, fr.bottom) - Math.max(tr.top, fr.top);
      if (ox <= 2 || oy <= 2) continue;
      const covered = (ox * oy) / (tr.width * tr.height);
      if (covered < 0.30) continue;                     // a clipped corner is not a defect
      // is the floater actually PAINTED over it? a transparent wrapper is not in the way.
      const cs = getComputedStyle(f);
      const opaque = cs.backgroundColor && !/rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor);
      if (!opaque) continue;
      // and is it really on top?
      const mid = document.elementFromPoint(
        Math.min(innerWidth - 1, Math.max(1, (Math.max(tr.left, fr.left) + Math.min(tr.right, fr.right)) / 2)),
        Math.min(innerHeight - 1, Math.max(1, (Math.max(tr.top, fr.top) + Math.min(tr.bottom, fr.bottom)) / 2))
      );
      if (!mid || t.contains(mid) || mid === t) continue;
      hits.push({
        covered: Math.round(covered * 100),
        target: name(t) + ' "' + (t.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 22) + '"',
        by: name(f),
        onTop: name(mid)
      });
    }
  }
  return hits.sort((a, b) => b.covered - a.covered).slice(0, 12);
};

(async () => {
  const local = BASE ? null : await serveSite();
  if (local) BASE = local.url;
  const browser = await chromium.launch();
  let failed = false;

  for (const { w, h } of SIZES) {
    const phone = Math.min(w, h) <= 699;
    const ctx = await browser.newContext({ colorScheme: 'dark',
      viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: phone, hasTouch: phone
    });
    // a returning player: the how-to card opens by itself on a first visit only (the menus contract, 2026-09-23), and
    // left open it sat over the floor in every picture, so the overlaps were read through it
    await ctx.addInitScript(() => { try { localStorage.setItem('hu-howto-af', '1'); } catch (e) {} });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message.split('\n')[0]));
    await page.goto(BASE + PATH, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(1200);

    // start the shift, then play it forward
    const started = await page.evaluate(async (ticks) => {
      const go = document.getElementById('afbsGo') || document.getElementById('bigBtn');
      if (go) go.click();
      await new Promise((r) => setTimeout(r, 600));
      for (let i = 0; i < ticks; i++) {
        const b = document.getElementById('bigBtn');
        if (b) b.click();
        if (i % 40 === 0) await new Promise((r) => setTimeout(r, 30));
      }
      await new Promise((r) => setTimeout(r, 2200));   // the hatch buys on a timer
      const btn = document.getElementById('bigBtn');
      return { label: btn ? btn.textContent.trim().slice(0, 18) : 'none',
        panels: document.querySelectorAll('.widget, #bank, #pumpRow').length,
        visiblePanels: [...document.querySelectorAll('.widget, #bank, #pumpRow')].filter((e) => getComputedStyle(e).display !== 'none').length };
    }, TICKS);

    await page.waitForTimeout(500);
    const hits = await page.evaluate(FIND_OVERLAPS);
    const shot = 'tmp/play-' + w + (h !== 820 ? 'x' + h : '') + '.png';
    await page.screenshot({ path: shot }).catch(() => {});

    const bad = hits.length > 0 || errors.length > 0;
    if (bad) failed = true;
    console.log('  ' + (String(w) + (h !== 820 ? 'x' + h : '')).padStart(7) + '  ' + (bad ? 'FAIL' : 'ok  ') +
      '  button: "' + started.label + '"  panels up: ' + started.visiblePanels + '/' + started.panels +
      '  overlaps: ' + hits.length + '  errors: ' + errors.length + '  shot: ' + shot);
    for (const h of hits) console.log('         COVERED ' + h.covered + '%: ' + h.target + '  by ' + h.by + '  (on top: ' + h.onTop + ')');
    for (const e of errors.slice(0, 3)) console.log('         pageerror: ' + e.slice(0, 120));
    await ctx.close();
  }

  await browser.close();
  if (local) local.srv.close();
  console.log('');
  console.log(failed ? 'FAILED: a control or readout is covered while the shift is running.'
                     : 'CLEAN: nothing a player needs is covered, at any width tested.');
  process.exit(failed ? 1 : 0);
})();
