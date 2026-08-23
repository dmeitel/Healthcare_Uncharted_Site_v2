/* Published site content that deep-links to atlas tiles, inverted at build time so
   a tile can list the writing that points at it.

   This used to be a Nunjucks loop living INSIDE the atlas page's inline <script>,
   which is exactly what pinned that script to the template and kept 165KB of JS
   out of a cacheable module. Same move multi-lens-map already made: the data
   becomes a JSON island the module reads, the logic becomes real JS that tsc can
   see. See docs/HU-BUILD-HARDENING-2026-08-22.md section 3.

   Keys are 'zoneId/nodeId', matching the hash format atlas navigates by.
   selectNode dedups by url, so a tile whose built-in links already point at a
   module will not double-list it.

   Order is load-bearing for display: rounds, then modules, then talks. */

const rounds = require('./rounds.js');
const learn  = require('./learn.js');

module.exports = () => {
  /** @type {Record<string, Array<{label:string,url:string,icon:string}>>} */
  const map = {};
  const push = (to, entry) => { (map[to] = map[to] || []).push(entry); };

  for (const entry of rounds.entries || []) {
    if (entry.status !== 'published' || !entry.atlasLinks) continue;
    for (const lnk of entry.atlasLinks) {
      push(lnk.to, { label: entry.title, url: `/rounds/${entry.slug}/`, icon: '📋' });
    }
  }

  for (const m of learn.modules || []) {
    if (m.status !== 'live' || !m.atlasLinks) continue;
    for (const lnk of m.atlasLinks) {
      push(lnk.to, { label: m.title, url: m.url, icon: '📘' });
    }
  }

  for (const t of learn.talks || []) {
    if (!t.atlasLinks) continue;
    for (const lnk of t.atlasLinks) {
      push(lnk.to, { label: t.title, url: t.url, icon: '🎤' });
    }
  }

  return map;
};
