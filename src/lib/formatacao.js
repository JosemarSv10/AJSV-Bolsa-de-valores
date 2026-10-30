export const FMT = {};

export function nf(key, opts) {
  return FMT[key] || (FMT[key] = new Intl.NumberFormat("pt-AO", opts));
}

export function money(v, m, max = 2) {
  if (!isFinite(v)) return "—";
  return nf("m" + m + max, {
    style: "currency",
    currency: m,
    maximumFractionDigits: max,
    minimumFractionDigits: Math.min(max, m === "AOA" && max ? 2 : max),
  }).format(v);
}

export function moneyC(v, m) {
  if (!isFinite(v)) return "—";
  return Math.abs(v) >= 1e6
    ? nf("c" + m, { style: "currency", currency: m, notation: "compact", maximumFractionDigits: 1 }).format(v)
    : money(v, m, 0);
}

export const num = (v, max = 4) =>
  isFinite(v) ? nf("n" + max, { maximumFractionDigits: max }).format(v) : "—";

export const pct = (v, sign = true) =>
  isFinite(v)
    ? (sign && v > 0 ? "+" : "") +
      nf("p", { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)
    : "—";

export const signed = (v, m, max = 2) => (v > 0 ? "+" : "") + money(v, m, max);

export const fmtDate = (d) =>
  d && d !== "—"
    ? new Date(d + "T12:00:00").toLocaleDateString("pt-AO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

export const fmtShort = (d) =>
  new Date(d + "T12:00:00").toLocaleDateString("pt-AO", { day: "2-digit", month: "short" });

export const fmtMonth = (k) =>
  new Date(k + "-15T12:00:00").toLocaleDateString("pt-AO", { month: "short" }).replace(".", "");

export const tone = (v) => (v > 1e-9 ? "gain" : v < -1e-9 ? "loss" : "flat");

export const uid = (p) => p + Math.random().toString(36).slice(2, 10);

export const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

export const initials = (s) =>
  s
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

export function logoColor(a) {
  return a.classe === "acao"
    ? "var(--c-acao)"
    : a.classe === "cripto"
      ? "var(--c-cripto)"
      : a.classe === "titulo"
        ? "var(--c-titulo)"
        : a.classe === "imovel"
          ? "var(--c-imovel)"
          : "var(--c-outro)";
}
