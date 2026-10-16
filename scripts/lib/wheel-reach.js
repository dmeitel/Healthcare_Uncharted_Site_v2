'use strict';
/**
 * wheel-reach.js · can a mouse wheel reach everything on the screen?
 *
 *   const { wheelReach } = require('./lib/wheel-reach');
 *   const { checked, lost } = await wheelReach(page);    // lost: what no wheel can bring into view
 *
 * WHY (2026-10-14). Playwright's click() scrolls an element into view by script, overflow:hidden boxes
 * included, so every check that clicks walked straight past the one defect a mouse cannot: a control
 * below the window inside a box that pins itself to the screen and scrolls nothing. Vital Stats' lobby
 * shipped that way on 2026-10-01 (the tool shell, .hu-shell, is 100dvh and overflow:hidden; its Deal
 * button sat at y=1094 in a 900px window and the wheel moved nothing), and Alarm Fatigue's pumps the
 * same way until 2026-10-14. The gate read both pages CLEAN: its CUT BY ITS CONTAINER check counts
 * anything clipped away vertically as folded, on purpose, and nothing else looked.
 *
 * HOW. Nothing here scrolls by script except the reset to the top. The page is read at rest; anything
 * less than half on show is a candidate, unless it is not this check's business (above the window, the
 * merged nav band waiting to be summoned; off a side, a closed drawer; a fixed panel parked below, a
 * closed sheet; a box folded shut; a pan or zoom scene). Then the real wheel: page.mouse.wheel over
 * each box that still holds a candidate and still has room, from a spot where nothing nested would take
 * the wheel first, until it stops moving; then again, because a box that scrolled can bring another
 * into reach (a tray inside a console). What never shows half of itself is lost.
 *
 * TRAPS, each one found by measuring:
 *   ticks sized to the box (a 300px tick jumps clean past an 84px card in a 50px tray);
 *   a pause before each new run (Chrome holds a quick run of ticks on the box that moved first);
 *   spots, not the centre (a box with pointer-events:none takes no wheel in the gaps between its
 *     children, and a game's pop-up can sit on any one point);
 *   vertical only (a translateX(-50%) centring trick is not a pan; a sideways reach is the CUT check's);
 *   the boxes inside the page before the page, and the page stopping when another comes into view
 *     (run to its end first, the page carried the home respiratory timeline's sticky rail out of the
 *     window above it, and the first full sweep failed 15 entries a reader reaches with no trouble).
 */

/* runs in the page: installs window.__reach */
function kit() {
  if (window.__reach) return;
  const CTRL = 'a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="tab"], [role="switch"], [tabindex]:not([tabindex="-1"])';
  const TEXT = 'h1, h2, h3, h4, h5, h6, p, li, label, td, th, dt, dd, figcaption, blockquote';
  const SKIP = '[aria-hidden="true"], [hidden], [inert], dialog:not([open]), .visually-hidden, .sr-only, [data-zoom-scene], svg[data-drawing], svg[data-brand]';
  const gcs = (e) => getComputedStyle(e);
  const sel = (el) => {
    let s = el.tagName.toLowerCase();
    if (el.id) s += '#' + el.id;
    else if (el.classList && el.classList.length) s += '.' + [...el.classList].slice(0, 3).join('.');
    return s;
  };
  const onShow = (el) => (el.checkVisibility ? el.checkVisibility({ opacityProperty: true, visibilityProperty: true }) : gcs(el).display !== 'none');
  // The boxes that clip an element top and bottom. Walks the containing-block chain, the same rule as
  // the gate's own clippers(): an ancestor below an absolute element's containing block does not clip
  // it, and only a transformed ancestor clips a fixed one.
  const clippers = (el) => {
    const out = [];
    const es = gcs(el);
    let mode = es.position === 'fixed' ? 'fixed' : es.position === 'absolute' ? 'abs' : null;
    for (let p = el.parentElement; p && p !== document.body && p !== document.documentElement; p = p.parentElement) {
      const s = gcs(p);
      const tf = s.transform !== 'none' || s.filter !== 'none' || s.perspective !== 'none';
      if (mode === 'fixed' && !tf) continue;
      if (mode === 'abs' && !tf && s.position === 'static') continue;
      if (s.overflowY !== 'visible') out.push(p);
      mode = s.position === 'fixed' ? 'fixed' : s.position === 'absolute' ? 'abs' : null;
    }
    return out;
  };
  // the box that fixes it to the window, itself or an ancestor (null: it moves with the page)
  const pinned = (el) => {
    for (let p = el; p && p !== document.documentElement; p = p.parentElement) {
      const s = gcs(p);
      if (s.position === 'fixed') return p;
      if (s.transform !== 'none') return null;
    }
    return null;
  };
  // a scale or a vertical shift between an element and the box that cuts it: a pan scene or a panel
  // being slid, so what is out of frame is moved there, not scrolled there
  const driven = (el, stop) => {
    for (let p = el; p && p !== stop && p !== document.documentElement; p = p.parentElement) {
      const m = gcs(p).transform;
      const n = m && m !== 'none' && m.match(/matrix\(([^)]+)\)/);
      if (n) { const v = n[1].split(',').map(Number); if (Math.abs(v[0] - 1) > 0.01 || Math.abs(v[3] - 1) > 0.01 || Math.abs(v[5]) > 20) return true; }
      else if (m && m !== 'none') return true;   // matrix3d: a 3D scene
    }
    return false;
  };
  // how much of it shows top to bottom, inside the window and every box that clips it; 1 = enough.
  // A block taller than the window counts once half the window's worth of it has shown.
  const frac = (el) => {
    const r = el.getBoundingClientRect();
    if (r.height < 1 || r.width < 1) return 0;
    let T = Math.max(r.top, 0), B = Math.min(r.bottom, innerHeight);
    for (const a of clippers(el)) {
      const q = a.getBoundingClientRect();
      T = Math.max(T, q.top + a.clientTop); B = Math.min(B, q.top + a.clientTop + a.clientHeight);
    }
    return B - T <= 1 ? 0 : Math.min(1, (B - T) / Math.min(r.height, innerHeight * 0.5));
  };
  const scrollsY = (a) => /auto|scroll/.test(gcs(a).overflowY) && a.scrollHeight > a.clientHeight + 2;
  const room = (a) => a.scrollTop < a.scrollHeight - a.clientHeight - 1;
  // the box a wheel at this point would scroll: the nearest ancestor that scrolls (null: the document)
  const takes = (h) => { for (let a = h; a && a !== document.body && a !== document.documentElement; a = a.parentElement) if (scrollsY(a)) return a; return null; };
  const DOC = document.scrollingElement || document.documentElement;
  const R = {
    items: [], visits: new Map(), shown: new Map(), n: 0,
    start() {
      R.visits = new Map(); R.shown = new Map();
      DOC.scrollTop = 0;
      for (const e of document.querySelectorAll('*')) if (e.scrollTop) e.scrollTop = 0;
      // a modal dialog makes the page behind it inert, so only the dialog is judged
      const modal = document.querySelector('dialog:modal');
      const within = modal ? [modal] : [document.body];
      const els = new Set();
      for (const w of within) for (const e of w.querySelectorAll(CTRL + ', ' + TEXT)) els.add(e);
      R.items = [];
      for (const el of els) {
        if (el.closest(SKIP)) continue;
        const ctrl = el.matches(CTRL);
        if (/** @type {any} */ (el).ownerSVGElement && !ctrl) continue;
        if (!onShow(el)) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 4 || r.height < 4) continue;
        const cs = gcs(el);
        if (cs.clip && cs.clip !== 'auto') continue;                     // a visually-hidden utility
        const text = (el.getAttribute('aria-label') || el.textContent || /** @type {any} */ (el).value || '').replace(/\s+/g, ' ').trim();
        if (!ctrl && !text) continue;
        if (!ctrl && el.querySelector(CTRL + ', ' + TEXT)) continue;       // a block is judged by what it holds
        if (r.bottom <= 0) continue;                                      // above the window: summoned, not scrolled to
        if (r.right <= 0 || r.left >= innerWidth) continue;               // parked off a side, a closed drawer
        const pin = pinned(el);
        if (pin && pin.getBoundingClientRect().top >= innerHeight - 1) continue;   // a fixed panel parked below, a closed sheet
        const f = frac(el);
        if (f >= 0.5) continue;                                           // on show already
        const cutters = clippers(el).filter((a) => { const q = a.getBoundingClientRect(); return r.bottom > q.top + a.clientTop + a.clientHeight + 1 || r.top < q.top + a.clientTop - 1; });
        if (cutters.some((a) => a.clientHeight < 8)) continue;            // folded shut, an accordion
        if (cutters.some((a) => driven(el, a))) continue;                 // a pan scene or a sliding panel
        const cut = cutters.find((a) => !/auto|scroll/.test(gcs(a).overflowY));
        R.items.push({ el, best: f, ctrl, y: Math.round(r.top + DOC.scrollTop), x: Math.round(r.left), h: Math.round(r.height), sel: sel(el), text: text.slice(0, 48),
          cut: cut ? sel(cut) + ' (overflow ' + gcs(cut).overflowY + ', ' + cut.clientHeight + ' of ' + cut.scrollHeight + 'px on show)' : '' });
      }
      return R.items.length;
    },
    measure() { for (const it of R.items) if (it.best < 0.5) { const f = it.el.isConnected ? frac(it.el) : 1; if (f > it.best) it.best = f; } },
    left() { return R.items.filter((it) => it.best < 0.5); },
    // the boxes still worth a wheel, and which way: a box holding something unseen beyond the edge it can
    // still scroll toward. Down first; up when what is unseen sits above (a panel wheeled to its end while
    // only its foot showed hides its first rows once the page brings it into view: the Vendor Directory's
    // sectors, 2026-10-14)
    targets() {
      const left = R.left();
      if (!left.length) return [];
      const W = innerWidth, H = innerHeight;
      const boxes = [];
      if (DOC.scrollHeight > DOC.clientHeight + 2) boxes.push(null);
      for (const a of document.querySelectorAll('*')) if (scrollsY(a) && left.some((it) => a.contains(it.el))) boxes.push(a);
      const out = [];
      for (const a of boxes) {
        const box = a ? (a.dataset.reachKey || (a.dataset.reachKey = 'r' + (++R.n))) : 'doc';
        let L = 0, T = 0, Rr = W, B = H;
        if (a) {
          const q = a.getBoundingClientRect();
          L = Math.max(L, q.left); T = Math.max(T, q.top); Rr = Math.min(Rr, q.right); B = Math.min(B, q.bottom);
          for (const c of clippers(a)) { const z = c.getBoundingClientRect(); L = Math.max(L, z.left); T = Math.max(T, z.top); Rr = Math.min(Rr, z.right); B = Math.min(B, z.bottom); }
        }
        if (Rr - L < 8 || B - T < 8) continue;
        let up = 0, down = 0;
        for (const it of left) {
          if (a && !a.contains(it.el)) continue;
          const r = it.el.getBoundingClientRect();
          if (r.top < T - 1 && r.bottom < B) up++; else if (r.bottom > B + 1) down++;
        }
        const s = a || DOC;
        const dir = down && room(s) ? 1 : up && s.scrollTop > 0 ? -1 : 0;
        if (!dir) continue;
        const key = box + (dir < 0 ? '^' : '');
        // a box gets three goes each way; the page goes down in stretches, uncapped, and up twice
        if ((box !== 'doc' || dir < 0) && (R.visits.get(key) || 0) >= (box === 'doc' ? 2 : 3)) continue;
        const spots = [];
        find: for (const fy of [0.5, 0.3, 0.7, 0.15, 0.85]) for (const fx of [0.5, 0.3, 0.7, 0.15, 0.85]) {
          const x = Math.round(L + (Rr - L) * fx), y = Math.round(T + (B - T) * fy);
          const h = document.elementFromPoint(x, y);
          if (h && takes(h) === a) spots.push([x, y]);
          if (spots.length >= 3) break find;
        }
        if (!spots.length) continue;
        const step = dir * Math.max(60, Math.min(400, Math.round((B - T) * 0.4)));
        out.push({ key, box, spots, step, shown: Math.round(B - T) });
      }
      return out;
    },
    // a box holding something unseen has come into view, or well further into view, since it was last
    // wheeled: the page's own scroll stops there, the way a reader stops to scroll a panel. Without this
    // the page ran to its end first and carried a sticky rail out of the window above it (2026-10-14,
    // the home respiratory timeline).
    fresh() { return R.targets().some((t) => t.box !== 'doc' && (!R.shown.has(t.key) || t.shown > R.shown.get(t.key) * 1.5 + 4)); },
    visit(key, shown) { R.visits.set(key, (R.visits.get(key) || 0) + 1); if (shown != null) R.shown.set(key, shown); },
    pos(box) { const a = box === 'doc' ? DOC : document.querySelector('[data-reach-key="' + box + '"]'); return a ? a.scrollTop : -1; },
    report() {
      DOC.scrollTop = 0;
      for (const e of document.querySelectorAll('*')) if (e.scrollTop) e.scrollTop = 0;
      return R.left().map((it) => ({ y: it.y, x: it.x, h: it.h, ctrl: it.ctrl, sel: it.sel, text: it.text, cut: it.cut, seen: Math.round(it.best * 100) / 100 }));
    },
  };
  window.__reach = R;
}

/** @typedef {{y:number, x:number, h:number, ctrl:boolean, sel:string, text:string, cut:string, seen:number}} Lost */
/** @typedef {{checked: number, lost: Lost[], unfinished?: boolean, error?: string}} Reach */

/**
 * Wheel the page and return what no wheel reaches. A modal card open on arrival (a game's how-to, on a
 * first visit) is judged first; then it is closed with Escape, as every card in the kit closes, and the
 * screen under it is judged too, because that is the screen every visit after the first one opens on.
 * @param {import('playwright').Page} page
 * @param {{pause?: number, budgetMs?: number, log?: (msg: string) => void}} [opt]   log: each box it wheels, and how far
 * @returns {Promise<Reach>}
 */
async function wheelReach(page, opt = {}) {
  const first = await onePass(page, opt);
  let modal = await page.evaluate(() => !!document.querySelector('dialog:modal')).catch(() => false);
  if (!modal) return first;
  for (let i = 0; i < 3 && modal; i++) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(350);
    modal = await page.evaluate(() => !!document.querySelector('dialog:modal')).catch(() => false);
  }
  if (modal) return first;   // a card that will not close is the screen
  const under = await onePass(page, opt);
  const out = { checked: first.checked + under.checked, lost: [...first.lost, ...under.lost] };
  return first.unfinished || under.unfinished ? Object.assign(out, { unfinished: true }) : out;
}

/** @param {import('playwright').Page} page @param {{pause?: number, budgetMs?: number, log?: (msg: string) => void}} opt @returns {Promise<Reach>} */
async function onePass(page, opt) {
  const pause = opt.pause == null ? 450 : opt.pause;
  const budget = Date.now() + (opt.budgetMs || 40000);
  await page.evaluate(kit);
  const checked = await page.evaluate(() => window.__reach.start());
  if (!checked) return { checked, lost: [] };
  let unfinished = false;
  for (let round = 0; round < 40; round++) {
    const targets = await page.evaluate(() => window.__reach.targets());
    if (!targets.length) break;
    // the boxes inside the page first; then the page itself, which stops when another box comes into view
    const order = [...targets.filter((t) => t.box !== 'doc'), ...targets.filter((t) => t.box === 'doc')];
    let moved = false, paused = false;
    for (const t of order) {
      await page.evaluate(([k, sh]) => window.__reach.visit(k, sh), [t.key, t.shown]);
      for (const [x, y] of t.spots) {
        await page.mouse.move(x, y);
        await page.waitForTimeout(pause);
        let last = await page.evaluate((b) => window.__reach.pos(b), t.box), still = 0, went = false;
        for (let i = 0; i < 300 && still < 2; i++) {
          if (Date.now() > budget) { unfinished = true; break; }
          await page.mouse.wheel(0, t.step);
          await page.waitForTimeout(80);
          const s = await page.evaluate(([b, doc]) => { const r = window.__reach; r.measure(); return { pos: r.pos(b), left: r.left().length, fresh: doc && r.fresh() }; }, [t.box, t.box === 'doc']);
          if (s.pos === last) still++; else { still = 0; went = true; }
          last = s.pos;
          if (!s.left) break;
          if (s.fresh) { paused = true; break; }
        }
        if (opt.log) opt.log('round ' + round + ', box ' + t.key + ' wheeled at ' + x + ',' + y + (went ? ', went to ' + last : ', did not move') + (paused ? ', paused for a box now in view' : '') + ', ' + (await page.evaluate(() => window.__reach.left().length)) + ' still unseen');
        if (went || unfinished || paused) { moved = moved || went; break; }   // this spot moves the box; on to the next box
      }
      if (unfinished || paused) break;
    }
    if (!moved || unfinished) break;
  }
  await page.mouse.move(0, 0);
  const lost = await page.evaluate(() => window.__reach.report());
  return unfinished ? { checked, lost, unfinished } : { checked, lost };
}

module.exports = { wheelReach };
