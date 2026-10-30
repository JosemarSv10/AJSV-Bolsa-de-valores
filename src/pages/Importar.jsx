import { useState, useRef } from "react";
import { Icon } from "../components/Icon";
import { TX_TYPES } from "../domain/constantes";
import { CSV_COLS, importCsv } from "../domain/csv";
import { TODAY, addDays } from "../domain/datas";
import { fmtDate, money, num } from "../lib/formatacao";
import { offerDownload } from "../lib/transferencia";

export const SAMPLE_CSV = `data;ativo;tipo;quantidade;preco_unitario;moeda
${addDays(TODAY, -40)};AAPL;compra;3;226,40;USD
${addDays(TODAY, -33)};BTC;compra;0,02;98500;USD
${addDays(TODAY, -29)};OTNR28;juro;1;412500;AOA
${addDays(TODAY, -25)};ETH;venda;50;3800;USD
2026-13-01;MSFT;compra;2;400;USD
${addDays(TODAY, -20)};TSLA;compra;4;250;USD
${addDays(TODAY, -18)};KSG;comprar;10;26000;AOA
${addDays(TODAY, -15)};MSFT;compra;-2;400;USD
${addDays(TODAY, -12)};VOO;dividendo;1;39,16;USD
${addDays(TODAY, -9)};ASML;compra;1;880;EUR`;

export function Import({ ctx, act }) {
  const { db } = ctx;
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [over, setOver] = useState(false);
  const [report, setReport] = useState(null);
  const [done, setDone] = useState(0);
  const step = done ? 3 : report ? 2 : 1;
  const inputRef = useRef(null);
  function load(file) {
    if (!file) return;
    if (!/\.csv$|text\/csv|text\/plain/i.test(file.name + " " + file.type))
      return act.notify("Escolha um ficheiro .csv.");
    if (file.size > 2 * 1024 * 1024) return act.notify("O ficheiro tem mais de 2 MB.");
    const r = new FileReader();
    r.onload = () => {
      setText(String(r.result));
      setFileName(file.name);
      setReport(null);
      setDone(0);
    };
    r.readAsText(file, "utf-8");
  }
  function validate() {
    setReport(importCsv(text, db));
    setDone(0);
  }
  function confirm() {
    act.importTx(report.accepted.map((a) => a.tx));
    setDone(report.accepted.length);
  }
  const total = report ? report.accepted.length + report.rejected.length : 0;
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Importar transações</h1>
          <p>
            Carregue um CSV exportado da sua corretora (no formato abaixo). Primeiro validamos cada linha; só
            depois confirma a importação.
          </p>
        </div>
        <button
          className="btn"
          onClick={() => offerDownload("modelo-carteira-unica.csv", SAMPLE_CSV, act.notify)}
        >
          <Icon n="down" />
          Descarregar modelo
        </button>
      </div>
      <div className="steps" style={{ marginBottom: "16px" }}>
        <span className={"st" + (step >= 1 ? " on" : "")}>
          <b>1</b>Carregar
        </span>
        <span className="sep"></span>
        <span className={"st" + (step >= 2 ? " on" : "")}>
          <b>2</b>Validar
        </span>
        <span className="sep"></span>
        <span className={"st" + (step >= 3 ? " on" : "")}>
          <b>3</b>Importar
        </span>
      </div>
      <div className="grid g-main">
        <div className="card">
          <div
            className={"dropzone" + (over ? " over" : "")}
            onClick={() => inputRef.current.click()}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current.click()}
            tabIndex="0"
            role="button"
            aria-label="Escolher ficheiro CSV"
            onDragOver={(e) => {
              e.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(false);
              load(e.dataTransfer.files[0]);
            }}
          >
            <Icon n="import" />
            <div style={{ fontWeight: 700, marginTop: "6px" }}>
              {fileName ? fileName : "Arraste o ficheiro CSV para aqui"}
            </div>
            <div className="small muted">
              {fileName ? "Clique para escolher outro" : "ou clique para escolher · até 2 MB"}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              style={{ display: "none" }}
              onChange={(e) => {
                load(e.target.files[0]);
                e.target.value = "";
              }}
            />
          </div>
          <div className="row between" style={{ margin: "14px 0 8px" }}>
            <span className="small muted">Ou cole o conteúdo:</span>
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => {
                setText(SAMPLE_CSV);
                setFileName("exemplo-com-erros.csv");
                setReport(null);
                setDone(0);
              }}
            >
              Usar exemplo com erros
            </button>
          </div>
          <textarea
            rows="9"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setReport(null);
              setDone(0);
            }}
            placeholder={CSV_COLS.join(";")}
            aria-label="Conteúdo CSV"
          ></textarea>
          <div className="row" style={{ marginTop: "12px" }}>
            <button className="btn btn-primary" disabled={!text.trim()} onClick={validate}>
              <Icon n="check" />
              Validar ficheiro
            </button>
          </div>
        </div>
        <div className="card">
          <h2>Formato aceite</h2>
          <p className="small muted">
            Primeira linha com o cabeçalho, separador ponto e vírgula (ou vírgula), codificação UTF-8.
          </p>
          <code
            className="inline"
            style={{ display: "block", padding: "10px", overflowX: "auto", whiteSpace: "nowrap" }}
          >
            {CSV_COLS.join(";")}
          </code>
          <div className="list small" style={{ marginTop: "10px" }}>
            {[
              ["data", "AAAA-MM-DD, não futura"],
              ["ativo", "Código de um ativo já registado"],
              ["tipo", "compra, venda, dividendo, juro ou taxa"],
              ["quantidade", "Maior que zero; decimais com vírgula ou ponto"],
              ["preco_unitario", "Zero ou mais"],
              ["moeda", "AOA, USD ou EUR"],
            ].map(([c, d]) => (
              <div className="list-item" key={c} style={{ padding: "7px 0" }}>
                <code className="inline">{c}</code>
                <span className="muted">{d}</span>
              </div>
            ))}
          </div>
          <p className="small muted" style={{ marginBottom: 0 }}>
            Rejeitamos também vendas acima da quantidade detida e linhas duplicadas.
          </p>
        </div>
      </div>
      {report && (
        <section className="card mt" aria-live="polite">
          <div className="card-head">
            <div>
              <h2>Relatório de validação</h2>
              <p>{total} linhas analisadas</p>
            </div>
            <div className="row">
              <span className="pill gain">✓ {report.accepted.length} aceites</span>
              <span className="pill loss">✕ {report.rejected.length} rejeitadas</span>
            </div>
          </div>
          {total ? (
            <div className="report-bar">
              <span
                style={{ width: (report.accepted.length / total) * 100 + "%", background: "var(--gain)" }}
              ></span>
              <span
                style={{ width: (report.rejected.length / total) * 100 + "%", background: "var(--loss)" }}
              ></span>
            </div>
          ) : null}
          {report.rejected.length ? (
            <>
              <h3 style={{ margin: "14px 0 8px" }}>Linhas rejeitadas</h3>
              <div className="table-wrap" style={{ boxShadow: "none" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Linha</th>
                      <th>Conteúdo</th>
                      <th>Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.rejected.map((r) => (
                      <tr key={r.linha}>
                        <td>{r.linha}</td>
                        <td>
                          <code className="inline">{r.texto}</code>
                        </td>
                        <td className="loss small" style={{ whiteSpace: "normal", minWidth: "220px" }}>
                          {r.motivo}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
          {report.accepted.length ? (
            <>
              <h3 style={{ margin: "16px 0 8px" }}>Linhas aceites</h3>
              <div className="table-wrap" style={{ boxShadow: "none" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Linha</th>
                      <th>Data</th>
                      <th>Ativo</th>
                      <th>Tipo</th>
                      <th className="num">Quantidade</th>
                      <th className="num">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.accepted.map((a) => (
                      <tr key={a.linha}>
                        <td>{a.linha}</td>
                        <td>{fmtDate(a.tx.data)}</td>
                        <td>{a.asset.nome}</td>
                        <td>
                          <span className={"pill t-" + a.tx.tipo}>{TX_TYPES[a.tx.tipo]}</span>
                        </td>
                        <td className="num">{num(a.tx.quantidade, 6)}</td>
                        <td className="num">{money(a.tx.quantidade * a.tx.preco, a.tx.moeda)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
          <div className="modal-foot">
            {done ? (
              <span className="pill gain" style={{ padding: "8px 14px", fontSize: ".88rem" }}>
                ✓ {done} transações importadas
              </span>
            ) : (
              <button className="btn btn-primary" disabled={!report.accepted.length} onClick={confirm}>
                Importar {report.accepted.length}{" "}
                {report.accepted.length === 1 ? "linha aceite" : "linhas aceites"}
              </button>
            )}
          </div>
        </section>
      )}
    </>
  );
}
