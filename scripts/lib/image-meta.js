'use strict';
/**
 * image-meta.js · what a picture says about itself.
 *
 * A phone photo carries the camera, the moment it was taken and often where, in EXIF, XMP or
 * IPTC blocks that never show on the page. A photo in a patient story with a date and a place
 * in it is an identifier even when the picture shows nothing (HIPAA Safe Harbor: dates and
 * places smaller than a state). The broken arm piece's images were scrubbed by hand on
 * 2026-10-03; this makes the check repeatable. Used by the writing screen (scripts/writing.js)
 * and the gate (tests/writing-phi.test.js).
 *
 * Reads JPEG segments, PNG chunks and WebP chunks. No dependencies.
 */

/** @typedef {{type:string, exif:boolean, gps:boolean, xmp:boolean, iptc:boolean, text:string[], fields:Object<string,string>}} ImageMeta */

/** @param {Buffer} buf @returns {ImageMeta} */
function readImageMeta(buf) {
  /** @type {ImageMeta} */
  const out = { type: 'other', exif: false, gps: false, xmp: false, iptc: false, text: [], fields: {} };
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8) {
    out.type = 'jpeg';
    let p = 2;
    while (p + 4 <= buf.length) {
      if (buf[p] !== 0xff) break;
      const marker = buf[p + 1];
      if (marker === 0xd9 || marker === 0xda) break;          // end of image, or start of the picture data
      if (marker >= 0xd0 && marker <= 0xd7) { p += 2; continue; }
      const len = buf.readUInt16BE(p + 2);
      const seg = buf.subarray(p + 4, p + 2 + len);
      if (marker === 0xe1 && seg.subarray(0, 6).toString('latin1') === 'Exif\0\0') { out.exif = true; tiff(seg.subarray(6), out); }
      else if (marker === 0xe1 && /^http:\/\/ns\.adobe\.com\/xap/.test(seg.subarray(0, 40).toString('latin1'))) { out.xmp = true; xmp(seg.toString('utf8'), out); }
      else if (marker === 0xed && seg.subarray(0, 13).toString('latin1') === 'Photoshop 3.0') out.iptc = true;
      else if (marker === 0xfe) out.text.push(seg.toString('utf8').slice(0, 120));
      p += 2 + len;
    }
  } else if (buf.length > 8 && buf.subarray(1, 4).toString('latin1') === 'PNG') {
    out.type = 'png';
    let p = 8;
    while (p + 8 <= buf.length) {
      const len = buf.readUInt32BE(p);
      const kind = buf.subarray(p + 4, p + 8).toString('latin1');
      const data = buf.subarray(p + 8, p + 8 + len);
      if (kind === 'eXIf') { out.exif = true; tiff(data, out); }
      else if (kind === 'tEXt' || kind === 'iTXt' || kind === 'zTXt') {
        const key = data.subarray(0, Math.max(0, data.indexOf(0))).toString('latin1');
        if (key === 'XML:com.adobe.xmp') { out.xmp = true; xmp(data.toString('utf8'), out); }
        // a drawing tool's own stamp is not about anyone; an author, a comment or a time can be
        else if (!/^(?:Software|Title|Description)$/.test(key)) out.text.push(key);
      }
      if (kind === 'IEND') break;
      p += 12 + len;
    }
  } else if (buf.length > 12 && buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP') {
    out.type = 'webp';
    let p = 12;
    while (p + 8 <= buf.length) {
      const kind = buf.subarray(p, p + 4).toString('latin1');
      const len = buf.readUInt32LE(p + 4);
      const data = buf.subarray(p + 8, p + 8 + len);
      if (kind === 'EXIF') { out.exif = true; tiff(data.subarray(0, 6).toString('latin1') === 'Exif\0\0' ? data.subarray(6) : data, out); }
      else if (kind === 'XMP ') { out.xmp = true; xmp(data.toString('utf8'), out); }
      p += 8 + len + (len % 2);
    }
  }
  return out;
}

const TAGS = { 0x010f: 'Make', 0x0110: 'Model', 0x0131: 'Software', 0x0132: 'DateTime', 0x013b: 'Artist', 0x8298: 'Copyright', 0x9003: 'DateTimeOriginal', 0x9004: 'DateTimeDigitized', 0xa430: 'CameraOwnerName', 0xa431: 'BodySerialNumber', 0x010e: 'ImageDescription' };

/** EXIF's TIFF structure: IFD0, then the Exif and GPS sub-directories it points to.
 *  @param {Buffer} t @param {ImageMeta} out */
function tiff(t, out) {
  if (t.length < 8) return;
  const le = t.subarray(0, 2).toString('latin1') === 'II';
  const u16 = (/** @type {number} */ o) => (o + 2 <= t.length ? (le ? t.readUInt16LE(o) : t.readUInt16BE(o)) : 0);
  const u32 = (/** @type {number} */ o) => (o + 4 <= t.length ? (le ? t.readUInt32LE(o) : t.readUInt32BE(o)) : 0);
  const seen = new Set();
  const ifd = (/** @type {number} */ off) => {
    if (!off || off >= t.length || seen.has(off)) return;
    seen.add(off);
    const n = u16(off);
    for (let i = 0; i < n && i < 400; i++) {
      const e = off + 2 + i * 12;
      if (e + 12 > t.length) break;
      const tag = u16(e), type = u16(e + 2), count = u32(e + 4), val = u32(e + 8);
      if (tag === 0x8769) ifd(val);
      else if (tag === 0x8825) {
        // A GPS directory can exist and be empty; it counts when it holds a position.
        const g = val, gn = u16(g);
        for (let k = 0; k < gn && k < 64; k++) { const gt = u16(g + 2 + k * 12); if (gt === 2 || gt === 4) out.gps = true; }
      } else if (TAGS[tag] && type === 2) {
        const at = count <= 4 ? e + 8 : val;
        out.fields[TAGS[tag]] = t.subarray(at, at + count).toString('latin1').replace(/\0+$/, '').trim();
      }
    }
  };
  ifd(u32(4));
}

/** XMP is XML: look for a position and a capture date. @param {string} s @param {ImageMeta} out */
function xmp(s, out) {
  if (/exif:GPSLatitude|GPSLatitude=/.test(s)) out.gps = true;
  const d = s.match(/(?:xmp:CreateDate|photoshop:DateCreated|exif:DateTimeOriginal)[=>"]+([^"<]+)/);
  if (d) out.fields.XmpDate = d[1];
}

/** One line a person can read. @param {ImageMeta} m */
function describe(m) {
  const bits = [];
  if (m.gps) bits.push('a GPS location');
  for (const k of ['DateTimeOriginal', 'DateTime', 'XmpDate']) if (m.fields[k]) { bits.push('the date taken (' + m.fields[k] + ')'); break; }
  if (m.fields.Make || m.fields.Model) bits.push('the camera (' + [m.fields.Make, m.fields.Model].filter(Boolean).join(' ') + ')');
  if (m.fields.CameraOwnerName || m.fields.Artist) bits.push('a name (' + (m.fields.CameraOwnerName || m.fields.Artist) + ')');
  if (m.fields.BodySerialNumber) bits.push('a serial number');
  if (!bits.length && (m.exif || m.xmp || m.iptc)) bits.push('a metadata block (' + [m.exif && 'EXIF', m.xmp && 'XMP', m.iptc && 'IPTC'].filter(Boolean).join(', ') + ')');
  return bits.length ? 'Carries ' + bits.join(', ') + '.' : 'Clean: no camera, date or location data.';
}

module.exports = { readImageMeta, describe };
