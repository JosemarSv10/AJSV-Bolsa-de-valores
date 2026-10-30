export const pad = (n) => String(n).padStart(2, "0");

export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const TODAY = ymd(new Date());

export const START = "2024-11-01";

export const DAYS = (() => {
  const o = [];
  const d = new Date(2024, 10, 1, 12);
  const t = new Date();
  t.setHours(12, 0, 0, 0);
  while (d <= t) {
    o.push(ymd(d));
    d.setDate(d.getDate() + 1);
  }
  return o;
})();

export const N = DAYS.length;

export const DAY_INDEX = new Map(DAYS.map((d, i) => [d, i]));

export function idxOf(date) {
  if (date <= DAYS[0]) return 0;
  if (date >= DAYS[N - 1]) return N - 1;
  return DAY_INDEX.get(date) ?? 0;
}

export function addDays(date, k) {
  const d = new Date(date + "T12:00:00");
  d.setDate(d.getDate() + k);
  return ymd(d);
}

export function daysBetween(a, b) {
  return Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 86400000);
}
