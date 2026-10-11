#!/usr/bin/env node
'use strict';
/**
 * shots.js · pictures, filed with the milestone.
 *
 *   npm run shots -- "The board" /__hub /__hub/run     a phone and a desktop picture of each address
 *   npm run shots -- --before /tools/ /secret-menu/    the same pages on the live site
 *   --card <id>   file under a card other than the one in focus
 *   --sizes phone,landscape,tablet,desktop     which sizes (default phone,desktop); landscape is a
 *                 phone held sideways, tablet an iPad upright
 *   --light       the light theme too
 *   --full        the whole page, not the first screen
 *
 * WHY. David, 2026-10-04: "we need to start having a visual layer to our development process that
 * we can easily look at and follow and use screenshots to kind of visualize or see our process",
 * and, the same evening, that he does his QA at milestones and not after each step. So every step
 * still gets its pictures, and they are FILED: the run sheet shows them under the step, and the QA
 * list sets them beside the "before". Nobody is asked to look until the milestone's QA.
 *
 * THE BEFORE IS THE LIVE SITE. Whatever the last push left is, by definition, what a page looked
 * like before this milestone. So `--before` photographs the same address on healthcareuncharted.com
 * and nobody has to remember to take a picture ahead of a change. A page that is not live yet has
 * no before, and the QA list says it is new.
 *
 * The "now" pictures are taken from the built site through the hub's own server on a spare port,
 * so they never wait on a dev server holding old data. Build first.
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const run = require('./run');
const qa = require('./qa');

const LIVE = 'https://healthcareuncharted.com';
const SIZES = [
  { name: 'phone', width: 390, height: 844, scale: 2, mobile: true },
  { name: 'landscape', width: 844, height: 390, scale: 2, mobile: true },
  { name: 'tablet', width: 820, height: 1180, scale: 2, mobile: true },
  { name: 'desktop', width: 1440, height: 900, scale: 1, mobile: false },
];

function parse() {
  const argv = process.argv.slice(2);
  const flag = (/** @type {string} */ f) => argv.includes(f);
  const ci = argv.indexOf('--card');
  // Git Bash rewrites a leading-slash argument into a Windows path ("/tools/" arrives as
  // "C:/Program Files/Git/tools/"). Put the address back, the way scripts/phone-check.js does.
  const fix = (/** @type {string} */ a) => (/^[A-Za-z]:[\\/](?:.*?[\\/])?Git[\\/]/.test(a) ? '/' + a.replace(/^[A-Za-z]:[\\/](?:.*?[\\/])?Git[\\/]/, '') : a);
  const words = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--card' || argv[i] === '--sizes') { i++; continue; }
    if (!argv[i].startsWith('--')) words.push(fix(argv[i]));
  }
  const paths = words.filter((a) => a.startsWith('/'));
  const label = words.find((a) => !a.startsWith('/')) || '';
  const si = argv.indexOf('--sizes');
  const sizes = (si > -1 ? argv[si + 1] : 'phone,desktop').split(',').map((s) => s.trim());
  return { paths, label, sizes, before: flag('--before'), light: flag('--light'), full: flag('--full'), card: ci > -1 ? argv[ci + 1] : undefined };
}

async function main() {
  const opt = parse();
  if (!opt.paths.length) throw new Error('Name at least one address, after a double dash: npm run shots -- "What changed" /tools/');
  if (!opt.before && !opt.label) throw new Error('Name the step first, in quotes: npm run shots -- "The board" /__hub');
  const card = qa.cardFor(opt.card);
  const base = path.join(qa.SHOTS, card.id);
  fs.mkdirSync(base, { recursive: true });
  let dirName = 'before';
  if (!opt.before) {
    const n = fs.readdirSync(base).filter((d) => /^\d\d-/.test(d)).length + 1;
    dirName = String(n).padStart(2, '0') + '-' + qa.slug(opt.label).slice(0, 48);
  }
  const dir = path.join(base, dirName);
  fs.mkdirSync(dir, { recursive: true });

  const server = opt.before ? null : await require('../review.js').start(0, { quiet: true });
  const origin = server ? 'http://localhost:' + server.port : LIVE;
  const browser = await chromium.launch();
  /** @type {Record<string, string>[]} */
  const filed = [];
  const sizes = SIZES.filter((s) => opt.sizes.includes(s.name));
  if (!sizes.length) throw new Error('--sizes takes phone, landscape, tablet, desktop');
  let count = 0;
  try {
    for (const p of opt.paths) {
      /** @type {Record<string, string>} */
      const entry = { page: p };
      for (const size of sizes) {
        for (const theme of opt.light ? ['dark', 'light'] : ['dark']) {
          const ctx = await browser.newContext({ viewport: { width: size.width, height: size.height }, deviceScaleFactor: size.scale, isMobile: size.mobile, hasTouch: size.mobile });
          await ctx.addInitScript((t) => { try { localStorage.setItem('hu-theme', t); } catch (e) { /* no storage */ } }, theme);
          const page = await ctx.newPage();
          // the traffic page polls GoatCounter's live service; a picture does not need it to
          await page.route(/goatcounter\.com\/api\//, (r) => r.abort());
          let status = 0;
          try {
            const res = await page.goto(origin + p, { waitUntil: 'load', timeout: 45000 });
            status = res ? res.status() : 0;
          } catch (e) { status = 0; }
          if (!status || status >= 400) {
            console.log(`  ${p}  ${size.name}  ${opt.before ? 'not on the live site (new, or not reachable)' : 'did not load (' + status + ')'}`);
            await ctx.close();
            continue;
          }
          await page.waitForLoadState('networkidle', { timeout: 6000 }).catch(() => { /* a page that keeps talking */ });
          // the site scrolls smoothly, so an address with a # is still moving when the page loads
          await page.waitForTimeout(p.includes('#') ? 1200 : 500);
          // a first visit's card (a game's how-to) would cover the picture; it is the page under it that changed
          await page.evaluate(() => document.querySelectorAll('dialog[open]').forEach((d) => /** @type {HTMLDialogElement} */ (d).close())).catch(() => {});
          await page.waitForTimeout(150);
          const file = `${qa.slug(p)}-${size.name}${theme === 'light' ? '-light' : ''}.png`;
          await page.screenshot({ path: path.join(dir, file), fullPage: opt.full });
          count++;
          if (theme === 'dark') entry[size.name] = '/__hub/shots/' + [card.id, dirName, file].map(encodeURIComponent).join('/');
          await ctx.close();
        }
      }
      filed.push(entry);
    }
  } finally {
    await browser.close();
    if (server) await server.close();
  }
  if (!opt.before) run.work({ label: opt.label, summary: `${count} picture(s) of ${opt.paths.length} page(s)`, shots: filed.filter((f) => Object.keys(f).length > 1) });
  console.log(`${count} picture(s) filed in tmp/hub/shots/${card.id}/${dirName}/${opt.before ? ' (the live site, as the before)' : ''}`);
}

main().catch((e) => { console.error(String(e && e.message || e)); process.exit(1); });
