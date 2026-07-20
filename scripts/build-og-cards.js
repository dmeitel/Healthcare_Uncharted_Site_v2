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
    kicker: 'Interactive · Six lenses',
    title: 'U.S. Pop Health Multi-Lens Map',
    lines: ['Every state through Patient, Clinical, Operations, Payer,', 'Policy and Economics lenses. 40+ metrics, county grain.'],
    tags: ['50 states compared', '40+ metrics', 'Real county boundaries'],
  },
  {
    out: 'og-career-tree.jpg',
    kicker: 'Interactive · Plan your road',
    title: 'The Healthcare Career Tree',
    lines: ['158 real roles, every credential priced: pass rates, fees,', 'program lengths. Pin where you are and map where you go.'],
    tags: ['158 roles', 'Real exam data', 'Build your path'],
  },
];

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
})();
