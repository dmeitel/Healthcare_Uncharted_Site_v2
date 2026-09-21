/* ================================================================
   THE REAL ROUND TRIP — npm run backend:check [url]

   Two headless browsers open the hospital game. One hosts a table, the
   other joins it by code over the REAL relay (the Supabase project the
   page names, not the fake bus the unit tests use), claims the Clinical
   seat, watches the host start a run, hires one nurse, and the script
   asserts the guest's packed run is byte-identical to the host's.

   It talks to the internet, so it is NOT part of `npm test`. Run it when
   the backend changes, after a deploy (pass the live URL), or whenever
   multiplayer "feels" off. Exit 0 and the word "identical" mean the
   pipes work. Screenshots of both screens land in tmp/.

   Default target is the local dev server; pass a URL to check prod:
     node scripts/backend-check.js https://healthcareuncharted.com/secret-menu/uncharted-general/
================================================================ */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL = process.argv[2] || 'http://localhost:8080/secret-menu/uncharted-general/';
const OUT = path.join(__dirname, '..', 'tmp');
const T = 25000;

// A failure exits outright: a thrown error with the browser still open would leave the process
// hanging on Chromium, and the caller would see a timeout instead of the reason.
function fail(msg) { console.error('FAIL: ' + msg); process.exit(1); }
setTimeout(() => fail('the whole check took longer than three minutes'), 180000).unref();

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const errors = [];

  async function open(name) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await ctx.addInitScript(() => { window.__UG_TEST = true; });
    const page = await ctx.newPage();
    page.on('console', m => { if (m.type() === 'error') errors.push(`[${name}] ${m.text()}`); });
    page.on('pageerror', e => errors.push(`[${name}] ${e.message}`));
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!(window.__ug && window.supabase), null, { timeout: T });
    await page.evaluate(n => { window.__ug.settings.playerName = n; }, name);
    return page;
  }

  const host = await open('Dave');
  const guest = await open('Sam');

  const table = await host.evaluate(() => {
    window.__ug.hostTable();
    return { room: window.__ug.NET.room, kind: window.__ug.NET.chan && window.__ug.NET.chan.kind };
  });
  console.log(`table ${table.room} over the ${table.kind} transport`);
  if (table.kind !== 'internet') fail('the host did not get the internet relay; the page has no backend or supabase-js did not load');

  await guest.evaluate(code => { window.__ug.joinTable(code, 'Sam'); }, table.room);
  await host.waitForFunction(() => window.__ug.NET.roster.includes('Sam'), null, { timeout: T })
    .catch(() => fail('the host never heard the guest knock (relay did not deliver the hello)'));
  console.log('guest heard by the host');

  await guest.evaluate(() => { window.__ug.claimSeat('clinical'); });
  await host.waitForFunction(() => window.__ug.NET.seats.clinical === 'Sam', null, { timeout: T })
    .catch(() => fail('the host did not seat the guest'));
  await guest.waitForFunction(() => window.__ug.NET.seat === 'clinical', null, { timeout: T })
    .catch(() => fail('the guest never learned their chair'));
  console.log('seat: clinical');

  await host.evaluate(() => { window.__ug.netAct('start', { ceo: 'mha' }); });
  await guest.waitForFunction(() => !!window.__ug.run, null, { timeout: T })
    .catch(() => fail('the run never reached the guest screen'));

  const rnBefore = await host.evaluate(() => window.__ug.run.departments[0].staff.rn);
  await guest.evaluate(() => { window.__ug.netAct('hire', { i: '0', type: 'rn' }); });
  await host.waitForFunction(b => window.__ug.run.departments[0].staff.rn === b + 1, rnBefore, { timeout: T })
    .catch(() => fail('the host did not apply the guest\'s hire'));
  console.log('hire applied on the host');

  const packed = p => p.evaluate(() => JSON.stringify(window.__ug.packSave().run));
  const t0 = Date.now();
  let same = false;
  while (Date.now() - t0 < T) {
    const [a, b] = await Promise.all([packed(host), packed(guest)]);
    if (a === b) { same = true; break; }
    await new Promise(r => setTimeout(r, 300));
  }

  await host.screenshot({ path: path.join(OUT, 'table-host.png') });
  await guest.screenshot({ path: path.join(OUT, 'table-guest.png') });
  if (!same) fail('the guest\'s hospital never matched the host\'s after the echo');
  console.log(`room ${table.room} · seat clinical · identical`);

  // The reload step: the host's tab dies and comes back, resumes the SAME table, and the guest
  // (who did nothing) is back in sync; then the guest's tab dies and comes back with one tap.
  async function inSync(label) {
    const t = Date.now();
    while (Date.now() - t < T) {
      const [a, b] = await Promise.all([packed(host), packed(guest)]);
      if (a && a === b) return true;
      await new Promise(r => setTimeout(r, 300));
    }
    fail(label);
  }
  await host.reload({ waitUntil: 'networkidle' });
  await host.waitForFunction(() => !!(window.__ug && window.supabase), null, { timeout: T });
  const resumed = await host.evaluate(() => ({ ok: window.__ug.resumeTable(), room: window.__ug.NET.room }));
  if (!resumed.ok || resumed.room !== table.room) fail('the host could not resume table ' + table.room + ' after a reload');
  // The guest already holds the same state, so "in sync" alone would prove nothing here. What
  // matters is that the resumed host is JOINED and can hear again; a guest who acts inside the
  // join window loses that one move (they get a "try again" hint), which is the accepted cost.
  await host.waitForFunction(() => window.__ug.NET._supa && window.__ug.NET._supa.getChannels().some(c => c.state === 'joined'), null, { timeout: T })
    .catch(() => fail('the resumed host never joined the relay channel'));
  await inSync('after the host resumed, the guest never caught up');
  const rn2 = await host.evaluate(() => window.__ug.run.departments[0].staff.rn);
  await guest.evaluate(() => { window.__ug.netAct('hire', { i: '0', type: 'rn' }); });
  await host.waitForFunction(b => window.__ug.run.departments[0].staff.rn === b + 1, rn2, { timeout: T })
    .catch(() => fail('the resumed host did not apply the guest\'s next move'));
  await inSync('after the guest\'s move, the resumed table drifted');
  console.log('host reload · resumed ' + resumed.room + ' · guest still seated · identical');

  await guest.reload({ waitUntil: 'networkidle' });
  await guest.waitForFunction(() => !!(window.__ug && window.supabase), null, { timeout: T });
  const rejoined = await guest.evaluate(() => window.__ug.rejoinTable());
  if (!rejoined) fail('the guest had no table to rejoin after a reload');
  await guest.waitForFunction(() => !!window.__ug.run && window.__ug.NET.seat === 'clinical', null, { timeout: T })
    .catch(() => fail('the guest rejoined but did not get the run and the seat back'));
  await inSync('after the guest rejoined, the screens differ');
  console.log('guest reload · rejoined with one tap · seat clinical · identical');

  await host.screenshot({ path: path.join(OUT, 'table-host-resumed.png') });
  await guest.screenshot({ path: path.join(OUT, 'table-guest-rejoined.png') });
  await browser.close();
  if (errors.length) console.log('console errors:\n  ' + errors.join('\n  '));
  console.log(`screenshots in ${OUT}: table-host.png table-guest.png table-host-resumed.png table-guest-rejoined.png`);
})().catch(e => { if (!process.exitCode) { console.error(e); process.exitCode = 1; } });
