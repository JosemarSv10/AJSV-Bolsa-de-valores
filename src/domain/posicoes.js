import { convert } from "./cambio";
import { DAYS, N } from "./datas";

export const TYPE_ORDER = { compra: 0, taxa: 1, rendimento: 2, venda: 3 };

export function sortTx(list) {
  return [...list].sort(
    (a, b) =>
      a.data.localeCompare(b.data) ||
      TYPE_ORDER[a.tipo] - TYPE_ORDER[b.tipo] ||
      String(a.id).localeCompare(String(b.id), undefined, { numeric: true })
  );
}

export function newBook() {
  return { qty: 0, cost: 0, realized: 0, income: 0, fees: 0, bought: 0, sold: 0 };
}

export function applyTx(s, t, a, rates) {
  const total = convert(rates, t.quantidade * t.preco, t.moeda, a.moeda, t.data);
  if (t.tipo === "compra") {
    s.qty += t.quantidade;
    s.cost += total;
    s.bought += total;
  } else if (t.tipo === "venda") {
    const avg = s.qty > 0 ? s.cost / s.qty : 0;
    const q = Math.min(t.quantidade, s.qty);
    const unit = total / t.quantidade;
    s.realized += (unit - avg) * q;
    s.cost -= avg * q;
    s.qty -= q;
    s.sold += total;
    if (s.qty < 1e-10) {
      s.qty = 0;
      s.cost = 0;
    }
  } else if (t.tipo === "rendimento") s.income += total;
  else if (t.tipo === "taxa") {
    s.fees += total;
    if (s.qty > 0) s.cost += total;
    else s.realized -= total;
  }
}

export function position(a, txs, rates, price) {
  const list = sortTx(txs.filter((t) => t.ativo === a.id));
  const s = newBook();
  for (const t of list) applyTx(s, t, a, rates);
  const value = s.qty * price;
  const gain = value - s.cost;
  return {
    ...s,
    count: list.length,
    avg: s.qty > 0 ? s.cost / s.qty : 0,
    price,
    value,
    gain,
    pct: s.cost > 0 ? gain / s.cost : 0,
  };
}

export function dailyBook(a, txs, rates) {
  const list = sortTx(txs.filter((t) => t.ativo === a.id));
  const qty = new Float64Array(N),
    cost = new Float64Array(N);
  const s = newBook();
  let j = 0;
  while (j < list.length && list[j].data < DAYS[0]) {
    applyTx(s, list[j], a, rates);
    j++;
  }
  for (let i = 0; i < N; i++) {
    while (j < list.length && list[j].data <= DAYS[i]) {
      applyTx(s, list[j], a, rates);
      j++;
    }
    qty[i] = s.qty;
    cost[i] = s.cost;
  }
  return { qty, cost };
}

export function heldAt(txs, assetId, date) {
  return txs
    .filter((t) => t.ativo === assetId && t.data <= date)
    .reduce(
      (q, t) => (t.tipo === "compra" ? q + t.quantidade : t.tipo === "venda" ? q - t.quantidade : q),
      0
    );
}

export function ledgerProblem(txs, assetId) {
  let q = 0;
  for (const t of sortTx(txs.filter((t) => t.ativo === assetId))) {
    if (t.tipo === "compra") q += t.quantidade;
    else if (t.tipo === "venda") {
      if (t.quantidade > q + 1e-9) return { tx: t, held: q };
      q -= t.quantidade;
    }
  }
  return null;
}
