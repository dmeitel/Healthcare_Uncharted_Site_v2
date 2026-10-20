/**
 * The phone gate reads every view (scripts/lib/view-walk.js, 2026-10-19). Until then it read a page the whole way down
 * as it loaded, so a page with views was measured on the one view showing: nine of the ten Laws and Paradoxes charts
 * shipped with 7 px labels on a phone and passed, until a reviewer opened each tab by hand on 2026-10-16.
 * The first tests drive the walk on fixture switches, the shapes this site uses (a tablist with aria-selected, plain
 * buttons marked data-views with an .active class). The last runs the real gate on a fixture page whose second view
 * holds a label under the floor: it fails with the view named, and with --no-views it passes, which is the miss this
 * closes. These tests drive a real Chromium; without one installed they skip.
 */
'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const http = require('node:http');
const { execFile } = require('node:child_process');
const { walkViews } = require('../scripts/lib/view-walk');

let chromium = null, browser = null, why = '';
try { ({ chromium } = require('playwright')); } catch (e) { why = 'playwright is not installed'; }

before(async () => {
  if (!chromium) return;
  try { browser = await chromium.launch(); } catch (e) { why = 'no Chromium to drive: ' + e.message.split('\n')[0]; }
});
after(async () => { if (browser) await browser.close(); });

/* the reader stands in for the gate's: it names the panel on screen */
const onScreen = (page) => () => page.evaluate(() => [...document.querySelectorAll('section')].filter((s) => s.getBoundingClientRect().height > 0).map((s) => s.id).join(','));

/** @param {string} html */
async function walk(html) {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 740 } });
  const page = await ctx.newPage();
  await page.setContent('<!doctype html><html><head><meta charset="utf-8"></head><body>' + html + '</body></html>');
  const res = await walkViews(page, onScreen(page), { settle: 30 });
  const after = await onScreen(page)();
  await ctx.close();
  return { res, after };
}

const TABS = `<div role="tablist" aria-label="Views">
    <button role="tab" aria-selected="true" aria-controls="a">First</button>
    <button role="tab" aria-selected="false" aria-controls="b">Second</button>
    <button role="tab" aria-selected="false" aria-controls="c">Third</button>
  </div>
  <section id="a">one</section><section id="b" hidden>two</section><section id="c" hidden>three</section>
  <script>
    document.querySelectorAll('[role=tab]').forEach((t) => t.addEventListener('click', () => {
      document.querySelectorAll('[role=tab]').forEach((x) => x.setAttribute('aria-selected', x === t ? 'true' : 'false'));
      document.querySelectorAll('section').forEach((s) => { s.hidden = s.id !== t.getAttribute('aria-controls'); });
    }));
  </script>`;

test('a tablist: each hidden view is shown and read, and the page is left on the view it loaded with', async (t) => {
  if (!browser) return t.skip(why);
  const { res, after } = await walk(TABS);
  assert.equal(res.switches, 1);
  assert.deepEqual(res.views.map((v) => [v.name, v.r]), [['Second', 'b'], ['Third', 'c']]);
  assert.equal(after, 'a');
});

test('plain buttons marked data-views, the one showing marked .active (Laws and Paradoxes)', async (t) => {
  if (!browser) return t.skip(why);
  const { res, after } = await walk(`<nav data-views aria-label="Laws">
      <button class="active" data-tab="a">Jevons</button><button data-tab="b">Goodhart</button>
    </nav>
    <section id="a">one</section><section id="b" hidden>two</section>
    <script>
      document.querySelectorAll('nav button').forEach((t) => t.addEventListener('click', () => {
        document.querySelectorAll('nav button').forEach((x) => x.classList.toggle('active', x === t));
        document.querySelectorAll('section').forEach((s) => { s.hidden = s.id !== t.dataset.tab; });
      }));
    </script>`);
  assert.deepEqual(res.views.map((v) => [v.name, v.r]), [['Goodhart', 'b']]);
  assert.equal(after, 'a');
});

test('a switch pinned to the top is read from its own place, even when the page was left scrolled to the foot', async (t) => {
  if (!browser) return t.skip(why);
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 600 } });
  const page = await ctx.newPage();
  await page.setContent('<!doctype html><html><body style="margin:0"><div style="height:400px"></div>'
    + TABS.replace('<div role="tablist"', '<div role="tablist" style="position:sticky;top:0;background:#fff"')
      .replace('<section id="a">one</section>', '<section id="a" style="height:3000px">one</section>') + '</body></html>');
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));   // where the wheel check leaves a page
  const froms = [];
  await walkViews(page, async (from) => { froms.push(from); return from; }, { settle: 30 });
  await ctx.close();
  assert.deepEqual(froms, [400, 400], 'each view is read from the switch, 400 px down, not from the foot of the page');
});

test('a switch that is not on the page as it loads, or has one tab, is not walked', async (t) => {
  if (!browser) return t.skip(why);
  const { res } = await walk(`<div hidden><div role="tablist"><button role="tab" aria-selected="true">A</button><button role="tab">B</button></div></div>
    <div role="tablist" style="display:none"><button role="tab" aria-selected="true">C</button><button role="tab">D</button></div>
    <div role="tablist"><button role="tab" aria-selected="true">Only</button></div>`);
  assert.equal(res.switches, 0);
  assert.deepEqual(res.views, []);
});

/* the gate itself, on a page whose second view holds a 12-unit label in a 600-wide drawing shown 340 px wide (6.8 px) */
const PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Views</title><style>body{margin:0;padding:16px;font:16px/1.5 sans-serif;background:#0d1117;color:#e6edf3}
  [role=tab]{min-height:44px;padding:0 10px;font:16px sans-serif}</style></head><body>
  <main><h1 style="font:700 72px/.85 sans-serif;margin:0 0 24px">A <em>Law</em></h1>
  <div style="width:200px;margin:0 auto 24px"><div style="width:300px;margin-left:-50px;height:20px;background:#1a2d48"></div></div>${TABS.replace('<section id="b" hidden>two</section>',
    '<section id="b" hidden><svg viewBox="0 0 600 200" style="width:328px;height:auto" role="img" aria-label="a chart"><text x="20" y="60" font-size="12" fill="#e6edf3">a label far too small on a phone</text></svg></section>')}</main>
  </body></html>`;

function gate(base, extra) {
  return new Promise((resolve) => {
    execFile(process.execPath, [path.join(__dirname, '..', 'scripts', 'phone-check.js'), '/views/', '--base', base,
      '--widths', '360x740', '--theme', 'dark', '--no-slow', '--no-ledger', ...extra],
    { env: Object.assign({}, process.env, { MSYS_NO_PATHCONV: '1' }), timeout: 120000 },
    (err, stdout) => resolve({ code: err ? err.code : 0, out: String(stdout) }));
  });
}

test('the gate fails a label under the floor in a view hidden at load, and names the view', async (t) => {
  if (!browser) return t.skip(why);
  const srv = http.createServer((req, res) => { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(PAGE); });
  await new Promise((r) => srv.listen(0, '127.0.0.1', () => r(null)));
  const base = 'http://127.0.0.1:' + /** @type {import('net').AddressInfo} */ (srv.address()).port;
  try {
    const walked = await gate(base, []);
    assert.equal(walked.code, 1, 'the gate fails\n' + walked.out);
    assert.match(walked.out, /IN THE VIEW "Second" \(hidden at load\): 1 under the type floor/);
    assert.match(walked.out, /UNDER THE TYPE FLOOR at [\d.]+px: .*a label far too small/);
    assert.match(walked.out, /views: 1 of 2 hidden views clean/);
    const blind = await gate(base, ['--no-views']);
    assert.equal(blind.code, 0, 'reading only the view on screen, the old gate passed this page\n' + blind.out);
    // the title's italic word reaches 9 px under its box on a tight line, the font's own room; and a bar set 100 px wider
    // than its centred column reaches past both sides, a breakout: neither is a spill
    assert.match(blind.out, /spilling boxes: 0/);
  } finally { srv.close(); }
});
