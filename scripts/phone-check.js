// The phone harness. The instrument checklist's phone gate was a promise until this existed
// (the mobile-tester agent needed a Playwright it did not have, 2026-09-18). Serves _site on
// a local port (or points at --base), loads each path in headless Chromium at 360, 699 and
// 1024 CSS px, and reports what the site's own rules care about:
//   console errors and page errors, verbatim
//   horizontal overflow, with the widest offenders named by selector
//   interactive targets under 44 CSS px at the phone widths (a warning, not a failure)
//   stylesheet rules that say 100vh without a 100dvh line beside them
// Screenshots land in tmp/phone/<slug>-<width>.png. Exit code 1 on any console error or
// overflow, so it can gate a build. Usage:
//   npm run phone -- /tools/ai-skills/ /tools/skill-demo/        (serves _site itself)
//   npm run phone -- /atlas/ --base http://localhost:8080          (an already-running server)
//   npm run phone -- /learn/ --widths 360,699
//   npm run phone -- tools/ai-skills/           (Git Bash: no leading slash, or MSYS_NO_PATHCONV=1)
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const SITE = path.join(ROOT, '_site');
const OUT = path.join(ROOT, 'tmp', 'phone');
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain', '.md': 'text/markdown', '.pdf': 'application/pdf', '.wasm': 'application/wasm' };

const argv = process.argv.slice(2);
const opt = (name, dflt) => { const i = argv.indexOf(name); return i > -1 ? argv[i + 1] : dflt; };
// Git Bash rewrites a leading-slash argument into a Windows path before node sees it (MSYS
// path conversion): "/tools/" arrives as "C:/Program Files/Git/tools/". Accept either
// spelling, and the slashless one (tools/ai-skills/), by stripping anything up to the msys
// root and putting exactly one leading slash back.
const paths = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--base' && argv[i - 1] !== '--widths')
  .map((a) => '/' + a.replace(/^[A-Za-z]:[\\/](?:.*?[\\/])?Git[\\/]/, '').replace(/^\/+/, ''));
const widths = opt('--widths', '360,699,1024').split(',').map(Number);
const base = opt('--base', null);
if (!paths.length) paths.push('/', '/tools/', '/learn/');

function serveSite() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p.endsWith('/')) p += 'index.html';
      let f = path.join(SITE, p);
      if (!f.startsWith(SITE)) { res.writeHead(403); return res.end(); }
      if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
      if (!fs.existsSync(f)) { res.writeHead(404); return res.end('not found'); }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve({ srv, url: 'http://127.0.0.1:' + srv.address().port }));
  });
}

/* runs in the page */
function inspect(phone) {
  const sel = (el) => {
    let s = el.tagName.toLowerCase();
    if (el.id) s += '#' + el.id;
    else if (el.classList.length) s += '.' + [...el.classList].slice(0, 3).join('.');
    return s;
  };
  const vw = window.innerWidth;
  const overflow = document.documentElement.scrollWidth > vw + 1;
  const culprits = [];
  if (overflow) {
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width && r.right > vw + 1 && getComputedStyle(el).position !== 'fixed') culprits.push([Math.round(r.right - vw), sel(el)]);
    }
    culprits.sort((a, b) => b[0] - a[0]);
  }
  const small = [];
  if (phone) {
    for (const el of document.querySelectorAll('a[href], button, input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])')) {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      if (r.right < 0 || r.bottom < 0) continue;            // parked offscreen until focused (the skip link)
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      if (r.height < 44 || r.width < 44) small.push([sel(el), Math.round(r.width) + 'x' + Math.round(r.height), (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30)]);
    }
  }
  const vh = [];
  for (const sheet of document.styleSheets) {
    let rules; try { rules = sheet.cssRules; } catch { continue; }
    const walk = (list) => { for (const r of list) { if (r.cssRules) walk(r.cssRules); else if (r.cssText && /\b100vh\b/.test(r.cssText) && !/100dvh/.test(r.cssText)) vh.push(r.selectorText || r.cssText.slice(0, 60)); } };
    walk(rules);
  }
  return { overflow, scrollWidth: document.documentElement.scrollWidth, vw, culprits: culprits.slice(0, 6), small: small.slice(0, 12), smallCount: small.length, vh: [...new Set(vh)].slice(0, 8) };
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const local = base ? null : await serveSite();
  const origin = base || local.url;
  const browser = await chromium.launch();
  let failed = false;
  for (const p of paths) {
    const slug = p.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home';
    console.log('\n== ' + p);
    for (const w of widths) {
      const phone = w <= 699;
      const ctx = await browser.newContext({ viewport: { width: w, height: phone ? 800 : 900 }, deviceScaleFactor: 2, isMobile: phone, hasTouch: phone });
      const page = await ctx.newPage();
      const errors = [];
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
      try {
        await page.goto(origin + p, { waitUntil: 'networkidle', timeout: 30000 });
      } catch (e) { errors.push('navigation: ' + e.message.split('\n')[0]); }
      await page.waitForTimeout(600);
      const r = await page.evaluate(inspect, phone).catch((e) => ({ overflow: false, culprits: [], small: [], smallCount: 0, vh: [], evalError: e.message }));
      const shot = path.join(OUT, slug + '-' + w + '.png');
      await page.screenshot({ path: shot }).catch(() => {});
      const bad = errors.length || r.overflow;
      if (bad) failed = true;
      console.log(`  ${String(w).padStart(4)}px  ${bad ? 'FAIL' : 'ok  '}  console errors: ${errors.length}  overflow: ${r.overflow ? r.scrollWidth + ' > ' + r.vw : 'none'}  sub-44px targets: ${phone ? r.smallCount : 'n/a'}  100vh rules: ${r.vh.length}  shot: ${path.relative(ROOT, shot)}`);
      for (const e of errors.slice(0, 5)) console.log('         error: ' + e.slice(0, 160));
      for (const [px, s] of r.culprits) console.log('         overflows by ' + px + 'px: ' + s);
      for (const [s, size, txt] of r.small.slice(0, 6)) console.log('         small: ' + s + ' ' + size + (txt ? ' "' + txt + '"' : ''));
      for (const s of r.vh) console.log('         100vh without dvh: ' + s);
      if (r.evalError) console.log('         inspect failed: ' + r.evalError);
      await ctx.close();
    }
  }
  await browser.close();
  if (local) local.srv.close();
  console.log('\n' + (failed ? 'FAILED: console errors or overflow above.' : 'CLEAN: no console errors, no overflow.') + ' Screenshots in ' + path.relative(ROOT, OUT) + '/');
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
