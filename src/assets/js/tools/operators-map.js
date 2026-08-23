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

  const TYPES = {
    acute: { label:'Acute care',      color:'#FF6B6B' },
    cah:   { label:'Critical access', color:'#E8C547' },
    psych: { label:'Psychiatric',     color:'#5B9BD5' },
    va:    { label:'VA',              color:'#7FE3A0' },
    child: { label:"Children's",      color:'#D77BD6' },
    rural: { label:'Rural emergency', color:'#F2A65A' },
    dod:   { label:'Military',        color:'#9FB0C4' },
    ltac:  { label:'Long-term acute', color:'#4ECDC4' }
  };
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
    pentagon: (c,s) => { for (let i = 0; i < 5; i++){ const a = -Math.PI/2 + i*2*Math.PI/5; const x = Math.cos(a)*s/2, y = Math.sin(a)*s/2; i ? c.lineTo(x,y) : c.moveTo(x,y); } c.closePath(); }
  };
  const ICONS = {
    acute:'cross', cah:'triangle', psych:'hexagon', va:'star', child:'heart', rural:'triangleDown', dod:'shield', ltac:'circle',
    dialysis:'drop', dial:'drop', asc:'diamond', pharmacy:'pill', pharm:'pill', dme:'square', optical:'ring', orthotics:'pentagon', ortho:'pentagon'
  };
  const iconColorOf = t => (TYPES[t] && TYPES[t].color) || ({ dialysis:'#B07BD6', dial:'#B07BD6', asc:'#35C7E8', pharmacy:'#A3E635', pharm:'#A3E635', dme:'#C69A6D', optical:'#E8E8F0', orthotics:'#FF9E7D', ortho:'#FF9E7D' }[t]) || '#4ECDC4';
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
  }
  const iconExpr = ['match', ['get','t'], ...Object.keys(ICONS).flatMap(t => [t, 'ic-' + t]), 'ic-ltac'];

  const map = new maplibregl.Map({
    container:'gvMap', style: styleFor(),
    center:[-96.5,39.3], zoom:3.6, minZoom:2.8, maxZoom:15,
    renderWorldCopies:false,
    attributionControl:false
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
  const DATASETS = {
    hosp:    { label:'Hospitals',       noun:'hospitals' },
    dial:    { label:'Dialysis',        noun:'dialysis centers',    file:'/assets/data/us-dialysis.json' },
    asc:     { label:'Surgery centers', noun:'surgery centers',     file:'/assets/data/us-ascs.json' },
    pharm:   { label:'Pharmacies',      noun:'pharmacies',          shard:'pharmacy' },
    dme:     { label:'Home equipment',  noun:'equipment suppliers', file:'/assets/data/us-suppliers-dme.json' },
    optical: { label:'Optical',         noun:'optical suppliers',   file:'/assets/data/us-suppliers-optical.json' },
    ortho:   { label:'Orthotics',       noun:'orthotics suppliers', file:'/assets/data/us-suppliers-orthotics-prosthetics.json' }
  };
  // LAYERS, not modes (David's call): every dataset is a toggle, all can ride
  // at once, each non-hospital layer wears its own color. Hospitals keep the
  // type palette and the type chips.
  const LAYER_COLORS = { dial:'#B07BD6', asc:'#35C7E8', pharm:'#A3E635', dme:'#C69A6D', optical:'#E8E8F0', ortho:'#FF9E7D' };
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
      else if (WHOLE_CACHE[k]) out.push(...WHOLE_CACHE[k]);
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
  const NOUN = () => LAYER_ON.size === 1 ? DATASETS[[...LAYER_ON][0]].noun : 'facilities';
  const toFeatures = (list, dsKey) => list.filter(h => h.lo != null && h.la != null).map(h => ({
    type:'Feature',
    geometry:{ type:'Point', coordinates:[h.lo, h.la] },
    properties:{ id:h.id, n:tcase(h.n), c:tcase(h.c), s:h.s, t:h.t || dsKey, r:h.r || 0, beds:h.beds || 0,
      st:h.st || 0, trauma:h.trauma || '', sys:h.sys || '', od:h.od || '', e:h.e ? 1 : 0 }
  }));
  async function loadWhole(ds){
    if (WHOLE_CACHE[ds]) return;
    const D = DATASETS[ds];
    signal('Loading ' + D.noun + '…');
    try {
      const j = await fetch(D.file).then(r => r.json());
      WHOLE_CACHE[ds] = toFeatures(j.facilities || j.hospitals || [], ds);
      signalDone('✓ ' + WHOLE_CACHE[ds].length.toLocaleString('en-US') + ' ' + D.noun + ' · live CMS data');
    } catch(e){ WHOLE_CACHE[ds] = []; signalDone("Couldn't load " + D.noun, 2400); }
  }
  // feature type code → owning layer key (t codes vary per source file)
  const layerOf = t => TYPES[t] ? 'hosp'
    : ({ dialysis:'dial', dial:'dial', asc:'asc', pharmacy:'pharm', pharm:'pharm',
         dme:'dme', optical:'optical', orthotics:'ortho', ortho:'ortho' }[t] || null);
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
    if (src) src.setData({ type:'FeatureCollection', features: scopedSet() });   // a drawn loop hides everything outside it, Zillow-style
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
  // (the Pop Health Multi-Lens county grain, previewed on this stack)
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
  const fitPad = () => {
    const short = HUKit.phone() || window.innerHeight < 500;
    const top = short ? 130 : 130;
    const bottom = short ? 212 : 150;
    const side = short ? 20 : 28;
    const shell = document.querySelector('.gv-shell');
    const h = shell ? shell.clientHeight : window.innerHeight;
    const k = Math.min(1, Math.max(0, (h - 60) / (top + bottom)));
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
  function fitScope(b, z, dur){ lastCam = { b, z }; userCam = false; map.fitBounds(b, { padding:fitPad(), maxZoom:z, duration:dcap(dur) }); }
  function refitScope(){ if (lastCam) map.fitBounds(lastCam.b, { padding:fitPad(), maxZoom:lastCam.z, duration:dcap(600) }); }
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
    selectedId = null;
    if (map.getLayer('gv-selected')) map.setFilter('gv-selected', ['==', ['get','id'], '___none']);
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
        '<div class="rs"><i style="background:' + (T.color||'#4ECDC4') + '"></i><span>' + p.c + ', ' + p.s + '</span>' +
        (+p.r ? '<span class="st">' + '★'.repeat(+p.r) + '</span>' : '') +
        (+p.beds ? '<span>' + Number(p.beds).toLocaleString('en-US') + ' beds</span>' : '') + '</div></button>';
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
      if (e.ms) rows.push(['Teaching', ['', 'Major', 'Limited', 'Graduate'][e.ms] + ' med-school affiliation' + (e.res ? ' · ' + e.res + ' residents' : ''), 1]);
      else if (e.res) rows.push(['Residents', String(e.res)]);
      if (e.or) rows.push(['Operating rooms', String(e.or)]);
      if (e.cathrm) rows.push(['Cath lab rooms', String(e.cathrm)]);
      if (e.psyb) rows.push(['Psych unit beds', String(e.psyb)]);
      if (e.rehb) rows.push(['Rehab unit beds', String(e.rehb)]);
      // RN/RT staffing counts stay in the FILE but off the CARD: the POS
      // staffing block is self-reported and provably stale for ~7% of
      // hospitals (McKay-Dee says 58 RNs for 321 beds; Rush says 24 RTs
      // for 715 beds) with no per-record freshness signal. HCRIS cost
      // reports are the audited staffing source — that's a future pull.
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
  // ── pin card ──
  function openPinCard(p, from){
    mode = 'card'; backTo = from || null;
    selectedId = p.id;
    const T = TYPES[p.t] || {};
    const feat = ALL.find(x => x.properties.id === p.id);
    const mi = feat ? milesTo(feat.geometry.coordinates) : null;
    const b = cardScaffold(T.label || ({ pharmacy:'Pharmacy', dialysis:'Dialysis center', asc:'Surgery center' }[p.t] || 'Facility'), p.n,
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
    if (backTo){
      const back = document.createElement('button');
      back.className = 'gv-tolist'; back.type = 'button';
      back.textContent = backTo === 'list' ? '← Back to list' : backTo === 'county' ? '← Back to county' : backTo === 'system' ? '← Back to system' : '← Back';
      back.addEventListener('click', () => $('gvSheetX').click());
      b.appendChild(back);
    }
    if (map.getLayer('gv-selected')) map.setFilter('gv-selected', ['==', ['get','id'], p.id]);
    sheetEl.classList.add('open');
    setDetQuiet('dt-peek');   // pin cards ALWAYS land at peek — the map is the payoff
    announce(p.n + '. ' + p.c + ', ' + p.s + '.');
    syncURL();   // ?fac= rides the entry — facility views are shareable now
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
      if (selState){ refreshSource(); updateCount(); if (mode === 'card' && !selCounty && !selectedId) openStateCard(); }
    }
    syncURL();
  }
  function openStateCard(){
    if (!selState) return;
    mode = 'card'; backTo = null;
    const hs = inState(selState.abbr);
    const beds = hs.reduce((a,f) => a + (+f.properties.beds || 0), 0);
    const pop = statePop(selState.fips);
    const b = cardScaffold('State', selState.name, hs.length + ' ' + NOUN() + (activeTypes && LAYER_ON.has('hosp') ? ' (filtered)' : '') + ' · tap a county for its profile');
    // phone: the peek sheet must carry the answer — the count rides the name row
    const pv = document.createElement('span');
    pv.className = 'pv'; pv.textContent = hs.length.toLocaleString('en-US');
    b.querySelector('.gv-card-name').appendChild(pv);
    const stats = [{ v:hs.length.toLocaleString('en-US'), k: LAYER_ON.size === 1 ? DATASETS[[...LAYER_ON][0]].label : 'Facilities' }];
    if (beds > 0){
      stats.push({ v:beds.toLocaleString('en-US'), k:'Beds' });
      const st = avgStar(hs); if (st) stats.push({ v:st + '★', k:'Avg CMS', cls:' hi' });
    } else if (pop && hs.length){
      stats.push({ v:(hs.length * 10000 / pop).toFixed(1), k:'Per 10k residents' });
    }
    statTiles(b, stats);
    const ex = b.querySelector('.gv-extra');
    const facts = [
      ['Population', pop ? fmtPop(pop) : null],
      beds > 0 ? ['Beds per 1,000', pop ? (beds * 1000 / pop).toFixed(1) : null] : null
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
    hospRows(ex, hs.slice().sort((a,b2) => (+b2.properties.beds||0) - (+a.properties.beds||0)), 3, 'state');
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
    map.flyTo({ center:[-96.5,39.3], zoom:3.6, duration:dcap(900) });
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
    const b = cardScaffold('County · ' + selState.abbr, selCounty.name + ' County',
      hs.length + ' ' + (hs.length === 1 ? NOUN().replace(/ies$/,'y').replace(/als$/,'al').replace(/([^s])s$/,'$1') : NOUN()) + (activeTypes && LAYER_ON.has('hosp') ? ' (filtered)' : ''));
    const stats = [{ v:hs.length.toLocaleString('en-US'), k: LAYER_ON.size === 1 ? DATASETS[[...LAYER_ON][0]].label : 'Facilities' }];
    if (beds > 0){
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
    factsBlock(ex, cfacts);
    if (hs.length) hospRows(ex, hs.slice().sort((a,b2) => (+b2.properties.beds||0) - (+a.properties.beds||0)), 3, 'county');
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
    else { lastCam = null; map.flyTo({ center:[-96.5,39.3], zoom:3.6, duration:dcap(900) }); }
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
    if (selState) p.set('state', selState.abbr);
    if (selCounty) p.set('county', selCounty.fips);
    if (activeSystem) p.set('sys', activeSystem);
    if (selectedId) p.set('fac', selectedId);   // shareable facility views (replace-only: pins never stack history)
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
        map.flyTo({ center:[-96.5,39.3], zoom:3.6, duration:dcap(900) });
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
        if (ks.length){ activeTypes = new Set(ks); dropFilterCache(); buildDisplayPanel(); pillFaces(); refreshSource(); }
      }
      const lay = p.get('layers') || (p.get('ds') && DATASETS[p.get('ds')] ? p.get('ds') : null);
      if (lay){
        const ks = lay.split(',').filter(k => DATASETS[k]);
        for (const k of ks) if (!LAYER_ON.has(k)) await toggleLayer(k);
        if (ks.length && !ks.includes('hosp') && LAYER_ON.has('hosp')) await toggleLayer('hosp');
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
        const f = activeSet().find(x => x.properties.id === fac) || ALL.find(x => x.properties.id === fac);
        if (f){ openPinCard(f.properties, null); map.flyTo({ center:f.geometry.coordinates, zoom:11, duration:0 }); }
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
  function updateScopeChip(){
    const sc = $('gvScope'); if (!sc) return;
    if (activeSystem){ sc.hidden = false; sc.textContent = '◀ Exit system'; sc.title = 'Back to all hospitals'; sc.setAttribute('aria-label', sc.title); return; }
    if (!selState){ sc.hidden = true; return; }
    sc.hidden = false;
    sc.textContent = selCounty ? '◀ ' + selState.name : '◀ United States';
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
    renderList();
    const det = revealDetent();
    sheetEl.classList.add('open');
    setDetQuiet(det);
  }
  function renderList(){
    if (mode !== 'list' || !sheetEl.classList.contains('open')) return;
    // located users get the Zillow sort: nearest first, with mileage on every row
    const rows = inView().slice().sort(lastFix
      ? (a,b) => milesTo(a.geometry.coordinates) - milesTo(b.geometry.coordinates)
      : (a,b) => (+b.properties.beds||0) - (+a.properties.beds||0));
    const cap = rows.slice(0, 80);
    let h = '<div class="gv-list-h">' + rows.length.toLocaleString('en-US') + (drawnPoly ? ' in your drawn area' : ' in view') + ' · ' + (lastFix ? 'nearest first' : 'biggest first') + '</div><div class="gv-rows">';
    h += cap.map((f,i) => {
      const p = f.properties, T = TYPES[p.t] || {};
      const mi = milesTo(f.geometry.coordinates);
      return '<button class="gv-row" type="button" data-i="' + i + '"><div class="rn"></div>' +
        '<div class="rs"><i style="background:' + (T.color||'#4ECDC4') + '"></i><span>' + p.c + ', ' + p.s + '</span>' +
        (mi != null ? '<span>' + mi.toFixed(1) + ' mi</span>' : '') +
        (+p.r ? '<span class="st">' + '★'.repeat(+p.r) + '</span>' : '') +
        (+p.beds ? '<span>' + Number(p.beds).toLocaleString('en-US') + ' beds</span>' : '') + '</div></button>';
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
      h += '<div class="gv-dsec"><h5>Hospital types <span class="sub">only = solo</span></h5><div class="gv-drow">' +
        '<button class="hu-chip tchip' + (!activeTypes ? ' on' : '') + '" type="button" data-t="__all">All types</button>' +
        Object.entries(TYPES).map(([k,v]) =>
          '<button class="hu-chip tchip' + (activeTypes && activeTypes.has(k) ? ' on' : '') + '" type="button" data-t="' + k + '"><i style="background:' + v.color + '"></i>' + v.label + '<b class="cnt"></b><span class="gv-only" data-only="' + k + '">only</span></button>').join('') + '</div></div>';
    }
    if (CDATA){
      h += '<div class="gv-dsec"><h5>Shade counties by <span class="sub">county tint</span></h5><div class="gv-drow">' +
        '<button class="hu-chip' + (!countyMetric ? ' on' : '') + '" type="button" data-m="">Plain</button>' +
        Object.entries(CMETRICS).map(([k,m]) =>
          '<button class="hu-chip' + (countyMetric === k ? ' on' : '') + '" type="button" data-m="' + k + '">' + m.label + '</button>').join('') + '</div></div>';
    }
    h += '<div class="gv-dsec"><h5>Map labels <span class="sub">basemap text</span></h5>' +
      '<div class="gv-tgl">State names <span class="gv-sw' + (p.state ? ' on' : '') + '" id="gvLabState" role="switch" aria-checked="' + p.state + '" tabindex="0"></span></div>' +
      '<div class="gv-tgl">City names <span class="gv-sw' + (p.city ? ' on' : '') + '" id="gvLabCity" role="switch" aria-checked="' + p.city + '" tabindex="0"></span></div></div>';
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
  $('gvDisplayPill').addEventListener('click', openDisplayTab);
  async function toggleLayer(ds){
    if (LAYER_ON.has(ds)){
      if (LAYER_ON.size === 1) return;   // never an empty map
      LAYER_ON.delete(ds);
      if (ds === 'hosp') activeSystem = null;
    } else {
      LAYER_ON.add(ds);
      if (DATASETS[ds].shard){
        if (selState) await loadPharm(selState.abbr);
        else { signal(DATASETS[ds].label + ' load per state. Tap a state'); signalDone(null, 3200); }
      } else if (DATASETS[ds].file) await loadWhole(ds);
    }
    buildDisplayPanel(); pillFaces();
    if (!$('gvPill').classList.contains('has-q'))
      pillQ.textContent = 'Search ' + activeSet().length.toLocaleString('en-US') + ' ' + NOUN() + '…';
    applyStateTint();
    refreshSource(); updateStateNums(); updateCount(); renderList();
    if (selCounty) openCountyCard();
    else if (selState && sheetEl.classList.contains('open') && mode === 'card' && !selectedId) openStateCard();
    updateScopeChip(); syncURL();
    announce(DATASETS[ds].label + (LAYER_ON.has(ds) ? ' layer on. ' : ' layer off. ') + activeSet().length.toLocaleString('en-US') + ' facilities shown.');
  }
  function applyFilters(){
    if (!map.getSource('hosp')) return;
    refreshSource();
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
  }

  // ── search ──
  const pillQ = $('gvPillQ');
  function openSearch(){ $('gvSearch').classList.add('open'); $('gvSearchIn').focus(); buildResults(); }
  function closeSearch(){ $('gvSearch').classList.remove('open'); const pb=$('gvPill'); if (pb) pb.focus(); }
  $('gvPill').addEventListener('click', () => openSearch());
  $('gvPillClr').addEventListener('click', () => {
    $('gvPill').classList.remove('has-q'); pillQ.classList.remove('set');
    pillQ.textContent = 'Search ' + ALL.length.toLocaleString('en-US') + ' hospitals…';
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
        : 'Name, city, state, or system. "children denver", "intermountain", "santa fe"…') + '</div>';
      return;
    }
    const hits = activeSet().filter(f => {
      const p = f.properties;
      return (p.n + ' ' + p.c + ' ' + p.s + ' ' + (p.sys||'')).toLowerCase().includes(q);
    }).slice(0, 20);
    if (!hits.length){ host.innerHTML = '<div class="gv-none">No matches in the current filters.</div>'; return; }
    host.innerHTML = hits.map((f,i) =>
      '<button class="pop-opt" type="button" data-i="' + i + '"><span class="rn"></span><span class="gv-sr-meta"></span></button>').join('');
    host.querySelectorAll('.pop-opt').forEach((el,i) => {
      const p = hits[i].properties;
      el.querySelector('.rn').textContent = p.n;
      el.querySelector('.gv-sr-meta').textContent = p.c + ', ' + p.s;
      el.addEventListener('click', () => {
        closeSearch();
        $('gvPill').classList.add('has-q'); pillQ.classList.add('set'); pillQ.textContent = p.n;
        openPinCard(p, null);
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
      map.addSource('hosp', { type:'geojson', data:{ type:'FeatureCollection', features: activeSet() }, cluster:true, clusterMaxZoom:10, clusterRadius:46 });
      map.addLayer({ id:'gv-clusters', type:'circle', source:'hosp', filter:['has','point_count'], minzoom:4.6,
        paint:{ 'circle-color':['step',['get','point_count'],'#1B5FA8',25,'#2E86AB',100,'#4ECDC4'],
          'circle-radius':['step',['get','point_count'],14,25,19,100,26],
          'circle-opacity':0.85,'circle-stroke-width':2,
          'circle-stroke-color': light ? 'rgba(13,17,23,.35)' : 'rgba(255,255,255,.7)' }});
      map.addLayer({ id:'gv-cluster-count', type:'symbol', source:'hosp', filter:['has','point_count'], minzoom:4.6,
        layout:{ 'text-field':['get','point_count_abbreviated'], 'text-font':['Noto Sans Bold'], 'text-size':12 },
        // the halo does the work: white-on-teal was ~2:1 on the big clusters
        paint:{ 'text-color':'#fff', 'text-halo-color':'rgba(8,16,28,.8)', 'text-halo-width':1.4 }});
      map.addLayer({ id:'gv-selected', type:'circle', source:'hosp', minzoom:4.6,
        filter:['==',['get','id'], selectedId || '___none'],
        paint:{ 'circle-radius':13,'circle-color':'rgba(232,168,56,.35)','circle-stroke-width':2.5,'circle-stroke-color':'#E8A838' }});
      // item 7: shaped, colored icons — a cross IS a hospital, a drop IS dialysis
      installIcons();
      map.addLayer({ id:'gv-points', type:'symbol', source:'hosp', filter:['!',['has','point_count']], minzoom:4.6,
        layout:{ 'icon-image':iconExpr, 'icon-allow-overlap':true, 'icon-ignore-placement':true,
          'icon-size':['interpolate',['linear'],['zoom'],4.6,0.5,8,0.65,11,0.85,14,1.05] }});
      // dots at distance, NAMES up close, DATA PILLS at street level (grammar #5)
      map.addLayer({ id:'gv-labels', type:'symbol', source:'hosp', filter:['!',['has','point_count']], minzoom:9.5, maxzoom:12.5,
        layout:{ 'text-field':['get','n'], 'text-font':['Noto Sans Regular'],
          'text-size':['interpolate', ['linear'], ['zoom'], 9.5, 10, 12.5, 13],
          'text-offset':[0,1.05], 'text-anchor':'top', 'text-max-width':9, 'text-optional':true },
        paint:{ 'text-color':inkMain, 'text-halo-color':inkHalo, 'text-halo-width':1.4 }});
      // street level: the label carries the data — stars and beds under the name
      map.addLayer({ id:'gv-labels-rich', type:'symbol', source:'hosp', filter:['!',['has','point_count']], minzoom:12.5,
        layout:{ 'text-field':['format',
            ['get','n'], {},
            '\n', {},
            ['concat',
              ['case', ['>', ['to-number',['get','r']], 0], ['concat', ['to-string',['get','r']], '★ · '], ''],
              ['case', ['>', ['to-number',['get','beds']], 0], ['concat', ['to-string',['get','beds']], ' beds'], '']
            ], { 'font-scale':0.85 }
          ],
          'text-font':['Noto Sans Regular'],
          'text-size':['interpolate', ['linear'], ['zoom'], 12.5, 12, 15, 16],
          'text-offset':[0,1.0], 'text-anchor':'top', 'text-max-width':9, 'text-optional':true },
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
      const order = ['gv-points','gv-clusters','gv-county-fill','gv-state-fill'].filter(l => map.getLayer(l));
      if (!order.length) return;
      const hits = map.queryRenderedFeatures(e.point, { layers:order });
      if (!hits.length){
        if (sheetEl.classList.contains('open') && mode === 'card' && !backTo) closeSheet();
        return;
      }
      hits.sort((a,b) => order.indexOf(a.layer.id) - order.indexOf(b.layer.id));
      const top = hits[0];
      if (top.layer.id === 'gv-points'){ openPinCard(top.properties, null); return; }
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
    ['gv-points','gv-clusters','gv-county-fill','gv-state-fill'].forEach(l => {
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
      ts.appendChild(document.createTextNode(p.c + ', ' + p.s));
      if (+p.r){ const st = document.createElement('span'); st.className = 'st'; st.textContent = ' ' + '★'.repeat(+p.r); ts.appendChild(st); }
      if (+p.beds) ts.appendChild(document.createTextNode(' · ' + Number(p.beds).toLocaleString('en-US') + ' beds'));
      const cw = map.getContainer().clientWidth;
      tipEl.style.display = 'block';
      const tw = tipEl.offsetWidth || 200;
      tipEl.style.left = Math.min(e.point.x + 14, cw - tw - 8) + 'px';
      tipEl.style.top = Math.max(8, e.point.y - 14 - tipEl.offsetHeight) + 'px';
    });
    map.on('mouseleave', 'gv-points', () => { if (tipEl) tipEl.style.display = 'none'; });
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
        Object.keys(DATASETS).filter(k => per[k]).forEach(k => {
          const row = document.createElement('span');
          row.style.cssText = 'display:flex;align-items:center;gap:5px;margin-top:2px';
          const dot = document.createElement('i');
          dot.style.cssText = 'width:8px;height:8px;border-radius:50%;background:' + (LAYER_COLORS[k] || '#4ECDC4');
          row.appendChild(dot);
          row.appendChild(document.createTextNode(DATASETS[k].label + '  ' + per[k].toLocaleString('en-US')));
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
  map.on('moveend', () => {
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
    pillQ.textContent = 'Search ' + ALL.length.toLocaleString('en-US') + ' hospitals…';
    updateCount();
    $('gvListBtn').hidden = false;
    signalDone('✓ ' + ALL.length.toLocaleString('en-US') + ' hospitals · tap a state to zoom in', 2600);
    await applyURLState();   // shared links restore scope: ?ds=&types=&state=&county=&sys=
    urlCtl.mark(scopeKey());   // the first drill after load must PUSH, not replace
    applyStateTint();
    // enrichment rides in quietly behind the map; open cards fill in when it lands
    // County values and populations are NOT fetched here: 724KB + 63KB that the
    // national view never reads. ensureCountyData() pulls them the first time a
    // county actually matters (a state drill, a tint, or an open card).
    // POS enrichment rides in AFTER the map settles (538KB, never boot-blocking);
    // an open pin card fills in the moment it lands
    setTimeout(() => fetch('/assets/data/hospital-enrich.json').then(r => r.json()).then(d => {
      ENRICH = d;
      if (mode === 'card' && selectedId){
        const f = ALL.find(x => x.properties.id === selectedId);
        if (f) openPinCard(f.properties, backTo);
      }
    }).catch(() => {}), 2500);
  });
  map.on('error', ev => {
    if (!map.loaded()){ signal('Basemap failed to load. Check the connection'); }
    if (ev && ev.error) console.warn('maplibre', ev.error);
  });
})();
