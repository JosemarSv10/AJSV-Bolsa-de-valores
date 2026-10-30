import { useState } from "react";
import { Modal } from "../ui";
import { lastValuation } from "../../domain/cotacoes";
import { parseDecimal, validDate } from "../../domain/csv";
import { TODAY } from "../../domain/datas";
import { fmtDate, money, pct, tone } from "../../lib/formatacao";

export function ValuationForm({ asset, onClose, onSave }) {
  const last = lastValuation(asset);
  const [preco, setPreco] = useState(String(last?.preco ?? ""));
  const [data, setData] = useState(TODAY);
  const [err, setErr] = useState("");
  const v = parseDecimal(preco);
  const delta = last && v > 0 ? v / last.preco - 1 : null;
  function save() {
    if (!(v > 0)) return setErr("Indique um valor maior que zero.");
    if (!validDate(data) || data > TODAY) return setErr("A data não pode ser futura.");
    onSave(v, data);
  }
  return (
    <Modal
      title="Atualizar valor"
      sub={`${asset.nome}: ativo sem cotação automática. Registe o valor unitário da avaliação mais recente.`}
      onClose={onClose}
      width={480}
    >
      <div className="form-grid">
        <label className="f">
          Valor unitário ({asset.moeda})
          <input inputMode="decimal" value={preco} onChange={(e) => setPreco(e.target.value)} />
        </label>
        <label className="f">
          Data da avaliação
          <input type="date" value={data} max={TODAY} onChange={(e) => setData(e.target.value)} />
        </label>
      </div>
      {last && (
        <p className="small muted">
          Avaliação anterior: {money(last.preco, asset.moeda)} em {fmtDate(last.data)}
          {delta != null && isFinite(delta) ? (
            <>
              · variação <b className={tone(delta)}>{pct(delta)}</b>
            </>
          ) : (
            ""
          )}
        </p>
      )}
      {err && (
        <p className="err" role="alert">
          {err}
        </p>
      )}
      <div className="modal-foot">
        <button className="btn" onClick={onClose}>
          Cancelar
        </button>
        <button className="btn btn-primary" onClick={save}>
          Guardar avaliação
        </button>
      </div>
    </Modal>
  );
}
