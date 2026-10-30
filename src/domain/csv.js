import { CURRENCIES } from "./constantes";
import { TODAY, ymd } from "./datas";
import { ledgerProblem, sortTx } from "./posicoes";

export const CSV_COLS = ["data", "ativo", "tipo", "quantidade", "preco_unitario", "moeda"];

export function parseDecimal(s) {
  if (typeof s === "number") return s;
  const t = String(s ?? "")
    .trim()
    .replace(/\s/g, "");
  if (!/^-?\d+([.,]\d+)?$/.test(t)) return NaN;
  return parseFloat(t.replace(",", "."));
}

// Aceita AAAA-MM-DD e também DD/MM/AAAA (formato comum nos extratos bancários)
export function normalizeDate(s) {
  const m = String(s).trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    return m ? m[3] + "-" + m[2] + "-" + m[1] : String(s).trim();
}

export function validDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T12:00:00");
  return !isNaN(d) && ymd(d) === s;
}

export function importCsv(text, db) {
  const lines = String(text)
    .replace(/^\uFEFF/, "")
    .replace(/\r/g, "")
    .split("\n")
    .map((l, i) => ({ l, n: i + 1 }))
    .filter((x) => x.l.trim() !== "");
  const accepted = [],
    rejected = [];
  if (!lines.length)
    return { accepted, rejected: [{ linha: 0, texto: "", motivo: "O ficheiro está vazio." }], fatal: true };
  const delim = lines[0].l.includes(";") ? ";" : ",";
  const header = lines[0].l
    .toLowerCase()
    .split(delim)
    .map((s) => s.trim());
  if (header.join("|") !== CSV_COLS.join("|"))
    return {
      accepted,
      rejected: [
        { linha: 1, texto: lines[0].l, motivo: `Cabeçalho inválido. Esperado: ${CSV_COLS.join(";")}` },
      ],
      fatal: true,
    };
  const tipoMap = {
    compra: "compra",
    venda: "venda",
    dividendo: "rendimento",
    juro: "rendimento",
    rendimento: "rendimento",
    taxa: "taxa",
  };
  const working = [...db.transactions];
  const seen = new Set();
  for (const { l: line, n } of lines.slice(1)) {
    const c = line.split(delim).map((s) => s.trim());
    const bad = (motivo) => rejected.push({ linha: n, texto: line, motivo });
    if (c.length !== 6) {
      bad(`Esperadas 6 colunas, encontradas ${c.length}.`);
      continue;
    }
    const [dataRaw, codigo, tipoRaw, qRaw, pRaw, moedaRaw] = c;
    const data = normalizeDate(dataRaw);
    if (!validDate(data)) {
      bad("Data inválida. Use AAAA-MM-DD.");
      continue;
    }
    if (data > TODAY) {
      bad("Data no futuro.");
      continue;
    }
    const asset = db.assets.find((a) => a.codigo.toUpperCase() === codigo.toUpperCase());
    if (!asset) {
      bad(`Ativo «${codigo}» não está registado.`);
      continue;
    }
    const tipo = tipoMap[tipoRaw.toLowerCase()];
    if (!tipo) {
      bad(`Tipo «${tipoRaw}» desconhecido. Use compra, venda, dividendo, juro ou taxa.`);
      continue;
    }
    const q = parseDecimal(qRaw),
      p = parseDecimal(pRaw);
    if (!(q > 0)) {
      bad("A quantidade tem de ser um número maior que zero.");
      continue;
    }
    if (isNaN(p) || p < 0) {
      bad("Preço unitário inválido.");
      continue;
    }
    const moeda = moedaRaw.toUpperCase();
    if (!CURRENCIES.includes(moeda)) {
      bad(`Moeda «${moedaRaw}» não suportada. Use AOA, USD ou EUR.`);
      continue;
    }
    const sig = [data, asset.id, tipo, q, p, moeda].join("|");
    if (
      seen.has(sig) ||
      db.transactions.some((t) => [t.data, t.ativo, t.tipo, t.quantidade, t.preco, t.moeda].join("|") === sig)
    ) {
      bad("Transação duplicada (já existe uma igual).");
      continue;
    }
    const t = {
      id: "t" + Math.random().toString(36).slice(2, 10),
      ativo: asset.id,
      tipo,
      data,
      quantidade: q,
      preco: p,
      moeda,
    };
    if (tipo === "venda") {
      const prob = ledgerProblem([...working, t], asset.id);
      if (prob) {
        bad(`Venda superior à quantidade detida nessa data (${prob.held}).`);
        continue;
      }
    }
    working.push(t);
    seen.add(sig);
    accepted.push({ linha: n, tx: t, asset });
  }
  return { accepted, rejected, fatal: false };
}

export function toCsv(db) {
  const tipoOut = { compra: "compra", venda: "venda", rendimento: "dividendo", taxa: "taxa" };
  const rows = sortTx(db.transactions).map((t) => {
    const a = db.assets.find((x) => x.id === t.ativo);
    return [
      t.data,
      a?.codigo || "",
      tipoOut[t.tipo],
      String(t.quantidade).replace(".", ","),
      String(t.preco).replace(".", ","),
      t.moeda,
    ].join(";");
  });
  return [CSV_COLS.join(";"), ...rows].join("\n");
}
