/**
 * EVERY VIEW, NOT THE ONE ON SCREEN (2026-10-19). The phone gate reads a page the whole way down, but only as it
 * loads, and a page with views shows one of them and hides the rest. The hidden ones were never measured: nine of the
 * ten Laws and Paradoxes charts shipped with 7 px labels on a phone, every one passing, until a reviewer opened each
 * tab by hand on 2026-10-16 (each chart got a phone drawing). This finds a page's view switches, shows each view in
 * turn, hands it to the gate's own reader, and puts the page back the way it loaded.
 *
 * A switch is a [role="tablist"] (its [role="tab"] buttons), or anything marked [data-views] (its buttons) where a
 * page's switch is plain buttons, as on Laws and Paradoxes. It counts when it is on the page as it loads, holds two
 * tabs or more, and does not sit inside another switch. A switch inside a view that is hidden at load is not walked:
 * one level, which covers every page with views today (tests/view-switch.test.js holds them to a switch this finds).
 */
'use strict';

const SWITCH = '[role="tablist"], [data-views]';

/* runs in the page: 'list' names the switches and the tab showing on each; 'pick' presses one tab. The two share how
   a switch's tabs are found, so the index a list gives is the index a pick presses. */
/** @param {{SEL: string, mode: 'list' | 'pick', i?: number, k?: number}} a @returns {any} */
function inPage({ SEL, mode, i = 0, k = 0 }) {
  const shown = (e) => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && !e.closest('[hidden], [inert]'); };
  const tabsOf = (list) => [...list.querySelectorAll(list.matches('[role="tablist"]') ? '[role="tab"]' : 'button')].filter(shown);
  const lists = [...document.querySelectorAll(SEL)];
  if (mode === 'pick') {
    const t = lists[i] && tabsOf(lists[i])[k];
    if (!t) return false;
    t.click();
    return true;
  }
  const out = [];
  lists.forEach((list, n) => {
    if (!shown(list) || (list.parentElement && list.parentElement.closest(SEL))) return;
    const tabs = tabsOf(list);
    if (tabs.length < 2) return;
    const on = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true' || t.getAttribute('aria-current') === 'true' || t.classList.contains('active') || t.classList.contains('on'));
    out.push({ i: n, on: on < 0 ? 0 : on, top: Math.max(0, Math.round(list.getBoundingClientRect().top + scrollY)),
      names: tabs.map((t, x) => (t.innerText || t.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 48) || 'tab ' + (x + 1)) });
  });
  return out;
}

/**
 * Show every view the page hides at load, one at a time, and read each with `read(from)`, where `from` is the
 * switch's place on the page (a view lies below its switch, so the reader can start there). The tab that was
 * showing is pressed again at the end of each switch.
 * @template R
 * @param {import('playwright').Page} page
 * @param {(from: number) => Promise<R>} read
 * @param {{settle?: number}} [o]  ms to let a view's own motion finish after its tab is pressed
 * @returns {Promise<{switches: number, views: {name: string, r?: R, skipped?: boolean}[], error?: string}>}
 */
async function walkViews(page, read, o = {}) {
  const settle = o.settle == null ? 450 : o.settle;
  // From the top of the page: a switch pinned on a desk (the fracture post's, Laws and Paradoxes') measured from the foot
  // of the page reports the foot as its place, and each view was read from there down, its last screen only (2026-10-19;
  // the wheel check, which runs before the walk above a phone, leaves the page scrolled to the bottom).
  await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
  await page.waitForTimeout(150);
  /** @type {{i: number, on: number, top: number, names: string[]}[]} */
  const switches = await page.evaluate(inPage, { SEL: SWITCH, mode: 'list' }).catch(() => []);
  /** @type {{name: string, r?: R, skipped?: boolean}[]} */
  const views = [];
  for (const sw of switches) {
    for (let k = 0; k < sw.names.length; k++) {
      if (k === sw.on) continue;
      const ok = await page.evaluate(inPage, { SEL: SWITCH, mode: 'pick', i: sw.i, k }).catch(() => false);
      if (!ok) { views.push({ name: sw.names[k], skipped: true }); continue; }
      await page.waitForTimeout(settle);
      views.push({ name: sw.names[k], r: await read(sw.top) });
    }
    await page.evaluate(inPage, { SEL: SWITCH, mode: 'pick', i: sw.i, k: sw.on }).catch(() => false);
    await page.waitForTimeout(settle);
  }
  return { switches: switches.length, views };
}

module.exports = { walkViews, SWITCH };
