/**
 * Daily Huddle's question bank (src/assets/data/huddle-questions.json, built by scripts/build-huddle.js). Every tile is
 * one of these, so the bank is held to the site's rules: every question has a source and a check date, every choice has
 * exactly one right answer, numbers say how close counts, the words follow the voice rules, and DH2's lines hold (normals
 * are drafts until David checks them; no question asks for a drug's dose, and the math carries every number it needs).
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const FILE = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'assets', 'data', 'huddle-questions.json'), 'utf8'));
const Q = FILE.questions;
const ZONES = ['sci', 'prv', 'pat', 'ph', 'tec', 'pol', 'pay'];
const words = (q) => [q.q, q.sub, q.why, q.h, ...(q.o || []), ...(q.v || [])].filter(Boolean).join(' \n ');

test('the bank matches its builder (run npm run build:huddle after changing a source)', () => {
  execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'build-huddle.js'), '--check'], { stdio: 'pipe' });
});

test('every question has an id, a zone, a family, a template, its dots, a source and a check date', () => {
  const ids = new Set();
  for (const q of Q) {
    assert.ok(q.id && !ids.has(q.id), 'a unique id: ' + q.id);
    ids.add(q.id);
    assert.ok(ZONES.includes(q.z), q.id + ': zone');
    assert.ok(q.f && q.k, q.id + ': family and template');
    assert.ok([1, 2, 3].includes(q.d), q.id + ': dots 1 to 3');
    assert.ok(q.q && /\?$/.test(q.q.trim()), q.id + ': the question ends in a question mark');
    assert.ok(q.src, q.id + ': a source');
    assert.match(String(q.ck), /^\d{4}-\d{2}(-\d{2})?$/, q.id + ': a check date');
  }
});

test('a choice has two or four distinct options and one right answer; a number says how close counts', () => {
  for (const q of Q) {
    if (q.t === 'choice') {
      assert.ok([2, 4].includes(q.o.length), q.id + ': two or four options');
      assert.strictEqual(new Set(q.o).size, q.o.length, q.id + ': distinct options');
      assert.ok(Number.isInteger(q.a) && q.a >= 0 && q.a < q.o.length, q.id + ': the right option is one of them');
      if (q.v) assert.strictEqual(q.v.length, q.o.length, q.id + ': a value for every option');
    } else {
      assert.strictEqual(q.t, 'number', q.id + ': choice or number');
      assert.ok(Number.isFinite(q.a), q.id + ': a number answer');
      assert.ok((q.tol > 0 && q.tol <= 0.25) || q.abs > 0, q.id + ': a share or an amount that counts');
    }
  }
});

test('every zone can fill its wedge, with easy and hard tiles to choose from', () => {
  for (const z of ZONES) {
    const zq = Q.filter((q) => q.z === z);
    assert.ok(zq.length >= 8, `${z}: ${zq.length} questions`);
    assert.ok(zq.some((q) => q.d === 1) || zq.some((q) => q.d === 2), z + ': an easy tile');
    assert.ok(zq.some((q) => q.d >= 2), z + ': a harder tile');
    assert.ok(new Set(zq.map((q) => q.k)).size >= 4, z + ': at least four templates, so a wedge and the compass never repeat one');
  }
});

test('the words follow the voice rules: no em or en dashes, none of the banned words', () => {
  const BANNED = /\b(delve|straightforward|genuinely|transformative|here's the thing|let's be clear|make no mistake|receipts)\b/i;
  for (const q of Q) {
    const t = words(q);
    assert.ok(!/[—–]/.test(t), q.id + ': a dash');
    assert.ok(!BANNED.test(t), q.id + ': a banned word');
  }
});

// DH2: a normal is a draft until David checks it. He checked these sixteen on 2026-10-18 (the hub's QA check
// dh-normals, Good with no changes); a normal added later stays a draft until he checks it too.
const CHECKED_NORMALS = new Set(['norm-ph', 'norm-paco2', 'norm-pao2', 'norm-hco3', 'norm-spo2', 'norm-rr', 'norm-hr', 'norm-bp',
  'norm-glucose', 'norm-sodium', 'norm-potassium', 'norm-chloride', 'norm-bun', 'norm-hgb-women', 'norm-wbc', 'norm-platelets']);

test('DH2: normals are drafts until David checks them, every hand-checked fact quotes its source, no question asks for a dose', () => {
  for (const q of Q) {
    if (q.f === 'Normals') assert.strictEqual(!!q.draft, !CHECKED_NORMALS.has(q.id), q.id + (CHECKED_NORMALS.has(q.id) ? ': checked by David on 2026-10-18, so not a draft' : ': a new normal is a draft until David checks it'));
    if (/^(norm|pol|tec|icd)-/.test(q.id)) { assert.ok(q.url && q.quote, q.id + ': a hand-checked fact carries its URL and a quote'); }
    assert.ok(!/\b(what is the|what's the|usual|standard|recommended|maximum|max) (adult |daily |starting )?dose\b|\bdose of\b/i.test(q.q), q.id + ': asks for a dose');
    if (q.f === 'Clinical math') {
      assert.match(q.src, /^Arithmetic/, q.id + ': clinical math is arithmetic');
      assert.ok(!/\b(acetaminophen|ibuprofen|heparin|insulin|morphine|fentanyl|potassium chloride|warfarin)\b/i.test(q.q), q.id + ': the math names no drug');
    }
  }
});

test('a number pulled from Vital Stats keeps its year, and a state choice shows every option\'s value with the answer', () => {
  for (const q of Q) {
    if (q.id.startsWith('vs-')) assert.ok(q.yr, q.id + ': its year');
    if (/-four-|-two-/.test(q.id)) {
      assert.ok(q.v, q.id + ': the values');
      const nums = q.v.map((s) => parseFloat(String(s).replace(/[^0-9.\-]/g, '')));
      const best = /lowest/.test(q.q) ? Math.min(...nums) : Math.max(...nums);
      assert.strictEqual(nums[q.a], best, q.id + ': the right answer is the extreme of the values shown');
    }
  }
});

// THE HINT LIFELINE (2026-10-15, DECISIONS DH8): a foothold from the same data, never the answer
test('a hint gives a foothold and never the answer: no right option in it, and no number in it that would count', () => {
  const counts = (q, x) => (q.abs != null ? Math.abs(x - q.a) <= q.abs + 1e-9 : Math.abs(x - q.a) <= Math.abs(q.a) * (q.tol || 0.1) + 1e-9);
  for (const q of Q) {
    if (!q.h) continue;
    assert.match(q.h, /^[^\n]{8,80}\.$/, q.id + ': one short line ending in a period, so it fits a phone card');
    if (q.t === 'choice') assert.ok(!q.h.includes(q.o[q.a]), q.id + ': the hint names the right option');   // the values only show after
    else {
      const nums = (q.h.replace(/^\d+-state median: /, '').match(/\d[\d,]*(\.\d+)?/g) || []).map((x) => Number(x.replace(/,/g, '')));
      for (const x of nums) assert.ok(!counts(q, x), `${q.id}: ${x} in the hint would count as the answer`);
    }
  }
});

test('the hints sit where the data supplies one: every state choice, the bedside math, the compacts but not their count', () => {
  for (const q of Q) {
    if (/-(four|two)-\d+$/.test(q.id) || q.f === 'Clinical math' || /^cmp-.+-(in|out)-\d+$/.test(q.id)) assert.ok(q.h, q.id + ': a hint');
    if (/^cmp-.+-count$/.test(q.id)) assert.ok(!q.h, q.id + ': the count tile cannot be hinted with the count');
  }
  assert.ok(Q.filter((q) => q.h).length > 700, 'most of the bank has a hint');
});

// BANK VERSION 2 (2026-10-18, David: "I kept getting ones I have seen"): the feeds in scripts/huddle/feeds/ grow the bank
// from the site's own data files. Version 1 keeps its place at the head of the file, since the boards already dealt drew
// from it in file order; every feed question carries its version (2 on) and its source, year and check date. Version 3
// (2026-10-25, DH12) joined at the end, after version 2, the same way.
const { FEEDS } = require('../scripts/huddle/feeds');
const { FIELD_RES } = require('../scripts/huddle/lib');
const V2 = Q.filter((q) => q.b >= 2);

test('version 1 comes first and unmarked; after it each version follows the one before', () => {
  const first = Q.findIndex((q) => q.b === 2);
  assert.ok(first > 0, 'the feeds made questions');
  assert.ok(Q.slice(0, first).every((q) => !('b' in q)), 'no version-1 question carries b');
  const rest = Q.slice(first);
  assert.ok(rest.every((q) => q.b >= 2), 'nothing after the first feed question is version 1');
  assert.ok(rest.every((q, i) => i === 0 || q.b >= rest[i - 1].b), 'a newer version never sits before an older one');
});

test('every feed made questions, and every feed question names its source, its year and its check date', () => {
  for (const F of FEEDS) {
    assert.ok(F.prefix && /-$/.test(F.prefix), F.name + ': an id prefix');
    assert.ok(V2.some((q) => q.id.startsWith(F.prefix)), F.name + ': made at least one question');
  }
  for (const q of V2) {
    assert.ok(FEEDS.some((F) => q.id.startsWith(F.prefix)), q.id + ': made by a feed');
    assert.ok(q.src && typeof q.src === 'string', q.id + ': a source');
    assert.ok(Number.isInteger(q.yr), q.id + ': a year');
    assert.match(String(q.ck), /^\d{4}-\d{2}(-\d{2})?$/, q.id + ': a check date');
  }
});

test('no feed question repeats a question the bank already asked, and none joins a profession field by accident', () => {
  const oldText = new Set(Q.filter((q) => !q.b).map((q) => q.q));
  for (const q of V2) {
    assert.ok(!oldText.has(q.q), q.id + ': the same words as an older question');
    assert.match(q.k, /^[a-z0-9_.]+$/, q.id + ': a feed template key is dotted words with no hyphen');
    assert.ok(!FIELD_RES.some((re) => re.test(q.k)), q.id + ': the key matches a "Your field" pattern');
  }
});

test('the bank is three times as varied as version 1, and no zone is thin', () => {
  const v1 = new Set(Q.filter((q) => !q.b).map((q) => q.k)).size;
  assert.ok(new Set(Q.map((q) => q.k)).size >= v1 * 3, 'at least triple the templates of version 1');
  for (const z of ZONES) {
    const zq = Q.filter((q) => q.z === z);
    assert.ok(zq.length >= 150, `${z}: ${zq.length} questions`);
    assert.ok(new Set(zq.map((q) => q.k)).size >= 40, `${z}: ${new Set(zq.map((q) => q.k)).size} templates`);
  }
});

// VERSIONS (2026-10-18): new data joins as a new version and nothing already dealt moves, so the process David asked for
// ("build a process to add to that list as we incorporate new data") cannot re-deal a past daily or strand a saved run
test('every version in the bank has its first day, and the days run in order', () => {
  const v = FILE.versions || {};
  const nums = Object.keys(v).map(Number).sort((a, b) => a - b);
  for (const q of Q) if (q.b > 1) assert.ok(v[q.b], q.id + ': version ' + q.b + ' has a first day');
  for (let i = 1; i < nums.length; i++) assert.ok(v[nums[i]] > v[nums[i - 1]], `version ${nums[i]} starts after version ${nums[i - 1]}`);
  for (const q of Q) if (q.gone) assert.ok(q.gone >= (q.b || 1), q.id + ': a question is dealt by its own version before it goes');
});

test('a rebuild: a question keeps its version and place once it has dealt, and an open version changes freely', () => {
  const { versionBank } = require('../scripts/huddle/lib');
  const prev = { versions: { 2: '2026-10-20' }, questions: [{ id: 'a', q: 'A?' }, { id: 'b', q: 'B?', b: 2 }, { id: 'c', q: 'C?', b: 2 }] };
  // the next build: a's words changed, b is no longer made, d is new; the feeds stamp everything they make b: 2
  const built = [{ id: 'a', q: 'A, reworded?' }, { id: 'd', q: 'D?', b: 2 }, { id: 'c', q: 'C?', b: 2 }];

  // after version 2 has dealt a daily: b is frozen, d opens version 3
  const r = versionBank(prev, built, { from: '2026-11-02', today: '2026-10-30' });
  assert.deepStrictEqual(r.questions.map((q) => q.id), ['a', 'b', 'c', 'd'], 'the old order holds and the new one goes at the end');
  assert.strictEqual(r.questions[0].q, 'A, reworded?', 'a question keeps its place and takes the new words');
  assert.ok(!('b' in r.questions[0]), 'a first-bank question stays in the first bank');
  assert.deepStrictEqual(r.questions[1], { id: 'b', q: 'B?', b: 2, gone: 2 }, 'a question no source makes stays as it was, dealt by version 2 and no later one');
  assert.strictEqual(r.questions[3].b, 3, 'a new question joins a new version');
  assert.deepStrictEqual(r.versions, { 2: '2026-10-20', 3: '2026-11-02' });
  assert.deepStrictEqual([r.added, r.gone, r.dropped], [['d'], ['b'], []]);
  const same = versionBank(r, built, { from: '2026-12-01', today: '2026-11-20' });
  assert.deepStrictEqual(same.questions, r.questions, 'building again from the same sources changes nothing');
  assert.deepStrictEqual(same.versions, r.versions, 'and opens no version');

  // before version 2's first day: nothing has been dealt from it, so b just leaves and d joins version 2
  const early = versionBank(prev, built, { from: '2026-10-21', today: '2026-10-18' });
  assert.deepStrictEqual(early.questions.map((q) => [q.id, q.b || 1]), [['a', 1], ['c', 2], ['d', 2]]);
  assert.deepStrictEqual(early.versions, { 2: '2026-10-20' }, 'no new version while one is still open');
  assert.deepStrictEqual([early.added, early.gone, early.dropped], [['d'], [], ['b']]);
});

// a tile's name has to fit its hex on a phone, where the label keeps the type floor and never shrinks (2026-10-18: the new
// "Headquarters" ran out of its tile). Measured in the board's own font at 375 px: "Workforce" is 68.5 units and fits; one
// word wider than that does not. A long name of two words takes two lines and fits.
test('every tile name fits its hex on a phone: no single word longer than "Workforce"', () => {
  const MEASURED_OK = new Set(['Telehealth', 'Behavioral']);   // 67.7 and 68.4 units, measured 2026-10-18
  for (const f of new Set(Q.map((q) => q.f))) {
    for (const w of f.split(' ')) assert.ok(w.length <= 9 || MEASURED_OK.has(w), `"${f}": "${w}" is too wide for a tile on a phone; use two shorter words`);
  }
});

// THE EXPLANATION LINE AND THE THIN ZONES (2026-10-20, DECISIONS DH12; plan docs/HU-HUDDLE-MEMORY-PLAN-2026-10-20.md, part 4).
// Every answer card explains itself: the line comes from the same data row as the question (the feeds and the builder
// write it, so a rebuild keeps it). And the daily remembers 60 days of tiles, about 2.7 a zone a day, so each zone needs
// room: Policy, Patient and Health Tech grew to 300 or more in bank version 3.
test('every question in the bank has an explanation line', () => {
  const none = Q.filter((q) => !q.why || !String(q.why).trim());
  assert.deepStrictEqual(none.map((q) => q.id), [], 'questions with no why');
  for (const q of Q) assert.match(String(q.why).trim(), /[.?)]$/, q.id + ': the why line ends a sentence');
});

test('Policy, Patient and Health Tech each hold 300 questions or more, and no one family runs a zone', () => {
  for (const z of ['pol', 'pat', 'tec']) {
    const zq = Q.filter((q) => q.z === z && !q.gone);
    assert.ok(zq.length >= 300, `${z}: ${zq.length} questions`);
    const fams = {};
    for (const q of zq) fams[q.f] = (fams[q.f] || 0) + 1;
    const [top, n] = Object.entries(fams).sort((a, b) => b[1] - a[1])[0];
    assert.ok(n / zq.length < 0.4, `${z}: "${top}" is ${n} of ${zq.length}`);
    for (const d of [1, 2, 3]) assert.ok(zq.some((q) => q.d === d), `${z}: a ${d}-dot tile`);
  }
});

test('version 3 grew the thin zones from the site\'s data: every question names its source, and its first day is set', () => {
  const v3 = Q.filter((q) => q.b === 3);
  assert.ok(v3.length >= 300, 'version 3 holds the new questions: ' + v3.length);
  assert.ok(FILE.versions && FILE.versions[3] > FILE.versions[2], 'version 3 deals from its own first day, after version 2');
  for (const q of v3) {
    assert.ok(q.src && q.ck && Number.isInteger(q.yr), q.id + ': a source, a year and a check date');
    assert.ok(!/\b(dose|dosage|mg\/kg)\b/i.test(q.q), q.id + ': no doses in the new questions');
    assert.notStrictEqual(q.f, 'Normals', q.id + ': no new normal ranges (those are David\'s to check)');
  }
});
