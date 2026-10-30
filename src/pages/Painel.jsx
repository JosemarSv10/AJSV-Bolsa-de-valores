import { useState, useMemo, useContext } from "react";
import { Icon } from "../components/Icon";
import { ChartBox, Spark, rangeIdx, sampleIdx, tooltipBase } from "../components/graficos";
import { AssetLogo, Empty, FlashNum, Pill, Tabs } from "../components/ui";
import { sortedRates } from "../domain/cambio";
import { monthlyIncome } from "../domain/carteira";
import { CLASSES, CLASS_VAR, CURRENCIES, CUR_COLOR, TX_TYPES } from "../domain/constantes";
import { DAYS, N, TODAY, daysBetween } from "../domain/datas";
import { sortTx } from "../domain/posicoes";
import { ThemeCtx, useAnimatedNumber } from "../hooks";
import {
  cssVar,
  fmtDate,
  fmtMonth,
  fmtShort,
  money,
  moneyC,
  nf,
  num,
  pct,
  signed,
  tone,
} from "../lib/formatacao";

export function Hero({ ctx }) {
  const { series, M, setM, totals } = ctx;
  const [range, setRange] = useState("1A");
  const total = series.value[N - 1];
  const anim = useAnimatedNumber(total);
  const dayChg = series.value[N - 1] - series.value[N - 2];
  const dayBase = series.value[N - 2] || 1;
  const from = rangeIdx(range);
  const gainNow = series.value[N - 1] - series.invested[N - 1],
    gainFrom = series.value[from] - series.invested[from];
  const periodGain = gainNow - gainFrom;
  const idx = sampleIdx(from, N - 1);
  const theme = useContext(ThemeCtx);
  return (
    <section className="hero">
      <div className="hero-top">
        <div>
          <p className="hero-label">Património total</p>
          <div className="hero-total">{money(anim, M, 0)}</div>
          <div className="hero-chg">
            <Pill v={dayChg}>
              {signed(dayChg, M, 0)} ({pct(dayChg / dayBase)}) hoje
            </Pill>
            <span style={{ color: "var(--hero-muted)" }}>
              Ganho total{" "}
              <b style={{ color: "#fff" }}>{signed(totals.gain + totals.realized + totals.income, M, 0)}</b>
            </span>
          </div>
        </div>
        <Tabs value={M} options={CURRENCIES} onChange={setM} label="Moeda" />
      </div>
      <div style={{ marginTop: "14px" }}>
        <ChartBox
          type="hero"
          label="Evolução do património"
          height={230}
          deps={[series, range, M]}
          build={() => {
            const ctxGrad = (c) => {
              const { chart } = c;
              const g = chart.ctx.createLinearGradient(0, 0, 0, chart.height);
              g.addColorStop(0, "rgba(46,211,183,.38)");
              g.addColorStop(1, "rgba(46,211,183,0)");
              return g;
            };
            return {
              type: "line",
              data: {
                labels: idx.map((i) => DAYS[i]),
                datasets: [
                  {
                    label: "Valor",
                    data: idx.map((i) => series.value[i]),
                    borderColor: "#2ED3B7",
                    backgroundColor: ctxGrad,
                    fill: true,
                    tension: 0.25,
                    borderWidth: 2.2,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                  },
                  {
                    label: "Investido",
                    data: idx.map((i) => series.invested[i]),
                    borderColor: "rgba(245,184,61,.85)",
                    borderDash: [5, 5],
                    borderWidth: 1.5,
                    pointRadius: 0,
                    fill: false,
                    tension: 0,
                  },
                ],
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: "index", intersect: false },
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    ...tooltipBase(),
                    backgroundColor: "rgba(255,255,255,.95)",
                    titleColor: "#0D1B2A",
                    bodyColor: "#0D1B2A",
                    displayColors: true,
                    callbacks: {
                      title: (it) => fmtDate(it[0].label),
                      label: (c) => ` ${c.dataset.label}: ${money(c.raw, M, 0)}`,
                    },
                  },
                },
                scales: {
                  x: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: {
                      color: "#9FB6C4",
                      maxTicksLimit: 6,
                      maxRotation: 0,
                      callback: function (v) {
                        return fmtShort(this.getLabelForValue(v));
                      },
                    },
                  },
                  y: {
                    position: "right",
                    grid: { color: "rgba(255,255,255,.07)" },
                    border: { display: false },
                    ticks: {
                      color: "#9FB6C4",
                      maxTicksLimit: 5,
                      callback: (v) => nf("ax", { notation: "compact", maximumFractionDigits: 1 }).format(v),
                    },
                  },
                },
              },
            };
          }}
        />
      </div>
      <div className="hero-foot">
        <div className="hero-legend">
          <span>
            <i style={{ background: "#2ED3B7" }}></i>Valor de mercado
          </span>
          <span>
            <i style={{ background: "#F5B83D" }}></i>Capital investido
          </span>
          <span>
            Ganho no período{" "}
            <b style={{ color: periodGain >= 0 ? "#6EE7A8" : "#FF9DB2" }}>{signed(periodGain, M, 0)}</b>
          </span>
        </div>
        <Tabs value={range} options={["1M", "3M", "6M", "1A", "Tudo"]} onChange={setRange} label="Período" />
      </div>
    </section>
  );
}

export function Kpis({ ctx }) {
  const { M, totals } = ctx;
  const items = [
    {
      ico: "wallet",
      col: "var(--c-acao)",
      label: "Capital investido",
      value: money(totals.cost, M, 0),
      foot: (
        <span className="muted">
          {totals.nAssets} ativos em {totals.nPlat} plataformas
        </span>
      ),
    },
    {
      ico: "trend",
      col: "var(--gain)",
      label: "Ganho não realizado",
      value: <span className={tone(totals.gain)}>{signed(totals.gain, M, 0)}</span>,
      foot: <Pill v={totals.gain}>{pct(totals.cost ? totals.gain / totals.cost : 0)} sobre o custo</Pill>,
    },
    {
      ico: "coin",
      col: "var(--gold)",
      label: "Rendimentos recebidos",
      value: money(totals.income, M, 0),
      foot: <span className="muted">Dividendos e juros, desde o início</span>,
    },
    {
      ico: "tx",
      col: "var(--c-cripto)",
      label: "Resultado de vendas",
      value: <span className={tone(totals.realized)}>{signed(totals.realized, M, 0)}</span>,
      foot: <span className="muted">Ganho realizado, líquido de taxas</span>,
    },
  ];
  return (
    <div className="grid g-4 mt">
      {items.map((k) => (
        <div className="card" key={k.label}>
          <div className="stat-label">
            <span
              className="kpi-ico"
              style={{ background: `color-mix(in srgb, ${k.col} 14%, transparent)`, color: k.col }}
            >
              <Icon n={k.ico} />
            </span>
            {k.label}
          </div>
          <div className="stat-value">{k.value}</div>
          <div className="stat-foot">{k.foot}</div>
        </div>
      ))}
    </div>
  );
}

export function Allocation({ ctx }) {
  const { rows, db, M, rates } = ctx;
  const [by, setBy] = useState("classe");
  const groups = useMemo(() => {
    const g = {};
    for (const r of rows) {
      if (r.pos.qty <= 0) continue;
      const key = by === "classe" ? r.a.classe : by === "plataforma" ? r.a.plataforma : r.a.moeda;
      g[key] = (g[key] || 0) + r.valueM;
    }
    const tot = Object.values(g).reduce((s, v) => s + v, 0) || 1;
    return Object.entries(g)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => {
        const p = db.platforms.find((x) => x.id === k);
        return {
          k,
          v,
          pct: v / tot,
          label: by === "classe" ? CLASSES[k] : by === "plataforma" ? p?.nome || "—" : k,
          color:
            by === "classe" ? `var(${CLASS_VAR[k]})` : by === "plataforma" ? p?.cor || "#999" : CUR_COLOR[k],
        };
      });
  }, [rows, by, db.platforms]);
  const tot = groups.reduce((s, x) => s + x.v, 0);
  const resolve = (c) => (c.startsWith("var(") ? cssVar(c.slice(4, -1)) : c);
  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h2>Distribuição</h2>
          <p>Peso de cada grupo no património</p>
        </div>
        <Tabs
          value={by}
          options={[
            ["classe", "Classe"],
            ["plataforma", "Plataforma"],
            ["moeda", "Moeda"],
          ]}
          onChange={setBy}
          label="Agrupar por"
        />
      </div>
      <div className="alloc">
        <div className="donut-wrap">
          <ChartBox
            type="donut"
            label="Distribuição do património"
            height={180}
            deps={[groups]}
            build={() => ({
              type: "doughnut",
              data: {
                labels: groups.map((g) => g.label),
                datasets: [
                  {
                    data: groups.map((g) => g.v),
                    backgroundColor: groups.map((g) => resolve(g.color)),
                    borderColor: cssVar("--surface"),
                    borderWidth: 3,
                    hoverOffset: 6,
                  },
                ],
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "70%",
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    ...tooltipBase(),
                    callbacks: {
                      label: (c) => `${c.label}: ${moneyC(c.raw, M)} (${pct(c.raw / tot, false)})`,
                    },
                  },
                },
              },
            })}
          />
          <div className="donut-center">
            <div>
              <b>{groups.length}</b>
              <span>{by === "classe" ? "classes" : by === "plataforma" ? "plataformas" : "moedas"}</span>
            </div>
          </div>
        </div>
        <div className="legend-list">
          {groups.map((g) => (
            <div className="li" key={g.k}>
              <span className="dot" style={{ background: g.color }}></span>
              <span>{g.label}</span>
              <b>{pct(g.pct, false)}</b>
              <div className="bar-track">
                <i style={{ width: g.pct * 100 + "%", background: g.color }}></i>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Movers({ ctx, go }) {
  const { rows, M } = ctx;
  const list = rows
    .filter((r) => r.pos.qty > 0 && r.a.fonte === "auto")
    .map((r) => ({ ...r, chg: r.prev ? r.price / r.prev - 1 : 0 }))
    .sort((a, b) => Math.abs(b.chg) - Math.abs(a.chg))
    .slice(0, 6);
  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h2>Movimentos de hoje</h2>
          <p>Ativos com cotação automática</p>
        </div>
      </div>
      {list.length ? (
        <div className="list">
          {list.map((r) => (
            <div
              className="list-item click"
              key={r.a.id}
              onClick={() => go("ativo-" + r.a.id)}
              role="link"
              tabIndex="0"
              onKeyDown={(e) => e.key === "Enter" && go("ativo-" + r.a.id)}
            >
              <AssetLogo a={r.a} size={32} />
              <div className="grow">
                <div className="a-name">{r.a.codigo}</div>
                <div className="a-sub">{r.a.nome}</div>
              </div>
              <Spark data={Array.from(r.series.slice(N - 30))} w={70} h={26} />
              <div style={{ textAlign: "right", minWidth: "92px" }}>
                <div>
                  <FlashNum value={r.price}>{money(r.price, r.a.moeda)}</FlashNum>
                </div>
                <Pill v={r.chg}>{pct(r.chg)}</Pill>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Empty
          title="Sem cotações automáticas"
          text="Registe ações ou criptomoedas para ver a variação diária."
        />
      )}
    </div>
  );
}

export function IncomeChart({ ctx }) {
  const { db, M } = ctx;
  const data = useMemo(() => monthlyIncome(db.transactions, db.rates, M), [db.transactions, db.rates, M]);
  const total = data.reduce((s, x) => s + x.valor, 0);
  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h2>Rendimentos por mês</h2>
          <p>Dividendos e juros dos últimos 12 meses</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="stat-value" style={{ fontSize: "1.2rem", marginTop: 0 }}>
            {money(total, M, 0)}
          </div>
          <div className="tiny muted">total em 12 meses</div>
        </div>
      </div>
      <ChartBox
        type="income"
        label="Rendimentos por mês"
        height={200}
        deps={[data]}
        build={() => ({
          type: "bar",
          data: {
            labels: data.map((d) => fmtMonth(d.mes)),
            datasets: [
              {
                data: data.map((d) => d.valor),
                backgroundColor: cssVar("--gold"),
                borderRadius: 6,
                maxBarThickness: 26,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: { ...tooltipBase(), callbacks: { label: (c) => money(c.raw, M, 0) } },
            },
            scales: {
              x: { grid: { display: false }, border: { display: false } },
              y: {
                border: { display: false },
                ticks: {
                  maxTicksLimit: 4,
                  callback: (v) => nf("ax", { notation: "compact", maximumFractionDigits: 1 }).format(v),
                },
              },
            },
          },
        })}
      />
    </div>
  );
}

export function Performance({ ctx, go }) {
  const { rows, M } = ctx;
  const list = rows.filter((r) => r.pos.qty > 0).sort((a, b) => b.pos.pct - a.pos.pct);
  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h2>Rentabilidade por ativo</h2>
          <p>Ganho não realizado sobre o custo médio</p>
        </div>
      </div>
      <ChartBox
        type="perf"
        label="Rentabilidade por ativo"
        height={Math.max(220, list.length * 26)}
        deps={[list.map((r) => r.a.id + r.pos.pct.toFixed(4)).join()]}
        build={() => ({
          type: "bar",
          data: {
            labels: list.map((r) => r.a.codigo),
            datasets: [
              {
                data: list.map((r) => +(r.pos.pct * 100).toFixed(2)),
                backgroundColor: list.map((r) => (r.pos.pct >= 0 ? cssVar("--gain") : cssVar("--loss"))),
                borderRadius: 5,
                barThickness: 14,
              },
            ],
          },
          options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            onClick: (e, el) => {
              if (el[0]) go("ativo-" + list[el[0].index].a.id);
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                ...tooltipBase(),
                callbacks: {
                  title: (it) => list[it[0].dataIndex].a.nome,
                  label: (c) =>
                    `${c.raw > 0 ? "+" : ""}${String(c.raw).replace(".", ",")}% · ${signed(list[c.dataIndex].gainM, M, 0)}`,
                },
              },
            },
            scales: {
              x: { border: { display: false }, ticks: { callback: (v) => v + "%" } },
              y: { grid: { display: false }, border: { display: false }, ticks: { font: { weight: "700" } } },
            },
          },
        })}
      />
    </div>
  );
}

export function Alerts({ ctx, go }) {
  const { rows, db, quoteState } = ctx;
  const items = [];
  rows
    .filter((r) => r.a.fonte === "manual" && r.pos.qty > 0)
    .forEach((r) => {
      const d = r.qdate;
      const age = d === "—" ? 999 : daysBetween(d, TODAY);
      if (age > 90)
        items.push({
          k: r.a.id,
          t: `${r.a.nome}: última avaliação há ${age} dias`,
          a: "Atualizar valor",
          go: "ativo-" + r.a.id,
        });
    });
  ["USD", "EUR"].forEach((m) => {
    const l = sortedRates(db.rates, m);
    const last = l[l.length - 1];
    if (!last)
      items.push({ k: m, t: `Sem taxa de câmbio registada para ${m}`, a: "Registar taxa", go: "cambio" });
    else {
      const age = daysBetween(last.data, TODAY);
      if (age > 35)
        items.push({ k: m, t: `Taxa ${m}/AOA com ${age} dias`, a: "Registar taxa", go: "cambio" });
    }
  });
  if (quoteState.error)
    items.unshift({
      k: "api",
      t: `Serviço de cotações indisponível. Valores de ${quoteState.lastOk ? new Date(quoteState.lastOk).toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" }) : "ontem"}.`,
      a: "Ver ativos",
      go: "ativos",
    });
  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h2>Pontos de atenção</h2>
          <p>O que precisa de atualização</p>
        </div>
        <span className="chip">{items.length}</span>
      </div>
      {items.length ? (
        <div className="list">
          {items.map((i) => (
            <div className="list-item" key={i.k}>
              <span className="tx-ico" style={{ background: "var(--warn-bg)", color: "var(--gold)" }}>
                <Icon n="alert" />
              </span>
              <div className="grow small">{i.t}</div>
              <button className="btn btn-sm" onClick={() => go(i.go)}>
                {i.a}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="row small muted" style={{ padding: "8px 0" }}>
          <span className="tx-ico t-rendimento">
            <Icon n="check" />
          </span>
          Tudo atualizado.
        </div>
      )}
    </div>
  );
}

export const TX_ICON = { compra: "plus", venda: "tx", rendimento: "coin", taxa: "file" };

export function Activity({ ctx, go }) {
  const { db } = ctx;
  const list = sortTx(db.transactions).reverse().slice(0, 7);
  const aById = (id) => db.assets.find((a) => a.id === id);
  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h2>Atividade recente</h2>
          <p>Últimas transações registadas</p>
        </div>
        <button className="btn btn-sm" onClick={() => go("transacoes")}>
          Ver todas
        </button>
      </div>
      <div className="list">
        {list.map((t) => {
          const a = aById(t.ativo);
          return (
            <div className="list-item" key={t.id}>
              <span className={"tx-ico t-" + t.tipo}>
                <Icon n={TX_ICON[t.tipo]} />
              </span>
              <div className="grow">
                <div className="a-name small">
                  {TX_TYPES[t.tipo]} · {a?.codigo}
                </div>
                <div className="a-sub">
                  {fmtDate(t.data)}
                  {t.tipo === "compra" || t.tipo === "venda"
                    ? ` · ${num(t.quantidade, 6)} × ${money(t.preco, t.moeda)}`
                    : ""}
                </div>
              </div>
              <b className={"small " + (t.tipo === "rendimento" ? "gain" : "")}>
                {t.tipo === "compra" || t.tipo === "taxa" ? "−" : "+"}
                {money(t.quantidade * t.preco, t.moeda)}
              </b>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Dashboard({ ctx, go, user, loadSample }) {
  if (!ctx.db.assets.length)
    return (
      <>
        <div className="page-head">
          <div>
            <h1>Olá, {user.nome.split(" ")[0]}</h1>
            <p>
              A sua carteira ainda está vazia. Registe a primeira plataforma e o primeiro ativo, ou carregue
              uma carteira de exemplo para explorar.
            </p>
          </div>
        </div>
        <div className="grid g-3">
          {[
            [
              "plat",
              "1. Registe as plataformas",
              "Corretoras, bancos, exchanges ou bens próprios.",
              "plataformas",
            ],
            ["assets", "2. Adicione os ativos", "Ações, títulos, imóveis, cripto e outros.", "ativos"],
            ["import", "3. Importe as transações", "Registe à mão ou carregue um CSV.", "importar"],
          ].map(([ic, t, d, v]) => (
            <div className="card" key={v}>
              <span className="kpi-ico" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
                <Icon n={ic} />
              </span>
              <h2 style={{ marginTop: "12px" }}>{t}</h2>
              <p className="muted small">{d}</p>
              <button className="btn" onClick={() => go(v)}>
                Começar
              </button>
            </div>
          ))}
        </div>
        <div className="card mt row between">
          <div>
            <h2>Quer ver o produto a funcionar?</h2>
            <p className="muted small" style={{ margin: "4px 0 0" }}>
              Carrega 14 ativos, 6 plataformas e quase dois anos de transações nesta conta.
            </p>
          </div>
          <button className="btn btn-primary" onClick={loadSample}>
            Carregar carteira de exemplo
          </button>
        </div>
      </>
    );
  return (
    <>
      <Hero ctx={ctx} />
      <Kpis ctx={ctx} />
      <div className="grid g-main mt">
        <Allocation ctx={ctx} />
        <Movers ctx={ctx} go={go} />
      </div>
      <div className="grid g-main mt">
        <Performance ctx={ctx} go={go} />
        <div className="grid">
          <IncomeChart ctx={ctx} />
          <Alerts ctx={ctx} go={go} />
        </div>
      </div>
      <div className="mt">
        <Activity ctx={ctx} go={go} />
      </div>
    </>
  );
}
