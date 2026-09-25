// THE OUTBOUND LINK CHECK. Every link that leaves the site, checked against the live web.
// Made standing on 2026-09-23 from the one-off check before that day's push, which found 17 of
// 455 links looking dead and fixed eleven of them (SPRINT.md). Sources move; a site that stakes
// itself on citing them has to notice when they do.
//
// MONTHLY, NOT IN THE GATE. Outside sites fail for reasons that are not ours (a login handshake,
// a bot wall, a bad afternoon), so this never blocks a build. It reads the BUILT site, so run
// `npm run build` first if src has changed. Usage:
//   npm run links                  every outbound link
//   npm run links -- --only gov    just the links whose host contains "gov"
//
// Where the links come from:
//   the <a href> of every built page in _site, and
//   the data files whose URLs a tool renders as links in the browser (DATA_FILES below),
//   because those never appear in the built HTML.
//
// What it reports, worst first:
//   DEAD      404, 410, or a host that no longer resolves. Fix or replace.
//   UNSURE    401, 403, 429, a 5xx, a timeout, a TLS failure. Often a bot wall or a login
//             handshake that works fine in a browser; open these by hand before changing them.
//   ok        2xx after redirects. A redirect to a different host is listed, since that is how a
//             source quietly moves.
// The full result lands in tmp/link-check/<date>.json. Exit code 1 when anything is DEAD, so a
// scheduled run notices; 0 otherwise.
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = path.join(ROOT, '_site');
const OUT = path.join(ROOT, 'tmp', 'link-check');
const DATA_FILES = [
  'src/assets/data/career-tree-creds.json',
  'src/assets/data/career-tree-bls.json',
  'src/_data/metricsConfig.json',
  'src/_data/licensure.json',
  'src/assets/data/vital-stats-questions.json',   // every reveal in Vital Stats links its source (added 2026-09-24)
];
const OWN_HOST = /(^|\.)healthcareuncharted\.com$/i;
// Hosts that answer a script with an error while working in a real browser. Each was opened in
// one on 2026-09-23. They are still checked; a 4xx there is reported as UNSURE with this note,
// never DEAD, but a host that stops resolving is DEAD whatever this list says.
// The pre-push check had also listed medicaid.gov and coalitionforhealthai.org here. A browser
// said otherwise: both medicaid.gov pages were genuinely gone and the coalition had moved to
// chai.org. Add a host only after opening its link in a browser.
const KNOWN_WALLS = {
  'www.eatrightpro.org': 'ACEND pages: a sign-in redirect; a script sees 404, a browser sees the page (checked 2026-09-23)',
  'eatrightpro.org': 'ACEND pages: a sign-in redirect; a script sees 404, a browser sees the page (checked 2026-09-23)',
  'nabp.pharmacy': 'the NAPLEX pass-rate PDF: a script gets 403, a browser gets the file (checked 2026-09-24)',
};
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36 HealthcareUncharted-LinkCheck/1.0';
const TIMEOUT = 20000;
const CONCURRENCY = 8;
const PER_HOST = 2;

const argv = process.argv.slice(2);
const only = argv.includes('--only') ? argv[argv.indexOf('--only') + 1] : null;

function collect() {
  const where = new Map();     // url -> [page or file, ...]
  const add = (url, from) => {
    let u;
    try { u = new URL(url.replace(/&amp;/g, '&')); } catch { return; }
    if (!/^https?:$/.test(u.protocol) || OWN_HOST.test(u.hostname)) return;
    u.hash = '';
    const key = u.toString();
    if (!where.has(key)) where.set(key, []);
    const list = where.get(key);
    if (!list.includes(from)) list.push(from);
  };
  if (!fs.existsSync(SITE)) { console.error('No _site. Run `npm run build` first.'); process.exit(2); }
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (!(dir === SITE && /^(assets|brand)$/.test(e.name))) walk(p); continue; }
      if (!e.name.endsWith('.html')) continue;
      const html = fs.readFileSync(p, 'utf8');
      const page = '/' + path.relative(SITE, p).split(path.sep).join('/').replace(/index\.html$/, '');
      for (const m of html.matchAll(/<a\b[^>]*?\shref\s*=\s*"(https?:[^"]+)"/gi)) add(m[1], page);
    }
  };
  walk(SITE);
  for (const f of DATA_FILES) {
    const full = path.join(ROOT, f);
    if (!fs.existsSync(full)) continue;
    const text = fs.readFileSync(full, 'utf8');
    for (const m of text.matchAll(/https?:\/\/[^\s"'<>\\)]+/g)) add(m[0].replace(/[.,;]+$/, ''), f);
  }
  return where;
}

async function probe(url) {
  const attempt = async (method) => {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), TIMEOUT);
    try {
      const res = await fetch(url, { method, redirect: 'follow', signal: ctl.signal,
        headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8', 'Accept-Language': 'en-US,en;q=0.9' } });
      if (method === 'GET' && res.body) res.body.cancel().catch(() => {});
      return { status: res.status, final: res.url };
    } catch (e) {
      const code = (e.cause && (e.cause.code || e.cause.errno)) || (e.name === 'AbortError' ? 'TIMEOUT' : e.message);
      return { status: 0, error: String(code) };
    } finally { clearTimeout(t); }
  };
  // HEAD first, it is cheap. Plenty of servers answer HEAD wrongly (405, 403, 404 for a page that
  // exists), so anything but a clean 2xx gets a GET before it is believed.
  let r = await attempt('HEAD');
  if (r.status < 200 || r.status >= 300) r = await attempt('GET');
  return r;
}

function classify(url, r) {
  const host = new URL(url).hostname;
  const wall = KNOWN_WALLS[host];
  if (r.status >= 200 && r.status < 400) return { verdict: 'ok' };
  if (r.status === 0 && /ENOTFOUND|EAI_AGAIN|ERR_NAME/i.test(r.error || '')) return { verdict: 'dead', why: 'host does not resolve (' + r.error + ')' };
  if (wall) return { verdict: 'unsure', why: wall };
  if (r.status === 404 || r.status === 410) return { verdict: 'dead', why: String(r.status) };
  if (r.status === 0) return { verdict: 'unsure', why: r.error };
  return { verdict: 'unsure', why: String(r.status) };
}

(async () => {
  const where = collect();
  let urls = [...where.keys()];
  if (only) urls = urls.filter((u) => new URL(u).hostname.includes(only));
  console.log(`Checking ${urls.length} outbound link${urls.length === 1 ? '' : 's'} (from ${new Set([...where.values()].flat()).size} pages and data files)...`);
  const results = [];
  const active = new Map();   // host -> requests in flight, so no one server gets more than PER_HOST
  const queue = urls.slice();
  let inFlight = 0, done = 0;
  await /** @type {Promise<void>} */ (new Promise((resolve) => {
    const pump = () => {
      if (!queue.length && !inFlight) return resolve();
      for (let i = 0; i < queue.length && inFlight < CONCURRENCY;) {
        const url = queue[i];
        const host = new URL(url).hostname;
        if ((active.get(host) || 0) >= PER_HOST) { i++; continue; }
        queue.splice(i, 1);
        active.set(host, (active.get(host) || 0) + 1);
        inFlight++;
        probe(url).then((r) => {
          results.push(Object.assign({ url, from: where.get(url).slice(0, 3), status: r.status, final: r.final, error: r.error }, classify(url, r)));
          active.set(host, active.get(host) - 1);
          inFlight--;
          done++;
          if (done % 50 === 0) console.log(`  ${done} checked`);
          pump();
        });
      }
    };
    pump();
  }));

  const order = { dead: 0, unsure: 1, ok: 2 };
  results.sort((a, b) => order[a.verdict] - order[b.verdict] || a.url.localeCompare(b.url));
  const count = (v) => results.filter((r) => r.verdict === v).length;
  const bare = (u) => new URL(u).hostname.replace(/^www\./, '');
  const moved = results.filter((r) => r.verdict === 'ok' && r.final && bare(r.final) !== bare(r.url));

  console.log('');
  for (const r of results.filter((x) => x.verdict !== 'ok')) {
    console.log(`${r.verdict.toUpperCase().padEnd(7)} ${r.why.padEnd(28).slice(0, 28)} ${r.url}`);
    console.log(`        on ${r.from.join(', ')}`);
  }
  if (moved.length) {
    console.log('\nMOVED to another host (works, but the source relocated; update the link when convenient):');
    for (const r of moved) console.log(`  ${r.url}\n    -> ${r.final}`);
  }
  const date = new Date().toISOString().slice(0, 10);
  fs.mkdirSync(OUT, { recursive: true });
  const file = path.join(OUT, date + '.json');
  fs.writeFileSync(file, JSON.stringify({ date, checked: results.length, dead: count('dead'), unsure: count('unsure'), ok: count('ok'), moved: moved.length, results }, null, 1));
  console.log(`\n${results.length} checked on ${date}: ${count('dead')} dead, ${count('unsure')} unsure, ${count('ok')} ok (${moved.length} moved host). Full result: ${path.relative(ROOT, file)}`);
  process.exit(count('dead') ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
