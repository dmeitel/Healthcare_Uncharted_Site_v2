// thumb.js · touch the way a person does, for any game's browser tests.
//
// David, 2026-10-12, after playing Device Assembly on his phone: "I couldn't plug things in or connect things very
// easily with my fingers". The touch test the game had passed, because it aimed to the exact pixel on a 390 x 844
// screen. A thumb does neither. This is the toolkit the phone play standard asks for (hu-game-shell skill, "a finger
// is not a mouse"; docs/HU-PHONE-PLAY-PLAN-2026-10-12.md): the screens a phone browser actually leaves you, touches
// sent the way a phone sends them, and misses on purpose.
//
//   const T = require('./lib/thumb');
//   const { ctx, page, touch } = await T.open(browser, T.SCREENS[0], { init: () => { ... } });
//   await touch.drag([x0, y0], T.miss([x1, y1], k, 20));   // aimed 20 px off, the k-th direction
//   await touch.tap([x, y], 6);                             // a tap that wobbles 6 px before it lifts
'use strict';

/** What Safari and Chrome leave for the page with their bars showing (hu-game-shell, "a phone is one screen"). */
const SCREENS = [
  { name: 'SE', width: 375, height: 548 },
  { name: 'iPhone 15', width: 393, height: 659 },
  { name: 'small Android', width: 360, height: 640 },
  { name: 'Pro Max', width: 430, height: 746 },
];

/** A touchscreen reports about 60 times a second. Moves sent with no time between them read as a flick still moving at
 *  the lift, and Chrome swallows the next tap, the one that would stop a flick (found 2026-10-12: it looked like a game bug). */
const FRAME = 16;

/** Eight directions, so a run of moves misses every way once. */
const DIRS = [[1, 0], [0.7071, 0.7071], [0, 1], [-0.7071, 0.7071], [-1, 0], [-0.7071, -0.7071], [0, -1], [0.7071, -0.7071]];

/** A point aimed `dist` px off, in the k-th direction. @param {number[]} p @param {number} k @param {number} dist */
function miss(p, k, dist) {
  const d = DIRS[((k % 8) + 8) % 8];
  return [p[0] + d[0] * dist, p[1] + d[1] * dist];
}

/**
 * A phone-shaped page with touch, and a thumb to drive it through CDP touch events (pointer events follow from them,
 * pointerType "touch", the way a real phone fires them).
 * @param {any} browser a Playwright browser
 * @param {{name:string, width:number, height:number}} screen
 * @param {{init?:Function, scale?:number}} [opt]
 */
async function open(browser, screen, opt = {}) {
  const ctx = await browser.newContext({ viewport: { width: screen.width, height: screen.height }, deviceScaleFactor: opt.scale || 1, isMobile: true, hasTouch: true });
  if (opt.init) await ctx.addInitScript(opt.init);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  const send = (type, p) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x: p[0], y: p[1], radiusX: 10, radiusY: 10 }] });
  const touch = {
    /** a press, a pull in steps, a lift. With `via`, the pull goes there first (out of a tray, say) and then on to the end */
    async drag(a, b, steps = 12, settle = 350, via = null) {
      await send('touchStart', a);
      if (via) { for (let i = 1; i <= 4; i++) { await send('touchMove', [a[0] + (via[0] - a[0]) * i / 4, a[1] + (via[1] - a[1]) * i / 4]); await page.waitForTimeout(FRAME); } a = via; }
      for (let i = 1; i <= steps; i++) { await send('touchMove', [a[0] + (b[0] - a[0]) * i / steps, a[1] + (b[1] - a[1]) * i / steps]); await page.waitForTimeout(FRAME); }
      await send('touchEnd', b);
      await page.waitForTimeout(settle);
    },
    /** a tap; `wobble` px of drift before the lift, the way a thumb rolls */
    async tap(p, wobble = 0, settle = 350) {
      await send('touchStart', p);
      if (wobble) { await send('touchMove', [p[0] + wobble * 0.6, p[1] + wobble * 0.8]); }
      await page.waitForTimeout(60);
      await send('touchEnd', wobble ? [p[0] + wobble * 0.6, p[1] + wobble * 0.8] : p);
      await page.waitForTimeout(settle);
    },
    /** a drag in three parts, for a player who looks before letting go: press, move (as often as needed), lift */
    async press(p) { await send('touchStart', p); this.at = p; },
    async moveTo(b, steps = 12) { const a = this.at; for (let i = 1; i <= steps; i++) { await send('touchMove', [a[0] + (b[0] - a[0]) * i / steps, a[1] + (b[1] - a[1]) * i / steps]); await page.waitForTimeout(FRAME); } this.at = b; },
    async lift(settle = 350) { await send('touchEnd', this.at); await page.waitForTimeout(settle); },
    /** hold a pull partway, run `during` (a layout check mid-drag), then finish it */
    async dragWith(a, b, during, steps = 12, settle = 350) {
      await send('touchStart', a);
      let out;
      for (let i = 1; i <= steps; i++) {
        await send('touchMove', [a[0] + (b[0] - a[0]) * i / steps, a[1] + (b[1] - a[1]) * i / steps]); await page.waitForTimeout(FRAME);
        if (i === Math.ceil(steps * 0.75)) { await page.waitForTimeout(80); out = await during(); }
      }
      await send('touchEnd', b);
      await page.waitForTimeout(settle);
      return out;
    },
  };
  return { ctx, page, cdp, touch };
}

/**
 * Run in the page: which of `selectors` is showing over `boardSel`'s box. A board you aim at has nothing on it.
 * @param {any} page @param {string} boardSel @param {string[]} selectors
 */
function overBoard(page, boardSel, selectors) {
  return page.evaluate(([b, sels]) => {
    const B = document.querySelector(b); if (!B) return ['no board'];
    const r = B.getBoundingClientRect(), out = [];
    for (const s of sels) for (const e of document.querySelectorAll(s)) {
      const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0 || e.closest('[hidden]')) continue;
      const q = e.getBoundingClientRect(); if (!q.width || !q.height) continue;
      const w = Math.min(r.right, q.right) - Math.max(r.left, q.left), h = Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top);
      if (w > 2 && h > 2) out.push(s + ' (' + Math.round(w) + ' x ' + Math.round(h) + ' px over it)');
    }
    return out;
  }, [boardSel, selectors]);
}

/**
 * Run in the page: how much of the screen the board gets. It passes when the board is as wide as the screen allows
 * (a portrait phone runs out of width first) or at least `share` of the height.
 * @param {any} page @param {string} boardSel @param {number} [share]
 */
function boardShare(page, boardSel, share = 0.55) {
  return page.evaluate(([b, s]) => {
    const r = document.querySelector(b).getBoundingClientRect();
    const tall = r.height / innerHeight, wide = r.width >= innerWidth - 24;
    return { w: Math.round(r.width), h: Math.round(r.height), share: Math.round(tall * 100), wide, ok: wide || tall >= s };
  }, [boardSel, share]);
}

module.exports = { SCREENS, DIRS, miss, open, overBoard, boardShare };
