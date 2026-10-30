import { describe, it, expect } from "vitest";
import { importCsv, toCsv, parseDecimal } from "../csv";

const db = {
  assets: [{ id: "a1", codigo: "AAPL", moeda: "USD" }],
  transactions: [{ id: "t1", ativo: "a1", tipo: "compra", data: "2025-01-10", quantidade: 10, preco: 200, moeda: "USD" }],
  rates: [],
};
const H = "data;ativo;tipo;quantidade;preco_unitario;moeda";

describe("RF10 — importação de CSV", () => {
  it("rejeita um cabeçalho inválido", () => {
    const r = importCsv("data,ativo\n2025-01-01,AAPL", db);
    expect(r.fatal).toBe(true);
  });
  it("aceita linhas válidas e aceita decimais com vírgula", () => {
    const r = importCsv(`${H}\n2025-02-01;AAPL;compra;2;210,50;USD`, db);
    expect(r.accepted).toHaveLength(1);
    expect(r.accepted[0].tx.preco).toBe(210.5);
  });
  it("indica o motivo de cada linha rejeitada", () => {
    const r = importCsv(`${H}\n2025-13-01;AAPL;compra;1;1;USD\n2025-02-01;TSLA;compra;1;1;USD\n2025-02-01;AAPL;comprar;1;1;USD\n2025-02-01;AAPL;venda;50;1;USD\n2025-02-01;AAPL;compra;1;1;GBP`, db);
    expect(r.accepted).toHaveLength(0);
    expect(r.rejected.map((x) => x.linha)).toEqual([2, 3, 4, 5, 6]);
    expect(r.rejected[3].motivo).toMatch(/Venda superior/);
  });
  it("rejeita transações duplicadas", () => {
    const r = importCsv(`${H}\n2025-01-10;AAPL;compra;10;200;USD`, db);
    expect(r.rejected[0].motivo).toMatch(/duplicada/);
  });
});

describe("RF11 — exportação de CSV", () => {
  it("exporta no mesmo formato que a importação aceita", () => {
    const csv = toCsv(db);
    expect(csv.split("\n")[0]).toBe(H);
    expect(csv).toContain("2025-01-10;AAPL;compra;10;200;USD");
  });
  it("interpreta decimais com vírgula ou ponto", () => {
    expect(parseDecimal("1,5")).toBe(1.5);
    expect(parseDecimal("1.5")).toBe(1.5);
    expect(parseDecimal("abc")).toBeNaN();
  });
});
