#!/usr/bin/env node
'use strict';
/**
 * tool-compare.js — put every tool page's chrome side by side and report where they disagree.
 *
 *   node scripts/tool-compare.js               desktop + phone
 *   node scripts/tool-compare.js --w 390       one width
 *
 * WHY. The reading pages drifted because each one carried its own copy of the shared shell, and
 * no check compared page A to page B. The tool pages have the same shape of risk and a shared
 * mechanism of their own (the merged band: nav and toolbar in one strip). This measures that
 * band and the controls under it on every tool, then prints the values that are not unanimous.
 *
 * It reports DISAGREEMENT, not defects. Two tools differing is sometimes correct: the maps are
 * excluded from the merged band by CLAUDE.md's twins rule. The point is to make every difference
 * visible so the deliberate ones can be named and the accidental ones fixed.
 */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = path.join(ROOT, '_site');
const PORT = 8123;

const TOOLS = [
  '/tools/cost-of-living/', '/tools/career-tree/', '/tools/hospital-map/',
  '/tools/iceberg-map/', '/tools/multi-lens-map/', '/tools/operators-map/',
  '/tools/sql-mystery/', '/tools/vendor-directory/', '/atlas/',
];

const argv = process.argv.slice(2);
const only = argv.indexOf('--w') > -1 ? [Number(argv[argv.indexOf('--w') + 1])] : [1440, 390];

const MIME = { '.html':'text/html;charset=utf-8', '.css':'text/css', '.js':'text/javascript',
  '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg',
  '.webp':'image/webp', '.woff2':'font/woff2', '.ico':'image/x-icon', '.wasm':'application/wasm' };

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

/** Everything worth comparing about a tool's chrome, read from the live page. */
const PROBE = () => {
  const px = (v) => Math.round(parseFloat(v) || 0);
  const vis = (e) => {
    if (!e) return false;
    const cs = getComputedStyle(e);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    const r = e.getBoundingClientRect();
    return r.width > 2 && r.height > 2;
  };
  const one = (sel) => document.querySelector(sel);

  const bar = one('.tool-bar');
  const nav = one('nav[aria-label="Primary"]');
  const brand = one('.tb-brand');
  /* BOTH names. A tool titles itself either inside a merged band (.tool-bar-title) or in the
     site nav (.nav-tool-title, added 2026-09-22). Looking for only the first made three
     freshly titled tools report null, which would have read as "the fix did not work". */
  const title = one('.tool-bar-title') || one('.nav-tool-title');
  const kicker = one('.tool-bar .tool-bar-kicker, .tool-bar .kicker');
  const chips = [...document.querySelectorAll('.toggle-chip')].filter(vis);
  const iconBtns = [...document.querySelectorAll('.icon-btn')].filter(vis);
  const selects = [...document.querySelectorAll('select')].filter(vis);
  const attrib = one('.tool-attribution, .tool-attribution--fixed');

  const h = (e) => (vis(e) ? Math.round(e.getBoundingClientRect().height) : 0);
  const fs_ = (e) => (e ? px(getComputedStyle(e).fontSize) : 0);

  // every fixed/sticky band, which is what eats a phone screen
  const pinned = [...document.querySelectorAll('body *')].filter((e) => {
    const cs = getComputedStyle(e);
    if (cs.position !== 'fixed' && cs.position !== 'sticky') return false;
    if (!vis(e)) return false;
    const r = e.getBoundingClientRect();
    return r.width > innerWidth * 0.5 && r.height > 8 && r.height < innerHeight * 0.6;
  }).map((e) => ({
    sel: e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') +
         (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/)[0] : ''),
    h: Math.round(e.getBoundingClientRect().height),
    top: Math.round(e.getBoundingClientRect().top),
  }));

  return {
    hasMergedBand: !!vis(bar),
    barH: h(bar),
    navH: h(nav),
    hasBrandInBar: !!vis(brand),
    titleSize: fs_(title),
    titleText: title ? title.textContent.trim().replace(/\s+/g, ' ').slice(0, 34) : null,
    hasKicker: !!vis(kicker),
    chipCount: chips.length,
    chipH: chips.length ? Math.round(chips[0].getBoundingClientRect().height) : 0,
    chipRadius: chips.length ? px(getComputedStyle(chips[0]).borderRadius) : 0,
    chipFont: chips.length ? fs_(chips[0]) : 0,
    iconBtnCount: iconBtns.length,
    iconBtnSize: iconBtns.length ? Math.round(iconBtns[0].getBoundingClientRect().height) : 0,
    selectCount: selects.length,
    selectH: selects.length ? Math.round(selects[0].getBoundingClientRect().height) : 0,
    hasAttribution: !!vis(attrib),
    pinnedBands: pinned.length,
    pinnedTotalH: pinned.reduce((s, b) => s + b.h, 0),
    pinned: pinned.slice(0, 4),
  };
};

(async () => {
  await new Promise((r) => server.listen(PORT, r));
  const browser = await chromium.launch();
  const rows = {};

  for (const w of only) {
    const ctx = await browser.newContext({
      viewport: { width: w, height: w <= 699 ? 844 : 900 },
      deviceScaleFactor: 1, isMobile: w <= 699, hasTouch: w <= 699,
    });
    for (const t of TOOLS) {
      const page = await ctx.newPage();
      try {
        await page.goto('http://localhost:' + PORT + t, { waitUntil: 'load', timeout: 25000 });
        await page.waitForTimeout(1400);
        rows[w] = rows[w] || {};
        rows[w][t] = await page.evaluate(PROBE);
      } catch (e) {
        rows[w] = rows[w] || {};
        rows[w][t] = { error: e.message.split('\n')[0].slice(0, 60) };
      }
      await page.close();
    }
    await ctx.close();
  }
  await browser.close();
  server.close();

  for (const w of only) {
    console.log('');
    console.log('=========== ' + w + 'px ===========');
    const data = rows[w];
    const keys = Object.keys(Object.values(data).find((v) => !v.error) || {}).filter((k) => k !== 'pinned');
    for (const k of keys) {
      const byVal = {};
      for (const [t, v] of Object.entries(data)) {
        if (v.error) continue;
        const key = JSON.stringify(v[k]);
        (byVal[key] = byVal[key] || []).push(t.replace('/tools/', '').replace(/\//g, ''));
      }
      const groups = Object.entries(byVal).sort((a, b) => b[1].length - a[1].length);
      if (groups.length <= 1) continue;                    // unanimous, nothing to say
      console.log('');
      console.log('  ' + k + '  (' + groups.length + ' different values)');
      for (const [val, tools] of groups) {
        console.log('     ' + String(val).padEnd(12) + ' ' + tools.join(', '));
      }
    }
    console.log('');
    console.log('  pinned bands per tool:');
    for (const [t, v] of Object.entries(data)) {
      if (v.error) { console.log('     ' + t + '  ERROR ' + v.error); continue; }
      console.log('     ' + t.padEnd(26) + v.pinnedBands + ' band(s), ' + v.pinnedTotalH + 'px  '
        + (v.pinned || []).map((b) => b.sel + ':' + b.h).join(' + '));
    }
  }
})();
