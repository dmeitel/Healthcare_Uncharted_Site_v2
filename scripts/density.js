#!/usr/bin/env node
'use strict';
/**
 * density.js — how much a page asks of someone in the first screen.
 *
 *   node scripts/density.js /tools/cost-of-living/
 *   node scripts/density.js /tools/cost-of-living/ /tools/career-tree/   (compare)
 *
 * WHY. Every other check in this repo asks "is it broken". Nothing asks "is it a lot". The games
 * design phase opened on exactly that complaint ("the screens feel crowded with text and extra
 * information") and the thing that made it actionable was counting the words actually on screen
 * at first paint: 364 on the assembly wall, 216 on the hospital start menu, 155 on the RN floor.
 * A number does not tell you a screen is bad. It tells you whether a change made it lighter, and
 * it turns "feels crowded" into something two people can disagree about precisely.
 *
 * WHAT IT COUNTS, above the fold only, because that is the part that decides whether someone
 * stays: words of visible text, interactive controls, how many of those controls a person must
 * touch before the page tells them anything, and how much of the screen is chrome rather than
 * content.
 *
 * It is a TIER 2 measure, not a gate. There is no correct word count. There is only lighter
 * and heavier than last time.
 */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const SITE = path.join(__dirname, '..', '_site');
const PORT = 8131;
const MIME = { '.html':'text/html;charset=utf-8', '.css':'text/css', '.js':'text/javascript',
  '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg',
  '.webp':'image/webp', '.woff2':'font/woff2', '.ico':'image/x-icon', '.wasm':'application/wasm' };

const paths = process.argv.slice(2).filter((a) => a.startsWith('/'));
if (!paths.length) { console.error('usage: density.js /some/path/ [/another/]'); process.exit(2); }

const server = http.createServer((rq, rs) => {
  let u = rq.url.split('?')[0];
  if (u.endsWith('/')) u += 'index.html';
  const f = path.join(SITE, decodeURIComponent(u));
  fs.readFile(f, (e, d) => {
    if (e) { rs.writeHead(404); return rs.end(); }
    rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
    rs.end(d);
  });
});

const PROBE = () => {
  /* checkVisibility, not just a rect. Content inside a CLOSED <details> is
     content-visibility:hidden: Chromium skips painting it but KEEPS its layout box, so
     getBoundingClientRect returns a real rectangle for something nobody can see. Measuring by
     rect alone counted eleven hidden inputs as visible and nearly reported a working fix as a
     failure. 2026-09-22. */
  const vis = (e) => {
    const cs = getComputedStyle(e);
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.1) return false;
    if (typeof e.checkVisibility === 'function' &&
        !e.checkVisibility({ contentVisibilityAuto: true, opacityProperty: true, visibilityProperty: true })) return false;
    for (let p = e.parentElement; p; p = p.parentElement) {
      if (p.tagName === 'DETAILS' && !p.open && !e.closest('summary')) return false;
    }
    const r = e.getBoundingClientRect();
    return r.width > 1 && r.height > 1 && r.top < innerHeight && r.bottom > 0;
  };

  /* words of real text above the fold, counted once each: walk text nodes, skip anything
     inside a script/style, and skip a node whose parent is hidden */
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let words = 0, chars = 0;
  const seen = new Set();
  let n;
  while ((n = walker.nextNode())) {
    const p = n.parentElement;
    if (!p || /^(script|style|noscript|title)$/i.test(p.tagName)) continue;
    if (seen.has(p)) continue;
    if (!vis(p)) continue;
    const r = p.getBoundingClientRect();
    if (r.top >= innerHeight) continue;             // below the fold
    const t = (n.textContent || '').trim();
    if (!t) continue;
    seen.add(p);
    words += t.split(/\s+/).length;
    chars += t.length;
  }

  const CONTROL = 'button, a[href], input, select, textarea, [role="button"], [role="tab"], [tabindex]:not([tabindex="-1"])';
  const controls = [...document.querySelectorAll(CONTROL)].filter((e) => {
    if (!vis(e)) return false;
    return e.getBoundingClientRect().top < innerHeight;
  });

  /* chrome: fixed or sticky bands, which is screen a reader never gets back */
  let chromeH = 0;
  const bands = [];
  for (const e of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(e);
    if (cs.position !== 'fixed' && cs.position !== 'sticky') continue;
    if (!vis(e)) continue;
    const r = e.getBoundingClientRect();
    if (r.width < innerWidth * 0.5 || r.height < 8 || r.height > innerHeight * 0.6) continue;
    bands.push([Math.round(r.top), Math.round(r.bottom)]);
  }
  bands.sort((a, b) => a[0] - b[0]);
  let end = -1;
  for (const [a, b] of bands) { const s = Math.max(a, end); if (b > s) { chromeH += b - s; end = b; } }

  /* the site's own furniture does not count against the TOOL, so report both */
  const nav = document.querySelector('nav[aria-label="Primary"]');
  const navH = nav && vis(nav) ? Math.round(nav.getBoundingClientRect().height) : 0;

  return {
    words, chars,
    controls: controls.length,
    inputs: controls.filter((e) => /^(input|select|textarea)$/i.test(e.tagName)).length,
    chromeH, navH,
    chromePct: Math.round((chromeH / innerHeight) * 100),
    pageHeight: Math.round(document.documentElement.scrollHeight),
    screens: +(document.documentElement.scrollHeight / innerHeight).toFixed(1),
  };
};

(async () => {
  await new Promise((r) => server.listen(PORT, () => r(undefined)));
  const browser = await chromium.launch();
  const rows = [];
  for (const p of paths) {
    for (const [w, h] of [[390, 844], [1440, 900]]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w <= 699, hasTouch: w <= 699, colorScheme: 'dark' });
      const page = await ctx.newPage();
      try {
        await page.goto('http://localhost:' + PORT + p, { waitUntil: 'load', timeout: 25000 });
        await page.waitForTimeout(1800);
        rows.push({ path: p, w, ...(await page.evaluate(PROBE)) });
      } catch (e) { rows.push({ path: p, w, error: e.message.slice(0, 50) }); }
      await ctx.close();
    }
  }
  await browser.close();
  server.close();

  console.log('');
  console.log('FIRST SCREEN DENSITY   (above the fold only)');
  console.log('');
  console.log('  ' + 'page'.padEnd(30) + 'w'.padStart(5) + 'words'.padStart(7) + 'controls'.padStart(10)
    + 'inputs'.padStart(8) + 'chrome'.padStart(8) + 'screens'.padStart(9));
  console.log('  ' + '-'.repeat(77));
  for (const r of rows) {
    if (r.error) { console.log('  ' + r.path.padEnd(30) + String(r.w).padStart(5) + '  ERROR ' + r.error); continue; }
    console.log('  ' + r.path.padEnd(30) + String(r.w).padStart(5) + String(r.words).padStart(7)
      + String(r.controls).padStart(10) + String(r.inputs).padStart(8)
      + (r.chromeH + 'px/' + r.chromePct + '%').padStart(8) + String(r.screens).padStart(9));
  }
  console.log('');
  console.log('  For scale, the numbers that opened the games design phase: 364 words on the');
  console.log('  assembly wall at desktop, 216 on the hospital start menu, 155 on the RN floor');
  console.log('  at 360. There is no correct number here, only lighter or heavier than before.');
})();
