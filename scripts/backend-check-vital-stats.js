/* ================================================================
   VITAL STATS, THE REAL ROUND TRIP: node scripts/backend-check-vital-stats.js [url]

   Three headless browsers open Vital Stats. A laptop hosts a room, a second
   laptop joins by typing the code, and a phone opens the invite link, all
   over the REAL relay (the Supabase project the page names, not the fake
   bus the unit tests use). The table auto-seats all three, the host deals,
   everyone guesses and bets through the page's own buttons for two rounds,
   and the script asserts that both guests' copies of the game are byte for
   byte the host's. Screenshots of the host and the phone land in tmp/.

   It talks to the internet, so it is NOT part of `npm test`. Default
   target is the local dev server; pass the live URL to check prod.
================================================================ */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL = process.argv[2] || 'http://localhost:8080/secret-menu/vital-stats/';
const OUT = path.join(__dirname, '..', 'tmp');
const T = 25000;
/** @param {string} msg */
function fail(msg) { console.error('FAIL: ' + msg); process.exit(1); }
setTimeout(() => fail('the whole check took longer than three minutes'), 180000).unref();

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  /** @type {string[]} */
  const errors = [];
  /** @param {string} name @param {number} w @param {number} h @param {boolean} phone @param {string} [url] */
  async function open(name, w, h, phone, url) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: phone, hasTouch: phone });
    await ctx.addInitScript(n => { window.__VS_HOOK = true; try { localStorage.setItem('vs-name', n); localStorage.setItem('hu-howto-vs', '1'); } catch (e) {} }, name);
    // the dev server reloads open pages when any file changes; a reload mid-check is not a relay failure
    await ctx.route('**/.11ty/reload-client.js', rt => rt.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
    const page = await ctx.newPage();
    page.on('console', m => { if (m.type() === 'error' && !/reload-client|integrity/.test(m.text())) errors.push(`[${name}] ${m.text()}`); });
    page.on('pageerror', e => errors.push(`[${name}] ${e.message}`));
    await page.goto(url || URL, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!(window.__vs && window.supabase), null, { timeout: T });
    return page;
  }

  const host = await open('Dana', 1280, 860, false);
  await host.click('[data-go="host"]');
  await host.waitForFunction(() => window.__vs.T.NET.room && window.__vs.G, null, { timeout: T }).catch(() => fail('the host never opened a room'));
  const room = await host.evaluate(() => ({ code: window.__vs.T.NET.room, kind: window.__vs.T.NET.chan && window.__vs.T.NET.chan.kind }));
  if (room.kind !== 'internet') fail('the host did not get the internet relay');
  console.log(`room ${room.code} over the ${room.kind} transport`);

  const laptop = await open('Sam', 1280, 860, false);
  await laptop.fill('#vsCode', room.code); await laptop.click('[data-go="joincode"]');
  const phone = await open('Kim', 390, 844, true, URL + '?room=' + room.code);
  await phone.click('[data-go="join"]');
  await host.waitForFunction(() => Object.keys(window.__vs.G.players).length >= 3, null, { timeout: T }).catch(() => fail('the host never seated both guests'));
  for (const g of [laptop, phone]) await g.waitForFunction(() => !!window.__vs.T.NET.seat, null, { timeout: T }).catch(() => fail('a guest never heard its chair back'));
  const seats = [await laptop.evaluate(() => window.__vs.T.NET.seat), await phone.evaluate(() => window.__vs.T.NET.seat)];
  if (!seats[0] || !seats[1] || seats[0] === seats[1]) fail('the guests did not get their own chairs: ' + seats.join(', '));
  console.log('seated: host p1, guests ' + seats.join(' and '));

  // a guest names a home state through its own chair (an any-seat intent), and the host deals a turf round for it
  await laptop.click('[data-go="pickhome"]');
  await laptop.click('dialog.vs-picker[open] [data-home="UT"]');
  await host.waitForFunction(s => window.__vs.G.players[s].home === 'UT', seats[0], { timeout: T }).catch(() => fail('the host never heard the guest\'s home state'));
  console.log('the laptop guest set a home state; the host has it');

  await host.click('[data-set="rounds"][data-val="5"]');
  await host.locator('[data-go="start"]:visible').first().click();
  for (let round = 1; round <= 2; round++) {
    for (const [p, v] of /** @type {[import('playwright').Page, string][]} */ ([[host, '100'], [laptop, '120'], [phone, '90']])) {
      await p.waitForSelector('#vsAns', { timeout: T }).catch(() => fail('round ' + round + ': no question arrived'));
      await p.fill('#vsAns', v);
      await p.locator('[data-go="lockans"]:visible').first().click();
    }
    for (const p of [host, laptop, phone]) {
      await p.waitForSelector('.vs-slot:not([disabled])', { timeout: T }).catch(() => fail('round ' + round + ': the board never opened for betting'));
      await p.locator('.vs-slot:not([disabled])').last().click();
      await p.waitForTimeout(300);
      await p.locator('[data-go="betdone"]:visible').first().click();
    }
    await host.waitForSelector('#vsTruth', { timeout: T }).catch(() => fail('round ' + round + ': no reveal on the host'));
    await phone.waitForSelector('#vsTruth', { timeout: T }).catch(() => fail('round ' + round + ': no reveal on the phone'));
    if (round === 1) { await host.screenshot({ path: path.join(OUT, 'vital-stats-host.png') }); await phone.screenshot({ path: path.join(OUT, 'vital-stats-phone.png') }); }
    await host.waitForTimeout(600);
    await host.locator('[data-go="next"]:visible').first().click();
    console.log('round ' + round + ' played');
  }
  await host.waitForTimeout(2000);
  /** @param {import('playwright').Page} p */
  const snap = p => p.evaluate(() => JSON.stringify(window.__vs.E.packState(window.__vs.G)));
  const H = await snap(host), A = await snap(laptop), B = await snap(phone);
  if (A !== H) fail('the laptop guest\'s game differs from the host\'s');
  if (B !== H) fail('the phone guest\'s game differs from the host\'s');
  if (errors.length) fail('console errors:\n' + errors.join('\n'));
  console.log('three browsers, two rounds, every copy identical to the host\'s. Screenshots: tmp/vital-stats-host.png, tmp/vital-stats-phone.png');
  await browser.close();
  process.exit(0);
})().catch(e => fail(String(e && e.message || e).split('\n')[0]));
