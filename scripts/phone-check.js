// The phone harness. The instrument checklist's phone gate was a promise until this existed
// (the mobile-tester agent needed a Playwright it did not have, 2026-09-18). Serves _site on
// a local port (or points at --base), loads each path in headless Chromium at 360, 699 and
// 1024 CSS px, and reports what the site's own rules care about:
//   console errors and page errors, verbatim
//   horizontal overflow, with the widest offenders named by selector
//   CLIPPED content: anything past the right edge that body's overflow-x:hidden
//     quietly cuts off instead of scrolling (a warning, not a failure). Added
//     2026-09-19 after a Rounds citation at 452px in a 360px viewport passed CLEAN,
//     because a clipped page does not scroll and the overflow check saw nothing.
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
function inspect({ phone, deviceWidth }) {
  const sel = (el) => {
    let s = el.tagName.toLowerCase();
    if (el.id) s += '#' + el.id;
    else if (el.classList.length) s += '.' + [...el.classList].slice(0, 3).join('.');
    return s;
  };
  // NOT window.innerWidth. With isMobile:true Chromium honours the page's meta
  // viewport, and when content is wider than the device the LAYOUT viewport grows
  // to fit it: innerWidth silently becomes the content width. Comparing
  // scrollWidth against that compares a number to itself, so the overflow check
  // could never fail. Measured 2026-09-19 on a Rounds post: the context was set to
  // 360 and innerWidth reported 499, exactly the width of the overflowing content.
  // The device width we asked for is the only honest ruler here.
  const vw = deviceWidth || window.innerWidth;
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
      if (r.height >= 44 && r.width >= 44) continue;
      // STRETCHED LINK. `::after { position:absolute; inset:0 }` makes the whole
      // card the tap target while the <a>'s own box is just its text. The Learn
      // hub's card links measure 198x22 and are actually card-sized. Reporting
      // them buried the real misses: 16 of 89 warnings on /learn/ were this.
      const af = getComputedStyle(el, '::after');
      if (af && af.content !== 'none' && af.position === 'absolute'
          && af.top === '0px' && af.right === '0px' && af.bottom === '0px' && af.left === '0px') continue;
      // INLINE EXCEPTION. WCAG 2.5.8 exempts a link sitting inside a sentence,
      // because enlarging it would break the line. The source-policy citations
      // in the footer are all of these.
      // Citation and source lines: the link sits inside a line of non-target
      // text and is sized by it, which is WCAG 2.5.8's inline exception. The
      // full-site sweep found 124 of these across 17 pages and every one was a
      // DOI, a source name or a map credit, not a control. .maplibregl-* is the
      // basemap's own attribution and not ours to size.
      const INLINE = 'p, li, blockquote, figcaption, .cp-text, .jp-p, .jp-source, .jp-sources,'
        + ' .src-body, .tool-attribution, .ref-item, .ds-src-name, .rate-context-source,'
        + ' .stats-source, .source-note, .ehr-src, .jp-counter-body, em, .maplibregl-ctrl-attrib-inner';
      if (el.tagName === 'A' && el.closest(INLINE)) continue;
      small.push([sel(el), Math.round(r.width) + 'x' + Math.round(r.height), (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30)]);
    }
  }
  // CLIPPED CONTENT. The overflow check above only catches a page that SCROLLS
  // sideways. `body { overflow-x: hidden }` turns that into content silently cut
  // off at the screen edge instead, which the reader loses and the check cannot
  // see. Found 2026-09-19: a Rounds citation is white-space:nowrap and renders
  // 452px wide in a 360px viewport, and the page reported CLEAN.
  // An element inside a real horizontal scroller is not clipped, it is swipeable,
  // so walk up and skip those. Report the innermost offender, not its wrappers.
  const clipped = [];
  if (phone) {
    const hits = [];
    for (const el of document.querySelectorAll('body *')) {
      // Inside an <svg>, geometry is the drawing's own coordinate space and is
      // clipped by the svg box, so a hex tile 5000px "past the edge" is a pan
      // target, not a defect. The Atlas alone reported 1,857 of these. Check the
      // root <svg> itself, never its children.
      if (el.ownerSVGElement) continue;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height || r.right <= vw + 1) continue;
      // ENTIRELY past the edge is a parked panel (a closed drawer translated out,
      // the Atlas help card), not clipped content. Clipping means the element
      // STARTS on screen and gets cut: left inside, right outside.
      if (r.left >= vw) continue;
      const cs = getComputedStyle(el);
      if (cs.position === 'fixed' || cs.visibility === 'hidden' || cs.display === 'none' || cs.opacity === '0') continue;
      let swipeable = false;
      // starts at el, not its parent: the pan/zoom scene carries the transform itself
      for (let p = el; p && p !== document.documentElement; p = p.parentElement) {
        const pcs = getComputedStyle(p);
        if (p !== el && (pcs.overflowX === 'auto' || pcs.overflowX === 'scroll')) { swipeable = true; break; }
        // PINCH-ZOOM CANVAS. The hospital blueprint and the Atlas hex grid are
        // pan/zoom surfaces: a JS transform moves a deliberately oversized scene
        // inside an overflow-hidden frame, and the user pinches to reach the
        // rest. That is David's ruled phone answer, not clipping. A scene under
        // a real scale or a large translate is being driven, so leave it alone.
        // Without this the hospital map reported 27 defects and had none.
        const m = pcs.transform;
        if (m && m !== 'none') {
          const n = m.match(/matrix\(([^)]+)\)/);
          if (n) {
            const v = n[1].split(',').map(Number);
            if (Math.abs(v[0] - 1) > 0.01 || Math.abs(v[3] - 1) > 0.01 || Math.abs(v[4]) > 20) { swipeable = true; break; }
          }
        }
      }
      if (!swipeable) hits.push(el);
    }
    for (const el of hits) {
      if (hits.some((o) => o !== el && el.contains(o))) continue;   // a wrapper of another hit
      const r = el.getBoundingClientRect();
      // COVERED BY AN OVERLAY. /atlas/craft/ gates phones with a full-screen
      // "this is a desktop tool" card and leaves the canvas in the DOM behind it.
      // The reader never sees or reaches that content, so its width is not a
      // defect. Probe a point that is actually on screen: if something unrelated
      // is painted on top there, this element is not what the reader is looking at.
      const px = Math.min(r.left + r.width / 2, vw - 4);
      const py = Math.min(Math.max(r.top + r.height / 2, 4), innerHeight - 4);
      const top = document.elementFromPoint(Math.max(px, 4), py);
      if (top && top !== el && !el.contains(top) && !top.contains(el)) continue;
      clipped.push([Math.round(r.right - vw), sel(el), (el.textContent || '').trim().slice(0, 40)]);
    }
    clipped.sort((a, b) => b[0] - a[0]);
  }
  const vh = [];
  for (const sheet of document.styleSheets) {
    let rules; try { rules = sheet.cssRules; } catch { continue; }
    const walk = (list) => { for (const r of list) { if (r.cssRules) walk(r.cssRules); else if (r.cssText && /\b100vh\b/.test(r.cssText) && !/100dvh/.test(r.cssText)) vh.push(r.selectorText || r.cssText.slice(0, 60)); } };
    walk(rules);
  }
  return { overflow, scrollWidth: document.documentElement.scrollWidth, vw, culprits: culprits.slice(0, 6), small: small.slice(0, 12), smallCount: small.length, clipped: clipped.slice(0, 8), clippedCount: clipped.length, vh: [...new Set(vh)].slice(0, 8) };
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
      // This harness serves the static _site. Netlify FUNCTIONS are deployed
      // separately and simply do not exist here, so a 404 on one is a limit of
      // the gate, not a defect. /tools/assignment-compass/ calls the GSA per diem
      // proxy on load and was failing the build for it. Counted and reported, but
      // never failed on.
      const serverless = [];
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
      page.on('response', (res) => {
        if (res.status() >= 400 && /\/\.netlify\/functions\//.test(res.url())) {
          serverless.push(res.status() + ' ' + res.url().replace(origin, ''));
        }
      });
      try {
        await page.goto(origin + p, { waitUntil: 'networkidle', timeout: 30000 });
      } catch (e) { errors.push('navigation: ' + e.message.split('\n')[0]); }
      await page.waitForTimeout(600);
      const r = await page.evaluate(inspect, { phone, deviceWidth: w }).catch((e) => ({ overflow: false, culprits: [], small: [], smallCount: 0, clipped: [], clippedCount: 0, vh: [], evalError: e.message }));
      const shot = path.join(OUT, slug + '-' + w + '.png');
      await page.screenshot({ path: shot }).catch(() => {});
      // A generic "Failed to load resource" console line is the echo of a 4xx we
      // already classified. Discount one per serverless 404 so the gate does not
      // fail on something it cannot serve.
      const resourceEchoes = errors.filter((e) => /Failed to load resource/i.test(e));
      const realErrors = errors.length - Math.min(resourceEchoes.length, serverless.length);
      const bad = realErrors > 0 || r.overflow;
      if (bad) failed = true;
      console.log(`  ${String(w).padStart(4)}px  ${bad ? 'FAIL' : 'ok  '}  console errors: ${realErrors}  overflow: ${r.overflow ? r.scrollWidth + ' > ' + r.vw : 'none'}  clipped: ${phone ? r.clippedCount : 'n/a'}  sub-44px targets: ${phone ? r.smallCount : 'n/a'}  100vh rules: ${r.vh.length}  shot: ${path.relative(ROOT, shot)}`);
      for (const s of [...new Set(serverless)]) console.log('         (not a defect) serverless route absent from the static harness: ' + s);
      for (const e of errors.slice(0, 5)) console.log('         error: ' + e.slice(0, 160));
      for (const [px, s] of r.culprits) console.log('         overflows by ' + px + 'px: ' + s);
      for (const [px, s, txt] of (r.clipped || [])) console.log('         CLIPPED ' + px + 'px past the edge: ' + s + (txt ? ' "' + txt + '"' : ''));
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
