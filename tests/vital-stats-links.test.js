/**
 * Vital Stats' "see it on the site" links (2026-10-02). Every question that names a view of a site tool must name one
 * that exists: the Population Health Map's lens and measure, the operations map's layers, hospital types, health
 * systems and hospitals, the Career Tree's cards. Each is checked against the tool's own code or data, so a renamed
 * measure or a hospital that left the CMS list fails here instead of opening a blank map in front of a room.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = (/** @type {string[]} */ ...p) => fs.readFileSync(path.join(ROOT, ...p), 'utf8');
const json = (/** @type {string[]} */ ...p) => JSON.parse(read(...p));
const BANK = json('src', 'assets', 'data', 'vital-stats-questions.json').questions;
const SYS_DIR = path.join(ROOT, 'src', 'assets', 'data', 'vital-stats-systems');
const SYSTEMS = fs.readdirSync(SYS_DIR).filter((f) => f !== 'index.json').map((f) => JSON.parse(fs.readFileSync(path.join(SYS_DIR, f), 'utf8')));

/* what each tool can open on, read from the tool itself */
const PLM = read('src', 'assets', 'js', 'tools', 'multi-lens-map.js');
const LENSES = Object.keys(eval('(' + (PLM.match(/const LENSES = (\{[^}]*\})/) || [])[1] + ')'));
const CFG = json('src', '_data', 'metricsConfig.json');
const slug = (/** @type {string} */ n) => String(n).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const OPS = read('src', 'assets', 'js', 'tools', 'operators-map.js');
const keysOf = (/** @type {string} */ name) => {
  const block = (OPS.match(new RegExp('const ' + name + ' = \\{([\\s\\S]*?)\\n\\s*\\};')) || [])[1] || '';
  return new Set(Array.from(block.matchAll(/^\s*([a-z]+)\s*:/gm), (m) => m[1]));
};
const TYPES = keysOf('HOSP_TYPES'), LAYERS = keysOf('HOSP_DATASETS');
const PROGRAMS = keysOf('PROGRAMS');                                      // the Schools layer's program filter
/** @type {Map<string, Set<string>>} unitid -> the programs it lists */
const SCHOOL_PROGS = new Map();
for (const [u, k] of json('src', 'assets', 'data', 'us-health-schools.json').programs) {
  if (!SCHOOL_PROGS.has(String(u))) SCHOOL_PROGS.set(String(u), new Set());
  /** @type {Set<string>} */ (SCHOOL_PROGS.get(String(u))).add(k);
}
const H = json('src', 'assets', 'data', 'us-hospitals.json').hospitals;
const HOSP = new Map(H.map((h) => [h.id, h]));
const SYS = new Set(H.map((h) => h.sys).filter(Boolean));
const STATES = new Set(Object.keys(json('src', '_data', 'stateData.json').payer['0']));
const COUNTIES = new Set(Object.keys(json('src', 'assets', 'data', 'countyData.json').payer['0']));
const TREE = json('src', 'assets', 'data', 'career-tree.json');
/** @type {Set<string>} */
const CARDS = new Set();
(function walk(/** @type {any} */ o) {
  if (Array.isArray(o)) { o.forEach(walk); return; }
  if (o && typeof o === 'object') { if (typeof o.id === 'string' && o.label) CARDS.add(o.id); Object.values(o).forEach(walk); }
})(TREE.classes.roles);
const FACES = new Set(Object.keys(json('src', 'assets', 'data', 'career-tree-creds.json').faceMap));
const PAGE = read('src', 'fun', 'vital-stats', 'index.html');

/** @param {string} see @returns {string} why it is broken, or '' */
function problem(see) {
  const parts = String(see).split('|');
  if (parts.length !== 3 || !parts[2]) return 'not "tool|address|label"';
  if (/—/.test(parts[2])) return 'an em dash in the label';
  const [tool, addr] = parts, p = new URLSearchParams(addr);
  const st = p.get('state');
  if (st && !STATES.has(st)) return 'no state ' + st;
  if (tool === 'plm') {
    const lens = p.get('lens') || 'patient';
    if (!LENSES.includes(lens)) return 'the map has no lens ' + lens;
    const items = (CFG[lens] || {}).items || [];
    const i = items.findIndex((it) => slug(it.name) === p.get('metric'));
    if (i < 0) return 'the ' + lens + ' lens has no measure ' + p.get('metric');
    const co = p.get('county');
    if (co && !(co.slice(0, 2) && COUNTIES.has(co))) return 'no county ' + co;
    for (const k of p.keys()) if (!['lens', 'metric', 'state', 'county'].includes(k)) return 'the map reads no ' + k;
    return '';
  }
  if (tool === 'ops') {
    for (const k of p.keys()) if (!['layers', 'types', 'programs', 'state', 'county', 'sys', 'fac', 'prog'].includes(k)) return 'the operations map reads no ' + k;
    const layers = (p.get('layers') || '').split(',').filter(Boolean);
    for (const l of layers) if (!LAYERS.has(l)) return 'no layer ' + l;
    for (const t of (p.get('types') || '').split(',').filter(Boolean)) if (!TYPES.has(t)) return 'no hospital type ' + t;
    for (const t of (p.get('programs') || '').split(',').filter(Boolean)) if (!PROGRAMS.has(t)) return 'no program ' + t;
    if ((p.get('programs') || p.get('prog')) && !layers.includes('school')) return 'a program filter with the Schools layer off';
    const sys = p.get('sys'), fac = p.get('fac'), prog = p.get('prog');
    if (sys && !SYS.has(sys)) return 'the map has no system ' + sys;
    if (fac && /^u\d+$/.test(fac)) {
      const ps = SCHOOL_PROGS.get(fac.slice(1));
      if (!ps) return 'no school ' + fac;
      if (prog && !ps.has(prog)) return fac + ' lists no ' + prog + ' program';
    } else if (fac) {
      const h = HOSP.get(fac);
      if (!h) return 'no hospital ' + fac;
      if (sys && h.sys !== sys) return fac + ' is not in ' + sys;
    }
    if (prog && !(fac && /^u\d+$/.test(fac))) return 'a program card needs its school';
    return '';
  }
  if (tool === 'ct') {
    const role = p.get('role'), cred = p.get('cred');
    if (!role === !cred) return 'a Career Tree link opens one card, a career or an exam';
    if (role && !CARDS.has(role)) return 'no career card ' + role;
    if (cred && !FACES.has(cred)) return 'no exam card ' + cred;
    return '';
  }
  return 'unknown tool ' + tool;
}

test('every link in the everyday and state bank opens a view that exists', () => {
  const bad = BANK.filter((q) => q.see && problem(q.see)).map((q) => q.id + ': ' + problem(q.see));
  assert.deepStrictEqual(bad.slice(0, 10), []);
});

test('almost every question has somewhere to go, and every everyday state question does', () => {
  const linked = BANK.filter((q) => q.see).length;
  assert.ok(linked / BANK.length >= 0.99, linked + ' of ' + BANK.length + ' link somewhere');
  const lost = BANK.filter((q) => q.st && !q.see).map((q) => q.id);
  assert.deepStrictEqual(lost, [], 'a question about a state always has the state to show');
});

test('every health system question names a view that exists, and it is that system on the map', () => {
  let n = 0;
  for (const f of SYSTEMS) {
    assert.ok(Array.isArray(f.sees), f.id + ' carries its views');
    for (const s of f.sees) assert.strictEqual(problem(s), '', f.id + ': ' + s);
    for (const q of f.questions) {
      assert.ok(Number.isInteger(q.v) && f.sees[q.v], q.id + ' names a view');
      const p = new URLSearchParams(f.sees[q.v].split('|')[1]);
      assert.ok(p.get('sys'), q.id + ' opens its system');
      if (q.h) assert.ok(p.get('fac'), q.id + ' about one hospital opens that hospital');
      n++;
    }
  }
  assert.ok(n > 20000, n + ' system questions checked');
});

test('the page knows every tool the bank names, and draws the link on the answer screens only', () => {
  const tools = new Set(BANK.filter((q) => q.see).map((q) => q.see.split('|')[0]));
  const known = (PAGE.match(/const SEE_TOOLS = \{([\s\S]*?)\n\};/) || [])[1] || '';
  for (const t of tools) assert.match(known, new RegExp('\\b' + t + ':\\s*\\{ url:'), 'the page has a tool for ' + t);
  for (const [, url] of known.matchAll(/url:'([^']+)'/g)) assert.ok(fs.existsSync(path.join(ROOT, 'src', url.replace(/^\/|\/$/g, ''))), url + ' is a page on the site');
  const calls = Array.from(PAGE.matchAll(/function (draw\w+)\([^)]*\)\{[\s\S]*?\n\}/g)).filter((m) => /seeHtml\(/.test(m[0])).map((m) => m[1]);
  assert.deepStrictEqual(calls.sort(), ['drawReveal', 'drawRevealTrivia'], 'only the reveals show where the number lives');
});
