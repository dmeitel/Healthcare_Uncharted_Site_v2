/* ================================================================
   build-hospital-enrichment.js — per-CCN hospital enrichment layer
   (2026-07-26, David's "add everything we can" round)

   Source: CMS Provider of Services File (Hospital & Non-Hospital
   Facilities, iQIES) via the data.cms.gov API — the same CCN key the
   operators map already carries, so the join is exact, no name matching.
   Plus: same-ZIP outpatient neighbor counts computed from the facility
   layers this repo already ships (ASCs, dialysis, pharmacies). Our pins
   are ZIP-centroid geocodes, so "same ZIP" is the HONEST proximity grain;
   a 400m radius would just be the same fact wearing false precision.

   Output: src/assets/data/hospital-enrich.json (minified, lazy-loaded by
   the operators map on idle — NEVER inlined into the boot payload).
   Raw API pages cache to scripts/.cache/ (gitignored).

   Run: node scripts/build-hospital-enrichment.js
   Re-run cadence: quarterly (POS releases) — check the catalog for the
   newest "Provider of Services File - Quality Improvement and Evaluation
   System" distribution and update DATASET_ID if the UUID rotated.
================================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

const DATASET_ID = '8ba0f9b4-9493-4aa0-9f82-44ea9468d1b5';   // POS Hospital & other, Q2 2026
const API = 'https://data.cms.gov/data-api/v1/dataset/' + DATASET_ID + '/data';
const CACHE_DIR = path.join(__dirname, '.cache');
const CACHE = path.join(CACHE_DIR, 'pos-hospitals-2026q2.json');
const OUT = path.join(__dirname, '..', 'src', 'assets', 'data', 'hospital-enrich.json');
const HOSPITALS = path.join(__dirname, '..', 'src', 'assets', 'data', 'us-hospitals.json');
const DATA_DIR = path.join(__dirname, '..', 'src', 'assets', 'data');

/* Service flags, in bitmask order. POSITION IS THE CONTRACT — the client
   decodes sv against _meta.svcOrder, so only ever APPEND to this list. */
const SVC = [
  ['er',      'DCTD_ER_SRVC_CD',              'Dedicated ER'],
  ['icu',     'ICU_SRVC_CD',                  'ICU'],
  ['ccu',     'CRNRY_CARE_UNIT_SRVC_CD',      'Coronary care unit'],
  ['sicu',    'SRGCL_ICU_SRVC_CD',            'Surgical ICU'],
  ['burn',    'BURN_CARE_UNIT_SRVC_CD',       'Burn care unit'],
  ['shktrma', 'SHCK_TRMA_SRVC_CD',            'Shock trauma'],
  ['nicu',    'NEONTL_ICU_SRVC_CD',           'Neonatal ICU'],
  ['nursery', 'NEONTL_NRSRY_SRVC_CD',         'Neonatal nursery'],
  ['ped',     'PED_SRVC_CD',                  'Pediatric services'],
  ['picu',    'PED_ICU_SRVC_CD',              'Pediatric ICU'],
  ['ob',      'OB_SRVC_CD',                   'Obstetrics'],
  ['surg',    'IP_SRGCL_SRVC_CD',             'Inpatient surgery'],
  ['opsurg',  'OP_SRGRY_UNIT_SRVC_CD',        'Outpatient surgery'],
  ['neuro',   'NRSRGCL_SRVC_CD',              'Neurosurgery'],
  ['ortho',   'ORTHPDC_SRGY_SRVC_CD',         'Orthopedic surgery'],
  ['heart',   'OPEN_HRT_SRGRY_SRVC_CD',       'Open-heart surgery'],
  ['cath',    'CRDC_CTHRTZTN_LAB_SRVC_CD',    'Cardiac cath lab'],
  ['txp',     'ORGN_TRNSPLNT_SRVC_CD',        'Organ transplant'],
  ['chemo',   'CHMTHRPY_SRVC_CD',             'Chemotherapy'],
  ['radonc',  'THRPTC_RDLGY_SRVC_CD',         'Radiation therapy'],
  ['mri',     'MGNTC_RSNC_IMG_SRVC_CD',       'MRI'],
  ['ct',      'CT_SCAN_SRVC_CD',              'CT scan'],
  ['pet',     'PET_SCAN_SRVC_CD',             'PET scan'],
  ['nucmed',  'NUCLR_MDCN_SRVC_CD',           'Nuclear medicine'],
  ['psych',   'PSYCH_SRVC_CD',                'Psychiatric services'],
  ['cap',     'CHLD_ADLSCNT_PSYCH_SRVC_CD',   'Child & adolescent psych'],
  ['empsych', 'EMER_PSYCH_SRVC_CD',           'Emergency psych'],
  ['sud',     'ALCHL_DRUG_SRVC_CD',           'Alcohol & drug services'],
  ['resp',    'RSPRTRY_CARE_SRVC_CD',         'Respiratory care'],
  ['dial',    'ACUTE_RNL_DLYS_SRVC_CD',       'Acute renal dialysis'],
  ['uc',      'URGNT_CARE_SRVC_CD',           'Urgent care']
];

const EXTRA_COLS = [
  'PRVDR_NUM', 'PGM_TRMNTN_CD', 'FIPS_STATE_CD', 'FIPS_CNTY_CD',
  'CBSA_URBN_RRL_IND', 'MDCL_SCHL_AFLTN_CD', 'RSDNT_PHYSN_CNT', 'RSDNT_PGM_PDTRC_SW',
  'CRTFD_BED_CNT', 'OPRTG_ROOM_CNT', 'CRDC_CTHRTZTN_PRCDR_ROOMS_CNT', 'DLYS_STN_CNT',
  'PSYCH_UNIT_SW', 'PSYCH_UNIT_BED_CNT', 'REHAB_UNIT_SW', 'REHAB_UNIT_BED_CNT',
  'RN_CNT', 'INHLTN_THRPST_CNT',
  'OFSITE_LCTN_CNT', 'TOT_OFSITE_EMER_DEPT_CNT', 'TOT_OFSITE_URGNT_CARE_CNTR_CNT',
  'TOT_AFLTD_ASC_CNT', 'TOT_AFLTD_ESRD_CNT', 'TOT_AFLTD_HHA_CNT', 'TOT_AFLTD_SNF_CNT',
  'TOT_AFLTD_FQHC_CNT', 'TOT_AFLTD_RHC_CNT', 'TOT_AFLTD_HOSPC_CNT'
];
const COLUMNS = EXTRA_COLS.concat(SVC.map(s => s[1])).join(',');

const offered = v => v === '1' || v === '2';   // POS: 1 = by staff, 2 = under arrangement
const num = v => { const n = parseInt(v, 10); return Number.isFinite(n) && n > 0 ? n : 0; };

async function fetchAllPOS(){
  if (fs.existsSync(CACHE)){
    console.log('cache hit:', CACHE);
    return JSON.parse(fs.readFileSync(CACHE, 'utf8'));
  }
  const rows = [];
  for (let offset = 0; ; offset += 5000){
    const url = API + '?filter[PRVDR_CTGRY_CD]=01&column=' + COLUMNS + '&size=5000&offset=' + offset;
    let page = null;
    for (let attempt = 1; attempt <= 3; attempt++){
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        page = await res.json();
        break;
      } catch(e){
        if (attempt === 3) throw e;
        console.log('  retry', attempt, e.message);
        await new Promise(r => setTimeout(r, 2500 * attempt));
      }
    }
    rows.push(...page);
    console.log('  page @', offset, '→', page.length, '(total', rows.length + ')');
    if (page.length < 5000) break;
  }
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(CACHE, JSON.stringify(rows));
  return rows;
}

function zipCounts(){
  // same-ZIP outpatient neighbors from the layers we already ship
  const load = f => {
    const d = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8'));
    return d.features ? d.features.map(x => x.properties || x) : d[Object.keys(d).find(k => Array.isArray(d[k]))];
  };
  const tally = list => {
    const m = {};
    list.forEach(r => { const z = (r.z || '').slice(0, 5); if (z) m[z] = (m[z] || 0) + 1; });
    return m;
  };
  return {
    asc: tally(load('us-ascs.json')),
    dial: tally(load('us-dialysis.json')),
    ph: tally(load('us-suppliers-pharmacy.json'))
  };
}

(async () => {
  const hosp = JSON.parse(fs.readFileSync(HOSPITALS, 'utf8')).hospitals;
  const ours = new Map(hosp.map(h => [h.id, h]));
  console.log('our hospitals:', ours.size);

  const rows = await fetchAllPOS();
  console.log('POS category-01 rows:', rows.length);

  // one row per CCN, active (00) beats terminated when both exist
  const best = new Map();
  rows.forEach(r => {
    const id = r.PRVDR_NUM;
    if (!ours.has(id)) return;
    const prev = best.get(id);
    if (!prev || (r.PGM_TRMNTN_CD === '00' && prev.PGM_TRMNTN_CD !== '00')) best.set(id, r);
  });
  console.log('matched to our set:', best.size, '(' + (100 * best.size / ours.size).toFixed(1) + '%)');

  const near = zipCounts();
  const byId = {};
  let svTotal = 0;
  best.forEach((r, id) => {
    const e = {};
    let mask = 0;
    SVC.forEach(([, col], i) => { if (offered(r[col])) mask |= (1 << i); });
    if (mask) { e.sv = mask; svTotal++; }
    const fips = (r.FIPS_STATE_CD || '').padStart(2, '0') + (r.FIPS_CNTY_CD || '').padStart(3, '0');
    if (fips.length === 5 && fips !== '00000') e.f = fips;
    if (r.CBSA_URBN_RRL_IND === 'R') e.ur = 1;             // urban is the default, flag rural only
    const ms = parseInt(r.MDCL_SCHL_AFLTN_CD, 10);
    if (ms >= 1 && ms <= 3) e.ms = ms;                     // 1 major · 2 limited · 3 graduate
    if (num(r.RSDNT_PHYSN_CNT)) e.res = num(r.RSDNT_PHYSN_CNT);
    if (r.RSDNT_PGM_PDTRC_SW === 'Y') e.pedres = 1;        // pediatric residency program
    if (num(r.OPRTG_ROOM_CNT)) e.or = num(r.OPRTG_ROOM_CNT);
    if (num(r.CRDC_CTHRTZTN_PRCDR_ROOMS_CNT)) e.cathrm = num(r.CRDC_CTHRTZTN_PRCDR_ROOMS_CNT);
    if (num(r.DLYS_STN_CNT)) e.dst = num(r.DLYS_STN_CNT);
    if (r.PSYCH_UNIT_SW === 'Y' && num(r.PSYCH_UNIT_BED_CNT)) e.psyb = num(r.PSYCH_UNIT_BED_CNT);
    if (r.REHAB_UNIT_SW === 'Y' && num(r.REHAB_UNIT_BED_CNT)) e.rehb = num(r.REHAB_UNIT_BED_CNT);
    if (num(r.RN_CNT)) e.rn = num(r.RN_CNT);
    if (num(r.INHLTN_THRPST_CNT)) e.rt = num(r.INHLTN_THRPST_CNT);
    if (num(r.OFSITE_LCTN_CNT)) e.off = num(r.OFSITE_LCTN_CNT);
    if (num(r.TOT_OFSITE_EMER_DEPT_CNT)) e.offed = num(r.TOT_OFSITE_EMER_DEPT_CNT);
    if (num(r.TOT_OFSITE_URGNT_CARE_CNTR_CNT)) e.offuc = num(r.TOT_OFSITE_URGNT_CARE_CNTR_CNT);
    const aff = {};
    [['asc','TOT_AFLTD_ASC_CNT'],['esrd','TOT_AFLTD_ESRD_CNT'],['hha','TOT_AFLTD_HHA_CNT'],
     ['snf','TOT_AFLTD_SNF_CNT'],['fqhc','TOT_AFLTD_FQHC_CNT'],['rhc','TOT_AFLTD_RHC_CNT'],
     ['hospc','TOT_AFLTD_HOSPC_CNT']].forEach(([k, col]) => { if (num(r[col])) aff[k] = num(r[col]); });
    if (Object.keys(aff).length) e.aff = aff;
    const z = (ours.get(id).z || '').slice(0, 5);
    const nb = {};
    if (near.asc[z]) nb.asc = near.asc[z];
    if (near.dial[z]) nb.dial = near.dial[z];
    if (near.ph[z]) nb.ph = near.ph[z];
    if (Object.keys(nb).length) e.near = nb;
    if (Object.keys(e).length) byId[id] = e;
  });

  const out = {
    _meta: {
      source: 'CMS Provider of Services File (Hospital & Non-Hospital Facilities, iQIES), 2026-04-01 release, joined by CCN',
      pulled: '2026-07-26',
      svcOrder: SVC.map(s => s[0]),
      svcLabels: Object.fromEntries(SVC.map(s => [s[0], s[2]])),
      codes: {
        sv: 'bitmask over svcOrder; listed = offered (POS code 1 by staff or 2 under arrangement)',
        ms: 'medical school affiliation: 1 major, 2 limited, 3 graduate',
        ur: '1 = rural CBSA (urban is the unmarked default)',
        near: 'facilities sharing the hospital ZIP from our shipped CMS layers (ZIP-centroid grain — this is co-location, not adjacency)',
        f: 'county FIPS straight from POS'
      }
    },
    byId
  };
  fs.writeFileSync(OUT, JSON.stringify(out));
  const kb = Math.round(fs.statSync(OUT).size / 1024);
  console.log('wrote', OUT, kb + 'KB ·', Object.keys(byId).length, 'hospitals ·', svTotal, 'with service masks');

  // spot checks against hospitals we know
  ['460001', '460004', '010001'].forEach(id => {
    const e = byId[id];
    if (!e) { console.log('  spot', id, 'MISSING'); return; }
    const svs = SVC.filter((s, i) => e.sv & (1 << i)).map(s => s[0]);
    console.log('  spot', id, (ours.get(id) || {}).n, '→', JSON.stringify({ ...e, sv: svs.join('+') }).slice(0, 220));
  });
})().catch(e => { console.error('FATAL', e); process.exit(1); });
