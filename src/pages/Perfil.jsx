import { Icon } from "../components/Icon";
import { Switch, Tabs } from "../components/ui";
import { CURRENCIES } from "../domain/constantes";
import { TODAY } from "../domain/datas";
import { fmtDate, initials } from "../lib/formatacao";
import { offerDownload } from "../lib/transferencia";

export function Profile({ ctx, user, prefs, setPrefs, act, onLogout }) {
  const { db } = ctx;
  const created = user.criado;
  const last = user.ultimoAcesso;
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Perfil e preferências</h1>
          <p>Conta, apresentação dos valores, cotações e gestão dos seus dados.</p>
        </div>
      </div>
      <div className="grid g-main">
        <div className="grid" style={{ alignContent: "start" }}>
          <div className="card">
            <div className="row" style={{ gap: "14px" }}>
              <span className="avatar" style={{ width: "54px", height: "54px", fontSize: "1.2rem" }}>
                {initials(user.nome)}
              </span>
              <div>
                <h2>{user.nome}</h2>
                <div className="small muted">{user.email}</div>
                <div className="tiny muted">
                  Membro desde {fmtDate(created)}
                  {last
                    ? ` · última entrada ${new Date(last).toLocaleString("pt-AO", { dateStyle: "medium", timeStyle: "short" })}`
                    : ""}
                </div>
              </div>
            </div>
          </div>
          <div className="card">
            <h2>Apresentação</h2>
            <div className="setting">
              <div>
                <b>Moeda de apresentação</b>
                <p>Usada no painel e nos totais.</p>
              </div>
              <Tabs
                value={prefs.moeda}
                options={CURRENCIES}
                onChange={(m) => setPrefs({ moeda: m })}
                label="Moeda"
              />
            </div>
            <div className="setting">
              <div>
                <b>Tema</b>
                <p>Automático segue o sistema operativo.</p>
              </div>
              <Tabs
                value={prefs.tema}
                options={[
                  ["auto", "Automático"],
                  ["light", "Claro"],
                  ["dark", "Escuro"],
                ]}
                onChange={(t) => setPrefs({ tema: t })}
                label="Tema"
              />
            </div>
          </div>
          <div className="card">
            <h2>Cotações</h2>
            <div className="setting">
              <div>
                <b>Atualização automática</b>
                <p>Consulta a API pública de mercado em intervalos regulares.</p>
              </div>
              <Switch
                checked={prefs.live}
                onChange={(v) => setPrefs({ live: v })}
                label="Atualização automática"
              />
            </div>
            <div className="setting">
              <div>
                <b>Intervalo</b>
                <p>Tempo entre consultas.</p>
              </div>
              <select
                value={prefs.intervalo}
                onChange={(e) => setPrefs({ intervalo: +e.target.value })}
                style={{ width: "auto" }}
                aria-label="Intervalo"
              >
                {[3, 5, 10, 30, 60].map((s) => (
                  <option key={s} value={s}>
                    {s} segundos
                  </option>
                ))}
              </select>
            </div>
            <div className="setting">
              <div>
                <b>Simular falha da API</b>
                <p>
                  Para demonstrar o RNF04: a aplicação continua a funcionar com o último valor conhecido e a
                  respetiva data.
                </p>
              </div>
              <Switch
                checked={prefs.falha}
                onChange={(v) => setPrefs({ falha: v })}
                label="Simular falha da API"
              />
            </div>
          </div>
        </div>
        <div className="grid" style={{ alignContent: "start" }}>
          <div className="card">
            <h2>Segurança</h2>
            <div className="list small" style={{ marginTop: "8px" }}>
              {[
                ["lock", "Palavra-passe guardada apenas como hash com sal; nunca em texto."],
                ["shield", "Bloqueio temporário após 5 tentativas de entrada falhadas."],
                ["user", "Os seus dados ficam isolados: outra conta não os vê."],
                ["plat", "Sem ligação às plataformas e sem credenciais de terceiros."],
              ].map(([i, t]) => (
                <div className="list-item" key={t}>
                  <span className="tx-ico t-rendimento">
                    <Icon n={i} />
                  </span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
            <button className="btn" style={{ marginTop: "12px" }} onClick={act.changePassword}>
              <Icon n="lock" />
              Alterar palavra-passe
            </button>
          </div>
          <div className="card">
            <h2>Os seus dados</h2>
            <p className="small muted">
              {db.platforms.length} plataformas · {db.assets.length} ativos · {db.transactions.length}{" "}
              transações · {db.rates.length} taxas de câmbio
            </p>
            <div className="row">
              <button className="btn" onClick={act.exportCsv} disabled={!db.transactions.length}>
                <Icon n="down" />
                Transações (CSV)
              </button>
              <button
                className="btn"
                onClick={() =>
                  offerDownload(`carteira-unica-${TODAY}.json`, JSON.stringify(db, null, 2), act.notify)
                }
              >
                <Icon n="file" />
                Cópia completa (JSON)
              </button>
            </div>
            <div className="row" style={{ marginTop: "10px" }}>
              <button className="btn" onClick={act.loadSample}>
                Carregar carteira de exemplo
              </button>
              <button className="btn btn-danger" onClick={act.wipe}>
                <Icon n="trash" />
                Apagar todos os dados
              </button>
            </div>
          </div>
          <button className="btn" onClick={onLogout}>
            <Icon n="logout" />
            Terminar sessão
          </button>
        </div>
      </div>
    </>
  );
}
