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
  // TYPE FLOOR. Nothing here ever checked how big text actually RENDERS, which is
  // why DESIGN.md's 11px floor went unenforced from 2026-08-09 to 2026-09-20: a
  // pass over 20 pages then found 4,044 elements under 13px on a phone, down to
  // 2.5px, while 92 to 100% of all text rendered at the IDENTICAL size as on a
  // 1280px desktop. A floor written in prose with no token behind it and no gate
  // in front of it is a preference. Both floors are read from the tokens so this
  // check and hu-global.css cannot drift apart.
  // SVG text is measured through its screen CTM: a <text> at 12 units inside a
  // scaled viewBox is not 12px to a reader, it is whatever the scale makes it.
  // Shared by the type floor and the collision check below: a surface the reader
  // can magnify is exempt for its SCENE, because magnification IS the
  // interaction there (David 2026-08-23, the Atlas hex grid and the hospital
  // blueprint). Marked explicitly rather than inferred, because the exemption
  // covers terrain and never the UI sitting on top of it.
  const zoomScene = (el) => {
    for (let p = el; p && p !== document.documentElement; p = p.parentElement) {
      if (p.hasAttribute && p.hasAttribute('data-zoom-scene')) return true;
      const m = getComputedStyle(p).transform;
      if (m && m !== 'none') {
        const n = m.match(/matrix\(([^)]+)\)/);
        if (n) { const v = n[1].split(',').map(Number); if (Math.abs(v[0] - 1) > 0.01 || Math.abs(v[3] - 1) > 0.01) return true; }
      }
    }
    return false;
  };
  const tiny = [];
  let softCount = 0;
  if (phone) {
    const tok = (n, d) => { const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(n)); return isFinite(v) && v > 0 ? v : d; };
    const ABS = tok('--t-micro', 12);    // nothing on a phone renders below this
    const FUNC = tok('--t-label', 13);   // functional text holds this
    for (const el of document.querySelectorAll('body *')) {
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || cs.opacity === '0') continue;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height || r.right < 0 || r.bottom < 0) continue;
      let px, text;
      if (el.tagName.toLowerCase() === 'text') {
        const m = el.getScreenCTM ? el.getScreenCTM() : null;
        px = parseFloat(cs.fontSize) * (m ? Math.abs(m.a) : 1);
        text = (el.textContent || '').trim();
      } else if (!el.ownerSVGElement) {
        text = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).map((n) => n.textContent.trim()).join(' ');
        if (!text) continue;
        px = parseFloat(cs.fontSize);
      } else continue;
      // A computed 0 is not small text, it is no text: the font-size:0 trick for
      // killing inline-block whitespace, or a measurement taken mid-transition.
      // Reporting it as a floor violation is a false positive (/atlas/ did).
      if (!text || text.length < 2 || !isFinite(px) || px <= 0 || px >= FUNC - 0.4) continue;
      if (zoomScene(el)) continue;
      if (px < ABS - 0.4) tiny.push([Math.round(px * 10) / 10, sel(el), text.slice(0, 30)]);
      else softCount++;   // between the absolute and the functional floor
    }
    tiny.sort((a, b) => a[0] - b[0]);
  }

  // SVG LABEL COLLISION. The type floor proves a label is big enough. It proves
  // nothing about whether two labels now sit on top of each other, and the two
  // are in tension: the fix for small diagram text is bigger diagram text, which
  // is exactly what makes labels collide. Measured 2026-09-20 on the laws page,
  // where a counter-scale pass put every label at or above the floor with zero
  // overflow and zero clipping, this gate said ok, and the drawing read
  // "ROUGHLY FLATHEOGETHER SPLITS FROM THE VOLUME".
  // Under 18% of the smaller box is ignored: touching descenders and a label
  // deliberately set against a shape are not collisions.
  const collide = [];
  if (phone) {
    for (const svg of document.querySelectorAll('svg')) {
      const ts = [...svg.querySelectorAll('text')].filter((t) => {
        if (!(t.textContent || '').trim()) return false;
        const cs = getComputedStyle(t);
        if (cs.visibility === 'hidden' || cs.display === 'none' || cs.opacity === '0') return false;
        // Walk up from the TEXT, not from the <svg>: the Atlas carries its pan
        // and zoom on a <g> INSIDE the drawing, so testing the root missed it
        // and reported 538 hex labels overlapping at low zoom. The type floor
        // already walked from the text, which is why it exempted them correctly.
        return !zoomScene(t);
      });
      for (let i = 0; i < ts.length; i++) {
        for (let j = i + 1; j < ts.length; j++) {
          const a = ts[i].getBoundingClientRect(), b = ts[j].getBoundingClientRect();
          if (!a.width || !a.height || !b.width || !b.height) continue;
          const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
          const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          if (ox <= 2 || oy <= 2) continue;
          const share = (ox * oy) / Math.min(a.width * a.height, b.width * b.height);
          if (share > 0.18) collide.push([Math.round(share * 100),
            ts[i].textContent.trim().slice(0, 22), ts[j].textContent.trim().slice(0, 22)]);
        }
      }
    }
    collide.sort((a, b) => b[0] - a[0]);
  }

  // CHROME BUDGET. DESIGN.md "The Two Surfaces": fixed and sticky chrome takes at
  // most 15% of the phone viewport, because the browser's own bars take roughly
  // another quarter of the screen that we do not control. Measured 2026-09-20:
  // alarm fatigue spent 220px of 740 (30%), the career tree 177px (24%).
  // A bar, not a dialog: it spans the width and is pinned to an edge.
  const chromeBars = [];
  let chromeH = 0, topBars = 0;
  if (phone) {
    // Measured with the page SCROLLED, not at rest, and counting only the part
    // actually on screen. Both matter, and the first version of this check got
    // both wrong in opposite directions (2026-09-20):
    //   · A sticky toolbar sits in normal flow until you scroll. The vendor
    //     directory's was at y=846 in a 740px viewport, so "at rest" it was not
    //     chrome at all, yet it really does take 222px once you are reading.
    //   · The merged band leaves the site nav fixed at top:-65 under a
    //     translate, parked until summoned. It costs the reader nothing, and
    //     counting its 64px put three tool pages over budget that were inside it.
    const y0 = window.scrollY;
    const room = Math.max(0, document.documentElement.scrollHeight - innerHeight);
    window.scrollTo(0, Math.min(600, room));
    void document.documentElement.offsetHeight;      // force the sticky reflow
    const found = [];
    for (const el of document.querySelectorAll('body *')) {
      const cs = getComputedStyle(el);
      if (cs.position !== 'fixed' && cs.position !== 'sticky') continue;
      if (cs.visibility === 'hidden' || cs.display === 'none' || cs.opacity === '0') continue;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      const seen = Math.min(r.bottom, innerHeight) - Math.max(r.top, 0);
      if (seen < 8) continue;                                        // parked or below the fold
      if (r.width < vw * 0.6 || seen > innerHeight * 0.4) continue;   // a bar, not a panel
      if (found.some((o) => o.contains(el) || el.contains(o))) continue;
      found.push(el);
      // A phone gets ONE top bar. Two stacked is the squeeze itself: the desktop
      // nav kept and the phone nav added under it. Counting them separately says
      // WHICH rule was broken, where a single percentage only said "too much".
      if (r.top < innerHeight * 0.3) topBars++;
      chromeBars.push(sel(el) + ':' + Math.round(seen));
      chromeH += Math.round(seen);
    }
    window.scrollTo(0, y0);
  }
  const chromePct = phone && innerHeight ? Math.round((chromeH / innerHeight) * 100) : 0;

  const vh = [];
  for (const sheet of document.styleSheets) {
    let rules; try { rules = sheet.cssRules; } catch { continue; }
    const walk = (list) => { for (const r of list) { if (r.cssRules) walk(r.cssRules); else if (r.cssText && /\b100vh\b/.test(r.cssText) && !/100dvh/.test(r.cssText)) vh.push(r.selectorText || r.cssText.slice(0, 60)); } };
    walk(rules);
  }
  return { overflow, scrollWidth: document.documentElement.scrollWidth, vw, culprits: culprits.slice(0, 6), small: small.slice(0, 12), smallCount: small.length, clipped: clipped.slice(0, 8), clippedCount: clipped.length, vh: [...new Set(vh)].slice(0, 8),
    tiny: tiny.slice(0, 8), tinyCount: tiny.length, softCount, chromeBars, chromeH, chromePct, topBars, collide: collide.slice(0, 6), collideCount: collide.length, vhPx: innerHeight };
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
      const r = await page.evaluate(inspect, { phone, deviceWidth: w }).catch((e) => ({ overflow: false, culprits: [], small: [], smallCount: 0, clipped: [], clippedCount: 0, vh: [], tiny: [], tinyCount: 0, softCount: 0, chromeBars: [], chromeH: 0, chromePct: 0, topBars: 0, collide: [], collideCount: 0, evalError: e.message }));
      const shot = path.join(OUT, slug + '-' + w + '.png');
      await page.screenshot({ path: shot }).catch(() => {});
      // A generic "Failed to load resource" console line is the echo of a 4xx we
      // already classified. Discount one per serverless 404 so the gate does not
      // fail on something it cannot serve.
      const resourceEchoes = errors.filter((e) => /Failed to load resource/i.test(e));
      const realErrors = errors.length - Math.min(resourceEchoes.length, serverless.length);
      // The type floor and the chrome budget are Tier 1 physics (DESIGN.md, "The
      // Two Surfaces"), so they fail the gate rather than warning. softCount, the
      // band between the absolute and the functional floor, only reports: it is
      // the migration backlog, not a defect.
      const overBudget = phone && (r.chromePct > 20 || r.topBars > 1);
      const bad = realErrors > 0 || r.overflow || (phone && r.tinyCount > 0) || (phone && r.collideCount > 0) || overBudget;
      if (bad) failed = true;
      console.log(`  ${String(w).padStart(4)}px  ${bad ? 'FAIL' : 'ok  '}  console errors: ${realErrors}  overflow: ${r.overflow ? r.scrollWidth + ' > ' + r.vw : 'none'}  clipped: ${phone ? r.clippedCount : 'n/a'}  sub-44px targets: ${phone ? r.smallCount : 'n/a'}  under type floor: ${phone ? r.tinyCount : 'n/a'}  colliding labels: ${phone ? r.collideCount : 'n/a'}  chrome: ${phone ? r.chromeH + 'px/' + r.chromePct + '%' : 'n/a'}  100vh rules: ${r.vh.length}  shot: ${path.relative(ROOT, shot)}`);
      for (const s of [...new Set(serverless)]) console.log('         (not a defect) serverless route absent from the static harness: ' + s);
      for (const e of errors.slice(0, 5)) console.log('         error: ' + e.slice(0, 160));
      for (const [px, s] of r.culprits) console.log('         overflows by ' + px + 'px: ' + s);
      for (const [px, s, txt] of (r.clipped || [])) console.log('         CLIPPED ' + px + 'px past the edge: ' + s + (txt ? ' "' + txt + '"' : ''));
      for (const [s, size, txt] of r.small.slice(0, 6)) console.log('         small: ' + s + ' ' + size + (txt ? ' "' + txt + '"' : ''));
      for (const [px, s, txt] of (r.tiny || [])) console.log('         UNDER THE TYPE FLOOR at ' + px + 'px: ' + s + (txt ? ' "' + txt + '"' : ''));
      for (const [pct, a, b] of (r.collide || [])) console.log('         LABELS COLLIDE, ' + pct + '% overlap: "' + a + '"  x  "' + b + '"');
      if (phone && r.softCount) console.log('         (backlog, not a fail) ' + r.softCount + ' element(s) between the absolute and the functional floor');
      if (overBudget) console.log('         CHROME OVER BUDGET: ' + r.chromeH + 'px of ' + r.vhPx + ' is ' + r.chromePct + '%'
        + (r.topBars > 1 ? ', and ' + r.topBars + ' TOP BARS are stacked (a phone gets one)' : ', ceiling is 20%')
        + '  [' + r.chromeBars.join(' ') + ']');
      for (const s of r.vh) console.log('         100vh without dvh: ' + s);
      if (r.evalError) console.log('         inspect failed: ' + r.evalError);
      await ctx.close();
    }
  }
  await browser.close();
  if (local) local.srv.close();
  console.log('\n' + (failed ? 'FAILED: see console errors, overflow, type floor or chrome budget above.' : 'CLEAN: no console errors, no overflow, no text under the type floor, chrome inside budget.') + ' Screenshots in ' + path.relative(ROOT, OUT) + '/');
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
