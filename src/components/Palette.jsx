import { useState, useMemo, useEffect, Fragment } from "react";
import { Icon } from "./Icon";
import { AssetLogo } from "./ui";
import { VIEWS } from "../navegacao";

export function Palette({ db, go, act, onClose }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const items = useMemo(() => {
    const qq = q.trim().toLowerCase();
    const m = (s) => !qq || s.toLowerCase().includes(qq);
    const views = VIEWS.filter((v) => m(v.label)).map((v) => ({
      grp: "Ir para",
      label: v.label,
      icon: v.icon,
      run: () => go(v.id),
    }));
    const assets = db.assets
      .filter((a) => m(a.nome + " " + a.codigo))
      .slice(0, 8)
      .map((a) => ({
        grp: "Ativos",
        label: `${a.nome} · ${a.codigo}`,
        asset: a,
        run: () => go("ativo-" + a.id),
      }));
    const actions = [
      ["Nova transação", "plus", () => act.openTx()],
      ["Novo ativo", "plus", () => act.openAsset()],
      ["Nova plataforma", "plus", () => act.openPlatform()],
      ["Atualizar cotações", "refresh", act.refreshQuotes],
      ["Exportar transações (CSV)", "down", act.exportCsv],
    ]
      .filter(([l]) => m(l))
      .map(([label, icon, run]) => ({ grp: "Ações", label, icon, run }));
    return [...assets, ...views, ...actions];
  }, [q, db.assets]);
  useEffect(() => setSel(0), [q]);
  function key(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => Math.min(items.length - 1, s + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => Math.max(0, s - 1));
    } else if (e.key === "Enter" && items[sel]) {
      onClose();
      items[sel].run();
    } else if (e.key === "Escape") onClose();
  }
  let lastGrp = "";
  return (
    <div
      className="backdrop"
      style={{ placeItems: "start center" }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="palette" role="dialog" aria-modal="true" aria-label="Pesquisa rápida">
        <input
          autoFocus
          placeholder="Procurar ativos, páginas ou ações…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={key}
          aria-label="Pesquisar"
        />
        <ul role="listbox">
          {items.map((it, i) => {
            const head = it.grp !== lastGrp;
            lastGrp = it.grp;
            return (
              <Fragment key={it.grp + it.label}>
                {head && (
                  <li className="grp" role="presentation">
                    {it.grp}
                  </li>
                )}
                <li
                  role="option"
                  aria-selected={i === sel}
                  onMouseEnter={() => setSel(i)}
                  onClick={() => {
                    onClose();
                    it.run();
                  }}
                >
                  {it.asset ? (
                    <AssetLogo a={it.asset} size={26} />
                  ) : (
                    <span className="tx-ico t-taxa" style={{ width: "26px", height: "26px" }}>
                      <Icon n={it.icon} style={{ width: "14px", height: "14px" }} />
                    </span>
                  )}
                  <span>{it.label}</span>
                </li>
              </Fragment>
            );
          })}
          {!items.length && <li className="grp">Sem resultados para «{q}».</li>}
        </ul>
      </div>
    </div>
  );
}
