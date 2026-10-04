#!/usr/bin/env node
'use strict';
/**
 * check-schools.js: hold the Schools layer (IPEDS, scripts/pull/ipeds.js) against what the accreditors list
 * (scripts/pull/accreditors.js), program by program, and say where they disagree. Built 2026-10-03 on David's
 * "how can we confirm that our data sets are solid and reproducible in the future as we grow".
 *
 * Every accredited program lands in one of five places:
 *   on the map          the school is in IPEDS and graduated people in the program in the map's year
 *   counted elsewhere   IPEDS has the school, but under its main campus, in another city or state (Rocky Vista
 *                       University's Utah campus counts in Parker, Colorado)
 *   no graduates yet    IPEDS has the school, with no graduates in the program that year: a new program, mostly
 *   not in IPEDS        the federal data has no such school at all (Noorda College of Osteopathic Medicine, Provo,
 *                       which joined federal student aid after its first class graduated in 2025)
 *   unsure              the names are too far apart to call; a person looks
 * and the other way, a program on the map that no accreditor lists is "on the map only" (a closed program, a code
 * filed in the wrong place, or a nursing school whose program answers only to its state board).
 *
 * Nurse practitioner programs are not checked: no accreditor lists them apart from other master's tracks.
 *
 *   node scripts/check-schools.js   writes data-build/schools-crosscheck.json and docs/HU-SCHOOLS-CROSSCHECK.md
 * Reads the cached IPEDS directory (scripts/.cache/ipeds/HD2024.zip; npm run pull:ipeds fetches it).
 */
const fs = require('fs');
const path = require('path');
const { csvRows, zipEntries, entryLines } = require('./lib/zip');

const ROOT = path.join(__dirname, '..');
const read = (/** @type {string[]} */ ...p) => JSON.parse(fs.readFileSync(path.join(ROOT, ...p), 'utf8'));
const SCHOOLS = read('src', 'assets', 'data', 'us-health-schools.json');
const ACC = read('data-build', 'accreditors.json');
const HD_ZIP = path.join(ROOT, 'scripts', '.cache', 'ipeds', 'HD2024.zip');
// the Census list of places, for where an accreditor's city is (a branch campus is a distance, not a spelling)
const GAZ_URL = 'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_place_national.zip';
const GAZ_ZIP = path.join(ROOT, 'scripts', '.cache', 'accred', 'gaz-place.zip');
const AWAY = 30;   // miles: farther than this from the school the directory names, the program is counted elsewhere
const NEARBY = ['md', 'do', 'rt'], NEAR_MI = 10;   // the nearby pass in the main loop
const OUT_JSON = path.join(ROOT, 'data-build', 'schools-crosscheck.json');
const OUT_MD = path.join(ROOT, 'docs', 'HU-SCHOOLS-CROSSCHECK.md');
// what the map reads: each program's accreditor, its status, and the campuses its graduates are counted under
const OUT_MAP = path.join(ROOT, 'src', 'assets', 'data', 'us-health-schools-accred.json');
const ON_CARDS = ['md', 'do', 'pa', 'rt'];
// the Census geocoder, for the street addresses CoARC lists (cached: a re-run touches the network only for new ones)
const GEO_URL = 'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?benchmark=Public_AR_Current&format=json&address=';
const GEO_CACHE = path.join(ROOT, 'scripts', '.cache', 'accred', 'geocode.json');
/* HAND-PLACED: schools outside IPEDS, at the addresses on their own sites (checked 2026-10-03). The Census geocoder
   does not know three of these streets yet, so those were located by name on OpenStreetMap the same day.
   name|state -> [lat, lon, how it was found] */
const HAND_PLACE = {
  'Noorda College of Osteopathic Medicine|UT': [40.20597, -111.65509, '2162 South 180 East, Provo (noorda.edu), located by OpenStreetMap'],
  'Meritus School of Osteopathic Medicine|MD': [39.62234, -77.68418, '11120 Health Drive, Hagerstown (msom.org), on the Meritus Health campus; located at Meritus Medical Center by OpenStreetMap'],
  'Orlando College of Osteopathic Medicine|FL': [28.45585, -81.64147, '7011 Kiran Patel Drive, Winter Garden (ocom.org), located by OpenStreetMap'],
  'Alice L. Walton School of Medicine|AR': [36.3825, -94.19653, '1001 NE J Street, Bentonville (alwmedschool.org), Census geocoder'],
  'Kaiser Permanente Bernard J. Tyson School of Medicine|CA': [34.14419, -118.14132, '98 S. Los Robles Ave, Pasadena, Census geocoder'],
  'Uniformed Services University of the Health Sciences, F. Edward H\u00e9bert School of Medicine|MD': [39.00187, -77.08637, '4301 Jones Bridge Road, Bethesda, located by OpenStreetMap'],
  // three military programs on one post share one mark, named for the post
  'Army Medical Center of Excellence|TX': [29.46235, -98.43205, 'Joint Base San Antonio-Fort Sam Houston, located by OpenStreetMap', 'Fort Sam Houston', 'Joint Base San Antonio-Fort Sam Houston'],
  'Medical Education and Training Campus (Air Force)|TX': [29.46235, -98.43205, 'Joint Base San Antonio-Fort Sam Houston, located by OpenStreetMap', 'Fort Sam Houston', 'Joint Base San Antonio-Fort Sam Houston'],
  'Medical Education and Training Campus (Army/Navy|TX': [29.46235, -98.43205, 'Joint Base San Antonio-Fort Sam Houston, located by OpenStreetMap', 'Fort Sam Houston', 'Joint Base San Antonio-Fort Sam Houston'],
  // campuses ARC-PA names without a city, placed at the city's center (checked on the schools' own pages 2026-10-03)
  'Arizona School of Health Sciences|AZ': 'Mesa',
  'A.T. Still University of Health Sciences (Central Coast)|CA': 'Santa Maria',
  'Touro University Illinois|IL': 'Skokie'
};   // the programs whose residue was read by hand; nursing stays in the report
const SHORT = { lcme: 'LCME', aacom: 'AACOM', arcpa: 'ARC-PA', coarc: 'CoARC', ccne: 'CCNE', acen: 'ACEN' };
/* what a mismatch usually means, per program, so the report is read right */
const NOTES = {
  md: 'LCME lists each medical school under its own city, so a branch campus shows as counted elsewhere.',
  do: "AACOM's list carries each college's other campuses, which IPEDS counts at the main one.",
  pa: 'ARC-PA lists no city, so a PA program is placed by its school. A program on the map and on no list may have closed since it graduated that class.',
  rt: "CoARC's list includes programs whose degree a partner college awards (Oklahoma's technology centers). Since this check, the map also counts the old technician code (51.0812) at associate and bachelor's, where many therapist programs file.",
  rn: 'Nursing programs answer to their state board; CCNE and ACEN accreditation is voluntary, so a school on the map with no accreditor is common and not a fault. CCNE lists a school once, under its main campus.',
  dnp: 'Schools file nursing doctorates under several codes (a nurse practitioner specialty, nursing administration, nurse anesthesia), and the map counts a DNP only under the DNP code or general nursing at the professional doctorate. Most "no graduates" here are that, not a missing program.'
};
const CHECKED = ['md', 'do', 'pa', 'rt', 'rn', 'dnp'];
// DEBUG_MATCH="Carle" prints every candidate a matching name was weighed against
const DEBUG = process.env.DEBUG_MATCH ? new RegExp(process.env.DEBUG_MATCH, 'i') : null;
const C_ZIP = path.join(ROOT, 'scripts', '.cache', 'ipeds', 'C2024_A.zip');
// every award level IPEDS uses, for saying which one a school reports a program at
const LEVEL_NAMES = { 1: 'certificate under 1 year', 2: 'certificate of 1 to 2 years', 3: 'associate', 4: 'certificate of 2 to 4 years', 5: "bachelor's",
  6: 'postbaccalaureate certificate', 7: "master's", 8: "post-master's certificate", 17: 'research doctorate', 18: 'professional doctorate',
  19: 'other doctorate', 20: 'certificate under 12 weeks', 21: 'certificate of 12 weeks to 1 year' };
const NEW_SINCE = 2021;   // accredited this year or later, or provisional: a program too young to have graduated anyone

/* HAND-CHECKED PAIRS: the names no rule should be stretched to read. Each is an accreditor row (program, its exact
   name, state) and the IPEDS school it is, with where it lands when the distance cannot say (ARC-PA lists no city)
   and why. A pair whose accreditor row is gone is reported as stale, so the table never outlives its rows.
   Checked 2026-10-03; the renames were checked against the schools' own announcements that day. */
const HAND = [
  ['md', 'Southern Illinois University School of Medicine', 'IL', '149222', '', 'the medical school is in Springfield; IPEDS counts its graduates at Carbondale'],
  ['md', 'CUNY School of Medicine', 'NY', '190567', '', 'the school sits at City College, which reports its graduates'],
  ['md', 'University of South Carolina School of Medicine, Greenville', 'SC', '218663', '', "USC's Greenville campus; IPEDS counts its graduates at Columbia"],
  ['md', 'Arizona State University John Shufeldt School of Medicine and Medical Engineering', 'AZ', '104151', '', "ASU's medical school, preliminary accreditation since 2025"],
  ['do', 'Ohio University Heritage College of Osteopathic Medicine', 'OH', '204857', '', 'Heritage College campuses in Cleveland and Dublin; IPEDS counts them at Athens'],
  ['do', 'Ohio University Heritage College of Osteopathic Medicine Cleveland', 'OH', '204857', '', 'as above'],
  ['do', 'Ohio University Heritage College of Osteopathic Medicine Dublin', 'OH', '204857', '', 'as above'],
  ['do', 'Russell and Glenda Gordy College of Osteopathic Medicine', 'TX', '227881', '', "Sam Houston State University's college in Conroe, named for the Gordys on Aug. 6, 2026 (shsu.edu)"],
  ['pa', 'University of Arkansas', 'AR', '106263', '', "ARC-PA's University of Arkansas program is the one at UAMS in Little Rock"],
  ['pa', 'Arizona School of Health Sciences', 'AZ', '177834', 'counted elsewhere', "A.T. Still University's school in Mesa; IPEDS counts it at Kirksville, Missouri (atsu.edu)"],
  ['pa', 'University of Colorado', 'CO', '126562', '', 'the program at the Anschutz Medical Campus'],
  ['pa', 'Indiana University', 'IN', '151111', '', 'the program in Indianapolis'],
  ['pa', 'Mass General Brigham University of Health Professions', 'MA', '166869', '', 'the MGH Institute of Health Professions, renamed Sept. 1, 2026 (mghihp.edu/about/name-change)'],
  ['pa', 'Mississippi Christian University', 'MS', '176053', '', 'Mississippi College, renamed June 1, 2026'],
  ['pa', 'University of Oklahoma, Oklahoma City', 'OK', '207342', '', 'the OU Health Sciences Center'],
  ['pa', 'University of Oklahoma, Tulsa', 'OK', '207342', 'counted elsewhere', 'the OU Health Sciences Center program in Tulsa; IPEDS counts it at Oklahoma City'],
  ['pa', 'Chamberlain University - Chicago', 'IL', '454227', '', "Chamberlain University's Illinois school"],
  ['pa', 'CUNY School of Medicine (formerly CCNY Sophie Davis School of Biomedical Education)', 'NY', '190567', '', 'City College reports it'],
  ['pa', 'University of South Carolina, SOM', 'SC', '218663', '', 'the School of Medicine program in Columbia'],
  ['pa', 'SUNY Downstate Medical Center', 'NY', '196255', '', 'SUNY Downstate Health Sciences University'],
  ['pa', 'University of Texas – HS Center at San Antonio', 'TX', '228644', '', 'UT Health Science Center at San Antonio'],
  // added with the campus marks (2026-10-03): a branch named for its host, a campus city in the name, a donor's name
  ['md', 'Washington State University Elson S. Floyd College of Medicine', 'WA', '236939', '', "WSU's medical school is in Spokane; IPEDS counts its graduates at Pullman"],
  ['do', 'Duquesne University Nasuti College of Osteopathic Medicine', 'PA', '212106', '', "Duquesne University's new osteopathic college"],
  ['do', 'Lake Erie College of Osteopathic Medicine at Jacksonville University', 'FL', '407629', '', "LECOM's campus on Jacksonville University's grounds; IPEDS counts LECOM at Erie"],
  ['do', 'PCOM South Georgia', 'GA', '215123', '', "the Philadelphia College of Osteopathic Medicine's Moultrie campus"],
  ['do', 'Western University Heatherington College of Osteopathic Medicine', 'OR', '112525', '', "WesternU's Lebanon, Oregon campus; IPEDS counts it at Pomona"],
  ['do', 'Western University of Health Sciences, College of Osteopathic Medicine of the Pacific', 'OR', '112525', '', 'as above'],
  ['pa', 'Gannon University-Ruskin', 'FL', '212601', 'counted elsewhere', "Gannon University's Ruskin, Florida campus; IPEDS counts it at Erie"],
  ['pa', 'Franklin Pierce University, Hybrid Program-Round Rock', 'TX', '182795', 'counted elsewhere', "Franklin Pierce University's Round Rock, Texas program; IPEDS counts it at Rindge"]
];

/* names to tokens: lower case, "&" and "St." spelled out, and the words every school name shares dropped, so what is
   left is what tells one school from another */
const GENERIC = new Set(('the of and at in for a an on university universities college colleges school schools medicine medical osteopathic ' +
  'health sciences science campus community technical technology institute center centre program programs department dept ' +
  'nursing nurse respiratory therapy care physician assistant assistants studies professions professional inc llc main system ' +
  'education graduate allied division area district consortium training').split(' '));
const SPELL = { st: 'saint', mt: 'mount', ft: 'fort', univ: 'university', u: 'university', coll: 'college', penn: 'pennsylvania', ctr: 'center', cc: 'college' };
/** @param {string} s */
function tokens(s) {
  return new Set(String(s).toLowerCase().replace(/[\u02bb\u02bc\u2018\u2019']/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\ba\s*&\s*m\b/g, 'aandm').replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ').trim().split(' ').map((w) => SPELL[/** @type {keyof typeof SPELL} */ (w)] || w)
    .filter((w) => w.length > 1 && !GENERIC.has(w)));   // a lone initial ("T.H. Chan", "A&M") tells nothing
}
const cityKey = (/** @type {string} */ s) => String(s).toLowerCase().replace(/^(saint|st\.?|mount|mt\.?|fort|ft\.?)\s+/, '').replace(/[^a-z]/g, '');

(async () => {
  /* the whole federal directory, not just the schools on the map: a school with no graduates is still in it */
  // SECTOR 0 is a system office ("University System of Maryland"), which graduates no one
  const hd = (await csvRows(HD_ZIP)).filter((r) => r.SECTOR !== '0').map((r) => ({
    u: r.UNITID, name: r.INSTNM, city: r.CITY, st: r.STABBR, open: r.CLOSEDAT === '-2' && r.CYACTIVE === '1', ope: String(r.OPEID || '').slice(0, 6),
    lat: +r.LATITUDE, lon: +r.LONGITUD, ctl: +r.CONTROL > 0 ? +r.CONTROL : 0, web: r.WEBADDR && r.WEBADDR !== '-2' ? (/^https?:/i.test(r.WEBADDR) ? r.WEBADDR : 'https://' + r.WEBADDR) : '',
    toks: [r.INSTNM, ...String(r.IALIAS || '').split(/\s*[|;]\s*/)].filter((n) => n && n !== '-2' && n.length > 2).map(tokens)
  }));
  if (!fs.existsSync(GAZ_ZIP)) { const { download } = require('./lib/zip'); await download(GAZ_URL, GAZ_ZIP); }
  /** @type {Map<string, [number, number]>} "UT|provo" -> [lat, lon] */
  const PLACE = new Map();
  const gz = zipEntries(GAZ_ZIP)[0];
  for await (const line of entryLines(GAZ_ZIP, gz)) {
    const c = line.split('\t'); if (c[0] === 'USPS') continue;
    const nm = c[3].replace(/\s+(city|town|village|CDP|borough|municipality|city and borough|consolidated government.*|metropolitan government.*|unified government.*|urban county|zona urbana|comunidad)$/i, '');
    const k = c[0] + '|' + cityKey(nm);
    if (!PLACE.has(k)) PLACE.set(k, [+c[10], +c[11]]);
  }
  const miles = (/** @type {number} */ la1, /** @type {number} */ lo1, /** @type {number} */ la2, /** @type {number} */ lo2) => {
    const r = Math.PI / 180, a = Math.sin((la2 - la1) * r / 2) ** 2 + Math.cos(la1 * r) * Math.cos(la2 * r) * Math.sin((lo2 - lo1) * r / 2) ** 2;
    return 3958.8 * 2 * Math.asin(Math.sqrt(a));
  };
  /** how far an accreditor's city sits from a directory row, or null when the city is not a Census place */
  const away = (/** @type {string} */ city, /** @type {string} */ st, /** @type {any} */ h) => {
    const p = city && PLACE.get(st + '|' + cityKey(city));
    return p && isFinite(h.lat) && h.lat ? miles(p[0], p[1], h.lat, h.lon) : null;
  };
  const byState = new Map();
  for (const h of hd) { if (!byState.has(h.st)) byState.set(h.st, []); byState.get(h.st).push(h); }
  const onMap = new Map();   // unitid -> Set of program keys
  for (const [u, k] of SCHOOLS.programs) { if (!onMap.has(u)) onMap.set(u, new Set()); onMap.get(u).add(k); }
  const mapName = new Map(SCHOOLS.schools.map((/** @type {any[]} */ s) => [s[0], s]));
  /** the same parent (the first six digits of the federal aid id) has the program on the map */
  const byOpe = new Map();
  for (const h of hd) if (h.ope && h.ope !== '-2') { if (!byOpe.has(h.ope)) byOpe.set(h.ope, []); byOpe.get(h.ope).push(h); }

  /* how rare each word is among the school names of a state (and of the country, for the cross-state pass): "rutgers"
     tells more than "jersey" in New Jersey */
  /** @param {any[]} pool */
  function weights(pool) {
    const df = new Map();
    for (const h of pool) for (const w of new Set(h.toks.flatMap((/** @type {Set<string>} */ t) => [...t]))) df.set(w, (df.get(w) || 0) + 1);
    const n = pool.length;
    return (/** @type {string} */ w) => Math.log(1 + n / (df.get(w) || 0.5));
  }
  /* acronyms the accreditors write and the directory spells out: the first two to five words' initials of every
     school name in the pool (LSU, USF, NYU, UCSD, LECOM). A short form that two different schools share is dropped. */
  /** @param {any[]} pool */
  function acronyms(pool) {
    const STOP = new Set(['of', 'the', 'and', 'at', 'in', 'for', 'a', 'an']);
    /** @type {Map<string, string | null>} */
    const m = new Map();
    for (const h of pool) {
      const words = String(h.name).toLowerCase().replace(/&/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter((w) => w && !STOP.has(w));
      for (let k = 2; k <= Math.min(5, words.length); k++) {
        const ac = words.slice(0, k).map((w) => w[0]).join('');
        if (ac.length < 3) continue;
        const exp = [...tokens(words.slice(0, k).join(' '))].join(' ');
        if (!exp) continue;
        m.set(ac, m.has(ac) && m.get(ac) !== exp ? null : exp);
      }
    }
    // a short form that is also a plain word in some school's name ("via" in Edward Via College) stays a word
    const vocab = new Set(pool.flatMap((h) => h.toks.flatMap((/** @type {Set<string>} */ t) => [...t])));
    for (const k of [...m.keys()]) if (vocab.has(k)) m.delete(k);
    return m;
  }
  // a name as plain words, the small ones out, so "Texas Tech University Health Sciences Center-El Paso" sits inside
  // "... Health Sciences Center at El Paso"
  const raw = (/** @type {string} */ s) => ' ' + String(s).toLowerCase().replace(/[\u02bb\u02bc\u2018\u2019']/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').replace(/\b(at|of|the|in|and)\b/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
  /* an accreditor names a unit inside a school ("Frederick P. Whiddon College of Medicine at the University of South
     Alabama", "University of Arizona College of Medicine - Phoenix"); the school's own name is one of the pieces */
  const UNIT = /\b(?:(?:school|college|faculty|division)\s+of\s+(?:osteopathic\s+)?medicine(?:\s+and\s+(?:public\s+health|dentistry|science|medical\s+engineering))?|medical\s+(?:school|college)|college\s+of\s+physicians\s+and\s+surgeons)\b/ig;
  /** @param {string} name */
  function pieces(name) {
    name = name.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();   // "(formerly CCNY Sophie Davis ...)"
    const cut = name.replace(UNIT, '|');
    const parts = cut.split(/\||\/|\s+at\s+(?:the\s+)?|\s+in\s+|\s+[-–]\s+|,\s+the\s+/i).map((s) => s.trim()).filter(Boolean);
    return cut === name ? [name, ...parts.filter((p) => p !== name)] : parts;
  }
  const STATE_WORDS = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'assets', 'data', 'geo', 'us-states.json'), 'utf8')).features
    .flatMap((/** @type {any} */ x) => [...tokens(x.properties.name)]));
  const CACHE_W = new Map(), CACHE_A = new Map();
  /** the best directory row for an accreditor's name and place @returns {{h: any, score: number, wj: number, city: boolean, inside: boolean, shared: number, covA: number, exact: boolean} | null} */
  function match(/** @type {string} */ name, /** @type {string} */ city, /** @type {string} */ prog, /** @type {any[]} */ pool, /** @type {string} */ key, skipSt = '') {
    if (!CACHE_W.has(key)) { CACHE_W.set(key, weights(pool)); CACHE_A.set(key, acronyms(pool)); }
    const W = CACHE_W.get(key), AC = CACHE_A.get(key);
    const expand = (/** @type {Set<string>} */ t) => new Set([...t].flatMap((w) => (AC.get(w) ? AC.get(w).split(' ') : [w])));
    // a piece made only of a state's name ("in Arizona") says where, not who; "University of Pennsylvania" names a school
    const ps = pieces(name);
    const placeOnly = (/** @type {string} */ p) => String(p).toLowerCase().replace(/[^a-z ]/g, ' ').split(/\s+/).filter(Boolean).every((w) => STATE_WORDS.has(w) || ['of', 'the', 'in', 'at', 'campus'].includes(w));
    let segs = ps.filter((p) => !placeOnly(p)).map((p) => expand(tokens(p))).filter((t) => t.size);
    if (!segs.length) segs = ps.map((p) => expand(tokens(p))).filter((t) => t.size);
    if (!segs.length) return null;
    const cityToks = tokens(city), rawName = raw(name);
    let best = null;
    for (const h of pool) {
      if (skipSt && h.st === skipSt) continue;
      const sameCity = !!city && cityKey(city) === cityKey(h.city);
      for (let i = 0; i < h.toks.length; i++) {
        const b = h.toks[i]; if (!b.size) continue;
        /* how much of the directory's name the accreditor's covers (covB), and of the accreditor's the directory's
           (covA), each word weighted by its rarity. Donor names ("NYU Grossman", "Columbia University Vagelos") are
           rare words the directory never has, so covering the directory's name is what decides; a shared word must
           also be rare enough (2.5) that "New" alone never matches The New School. */
        // the city's words count toward covering the name ("University of Colorado" in Denver covers "University of
        // Colorado Denver"), but a match needs a word from the NAME too, or every school in Denver is a candidate
        let covB = 0, covA = 0, shared = 0;
        for (const s of segs) {
          const a = new Set([...s, ...[...cityToks].filter((w) => b.has(w))]);
          let inter = 0, own = 0, wa = 0, wb = 0;
          for (const w of a) { wa += W(w); if (b.has(w)) { inter += W(w); if (s.has(w)) own += W(w); } }
          for (const w of b) wb += W(w);
          const cb = inter / wb, ca = inter / wa;
          if (own && cb + 0.5 * ca > covB + 0.5 * covA) { covB = cb; covA = ca; shared = own; }
        }
        if (!shared) continue;
        const wj = covB;
        const nm = raw(i === 0 ? h.name : ''), exact = !!nm.trim() && nm === rawName, inside = nm.trim().length >= 8 && rawName.includes(nm);
        // a school that already reports the program, whose name holds every word of the accreditor's, is the one
        // ("University of Minnesota Medical School" is the University of Minnesota-Twin Cities, not a college in Fergus Falls)
        const hasProg = !!(onMap.get(h.u) && onMap.get(h.u).has(prog));
        if (!((covB >= 0.99 && shared >= 2.5) || (covB >= 0.66 && covA >= 0.5) || inside || (covA >= 0.99 && hasProg))) continue;
        const score = covB + 0.5 * covA + (sameCity ? 0.3 : 0) + (inside ? 0.4 : 0) + (exact ? 0.6 : 0) + (hasProg ? 0.5 : 0) + (h.open ? 0.05 : 0);
        if (DEBUG && DEBUG.test(name)) console.log(`  ${name} ~ ${h.name} (${h.city}) covB ${covB.toFixed(2)} covA ${covA.toFixed(2)} shared ${shared.toFixed(1)} score ${score.toFixed(2)}`);
        if (!best || score > best.score) best = { h, score, wj, city: sameCity, inside, shared, covA, exact };
      }
    }
    return best;
  }

  /* every award each school reported in the checked programs' codes, at any level: a school with no graduates the map
     counts may still graduate people in the program at a level the map leaves out (a bachelor's in PA studies) */
  const codeOf = new Map();   // CIP code -> program keys
  const claimed = new Map();   // "code/level" -> the program that counts it on the map
  for (const [k, p] of Object.entries(SCHOOLS._meta.programs)) for (const [c, lvs] of Object.entries(/** @type {any} */ (p).codes)) {
    if (!codeOf.has(c)) codeOf.set(c, []); codeOf.get(c).push(k);
    for (const l of /** @type {number[]} */ (lvs)) claimed.set(c + '/' + l, k);
  }
  /** @type {Map<string, Map<string, Set<number>>>} unitid -> program -> levels */
  const anyLevel = new Map();
  for (const c of await csvRows(C_ZIP)) {
    if (c.MAJORNUM !== '1' || !(+c.CTOTALT > 0) || !codeOf.has(c.CIPCODE)) continue;
    if (!anyLevel.has(c.UNITID)) anyLevel.set(c.UNITID, new Map());
    const m = anyLevel.get(c.UNITID);
    for (const k of codeOf.get(c.CIPCODE)) {
      // a level another program owns on a shared code is that program's (51.3801 at associate is RN, not a DNP),
      // and general nursing (51.3801) says nothing about a DNP at other levels: only its own code does
      if (claimed.has(c.CIPCODE + '/' + c.AWLEVEL) && claimed.get(c.CIPCODE + '/' + c.AWLEVEL) !== k) continue;
      if (k === 'dnp' && c.CIPCODE !== '51.3818') continue;
      if (!m.has(k)) m.set(k, new Set()); m.get(k).add(+c.AWLEVEL);
    }
  }
  const hdById = new Map(hd.map((h) => [h.u, h]));
  const handUsed = new Set();

  /** @type {any[]} */
  const rows = [];
  for (const [prog, src, name, city, st, status, since, kind, , addr] of ACC.rows) {
    if (!CHECKED.includes(prog)) continue;
    const r = { prog, src, name, city, st, status, since, kind, addr, u: '', ipeds: '', ipedsCity: '', ipedsSt: '', miles: /** @type {number | null} */ (null), place: '', why: '', levels: '',
      fresh: /provisional|preliminary|candidate/i.test(status) || +String(since).slice(-4).replace(/\D/g, '') >= NEW_SINCE || +String(since).slice(0, 4) >= NEW_SINCE };
    const hand = HAND.find((x) => x[0] === prog && x[1] === name && x[2] === st);
    let hit = null, where = 'state';
    if (hand) {
      handUsed.add(HAND.indexOf(hand));
      r.why = hand[5];
      if (!hand[3]) { r.place = 'not in IPEDS'; rows.push(r); continue; }
      hit = { h: hdById.get(hand[3]), score: 9, wj: 1, city: true, inside: true, shared: 9, covA: 1, exact: true };
      if (!hit.h) throw new Error('hand pair names no IPEDS school: ' + hand[3]);
    } else {
      hit = match(name, city, prog, byState.get(st) || [], st);
      if (NEARBY.includes(prog) && city && !(hit && onMap.get(hit.h.u) && onMap.get(hit.h.u).has(prog))) {
        const near = (byState.get(st) || []).filter((/** @type {any} */ h) => onMap.get(h.u) && onMap.get(h.u).has(prog) && (away(city, st, h) ?? 99) <= NEAR_MI);
        if (near.length === 1) hit = { h: near[0], score: 9, wj: 1, city: true, inside: true, shared: 9, covA: 1, exact: true };
      }
      /* the school in another state: when nothing at home fits, or when the home guess lacks the program and a school
         elsewhere with it carries the whole name (Lake Erie College of Osteopathic Medicine's Bradenton campus is not
         Lake Technical College). Never past a school at home with the exact name, and only on a rare shared word, or
         Kansas State ("K-State") claims every "State University" in the country. */
      const hasIt = (/** @type {any} */ x) => !!(x && onMap.get(x.h.u) && onMap.get(x.h.u).has(prog));
      // a school in another state is this program's home only when it teaches the program and carries most of the
      // accreditor's words (St. Mary's Medical Center in Huntington is not Saint Mary's College in Indiana)
      if (!hit || hit.wj < 0.5 || (!hasIt(hit) && !hit.exact && !(hit.inside && hit.covA >= 0.8))) {
        const far = match(name, '', prog, hd, 'US', st);
        if (far && far.h.st !== st && far.shared >= 4 && hasIt(far) && far.covA >= 0.5 && far.wj >= ((!hit || hit.wj < 0.5) ? 0.8 : 0.99)) { hit = far; where = 'elsewhere'; }
      }
    }
    if (!hit) { r.place = 'not in IPEDS'; rows.push(r); continue; }
    const h = hit.h; Object.assign(r, { u: h.u, ipeds: h.name, ipedsCity: h.city, ipedsSt: h.st,
      strong: hit.exact || (hit.inside && hit.covA >= 0.5) || (hit.wj >= 0.99 && hit.covA >= 0.6) });
    const has = (/** @type {string} */ u) => !!(onMap.get(u) && onMap.get(u).has(prog));
    const sib = (byOpe.get(h.ope) || []).find((x) => x.u !== h.u && has(x.u));
    const far = (/** @type {any} */ x) => { const d = away(city, st, x); r.miles = d == null ? null : Math.round(d); return where === 'elsewhere' || (d != null && d > AWAY); };
    const lv = anyLevel.get(h.u) && anyLevel.get(h.u).get(prog);
    if (has(h.u)) r.place = far(h) ? 'counted elsewhere' : 'on the map';
    else if (sib) { Object.assign(r, { u: sib.u, ipeds: sib.name, ipedsCity: sib.city, ipedsSt: sib.st }); r.place = far(sib) ? 'counted elsewhere' : 'on the map'; }
    else if (lv && lv.size) { r.place = 'another level'; r.levels = [...lv].sort((a, b) => a - b).map((l) => LEVEL_NAMES[/** @type {keyof typeof LEVEL_NAMES} */ (l)] || 'level ' + l).join(', '); }
    else r.place = !hit.inside && hit.wj < 0.7 && !hit.city ? 'unsure' : 'no graduates yet';
    if (hand && hand[4]) r.place = hand[4];
    rows.push(r);
  }
  const stale = HAND.filter((x, i) => !handUsed.has(i));
  for (const x of stale) console.warn('stale hand pair, its accreditor row is gone: ' + x.slice(0, 3).join(' | '));

  /* the other way: programs on the map no accreditor row landed on */
  const seen = new Set(rows.filter((r) => r.u).map((r) => r.u + '/' + r.prog));
  const mapOnly = SCHOOLS.programs.filter((/** @type {any[]} */ p) => CHECKED.includes(p[1]) && !seen.has(p[0] + '/' + p[1]))
    .map((/** @type {any[]} */ p) => { const sc = mapName.get(p[0]); return { prog: p[1], u: p[0], name: sc[1], city: sc[2], st: sc[3], awards: p[2] }; });

  /* the report */
  const PLACES = ['on the map', 'counted elsewhere', 'no graduates yet', 'another level', 'not in IPEDS', 'unsure'];
  /** @type {Record<string, Record<string, number>>} */
  const count = {};
  for (const k of CHECKED) { count[k] = Object.fromEntries(PLACES.map((p) => [p, 0])); count[k]['on the map only'] = 0; }
  for (const r of rows) count[r.prog][r.place]++;
  for (const r of mapOnly) count[r.prog]['on the map only']++;
  const checked = ACC._meta.checked;
  // the school file this ran against, so a test can tell when a new pull was never checked
  const fingerprint = require('crypto').createHash('sha1').update(JSON.stringify(SCHOOLS.programs)).digest('hex').slice(0, 12);
  /* the map's file: [unitid, program, source, status, since, city, state, 1 when the program is taught away from the
     school IPEDS counts it under]. Only matches the map can stand behind: on the map or counted at another campus. */
  /** @type {any[][]} */
  const forMap = [];
  const seenRow = new Set();
  for (const r of rows) {
    if (!ON_CARDS.includes(r.prog) || !['on the map', 'counted elsewhere'].includes(r.place)) continue;
    const away = r.place === 'counted elsewhere' ? 1 : 0;
    const key = [r.u, r.prog, r.src, away ? r.city + r.st : ''].join('|');
    if (seenRow.has(key)) continue; seenRow.add(key);
    forMap.push([r.u, r.prog, r.src, r.status, r.since, away ? r.city : '', away ? r.st : '', away]);
  }
  forMap.sort((a, b) => (a[0] + a[1] < b[0] + b[1] ? -1 : 1));

  /* NEW PROGRAMS AND CAMPUSES (David, 2026-10-03: "go with both, show new programs and campus marks"). What the map
     draws hollow, outside every count and rank: an accredited program too new to have graduated anyone in the federal
     year (provisional or preliminary, or accredited since 2021; AACOM lists no status, and an osteopathic
     college with graduates is already on the map), a school the federal data does not carry, and a campus more than
     30 miles from the school IPEDS counts its graduates under. An established program with no graduates is a
     coding question for the report, not a mark. */
  const geoCache = fs.existsSync(GEO_CACHE) ? JSON.parse(fs.readFileSync(GEO_CACHE, 'utf8')) : {};
  /** @param {string} a @returns {Promise<[number, number] | null>} */
  async function geocode(a) {
    if (a in geoCache) return geoCache[a];
    let hit = null;
    try {
      const j = await (await fetch(GEO_URL + encodeURIComponent(a))).json();
      const m = j.result && j.result.addressMatches && j.result.addressMatches[0];
      if (m) hit = [Math.round(m.coordinates.y * 1e5) / 1e5, Math.round(m.coordinates.x * 1e5) / 1e5];
    } catch (e) { return null; }   // offline: not cached, so the next run asks again; the city stands in meanwhile
    geoCache[a] = hit;
    await new Promise((res) => setTimeout(res, 250));
    return hit;
  }
  // ARC-PA lists no city; a campus program names it ("Creighton University - Phoenix", "Franklin Pierce University (Goodyear)")
  const cityInName = (/** @type {string} */ n, /** @type {string} */ st) => String(n).split(/[-\u2013(),/]|\bat\b/).map((x) => x.trim()).filter(Boolean).find((x) => PLACE.has(st + '|' + cityKey(x))) || '';
  /** where an accreditor's row is: a hand-checked spot, its street address, or the center of its city */
  async function locate(/** @type {any} */ r) {
    const hp = /** @type {any} */ (HAND_PLACE)[r.name + '|' + r.st];
    if (typeof hp === 'string') { const p = PLACE.get(r.st + '|' + cityKey(hp)); return p ? { lat: p[0], lon: p[1], how: 'city', note: '', city: hp } : null; }
    if (hp) return { lat: hp[0], lon: hp[1], how: 'hand', note: hp[2], city: r.city || hp[3] || '' };
    if (r.addr) { const g = await geocode(r.addr); if (g) return { lat: g[0], lon: g[1], how: 'address', note: r.addr, city: r.city }; }
    const city = r.city || cityInName(r.name, r.st);
    const p = city && PLACE.get(r.st + '|' + cityKey(city));
    return p ? { lat: p[0], lon: p[1], how: 'city', note: '', city } : null;
  }
  const hash = (/** @type {string} */ x) => require('crypto').createHash('sha1').update(x).digest('hex').slice(0, 8);
  /** @type {any[][]} */
  const fresh = [];
  /** @type {Map<string, any>} */
  const marks = new Map();
  /** @type {any[]} */
  const unplaced = [];
  const add = (/** @type {any} */ m, /** @type {any} */ r) => {
    let x = marks.get(m.id);
    if (!x) { x = Object.assign(m, { progs: new Map() }); marks.set(m.id, x); }
    if (m.kind === 'campus' && r.src === 'aacom' && r.status === 'College') x.name = r.name;   // "...-Utah Campus" over the parent's own name
    if (!x.progs.has(r.prog)) x.progs.set(r.prog, [r.prog, r.src, r.status, r.since, r.name === x.name ? '' : r.name]);
  };
  for (const r of rows) {
    if (!ON_CARDS.includes(r.prog)) continue;
    // and near the city the accreditor gives: the Western North Carolina Consortium in Flat Rock is not a new program
    // at Western Carolina University, 60 miles off in Cullowhee
    const isNew = r.place === 'no graduates yet' && (r.fresh || r.src === 'aacom') && r.strong &&
      !(r.city && (away(r.city, r.st, hdById.get(r.u)) ?? 0) > AWAY && !HAND.some((x) => x[0] === r.prog && x[1] === r.name && x[2] === r.st));
    if (isNew && onMap.has(r.u)) { if (!fresh.some((x) => x[0] === r.u && x[1] === r.prog)) fresh.push([r.u, r.prog, r.src, r.status, r.since]); continue; }
    if (isNew) {
      const h = hdById.get(r.u);
      if (!h || !h.lat) { unplaced.push(r); continue; }
      add({ id: 'u' + h.u, kind: 'new', name: h.name, city: h.city, st: h.st, lon: h.lon, lat: h.lat, how: 'ipeds', par: '', ctl: h.ctl, web: h.web, note: '' }, r);
      continue;
    }
    if (r.place === 'not in IPEDS' && !(/** @type {any} */ (HAND_PLACE)[r.name + '|' + r.st])) continue;   // outside the federal data: hand-checked rows only
    if (r.place === 'counted elsewhere' && !r.strong) continue;
    if (r.place !== 'not in IPEDS' && r.place !== 'counted elsewhere') continue;
    const loc = await locate(r);
    if (!loc) { unplaced.push(r); continue; }
    if (r.place === 'not in IPEDS') {
      const hp = /** @type {any} */ (HAND_PLACE)[r.name + '|' + r.st], grp = (Array.isArray(hp) && hp[4]) || r.name;
      add({ id: 'x' + hash('outside|' + cityKey(grp) + '|' + r.st), kind: 'outside', name: grp, city: loc.city, st: r.st, lon: loc.lon, lat: loc.lat, how: loc.how, par: '', ctl: 0, web: '', note: loc.note }, r);
      continue;
    }
    const par = hdById.get(r.u);
    if (!par || cityKey(loc.city) === cityKey(par.city)) continue;   // the same place, spelled two ways
    add({ id: 'x' + hash('campus|' + r.u + '|' + cityKey(loc.city) + '|' + r.st), kind: 'campus', name: r.name, city: loc.city, st: r.st, lon: loc.lon, lat: loc.lat, how: loc.how, par: r.u, ctl: 0, web: '', note: loc.note }, r);
  }
  fs.writeFileSync(GEO_CACHE, JSON.stringify(geoCache));
  for (const r of unplaced) console.warn('no place for a mark: ' + r.prog + ' ' + r.name + ', ' + r.st);
  // [id, kind (campus | new | outside), name, city, state, lon, lat, how placed (ipeds | address | hand | city), the
  //  unitid its graduates count under (campus), programs "key:source:status:since|...", control, website, placement note]
  const extra = [...marks.values()].sort((a, b) => (a.id < b.id ? -1 : 1))
    .map((m) => [m.id, m.kind, m.name, m.city, m.st, m.lon, m.lat, m.how, m.par, [...m.progs.values()], m.ctl, m.web, m.note]);
  fresh.sort((a, b) => (a[0] + a[1] < b[0] + b[1] ? -1 : 1));
  const used = [...new Set(forMap.map((x) => x[2]).concat(fresh.map((x) => x[2]), extra.flatMap((x) => x[9].map((/** @type {string[]} */ p) => p[1]))))];
  fs.writeFileSync(OUT_MAP, '{"_meta":' + JSON.stringify({ checked, schools: fingerprint,
    sources: Object.fromEntries(used.map((k) => [k, { short: SHORT[/** @type {keyof typeof SHORT} */ (k)], label: ACC._meta.sources[k].label, url: ACC._meta.sources[k].url }])),
    fields: { rows: 'unitid, program, source, status, since, city, state, taught away from the school IPEDS counts it under (1)',
      fresh: 'unitid, program, source, status, since: an accredited program with no graduates yet, at a school on the map',
      extra: 'id, kind, name, city, state, lon, lat, how placed, unitid counted under, programs [key, source, status, since, name when it differs], control, website, placement note' },
    note: 'Built by scripts/check-schools.js. Fresh and extra are drawn hollow and kept out of every count.' }) +
    ',\n"rows":[\n' + forMap.map((x) => JSON.stringify(x)).join(',\n') + '\n],\n"fresh":[\n' + fresh.map((x) => JSON.stringify(x)).join(',\n') +
    '\n],\n"extra":[\n' + extra.map((x) => JSON.stringify(x)).join(',\n') + '\n]}\n');
  console.log('marks: ' + fresh.length + ' new programs at schools on the map; ' + ['new', 'outside', 'campus'].map((k) => extra.filter((x) => x[1] === k).length + ' ' + k).join(', ') + '; ' + unplaced.length + ' unplaced');
  fs.writeFileSync(OUT_JSON, JSON.stringify({ _meta: { checked, schools: fingerprint, ipeds: SCHOOLS._meta.year + ' (' + SCHOOLS._meta.release.completions + ')', note: 'Built by scripts/check-schools.js' },
    count, rows, mapOnly, stale }, null, 1) + '\n');

  const LABEL = { md: 'Medicine (MD)', do: 'Osteopathic medicine (DO)', pa: 'Physician assistant', rt: 'Respiratory therapy', rn: 'Registered nursing', dnp: 'Doctor of nursing practice' };
  const SRC = Object.fromEntries(Object.entries(ACC._meta.sources).map(([k, x]) => [k, /** @type {any} */ (x).label]));
  const by = (/** @type {string} */ prog, /** @type {string} */ place) => rows.filter((r) => r.prog === prog && r.place === place);
  const line = (/** @type {any} */ r) => `- ${r.name}, ${r.city ? r.city + ', ' : ''}${r.st}` + (r.status && !/^(College|Accredited|Campus)$/.test(r.status) ? ` (${r.status}${r.since ? ', since ' + r.since : ''})` : '') +
    (r.ipeds ? ` → IPEDS: ${r.ipeds}, ${r.ipedsCity}, ${r.ipedsSt} (${r.u})` : '') + (r.levels ? `; graduates at: ${r.levels}` : '') + (r.why ? `. Hand-checked: ${r.why}` : '');
  const LONG = 40;
  const yr = SCHOOLS._meta.year;
  let md = `# Schools cross-check\n\nGenerated by \`npm run check:schools\` on ${checked}. Do not edit by hand; re-run it.\n\n` +
    `The Schools layer of the Hospital Operations Map comes from IPEDS, ${yr}, ${SCHOOLS._meta.release.completions}. ` +
    `This holds it against the accreditors' own lists, read the same day:\n\n` +
    Object.values(ACC._meta.sources).map((x) => `- ${/** @type {any} */ (x).label}: ${/** @type {any} */ (x).url}`).join('\n') +
    `\n\nNurse practitioner programs are not checked; no accreditor lists them apart from other master's tracks.\n\n` +
    `Where each accredited program lands:\n\n` +
    `- On the map: the school graduated people in it in ${yr}, and the map shows them where the program is.\n` +
    `- Counted at another campus: graduated people, but IPEDS files them under a campus more than ${AWAY} miles away, or in another state.\n` +
    `- No graduates that year: in IPEDS, with nobody graduating in the program in ${yr}. Mostly new programs; an older one is worth a look.\n` +
    `- Graduates at another level: the school reports the program, at a level the map does not count.\n` +
    `- Not in IPEDS: the federal data has no such school.\n` +
    `- Unsure: the names are too far apart for the matcher to call.\n` +
    `- On the map, no accreditor: a program the map shows that no list carries (closed since, renamed, or a code filed oddly).\n\n` +
    `| Program | On the map | Another campus | No graduates that year | Another level | Not in IPEDS | Unsure | On the map, no accreditor |\n|---|---|---|---|---|---|---|---|\n` +
    CHECKED.map((k) => { const c = count[k]; return `| ${LABEL[/** @type {keyof typeof LABEL} */ (k)]} | ${c['on the map']} | ${c['counted elsewhere']} | ${c['no graduates yet']} | ${c['another level']} | ${c['not in IPEDS']} | ${c.unsure} | ${c['on the map only']} |`; }).join('\n') + '\n';
  md += `\nOn the map, drawn hollow and kept out of every count (MD, DO, PA and RT, strong matches only): ${fresh.length} new programs at schools already there, ` +
    `${extra.filter((x) => x[1] === 'new').length} new schools, ${extra.filter((x) => x[1] === 'outside').length} schools outside IPEDS (hand-checked) and ` +
    `${extra.filter((x) => x[1] === 'campus').length} campuses whose graduates count under their main school.\n`;
  if (stale.length) md += `\n**Stale hand-checked pairs** (their accreditor row is gone; drop or fix them in scripts/check-schools.js): ${stale.map((x) => x[1] + ', ' + x[2]).join('; ')}\n`;
  for (const k of CHECKED) {
    md += `\n## ${LABEL[/** @type {keyof typeof LABEL} */ (k)]}\n\nSources: ${[...new Set(rows.filter((r) => r.prog === k).map((r) => SRC[r.src]))].join('; ')}. ${NOTES[/** @type {keyof typeof NOTES} */ (k)]}\n`;
    const noGrads = by(k, 'no graduates yet');
    for (const [list, what] of /** @type {[any[], string][]} */ ([
      [by(k, 'not in IPEDS'), 'Accredited, but the federal data has no such school'],
      [noGrads.filter((r) => !r.fresh), 'Established, but no graduates in ' + yr + ' (worth a look)'],
      [noGrads.filter((r) => r.fresh), 'New, no graduates yet in ' + yr],
      [by(k, 'another level'), 'Graduates at a level the map does not count'],
      [by(k, 'counted elsewhere'), 'Counted under another campus'],
      [by(k, 'unsure'), 'Names too far apart to call'],
      [mapOnly.filter((r) => r.prog === k), 'On the map, on no accreditor list']])) {
      if (!list.length) continue;
      md += `\n### ${what} (${list.length})\n\n` + list.slice(0, LONG).map((r) => (r.awards ? `- ${r.name}, ${r.city}, ${r.st} (${r.u})` : line(r))).join('\n') +
        (list.length > LONG ? `\n- and ${list.length - LONG} more in data-build/schools-crosscheck.json` : '') + '\n';
    }
  }
  fs.writeFileSync(OUT_MD, md);
  console.log('checked ' + checked + '\n' + CHECKED.map((k) => k.padEnd(4) + JSON.stringify(count[k])).join('\n'));
  console.log('\nwrote ' + [OUT_JSON, OUT_MD, OUT_MAP].map((x) => path.relative(ROOT, x)).join(', ') + ' (' + forMap.length + ' rows for the map)');
})().catch((e) => { console.error(e); process.exit(1); });
