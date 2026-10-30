import { useState, useEffect, useRef } from "react";
import { Icon } from "./Icon";
import { logoColor, tone } from "../lib/formatacao";

export function Modal({ title, sub, onClose, children, width }) {
  const box = useRef(null);
  useEffect(() => {
    const f = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", f);
    const el = box.current?.querySelector("input,select,textarea,button:not(.close)");
    el && el.focus();
    return () => window.removeEventListener("keydown", f);
  }, []);
  return (
    <div className="backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="modal"
        ref={box}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={width ? { width: `min(${width}px,100%)` } : null}
      >
        <div className="modal-head">
          <div>
            <h2>{title}</h2>
            {sub && <p>{sub}</p>}
          </div>
          <button className="icon-btn close" onClick={onClose} aria-label="Fechar">
            <Icon n="x" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Tabs({ value, options, onChange, label }) {
  return (
    <div className="tabs" role="group" aria-label={label}>
      {options.map((o) => {
        const [v, l] = Array.isArray(o) ? o : [o, o];
        return (
          <button key={v} aria-pressed={value === v} onClick={() => onChange(v)}>
            {l}
          </button>
        );
      })}
    </div>
  );
}

export function Pill({ v, children }) {
  return (
    <span className={"pill " + tone(v)}>
      {v > 1e-9 ? "▲" : v < -1e-9 ? "▼" : "•"} {children}
    </span>
  );
}

export function Switch({ checked, onChange, label }) {
  return (
    <span className="switch">
      <input
        type="checkbox"
        role="switch"
        aria-label={label}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span></span>
    </span>
  );
}

export function AssetLogo({ a, size = 34 }) {
  const t = a.codigo.replace(/[^A-Z0-9]/gi, "").slice(0, a.codigo.length > 4 ? 3 : 4);
  return (
    <span className="a-logo" style={{ background: logoColor(a), width: size, height: size }}>
      {t}
    </span>
  );
}

export function FlashNum({ value, children, dir }) {
  const prev = useRef(value);
  const [cls, setCls] = useState("");
  const [k, setK] = useState(0);
  useEffect(() => {
    if (prev.current !== value) {
      const d = dir ?? (value > prev.current ? 1 : -1);
      setCls(d >= 0 ? "flash-up" : "flash-down");
      setK((x) => x + 1);
      prev.current = value;
    }
  }, [value]);
  return (
    <span key={k} className={cls}>
      {children}
    </span>
  );
}

export function Empty({ title, text, action, onAction }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      <p style={{ margin: 0 }}>{text}</p>
      {action && (
        <button className="btn btn-primary" onClick={onAction}>
          <Icon n="plus" />
          {action}
        </button>
      )}
    </div>
  );
}
