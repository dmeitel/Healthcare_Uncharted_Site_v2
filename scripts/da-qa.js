// da-qa.js — Device Assembly's puzzle sheet. `npm run da:qa`
//
// David, 2026-10-04: "a functional or working QA system specifically for this game as we continue to build out new
// puzzles". The engine half is tests/device-assembly-puzzles.test.js, in every `npm run verify`: every dealt wall
// solves, every break says where it broke, no hint tells a thumb to right-click. This is the browser half. Every wall
// the game has, plus a spread of dealt ones, opened the way a player opens it (a link), at a phone and at a desk:
//   - it opens on the wall the link names, with no console error and nothing off the side of the screen;
//   - a picture empty and, where the wall carries its answer, built;
//   - the answer passes, and every part or run taken out of it in turn is explained with a place.
// Then a touch play test of Tutorial 1 with a thumb: pull the cannula off the cart onto the nose, pull its tubing to
// the barb, press Complete. The report is tmp/da-qa/report.json; the pictures go under the hub's shots, and the hub's
// Puzzles page (/__hub/puzzles) draws both. A new wall shows up there by itself.
//
//   npm run da:qa                 every wall
//   npm run da:qa -- t1 v2        just those walls (and the touch test)
//   npm run da:qa -- --no-touch   skip the touch test
'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { stamp } = require('./lib/session.js');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'tmp', 'da-qa');
const SHOTS = path.join(ROOT, 'tmp', 'hub', 'shots', 'device-assembly', 'puzzles');
const PAGE = '/fun/device-assembly/';
const SIZES = [
  { name: 'phone', width: 390, height: 844, mobile: true },
  { name: 'desktop', width: 1440, height: 900, mobile: false },
];
/* the dealt walls, fixed codes so a finding names a wall anyone can open */
const DEALT = ['gen:QA0', 'gen:QA1', 'gen:QA2', 'gen:QA3', 'rehab:QA0', 'rehab:QA1', 'home:QA0', 'home:QA1', 'icu:QA0', 'icu:QA1', 'shift:QA0',
  // the eight ways a ventilator cart can stand, a setup wall on each (2026-10-07, David: "consider every configuration"):
  // the plain build, underneath, a port each side, top and bottom, each facing right then left
  'icu:VB29', 'icu:VB72', 'icu:VB50', 'icu:VB86', 'icu:VB0', 'icu:VB34', 'icu:VB8', 'icu:VB66',
  // the daily year's first month (2026-10-11, DY2): wall #23, Sunday 2026-10-25, to #51, and the goal mode's teach wall
  ...Array.from({ length: 29 }, (_, i) => 'day:' + new Date(Date.UTC(2026, 9, 25 + i)).toISOString().slice(0, 10)), 'teach:goal'];

/* run inside the page, through the game's test hook: the answer and its breaks */
function inPage() {
  const d = window.__da, S0 = d.S, L = S0.level, out = { id: L.id, title: L.title, kicker: L.kicker, kind: L.kind, crumb: (document.querySelector('.game-bar .tool-bar-crumb') || {}).textContent || '' };
  out.group = L.year || L.id === 'teach:goal' ? 'The daily year' : L.vent ? 'Ventilators' : L.kind === 'tutorial' ? 'Tutorial' : L.kind === 'fault' ? 'Find the fault' : L.kind === 'sandbox' ? 'Sandbox' : L.gen ? 'Dealt' : L.shift ? 'The shift' : 'Levels';
  out.order = (L.brief || '').slice(0, 220);
  out.overflow = document.documentElement.scrollWidth > innerWidth + 1;
  if (!L.solution) { out.solvable = null; out.breaks = null; return out; }
  const mk = () => { const S = d.newState(L); d.restore(S, L.solution); return S; };
  out.solvable = d.evaluate(mk()).ok;
  const S1 = mk(), things = [...S1.items.filter((i) => !i.fixed).map((i) => i.uid), ...S1.tubes.filter((t) => !t.lead).map((t) => t.uid)];
  let total = 0, located = 0; const vague = [];
  for (const u of things) { const S = mk(); const w = S.items.find((i) => i.uid === u) || S.tubes.find((t) => t.uid === u); d.removeThing(S, u); const ev = d.evaluate(S); if (ev.ok) continue; total++;
    const first = (ev.lines[0] || {}).t || '';
    if (/No patient interface/.test(first) || ev.kind === 'invalid' || (ev.stop && ev.stop.text && !/Nothing carries gas from an outlet/.test(first))) located++;
    else vague.push((w.def.short || w.def.id) + ': ' + first); }
  out.breaks = { total, located, vague };
  return out;
}

async function main() {
  const argv = process.argv.slice(2);
  const only = argv.filter((a) => !a.startsWith('--'));
  const touch = !argv.includes('--no-touch');
  const server = await require('./review.js').start(0, { quiet: true });
  const origin = 'http://localhost:' + server.port;
  fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(SHOTS, { recursive: true });
  const browser = await chromium.launch();
  const report = { at: stamp(), walls: [], touch: null };
  const byId = new Map();
  try {
    // the authored walls, read from the game itself, so a new one is on the sheet without anyone listing it
    const probe = await browser.newPage();
    await probe.addInitScript(() => { window.__DA_HOOK = true; });
    await probe.goto(origin + PAGE + '?dadev=1', { waitUntil: 'networkidle' });
    const authored = await probe.evaluate(() => window.__da.LEVELS.filter((L) => !L.parked).map((L) => L.id));
    await probe.close();
    const ids = (only.length ? only : [...authored, ...DEALT]);
    for (const size of SIZES) {
      const ctx = await browser.newContext({ viewport: { width: size.width, height: size.height }, deviceScaleFactor: 1, isMobile: size.mobile, hasTouch: size.mobile });
      await ctx.addInitScript(() => { window.__DA_HOOK = true; try { localStorage.setItem('hu-howto-da', '1'); } catch (e) {} });
      const page = await ctx.newPage();
      let errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      for (const id of ids) {
        errors = [];
        const link = PAGE + '?wall=' + encodeURIComponent(id) + '&unlock=1&dadev=1';
        await page.goto(origin + link, { waitUntil: 'networkidle' });
        await page.waitForTimeout(350);
        const r = await page.evaluate(inPage);
        const wall = byId.get(id) || { id, link, asked: id };
        byId.set(id, wall);
        Object.assign(wall, { title: r.title, kicker: r.kicker, kind: r.kind, group: r.group, order: r.order, opened: r.id, solvable: r.solvable, breaks: r.breaks });
        const file = (tag) => id.replace(/[^a-z0-9]+/gi, '-') + '-' + size.name + '-' + tag + '.jpg';
        await page.screenshot({ path: path.join(SHOTS, file('empty')), type: 'jpeg', quality: 72 });
        const shots = { empty: '/__hub/shots/device-assembly/puzzles/' + file('empty') };
        if (r.solvable !== null) {
          await page.evaluate(() => { const d = window.__da; d.restore(d.S, d.S.level.solution); d.render(); });
          await page.waitForTimeout(150);
          await page.screenshot({ path: path.join(SHOTS, file('built')), type: 'jpeg', quality: 72 });
          shots.built = '/__hub/shots/device-assembly/puzzles/' + file('built');
        }
        wall[size.name] = { errors: errors.slice(0, 5), overflow: r.overflow, shots };
        process.stdout.write('.');
      }
      await ctx.close();
    }
    process.stdout.write('\n');
    report.walls = [...byId.values()].map((w) => Object.assign(w, {
      ok: (w.opened === w.asked || /^shift:/.test(w.asked)) && !w.phone.errors.length && !w.desktop.errors.length && !w.phone.overflow && !w.desktop.overflow && w.solvable !== false && !(w.breaks && w.breaks.vague.length),
    }));
    if (touch) report.touch = await touchTest(browser, origin);
    report.screens = await screens(browser, origin);
  } finally {
    await browser.close();
    await server.close();
  }
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 1));
  const bad = report.walls.filter((w) => !w.ok);
  for (const w of bad) console.log('  ' + w.id + ': ' + [w.opened !== w.asked && !/^shift:/.test(w.asked) ? 'opened ' + w.opened : '', w.phone.errors.concat(w.desktop.errors)[0] || '', w.phone.overflow || w.desktop.overflow ? 'off the side of the screen' : '', w.solvable === false ? 'its answer fails' : '', w.breaks && w.breaks.vague.length ? w.breaks.vague.length + ' breaks not located' : ''].filter(Boolean).join('; '));
  const breaks = report.walls.reduce((a, w) => a + (w.breaks ? w.breaks.total : 0), 0);
  console.log(report.walls.length + ' walls, ' + (report.walls.length - bad.length) + ' clean; ' + breaks + ' breaks tried, every one located: ' + (report.walls.every((w) => !w.breaks || !w.breaks.vague.length) ? 'yes' : 'no') + '.');
  for (const sc of report.screens || []) if (!sc.ok) console.log('  does not fit ' + sc.name + ' (' + sc.size + '): ' + [sc.scroll > 1 ? 'the page scrolls ' + sc.scroll + ' px' : '', sc.complete ? '' : 'Complete is off the screen', sc.parts ? '' : 'the parts are off the screen', sc.dock ? '' : "the part's buttons meet the zoom buttons or leave the screen"].filter(Boolean).join(', '));
  if (report.screens) console.log("A phone's real screen: " + report.screens.filter((x) => x.ok).length + ' of ' + report.screens.length + ' fit with nothing to scroll (wall ' + report.screens.map((x) => x.wall + (x.small ? ' small, play it zoomed' : '')).join(', ') + ' px).');
  if (report.touch) console.log('Touch play test, Tutorial 1: ' + (report.touch.ok ? 'passed' : 'FAILED') + ' (' + report.touch.steps.map((s) => s.what + (s.ok ? '' : ' x')).join(', ') + ')');
  console.log('Report: tmp/da-qa/report.json. The hub draws it: /__hub/puzzles');
  if (bad.length || (report.touch && !report.touch.ok) || (report.screens || []).some((x) => !x.ok)) process.exitCode = 1;
}

/* THE SCREEN (2026-10-05): the space a phone's browser really leaves, bars showing. A phone held upright is one
   screen: nothing scrolls the page, and Complete and the cart's parts are on it. */
const REAL = [['iPhone 15, Safari bars showing', 393, 659], ['iPhone SE, Safari', 375, 548], ['iPhone Pro Max, Safari', 430, 746], ['Pixel, Chrome', 412, 780], ['small Android', 360, 640]];
async function screens(browser, origin) {
  const out = [];
  for (const [name, w, h] of REAL) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await ctx.addInitScript(() => { window.__DA_HOOK = true; try { localStorage.setItem('hu-howto-da', '1'); } catch (e) {} });
    const page = await ctx.newPage();
    await page.goto(origin + PAGE + '?wall=l2&unlock=1&dadev=1', { waitUntil: 'networkidle' }); await page.waitForTimeout(400);
    const m = await page.evaluate(() => { const r = (e) => e && e.getBoundingClientRect(), b = r(document.getElementById('board')), c = r(document.getElementById('submitBtn')), t = r(document.querySelector('#cartList .da-item'));
      // a part selected with something to undo: the dock at its widest, beside the zoom buttons
      const d = window.__da; d.S.sel = d.S.items[0].uid; d.S.history = [{}]; d.render();
      const v = r(document.getElementById('verbs')), z = r(document.getElementById('zoomBox'));
      const meet = v.right > z.left && z.right > v.left && v.bottom > z.top && z.bottom > v.top;
      const dock = !meet && v.left >= 0 && v.right <= innerWidth && z.left >= 0 && z.right <= innerWidth;
      d.S.sel = null; d.S.history = []; d.render();
      return { scroll: Math.max(0, document.documentElement.scrollHeight - innerHeight), wall: Math.round(b.width), complete: !!c && c.bottom <= innerHeight, parts: !!t && t.bottom <= innerHeight, dock }; });
    out.push({ name, size: w + 'x' + h, ...m, small: m.wall < 180, ok: m.scroll <= 1 && m.complete && m.parts && m.dock });
    await ctx.close();
  }
  return out;
}

/* Tutorial 1 with a thumb, through the touch events a phone sends */
async function touchTest(browser, origin) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => { window.__DA_HOOK = true; try { localStorage.setItem('hu-howto-da', '1'); } catch (e) {} });
  const page = await ctx.newPage();
  const steps = []; const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  const cdp = await ctx.newCDPSession(page);
  const touchAt = async (type, p) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x: p[0], y: p[1] }] });
  const pull = async (a, b) => { await touchAt('touchStart', a); for (let i = 1; i <= 12; i++) await touchAt('touchMove', [a[0] + (b[0] - a[0]) * i / 12, a[1] + (b[1] - a[1]) * i / 12]); await touchAt('touchEnd', b); await page.waitForTimeout(450); };
  try {
    await page.goto(origin + PAGE + '?wall=t1&dadev=1', { waitUntil: 'networkidle' }); await page.waitForTimeout(400);
    // 1. the cannula, pulled up off the cart and onto the nose; the part rides above the thumb, so aim the thumb under the square
    const aim = await page.evaluate(() => { const d = window.__da, b = document.getElementById('board').getBoundingClientRect(), vb = document.getElementById('board').getAttribute('viewBox').split(' ').map(Number), sc = b.width / vb[2];
      const n = d.GRID.nose, cell = 60 * sc, lift = Math.round(cell / 2 + 36), c = document.querySelector('.da-item[data-def="cannula"]').getBoundingClientRect();
      return { from: [c.left + c.width / 2, c.top + c.height / 2], to: [b.left + (n[0] * 60 - vb[0]) * sc + cell / 2, b.top + (n[1] * 60 - vb[1]) * sc + cell / 2 + lift] }; });
    // a sideways swipe scrolls the cart; an upward pull lifts the part. Halfway there, the part is in the hand.
    await touchAt('touchStart', aim.from);
    for (let i = 1; i <= 6; i++) await touchAt('touchMove', [aim.from[0] + (aim.to[0] - aim.from[0]) * i / 12, aim.from[1] + (aim.to[1] - aim.from[1]) * i / 12]);
    const lifted = await page.evaluate(() => !!document.querySelector('.da-ghost'));
    for (let i = 7; i <= 12; i++) await touchAt('touchMove', [aim.from[0] + (aim.to[0] - aim.from[0]) * i / 12, aim.from[1] + (aim.to[1] - aim.from[1]) * i / 12]);
    await touchAt('touchEnd', aim.to); await page.waitForTimeout(450);
    const onNose = await page.evaluate(() => { const d = window.__da, it = d.S.items.find((i) => i.def.id === 'cannula'); return !!it && it.x === d.GRID.nose[0] && it.y === d.GRID.nose[1]; });
    steps.push({ what: 'an upward pull lifts a part off the cart', ok: lifted }, { what: 'cannula onto the nose by touch', ok: onNose });
    // 2. its tubing, pulled from the ring to the barb
    const ends = await page.evaluate(() => { const d = window.__da, S = d.S, b = document.getElementById('board').getBoundingClientRect(), vb = document.getElementById('board').getAttribute('viewBox').split(' ').map(Number), sc = b.width / vb[2];
      const xy = (p) => { const D = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] }[p.s]; return [b.left + (p.x * 60 + 30 + D[0] * 30 - vb[0]) * sc, b.top + (p.y * 60 + 30 + D[1] * 30 - vb[1]) * sc]; };
      const can = S.items.find((i) => i.def.id === 'cannula'), src = S.items.find((i) => i.def.id === 'src-t1');
      if (!can || !src) return null;
      return { ring: xy(d.portsOf(can).find((p) => p.pi === 'lead')), barb: xy(d.portsOf(src).find((p) => p.std === 'barb')) }; });
    if (ends) await pull(ends.ring, ends.barb);
    const joined = await page.evaluate(() => { const S = window.__da.S, tb = S.tubes.find((t) => t.lead && t.to); return !!tb && !tb.short; });
    steps.push({ what: 'tubing pulled to the barb', ok: joined });
    // 3. Complete, with a tap
    const btn = await page.locator('#submitBtn').boundingBox();
    const at = [btn.x + btn.width / 2, btn.y + btn.height / 2];
    const tap = async () => { await touchAt('touchStart', at); await page.waitForTimeout(60); await touchAt('touchEnd', at); await page.waitForTimeout(1900); };
    await tap();
    let passed = await page.evaluate(() => !!window.__da.S.finished);
    if (!passed && !(await page.evaluate(() => (window.__da.S.tests || []).length))) { await page.waitForTimeout(400); await tap(); passed = await page.evaluate(() => !!window.__da.S.finished); }   /* a tap a gesture swallowed: once more */
    if (!passed) steps.push({ what: 'what the card said: ' + await page.evaluate(() => { const o = document.getElementById('overlay'); return (o && !o.hidden ? o.innerText : 'no card').replace(/\s+/g, ' ').slice(0, 200); }), ok: false });
    steps.push({ what: 'Complete passes', ok: passed });
    await page.screenshot({ path: path.join(SHOTS, 'touch-t1-done.jpg'), type: 'jpeg', quality: 72 });
  } catch (e) { steps.push({ what: 'the script: ' + e.message.split('\n')[0], ok: false }); }
  await ctx.close();
  return { ok: steps.every((s) => s.ok) && !errs.length, steps, errors: errs.slice(0, 3), shot: '/__hub/shots/device-assembly/puzzles/touch-t1-done.jpg' };
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
