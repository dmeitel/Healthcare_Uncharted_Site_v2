// da-thumb.js · Device Assembly played with a thumb that misses. `npm run da:thumb`, and inside `npm run da:qa`.
//
// David, 2026-10-12: "I couldn't plug things in or connect things very easily with my fingers the menu at the bottom
// felt like it was taking up the screen all the time". The robot test it replaces aimed to the pixel on a 390 x 844
// screen and passed. This one plays at the four screens a phone browser really leaves (scripts/lib/thumb.js) and:
//   - rebuilds walls from their stored answers by touch, every part off the tray and every run port to port, each aim
//     off by 10 and then 20 px, turning through eight directions, once by dragging and once by taps alone (WCAG 2.5.7);
//   - checks the wall gets the screen, nothing sits over it while a part is held or picked, a wobbly tap stays a tap,
//     a tap on a run's port does not pull it off, a part reaches the bottom rows, and a part on the wall moves down
//     through the rows the old Back to cart strip covered.
// Plan and rules: docs/HU-PHONE-PLAY-PLAN-2026-10-12.md. Report: tmp/da-qa/thumb.json.
//
//   npm run da:thumb                          everything
//   npm run da:thumb -- t1 l2                 just those walls (the checks always run)
//   npm run da:thumb -- --screen SE --mode tap --miss 20
'use strict';
const fs = require('fs');
const path = require('path');
const T = require('./lib/thumb');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'tmp', 'da-qa');
const SHOTS = path.join(ROOT, 'tmp', 'hub', 'shots', 'device-assembly', 'puzzles');
const PAGE = '/fun/device-assembly/';
const WALLS = ['t1', 't2', 't3', 't4', 't5', 'l2', 'v2'];
const MISSES = [10, 20];
const MODES = ['drag', 'tap'];
const INIT = () => { window.__DA_HOOK = true; try { localStorage.setItem('hu-howto-da', '1'); localStorage.removeItem('hu-da-wall'); } catch (e) {} };   /* every load is a fresh wall: the game saves after each change */

/* ---------- in the page ---------- */

/** the answer's steps: new parts in the order they were built, then every run, both as answer uids */
function planIn() {
  const d = window.__da, L = d.S.level; if (!L.solution) return null;
  const s = JSON.parse(L.solution), start = new Set(d.S.items.map((i) => i.uid));
  return { items: s.items.filter((i) => !i.fixed && !start.has(i.uid)).map((i) => ({ auid: i.uid, def: i.def, x: i.x, y: i.y, fio2: i.fio2, cpap: i.cpap })),
    tubes: s.tubes.map((t) => ({ def: (t.def && t.def.id) || t.def, from: t.from, to: t.to, lead: !!t.lead })) };
}
/** where to put the thumb for a part from the tray: on its tile, then over the square it goes on (raised by the lift a drag carries) */
function aimItemIn([def, x, y, mode]) {
  const d = window.__da, D = d.DB[def];
  const all = /** @type {HTMLButtonElement|null} */ (document.querySelector('#cartTabs [data-tab="all"]')); if (all && !all.classList.contains('on') && !document.querySelector('#cartList .da-item[data-def="' + def + '"]')) all.click();
  const tile = /** @type {HTMLButtonElement|null} */ (document.querySelector('#cartList .da-item[data-def="' + def + '"]'));
  if (!tile) return { err: 'no ' + def + ' on the tray' };
  if (tile.disabled) return { err: def + ' is greyed on the tray' };
  tile.scrollIntoView({ block: 'nearest', inline: 'center' });
  const b = document.getElementById('board').getBoundingClientRect(), sc = d.scale, V = d.VIEW, U = d.U, r = D.cartRot || 0, dm = d.dims(D, r), t = tile.getBoundingClientRect();
  const cx = b.left + (x * U - V.x) * sc + dm.w * U * sc / 2, cy = b.top + (y * U - V.y) * sc + dm.h * U * sc / 2;
  const lift = mode === 'drag' ? d.liftPx([{ def: D, r, x: 0, y: 0 }]) : 0;
  const from = [t.left + t.width / 2, Math.min(t.top + t.height / 2, t.top + 20)];
  /* a thumb pulls a part up out of the tray first, then across: a sideways start is the tray scrolling (the game's rule) */
  return { from, via: [from[0], Math.min(from[1] - 48, cy + lift)], to: [cx, cy + lift], uids: d.S.items.map((i) => i.uid) };
}
/** the part that just landed, and whether it is where the answer has it */
function landedIn([def, before, x, y, auid, fio2, cpap]) {
  const d = window.__da, seen = new Set(before), it = d.S.items.find((i) => !seen.has(i.uid) && i.def.id === def);
  if (!it) return { landed: false };
  if (fio2) d.dispatchAct('fio2', { uid: it.uid, value: fio2 });
  if (cpap) d.dispatchAct('cpap', { uid: it.uid, value: cpap });
  if (fio2 || cpap) d.render();
  return { landed: true, uid: it.uid, exact: it.x === x && it.y === y, at: [it.x, it.y] };
}
/** a run of the answer, on the live wall: skip it if it is already laid, otherwise where its two ends are on the screen */
function aimTubeIn([tb, map]) {
  const d = window.__da, S = d.S, live = (r) => r && ({ uid: map[r.uid] || r.uid, pi: r.pi });
  const A = live(tb.from), B = live(tb.to);
  if (!A || !B) return { skip: 'no ends' };
  const same = (p, q) => p && q && p.uid === q.uid && p.pi === q.pi;
  if (S.tubes.some((t) => (same(t.from, A) && same(t.to, B)) || (same(t.from, B) && same(t.to, A)))) return { skip: 'already laid' };
  const pa = d.findPort(S, A), pb = d.findPort(S, B); if (!pa || !pb) return { err: 'a port is missing' };
  const b = document.getElementById('board').getBoundingClientRect(), sc = d.scale, V = d.VIEW;
  const xy = (p) => { const q = d.portXY(p); return [b.left + (q[0] - V.x) * sc, b.top + (q[1] - V.y) * sc]; };
  let tile = null;
  if (!tb.lead) {
    const all = /** @type {HTMLButtonElement|null} */ (document.querySelector('#cartTabs [data-tab="all"]')); if (all && !document.querySelector('#cartList .da-item[data-def="' + tb.def + '"]')) all.click();
    const el = /** @type {HTMLButtonElement|null} */ (document.querySelector('#cartList .da-item[data-def="' + tb.def + '"]'));
    if (el && !el.disabled) { el.scrollIntoView({ block: 'nearest', inline: 'center' }); const t = el.getBoundingClientRect(); tile = [t.left + t.width / 2, t.top + Math.min(20, t.height / 2)]; }
  }
  return { a: xy(pa), b: xy(pb), tile, A, B, lift: d.TUBE_LIFT || 0, row: document.getElementById('cartDock').className, sel: S.sel, hand: !!S.hand, link: !!S.link };
}
/* the run is laid between the two ports, or from the first to the same port of an equal part (the next receptacle over: the
   wall's own verdict judges whether that matters), and it is the answer's tubing (a heated circuit is not plain 22 mm tubing) */
function joinedIn([A, B, def, lead]) {
  const S = window.__da.S, same = (p, q) => p && q && p.uid === q.uid && p.pi === q.pi, kind = (r) => { const it = r && S.items.find((i) => i.uid === r.uid); return it ? it.def.id + ':' + r.pi : ''; };
  const like = (p, q) => same(p, q) || (p && q && kind(p) === kind(q));
  const t = S.tubes.find((x) => (same(x.from, A) && like(x.to, B)) || (like(x.from, B) && same(x.to, A)) || (like(x.from, A) && same(x.to, B)) || (same(x.from, B) && like(x.to, A)));
  return { joined: !!t && (lead || t.def.id === def), got: t ? t.def.id : null };
}
function verdictIn() { const d = window.__da, ev = d.evaluate(d.S); return { ok: !!ev.ok, first: ((ev.lines || [])[0] || {}).t || '' }; }

/* ---------- one wall, rebuilt by touch ---------- */

async function rebuild(page, touch, origin, wall, mode, missPx) {
  await page.goto(origin + PAGE + '?wall=' + encodeURIComponent(wall) + '&dadev=1&unlock=1', { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  const plan = await page.evaluate(planIn);
  if (!plan) return { wall, mode, miss: missPx, ok: null, why: 'no stored answer' };
  let k = missPx === 20 ? 4 : 0;   /* the 20 px pass starts on the opposite side, so the two passes miss differently */
  const map = {}, items = [], tubes = [];
  for (const it of plan.items) {
    const aim = await page.evaluate(aimItemIn, [it.def, it.x, it.y, mode]);
    if (aim.err) { items.push({ def: it.def, landed: false, why: aim.err }); continue; }
    const to = T.miss(aim.to, k++, missPx);
    /* a drag is a player who watches where the game says the part will land (the drop preview) and, when it is not the
       place they meant, nudges it there before letting go: once */
    let nudged = false;
    if (mode === 'drag') { await touch.press(aim.from); await touch.moveTo(aim.via, 4); await touch.moveTo(to); await page.waitForTimeout(60);
      const pv = await page.evaluate(([x, y]) => { const d = window.__da, p = d.S.preview, r = p && p.rects && p.rects[0]; return r ? { dx: x - r.x, dy: y - r.y, cell: d.U * d.scale } : null; }, [it.x, it.y]);
      if (pv && (pv.dx || pv.dy)) { nudged = true; await touch.moveTo([to[0] + pv.dx * pv.cell, to[1] + pv.dy * pv.cell], 6); await page.waitForTimeout(60); }
      await touch.lift(); }
    else { await touch.tap(aim.from); await touch.tap(to); }
    const got = await page.evaluate(landedIn, [it.def, aim.uids, it.x, it.y, it.auid, it.fio2 || 0, it.cpap || 0]);
    if (got.landed) map[it.auid] = got.uid;
    items.push({ def: it.def, landed: got.landed, exact: got.exact, at: got.at, nudged });
    if (!got.landed) await page.evaluate(() => { const d = window.__da; if (d.S.hand) { d.S.hand = null; d.render(); } });
  }
  for (const tb of plan.tubes) {
    const aim = await page.evaluate(aimTubeIn, [tb, map]);
    if (aim.skip) continue;
    if (aim.err) { tubes.push({ def: tb.def, joined: false, why: aim.err }); continue; }
    const ka = k++, a = T.miss(aim.a, ka, missPx), b = T.miss(aim.b, k++, missPx);
    let mat = null;
    if (aim.tile) { await touch.tap(aim.tile); mat = await page.evaluate(() => window.__da.S.material || null); }
    /* a player pulling a run watches its end, which rides above the thumb: the thumb lets go that far under the port */
    /* a press that lands on the part instead of its port picks the part (its face is the part's, Round 7, beyond a port's small
       core): the player sees that, lets go, and presses again closer, once */
    let retried = false, nudged = false;
    if (mode === 'drag') { await touch.press(a); await page.waitForTimeout(40);
      if (!(await page.evaluate(() => !!window.__da.S.link))) { retried = true; await touch.lift(150); await page.evaluate(() => { const d = window.__da; d.S.sel = null; d.render(); });
        await touch.press(T.miss(aim.a, ka, missPx / 2)); await page.waitForTimeout(40); }
      await touch.moveTo([b[0], b[1] + (aim.lift || 0)]); await page.waitForTimeout(60);
      /* and the end of the run: the route on the wall shows the port it will take; not the one meant, the player slides over */
      const rv = await page.evaluate(([B]) => { const d = window.__da, k = d.routeKey; if (!k || k === B.uid + ':' + B.pi) return null; const [uid, pi] = k.split(':'), p = d.findPort(d.S, { uid, pi: /^[0-9]+$/.test(pi) ? +pi : pi }), q = d.findPort(d.S, B); if (!p || !q) return null;
        const P = d.portXY(p), Q = d.portXY(q); return [(Q[0] - P[0]) * d.scale, (Q[1] - P[1]) * d.scale]; }, [aim.B]);
      if (rv) { nudged = true; await touch.moveTo([b[0] + rv[0], b[1] + (aim.lift || 0) + rv[1]], 6); await page.waitForTimeout(60); }
      await touch.lift(); }
    else { await touch.tap(a);
      /* the same for a tap: one that picks the part instead of its ring, the player taps again, closer */
      if (!(await page.evaluate(() => !!window.__da.S.link))) { retried = true; await page.evaluate(() => { const d = window.__da; d.S.sel = null; d.render(); }); await touch.tap(T.miss(aim.a, ka, missPx / 2)); }
      await touch.tap(b); }
    const j = await page.evaluate(joinedIn, [aim.A, aim.B, tb.def, tb.lead]);
    tubes.push({ def: tb.def, joined: j.joined, got: j.got, picked: aim.tile ? mat : undefined, retried, nudged });
    await page.evaluate(() => { const d = window.__da; if (d.S.link || d.S.material) { d.S.link = null; d.S.material = null; d.render(); } });
  }
  const v = await page.evaluate(verdictIn);
  return { wall, mode, miss: missPx, ok: v.ok, why: v.ok ? '' : v.first, items, tubes };
}

/* ---------- the checks ---------- */

async function checks(page, touch, origin) {
  const out = [];
  const go = async (w) => { await page.goto(origin + PAGE + '?wall=' + w + '&dadev=1&unlock=1', { waitUntil: 'networkidle' }); await page.waitForTimeout(300); };
  const add = (what, ok, note) => out.push({ what, ok: !!ok, note: note || '' });
  /* each check runs on its own: one that throws fails itself, by name, and the rest still run */
  const one = async (name, fn) => { try { await fn(); } catch (e) { add(name, false, 'the check broke: ' + e.message.split('\n')[0]); } };
  // the wall gets the screen
  await one("the wall gets the screen", async () => {
    await go('l2');
    const sh = await T.boardShare(page, '#board');
    add('the wall gets the screen (55% of the height, or the full width)', sh.ok, sh.w + ' x ' + sh.h + ' px, ' + sh.share + '% of the height');
  });
  // nothing over the wall while a part is held, off the tray or off the wall, or once one is down and picked
  await one("nothing over the wall while a part is held, off the tray or off the wall, or once one is down and picked", async () => {
    const aim = await page.evaluate(aimItemIn, ['xmas', 4, 4, 'drag']);
    if (!aim.err) {
      const over = await touch.dragWith(aim.from, aim.to, () => T.overBoard(page, '#board', ['#verbs', '#trash', '#zoomBox']));
      add('nothing over the wall while a part off the tray is held', !over.length, over.join('; '));
    } else add('nothing over the wall while a part off the tray is held', false, aim.err);
    await go('l2');
    /* the biggest part on the tray, so the press is on the part and not beside a port */
    const held = await page.evaluate(() => { const d = window.__da, S = d.S, ids = Object.keys(S.cart).filter((k) => S.cart[k] > 0 && d.DB[k] && !d.DB[k].tube).sort((a, b) => d.DB[b].w * d.DB[b].h - d.DB[a].w * d.DB[a].h);
      for (const id of ids) { const D = d.DB[id], r0 = D.cartRot || 0; for (let y = 2; y < 8; y++) for (let x = 13; x >= 8; x--) if (d.canPlace(S, D, r0, x, y).ok) {
        const r = d.dispatchAct('place', { def: id, x, y, r: r0 }); if (!r.ok) continue; S.history.push(d.snapshot(S)); S.sel = r.item.uid; d.render();
        const dm = d.dims(D, r.item.r), b = document.getElementById('board').getBoundingClientRect();
        return { c: [b.left + ((r.item.x + dm.w / 2) * d.U - d.VIEW.x) * d.scale, b.top + ((r.item.y + dm.h / 2) * d.U - d.VIEW.y) * d.scale], to: [b.left + b.width * 0.3, b.top + b.height * 0.55] }; } }
      return null; });
    const over2 = await T.overBoard(page, '#board', ['#verbs', '#trash']);
    add('nothing over the wall once a part is down and picked', !over2.length, over2.join('; '));
    if (held) {
      const over3 = await touch.dragWith(held.c, held.to, () => page.evaluate(() => !!document.querySelector('.da-ghost')).then((g) => g ? T.overBoard(page, '#board', ['#verbs', '#trash', '#zoomBox']) : ['the press did not pick the part up']));
      add('nothing over the wall while a part on the wall is held', !over3.length, over3.join('; '));
    } else add('nothing over the wall while a part on the wall is held', false, 'no part to place');
  });
  // press areas on the wall: every open port reaches 44 px across and 22 px out
  await one("press areas on the wall: every open port reaches 44 px across and 22 px out", async () => {
    const small = await page.evaluate(() => [...document.querySelectorAll('#board .pt .hit')].map((h) => h.getBoundingClientRect()).filter((r) => r.width && (Math.max(r.width, r.height) < 43 || Math.min(r.width, r.height) < 21)).length);
    add('every port reaches 44 px across and 22 px out', !small, small ? small + ' ports smaller' : '');
  });
  // a wobbly tap on a wall part is a tap: it picks the part and leaves it where it is
  await one("a wobbly tap on a wall part is a tap: it picks the part and leaves it where it is", async () => {
    await go('t3');
    const wob = await page.evaluate(() => { const d = window.__da, r = d.dispatchAct('place', { def: 'flowmeter', x: 7, y: 1, r: 0 }); d.S.sel = null; d.render(); const it = r.item, b = document.getElementById('board').getBoundingClientRect(), dm = d.dims(it.def, it.r);
      return { uid: it.uid, at: [it.x, it.y], p: [b.left + (it.x * d.U - d.VIEW.x + dm.w * d.U / 2) * d.scale, b.top + (it.y * d.U - d.VIEW.y + dm.h * d.U / 2) * d.scale] }; });
    await touch.tap(wob.p, 6);
    const wobAfter = await page.evaluate((u) => { const d = window.__da, it = d.S.items.find((i) => i.uid === u); return { at: it ? [it.x, it.y] : null, sel: d.S.sel === u }; }, wob.uid);
    add('a tap that wobbles 6 px picks the part and does not move it', wobAfter.at && wobAfter.at[0] === wob.at[0] && wobAfter.at[1] === wob.at[1] && wobAfter.sel, 'at ' + JSON.stringify(wobAfter.at) + (wobAfter.sel ? ', picked' : ', not picked'));
  });
  // a tap on the port a run is plugged into does not pull it off
  await one("a tap on the port a run is plugged into does not pull it off", async () => {
    await go('t1');
    const rp = await page.evaluate(() => { const d = window.__da, L = d.S.level; d.restore(d.S, L.solution); d.render(); const tb = d.S.tubes.find((t) => t.lead && t.to); const p = d.findPort(d.S, tb.to), q = d.portXY(p), b = document.getElementById('board').getBoundingClientRect();
      return { uid: tb.uid, p: [b.left + (q[0] - d.VIEW.x) * d.scale, b.top + (q[1] - d.VIEW.y) * d.scale] }; });
    await touch.tap(rp.p, 3);
    const still = await page.evaluate((u) => { const tb = window.__da.S.tubes.find((t) => t.uid === u); return !!(tb && tb.to); }, rp.uid);
    add('a tap on a plugged-in port leaves the run plugged in', still);
  });
  // two quick taps (a miss, then a try again) leave a part as it was and a run where it was: on touch a double tap is not Turn
  await one('two quick taps leave a part unturned and a run in place', async () => {
    await go('t1');
    const q = await page.evaluate(() => { const d = window.__da, L = d.S.level; d.restore(d.S, L.solution); d.render(); const c = d.S.items.find((i) => i.def.id === 'cannula'), b = document.getElementById('board').getBoundingClientRect();
      const tb = d.S.tubes.find((t) => t.lead && t.path && t.path.length > 2), mid = tb.path[Math.floor(tb.path.length / 2)];
      return { r: c.r, f: !!c.f, part: [b.left + ((c.x + 0.5) * d.U - d.VIEW.x) * d.scale, b.top + ((c.y + 0.5) * d.U - d.VIEW.y) * d.scale], run: [b.left + ((mid[0] + 0.5) * d.U - d.VIEW.x) * d.scale, b.top + ((mid[1] + 0.5) * d.U - d.VIEW.y) * d.scale] }; });
    await touch.tap(q.part, 0, 90); await touch.tap(q.part, 0, 300);
    await touch.tap(q.run, 0, 90); await touch.tap(q.run, 0, 300);
    const after = await page.evaluate(() => { const S = window.__da.S, c = S.items.find((i) => i.def.id === 'cannula'), tb = S.tubes.find((t) => t.lead); return { r: c.r, f: !!c.f, laid: !!(tb && tb.to) }; });
    add('two quick taps leave a part unturned and a run in place', after.r === q.r && after.f === q.f && after.laid, (after.r !== q.r || after.f !== q.f ? 'the part turned' : '') + (after.laid ? '' : ' the run came off'));
  });
  // a part off the tray reaches the bottom rows
  await one("a part off the tray reaches the bottom rows", async () => {
    await go('t2');
    const low = await page.evaluate(() => { const d = window.__da, D = d.DB.xmas; for (const y of [13, 12]) for (let x = 13; x >= 0; x--) if (d.canPlace(d.S, D, D.cartRot || 0, x, y).ok && !d.fitTargets(d.S, D).some((t) => Math.abs(t.q.x - x) + Math.abs(t.q.y - y) < 3)) return [x, y]; return null; });
    if (low) {
      const a2 = await page.evaluate(aimItemIn, ['xmas', low[0], low[1], 'drag']);
      await touch.drag(a2.from, a2.to, 12, 350, a2.via);
      const got = await page.evaluate(landedIn, ['xmas', a2.uids, low[0], low[1], '', 0, 0]);
      add('a part off the tray reaches the bottom row of the wall', got.landed && got.exact, 'aimed at ' + low.join(',') + (got.landed ? ', landed at ' + got.at.join(',') : ', did not land'));
    } else add('a part off the tray reaches the bottom row of the wall', false, 'no free square found');
  });
  // a press on the middle of a one-square part picks the part up; Chrome's touch adjustment must not hand it to a port
  await one("a press on the middle of a one-square part picks the part up; Chrome's touch adjustment must not hand it to a port", async () => {
    await go('t2');
    const sm = await page.evaluate(() => { const d = window.__da, r = d.dispatchAct('place', { def: 'xmas', x: 11, y: 4, r: 0 }); d.S.sel = null; d.render(); const b = document.getElementById('board').getBoundingClientRect();
      return [b.left + (11 * d.U + d.U / 2 - d.VIEW.x) * d.scale, b.top + (4 * d.U + d.U / 2 - d.VIEW.y) * d.scale]; });
    const grabbed = await touch.dragWith(sm, [sm[0] - 50, sm[1] + 40], () => page.evaluate(() => ({ ghost: !!document.querySelector('.da-ghost'), link: !!window.__da.S.link })));
    add('a press on the middle of a small part picks up the part, not its port', grabbed.ghost && !grabbed.link, grabbed.link ? 'it started a run from a port' : grabbed.ghost ? '' : 'nothing picked up');
  });
  // a part on the wall moves down through the lower rows (where the old Back to cart strip sat)
  await one("a part on the wall moves down through the lower rows (where the old Back to cart strip sat)", async () => {
    await go('t2');
    const mv = await page.evaluate(() => { const d = window.__da, D = d.DB.xmas, r = d.dispatchAct('place', { def: 'xmas', x: 11, y: 4, r: D.cartRot || 0 }); d.S.sel = null; d.render();
      let to = null; for (const y of [10, 11, 9]) { for (let x = 13; x >= 8; x--) if (d.canPlace(d.S, D, D.cartRot || 0, x, y, r.item.uid).ok) { to = [x, y]; break; } if (to) break; }
      const b = document.getElementById('board').getBoundingClientRect(), sc = d.scale, U = d.U, V = d.VIEW, dm = d.dims(D, D.cartRot || 0), lift = d.liftPx([{ def: D, r: D.cartRot || 0, x: 0, y: 0 }]);
      const c = (x, y) => [b.left + (x * U - V.x + dm.w * U / 2) * sc, b.top + (y * U - V.y + dm.h * U / 2) * sc];
      return { uid: r.item.uid, from: c(11, 4), to: to && [c(to[0], to[1])[0], c(to[0], to[1])[1] + lift], cell: to }; });
    if (mv.to) {
      await touch.drag(mv.from, mv.to);
      const at = await page.evaluate((u) => { const it = window.__da.S.items.find((i) => i.uid === u); return it ? [it.x, it.y] : null; }, mv.uid);
      add('a part on the wall moves down into the lower rows, not back to the cart', at && at[0] === mv.cell[0] && at[1] === mv.cell[1], at ? 'aimed at ' + mv.cell.join(',') + ', landed at ' + at.join(',') : 'it went back to the cart');
    } else add('a part on the wall moves down into the lower rows, not back to the cart', false, 'no free square found');
  });
  return out;
}

/* ---------- the run ---------- */

async function thumbTest(browser, origin, opt = {}) {
  const screens = T.SCREENS.filter((s) => !opt.screen || s.name.toLowerCase().startsWith(String(opt.screen).toLowerCase()));
  const walls = opt.walls && opt.walls.length ? opt.walls : WALLS;
  const modes = opt.mode ? [opt.mode] : MODES, misses = opt.miss ? [+opt.miss] : MISSES;
  const report = { screens: [], ok: true };
  fs.mkdirSync(SHOTS, { recursive: true });
  for (const sc of screens) {
    const { ctx, page, touch } = await T.open(browser, sc, { init: INIT });
    /* --frozen <file>: play a saved copy of the page, so a baseline can run while the game is being edited */
    if (opt.frozen) { const html = fs.readFileSync(opt.frozen, 'utf8'); await ctx.route((u) => new URL(u).pathname === PAGE, (r) => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html })); }
    const errs = []; page.on('pageerror', (e) => errs.push(e.message));
    const row = { name: sc.name, width: sc.width, height: sc.height, checks: [], runs: [] };
    try {
      row.checks = await checks(page, touch, origin);
      for (const w of walls) for (const m of modes) for (const ms of misses) {
        const r = await rebuild(page, touch, origin, w, m, ms);
        row.runs.push(r);
        if (w === 'l2' && m === 'drag' && ms === 10) await page.screenshot({ path: path.join(SHOTS, 'thumb-' + sc.name.replace(/\s+/g, '-').toLowerCase() + '-l2.jpg'), type: 'jpeg', quality: 72 });
      }
    } catch (e) { row.checks.push({ what: 'the script: ' + e.message.split('\n')[0], ok: false }); }
    row.errors = errs.slice(0, 3);
    /* the gate: every check; every wall at 10 px by drag and by taps; every wall at 20 px by drag, the player having looked at
       the preview. Taps at 20 px are counted, not gated: a tap that far off lands on the neighbouring outlet, and there is no
       preview to see before it does (the plan's rule 12) */
    row.ok = row.checks.every((c) => c.ok) && row.runs.filter(gated).every((r) => r.ok !== false) && !errs.length;
    report.ok = report.ok && row.ok;
    report.screens.push(row);
    await ctx.close();
  }
  return report;
}

const gated = (r) => r.miss <= 10 || r.mode === 'drag';

/** the old report.touch shape, for the hub's Puzzles screen: one line per screen */
function summary(rep) {
  const steps = [];
  for (const s of rep.screens) {
    const runs = s.runs.filter((r) => r.ok !== null && gated(r)), good = runs.filter((r) => r.ok).length, bad = s.checks.filter((c) => !c.ok);
    const loose = s.runs.filter((r) => r.ok !== null && !gated(r)), looseGood = loose.filter((r) => r.ok).length;
    steps.push({ what: s.name + ': ' + good + ' of ' + runs.length + ' walls rebuilt by a missing thumb' + (loose.length ? ' (taps 20 px off: ' + looseGood + ' of ' + loose.length + ')' : '') + (bad.length ? '; failed: ' + bad.map((c) => c.what).join(', ') : ''), ok: s.ok });
  }
  return { ok: rep.ok, steps, errors: rep.screens.flatMap((s) => s.errors || []).slice(0, 3), shot: '/__hub/shots/device-assembly/puzzles/thumb-iphone-15-l2.jpg' };
}

function print(rep) {
  for (const s of rep.screens) {
    console.log('\n' + s.name + ' (' + s.width + ' x ' + s.height + ')' + (s.ok ? '' : '  FAILS'));
    for (const c of s.checks) console.log('  ' + (c.ok ? 'ok  ' : 'NO  ') + c.what + (c.note ? '  [' + c.note + ']' : ''));
    const by = {};
    for (const r of s.runs) { const k = r.mode + ' ' + r.miss + 'px'; (by[k] = by[k] || []).push(r); }
    for (const [k, rs] of Object.entries(by)) console.log('  ' + k.padEnd(10) + rs.map((r) => r.wall + (r.ok ? ' ok' : r.ok === null ? ' -' : gated(r) ? ' NO' : ' no')).join('  ') + (rs.length && !gated(rs[0]) ? '   (counted, not gated)' : '') + (rs.some((r) => r.items.some((i) => i.nudged)) ? '   nudged by the preview: ' + rs.reduce((a, r) => a + r.items.filter((i) => i.nudged).length, 0) : ''));
    for (const r of s.runs.filter((x) => x.ok === false && gated(x))) {
      const miss = [...r.items.filter((i) => !i.landed || !i.exact).map((i) => i.def + (i.landed ? ' landed at ' + i.at.join(',') : ' did not land' + (i.why ? ' (' + i.why + ')' : ''))), ...r.tubes.filter((t) => !t.joined).map((t) => t.def + (t.got ? ' laid as ' + t.got + (t.picked === null ? ' (the tap on its tile did not pick it)' : '') : ' not joined') + (t.why ? ' (' + t.why + ')' : ''))];
      console.log('    ' + r.wall + ' ' + r.mode + ' ' + r.miss + 'px: ' + (miss.join('; ') || r.why));
    }
  }
}

async function main() {
  const argv = process.argv.slice(2), val = (f) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : null; };
  const flags = new Set(['--screen', '--mode', '--miss', '--origin', '--frozen', '--out']);
  const walls = argv.filter((a, i) => !a.startsWith('--') && !flags.has(argv[i - 1]));
  const { chromium } = require('playwright');
  let server = null, origin = val('--origin');
  if (!origin) { server = await require('./review.js').start(0, { quiet: true }); origin = 'http://localhost:' + server.port; }
  const browser = await chromium.launch();
  try {
    const rep = await thumbTest(browser, origin, { walls, screen: val('--screen'), mode: val('--mode'), miss: val('--miss'), frozen: val('--frozen') });
    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(val('--out') || path.join(OUT, 'thumb.json'), JSON.stringify(rep, null, 1));
    print(rep);
    console.log('\n' + (rep.ok ? 'The thumb test passes.' : 'The thumb test FAILS.') + ' Report: ' + (val('--out') || 'tmp/da-qa/thumb.json'));
    if (!rep.ok) process.exitCode = 1;
  } finally { await browser.close(); if (server && server.close) server.close(); }
}

module.exports = { thumbTest, summary, rebuild, INIT };
if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
