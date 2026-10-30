import { describe, it, expect } from "vitest";
import { position, ledgerProblem, heldAt } from "../posicoes";

const usd = [{ id: "r1", moeda: "USD", data: "2025-01-01", valor: 900 }];
const ativo = { id: "a1", moeda: "USD" };
const tx = (id, tipo, data, quantidade, preco, moeda = "USD") => ({ id, ativo: "a1", tipo, data, quantidade, preco, moeda });

describe("RF05 — cálculo da posição por ativo", () => {
  it("calcula o custo médio ponderado de várias compras", () => {
    const p = position(ativo, [tx("t1", "compra", "2025-02-01", 10, 100), tx("t2", "compra", "2025-03-01", 10, 200)], usd, 180);
    expect(p.qty).toBe(20);
    expect(p.avg).toBeCloseTo(150);
    expect(p.value).toBeCloseTo(3600);
    expect(p.gain).toBeCloseTo(600);
    expect(p.pct).toBeCloseTo(0.2);
  });

  it("uma venda retira unidades ao custo médio e regista o resultado realizado", () => {
    const p = position(ativo, [tx("t1", "compra", "2025-02-01", 10, 100), tx("t2", "compra", "2025-03-01", 10, 200), tx("t3", "venda", "2025-04-01", 5, 300)], usd, 300);
    expect(p.qty).toBe(15);
    expect(p.avg).toBeCloseTo(150);
    expect(p.realized).toBeCloseTo(750);
  });

  it("as taxas somam ao custo enquanto há posição aberta", () => {
    const p = position(ativo, [tx("t1", "compra", "2025-02-01", 10, 100), tx("t2", "taxa", "2025-02-01", 1, 5)], usd, 100);
    expect(p.cost).toBeCloseTo(1005);
    expect(p.avg).toBeCloseTo(100.5);
  });

  it("dividendos e juros contam como rendimento, sem alterar a quantidade", () => {
    const p = position(ativo, [tx("t1", "compra", "2025-02-01", 10, 100), tx("t2", "rendimento", "2025-06-01", 1, 12.5)], usd, 100);
    expect(p.qty).toBe(10);
    expect(p.income).toBeCloseTo(12.5);
  });

  it("converte transações noutra moeda com a taxa da data", () => {
    const p = position(ativo, [tx("t1", "compra", "2025-02-01", 1, 90000, "AOA")], usd, 100);
    expect(p.cost).toBeCloseTo(100);
  });
});

describe("Integridade do registo de transações", () => {
  it("deteta uma venda superior à quantidade detida", () => {
    const prob = ledgerProblem([tx("t1", "compra", "2025-02-01", 5, 100), tx("t2", "venda", "2025-03-01", 6, 100)], "a1");
    expect(prob).not.toBeNull();
    expect(prob.held).toBe(5);
  });
  it("aceita vendas dentro da quantidade detida", () => {
    expect(ledgerProblem([tx("t1", "compra", "2025-02-01", 5, 100), tx("t2", "venda", "2025-03-01", 5, 100)], "a1")).toBeNull();
  });
  it("calcula a quantidade detida numa data", () => {
    const l = [tx("t1", "compra", "2025-02-01", 5, 100), tx("t2", "venda", "2025-03-01", 2, 100)];
    expect(heldAt(l, "a1", "2025-02-15")).toBe(5);
    expect(heldAt(l, "a1", "2025-03-01")).toBe(3);
  });
});
