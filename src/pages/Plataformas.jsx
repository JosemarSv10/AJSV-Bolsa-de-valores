import { Icon } from "../components/Icon";
import { Empty } from "../components/ui";
import { CLASSES, CLASS_VAR } from "../domain/constantes";
import { money, pct, signed, tone } from "../lib/formatacao";

export function Platforms({ ctx, act }) {
  const { db, rows, M, totals } = ctx;
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Plataformas</h1>
          <p>
            Onde estão os seus investimentos. Guardamos apenas o nome, o tipo e a moeda base: nunca
            credenciais nem acesso às contas.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => act.openPlatform()}>
          <Icon n="plus" />
          Nova plataforma
        </button>
      </div>
      {db.platforms.length ? (
        <div className="grid g-3">
          {db.platforms.map((p) => {
            const mine = rows.filter((r) => r.a.plataforma === p.id);
            const v = mine.reduce((s, r) => s + r.valueM, 0);
            const byCls = {};
            mine.forEach((r) => (byCls[r.a.classe] = (byCls[r.a.classe] || 0) + r.valueM));
            const gain = mine.reduce((s, r) => s + r.gainM, 0);
            return (
              <div className="card plat-card" key={p.id} style={{ "--pc": p.cor }}>
                <div className="row between">
                  <div>
                    <h2>{p.nome}</h2>
                    <div className="small muted">
                      {p.tipo} · moeda base {p.moeda}
                    </div>
                  </div>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => act.openPlatform(p)}
                    aria-label={"Editar " + p.nome}
                  >
                    <Icon n="edit" />
                  </button>
                </div>
                <div className="plat-big" style={{ marginTop: "14px" }}>
                  {money(v, M, 0)}
                </div>
                <div className="row small" style={{ marginTop: "4px" }}>
                  <span className="muted">
                    {pct(totals.value ? v / totals.value : 0, false)} do património
                  </span>
                  <span className={tone(gain)}>{signed(gain, M, 0)}</span>
                </div>
                <div className="mini-stack">
                  {Object.entries(byCls).map(([k, x]) => (
                    <span
                      key={k}
                      style={{ width: (v ? (x / v) * 100 : 0) + "%", background: `var(${CLASS_VAR[k]})` }}
                      title={CLASSES[k]}
                    ></span>
                  ))}
                </div>
                <div className="row" style={{ marginTop: "10px", gap: "6px" }}>
                  {mine.slice(0, 6).map((r) => (
                    <span className="chip" key={r.a.id}>
                      {r.a.codigo}
                    </span>
                  ))}
                  {mine.length > 6 ? <span className="chip">+{mine.length - 6}</span> : null}
                  {!mine.length && <span className="small muted">Sem ativos</span>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card">
          <Empty
            title="Ainda não registou plataformas"
            text="Comece pela corretora ou banco onde tem investimentos."
            action="Nova plataforma"
            onAction={() => act.openPlatform()}
          />
        </div>
      )}
    </>
  );
}
