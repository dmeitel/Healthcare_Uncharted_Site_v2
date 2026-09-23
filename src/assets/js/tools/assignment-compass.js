/**
 * Cost of Living Comparison (formerly Assignment Compass) · two-location take-home and cost compare.
 *
 * Lifted out of an inline <script> on 2026-08-22 (docs/HU-BUILD-HARDENING-2026-08-22.md).
 * Loaded as type="module": deferred, scoped, cacheable, and visible to `npm run check`.
 *
 * Reads two globals the page loads as classic scripts beforehand: window.CompassEngine
 * (assignment-compass-engine.js) and HUKit (hu-kit.js). STATES is parsed from the
 * #ac-states JSON block, which Nunjucks generates from the geo registry.
 */
'use strict';
(function () {
'use strict';

/* STATES arrives as JSON in the markup: a module is not Nunjucks-processed */
var STATES = JSON.parse(document.getElementById('ac-states').textContent);
delete STATES.__;   // sentinel that lets the Nunjucks loop end on a comma; not a state

var E = window.CompassEngine;
/** id lookup. See the note in docs/HU-BUILD-HARDENING-2026-08-22.md on typing $.
 * @param {string} id
 * $ is an untyped id lookup by nature: its callers want .value, .disabled,
 * .getContext and .dataset off the same call, and an intersection of those
 * interfaces collapses to never. Typing it any keeps the checks that actually
 * catch bugs (undefined names, bad calls, arithmetic) without fighting the DOM
 * at forty call sites.
 * @returns {any}
 */
var $ = function (id) { return /** @type {any} */ (document.getElementById(id)); };

var DATA = null, COUNTIES = null, CDATA = null, cdataLoading = false;
var LDATA = null, ldataLoading = false;
var overrides = {};
var lastPd = null;          // last per diem render, feeds the negotiation card
var lastCalc = null;        // last computed positions, same reason
var dirty = false;          // any hand edit clears the EXAMPLE marker
var activePreset = null;    // which preset chip is lit, null once edited
var prevScenario = null;    // querystring snapshot for the one-shot reset undo
var CATS = [
  ['housing', 'Housing'],
  ['utilities', 'Utilities'],
  ['transportation', 'Transportation + fuel'],
  ['groceries', 'Groceries'],
  ['insurance', 'Insurance'],
  ['healthcare', 'Healthcare'],
  ['other', 'Everything else']
];
var COST_IDS = { housing: 'acHousing', utilities: 'acUtil', transportation: 'acTrans', groceries: 'acGroc', insurance: 'acIns', healthcare: 'acHealth', other: 'acOther' }

/* THE PREFILL BASELINE. Monthly spend for a ONE-PERSON household at the national average,
   anchored to the Bureau of Labor Statistics Consumer Expenditure Survey 2024 (average annual
   expenditures per consumer unit $78,535, checked 2026-09-22 at bls.gov/news.release/cesan.nr0.htm)
   and scaled to a single person, which is what a traveler on assignment usually is.

   These seven numbers shipped as hardcoded defaults with no source behind them. They stay at the
   same values because they were sane; what changes is that they are now a NATIONAL baseline with
   a citation, and each one gets multiplied by the destination's own cost index instead of every
   visitor in the country being told their groceries cost $480.

   Housing is deliberately absent from the index path: the moment a county is chosen it comes from
   real Zillow or Census rent for that county, which beats an index every time. */
var COST_BASE = { housing: 1500, utilities: 160, transportation: 320, groceries: 480, insurance: 210, healthcare: 280, other: 550 };

/* which MERIC index each budget line rides. colKeys in the data file is
   [overall, grocery, housing, utilities, transportation, health, misc]. Insurance has no index
   of its own, so it takes misc, and that is a judgment call worth knowing about. */
var COST_COL = { housing: 2, utilities: 3, transportation: 4, groceries: 1, insurance: 6, healthcare: 5, other: 6 };

/**
 * Fill the seven cost lines from data for whichever side the reference chip names.
 * Returns the state abbr it used, or null if it could not.
 */
var touchedCosts = {};
function localizeCosts() {
  if (!DATA) return null;
  var toAssign = $('acRefAsg') && $('acRefAsg').getAttribute('aria-pressed') === 'true';
  var abbr = $(toAssign ? 'acAsgState' : 'acCurState').value;
  var fips = $(toAssign ? 'acAsgCounty' : 'acCurCounty').value;
  var st = DATA.states[abbr];
  if (!st || !st.col) return null;

  Object.keys(COST_BASE).forEach(function (k) {
    var idx = st.col[COST_COL[k]];
    var v = COST_BASE[k] * ((typeof idx === 'number' ? idx : 100) / 100);
    if (k === 'housing') {
      /* real rent beats an index. ZORI first, ACS median gross rent second. */
      var c = fips && CDATA && CDATA.counties ? CDATA.counties[fips] : null;
      var rent = c ? (c.z || c.r) : null;
      if (rent) v = rent;
    }
    var el = $(COST_IDS[k]);
    if (el && !touchedCosts[k]) el.value = String(Math.round(v));
  });
  return abbr;
};

/* county fields are FIPS (the join key everywhere on this site) */
var PRESETS = [
  /* STATEWIDE on arrival (cc and ac empty). The tool used to open on two chosen counties,
     which is a level of precision nobody asked for before they had even seen the answer, and
     it contradicted the default David set on 2026-09-22. Narrowing to a county is a choice
     made in its own tray. The cost lines are no longer listed here either: localizeCosts()
     fills them from the chosen state, so hardcoding them would just be a stale copy. */
  { cs: 'UT', cc: '', as: 'CA', ac: '', mode: 'h', hourly: 42, hours: 1872, fil: 's', pf: 'rt' },
  { cs: 'UT', cc: '49049', as: 'AZ', ac: '04013', mode: 'a', gross: 82000, fil: 'm', pf: 'rn',
    costs: { housing: 1450, utilities: 140, transportation: 300, groceries: 520, insurance: 190, healthcare: 320, other: 500 } },
  { cs: 'ID', cc: '16001', as: 'WA', ac: '53033', mode: 'a', gross: 74000, fil: 's', pf: 'other',
    costs: { housing: 1400, utilities: 130, transportation: 280, groceries: 450, insurance: 180, healthcare: 260, other: 480 } }
];

/* FEMA NRI flag codes -> blind-spot card copy */
var RISK_CARDS = {
  WF: ['Wildfire zone', 'FEMA rates this county high for wildfire risk. Carriers know it too: expect surcharges, non-renewals, or state FAIR-plan pricing. Quote a real address before committing to housing.'],
  FL: ['Flood exposure', 'High riverine flood risk per FEMA. Standard renters and homeowners policies do NOT cover flood; a separate NFIP or private policy is its own bill. Check the flood zone of any address you consider.'],
  CF: ['Coastal flood exposure', 'High coastal flood risk per FEMA. Separate flood coverage, wind deductibles, and evacuation-zone logistics all live here. Price them before you sign.'],
  EQ: ['Earthquake country', 'High earthquake risk per FEMA. Quake damage is excluded from standard policies; separate coverage runs real money and deductibles are steep percentages.'],
  HU: ['Hurricane exposure', 'High hurricane risk per FEMA. Wind deductibles are percentage-based, and coastal carriers churn. Get a binding quote, not a ballpark.'],
  TO: ['Tornado alley', 'High tornado risk per FEMA. Premiums price it in; so should your budget. Renters insurance here is not the formality it is elsewhere.'],
  HA: ['Hail belt', 'High hail risk per FEMA. Auto comprehensive and roof coverage both feel it, and hail claims are why premiums in this county run above what housing prices suggest.']
};

/* ── helpers ── */
/* A negative amount reads MINUS-then-dollar ("−$102"), never "$-102". The old form printed the
   sign inside the currency, which is how the Detail tiles showed "$-272" and the summary would have
   shown "Left over $-102". Fixed at the source so every caller gets it. 2026-09-22. */
function fmt(n) {
  var r = Math.round(n);
  return (r < 0 ? '−$' : '$') + Math.abs(r).toLocaleString('en-US');
}
function fmtSign(n) { if (Math.abs(n) < 0.5) return '$0'; return (n > 0 ? '+' : '−') + fmt(Math.abs(n)); }
function debounce(fn, ms) { var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }

/* ── read the form ── */
function readInputs() {
  var mode = $('acModeHourly').getAttribute('aria-pressed') === 'true' ? 'h' : 'a';
  var gross = mode === 'h'
    ? E.hourlyToAnnual(num('acHourly'), num('acHours'))
    : num('acGross');
  /* offer-vs-offer: the assignment column can carry its own gross */
  /* No offer TOGGLE any more. The field is always there, one per place, and an empty one
     means "same pay" exactly as it always did. A control whose only job was to reveal another
     control is machinery, not a question. 2026-09-22. */
  var offerMode = true;
  var gross2 = null;
  if (offerMode) {
    gross2 = mode === 'h'
      ? E.hourlyToAnnual(num('acHourly2'), num('acHours'))
      : num('acGross2');
    if (!(gross2 > 0)) gross2 = null;   // empty offer field = same pay until typed
  }
  return {
    cs: $('acCurState').value, cc: $('acCurCounty').value,
    as: $('acAsgState').value, ac: $('acAsgCounty').value,
    prof: $('acProf').value,
    mode: mode, gross: gross, gross2: gross2, offerMode: offerMode,
    stip: num('acStipend'),
    stipTaxed: $('acStipTaxed') ? $('acStipTaxed').getAttribute('aria-pressed') === 'true' : false,
    bonus: num('acBonus'),
    weeks: num('acWeeks') || 13,
    fil: $('acFilM').getAttribute('aria-pressed') === 'true' ? 'm' : 's',
    ref: $('acRefAsg').getAttribute('aria-pressed') === 'true' ? 'assign' : 'current',
    costs: {
      housing: num('acHousing'), utilities: num('acUtil'), transportation: num('acTrans'),
      groceries: num('acGroc'), insurance: num('acIns'), healthcare: num('acHealth'), other: num('acOther')
    }
  };
}
/* money fields accept money: "85,000" and "$1,500" parse as typed, not as $85 */
function num(id) { return Math.max(0, parseFloat(String($(id).value).replace(/[^0-9.\-]/g, '')) || 0); }

/* money fields also TEACH money: figures group with commas on blur and at
   boot, so the field shows the format num() already forgives */
var MONEY_IDS = ['acGross', 'acGross2', 'acStipend', 'acBonus', 'acHousing', 'acUtil', 'acTrans', 'acGroc', 'acIns', 'acHealth', 'acOther'];
function fmtField(id) {
  var el = $(id);
  if (!el || !String(el.value).trim()) return;
  var n = parseFloat(String(el.value).replace(/[^0-9.\-]/g, ''));
  if (!isFinite(n)) return;
  el.value = n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}
function fmtAllMoney() { MONEY_IDS.forEach(fmtField); }

/* ── county data: fetched once, lazily, the first time a county matters ── */
function needCdata(s) { return !!(s.cc || s.ac); }
var cdataFailed = false;
function loadCdata() {
  if (CDATA || cdataLoading) return;
  cdataLoading = true;
  fetch('/assets/data/assignment-compass-counties.json')
    .then(function (r) { if (!r.ok) throw 0; return r.json(); })
    .then(function (j) { CDATA = j; compute(); })
    .catch(function () { cdataLoading = false; cdataFailed = true; compute(); });
}
function loadLdata() {
  if (LDATA || ldataLoading) return;
  ldataLoading = true;
  fetch('/assets/data/derived/licensure.json')
    .then(function (r) { if (!r.ok) throw 0; return r.json(); })
    .then(function (j) { LDATA = j; compute(); })
    .catch(function () { ldataLoading = false; });
}

/* ── render ── */
function compute() {
  if (!DATA) return;
  var s = readInputs();

  /* NOT READY YET. With a blank start the engine can be asked about a state called "" before a
     visitor has picked one, and projectCosts throws on that. So until there are two places and
     a pay, the results area is an empty state: the answer line says what is missing, and the
     supporting cards stay out of the way instead of showing arithmetic about nothing. */
  var results = document.querySelector('.ac-results');
  if (!s.cs || !s.as || !(s.gross > 0)) {
    if (results) results.classList.add('is-blank');
    var line = $('acAnswerLine'), sub2 = $('acAnswerSub');
    if (line) line.textContent = !s.cs || !s.as
      ? 'Pick where you are and where you\u2019re headed, and this line becomes your answer.'
      : 'Now add your pay, and this line becomes your answer.';
    if (sub2) sub2.textContent = '';
    if ($('acSticky')) $('acSticky').hidden = true;
    if ($('acEgChip')) $('acEgChip').hidden = true;
    /* nothing chosen means nothing to share: a clean address, not ?cs=&as=&hr=0 */
    if (!s.cs && !s.as) { if (location.search) history.replaceState(null, '', location.pathname); }
    else syncUrl(s);
    return;
  }
  if (results) results.classList.remove('is-blank');
  if (needCdata(s) && !CDATA) loadCdata();
  var geo = { counties: CDATA, curFips: s.cc, asgFips: s.ac };
  var proj = E.projectCosts(DATA, s.costs, s.ref, s.cs, s.as, overrides, geo);
  var asgGross = s.gross2 != null ? s.gross2 : s.gross;
  /* EXTRAS AT THE NEW LOCATION, 2026-09-22. A TAXABLE stipend is wages, so it joins gross and
     goes through the tax engine like any other pay. An UNTAXED stipend and a one-time bonus
     land after tax, so they are added to the monthly position directly.
     The bonus is spread across the contract (David's call): weeks/4.345 is the contract in
     months, so bonus divided by that is what it is worth per month while the contract runs.
     Until today the stipend field changed NOTHING on the page, which is worse than not having
     it: the biggest number in a travel package looked like it counted and did not. */
  var stipAnnual = s.stip * 52;
  if (s.stipTaxed) asgGross += stipAnnual;
  var cur = E.monthlyPosition(DATA, s.cs, s.gross, s.fil, proj.current.total);
  var asg = E.monthlyPosition(DATA, s.as, asgGross, s.fil, proj.assign.total);

  var months = Math.max(0.25, s.weeks / 4.345);
  var extraMonthly = (s.stipTaxed ? 0 : stipAnnual / 12) + (s.bonus > 0 ? s.bonus / months : 0);
  if (extraMonthly) asg = { pay: asg.pay, monthlyNet: asg.monthlyNet + extraMonthly,
                            monthlyCosts: asg.monthlyCosts, position: asg.position + extraMonthly };
  /* the summary and the chart show the extras as their own line, so they have to know them */
  asg.extra = extraMonthly || 0;
  cur.extra = 0;
  var delta = asg.position - cur.position;
  var be = E.breakeven(DATA, s.as, s.fil, cur.position, proj.assign.total);

  renderAnswer(s, cur, asg, delta, be);
  renderDash(s, cur, asg, delta, be);
  renderPaycheck(s, cur, asg, proj);
  renderTiles(s, cur, asg, delta);
  renderBreakeven(s, cur, proj, be);
  renderLedger(s, cur, asg, proj);
  renderBars(s, cur, asg, proj);
  renderLicense(s);
  renderProfile(s);
  renderSpots(s);
  renderAssumptions(s, proj);
  renderNego(s, cur, asg, delta, be);
  renderSticky(s, cur, asg, delta);
  setBadge('acScopeBadge', (needCdata(s) && !CDATA)
    ? (cdataFailed ? 'County data unavailable, so these are state-grain figures.' : 'Loading county data…')
    : (proj.housingMeta
      ? 'Housing comes from ' + proj.housingMeta.source + '. Every other category is a state-level index.'
      : 'A state-level estimate. Pick a county under "Narrow it down" and housing sharpens to the real rent for that county.'),
    needCdata(s) && !CDATA && cdataFailed);
  $('acFootYear').textContent = 'Tax year ' + DATA._meta.taxYear + ' · COL ' + (DATA._meta.colSource.match(/Q\d \d{4}/) || [''])[0];
  if (s.gross > 0) {
    var said = $('acAnswerLine');
    announce(said ? said.textContent : '');
  }
  syncUrl(s);
  schedulePerDiem(s);
}

/* the phone sticky strip mirrors the bottom line wherever the thumb is */
function renderSticky(s, cur, asg, delta) {
  var el = $('acSticky');
  if (s.gross <= 0) { el.hidden = true; return; }
  el.hidden = false;
  var cls = delta > 5 ? 'd-good' : delta < -5 ? 'd-bad' : '';
  el.innerHTML = '<span class="cur">' + s.cs + ' ' + fmt(cur.position) + '</span>' +
    '<span class="asg">' + s.as + ' ' + fmt(asg.position) + '</span>' +
    '<span class="' + cls + '">' + fmtSign(delta) + ' a month</span>';
}

/* THE ANSWER: the one-sentence verdict (round 1, SmartAsset archetype). Same math,
   plain words: the equivalence number first, the monthly consequence second. */
function placeName(ab, fips) {
  var c = fips ? countyName(ab, fips) : '';
  return c ? c + ' County, ' + ab : STATES[ab];
}
/* A BADGE IS AN "i", NOT A SENTENCE. David 2026-09-22, pointing at
   "HOUSING: ZILLOW COUNTY RENTS · REST: STATE INDEX" wrapping to two lines beside a heading:
   "things like this should be hidden behind an i Hover".
   Provenance is something a reader wants ON DEMAND, not printed across the top of the answer.
   The badge keeps its place in the layout and its state (a warn badge still reads amber), but
   the words move into the peek card. An empty string hides it entirely, as before. */
function setBadge(id, text, warn) {
  var el = $(id);
  if (!el) return;
  if (!text) { el.hidden = true; el.removeAttribute('data-def'); el.textContent = ''; return; }
  el.hidden = false;
  el.className = 'hu-i ac-badge' + (warn ? ' warn' : '');
  el.setAttribute('data-def', String(text));
  el.setAttribute('aria-label', 'Where these numbers come from');
  el.textContent = 'i';
  /* Three of these badges live inside a <summary>. Without this, tapping the "i" would also
     toggle the card it sits on, so the peek would open and the panel would slam shut under it. */
  if (!el.dataset.stopWired) {
    el.dataset.stopWired = '1';
    el.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); });
  }
}

/* ---- SUMMARY: the screenshot card ------------------------------------------------------------
   One table and two key lines, both places side by side, and the source line INSIDE the card so a
   screenshot of just this card is still a complete, sourced statement. Plain words throughout:
   no "/mo", no "delta" (David, 2026-09-22). */
function renderDash(s, cur, asg, delta, be) {
  var here = placeName(s.cs, s.cc), there = placeName(s.as, s.ac);
  $('acDashTitle').innerHTML = '<span><span class="ac-loc-tag cur"></span>' + here + '</span>' +
    '<span class="arrow" aria-hidden="true">&rarr;</span>' +
    '<span><span class="ac-loc-tag asg"></span>' + there + '</span>';
  $('acDashTitle').setAttribute('aria-label', here + ' compared with ' + there);
  var hrs = num('acHours') || 1872;
  $('acDashSub').textContent = s.mode === 'h'
    ? (s.gross2 != null ? 'Each place at its own rate, ' + hrs.toLocaleString() + ' hours a year'
                        : fmt(s.gross / hrs) + ' an hour, ' + hrs.toLocaleString() + ' hours a year, in both places')
    : (s.gross2 != null ? 'Each place at its own salary' : fmt(s.gross) + ' a year in both places');

  var row = function (label, a, b, cls) {
    return '<tr' + (cls ? ' class="' + cls + '"' : '') + '><th scope="row">' + label + '</th>' +
      '<td' + (a < 0 ? ' class="short"' : '') + '>' + fmt(a) + '</td>' +
      '<td' + (b < 0 ? ' class="short"' : '') + '>' + fmt(b) + '</td></tr>';
  };
  var rows = '<thead><tr><th scope="col">Per month</th>' +
    '<th scope="col">' + STATES[s.cs] + '</th><th scope="col">' + STATES[s.as] + '</th></tr></thead><tbody>';
  rows += row('Take-home', cur.pay.net / 12, asg.pay.net / 12);
  if (asg.extra) rows += row('Bonus and stipend', 0, asg.extra);
  rows += row('Living costs', cur.monthlyCosts, asg.monthlyCosts);
  rows += row('Left over', cur.position, asg.position, 'total');
  $('acDashTable').innerHTML = rows + '</tbody>';

  var keys = '<dt>Difference each month</dt><dd' + (delta < 0 ? ' class="short"' : '') + '>' +
    (Math.abs(delta) < 25 ? 'about the same' : fmtSign(delta)) + '</dd>';
  if (be != null && s.gross2 == null) {
    keys += '<dt>' + (delta >= 0 ? 'You could take a cut to' : 'To come out even there') + '</dt>' +
      '<dd>' + fmt(be) + ' a year</dd>';
  }
  $('acDashKeys').innerHTML = keys;
  $('acDashSrc').textContent = 'Healthcare Uncharted \u00b7 Tax year ' + DATA._meta.taxYear +
    ' \u00b7 MERIC cost index ' + ((DATA._meta.colSource.match(/Q\d \d{4}/) || [''])[0]) +
    ' \u00b7 estimates, not advice';
}

/* ---- CHART: where each paycheck goes ---------------------------------------------------------
   Part-to-whole, so a stacked horizontal bar per place (dataviz skill: choosing-a-form). Both bars
   on ONE scale so their lengths compare. Spent money is hollow, left-over money is the only solid
   fill, so "kept" reads against "spent" by shape rather than colour (see the CSS note for the
   validator numbers that forced this). A segment label shows only if it fits; the line under each
   bar lists every value, which is the table twin, so a hidden label never hides a number. */
function renderPaycheck(s, cur, asg, proj) {
  var side = function (key, p, costs, abbr) {
    var taxes = (p.pay.gross - p.pay.net) / 12;
    var housing = costs.housing || 0;
    var other = Math.max(0, p.monthlyCosts - housing);
    var inflow = p.pay.gross / 12 + (p.extra || 0);
    return { key: key, abbr: abbr, taxes: taxes, housing: housing, other: other, kept: p.position,
             inflow: inflow, spent: taxes + housing + other };
  };
  var A = side('cur', cur, proj.current, s.cs), B = side('asg', asg, proj.assign, s.as);
  var max = Math.max(A.inflow, A.spent, B.inflow, B.spent, 1);
  var pct = function (v) { return (Math.max(0, v) / max * 100).toFixed(3) + '%'; };

  /* each segment is a grid column sized in fr by its dollars; the BAR is sized in % of the shared
     scale. A positive left-over gets a 3px floor so "$9 left" is a visible sliver, not nothing, and
     that 3px comes out of the bar rather than being added to it. */
  var seg = function (cls, v, label, name) {
    if (v <= 0.5) return null;
    return { col: 'minmax(' + (cls.indexOf('kept') === 0 ? '3px' : '0') + ', ' + v.toFixed(2) + 'fr)',
             html: '<div class="ac-pc-seg ' + cls + '" data-def="' + name + ': ' + fmt(v) + ' a month">' +
                   (label ? '<span class="l">' + label + '</span>' : '') + '</div>' };
  };
  var html = '';
  [A, B].forEach(function (d) {
    /* The solid LEFT OVER segment carries no text. White on the teal fill measures 3.46:1 and on
       the blue 4.46:1, both under the 4.5 small text needs, and no single ink passes on both. It
       does not need a label anyway: it is the only solid segment, the key says solid means left
       over, and the line under the bar prints the amount. The hollow segments keep theirs,
       because there the label is the only thing telling Taxes from Housing. */
    var parts = [seg('spent', d.taxes, 'Taxes', 'Taxes'),
                 seg('spent', d.housing, 'Housing', 'Housing'),
                 seg('spent', d.other, 'Other costs', 'Everything else'),
                 seg('kept ' + d.key, d.kept, '', 'Left over')].filter(Boolean);
    var total = d.taxes + d.housing + d.other + Math.max(0, d.kept);
    var bar = parts.map(function (x) { return x.html; }).join('');
    var cols = parts.map(function (x) { return x.col; }).join(' ');
    var short = d.kept < 0;
    var marker = short ? '<span class="ac-pc-pay" style="left:' + pct(d.inflow) + '" aria-hidden="true"></span>' : '';
    var vals = 'Taxes <b>' + fmt(d.taxes) + '</b> \u00b7 Housing <b>' + fmt(d.housing) + '</b> \u00b7 Other <b>' +
      fmt(d.other) + '</b> \u00b7 ' + (short
        ? '<span class="short">Short ' + fmt(-d.kept) + '</span>'
        : 'Left over <b>' + fmt(d.kept) + '</b>');
    html += '<div class="ac-pc-row">' +
      '<div class="ac-pc-name"><span class="ac-loc-tag ' + d.key + '"></span>' + STATES[d.abbr] +
        ' <span style="color:var(--t3)">\u00b7 ' + fmt(d.inflow) + ' a month in</span></div>' +
      '<div class="ac-pc-track"><div class="ac-pc-bar" style="width:' + pct(total) +
        ';grid-template-columns:' + cols + '">' + bar + '</div>' + marker + '</div>' +
      '<div class="ac-pc-vals">' + vals + '</div></div>';
  });
  var el = $('acPaycheck');
  el.innerHTML = html;
  /* a label that does not fit its segment is hidden, never clipped mid-word */
  el.querySelectorAll('.ac-pc-seg').forEach(function (sg) {
    var l = sg.querySelector('.l');
    if (l && l.offsetWidth > sg.clientWidth) l.classList.add('gone');
  });
  $('acPcKey').innerHTML = '<span><i class="spent"></i>Spent</span><span><i class="kept"></i>Left over</span>' +
    (A.kept < 0 || B.kept < 0 ? '<span style="color:var(--amber)">The amber line is where the pay runs out</span>' : '');
}

/* ---- which view is showing -------------------------------------------------------------------- */
var currentView = 'summary';
function setView(v) {
  if (['summary', 'chart', 'detail'].indexOf(v) < 0) v = 'summary';
  currentView = v;
  var r = document.querySelector('.ac-results');
  if (r) r.setAttribute('data-view', v);
  document.querySelectorAll('[data-show]').forEach(function (b) {
    var on = b.getAttribute('data-show') === v;
    b.setAttribute('aria-pressed', String(on));
    b.classList.toggle('on', on);
  });
  /* the chart measures its own labels, and a hidden element measures as zero, so re-render on show */
  if (v === 'chart' && lastCalc) compute();
}

function renderAnswer(s, cur, asg, delta, be) {
  var line = $('acAnswerLine'), sub = $('acAnswerSub'), chip = $('acEgChip');
  if (chip) chip.hidden = !(!dirty && activePreset != null);
  if (!line) return;
  if (s.gross <= 0) {
    line.textContent = 'Pick two places and enter your pay, and this line becomes your answer.';
    sub.textContent = '';
    return;
  }
  var here = placeName(s.cs, s.cc), there = placeName(s.as, s.ac);
  if (s.cs === s.as && !s.cc && !s.ac) {
    line.innerHTML = 'You’re comparing ' + here + ' to itself, so the only difference is pay.';
    sub.textContent = 'Pick a second state or county to see a real comparison.';
    return;
  }
  /* THE VERDICT COMES FIRST. Rewritten 2026-09-22 on David's read: "can we find a way to express
     this better? or have a better starting phrase there somthing that hooks the user?"
     The old line opened on a qualifier ("With each offer at its own pay, the move to...") and put
     the number at the END, so the one thing a person came for arrived last. A person opening this
     tool is asking one question, am I better off, and the first words should answer it in their
     terms. The hook is the answer, not a flourish in front of it. */
  var verdict = function (d, prefix) {
    if (Math.abs(d) < 25) return prefix + 'you’d keep <b>about the same</b> each month in ' + there + '.';
    var cls = d >= 0 ? '' : ' class="bad"';
    return prefix + 'you’d keep <b' + cls + '>' + fmt(Math.abs(d)) + (d >= 0 ? ' more' : ' less') +
      '</b> a month in ' + there + '.';
  };
  var cap = function (h) { return h.charAt(0).toUpperCase() + h.slice(1); };

  if (s.gross2 != null) {
    line.innerHTML = cap(verdict(delta, ''));
    sub.textContent = 'The offer pays ' + fmt(s.gross2) + ' against your ' + fmt(s.gross) +
      ' here, after taxes and living costs in each place.';
    return;
  }
  if (be != null) {
    line.innerHTML = verdict(delta, 'At your current pay, ');
    /* the breakeven is the number to take into a negotiation, so it is the second line, and it
       says the useful thing in both directions: what to ask for, or how much room there is */
    sub.textContent = delta >= 0
      ? 'You could take a cut to about ' + fmt(be) + ' there and still come out even.'
      : 'To come out even there, you’d need about ' + fmt(be) + '.';
    return;
  }
  line.textContent = 'Enter pay and locations above, and this line becomes your answer.';
  sub.textContent = '';
}
function renderTiles(s, cur, asg, delta) {
  if (s.gross <= 0) {
    $('acTiles').innerHTML = '';
    $('acTileNote').textContent = 'Enter pay above and the comparison computes from there.';
    return;
  }
  var cls = delta > 5 ? 'good' : delta < -5 ? 'bad' : '';
  var twoPay = s.gross2 != null;
  $('acTiles').innerHTML =
    tile(fmt(cur.position), STATES[s.cs] + ', left over each month' + (twoPay ? ' at ' + fmt(s.gross) : ''), 'cur') +
    tile(fmt(asg.position), STATES[s.as] + ', left over each month' + (twoPay ? ' at ' + fmt(s.gross2) : ''), 'asg') +
    tile(fmtSign(delta), twoPay ? 'difference each month, each at its own pay' : 'difference each month, at the same pay', cls);
  var note = 'Left over = net pay after federal, FICA, state tax, and mandatory payroll, minus modeled monthly costs. ' +
    (twoPay ? 'Each column uses its own gross with its own tax math.' : 'Same gross pay applied to both columns.');
  if (s.cs === s.as) note += ' You are comparing ' + STATES[s.cs] + ' to itself: cost ratios are flat by definition, so any delta comes from pay alone.';
  /* the example state now announces itself via the chip on the answer card */
  $('acTileNote').textContent = note;
}
function tile(v, k, cls) {
  return '<div class="hu-stat"><div class="v ' + (cls || '') + '">' + v + '</div><div class="k">' + k + '</div></div>';
}

function renderBreakeven(s, cur, proj, be) {
  if (be == null || s.gross <= 0) { $('acBeNum').textContent = '...'; $('acBePer').textContent = ''; $('acBeSub').textContent = s.gross <= 0 ? 'Waiting on pay.' : ''; return; }
  var hrs = num('acHours') || 1872;
  $('acBeNum').textContent = fmt(be);
  $('acBePer').textContent = '≈ ' + fmt(be / hrs) + '/hr at ' + hrs + ' hrs a year';
  var sub = 'Pay in ' + STATES[s.as] + ' needs to be at least this much before it matches what ' +
    fmt(s.gross) + ' leaves you in ' + STATES[s.cs] + '. Below that number you are paying to work there.';
  if (s.gross2 != null) {
    var gap = s.gross2 - be;
    sub += gap >= 0
      ? ' The offer grosses ' + fmt(s.gross2) + ': it clears the bar by ' + fmt(gap) + ' a year.'
      : ' The offer grosses ' + fmt(s.gross2) + ': it falls ' + fmt(-gap) + ' a year short of breaking even.';
  }
  $('acBeSub').textContent = sub;
}

function renderLedger(s, cur, asg, proj) {
  var csAb = s.cs, asAb = s.as;
  var rows = '<tr><th scope="col">Category</th><th scope="col" class="cur">' + csAb + '</th><th scope="col" class="asg">' + asAb + '</th><th scope="col">Difference</th></tr>';
  CATS.forEach(function (c) {
    rows += row(c[1], proj.current[c[0]], proj.assign[c[0]]);
  });
  rows += row('State income tax', cur.pay.state / 12, asg.pay.state / 12);
  rows += row('Mandatory payroll', cur.pay.payroll / 12, asg.pay.payroll / 12);
  rows += row('Federal + FICA', (cur.pay.federal + cur.pay.fica) / 12, (asg.pay.federal + asg.pay.fica) / 12);
  var curTot = proj.current.total + (cur.pay.state + cur.pay.payroll + cur.pay.federal + cur.pay.fica) / 12;
  var asgTot = proj.assign.total + (asg.pay.state + asg.pay.payroll + asg.pay.federal + asg.pay.fica) / 12;
  rows += '<tr class="ac-sum">' + cells('All costs + tax / mo', curTot, asgTot) + '</tr>';
  rows += '<tr class="ac-sum">' + cells('Left over / mo', cur.position, asg.position, true) + '</tr>';
  $('acLedger').innerHTML = rows;
}
function row(label, a, b) { return '<tr>' + cells(label, a, b) + '</tr>'; }
function cells(label, a, b, invert) {
  var d = b - a;
  var good = invert ? d > 0.5 : d < -0.5;
  var bad = invert ? d < -0.5 : d > 0.5;
  var cls = good ? 'd-good' : bad ? 'd-bad' : 'd-flat';
  return '<th scope="row">' + label + '</th><td>' + fmt(a) + '</td><td>' + fmt(b) + '</td><td class="' + cls + '">' + fmtSign(d) + '</td>';
}

function renderBars(s, cur, asg, proj) {
  /* three fixed columns, like the ledger: labels left, plot center, values in
     a right-hand mono rail. Values NEVER ride the bar tip, so a long bar can
     never collide with its own label (the Housing/$329 overlap bug). */
  var items = CATS.map(function (c) { return { label: c[1], d: proj.assign[c[0]] - proj.current[c[0]] }; });
  items.push({ label: 'State tax + payroll', d: (asg.pay.state + asg.pay.payroll - cur.pay.state - cur.pay.payroll) / 12 });
  var max = Math.max(50, Math.max.apply(null, items.map(function (i) { return Math.abs(i.d); })));
  var W = 640, LBL = 158, VAL = 72;
  var plotL = LBL + 10, plotR = W - VAL - 10;
  var mid = (plotL + plotR) / 2, span = (plotR - plotL) / 2;
  var rowH = 30, H = items.length * rowH + 14;
  var sv = '<line x1="' + mid + '" y1="4" x2="' + mid + '" y2="' + (H - 4) + '" stroke="var(--dgm-line)" stroke-width="1"/>';
  items.forEach(function (it, i) {
    var y = i * rowH + 10;
    var w = Math.min(Math.abs(it.d) / max * span, span);
    var x = it.d >= 0 ? mid : mid - w;
    var flat = Math.abs(it.d) < 0.5;
    var cls = flat ? 'flat' : it.d > 0 ? 'up' : 'down';
    sv += '<text class="lbl" x="' + (LBL - 2) + '" y="' + (y + 12) + '" text-anchor="end" fill="var(--t2)">' + it.label + '</text>';
    if (!flat) sv += '<rect class="' + cls + '" x="' + x + '" y="' + y + '" width="' + Math.max(w, 2) + '" height="16" rx="3"/>';
    /* value text is INK, never the bar colour (dataviz non-negotiable). The sign carries the
       direction for anyone who cannot tell this red from this green (deutan Delta E 6.6). */
    sv += '<text x="' + (W - 4) + '" y="' + (y + 12) + '" text-anchor="end" fill="' + (flat ? 'var(--t3)' : 'var(--t2)') + '">' + fmtSign(it.d) + '</text>';
  });
  var el = $('acBars');
  el.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
  el.innerHTML = sv;
}

/* license logistics: what the move means for the license itself */
function renderLicense(s) {
  var card = $('acLicCard');
  if (!s.prof || s.cs === s.as) { card.hidden = true; return; }
  if (!LDATA) { loadLdata(); card.hidden = true; return; }
  var p = LDATA.professions[s.prof];
  if (!p) { card.hidden = true; return; }
  card.hidden = false;
  setBadge('acLicBadge', p.label);

  var to = s.as, from = s.cs, c = p.compact;
  function endorse() {
    var ex = p.states[to] || {};
    /* 'an Iowa license' but 'a Utah license': U-states sound like consonants */
    var art = /^[AEIO]/.test(STATES[to]) ? 'An ' : 'A ';
    return art + STATES[to] + ' license by endorsement runs ' + (ex.fee || p.endorse.feeTypical) +
      ' and typically ' + (ex.weeks || p.endorse.weeksTypical) + ' weeks.' + (ex.note ? ' ' + ex.note : '');
  }
  var html = '';
  if (!c) {
    html = '<p class="ac-lic-path">No compact covers this field. ' + endorse() + '</p>';
    if (p.note) html += '<p class="ac-lic-detail">' + p.note + '</p>';
  } else {
    var inTo = c.members.indexOf(to) >= 0, inFrom = c.members.indexOf(from) >= 0;
    if (!c.operational) {
      html = '<p class="ac-lic-path">No compact path yet. ' + endorse() + '</p>';
      var extra = '';
      if (inTo && inFrom) extra = ' Both ' + STATES[from] + ' and ' + STATES[to] + ' have enacted; when it goes live, this exact move gets radically easier.';
      else if (inTo || inFrom) extra = ' ' + STATES[inTo ? to : from] + ' has already enacted it.';
      html += '<p class="ac-lic-status">' + (c.statusLine || '') + extra +
        ' <a href="' + c.url + '" target="_blank" rel="noopener">Track the ' + c.code + '</a>.</p>';
    } else if (inTo && inFrom) {
      var detail = '';
      if (c.code === 'NLC') detail = 'If ' + STATES[from] + ' is your PRIMARY STATE OF RESIDENCE, your multistate license already authorizes practice in ' + STATES[to] + '. No new license, no fee, no wait. If your tax home sits outside the compact, you need a single-state license instead: ' + endorse();
      else if (c.code === 'PTC') detail = 'Buy a ' + STATES[to] + ' compact privilege on your home-state license at ptcompact.org. Days, not weeks, and cheaper than a full endorsement.';
      else if (c.code === 'IMLC') detail = 'Use the IMLC letter of qualification: a full ' + STATES[to] + ' license, typically 30 to 60 days, about $700 in compact fees plus ' + STATES[to] + ' fees. Faster than traditional endorsement, not cheaper.';
      else if (c.code === 'PSYPACT') detail = 'PSYPACT covers telepsychology into ' + STATES[to] + ' and up to 30 days per year in person. A permanent in-person role still needs the state license: ' + endorse();
      else detail = endorse();
      html = '<p class="ac-lic-path">Compact move: ' + c.how + '.</p><p class="ac-lic-detail">' + detail + '</p>';
      if (c.notes && c.notes[to]) html += '<p class="ac-lic-status">' + c.notes[to] + '.</p>';
    } else if (inTo && !inFrom) {
      html = '<p class="ac-lic-path">' + STATES[to] + ' is in the ' + c.code + ', but ' + STATES[from] + ' is not, so the compact cannot carry you in. ' + endorse() + '</p>';
      if (c.pending && c.pending[from]) html += '<p class="ac-lic-status">' + STATES[from] + ': ' + c.pending[from] + '. That may change this math soon.</p>';
    } else {
      var pend = c.pending && c.pending[to];
      html = '<p class="ac-lic-path">' + (pend
        ? STATES[to] + ' has moved on the ' + c.code + ' (' + pend + ') but you cannot use it yet. ' + endorse()
        : STATES[to] + ' is not in the ' + c.code + '. ' + endorse()) + '</p>';
    }
  }
  $('acLicBody').innerHTML = html;
}

/* county profile: the assignment county in five numbers */
function renderProfile(s) {
  var card = $('acProfileCard');
  var c = CDATA && s.ac && CDATA.counties[s.ac];
  if (!c) { card.hidden = true; return; }
  card.hidden = false;
  var name = countyName(s.as, s.ac);
  setBadge('acProfileBadge', name + ', Census ACS ' + CDATA._meta.acsVintage + '.');
  var tiles = '';
  var rent = c.z || c.r;
  if (rent) tiles += tile(fmt(rent), (c.z ? 'market rent (Zillow ' + (CDATA._meta.zoriMonth || '').slice(0, 7) + ')' : 'median gross rent (ACS)'), 'asg');
  var home = c.h || c.v;
  if (home) tiles += tile(fmt(home), c.h ? 'home value (ZHVI)' : 'median home value (ACS)', '');
  if (c.i) tiles += tile(fmt(c.i), 'median household income', '');
  if (c.c) tiles += tile(c.c + ' min', 'mean commute', '');
  if (c.t && home) tiles += tile((c.t / home * 100).toFixed(2) + '%', 'property tax, effective (' + fmt(c.t) + '/yr)', '');
  $('acProfileTiles').innerHTML = tiles;
  var st = CDATA.states[s.as];
  var bits = [];
  if (c.p) bits.push('Population ' + Math.round(c.p / 1000).toLocaleString() + 'K.');
  if (st && st.s != null) bits.push('Sales tax in ' + STATES[s.as] + ' runs about ' + st.s + '% combined state and local.');
  if (CDATA.national && rent) bits.push('National median rent for scale: ' + fmt(CDATA.national.r) + '.');
  $('acProfileNote').textContent = bits.join(' ');
}

function renderSpots(s) {
  var st = DATA.states[s.as];
  var cards = '';
  if (s.cs !== s.as) {
    cards += spot('Tax home and stipends',
      'Cross-state contracts raise two questions this tool does not compute. One: tax-free stipends require keeping a real tax home, meaning duplicated living costs at both ends; without that, stipends are just taxable wages. Two: both states may want a return. Credits usually prevent true double taxation, but not always. Educate first, sign second. <a href="https://www.irs.gov/publications/p463" target="_blank" rel="noopener">IRS Publication 463</a> is the primary source.', 'tax');
  }
  if (st.local) cards += spot('Local income tax', st.local, 'tax');
  if (st.noTax) cards += spot('No state income tax. Read the fine print.', st.noTax, '');
  /* county FEMA flags first when we have them: they are the sharpest signal */
  var c = CDATA && s.ac && CDATA.counties[s.ac];
  if (c && c.k) c.k.forEach(function (code) {
    var rc = RISK_CARDS[code];
    if (rc) cards += spot(rc[0] + ': ' + countyName(s.as, s.ac) + ' County', rc[1], '');
  });
  (st.spots || []).forEach(function (sp) { cards += spot(sp.t, sp.b, ''); });
  var curLocal = DATA.states[s.cs].local;
  if (curLocal && s.cs !== s.as) cards += spot('Leaving behind: local tax in ' + STATES[s.cs], curLocal, 'tax');
  if (!cards) cards = spot('Nothing flagged', 'No structural cost traps on file for ' + STATES[s.as] + '. The usual advice stands: quote insurance at a real address before signing.', '');
  $('acSpots').innerHTML = cards;
}
function spot(t, b, cls) {
  return '<div class="ac-spot ' + cls + '"><h3>' + t + '</h3><p>' + b + '</p></div>';
}

function renderAssumptions(s, proj) {
  var grid = $('acAssumeGrid');
  if (!grid.dataset.built) {
    var html = '<div class="ac-assume-row" style="font-family:var(--mono);font-size:var(--t-micro);letter-spacing:.1em;text-transform:uppercase;color:var(--t3)"><span>Category</span><span style="text-align:right">Index default</span><span style="text-align:right">Ratio</span></div>';
    CATS.forEach(function (c) {
      html += '<div class="ac-assume-row"><label for="acR_' + c[0] + '">' + c[1] + '</label>' +
        '<span class="def" id="acD_' + c[0] + '"></span>' +
        '<input class="ac-input" id="acR_' + c[0] + '" inputmode="decimal" step="0.01" aria-label="' + c[1] + ' cost ratio"></div>';
    });
    grid.innerHTML = html;
    grid.dataset.built = '1';
    CATS.forEach(function (c) {
      $('acR_' + c[0]).addEventListener('change', function () {
        var v = parseFloat(this.value);
        if (isFinite(v) && v > 0) overrides[c[0]] = v; else delete overrides[c[0]];
        compute();
      });
    });
    $('acAssumeReset').addEventListener('click', function () { overrides = {}; compute(); });
  }
  /* defaults = what the engine would use with no hand-set ratios (county-aware) */
  var defs = E.projectCosts(DATA, {}, 'current', s.cs, s.as, {}, { counties: CDATA, curFips: s.cc, asgFips: s.ac }).ratio;
  CATS.forEach(function (c) {
    $('acD_' + c[0]).textContent = defs[c[0]].toFixed(2);
    var inp = $('acR_' + c[0]);
    if (document.activeElement !== inp) inp.value = proj.ratio[c[0]].toFixed(2);
  });
  $('acAssumeState').textContent = Object.keys(overrides).length
    ? Object.keys(overrides).length + ' ratio(s) hand-set'
    : (proj.housingMeta ? 'Housing from ' + proj.housingMeta.source + '; rest from the MERIC state index' : 'Using MERIC state index ratios');
}

/* ── the negotiation card: the verdict as an action, and the JPEG that
      carries it into the recruiter chat (the Rounds share-card idiom) ── */
function renderNego(s, cur, asg, delta, be) {
  lastCalc = { s: s, cur: cur, asg: asg, delta: delta, be: be };
  var v = $('acNegoVerdict');
  $('acNegoBadge').hidden = s.gross2 == null;
  if (s.gross <= 0 || be == null) { v.textContent = 'Enter pay above and this card writes your ask.'; $('acNegoLines').innerHTML = ''; return; }
  var hrs = num('acHours') || 1872;
  if (s.gross2 != null) {
    var gap = s.gross2 - be;
    v.innerHTML = gap >= 0
      ? 'This offer clears your breakeven by <b>' + fmt(gap) + '/yr</b>. The move nets ' + (delta >= 0 ? '<b>+' : '<b>−') + fmt(Math.abs(delta)) + ' a month</b> after taxes and costs.'
      : 'Ask for at least <b>' + fmt(be) + '</b> gross (≈ <b>' + fmt(be / hrs) + '/hr</b> at ' + hrs + ' hrs a year). This offer is <b>' + fmt(-gap) + '/yr</b> short of breaking even.';
  } else {
    v.innerHTML = 'Any offer in ' + STATES[s.as] + ' needs to gross at least <b>' + fmt(be) + '</b> (≈ <b>' + fmt(be / hrs) + '/hr</b> at ' + hrs + ' hrs a year) before it beats staying put.';
  }
  renderNegoLines();
}
/* the pd-dependent lines rebuild whenever per diem lands */
function renderNegoLines() {
  if (!lastCalc) return;
  var s = lastCalc.s, lines = '';
  if (lastPd) {
    var capMo = lastPd.lodging * 30.4;
    lines += '<div class="ac-nego-line">County lodging cap: <b>' + fmt(lastPd.lodging) + '/night</b> (' + fmt(capMo) + ' a month). ' +
      (s.stip > 0
        ? 'The offered stipend builds to <b>' + fmt(s.stip * 52 / 12) + ' a month</b>: ' + (capMo - s.stip * 52 / 12 > 1 ? '<b>' + fmt(capMo - s.stip * 52 / 12) + ' a month</b> of room under the cap.' : 'the lodging line is fully used.')
        : 'A housing stipend far under that line is your opening.') +
      (lastPd.offline ? ' (Offline standard rate: the real county cap may be higher.)' : '') + '</div>';
  }
  if (s.cs !== s.as) lines += '<div class="ac-nego-line">Before signing: tax home rules decide whether stipends stay tax-free. <b>IRS Pub 463</b> is the primary source.</div>';
  $('acNegoLines').innerHTML = lines;
}
/* 1080 square, dark, sourced: the number Dana texts herself before the call */

/* ── GSA per diem ── */
var pdTimer = null;
function schedulePerDiem(s) {
  clearTimeout(pdTimer);
  pdTimer = setTimeout(function () { perDiem(s); }, 250);
}
function perDiem(s) {
  var now = new Date();
  var fy = now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear();
  var key = 'ac-pd:' + s.as + ':' + fy;
  var cached = null;
  try { cached = JSON.parse(sessionStorage.getItem(key)); } catch (e) {}
  if (cached) return renderPerDiem(s, cached, now);
  /* pending state: the card says it is checking, not silently stale */
  var b = $('acPdBadge');
  setBadge('acPdBadge', 'Checking the county per diem rate.');
  fetch('/.netlify/functions/perdiem?state=' + s.as + '&year=' + fy)
    .then(function (r) { if (!r.ok) throw 0; return r.json(); })
    .then(function (j) {
      if (!j || !j.areas) throw 0;
      try { sessionStorage.setItem(key, JSON.stringify(j)); } catch (e) {}
      renderPerDiem(s, j, now);
    })
    .catch(function () { renderPerDiem(s, null, now); });
}
function renderPerDiem(s, pd, now) {
  var std = DATA._meta.conusStandard;
  var badge = $('acPdBadge'), sub = $('acPdSub');
  var lodging = std.lodging, mie = std.mie, label = 'Standard CONUS rate';
  var seasonal = '';
  var acName = s.ac ? countyName(s.as, s.ac) : '';
  if (pd && pd.areas) {
    var match = null;
    if (acName) {
      var want = acName.toLowerCase().replace(/[^a-z]/g, '');
      match = pd.areas.find(function (a) {
        return (a.county || '').toLowerCase().replace(/[^a-z]/g, '').indexOf(want) !== -1 && !a.standard;
      });
    }
    if (match) {
      var m = now.getMonth();
      lodging = match.lodging[m]; mie = match.mie;
      label = (match.city ? match.city + ', ' : '') + match.county + ' County';
      var lo = Math.min.apply(null, match.lodging), hi = Math.max.apply(null, match.lodging);
      if (hi > lo) seasonal = 'Seasonal: lodging runs ' + fmt(lo) + ' to ' + fmt(hi) + ' through the year. Shown: this month.';
      setBadge('acPdBadge', '');
    } else {
      var stdArea = pd.areas.find(function (a) { return a.standard; });
      if (stdArea) { lodging = stdArea.lodging[now.getMonth()]; mie = stdArea.mie; }
      label = acName ? acName + ' County: standard rate applies' : 'Standard rate (pick a county to check for a higher one)';
      setBadge('acPdBadge', 'No county-specific rate, so this is the standard CONUS rate.');
    }
  } else {
    setBadge('acPdBadge', 'The per diem lookup is offline, so this is the standard CONUS rate. The real county cap may be higher.', true);
  }
  lastPd = { lodging: lodging, mie: mie, label: label, offline: !pd };
  $('acPdTiles').innerHTML =
    tile(fmt(lodging), 'lodging / night cap', 'asg') +
    tile(fmt(mie), 'meals + incidentals / day', 'asg') +
    tile(fmt(lodging * 30.4 + mie * 30.4), 'per diem / mo (lodging + M&IE, 30.4 days)', '');
  var txt = label + ' · FY' + (pd ? pd.year : std.fy) + (seasonal ? ' · ' + seasonal : '');
  if (!pd) txt += ' · High-cost counties run above the standard rate: treat this as a floor, not the cap.';
  var stip = num('acStipend');
  if (stip > 0) {
    var stipMo = stip * 52 / 12, capMo = lodging * 30.4;
    var room = capMo - stipMo;
    txt += room > 1
      ? ' · The offered stipend builds to ' + fmt(stipMo) + ' a month against a ' + fmt(capMo) + ' a month lodging cap: ' + fmt(room) + ' a month of negotiation room on lodging alone.'
      : ' · The offered stipend builds to ' + fmt(stipMo) + ' a month, at or above the ' + fmt(capMo) + ' a month lodging cap. The lodging line is fully used; any ask moves to M&IE or rate.';
  }
  sub.textContent = txt;
  renderNegoLines();
}

/* ── announce (committed changes only, debounced) ── */
var lastMsg = '';
var announce = debounce2(function (msg) {
  if (msg !== lastMsg) { $('acLive').textContent = msg; lastMsg = msg; }
}, 800);
function debounce2(fn, ms) {
  var t; return function (a) { clearTimeout(t); t = setTimeout(function () { fn(a); }, ms); };
}

/* ── URL state: short keys, defaults omitted, replace on tweak ── */
function syncUrl(s) {
  var p = new URLSearchParams();
  p.set('cs', s.cs); p.set('as', s.as);
  if (s.cc) p.set('cc', s.cc);
  if (s.ac) p.set('ac', s.ac);
  if (s.mode === 'h') { p.set('hr', String(num('acHourly'))); if (num('acHours') !== 1872) p.set('hw', String(num('acHours'))); }
  else p.set('g', s.gross);
  if (s.offerMode) {
    if (s.mode === 'h') { p.set('hr2', String(num('acHourly2'))); }
    else if (num('acGross2') > 0) p.set('g2', String(num('acGross2')));
  }
  if (s.stip > 0) p.set('sp', s.stip);
  if (s.stip > 0 && s.stipTaxed) p.set('st', 't');
  if (s.bonus > 0) p.set('bn', s.bonus);
  if (s.weeks && s.weeks !== 13) p.set('wk', s.weeks);
  if (s.prof) p.set('pf', s.prof);
  if (s.fil === 'm') p.set('fs', 'm');
  if (s.ref === 'assign') p.set('ref', 'a');
  /* cost rows ride the URL only when they differ from the page defaults;
     restoreUrl already leaves absent ones on their markup values */
  CATS.forEach(function (c) {
    var v = s.costs[c[0]];
    if (v !== (Number($(COST_IDS[c[0]]).defaultValue) || 0)) p.set(c[0].slice(0, 2), v);
  });
  if (currentView !== 'summary') p.set('v', currentView);
  history.replaceState(null, '', location.pathname + '?' + p.toString());
}
function restoreUrl() {
  var p = new URLSearchParams(location.search);
  if (!p.get('cs') || !STATES[p.get('cs')] || !STATES[p.get('as')]) return false;
  setSelect('acCurState', p.get('cs'));
  setSelect('acAsgState', p.get('as'));
  fillCounties('acCurCounty', p.get('cs'), p.get('cc') || '');
  fillCounties('acAsgCounty', p.get('as'), p.get('ac') || '');
  if (p.get('hr')) {
    setMode('h'); $('acHourly').value = p.get('hr'); $('acHours').value = p.get('hw') || 1872;
  } else if (p.get('g')) { setMode('a'); $('acGross').value = p.get('g'); }
  if (p.get('g2') || p.get('hr2')) {
    if (p.get('hr2')) { $('acHourly2').value = p.get('hr2'); }
    if (p.get('g2')) $('acGross2').value = p.get('g2');
  }
  if (p.get('sp')) $('acStipend').value = p.get('sp');
  $('acProf').value = p.get('pf') || '';
  setPressed('acFilS', p.get('fs') !== 'm'); setPressed('acFilM', p.get('fs') === 'm');
  setPressed('acRefCur', p.get('ref') !== 'a'); setPressed('acRefAsg', p.get('ref') === 'a');
  /* Fill the seven cost lines from the restored places FIRST, then let the link override any
     line it carries. A link without cost lines used to restore the national baseline ($1,500
     housing for California), so it showed a different answer from the same choices made by hand,
     and every check driven by a URL was testing numbers no visitor would ever see. */
  touchedCosts = {};
  localizeCosts();
  var map = COST_IDS;
  CATS.forEach(function (c) { var v = p.get(c[0].slice(0, 2)); if (v != null) $(map[c[0]]).value = v; });
  /* the extras round-trip too: a shared link used to drop the bonus and contract length silently */
  if (p.get('bn') && $('acBonus')) $('acBonus').value = p.get('bn');
  if (p.get('wk') && $('acWeeks')) $('acWeeks').value = p.get('wk');
  if ($('acStipTaxed')) { setPressed('acStipTaxed', p.get('st') === 't'); setPressed('acStipUntaxed', p.get('st') !== 't'); }
  return true;
}

/* ── presets ── */
/* THE BLANK START. David, 2026-09-22: "can start with the page blank?" It used to open on a
   worked example (Utah to California at $42 an hour), which showed what the tool does but
   answered somebody else's question before asking yours. It opens empty now and the answer
   line walks you to the next thing it needs. A shared link still restores its own scenario:
   restoreUrl() runs first and this only applies when there is nothing to restore.
   Hourly, because that is how a travel contract is quoted and the people this is for think in
   it. Hours/year keeps its full-time default, which is a unit, not an example. */
function startBlank() {
  overrides = {}; touchedCosts = {};
  activePreset = null; dirty = false;
  ['acCurState', 'acAsgState'].forEach(function (id) { $(id).value = ''; });
  ['acCurCounty', 'acAsgCounty'].forEach(function (id) {
    var el = $(id);
    el.innerHTML = '<option value="">Statewide</option>'; el.value = ''; el.disabled = true;
  });
  ['acGross', 'acGross2', 'acHourly', 'acHourly2', 'acStipend', 'acBonus'].forEach(function (id) {
    if ($(id)) $(id).value = '';
  });
  $('acHours').value = '1872';
  if ($('acWeeks')) $('acWeeks').value = '13';
  $('acProf').value = '';
  setMode('h');
  setPressed('acFilS', true); setPressed('acFilM', false);
  setPressed('acRefCur', true); setPressed('acRefAsg', false);
  compute();
}

function applyPreset(i) {
  var pr = PRESETS[i];
  overrides = {};
  activePreset = i; dirty = false;
  $('acGross2').value = ''; $('acHourly2').value = ''; $('acStipend').value = '';
  setSelect('acCurState', pr.cs); setSelect('acAsgState', pr.as);
  fillCounties('acCurCounty', pr.cs, pr.cc); fillCounties('acAsgCounty', pr.as, pr.ac);
  $('acProf').value = pr.pf || '';
  setMode(pr.mode);
  if (pr.mode === 'h') { $('acHourly').value = pr.hourly; $('acHours').value = pr.hours; }
  else $('acGross').value = pr.gross;
  setPressed('acFilS', pr.fil === 's'); setPressed('acFilM', pr.fil === 'm');
  setPressed('acRefCur', true); setPressed('acRefAsg', false);
  /* A preset may carry explicit cost lines, or leave them to the data. Removing `costs` from
     one preset without this guard threw on Object.keys(undefined), which killed the rest of
     applyPreset silently: no pay was set, so the tool opened with no answer at all and the
     loader's catch swallowed the error. */
  touchedCosts = {};
  if (pr.costs) {
    var map = COST_IDS;
    Object.keys(pr.costs).forEach(function (k) { $(map[k]).value = pr.costs[k]; });
  } else {
    localizeCosts();
  }
  document.querySelectorAll('[data-preset]').forEach(function (b, j) {
    b.setAttribute('aria-pressed', String(j === i));
    b.classList.toggle('on', j === i);
  });
  fmtAllMoney();
  compute();
}

/* ── small UI wiring ── */
function setPressed(id, on) { $(id).setAttribute('aria-pressed', String(!!on)); }
function setMode(m) {
  setPressed('acModeAnnual', m === 'a'); setPressed('acModeHourly', m === 'h');
  /* Annual and hourly are two views of the same pair of fields, one per place, plus the
     shared hours box. Each place owns its own number either way. */
  document.querySelectorAll('.ac-pay-annual').forEach(function (el) {
    /** @type {HTMLElement} */ (el).hidden = m === 'h';
  });
  document.querySelectorAll('.ac-pay-hourly').forEach(function (el) {
    /** @type {HTMLElement} */ (el).hidden = m !== 'h';
  });
}
/* the offer fields follow BOTH toggles: offer on/off and annual/hourly */
function setSelect(id, val) { $(id).value = val; }
/* COUNTIES[abbr] rows are [fips, name]; option value is the FIPS join key */
function fillCounties(id, stateAbbr, selected) {
  var sel = $(id);
  var list = (COUNTIES && COUNTIES[stateAbbr]) || [];
  sel.innerHTML = '<option value="">Statewide</option>' + list.map(function (row) {
    return '<option value="' + row[0] + '">' + row[1] + '</option>';
  }).join('');
  sel.disabled = !list.length;
  if (selected) sel.value = selected;
}
function countyName(stateAbbr, fips) {
  var list = (COUNTIES && COUNTIES[stateAbbr]) || [];
  for (var i = 0; i < list.length; i++) if (list[i][0] === fips) return list[i][1];
  return '';
}

function buildStateSelects() {
  var entries = Object.keys(STATES).map(function (ab) { return [ab, STATES[ab]]; })
    .sort(function (a, b) { return a[1].localeCompare(b[1]); });
  ['acCurState', 'acAsgState'].forEach(function (id) {
    $(id).innerHTML = '<option value="">Choose a state</option>' +
      entries.map(function (e) { return '<option value="' + e[0] + '">' + e[1] + '</option>'; }).join('');
  });
}

function wire() {
  var markDirty = function () {
    dirty = true; activePreset = null; hideUndo();
    /* the lit preset chip must stop lying the moment the scenario is yours */
    document.querySelectorAll('[data-preset]').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); b.classList.remove('on'); });
  };
  ['acGross', 'acHourly', 'acHours', 'acGross2', 'acHourly2', 'acStipend', 'acBonus', 'acWeeks',
   'acHousing', 'acUtil', 'acTrans', 'acGroc', 'acIns', 'acHealth', 'acOther'].forEach(function (id) {
    $(id).addEventListener('input', debounce(compute, 250));
    $(id).addEventListener('input', markDirty);
    /* Typing in a cost line claims it. A later location change refills the other six and
       leaves this one alone, because overwriting a number someone just entered is the
       rudest thing a form can do. */
    $(id).addEventListener('input', function () {
      Object.keys(COST_IDS).forEach(function (k) { if (COST_IDS[k] === id) touchedCosts[k] = true; });
    });
  });
  MONEY_IDS.forEach(function (id) {
    $(id).addEventListener('blur', function () { fmtField(id); });
  });
  /* Picking a location REFILLS the seven cost lines from that place's own data, so the answer
     is about somewhere real before anyone opens the fold. Anything the visitor has typed by
     hand is left alone: see touchedCosts. 2026-09-22. */
  $('acCurState').addEventListener('change', function () { markDirty(); fillCounties('acCurCounty', this.value, ''); localizeCosts(); fmtAllMoney(); compute(); });
  $('acAsgState').addEventListener('change', function () { markDirty(); fillCounties('acAsgCounty', this.value, ''); localizeCosts(); fmtAllMoney(); compute(); });
  ['acCurCounty', 'acAsgCounty', 'acProf'].forEach(function (id) {
    $(id).addEventListener('change', function () {
      markDirty();
      if (id !== 'acProf') { localizeCosts(); fmtAllMoney(); }   /* county sharpens housing to real rent */
      compute();
    });
  });
  /* SWAP THE TWO PLACES. David, 2026-09-22: "an arrow from one to the other, and you can hit
     it to swap." It moves the counties with the states, because a county belongs to its state
     and leaving them behind would silently produce a county in the wrong place. It moves the
     PAY too when an offer is entered, since that figure is the pay AT the new location: swap
     the places without it and the tool quietly answers a question nobody asked. */
  $('acSwap').addEventListener('click', function () {
    markDirty();
    var curS = $('acCurState').value, asgS = $('acAsgState').value;
    var curC = $('acCurCounty').value, asgC = $('acAsgCounty').value;

    $('acCurState').value = asgS; $('acAsgState').value = curS;
    fillCounties('acCurCounty', asgS, asgC);
    fillCounties('acAsgCounty', curS, curC);

    /* the pay belongs to its place, so it travels with it. Hours are shared and stay put. */
    var g1 = $('acGross').value, g2 = $('acGross2').value;
    $('acGross').value = g2; $('acGross2').value = g1;
    var r1 = $('acHourly').value, r2 = $('acHourly2').value;
    $('acHourly').value = r2; $('acHourly2').value = r1;

    this.classList.toggle('spin');
    localizeCosts(); fmtAllMoney(); compute();
    if ($('acLive')) $('acLive').textContent = 'Swapped. Now comparing ' + (STATES[asgS] || asgS) + ' to ' + (STATES[curS] || curS) + '.';
  });
  $('acModeAnnual').addEventListener('click', function () { setMode('a'); compute(); });
  $('acModeHourly').addEventListener('click', function () { setMode('h'); compute(); });
  [['acFilS', 'acFilM'], ['acFilM', 'acFilS'], ['acRefCur', 'acRefAsg'], ['acRefAsg', 'acRefCur'],
   ['acStipUntaxed', 'acStipTaxed'], ['acStipTaxed', 'acStipUntaxed']].forEach(function (pair) {
    $(pair[0]).addEventListener('click', function () { markDirty(); setPressed(pair[0], true); setPressed(pair[1], false); compute(); });
  });
  document.querySelectorAll('[data-preset]').forEach(function (/** @type {HTMLElement} */ b) {
    b.addEventListener('click', function () {
      /* presets get the same one-shot undo as reset: a curiosity tap must
         never cost a hand-built scenario */
      if (dirty && location.search.length > 1) {
        prevScenario = location.search;
        $('acUndoBtn').classList.add('show');
        clearTimeout(undoTimer);
        undoTimer = setTimeout(hideUndo, 60000);
      }
      applyPreset(Number(b.dataset.preset));
    });
  });

  /* reset is recoverable: one tap out, one tap back (the amber undo chip) */
  var undoTimer = null;
  function hideUndo() { $('acUndoBtn').classList.remove('show'); clearTimeout(undoTimer); }
  $('acResetBtn').addEventListener('click', function () {
    prevScenario = location.search;
    startBlank();
    if (prevScenario && prevScenario.length > 1) {
      $('acUndoBtn').classList.add('show');
      clearTimeout(undoTimer);
      undoTimer = setTimeout(hideUndo, 60000);
      $('acLive').textContent = 'Reset to the example. Undo is in the toolbar for the next minute.';
    }
  });
  $('acUndoBtn').addEventListener('click', function () {
    if (!prevScenario) return;
    history.replaceState(null, '', location.pathname + prevScenario);
    hideUndo();
    if (restoreUrl()) { dirty = true; activePreset = null; fmtAllMoney(); compute(); }
  });

  /* the phone sticky strip returns the thumb to the answer */
  $('acSticky').addEventListener('click', function () {
    document.querySelector('.ac-results-inner').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  /* the ask, as the sentence Dana actually says on the phone */
  $('acAskBtn').addEventListener('click', function () {
    if (!lastCalc || lastCalc.be == null || lastCalc.s.gross <= 0) return;
    var sc = lastCalc.s, hrs = num('acHours') || 1872;
    var txt = 'I need at least ' + fmt(lastCalc.be) + ' gross (about ' + fmt(lastCalc.be / hrs) + '/hr at ' + hrs +
      ' hrs a year) for ' + STATES[sc.as] + ' to beat staying in ' + STATES[sc.cs] + '.';
    var btn = $('acAskBtn');
    var done = function (okd) {
      btn.textContent = okd ? '✓ Copied' : 'Copy blocked';
      setTimeout(function () { btn.textContent = 'Copy the ask'; }, 2000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function () { done(true); }, function () { done(false); });
    else done(false);
  });


  /* the view switcher */
  document.querySelectorAll('[data-show]').forEach(function (b) {
    b.addEventListener('click', function () { setView(b.getAttribute('data-show')); if (lastCalc) syncUrl(lastCalc.s); });
  });

  /* methodology sheet: kit detents, real focus order, hardware back = close.
     Closed = inert so its links never ghost into the tab order. */
  var sheetEl = $('acMethodSheet'), mBtn = $('acMethodBtn');
  var kitSheet = window.HUKit && HUKit.sheet ? HUKit.sheet(sheetEl, {
    startDetent: 'dt-full',
    onDismiss: function () { closeSheet(); }
  }) : null;
  function openSheet() {
    sheetEl.inert = false; sheetEl.removeAttribute('aria-hidden');
    if (kitSheet) kitSheet.open('dt-full'); else sheetEl.classList.add('open');
    mBtn.setAttribute('aria-expanded', 'true');
    $('acMethodClose').focus();
  }
  function closeSheet() {
    sheetEl.classList.remove('open');
    sheetEl.inert = true; sheetEl.setAttribute('aria-hidden', 'true');
    mBtn.setAttribute('aria-expanded', 'false');
    mBtn.focus();
  }
  sheetEl.inert = true; sheetEl.setAttribute('aria-hidden', 'true');
  mBtn.addEventListener('click', function () {
    sheetEl.classList.contains('open') ? closeSheet() : openSheet();
  });
  $('acMethodClose').addEventListener('click', closeSheet);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && sheetEl.classList.contains('open')) closeSheet(); });
  if (window.HUKit && HUKit.backGuard) HUKit.backGuard({
    watch: sheetEl,
    active: function () { return sheetEl.classList.contains('open'); },
    step: closeSheet
  });
}

/* ── boot: engine data is required, county list is nice-to-have ── */
Promise.all([
  fetch('/assets/data/assignment-compass.json').then(function (r) { return r.json(); }),
  fetch('/assets/data/derived/compass-counties.json').then(function (r) { return r.json(); }).catch(function () { return null; })
]).then(function (res) {
  DATA = res[0]; COUNTIES = res[1];
  buildStateSelects();
  wire();
  /* EXPLAIN ON DEMAND. David, 2026-09-22: "we have so many extra words and information that
     should be on an I bouble and just hover for the details." The page carried 604 words of
     prose across 24 blocks, most of it explaining rather than answering. The kit's peek card
     has existed since the games phase and this tool had never used it: hover on a mouse, tap on
     touch, and keyboard-reachable because each badge is a real <button>. */
  if (window.HUKit && HUKit.peek) HUKit.peek();
  /* The fold now ships CLOSED in the markup, at every width. It used to ship open and be
     closed by this line on phones only, which left a desktop visitor facing 14 inputs before
     the tool told them anything. Nothing to do here any more; <details> handles the rest. */
  setView(new URLSearchParams(location.search).get('v') || 'summary');
  if (!restoreUrl()) startBlank(); else { fmtAllMoney(); compute(); }

}).catch(function () {
  $('acTiles').innerHTML = '';
  $('acTileNote').textContent = 'Could not load the tax and cost data. Check your connection and refresh.';
  $('acLive').textContent = 'Could not load the tax and cost data. Check your connection and refresh.';
});

})();
