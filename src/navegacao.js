export const VIEWS = [
  { id: "painel", label: "Painel", icon: "dash" },
  { id: "ativos", label: "Ativos", icon: "assets" },
  { id: "transacoes", label: "Transações", icon: "tx" },
  { id: "importar", label: "Importar", icon: "import" },
  { id: "plataformas", label: "Plataformas", icon: "plat" },
  { id: "cambio", label: "Câmbio", icon: "fx" },
  { id: "perfil", label: "Perfil", icon: "user" },
];

export function viewFromHash() {
  let h = "";
  try {
    h = decodeURIComponent(location.hash.slice(1));
  } catch (e) {}
  return VIEWS.some((v) => v.id === h) || /^ativo-[\w-]+$/.test(h) ? h : "painel";
}
