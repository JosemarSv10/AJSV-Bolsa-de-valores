import { DAYS, N, TODAY } from "./datas";

export function sortedRates(rates, m) {
  return rates.filter((r) => r.moeda === m).sort((a, b) => a.data.localeCompare(b.data));
}

export function rateAOA(rates, m, date) {
  if (m === "AOA") return 1;
  const l = sortedRates(rates, m);
  let f = l[0];
  for (const r of l) {
    if (r.data <= date) f = r;
    else break;
  }
  return f ? f.valor : NaN;
}

export function rateSeries(rates, m) {
  const s = new Float64Array(N);
  if (m === "AOA") {
    s.fill(1);
    return s;
  }
  const l = sortedRates(rates, m);
  let j = 0,
    cur = l[0]?.valor ?? NaN;
  for (let i = 0; i < N; i++) {
    while (j < l.length && l[j].data <= DAYS[i]) {
      cur = l[j].valor;
      j++;
    }
    s[i] = cur;
  }
  return s;
}

export function convert(rates, v, de, para, date = TODAY) {
  if (de === para) return v;
  return (v * rateAOA(rates, de, date)) / rateAOA(rates, para, date);
}
