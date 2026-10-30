import { useState } from "react";
import { Icon } from "../Icon";
import { Modal, Tabs } from "../ui";
import { convert } from "../../domain/cambio";
import { CURRENCIES, TX_TYPES } from "../../domain/constantes";
import { autoHistory, manualSeries } from "../../domain/cotacoes";
import { parseDecimal, validDate } from "../../domain/csv";
import { TODAY, idxOf } from "../../domain/datas";
import { heldAt, ledgerProblem } from "../../domain/posicoes";
import { fmtDate, money, num, uid } from "../../lib/formatacao";

export function TxForm({ db, tx, presetAsset, onClose, onSave, onDelete }) {
  const editing = !!tx;
  const first = db.assets.find((a) => a.id === presetAsset) || db.assets[0];
  const [f, setF] = useState(() =>
    tx
      ? {
          ativo: tx.ativo,
          tipo: tx.tipo,
          data: tx.data,
          quantidade: String(tx.quantidade),
          preco: String(tx.preco),
          moeda: tx.moeda,
        }
      : {
          ativo: first?.id || "",
          tipo: "compra",
          data: TODAY,
          quantidade: "",
          preco: "",
          moeda: first?.moeda || "USD",
        }
  );
  const [err, setErr] = useState("");
  const asset = db.assets.find((a) => a.id === f.ativo);
  const single = f.tipo === "rendimento" || f.tipo === "taxa";
  const set = (k) => (e) => {
    const v = e.target.value;
    setF((p) =>
      k === "ativo"
        ? { ...p, ativo: v, moeda: db.assets.find((a) => a.id === v)?.moeda || p.moeda }
        : { ...p, [k]: v }
    );
  };
  const q = single ? 1 : parseDecimal(f.quantidade),
    p = parseDecimal(f.preco);
  const held = asset
    ? heldAt(
        db.transactions.filter((t) => t.id !== tx?.id),
        asset.id,
        f.data
      )
    : 0;
  function suggest() {
    if (!asset) return;
    const s = asset.fonte === "auto" ? autoHistory(asset)[idxOf(f.data)] : manualSeries(asset)[idxOf(f.data)];
    if (s) setF((x) => ({ ...x, preco: String(Math.round(s * 100) / 100), moeda: asset.moeda }));
  }
  function save() {
    if (!asset) return setErr("Registe primeiro um ativo.");
    if (!validDate(f.data) || f.data > TODAY) return setErr("Indique uma data válida, que não seja futura.");
    if (!(q > 0)) return setErr("A quantidade tem de ser maior que zero.");
    if (isNaN(p) || p < 0) return setErr("Indique um preço ou montante válido.");
    const t = {
      id: tx?.id || uid("t"),
      ativo: f.ativo,
      tipo: f.tipo,
      data: f.data,
      quantidade: q,
      preco: p,
      moeda: f.moeda,
    };
    const others = db.transactions.filter((x) => x.id !== t.id);
    const prob = ledgerProblem([...others, t], t.ativo);
    if (prob)
      return setErr(
        `Esta alteração deixa a posição negativa: a venda de ${fmtDate(prob.tx.data)} excede as ${num(prob.held, 6)} unidades detidas nessa data.`
      );
    onSave(t, editing);
  }
  return (
    <Modal
      title={editing ? "Editar transação" : "Nova transação"}
      sub="Compras e vendas alteram a quantidade; dividendos, juros e taxas registam um montante."
      onClose={onClose}
    >
      <div style={{ marginBottom: "14px" }}>
        <Tabs
          value={f.tipo}
          options={Object.entries(TX_TYPES)}
          onChange={(v) => setF((x) => ({ ...x, tipo: v }))}
          label="Tipo"
        />
      </div>
      <div className="form-grid">
        <label className="f" style={{ gridColumn: "1/-1" }}>
          Ativo
          <select value={f.ativo} onChange={set("ativo")}>
            {db.assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome} ({a.codigo})
              </option>
            ))}
          </select>
        </label>
        <label className="f">
          Data
          <input type="date" value={f.data} max={TODAY} onChange={set("data")} />
        </label>
        {!single && (
          <label className="f">
            Quantidade
            {f.tipo === "venda" && asset ? <span className="h">Detém {num(held, 6)} nessa data</span> : ""}
            <input inputMode="decimal" value={f.quantidade} onChange={set("quantidade")} placeholder="0" />
          </label>
        )}
        <label className="f">
          {single ? "Montante" : "Preço unitário"}
          {!single && asset ? (
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              style={{ padding: "0 4px", alignSelf: "flex-start", color: "var(--brand)" }}
              onClick={suggest}
            >
              Usar cotação da data
            </button>
          ) : (
            ""
          )}
          <input inputMode="decimal" value={f.preco} onChange={set("preco")} placeholder="0,00" />
        </label>
        <label className="f">
          Moeda
          <select value={f.moeda} onChange={set("moeda")}>
            {CURRENCIES.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
      </div>
      {q > 0 && p >= 0 ? (
        <div
          className="card"
          style={{
            marginTop: "14px",
            boxShadow: "none",
            background: "var(--surface-2)",
            padding: "12px 14px",
          }}
        >
          <div className="row between">
            <span className="muted small">Total da transação</span>
            <b className="num-font" style={{ fontSize: "1.2rem" }}>
              {money(q * p, f.moeda)}
            </b>
          </div>
          {asset && f.moeda !== asset.moeda ? (
            <div className="tiny muted">
              Convertido para {asset.moeda} com a taxa de {fmtDate(f.data)}:{" "}
              {money(convert(db.rates, q * p, f.moeda, asset.moeda, f.data), asset.moeda)}
            </div>
          ) : null}
        </div>
      ) : null}
      {err && (
        <p className="err" role="alert">
          {err}
        </p>
      )}
      <div className="modal-foot">
        {editing && (
          <button className="btn btn-danger" style={{ marginRight: "auto" }} onClick={() => onDelete(tx)}>
            <Icon n="trash" />
            Eliminar
          </button>
        )}
        <button className="btn" onClick={onClose}>
          Cancelar
        </button>
        <button className="btn btn-primary" onClick={save}>
          {editing ? "Guardar alterações" : "Registar transação"}
        </button>
      </div>
    </Modal>
  );
}
