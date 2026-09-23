// Build branded 1200x630 OG cards for the two map tools -> src/brand/og-*.jpg
// Stopgap until real screenshots land: swap the JPEGs in place, same filenames,
// and the front matter keeps working. Run: node scripts/build-og-cards.js
// Brand: HU Blue #1B5FA8 / HU Teal #4ECDC4 / Clinical White #F6F9FC / Dark #0d1117.
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const BRAND = path.join(__dirname, '..', 'src', 'brand');
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// system-font stack — librsvg has no access to the site's Google Fonts; the logo PNG carries the brand
const FONT = "Segoe UI, Arial, sans-serif";

function cardSVG({ kicker, title, lines, tags }){
  const tagChips = tags.map((t, i) => {
    const x = 72 + tags.slice(0, i).reduce((a, s) => a + s.length * 10.6 + 46, 0);
    return '<rect x="' + x + '" y="472" rx="15" height="34" width="' + (t.length * 10.6 + 30) + '" fill="none" stroke="#4ECDC4" stroke-opacity="0.55" stroke-width="1.5"/>' +
           '<text x="' + (x + 15 + t.length * 5.3) + '" y="495" text-anchor="middle" font-family="' + FONT + '" font-size="17" fill="#7FE3D8">' + esc(t) + '</text>';
  }).join('');
  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0b1512"/><stop offset="0.55" stop-color="#0d1117"/><stop offset="1" stop-color="#101a24"/>
    </linearGradient>
    <linearGradient id="bar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#1B5FA8"/><stop offset="1" stop-color="#4ECDC4"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="1200" height="8" fill="url(#bar)"/>
  <!-- faint hex grid whisper, the tools' shared texture -->
  <g stroke="#4ECDC4" stroke-opacity="0.06" fill="none" stroke-width="1.5">
    <path d="M980 90 l55 32 v64 l-55 32 -55 -32 v-64 z"/>
    <path d="M1090 154 l55 32 v64 l-55 32 -55 -32 v-64 z"/>
    <path d="M980 218 l55 32 v64 l-55 32 -55 -32 v-64 z"/>
    <path d="M1090 282 l55 32 v64 l-55 32 -55 -32 v-64 z"/>
  </g>
  <text x="72" y="196" font-family="${FONT}" font-size="24" letter-spacing="6" fill="#7FD2C8" opacity="0.85">${esc(kicker.toUpperCase())}</text>
  <text x="70" y="270" font-family="${FONT}" font-size="60" font-weight="700" fill="#F6F9FC">${esc(title)}</text>
  ${lines.map((l, i) => '<text x="72" y="' + (330 + i * 40) + '" font-family="' + FONT + '" font-size="26" fill="#B8CDD6">' + esc(l) + '</text>').join('')}
  ${tagChips}
  <rect x="0" y="560" width="1200" height="70" fill="#0a0e13"/>
  <text x="1128" y="604" text-anchor="end" font-family="${FONT}" font-size="22" fill="#6FB9B1">healthcareuncharted.com</text>
</svg>`;
}

const CARDS = [
  {
    out: 'og-operators-map.jpg',
    kicker: 'Interactive · CMS data',
    title: 'U.S. Hospital Operations Map',
    lines: ['Hospitals, dialysis, surgery centers, pharmacies and suppliers', 'as stackable layers. Drill from states to a single facility.'],
    tags: ['34,000+ facilities', 'County drill-down', 'Draw your own search'],
  },
  {
    out: 'og-multi-lens-map.jpg',
    kicker: 'Interactive · Seven lenses',
    title: 'U.S. Population Health Map',
    lines: ['Every state through Patient, Clinical, Operations, Payer,', 'Policy, Economics and baseline lenses. 62 metrics, county grain.'],
    tags: ['50 states compared', '62 metrics', 'Real county boundaries'],
  },
  {
    out: 'og-career-tree.jpg',
    kicker: 'Interactive · Plan your road',
    title: 'The Healthcare Career Tree',
    lines: ['158 real roles, every credential priced: pass rates, fees,', 'program lengths. Pin where you are and map where you go.'],
    tags: ['158 roles', 'Real exam data', 'Build your path'],
  },
];

// ── ROUNDS OG CARDS ────────────────────────────────────────────────────────────
// Rounds cards are their own template because their titles are long enough to wrap,
// and because they write PNGs into src/assets/images/og/ where the posts' og_image
// front matter already points. Titles and summaries come from src/_data/rounds.js,
// so a retitle regenerates the card instead of leaving a stale one on the socials.
const ROUNDS_DIR = path.join(__dirname, '..', 'src', 'assets', 'images', 'og');

function wrapText(text, maxChars, maxLines){
  const words = String(text).split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words){
    const next = cur ? cur + ' ' + w : w;
    if (next.length > maxChars && cur){ lines.push(cur); cur = w; } else { cur = next; }
    if (lines.length === maxLines) break;
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  return lines;
}

// Two palettes for the same Rounds card. DARK is the social card and stays byte for byte
// what it was: og_image in each post's front matter points at it, and link previews want
// it. LIGHT exists only because /rounds/ reuses the card as its on-page thumbnail
// (.hc-thumb), and under the light theme a dark slab in every card is wrong. Accents at
// their deep steps (--teal-ink, --dgm-flow, --dgm-ink) so text holds on the pale ground.
const ROUNDS_THEMES = {
  dark: {
    suffix: '', logo: 'hu-logo-inline-dark.png', flatten: '#0d1117', png: { compressionLevel: 9 },
    bg: ['#0b1512', '#0d1117', '#101a24'], hexes: '#4ECDC4',
    kicker: '#7FD2C8', title: '#F6F9FC', title2: '#4ECDC4', rule: '#4ECDC4',
    body: '#B8CDD6', chip: '#4ECDC4', chipText: '#7FE3D8', foot: '#0a0e13', footText: '#6FB9B1'
  },
  light: {
    // palette PNG: the light card is an on-page thumbnail only, and at quality 90 it reads
    // the same as full color at about a third of the weight (32 KB against 88 KB)
    suffix: '-light', logo: 'hu-logo-inline.png', flatten: '#EEF2F7', png: { compressionLevel: 9, palette: true, quality: 90 },
    bg: ['#EAF3F1', '#EEF2F7', '#E4ECF5'], hexes: '#1B5FA8',
    kicker: '#0D7268', title: '#0d1117', title2: '#0F7F78', rule: '#1B9A90',
    body: '#3A4F6B', chip: '#0F7F78', chipText: '#0D7268', foot: '#DCE4EE', footText: '#0D7268'
  }
};

function roundsCardSVG({ kicker, title, summary, tags }, C = ROUNDS_THEMES.dark){
  const titleLines = wrapText(title, 30, 2);
  const titleSize = titleLines.length > 1 ? 58 : 64;
  const titleTop = titleLines.length > 1 ? 252 : 284;
  const bodyTop = titleTop + (titleLines.length * (titleSize + 12)) + 34;
  const bodyLines = wrapText(summary, 82, 2);

  const titleSVG = titleLines.map((l, i) =>
    '<text x="70" y="' + (titleTop + i * (titleSize + 12)) + '" font-family="' + FONT +
    '" font-size="' + titleSize + '" font-weight="700" fill="' + (i === 0 ? C.title : C.title2) + '">' + esc(l) + '</text>').join('');

  const bodySVG = bodyLines.map((l, i) =>
    '<text x="72" y="' + (bodyTop + i * 38) + '" font-family="' + FONT +
    '" font-size="26" fill="' + C.body + '">' + esc(l) + '</text>').join('');

  const tagChips = tags.map((t, i) => {
    const x = 72 + tags.slice(0, i).reduce((a, v) => a + v.length * 10.6 + 46, 0);
    return '<rect x="' + x + '" y="496" rx="15" height="34" width="' + (t.length * 10.6 + 30) + '" fill="none" stroke="' + C.chip + '" stroke-opacity="0.55" stroke-width="1.5"/>' +
           '<text x="' + (x + 15 + t.length * 5.3) + '" y="519" text-anchor="middle" font-family="' + FONT + '" font-size="17" fill="' + C.chipText + '">' + esc(t) + '</text>';
  }).join('');

  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${C.bg[0]}"/><stop offset="0.55" stop-color="${C.bg[1]}"/><stop offset="1" stop-color="${C.bg[2]}"/>
    </linearGradient>
    <linearGradient id="bar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#1B5FA8"/><stop offset="1" stop-color="#4ECDC4"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="1200" height="8" fill="url(#bar)"/>
  <g stroke="${C.hexes}" stroke-opacity="0.06" fill="none" stroke-width="1.5">
    <path d="M980 90 l55 32 v64 l-55 32 -55 -32 v-64 z"/>
    <path d="M1090 154 l55 32 v64 l-55 32 -55 -32 v-64 z"/>
    <path d="M980 218 l55 32 v64 l-55 32 -55 -32 v-64 z"/>
    <path d="M1090 282 l55 32 v64 l-55 32 -55 -32 v-64 z"/>
  </g>
  <text x="72" y="196" font-family="${FONT}" font-size="24" letter-spacing="6" fill="${C.kicker}" opacity="0.85">${esc(kicker.toUpperCase())}</text>
  ${titleSVG}
  <rect x="70" y="${titleTop + titleLines.length * (titleSize + 12) - 26}" width="120" height="6" fill="${C.rule}"/>
  ${bodySVG}
  ${tagChips}
  <rect x="0" y="560" width="1200" height="70" fill="${C.foot}"/>
  <text x="1128" y="604" text-anchor="end" font-family="${FONT}" font-size="22" fill="${C.footText}">healthcareuncharted.com</text>
</svg>`;
}

async function buildRounds(){
  const rounds = require(path.join(__dirname, '..', 'src', '_data', 'rounds.js'));
  const list = (Array.isArray(rounds) ? rounds : Object.values(rounds)[0])
    .slice()
    .sort((a, b) => String(a.posted).localeCompare(String(b.posted)));

  if (!fs.existsSync(ROUNDS_DIR)) fs.mkdirSync(ROUNDS_DIR, { recursive: true });

  for (const C of Object.values(ROUNDS_THEMES)){
    const logoBuf = await sharp(path.join(BRAND, C.logo)).resize({ width: 340 }).toBuffer();
    for (let i = 0; i < list.length; i++){
      const r = list[i];
      const num = String(i + 1).padStart(2, '0');
      const tags = (r.tags || []).slice(0, 3).map(t => t.replace(/-/g, ' '));
      const svg = Buffer.from(roundsCardSVG({
        kicker: 'Rounds ' + num,
        title: r.title,
        summary: r.summary,
        tags,
      }, C));
      const outPath = path.join(ROUNDS_DIR, 'rounds-' + r.slug + C.suffix + '.png');
      await sharp(svg)
        .composite([{ input: logoBuf, top: 48, left: 66 }])
        .flatten({ background: C.flatten })
        .png(C.png)
        .toFile(outPath);
      console.log('wrote', outPath, fs.statSync(outPath).size, 'bytes');
    }
  }
}

(async () => {
  const logo = path.join(BRAND, 'hu-logo-inline-dark.png');
  for (const c of CARDS){
    const svg = Buffer.from(cardSVG(c));
    const outPath = path.join(BRAND, c.out);
    await sharp(svg)
      .composite([{ input: await sharp(logo).resize({ width: 340 }).toBuffer(), top: 48, left: 66 }])
      .flatten({ background: '#0d1117' })
      .jpeg({ quality: 90, mozjpeg: true })
      .toFile(outPath);
    console.log('wrote', outPath, fs.statSync(outPath).size, 'bytes');
  }
  await buildRounds();
})();
