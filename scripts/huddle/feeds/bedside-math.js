'use strict';
/**
 * FEED: more bedside math (2026-10-18).
 *
 * Reads: nothing. Like section 4 of the builder, every number a question needs is in the question, and every formula it
 * uses is stated in it or is plain arithmetic, so it claims nothing about any drug, any patient or any normal (DH2). No
 * drug is named and no question asks for a dose. The check date is the day these were written and worked.
 * Asks: unit changes (pounds, Fahrenheit), BMI, static compliance, driving pressure, RSBI, the anion gap, pack-years,
 * heart rate from the ECG grid, cardiac output, urine output per kilogram, fluid balance, mg/kg and mcg/kg/min orders as
 * arithmetic, cylinder time with a reserve, the A-a gradient, oxygen content, corrected calcium, FEV1/FVC, peak flow,
 * the ventilator rate for a target PaCO2, expiratory time, the GCS total and time left on a bag.
 * A new row: a line in a FORMS list below; each form keeps its own template key.
 */
const { kOf, commas } = require('../lib');

const reads = [];
const WRITTEN = '2026-10-18';
const SRC = { src: 'Arithmetic. Every number is given in the question.', ck: WRITTEN, yr: Number(WRITTEN.slice(0, 4)) };
const r1 = (v) => Math.round(v * 10) / 10;

/* Each form: key, dots, the rounding, then rows of numbers. q(row) -> [question, answer, why, hint, sub]. The answer is
   rounded the way the sub line says; a number counts within half a step of that rounding (abs). */
/** @type {{key:string, d:number, dp:number, sub?:string, rows:any[][], q:(row:any[]) => [string, number, string, string]}[]} */
const FORMS = [
  { key: 'lbkg', d: 1, dp: 1, sub: 'Round to one decimal place.', rows: [[154], [176], [132], [198], [121], [243]],
    q: ([lb]) => [`A patient weighs ${lb} pounds. Using 2.2 pounds per kilogram, what is that in kg?`, r1(lb / 2.2), `${lb} ÷ 2.2 = ${r1(lb / 2.2)} kg.`, 'Divide the pounds by 2.2.'] },
  { key: 'temp', d: 2, dp: 1, sub: 'Round to one decimal place.', rows: [[101.3], [98.6], [103.1], [96.8], [100.4], [104]],
    q: ([F]) => [`A temperature reads ${F} °F. Using °C = (°F - 32) × 5 ÷ 9, what is it in °C?`, r1((F - 32) * 5 / 9), `(${F} - 32) × 5 ÷ 9 = ${r1((F - 32) * 5 / 9)} °C.`, `Start with ${F} - 32 = ${r1(F - 32)}.`] },
  { key: 'bmi', d: 2, dp: 1, sub: 'Round to one decimal place.', rows: [[70, 1.75], [90, 1.8], [55, 1.6], [110, 1.7], [62, 1.68], [84, 1.9]],
    q: ([kg, m]) => [`A patient weighs ${kg} kg and is ${m} m tall. Using BMI = kg ÷ m², what is the BMI?`, r1(kg / (m * m)), `${m} × ${m} = ${Math.round(m * m * 100) / 100}, and ${kg} ÷ ${Math.round(m * m * 10000) / 10000} = ${r1(kg / (m * m))}.`, `First square the height: ${m} × ${m}.`] },
  { key: 'cst', d: 2, dp: 0, sub: 'Round to a whole number.', rows: [[450, 25, 5], [500, 30, 10], [400, 22, 8], [360, 28, 8], [550, 24, 6], [420, 32, 12]],
    q: ([vt, pp, peep]) => [`Tidal volume ${vt} mL, plateau pressure ${pp} cmH2O, PEEP ${peep} cmH2O. Using static compliance = tidal volume ÷ (plateau minus PEEP), what is it in mL/cmH2O?`,
      Math.round(vt / (pp - peep)), `${vt} ÷ (${pp} - ${peep}) = ${r1(vt / (pp - peep))}.`, `${pp} minus ${peep} is ${pp - peep} cmH2O.`] },
  { key: 'drive', d: 1, dp: 0, rows: [[28, 10], [22, 5], [30, 14], [25, 8], [19, 5], [33, 12]],
    q: ([pp, peep]) => [`Plateau pressure ${pp} cmH2O, PEEP ${peep} cmH2O. What is the driving pressure, plateau minus PEEP, in cmH2O?`, pp - peep, `${pp} - ${peep} = ${pp - peep} cmH2O.`, 'Take the PEEP away from the plateau.'] },
  { key: 'rsbi', d: 2, dp: 0, sub: 'Round to a whole number.', rows: [[30, 300], [22, 400], [35, 250], [18, 450], [28, 350], [40, 200]],
    q: ([rr, vt]) => [`Respiratory rate ${rr}, spontaneous tidal volume ${vt} mL. Using RSBI = rate ÷ tidal volume in liters, what is the RSBI?`, Math.round(rr / (vt / 1000)), `${vt} mL is ${vt / 1000} L, and ${rr} ÷ ${vt / 1000} = ${r1(rr / (vt / 1000))}.`, '1,000 mL is 1 L, so move the decimal three places.'] },
  { key: 'gap', d: 1, dp: 0, rows: [[140, 104, 24], [136, 98, 18], [142, 100, 14], [138, 106, 22], [145, 102, 20], [134, 96, 12]],
    q: ([na, cl, hc]) => [`Sodium ${na}, chloride ${cl}, bicarbonate ${hc}, all in mEq/L. Using anion gap = sodium minus (chloride + bicarbonate), what is the anion gap?`, na - (cl + hc), `${na} - (${cl} + ${hc}) = ${na - (cl + hc)}.`, `${cl} + ${hc} = ${cl + hc}.`] },
  { key: 'packyr', d: 1, dp: 0, rows: [[1, 30], [2, 15], [0.5, 40], [1.5, 20], [3, 10], [1, 45]],
    q: ([ppd, y]) => [`A patient smoked ${ppd} ${ppd === 1 ? 'pack' : 'packs'} a day for ${y} years. Pack-years are packs a day times years smoked. How many pack-years is that?`, ppd * y, `${ppd} × ${y} = ${ppd * y} pack-years.`, 'Multiply packs a day by the years.'] },
  { key: 'ecg', d: 1, dp: 0, rows: [[2], [3], [4], [5], [6], [1.5]],
    q: ([n]) => [`On an ECG at standard speed, there are ${n} large boxes between two R waves. Using 300 ÷ large boxes, what is the heart rate?`, Math.round(300 / n), `300 ÷ ${n} = ${Math.round(300 / n)} beats a minute.`, 'Divide 300 by the number of large boxes.'] },
  { key: 'co', d: 2, dp: 1, sub: 'Round to one decimal place.', rows: [[80, 70], [110, 50], [60, 90], [95, 65], [72, 80], [130, 40]],
    q: ([hr, sv]) => [`Heart rate ${hr}, stroke volume ${sv} mL. Using cardiac output = heart rate × stroke volume, what is the cardiac output in L/min?`, r1(hr * sv / 1000), `${hr} × ${sv} = ${commas(hr * sv)} mL a minute, which is ${r1(hr * sv / 1000)} L/min.`, '1,000 mL is 1 L.'] },
  { key: 'uop', d: 2, dp: 1, sub: 'Round to one decimal place.', rows: [[70, 210, 6], [80, 160, 4], [60, 90, 3], [90, 540, 8], [75, 150, 5], [50, 120, 4]],
    q: ([kg, ml, h]) => [`A ${kg} kg patient made ${ml} mL of urine in ${h} hours. How many mL/kg/hr is that?`, r1(ml / kg / h), `${ml} ÷ ${kg} ÷ ${h} = ${r1(ml / kg / h)} mL/kg/hr.`, `Divide by ${kg} kg, then by ${h} hours.`] },
  { key: 'io', d: 1, dp: 0, rows: [[1850, 1200], [2400, 1650], [3100, 2275], [1500, 1325], [2750, 1900], [2000, 1480]],
    q: ([i, o]) => [`Over a shift, intake was ${commas(i)} mL and output was ${commas(o)} mL. What is the net fluid balance, intake minus output, in mL?`, i - o, `${commas(i)} - ${commas(o)} = ${commas(i - o)} mL.`, 'Take the output away from the intake.'] },
  { key: 'mgkg', d: 1, dp: 0, rows: [[5, 80], [10, 72], [7.5, 60], [2, 95], [15, 68], [3, 84]],
    q: ([per, kg]) => [`An order is ${per} mg/kg and the patient weighs ${kg} kg. How many mg does the order come to?`, per * kg, `${per} × ${kg} = ${commas(per * kg)} mg.`, 'Multiply mg/kg by the weight in kg.'] },
  { key: 'mcgmin', d: 3, dp: 1, sub: 'Round to one decimal place.', rows: [[400, 250, 5, 80], [250, 250, 3, 70], [800, 250, 10, 75], [200, 100, 2, 90], [400, 500, 4, 65], [100, 250, 0.5, 82]],
    q: ([mg, ml, rate, kg]) => {
      const conc = mg * 1000 / ml, per = rate * kg * 60;
      return [`A bag holds ${mg} mg in ${ml} mL. The order is ${rate} mcg/kg/min for a ${kg} kg patient. What pump rate is that, in mL/hr?`, r1(per / conc),
        `${rate} × ${kg} × 60 = ${commas(per)} mcg an hour, and the bag holds ${commas(conc)} mcg per mL: ${commas(per)} ÷ ${commas(conc)} = ${r1(per / conc)} mL/hr.`, `The bag holds ${commas(conc)} mcg in each mL.`];
    } },
  { key: 'reserve', d: 2, dp: 0, sub: 'Round down to whole minutes.', rows: [['E', 0.28, 2000, 4], ['E', 0.28, 1500, 2], ['H', 3.14, 2200, 10], ['E', 0.28, 1200, 3], ['H', 3.14, 1800, 15], ['E', 0.28, 1700, 6]],
    q: ([cyl, fac, psi, flow]) => [`An ${cyl} oxygen cylinder reads ${commas(psi)} psi and its factor is ${fac} L/psi. Keeping a 200 psi reserve, how many minutes will it last at ${flow} L/min?`,
      Math.floor((psi - 200) * fac / flow), `(${commas(psi)} - 200) × ${fac} = ${r1((psi - 200) * fac)} liters, and ÷ ${flow} = ${r1((psi - 200) * fac / flow)} minutes.`, `Start with ${commas(psi)} - 200 = ${commas(psi - 200)} psi you can use.`] },
  { key: 'aagrad', d: 3, dp: 0, sub: 'Round to a whole number, in mmHg.', rows: [[40, 85], [30, 70], [50, 55], [36, 92], [45, 60], [28, 80]],
    q: ([co2, o2]) => {
      const PA = 0.21 * (760 - 47) - co2 / 0.8;
      return [`At sea level on room air (FiO2 0.21), PaCO2 is ${co2} and PaO2 is ${o2} mmHg. Using PAO2 = 0.21 × (760 - 47) - PaCO2 ÷ 0.8, what is the A-a gradient?`, Math.round(PA - o2),
        `PAO2 = 149.7 - ${co2} ÷ 0.8 = ${r1(PA)}, and ${r1(PA)} - ${o2} = ${r1(PA - o2)}.`, 'The A-a gradient is the PAO2 minus the PaO2.'];
    } },
  { key: 'cao2', d: 3, dp: 1, sub: 'Round to one decimal place.', rows: [[15, 98, 95], [10, 90, 60], [12, 95, 80], [8, 88, 55], [14, 100, 300], [11, 92, 65]],
    q: ([hb, sat, o2]) => {
      const c = 1.34 * hb * sat / 100 + 0.003 * o2;
      return [`Hemoglobin ${hb} g/dL, SaO2 ${sat} percent, PaO2 ${o2} mmHg. Using CaO2 = 1.34 × Hb × SaO2 + 0.003 × PaO2, with SaO2 as a fraction, what is the oxygen content in mL/dL?`, r1(c),
        `1.34 × ${hb} × ${sat / 100} = ${r1(1.34 * hb * sat / 100)}, plus 0.003 × ${o2} = ${r1(0.003 * o2 * 100) / 100}: ${r1(c)} mL/dL.`, `${sat} percent as a fraction is ${sat / 100}.`];
    } },
  { key: 'calcium', d: 2, dp: 1, sub: 'Round to one decimal place.', rows: [[7.6, 2.5], [8.0, 3.0], [7.2, 2.0], [8.4, 2.8], [7.9, 1.5], [6.8, 2.2]],
    q: ([ca, alb]) => [`Calcium ${ca} mg/dL, albumin ${alb} g/dL. Using corrected calcium = calcium + 0.8 × (4 - albumin), what is the corrected calcium?`, r1(ca + 0.8 * (4 - alb)),
      `${ca} + 0.8 × ${r1(4 - alb)} = ${r1(ca + 0.8 * (4 - alb))} mg/dL.`, `4 minus ${alb} is ${r1(4 - alb)}.`] },
  { key: 'fev', d: 1, dp: 0, sub: 'Round to a whole percent.', rows: [[2.4, 3.6], [3.1, 4.0], [1.2, 2.8], [2.0, 2.9], [3.5, 4.4], [1.6, 3.2]],
    q: ([f1, fvc]) => [`FEV1 is ${f1} L and FVC is ${fvc} L. What is FEV1/FVC, as a percent?`, Math.round(f1 / fvc * 100), `${f1} ÷ ${fvc} = ${Math.round(f1 / fvc * 1000) / 1000}, which is ${Math.round(f1 / fvc * 100)} percent.`, 'Divide FEV1 by FVC, then multiply by 100.'] },
  { key: 'peak', d: 1, dp: 0, sub: 'Round to a whole percent.', rows: [[300, 500], [220, 450], [410, 520], [180, 400], [350, 600], [270, 480]],
    q: ([m, p]) => [`A patient's peak flow is ${m} L/min and the predicted value is ${p} L/min. What percent of predicted is that?`, Math.round(m / p * 100), `${m} ÷ ${p} × 100 = ${r1(m / p * 100)} percent.`, 'Divide the measured by the predicted, then multiply by 100.'] },
  { key: 'ratefix', d: 2, dp: 0, sub: 'Round to a whole number of breaths.', rows: [[55, 12, 40], [60, 14, 42], [30, 20, 40], [50, 16, 40], [65, 10, 45], [32, 18, 40]],
    q: ([p1, rr, p2]) => [`PaCO2 is ${p1} mmHg at a set rate of ${rr}. Using new rate = set rate × current PaCO2 ÷ target PaCO2, what rate should bring the PaCO2 to ${p2}?`, Math.round(rr * p1 / p2),
      `${rr} × ${p1} = ${rr * p1}, and ${rr * p1} ÷ ${p2} = ${r1(rr * p1 / p2)}.`, `${rr} × ${p1} = ${rr * p1}.`] },
  { key: 'etime', d: 2, dp: 1, sub: 'Round to one decimal place.', rows: [[1.0, 15], [0.8, 20], [1.2, 12], [0.9, 18], [1.0, 10], [0.7, 24]],
    q: ([ti, rr]) => [`Inspiratory time is ${ti} seconds at a rate of ${rr} breaths a minute. How long is each expiratory time, in seconds?`, r1(60 / rr - ti), `60 ÷ ${rr} = ${r1(60 / rr)} seconds a breath, minus ${ti} = ${r1(60 / rr - ti)}.`, `Each whole breath lasts 60 ÷ ${rr} seconds.`] },
  { key: 'gcs', d: 1, dp: 0, rows: [[2, 2, 4], [3, 4, 5], [1, 1, 3], [4, 5, 6], [3, 3, 5], [2, 1, 4]],
    q: ([e, v, m]) => [`A patient scores eye opening ${e}, verbal ${v} and motor ${m} on the Glasgow Coma Scale. What is the GCS total?`, e + v + m, `${e} + ${v} + ${m} = ${e + v + m}.`, 'Add the eye, verbal and motor scores.'] },
  { key: 'bagtime', d: 1, dp: 1, sub: 'Round to one decimal place.', rows: [[1000, 125], [500, 80], [250, 100], [1000, 150], [750, 60], [500, 200]],
    q: ([v, rate]) => [`A ${commas(v)} mL bag runs at ${rate} mL/hr. How many hours until it is empty?`, r1(v / rate), `${commas(v)} ÷ ${rate} = ${r1(v / rate)} hours.`, 'Divide the mL in the bag by the mL an hour.'] }
];

function build() {
  const out = [];
  for (const F of FORMS) {
    F.rows.forEach((row, n) => {
      const [q, a, why, h] = F.q(row);
      const abs = F.dp >= 1 ? 0.05 : F.key === 'reserve' ? 1 : 0.5;
      out.push({ ...SRC, z: 'sci', f: 'Clinical math', id: `bm-${F.key}-${n}`, k: kOf('bm', F.key), d: F.d, t: 'number', q, sub: F.sub, a, abs,
        pre: '', suf: '', dp: F.dp, why, h });
    });
  }
  return out;
}

module.exports = { name: 'bedside-math', prefix: 'bm-', reads, build };
