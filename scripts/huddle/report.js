#!/usr/bin/env node
'use strict';
/**
 * npm run huddle:report · what is in Daily Huddle's question bank, and where it came from (2026-10-18).
 *
 * Reads the built bank (src/assets/data/huddle-questions.json) and prints, per zone and per family, how many questions
 * and how many templates (k) there are, flags a zone under 150 questions or 40 templates (a board takes about three
 * tiles a zone, so a thin zone repeats within days), and lists every feed in scripts/huddle/feeds/ with the files it
 * reads and what it made, counted by the feed's id prefix. It says when the bank is stale against its sources.
 * Read only: it writes nothing.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { ROOT } = require('./lib');
const { FEEDS } = require('./feeds');

const MIN_Q = 150, MIN_K = 40;
const NAMES = { sci: 'Medical Science', prv: 'Provider', pat: 'Patient', ph: 'Public Health', tec: 'Health Tech', pol: 'Policy', pay: 'Payer' };
const bank = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'assets', 'data', 'huddle-questions.json'), 'utf8'));
const Q = bank.questions;
const pad = (s, n) => String(s).padEnd(n);
const lpad = (s, n) => String(s).padStart(n);
const kinds = (list) => new Set(list.map((q) => q.k)).size;

let stale = false;
try { execFileSync(process.execPath, [path.join(__dirname, '..', 'build-huddle.js'), '--check'], { stdio: 'pipe' }); } catch (e) { stale = true; }

const v1 = Q.filter((q) => !q.b), v2 = Q.filter((q) => q.b === 2);
console.log(`Daily Huddle bank, built ${bank.built}: ${Q.length} questions, ${kinds(Q)} templates`);
console.log(`  version 1: ${v1.length} questions, ${kinds(v1)} templates · version 2 (the feeds): ${v2.length} questions, ${kinds(v2)} templates`);
if (stale) console.log('  STALE: the sources changed since the last build. Run npm run build:huddle.');

const flags = [];
console.log('\nBy zone and family: questions / templates, then dots 1/2/3');
for (const z of Object.keys(NAMES)) {
  const zq = Q.filter((q) => q.z === z);
  const ks = kinds(zq);
  const dots = [1, 2, 3].map((d) => zq.filter((q) => q.d === d).length).join('/');
  const short = [zq.length < MIN_Q ? MIN_Q + ' questions' : '', ks < MIN_K ? MIN_K + ' templates' : ''].filter(Boolean);
  if (short.length) flags.push(`${z} under ${short.join(' and ')}`);
  console.log(`\n${pad(z, 4)} ${pad(NAMES[z], 15)} ${lpad(zq.length, 5)} / ${lpad(ks, 4)}   dots ${dots}${short.length ? '   << UNDER ' + short.join(' and ') : ''}`);
  const fams = {};
  for (const q of zq) (fams[q.f] = fams[q.f] || []).push(q);
  for (const [f, list] of Object.entries(fams).sort((a, b) => b[1].length - a[1].length)) {
    const fresh = list.filter((q) => q.b === 2).length;
    console.log(`       ${pad(f, 16)} ${lpad(list.length, 5)} / ${lpad(kinds(list), 4)}${fresh ? `   (${fresh} from the feeds)` : ''}`);
  }
}

console.log('\nFeeds, in bank order (scripts/huddle/feeds/)');
for (const F of FEEDS) {
  const mine = v2.filter((q) => q.id.startsWith(F.prefix));
  const zs = {};
  for (const q of mine) zs[q.z] = (zs[q.z] || 0) + 1;
  console.log(`  ${pad(F.name, 14)} ${lpad(mine.length, 5)} questions ${lpad(kinds(mine), 4)} templates   ${Object.entries(zs).map(([z, n]) => z + ' ' + n).join(', ')}`);
  console.log(`  ${' '.repeat(14)} reads ${F.reads.length ? F.reads.join(', ') : 'nothing: every number is in the question'}`);
  if (!mine.length) flags.push('feed ' + F.name + ' made nothing');
}
console.log(flags.length ? `\nFLAGGED: ${flags.join('; ')}` : `\nEvery zone has at least ${MIN_Q} questions and ${MIN_K} templates, and every feed made questions.`);
