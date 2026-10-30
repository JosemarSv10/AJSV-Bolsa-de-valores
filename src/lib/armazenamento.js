export const MEM = {};

export const store = {
  get(k) {
    try {
      const v = localStorage.getItem(k);
      if (v != null) return JSON.parse(v);
    } catch (e) {}
    return MEM[k] ?? null;
  },
  set(k, v) {
    MEM[k] = v;
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch (e) {}
  },
  del(k) {
    delete MEM[k];
    try {
      localStorage.removeItem(k);
    } catch (e) {}
  },
};

export const session = {
  get() {
    try {
      return sessionStorage.getItem("cu-session");
    } catch (e) {
      return MEM.__s || null;
    }
  },
  set(v) {
    MEM.__s = v;
    try {
      v ? sessionStorage.setItem("cu-session", v) : sessionStorage.removeItem("cu-session");
    } catch (e) {}
  },
};
