/**
 * U.S. Hospital Operations Map.
 *
 * Lifted out of an inline <script> on 2026-08-22 (docs/HU-BUILD-HARDENING-2026-08-22.md).
 * Loaded as type="module": deferred, scoped, cacheable, and visible to `npm run check`.
 * MapLibre and HUKit load as classic scripts beforehand.
 */
'use strict';
(function(){
  'use strict';
  const dcap = HUKit.dcap;
  /** untyped id lookup: callers want .value, .style and .dataset off the same call.
   * @param {string} id @returns {any} */
  const $ = id => document.getElementById(id);
  const status = $('gvStatus');
  function signal(msg){ status.textContent = msg; status.classList.remove('done'); }
  function signalDone(msg, ms){ if (msg) status.textContent = msg; setTimeout(() => status.classList.add('done'), ms || 1400); }
  // one polite live region: committed scope changes only, never hover (the V1 rule)
  function announce(msg){
    const el = $('gvLive'); if (!el) return;
    el.textContent = '';
    requestAnimationFrame(() => { el.textContent = msg; });
  }

  // CMS ships names in ALL CAPS — title-case them for labels and cards
  const ACRO = new Set(['VA','LLC','USA','LDS','IHC','UNM','UPMC','UCSF','UCLA','UAB','II','III','IV']);
  const tcase = s => String(s || '').toLowerCase().replace(/[\w']+/g, w => {
    const u = w.toUpperCase(); return ACRO.has(u) ? u : w.charAt(0).toUpperCase() + w.slice(1); });

  const HOSP_TYPES = {
    acute: { label:'Acute care',      color:'#FF6B6B' },
    cah:   { label:'Critical access', color:'#E8C547' },
    psych: { label:'Psychiatric',     color:'#5B9BD5' },
    va:    { label:'VA',              color:'#7FE3A0' },
    child: { label:"Children's",      color:'#D77BD6' },
    rural: { label:'Rural emergency', color:'#F2A65A' },
    dod:   { label:'Military',        color:'#9FB0C4' },
    ltac:  { label:'Long-term acute', color:'#4ECDC4' }
  };
  /* SCHOOLS (2026-10-03, David: "absorb it into the healthcare operations map... a specific image for a healthcare
     school... when it's selected it'll pop out into the different icons"). Schools are a layer here, one mortarboard
     per school in clinical white; selecting one pops its programs out around it on spokes, in these shapes and colors.
     What each program counts is written once, in scripts/pull/ipeds.js. */
  const SCHOOL_COLOR = '#F6F9FC';
  const PROGRAMS = {
    rn:  { label:'Registered nursing',        short:'RN',  color:'#FF6B6B' },
    np:  { label:'Nurse practitioner',        short:'NP',  color:'#D77BD6' },
    dnp: { label:'Doctor of nursing practice', short:'DNP', color:'#B07BD6' },
    md:  { label:'Medicine (MD)',             short:'MD',  color:'#5B9BD5' },
    do:  { label:'Osteopathic medicine (DO)', short:'DO',  color:'#7FE3A0' },
    pa:  { label:'Physician assistant',       short:'PA',  color:'#E8C547' },
    rt:  { label:'Respiratory therapy',       short:'RT',  color:'#4ECDC4' }
  };
  const PROGRAM_KEYS = Object.keys(PROGRAMS);   // a school's program mask: bit i is PROGRAM_KEYS[i]
  const PROGRAM_SHAPES = { rn:'circle', np:'heart', dnp:'ring', md:'star', do:'hexagon', pa:'diamond', rt:'triangle' };
  const TYPES = HOSP_TYPES;
  const typeColorExpr = ['match', ['get','t'],
    ...Object.entries(TYPES).flatMap(([k,v]) => [k, v.color]),
    'dialysis','#B07BD6', 'dial','#B07BD6',
    'asc','#35C7E8',
    'pharmacy','#A3E635', 'pharm','#A3E635',
    'dme','#C69A6D',
    'optical','#E8E8F0',
    'orthotics','#FF9E7D', 'ortho','#FF9E7D',
    '#4ECDC4'];

  const styleFor = () => document.documentElement.getAttribute('data-theme') === 'light'
    ? 'https://tiles.openfreemap.org/styles/positron'
    : 'https://tiles.openfreemap.org/styles/fiord';

  // ── per-type marker icons (item 7): canvas-drawn sprites, one shape per
  //    type, the type's color, a dark rim for contrast on any basemap ──
  const SHAPES = {
    cross: (c,s) => { const a = s*0.16; c.moveTo(-a,-s/2); c.lineTo(a,-s/2); c.lineTo(a,-a); c.lineTo(s/2,-a); c.lineTo(s/2,a); c.lineTo(a,a); c.lineTo(a,s/2); c.lineTo(-a,s/2); c.lineTo(-a,a); c.lineTo(-s/2,a); c.lineTo(-s/2,-a); c.lineTo(-a,-a); c.closePath(); },
    triangle: (c,s) => { c.moveTo(0,-s/2); c.lineTo(s/2,s/2*0.9); c.lineTo(-s/2,s/2*0.9); c.closePath(); },
    triangleDown: (c,s) => { c.moveTo(0,s/2); c.lineTo(s/2,-s/2*0.9); c.lineTo(-s/2,-s/2*0.9); c.closePath(); },
    hexagon: (c,s) => { for (let i = 0; i < 6; i++){ const a = Math.PI/6 + i*Math.PI/3; const x = Math.cos(a)*s/2, y = Math.sin(a)*s/2; i ? c.lineTo(x,y) : c.moveTo(x,y); } c.closePath(); },
    star: (c,s) => { for (let i = 0; i < 10; i++){ const r = i % 2 ? s*0.21 : s*0.52; const a = -Math.PI/2 + i*Math.PI/5; const x = Math.cos(a)*r, y = Math.sin(a)*r; i ? c.lineTo(x,y) : c.moveTo(x,y); } c.closePath(); },
    heart: (c,s) => { const k = s/2; c.moveTo(0,k*0.85); c.bezierCurveTo(-k*1.25,k*0.05,-k*0.6,-k*0.95,0,-k*0.3); c.bezierCurveTo(k*0.6,-k*0.95,k*1.25,k*0.05,0,k*0.85); c.closePath(); },
    square: (c,s) => { c.rect(-s*0.38,-s*0.38,s*0.76,s*0.76); },
    shield: (c,s) => { const k = s/2; c.moveTo(0,k); c.lineTo(-k*0.85,k*0.35); c.lineTo(-k*0.85,-k*0.7); c.lineTo(k*0.85,-k*0.7); c.lineTo(k*0.85,k*0.35); c.closePath(); },
    circle: (c,s) => { c.arc(0,0,s*0.42,0,Math.PI*2); },
    drop: (c,s) => { const k = s/2; c.moveTo(0,-k); c.bezierCurveTo(k*0.9,-k*0.05,k*0.62,k*0.85,0,k*0.85); c.bezierCurveTo(-k*0.62,k*0.85,-k*0.9,-k*0.05,0,-k); c.closePath(); },
    diamond: (c,s) => { c.moveTo(0,-s/2); c.lineTo(s*0.42,0); c.lineTo(0,s/2); c.lineTo(-s*0.42,0); c.closePath(); },
    pill: (c,s) => { const w = s*0.9, h = s*0.44, r = h/2; c.moveTo(-w/2+r,-h/2); c.lineTo(w/2-r,-h/2); c.arc(w/2-r,0,r,-Math.PI/2,Math.PI/2); c.lineTo(-w/2+r,h/2); c.arc(-w/2+r,0,r,Math.PI/2,-Math.PI/2); c.closePath(); },
    ring: (c,s) => { c.arc(0,0,s*0.42,0,Math.PI*2); c.moveTo(s*0.2,0); c.arc(0,0,s*0.2,0,Math.PI*2,true); },
    pentagon: (c,s) => { for (let i = 0; i < 5; i++){ const a = -Math.PI/2 + i*2*Math.PI/5; const x = Math.cos(a)*s/2, y = Math.sin(a)*s/2; i ? c.lineTo(x,y) : c.moveTo(x,y); } c.closePath(); },
    // a mortarboard: the flat board, then the crown under it with a sliver of air between
    cap: (c,s) => { const k = s/2;
      c.moveTo(-k,-k*0.2); c.lineTo(0,-k*0.64); c.lineTo(k,-k*0.2); c.lineTo(0,k*0.22); c.closePath();
      c.moveTo(-k*0.56,k*0.04); c.lineTo(-k*0.56,k*0.5); c.quadraticCurveTo(0,k*0.84,k*0.56,k*0.5); c.lineTo(k*0.56,k*0.04); c.lineTo(0,k*0.38); c.closePath(); }
  };
  const ICONS = {
    acute:'cross', cah:'triangle', psych:'hexagon', va:'star', child:'heart', rural:'triangleDown', dod:'shield', ltac:'circle',
    dialysis:'drop', dial:'drop', asc:'diamond', pharmacy:'pill', pharm:'pill', dme:'square', optical:'ring', orthotics:'pentagon', ortho:'pentagon',
    // the supplier file names this kind in full; without it these drew as the long-term acute icon (2026-10-03)
    'orthotics-prosthetics':'pentagon',
    school:'cap'
  };
  const iconColorOf = t => (TYPES[t] && TYPES[t].color) || ({ dialysis:'#B07BD6', dial:'#B07BD6', asc:'#35C7E8', pharmacy:'#A3E635', pharm:'#A3E635', dme:'#C69A6D', optical:'#E8E8F0', orthotics:'#FF9E7D', ortho:'#FF9E7D', 'orthotics-prosthetics':'#FF9E7D', school:SCHOOL_COLOR }[t]) || '#4ECDC4';
  function installIcons(){
    const S = 26, PAD = 6, PX = 2, W = (S + PAD) * PX;
    Object.entries(ICONS).forEach(([t, shape]) => {
      const name = 'ic-' + t;
      if (map.hasImage(name)) return;
      const cv = document.createElement('canvas'); cv.width = W; cv.height = W;
      const ctx = cv.getContext('2d');
      ctx.translate(W/2, W/2); ctx.scale(PX, PX);
      ctx.beginPath(); SHAPES[shape](ctx, S);
      ctx.fillStyle = iconColorOf(t); ctx.fill('evenodd');
      ctx.lineWidth = 2.4; ctx.strokeStyle = 'rgba(6,16,14,0.9)'; ctx.stroke();
      map.addImage(name, ctx.getImageData(0, 0, W, W), { pixelRatio: PX });
    });
    /* HOLLOW = on the map, outside the counts (2026-10-03): the mortarboard as an outline only, a dark stroke under a
       white one so it reads on both basemaps. New programs, schools outside the federal data, other campuses. */
    if (!map.hasImage('ic-schoolx')){
      const cv = document.createElement('canvas'); cv.width = W; cv.height = W;
      const ctx = cv.getContext('2d');
      ctx.translate(W/2, W/2); ctx.scale(PX, PX); ctx.lineJoin = 'round';
      ctx.beginPath(); SHAPES.cap(ctx, S);
      ctx.lineWidth = 4.6; ctx.strokeStyle = 'rgba(6,16,14,0.9)'; ctx.stroke();
      ctx.lineWidth = 2.4; ctx.strokeStyle = SCHOOL_COLOR; ctx.stroke();
      map.addImage('ic-schoolx', ctx.getImageData(0, 0, W, W), { pixelRatio: PX });
    }
  }
  /** a program's icon as an image, drawn the same way as the map's sprites, for the pop-out around a school */
  const iconURLs = {};
  function programIcon(t, hollow){
    const key = t + (hollow ? '-o' : '');
    if (iconURLs[key]) return iconURLs[key];
    const S = 26, PAD = 6, PX = 2, W = (S + PAD) * PX;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = W;
    const ctx = cv.getContext('2d');
    ctx.translate(W/2, W/2); ctx.scale(PX, PX);
    ctx.beginPath(); SHAPES[PROGRAM_SHAPES[t] || 'circle'](ctx, S);
    const color = (PROGRAMS[t] || {}).color || '#4ECDC4';
    if (hollow){ ctx.lineJoin = 'round'; ctx.lineWidth = 4.6; ctx.strokeStyle = 'rgba(6,16,14,0.9)'; ctx.stroke(); ctx.lineWidth = 2.6; ctx.strokeStyle = color; ctx.stroke(); }
    else { ctx.fillStyle = color; ctx.fill('evenodd'); ctx.lineWidth = 2.4; ctx.strokeStyle = 'rgba(6,16,14,0.9)'; ctx.stroke(); }
    return (iconURLs[key] = cv.toDataURL());
  }
  const iconExpr = ['match', ['get','t'], ...Object.keys(ICONS).flatMap(t => [t, 'ic-' + t]), 'ic-ltac'];

  // ── HOME VIEW. Computed from the real container, never hardcoded. Twin of the
  //    Population Health Map, and it shipped with the twin's bug: center
  //    [-96.5,39.3] zoom 3.6 minZoom 2.8 is a desktop camera, and at 360px it
  //    showed 36% of the width of the lower 48 with the floor capping at 63%,
  //    so the country was unreachable on a phone. Desktop is unchanged. ──
  const homeNow = () => HUKit.conusView(document.getElementById('gvMap'));
  const HOME = homeNow();
  const map = new maplibregl.Map({
    container:'gvMap', style: styleFor(),
    center:HOME.center, zoom:HOME.zoom, minZoom:HOME.minZoom, maxZoom:15,
    renderWorldCopies:false,
    attributionControl:false
  });
  // Reset re-measures, so a rotated phone gets its own fit rather than the boot one.
  function flyHome(dur){
    const h = homeNow();
    map.setMinZoom(h.minZoom);
    map.flyTo({ center:h.center, zoom:h.zoom, duration:dcap(dur == null ? 900 : dur) });
  }
  let homeRz;
  window.addEventListener('resize', () => {
    clearTimeout(homeRz);
    homeRz = setTimeout(() => { map.setMinZoom(homeNow().minZoom); }, 200);
  });
  // OSM/OpenFreeMap credit bottom-LEFT; the HU attribution strip owns bottom-right
  map.addControl(new maplibregl.AttributionControl({ compact:true }), 'bottom-left');
  map.touchZoomRotate.disableRotation();
  map.dragRotate.disable();
  // SOFT North-America lock. The hard maxBounds constraint fought fitBounds
  // (it re-clamps mid-animation, and every state fit ended in the Pacific).
  // Instead: camera flies free, and eases home only if it truly leaves NA.
  const NA = { w:-180, s:10, e:-50, n:74 };
  let naReturning = false;
  map.on('moveend', () => {
    if (naReturning) return;
    const c = map.getCenter();
    if (c.lng < NA.w || c.lng > NA.e || c.lat < NA.s || c.lat > NA.n){
      naReturning = true;
      map.easeTo({ center:[Math.min(Math.max(c.lng, NA.w), NA.e), Math.min(Math.max(c.lat, NA.s), NA.n)], duration:dcap(500) });
      setTimeout(() => { naReturning = false; }, 700);
    }
  });

  // ── state ──
  let ALL = [];                  // hospital features
  let STATES = null;             // states FeatureCollection
  const COUNTY_CACHE = new Map();// state fips -> counties FeatureCollection
  let activeTypes = null;        // Set of type keys, or null = all
  let selectedId = null;         // hospital id
  let selState = null;           // {fips, abbr, name, feature}
  let selCounty = null;          // {fips, name, feature}
  let mode = 'card';             // 'card' | 'list'
  let backTo = null;             // card X walks back: null | 'list' | 'county' | 'state'

  // filtered() is memoized — moveend work runs it several times per settle,
  // and the pharmacy-scale future (70k+ points) can't afford fresh passes
  let _filteredCache = null;
  const filtered = () => _filteredCache || (_filteredCache = (activeTypes ? ALL.filter(f => activeTypes.has(f.properties.t)) : ALL));
  const dropFilterCache = () => { _filteredCache = null; };
  // dataset switch: hospitals ride the national file; pharmacies ride PER-STATE
  // shards loaded on selection — the 6.15MB supplier file NEVER ships whole
  // the full operators-map dataset registry. Loading per rule 7: hospitals at
  // boot; whole-file datasets (≤1.5MB) load ON SWITCH, signaled + cached;
  // pharmacy (6.15MB) rides per-state shards only.
  const HOSP_DATASETS = {
    hosp:    { label:'Hospitals',       noun:'hospitals' },
    school:  { label:'Schools',         noun:'schools',             file:'/assets/data/us-health-schools.json' },
    dial:    { label:'Dialysis',        noun:'dialysis centers',    file:'/assets/data/us-dialysis.json' },
    asc:     { label:'Surgery centers', noun:'surgery centers',     file:'/assets/data/us-ascs.json' },
    pharm:   { label:'Pharmacies',      noun:'pharmacies',          shard:'pharmacy' },
    dme:     { label:'Home equipment',  noun:'equipment suppliers', file:'/assets/data/us-suppliers-dme.json' },
    optical: { label:'Optical',         noun:'optical suppliers',   file:'/assets/data/us-suppliers-optical.json' },
    ortho:   { label:'Orthotics',       noun:'orthotics suppliers', file:'/assets/data/us-suppliers-orthotics-prosthetics.json' }
  };
  /** @type {Record<string, {label: string, noun: string, file?: string, shard?: string}>} */
  const DATASETS = HOSP_DATASETS;
  // LAYERS, not modes (David's call): every dataset is a toggle, all can ride
  // at once, each non-hospital layer wears its own color. Hospitals keep the
  // type palette and the type chips.
  const LAYER_COLORS = { school:SCHOOL_COLOR, dial:'#B07BD6', asc:'#35C7E8', pharm:'#A3E635', dme:'#C69A6D', optical:'#E8E8F0', ortho:'#FF9E7D' };
  const LAYER_ON = new Set(['hosp']);
  let activeSystem = null;   // health-system drill-through (nationwide, hospitals only)
  const PHARM_CACHE = new Map();
  const WHOLE_CACHE = {};
  const activeSet = () => {
    const out = [];
    if (LAYER_ON.has('hosp')) out.push(...(activeSystem ? filtered().filter(f => f.properties.sys === activeSystem) : filtered()));
    for (const k of LAYER_ON){
      if (k === 'hosp') continue;
      if (DATASETS[k].shard){ if (selState){ const s = PHARM_CACHE.get(selState.abbr); if (s) out.push(...s); } }
      else if (WHOLE_CACHE[k]){
        if (k === 'school'){ const pm = programMask(); out.push(...(pm ? WHOLE_CACHE[k].filter(f => f.properties.pm & pm) : WHOLE_CACHE[k])); continue; }
        const m = SUPPLY_LAYERS.has(k) ? supplyMask() : 0;   // the supplies filter keeps a supplier carrying ANY chosen group
        out.push(...(m ? WHOLE_CACHE[k].filter(f => f.properties.sg & m) : WHOLE_CACHE[k]));
      }
    }
    return out;
  };
  // draw-boundary scope (item 9): a freehand loop replaces the viewport as the scope
  let drawnPoly = null;
  const scopedSet = () => drawnPoly ? activeSet().filter(f => pip(f.geometry.coordinates, drawnPoly)) : activeSet();
  const inView = () => {
    if (drawnPoly) return scopedSet();                     // the loop IS the viewport
    const b = map.getBounds(); return activeSet().filter(f => b.contains(f.geometry.coordinates));
  };
  const inState = abbr => activeSet().filter(f => f.properties.s === abbr);
  // a scope card's kicker says when a filter is narrowing what it counts
  const filteredTag = () => (activeTypes && LAYER_ON.has('hosp')) || (activePrograms && LAYER_ON.has('school')) || (activeSupplies && [...LAYER_ON].some(k => SUPPLY_LAYERS.has(k))) ? ' · filtered' : '';
  const NOUN = () => LAYER_ON.size === 1 ? DATASETS[[...LAYER_ON][0]].noun : 'facilities';
  /* EQUIPMENT SUPPLIERS (2026-10-03, step 4): the home equipment, orthotics and optical files say what each supplier
     carries, as a group mask (sg) and its CMS categories (sl, two base-36 digits each, into the file's own list). The
     groups, their labels and the category names come from the file (scripts/build-suppliers.js), not from here. */
  const SUPPLY_LAYERS = new Set(['dme', 'optical', 'ortho']);
  let SUPPLY_META = null;        // { supplies: [CMS names], groups: [{key, label, items}] } once an equipment layer lands
  let activeSupplies = null;     // Set of supply group keys, or null = every supplier
  const supplyMask = () => {
    if (!activeSupplies || !SUPPLY_META) return 0;
    let m = 0; SUPPLY_META.groups.forEach((g, i) => { if (activeSupplies.has(g.key)) m |= 1 << i; });
    return m;
  };
  const supplyGroupsOf = p => SUPPLY_META ? SUPPLY_META.groups.filter((g, i) => (+p.sg || 0) & (1 << i)) : [];
  /** "Oxygen, CPAP and BiPAP +7": the chosen supplies first, for a list row */
  const supplySummary = p => {
    const on = g => activeSupplies && activeSupplies.has(g.key) ? 1 : 0;
    const gs = supplyGroupsOf(p).sort((a, b) => on(b) - on(a));
    return gs.slice(0, 2).map(g => g.label).join(', ') + (gs.length > 2 ? ' +' + (gs.length - 2) : '');
  };
  const toFeatures = (list, dsKey) => list.filter(h => h.lo != null && h.la != null).map(h => ({
    type:'Feature',
    geometry:{ type:'Point', coordinates:[h.lo, h.la] },
    properties:Object.assign({ id:h.id, n:tcase(h.n), c:tcase(h.c), s:h.s, t:h.t || dsKey, r:h.r || 0, beds:h.beds || 0,
      st:h.st || 0, trauma:h.trauma || '', sys:h.sys || '', od:h.od || '', e:h.e ? 1 : 0 },
      SUPPLY_LAYERS.has(dsKey) ? { pt:h.pt || '', a:h.a ? 1 : 0, sg:h.sg || 0, sl:h.sl || '' } : {})
  }));
  async function loadWhole(ds){
    if (WHOLE_CACHE[ds]) return;
    const D = DATASETS[ds];
    signal('Loading ' + D.noun + '…');
    try {
      const j = await fetch(D.file).then(r => r.json());
      if (j._meta && j._meta.supplies && j._meta.groups && !SUPPLY_META) SUPPLY_META = { supplies: j._meta.supplies, groups: j._meta.groups, released: j._meta.released || '', pulled: j._meta.pulled || '' };
      WHOLE_CACHE[ds] = ds === 'school' ? schoolSites(j) : toFeatures(j.facilities || j.hospitals || [], ds);
      if (ds === 'school') loadAccred();   // beside the schools, never in their way
      signalDone('✓ ' + WHOLE_CACHE[ds].length.toLocaleString('en-US') + ' ' + D.noun + (ds === 'school' ? ' · federal college data' : ' · live CMS data'));
    } catch(e){ WHOLE_CACHE[ds] = []; signalDone("Couldn't load " + D.noun, 2400); }
  }
  /* SCHOOL SITES. The file ships two tables (pull/ipeds.js): schools [unitid, name, city, state, county, lon, lat,
     control, website, online %] and programs [unitid, program, "level:awards|..."]. One feature per SCHOOL, so a school
     with three programs is one mark, not three (David, 2026-10-03: Rocky Mountain's PA, NP and DNP read as three
     schools). Its programs live in SCHOOL_PROGS by unitid, and as a mask (pm) and a short list (pl) on the feature.
     Every property is a scalar: a tap hands over MapLibre's copy, where an object would arrive as a string. The id is
     "u" + the unitid, so a school can never share an id with a hospital's CMS number. */
  let SCHOOL_META = null;
  const SCHOOL_PROGS = new Map();   // unitid -> [{ t, lv, g }] in PROGRAM_KEYS order
  function schoolSites(j){
    SCHOOL_META = j._meta;
    const by = new Map();
    for (const p of j.programs){
      if (!PROGRAMS[p[1]]) continue;
      const g = String(p[2]).split('|').reduce((a, x) => a + +x.split(':')[1], 0);
      if (!by.has(p[0])) by.set(p[0], []);
      by.get(p[0]).push({ t:p[1], lv:p[2], g });
    }
    return j.schools.filter(s => by.has(s[0])).map(s => {
      const ps = by.get(s[0]).sort((a, b) => PROGRAM_KEYS.indexOf(a.t) - PROGRAM_KEYS.indexOf(b.t));
      SCHOOL_PROGS.set(s[0], ps);
      let pm = 0; ps.forEach(x => { pm |= 1 << PROGRAM_KEYS.indexOf(x.t); });
      return { type:'Feature', geometry:{ type:'Point', coordinates:[s[5], s[6]] },
        properties:{ id:'u' + s[0], u:s[0], n:s[1], c:s[2], s:s[3], co:s[4], t:'school', ctl:s[7], web:s[8], ol:s[9] == null ? -1 : s[9],
          pm, np:ps.length, g:ps.reduce((a, x) => a + x.g, 0), pl:ps.map(x => PROGRAMS[x.t].short).join(' · '),
          r:0, beds:0, st:0, trauma:'', sys:'', od:'', e:0 } };
    });
  }
  /* ACCREDITATION (2026-10-03, the cross-check David asked for: "how can we confirm that our data sets are solid").
     scripts/check-schools.js holds each program against its accreditor's own list and writes what matched: the
     accreditor, the status, and the campuses a program teaches at away from the school IPEDS counts it under (Rocky
     Vista University's DOs in Ivins, Utah count in Parker, Colorado). Medicine, osteopathic medicine, PA and RT only;
     nursing accreditation is voluntary, so nursing stays in the report (docs/HU-SCHOOLS-CROSSCHECK.md). */
  let ACCRED = null, ACCRED_META = null, ACCRED_P = null;
  /* NEW PROGRAMS AND CAMPUSES (David, 2026-10-03: "go with both, show new programs and campus marks"). Drawn hollow and
     kept out of every count, rank, ring and list, so the numbers stay the federal year's:
       FRESH  an accredited program with no graduates yet, at a school already on the map (Weber State's PA program),
              which joins that school's pop-out and card as a hollow program;
       EXTRA  a mark of its own: a new school with nothing on the map yet ('new'), a school outside the federal data
              ('outside', Noorda), or a campus whose graduates IPEDS counts under its main school ('campus', Rocky
              Vista in Ivins). Its own map source, never clustered, so no count can reach it. */
  const FRESH = new Map();   // unitid -> [{ t, src, status, since }]
  let EXTRA = [];
  /** @returns {Promise<void>} */
  function loadAccred(){
    return ACCRED_P || (ACCRED_P = (async () => {
      ACCRED = new Map();
      try {
        const j = await fetch('/assets/data/us-health-schools-accred.json').then(r => r.json());
        ACCRED_META = j._meta;
        for (const r of j.rows){ const k = r[0] + '|' + r[1]; if (!ACCRED.has(k)) ACCRED.set(k, []); ACCRED.get(k).push(r); }
        for (const r of j.fresh || []){ if (!FRESH.has(r[0])) FRESH.set(r[0], []); FRESH.get(r[0]).push({ t:r[1], src:r[2], status:r[3], since:r[4] }); }
        EXTRA = (j.extra || []).map(x => {
          let pm = 0; x[9].forEach(p => { const i = PROGRAM_KEYS.indexOf(p[0]); if (i >= 0) pm |= 1 << i; });
          // every property a scalar: a tap hands over MapLibre's copy, where an array would arrive as a string anyway
          return { type:'Feature', geometry:{ type:'Point', coordinates:[x[5], x[6]] }, properties:{ id:x[0], t:'schoolx', k:x[1], n:x[2], c:x[3], s:x[4],
            how:x[7], par:x[8], pr:JSON.stringify(x[9]), ctl:x[10] || 0, web:x[11] || '', note:x[12] || '', u: x[1] === 'new' ? x[0].slice(1) : '', pm,
            pl:x[9].map(p => (PROGRAMS[p[0]] || {}).short).filter(Boolean).join(' · ') } };
        });
        sideStep();
        refreshSource();
        // a program card that opened first (a link straight to it) gets its rows now
        if (mode === 'card' && progFocus && backSchool && sheetEl.classList.contains('open')) openProgram(backSchool.p, progFocus, backSchool.from);
        if ($('gvSearch').classList.contains('open')) buildResults();
      } catch(e){ /* the cards go without the rows, and the extra marks stay off */ }
    })());
  }
  /* SIDE-STEP: a hollow mark within 0.6 km of a filled school would sit on top of it (Noorda is 0.48 km from Rocky
     Mountain University, the spot David asked about). It stands beside it instead: anchored on the side away from the
     neighbor, so it moves a fixed few pixels at any zoom and sits on its own point once you are close. */
  function sideStep(){
    const all = WHOLE_CACHE.school || [];
    EXTRA.forEach(x => {
      const c = x.geometry.coordinates;
      let best = null, bd = 0.6;
      all.forEach(f => { const d = hav(c, f.geometry.coordinates) * 1.609; if (d < bd){ bd = d; best = f; } });
      x.properties.anc = best ? (best.geometry.coordinates[0] <= c[0] ? 'left' : 'right') : 'center';
    });
  }
  // the icon's half width on screen at a zoom, the same stops as the icon size
  const halfIcon = z => 16 * (z <= 4.6 ? 0.5 : z <= 8 ? 0.5 + (z - 4.6) / 3.4 * 0.15 : z <= 11 ? 0.65 + (z - 8) / 3 * 0.2 : z <= 14 ? 0.85 + (z - 11) / 3 * 0.2 : 1.05);
  /** how far a side-stepped mark's icon sits from its point, in pixels */
  const stepOf = p => { const a = p && p.anc; const h = halfIcon(map.getZoom()); return a === 'left' ? [h, 0] : a === 'right' ? [-h, 0] : [0, 0]; };
  const freshOf = p => (p && p.u && FRESH.get(p.u)) || [];
  const extraProgs = p => { try { return JSON.parse(p.pr).map(x => ({ t:x[0], src:x[1], status:x[2], since:x[3], name:x[4] })); } catch(e){ return []; } };
  /** the marks the Schools layer adds, under the same program filter as the schools */
  const extraSet = () => { if (!LAYER_ON.has('school')) return []; const m = programMask(); return m ? EXTRA.filter(x => x.properties.pm & m) : EXTRA; };
  const parentOf = p => (p && p.par ? schoolOf(p.par) : null);
  const parentLabel = p => { const f = parentOf(p); return f ? f.properties.n + ', ' + f.properties.c + ', ' + f.properties.s : 'its main school'; };
  /** everything that pops out around a mark: graduated programs filled, the rest hollow with a word on why */
  function popProgs(p){
    if (p.k){
      const why = p.k === 'campus' ? 'graduates counted under ' + parentLabel(p) : p.k === 'outside' ? 'not in the federal college data' : 'new, no graduates yet';
      return extraProgs(p).map(x => Object.assign(x, { g:0, hollow:true, why }));
    }
    return programsOf(p).concat(freshOf(p).map(x => Object.assign({}, x, { g:0, hollow:true, why:'new, no graduates yet' })));
  }
  const srcShort = k => ((ACCRED_META && ACCRED_META.sources[k]) || { short:k }).short;
  const statusText = x => x.src === 'aacom' ? 'listed by AACOM' : srcShort(x.src) + ' · ' + x.status + ((String(x.since).match(/^(\d{4})/) || [])[1] ? ', since ' + String(x.since).slice(0, 4) : '');
  const accredLine = k => ACCRED_META ? 'Accreditation from ' + srcShort(k) + "'s own list, checked " + longDate(ACCRED_META.checked) + '.' : '';
  const whyHollow = kind => kind === 'campus' ? "IPEDS counts this campus's graduates under its main school, so the numbers are on that school's card."
    : kind === 'outside' ? 'The federal college data (IPEDS) does not carry this school, so it has no graduate count and stays out of every count and rank.'
    : 'New since the federal year: IPEDS shows no graduates in this program in ' + schoolYear() + ', so it stays out of every count and rank until it does.';
  const placedLine = p => p.how === 'city' ? 'Placed at the center of ' + p.c + ': the accreditor names the city, not the street.'
    : p.how === 'address' ? "Placed at the program's street address on " + srcShort((extraProgs(p)[0] || {}).src) + "'s list."
    : p.how === 'hand' ? 'Placed at ' + p.note + '.' : 'Placed where IPEDS puts the school.';
  /** select a mark in either source */
  function selectMark(id){
    if (map.getLayer('gv-selected')) map.setFilter('gv-selected', ['==', ['get','id'], id || '___none']);
    if (map.getLayer('gv-extra-sel')){
      map.setFilter('gv-extra-sel', ['==', ['get','id'], id || '___none']);
      const x = id && EXTRA.find(f => f.properties.id === id);
      map.setPaintProperty('gv-extra-sel', 'circle-translate', stepOf(x ? x.properties : null));
    }
  }
  /** a button that takes a campus to its main school, on the same program when it has one */
  function parentButton(host, p, t){
    const f = parentOf(p); if (!f) return;
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'gv-tolist';
    btn.textContent = 'Open ' + f.properties.n + ' →';
    btn.addEventListener('click', () => {
      if (t && programsOf(f.properties).some(y => y.t === t)) openProgram(f.properties, t, null); else openSchoolSite(f.properties, null);
      map.easeTo({ center:f.geometry.coordinates, zoom:Math.max(map.getZoom(), 9), duration:dcap(900) });
    });
    host.appendChild(btn);
  }
  /** a hollow program's card: new, outside the federal data, or taught at a campus counted elsewhere */
  function openNewProgram(p, x, from){
    mode = 'card'; backTo = 'school'; backSchool = { p, from }; progFocus = x.t;
    selectedId = p.id;
    const T = PROGRAMS[x.t], kind = p.k || 'new';
    const mark = p.k ? EXTRA.find(f => f.properties.id === p.id) : schoolOf(p.u);
    const mi = mark ? milesTo(mark.geometry.coordinates) : null;
    const b = cardScaffold(T.label, p.n, p.c + ', ' + p.s + (mi != null ? ' · ' + mi.toFixed(1) + ' mi from you' : ''));
    statTiles(b, [kind === 'campus' ? { v:'Elsewhere', k:'Graduates counted' } : kind === 'outside' ? { v:'Not in IPEDS', k:'Federal college data' } : { v:'None yet', k:'Graduates, ' + schoolYear() },
      { v:srcShort(x.src), k:'Accreditor' }]);
    const ex = b.querySelector('.gv-extra');
    const rows = [['Accreditation', statusText(x), 1]];
    if (x.name && x.name !== p.n) rows.push(['Listed as', x.name, 1]);
    if (kind === 'campus') rows.push(['Graduates counted under', parentLabel(p), 1]);
    factsBlock(ex, rows);
    if (kind === 'campus') parentButton(ex, p, x.t);
    ex.appendChild(linkChip());
    const src = document.createElement('div'); src.className = 'gv-cardsrc';
    src.textContent = whyHollow(kind) + ' ' + accredLine(x.src) + (p.k ? ' ' + placedLine(p) : '');
    ex.appendChild(src);
    backButton(b);
    selectMark(p.id);
    sheetEl.classList.add('open');
    setDetQuiet('dt-peek');
    if (mark) showPop(mark, x.t, from);
    announce(T.label + ' at ' + p.n + '. ' + (kind === 'campus' ? 'Graduates counted under its main school.' : kind === 'outside' ? 'Not in the federal college data.' : 'New, no graduates yet.'));
    syncURL();
  }
  /** an extra mark's own card: a new school, a school outside the federal data, or a campus */
  function openExtra(p0, from){
    const feat = EXTRA.find(f => f.properties.id === p0.id);
    const p = feat ? feat.properties : p0;
    mode = 'card'; backTo = from || null; progFocus = null;
    selectedId = p.id;
    const ps = popProgs(p);
    const ctl = p.ctl && SCHOOL_META && SCHOOL_META.control ? SCHOOL_META.control[p.ctl] : '';
    const mi = feat ? milesTo(feat.geometry.coordinates) : null;
    const b = cardScaffold(p.k === 'campus' ? 'Campus' : p.k === 'new' ? 'New healthcare school' : 'Healthcare school', p.n,
      p.c + ', ' + p.s + (ctl ? ' · ' + ctl : '') + (mi != null ? ' · ' + mi.toFixed(1) + ' mi from you' : ''));
    statTiles(b, [{ v:String(ps.length), k:ps.length === 1 ? 'Program' : 'Programs' },
      p.k === 'campus' ? { v:'Elsewhere', k:'Graduates counted' } : p.k === 'outside' ? { v:'Not in IPEDS', k:'Federal college data' } : { v:'None yet', k:'Graduates, ' + schoolYear() }]);
    const ex = b.querySelector('.gv-extra');
    const w = titledSection(ex, 'Programs');
    const list = document.createElement('div'); list.className = 'gv-rows gv-progs';
    ps.forEach(x => {
      const P = PROGRAMS[x.t]; if (!P) return;
      const r = document.createElement('button'); r.type = 'button'; r.className = 'gv-row';
      r.innerHTML = '<div class="rn"></div><div class="rs"><i></i><span></span></div>';
      r.querySelector('.rn').textContent = P.label;
      const dot = /** @type {HTMLElement} */ (r.querySelector('.rs i')); dot.style.background = 'transparent'; dot.style.boxShadow = 'inset 0 0 0 2px ' + P.color;
      r.querySelector('.rs span').textContent = statusText(x) + (x.name && x.name !== p.n ? ' · ' + x.name : '');
      r.addEventListener('click', () => openProgram(p, x.t, from));
      list.appendChild(r);
    });
    w.appendChild(list);
    if (p.k === 'campus'){ factsBlock(ex, [['Graduates counted under', parentLabel(p), 1]]); parentButton(ex, p, null); }
    if (p.web) aLink(ex, 'School website ↗', p.web);
    if (feat) aLink(ex, 'View on Google Maps ↗', 'https://www.google.com/maps/search/?api=1&query=' + feat.geometry.coordinates[1] + ',' + feat.geometry.coordinates[0]);
    ex.appendChild(linkChip());
    const src = document.createElement('div'); src.className = 'gv-cardsrc';
    src.textContent = whyHollow(p.k) + ' ' + accredLine((ps[0] || {}).src) + ' ' + placedLine(p);
    ex.appendChild(src);
    backButton(b);
    selectMark(p.id);
    sheetEl.classList.add('open');
    setDetQuiet('dt-peek');
    if (feat) showPop(feat, null, from);
    announce(p.n + ', ' + p.c + ', ' + p.s + '. ' + (p.k === 'campus' ? 'A campus; its graduates count under ' + parentLabel(p) + '.' : p.k === 'outside' ? 'Not in the federal college data.' : 'New, no graduates yet.'));
    syncURL();
  }
  /** a program's accreditation, as fact rows: its accreditor and status, and the campuses it also teaches at */
  function accredRows(u, t){
    const rs = (ACCRED && ACCRED.get(u + '|' + t)) || [];
    if (!rs.length || !ACCRED_META) return [];
    const home = rs.find(r => !r[7]) || rs[0];
    const src = ACCRED_META.sources[home[2]] || { short: home[2] };
    const yr = (String(home[4]).match(/^(\d{4})/) || [])[1];   // ARC-PA writes 2015/03/06, LCME 1946
    const out = [['Accreditation', home[2] === 'aacom' ? 'Listed by AACOM' : src.short + ' · ' + home[3] + (yr ? ', since ' + yr : ''), 1]];
    const away = [...new Set(rs.filter(r => r[7]).map(r => r[5] + ', ' + r[6]))];
    if (away.length) out.push(['Also taught at', away.join(' · '), 1]);
    return out;
  }
  const accredSource = (u, t) => {
    const rs = ACCRED && ACCRED.get(u + '|' + t);
    if (!rs || !ACCRED_META) return '';
    const src = ACCRED_META.sources[rs[0][2]] || { short: rs[0][2] };
    return ' Accreditation from ' + src.short + "'s own list, checked " + longDate(ACCRED_META.checked) + '.';
  };
  /** the school feature for a unitid, filters aside (cards and ranks read the whole layer) */
  const schoolOf = u => (u && WHOLE_CACHE.school && WHOLE_CACHE.school.find(f => f.properties.u === u)) || (u && EXTRA.find(f => f.properties.u === u)) || null;
  const programsOf = p => SCHOOL_PROGS.get(p.u) || [];
  // the programs filter, the schools' answer to hospital types: a school shows when it offers ANY chosen program
  let activePrograms = null;   // Set of program keys, or null = every school
  const programMask = () => { if (!activePrograms) return 0; let m = 0; activePrograms.forEach(k => { m |= 1 << PROGRAM_KEYS.indexOf(k); }); return m; };
  /** a school's graduates in the chosen programs (all of them with no filter) */
  const gradsIn = p => programsOf(p).filter(x => !activePrograms || activePrograms.has(x.t)).reduce((a, x) => a + x.g, 0);

  /* THE POP-OUT (David: "when it's selected it'll pop out into the different icons that indicate the different
     schooling types"). A selected school's programs open around it on spokes, one button each in the program's shape and
     color, tappable and reachable by keyboard; the program you are reading is ringed. It is a marker on the map, so it
     rides pans and zooms, and it closes with the card. */
  let popMarker = null, popFor = null, popStep = null;
  // the popped school's own name would sit under its buttons, so it steps aside while they are open (the card names it)
  const labelFilter = () => popFor ? ['all', ['!', ['has', 'point_count']], ['!=', ['get', 'id'], popFor]] : ['!', ['has', 'point_count']];
  const syncLabels = () => ['gv-labels', 'gv-labels-rich', 'gv-extra-labels'].forEach(id => { if (map.getLayer(id)) map.setFilter(id, labelFilter()); });
  function hidePop(){ if (popMarker){ popMarker.remove(); popMarker = null; popFor = null; syncLabels(); } }
  function showPop(feat, activeT, from){
    hidePop();
    const p = feat.properties, ps = popProgs(p), n = ps.length;
    if (!n) return;
    const R = n === 1 ? 34 : n <= 3 ? 42 : n <= 5 ? 50 : 58;
    const el = document.createElement('div'); el.className = 'gv-pop';
    const pts = ps.map((x, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [Math.round(Math.cos(a) * R), Math.round(Math.sin(a) * R)]; });
    const span = R + 30;
    el.innerHTML = '<svg class="gv-pop-spokes" width="' + 2 * span + '" height="' + 2 * span + '" viewBox="' + (-span) + ' ' + (-span) + ' ' + 2 * span + ' ' + 2 * span + '" aria-hidden="true">' +
      pts.map(([x, y]) => '<line x1="0" y1="0" x2="' + x + '" y2="' + y + '"/>').join('') + '</svg>';
    ps.forEach((x, i) => {
      const P = PROGRAMS[x.t];
      const b = document.createElement('button'); b.type = 'button';
      b.className = 'gv-pop-b' + (x.t === activeT ? ' on' : '') + (x.hollow ? ' hollow' : '');
      b.style.left = pts[i][0] + 'px'; b.style.top = pts[i][1] + 'px';
      const said = x.hollow ? x.why : gradsText(x.g);
      b.setAttribute('aria-label', P.label + ' at ' + p.n + ', ' + said);
      b.setAttribute('aria-pressed', String(x.t === activeT));
      b.title = P.label + ' · ' + said;
      const img = document.createElement('img'); img.src = programIcon(x.t, x.hollow); img.alt = ''; b.appendChild(img);
      // the map must not take the tap as a click on the ground under it
      b.addEventListener('click', e => { e.stopPropagation(); openProgram(p, x.t, from); });
      ['mousedown', 'touchstart', 'pointerdown', 'dblclick'].forEach(t => b.addEventListener(t, e => e.stopPropagation()));
      el.appendChild(b);
    });
    popMarker = new maplibregl.Marker({ element: el, offset: stepOf(p) }).setLngLat(feat.geometry.coordinates).addTo(map);
    popStep = p;
    popFor = p.id;
    syncLabels();
  }
  /** the n nearest hospitals to a point, [miles, feature]: where a school's students are likely to train */
  const nearestHospitals = (pt, n) => ALL.map(f => [hav(pt, f.geometry.coordinates), f]).sort((a, b) => a[0] - b[0]).slice(0, n);
  /* CLUSTER RINGS (2026-10-03, David chose them over plain bubbles and over spreading alone: "go with B, rings").
     A cluster is a ring sliced by what is in it, in the icons' own colors, with the count in the middle, so "9" shows
     its mix. Clusters also break apart a zoom level sooner than the bubbles did (real icons from zoom 8; clusterMaxZoom
     7, was 10) over a smaller catch radius (30px, was 46), so a county shows its places, not one bubble. */
  /** a ring's slices: [key, the t values it counts, color], the hospital types, then every other layer */
  const RING_KEYS = Object.keys(HOSP_TYPES).map(k => [k, [k], HOSP_TYPES[k].color]).concat([
      ['school', ['school'], SCHOOL_COLOR], ['dial', ['dialysis', 'dial'], '#B07BD6'], ['asc', ['asc'], '#35C7E8'], ['pharm', ['pharmacy', 'pharm'], '#A3E635'],
      ['dme', ['dme'], '#C69A6D'], ['optical', ['optical'], '#E8E8F0'], ['ortho', ['orthotics-prosthetics', 'orthotics', 'ortho'], '#FF9E7D']]);
  const ringProps = () => Object.fromEntries(RING_KEYS.map(([k, ts]) => ['k_' + k, ['+', ['match', ['get', 't'], ts.length === 1 ? ts[0] : ts, 1, 0]]]));
  const ringMarkers = new Map();   // cluster_id -> MapLibre marker
  function ringSvg(p){
    const n = +p.point_count, r = n >= 100 ? 26 : n >= 25 ? 19 : 14, w = r >= 26 ? 6 : 5, rr = r - w / 2, C = 2 * Math.PI * rr;
    let off = 0, segs = '';
    RING_KEYS.forEach(([k, , color]) => {
      const v = +p['k_' + k] || 0; if (!v) return;
      const len = v / n * C;
      segs += '<circle r="' + rr + '" cx="' + r + '" cy="' + r + '" fill="none" stroke="' + color + '" stroke-width="' + w +
        '" stroke-dasharray="' + len.toFixed(2) + ' ' + (C - len).toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '" transform="rotate(-90 ' + r + ' ' + r + ')"/>';
      off += len;
    });
    return '<svg width="' + 2 * r + '" height="' + 2 * r + '" viewBox="0 0 ' + 2 * r + ' ' + 2 * r + '" aria-hidden="true">' +
      '<circle class="ring-hole" r="' + (r - w) + '" cx="' + r + '" cy="' + r + '"/>' + segs +
      '<text class="ring-n" x="' + r + '" y="' + r + '">' + p.point_count_abbreviated + '</text></svg>';
  }
  function clearRings(){ ringMarkers.forEach(m => m.remove()); ringMarkers.clear(); }
  /* the markers follow the source's clusters: made for the ones on screen, dropped for the ones gone. They take no
     pointer events; a tap falls through to the cluster circle underneath (drawn clear), so the click router is unchanged. */
  function updateRings(){
    if (!map.getSource('hosp')) return;
    const keep = new Map();
    if (map.getZoom() >= 4.6) for (const f of map.querySourceFeatures('hosp')){
      const p = f.properties; if (!p.cluster || keep.has(p.cluster_id)) continue;
      let m = ringMarkers.get(p.cluster_id);
      if (!m){
        const el = document.createElement('div'); el.className = 'gv-ring'; el.innerHTML = ringSvg(p);
        m = new maplibregl.Marker({ element: el }).setLngLat(/** @type {any} */ (f.geometry).coordinates).addTo(map);
      }
      keep.set(p.cluster_id, m);
    }
    ringMarkers.forEach((m, id) => { if (!keep.has(id)) m.remove(); });
    ringMarkers.clear(); keep.forEach((m, id) => ringMarkers.set(id, m));
  }
  // a dot's size, the thing lists sort by: beds for a hospital, graduates (in the chosen programs) for a school
  const sizeOf = f => f.properties.t === 'school' ? gradsIn(f.properties) : +f.properties.beds || 0;
  const gradsText = n => n.toLocaleString('en-US') + (n === 1 ? ' graduate' : ' graduates');
  // feature type code → owning layer key (t codes vary per source file)
  const layerOf = t => TYPES[t] ? 'hosp'
    : ({ dialysis:'dial', dial:'dial', asc:'asc', pharmacy:'pharm', pharm:'pharm',
         dme:'dme', optical:'optical', orthotics:'ortho', ortho:'ortho', 'orthotics-prosthetics':'ortho', school:'school' }[t] || null);
  // per-state counts over everything visible — feeds the tint AND the Geo-1 numbers
  function layerCounts(){
    const c = {};
    activeSet().forEach(f => { c[f.properties.s] = (c[f.properties.s] || 0) + 1; });
    return c;
  }
  async function loadPharm(abbr){
    if (PHARM_CACHE.has(abbr)) return;
    signal('Loading ' + abbr + ' pharmacies…');
    try {
      const fc = await fetch('/assets/data/geo/pharmacy/' + abbr + '.json').then(r => r.json());
      PHARM_CACHE.set(abbr, fc.features || []);
      signalDone('✓ ' + (fc.features || []).length.toLocaleString('en-US') + ' pharmacies in ' + abbr);
    } catch(e){ PHARM_CACHE.set(abbr, []); signalDone('No pharmacy data for ' + abbr, 2200); }
  }
  function refreshSource(){
    const src = map.getSource('hosp');
    if (src){ clearRings(); src.setData({ type:'FeatureCollection', features: scopedSet() }); }   // a drawn loop hides everything outside it, Zillow-style
    const xs = map.getSource('school-extra');
    if (xs) xs.setData({ type:'FeatureCollection', features: drawnPoly ? extraSet().filter(x => pip(x.geometry.coordinates, drawnPoly)) : extraSet() });
    updateStateNums();
  }
  // per-state count labels, dead center (Geo-1's read). Centers come from the
  // camera-safe bboxes; collision detection quietly drops the crowded Northeast.
  function stateCentersFC(){
    const counts = layerCounts();
    return { type:'FeatureCollection', features: (STATES ? STATES.features : []).map(f => ({
      type:'Feature',
      // kit interior point, not the bbox center — Florida's box center is in
      // the Gulf, Michigan's is in the lake; this sits on actual land
      geometry:{ type:'Point', coordinates: f._c || (f._c = HUKit.innerPoint(f.geometry) || [ (f.properties.bb[0] + f.properties.bb[2]) / 2, (f.properties.bb[1] + f.properties.bb[3]) / 2 ]) },
      properties:{ cnt: counts[f.properties.abbr] || 0, abbr: f.properties.abbr, name: f.properties.name.toUpperCase() }
    })) };
  }
  function updateStateNums(){
    const s = map.getSource('state-centers');
    if (s) s.setData(stateCentersFC());
    const c = layerCounts();   // inset badges ride the same tally
    const ak = $('gvInsetAKn'), hi = $('gvInsetHIn');
    if (ak) ak.textContent = (c.AK || 0).toLocaleString('en-US');
    if (hi) hi.textContent = (c.HI || 0).toLocaleString('en-US');
  }

  // ── enrichment (loads quietly after the map; cards fill in when it lands) ──
  // us-counties.json: {fips:{p:population}} · countyData.json: lens→idx→fips→value
  let CPOP = null, CDATA = null, lastFix = null;
  /* One fetch, on first need, shared by every caller. The readers below check CDATA
     synchronously and simply refresh once it lands, so nothing becomes async. */
  let countyDataPromise = null;
  function ensureCountyData(){
    if (!countyDataPromise) {
      countyDataPromise = Promise.all([
        fetch('/assets/data/countyData.json').then(r => r.json()).then(d => { CDATA = d; }),
        fetch('/assets/data/us-counties.json').then(r => r.json()).then(d => { CPOP = d; })
      ]).then(() => { refreshOpenCard(); applyCountyTint(); }).catch(() => {});
    }
    return countyDataPromise;
  }
  let ENRICH = null;   // per-CCN POS enrichment (services/teaching/capacity), lazy-loaded on idle
  /* MEDICARE COST REPORTS (2026-10-02): what each hospital files with Medicare every year (beds, ICU beds, stays,
     payer mix, staff, residents), and each system's totals. us-hospital-cost-reports.json is written by
     scripts/build-vital-stats-systems.js with the rules Vital Stats asks by, so a card and a question agree. It is the
     audited staffing source the POS note below waited for. Lazy, like ENRICH. */
  let HCR = null;
  const n0 = v => v.toLocaleString('en-US');
  const HCR_ROWS = {
    beds: ['Beds on its cost report', n0],
    icu:  ['Intensive care beds', n0],
    dc:   ['Inpatient discharges', n0],
    los:  ['Average stay', v => v.toLocaleString('en-US', { maximumFractionDigits:1 }) + ' days'],
    occ:  ['Beds in use, average day', v => v + '%'],
    mcr:  ['Medicare share of inpatient days', v => v + '%'],
    mcd:  ['Medicaid share of inpatient days', v => v + '%'],
    fte:  ['Employees (FTE)', n0],            // short labels: a long one squeezed the number onto two lines ("7 / 5")
    res:  ['Resident physicians (FTE)', n0]
  };
  /** a titled run of cost report facts: [[field, value], ...], blanks dropped; `names` renames a row for a system */
  function costReportBlock(host, heading, pairs, note, names){
    const rows = pairs.filter(([k, v]) => v != null && HCR_ROWS[k]).map(([k, v]) => [(names && names[k]) || HCR_ROWS[k][0], HCR_ROWS[k][1](v)]);
    if (!rows.length) return;
    const w = titledSection(host, heading);
    factsBlock(w, rows);
    const src = document.createElement('div'); src.className = 'gv-cardsrc'; src.textContent = note;
    w.appendChild(src);
  }
  /** a card section with a small mono title, spaced the way the Services block is */
  function titledSection(host, heading){
    const w = document.createElement('div'); w.className = 'gv-svcs';
    const h = document.createElement('div'); h.className = 'gv-svcs-h'; h.textContent = heading;
    w.appendChild(h); host.appendChild(w);
    return w;
  }
  const hcrNote = () => 'Cost report: CMS HCRIS, fiscal year ' + ((HCR && HCR._meta.source.match(/fiscal year (\d{4})/)) || [])[1] + ' file · as filed with Medicare';
  // (the Utah price-pilot UI was removed 2026-07-29: project parked, the
  //  finder lives in the secret menu; pipeline + data files remain for later)
  const statePopCache = new Map();
  function statePop(fips){
    if (!CPOP) return null;
    if (statePopCache.has(fips)) return statePopCache.get(fips);
    let t = 0; for (const k in CPOP){ if (k.slice(0,2) === fips) t += CPOP[k].p || 0; }
    statePopCache.set(fips, t || null); return t || null;
  }
  const cdVal = (lens, idx, fips) => (CDATA && CDATA[lens] && CDATA[lens][idx] && CDATA[lens][idx][fips] != null) ? CDATA[lens][idx][fips] : null;
  const fmtPop = v => v >= 1e6 ? (v/1e6).toFixed(1) + 'M' : v.toLocaleString('en-US');
  const pct = v => v == null ? null : v + '%';
  function milesTo(coords){
    if (!lastFix) return null;
    const rad = d => d * Math.PI / 180;
    const dLa = rad(coords[1] - lastFix[1]), dLo = rad(coords[0] - lastFix[0]);
    const h = Math.sin(dLa/2)**2 + Math.cos(rad(lastFix[1])) * Math.cos(rad(coords[1])) * Math.sin(dLo/2)**2;
    return 2 * 3958.8 * Math.asin(Math.sqrt(h));
  }
  function factsBlock(host, rows){
    const kept = rows.filter(r => r[1] != null && r[1] !== '');
    if (!kept.length) return;
    const el = document.createElement('div'); el.className = 'gv-facts';
    kept.forEach(r => {
      const d = document.createElement('div');
      if (r[2]) d.className = 'w';   // long-value rows span the full width
      const s = document.createElement('span'); s.textContent = r[0];
      const b = document.createElement('b'); b.textContent = r[1];
      d.appendChild(s); d.appendChild(b); el.appendChild(d);
    });
    host.appendChild(el);
  }
  function refreshOpenCard(){
    if (!sheetEl.classList.contains('open') || mode !== 'card') return;
    if (selCounty) openCountyCard();
    else if (selState && !selectedId) openStateCard();
    applyCountyTint();
  }

  // STATE SHADING REMOVED (David's call, 2026-07-19): at the national view the
  // numbers carry the story; a quantile tint the user never chose reads as
  // unexplained color. Rule of thumb now in the grammar: color only when the
  // user picked the metric (the county "Shade counties by" control stays).
  function applyStateTint(){
    if (!map.getLayer('gv-state-fill')) return;
    map.setPaintProperty('gv-state-fill','fill-color','#4ECDC4');
    map.setPaintProperty('gv-state-fill','fill-opacity',0.03);
    if (!countyMetric || !selState){ const leg = $('gvCleg'); if (leg) leg.hidden = true; }
  }

  // ── county choropleth: shade the selected state's counties by a joined metric ──
  // (the Population Health Map county grain, previewed on this stack)
  const CMETRICS = {
    uninsured: { label:'Uninsured',        get:f => cdVal('payer','0',f),     dir:-1 },
    diabetes:  { label:'Diabetes',         get:f => cdVal('patient','1',f),   dir:-1 },
    health:    { label:'Fair/poor health', get:f => cdVal('patient','0',f),   dir:-1 },
    smoking:   { label:'Smoking',          get:f => cdVal('patient','8',f),   dir:-1 },
    copd:      { label:'COPD',             get:f => cdVal('patient','9',f),   dir:-1 },
    income:    { label:'Median income',    get:f => cdVal('economics','0',f), dir:1 }
  };
  const CSCALE = ['#FF6B6B','#F2A65A','#E8C547','#7FD2C8','#4ECDC4'];   // worse → better
  let countyMetric = null;   // persists across states; retints as counties load
  function applyCountyTint(){
    if (!map.getLayer('gv-county-fill')) return;
    const fc = selState && COUNTY_CACHE.get(selState.fips);
    const M = countyMetric && CMETRICS[countyMetric];
    const leg = $('gvCleg');
    if (!M || !fc || !CDATA){
      map.setPaintProperty('gv-county-fill','fill-color','#4ECDC4');
      map.setPaintProperty('gv-county-fill','fill-opacity',0.04);
      if (leg) leg.hidden = true;
      return;
    }
    const vals = [];
    fc.features.forEach(f => { const v = M.get(f.properties.fips); if (v != null) vals.push(v); });
    if (vals.length < 3){
      map.setPaintProperty('gv-county-fill','fill-color','#4ECDC4');
      map.setPaintProperty('gv-county-fill','fill-opacity',0.04);
      if (leg) leg.hidden = true;
      return;
    }
    vals.sort((a,b) => a - b);
    const q = p => vals[Math.min(vals.length - 1, Math.floor(p * vals.length))];
    const breaks = [q(0.2), q(0.4), q(0.6), q(0.8)];
    const colorFor = v => { let i = 0; while (i < 4 && v >= breaks[i]) i++; return M.dir === -1 ? CSCALE[4 - i] : CSCALE[i]; };
    const expr = ['match', ['get','fips']];
    fc.features.forEach(f => { const v = M.get(f.properties.fips); expr.push(f.properties.fips, v == null ? 'rgba(130,150,170,0.3)' : colorFor(v)); });
    expr.push('#4ECDC4');
    map.setPaintProperty('gv-county-fill','fill-color',expr);
    map.setPaintProperty('gv-county-fill','fill-opacity',0.42);
    if (leg){
      leg.innerHTML = '<span class="cl-name"></span>' + CSCALE.map(c => '<i style="background:' + c + '"></i>').join('') + '<span class="cl-dir">worse → better</span>';
      leg.querySelector('.cl-name').textContent = M.label;
      leg.hidden = false;
    }
  }

  // point-in-polygon (even-odd raycast), Polygon + MultiPolygon
  function pip(pt, geom){
    const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
    const [x, y] = pt;
    let inside = false;
    for (const rings of polys){
      for (const ring of rings){
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++){
          const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
          if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
        }
      }
    }
    return inside;
  }
  function bboxOf(geom){
    let w = 180, s = 90, e = -180, n = -90;
    const walk = c => { if (typeof c[0] === 'number'){ if (c[0]<w)w=c[0]; if (c[0]>e)e=c[0]; if (c[1]<s)s=c[1]; if (c[1]>n)n=c[1]; } else c.forEach(walk); };
    walk(geom.coordinates);
    if (w < -179.9) w = -179.9;   // Aleutians run past the antimeridian — unclamped, fits center on open ocean
    return [[w,s],[e,n]];
  }
  // Two pad regimes on phone: card open = the peek sheet + raised list pill
  // own the south edge, so fits clear them; sheet dismissed = the scope
  // expands to own the screen. Desktop keeps the QA'd numbers.
  // Padding clears the floating chrome, but it must never exceed the canvas it is
  // padding. HUKit.phone() is the 699 CSS line and measures WIDTH only, so a landscape
  // phone (844x390) has a ~326px shell that the phone pad alone would overflow:
  // MapLibre then logs "Map cannot fit within canvas" and declines to move at all.
  // Scale the pad down so at least 60px of real fit box always survives.
  /* set by fitPad on every call: below 1 means the pad had to be scaled to fit
     the shell, which is the landscape-phone letterbox case and nothing else. */
  let padScale = 1;
  const fitPad = () => {
    const short = HUKit.phone() || window.innerHeight < 500;
    const top = short ? 130 : 130;
    const bottom = short ? 212 : 150;
    const side = short ? 20 : 28;
    const shell = document.querySelector('.gv-shell');
    const h = shell ? shell.clientHeight : window.innerHeight;
    const k = Math.min(1, Math.max(0, (h - 60) / (top + bottom)));
    padScale = k;
    return { top: Math.round(top * k), bottom: Math.round(bottom * k), left: side, right: side };
  };

  const fitPadFree = () => ({ top:130, bottom:96, left:20, right:20 });
  // states ship a precomputed camera-safe bb; geometry walk is the fallback
  const stateBounds = f => f.properties.bb
    ? [[f.properties.bb[0], f.properties.bb[1]], [f.properties.bb[2], f.properties.bb[3]]]
    : bboxOf(f.geometry);
  const avgStar = list => { const r = list.filter(f => +f.properties.r > 0); return r.length ? (r.reduce((a,f) => a + +f.properties.r, 0) / r.length).toFixed(2) : null; };

  // ── sheet ──
  const sheetEl = $('gvSheet');
  // the camera follows the sheet DOWN, never up: drag to peek and the fitted
  // scope re-frames above the smaller card; drag the sheet away and the scope
  // expands. The moment the user pans or pinches (or locates), the camera is
  // THEIRS — detent changes stop refitting until the next scope fit.
  // (lastCam, not lastFit — lastFix is the locate fix, keep them apart)
  let lastDet = null, userCam = false, lastCam = null;
  const sheet = HUKit.sheet(sheetEl, { startDetent:'dt-peek',
    onDismiss: () => { closeSheet(); refitFree(); },
    onDetent: d => {
      if (d === lastDet) return;
      lastDet = d;
      if (d === 'dt-peek' && HUKit.phone() && lastCam && !userCam && mode === 'card' && !selectedId) refitScope();
    }
  });
  // programmatic detent moves pre-assign lastDet so onDetent stays quiet;
  // only the user's own grabber drags reach the refit path
  const setDetQuiet = d => { lastDet = d; sheet.setDetent(d); };
  const curDetent = () => sheetEl.classList.contains('dt-full') ? 'dt-full' : sheetEl.classList.contains('dt-half') ? 'dt-half' : 'dt-peek';
  // card re-renders (layer toggles, data landing) KEEP the detent the user
  // chose; fresh opens use the card's default
  const cardDetent = def => sheetEl.classList.contains('open') ? curDetent() : def;
  // explicit reveals (list, Display, system) claim at least half, but never
  // yank a full-height sheet down
  const revealDetent = () => sheetEl.classList.contains('open') && sheetEl.classList.contains('dt-full') ? 'dt-full' : 'dt-half';
  /* The letterbox guard. fitPad only scales itself down when the shell is too short
     for the chrome, and in practice that means exactly one thing: a phone held
     sideways. 844x390 leaves a 326px shell and a 60px fit box, while a state like
     Colorado already draws about 89px tall at the boot zoom, so fitBounds answers with
     a zoom BELOW where the camera already sits. Tapping a state pulled the view
     BACKWARDS. Two earlier attempts treated this as a padding bug; it is not, no pad
     arithmetic reaches a useful zoom while the peek sheet owns 37% of the viewport.

     So ask the camera what it would do before letting it move, and when the answer is
     a retreat, hold the zoom and slide to the middle instead. Gated on the clamp
     rather than on "the zoom went down", because zooming out is usually correct:
     county to state to the whole country are all legitimate, and none of them clamp.

     This is the small fix, chosen 2026-08-22. It stops the wrong behaviour; it does
     not make sideways roomy. The real fix is landscape-specific chrome (a ~64px peek
     detent, bar off centre), written up in docs/HU-BUILD-HARDENING-2026-08-22.md. */
  function fitOrCentre(b, z, dur){
    const padding = fitPad();
    if (padScale < 1) {
      const cam = map.cameraForBounds(b, { padding, maxZoom: z });
      if (!cam || cam.zoom < map.getZoom()) {
        const centre = cam ? cam.center
          : (b && b.getCenter ? b.getCenter() : [(b[0][0] + b[1][0]) / 2, (b[0][1] + b[1][1]) / 2]);
        map.easeTo({ center: centre, duration: dcap(dur) });
        return;
      }
    }
    map.fitBounds(b, { padding, maxZoom: z, duration: dcap(dur) });
  }
  function fitScope(b, z, dur){ lastCam = { b, z }; userCam = false; fitOrCentre(b, z, dur); }
  function refitScope(){ if (lastCam) fitOrCentre(lastCam.b, lastCam.z, 600); }
  function refitFree(){ if (HUKit.phone() && lastCam && !userCam) map.fitBounds(lastCam.b, { padding:fitPadFree(), maxZoom:lastCam.z, duration:dcap(600) }); }
  map.on('movestart', e => { if (e && e.originalEvent) userCam = true; });
  // the list is a VIEW of the current scope — closing it returns to the scope's card
  function restoreScopeCard(){
    if (selCounty){ openCountyCard(); return true; }
    if (activeSystem){ openSystemCard(); return true; }
    if (selState){ openStateCard(); return true; }
    return false;
  }
  $('gvSheetX').addEventListener('click', () => {
    if (tab === 'display'){ if (!restoreScopeCard()) closeSheet(); return; }                  // display X → back to the scope's card, or away
    if (mode === 'list'){ if (!restoreScopeCard()) closeSheet(); return; }                     // list X → back to the county/state/system card
    if (backTo === 'school' && backSchool){ openSchoolSite(backSchool.p, backSchool.from); return; }
    if (backTo === 'list'){ openList(); return; }
    if (backTo === 'system' && activeSystem){ openSystemCard(); return; }
    if (backTo === 'county' && selCounty){ openCountyCard(); return; }
    if (backTo === 'state' && selState){ clearCounty(); openStateCard(); return; }
    if (mode === 'card' && activeSystem && !selectedId){ exitSystem(); return; }               // system card X → exit the system
    if (mode === 'card' && selState && !selCounty && !selectedId){ deselectState(); return; }  // state card X → back to US
    closeSheet();
  });
  function closeSheet(){
    sheetEl.classList.remove('open');
    clearPin();
    mode = 'card'; backTo = null;
    syncURL();
  }
  // phone hardware back = the X button, one step at a time, for the views
  // that replaceState keeps OUT of history (pin cards, list, Display).
  // Plain scope cards fall through to the real state/county/
  // system entries. The popstate handler below early-returns on consumed().
  const backGd = HUKit.backGuard ? HUKit.backGuard({
    watch: sheetEl,
    active: () => sheetEl.classList.contains('open') && (tab === 'display' || mode === 'list' || !!selectedId),
    step: () => $('gvSheetX').click()
  }) : null;
  function clearPin(){
    selectedId = null; progFocus = null;
    hidePop();
    selectMark(null);
  }

  // ── shared card scaffold ──
  function cardScaffold(kicker, name, sub){
    showTab('details');   // any card render lands the drawer on Details
    let h = '<div class="gv-card-kicker"></div><div class="gv-card-name"></div><div class="gv-card-sub"></div><div class="hu-stats"></div><div class="gv-extra"></div>';
    $('gvSheetBody').innerHTML = h;
    const b = $('gvSheetBody');
    b.querySelector('.gv-card-kicker').textContent = kicker;
    b.querySelector('.gv-card-name').textContent = name;
    b.querySelector('.gv-card-sub').textContent = sub;
    return b;
  }
  // every view is already in the URL (syncURL) — this just hands it over
  function linkChip(){
    const b = document.createElement('button');
    b.className = 'hu-chip gv-copylink'; b.type = 'button'; b.textContent = '🔗 Copy link to this view';
    b.addEventListener('click', () => {
      const done = ok => {
        b.textContent = ok ? '✓ Link copied' : 'Copy blocked. The address bar has it';
        announce(ok ? 'Link copied to the clipboard.' : 'Copy was blocked. The address bar holds the same link.');
        setTimeout(() => { b.textContent = '🔗 Copy link to this view'; }, 2000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(location.href).then(() => done(true), () => done(false));
      else done(false);
    });
    return b;
  }
  function statTiles(el, stats){
    el.querySelector('.hu-stats').innerHTML = stats.map(s =>
      '<div class="hu-stat"><div class="v' + (s.cls||'') + '">' + s.v + '</div><div class="k">' + s.k + '</div></div>').join('');
  }
  function hospRows(host, list, limit, back){
    const cap = list.slice(0, limit);
    const wrap = document.createElement('div');
    wrap.className = 'gv-rows short';
    wrap.innerHTML = cap.map((f,i) => {
      const p = f.properties, T = TYPES[p.t] || {};
      return '<button class="gv-row" type="button" data-i="' + i + '"><div class="rn"></div>' +
        '<div class="rs"><i style="background:' + (T.color || iconColorOf(p.t)) + '"></i>' + '<span>' + p.c + ', ' + p.s + '</span>' +
        (+p.r ? '<span class="st">' + '★'.repeat(+p.r) + '</span>' : '') +
        (+p.beds ? '<span>' + Number(p.beds).toLocaleString('en-US') + ' beds</span>' : '') +
        (p.t === 'school' ? '<span>' + p.pl + ' · ' + gradsText(gradsIn(p)) + '</span>' : '') + (+p.sg ? '<span>' + supplySummary(p) + '</span>' : '') + '</div></button>';
    }).join('');
    host.appendChild(wrap);
    wrap.querySelectorAll('.gv-row').forEach((el,i) => {
      el.querySelector('.rn').textContent = cap[i].properties.n;
      el.addEventListener('click', () => {
        openPinCard(cap[i].properties, back);
        map.flyTo({ center:cap[i].geometry.coordinates, zoom:Math.max(map.getZoom(), 10.5), duration:dcap(900) });
      });
    });
  }

  // ── pin-card enrichment: the POS story + client-computed standing ──
  const svcChips = e => {
    if (!e || !e.sv || !ENRICH) return [];
    const ord = ENRICH._meta.svcOrder, lab = ENRICH._meta.svcLabels;
    return ord.filter((k, i) => e.sv & (1 << i)).map(k => lab[k] || k);
  };
  function hav(a, b){
    const R = 3958.8, dLa = (b[1] - a[1]) * Math.PI / 180, dLo = (b[0] - a[0]) * Math.PI / 180;
    const s = Math.sin(dLa / 2) ** 2 + Math.cos(a[1] * Math.PI / 180) * Math.cos(b[1] * Math.PI / 180) * Math.sin(dLo / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  }
  function pinEnrichBlocks(ex, p, feat){
    const e = ENRICH && ENRICH.byId ? ENRICH.byId[p.id] : null;
    const cr = HCR && HCR.h ? HCR.h[p.id] : null;
    const crRes = cr ? cr[1 + HCR.fields.indexOf('res')] : null;   // the cost report's residents replace the POS count
    const rows = [];   // row = [label, value, wide] — wide rows span the grid
    // county context: name ships on every record; numbers join by the POS fips
    if (p.co){
      const pop = e && e.f && CPOP && CPOP[e.f] ? CPOP[e.f].p : null;
      rows.push(['County', tcase(p.co) + (pop ? ' · ' + fmtPop(pop) + ' people' : ''), 1]);
      if (e && e.f && CDATA){
        const inc = cdVal('economics', '0', e.f), un = cdVal('payer', '0', e.f);
        if (inc != null) rows.push(['County median income', '$' + inc + 'k']);
        if (un != null) rows.push(['County uninsured', un + '%']);
      }
    }
    // in-state standing by beds, within the facility's own layer
    if (+p.beds){
      const peers = ALL.filter(f => f.properties.s === p.s && layerOf(f.properties.t) === layerOf(p.t) && +f.properties.beds > 0);
      if (peers.length > 1){
        const rank = peers.filter(f => +f.properties.beds > +p.beds).length + 1;
        rows.push(['Size in ' + p.s, '#' + rank + ' of ' + peers.length + ' by beds']);
      }
    }
    if (e){
      rows.push(['Setting', e.ur ? 'Rural' : 'Urban']);
      if (e.ms) rows.push(['Teaching', ['', 'Major', 'Limited', 'Graduate'][e.ms] + ' med-school affiliation' + (e.res && crRes == null ? ' · ' + e.res + ' residents' : ''), 1]);
      else if (e.res && crRes == null) rows.push(['Residents', String(e.res)]);
      if (e.or) rows.push(['Operating rooms', String(e.or)]);
      if (e.cathrm) rows.push(['Cath lab rooms', String(e.cathrm)]);
      if (e.psyb) rows.push(['Psych unit beds', String(e.psyb)]);
      if (e.rehb) rows.push(['Rehab unit beds', String(e.rehb)]);
      // RN/RT staffing counts stay in the FILE but off the CARD: the POS
      // staffing block is self-reported and provably stale for ~7% of
      // hospitals (McKay-Dee says 58 RNs for 321 beds; Rush says 24 RTs
      // for 715 beds) with no per-record freshness signal. HCRIS cost
      // reports are the audited staffing source: that pull landed 2026-10-02 (HCR, the cost report block below).
    }
    // nearest peer in the same layer (ZIP-centroid grain, honest at miles scale)
    if (feat){
      let bn = null, bd = Infinity;
      ALL.forEach(f => {
        if (f.properties.id === p.id || layerOf(f.properties.t) !== layerOf(p.t)) return;
        const d = hav(feat.geometry.coordinates, f.geometry.coordinates);
        if (d < bd){ bd = d; bn = f; }
      });
      if (bn && bd < 500) rows.push(['Nearest peer', bn.properties.n + ' · ' + bd.toFixed(1) + ' mi', 1]);
    }
    if (e){
      if (e.off) rows.push(['Off-site locations', e.off + ((e.offed || e.offuc)
        ? ' (' + [e.offed ? e.offed + ' ED' : '', e.offuc ? e.offuc + ' urgent care' : ''].filter(Boolean).join(', ') + ')' : ''), 1]);
      if (e.aff){
        const A = { asc: 'surgery centers', esrd: 'dialysis', hha: 'home health', snf: 'SNFs', fqhc: 'FQHCs', rhc: 'rural clinics', hospc: 'hospice' };
        rows.push(['Affiliated network', Object.entries(e.aff).map(([k, v]) => v + ' ' + (A[k] || k)).join(' · '), 1]);
      }
      if (e.near) rows.push(['Same ZIP', [
        e.near.asc ? e.near.asc + ' surgery' : '',
        e.near.dial ? e.near.dial + ' dialysis' : '',
        e.near.ph ? e.near.ph + ' pharmacy' : ''
      ].filter(Boolean).join(' · '), 1]);
    }
    if (rows.length) factsBlock(ex, rows);
    if (cr) costReportBlock(ex, 'Medicare cost report · ' + cr[0], HCR.fields.map((k, i) => [k, cr[i + 1]]), hcrNote());
    const svcs = svcChips(e);
    if (svcs.length){
      const w = document.createElement('div');
      w.className = 'gv-svcs';
      const h = document.createElement('div'); h.className = 'gv-svcs-h';
      h.textContent = 'Services · ' + svcs.length;
      const row = document.createElement('div'); row.className = 'gv-svcs-row';
      svcs.forEach(s => { const i = document.createElement('i'); i.textContent = s; row.appendChild(i); });
      w.appendChild(h); w.appendChild(row);
      ex.appendChild(w);
    }
    if (e){
      const src = document.createElement('div');
      src.className = 'gv-cardsrc';
      src.textContent = 'Profile: CMS Provider of Services, Apr 2026 release · services and capacity as reported to CMS';
      ex.appendChild(src);
    }
  }
  /* ── an equipment supplier's card (2026-10-03, step 4): its CMS specialty, whether it accepts Medicare assignment, and
     what CMS lists it as carrying: the supply types as chips, every CMS category behind a disclosure. ── */
  /** CMS's specialty names in plain case: "MSC With Respiratory Therapist" is a medical supply company with one on staff */
  const specWords = s => {
    const m = String(s).match(/^(?:MSC|Medical Supply Company) With (.+)$/i);
    if (m) return 'Medical supply company with ' + m[1].toLowerCase();
    if (/^Medical Supply Company Other$/i.test(s)) return 'Medical supply company';
    return /[a-z]/.test(s) ? s : tcase(s);
  };
  function supplierBlocks(ex, p){
    let specs = String(p.pt || '').split('|').filter(Boolean).map(specWords);
    if (specs.some(s => /^Medical supply company with /.test(s))) specs = specs.filter(s => s !== 'Medical supply company');   // the specific one says it
    factsBlock(ex, [
      specs.length ? ['Specialty', specs.join(' · '), 1] : null,
      ['Accepts Medicare assignment', +p.a ? 'Yes' : 'No']
    ].filter(Boolean));
    const items = SUPPLY_META && p.sl ? (String(p.sl).match(/.{2}/g) || []).map(x => SUPPLY_META.supplies[parseInt(x, 36)]).filter(Boolean) : [];
    const groups = supplyGroupsOf(p);
    if (SUPPLY_META && (groups.length || items.length)){
      const w = titledSection(ex, 'Carries · ' + groups.length + ' of ' + SUPPLY_META.groups.length + ' supply types');
      const row = document.createElement('div'); row.className = 'gv-svcs-row';
      groups.forEach(g => { const i = document.createElement('i'); i.textContent = g.label; row.appendChild(i); });
      w.appendChild(row);
      if (items.length){
        const d = document.createElement('details'); d.className = 'gv-supall';
        const s = document.createElement('summary'); s.textContent = 'Every CMS category it carries · ' + items.length;
        const ul = document.createElement('ul');
        items.forEach(t => { const li = document.createElement('li'); li.textContent = t; ul.appendChild(li); });
        d.appendChild(s); d.appendChild(ul); w.appendChild(d);
      }
    }
    const src = document.createElement('div'); src.className = 'gv-cardsrc';
    // the file says which release it is (build-suppliers.js writes CMS's release date and the day it was fetched)
    const rel = SUPPLY_META && SUPPLY_META.released ? 'released ' + longDate(SUPPLY_META.released) + ', checked ' + longDate(SUPPLY_META.pulled) : 'CMS release';
    src.textContent = 'Supplier: CMS Medical Equipment Suppliers (' + rel + '), the supplies CMS lists at this location. Accepting assignment means agreeing to charge you only the Medicare deductible and coinsurance (Medicare.gov, checked Oct. 3, 2026).';
    ex.appendChild(src);
  }
  // ── pin card ──
  function openPinCard(p, from){
    if (p.t === 'school'){ openSchoolSite(p, from); return; }
    if (p.t === 'schoolx'){ openExtra(p, from); return; }
    hidePop(); progFocus = null;
    mode = 'card'; backTo = from || null;
    selectedId = p.id;
    const T = TYPES[p.t] || {};
    // a supplier lives in its layer's file, not with the hospitals; finding it there gives its card a map link too
    const feat = ALL.find(x => x.properties.id === p.id) || (SUPPLY_LAYERS.has(layerOf(p.t)) && WHOLE_CACHE[layerOf(p.t)] ? WHOLE_CACHE[layerOf(p.t)].find(x => x.properties.id === p.id) : null);
    const mi = feat ? milesTo(feat.geometry.coordinates) : null;
    const b = cardScaffold(T.label || ({ pharmacy:'Pharmacy', dialysis:'Dialysis center', asc:'Surgery center', dme:'Home equipment supplier',
      optical:'Optical supplier', 'orthotics-prosthetics':'Orthotics and prosthetics supplier' }[p.t] || 'Facility'), p.n,
      p.c + ', ' + p.s + (p.trauma ? ' · Trauma ' + String(p.trauma).replace('Level ','Lv ') : '') + (mi != null ? ' · ' + mi.toFixed(1) + ' mi from you' : ''));
    const stats = [];
    if (+p.r) stats.push({ v:'★'.repeat(+p.r), k:'CMS rating', cls:' hi' });
    if (+p.beds) stats.push({ v:Number(p.beds).toLocaleString('en-US'), k:'Beds' });
    if (+p.st) stats.push({ v:Number(p.st).toLocaleString('en-US'), k:'Stations' });
    statTiles(b, stats);
    const ex = b.querySelector('.gv-extra');
    // the operators-map profile facts, card-sized
    factsBlock(ex, [
      p.od ? ['Ownership', p.od] : null,
      TYPES[p.t] ? ['Emergency services', +p.e ? 'Yes' : 'No'] : null,
      ['CMS ID', p.id]
    ].filter(Boolean));
    if (SUPPLY_LAYERS.has(layerOf(p.t))) supplierBlocks(ex, feat ? feat.properties : p);
    pinEnrichBlocks(ex, p, feat);
    if (p.sys){
      const sysEl = document.createElement('div');
      sysEl.className = 'gv-card-sys';
      sysEl.innerHTML = 'System: <button class="gv-syslink" type="button"><b></b></button>';
      sysEl.querySelector('b').textContent = p.sys;
      sysEl.querySelector('.gv-syslink').addEventListener('click', () => enterSystem(p.sys));
      const sysN = ALL.filter(f => f.properties.sys === p.sys).length;
      if (sysN > 1) sysEl.appendChild(document.createTextNode(' · ' + sysN + ' facilities'));
      ex.appendChild(sysEl);
    }
    if (feat){
      const gm = document.createElement('a');
      gm.className = 'gv-tolist'; gm.target = '_blank'; gm.rel = 'noopener';
      gm.href = 'https://www.google.com/maps/search/?api=1&query=' + feat.geometry.coordinates[1] + ',' + feat.geometry.coordinates[0];
      gm.textContent = 'View on Google Maps ↗';
      ex.appendChild(gm);
    }
    ex.appendChild(linkChip());   // ?fac= rides the URL — facility views share clean
    backButton(b);
    if (map.getLayer('gv-selected')) map.setFilter('gv-selected', ['==', ['get','id'], p.id]);
    sheetEl.classList.add('open');
    setDetQuiet('dt-peek');   // pin cards ALWAYS land at peek — the map is the payoff
    announce(p.n + '. ' + p.c + ', ' + p.s + '.');
    syncURL();   // ?fac= rides the entry — facility views are shareable now
  }

  /* ── SCHOOL AND PROGRAM CARDS (2026-10-03, schools folded into this map). A school's card lists its programs (the same
     ones popped out around it on the map) and the hospitals nearest it; a program's card says how many it graduated in
     the year and at which levels, where that places it in its state, and the nearest other school with it. What each
     program counts is written once, in scripts/pull/ipeds.js; the notes below say what a reader needs to read it right. ── */
  const PROGRAM_NOTES = {
    rn: "Bachelor's counts include nurses finishing an RN to BSN. IPEDS does not separate them.",
    np: 'Counted by the nurse practitioner specialty codes. A school that files its NP doctorate as a DNP shows under DNP.',
    dnp: 'The doctor of nursing practice holds most nurse practitioner doctorates and the DNP for nurse leaders alike. The federal codes do not separate them.',
    do: 'A college with more than one campus may report them together, under its main campus.',
    rt: "Counted under the respiratory care code, and the old technician code at associate and bachelor's, where many therapist programs still file."
  };
  const levelsOf = lv => String(lv || '').split('|').filter(Boolean).map(x => x.split(':').map(Number));
  const levelNames = lv => levelsOf(lv).map(([l]) => SCHOOL_META && SCHOOL_META.levels ? SCHOOL_META.levels[l] : '').filter(Boolean).join(', ');
  const schoolYear = () => (SCHOOL_META && SCHOOL_META.year) || '';
  /* an online school's graduates live everywhere but count where its office is (Western Governors puts 5,750 in Salt
     Lake City), so a card says so, and a state's card says how much of its total that is */
  const mostlyOnline = p => SCHOOL_META && +p.ol >= SCHOOL_META.onlineAt;
  const MONTHS = ['Jan.', 'Feb.', 'March', 'April', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];
  const longDate = iso => { const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? MONTHS[+m[2] - 1] + ' ' + +m[3] + ', ' + m[1] : String(iso || ''); };
  const schoolSource = () => { const M = SCHOOL_META || {}; return 'Source: IPEDS Completions, awards ' + (M.awards || '') + ', first majors only (NCES, ' +
    String((M.release && M.release.completions) || '').toLowerCase() + ', checked ' + longDate(M.pulled) + ').'; };
  let stNames = null;   // abbr -> name, built once the state file lands (search reads it for every record on every key)
  const stateNameOf = a => {
    if (!stNames && STATES) stNames = Object.fromEntries(STATES.features.map(x => [x.properties.abbr, x.properties.name]));
    return (stNames && stNames[a]) || a;
  };
  let backSchool = null;   // the school a program's or a hospital's card walks back to: { p, from }
  let progFocus = null;    // the program whose card is open (rides the link as ?prog=)
  function aLink(host, text, href){
    const a = document.createElement('a'); a.className = 'gv-tolist'; a.target = '_blank'; a.rel = 'noopener'; a.href = href; a.textContent = text;
    host.appendChild(a);
  }
  function backButton(b){
    if (!backTo) return;
    const back = document.createElement('button');
    back.className = 'gv-tolist'; back.type = 'button';
    back.textContent = backTo === 'school' && backSchool ? '← Back to ' + backSchool.p.n : backTo === 'list' ? '← Back to list' : backTo === 'county' ? '← Back to county' : backTo === 'system' ? '← Back to system' : '← Back';
    back.addEventListener('click', () => $('gvSheetX').click());
    b.appendChild(back);
  }
  function openSchoolSite(p0, from){
    if (p0.k){ openExtra(p0, from); return; }
    const feat = schoolOf(p0.u);
    const p = feat ? feat.properties : p0;
    mode = 'card'; backTo = from || null; progFocus = null;
    selectedId = p.id;
    const M = SCHOOL_META || {};
    const mi = feat ? milesTo(feat.geometry.coordinates) : null;
    const ctl = M.control ? M.control[p.ctl] : '';
    const ps = programsOf(p);
    const b = cardScaffold('Healthcare school', p.n, p.c + ', ' + p.s + (ctl ? ' · ' + ctl : '') + (mi != null ? ' · ' + mi.toFixed(1) + ' mi from you' : ''));
    statTiles(b, [{ v:String(ps.length), k:ps.length === 1 ? 'Program' : 'Programs' }, { v:(+p.g).toLocaleString('en-US'), k:'Graduates, ' + schoolYear() }]);
    const ex = b.querySelector('.gv-extra');
    // its programs, each a door to its own card: the same ones that popped out around it on the map
    const w = titledSection(ex, 'Programs');
    const list = document.createElement('div'); list.className = 'gv-rows gv-progs';
    ps.forEach(x => {
      const P = PROGRAMS[x.t];
      const r = document.createElement('button'); r.type = 'button'; r.className = 'gv-row';
      r.innerHTML = '<div class="rn"></div><div class="rs"><i></i><span></span></div>';
      r.querySelector('.rn').textContent = P.label;
      /** @type {HTMLElement} */ (r.querySelector('.rs i')).style.background = P.color;
      r.querySelector('.rs span').textContent = gradsText(x.g) + (levelNames(x.lv) ? ' · ' + levelNames(x.lv) : '');
      r.addEventListener('click', () => openProgram(p, x.t, from));
      list.appendChild(r);
    });
    // its new programs, hollow: accredited, no graduates in the federal year yet
    freshOf(p).forEach(x => {
      const P = PROGRAMS[x.t]; if (!P) return;
      const r = document.createElement('button'); r.type = 'button'; r.className = 'gv-row';
      r.innerHTML = '<div class="rn"></div><div class="rs"><i></i><span></span></div>';
      r.querySelector('.rn').textContent = P.label;
      const dot = /** @type {HTMLElement} */ (r.querySelector('.rs i')); dot.style.background = 'transparent'; dot.style.boxShadow = 'inset 0 0 0 2px ' + P.color;
      r.querySelector('.rs span').textContent = 'New, no graduates yet · ' + statusText(x);
      r.addEventListener('click', () => openProgram(p, x.t, from));
      list.appendChild(r);
    });
    w.appendChild(list);
    factsBlock(ex, [+p.ol >= 0 ? ['Students only online, ' + M.onlineTerm, p.ol + '%'] : null, p.co ? ['County', p.co] : null, ['IPEDS ID', p.u]].filter(Boolean));
    // the hospitals nearest it: where its students are likely to train. A row opens the hospital's own card.
    if (feat && ALL.length){
      const h = titledSection(ex, 'Nearest hospitals');
      const rows = document.createElement('div'); rows.className = 'gv-rows gv-progs';
      nearestHospitals(feat.geometry.coordinates, 3).forEach(([d, f]) => {
        const q = f.properties;
        const r = document.createElement('button'); r.type = 'button'; r.className = 'gv-row';
        const rn = document.createElement('div'); rn.className = 'rn'; rn.textContent = q.n;
        const rs = document.createElement('div'); rs.className = 'rs';
        [d.toFixed(1) + ' mi', +q.beds ? Number(q.beds).toLocaleString('en-US') + ' beds' : '', q.sys].filter(Boolean).forEach(t => { const s = document.createElement('span'); s.textContent = t; rs.appendChild(s); });
        r.appendChild(rn); r.appendChild(rs);
        r.addEventListener('click', () => {
          backSchool = { p, from };
          openPinCard(q, 'school');
          map.easeTo({ center:f.geometry.coordinates, zoom:Math.max(map.getZoom(), 10), duration:dcap(800) });
        });
        rows.appendChild(r);
      });
      h.appendChild(rows);
    }
    if (p.web) aLink(ex, 'School website ↗', p.web);
    if (feat) aLink(ex, 'View on Google Maps ↗', 'https://www.google.com/maps/search/?api=1&query=' + feat.geometry.coordinates[1] + ',' + feat.geometry.coordinates[0]);
    ex.appendChild(linkChip());
    const src = document.createElement('div'); src.className = 'gv-cardsrc';
    src.textContent = (mostlyOnline(p) ? 'Most of its students study only online, so its graduates count here, at its home campus, wherever they live. ' : '') + schoolSource();
    ex.appendChild(src);
    backButton(b);
    if (map.getLayer('gv-selected')) map.setFilter('gv-selected', ['==', ['get','id'], p.id]);
    sheetEl.classList.add('open');
    setDetQuiet('dt-peek');
    if (feat) showPop(feat, null, from);
    announce(p.n + ', ' + p.c + ', ' + p.s + '. ' + ps.length + (ps.length === 1 ? ' program.' : ' programs.'));
    syncURL();
  }
  function openProgram(p0, t, from){
    if (p0.k){ const xx = extraProgs(p0).find(y => y.t === t); if (xx) openNewProgram(p0, xx, from); else openExtra(p0, from); return; }
    const feat = schoolOf(p0.u);
    const p = feat ? feat.properties : p0;
    const x = programsOf(p).find(y => y.t === t);
    if (!x){ const fx = freshOf(p).find(y => y.t === t); if (fx) openNewProgram(p, fx, from); else openSchoolSite(p, from); return; }
    mode = 'card'; backTo = 'school'; backSchool = { p, from }; progFocus = t;
    selectedId = p.id;
    const T = PROGRAMS[t], M = SCHOOL_META || {};
    const mi = feat ? milesTo(feat.geometry.coordinates) : null;
    const ctl = M.control ? M.control[p.ctl] : '';
    const b = cardScaffold(T.label, p.n, p.c + ', ' + p.s + (ctl ? ' · ' + ctl : '') + (mi != null ? ' · ' + mi.toFixed(1) + ' mi from you' : ''));
    // its peers: every school in the state with this program, filters aside
    const gOf = f => (programsOf(f.properties).find(y => y.t === t) || { g:0 }).g;
    const withIt = (WHOLE_CACHE.school || []).filter(f => programsOf(f.properties).some(y => y.t === t));
    const peers = withIt.filter(f => f.properties.s === p.s);
    const rank = 1 + peers.filter(f => gOf(f) > x.g).length;
    statTiles(b, [{ v:x.g.toLocaleString('en-US'), k:'Graduates, ' + schoolYear() }, { v:'#' + rank + ' of ' + peers.length, k:'In ' + p.s + ' by graduates' }]);
    const ex = b.querySelector('.gv-extra');
    const rows = levelsOf(x.lv).map(([l, n]) => [(M.levels && M.levels[l]) || 'Level ' + l, n.toLocaleString('en-US')]);
    const stTot = peers.reduce((a, f) => a + gOf(f), 0);
    if (peers.length > 1 && stTot) rows.push(['Share of ' + stateNameOf(p.s) + ' ' + T.short + ' graduates', Math.round(x.g / stTot * 100) + '%']);
    if (feat){
      let bn = null, bd = Infinity;
      withIt.forEach(f => {
        if (f.properties.u === p.u) return;
        const d = hav(feat.geometry.coordinates, f.geometry.coordinates);
        if (d < bd){ bd = d; bn = f; }
      });
      if (bn && bd < 500) rows.push(['Nearest other ' + T.short + ' program', bn.properties.n + ' · ' + bd.toFixed(1) + ' mi', 1]);
    }
    rows.push(...accredRows(p.u, t));
    factsBlock(ex, rows);
    // the school's other programs
    const sibs = programsOf(p).filter(y => y.t !== t);
    if (sibs.length){
      const w = titledSection(ex, 'Also at this school');
      const row = document.createElement('div'); row.className = 'gv-drow';
      sibs.forEach(y => {
        const S = PROGRAMS[y.t];
        const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'hu-chip';
        const dot = document.createElement('i'); dot.style.background = S.color;
        const cnt = document.createElement('b'); cnt.className = 'cnt'; cnt.textContent = ' ' + y.g.toLocaleString('en-US');
        btn.appendChild(dot); btn.appendChild(document.createTextNode(S.label)); btn.appendChild(cnt);
        btn.setAttribute('aria-label', S.label + ', ' + gradsText(y.g));
        btn.addEventListener('click', () => openProgram(p, y.t, from));
        row.appendChild(btn);
      });
      w.appendChild(row);
    }
    ex.appendChild(linkChip());
    const src = document.createElement('div'); src.className = 'gv-cardsrc';
    src.textContent = (mostlyOnline(p) ? 'Most of its students study only online, so its graduates count here, at its home campus, wherever they live. ' : '') +
      (PROGRAM_NOTES[t] ? PROGRAM_NOTES[t] + ' ' : '') + schoolSource() + accredSource(p.u, t);
    ex.appendChild(src);
    backButton(b);
    if (map.getLayer('gv-selected')) map.setFilter('gv-selected', ['==', ['get','id'], p.id]);
    sheetEl.classList.add('open');
    setDetQuiet('dt-peek');
    if (feat) showPop(feat, t, from);
    announce(T.label + ' at ' + p.n + '. ' + gradsText(x.g) + '.');
    syncURL();
  }
  /** a scope's schools, as tiles: graduates in the chosen programs, and how many programs that is */
  function schoolTiles(sch){
    const grads = sch.reduce((a, f) => a + gradsIn(f.properties), 0);
    const progs = sch.reduce((a, f) => a + programsOf(f.properties).filter(x => !activePrograms || activePrograms.has(x.t)).length, 0);
    // under a one-program filter the program count IS the school count, already on the first tile
    return [{ v:grads.toLocaleString('en-US'), k:'Graduates, ' + schoolYear() }].concat(progs === sch.length ? [] : [{ v:progs.toLocaleString('en-US'), k:'Programs' }]);
  }
  /** a scope's schools by program: how many schools offer it, and their graduates in it */
  function programRows(sch){
    const rows = PROGRAM_KEYS.filter(t => !activePrograms || activePrograms.has(t)).map(t => {
      const of = sch.map(f => programsOf(f.properties).find(x => x.t === t)).filter(Boolean);
      if (!of.length) return null;
      return [PROGRAMS[t].label, of.length + ' · ' + gradsText(of.reduce((a, x) => a + x.g, 0))];
    }).filter(Boolean);
    const all = sch.reduce((a, f) => a + gradsIn(f.properties), 0), ol = sch.filter(f => mostlyOnline(f.properties)).reduce((a, f) => a + gradsIn(f.properties), 0);
    if (ol) rows.push(['From mostly online schools', ol.toLocaleString('en-US') + ' of ' + all.toLocaleString('en-US') + ' graduates', 1]);
    return rows;
  }

  // ── state selection ──
  async function selectState(f){
    if (selState && selState.fips === f.properties.fips && !selCounty && mode === 'card'){ return; }
    clearCounty();
    clearPin();
    selState = { fips:f.properties.fips, abbr:f.properties.abbr, name:f.properties.name, feature:f };
    ensureCountyData();   // first moment county values can matter
    syncBoundaryPaint();
    // maxZoom keeps DC/RI from diving to street level on selection
    fitScope(stateBounds(f), 8.5, 900);
    openStateCard();
    announce(selState.name + '. ' + inState(selState.abbr).length + ' ' + NOUN() + '.');
    // counties load ON SELECTION (rule 7): small file, cached, signaled
    if (!COUNTY_CACHE.has(selState.fips)){
      signal('Loading ' + selState.name + ' counties…');
      try {
        const fc = await fetch('/assets/data/geo/counties/' + selState.fips + '.json').then(r => r.json());
        COUNTY_CACHE.set(selState.fips, fc);
        signalDone('✓ ' + fc.features.length + ' counties');
      } catch(e){ signalDone('Counties unavailable', 2000); }
    }
    const fc = COUNTY_CACHE.get(selState.fips);
    if (fc && selState) { const s = map.getSource('counties'); if (s) s.setData(fc); applyCountyTint(); }
    // shard layers: this state's shard rides in now (rule 7 — load on intent)
    if (LAYER_ON.has('pharm') && selState){
      await loadPharm(selState.abbr);
      // the search pill counts what is loaded, and a state's pharmacies only just arrived (it read 0 until 2026-10-03)
      if (selState){ refreshSource(); updateCount(); pillCount(); if (mode === 'card' && !selCounty && !selectedId) openStateCard(); }
    }
    syncURL();
  }
  /* where a state's count places among the fifty states, most first, with whatever layers and types are showing; ties
     share the better place. DC and the territories are not ranked. (2026-10-02: Vital Stats asks "what place is Utah"
     and links here, so the card answers it, the way a hospital's card already places it by beds.) */
  const NOT_A_STATE = new Set(['DC', 'PR', 'GU', 'VI', 'AS', 'MP']);
  function stateRank(abbr, n){
    if (!STATES || NOT_A_STATE.has(abbr)) return null;
    const fifty = STATES.features.map(f => f.properties.abbr).filter(a => a && !NOT_A_STATE.has(a));
    if (fifty.length !== 50) return null;
    const place = 1 + fifty.filter(a => inState(a).length > n).length;
    return ['Rank among the 50 states', '#' + place + ' by count, most first'];
  }
  function openStateCard(){
    if (!selState) return;
    mode = 'card'; backTo = null;
    const hs = inState(selState.abbr);
    const beds = hs.reduce((a,f) => a + (+f.properties.beds || 0), 0);
    const pop = statePop(selState.fips);
    /* The count said itself three times on this card: the headline value, the sub line
    and the first stat tile (David's phone QA, 2026-08-23). Now the kicker names WHAT
    is counted, the value says how many, and the sub only says what to do next. The
    tile stays for desktop, where the headline value is hidden. */
    const b = cardScaffold(NOUN() + filteredTag(),
      selState.name, 'tap a county for its profile');
    // phone: the peek sheet must carry the answer — the count rides the name row
    const pv = document.createElement('span');
    pv.className = 'pv'; pv.textContent = hs.length.toLocaleString('en-US');
    b.querySelector('.gv-card-name').appendChild(pv);
    const stats = [{ v:hs.length.toLocaleString('en-US'), k: LAYER_ON.size === 1 ? DATASETS[[...LAYER_ON][0]].label : 'Facilities' }];
    // schools alone: the count is schools, then their graduates and programs (the chosen ones, under a filter)
    const sch = hs.filter(f => f.properties.t === 'school');
    if (LAYER_ON.size === 1 && LAYER_ON.has('school')) stats.push(...schoolTiles(sch));
    else if (beds > 0){
      stats.push({ v:beds.toLocaleString('en-US'), k:'Beds' });
      const st = avgStar(hs); if (st) stats.push({ v:st + '★', k:'Avg CMS', cls:' hi' });
    } else if (pop && hs.length){
      stats.push({ v:(hs.length * 10000 / pop).toFixed(1), k:'Per 10k residents' });
    }
    statTiles(b, stats);
    const ex = b.querySelector('.gv-extra');
    const facts = [
      ['Population', pop ? fmtPop(pop) : null],
      beds > 0 ? ['Beds per 1,000', pop ? (beds * 1000 / pop).toFixed(1) : null] : null,
      stateRank(selState.abbr, hs.length),
      ...(LAYER_ON.has('school') ? programRows(sch) : [])
    ];
    if (LAYER_ON.size > 1) [...LAYER_ON].forEach(k => {   // multi-layer: the breakdown IS the story
      facts.push([DATASETS[k].label, hs.filter(f => layerOf(f.properties.t) === k).length.toLocaleString('en-US')]);
    });
    factsBlock(ex, facts.filter(Boolean));
    // shade-counties moved to the drawer's Display tab (one filter home);
    // the card keeps a one-tap pointer so the feature stays discoverable
    /* Always render the entry point. County data is fetched on state select now, so
       gating on CDATA meant the button simply did not exist for the whole download
       and then appeared — the feature looked absent rather than pending. */
    {
      const hint = document.createElement('button');
      hint.className = 'gv-tolist'; hint.type = 'button';
      if (CDATA){
        hint.textContent = countyMetric ? '◩ Shading: ' + CMETRICS[countyMetric].label + ' · change…' : '◩ Shade counties by a metric…';
        hint.addEventListener('click', openDisplayTab);
      } else {
        hint.textContent = '◩ Loading county data…';
        hint.disabled = true;
      }
      ex.appendChild(hint);
    }
    hospRows(ex, hs.slice().sort((a,b2) => sizeOf(b2) - sizeOf(a)), 3, 'state');
    ex.appendChild(linkChip());
    const det = cardDetent('dt-peek');
    sheetEl.classList.add('open');
    setDetQuiet(det);
  }
  function deselectState(){
    selState = null;
    clearCounty();
    closeSheet();
    syncBoundaryPaint();
    const s = map.getSource('counties'); if (s) s.setData({ type:'FeatureCollection', features:[] });
    applyCountyTint();   // back to plain (the chosen metric survives for the next state)
    refreshSource();     // pharmacy mode empties at US zoom — shards are per state
    updateCount();
    lastCam = null;   // home view: detent changes have no scope to refit
    flyHome(900);
    announce('Back to the United States view.');
    syncURL();
  }

  // ── county selection ──
  function selectCounty(f){
    if (!selState) return;
    clearPin();
    selCounty = { fips:f.properties.fips, name:f.properties.name, feature:f };
    syncBoundaryPaint();
    // frame the county (full geometry from the cache — the tapped feature is tile-clipped)
    const full = COUNTY_CACHE.has(selState.fips)
      ? COUNTY_CACHE.get(selState.fips).features.find(x => x.properties.fips === selCounty.fips)
      : null;
    if (full) fitScope(bboxOf(full.geometry), 10.5, 800);
    openCountyCard();
    announce(selCounty.name + ' County.');
    syncURL();
  }
  function openCountyCard(){
    if (!selCounty || !selState) return;
    mode = 'card'; backTo = 'state';
    const feat = COUNTY_CACHE.has(selState.fips)
      ? COUNTY_CACHE.get(selState.fips).features.find(x => x.properties.fips === selCounty.fips)
      : null;
    const geom = (feat || selCounty.feature).geometry;
    const hs = inState(selState.abbr).filter(f => pip(f.geometry.coordinates, geom));
    const beds = hs.reduce((a,f) => a + (+f.properties.beds || 0), 0);
    const cpop = (CPOP && CPOP[selCounty.fips]) ? CPOP[selCounty.fips].p : null;
    const b = cardScaffold(NOUN() + filteredTag(),
      selCounty.name + ' County', selState.name);
    /* the count rides the name row here too, same as the state card */
    { const pv = document.createElement('span');
      pv.className = 'pv'; pv.textContent = hs.length.toLocaleString('en-US');
      b.querySelector('.gv-card-name').appendChild(pv); }
    const stats = [{ v:hs.length.toLocaleString('en-US'), k: LAYER_ON.size === 1 ? DATASETS[[...LAYER_ON][0]].label : 'Facilities' }];
    // schools alone: the count is schools, then their graduates and programs (the chosen ones, under a filter)
    const sch = hs.filter(f => f.properties.t === 'school');
    if (LAYER_ON.size === 1 && LAYER_ON.has('school')) stats.push(...schoolTiles(sch));
    else if (beds > 0){
      stats.push({ v:beds.toLocaleString('en-US'), k:'Beds' });
      const st = avgStar(hs); if (st) stats.push({ v:st + '★', k:'Avg CMS', cls:' hi' });
    } else if (cpop && hs.length){
      stats.push({ v:(hs.length * 10000 / cpop).toFixed(1), k:'Per 10k residents' });
    }
    statTiles(b, stats);
    const ex = b.querySelector('.gv-extra');
    // county-grain enrichment: Census population + CDC PLACES / BLS / Census
    // coverage, the same files the operators map profiles run on
    const pop = (CPOP && CPOP[selCounty.fips]) ? CPOP[selCounty.fips].p : null;
    const inc = cdVal('economics','0',selCounty.fips);
    const cfacts = [
      ['Population', pop ? fmtPop(pop) : null],
      ['Beds per 1,000', (pop && beds) ? (beds * 1000 / pop).toFixed(1) : null],
      ['Median income', inc != null ? '$' + inc + 'k' : null],
      ['Uninsured', pct(cdVal('payer','0',selCounty.fips))],
      ['Diabetes', pct(cdVal('patient','1',selCounty.fips))],
      ['Fair/poor health', pct(cdVal('patient','0',selCounty.fips))]
    ];
    if (LAYER_ON.size > 1) [...LAYER_ON].forEach(k => {
      const n = hs.filter(f => layerOf(f.properties.t) === k).length;
      if (n) cfacts.push([DATASETS[k].label, n.toLocaleString('en-US')]);
    });
    if (LAYER_ON.has('school')) cfacts.push(...programRows(sch));
    factsBlock(ex, cfacts);
    if (hs.length) hospRows(ex, hs.slice().sort((a,b2) => sizeOf(b2) - sizeOf(a)), 3, 'county');
    else ex.insertAdjacentHTML('beforeend', '<div class="gv-hint">No ' + (activeTypes && LAYER_ON.has('hosp') ? 'matching ' : '') + NOUN() + ' inside this county line.</div>');
    ex.appendChild(linkChip());
    const det = cardDetent('dt-half');
    sheetEl.classList.add('open');
    setDetQuiet(det);
  }
  function clearCounty(){
    selCounty = null;
    syncBoundaryPaint();
  }

  // ── health-system view: tap the system on any card → its whole footprint ──
  function enterSystem(sys){
    if (!LAYER_ON.has('hosp') || !sys) return;
    activeSystem = sys;
    refreshSource(); updateCount(); renderList();
    const pts = activeSet();
    if (pts.length){
      let w = 180, s = 90, e = -180, n = -90;
      pts.forEach(f => { const [lo, la] = f.geometry.coordinates; if (lo < w) w = lo; if (lo > e) e = lo; if (la < s) s = la; if (la > n) n = la; });
      if (w < -179.9) w = -179.9;
      fitScope([[w, s], [e, n]], 9, 900);
    }
    openSystemCard();
    updateScopeChip();
    syncURL();
  }
  function openSystemCard(){
    if (!activeSystem) return;
    mode = 'card'; backTo = null;
    clearPin();
    const hs = activeSet();
    const beds = hs.reduce((a,f) => a + (+f.properties.beds || 0), 0);
    const states = new Set(hs.map(f => f.properties.s));
    const b = cardScaffold('Health system', activeSystem, hs.length + ' facilities across ' + states.size + ' state' + (states.size === 1 ? '' : 's'));
    const stats = [{ v:hs.length.toLocaleString('en-US'), k:'Facilities' }, { v:beds.toLocaleString('en-US'), k:'Beds' }];
    const st = avgStar(hs); if (st) stats.push({ v:st + '★', k:'Avg CMS', cls:' hi' });
    statTiles(b, stats);
    /* BY TYPE (2026-10-02): its hospitals by kind, most first, then how many sit outside a metro area by the county
       CMS records (that row waits for the POS file). Vital Stats asks both and links here. */
    const kinds = {};
    hs.forEach(f => { if (TYPES[f.properties.t]) kinds[f.properties.t] = (kinds[f.properties.t] || 0) + 1; });
    const ord = Object.keys(TYPES);
    const byType = Object.keys(kinds).sort((a, c) => kinds[c] - kinds[a] || ord.indexOf(a) - ord.indexOf(c)).map(t => [TYPES[t].label, kinds[t].toLocaleString('en-US')]);
    const hn = Object.values(kinds).reduce((a, v) => a + v, 0);
    if (ENRICH && ENRICH.byId && hn) {
      const out = hs.filter(f => TYPES[f.properties.t] && ENRICH.byId[f.properties.id] && ENRICH.byId[f.properties.id].ur === 1).length;
      byType.push(['Outside a metro area', out + ' of ' + hn]);
    }
    if (byType.length) factsBlock(titledSection(b.querySelector('.gv-extra'), 'By type'), byType);
    /* BY STATE (2026-10-02): where its hospitals are, each state's count beside every hospital the map shows in that
       state, with the system's share. Vital Stats asks both and links here. */
    const per = {};
    hs.forEach(f => { if (f.properties.s) per[f.properties.s] = (per[f.properties.s] || 0) + 1; });
    const stName = a => { const sf = STATES && STATES.features.find(x => x.properties.abbr === a); return sf ? sf.properties.name : a; };
    const all = LAYER_ON.has('hosp') ? filtered() : [];
    const byState = Object.keys(per).sort((a, c) => per[c] - per[a] || stName(a).localeCompare(stName(c))).map(a => {
      const tot = all.filter(f => f.properties.s === a).length;
      return [stName(a), per[a] + ' of ' + tot + (tot ? ' (' + Math.round(per[a] / tot * 100) + '%)' : '')];
    });
    if (byState.length) factsBlock(titledSection(b.querySelector('.gv-extra'), 'By state · of every hospital there'), byState);
    // the whole system's cost reports, added up: [with a full year, on the list, most common year, beds, icu, dc, fte, mcr, mcd, res]
    const cs = HCR && HCR.sys ? HCR.sys[activeSystem] : null;
    if (cs) costReportBlock(b.querySelector('.gv-extra'), 'Medicare cost reports · mostly ' + cs[2],
      [['beds', cs[3]], ['icu', cs[4]], ['dc', cs[5]], ['fte', cs[6]], ['mcr', cs[7]], ['mcd', cs[8]], ['res', cs[9]]],
      'Added up across ' + (cs[0] === cs[1] ? 'all ' + cs[1] : cs[0] + ' of its ' + cs[1]) + ' hospitals\' latest full-year cost reports. ' + hcrNote(),
      { beds:'Beds on the cost reports', dc:'Inpatient discharges, a year' });
    hospRows(b.querySelector('.gv-extra'), hs.slice().sort((a,b2) => (+b2.properties.beds||0) - (+a.properties.beds||0)), 5, 'system');
    b.querySelector('.gv-extra').appendChild(linkChip());
    const det = revealDetent();
    sheetEl.classList.add('open');
    setDetQuiet(det);
  }
  function exitSystem(){
    activeSystem = null;
    refreshSource(); updateCount(); renderList();
    closeSheet();
    if (selState){ openStateCard(); fitState(); }
    else { lastCam = null; flyHome(900); }
    updateScopeChip();
    syncURL();
  }

  // ── shareable URLs + the phone back contract: SCOPE changes (state, county,
  //    system) PUSH a history entry so the back button unwinds the drill;
  //    in-view tweaks (layers, filters) replace. Back only leaves the page
  //    from the national view — David's "double back to quit". ──
  const urlCtl = HUKit.urlState({ url: () => urlFor(), scope: () => scopeKey(), seeded: true });   // arrival replaces once, then scope changes push
  const scopeKey = () => (selState ? selState.abbr : '') + '/' + (selCounty ? selCounty.fips : '') + '/' + (activeSystem || '');
  function syncURL(){ urlCtl.sync(); }
  function urlFor(){
    const p = new URLSearchParams();
    const lay = [...LAYER_ON].join(',');
    if (lay !== 'hosp') p.set('layers', lay);
    if (activeTypes) p.set('types', [...activeTypes].join(','));
    if (activeSupplies) p.set('supplies', [...activeSupplies].join(','));
    if (activePrograms) p.set('programs', [...activePrograms].join(','));
    if (selState) p.set('state', selState.abbr);
    if (selCounty) p.set('county', selCounty.fips);
    if (activeSystem) p.set('sys', activeSystem);
    if (selectedId) p.set('fac', selectedId);   // shareable facility views (replace-only: pins never stack history)
    if (selectedId && progFocus) p.set('prog', progFocus);   // a school's program card
    const q = p.toString();
    return q ? ('?' + q) : location.pathname;
  }
  window.addEventListener('popstate', async () => {
    if (backGd && backGd.consumed()) return;   // the back guard handled this pop
    urlCtl.begin();
    try {
      // quiet scope reset, then rebuild from the entry's querystring
      activeSystem = null; selCounty = null; selState = null;
      clearPin(); sheetEl.classList.remove('open'); mode = 'card'; backTo = null;
      syncBoundaryPaint(); refreshSource();
      const p = new URLSearchParams(location.search);
      const st = p.get('state');
      if (st && STATES){
        const sf = STATES.features.find(f => f.properties.abbr === st);
        if (sf){
          await selectState(sf);
          const co = p.get('county');
          if (co && COUNTY_CACHE.has(sf.properties.fips)){
            const cf = COUNTY_CACHE.get(sf.properties.fips).features.find(x => x.properties.fips === co);
            if (cf) selectCounty(cf);
          }
        }
      } else {
        lastCam = null;
        flyHome(900);
        updateCount(); renderList(); syncInsets();
      }
      const sys = p.get('sys');
      if (sys && LAYER_ON.has('hosp')) enterSystem(sys);
      urlCtl.mark(scopeKey());
    } finally { urlCtl.end(); }
  });
  async function applyURLState(){
    const p = new URLSearchParams(location.search);
    if (![...p.keys()].length) return;
    urlCtl.begin();
    // COMPAT: old operators-map links keep working after the swap
    // (?res= &org= &hide= &fac= — its ?county= was a metric key, ours is a
    // fips; the 5-digit test keeps them apart)
    const RES2DS = { hospitals:'hosp', dialysis:'dial', asc:'asc', pharmacy:'pharm', dme:'dme', optical:'optical', orthotics:'ortho' };
    if (p.get('res') && RES2DS[p.get('res')] && !p.get('ds')) p.set('ds', RES2DS[p.get('res')]);
    if (p.get('org') && !p.get('sys')) p.set('sys', p.get('org'));
    if (p.get('hide') && !p.get('types')){
      const hid = new Set(p.get('hide').split(','));
      const shown = Object.keys(TYPES).filter(k => !hid.has(k));
      if (shown.length && shown.length < Object.keys(TYPES).length) p.set('types', shown.join(','));
    }
    if (p.get('county') && !/^\d{5}$/.test(p.get('county'))) p.delete('county');
    if (p.get('metric') === 'cah' && !p.get('types')) p.set('types', 'cah');   // healthcare-gap article deep link (?metric=cah) — honored, not dropped
    try {
      const ty = p.get('types');
      if (ty){
        const ks = ty.split(',').filter(k => TYPES[k]);
        if (ks.length){ activeTypes = new Set(ks); dropFilterCache(); buildDisplayPanel(); pillFaces(); refreshSource(); pillCount(); }
      }
      const lay = p.get('layers') || (p.get('ds') && DATASETS[p.get('ds')] ? p.get('ds') : null);
      if (lay){
        const ks = lay.split(',').filter(k => DATASETS[k]);
        for (const k of ks) if (!LAYER_ON.has(k)) await toggleLayer(k);
        if (ks.length && !ks.includes('hosp') && LAYER_ON.has('hosp')) await toggleLayer('hosp');
      }
      // ?supplies= reads against the groups the equipment file declares, so it waits for the layers above
      // ?programs= narrows the Schools layer to the schools offering any of them
      const pg = p.get('programs');
      if (pg){
        const ks = pg.split(',').filter(k => PROGRAMS[k]);
        if (ks.length){ activePrograms = new Set(ks); buildDisplayPanel(); pillFaces(); refreshSource(); pillCount(); }
      }
      const sup = p.get('supplies');
      if (sup && SUPPLY_META){
        const ks = sup.split(',').filter(k => SUPPLY_META.groups.some(g => g.key === k));
        if (ks.length){ activeSupplies = new Set(ks); buildDisplayPanel(); pillFaces(); refreshSource(); pillCount(); }
      }
      const stAbbr = p.get('state');
      if (stAbbr && STATES){
        const sf = STATES.features.find(x => x.properties.abbr === stAbbr);
        if (sf){
          await selectState(sf);
          const co = p.get('county');
          if (co && COUNTY_CACHE.has(sf.properties.fips)){
            const cf = COUNTY_CACHE.get(sf.properties.fips).features.find(x => x.properties.fips === co);
            if (cf) selectCounty(cf);
          }
        }
      }
      const sys = p.get('sys');
      if (sys && LAYER_ON.has('hosp')) enterSystem(sys);
      const fac = p.get('fac');   // old deep links straight to a facility
      if (fac){
        const isSchool = /^(u\d+|x[0-9a-f]{8})$/.test(fac);
        if (isSchool && !LAYER_ON.has('school')) await toggleLayer('school');   // a school: its layer comes on
        if (isSchool) await loadAccred();   // its new programs and the extra marks ride the accreditation file
        const f = activeSet().find(x => x.properties.id === fac) || ALL.find(x => x.properties.id === fac) || (WHOLE_CACHE.school || []).find(x => x.properties.id === fac) || EXTRA.find(x => x.properties.id === fac);
        if (f){
          openPinCard(f.properties, null);
          const pr = p.get('prog');
          if (pr && (f.properties.t === 'school' || f.properties.t === 'schoolx') && PROGRAMS[pr]) openProgram(f.properties, pr, null);
          map.flyTo({ center:f.geometry.coordinates, zoom:11, duration:0 });
        }
      }
    } finally { urlCtl.end(); }
  }

  function syncBoundaryPaint(){
    if (map.getLayer('gv-state-sel')) map.setFilter('gv-state-sel', ['==', ['get','fips'], selState ? selState.fips : '___none']);
    if (map.getLayer('gv-county-sel')) map.setFilter('gv-county-sel', ['==', ['get','fips'], selCounty ? selCounty.fips : '___none']);
    if (map.getLayer('gv-county-self')) map.setFilter('gv-county-self', ['==', ['get','fips'], selCounty ? selCounty.fips : '___none']);
    updateScopeChip();
    syncInsets();
  }

  // ── scope-back chip: one level per tap — county → state → United States ──
  function fitState(){
    if (!selState) return;
    fitScope(stateBounds(selState.feature), 8.5, 900);
  }
  /* the chip says where back goes, in full on a desktop and short on a phone ("◀ U.S.", "◀ UT", "◀ Exit"): in full it
     left the search box about 100px on a 360 screen, and "Search 3,596 equipment suppliers" showed a sixth of itself
     (phone gate, 2026-10-03). The aria-label carries the whole sentence either way. */
  function scopeText(sc, long, short){
    sc.innerHTML = '◀ <span class="sc-l"></span><span class="sc-s"></span>';
    sc.querySelector('.sc-l').textContent = long;
    sc.querySelector('.sc-s').textContent = short;
  }
  function updateScopeChip(){
    const sc = $('gvScope'); if (!sc) return;
    if (activeSystem){ sc.hidden = false; scopeText(sc, 'Exit system', 'Exit'); sc.title = 'Back to all hospitals'; sc.setAttribute('aria-label', sc.title); return; }
    if (!selState){ sc.hidden = true; return; }
    sc.hidden = false;
    if (selCounty) scopeText(sc, selState.name, selState.abbr); else scopeText(sc, 'United States', 'U.S.');
    sc.title = selCounty ? 'Back out to the state view' : 'Back out to the U.S. view';
    sc.setAttribute('aria-label', sc.title);
  }
  $('gvScope').addEventListener('click', () => {
    if (activeSystem){ exitSystem(); return; }
    if (selCounty){ clearCounty(); clearPin(); openStateCard(); fitState(); syncURL(); return; }
    if (selState) deselectState();
  });

  // ── list mode ──
  function openList(){
    mode = 'list'; backTo = null;
    clearPin();
    showTab('details');   // the list is a Details view of the current scope
    const det = revealDetent();
    sheetEl.classList.add('open');
    /* renderList bails unless the sheet already carries .open, so it has to run AFTER
       the class lands. It used to run before, which meant the FIRST tap on the List
       button opened an empty sheet; the rows only appeared once a map move fired the
       moveend renderList. Found by tapping the button, not by any measurement. */
    renderList();
    setDetQuiet(det);
  }
  function renderList(){
    if (mode !== 'list' || !sheetEl.classList.contains('open')) return;
    // located users get the Zillow sort: nearest first, with mileage on every row
    const rows = inView().slice().sort(lastFix
      ? (a,b) => milesTo(a.geometry.coordinates) - milesTo(b.geometry.coordinates)
      : (a,b) => sizeOf(b) - sizeOf(a));
    const cap = rows.slice(0, 80);
    let h = '<div class="gv-list-h">' + rows.length.toLocaleString('en-US') + (drawnPoly ? ' in your drawn area' : ' in view') + ' · ' + (lastFix ? 'nearest first' : 'biggest first') + '</div><div class="gv-rows">';
    h += cap.map((f,i) => {
      const p = f.properties, T = TYPES[p.t] || {};
      const mi = milesTo(f.geometry.coordinates);
      /* The Zillow row anatomy (David's archetype call, 2026-08-23: this map functions
         like Zillow for healthcare facilities). Every row answers the same questions in
         the same order: WHO (name), WHAT DO I GET (the vitals line, solid ink: rating,
         size, trauma level, ER), WHERE (the address line, muted). The old row mashed
         vitals into the address line at one muted size, so scanning thirty rows meant
         re-reading each one. Trauma and ER were not in the row at all, and for this
         audience they are the bd/ba/sqft of the listing. */
      const vitals = [];
      if (p.t === 'school'){   // a school's row answers: what it teaches, and how many it graduated in the chosen programs
        vitals.push('<span>' + p.pl + '</span>', '<span>' + gradsText(gradsIn(p)) + '</span>');
        if (mostlyOnline(p)) vitals.push('<span>Mostly online</span>');
      }
      if (+p.sg && SUPPLY_META) vitals.push('<span>' + supplySummary(p) + '</span>');   // an equipment supplier's row answers "do they carry it"
      if (+p.r) vitals.push('<span class="st">' + '★'.repeat(+p.r) + '</span>');
      if (+p.beds) vitals.push('<span>' + Number(p.beds).toLocaleString('en-US') + ' beds</span>');
      if (+p.st) vitals.push('<span>' + Number(p.st).toLocaleString('en-US') + ' stations</span>');
      if (p.trauma) vitals.push('<span>' + String(p.trauma).replace('Level ', 'Trauma ') + '</span>');
      if (TYPES[p.t]) vitals.push('<span>' + (+p.e ? 'ER' : 'No ER') + '</span>');
      return '<button class="gv-row" type="button" data-i="' + i + '"><div class="rn"></div>' +
        (vitals.length ? '<div class="rv">' + vitals.join('<b>·</b>') + '</div>' : '') +
        '<div class="rs"><i style="background:' + (T.color || iconColorOf(p.t)) + '"></i><span>' + p.c + ', ' + p.s + '</span>' +
        (mi != null ? '<span>' + mi.toFixed(1) + ' mi</span>' : '') +
        (p.sys ? '<span>' + p.sys + '</span>' : '') + '</div></button>';
    }).join('');
    h += '</div>';
    if (rows.length > cap.length) h += '<div class="gv-more">Zoom in to narrow the other ' + (rows.length - cap.length).toLocaleString('en-US') + '</div>';
    $('gvSheetBody').innerHTML = h;
    $('gvSheetBody').querySelectorAll('.gv-row').forEach((el,i) => {
      el.querySelector('.rn').textContent = cap[i].properties.n;
      el.addEventListener('click', () => {
        openPinCard(cap[i].properties, 'list');
        map.flyTo({ center:cap[i].geometry.coordinates, zoom:Math.max(map.getZoom(), 10.5), duration:dcap(900) });
      });
    });
  }
  $('gvListBtn').addEventListener('click', () => {
    if (mode === 'list' && sheetEl.classList.contains('open')){ if (!restoreScopeCard()) closeSheet(); }
    else openList();
  });

  // ── chips ──
  function buildDisplayPanel(){
    // the drawer's Display tab: every filter, one home (chrome grammar A).
    // Rebuilt on every open/change — ~25 small nodes, cheap and always true.
    const host = $('gvDisplayBody');
    const p = labelPrefs();
    let h = '<div class="gv-dsec"><h5>Layers</h5><div class="gv-drow">' +
      Object.entries(DATASETS).map(([k,d]) =>
        '<button class="hu-chip ds-chip' + (LAYER_ON.has(k) ? ' on' : '') + '" type="button" data-ds="' + k + '" aria-pressed="' + LAYER_ON.has(k) + '">' +
        (LAYER_COLORS[k] ? '<i style="background:' + LAYER_COLORS[k] + '"></i>' : '') + d.label + '<b class="cnt"></b></button>').join('') + '</div></div>';
    if (LAYER_ON.has('hosp')){
      h += '<div class="gv-dsec"><h5>' + 'Hospital types' + ' <span class="sub">only = solo</span></h5><div class="gv-drow">' +
        '<button class="hu-chip tchip' + (!activeTypes ? ' on' : '') + '" type="button" data-t="__all">' + 'All types' + '</button>' +
        Object.entries(TYPES).map(([k,v]) =>
          '<button class="hu-chip tchip' + (activeTypes && activeTypes.has(k) ? ' on' : '') + '" type="button" data-t="' + k + '"><i style="background:' + v.color + '"></i>' + v.label + '<b class="cnt"></b><span class="gv-only" data-only="' + k + '">only</span></button>').join('') + '</div></div>';
    }
    // what equipment suppliers carry: shown while a home equipment, orthotics or optical layer is on
    if (SUPPLY_META && [...LAYER_ON].some(k => SUPPLY_LAYERS.has(k))){
      h += '<div class="gv-dsec"><h5>Supplies <span class="sub">equipment suppliers · only = solo</span></h5><div class="gv-drow">' +
        '<button class="hu-chip schip' + (!activeSupplies ? ' on' : '') + '" type="button" data-sg="__all">All supplies</button>' +
        SUPPLY_META.groups.map(g =>
          '<button class="hu-chip schip' + (activeSupplies && activeSupplies.has(g.key) ? ' on' : '') + '" type="button" data-sg="' + g.key + '">' + g.label +
          '<b class="cnt"></b><span class="gv-only" data-sonly="' + g.key + '">only</span></button>').join('') + '</div></div>';
    }
    // what schools teach: shown while the Schools layer is on; a school shows when it offers ANY chosen program
    if (LAYER_ON.has('school')){
      h += '<div class="gv-dsec"><h5>School programs <span class="sub">only = solo</span></h5><div class="gv-drow">' +
        '<button class="hu-chip pchip' + (!activePrograms ? ' on' : '') + '" type="button" data-pg="__all">All programs</button>' +
        PROGRAM_KEYS.map(k => '<button class="hu-chip pchip' + (activePrograms && activePrograms.has(k) ? ' on' : '') + '" type="button" data-pg="' + k + '">' +
          '<i style="background:' + PROGRAMS[k].color + '"></i>' + PROGRAMS[k].label + '<b class="cnt"></b><span class="gv-only" data-ponly="' + k + '">only</span></button>').join('') + '</div></div>';
    }
    if (CDATA){
      h += '<div class="gv-dsec"><h5>Shade counties by <span class="sub">county tint</span></h5><div class="gv-drow">' +
        '<button class="hu-chip' + (!countyMetric ? ' on' : '') + '" type="button" data-m="">Plain</button>' +
        Object.entries(CMETRICS).map(([k,m]) =>
          '<button class="hu-chip' + (countyMetric === k ? ' on' : '') + '" type="button" data-m="' + k + '">' + m.label + '</button>').join('') + '</div></div>';
    }
    h += '<div class="gv-dsec"><h5>Map labels <span class="sub">basemap text</span></h5>' +
      '<div class="gv-tgl">State names <span class="hu-sw' + (p.state ? ' on' : '') + '" id="gvLabState" role="switch" aria-checked="' + p.state + '" tabindex="0"></span></div>' +
      '<div class="gv-tgl">City names <span class="hu-sw' + (p.city ? ' on' : '') + '" id="gvLabCity" role="switch" aria-checked="' + p.city + '" tabindex="0"></span></div></div>';
    host.innerHTML = h;
    updateCount();   // fill the live per-chip tallies
  }
  // one delegated listener survives every rebuild
  $('gvDisplayBody').addEventListener('keydown', /** @param {KeyboardEvent & {target: HTMLElement}} e */ e => {   // the switches are focusable; Enter/Space must work them
    if (e.key !== 'Enter' && e.key !== ' ') return;
    if (e.target.getAttribute && e.target.getAttribute('role') === 'switch'){ e.preventDefault(); e.target.click(); }
  });
  $('gvDisplayBody').addEventListener('click', /** @param {MouseEvent & {target: HTMLElement}} e */ e => {
    const only = /** @type {HTMLElement | null} */ (e.target.closest('[data-only]'));
    if (only){
      activeTypes = new Set([only.dataset.only]);   // "only" = solo in one tap
      dropFilterCache(); buildDisplayPanel(); pillFaces(); applyFilters(); return;
    }
    const pOnly = /** @type {HTMLElement | null} */ (e.target.closest('[data-ponly]'));
    if (pOnly){ activePrograms = new Set([pOnly.dataset.ponly]); buildDisplayPanel(); pillFaces(); applyFilters(); return; }
    const pgc = /** @type {HTMLElement | null} */ (e.target.closest('[data-pg]'));
    if (pgc){
      const k = pgc.dataset.pg;
      if (k === '__all') activePrograms = null;
      else {
        activePrograms = activePrograms || new Set();
        activePrograms.has(k) ? activePrograms.delete(k) : activePrograms.add(k);
        if (!activePrograms.size || activePrograms.size === PROGRAM_KEYS.length) activePrograms = null;
      }
      buildDisplayPanel(); pillFaces(); applyFilters(); return;
    }
    const sOnly = /** @type {HTMLElement | null} */ (e.target.closest('[data-sonly]'));
    if (sOnly){ activeSupplies = new Set([sOnly.dataset.sonly]); buildDisplayPanel(); pillFaces(); applyFilters(); return; }
    const sg = /** @type {HTMLElement | null} */ (e.target.closest('[data-sg]'));
    if (sg){
      const k = sg.dataset.sg;
      if (k === '__all') activeSupplies = null;
      else {
        activeSupplies = activeSupplies || new Set();
        activeSupplies.has(k) ? activeSupplies.delete(k) : activeSupplies.add(k);
        if (!activeSupplies.size || (SUPPLY_META && activeSupplies.size === SUPPLY_META.groups.length)) activeSupplies = null;
      }
      buildDisplayPanel(); pillFaces(); applyFilters(); return;
    }
    const ds = /** @type {HTMLElement | null} */ (e.target.closest('[data-ds]'));
    if (ds){ toggleLayer(ds.dataset.ds); return; }
    const tb = /** @type {HTMLElement | null} */ (e.target.closest('[data-t]'));
    if (tb){
      const t = tb.dataset.t;
      if (t === '__all') activeTypes = null;
      else {
        activeTypes = activeTypes || new Set();
        activeTypes.has(t) ? activeTypes.delete(t) : activeTypes.add(t);
        if (!activeTypes.size || activeTypes.size === Object.keys(TYPES).length) activeTypes = null;
      }
      dropFilterCache(); buildDisplayPanel(); pillFaces(); applyFilters(); return;
    }
    const mc = /** @type {HTMLElement | null} */ (e.target.closest('[data-m]'));
    if (mc){ countyMetric = mc.dataset.m || null; applyCountyTint(); buildDisplayPanel(); return; }
    if (e.target.id === 'gvLabState'){ toggleLabelPref('state'); return; }
    if (e.target.id === 'gvLabCity'){ toggleLabelPref('city'); return; }
  });
  // the bar's readout pills: they SAY the filter state, and open its home
  function pillFaces(){
    const lp = $('gvLayersPill'), tp = $('gvTypesPill');
    if (!lp || !tp) return;
    const labs = [...LAYER_ON].map(k => DATASETS[k].label);
    lp.innerHTML = 'Layers · <b>' + labs[0] + (labs.length > 1 ? ' +' + (labs.length - 1) : '') + '</b> <span class="car">▾</span>';
    const showTypes = LAYER_ON.has('hosp');
    tp.hidden = !showTypes;
    if (showTypes){
      const t = activeTypes ? [...activeTypes].map(k => TYPES[k] ? TYPES[k].label : k) : null;
      tp.innerHTML = 'Types · <b>' + (t ? (t[0] + (t.length > 1 ? ' +' + (t.length - 1) : '')) : 'All') + '</b> <span class="car">▾</span>';
    }
    // the programs readout rides beside it while the Schools layer is on
    const pp = $('gvProgramsPill');
    if (pp){
      pp.hidden = !LAYER_ON.has('school');
      if (!pp.hidden){
        const ps = activePrograms ? PROGRAM_KEYS.filter(k => activePrograms.has(k)).map(k => PROGRAMS[k].short) : null;
        pp.innerHTML = 'Programs · <b>' + (ps ? ps[0] + (ps.length > 1 ? ' +' + (ps.length - 1) : '') : 'All') + '</b> <span class="car">▾</span>';
      }
    }
    // the supplies readout rides beside it while an equipment layer is on
    const sp = $('gvSuppliesPill');
    if (sp){
      const showSup = !!SUPPLY_META && [...LAYER_ON].some(k => SUPPLY_LAYERS.has(k));
      sp.hidden = !showSup;
      if (showSup){
        const s = activeSupplies ? SUPPLY_META.groups.filter(g => activeSupplies.has(g.key)).map(g => g.label) : null;
        sp.innerHTML = 'Supplies · <b>' + (s ? (s[0] + (s.length > 1 ? ' +' + (s.length - 1) : '')) : 'All') + '</b> <span class="car">▾</span>';
      }
    }
  }
  // ── drawer tabs: Details | Display ──
  let tab = 'details';
  function showTab(t){
    tab = t;
    if (t === 'display') buildDisplayPanel();   // the tab itself is an entry point
    // the details body carries an inline display:flex, which BEATS the hidden
    // attribute — drive display directly or the switch is a no-op
    const det = $('gvSheetBody'), dis = $('gvDisplayBody');
    det.hidden = t !== 'details'; det.style.display = t === 'details' ? 'flex' : 'none';
    dis.hidden = t !== 'display'; dis.style.display = t === 'display' ? 'block' : 'none';
    document.querySelectorAll('#gvTabs button').forEach(/** @param {HTMLElement} b */ b => {
      b.classList.toggle('on', b.dataset.tab === t);
      b.setAttribute('aria-selected', String(b.dataset.tab === t));
    });
    if (t === 'details' && !det.innerHTML.trim())
      det.innerHTML = '<div class="gv-hint">Tap a state, county, or facility for its profile.</div>';
  }
  $('gvTabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) showTab(b.dataset.tab); });
  function openDisplayTab(){
    showTab('display');   // builds the panel on entry
    const det = revealDetent();
    sheetEl.classList.add('open');
    setDetQuiet(det);
  }

  // ── drawer resize: drag the LEFT edge on a monitor; phones keep the sheet.
  //    Width is shared with the multi-lens map (one preference). ──
  (function(){
    const KEY = 'hu-drawer-w';
    const shell = /** @type {HTMLElement} */ (document.querySelector('.gv-shell'));
    const saved = parseInt(localStorage.getItem(KEY), 10);
    if (saved >= 300 && saved <= 640) shell.style.setProperty('--drawer-w', saved + 'px');
    const grip = document.createElement('div');
    grip.className = 'gv-resize';
    grip.setAttribute('aria-hidden', 'true');
    sheetEl.appendChild(grip);
    let sx = 0, sw = 0, lastW = 0, on = false;
    grip.addEventListener('pointerdown', e => {
      if (window.innerWidth < 1100) return;
      on = true; sx = e.clientX; sw = sheetEl.getBoundingClientRect().width;
      grip.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    grip.addEventListener('pointermove', e => {
      if (!on) return;
      lastW = Math.max(300, Math.min(640, Math.round(sw + (sx - e.clientX))));
      shell.style.setProperty('--drawer-w', lastW + 'px');
    });
    grip.addEventListener('pointerup', () => {
      if (!on) return;
      on = false;
      if (lastW) try { localStorage.setItem(KEY, String(lastW)); } catch(e){}
    });
  })();
  $('gvLayersPill').addEventListener('click', openDisplayTab);
  $('gvTypesPill').addEventListener('click', openDisplayTab);
  if ($('gvSuppliesPill')) $('gvSuppliesPill').addEventListener('click', openDisplayTab);
  if ($('gvProgramsPill')) $('gvProgramsPill').addEventListener('click', openDisplayTab);
  $('gvDisplayPill').addEventListener('click', openDisplayTab);
  async function toggleLayer(ds){
    if (LAYER_ON.has(ds)){
      if (LAYER_ON.size === 1) return;   // never an empty map
      LAYER_ON.delete(ds);
      if (ds === 'hosp') activeSystem = null;
      if (selectedId && !activeSet().some(f => f.properties.id === selectedId)) closeSheet();
    } else {
      LAYER_ON.add(ds);
      if (DATASETS[ds].shard){
        if (selState){ await loadPharm(selState.abbr); pillCount(); }
        else { signal(DATASETS[ds].label + ' load per state. Tap a state'); signalDone(null, 3200); }
      } else if (DATASETS[ds].file) await loadWhole(ds);
    }
    buildDisplayPanel(); pillFaces();
    pillCount();
    applyStateTint();
    refreshSource(); updateStateNums(); updateCount(); renderList();
    if (selCounty) openCountyCard();
    else if (selState && sheetEl.classList.contains('open') && mode === 'card' && !selectedId) openStateCard();
    updateScopeChip(); syncURL();
    announce(DATASETS[ds].label + (LAYER_ON.has(ds) ? ' layer on. ' : ' layer off. ') + activeSet().length.toLocaleString('en-US') + ' facilities shown.');
  }
  function applyFilters(){
    if (!map.getSource('hosp')) return;
    refreshSource(); pillCount();
    if (selectedId && !activeSet().some(f => f.properties.id === selectedId)) closeSheet();
    updateCount(); renderList();
    // an open state/county card recomputes under the new filters
    if (mode === 'card' && sheetEl.classList.contains('open')){
      if (selCounty) openCountyCard();
      else if (selState && !selectedId) openStateCard();
    }
    applyStateTint();
    syncURL();
  }
  function updateCount(){
    const iv = inView();
    $('gvCount').textContent = '· ' + iv.length.toLocaleString('en-US') + ' in view';
    // live per-type tallies ON the chips — the count question answered where the toggle lives
    const perLayer = {}, perType = {};
    iv.forEach(f => {
      const k = layerOf(f.properties.t);
      if (k) perLayer[k] = (perLayer[k] || 0) + 1;
      if (TYPES[f.properties.t]) perType[f.properties.t] = (perType[f.properties.t] || 0) + 1;
    });
    document.querySelectorAll('#gvDisplayBody .ds-chip .cnt').forEach(el => {
      const k = el.parentElement.dataset.ds;
      el.textContent = (LAYER_ON.has(k) && perLayer[k]) ? ' ' + perLayer[k].toLocaleString('en-US') : '';
    });
    document.querySelectorAll('#gvDisplayBody .tchip .cnt').forEach(el => {
      const k = el.parentElement.dataset.t;
      el.textContent = (k !== '__all' && perType[k]) ? ' ' + perType[k].toLocaleString('en-US') : '';
    });
    // schools in view offering each program
    const pChips = document.querySelectorAll('#gvDisplayBody .pchip .cnt');
    if (pChips.length){
      const perProg = PROGRAM_KEYS.map(() => 0);
      iv.forEach(f => { const m = +f.properties.pm || 0; if (m) perProg.forEach((_, i) => { if (m & (1 << i)) perProg[i]++; }); });
      pChips.forEach(el => {
        const i = PROGRAM_KEYS.indexOf(/** @type {HTMLElement} */ (el.parentElement).dataset.pg);
        el.textContent = i > -1 && perProg[i] ? ' ' + perProg[i].toLocaleString('en-US') : '';
      });
    }
    // equipment suppliers in view carrying each supply group
    const sChips = document.querySelectorAll('#gvDisplayBody .schip .cnt');
    if (sChips.length && SUPPLY_META){
      const perGroup = SUPPLY_META.groups.map(() => 0);
      iv.forEach(f => { const m = +f.properties.sg || 0; if (m) perGroup.forEach((_, i) => { if (m & (1 << i)) perGroup[i]++; }); });
      sChips.forEach(el => {
        const i = SUPPLY_META.groups.findIndex(g => g.key === el.parentElement.dataset.sg);
        el.textContent = i > -1 && perGroup[i] ? ' ' + perGroup[i].toLocaleString('en-US') : '';
      });
    }
  }

  // ── search ──
  const pillQ = $('gvPillQ');
  /* the search box says how many there are to search under the filters that are on (2026-10-03). It followed a layer
     switch but not a type filter, so "RT only" still read "Search 3,521 programs". Vital Stats' national school counts
     point here: with ?types=rt it reads the U.S. count of RT programs. */
  function pillCount(){
    if ($('gvPill').classList.contains('has-q')) return;
    // the number rides its own span: a phone with a place open drops it (the List button and the card carry it),
    // so "Search equipment suppliers" fits beside the back chip
    pillQ.innerHTML = 'Search <span class="qn"></span>' + NOUN() + '…';
    pillQ.querySelector('.qn').textContent = activeSet().length.toLocaleString('en-US') + ' ';
  }
  function openSearch(){ $('gvSearch').classList.add('open'); $('gvSearchIn').focus(); buildResults(); }
  function closeSearch(){ $('gvSearch').classList.remove('open'); const pb=$('gvPill'); if (pb) pb.focus(); }
  $('gvPill').addEventListener('click', () => openSearch());
  $('gvPillClr').addEventListener('click', () => {
    $('gvPill').classList.remove('has-q'); pillQ.classList.remove('set');
    pillCount();
    $('gvSearchIn').value = ''; closeSheet();
  });
  $('gvSearchX').addEventListener('click', closeSearch);
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if ($('gvSearch').classList.contains('open')){ closeSearch(); return; }
    if (sheetEl.classList.contains('open')) $('gvSheetX').click();   // Esc = the X, back-walk included
  });

  // ── map-label toggles: basemap state/city names on or off, persisted and
  //    SHARED with the multi-lens map (same localStorage pref) ──
  const LABEL_PREFS_KEY = 'hu-map-labels';
  const labelPrefs = () => { try { return Object.assign({ state:true, city:true }, JSON.parse(localStorage.getItem(LABEL_PREFS_KEY) || '{}')); } catch(e){ return { state:true, city:true }; } };
  // our own gv-* layers are DATA (counts, facility names), never toggled here
  const labelGroup = id => /^gv-/.test(id) || /country|continent/.test(id) ? null
    : /state|region/.test(id) ? 'state'
    : /place|city|town|village|suburb/.test(id) ? 'city' : null;
  function applyLabelPrefs(){
    const p = labelPrefs();
    map.getStyle().layers.forEach(l => {
      if (l.type !== 'symbol') return;
      const g = labelGroup(l.id);
      if (!g) return;
      try { map.setLayoutProperty(l.id, 'visibility', p[g] ? 'visible' : 'none'); } catch(e){}
      // gv-state-num carries NAME + count through the country band — the
      // basemap's admin-1 names hold back until clusters take over at 4.6,
      // so the two layers never double-label or collision-drop each other
      if (g === 'state') try { map.setLayerZoomRange(l.id, Math.max(4.6, l.minzoom || 0), l.maxzoom === undefined ? 24 : l.maxzoom); } catch(e){}
    });
  }
  function toggleLabelPref(k){
    const p = labelPrefs(); p[k] = !p[k];
    try { localStorage.setItem(LABEL_PREFS_KEY, JSON.stringify(p)); } catch(e){}
    // the switches live in the Display tab — repaint them in place
    [['gvLabState','state'],['gvLabCity','city']].forEach(([id, key]) => {
      const el = $(id); if (!el) return;
      el.classList.toggle('on', p[key]);
      el.setAttribute('aria-checked', String(p[key]));
    });
    applyLabelPrefs();
    announce((k === 'state' ? 'State names ' : 'City names ') + (p[k] ? 'on.' : 'off.'));
  }
  // arrow keys walk the search results (keyboard path to any facility)
  $('gvSearchIn').addEventListener('keydown', e => {
    if (e.key === 'ArrowDown'){ e.preventDefault(); const f = $('gvSearchList').querySelector('.pop-opt'); if (f) f.focus(); }
  });
  $('gvSearchList').addEventListener('keydown', e => {
    const opts = [...$('gvSearchList').querySelectorAll('.pop-opt')];
    const i = opts.indexOf(document.activeElement);
    if (e.key === 'ArrowDown'){ e.preventDefault(); (opts[i+1] || opts[0]).focus(); }
    else if (e.key === 'ArrowUp'){ e.preventDefault(); if (i <= 0) $('gvSearchIn').focus(); else opts[i-1].focus(); }
  });
  $('gvSearchIn').addEventListener('input', buildResults);
  $('gvSearchIn').addEventListener('keydown', e => {
    if (e.key === 'Enter'){ const f = $('gvSearchList').querySelector('[data-i]'); if (f) f.click(); }
  });
  function buildResults(){
    const q = $('gvSearchIn').value.trim().toLowerCase();
    const host = $('gvSearchList');
    if (!q){
      const shardOnly = ![...LAYER_ON].some(k => !DATASETS[k].shard);
      host.innerHTML = '<div class="gv-none">' + (shardOnly && !selState
        ? 'Tap a state first. Pharmacies load per state.'
        : 'Name, city, state, system, school or program. "intermountain", "respiratory therapy utah", "santa fe"…') + '</div>';
      return;
    }
    /* every word has to appear somewhere, in any order (2026-10-03). It was one substring, so the hint's own
       "children denver" found nothing: no record holds those two words side by side. */
    const words = q.split(/\s+/).filter(Boolean);
    // schools are searchable with their layer off: the file loads on the first real query, and a pick turns the layer on
    if (!WHOLE_CACHE.school && q.length >= 3) loadWhole('school').then(() => { if ($('gvSearch').classList.contains('open')) buildResults(); });
    const pool = (LAYER_ON.has('school') || !WHOLE_CACHE.school ? activeSet() : activeSet().concat(WHOLE_CACHE.school)).concat(EXTRA);
    const hits = pool.filter(f => {
      const p = f.properties, sch = p.t === 'school' || p.t === 'schoolx';
      const text = (p.n + ' ' + p.c + ' ' + p.s + ' ' + stateNameOf(p.s) + ' ' + (p.sys||'') + (sch ? ' school ' + (p.k === 'campus' ? 'campus ' : p.k === 'new' ? 'new ' : '') + popProgs(p).map(x => PROGRAMS[x.t].short + ' ' + PROGRAMS[x.t].label).join(' ') : '') +
        (+p.sg ? ' ' + supplyGroupsOf(p).map(g => g.label).join(' ') : '')).toLowerCase();
      return words.every(w => text.includes(w));
    }).slice(0, 20);
    if (!hits.length){ host.innerHTML = '<div class="gv-none">No matches in the current filters.</div>'; return; }
    host.innerHTML = hits.map((f,i) =>
      '<button class="pop-opt" type="button" data-i="' + i + '"><span class="rn"></span><span class="gv-sr-meta"></span></button>').join('');
    host.querySelectorAll('.pop-opt').forEach((el,i) => {
      const p = hits[i].properties;
      el.querySelector('.rn').textContent = p.n;
      el.querySelector('.gv-sr-meta').textContent = (p.t === 'school' ? 'School · ' + p.pl + ' · ' : p.t === 'schoolx' ? ({ campus:'Campus', new:'New school' }[p.k] || 'School') + ' · ' + p.pl + ' · ' : '') + p.c + ', ' + p.s;
      el.addEventListener('click', async () => {
        closeSearch();
        $('gvPill').classList.add('has-q'); pillQ.classList.add('set'); pillQ.textContent = p.n;
        if ((p.t === 'school' || p.t === 'schoolx') && !LAYER_ON.has('school')) await toggleLayer('school');
        openPinCard(p, null);
        // "respiratory therapy utah" lands on the program, not just the school
        if (p.t === 'school' || p.t === 'schoolx'){
          const pt = popProgs(p).map(x => x.t).find(t => words.some(w => w.length > 1 && (PROGRAMS[t].short.toLowerCase() === w || PROGRAMS[t].label.toLowerCase().split(/\W+/).includes(w))));
          if (pt) openProgram(p, pt, null);
        }
        map.flyTo({ center:hits[i].geometry.coordinates, zoom:11, duration:dcap(1100) });
      });
    });
  }

  // ── locate ──
  let meMarker = null;
  HUKit.locate($('gvLocate'), {
    onFix: fix => {
      if (!meMarker){
        const dot = document.createElement('div');
        dot.style.cssText = 'width:16px;height:16px;border-radius:50%;background:#4ECDC4;border:3px solid #fff;box-shadow:0 0 0 2px rgba(78,205,196,.4)';
        meMarker = new maplibregl.Marker({ element:dot });
      }
      meMarker.setLngLat([fix.lon, fix.lat]).addTo(map);
      lastFix = [fix.lon, fix.lat];   // lists sort nearest-first and cards carry mileage from here on
      userCam = true;   // the camera is at YOUR location now — no refit steals it
      map.flyTo({ center:[fix.lon, fix.lat], zoom:9, duration:dcap(900) });
      renderList();
    },
    onError: () => { signal('Location unavailable. Pan to your area instead'); signalDone(null, 3000); }
  });

  // ── draw-boundary search (item 9): pencil FAB → freehand loop → the loop
  //    becomes the scope (map grammar #9). Drag disabled while drawing;
  //    release closes the loop; the pencil clears it. ──
  let drawing = false, drawPts = [];
  function drawSrcData(){
    if (drawPts.length < 2 && !drawnPoly) return { type:'FeatureCollection', features: [] };
    const ring = drawnPoly ? drawnPoly.coordinates[0] : [...drawPts, drawPts[0]];
    return { type:'FeatureCollection', features: [
      { type:'Feature', geometry: drawnPoly || { type:'LineString', coordinates: drawPts }, properties:{} },
      ...(drawnPoly ? [] : [{ type:'Feature', geometry:{ type:'LineString', coordinates: ring }, properties:{} }])
    ]};
  }
  function updateDrawLayer(){ const s = map.getSource('gv-draw'); if (s) s.setData(drawSrcData()); }
  function afterScope(){
    refreshSource(); updateCount(); renderList(); syncInsets();
    $('gvDraw').classList.toggle('is-on', !!drawnPoly || drawing);
    $('gvDraw').title = drawnPoly ? 'Clear the drawn area' : 'Draw an area to search';
  }
  function clearDraw(){
    drawnPoly = null; drawPts = []; drawing = false;
    map.dragPan.enable(); map.getCanvas().style.cursor = '';
    updateDrawLayer(); afterScope();
    signalDone(200);
  }
  $('gvDraw').addEventListener('click', () => {
    if (drawnPoly || drawing){ clearDraw(); return; }
    drawing = true; drawPts = [];
    map.dragPan.disable();
    map.getCanvas().style.cursor = 'crosshair';
    $('gvDraw').classList.add('is-on');
    signal('Draw a loop around an area. Release to search it');
  });
  (function wireDraw(){
    const cv = map.getCanvas();
    let last = null;
    cv.addEventListener('pointerdown', e => {
      if (!drawing) return;
      e.preventDefault();
      try { cv.setPointerCapture(e.pointerId); } catch(err){}
      drawPts = []; last = null;
    });
    cv.addEventListener('pointermove', e => {
      if (!drawing || e.buttons === 0) return;
      if (last && Math.hypot(e.clientX - last[0], e.clientY - last[1]) < 5) return;
      last = [e.clientX, e.clientY];
      const r = cv.getBoundingClientRect();
      const ll = map.unproject([e.clientX - r.left, e.clientY - r.top]);
      drawPts.push([ll.lng, ll.lat]);
      updateDrawLayer();
    });
    cv.addEventListener('pointerup', () => {
      if (!drawing) return;
      drawing = false;
      map.dragPan.enable(); cv.style.cursor = '';
      suppressClick = true;              // the release also fires a click — don't let it select a state
      if (drawPts.length >= 3){
        drawnPoly = { type:'Polygon', coordinates: [[...drawPts, drawPts[0]]] };
        updateDrawLayer(); afterScope();
        signalDone(200);
        openList();                      // the payoff: what's inside the loop
      } else clearDraw();
    });
  })();

  // ── AK/HI insets (item 8): two tiny non-interactive cameras, desktop, US zoom only ──
  const INSET_MAPS = [];
  let insetsBuilt = false;
  function buildInsets(){
    if (insetsBuilt || window.innerWidth < 700) return;
    insetsBuilt = true;
    /** @type {Array<[string, [number, number], number, string]>} */ ([['gvInsetAKmap', [-152.5, 63.5], 1.6, 'AK'], ['gvInsetHImap', [-157.4, 20.6], 4.6, 'HI']]).forEach(([el, center, zoom, abbr]) => {
      const m = new maplibregl.Map({ container: $(el), style: styleFor(), center, zoom,
        interactive:false, attributionControl:false });
      INSET_MAPS.push(m);
      $(el).parentElement.addEventListener('click', () => {
        const sf = STATES && STATES.features.find(f => f.properties.abbr === abbr);
        if (sf) selectState(sf);
      });
    });
  }
  function syncInsets(){
    const el = $('gvInsets'); if (!el) return;
    el.classList.toggle('hide', map.getZoom() >= 4.6 || !!selState || !!drawnPoly);
  }

  // ── layers (re-installed after any theme/style switch) ──
  function installData(){
    if (map.getSource('hosp')) return;
    // one ink decision for every runtime layer: white text/lines vanish on the
    // light positron basemap, dark ink vanishes on fiord — computed here, used
    // below, recomputed on every theme swap (installData re-runs after setStyle)
    const light = document.documentElement.getAttribute('data-theme') === 'light';
    const inkMain = light ? '#26333B' : '#D9E7EC';
    const inkHalo = light ? 'rgba(255,255,255,.88)' : 'rgba(5,12,18,.88)';
    // boundary fills + tints ride UNDER the basemap's label layers so city
    // names keep full ink over the county choropleth (David's catch); the
    // facility dots, clusters, and our own labels stay on top as content
    const beforeId = (map.getStyle().layers.find(l => l.type === 'symbol') || {}).id;
    // place labels: defined but SECONDARY — muted ink + halo, so city names
    // read over the tint without competing with counts and facility labels
    map.getStyle().layers.forEach(l => {
      if (l.type !== 'symbol' || !/place|city|town|village|suburb|state/.test(l.id)) return;
      try {
        map.setPaintProperty(l.id, 'text-color', light ? '#5A6B76' : '#9FB1BA');
        map.setPaintProperty(l.id, 'text-halo-color', light ? 'rgba(255,255,255,.9)' : 'rgba(8,16,20,.85)');
        map.setPaintProperty(l.id, 'text-halo-width', 1.3);
      } catch(e){}
    });
    // boundaries under everything: state fill is the US-zoom tap target,
    // county fill is the state-zoom tap target
    if (STATES){
      map.addSource('states', { type:'geojson', data:STATES });
      map.addLayer({ id:'gv-state-fill', type:'fill', source:'states',
        paint:{ 'fill-color':'#4ECDC4', 'fill-opacity':0.03 }}, beforeId);
      map.addLayer({ id:'gv-state-line', type:'line', source:'states',
        paint:{ 'line-color':'rgba(78,205,196,.35)', 'line-width':0.8 }}, beforeId);
      map.addLayer({ id:'gv-state-sel', type:'line', source:'states',
        filter:['==', ['get','fips'], selState ? selState.fips : '___none'],
        paint:{ 'line-color':'#4ECDC4', 'line-width':2.2 }}, beforeId);
    }
    map.addSource('counties', { type:'geojson',
      data: (selState && COUNTY_CACHE.get(selState.fips)) || { type:'FeatureCollection', features:[] } });
    map.addLayer({ id:'gv-county-fill', type:'fill', source:'counties',
      paint:{ 'fill-color':'#4ECDC4', 'fill-opacity':0.04 }}, beforeId);
    map.addLayer({ id:'gv-county-line', type:'line', source:'counties',
      paint:{ 'line-color': light ? 'rgba(27,42,52,.22)' : 'rgba(255,255,255,.16)', 'line-width':0.6 }}, beforeId);
    map.addLayer({ id:'gv-county-self', type:'fill', source:'counties',
      filter:['==', ['get','fips'], selCounty ? selCounty.fips : '___none'],
      paint:{ 'fill-color':'rgba(232,168,56,.13)' }}, beforeId);
    map.addLayer({ id:'gv-county-sel', type:'line', source:'counties',
      filter:['==', ['get','fips'], selCounty ? selCounty.fips : '___none'],
      paint:{ 'line-color':'#E8A838', 'line-width':1.8 }}, beforeId);

    if (ALL.length){
      // the Geo-1 national read: count per state, dead center, over the shaded
      // states. Dots and clusters only exist once you zoom past the country view.
      map.addSource('state-centers', { type:'geojson', data: stateCentersFC() });
      map.addLayer({ id:'gv-state-num', type:'symbol', source:'state-centers', maxzoom:4.6,
        // ONE symbol carries NAME + count — split layers (basemap name, our
        // number) fought in the collision engine and the number won, dropping
        // names for whole states (same fix as the multi-lens map, 07-26)
        layout:{ 'text-field':['format',
            ['get','name'], { 'font-scale':0.72 },
            '\n', {},
            ['to-string',['get','cnt']], {}],
          'text-font':['Noto Sans Bold'],
          'text-size':['interpolate', ['linear'], ['zoom'], 2.8, 11, 4.6, 15], 'text-allow-overlap':false },
        paint:{ 'text-color': light ? '#26333B' : '#fff',
          'text-halo-color': light ? 'rgba(255,255,255,.9)' : 'rgba(8,16,28,.85)', 'text-halo-width':1.8 }});
      clearRings();   // a theme swap rebuilds the source, and its cluster ids with it
      map.addSource('hosp', { type:'geojson', data:{ type:'FeatureCollection', features: activeSet() }, cluster:true,
        clusterMaxZoom: 7, clusterRadius: 30, clusterProperties: ringProps() });
      map.addLayer({ id:'gv-clusters', type:'circle', source:'hosp', filter:['has','point_count'], minzoom:4.6,
        paint:{ 'circle-color':['step',['get','point_count'],'#1B5FA8',25,'#2E86AB',100,'#4ECDC4'],
          'circle-radius':['step',['get','point_count'],14,25,19,100,26],
          // the ring is a marker; the circle stays, clear, as what a tap lands on (and what the router queries)
          'circle-opacity': 0,'circle-stroke-width': 0,
          'circle-stroke-color': light ? 'rgba(13,17,23,.35)' : 'rgba(255,255,255,.7)' }});
      map.addLayer({ id:'gv-cluster-count', type:'symbol', source:'hosp', filter:['has','point_count'], minzoom:4.6,
        layout:{ 'text-field':['get','point_count_abbreviated'], 'text-font':['Noto Sans Bold'], 'text-size':12 },
        // the halo does the work: white-on-teal was ~2:1 on the big clusters
        paint:{ 'text-color':'#fff', 'text-halo-color':'rgba(8,16,28,.8)', 'text-halo-width':1.4, 'text-opacity': 0 }});   // the ring carries the count
      // item 7: shaped, colored icons — a cross IS a hospital, a drop IS dialysis
      installIcons();
      const iconSize = ['interpolate',['linear'],['zoom'],4.6,0.5,8,0.65,11,0.85,14,1.05];
      // the hollow marks: their own source, never clustered or counted, under the real schools, from where the rings
      // break into icons
      map.addSource('school-extra', { type:'geojson', data:{ type:'FeatureCollection', features: extraSet() } });
      map.addLayer({ id:'gv-extra-sel', type:'circle', source:'school-extra', minzoom:7, filter:['==',['get','id'], selectedId || '___none'],
        paint:{ 'circle-radius':13,'circle-color':'rgba(232,168,56,.35)','circle-stroke-width':2.5,'circle-stroke-color':'#E8A838' }});
      map.addLayer({ id:'gv-extra', type:'symbol', source:'school-extra', minzoom:7,
        layout:{ 'icon-image':'ic-schoolx', 'icon-allow-overlap':true, 'icon-ignore-placement':true, 'icon-size':iconSize,
          'icon-anchor':['coalesce', ['get','anc'], 'center'] } });
      map.addLayer({ id:'gv-extra-labels', type:'symbol', source:'school-extra', minzoom:9.5, filter:labelFilter(),
        layout:{ 'text-field':['get','n'], 'text-font':['Noto Sans Regular'], 'text-size':['interpolate', ['linear'], ['zoom'], 9.5, 10, 12.5, 13],
          'text-offset':[0,1.05], 'text-anchor':'top', 'text-max-width':9, 'text-optional':true },
        paint:{ 'text-color':inkMain, 'text-halo-color':inkHalo, 'text-halo-width':1.4 }});
      map.addLayer({ id:'gv-selected', type:'circle', source:'hosp', minzoom:4.6,
        filter:['==',['get','id'], selectedId || '___none'],
        paint:{ 'circle-radius':13,'circle-color':'rgba(232,168,56,.35)','circle-stroke-width':2.5,'circle-stroke-color':'#E8A838' }});
      map.addLayer({ id:'gv-points', type:'symbol', source:'hosp', filter:['!',['has','point_count']], minzoom:4.6,
          layout:{ 'icon-image':iconExpr, 'icon-allow-overlap':true, 'icon-ignore-placement':true, 'icon-size':iconSize } });
      const named = labelFilter(), below = 1.05;
      // dots at distance, NAMES up close, DATA PILLS at street level (grammar #5)
      map.addLayer({ id:'gv-labels', type:'symbol', source:'hosp', filter:named, minzoom:9.5, maxzoom:12.5,
        layout:{ 'text-field':['get','n'], 'text-font':['Noto Sans Regular'],
          'text-size':['interpolate', ['linear'], ['zoom'], 9.5, 10, 12.5, 13],
          'text-offset':[0,below], 'text-anchor':'top', 'text-max-width':9, 'text-optional':true },
        paint:{ 'text-color':inkMain, 'text-halo-color':inkHalo, 'text-halo-width':1.4 }});
      // street level: the label carries the data — stars and beds under the name
      map.addLayer({ id:'gv-labels-rich', type:'symbol', source:'hosp', filter:named, minzoom:12.5,
        layout:{ 'text-field':['format',
            ['get','n'], {},
            '\n', {},
            // a school's second line is its programs; a hospital's, its stars and beds
            ['case', ['==', ['get','t'], 'school'], ['get','pl'], ['concat',
              ['case', ['>', ['to-number',['get','r']], 0], ['concat', ['to-string',['get','r']], '★ · '], ''],
              ['case', ['>', ['to-number',['get','beds']], 0], ['concat', ['to-string',['get','beds']], ' beds'], '']
            ]], { 'font-scale':0.85 }
          ],
          'text-font':['Noto Sans Regular'],
          'text-size':['interpolate', ['linear'], ['zoom'], 12.5, 12, 15, 16],
          'text-offset':[0, 1.0], 'text-anchor':'top', 'text-max-width':9, 'text-optional':true },
        paint:{ 'text-color':inkMain, 'text-halo-color':inkHalo, 'text-halo-width':1.5 }});
    }
    // drawn-loop overlay (amber, above everything)
    if (!map.getSource('gv-draw')){
      map.addSource('gv-draw', { type:'geojson', data: drawSrcData() });
      map.addLayer({ id:'gv-draw-fill', type:'fill', source:'gv-draw', paint:{ 'fill-color':'rgba(232,168,56,.08)' }});
      map.addLayer({ id:'gv-draw-line', type:'line', source:'gv-draw', paint:{ 'line-color':'#E8A838', 'line-width':2, 'line-dasharray':[2,1.5] }});
    }
    wireRouter();
    applyCountyTint();   // theme switches re-add layers — restore any active tint
    applyStateTint();
    applyLabelPrefs();   // saved label toggles survive boot AND theme swaps
  }

  // ── ONE click router owns priority: pin > cluster > county > state ──
  let routerWired = false, suppressClick = false;
  function wireRouter(){
    if (routerWired) return; routerWired = true;
    map.on('click', async e => {
      if (drawing || suppressClick){ suppressClick = false; return; }
      const order = ['gv-points','gv-extra','gv-clusters','gv-county-fill','gv-state-fill'].filter(l => map.getLayer(l));
      if (!order.length) return;
      const hits = map.queryRenderedFeatures(e.point, { layers:order });
      if (!hits.length){
        if (sheetEl.classList.contains('open') && mode === 'card' && !backTo) closeSheet();
        return;
      }
      hits.sort((a,b) => order.indexOf(a.layer.id) - order.indexOf(b.layer.id));
      const top = hits[0];
      if (top.layer.id === 'gv-points'){ openPinCard(top.properties, null); return; }
      if (top.layer.id === 'gv-extra'){ openExtra(top.properties, null); return; }
      if (top.layer.id === 'gv-clusters'){
        const zoom = await map.getSource('hosp').getClusterExpansionZoom(top.properties.cluster_id);
        map.easeTo({ center:top.geometry.coordinates, zoom:zoom + 0.3, duration:dcap(650) });
        return;
      }
      if (top.layer.id === 'gv-county-fill'){
        // county taps only count inside the selected state (its counties are the loaded ones)
        selectCounty(top); return;
      }
      // state fill: select, or re-select a different state
      const sf = STATES.features.find(x => x.properties.fips === top.properties.fips);
      if (sf) selectState(sf);
    });
    ['gv-points','gv-extra','gv-clusters','gv-county-fill','gv-state-fill'].forEach(l => {
      map.on('mouseenter', l, () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', l, () => { map.getCanvas().style.cursor = ''; });
    });
    // desktop hover card (fine pointers only) — the phone answer stays tap→sheet
    const FINE = matchMedia('(hover:hover) and (pointer:fine)');
    const tipEl = $('gvTip');
    map.on('mousemove', 'gv-points', e => {
      if (!FINE.matches || !tipEl || !e.features.length) return;
      const p = e.features[0].properties;
      tipEl.querySelector('.tn').textContent = p.n;
      tipEl.querySelector('.ts').innerHTML = '';
      const ts = tipEl.querySelector('.ts');
      ts.appendChild(document.createTextNode((p.t === 'school' ? 'School · ' + p.pl + ' · ' : '') + p.c + ', ' + p.s + (p.t === 'school' ? ' · ' + gradsText(+p.g) : '')));
      if (+p.r){ const st = document.createElement('span'); st.className = 'st'; st.textContent = ' ' + '★'.repeat(+p.r); ts.appendChild(st); }
      if (+p.beds) ts.appendChild(document.createTextNode(' · ' + Number(p.beds).toLocaleString('en-US') + ' beds'));
      const cw = map.getContainer().clientWidth;
      tipEl.style.display = 'block';
      const tw = tipEl.offsetWidth || 200;
      tipEl.style.left = Math.min(e.point.x + 14, cw - tw - 8) + 'px';
      tipEl.style.top = Math.max(8, e.point.y - 14 - tipEl.offsetHeight) + 'px';
    });
    map.on('mouseleave', 'gv-points', () => { if (tipEl) tipEl.style.display = 'none'; });
    map.on('mousemove', 'gv-extra', e => {
      if (!FINE.matches || !tipEl || !e.features.length) return;
      const p = e.features[0].properties;
      tipEl.querySelector('.tn').textContent = p.n;
      tipEl.querySelector('.ts').textContent = ({ campus:'Campus', new:'New school', outside:'School, not in the federal data' }[p.k] || 'School') + ' · ' + p.pl + ' · ' + p.c + ', ' + p.s;
      const cw = map.getContainer().clientWidth;
      tipEl.style.display = 'block';
      const tw = tipEl.offsetWidth || 200;
      tipEl.style.left = Math.min(e.point.x + 14, cw - tw - 8) + 'px';
      tipEl.style.top = Math.max(8, e.point.y - 14 - tipEl.offsetHeight) + 'px';
    });
    map.on('mouseleave', 'gv-extra', () => { if (tipEl) tipEl.style.display = 'none'; });
    // US-zoom state hover: the total broken out per layer, colored dots and all
    let hovAbbr = null;
    map.on('mousemove', 'gv-state-fill', e => {
      if (!FINE.matches || !tipEl || map.getZoom() >= 4.6 || !e.features.length) return;
      const abbr = e.features[0].properties.abbr;
      if (abbr !== hovAbbr){
        hovAbbr = abbr;
        const inSt = activeSet().filter(f => f.properties.s === abbr);
        const per = {};
        inSt.forEach(f => { const k = layerOf(f.properties.t); if (k) per[k] = (per[k] || 0) + 1; });
        const sf = STATES.features.find(x => x.properties.abbr === abbr);
        tipEl.querySelector('.tn').textContent = (sf ? sf.properties.name : abbr) + ' · ' + inSt.length.toLocaleString('en-US');
        const ts = tipEl.querySelector('.ts');
        ts.innerHTML = '';
        const parts = Object.keys(DATASETS).map(k => [LAYER_COLORS[k] || '#4ECDC4', DATASETS[k].label, per[k] || 0]);
        parts.filter(x => x[2]).forEach(([color, label, n]) => {
          const row = document.createElement('span');
          row.style.cssText = 'display:flex;align-items:center;gap:5px;margin-top:2px';
          const dot = document.createElement('i');
          dot.style.cssText = 'width:8px;height:8px;border-radius:50%;background:' + color;
          row.appendChild(dot);
          row.appendChild(document.createTextNode(label + '  ' + n.toLocaleString('en-US')));
          ts.appendChild(row);
        });
      }
      const cw = map.getContainer().clientWidth;
      tipEl.style.display = 'block';
      const tw = tipEl.offsetWidth || 200;
      tipEl.style.left = Math.min(e.point.x + 14, cw - tw - 8) + 'px';
      tipEl.style.top = Math.max(8, e.point.y - 14 - tipEl.offsetHeight) + 'px';
    });
    map.on('mouseleave', 'gv-state-fill', () => { hovAbbr = null; if (tipEl && map.getZoom() < 4.6) tipEl.style.display = 'none'; });
    map.on('click', () => { if (tipEl) tipEl.style.display = 'none'; hovAbbr = null; });
  }

  // gestures: pan drops the card to peek; viewport work is debounced so a
  // pan-pan-pan sequence runs the scans once, not per settle
  map.on('dragstart', () => { if (HUKit.phone() && sheetEl.classList.contains('open') && mode === 'card') setDetQuiet('dt-peek'); });
  let mvT = 0;
  map.on('sourcedata', e => { if (e.sourceId === 'hosp' && e.isSourceLoaded) updateRings(); });
  map.on('zoomend', clearRings);   // the clusters change with the zoom; moveend rebuilds them
  map.on('zoomend', () => {
    if (popMarker && popStep && popStep.anc && popStep.anc !== 'center') popMarker.setOffset(stepOf(popStep));
    if (selectedId && /^x|^u/.test(selectedId) && map.getLayer('gv-extra-sel')) selectMark(selectedId);
  });
  map.on('moveend', () => {
    updateRings();
    clearTimeout(mvT);
    mvT = window.setTimeout(() => { if (ALL.length){ updateCount(); renderList(); syncInsets(); } }, 120);
  });

  // theme toggle → swap basemap, re-install layers (listeners survive; wired once)
  // theme swap: force a FULL style reload (diff mode can strand runtime layers),
  // reinstall only once the style is truly ready (style.load can misfire across
  // different styles), and re-theme the insets AFTER the main map settles so
  // three GL style swaps never land in the same frames (the freeze David hit)
  let themeSwapping = false;
  new MutationObserver(() => {
    if (themeSwapping) return;
    themeSwapping = true;
    map.setStyle(styleFor(), { diff:false });
    const reinstall = () => {
      if (!map.isStyleLoaded()){ setTimeout(reinstall, 120); return; }
      installData();
      refreshSource();
      syncBoundaryPaint();
      updateDrawLayer();
      themeSwapping = false;
      map.once('idle', () => INSET_MAPS.forEach(m => m.setStyle(styleFor(), { diff:false })));
    };
    setTimeout(reinstall, 120);
  }).observe(document.documentElement, { attributes:true, attributeFilter:['data-theme'] });

  // ── boot: basemap first, then boundaries + hospitals in parallel, signaled ──
  map.on('load', async () => {
    signal('Loading hospitals + state lines…');
    try {
      const [hosp, states] = await Promise.all([
        fetch('/assets/data/us-hospitals.json').then(r => r.json()),
        fetch('/assets/data/geo/us-states.json?v=2').then(r => r.json())   // v2: per-state camera-safe bb baked in (busts any cached bb-less copy)
      ]);
      ALL = toFeatures(hosp.hospitals || hosp.facilities || []);
      STATES = states;
      dropFilterCache();   // the memo may have cached the pre-data empty list
    } catch(e){ signal("Couldn't load the map data"); return; }
    installData();
    buildDisplayPanel();
    pillFaces();
    buildInsets();
    syncInsets();
    pillCount();
    updateCount();
    $('gvListBtn').hidden = false;
    // a shared link has already chosen the state, system or facility, so it is not told to tap a state
    signalDone('✓ ' + ALL.length.toLocaleString('en-US') + ' hospitals' + (location.search ? '' : ' · tap a state to zoom in'), 2600);
    await applyURLState();   // shared links restore scope: ?ds=&types=&state=&county=&sys=
    urlCtl.mark(scopeKey());   // the first drill after load must PUSH, not replace
    applyStateTint();
    // enrichment rides in quietly behind the map; open cards fill in when it lands
    // County values and populations are NOT fetched here: 724KB + 63KB that the
    // national view never reads. ensureCountyData() pulls them the first time a
    // county actually matters (a state drill, a tint, or an open card).
    // POS enrichment rides in AFTER the map settles (538KB, never boot-blocking);
    // an open pin card fills in the moment it lands. Hospitals only: the schools page has no use for either file.
    setTimeout(() => fetch('/assets/data/hospital-enrich.json').then(r => r.json()).then(d => {
      ENRICH = d;
      if (mode !== 'card') return;
      if (selectedId){ const f = ALL.find(x => x.properties.id === selectedId); if (f) openPinCard(f.properties, backTo); }
      else if (activeSystem) openSystemCard();   // the "Outside a metro area" row
    }).catch(() => {}), 2500);
    // the cost reports ride in beside it (about 300KB, never boot-blocking); an open hospital or system card fills in
    setTimeout(() => fetch('/assets/data/us-hospital-cost-reports.json').then(r => r.json()).then(d => {
      HCR = d;
      if (mode !== 'card') return;
      if (selectedId){ const f = ALL.find(x => x.properties.id === selectedId); if (f) openPinCard(f.properties, backTo); }
      else if (activeSystem) openSystemCard();
    }).catch(() => {}), 2500);
  });
  map.on('error', ev => {
    if (!map.loaded()){ signal('Basemap failed to load. Check the connection'); }
    if (ev && ev.error) console.warn('maplibre', ev.error);
  });
})();
