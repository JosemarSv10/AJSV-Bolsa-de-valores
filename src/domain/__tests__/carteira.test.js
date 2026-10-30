import { describe, it, expect } from "vitest";
import { monthlyIncome } from "../carteira";

const hoje = new Date();
const mesAtual = ${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")};
const rates = [{ id: "r1", moeda: "USD", data: "2020-01-01", valor: 900 }];

describe("RF08 — rendimentos por mês", () => {
  it("devolve sempre os últimos 12 meses", () => {
    expect(monthlyIncome([], rates, "USD")).toHaveLength(12);
  });

  it("soma os dividendos no mês em que foram recebidos", () => {
    const txs = [
      { id: "t1", ativo: "a1", tipo: "rendimento", data: ${mesAtual}-01, quantidade: 1, preco: 10, moeda: "USD" },
      { id: "t2", ativo: "a1", tipo: "rendimento", data: ${mesAtual}-02, quantidade: 1, preco: 5, moeda: "USD" },
    ];
    const meses = monthlyIncome(txs, rates, "USD");
    expect(meses[11].mes).toBe(mesAtual);
    expect(meses[11].valor).toBeCloseTo(15);
  });

  it("ignora compras, vendas e taxas", () => {
    const txs = [{ id: "t1", ativo: "a1", tipo: "compra", data: ${mesAtual}-01, quantidade: 1, preco: 100, moeda: "USD" }];
    expect(monthlyIncome(txs, rates, "USD")[11].valor).toBe(0);
  });

  it("converte os rendimentos para a moeda pedida", () => {
    const txs = [{ id: "t1", ativo: "a1", tipo: "rendimento", data: ${mesAtual}-01, quantidade: 1, preco: 10, moeda: "USD" }];
    expect(monthlyIncome(txs, rates, "AOA")[11].valor).toBeCloseTo(9000);
  });
});