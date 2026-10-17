// da-thumb.js · Headwall (Device Assembly until 2026-10-15) played with a thumb that misses. `npm run da:thumb`, and inside `npm run da:qa`.
//
// David, 2026-10-12: "I couldn't plug things in or connect things very easily with my fingers the menu at the bottom
// felt like it was taking up the screen all the time". The robot test it replaced aimed to the pixel on a 390 x 844
// screen and passed. This one plays at the four screens a phone browser really leaves (scripts/lib/thumb.js), three
// device pixels to the CSS pixel, and:
//   - rebuilds walls from their stored answers by touch, every part off the tray and every run port to port, each aim
//     off by 10 and then 20 px, turning through eight directions, once by dragging and once by taps alone (WCAG 2.5.7);
//   - drags the way two kinds of player do: one who watches the part riding above the thumb and puts THAT on its place
//     (and nudges once by the drop preview), and one who puts the THUMB on the place they mean;
//   - reaches every part on the tray by touch alone: a straight pull from its tile, the row swiped by a thumb when the
//     tile is off the end, the All parts sheet opened by a tap. Nothing is clicked by script, nothing scrolled into view;
//   - turns, flips and sets (FiO2) a part with the buttons in the tray's row, and lays a circuit from its bag;
//   - plays today's daily wall at every screen and two more (360 x 740, 430 x 932) and presses Complete;
//   - checks the wall gets the screen, nothing sits over it while a part is held or picked, a wobbly tap stays a tap,
//     a tap on a run's port does not pull it off, a part reaches the bottom rows, a part on the wall moves down through
//     the rows the old Back to cart strip covered, All parts opens and closes by a tap, a straight pull from every tile
//     lifts its part, and a sideways swipe scrolls the row.
// 2026-10-14, David on the daily: "not physically possible... my finger still does not line up with the touch screen...
// i also cannot drop down the cart of tools". The 2026-10-12 version passed while that failed: it never played a dealt
// wall, it opened the tray and scrolled tiles into view by script, it always pulled a part straight up out of the tray
// first, it only modelled the player who watches the lifted part, and it aimed a hose at its port inside the device
// instead of where its free end is drawn. Plan and rules: docs/HU-PHONE-PLAY-PLAN-2026-10-12.md. Report: tmp/da-qa/thumb.json.
//
//   npm run da:thumb                          everything
//   npm run da:thumb -- t1 l2 today           just those walls (the checks always run); today = today's daily wall,
//                                             week = it and the six after it
//   npm run da:thumb -- --screen SE --mode tap --model finger --miss 20
'use strict';
const fs = require('fs');
const path = require('path');
const T = require('./lib/thumb');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'tmp', 'da-qa');
const SHOTS = path.join(ROOT, 'tmp', 'hub', 'shots', 'device-assembly', 'puzzles');
const PAGE = '/fun/headwall/';
const WALLS = ['t1', 't2', 't3', 't4', 't5', 'l2', 'v2', 'today'];
/* the daily is what David plays; it runs at two more screens, the ones the phone gate starts from */
const DAILY_EXTRA = [{ name: 'Android tall', width: 360, height: 740 }, { name: 'Pro Max full', width: 430, height: 932 }];
/* the passes each wall is rebuilt in. `gate`: the run must rebuild the wall. Taps 20 px off are counted, not gated: a tap
   that far off lands on the neighbouring outlet, with no preview to see first (the plan's rule 12); a thumb 20 px off
   its place with no look at the preview, the same */
const RUNS = [
  { mode: 'drag', model: 'watch', miss: 10, gate: true },
  { mode: 'drag', model: 'watch', miss: 20, gate: true },
  { mode: 'drag', model: 'finger', miss: 10, gate: true },
  { mode: 'drag', model: 'finger', miss: 20, gate: false },
  { mode: 'tap', model: 'tap', miss: 10, gate: true },
  { mode: 'tap', model: 'tap', miss: 20, gate: false },
];
/* the quick pass inside `npm run da:qa` */
const QUICK = RUNS.filter((r) => (r.model === 'watch' && r.miss === 20) || (r.model === 'finger' && r.miss === 10) || (r.mode === 'tap' && r.miss === 10));
const INIT = () => { window.__DA_HOOK = true; try { localStorage.setItem('hu-howto-da', '1'); localStorage.removeItem('hu-da-wall'); } catch (e) {} };   /* every load is a fresh wall: the game saves after each change */

/* ---------- in the page: reading what is on the screen (never changing it) ---------- */

/** the answer's steps: new parts in the order they were built, then every run. A circuit bag on the cart stands in for
 *  its Y and both limbs (the bag lays them), so the plan drops those and lays the bag where the Y was built: after the
 *  parts that went up before it (the ventilator, a CO2 adapter the Y lays past), before the parts that go in line on it
 *  (a nebulizer, a filter). Laid last, an in-line part was dropped before there was a limb to go in, landed on the tube's
 *  free end, and the bag was refused (daily #19, 2026-10-21, at the SE screen; found 2026-10-16). */
function planIn() {
  const d = window.__da, L = d.S.level; if (!L.solution) return null;
  const s = JSON.parse(L.solution), start = new Set(d.S.items.map((i) => i.uid)), cart = d.S.cart;
  const kitId = Object.keys(cart).find((k) => cart[k] > 0 && d.DB[k] && d.DB[k].kit && s.items.some((i) => i.def === d.DB[k].kit.y) && s.tubes.some((t) => ((t.def && t.def.id) || t.def) === d.DB[k].kit.insp));
  const kit = kitId && d.DB[kitId].kit;
  const ys = new Set(kit ? s.items.filter((i) => i.def === kit.y).map((i) => i.uid) : []);
  const yAt = kit ? s.items.findIndex((i) => ys.has(i.uid)) : -1;
  const built = s.items.map((i, n) => ({ i, n })).filter(({ i }) => !i.fixed && !start.has(i.uid) && !ys.has(i.uid));
  const items = built.map(({ i }) => ({ auid: i.uid, def: i.def, x: i.x, y: i.y, r: i.r || 0, f: !!i.f, fio2: i.fio2, cpap: i.cpap }));
  const tubes = s.tubes.filter((t) => !(kit && (ys.has(t.from.uid) || ys.has(t.to && t.to.uid)))).map((t) => ({ def: (t.def && t.def.id) || t.def, from: t.from, to: t.to, lead: !!t.lead }));
  const y = kit && s.items.find((i) => ys.has(i.uid));
  return { items, tubes, kit: kitId ? { def: kitId, x: y.x, y: y.y, after: built.filter(({ n }) => n < yAt).length } : null };
}
/** where a tray tile is, and whether a thumb can see it: on the row, in the All parts sheet, or not there at all */
function tileIn(def) {
  const list = document.getElementById('cartList'), sheet = document.getElementById('trayFull'), dock = document.getElementById('cartDock');
  const open = !!(sheet && !sheet.hidden), box = (open ? sheet : list).getBoundingClientRect();
  const t = /** @type {HTMLButtonElement|null} */ (list.querySelector('.da-item[data-def="' + def + '"]')), all = document.getElementById('cartAll');
  const seen = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && getComputedStyle(e).visibility !== 'hidden' && r.left >= Math.max(0, box.left) - 1 && r.right <= Math.min(innerWidth, box.right) + 1 && r.top >= Math.max(0, box.top) - 1 && r.bottom <= Math.min(innerHeight, box.bottom) + 1; };
  const mid = (e) => { const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + Math.min(r.height / 2, 22)]; };
  const L = list.getBoundingClientRect();
  return { has: !!t, disabled: !!(t && t.disabled), seen: !!t && seen(t), c: t ? mid(t) : null, x: t ? mid(t)[0] : 0, open, slim: list.classList.contains('slim'),
    row: [L.left, L.top, L.width, L.height], all: all && seen(all) ? mid(all) : null, verbs: dock.classList.contains('verbs') };
}
/** the middle of a button a thumb would press, if it is showing: on the screen, and the thing under that point (not
 *  scrolled out of its sheet, not under something else) */
function btnIn(sel) {
  const e = document.querySelector(sel); if (!e) return null;
  const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
  if (!r.width || cs.display === 'none' || cs.visibility === 'hidden' || /** @type {any} */ (e).disabled || e.closest('[hidden]')) return null;
  const c = [r.left + r.width / 2, r.top + r.height / 2];
  if (c[0] < 0 || c[1] < 0 || c[0] > innerWidth || c[1] > innerHeight) return null;
  const hit = document.elementFromPoint(c[0], c[1]);
  return hit && (hit === e || e.contains(hit)) ? c : null;
}
/** where a part's middle goes on the screen, how far above the thumb a drag carries it, and whether the place is one
 *  the part seats on (a joint, the face, a run it goes in line on), so a thumb has something there to aim at */
function spotIn([def, x, y, r]) {
  const d = window.__da, D = d.DB[def], b = document.getElementById('board').getBoundingClientRect(), sc = d.scale, V = d.VIEW, U = d.U, rr = r == null ? (D.cartRot || 0) : r, dm = d.dims(D, rr);
  const seats = !D.kit && !D.tube && d.landingsFor(d.S, D, D.cartRot || 0, false, null).some((c) => c.x === x && c.y === y);
  return { c: [b.left + (x * U - V.x) * sc + dm.w * U * sc / 2, b.top + (y * U - V.y) * sc + dm.h * U * sc / 2], lift: d.liftPx([{ def: D, r: rr, x: 0, y: 0 }]), cell: U * sc, seats, uids: d.S.items.map((i) => i.uid) };
}
/** the part that just landed */
function landedIn([def, before, x, y]) {
  const d = window.__da, seen = new Set(before), it = d.S.items.find((i) => !seen.has(i.uid) && i.def.id === def);
  return it ? { landed: true, uid: it.uid, exact: it.x === x && it.y === y, at: [it.x, it.y], r: it.r, f: !!it.f, upright: !!it.def.upright, fio2: it.fio2, cpap: it.cpap, set: !!(it.def.fio2 || it.def.cpapOptions) } : { landed: false };
}
/** a part on the wall: where a thumb taps to pick it (its middle), and its state */
function partIn(uid) {
  const d = window.__da, it = d.S.items.find((i) => i.uid === uid); if (!it) return null;
  const b = document.getElementById('board').getBoundingClientRect(), dm = d.dims(it.def, it.r);
  return { c: [b.left + ((it.x + dm.w / 2) * d.U - d.VIEW.x) * d.scale, b.top + ((it.y + dm.h / 2) * d.U - d.VIEW.y) * d.scale], r: it.r, f: !!it.f, fio2: it.fio2, cpap: it.cpap, sel: d.S.sel === uid };
}
/** a run of the answer, on the live wall: skip it if it is already laid, otherwise where its two ends are DRAWN */
function aimTubeIn([tb, map]) {
  const d = window.__da, S = d.S, live = (r) => r && ({ uid: map[r.uid] || r.uid, pi: r.pi });
  const A = live(tb.from), B = live(tb.to);
  if (!A || !B) return { skip: 'no ends' };
  const same = (p, q) => p && q && p.uid === q.uid && p.pi === q.pi;
  if (S.tubes.some((t) => (same(t.from, A) && same(t.to, B)) || (same(t.from, B) && same(t.to, A)))) return { skip: 'already laid' };
  const pa = d.findPort(S, A), pb = d.findPort(S, B); if (!pa || !pb) return { err: 'a port is missing' };
  const b = document.getElementById('board').getBoundingClientRect(), sc = d.scale, V = d.VIEW;
  const xy = (p) => { const q = d.portXY(p); return [b.left + (q[0] - V.x) * sc, b.top + (q[1] - V.y) * sc]; };
  /* a hose or a cord that comes with its part is pressed where its free end is drawn, not where it leaves the part */
  const drawn = (r, p) => { const g = document.querySelector('#board .pt[data-port="' + r.uid + ':' + r.pi + '"]'); if (!g || !p.internal) return xy(p); const q = (g.querySelector('.hit') || g).getBoundingClientRect(); return [q.left + q.width / 2, q.top + q.height / 2]; };
  return { a: drawn(A, pa), b: xy(pb), A, B, lift: d.TUBE_LIFT || 0, tile: !tb.lead && !!document.querySelector('#cartList .da-item[data-def="' + tb.def + '"]') };
}
/* the run is laid between the two ports, or from the first to the same port of an equal part (the next receptacle over: the
   wall's own verdict judges whether that matters), and it is the answer's tubing (a heated circuit is not plain 22 mm tubing) */
function joinedIn([A, B, def, lead]) {
  const S = window.__da.S, same = (p, q) => p && q && p.uid === q.uid && p.pi === q.pi, kind = (r) => { const it = r && S.items.find((i) => i.uid === r.uid); return it ? it.def.id + ':' + r.pi : ''; };
  const like = (p, q) => same(p, q) || (p && q && kind(p) === kind(q));
  const t = S.tubes.find((x) => (same(x.from, A) && like(x.to, B)) || (like(x.from, B) && same(x.to, A)) || (like(x.from, A) && same(x.to, B)) || (same(x.from, B) && like(x.to, A)));
  return { joined: !!t && (lead || t.def.id === def), got: t ? t.def.id : null };
}
function stateIn() { const S = window.__da.S; return { link: !!S.link, hand: !!S.hand, material: S.material || null, sel: S.sel || null, sheet: !document.getElementById('trayFull').hidden, verbs: document.getElementById('cartDock').classList.contains('verbs'), info: document.getElementById('infoDock').classList.contains('open') }; }
function verdictIn() { const d = window.__da, ev = d.evaluate(d.S); return { ok: !!ev.ok, first: ((ev.lines || [])[0] || {}).t || '' }; }
/** a spot of bare wall, well clear of every port, for a tap that only means "never mind" */
function bareIn() {
  const d = window.__da, S = d.S, b = document.getElementById('board').getBoundingClientRect(), used = new Set();
  for (const it of S.items) for (const c of d.cellsOf(it)) for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) used.add((c[0] + dx) + ',' + (c[1] + dy));
  for (const t of S.tubes) for (const c of t.path || []) used.add(c[0] + ',' + c[1]);
  for (let y = d.GRID.rows - 2; y > 1; y--) for (let x = 1; x < d.GRID.cols - 1; x++) if (!used.has(x + ',' + y)) return [b.left + ((x + 0.5) * d.U - d.VIEW.x) * d.scale, b.top + ((y + 0.5) * d.U - d.VIEW.y) * d.scale];
  return null;
}

/* ---------- a player, by touch alone ---------- */

class Thumb {
  constructor(page, touch) { this.page = page; this.touch = touch; this.notes = []; }
  ev(fn, arg) { return this.page.evaluate(fn, arg); }
  async tapSel(sel) { const p = await this.ev(btnIn, sel); if (!p) return false; await this.touch.tap(p); return true; }
  /** back to the parts: Done (Cancel with a part in the hand), or a tap on bare wall for a run that waits for its end */
  async settle() {
    for (let k = 0; k < 3; k++) {
      const s = await this.ev(stateIn);
      if (s.info) { await this.closeInfo(); continue; }
      if (s.sheet) { await this.tapSel('#trayFullX'); continue; }
      if (s.verbs || s.hand) { if (await this.tapSel('#vDone')) continue; }
      if (s.link || s.material) { const p = await this.ev(bareIn); if (p) { await this.touch.tap(p); continue; } }
      return;
    }
  }
  /** the spec sheet over the wall: its X, or its grabber pulled down */
  async closeInfo() {
    if (await this.tapSel('#infoClose')) return;
    const g = await this.ev(btnIn, '#infoDock .hu-sheet-grab'); if (g) await this.touch.drag(g, [g[0], this.page.viewportSize().height + 40], 10);
  }
  /** a tray tile a thumb can press: swipe the row along to it, or open All parts, as a person would */
  async reachTile(def) {
    for (let k = 0; k < 8; k++) {
      const t = await this.ev(tileIn, def);
      if (t.verbs) { if (!(await this.tapSel('#vDone'))) return { err: 'the row shows a part\'s buttons and no Done' }; continue; }
      if (!t.has) { if (t.all && !t.open) { await this.touch.tap(t.all); continue; } return { err: 'no ' + def + ' on the tray' }; }
      if (t.disabled) return { err: def + ' is greyed on the tray' };
      if (t.seen) return { c: t.c, open: t.open };
      if (t.slim && !t.open) {   /* off the end of the row: a thumb swipes it along, and stops before letting go */
        const y = t.row[1] + t.row[3] / 2, mid = t.row[0] + t.row[2] / 2, dx = Math.max(-t.row[2] * 0.6, Math.min(t.row[2] * 0.6, mid - t.x));
        await this.touch.swipe([mid - dx / 2, y], [mid + dx / 2, y]); this.notes.push('swiped the row for ' + def); continue;
      }
      if (t.all && !t.open) { await this.touch.tap(t.all); continue; }
      return { err: def + ' is in the list but out of sight' };
    }
    return { err: 'could not reach ' + def + ' on the tray' };
  }
  /** pick a part on the wall with a tap, then press one of its buttons in the row */
  async verb(uid, sel) {
    const p = await this.ev(partIn, uid); if (!p) return false;
    if (!(await this.ev(btnIn, sel))) { await this.touch.tap(p.c); }
    return this.tapSel(sel);
  }
  /** turn, flip and set a part the way the answer has it, with the row's buttons and the spec sheet's dial */
  async fixUp(uid, it) {
    let p = await this.ev(partIn, uid); if (!p) return;
    if (p.f !== it.f) { await this.verb(uid, '#vFlip'); p = await this.ev(partIn, uid); }   /* a part that hangs upright still flips */
    for (let n = 0; n < 3 && p && !it.upright && p.r !== it.r; n++) { await this.verb(uid, '#vRot'); p = await this.ev(partIn, uid); }
    for (const [key, want, set, step] of [['fio2', it.fio2, 'data-fio2set', 'data-fio2'], ['cpap', it.cpap, 'data-cpapset', null]]) {
      if (!want || !p || p[key] === want) continue;
      if (!(await this.verb(uid, '#vSet'))) { this.notes.push('no Set button for ' + key); continue; }
      await this.page.waitForTimeout(450);   /* the sheet slides up and brings its dial into view */
      if (!(await this.tapSel('#infoDock [' + set + '="' + want + '"]')) && step) {
        for (let n = 0; n < 40; n++) { p = await this.ev(partIn, uid); if (p[key] === want) break; const d = want - p[key], by = Math.abs(d) >= 5 ? 5 : 1; if (!(await this.tapSel('#infoDock [' + step + '="' + (d > 0 ? by : -by) + '"]'))) break; }
      }
      p = await this.ev(partIn, uid);
      if (p[key] !== want) this.notes.push(key + ' set to ' + p[key] + ', the answer has ' + want);
      await this.closeInfo();
    }
    await this.settle();
  }
  /** one part off the tray and onto its place */
  async placePart(it, run, k) {
    const tile = await this.reachTile(it.def); if (tile.err) return { def: it.def, landed: false, why: tile.err };
    const sp = await this.ev(spotIn, [it.def, it.x, it.y, it.r]);
    let nudged = false;
    if (run.mode === 'drag') {
      /* the watcher puts the part (riding above the thumb) on its place; the other puts the thumb on the place, where the part
         seats on something there; on open wall there is nothing to put a thumb on, and both watch the part */
      const eye = run.model === 'watch' || !sp.seats, aim = T.miss(eye ? [sp.c[0], sp.c[1] + sp.lift] : sp.c, k, run.miss);
      await this.touch.press(tile.c); await this.touch.moveTo(aim, 14); await this.page.waitForTimeout(60);
      if (eye) {   /* the drop preview says where it will land; not the place they meant, they nudge it there, once */
        const pv = await this.ev(([x, y]) => { const d = window.__da, p = d.S.preview, r = p && p.rects && p.rects[0]; return r ? { dx: x - r.x, dy: y - r.y, cell: d.U * d.scale } : null; }, [it.x, it.y]);
        if (pv && (pv.dx || pv.dy)) { nudged = true; await this.touch.moveTo([aim[0] + pv.dx * pv.cell, aim[1] + pv.dy * pv.cell], 6); await this.page.waitForTimeout(60); }
      }
      await this.touch.lift();
    } else { await this.touch.tap(tile.c); await this.touch.tap(T.miss(sp.c, k, run.miss)); }
    const got = await this.ev(landedIn, [it.def, sp.uids, it.x, it.y]);
    if (!got.landed) { await this.settle(); return { def: it.def, landed: false, nudged }; }
    await this.fixUp(got.uid, Object.assign({}, it, { upright: got.upright }));
    return { def: it.def, landed: true, uid: got.uid, exact: got.exact, at: got.at, nudged };
  }
  /** a circuit from its bag: off the tray, let go on the wall near the tube */
  async layKit(kit, run, k) {
    const tile = await this.reachTile(kit.def); if (tile.err) return { def: kit.def, laid: false, why: tile.err };
    const sp = await this.ev(spotIn, [kit.def, kit.x, kit.y, 0]);
    const aim = T.miss(run.mode === 'drag' && run.model === 'watch' ? [sp.c[0], sp.c[1] + sp.lift] : sp.c, k, run.miss);
    /* a thumb settles before it lets go, as on every drag here: a lift while still moving reads as a flick, and Chrome then
       swallows the next tap (the trap of 2026-10-12; here it ate the press on Complete one run in six) */
    if (run.mode === 'drag') { await this.touch.press(tile.c); await this.touch.moveTo(aim, 14); await this.page.waitForTimeout(60); await this.touch.lift(); }
    else { await this.touch.tap(tile.c); await this.touch.tap(aim); }
    const laid = await this.ev((id) => { const d = window.__da, k2 = d.DB[id].kit; return d.S.items.some((i) => i.def.id === k2.y); }, kit.def);
    if (!laid) await this.settle();
    return { def: kit.def, laid, why: laid ? '' : await this.ev(() => (document.getElementById('screenRead') || {}).textContent.trim().slice(0, 120)) };
  }
  /** one run, port to port */
  async layTube(tb, map, run, k) {
    const aim = await this.ev(aimTubeIn, [tb, map]);
    if (aim.skip) return null;
    if (aim.err) return { def: tb.def, joined: false, why: aim.err };
    if (aim.tile) { const t = await this.reachTile(tb.def); if (!t.err) await this.touch.tap(t.c); }
    const ka = k, a = T.miss(aim.a, ka, run.miss), bAim = run.mode === 'drag' && run.model === 'watch' ? [aim.b[0], aim.b[1] + aim.lift] : aim.b, b = T.miss(bAim, k + 1, run.miss);
    let retried = false, nudged = false;
    /* a press that lands on the part instead of its port picks the part (its face is the part's, Round 7, beyond a port's small
       core): the player sees that and presses again, closer, once. So does one whose press lands nearer another run's end and
       lifts that run instead: two loose ends of one ventilator are drawn a square apart (an air hose and a cord, 27 px at
       393 x 659), and 20 px off one is nearer the other (daily #19, 2026-10-21; found 2026-10-16). The wrong run's end is
       in the thumb's hand and plain to see; the player lets it go and presses again. */
    /* the run in the thumb: from the port pressed, or, for tubing off the tray, from the free end of the tubing that just hung
       on it (the game hangs it first and the link runs from its other end) */
    const picked = () => this.ev(([A]) => { const S = window.__da.S, L = S.link; if (!L) return 'none';
      const same = (p) => !!p && p.uid === A.uid && String(p.pi) === String(A.pi), t = L.from && S.tubes.find((x) => x.uid === L.from.uid);
      return same(L.from) || (t && (same(t.from) || same(t.to))) ? 'right' : 'wrong'; }, [aim.A]);
    /* letting the wrong run go clears what was in hand, tubing off the tray included: pick that up again */
    const letGo = async () => { await this.settle(); if (aim.tile) { const t = await this.reachTile(tb.def); if (!t.err) await this.touch.tap(t.c); } };
    if (run.mode === 'drag') {
      await this.touch.press(a); await this.page.waitForTimeout(40);
      const p0 = await picked();
      if (p0 !== 'right') { retried = true; await this.touch.lift(150); if (p0 === 'wrong') await letGo(); await this.touch.press(T.miss(aim.a, ka, run.miss / 2)); await this.page.waitForTimeout(40); }
      await this.touch.moveTo(b); await this.page.waitForTimeout(60);
      if (run.model === 'watch') {   /* the route on the wall shows the port it will take; not the one meant, the player slides over */
        const rv = await this.ev(([B]) => { const d = window.__da, k2 = d.routeKey; if (!k2 || k2 === B.uid + ':' + B.pi) return null; const [uid, pi] = k2.split(':'), p = d.findPort(d.S, { uid, pi: /^[0-9]+$/.test(pi) ? +pi : pi }), q = d.findPort(d.S, B); if (!p || !q) return null;
          const P = d.portXY(p), Q = d.portXY(q); return [(Q[0] - P[0]) * d.scale, (Q[1] - P[1]) * d.scale]; }, [aim.B]);
        if (rv) { nudged = true; await this.touch.moveTo([b[0] + rv[0], b[1] + rv[1]], 6); await this.page.waitForTimeout(60); }
      }
      await this.touch.lift();
    } else {
      await this.touch.tap(a);
      const p0 = await picked();
      if (p0 !== 'right') { retried = true; if (p0 === 'wrong') await letGo(); await this.touch.tap(T.miss(aim.a, ka, run.miss / 2)); }
      await this.touch.tap(b);
    }
    const j = await this.ev(joinedIn, [aim.A, aim.B, tb.def, tb.lead]);
    await this.settle();
    return { def: tb.def, joined: j.joined, got: j.got, retried, nudged };
  }
}

/* ---------- one wall, rebuilt by touch ---------- */

async function rebuild(page, touch, origin, wall, run, opt = {}) {
  await page.goto(origin + PAGE + '?wall=' + encodeURIComponent(wall) + '&dadev=1&unlock=1', { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  const plan = await page.evaluate(planIn);
  const row = { wall, mode: run.mode, model: run.model, miss: run.miss, gate: run.gate };
  if (!plan) return Object.assign(row, { ok: null, why: 'no stored answer' });
  const th = new Thumb(page, touch);
  let k = run.miss === 20 ? 4 : 0;   /* the 20 px pass starts on the opposite side, so the two passes miss differently */
  const map = {}, items = [], tubes = [];
  let kit = null;
  for (let n = 0; n <= plan.items.length; n++) {
    if (plan.kit && n === plan.kit.after) kit = await th.layKit(plan.kit, run, k++);   /* the bag where the Y was built */
    const it = plan.items[n]; if (!it) continue;
    const r = await th.placePart(it, run, k++); if (r.landed) map[it.auid] = r.uid; items.push(r);
  }
  for (const tb of plan.tubes) { const r = await th.layTube(tb, map, run, k); k += 2; if (r) tubes.push(r); }
  const v = await page.evaluate(verdictIn);
  Object.assign(row, { ok: v.ok, why: v.ok ? '' : v.first, items, tubes, kit, notes: th.notes });
  /* start to finish: Complete pressed by the thumb, and the card that answers it */
  if (opt.complete) {
    await th.settle();
    const pressed = await th.tapSel('#submitBtn');
    /* the card waits for the gas to land, never past 1.5 s (deep dive A1) */
    const card = pressed ? await page.waitForFunction(() => { const o = document.getElementById('overlay'); return o && !o.hidden ? o.textContent.replace(/\s+/g, ' ').trim().slice(0, 160) : ''; }, null, { timeout: 4000 }).then((h) => h.jsonValue()).catch(() => '') : '';
    row.complete = { pressed, card, ok: pressed && !!card && v.ok };
    if (row.ok && !row.complete.ok) { row.ok = false; row.why = 'Complete did not answer: ' + (card || (pressed ? 'no card' : 'no Complete button')); }
  }
  return row;
}

/* ---------- the checks ---------- */

async function checks(page, touch, origin, today) {
  const out = [];
  const go = async (w) => { await page.goto(origin + PAGE + '?wall=' + w + '&dadev=1&unlock=1', { waitUntil: 'networkidle' }); await page.waitForTimeout(300); };
  const add = (what, ok, note) => out.push({ what, ok: !!ok, note: note || '' });
  const th = new Thumb(page, touch);
  /* each check runs on its own: one that throws fails itself, by name, and the rest still run */
  const one = async (name, fn) => { try { await fn(); } catch (e) { add(name, false, 'the check broke: ' + e.message.split('\n')[0]); } };
  // the wall gets the screen
  await one('the wall gets the screen', async () => {
    await go('l2');
    const sh = await T.boardShare(page, '#board');
    add('the wall gets the screen (55% of the height, or the full width)', sh.ok, sh.w + ' x ' + sh.h + ' px, ' + sh.share + '% of the height');
  });
  // nothing over the wall while a part is held, off the tray or off the wall, or once one is down and picked
  await one('nothing over the wall while a part is held', async () => {
    const tile = await th.reachTile('xmas'), sp = await page.evaluate(spotIn, ['xmas', 4, 4, null]);
    if (!tile.err) {
      const over = await touch.dragWith(tile.c, [sp.c[0], sp.c[1] + sp.lift], () => T.overBoard(page, '#board', ['#verbs', '#trash', '#zoomBox']));
      add('nothing over the wall while a part off the tray is held', !over.length, over.join('; '));
    } else add('nothing over the wall while a part off the tray is held', false, tile.err);
    await go('l2');
    /* the biggest part on the tray, so the press is on the part and not beside a port */
    const held = await page.evaluate(() => { const d = window.__da, S = d.S, ids = Object.keys(S.cart).filter((k) => S.cart[k] > 0 && d.DB[k] && !d.DB[k].tube && !d.DB[k].kit).sort((a, b) => d.DB[b].w * d.DB[b].h - d.DB[a].w * d.DB[a].h);
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
  await one('every port reaches 44 px across and 22 px out', async () => {
    const small = await page.evaluate(() => [...document.querySelectorAll('#board .pt .hit')].map((h) => h.getBoundingClientRect()).filter((r) => r.width && (Math.max(r.width, r.height) < 43 || Math.min(r.width, r.height) < 21)).length);
    add('every port reaches 44 px across and 22 px out', !small, small ? small + ' ports smaller' : '');
  });
  // a wobbly tap on a wall part is a tap: it picks the part and leaves it where it is
  await one('a wobbly tap picks the part and leaves it', async () => {
    await go('t3');
    const wob = await page.evaluate(() => { const d = window.__da, r = d.dispatchAct('place', { def: 'flowmeter', x: 7, y: 1, r: 0 }); d.S.sel = null; d.render(); const it = r.item, b = document.getElementById('board').getBoundingClientRect(), dm = d.dims(it.def, it.r);
      return { uid: it.uid, at: [it.x, it.y], p: [b.left + (it.x * d.U - d.VIEW.x + dm.w * d.U / 2) * d.scale, b.top + (it.y * d.U - d.VIEW.y + dm.h * d.U / 2) * d.scale] }; });
    await touch.tap(wob.p, 6);
    const wobAfter = await page.evaluate((u) => { const d = window.__da, it = d.S.items.find((i) => i.uid === u); return { at: it ? [it.x, it.y] : null, sel: d.S.sel === u }; }, wob.uid);
    add('a tap that wobbles 6 px picks the part and does not move it', wobAfter.at && wobAfter.at[0] === wob.at[0] && wobAfter.at[1] === wob.at[1] && wobAfter.sel, 'at ' + JSON.stringify(wobAfter.at) + (wobAfter.sel ? ', picked' : ', not picked'));
  });
  // a tap on the port a run is plugged into does not pull it off
  await one('a tap on a plugged-in port leaves the run plugged in', async () => {
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
  await one('a part off the tray reaches the bottom row of the wall', async () => {
    await go('t2');
    const low = await page.evaluate(() => { const d = window.__da, D = d.DB.xmas; for (const y of [13, 12]) for (let x = 13; x >= 0; x--) if (d.canPlace(d.S, D, D.cartRot || 0, x, y).ok && !d.fitTargets(d.S, D).some((t) => Math.abs(t.q.x - x) + Math.abs(t.q.y - y) < 3)) return [x, y]; return null; });
    if (low) {
      const tile = await th.reachTile('xmas'), sp = await page.evaluate(spotIn, ['xmas', low[0], low[1], null]);
      await touch.drag(tile.c, [sp.c[0], sp.c[1] + sp.lift], 14);
      const got = await page.evaluate(landedIn, ['xmas', sp.uids, low[0], low[1]]);
      add('a part off the tray reaches the bottom row of the wall', got.landed && got.exact, 'aimed at ' + low.join(',') + (got.landed ? ', landed at ' + got.at.join(',') : ', did not land'));
    } else add('a part off the tray reaches the bottom row of the wall', false, 'no free square found');
  });
  // a press on the middle of a one-square part picks the part up; Chrome's touch adjustment must not hand it to a port
  await one('a press on the middle of a small part picks up the part, not its port', async () => {
    await go('t2');
    const sm = await page.evaluate(() => { const d = window.__da; d.dispatchAct('place', { def: 'xmas', x: 11, y: 4, r: 0 }); d.S.sel = null; d.render(); const b = document.getElementById('board').getBoundingClientRect();
      return [b.left + (11 * d.U + d.U / 2 - d.VIEW.x) * d.scale, b.top + (4 * d.U + d.U / 2 - d.VIEW.y) * d.scale]; });
    const grabbed = await touch.dragWith(sm, [sm[0] - 50, sm[1] + 40], () => page.evaluate(() => ({ ghost: !!document.querySelector('.da-ghost'), link: !!window.__da.S.link })));
    add('a press on the middle of a small part picks up the part, not its port', grabbed.ghost && !grabbed.link, grabbed.link ? 'it started a run from a port' : grabbed.ghost ? '' : 'nothing picked up');
  });
  // a part on the wall moves down through the lower rows (where the old Back to cart strip sat)
  await one('a part on the wall moves down into the lower rows', async () => {
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
  // THE TRAY, by touch alone (2026-10-14): All parts opens and closes with a tap, a part picked in it comes to hand, a
  // straight pull from any tile lifts its part, and a sideways swipe scrolls the row without lifting anything
  for (const w of [today, 'l2']) await one('All parts opens by a tap (' + w + ')', async () => {
    await go(w);
    const a = await page.evaluate(btnIn, '#cartAll');
    if (!a) { add('All parts is on the row and opens by a tap (' + w + ')', false, 'no All parts on the row'); return; }
    await touch.tap(a);
    const s1 = await page.evaluate(stateIn);
    const x = await page.evaluate(btnIn, '#trayFullX'); if (x) await touch.tap(x);
    const s2 = await page.evaluate(stateIn);
    await touch.tap(a);
    const pick = await page.evaluate(() => { const t = [.../** @type {NodeListOf<HTMLButtonElement>} */ (document.querySelectorAll('#trayFull .da-item[data-def]'))].find((e) => !e.disabled && !window.__da.DB[e.dataset.def].tube); if (!t) return null; const r = t.getBoundingClientRect(); return { def: t.dataset.def, c: [r.left + r.width / 2, r.top + r.height / 2] }; });
    if (pick) await touch.tap(pick.c);
    const s3 = await page.evaluate(() => ({ sheet: !document.getElementById('trayFull').hidden, hand: window.__da.S.hand && window.__da.S.hand.def.id }));
    add('All parts opens by a tap, closes on its X, and a part tapped in it comes to hand (' + w + ')', s1.sheet && !s2.sheet && pick && !s3.sheet && s3.hand === pick.def,
      (s1.sheet ? '' : 'it did not open; ') + (s2.sheet ? 'the X did not close it; ' : '') + (!pick ? 'no part in it' : s3.hand === pick.def ? '' : 'the tap on ' + pick.def + ' did not pick it'));
  });
  await one('a straight pull from every tile lifts its part', async () => {
    await go(today);
    const defs = await page.evaluate(() => [.../** @type {NodeListOf<HTMLButtonElement>} */ (document.querySelectorAll('#cartList .da-item[data-def]'))].filter((e) => !e.disabled && !window.__da.DB[e.dataset.def].tube).map((e) => e.dataset.def));
    const miss = [];
    for (const def of defs) for (const side of [0.1, 0.9]) {
      await go(today);
      const tile = await th.reachTile(def); if (tile.err) { miss.push(def + ': ' + tile.err); continue; }
      const b = await page.evaluate(() => { const r = document.getElementById('board').getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; });
      /* to the far side of the wall, low: the shallowest pull a thumb makes from the tray */
      const to = [b[0] + b[2] * side, b[1] + b[3] * 0.72];
      const live = await touch.dragWith(tile.c, to, () => page.evaluate(() => !!document.querySelector('.da-ghost')));
      if (!live) miss.push(def + ' toward the ' + (side < 0.5 ? 'left' : 'right') + ' (' + Math.round(Math.atan2(tile.c[1] - to[1], Math.abs(to[0] - tile.c[0])) * 180 / Math.PI) + ' degrees)');
    }
    add('a straight pull from every tile toward either side of the wall lifts its part (' + today + ')', defs.length && !miss.length, miss.join('; '));
  });
  await one('a sideways swipe scrolls the row', async () => {
    await go('l2');
    const r = await page.evaluate(() => { const l = document.getElementById('cartList'), b = l.getBoundingClientRect(); return { can: l.scrollWidth > l.clientWidth + 1, row: [b.left, b.top, b.width, b.height], at: l.scrollLeft }; });
    if (!r.can) { add('a sideways swipe scrolls the row and lifts nothing', true, 'the row fits the screen'); return; }
    const y = r.row[1] + r.row[3] / 2;
    await touch.swipe([r.row[0] + r.row[2] * 0.8, y], [r.row[0] + r.row[2] * 0.25, y]);
    const after = await page.evaluate(() => ({ at: document.getElementById('cartList').scrollLeft, items: window.__da.S.items.filter((i) => !i.fixed).length, hand: !!window.__da.S.hand }));
    add('a sideways swipe scrolls the row and lifts nothing', after.at > r.at + 20 && !after.items && !after.hand, 'scrolled ' + Math.round(after.at - r.at) + ' px' + (after.items || after.hand ? ', and a part came off' : ''));
  });
  return out;
}

/* ---------- the run ---------- */

/** today's daily wall, the way the game names it (Mountain time), read off its own address */
async function todayId(page, origin) {
  await page.goto(origin + PAGE + 'today/', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__da && window.__da.S && /^day:/.test(window.__da.S.level.id), null, { timeout: 15000 });   /* /today/ forwards to the game */
  return page.evaluate(() => window.__da.S.level.id);
}
const nextDays = (id, n) => { const t = Date.parse(id.slice(4) + 'T12:00:00Z'); return Array.from({ length: n }, (_, i) => 'day:' + new Date(t + i * 864e5).toISOString().slice(0, 10)); };

async function thumbTest(browser, origin, opt = {}) {
  const pick = (s) => !opt.screen || s.name.toLowerCase().startsWith(String(opt.screen).toLowerCase());
  const screens = [...T.SCREENS, ...DAILY_EXTRA.map((s) => Object.assign({ dailyOnly: true }, s))].filter(pick);
  const runs = (opt.quick ? QUICK : RUNS).filter((r) => (!opt.mode || r.mode === opt.mode) && (!opt.model || r.model === opt.model) && (!opt.miss || r.miss === +opt.miss));
  const report = { screens: [], ok: true };
  fs.mkdirSync(SHOTS, { recursive: true });
  for (const sc of screens) {
    const { ctx, page, touch } = await T.open(browser, sc, { init: INIT });
    /* --frozen <file>: play a saved copy of the page, so a baseline can run while the game is being edited */
    if (opt.frozen) { const html = fs.readFileSync(opt.frozen, 'utf8'); await ctx.route((u) => new URL(u).pathname === PAGE, (r) => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html })); }
    const errs = []; page.on('pageerror', (e) => errs.push(e.message));
    const row = { name: sc.name, width: sc.width, height: sc.height, checks: [], runs: [] };
    try {
      const today = await todayId(page, origin);
      let walls = (opt.walls && opt.walls.length ? opt.walls : WALLS).flatMap((w) => w === 'today' ? [today] : w === 'week' ? nextDays(today, 7) : [w]);
      if (sc.dailyOnly) walls = walls.filter((w) => w === today);
      else row.checks = await checks(page, touch, origin, today);
      for (const w of walls) for (const run of runs) {
        const r = await rebuild(page, touch, origin, w, run, { complete: w === today && run.gate });
        r.daily = w === today;
        row.runs.push(r);
        if (w === 'l2' && run.model === 'watch' && run.miss === 10) await page.screenshot({ path: path.join(SHOTS, 'thumb-' + sc.name.replace(/\s+/g, '-').toLowerCase() + '-l2.jpg'), type: 'jpeg', quality: 72 });
        if (w === today && run.model === 'finger' && run.miss === 10) await page.screenshot({ path: path.join(SHOTS, 'thumb-' + sc.name.replace(/\s+/g, '-').toLowerCase() + '-daily.jpg'), type: 'jpeg', quality: 72 });
      }
    } catch (e) { row.checks.push({ what: 'the script: ' + e.message.split('\n')[0], ok: false }); }
    row.errors = errs.slice(0, 3);
    /* the gate: every check, every gated pass of every wall, and no page error */
    row.ok = row.checks.every((c) => c.ok) && row.runs.filter((r) => r.gate).every((r) => r.ok !== false) && !errs.length;
    report.ok = report.ok && row.ok;
    report.screens.push(row);
    await ctx.close();
  }
  return report;
}

const label = (r) => r.mode === 'tap' ? 'tap ' + r.miss + 'px' : (r.model === 'watch' ? 'drag, eye on the part ' : 'drag, thumb on the place ') + r.miss + 'px';

/** the old report.touch shape, for the hub's Puzzles screen: one line per screen */
function summary(rep) {
  const steps = [];
  for (const s of rep.screens) {
    const runs = s.runs.filter((r) => r.ok !== null && r.gate), good = runs.filter((r) => r.ok).length, bad = s.checks.filter((c) => !c.ok);
    const loose = s.runs.filter((r) => r.ok !== null && !r.gate), looseGood = loose.filter((r) => r.ok).length;
    const daily = s.runs.filter((r) => r.daily && r.gate), dailyGood = daily.filter((r) => r.ok).length;
    steps.push({ what: s.name + ': ' + good + ' of ' + runs.length + ' walls rebuilt by a missing thumb' + (daily.length ? ', today\'s daily ' + dailyGood + ' of ' + daily.length + ' to Complete' : '') + (loose.length ? ' (20 px off, no second look: ' + looseGood + ' of ' + loose.length + ')' : '') + (bad.length ? '; failed: ' + bad.map((c) => c.what).join(', ') : ''), ok: s.ok });
  }
  return { ok: rep.ok, steps, errors: rep.screens.flatMap((s) => s.errors || []).slice(0, 3), shot: '/__hub/shots/device-assembly/puzzles/thumb-iphone-15-daily.jpg' };
}

function print(rep) {
  for (const s of rep.screens) {
    console.log('\n' + s.name + ' (' + s.width + ' x ' + s.height + ')' + (s.ok ? '' : '  FAILS'));
    for (const c of s.checks) console.log('  ' + (c.ok ? 'ok  ' : 'NO  ') + c.what + (c.note ? '  [' + c.note + ']' : ''));
    const by = {};
    for (const r of s.runs) (by[label(r)] = by[label(r)] || []).push(r);
    for (const [k, rs] of Object.entries(by)) console.log('  ' + k.padEnd(31) + rs.map((r) => r.wall + (r.ok ? ' ok' : r.ok === null ? ' -' : r.gate ? ' NO' : ' no')).join('  ') + (rs.length && !rs[0].gate ? '   (counted, not gated)' : ''));
    for (const r of s.runs.filter((x) => x.ok === false && x.gate)) {
      const miss = [...r.items.filter((i) => !i.landed || !i.exact).map((i) => i.def + (i.landed ? ' landed at ' + i.at.join(',') : ' did not land' + (i.why ? ' (' + i.why + ')' : ''))),
        ...r.tubes.filter((t) => !t.joined).map((t) => t.def + (t.got ? ' laid as ' + t.got : ' not joined') + (t.why ? ' (' + t.why + ')' : '')),
        ...(r.kit && !r.kit.laid ? [r.kit.def + ' not laid' + (r.kit.why ? ' (' + r.kit.why + ')' : '')] : []), ...(r.notes || [])];
      console.log('    ' + r.wall + ' ' + label(r) + ': ' + (miss.join('; ') || r.why));
    }
  }
}

async function main() {
  const argv = process.argv.slice(2), val = (f) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : null; };
  const flags = new Set(['--screen', '--mode', '--model', '--miss', '--origin', '--frozen', '--out']);
  const walls = argv.filter((a, i) => !a.startsWith('--') && !flags.has(argv[i - 1]));
  const { chromium } = require('playwright');
  let server = null, origin = val('--origin');
  if (!origin) { server = await require('./review.js').start(0, { quiet: true }); origin = 'http://localhost:' + server.port; }
  const browser = await chromium.launch();
  try {
    const rep = await thumbTest(browser, origin, { walls, screen: val('--screen'), mode: val('--mode'), model: val('--model'), miss: val('--miss'), frozen: val('--frozen'), quick: argv.includes('--quick') });
    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(val('--out') || path.join(OUT, 'thumb.json'), JSON.stringify(rep, null, 1));
    print(rep);
    console.log('\n' + (rep.ok ? 'The thumb test passes.' : 'The thumb test FAILS.') + ' Report: ' + (val('--out') || 'tmp/da-qa/thumb.json'));
    if (!rep.ok) process.exitCode = 1;
  } finally { await browser.close(); if (server && server.close) server.close(); }
}

module.exports = { thumbTest, summary, rebuild, INIT, RUNS, QUICK, Thumb, tileIn, btnIn, stateIn, planIn };
if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
