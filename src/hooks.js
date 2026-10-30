import { useState, useEffect, useRef, createContext } from "react";

export const ThemeCtx = createContext("light");

export function useAnimatedNumber(target, dur = 650) {
  const [v, setV] = useState(target);
  const cur = useRef(target);
  useEffect(() => {
    const a = cur.current,
      b = target;
    if (
      !isFinite(a) ||
      Math.abs(a - b) < 1e-9 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      cur.current = b;
      setV(b);
      return;
    }
    let raf;
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      const x = a + (b - a) * e;
      cur.current = x;
      setV(x);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return v;
}

export function useSystemDark() {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const [d, setD] = useState(mq.matches);
  useEffect(() => {
    const f = (e) => setD(e.matches);
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, []);
  return d;
}
