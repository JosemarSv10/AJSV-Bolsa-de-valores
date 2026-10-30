import { useState } from "react";
import { Icon } from "../components/Icon";
import { Spark } from "../components/graficos";
import { AssetLogo, Empty, FlashNum, Pill, Switch, Tabs } from "../components/ui";
import { CLASS_ONE } from "../domain/constantes";
import { N } from "../domain/datas";
import { fmtDate, money, num, pct, signed, tone } from "../lib/formatacao";

export function Assets({ ctx, go, act }) {
  const { rows, db, M, quoteState } = ctx;
  const [cls, setCls] = useState("todos");
  const [plat, setPlat] = useState("todas");
  const [moeda, setMoeda] = useState("todas");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState({ k: "valueM", d: -1 });
  const [showZero, setShowZero] = useState(false);
  const list = rows.filter(
    (r) =>
      (cls === "todos" || r.a.classe === cls) &&
      (plat === "todas" || r.a.plataforma === plat) &&
      (moeda === "todas" || r.a.moeda === moeda) &&
      (showZero || r.pos.qty > 0 || r.pos.count === 0) &&
      (!q || (r.a.nome + " " + r.a.codigo).toLowerCase().includes(q.toLowerCase()))
  );
  const key = (r) =>
    sort.k === "nome"
      ? r.a.nome
      : sort.k === "pct"
        ? r.pos.pct
        : sort.k === "chg"
          ? r.prev
            ? r.price / r.prev - 1
            : 0
          : r[sort.k];
  list.sort((a, b) => {
    const x = key(a),
      y = key(b);
    return (typeof x === "string" ? x.localeCompare(y) : x - y) * sort.d;
  });
  const totalM = list.reduce((s, r) => s + r.valueM, 0);
  const th = (k, l, num) => (
    <th
      className={num ? "num" : ""}
      aria-sort={sort.k === k ? (sort.d > 0 ? "ascending" : "descending") : "none"}
    >
      <button onClick={() => setSort((s) => ({ k, d: s.k === k ? -s.d : -1 }))}>
        {l}
        {sort.k === k ? (sort.d > 0 ? " ↑" : " ↓") : ""}
      </button>
    </th>
  );
  const pname = (id) => db.platforms.find((p) => p.id === id)?.nome || "—";
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Ativos</h1>
          <p>Posição, custo médio e rentabilidade de cada ativo, calculados a partir das transações.</p>
        </div>
        <div className="row">
          <button className="btn" onClick={act.refreshQuotes}>
            <Icon n="refresh" />
            Atualizar cotações
          </button>
          <button className="btn btn-primary" onClick={() => act.openAsset()}>
            <Icon n="plus" />
            Novo ativo
          </button>
        </div>
      </div>
      {quoteState.error && (
        <div className="notice" role="status" style={{ marginBottom: "14px" }}>
          <Icon n="alert" />
          <span>
            <b>O serviço de cotações não respondeu.</b> As ações e criptomoedas mostram o último valor
            conhecido, com a data dessa cotação. A aplicação continua utilizável.{" "}
            {quoteState.lastOk
              ? `Última cotação válida às ${new Date(quoteState.lastOk).toLocaleTimeString("pt-AO")}.`
              : ""}
          </span>
        </div>
      )}
      <div className="card" style={{ padding: "12px 14px", marginBottom: "14px" }}>
        <div className="row between">
          <div className="row">
            <Tabs
              value={cls}
              options={[["todos", "Todos"], ...Object.entries(CLASS_ONE).map(([k, v]) => [k, v])]}
              onChange={setCls}
              label="Classe"
            />
          </div>
          <div className="row">
            <input
              type="search"
              placeholder="Procurar ativo"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ width: "180px" }}
              aria-label="Procurar ativo"
            />
            <select
              value={plat}
              onChange={(e) => setPlat(e.target.value)}
              style={{ width: "auto" }}
              aria-label="Plataforma"
            >
              <option value="todas">Todas as plataformas</option>
              {db.platforms.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
            <select
              value={moeda}
              onChange={(e) => setMoeda(e.target.value)}
              style={{ width: "auto" }}
              aria-label="Moeda"
            >
              <option value="todas">Todas as moedas</option>
              <option value="AOA">AOA</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
            <label className="row small" style={{ gap: "8px", cursor: "pointer" }}>
              <Switch checked={showZero} onChange={setShowZero} label="Mostrar posições fechadas" />
              Fechadas
            </label>
          </div>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {th("nome", "Ativo")}
              <th>Plataforma</th>
              <th className="num">Quantidade</th>
              <th className="num">Custo médio</th>
              {th("price", "Cotação", 1)}
              {th("chg", "Hoje", 1)}
              <th className="desk-only">30 dias</th>
              {th("valueM", "Valor (" + M + ")", 1)}
              {th("pct", "Ganho/perda", 1)}
              <th className="num">Peso</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => {
              const chg = r.prev ? r.price / r.prev - 1 : 0;
              return (
                <tr
                  key={r.a.id}
                  className="click"
                  onClick={() => go("ativo-" + r.a.id)}
                  tabIndex="0"
                  onKeyDown={(e) => e.key === "Enter" && go("ativo-" + r.a.id)}
                >
                  <td>
                    <div className="a-cell">
                      <AssetLogo a={r.a} />
                      <div>
                        <div className="a-name">{r.a.nome}</div>
                        <div className="a-sub">
                          {r.a.codigo} · {CLASS_ONE[r.a.classe]}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="small">{pname(r.a.plataforma)}</td>
                  <td className="num">{num(r.pos.qty, 6)}</td>
                  <td className="num">{r.pos.qty > 0 ? money(r.pos.avg, r.a.moeda) : "—"}</td>
                  <td className="num">
                    <FlashNum value={r.price}>{money(r.price, r.a.moeda)}</FlashNum>
                    <div className="a-sub">
                      {r.a.fonte === "auto"
                        ? quoteState.error
                          ? "última conhecida"
                          : "automática"
                        : "manual"}{" "}
                      · {fmtDate(r.qdate)}
                    </div>
                  </td>
                  <td className="num">
                    {r.a.fonte === "auto" ? (
                      <Pill v={chg}>{pct(chg)}</Pill>
                    ) : (
                      <span className="muted small">—</span>
                    )}
                  </td>
                  <td className="desk-only">
                    <Spark data={Array.from(r.series.slice(N - 30))} />
                  </td>
                  <td className="num">
                    <b>{money(r.valueM, M, 0)}</b>
                    <div className="a-sub">{money(r.pos.value, r.a.moeda, r.a.moeda === "AOA" ? 0 : 2)}</div>
                  </td>
                  <td className={"num " + tone(r.pos.gain)}>
                    {r.pos.qty > 0 ? (
                      <>
                        <b>{signed(r.pos.gain, r.a.moeda, r.a.moeda === "AOA" ? 0 : 2)}</b>
                        <div className="small">{pct(r.pos.pct)}</div>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="num small">{totalM ? pct(r.valueM / ctx.totals.value, false) : "—"}</td>
                </tr>
              );
            })}
            {!list.length && (
              <tr>
                <td colSpan="10">
                  <Empty
                    title="Nenhum ativo encontrado"
                    text={
                      db.assets.length
                        ? "Ajuste os filtros ou a pesquisa."
                        : "Registe o primeiro ativo para começar."
                    }
                    action={db.assets.length ? null : "Novo ativo"}
                    onAction={() => act.openAsset()}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="small muted" style={{ marginTop: "12px" }}>
        Custo médio ponderado: compras e taxas somam ao custo; uma venda retira unidades ao custo médio e a
        diferença conta como resultado de vendas. Clique num ativo para ver o histórico.
      </p>
    </>
  );
}