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
//   FLOATING OVER A CONTROL, CUT BY ITS CONTAINER, and a SLOW-DATA pass (a phone with every
//     data file held back two seconds), all three added 2026-09-23 after the tool review
//     found four defects this harness had passed. --no-slow skips the slow pass.
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
// A viewport is WIDTHxHEIGHT now, so a phone can be read on its side. A bare number keeps
// its old meaning and its old default height. David, 2026-09-21: the review is "phone vert
// and horizontal and web". Landscape matters because a game's controls move in it.
// THE LADDER. David, 2026-09-21: "I want every page to be able to look good on phone, and
// web/Tablet/Computer and when it has response size changes." Three spot sizes could not
// answer that: a layout can be clean at 360 and at 1280 and fall apart at 470, and nothing
// here had ever looked at a tablet at all. The two pairs either side of 699 are deliberate,
// because that is where this site's rules flip and a breakpoint is where layouts break.
/* 1920x1080 added 2026-09-22. David reviews at 2132px on his own monitor and the ladder
   topped out at 1280, so roughly 850px of the width he actually looks at had never been
   checked by anything. Most pages cap content at 1100px and centre it, which is why this
   was probably safe, but "probably" is the thing the sweep exists to replace. */
const viewports = opt('--widths', '360x740,430x932,699x900,700x900,768x1024,1024x768,1280x900,1920x1080,740x360').split(',').map((t) => {
  const m = String(t).trim().match(/^(\d+)(?:x(\d+))?$/);
  if (!m) return null;
  const w = Number(m[1]);
  return { w, h: m[2] ? Number(m[2]) : (w <= 699 ? 800 : 900) };
}).filter(Boolean);
const base = opt('--base', null);
// the slow-data pass (see where it runs); --no-slow skips it for a quick layout-only read
const NO_SLOW = argv.includes('--no-slow');
const SLOW_MS = 2000;
const DATA_FILE = /\.(json|geojson|topojson|csv|tsv|pbf)$/i;
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
    srv.listen(0, '127.0.0.1', () => resolve({ srv, url: 'http://127.0.0.1:' + /** @type {import('net').AddressInfo} */ (srv.address()).port }));
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
  /* A layout fault is a fault at every size. This used to be phone-gated, so a tablet and a
     desktop were never checked for it at all: the report printed n/a and the page "passed".
     David, 2026-09-21: "I want every page to be able to look good on phone, and
     web/Tablet/Computer and when it has response size changes."
     Phone PHYSICS stay phone-only below: 44px touch targets, the type floor and the chrome
     budget are about a thumb and a small screen, and mean nothing on a desktop. */
  if (true) {                     /* every size */
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
      if (/** @type {SVGElement} */ (el).ownerSVGElement) continue;
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
  // A GAME DRAWING is exempt for the labels printed on it (David 2026-09-23, Device Assembly: "go wild" on
  // that surface, and he picked the readout that puts the bedside screen's words under the wall as real
  // text). Marked `data-drawing` on the svg: the type floor skips <text> inside it and the stroke and ink
  // floors skip the svg, never the HTML UI around it, and the count is printed so the exemption is seen
  // rather than silent. The 44px touch floor still applies to everything.
  let drawnCount = 0;
  /* A layout fault is a fault at every size. This used to be phone-gated, so a tablet and a
     desktop were never checked for it at all: the report printed n/a and the page "passed".
     David, 2026-09-21: "I want every page to be able to look good on phone, and
     web/Tablet/Computer and when it has response size changes."
     Phone PHYSICS stay phone-only below: 44px touch targets, the type floor and the chrome
     budget are about a thumb and a small screen, and mean nothing on a desktop. */
  if (true) {                     /* every size */
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
        const g = /** @type {SVGGraphicsElement} */ (el);
        const m = g.getScreenCTM ? g.getScreenCTM() : null;
        px = parseFloat(cs.fontSize) * (m ? Math.abs(m.a) : 1);
        text = (el.textContent || '').trim();
      } else if (!/** @type {SVGElement} */ (el).ownerSVGElement) {
        text = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).map((n) => n.textContent.trim()).join(' ');
        if (!text) continue;
        px = parseFloat(cs.fontSize);
      } else continue;
      // A computed 0 is not small text, it is no text: the font-size:0 trick for
      // killing inline-block whitespace, or a measurement taken mid-transition.
      // Reporting it as a floor violation is a false positive (/atlas/ did).
      if (!text || text.length < 2 || !isFinite(px) || px <= 0 || px >= FUNC - 0.4) continue;
      if (zoomScene(el)) continue;
      if (el.tagName.toLowerCase() === 'text' && el.closest('svg[data-drawing]')) { drawnCount++; continue; }
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
  const bands = [], merged = [];
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
      // A modal card is not chrome: it is dismissed, and it takes the screen on purpose. The kit's first-visit
      // how-to is a bottom sheet on a phone, bar-shaped enough to pass the size test below, and it put Device
      // Assembly at 35% on the run that caught it (2026-09-23).
      if (el.closest && el.closest('dialog[open], [aria-modal="true"]')) continue;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      const seen = Math.min(r.bottom, innerHeight) - Math.max(r.top, 0);
      if (seen < 8) continue;                                        // parked or below the fold
      // A slide-in panel is parked by translating it off the SIDE, not by hiding it, so its own
      // sticky header still reports a normal vertical box while sitting entirely off screen.
      // The SQL tool has two of them and this check counted both as stacked top bars (2026-09-20).
      const across = Math.min(r.right, vw) - Math.max(r.left, 0);
      if (across < vw * 0.5) continue;                               // parked off to one side
      if (r.width < vw * 0.6 || seen > innerHeight * 0.4) continue;   // a bar, not a panel
      if (found.some((o) => o.contains(el) || el.contains(o))) continue;
      found.push(el);
      // A phone gets ONE top bar. Two stacked is the squeeze itself: the desktop
      // nav kept and the phone nav added under it. Counting them separately says
      // WHICH rule was broken, where a single percentage only said "too much".
      if (r.top < innerHeight * 0.3) topBars++;
      chromeBars.push(sel(el) + ':' + Math.round(seen));
      // Collect the BAND each bar occupies rather than adding heights, and only when the
      // bar is actually PINNED to an edge. Two failures this fixes, both found 2026-09-21:
      //   · Sticky is not the same as stuck. The Sources appendix has .src-bar sticky, but
      //     at the scroll this check uses it is still in normal flow at y=561 of a 740px
      //     screen, in the middle of the page. It was counted as a top bar and put the page
      //     over budget at 129px when the reader only ever loses 64.
      //   · Heights were SUMMED, so two bars sharing a strip double-counted.
      // A bar earns the name by touching an edge: pinned near the top, or anchored near the
      // bottom the way the phone tab bar is. Anything floating mid-screen is content.
      const atTop = r.top <= innerHeight * 0.25;
      // Anchored TO the bottom, not merely low on the screen: .src-bar sits at 561-626 of
      // a 740px screen, which a "bottom quarter" test wrongly called a bottom bar.
      const atBottom = Math.min(r.bottom, innerHeight) >= innerHeight - 4;
      if (!atTop && !atBottom) continue;
      bands.push([Math.max(r.top, 0), Math.min(r.bottom, innerHeight)]);
    }
    window.scrollTo(0, y0);
  }
  bands.sort((a, b) => a[0] - b[0]);
  for (const [top, bot] of bands) {
    if (!merged.length || top > merged[merged.length - 1][1]) merged.push([top, bot]);
    else merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], bot);
  }
  chromeH = merged.reduce((sum, [top, bot]) => sum + Math.round(bot - top), 0);
  const chromePct = phone && innerHeight ? Math.round((chromeH / innerHeight) * 100) : 0;

  // STROKE FLOOR. A diagram's connectors are not decoration: the line between two boxes IS the
  // claim that one leads to the other, and WCAG asks 3:1 of any graphic that carries meaning. A
  // card's edge is different and is allowed to whisper, so this looks only inside an <svg> that is
  // big enough to be a figure. A stroke painted in the surface colour is a HALO, drawn to punch a
  // dot out of the line beneath it, and is meant to vanish; it is not counted.
  const faint = [];
  if (phone) {
    const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    const lum = (p) => 0.2126 * lin(p[0]) + 0.7152 * lin(p[1]) + 0.0722 * lin(p[2]);
    const parse = (c) => { const m = String(c).match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map(Number); return p.length > 3 && p[3] === 0 ? null : p; };
    const behind = (el) => { let n = el; while (n && n !== document.documentElement) { const p = parse(getComputedStyle(n).backgroundColor); if (p && (p.length < 4 || p[3] > 0.5)) return p; n = n.parentElement; } return [13, 17, 23]; };
    const ratio = (a, b) => { const A = lum(a), B = lum(b); return (Math.max(A, B) + 0.05) / (Math.min(A, B) + 0.05); };
    const seen = new Set();
    for (const svg of document.querySelectorAll('svg')) {
      const box = svg.getBoundingClientRect();
      if (box.width < 120 || box.height < 90) continue;          // an icon, not a figure
      if (svg.hasAttribute('data-drawing')) continue;            // a game drawing: its ink is the art (see drawnCount)
      const bg = behind(svg);
      for (const el of svg.querySelectorAll('line,path,polyline,rect,polygon,circle,ellipse')) {
        const cs = getComputedStyle(el);
        if (cs.stroke === 'none' || parseFloat(cs.strokeWidth) === 0) continue;
        if (cs.visibility === 'hidden' || cs.display === 'none') continue;
        const r = el.getBoundingClientRect();
        if (!r.width && !r.height) continue;
        const c = parse(cs.stroke); if (!c) continue;
        const k = ratio(c, bg);
        if (k >= 3 || k < 1.25) continue;                        // fine, or a halo
        const key = cs.stroke + '|' + cs.strokeWidth + '|' + (svg.getAttribute('class') || svg.getAttribute('viewBox') || '');
        if (seen.has(key)) continue;
        seen.add(key);
        faint.push(`${(svg.getAttribute('class') || svg.getAttribute('viewBox') || 'svg').slice(0, 28)}: ${cs.stroke} at ${Math.round(k * 10) / 10}:1`);
      }
    }
  }

  // INK FLOOR. Text inside a figure, measured against whatever is actually behind it: the page,
  // or the shape it sits on. A pill filled white with dark text is correct and must not be read as
  // a 1:1 failure, which is why this walks the svg for a filled shape whose box contains the text
  // before falling back to the page. WCAG's thresholds: 4.5:1, or 3:1 once the text is large.
  const dim = [];
  /* A layout fault is a fault at every size. This used to be phone-gated, so a tablet and a
     desktop were never checked for it at all: the report printed n/a and the page "passed".
     David, 2026-09-21: "I want every page to be able to look good on phone, and
     web/Tablet/Computer and when it has response size changes."
     Phone PHYSICS stay phone-only below: 44px touch targets, the type floor and the chrome
     budget are about a thumb and a small screen, and mean nothing on a desktop. */
  if (true) {                     /* every size */
    const lin2 = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    const lum2 = (p) => 0.2126 * lin2(p[0]) + 0.7152 * lin2(p[1]) + 0.0722 * lin2(p[2]);
    const parse2 = (c) => { const m = String(c).match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map(Number); return p.length > 3 && p[3] < 0.5 ? null : p; };
    const pageBg = (el) => { let n = el; while (n && n !== document.documentElement) { const p = parse2(getComputedStyle(n).backgroundColor); if (p) return p; n = n.parentElement; } return [13, 17, 23]; };
    const ratio2 = (a, b) => { const A = lum2(a), B = lum2(b); return (Math.max(A, B) + 0.05) / (Math.min(A, B) + 0.05); };
    const seen2 = new Set();
    // A scene the reader can magnify is exempt for its terrain, exactly as it is for the type
    // floor: pinch and zoom IS the phone answer there, David's ruling on the Atlas.
    for (const svg of document.querySelectorAll('svg')) {
      const box = svg.getBoundingClientRect();
      if (box.width < 120 || box.height < 90) continue;
      if (svg.hasAttribute('data-drawing')) continue;            // a game drawing: its label contrast is the art (see drawnCount)
      const page = pageBg(svg);
      // every filled shape in the drawing, so a label can be measured against the one it sits on
      const shapes = [];
      for (const sh of svg.querySelectorAll('rect,circle,ellipse,polygon,path')) {
        const cs = getComputedStyle(sh);
        const p = parse2(cs.fill);
        if (!p || cs.fill === 'none') continue;
        if (parseFloat(cs.fillOpacity) < 0.75) continue;      // a tint lets the page through
        shapes.push({ r: sh.getBoundingClientRect(), p });
      }
      for (const t of svg.querySelectorAll('text')) {
        const cs = getComputedStyle(t);
        if (cs.visibility === 'hidden' || cs.display === 'none') continue;
        const txt = (t.textContent || '').trim(); if (!txt) continue;
        // Walk from the TEXT, not the <svg>: the Atlas carries its pan and zoom on a <g> INSIDE
        // the drawing, so a check that starts at the svg never sees it. The type floor learned
        // this the same way and its note is above; reusing zoomScene keeps the two in step.
        if (zoomScene(t)) continue;
        const c = parse2(cs.fill); if (!c) continue;
        const r = t.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        let bg = page;
        for (const sh of shapes) {
          if (sh.r.left <= r.left + 1 && sh.r.right >= r.right - 1 && sh.r.top <= r.top + 1 && sh.r.bottom >= r.bottom - 1) bg = sh.p;
        }
        const m = t.getScreenCTM ? t.getScreenCTM() : null;
        const px = parseFloat(cs.fontSize) * (m ? Math.abs(m.a) : 1);
        const bold = parseInt(cs.fontWeight, 10) >= 700;
        const need = (px >= 24 || (bold && px >= 18.66)) ? 3 : 4.5;
        const k = ratio2(c, bg);
        // Contrast is one of THREE things that decide whether small light-on-dark type reads, and
        // it was the only one being measured. The other two are weight and tracking: a bright
        // glyph bleeds into a dark field and reads thinner than the same font on a white page, a
        // monospace face is thin to begin with, and letter-spacing pulls a word apart until it
        // stops having a shape. So small text inside a figure also owes a weight.
        const light = lum2(c) > lum2(bg);
        // Tracking is measured against the AUTHORED size, not the rendered one. Both letter-spacing
        // and font-size are in user units inside a viewBox and scale together, so dividing the
        // spacing by the rendered pixels invents tracking that is not there on a shrunk drawing.
        const track = (parseFloat(cs.letterSpacing) || 0) / (parseFloat(cs.fontSize) || 1);
        const weight = parseInt(cs.fontWeight, 10) || 400;
        if (k >= need && light && px <= 16 && weight < 500) {
          const key2 = 'w|' + cs.fontWeight + '|' + (svg.getAttribute('class') || '');
          if (!seen2.has(key2)) { seen2.add(key2); dim.push((svg.getAttribute('class') || 'svg').slice(0, 24) + ': ' + Math.round(px) + 'px at weight ' + weight + ' on a dark field, needs 500 ("' + txt.slice(0, 20) + '")'); }
          continue;
        }
        // Tracking: the site's own editorial label style sits at .133em and reads fine once it has the
        // weight above, so the limit is set just past it. Beyond .14em a small word stops having a
        // shape and reads as separate letters, which is what the section labels were doing.
        if (k >= need && light && px <= 16 && track > 0.14) {
          const key3 = 't|' + cs.letterSpacing + '|' + (svg.getAttribute('class') || '');
          if (!seen2.has(key3)) { seen2.add(key3); dim.push((svg.getAttribute('class') || 'svg').slice(0, 24) + ': tracking ' + (Math.round(track * 100) / 100) + 'em at ' + Math.round(px) + 'px, past the .14em limit ("' + txt.slice(0, 20) + '")'); }
          continue;
        }
        if (k >= need) continue;
        const key = cs.fill + '|' + (svg.getAttribute('class') || svg.getAttribute('viewBox') || '');
        if (seen2.has(key)) continue;
        seen2.add(key);
        dim.push(`${(svg.getAttribute('class') || svg.getAttribute('viewBox') || 'svg').slice(0, 24)}: ${cs.fill} at ${Math.round(k * 10) / 10}:1, needs ${need} ("${txt.slice(0, 22)}")`);
      }
    }
  }

  // A LABEL WIDER THAN THE BOX IT LABELS. The collide check above compares text to TEXT,
  // so a caption centred inside a rect and simply too wide for it was invisible: it hangs
  // out both sides, over whatever is drawn behind. That is how "one shared shelf", 140px
  // of caption inside a 72px shelf, shipped straight across the incoming arrows on David's
  // phone (2026-09-21). HTML overflow rules do not apply to SVG text, so the spill check
  // below cannot see it either.
  // A label is matched to a rect when their horizontal centres agree within 3px and the
  // text sits inside the box vertically, which is exactly what text-anchor:middle in a box
  // produces. It fails when the text is wider than the box that holds it.
  const burst = [];
  if (phone) {
    for (const svg of document.querySelectorAll('svg')) {
      const boxes = [...svg.querySelectorAll('rect')]
        .map((r) => ({ el: r, b: r.getBoundingClientRect() }))
        .filter((o) => o.b.width > 8 && o.b.height > 8);
      if (!boxes.length) continue;
      for (const t of svg.querySelectorAll('text')) {
        if (!(t.textContent || '').trim()) continue;
        if (zoomScene(t)) continue;
        const cs = getComputedStyle(t);
        if (cs.visibility === 'hidden' || cs.display === 'none' || cs.opacity === '0') continue;
        const tb = t.getBoundingClientRect();
        if (!tb.width || !tb.height) continue;
        const tcx = (tb.left + tb.right) / 2, tcy = (tb.top + tb.bottom) / 2;
        let host = null;
        for (const o of boxes) {
          const cx = (o.b.left + o.b.right) / 2;
          if (Math.abs(cx - tcx) > 3) continue;
          if (tcy < o.b.top - 1 || tcy > o.b.bottom + 1) continue;
          if (!host || o.b.width < host.b.width) host = o;
        }
        if (host && tb.width > host.b.width + 4) {
          burst.push([Math.round(tb.width - host.b.width), t.textContent.trim().slice(0, 26),
            Math.round(tb.width), Math.round(host.b.width)]);
        }
      }
    }
    burst.sort((a, b) => b[0] - a[0]);
  }

  // SPILL. An element whose CONTENT is taller or wider than its own box while its own
  // overflow is visible. The browser paints the excess OUTSIDE the box, over whatever sits
  // below it, with no background behind it, and the document neither scrolls nor clips, so
  // every other check on this page reads clean. That is exactly how the 4Ps section nav
  // shipped: a 64px high box holding 231px of links, three of them floating over the
  // article text on David's phone (2026-09-21). An ancestor that scrolls or clips CONTAINS
  // the overflow, so a carousel track or a pannable diagram is not a spill. A few px is a
  // descender on an italic, not a layout fault.
  // HIDDEN BUT SHOWN. An element carrying the `hidden` attribute that still renders. The
  // browser's own rule for [hidden] is display:none, and ANY author rule that sets display on
  // that element outranks it, so the script can set hidden=true all day and nothing disappears.
  // It has bitten this site twice: the hospital game's join row (a flex row showing before
  // anyone asked to join), and the cost of living tool's "Example numbers, edit anything to
  // make them yours" badge, which showed on every scenario including a visitor's own
  // (2026-09-22). The code looks right in both cases, which is exactly why a person misses it.
  // The fix is always the same one line: `.that-class[hidden] { display:none; }`.
  const unhidden = [];
  for (const el of document.querySelectorAll('[hidden]')) {
    if (el.closest('template')) continue;
    const hcs = getComputedStyle(el);
    if (hcs.display === 'none') continue;
    const hr = el.getBoundingClientRect();
    if (hr.width < 1 && hr.height < 1) continue;        // an ancestor already hides it
    unhidden.push([sel(el), hcs.display, (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40)]);
  }

  const spill = [];
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const sy = cs.overflowY === 'visible' ? el.scrollHeight - el.clientHeight : 0;
    const sx = cs.overflowX === 'visible' ? el.scrollWidth - el.clientWidth : 0;
    if (sy <= 8 && sx <= 8) continue;
    let out = null;
    for (const k of el.children) {
      const kr = k.getBoundingClientRect();
      if (kr.bottom > r.bottom + 4 || kr.right > r.right + 4) { out = k; break; }
    }
    if (!out) continue;
    let contained = false;
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
      const acs = getComputedStyle(a);
      if (acs.overflowX !== 'visible' || acs.overflowY !== 'visible') { contained = true; break; }
    }
    if (contained) continue;
    spill.push([sel(el), Math.round(r.width) + 'x' + Math.round(r.height), el.scrollWidth + 'x' + el.scrollHeight,
      sy > 8 ? sy : 0, sx > 8 ? sx : 0, sel(out), (out.textContent || '').trim().slice(0, 30)]);
  }

  // Shared by the two checks below, both added 2026-09-23 after the tool review found four
  // defects this gate had passed (docs/HU-TOOL-REVIEW-2026-09-23.md section 3).
  const CTRL = 'button, input:not([type="hidden"]), select, textarea, [role="button"], [role="tab"], [role="switch"], summary';
  const CS = new Map();
  const gcs = (e) => { let s = CS.get(e); if (!s) { s = getComputedStyle(e); CS.set(e, s); } return s; };
  // checkVisibility walks the ancestors for display, visibility AND opacity, which is what a
  // faded-out loading message needs; a bare opacity read on the element itself misses a parent.
  const onShow = (el) => (el.checkVisibility ? el.checkVisibility({ opacityProperty: true, visibilityProperty: true }) : gcs(el).display !== 'none');
  // The ancestors that actually CLIP an element. overflow on an ancestor below an absolute
  // element's containing block does not clip it, and nothing but a transformed ancestor clips a
  // fixed one, so walk the containing-block chain rather than every parent.
  const clippers = (el) => {
    const out = [];
    const es = gcs(el);
    let mode = es.position === 'fixed' ? 'fixed' : es.position === 'absolute' ? 'abs' : null;
    for (let p = el.parentElement; p && p !== document.documentElement; p = p.parentElement) {
      const s = gcs(p);
      const tf = s.transform !== 'none' || s.filter !== 'none' || s.perspective !== 'none';
      if (mode === 'fixed' && !tf) continue;
      if (mode === 'abs' && !tf && s.position === 'static') continue;
      if (s.overflowX !== 'visible' || s.overflowY !== 'visible') out.push(p);
      mode = s.position === 'fixed' ? 'fixed' : s.position === 'absolute' ? 'abs' : null;
    }
    return out;
  };
  const clipBox = (el, r) => {
    let L = r.left, T = r.top, R = r.right, B = r.bottom;
    for (const a of clippers(el)) {
      const ar = a.getBoundingClientRect();
      L = Math.max(L, ar.left + a.clientLeft); T = Math.max(T, ar.top + a.clientTop);
      R = Math.min(R, ar.left + a.clientLeft + a.clientWidth); B = Math.min(B, ar.top + a.clientTop + a.clientHeight);
    }
    return { left: L, top: T, right: R, bottom: B };
  };
  // a transform between an element and its clipper means a pan scene or a carousel track is
  // being driven (the same test the CLIPPED check uses), so what is out of the frame is a pan away
  const driven = (el, stop) => {
    for (let p = el; p && p !== stop && p !== document.documentElement; p = p.parentElement) {
      if (p.hasAttribute && p.hasAttribute('data-zoom-scene')) return true;
      const m = gcs(p).transform;
      if (m && m !== 'none') {
        const n = m.match(/matrix\(([^)]+)\)/);
        if (n) { const v = n[1].split(',').map(Number); if (Math.abs(v[0] - 1) > 0.01 || Math.abs(v[3] - 1) > 0.01 || Math.abs(v[4]) > 20) return true; }
      }
    }
    return false;
  };

  // FLOATING OVER A CONTROL. A positioned message, badge or caption whose text sits on a
  // button or an input. Nothing else here looks for it: SPILL wants overflow and the collision
  // check only compares SVG text to SVG text. The tool review found three (2026-09-23): the
  // population map's loading message over its metric card, the operations map's over its draw
  // button, and a faint "System Layers 8 Deep" caption painted across System Layers' pin and
  // reset buttons. Measured against the control's CONTENT box, so a "$" parked in an input's
  // own padding, which is the point of that padding, is not a collision. A badge inside a
  // control belongs to it, and an open modal is meant to cover what is behind it.
  const floats = [];
  {
    const ctrls = [];
    for (const c of document.querySelectorAll(CTRL)) {
      const r = c.getBoundingClientRect();
      if (r.width < 8 || r.height < 8 || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > vw) continue;
      if (!onShow(c)) continue;
      // a control that is part of a pinch-zoom scene is terrain: a hint over a pannable
      // building or map is over ground the reader moves anyway (the same scene exemption the
      // type floor has, and for the same reason)
      if (zoomScene(c)) continue;
      const s = gcs(c);
      const b = { left: r.left + parseFloat(s.borderLeftWidth) + parseFloat(s.paddingLeft), top: r.top + parseFloat(s.borderTopWidth) + parseFloat(s.paddingTop),
        right: r.right - parseFloat(s.borderRightWidth) - parseFloat(s.paddingRight), bottom: r.bottom - parseFloat(s.borderBottomWidth) - parseFloat(s.paddingBottom) };
      ctrls.push({ c, b: (b.right - b.left > 4 && b.bottom - b.top > 4) ? b : r });
    }
    const paints = (s) => {
      const bg = String(s.backgroundColor).match(/rgba?\(([^)]+)\)/);
      const a = bg ? bg[1].split(',').map(Number) : null;
      return (a && (a.length < 4 || a[3] > 0.1)) || s.backgroundImage !== 'none';
    };
    const seenKey = new Set();
    for (const el of document.querySelectorAll('body *')) {
      if (/** @type {SVGElement} */ (el).ownerSVGElement || el.tagName.toLowerCase() === 'svg') continue;
      const s = gcs(el);
      if (s.position !== 'absolute' && s.position !== 'fixed') continue;
      if (el.matches(CTRL) || el.closest(CTRL) || el.querySelector(CTRL + ', a[href]')) continue;
      if (el.closest('[aria-modal="true"], dialog[open]')) continue;
      const text = (/** @type {HTMLElement} */ (el).innerText || '').trim().replace(/\s+/g, ' ');
      if (text.length < 2 || !onShow(el)) continue;
      // a visually-hidden live region (1px, clipped) is read aloud, never seen
      const own = el.getBoundingClientRect();
      if (own.width <= 2 || own.height <= 2 || s.clip !== 'auto' || s.clipPath !== 'none') continue;
      let boxes;
      if (paints(s)) boxes = [own];
      else {
        // only the text this element positions itself: text inside a nested absolute or fixed
        // child is that child's, and it gets its own turn (a frame holding two captions was
        // reported three times)
        boxes = [];
        const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        for (let t = tw.nextNode(); t; t = tw.nextNode()) {
          if (!t.textContent.trim()) continue;
          let owner = t.parentElement;
          while (owner && owner !== el && !/^(absolute|fixed)$/.test(gcs(owner).position)) owner = owner.parentElement;
          if (owner !== el) continue;
          const rg = document.createRange(); rg.selectNodeContents(t);
          for (const r of rg.getClientRects()) if (r.width > 1 && r.height > 1) boxes.push(r);
        }
        // text past the element's own clipping edge is not painted either
        if (s.overflowX !== 'visible' || s.overflowY !== 'visible') boxes = boxes.map((r) => ({ left: Math.max(r.left, own.left), top: Math.max(r.top, own.top), right: Math.min(r.right, own.right), bottom: Math.min(r.bottom, own.bottom) }));
      }
      boxes = boxes.map((r) => clipBox(el, r)).filter((r) => r.right - r.left > 1 && r.bottom - r.top > 1);
      for (const { c, b } of ctrls) {
        if (el.contains(c) || c.contains(el)) continue;
        let hit = 0;
        for (const r of boxes) {
          const ox = Math.min(r.right, b.right) - Math.max(r.left, b.left);
          const oy = Math.min(r.bottom, b.bottom) - Math.max(r.top, b.top);
          if (ox > 3 && oy > 3) { hit = Math.round(Math.min(ox, oy)); break; }
        }
        if (!hit) continue;
        const who = (c.getAttribute('aria-label') || c.innerText || c.value || c.placeholder || '').trim().replace(/\s+/g, ' ').slice(0, 30);
        const key = who + '|' + text.slice(0, 30);
        if (seenKey.has(key)) continue;
        seenKey.add(key);
        floats.push([hit, sel(el), text.slice(0, 40), sel(c), who]);
      }
    }
    floats.sort((a, b) => b[0] - a[0]);
  }

  // CUT BY ITS CONTAINER. The CLIPPED check only knows about the SCREEN's edge. A row wider than
  // a box with overflow hidden is cut at that box's edge instead, anywhere on the page, and reads
  // clean to every other check. The tool review found the Career Tree's stats row (413px of
  // "Roles held ... Goals" in a 390px box, cut at both ends) and the population map's metric
  // name cut to "Pati..." on a desktop (2026-09-23). Three forms, all measured, all failing:
  //   a row or label past the edge of the box that clips it (text or a control, partly on show);
  //   text ellipsized to less than half of itself (a card title that loses its last word is a
  //     choice; a picker that shows four letters of the thing it picks is not);
  //   a placeholder wider than its input, which the browser cuts mid-word with no ellipsis.
  // A scroller is not a cut, the rest is a swipe away. Neither is a driven pan scene.
  const cut = [];
  {
    const seen = new Set();
    for (const el of document.querySelectorAll('body *')) {
      if (/** @type {SVGElement} */ (el).ownerSVGElement || el.tagName.toLowerCase() === 'svg') continue;
      const isCtl = el.matches(CTRL);
      const tn = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim());
      if (!tn.length && !isCtl) continue;
      const er = el.getBoundingClientRect();
      if (er.width < 2 || er.height < 2 || er.bottom < 0 || er.top > innerHeight) continue;
      if (!onShow(el)) continue;
      const s = gcs(el);
      const text = (tn.length ? tn.map((n) => n.textContent.trim()).join(' ') : (el.getAttribute('aria-label') || /** @type {HTMLElement} */ (el).innerText || '')).replace(/\s+/g, ' ').trim();
      if (tn.length && s.textOverflow === 'ellipsis' && s.overflowX !== 'visible' && el.scrollWidth > el.clientWidth + 1) {
        // Only text that NAMES a control is judged: a one-line teaser in a list of links is a
        // layout that chose the ellipsis (the home page's recent rows), a picker is not.
        const shown = el.clientWidth / el.scrollWidth;
        if (shown < 0.5 && el.closest(CTRL + ', label') && !seen.has(el)) { seen.add(el); cut.push([Math.round(el.scrollWidth - el.clientWidth), sel(el), text.slice(0, 40), 'ellipsis, ' + Math.round(shown * 100) + '% of it on show']); }
        continue;
      }
      let box = er;
      if (tn.length) { const rg = document.createRange(); rg.setStartBefore(tn[0]); rg.setEndAfter(tn[tn.length - 1]); box = rg.getBoundingClientRect(); }
      if (box.width < 2 || box.height < 2) continue;
      for (const a of clippers(el)) {
        if (a === document.body) break;
        const as = gcs(a);
        if (as.overflowX === 'auto' || as.overflowX === 'scroll') {
          // A scroller reaches everything past its END edge and nothing before its START:
          // scrollLeft cannot go negative. A centred row wider than its scroller overhangs
          // both ends and its first few px are simply gone (the Career Tree's counts, and the
          // hospital legend's flex-end rail before it). Measured at scrollLeft 0.
          const ar2 = a.getBoundingClientRect();
          const L2 = ar2.left + a.clientLeft;
          const before = L2 - (box.left + a.scrollLeft);
          if (before > 3 && box.right > L2 + 2 && !driven(el, a) && box.bottom > ar2.top && box.top < ar2.bottom) {
            const k = sel(a) + '|' + text.slice(0, 20);
            if (!seen.has(k)) { seen.add(k); cut.push([Math.round(before), sel(el), text.slice(0, 40), 'before the start of ' + sel(a) + ', where no swipe reaches']); }
          }
          break;
        }
        if (as.overflowX === 'visible') continue;
        const ar = a.getBoundingClientRect();
        if (ar.width < 4 || ar.height < 4) break;                       // a visually-hidden utility
        if (driven(el, a)) break;
        const L = ar.left + a.clientLeft, R = L + a.clientWidth;
        const T = ar.top + a.clientTop, B = T + a.clientHeight;
        if (box.bottom <= T + 1 || box.top >= B - 1) break;              // clipped away vertically: folded, not cut
        if (box.right <= L + 2 || box.left >= R - 2) break;              // parked entirely outside
        const past = Math.max(0, L - box.left) + Math.max(0, box.right - R);
        if (past > 3) {                                                  // a few px is a glyph's side bearing, not a cut
          const k = sel(a) + '|' + text.slice(0, 20);
          if (!seen.has(k)) { seen.add(k); cut.push([Math.round(past), sel(el), text.slice(0, 40), 'past the edge of ' + sel(a)]); }
        }
        break;
      }
    }
    const cv = document.createElement('canvas').getContext('2d');
    for (const inp of /** @type {NodeListOf<HTMLInputElement>} */ (document.querySelectorAll('input[placeholder]'))) {
      if (inp.value || !inp.placeholder || !onShow(inp)) continue;
      const r = inp.getBoundingClientRect();
      if (r.width < 8 || r.bottom < 0 || r.top > innerHeight) continue;
      const ps = getComputedStyle(inp, '::placeholder');
      const is = gcs(inp);
      cv.font = [ps.fontStyle, ps.fontWeight, ps.fontSize, ps.fontFamily].join(' ');
      const need = cv.measureText(inp.placeholder).width + (parseFloat(ps.letterSpacing) || 0) * inp.placeholder.length;
      const room = inp.clientWidth - parseFloat(is.paddingLeft) - parseFloat(is.paddingRight);
      if (need > room + 2) cut.push([Math.round(need - room), sel(inp), inp.placeholder.slice(0, 40), 'placeholder, ' + Math.round(need) + 'px in ' + Math.round(room) + 'px']);
    }
    cut.sort((a, b) => b[0] - a[0]);
  }

  const vh = [];
  for (const sheet of document.styleSheets) {
    let rules; try { rules = sheet.cssRules; } catch { continue; }
    const walk = (list) => { for (const r of list) { if (r.cssRules) walk(r.cssRules); else if (r.cssText && /\b100vh\b/.test(r.cssText) && !/100dvh/.test(r.cssText)) vh.push(r.selectorText || r.cssText.slice(0, 60)); } };
    walk(rules);
  }
  return { overflow, scrollWidth: document.documentElement.scrollWidth, vw, culprits: culprits.slice(0, 6), small: small.slice(0, 12), smallCount: small.length, clipped: clipped.slice(0, 8), clippedCount: clipped.length, vh: [...new Set(vh)].slice(0, 8),
    tiny: tiny.slice(0, 8), tinyCount: tiny.length, softCount, drawnCount, chromeBars, chromeH, chromePct, topBars, collide: collide.slice(0, 6), collideCount: collide.length, vhPx: innerHeight,
    faint: faint.slice(0, 8), faintCount: faint.length, dim: dim.slice(0, 8), dimCount: dim.length,
    spill: spill.slice(0, 8), spillCount: spill.length,
    unhidden: unhidden.slice(0, 8), unhiddenCount: unhidden.length,
    burst: burst.slice(0, 8), burstCount: burst.length,
    floats: floats.slice(0, 8), floatsCount: floats.length,
    cut: cut.slice(0, 8), cutCount: cut.length };
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const local = base ? null : await serveSite();
  const origin = base || local.url;
  const browser = await chromium.launch();
  // READ THE WHOLE PAGE, NOT THE TOP OF IT. David, 2026-09-21: "When we test a page for web
  // stuff we need to scroll down the whole page not just part of it." Every check below used
  // to run exactly once, at scroll position 0, so anything that only goes wrong further down
  // (a card that collides once it is under the sticky header, a row revealed on scroll, a bar
  // that changes height as the nav yields) was invisible to this gate by construction.
  // The page is now walked in viewport-sized steps and the findings are merged.
  //
  // Counts merge as a MAX rather than a sum: the same offender seen at two scroll positions
  // must not count twice, and for the only thing that matters here, whether the page passes,
  // max is exact (if any position saw one, the page has one).
  const LISTS = ['culprits', 'small', 'clipped', 'tiny', 'collide', 'faint', 'dim', 'spill', 'burst', 'unhidden', 'floats', 'cut'];
  const mergeFindings = (a, b) => {
    if (!a) return b;
    const out = Object.assign({}, a);
    out.overflow = a.overflow || b.overflow;
    out.scrollWidth = Math.max(a.scrollWidth || 0, b.scrollWidth || 0);
    out.chromeH = Math.max(a.chromeH || 0, b.chromeH || 0);
    out.chromePct = Math.max(a.chromePct || 0, b.chromePct || 0);
    out.topBars = Math.max(a.topBars || 0, b.topBars || 0);
    out.softCount = Math.max(a.softCount || 0, b.softCount || 0);
    out.drawnCount = Math.max(a.drawnCount || 0, b.drawnCount || 0);
    for (const k of LISTS) {
      const seen = new Set();
      const rows = [];
      for (const row of [...(a[k] || []), ...(b[k] || [])]) {
        const key = JSON.stringify(row);
        if (seen.has(key)) continue;
        seen.add(key);
        rows.push(row);
      }
      out[k] = rows.slice(0, 12);
      const c = k + 'Count';
      out[c] = Math.max(a[c] || 0, b[c] || 0);
    }
    out.vh = [...new Set([...(a.vh || []), ...(b.vh || [])])].slice(0, 8);
    return out;
  };

  const readWholePage = async (page, arg, fallback) => {
    const geom = await page.evaluate(() => ({ vh: window.innerHeight, doc: document.documentElement.scrollHeight }))
      .catch(() => ({ vh: 800, doc: 800 }));
    const steps = Math.max(1, Math.min(12, Math.ceil(geom.doc / Math.max(1, geom.vh))));
    let merged = null;
    for (let i = 0; i < steps; i++) {
      if (i) {
        await page.evaluate((y) => window.scrollTo(0, y), i * geom.vh).catch(() => {});
        await page.waitForTimeout(280);   // sticky transitions and any reveal-on-scroll settle
      }
      const r = await page.evaluate(inspect, arg).catch((e) => Object.assign({}, fallback, { evalError: e.message }));
      merged = mergeFindings(merged, r);
    }
    await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
    await page.waitForTimeout(150);
    return { r: merged, steps };
  };

  let failed = false;
  for (const p of paths) {
    const slug = p.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home';
    console.log('\n== ' + p);
    for (const { w, h } of viewports) {
      // The SHORTER side decides. A phone on its side is 740x360: still a phone, still
      // touch, still the phone floors, even though its width is over the 699 line.
      const phone = Math.min(w, h) <= 699;
      const label = w + 'x' + h;
      // colorScheme pinned 2026-09-24: pages now follow the device's light or dark setting on a first visit, and
      // Playwright's device says light unless told. The gate has always measured the dark side; the light side
      // was swept whole by the 2026-09-23 theme pass (tmp/theme-scan/scan.js).
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: phone, hasTouch: phone, colorScheme: 'dark' });
      const page = await ctx.newPage();
      // The goat tracker polls the LIVE GoatCounter API. Read nine times over, the real service
      // answered 429 and the page timed out on two viewports, so the gate failed on someone
      // else's rate limit. The harness now refuses those calls: the page is measured on its own
      // layout, and the refusal is an off-origin failure the checks below already excuse.
      // Closes the KNOWN REMAINING GAP noted further down. (2026-09-23)
      await page.route(/goatcounter\.com\/api\//, (route) => route.abort());
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
      // A call to a THIRD-PARTY origin that the real site is allowed to make and this
      // harness is not. The goat tracker reads the live GoatCounter API, which allows
      // the production origin and blocks http://127.0.0.1:<port>, so the gate saw a CORS
      // failure and called a working page broken. Same class as the serverless 404 above:
      // counted and named, never failed on. Only off-origin requests qualify, so a
      // genuinely broken same-origin asset still fails. (2026-09-21)
      const offOrigin = [];
      const noteOffOrigin = (url) => { if (url && !url.startsWith(origin) && !url.startsWith('data:')) offOrigin.push(url.split('?')[0]); };
      // Both signals, because only one fires depending on how the call dies. A blocked
      // cross-origin fetch surfaces as requestfailed in some runs and as a 4xx response in
      // others: the goat tracker was excused upright and failed on its side for exactly that
      // reason, on an identical page. (2026-09-21)
      page.on('requestfailed', (req) => noteOffOrigin(req.url()));
      page.on('response', (res) => { if (res.status() >= 400) noteOffOrigin(res.url()); });
      try {
        await page.goto(origin + p, { waitUntil: 'networkidle', timeout: 30000 });
      } catch (e) { errors.push('navigation: ' + e.message.split('\n')[0]); }
      await page.waitForTimeout(600);
      const EMPTY = { overflow: false, unhidden: [], unhiddenCount: 0, culprits: [], small: [], smallCount: 0, clipped: [], clippedCount: 0, vh: [], tiny: [], tinyCount: 0, softCount: 0, chromeBars: [], chromeH: 0, chromePct: 0, topBars: 0, collide: [], collideCount: 0, spill: [], spillCount: 0, burst: [], burstCount: 0, floats: [], floatsCount: 0, cut: [], cutCount: 0 };
      const { r, steps } = await readWholePage(page, { phone, deviceWidth: w }, EMPTY);
      const shot = path.join(OUT, slug + '-' + label + '.png');
      await page.screenshot({ path: shot }).catch(() => {});
      // A generic "Failed to load resource" console line is the echo of a 4xx we
      // already classified. Discount one per serverless 404 so the gate does not
      // fail on something it cannot serve.
      // Count what the page got WRONG, not what this harness could not reach. The arithmetic
      // here used to subtract counts from counts, which drifted once a page retried a blocked
      // call while being read the whole way down: the goat tracker polls its analytics API on
      // every screen, so the error lines outgrew the excused ones and one leaked through as a
      // real failure. Classify each line instead, so repeats cost nothing. (2026-09-21)
      // CLOSED 2026-09-23, was a known gap from 2026-09-21: reading a page the whole way down
      // re-triggered the goat tracker's live GoatCounter polling until the real service
      // answered 429. The harness now refuses those calls where each page is opened.
      const cantReach = serverless.length > 0 || offOrigin.length > 0;
      const excusable = (e) =>
        (cantReach && /Failed to load resource|ERR_FAILED|ERR_CONNECTION|net::/i.test(e)) ||
        (offOrigin.length > 0 && /Access to fetch at|blocked by CORS|Cross-Origin/i.test(e));
      const realErrors = errors.filter((e) => !excusable(e)).length;
      // The type floor and the chrome budget are Tier 1 physics (DESIGN.md, "The
      // Two Surfaces"), so they fail the gate rather than warning. softCount, the
      // band between the absolute and the functional floor, only reports: it is
      // the migration backlog, not a defect.
      const overBudget = phone && (r.chromePct > 20 || r.topBars > 1);
      const bad = realErrors > 0 || r.overflow || r.collideCount > 0 || r.spillCount > 0 || r.unhiddenCount > 0 || r.burstCount > 0 || r.floatsCount > 0 || r.cutCount > 0 || (phone && r.tinyCount > 0) || (phone && r.faintCount > 0) || (phone && r.dimCount > 0) || overBudget;
      if (bad) failed = true;
      console.log(`  ${label.padStart(8)}  ${bad ? 'FAIL' : 'ok  '}  read: ${steps} screen${steps === 1 ? '' : 's'}  console errors: ${realErrors}  overflow: ${r.overflow ? r.scrollWidth + ' > ' + r.vw : 'none'}  clipped: ${r.clippedCount}  sub-44px targets: ${phone ? r.smallCount : 'n/a'}  under type floor: ${phone ? r.tinyCount : 'n/a'}  colliding labels: ${r.collideCount}  spilling boxes: ${r.spillCount}  hidden but shown: ${r.unhiddenCount}  labels past their box: ${r.burstCount}  floating over a control: ${r.floatsCount}  cut by its container: ${r.cutCount}  faint lines: ${phone ? r.faintCount : 'n/a'}  dim labels: ${phone ? r.dimCount : 'n/a'}  chrome: ${phone ? r.chromeH + 'px/' + r.chromePct + '%' : 'n/a'}  100vh rules: ${r.vh.length}  shot: ${path.relative(ROOT, shot)}`);
      for (const s of [...new Set(serverless)]) console.log('         (not a defect) serverless route absent from the static harness: ' + s);
      for (const u of [...new Set(offOrigin)]) console.log('         (not a defect) third-party origin the harness may not call: ' + u);
      for (const e of errors.slice(0, 5)) console.log('         error: ' + e.slice(0, 160));
      for (const [px, s] of r.culprits) console.log('         overflows by ' + px + 'px: ' + s);
      for (const [px, s, txt] of (r.clipped || [])) console.log('         CLIPPED ' + px + 'px past the edge: ' + s + (txt ? ' "' + txt + '"' : ''));
      for (const [over, txt, tw, bw] of (r.burst || [])) console.log('         LABEL PAST ITS BOX by ' + over + 'px: "' + txt + '" is ' + tw + 'px in a ' + bw + 'px box');
      for (const [px, who, txt, ctl, name] of (r.floats || [])) console.log('         FLOATING OVER A CONTROL by ' + px + 'px: ' + who + ' "' + txt + '" sits on ' + ctl + (name ? ' "' + name + '"' : ''));
      for (const [px, who, txt, how] of (r.cut || [])) console.log('         CUT BY ITS CONTAINER by ' + px + 'px: ' + who + (txt ? ' "' + txt + '"' : '') + ' (' + how + ')');
      for (const [who, disp, txt] of (r.unhidden || [])) console.log('         HIDDEN BUT SHOWN ' + who + ' renders as display:' + disp + (txt ? ' "' + txt + '"' : '') + '  (fix: that selector plus [hidden] { display:none })');
      for (const [who, box, content, sy, sx, kid, txt] of (r.spill || [])) console.log('         SPILL ' + who + ' box ' + box + ' holds ' + content + (sy ? ', ' + sy + 'px below' : '') + (sx ? ', ' + sx + 'px right' : '') + ' -> ' + kid + (txt ? ' "' + txt + '"' : ''));
      for (const [s, size, txt] of r.small.slice(0, 6)) console.log('         small: ' + s + ' ' + size + (txt ? ' "' + txt + '"' : ''));
      for (const [px, s, txt] of (r.tiny || [])) console.log('         UNDER THE TYPE FLOOR at ' + px + 'px: ' + s + (txt ? ' "' + txt + '"' : ''));
      for (const [pct, a, b] of (r.collide || [])) console.log('         LABELS COLLIDE, ' + pct + '% overlap: "' + a + '"  x  "' + b + '"');
      if (phone && r.softCount) console.log('         (backlog, not a fail) ' + r.softCount + ' element(s) between the absolute and the functional floor');
      if (phone && r.drawnCount) console.log('         (game drawing, exempt) ' + r.drawnCount + ' label(s) printed on an svg marked data-drawing; its line and label contrast are not measured either');
      for (const t of (r.dim || [])) console.log('         LABEL UNDER THE INK FLOOR, ' + t);
      for (const t of (r.faint || [])) console.log('         LINE UNDER THE STROKE FLOOR, ' + t + ' (a connector carries meaning; 3:1 is the floor)');
      if (overBudget) console.log('         CHROME OVER BUDGET: ' + r.chromeH + 'px of ' + r.vhPx + ' is ' + r.chromePct + '%'
        + (r.topBars > 1 ? ', and ' + r.topBars + ' TOP BARS are stacked (a phone gets one)' : ', ceiling is 20%')
        + '  [' + r.chromeBars.join(' ') + ']');
      for (const s of r.vh) console.log('         100vh without dvh: ' + s);
      if (r.evalError) console.log('         inspect failed: ' + r.evalError);
      await ctx.close();
    }

    // THE SLOW-DATA PASS, 2026-09-23. Every read above waits for the network to go quiet, so a
    // page is only ever measured AFTER its data has arrived, on a fast local server. A real
    // phone on a cell connection spends seconds in between, and two defects lived there: the
    // Career Tree threw a script error when its data came late (a resize before the data ran a
    // drawing step with nothing to draw; a phone fires that resize as its browser bar settles),
    // and both U.S. maps parked a loading message on top of a control. Neither was visible to a
    // gate that only looks once the page is ready. So each page loads once more on a phone with
    // every same-origin data file held back two seconds, the browser bar is jiggled while the
    // data is held, and the page is read while it is still loading. It fails on a script error
    // at any point, or on anything floating over a control while the page waits.
    if (!NO_SLOW) {
      const [sw, sh] = [360, 740];
      const ctx = await browser.newContext({ viewport: { width: sw, height: sh }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'dark' });
      const page = await ctx.newPage();
      await page.route(/goatcounter\.com\/api\//, (route) => route.abort());
      const errors = [], serverless = [], offOrigin = [], held = [];
      const here = new URL(origin).origin;
      await page.route((u) => u.origin === here && DATA_FILE.test(u.pathname), async (route) => {
        held.push(new URL(route.request().url()).pathname);
        await new Promise((res) => setTimeout(res, SLOW_MS));
        await route.continue().catch(() => {});
      });
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
      page.on('response', (res) => {
        if (res.status() >= 400 && /\/\.netlify\/functions\//.test(res.url())) serverless.push(res.status() + ' ' + res.url());
        if (res.status() >= 400 && !res.url().startsWith(origin)) offOrigin.push(res.url());
      });
      page.on('requestfailed', (req) => { if (!req.url().startsWith(origin) && !req.url().startsWith('data:')) offOrigin.push(req.url()); });
      try { await page.goto(origin + p, { waitUntil: 'domcontentloaded', timeout: 30000 }); }
      catch (e) { errors.push('navigation: ' + e.message.split('\n')[0]); }
      await page.waitForTimeout(600);
      // the browser bar settling: a phone resizes the viewport in the first second or two
      await page.setViewportSize({ width: sw, height: sh - 56 }).catch(() => {});
      await page.waitForTimeout(120);
      await page.setViewportSize({ width: sw, height: sh }).catch(() => {});
      await page.waitForTimeout(500);
      /** @type {any} */
      const early = held.length
        ? await page.evaluate(inspect, { phone: true, deviceWidth: sw }).catch((e) => ({ floats: [], floatsCount: 0, evalError: e.message }))
        : { floats: [], floatsCount: 0 };
      if (held.length) {
        await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
        await page.waitForTimeout(600);
      }
      const cantReach = serverless.length > 0 || offOrigin.length > 0;
      const realErrors = errors.filter((e) => !((cantReach && /Failed to load resource|ERR_FAILED|ERR_CONNECTION|net::/i.test(e))
        || (offOrigin.length > 0 && /Access to fetch at|blocked by CORS|Cross-Origin/i.test(e))));
      const bad = realErrors.length > 0 || early.floatsCount > 0;
      if (bad) failed = true;
      console.log(`  ${'slow-data'.padStart(9)} ${bad ? 'FAIL' : 'ok  '}  ${sw}x${sh}, ${held.length} data file${held.length === 1 ? '' : 's'} held ${SLOW_MS / 1000}s  console errors: ${realErrors.length}  floating over a control while loading: ${early.floatsCount}`);
      for (const e of realErrors.slice(0, 5)) console.log('         error: ' + e.slice(0, 160));
      for (const [px, who, txt, ctl, name] of (early.floats || [])) console.log('         FLOATING OVER A CONTROL WHILE LOADING by ' + px + 'px: ' + who + ' "' + txt + '" sits on ' + ctl + (name ? ' "' + name + '"' : ''));
      if (early.evalError) console.log('         inspect failed: ' + early.evalError);
      await ctx.close();
    }
  }
  await browser.close();
  if (local) local.srv.close();
  console.log('\n' + (failed ? 'FAILED: see console errors, overflow, type floor or chrome budget above.' : 'CLEAN: no console errors, no overflow, no text under the type floor, chrome inside budget.') + ' Screenshots in ' + path.relative(ROOT, OUT) + '/');
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
