import { useState } from "react";
import { Icon } from "../Icon";
import { Modal } from "../ui";
import { CURRENCIES, PLATFORM_COLORS, PLATFORM_TYPES } from "../../domain/constantes";
import { uid } from "../../lib/formatacao";

export function PlatformForm({ db, platform, onClose, onSave, onDelete }) {
  const editing = !!platform;
  const [f, setF] = useState(
    platform
      ? { ...platform }
      : {
          nome: "",
          tipo: PLATFORM_TYPES[0],
          moeda: "AOA",
          cor: PLATFORM_COLORS[db.platforms.length % PLATFORM_COLORS.length],
        }
  );
  const [err, setErr] = useState("");
  const used = editing && db.assets.some((a) => a.plataforma === platform.id);
  function save() {
    const nome = f.nome.trim();
    if (nome.length < 2) return setErr("Indique o nome da plataforma.");
    if (db.platforms.some((p) => p.nome.toLowerCase() === nome.toLowerCase() && p.id !== platform?.id))
      return setErr("Já existe uma plataforma com esse nome.");
    onSave({ ...f, nome, id: platform?.id || uid("p") });
  }
  return (
    <Modal
      title={editing ? "Editar plataforma" : "Nova plataforma"}
      sub="Não pedimos nem guardamos credenciais de acesso a plataformas de terceiros."
      onClose={onClose}
      width={520}
    >
      <div className="form-grid">
        <label className="f" style={{ gridColumn: "1/-1" }}>
          Nome
          <input
            value={f.nome}
            onChange={(e) => setF({ ...f, nome: e.target.value })}
            placeholder="Ex.: Corretora do meu banco"
          />
        </label>
        <label className="f">
          Tipo
          <select value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value })}>
            {PLATFORM_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="f">
          Moeda base
          <select value={f.moeda} onChange={(e) => setF({ ...f, moeda: e.target.value })}>
            {CURRENCIES.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
      </div>
      <div style={{ marginTop: "14px" }}>
        <div className="stat-label" style={{ marginBottom: "8px" }}>
          Cor
        </div>
        <div className="row">
          {PLATFORM_COLORS.map((c) => (
            <button
              key={c}
              aria-label={"Cor " + c}
              aria-pressed={f.cor === c}
              onClick={() => setF({ ...f, cor: c })}
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background: c,
                border: f.cor === c ? "3px solid var(--ink)" : "3px solid transparent",
                cursor: "pointer",
              }}
            ></button>
          ))}
        </div>
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
            disabled={used}
            title={used ? "Mova ou elimine primeiro os ativos desta plataforma" : ""}
            onClick={() => onDelete(platform)}
          >
            <Icon n="trash" />
            Eliminar
          </button>
        )}
        <button className="btn" onClick={onClose}>
          Cancelar
        </button>
        <button className="btn btn-primary" onClick={save}>
          {editing ? "Guardar alterações" : "Registar plataforma"}
        </button>
      </div>
    </Modal>
  );
}
