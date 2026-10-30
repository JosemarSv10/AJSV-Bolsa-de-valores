import { useState, useMemo, useEffect } from "react";
import { Icon } from "../components/Icon";
import { AssetLogo, Empty } from "../components/ui";
import { convert } from "../domain/cambio";
import { TX_TYPES } from "../domain/constantes";
import { fmtDate, money, num } from "../lib/formatacao";

export const PAGE = 15;

export function Transactions({ ctx, act }) {
  const { db, M } = ctx;
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState("todos");
  const [plat, setPlat] = useState("todas");
  const [ano, setAno] = useState("todos");
  const [sort, setSort] = useState({ k: "data", d: -1 });
  const [page, setPage] = useState(0);
  const aById = useMemo(() => Object.fromEntries(db.assets.map((a) => [a.id, a])), [db.assets]);
  const years = [...new Set(db.transactions.map((t) => t.data.slice(0, 4)))].sort().reverse();
  const list = useMemo(() => {
    const l = db.transactions.filter((t) => {
      const a = aById[t.ativo];
      return (
        (tipo === "todos" || t.tipo === tipo) &&
        (plat === "todas" || a?.plataforma === plat) &&
        (ano === "todos" || t.data.startsWith(ano)) &&
        (!q || (a && (a.nome + " " + a.codigo).toLowerCase().includes(q.toLowerCase())))
      );
    });
    const key = (t) =>
      sort.k === "data"
        ? t.data + String(t.id).padStart(12, "0")
        : sort.k === "ativo"
          ? aById[t.ativo]?.nome || ""
          : sort.k === "tipo"
            ? t.tipo
            : convert(db.rates, t.quantidade * t.preco, t.moeda, M, t.data);
    return l.sort((x, y) => {
      const a = key(x),
        b = key(y);
      return (typeof a === "string" ? a.localeCompare(b) : a - b) * sort.d;
    });
  }, [db.transactions, q, tipo, plat, ano, sort, M]);
  useEffect(() => setPage(0), [q, tipo, plat, ano]);
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const pg = Math.min(page, pages - 1);
  const sum = (k) =>
    list
      .filter((t) => t.tipo === k)
      .reduce((s, t) => s + convert(db.rates, t.quantidade * t.preco, t.moeda, M, t.data), 0);
  const th = (k, l, num) => (
    <th className={num ? "num" : ""}>
      <button onClick={() => setSort((s) => ({ k, d: s.k === k ? -s.d : -1 }))}>
        {l}
        {sort.k === k ? (sort.d > 0 ? " ↑" : " ↓") : ""}
      </button>
    </th>
  );
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Transações</h1>
          <p>
            Compras, vendas, dividendos, juros e taxas. Cada alteração recalcula posições, custos médios e
            ganhos.
          </p>
        </div>
        <div className="row">
          <button className="btn" onClick={act.exportCsv} disabled={!db.transactions.length}>
            <Icon n="down" />
            Exportar CSV
          </button>
          <button className="btn btn-primary" onClick={() => act.openTx()} disabled={!db.assets.length}>
            <Icon n="plus" />
            Nova transação
          </button>
        </div>
      </div>
      <div className="grid g-4" style={{ marginBottom: "14px" }}>
        {[
          ["compra", "Comprado", "var(--c-acao)"],
          ["venda", "Vendido", "var(--c-cripto)"],
          ["rendimento", "Rendimentos", "var(--gain)"],
          ["taxa", "Taxas", "var(--muted)"],
        ].map(([k, l, c]) => (
          <div className="card" key={k} style={{ padding: "14px 16px" }}>
            <div className="stat-label">
              <span className="dot" style={{ background: c }}></span>
              {l} <span className="tiny">({list.filter((t) => t.tipo === k).length})</span>
            </div>
            <div className="stat-value" style={{ fontSize: "1.2rem" }}>
              {money(sum(k), M, 0)}
            </div>
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: "12px 14px", marginBottom: "14px" }}>
        <div className="row">
          <input
            type="search"
            placeholder="Procurar por ativo ou código"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ maxWidth: "260px" }}
            aria-label="Procurar"
          />
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            style={{ width: "auto" }}
            aria-label="Tipo"
          >
            <option value="todos">Todos os tipos</option>
            {Object.entries(TX_TYPES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
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
            value={ano}
            onChange={(e) => setAno(e.target.value)}
            style={{ width: "auto" }}
            aria-label="Ano"
          >
            <option value="todos">Todos os anos</option>
            {years.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
          {(q || tipo !== "todos" || plat !== "todas" || ano !== "todos") && (
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => {
                setQ("");
                setTipo("todos");
                setPlat("todas");
                setAno("todos");
              }}
            >
              Limpar filtros
            </button>
          )}
          <span className="small muted" style={{ marginLeft: "auto" }}>
            {list.length} de {db.transactions.length}
          </span>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {th("data", "Data")}
              {th("ativo", "Ativo")}
              {th("tipo", "Tipo")}
              <th className="num">Quantidade</th>
              <th className="num">Preço unitário</th>
              <th className="num">Total</th>
              {th("total", "Em " + M, 1)}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.slice(pg * PAGE, pg * PAGE + PAGE).map((t) => {
              const a = aById[t.ativo];
              return (
                <tr key={t.id}>
                  <td>{fmtDate(t.data)}</td>
                  <td>
                    {a ? (
                      <div className="a-cell">
                        <AssetLogo a={a} size={28} />
                        <div>
                          <div className="a-name small">{a.nome}</div>
                          <div className="a-sub">{a.codigo}</div>
                        </div>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <span className={"pill t-" + t.tipo}>{TX_TYPES[t.tipo]}</span>
                  </td>
                  <td className="num">
                    {t.tipo === "compra" || t.tipo === "venda" ? num(t.quantidade, 6) : "—"}
                  </td>
                  <td className="num">
                    {t.tipo === "compra" || t.tipo === "venda" ? money(t.preco, t.moeda) : "—"}
                  </td>
                  <td className="num">
                    <b>{money(t.quantidade * t.preco, t.moeda)}</b>
                  </td>
                  <td className="num muted">
                    {money(convert(db.rates, t.quantidade * t.preco, t.moeda, M, t.data), M, 0)}
                  </td>
                  <td className="num">
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={() => act.openTx(t)}
                      aria-label="Editar transação"
                    >
                      <Icon n="edit" />
                    </button>
                    <button
                      className="btn btn-sm btn-ghost btn-danger"
                      onClick={() => act.deleteTx(t)}
                      aria-label="Eliminar transação"
                    >
                      <Icon n="trash" />
                    </button>
                  </td>
                </tr>
              );
            })}
            {!list.length && (
              <tr>
                <td colSpan="8">
                  <Empty
                    title={
                      db.transactions.length
                        ? "Nenhuma transação corresponde aos filtros"
                        : "Ainda não há transações"
                    }
                    text={
                      db.transactions.length
                        ? "Altere a pesquisa ou os filtros."
                        : "Registe a primeira compra ou importe um ficheiro CSV."
                    }
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="pager">
          <span className="small muted">
            Página {pg + 1} de {pages}
          </span>
          <div className="row">
            <button className="btn btn-sm" disabled={pg === 0} onClick={() => setPage(pg - 1)}>
              Anterior
            </button>
            <button className="btn btn-sm" disabled={pg >= pages - 1} onClick={() => setPage(pg + 1)}>
              Seguinte
            </button>
          </div>
        </div>
      )}
      <p className="small muted" style={{ marginTop: "12px" }}>
        Os valores em {M} usam a taxa de câmbio em vigor na data de cada transação.
      </p>
    </>
  );
}
