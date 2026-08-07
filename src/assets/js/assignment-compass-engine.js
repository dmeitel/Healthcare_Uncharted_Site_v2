/* ================================================================
   ASSIGNMENT COMPASS · calculation engine
   Pure functions only. No DOM, no fetch. The page passes in the
   data object from /assets/data/assignment-compass.json; Node can
   require() this file and do the same, which is how the tax math
   gets spot-checked (see acceptance criteria in the build prompt).

   Filing status keys: 's' (single) | 'm' (married filing jointly).
   All dollar figures are ANNUAL unless a name says monthly.
================================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CompassEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* Marginal tax over [threshold, rate] rows sorted ascending.
     Each rate applies from its threshold up to the next one. */
  function marginal(brackets, taxable) {
    if (taxable <= 0) return 0;
    var tax = 0;
    for (var i = 0; i < brackets.length; i++) {
      var lo = brackets[i][0];
      var rate = brackets[i][1];
      var hi = (i + 1 < brackets.length) ? brackets[i + 1][0] : Infinity;
      if (taxable <= lo) break;
      tax += (Math.min(taxable, hi) - lo) * rate;
    }
    return tax;
  }

  /* State income tax for one jurisdiction spec (data.states[abbr].tax). */
  function stateIncomeTax(spec, gross, filing) {
    if (!spec || spec.type === 'none') return 0;
    var sd = spec.sd ? (spec.sd[filing] || 0) : 0;
    var taxable = Math.max(0, gross - sd);
    var tax = 0;
    if (spec.type === 'flat') tax = taxable * spec.rate;
    else tax = marginal(spec.brackets[filing], taxable);

    if (spec.credit) tax = Math.max(0, tax - (spec.credit[filing] || 0));
    if (spec.utCredit) {
      var c = spec.utCredit;
      var credit = Math.max(0, (c.max[filing] || 0) - Math.max(0, gross - (c.start[filing] || 0)) * c.po);
      tax = Math.max(0, tax - credit);
    }
    return tax;
  }

  /* Mandatory worker payroll deductions (SDI, PFML, TDI...). */
  function payrollTax(items, gross) {
    var total = 0, lines = [];
    (items || []).forEach(function (p) {
      var amt = 0;
      if (p.fixedAnnual) amt = p.fixedAnnual;
      else if (p.rate) {
        var wages = p.base ? Math.min(gross, p.base) : gross;
        amt = wages * p.rate;
        if (p.capAnnual) amt = Math.min(amt, p.capAnnual);
      }
      total += amt;
      lines.push({ label: p.label, amount: amt, note: p.note || '' });
    });
    return { total: total, lines: lines };
  }

  function federalTax(fed, gross, filing) {
    return marginal(fed.brackets[filing], Math.max(0, gross - fed.sd[filing]));
  }

  function ficaTax(fica, gross, filing) {
    var ss = Math.min(gross, fica.ssBase) * fica.ssRate;
    var med = gross * fica.medicare + Math.max(0, gross - fica.addlStart[filing]) * fica.addlMedicare;
    return ss + med;
  }

  /* Full annual net pay picture for one state. */
  function netPay(data, abbr, gross, filing) {
    var st = data.states[abbr];
    var fed = federalTax(data.federal, gross, filing);
    var fica = ficaTax(data.federal.fica, gross, filing);
    var state = stateIncomeTax(st.tax, gross, filing);
    var payroll = payrollTax(st.payroll, gross);
    return {
      gross: gross,
      federal: fed,
      fica: fica,
      state: state,
      payroll: payroll.total,
      payrollLines: payroll.lines,
      net: gross - fed - fica - state - payroll.total
    };
  }

  /* COL index for a spending category. data.states[abbr].col rows follow
     _meta.colKeys: [overall, grocery, housing, utilities, transportation,
     health, misc]. Insurance has no C2ER category; misc is the stand-in
     and the blind-spot cards carry the real warning. */
  var COL_IDX = { housing: 2, utilities: 3, transportation: 4, groceries: 1, insurance: 6, healthcare: 5, other: 6 };

  function colRatio(data, category, fromAbbr, toAbbr) {
    var i = COL_IDX[category];
    var from = data.states[fromAbbr].col[i];
    var to = data.states[toAbbr].col[i];
    if (!from || !to) return 1;
    return to / from;
  }

  /* County-grain housing signal (Phase 2). cdata is the lazily fetched
     assignment-compass-counties.json (or null). Returns the rent figure
     for one location at the finest grain available. */
  function rentSignal(cdata, abbr, fips) {
    if (cdata && fips && cdata.counties[fips]) {
      var c = cdata.counties[fips];
      return { z: c.z || null, r: c.r || null, grain: 'county' };
    }
    var st = cdata && cdata.states[abbr];
    return { z: null, r: st ? st.r : null, grain: 'state' };
  }

  /* Housing ratio from real rent data, when a county is in play.
     ZORI market rents when both sides have them; ACS median rents
     otherwise; null = caller falls back to the MERIC state index. */
  function housingRatio(cdata, curAbbr, curFips, asgAbbr, asgFips) {
    if (!cdata || (!curFips && !asgFips)) return null;
    var a = rentSignal(cdata, curAbbr, curFips);
    var b = rentSignal(cdata, asgAbbr, asgFips);
    var grain = (a.grain === 'county' && b.grain === 'county') ? 'county' : 'mixed';
    if (a.z && b.z) return { ratio: b.z / a.z, source: 'Zillow county rents', grain: grain };
    if (a.r && b.r) return { ratio: b.r / a.r, source: 'Census ACS rents', grain: grain };
    return null;
  }

  /* Project monthly costs entered for `enteredIn` into both locations.
     costs: {housing, utilities, transportation, groceries, insurance,
             healthcare, other} monthly dollars.
     overrides: optional {category: multiplier} where multiplier is the
     assignment/current ratio the user hand-set in the assumptions panel.
     geo: optional {counties, curFips, asgFips} · switches housing to
     county-grain rent data where available. User overrides always win. */
  function projectCosts(data, costs, enteredIn, currentAbbr, assignAbbr, overrides, geo) {
    overrides = overrides || {};
    var out = { current: {}, assign: {}, ratio: {}, housingMeta: null };
    var hr = geo ? housingRatio(geo.counties, currentAbbr, geo.curFips, assignAbbr, geo.asgFips) : null;
    Object.keys(COL_IDX).forEach(function (cat) {
      var val = Number(costs[cat]) || 0;
      var ratio;
      if (overrides[cat] != null) ratio = overrides[cat];
      else if (cat === 'housing' && hr) { ratio = hr.ratio; out.housingMeta = hr; }
      else ratio = colRatio(data, cat, currentAbbr, assignAbbr);
      out.ratio[cat] = ratio;
      if (enteredIn === 'assign') {
        out.assign[cat] = val;
        out.current[cat] = ratio ? val / ratio : val;
      } else {
        out.current[cat] = val;
        out.assign[cat] = val * ratio;
      }
    });
    out.current.total = sumCats(out.current);
    out.assign.total = sumCats(out.assign);
    return out;
  }

  function sumCats(obj) {
    return Object.keys(COL_IDX).reduce(function (s, k) { return s + (obj[k] || 0); }, 0);
  }

  /* Monthly position = net pay / 12 minus modeled monthly costs. */
  function monthlyPosition(data, abbr, gross, filing, monthlyCosts) {
    var pay = netPay(data, abbr, gross, filing);
    return { pay: pay, monthlyNet: pay.net / 12, monthlyCosts: monthlyCosts, position: pay.net / 12 - monthlyCosts };
  }

  /* Breakeven: the assignment-state gross that matches the current
     monthly position. Monotone in gross, so bisection converges fast. */
  function breakeven(data, assignAbbr, filing, targetPosition, assignMonthlyCosts) {
    var lo = 0, hi = 5000000;
    var f = function (g) { return netPay(data, assignAbbr, g, filing).net / 12 - assignMonthlyCosts - targetPosition; };
    if (f(hi) < 0) return null;
    for (var i = 0; i < 80; i++) {
      var mid = (lo + hi) / 2;
      if (f(mid) < 0) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  function hourlyToAnnual(hourly, hoursPerWeek) {
    return hourly * hoursPerWeek * 52;
  }

  return {
    marginal: marginal,
    stateIncomeTax: stateIncomeTax,
    payrollTax: payrollTax,
    federalTax: federalTax,
    ficaTax: ficaTax,
    netPay: netPay,
    colRatio: colRatio,
    rentSignal: rentSignal,
    housingRatio: housingRatio,
    projectCosts: projectCosts,
    monthlyPosition: monthlyPosition,
    breakeven: breakeven,
    hourlyToAnnual: hourlyToAnnual,
    COL_IDX: COL_IDX
  };
});
