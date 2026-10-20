'use strict';
/**
 * prune-site.js · a full build leaves nothing behind it did not make.
 *
 * WHY. David, 2026-10-07: "Can we build in a function to make sure we delete old pages or archive them so they don't
 * get found". Eleventy writes into _site and never deletes, so a page that moved or was removed stayed in the build
 * folder on this computer: when Device Assembly moved to /fun/device-assembly/, the hub, the phone check and the ledger
 * could all still open the old /secret-menu/device-assembly/ copy. Netlify builds from a clean copy every time, so the
 * live site never carried one; this is for everything on this computer that reads _site.
 *
 * WHAT. After a full build (`npx @11ty/eleventy`, `npm run build`, not the live-reload server's partial rebuilds), every
 * file in _site is kept if this build wrote it (a page, the sitemap, the feed) or if it is a copy of a file that is
 * still in src (assets, brand, downloads). Anything else is a leftover and is removed, with the folders it leaves empty.
 * Nothing is lost: _site is generated, and every page that ever existed is in git history.
 *
 * SAFETY. It only ever touches the build folder, and it stops without removing anything if the list is suspiciously
 * long (a build that wrote nothing, a wrong folder): `limit`, 400 files by default.
 */
const fs = require('fs');
const path = require('path');

/**
 * @param {{ out: string, root: string, written: string[], passthrough: Array<[string, string]>, limit?: number, dry?: boolean }} o
 *   out          the build folder
 *   root         the repo, which the passthrough sources are relative to
 *   written      the output paths this build wrote (Eleventy's results)
 *   passthrough  [source, output] pairs, as given to addPassthroughCopy
 * @returns {{ removed: string[], refused: string }}
 */
function pruneSite(o) {
  const out = path.resolve(o.out);
  const limit = o.limit == null ? 400 : o.limit;
  if (!fs.existsSync(out)) return { removed: [], refused: '' };
  const keep = new Set(o.written.filter(Boolean).map((p) => path.resolve(o.root, p)));
  if (!keep.size) return { removed: [], refused: 'the build wrote nothing, so nothing was removed' };
  // A build sent somewhere else (`--output tmp/x`) still names this folder as its output, and wrote nothing in it, so
  // every page here read as left behind: one such build emptied _site under a running full check (2026-10-19).
  if ([...keep].some((p) => !p.startsWith(out + path.sep))) return { removed: [], refused: 'the build wrote outside ' + out + ', so nothing there was removed' };
  const pass = o.passthrough.map(([src, dst]) => [path.resolve(o.root, src), dst.replace(/\\/g, '/').replace(/^\.?\/+|\/+$/g, '')]);

  /** @type {string[]} */
  const stale = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, e.name);
      if (e.isDirectory()) { walk(abs); continue; }
      if (keep.has(abs)) continue;
      const rel = path.relative(out, abs).replace(/\\/g, '/');
      const from = pass.find(([, dst]) => rel === dst || rel.startsWith(dst + '/'));
      if (from && fs.existsSync(from[0] + rel.slice(from[1].length))) continue;   // a copy of a source that is still there
      stale.push(abs);
    }
  })(out);

  if (stale.length > limit) return { removed: [], refused: `${stale.length} files would go, more than the ${limit} a build should ever leave behind; nothing was removed` };
  if (!o.dry) {
    for (const f of stale) fs.rmSync(f, { force: true });
    // the folders a removed page leaves empty
    (function sweep(dir) {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) if (e.isDirectory()) sweep(path.join(dir, e.name));
      if (dir !== out && !fs.readdirSync(dir).length) fs.rmdirSync(dir);
    })(out);
  }
  return { removed: stale.map((f) => path.relative(out, f).replace(/\\/g, '/')), refused: '' };
}

/** "secret-menu/device-assembly/index.html" -> "/secret-menu/device-assembly/", for the build's log line */
const pageOf = (rel) => '/' + rel.replace(/(^|\/)index\.html$/, '$1');

module.exports = { pruneSite, pageOf };
