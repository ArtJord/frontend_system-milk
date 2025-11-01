export const isYmd = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ""));

export function formatDateBR(s) {
  if (!s) return "—";
  if (isYmd(s)) {
    const [y, m, d] = String(s).split("-");
    return `${d}/${m}/${y}`;
  }
  try {
   
    return new Date(s).toLocaleDateString("pt-BR", { timeZone: "UTC" });
  } catch {
    return String(s);
  }
}