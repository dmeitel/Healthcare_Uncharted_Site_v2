/* ================================================================
   GSA PER DIEM PROXY — /.netlify/functions/perdiem?state=CA&year=2026
   The Assignment Compass calls this instead of api.gsa.gov directly:
   the site CSP pins connect-src to 'self', and the GSA API wants a
   key that should not ship to browsers. Set GSA_API_KEY in the
   Netlify env (free signup at api.data.gov); until then DEMO_KEY
   works at a low rate limit and the client degrades to the standard
   CONUS rate when this function errors.

   Response: { state, year, areas: [{ city, county, mie, lodging: [12
   monthly values Jan..Dec] }] } with long CDN/browser cache headers;
   rates change once a fiscal year.
================================================================ */
exports.handler = async function (event) {
  const params = event.queryStringParameters || {};
  const state = String(params.state || '').toUpperCase();
  const year = String(params.year || '');

  if (!/^[A-Z]{2}$/.test(state) || !/^20\d{2}$/.test(year)) {
    return resp(400, { error: 'Expected state=XX and year=20YY' });
  }

  const key = process.env.GSA_API_KEY || 'DEMO_KEY';
  const url = `https://api.gsa.gov/travel/perdiem/v2/rates/state/${state}/year/${year}?api_key=${key}`;

  try {
    const upstream = await fetch(url, { headers: { accept: 'application/json' } });
    if (!upstream.ok) return resp(502, { error: `GSA API returned ${upstream.status}` });
    const body = await upstream.json();

    const rateBlock = body && Array.isArray(body.rates) && body.rates[0];
    const entries = (rateBlock && Array.isArray(rateBlock.rate)) ? rateBlock.rate : [];
    const areas = entries.map((r) => ({
      city: r.city || '',
      county: r.county || '',
      mie: Number(r.meals) || 0,
      standard: r.standardRate === 'true',
      lodging: monthValues(r.months)
    })).filter((a) => a.lodging.length === 12);

    if (!areas.length) return resp(502, { error: 'Unexpected GSA response shape' });
    return resp(200, { state, year: Number(year), areas });
  } catch (err) {
    return resp(502, { error: 'GSA API unreachable' });
  }
};

function monthValues(months) {
  const list = months && Array.isArray(months.month) ? months.month : [];
  const out = new Array(12).fill(0);
  let seen = 0;
  for (const m of list) {
    const i = Number(m.number) - 1;
    if (i >= 0 && i < 12) { out[i] = Number(m.value) || 0; seen++; }
  }
  return seen === 12 ? out : [];
}

function resp(code, obj) {
  return {
    statusCode: code,
    headers: {
      'content-type': 'application/json',
      /* rates are annual; let browsers and the CDN hold them for a day */
      'cache-control': code === 200 ? 'public, max-age=86400' : 'no-store',
      'access-control-allow-origin': '*'
    },
    body: JSON.stringify(obj)
  };
}
