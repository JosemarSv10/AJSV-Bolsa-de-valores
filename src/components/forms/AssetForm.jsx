import { useState } from "react";
import { Icon } from "../Icon";
import { Modal } from "../ui";
import { CLASS_ONE, CURRENCIES } from "../../domain/constantes";
import { currentPrice } from "../../domain/cotacoes";
import { parseDecimal } from "../../domain/csv";
import { TODAY } from "../../domain/datas";
import { uid } from "../../lib/formatacao";

export function AssetForm({ db, asset, onClose, onSave, onDelete }) {
  const editing = !!asset;
  const [f, setF] = useState(() =>
    asset
      ? {
          nome: asset.nome,
          codigo: asset.codigo,
          classe: asset.classe,
          plataforma: asset.plataforma,
          moeda: asset.moeda,
          preco: String(currentPrice(asset, {}) || ""),
          setor: asset.setor || "",
        }
      : {
          nome: "",
          codigo: "",
          classe: "acao",
          plataforma: db.platforms[0]?.id || "",
          moeda: db.platforms[0]?.moeda || "USD",
          preco: "",
          setor: "",
        }
  );
  const [err, setErr] = useState("");
  const set = (k) => (e) =>
    setF((p) => {
      const v = e.target.value;
      if (k === "plataforma") {
        const pl = db.platforms.find((x) => x.id === v);
        return { ...p, plataforma: v, moeda: editing ? p.moeda : pl?.moeda || p.moeda };
      }
      return { ...p, [k]: v };
    });
  const fonte = editing ? asset.fonte : f.classe === "acao" || f.classe === "cripto" ? "auto" : "manual";
  const hasTx = editing && db.transactions.some((t) => t.ativo === asset.id);
  function save() {
    if (!db.platforms.length) return setErr("Registe primeiro uma plataforma.");
    if (f.nome.trim().length < 2) return setErr("Indique o nome do ativo.");
    const codigo = f.codigo.trim().toUpperCase();
    if (!/^[A-Z0-9][A-Z0-9.\-]{0,11}$/.test(codigo))
      return setErr("O código usa até 12 letras, números, ponto ou hífen.");
    if (db.assets.some((a) => a.codigo === codigo && a.id !== asset?.id))
      return setErr("Já existe um ativo com esse código.");
    const p = parseDecimal(f.preco);
    if (!editing && !(p > 0)) return setErr("Indique o valor atual unitário.");
    if (editing)
      return onSave({
        ...asset,
        nome: f.nome.trim(),
        codigo,
        plataforma: f.plataforma,
        setor: f.setor.trim(),
      });
    const base = {
      id: uid("a"),
      nome: f.nome.trim(),
      codigo,
      classe: f.classe,
      plataforma: f.plataforma,
      moeda: f.moeda,
      fonte,
      setor: f.setor.trim() || CLASS_ONE[f.classe],
    };
    onSave(
      fonte === "auto"
        ? {
            ...base,
            seed: Math.floor(Math.random() * 1e6),
            inicio: p * (0.75 + Math.random() * 0.4),
            anchor: p,
            vol: f.classe === "cripto" ? 0.03 : 0.015,
          }
        : { ...base, avaliacoes: [{ data: TODAY, preco: p }] }
    );
  }
  return (
    <Modal
      title={editing ? "Editar ativo" : "Novo ativo"}
      sub={
        editing
          ? "A classe e a moeda não mudam depois de existirem transações."
          : "O tipo de cotação depende da classe: ações e cripto são automáticas."
      }
      onClose={onClose}
    >
      <div className="form-grid">
        <label className="f">
          Nome
          <input value={f.nome} onChange={set("nome")} placeholder="Ex.: Coca-Cola Co." />
        </label>
        <label className="f">
          Código / ticker
          <input
            value={f.codigo}
            onChange={set("codigo")}
            placeholder="Ex.: KO"
            style={{ textTransform: "uppercase" }}
          />
        </label>
        <label className="f">
          Classe
          <select value={f.classe} onChange={set("classe")} disabled={editing}>
            {Object.entries(CLASS_ONE).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="f">
          Plataforma
          <select value={f.plataforma} onChange={set("plataforma")}>
            {db.platforms.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="f">
          Moeda do ativo
          <select value={f.moeda} onChange={set("moeda")} disabled={editing}>
            {CURRENCIES.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
        {!editing && (
          <label className="f">
            Valor atual unitário
            <input inputMode="decimal" value={f.preco} onChange={set("preco")} placeholder="0,00" />
          </label>
        )}
        <label className="f" style={{ gridColumn: "1/-1" }}>
          Descrição <span className="h">Opcional. Ex.: setor, bolsa, morada</span>
          <input value={f.setor} onChange={set("setor")} />
        </label>
      </div>
      <div
        className="notice"
        style={{
          marginTop: "14px",
          background: "var(--surface-2)",
          color: "var(--muted)",
          borderColor: "var(--line)",
        }}
      >
        <Icon n="clock" />
        <span>
          Cotação{" "}
          <b style={{ color: "var(--ink)" }}>
            {fonte === "auto"
              ? "automática, através da API pública de mercado"
              : "manual: atualiza o valor sempre que houver nova avaliação"}
          </b>
          .
        </span>
      </div>
      {err && (
        <p className="err" role="alert">
          {err}
        </p>
      )}
      <div className="modal-foot">
        {editing && (
          <button
            className="btn btn-danger"
            style={{ marginRight: "auto" }}
            disabled={hasTx}
            title={hasTx ? "Elimine primeiro as transações deste ativo" : ""}
            onClick={() => onDelete(asset)}
          >
            <Icon n="trash" />
            Eliminar
          </button>
        )}
        <button className="btn" onClick={onClose}>
          Cancelar
        </button>
        <button className="btn btn-primary" onClick={save}>
          {editing ? "Guardar alterações" : "Registar ativo"}
        </button>
      </div>
    </Modal>
  );
}
