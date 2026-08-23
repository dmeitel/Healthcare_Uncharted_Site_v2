/* The Healthcare Career Tree.

   Lifted out of src/tools/career-tree/index.njk 2026-08-22 (roadmap rung 8, the last
   one, see docs/HU-BUILD-HARDENING-2026-08-22.md section 3). It carried no inline
   handlers and no build-time Nunjucks, so this was a straight lift.

   tests/career-phone-flow.test.js brace-matches renderPhoneFlow out of the SHIPPED
   output and executes it against the real dataset. It reads this file now, not the
   built page. */

/* DOM narrowing helpers. querySelector returns Element, getElementById returns
   HTMLElement, and event.target returns EventTarget, none of which carry .dataset,
   .value or the on* properties this file leans on. Same three shims iceberg-map.js,
   atlas.js and hospital-map.js use, plus an input flavour because this tool has a
   lot of form controls. */
/** @param {ParentNode} root @param {string} sel @returns {HTMLElement[]} */
const qsa = (root, sel) => /** @type {HTMLElement[]} */ (Array.from(root.querySelectorAll(sel)));
/** @param {Element|EventTarget|Node|null} el @returns {HTMLElement} */
const asEl = el => /** @type {HTMLElement} */ (el);
/** @param {Element|EventTarget|Node|null} el @returns {HTMLInputElement} */
const asInput = el => /** @type {HTMLInputElement} */ (el);
/** delegated lookup from an event @param {Event} e @param {string} sel */
const hit = (e, sel) => /** @type {HTMLElement | null} */ (asEl(e.target).closest(sel));

(function(){
  'use strict';

  // ── State ──────────────────────────────────────────────
  // phone break matches the selector-pop sheet contract in hu-global.css (699px)
  const PHONE_MQ = window.matchMedia('(max-width: 699px)');
  const REDUCED_MQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  const isPhone = () => PHONE_MQ.matches;
  // motion budget (HU-UI-GRAMMAR rule 5): every tween caps at 250ms on phones, 0 under reduced-motion
  const dcap = ms => REDUCED_MQ.matches ? 0 : (PHONE_MQ.matches ? Math.min(ms, 250) : ms);
  let DATA = null, BLS = null, CREDS = null;   // CREDS = credential reality (pass rate / length / fee), optional enrichment
  let curClass = 'roles';
  let curView = 'career';   // 'career' | 'edu' | 'path' — the active main-panel view
  let hiddenPathways = new Set();  // whole pathways toggled off (roles only)
  let hiddenFamilies = new Set();  // individual specialties (families) toggled off
  let curLaneInfo = [];            // [{pathway,side,left,right,cx}] produced by layout
  let curRegionInfo = null;        // {dividerX, clinicalCx, businessCx} or null
  let navTopY = 0, navBotY = 0, navMinX = 0, navMaxX = 0;   // content bounds for the blueprint-style limited pan/zoom
  let curFamilyInfo = [];          // [{pathway,family,left,right,cx}] discipline sub-lanes
  let nodeById = new Map();        // id -> node (current class)
  let edgesAll = [];               // [ [src,tgt], ... ] current class
  // career-line focus: while a role is selected (and Free look is off), everything not on
  // its line drops back so the connections read. The line = the LADDER + its DOORS:
  // rungs expand transitively only INSIDE the selected role's discipline; a cross-discipline
  // edge shows the tile on the far side (the door) but the walk STOPS there. The old blind
  // closure expanded through doors too — pick an informatics role and the whole nursing
  // ladder lit up (CNA feeds RN feeds CIA...), 8 families stayed on the board, and the
  // snap camera framed everything. Convergent roles made "focus" mean "show it all".
  let lineageFocus = true, lineageSet = null, lineageRungs = null, shelfSet = null;   // shelfSet = pinned roles riding the "On your path" shelf while snapped
  function lineageOf(id){
    const sel = nodeById.get(id); if (!sel){ const s = new Set([id]); return { set: s, rungs: s }; }
    const fam = sel.family;
    const inFam = i => { const n = nodeById.get(i); return !!n && n.family === fam; };
    const line = new Set([id]);
    let grew = true;   // down the ladder (within the discipline only)
    while (grew){ grew = false; for (const [s,t] of edgesAll){ if (line.has(s) && !line.has(t) && inFam(s) && inFam(t)){ line.add(t); grew = true; } } }
    grew = true;       // up the ladder (within the discipline only)
    while (grew){ grew = false; for (const [s,t] of edgesAll){ if (line.has(t) && !line.has(s) && inFam(s) && inFam(t)){ line.add(s); grew = true; } } }
    const rungs = new Set(line);
    // doors: ONE hop off any rung, either direction — shown, never expanded
    const doors = [];
    for (const [s,t] of edgesAll){
      if (line.has(s) && !line.has(t)) doors.push(t);
      if (line.has(t) && !line.has(s)) doors.push(s);
    }
    doors.forEach(x => line.add(x));
    return { set: line, rungs };
  }
  let posMap = new Map();          // id -> {x,y}

  // ── DECKS · collapsed-column resting state, David's call 2026-08-10 ──
  // Each family folds to its ENTRY tile restyled as a deck (family name + role count) sitting
  // at its entry tier — leveling and lane comparison survive by construction, and the lane
  // engine already compacts around the missing tiles. Tap a deck = the column unfolds in
  // place. Every touchpoint below is DECKS-gated, so ?classic=1 restores the old board whole.
  // PROMOTED 2026-08-11 (David: "everything we have done to this point should now be the
  // primary build") — decks IS the Career Matrix now. ?classic=1 keeps the old always-expanded
  // board reachable for comparison; ?decks=1 in previously shared links is a harmless no-op.
  const DECKS = !new URLSearchParams(location.search).has('classic');
  let collapsedFams = null;   // Set of folded family keys (lazy-init per class); null until the first decks render
  let deckRep = new Map();    // family -> entry node id (the tile that stands for the folded column)
  let famFanned = new Set();  // families showing the FULL sideways fan; default open = the one-or-two-wide spine
  let stackReps = new Map();  // rep node id -> { fam, tier, count } · the pile standing in for a tier's off-spine roles
  let stackByFT = new Map();  // 'fam|tier' -> rep id (edge aliasing: roads into the pile keep the ladder continuous)
  let deckShelves = null;     // FULL-REST shelf anchors [{side,left,top}] — clinical over business, kickers ride the map
  // NOTE the !lineageSet: deck grammar does not exist inside a snap. A folded family's entry
  // role that lands on the selected career line renders as the ROLE it is — the old behavior
  // drew it as a deck WITH its zone box mid-snap (his "something is pulling it up from before")
  function isDeckRep(id){ const n = nodeById.get(id); return !!(DECKS && collapsedFams && !lineageSet && n && collapsedFams.has(n.family) && deckRep.get(n.family) === id); }
  function famRoleCount(fam){ let c = 0; nodeById.forEach(n => { if (n.family === fam) c++; }); return c; }
  function pwRoleCount(pw){ let c = 0; nodeById.forEach(n => { if (n.pathway === pw) c++; }); return c; }
  const plRoles = c => c + (c === 1 ? ' role' : ' roles');
  // short zone names — the last rung of the label-fit ladder (full + count -> name -> short)
  const PW_SHORT = { therapeutic:'THERAPEUTIC', diagnostic:'DIAGNOSTIC', informatics:'INFORMATICS',
    support:'SUPPORT', biotech:'BIOTECH', admin:'ADMIN', government:'GOVERNMENT', education:'EDUCATION' };
  function measureZoneLbl(el){
    const name = el.querySelector('tspan.zl-name'), short = el.querySelector('tspan.zl-short'), cnt = el.querySelector('tspan.zl-count');
    if (short) short.style.display = 'none';
    if (name) name.style.display = '';
    if (cnt) cnt.style.display = '';
    const wf = el.getComputedTextLength();
    if (cnt) cnt.style.display = 'none';
    const ws = el.getComputedTextLength();
    let wsh = 0;
    if (short){ if (name) name.style.display = 'none'; short.style.display = ''; wsh = el.getComputedTextLength(); short.style.display = 'none'; if (name) name.style.display = ''; }
    if (cnt) cnt.style.display = '';
    if (wf){ el.dataset.wf = wf; el.dataset.ws = ws; el.dataset.wsh = wsh; }
    return { wf: wf, ws: ws, wsh: wsh };
  }
  let famOpenOrder = [];      // open order, newest last — Esc folds one step at a time (fan -> spine -> deck)
  let phoneFam = null;        // PHONE FLOW (≤699 career): the family whose ladder is open; null = the deck grid
  let snapArmed = false;      // DECKS: the FIRST tap looks in place (card + lit edges, zero relayout);
                              // the snap is an explicit second step (Focus line chip / a jump) — his
                              // call: "the first deep dive is kind of heavy on the movement"
  let focusId = null;         // DECKS: the role the BOARD is organized around. selectedId stays =
                              // whose card is open (the LOOK). Split on his call: "when you click
                              // into something just to get information everything else can change"
                              // — reading is free, reorganizing is always an explicit ask
  let colDragMoved = false;   // a finished column drag must not fire the label's click-to-fit
  function openZone(pw){   // deal a zone's every folded family onto the bench, canonical order
    if (!DECKS || !collapsedFams) return;
    const fams = new Set();
    nodeById.forEach(n => { if (n.pathway === pw && collapsedFams.has(n.family) && !hiddenFamilies.has(n.family)) fams.add(n.family); });
    if (!fams.size) return;
    const ord = DATA.classes[curClass].familyOrder || [];
    [...fams].sort((a,b) => ord.indexOf(a) - ord.indexOf(b)).forEach(f => { collapsedFams.delete(f); famOpenOrder.push(f); });
    render(true);
    const ls = curFamilyInfo.filter(l => !l.deckCell && fams.has(l.family));
    if (ls.length){ userZoomed = true; fitToBounds(Math.min(...ls.map(l=>l.left)) - 160, Math.max(...ls.map(l=>l.right)) + 160, navY()[0], navY()[1], true, 520); }
    announce('Every ' + ((((DATA.classes[curClass].pathways || {})[pw]) || {}).label || pw) + ' column opened');
  }
  function foldColumn(fam){
    if (!DECKS || !collapsedFams) return;
    collapsedFams.add(fam); famFanned.delete(fam);
    famOpenOrder = famOpenOrder.filter(f => f !== fam);
    selectedId = null; closePanel(); render(true);
    announce('Column folded');
  }
  // drag a column by its NAME to reorder the bench — pointer events, so mouse and touch both
  // work (his call: "drag and drop so that it can be touch phone friendly"). An insertion
  // line previews the slot; the reorder commits once, on release, as one animated move.
  function startColDrag(e, d){
    if (!DECKS || !collapsedFams || lineageSet) return;
    if (famOpenOrder.indexOf(d.family) < 0 || famOpenOrder.length < 2) return;
    const board = document.getElementById('hct-board'); if (!board) return;
    const rect = board.getBoundingClientRect();
    const lanes = curFamilyInfo.filter(l => !l.deckCell && l.family !== '__mine' && famOpenOrder.indexOf(l.family) >= 0)
      .slice().sort((a,b) => a.left - b.left);
    if (lanes.length < 2) return;
    const bounds = lanes.map(l => l.left - LANE_GAP/2);
    bounds.push(lanes[lanes.length - 1].right + LANE_GAP/2);
    const sx = e.clientX;
    let moved = false, slot = -1;
    const move = ev => {
      if (!moved && Math.abs(ev.clientX - sx) < 6) return;
      moved = true; colDragMoved = true;
      const t = d3.zoomTransform(svg.node());
      const cx = (ev.clientX - rect.left - t.x) / t.k;
      let best = 0, bd = Infinity;
      bounds.forEach((b, i) => { const dd = Math.abs(b - cx); if (dd < bd){ bd = dd; best = i; } });
      slot = best;
      let line = gContainers.select('line.hct-dropline');
      if (line.empty()) line = gContainers.append('line').attr('class','hct-dropline');
      line.attr('x1', bounds[slot]).attr('x2', bounds[slot]).attr('y1', navTopY + 46).attr('y2', navBotY - 24);
    };
    const up = () => {
      document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', up);
      gContainers.selectAll('line.hct-dropline').remove();
      if (!moved || slot < 0) return;
      const from = famOpenOrder.indexOf(d.family);
      let to = slot; if (to > from) to--;
      if (to === from || to < 0) return;
      famOpenOrder.splice(from, 1); famOpenOrder.splice(to, 0, d.family);
      userZoomed = true; render(true); announce('Column moved');
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
    document.addEventListener('pointercancel', up);
  }
  let boardRendered = false, eduRendered = false;   // lazy-render the heavy Career Matrix board + Education Matrix only when first opened
  let selectedId = null;
  let pinned = new Set();          // role ids referenced by skill nodes (for board rings)
  let build = blankBuild();        // the My Path build planner (freeform skill tree + side panels)
  let hwDismissed = false;         // welcome-survey modal dismissed this SESSION (never persisted — doctrine: no dismissal cookies)
  let exportMode = false;          // when true, the career trunk renders roomier (bigger cells, full wrapping titles) for the JPEG export
  const BUILD_KEY = c => 'hct-build-' + c;
  let uid = 0; const newId = () => 'b' + (++uid) + '-' + Date.now();
  let connGradId = 0;   // monotonic ids for connector gradients (node-color → node-color), unique across re-renders
  // movable dashboard panels (Career is fixed on top; these flow into the grid below, drag/add/remove)
  const PANEL_ORDER = ['skill','spec','experience','population','next','sw','notes','other'];   // Education is a fixed card under the trunk, not a movable section
  const PANELS = {
    skill:      { title:'Skills',     kind:'spiral', grid:'bp-grid-skill',      search:['bp-skill-search','bp-skill-suggest'], picker:'skill',     ph:'Search skills (airway, vitals, charting…)' },
    spec:       { title:'Specializations',  kind:'spiral', grid:'bp-grid-spec',       search:['bp-spec-search','bp-spec-suggest'],   picker:'spec',      ph:'Search focus areas (ICU, peds, trauma…)' },
    experience: { title:'Experience',       kind:'spiral', grid:'bp-grid-experience', search:['bp-exp-search','bp-exp-suggest'],     picker:'experience', ph:'Search settings (ICU, ED, rural…)' },
    population: { title:'Populations',       kind:'spiral', grid:'bp-grid-population', search:['bp-pop-search','bp-pop-suggest'],     picker:'population', ph:'Search patient types & journeys (peds, ICU patient, prenatal…)' },
    next:       { title:'Next Steps',       kind:'next' },
    sw:         { title:'Strengths & Weaknesses', kind:'text', field:'sw',    ph:"What you bring, and what you're working on…" },
    notes:      { title:'Notes',            kind:'text', field:'notes', ph:'Anything you want to remember…' },
    other:      { title:'Other',            kind:'text', field:'other', ph:'Anything else: awards, languages, volunteer work, links…' }
  };
  function blankBuild(){ return { budget: 30, view: 'both', name: '', goal: '', layout: { order: ['notes','sw','other'], hidden: ['other'], sizes: {}, titles: {} }, career: [], education: [], skill: [], spec: [], experience: [], population: [], sw: '', notes: '', other: '', tagline: '', checks: {} }; }   // one view: everything layered, quick-adds land as Future goals; 'future' = the Goals-only theorycraft toggle. Dash order holds TEXT cards only — zones + Next are fixed story sections. checks = ticked requirement items, keyed r|roleId|item / c|credId|item
  // "Other" sections are dynamic: 'other', 'other-2', 'other-3'… each a renamable text card
  function isOtherKey(k){ return k === 'other' || /^other-\d+$/.test(k); }
  function panelOf(key){ return PANELS[key] || (isOtherKey(key) ? { title:'Other', kind:'text', field:key, ph:'Anything else: awards, languages, volunteer work, links…' } : null); }
  // a panel's displayed title — a user-set custom title (e.g. renamed "Other") wins over the default
  function panelTitle(key){ return (build.layout.titles && build.layout.titles[key]) || (panelOf(key) && panelOf(key).title) || key; }
  // two layers on My Path: 'current' (what you HAVE) and 'future' (what you WANT). build.view = both|future ('current'-only retired).
  function nodeLayer(n){ return (n && n.layer === 'future') ? 'future' : 'current'; }
  function activeLayer(){ return (build.view === 'future' || build.view === 'both') ? 'future' : 'current'; }   // which layer a new tile joins
  function layerVisible(n){ return (build.view === 'current') ? nodeLayer(n) !== 'future' : true; }            // future tiles hidden in Current view

  const svg = d3.select('#hct-svg');
  const tip = document.getElementById('hct-tip');
  let gZoom, gEdges, gNodes, gTiers, gBands, gHeaders, gContainers, gAxis, gActs, zoom;
  let gTop, gTopBg, clipRect;                       // frozen top header band + the clip that keeps content below it
  let headPinY = 0, headBandY = 0;                 // content Y of the header band top / bottom (set in render)
  const HEAD_TOP = 12;                             // screen px from the board top where the header band pins
  let atlasZoom = null, gAtlasZoom = null, atlasBuilt = false;
  let growthById = new Map();   // growth node id -> node
  let growthDetail = {};        // growth node id -> { how, show }  (from career-tree-growth-detail.json)
  let atlasMultiMode = false;   // Areas of Expertise multi-select mode
  const atlasSel = new Set();   // selected growth-node ids while multi-selecting

  // ── Geometry ───────────────────────────────────────────
  const R = 52;            // career hex radius
  const ROWH = 106;        // tier (level) vertical spacing — staggered hex, centered-safe
  const COLW = 98;         // horizontal spacing within a discipline lane (~√3·R)
  const LANE_GAP = 20;     // gap between discipline sub-lanes
  const PATHWAY_GAP = 52;  // gap between pathways on the same side
  const REGION_GAP = 120;  // gap between the clinical and business regions
  const HEXHW = Math.sqrt(3) * 52 / 2;   // hex half-width (flat side), for lane bounds
  const DEG_LEVEL = { 'HS':0, 'Cert':1, 'AS':2, 'BS':3, 'MS':4, 'Doc':5, 'MD/DO':6 };
  const DEG_ORDER = ['HS','Cert','AS','BS','MS','Doc','MD/DO'];
  // known academic credential faces → their real degree level (so MHA reads as a Master's, not whatever role surfaced it)
  const DEG_FACE_LEVEL = { 'MHA':'MS','MBA':'MS','MPH':'MS','MSN':'MS',"Master's":'MS','Master':'MS',
    'DNP':'Doc','DNAP':'Doc','PhD':'Doc','Doctoral':'Doc','MD/DO':'MD/DO',
    'BSN':'BS',"Bachelor's":'BS','Bachelor':'BS','Associate':'AS','Certificate':'Cert','HS / GED':'HS','GED':'HS' };
  // Education Matrix DEGREES (academic levels AS+). Named per DISCIPLINE where the family is one discipline (a nursing
  // bachelor is a BSN, a respiratory bachelor is a BSRT…); multi-discipline families (rehab = PT/OT/SLP) get the degree
  // from each role's Education text instead. [face, full label]  — David: verify the abbreviations.
  const FAMILY_DEG = {
    nursing:        { AS:['ADN','Associate Degree in Nursing'], BS:['BSN','Bachelor of Science in Nursing'], MS:['MSN','Master of Science in Nursing'], Doc:['DNP','Doctor of Nursing Practice'] },
    respiratory:    { AS:['AS-RT','Associate of Science in Respiratory Therapy'], BS:['BSRT','Bachelor of Science in Respiratory Therapy'], MS:['MSRT','Master of Science in Respiratory Therapy'] },
    imaging:        { AS:['AS-RAD','Associate in Radiologic Technology'], BS:['BSRS','Bachelor of Science in Radiologic Sciences'], MS:['MSRS','Master of Science in Radiologic Sciences'] },
    lab:            { AS:['MLT','Associate in Medical Laboratory Technology'], BS:['MLS','Bachelor of Science in Medical Laboratory Science'] },
    ems:            { AS:['AS-EMS','Associate in Paramedicine'], BS:['BS-EMS','Bachelor in EMS Management'] },
    dental:         { AS:['AS-DH','Associate in Dental Hygiene'] },
    cardiovascular: { AS:['AS-CVT','Associate in Cardiovascular Technology'] },
    neurodiagnostic:{ AS:['AS-NDT','Associate in Neurodiagnostic Technology'] },
    surgical:       { AS:['AS-ST','Associate in Surgical Technology'] },
    pharmacy:       { Doc:['PharmD','Doctor of Pharmacy'] },
    revenue:        { AS:['AS-HIM','Associate in Health Information'], BS:['BS-HIM','Bachelor in Health Information Management'], MS:['MHA','Master of Health Administration'] },
    informatics:    { AS:['AS-HI','Associate in Health Informatics'], BS:['BSHI','Bachelor in Health Informatics'], MS:['MSHI','Master in Health Informatics'] },
    admin:          { AS:['AS-HA','Associate in Health Administration'], BS:['BHA','Bachelor of Health Administration'] },
    quality:        { BS:['BSHA','Bachelor in Health Administration'] },
    publichealth:   { BS:['BSPH','Bachelor of Public Health'] },
    spiritual:      { MS:['MDiv','Master of Divinity'] },
    policy:         { MS:['MPP','Master of Public Policy'] },
    clinicaled:     { MS:['MSEd','Master of Science in Education'] },
    faculty:        { MS:['MSEd','Master of Science in Education'], Doc:['PhD','Doctoral Degree (PhD / EdD)'] }
  };
  // cross-cutting / role-specific named degrees detected in a role's Education text (level-tagged)
  const NAMED_DEFS = [
    { face:'BSN', label:'Bachelor of Science in Nursing', lvl:'BS', re:/\bBSN\b/i },
    { face:'MSN', label:'Master of Science in Nursing', lvl:'MS', re:/\bMSN\b/i },
    { face:'MHA', label:'Master of Health Administration', lvl:'MS', re:/\bMHA\b/i },
    { face:'MBA', label:'Master of Business Administration', lvl:'MS', re:/\bMBA\b/i },
    { face:'MPH', label:'Master of Public Health', lvl:'MS', re:/\bMPH\b|public health/i },
    { face:'MPP', label:'Master of Public Policy', lvl:'MS', re:/\bMPP\b/i },
    { face:'MSW', label:'Master of Social Work', lvl:'MS', re:/\bMSW\b|master of social work|social work/i },
    { face:'MPAS', label:'Master of Physician Assistant Studies', lvl:'MS', re:/PA program|physician assistant/i },
    { face:'MS-SLP', label:'Master of Science in Speech-Language Pathology', lvl:'MS', re:/\bSLP\b|speech-language/i },
    { face:'MS-AT', label:'Master of Athletic Training', lvl:'MS', re:/athletic|\bCAATE\b/i },
    { face:'MS-Coun', label:'Master in Counseling', lvl:'MS', re:/counsel/i },
    { face:'MS-ABA', label:"Master's in Applied Behavior Analysis", lvl:'MS', re:/\bABA\b|behavior analy/i },
    { face:'MS-Nutr', label:'Master in Nutrition & Dietetics', lvl:'MS', re:/dietit|nutrition/i },
    { face:'PathA', label:"Master in Pathologists' Assistant", lvl:'MS', re:/pathologist|PathA/i },
    { face:'AS-PTA', label:'Associate in Physical Therapist Assisting', lvl:'AS', re:/physical therapist assist|\bPTA\b/i },
    { face:'AS-OTA', label:'Associate in Occupational Therapy Assisting', lvl:'AS', re:/occupational therapy assist|\bOTA\b/i },
    { face:'DNP', label:'Doctor of Nursing Practice', lvl:'Doc', re:/\bDNP\b/i },
    { face:'DNAP', label:'Doctor of Nurse Anesthesia Practice', lvl:'Doc', re:/\bDNAP\b/i },
    { face:'PharmD', label:'Doctor of Pharmacy', lvl:'Doc', re:/pharmd|doctor of pharmacy/i },
    { face:'DPT', label:'Doctor of Physical Therapy', lvl:'Doc', re:/\bDPT\b|physical therapy/i },
    { face:'OTD', label:'Occupational Therapy Doctorate', lvl:'Doc', re:/\bOTD\b|\bMOT\b|occupational/i },
    { face:'AuD', label:'Doctor of Audiology', lvl:'Doc', re:/\bAuD\b|audiology/i },
    { face:'PsyD', label:'Doctor of Psychology', lvl:'Doc', re:/\bPsyD\b/i },
    { face:'PhD', label:'Doctor of Philosophy (PhD)', lvl:'Doc', re:/\bPhD\b|\bDrPH\b/i },
    { face:'DDS / DMD', label:'Dental Doctorate', lvl:'Doc', re:/\bDDS\b|\bDMD\b/i }
  ];
  const GENERIC_LEVEL = { AS:['AS','Associate Degree'], BS:['BS',"Bachelor's Degree"], MS:['MS',"Master's Degree"],
    Doc:['Doctorate','Doctoral Degree'], 'MD/DO':['MD / DO','Doctor of Medicine / Osteopathy'] };
  // the degree(s) a role earns: its DISCIPLINE degree (family+level) + any named degree in its Education at that level,
  // else the level's generic. A job can sit under several (a CNO ← MSN, MHA, MBA).
  function roleDegrees(n){
    const out = new Map(), lvl = n.degree, edu = (metaV(n,'Education')||'') + ' ' + (n.label||'').replace(/\n/g,' ');
    const fd = FAMILY_DEG[n.family] && FAMILY_DEG[n.family][lvl];
    if (fd) out.set(fd[0], { face:fd[0], label:fd[1], rank:0 });
    NAMED_DEFS.forEach((def,i) => { if (def.lvl === lvl && def.re.test(edu) && !out.has(def.face)) out.set(def.face, { face:def.face, label:def.label, rank:10+i }); });
    if (!out.size){ const g = GENERIC_LEVEL[lvl]; if (g) out.set(g[0], { face:g[0], label:g[1], generic:true, rank:999 }); }
    return [...out.values()];
  }
  // full degree name for a credential FACE (BSN → "Bachelor of Science in Nursing"); falls back to the face itself, not the generic level
  function degreeFullName(face, degree){
    if (!face) return (DATA.meta.degrees[degree]||{}).label || '';
    const nd = NAMED_DEFS.find(d => d.face === face); if (nd) return nd.label;
    for (const fam in FAMILY_DEG){ const lv = FAMILY_DEG[fam]; for (const k in lv){ if (lv[k][0] === face) return lv[k][1]; } }
    for (const k in GENERIC_LEVEL){ if (GENERIC_LEVEL[k][0] === face) return GENERIC_LEVEL[k][1]; }
    return face;
  }
  let   lodFar = false;    // level-of-detail: true when zoomed out (abbr-only)
  let   lodDirty = false;  // LOD flipped mid-gesture: class fade already ran, the tile attr pass waits for zoom end
  let   userZoomed = false; // true once the user manually zooms/pans (suppresses auto-fit)

  function hexPath(cx, cy, r){
    let d = '';
    for (let i=0;i<6;i++){
      const a = Math.PI/3*i - Math.PI/2;       // pointy-top
      d += (i===0?'M':'L') + (cx + r*Math.cos(a)).toFixed(1) + ',' + (cy + r*Math.sin(a)).toFixed(1);
    }
    return d + 'Z';
  }

  function famColor(id){
    const c = DATA.classes[curClass];
    const n = nodeById.get(id);
    return (c.families[n.family] && c.families[n.family].color) || '#4ECDC4';
  }

  // ── Heatmap coloring: paint hexes by BLS median pay or job growth ──────────
  let colorMode = 'fam';                                  // 'fam' | 'pay' | 'growth'
  const PAY_LO = 35000, PAY_HI = 140000, GRW_LO = 0, GRW_HI = 25;   // scale bounds (top color clamps physicians / NP outliers)
  const NODATA_FILL = '#2a3340', NODATA_STROKE = '#3a4452';
  function clamp01(t){ return t < 0 ? 0 : (t > 1 ? 1 : t); }
  function lerpHex(a, b, t){
    const pa = [parseInt(a.slice(1,3),16), parseInt(a.slice(3,5),16), parseInt(a.slice(5,7),16)];
    const pb = [parseInt(b.slice(1,3),16), parseInt(b.slice(3,5),16), parseInt(b.slice(5,7),16)];
    return '#' + pa.map((x,i) => Math.round(x + (pb[i]-x)*t).toString(16).padStart(2,'0')).join('');
  }
  function blsVal(id, mode){
    if (!BLS || !BLS.roleMap) return null;
    const o = BLS.occupations[BLS.roleMap[id]];
    return o ? (mode === 'pay' ? o.pay : o.growth) : null;
  }
  function heatColor(v, mode){
    return mode === 'pay'
      ? lerpHex('#3a5a7a', '#E8A838', clamp01((v - PAY_LO) / (PAY_HI - PAY_LO)))
      : lerpHex('#3a5a7a', '#4ECDC4', clamp01((v - GRW_LO) / (GRW_HI - GRW_LO)));
  }
  function hexFill(d){ if (colorMode === 'fam') return famColor(d); const v = blsVal(d, colorMode); return v == null ? NODATA_FILL : heatColor(v, colorMode); }
  function hexStroke(d){ if (colorMode === 'fam') return famColor(d); const v = blsVal(d, colorMode); return v == null ? NODATA_STROKE : heatColor(v, colorMode); }
  function hexFillOp(d){
    if (colorMode !== 'fam') return d === selectedId ? 0.95 : (blsVal(d, colorMode) == null ? 0.22 : 0.78);
    return d === selectedId ? 0.42 : (TYPE_OP[nodeById.get(d).type] || TYPE_OP.licensed)[0];
  }
  function hexStrokeOp(d){
    if (colorMode !== 'fam') return d === selectedId ? 1 : (blsVal(d, colorMode) == null ? 0.35 : 0.95);
    return d === selectedId ? 1 : (TYPE_OP[nodeById.get(d).type] || TYPE_OP.licensed)[1];
  }
  function paintHexBodies(sel){
    sel.attr('fill', d => hexFill(d)).attr('stroke', d => hexStroke(d))
       .attr('stroke-width', d => nodeById.get(d).type === 'executive' ? 2.4 : 1.6)
       .attr('fill-opacity', d => hexFillOp(d)).attr('stroke-opacity', d => hexStrokeOp(d));
  }
  function applyColorMode(){
    if (gNodes) paintHexBodies(gNodes.selectAll('.hx-body'));
    updateColorLegend();
  }
  function updateColorLegend(){
    const el = document.getElementById('hct-clegend'); if (!el) return;
    if (colorMode === 'fam'){ el.style.display = 'none'; return; }
    const isPay = colorMode === 'pay';
    const grad = isPay ? 'linear-gradient(90deg,#3a5a7a,#E8A838)' : 'linear-gradient(90deg,#3a5a7a,#4ECDC4)';
    el.innerHTML = '<div class="cl-ttl">' + (isPay ? 'Median pay &middot; BLS' : 'Job growth &middot; 2024–34') + '</div>' +
      '<div class="cl-bar" style="background:' + grad + '"></div>' +
      '<div class="cl-ends"><span>' + (isPay ? '$35k' : '0%') + '</span><span>' + (isPay ? '$87k' : '12%') + '</span><span>' + (isPay ? '$140k+' : '25%+') + '</span></div>' +
      '<div class="cl-nd"><i></i> No BLS match yet</div>';
    el.style.display = '';
  }
  // the one commit path for the Metric (colorMode) — paints the board, sets the
  // selector face, updates the legend, and keeps the URL in step
  const CMODES = [
    { k:'fam',    label:'Family', hint:'Color hexes by job family' },
    { k:'pay',    label:'Pay',    hint:'Heatmap by BLS median pay' },
    { k:'growth', label:'Growth', hint:'Heatmap by BLS job growth' }
  ];
  const CMODE_LABEL = { fam:'Family', pay:'Pay', growth:'Growth' };
  function setColorMode(m){
    colorMode = m;
    const face = document.getElementById('hct-sel-metric-val');
    if (face) face.textContent = CMODE_LABEL[m] || m;
    applyColorMode();
    syncURL();
  }

  const TYPE_OP = {
    entry:      [0.09, 0.45],
    certified:  [0.13, 0.58],
    licensed:   [0.14, 0.60],
    specialty:  [0.15, 0.62],
    advanced:   [0.17, 0.68],
    leadership: [0.19, 0.74],
    technology: [0.19, 0.78],
    executive:  [0.24, 0.92],
    state:      [0.20, 0.80]
  };

  // ── Build current class graph ──────────────────────────
  function loadClass(cls){
    curClass = cls;
    const c = DATA.classes[cls];
    nodeById = new Map();
    c.nodes.forEach(n => nodeById.set(n.id, n));
    edgesAll = [];
    c.nodes.forEach(n => (n.leadsTo||[]).forEach(t => { if (nodeById.has(t)) edgesAll.push([n.id, t]); }));
    // restore saved build for this class
    build = loadBuild(cls);
    syncPinned();
    selectedId = null;
    closePanel();
  }

  function pathwayVisible(node){ return !hiddenPathways.has(node.pathway) && !hiddenFamilies.has(node.family); }

  function filteredNodes(){ return [...nodeById.values()].filter(pathwayVisible); }
  function filteredEdges(){
    const ok = new Set(filteredNodes().map(n=>n.id));
    return edgesAll.filter(([s,t]) => ok.has(s) && ok.has(t));
  }

  // ── Layout: region (clinical|business) > pathway > discipline sub-lane ──
  function layout(visSet){
    const cls = DATA.classes[curClass];
    const allNodes = [...visSet].map(id=>nodeById.get(id));
    const edges = filteredEdges().filter(([s,t]) => visSet.has(s) && visSet.has(t));
    const pcfg = cls.pathways || {};
    const famOrder = cls.familyOrder || Object.keys(cls.families || {});
    const sideOf = pw => (pcfg[pw] && pcfg[pw].side) || 'clinical';
    const present = (cls.pathwayOrder || ['journey']).filter(p => allNodes.some(n=>n.pathway===p));
    const pwOrder = present.slice().sort((a,b)=>{
      const sa = sideOf(a)==='clinical'?0:1, sb = sideOf(b)==='clinical'?0:1;
      return sa!==sb ? sa-sb : present.indexOf(a)-present.indexOf(b);
    });

    const pos = new Map();
    const famLanes = [], pwGroups = [];
    let x = 0, prevPw = null, prevSide = null, dividerX = null;
    deckShelves = null;

    // one discipline lane: crossing-reduced tier column laid at the current x cursor
    const layoutLane = (fam, fn, pwName) => {
      const tiers = [...new Set(fn.map(n=>n.tier))].sort((a,b)=>a-b);
      const byTier = new Map(tiers.map(t=>[t, []]));
      fn.slice().sort((a,b)=> a.id<b.id?-1:1).forEach(n => byTier.get(n.tier).push(n.id));
      // crossing reduction within the discipline lane (same-family edges)
      const inLane = new Set(fn.map(n=>n.id));
      const parents = new Map(), children = new Map();
      fn.forEach(n => { parents.set(n.id, []); children.set(n.id, []); });
      edges.forEach(([s,t]) => { if (inLane.has(s) && inLane.has(t)){ children.get(s).push(t); parents.get(t).push(s); } });
      const idxIn = id => byTier.get(nodeById.get(id).tier).indexOf(id);
      for (let pass=0; pass<5; pass++){
        const down = pass%2===0;
        const seq = down ? tiers : tiers.slice().reverse();
        seq.forEach(t => {
          const ids = byTier.get(t);
          const w = new Map();
          ids.forEach(id => { const ng = down ? parents.get(id) : children.get(id); const ps = ng.map(idxIn).filter(i=>i>=0); w.set(id, ps.length ? d3.mean(ps) : idxIn(id)); });
          byTier.set(t, ids.slice().sort((a,b)=> (w.get(a)-w.get(b)) || (ids.indexOf(a)-ids.indexOf(b))));
        });
      }
      // each level centered on the lane axis, with a gentle honeycomb stagger
      const local = [];
      tiers.forEach(t => {
        const ids = byTier.get(t);
        const off = (t % 2 === 0 ? -1 : 1) * (COLW / 4);
        ids.forEach((id,i) => local.push({ id, lx: (i - (ids.length-1)/2)*COLW + off, ly: t*ROWH }));
      });
      const minLx = Math.min(...local.map(q=>q.lx)) - HEXHW;
      const maxLx = Math.max(...local.map(q=>q.lx)) + HEXHW;
      const laneW = maxLx - minLx;
      local.forEach(q => pos.set(q.id, { x: x + (q.lx - minLx), y: q.ly }));
      famLanes.push({ pathway: pwName, family: fam, left: x, right: x + laneW, cx: x + laneW/2 });
      x += laneW + LANE_GAP;
    };

    // ── DECKS (not snapped): THE BENCH + THE SHELVES ──
    // Bench: open columns sit at the LEFT in the order YOU opened them — no canonical
    // slotting, so opening Nursing last puts it LAST, not first. Shuffle arrows reorder.
    // Shelves: every still-folded zone stays packed at the right, clinical over business,
    // and never reorganizes. A deck tap CHECKS THE FAMILY OUT of its shelf onto the bench.
    const benchMode = !!(DECKS && collapsedFams && !lineageSet);
    if (benchMode){
      const famVisAll = new Map();
      allNodes.forEach(n => { if (!famVisAll.has(n.family)) famVisAll.set(n.family, []); famVisAll.get(n.family).push(n); });
      // collapsedFams gate matters: a family with exactly ONE role would otherwise read as
      // clustered even when OPENED, leaving it a boxless role tile stranded in the shelf
      // (his Health Facility Surveyor screenshot) instead of a proper one-tile bench column
      const isClustered = f => { const arr = famVisAll.get(f); return collapsedFams.has(f) && arr.length === 1 && arr[0].id === deckRep.get(f); };
      const laneFams = [...famVisAll.keys()].filter(f => !isClustered(f));
      const bench = famOpenOrder.filter(f => laneFams.indexOf(f) >= 0);
      laneFams.forEach(f => { if (bench.indexOf(f) < 0) bench.push(f); });   // safety net: a lane family never silently vanishes
      bench.forEach(fam => layoutLane(fam, famVisAll.get(fam), (famVisAll.get(fam)[0] || {}).pathway || ''));
      const benchRight = bench.length ? x - LANE_GAP : 0;
      const shelfLeft = bench.length ? benchRight + 90 : 0;
      const DXC = 108, DYC = 94, SHELF_PW_GAP = 34;
      const placeRow = (side, y0) => {
        let sx = shelfLeft, maxY = -Infinity;
        pwOrder.filter(p => sideOf(p) === side).forEach(pw2 => {
          const fams2 = [...new Set(allNodes.filter(n => n.pathway === pw2 && isClustered(n.family)).map(n => n.family))]
            .sort((a,b) => famOrder.indexOf(a) - famOrder.indexOf(b));
          if (!fams2.length) return;
          const W = fams2.length > 4 ? 3 : 2, left = sx;
          fams2.forEach((f, i) => {
            const row = Math.floor(i / W), col = i % W;
            const px = left + HEXHW + col*DXC + (row % 2 ? DXC/2 : 0);
            const py = y0 + row*DYC;
            pos.set(deckRep.get(f), { x: px, y: py });
            maxY = Math.max(maxY, py + 62);
            famLanes.push({ pathway: pw2, family: f, left: px - HEXHW, right: px + HEXHW, cx: px, deckCell: true });
          });
          const clW = HEXHW*2 + (Math.min(W, fams2.length) - 1)*DXC + (fams2.length > W ? DXC/2 : 0);
          pwGroups.push({ pathway: pw2, side, left, right: left + clW, cx: left + clW/2 });
          sx = left + clW + SHELF_PW_GAP;
        });
        return { maxY, right: sx - SHELF_PW_GAP };
      };
      const clin = placeRow('clinical', 0);
      const bizY = clin.maxY === -Infinity ? 0 : clin.maxY + 190;   // no clinical shelf left = business rides the top
      const biz = placeRow('business', bizY);
      x = Math.max(benchRight, clin.right, biz.right) + LANE_GAP;   // total extent; the shared centering below expects the trailing gap
      deckShelves = [];
      if (clin.maxY !== -Infinity) deckShelves.push({ side: 'clinical', left: shelfLeft, top: -62 });
      if (biz.maxY !== -Infinity) deckShelves.push({ side: 'business', left: shelfLeft, top: bizY - 62 });
      if (!deckShelves.length) deckShelves = null;
    } else

    pwOrder.forEach(pw => {
      const side = sideOf(pw);
      if (prevPw !== null){
        // DECKS snap: the door lanes gather close (the splayed canonical gaps made the field
        // enormous, which is what forced the old whole-field fit to zoom out so far)
        const rg = (DECKS && collapsedFams) ? 60 : REGION_GAP, pg = (DECKS && collapsedFams) ? 34 : PATHWAY_GAP;
        if (prevSide === 'clinical' && side === 'business'){ const cr = x - LANE_GAP; dividerX = cr + rg/2; x = cr + rg; }
        else x += (pg - LANE_GAP);
      }
      const pwLeft = x;
      const pn = allNodes.filter(n=>n.pathway===pw);
      const fams = [...new Set(pn.map(n=>n.family))].sort((a,b)=> famOrder.indexOf(a) - famOrder.indexOf(b));

      // DECKS: a family whose only visible tile is its deck doesn't earn a whole lane — the
      // pathway's folded decks PACK into one honeycomb block (the zone), and only open,
      // fanned, or snap-door families lay out as tier columns beside it.
      const famsLane = [], famsCluster = [];
      if (DECKS && collapsedFams){
        const famVis = new Map();
        pn.forEach(n => { if (!famVis.has(n.family)) famVis.set(n.family, []); famVis.get(n.family).push(n); });
        fams.forEach(f => {
          const arr = famVis.get(f) || [];
          ((arr.length === 1 && arr[0].id === deckRep.get(f)) ? famsCluster : famsLane).push(f);
        });
      } else famsLane.push(...fams);

      famsLane.forEach(fam => layoutLane(fam, pn.filter(n=>n.family===fam), pw));

      if (famsCluster.length){
        // snug honeycomb: deck hexes are ~99 wide / 114 tall, so 108/94 with the half-column
        // offset interlocks the rows with a few px of air (was 132/110 — islands, not a map)
        const W = famsCluster.length > 4 ? 3 : 2, DX = 108, DY = 94;
        const reps = famsCluster.map(f => ({ f, id: deckRep.get(f), tier: (nodeById.get(deckRep.get(f)) || {}).tier || 0 }));
        const t0 = Math.min(...reps.map(r => r.tier));
        const yBase = t0*ROWH;   // grid mode anchors the block at its earliest entry level
        const clusterLeft = x;
        reps.forEach((r, i) => {
          const row = Math.floor(i / W), col = i % W;
          const px = clusterLeft + HEXHW + col*DX + (row % 2 ? DX/2 : 0);
          pos.set(r.id, { x: px, y: yBase + row*DY });
          famLanes.push({ pathway: pw, family: r.f, left: px - HEXHW, right: px + HEXHW, cx: px, deckCell: true });
        });
        const clW = HEXHW*2 + (Math.min(W, famsCluster.length) - 1)*DX + (famsCluster.length > W ? DX/2 : 0);
        x = clusterLeft + clW + LANE_GAP;
      }

      const pwRight = x - LANE_GAP;
      pwGroups.push({ pathway: pw, side, left: pwLeft, right: pwRight, cx: (pwLeft + pwRight)/2 });
      prevPw = pw; prevSide = side;
    });

    // center the whole graph horizontally around 0
    const shift = Math.max(0, x - LANE_GAP) / 2;
    pos.forEach(p => { p.x -= shift; });
    famLanes.forEach(l => { l.left -= shift; l.right -= shift; l.cx -= shift; });
    pwGroups.forEach(g => { g.left -= shift; g.right -= shift; g.cx -= shift; });
    curLaneInfo = pwGroups;
    curFamilyInfo = famLanes;
    if (deckShelves) deckShelves.forEach(s => { s.left -= shift; });   // kicker anchors ride the same centering as everything else

    curRegionInfo = null;
    if (dividerX != null){
      const cl = pwGroups.filter(g=>g.side==='clinical'), bz = pwGroups.filter(g=>g.side==='business');
      curRegionInfo = {
        dividerX: dividerX - shift,
        clinicalCx: cl.length ? (Math.min(...cl.map(g=>g.left)) + Math.max(...cl.map(g=>g.right)))/2 : 0,
        businessCx: bz.length ? (Math.min(...bz.map(g=>g.left)) + Math.max(...bz.map(g=>g.right)))/2 : 0
      };
    }
    return pos;
  }

  // ── Render ─────────────────────────────────────────────
  function render(animate){
    boardRendered = true;   // any render means the board (+ curFamilyInfo) exists now
    if (tip) tip.style.opacity = '0';   // a repaint can remove the hovered tile — mouseleave never fires, the tooltip would freeze mid-fade (his ghost-label screenshot)
    // career-line focus: classic follows the selection; DECKS organizes around the FOCUSED
    // role only (focusId, set by the Focus line chip or a jump) — never the merely-viewed one
    const lineRoot = (DECKS && collapsedFams) ? (snapArmed ? focusId : null) : selectedId;
    const lin = (lineageFocus && lineRoot) ? lineageOf(lineRoot) : null;
    lineageSet = lin ? lin.set : null; lineageRungs = lin ? lin.rungs : null;
    // snap-together: in focus mode only the families the line touches stay on the board, so a
    // cross-specialty link reads side-by-side instead of spanning the whole matrix. The layout
    // already compacts around missing families (the Pathways filter relies on it).
    let visNodes = filteredNodes();
    const prevPos = posMap, prevStackByFT = stackByFT;   // last render's world — the deal and fold motions start where the deck stood
    let doorTags = null;    // DECKS snap: [{fam,x,y}] sector tags riding above each stacked door column
    if (DECKS){
      if (!collapsedFams){   // lazy init: every family starts folded — the resting map IS the deck map
        collapsedFams = new Set(); deckRep = new Map(); famFanned = new Set(); famOpenOrder = [];
        nodeById.forEach(n => {
          if (!deckRep.has(n.family) || n.tier < nodeById.get(deckRep.get(n.family)).tier) deckRep.set(n.family, n.id);
          collapsedFams.add(n.family);
        });
      }
      // three grains per family: folded = one deck · open = the SPINE (at most two tiles per
      // tier, ranked by cross-tier connectivity, the rest pile into a tappable stack) ·
      // fanned = the full sideways spread. "For a simple view people will just want one line
      // or two" — the stack keeps the column narrow without hiding that more exists.
      stackReps = new Map(); stackByFT = new Map();
      const famNodes = new Map();
      visNodes.forEach(n => { if (!famNodes.has(n.family)) famNodes.set(n.family, []); famNodes.get(n.family).push(n); });
      const keep = new Set();
      const snapHomeFam = (lineageSet && lineRoot) ? (nodeById.get(lineRoot) || {}).family : null;
      famNodes.forEach((ns, fam) => {
        if (collapsedFams.has(fam)){ keep.add(deckRep.get(fam)); return; }
        // fanned, or the snap's HOME discipline (it stays whole while a line is lit — the
        // board's own doctrine; a pile must never stand in for a revealed line member)
        if (famFanned.has(fam) || fam === snapHomeFam){ ns.forEach(n => keep.add(n.id)); return; }
        const deg = new Map();   // cross-tier same-family degree = "how much of the ladder runs through this tile"
        edgesAll.forEach(([s,t]) => { const a = nodeById.get(s), b = nodeById.get(t);
          if (!a || !b || a.family !== fam || b.family !== fam || a.tier === b.tier) return;
          deg.set(s, (deg.get(s)||0)+1); deg.set(t, (deg.get(t)||0)+1); });
        const byTier = new Map();
        ns.forEach(n => { if (!byTier.has(n.tier)) byTier.set(n.tier, []); byTier.get(n.tier).push(n); });
        byTier.forEach((arr, tier) => {
          if (arr.length <= 2){ arr.forEach(n => keep.add(n.id)); return; }
          arr.sort((a,b) => (deg.get(b.id)||0) - (deg.get(a.id)||0) || (a.id < b.id ? -1 : 1));
          keep.add(arr[0].id); keep.add(arr[1].id);
          const rest = arr.slice(2), rep = rest[0];
          keep.add(rep.id);
          stackReps.set(rep.id, { fam, tier, count: rest.length });
          stackByFT.set(fam + '|' + tier, rep.id);
        });
      });
      visNodes = visNodes.filter(n => keep.has(n.id));
    }
    if (lineageSet){
      // the LINE never shows with gaps: members living in filtered-out pathways get
      // revealed while the selection holds (selection is focus — the map answers the
      // question you just asked); deselect and the filter is back exactly as set
      const visIds = new Set(visNodes.map(n => n.id));
      lineageSet.forEach(i => { if (!visIds.has(i)){ const n = nodeById.get(i); if (n) visNodes.push(n); } });
      // snap-together: the HOME discipline stays whole (cousins dim in place); every other
      // lane compacts to just its door tiles — one skinny lane per connected discipline,
      // not six full ladders of strangers dragged in for one connection each
      const selFam = (nodeById.get(lineRoot) || {}).family;
      visNodes = visNodes.filter(n => n.family === selFam || lineageSet.has(n.id));
    }
    const visSet = new Set(visNodes.map(n=>n.id));
    posMap = layout(visSet);
    // ON YOUR PATH shelf (snapped only): pinned roles that fell off the snapped field gather
    // band-true in their own column past the right edge — your pins never leave the room
    // (the AOE shelf's law, spoken in career grammar). No roads in or out; it's a shelf.
    shelfSet = null;
    if (lineageSet){
      // the pinned set (not a rebuild) — it already carries FORKED concurrent roles, which
      // a plain build.career walk missed (QA: "a few things are not pulling over")
      const shelf = [...pinned].map(id => nodeById.get(id)).filter(n => n && !visSet.has(n.id));
      if (shelf.length && !(DECKS && collapsedFams)){
        // classic only. DECKS drops the shelf during a snap entirely — the map answers the
        // question you asked; pins ON the line keep their rings, the rest return with the
        // bench on deselect (the pins row reorganizing mid-snap read as confusion, his QA)
        shelfSet = new Set(shelf.map(n => n.id));
        const xs0 = [...posMap.values()].map(p => p.x);
        const x0 = (xs0.length ? Math.max(...xs0) : 0) + PATHWAY_GAP + 90;
        const byT = {}; shelf.forEach(n => { (byT[n.tier] = byT[n.tier]||[]).push(n); });
        let xL = x0, xR = x0;
        Object.entries(byT).forEach(([t, arr]) => {
          arr.sort((a,b) => a.id < b.id ? -1 : 1);
          const off = (+t % 2 === 0 ? -1 : 1) * (COLW/4);   // the board's honeycomb stagger — without it stacked pins touch point-to-point
          arr.forEach((n,i) => { const px = x0 + off + i*COLW; posMap.set(n.id, { x: px, y: (+t)*ROWH }); xL = Math.min(xL, px); xR = Math.max(xR, px); });
        });
        shelf.forEach(n => { visNodes.push(n); visSet.add(n.id); });
        curFamilyInfo.push({ pathway:'__mine', family:'__mine', left: xL - HEXHW - 6, right: xR + HEXHW + 6, cx: (xL + xR)/2 });
        curLaneInfo.push({ pathway:'__mine', side:'shelf', left: xL - HEXHW - 12, right: xR + HEXHW + 12, cx: (xL + xR)/2 });
      }
    }
    // DECKS snap: connected roles STACK CLOSE beside the home ladder — one tight column per
    // family, TRUE TIERS kept (the height comparison stays honest), each column tagged with
    // its sector name. Kills the canonical sprawl dragging the eye across the whole map.
    if (DECKS && collapsedFams && lineageSet && lineRoot){
      const homeFam2 = (nodeById.get(lineRoot) || {}).family;
      const homeLane2 = curFamilyInfo.find(l => l.family === homeFam2 && !l.deckCell);
      if (homeLane2){
        doorTags = [];
        const seenF = new Set(), doorFams = [];
        visNodes.forEach(n => { if (n.family !== homeFam2 && !seenF.has(n.family)){ seenF.add(n.family); doorFams.push(n.family); } });
        let dx = homeLane2.right + 80;   // close beside the home box — his call, twice: "align closer together"
        doorFams.forEach(f => {
          const members = visNodes.filter(n => n.family === f).sort((a,b) => a.tier - b.tier || (a.id < b.id ? -1 : 1));
          const usedT = new Map(); let maxCols = 1;
          members.forEach(m => {
            const c = usedT.get(m.tier) || 0; usedT.set(m.tier, c + 1); maxCols = Math.max(maxCols, c + 1);
            posMap.set(m.id, { x: dx + c * 104, y: m.tier * ROWH });
          });
          const wf = (maxCols - 1) * 104 + 2 * HEXHW;
          const l2 = curFamilyInfo.find(l => l.family === f);
          if (l2){ l2.left = dx - HEXHW; l2.right = dx - HEXHW + wf; l2.cx = l2.left + wf/2; }
          doorTags.push({ fam: f, x: dx - HEXHW + wf/2, y: members[0].tier * ROWH - 78 });
          dx += wf + 14;   // columns nearly touch — the tags and colors keep them distinct
        });
        if (!doorTags.length) doorTags = null;
      }
    }
    // visSet is the one truth — filteredEdges would re-drop revealed line members.
    // DECKS spine mode: an edge whose end sits in a tier's stack re-points at the PILE, so the
    // ladder reads continuous through it (one road in, one road out) instead of breaking.
    let allEdges;
    if (DECKS && collapsedFams){
      const eAlias = id => {
        if (visSet.has(id)) return id;
        const n = nodeById.get(id); if (!n) return null;
        const sr = stackByFT.get(n.family + '|' + n.tier);
        return (sr && visSet.has(sr)) ? sr : null;   // folded families stay quiet — the lineage snap owns cross-family reveals
      };
      const seen = new Set(); allEdges = [];
      edgesAll.forEach(([s,t]) => {
        const a = eAlias(s), b = eAlias(t);
        if (!a || !b || a === b) return;
        const k = a + '|' + b; if (seen.has(k)) return; seen.add(k);
        allEdges.push([a, b]);
      });
    } else allEdges = edgesAll.filter(([s,t]) => visSet.has(s) && visSet.has(t));
    // lines WITHIN a profession (same family/discipline container) always show; lines that go SIDEWAYS into another
    // container only show for the selected tile's own connections. While snapped, an edge
    // between line members lights ONLY if it touches a rung — a door↔door road (RN→BSN when
    // both ride along as doors) would redraw the foreign ladder the snap left off (QA: "extra lines").
    let edges = allEdges.filter(e => {
      if (shelfSet && (shelfSet.has(e[0]) || shelfSet.has(e[1]))) return false;   // shelf tiles carry no roads
      // a road never lands ON a folded deck: a selected role's cross-family edge into a
      // still-shelved family drew a stray line clear across the zone blocks (his QA
      // screenshot) — the card's Connections menu carries those relationships now
      if (isDeckRep(e[0]) || isDeckRep(e[1])) return false;
      if (lineageSet && lineageSet.has(e[0]) && lineageSet.has(e[1]))
        return lineageRungs.has(e[0]) || lineageRungs.has(e[1]);
      return sameContainer(e) || (selectedId && (e[0]===selectedId || e[1]===selectedId));
    });
    if (lineageSet){
      // ONE road per door — several rungs can share a door (RRT→CIA and ACCS→CIA are both
      // real edges) but parallel lines into the same tile read as duplicates (QA). The
      // tier-closest rung keeps the road; a road from the selected tile itself always wins.
      const tierOf = i => (nodeById.get(i)||{}).tier || 0;
      const best = new Map();
      edges.forEach(e => {
        const r0 = lineageRungs.has(e[0]), r1 = lineageRungs.has(e[1]);
        if (r0 === r1) return;   // rung↔rung roads all stay
        const door = r0 ? e[1] : e[0], rung = r0 ? e[0] : e[1];
        const score = rung === lineRoot ? -1000 : Math.abs(tierOf(rung) - tierOf(door))*10 - tierOf(rung);
        const cur = best.get(door);
        if (!cur || score < cur.score) best.set(door, { e, score });
      });
      const keep = new Set([...best.values()].map(v => v.e));
      edges = edges.filter(e => (lineageRungs.has(e[0]) === lineageRungs.has(e[1])) || keep.has(e));
    }
    const dur = animate ? dcap(520) : 0;   // matches every camera fit (fitToBounds default) so layout + camera tween as ONE motion

    // DECKS: the LEVEL grid only exists once a column does — at rest the packed zones sit off
    // the tier grid, so the axis names and zebra rows stay out until something is expanded
    const levelsIdle = !!(DECKS && collapsedFams && !curFamilyInfo.some(l => !l.deckCell && l.family !== '__mine'));
    if (gBands) gBands.style('opacity', levelsIdle ? 0 : 1);
    if (gAxis) gAxis.style('opacity', levelsIdle ? 0 : 1).style('pointer-events', levelsIdle ? 'none' : null);
    axisShown = !levelsIdle;   // fits reserve the axis strip only while the axis is actually up

    // level bands + numbered chips (clearly defined level markers)
    const meta = DATA.meta;
    const labels = curClass==='roles' ? meta.tierLabelsRoles : meta.tierLabelsPatients;
    const prefix = curClass==='roles' ? 'L' : 'S';
    // BENCH mode: the tier grid belongs to the bench — its rows and stripes stop where the
    // shelves begin, and only bench tiers earn axis chips (shelf decks sit off the grid)
    const benchLanes = (DECKS && collapsedFams && !lineageSet) ? curFamilyInfo.filter(l => !l.deckCell) : null;
    const gridIds = (benchLanes && benchLanes.length)
      ? [...visSet].filter(id => { const n = nodeById.get(id); return n && benchLanes.some(l => l.family === n.family); })
      : [...visSet];
    const tiersShown = [...new Set(gridIds.map(id=>nodeById.get(id).tier))].sort((a,b)=>a-b);
    const xsAll = [...posMap.values()].map(p=>p.x);
    const cMinX = Math.min(...xsAll), cMaxX = Math.max(...xsAll);
    let bandL = cMinX - 290, bandR = cMaxX + 80;
    if (benchLanes && benchLanes.length){
      bandL = Math.min(...benchLanes.map(l=>l.left)) - 290;
      bandR = Math.max(...benchLanes.map(l=>l.right)) + 60;
    }

    // full-width zebra stripes + row lines stay in CONTENT space (they pan with the tiles)
    const band = gBands.selectAll('g.hct-band').data(tiersShown, d=>d);
    band.exit().remove();
    const bEnter = band.enter().append('g').attr('class','hct-band');
    bEnter.append('rect').attr('class','hct-band-rect');
    bEnter.append('line').attr('class','hct-band-line');
    const bAll = bEnter.merge(band);
    bAll.select('.hct-band-rect')
      .attr('x', bandL).attr('y', d => d*ROWH - ROWH/2)
      .attr('width', bandR - bandL).attr('height', ROWH)
      .attr('fill', d => d % 2 ? 'rgba(255,255,255,0.018)' : 'rgba(255,255,255,0.042)');
    bAll.select('.hct-band-line')
      .attr('x1', bandL).attr('x2', bandR)
      .attr('y1', d => d*ROWH - ROWH/2).attr('y2', d => d*ROWH - ROWH/2);

    // numbered level chips live in the FROZEN axis (pinned left while you slide the board)
    drawFrozenAxis(tiersShown, d => prefix + d, d => (labels[d] || ('Level ' + d)));

    // header geometry (stacked: region · pathway · discipline)
    const pcfg = DATA.classes[curClass].pathways || {};
    const fcfg = DATA.classes[curClass].families || {};
    const minTierShown = tiersShown.length ? tiersShown[0] : 0;
    const topY = minTierShown*ROWH - ROWH/2;
    const allYpos = [...posMap.values()].map(p=>p.y);
    const regBot = (allYpos.length ? Math.max(...allYpos) : 0) + ROWH/2;
    // each label sits clearly ABOVE its box top (never on the border) — generous buffers
    const famY  = topY - 20;     // discipline label
    const headY = topY - 46;     // pathway title
    const regY  = topY - 74;     // region label
    // boxes wrap the GRID only — they start just above the first level (BELOW the pinned header band), so the clip
    // never slices their rounded tops. The labels live up in the frozen header band, not inside the boxes.
    const dcTop = topY - 2,  dcBot = regBot + 8;    // discipline (sub-career) box
    const pcTop = topY - 5,  pcBot = regBot + 16;   // pathway box (the larger container)
    const rcTop = topY - 8,  rcBot = regBot + 28;   // region box (outermost, faint)

    // blueprint navigation bounds: full vertical extent (header labels → bottom) + horizontal node spread
    navTopY = regY - 14; navBotY = rcBot + 16;
    // bench shelves: the CLINICAL kicker rides above the shelf's top row — the nav bounds
    // need that headroom or the top-aligned fit parks the label under the clip line, leaving
    // a stray mark floating over the zones (his screenshot: the lone dash above THERAPEUTIC)
    if (deckShelves && deckShelves.length) navTopY = Math.min(navTopY, Math.min(...deckShelves.map(s => s.top)) - 118);
    { const nxs = [...posMap.values()].map(p=>p.x); navMinX = nxs.length ? Math.min(...nxs) : 0; navMaxX = nxs.length ? Math.max(...nxs) : 0; }
    // pinned header band: top (region label) to bottom (family label) — feeds the frozen-top transform + its bg.
    // DECKS (roles): pathway AND family names both live on their boxes now — the band keeps only
    // the region row. The patients class keeps the full band (its board has no container chrome).
    const decksHeaders = !!(DECKS && collapsedFams && curClass === 'roles');
    // DECKS retires the pinned band entirely — kickers + on-map labels own the wayfinding,
    // and the freed top strip is where the ON YOUR PATH row lives while snapped
    headPinY = regY - 8; headBandY = decksHeaders ? headPinY + 1 : famY + 18;
    if (gTopBg) gTopBg.style('display', decksHeaders ? 'none' : null)
      .attr('x', navMinX - 8000).attr('y', headPinY - 200).attr('width', (navMaxX - navMinX) + 16000).attr('height', (headBandY - headPinY) + 200);
    applyNavLimits();
    updateHeadClip(d3.zoomTransform(svg.node()).k);
    syncAxisPos();   // relayout may have moved the field's left edge (snap/expand) with no camera event

    // DECKS: one rule for every family box — hug the family's VISIBLE tiers (deck = its entry
    // row, spine/fan = its real range). The large region + pathway frames retire entirely in
    // decks mode (David's call: the top band already names the groups; the frames were empty).
    // during a snap exactly ONE box exists: the home ladder's. A family opened EARLIER whose
    // lane shrank to door tiles must not keep its frame (his VP screenshot: EMS, Behavioral,
    // Revenue boxes were bench leftovers riding into the snap)
    const snapHome = (lineageSet && lineRoot) ? ((nodeById.get(lineRoot) || {}).family || null) : null;
    let deckExt = null, pwExt = null;
    if (DECKS && collapsedFams){
      deckExt = new Map(); pwExt = new Map();
      visSet.forEach(id => { const n = nodeById.get(id); if (!n) return;
        const e = deckExt.get(n.family) || [Infinity, -Infinity];
        e[0] = Math.min(e[0], n.tier); e[1] = Math.max(e[1], n.tier);
        deckExt.set(n.family, e);
        // zone (pathway) vertical extent rides the SHELF decks only — a checked-out bench
        // column is no longer in its zone (the box must not stretch across to the bench)
        if (!isDeckRep(id)) return;
        const p = posMap.get(id); if (!p) return;
        const z = pwExt.get(n.pathway) || [Infinity, -Infinity];
        z[0] = Math.min(z[0], p.y); z[1] = Math.max(z[1], p.y);
        pwExt.set(n.pathway, z); });
    }
    // nested containers (roles only): region > pathway > a box per sub-career discipline
    if (curClass === 'roles' && curLaneInfo && curLaneInfo.length){
      const sideG = {};
      curLaneInfo.forEach(g => { (sideG[g.side] = sideG[g.side] || []).push(g); });
      const regionBoxes = Object.keys(sideG).map(side => {
        const gs = sideG[side];
        return { side, left: Math.min(...gs.map(g=>g.left)), right: Math.max(...gs.map(g=>g.right)) };
      });
      const rb = gContainers.selectAll('rect.hct-rcontainer').data(deckExt ? [] : regionBoxes, d=>d.side);
      rb.exit().remove();
      rb.enter().append('rect').attr('class','hct-rcontainer').merge(rb)
        .attr('x', d=>d.left-24).attr('y', rcTop).attr('width', d=>(d.right-d.left)+48).attr('height', rcBot-rcTop).attr('rx', 18);
      // DECKS: the pathway box comes BACK as the zone — hugged to its content's real vertical
      // extent, wrapping the packed deck block plus any open columns, with its name fixed on it
      const pb = gContainers.selectAll('rect.hct-pcontainer').data(deckExt ? curLaneInfo.filter(g => pwExt.has(g.pathway)) : curLaneInfo, d=>d.pathway);
      pb.exit().remove();
      pb.enter().append('rect').attr('class','hct-pcontainer').merge(pb)
        .attr('x', d=>d.left-12).attr('width', d=>(d.right-d.left)+24).attr('rx', 13)
        .attr('y', d => { const z = pwExt && pwExt.get(d.pathway); return z ? z[0] - ROWH/2 - 34 : pcTop; })   // headroom clears the family-name band inside
        .attr('height', d => { const z = pwExt && pwExt.get(d.pathway); return z ? (z[1] - z[0]) + ROWH + 40 : (pcBot - pcTop); })
        .attr('stroke', d=>(pcfg[d.pathway]||{}).color||'#888').attr('fill', d=>(pcfg[d.pathway]||{}).color||'#888');
      // DECKS: boxes belong to OPENED columns (and the snap's home). Door lanes stay bare tiles
      // with their roads — a dozen one-hex boxes read as "unnecessary grids" (his words) — and
      // the top pins shelf carries a header, never a box (its full-height fallback was the
      // giant frame covering the board in his QA captures).
      const db = gContainers.selectAll('rect.hct-dcontainer').data(
        deckExt ? curFamilyInfo.filter(d => !d.deckCell && d.family !== '__mine' && (lineageSet ? d.family === snapHome : !collapsedFams.has(d.family))) : curFamilyInfo,
        d=>d.pathway+'|'+d.family);
      db.exit().remove();
      db.enter().append('rect').attr('class','hct-dcontainer').merge(db)
        .attr('x', d=>d.left-5).attr('width', d=>(d.right-d.left)+10).attr('rx', 9)
        // DECKS lane boxes carry 26px of HEADROOM so the family name lives INSIDE the box,
        // in its own band, clear of the zone label above (his overlap screenshots)
        .attr('y', d => { const e = deckExt && deckExt.get(d.family); return e ? e[0]*ROWH - ROWH/2 - (d.deckCell ? 0 : 26) : dcTop; })
        .attr('height', d => { const e = deckExt && deckExt.get(d.family); return e ? (e[1]-e[0]+1)*ROWH + (d.deckCell ? 0 : 26) : (dcBot - dcTop); })
        .attr('stroke', d=>(fcfg[d.family]||{}).color||'#4ECDC4').attr('fill', d=>(fcfg[d.family]||{}).color||'#4ECDC4');
      // DECKS: the family name rides its OWN box in content space — fixed to the container,
      // not floating in the band. Folded decks skip it (the deck face already says the name).
      const bl = gContainers.selectAll('text.hct-boxlbl').data(
        deckExt ? curFamilyInfo.filter(d => d.family !== '__mine' && !d.deckCell && (lineageSet ? d.family === snapHome : !collapsedFams.has(d.family)) && deckExt.get(d.family)) : [],   // bench: opened columns · snap: the home ladder ONLY
        d=>d.pathway+'|'+d.family);
      bl.exit().remove();
      bl.enter().append('text').attr('class','hct-boxlbl')
        .merge(bl)
        .attr('x', d=>d.left + 8).attr('text-anchor','start')   // left-anchored (zone-label grammar): the right corner belongs to the fold button
        .attr('fill', d=>(fcfg[d.family]||{}).color||'#4ECDC4')
        .style('pointer-events','all')
        .style('cursor', d => (!lineageSet && famOpenOrder.indexOf(d.family) >= 0 && famOpenOrder.length > 1) ? 'grab' : 'pointer')
        .on('mousedown.reorder', e => e.stopPropagation())      // the zoom behavior must not turn a column grab into a pan
        .on('touchstart.reorder', e => e.stopPropagation())
        .on('pointerdown.reorder', (e,d) => startColDrag(e, d))
        .on('click', (e,d) => { e.stopPropagation(); if (colDragMoved){ colDragMoved = false; return; } fitGroup(d.left, d.right, true); })
        .each(function(d){
          // the fit ladder itself moved to fitBoxLabel (zoom-ticked): at far zoom the names
          // SCALE UP like the zone labels — his all-open screenshot rendered them ~4px, which
          // read as "the groupings have no names". Here we just stage the measurements.
          const e2 = deckExt.get(d.family);
          const hasBtn = !lineageSet && famOpenOrder.indexOf(d.family) >= 0;
          const full = (fcfg[d.family]||{}).label || d.family;
          this.dataset.full = full;
          this.dataset.first = String(full).split(/[ /]/)[0];
          this.dataset.bandy = e2[0]*ROWH - ROWH/2 - 8;
          this.dataset.boxtop = e2[0]*ROWH - ROWH/2 - 26;
          this.dataset.max = (d.right - d.left) + (hasBtn ? -58 : 16);   // -58 clears the fold button at its 1.8 scale cap
          this.dataset.lane = (d.right - d.left);
          this.dataset.wf = ''; this.dataset.w1 = ''; this.dataset.fitsig = '';   // stale on relayout — remeasure + refit
        });
      // the render's forced syncHeadType below runs the first fit for fresh labels
      // sector tags over the stacked door columns: the boxes went, the names must not
      const dt2 = gContainers.selectAll('text.hct-doortag').data(doorTags || [], d=>d.fam);
      dt2.exit().remove();
      dt2.enter().append('text').attr('class','hct-doortag')
        .merge(dt2)
        .attr('x', d=>d.x).attr('y', d=>d.y).attr('text-anchor','middle')
        .attr('fill', d=>(fcfg[d.fam]||{}).color||'#9fb')
        .text(d=>String((fcfg[d.fam]||{}).label||d.fam).split(/[ /]/)[0].toUpperCase());
      // BENCH: every open column carries its SECTOR tag above the box. A checked-out family
      // leaves its zone box behind on the shelf — and with every family open there is no zone
      // box left at all (his all-open screenshot: no grouping names anywhere). The tag travels.
      const bt = gContainers.selectAll('text.hct-benchtag').data(
        (deckExt && !lineageSet) ? curFamilyInfo.filter(d => !d.deckCell && d.family !== '__mine' && !collapsedFams.has(d.family) && deckExt.get(d.family)) : [],
        d=>d.pathway+'|'+d.family);
      bt.exit().remove();
      bt.enter().append('text').attr('class','hct-benchtag')
        .merge(bt)
        .attr('text-anchor','middle')
        .attr('data-zx', d => (d.left + d.right) / 2)
        .attr('data-zy', d => { const e2 = deckExt.get(d.family); return e2[0]*ROWH - ROWH/2 - 60; })   // clear of the box label's float rung
        .attr('fill', d=>(pcfg[d.pathway]||{}).color||'#9fb')
        .text(d => PW_SHORT[d.pathway] || String((pcfg[d.pathway]||{}).label || d.pathway).split(' ')[0].toUpperCase());
      // DECKS: the pathway name rides its zone box too — every header fixed to the thing it names
      const zl = gContainers.selectAll('text.hct-zonelbl').data(deckExt ? curLaneInfo.filter(g => pwExt.has(g.pathway)) : [], d=>d.pathway);
      zl.exit().remove();
      zl.enter().append('text').attr('class','hct-zonelbl')
        .merge(zl)
        .attr('text-anchor','start')
        .attr('data-zx', d=>d.left - 6)
        .attr('data-zy', d => { const z = pwExt.get(d.pathway); return (z ? z[0] - ROWH/2 - 34 : pcTop) - 8; })
        .attr('fill', d=>(pcfg[d.pathway]||{}).color||(d.pathway==='__mine'?'#4ECDC4':'#ccc'))
        .style('cursor','pointer').style('pointer-events','all')
        .on('click', (e,d) => { e.stopPropagation(); fitGroup(d.left, d.right, true); })
        .each(function(d){
          const t = d3.select(this); t.text(null);
          const full = (pcfg[d.pathway]||{}).label || d.pathway;
          t.append('tspan').attr('class','zl-name').text(full);
          t.append('tspan').attr('class','zl-short').style('display','none').text(PW_SHORT[d.pathway] || String(full).split(' ')[0]);
          const c = pwRoleCount(d.pathway);
          if (c) t.append('tspan').attr('class','zl-count').attr('dx', 9).attr('fill', 'rgba(160,195,210,0.55)').style('font-weight', 600).text(plRoles(c));
          this.dataset.avail = (d.right - d.left) + 16;   // open-all moved INTO the box, the label line is the name's again
          measureZoneLbl(this);   // reads 0 while the tab is hidden; syncZoneLabels re-measures once visible
        });
      // the ◂ ▸ arrows retired with the band decluttered — DRAG owns reordering now
      gContainers.selectAll('text.hct-shuf').remove();
      // container actions as ICON BUTTONS living INSIDE the box's top-right corner (his call:
      // in the container, not on top of it): + deals the zone's every family out, x folds a
      // column. Top-right anchored, so the counter-scale grows them INWARD, never past the edge.
      const actData = [];
      if (deckExt && !lineageSet){
        curLaneInfo.forEach(g => { if (!pwExt.has(g.pathway)) return; const z = pwExt.get(g.pathway);
          actData.push({ key:'z:'+g.pathway, kind:'openall', pathway:g.pathway, zx: g.right + 6, zy: z[0] - ROWH/2 - 28 }); });
        curFamilyInfo.forEach(d => { if (d.deckCell || d.family === '__mine' || famOpenOrder.indexOf(d.family) < 0) return;
          const e2 = deckExt.get(d.family); if (!e2) return;
          actData.push({ key:'f:'+d.family, kind:'fold', fam:d.family, zx: d.right - 1, zy: e2[0]*ROWH - ROWH/2 - 24 });
          // fanned columns carry their own way back to the spine (the chip's Simplify, now on the box)
          if (famFanned.has(d.family)) actData.push({ key:'s:'+d.family, kind:'simplify', fam:d.family, zx: d.right - 34, zy: e2[0]*ROWH - ROWH/2 - 24 }); });
      }
      const ab2 = gContainers.selectAll('g.hct-cact').data(actData, d=>d.key);
      ab2.exit().remove();
      const abE = ab2.enter().append('g').attr('class','hct-cact');
      abE.append('rect').attr('x', -30).attr('y', 0).attr('width', 30).attr('height', 30).attr('rx', 8);
      abE.append('path');
      const abA = abE.merge(ab2);
      abA.attr('data-kind', d=>d.kind)
        .attr('data-zx', d=>d.zx).attr('data-zy', d=>d.zy)
        .attr('transform', function(){ return 'translate(' + this.dataset.zx + ',' + this.dataset.zy + ') scale(' + Math.min(lastZoneScale, 1.8) + ')'; })
        .style('cursor','pointer').style('pointer-events','all')
        .on('mousedown.cact', e => e.stopPropagation())
        .on('touchstart.cact', e => e.stopPropagation())
        .on('click', (e,d) => { e.stopPropagation();
          if (d.kind === 'openall') openZone(d.pathway);
          else if (d.kind === 'simplify'){ famFanned.delete(d.fam); render(true); announce('Back to the simple line'); }
          else foldColumn(d.fam); });
      abA.select('path').attr('d', d => d.kind === 'openall' ? 'M-15 8 V22 M-22 15 H-8'
        : d.kind === 'simplify' ? 'M-11 9 L-17 15 L-11 21 M-5 9 L-11 15 L-5 21'   // chevrons-left: fan folds back to the spine
        : 'M-20 10 L-10 20 M-10 10 L-20 20');
      // FULL REST: the region names become shelf kickers ON the map (the pinned pair retires with the band)
      const sl = gContainers.selectAll('text.hct-shelflbl').data(deckShelves || [], d=>d.side);
      sl.exit().remove();
      sl.enter().append('text').attr('class','hct-shelflbl')
        .merge(sl)
        .attr('text-anchor','start')
        .attr('data-zx', d=>d.left - 12).attr('data-zy', d=>d.top - 84)
        .style('cursor','pointer').style('pointer-events','all')
        .on('click', (e,d) => { e.stopPropagation(); const b = regionBounds(d.side); if (b) fitGroup(b[0], b[1], true); })
        .text(d=>d.side==='clinical' ? 'CLINICAL · patient care' : 'BUSINESS · non-clinical');
      syncZoneLabels();   // fresh labels fit + scale immediately (a same-sig camera fit won't re-run it)
    } else {
      gContainers.selectAll('*').remove();
    }

    // pathway-group headers (both classes — roles pathways and patient journeys)
    const headData = decksHeaders ? [] : curLaneInfo;   // DECKS roles: pathway titles ride their zone boxes instead
    const hd = gHeaders.selectAll('g.hct-phead').data(headData, d=>d.pathway);
    hd.exit().remove();
    const hdE = hd.enter().append('g').attr('class','hct-phead');
    hdE.append('text').attr('class','hct-phead-txt');
    hdE.append('rect').attr('class','hct-phead-bar');
    const hdA = hdE.merge(hd);
    hdA.select('.hct-phead-txt')
      .attr('x', d=>d.cx).attr('y', headY).attr('text-anchor','middle')
      .attr('fill', d=>(pcfg[d.pathway]||{}).color||(d.pathway==='__mine'?'#4ECDC4':'#ccc'))
      .style('cursor','pointer').style('pointer-events','all')
      .on('click', (e,d) => { e.stopPropagation(); fitGroup(d.left, d.right, true); })
      .text(d=>d.pathway==='__mine' ? 'ON YOUR PATH' : ((pcfg[d.pathway]||{}).label||d.pathway))
      .each(function(d){   // a snapped door lane is one tile wide — a long pathway title overprints its neighbors (QA); the discipline label below carries the name instead
        this.style.display = '';
        if (this.getComputedTextLength() > (d.right - d.left) + 30) this.style.display = 'none';
      });
    hdA.select('.hct-phead-bar')
      .attr('x', d=>d.left+6).attr('width', d=>Math.max(24,(d.right-d.left)-12))
      .attr('y', headY+9).attr('height',4).attr('rx',2)
      .attr('opacity', curClass==='roles' ? 0 : 0.8)   // the pathway box border replaces the bar
      .attr('fill', d=>(pcfg[d.pathway]||{}).color||'#888');

    // discipline sub-labels
    const fd = gHeaders.selectAll('text.hct-fhead').data(
      (curClass==='roles' && !decksHeaders) ? curFamilyInfo : [],   // DECKS roles: families are named ON their boxes (the shelf's tag rides its zone label)
      d=>d.pathway+'|'+d.family);
    fd.exit().remove();
    fd.enter().append('text').attr('class','hct-fhead')
      .merge(fd)
      .attr('x', d=>d.cx).attr('y', famY).attr('text-anchor','middle')
      .attr('fill', d=>(fcfg[d.family]||{}).color||'#9fb')
      .text(d=>d.family==='__mine' ? 'Your pins' : ((fcfg[d.family]||{}).label||d.family))
      .each(function(d){   // same guard, looser slack — this row is the lane's last name tag
        this.style.display = '';
        if (this.getComputedTextLength() > (d.right - d.left) + 52) this.style.display = 'none';
      });

    // region divider + CLINICAL / BUSINESS headers
    const regData = (curClass==='roles' && curRegionInfo && !decksHeaders) ? [curRegionInfo] : [];   // DECKS: the shelf kickers carry the region names
    // divider LINE lives in the CONTENT layer (spans full height, scrolls with the board); labels pin in the header band
    const rgDiv = gContainers.selectAll('line.hct-region-div').data(regData);
    rgDiv.exit().remove();
    rgDiv.enter().append('line').attr('class','hct-region-div').merge(rgDiv)
      .attr('x1', d=>d.dividerX).attr('x2', d=>d.dividerX).attr('y1', topY-8).attr('y2', regBot);
    const rg = gHeaders.selectAll('g.hct-region').data(regData);
    rg.exit().remove();
    const rgE = rg.enter().append('g').attr('class','hct-region');
    rgE.append('text').attr('class','hct-region-lbl hct-region-clin').text('CLINICAL · patient care');
    rgE.append('text').attr('class','hct-region-lbl hct-region-biz').text('BUSINESS · non-clinical');
    const rgA = rgE.merge(rg);
    rgA.select('.hct-region-clin').attr('x', d=>d.clinicalCx).attr('y', regY).attr('text-anchor','middle')
      .style('cursor','pointer').style('pointer-events','all')
      .on('click', (e) => { e.stopPropagation(); const b=regionBounds('clinical'); if(b) fitGroup(b[0],b[1],true); });
    rgA.select('.hct-region-biz').attr('x', d=>d.businessCx).attr('y', regY).attr('text-anchor','middle')
      .style('cursor','pointer').style('pointer-events','all')
      .on('click', (e) => { e.stopPropagation(); const b=regionBounds('business'); if(b) fitGroup(b[0],b[1],true); });
    syncHeadType(d3.zoomTransform(svg.node()).k, true);   // fresh header labels pick up the zoom-floored type size (force past the write cache)

    // edges
    const edgeSel = gEdges.selectAll('path.hct-edge').data(edges, d => d[0]+'>'+d[1]);
    edgeSel.exit().transition().duration(Math.min(dur,160)).style('opacity',0).remove();   // same fast clear as tiles
    edgeSel.enter().append('path').attr('class','hct-edge').style('opacity',0)
      .merge(edgeSel)
      .attr('stroke', d => famColor(d[1]))
      .attr('stroke-width', 1.6)
      .transition().duration(dur)
      .style('opacity', d => edgeOpacity(d))
      .attr('d', d => edgePath(posMap.get(d[0]), posMap.get(d[1])));

    // nodes
    const nodeSel = gNodes.selectAll('g.hct-node').data([...visSet], d=>d);
    // DECKS: tiles that fold away GATHER into their new pile (stack first, else the deck) as
    // they fade — the reverse of the deal. Anything else clears fast, the original contract.
    const foldTarget = d => {
      if (!DECKS || !collapsedFams) return null;
      const n = nodeById.get(d); if (!n) return null;
      const sr = stackByFT.get(n.family + '|' + n.tier);
      if (sr && posMap.has(sr)) return posMap.get(sr);
      const dr = deckRep.get(n.family);
      return (collapsedFams.has(n.family) && dr && posMap.has(dr)) ? posMap.get(dr) : null;
    };
    nodeSel.exit().each(function(d){
      const t = foldTarget(d), s = d3.select(this);
      if (t) s.transition().duration(dur).attr('transform', `translate(${t.x},${t.y})`).style('opacity', 0).remove();
      else s.transition().duration(Math.min(dur,160)).style('opacity', 0).remove();   // departing tiles clear FAST so they don't ghost through the slide
    });

    const enter = nodeSel.enter().append('g').attr('class','hct-node')
      .attr('transform', d => {
        // DECKS: a tile born from an unfold DEALS from where its pile stood last render —
        // the tier's stack if it had one, else the family's deck. Everything else is born in place.
        const p = posMap.get(d);
        if (DECKS && collapsedFams && !prevPos.has(d)){
          const n = nodeById.get(d);
          if (n){
            const ps = prevStackByFT.get(n.family + '|' + n.tier);
            if (ps && prevPos.has(ps)) { const o = prevPos.get(ps); return `translate(${o.x},${o.y})`; }
            const dr = deckRep.get(n.family);
            if (dr && prevPos.has(dr)) { const o = prevPos.get(dr); return `translate(${o.x},${o.y})`; }
          }
        }
        return `translate(${p.x},${p.y})`;
      })
      .style('opacity', 0)
      .on('click', (e,d) => { e.stopPropagation(); onNodeClick(d); })
      .on('mouseenter', (e,d) => onHover(d, true, e))
      .on('mousemove', (e) => moveTip(e))
      .on('mouseleave', (e,d) => onHover(d, false));

    enter.append('path').attr('class','hx-back').attr('d', hexPath(0,0,R-2));
    enter.append('path').attr('class','hx-pinring').attr('d', hexPath(0,0,R+6));
    enter.append('path').attr('class','hx-body').attr('d', hexPath(0,0,R-2));
    enter.append('text').attr('class','hx-title');
    enter.append('text').attr('class','hx-abbr');

    const all = enter.merge(nodeSel);
    all.transition().duration(dur)
      .style('opacity', d => (lineageSet && !lineageSet.has(d) && !(shelfSet && shelfSet.has(d))) ? 0.12 : 1)   // off the selected career line = collapsed back; shelf pins stay lit
      .attr('transform', d => { const p = posMap.get(d); return `translate(${p.x},${p.y})`; });

    paintHexBodies(all.select('.hx-body'));   // colorMode-aware: family palette, or BLS pay/growth heatmap

    // tile content: full title (auto-wrapped) + abbreviation (degree now lives in the beside education hex)
    const LH = 9.5;
    all.select('.hx-title').each(function(d){
      const n = nodeById.get(d);
      const lines = wrapLabel(n.label, 14);
      const titleH = lines.length * LH;
      const gap1 = 4, abbrH = 11;
      const blockH = titleH + gap1 + abbrH;
      let top = -blockH/2;
      // the bottom sliver band (y 23+) belongs to the action button — a 4-line title used to
      // push the abbr down into it (his LPN/LVN screenshot). Clamp the block so the abbr
      // baseline stays clear; the overflow rides UP into the hex's wider midriff.
      const abBase = top + titleH + gap1 + 9;
      if (abBase > 19) top -= (abBase - 19);
      const t = d3.select(this);
      t.attr('text-anchor','middle').attr('font-size', 8);
      t.selectAll('tspan').remove();
      lines.forEach((ln,i) => t.append('tspan').attr('x',0).attr('y', top + 7 + i*LH).text(ln));
      n.__abbrY = top + titleH + gap1 + 9;
    });

    all.select('.hx-abbr').each(function(d){
      const n = nodeById.get(d);
      d3.select(this).attr('text-anchor','middle').attr('y', n.__abbrY || 12).text(n.abbr);
    });

    // DECKS: the entry tile of a folded column dresses as the family deck — name + count on a
    // slightly larger hex. Expanded columns re-run the standard content above, so a former
    // deck snaps back to its role face with zero special-casing.
    all.classed('hct-deck', d => isDeckRep(d));
    all.select('.hx-body').attr('d', d => hexPath(0, 0, isDeckRep(d) ? R + 5 : R - 2));
    all.select('.hx-back').attr('d', d => hexPath(0, 0, isDeckRep(d) ? R + 5 : R - 2));
    if (DECKS) all.filter(d => isDeckRep(d)).each(function(d){
      const n = nodeById.get(d);
      const famLbl = ((DATA.classes[curClass].families[n.family] || {}).label) || n.family;
      const lines = wrapLabel(famLbl, 12);
      const top = -(lines.length * 9.5 + 4 + 11) / 2;
      const t = d3.select(this).select('.hx-title');
      t.selectAll('tspan').remove();
      lines.forEach((ln,i) => t.append('tspan').attr('x',0).attr('y', top + 7 + i*9.5).text(ln));
      n.__abbrY = top + lines.length * 9.5 + 4 + 9;
      // family name + count only — the entry role's name comes OFF the face (his call:
      // "we don't need the name of the roles in the collapsed tiles")
      const ab = d3.select(this).select('.hx-abbr').attr('y', n.__abbrY).style('font-size','10px');
      ab.text(null);
      ab.append('tspan').attr('x', 0).text(plRoles(famRoleCount(n.family)));
    });
    // DECKS: a tier's off-spine roles pile into a STACK — offset ghost hexes behind the rep
    // sell the pile, "+N more" names it, one tap fans the family out sideways
    if (DECKS){
      all.classed('hct-stack', d => stackReps.has(d));
      all.selectAll('path.hx-stackghost').remove();
      all.filter(d => stackReps.has(d)).each(function(d){
        const info = stackReps.get(d), g = d3.select(this);
        [[11,8],[5.5,4]].forEach(off => g.insert('path', '.hx-back').attr('class','hx-stackghost').attr('d', hexPath(off[0], off[1], R - 2)));
        const t = g.select('.hx-title'); t.selectAll('tspan').remove();
        t.append('tspan').attr('x', 0).attr('y', -1).text('+' + info.count + ' more');
        const n = nodeById.get(d); n.__abbrY = 13;
        g.select('.hx-abbr').attr('y', 13).style('font-size','10px').text('tap to fan');
      });
    }

    all.select('.hx-pinring').style('stroke-dasharray', d => roleLayerInBuild(d) === 'future' ? '7 5' : null)
      .transition().duration(dur).style('opacity', d => pinned.has(d) ? 1 : 0);
    styleTiles();   // uses current lodFar (kept in sync by zoom events + syncLOD after fit)
    syncHexActs();  // the verbs ride their hexes (Focus line / Show all pills)
    renderAppliedStrip();   // the filter chip rides every board paint (decks moved the state verbs onto the field)
  }

  // ── on-hex action pills (his call: the verb rides the tile, not the top bar) ──
  // Focus line hangs off the looked-at hex, Show all off the focused one; both can show at
  // once on different hexes. Solid tags on the TOP layer — they may overlap the tier below,
  // which is why they only exist while a selection does.
  function syncHexActs(){
    if (!gActs) return;
    const acts = [];
    if (DECKS && collapsedFams){
      if (selectedId && posMap.has(selectedId) && (!lineageSet || selectedId !== focusId))
        acts.push({ kind: 'arm', id: selectedId, label: 'Focus line' });
      if (lineageSet && focusId && posMap.has(focusId))
        acts.push({ kind: 'showall', id: focusId, label: 'Show all' });
    }
    const sel = gActs.selectAll('g.hct-hexact').data(acts, d => d.kind);
    sel.exit().remove();
    const en = sel.enter().append('g').attr('class', 'hct-hexact');
    en.append('title');
    // the button IS the hex's bottom sliver (his call) — same inset outline as the hx-body,
    // cut at y=23, so it reads as part of the tile and can never touch a neighbor. It rides
    // the tile 1:1 (no counter-scale: a scaled sliver would outgrow its own hex).
    en.append('path').attr('class', 'act-bg').attr('d', 'M-43 23 L43 23 L43 25.5 L0 50 L-43 25.5 Z');
    en.append('circle').attr('cx', 0).attr('cy', 31).attr('r', 3.5);
    en.append('path').attr('class', 'act-ic');
    const allA = en.merge(sel);
    allA.attr('data-kind', d => d.kind)
      .attr('role', 'button').attr('tabindex', 0).attr('aria-label', d => d.kind === 'arm' ? 'Focus this career line' : 'Show all roles')
      .style('pointer-events', 'all')
      .on('mousedown.hexact', e => e.stopPropagation())
      .on('touchstart.hexact', e => e.stopPropagation())
      .on('click', (e, d) => { e.stopPropagation(); if (d.kind === 'arm') armFocus(d.id); else { exitFocus(); announce('Showing all roles'); } })
      .on('keydown', (e, d) => { if (e.key !== 'Enter' && e.key !== ' ') return; e.preventDefault(); e.stopPropagation(); if (d.kind === 'arm') armFocus(d.id); else { exitFocus(); announce('Showing all roles'); } });
    allA.select('title').text(d => d.kind === 'arm' ? 'Focus this career line' : 'Show all roles');
    // icon per verb: crosshair = collapse to this line, out-arrows = open the field back up
    allA.select('circle').style('display', d => d.kind === 'arm' ? null : 'none');
    allA.select('path.act-ic').attr('d', d => d.kind === 'arm'
      ? 'M0 24.5 V27 M0 37.5 V35 M-7 31 H-4.5 M7 31 H4.5'
      : 'M1 29.5 L5 25.5 M5 25.5 H2.2 M5 25.5 V28.3 M-1 32.5 L-5 36.5 M-5 36.5 H-2.2 M-5 36.5 V33.7');
    allA.each(function(d){
      const p = posMap.get(d.id);
      this.setAttribute('transform', 'translate(' + p.x + ',' + p.y + ')');
    });
  }

  function applyLOD(far){ lodFar = far; svg.classed('hct-far', far); styleTiles(); }
  function syncLOD(){ applyLOD(d3.zoomTransform(svg.node()).k < 0.5); }

  // the axis hugs the field: its right edge rides the content's left edge, pinning to the
  // viewport's left only when the field scrolls underneath it. Re-synced on zoom AND on
  // relayout (the snap changes navMinX without a camera move).
  function syncAxisPos(t){
    if (!gAxis || !svg.node()) return;
    t = t || d3.zoomTransform(svg.node());
    const fieldL = t.x + t.k * (navMinX - 70);
    gAxis.attr('transform', 'translate(' + Math.max(0, fieldL - t.k * AXIS_W) + ',' + t.y + ') scale(' + t.k + ')');
  }
  // left axis for the Career board — floating level NAMES (no chips, no L-numbers) that hug
  // the field's left edge and only pin to the viewport when the field scrolls past it
  function drawFrozenAxis(tiers, numFn, txtFn){
    if (!gAxis) return;
    const W = AXIS_W;
    const top = (tiers.length ? tiers[0] : 0) * ROWH - ROWH/2;
    const bot = (tiers.length ? tiers[tiers.length-1] : 0) * ROWH + ROWH/2;
    let bg = gAxis.select('rect.axis-bg');
    if (bg.empty()) bg = gAxis.insert('rect', ':first-child').attr('class','axis-bg');
    bg.attr('x', -6000).attr('y', top).attr('width', 6000 + W).attr('height', Math.max(0, bot - top));
    let dv = gAxis.select('line.axis-div');
    if (dv.empty()) dv = gAxis.append('line').attr('class','axis-div');
    dv.attr('x1', W).attr('x2', W).attr('y1', top).attr('y2', bot);
    const sel = gAxis.selectAll('g.axis-chip').data(tiers, d=>d);
    sel.exit().remove();
    const en = sel.enter().append('g').attr('class','axis-chip');
    en.append('text').attr('class','hct-band-txt');
    const all = en.merge(sel);
    all.attr('transform', d => 'translate(0,' + (d*ROWH).toFixed(1) + ')');
    all.select('.hct-band-txt').attr('x', W - 14).attr('y', 5).attr('text-anchor','end').text(txtFn);
  }

  // greedy word-wrap so titles fit a small tile (ignores authored line breaks)
  function wrapLabel(label, maxChars){
    const words = (label || '').replace(/\n/g, ' ').split(/\s+/).filter(Boolean);
    const lines = []; let cur = '';
    words.forEach(w => {
      if (!cur) cur = w;
      else if ((cur + ' ' + w).length <= maxChars) cur += ' ' + w;
      else { lines.push(cur); cur = w; }
    });
    if (cur) lines.push(cur);
    return lines.length ? lines : [''];
  }

  // level-of-detail: zoomed out -> show only the abbreviation (clean map).
  // Titles hide via the svg's .hct-far class (opacity fade in CSS) — this pass only moves/sizes
  // the abbrs, and it runs at gesture END, never mid-wheel/pinch (the old display toggle here
  // was THE zoom skitter). font-size goes through style() so its CSS transition can glide it.
  function styleTiles(){
    const far = lodFar;
    gNodes.selectAll('.hx-abbr').each(function(d){
      const n = nodeById.get(d);
      if (!n) return;   // skip tiles from a class that's mid-exit (not in the current data map)
      if (isDeckRep(d) || (DECKS && stackReps.has(d))) return;   // decks + stacks keep their own face at every zoom
      d3.select(this).attr('y', far ? 3 : (n.__abbrY || 12)).style('font-size', (far ? 18 : 10) + 'px');
    });
  }

  // orthogonal route through the gap between rows (avoids running over tiles)
  function edgePath(s, t){
    const r = 11;
    const sx = s.x, tx = t.x;
    const down = s.y <= t.y;
    const sy = down ? s.y + R*0.86 : s.y - R*0.86;   // exit on source
    const ty = down ? t.y - R*0.86 : t.y + R*0.86;   // entry on target
    // the horizontal runs in the band gap ADJACENT to the source row — the raw midpoint
    // put multi-row edges' horizontals dead across an intermediate ROW of tiles (QA:
    // clean lines of promotion, like the other two boards' gutter roads)
    const ym = down ? s.y + ROWH/2 : s.y - ROWH/2;
    if (Math.abs(sx - tx) < 1.5) return `M${sx},${sy} L${tx},${ty}`;
    const sgnY1 = ym > sy ? 1 : -1, sgnY2 = ty > ym ? 1 : -1, sgnX = tx > sx ? 1 : -1;
    return `M${sx},${sy}`+
      ` L${sx},${ym - sgnY1*r} Q${sx},${ym} ${sx + sgnX*r},${ym}`+
      ` L${tx - sgnX*r},${ym} Q${tx},${ym} ${tx},${ym + sgnY2*r}`+
      ` L${tx},${ty}`;
  }
  // an edge stays WITHIN a profession container when both ends share a family (discipline); else it crosses sideways
  function sameContainer(e){ const a = nodeById.get(e[0]), b = nodeById.get(e[1]); return !!(a && b && a.family && a.family === b.family); }
  function edgeOpacity(d){
    if (lineageSet){                                                          // career-line focus: the line lights, the rest collapses
      if (!(lineageSet.has(d[0]) && lineageSet.has(d[1]))) return 0.04;
      return (d[0]===selectedId || d[1]===selectedId) ? 0.95 : 0.7;
    }
    if (selectedId && (d[0]===selectedId || d[1]===selectedId)) return 0.9;   // the clicked tile's connections, bright
    if (pinned.has(d[0]) && pinned.has(d[1])) return 0.9;
    if (sameContainer(d)) return 0.4;                                          // within-profession lines, always visible
    return 0.22;                                                              // a cross-container line only reaches here when selected
  }

  // ── Interaction ────────────────────────────────────────
  function onNodeClick(id){
    // DECKS: tapping a folded family's deck opens the column, it never opens the role panel
    if (isDeckRep(id)){
      const fam = nodeById.get(id).family;
      collapsedFams.delete(fam);
      famOpenOrder.push(fam);
      render(true);
      const l = (curFamilyInfo || []).find(f => f.family === fam);
      if (l){ userZoomed = true; fitToBounds(l.left - 160, l.right + 160, navY()[0], navY()[1], true, 520); }
      announce((((DATA.classes[curClass].families || {})[fam] || {}).label || fam) + ' opened');
      return;
    }
    // DECKS: tapping a tier's stack fans the whole family out sideways
    if (DECKS && stackReps.has(id)){
      const fam = stackReps.get(id).fam;
      famFanned.add(fam);
      render(true);
      const l = (curFamilyInfo || []).find(f => f.family === fam);
      if (l){ userZoomed = true; fitToBounds(l.left - 160, l.right + 160, navY()[0], navY()[1], true, 520); }
      announce('Every role shown');
      return;
    }
    const wasSnapped = !!lineageSet;
    selectedId = (selectedId === id) ? null : id;   // toggle; click again to clear
    if (DECKS && collapsedFams){
      // a tile tap is a LOOK: the card follows it, the board holds its shape — resting,
      // mid-look, or focused alike. The layout no-ops because focusId didn't move; only
      // ink and the card change. Reorganizing belongs to the Focus line chip alone (his:
      // "when you click into something just to get information everything else can change")
      if (selectedId) openPanel(id); else closePanel();
      render(true);
      return;
    }
    if (selectedId) openPanel(id); else closePanel();
    render(true);                                    // reveals this tile's connections
    if (selectedId && lineageSet){ userZoomed = true; revealQueued = null; snapFit(); }   // decks lands on the HOME ladder, classic frames the whole field — same tick + duration as the layout tween; the fit owns the camera, so the queued reveal stands down
    else if (!selectedId && wasSnapped && !isPhone()){ fitDefaultGroup(true); }   // expanded back — desktop returns to the default framing; PHONE PARKS (a deselect must not fly the world)
  }

  function onHover(id, on, e){
    if (on && isDeckRep(id)){
      const n = nodeById.get(id);
      const famL = ((DATA.classes[curClass].families[n.family] || {}).label) || n.family;
      tip.innerHTML = '<div class="tip-fam" style="color:' + famColor(id) + '">' + famL + '</div>' + plRoles(famRoleCount(n.family)) + ' &middot; tap to open the column';
      tip.style.opacity = '1'; if (e) moveTip(e);
      return;
    }
    if (on && DECKS && stackReps.has(id)){
      const info = stackReps.get(id);
      const famL = ((DATA.classes[curClass].families[info.fam] || {}).label) || info.fam;
      tip.innerHTML = '<div class="tip-fam" style="color:' + famColor(id) + '">' + famL + '</div>' + info.count + ' more at this level &middot; tap to fan them out';
      tip.style.opacity = '1'; if (e) moveTip(e);
      return;
    }
    if (on){
      const n = nodeById.get(id);
      const c = DATA.classes[curClass];
      const fam = (c.families[n.family]||{}).label || '';
      let tval = '';   // when the Pay/Growth heatmap is on, give the color a text readout (not color-only)
      if (colorMode !== 'fam'){ const o = (BLS && BLS.roleMap) ? BLS.occupations[BLS.roleMap[id]] : null;
        if (o) tval = '<div class="tip-val">' + (colorMode === 'pay' ? (o.payText || ('$'+Number(o.pay).toLocaleString('en-US'))) + ' median' : ((o.growth>=0?'+':'')+o.growth+'% job growth')) + '</div>'; }
      tip.innerHTML = '<div class="tip-fam" style="color:'+famColor(id)+'">'+fam+'</div>'+ n.label.replace(/\n/g,' ') + tval;
      tip.style.opacity = '1'; if (e) moveTip(e);
      // raise neighbor edges
      gEdges.selectAll('path.hct-edge').style('opacity', d =>
        (d[0]===id||d[1]===id) ? 0.9 : edgeOpacity(d));
    } else {
      tip.style.opacity = '0';
      gEdges.selectAll('path.hct-edge').style('opacity', d => edgeOpacity(d));
    }
  }
  function moveTip(e){
    const wrap = document.getElementById('hct-board').getBoundingClientRect();
    let x = e.clientX - wrap.left + 14, y = e.clientY - wrap.top + 14;
    if (x + 250 > wrap.width) x = e.clientX - wrap.left - 250;
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  }

  // ── Detail panel ───────────────────────────────────────
  // Real pay + outlook from BLS (career-tree-bls.json), keyed role -> SOC -> data
  function blsForRole(n){
    if (!BLS || !BLS.roleMap || curClass !== 'roles') return null;
    const soc = BLS.roleMap[n.id];
    return soc ? BLS.occupations[soc] : null;
  }
  function blsOutlook(g){ return g>=9 ? 'Much faster than average' : (g>=5 ? 'Faster than average' : (g>=3 ? 'As fast as average' : 'Slower than average')); }
  function usdK(n){ return '$' + Math.round(n/1000) + 'k'; }
  function blsBlock(o){
    const g = o.growth, gc = g >= 9 ? 'g-hi' : (g >= 4 ? 'g-mid' : 'g-lo');
    const pay = o.payText || ('$' + Number(o.pay).toLocaleString('en-US'));
    let h = '<div class="hct-bls"><div class="hct-bls-grid">' +
      '<div class="hct-bls-stat"><div class="v">' + esc(pay) + '</div><div class="k">Median pay / yr</div></div>' +
      '<div class="hct-bls-stat"><div class="v ' + gc + '">' + (g >= 0 ? '+' : '') + g + '%</div><div class="k">Job growth, ' + esc(BLS.projYears) + '</div></div>' +
      '</div>';
    if (o.low && o.high && o.high > o.low){
      const pos = Math.max(4, Math.min(96, (o.pay - o.low) / (o.high - o.low) * 100));
      h += '<div class="hct-bls-range"><div class="hct-bls-track"><span class="hct-bls-med" style="left:' + pos.toFixed(1) + '%"></span></div>' +
           '<div class="hct-bls-ends"><span>' + usdK(o.low) + '</span><span>10th–90th pct</span><span>' + usdK(o.high) + '</span></div></div>';
    }
    h += '<div class="hct-bls-outlook">' + blsOutlook(g) + (o.openings ? ' &middot; ~' + Number(o.openings).toLocaleString('en-US') + ' openings/yr' : '') + '</div>';
    if (o.note) h += '<div class="hct-bls-note">' + esc(o.note) + '</div>';
    h += '<div class="hct-bls-src">Source: <a href="' + esc(o.url) + '" target="_blank" rel="noopener">BLS &middot; ' + esc(o.occ) + ' ↗</a> &middot; ' + esc(BLS.wageYear) + '</div></div>';
    return h;
  }
  // ── credential reality (career-tree-creds.json): national first-time pass rate,
  // typical program length, exam fee — keyed by credFace via faceMap. Reality data
  // on the CREDENTIAL, never odds on a person. Empty string when nothing maps.
  function credStats(face){
    if (!CREDS || !CREDS.faceMap || !face) return null;
    const k = CREDS.faceMap[face];
    return k ? (CREDS.credentials||{})[k] : null;
  }
  function credStatsHTML(face){
    const s = credStats(face); if (!s) return '';
    let grid = '';
    if (s.pass != null) grid += '<div class="hct-cred-stat"><div class="v">'+esc(String(s.pass))+'%</div><div class="k">'+esc(s.passLabel || 'First-try pass')+(s.passYear ? ' &middot; '+esc(String(s.passYear)) : '')+'</div></div>';
    if (s.fee) grid += '<div class="hct-cred-stat"><div class="v">'+esc(s.fee)+'</div><div class="k">Exam fee</div></div>';
    let h = '<div class="hct-cred">';
    // the on-ramp: what standing at the program DOOR requires (entrance exams, prereqs,
    // hours — sourced from the orgs/accreditors; the door comes before the exam)
    const e = s.entry;
    if (e && (e.exams || e.prereqs || e.hours || (e.find && e.find.url))){
      h += '<div class="hct-cred-onramp"><div class="hct-cred-oh">Getting in</div>';
      if (e.exams && e.exams.length) h += '<div class="hct-cred-len"><b>Entrance exams:</b> '+esc(e.exams.join(' · '))+'</div>';
      if (e.prereqs && e.prereqs.length) h += '<div class="hct-cred-len"><b>Typical prereqs:</b> '+esc(e.prereqs.join(', '))+'</div>';
      if (e.hours) h += '<div class="hct-cred-len"><b>Experience:</b> '+esc(e.hours)+'</div>';
      if (e.note) h += '<div class="hct-bls-note">'+esc(e.note)+'</div>';
      if (e.find && e.find.url) h += '<a class="hct-jump" href="'+esc(e.find.url)+'" target="_blank" rel="noopener">Find accredited programs ↗'+(e.find.label ? ' · '+esc(e.find.label) : '')+'</a>';
      h += '</div>';
    }
    h += (grid ? '<div class="hct-cred-grid">'+grid+'</div>' : '');
    if (s.length) h += '<div class="hct-cred-len">Typical program: '+esc(s.length)+'</div>';
    if (s.chain) h += '<div class="hct-cred-len">The usual road: '+esc(s.chain)+'</div>';   // prereq chain — sequences, not shelves
    if (s.note) h += '<div class="hct-bls-note">'+esc(s.note)+'</div>';
    h += '<div class="hct-bls-src">Source: <a href="'+esc(s.url)+'" target="_blank" rel="noopener">'+esc(s.org)+' &middot; '+esc(s.exam)+' ↗</a>'+(s.cohort ? ' &middot; '+esc(s.cohort) : '')+'</div></div>';
    return h;
  }
  // the card's second menu (his map-menus call): every role the selected line touches —
  // the ladder above and below, the door off each rung, and the same-tier sideways moves —
  // grouped by discipline, each row a jump. The board no longer draws roads into folded
  // shelf decks (they read as stray lines crossing the zones); this list is where those
  // connections live now.
  let panelTab = 'details', panelTabId = null;   // which card menu is up; a fresh role always opens on its facts
  function connectionsHTML(n){
    const cls = DATA.classes[curClass];
    const famsCfg = cls.families || {}, famOrd = cls.familyOrder || Object.keys(famsCfg);
    const tierL = (curClass === 'roles' ? DATA.meta.tierLabelsRoles : DATA.meta.tierLabelsPatients) || [];
    const lin = lineageOf(n.id);
    const members = [...lin.set].filter(x => x !== n.id && nodeById.has(x)).map(x => nodeById.get(x));
    const byFam = new Map();
    members.forEach(m => { if (!byFam.has(m.family)) byFam.set(m.family, []); byFam.get(m.family).push(m); });
    const famKeys = [...byFam.keys()].sort((a,b) => (a === n.family ? -1 : b === n.family ? 1 : famOrd.indexOf(a) - famOrd.indexOf(b)));
    let count = 0, h = '';
    const row = m => { count++; return '<button type="button" class="hct-con-row" data-go="'+esc(m.id)+'">'
      + '<span class="dot" style="background:'+esc((famsCfg[m.family]||{}).color||'#888')+'"></span>'
      + '<span class="t"><b>'+esc(m.abbr)+'</b>'+esc(m.label.replace(/\n/g,' '))+'</span>'
      + '<span class="lv">'+esc(String(tierL[m.tier] != null ? tierL[m.tier] : 'L'+m.tier))+'</span></button>'; };
    famKeys.forEach(f => {
      const arr = byFam.get(f).slice().sort((a,b) => a.tier - b.tier || (a.id < b.id ? -1 : 1));
      const cfg = famsCfg[f] || {};
      h += '<div class="hct-con-sec" style="color:'+esc(cfg.color||'#9fb')+'">'+esc(cfg.label||f)+(f === n.family ? ' · this line' : '')+'</div>';
      arr.forEach(m => h += row(m));
    });
    // sideways: the same-rung doors the details view caps at six — ALL of them live here
    if (curClass === 'roles' && n.tier >= 1){
      const LATERAL_PW = ['informatics','biotech','admin','government','education'];
      const doors = cls.nodes
        .filter(x => x.pathway !== n.pathway && LATERAL_PW.includes(x.pathway) && x.tier === n.tier && x.id !== n.id && !lin.set.has(x.id))
        .sort((a,b) => LATERAL_PW.indexOf(a.pathway) - LATERAL_PW.indexOf(b.pathway));
      if (doors.length){
        h += '<div class="hct-con-sec">Sideways doors · same rung</div>';
        doors.forEach(m => h += row(m));
      }
    }
    return { count, html: h };
  }
  function openPanel(id){
    const n = nodeById.get(id);
    const c = DATA.classes[curClass];
    const fam = c.families[n.family] || {};
    asEl(document.querySelector('#hct-p-badge .hct-p-dot')).style.background = fam.color;
    document.querySelector('#hct-p-badge .lbl').textContent = fam.label || '';
    asEl(document.querySelector('#hct-p-badge')).style.background = hexA(fam.color, 0.14);
    asEl(document.querySelector('#hct-p-badge')).style.color = fam.color;
    document.getElementById('hct-p-title').textContent = n.label.replace(/\n/g,' ');
    document.getElementById('hct-p-abbr').textContent = n.abbr;

    // THE FIRST TAP'S PAYOFF rides at the very top of the sheet: the pin pair is visible at
    // dt-half without scrolling. It used to render LAST of 8 blocks, below the fold on phones.
    const isPin = pinned.has(id), pinLayer = isPin ? roleLayerInBuild(id) : null;
    let h = '<div class="hct-add-lbl gold">'+(isPin ? 'This role is on your path · tap the lit one to remove' : 'This role · where does it fit your story?')+'</div>';
    h += '<div class="hct-add-pair">'
       + '<button class="hct-pin-btn'+(pinLayer==='current'?' pinned':'')+'" data-pin-layer="current">'+(pinLayer==='current'?'★':'☆')+' I\'ve held this role</button>'
       + '<button class="hct-pin-btn'+(pinLayer==='future'?' pinned':'')+'" data-pin-layer="future">'+(pinLayer==='future'?'★':'☆')+' I\'m aiming for it</button>'
       + '</div>';
    h += '<p class="hct-p-summary">'+esc(n.summary)+'</p>';
    const blsOcc = blsForRole(n);
    if (blsOcc) h += blsBlock(blsOcc);
    if (n.meta && n.meta.length){
      h += '<div class="hct-meta">';
      n.meta.forEach(m => { if (blsOcc && /pay/i.test(m.k)) return;   // real BLS pay shown above; skip the hand estimate
        h += '<div class="k">'+esc(m.k)+'</div><div class="v">'+esc(m.v)+'</div>'; });
      h += '</div>';
    }
    if (n.req && n.req.items.length){
      if (pinned.has(id)){   // on your path → the requirements are YOUR checklist (same ticks as Next Steps)
        h += '<div class="hct-list-h">'+esc(n.req.title)+' · tap what you hold</div>';
        h += '<div class="bp-chklist hct-p-chk">'+n.req.items.map(it => ckRow('r', n.id, it)).join('')+'</div>';
      } else {
        h += '<div class="hct-list-h">'+esc(n.req.title)+'</div><ul class="hct-list">';
        n.req.items.forEach(i => h += '<li>'+esc(i)+'</li>'); h += '</ul>';
      }
    }
    if (n.mile && n.mile.items.length){
      h += '<div class="hct-list-h">'+esc(n.mile.title)+'</div><ul class="hct-list">';
      n.mile.items.forEach(i => h += '<li>'+esc(i)+'</li>'); h += '</ul>';
    }
    const kids = (n.leadsTo||[]).filter(t => nodeById.has(t));
    if (kids.length){
      h += '<div class="hct-list-h">'+(curClass==='roles'?'Leads to':'Can move to')+'</div><div class="hct-leads">';
      kids.forEach(k => h += '<span class="hct-chip" data-go="'+k+'">'+esc(nodeById.get(k).abbr)+' · '+esc(nodeById.get(k).label.replace(/\n/g,' '))+'</span>');
      h += '</div>';
    }
    // sideways moves — a RULE, not edges: at any rung you can jump into informatics, industry,
    // administration, government, or education. Same-tier landings shown as doors in the panel,
    // so the board's drawn lines stay meaningful (LEADS TO = the ladder; this = the doors).
    if (curClass === 'roles' && n.tier >= 1){
      const LATERAL_PW = ['informatics','biotech','admin','government','education'];
      const doors = DATA.classes[curClass].nodes
        .filter(x => x.pathway !== n.pathway && LATERAL_PW.includes(x.pathway) && x.tier === n.tier && x.id !== n.id && !kids.includes(x.id))
        .sort((a,b) => LATERAL_PW.indexOf(a.pathway) - LATERAL_PW.indexOf(b.pathway))
        .slice(0, 6);
      if (doors.length){
        h += '<div class="hct-list-h">Sideways moves · every rung has doors</div><div class="hct-leads">';
        doors.forEach(x => h += '<span class="hct-chip" data-go="'+x.id+'">'+esc(x.abbr)+' · '+esc(x.label.replace(/\n/g,' '))+'</span>');
        h += '</div>';
      }
    }
    // educational requirement → one click drops it into your Education Growth (and updates Next Steps)
    if (curClass === 'roles'){
      const reqFace = credForNode(n) || (DATA.meta.degrees[n.degree]||{}).label || '';
      if (reqFace && (credForNode(n) || (DEG_LEVEL[n.degree]||0) > 0)){
        const reqDeg = n.degree, have = build.education.some(e => e.kind==='real' && e.label===reqFace && e.degree===reqDeg);
        const degLbl = (DATA.meta.degrees[reqDeg]||{}).label || reqDeg;
        h += '<div class="hct-list-h">Educational requirement</div>';
        h += '<div class="hct-edu-req"><span class="hct-edu-req-face">'+esc(reqFace)+'</span>'+(reqFace!==degLbl?'<span class="hct-edu-req-deg">'+esc(degLbl)+'</span>':'')+'</div>';
        h += credStatsHTML(reqFace);   // the exam in numbers, when we have them
        h += have ? '<button class="hct-edu-add added" disabled>✓ This credential is on your path</button>'
                  : '<div class="hct-add-lbl">This credential · do you have it?</div>'
                  + '<div class="hct-add-pair">'
                  + '<button class="hct-edu-add" data-edu-layer="current" data-face="'+esc(reqFace)+'" data-deg="'+esc(reqDeg)+'" data-col="'+esc((DATA.meta.degrees[reqDeg]||{}).color||'')+'">I have it</button>'
                  + '<button class="hct-edu-add" data-edu-layer="future" data-face="'+esc(reqFace)+'" data-deg="'+esc(reqDeg)+'" data-col="'+esc((DATA.meta.degrees[reqDeg]||{}).color||'')+'">I\'m aiming for it</button>'
                  + '</div>';
        h += '<button class="hct-jump" type="button" data-jump-edu="'+esc(reqFace)+'">See it on the Education Matrix →</button>';
      }
    }
    // the loop's next stop: authored expertise around this role's family (same data as the sheet's suggest strip)
    const famSug = ((DATA.growth && DATA.growth.familySuggest && DATA.growth.familySuggest[n.family]) || []).slice(0, 4);
    if (famSug.length){
      const chips = famSug.map(gid => { const gn = growthById.get(gid); if (!gn) return '';
        return '<span class="hct-chip" data-growjump="'+esc(gid)+'">'+esc(gn.label)+'</span>'; }).filter(Boolean).join('');
      if (chips) h += '<div class="hct-list-h">The expertise around this work</div><div class="hct-leads">'+chips+'</div>'
        + '<button class="hct-jump" type="button" data-goview="atlas">Explore the whole map →</button>';
    }

    // the tab strip lives in the card's fixed chrome (map-drawer grammar) — decks only,
    // and only when the role actually has connections to list
    if (panelTabId !== id){ panelTab = 'details'; panelTabId = id; }
    const tabsEl = document.getElementById('hct-p-tabs');
    const conn = (DECKS && collapsedFams && curClass === 'roles' && curView === 'career') ? connectionsHTML(n) : null;
    if (conn && conn.count){
      if (panelTab === 'conn') h = conn.html;
      tabsEl.classList.add('has-tabs');
      tabsEl.innerHTML = '<button type="button" class="'+(panelTab==='details'?'on':'')+'" data-ptab="details">Details</button>'
        + '<button type="button" class="'+(panelTab==='conn'?'on':'')+'" data-ptab="conn">Connections · '+conn.count+'</button>';
      qsa(tabsEl,'[data-ptab]').forEach(b => { b.onclick = () => { if (panelTab !== b.dataset.ptab){ panelTab = b.dataset.ptab; openPanel(id); } }; });
    } else { panelTab = 'details'; tabsEl.classList.remove('has-tabs'); tabsEl.innerHTML = ''; }
    document.getElementById('hct-p-body').innerHTML = h;
    // the card's own Focus line: same verb as the hex pill, and the ONLY one when the looked-at
    // role has no tile on the board (a Connections jump into a folded family)
    const pf = document.getElementById('hct-p-focus');
    if (pf){
      const showF = DECKS && collapsedFams && curView === 'career' && (!lineageSet || id !== focusId);
      pf.style.display = showF ? 'inline-block' : 'none';
      pf.onclick = () => armFocus(id);
    }
    const panel = document.getElementById('hct-panel'); dockPanel(); panel.classList.add('open'); panel.dataset.owner = curView; panelOpened();   // belongs to whatever view opened it (docks right on My Path, right edge on the Career Matrix)

    qsa(document,'#hct-p-body [data-pin-layer]').forEach(b => { b.onclick = () => pinToLayer(id, b.dataset.pinLayer); });
    qsa(document,'#hct-p-body [data-edu-layer]').forEach(b => {
      b.onclick = () => { addReqCred(b.dataset.face, b.dataset.deg, b.dataset.col, b.dataset.eduLayer); openPanel(id); };   // explicit layer choice at the moment of adding; refresh panel
    });
    qsa(document,'#hct-p-body [data-go]').forEach(ch => {
      ch.onclick = () => selectCareer(ch.getAttribute('data-go'), true);   // a LOOK: the card swaps, the board holds (decks); classic keeps the full snap treatment
    });
    qsa(document,'#hct-p-body [data-growjump]').forEach(ch => {
      ch.onclick = () => { const gn = growthById.get(ch.dataset.growjump); if (!gn) return;
        if (curView !== 'atlas') setView('atlas');
        requestAnimationFrame(() => openGrowthPanel(gn)); };   // the global-search jump pattern
    });
    qsa(document,'#hct-p-body [data-jump-edu]').forEach(b => { b.onclick = () => jumpToEduCred(b.dataset.jumpEdu); });
    // make sure the panel didn't just open on top of the tile you clicked — deferred one frame
    // so a same-tick snap fit (onNodeClick) can claim the camera FIRST. One motion per tap:
    // the whole-field flight supersedes the reveal nudge instead of the two tweens fighting.
    revealQueued = id;
    requestAnimationFrame(() => { if (revealQueued === id){ revealQueued = null; revealNode(id); } });
  }
  // The Career Matrix detail panel docks over the board's right edge, so a tile in the right-hand columns can end up
  // hidden behind it. Nudge the board horizontally so the selected hex lands in the exposed area left of the panel —
  // only when it would actually be covered, so clicking a left-side tile doesn't make the view jump. Once revealed,
  // the camera stays put (userZoomed locks it); closing the panel does NOT move the board back.
  let revealQueued = null;   // tile waiting on a reveal nudge; a snap fit in the same tick clears it (fit supersedes reveal)
  function revealNode(id){
    if (curView !== 'career' || !svg) return;
    const pos = posMap.get(id); if (!pos) return;
    const board = document.getElementById('hct-board'); if (!board) return;
    const bw = board.clientWidth; if (bw < 120) return;
    const panel = document.getElementById('hct-panel');
    const panelW = panel.classList.contains('open') ? panel.getBoundingClientRect().width : 0;
    if (panelW > bw * 0.9) return;                        // panel is a bottom sheet (phone) → horizontal reveal doesn't apply
    const exposedRight = bw - panelW;
    const t = d3.zoomTransform(svg.node());
    const sx = t.x + t.k * pos.x;                          // node's current screen x
    // Clearance must cover the tile's own width (hex + label ≈ 80px), not just its center — otherwise a tile whose
    // CENTER is just inside the panel still has its right half hidden. Keep the visibility threshold and the tuck
    // target identical so a revealed tile always lands fully clear of the panel (close to it, but never under it).
    const CLEAR_R = 90, CLEAR_L = 55;
    const leftEdge = AXIS_RESERVE + CLEAR_L, rightEdge = exposedRight - CLEAR_R;
    if (sx >= leftEdge && sx <= rightEdge) return;         // already comfortably visible → leave the view alone
    const target = (sx > rightEdge) ? rightEdge : leftEdge;   // tuck just inside the edge it was hidden past
    const nt = d3.zoomIdentity.translate(target - t.k * pos.x, t.y).scale(t.k);
    userZoomed = true;                                     // intentional reveal; lock the camera so nothing snaps it back
    svg.transition().duration(dcap(280)).call(zoom.transform, nt).on('end', syncLOD);
  }
  function closePanel(){ const p = document.getElementById('hct-panel'); p.classList.remove('open','dt-peek','dt-full'); p.classList.add('dt-half'); p.dataset.owner = '';
    const cw = document.getElementById('hct-canvas-wrap'); if (cw) cw.classList.remove('sheet-open'); }
  // every panel open routes through here: phone budget (ONE transient — the detail sheet
  // displaces any selector sheet), default detent, and the sheet-open flag HUDs yield to
  function panelOpened(){
    if (isPhone()) closePop(false);
    const p = document.getElementById('hct-panel');
    if (!p.classList.contains('dt-peek') && !p.classList.contains('dt-full')) p.classList.add('dt-half');
    const cw = document.getElementById('hct-canvas-wrap'); if (cw) cw.classList.add('sheet-open');
  }
  // the ONE explicit board move, callable from wherever the verb lands (the hex pill, the
  // card's own button): organize the board around this role's line
  function armFocus(id){
    if (!id || !nodeById.has(id) || !(DECKS && collapsedFams)) return;
    selectedId = id; focusId = id; snapArmed = true;
    userZoomed = true;
    const pf = document.getElementById('hct-p-focus'); if (pf) pf.style.display = 'none';   // the ask is answered
    render(true); snapFit();
    announce('Focused on the career line');
  }
  // DECKS: leave the focused line WITHOUT touching the open card — the Show all chip, Esc's
  // second step, and the empty tap all walk through here. One state change per gesture.
  function exitFocus(){
    if (!(DECKS && collapsedFams) || !lineageSet) return;
    focusId = null; snapArmed = false;
    const pf = document.getElementById('hct-p-focus');   // an open card's Focus line comes back (the card isn't rebuilt here)
    if (pf && selectedId && curView === 'career') pf.style.display = 'inline-block';
    render(true);
    if (!isPhone()) fitDefaultGroup(true);   // desktop camera returns with the expansion; PHONE PARKS
  }
  // the X path in one place so swipe-down-to-dismiss behaves exactly like the X
  function dismissPanel(){
    // DECKS: the X closes the CARD, one step — a focused board STAYS focused (Show all,
    // Esc again, or an empty tap walks the next step). Closing a look must not fly the world.
    const fromRow = selectedId;   // phone flow: the X returns focus to the row it came from
    if (DECKS && collapsedFams && curView === 'career'){
      selectedId = null; eduSelId = null; closePanel();
      render(true); renderMyPath();
      focusFlowRow(fromRow);
      return;
    }
    const wasSnapped = !!lineageSet;
    selectedId = null; eduSelId = null; snapArmed = false; closePanel();
    render(wasSnapped && curView === 'career'); renderMyPath();
    focusFlowRow(fromRow);
    if (wasSnapped && curView === 'career' && !isPhone()) fitDefaultGroup(true);   // desktop: camera home with the expand; PHONE PARKS — a sheet dismiss must not fly the world
  }
  // close any open detail whose owning view isn't the one we're showing (self-heals a panel that lingered across a tab switch)
  function enforcePanelOwner(){ const p = document.getElementById('hct-panel'); if (p.classList.contains('open') && p.dataset.owner && p.dataset.owner !== curView) closePanel(); }

  // ── PHONE CAREER FLOW (≤699) ──────────────────────────────────
  // The board's phone home: the SAME class data as a deck grid → one family's tier
  // ladder → the SAME detail sheet. Selection state is shared both ways, so a deep
  // link, a search jump, or a Connections chip lands with the right ladder behind it.
  function renderPhoneFlow(){
    const host = document.getElementById('hct-phone-flow');
    if (!host || !DATA) return;
    if (selectedId && nodeById.has(selectedId)) phoneFam = nodeById.get(selectedId).family;
    const cls = DATA.classes[curClass], fams = cls.families || {}, order = cls.familyOrder || Object.keys(fams);
    const nodes = cls.nodes || [];
    const tl = (curClass === 'roles' ? DATA.meta.tierLabelsRoles : DATA.meta.tierLabelsPatients) || [];
    const tName = t => (tl[t] != null ? tl[t] : 'Level ' + t);
    if (phoneFam && !fams[phoneFam]) phoneFam = null;   // class-switch safety
    let h = '';
    if (!phoneFam){
      h += '<div class="hpf-hd">' + order.length + ' fields. Tap one to climb its ladder.</div><div class="hpf-grid" role="list">';
      order.forEach(f => {
        const fn = nodes.filter(n => n.family === f);
        if (!fn.length) return;
        const lo = Math.min.apply(null, fn.map(n => n.tier)), hi = Math.max.apply(null, fn.map(n => n.tier));
        const col = (fams[f] && fams[f].color) || 'var(--teal)';
        h += '<button type="button" class="hpf-deck" role="listitem" data-fam="' + esc(f) + '" style="--fc:' + col + '">'
           + '<span class="hpf-deck-name">' + esc((fams[f] || {}).label || f) + '</span>'
           + '<span class="hpf-deck-meta">' + fn.length + (fn.length === 1 ? ' role' : ' roles')
           + (hi > lo ? ' &middot; ' + esc(tName(lo)) + ' to ' + esc(tName(hi)) : '') + '</span></button>';
      });
      h += '</div>';
    } else {
      const fn = nodes.filter(n => n.family === phoneFam);
      const col = (fams[phoneFam] && fams[phoneFam].color) || 'var(--teal)';
      h += '<div class="hpf-lhd"><button type="button" class="hpf-back" id="hpf-back">&larr; All fields</button>'
         + '<span class="hpf-lname" style="color:' + col + '">' + esc((fams[phoneFam] || {}).label || phoneFam) + '</span>'
         + '<span class="hpf-lcount">' + fn.length + (fn.length === 1 ? ' role' : ' roles') + '</span></div>';
      const tiers = [...new Set(fn.map(n => n.tier))].sort((a, b) => a - b);
      tiers.forEach(t => {
        h += '<div class="hpf-tier"><span class="hpf-tier-lbl">' + esc(tName(t)) + '</span>';
        fn.filter(n => n.tier === t).forEach(n => {
          const on = n.id === selectedId;
          h += '<button type="button" class="hpf-role' + (on ? ' on' : '') + '" data-id="' + esc(n.id) + '" style="--fc:' + col + '"'
             + (on ? ' aria-current="true"' : '') + '>'
             + '<span class="hpf-role-name">' + esc(String(n.label || '').replace(/\n/g, ' ')) + '</span>'
             + (pinned.has(n.id) ? '<span class="hpf-role-pin" title="On your path">&#9733;</span>' : '')
             + (n.abbr ? '<span class="hpf-role-abbr">' + esc(n.abbr) + '</span>' : '')
             + '</button>';
        });
        h += '</div>';
      });
    }
    // innerHTML rebuilds the list, so a keyboard user who just activated a row would land
    // on <body>. Re-seat focus on the same control by its stable key (id / family / back).
    const act = document.activeElement, keep = act && host.contains(act)
      ? (asEl(act).dataset.id ? '.hpf-role[data-id="' + asEl(act).dataset.id + '"]'
        : asEl(act).dataset.fam ? '.hpf-deck[data-fam="' + asEl(act).dataset.fam + '"]'
        : act.id === 'hpf-back' ? '#hpf-back' : null)
      : null;
    host.innerHTML = h;
    if (keep){ const again = host.querySelector(keep); if (again) asEl(again).focus(); }
  }
  // leaving the ladder is ONE step: it never rides along with a sheet close
  function closePhoneFam(focusBack){
    const fam = phoneFam; phoneFam = null;
    if (selectedId){ selectedId = null; closePanel(); }   // a card never floats over the deck grid
    renderPhoneFlow();
    announce('All fields');
    if (focusBack && fam){ const d = document.querySelector('.hpf-deck[data-fam="' + fam + '"]'); if (d) asEl(d).focus(); }
  }
  // closing the sheet hands focus back to the row that opened it (run-3: the X path was
  // dropping keyboard users on <body> while Esc's ladder path restored correctly)
  function focusFlowRow(id){
    if (!id || !isPhone() || curView !== 'career' || !phoneFam) return;
    const r = document.querySelector('.hpf-role[data-id="' + id + '"]');
    if (r) asEl(r).focus();
  }
  // the hardware-back sentinel covers the ladder too (one guard, rung-aware — two
  // guards would both answer the same popstate and eat two levels)
  function ensurePhoneArm(){
    if (backGd && isPhone() && curView === 'career' && phoneFam && !document.getElementById('hct-panel').classList.contains('open')) backGd.arm();
  }
  // Home the shared detail panel INSIDE the active view's section — exactly like the Education panel lives inside its view.
  // Because inactive views are display:none, the panel then hides itself on a tab switch and can never leak to another tab.
  const PANEL_HOST = { career:'hct-career', path:'hct-mypath', atlas:'hct-atlas' };
  function dockPanel(){
    // DECKS desktop: the floating card anchors INSIDE the board (its 10px of air starts below
    // the blurb + hint rows, like the map drawers float inside the map). Classic and the
    // phone sheet keep their section hosts.
    const hostId = (DECKS && collapsedFams && curView === 'career' && !isPhone()) ? 'hct-board' : PANEL_HOST[curView];
    const host = document.getElementById(hostId); const p = document.getElementById('hct-panel'); if (host && p.parentNode !== host) host.appendChild(p);
  }

  // ── My Path: build planner — five GROWTH tracks (Career · Education · Skill · Specialization · Experience) ──
  // each track is an array on `build`; TRACKS drives rendering/wiring
  const TRACKS = [
    { key:'career',     grid:'bp-grid-career',     kind:'role',   title:'Career Path' },
    { key:'education',  grid:'bp-grid-education',   kind:'cred',   title:'Education' },
    { key:'skill',      grid:'bp-grid-skill',      kind:'custom', spiral:true, zone:'skill',      title:'Skills' },
    { key:'spec',       grid:'bp-grid-spec',       kind:'custom', spiral:true, zone:'spec',       title:'Specializations' },
    { key:'experience', grid:'bp-grid-experience', kind:'custom', spiral:true, zone:'experience', title:'Experience' },
    { key:'population',  grid:'bp-grid-population', kind:'custom', spiral:true, zone:'population', title:'Populations' }
  ];

  // a career node can carry MULTIPLE concurrent (forked) roles in `concurrents`; back-compat for the old single `.concurrent`
  function concsOf(node){ return node && Array.isArray(node.concurrents) ? node.concurrents : (node && node.concurrent ? [node.concurrent] : []); }
  function syncPinned(){ const ids=[]; build.career.forEach(s=>{ if(s.roleId) ids.push(s.roleId); concsOf(s).forEach(c=>{ if(c && c.roleId) ids.push(c.roleId); }); }); pinned = new Set(ids); }
  function saveBuild(){ try { localStorage.setItem(BUILD_KEY(curClass), JSON.stringify(build)); } catch(e){} }
  // sanitize a raw saved/imported object into a valid build (shared by loadBuild + import)
  function migrateBuild(o){
    // migrate the older {skills,specs,equip} shape → five tracks
    if (Array.isArray(o.skills) && !o.career && !o.skill){ o.career = o.skills.filter(s=>s.roleId); o.skill = o.skills.filter(s=>!s.roleId); }
    if (Array.isArray(o.equip) && !o.education) o.education = o.equip;
    if (Array.isArray(o.specs) && !o.spec)     o.spec = o.specs;
    const b = blankBuild();
    ['career','education','skill','spec','experience','population'].forEach(k => { if (!Array.isArray(o[k])) o[k] = []; });
    // forks now live in `concurrents` (array) — migrate the legacy single `.concurrent`
    o.career.forEach(s => { if (!s) return; if (s.concurrent && !Array.isArray(s.concurrents)) s.concurrents = [s.concurrent]; delete s.concurrent; });
    const view = (o.view==='future') ? 'future' : 'both';   // 'current'-only view retired → everything shows
    // migrate layout: keep saved order (valid keys only), append any new panels, carry hidden.
    // 2026-07: zones + Next Steps became fixed story sections — only text cards stay movable,
    // so legacy zone/next keys in a saved order/hidden fall away here
    const validKey = k => (PANELS[k] && PANELS[k].kind === 'text') || /^other-\d+$/.test(k);
    let order = Array.isArray(o.layout && o.layout.order) ? o.layout.order.filter(validKey) : [];
    PANEL_ORDER.filter(k => PANELS[k].kind === 'text').forEach(k => { if (!order.includes(k)) order.push(k); });
    const hidden = Array.isArray(o.layout && o.layout.hidden) ? o.layout.hidden.filter(validKey) : [];
    const sizes = (o.layout && o.layout.sizes && typeof o.layout.sizes === 'object') ? o.layout.sizes : {};
    const titles = (o.layout && o.layout.titles && typeof o.layout.titles === 'object') ? o.layout.titles : {};
    // ticked requirement items ride along — keep only truthy string-keyed entries
    const checks = {};
    if (o.checks && typeof o.checks === 'object') Object.keys(o.checks).forEach(k => { if (o.checks[k] && typeof k === 'string') checks[k] = 1; });
    Object.assign(b, { budget:o.budget||30, view, name:o.name||'', goal:o.goal||'', layout:{ order, hidden, sizes, titles }, sw:o.sw||'', notes:o.notes||'', other:o.other||'', tagline:o.tagline||'', checks,
      career:o.career, education:o.education, skill:o.skill, spec:o.spec, experience:o.experience, population:o.population });
    Object.keys(o).forEach(k => { if (/^other-\d+$/.test(k) && typeof o[k] === 'string') b[k] = o[k]; });   // carry dynamic "Other" sections
    return b;
  }
  function loadBuild(cls){
    try { const o = JSON.parse(localStorage.getItem(BUILD_KEY(cls)) || 'null'); if (o && typeof o === 'object') return migrateBuild(o); } catch(e){}
    return blankBuild();
  }
  // ── Save / Load: encode the whole build to a portable code string, decode it back ──
  function utf8ToB64(s){ const bytes = new TextEncoder().encode(s); let bin=''; bytes.forEach(b=> bin += String.fromCharCode(b)); return btoa(bin); }
  function b64ToUtf8(s){ const bin = atob(s.replace(/\s+/g,'')); return new TextDecoder().decode(Uint8Array.from(bin, c=>c.charCodeAt(0))); }
  function bytesToB64(bytes){ let bin=''; for (let i=0;i<bytes.length;i++) bin += String.fromCharCode(bytes[i]); return btoa(bin); }
  // Compress the JSON with the browser's native deflate (no dependency) → ~70% shorter codes (HUCT2).
  async function deflateB64(str){
    const cs = new CompressionStream('deflate-raw'); const w = cs.writable.getWriter();
    w.write(new TextEncoder().encode(str)); w.close();
    return bytesToB64(new Uint8Array(await new Response(cs.readable).arrayBuffer()));
  }
  async function inflateB64(b64){
    const bytes = Uint8Array.from(atob(b64.replace(/\s+/g,'')), c => c.charCodeAt(0));
    const ds = new DecompressionStream('deflate-raw'); const w = ds.writable.getWriter();
    w.write(bytes); w.close();
    return new TextDecoder().decode(await new Response(ds.readable).arrayBuffer());
  }
  async function encodeBuild(){
    const json = JSON.stringify(build);
    if (typeof CompressionStream === 'function'){ try { return 'HUCT2:' + await deflateB64(json); } catch(e){} }
    return 'HUCT1:' + utf8ToB64(json);   // fallback for browsers without CompressionStream
  }
  async function decodeBuild(str){
    str = (str||'').trim();
    let json;
    if (/^HUCT2:/.test(str)) json = await inflateB64(str.slice(6));   // compressed code
    else if (/^HUCT1:/.test(str)) json = b64ToUtf8(str.slice(6));     // legacy plain code (still supported)
    else if (str.charAt(0) === '{') json = str;                       // raw JSON (hand-edited / downloaded file)
    else throw new Error('unrecognized');
    const o = JSON.parse(json);
    if (!o || typeof o !== 'object' || !Array.isArray(o.career)) throw new Error('not a build');
    return migrateBuild(o);
  }
  function dataMsg(text, ok){ const m = document.getElementById('bp-data-msg'); if (m){ m.textContent = text; m.className = 'bp-modal-msg ' + (ok ? 'ok' : 'err'); } }
  function openDataModal(){
    const m = document.getElementById('bp-data-modal'); if (!m) return;
    const out = asInput(document.getElementById('bp-data-out')); if (out){ out.value = 'Generating…'; encodeBuild().then(c => { out.value = c; }); }
    const inp = asInput(document.getElementById('bp-data-in')); if (inp) inp.value = '';
    dataMsg('', true);
    m.classList.add('open');
  }
  function closeDataModal(){ const m = document.getElementById('bp-data-modal'); if (m) m.classList.remove('open'); }
  function copyBuildCode(){
    const out = asInput(document.getElementById('bp-data-out')), btn = document.getElementById('bp-data-copy'); if (!out) return;
    out.focus(); out.select();
    const ok = () => { if (btn){ const t = btn.textContent; btn.textContent = 'Copied ✓'; setTimeout(() => btn.textContent = t, 1200); } };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(out.value).then(ok).catch(() => { try { document.execCommand('copy'); ok(); } catch(_){} });
    else { try { document.execCommand('copy'); ok(); } catch(_){} }
  }
  async function downloadBuildFile(){
    const code = await encodeBuild();
    const name = ((build.name||'').trim().replace(/[^\w\-]+/g,'_').replace(/^_+|_+$/g,'') || 'my-path');
    const blob = new Blob([code], { type: 'text/plain' }), url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name + '-career-tree.txt';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }
  function loadBuildFile(file){
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { const inp = asInput(document.getElementById('bp-data-in')); if (inp) inp.value = String(reader.result||'').trim(); dataMsg('File loaded. Now click Import.', true); };
    reader.onerror = () => dataMsg('Could not read that file.', false);
    reader.readAsText(file);
  }
  async function doImport(){
    const inp = asInput(document.getElementById('bp-data-in')); const str = inp ? inp.value : '';
    if (!str.trim()){ dataMsg('Paste a code or load a file first.', false); return; }
    let imported;
    try { imported = await decodeBuild(str); } catch(e){ dataMsg('Could not read that. Paste the whole code/file.', false); return; }
    if (!confirm('Import this path? It REPLACES your current build (this can\'t be undone).')) return;
    build = imported; syncPinned(); saveBuild(); renderMyPath(); updateBoardPins();
    dataMsg('Imported ✓', true);
    setTimeout(closeDataModal, 750);
  }

  // ── Import from a LinkedIn "Save to PDF" export ──────────────────────────
  // PDF.js is lazy-loaded only when used (keeps the page light). The text layer is parsed in the
  // browser, translated into a build, and run through the same replace-and-render path as doImport().
  const PDFJS_SRC = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
  const PDFJS_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
  let _pdfjsP = null;
  function loadPdfJs(){
    if (_pdfjsP) return _pdfjsP;
    _pdfjsP = new Promise((resolve, reject) => {
      if (window.pdfjsLib){ try { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER; } catch(e){} return resolve(window.pdfjsLib); }
      const s = document.createElement('script'); s.src = PDFJS_SRC; s.async = true;
      s.onload = () => { try { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER; resolve(window.pdfjsLib); } catch(e){ reject(e); } };
      s.onerror = () => reject(new Error('could not load the PDF reader'));
      document.head.appendChild(s);
    });
    return _pdfjsP;
  }
  function liMsg(t, ok){ const m = document.getElementById('bp-li-msg'); if (m){ m.textContent = t; m.className = 'bp-modal-msg ' + (ok ? 'ok' : 'err'); } }

  // text layer -> ordered lines. LinkedIn PDFs are two-column (dark sidebar left, content right);
  // read the sidebar first then the main column (each top-to-bottom) so sections stay contiguous.
  async function extractLinkedInPdf(file){
    const pdfjsLib = await loadPdfJs();
    const data = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: data }).promise;
    const out = [], side = []; let name = '', headline = '';
    for (let p = 1; p <= pdf.numPages; p++){
      const page = await pdf.getPage(p);
      const vw = page.getViewport({ scale: 1 });
      const tc = await page.getTextContent();
      const rows = {};
      tc.items.forEach(it => {
        const str = it.str || ''; if (!str) return;
        const x = it.transform[4], y = it.transform[5];
        const col = x < vw.width * 0.33 ? 0 : 1;
        const key = col + ':' + Math.round(y / 3);
        (rows[key] = rows[key] || { col: col, y: y, parts: [] }).parts.push({ x: x, w: it.width || 0, s: str });
      });
      const lines = Object.keys(rows).map(k => {
        const r = rows[k], ps = r.parts.sort((a,b) => a.x - b.x);
        let text = '', prevEnd = null;
        ps.forEach(pt => { if (prevEnd !== null && pt.x - prevEnd > 1) text += ' '; text += pt.s; prevEnd = pt.x + pt.w; });
        return { col: r.col, y: r.y, text: text.replace(/\s+/g, ' ').trim() };
      }).filter(r => r.text);
      lines.sort((a,b) => a.col - b.col || b.y - a.y);
      if (p === 1){   // page-1 main column = [name, headline lines…, location, Summary, …]
        const main = lines.filter(r => r.col === 1);
        if (main.length){ name = main[0].text; const hl = [];
          for (let q = 1; q < main.length; q++){ const t = main[q].text;
            if (t === 'Summary' || /,\s*United States$/.test(t) || /^[A-Z][a-zA-Z.]+,\s*[A-Z]{2}\b/.test(t)) break; hl.push(t); }
          headline = hl.join(' '); }
      }
      lines.forEach(r => { out.push(r.text); if (r.col === 0) side.push(r.text); });
    }
    return { name: name, headline: headline, lines: out, sidebar: side };
  }

  // sidebar (left column) -> Top Skills + Certifications, read under their fixed section headers
  function parseSidebarLines(side){
    const HEAD = { 'Contact':1, 'Top Skills':1, 'Skills':1, 'Languages':1, 'Certifications':1, 'Honors-Awards':1, 'Honors & Awards':1, 'Publications':1, 'Interests':1 };
    const skills = [], certs = [], awards = [], pubs = []; let cur = null;
    (side || []).forEach(l => {
      if (HEAD[l]){ cur = l; return; }
      if (cur === 'Top Skills' || cur === 'Skills'){ if (skills.length < 12) skills.push(l); }
      else if (cur === 'Certifications'){ if (certs.length < 16) certs.push(l); }
      else if (cur === 'Honors-Awards' || cur === 'Honors & Awards'){ if (awards.length < 16) awards.push(l); }
      else if (cur === 'Publications'){ if (pubs.length < 16) pubs.push(l); }
    });
    return { skills: skills, certs: certs, awards: awards, pubs: pubs };
  }

  // structure the ordered lines into roles + schools (tuned to LinkedIn's fixed export format)
  function parseLinkedInLines(rawLines){
    const LI_DATE = /^(?:[A-Z][a-z]+ \d{4}|\d{4}) - (?:Present|[A-Z][a-z]+ \d{4}|\d{4}) \(.+\)$/;
    const LI_TENURE = /^(?:\d+ years?(?: \d+ months?)?|\d+ months?)$/;
    const LI_FOOTER = /^Page \d+ of \d+$/;
    const LI_BULLET = /^[•·▪]\s/;
    const LI_GEO = /,\s*United States$|^[A-Z][a-zA-Z.]+,\s*[A-Z]{2}$/;
    const LI_EDU = /·\s*\(.*\d{4}.*\)\s*$/;
    const MO = { January:1, February:2, March:3, April:4, May:5, June:6, July:7, August:8, September:9, October:10, November:11, December:12 };
    const NOW = (new Date()).getFullYear() * 12 + ((new Date()).getMonth() + 1);
    function toMo(s){ if (/present/i.test(s)) return NOW; let m = s.match(/^([A-Z][a-z]+)\s+(\d{4})$/); if (m) return (+m[2]) * 12 + (MO[m[1]] || 1); let y = s.match(/^(\d{4})$/); if (y) return (+y[1]) * 12 + 1; return null; }
    function yr(s){ if (!s) return '?'; if (/present/i.test(s)) return 'Now'; const m = s.match(/(\d{4})/); return m ? m[1] : s; }

    const lines = rawLines.map(l => (l || '').trim()).filter(l => l && !LI_FOOTER.test(l));
    let expStart = -1, expEnd = lines.length, eduStart = -1, sumStart = -1;
    lines.forEach((l,i) => { if (l === 'Experience') expStart = i; if (l === 'Education' && eduStart < 0) eduStart = i; if (l === 'Summary' && sumStart < 0) sumStart = i; });
    if (eduStart >= 0 && eduStart > expStart) expEnd = eduStart;
    const exp = expStart >= 0 ? lines.slice(expStart + 1, expEnd) : [];
    const edu = eduStart >= 0 ? lines.slice(eduStart + 1) : [];

    const kind = exp.map(l => LI_DATE.test(l) ? 'DATE' : LI_TENURE.test(l) ? 'TENURE' : LI_BULLET.test(l) ? 'BULLET' : 'TEXT');
    const nextM = i => { for (let j = i + 1; j < exp.length; j++){ if (kind[j] === 'BULLET') continue; return j; } return -1; };
    const role = exp.map((_,i) => { if (kind[i] !== 'TEXT') return null; const nx = nextM(i); return (nx >= 0 && kind[nx] === 'DATE') ? 'TITLE' : null; });
    exp.forEach((_,i) => { if (kind[i] !== 'TEXT' || role[i]) return; if (LI_GEO.test(exp[i])) return; const nx = nextM(i); if (nx >= 0 && (kind[nx] === 'TENURE' || role[nx] === 'TITLE')) role[i] = 'COMPANY'; });

    const roles = []; let company = null, current = null;
    exp.forEach((line,i) => {
      if (role[i] === 'COMPANY') company = line;
      else if (role[i] === 'TITLE'){ current = { company: company, title: line, locked: false }; roles.push(current); }
      else if (kind[i] === 'DATE' && current){ const m = line.match(/^(.+?) - (.+?) \(/); if (m){ current.startRaw = m[1]; current.endRaw = m[2]; current.start = toMo(m[1]); current.end = toMo(m[2]); current.yr = yr(m[1]) + '-' + yr(m[2]); } }
      else if (kind[i] === 'TEXT' && current && !current.locked){ current.location = line; current.locked = true; }
    });
    roles.forEach(r => { delete r.locked; });

    const schools = [];
    for (let i = 0; i < edu.length; i++){ if (LI_EDU.test(edu[i]) || /·/.test(edu[i])){ const dm = edu[i].match(/\(([^)]*\d{4}[^)]*)\)/); schools.push({ school: edu[i - 1] || '', degree: edu[i].replace(/\s*·.*$/, '').trim(), years: dm ? dm[1] : '' }); } }
    const summary = (sumStart >= 0 && expStart > sumStart) ? lines.slice(sumStart + 1, expStart).join(' ').trim() : '';
    return { roles: roles, schools: schools, summary: summary };
  }

  // fuzzy-match an imported title to a real board role (reuses the board's label/abbr vocabulary)
  function matchRoleToBoard(title){
    if (!nodeById || !nodeById.size) return null;
    const q = (title || '').toLowerCase().replace(/[-/]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!q) return null;
    const qt = new Set(q.split(' ').filter(w => w.length > 2));
    let best = null, bestScore = 0;
    nodeById.forEach(n => {
      const lbl = (n.label || '').toLowerCase().replace(/\n/g, ' ').replace(/[-/]/g, ' ').replace(/\s+/g, ' ').trim();
      let score = 0;
      if (lbl === q) score = 100;
      else if (lbl && (lbl.includes(q) || q.includes(lbl))) score = 60;
      else { const lt = lbl.split(' ').filter(w => w.length > 2); const hits = lt.filter(w => qt.has(w)).length; score = hits * 18; }
      if ((n.abbr || '').toLowerCase().replace(/[^a-z0-9]/g, '') === q.replace(/[^a-z0-9]/g, '')) score = Math.max(score, 92);   // exact abbr match (e.g. goal "CRNA")
      if (score > bestScore){ bestScore = score; best = n; }
    });
    return bestScore >= 36 ? best : null;
  }

  // parsed roles/schools -> a valid build. Roles at the "spine" employer (most roles) stay on the
  // trunk; overlapping side-employer roles fork off it (the tool's one-fork-per-node model).
  // LinkedIn's "Top Skills" are free text (and often generic). Match each against the real Skill catalog so the import
  // drops in proper tiles instead of blank custom ones; anything that doesn't clearly match is skipped (no junk tiles).
  function matchSkillToCatalog(name){
    if (!DATA || !DATA.growth) return null;
    const q = (name||'').toLowerCase().trim(); if (q.length < 3) return null;
    const pool = DATA.growth.nodes.filter(n => n.zone === 'skill');
    let m = pool.find(n => n.label.toLowerCase() === q || (n.abbr||'').toLowerCase() === q);   // exact label/abbr
    if (m) return m;
    m = pool.find(n => { const l = n.label.toLowerCase(); return l.includes(q) || q.includes(l); });   // one contains the other
    if (m) return m;
    const syn = (typeof growthSyn === 'function') ? growthSyn(q) : [];   // layman synonyms (heart, computer, teaching…)
    if (syn.length) m = pool.find(n => { const l = n.label.toLowerCase(); return syn.some(t => l.includes(t)); });
    return m || null;
  }
  // Read the degree LEVEL out of a free-text LinkedIn education / certification line so the imported tile gets the right
  // color and stacks at the right level. Returns a degree key (HS/Cert/AS/BS/MS/Doc/MD/DO) or null when it can't tell.
  function inferDegree(text){
    const t = ' ' + (text||'').toLowerCase().replace(/[().,/]/g,' ') + ' ';
    if (!t.trim()) return null;
    if (/\bm\.?\s?d\b|\bd\.?\s?o\b|doctor of medicine|osteopath/.test(t)) return 'MD/DO';
    if (/\bph\.?\s?d\b|doctorate|doctoral|doctor of|\bd\.?n\.?p\b|\bdnp\b|\bed\.?d\b|\bd\.?p\.?t\b|\bdpt\b|pharm\.?\s?d|\bpsy\.?\s?d\b|\bsc\.?\s?d\b|\bau\.?\s?d\b/.test(t)) return 'Doc';
    if (/\bmaster|\bm\.?\s?s\b|\bm\.?\s?a\b|\bm\.?b\.?a\b|\bmba\b|\bm\.?h\.?a\b|\bmha\b|\bm\.?s\.?n\b|\bmsn\b|\bm\.?p\.?h\b|\bmph\b|\bm\.?ed\b|\bm\.?s\.?w\b|\bmsw\b/.test(t)) return 'MS';
    if (/bachelor|\bb\.?\s?s\b|\bb\.?\s?a\b|\bb\.?s\.?n\b|\bbsn\b|baccalaureate/.test(t)) return 'BS';
    if (/associate|\ba\.?\s?s\b|\ba\.?\s?a\b|\ba\.?a\.?s\b/.test(t)) return 'AS';
    if (/high school|\bg\.?e\.?d\b|\bdiploma\b/.test(t)) return 'HS';
    if (/certificat|certified|certification|\bcert\b|licens|\bbelt\b|specialt|credential|\bboard\b|fellowship/.test(t)) return 'Cert';
    return null;
  }
  function linkedInToBuild(p){
    const b = blankBuild();
    const name = p.name, roles = p.roles || [], schools = p.schools || [], skills = p.skills || [], certs = p.certs || [];
    b.name = (name || '').replace(/\s+(RRT|MHA|MSRT|MSRC|RRT-ACCS|MBA|MPH|MSN|BSN|PhD|MD|DNP|FAARC|CPHQ)\b.*$/, '').trim() || (name || '');
    b.tagline = (p.headline || '').trim();
    const valid = roles.filter(r => r.start != null);
    const byCo = {}; valid.forEach(r => { const c = r.company || '?'; (byCo[c] = byCo[c] || { n: 0, m: 0 }); byCo[c].n++; byCo[c].m += (r.end && r.start) ? (r.end - r.start) : 0; });
    let spine = null, best = -1; Object.keys(byCo).forEach(c => { const s = byCo[c].n * 100000 + byCo[c].m; if (s > best){ best = s; spine = c; } });
    const sorted = valid.slice().sort((a,b) => a.start - b.start);
    let overlaps = 0; const trunk = [];
    const mk = r => { const m = matchRoleToBoard(r.title); const n = { id: newId(), name: r.title, years: r.yr || '', layer: 'current', _s: r.start, _e: r.end }; if (m){ n.roleId = m.id; n.abbr = m.abbr; n.family = m.family; } return n; };
    sorted.forEach(r => {
      const node = mk(r);
      if ((r.company || '?') !== spine){
        // side-employer role: fork it off the first overlapping trunk node (a node can hold several forks)
        const host = trunk.find(t => t._s != null && t._e != null && r.start < t._e && t._s < r.end);
        if (host){ (host.concurrents = host.concurrents || []).push({ id: newId(), name: node.name, years: node.years, layer: 'current', roleId: node.roleId, abbr: node.abbr, family: node.family }); overlaps++; return; }
      }
      trunk.push(node);
    });
    b.career = trunk.map(n => { const o = {}; Object.keys(n).forEach(k => { if (k !== '_s' && k !== '_e') o[k] = n[k]; }); return o; });
    const eduNode = (label, degDefault, years) => { const deg = inferDegree(label) || degDefault;
      return deg ? { id:newId(), kind:'real', label, degree:deg, sub:(DATA.meta.degrees[deg]||{}).label||'', years:years||'', layer:'current' }
                 : { id:newId(), kind:'custom', label, years:years||'', layer:'current' }; };
    b.education = schools.map(s => eduNode(s.degree + (s.school ? (' (' + s.school + ')') : ''), inferDegree(s.degree), s.years))   // a real degree → colored/leveled; unknown → custom
      .concat((certs || []).map(c => eduNode(c, 'Cert')));   // certifications default to the Cert level when the text isn't specific
    b.skill = []; const seenSk = new Set();   // only import skills that map to a real catalog tile — no blank/random customs
    (skills || []).forEach(s => { const m = matchSkillToCatalog(s);
      if (m && !seenSk.has(m.id)){ seenSk.add(m.id);
        b.skill.push({ id: newId(), atlasId: m.id, name: m.label, abbr: m.abbr, zcol: (DATA.growth.zones.skill||{}).color || '#4ECDC4', years: '', layer: 'current' }); } });
    b.notes = (p.summary || '').trim();   // Summary → Notes card
    const ach = (p.awards || []).concat(p.pubs || []);   // Honors-Awards + Publications → renamed "Achievements" card
    b.other = ach.map(s => '• ' + s).join('\n');
    if (ach.length){ (b.layout.titles = b.layout.titles || {}).other = 'Achievements'; b.layout.hidden = (b.layout.hidden||[]).filter(k => k !== 'other'); }   // show the Other card so the imported Achievements are visible
    return { build: b, overlaps: overlaps };
  }

  async function importLinkedInPdf(file){
    if (!file) return;
    liMsg('Reading PDF…', true);
    let ex, main, sb;
    try { ex = await extractLinkedInPdf(file); main = parseLinkedInLines(ex.lines); sb = parseSidebarLines(ex.sidebar); }
    catch(e){ liMsg('Could not read that PDF (' + ((e && e.message) || 'error') + ').', false); return; }
    if (!main.roles.length && !main.schools.length){ liMsg('No experience or education found. Is this a LinkedIn profile PDF (More → Save to PDF)?', false); return; }
    const res = linkedInToBuild({ name: ex.name, headline: ex.headline, roles: main.roles, schools: main.schools, summary: main.summary, skills: sb.skills, certs: sb.certs, awards: sb.awards, pubs: sb.pubs });
    const nC = res.build.career.length, nE = res.build.education.length, nS = res.build.skill.length;
    const note = res.overlaps ? (', ' + res.overlaps + ' forked concurrent') : '';
    const extra = nS ? (' and ' + nS + ' skill' + (nS !== 1 ? 's' : '')) : '';
    if (!confirm('Import ' + nC + ' role' + (nC !== 1 ? 's' : '') + note + ', ' + nE + ' school' + (nE !== 1 ? 's' : '') + extra + ' from "' + (res.build.name || 'this profile') + '"?\n\nThis REPLACES your current path (can\'t be undone).')){ liMsg('Import cancelled.', false); return; }
    build = migrateBuild(res.build); syncPinned(); saveBuild(); renderMyPath(); updateBoardPins();
    liMsg('Imported ' + nC + ' roles' + note + extra + ' ✓. Tidy up names and forks as needed.', true);
    setTimeout(closeDataModal, 1300);
  }

  function updateBoardPins(){
    gNodes.selectAll('g.hct-node').select('.hx-pinring')
      .style('stroke-dasharray', d => roleLayerInBuild(d) === 'future' ? '7 5' : null)
      .style('opacity', d => pinned.has(d) ? 1 : 0);
    gEdges.selectAll('path.hct-edge').style('opacity', d => edgeOpacity(d));
  }

  function totalNodes(){ return TRACKS.reduce((s,c)=> s + build[c.key].length, 0); }

  // board "Add to my path" → drops a real role into Career Growth (and rings it on the board)
  function togglePin(id){
    const i = build.career.findIndex(s => s.roleId === id);
    if (i >= 0) build.career.splice(i,1);
    else { const n = nodeById.get(id);
      build.career.push({ id:newId(), roleId:id, abbr:(n?n.abbr:''), family:(n?n.family:''), name:(n ? n.label.replace(/\n/g,' ') : 'Role'), years:'', layer:activeLayer() }); }
    syncPinned(); saveBuild(); renderMyPath(); updateBoardPins();
    if (selectedId===id) openPanel(id);
  }
  // panel pair: explicit layer choice — tapping the lit layer removes, the other layer moves, unpinned adds there
  function pinToLayer(id, layer){
    const s = build.career.find(x => x.roleId === id);
    if (s && nodeLayer(s) === layer){ togglePin(id); return; }
    if (s){ s.layer = layer; }
    else { const n = nodeById.get(id);
      build.career.push({ id:newId(), roleId:id, abbr:(n?n.abbr:''), family:(n?n.family:''), name:(n ? n.label.replace(/\n/g,' ') : 'Role'), years:'', layer }); }
    syncPinned(); saveBuild(); renderMyPath(); updateBoardPins();
    if (selectedId===id) openPanel(id);
  }
  // Education Growth picker → real credentials from the Education Matrix pool (deduped cert/degree faces)
  let credIndex = [];
  // generic academic degrees (not tied to one job) — colored by DEGREE level in the matrix; everything else by FAMILY
  const GENERIC_FACES = new Set(['MHA','MBA','MPH','MSN','BSN',"Master's",'Master',"Bachelor's",'Bachelor','Associate','AS','Certificate','Doctoral','Doctorate','HS / GED']);
  // color a credential hex EXACTLY like its Education-Matrix tile: stored col (captured on add) → family color → degree color
  function credHexColor(node){
    if (node && node.col) return node.col;
    const face = node && node.label;
    if (face && !GENERIC_FACES.has(face)){
      const e = credIndex.find(c => c.face === face);
      if (e && e.roleIds && e.roleIds.length){ const r = nodeById.get(e.roleIds[0]);
        const fc = r && (DATA.classes.roles.families[r.family]||{}).color; if (fc) return fc; }
    }
    return (DATA.meta.degrees[node && node.degree]||{}).color || '#E8C547';
  }
  let eduSelId = null;   // selected credential hex in the Education Growth shell
  let eduMatrixSel = null, eduCards = [];   // Education MATRIX: selected card index + flat card list for lookup
  let dragSrc = null;    // {list, idx} while dragging a My Path tile to reorder
  let dashDrag = null;   // panel key being dragged in the dashboard
  let dashSig = '';      // last-rendered dashboard layout signature (rebuild only on change)
  // hex axial coords in outward SPIRAL order (center first), pointy-top
  function hexSpiral(count){
    const res = [{q:0,r:0}], dir = [[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];
    for (let k=1; res.length < count; k++){
      let q = dir[4][0]*k, r = dir[4][1]*k;
      for (let side=0; side<6 && res.length<count; side++){
        for (let step=0; step<k && res.length<count; step++){ res.push({q,r}); q += dir[side][0]; r += dir[side][1]; }
      }
    }
    return res.slice(0, count);
  }
  function buildCredIndex(){
    const map = new Map();
    (DATA.classes.roles.nodes||[]).forEach(n => { const face = credFace(n); if (!face) return;
      if (!map.has(face)) map.set(face, { face, roles:[], roleIds:[], degCount:{} });
      const e = map.get(face); e.roles.push(n.label.replace(/\n/g,' ')); e.roleIds.push(n.id); e.degCount[n.degree] = (e.degCount[n.degree]||0)+1; });
    credIndex = [...map.values()].map(e => {
      // known academic faces get their true level; role-specific certs use the most common role degree
      let deg = DEG_FACE_LEVEL[e.face];
      if (!deg){ let best=null,bc=-1; Object.keys(e.degCount).forEach(d=>{ if(e.degCount[d]>bc){bc=e.degCount[d];best=d;} }); deg = best || 'Cert'; }
      const dl = (DATA.meta.degrees[deg]||{}).label || deg;
      return { face:e.face, degree:deg, degreeLabel:dl, roles:e.roles, roleIds:e.roleIds,
        search:(e.face+' '+dl+' '+deg+' '+e.roles.join(' ')).toLowerCase() };
    }).sort((a,b)=> (DEG_LEVEL[a.degree]||0)-(DEG_LEVEL[b.degree]||0) || (a.face<b.face?-1:1));
  }
  function addCredFromIndex(face, degree){
    const node = { id:newId(), kind:'real', label:face, degree, sub:(DATA.meta.degrees[degree]||{}).label||'', years:'', layer:activeLayer() };
    build.education.push(node);
    eduSelId = node.id; saveBuild(); renderMyPath(); openCredPanel(node);   // drop it in + show its details
  }
  function addCustomNode(key){
    if (key==='education') build.education.push({ id:newId(), kind:'custom', label:'', years:'', layer:activeLayer() });
    else build[key].push({ id:newId(), name:'', years:'', layer:activeLayer() });
    saveBuild(); renderMyPath();
  }
  function resetBuild(){
    if (!confirm('Clear this build?\n\nEvery growth track (career, education, skills, specialization, experience) plus notes for the current view will be wiped.')) return;
    hwDismissed = true;   // an intentional clear gets the quiet strip, not the popup
    build = blankBuild(); syncPinned(); saveBuild(); renderMyPath(); updateBoardPins();
  }

  // ONE VIEW by default: both layers, always. "Goals only" is the theorycraft toggle,
  // just the plan with current tiles ghosted. (The 3-way All/Current/Future shifter
  // retired 2026-07-12 — rings already say have vs aiming, so Current-only had no story.)
  function setLayerView(v){
    build.view = (v==='future') ? 'future' : 'both';
    saveBuild(); syncShift(); renderMyPath();
  }
  function syncShift(){
    const on = build.view === 'future';
    const gb = document.getElementById('hct-mp-goals');
    if (gb){ gb.classList.toggle('on', on); gb.setAttribute('aria-pressed', String(on)); }
    const bp = document.getElementById('hct-mypath'); if (bp) bp.setAttribute('data-layerview', build.view||'both');
  }

  // display name for a tile across tracks
  function tileDisplayName(n, k){
    if (k==='career') return n.name || n.abbr || 'Role';
    if (k==='education') return n.label || n.sub || 'Credential';
    return n.name || n.abbr || 'Item';
  }
  // identity-bar header: current role · level + vital stat chips
  function renderSheetHeader(){
    const nm = asInput(document.getElementById('bp-name')); if (nm && document.activeElement !== nm) nm.value = build.name || '';
    const gl = asInput(document.getElementById('bp-goal')); if (gl && document.activeElement !== gl) gl.value = build.goal || '';
    const roleEl = document.getElementById('bp-role');
    if (roleEl){
      const cur = build.career.filter(n => nodeLayer(n)==='current');
      const role = cur.length ? cur[cur.length-1] : null;   // most-advanced role you HAVE
      if (role){ roleEl.innerHTML = '<b>'+esc(tileDisplayName(role,'career'))+'</b>';   // current role only — the "Tier N" depth number read as jargon
      } else roleEl.textContent = 'Add your current role to begin';
    }
    const tg = document.getElementById('bp-tagline');
    if (tg){ const t = (build.tagline||'').trim(); tg.textContent = t; tg.style.display = t ? '' : 'none'; }
    const vit = document.getElementById('bp-vitals');
    if (vit){
      const cur = k => build[k].filter(n => nodeLayer(n)==='current').length;
      const goals = TRACKS.reduce((s,c)=> s + build[c.key].filter(n => nodeLayer(n)==='future').length, 0);
      const chips = [[cur('career'),'Roles'],[cur('education'),'Creds'],[cur('skill')+cur('spec')+cur('experience'),'Skills'],[goals,'Goals',true]];
      vit.innerHTML = chips.map(([n2,l,g]) => '<div class="bp-vital'+(g?' goal':'')+'"><div class="bp-vital-n">'+n2+'</div><div class="bp-vital-l">'+l+'</div></div>').join('');
    }
  }
  // ── Next Steps = an action plan: your Future-layer items + steps auto-routed from where you are to your goal ──
  function futureOf(k){ return build[k].filter(n => nodeLayer(n)==='future'); }
  function currentRoleNode(){   // your most-advanced CURRENT role that maps to a real board node
    if (!nodeById || !nodeById.size) return null;
    const cur = build.career.filter(n => nodeLayer(n)==='current' && n.roleId && nodeById.has(n.roleId));
    if (!cur.length) return null;
    return cur.map(n => nodeById.get(n.roleId)).sort((a,b) => (a.tier||0)-(b.tier||0)).pop();
  }
  function bfsLeadsTo(fromId, toId){   // shortest forward path through the leadsTo edges
    if (fromId === toId) return [fromId];
    const q = [[fromId]], seen = new Set([fromId]); let guard = 0;
    while (q.length && guard++ < 6000){
      const path = q.shift(), node = nodeById.get(path[path.length-1]); if (!node) continue;
      for (const t of (node.leadsTo || [])){ if (seen.has(t)) continue;
        if (t === toId) return path.concat(t); seen.add(t); q.push(path.concat(t)); }
    }
    return null;
  }
  function credForNode(node){ try { return credFace(node) || ''; } catch(_){ return ''; } }
  // the plan's TARGETS are your Future-layer role tiles; route current → each, collect the gaps
  function planFromFutureTiles(){
    const start = currentRoleNode();
    const futureRoles = build.career.filter(n => nodeLayer(n)==='future' && n.roleId && nodeById.has(n.roleId));
    const pinnedRoles = new Set(build.career.filter(n => n.roleId).map(n => n.roleId));
    const haveCred = new Set(build.education.filter(e => e.kind==='real').map(e => e.label + '|' + e.degree));
    const school = [], midRoles = []; const seenDeg = new Set(), seenRole = new Set();
    futureRoles.forEach(fr => {
      const target = nodeById.get(fr.roleId);
      const ids = start ? bfsLeadsTo(start.id, target.id) : null;
      const path = ids ? ids.map(id => nodeById.get(id)) : [target];
      let prevDeg = start ? (DEG_LEVEL[start.degree] || 0) : -1;
      path.forEach(node => {
        if (start && node.id === start.id){ prevDeg = DEG_LEVEL[node.degree] || 0; return; }
        const dl = DEG_LEVEL[node.degree] || 0;
        if (dl > prevDeg){
          const face = credForNode(node) || (DATA.meta.degrees[node.degree]||{}).label || node.degree;
          const key = face + '|' + node.degree;
          if (!seenDeg.has(key) && !haveCred.has(key)){ seenDeg.add(key);
            school.push({ face: face, degree: node.degree, col: (DATA.meta.degrees[node.degree]||{}).color || '' }); }
        }
        prevDeg = Math.max(prevDeg, dl);
        if (node.id !== target.id && !pinnedRoles.has(node.id) && !seenRole.has(node.id)){ seenRole.add(node.id);
          midRoles.push({ label: 'Step into ' + node.label.replace(/\n/g, ' '), action: 'On the way to ' + target.label.replace(/\n/g, ' ') + '.' }); }
      });
    });
    return { school: school, midRoles: midRoles };
  }
  // which layer a role sits on in YOUR build (current = have, future = want), or null if it isn't on your path
  function roleLayerInBuild(id){
    for (const s of build.career){ if (s.roleId === id) return nodeLayer(s);
      for (const c of concsOf(s)) if (c.roleId === id) return nodeLayer(c); }
    return null;
  }
  // add a required credential to Education Growth at the given layer — current for a role you HAVE, future for one you WANT (deduped)
  function addReqCred(face, degree, col, layer){
    if (!face) return;
    layer = (layer === 'current') ? 'current' : 'future';
    let node = build.education.find(e => e.kind==='real' && e.label===face && e.degree===degree);
    if (!node){ node = { id:newId(), kind:'real', label:face, degree:degree, col:col||null, sub:(DATA.meta.degrees[degree]||{}).label||'', years:'', layer:layer }; build.education.push(node); }
    else if (layer === 'current') node.layer = 'current';   // you have it now — upgrade, never downgrade a current cred to future
    syncPinned(); saveBuild(); renderMyPath();
  }

  // ── CHECKLISTS — requirement items you hold or don't (flow doc stage 5). Ticks live on
  //    build.checks keyed r|roleId|item (role req) / c|credId|item (a credential's Getting-in
  //    items), so the same fact reads checked in the panel AND on Next Steps. A count, never
  //    a percentage — no guilt bars on a life.
  function ckKey(kind, id, item){ return kind + '|' + id + '|' + String(item).toLowerCase().replace(/\s+/g,' ').trim().slice(0,64); }
  function ckRow(kind, id, item){
    const k = ckKey(kind, id, item), on = !!(build.checks && build.checks[k]);
    return '<div class="bp-chkrow'+(on?' on':'')+'" data-ck="'+esc(k)+'" role="checkbox" aria-checked="'+(on?'true':'false')+'" tabindex="0"><span class="bp-chk-g">'+(on?'●':'○')+'</span><span class="bp-chk-t">'+esc(item)+'</span></div>';
  }
  // a credential's Getting-in facts as discrete tickable items (entrance exams, prereqs, hours)
  function credEntryItems(face){
    const s = credStats(face); if (!s || !s.entry) return [];
    const e = s.entry, out = [];
    (e.exams||[]).forEach(x => out.push(x + ' (entrance exam)'));
    (e.prereqs||[]).forEach(p => out.push(p));
    if (e.hours) out.push(e.hours);
    return out;
  }
  function credCkId(face){ return (CREDS && CREDS.faceMap && CREDS.faceMap[face]) || face; }   // stable creds-file id when we have one
  function ckProgress(kind, id, items){
    let done = 0; items.forEach(it => { if (build.checks && build.checks[ckKey(kind,id,it)]) done++; });
    return { done: done, total: items.length };
  }
  let chkWired = false;
  function wireChecklists(){
    if (chkWired) return; chkWired = true;
    const toggle = (el) => {
      const k = el.getAttribute('data-ck'); if (!k) return;
      if (!build.checks) build.checks = {};
      const on = !build.checks[k];
      if (on) build.checks[k] = 1; else delete build.checks[k];
      saveBuild();
      // flip every rendered copy of this fact in place (panel + Next Steps can both show it)
      qsa(document,'[data-ck]').forEach(x => { if (x.getAttribute('data-ck') === k){
        x.classList.toggle('on', on); x.setAttribute('aria-checked', on ? 'true' : 'false');
        const g = x.querySelector('.bp-chk-g'); if (g) g.textContent = on ? '●' : '○'; } });
      renderNextSteps(); renderSectionGuides();   // progress counts stay honest
    };
    document.addEventListener('click', e => { const el = hit(e,'[data-ck]'); if (el){ e.stopPropagation(); toggle(el); } });
    // shared modal focus trap: Tab stays inside the open .bp-modal (dialog contract)
  document.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const modal = document.querySelector('.bp-modal.open');
    if (!modal) return;
    const focusables = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (!focusables.length) return;
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first){ e.preventDefault(); asEl(last).focus(); }
    else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); asEl(first).focus(); }
    else if (!modal.contains(document.activeElement)){ e.preventDefault(); asEl(first).focus(); }
  }, true);
  document.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const el = hit(e,'[data-ck]'); if (el){ e.preventDefault(); toggle(el); } });
  }

  // ── PLAN TOTALS — the bill (flow doc stage 5): rough years of school, exam fees, exam count
  //    for everything on the road (future education tiles + the plan's still-unpinned requirements).
  const YRS_CUM  = { 'HS':0, 'Cert':0.75, 'AS':2, 'BS':4, 'MS':6.25, 'Doc':8.5, 'MD/DO':8 };   // typical years of school to STAND at each level, from HS
  const YRS_SOLO = { 'Cert':0.75, 'AS':2, 'BS':2, 'MS':2, 'Doc':3, 'MD/DO':4 };               // a sideways program at/below where you already stand
  function feeDollars(fee){
    if (!fee) return 0;
    const s = String(fee).replace(/\([^)]*\)/g, '');   // parentheticals are alternates (member rates, reapplicant), never additive
    const out = []; const re = /\$([\d,]+)/g; let m;
    while ((m = re.exec(s))){
      if (/retake|reapplicant/i.test(s.slice(re.lastIndex, re.lastIndex + 24))) continue;   // second-try pricing isn't the first bill
      out.push(parseInt(m[1].replace(/,/g,''), 10) || 0);
    }
    if (!out.length) return 0;
    if (out.length > 1 && /member/i.test(s)) return Math.max.apply(null, out);   // member/nonmember pairs → the public price
    return out.reduce((a,b) => a + b, 0);
  }
  function planBill(roadItems){
    // roadItems: [{face, degree}] deduped. Baseline = the highest education level you already hold.
    let yrsAt = 0;
    build.education.forEach(e => { if (e.kind === 'real' && nodeLayer(e) === 'current'){ const c = YRS_CUM[e.degree]; if (c != null && c > yrsAt) yrsAt = c; } });
    let years = 0, fees = 0, exams = 0;
    roadItems.slice().sort((a,b) => (DEG_LEVEL[a.degree]||0) - (DEG_LEVEL[b.degree]||0)).forEach(it => {
      const cum = YRS_CUM[it.degree];
      if (cum != null){ if (cum > yrsAt){ years += cum - yrsAt; yrsAt = cum; } else years += YRS_SOLO[it.degree] || 0; }
      const s = credStats(it.face);
      if (s){ exams++; fees += feeDollars(s.fee); }
    });
    return { years: Math.round(years * 2) / 2, fees: fees, exams: exams, count: roadItems.length };
  }
  // the road = pinned future education + the plan's still-unpinned school requirements (disjoint by construction)
  function planRoad(){
    const seen = new Set(), road = [];
    futureOf('education').forEach(n => { if (n.kind !== 'real') return; const k = n.label + '|' + n.degree; if (!seen.has(k)){ seen.add(k); road.push({ face: n.label, degree: n.degree }); } });
    planFromFutureTiles().school.forEach(s => { const k = s.face + '|' + s.degree; if (!seen.has(k)){ seen.add(k); road.push({ face: s.face, degree: s.degree }); } });
    return road;
  }
  function billHTML(){
    const road = planRoad();
    if (!road.length) return '';
    const b = planBill(road);
    if (!b.years && !b.fees && !b.exams) return '';
    let tiles = '';
    if (b.years) tiles += '<div class="bp-bill-t"><div class="v">~'+(b.years % 1 ? b.years.toFixed(1) : b.years)+'</div><div class="k">years of school</div></div>';
    if (b.exams) tiles += '<div class="bp-bill-t"><div class="v">'+b.exams+'</div><div class="k">board exam'+(b.exams!==1?'s':'')+'</div></div>';
    if (b.fees) tiles += '<div class="bp-bill-t"><div class="v">~$'+b.fees.toLocaleString('en-US')+'</div><div class="k">in exam fees</div></div>';
    return '<div class="bp-bill"><div class="bp-bill-h">The bill · what your road costs</div><div class="bp-bill-grid">'+tiles+'</div>'
         + '<div class="bp-bill-fine">Rough math over '+b.count+' credential'+(b.count!==1?'s':'')+' on your road ('+esc(road.map(r=>r.face).join(', '))+') from typical program lengths and posted exam fees. Tuition varies too much to guess; programs and states set their own numbers.</div></div>';
  }

  function renderNextSteps(){
    const host = document.getElementById('bp-next'); if (!host) return;
    wireChecklists();
    const targets = build.career.filter(n => nodeLayer(n)==='future');
    let h = targets.length
      ? '<div class="bp-next-goal">Aiming for <b>'+targets.map(n => esc(tileDisplayName(n,'career'))).join(', ')+'</b></div>'
      : '<div class="bp-next-goal bp-next-nogoal">Pin a role you want (☆ I\'m aiming for it, on any role) and your step-by-step plan builds here.</div>';
    const actGeneric = { education:'Research programs, apply, enroll, then earn it.', skill:'Practice it until it sticks.',
                  spec:'Build real depth here.', experience:'Put in time in this setting.', career:'Apply once the steps above are in hand.' };
    // Skills / specializations / experience carry their own specifics in the Areas-of-Expertise detail (how to build it,
    // how you show it) — surface those per item instead of one generic line for the whole group.
    const actLine = (s) => '<span class="bp-next-act">'+esc(s)+'</span>';
    const nextActHTML = (n,k) => {
      if (k === 'skill' || k === 'spec' || k === 'experience' || k === 'population'){
        const det = n.atlasId && growthDetail[n.atlasId];
        if (det && (det.how || det.show)){
          return (det.how ? '<span class="bp-next-act"><b class="bp-next-lbl">Build</b>'+esc(det.how)+'</span>' : '')
               + (det.show ? '<span class="bp-next-act"><b class="bp-next-lbl">Show</b>'+esc(det.show)+'</span>' : '');
        }
        const gn = n.atlasId && growthById.get(n.atlasId);   // fall back to the tile summary if detail hasn't loaded
        if (gn && gn.summary) return actLine(gn.summary + (gn.seen ? '  ·  ' + gn.seen : ''));
      }
      return actLine(actGeneric[k]);
    };
    // per-item checklist: a future role carries its req[] facts; a future credential carries its
    // Getting-in facts. Progress reads as a count in the row's bold line.
    const ckBlock = (n,k) => {
      let kind, id, items;
      if (k === 'career' && n.roleId && nodeById.has(n.roleId)){ const node = nodeById.get(n.roleId); kind='r'; id=node.id; items=(node.req && node.req.items)||[]; }
      else if (k === 'education' && n.kind === 'real'){ kind='c'; id=credCkId(n.label); items=credEntryItems(n.label); }
      else return { html:'', prog:'' };
      if (!items.length) return { html:'', prog:'' };
      const p = ckProgress(kind, id, items);
      return { html: '<div class="bp-chklist">'+items.map(it => ckRow(kind, id, it)).join('')+'</div>',
               prog: '<span class="bp-next-prog">'+p.done+' of '+p.total+' in hand</span>' };
    };
    const itemRow = (n,k) => { const c = ckBlock(n,k);
      return '<div class="bp-next-item" data-k="'+k+'" data-id="'+esc(n.id||'')+'"><span class="bp-next-chk">◇</span><span class="bp-next-tx"><b>'+esc(tileDisplayName(n,k))+c.prog+'</b>'+nextActHTML(n,k)+c.html+'</span></div>'; };
    const sugRow = (label,action) => '<div class="bp-next-item bp-next-sug"><span class="bp-next-chk">✦</span><span class="bp-next-tx"><b>'+esc(label)+'</b><span class="bp-next-act">'+esc(action)+'</span></span></div>';
    const addRow = (s) => '<div class="bp-next-item bp-next-add" data-face="'+esc(s.face)+'" data-deg="'+esc(s.degree)+'" data-col="'+esc(s.col||'')+'" title="Add to your Education plan"><span class="bp-next-chk">+</span><span class="bp-next-tx"><b>'+esc(s.face)+'</b><span class="bp-next-act">Required for your goal. Click to add it to Education.</span></span></div>';

    h += billHTML();   // the bill leads: what the whole road costs, before the step-by-step

    const plan = planFromFutureTiles();
    let any = false;
    const stage = (title, parts) => { if (!parts.length) return; any = true; h += '<div class="bp-next-grp">'+title+'</div>' + parts.join(''); };

    stage('Schooling & credentials',
      futureOf('education').map(n => itemRow(n,'education')).concat(plan.school.map(addRow)));
    stage('Skills & experience',
      ['skill','spec','experience','population'].reduce((a,k) => a.concat(futureOf(k).map(n => itemRow(n,k))), []));
    stage('Roles to land',
      futureOf('career').map(n => itemRow(n,'career')).concat(plan.midRoles.map(s => sugRow(s.label, s.action))));

    if (!any) h += '<div class="bp-next-empty">No future goals yet. Pin a role you\'re aiming for and the plan to reach it shows up here.</div>';
    host.innerHTML = h;
    qsa(host,'.bp-next-item[data-id]').forEach(el => el.onclick = (ev) => {
      if (hit(ev,'[data-ck]')) return;   // a checklist tick is its own fact, not "I landed the whole thing"
      const n = (build[el.dataset.k]||[]).find(x => x.id === el.dataset.id);
      if (n){ n.layer = 'current'; saveBuild(); renderMyPath(); }   // achieved → moves into your Current layer
    });
    qsa(host,'.bp-next-add').forEach(el => el.onclick = () => addReqCred(el.dataset.face, el.dataset.deg, el.dataset.col, 'future'));   // plan suggestions are toward future goals
  }

  // ── CHARACTER CREATION — four stations followed ON the sheet (the D&D framing):
  //    who you are → what you're becoming → the road → your specialization. The first
  //    incomplete station carries the arrow; every station opens a focused picker
  //    popup. No screen-jumping. State, not tour — derived fresh every render.
  const STATIONS = [
    { key:'who',  n:1, kicker:'Who you are',           empty:'Name your starting point' },
    { key:'goal', n:2, kicker:'What you\'re becoming', empty:'Pick a destination' },
    { key:'road', n:3, kicker:'The road',              empty:'Waits on a destination' },
    { key:'spec', n:4, kicker:'Your specialization',   empty:'Claim your expertise' }
  ];
  function stationState(){
    const curRole = currentRoleNode();
    const curEdu  = build.education.filter(e => nodeLayer(e) === 'current');
    const goals   = build.career.filter(n => !n.anchor && nodeLayer(n) === 'future');
    const plan    = goals.length ? planFromFutureTiles() : { school: [], midRoles: [] };
    const futEdu  = build.education.filter(e => nodeLayer(e) === 'future');
    const areas   = ['skill','spec','experience','population'].reduce((s,k) => s + (build[k]||[]).length, 0);
    return {
      who:  { done: !!(curRole || curEdu.length),
              line: curRole ? curRole.label.replace(/\n/g,' ') + (curEdu.length ? ' · ' + curEdu[curEdu.length-1].label : '')
                            : (curEdu.length ? curEdu[curEdu.length-1].label : '') },
      goal: { done: goals.length > 0,
              line: goals.length ? tileDisplayName(goals[0],'career') + (goals.length > 1 ? ' +' + (goals.length-1) : '') : '' },
      road: { dormant: !goals.length,
              done: goals.length > 0 && plan.school.length === 0,
              line: !goals.length ? '' : (plan.school.length
                    ? plan.school.length + ' credential' + (plan.school.length !== 1 ? 's' : '') + ' to pin'
                    : (futEdu.length ? futEdu.length + ' on the road' : 'Road clear')) },
      spec: { done: areas > 0, line: areas ? areas + ' area' + (areas !== 1 ? 's' : '') + ' claimed' : '' }
    };
  }
  function renderSectionGuides(){
    // the stations decorate the numbered section headers: one guide chip per section,
    // arrow on the first incomplete, click = that station's focused picker popup
    if (!DATA) return;
    const st = stationState();
    const lineDone = st.who.done && st.goal.done;
    const g = {
      line: lineDone ? { cls:'done', txt:'✓ ' + (st.who.line && st.goal.line ? st.who.line + ' → ' + st.goal.line : (st.goal.line || st.who.line)), open:'goal' }
           : !st.who.done ? { cls:'todo', txt:'Name your starting point', open:'who' }
           : { cls:'todo', txt:'Pick a destination', open:'goal' },
      road: st.road.dormant ? { cls:'dormant', txt:'Waits on a destination', open:'road' }
           : st.road.done ? { cls:'done', txt:'✓ ' + st.road.line, open:'road' }
           : { cls:'todo', txt: st.road.line, open:'road' },
      spec: st.spec.done ? { cls:'done', txt:'✓ ' + st.spec.line, open:'spec' }
           : { cls:'todo', txt:'Claim your expertise', open:'spec' },
      plan: null   // ④ is the output; the plan itself sits right under the header
    };
    let arrowed = false;
    Object.keys(g).forEach(sec => {
      const el = document.getElementById('bp-guide-' + sec); if (!el) return;
      const d = g[sec];
      if (!d){ el.hidden = true; return; }
      const isNext = !arrowed && d.cls === 'todo';
      if (isNext) arrowed = true;
      el.hidden = false;
      el.className = 'bp-guide ' + d.cls + (isNext ? ' next' : '');
      el.innerHTML = (isNext ? '<span class="st-arrow">→ start here</span>' : '') + esc(d.txt);
      el.onclick = (e) => { e.stopPropagation(); openStation(d.open); };
    });
  }
  // one modal shell, one focused picker per station
  function stationModal(open){
    const m = document.getElementById('bp-station-modal'); if (m) m.classList.toggle('open', !!open);
  }
  function stationRoleSearch(inpId, listId, onPick){
    const inp = asInput(document.getElementById(inpId)), list = document.getElementById(listId);
    if (!inp || !list) return;
    inp.addEventListener('input', () => {
      const q = (inp.value||'').trim().toLowerCase();
      const m = !q ? [] : DATA.classes[curClass].nodes
        .filter(n => (n.label.replace(/\n/g,' ')+' '+(n.abbr||'')+' '+n.family+' '+n.pathway).toLowerCase().includes(q)).slice(0, 8);
      list.hidden = !m.length;
      list.innerHTML = m.map(n => '<button type="button" class="hw-sg" data-r="'+n.id+'">'+esc(n.label.replace(/\n/g,' '))
        + '<span class="hw-sg-meta">'+esc(n.abbr||'')+' · '+esc(n.family)+'</span></button>').join('');
      qsa(list,'[data-r]').forEach(b => asEl(b).onclick = () => { onPick(b.dataset.r); inp.value = ''; list.hidden = true; });
    });
  }
  function openStation(key){
    const h = document.getElementById('bp-station-h'), body = document.getElementById('bp-station-body');
    if (!h || !body || !DATA) return;
    const d = STATIONS.find(s => s.key === key) || STATIONS[0];
    h.textContent = d.n + ' · ' + d.kicker;
    const rerender = () => openStation(key);   // mutations re-render the picker in place

    if (key === 'who'){
      const cur = build.career.filter(n => !n.anchor && nodeLayer(n) === 'current');
      let hh = '<div class="bp-modal-lbl">Your current role. Search the catalog; picking one lights your line on every board.</div>'
        + '<input id="st-role-in" class="hw-search-in" type="text" placeholder="Search 164 real roles…" autocomplete="off">'
        + '<div class="hw-suggest" id="st-role-list" hidden></div>';
      if (cur.length) hh += '<div class="st-rows">' + cur.map(n =>
        '<div class="st-row">'+esc(tileDisplayName(n,'career'))+'<span class="st-sub">current</span><button type="button" class="st-x" data-rm="'+esc(n.id)+'" title="Remove">×</button></div>').join('') + '</div>';
      hh += '<div class="bp-modal-lbl" style="margin-top:12px">Highest education completed</div><div class="hw-chips" id="st-edu-chips">'
        + ['HS','Cert','AS','BS','MS','Doc'].map(dg => { const lbl = (DATA.meta.degrees[dg]||{}).label || dg;
            const held = build.education.some(e => e.kind === 'real' && e.degree === dg && nodeLayer(e) === 'current');
            return '<button type="button" class="hw-chip" data-deg="'+dg+'" aria-pressed="'+held+'">'+esc(lbl)+'</button>'; }).join('')
        + '</div>';
      body.innerHTML = hh;
      stationRoleSearch('st-role-in','st-role-list', id => { pinToLayer(id, 'current'); rerender(); });
      qsa(body,'[data-rm]').forEach(b => b.onclick = () => {
        const k = build.career.findIndex(n => n.id === b.dataset.rm);
        if (k >= 0){ build.career.splice(k,1); syncPinned(); saveBuild(); renderMyPath(); updateBoardPins(); } rerender(); });
      qsa(body,'[data-deg]').forEach(b => b.onclick = () => {
        const dg = b.dataset.deg, degLbl = (DATA.meta.degrees[dg]||{}).label || dg;
        const have = build.education.find(e => e.kind === 'real' && e.degree === dg && e.label === degLbl);
        if (have) build.education.splice(build.education.indexOf(have), 1);
        else build.education.push({ id:newId(), kind:'real', label:degLbl, degree:dg, sub:degLbl, years:'', layer:'current' });
        syncPinned(); saveBuild(); renderMyPath(); rerender(); });
    }

    if (key === 'goal'){
      const goals = build.career.filter(n => !n.anchor && nodeLayer(n) === 'future');
      let hh = '<div class="bp-modal-lbl">The role you\'re aiming at. Pin more than one if you\'re weighing options.</div>'
        + '<input id="st-goal-in" class="hw-search-in" type="text" placeholder="Search 164 real roles…" autocomplete="off">'
        + '<div class="hw-suggest" id="st-goal-list" hidden></div>';
      if (goals.length) hh += '<div class="st-rows">' + goals.map(n =>
        '<div class="st-row">'+esc(tileDisplayName(n,'career'))+'<span class="st-sub">goal</span><button type="button" class="st-x" data-rm="'+esc(n.id)+'" title="Remove">×</button></div>').join('') + '</div>';
      body.innerHTML = hh;
      stationRoleSearch('st-goal-in','st-goal-list', id => { pinToLayer(id, 'future'); rerender(); });
      qsa(body,'[data-rm]').forEach(b => b.onclick = () => {
        const k = build.career.findIndex(n => n.id === b.dataset.rm);
        if (k >= 0){ build.career.splice(k,1); syncPinned(); saveBuild(); renderMyPath(); updateBoardPins(); } rerender(); });
    }

    if (key === 'road'){
      const goals = build.career.filter(n => !n.anchor && nodeLayer(n) === 'future');
      if (!goals.length){
        body.innerHTML = '<div class="bp-modal-lbl">The road needs a destination first.</div>'
          + '<button type="button" class="bp-modal-btn primary" id="st-to-goal">Pick a destination</button>';
        const g = document.getElementById('st-to-goal'); if (g) g.onclick = () => openStation('goal');
      } else {
        const plan = planFromFutureTiles();
        const futEdu = build.education.filter(e => nodeLayer(e) === 'future');
        let hh = '<div class="bp-modal-lbl">What the gap between here and your goal demands, priced in public numbers.</div>';
        if (plan.school.length) hh += '<div class="st-rows">' + plan.school.map(s =>
          '<div class="st-row">'+esc(s.face)+'<span class="st-sub">'+esc((DATA.meta.degrees[s.degree]||{}).label || s.degree)+'</span>'
          + '<button type="button" class="st-add" data-face="'+esc(s.face)+'" data-deg="'+esc(s.degree)+'" data-col="'+esc(s.col||'')+'">+ Pin to the road</button></div>').join('') + '</div>';
        if (futEdu.length) hh += '<div class="bp-modal-lbl" style="margin-top:10px">Already on the road</div><div class="st-rows">' + futEdu.map(e =>
          '<div class="st-row">'+esc(e.label)+'<span class="st-sub">'+esc((DATA.meta.degrees[e.degree]||{}).label || e.degree || '')+'</span><span class="st-chk" style="margin-left:auto;color:var(--teal)">✓</span></div>').join('') + '</div>';
        if (!plan.school.length && !futEdu.length) hh += '<div class="bp-modal-lbl">Nothing missing. Your Next Steps card carries the plan.</div>';
        body.innerHTML = hh;
        qsa(body,'.st-add').forEach(b => b.onclick = () => { addReqCred(b.dataset.face, b.dataset.deg, b.dataset.col, 'future'); rerender(); });
      }
    }

    if (key === 'spec'){
      const start = currentRoleNode();
      const ids = (start && DATA.growth && DATA.growth.familySuggest && DATA.growth.familySuggest[start.family]) || [];
      const have = new Set(); TRACKS.forEach(t => (build[t.key]||[]).forEach(n => { if (n.atlasId) have.add(n.atlasId); }));
      const sugg = ids.map(id => growthById.get(id)).filter(n => n && !have.has(n.id)).slice(0, 8);
      let hh = '<div class="bp-modal-lbl">The expertise around your line. Tap what you already hold; search for the rest.</div>';
      if (sugg.length) hh += '<div class="st-rows">' + sugg.map(n => { const z = DATA.growth.zones[n.zone]||{};
        return '<div class="st-row">'+esc(n.label)+'<span class="st-sub">'+esc(z.label || n.zone)+'</span>'
          + '<button type="button" class="st-add" data-sg="'+esc(n.id)+'">+ I have this</button></div>'; }).join('') + '</div>';
      hh += '<input id="st-spec-in" class="hw-search-in" type="text" placeholder="Search skills, specialties, settings, populations…" autocomplete="off" style="margin-top:8px">'
        + '<div class="st-rows" id="st-spec-res"></div>'
        + '<button type="button" class="hct-jump" data-goview="atlas" id="st-spec-map">Explore the whole map →</button>';
      body.innerHTML = hh;
      qsa(body,'[data-sg]').forEach(b => b.onclick = () => { const gn = growthById.get(b.dataset.sg); if (gn) pinGrowthToLayer(gn, 'current'); rerender(); });
      const inp = asInput(document.getElementById('st-spec-in')), res = document.getElementById('st-spec-res');
      if (inp) inp.addEventListener('input', () => {
        const q = (inp.value||'').trim().toLowerCase();
        const m = !q ? [] : DATA.growth.nodes.filter(n => ((n.label||'')+' '+(n.group||'')).toLowerCase().includes(q) && !have.has(n.id)).slice(0, 6);
        res.innerHTML = m.map(n => { const z = DATA.growth.zones[n.zone]||{};
          return '<div class="st-row">'+esc(n.label)+'<span class="st-sub">'+esc(z.label || n.zone)+'</span>'
            + '<button type="button" class="st-add" data-sgq="'+esc(n.id)+'">+ Have it</button>'
            + '<button type="button" class="st-add" data-sgf="'+esc(n.id)+'" style="margin-left:6px">☆ Aiming</button></div>'; }).join('');
        qsa(res,'[data-sgq]').forEach(b => b.onclick = () => { const gn = growthById.get(b.dataset.sgq); if (gn) pinGrowthToLayer(gn, 'current'); rerender(); });
        qsa(res,'[data-sgf]').forEach(b => b.onclick = () => { const gn = growthById.get(b.dataset.sgf); if (gn) pinGrowthToLayer(gn, 'future'); rerender(); });
      });
      const mapBtn = document.getElementById('st-spec-map'); if (mapBtn) mapBtn.addEventListener('click', () => stationModal(false));   // deep-dive: close the popup, the delegate changes the view
    }
    stationModal(true);
  }

  // ── Export My Path as a JPEG (lazy-loads html2canvas only on first use) ──
  let html2canvasPromise = null;
  function ensureHtml2canvas(){
    if (window.html2canvas) return Promise.resolve();
    if (!html2canvasPromise) html2canvasPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
      s.onload = () => resolve(undefined); s.onerror = () => reject(new Error('html2canvas failed to load'));
      document.head.appendChild(s);
    });
    return html2canvasPromise;
  }
  // small on-brand hex chip for the export sheet sections
  function exMiniHex(abbr, color, dashed){
    const r = 17, w = 2*r, h = 2*r+4, cx = r, cy = r+2;
    const t = String(abbr||'').slice(0,5);
    const fs = t.length>4 ? 7 : t.length>2 ? 9 : 11;
    return '<svg width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'" style="flex:0 0 auto">'+
      '<path d="'+hexPath(cx,cy,r)+'" fill="'+hexA(color,0.22)+'" stroke="'+color+'" stroke-width="2"'+(dashed?' stroke-dasharray="3 2"':'')+'/>'+
      '<text x="'+cx+'" y="'+(cy+fs*0.34).toFixed(1)+'" text-anchor="middle" style="font-family:var(--font);font-weight:800;font-size:'+fs+'px;fill:#EAF6F4">'+esc(t)+'</text></svg>';
  }
  // Build a fixed-width (1080px) export poster straight from the build DATA — identical on any device (phone or desktop),
  // not a screenshot of the live responsive layout. Clean header + scaled trunk + uniform section cards + full text.
  function buildExportSheet(){
    const W = 1080, PAD = 42, contentW = W - PAD*2;
    const sheet = document.createElement('div'); sheet.className = 'hct-export-sheet'; sheet.style.width = W+'px';
    const name = (build.name||'').trim() || 'My Career Path';
    const roleEl = document.getElementById('bp-role'); const role = roleEl ? roleEl.textContent.trim() : '';
    const goal = (build.goal||'').trim();
    const tagline = (build.tagline||'').trim();
    const hd = document.createElement('div'); hd.className = 'ex-hd';
    hd.innerHTML = '<div><div class="ex-hd-name">'+esc(name)+'</div>'+
      (tagline ? '<div class="ex-hd-tagline">'+esc(tagline)+'</div>' : '')+
      (role ? '<div class="ex-hd-role">'+esc(role)+'</div>' : '')+
      (goal ? '<div class="ex-hd-goal">Goal: '+esc(goal)+'</div>' : '')+'</div>'+
      '<img class="ex-hd-logo" src="/brand/hu-logo-inline-dark.png" alt="Healthcare Uncharted">';
    sheet.appendChild(hd);
    // CAREER PATH + EDUCATION — clone each live timeline grid (connectors + forks), strip chrome, scale to fit the width
    const exportTimeline = (gridId, title, hasItems) => {
      const grid = document.getElementById(gridId);
      if (!grid || !hasItems) return;
      const wrap = document.createElement('div'); wrap.className = 'ex-trunk-wrap';
      wrap.innerHTML = '<div class="ex-sec-ttl">'+esc(title)+'</div>';
      const ov = grid.querySelector('.bp-conn-ov'); const ovH = ov ? parseFloat(ov.getAttribute('height'))||0 : 0;
      const naturalW = Math.max(grid.scrollWidth, grid.offsetWidth, 1);
      const naturalH = Math.max(grid.scrollHeight, grid.offsetHeight, ovH, 1);
      const scale = Math.min(1.8, (contentW - 36) / naturalW);   // upscale a small timeline to fill the width; downscale a big one to fit
      const cg = asEl(grid.cloneNode(true));
      asEl(cg).style.overflow = 'visible'; asEl(cg).style.width = naturalW+'px';
      // the clone copies the connector gradient <linearGradient> ids verbatim — re-id them so they don't collide with the live grid's
      qsa(cg,'linearGradient[id]').forEach(g => { const old = g.id, nw = old + '-ex'; g.id = nw;
        qsa(cg,'[stroke="url(#'+old+')"]').forEach(el => el.setAttribute('stroke','url(#'+nw+')')); });
      qsa(cg,'.bp-del,.bp-fork,.bp-layer,.bp-node-add,.bp-conn-add').forEach(e => e.remove());   // drop hover chrome + the + tile AND its dangling connector
      // hide empty inputs WITHOUT removing them — removing a name box above a hex shifts the hex up and the (already-measured) connectors miss it
      qsa(cg,'.bp-years,.bp-name,.bp-cred-in').forEach(el => { const v = (asInput(el).value !== undefined ? asInput(el).value : el.textContent); if (!String(v||'').trim()) el.style.visibility = 'hidden'; });
      const scaler = document.createElement('div'); scaler.style.cssText = 'height:'+Math.ceil(naturalH*scale+2)+'px;overflow:hidden';
      const inner = document.createElement('div'); inner.style.cssText = 'transform:scale('+scale.toFixed(4)+');transform-origin:top left;width:'+naturalW+'px';
      inner.appendChild(cg); scaler.appendChild(inner); wrap.appendChild(scaler);
      sheet.appendChild(wrap);
    };
    exportTimeline('bp-grid-career', 'Career Path', build.career.length);
    exportTimeline('bp-grid-education', 'Education', build.education.length);
    // section cards (skip empties)
    const grid2 = document.createElement('div'); grid2.className = 'ex-grid';
    [['skill','Skills'],['spec','Specializations'],['experience','Experience'],['population','Populations']].forEach(([k,ttl]) => {   // Education renders as a timeline above (like the trunk), so it's not a list card here
      const items = build[k]||[]; if (!items.length) return;
      let h = '<div class="ex-sec-ttl">'+ttl+'</div><div class="ex-items">';
      items.forEach(n => {
        const fut = nodeLayer(n)==='future';
        let abbr, color, label;
        if (k==='education'){ const dm = DATA.meta.degrees[n.degree]||{}; abbr = n.label||'?'; color = credHexColor(n) || dm.color || '#E8C547'; label = degreeFullName(n.label, n.degree); }
        else { abbr = n.abbr || (n.name||'').slice(0,4); color = n.zcol || '#5AC8BE'; label = n.name || n.abbr || ''; }
        h += '<span class="ex-item'+(fut?' ex-fut':'')+'">'+exMiniHex(abbr,color,fut)+'<span class="ex-il">'+esc(label)+'</span>'+(n.years?'<span class="ex-iy">'+esc(n.years)+'</span>':'')+'</span>';
      });
      h += '</div>';
      const card = document.createElement('div'); card.className = 'ex-card'; card.innerHTML = h; grid2.appendChild(card);
    });
    // NEXT STEPS — future-layer items grouped (the Want overlay)
    let nextHTML = '';
    [['career','Roles to reach'],['education','Credentials to earn'],['skill','Skills to build'],['spec','Focus areas'],['experience','Experience to gain'],['population','Populations to reach']].forEach(([k,lbl]) => {
      const items = (build[k]||[]).filter(n => nodeLayer(n)==='future' && !n.anchor);
      if (!items.length) return;
      nextHTML += '<div class="ex-next-grp">'+lbl+'</div>';
      items.forEach(n => nextHTML += '<div class="ex-next-item">'+esc(tileDisplayName(n,k))+'</div>');
    });
    if (nextHTML){ const card = document.createElement('div'); card.className = 'ex-card ex-next'; card.innerHTML = '<div class="ex-sec-ttl">Next Steps</div>'+nextHTML; grid2.appendChild(card); }
    // STRENGTHS + NOTES + OTHER — full text, full width (Other uses its custom title)
    build.layout.order.filter(k => !build.layout.hidden.includes(k) && panelOf(k) && panelOf(k).kind === 'text').forEach(k => {
      const v = (build[k]||'').trim(); if (!v) return;
      const card = document.createElement('div'); card.className = 'ex-card ex-wide';
      card.innerHTML = '<div class="ex-sec-ttl">'+esc(panelTitle(k))+'</div><div class="ex-text">'+esc(v)+'</div>';
      grid2.appendChild(card);
    });
    if (grid2.children.length) sheet.appendChild(grid2);
    const ft = document.createElement('div'); ft.className = 'ex-ft'; ft.textContent = 'Healthcare Uncharted · Career Tree · healthcareuncharted.com';
    sheet.appendChild(ft);
    return sheet;
  }
  async function exportMyPath(){
    if (!document.querySelector('#hct-mypath .bp-col')) return;
    const btn = asInput(document.getElementById('hct-mp-export')); const orig = btn ? btn.textContent : '';
    if (btn){ btn.textContent = 'Rendering…'; btn.disabled = true; }
    closePanel();
    let sheet = null;
    try {
      await ensureHtml2canvas();
      exportMode = true; renderMyPath();   // re-render the trunk with roomy export tiles + full titles
      sheet = buildExportSheet();
      sheet.style.cssText += ';position:fixed;left:0;top:0;z-index:-1;pointer-events:none';   // off-screen-ish (behind the opaque app), still renderable
      document.body.appendChild(sheet);
      if (document.fonts && document.fonts.ready){ try { await document.fonts.ready; } catch(_){} }
      // make sure the HU logo image is fully loaded before the capture (else it renders blank)
      await Promise.all([...sheet.querySelectorAll('img')].map(im => (im.complete && im.naturalWidth) ? Promise.resolve() : new Promise(res => { im.onload = im.onerror = res; setTimeout(res, 3000); })));
      const canvas = await html2canvas(sheet, { backgroundColor:'#0d1117', scale: 2, useCORS: true, logging: false });
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/jpeg', 0.94);
      a.download = ((build.name||'').trim().replace(/[^\w\-]+/g,'_').replace(/^_+|_+$/g,'') || 'my-path') + '-career-path.jpg';
      document.body.appendChild(a); a.click(); a.remove();
    } catch(err){
      console.error('export My Path', err);
      alert('Could not build the image. The export library loads from a CDN. Check your connection and try again.');
    } finally {
      exportMode = false; renderMyPath();   // restore the live trunk
      if (sheet) sheet.remove();
      if (btn){ btn.textContent = orig; btn.disabled = false; }
    }
  }

  // ── SHARE CARD — a 1080×1080 branded card of the build (flow-doc stage 1 = the ARRIVE
  //    hook, stage 7 = the return hook: a build someone posted is a build they come back
  //    to update). Always the dark brand look; built from build DATA, not a screenshot.
  function buildShareCard(){
    const card = document.createElement('div'); card.className = 'hct-share-card';
    const name = (build.name||'').trim() || 'My Career Path';
    const tagline = (build.tagline||'').trim();
    const roleEl = document.getElementById('bp-role'); const role = roleEl ? roleEl.textContent.trim() : '';
    const goals = build.career.filter(n => !n.anchor && nodeLayer(n)==='future');
    const goal = goals.length ? tileDisplayName(goals[0],'career') + (goals.length > 1 ? ' +' + (goals.length-1) : '') : '';
    let h = '<div class="shc-top"><img class="shc-logo" src="/brand/hu-logo-inline-dark.png" alt="Healthcare Uncharted"><span class="shc-kick">Career Tree · My Build</span></div>';
    h += '<div class="shc-mid"><div class="shc-name">'+esc(name)+'</div>';
    if (tagline) h += '<div class="shc-tag">'+esc(tagline)+'</div>';
    if (role || goal) h += '<div class="shc-story">'+esc(role || 'Starting out')+(goal ? '<span class="shc-arrow">→</span>'+esc(goal) : '')+'</div>';
    // the counts — facts of the build, not scores
    const creds = build.education.filter(e => e.kind==='real').length;
    const areas = ['skill','spec','experience','population'].reduce((s,k) => s + (build[k]||[]).length, 0);
    const roles = build.career.filter(n => n.roleId).length;
    let tiles = '';
    if (roles) tiles += '<div class="shc-stat"><div class="v">'+roles+'</div><div class="k">role'+(roles!==1?'s':'')+' pinned</div></div>';
    if (creds) tiles += '<div class="shc-stat"><div class="v">'+creds+'</div><div class="k">credential'+(creds!==1?'s':'')+'</div></div>';
    if (areas) tiles += '<div class="shc-stat"><div class="v">'+areas+'</div><div class="k">expertise area'+(areas!==1?'s':'')+'</div></div>';
    const road = planRoad();
    if (road.length){
      const b = planBill(road);
      if (b.years) tiles += '<div class="shc-stat gold"><div class="v">~'+(b.years % 1 ? b.years.toFixed(1) : b.years)+'</div><div class="k">years of school ahead</div></div>';
      if (b.exams) tiles += '<div class="shc-stat gold"><div class="v">'+b.exams+'</div><div class="k">board exam'+(b.exams!==1?'s':'')+' to sit</div></div>';
    }
    if (tiles) h += '<div class="shc-stats">'+tiles+'</div>';
    // the tiles themselves — solid = held, dashed = aiming (same ring grammar as everywhere)
    let hexes = '';
    let hxCount = 0; const HX_MAX = 14;
    const pushHex = (abbr, color, dashed, label) => { if (hxCount >= HX_MAX || !abbr) return; hxCount++;
      hexes += '<span class="shc-hx'+(dashed?' fut':'')+'">'+exMiniHex(abbr, color, dashed)+'<span class="shc-hx-l">'+esc(label)+'</span></span>'; };
    build.career.filter(n => n.roleId && nodeById.has(n.roleId)).forEach(n => { const node = nodeById.get(n.roleId), fam = DATA.classes[curClass].families[node.family]||{};
      pushHex(node.abbr, fam.color || '#5AC8BE', nodeLayer(n)==='future', node.label.replace(/\n/g,' ')); });
    build.education.filter(e => e.kind==='real').forEach(n => { const dm = DATA.meta.degrees[n.degree]||{};
      pushHex(n.label, credHexColor(n) || dm.color || '#E8C547', nodeLayer(n)==='future', degreeFullName(n.label, n.degree)); });
    ['skill','spec','experience','population'].forEach(k => (build[k]||[]).forEach(n => pushHex(n.abbr || (n.name||'').slice(0,4), n.zcol || '#5AC8BE', nodeLayer(n)==='future', n.name || n.abbr || '')));
    if (hexes) h += '<div class="shc-hexes">'+hexes+'</div>';
    h += '</div>';
    h += '<div class="shc-ft"><span class="shc-cta">Build yours →</span><span class="shc-url">healthcareuncharted.com/tools/career-tree</span></div>';
    card.innerHTML = h;
    return card;
  }
  async function exportShareCard(){
    const btn = asInput(document.getElementById('hct-mp-share')); const orig = btn ? btn.textContent : '';
    if (btn){ btn.textContent = 'Rendering…'; btn.disabled = true; }
    let card = null;
    try {
      await ensureHtml2canvas();
      card = buildShareCard();
      card.style.cssText += ';position:fixed;left:0;top:0;z-index:-1;pointer-events:none';
      document.body.appendChild(card);
      if (document.fonts && document.fonts.ready){ try { await document.fonts.ready; } catch(_){} }
      await Promise.all([...card.querySelectorAll('img')].map(im => (im.complete && im.naturalWidth) ? Promise.resolve() : new Promise(res => { im.onload = im.onerror = res; setTimeout(res, 3000); })));
      const canvas = await html2canvas(card, { backgroundColor:'#0d1117', scale: 1, useCORS: true, logging: false });   // scale 1 → exactly 1080×1080
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/jpeg', 0.94);
      a.download = ((build.name||'').trim().replace(/[^\w\-]+/g,'_').replace(/^_+|_+$/g,'') || 'my-path') + '-career-card.jpg';
      document.body.appendChild(a); a.click(); a.remove();
    } catch(err){
      console.error('share card', err);
      alert('Could not build the card. The export library loads from a CDN. Check your connection and try again.');
    } finally {
      if (card) card.remove();
      if (btn){ btn.textContent = orig; btn.disabled = false; }
    }
  }

  // ── Legend / key (what the tiles, lines, and badges mean) ──
  function legendHex(fill, stroke, dashed, glyph, glyphCol){
    const r=15, cx=20, cy=17;
    return '<svg width="40" height="36" viewBox="0 0 40 36">'+
      '<path d="'+hexPath(cx,cy,r)+'" style="fill:'+fill+';stroke:'+stroke+';stroke-width:2'+(dashed?';stroke-dasharray:4 3':'')+'"/>'+
      (glyph ? '<text x="'+cx+'" y="'+(cy+5)+'" text-anchor="middle" style="font-size:14px;font-weight:800;fill:'+(glyphCol||'#EAF6F4')+'">'+glyph+'</text>' : '')+'</svg>';
  }
  function legendBadge(glyph, cls){
    return '<svg width="26" height="26" viewBox="0 0 26 26"><circle cx="13" cy="13" r="9" class="lg-badge '+cls+'"/>'+
      '<text x="13" y="17.5" text-anchor="middle" class="'+cls+'" style="font-size:12px;font-weight:800">'+glyph+'</text></svg>';
  }
  function legendForkBadge(){
    return '<svg width="26" height="26" viewBox="0 0 26 26"><circle cx="13" cy="13" r="9" class="lg-badge lg-b-purp"/>'+
      '<path d="M13 8 V12 M13 12 L9.5 16.5 M13 12 L16.5 16.5" fill="none" class="lg-b-purp" stroke-width="1.6" stroke-linecap="round"/></svg>';
  }
  function legendLine(kind){
    const teal='#5AC8BE', gold='#E8C547', purp='#B07BD6';
    if (kind==='solid')  return '<svg width="56" height="20"><circle cx="7" cy="10" r="3" fill="'+teal+'"/><line x1="7" y1="10" x2="49" y2="10" stroke="'+teal+'" stroke-width="2.6"/><circle cx="49" cy="10" r="3" fill="'+teal+'"/></svg>';
    if (kind==='step')   return '<svg width="56" height="26"><path d="M7 6 H28 V20 H49" fill="none" stroke="'+teal+'" stroke-width="2.6"/><circle cx="7" cy="6" r="3" fill="'+teal+'"/><circle cx="49" cy="20" r="3" fill="'+teal+'"/></svg>';
    if (kind==='dashed') return '<svg width="56" height="20"><circle cx="7" cy="10" r="3" fill="'+gold+'"/><line x1="7" y1="10" x2="49" y2="10" stroke="'+gold+'" stroke-width="2.6" stroke-dasharray="4 3"/><circle cx="49" cy="10" r="3" fill="'+gold+'"/></svg>';
    if (kind==='fork')   return '<svg width="56" height="30"><path d="M12 5 V13 H32 V25 H48" fill="none" stroke="'+purp+'" stroke-width="2.6"/><circle cx="12" cy="5" r="3" fill="'+purp+'"/><circle cx="48" cy="25" r="3" fill="'+purp+'"/></svg>';
    return '';
  }
  function renderLegend(){
    const body = document.getElementById('bp-legend-body'); if (!body || body.dataset.built) return;
    const teal = '#4ECDC4', gold = '#E8C547';
    // swatches for the expertise map's grammar (ring color rides a class so it theme-flips)
    const hexPts = (cx,cy,r) => { let s=''; for (let k=0;k<6;k++){ const a=Math.PI/3*k+Math.PI/6; s+=(k?'L':'M')+(cx+r*Math.cos(a)).toFixed(1)+' '+(cy+r*Math.sin(a)).toFixed(1); } return s+'Z'; };
    const ringHex = dashed => '<svg width="56" height="28"><path d="'+hexPts(28,14,9)+'" fill="'+hexA(teal,0.4)+'" stroke="'+teal+'" stroke-width="1.2"/>'
      + '<path d="'+hexPts(28,14,12)+'" class="lg-ring" fill="none" stroke-width="1.7"'+(dashed?' stroke-dasharray="4 3"':'')+'/></svg>';
    const pipsHex = '<svg width="56" height="24"><rect x="6" y="2" width="44" height="6" rx="2" fill="'+hexA(teal,0.35)+'"/><rect x="6" y="9" width="44" height="6" rx="2" fill="'+hexA(teal,0.2)+'"/><rect x="6" y="16" width="44" height="6" rx="2" fill="'+hexA(teal,0.1)+'"/></svg>';
    const terrSw = '<svg width="56" height="20"><text x="28" y="13" text-anchor="middle" font-size="7" letter-spacing="1.5" class="lg-teal" style="font-family:var(--mono);font-weight:700">CLINICAL</text></svg>';
    const pctSw = '<svg width="56" height="20"><text x="28" y="14" text-anchor="middle" font-size="12" font-weight="800" class="lg-teal" style="font-family:var(--display)">91%</text></svg>';
    const rows = [
      ['grp','My Path · tiles'],
      [legendHex(hexA(teal,0.2), teal), '<b>Have</b>. A role, credential, or skill you hold. Solid, colored by field.'],
      [legendHex(hexA(gold,0.12), gold, true), '<b>Goal</b>. Something you want next. Gold, dashed, hollow.'],
      [legendHex(hexA(teal,0.07), hexA(teal,0.4)), '<b>Context</b>. Faint tiles are current items, shown while you view Future.'],
      [legendHex(hexA(gold,0.2), gold, false, '★', '#0d1117'), '<b>Milestones</b>. Gold markers: ★ Start of Career, ⚑ Retirement, ◆ Other.'],
      ['grp','The sheet'],
      ['<svg width="56" height="20"><circle cx="28" cy="10" r="8" style="fill:none;stroke:rgba(78,205,196,0.6);stroke-width:1.5"/><text x="28" y="13.5" text-anchor="middle" font-size="9" class="lg-teal" style="font-family:var(--display);font-weight:800">1</text></svg>', '<b>Numbered sections</b>. The sheet reads top to bottom: your line, the road, your expertise, the plan. The chip on each header opens a focused picker; the arrow marks the next move.'],
      ['<svg width="56" height="20"><circle cx="18" cy="10" r="5" style="fill:none;stroke:rgba(150,180,190,0.55);stroke-width:1.5"/><circle cx="38" cy="10" r="5" style="fill:#5AC8BE"/></svg>', '<b>Requirement ticks</b>. The small circles inside a Next Steps item (and on a pinned role\'s panel) are its requirements. Tick what you hold. A count, never a score.'],
      ['<svg width="56" height="20"><rect x="10" y="3" width="36" height="14" rx="3" style="fill:rgba(232,197,71,0.1);stroke:rgba(232,197,71,0.5)"/><text x="28" y="13.5" text-anchor="middle" font-size="8" style="fill:#E8C547;font-family:var(--mono);font-weight:700">$</text></svg>', '<b>The bill</b>. Next Steps prices your road: rough years of school, board exams, posted exam fees. Typical numbers. Verify before you budget.'],
      ['grp','My Path · lines'],
      [legendLine('solid'), 'Your path from one role to the next.'],
      [legendLine('step'), 'A change in job type. The trunk steps up or down.'],
      [legendLine('dashed'), 'Connects to a <b>goal</b> you haven\'t reached yet.'],
      [legendLine('fork'), 'A <b>fork</b>: two roles at the same time (e.g. work + teach).'],
      ['grp','Tile buttons (hover)'],
      [legendBadge('✓','lg-b-green'), 'Mark a goal as something you now <b>have</b>.'],
      [legendBadge('◇','lg-b-gold'), 'Mark something you have as a <b>goal</b>.'],
      [legendBadge('×','lg-b-red'), 'Remove the tile.'],
      [legendForkBadge(), '<b>Fork</b>. Add a concurrent role (you can stack more than one).'],
      ['grp','On every map'],
      [ringHex(false), '<b>On your path</b>. A solid ring means you have it. Same ring on the Career Matrix, the Education Matrix, and the expertise map.'],
      [ringHex(true), '<b>Aiming for it</b>. A dashed ring is a goal you set.'],
      ['grp','Areas of Expertise map'],
      [pipsHex, '<b>Depth</b>. Three columns across the top: Entry, Experienced, Expert.'],
      [terrSw, '<b>Groups</b>. Related expertise stacks in rows down the left, zone by zone. Scroll down to read; click a tile and its group row snaps forward; click empty space and everything comes back.'],
      ['<svg width="56" height="20"><rect x="6" y="4" width="44" height="13" rx="7" style="fill:rgba(78,205,196,0.16);stroke:rgba(78,205,196,0.45)"/><text x="28" y="13.5" text-anchor="middle" font-size="8" letter-spacing="1" class="lg-teal" style="font-family:var(--mono);font-weight:700">LENS</text></svg>', '<b>Lens</b>. Tap what pulls you and the rest of the map steps back. Tiles on your path never dim.'],
      ['grp','The numbers'],
      [pctSw, '<b>Pass rates, fees, pay</b>. Straight from each credentialing board and the BLS, with the source linked at the bottom of every block.'],
      ['grp','View'],
      ['<svg width="56" height="20"><rect x="3" y="4" width="50" height="13" rx="4" style="fill:rgba(232,197,71,0.16);stroke:rgba(232,197,71,0.45)"/></svg>', '<b>Goals only</b>. A toolbar toggle for theorycrafting: what you have ghosts back, the plan stands alone. Off, everything shows layered.']
    ];
    body.innerHTML = rows.map(r => r[0]==='grp'
      ? '<div class="bp-legend-grp">'+esc(r[1])+'</div>'
      : '<div class="bp-legend-row"><span class="bp-legend-sw">'+r[0]+'</span><span class="bp-legend-tx">'+r[1]+'</span></div>'
    ).join('');
    body.dataset.built = '1';
  }

  // build the movable dashboard cards (rebuilds only when the layout/order changes, to preserve focus + inputs)
  function renderDash(){
    const host = document.getElementById('bp-dash'); if (!host) return;
    renderAddMenu();
    // the dash is the appendix now: text cards only. Zones + Next Steps are fixed story sections above.
    const order = build.layout.order.filter(k => { const p = panelOf(k); return p && p.kind === 'text' && !build.layout.hidden.includes(k); });
    const sig = order.join(',');
    if (sig === dashSig && host.children.length) return;
    dashSig = sig;
    host.innerHTML = '';
    order.forEach((key, i) => {
      const p = panelOf(key);
      const card = document.createElement('div');
      card.className = 'bp-panel bp-card bp-resize';
      card.setAttribute('data-key', key);
      card.style.animationDelay = (i*0.045).toFixed(2)+'s';
      const body = '<textarea class="bp-text" id="bp-'+p.field+'" placeholder="'+esc(p.ph)+'"></textarea>';
      const titleEl = isOtherKey(key)   // the Other card's title is renamable (and persists)
        ? '<input class="bp-card-t bp-card-t-edit" value="'+esc(panelTitle(key))+'" maxlength="28" placeholder="Other" title="Rename this section">'
        : '<span class="bp-card-t">'+esc(panelTitle(key))+'</span>';
      card.innerHTML = '<div class="bp-card-h"><span class="bp-grip" title="Drag to move">⠿</span>'+titleEl+'<button class="bp-card-x" title="Remove section" aria-label="Remove section">×</button></div>'+body;
      host.appendChild(card);
      const hdr = card.querySelector('.bp-card-h');
      hdr.setAttribute('draggable','true');
      const titleInp = asInput(card.querySelector('.bp-card-t-edit'));
      if (titleInp){ titleInp.oninput = () => { if (!build.layout.titles) build.layout.titles = {}; build.layout.titles[key] = titleInp.value; saveBuild(); }; }
      hdr.addEventListener('dragstart', e => { if (hit(e,'.bp-card-t-edit')){ e.preventDefault(); return; }   // editing the title, not dragging
        dashDrag = key; card.classList.add('bp-card-dragging'); host.classList.add('bp-dash-dragging'); /** @type {DragEvent} */ (e).dataTransfer.effectAllowed='move'; try{ /** @type {DragEvent} */ (e).dataTransfer.setData('text/plain', key); }catch(_){} });
      hdr.addEventListener('dragend', () => { card.classList.remove('bp-card-dragging'); host.classList.remove('bp-dash-dragging'); dashDrag = null; });
      card.addEventListener('dragover', e => { if (dashDrag){ e.preventDefault(); card.classList.add('bp-card-over'); } });
      card.addEventListener('dragleave', () => card.classList.remove('bp-card-over'));
      card.addEventListener('drop', e => { card.classList.remove('bp-card-over'); if (!dashDrag || dashDrag===key) return; e.preventDefault();
        const ord = build.layout.order, from = ord.indexOf(dashDrag); if (from>=0) ord.splice(from,1);
        let to = ord.indexOf(key); if (to<0) to = ord.length; ord.splice(to,0,dashDrag); saveBuild(); renderMyPath(); });
      asEl(card.querySelector('.bp-card-x')).onclick = () => { if (!build.layout.hidden.includes(key)) build.layout.hidden.push(key); saveBuild(); renderMyPath(); };
      {
        const ta = card.querySelector('textarea'); ta.value = build[p.field]||''; ta.oninput = (ev)=>{ build[p.field] = asInput(ev.target).value; saveBuild(); };
        const sz = (build.layout.sizes||{})[key];                              // restore a saved card size
        if (sz && sz.w) card.style.width = sz.w + 'px';
        if (sz && sz.h) card.style.height = sz.h + 'px';
        if (window.ResizeObserver){                                            // remember a manual resize (persist only — no re-render, so no loop)
          new ResizeObserver(() => {
            if (!build.layout.sizes) build.layout.sizes = {};
            const w = Math.round(card.offsetWidth), h = Math.round(card.offsetHeight);
            const cur = build.layout.sizes[key];
            if (!cur || cur.w !== w || cur.h !== h){ build.layout.sizes[key] = { w, h }; saveBuild(); }
          }).observe(card);
        }
      }
    });
  }
  function renderAddMenu(){
    const menu = document.getElementById('bp-add-menu'), btn = document.getElementById('bp-add-section'); if (!menu || !btn) return;
    const hiddenFixed = build.layout.hidden.filter(k => PANELS[k] && PANELS[k].kind === 'text' && k !== 'other');   // 'other' is managed by the always-on "+ Other section"; zones/next are structural, never listed
    btn.style.display = '';   // you can always add another Other section
    menu.innerHTML = hiddenFixed.map(k => '<button type="button" class="bp-addmenu-item" data-key="'+k+'">+ '+esc(panelTitle(k))+'</button>').join('')
      + '<button type="button" class="bp-addmenu-item" data-newother="1">+ Other section</button>';
    qsa(menu,'[data-key]').forEach(el => el.onclick = () => {
      const k = el.dataset.key; build.layout.hidden = build.layout.hidden.filter(x => x!==k);
      if (!build.layout.order.includes(k)) build.layout.order.push(k);
      menu.classList.remove('open'); saveBuild(); renderMyPath();
    });
    const no = menu.querySelector('[data-newother]'); if (no) asEl(no).onclick = () => { menu.classList.remove('open'); addOtherSection(); };
  }
  // show the first not-currently-shown "Other" slot, or mint a fresh other-N if all are already shown
  function addOtherSection(){
    const shown = k => build.layout.order.includes(k) && !build.layout.hidden.includes(k);
    let key = 'other';
    if (shown('other')){ let n = 2; while (shown('other-'+n)) n++; key = 'other-'+n; }
    build.layout.hidden = build.layout.hidden.filter(x => x !== key);
    if (!build.layout.order.includes(key)) build.layout.order.push(key);
    if (build[key] === undefined) build[key] = '';
    saveBuild(); renderMyPath();
  }

  let zonePickersWired = false;
  function renderMyPath(){
    enforcePanelOwner();   // a role/atlas panel can never linger on My Path — drop it if its owning view isn't this one
    const badge = document.getElementById('hct-mp-count'); if (badge) badge.textContent = totalNodes();
    // QA 2026-07-12: the survey never auto-pops — it blocked returning users from
    // Save/Load. The sheet lands flat; the LIT "Start here" strip is the invitation.
    const hwEmpty = totalNodes() === 0;
    const hwm = document.getElementById('hct-welcome-modal'); if (hwm && !hwEmpty) hwm.classList.remove('open');
    const hws = document.getElementById('hct-welcome-strip'); if (hws) hws.hidden = !hwEmpty;
    if (!document.getElementById('bp-grid-career')) return;   // planner not in the DOM yet
    if (DATA) renderSectionGuides();   // the header guide chips track every build change
    if (!zonePickersWired && DATA){    // the four zone pickers live in static markup now — wire once
      zonePickersWired = true;
      [['bp-skill-search','bp-skill-suggest','skill'],['bp-spec-search','bp-spec-suggest','spec'],
       ['bp-exp-search','bp-exp-suggest','experience'],['bp-pop-search','bp-pop-suggest','population']]
        .forEach(w => wireGrowthPicker(w[0], w[1], w[2]));
    }
    syncShift();
    renderSheetHeader();
    renderSuggest();
    renderDash();
    TRACKS.forEach(renderTrack);
    renderNextSteps();
    if (atlasBuilt) updateAtlasHud();   // keep the atlas tally + rings honest when the build changes from here
    updateEduPins();                    // and the Education Matrix card rings
    const sw = asInput(document.getElementById('bp-sw'));     if (sw && document.activeElement !== sw) sw.value = build.sw || '';
    const nt = asInput(document.getElementById('bp-notes'));  if (nt && document.activeElement !== nt) nt.value = build.notes || '';
  }

  // ── "Common around your family" — expertise suggestions keyed off your current role.
  // Data: growth.familySuggest (authored, per role family). The strip only OFFERS —
  // nothing is auto-added; a person's expertise is theirs to claim (doctrine: no
  // predictions about a person). Tap = added to the zone's track on the Current layer.
  function renderSuggest(){
    const host = document.getElementById('bp-suggest'); if (!host || !DATA) return;
    const start = currentRoleNode();
    const ids = (start && DATA.growth && DATA.growth.familySuggest && DATA.growth.familySuggest[start.family]) || [];
    const have = new Set(); TRACKS.forEach(t => (build[t.key]||[]).forEach(n => { if (n.atlasId) have.add(n.atlasId); }));
    const byId = new Map(((DATA.growth && DATA.growth.nodes) || []).map(n => [n.id, n]));
    const sugg = ids.map(id => byId.get(id)).filter(n => n && !have.has(n.id));
    host.hidden = !sugg.length;
    if (!sugg.length){ host.innerHTML = ''; return; }
    const famLbl = (DATA.classes[curClass].families[start.family]||{}).label || start.family;
    host.innerHTML = '<span class="bp-sgs-lbl">Common around ' + esc(famLbl) + ' · tap what you already have</span>'
      + sugg.map(n => { const z = (DATA.growth.zones||{})[n.zone] || {};
          return '<button type="button" class="bp-sgs-chip" data-sg="' + esc(n.id) + '" style="--zc:' + esc(z.color || '#5AC8BE') + '">' + esc(n.label) + '<i>' + esc(z.label || n.zone) + '</i></button>'; }).join('');
    qsa(host,'[data-sg]').forEach(b => b.onclick = (e) => {
      e.stopPropagation();
      const gn = byId.get(b.dataset.sg); if (!gn) return;
      const z = (DATA.growth.zones||{})[gn.zone]; if (!z || !z.track || !build[z.track]) return;
      if (build[z.track].some(s => s.atlasId === gn.id)) return;
      build[z.track].push({ id:newId(), atlasId:gn.id, name:gn.label, abbr:gn.abbr, zcol:z.color, years:'', layer:'current' });
      saveBuild(); renderMyPath();
      announce(gn.label + ' added to ' + (z.label || z.track));
    });
  }

  // short hex face from typed text (first token, ≤5 chars, uppercased)
  function credFaceShort(s){ const t=(s||'').trim(); if(!t) return ''; return t.split(/[\s,]+/)[0].slice(0,5).toUpperCase(); }
  function roleFamColor(roleId, fam){
    let f = fam;
    if (!f && roleId){ const n = nodeById.get(roleId); if (n) f = n.family; }
    return (f && (DATA.classes[curClass].families[f]||{}).color) || null;
  }
  // a pointy-top hex tile with a face, styled by inline fill/stroke (the matrix-node look)
  function bpFaceSize(t){ t = String(t||''); return t.length>4 ? 12 : t.length>2 ? 16 : 20; }
  function bpHexSVG(face, fill, stroke, dashed){
    const r=BPR, w=2*r, h=2*r+6, cx=r, cy=r+3; const t=String(face||'');
    const size = bpFaceSize(t);
    return '<svg class="bp-hex" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'">'+
      '<path d="'+hexPath(cx,cy,r)+'" class="bp-hexbg" style="fill:'+fill+';stroke:'+stroke+(dashed?';stroke-dasharray:4 3':'')+'"/>'+
      '<text x="'+cx+'" y="'+(cy+size*0.34).toFixed(1)+'" text-anchor="middle" class="bp-hex-tx" style="font-size:'+size+'px">'+esc(t)+'</text></svg>';
  }
  function setHexFace(cell, txt){ const tx=cell.querySelector('.bp-hex-tx'); if(!tx) return; tx.textContent=txt; tx.style.fontSize=bpFaceSize(txt)+'px'; }

  // Career trunk lanes: staggers up/down by job-type around a center spine (see careerLanes); never drifts.
  const BPR = 38;                               // My Path hex circumradius (bigger, bolder tiles)
  const CAREER_LANE_H = 34, CAREER_HEXC = 91;   // px per lane step (stagger amplitude); hex-center offset from a tile's top (incl. 20px top gutter for the corner buttons)
  function groupKeyOf(node){
    let f = node.family;
    if (!f && node.roleId){ const n = nodeById.get(node.roleId); if (n) f = n.family; }
    return f || '';
  }
  // Staggered by job TYPE, but oscillating around a center spine (not drifting downhill — that's what ran off before).
  // First job-type sits on the centerline; each NEW type alternates one lane up, then down, bounded to ±1 forever.
  // Same-family neighbours share a lane (flat connector); a type change is a clean one/two-lane orthogonal jog.
  function careerLanes(list){
    const order = [];      // distinct job-types in first-seen order
    let prev = 0;
    return list.map(node => {
      const fam = groupKeyOf(node);
      if (!fam) return prev;                                  // custom / typeless node: stay level with the prior tile
      let idx = order.indexOf(fam);
      if (idx < 0){ idx = order.length; order.push(fam); }
      prev = idx === 0 ? 0 : (idx % 2 === 1 ? -1 : 1);        // 0 = center, then up, down, up, down… (never runs away)
      return prev;
    });
  }

  // credential display helpers: a short degree token for the hex face, and a tidy label (drop the school parenthetical)
  const DEG_ABBR = { HS:'HS', Cert:'CERT', AS:'AS', BS:'BS', MS:'MS', Doc:'DOC', 'MD/DO':'MD' };
  function degAbbr(deg){ return DEG_ABBR[deg] || (deg ? String(deg).toUpperCase().slice(0,4) : ''); }
  function cleanCredLabel(s){ const t = String(s||'').replace(/\s*\(.*$/, '').replace(/[\/,;\s]+$/, '').trim(); return t || String(s||'').trim(); }
  // build one My Path tile (hex + label/search + years + delete; career main tiles also get a fork button)
  function makeTile(cfg, node, opts){
    opts = opts || {}; const conc = !!opts.conc;
    const isReal = cfg.kind==='role' ? !!node.roleId : (cfg.kind==='cred' ? node.kind==='real' : false);
    let col, face, sub = null;
    if (node.anchor){ col = '#E8C547';
      if (node.anchor === 'other'){ face = credFaceShort(node.name) || '◆'; sub = null; }   // gold like the bookends, but a free-text name you type
      else { face = node.anchor==='start' ? '★' : '⚑'; sub = node.name || (node.anchor==='start' ? 'Start of Career' : 'Retirement'); } }
    else if (cfg.kind==='role'){ col = roleFamColor(node.roleId, node.family) || '#5AC8BE';
      face = node.roleId ? (node.abbr||'?') : (credFaceShort(node.name)||'✎'); sub = null; }
    else if (cfg.kind==='cred'){ col = isReal ? ((DATA.meta.degrees[node.degree]||{}).color||'#E8C547') : '#E8C547';
      face = isReal ? (degAbbr(node.degree) || credFaceShort(node.label)) : credFaceShort(node.label); sub = isReal ? cleanCredLabel(node.label) : null; }
    else { const fromAtlas = !!node.atlasId; col = node.zcol || '#5AC8BE';
      face = fromAtlas ? (node.abbr||'?') : (credFaceShort(node.name)||'✎'); sub = fromAtlas ? node.name : null; }
    const filled = sub != null || (cfg.kind==='cred' ? !!String(node.label||'').trim() : !!String(node.name||'').trim());
    const lyr = nodeLayer(node), ghost = (build.view === 'future' && lyr === 'current');   // current = faint context in Future view
    const cell = document.createElement('div'); cell.className = 'bp-node'+(filled?' on':'')+(conc?' bp-node-conc':'')+(lyr==='future'?' bp-future':'')+(ghost?' bp-ghost':'');
    let html = '<button class="bp-del" title="remove">×</button>'+
      '<button class="bp-layer" title="'+(lyr==='future'?'Goal. Click to mark it as something you HAVE':'Have. Click to mark it as a goal')+'">'+(lyr==='future'?'✓':'◇')+'</button>';
    if ((cfg.key==='career' || cfg.key==='education') && !conc && !node.anchor) html += '<button class="bp-fork" title="'+(cfg.kind==='cred' ? 'Fork. Add a related cert or credential beneath this one' : 'Fork. Add a concurrent role (a second job at the same time)')+'"><svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true"><path d="M6 0 V5 M6 5 L2.5 9.5 M6 5 L9.5 9.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button>';
    // name above the hex, years below (clean stacked look)
    if (sub != null) html += (cfg.kind==='cred' && !exportMode)
      ? '<div class="bp-node-lbl bp-node-edit" contenteditable="true" spellcheck="false" title="Click to rename">'+esc(sub)+'</div>'   // imported credential: rename in place (hex keeps its degree token)
      : '<div class="bp-node-lbl">'+esc(sub)+'</div>';
    else if (cfg.kind==='cred') html += '<input class="bp-cred-in" placeholder="search, or * for all" maxlength="40" value="'+esc(node.label||'')+'">';
    else if (node.anchor==='other') html += '<textarea class="bp-name bp-name-area" placeholder="type anything" maxlength="60" rows="2">'+esc(node.name||'')+'</textarea>';
    else if (exportMode && cfg.kind==='role') html += '<div class="bp-node-lbl">'+esc(node.name||'')+'</div>';   // export: clean full title
    else if (cfg.kind==='role' && node.roleId) html += '<div class="bp-node-lbl bp-node-edit" contenteditable="true" spellcheck="false" title="Click to rename">'+esc(node.name||'')+'</div>';   // real/imported role: click to rename, keeps the hex abbr
    else if (cfg.kind==='role') html += '<textarea class="bp-name bp-name-role" rows="2" maxlength="60" placeholder="search, or * for all">'+esc(node.name||'')+'</textarea>';   // live: full, editable, wrapping title
    else html += '<input class="bp-name" placeholder="search…" maxlength="44" value="'+esc(node.name||'')+'">';
    html += bpHexSVG(face, hexA(col,0.20), col);
    html += exportMode
      ? '<div class="bp-years">'+esc(node.years||'')+'</div>'   // export: a div wraps cleanly in html2canvas (a textarea would clip to one line)
      : '<textarea class="bp-years" rows="2" maxlength="20" placeholder="years">'+esc(node.years||'')+'</textarea>';
    cell.innerHTML = html;
    const nm = asInput(cell.querySelector('.bp-name'));
    if (nm){
      nm.oninput = () => { node.name = nm.value; saveBuild(); setHexFace(cell, credFaceShort(nm.value)||(node.anchor==='other'?'◆':'✎')); cell.classList.toggle('on', !!nm.value.trim()); showTileSuggest(cfg, node, nm); };
      nm.onfocus = () => showTileSuggest(cfg, node, nm);
      nm.onblur  = () => setTimeout(hideTileSuggest, 160);
      if (nm.tagName === 'TEXTAREA') nm.onkeydown = (e) => { if (e.key === 'Enter') e.preventDefault(); };   // wrap, but no newlines in a name
    }
    const le = cell.querySelector('.bp-node-edit');   // imported/real role OR credential: rename in place, keep the hex token, no search
    if (le){
      const setEdit = (v) => { if (cfg.kind==='cred') node.label = v; else node.name = v; };
      asEl(le).oninput   = () => { setEdit(le.textContent); saveBuild(); cell.classList.toggle('on', !!le.textContent.trim()); };
      asEl(le).onblur    = () => { const v = le.textContent.replace(/\s+/g,' ').trim(); if (v !== le.textContent) le.textContent = v; setEdit(v); saveBuild(); };
      asEl(le).onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); asEl(le).blur(); } };
    }
    const ci = asInput(cell.querySelector('.bp-cred-in'));
    if (ci){
      ci.oninput = () => { node.label = ci.value; saveBuild(); setHexFace(cell, credFaceShort(ci.value)); cell.classList.toggle('on', !!ci.value.trim()); showTileSuggest(cfg, node, ci); };
      ci.onfocus = () => showTileSuggest(cfg, node, ci);
      ci.onblur  = () => setTimeout(hideTileSuggest, 160);
    }
    const yr = asInput(cell.querySelector('.bp-years'));
    yr.oninput = (e) => { node.years = asInput(e.target).value; saveBuild(); };
    yr.onkeydown = (e) => { if (e.key === 'Enter') e.preventDefault(); };   // single field, no newlines
    asEl(cell.querySelector('.bp-del')).onclick = opts.onRemove;
    const fk = cell.querySelector('.bp-fork'); if (fk) asEl(fk).onclick = opts.onFork;
    asEl(cell.querySelector('.bp-layer')).onclick = (e) => { e.stopPropagation(); node.layer = (nodeLayer(node)==='future' ? 'current' : 'future'); saveBuild(); renderMyPath(); };
    // click a REAL role's hex → open its detail, docked to the right of the center column (stopPropagation so the global off-click doesn't immediately close it)
    if (cfg.key === 'career' && node.roleId){
      const hx = cell.querySelector('.bp-hex');
      if (hx){ asEl(hx).style.cursor = 'pointer'; hx.addEventListener('click', (e) => { e.stopPropagation(); selectedId = node.roleId; openPanel(node.roleId); }); }
    } else if (cfg.key === 'career' && !node.anchor){   // custom/unlinked role → click the hex to link it to a Matrix role (keeps your title)
      const hx = cell.querySelector('.bp-hex');
      if (hx){ asEl(hx).style.cursor = 'pointer'; asEl(hx).title = 'Click to link this to a matching Matrix role (keeps your title)'; hx.addEventListener('click', (e) => { e.stopPropagation(); openLinkSearch(cfg, node, hx); }); }
    }
    if (cfg.kind === 'cred' && isReal && !conc){   // click a real credential's hex → open its detail (years, code, what it opens, remove)
      const hx = cell.querySelector('.bp-hex');
      if (hx){ asEl(hx).style.cursor = 'pointer'; hx.addEventListener('click', (e) => { e.stopPropagation(); eduSelId = node.id; openCredPanel(node); }); }
    } else if (cfg.kind === 'cred' && !isReal && !conc){   // custom credential → click the hex to link it (sets the level, keeps your title)
      const hx = cell.querySelector('.bp-hex');
      if (hx){ asEl(hx).style.cursor = 'pointer'; asEl(hx).title = 'Click to link this to a Matrix credential (sets the level, keeps your title)'; hx.addEventListener('click', (e) => { e.stopPropagation(); openLinkSearch(cfg, node, hx); }); }
    }
    return cell;
  }

  // render one growth track; Career steps into family lanes and can FORK a concurrent (second-job) role above a tile
  function renderTrack(cfg){
    if (cfg.spiral) return renderSpiral(cfg);   // Education + Skill/Spec/Experience = honeycomb shells, not chains
    const grid = document.getElementById(cfg.grid); if (!grid) return;
    const list = build[cfg.key];
    const linkCol = cfg.kind==='cred' ? 'rgba(232,197,71,0.6)' : 'rgba(120,200,190,0.6)';
    grid.innerHTML = '';
    const isCareer = cfg.key === 'career';
    const forkable = isCareer || cfg.key === 'education';   // Education works like the trunk: fork a cert beneath a degree, drag to reorder
    // layer view: Current hides future tiles; Future/Both show everything (current ghosted in Future)
    const vis = (build.view === 'current') ? list.filter(layerVisible) : list.slice();
    // order the trunk as a timeline: Start of Career ▸ current roles ▸ future goals ▸ Retirement (stable within groups)
    vis.sort((a,b) => { const rk = n => n.anchor==='start' ? -2 : n.anchor==='end' ? 2 : (build.view!=='current' && nodeLayer(n)==='future' ? 1 : 0); return rk(a) - rk(b); });
    // career trunk staggers up/down by job-type around a center spine; other tracks stay flat
    const lanes = isCareer ? careerLanes(vis)
      : (cfg.key==='education' ? vis.map((n,i) => i%2 ? 1 : -1) : vis.map(() => 0));   // Education zigzags up/down so tiles pack tighter horizontally
    const minLane = lanes.length ? Math.min(...lanes) : 0;
    const maxLane = lanes.length ? Math.max(...lanes) : 0;
    // roomy tiles + full wrapping titles are the default for the career trunk (live AND export)
    const CELLW = cfg.key==='education' ? 120 : (forkable ? 132 : 2*BPR), GAP = forkable ? 26 : 24, APO = BPR*Math.sqrt(3)/2, SIDE = BPR*0.5, HEXC = CAREER_HEXC, LANE_H = CAREER_LANE_H, CONC_DY = forkable ? 210 : 178, CONC_DX = forkable ? 30 : 24, CONC_STACK = forkable ? 172 : 142;
    const maxConc = forkable ? vis.reduce((m,nd) => Math.max(m, concsOf(nd).length), 0) : 0;
    const hasConc = maxConc > 0;
    grid.classList.toggle('bp-grid-lanes', forkable);   // Education uses the trunk's roomy tiles + 2-line labels so credential names fit

    // ── drag-and-drop: pick up ANY tile (trunk or fork) and drop it on a trunk tile, a fork, or the + ──
    // dragSrc carries the node + a detach() that pulls it out of wherever it currently lives.
    // TOUCH: HTML5 DnD never fires on touch, so a pointer-based drag (long-press, or a clear
    // horizontal pull) drives the SAME dragSrc / place plumbing. pan-y keeps normal page
    // scrolling alive; once armed, the tile follows the finger and drop targets light up.
    const wireTouchDrag = (cell, dnode, detach) => {
      cell.style.touchAction = 'pan-y';
      cell.addEventListener('pointerdown', e => {
        if (e.pointerType !== 'touch') return;
        if (hit(e,'input,textarea,button,.bp-del,.bp-fork,.bp-layer')) return;
        const sx = e.clientX, sy = e.clientY;
        let armed = false, over = null;
        const arm = () => { armed = true; dragSrc = { node: dnode, detach: detach }; cell.classList.add('bp-dragging'); cell.style.zIndex = 40; };
        let hold = setTimeout(arm, 450);
        const move = ev => {
          const dx = ev.clientX - sx, dy = ev.clientY - sy;
          if (!armed){
            if (Math.abs(dx) > 14 && Math.abs(dx) > Math.abs(dy) * 1.5){ clearTimeout(hold); arm(); }
            else if (Math.abs(dy) > 16) done(false);   // the finger is scrolling — stand down
            return;
          }
          cell.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
          cell.style.pointerEvents = 'none';   // elementFromPoint must see what's UNDER the tile
          const t = document.elementFromPoint(ev.clientX, ev.clientY);
          cell.style.pointerEvents = '';
          const d = t && t.closest ? t.closest('[data-bpdrop]') : null;
          if (over && over !== d) over.classList.remove('bp-dragover');
          over = (d && d !== cell) ? d : null;
          if (over) over.classList.add('bp-dragover');
        };
        const done = commit => {
          clearTimeout(hold);
          if (commit && armed && over && over.__bpPlace && dragSrc && dragSrc.node !== over.__bpSelf){
            over.classList.remove('bp-dragover');
            over.__bpPlace(dragSrc); syncPinned(); saveBuild(); renderMyPath(); updateBoardPins();   // renderMyPath rebuilds the DOM, no style cleanup needed
          } else {
            if (over) over.classList.remove('bp-dragover');
            cell.classList.remove('bp-dragging'); cell.style.transform = ''; cell.style.zIndex = '';
          }
          dragSrc = null;
          document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', cancel);
        };
        const up = () => done(true);
        const cancel = () => done(false);
        document.addEventListener('pointermove', move);
        document.addEventListener('pointerup', up);
        document.addEventListener('pointercancel', cancel);
      });
    };
    const wireTileDrag = (cell, dnode, detach) => {
      cell.draggable = true;
      cell.addEventListener('dragstart', e => { if (hit(e,'input,textarea')) { e.preventDefault(); return; }   // grab the hex/body to drag; the text fields stay editable
        dragSrc = { node: dnode, detach: detach }; cell.classList.add('bp-dragging'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', dnode.id||''); } catch(_){} });
      cell.addEventListener('dragend', () => { cell.classList.remove('bp-dragging'); dragSrc = null; });
      wireTouchDrag(cell, dnode, detach);
    };
    const wireTileDrop = (cell, selfNode, place) => {
      const ok = () => dragSrc && typeof dragSrc.detach === 'function' && dragSrc.node !== selfNode;
      cell.dataset.bpdrop = '1'; cell.__bpPlace = place; cell.__bpSelf = selfNode;   // the touch layer finds targets by this
      cell.addEventListener('dragover', e => { if (ok()) { e.preventDefault(); cell.classList.add('bp-dragover'); } });
      cell.addEventListener('dragleave', () => cell.classList.remove('bp-dragover'));
      cell.addEventListener('drop', e => { cell.classList.remove('bp-dragover'); if (!ok()) return; e.preventDefault();
        place(dragSrc); syncPinned(); saveBuild(); renderMyPath(); updateBoardPins(); });
    };
    const detachFromTrunk = nd => () => { const k = list.indexOf(nd); if (k >= 0) list.splice(k, 1); };

    const tileEls = [];
    vis.forEach((node, i) => {
      const cell = makeTile(cfg, node, {
        onRemove: () => { const k = list.indexOf(node); if (k>=0) list.splice(k,1); syncPinned(); saveBuild(); renderMyPath(); updateBoardPins(); },
        onFork:   () => { const fc = cfg.kind==='cred' ? { id:newId(), kind:'custom', label:'', years:'', layer:nodeLayer(node) } : { id:newId(), name:'', years:'', layer:nodeLayer(node) };
          (node.concurrents = concsOf(node).slice()).push(fc); delete node.concurrent; saveBuild(); renderMyPath(); }
      });
      if (forkable){
        wireTileDrag(cell, node, detachFromTrunk(node));
        // drop onto a trunk tile → land on the trunk at this spot (reorder a trunk tile, or PROMOTE a fork up to the main line)
        wireTileDrop(cell, node, src => { src.detach(); let ti = list.indexOf(node); if (ti < 0) ti = list.length; list.splice(ti, 0, src.node); });
      }
      cell.style.marginTop = ((lanes[i]-minLane)*LANE_H) + 'px';
      tileEls.push(cell);
      grid.appendChild(cell);
    });
    const add = document.createElement('button'); add.className = 'bp-node-add' + (cfg.kind==='cred' ? ' bp-add-cred' : ''); add.title = 'Add to '+cfg.title;
    add.innerHTML = bpHexSVG('+', 'rgba(255,255,255,0.03)', cfg.kind==='cred' ? 'rgba(232,197,71,0.4)' : 'rgba(120,200,190,0.45)', true);
    add.onclick = () => addCustomNode(cfg.key);
    add.style.width = CELLW + 'px';
    const lastLane = lanes.length ? lanes[lanes.length-1] : 0;
    add.style.marginTop = ((lastLane - minLane)*LANE_H + (HEXC - (BPR+3))) + 'px';   // line the + hex up with the tiles
    grid.appendChild(add);
    // drop onto + → append the dragged tile to the END of the trunk (promote a fork / move a role onto the main line)
    if (forkable) wireTileDrop(add, null, src => { src.detach(); list.push(src.node); });

    const NS = 'http://www.w3.org/2000/svg', n = vis.length;
    const laneAt = j => (j < n ? lanes[j] : lastLane);
    // Measure ACTUAL laid-out hex centers via getBoundingClientRect (works on the hex <svg>, unlike offset* which is
    // HTMLElement-only and undefined for SVG). CSS gap/padding/border can differ from the constants and the drift
    // compounds across a long row, so we measure rather than compute. Scroll-compensated; falls back to the geometric
    // estimate only when hidden (zero-size, e.g. rendered on a non-active tab). Only the hex GEOMETRY stays constant.
    const gr = grid.getBoundingClientRect();
    const ox = gr.left - grid.scrollLeft, oy = gr.top - grid.scrollTop;   // grid CONTENT origin (overlay's 0,0)
    const centerOf = (el, idx) => {
      const t = (el && el.querySelector && el.querySelector('.bp-hex')) || el;
      if (t && t.getBoundingClientRect){ const r = t.getBoundingClientRect();
        if (r.width) return { x: r.left - ox + r.width/2, y: r.top - oy + r.height/2 }; }
      return { x: idx*(CELLW+GAP) + CELLW/2, y: (laneAt(idx)-minLane)*LANE_H + HEXC };
    };
    const C = tileEls.map((el, i) => centerOf(el, i)), addC = centerOf(add, n);
    const hx = j => (j < n ? C[j] : addC).x;
    const hy = j => (j < n ? C[j] : addC).y;

    // forked concurrent tiles, hanging directly BELOW their main node (the Y branches down)
    vis.forEach((node, i) => {
      concsOf(node).forEach((cn, k) => {
        const ctile = makeTile(cfg, cn, { conc:true,
          onRemove: () => { const arr = concsOf(node).slice(); const ix = arr.indexOf(cn); if (ix>=0) arr.splice(ix,1); delete node.concurrent; if (arr.length) node.concurrents = arr; else delete node.concurrents; syncPinned(); saveBuild(); renderMyPath(); updateBoardPins(); } });
        ctile.style.position = 'absolute';
        ctile.style.left = ((hx(i) - CELLW/2) + CONC_DX) + 'px';   // offset sideways so the fork connects at an angle, not straight down
        ctile.style.width = CELLW + 'px';
        ctile.style.top = (hy(i) + CONC_DY + k*CONC_STACK - HEXC) + 'px';   // stack extra forks downward
        // drag a fork out; detach() pulls it from its parent's concurrents
        wireTileDrag(ctile, cn, () => { const arr = node.concurrents = concsOf(node).slice(); const ix = arr.indexOf(cn); if (ix>=0) arr.splice(ix,1); if (!arr.length) delete node.concurrents; });
        // drop onto a fork → make the dragged tile a fork (concurrent) of THIS fork's parent (e.g. demote a trunk role)
        wireTileDrop(ctile, cn, src => { if (src.node === node) return; src.detach(); const arr = node.concurrents = concsOf(node).slice(); arr.push(src.node); delete node.concurrent; });
        grid.appendChild(ctile);
      });
    });

    // size the box to the ACTUAL content (measure every tile's bottom) instead of a magic constant —
    // absolute-positioned forks don't grow the grid on their own, and tile heights changed with the roomy layout.
    const gbr = grid.getBoundingClientRect();
    let contentBottom = 0;
    qsa(grid,'.bp-node, .bp-node-add').forEach(el => { const r = el.getBoundingClientRect(); if (r.height){ const b = r.bottom - gbr.top; if (b > contentBottom) contentBottom = b; } });
    const fallbackH = (maxLane-minLane)*LANE_H + (hasConc ? CONC_DY + (maxConc-1)*CONC_STACK : 0) + 200;
    const totalH = contentBottom > 0 ? Math.ceil(contentBottom + 14) : fallbackH;   // measured fit, else geometric estimate (hidden tab)
    grid.style.height = totalH + 'px';
    const ov = document.createElementNS(NS,'svg'); ov.setAttribute('class','bp-conn-ov');
    ov.setAttribute('width', String((n+1)*(CELLW+GAP))); ov.setAttribute('height', String(totalH));
    grid.insertBefore(ov, grid.firstChild);   // overlay UNDER the tiles → connector lines pass BEHIND the title/years plates, not over them
    const ovDefs = document.createElementNS(NS,'defs'); ov.appendChild(ovDefs);
    const nodeColor = nd => (nd && nd.roleId) ? (roleFamColor(nd.roleId, nd.family) || linkCol)
      : ((cfg.kind === 'cred' && nd && credHexColor(nd)) || linkCol);   // role → family color, credential → degree color, else neutral link
    // stroke for a connector running c1 → c2: solid if the endpoints share a color, else a gradient along the line so it blends node-to-node
    const strokeFor = (x1,y1,x2,y2,c1,c2) => {
      if (c1 === c2) return c1;
      const id = 'cg' + (connGradId++);
      const g = document.createElementNS(NS,'linearGradient');
      g.setAttribute('id', id); g.setAttribute('gradientUnits','userSpaceOnUse');
      g.setAttribute('x1',x1.toFixed(1)); g.setAttribute('y1',y1.toFixed(1)); g.setAttribute('x2',x2.toFixed(1)); g.setAttribute('y2',y2.toFixed(1));
      [['0%',c1],['100%',c2]].forEach(([o,c]) => { const s=document.createElementNS(NS,'stop'); s.setAttribute('offset',o); s.setAttribute('stop-color',c); g.appendChild(s); });
      ovDefs.appendChild(g);
      return 'url(#' + id + ')';
    };
    const endDot = (x,y,c,cls) => { const ci=document.createElementNS(NS,'circle'); ci.setAttribute('cx',x.toFixed(1)); ci.setAttribute('cy',y.toFixed(1)); ci.setAttribute('r','4'); ci.setAttribute('fill',c); if (cls) ci.setAttribute('class',cls); ov.appendChild(ci); };
    const addLine = (x1,y1,x2,y2,c1,c2,dashed,cls) => {
      const ln = document.createElementNS(NS,'line');
      ln.setAttribute('x1',x1.toFixed(1)); ln.setAttribute('y1',y1.toFixed(1)); ln.setAttribute('x2',x2.toFixed(1)); ln.setAttribute('y2',y2.toFixed(1));
      ln.setAttribute('stroke',strokeFor(x1,y1,x2,y2,c1,c2)); ln.setAttribute('stroke-width','2.5'); ln.setAttribute('stroke-linecap','round'); if (dashed) ln.setAttribute('stroke-dasharray','3 5'); if (cls) ln.setAttribute('class',cls); ov.appendChild(ln);
      endDot(x1,y1,c1,cls); endDot(x2,y2,c2,cls);
    };
    const addElbow = (x0,y0,cx,cy,x2,y2,c1,c2,dashed) => {   // an L: x0,y0 → corner cx,cy → x2,y2
      const p = document.createElementNS(NS,'path');
      p.setAttribute('d', 'M'+x0.toFixed(1)+','+y0.toFixed(1)+' L'+cx.toFixed(1)+','+cy.toFixed(1)+' L'+x2.toFixed(1)+','+y2.toFixed(1));
      p.setAttribute('fill','none'); p.setAttribute('stroke',strokeFor(x0,y0,x2,y2,c1,c2)); p.setAttribute('stroke-width','2.5'); p.setAttribute('stroke-linecap','round'); p.setAttribute('stroke-linejoin','round'); if (dashed) p.setAttribute('stroke-dasharray','3 5'); ov.appendChild(p);
      endDot(x0,y0,c1); endDot(x2,y2,c2);
    };
    const addOrtho = (x1,y1,mx,x2,y2,col) => {   // Visio dynamic connector: H out → V in the gap → H in (right angles)
      const p = document.createElementNS(NS,'path');
      p.setAttribute('d', 'M'+x1.toFixed(1)+','+y1.toFixed(1)+' L'+mx.toFixed(1)+','+y1.toFixed(1)+' L'+mx.toFixed(1)+','+y2.toFixed(1)+' L'+x2.toFixed(1)+','+y2.toFixed(1));
      p.setAttribute('fill','none'); p.setAttribute('stroke',col); p.setAttribute('stroke-width','2.5'); p.setAttribute('stroke-linecap','round'); p.setAttribute('stroke-linejoin','round'); ov.appendChild(p);
      [[x1,y1],[x2,y2]].forEach(([x,y]) => { const ci=document.createElementNS(NS,'circle');
        ci.setAttribute('cx',x.toFixed(1)); ci.setAttribute('cy',y.toFixed(1)); ci.setAttribute('r','4'); ci.setAttribute('fill',col); ov.appendChild(ci); });
    };
    // trunk connectors: anchor to exact hex CONNECTION POINTS (point-to-point, like Visio glue points).
    // The right side of a pointy-top hex is a vertical edge: upper-right corner (cy-SIDE), edge-mid (cy), lower-right corner (cy+SIDE).
    for (let j = 0; j < n; j++){
      const la = laneAt(j), lb = laneAt(j+1);
      const cx = hx(j), cy = hy(j), tx = hx(j+1), ty = hy(j+1);
      const c1 = nodeColor(vis[j]), c2 = nodeColor(vis[j+1]);   // gradient: this tile's color → the next tile's color (the + slot falls back to linkCol)
      const fut = nodeLayer(vis[j])==='future' || (vis[j+1] && nodeLayer(vis[j+1])==='future');   // reaches into a goal → dashed
      const cls = (j === n-1) ? 'bp-conn-add' : null;   // the connector that runs into the + add-tile — droppable in the JPEG export
      if (lb === la)      addLine(cx+APO, cy,      tx-APO, ty,      c1, c2, fut, cls);   // same lane → edge-mid to edge-mid (straight across)
      else if (lb < la)   addLine(cx+APO, cy-SIDE, tx-APO, ty+SIDE, c1, c2, fut, cls);   // next is UP   → upper-right corner → its lower-left corner
      else                addLine(cx+APO, cy+SIDE, tx-APO, ty-SIDE, c1, c2, fut, cls);   // next is DOWN → lower-right corner → its upper-left corner
    }
    // fork connector: an L off the main's BOTTOM-LEFT corner — straight down, then right into the concurrent's left side
    vis.forEach((node, i) => {
      concsOf(node).forEach((c, k) => {
        const fut = nodeLayer(node)==='future' || nodeLayer(c)==='future';
        const mainCy = hy(i), concCy = mainCy + CONC_DY + k*CONC_STACK, concCx = hx(i) + CONC_DX;
        const x0 = hx(i) - APO, y0 = mainCy + SIDE;     // main bottom-left corner (start)
        const x2 = concCx - APO, y2 = concCy;           // concurrent left flat side (end)
        addElbow(x0, y0, x0, y2, x2, y2, nodeColor(node), nodeColor(c), fut);   // gradient: parent tile color → fork tile color
      });
    });
  }

  // Education Growth: a honeycomb SHELL — credential hexes spiral outward from the center; click one to edit
  // honeycomb shell for Education + Skill/Spec/Experience (a spiral of hexes, not a chain)
  function renderSpiral(cfg){
    const host = document.getElementById(cfg.grid); if (!host) return;
    const isCred = cfg.kind === 'cred';
    const zoneCol = (DATA.growth && DATA.growth.zones[cfg.key]) ? DATA.growth.zones[cfg.key].color : '#5AC8BE';
    const list = build[cfg.key];
    const vis = (build.view === 'current') ? list.filter(layerVisible) : list.slice();
    if (build.view !== 'current') vis.sort((a,b) => (nodeLayer(a)==='future'?1:0) - (nodeLayer(b)==='future'?1:0));   // have before want
    host.innerHTML = '';
    const SP = 40, R = 34, NS = 'http://www.w3.org/2000/svg';
    const cells = hexSpiral(vis.length + 1);   // +1 slot for the add hex
    const pts = cells.map(p => ({ x: SP*(Math.sqrt(3)*p.q + Math.sqrt(3)/2*p.r), y: SP*(1.5*p.r) }));
    const minX = Math.min(...pts.map(p=>p.x))-R-3, maxX = Math.max(...pts.map(p=>p.x))+R+3;
    const minY = Math.min(...pts.map(p=>p.y))-R-3, maxY = Math.max(...pts.map(p=>p.y))+R+3;
    const svg = document.createElementNS(NS,'svg');
    svg.setAttribute('class','bp-spiral'); svg.setAttribute('width', (maxX-minX).toFixed(0));   // natural px (don't balloon a lone hex); CSS caps with max-width
    svg.setAttribute('height', (maxY-minY).toFixed(0));   // explicit height so html2canvas (JPEG export) renders the spiral, not a blank box
    svg.setAttribute('viewBox', minX.toFixed(1)+' '+minY.toFixed(1)+' '+(maxX-minX).toFixed(1)+' '+(maxY-minY).toFixed(1));

    vis.forEach((node,i) => {
      const p = pts[i];
      let col, face;
      if (isCred){ const real = node.kind==='real'; col = real ? credHexColor(node) : '#E8C547'; face = real ? (node.label||'?') : (credFaceShort(node.label)||'✎'); }
      else { col = node.zcol || zoneCol; face = node.abbr || credFaceShort(node.name) || '✎'; }
      const lines = wrapLabel(String(face), 8).slice(0,2);                       // wrap long faces (e.g. RN-BC Informatics) to fit
      const ml = Math.max(...lines.map(l=>l.length), 1);
      const fs = ml>9 ? 8 : ml>7 ? 9.5 : ml>5 ? 11.5 : ml>3 ? 14 : 17;
      let tspans = ''; const lh = fs + 1;
      lines.forEach((ln,li) => tspans += '<tspan x="0" y="'+(((li-(lines.length-1)/2)*lh) + fs*0.34).toFixed(1)+'">'+esc(ln)+'</tspan>');
      const lyr = nodeLayer(node), ghost = (build.view === 'future' && lyr === 'current');
      const g = document.createElementNS(NS,'g');
      g.setAttribute('class','bp-sp-cell'+(node.id===eduSelId?' sel':'')+(lyr==='future'?' bp-sp-future':'')+(ghost?' bp-sp-ghost':''));
      g.setAttribute('transform','translate('+p.x.toFixed(1)+','+p.y.toFixed(1)+')');
      g.innerHTML = '<path d="'+hexPath(0,0,R)+'" class="bp-sp-hex" style="fill:'+hexA(col,0.22)+';stroke:'+col+(lyr==='future'?';stroke-dasharray:4 4':'')+'"/>'+
        '<text text-anchor="middle" class="bp-sp-tx" style="font-size:'+fs+'px">'+tspans+'</text>'+
        '<g class="bp-sp-layer" title="'+(lyr==='future'?'Goal. Click to mark it as something you HAVE':'Have. Click to mark it as a goal')+'"><circle cx="-16" cy="-21" r="8.5"/><text x="-16" y="-17.3" text-anchor="middle">'+(lyr==='future'?'✓':'◇')+'</text></g>'+
        '<g class="bp-sp-del" title="remove"><circle cx="16" cy="-21" r="8.5"/><text x="16" y="-17.3" text-anchor="middle">×</text></g>';
      g.onclick = (e) => {
        e.stopPropagation();   // don't let the open-click reach the global dismiss handler
        if (eduSelId === node.id){ eduSelId = null; closePanel(); renderMyPath(); }
        else { eduSelId = node.id; renderMyPath(); if (isCred) openCredPanel(node); else openItemPanel(node, cfg); }
      };
      asEl(g.querySelector('.bp-sp-layer')).onclick = (e) => { e.stopPropagation();   // green ✓ flips a Want tile to Current (Have), like the career tiles
        node.layer = (nodeLayer(node) === 'future' ? 'current' : 'future'); saveBuild(); renderMyPath(); };
      asEl(g.querySelector('.bp-sp-del')).onclick = (e) => { e.stopPropagation();
        const k = list.indexOf(node); if (k>=0) list.splice(k,1);
        if (eduSelId === node.id){ eduSelId = null; closePanel(); }
        syncPinned(); saveBuild(); renderMyPath(); };
      svg.appendChild(g);
    });
    // dashed "+" hex at the next spiral position
    const ap = pts[vis.length];
    const addG = document.createElementNS(NS,'g');
    addG.setAttribute('class','bp-sp-add'); addG.setAttribute('transform','translate('+ap.x.toFixed(1)+','+ap.y.toFixed(1)+')');
    addG.innerHTML = '<path d="'+hexPath(0,0,R)+'" class="bp-sp-addhex"/>'+
      '<text text-anchor="middle" y="7" class="bp-sp-tx">+</text>';
    addG.onclick = () => addCustomNode(cfg.key);   // add to THIS spiral's track (education/skill/spec/experience), not always education
    svg.appendChild(addG);
    host.appendChild(svg);
  }

  // detail panel for a selected Education Growth credential — pulls the Education-Matrix data (degree, exams, roles it opens)
  function openCredPanel(node){
    const deg = node.degree, degMeta = DATA.meta.degrees[deg] || {};
    const col = degMeta.color || '#E8C547';
    const entry = credIndex.find(c => c.face === node.label);
    const sch = DATA.meta.schooling || {};
    const ladder = (sch.ladder||[]).find(L => L.degree === deg);
    // a GENERIC degree tile ("Bachelor") can be named here — the sheet handles details the survey doesn't ask
    const genericDeg = node.kind === 'real' && (GENERIC_FACES.has(node.label) || node.namedDeg);
    asEl(document.querySelector('#hct-p-badge .hct-p-dot')).style.background = col;
    document.querySelector('#hct-p-badge .lbl').textContent = degMeta.label || deg;
    asEl(document.querySelector('#hct-p-badge')).style.background = hexA(col, 0.14);
    asEl(document.querySelector('#hct-p-badge')).style.color = col;
    document.getElementById('hct-p-title').textContent = node.kind==='real' ? node.label : (node.label || 'Custom credential');
    document.getElementById('hct-p-abbr').textContent = (degMeta.label||deg) + (ladder && ladder.time ? ' · ' + ladder.time : '');

    let h = '<p class="hct-p-summary">'+esc(node.kind!=='real' ? 'Your own credential.'
      : genericDeg ? ('A '+(degMeta.label||deg)+' on your education line. Name what it\'s in, so two degrees never read as the same tile.')
      : ('A '+(degMeta.label||deg)+'-level credential, straight from the Education Matrix.'))+'</p>';
    h += '<div class="hct-list-h">Years</div><input class="bp-years" id="cred-years" style="width:130px;text-align:left" placeholder="when / how long" value="'+esc(node.years||'')+'">';
    if (genericDeg){
      const PH = { Cert:'CPhT, coding, phlebotomy…', AS:'ADN, respiratory, radiography…', BS:'BSN, biology, health science…', MS:'MHA, MSN, MPH, MBA…', Doc:'DNP, PhD, PharmD…' };
      h += '<div class="hct-list-h">What\'s it in?</div>'
         + '<input class="bp-years" id="cred-name" style="width:90%;text-align:left" maxlength="40" placeholder="'+esc(PH[deg]||'Name it…')+'" value="'+esc(node.namedDeg ? node.label : '')+'">';
      // tap-to-name suggestions: named academic faces + the credential pool at this level
      const GENERIC_ONLY = new Set(['Master', "Master's", 'Bachelor', "Bachelor's", 'Associate', 'Certificate', 'Doctoral', 'HS / GED', 'GED', 'MD/DO']);
      const named = Object.keys(DEG_FACE_LEVEL).filter(f => DEG_FACE_LEVEL[f] === deg);
      const pool = [...new Set(named.concat(credIndex.filter(c => c.degree === deg).map(c => c.face)))].filter(f => !GENERIC_ONLY.has(f)).slice(0, 6);
      if (pool.length) h += '<div class="hct-leads">' + pool.map(f => '<span class="hct-chip" data-namechip="'+esc(f)+'">'+esc(f)+'</span>').join('') + '</div>';
    }
    if (node.kind !== 'real')
      h += '<div class="hct-list-h">Code</div><input class="bp-cred-in" id="cred-code" style="width:150px" placeholder="CODE" value="'+esc(node.label||'')+'">';
    if (entry && entry.roleIds && entry.roleIds.length){
      h += '<div class="hct-list-h">Opens these roles</div><div class="hct-leads">';
      entry.roleIds.slice(0,16).forEach(rid => { const rn = nodeById.get(rid); if (rn) h += '<span class="hct-chip" data-go="'+rid+'">'+esc(rn.abbr)+' · '+esc(rn.label.replace(/\n/g,' '))+'</span>'; });
      if (entry.roleIds.length > 16) h += '<span class="hct-chip" style="opacity:.6;cursor:default">+'+(entry.roleIds.length-16)+' more</span>';
      h += '</div>';
    }
    // (the old level-wide "Exams / Licensure" list is gone — it hung NCLEX on a CEN.
    //  Specific credentials get their real numbers from credStatsHTML instead.)
    h += credStatsHTML(node.label);   // the exam in numbers, when we have them
    h += '<button class="hct-pin-btn" id="cred-remove" style="background:rgba(232,120,120,0.14);border-color:rgba(232,120,120,0.4);color:#f0a8a8">Remove from Education</button>';

    document.getElementById('hct-p-body').innerHTML = h;
    const panel = document.getElementById('hct-panel'); dockPanel(); panel.classList.add('open'); panel.dataset.owner = 'path';
    const yr = asInput(document.getElementById('cred-years')); if (yr) yr.oninput = () => { node.years = yr.value; saveBuild(); };
    const cc = asInput(document.getElementById('cred-code')); if (cc) cc.oninput = () => { node.label = cc.value; saveBuild(); renderMyPath(); };
    const cn = asInput(document.getElementById('cred-name'));
    if (cn){
      const applyName = v => {
        v = (v||'').trim();
        node.label = v || (degMeta.label || deg);   // cleared = back to the bare level
        node.namedDeg = !!v;
        saveBuild(); renderMyPath();
        document.getElementById('hct-p-title').textContent = node.label;
      };
      cn.oninput = () => applyName(cn.value);
      qsa(document,'#hct-p-body [data-namechip]').forEach(ch => {
        ch.onclick = () => { cn.value = ch.dataset.namechip; applyName(cn.value); };
      });
    }
    asEl(document.getElementById('cred-remove')).onclick = () => { const i = build.education.indexOf(node); if (i>=0) build.education.splice(i,1); eduSelId = null; closePanel(); saveBuild(); renderMyPath(); };
    qsa(document,'#hct-p-body .hct-chip[data-go]').forEach(ch => ch.onclick = () => selectCareer(ch.getAttribute('data-go')));
  }

  // lightweight edit panel for a Skill / Specialization / Experience hex (name + years + remove)
  function openItemPanel(node, cfg){
    const fromAtlas = !!node.atlasId;
    const col = node.zcol || (DATA.growth && DATA.growth.zones[cfg.key] ? DATA.growth.zones[cfg.key].color : '#5AC8BE');
    asEl(document.querySelector('#hct-p-badge .hct-p-dot')).style.background = col;
    document.querySelector('#hct-p-badge .lbl').textContent = cfg.title;
    asEl(document.querySelector('#hct-p-badge')).style.background = hexA(col, 0.14);
    asEl(document.querySelector('#hct-p-badge')).style.color = col;
    document.getElementById('hct-p-title').textContent = node.name || node.abbr || ('New ' + cfg.title.toLowerCase());
    document.getElementById('hct-p-abbr').textContent = cfg.title + (fromAtlas ? ' · from the Areas of Expertise Matrix' : ' · your own');
    let h = '<p class="hct-p-summary">'+esc(fromAtlas ? 'Pulled from the Areas of Expertise Matrix.' : 'Your own '+cfg.title.toLowerCase()+'.')+'</p>';
    if (!fromAtlas)
      h += '<div class="hct-list-h">Name</div><input class="bp-name" id="item-name" style="width:90%;height:auto;text-align:left;padding:6px 8px" placeholder="name it" value="'+esc(node.name||'')+'">';
    h += '<div class="hct-list-h">Years</div><input class="bp-years" id="item-years" style="width:150px;text-align:left" placeholder="when / how long" value="'+esc(node.years||'')+'">';
    h += '<button class="hct-pin-btn" id="item-remove" style="background:rgba(232,120,120,0.14);border-color:rgba(232,120,120,0.4);color:#f0a8a8">Remove from '+esc(cfg.title)+'</button>';
    document.getElementById('hct-p-body').innerHTML = h;
    const panel = document.getElementById('hct-panel'); dockPanel(); panel.classList.add('open'); panel.dataset.owner = 'path';
    const nm = asInput(document.getElementById('item-name')); if (nm) nm.oninput = () => { node.name = nm.value; saveBuild(); renderMyPath(); };
    const yr = asInput(document.getElementById('item-years')); if (yr) yr.oninput = () => { node.years = yr.value; saveBuild(); };
    asEl(document.getElementById('item-remove')).onclick = () => { const i = build[cfg.key].indexOf(node); if (i>=0) build[cfg.key].splice(i,1); eduSelId = null; closePanel(); saveBuild(); renderMyPath(); };
  }

  // ── search INTEGRATED into a tile's name field (floating dropdown so the chain's overflow can't clip it) ──
  let bpFloat = null;
  function bpFloatEl(){
    if (!bpFloat){
      bpFloat = document.createElement('div'); bpFloat.className = 'bp-suggest bp-float';
      (document.getElementById('hct-shell') || document.body).appendChild(bpFloat);
      bpFloat.addEventListener('mousedown', e => e.preventDefault());   // keep the input focused so the click lands
    }
    return bpFloat;
  }
  function hideTileSuggest(){ if (bpFloat){ bpFloat.classList.remove('open'); bpFloat.innerHTML = ''; } }
  // My-Path-only anchor tiles (gold) — bookend the career timeline; NOT in the Career Matrix, only searchable here
  const ANCHORS = [
    { id:'__anchor-start', label:'Start of Career', abbr:'★', color:'#E8C547', anchor:'start', kw:['start','begin','career','entry','first'] },
    { id:'__anchor-end',   label:'Retirement',      abbr:'⚑', color:'#E8C547', anchor:'end',   kw:['retire','retirement','end','finish','last'] },
    { id:'__anchor-other', label:'Other (type your own)', abbr:'◆', color:'#E8C547', anchor:'other', kw:['other','custom','gap','break','milestone','note','misc','sabbatical','military','travel'] }
  ];
  // Layman → role synonyms: an everyday word ("teacher", "boss") also surfaces
  // the real roles that match the concept ("Clinical Educator", "Adjunct
  // Faculty", "Manager"...). Keys are stems; values are role-label keywords.
  const ROLE_SYNONYMS = {
    teach:['educator','faculty','instructor','professor','adjunct','preceptor','trainer','education'],
    professor:['faculty','educator','instructor','adjunct','academic'],
    instructor:['educator','faculty','instructor','trainer','preceptor'],
    trainer:['educator','trainer','instructor','development'],
    boss:['manager','director','supervisor','lead','chief','administrator'],
    manager:['manager','director','supervisor','lead','coordinator'],
    leader:['director','manager','chief','lead','executive','officer','supervisor'],
    executive:['executive','director','officer','chief','president'],
    doctor:['physician','hospitalist','attending','medical director'],
    physician:['physician','hospitalist','attending'],
    nurse:['nurse','nursing','charge'],
    aide:['aide','assistant','technician','technologist'],
    assistant:['assistant','aide','technician'],
    helper:['aide','assistant','support','technician'],
    tech:['technician','technologist'],
    technician:['technician','technologist'],
    therapist:['therapist','therapy','respiratory','physical','occupational','speech'],
    admin:['administrator','administrative','manager','coordinator','clerk','office'],
    billing:['billing','coder','coding','revenue','claims','reimbursement'],
    coder:['coder','coding','billing'],
    computer:['informatics','analyst','technology','systems','data'],
    it:['informatics','analyst','technology','systems','data'],
    research:['research','scientist','analyst'],
    scientist:['scientist','research','laboratory'],
    counselor:['counselor','social worker','case manager'],
    social:['social worker','case manager','counselor'],
    pharmacist:['pharmacy','pharmacist'],
    pharmacy:['pharmacy','pharmacist'],
    surgeon:['surgeon','surgical','operating'],
    lab:['laboratory','technologist','pathology'],
    clerk:['clerk','registration','receptionist','scheduler','administrative'],
    receptionist:['receptionist','registration','clerk','scheduler'],
    scheduler:['scheduler','scheduling','registration','coordinator'],
    dietician:['dietitian','nutrition','dietary'],
    dietitian:['dietitian','nutrition'],
    imaging:['radiology','imaging','sonographer','technologist'],
    xray:['radiology','imaging','technologist'],
    compliance:['compliance','quality','risk','regulatory','audit'],
    quality:['quality','compliance','improvement','safety'],
    consultant:['consultant','advisor','specialist'],
    advisor:['advisor','consultant','specialist','policy'],
    policy:['policy','advisor','government','regulatory','public health'],
    analyst:['analyst','informatics','data'],
    coordinator:['coordinator','navigator','manager'],
    navigator:['navigator','coordinator','case manager'],
    student:['student','intern','trainee','resident'],
    intern:['intern','resident','trainee']
  };
  function synonymTerms(q){
    q = (q||'').trim().toLowerCase();
    if (q.length < 3) return [];
    const out = new Set();
    for (const key in ROLE_SYNONYMS){
      if (q === key || q.indexOf(key) >= 0 || key.indexOf(q) >= 0) ROLE_SYNONYMS[key].forEach(t => out.add(t));
    }
    return [...out];
  }
  function tileSuggestMatches(cfg, q){
    q = (q||'').trim().toLowerCase();
    const all = (q === '' || q === '*');   // empty focus OR "*" wildcard → browse the whole list (the dropdown scrolls)
    if (cfg.kind === 'role'){ const fams = DATA.classes[curClass].families;
      const anchors = ANCHORS.filter(a => all || a.label.toLowerCase().includes(q) || a.kw.some(k => k.includes(q) || q.includes(k)));
      const pool = [...nodeById.values()];
      const syn = all ? [] : synonymTerms(q);
      const matched = all ? pool : pool.filter(n => { const lbl = n.label.toLowerCase().replace(/\n/g,' '); return lbl.includes(q) || (n.abbr||'').toLowerCase().includes(q) || syn.some(t => lbl.indexOf(t) >= 0); });
      const roles = matched.slice(0, all ? 600 : 40)
        .map(n => ({ id:n.id, label:n.label.replace(/\n/g,' '), abbr:n.abbr, color:(fams[n.family]||{}).color||'#4ECDC4' }));
      return all ? /** @type {any[]} */ (anchors).concat(roles) : /** @type {any[]} */ (roles).concat(anchors); }   // browse: anchors first, then the full list
    if (cfg.kind === 'cred'){   // Education: search the credential index (face + degree + the roles it opens), * for all
      const matched = all ? credIndex : credIndex.filter(c => c.search.includes(q));
      return matched.slice(0, all ? 600 : 40).map(c => ({ id:c.face, label:c.face, abbr:c.degreeLabel, color:(DATA.meta.degrees[c.degree]||{}).color||'#E8C547' }));
    }
    if (!DATA.growth) return [];
    const col = (DATA.growth.zones[cfg.key]||{}).color || '#5AC8BE';
    const gpool = DATA.growth.nodes.filter(n => n.zone===cfg.key);
    const gmatched = all ? gpool : gpool.filter(n => n.label.toLowerCase().includes(q) || (n.abbr||'').toLowerCase().includes(q) || (n.group||'').toLowerCase().includes(q));
    return gmatched.slice(0, all ? 600 : 40).map(n => ({ id:n.id, label:n.label, abbr:n.abbr, color:col }));
  }
  function showTileSuggest(cfg, node, inp){
    if (node.anchor) return;                            // anchor tiles (incl. "Other") are free-text — no role search
    if (node.roleId || node.atlasId) return;            // already a real node
    const matches = tileSuggestMatches(cfg, inp.value);
    if (!matches.length){ hideTileSuggest(); return; }
    const el = bpFloatEl();
    el.innerHTML = matches.map(m => '<div class="bp-sg" data-id="'+m.id+'"><span class="bp-sg-dot" style="background:'+m.color+'"></span><span class="bp-sg-nm">'+esc(m.label)+'</span><span class="bp-sg-ab">'+esc(m.abbr)+'</span></div>').join('');
    const r = inp.getBoundingClientRect();
    el.style.left = Math.round(r.left)+'px'; el.style.top = Math.round(r.bottom+4)+'px'; el.style.minWidth = Math.max(190, Math.round(r.width))+'px';
    el.classList.add('open');
    qsa(el,'[data-id]').forEach(d => d.onclick = () => { convertTileToReal(cfg, node, d.getAttribute('data-id')); hideTileSuggest(); });
  }
  // keepName = link a tile to a real Matrix node but PRESERVE the user's own title (for "this is the same job, worded differently")
  function convertTileToReal(cfg, node, id, keepName){
    const anc = ANCHORS.find(a => a.id === id);
    if (anc){ node.anchor = anc.anchor; node.name = anc.anchor==='other' ? '' : anc.label; node.abbr = anc.abbr; delete node.roleId; delete node.concurrent; delete node.concurrents;
      syncPinned(); saveBuild(); renderMyPath(); updateBoardPins(); return; }
    if (cfg.kind === 'cred'){ const c = credIndex.find(x => x.face === id); if (!c) return;
      node.kind = 'real'; if (!keepName) node.label = c.face; node.degree = c.degree; node.sub = c.degreeLabel; delete node.atlasId;
      saveBuild(); renderMyPath(); return; }
    if (cfg.kind === 'role'){ const n = nodeById.get(id); if (!n) return;
      node.roleId = id; node.abbr = n.abbr; node.family = n.family; if (!keepName) node.name = n.label.replace(/\n/g,' ');
      syncPinned(); saveBuild(); renderMyPath(); updateBoardPins(); return; }
    const gn = (DATA.growth.nodes||[]).find(x => x.id === id); if (!gn) return;
    node.atlasId = gn.id; node.abbr = gn.abbr; node.zcol = (DATA.growth.zones[gn.zone]||{}).color; if (!keepName) node.name = gn.label;
    saveBuild(); renderMyPath();
  }

  // Click a custom/unlinked tile's hex → pick the Matrix role (or credential) it really maps to, WITHOUT changing your title.
  // Matches are seeded by the current title (synonyms included), falling back to the full list so anything is reachable.
  function openLinkSearch(cfg, node, anchorEl){
    const q = ((cfg.kind==='cred' ? node.label : node.name) || '').trim();
    let matches = q ? tileSuggestMatches(cfg, q) : [];
    if (!matches.length) matches = tileSuggestMatches(cfg, '*');
    matches = matches.filter(m => !String(m.id).startsWith('__anchor')).slice(0, 60);
    const el = bpFloatEl(), kind = cfg.kind==='cred' ? 'credential' : 'role';
    el.innerHTML = '<div class="bp-sg-head">Link &ldquo;'+esc(q||'this tile')+'&rdquo; to a Matrix '+kind+' &middot; keeps your title</div>' +
      (matches.length ? matches.map(m => '<div class="bp-sg" data-id="'+m.id+'"><span class="bp-sg-dot" style="background:'+m.color+'"></span><span class="bp-sg-nm">'+esc(m.label)+'</span><span class="bp-sg-ab">'+esc(m.abbr)+'</span></div>').join('') : '<div class="bp-sg" style="opacity:.6;cursor:default">No matches</div>');
    const r = anchorEl.getBoundingClientRect();
    el.style.left = Math.round(r.left)+'px'; el.style.top = Math.round(r.bottom+5)+'px'; el.style.minWidth = Math.max(232, Math.round(r.width))+'px';
    el.classList.add('open');
    qsa(el,'[data-id]').forEach(d => d.onclick = () => { convertTileToReal(cfg, node, d.getAttribute('data-id'), true); hideTileSuggest(); });
    // close when clicking anywhere outside the dropdown (there's no input blur to lean on here)
    setTimeout(() => { const away = ev => { if (!el.contains(ev.target)){ hideTileSuggest(); document.removeEventListener('mousedown', away, true); } }; document.addEventListener('mousedown', away, true); }, 0);
  }


  // Education Growth picker: search the Education Matrix credential pool → addCredFromIndex(face, degree)
  function wireCredPicker(inputId, suggestId){
    const inp = asInput(document.getElementById(inputId)), sug = document.getElementById(suggestId);
    if (!inp || !sug) return;
    const render = () => {
      const q = inp.value.trim().toLowerCase(); const all = (q === '' || q === '*');   // click in (or *) → browse the whole list
      const matches = (all ? credIndex : credIndex.filter(c => c.search.includes(q))).slice(0, all ? 600 : 40);
      sug.innerHTML = matches.length
        ? matches.map(c => { const dc=(DATA.meta.degrees[c.degree]||{}).color||'#E8C547';
            return '<div class="bp-sg" data-face="'+esc(c.face)+'" data-deg="'+esc(c.degree)+'"><span class="bp-sg-dot" style="background:'+dc+'"></span><span class="bp-sg-nm">'+esc(c.face)+'</span><span class="bp-sg-ab">'+esc(c.degreeLabel)+'</span></div>'; }).join('')
        : '<div class="bp-sg" style="opacity:.6;cursor:default">No match</div>';
      sug.classList.add('open');
      qsa(sug,'[data-face]').forEach(el => asEl(el).onclick = () => { addCredFromIndex(el.getAttribute('data-face'), el.getAttribute('data-deg')); inp.value=''; sug.classList.remove('open'); });
    };
    inp.oninput = render; inp.onfocus = render;
  }

  // Layman → catalog terms so a plain-English search finds the right expertise tile (mirrors the board's role synonyms)
  const GROWTH_SYN = {
    heart:['cardi','heart','telemetry','rhythm'], cardiac:['cardi'], kidney:['neph','dialysis'], kidneys:['neph','dialysis'],
    lung:['pulmon','vent','airway','respiratory'], lungs:['pulmon','respiratory'], breathing:['vent','airway','pulmon','respiratory'], breath:['vent','airway','pulmon'],
    cancer:['oncolog','chemo'], chemo:['oncolog','infusion'], baby:['neonat','newborn','nicu','postpartum','labor'], babies:['neonat','nicu'], newborn:['neonat','nicu','newborn'],
    pregnant:['antepartum','labor','postpartum'], pregnancy:['antepartum','labor','postpartum'], birth:['labor','delivery','postpartum'],
    kid:['pediatr','peds'], kids:['pediatr','peds'], child:['pediatr','peds'], children:['pediatr','peds'],
    old:['geriatr'], elderly:['geriatr'], senior:['geriatr'], aging:['geriatr'], brain:['neuro'], stroke:['neuro'],
    mental:['behavioral','psychiatr','addiction'], psych:['behavioral','psychiatr'], addiction:['addiction','substance'], drugs:['addiction','substance','medication'],
    blood:['transfus','phleb','apheresis','blood'], computer:['informatic','ehr','epic','sql','data'], tech:['informatic','ehr','data'], data:['data','sql','dashboard','bi'],
    teacher:['precept','present','educat'], teaching:['precept','present','educat'], educator:['precept','present','educat'], mentor:['precept'],
    manager:['leadership','staffing','budget'], manage:['leadership','staffing','budget','project','change'], leader:['leadership','lead'], boss:['leadership'],
    covid:['isolation','ppe','infectious'], infection:['infectious','isolation','ppe'], skin:['wound','ostomy'], stomach:['gastro','gi','endoscop'], gut:['gastro','gi'],
    diabetes:['endocrin','diabet','insulin'], sugar:['endocrin','glucose'], surgery:['surg','perioper','pacu'], operating:['perioper','surg'],
    hospice:['hospice','palliative','end-of-life'], dying:['hospice','palliative'], ultrasound:['sonograph','pocus'], xray:['imaging','radiolog'],
    emergency:['emergency','trauma'], er:['emergency','trauma'], rural:['rural','critical access'], home:['home health'], school:['school'],
    rehab:['rehab','therap'], needle:['iv','phleb','vascular'], heartattack:['cath','cardi'], dialysis:['dial','neph']
  };
  function growthSyn(q){
    let out = [];
    for (const k in GROWTH_SYN){ if (k === q || k.indexOf(q) === 0 || q.indexOf(k) === 0) out = out.concat(GROWTH_SYN[k]); }
    return out;
  }
  // Skill/Spec/Experience pickers: search an Areas of Expertise Matrix zone → toggleGrowthNode
  function wireGrowthPicker(inputId, suggestId, zone){
    const inp = asInput(document.getElementById(inputId)), sug = document.getElementById(suggestId);
    if (!inp || !sug) return;
    const render = () => {
      if (!DATA || !DATA.growth) return;   // DATA loads async — read it inside the handler, not at wire-time
      const pool = DATA.growth.nodes.filter(n => n.zone === zone);
      const col = DATA.growth.zones[zone].color, track = DATA.growth.zones[zone].track;
      const q = inp.value.trim().toLowerCase(); const all = (q === '' || q === '*');   // click in (or *) → browse the whole list
      const syn = all ? [] : growthSyn(q);
      let matches;
      if (all) matches = pool.slice(0, 600);
      else {
        // rank: a name/abbr hit beats a synonym-in-name hit beats a summary hit (so a short query like "old" surfaces
        // Geriatrics, not whatever has "hold" buried in its description).
        const scored = [];
        pool.forEach(n => {
          const lbl = n.label.toLowerCase(), ab = (n.abbr||'').toLowerCase(), grp = (n.group||'').toLowerCase();
          const det = growthDetail[n.id] || {};
          const extra = ((n.summary||'')+' '+(n.seen||'')+' '+(det.how||'')+' '+(det.show||'')).toLowerCase();
          let s = 0;
          if (lbl.includes(q)) s = 100; else if (ab.includes(q)) s = 90; else if (grp.includes(q)) s = 55;
          else if (syn.some(t => lbl.includes(t) || ab.includes(t))) s = 45;
          else if (extra.includes(q)) s = 25;
          else if (syn.some(t => extra.indexOf(t) >= 0)) s = 18;
          if (s) scored.push([s, n]);
        });
        scored.sort((a,b) => b[0] - a[0]);
        matches = scored.slice(0, 40).map(x => x[1]);
      }
      sug.innerHTML = matches.length
        ? matches.map(n => { const on = (build[track]||[]).some(s=>s.atlasId===n.id);
            return '<div class="bp-sg'+(on?' on':'')+'" data-gid="'+n.id+'"><span class="bp-sg-dot" style="background:'+col+'"></span><span class="bp-sg-nm">'+esc(n.label)+'</span><span class="bp-sg-ab">'+esc(n.group||'')+(on?' ✓':'')+'</span></div>'; }).join('')
        : '<div class="bp-sg" style="opacity:.6;cursor:default">No match</div>';
      sug.classList.add('open');
      qsa(sug,'[data-gid]').forEach(el => el.onclick = () => {
        const gn = pool.find(x => x.id === el.getAttribute('data-gid'));
        if (gn && !(build[track]||[]).some(s=>s.atlasId===gn.id)) toggleGrowthNode(gn);
        inp.value=''; render();   // keep the list open (added item now shows ✓) for browsing/adding more
      });
    };
    inp.oninput = render; inp.onfocus = render;
  }

  // ── Schooling & Requirements ───────────────────────────
  function focusNode(id){
    const p = posMap.get(id); if (!p) return;
    const wrap = document.getElementById('hct-board').getBoundingClientRect();
    if (wrap.width < 120) return;
    // center in the EXPOSED strip between the frozen axis and the open panel — a free-look
    // focus must never park the node under either (same availW rule as fitToBounds)
    let availW = wrap.width;
    const pEl = document.getElementById('hct-panel');
    if (pEl && pEl.classList.contains('open') && pEl.dataset.owner === 'career'){
      const pw = pEl.getBoundingClientRect().width;
      if (pw < wrap.width * 0.9) availW = wrap.width - pw;
    }
    const k = 1.0, tx = AXIS_RESERVE + (availW - AXIS_RESERVE)/2 - k*p.x, ty = wrap.height/2 - k*p.y;
    userZoomed = true;
    svg.transition().duration(dcap(520)).call(zoom.transform, d3.zoomIdentity.translate(tx,ty).scale(k)).on('end', syncLOD);
  }
  function selectCareer(id, look){
    const n = nodeById.get(id); if (!n) return;
    hiddenPathways.delete(n.pathway); hiddenFamilies.delete(n.family);   // make sure it's visible
    refreshPathwayControls();
    if (curView === 'edu') setView('career');   // the Education Matrix has no center column → jump to the Career Matrix (My Path keeps it in-place)
    eduSelId = null;
    selectedId = id;
    // DECKS + look: a card chip / Connections row is a QUESTION, not a move — swap the card,
    // hold the board exactly as it stands (his: clicking for information kept shifting the
    // whole view). The Viewing chip's Focus line button is the explicit way IN to its world.
    if (DECKS && collapsedFams && look){
      render(curView === 'career');
      openPanel(id);
      return;
    }
    snapArmed = true;   // a jump (search, preset, deep link) is an explicit ask for the LINE — arm the snap
    if (DECKS && collapsedFams) focusId = id;
    render(curView === 'career');   // animate when the board is visible — chip/search jumps relayout in step with the camera
    openPanel(id);   // detail opens IN the current view, docked to the right of the center column on My Path (dockPanel + the [data-view] nest CSS)
    if (curView === 'career') setTimeout(() => { if (lineageSet){ userZoomed = true; snapFit(); } else focusNode(id); }, 90);   // snap mode lands on the home ladder (decks) or the whole field (classic); free look pans to the node
  }

  function renderSchooling(){ if (DATA.meta.schooling){ renderEducationMatrix(); eduRendered = true; } }   // Education Matrix (time + exams ride inside each level band)

  // the degree/cert a role earns: the cert if it has one, else the degree it requires
  function metaV(n,k){ const m=(n.meta||[]).find(x=>x.k===k); return m ? m.v : ''; }
  function credFace(n){
    const c = metaV(n,'Credential');
    if (c && !/^\(?none|^none\b|employer|^None /i.test(c)){
      let s = c.split(/\s+(?:or|then)\s+/i)[0];                          // first option only
      const paren = s.match(/\(([A-Z][A-Za-z0-9\/.\- ]{1,13})\)/);       // an acronym in parens, if any
      s = s.replace(/\([^)]*\)/g,'')                                     // drop all parentheticals
           .replace(/\bspecialty\b/ig,'').replace(/\bnational\b/ig,'').replace(/\bstate\b/ig,'').replace(/\bagency\b/ig,'')
           .replace(/\bregistry\b/ig,'').replace(/\bcertificates?\b/ig,'').replace(/\bcertifications?\b/ig,'')
           .replace(/\bcert\b/ig,'').replace(/\bboard\b(?!s)/ig,'').replace(/\blicen[cs]e\b/ig,'').replace(/\bexam\b/ig,'')
           .replace(/\bpost-primary\b/ig,'').replace(/\s*\+\s*CSE\b/ig,'')
           .replace(/\+/g,' ').replace(/\s{2,}/g,' ').replace(/^[\s/\-]+|[\s/\-]+$/g,'').trim();
      if (s.length < 2 && paren) s = paren[1];
      if (/^[a-z]/.test(s) && !s.includes(' ')) s = s[0].toUpperCase() + s.slice(1);   // tidy single lowercase words
      if (s.length >= 2) return s;
    }
    const e = metaV(n,'Education');
    if (/MHA|health admin/i.test(e)) return 'MHA';
    if (/MBA/i.test(e)) return 'MBA';
    if (/MPH|public health/i.test(e)) return 'MPH';
    if (/MSN|master.*nurs/i.test(e)) return 'MSN';
    if (/bachelor.*nurs|BSN/i.test(e)) return 'BSN';
    if (/doctor|ph\.?d|dnp|dnap/i.test(e)) return (DATA.meta.degrees[n.degree]||{}).label || 'Doctoral';
    if (/master/i.test(e)) return "Master's";
    if (/bachelor/i.test(e)) return "Bachelor's";
    if (/associate/i.test(e)) return 'Associate';
    if (/certificat|state-approved/i.test(e)) return 'Certificate';
    return (DATA.meta.degrees[n.degree]||{}).label || n.degree;
  }

  // ── Education Matrix — the career board's grammar, education-side. Credential and
  //    degree hexes sit in FAMILY LANES ordered by pathway; DEGREE LEVELS are the
  //    horizontal bands (the old iceberg's rows, now a zoomable field); within-lane
  //    ladder edges draw the road up each discipline. Cross-field degrees (MHA, MBA,
  //    generic Master's…) live in a shared "Any field" lane on the far right.
  const ER = 46, EROWH = 132, ECOLW = 112, ELANE_GAP = 26, EPW_GAP = 56, EAX_W = 158;
  let edZoom = null, edUserZoomed = false, edBuilt = false, edFar = false;
  let edPos = new Map(), edLanes = [], edEdges = [], edMinX = 0;
  let edSnapLane = null;   // snap-together, career-style: the selected credential's DISCIPLINE (lane) owns the board — pathway-grain was too broad (QA: "looking at Respiratory, I do not need all the therapeutics")
  let edFreeLook = false;   // career's Free look, education-side: no snap, no dim — the whole matrix stays lit
  // the Metric, education-side: discipline colors, or the exam's national first-time pass
  // rate as heat (credStats data — reality on the CREDENTIAL, never odds on a person)
  const EMODES = [
    { k:'fam',  label:'Discipline',     hint:'Colored by career field' },
    { k:'pass', label:'Exam pass rate', hint:'National first-time pass rate, straight from each credentialing board' }
  ];
  let eduColorMode = 'fam';
  function edPassColor(p){
    const t = Math.max(0, Math.min(1, (p - 50)/(97 - 50)));
    const lo = [58,90,122], hi = [78,205,196];   // the career board's heat ramp (steel → teal)
    return 'rgb(' + lo.map((v,i) => Math.round(v + (hi[i]-v)*t)).join(',') + ')';
  }
  function edSubOf(c){
    if (c.kind === 'spec') return wrapLabel(c.label || 'board cert', 15)[0] || '';
    return c.kind === 'degree' ? (c.roles.length ? c.roles.length + ' job' + (c.roles.length!==1?'s':'') : 'stepping stone')
                               : (wrapLabel(c.role.label.replace(/\n/g,' '), 15)[0] || '');
  }
  function applyEduColorMode(){
    if (!edBuilt) return;
    const pass = eduColorMode === 'pass';
    d3.selectAll('#hct-edu-svg g.ed-node').each(function(i){
      const c = eduCards[i]; if (!c) return;
      const g = d3.select(this);
      const s = pass ? credStats(c.face) : null;
      const p = s && typeof s.pass === 'number' ? s.pass : null;
      if (pass){
        g.select('.ed-body').attr('fill', p == null ? 'rgba(140,160,170,0.12)' : hexA(edPassColor(p), 0.3))
                            .attr('stroke', p == null ? 'rgba(140,160,170,0.45)' : edPassColor(p));
        g.select('.ed-sub').text(p == null ? 'no public rate' : p.toFixed(0) + '% first-time pass');
      } else {
        g.select('.ed-body').attr('fill', hexA(c.color, 0.22)).attr('stroke', c.color);
        g.select('.ed-sub').text(edSubOf(c));
      }
    });
    const face = document.getElementById('hct-sel-emetric-val');
    if (face) face.textContent = (EMODES.find(m => m.k === eduColorMode)||{}).label || 'Discipline';
    edColorLegend();
  }
  function edColorLegend(){
    const el = document.getElementById('hct-edu-clegend'); if (!el) return;
    if (eduColorMode !== 'pass'){ el.style.display = 'none'; return; }
    el.style.display = 'block';
    el.innerHTML = '<div class="cl-ttl">First-time pass rate</div>'
      + '<div class="cl-bar" style="background:linear-gradient(90deg,'+edPassColor(50)+','+edPassColor(97)+')"></div>'
      + '<div class="cl-ends"><span>50%</span><span>97%</span></div>'
      + '<div class="cl-nd"><i></i>no public rate</div>';
  }
  function setEduColorMode(m){
    eduColorMode = EMODES.some(x => x.k === m) ? m : 'fam';
    applyEduColorMode(); syncURL();
    announce('Metric: ' + ((EMODES.find(x => x.k === eduColorMode)||{}).label || 'Discipline'));
  }
  function buildEMetricPop(){
    const host = document.getElementById('hct-pop-emetric-list'); if (!host) return;
    host.innerHTML = EMODES.map(c =>
      '<button class="pop-opt" role="option" aria-selected="'+(c.k===eduColorMode)+'" data-emode="'+c.k+'" title="'+c.hint+'">'+c.label+'</button>').join('');
  }
  function eduFaceFit(face){   // font sizing for a face inside an ER hex (the old eduHexSVG math)
    const f = String(face||'');
    let lines = wrapLabel(f, 9).slice(0,2);
    if (lines.some(l => l.length > 9) && f.indexOf('-') > 0){
      // unbreakable token wider than the hex: the hyphen becomes the break (NREMT-Advanced → NREMT- / Advanced)
      const cut = f.lastIndexOf('-');
      lines = [f.slice(0, cut+1), f.slice(cut+1)].slice(0,2);
    }
    const ml = Math.max(...lines.map(l=>l.length), 1);
    const fs = ml>11 ? 10 : ml>9 ? 11.5 : ml>7 ? 13 : ml>5 ? 16.5 : ml>3 ? 20 : 24;
    return { lines, fs, lh: fs + 2 };
  }
  // which lane a card lives in: certs ride their role's family; discipline degrees ride
  // FAMILY_DEG; a named cross-cutting degree goes where most of its jobs live; generic → shared
  function eduLaneOf(c){
    if (c.kind === 'cert' || c.kind === 'spec') return c.family || '__any';
    for (const fam in FAMILY_DEG){ const lv = FAMILY_DEG[fam]; for (const k in lv){ if (lv[k][0] === c.face) return fam; } }
    if (c.roles && c.roles.length){   // even a "generic" degree lives somewhere if ~all its jobs share one family (MD/DO → physician)
      const cnt = {}; c.roles.forEach(r => cnt[r.family] = (cnt[r.family]||0)+1);
      const top = Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0];
      if (top && top[1] >= c.roles.length*0.6) return top[0];
    }
    return '__any';
  }
  function edEdgePath(s, d){   // vertical elbow through the band gap, like the career board's roads
    const sy = s.y + ER*0.88, dy = d.y - ER*0.88;
    if (Math.abs(s.x - d.x) < 1) return 'M'+s.x+' '+sy+' L'+d.x+' '+dy;
    const my = (sy + dy)/2;
    return 'M'+s.x+' '+sy+' L'+s.x+' '+my+' L'+d.x+' '+my+' L'+d.x+' '+dy;
  }

  function renderEducationMatrix(animate){
    const svgEl = document.getElementById('hct-edu-svg'); if (!svgEl) return;
    const cls = DATA.classes.roles;
    const fcfg = cls.families, famOrder = cls.familyOrder, nodes = cls.nodes;
    const sch = DATA.meta.schooling || {};
    const ladderByDeg = {}; (sch.ladder||[]).forEach(L => ladderByDeg[L.degree] = L);

    // Cards build ONCE (indexes stay stable so snaps can animate the same tiles around).
    // Same derivation the iceberg used: HS/Cert levels list the CREDENTIAL per role;
    // AS+ levels group by DEGREE (a CNO is a JOB a Master's helps you reach, not a degree).
    if (!eduCards.length){
      const rows = {};
      DEG_ORDER.forEach((deg,t) => {
        const lvlNodes = nodes.filter(n => (DEG_LEVEL[n.degree]||0) === t);
        if (deg === 'HS' || deg === 'Cert'){
          rows[t] = lvlNodes
            .sort((a,b)=> (famOrder.indexOf(a.family)-famOrder.indexOf(b.family)) || (a.label<b.label?-1:1))
            .map(n => ({ kind:'cert', n, face:credFace(n) }));
        } else {
          const byDeg = new Map();
          lvlNodes.forEach(n => roleDegrees(n).forEach(def => {
            if (!byDeg.has(def.face)) byDeg.set(def.face, { def, roles:[] });
            byDeg.get(def.face).roles.push(n);
          }));
          rows[t] = [...byDeg.values()]
            .sort((a,b)=> (a.def.rank||0)-(b.def.rank||0) || (a.def.face<b.def.face?-1:1))
            .map(e => ({ kind:'degree', face:e.def.face, label:e.def.label, roles:e.roles, generic:!!e.def.generic }));
        }
      });
      eduCards = [];
      DEG_ORDER.forEach((deg,t) => {
        const dmeta = DATA.meta.degrees[deg] || {};
        rows[t].forEach(item => {
          if (item.kind === 'degree'){
            const jobs = item.roles.map(r=>r.label.replace(/\n/g,' ')).join(' ');
            const search = (item.face+' '+(item.label||'')+' '+(dmeta.label||deg)+' '+deg+' degree '+jobs).toLowerCase();
            eduCards.push({ kind:'degree', face:item.face, degree:deg, label:item.label, roles:item.roles, generic:!!item.generic, lvl:t, search });
          } else {
            const famLbl = (fcfg[item.n.family]||{}).label || item.n.family || '';
            const search = (item.face+' '+item.n.label.replace(/\n/g,' ')+' '+famLbl+' '+(dmeta.label||deg)+' '+deg+' '+(metaV(item.n,'Credential')||'')+' '+(metaV(item.n,'Education')||'')).toLowerCase();
            eduCards.push({ kind:'cert', face:item.face, degree:item.n.degree, role:item.n, family:item.n.family, lvl:t, search });
          }
        });
      });
      // the generic ladder tops out at a doctorate too (QA: "the Any-field lane needs the
      // Doc-level stuff") — PhD itself rides the faculty lane (its FAMILY_DEG home), so the
      // Any-field rung is the level's generic face, carrying the cross-field doctoral jobs
      const docRoles = ['research-scientist','psychologist','dean'].map(id => nodes.find(n => n.id === id)).filter(Boolean);
      if (docRoles.length) eduCards.push({ kind:'degree', face:'Doctorate', degree:'Doc', label:'Doctoral Degree (PhD / EdD / DrPH)', roles:docRoles, generic:true, lvl:5,
        search:'doctorate doctoral degree phd edd drph dha research professor any field generic' });
      // the generic ladder's lower rungs (QA: "Any-field needs AS and the general certs"):
      // an unnamed associate's, and the life-support cards nearly every clinical door asks
      // for on day one. Not tied to single jobs — they're the floor, not a destination.
      eduCards.push({ kind:'degree', face:'AS', degree:'AS', label:"Associate's Degree", roles:[], generic:true, lvl:2,
        search:'associate associates degree any field generic two year college' });
      eduCards.push({ kind:'degree', face:'BLS', degree:'Cert', label:'Basic Life Support (CPR & AED)', roles:[], lvl:1,
        search:'bls basic life support cpr aed american heart association aha first responder entry' });
      eduCards.push({ kind:'degree', face:'ACLS', degree:'Cert', label:'Advanced Cardiovascular Life Support', roles:[], lvl:1,
        search:'acls advanced cardiovascular cardiac life support aha code megacode' });
      eduCards.push({ kind:'degree', face:'Lifeguard', degree:'Cert', label:'Lifeguard Certification (Red Cross)', roles:[], lvl:1,
        search:'lifeguard red cross water safety cpr first aid summer job on ramp' });
      // specialty certifications — post-licensure boards ride a band ABOVE the degrees
      // (real jobs in some cases, pure certifications in others: CCRN, ACCS, CEN and kin)
      (DATA.meta.specialtyCerts || []).forEach(sc => {
        const search = (sc.face+' '+(sc.label||'')+' specialty board certification '+sc.family).toLowerCase();
        eduCards.push({ kind:'spec', face:sc.face, degree:'Spec', label:sc.label, family:sc.family, prereq:sc.prereq||[], lvl:7, search });
      });
      // lane + PATHWAY + color per card. Every tile wears its DISCIPLINE's color —
      // the level reads from the bands and the axis, not the paint (David's call).
      const famPathway = {}; famOrder.forEach(f => { const n0 = nodes.find(n => n.family === f); famPathway[f] = n0 ? n0.pathway : ''; });
      eduCards.forEach(c => {
        c.lane = eduLaneOf(c);
        c.pw = c.lane === '__any' ? '__any' : (famPathway[c.lane] || '');
        c.color = c.lane === '__any' ? '#9AB0BC' : ((fcfg[c.lane]||{}).color || '#4ECDC4');
      });
    }

    layoutEdu(cls);
    drawEduBoard(cls, ladderByDeg, !!animate);
    updateEduPins();
    applyEduColorMode();   // the one paint path — repaints per the current Metric (discipline or pass rate)
    if (eduMatrixSel != null && eduCards[eduMatrixSel]) edApplySel(); else eduDetailEmpty();
  }

  // ── layout: lanes by family (pathway-ordered, "Any field" last), rows by level.
  //    A snap narrows the lane set to ONE pathway — same repack the career board does.
  function layoutEdu(cls){
    const famOrder = cls.familyOrder, fcfg = cls.families, pwOrder = cls.pathwayOrder || [];
    const byLane = new Map();
    eduCards.forEach((c,i) => { if (!byLane.has(c.lane)) byLane.set(c.lane, []); byLane.get(c.lane).push(i); });
    let laneKeys = famOrder.filter(f => byLane.has(f))
      .sort((a,b) => (pwOrder.indexOf(eduCards[byLane.get(a)[0]].pw) - pwOrder.indexOf(eduCards[byLane.get(b)[0]].pw)) || (famOrder.indexOf(a) - famOrder.indexOf(b)));
    if (byLane.has('__any')) laneKeys.push('__any');
    // the SAME pathway/family filters the career board honors (shared state, shared URL params)
    laneKeys = laneKeys.filter(k => k === '__any' || (!hiddenPathways.has(eduCards[byLane.get(k)[0]].pw) && !hiddenFamilies.has(k)));
    if (edSnapLane){
      laneKeys = laneKeys.filter(k => k === '__any' || k === edSnapLane);   // QA: the generic options NEVER leave the board
      // your pinned credentials never leave either: earned/aiming cards from off-board
      // lanes gather band-true in an "On your path" lane (the AOE shelf's law)
      const mineIdx = [];
      eduCards.forEach((c,i) => {
        if (c.lane === edSnapLane || c.lane === '__any') return;
        if (build.education.some(x => x.kind === 'real' && x.label === c.face && x.degree === c.degree)
          || (c.kind === 'cert' && c.role && roleLayerInBuild(c.role.id))) mineIdx.push(i);   // a pinned ROLE carries its credential card over too
      });
      if (mineIdx.length){ byLane.set('__mine', mineIdx); laneKeys.push('__mine'); }
    }

    edPos = new Map(); edLanes = [];
    let x = 0, prevPw = null;
    laneKeys.forEach(k => {
      const idxs = byLane.get(k);
      const byLvl = {}; idxs.forEach(i => { const t = eduCards[i].lvl; (byLvl[t] = byLvl[t]||[]).push(i); });
      const width = Math.max(...Object.values(byLvl).map(a => a.length)) * ECOLW;
      const pw = k === '__mine' ? '__mine' : eduCards[idxs[0]].pw;
      if (prevPw !== null) x += (pw !== prevPw ? EPW_GAP : ELANE_GAP);
      prevPw = pw;
      const cx = x + width/2;
      Object.entries(byLvl).forEach(([t, arr]) => {
        arr.forEach((i,j) => edPos.set(i, { x: cx + (j-(arr.length-1)/2)*ECOLW, y: (+t)*EROWH }));
      });
      edLanes.push({ key:k, pathway:pw, left:x, right:x+width, cx,
        label: k === '__mine' ? 'On your path' : k === '__any' ? 'Any field' : ((fcfg[k]||{}).label || k),
        color: k === '__mine' ? '#4ECDC4' : k === '__any' ? '#9AB0BC' : ((fcfg[k]||{}).color || '#4ECDC4'),
        lvls: Object.keys(byLvl).map(Number).sort((a,b)=>a-b) });
      x += width;
    });
    edMinX = edLanes.length ? Math.min(...edLanes.map(L=>L.left)) - 70 : -70;

    // edges: within a lane, adjacent occupied levels — but only ROADS THAT EXIST. A
    // multi-discipline lane (rehab = PT/OT/SLP/AT) must not fan PTA into SLP. An edge
    // draws when: it starts at the diploma; both ends sit on the discipline's own
    // authored degree ladder (FAMILY_DEG); both are generic (the Any-field ladder);
    // or a real promotion edge connects the jobs underneath. The prose "usual road"
    // stays in the panel.
    const inFamDeg = (lane, face) => { const lv = FAMILY_DEG[lane]; return !!lv && Object.keys(lv).some(k => lv[k][0] === face); };
    const edgeReal = (s, d, lane) => {
      const cs = eduCards[s], cd = eduCards[d];
      if (cs.face === 'HS / GED') return true;
      if (inFamDeg(lane, cs.face) && inFamDeg(lane, cd.face)) return true;
      if (lane === '__any') return true;   // the Any-field lane IS the generic ladder (Bachelor's → MBA / MS / PathA…)
      const sR = cs.kind === 'cert' ? [cs.role] : cs.roles;
      const dIds = new Set((cd.kind === 'cert' ? [cd.role] : cd.roles).map(r => r.id));
      return sR.some(r => (r.leadsTo||[]).some(id => dIds.has(id)));
    };
    edEdges = [];
    edLanes.forEach(L => {
      if (L.key === '__mine') return;   // the shelf carries no roads — it's a shelf
      const perLvl = {}; byLane.get(L.key).forEach(i => { (perLvl[eduCards[i].lvl] = perLvl[eduCards[i].lvl]||[]).push(i); });
      const lvls = L.lvls.filter(t => t !== 7);   // the spec band draws NO roads — boards ride a license,
      // they aren't the next rung of a degree ladder (QA: degree→cert lines read wrong). The
      // "Rides on" prerequisites live in the detail panel instead.
      for (let a = 0; a < lvls.length-1; a++)
        perLvl[lvls[a]].forEach(s => perLvl[lvls[a+1]].forEach(d => { if (edgeReal(s, d, L.key)) edEdges.push([s, d, L.key]); }));
    });
  }

  function drawEduBoard(cls, ladderByDeg, animate){
    const svg = d3.select('#hct-edu-svg');
    let gZ = svg.select('g.ed-zoom');
    if (gZ.empty()){
      gZ = svg.append('g').attr('class','ed-zoom');
      gZ.append('g').attr('class','ed-cont'); gZ.append('g').attr('class','ed-bands');
      gZ.append('g').attr('class','ed-eds'); gZ.append('g').attr('class','ed-nds');
      svg.append('g').attr('class','ed-axis');
      svg.on('click', (e) => { if (e.defaultPrevented) return; if (!hit(e,'g.ed-node')) edClearSel(); });   // empty space releases the snap
    }
    const gC = gZ.select('g.ed-cont'), gB = gZ.select('g.ed-bands'), gE = gZ.select('g.ed-eds'), gN = gZ.select('g.ed-nds'), gAx = svg.select('g.ed-axis');
    const dur = animate ? dcap(520) : 0;
    const minX = edMinX, maxX = edLanes.length ? Math.max(...edLanes.map(L=>L.right)) + 70 : 70;
    const tiers = [...new Set(edLanes.reduce((a,L)=>a.concat(L.lvls), []))].sort((a,b)=>a-b);
    const headY = (tiers[0]||0)*EROWH - EROWH/2 - 16;
    const botY = (tiers.length ? tiers[tiers.length-1] : 0)*EROWH + EROWH/2;

    // zebra level bands + separators — the career board's classes, so theming rides along
    const bsel = gB.selectAll('g.ed-band').data(tiers, d=>d);
    const ben = bsel.enter().append('g').attr('class','ed-band');
    ben.append('rect').attr('class','hct-band-rect');
    ben.append('line').attr('class','hct-band-line');
    bsel.exit().remove();
    const ball = ben.merge(bsel);
    ball.select('rect.hct-band-rect').transition().duration(dur)
      .attr('x',minX).attr('y',d=>d*EROWH-EROWH/2).attr('width',maxX-minX).attr('height',EROWH)
      .attr('fill', d => d%2 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0)');
    ball.select('line.hct-band-line').transition().duration(dur)
      .attr('x1',minX).attr('x2',maxX).attr('y1',d=>d*EROWH-EROWH/2).attr('y2',d=>d*EROWH-EROWH/2);

    // pathway containers + headers — the career board's grammar
    const pws = cls.pathways || {}, pwGroups = [], pwSeen = {};
    edLanes.forEach(L => {
      if (pwSeen[L.pathway]) return; pwSeen[L.pathway] = true;
      const m = edLanes.filter(v => v.pathway === L.pathway);
      pwGroups.push({ pw:L.pathway, label:(L.pathway === '__mine' ? 'On your path' : L.pathway === '__any' ? 'Any field' : ((pws[L.pathway]||{}).label || L.pathway)).toUpperCase(),
        left:Math.min(...m.map(v=>v.left)), right:Math.max(...m.map(v=>v.right)) });
    });
    const csel = gC.selectAll('rect.hct-rcontainer').data(pwGroups, d=>d.pw);
    csel.exit().remove();
    csel.enter().append('rect').attr('class','hct-rcontainer').attr('rx',16)
        .attr('x',d=>d.left-36).attr('y',headY-40).attr('width',d=>d.right-d.left+72).attr('height',botY-headY+66)
      .merge(csel).transition().duration(dur)
        .attr('x',d=>d.left-36).attr('y',headY-40).attr('width',d=>d.right-d.left+72).attr('height',botY-headY+66);
    // headers double as HIDE controls (David: "sub groups that can be hidden away") —
    // click a pathway or discipline name and it leaves the board; the shared filter
    // state means the applied chip + Pathways popover + Career Matrix all agree.
    const psel = gC.selectAll('text.ed-pw-lbl').data(pwGroups, d=>d.pw);
    psel.exit().remove();
    const pen = psel.enter().append('text').attr('class','ed-pw-lbl').attr('text-anchor','middle')
        .attr('x',d=>(d.left+d.right)/2).attr('y',headY-52).text(d=>d.label)
        .style('pointer-events','auto').style('cursor','pointer');
    pen.append('title').text('Click to hide this pathway');
    pen.merge(psel).transition().duration(dur)
        .attr('x',d=>(d.left+d.right)/2).attr('y',headY-52).text(d=>d.label);
    gC.selectAll('text.ed-pw-lbl').on('click', (e,d) => {
      e.stopPropagation();
      if (d.pw === '__any' || d.pw === '__mine') return;
      hiddenPathways.add(d.pw); pathwayFamilies(d.pw).forEach(f => hiddenFamilies.add(f));
      refreshPathwayControls(); applyFilterChange();
      announce(d.label + ' hidden. The Showing chip or the Pathways filter brings it back.');
    });
    // discipline sub-containers — the career board's nested-box grammar: each lane gets its
    // own family-colored box inside the pathway container (same hct-dcontainer class, so
    // theming rides along). Box top sits just below the lane name at headY-10.
    const dbsel = gC.selectAll('rect.hct-dcontainer').data(edLanes, d=>d.key);
    dbsel.exit().remove();
    dbsel.enter().append('rect').attr('class','hct-dcontainer').attr('rx',9)
        .attr('x',d=>d.left-10).attr('y',headY-4).attr('width',d=>d.right-d.left+20).attr('height',botY-headY+16)
        .attr('stroke',d=>d.color).attr('fill',d=>d.color)
      .merge(dbsel).transition().duration(dur)
        .attr('x',d=>d.left-10).attr('y',headY-4).attr('width',d=>d.right-d.left+20).attr('height',botY-headY+16)
        .attr('stroke',d=>d.color).attr('fill',d=>d.color);

    // lane (discipline) names
    const lsel = gC.selectAll('text.ed-lane-lbl').data(edLanes, d=>d.key);
    lsel.exit().remove();
    const len2 = lsel.enter().append('text').attr('class','ed-lane-lbl').attr('text-anchor','middle')
        .attr('x',d=>d.cx).attr('y',headY-10).attr('fill',d=>d.color).text(d=>d.label)
        .style('pointer-events','auto').style('cursor','pointer');
    len2.append('title').text('Click to hide this discipline');
    len2.merge(lsel).transition().duration(dur)
        .attr('x',d=>d.cx).attr('y',headY-10);
    gC.selectAll('text.ed-lane-lbl').on('click', (e,d) => {
      e.stopPropagation();
      if (d.key === '__any' || d.key === '__mine') return;
      hiddenFamilies.add(d.key);
      refreshPathwayControls(); applyFilterChange();
      announce(d.label + ' hidden. The Showing chip or the Pathways filter brings it back.');
    });

    // ladder edges
    const esel = gE.selectAll('path.ed-edge').data(edEdges, d=>d[0]+'>'+d[1]);
    esel.exit().remove();
    esel.enter().append('path').attr('class','ed-edge')
        .attr('stroke', d => eduCards[d[1]].color)
        .attr('d', d => edEdgePath(edPos.get(d[0]), edPos.get(d[1])))
      .merge(esel).transition().duration(dur)
        .attr('d', d => edEdgePath(edPos.get(d[0]), edPos.get(d[1])));

    // credential hexes — created once for ALL cards; a snap just moves them (or fades the off-pathway ones)
    const nsel = gN.selectAll('g.ed-node').data(eduCards.map((c,i)=>i), i=>i);
    const nen = nsel.enter().append('g')
      .attr('class','ed-node').attr('data-ec', i=>i)
      .attr('transform', i => { const p = edPos.get(i) || { x:0, y:eduCards[i].lvl*EROWH }; return 'translate('+p.x.toFixed(1)+','+p.y.toFixed(1)+')'; })
      .style('cursor','pointer').on('click', (e,i) => { e.stopPropagation(); selectEduCred(i); });
    nen.append('path').attr('class','ed-back').attr('d', hexPath(0,0,ER-2));
    nen.append('path').attr('class','ed-pinring').attr('d', hexPath(0,0,ER+5));
    nen.append('path').attr('class','ed-body').attr('d', hexPath(0,0,ER-2))
      .attr('fill', i => hexA(eduCards[i].color, 0.22)).attr('stroke', i => eduCards[i].color)
      .style('stroke-dasharray', i => eduCards[i].generic ? '5 4' : (eduCards[i].kind === 'spec' ? '2 3' : null));   // fine dots = a board cert, not a degree
    nen.each(function(i){
      const c = eduCards[i], fit = eduFaceFit(c.face), g = d3.select(this);
      const baseY = -8 - (fit.lines.length-1)*fit.lh/2;
      const tx = g.append('text').attr('class','edu-hex-tx').attr('text-anchor','middle').style('font-size', fit.fs+'px');
      fit.lines.forEach((ln,j) => tx.append('tspan').attr('x',0).attr('y', (baseY + j*fit.lh + fit.fs*0.34).toFixed(1)).text(ln));
      g.append('text').attr('class','ed-sub').attr('x',0).attr('y', ER*0.5).attr('text-anchor','middle').text(edSubOf(c));
      g.append('title').text(c.kind === 'degree' ? (c.label || c.face)
        : c.kind === 'spec' ? (c.face + ' · ' + (c.label || 'board certification'))
        : (c.face + ' · ' + c.role.label.replace(/\n/g,' ')));   // spec cards have no .role — reading it threw and blanked every tile after the first
    });
    const nall = nen.merge(nsel);
    nall.classed('ed-off', i => !edPos.has(i));
    nall.filter(i => edPos.has(i)).transition().duration(dur)
      .attr('transform', i => { const p = edPos.get(i); return 'translate('+p.x.toFixed(1)+','+p.y.toFixed(1)+')'; });

    // frozen-left axis: level name + typical time (the old iceberg label boxes, distilled)
    if (gAx.select('rect.axis-bg').empty())
      gAx.append('rect').attr('class','axis-bg').attr('x',0).attr('y',-4000).attr('width',EAX_W).attr('height',9000);
    const asel = gAx.selectAll('g.ed-ax-chip').data(tiers, d=>d);
    asel.exit().remove();
    const aen = asel.enter().append('g').attr('class','ed-ax-chip').attr('transform', d=>'translate(0,'+(d*EROWH)+')');
    aen.append('text').attr('class','hct-band-txt').attr('x',EAX_W-14).attr('y',0).attr('text-anchor','end');
    aen.append('text').attr('class','ed-ax-sub').attr('x',EAX_W-14).attr('y',16).attr('text-anchor','end');
    const aall = aen.merge(asel);
    aall.transition().duration(dur).attr('transform', d=>'translate(0,'+(d*EROWH)+')');
    aall.select('text.hct-band-txt').text(d => d === 7 ? 'Specialty certs' : ((DATA.meta.degrees[DEG_ORDER[d]]||{}).label || DEG_ORDER[d]));
    aall.select('text.ed-ax-sub').text(d => d === 7 ? 'post-licensure boards' : ((ladderByDeg[DEG_ORDER[d]]||{}).time || ''));

    // camera — pan/zoom with the axis pinned to the left edge, career-style
    if (!edZoom){
      edZoom = d3.zoom().scaleExtent([0.15, 2.2]).clickDistance(6).on('zoom', e => {
        d3.select('#hct-edu-svg .ed-zoom').attr('transform', e.transform);
        const t = e.transform, fieldL = t.x + t.k*edMinX;
        d3.select('#hct-edu-svg .ed-axis').attr('transform',
          'translate(' + Math.max(0, fieldL - t.k*EAX_W) + ',' + t.y + ') scale(' + t.k + ')');
        edFar = edFar ? (t.k < 0.55) : (t.k < 0.45);   // LOD with the career board's hysteresis band; sub-lines fade via CSS
        d3.select('#hct-edu-svg').classed('ed-far', edFar);
        if (e.sourceEvent) edUserZoomed = true;
      });
      svg.call(edZoom).on('dblclick.zoom', null);
    }
    if (!edBuilt){ edBuilt = true; edFit(false); }
  }
  // snap plumbing: select → the credential's pathway owns the board; empty click → everything back
  function edApplySel(){
    const idx = eduMatrixSel, c = eduCards[idx]; if (!c) return;
    qsa(document,'#hct-edu-svg .ed-node').forEach(el => {
      const i = parseInt(el.getAttribute('data-ec'),10), cc = eduCards[i], sel = i === idx;
      el.classList.toggle('sel', sel);
      el.classList.toggle('ip', !sel && cc.lane === c.lane);
      el.classList.toggle('dim', !edFreeLook && !sel && cc.lane !== c.lane);   // free look: nothing recedes
    });
    qsa(document,'#hct-edu-svg .ed-edge').forEach((el,j) => {
      const inLane = edEdges[j] && edEdges[j][2] === c.lane;
      el.classList.toggle('ed-e-hi', inLane);
      el.classList.toggle('ed-e-lo', !edFreeLook && !inLane);
    });
  }
  function edClearSel(){
    eduMatrixSel = null;
    qsa(document,'#hct-edu-svg .ed-node').forEach(el => el.classList.remove('sel','ip','dim'));
    qsa(document,'#hct-edu-svg .ed-edge').forEach(el => el.classList.remove('ed-e-hi','ed-e-lo'));
    eduDetailEmpty();
    if (edSnapLane){ edSnapLane = null; renderEducationMatrix(true); edUserZoomed = false; edFit(true); }
  }
  function edResetSnap(){ if (edSnapLane){ edSnapLane = null; if (edBuilt) renderEducationMatrix(false); } }
  // default framing: height-fit, anchored left with the axis reserved (pan right for more lanes)
  function edFit(animate){
    const wrap = document.getElementById('hct-edu-layers');
    if (!wrap || !edZoom || !edLanes.length) return;
    const W = wrap.clientWidth, H = wrap.clientHeight; if (W < 40 || H < 40) return;
    const tiers = [...new Set(edLanes.reduce((a,L)=>a.concat(L.lvls), []))];   // VISIBLE levels (a snapped pathway may not span all seven)
    const y0 = Math.min(...tiers)*EROWH - EROWH/2 - 84, y1 = Math.max(...tiers)*EROWH + EROWH/2 + 26;
    const maxX = Math.max(...edLanes.map(L=>L.right)) + 70;
    const kH = H/(y1-y0), kW = (W - EAX_W - 20)/(maxX - edMinX);
    // unsnapped: height-fit, anchored left, pan for more. Snapped: frame the whole lane
    // (career's snap fit) and CENTER it in the leftover width instead of hugging the axis.
    const k = Math.max(0.15, Math.min(edSnapLane ? Math.min(kH, kW) : kH, 1.1));
    const tx = edSnapLane
      ? Math.max(EAX_W + 10 - k*edMinX, EAX_W + (W - EAX_W)/2 - k*(edMinX + maxX)/2)
      : (EAX_W + 10 - k*edMinX);
    const t = d3.zoomIdentity.translate(tx, (H - k*(y1-y0))/2 - k*y0).scale(k);
    const s = d3.select('#hct-edu-svg');
    (animate ? s.transition().duration(dcap(520)) : s).call(edZoom.transform, t);
  }
  function edFocusCard(i){
    const p = edPos.get(i); if (!p || !edZoom) return;
    const wrap = document.getElementById('hct-edu-layers'); if (!wrap) return;
    const W = wrap.clientWidth, H = wrap.clientHeight, k = 0.9;
    const t = d3.zoomIdentity.translate(EAX_W + (W-EAX_W)/2 - k*p.x, H/2 - k*p.y).scale(k);
    d3.select('#hct-edu-svg').transition().duration(dcap(520)).call(edZoom.transform, t);
  }
  // on-your-path rings for the Education Matrix hexes — the same solid/dashed language every map speaks
  function updateEduPins(){
    if (!edBuilt) return;
    qsa(document,'#hct-edu-svg .ed-node').forEach(el => {
      const c = eduCards[parseInt(el.getAttribute('data-ec'),10)]; if (!c) return;
      const e = build.education.find(x => x.kind==='real' && x.label===c.face && x.degree===c.degree);
      let have = !!e && nodeLayer(e) !== 'future', goal = !!e && nodeLayer(e) === 'future';
      if (!e && c.kind === 'cert' && c.role){
        // holding the JOB counts as holding its credential — a pinned CRT role rings the
        // CRT card without a separate education entry (QA: "things don't come over")
        const lay = roleLayerInBuild(c.role.id);
        if (lay){ have = lay !== 'future'; goal = lay === 'future'; }
      }
      el.classList.toggle('ec-have', have);
      el.classList.toggle('ec-goal', goal);
    });
  }

  function eduDetailEmpty(){
    const host = document.getElementById('hct-edu-detail'); if (!host) return;
    host.innerHTML = '<div class="edu-detail-empty">Click a degree to see how long it takes and the jobs it helps you get. Then add it to your Education. (The first two bands are entry credentials and certificate programs.)</div>';
  }

  // forgiving search over the Education Matrix: matches credential face, the role(s) it opens, family, degree, even
  // what someone THINKS is a degree (type "nurse" → RN/BSN/MSN; "coding" → the coder). Non-matches fade back.
  function eduFilter(q){
    if (!edBuilt) return;
    const toks = (q||'').trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (toks.length && edSnapLane){ edSnapLane = null; renderEducationMatrix(false); edUserZoomed = false; edFit(false); }   // search runs over the WHOLE board
    let total = 0;
    qsa(document,'#hct-edu-svg .ed-node').forEach(el => {
      const c = eduCards[parseInt(el.getAttribute('data-ec'),10)];
      const hit = !toks.length || (c && toks.every(t => c.search.indexOf(t) >= 0));
      el.classList.toggle('ed-hide', toks.length > 0 && !hit);
      if (toks.length){ el.classList.remove('ip','dim','sel'); }   // clean result view while searching
      if (hit) total++;
    });
    qsa(document,'#hct-edu-svg .ed-edge').forEach(el => el.classList.toggle('ed-e-search', toks.length > 0));
    const note = document.getElementById('hct-edu-searchnote');
    if (note) note.textContent = toks.length ? (total ? total+' match'+(total!==1?'es':'') : 'no matches') : '';
    if (!toks.length && eduMatrixSel != null && eduCards[eduMatrixSel]) selectEduCred(eduMatrixSel);   // restore highlight when cleared
  }

  function selectEduCred(idx){
    const c = eduCards[idx]; if (!c) return;
    eduMatrixSel = idx;
    // snap-together: this credential's DISCIPLINE owns the board (its lane + the always-on
    // Any-field lane). The Any-field lane itself never snaps (isolating the generic ladder
    // empties the room — David's QA screenshot).
    if (!edFreeLook && c.lane !== '__any' && c.lane !== edSnapLane){
      edSnapLane = c.lane;
      renderEducationMatrix(true);
      edUserZoomed = false; edFit(true);
    } else {
      edApplySel();
    }
    openEduMatrixPanel(c);
  }

  // detail panel for a clicked Education-Matrix credential (degree · time · exams · roles it opens · add to Growth)
  function openEduMatrixPanel(c){
    const host = document.getElementById('hct-edu-detail'); if (!host) return;
    const dmeta = DATA.meta.degrees[c.degree] || {}, col = c.color || dmeta.color || '#4ECDC4';
    const sch = DATA.meta.schooling || {};
    const ladder = (sch.ladder||[]).find(L => L.degree === c.degree);
    const roles = c.kind === 'degree' ? c.roles : (c.role ? [c.role] : []);
    const sec = (title, body) => '<div class="edu-d-sec"><div class="edu-d-sech">'+title+'</div>'+body+'</div>';
    let h = '<div class="edu-d-top" style="--lc:'+col+'">'+
      '<div class="edu-d-badge" style="color:'+col+';border-color:'+hexA(col,0.5)+';background:'+hexA(col,0.16)+'">'+esc(c.kind==='spec' ? 'Board cert' : c.degree)+'</div>'+
      '<div class="edu-d-ttl">'+esc(c.face)+'</div>'+
      '<div class="edu-d-sub" style="color:'+hexA(col,0.85)+'">'+esc(c.kind==='degree' ? (c.label||dmeta.label||c.degree) : c.kind==='spec' ? (c.label||'Specialty certification') : (dmeta.label||c.degree))+'</div></div>'+
      '<div class="edu-d-body">';
    if (c.kind === 'spec' && c.prereq && c.prereq.length)
      h += sec('Rides on', '<div class="edu-d-ex"><span>'+esc(c.prereq.join(' or '))+' first, then the practice hours the board asks for.</span></div>');
    if (ladder && ladder.time) h += sec('Typical time to reach', '<div class="edu-d-time">'+esc(ladder.time)+'</div>'+(ladder.note?'<div class="edu-d-ex" style="margin-top:6px">'+esc(ladder.note)+'</div>':''));
    const credReal = credStatsHTML(c.face);
    if (credReal) h += sec('The exam, in numbers', credReal);
    // credential-SPECIFIC requirement from the role's own node — NOT the level-wide exam pool (that wrongly hung NCLEX on a doula)
    if (c.kind === 'cert' && c.role){
      const cred = metaV(c.role, 'Credential'), edu = metaV(c.role, 'Education');
      if (edu) h += sec('Education / training', '<div class="edu-d-ex"><span>'+esc(edu)+'</span></div>');
      if (cred && !/^\(?none|^none\b|employer/i.test(cred)) h += sec('Credential / licensure', '<div class="edu-d-ex"><span class="edu-d-ex-dot" style="background:'+col+'"></span><span>'+esc(cred)+'</span></div>');
      const rq = c.role.req && c.role.req.items;
      if (rq && rq.length){ let r=''; rq.forEach(it => r += '<div class="edu-d-ex"><span class="edu-d-ex-dot" style="background:'+col+'"></span><span>'+esc(it)+'</span></div>'); h += sec((c.role.req.title)||'Requirements', r); }
    }
    if (roles.length){ let ch=''; roles.forEach(r => ch += '<span class="edu-d-chip" data-go="'+esc(r.id)+'">'+esc(r.label.replace(/\n/g,' '))+'</span>'); h += sec(c.kind==='degree'?('Jobs this degree helps you get · '+roles.length):'Opens this role', '<div class="edu-d-chips">'+ch+'</div>'); }
    h += '</div>';
    // the loop's next stop: expertise around the family this credential serves (authored familySuggest)
    const eduSug = ((DATA.growth && DATA.growth.familySuggest && c.family && DATA.growth.familySuggest[c.family]) || []).slice(0, 4);
    if (eduSug.length){
      const chips = eduSug.map(gid => { const gn = growthById.get(gid); if (!gn) return '';
        return '<span class="hct-chip" data-growjump="'+esc(gid)+'">'+esc(gn.label)+'</span>'; }).filter(Boolean).join('');
      if (chips) h += '<div class="edu-d-sech">The expertise around it</div><div class="hct-leads">'+chips+'</div>'
        + '<button class="hct-jump" type="button" data-goview="atlas">Explore the whole map →</button>';
    }
    // the have-it / working-toward-it pair, matrix-side — same grammar as the role panel's credential ask
    const eNode = build.education.find(e => e.kind==='real' && e.label===c.face && e.degree===c.degree);
    const eLayer = eNode ? nodeLayer(eNode) : null;
    h += '<div class="edu-d-foot"><div class="hct-add-lbl">'+(eNode ? 'On your path · tap the lit one to remove' : 'This credential · do you have it?')+'</div><div class="hct-add-pair">'
       + '<button class="edu-d-add'+(eLayer==='current'?' added':'')+'" data-el="current" style="--lc:'+col+'">'+(eLayer==='current'?'★':'☆')+' I have it</button>'
       + '<button class="edu-d-add'+(eLayer==='future'?' added':'')+'" data-el="future" style="--lc:'+col+'">'+(eLayer==='future'?'★':'☆')+' I\'m aiming for it</button>'
       + '</div></div>';
    host.innerHTML = h;
    qsa(host,'.edu-d-chip[data-go]').forEach(el => el.onclick = () => selectCareer(el.getAttribute('data-go')));
    qsa(host,'[data-el]').forEach(b => { b.onclick = () => { pinCredToLayer(c.face, c.degree, c.color, b.dataset.el); openEduMatrixPanel(c); }; });
    qsa(host,'[data-growjump]').forEach(ch => {
      ch.onclick = () => { const gn = growthById.get(ch.dataset.growjump); if (!gn) return;
        setView('atlas'); requestAnimationFrame(() => openGrowthPanel(gn)); };
    });
  }
  // Career → Education Matrix hop: land with the credential selected + the camera on it
  function jumpToEduCred(face){
    setView('edu');                       // lazy-renders the matrix; every tab action clears panels first
    requestAnimationFrame(() => {
      const idx = eduCards.findIndex(cc => cc && cc.face === face);
      if (idx < 0) return;
      selectEduCred(idx);
      edFocusCard(idx);
    });
  }
  // matrix pair for credentials: explicit layer — lit layer removes, other layer moves, unpinned adds there
  function pinCredToLayer(face, degree, col, layer){
    const e = build.education.find(x => x.kind==='real' && x.label===face && x.degree===degree);
    if (e && nodeLayer(e) === layer) build.education.splice(build.education.indexOf(e), 1);
    else if (e) e.layer = layer;
    else build.education.push({ id:newId(), kind:'real', label:face, degree, col:col||null, sub:(DATA.meta.degrees[degree]||{}).label||'', years:'', layer });
    syncPinned(); saveBuild(); renderMyPath();
  }

  // (the brand compass rose that anchored the radial atlas hub retired with the wedges —
  //  the full implementation lives in archive/career-tree-2026-07-12-radial-aoe-iceberg-edu.njk)

  // ── Areas of Expertise Matrix: ONE big honeycomb grid, zones as colored wedges around a hub (Atlas look) ──
  // ── Areas of Expertise — the career board's grammar, expertise-side. GROUP LANES
  //    ordered inside ZONE containers; DEPTH TIERS (entry / experienced / expert) are
  //    the horizontal bands. Wide lane-tier cells wrap into two hex rows. The radial
  //    atlas (wedges, territories, compass hub) is archived, not lost.
  // dense pitch (David: "too much space"), TRANSPOSED (his call): depth tiers run as
  // three COLUMNS across the top, group lanes stack DOWN the left — the board scrolls
  // vertically. Hexes near-touching, brick-staggered rows inside each cell.
  const AHR = 34, AROW_DY = 56, ACOLW = 64, ACELL_CAP = 5, AAX_W = 158, ATOP_H = 36;
  const ACOL_GAP = 44, ALANE_GAP = 10, AZONE_GAP = 56, ALANE_PAD = 30, AT_MINX = -44, AT_MINY = -60;
  const ATIER_LBL = ['Entry', 'Experienced', 'Expert'];
  let atPos = new Map(), atLanes = [], atCols = [], atBoardW = 0, atBoardH = 0;
  let atSnapGrp = null, atFreeLook = false, atActiveId = null, atUserZoomed = false, atFar = false;   // snap = the selected tile's GROUP lane (zone-grain framed all 86 skills for one click — QA)
  function layoutAtlas(){
    const g = DATA.growth;
    const byLane = new Map();   // group name → node list (group names are globally unique)
    g.zoneOrder.forEach(zk => g.nodes.forEach(n => { if (n.zone !== zk) return;
      if (!byLane.has(n.group)) byLane.set(n.group, { zone: zk, nodes: [] });
      byLane.get(n.group).nodes.push(n); }));
    let laneKeys = [...byLane.keys()];
    if (atSnapGrp){
      laneKeys = laneKeys.filter(k => k === atSnapGrp);
      // your claimed tiles never leave the room (QA): have/aiming tiles from OTHER groups
      // gather on an "On your path" shelf under the snapped group instead of parking
      const mine = new Set();
      ['skill','spec','experience','population'].forEach(tk => (build[tk]||[]).forEach(n => { if (n.atlasId) mine.add(n.atlasId); }));
      const shelf = g.nodes.filter(n => mine.has(n.id) && n.group !== atSnapGrp);
      if (shelf.length){ byLane.set('__mine', { zone:'__mine', nodes: shelf }); laneKeys.push('__mine'); }
    }
    // tier COLUMN widths: uniform across lanes so the three columns align board-wide
    const lens = { 0:1, 1:1, 2:1 };
    laneKeys.forEach(k => {
      const byTier = {}; byLane.get(k).nodes.forEach(n => { const t = n.tier||0; (byTier[t] = byTier[t]||[]).push(n); });
      Object.entries(byTier).forEach(([t, arr]) => {
        const rows = Math.ceil(arr.length / ACELL_CAP);
        lens[t] = Math.max(lens[t], Math.ceil(arr.length / rows) + (rows > 1 ? 0.5 : 0));
      });
    });
    let cx0 = 0;
    atCols = [0,1,2].map(t => { const w = lens[t]*ACOLW; const c = { t, left:cx0, width:w, cx:cx0+w/2 }; cx0 += w + ACOL_GAP; return c; });
    atBoardW = cx0 - ACOL_GAP;
    // lanes stack DOWN; a lane's height fits its tallest tier cell
    atPos = new Map(); atLanes = [];
    let y = 0, prevZone = null;
    laneKeys.forEach(k => {
      const L = byLane.get(k), zn = g.zones[L.zone] || {};
      const byTier = {}; L.nodes.forEach(n => { const t = n.tier||0; (byTier[t] = byTier[t]||[]).push(n); });
      const rowsLane = Math.max(1, ...Object.values(byTier).map(a => Math.ceil(a.length / ACELL_CAP)));
      const laneH = (rowsLane-1)*AROW_DY + 2*AHR + ALANE_PAD;
      y += (prevZone === null || L.zone !== prevZone) ? AZONE_GAP : ALANE_GAP;
      prevZone = L.zone;
      const cy = y + laneH/2;
      Object.entries(byTier).forEach(([t, arr]) => {
        arr.sort((a,b) => a.label < b.label ? -1 : 1);
        const rows = Math.ceil(arr.length / ACELL_CAP), len = Math.ceil(arr.length / rows);
        const col = atCols[+t];
        arr.forEach((n,i) => {
          const r = Math.floor(i/len), j = i % len;
          const brick = rows > 1 ? ((r % 2 ? ACOLW/2 : 0) - ACOLW/4) : 0;   // half-pitch stagger = honeycomb tuck
          // rows share ONE column grid (no per-row centering) — re-centering a short last
          // row would land tiles dead above their neighbors' points
          atPos.set(n.id, { x: col.cx + (j-(len-1)/2)*ACOLW + brick, y: cy + (r-(rows-1)/2)*AROW_DY });
        });
      });
      atLanes.push({ key:k, zone:L.zone, top:y, bottom:y+laneH, cy, label: k === '__mine' ? 'On your path' : k, color: zn.color || '#5AC8BE', i: atLanes.length });
      y += laneH;
    });
    atBoardH = y;
  }
  function renderGrowthAtlas(animate){
    const g = DATA.growth; if (!g) return;
    growthById = new Map(); g.nodes.forEach(n => growthById.set(n.id, n));
    layoutAtlas();
    const svgSel = d3.select('#hct-atlas-svg');
    if (svgSel.select('g.atlas-zoom').empty()){
      gAtlasZoom = svgSel.append('g').attr('class','atlas-zoom');
      gAtlasZoom.append('g').attr('class','at-cont'); gAtlasZoom.append('g').attr('class','at-bands'); gAtlasZoom.append('g').attr('class','at-nds');
      svgSel.append('g').attr('class','at-axis');
      svgSel.append('g').attr('class','at-topax');
      svgSel.on('click', (e) => { if (e.defaultPrevented) return; if (!hit(e,'g.atlas-node')) atClearFocus(); });
    }
    const gC = gAtlasZoom.select('g.at-cont'), gB = gAtlasZoom.select('g.at-bands'), gN = gAtlasZoom.select('g.at-nds');
    const gAx = svgSel.select('g.at-axis'), gTx = svgSel.select('g.at-topax');
    const dur = animate ? dcap(520) : 0;
    const botY = atBoardH + 16;

    // tier COLUMNS — vertical zebra + separators (the career band classes, so theming rides along)
    const bsel = gB.selectAll('g.at-band').data(atCols, d=>d.t);
    const ben = bsel.enter().append('g').attr('class','at-band');
    ben.append('rect').attr('class','hct-band-rect');
    ben.append('line').attr('class','hct-band-line');
    const ball = ben.merge(bsel);
    ball.select('rect.hct-band-rect').transition().duration(dur)
      .attr('x',d=>d.left - ACOL_GAP/2).attr('y',AT_MINY).attr('width',d=>d.width + ACOL_GAP).attr('height',botY - AT_MINY)
      .attr('fill', d => d.t%2 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0)');
    ball.select('line.hct-band-line').transition().duration(dur)
      .attr('x1',d=>d.left - ACOL_GAP/2).attr('x2',d=>d.left - ACOL_GAP/2).attr('y1',AT_MINY).attr('y2',botY);

    // zone containers span all three columns; the zone names itself in its top gap
    const zoneGroups = [], zSeen = {};
    atLanes.forEach(L => { if (zSeen[L.zone]) return; zSeen[L.zone] = 1;
      const m = atLanes.filter(v => v.zone === L.zone);
      zoneGroups.push({ zone:L.zone, label:(L.zone === '__mine' ? 'On your path' : ((g.zones[L.zone]||{}).label || L.zone)).toUpperCase(), color:(g.zones[L.zone]||{}).color || '#5AC8BE',
        top:Math.min(...m.map(v=>v.top)), bottom:Math.max(...m.map(v=>v.bottom)) }); });
    const csel = gC.selectAll('rect.hct-rcontainer').data(zoneGroups, d=>d.zone);
    csel.exit().remove();
    csel.enter().append('rect').attr('class','hct-rcontainer').attr('rx',16)
        .attr('x',-30).attr('y',d=>d.top-12).attr('width',atBoardW+60).attr('height',d=>d.bottom-d.top+24)
      .merge(csel).transition().duration(dur)
        .attr('x',-30).attr('y',d=>d.top-12).attr('width',atBoardW+60).attr('height',d=>d.bottom-d.top+24);
    const zsel = gC.selectAll('text.atlas-zone-lbl').data(zoneGroups, d=>d.zone);
    zsel.exit().remove();
    zsel.enter().append('text').attr('class','atlas-zone-lbl').attr('text-anchor','middle')
        .attr('x',atBoardW/2).attr('y',d=>d.top-24).attr('fill',d=>d.color).text(d=>d.label)
      .merge(zsel).transition().duration(dur)
        .attr('x',atBoardW/2).attr('y',d=>d.top-24);

    // tiles — created once for ALL nodes; a snap just moves them (or parks the off-zone ones)
    const nsel = gN.selectAll('g.atlas-node').data(g.nodes, n=>n.id);
    const nen = nsel.enter().append('g')
      .attr('class', n => 'atlas-node'+(atlasSel.has(n.id)?' atlas-sel':''))
      .attr('data-id', n=>n.id).attr('data-grp', n=>n.group||'')
      .attr('data-search', n => (n.label+' '+n.abbr+' '+(n.group||'')+' '+(g.zones[n.zone]?g.zones[n.zone].label:'')+' '+(n.summary||'')+' '+(n.seen||'')).toLowerCase())
      .attr('transform', n => { const p = atPos.get(n.id) || { x: 0, y: 0 }; return 'translate('+p.x.toFixed(1)+','+p.y.toFixed(1)+')'; })
      .style('cursor','pointer').on('click', (e,n) => { e.stopPropagation(); if (atlasMultiMode) toggleAtlasSel(n.id, e.currentTarget); else openGrowthPanel(n); });
    nen.append('path').attr('class','atlas-node-back').attr('d', hexPath(0,0,AHR));
    nen.append('path').attr('class','atlas-hex').attr('d', hexPath(0,0,AHR))
      .attr('fill', n => (g.zones[n.zone]||{}).color || '#5AC8BE').attr('fill-opacity', 0.20)
      .attr('stroke', n => (g.zones[n.zone]||{}).color || '#5AC8BE').attr('stroke-width', 1.4).attr('stroke-opacity', 0.9);
    nen.append('text').attr('class','atlas-abbr').attr('text-anchor','middle').attr('y', -1)
      .attr('font-size', n => n.abbr.length>4 ? 9.5 : 12).attr('font-weight', 800).text(n => n.abbr);
    nen.append('text').attr('class','at-sub').attr('x',0).attr('y', AHR*0.5).attr('text-anchor','middle')
      .text(n => wrapLabel(n.label.replace(/\n/g,' '), 12)[0] || '');
    nen.each(function(n){
      const chk = d3.select(this).append('g').attr('class','atlas-check');   // ✓ badge shown when multi-selected
      chk.append('circle').attr('cx', AHR*0.6).attr('cy', -AHR*0.6).attr('r', 8);
      chk.append('text').attr('x', AHR*0.6).attr('y', -AHR*0.6+3.6).attr('text-anchor','middle').text('✓');
    });
    nen.append('path').attr('class','atlas-inst-ring').attr('d', hexPath(0,0,AHR+3));   // on-your-path ring (solid = have, dashed = aiming)
    nen.append('title').text(n => n.label + (n.group ? ' · ' + n.group : ''));
    const nall = nen.merge(nsel);
    nall.classed('at-off', n => !atPos.has(n.id));
    nall.filter(n => atPos.has(n.id)).transition().duration(dur)
      .attr('transform', n => { const p = atPos.get(n.id); return 'translate('+p.x.toFixed(1)+','+p.y.toFixed(1)+')'; });

    // frozen-left axis: the GROUP names ride beside their lanes — the skills down the side
    if (gAx.select('rect.axis-bg').empty())
      gAx.append('rect').attr('class','axis-bg').attr('x',0).attr('y',-4000).attr('width',AAX_W).attr('height',14000);
    const asel = gAx.selectAll('text.ed-lane-lbl').data(atLanes, d=>d.key);
    asel.exit().remove();
    asel.enter().append('text').attr('class','ed-lane-lbl').attr('text-anchor','end')
        .attr('x',AAX_W-14).attr('y',d=>d.cy+4).attr('fill',d=>d.color).text(d=>d.label)
      .merge(asel).transition().duration(dur).attr('y',d=>d.cy+4);
    // pinned TOP strip: Entry / Experienced / Expert over their columns
    if (gTx.select('rect.top-frozen-bg').empty())
      gTx.append('rect').attr('class','top-frozen-bg');
    gTx.select('rect.top-frozen-bg').attr('x',-400).attr('y',-ATOP_H).attr('width',atBoardW+800).attr('height',ATOP_H);
    const tsel = gTx.selectAll('text.hct-band-txt').data(atCols, d=>d.t);
    tsel.enter().append('text').attr('class','hct-band-txt').attr('text-anchor','middle')
        .attr('x',d=>d.cx).attr('y',-12).text(d=>ATIER_LBL[d.t])
      .merge(tsel).transition().duration(dur).attr('x',d=>d.cx);

    // camera — group axis pins left, tier strip pins top; plain wheel SCROLLS (Ctrl+wheel zooms)
    if (!atlasZoom){
      atlasZoom = d3.zoom().scaleExtent([0.15, 2.4]).clickDistance(6)   // a few px of hand-drift is still a CLICK — default 0 swallowed click-off after any micro-drag
        .filter(e => e.type === 'wheel' ? e.ctrlKey : (!e.ctrlKey && !e.button))
        .on('zoom', e => {
          gAtlasZoom.attr('transform', e.transform);
          const t = e.transform;
          d3.select('#hct-atlas-svg .at-axis').attr('transform',
            'translate(' + Math.max(0, (t.x + t.k*AT_MINX) - t.k*AAX_W) + ',' + t.y + ') scale(' + t.k + ')');
          d3.select('#hct-atlas-svg .at-topax').attr('transform',
            'translate(' + t.x + ',' + Math.max(t.k*ATOP_H, t.y + t.k*AT_MINY) + ') scale(' + t.k + ')');   // strip content lives at y∈[-ATOP_H,0], so its BOTTOM rides this y — pinning keeps it fully on-screen
          atFar = atFar ? (t.k < 0.55) : (t.k < 0.45);   // LOD with the career board's hysteresis band; sub-lines fade via CSS
          d3.select('#hct-atlas-svg').classed('ed-far', atFar);
          if (e.sourceEvent) atUserZoomed = true;
        })
        // canvas gestures declutter (HU-UI-GRAMMAR rule 2): while the hand owns the
        // camera, the floating HUD steps aside — user gestures only, not camera fits
        .on('start.chrome', e => { if (e.sourceEvent){ const b = document.getElementById('hct-atlas-board'); if (b) b.classList.add('gesturing'); } })
        .on('end.chrome', () => { const b = document.getElementById('hct-atlas-board'); if (b) b.classList.remove('gesturing'); });
      svgSel.call(atlasZoom).on('dblclick.zoom', null)
        .on('wheel.atscroll', (ev) => { if (ev.ctrlKey) return; ev.preventDefault();
          atUserZoomed = true;
          svgSel.interrupt();   // the wheel owns the camera NOW — kill any in-flight fit tween, or its ticks keep dragging the view back toward the fit target
          const t = d3.zoomTransform(svgSel.node());
          svgSel.call(atlasZoom.translateBy, -(ev.deltaX||0)/t.k, -ev.deltaY/t.k); })
        .on('mousedown.cur', () => { svgSel.interrupt(); svgSel.classed('grabbing', true); })   // same law for drag-pan (tile layout tweens live on child groups and finish untouched)
        .on('mouseup.cur',   () => svgSel.classed('grabbing', false));
    }
    if (!atlasBuilt){ atlasBuilt = true; fitAtlas(); }
    updateAtlasHud();
    const aS = asInput(document.getElementById('hct-atlas-search')); if (aS && aS.value) atlasFilter(aS.value);   // keep an active search highlighted after a rebuild
  }
  // selection focus: the tile lights, its GROUP stays close, its ZONE owns the board (career's snap)
  function atApplyFocus(){
    const n = atActiveId && growthById.get(atActiveId);
    qsa(document,'#hct-atlas-svg .atlas-node').forEach(el => {
      const id = el.getAttribute('data-id'), grp = el.getAttribute('data-grp');
      el.classList.toggle('at-active', !!n && id === atActiveId);
      el.classList.toggle('dim', !!n && !atFreeLook && grp !== n.group && !el.classList.contains('installed-cur') && !el.classList.contains('installed-fut'));
    });
  }
  function atClearFocus(){
    atActiveId = null;
    qsa(document,'#hct-atlas-svg .atlas-node').forEach(el => el.classList.remove('at-active','dim'));
    closePanel();   // BEFORE the refit — the fit measures the panel's width and it's leaving
    if (atSnapGrp){ atSnapGrp = null; renderGrowthAtlas(true); atUserZoomed = false; fitAtlas(true); }
  }
  function atResetSnap(){ if (atSnapGrp){ atSnapGrp = null; if (atlasBuilt) renderGrowthAtlas(false); } atActiveId = null; }

  // ── the lens: the survey's "what pulls you," held as a focus state on the expertise
  //    map. A rule at GROUP altitude plus a few cross-group tiles — never per-tile
  //    authoring (the doors are a rule). Your installed tiles NEVER dim: same law as
  //    the matrix, your own pins are never filtered off your own map.
  const LENS_DEF = {
    patients: { label:'Patient care',   groups:['Clinical care','Communication','Critical care','Acute & procedural','Medical specialties','Maternal & child','Community & other','Setting','Context & acuity','Patient types','Acuity & journey','Maternal journey','Newborn journey','Social context','Chronic disease journeys','Rehab & movement','Nutrition & dietetics'], ids:[] },
    data:     { label:'Informatics', groups:['Informatics','Research & Evidence'], ids:['digital','payer-um','lis'] },
    ops:      { label:'Operations',  groups:['Leadership','Communication','Community & other','Care models & systems','Regulatory & accreditation'], ids:['charge','magnet'] },
    hands:    { label:'Diagnostics', groups:['Clinical care','Diagnostics','Critical care','Acute & procedural','Imaging & radiation','Laboratory bench','Pharmacy practice','Surgical & procedural','EMS & field','Imaging modalities','Rehab & movement'], ids:['flight','rapid','trauma'] }
  };
  let atlasLens = null;
  function lensMembers(){
    const d = atlasLens && LENS_DEF[atlasLens];
    if (!d || !DATA || !DATA.growth) return null;
    const set = new Set();
    DATA.growth.nodes.forEach(n => { if (d.groups.indexOf(n.group) >= 0 || d.ids.indexOf(n.id) >= 0) set.add(n.id); });
    return set;
  }
  function applyAtlasLens(){
    qsa(document,'#hct-atlas-lens [data-lens]').forEach(b => {
      const on = b.dataset.lens === atlasLens;
      b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on));
    });
    const svg = document.getElementById('hct-atlas-svg'); if (!svg) return;
    const mem = lensMembers();
    qsa(svg,'.atlas-node').forEach(el => el.classList.toggle('atlas-lensdim',
      !!mem && !mem.has(el.getAttribute('data-id')) && !el.classList.contains('installed-cur') && !el.classList.contains('installed-fut')));
  }

  // ── "what you've installed": rings on claimed tiles (solid = have, dashed = aiming)
  //    + the 4-zone tally boxes. White rings — gold belongs to the Specializations zone.
  function updateAtlasHud(){
    if (!DATA || !DATA.growth) return;
    const haveCur = new Set(), haveFut = new Set();
    TRACKS.forEach(t => (build[t.key]||[]).forEach(x => { if (x.atlasId) (nodeLayer(x) === 'future' ? haveFut : haveCur).add(x.atlasId); }));
    if (atlasBuilt) d3.selectAll('#hct-atlas-svg .atlas-node')
      .classed('installed-cur', function(){ return haveCur.has(this.getAttribute('data-id')); })
      .classed('installed-fut', function(){ const id = this.getAttribute('data-id'); return haveFut.has(id) && !haveCur.has(id); });
    const host = document.getElementById('hct-atlas-hud'); if (!host) return;
    host.innerHTML = DATA.growth.zoneOrder.map(zk => {
      const z = DATA.growth.zones[zk] || {};
      let total = 0, cur = 0, fut = 0;
      DATA.growth.nodes.forEach(n => { if (n.zone === zk){ total++; if (haveCur.has(n.id)) cur++; else if (haveFut.has(n.id)) fut++; } });
      return '<div class="ah-box" style="--zc:'+esc(z.color||'#5AC8BE')+'"><span class="ah-n">'+cur+(fut?'<i class="ah-g">+'+fut+'</i>':'')+'</span><span class="ah-w"><span class="ah-lbl">'+esc(z.label||zk)+'</span><span class="ah-t">of '+total+' on your path</span></span></div>';
    }).join('') + '<button class="ah-back" type="button" data-goview="path">Back to your sheet →</button>';
    applyAtlasLens();   // installed classes just changed; the never-dim-your-own-tiles rule re-reads them
  }
  // default framing: WIDTH-fit, anchored top — the board reads downward, wheel scrolls.
  // Snapped: the zone also fits its height so it frames whole. An open detail panel
  // gives up its width (the career board's rule), and a capped fit CENTERS the board
  // in the leftover space instead of stranding a dead right margin on wide monitors.
  function fitAtlas(animate){
    const wrap = document.getElementById('hct-atlas-board');
    if (!wrap || !atlasZoom || !atLanes.length) return;
    const W = wrap.clientWidth, H = wrap.clientHeight; if (W < 40 || H < 40) return;
    const panel = document.querySelector('#hct-panel.open');
    const pw = panel ? Math.min(panel.getBoundingClientRect().width, W*0.45) : 0;
    const availW = W - pw - AAX_W - 24, bw = atBoardW - AT_MINX + 60;
    const kW = availW/bw;
    const k = Math.max(0.15, Math.min(atSnapGrp ? Math.min(kW, (H - ATOP_H - 20)/(atBoardH - AT_MINY + 40)) : kW, 1.2));
    const tx = AAX_W + 12 - k*AT_MINX + Math.max(0, (availW - k*bw)/2);
    const t = d3.zoomIdentity.translate(tx, ATOP_H + 10 - k*AT_MINY).scale(k);
    const s = d3.select('#hct-atlas-svg');
    (animate ? s.transition().duration(dcap(520)) : s).call(atlasZoom.transform, t);
  }
  function atlasZoomBy(f){ const s = d3.select('#hct-atlas-svg'); if (atlasZoom && s.node()) s.transition().duration(dcap(180)).call(atlasZoom.scaleBy, f); }

  // forgiving search over the Areas of Expertise hexes: matches the label, abbr, group, zone, summary, and "where you'll
  // find it" (so "vent"→Ventilator/Pulmonology, "icu"→all the ICUs, "epic"→Epic build). Matches glow; the rest fade.
  function atlasFilter(q){
    const svg = document.getElementById('hct-atlas-svg'); if (!svg) return;
    const toks = (q||'').trim().toLowerCase().split(/\s+/).filter(Boolean);
    let total = 0;
    qsa(svg,'.atlas-node').forEach(el => {
      const s = el.getAttribute('data-search') || '';
      const hit = toks.length > 0 && toks.every(t => s.indexOf(t) >= 0);   // AND match — every word must be present
      el.classList.toggle('atlas-hit', hit);
      el.classList.toggle('atlas-dim', toks.length > 0 && !hit);
      if (hit) total++;
    });
    const note = document.getElementById('hct-atlas-searchnote');
    if (note) note.textContent = toks.length ? (total ? total+' match'+(total!==1?'es':'') : 'no matches') : '';
  }

  // ── Areas of Expertise multi-select: check several hexes, add them all to My Path at once ──
  function setAtlasMultiMode(on){
    atlasMultiMode = on;
    const btn = document.getElementById('hct-atlas-multi'); if (btn) btn.classList.toggle('on', on);
    const bar = document.getElementById('hct-atlas-selbar'); if (bar) bar.classList.toggle('on', on);
    if (!on) atlasClearSel();              // leaving select mode clears the checks
    else { closePanel(); atActiveId = null;   // entering: drop any open detail + single-select focus so the board is clean to pick from
      qsa(document,'#hct-atlas-svg .atlas-node').forEach(el => el.classList.remove('at-active','dim'));
      updateAtlasSelBar(); }
  }
  function toggleAtlasSel(id, el){
    if (atlasSel.has(id)){ atlasSel.delete(id); if (el) el.classList.remove('atlas-sel'); }
    else { atlasSel.add(id); if (el) el.classList.add('atlas-sel'); }
    updateAtlasSelBar();
  }
  function atlasSelectShown(){   // select every hex currently visible (i.e. the search matches, or all when no search)
    const svg = document.getElementById('hct-atlas-svg'); if (!svg) return;
    qsa(svg,'.atlas-node:not(.atlas-dim):not(.atlas-lensdim):not(.at-off)').forEach(el => { const id = el.getAttribute('data-id'); if (id){ atlasSel.add(id); el.classList.add('atlas-sel'); } });
    updateAtlasSelBar();
  }
  function atlasClearSel(){
    atlasSel.clear();
    const svg = document.getElementById('hct-atlas-svg'); if (svg) qsa(svg,'.atlas-node.atlas-sel').forEach(el => el.classList.remove('atlas-sel'));
    updateAtlasSelBar();
  }
  function updateAtlasSelBar(){
    const c = document.getElementById('hct-atlas-selcount'); if (c) c.textContent = atlasSel.size + ' selected';
    const add = asInput(document.getElementById('hct-atlas-seladd')); if (add) add.disabled = atlasSel.size === 0;
  }
  function atlasAddSelected(){
    if (!atlasSel.size) return;
    let added = 0;
    atlasSel.forEach(id => {
      const n = growthById.get(id); if (!n) return;
      const z = DATA.growth.zones[n.zone], list = build[z.track];
      if (list.some(s => s.atlasId === n.id)) return;   // already on the path, skip
      list.push({ id:newId(), atlasId:n.id, name:n.label, abbr:n.abbr, zcol:z.color, years:'', layer:activeLayer() });
      added++;
    });
    saveBuild(); renderMyPath();
    atlasClearSel();
    const c = document.getElementById('hct-atlas-selcount'); if (c) c.textContent = added ? ('added '+added+' to My Path') : 'already on your path';
  }

  // detail panel for an Areas of Expertise Matrix node + add to the matching My Path track
  function openGrowthPanel(n){
    if (curView === 'atlas' && atlasBuilt){        // board-side select: focus the tile, snap to its GROUP lane (career grammar, edu's lane grain)
      atActiveId = n.id;
      if (!atFreeLook && n.group !== atSnapGrp){ atSnapGrp = n.group; renderGrowthAtlas(true); atUserZoomed = false;
        requestAnimationFrame(() => fitAtlas(true)); }   // after this call finishes opening the panel, so the fit sees its width
      atApplyFocus();
    }
    const z = DATA.growth.zones[n.zone], col = z.color;
    asEl(document.querySelector('#hct-p-badge .hct-p-dot')).style.background = col;
    document.querySelector('#hct-p-badge .lbl').textContent = z.label + ' · ' + n.group;
    asEl(document.querySelector('#hct-p-badge')).style.background = hexA(col, 0.14);
    asEl(document.querySelector('#hct-p-badge')).style.color = col;
    document.getElementById('hct-p-title').textContent = n.label;
    document.getElementById('hct-p-abbr').textContent = n.abbr;
    let h = '<p class="hct-p-summary">'+esc(n.summary||'')+'</p>';
    if (n.seen) h += '<div class="hct-list-h">Where you\'ll find it</div><p class="hct-p-summary" style="margin:-4px 0 14px">'+esc(n.seen)+'</p>';
    const det = growthDetail[n.id];
    if (det && det.how) h += '<div class="hct-list-h">How to build it</div><p class="hct-p-summary" style="margin:-4px 0 14px">'+esc(det.how)+'</p>';
    if (det && det.show) h += '<div class="hct-list-h">How you show it</div><p class="hct-p-summary" style="margin:-4px 0 14px">'+esc(det.show)+'</p>';
    const pairs = (n.pairs||[]).map(id => growthById.get(id)).filter(Boolean);   // related areas of expertise → jump to them
    if (pairs.length){
      h += '<div class="hct-list-h">Pairs with</div><div class="hct-leads">';
      pairs.forEach(p => h += '<span class="hct-chip" data-grow="'+esc(p.id)+'">'+esc(p.abbr)+' · '+esc(p.label)+'</span>');
      h += '</div>';
    }
    // the same ask-at-the-moment-of-adding pair the career panel uses — have it, or building toward it?
    const gItem = (build[z.track]||[]).find(s => s.atlasId === n.id);
    const gLayer = gItem ? nodeLayer(gItem) : null;
    h += '<div class="hct-add-lbl">'+(gItem ? 'This area is on your path · tap the lit one to remove' : 'This area · where does it fit?')+'</div>';
    h += '<div class="hct-add-pair">'
       + '<button class="hct-pin-btn'+(gLayer==='current'?' pinned':'')+'" data-gp-layer="current">'+(gLayer==='current'?'★':'☆')+' I have this</button>'
       + '<button class="hct-pin-btn'+(gLayer==='future'?' pinned':'')+'" data-gp-layer="future">'+(gLayer==='future'?'★':'☆')+' I\'m aiming for it</button>'
       + '</div>';
    document.getElementById('hct-p-body').innerHTML = h;
    const panel = document.getElementById('hct-panel'); dockPanel(); panel.classList.add('open'); panel.dataset.owner = 'atlas'; panelOpened();
    qsa(document,'#hct-p-body [data-gp-layer]').forEach(b => { b.onclick = () => pinGrowthToLayer(n, b.dataset.gpLayer); });
    qsa(panel,'.hct-chip[data-grow]').forEach(ch => ch.onclick = () => { const gn = growthById.get(ch.getAttribute('data-grow')); if (gn) openGrowthPanel(gn); });
  }
  // panel pair for expertise: explicit layer — lit layer removes, other layer moves, unpinned adds there
  function pinGrowthToLayer(n, layer){
    const z = DATA.growth.zones[n.zone], list = build[z.track]; if (!list) return;
    const item = list.find(s => s.atlasId === n.id);
    if (item && nodeLayer(item) === layer) list.splice(list.indexOf(item), 1);
    else if (item) item.layer = layer;
    else list.push({ id:newId(), atlasId:n.id, name:n.label, abbr:n.abbr, zcol:z.color, years:'', layer });
    saveBuild(); renderMyPath();
    if (curView === 'atlas') openGrowthPanel(n);   // refresh the pair's lit state on the matrix
  }
  function toggleGrowthNode(n){
    const z = DATA.growth.zones[n.zone], list = build[z.track];
    const i = list.findIndex(s => s.atlasId === n.id);
    if (i >= 0) list.splice(i,1);
    else list.push({ id:newId(), atlasId:n.id, name:n.label, abbr:n.abbr, zcol:z.color, years:'', layer:activeLayer() });
    saveBuild(); renderMyPath();
    if (curView === 'atlas') openGrowthPanel(n);   // refresh the panel's add/remove state only on the matrix — don't flash it onto My Path
  }

  // education is roles-only; reflect the current class across the rail + career view title
  function updateClassChrome(){
    const isRoles = curClass === 'roles';
    // Education tab + pathway filters are roles-only
    const eduTab = document.getElementById('hct-tab-edu');
    if (eduTab) eduTab.style.display = isRoles ? '' : 'none';
    const pathsWrap = document.getElementById('hct-paths-wrap');
    if (pathsWrap) pathsWrap.style.display = isRoles ? '' : 'none';
    const sep = document.getElementById('hct-paths-sep');
    if (sep) sep.style.display = isRoles ? '' : 'none';
    // BLS heatmap coloring is roles-only (no patient wage data) — hide the control and reset for Patients
    const cmodeWrap = document.getElementById('hct-cmode-wrap');
    const cmodeSep = document.getElementById('hct-cmode-sep');
    if (cmodeWrap) cmodeWrap.style.display = isRoles ? '' : 'none';
    if (cmodeSep) cmodeSep.style.display = isRoles ? '' : 'none';
    if (!isRoles && colorMode !== 'fam') setColorMode('fam');
    if (!isRoles && curView === 'edu') setView('career');
  }

  // ── Fit / zoom ─────────────────────────────────────────
  // Blueprint limits: the full vertical extent (headers → bottom) always fits, so the column headers and the frozen
  // left axis stay visible; min zoom = fit-height (can't zoom out past it), and pan is clamped to the content.
  function applyNavLimits(){
    if (!zoom) return;
    const el = document.getElementById('hct-board');
    const bh = el ? el.clientHeight : 0;
    if (bh < 80 || navBotY <= navTopY) return;
    const kFit = (bh - 22) / (navBotY - navTopY);
    // PHONE ZOOM FLOOR: a hex (2R board units across corners) never renders below a 44px tap
    // target. fitToBounds clamps its k to this same extent, so fits and fingers agree — on a
    // short board the default framing simply lands closer in. Desktop keeps fit-height.
    const kMin = isPhone() ? Math.max(kFit, 44/(R*2)) : kFit;
    zoom.scaleExtent([kMin, Math.max(kFit * 2.4, kMin * 2.4, 1.4)]);     // floor … detail; the ABSOLUTE 1.4 keeps zoom-in alive even when an open card shrinks kFit (his "cannot zoom in here")
    // the floating card covers the board's right edge but d3's clamp measures the FULL
    // viewport — without extra pan room the content under the card can NEVER be dragged into
    // the clear (his "cannot scroll all the way over"; fits looked fine because programmatic
    // transforms skip the constraint, then the first drag yanked the view back)
    let padR = 110;
    if (DECKS && collapsedFams && !isPhone()){
      const p = document.getElementById('hct-panel');
      if (p && p.classList.contains('open') && p.dataset.owner === 'career')
        padR += (p.getBoundingClientRect().width + 20) / Math.max(kMin, 0.05);
    }
    zoom.translateExtent([[navMinX - 322, navTopY - 24], [navMaxX + padR, navBotY + 24]]);   // -322 reserves the frozen axis on the left
  }
  // vertical framing for every fit: headers at the top, content bottom at the base (falls back before first render)
  function navY(){ return (navBotY > navTopY) ? [navTopY, navBotY] : (() => { const ys=[...posMap.values()].map(p=>p.y); return [ (ys.length?Math.min(...ys):0)-150, (ys.length?Math.max(...ys):0)+50 ]; })(); }
  // clip the content/axis to start just below the pinned header band (screen-space rect, follows zoom)
  // header type never renders below a readable floor: the band scales with zoom, so at low k
  // the labels grow in board units to hold a constant screen size (they used to vanish at fit zooms)
  let headTypeSig = '';   // last applied header-size trio: zoom ticks skip the write when nothing changed
  let lastZoneScale = 1;  // zone labels' counter-scale (fresh labels join at this so they never wait for a zoom tick)
  function syncHeadType(k, force){
    k = k || 1;
    if (!gHeaders) return;
    // quantized to whole px so a write only lands when a size actually changes. The old
    // per-tick fractional writes made the pinned headers swim against the tiles while zooming.
    const p = Math.max(15, Math.round(13/k)), f = Math.max(11, Math.round(10/k)), r = Math.max(16, Math.round(12/k));
    // zone labels live in CONTENT space (fixed to their boxes) but stay readable at far zoom:
    // a quantized counter-scale floor holds them near 11px on screen (capped at 2x so a label
    // can never balloon into the pinned region row), same write-cache discipline
    const zs = Math.min(2, Math.max(1, Math.round((0.8 / k) * 20) / 20));
    const sig = p + '|' + f + '|' + r + '|' + zs;
    if (!force && sig === headTypeSig) return;
    headTypeSig = sig;
    gHeaders.selectAll('.hct-phead-txt').style('font-size', p + 'px');
    gHeaders.selectAll('.hct-fhead').style('font-size', f + 'px');
    gHeaders.selectAll('.hct-region-lbl').style('font-size', r + 'px');
    lastZoneScale = zs;
    syncZoneLabels();
    syncBoxLabels(k);
  }
  // family box labels stay READABLE at any zoom: the font scales up as k falls (zone-label
  // discipline) and the fit ladder re-runs against the scaled width — full name in the band ->
  // first word -> floated above the box. At the all-open fit the old fixed 13px rendered ~4px
  // (his "does not show the groupings namings").
  function fitBoxLabel(el, k){
    const s = Math.min(2.2, Math.max(1, Math.round((0.8 / (k || 1)) * 20) / 20));
    let wf = +el.dataset.wf || 0, w1 = +el.dataset.w1 || 0;
    if (!wf){   // measure once at the base font (re-measured lazily if the tab was hidden)
      el.style.fontSize = '13px';
      el.textContent = el.dataset.full || ''; wf = el.getComputedTextLength();
      el.textContent = el.dataset.first || ''; w1 = el.getComputedTextLength();
      if (wf){ el.dataset.wf = wf; el.dataset.w1 = w1; }
    }
    const sig = s + '|' + (el.dataset.max || '');
    if (el.dataset.fitsig === sig) return;
    el.dataset.fitsig = sig;
    el.style.fontSize = (13 * s) + 'px';
    const max = +el.dataset.max || 0, lane = +el.dataset.lane || 0;
    let y = +el.dataset.bandy || 0, txt = el.dataset.full || '';
    if (wf * s > max){
      txt = el.dataset.first || '';
      if (w1 * s > max){
        y = (+el.dataset.boxtop || 0) - 6;   // float above the box in open canvas
        txt = (wf * s > lane + 60) ? (el.dataset.first || '') : (el.dataset.full || '');
      }
    }
    el.setAttribute('y', y);
    el.textContent = txt;
  }
  function syncBoxLabels(k){
    if (!gContainers) return;
    gContainers.selectAll('text.hct-boxlbl').each(function(){ fitBoxLabel(this, k); });
  }
  // each zone label FITS its zone, down a three-rung ladder: full name + count -> name only
  // (scale gives way toward 1) -> SHORT name (ADMIN, GOVERNMENT...). A label never overruns
  // its neighbor. Hidden-tab renders measure ZERO width (his overlap screenshot), so widths
  // re-measure lazily the first time the fitter runs while actually visible.
  function syncZoneLabels(){
    if (!gContainers) return;
    const zs = lastZoneScale;
    gContainers.selectAll('text.hct-zonelbl').each(function(){
      let wf = +this.dataset.wf || 0, ws = +this.dataset.ws || 0, wsh = +this.dataset.wsh || 0;
      if (!wf){ const m = measureZoneLbl(this); wf = m.wf; ws = m.ws; wsh = m.wsh; }
      const avail = +this.dataset.avail || Infinity;
      let s = zs, state = 'full';
      if (wf && wf * s > avail){
        state = 'name';
        if (ws * s > avail){
          if (ws && avail / ws >= 1) s = avail / ws;
          else { state = 'short'; s = wsh ? Math.max(0.9, Math.min(zs, avail / wsh)) : 1; }
        }
      }
      const name = this.querySelector('tspan.zl-name'), short = this.querySelector('tspan.zl-short'), cnt = this.querySelector('tspan.zl-count');
      if (name) name.style.display = state === 'short' ? 'none' : '';
      if (short) short.style.display = state === 'short' ? '' : 'none';
      if (cnt) cnt.style.display = state === 'full' ? '' : 'none';
      this.setAttribute('transform', 'translate(' + (this.dataset.zx || 0) + ',' + (this.dataset.zy || 0) + ') scale(' + s + ')');
    });
    gContainers.selectAll('text.hct-shelflbl').each(function(){   // kickers ride the full counter-scale
      this.setAttribute('transform', 'translate(' + (this.dataset.zx || 0) + ',' + (this.dataset.zy || 0) + ') scale(' + zs + ')');
    });
    gContainers.selectAll('text.hct-benchtag').each(function(){   // sector tags ride the full counter-scale
      this.setAttribute('transform', 'translate(' + (this.dataset.zx || 0) + ',' + (this.dataset.zy || 0) + ') scale(' + zs + ')');
    });
    const bs = Math.min(zs, 1.8);   // buttons cap below the labels: tappable at rest, findable at far zoom (his all-open "no X to close"; the box label reserve is -58 to match)
    gContainers.selectAll('g.hct-cact').each(function(){
      this.setAttribute('transform', 'translate(' + (this.dataset.zx || 0) + ',' + (this.dataset.zy || 0) + ') scale(' + bs + ')');
    });
  }
  let axisShown = false;        // the frozen level axis is up (render-owned): fits keep content clear of it
  let boardW = 0, boardH = 0;   // #hct-board size cache (ResizeObserver-owned): zoom ticks read this, never the live DOM
  function measureBoard(){ const el = document.getElementById('hct-board'); if (el){ boardW = el.clientWidth; boardH = el.clientHeight; } }
  function updateHeadClip(k){
    if (!clipRect) return;
    if (!boardW || !boardH) measureBoard();
    const w = boardW, h = boardH;
    if (w < 40 || h < 40){ clipRect.attr('x',0).attr('y',0).attr('width',5000).attr('height',5000); return; }   // not sized → don't clip
    const bandBottom = HEAD_TOP + (k || 1) * (headBandY - headPinY);
    clipRect.attr('x', 0).attr('y', bandBottom).attr('width', w).attr('height', Math.max(0, h - bandBottom));
  }
  const AXIS_W = 176;         // axis strip width in board units (names only — the L-number chips are gone)
  const AXIS_RESERVE = 190;   // screen px to reserve for the axis when fits anchor content left of it
  function fitToBounds(x0, x1, y0, y1, animate, dur, anchorLeft, kFloor){
    applyNavLimits();
    const wrap = document.getElementById('hct-board').getBoundingClientRect();
    // the docked detail panel eats the board's right edge — fit into the EXPOSED strip,
    // not the full window, or a snapped field strands a dead plain on the left
    let availW = wrap.width, availH = wrap.height;
    const pEl = document.getElementById('hct-panel');
    if (pEl && pEl.classList.contains('open') && pEl.dataset.owner === 'career'){
      // decks' floating card and the classic dock both ride the right edge now — reserve its
      // width (plus the float's air) and fit into the exposed strip; the phone sheet
      // (full-width) keeps the whole board
      const pw = pEl.getBoundingClientRect().width + ((DECKS && collapsedFams) ? 20 : 0);
      if (pw < wrap.width * 0.9) availW = wrap.width - pw;
    }
    const w = x1 - x0, h = y1 - y0;
    if (w <= 0 || h <= 0 || wrap.width < 120 || wrap.height < 120) return;   // not sized yet; a later re-fit handles it
    const ext = zoom.scaleExtent();
    // EVERY fit reserves the frozen-axis strip while the axis is up (anchored ones always did;
    // centered ones used to split the full width and slide the leftmost lane under the axis —
    // his all-open screenshot: ghost tiles behind the level names)
    const reserve = anchorLeft ? AXIS_RESERVE : (axisShown ? AXIS_RESERVE : 0);
    let k = Math.min((availW - reserve)/w, availH/h);
    k = Math.max(ext[0], Math.min(k, ext[1]));   // respect the blueprint zoom limits
    if (kFloor) k = Math.min(ext[1], Math.max(k, kFloor));   // readable-first fits: land legible, the overflow is one scroll away
    // LEFT-ANCHOR horizontally (content's x0 just right of the frozen axis) so a narrow group can't float to the middle and
    // leave a gap; centered fits center within the strip RIGHT of the axis. (Mirrors the vertical top-align below.)
    const tx = anchorLeft ? (AXIS_RESERVE - k*x0) : (reserve + (availW - reserve)/2 - k*(x0+x1)/2);
    // top-align the board content so it sits right under My Path (only center if it overflows)
    const ty = (k*h < availH) ? (14 - k*y0)
      : ((DECKS && collapsedFams) ? (14 - k*y0) : (availH/2 - k*(y0+y1)/2));   // decks: overflow TOP-aligns (entry rungs first, scroll reads downward); classic centers
    const t = d3.zoomIdentity.translate(tx, ty).scale(k);
    if (animate) svg.transition().duration(dcap(dur||520)).call(zoom.transform, t).on('end', syncLOD);
    else { svg.call(zoom.transform, t); syncLOD(); }
  }
  function fit(animate, dur){
    const pts = [...posMap.values()];
    if (!pts.length) return;
    const xs = pts.map(p=>p.x), yr = navY();
    fitToBounds(Math.min(...xs)-300, Math.max(...xs)+50, yr[0], yr[1], animate, dur);
  }
  // DECKS: selecting a role ZOOMS IN on its home discipline's ladder (the line's doors are one
  // pan away, and the panel's chips jump straight to them) — the old whole-field fit zoomed
  // OUT to a tiny wall and let the far doors spill under the docked panel (his QA screenshots)
  function snapFit(){
    const root = (DECKS && collapsedFams) ? focusId : selectedId;   // the camera frames the FOCUSED line's home, not the viewed card's
    if (DECKS && collapsedFams && root){
      const fam = (nodeById.get(root) || {}).family;
      const l = (curFamilyInfo || []).find(x => x.family === fam && !x.deckCell);
      if (l){
        // frame the home ladder PLUS its stacked door columns — they sit right beside it now
        const doors = (curFamilyInfo || []).filter(x => !x.deckCell && x.family !== '__mine' && x.family !== fam);
        const right = doors.length ? Math.max(l.right, ...doors.map(d => d.right)) + 140 : l.right + 420;
        const yr = navY(); fitToBounds(l.left - 120, right, yr[0], yr[1], true, 520, false, 0.55); return;   // kFloor 0.55: land READABLE; the tail of the ladder is a scroll away
      }
    }
    fit(true, 520);
  }
  // default Career Matrix view: open zoomed in on the dense CORE of the therapeutic region (Nursing + Respiratory
  // + Physician/APP), not the whole max-zoomed-out board. The rest of the families are a pan away.
  const CORE_FAMILIES = new Set(['nursing','respiratory','physician']);
  function fitDefaultGroup(animate){
    const wrap = document.getElementById('hct-board').getBoundingClientRect();
    if (wrap.width < 120 || wrap.height < 120) return;   // board not sized yet (tab just shown) — DON'T lock userZoomed; a later rAF / the ResizeObserver re-fits
    if (DECKS && collapsedFams && collapsedFams.size){ fit(animate); return; }   // decks mode: the resting deck map IS the readable overview — land on all of it
    const lanes = (curFamilyInfo||[]).filter(l => l.pathway === 'therapeutic' && CORE_FAMILIES.has(l.family));
    if (lanes.length){
      // NOTE: don't set userZoomed here — this is the DEFAULT framing; the ResizeObserver re-applies it (no longer fights). userZoomed means "user moved the view".
      const left = Math.min(...lanes.map(l=>l.left)), right = Math.max(...lanes.map(l=>l.right)), yr = navY();
      fitToBounds(left, right + 50, yr[0], yr[1], animate, 520, true);   // anchorLeft → the first family sits just right of the frozen axis, no centered gap
      return;
    }
    const g = (curLaneInfo||[]).find(x => x.pathway === 'therapeutic');   // fallbacks: whole therapeutic, then everything
    if (g) fitGroup(g.left, g.right, animate); else fit(animate);
  }
  // zoom to a horizontal slice (region or pathway), keeping full vertical extent
  function fitGroup(left, right, animate){
    userZoomed = true;   // zooming to a region/pathway is an intentional view; don't auto-refit over it
    const yr = navY();
    fitToBounds(left-300, right+50, yr[0], yr[1], animate, 520);   // 300 board units of left pad clears the k-scaled axis strip (50 didn't)
  }
  function regionBounds(side){
    const gs = curLaneInfo.filter(g=>g.side===side);
    if (!gs.length) return null;
    return [Math.min(...gs.map(g=>g.left)), Math.max(...gs.map(g=>g.right))];
  }

  // ── Helpers ────────────────────────────────────────────
  function esc(s){ return (s==null?'':String(s)).replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])); }
  function hexA(hex, a){
    const h = (hex||'#4ECDC4').replace('#',''); const n = parseInt(h.length===3 ? h.split('').map(x=>x+x).join('') : h, 16);
    return 'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+a+')';
  }

  // ── Controls: v2 selectors — the popover contract (HU-CONTROL-ARCHITECTURE-V2) ──
  // One popover open at a time; Esc closes and returns focus to the trigger;
  // outside click closes; arrows walk the options; the phone renders the
  // popover as a bottom sheet (CSS). The face always shows the current choice.
  function applyFilterChange(){ selectedId = null; closePanel(); userZoomed = false; render(false); fit(true);
    if (edBuilt){ renderEducationMatrix(curView === 'edu'); if (curView === 'edu'){ edUserZoomed = false; edFit(true); } } }   // both boards honor the same filters

  // one polite live region for the whole tool — announce COMMITTED state changes
  // only (metric switch, filter apply, view restore). Never hover.
  function announce(msg){
    const el = document.getElementById('hct-live'); if (!el) return;
    el.textContent = '';                                  // clear first so repeats re-announce
    requestAnimationFrame(() => { el.textContent = msg; });
  }

  // the contract itself is HUKit.pop's now (kit extraction 2026-08-17). The phone
  // budget stays this tool's rule, expressed as the kit's onOpen hook.
  const popCtl = HUKit.pop({
    onOpen: function(){ if (isPhone()) closePanel(); }   // ONE transient surface: a selector sheet displaces the detail sheet
  });
  function closePop(refocus){ popCtl.close(refocus); }
  function openPopover(btn, pop, build){ popCtl.open(btn, pop, build); }

  // families present per pathway, in familyOrder
  function pathwayFamilies(pw){
    const cls = DATA.classes[curClass];
    const famOrder = cls.familyOrder || Object.keys(cls.families||{});
    return [...new Set(cls.nodes.filter(n=>n.pathway===pw).map(n=>n.family))]
      .sort((a,b)=> famOrder.indexOf(a)-famOrder.indexOf(b));
  }
  // shown/total across every pathway's specialties — feeds the selector face + applied strip
  function pathsSummary(){
    const cls = DATA ? DATA.classes[curClass] : null;
    let total = 0, hidden = 0;
    if (cls && curClass === 'roles' && cls.pathwayOrder){
      cls.pathwayOrder.forEach(pw => pathwayFamilies(pw).forEach(f => {
        total++; if (hiddenPathways.has(pw) || hiddenFamilies.has(f)) hidden++;
      }));
    }
    return { total, hidden };
  }

  function buildPathsPop(){
    const host = document.getElementById('hct-pop-paths-list'); if (!host) return;
    const cls = DATA.classes[curClass];
    if (curClass !== 'roles' || !cls.pathwayOrder){ host.innerHTML = ''; return; }
    let html = '';
    cls.pathwayOrder.forEach(pw => {
      const p = cls.pathways[pw];
      const fams = pathwayFamilies(pw);
      const pwOff = hiddenPathways.has(pw);
      const shown = fams.filter(f => !pwOff && !hiddenFamilies.has(f)).length;
      html += '<button class="pop-opt pop-opt-pw" role="option" aria-selected="'+(shown>0)+'" data-pwtoggle="'+pw+'" title="Show or hide every '+esc(p.label)+' specialty">'+
        '<span class="pdot" style="background:'+p.color+'"></span>'+esc(p.label)+
        '<span class="ddc">'+shown+'/'+fams.length+'</span></button>';
      fams.forEach(f => {
        const fc = cls.families[f] || {};
        const on = !pwOff && !hiddenFamilies.has(f);
        html += '<button class="pop-opt pop-opt-sub" role="option" aria-selected="'+on+'" data-fam="'+f+'" data-pw="'+pw+'">'+
          '<span class="fdot" style="background:'+(fc.color||'#888')+'"></span>'+esc(fc.label||f)+'</button>';
      });
    });
    host.innerHTML = html;
  }
  function buildMetricPop(){
    const host = document.getElementById('hct-pop-metric-list'); if (!host) return;
    host.innerHTML = CMODES.map(c =>
      '<button class="pop-opt" role="option" aria-selected="'+(c.k===colorMode)+'" data-cmode="'+c.k+'" title="'+c.hint+'">'+c.label+'</button>').join('');
  }

  // refresh everything that mirrors the pathway-filter state: the selector face,
  // the applied strip, an open filter panel, and the URL. The one call after any
  // filter mutation (toggles, show/hide all, selectCareer un-hides, class reset).
  function refreshPathwayControls(){
    if (!DATA) return;
    const { total, hidden } = pathsSummary();
    const faceTxt = hidden === 0 ? 'Pathways'
      : (hidden === total ? 'Pathways · none' : 'Pathways · ' + (total - hidden) + '/' + total);
    const face = document.getElementById('hct-sel-paths-val'); if (face) face.textContent = faceTxt;
    const faceE = document.getElementById('hct-sel-paths-edu-val'); if (faceE) faceE.textContent = faceTxt;
    renderAppliedStrip();
    const cur = popCtl.current();
    if (cur && cur.pop === document.getElementById('hct-pop-paths')) buildPathsPop();
    syncURL();
  }

  // applied strip: non-default state no selector face spells out — hidden pathways
  // read as a removable chip while the Career Matrix is on screen; defaults = no strip
  function renderAppliedStrip(){
    const s = document.getElementById('hct-applied'); if (!s) return;
    const chips = [];
    // snapped board = a NAMED state, not a mystery: the selection collapsed the field to one
    // career line, and the way out is spelled in words (a title attribute can't teach on touch)
    // DECKS moved every board verb ONTO the field (his call: "floating instead of locked to
    // the top bar") — Focus line / Show all hang off their hexes, fold ✕ + simplify ride the
    // containers, Fold all floats in the board corner. The strip carries only FILTER state
    // there. Classic keeps its Focused chip.
    if (!(DECKS && collapsedFams) && curView === 'career' && lineageSet && selectedId && nodeById.has(selectedId)){
      const fn = nodeById.get(selectedId);
      chips.push('<span class="applied-chip">Focused: <b>'+esc(fn.label.replace(/\n/g,' '))+'</b><button class="ac-show" type="button" data-clear="focus">Show all</button></span>');
    }
    const fa = document.getElementById('hct-foldall');
    if (fa){
      let openCount = 0;
      if (DECKS && collapsedFams && DATA)
        Object.keys(DATA.classes[curClass].families || {}).forEach(f => { if (!collapsedFams.has(f) && !hiddenFamilies.has(f)) openCount++; });
      fa.hidden = !(openCount > 0 && !lineageSet);
    }
    if ((curView === 'career' || curView === 'edu') && DATA){
      const { total, hidden } = pathsSummary();
      if (hidden > 0) chips.push('<span class="applied-chip">Showing <b>'+(total-hidden)+' of '+total+'</b> specialties<button class="ac-x" type="button" data-clear="paths" aria-label="Show all pathways">&#10005;</button></span>');
    }
    s.innerHTML = chips.join('');
    s.hidden = !chips.length;
  }

  // ── URL-addressable views (serializer convention, HU-CONTROL-ARCHITECTURE-V2) ──
  // ?view=career&metric=pay&hide=nursing,lab&hidepw=admin — defaults omitted
  // (view=path, metric=fam, nothing hidden), stable keys from career-tree.json.
  // View-tab changes PUSH history; in-view tweaks REPLACE. Restore runs after
  // data load, before the first render; popstate = reset → re-apply → render.
  const urlCtl = HUKit.urlState({
    url: () => { const q = stateToParams().toString(); return q ? ('?'+q) : location.pathname; },
    scope: () => curView
  });
  const URL_VIEWS = ['path','career','edu','atlas'];
  const VIEW_LABEL = { path:'My Path', career:'Career Matrix', edu:'Education Matrix', atlas:'Areas of Expertise' };
  function stateToParams(){
    const p = new URLSearchParams();
    if (curView !== 'path') p.set('view', curView);
    if (colorMode !== 'fam') p.set('metric', colorMode);
    if (eduColorMode !== 'fam') p.set('emetric', eduColorMode);
    if (hiddenFamilies.size) p.set('hide', [...hiddenFamilies].join(','));
    if (hiddenPathways.size) p.set('hidepw', [...hiddenPathways].join(','));
    if (atlasLens) p.set('lens', atlasLens);
    if (!DECKS) p.set('classic', '1');   // the escape hatch survives the URL sync so a classic-mode refresh stays classic
    return p;
  }
  function syncURL(){ if (!DATA) return; urlCtl.sync(); }   // no writes before the data lands
  // Idempotent: layers the URL onto whatever the state already is — callers zero
  // the state first (popstate) or start from the defaults (init). Returns the view.
  // ?role= / ?cred= / ?area= are DEEP LINKS (article → tile): applied once via
  // consumeDeepLink, never re-serialized by stateToParams — the next interaction
  // scrubs them (guidance leaves after use).
  let pendingDL = null;
  function applyURLState(){
    let v = 'path';
    try{
      const p = new URLSearchParams(location.search);
      const pv = p.get('view'); if (pv && URL_VIEWS.indexOf(pv) >= 0) v = pv;
      const mk = p.get('metric'); if (mk === 'pay' || mk === 'growth') colorMode = mk;
      const em = p.get('emetric'); if (em === 'pass') eduColorMode = em;
      const cls = DATA.classes[curClass];
      const famSet = new Set(cls.nodes.map(n => n.family));
      const pwSet = new Set(cls.pathwayOrder || []);
      (p.get('hide')||'').split(',').forEach(f => { if (famSet.has(f)) hiddenFamilies.add(f); });
      (p.get('hidepw')||'').split(',').forEach(w => { if (pwSet.has(w)) hiddenPathways.add(w); });
      const lz = p.get('lens'); if (lz && LENS_DEF[lz]) atlasLens = lz;
      const dlRole = p.get('role'), dlCred = p.get('cred'), dlArea = p.get('area');
      pendingDL = null;
      if (dlRole && nodeById.has(dlRole)){ pendingDL = { kind:'role', v: dlRole }; v = 'career'; }
      else if (dlCred){ pendingDL = { kind:'cred', v: dlCred }; v = 'edu'; }
      else if (dlArea && growthById && growthById.has(dlArea)){ pendingDL = { kind:'area', v: dlArea }; v = 'atlas'; }
    }catch(e){}
    urlCtl.mark(v);
    return v;
  }
  // fire a pending deep link once the target view has rendered (rAF + a beat for the lazy boards)
  function consumeDeepLink(){
    const dl = pendingDL; if (!dl) return; pendingDL = null;
    requestAnimationFrame(() => setTimeout(() => {
      if (dl.kind === 'role') selectCareer(dl.v);
      else if (dl.kind === 'cred') jumpToEduCred(dl.v);
      else if (dl.kind === 'area'){ const g = growthById.get(dl.v); if (g) openGrowthPanel(g); }
    }, 60));
  }
  // the one "URL is the state" path: zero the in-view state, re-apply the URL, land the view.
  // Shared by popstate, the preset Views, and the intake survey — they differ only in who pushed the URL.
  function resetToURL(announceText){
    urlCtl.begin();
    hiddenPathways = new Set(); hiddenFamilies = new Set(); colorMode = 'fam'; eduColorMode = 'fam'; atlasLens = null;
    const v = applyURLState();
    applyAtlasLens();                     // chips + tiles reflect the restored lens (no-op if the atlas isn't built yet)
    if (edBuilt) renderEducationMatrix(false);   // restored filters + metric land on the education board too
    setColorMode(colorMode);              // face + legend reflect the restored metric
    refreshPathwayControls();
    selectedId = null; eduSelId = null; eduMatrixSel = null; snapArmed = false; focusId = null; edResetSnap(); atResetSnap(); closePanel();
    if (boardRendered) render(false);     // repaint the board with the restored filters
    const sameTab = (v === curView);
    setView(v);
    if (sameTab && v === 'career'){ userZoomed = false; fit(false); }
    urlCtl.end();
    consumeDeepLink();   // ?role/?cred/?area rides presets + shared links + back/forward
    announce(announceText || ('View: ' + (VIEW_LABEL[v] || v)));
    return v;
  }
  // phone hardware back = the X walk while the detail sheet is up, one step at a time
  // (the maps' proven pattern). Created BEFORE the popstate handler below so the guard's
  // listener runs first in the dispatch and consumed() is fresh for the SAME press.
  // Tab/preset/survey pushes stay history-native — the guard only owns the sheet.
  const backGd = (window.HUKit && HUKit.backGuard) ? HUKit.backGuard({
    watch: document.getElementById('hct-panel'),
    active: () => document.getElementById('hct-panel').classList.contains('open')
               || (isPhone() && curView === 'career' && !!phoneFam),
    step: () => {
      if (document.getElementById('hct-panel').classList.contains('open')){
        dismissPanel();
        setTimeout(ensurePhoneArm, 80);   // the ladder beneath keeps its own back step
      } else closePhoneFam(false);
    }
  }) : null;
  window.addEventListener('popstate', () => {
    if (backGd && backGd.consumed()) return;   // the guard ate this press to close the sheet — NOT a URL walk, no scope rebuild
    if (!DATA) return;
    closePop(false);
    resetToURL();
  });


  // switch the active full-bleed view (top-bar tabs) + swap that tab's contextual controls
  function setView(v){
    if (v === 'edu' && curClass !== 'roles') v = 'career';   // Education is roles-only
    closePop(false);                                         // a tab action never leaves a selector popover behind
    const tbEl = document.getElementById('hct-tb'); if (tbEl) tbEl.dataset.view = v;   // FIRST: CSS swaps the contextual cluster — set before any render that could throw
    if (v === 'career' && !boardRendered) render(false);     // lazy: build the heavy board on first open (before the rAF fit needs curFamilyInfo)
    if (v === 'edu' && !eduRendered) renderSchooling();      // lazy: build the Education Matrix on first open
    const changed = (v !== curView);
    // EVERY tab action (switch OR re-click) drops any open detail panel + clears selection — a panel never carries between views
    const had = selectedId;
    selectedId = null; eduSelId = null; eduMatrixSel = null; snapArmed = false; focusId = null; edResetSnap(); atResetSnap(); closePanel();
    if (had && DATA && curView === 'career') render(false);   // re-render the board we're leaving to drop its selection highlight
    curView = v;
    const cw = document.getElementById('hct-canvas-wrap'); if (cw) cw.setAttribute('data-view', v);   // lets CSS nest the panel per view
    qsa(document,'#hct-tabs button').forEach(b => { const on = b.dataset.view === v; b.classList.toggle('on', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; });
    qsa(document,'.hct-view').forEach(s => s.classList.toggle('active', s.dataset.view === v));
    renderAppliedStrip();   // the hidden-pathways chip only reads while the Career Matrix is on screen
    syncURL();              // view tabs are URL scope — this pushes; in-view tweaks replace
    if (changed) requestAnimationFrame(() => {
      if (v === 'career'){ if (isPhone()){ renderPhoneFlow(); } else { userZoomed = false; fitDefaultGroup(false); } }   // ONE landing per entry — phone paints the flow (the board is display:none there); desktop's ResizeObserver re-applies the default framing when the board's size settles
      else if (v === 'edu'){ if (edBuilt && !edUserZoomed) edFit(false); }   // re-frame on entry unless the user parked the camera
      else if (v === 'atlas'){ if (!atlasBuilt) renderGrowthAtlas(); else { updateAtlasHud(); if (!atUserZoomed){ fitAtlas(); requestAnimationFrame(fitAtlas); } } }   // re-tally on entry — the build may have changed since the last visit
      else { renderMyPath(); }
    });
  }

  function setClass(cls){
    if (cls===curClass) return;
    qsa(document,'#hct-class button').forEach(b => b.classList.toggle('on', b.dataset.class===cls));
    hiddenPathways = new Set();
    hiddenFamilies = new Set();
    userZoomed = false;
    selectedId = null; snapArmed = false; focusId = null;
    if (DECKS) collapsedFams = null;   // fold everything for the new class (reps re-derive from its nodes)
    phoneFam = null;                   // the phone flow lands back on the new class's deck grid
    loadClass(cls);
    refreshPathwayControls();
    updateClassChrome();
    document.getElementById('hct-blurb').textContent = DATA.classes[cls].blurb;
    render(false);
    renderMyPath();
    fit(false);
    requestAnimationFrame(() => { fit(false); });   // re-fit once layout settles (correct measurement → correct detail level)
  }

  // ── Init ───────────────────────────────────────────────
  function init(){
    if (DECKS){ const sh = document.getElementById('hct-shell'); if (sh) sh.classList.add('decks'); }   // the floating-card CSS keys off this
    // clip so the scrolling content + left axis can never bleed up into the pinned header band (screen-space rect)
    const svgDefs = svg.append('defs');
    clipRect = svgDefs.append('clipPath').attr('id','hctBelowHead').append('rect').attr('x',0).attr('y',0).attr('width',5000).attr('height',5000);
    // the level axis fades INTO the field instead of ending in a slab — stops carry the theme via CSS
    const axisFade = svgDefs.append('linearGradient').attr('id','axisFade')
      .attr('gradientUnits','userSpaceOnUse').attr('x1', AXIS_W - 110).attr('x2', AXIS_W).attr('y1', 0).attr('y2', 0);
    axisFade.append('stop').attr('offset', '0').attr('class', 'axis-fade-a');
    axisFade.append('stop').attr('offset', '1').attr('class', 'axis-fade-b');
    const gClip = svg.append('g').attr('clip-path','url(#hctBelowHead)');
    gZoom  = gClip.append('g');
    gBands = gZoom.append('g').attr('class','bands');
    gContainers = gZoom.append('g').attr('class','containers');
    gTiers = gZoom.append('g').attr('class','tiers');
    gEdges = gZoom.append('g').attr('class','edges');
    gNodes = gZoom.append('g').attr('class','nodes');
    gActs = gZoom.append('g').attr('class','acts');   // on-hex action pills ride ABOVE the tiles
    // frozen left axis — follows vertical pan + zoom, ignores horizontal pan; clipped to below the header band
    const gAxisClip = svg.append('g').attr('clip-path','url(#hctBelowHead)');
    gAxis = gAxisClip.append('g').attr('class','axis-frozen');
    // frozen TOP header band (NOT clipped) — on top; follows horizontal pan + zoom, pinned to the top
    gTop = svg.append('g').attr('class','top-frozen');
    gTopBg = gTop.append('rect').attr('class','top-frozen-bg');
    gHeaders = gTop.append('g').attr('class','headers');

    zoom = d3.zoom().scaleExtent([0.07, 2.4]).clickDistance(6)
      // measure the BOARD live for the translate-clamp (same element fitToBounds uses) — d3's default measures the SVG,
      // which can read 0/stale right after the tab is shown and clamps the first fit off to the side
      .extent(() => { if (!boardW || !boardH) measureBoard(); return [[0,0],[boardW||1, boardH||1]]; })
      .on('zoom', e => {
      gZoom.attr('transform', e.transform);
      syncAxisPos(e.transform);
      // pin the header band to the top: same horizontal pan + zoom as the content, but a fixed top offset
      gTop.attr('transform', 'translate(' + e.transform.x + ',' + (HEAD_TOP - e.transform.k*headPinY) + ') scale(' + e.transform.k + ')');
      updateHeadClip(e.transform.k);
      syncHeadType(e.transform.k);
      if (e.sourceEvent) userZoomed = true;     // a real wheel/drag, not a programmatic fit
      // hysteresis band around the old k=0.5 LOD line: enter far below 0.45, back above 0.55,
      // so wheel jitter at the line can't flap. The class flip fades titles now (cheap, CSS
      // owns it); the 158-tile abbr pass waits for the end event below.
      const far = lodFar ? (e.transform.k < 0.55) : (e.transform.k < 0.45);
      if (far !== lodFar){ lodFar = far; svg.classed('hct-far', far); lodDirty = true; }
    })
      .on('end.lod', () => { if (lodDirty){ lodDirty = false; styleTiles(); } });
    svg.call(zoom);

    // re-fit whenever the board actually changes size (initial settle, resize, My Path toggle) — unless the user took over
    if (window.ResizeObserver){
      new ResizeObserver(() => { measureBoard(); if (!DATA) return; applyNavLimits(); updateHeadClip(d3.zoomTransform(svg.node()).k); syncZoneLabels(); if (!userZoomed) fitDefaultGroup(false); })   // refresh the size cache FIRST, re-fit the zone labels (they measure 0 while the tab is hidden), then re-apply the DEFAULT core framing — catches the first-entry case where the board wasn't sized yet
        .observe(document.getElementById('hct-board'));
    }
    svg.on('mousedown', () => svg.classed('grabbing', true));
    window.addEventListener('mouseup', () => svg.classed('grabbing', false));
    svg.on('click', () => {
      // DECKS: one step back per tap, mirroring Esc — first the card, then the focus
      if (DECKS && collapsedFams){
        if (selectedId){ selectedId = null; closePanel(); render(true); return; }
        if (lineageSet) exitFocus();
        return;
      }
      if (selectedId){ const wasSnapped = !!lineageSet; selectedId=null; snapArmed=false; closePanel(); render(wasSnapped); if (wasSnapped && !isPhone()) fitDefaultGroup(true); }   // snapped boards EXPAND animated; desktop's camera returns in step, PHONE PARKS (sloppy empty taps were flying the world)
    });
    // the corner Fold all pill (the chip-strip button's new home on the field)
    const faBtn = document.getElementById('hct-foldall');
    if (faBtn) faBtn.onclick = () => {
      if (!DECKS || !collapsedFams) return;
      nodeById.forEach(n => collapsedFams.add(n.family)); famFanned.clear(); famOpenOrder = [];
      selectedId = null; closePanel(); render(true);
      announce('All columns folded');
    };

    qsa(document,'#hct-class button').forEach(b => b.onclick = () => setClass(b.dataset.class));

    // real tablist semantics on the primary tabs: arrows walk, Home/End jump, one tab stop
    const tabsEl = document.getElementById('hct-tabs');
    tabsEl.setAttribute('role', 'tablist');
    tabsEl.setAttribute('aria-label', 'Views');
    const tabBtns = qsa(tabsEl,'button');
    tabBtns.forEach(b => { b.setAttribute('role', 'tab'); const on = b.classList.contains('on'); b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; });
    tabsEl.addEventListener('keydown', e => {
      const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : null;
      if (step === null && e.key !== 'Home' && e.key !== 'End') return;
      e.preventDefault();
      const cur = tabBtns.indexOf(asEl(document.activeElement));
      const next = e.key === 'Home' ? 0 : e.key === 'End' ? tabBtns.length - 1
        : ((cur < 0 ? 0 : cur) + step + tabBtns.length) % tabBtns.length;
      tabBtns[next].focus();
    });

    // ── v2 selector wiring: triggers, option lists, and the popover contract ──
    const selPaths = document.getElementById('hct-sel-paths'), popPaths = document.getElementById('hct-pop-paths');
    const selMetric = document.getElementById('hct-sel-metric'), popMetric = document.getElementById('hct-pop-metric');
    if (selPaths) selPaths.addEventListener('click', () => { if (DATA) openPopover(selPaths, popPaths, buildPathsPop); });   // career button retired; edu keeps its own below
    selMetric.addEventListener('click', () => openPopover(selMetric, popMetric, buildMetricPop));
    const selPathsE = document.getElementById('hct-sel-paths-edu');
    if (selPathsE) selPathsE.addEventListener('click', () => { if (DATA) openPopover(selPathsE, popPaths, buildPathsPop); });   // same popover, same shared filter state
    const selEMetric = document.getElementById('hct-sel-emetric'), popEMetric = document.getElementById('hct-pop-emetric');
    if (selEMetric) selEMetric.addEventListener('click', () => openPopover(selEMetric, popEMetric, buildEMetricPop));
    document.getElementById('hct-pop-emetric-list').addEventListener('click', e => {
      const b = hit(e,'[data-emode]'); if (!b) return;
      setEduColorMode(b.dataset.emode); closePop(true);
    });
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      if (popCtl.escape()) return;   // the kit owns the popover rung
      if (document.querySelector('.bp-modal.open')) return;                    // modals own their own Esc
      const pEl = document.getElementById('hct-panel');
      if (pEl && pEl.classList.contains('open')){ dismissPanel(); return; }    // Esc = the X, one step (fleet contract)
      // PHONE FLOW: the ladder is its own step on the way out (sheet first, then this)
      if (isPhone() && curView === 'career' && phoneFam){ closePhoneFam(true); return; }
      // DECKS: the focused line is its own step on the way out (card first, then this)
      if (DECKS && collapsedFams && curView === 'career' && lineageSet){ exitFocus(); announce('Showing all roles'); return; }
      // DECKS: Esc keeps walking the board itself — fan back to spine, then spine folds to deck
      if (DECKS && collapsedFams && curView === 'career' && famOpenOrder.length){
        const last = famOpenOrder[famOpenOrder.length - 1];
        if (famFanned.has(last)){ famFanned.delete(last); announce('Back to the simple line'); }
        else { collapsedFams.add(last); famOpenOrder.pop(); announce('Column folded'); }
        render(true);
      }
    });
    // (arrows / Home / End are the kit's, delegated across every .selector-pop)
    qsa(document,'.selector-pop').forEach(pop => {
      pop.querySelector('[data-close]').addEventListener('click', () => closePop(true));
    });
    // Metric popover: single-select, closes on pick (same commit path as before)
    document.getElementById('hct-pop-metric-list').addEventListener('click', e => {
      const t = hit(e,'[data-cmode]'); if (!t) return;
      closePop(true);
      setColorMode(t.dataset.cmode);
      announce('Metric: ' + (CMODE_LABEL[t.dataset.cmode] || t.dataset.cmode));
    });
    // ── preset views (crit #4): authored starting points, each just a URL ──
    const PRESETS = [
      { name: 'Follow the money',         q: '?view=career&metric=pay' },
      { name: 'Where the jobs are going', q: '?view=career&metric=growth' },
      { name: 'The clinical core',        q: '?view=career&hidepw=informatics,biotech,admin,government,education' },
      // editorial routes — each is just a deep-linked URL (?role snaps the board to that lineage)
      { name: 'The nursing ladder',       q: '?role=rn' },
      { name: 'Bedside to informatics',   q: '?role=clin-informatics' },
      { name: 'The exams, scored',        q: '?view=edu&emetric=pass' },
    ];
    const selViews = document.getElementById('hct-sel-views'), popViews = document.getElementById('hct-pop-views');
    function buildViewsPop(){
      document.getElementById('hct-pop-views-list').innerHTML = PRESETS.map(p =>
        `<button class="pop-opt" role="option" data-view-q="${p.q}">${p.name}</button>`).join('');
    }
    selViews.addEventListener('click', () => { if (DATA) openPopover(selViews, popViews, buildViewsPop); });
    // a preset click is the popstate path with the URL pushed first: reset → re-apply → render
    document.getElementById('hct-pop-views-list').addEventListener('click', e => {
      const t = hit(e,'[data-view-q]'); if (!t || !DATA) return;
      closePop(true);
      try{ history.pushState(null, '', t.dataset.viewQ); }catch(err){}
      resetToURL('View: ' + t.textContent);
    });

    // ── global search: roles + expertise areas, jump on pick ──
    // Roles ride selectCareer (un-hides, pans, opens the panel); expertise rides
    // openGrowthPanel with the node straight from DATA.growth (works even before
    // the atlas view has rendered — setView('atlas') lazy-builds it).
    const selGS = document.getElementById('hct-sel-search'), popGS = document.getElementById('hct-pop-search');
    const gsInput = asInput(document.getElementById('hct-global-search')), gsList = document.getElementById('hct-pop-search-list');
    function buildGsList(){
      const q = (gsInput.value || '').trim().toLowerCase();
      if (!q){ gsList.innerHTML = '<div class="gs-none">Type to search ' + DATA.classes[curClass].nodes.length + ' roles, the expertise pool, and the credential stack.</div>'; return; }
      const roles = DATA.classes[curClass].nodes
        .filter(n => (n.label.replace(/\n/g,' ') + ' ' + (n.abbr||'') + ' ' + n.family + ' ' + n.pathway).toLowerCase().includes(q)).slice(0, 12);   // \n → space: "nurse anesthetist" must match the two-line label
      const grow = ((DATA.growth && DATA.growth.nodes) || [])
        .filter(n => ((n.label||'') + ' ' + (n.group||'') + ' ' + (n.zone||'')).toLowerCase().includes(q)).slice(0, 8);
      // credentials: the Education Matrix corpus once it has rendered, the creds file's faces before
      // that (jumpToEduCred lazy-builds the matrix on pick either way). ONE search covers all three
      // boards — the phone hides the inline board inputs and leans entirely on this list.
      const seenFace = new Set();
      let creds = [];
      if (eduCards.length){
        eduCards.forEach(c => { if (!c || !c.face || seenFace.has(c.face)) return;
          if ((c.face + ' ' + (c.label||'')).toLowerCase().includes(q)){ seenFace.add(c.face); creds.push({ face:c.face, meta:c.label || 'credential' }); } });
      } else if (CREDS && CREDS.faceMap){
        Object.keys(CREDS.faceMap).forEach(f => { if (seenFace.has(f)) return;
          const cd = (CREDS.credentials||{})[CREDS.faceMap[f]] || {};
          if ((f + ' ' + (cd.exam||'')).toLowerCase().includes(q)){ seenFace.add(f); creds.push({ face:f, meta:cd.exam || 'credential' }); } });
      }
      creds = creds.slice(0, 8);
      let h = '';
      if (roles.length){
        h += '<div class="pop-sec">Roles</div>' + roles.map(n =>
          `<button class="pop-opt" role="option" data-gs-kind="role" data-gs-id="${n.id}">${n.label.replace(/\n/g,' ')}<span class="gs-meta">${n.family} · ${n.pathway}</span></button>`).join('');
      }
      if (grow.length){
        h += '<div class="pop-sec">Areas of Expertise</div>' + grow.map(n =>
          `<button class="pop-opt" role="option" data-gs-kind="growth" data-gs-id="${n.id}">${(n.label||'').replace(/\n/g,' ')}<span class="gs-meta">${n.group || n.zone}</span></button>`).join('');
      }
      if (creds.length){
        h += '<div class="pop-sec">Credentials</div>' + creds.map(c =>
          `<button class="pop-opt" role="option" data-gs-kind="cred" data-gs-id="${c.face}">${c.face}<span class="gs-meta">${c.meta}</span></button>`).join('');
      }
      gsList.innerHTML = h || '<div class="gs-none">No matches. Try a shorter word, or a family like "nursing" or "informatics".</div>';
    }
    selGS.addEventListener('click', () => {
      if (!DATA) return;
      openPopover(selGS, popGS, buildGsList);
      setTimeout(() => gsInput.focus(), 0);   // the input owns first focus, not the first option
    });
    gsInput.addEventListener('input', buildGsList);
    gsInput.addEventListener('keydown', e => {
      if (e.key === 'Home' || e.key === 'End') e.stopPropagation();   // caret keys stay caret keys inside the input
      if (e.key === 'Enter'){ const f = gsList.querySelector('[data-gs-id]'); if (f) asEl(f).click(); }
    });
    gsList.addEventListener('click', e => {
      const t = hit(e,'[data-gs-id]'); if (!t) return;
      closePop(true);
      const id = t.dataset.gsId;
      if (t.dataset.gsKind === 'role'){
        if (curView !== 'career' && curView !== 'edu') setView('career');   // selectCareer handles the edu → career jump itself
        selectCareer(id);
      } else if (t.dataset.gsKind === 'cred'){
        jumpToEduCred(id);   // sets the edu view itself and lands with the credential selected
      } else {
        const n = (DATA.growth && DATA.growth.nodes || []).find(x => x.id === id); if (!n) return;
        if (curView !== 'atlas') setView('atlas');
        requestAnimationFrame(() => openGrowthPanel(n));
      }
      announce('Selected: ' + t.textContent.trim());
    });

    // ── first-run intake survey: four answers become a seeded build + a preset URL ──
    // The answers themselves are thrown away. What persists: your education level on the
    // Current layer, and the view/filter the URL names. Skip buttons jump straight in.
    const svAns = { status:null, pull:null, edu:null, reach:null };
    // affinity → the pathways that STAY on the board; everything else rides ?hidepw=
    const SV_SHOW = {
      patients: ['therapeutic','diagnostic','support'],
      data:     ['informatics','biotech'],
      ops:      ['admin','government'],
      hands:    ['diagnostic','biotech']
    };
    // optional conditional picks — each status answer earns a follow-up field
    let svRole = null;   // roleId, when "I work in healthcare" names the job
    let svCred = null;   // {face, degree}, when "I'm in school for it" names the target
    // the pathways that STAY LIT, from pull + reach + your own picks. One function for
    // the preview AND the finish so they can never disagree. Rule: your pinned role
    // (or your target credential's home pathway) is never filtered off your own map.
    function svShowSet(){
      if (svAns.reach === 'unsure') return [];                    // empty = no filter, the whole wall
      const show = (SV_SHOW[svAns.pull] || []).slice();
      if (svAns.reach === 'lead' && show.indexOf('admin') < 0) show.push('admin');
      if (svAns.status === 'working' && svRole && nodeById.has(svRole)){
        const pw = nodeById.get(svRole).pathway;
        if (pw && show.indexOf(pw) < 0) show.push(pw);
      }
      if (svAns.status === 'school' && svCred){
        const en = credIndex.find(c => c.face === svCred.face);
        const r0 = en && en.roleIds && en.roleIds.length ? nodeById.get(en.roleIds[0]) : null;
        if (r0 && show.indexOf(r0.pathway) < 0) show.push(r0.pathway);
      }
      return show;
    }
    function svSync(){
      const done = Object.values(svAns).every(Boolean);
      const go = asInput(document.getElementById('hw-go')); if (go) go.disabled = !done;
      const hint = document.getElementById('hw-go-hint');
      if (hint) hint.textContent = done ? 'All of it undoable.' : 'Answer all four and this lights up.';
      // live readout — every answer shows what it puts on your sheet
      const pv = document.getElementById('hw-preview');
      if (!pv || !DATA) return;
      const bits = [];
      if (svAns.status === 'working' && svRole && nodeById.has(svRole))
        bits.push(nodeById.get(svRole).label.replace(/\n/g,' ') + ' pinned as your current role');
      if (svAns.status === 'school' && svCred)
        bits.push('Aiming for ' + svCred.face);
      if (svAns.edu)
        bits.push(((DATA.meta.degrees[svAns.edu]||{}).label || svAns.edu) + ' on your education line');
      if (svAns.pull){
        const show = svShowSet();
        const pws = DATA.classes[curClass].pathways || {};
        bits.push(show.length ? ('Career Matrix pre-filtered to ' + show.length + ' of 8 pathways: ' + show.map(p => (pws[p]||{}).label || p).join(', '))
                              : 'Career Matrix stays the whole wall');
        bits.push('expertise map lensed to ' + (LENS_DEF[svAns.pull]||{}).label);
      }
      pv.hidden = !bits.length;
      pv.textContent = bits.length ? ('Your sheet starts with · ' + bits.join('  ·  ')) : '';
    }
    // show the follow-ups the answers earn; leaving an answer clears its pick
    // (naming the degree happens on the SHEET — click the tile, the panel asks)
    function svCondSync(){
      const w = document.getElementById('hw-cond-working'), s = document.getElementById('hw-cond-school');
      if (w) w.hidden = svAns.status !== 'working';
      if (s) s.hidden = svAns.status !== 'school';
      if (svAns.status !== 'working' && (svRole || svRoleIn.value)){ svRole = null; svRoleIn.value = ''; svRoleIn.classList.remove('picked'); svRoleList.hidden = true; svRoleList.innerHTML = ''; }
      if (svAns.status !== 'school' && (svCred || svCredIn.value)){ svCred = null; svCredIn.value = ''; svCredIn.classList.remove('picked'); svCredList.hidden = true; svCredList.innerHTML = ''; }
    }
    const svRoleIn = asInput(document.getElementById('hw-role-in')), svRoleList = document.getElementById('hw-role-list');
    const svCredIn = asInput(document.getElementById('hw-cred-in')), svCredList = document.getElementById('hw-cred-list');
    function svRenderRoles(){
      const q = (svRoleIn.value || '').trim().toLowerCase();
      const m = !q || !DATA ? [] : DATA.classes[curClass].nodes
        .filter(n => (n.label.replace(/\n/g,' ') + ' ' + (n.abbr||'') + ' ' + n.family + ' ' + n.pathway).toLowerCase().includes(q)).slice(0, 8);   // \n → space: multi-line hex labels must match phrase queries
      svRoleList.hidden = !m.length;
      svRoleList.innerHTML = m.map(n =>
        `<button type="button" class="hw-sg" data-role="${n.id}">${esc(n.label.replace(/\n/g,' '))}<span class="hw-sg-meta">${esc(n.abbr||'')} · ${esc(n.family)} · ${esc(n.pathway)}</span></button>`).join('');
    }
    function svRenderCreds(){
      const q = (svCredIn.value || '').trim().toLowerCase();
      const m = !q ? [] : credIndex.filter(c => c.search.indexOf(q) >= 0).slice(0, 8);
      svCredList.hidden = !m.length;
      svCredList.innerHTML = m.map(c =>
        `<button type="button" class="hw-sg" data-face="${esc(c.face)}" data-deg="${esc(c.degree)}">${esc(c.face)}<span class="hw-sg-meta">${esc(c.degreeLabel)} · opens ${c.roleIds.length} role${c.roleIds.length !== 1 ? 's' : ''}</span></button>`).join('');
    }
    svRoleIn.addEventListener('input', () => { if (svRole){ svRole = null; svRoleIn.classList.remove('picked'); } svRenderRoles(); svSync(); });
    svCredIn.addEventListener('input', () => { if (svCred){ svCred = null; svCredIn.classList.remove('picked'); } svRenderCreds(); svSync(); });
    [ [svRoleIn, svRoleList], [svCredIn, svCredList] ].forEach(([inp, list]) => {
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter'){ e.preventDefault(); const f = list.querySelector('.hw-sg'); if (f) asEl(f).click(); }
        if (e.key === 'Escape' && !list.hidden){ e.stopPropagation(); list.hidden = true; }   // Esc closes the list before it closes the modal
      });
    });
    svRoleList.addEventListener('click', e => {
      const b = hit(e,'[data-role]'); if (!b) return;
      svRole = b.dataset.role;
      const n = nodeById.get(svRole);
      svRoleIn.value = n ? n.label.replace(/\n/g,' ') : '';
      svRoleIn.classList.add('picked');
      svRoleList.hidden = true; svRoleList.innerHTML = '';
      svSync();
    });
    svCredList.addEventListener('click', e => {
      const b = hit(e,'[data-face]'); if (!b) return;
      svCred = { face: b.dataset.face, degree: b.dataset.deg };
      svCredIn.value = svCred.face;
      svCredIn.classList.add('picked');
      svCredList.hidden = true; svCredList.innerHTML = '';
      svSync();
    });
    function svFinish(){
      if (!DATA || Object.values(svAns).some(v => !v)) return;
      // 1) seed the sheet: your education level on the Current layer (name WHAT it's
      //    in from the tile's own panel — the sheet handles details, not the survey)
      const degLbl = (DATA.meta.degrees[svAns.edu]||{}).label || svAns.edu;
      if (!build.education.some(e => e.kind==='real' && e.degree===svAns.edu))
        build.education.push({ id:newId(), kind:'real', label:degLbl, degree:svAns.edu, sub:degLbl, years:'', layer:'current' });
      // 1b) the conditional picks: your job on the Current layer, your target credential on Future
      if (svAns.status === 'working' && svRole && nodeById.has(svRole) && !build.career.some(s => s.roleId === svRole)){
        const rn = nodeById.get(svRole);
        build.career.push({ id:newId(), roleId:svRole, abbr:(rn.abbr||''), family:(rn.family||''), name:rn.label.replace(/\n/g,' '), years:'', layer:'current' });
      }
      if (svAns.status === 'school' && svCred && !build.education.some(e => e.kind==='real' && e.label===svCred.face && e.degree===svCred.degree))
        build.education.push({ id:newId(), kind:'real', label:svCred.face, degree:svCred.degree, sub:(DATA.meta.degrees[svCred.degree]||{}).label||'', years:'', layer:'future' });
      syncPinned(); saveBuild(); renderMyPath();
      // 2) the Career Matrix filter rides the URL for whenever they open that tab;
      //    the survey itself STAYS PUT on the sheet — character creation ends at the character
      const show = svShowSet();   // same set the preview promised — including the never-hide-your-own-pin rule
      const hide = show.length ? (DATA.classes[curClass].pathwayOrder||[]).filter(pw => show.indexOf(pw) < 0) : [];
      const p = new URLSearchParams();
      if (hide.length) p.set('hidepw', hide.join(','));                       // no view param — My Path IS the default
      if (svAns.pull) p.set('lens', svAns.pull);                              // the same answer lenses the expertise map
      try{ history.pushState(null, '', p.toString() ? ('?' + p.toString()) : location.pathname); }catch(err){}
      resetToURL('Sheet started. ' + (hide.length ? (8 - hide.length) + ' of 8 pathways lit when you open the Career Matrix.' : 'The whole map stays lit.'));
      // 3) the next natural keystroke is your name
      setTimeout(() => { const nm = document.getElementById('bp-name'); if (nm) nm.focus(); }, 350);
      // 4) first run only: one flash cascade down the numbered sections, top to bottom.
      //    Shows the spine once, then never again (state, not tour — nothing blocks).
      try{
        if (!localStorage.getItem('hct-guided')){
          localStorage.setItem('hct-guided','1');
          qsa(document,'.bp-sec .bp-secn').forEach((el, i) => setTimeout(() => {
            el.classList.add('guide-flash');
            setTimeout(() => el.classList.remove('guide-flash'), 1050);
          }, 600 + i*700));
        }
      }catch(err){}
    }
    // the survey is a MODAL: dismissal is session-only (no cookie); while the build
    // stays empty a slim strip holds its place so there's always a way back in
    const hwModal = document.getElementById('hct-welcome-modal');
    function hwDismiss(){
      hwDismissed = true;
      if (hwModal) hwModal.classList.remove('open');
      const s = document.getElementById('hct-welcome-strip'); if (s) s.hidden = totalNodes() > 0;
    }
    asEl(document.getElementById('hw-x')).onclick = hwDismiss;
    if (hwModal) hwModal.addEventListener('click', e => { if (e.target === hwModal) hwDismiss(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !popCtl.isOpen() && hwModal && hwModal.classList.contains('open')) hwDismiss();
    });
    asEl(document.getElementById('hw-reopen')).onclick = () => {
      hwDismissed = false;
      const s = document.getElementById('hct-welcome-strip'); if (s) s.hidden = true;
      if (hwModal) hwModal.classList.add('open');
    };
    document.getElementById('hct-welcome').addEventListener('click', e => {
      const chip = hit(e,'.hw-chip');
      if (chip){
        const q = asEl(chip.closest('[data-q]')).dataset.q;
        svAns[q] = (svAns[q] === chip.dataset.v) ? null : chip.dataset.v;   // tap the lit one to un-pick
        chip.closest('.hw-chips').querySelectorAll('.hw-chip').forEach(b =>
          b.setAttribute('aria-pressed', String(b === chip && svAns[q] !== null)));
        svCondSync();   // status and education answers earn their follow-up fields
        svSync();
        return;
      }
      if (hit(e,'#hw-go')){ hwDismiss(); svFinish(); return; }
      const c = hit(e,'[data-hw]'); if (!c) return;
      hwDismiss();   // jumping in IS a dismissal — don't re-pop on the way back this session
      if (c.dataset.hw === 'linkedin'){ openDataModal(); return; }   // the import is the survey's fast path — same sheet, same shapes
      if (c.dataset.hw === 'search'){ selGS.click(); return; }
      setView(c.dataset.hw);
    });
    // Pathways panel: multi-select, immediate apply, stays open. A pathway row
    // toggles its whole category (the old per-pathway Show/Hide all); a specialty
    // row toggles just itself. Turning a specialty on inside a hidden pathway
    // frees the pathway but keeps its other specialties hidden (old checkbox rule).
    document.getElementById('hct-pop-paths-list').addEventListener('click', e => {
      const pwBtn = hit(e,'[data-pwtoggle]'), famBtn = hit(e,'[data-fam]');
      if ((!pwBtn && !famBtn) || !DATA) return;
      const cls = DATA.classes[curClass];
      let focusSel;
      if (pwBtn){
        const pw = pwBtn.dataset.pwtoggle, fams = pathwayFamilies(pw);
        const anyShown = !hiddenPathways.has(pw) && fams.some(f => !hiddenFamilies.has(f));
        if (anyShown){ hiddenPathways.add(pw); fams.forEach(f => hiddenFamilies.add(f)); }
        else { hiddenPathways.delete(pw); fams.forEach(f => hiddenFamilies.delete(f)); }
        focusSel = '[data-pwtoggle="'+pw+'"]';
        announce(((cls.pathways[pw]||{}).label || pw) + (anyShown ? ' hidden' : ' shown'));
      } else {
        const f = famBtn.dataset.fam, pw = famBtn.dataset.pw;
        const on = !hiddenPathways.has(pw) && !hiddenFamilies.has(f);
        if (on) hiddenFamilies.add(f);
        else {
          if (hiddenPathways.has(pw)){ hiddenPathways.delete(pw); pathwayFamilies(pw).forEach(x => { if (x !== f) hiddenFamilies.add(x); }); }
          hiddenFamilies.delete(f);
        }
        focusSel = '[data-fam="'+f+'"]';
        announce(((cls.families[f]||{}).label || f) + (on ? ' hidden' : ' shown'));
      }
      refreshPathwayControls();   // rebuilds the open panel — put focus back on the toggled row
      const el = document.querySelector('#hct-pop-paths-list ' + focusSel); if (el) asEl(el).focus();
      applyFilterChange();
    });
    // applied strip: ✕ on the hidden-pathways chip = show all
    document.getElementById('hct-applied').addEventListener('click', e => {
      const ds = hit(e,'[data-decksimplify]');
      if (ds && DECKS){
        famFanned.delete(ds.dataset.decksimplify);
        render(true); announce('Back to the simple line');
        return;
      }
      const df = hit(e,'[data-deckfold]');
      if (df && DECKS && collapsedFams){
        if (df.dataset.deckfold === '*'){ nodeById.forEach(n => collapsedFams.add(n.family)); famFanned.clear(); famOpenOrder = []; }
        else { collapsedFams.add(df.dataset.deckfold); famFanned.delete(df.dataset.deckfold); famOpenOrder = famOpenOrder.filter(f => f !== df.dataset.deckfold); }
        selectedId = null; closePanel(); render(true);
        announce(df.dataset.deckfold === '*' ? 'All columns folded' : 'Column folded');
        return;
      }
      if (hit(e,'[data-clear="arm"]')){ focusId = selectedId; snapArmed = true; render(true); snapFit(); announce('Focused on the career line'); return; }   // the ONE explicit board move: organize around the viewed role
      if (hit(e,'[data-clear="focus"]')){ if (DECKS && collapsedFams){ exitFocus(); } else { dismissPanel(); } announce('Showing all roles'); return; }   // decks: the focus lifts, an open card STAYS (it's a look); classic keeps the X walk
      if (!hit(e,'[data-clear="paths"]') || !DATA) return;
      hiddenPathways.clear(); hiddenFamilies.clear();
      refreshPathwayControls(); applyFilterChange();
      announce('All pathways shown');
    });

    asEl(document.getElementById('hct-fit')).onclick     = () => { fit(true); userZoomed = true; };   // Fit = an intentional view → lock it so a resize doesn't snap back to the core default
    asEl(document.getElementById('hct-showall')).onclick = () => { hiddenPathways.clear(); hiddenFamilies.clear(); refreshPathwayControls(); applyFilterChange(); announce('All pathways shown'); };
    asEl(document.getElementById('hct-hideall')).onclick = () => {
      const cls = DATA.classes[curClass];
      (cls.pathwayOrder||[]).forEach(pw => hiddenPathways.add(pw));
      [...new Set(cls.nodes.map(n=>n.family))].forEach(f => hiddenFamilies.add(f));
      refreshPathwayControls(); applyFilterChange(); announce('All pathways hidden');
    };
    // the toolbar's - / + pair retired: wheel, pinch, and Fit carry zooming (menu decluttered 2026-08-10)
    asEl(document.getElementById('hct-freelook')).onclick = () => {
      lineageFocus = !lineageFocus;
      document.getElementById('hct-freelook').setAttribute('aria-pressed', String(!lineageFocus));   // pressed = free look ON = focus OFF
      render(false);
      announce(lineageFocus ? 'Career-line focus on' : 'Free look: whole board stays lit');
    };
    asEl(document.getElementById('hct-p-close')).onclick = dismissPanel;   // animated expand, in step with the camera

    // ── phone detent sheet: the ONE shared implementation (HUKit.sheet, item 12).
    // Same class grammar this panel already speaks (dt-peek/half/full), same
    // dismiss path as the X, plus the kit's rAF-batched drag and flick detents.
    if (window.HUKit) HUKit.sheet(document.getElementById('hct-panel'), { onDismiss: dismissPanel });
    // PHONE FLOW: every board paint refreshes the phone home from the same state
    const boardRender = render;
    // @ts-ignore  deliberate wrap: JS allows reassigning a function declaration, TS does not
    render = function(animate){ boardRender(animate); if (isPhone() && DATA) renderPhoneFlow(); };
    const pfHost = document.getElementById('hct-phone-flow');
    if (pfHost) pfHost.addEventListener('click', e => {
      const d = hit(e,'.hpf-deck');
      if (d){ phoneFam = d.dataset.fam; renderPhoneFlow(); announce((((DATA.classes[curClass].families || {})[phoneFam] || {}).label || phoneFam) + ' ladder'); ensurePhoneArm(); return; }
      if (hit(e,'#hpf-back')){ closePhoneFam(true); return; }
      const r = hit(e,'.hpf-role');
      if (r){
        const id = r.dataset.id;
        if (selectedId === id){ selectedId = null; closePanel(); render(false); }   // toggle, like the board
        else { selectedId = id; openPanel(id); render(false); }
      }
    });
    PHONE_MQ.addEventListener('change', e => {
      if (!DATA) return;
      if (e.matches) renderPhoneFlow();
      else if (curView === 'career'){ userZoomed = false; fitDefaultGroup(false); }   // the board returns framed
    });
    qsa(document,'#hct-tabs button').forEach(b => b.onclick = () => setView(b.dataset.view));   // setView resets any open detail on a view change
    // click ANYWHERE off the open panel → dismiss it. Global (not scoped to one view) so a click in any empty area works.
    // The Career Matrix board has its own background-click handler; here we cover My Path + Areas of Expertise.
    document.addEventListener('click', e => {
      const p = document.getElementById('hct-panel');
      if (!p.classList.contains('open')) return;
      if (curView === 'career') return;                 // the board's svg background-click manages the role panel
      if (hit(e,'#hct-panel, .bp-sp-cell, .hct-chip, .bp-sg, [data-go]')) return;   // panel + things that open/switch a panel
      selectedId = null; eduSelId = null; closePanel();
      if (curView === 'path') renderMyPath();
    });
    const eduSearch = asInput(document.getElementById('hct-edu-search'));
    if (eduSearch) eduSearch.oninput = () => eduFilter(eduSearch.value);
    const atlasSearch = asInput(document.getElementById('hct-atlas-search'));
    if (atlasSearch) atlasSearch.oninput = () => atlasFilter(atlasSearch.value);
    const aMulti = document.getElementById('hct-atlas-multi'); if (aMulti) aMulti.onclick = () => setAtlasMultiMode(!atlasMultiMode);
    const aLens = document.getElementById('hct-atlas-lens');
    if (aLens) aLens.addEventListener('click', e => {
      const b = hit(e,'[data-lens]'); if (!b || !DATA) return;
      atlasLens = (atlasLens === b.dataset.lens) ? null : b.dataset.lens;   // tap the lit one → lens off
      applyAtlasLens(); syncURL();
      const mem = lensMembers();
      announce(mem ? ('Lens: ' + LENS_DEF[atlasLens].label + ' · ' + mem.size + ' of ' + DATA.growth.nodes.length + ' areas stay lit')
                   : 'Lens off. The whole map at full strength.');
    });
    const aShown = document.getElementById('hct-atlas-selshown'); if (aShown) aShown.onclick = () => atlasSelectShown();
    const aAdd = document.getElementById('hct-atlas-seladd'); if (aAdd) aAdd.onclick = () => atlasAddSelected();
    const aClr = document.getElementById('hct-atlas-selclear'); if (aClr) aClr.onclick = () => atlasClearSel();
    if (window.ResizeObserver){
      const ab = document.getElementById('hct-atlas-board');
      if (ab) new ResizeObserver(() => { if (atlasBuilt) fitAtlas(); }).observe(ab);
      const eb = document.getElementById('hct-edu-layers');
      if (eb) new ResizeObserver(() => { if (edBuilt && !edUserZoomed) edFit(false); }).observe(eb);
    }
    asEl(document.getElementById('hct-edu-tfit')).onclick  = () => { edUserZoomed = false; edFit(true); };
    asEl(document.getElementById('hct-edu-freelook')).onclick = () => {
      edFreeLook = !edFreeLook;
      document.getElementById('hct-edu-freelook').setAttribute('aria-pressed', String(edFreeLook));
      if (edFreeLook && edSnapLane){ edSnapLane = null; renderEducationMatrix(true); edUserZoomed = false; edFit(true); }
      if (eduMatrixSel != null) edApplySel();
      announce(edFreeLook ? 'Free look on. The whole matrix stays lit.' : 'Free look off. Selecting snaps to its pathway again.');
    };
    asEl(document.getElementById('hct-at-tfit')).onclick  = () => { atUserZoomed = false; fitAtlas(true); };
    asEl(document.getElementById('hct-at-freelook')).onclick = () => {
      atFreeLook = !atFreeLook;
      document.getElementById('hct-at-freelook').setAttribute('aria-pressed', String(atFreeLook));
      if (atFreeLook && atSnapGrp){ atSnapGrp = null; renderGrowthAtlas(true); atUserZoomed = false; fitAtlas(true); }
      if (atActiveId) atApplyFocus();
      announce(atFreeLook ? 'Free look on. The whole map stays lit.' : 'Free look off. Selecting snaps to its group again.');
    };
    // build-planner controls — five growth tracks
    const gBtn = document.getElementById('hct-mp-goals');
    if (gBtn) gBtn.onclick = () => { setLayerView(build.view === 'future' ? 'both' : 'future');
      announce(build.view === 'future' ? 'Goals only. Current tiles ghost back; the plan stands alone.' : 'Everything back, layered.'); };
    // QA: the advice tidbits collapse once someone actually explores (persisted; the "?" popover carries the grammar)
    const hintsMin = () => { const sh = document.getElementById('hct-shell'); if (sh) sh.classList.add('hints-min'); try{ localStorage.setItem('hct-hints-min','1'); }catch(e){} };
    try{ if (localStorage.getItem('hct-hints-min')){ const sh = document.getElementById('hct-shell'); if (sh) sh.classList.add('hints-min'); } }catch(e){}
    ['hct-svg','hct-edu-svg','hct-atlas-svg'].forEach(id => { const el = document.getElementById(id); if (el) el.addEventListener('pointerdown', hintsMin, { once: true }); });
    // flow links: any [data-goview] jumps to that view — the sheet → matrices → sheet loop
    document.addEventListener('click', e => {
      const g = hit(e,'[data-goview]'); if (!g || !DATA) return;
      setView(g.dataset.goview);
    });
    // station picker shell: × and backdrop close it
    const stModal = document.getElementById('bp-station-modal');
    asEl(document.getElementById('bp-station-x')).onclick = () => stationModal(false);
    if (stModal) stModal.addEventListener('click', e => { if (e.target === stModal) stationModal(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && stModal && stModal.classList.contains('open') && !popCtl.isOpen()) stationModal(false); });
    asEl(document.getElementById('hct-mp-clear')).onclick = (e) => { e.stopPropagation(); resetBuild(); };
    const mpExport = document.getElementById('hct-mp-export'); if (mpExport) mpExport.onclick = (e) => { e.stopPropagation(); exportMyPath(); };
    const mpShare = document.getElementById('hct-mp-share'); if (mpShare) mpShare.onclick = (e) => { e.stopPropagation(); exportShareCard(); };
    const mpData = document.getElementById('hct-mp-data'); if (mpData) mpData.onclick = (e) => { e.stopPropagation(); openDataModal(); };
    // ⋯ More — Save/Load, Export, Reset share one overflow menu (toolbar chrome pruned 2026-07)
    const moreBtn = document.getElementById('hct-mp-more'), moreMenu = document.getElementById('hct-mp-menu');
    const moreClose = () => { if (moreMenu) moreMenu.classList.remove('open'); if (moreBtn) moreBtn.setAttribute('aria-expanded','false'); };
    if (moreBtn && moreMenu){
      moreBtn.onclick = (e) => { e.stopPropagation(); const open = !moreMenu.classList.contains('open'); moreMenu.classList.toggle('open', open); moreBtn.setAttribute('aria-expanded', String(open)); };
      qsa(moreMenu,'.bp-addmenu-item').forEach(b => b.addEventListener('click', moreClose));
      document.addEventListener('click', e => { if (!hit(e,'.mp-more')) moreClose(); });
    }
    const dX = document.getElementById('bp-data-x'); if (dX) dX.onclick = closeDataModal;
    const dCopy = document.getElementById('bp-data-copy'); if (dCopy) dCopy.onclick = copyBuildCode;
    const dDl = document.getElementById('bp-data-dl'); if (dDl) dDl.onclick = downloadBuildFile;
    const dImport = document.getElementById('bp-data-import'); if (dImport) dImport.onclick = doImport;
    const dFile = document.getElementById('bp-data-file'); if (dFile) dFile.onchange = (e) => { loadBuildFile(asInput(e.target).files && asInput(e.target).files[0]); asInput(e.target).value = ''; };
    const liFile = document.getElementById('bp-li-file'); if (liFile) liFile.onchange = (e) => { importLinkedInPdf(asInput(e.target).files && asInput(e.target).files[0]); asInput(e.target).value = ''; };
    const dModal = document.getElementById('bp-data-modal'); if (dModal) dModal.addEventListener('click', (e) => { if (e.target === dModal) closeDataModal(); });
    // the legend rides the popover contract now: build once on first open, sheet on phone
    const selHelp = document.getElementById('hct-help'), popHelp = document.getElementById('hct-pop-help');
    if (selHelp && popHelp) selHelp.addEventListener('click', () => openPopover(selHelp, popHelp, renderLegend));
    asEl(document.getElementById('bp-name')).oninput  = (e) => { build.name = asInput(e.target).value; saveBuild(); };
    asEl(document.getElementById('bp-goal')).oninput  = (e) => { build.goal = asInput(e.target).value; saveBuild(); renderNextSteps(); };
    // sw/notes textareas + the section search bars are inside the movable dashboard cards → wired in renderDash()
    const addSecBtn = document.getElementById('bp-add-section');
    if (addSecBtn) addSecBtn.onclick = (e) => { e.stopPropagation(); document.getElementById('bp-add-menu').classList.toggle('open'); };
    document.addEventListener('click', e => { if (!hit(e,'.bp-addwrap')){ const m=document.getElementById('bp-add-menu'); if (m) m.classList.remove('open'); } });
    document.addEventListener('click', e => { if (!hit(e,'.bp-pick')) qsa(document,'.bp-suggest:not(.bp-float).open').forEach(s=>s.classList.remove('open')); });

    window.addEventListener('resize', () => { fit(false); renderMyPath(); });

    fetch('/assets/data/career-tree-bls.json').then(r=>r.ok?r.json():null).then(b => { BLS = b; }).catch(()=>{});   // BLS pay/outlook enrichment; optional
    fetch('/assets/data/career-tree-creds.json').then(r=>r.ok?r.json():null).then(c => { CREDS = c; }).catch(()=>{});   // credential reality (pass rate / length / fee); optional
    fetch('/assets/data/career-tree-growth-detail.json').then(r=>r.ok?r.json():null).then(d => { growthDetail = (d && d.detail) || {}; if (curView==='path') renderNextSteps(); }).catch(()=>{});   // per-tile how/show enrichment; optional
    fetch('/assets/data/career-tree.json').then(r=>r.json()).then(d => {
      DATA = d;
      asEl(document.getElementById('hct-loading')).style.display = 'none';
      loadClass('roles');
      buildCredIndex();
      // restore any URL-addressed view BEFORE the first paint — invalid params
      // degrade silently to the defaults (view=path, metric=fam, all shown)
      urlCtl.begin();
      const v0 = applyURLState();
      setColorMode(colorMode);
      refreshPathwayControls();
      updateClassChrome();
      document.getElementById('hct-blurb').textContent = d.classes.roles.blurb;
      renderMyPath();
      setView(v0);                                  // default lands on My Path; the Career Matrix board + Education Matrix render lazily on first open (saves ~1500 DOM nodes up front)
      urlCtl.end();
      if (pendingDL) consumeDeepLink();             // article/preset deep link (?role/?cred/?area) — leave the author's URL intact this boot
      else syncURL();                               // re-serialize once (replace) so a mangled shared link self-normalizes
    }).catch(err => {
      document.getElementById('hct-loading').textContent = 'Could not load the tree data.';
      console.error('career-tree load', err);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
