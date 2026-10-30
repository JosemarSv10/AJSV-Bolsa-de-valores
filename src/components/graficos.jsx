import { useEffect, useRef, useContext } from "react";
import Chart from "chart.js/auto";
import { N } from "../domain/datas";

import { ThemeCtx } from "../hooks";
import { cssVar } from "../lib/formatacao";

export function ChartBox({ type, build, deps, height = 260, label }) {
  const ref = useRef(null),
    ch = useRef(null);
  const theme = useContext(ThemeCtx);
  useEffect(() => {
    Chart.defaults.color = cssVar("--muted");
    Chart.defaults.borderColor = cssVar("--line");
    Chart.defaults.font.family = '"Manrope", system-ui, sans-serif';
    Chart.defaults.font.size = 11.5;
    ch.current = new Chart(ref.current, build());
    return () => {
      ch.current && ch.current.destroy();
      ch.current = null;
    };
  }, [theme, type]);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!ch.current) return;
    const c = build();
    ch.current.data = c.data;
    ch.current.options = c.options;
    ch.current.update("none");
  }, deps);
  return (
    <div style={{ position: "relative", height: typeof height === "number" ? height + "px" : height }}>
      <canvas ref={ref} role="img" aria-label={label}></canvas>
    </div>
  );
}

export const tooltipBase = () => ({
  backgroundColor: cssVar("--ink"),
  titleColor: cssVar("--bg"),
  bodyColor: cssVar("--bg"),
  padding: 10,
  cornerRadius: 10,
  displayColors: false,
  titleFont: { weight: "700" },
});

export function Spark({ data, w = 96, h = 30 }) {
  if (!data || data.length < 2) return null;
  let mn = Infinity,
    mx = -Infinity;
  for (const v of data) {
    if (v < mn) mn = v;
    if (v > mx) mx = v;
  }
  const rng = mx - mn || 1;
  const pts = data
    .map(
      (v, i) =>
        `${((i / (data.length - 1)) * w).toFixed(1)},${(h - 3 - ((v - mn) / rng) * (h - 6)).toFixed(1)}`
    )
    .join(" ");
  const col = data[data.length - 1] >= data[0] ? "var(--gain)" : "var(--loss)";
  return (
    <svg className="spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={col}
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function rangeIdx(r) {
  const days = { "1M": 30, "3M": 91, "6M": 182, "1A": 365, Tudo: N }[r] || N;
  return Math.max(0, N - 1 - days);
}

export function sampleIdx(from, to, max = 160) {
  const step = Math.max(1, Math.ceil((to - from + 1) / max));
  const out = [];
  for (let i = from; i <= to; i += step) out.push(i);
  if (out[out.length - 1] !== to) out.push(to);
  return out;
}
