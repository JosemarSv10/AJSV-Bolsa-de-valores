import { buildSeed } from "../domain/dadosExemplo";
import { store } from "./armazenamento";
import { uid } from "./formatacao";

export async function hashPw(pw, salt) {
  const data = new TextEncoder().encode(salt + ":" + pw);
  try {
    const buf = await crypto.subtle.digest("SHA-256", data);
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch (e) {
    let h = 2166136261;
    for (const b of data) {
      h ^= b;
      h = Math.imul(h, 16777619);
    }
    return "f" + (h >>> 0).toString(16);
  }
}

export const DEMO_EMAIL = "investidor@demo.ao",
  DEMO_PASS = "Demo#2026";

export async function ensureDemoUser() {
  const users = store.get("cu-users") || {};
  if (!users[DEMO_EMAIL]) {
    const salt = uid("s");
    users[DEMO_EMAIL] = {
      id: "u_demo",
      nome: "Ana Domingos",
      email: DEMO_EMAIL,
      salt,
      hash: await hashPw(DEMO_PASS, salt),
      criado: "2024-11-01",
      falhas: 0,
      bloqueadoAte: 0,
    };
    store.set("cu-users", users);
  }
  if (!store.get("cu-data-u_demo")) store.set("cu-data-u_demo", buildSeed());
}

export function pwStrength(p) {
  let s = 0;
  if (p.length >= 8) s++;
  if (p.length >= 12) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) s++;
  return s;
}
