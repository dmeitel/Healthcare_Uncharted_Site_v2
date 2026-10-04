/* ================================================================
   THE RACE, THE REAL ROUND TRIP: node scripts/backend-check-da.js [url]

   Two headless browsers open Device Assembly. One opens a race room, the
   other joins by code over the REAL relay and is seated, the host starts
   the race with two bots, the wall opens on the guest, the guest builds
   the first tutorial and its wall lands on the host byte for byte, the
   guest's finished build is judged by the host, and both screens show
   the same places. Screenshots (the room card, the guest racing) land in
   tmp/. (Stage A6, 2026-10-04; before it, the two-wall race.)

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

  const table = await host.evaluate(() => { const ok = window.__da.raceHostRoom(); const N = window.__da.NET; window.__da.race().prefs = { wall: 't1', bots: 2 }; return { ok, room: N.room, kind: N.chan && N.chan.kind }; });
  if (!table.ok || table.kind !== 'internet') fail('the host did not get the internet relay');
  console.log(`room ${table.room} over the ${table.kind} transport`);

  await guest.evaluate(code => { window.__da.T.join(code, 'Sam'); }, table.room);
  await host.waitForFunction(() => window.__da.NET.seats.p2 === 'Sam', null, { timeout: T }).catch(() => fail('the host never seated the guest'));
  await guest.waitForFunction(() => window.__da.NET.seat === 'p2' && window.__da.race() && Object.values(window.__da.race().runners).some(u => u.name === 'Sam'), null, { timeout: T })
    .catch(() => fail('the guest never saw itself in the lobby'));
  console.log('guest seated as builder 2 and in the lobby');
  await host.screenshot({ path: path.join(OUT, 'da-room.png') });

  await host.evaluate(() => { window.__da.raceStart('t1'); });
  await guest.waitForFunction(() => window.__da.S && window.__da.S.level.id === 't1' && window.__da.race().started > 0, null, { timeout: T }).catch(() => fail('the race never opened on the guest'));
  const runners = await guest.evaluate(() => Object.keys(window.__da.race().runners).sort().join(','));
  if (runners !== 'bot1,bot2,p1,p2') fail('the guest sees the wrong runners: ' + runners);
  console.log('race started on both screens: ' + runners);

  // the guest builds the first tutorial through the real engine, on its own local wall
  const built = await guest.evaluate(() => {
    const da = window.__da, S = da.S, nose = da.GRID.nose;
    const can = da.place(S, 'cannula', nose[0], nose[1], 0).item; da.autoOrient(S, can.uid);
    const src = S.items.find(i => i.def.id === 'src-t1'); const barb = da.portsOf(src).find(p => p.std === 'barb');
    const r = da.connectPorts(S, { uid: can.uid, pi: 'lead' }, { uid: src.uid, pi: barb.pi }, null);
    da.netSync();
    return { ok: r.ok, snap: da.snapshot(S) };
  });
  if (!built.ok) fail('the guest could not build the wall');
  await host.waitForFunction(snap => window.__da.race().walls.p2 === snap, built.snap, { timeout: T }).catch(() => fail('the guest wall never reached the host byte for byte'));
  console.log('guest wall on the host, identical');
  await guest.screenshot({ path: path.join(OUT, 'da-guest.png') });

  await guest.evaluate(() => { const da = window.__da; da.raceSubmit(da.functionTest(da.S)); });
  await host.waitForFunction(() => window.__da.race().places[0] === 'p2', null, { timeout: T }).catch(() => fail('the host did not place the guest first'));
  await guest.waitForFunction(() => window.__da.race().places[0] === 'p2', null, { timeout: T }).catch(() => fail('the guest never heard its place'));
  console.log('Sam finished first, on both screens');
  await host.screenshot({ path: path.join(OUT, 'da-host.png') });
  await browser.close();
  if (errors.length) console.log('console errors:\n  ' + errors.join('\n  '));
  console.log(`room ${table.room} · guest seated, raced, judged by the host, placed first · identical`);
  console.log(`screenshots: ${OUT}/da-room.png ${OUT}/da-guest.png ${OUT}/da-host.png`);
})().catch(e => { console.error(e); process.exit(1); });
