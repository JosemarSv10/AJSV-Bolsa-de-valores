import { convert, rateSeries } from "./cambio";
import { priceSeries } from "./cotacoes";
import { N, pad } from "./datas";

export function portfolioSeries(assets, books, rates, quotes, M) {
  const rs = { AOA: rateSeries(rates, "AOA"), USD: rateSeries(rates, "USD"), EUR: rateSeries(rates, "EUR") };
  const value = new Float64Array(N),
    invested = new Float64Array(N);
  for (const a of assets) {
    const b = books[a.id];
    if (!b) continue;
    const p = priceSeries(a, quotes);
    const ra = rs[a.moeda],
      rm = rs[M];
    for (let i = 0; i < N; i++) {
      if (!b.qty[i] && !b.cost[i]) continue;
      const f = ra[i] / rm[i];
      value[i] += b.qty[i] * p[i] * f;
      invested[i] += b.cost[i] * f;
    }
  }
  return { value, invested };
}

export function monthlyIncome(txs, rates, M, months = 12) {
  const keys = [];
  const d = new Date();
  d.setDate(1);
  for (let i = months - 1; i >= 0; i--) {
    const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
    keys.push(`${x.getFullYear()}-${pad(x.getMonth() + 1)}`);
  }
  const tot = Object.fromEntries(keys.map((k) => [k, 0]));
  for (const t of txs)
    if (t.tipo === "rendimento") {
      const k = t.data.slice(0, 7);
      if (k in tot) tot[k] += convert(rates, t.quantidade * t.preco, t.moeda, M, t.data);
    }
  return keys.map((k) => ({ mes: k, valor: tot[k] }));
}
