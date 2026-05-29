export function formatarReal(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatarData(iso: string | null): string {
  if (!iso) return "—";
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

export function hojeISO(): string {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 10);
}

export function mesAtualISO(): string {
  return hojeISO().slice(0, 7);
}

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function formatarMes(mesISO: string): string {
  const [ano, mes] = mesISO.split("-");
  return `${MESES[parseInt(mes, 10) - 1]} ${ano}`;
}

export function navegarMes(mesISO: string, delta: number): string {
  const [a, m] = mesISO.split("-").map((v) => parseInt(v, 10));
  const d = new Date(a, m - 1 + delta, 1);
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  return `${ano}-${mes}`;
}
