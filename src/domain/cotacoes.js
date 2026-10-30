import { DAYS, N, TODAY, addDays, ymd } from "./datas";

export function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function gauss(r) {
  let u = 0,
    v = 0;
  while (!u) u = r();
  while (!v) v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export const HIST_CACHE = new Map();

export function autoHistory(a) {
  const key = [a.id, a.seed, a.inicio, a.anchor, a.vol, N].join("|");
  let h = HIST_CACHE.get(key);
  if (h) return h;
  const r = mulberry32(a.seed * 7919 + 13);
  const w = new Float64Array(N);
  for (let i = 1; i < N; i++) w[i] = w[i - 1] + a.vol * gauss(r);
  h = new Float64Array(N);
  const x = Math.log(a.inicio || a.anchor),
    y = Math.log(a.anchor);
  for (let i = 0; i < N; i++) {
    const t = N > 1 ? i / (N - 1) : 1;
    h[i] = Math.exp(x + (y - x) * t + w[i] - t * w[N - 1]);
  }
  HIST_CACHE.set(key, h);
  return h;
}

export function sortedVals(a) {
  return [...(a.avaliacoes || [])].sort((x, y) => x.data.localeCompare(y.data));
}

export function lastValuation(a) {
  const v = sortedVals(a);
  return v[v.length - 1] || null;
}

export function manualSeries(a) {
  const av = sortedVals(a);
  const s = new Float64Array(N);
  let j = 0,
    cur = av.length ? av[0].preco : 0;
  for (let i = 0; i < N; i++) {
    while (j < av.length && av[j].data <= DAYS[i]) {
      cur = av[j].preco;
      j++;
    }
    s[i] = cur;
  }
  return s;
}

export function currentPrice(a, quotes) {
  return a.fonte === "auto" ? (quotes[a.id]?.preco ?? a.anchor) : (lastValuation(a)?.preco ?? 0);
}

export function quoteDate(a, quotes) {
  return a.fonte === "auto"
    ? quotes[a.id]?.ts
      ? ymd(new Date(quotes[a.id].ts))
      : addDays(TODAY, -1)
    : lastValuation(a)?.data || "—";
}

export function priceSeries(a, quotes) {
  if (a.fonte === "auto") {
    const s = Float64Array.from(autoHistory(a));
    s[N - 1] = currentPrice(a, quotes);
    return s;
  }
  return manualSeries(a);
}

export function prevClose(a) {
  return a.fonte === "auto" ? autoHistory(a)[Math.max(0, N - 2)] : manualSeries(a)[Math.max(0, N - 2)];
}
