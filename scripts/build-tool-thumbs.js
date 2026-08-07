// Tool-card thumbnails · authored SVG vignettes rasterized to stable PNGs.
// Same contract as the OG cards: David's real screenshots can overwrite any
// of these files (same name, same place) and the site picks them up.
// Run: node scripts/build-tool-thumbs.js   (sharp is already a devDep)
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'src', 'assets', 'images', 'tool-thumbs');
fs.mkdirSync(OUT, { recursive: true });

const W = 1280, H = 440;                       // 2x of the 640x220 card slot
const BG = '#0e1a2e', LINE = '#24405e', TEAL = '#4ECDC4', BLUE = '#2478d4',
      AMBER = '#E8A838', GREEN = '#5DBF87', INK = '#b8cfe8';
const frame = (inner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
  `<rect width="${W}" height="${H}" fill="${BG}"/>${inner}</svg>`;
const hex = (cx, cy, r, fill, stroke, sw = 3, op = 1) => {
  let d = '';
  for (let i = 0; i < 6; i++) {
    const a = (-90 + 60 * i) * Math.PI / 180;
    d += (i ? 'L' : 'M') + (cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1);
  }
  return `<path d="${d}Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" opacity="${op}"/>`;
};

const THUMBS = {
  // two columns, one verdict: the compare bars with the rose between them
  'assignment-compass': frame(
    `<rect x="180" y="120" width="150" height="240" rx="10" fill="${BLUE}" opacity=".55"/>
     <rect x="180" y="120" width="150" height="240" rx="10" fill="none" stroke="${BLUE}" stroke-width="3"/>
     <rect x="950" y="70" width="150" height="290" rx="10" fill="${TEAL}" opacity=".45"/>
     <rect x="950" y="70" width="150" height="290" rx="10" fill="none" stroke="${TEAL}" stroke-width="3"/>
     <line x1="120" y1="360" x2="1160" y2="360" stroke="${LINE}" stroke-width="3"/>
     <circle cx="640" cy="200" r="86" fill="none" stroke="${TEAL}" stroke-width="3" opacity=".8"/>
     <circle cx="640" cy="200" r="58" fill="none" stroke="${TEAL}" stroke-width="2" opacity=".4"/>
     <path d="M640 108 L658 182 L732 200 L658 218 L640 292 L622 218 L548 200 L622 182 Z" fill="${TEAL}"/>
     <path d="M640 148 L650 190 L692 200 L650 210 L640 252 L630 210 L588 200 L630 190 Z" fill="${BG}"/>`),
  // the branching hex ladder
  'career-tree': frame(
    `<line x1="640" y1="400" x2="640" y2="250" stroke="${LINE}" stroke-width="4"/>
     <line x1="640" y1="250" x2="430" y2="150" stroke="${LINE}" stroke-width="4"/>
     <line x1="640" y1="250" x2="850" y2="150" stroke="${LINE}" stroke-width="4"/>
     <line x1="430" y1="150" x2="300" y2="80" stroke="${LINE}" stroke-width="3"/>
     <line x1="850" y1="150" x2="980" y2="80" stroke="${LINE}" stroke-width="3"/>
     ${hex(640, 380, 56, '#0b2018', GREEN, 4)}
     ${hex(640, 250, 48, 'none', TEAL, 4)}
     ${hex(430, 150, 44, 'none', TEAL, 3, .85)}
     ${hex(850, 150, 44, 'none', BLUE, 3, .85)}
     ${hex(300, 80, 38, 'none', AMBER, 3, .7)}
     ${hex(980, 80, 38, 'none', GREEN, 3, .7)}`),
  // the live national scatter with one facility pinned
  'operators-map': frame(
    Array.from({ length: 46 }, (_, i) => {
      const x = 90 + ((i * 179) % 1100), y = 60 + ((i * 97) % 320);
      const c = i % 7 === 0 ? BLUE : TEAL;
      return `<circle cx="${x}" cy="${y}" r="${i % 5 === 0 ? 7 : 4}" fill="${c}" opacity="${0.25 + (i % 4) * 0.15}"/>`;
    }).join('') +
    `<circle cx="820" cy="180" r="26" fill="${TEAL}"/>
     <circle cx="820" cy="180" r="48" fill="none" stroke="${TEAL}" stroke-width="3" opacity=".5"/>
     <circle cx="820" cy="180" r="74" fill="none" stroke="${TEAL}" stroke-width="2" opacity=".25"/>`),
  // the cross-section: floors stacked, one lit
  'hospital-map': frame(
    `<rect x="330" y="60" width="620" height="330" rx="8" fill="none" stroke="${LINE}" stroke-width="4"/>
     ${[0, 1, 2, 3].map(i =>
       `<rect x="350" y="${78 + i * 80}" width="580" height="64" rx="6" fill="${i === 1 ? TEAL : '#132238'}" opacity="${i === 1 ? 0.5 : 1}" stroke="${i === 1 ? TEAL : LINE}" stroke-width="3"/>`).join('')}
     <rect x="600" y="20" width="80" height="40" fill="none" stroke="${BLUE}" stroke-width="3"/>
     <line x1="640" y1="20" x2="640" y2="0" stroke="${BLUE}" stroke-width="3"/>`),
  // above and below the waterline
  'iceberg-map': frame(
    `<line x1="0" y1="160" x2="1280" y2="160" stroke="${TEAL}" stroke-width="3" opacity=".6"/>
     <path d="M540 160 L640 60 L750 160 Z" fill="${INK}" opacity=".9"/>
     <path d="M480 160 L820 160 L720 400 L560 380 Z" fill="${BLUE}" opacity=".35"/>
     <path d="M480 160 L820 160 L720 400 L560 380 Z" fill="none" stroke="${BLUE}" stroke-width="3" opacity=".6"/>
     <line x1="80" y1="230" x2="330" y2="230" stroke="${LINE}" stroke-width="3"/>
     <line x1="80" y1="300" x2="280" y2="300" stroke="${LINE}" stroke-width="3"/>
     <line x1="950" y1="260" x2="1200" y2="260" stroke="${LINE}" stroke-width="3"/>`),
  // the sector grid, a few cells lit
  'vendor-directory': frame(
    Array.from({ length: 24 }, (_, i) => {
      const x = 180 + (i % 8) * 120, y = 80 + Math.floor(i / 8) * 110;
      const lit = [2, 9, 13, 20].indexOf(i) > -1;
      const cols = { 2: TEAL, 9: AMBER, 13: BLUE, 20: '#b59ff5' };
      return `<rect x="${x}" y="${y}" width="90" height="80" rx="8" fill="${lit ? cols[i] : 'none'}" opacity="${lit ? 0.45 : 1}" stroke="${lit ? cols[i] : LINE}" stroke-width="3"/>`;
    }).join('')),
  // the terminal, mid-query
  'sql-mystery': frame(
    `<rect x="240" y="60" width="800" height="320" rx="12" fill="#0a1220" stroke="${LINE}" stroke-width="3"/>
     <line x1="240" y1="120" x2="1040" y2="120" stroke="${LINE}" stroke-width="3"/>
     <circle cx="285" cy="90" r="9" fill="${AMBER}" opacity=".8"/><circle cx="320" cy="90" r="9" fill="${GREEN}" opacity=".8"/><circle cx="355" cy="90" r="9" fill="${LINE}"/>
     <rect x="290" y="160" width="170" height="16" rx="8" fill="${BLUE}" opacity=".9"/>
     <rect x="480" y="160" width="330" height="16" rx="8" fill="${INK}" opacity=".5"/>
     <rect x="290" y="205" width="120" height="16" rx="8" fill="${BLUE}" opacity=".9"/>
     <rect x="430" y="205" width="240" height="16" rx="8" fill="${INK}" opacity=".5"/>
     <rect x="290" y="265" width="450" height="16" rx="8" fill="${GREEN}" opacity=".8"/>
     <rect x="290" y="310" width="380" height="16" rx="8" fill="${GREEN}" opacity=".55"/>
     <rect x="700" y="310" width="26" height="20" fill="${TEAL}"/>`),
  // state grid, shaded by lens
  'multi-lens-map': frame(
    Array.from({ length: 32 }, (_, i) => {
      const x = 240 + (i % 8) * 105, y = 70 + Math.floor(i / 8) * 85;
      const t = (Math.sin(i * 2.7) + 1) / 2;
      return `<rect x="${x}" y="${y}" width="88" height="68" rx="6" fill="${TEAL}" opacity="${(0.08 + t * 0.5).toFixed(2)}" stroke="${LINE}" stroke-width="2"/>`;
    }).join('') +
    `<rect x="240" y="405" width="840" height="10" rx="5" fill="url(#g)"/>
     <defs><linearGradient id="g"><stop offset="0" stop-color="${TEAL}" stop-opacity=".1"/><stop offset="1" stop-color="${TEAL}"/></linearGradient></defs>`),
  // the territory: zone hexes around the hub
  'atlas': frame(
    `${hex(640, 220, 70, 'none', TEAL, 4)}
     ${hex(640, 220, 46, '#0d1117', BLUE, 3)}
     ${hex(455, 115, 56, 'none', '#FF6B6B', 3, .75)}
     ${hex(825, 115, 56, 'none', BLUE, 3, .75)}
     ${hex(455, 330, 56, 'none', GREEN, 3, .75)}
     ${hex(825, 330, 56, 'none', AMBER, 3, .75)}
     ${hex(270, 220, 56, 'none', '#b59ff5', 3, .75)}
     ${hex(1010, 220, 56, 'none', '#38b6f0', 3, .75)}
     <line x1="565" y1="180" x2="510" y2="145" stroke="${LINE}" stroke-width="3"/>
     <line x1="715" y1="180" x2="770" y2="145" stroke="${LINE}" stroke-width="3"/>
     <line x1="565" y1="260" x2="510" y2="300" stroke="${LINE}" stroke-width="3"/>
     <line x1="715" y1="260" x2="770" y2="300" stroke="${LINE}" stroke-width="3"/>`),
  // the stacked library
  'learn-library': frame(
    `${[0, 1, 2, 3].map(i =>
      `<rect x="${360 + i * 14}" y="${90 + i * 58}" width="${560 - i * 28}" height="44" rx="8" fill="${i === 0 ? TEAL : '#132238'}" opacity="${i === 0 ? 0.5 : 1}" stroke="${i === 0 ? TEAL : LINE}" stroke-width="3"/>`).join('')}
     <line x1="420" y1="368" x2="860" y2="368" stroke="${AMBER}" stroke-width="4" opacity=".7"/>`)
};

(async () => {
  for (const [id, svg] of Object.entries(THUMBS)) {
    const out = path.join(OUT, id + '.png');
    await sharp(Buffer.from(svg)).png({ quality: 90 }).toFile(out);
    console.log('wrote', path.relative(process.cwd(), out));
  }
})();
