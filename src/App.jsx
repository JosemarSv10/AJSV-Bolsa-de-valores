import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Icon, LogoMark } from "./components/Icon";
import { Palette } from "./components/Palette";
import { AssetForm } from "./components/forms/AssetForm";
import { Confirm } from "./components/forms/Confirm";
import { PasswordForm } from "./components/forms/PasswordForm";
import { PlatformForm } from "./components/forms/PlatformForm";
import { TxForm } from "./components/forms/TxForm";
import { ValuationForm } from "./components/forms/ValuationForm";
import { convert } from "./domain/cambio";
import { portfolioSeries } from "./domain/carteira";
import { currentPrice, gauss, prevClose, priceSeries, quoteDate } from "./domain/cotacoes";
import { toCsv } from "./domain/csv";
import { buildSeed, emptyDb } from "./domain/dadosExemplo";
import { TODAY } from "./domain/datas";
import { dailyBook, position, sortTx } from "./domain/posicoes";
import { ThemeCtx, useSystemDark } from "./hooks";
import { session, store } from "./lib/armazenamento";
import { ensureDemoUser } from "./lib/autenticacao";
import { initials, money } from "./lib/formatacao";
import { offerDownload } from "./lib/transferencia";
import { VIEWS, viewFromHash } from "./navegacao";
import { Assets } from "./pages/Ativos";
import { Rates } from "./pages/Cambio";
import { AssetDetail } from "./pages/DetalheAtivo";
import { Auth } from "./pages/Entrada";
import { Import } from "./pages/Importar";
import { Dashboard } from "./pages/Painel";
import { Profile } from "./pages/Perfil";
import { Platforms } from "./pages/Plataformas";
import { Transactions } from "./pages/Transacoes";

export function Workspace({ user, onLogout }) {
  const dataKey = "cu-data-" + user.id,
    prefKey = "cu-prefs-" + user.id;
  const [db, setDbRaw] = useState(() => store.get(dataKey) || emptyDb());
  const setDb = useCallback(
    (fn) =>
      setDbRaw((d) => {
        const n = typeof fn === "function" ? fn(d) : fn;
        store.set(dataKey, n);
        return n;
      }),
    [dataKey]
  );
  const [prefs, setPrefsRaw] = useState(() => ({
    moeda: "AOA",
    tema: "auto",
    live: true,
    falha: false,
    intervalo: 5,
    ...(store.get(prefKey) || {}),
  }));
  const setPrefs = (patch) =>
    setPrefsRaw((p) => {
      const n = { ...p, ...patch };
      store.set(prefKey, n);
      return n;
    });
  const [quotes, setQuotes] = useState({});
  const [quoteState, setQuoteState] = useState({ error: false, lastOk: Date.now() });
  const [view, setView] = useState(viewFromHash);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [palette, setPalette] = useState(false);
  const sysDark = useSystemDark();
  const theme = prefs.tema === "auto" ? (sysDark ? "dark" : "light") : prefs.tema;
  document.documentElement.dataset.theme = theme;
  const dbRef = useRef(db);
  dbRef.current = db;
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;

  const notify = useCallback((msg, undo) => setToast({ msg, undo, id: Date.now() }), []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), toast.undo ? 6000 : 3000);
    return () => clearTimeout(t);
  }, [toast]);
  const go = useCallback((v) => {
    setView(v);
    try {
      if (location.hash.slice(1) !== v) location.hash = v;
    } catch (e) {}
    window.scrollTo(0, 0);
  }, []);
  useEffect(() => {
    const f = () => setView(viewFromHash());
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  useEffect(() => {
    const f = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
      }
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, []);

  /* RF07 + RNF04: cotações automáticas com tolerância a falhas */
  const tick = useCallback((manual) => {
    if (prefsRef.current.falha) {
      setQuoteState((s) => ({ ...s, error: true }));
      if (manual) notify("O serviço de cotações não respondeu. A mostrar os últimos valores conhecidos.");
      return;
    }
    setQuotes((q) => {
      const n = { ...q };
      for (const a of dbRef.current.assets)
        if (a.fonte === "auto") {
          const cur = n[a.id]?.preco ?? a.anchor;
          const p =
            cur * Math.exp((a.vol || 0.015) * 0.16 * gauss(Math.random) - 0.03 * Math.log(cur / a.anchor));
          n[a.id] = { preco: Math.round(p * 100) / 100, ts: Date.now() };
        }
      return n;
    });
    setQuoteState({ error: false, lastOk: Date.now() });
    if (manual) notify("Cotações atualizadas.");
  }, []);
  useEffect(() => {
    if (!prefs.live) return;
    const t = setInterval(() => tick(false), prefs.intervalo * 1000);
    return () => clearInterval(t);
  }, [prefs.live, prefs.intervalo, tick]);
  useEffect(() => {
    if (prefs.falha) setQuoteState((s) => ({ ...s, error: true }));
  }, [prefs.falha]);

  const M = prefs.moeda;
  const books = useMemo(
    () => Object.fromEntries(db.assets.map((a) => [a.id, dailyBook(a, db.transactions, db.rates)])),
    [db.assets, db.transactions, db.rates]
  );
  const ctx = useMemo(() => {
    const rows = db.assets.map((a) => {
      const price = currentPrice(a, quotes);
      const pos = position(a, db.transactions, db.rates, price);
      return {
        a,
        pos,
        price,
        prev: prevClose(a),
        series: priceSeries(a, quotes),
        qdate: quoteDate(a, quotes),
        valueM: convert(db.rates, pos.value, a.moeda, M),
        gainM: convert(db.rates, pos.gain, a.moeda, M),
      };
    });
    const series = portfolioSeries(db.assets, books, db.rates, quotes, M);
    const totals = { value: 0, cost: 0, gain: 0, realized: 0, income: 0 };
    rows.forEach((r) => {
      totals.value += r.valueM;
      totals.gain += r.gainM;
      totals.cost += convert(db.rates, r.pos.cost, r.a.moeda, M);
      totals.realized += convert(db.rates, r.pos.realized, r.a.moeda, M);
      totals.income += convert(db.rates, r.pos.income, r.a.moeda, M);
    });
    const open = rows.filter((r) => r.pos.qty > 0);
    totals.nAssets = open.length;
    totals.nPlat = new Set(open.map((r) => r.a.plataforma)).size;
    return { db, rows, series, totals, M, setM: (m) => setPrefs({ moeda: m }), rates: db.rates, quoteState };
  }, [db, books, quotes, M, quoteState]);

  const act = {
    notify,
    refreshQuotes: () => tick(true),
    openAsset: (a) => setModal({ k: "asset", a }),
    openValuation: (a) => setModal({ k: "val", a }),
    openTx: (tx, preset) =>
      db.assets.length ? setModal({ k: "tx", tx, preset }) : notify("Registe primeiro um ativo."),
    openPlatform: (p) => setModal({ k: "plat", p }),
    deleteTx: (t) => {
      const before = dbRef.current;
      setDb((d) => ({ ...d, transactions: d.transactions.filter((x) => x.id !== t.id) }));
      setModal(null);
      notify("Transação eliminada.", () => setDb(before));
    },
    exportCsv: () =>
      offerDownload(`transacoes-carteira-unica-${TODAY}.csv`, "\uFEFF" + toCsv(dbRef.current), notify),
    importTx: (list) => {
      setDb((d) => ({ ...d, transactions: sortTx([...d.transactions, ...list]) }));
      notify(`${list.length} transações importadas.`);
    },
    saveRate: (r) => {
      setDb((d) => ({
        ...d,
        rates: [...d.rates.filter((x) => !(x.moeda === r.moeda && x.data === r.data)), r],
      }));
      notify(`Taxa ${r.moeda} registada: ${money(r.valor, "AOA")}.`);
    },
    deleteRate: (r) => {
      const before = dbRef.current;
      setDb((d) => ({ ...d, rates: d.rates.filter((x) => x.id !== r.id) }));
      notify("Taxa eliminada.", () => setDb(before));
    },
    changePassword: () => setModal({ k: "pw" }),
    loadSample: () =>
      setModal({
        k: "confirm",
        title: "Carregar carteira de exemplo?",
        text: "Os dados atuais desta conta são substituídos por 14 ativos, 6 plataformas e quase dois anos de transações.",
        action: "Carregar exemplo",
        ok: () => {
          setDb(buildSeed());
          setQuotes({});
          setModal(null);
          notify("Carteira de exemplo carregada.");
          go("painel");
        },
      }),
    wipe: () =>
      setModal({
        k: "confirm",
        danger: true,
        title: "Apagar todos os dados?",
        text: "Plataformas, ativos e transações desta conta são eliminados. As taxas de câmbio de referência mantêm-se. Esta ação não pode ser anulada.",
        action: "Apagar tudo",
        ok: () => {
          setDb(emptyDb());
          setModal(null);
          notify("Dados apagados.");
          go("painel");
        },
      }),
  };

  const close = () => setModal(null);
  let page;
  if (view.startsWith("ativo-"))
    page = <AssetDetail key={view} ctx={ctx} id={view.slice(6)} go={go} act={act} />;
  else
    page = {
      painel: <Dashboard ctx={ctx} go={go} user={user} loadSample={act.loadSample} />,
      ativos: <Assets ctx={ctx} go={go} act={act} />,
      transacoes: <Transactions ctx={ctx} act={act} />,
      importar: <Import ctx={ctx} act={act} />,
      plataformas: <Platforms ctx={ctx} act={act} />,
      cambio: <Rates ctx={ctx} act={act} />,
      perfil: (
        <Profile ctx={ctx} user={user} prefs={prefs} setPrefs={setPrefs} act={act} onLogout={onLogout} />
      ),
    }[view];
  const navActive = view.startsWith("ativo-") ? "ativos" : view;
  const liveCls = quoteState.error ? "live err" : prefs.live ? "live on" : "live";
  const liveTxt = quoteState.error
    ? "Cotações indisponíveis"
    : prefs.live
      ? `Ao vivo · ${new Date(quoteState.lastOk).toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
      : "Cotações em pausa";

  return (
    <ThemeCtx.Provider value={theme}>
      <div className="shell">
        <aside className="side">
          <div className="brand">
            <LogoMark />
            Carteira Única
          </div>
          <nav className="nav" aria-label="Principal">
            <div className="nav-sec">Carteira</div>
            {VIEWS.slice(0, 4).map((v) => (
              <button
                key={v.id}
                aria-current={navActive === v.id ? "page" : undefined}
                onClick={() => go(v.id)}
              >
                <Icon n={v.icon} />
                {v.label}
                {v.id === "ativos" ? (
                  <span className="count">{db.assets.length}</span>
                ) : v.id === "transacoes" ? (
                  <span className="count">{db.transactions.length}</span>
                ) : null}
              </button>
            ))}
            <div className="nav-sec">Configuração</div>
            {VIEWS.slice(4).map((v) => (
              <button
                key={v.id}
                aria-current={navActive === v.id ? "page" : undefined}
                onClick={() => go(v.id)}
              >
                <Icon n={v.icon} />
                {v.label}
              </button>
            ))}
          </nav>
          <div className="side-card">
            <span className="avatar">{initials(user.nome)}</span>
            <div className="who">
              <b>{user.nome}</b>
              <span>{user.email}</span>
            </div>
            <button
              className="icon-btn"
              onClick={onLogout}
              aria-label="Terminar sessão"
              title="Terminar sessão"
            >
              <Icon n="logout" />
            </button>
          </div>
        </aside>
        <div className="content">
          <header className="header">
            <span className="brand mobile-only" style={{ padding: 0, fontSize: "1.05rem" }}>
              <LogoMark />
            </span>
            <button className="search-btn" onClick={() => setPalette(true)} aria-label="Pesquisa rápida">
              <Icon n="search" />
              <span className="label-long">Procurar ativos, páginas ou ações</span>
              <span className="kbd">Ctrl K</span>
            </button>
            <div className="header-right">
              <button
                className={liveCls}
                onClick={() => (quoteState.error ? go("ativos") : setPrefs({ live: !prefs.live }))}
                title={prefs.live ? "Pausar cotações" : "Retomar cotações"}
              >
                <i></i>
                <span className="desk-only">{liveTxt}</span>
              </button>
              <button
                className="icon-btn"
                onClick={() => setPrefs({ tema: theme === "dark" ? "light" : "dark" })}
                aria-label="Alternar tema"
              >
                <Icon n={theme === "dark" ? "sun" : "moon"} />
              </button>
              <button className="icon-btn mobile-only" onClick={() => go("perfil")} aria-label="Perfil">
                <Icon n="user" />
              </button>
            </div>
          </header>
          <main className="main" key={view}>
            {page}
          </main>
        </div>
        {modal?.k === "asset" && (
          <AssetForm
            db={db}
            asset={modal.a}
            onClose={close}
            onSave={(a) => {
              const isNew = !db.assets.some((x) => x.id === a.id);
              setDb((d) => ({
                ...d,
                assets: isNew ? [...d.assets, a] : d.assets.map((x) => (x.id === a.id ? a : x)),
              }));
              close();
              notify(isNew ? `${a.nome} registado.` : "Alterações guardadas.");
              if (isNew) go("ativo-" + a.id);
            }}
            onDelete={(a) => {
              setDb((d) => ({ ...d, assets: d.assets.filter((x) => x.id !== a.id) }));
              close();
              notify(`${a.nome} eliminado.`);
              go("ativos");
            }}
          />
        )}
        {modal?.k === "val" && (
          <ValuationForm
            asset={modal.a}
            onClose={close}
            onSave={(preco, data) => {
              setDb((d) => ({
                ...d,
                assets: d.assets.map((x) =>
                  x.id === modal.a.id
                    ? {
                        ...x,
                        avaliacoes: [...(x.avaliacoes || []).filter((v) => v.data !== data), { data, preco }],
                      }
                    : x
                ),
              }));
              close();
              notify(`Valor de ${modal.a.nome} atualizado.`);
            }}
          />
        )}
        {modal?.k === "tx" && (
          <TxForm
            db={db}
            tx={modal.tx}
            presetAsset={modal.preset}
            onClose={close}
            onSave={(t, editing) => {
              setDb((d) => ({
                ...d,
                transactions: editing
                  ? d.transactions.map((x) => (x.id === t.id ? t : x))
                  : [...d.transactions, t],
              }));
              close();
              notify(editing ? "Transação atualizada." : "Transação registada.");
            }}
            onDelete={(t) => act.deleteTx(t)}
          />
        )}
        {modal?.k === "plat" && (
          <PlatformForm
            db={db}
            platform={modal.p}
            onClose={close}
            onSave={(p) => {
              const isNew = !db.platforms.some((x) => x.id === p.id);
              setDb((d) => ({
                ...d,
                platforms: isNew ? [...d.platforms, p] : d.platforms.map((x) => (x.id === p.id ? p : x)),
              }));
              close();
              notify(isNew ? `${p.nome} registada.` : "Alterações guardadas.");
            }}
            onDelete={(p) => {
              setDb((d) => ({ ...d, platforms: d.platforms.filter((x) => x.id !== p.id) }));
              close();
              notify(`${p.nome} eliminada.`);
            }}
          />
        )}
        {modal?.k === "pw" && (
          <PasswordForm
            user={user}
            onClose={close}
            onDone={() => {
              close();
              notify("Palavra-passe alterada.");
            }}
          />
        )}
        {modal?.k === "confirm" && <Confirm {...modal} onClose={close} onOk={modal.ok} />}
        {palette && <Palette db={db} go={go} act={act} onClose={() => setPalette(false)} />}
        {toast && (
          <div className="toast" role="status" key={toast.id}>
            <span>{toast.msg}</span>
            {toast.undo && (
              <button
                onClick={() => {
                  toast.undo();
                  setToast(null);
                }}
              >
                Anular
              </button>
            )}
          </div>
        )}
      </div>
    </ThemeCtx.Provider>
  );
}

export function App() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  useEffect(() => {
    ensureDemoUser().then(() => {
      const s = session.get();
      if (s) {
        const u = Object.values(store.get("cu-users") || {}).find((x) => x.id === s);
        if (u) setUser(u);
      }
      setReady(true);
    });
  }, []);
  if (!ready)
    return (
      <div style={{ display: "grid", placeItems: "center", height: "100%", color: "var(--muted)" }}>
        A carregar…
      </div>
    );
  if (!user)
    return (
      <Auth
        onLogin={(u) => {
          session.set(u.id);
          setUser(u);
          try {
            if (!location.hash) location.hash = "painel";
          } catch (e) {}
        }}
      />
    );
  return (
    <Workspace
      key={user.id}
      user={user}
      onLogout={() => {
        session.set(null);
        setUser(null);
      }}
    />
  );
}
