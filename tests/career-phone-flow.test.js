/**
 * Career Tree phone flow: executes the SHIPPED renderPhoneFlow against the real
 * dataset, rather than a reimplementation of it. Built output is the source, so a
 * change that breaks the tool breaks this test.
 *
 * The tool moved from an inline <script> to an ES module on 2026-08-22, so the
 * shipped copy is now the built module rather than the built page.
 */
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const BUILT = path.join(__dirname, '..', '_site', 'assets', 'js', 'tools', 'career-tree.js');
const DATA = path.join(__dirname, '..', 'src', 'assets', 'data', 'career-tree.json');
const built = fs.existsSync(BUILT);

/** pull renderPhoneFlow out of the built page by brace matching */
function extract() {
  const src = fs.readFileSync(BUILT, 'utf8');
  const from = src.indexOf('function renderPhoneFlow');
  assert.notEqual(from, -1, 'renderPhoneFlow must ship in the built module');
  const tail = src.slice(from);
  let depth = 0, started = false, end = -1;
  for (let i = 0; i < tail.length; i++) {
    if (tail[i] === '{') { depth++; started = true; }
    else if (tail[i] === '}') { depth--; if (started && depth === 0) { end = i + 1; break; } }
  }
  return tail.slice(0, end);
}

/** run it with a given state and return the HTML it produced */
function render(fnSrc, data, opts = {}) {
  const host = { innerHTML: '', contains: () => false, querySelector: () => null };
  const curClass = opts.curClass || 'roles';
  const ctx = {
    DATA: data,
    curClass,
    selectedId: opts.selectedId || null,
    phoneFam: opts.phoneFam || null,
    pinned: new Set(opts.pinned || []),
    nodeById: new Map((data.classes[curClass].nodes || []).map(n => [n.id, n])),
    esc: s => (s == null ? '' : String(s)).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m])),
    document: { getElementById: id => (id === 'hct-phone-flow' ? host : null), activeElement: null },
    console
  };
  vm.createContext(ctx);
  new vm.Script(fnSrc + '\nrenderPhoneFlow();').runInContext(ctx);
  return { html: host.innerHTML, phoneFam: ctx.phoneFam };
}

test('career phone flow', { skip: built ? false : 'run `npm run build` first' }, async t => {
  const fnSrc = extract();
  const data = JSON.parse(fs.readFileSync(DATA, 'utf8'));
  const roles = data.classes.roles;
  const famOrder = roles.familyOrder || Object.keys(roles.families);

  await t.test('the deck grid shows one card per field', () => {
    const { html } = render(fnSrc, data);
    const decks = (html.match(/class="hpf-deck"/g) || []).length;
    assert.equal(decks, famOrder.length);
    assert.equal((html.match(/<button type="button" class="hpf-deck"/g) || []).length, decks, 'cards are real buttons');
    assert.equal((html.match(/data-fam="/g) || []).length, decks, 'each carries its family key');
    assert.ok(!html.includes('hpf-role'), 'no ladder rows on the grid');
  });

  await t.test('a family ladder lists every role under labelled tiers', () => {
    const { html } = render(fnSrc, data, { phoneFam: 'nursing' });
    const nursing = roles.nodes.filter(n => n.family === 'nursing');
    assert.equal((html.match(/class="hpf-role[ "]/g) || []).length, nursing.length);
    assert.ok(html.includes('id="hpf-back"'), 'the ladder offers a way back');
    assert.ok(!html.includes('hpf-deck'), 'the grid is gone');

    const tiers = new Set(nursing.map(n => n.tier));
    assert.equal((html.match(/class="hpf-tier-lbl"/g) || []).length, tiers.size);
    const label = data.meta.tierLabelsRoles.find(Boolean);
    assert.ok(data.meta.tierLabelsRoles.some(l => l && html.includes('>' + l + '<')),
      `tier labels come from the dataset (e.g. ${label})`);
  });

  await t.test('every role in every family lands in a labelled tier', () => {
    for (const cls of Object.keys(data.classes)) {
      const c = data.classes[cls];
      const order = c.familyOrder || Object.keys(c.families || {});
      const labels = cls === 'roles' ? data.meta.tierLabelsRoles : data.meta.tierLabelsPatients;
      const orphans = (c.nodes || []).filter(n => !order.includes(n.family));
      assert.equal(orphans.length, 0, `${cls}: every node belongs to a listed family`);
      const unlabelled = (c.nodes || []).filter(n => labels[n.tier] == null);
      assert.equal(unlabelled.length, 0, `${cls}: every tier has a label`);
    }
  });

  await t.test('a selection opens its own ladder and inks exactly one row', () => {
    const { html, phoneFam } = render(fnSrc, data, { selectedId: 'rn', pinned: ['rn'] });
    assert.equal(phoneFam, 'nursing', 'a deep link lands with the right ladder behind it');
    assert.ok(html.includes('class="hpf-role on"'), 'the row carries state ink');
    assert.equal((html.match(/aria-current="true"/g) || []).length, 1);
    assert.ok(html.includes('hpf-role-pin'), 'a pinned role shows its star');
  });

  await t.test('hex line breaks flatten and markup is escaped', () => {
    const multi = roles.nodes.find(n => String(n.label || '').includes('\n'));
    if (!multi) return;
    const { html } = render(fnSrc, data, { phoneFam: multi.family });
    assert.ok(html.includes(multi.label.replace(/\n/g, ' ')), 'the board\'s line break becomes a space');
    assert.ok(!/hpf-role-name">[^<]*\n/.test(html), 'no raw newline survives into the row');
  });

  await t.test('an unknown family falls back to the grid', () => {
    const { html, phoneFam } = render(fnSrc, data, { phoneFam: 'not-a-family' });
    assert.equal(phoneFam, null, 'class-switch safety');
    assert.ok(html.includes('hpf-deck'));
  });
});
