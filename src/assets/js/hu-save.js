/* ================================================================
   HU SAVE v1 — one save-string codec for every game (2026-09-20)

   A run packs to a plain object; this turns it into one copy-paste
   string and back:
     <PREFIX>.  + base64(deflate-raw(JSON))   when CompressionStream exists
     <PREFIX>R. + base64(utf-8 JSON)          raw fallback, always readable
   The prefix names the game and the format version: 'HUG1.' is the
   hospital game, 'HUS1.' the regional one. decode forgives the
   whitespace a chat app wraps into a long string.

   Lifted from two hand copies that differed only by prefix. No
   dependencies. Everything hangs off window.HUSave. Callable headless:
   node has had CompressionStream since 18.

   HUSave.codec('HUG1.') -> { prefix, rawPrefix, encode(obj), decode(str) }
================================================================ */
(function (root) {
  'use strict';

  /** @param {Uint8Array} b */
  const b64FromBytes = b => {
    let s = '';
    for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, Array.from(b.subarray(i, i + 0x8000)));
    return btoa(s);
  };
  /** @param {string} str */
  const bytesFromB64 = str => {
    const s = atob(str);
    const b = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i);
    return b;
  };
  const canDeflate = () => typeof CompressionStream !== 'undefined' && typeof Response !== 'undefined' && typeof Blob !== 'undefined';

  /** @param {string} prefix  like 'HUG1.' : letters and digits, then a dot */
  function codec(prefix) {
    if (typeof prefix !== 'string' || !/^[A-Z0-9]+\.$/.test(prefix)) throw new Error('HUSave.codec: prefix like "HUG1."');
    const RAW = prefix.slice(0, -1) + 'R.';

    /** @param {any} obj */
    async function encode(obj) {
      const json = JSON.stringify(obj);
      if (canDeflate()) {
        const st = new Blob([json]).stream().pipeThrough(new CompressionStream('deflate-raw'));
        return prefix + b64FromBytes(new Uint8Array(await new Response(st).arrayBuffer()));
      }
      return RAW + btoa(unescape(encodeURIComponent(json)));
    }

    /** @param {string} str */
    async function decode(str) {
      str = String(str || '').trim().replace(/\s+/g, '');
      if (str.indexOf(RAW) === 0) return JSON.parse(decodeURIComponent(escape(atob(str.slice(RAW.length)))));
      if (str.indexOf(prefix) !== 0) throw new Error('not a save string');
      const st = new Blob([bytesFromB64(str.slice(prefix.length))]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      return JSON.parse(await new Response(st).text());
    }

    return { prefix, rawPrefix: RAW, encode, decode };
  }

  root.HUSave = { codec, b64FromBytes, bytesFromB64 };
})(typeof window !== 'undefined' ? window : globalThis);
