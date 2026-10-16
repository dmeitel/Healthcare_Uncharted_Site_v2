/* ================================================================
   PHONE QA · npm run qa:phone [site]

   David's QA list, run by a script instead of his hands. An emulated phone
   (360 x 740, touch) and a laptop (1280 x 800) open the site and do what he
   would do:

     THE RACE     the phone creates a race room from Home, the laptop opens
                  the invite link and joins, both build the first wall, the
                  laptop taps Complete first and both screens place it first.
     THE TABLE    the phone hosts a hospital table, the laptop takes the Finance
                  seat, the phone (GM) puts the state's offer on the table, the
                  CEO accepts on the phone, Finance countersigns on the laptop,
                  both hospitals are byte-identical after.
     THE CARD     the phone clocks in to Alarm Fatigue, works a few tasks, takes
                  the lunch break, taps Share card, and the picture it downloads
                  is saved next to the screenshots.
     THE ARTICLE  the phone reads Article 11, checks every source is a link,
                  taps through to the game, and finds the card on the Learn shelf.

   Every step leaves a screenshot in tmp/qa/. It talks to the internet relay, so
   it is NOT part of `npm test`. Default target is the local dev server; pass the
   live site to check a deploy:
     npm run qa:phone -- https://healthcareuncharted.com

   Exit 0 means every step passed. What it cannot do: be a real phone (a
   backgrounded tab on iOS or Android, a thumb on glass) or say whether a thing
   looks right. Those two stay David's.
================================================================ */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = (process.argv[2] || 'http://localhost:8080').replace(/\/$/, '');
const OUT = path.join(__dirname, '..', 'tmp', 'qa');
const T = 25000;
const PHONE = { viewport: { width: 360, height: 740 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const LAPTOP = { viewport: { width: 1280, height: 800 } };

setTimeout(() => { console.error('FAIL: the whole run took longer than eight minutes'); process.exit(1); }, 480000).unref();

const results = [];
const errors = [];
function step(scene, name, ok, note) {
  results.push({ scene, name, ok, note });
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${scene} · ${name}${note ? ' · ' + note : ''}`);
  return ok;
}
const shot = (page, name) => page.screenshot({ path: path.join(OUT, name + '.png') });
async function until(page, fn, arg) { try { await page.waitForFunction(fn, arg, { timeout: T }); return true; } catch { return false; } }
const pause = ms => new Promise(r => setTimeout(r, ms));

async function open(browser, dev, url, init, ready, who) {
  const ctx = await browser.newContext({ ...dev, acceptDownloads: true, colorScheme: 'dark' });
  if (init) await ctx.addInitScript(init);
  const page = await ctx.newPage();
  page.__touch = !!dev.hasTouch;   // a phone taps, a laptop clicks
  page.on('console', m => { if (m.type() === 'error') errors.push(`[${who}] ${m.text()}`); });
  page.on('pageerror', e => errors.push(`[${who}] ${e.message}`));
  await page.goto(url, { waitUntil: 'networkidle' });
  if (!(await until(page, ready))) throw new Error(who + ': the page never got ready at ' + url);
  await passHowTo(page);
  return page;
}
// every game opens its how-to card by itself on a first visit (the menus contract, 2026-09-23); a player reads it
// and presses its button (Clock in) or the X, and so does this script, or every tap lands on the modal card
/** @param {import('playwright').Page} page */
async function passHowTo(page) {
  const card = page.locator('dialog.hu-dlg--howto[open]').first();
  try { await card.waitFor({ timeout: 1500 }); } catch { return; }
  const go = card.locator('.hu-gm-go');
  if (await go.count()) await tap(page, 'dialog.hu-dlg--howto[open] .hu-gm-go'); else await tap(page, 'dialog.hu-dlg--howto[open] .hu-dlg-x');
  await pause(400);
}
// a lobby re-renders itself when the roster changes, so a control can vanish between finding it and
// pressing it; find it again rather than fail on a race the player never sees
async function tap(page, sel) {
  for (let i = 0; ; i++) {
    try { const l = page.locator(sel).first(); await l.waitFor({ timeout: T }); if (page.__touch) await l.tap({ timeout: T }); else await l.click({ timeout: T }); return; }
    catch (e) { if (i >= 3 || !/detached|not attached|stable/i.test(e.message)) throw e; await pause(300); }
  }
}
async function fill(page, sel, v) { const l = page.locator(sel).first(); await l.waitFor({ timeout: T }); await l.fill(v, { timeout: T }); }
async function seeText(page, sel, text) { const l = page.locator(sel).first(); await l.waitFor({ timeout: T }); return ((await l.textContent()) || '').includes(text); }

/* ── THE RACE ─────────────────────────────────────────────────── */
// THE RACE as a player meets it (stage A6, 2026-10-04; the door since 2026-10-06): Home, then Race, a name, Create a room; the room card's code
// and invite link; a guest who opens the link and joins; the host starts; first build through the test wins.
async function theRace(browser) {
  const S = 'race';
  const wall = BASE + '/fun/headwall/?wall=t1';
  const ready = () => !!(window.__da && window.__da.T && window.supabase);
  const init = () => { window.__DA_HOOK = true; };
  const phone = await open(browser, PHONE, wall, init, ready, 'race phone');
  let laptop = null;
  try {
    // the phone, on Tutorial 1, opens the front door (Home) and its Race tile, types a name, creates a room
    await tap(phone, '#menuBtnI');
    await tap(phone, '#daDoor [data-level="race:new"]');
    await fill(phone, '#daName', 'Dave');
    await tap(phone, '#rHost');
    const hosted = await until(phone, () => window.__da.NET.mode === 'host' && window.__da.NET.chan && window.__da.NET.chan.kind === 'internet');
    const code = hosted ? await phone.evaluate(() => window.__da.NET.room) : null;
    const codeShown = hosted && await seeText(phone, '.da-roomcode', code);
    await shot(phone, 'race-1-phone-room');
    if (!step(S, 'phone created a room over the internet relay, code on the room card', hosted && codeShown, code ? 'room ' + code : '')) return;

    // the race is on this wall, with no bots, so the two people decide it
    await tap(phone, '[data-rwall="this"]');
    for (let i = 0; i < 8 && await phone.evaluate(() => ((window.__da.race().prefs || {}).bots | 0) > 0); i++) await tap(phone, '[data-rbot="-1"]');
    const set = await phone.evaluate(() => { const p = window.__da.race().prefs || {}; return p.wall === 'this' && (p.bots | 0) === 0; });
    if (!step(S, 'the phone set the race to this wall, no bots', set)) return;

    // the laptop opens the invite link, types a name, joins
    laptop = await open(browser, LAPTOP, BASE + '/fun/headwall/?room=' + code, init, ready, 'race laptop');
    await fill(laptop, '#daName', 'Sam');
    await tap(laptop, '#rJoinInv');
    const seated = await until(phone, () => window.__da.NET.seats.p2 === 'Sam');
    const lobby = await until(laptop, () => window.__da.NET.seat === 'p2' && !!document.querySelector('#rLeave'));
    await shot(phone, 'race-2-phone-room');
    await shot(laptop, 'race-2-laptop-lobby');
    if (!step(S, 'laptop opened the invite link and joined; the phone seated it', seated && lobby)) return;

    // the phone starts the race; Tutorial 1 opens on both screens
    await tap(phone, '#rDeal');
    const onT1 = (p) => until(p, () => window.__da.S && window.__da.S.level.id === 't1' && window.__da.race().started > 0);
    const opened = await onT1(phone) && await onT1(laptop);
    if (!step(S, 'the race opened on Tutorial 1 on both screens', opened)) return;

    // both build the wall through the engine (a scripted thumb cannot drag on the SVG reliably)
    const build = () => {
      const da = window.__da, S = da.S, nose = da.GRID.nose;
      const can = da.place(S, 'cannula', nose[0], nose[1], 0).item; da.autoOrient(S, can.uid);
      const src = S.items.find(i => i.def.id === 'src-t1'); const barb = da.portsOf(src).find(p => p.std === 'barb');
      const r = da.connectPorts(S, { uid: can.uid, pi: 'lead' }, { uid: src.uid, pi: barb.pi }, null);
      da.netSync(); if (typeof da.render === 'function') da.render();
      return { ok: r.ok, snap: da.snapshot(S) };
    };
    const pb = await phone.evaluate(build);
    const lb = await laptop.evaluate(build);
    const hostSees = await until(phone, snap => window.__da.race().walls.p2 === snap, lb.snap);
    await shot(phone, 'race-3-phone-building');
    await shot(laptop, 'race-3-laptop-building');
    if (!step(S, 'both walls built; the laptop\'s reached the phone byte for byte', pb.ok && lb.ok && hostSees)) return;

    // the laptop taps Complete first
    await tap(laptop, '#submitBtn');
    const first = (p) => until(p, () => window.__da.race().places[0] === 'p2');
    const won = await first(phone) && await first(laptop);
    await pause(600);
    await shot(phone, 'race-4-phone-result');
    await shot(laptop, 'race-4-laptop-result');
    step(S, 'laptop tapped Complete first, both screens place it first', won);
  } catch (e) {
    step(S, 'threw', false, e.message.split('\n')[0]);
    await shot(phone, 'race-FAIL-phone').catch(() => {}); if (laptop) await shot(laptop, 'race-FAIL-laptop').catch(() => {});
  } finally { await phone.context().close(); if (laptop) await laptop.context().close(); }
}

/* ── THE TABLE ────────────────────────────────────────────────── */
async function theTable(browser) {
  const S = 'table';
  const url = BASE + '/secret-menu/uncharted-general/';
  const ready = () => !!(window.__ug && window.supabase);
  const init = () => { window.__UG_TEST = true; };
  const phone = await open(browser, PHONE, url, init, ready, 'table phone');
  const laptop = await open(browser, LAPTOP, url, init, ready, 'table laptop');
  try {
    await tap(phone, '#ug-tab-table');   // the table lives on its own tab of the start card since 2026-09-24
    await fill(phone, '#ug-netname', 'Dave');
    await tap(phone, '[data-act="hosttable"]');
    const hosted = await until(phone, () => window.__ug.NET.mode === 'host' && window.__ug.NET.chan && window.__ug.NET.chan.kind === 'internet');
    const code = hosted ? await phone.evaluate(() => window.__ug.NET.room) : null;
    const codeShown = hosted && await seeText(phone, '.ug-roomcode', code);
    await shot(phone, 'table-1-phone-hosted');
    if (!step(S, 'phone hosted a table over the internet relay, code on screen', hosted && codeShown, code ? 'table ' + code : '')) return;

    await tap(laptop, '#ug-tab-table');
    await fill(laptop, '#ug-netname', 'Sam');
    await tap(laptop, '[data-act="jointable"]');
    await fill(laptop, '#ug-joincode', code);
    await tap(laptop, '[data-act="joingo"]');
    const heard = await until(phone, () => window.__ug.NET.roster.includes('Sam'));
    await tap(laptop, '[data-act="seatpick"][data-seat="finance"]');
    const seatedHost = await until(phone, () => window.__ug.NET.seats.finance === 'Sam');
    const seatedGuest = await until(laptop, () => window.__ug.NET.seat === 'finance');
    await shot(laptop, 'table-2-laptop-finance-seat');
    await shot(phone, 'table-2-phone-roster');
    if (!step(S, 'laptop joined by code and took the Finance seat', heard && seatedHost && seatedGuest)) return;

    // the host starts the run (the start-menu CEO pick is the solo flow, already played to death)
    await phone.evaluate(() => { window.__ug.netAct('start', { ceo: 'mha' }); });
    const guestRun = await until(laptop, () => !!window.__ug.run);
    const gmShown = await until(phone, () => { const g = document.getElementById('ug-gm'); return !!g && !g.hidden && !!g.querySelector('[data-act="gmplay"]'); });
    if (gmShown) await phone.locator('#ug-gm').scrollIntoViewIfNeeded();
    await shot(phone, 'table-3-phone-gm-console');
    if (!step(S, 'run on both screens, GM console at the bottom of the host phone', guestRun && gmShown)) return;

    // the GM plays the state's offer; it lands on the guest
    await tap(phone, '[data-act="gmplay"][data-id="state300"]');
    const landed = await until(laptop, () => !!(window.__ug.run.offer && window.__ug.run.offer.id === 'state300'));
    const cardOnGuest = landed && (await laptop.locator('.ug-offer').count()) > 0;
    if (cardOnGuest) await laptop.locator('.ug-offer').first().scrollIntoViewIfNeeded();
    await shot(laptop, 'table-4-laptop-offer');
    await phone.locator('.ug-offer').first().scrollIntoViewIfNeeded().catch(() => {});
    await shot(phone, 'table-4-phone-offer');
    if (!step(S, 'the state offer landed on the guest screen as a card', cardOnGuest)) return;

    // the CEO (unclaimed, so the host) accepts on the phone; Finance countersigns on the laptop
    await tap(phone, '.ug-offer [data-act="offeracc"]');
    const ceoSaidYes = await until(laptop, () => !!(window.__ug.run.offer && window.__ug.run.offer.status === 'ceo'));
    if (!step(S, 'CEO accepted on the phone, the guest sees Finance has the pen', ceoSaidYes)) return;
    await tap(laptop, '.ug-offer [data-act="offersign"]');
    const sealed = await until(phone, () => !window.__ug.run.offer && (window.__ug.run.deals || []).some(d => d.id === 'state300'));
    const packed = p => p.evaluate(() => JSON.stringify(window.__ug.packSave().run));
    let same = false; const t0 = Date.now();
    while (Date.now() - t0 < T) { const [a, b] = await Promise.all([packed(phone), packed(laptop)]); if (a === b) { same = true; break; } await pause(300); }
    await shot(phone, 'table-5-phone-deal-signed');
    await shot(laptop, 'table-5-laptop-deal-signed');
    step(S, 'Finance countersigned on the laptop, $300k landed, both hospitals identical', sealed && same);
  } catch (e) {
    step(S, 'threw', false, e.message.split('\n')[0]);
    await shot(phone, 'table-FAIL-phone').catch(() => {}); await shot(laptop, 'table-FAIL-laptop').catch(() => {});
  } finally { await phone.context().close(); await laptop.context().close(); }
}

/* ── THE CARD ─────────────────────────────────────────────────── */
async function theCard(browser) {
  const S = 'card';
  // the game's hook exists only when __UG_TEST is set before its script runs (games.md; gated 2026-09-23)
  const phone = await open(browser, PHONE, BASE + '/fun/alarm-fatigue/', () => { window.__UG_TEST = true; }, () => !!(window.__af && document.getElementById('bigBtn')), 'card phone');
  try {
    // the phone gets a "best on a bigger screen" card first; David would tap Clock in anyway
    if (await phone.locator('#afbsGo').isVisible().catch(() => false)) { await tap(phone, '#afbsGo'); await pause(400); }
    await shot(phone, 'card-0-phone-clock-in');
    for (let i = 0; i < 6; i++) { await tap(phone, '#bigBtn'); await pause(250); }
    const working = await phone.evaluate(() => window.__af.S.started && window.__af.S.stats.clicks >= 6);
    await shot(phone, 'card-1-phone-floor');
    if (!step(S, 'clocked in and worked six tasks', working)) return;

    // the lunch break the shop sells, taken directly (the buying part is the game, not the card)
    await phone.evaluate(() => { window.__af.endShift('lunch'); });
    const lunch = await until(phone, () => { const L = document.getElementById('lunch'); return !!L && L.classList.contains('show') && !!document.getElementById('lunchShare'); });
    await pause(400);
    await shot(phone, 'card-2-phone-lunch');
    if (!step(S, 'the lunch screen opened with a Share card button', lunch)) return;

    const dl = phone.waitForEvent('download', { timeout: T }).catch(() => null);
    const reach = await phone.evaluate(() => { const b = document.getElementById('lunchShare'); const r = b.getBoundingClientRect(); return { y: Math.round(r.y), h: innerHeight }; });
    await tap(phone, '#lunchShare').catch(() => {});
    const d = await dl;
    if (!d) { step(S, 'Share card tapped, the picture downloaded', false, 'no download; the button sat at y=' + reach.y + ' in a ' + reach.h + ' px screen'); return; }
    const file = path.join(OUT, 'alarm-fatigue-shift-card.jpg');
    await d.saveAs(file);
    const kb = Math.round(fs.statSync(file).size / 1024);
    step(S, 'Share card tapped, the picture downloaded', kb > 20, d.suggestedFilename() + ' · ' + kb + ' KB');
  } catch (e) {
    step(S, 'threw', false, e.message.split('\n')[0]);
    await shot(phone, 'card-FAIL-phone').catch(() => {});
  } finally { await phone.context().close(); }
}

/* ── THE ARTICLE ──────────────────────────────────────────────── */
async function theArticle(browser) {
  const S = 'article';
  const phone = await open(browser, PHONE, BASE + '/learn/alarm-fatigue/', null, () => !!document.querySelector('.hu-read-h1'), 'article phone');
  try {
    await shot(phone, 'article-1-phone-top');
    const h1 = (await phone.locator('.hu-read-h1').textContent()) || '';
    step(S, 'the page opened on the phone', h1.includes('Alarm fatigue'), h1.trim());

    const links = await phone.evaluate(() => Array.from(document.querySelectorAll('.afe-src a')).map(a => ({ href: a.getAttribute('href'), ext: a.getAttribute('target') === '_blank' })));
    const external = links.filter(l => /^https:\/\//.test(l.href) && l.ext).length;
    const appendix = links.some(l => l.href === '/learn/sources/');
    await phone.locator('.afe-src a').first().scrollIntoViewIfNeeded();
    await shot(phone, 'article-2-phone-sources');
    step(S, 'every source line is a link, plus the Reference Appendix', external >= 7 && appendix, external + ' external links');

    const atlas = await phone.evaluate(() => Array.from(document.querySelectorAll('.afe-hero .card-fps a')).map(a => a.getAttribute('href')));
    step(S, 'the two Atlas links sit in the hero', atlas.includes('/atlas/#provider/nursing') && atlas.includes('/atlas/#provider/informatics'));

    await tap(phone, 'a.afe-btn');
    await phone.waitForURL(/\/fun\/alarm-fatigue\/?$/, { timeout: T }).catch(() => {});
    const onGame = /\/fun\/alarm-fatigue\/?$/.test(phone.url());
    await pause(500);
    await shot(phone, 'article-3-phone-play-tapped');
    step(S, 'Play Alarm Fatigue opens the game', onGame, phone.url());

    await phone.goto(BASE + '/learn/', { waitUntil: 'networkidle' });
    const card = phone.locator('.article-card a[href="/learn/alarm-fatigue/"]').first();
    const onShelf = await card.count() > 0;
    if (onShelf) await card.scrollIntoViewIfNeeded();
    await shot(phone, 'article-4-phone-learn-shelf');
    step(S, 'Article 11 is on the Learn shelf', onShelf);
  } catch (e) {
    step(S, 'threw', false, e.message.split('\n')[0]);
    await shot(phone, 'article-FAIL-phone').catch(() => {});
  } finally { await phone.context().close(); }
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  for (const f of fs.readdirSync(OUT)) fs.unlinkSync(path.join(OUT, f));
  const browser = await chromium.launch();
  console.log('phone QA against ' + BASE);
  await theRace(browser);
  await theTable(browser);
  await theCard(browser);
  await theArticle(browser);
  await browser.close();
  const failed = results.filter(r => !r.ok);
  console.log('\n' + results.length + ' steps, ' + failed.length + ' failed');
  if (errors.length) console.log('console errors:\n  ' + errors.join('\n  '));
  console.log('screenshots and the share card in ' + OUT);
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
