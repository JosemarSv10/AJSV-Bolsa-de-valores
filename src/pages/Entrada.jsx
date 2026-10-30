import { useState } from "react";
import { Icon, LogoMark } from "../components/Icon";
import { Tabs } from "../components/ui";
import { emptyDb } from "../domain/dadosExemplo";
import { TODAY } from "../domain/datas";
import { store } from "../lib/armazenamento";
import { DEMO_EMAIL, DEMO_PASS, hashPw, pwStrength } from "../lib/autenticacao";
import { uid } from "../lib/formatacao";

export function Auth({ onLogin }) {
  const [mode, setMode] = useState("entrar");
  const [f, setF] = useState({ nome: "", email: DEMO_EMAIL, pass: DEMO_PASS, pass2: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const strength = pwStrength(f.pass);
  async function submit(e) {
    e.preventDefault();
    setErr("");
    const email = f.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return setErr("Introduza um email válido.");
    setBusy(true);
    try {
      const users = store.get("cu-users") || {};
      if (mode === "entrar") {
        const u = users[email];
        if (u && u.bloqueadoAte > Date.now())
          return setErr(
            `Conta bloqueada temporariamente após 5 tentativas falhadas. Tente de novo dentro de ${Math.ceil((u.bloqueadoAte - Date.now()) / 1000)} s.`
          );
        const ok = u && (await hashPw(f.pass, u.salt)) === u.hash;
        if (!ok) {
          if (u) {
            u.falhas = (u.falhas || 0) + 1;
            if (u.falhas >= 5) {
              u.bloqueadoAte = Date.now() + 60000;
              u.falhas = 0;
            }
            store.set("cu-users", users);
          }
          return setErr("Email ou palavra-passe incorretos.");
        }
        u.falhas = 0;
        u.ultimoAcesso = new Date().toISOString();
        store.set("cu-users", users);
        onLogin(u);
      } else {
        if (f.nome.trim().length < 2) return setErr("Indique o seu nome.");
        if (users[email]) return setErr("Já existe uma conta com este email.");
        if (strength < 3)
          return setErr("Use pelo menos 8 caracteres, com maiúsculas, minúsculas, números e um símbolo.");
        if (f.pass !== f.pass2) return setErr("As palavras-passe não coincidem.");
        const salt = uid("s");
        const u = {
          id: uid("u"),
          nome: f.nome.trim(),
          email,
          salt,
          hash: await hashPw(f.pass, salt),
          criado: TODAY,
          falhas: 0,
          bloqueadoAte: 0,
          ultimoAcesso: new Date().toISOString(),
        };
        users[email] = u;
        store.set("cu-users", users);
        store.set("cu-data-" + u.id, emptyDb());
        onLogin(u, true);
      }
    } finally {
      setBusy(false);
    }
  }
  const strengthTxt = ["Muito fraca", "Fraca", "Razoável", "Forte", "Muito forte"][strength];
  const strengthCol = ["var(--loss)", "var(--loss)", "var(--gold)", "var(--gain)", "var(--gain)"][strength];
  return (
    <div className="auth">
      <section className="auth-art">
        <div className="brand">
          <LogoMark />
          Carteira Única
        </div>
        <div>
          <h1>O seu património inteiro, num só ecrã.</h1>
          <p>
            Ações na corretora, títulos no banco, imóveis e criptomoedas: registe tudo uma vez e acompanhe o
            valor total em kwanzas, dólares ou euros.
          </p>
        </div>
        <div className="preview-card" aria-hidden="true">
          <div className="tiny" style={{ color: "var(--hero-muted)", fontWeight: 600 }}>
            Património total
          </div>
          <div className="tot">299 452 140 Kz</div>
          <div className="preview-bars">
            {[
              ["var(--c-imovel)", 58],
              ["var(--c-acao)", 16],
              ["var(--c-cripto)", 13],
              ["var(--c-titulo)", 8],
              ["var(--c-outro)", 5],
            ].map(([c, w]) => (
              <span key={c} style={{ background: c, width: w + "%" }}></span>
            ))}
          </div>
          <div className="preview-legend">
            <span>Imóveis 58%</span>
            <span>Ações 16%</span>
            <span>Cripto 13%</span>
            <span>Títulos 8%</span>
          </div>
        </div>
        <div className="trust">
          <span>
            <Icon n="shield" />
            Não se liga às suas contas
          </span>
          <span>
            <Icon n="lock" />
            Nunca pede palavras-passe de terceiros
          </span>
          <span>
            <Icon n="coin" />
            AOA, USD e EUR
          </span>
        </div>
      </section>
      <section className="auth-form">
        <form className="auth-card" onSubmit={submit} noValidate>
          <Tabs
            value={mode}
            options={[
              ["entrar", "Entrar"],
              ["criar", "Criar conta"],
            ]}
            onChange={(v) => {
              setMode(v);
              setErr("");
              if (v === "criar") setF({ nome: "", email: "", pass: "", pass2: "" });
              else setF({ nome: "", email: DEMO_EMAIL, pass: DEMO_PASS, pass2: "" });
            }}
            label="Modo"
          />
          <div>
            <h2>{mode === "entrar" ? "Bem-vindo de volta" : "Crie a sua carteira"}</h2>
            <p className="muted small" style={{ margin: "4px 0 0" }}>
              {mode === "entrar"
                ? "Entre para ver o seu património consolidado."
                : "Leva menos de um minuto. Os dados ficam só na sua conta."}
            </p>
          </div>
          {mode === "criar" && (
            <label className="f">
              Nome
              <input value={f.nome} onChange={set("nome")} autoComplete="name" />
            </label>
          )}
          <label className="f">
            Email
            <input type="email" value={f.email} onChange={set("email")} autoComplete="email" />
          </label>
          <label className="f">
            Palavra-passe
            <input
              type="password"
              value={f.pass}
              onChange={set("pass")}
              autoComplete={mode === "entrar" ? "current-password" : "new-password"}
            />
            {mode === "criar" && f.pass && (
              <div>
                <div className="pw-meter">
                  {[0, 1, 2, 3].map((i) => (
                    <i key={i} style={{ background: i < strength ? strengthCol : null }}></i>
                  ))}
                </div>
                <span className="h">{strengthTxt}</span>
              </div>
            )}
          </label>
          {mode === "criar" && (
            <label className="f">
              Confirmar palavra-passe
              <input type="password" value={f.pass2} onChange={set("pass2")} autoComplete="new-password" />
            </label>
          )}
          {err && (
            <div className="err" role="alert" style={{ margin: 0 }}>
              {err}
            </div>
          )}
          <button className="btn btn-primary" type="submit" disabled={busy} style={{ padding: "12px" }}>
            {busy ? "A verificar…" : mode === "entrar" ? "Entrar" : "Criar conta"}
          </button>
          {mode === "entrar" && (
            <div className="demo-box">
              Conta de demonstração já preenchida: <b>{DEMO_EMAIL}</b> · <b>{DEMO_PASS}</b>. Crie uma conta
              nova para ver uma carteira vazia, isolada desta.
            </div>
          )}
        </form>
      </section>
    </div>
  );
}
