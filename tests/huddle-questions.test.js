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

test('DH2: normals are drafts until David checks them, every hand-checked fact quotes its source, no question asks for a dose', () => {
  for (const q of Q) {
    if (q.f === 'Normals') assert.strictEqual(q.draft, true, q.id + ': a normal is a draft');
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
