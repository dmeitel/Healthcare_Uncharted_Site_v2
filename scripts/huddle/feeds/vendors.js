'use strict';
/**
 * FEED: the Healthcare Vendor Directory (2026-10-18).
 *
 * Reads: src/assets/data/vendors.json, the directory's 158 entries, and scripts/data/vendor-checks.json, the facts those
 * entries rely on checked live against the company's own pages, SEC filings and acquisition news (the directory carries
 * no source of its own). A question is made only when every fact it rests on has a check that agrees ("...Ok": true),
 * and its source, link and check date come from that check: the owner (and the year of the purchase, else the why line
 * leaves the year out), the headquarters state or country (and the city, else no city line), the sector of the right
 * answer and of every wrong one (a wrong answer the check shows also fits, `alsoFits`, is never drawn), and the founding
 * year of all four companies. A vendor with no check makes no question. Only the facts that hold still are
 * asked: who owns a company, where it is based, what kind of company it is, and which was founded first. Never market
 * share, pricing, user counts, valuations or "leading" claims, which go stale.
 *   - which company owns X (a subsidiary whose parent's name is not already in its own);
 *   - which state (or country) X is headquartered in (companies, not product lines or anything defunct);
 *   - which of these four is a [sector] company, the wrong answers drawn from sectors that do not overlap it;
 *   - which of these was founded first, inside one sector, when the oldest is ten years older than the rest, only in
 *     the sectors in FIRSTS (insurers, distributors and revenue-cycle firms were built by mergers, so their founding
 *     years are argued), and never a spin-off, a merger or a product line.
 * A new row: a vendor added to the file joins these questions on the next build once vendor-checks.json holds its
 * check. A new sector needs a line in SECTORS.
 * On the answer screen the question links to the vendor's card: see 'vd|vendor=<slug>|<name>', where vd is
 * /tools/vendor-directory/ and the slug is the directory's own (vendor-directory.js, slug()).
 */
const { readJson, rngFrom, STATES, FIFTY, keyName, kOf, withDistractors } = require('../lib');

const reads = ['src/assets/data/vendors.json', 'scripts/data/vendor-checks.json'];

/* Each sector: how a question names it, its zone and tile family, its dots, and the sectors whose companies could
   pass for it (never a wrong answer). The groups follow the directory's own sidebar (vendor-directory.js). */
const SECTORS = {
  ehr: { ask: 'sells an electronic health record (EHR) system', z: 'tec', f: 'Vendors', d: 1, near: ['interop', 'imaging', 'clinical', 'scribing', 'rcm', 'analytics', 'engage', 'cloud'] },
  interop: { ask: 'sells interoperability software that moves data between health systems', z: 'tec', f: 'Vendors', d: 2, near: ['ehr', 'imaging', 'orgs', 'cloud', 'analytics', 'rx', 'engage', 'device'] },
  imaging: { ask: 'sells PACS, the software that stores and shows medical images', z: 'tec', f: 'Vendors', d: 2, near: ['ehr', 'interop', 'radiology', 'device', 'cardio', 'cloud'] },
  scribing: { ask: 'makes an ambient AI scribe that drafts clinical notes', z: 'tec', f: 'Vendors', d: 1, near: ['clinical', 'radiology', 'ehr', 'cloud', 'engage'] },
  clinical: { ask: 'makes clinical AI that supports bedside decisions', z: 'tec', f: 'Vendors', d: 2, near: ['scribing', 'radiology', 'ehr', 'labs', 'cardio', 'analytics', 'cloud', 'rpm'] },
  radiology: { ask: 'makes AI for radiology', z: 'tec', f: 'Vendors', d: 2, near: ['scribing', 'clinical', 'imaging', 'device', 'cardio', 'cloud'] },
  device: { ask: 'makes medical devices', z: 'tec', f: 'Vendors', d: 1, near: ['labs', 'cardio', 'rpm', 'rx', 'radiology', 'imaging', 'retail', 'supply', 'rcm'] },
  labs: { ask: 'runs lab or diagnostic testing', z: 'tec', f: 'Vendors', d: 1, near: ['device', 'cardio', 'rpm', 'rx', 'clinical', 'research', 'retail', 'radiology', 'imaging'] },
  cardio: { ask: 'focuses on heart care devices or diagnostics', z: 'tec', f: 'Vendors', d: 2, near: ['device', 'labs', 'rpm', 'rx', 'radiology', 'imaging', 'clinical', 'retail'] },
  rpm: { ask: 'makes remote patient monitoring devices', z: 'tec', f: 'Vendors', d: 2, near: ['device', 'labs', 'cardio', 'rx', 'telehealth', 'clinical', 'retail'] },
  rx: { ask: 'works in pharmacy and prescriptions', z: 'tec', f: 'Vendors', d: 1, near: ['device', 'labs', 'cardio', 'rpm', 'supply', 'payer', 'retail', 'rcm', 'telehealth'] },
  telehealth: { ask: 'offers telehealth visits', z: 'tec', f: 'Vendors', d: 1, near: ['engage', 'behavioral', 'rpm', 'retail', 'payer', 'rx', 'clinical'] },
  rcm: { ask: 'works in the revenue cycle: claims, billing and payment', z: 'tec', f: 'Vendors', d: 2, near: ['analytics', 'research', 'ehr', 'engage', 'payer', 'interop', 'rx', 'staffing'] },
  analytics: { ask: 'sells population health and analytics software', z: 'tec', f: 'Vendors', d: 2, near: ['rcm', 'research', 'ehr', 'interop', 'cloud', 'payer', 'clinical'] },
  research: { ask: 'serves clinical research and drug trials', z: 'tec', f: 'Vendors', d: 2, near: ['rcm', 'analytics', 'labs', 'cloud', 'clinical'] },
  cloud: { ask: 'is a big tech or cloud computing company', z: 'tec', f: 'Vendors', d: 1, near: ['retail', 'scribing', 'clinical', 'radiology', 'analytics', 'interop', 'cyber', 'research'] },
  cyber: { ask: 'sells health care cybersecurity', z: 'tec', f: 'Vendors', d: 2, near: ['orgs', 'cloud', 'interop'] },
  engage: { ask: 'runs patient intake, scheduling and messaging', z: 'pat', f: 'Patient apps', d: 2, near: ['telehealth', 'behavioral', 'ehr', 'rcm', 'interop', 'scribing', 'analytics', 'clinical'] },
  behavioral: { ask: 'offers mental health care', z: 'pat', f: 'Behavioral', d: 1, near: ['telehealth', 'engage', 'retail', 'rpm'] },
  retail: { ask: 'sells consumer health products or retail health care', z: 'pat', f: 'Consumer', d: 2, near: ['cloud', 'rx', 'telehealth', 'rpm', 'device', 'payer', 'behavioral'] },
  payer: { ask: 'is a health insurer', z: 'pay', f: 'Insurers', d: 1, near: ['supply', 'staffing', 'rcm', 'analytics', 'rx', 'retail', 'telehealth'] },
  supply: { ask: 'distributes medical supplies or runs a group purchasing organization', z: 'prv', f: 'Suppliers', d: 2, near: ['payer', 'staffing', 'rx', 'device', 'retail', 'rcm'] },
  staffing: { ask: 'is a health care staffing or workforce company', z: 'prv', f: 'Staffing', d: 1, near: ['payer', 'supply', 'engage', 'rcm'] },
  orgs: { ask: 'is a professional association, accreditor or standards body', z: 'pol', f: 'Health orgs', d: 1, near: ['cyber', 'interop'] }
};
/** the sectors asked "which was founded first" */
const FIRSTS = ['ehr', 'interop', 'labs', 'cardio', 'rpm', 'analytics', 'cyber', 'engage', 'staffing', 'orgs', 'telehealth', 'behavioral'];
/** entries that name a product line, not a company: asked who owns them, never where they are based */
const PRODUCT = /(Sepsis AI|DAX Copilot|Deterioration Index|AI Mammography|Health Cloud|Watson for Oncology|BD Pyxis|NextGen Connect)/;

/** the directory's own slug for a vendor (vendor-directory.js) */
const vdSlug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
/** a vendor as a question names it: "Veradigm (Allscripts)" stays whole, so does "AARC (American Assn ...)"; "Costco (Health)" is Costco */
const shown = (v) => v.name.replace(/\s*\(Health\)$/, '');
/** a country as a sentence says it */
const COUNTRY = { UK: 'the United Kingdom', Netherlands: 'the Netherlands' };
const countryName = (c) => COUNTRY[c] || c;
const gone = (v) => v.ownership === 'defunct' || v.status === 'discontinued' || v.status === 'cautionary' || v.sector === 'cautionary';
const first = (s) => String(s || '').split(/[\s(]/)[0].toLowerCase();

function build() {
  const V = readJson(reads[0]);
  const C = readJson(reads[1]);
  const ck = String((C._meta || {}).checked || '');
  if (!ck) return [];
  /** a vendor's live check, by the directory's slug; {} when it has none, so nothing about it reads as agreed */
  const chk = (v) => (C.vendors || {})[vdSlug(v.name)] || {};
  /** the source a question shows: the page the check found for that fact (`hqUrl` and the like), else the vendor's best
      page; its year when the page states one, else 2026 */
  const from = (v, field) => {
    const c = chk(v), own = c[field + 'Url'];
    const y = own ? c[field + 'Yr'] : c.yr;
    return { src: own ? c[field + 'Src'] : c.src, url: own || c.url, yr: Number.isInteger(y) ? y : 2026, ck };
  };
  const kindOk = (v) => chk(v).kindOk === true;
  const all = (V.vendors || []).filter((v) => v && v.name);
  const home = (v) => SECTORS[v.sector] || null;
  const see = (v) => 'vd|vendor=' + vdSlug(v.name) + '|' + v.name;
  const out = [];
  const r = rngFrom('huddle|vd');

  // ── who owns it ──
  const parents = [...new Set(all.map((v) => v.parent).filter(Boolean))];
  const bigNames = all.filter((v) => !gone(v) && v.ownership === 'public' && ['payer', 'supply', 'cloud', 'retail', 'device'].includes(v.sector))
    .map((v) => v.name.replace(/\s*\(.*\)$/, '').replace(/ Health$/, ''));
  const ownerPool = [...new Set(parents.concat(bigNames))];
  for (const v of all) {
    const S = home(v) || SECTORS.cloud;
    if (v.ownership !== 'subsidiary' || !v.parent || !SECTORS[v.sector] && v.sector !== 'cautionary') continue;
    if (v.name.toLowerCase().includes(first(v.parent)) || v.parent.toLowerCase().includes(first(v.name))) continue;   // the answer is in the name
    if (chk(v).ownerOk !== true) continue;
    // a name that opens with the owner's initials gives the answer away ("BD Pyxis" is Becton Dickinson's), 2026-10-18
    const initials = String(v.parent).split(/[\s&]+/).filter(Boolean).map((w) => w[0]).join('').toLowerCase();
    if (initials.length > 1 && first(v.name) === initials) continue;
    const p = withDistractors(r, v.parent, ownerPool, 4, (x) => !x.toLowerCase().includes(first(v.name)) && first(x) !== first(v.parent));
    if (!p) continue;
    const when = chk(v).acquiredOk === true ? (String(v.owner || '').match(/acq(?:\.|uired)?\s*(\d{4})/i) || [])[1] : undefined;
    const z = v.sector === 'cautionary' ? 'tec' : S.z;
    out.push({ ...from(v, 'owner'), z, f: 'Owners', id: 'vd-owner-' + vdSlug(v.name), k: kOf('vd', 'owner', vdSlug(v.name)), d: 2, t: 'choice',
      q: `Which company owns ${shown(v)}?`, o: p.o, a: p.a,
      why: when ? `${v.parent} bought it in ${when}.` : `It is part of ${v.parent}.`, see: see(v) });
  }

  // ── where it is based ──
  const countries = [...new Set(all.map((v) => v.hq && v.hq.country).filter(Boolean))];
  for (const v of all) {
    const S = home(v);
    if (!S || gone(v) || !v.hq || PRODUCT.test(v.name)) continue;
    if (v.hcShare === 'division' || (v.hcShare === 'minor' && / Health$/.test(v.name))) continue;
    if (v.ownership === 'subsidiary' && v.parent && v.name.toLowerCase().includes(first(v.parent))) continue;
    if (chk(v).hqOk !== true) continue;
    const city = chk(v).cityOk === true ? v.hq.city : undefined;   // the city line only where the check agrees
    const st = v.hq.state, country = v.hq.country;
    let p, q, right;
    if (st && FIFTY.includes(st)) {
      p = withDistractors(r, st, FIFTY, 4);
      q = `${shown(v)} is headquartered in which state?`;
      right = STATES[st];
      p.o = p.o.map(keyName);
    } else if (country) {
      p = withDistractors(r, country, countries.concat(['the United States']), 4);
      if (!p) continue;
      p.o = p.o.map(countryName);
      q = `${shown(v)} is headquartered in which country?`;
      right = countryName(country);
    } else continue;
    const d = v.ownership === 'public' || v.ownership === 'nonprofit' ? 2 : 3;
    const h = city ? `Its headquarters are in ${city}.` : undefined;
    const cityGives = h && p.o.some((o) => h.includes(o.replace(/^the /, '')));   // "Kansas City" next to a Kansas key, say
    out.push({ ...from(v, 'hq'), z: S.z, f: 'Home base', id: 'vd-hq-' + vdSlug(v.name), k: kOf('vd', 'hq', vdSlug(v.name)), d, t: 'choice',
      // without a checked city the line names the state or country and the directory's group for it (2026-10-20, DH12)
      q, o: p.o, a: p.a, why: city ? `${shown(v)} is based in ${city}, ${right}.` : `${shown(v)} is based in ${right}; the directory files it under ${V.sectorLabels[v.sector] || v.sector}.`,
      h: cityGives ? undefined : h, see: see(v) });
  }

  // ── what kind of company ──
  for (const [sector, S] of Object.entries(SECTORS)) {
    const mine = all.filter((v) => v.sector === sector && !gone(v) && kindOk(v));
    if (mine.length < 3) continue;
    // the wrong answers are companies with one line of work: never an association (they are not companies), and never
    // big tech or retail, whose health arms reach into nearly every sector (Apple runs research studies, Amazon a clinic).
    // Each one's own sector is checked (the why line names it), and one the check shows also does this work is never drawn.
    const far = all.filter((v) => !gone(v) && v.sector !== sector && SECTORS[v.sector] && !S.near.includes(v.sector)
      && (sector === 'orgs' || !['orgs', 'cloud', 'retail'].includes(v.sector))
      && !(SECTORS[v.sector].near || []).includes(sector)
      && kindOk(v) && !(chk(v).alsoFits || []).includes(sector));
    for (const v of r.shuffle(mine).slice(0, 6)) {
      const p = withDistractors(r, v, far, 4, (x) => first(x.name) !== first(v.name));
      if (!p) continue;
      out.push({ ...from(v, 'kind'), z: S.z, f: S.f, id: `vd-kind-${sector}-${vdSlug(v.name)}`, k: kOf('vd', 'kind', sector), d: S.d, t: 'choice',
        q: `Which of these ${S.ask}?`, o: p.o.map(shown), a: p.a,
        why: `The others: ${p.o.filter((x, i) => i !== p.a).map((x) => shown(x) + ', ' + (V.sectorLabels[x.sector] || x.sector)).join('; ')}.`, see: see(v) });
    }
  }

  // ── which was founded first ──
  // Insurers, distributors and revenue-cycle firms were built by mergers, and their founding years are argued (Cigna
  // counts from 1792 or from 1982), so this asks only in sectors whose companies have one founding each.
  for (const [sector, S] of Object.entries(SECTORS)) {
    if (!FIRSTS.includes(sector)) continue;
    const ok = all.filter((v) => v.sector === sector && !gone(v) && Number.isInteger(v.founded) && !v.parent && v.ownership !== 'subsidiary'
      && v.hcShare !== 'division' && v.hcShare !== 'minor' && !/spun off|spinoff|spin-off|merger|merged/i.test(String(v.owner))
      && chk(v).foundedOk === true);   // every option's year shows on the answer, so all four are checked
    if (ok.length < 4) continue;
    let made = 0;
    for (let tries = 0; made < 3 && tries < 300; tries++) {
      const four = r.shuffle(ok).slice(0, 4);
      const ys = four.map((v) => v.founded), oldest = Math.min(...ys), rest = ys.filter((y) => y !== oldest);
      if (rest.length !== 3 || Math.min(...rest) - oldest < 10) continue;
      const ans = ys.indexOf(oldest);
      const id = `vd-first-${sector}-${made}`;
      if (out.some((q) => q.k === kOf('vd', 'first', sector) && q.o[q.a] === shown(four[ans]))) continue;   // a new oldest each time
      out.push({ ...from(four[ans], 'founded'), z: S.z, f: 'Founded', id, k: kOf('vd', 'first', sector), d: 3, t: 'choice',
        q: `Which of these ${sector === 'orgs' ? 'organizations' : 'companies'} was founded first?`, o: four.map(shown), a: ans,
        v: four.map((v) => String(v.founded)), why: `${shown(four[ans])} dates from ${oldest}.`, see: see(four[ans]) });
      made++;
    }
  }
  return out;
}

// the sectors and the helpers are shared with vendor-facts.js (bank version 3), which asks other facts from the same checks
module.exports = { name: 'vendors', prefix: 'vd-', reads, build, SECTORS, FIRSTS, PRODUCT, vdSlug, shown, gone, first };
