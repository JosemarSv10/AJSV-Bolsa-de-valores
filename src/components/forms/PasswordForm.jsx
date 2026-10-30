import { useState } from "react";
import { Modal } from "../ui";
import { store } from "../../lib/armazenamento";
import { hashPw, pwStrength } from "../../lib/autenticacao";
import { uid } from "../../lib/formatacao";

export function PasswordForm({ user, onClose, onDone }) {
  const [f, setF] = useState({ atual: "", nova: "", conf: "" });
  const [err, setErr] = useState("");
  async function save() {
    const users = store.get("cu-users") || {};
    const u = users[user.email];
    if (!u || (await hashPw(f.atual, u.salt)) !== u.hash)
      return setErr("A palavra-passe atual está incorreta.");
    if (pwStrength(f.nova) < 3)
      return setErr(
        "A nova palavra-passe precisa de 8+ caracteres, maiúsculas, minúsculas, números e um símbolo."
      );
    if (f.nova !== f.conf) return setErr("As palavras-passe não coincidem.");
    u.salt = uid("s");
    u.hash = await hashPw(f.nova, u.salt);
    store.set("cu-users", users);
    onDone();
  }
  return (
    <Modal title="Alterar palavra-passe" onClose={onClose} width={440}>
      <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
        <label className="f">
          Palavra-passe atual
          <input
            type="password"
            value={f.atual}
            onChange={(e) => setF({ ...f, atual: e.target.value })}
            autoComplete="current-password"
          />
        </label>
        <label className="f">
          Nova palavra-passe
          <input
            type="password"
            value={f.nova}
            onChange={(e) => setF({ ...f, nova: e.target.value })}
            autoComplete="new-password"
          />
        </label>
        <label className="f">
          Confirmar nova palavra-passe
          <input
            type="password"
            value={f.conf}
            onChange={(e) => setF({ ...f, conf: e.target.value })}
            autoComplete="new-password"
          />
        </label>
      </div>
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
          Alterar palavra-passe
        </button>
      </div>
    </Modal>
  );
}
