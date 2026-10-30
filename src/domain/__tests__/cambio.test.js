import { describe, it, expect } from "vitest";
import { convert, rateAOA } from "../cambio";

const rates = [
  { id: "1", moeda: "USD", data: "2025-01-01", valor: 900 },
  { id: "2", moeda: "USD", data: "2025-06-01", valor: 920 },
  { id: "3", moeda: "EUR", data: "2025-01-01", valor: 1000 },
];

describe("RF09 — conversão de moeda com taxas datadas", () => {
  it("usa a taxa em vigor na data indicada", () => {
    expect(rateAOA(rates, "USD", "2025-03-10")).toBe(900);
    expect(rateAOA(rates, "USD", "2025-06-01")).toBe(920);
  });
  it("converte de USD para AOA", () => {
    expect(convert(rates, 10, "USD", "AOA", "2025-03-10")).toBeCloseTo(9000);
  });
  it("converte entre duas moedas estrangeiras através do kwanza", () => {
    expect(convert(rates, 100, "EUR", "USD", "2025-03-10")).toBeCloseTo(111.111, 2);
  });
  it("não altera o valor quando a moeda é a mesma", () => {
    expect(convert(rates, 42, "EUR", "EUR")).toBe(42);
  });
});
