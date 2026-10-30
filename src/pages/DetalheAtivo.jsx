import { useState } from "react";
import { Icon } from "../components/Icon";
import { ChartBox, rangeIdx, sampleIdx, tooltipBase } from "../components/graficos";
import { AssetLogo, Empty, FlashNum, Pill, Tabs } from "../components/ui";
import { CLASS_ONE, CLASS_VAR, TX_TYPES } from "../domain/constantes";
import { sortedVals } from "../domain/cotacoes";
import { DAYS, N, idxOf } from "../domain/datas";
import { sortTx } from "../domain/posicoes";
import { cssVar, fmtDate, fmtShort, money, nf, num, pct, signed, tone } from "../lib/formatacao";

export function AssetDetail({ ctx, id, go, act }) {
  const { rows, db, M, totals, quoteState } = ctx;
  const r = rows.find((x) => x.a.id === id);
  const [range, setRange] = useState("1A");
  if (!r)
    return (
      <Empty
        title="Ativo não encontrado"
        text="Pode ter sido eliminado."
        action="Voltar aos ativos"
        onAction={() => go("ativos")}
      />
    );
  const { a, pos } = r;
  const plat = db.platforms.find((p) => p.id === a.plataforma);
  const txs = sortTx(db.transactions.filter((t) => t.ativo === a.id)).reverse();
  const from = rangeIdx(range);
  const idx = sampleIdx(from, N - 1, 200);
  const chg = r.prev ? r.price / r.prev - 1 : 0;
  const rangeChg = r.series[N - 1] / (r.series[from] || 1) - 1;
  const markers = (() => {
    const buys = new Array(idx.length).fill(null),
      sells = new Array(idx.length).fill(null);
    for (const t of txs) {
      if (t.tipo !== "compra" && t.tipo !== "venda") continue;
      const di = idxOf(t.data);
      if (di < from) continue;
      let j = idx.findIndex((x) => x >= di);
      if (j < 0) j = idx.length - 1;
      (t.tipo === "compra" ? buys : sells)[j] = r.series[idx[j]];
    }
    return { buys, sells };
  })();
  const stats = [
    ["Quantidade detida", num(pos.qty, 6)],
    ["Custo médio", pos.qty > 0 ? money(pos.avg, a.moeda) : "—"],
    ["Custo total", money(pos.cost, a.moeda)],
    ["Valor atual", money(pos.value, a.moeda), money(r.valueM, M, 0)],
    [
      "Ganho não realizado",
      <span className={tone(pos.gain)}>{signed(pos.gain, a.moeda)}</span>,
      <span className={tone(pos.gain)}>{pct(pos.pct)}</span>,
    ],
    ["Resultado de vendas", <span className={tone(pos.realized)}>{signed(pos.realized, a.moeda)}</span>],
    ["Rendimentos recebidos", money(pos.income, a.moeda)],
    ["Taxas pagas", money(pos.fees, a.moeda)],
    ["Peso na carteira", pct(totals.value ? r.valueM / totals.value : 0, false)],
    ["Cotação", a.fonte === "auto" ? "Automática" : "Manual", fmtDate(r.qdate)],
  ];
  return (
    <>
      <button className="back" onClick={() => go("ativos")}>
        <Icon n="back" />
        Ativos
      </button>
      <div className="page-head">
        <div className="a-cell">
          <AssetLogo a={a} size={52} />
          <div>
            <h1>{a.nome}</h1>
            <p className="row" style={{ gap: "8px", marginTop: "6px" }}>
              <span className="chip">{a.codigo}</span>
              <span className="chip">
                <span className="dot" style={{ background: `var(${CLASS_VAR[a.classe]})` }}></span>
                {CLASS_ONE[a.classe]}
              </span>
              <span className="chip">{plat?.nome || "—"}</span>
              <span className="small muted">{a.setor || ""}</span>
            </p>
          </div>
        </div>
        <div className="row">
          {a.fonte === "manual" && (
            <button className="btn" onClick={() => act.openValuation(a)}>
              <Icon n="edit" />
              Atualizar valor
            </button>
          )}
          <button className="btn" onClick={() => act.openAsset(a)}>
            <Icon n="edit" />
            Editar
          </button>
          <button className="btn btn-primary" onClick={() => act.openTx(null, a.id)}>
            <Icon n="plus" />
            Nova transação
          </button>
        </div>
      </div>
      <div className="card">
        <div className="row between" style={{ alignItems: "flex-end", marginBottom: "12px" }}>
          <div>
            <div className="stat-label">
              {a.fonte === "auto"
                ? quoteState.error
                  ? "Última cotação conhecida"
                  : "Cotação atual"
                : "Última avaliação"}{" "}
              · {fmtDate(r.qdate)}
            </div>
            <div className="row" style={{ gap: "12px", marginTop: "8px" }}>
              <span className="price-big">
                <FlashNum value={r.price}>{money(r.price, a.moeda)}</FlashNum>
              </span>
              {a.fonte === "auto" ? <Pill v={chg}>{pct(chg)} hoje</Pill> : null}
              <Pill v={rangeChg}>
                {pct(rangeChg)} em {range === "Tudo" ? "todo o período" : range}
              </Pill>
            </div>
          </div>
          <Tabs
            value={range}
            options={["1M", "3M", "6M", "1A", "Tudo"]}
            onChange={setRange}
            label="Período"
          />
        </div>
        <ChartBox
          type={"asset-" + a.id}
          label={"Histórico de " + a.nome}
          height={300}
          deps={[range, r.series[N - 1], txs.length, db.transactions]}
          build={() => ({
            type: "line",
            data: {
              labels: idx.map((i) => DAYS[i]),
              datasets: [
                {
                  label: "Preço",
                  data: idx.map((i) => r.series[i]),
                  borderColor: cssVar("--brand"),
                  backgroundColor: (c) => {
                    const g = c.chart.ctx.createLinearGradient(0, 0, 0, c.chart.height);
                    g.addColorStop(0, cssVar("--brand-soft"));
                    g.addColorStop(1, "transparent");
                    return g;
                  },
                  fill: true,
                  tension: a.fonte === "auto" ? 0.2 : 0,
                  stepped: a.fonte === "manual" ? "before" : false,
                  borderWidth: 2,
                  pointRadius: 0,
                  pointHoverRadius: 4,
                },
                {
                  label: "Compra",
                  data: markers.buys,
                  showLine: false,
                  pointRadius: 6,
                  pointHoverRadius: 8,
                  pointBackgroundColor: cssVar("--c-acao"),
                  pointBorderColor: cssVar("--surface"),
                  pointBorderWidth: 2,
                },
                {
                  label: "Venda",
                  data: markers.sells,
                  showLine: false,
                  pointRadius: 6,
                  pointHoverRadius: 8,
                  pointStyle: "rectRot",
                  pointBackgroundColor: cssVar("--c-cripto"),
                  pointBorderColor: cssVar("--surface"),
                  pointBorderWidth: 2,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              interaction: { mode: "nearest", intersect: false, axis: "x" },
              plugins: {
                legend: {
                  display: true,
                  position: "bottom",
                  labels: { usePointStyle: true, boxWidth: 8, filter: (it) => it.text !== "Preço" },
                },
                tooltip: {
                  ...tooltipBase(),
                  callbacks: {
                    title: (it) => fmtDate(it[0].label),
                    label: (c) => (c.raw == null ? null : `${c.dataset.label}: ${money(c.raw, a.moeda)}`),
                  },
                },
              },
              scales: {
                x: {
                  grid: { display: false },
                  border: { display: false },
                  ticks: {
                    maxTicksLimit: 7,
                    maxRotation: 0,
                    callback: function (v) {
                      return fmtShort(this.getLabelForValue(v));
                    },
                  },
                },
                y: {
                  position: "right",
                  border: { display: false },
                  ticks: {
                    maxTicksLimit: 5,
                    callback: (v) => nf("ax", { notation: "compact", maximumFractionDigits: 1 }).format(v),
                  },
                },
              },
            },
          })}
        />
      </div>
      <div className="detail-stats mt">
        {stats.map(([l, v, s]) => (
          <div key={l}>
            <div className="stat-label">{l}</div>
            <div className="stat-value">{v}</div>
            {s && (
              <div className="small muted" style={{ marginTop: "2px" }}>
                {s}
              </div>
            )}
          </div>
        ))}
      </div>
      {a.fonte === "manual" && (a.avaliacoes || []).length ? (
        <div className="card mt">
          <div className="card-head">
            <h2>Histórico de avaliações</h2>
          </div>
          <div className="row" style={{ gap: "10px" }}>
            {sortedVals(a)
              .reverse()
              .map((v, i, arr) => {
                const prev = arr[i + 1];
                const d = prev ? v.preco / prev.preco - 1 : 0;
                return (
                  <div key={v.data} className="chip" style={{ padding: "6px 12px" }}>
                    {fmtDate(v.data)} · <b style={{ color: "var(--ink)" }}>{money(v.preco, a.moeda, 0)}</b>
                    {prev ? <span className={tone(d)}>{pct(d)}</span> : ""}
                  </div>
                );
              })}
          </div>
        </div>
      ) : null}
      <div className="card mt">
        <div className="card-head">
          <div>
            <h2>Transações deste ativo</h2>
            <p>{txs.length} registos</p>
          </div>
        </div>
        {txs.length ? (
          <div className="table-wrap" style={{ boxShadow: "none" }}>
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th className="num">Quantidade</th>
                  <th className="num">Preço unitário</th>
                  <th className="num">Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {txs.map((t) => (
                  <tr key={t.id}>
                    <td>{fmtDate(t.data)}</td>
                    <td>
                      <span className={"pill t-" + t.tipo}>{TX_TYPES[t.tipo]}</span>
                    </td>
                    <td className="num">{num(t.quantidade, 6)}</td>
                    <td className="num">{money(t.preco, t.moeda)}</td>
                    <td className="num">
                      <b>{money(t.quantidade * t.preco, t.moeda)}</b>
                    </td>
                    <td className="num">
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => act.openTx(t)}
                        aria-label="Editar"
                      >
                        <Icon n="edit" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="Sem transações"
            text="Registe a primeira compra deste ativo."
            action="Nova transação"
            onAction={() => act.openTx(null, a.id)}
          />
        )}
      </div>
    </>
  );
}
