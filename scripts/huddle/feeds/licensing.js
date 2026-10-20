'use strict';
/**
 * FEED: how the license compacts work, and what each accreditor accredits (2026-10-20, bank version 3).
 *
 * Reads: src/_data/licensure.json (the Assignment Compass's license file, which David keeps current; each compact's
 * `how` line says what a member state's license gets you) and src/assets/data/us-health-schools-accred.json (the
 * accreditors' own lists the Hospital Operations Map checks its schools against, with the day they were read).
 * The compact membership questions live in the builder (section 3) and licensure.js; this asks the other way round:
 *   - which working compact gives what its `how` line says (a compact not yet issuing privileges is left out, since
 *     its line describes a future it has not reached);
 *   - which kind of program an accreditor accredits, for each accreditor whose list covers one program.
 * A new row: a compact with a `how` line, or an accreditor added to the accreditation file.
 */
const { readJson, rngFrom, kOf, idOf, dateWords, withDistractors, commas } = require('../lib');

const reads = ['src/_data/licensure.json', 'src/assets/data/us-health-schools-accred.json', 'src/assets/data/us-health-schools.json'];

function build() {
  const out = [];
  // ── the compacts ──
  const lic = readJson(reads[0]);
  const asOf = lic._meta && lic._meta.retrieved;
  if (asOf) {
    const live = Object.values(lic.professions).map((P) => P.compact).filter((c) => c && c.operational && c.how && Array.isArray(c.members));
    const r = rngFrom('huddle|li|how');
    // the line as a question reads it: the planning fee (an estimate, by the file's own note) and the capitals come off
    const plain = (how) => String(how).replace(/,?\s*~\$.*$/, '').replace(/\bFULL\b/g, 'full').replace(/;.*$/, '');
    for (const c of live) {
      const p = withDistractors(r, c.name, live.map((x) => x.name), 4);
      if (!p) continue;
      out.push({ z: 'pol', f: 'Compacts', src: c.name + ', how it works', url: c.url, yr: Number(String(asOf).slice(0, 4)), ck: asOf,
        id: 'li-how-' + idOf(c.code), k: kOf('li', 'how'), d: 2, t: 'choice',
        q: `Which license compact works this way: ${plain(c.how)}?`, o: p.o, a: p.a,
        why: `That is the ${c.code}: ${c.how.replace(/,?\s*~\$.*$/, '').replace(/\bFULL\b/g, 'full')}. ${c.members.filter((s) => s !== 'DC').length} states${c.members.includes('DC') ? ' and D.C.' : ''} were members on ${dateWords(asOf)}.` });
    }
  }

  // ── the accreditors ──
  const A = readJson(reads[1]), D = readJson(reads[2]);
  const AM = A._meta || {};
  const progs = (D._meta || {}).programs || {};
  if (AM.checked && AM.sources) {
    const of = {}, count = {};
    for (const row of A.rows || []) { (of[row[2]] = of[row[2]] || new Set()).add(row[1]); count[row[2]] = (count[row[2]] || 0) + 1; }
    const label = (k) => (progs[k] && progs[k].label) || k;
    const r = rngFrom('huddle|li|accred');
    for (const [key, src] of Object.entries(AM.sources)) {
      const list = [...(of[key] || [])];
      if (list.length !== 1 || !/accredited/i.test(src.label) || !progs[list[0]]) continue;
      const prog = list[0];
      const p = withDistractors(r, label(prog), Object.keys(progs).map(label), 4);
      if (!p) continue;
      out.push({ z: 'pol', f: 'Who accredits', src: src.label, url: src.url, yr: Number(String(AM.checked).slice(0, 4)), ck: String(AM.checked),
        id: 'li-accred-' + idOf(key), k: kOf('li', 'accred'), d: 1, t: 'choice',
        q: `${src.short} accredits which kind of education program in the U.S.?`, o: p.o, a: p.a,
        why: `${src.short} accredits ${label(prog).toLowerCase().replace(/\((md|do|dnp)\)/, (m) => m.toUpperCase())} programs; when the map checked its schools against that list on ${dateWords(AM.checked)}, it matched ${commas(count[key])} of them.`,
        see: `ops|layers=school&programs=${prog}|every ${prog.toUpperCase()} program` });
    }
  }
  return out;
}

module.exports = { name: 'licensing', prefix: 'li-', reads, build };
