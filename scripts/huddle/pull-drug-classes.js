#!/usr/bin/env node
'use strict';
/**
 * pull-drug-classes.js · the drugs Medicare fills most, each with its FDA class (2026-10-20, DECISIONS DH13).
 *
 *   npm run huddle:drugs        writes scripts/data/huddle-drug-classes.json
 *
 * Plan: docs/HU-HUDDLE-DATA-SETS-PLAN-2026-10-20.md. Two public sources, read live:
 *   - CMS, Medicare Part D Spending by Drug (a U.S. government work): the claims each drug was filled for in its latest
 *     year. Only a drug's "Overall" row counts (each maker has a row too, and those would count twice), and a drug's
 *     brand and generic rows are added up by its generic name.
 *   - NLM's RxClass, the FDA's Established Pharmacologic Class (EPC) from the drug labels (free, no license; NLM asks for
 *     a courtesy line and no logo). Only classes reached through the drug's own ingredient, or a precise form of it ("lisinopril
 *     anhydrous"), count: estradiol reached "Radioactive Diagnostic Agent" through a tracer that shares part of its name. The label data on openFDA is not used; there a
 *     drug takes the classes of its combination pills (metoprolol read as a thiazide diuretic).
 * Combination pills, devices and vaccines have no class of their own and drop out by themselves. The file is the feed's
 * input (scripts/huddle/feeds/drug-classes.js); what each class is called on a tile is the hand-written list in
 * scripts/data/huddle-drug-class-names.json, which David reads.
 */
const fs = require('fs');
const path = require('path');
const { today } = require('../lib/session');

const OUT = path.join(__dirname, '..', 'data', 'huddle-drug-classes.json');
const PARTD = { id: '7e0b4365-fd63-4a29-8f5e-e0ac9f66a81b', year: 2024,
  name: 'CMS, Medicare Part D Spending by Drug',
  page: 'https://data.cms.gov/summary-statistics-on-use-and-payments/medicare-medicaid-spending-by-drug/medicare-part-d-spending-by-drug' };
const RXCLASS = 'https://rxnav.nlm.nih.gov/REST/rxclass/class/byDrugName.json';
const TOP = 300;   // the most-filled generics read; the feed takes what has one class
// salt and form words that name the same drug ("Metoprolol Succinate" and "Metoprolol Tartrate" are metoprolol)
const SALT = /\b(hcl|hydrochloride|dihydrochloride|calcium|sodium|potassium|magnesium|besylate|succinate|tartrate|maleate|mesylate|fumarate|sulfate|bromide|acetate|citrate|phosphate|bitartrate|hyclate|monohydrate|dihydrate|trihydrate|propionate|furoate|dipropionate|er|xr|sr|dr)\b/g;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function json(url) {
  for (let i = 0; i < 3; i++) {
    const r = await fetch(url);
    if (r.ok) return r.json();
    await sleep(1000 * (i + 1));
  }
  throw new Error('could not read ' + url);
}

async function claims() {
  const rows = [];
  for (let off = 0; ; off += 5000) {
    const page = await json(`https://data.cms.gov/data-api/v1/dataset/${PARTD.id}/data?filter[Mftr_Name]=Overall&size=5000&offset=${off}`);
    rows.push(...page);
    if (page.length < 5000) break;
  }
  const by = new Map();
  for (const r of rows) {
    const g = String(r.Gnrc_Name || '').trim();
    const n = Number(r['Tot_Clms_' + PARTD.year]) || 0;
    if (!g || !n || /[/,]|\bwith\b/i.test(g)) continue;   // one ingredient only
    const name = g.toLowerCase().replace(SALT, '').replace(/\s+/g, ' ').trim();
    if (!name) continue;
    const e = by.get(name) || { name, claims: 0, as: [] };
    e.claims += n;
    if (!e.as.includes(g)) e.as.push(g);
    by.set(name, e);
  }
  return { rows: rows.length, drugs: [...by.values()].sort((a, b) => b.claims - a.claims || (a.name < b.name ? -1 : 1)) };
}

async function classesOf(name) {
  const j = await json(`${RXCLASS}?drugName=${encodeURIComponent(name)}&relaSource=DAILYMED&relas=has_EPC`);
  const list = (j.rxclassDrugInfoList && j.rxclassDrugInfoList.rxclassDrugInfo) || [];
  // the drug itself, or a precise form of it ("lisinopril anhydrous"); never another ingredient that shares the word
  const same = (c) => ['IN', 'PIN'].includes(c.tty) && c.name.toLowerCase().replace(SALT, '').replace(/\banhydrous\b/g, '').replace(/\s+/g, ' ').trim() === name;
  return [...new Set(list.filter((d) => same(d.minConcept)).map((d) => d.rxclassMinConceptItem.className))].sort();
}

(async () => {
  const C = await claims();
  const drugs = [];
  for (const d of C.drugs.slice(0, TOP)) {
    const epc = await classesOf(d.name);
    await sleep(100);   // NLM asks for 20 requests a second at most
    drugs.push({ name: d.name, claims: d.claims, rank: drugs.length + 1, epc, as: d.as.sort() });
  }
  const file = {
    _meta: {
      pulled: today(),
      note: 'Built by scripts/huddle/pull-drug-classes.js (npm run huddle:drugs); never typed. The tile names for each class are scripts/data/huddle-drug-class-names.json.',
      claims: { name: PARTD.name, year: PARTD.year, url: PARTD.page, rows: C.rows, terms: 'U.S. government work' },
      classes: { name: 'FDA Established Pharmacologic Class, from NLM RxClass', url: 'https://mor.nlm.nih.gov/RxClass/',
        terms: 'Publicly available data courtesy of the U.S. National Library of Medicine (NLM), which is not responsible for the product and does not endorse it.' }
    },
    drugs
  };
  fs.writeFileSync(OUT, JSON.stringify(file, null, 1) + '\n');
  const one = drugs.filter((d) => d.epc.length === 1).length, none = drugs.filter((d) => !d.epc.length).length;
  console.log(`huddle-drug-classes.json: the top ${drugs.length} of ${C.drugs.length} single-ingredient drugs by ${PARTD.year} claims; ${one} with one FDA class, ${drugs.length - one - none} with more, ${none} with none`);
})().catch((e) => { console.error(String(e && e.message || e)); process.exit(1); });
