/* ================================================================
   HU QR v1 · a QR code from a string, drawn as SVG (2026-10-01)

   Vital Stats puts a room's invite link on a big screen so a room full of
   phones can join by camera. The site's CSP admits no outside script and
   the link changes with every room, so the code is made here, in the
   browser, from the link.

   The standard encoder (ISO/IEC 18004), cut to what an invite needs: byte
   mode, error correction level M (about 15% of the code can be smudged or
   covered and it still reads), versions 1 to 10, so up to 213 bytes. The
   mask is the one the standard's penalty score picks. The method follows
   Project Nayuki's reference encoder (MIT), which spells out every table
   used below.

   HUQR.make(text)        -> { size, version, mask, dark(x, y) }, or null
                             when the text is longer than 213 bytes
   HUQR.svg(text, opts)   -> an <svg> string with the 4-module quiet zone
                             the standard asks for, or '' when too long
     opts.label           the accessible name (default "QR code")
     opts.dark, opts.light  module and background colors. A scanner wants
                             dark on light, so keep them that way round in
                             both themes.
================================================================ */
(function (root) {
  'use strict';

  // level M, versions 1 to 10: error-correction codewords per block, and blocks
  const ECC_PER_BLOCK = [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26];
  const BLOCKS = [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5];
  const MAX_VERSION = 10;

  /** @param {string} s */
  function utf8(s) {
    /** @type {number[]} */
    const out = [];
    for (const ch of String(s)) {
      const c = /** @type {number} */ (ch.codePointAt(0));
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xC0 | c >> 6, 0x80 | c & 63);
      else if (c < 0x10000) out.push(0xE0 | c >> 12, 0x80 | c >> 6 & 63, 0x80 | c & 63);
      else out.push(0xF0 | c >> 18, 0x80 | c >> 12 & 63, 0x80 | c >> 6 & 63, 0x80 | c & 63);
    }
    return out;
  }

  /* the modules left for data once the fixed patterns are drawn, in bits */
  /** @param {number} ver */
  function rawModules(ver) {
    let n = (16 * ver + 128) * ver + 64;
    if (ver >= 2) {
      const align = Math.floor(ver / 7) + 2;
      n -= (25 * align - 10) * align - 55;
      if (ver >= 7) n -= 36;
    }
    return n;
  }
  /** @param {number} ver */
  function dataCodewords(ver) { return Math.floor(rawModules(ver) / 8) - ECC_PER_BLOCK[ver] * BLOCKS[ver]; }

  /* Reed-Solomon over GF(256), the field the standard names (x^8 + x^4 + x^3 + x^2 + 1) */
  /** @param {number} x @param {number} y */
  function mul(x, y) {
    let z = 0;
    for (let i = 7; i >= 0; i--) {
      z = (z << 1) ^ ((z >>> 7) * 0x11D);
      z ^= ((y >>> i) & 1) * x;
    }
    return z;
  }
  /** @param {number} degree */
  function divisor(degree) {
    const r = new Array(degree).fill(0);
    r[degree - 1] = 1;
    let rootV = 1;
    for (let i = 0; i < degree; i++) {
      for (let j = 0; j < r.length; j++) {
        r[j] = mul(r[j], rootV);
        if (j + 1 < r.length) r[j] ^= r[j + 1];
      }
      rootV = mul(rootV, 0x02);
    }
    return r;
  }
  /** @param {number[]} data @param {number[]} div */
  function remainder(data, div) {
    const r = div.map(() => 0);
    for (const b of data) {
      const f = b ^ /** @type {number} */ (r.shift());
      r.push(0);
      div.forEach((c, i) => { r[i] ^= mul(c, f); });
    }
    return r;
  }

  /* the data cut into blocks, each block given its error correction, then interleaved */
  /** @param {number[]} data @param {number} ver */
  function interleave(data, ver) {
    const nBlocks = BLOCKS[ver], eccLen = ECC_PER_BLOCK[ver];
    const raw = Math.floor(rawModules(ver) / 8);
    const nShort = nBlocks - raw % nBlocks, shortLen = Math.floor(raw / nBlocks);
    const div = divisor(eccLen);
    /** @type {number[][]} */
    const blocks = [];
    for (let i = 0, k = 0; i < nBlocks; i++) {
      const dat = data.slice(k, k + shortLen - eccLen + (i < nShort ? 0 : 1));
      k += dat.length;
      const ecc = remainder(dat, div);
      if (i < nShort) dat.push(0);                     // a gap, skipped below, so every block lines up
      blocks.push(dat.concat(ecc));
    }
    /** @type {number[]} */
    const out = [];
    for (let i = 0; i < blocks[0].length; i++) {
      blocks.forEach((b, j) => { if (i !== shortLen - eccLen || j >= nShort) out.push(b[i]); });
    }
    return out;
  }

  /** @param {number} ver */
  function alignments(ver) {
    if (ver === 1) return [];
    const n = Math.floor(ver / 7) + 2, size = ver * 4 + 17;
    const step = Math.ceil((ver * 4 + 4) / (n * 2 - 2)) * 2;
    const out = [6];
    for (let p = size - 7; out.length < n; p -= step) out.splice(1, 0, p);
    return out;
  }

  /** @param {string} text */
  function make(text) {
    const bytes = utf8(text);
    let ver = 1;
    for (; ver <= MAX_VERSION; ver++) {
      const cc = ver <= 9 ? 8 : 16;
      if (4 + cc + bytes.length * 8 <= dataCodewords(ver) * 8) break;
    }
    if (ver > MAX_VERSION) return null;

    /* the bit stream: byte mode, the count, the bytes, a terminator, then the standard's pad bytes */
    /** @type {number[]} */
    const bits = [];
    /** @param {number} v @param {number} n */
    const put = (v, n) => { for (let i = n - 1; i >= 0; i--) bits.push((v >>> i) & 1); };
    put(4, 4);
    put(bytes.length, ver <= 9 ? 8 : 16);
    bytes.forEach(b => put(b, 8));
    const cap = dataCodewords(ver) * 8;
    put(0, Math.min(4, cap - bits.length));
    put(0, (8 - bits.length % 8) % 8);
    for (let pad = 0xEC; bits.length < cap; pad ^= 0xEC ^ 0x11) put(pad, 8);
    /** @type {number[]} */
    const data = [];
    for (let i = 0; i < bits.length; i += 8) { let b = 0; for (let j = 0; j < 8; j++) b = b << 1 | bits[i + j]; data.push(b); }
    const words = interleave(data, ver);

    const size = ver * 4 + 17;
    /** @type {boolean[][]} */
    const mod = [];
    /** @type {boolean[][]} */
    const fixed = [];
    for (let y = 0; y < size; y++) { mod.push(new Array(size).fill(false)); fixed.push(new Array(size).fill(false)); }
    /** @param {number} x @param {number} y @param {boolean} dark */
    const set = (x, y, dark) => { mod[y][x] = dark; fixed[y][x] = true; };

    /* the fixed patterns: timing lines, three finders, the alignment squares, room for format and version */
    for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    for (const [cx, cy] of [[3, 3], [size - 4, 3], [3, size - 4]]) {
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
        const d = Math.max(Math.abs(dx), Math.abs(dy)), x = cx + dx, y = cy + dy;
        if (x >= 0 && x < size && y >= 0 && y < size) set(x, y, d !== 2 && d !== 4);
      }
    }
    const al = alignments(ver);
    al.forEach((ay, i) => al.forEach((ax, j) => {
      if ((i === 0 && j === 0) || (i === 0 && j === al.length - 1) || (i === al.length - 1 && j === 0)) return;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }));
    /** @param {number} mask */
    const format = mask => {
      const v = (0 << 3) | mask;                       // level M is 00
      let r = v;
      for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
      const b = ((v << 10) | r) ^ 0x5412;
      /** @param {number} i */
      const bit = i => ((b >>> i) & 1) === 1;
      for (let i = 0; i <= 5; i++) set(8, i, bit(i));
      set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
      for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
      for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i));
      for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i));
      set(8, size - 8, true);                          // the one module that is always dark
    };
    format(0);
    if (ver >= 7) {
      let r = ver;
      for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1F25);
      const b = (ver << 12) | r;
      for (let i = 0; i < 18; i++) {
        const dark = ((b >>> i) & 1) === 1, a = size - 11 + i % 3, c = Math.floor(i / 3);
        set(a, c, dark); set(c, a, dark);
      }
    }

    /* the data, in the standard's zigzag: two columns at a time, up then down, from the right */
    let i = 0;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let v = 0; v < size; v++) for (let j = 0; j < 2; j++) {
        const x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - v : v;
        if (!fixed[y][x] && i < words.length * 8) { mod[y][x] = ((words[i >>> 3] >>> (7 - (i & 7))) & 1) === 1; i++; }
      }
    }

    /** @param {number} m @param {number} x @param {number} y */
    const flips = (m, x, y) => {
      switch (m) {
        case 0: return (x + y) % 2 === 0;
        case 1: return y % 2 === 0;
        case 2: return x % 3 === 0;
        case 3: return (x + y) % 3 === 0;
        case 4: return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
        case 5: return x * y % 2 + x * y % 3 === 0;
        case 6: return (x * y % 2 + x * y % 3) % 2 === 0;
        default: return ((x + y) % 2 + x * y % 3) % 2 === 0;
      }
    };
    /** @param {number} m */
    const applyMask = m => { for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!fixed[y][x] && flips(m, x, y)) mod[y][x] = !mod[y][x]; };

    /* the standard's penalty: long runs, 2x2 blocks, finder look-alikes, and an uneven dark share */
    /** @param {number[]} h */
    const finderLike = h => {
      const n = h[1], core = n > 0 && h[2] === n && h[3] === n * 3 && h[4] === n && h[5] === n;
      return (core && h[0] >= n * 4 && h[6] >= n ? 1 : 0) + (core && h[6] >= n * 4 && h[0] >= n ? 1 : 0);
    };
    /** @param {number} len @param {number[]} h */
    const addRun = (len, h) => { if (h[0] === 0) len += size; h.pop(); h.unshift(len); };
    /** @param {(a: number, b: number) => boolean} at */
    const linePenalty = at => {
      let p = 0;
      for (let a = 0; a < size; a++) {
        let color = false, run = 0;
        const h = [0, 0, 0, 0, 0, 0, 0];
        for (let b = 0; b < size; b++) {
          if (at(a, b) === color) { run++; if (run === 5) p += 3; else if (run > 5) p++; }
          else { addRun(run, h); if (!color) p += finderLike(h) * 40; color = at(a, b); run = 1; }
        }
        if (color) { addRun(run, h); run = 0; }
        run += size; addRun(run, h);
        p += finderLike(h) * 40;
      }
      return p;
    };
    const penalty = () => {
      let p = linePenalty((y, x) => mod[y][x]) + linePenalty((x, y) => mod[y][x]);
      let dark = 0;
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        if (mod[y][x]) dark++;
        if (y < size - 1 && x < size - 1) { const c = mod[y][x]; if (c === mod[y][x + 1] && c === mod[y + 1][x] && c === mod[y + 1][x + 1]) p += 3; }
      }
      const total = size * size;
      p += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
      return p;
    };
    let best = 0, low = Infinity;
    for (let m = 0; m < 8; m++) {
      applyMask(m); format(m);
      const p = penalty();
      if (p < low) { low = p; best = m; }
      applyMask(m);                                    // a mask is its own undo
    }
    applyMask(best); format(best);

    return { size, version: ver, mask: best, dark: (/** @type {number} */ x, /** @type {number} */ y) => x >= 0 && y >= 0 && x < size && y < size && mod[y][x] };
  }

  /** @param {string} s */
  const attr = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

  /** @param {string} text @param {{ label?: string, dark?: string, light?: string }} [opts] */
  function svg(text, opts) {
    const q = make(text);
    if (!q) return '';
    const o = opts || {}, n = q.size + 8;
    let d = '';
    for (let y = 0; y < q.size; y++) {
      for (let x = 0; x < q.size; x++) {
        if (!q.dark(x, y)) continue;
        let run = 1;
        while (q.dark(x + run, y)) run++;
        d += 'M' + (x + 4) + ' ' + (y + 4) + 'h' + run + 'v1h-' + run + 'z';
        x += run - 1;
      }
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + n + ' ' + n + '" role="img" aria-label="' + attr(o.label || 'QR code') + '" shape-rendering="crispEdges">'
      + '<rect width="' + n + '" height="' + n + '" fill="' + attr(o.light || '#ffffff') + '"/>'
      + '<path fill="' + attr(o.dark || '#0d1117') + '" d="' + d + '"/></svg>';
  }

  root.HUQR = { make, svg, MAX_VERSION };
})(typeof window !== 'undefined' ? window : globalThis);
