'use strict';
/**
 * lib/zip.js: download a public file once, then read a zip's entries without unpacking it to disk.
 *
 * Moved out of pull/hcris.js on 2026-10-03 when the IPEDS pull (pull/ipeds.js) became the second reader.
 * No dependencies: the table of contents comes from the zip's central directory, and an entry inflates
 * as it streams, so a file of a gigabyte or more never sits in memory.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const zlib = require('zlib');
const readline = require('readline');

const UA = 'HealthcareUncharted/1.0 (david.eitel.pcpal@gmail.com)';

/** @param {string} url @param {string} file */
function download(url, file) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': UA } }, (res) => {
      if (res.statusCode !== 200) { res.resume(); return reject(new Error('HTTP ' + res.statusCode + ' ' + url)); }
      fs.mkdirSync(path.dirname(file), { recursive: true });
      const tmp = file + '.part', out = fs.createWriteStream(tmp);
      res.pipe(out);
      res.on('error', reject); out.on('error', reject);
      out.on('finish', () => out.close(() => { fs.renameSync(tmp, file); resolve(undefined); }));
    }).on('error', reject);
  });
}

/* the zip's table of contents, read from the central directory at the end of the file */
/** @param {string} file */
function zipEntries(file) {
  const fd = fs.openSync(file, 'r');
  const size = fs.fstatSync(fd).size;
  const tailLen = Math.min(size, 65557), tail = Buffer.alloc(tailLen);
  fs.readSync(fd, tail, 0, tailLen, size - tailLen);
  let i = tailLen - 22;
  while (i >= 0 && tail.readUInt32LE(i) !== 0x06054b50) i--;
  if (i < 0) throw new Error('not a zip (no end of central directory)');
  const count = tail.readUInt16LE(i + 10), cdSize = tail.readUInt32LE(i + 12), cdOff = tail.readUInt32LE(i + 16);
  const cd = Buffer.alloc(cdSize); fs.readSync(fd, cd, 0, cdSize, cdOff);
  const out = [];
  for (let p = 0, n = 0; n < count; n++) {
    if (cd.readUInt32LE(p) !== 0x02014b50) throw new Error('bad central directory entry');
    const method = cd.readUInt16LE(p + 10), csize = cd.readUInt32LE(p + 20), usize = cd.readUInt32LE(p + 24);
    const nl = cd.readUInt16LE(p + 28), xl = cd.readUInt16LE(p + 30), cl = cd.readUInt16LE(p + 32), lho = cd.readUInt32LE(p + 42);
    const name = cd.toString('utf8', p + 46, p + 46 + nl);
    const lh = Buffer.alloc(30); fs.readSync(fd, lh, 0, 30, lho);
    const start = lho + 30 + lh.readUInt16LE(26) + lh.readUInt16LE(28);
    out.push({ name, method, csize, usize, start });
    p += 46 + nl + xl + cl;
  }
  fs.closeSync(fd);
  return out;
}

/* one zip entry as a stream of text lines, inflated as it is read */
/** @param {string} file @param {{start: number, csize: number, method: number}} e */
function entryLines(file, e) {
  const raw = fs.createReadStream(file, { start: e.start, end: e.start + e.csize - 1 });
  const body = e.method === 0 ? raw : raw.pipe(zlib.createInflateRaw());
  return readline.createInterface({ input: body, crlfDelay: Infinity });
}

/* one entry read whole, for the small ones (an xlsx part, a dictionary) */
/** @param {string} file @param {{start: number, csize: number, method: number}} e */
function entryBuffer(file, e) {
  const b = Buffer.alloc(e.csize), fd = fs.openSync(file, 'r');
  fs.readSync(fd, b, 0, e.csize, e.start); fs.closeSync(fd);
  return e.method ? zlib.inflateRawSync(b) : b;
}

/* an .xlsx is a zip of XML: every sheet as rows of cell text, by sheet name. Enough for the federal data dictionaries
   (shared strings, inline strings, numbers); it does not evaluate formulas or read styles. */
/** @param {string} file @returns {Record<string, string[][]>} */
function xlsxSheets(file) {
  const es = zipEntries(file);
  const part = (/** @type {string} */ n) => { const e = es.find((x) => x.name === n); return e ? entryBuffer(file, e).toString('utf8') : ''; };
  const unx = (/** @type {string} */ s) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
  const ss = [...part('xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => unx(m[1]));
  const names = [...part('xl/workbook.xml').matchAll(/<sheet [^>]*name="([^"]+)"/g)].map((m) => m[1]);
  /** @type {Record<string, string[][]>} */
  const out = {};
  for (const e of es.filter((x) => /^xl\/worksheets\/sheet\d+\.xml$/.test(x.name))) {
    const i = +(/** @type {RegExpMatchArray} */ (e.name.match(/sheet(\d+)/)))[1] - 1;
    out[names[i] || e.name] = [...entryBuffer(file, e).toString('utf8').matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)].map((r) =>
      [...r[1].matchAll(/<c r="[A-Z]+\d+"([^>]*?)(?:\/>|>(?:<f>[^<]*<\/f>)?(?:<v>([^<]*)<\/v>|<is><t[^>]*>([^<]*)<\/t><\/is>)?<\/c>)/g)]
        .map((c) => (/t="s"/.test(c[1]) ? ss[+c[2]] : unx(c[2] || c[3] || ''))));
  }
  return out;
}

/** one CSV line, quotes honored @param {string} line */
function csv(line) {
  const out = []; let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) { if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}
/* the first CSV inside a zip, as objects keyed by its header row (the federal files open with a byte order mark).
   Moved here from pull/ipeds.js on 2026-10-03 when check-schools.js became the second reader. */
/** @param {string} zip @returns {Promise<Record<string, string>[]>} */
async function csvRows(zip) {
  const e = zipEntries(zip).find((x) => /\.csv$/i.test(x.name));
  if (!e) throw new Error('no csv in ' + zip);
  /** @type {Record<string, string>[]} */
  const out = []; let head = null;
  for await (const line of entryLines(zip, e)) {
    if (!line.trim()) continue;
    const f = csv(line.charCodeAt(0) === 0xFEFF ? line.slice(1) : line);
    if (!head) { head = f; continue; }
    /** @type {Record<string, string>} */
    const r = {}; head.forEach((h, i) => { r[h] = f[i]; }); out.push(r);
  }
  return out;
}

module.exports = { download, zipEntries, entryLines, entryBuffer, xlsxSheets, csv, csvRows, UA };
