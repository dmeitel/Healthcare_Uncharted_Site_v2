#!/usr/bin/env node
'use strict';
/**
 * build-share-cards.js · the link preview cards for the pages the launch links (2026-10-11, the Ideas card "Share cards
 * that say what the page is", David's Yes).
 *
 *   node scripts/build-share-cards.js        writes src/assets/images/og/card-*.png, 1200 x 630
 *   node scripts/build-share-cards.js card-device-assembly    writes only the cards named
 *
 * WHY. The three games' previews were their 1280 x 440 shelf thumbnails with no name on them, so a LinkedIn post showed
 * a cropped strip of abstract art. Each card says what the page is: a kicker, the title, one plain line, and the page's
 * one number on a glass readout (home carries the compass rose in its dial instead). The share card rule from the voice
 * kernel holds: title and data only, no verdict line. The look is the brass instruments look (docs/HU-BRASS-LOOK-2026-10-11.md).
 * The numbers are read from the site's own data when the script runs, so re-run it after a data refresh.
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'src', 'assets', 'images', 'og');
const mark = fs.readFileSync(path.join(ROOT, 'src', 'brand', 'hu-mark-dark.svg'), 'utf8').replace('width="100%"', 'width="56" height="56"');
const roseSrc = fs.readFileSync(path.join(ROOT, 'src', '_includes', 'components', 'compass-rose.njk'), 'utf8');
const roseAt = roseSrc.indexOf('<svg class="hv-rose hv-rose-night"');
const rose = roseSrc.slice(roseAt, roseSrc.indexOf('</svg>', roseAt) + 6);
if (roseAt < 0 || !rose.endsWith('</svg>')) throw new Error('the night rose was not found in compass-rose.njk');
const hospitals = require(path.join(ROOT, 'src', 'assets', 'data', 'us-hospitals.json')).hospitals.length;
// the games on the Fun shelf, from the catalog: a folder under src/fun is not always a game (/fun/today/, 2026-10-18)
const games = require(path.join(ROOT, 'src', '_data', 'tools.js')).filter((t) => t.cluster === 'fun' && t.status === 'live').length;
const toolCount = fs.readdirSync(path.join(ROOT, 'src', 'tools'), { withFileTypes: true }).filter((d) => d.isDirectory())
  .filter((d) => /^section:\s*(tool|lab)\s*$/m.test(fs.readFileSync(path.join(ROOT, 'src', 'tools', d.name, fs.readdirSync(path.join(ROOT, 'src', 'tools', d.name)).find((f) => /^index\./.test(f))), 'utf8'))).length;

const CARDS = [
  { file: 'card-home', kicker: 'Healthcare Uncharted', title: 'Healthcare doesn’t come with a map', line: 'Free tools, games and plain writing on how American healthcare runs.', dial: true },
  { file: 'card-me', kicker: 'Healthcare Uncharted', title: 'David Eitel', line: 'RRT, MHA, MSRT, RRT-ACCS. Clinical informatics team manager and founder of Healthcare Uncharted.', dial: true },
  { file: 'card-tools', kicker: 'Tools', title: 'The instruments', line: 'Every interactive tool on the site, grouped by the job it does.', n: String(toolCount), unit: 'tools', key: 'Open' },
  { file: 'card-fun', kicker: 'Fun', title: 'Healthcare games and daily puzzles', line: 'A med-surg shift, respiratory equipment setups, and trivia on real health data. Free, with no account.', n: String(games), unit: 'games', key: 'Play' },
  { file: 'card-alarm-fatigue', kicker: 'Game', title: 'Alarm Fatigue', line: 'A med-surg shift as an idle clicker. Somewhere in the noise is the alarm that matters.', n: '10 to 20', unit: 'minutes', key: 'Play' },
  { file: 'card-vital-stats', kicker: 'Game · Multiplayer', title: 'Vital Stats', line: 'A trivia game about the real numbers in American healthcare. Play the bots, or a whole room.', n: '2 to 48', unit: 'players', key: 'Play' },
  { file: 'card-device-assembly', kicker: 'Game · Beta', title: 'Headwall', line: 'Set up oxygen, high flow and ventilators on the wall behind the bed, with real connectors.', n: 'Daily', unit: 'a new wall', key: 'Play' },
  { file: 'card-daily-huddle', kicker: 'Game · Beta', title: 'Daily Huddle', line: 'Healthcare trivia on a hex board. Answer tiles to cross it from the top row to the bottom.', n: 'Daily', unit: 'a new board', key: 'Play' },
  { file: 'card-multi-lens-map', kicker: 'Tool · Map', title: 'U.S. Population Health Map', line: 'Every state and county through seven lens groups, from patients to policy.', n: '72', unit: 'metrics', key: 'Open' },
  { file: 'card-operators-map', kicker: 'Tool · Map', title: 'U.S. Hospital Operations Map', line: 'Hospitals, schools, dialysis, surgery centers, pharmacies and suppliers as layers.', n: hospitals.toLocaleString('en-US'), unit: 'hospitals (CMS)', key: 'Open' },
];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
function html(c) {
  const right = c.dial
    ? `<div class="dial"><span class="ring"></span>${rose}</div>`
    : `<div class="glass"><div class="big">${esc(c.n)}</div><div class="unit">${esc(c.unit)}</div></div><div class="key">${esc(c.key)}</div>`;
  return `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&family=IBM+Plex+Mono:wght@500;600&family=Outfit:wght@700;800;900&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;background:#0A0F1A;font-family:'DM Sans',sans-serif}
.frame{position:absolute;inset:18px;border-radius:22px;padding:4px;background:linear-gradient(160deg,#ECD08E,#B48A45 40%,#6B5126 70%,#D9B56A)}
.face{position:relative;width:100%;height:100%;border-radius:18px;background:linear-gradient(180deg,#13203A,#0C1626);overflow:hidden}
.copy{position:absolute;left:58px;top:58px;width:${c.dial ? 620 : 640}px}
.kicker{font-family:'IBM Plex Mono',monospace;font-weight:600;font-size:22px;letter-spacing:.16em;text-transform:uppercase;color:#C9A35B}
h1{font-family:'Outfit',sans-serif;font-weight:900;font-size:${c.title.length > 22 ? 68 : 84}px;line-height:1.02;letter-spacing:-.02em;color:#F6F9FC;margin:16px 0 20px}
p{font-size:29px;line-height:1.4;color:#B8CFE8}
.brand{position:absolute;left:58px;bottom:44px;display:flex;align-items:center;gap:14px;font-family:'Outfit',sans-serif;font-weight:700;font-size:26px;color:#F6F9FC}
.brand span{font-family:'IBM Plex Mono',monospace;font-weight:500;font-size:20px;color:#9BB3CE;margin-left:4px}
.glass{position:absolute;right:58px;top:96px;width:330px;padding:30px 28px;border-radius:16px;background:#060A12;box-shadow:inset 0 3px 14px rgba(0,0,0,.85),inset 0 0 0 2px #1A2D48;text-align:center}
.big{font-family:'IBM Plex Mono',monospace;font-weight:600;font-size:${c.n && c.n.length > 5 ? 60 : 86}px;line-height:1.05;color:#F6F9FC}
.unit{margin-top:10px;font-family:'IBM Plex Mono',monospace;font-weight:500;font-size:22px;letter-spacing:.08em;text-transform:uppercase;color:#9BB3CE}
.key{position:absolute;right:58px;bottom:44px;width:330px;height:76px;display:flex;align-items:center;justify-content:center;border-radius:14px;font-family:'Outfit',sans-serif;font-weight:800;font-size:32px;letter-spacing:.02em;color:#2A1D08;background:linear-gradient(180deg,#ECD08E,#D9B56A 48%,#B48A45);box-shadow:inset 0 2px 0 rgba(255,255,255,.55),0 6px 0 #5E4519}
.dial{position:absolute;right:48px;top:50%;width:440px;height:440px;transform:translateY(-50%);display:grid;place-items:center}
.ring{position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 210deg,#ECD08E,#B48A45,#D9B56A,#5E4519,#ECD08E)}
.ring::after{content:'';position:absolute;inset:5%;border-radius:50%;background:radial-gradient(circle at 50% 38%,#13203A,#0C1626 72%);box-shadow:inset 0 6px 18px rgba(0,0,0,.8)}
.dial svg{position:relative;width:72%;height:auto}
</style></head><body><div class="frame"><div class="face">
<div class="copy"><div class="kicker">${esc(c.kicker)}</div><h1>${esc(c.title)}</h1><p>${esc(c.line)}</p></div>
${right}
<div class="brand">${mark}Healthcare Uncharted<span>healthcareuncharted.com</span></div>
</div></div></body></html>`;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  const only = process.argv.slice(2);   // a rename redraws its own card without re-rendering the rest
  for (const c of CARDS.filter((x) => !only.length || only.includes(x.file))) {
    await page.setContent(html(c), { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(OUT, c.file + '.png') });
    console.log('wrote', path.relative(ROOT, path.join(OUT, c.file + '.png')));
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
