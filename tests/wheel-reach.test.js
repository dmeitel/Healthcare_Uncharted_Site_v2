/**
 * The wheel reach check (scripts/lib/wheel-reach.js), the phone gate's answer to a control below the
 * window that no wheel can scroll to. Each fixture is a shape this site has actually shipped:
 *   the tool shell pinned to the window with a lobby taller than it (Vital Stats, 2026-10-01);
 *   a console floating in a clipped floor, with a card tray scrolling inside it (Alarm Fatigue, 2026-10-14);
 *   and the things that are hidden on purpose and must never fail (the summoned nav band, a closed
 *   drawer, a closed sheet, a folded panel, a pan scene).
 * The last test runs the built Vital Stats lobby with its 2026-10-01 fix undone, the bug this check
 * exists to catch. These tests drive a real Chromium; without one installed they skip.
 */
'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { wheelReach } = require('../scripts/lib/wheel-reach');

let chromium = null, browser = null, why = '';
try { ({ chromium } = require('playwright')); } catch (e) { why = 'playwright is not installed'; }

before(async () => {
  if (!chromium) return;
  try { browser = await chromium.launch(); } catch (e) { why = 'no Chromium to drive: ' + e.message.split('\n')[0]; }
});
after(async () => { if (browser) await browser.close(); });

/** @param {string} html @param {{w?: number, h?: number}} [vp] */
async function reach(html, vp = {}) {
  const ctx = await browser.newContext({ viewport: { width: vp.w || 1024, height: vp.h || 768 } });
  const page = await ctx.newPage();
  await page.setContent('<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;font:16px sans-serif}</style></head><body>' + html + '</body></html>');
  const res = await wheelReach(page, { pause: 150 });
  await ctx.close();
  return res;
}
const names = (res) => res.lost.map((l) => l.text || l.sel);

test('a shell pinned to the window loses the button under its foot', async (t) => {
  if (!browser) return t.skip(why);
  const res = await reach(`<style>.shell{height:100vh;overflow:hidden;display:flex;flex-direction:column}.tall{flex:none;height:1100px}</style>
    <div class="shell"><h1>Lobby</h1><div class="tall"></div><button>Deal the first question</button></div>`);
  assert.deepEqual(names(res), ['Deal the first question']);
  assert.match(res.lost[0].cut, /div\.shell \(overflow hidden/, 'the box that cuts it is named');
});

test('the same shell released to scroll like a page loses nothing', async (t) => {
  if (!browser) return t.skip(why);
  const res = await reach(`<style>.shell{min-height:100vh;display:flex;flex-direction:column}.tall{flex:none;height:1100px}</style>
    <div class="shell"><h1>Lobby</h1><div class="tall"></div><button>Deal the first question</button></div>`);
  assert.equal(res.checked, 1, 'the button was below the window and had to be wheeled to');
  assert.deepEqual(res.lost, []);
});

// Alarm Fatigue's floor: a clipped floor, a console centred with translateX(-50%) and pointer-events:none
// (so its gaps take no wheel), a card tray scrolling inside it with overscroll-behavior:contain
const floor = (stage) => `<style>
  .floor{position:relative;height:100vh;overflow:hidden}
  .stage{position:absolute;left:50%;top:92px;transform:translateX(-50%);width:600px;display:flex;flex-direction:column;gap:16px;pointer-events:none;${stage}}
  .stage>*{pointer-events:auto;flex:0 0 auto}
  .bank{height:340px;background:#123}.clicker{height:200px}
  .tray{max-height:236px;overflow-y:auto;overscroll-behavior:contain;display:flex;flex-direction:column;gap:8px}
  .card{display:block;height:84px;flex:none}.pumps{display:flex;gap:8px}</style>
  <div class="floor"><div class="stage"><div class="bank"><button>Check room 4</button></div>
  <div class="clicker"><button>Clock in</button></div>
  <div class="tray"><button class="card">Pick up Smart Badge</button><button class="card">Pick up Med pass</button><button class="card">Pick up Bed alarm</button></div>
  <div class="pumps"><button>Hang it, channel 1</button><button>Hang it, channel 2</button></div></div></div>`;

test('a console that runs past its clipped floor loses the pumps and the cards', async (t) => {
  if (!browser) return t.skip(why);
  const res = await reach(floor(''));
  assert.ok(names(res).includes('Hang it, channel 1'), 'the pumps under the window: ' + names(res).join(', '));
  assert.ok(names(res).includes('Pick up Bed alarm'));
});

test('the console scrolling inside the floor reaches the pumps, and the tray inside it reaches its last card', async (t) => {
  if (!browser) return t.skip(why);
  const res = await reach(floor('max-height:calc(100% - 100px);overflow:auto'));
  assert.ok(res.checked >= 4, 'cards and pumps were out of view at rest');
  assert.deepEqual(res.lost, []);
});

// the home respiratory timeline's shape: a sticky rail that scrolls inside itself, in a section the page
// scrolls past. Wheeling the page to its end first carries the rail out of the window above it, so the
// page has to stop when the rail comes into view (the first full sweep, 2026-10-14, failed it 15 times)
test('a sticky rail below the fold is wheeled when the page brings it into view, not after the page has run past it', async (t) => {
  if (!browser) return t.skip(why);
  const items = Array.from({ length: 30 }, (_, i) => `<button class="item">Milestone ${1960 + i * 2}</button>`).join('');
  const res = await reach(`<style>
    header{height:1000px} footer{height:1200px}
    .main{display:grid;grid-template-columns:300px 1fr}
    .rail{position:sticky;top:0;height:100vh;overflow-y:auto;display:flex;flex-direction:column}
    .item{flex:none;height:60px}</style>
    <header><h1>Timeline</h1></header><div class="main"><div class="rail">${items}</div><div><p>Pick a milestone</p></div></div><footer><p>Sources</p></footer>`);
  assert.deepEqual(names(res), []);
});

// the Vendor Directory's shape: a side panel whose top edge only just shows at rest. Wheeled to its end
// from there, its first rows sit above its scroll once the page brings it into view, and only a wheel
// back up reaches them (the second full sweep, 2026-10-14, failed five sectors)
test('a panel wheeled down while barely in view is wheeled back up for the rows it carried past', async (t) => {
  if (!browser) return t.skip(why);
  const rows = Array.from({ length: 24 }, (_, i) => `<button class="row">Sector ${i + 1}</button>`).join('');
  const res = await reach(`<style>
    header{height:740px} header h1{margin:0} footer{height:200px}
    .main{display:grid;grid-template-columns:260px 1fr}
    .side{position:sticky;top:0;height:100vh;overflow-y:auto;display:flex;flex-direction:column}
    .row{flex:none;height:60px} .list{height:2600px}</style>
    <header><h1>Vendors</h1></header><div class="main"><div class="side">${rows}</div><div class="list"><p>158 vendors</p></div></div><footer><p>Sources</p></footer>`);
  assert.deepEqual(names(res), []);
});

test('what is hidden on purpose is not judged', async (t) => {
  if (!browser) return t.skip(why);
  const res = await reach(`<style>
    .band{position:fixed;top:0;left:0;right:0;transform:translateY(-100%)}
    .drawer{position:fixed;top:0;right:0;width:300px;height:100vh;transform:translateX(105%)}
    .sheet{position:fixed;left:0;right:0;bottom:0;height:300px;transform:translateY(105%)}
    .fold{max-height:0;overflow:hidden}
    .scene{height:200px;overflow:hidden}.scene>div{transform:translateY(600px)}
    .zoom{height:200px;overflow:hidden}.zoom>div{height:900px;display:flex;align-items:flex-end}</style>
    <nav class="band"><a href="#a">Tools</a></nav>
    <aside class="drawer"><button>Close the drawer</button></aside>
    <div class="sheet"><button>Sheet action</button></div>
    <div class="fold"><button>Inside a closed fold</button></div>
    <div class="scene"><div><p>a panned scene</p></div></div>
    <div class="zoom" data-zoom-scene><div><button>Far corner of the map</button></div></div>
    <p aria-hidden="true" style="margin-top:1200px">decor</p>`);
  assert.deepEqual(res.lost, [], 'nothing hidden on purpose fails: ' + names(res).join(', '));
});

test('a card open on arrival is judged, then closed with Escape, and the screen under it judged too', async (t) => {
  if (!browser) return t.skip(why);
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  const page = await ctx.newPage();
  await page.setContent(`<!doctype html><body style="margin:0"><div style="height:100vh;overflow:hidden"><div style="height:1200px"></div><button>Behind the card</button></div>
    <dialog id="d" style="max-height:60vh;overflow:auto"><p>How to play</p><div style="height:900px"></div><button>Start</button></dialog>
    <script>document.getElementById('d').showModal()</script></body>`);
  const res = await wheelReach(page, { pause: 150 });
  await ctx.close();
  assert.equal(res.checked, 2, 'the Start button below the card\'s fold, then the button behind the card');
  assert.deepEqual(names(res), ['Behind the card'], 'Start scrolls into view inside the card; the trapped button behind it is caught once the card closes');
});

// THE BUG IT EXISTS FOR: the built Vital Stats lobby, as shipped and with its 2026-10-01 fix undone
const SITE = path.join(__dirname, '..', '_site');
const built = fs.existsSync(path.join(SITE, 'fun', 'vital-stats', 'index.html'));
function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p.endsWith('/')) p += 'index.html';
      const f = path.join(SITE, p);
      if (!f.startsWith(SITE) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
      const type = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml' }[path.extname(f)] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': type });
      fs.createReadStream(f).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}
async function lobby(origin, css) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'dark' });
  const page = await ctx.newPage();
  await page.goto(origin + '/fun/vital-stats/', { waitUntil: 'load' });
  if (css) await page.addStyleTag({ content: css });
  await page.waitForTimeout(600);
  await page.evaluate(() => { const b = /** @type {HTMLElement} */ (document.querySelector('[data-go="solo"]')); if (b) b.click(); });
  await page.waitForTimeout(1200);   // a first visit's how-to card opens here; the check judges it, closes it, then the lobby
  assert.ok(await page.evaluate(() => !!document.querySelector('#vsBigDeal, [data-go="start"]')), 'the lobby opened');
  const res = await wheelReach(page, { pause: 200 });
  await ctx.close();
  return res;
}

test('the built Vital Stats lobby: its Deal button is in reach, and is lost with the 2026-10-01 fix undone', async (t) => {
  if (!browser) return t.skip(why);
  if (!built) return t.skip('no _site build: run npm run build');
  const srv = await serve();
  const origin = 'http://127.0.0.1:' + /** @type {import('net').AddressInfo} */ (srv.address()).port;
  try {
    const shipped = await lobby(origin, '');
    assert.ok(shipped.checked > 0, 'the lobby is taller than the window, so something had to be wheeled to');
    assert.deepEqual(names(shipped), [], 'as shipped, everything is in reach');
    const undone = await lobby(origin, '#vs{height:calc(100dvh - var(--nav-h, 0px)) !important; overflow:hidden !important; min-height:0 !important}');
    assert.ok(names(undone).some((n) => /^Deal/.test(n)), 'the Deal button is lost: ' + names(undone).join(', '));
  } finally { srv.close(); }
});
