/* ================================================================
   PHONE QA · npm run qa:phone [site]

   David's QA list, run by a script instead of his hands. An emulated phone
   (360 x 740, touch) and a laptop (1280 x 800) open the site and do what he
   would do:

     THE RACE     the phone hosts an assembly table, the laptop joins by code,
                  both build the first wall, the laptop finishes first and both
                  screens say so.
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
  const ctx = await browser.newContext({ ...dev, acceptDownloads: true });
  if (init) await ctx.addInitScript(init);
  const page = await ctx.newPage();
  page.__touch = !!dev.hasTouch;   // a phone taps, a laptop clicks
  page.on('console', m => { if (m.type() === 'error') errors.push(`[${who}] ${m.text()}`); });
  page.on('pageerror', e => errors.push(`[${who}] ${e.message}`));
  await page.goto(url, { waitUntil: 'networkidle' });
  if (!(await until(page, ready))) throw new Error(who + ': the page never got ready at ' + url);
  return page;
}
// a lobby re-renders itself when the roster changes, so a control can vanish between finding it and
// pressing it; find it again rather than fail on a race the player never sees
async function tap(page, sel) {
  for (let i = 0; ; i++) {
    try { const l = page.locator(sel).first(); await l.waitFor({ timeout: T }); if (page.__touch) await l.tap({ timeout: T }); else await l.click({ timeout: T }); return; }
    catch (e) { if (i >= 3 || !/detached|not attached|stable/i.test(e.message)) throw e; await pause(300); }
  }
}
// on a phone the assembly spec sheet is a bottom sheet: the Levels chip opens it on the level's own page,
// which is where the Two walls fold lives; on a laptop the sheet is always beside the board
async function openSheet(page) { if (page.__touch && !(await page.locator('details.da-table').first().isVisible().catch(() => false))) { await tap(page, '#menuBtnI'); await pause(600); } }
async function fill(page, sel, v) { const l = page.locator(sel).first(); await l.waitFor({ timeout: T }); await l.fill(v, { timeout: T }); }
async function seeText(page, sel, text) { const l = page.locator(sel).first(); await l.waitFor({ timeout: T }); return ((await l.textContent()) || '').includes(text); }

/* ── THE RACE ─────────────────────────────────────────────────── */
async function theRace(browser) {
  const S = 'race';
  const url = BASE + '/secret-menu/device-assembly/';
  const ready = () => !!(window.__da && window.__da.T && window.supabase);
  const init = () => { window.__DA_HOOK = true; };
  const phone = await open(browser, PHONE, url, init, ready, 'race phone');
  const laptop = await open(browser, LAPTOP, url, init, ready, 'race laptop');
  try {
    // the phone opens the spec sheet, then the Two walls fold, types a name, hosts
    await openSheet(phone);
    const fold = phone.locator('details.da-table').first();
    await fold.waitFor({ timeout: T });
    if (!(await fold.evaluate(el => el.open))) await tap(phone, 'details.da-table > summary');
    await fill(phone, '#daName', 'Dave');
    await tap(phone, '#daHost');
    const hosted = await until(phone, () => window.__da.NET.mode === 'host' && window.__da.NET.chan && window.__da.NET.chan.kind === 'internet');
    const code = hosted ? await phone.evaluate(() => window.__da.NET.room) : null;
    const codeShown = hosted && await seeText(phone, 'details.da-table > summary', code);
    await shot(phone, 'race-1-phone-hosted');
    if (!step(S, 'phone hosted a table over the internet relay, code on screen', hosted && codeShown, code ? 'table ' + code : '')) return;

    // the host makes sure the race is the first tutorial wall
    const level = await phone.evaluate(() => window.__da.S && window.__da.S.level.id);
    if (level !== 't1') {
      await openSheet(phone);
      const walls = phone.locator('details.da-walls').first();
      if (!(await walls.evaluate(el => el.open))) await tap(phone, 'details.da-walls > summary');
      await tap(phone, 'button.da-lv[data-level="t1"]');
    }
    const onT1 = await until(phone, () => window.__da.race().level === 't1' && window.__da.S.level.id === 't1');
    if (!step(S, 'the phone picked Tutorial 1 for the race', onT1)) return;

    // the laptop joins by code
    await openSheet(laptop);
    const lfold = laptop.locator('details.da-table').first();
    await lfold.waitFor({ timeout: T });
    if (!(await lfold.evaluate(el => el.open))) await tap(laptop, 'details.da-table > summary');
    await fill(laptop, '#daName', 'Sam');
    await tap(laptop, '#daJoin');
    await fill(laptop, '#daCode', code);
    await tap(laptop, '#daJoinGo');
    const seated = await until(phone, () => window.__da.NET.seats.b === 'Sam');
    const followed = await until(laptop, () => window.__da.race().level === 't1' && window.__da.S && window.__da.S.level.id === 't1');
    await shot(phone, 'race-2-phone-roster');
    await shot(laptop, 'race-2-laptop-joined');
    const netOf = p => p.evaluate(() => { const N = window.__da.NET; return `${N.mode} ${N.room} roster=${N.roster.join('+')} seats=${JSON.stringify(N.seats)} seat=${N.seat} level=${window.__da.race().level}`; });
    if (!step(S, 'laptop joined by code, took Wall B, opened the same wall', seated && followed, (seated && followed) ? '' : `phone: ${await netOf(phone)} · laptop: ${await netOf(laptop)}`)) return;

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
    const phoneSees = await until(phone, snap => window.__da.otherWall() === snap, lb.snap);
    const laptopSees = await until(laptop, snap => window.__da.otherWall() === snap, pb.snap);
    await shot(phone, 'race-3-phone-building');
    await shot(laptop, 'race-3-laptop-building');
    if (!step(S, 'both walls built, each mirrored on the other screen byte for byte', pb.ok && lb.ok && phoneSees && laptopSees)) return;

    // the laptop submits first
    await laptop.evaluate(() => { const da = window.__da; da.raceSubmit(da.functionTest(da.S)); });
    const wonHost = await until(phone, () => window.__da.race().winner === 'Sam');
    const wonGuest = await until(laptop, () => window.__da.race().winner === 'Sam');
    await pause(600);
    await shot(phone, 'race-4-phone-result');
    await shot(laptop, 'race-4-laptop-result');
    step(S, 'laptop finished first, both screens say so', wonHost && wonGuest);
  } catch (e) {
    step(S, 'threw', false, e.message.split('\n')[0]);
    await shot(phone, 'race-FAIL-phone').catch(() => {}); await shot(laptop, 'race-FAIL-laptop').catch(() => {});
  } finally { await phone.context().close(); await laptop.context().close(); }
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
    await fill(phone, '#ug-netname', 'Dave');
    await tap(phone, '[data-act="hosttable"]');
    const hosted = await until(phone, () => window.__ug.NET.mode === 'host' && window.__ug.NET.chan && window.__ug.NET.chan.kind === 'internet');
    const code = hosted ? await phone.evaluate(() => window.__ug.NET.room) : null;
    const codeShown = hosted && await seeText(phone, '.ug-roomcode', code);
    await shot(phone, 'table-1-phone-hosted');
    if (!step(S, 'phone hosted a table over the internet relay, code on screen', hosted && codeShown, code ? 'table ' + code : '')) return;

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
  const phone = await open(browser, PHONE, BASE + '/fun/alarm-fatigue/', null, () => !!(window.__af && document.getElementById('bigBtn')), 'card phone');
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
  const phone = await open(browser, PHONE, BASE + '/learn/alarm-fatigue/', null, () => !!document.querySelector('.afe-h1'), 'article phone');
  try {
    await shot(phone, 'article-1-phone-top');
    const h1 = (await phone.locator('.afe-h1').textContent()) || '';
    step(S, 'the page opened on the phone', h1.includes('Alarm fatigue'), h1.trim());

    const links = await phone.evaluate(() => Array.from(document.querySelectorAll('.afe-src a')).map(a => ({ href: a.getAttribute('href'), ext: a.target === '_blank' })));
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
