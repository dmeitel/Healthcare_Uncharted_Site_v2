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
//   node scripts/play-check.js                      all widths, default page
//   node scripts/play-check.js --widths 360,430     pick widths
//   node scripts/play-check.js --ticks 400          play it further in
//
// Exit 1 if a real overlap is found.
'use strict';
const { chromium } = require('playwright');

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(n); return i > -1 ? argv[i + 1] : d; };
const BASE = opt('--base', 'http://localhost:8080');
// ?afdev=full is the game's own tester hatch: it clocks in and buys the whole floor, so the
// maxed-out unit (pumps, monitor bank, call board, every widget) is up in one load. Clicking
// the button 4000 times never got there, because the panels are BOUGHT, not earned by taps.
const PATH = opt('--path', '/fun/alarm-fatigue/?afdev=full');
const WIDTHS = opt('--widths', '360,430,507,699').split(',').map(Number);
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
  )].filter(vis);

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
  const browser = await chromium.launch();
  let failed = false;

  for (const w of WIDTHS) {
    const ctx = await browser.newContext({ colorScheme: 'dark',
      viewport: { width: w, height: 820 }, deviceScaleFactor: 2, isMobile: w <= 699, hasTouch: w <= 699
    });
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
    const shot = 'tmp/play-' + w + '.png';
    await page.screenshot({ path: shot }).catch(() => {});

    const bad = hits.length > 0 || errors.length > 0;
    if (bad) failed = true;
    console.log('  ' + String(w).padStart(4) + 'px  ' + (bad ? 'FAIL' : 'ok  ') +
      '  button: "' + started.label + '"  panels up: ' + started.visiblePanels + '/' + started.panels +
      '  overlaps: ' + hits.length + '  errors: ' + errors.length + '  shot: ' + shot);
    for (const h of hits) console.log('         COVERED ' + h.covered + '%: ' + h.target + '  by ' + h.by + '  (on top: ' + h.onTop + ')');
    for (const e of errors.slice(0, 3)) console.log('         pageerror: ' + e.slice(0, 120));
    await ctx.close();
  }

  await browser.close();
  console.log('');
  console.log(failed ? 'FAILED: a control or readout is covered while the shift is running.'
                     : 'CLEAN: nothing a player needs is covered, at any width tested.');
  process.exit(failed ? 1 : 0);
})();
