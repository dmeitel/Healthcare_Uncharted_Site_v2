/* ================================================================
   BUILD FAVICONS / APP ICONS
   node scripts/build-favicons.js

   Rasterizes the two authored brand marks into every icon size the
   site declares. Run it whenever the mark SVGs change.

   Why this exists: the light-family rasters (favicon-16/32/48,
   apple-touch-icon, icon-192, icon-512) were generated 2026-07-06 by
   something that CROPPED instead of contained, so the hex came out
   zoomed and sliced off at an angle. The SVG sources were always fine.
   This script is the reproducible replacement.

   Sources (never touched, only read):
     brand/favicon.svg      light art: near-white hex, blue stroke + H, teal U
     brand/hu-mark-dark.svg dark art:  dark hex, bright blue stroke, pale H + teal U

   Rule: render big, TRIM the viewBox padding, then contain the mark in
   the output box. The authored viewBox carries wide empty margins; at
   16px those margins eat the art and the hex reads as a smudge, so the
   trim is what makes the small sizes legible. Contain (never cover)
   is what guarantees the mark is centered and never sliced.
================================================================ */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const BRAND = path.join(__dirname, '..', 'src', 'brand');
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };
const FIELD = '#0d1117';   // manifest background_color: the app-icon field

/* Read a mark and pin an explicit pixel size on it. The authored files
   carry width="100%", which some rasterizers resolve to nothing useful. */
function markAt(file, px) {
  const svg = fs.readFileSync(path.join(BRAND, file), 'utf8');
  return Buffer.from(svg.replace('width="100%"', 'width="' + px + '" height="' + px + '"'));
}

/* The mark, rasterized big and cropped down to its own ink. */
function inked(src, px) {
  return sharp(markAt(src, px)).trim({ threshold: 1 });
}

/* Tab favicons: transparent, mark fills the box. Rendered at 8x and
   downsampled so the 16px step keeps clean edges on the hex points. */
async function favicon(src, px, out) {
  const art = await inked(src, px * 8).png().toBuffer();
  await sharp(art)
    .resize(px, px, { fit: 'contain', background: TRANSPARENT, kernel: 'lanczos3' })
    .png({ compressionLevel: 9 })
    .toFile(path.join(BRAND, out));
  return out;
}

/* App icons: solid brand field, mark inset. iOS flattens transparency to
   black and Android maskable icons crop to a center circle, so the art
   has to sit inside a safe zone rather than run to the edge. */
async function appIcon(src, px, inset, out) {
  const box = Math.round(px * inset);
  const art = await inked(src, box * 4)
    .resize(box, box, { fit: 'contain', background: TRANSPARENT, kernel: 'lanczos3' })
    .png()
    .toBuffer();
  await sharp({ create: { width: px, height: px, channels: 4, background: FIELD } })
    .composite([{ input: art, gravity: 'centre' }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(BRAND, out));
  return out;
}

/* ICO, hand-assembled. Every browser that still reads .ico accepts PNG
   payloads inside it, so each entry is just one of the PNGs above.
   Layout: 6-byte header, one 16-byte directory entry per image, blobs. */
async function ico(sizes, out) {
  const blobs = [];
  for (const px of sizes) {
    const art = await inked('favicon.svg', px * 8).png().toBuffer();
    blobs.push(await sharp(art)
      .resize(px, px, { fit: 'contain', background: TRANSPARENT, kernel: 'lanczos3' })
      .png({ compressionLevel: 9 })
      .toBuffer());
  }
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);            // reserved
  header.writeUInt16LE(1, 2);            // 1 = icon
  header.writeUInt16LE(sizes.length, 4);

  const dir = Buffer.alloc(16 * sizes.length);
  let offset = 6 + dir.length;
  sizes.forEach(function (px, i) {
    const at = i * 16;
    dir.writeUInt8(px >= 256 ? 0 : px, at);      // 0 means 256
    dir.writeUInt8(px >= 256 ? 0 : px, at + 1);
    dir.writeUInt8(0, at + 2);                   // palette count
    dir.writeUInt8(0, at + 3);                   // reserved
    dir.writeUInt16LE(1, at + 4);                // color planes
    dir.writeUInt16LE(32, at + 6);               // bits per pixel
    dir.writeUInt32LE(blobs[i].length, at + 8);
    dir.writeUInt32LE(offset, at + 12);
    offset += blobs[i].length;
  });

  fs.writeFileSync(path.join(BRAND, out), Buffer.concat([header, dir].concat(blobs)));
  return out + ' (' + sizes.join('/') + ')';
}

(async function () {
  const made = [];

  for (const px of [16, 32, 48]) {
    made.push(await favicon('favicon.svg', px, 'favicon-' + px + '.png'));
    made.push(await favicon('hu-mark-dark.svg', px, 'favicon-' + px + '-dark.png'));
  }

  /* 0.76 keeps the hex clear of Apple's rounded corner. 0.70 keeps it
     inside the Android maskable safe circle, which bites deeper. */
  made.push(await appIcon('favicon.svg', 180, 0.76, 'apple-touch-icon.png'));
  made.push(await appIcon('favicon.svg', 192, 0.70, 'icon-192.png'));
  made.push(await appIcon('favicon.svg', 512, 0.70, 'icon-512.png'));

  made.push(await ico([16, 32, 48], 'favicon.ico'));

  console.log('Wrote ' + made.length + ' icons to src/brand/');
  made.forEach(function (m) { console.log('  ' + m); });
  console.log('\nfavicon.svg and hu-mark-dark.svg are the sources and were not modified.');
})();
