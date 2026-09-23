// Tool-card thumbnails · authored SVG vignettes rasterized to stable PNGs.
// Same contract as the OG cards: David's real screenshots can overwrite any
// of these files (same name, same place) and the site picks them up.
// TWO THEMES (2026-09-23): every vignette is drawn twice from the same geometry,
// <id>.png on the dark palette and <id>-light.png on the light one. .hc-thumb in
// hu-global.css shows the light file under [data-theme="light"]. A screenshot that
// replaces <id>.png should replace <id>-light.png too, or light theme keeps the vignette.
// Run: node scripts/build-tool-thumbs.js   (sharp is already a devDep)
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'src', 'assets', 'images', 'tool-thumbs');
fs.mkdirSync(OUT, { recursive: true });

const W = 1280, H = 440;                       // 2x of the 640x220 card slot

// The palette is the only thing that differs between the two files. DARK is the
// original set, byte for byte. LIGHT sits on the light .hc-thumb ground (#E7EEF6) and
// takes each accent at its deep step so a mark holds 3:1 there: teal is --dgm-flow,
// amber is darkened along its own hue, green and red are the -dk tokens.
const DARK = {
  BG: '#0e1a2e', LINE: '#24405e', TEAL: '#4ECDC4', BLUE: '#2478d4',
  AMBER: '#E8A838', GREEN: '#5DBF87', INK: '#b8cfe8',
  GGREEN: '#4ecb8d', GDEEP: '#2D9B6F',          // secret-menu guest identity
  PANEL: '#132238',                             // an unlit card or floor, one step off the ground
  ROOT: '#0b2018', HUB: '#0d1117', TERM: '#0a1220',   // wells darker than the ground
  PURPLE: '#b59ff5', CORAL: '#FF6B6B', SKY: '#38b6f0', RED: '#DF5752'
};
const LIGHT = {
  BG: '#E7EEF6', LINE: '#94A3B8', TEAL: '#0F7F78', BLUE: '#1B5FA8',
  AMBER: '#A87A0C', GREEN: '#1B6B4C', INK: '#2D3748',
  GGREEN: '#23794E', GDEEP: '#1B6B4C',
  PANEL: '#F6F9FC',
  ROOT: '#DDEFE6', HUB: '#FFFFFF', TERM: '#FFFFFF',   // on light ground a well is a white sheet
  PURPLE: '#7C6FCD', CORAL: '#DF5752', SKY: '#1F7FB5', RED: '#A8352F'
};
const THEMES = [{ suffix: '', P: DARK }, { suffix: '-light', P: LIGHT }];

const hex = (cx, cy, r, fill, stroke, sw = 3, op = 1) => {
  let d = '';
  for (let i = 0; i < 6; i++) {
    const a = (-90 + 60 * i) * Math.PI / 180;
    d += (i ? 'L' : 'M') + (cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1);
  }
  return `<path d="${d}Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" opacity="${op}"/>`;
};

// Every vignette drawn on one palette. The geometry is written once, here; only the
// colors change between the dark and the light file.
const vignettes = ({ BG, LINE, TEAL, BLUE, AMBER, GREEN, INK, GGREEN, GDEEP,
                     PANEL, ROOT, HUB, TERM, PURPLE, CORAL, SKY, RED }) => {
const frame = (inner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
  `<rect width="${W}" height="${H}" fill="${BG}"/>${inner}</svg>`;
return {
  // two columns, one verdict: the compare bars with the rose between them
  /* keyed on the tool's ID, not its URL. The URL became /tools/cost-of-living/ on
     2026-09-22; the id stays 'assignment-compass' so the generated PNG keeps matching
     what src/tools/index.html asks for ({{ tool.id }}.png) and the Atlas labNode link. */
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
     ${hex(640, 380, 56, ROOT, GREEN, 4)}
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
       `<rect x="350" y="${78 + i * 80}" width="580" height="64" rx="6" fill="${i === 1 ? TEAL : PANEL}" opacity="${i === 1 ? 0.5 : 1}" stroke="${i === 1 ? TEAL : LINE}" stroke-width="3"/>`).join('')}
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
      const cols = { 2: TEAL, 9: AMBER, 13: BLUE, 20: PURPLE };
      return `<rect x="${x}" y="${y}" width="90" height="80" rx="8" fill="${lit ? cols[i] : 'none'}" opacity="${lit ? 0.45 : 1}" stroke="${lit ? cols[i] : LINE}" stroke-width="3"/>`;
    }).join('')),
  // the terminal, mid-query
  'sql-mystery': frame(
    `<rect x="240" y="60" width="800" height="320" rx="12" fill="${TERM}" stroke="${LINE}" stroke-width="3"/>
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
     ${hex(640, 220, 46, HUB, BLUE, 3)}
     ${hex(455, 115, 56, 'none', CORAL, 3, .75)}
     ${hex(825, 115, 56, 'none', BLUE, 3, .75)}
     ${hex(455, 330, 56, 'none', GREEN, 3, .75)}
     ${hex(825, 330, 56, 'none', AMBER, 3, .75)}
     ${hex(270, 220, 56, 'none', PURPLE, 3, .75)}
     ${hex(1010, 220, 56, 'none', SKY, 3, .75)}
     <line x1="565" y1="180" x2="510" y2="145" stroke="${LINE}" stroke-width="3"/>
     <line x1="715" y1="180" x2="770" y2="145" stroke="${LINE}" stroke-width="3"/>
     <line x1="565" y1="260" x2="510" y2="300" stroke="${LINE}" stroke-width="3"/>
     <line x1="715" y1="260" x2="770" y2="300" stroke="${LINE}" stroke-width="3"/>`),
  // the stacked library
  'learn-library': frame(
    `${[0, 1, 2, 3].map(i =>
      `<rect x="${360 + i * 14}" y="${90 + i * 58}" width="${560 - i * 28}" height="44" rx="8" fill="${i === 0 ? TEAL : PANEL}" opacity="${i === 0 ? 0.5 : 1}" stroke="${i === 0 ? TEAL : LINE}" stroke-width="3"/>`).join('')}
     <line x1="420" y1="368" x2="860" y2="368" stroke="${AMBER}" stroke-width="4" opacity=".7"/>`),

  // the field guide: a skill folder open on its SKILL.md, the three loading levels
  // beside it with the first two lit (metadata, then the body; resources stay dark)
  // ── SECRET MENU (sm-*) · guest-green identity, same overwrite contract ──
  // the roguelite: hospital wings stacked, one lit, the quarter goal meter below
  'sm-uncharted-general': frame(
    `${[0, 1, 2].map(i =>
      `<rect x="${400 + i * 30}" y="${70 + i * 90}" width="${480 - i * 60}" height="70" rx="8" fill="${i === 1 ? GGREEN : PANEL}" opacity="${i === 1 ? 0.45 : 1}" stroke="${i === 1 ? GGREEN : LINE}" stroke-width="3"/>`).join('')}
     <rect x="618" y="30" width="44" height="40" fill="none" stroke="${GGREEN}" stroke-width="3"/>
     <line x1="640" y1="30" x2="640" y2="10" stroke="${GGREEN}" stroke-width="3"/>
     <rect x="360" y="380" width="560" height="14" rx="7" fill="none" stroke="${LINE}" stroke-width="3"/>
     <rect x="360" y="380" width="380" height="14" rx="7" fill="${GGREEN}" opacity=".6"/>
     <line x1="800" y1="368" x2="800" y2="406" stroke="${AMBER}" stroke-width="4"/>`),
  // the camp: horizon, hills, pines, one tent
  'sm-camp-nauvoo': frame(
    `<line x1="60" y1="330" x2="1220" y2="330" stroke="${LINE}" stroke-width="3"/>
     <path d="M180 330 L400 160 L620 330 Z" fill="none" stroke="${GDEEP}" stroke-width="3" opacity=".8"/>
     <path d="M480 330 L760 110 L1040 330 Z" fill="none" stroke="${GDEEP}" stroke-width="3" opacity=".55"/>
     ${[300, 950, 1080].map(x =>
       `<path d="M${x} 330 L${x + 26} 268 L${x + 52} 330 Z" fill="${GGREEN}" opacity=".5"/><line x1="${x + 26}" y1="330" x2="${x + 26}" y2="344" stroke="${GDEEP}" stroke-width="4"/>`).join('')}
     <path d="M560 330 L640 230 L720 330 Z" fill="${GGREEN}" opacity=".75"/>
     <path d="M622 330 L640 290 L658 330 Z" fill="${BG}"/>
     <circle cx="1120" cy="90" r="34" fill="none" stroke="${INK}" stroke-width="3" opacity=".5"/>`),
  // the observatory: source nodes flowing to tools, one chain lit
  'sm-data-observatory': frame(
    `${[90, 200, 310].map((y, i) =>
      `<circle cx="220" cy="${y + 40}" r="22" fill="none" stroke="${i === 1 ? GGREEN : LINE}" stroke-width="3"/>`).join('')}
     ${[140, 260].map((y, i) =>
      `<rect x="580" y="${y}" width="120" height="56" rx="8" fill="${i === 0 ? GGREEN : 'none'}" opacity="${i === 0 ? 0.4 : 1}" stroke="${i === 0 ? GGREEN : LINE}" stroke-width="3"/>`).join('')}
     ${[100, 210, 320].map((y, i) =>
      `<circle cx="1040" cy="${y + 30}" r="26" fill="none" stroke="${i === 0 ? GGREEN : LINE}" stroke-width="3"/>`).join('')}
     <path d="M242 240 C400 240 430 168 580 168" fill="none" stroke="${GGREEN}" stroke-width="3"/>
     <path d="M700 168 C880 168 880 130 1014 130" fill="none" stroke="${GGREEN}" stroke-width="3"/>
     <path d="M242 130 C400 130 430 288 580 288" fill="none" stroke="${LINE}" stroke-width="3"/>
     <path d="M700 288 C880 288 880 350 1014 350" fill="none" stroke="${LINE}" stroke-width="3"/>
     <path d="M242 350 C420 350 460 288 580 288" fill="none" stroke="${LINE}" stroke-width="3"/>`),
  // the price finder: sorted bars, cheapest lit
  'sm-hospital-price-finder': frame(
    `<line x1="200" y1="380" x2="1080" y2="380" stroke="${LINE}" stroke-width="3"/>
     ${[110, 160, 205, 240, 285, 320].map((h, i) =>
      `<rect x="${240 + i * 135}" y="${380 - h}" width="90" height="${h}" rx="8" fill="${i === 0 ? GGREEN : 'none'}" opacity="${i === 0 ? 0.55 : 1}" stroke="${i === 0 ? GGREEN : LINE}" stroke-width="3"/>`).join('')}
     <circle cx="285" cy="220" r="34" fill="none" stroke="${GGREEN}" stroke-width="3" opacity=".7"/>
     <line x1="310" y1="245" x2="350" y2="285" stroke="${GGREEN}" stroke-width="3" opacity=".7"/>`),
  // alarm fatigue: one rhythm worth reading, buried under a pile of amber alarms
  'fun-alarm-fatigue': frame(
    `<path d="M80 250 L300 250 L318 190 L336 305 L354 250 L560 250 L578 178 L596 315 L614 250 L830 250 L848 196 L866 300 L884 250 L1200 250" fill="none" stroke="${GREEN}" stroke-width="4"/>
     ${[[150, 90, 150], [420, 60, 120], [700, 110, 170], [1010, 70, 130]].map(([x, y, w]) =>
       `<rect x="${x}" y="${y}" width="${w}" height="46" rx="9" fill="${AMBER}" opacity=".28" stroke="${AMBER}" stroke-width="3"/>`).join('')}
     ${[[240, 350], [530, 370], [900, 345], [1120, 375]].map(([x, y]) =>
       `<circle cx="${x}" cy="${y}" r="9" fill="${AMBER}" opacity=".45"/>`).join('')}
     <rect x="880" y="120" width="120" height="46" rx="9" fill="none" stroke="${RED}" stroke-width="4"/>
     <circle cx="940" cy="143" r="7" fill="${RED}"/>`),
  // the goat tracker: the traffic sparkline
  // the assembly tray: a grid, a flowmeter on the wall, a humidifier under it, a
  // tubing run to the patient, and the three connector states along the way
  'sm-device-assembly': frame(
    `${Array.from({length: 11}, (_, i) => `<line x1="${180 + i * 92}" y1="60" x2="${180 + i * 92}" y2="380" stroke="${LINE}" stroke-width="2"/>`).join('')}
     ${Array.from({length: 5}, (_, i) => `<line x1="180" y1="${60 + i * 80}" x2="1100" y2="${60 + i * 80}" stroke="${LINE}" stroke-width="2"/>`).join('')}
     <rect x="180" y="60" width="92" height="320" fill="${AMBER}" opacity=".12"/>
     <circle cx="226" cy="180" r="18" fill="${GDEEP}" stroke="${GGREEN}" stroke-width="3"/>
     <rect x="290" y="110" width="56" height="140" rx="8" fill="${INK}" opacity=".9"/>
     <rect x="310" y="126" width="16" height="80" rx="4" fill="${BG}"/>
     <rect x="290" y="262" width="56" height="100" rx="12" fill="${TEAL}" opacity=".55"/>
     <rect x="290" y="262" width="56" height="100" rx="12" fill="none" stroke="${TEAL}" stroke-width="3"/>
     <path d="M346 300 H900" stroke="${GGREEN}" stroke-width="10" stroke-linecap="round"/>
     <rect x="920" y="200" width="180" height="180" rx="14" fill="${BLUE}" opacity=".35"/>
     <rect x="920" y="200" width="180" height="180" rx="14" fill="none" stroke="${BLUE}" stroke-width="3"/>
     <circle cx="318" cy="256" r="12" fill="${GGREEN}"/>
     <circle cx="620" cy="140" r="12" fill="${AMBER}"/>
     <circle cx="760" cy="140" r="12" fill="${RED}"/>
     <path d="M560 140 H600 M640 140 H700 M780 140 H820" stroke="${INK}" stroke-width="4" stroke-linecap="round" opacity=".6"/>`),
  // er charge: the board is a grid of beds with a queue at the door and six cards in the hand, one lit
  'sm-er-charge': frame(
    `${Array.from({ length: 12 }, (_, i) => {
      const x = 340 + (i % 6) * 110, y = 70 + Math.floor(i / 6) * 100, hot = i === 2 || i === 9;
      return `<rect x="${x}" y="${y}" width="86" height="72" rx="8" fill="${hot ? GGREEN : PANEL}" opacity="${hot ? 0.45 : 1}" stroke="${hot ? GGREEN : LINE}" stroke-width="3"/>`;
    }).join('')}
     ${[0, 1, 2, 3, 4].map(i => `<circle cx="${140}" cy="${90 + i * 46}" r="14" fill="none" stroke="${i < 2 ? AMBER : LINE}" stroke-width="3"/>`).join('')}
     <line x1="220" y1="60" x2="220" y2="290" stroke="${LINE}" stroke-width="3" stroke-dasharray="8 8"/>
     ${[0, 1, 2, 3, 4, 5].map(i => `<rect x="${360 + i * 96}" y="316" width="78" height="96" rx="8" fill="${i === 1 ? GGREEN : 'none'}" opacity="${i === 1 ? 0.5 : 1}" stroke="${i === 1 ? GGREEN : LINE}" stroke-width="3" transform="rotate(${(i - 2.5) * 3} ${399 + i * 96} 364)"/>`).join('')}`),
  // uncharted regional: three facility cards across a region, one workforce pool feeding all three
  'sm-health-system': frame(
    `<path d="M120 300 C260 240 360 320 520 260 S820 200 1160 250" fill="none" stroke="${LINE}" stroke-width="3"/>
     ${[[230, 120, 150], [560, 90, 200], [900, 140, 170]].map(([x, y, w], i) =>
       `<rect x="${x}" y="${y}" width="${w}" height="110" rx="10" fill="${i === 1 ? GGREEN : PANEL}" opacity="${i === 1 ? 0.4 : 1}" stroke="${i === 1 ? GGREEN : LINE}" stroke-width="3"/>
        <rect x="${x + 18}" y="${y + 22}" width="${w - 36}" height="12" rx="6" fill="${INK}" opacity=".5"/>
        <rect x="${x + 18}" y="${y + 48}" width="${(w - 36) * 0.6}" height="12" rx="6" fill="${INK}" opacity=".35"/>`).join('')}
     <circle cx="640" cy="370" r="34" fill="none" stroke="${GGREEN}" stroke-width="3"/>
     ${[[305, 230], [660, 200], [985, 250]].map(([x, y]) => `<path d="M640 336 C640 300 ${x} 300 ${x} ${y}" fill="none" stroke="${GGREEN}" stroke-width="3" opacity=".7"/>`).join('')}`),
  'sm-goat-tracker': frame(
    `<line x1="140" y1="360" x2="1140" y2="360" stroke="${LINE}" stroke-width="3"/>
     <line x1="140" y1="360" x2="140" y2="80" stroke="${LINE}" stroke-width="3"/>
     <path d="M140 330 L280 300 L420 315 L560 250 L700 275 L840 190 L980 210 L1120 120" fill="none" stroke="${GGREEN}" stroke-width="4"/>
     <path d="M140 330 L280 300 L420 315 L560 250 L700 275 L840 190 L980 210 L1120 120 L1120 360 L140 360 Z" fill="${GGREEN}" opacity=".12"/>
     ${[[280, 300], [560, 250], [840, 190], [1120, 120]].map(([x, y]) =>
       `<circle cx="${x}" cy="${y}" r="8" fill="${GGREEN}"/>`).join('')}
     <circle cx="1120" cy="120" r="18" fill="none" stroke="${GGREEN}" stroke-width="3" opacity=".5"/>`)
};
};

module.exports = { vignettes, DARK, LIGHT };

if (require.main === module) (async () => {
  for (const { suffix, P } of THEMES) {
    for (const [id, svg] of Object.entries(vignettes(P))) {
      const out = path.join(OUT, id + suffix + '.png');
      await sharp(Buffer.from(svg)).png({ quality: 90 }).toFile(out);
      console.log('wrote', path.relative(process.cwd(), out));
    }
  }
})();
