/* ================================================================
   TWO WALLS, THE REAL ROUND TRIP — node scripts/backend-check-da.js [url]

   Two headless browsers open Device Assembly. One hosts a table, the
   other joins by code over the REAL relay, the host's wall arrives on
   the guest, the guest builds the first tutorial and its snapshot lands
   on the host byte for byte, the guest submits, and the host declares
   the winner on both screens. Screenshots of both boards land in tmp/.

   It talks to the internet, so it is NOT part of `npm test`. Default
   target is the local dev server; pass the live URL to check prod.
================================================================ */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL = process.argv[2] || 'http://localhost:8080/secret-menu/device-assembly/';
const OUT = path.join(__dirname, '..', 'tmp');
const T = 25000;
function fail(msg) { console.error('FAIL: ' + msg); process.exit(1); }
setTimeout(() => fail('the whole check took longer than three minutes'), 180000).unref();

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const errors = [];
  async function open(name) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
    await ctx.addInitScript(() => { window.__DA_HOOK = true; });
    const page = await ctx.newPage();
    page.on('console', m => { if (m.type() === 'error') errors.push(`[${name}] ${m.text()}`); });
    page.on('pageerror', e => errors.push(`[${name}] ${e.message}`));
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!(window.__da && window.__da.T && window.supabase), null, { timeout: T });
    await page.evaluate(n => { window.__da.setRaceName(n); }, name);
    return page;
  }
  const host = await open('Dave');
  const guest = await open('Sam');

  const table = await host.evaluate(() => { const ok = window.__da.T.host(); const N = window.__da.NET; return { ok, room: N.room, kind: N.chan && N.chan.kind, level: window.__da.S && window.__da.S.level.id }; });
  if (!table.ok || table.kind !== 'internet') fail('the host did not get the internet relay');
  await host.evaluate(() => { window.__da.raceStart(window.__da.S.level.id); });
  console.log(`table ${table.room} over the ${table.kind} transport, racing ${table.level}`);

  await guest.evaluate(code => { window.__da.T.join(code, 'Sam'); }, table.room);
  await host.waitForFunction(() => window.__da.NET.seats.b === 'Sam', null, { timeout: T }).catch(() => fail('the host never seated the guest'));
  await guest.waitForFunction(lv => window.__da.race().level === lv && window.__da.S && window.__da.S.level.id === lv, table.level, { timeout: T })
    .catch(() => fail('the guest never opened the host\'s wall'));
  console.log('guest seated at Wall B and opened the same wall');

  // the guest builds the first tutorial through the real engine, on its own local wall
  await host.evaluate(() => { window.__da.raceStart('t1'); });
  await guest.waitForFunction(() => window.__da.S && window.__da.S.level.id === 't1', null, { timeout: T }).catch(() => fail('the guest did not follow the pick to t1'));
  const built = await guest.evaluate(() => {
    const da = window.__da, S = da.S, nose = da.GRID.nose;
    const can = da.place(S, 'cannula', nose[0], nose[1], 0).item; da.autoOrient(S, can.uid);
    const src = S.items.find(i => i.def.id === 'src-t1'); const barb = da.portsOf(src).find(p => p.std === 'barb');
    const r = da.connectPorts(S, { uid: can.uid, pi: 'lead' }, { uid: src.uid, pi: barb.pi }, null);
    da.netSync();
    return { ok: r.ok, snap: da.snapshot(S) };
  });
  if (!built.ok) fail('the guest could not build the wall');
  await host.waitForFunction(snap => window.__da.otherWall() === snap, built.snap, { timeout: T }).catch(() => fail('the guest wall never reached the host byte for byte'));
  console.log('guest wall on the host, identical');

  await guest.evaluate(() => { const da = window.__da; da.raceSubmit(da.functionTest(da.S)); });
  await host.waitForFunction(() => window.__da.race().winner === 'Sam', null, { timeout: T }).catch(() => fail('the host did not declare the guest the winner'));
  await guest.waitForFunction(() => window.__da.race().winner === 'Sam', null, { timeout: T }).catch(() => fail('the guest never heard who won'));
  console.log('Sam finished first, on both screens');

  await host.evaluate(() => { const o = document.getElementById('overlay'); if (o) o.hidden = true; });
  await guest.evaluate(() => { const o = document.getElementById('overlay'); if (o) o.hidden = true; });
  await host.screenshot({ path: path.join(OUT, 'da-host.png') });
  await guest.screenshot({ path: path.join(OUT, 'da-guest.png') });
  await browser.close();
  if (errors.length) console.log('console errors:\n  ' + errors.join('\n  '));
  console.log(`room ${table.room} · guest built and won · identical`);
  console.log(`screenshots: ${OUT}/da-host.png ${OUT}/da-guest.png`);
})().catch(e => { console.error(e); process.exit(1); });
