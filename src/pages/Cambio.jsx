import { useState, useMemo } from "react";
import { Icon } from "../components/Icon";
import { ChartBox, rangeIdx, sampleIdx, tooltipBase } from "../components/graficos";
import { Pill, Tabs } from "../components/ui";
import { convert, rateAOA, rateSeries, sortedRates } from "../domain/cambio";
import { CURRENCIES, CUR_COLOR } from "../domain/constantes";
import { parseDecimal, validDate } from "../domain/csv";
import { DAYS, N, TODAY } from "../domain/datas";

import { fmtDate, fmtShort, money, pct, tone, uid } from "../lib/formatacao";

export function Rates({ ctx, act }) {
  const { db } = ctx;
  const [f, setF] = useState({ moeda: "USD", data: TODAY, valor: "" });
  const [err, setErr] = useState("");
  const [c, setC] = useState({ valor: "1000", de: "USD", para: "AOA", data: TODAY });
  const [range, setRange] = useState("Tudo");
  const cv = parseDecimal(c.valor);
  const from = rangeIdx(range);
  const idx = sampleIdx(from, N - 1, 120);
  const rs = useMemo(
    () => ({ USD: rateSeries(db.rates, "USD"), EUR: rateSeries(db.rates, "EUR") }),
    [db.rates]
  );
  function add() {
    const v = parseDecimal(f.valor);
    if (!(v > 0)) return setErr("Indique uma taxa maior que zero.");
    if (!validDate(f.data) || f.data > TODAY) return setErr("A data não pode ser futura.");
    const prev = rateAOA(db.rates, f.moeda, f.data);
    if (isFinite(prev) && Math.abs(v / prev - 1) > 0.25)
      return setErr(`A taxa difere mais de 25% da anterior (${money(prev, "AOA")}). Confirme o valor.`);
    setErr("");
    act.saveRate({ id: uid("r"), moeda: f.moeda, data: f.data, valor: v });
    setF({ ...f, valor: "" });
  }
  const table = [...db.rates].sort((a, b) => b.data.localeCompare(a.data) || a.moeda.localeCompare(b.moeda));
  const last = (m) => {
    const l = sortedRates(db.rates, m);
    return l[l.length - 1];
  };
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Câmbio</h1>
          <p>
            Taxas registadas com data de vigência. Cada transação é convertida com a taxa em vigor na sua
            data; o painel usa a mais recente.
          </p>
        </div>
      </div>
      <div className="grid g-4" style={{ marginBottom: "16px" }}>
        {["USD", "EUR"].map((m) => {
          const l = last(m);
          const s = rs[m];
          const ch = s[N - 1] / s[Math.max(0, N - 366)] - 1;
          return (
            <div className="card" key={m}>
              <div className="stat-label">
                <span className="dot" style={{ background: CUR_COLOR[m] }}></span>1 {m} em kwanzas
              </div>
              <div className="stat-value">{l ? money(l.valor, "AOA") : "—"}</div>
              <div className="stat-foot row">
                <Pill v={ch}>{pct(ch)} em 12 meses</Pill>
                <span className="tiny muted">desde {fmtDate(l?.data)}</span>
              </div>
            </div>
          );
        })}
        <div className="card" style={{ gridColumn: "span 2" }}>
          <div className="stat-label">Conversor</div>
          <div className="row" style={{ marginTop: "8px", flexWrap: "nowrap" }}>
            <input
              inputMode="decimal"
              value={c.valor}
              onChange={(e) => setC({ ...c, valor: e.target.value })}
              aria-label="Valor"
              style={{ minWidth: "80px" }}
            />
            <select
              value={c.de}
              onChange={(e) => setC({ ...c, de: e.target.value })}
              aria-label="De"
              style={{ width: "auto" }}
            >
              {CURRENCIES.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
            <button
              className="icon-btn"
              onClick={() => setC({ ...c, de: c.para, para: c.de })}
              aria-label="Trocar moedas"
            >
              <Icon n="tx" />
            </button>
            <select
              value={c.para}
              onChange={(e) => setC({ ...c, para: e.target.value })}
              aria-label="Para"
              style={{ width: "auto" }}
            >
              {CURRENCIES.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
            <input
              type="date"
              value={c.data}
              max={TODAY}
              onChange={(e) => setC({ ...c, data: e.target.value })}
              aria-label="Data"
              style={{ width: "auto" }}
            />
          </div>
          <div className="stat-value" style={{ marginTop: "10px" }}>
            {isFinite(cv) ? money(convert(db.rates, cv, c.de, c.para, c.data || TODAY), c.para) : "—"}
          </div>
        </div>
      </div>
      <div className="grid g-main">
        <div className="card">
          <div className="card-head">
            <div>
              <h2>Evolução das taxas</h2>
              <p>Kwanzas por unidade de moeda</p>
            </div>
            <Tabs value={range} options={["3M", "6M", "1A", "Tudo"]} onChange={setRange} label="Período" />
          </div>
          <ChartBox
            type="fx"
            label="Evolução das taxas de câmbio"
            height={260}
            deps={[rs, range]}
            build={() => ({
              type: "line",
              data: {
                labels: idx.map((i) => DAYS[i]),
                datasets: ["USD", "EUR"].map((m) => ({
                  label: m,
                  data: idx.map((i) => rs[m][i]),
                  borderColor: CUR_COLOR[m],
                  backgroundColor: CUR_COLOR[m],
                  stepped: "before",
                  borderWidth: 2,
                  pointRadius: 0,
                })),
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: "index", intersect: false },
                plugins: {
                  legend: { position: "bottom", labels: { usePointStyle: true, boxWidth: 8 } },
                  tooltip: {
                    ...tooltipBase(),
                    displayColors: true,
                    callbacks: {
                      title: (it) => fmtDate(it[0].label),
                      label: (c) => ` ${c.dataset.label}: ${money(c.raw, "AOA")}`,
                    },
                  },
                },
                scales: {
                  x: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: {
                      maxTicksLimit: 6,
                      maxRotation: 0,
                      callback: function (v) {
                        return fmtShort(this.getLabelForValue(v));
                      },
                    },
                  },
                  y: { border: { display: false } },
                },
              },
            })}
          />
        </div>
        <div className="card">
          <h2 style={{ marginBottom: "12px" }}>Registar taxa</h2>
          <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <label className="f">
              Moeda
              <select value={f.moeda} onChange={(e) => setF({ ...f, moeda: e.target.value })}>
                <option>USD</option>
                <option>EUR</option>
              </select>
            </label>
            <label className="f">
              Em vigor desde
              <input
                type="date"
                value={f.data}
                max={TODAY}
                onChange={(e) => setF({ ...f, data: e.target.value })}
              />
            </label>
            <label className="f" style={{ gridColumn: "1/-1" }}>
              1 {f.moeda} = ? AOA
              <input
                inputMode="decimal"
                value={f.valor}
                onChange={(e) => setF({ ...f, valor: e.target.value })}
                placeholder={String(last(f.moeda)?.valor || "")}
              />
            </label>
          </div>
          {err && (
            <p className="err" role="alert">
              {err}
            </p>
          )}
          <button className="btn btn-primary" style={{ marginTop: "14px", width: "100%" }} onClick={add}>
            Registar taxa
          </button>
          <p className="tiny muted" style={{ marginBottom: 0 }}>
            Se já existir uma taxa para a mesma moeda e data, é substituída.
          </p>
        </div>
      </div>
      <div className="table-wrap mt" style={{ maxHeight: "420px", overflow: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Moeda</th>
              <th>Em vigor desde</th>
              <th className="num">1 unidade em AOA</th>
              <th className="num">Variação</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {table.map((r) => {
              const l = sortedRates(db.rates, r.moeda);
              const i = l.findIndex((x) => x.id === r.id);
              const prev = l[i - 1];
              const d = prev ? r.valor / prev.valor - 1 : null;
              return (
                <tr key={r.id}>
                  <td>
                    <span className="row" style={{ gap: "8px" }}>
                      <span className="dot" style={{ background: CUR_COLOR[r.moeda] }}></span>
                      {r.moeda}
                    </span>
                  </td>
                  <td>{fmtDate(r.data)}</td>
                  <td className="num">
                    <b>{money(r.valor, "AOA")}</b>
                  </td>
                  <td className="num">{d == null ? "—" : <span className={tone(d)}>{pct(d)}</span>}</td>
                  <td className="num">
                    <button
                      className="btn btn-sm btn-ghost btn-danger"
                      onClick={() => act.deleteRate(r)}
                      aria-label="Eliminar taxa"
                    >
                      <Icon n="trash" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
