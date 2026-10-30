import { autoHistory, manualSeries } from "./cotacoes";
import { START, TODAY, idxOf, pad, ymd } from "./datas";
import { heldAt, sortTx } from "./posicoes";

export function buildSeed() {
  const platforms = [
    { id: "p1", nome: "Kianda Corretora", tipo: "Corretora", moeda: "AOA", cor: "#0E9384" },
    {
      id: "p2",
      nome: "Atlântico Global Brokers",
      tipo: "Corretora internacional",
      moeda: "USD",
      cor: "#2E6BE6",
    },
    { id: "p3", nome: "Lisboa Invest", tipo: "Corretora internacional", moeda: "EUR", cor: "#7A5AF8" },
    { id: "p4", nome: "CriptoBolsa", tipo: "Exchange de cripto", moeda: "USD", cor: "#E3A008" },
    { id: "p5", nome: "Banco Mussulo · Títulos", tipo: "Banco", moeda: "AOA", cor: "#DD2590" },
    { id: "p6", nome: "Bens próprios", tipo: "Património próprio", moeda: "AOA", cor: "#667085" },
  ];
  const assets = [
    {
      id: "a1",
      codigo: "AAPL",
      nome: "Apple Inc.",
      classe: "acao",
      plataforma: "p2",
      moeda: "USD",
      fonte: "auto",
      seed: 11,
      inicio: 222,
      anchor: 252.3,
      vol: 0.014,
      setor: "Tecnologia · NASDAQ",
    },
    {
      id: "a2",
      codigo: "MSFT",
      nome: "Microsoft Corp.",
      classe: "acao",
      plataforma: "p2",
      moeda: "USD",
      fonte: "auto",
      seed: 12,
      inicio: 415,
      anchor: 512.4,
      vol: 0.012,
      setor: "Tecnologia · NASDAQ",
    },
    {
      id: "a3",
      codigo: "NVDA",
      nome: "NVIDIA Corp.",
      classe: "acao",
      plataforma: "p2",
      moeda: "USD",
      fonte: "auto",
      seed: 13,
      inicio: 138,
      anchor: 186.2,
      vol: 0.024,
      setor: "Semicondutores · NASDAQ",
    },
    {
      id: "a4",
      codigo: "VOO",
      nome: "Vanguard S&P 500 ETF",
      classe: "acao",
      plataforma: "p2",
      moeda: "USD",
      fonte: "auto",
      seed: 14,
      inicio: 530,
      anchor: 610.8,
      vol: 0.008,
      setor: "ETF de índice · NYSE",
    },
    {
      id: "a5",
      codigo: "ASML",
      nome: "ASML Holding",
      classe: "acao",
      plataforma: "p3",
      moeda: "EUR",
      fonte: "auto",
      seed: 15,
      inicio: 650,
      anchor: 905.6,
      vol: 0.018,
      setor: "Semicondutores · Euronext",
    },
    {
      id: "a6",
      codigo: "BTC",
      nome: "Bitcoin",
      classe: "cripto",
      plataforma: "p4",
      moeda: "USD",
      fonte: "auto",
      seed: 21,
      inicio: 72000,
      anchor: 108500,
      vol: 0.025,
      setor: "Criptomoeda",
    },
    {
      id: "a7",
      codigo: "ETH",
      nome: "Ethereum",
      classe: "cripto",
      plataforma: "p4",
      moeda: "USD",
      fonte: "auto",
      seed: 22,
      inicio: 2550,
      anchor: 3950,
      vol: 0.03,
      setor: "Criptomoeda",
    },
    {
      id: "a8",
      codigo: "SOL",
      nome: "Solana",
      classe: "cripto",
      plataforma: "p4",
      moeda: "USD",
      fonte: "auto",
      seed: 23,
      inicio: 175,
      anchor: 192.4,
      vol: 0.03,
      setor: "Criptomoeda",
    },
    {
      id: "a9",
      codigo: "KSG",
      nome: "Kianda Seguros",
      classe: "acao",
      plataforma: "p1",
      moeda: "AOA",
      fonte: "manual",
      setor: "Seguros · mercado local",
      avaliacoes: [
        { data: "2025-06-05", preco: 21000 },
        { data: "2025-12-15", preco: 24000 },
        { data: "2026-06-20", preco: 26500 },
      ],
    },
    {
      id: "a10",
      codigo: "OTNR28",
      nome: "OT-NR 2028 · 16,5%",
      classe: "titulo",
      plataforma: "p5",
      moeda: "AOA",
      fonte: "manual",
      setor: "Obrigação do Tesouro não reajustável",
      avaliacoes: [
        { data: "2025-07-01", preco: 100000 },
        { data: "2026-01-01", preco: 101000 },
        { data: "2026-10-01", preco: 102000 },
      ],
    },
    {
      id: "a11",
      codigo: "OTUSD27",
      nome: "OT indexada ao USD 2027 · 5%",
      classe: "titulo",
      plataforma: "p5",
      moeda: "USD",
      fonte: "manual",
      setor: "Obrigação do Tesouro indexada",
      avaliacoes: [
        { data: "2025-10-20", preco: 1000 },
        { data: "2026-04-20", preco: 1008 },
        { data: "2026-10-01", preco: 1015 },
      ],
    },
    {
      id: "a12",
      codigo: "APT-TAL",
      nome: "Apartamento T3 · Talatona",
      classe: "imovel",
      plataforma: "p6",
      moeda: "AOA",
      fonte: "manual",
      setor: "Residencial · Luanda Sul",
      avaliacoes: [
        { data: "2024-11-15", preco: 150000000 },
        { data: "2025-06-30", preco: 164000000 },
        { data: "2026-01-15", preco: 176000000 },
        { data: "2026-09-10", preco: 185000000 },
      ],
    },
    {
      id: "a13",
      codigo: "FUND-KZ",
      nome: "Fundo Tesouraria Kwanza",
      classe: "outro",
      plataforma: "p1",
      moeda: "AOA",
      fonte: "manual",
      setor: "Fundo de investimento · UP",
      avaliacoes: [
        { data: "2025-12-01", preco: 1150 },
        { data: "2026-06-01", preco: 1205 },
        { data: "2026-10-20", preco: 1250 },
      ],
    },
    {
      id: "a14",
      codigo: "OURO100",
      nome: "Ouro físico · barra 100 g",
      classe: "outro",
      plataforma: "p6",
      moeda: "USD",
      fonte: "manual",
      setor: "Metal precioso",
      avaliacoes: [
        { data: "2025-03-18", preco: 9650 },
        { data: "2025-12-10", preco: 11900 },
        { data: "2026-08-28", preco: 12850 },
      ],
    },
  ];
  const byId = Object.fromEntries(assets.map((a) => [a.id, a]));
  const px = (id, date) => {
    const a = byId[id];
    return a.fonte === "auto" ? autoHistory(a)[idxOf(date)] : manualSeries(a)[idxOf(date)];
  };
  const r2 = (v) => Math.round(v * 100) / 100;
  const tx = [];
  let k = 0;
  const add = (id, tipo, data, q, p) => {
    if (data > TODAY || data < START) return;
    tx.push({ id: "t" + ++k, ativo: id, tipo, data, quantidade: q, preco: r2(p), moeda: byId[id].moeda });
  };
  const buy = (id, data, q, fee) => {
    const p = px(id, data);
    add(id, "compra", data, q, p);
    if (fee) add(id, "taxa", data, 1, typeof fee === "function" ? fee(q * p) : fee);
  };
  const sell = (id, data, q) => add(id, "venda", data, q, px(id, data));
  const monthly = (from, fn) => {
    const d = new Date(from + "T12:00:00");
    const day = d.getDate();
    while (ymd(d) <= TODAY) {
      fn(ymd(d));
      d.setMonth(d.getMonth() + 1);
      d.setDate(day);
    }
  };
  const crypto = (v) => v * 0.001;

  add("a12", "compra", "2024-11-15", 1, 150000000);
  add("a12", "taxa", "2024-11-15", 1, 4500000);
  buy("a1", "2025-01-10", 15, 1.5);
  buy("a1", "2025-04-15", 10, 1.5);
  buy("a1", "2025-09-15", 20, 1.5);
  sell("a1", "2026-05-20", 5);
  buy("a2", "2025-02-03", 8, 1.5);
  buy("a2", "2025-08-04", 7, 1.5);
  buy("a3", "2025-03-12", 40, 1.5);
  sell("a3", "2026-07-08", 10);
  monthly("2025-01-06", (d) => buy("a4", d, 1, 1.5));
  buy("a5", "2025-05-06", 5, 2);
  monthly("2025-01-20", (d) => buy("a6", d, 0.01, crypto));
  sell("a6", "2026-03-03", 0.05);
  buy("a7", "2025-02-14", 3, crypto);
  buy("a7", "2025-11-10", 2, crypto);
  buy("a8", "2025-06-18", 25, crypto);
  add("a9", "compra", "2025-06-05", 200, 21000);
  add("a9", "taxa", "2025-06-05", 1, 25000);
  add("a10", "compra", "2025-07-01", 50, 100000);
  add("a11", "compra", "2025-10-20", 10, 1000);
  add("a13", "compra", "2025-12-01", 2000, 1150);
  add("a13", "compra", "2026-06-01", 1000, 1205);
  add("a14", "compra", "2025-03-18", 1, 9650);
  add("a14", "taxa", "2025-03-18", 1, 85);

  const qAt = (id, date) => heldAt(tx, id, date);
  const div = (id, dates, perShare) =>
    dates.forEach((d) => {
      const q = qAt(id, d);
      if (q > 0) add(id, "rendimento", d, 1, q * perShare);
    });
  const qtr = (months, day) =>
    ["2025", "2026"].flatMap((y) => months.map((m) => `${y}-${pad(m)}-${pad(day)}`));
  div("a1", qtr([2, 5, 8, 11], 14), 0.26);
  div("a2", qtr([3, 6, 9, 12], 12), 0.83);
  div("a3", qtr([3, 6, 9, 12], 27), 0.01);
  div("a4", qtr([3, 6, 9, 12], 26), 1.78);
  div("a5", qtr([2, 5, 8, 11], 6), 1.6);
  add("a9", "rendimento", "2026-04-30", 1, 180000);
  ["2026-01-01", "2026-07-01"].forEach((d) => add("a10", "rendimento", d, 1, (50 * 100000 * 0.165) / 2));
  add("a11", "rendimento", "2026-04-20", 1, 250);

  const rates = [];
  let i = 0;
  monthly("2024-11-01", (d) => {
    rates.push({ id: "rU" + i, moeda: "USD", data: d, valor: r2(912 + i * 0.55 + Math.sin(i * 1.3) * 1.8) });
    rates.push({ id: "rE" + i, moeda: "EUR", data: d, valor: r2(988 + i * 3.5 + Math.cos(i * 0.9) * 6) });
    i++;
  });
  return { platforms, assets, transactions: sortTx(tx), rates };
}

export function emptyDb() {
  const s = buildSeed();
  return { platforms: [], assets: [], transactions: [], rates: s.rates };
}
