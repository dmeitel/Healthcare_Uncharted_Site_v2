let vendors = [];

const SECTOR_LABEL = {scribing:'Ambient Scribing',clinical:'Clinical AI',rcm:'Revenue Cycle',radiology:'Radiology AI',ehr:'EHR / Core',rx:'Pharmacy & Rx',device:'Medical Devices',interop:'Interop / Interface',labs:'Labs / Diagnostics',imaging:'Imaging / PACS',cardio:'Cardiovascular',rpm:'Remote Monitoring',telehealth:'Telehealth',engage:'Patient Engagement',analytics:'Pop Health & Analytics',cyber:'Cybersecurity',behavioral:'Behavioral Health',research:'Clinical Research',orgs:'Professional Orgs',cautionary:'Cautionary',cloud:'Cloud & AI Infrastructure',payer:'Payers & PBMs',supply:'Supply Chain & GPO',staffing:'Workforce & Staffing',retail:'Retail & Consumer Health'};
const SECTOR_COLOR = {scribing:'#4ECDC4',clinical:'#6aabff',rcm:'#E8A838',radiology:'#a99ee8',ehr:'#4ec99a',rx:'#e879b6',device:'#38bdf8',interop:'#f59e6b',labs:'#a8c93a',imaging:'#a78bfa',cardio:'#fb7185',telehealth:'#2dd4bf',engage:'#fbbf24',rpm:'#34d399',cyber:'#94a3b8',analytics:'#818cf8',behavioral:'#f0abfc',research:'#67e8f9',orgs:'#d6b56a',cautionary:'#f08080',cloud:'#7dd3fc',payer:'#f9a8d4',supply:'#fdba74',staffing:'#bef264',retail:'#fca5a5'};
const PS_LABEL = {p1:'Patient', p2a:'Provider · Clinical', p2b:'Provider · Docs & RCM', p3:'Payer', p4:'Policymaker'};
const SECTOR_GROUPS = [
  {label:'Core Systems', sectors:['ehr','interop','imaging']},
  {label:'AI & Clinical', sectors:['scribing','clinical','radiology']},
  {label:'Devices & Diagnostics', sectors:['device','labs','cardio','rpm','rx']},
  {label:'Care & Engagement', sectors:['telehealth','engage','behavioral']},
  {label:'Operations & Data', sectors:['rcm','analytics','research']},
  {label:'Payers, Supply & Staffing', sectors:['payer','supply','staffing']},
  {label:'Big Tech & Retail', sectors:['cloud','retail']},
  {label:'Security & Orgs', sectors:['cyber','orgs','cautionary']},
];
const STATUS_CLASS = {active:'status-active',emerging:'status-emerging',cautionary:'status-cautionary',discontinued:'status-discontinued',org:'status-org'};
const STATUS_ORDER = {active:0,emerging:1,org:2,cautionary:3,discontinued:4};
const OWN_LABEL = {public:'Public', private:'Private', pe:'PE-owned', subsidiary:'Subsidiary', nonprofit:'Nonprofit', defunct:'Defunct'};
const SHARE_LABEL = {pure:'Pure-play healthcare', majority:'Mostly healthcare', division:'Healthcare division', minor:'Healthcare side line'};
// standard 11-column US tile cartogram, [col,row]
const TILE_GRID = {AK:[1,1],ME:[11,1],VT:[10,2],NH:[11,2],WA:[1,3],ID:[2,3],MT:[3,3],ND:[4,3],MN:[5,3],WI:[6,3],MI:[7,3],NY:[9,3],MA:[10,3],RI:[11,3],OR:[1,4],NV:[2,4],WY:[3,4],SD:[4,4],IA:[5,4],IL:[6,4],IN:[7,4],OH:[8,4],PA:[9,4],NJ:[10,4],CT:[11,4],CA:[1,5],UT:[2,5],CO:[3,5],NE:[4,5],MO:[5,5],KY:[6,5],WV:[7,5],VA:[8,5],MD:[9,5],DE:[10,5],AZ:[2,6],NM:[3,6],KS:[4,6],AR:[5,6],TN:[6,6],NC:[7,6],SC:[8,6],DC:[9,6],OK:[4,7],LA:[5,7],MS:[6,7],AL:[7,7],GA:[8,7],HI:[1,8],TX:[4,8],FL:[9,8]};
const STATE_NAME = {AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',CT:'Connecticut',DE:'Delaware',DC:'Washington DC',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming'};

let activeSector = 'all';
let activeSort = 'az';
let openVendor = null;   // slug of the open vendor (the page's scope), or null
let detailOpener = null; // the card that opened the panel — focus returns to it
const slug = s2 => String(s2).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
let bySlug = new Map();  // built once after the data loads (names are unique; no id field exists)
let activeState = 'all';
let activeOwn = 'all';
let activeShare = 'all';

function sectorCounts() { const c = {}; vendors.forEach(v => c[v.sector] = (c[v.sector] || 0) + 1); return c; }

function buildSidebar() {
  const counts = sectorCounts();
  let h = `<button class="vd-cat vd-all" data-sector="all" aria-pressed="false"><span class="vd-catname">All sectors</span><span class="ct">${vendors.length}</span></button>`;
  for (const g of SECTOR_GROUPS) {
    h += `<div class="vd-group-label">${g.label}</div>`;
    for (const s of g.sectors) {
      h += `<button class="vd-cat" data-sector="${s}" aria-pressed="false"><span class="vd-catname"><span class="vd-dot" style="background:${SECTOR_COLOR[s]}"></span>${SECTOR_LABEL[s]}</span><span class="ct">${counts[s] || 0}</span></button>`;
    }
  }
  const nav = document.getElementById('vdNav');
  nav.innerHTML = h;
  nav.querySelectorAll('.vd-cat').forEach(b => b.onclick = () => setSector(b.dataset.sector));
}

const sectorName = s => s === 'all' ? 'All sectors' : (SECTOR_LABEL[s] || s);

// One commit path for BOTH sector surfaces (sidebar and selector): render()
// repaints the sidebar active state, the selector face, and the applied strip.
function setSector(s) { activeSector = s; render(); syncURL(); announce('Sector: ' + sectorName(s)); }
function setSort(s) { activeSort = s; render(); syncURL(); }
function setOwn(s) { activeOwn = s; render(); syncURL(); announce('Ownership: ' + (s === 'all' ? 'All' : OWN_LABEL[s])); }
function setShare(s) { activeShare = s; render(); syncURL(); announce('Focus: ' + (s === 'all' ? 'All' : SHARE_LABEL[s])); }
function setState(s) {
  activeState = (activeState === s) ? 'all' : s;   // click the active tile again = clear
  render(); syncURL();
  announce('State: ' + (activeState === 'all' ? 'All' : (activeState === 'INTL' ? 'Outside the US' : STATE_NAME[activeState])));
}
const hqStr = v => v.hq ? (v.hq.city + ', ' + (v.hq.state || v.hq.country)) : '';

// one polite live region — announce COMMITTED changes only, never keystrokes
function announce(msg) {
  const el = document.getElementById('a11yLive'); if (!el) return;
  el.textContent = '';                                // clear first so repeats re-announce
  requestAnimationFrame(() => { el.textContent = msg; });
}

function sortList(list) {
  return list.slice().sort((a, b) => {
    if (activeSort === 'status') { const d = (STATUS_ORDER[a.v.status] ?? 9) - (STATUS_ORDER[b.v.status] ?? 9); if (d) return d; }
    else if (activeSort === 'sector') { const d = SECTOR_LABEL[a.v.sector].localeCompare(SECTOR_LABEL[b.v.sector]); if (d) return d; }
    return a.v.name.localeCompare(b.v.name);
  });
}

function cardHTML(v, i) {
  return `<div class="vendor-card" onclick="openDetail(${i})">
    <div class="vc-top">
      <div class="vc-header"><div class="vc-name">${v.name}</div><div class="vc-status ${STATUS_CLASS[v.status]}">${v.statusLabel}</div></div>
      <div class="vc-owner">${v.owner}${v.hq ? ' &middot; ' + hqStr(v) : ''}</div>
      <div class="vc-desc">${v.desc}</div>
    </div>
    <div class="vc-bottom">
      <div class="vc-tags"><span class="vc-tag tag-${v.sector}">${SECTOR_LABEL[v.sector]}</span>${v.ps.map(p => `<span class="vc-tag tag-${p}">${PS_LABEL[p] || p.toUpperCase()}</span>`).join('')}</div>
      <span class="vc-arrow">&#8594;</span>
    </div></div>`;
}

function render() {
  const q = (document.getElementById('searchInput').value || '').toLowerCase();
  let list = vendors.map((v, i) => ({ v, i })).filter(({ v }) => {
    const sectorMatch = activeSector === 'all' || v.sector === activeSector;
    const stateMatch = activeState === 'all' || (v.hq && (activeState === 'INTL' ? !!v.hq.country : v.hq.state === activeState));
    const ownMatch = activeOwn === 'all' || v.ownership === activeOwn;
    const shareMatch = activeShare === 'all' || v.hcShare === activeShare;
    // search sweeps the whole record: name, owner, prose, watch line, stats, HQ, parent, ticker
    const hay = [v.name, v.owner, v.desc, v.detail, v.watch || '', SECTOR_LABEL[v.sector], v.parent || '', v.ticker || '', hqStr(v), (v.hq && v.hq.state && STATE_NAME[v.hq.state]) || '', (v.stats || []).map(s => s.join(' ')).join(' ')].join(' ').toLowerCase();
    const searchMatch = !q || hay.includes(q);
    return sectorMatch && stateMatch && ownMatch && shareMatch && searchMatch;
  });
  list = sortList(list);
  const grid = document.getElementById('vendorGrid');
  grid.innerHTML = list.length ? list.map(({ v, i }) => cardHTML(v, i)).join('') : '<div class="empty-state"><strong>No vendors found</strong>Try a different search or filter</div>';
  document.getElementById('resultCount').textContent = list.length + (list.length === 1 ? ' vendor' : ' vendors');
  document.querySelectorAll('#vdNav .vd-cat').forEach(b => { const on = b.dataset.sector === activeSector; b.classList.toggle('active', on); b.setAttribute('aria-pressed', on); });
  document.querySelectorAll('#hqGrid .hqt').forEach(b => { const on = b.dataset.st === activeState; b.classList.toggle('active', on); b.setAttribute('aria-pressed', on); });
  document.getElementById('ownSel').value = activeOwn;
  document.getElementById('sortSel').value = activeSort;
  document.getElementById('shareSel').value = activeShare;
  document.getElementById('selSectorVal').textContent = sectorName(activeSector);
  renderAppliedStrip();
}

// ── v2 selector — the popover contract (HU-CONTROL-ARCHITECTURE-V2) ──────
// One popover open at a time; Esc closes and returns focus to the trigger;
// outside click closes; arrows walk the options; under 700px the popover
// renders as a bottom sheet (CSS). The face always shows the current sector.
// the contract itself is HUKit.pop's now (kit extraction 2026-08-17)
const popCtl = HUKit.pop({});
function closePop(refocus) { popCtl.close(refocus); }
function openPopover(btn, pop, build) { popCtl.open(btn, pop, build); }
document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      if (popCtl.escape()) return;   // one step per press: the kit owns the popover rung
      const dp = document.getElementById('detailPanel');
      if (dp && dp.classList.contains('open')) closeDetail();   // then the detail panel, same walk as its X
    });
// (arrows / Home / End are the kit's, delegated across every .selector-pop)
document.querySelectorAll('.selector-pop').forEach(pop => {
  pop.querySelector('[data-close]').addEventListener('click', () => closePop(true));
});
function buildSectorPop() {
  const counts = sectorCounts();
  let h = `<button class="pop-opt" role="option" aria-selected="${activeSector === 'all'}" data-sector="all">All sectors (${vendors.length})</button>`;
  for (const g of SECTOR_GROUPS) {
    h += `<div class="pop-sec">${g.label}</div>`;
    for (const s of g.sectors) h += `<button class="pop-opt" role="option" aria-selected="${s === activeSector}" data-sector="${s}">${SECTOR_LABEL[s]} (${counts[s] || 0})</button>`;
  }
  document.getElementById('popSectorList').innerHTML = h;
}
document.getElementById('selSector').addEventListener('click', () => openPopover(document.getElementById('selSector'), document.getElementById('popSector'), buildSectorPop));
document.getElementById('popSectorList').addEventListener('click', e => { const t = e.target.closest('[data-sector]'); if (!t) return; closePop(true); setSector(t.dataset.sector); });

// ── preset views (crit #4): authored starting points, each just a URL ────
const PRESETS = [
  { name: 'The ambient scribe boom', q: '?sector=scribing' },
  { name: 'The EHR incumbents',      q: '?sector=ehr' },
  { name: 'Proceed with caution',    q: '?sector=cautionary' },
  { name: 'Big tech moves in',       q: '?sector=cloud' },
  { name: 'The payer giants',        q: '?sector=payer' },
  { name: 'The Utah cluster',        q: '?state=UT' },
];
function buildViewsPop() {
  document.getElementById('popViewsList').innerHTML = PRESETS.map(p =>
    `<button class="pop-opt" role="option" data-view-q="${p.q}">${p.name}</button>`).join('');
}
document.getElementById('selViews').addEventListener('click', () => openPopover(document.getElementById('selViews'), document.getElementById('popViews'), buildViewsPop));
document.getElementById('popViewsList').addEventListener('click', e => {
  const t = e.target.closest('[data-view-q]'); if (!t) return;
  closePop(true);
  try { history.pushState(null, '', t.dataset.viewQ); } catch (err) {}
  // a preset lands CLEAN: zero every state the URL can carry, then re-apply from it
  activeSector = 'all'; activeState = 'all'; activeOwn = 'all'; activeShare = 'all';
  activeSort = 'az'; document.getElementById('searchInput').value = ''; openVendor = null;
  urlCtl.suspend(() => {
    applyURLState(); render();
    if (openVendor) openDetail(bySlug.get(openVendor)); else closeDetail();
  });
  announce('View: ' + t.textContent);
});

// applied strip: the active sector when the sidebar isn't there to show it.
// CSS hides the strip at >=1100px, where the sidebar already IS the state.
function renderAppliedStrip() {
  const strip = document.getElementById('vdApplied'); if (!strip) return;
  const chips = [];
  if (activeSector !== 'all') chips.push(`<span class="applied-chip">Sector: <b>${SECTOR_LABEL[activeSector]}</b><button class="ac-x" data-clear="sector" aria-label="Clear the sector filter">&#10005;</button></span>`);
  if (activeState !== 'all') chips.push(`<span class="applied-chip">HQ: <b>${activeState === 'INTL' ? 'Outside the US' : STATE_NAME[activeState]}</b><button class="ac-x" data-clear="state" aria-label="Clear the state filter">&#10005;</button></span>`);
  if (activeOwn !== 'all') chips.push(`<span class="applied-chip">Ownership: <b>${OWN_LABEL[activeOwn]}</b><button class="ac-x" data-clear="own" aria-label="Clear the ownership filter">&#10005;</button></span>`);
  if (activeShare !== 'all') chips.push(`<span class="applied-chip">Focus: <b>${SHARE_LABEL[activeShare]}</b><button class="ac-x" data-clear="share" aria-label="Clear the focus filter">&#10005;</button></span>`);
  strip.innerHTML = chips.join('');
  strip.hidden = !chips.length;
}
document.getElementById('vdApplied').addEventListener('click', e => {
  const t = e.target.closest('[data-clear]'); if (!t) return;
  const k = t.dataset.clear;
  if (k === 'sector') setSector('all');
  else if (k === 'state') { activeState = 'all'; render(); syncURL(); }
  else if (k === 'own') setOwn('all');
  else if (k === 'share') setShare('all');
});

// ── URL-addressable views: ?sector=<key>, default (all) omitted ──────────
// Sector keys are stable slugs (scribing, ehr, rcm...), so shared links
// survive reordering. A sector flip is an in-view tweak — replaceState
// only; back walks pages, not filter changes.
function stateToParams() {
  const p = new URLSearchParams();
  if (activeSector !== 'all') p.set('sector', activeSector);
  if (activeState !== 'all') p.set('state', activeState);
  if (activeOwn !== 'all') p.set('own', activeOwn);
  if (activeShare !== 'all') p.set('share', activeShare);
  const q = (document.getElementById('searchInput').value || '').trim();
  if (q) p.set('q', q);
  if (activeSort !== 'az') p.set('sort', activeSort);
  if (openVendor) p.set('vendor', openVendor);
  return p;
}
// the open vendor is the scope: back walks OUT of it; filter/search churn replaces.
// debounce, because typing must not spam replaceState (Safari rate-limits it).
const urlCtl = HUKit.urlState({
  url: () => { const q = stateToParams().toString(); return q ? ('?' + q) : location.pathname; },
  scope: () => openVendor || '',
  debounce: 300
});
function syncURL() { urlCtl.sync(); }
function queueSyncURL() { urlCtl.queue(); }
function applyURLState() {
  const p = new URLSearchParams(location.search);
  const s = p.get('sector'), st = p.get('state'), ow = p.get('own'), sh = p.get('share');
  activeSector = (s && SECTOR_LABEL[s]) ? s : 'all';  // invalid params degrade silently to the default
  activeState = (st && (TILE_GRID[st] || st === 'INTL')) ? st : 'all';
  activeOwn = (ow && OWN_LABEL[ow]) ? ow : 'all';
  activeShare = (sh && SHARE_LABEL[sh]) ? sh : 'all';
  const qq = p.get('q'); document.getElementById('searchInput').value = qq || '';
  const so = p.get('sort'); activeSort = (so === 'sector' || so === 'status') ? so : 'az';
  const vv = p.get('vendor'); openVendor = (vv && bySlug.has(vv)) ? vv : null;
  urlCtl.mark(openVendor || '');   // the next real change is measured from where we landed
}
// popstate = reset to defaults, re-apply from the URL, render — one path
window.addEventListener('popstate', () => {
  urlCtl.suspend(() => {
    activeSector = 'all'; activeState = 'all'; activeOwn = 'all'; activeShare = 'all';
    activeSort = 'az'; document.getElementById('searchInput').value = ''; openVendor = null;
    applyURLState(); render();
    if (openVendor) openDetail(bySlug.get(openVendor)); else closeDetail();
  });
});

function openDetail(idx) {
  const v = vendors[idx];
  document.getElementById('dp-name').textContent = v.name;
  document.getElementById('dp-owner').textContent = v.owner + (v.hq ? ' · ' + hqStr(v) : '');
  document.getElementById('dp-detail').textContent = v.detail;
  // structured schema rows first, then the editorial stats (minus a duplicate Founded)
  const meta = [];
  if (v.hq) meta.push(['HQ', hqStr(v)]);
  if (v.founded) meta.push(['Founded', v.founded]);
  if (v.ownership) meta.push(['Ownership', OWN_LABEL[v.ownership] + (v.ticker ? ' · ' + v.ticker : '')]);
  if (v.parent) meta.push(['Parent', v.parent]);
  if (v.hcShare) meta.push(['Healthcare focus', SHARE_LABEL[v.hcShare]]);
  const editorial = v.stats.filter(([k]) => !(k === 'Founded' && v.founded));
  document.getElementById('dp-stats').innerHTML = meta.concat(editorial).map(([k, val]) =>
    `<div class="dp-stat-row"><span class="dp-stat-key">${k}</span><span class="dp-stat-val">${val}</span></div>`).join('');
  document.getElementById('dp-tags').innerHTML =
    `<span class="vc-tag tag-${v.sector}">${SECTOR_LABEL[v.sector]}</span>` +
    v.ps.map(p => `<span class="vc-tag tag-${p}">${PS_LABEL[p] || p.toUpperCase()}</span>`).join('');
  document.getElementById('dp-watch').textContent = v.watch;
  document.getElementById('dp-watch-wrap').style.display = v.watch ? 'block' : 'none';
  openVendor = slug(v.name);
  const panel = document.getElementById('detailPanel');
  if (!panel.classList.contains('open')) detailOpener = document.activeElement;   // focus returns here on close
  panel.classList.add('open');
  const x = panel.querySelector('.icon-btn, button');
  if (x && !urlCtl.isApplying()) x.focus();
  syncURL();
}

function closeDetail() {
  document.getElementById('detailPanel').classList.remove('open');
  openVendor = null; syncURL();
  if (detailOpener && detailOpener.focus && !urlCtl.isApplying()) detailOpener.focus();   // the popover contract, same as closePop(true)
  detailOpener = null;
}

// ── HQ tile map: one button per state, count printed on the tile ─────────
function buildHQMap() {
  const counts = {}; let intl = 0;
  vendors.forEach(v => { if (!v.hq) return; if (v.hq.state) counts[v.hq.state] = (counts[v.hq.state] || 0) + 1; else intl++; });
  const lvl = n => n >= 11 ? 'l4' : n >= 6 ? 'l3' : n >= 3 ? 'l2' : 'l1';
  let h = '';
  for (const st of Object.keys(TILE_GRID)) {
    const [col, row] = TILE_GRID[st], n = counts[st] || 0;
    h += `<button class="hqt ${n ? lvl(n) : 'z'}" data-st="${st}" style="grid-column:${col};grid-row:${row}" title="${STATE_NAME[st]}: ${n} vendor${n === 1 ? '' : 's'}" aria-label="${STATE_NAME[st]}: ${n} vendor${n === 1 ? '' : 's'}" aria-pressed="false" ${n ? '' : 'disabled'}><span class="ab">${st}</span><span class="n">${n || ''}</span></button>`;
  }
  h += `<button class="hqt hq-intl ${intl ? lvl(intl) : 'z'}" data-st="INTL" style="grid-column:10 / span 2;grid-row:8" title="Headquartered outside the US: ${intl}" aria-pressed="false" ${intl ? '' : 'disabled'}><span class="ab">Non-US</span><span class="n">${intl || ''}</span></button>`;
  const grid = document.getElementById('hqGrid');
  grid.innerHTML = h;
  grid.querySelectorAll('.hqt').forEach(b => b.onclick = () => setState(b.dataset.st));
}

// restore the URL view before the first paint — a shared ?sector link lands
// filtered; the re-serialize after render self-normalizes a mangled param
fetch('/assets/data/vendors.json').then(function(r){return r.json();}).then(function(d){ vendors = d.vendors || d; bySlug = new Map(vendors.map(function(v,i){ return [slug(v.name), i]; })); buildSidebar(); buildHQMap(); applyURLState(); render(); if (openVendor) { urlCtl.suspend(function(){ openDetail(bySlug.get(openVendor)); }); } syncURL(); }).catch(function(e){
  console.error('vendor data load failed', e);
  document.getElementById('vendorGrid').innerHTML = '<div class="empty-state"><strong>Couldn&#39;t load the vendor directory</strong>Check your connection and refresh.</div>';
  announce('Couldn\'t load the vendor directory. Check your connection and refresh.');
});

// ── Market-share carousel ────────────────────────────────────────────────
// One slide per sector that has credible, sourced single-vendor market share.
// (RCM, radiology AI, and clinical AI are too fragmented for an honest % chart.)
const SHARE_SLIDES = [
  { group:'EHR · Acute care', sub:'Share of U.S. hospitals · KLAS 2024',
    data:[{n:'Epic',v:42.3},{n:'Oracle Health',v:22.9},{n:'MEDITECH',v:14.8},{n:'TruBridge',v:7.6},{n:'Altera',v:3.0},{n:'MEDHOST',v:2.3},{n:'Other',v:6.7}],
    src:'Source: <a href="https://engage.klasresearch.com/blog/us-acute-care-ehr-market-share-in-2024/805/" target="_blank" rel="noopener">KLAS Research, US Acute Care EHR Market Share 2024</a> (% of hospitals). By beds the gap is wider: Epic ~54.9%, Oracle ~22.1%, MEDITECH ~12.7%.' },
  { group:'EHR · Ambulatory', sub:'Share of installations · Definitive Healthcare 2025',
    data:[{n:'Epic',v:19.5},{n:'eClinicalWorks',v:11.9},{n:'athenahealth',v:6.9},{n:'Oracle Cerner',v:5.4},{n:'NextGen',v:4.2},{n:'ModMed',v:3.6},{n:'Veradigm',v:3.1},{n:'Greenway',v:2.2}],
    src:'Source: <a href="https://www.definitivehc.com/blog/top-ambulatory-ehr-systems" target="_blank" rel="noopener">Definitive Healthcare, Top Ambulatory EHR Vendors 2025</a> (share of installations). The long tail beyond the top 10 holds the rest.' },
  { group:'Ambient AI scribes', sub:'Share of market · Menlo Ventures 2025',
    data:[{n:'Microsoft / Nuance',v:33},{n:'Abridge',v:30},{n:'Ambience',v:13},{n:'Suki',v:10},{n:'Freed',v:4},{n:'Nabla',v:4},{n:'Other',v:7}],
    src:'Source: Menlo Ventures via <a href="https://www.beckershospitalreview.com/healthcare-information-technology/ai/ambient-ai-scribes-by-market-share/" target="_blank" rel="noopener">Becker’s Hospital Review, 2025</a> (~$600M market). The top two hold nearly two-thirds.' },
];

const MS_MAX_ROWS = Math.max.apply(null, SHARE_SLIDES.map(s => s.data.length));
function renderShareChart(id, data){
  const el = document.getElementById(id); if (!el) return;
  const max = Math.max.apply(null, data.map(d => d.v));
  const rows = data.map(d => {
    const cls = d.n === 'Other' ? 'other' : (d.v === max ? 'lead' : '');
    return '<div class="ms-row"><div class="ms-name">' + d.n + '</div>' +
           '<div class="ms-track"><div class="ms-fill ' + cls + '" style="width:' + (d.v / max * 100).toFixed(1) + '%"></div></div>' +
           '<div class="ms-val">' + d.v + '%</div></div>';
  });
  // pad shorter slides with invisible rows so every chart is the same height (no shift on rotate)
  for (let k = data.length; k < MS_MAX_ROWS; k++){
    rows.push('<div class="ms-row" style="visibility:hidden" aria-hidden="true"><div class="ms-name">&nbsp;</div><div class="ms-track"></div><div class="ms-val">&nbsp;</div></div>');
  }
  el.innerHTML = rows.join('');
}

let msIdx = 0, msTimer = null;
const msReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function showSlide(i){
  msIdx = (i + SHARE_SLIDES.length) % SHARE_SLIDES.length;
  const s = SHARE_SLIDES[msIdx];
  document.getElementById('ms-group').textContent = s.group;
  document.getElementById('ms-sub').textContent = s.sub;
  document.getElementById('ms-src').innerHTML = s.src;
  const chart = document.getElementById('ms-chart');
  chart.parentElement.style.animation = 'none'; void chart.parentElement.offsetWidth; chart.parentElement.style.animation = '';
  renderShareChart('ms-chart', s.data);
  document.querySelectorAll('#ms-dots .ms-dot').forEach((d, j) => d.classList.toggle('active', j === msIdx));
}
function msRestart(){ if (msReduce) return; if (msTimer) clearInterval(msTimer); msTimer = setInterval(() => showSlide(msIdx + 1), 6500); }
(function initCarousel(){
  const dots = document.getElementById('ms-dots');
  dots.innerHTML = SHARE_SLIDES.map((s, j) => '<button class="ms-dot" data-i="' + j + '" aria-label="' + s.group + '"></button>').join('');
  dots.querySelectorAll('.ms-dot').forEach(d => d.onclick = () => { showSlide(+d.dataset.i); msRestart(); });
  document.getElementById('ms-next').onclick = () => { showSlide(msIdx + 1); msRestart(); };
  document.getElementById('ms-prev').onclick = () => { showSlide(msIdx - 1); msRestart(); };
  const wrap = document.querySelector('.ehr-market');
  wrap.addEventListener('mouseenter', () => { if (msTimer) clearInterval(msTimer); });
  wrap.addEventListener('mouseleave', msRestart);
  showSlide(0); msRestart();
})();
