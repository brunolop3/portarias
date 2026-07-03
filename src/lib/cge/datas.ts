// ===========================================================================
// Helpers de data e formatação de textos institucionais.
// ===========================================================================

const MESES_PT = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

// Converte uma data ISO (yyyy-mm-dd) para "dd de mês de aaaa".
// Aceita também strings de data com horário (ISO completo) e Date.
export function dataPorExtenso(input: string | Date | undefined | null): string {
  if (!input) return "";
  const d = typeof input === "string" ? new Date(input) : input;
  if (isNaN(d.getTime())) return "";
  // Ajuste de fuso para não cair no dia anterior ao formatar.
  const dia = d.getUTCDate();
  const mes = d.getUTCMonth();
  const ano = d.getUTCFullYear();
  return `${dia} de ${MESES_PT[mes]} de ${ano}`;
}

// Converte ISO (yyyy-mm-dd) para "dd/mm/aaaa".
export function dataCurta(input: string | Date | undefined | null): string {
  if (!input) return "";
  const d = typeof input === "string" ? new Date(input) : input;
  if (isNaN(d.getTime())) return "";
  const dia = String(d.getUTCDate()).padStart(2, "0");
  const mes = String(d.getUTCMonth() + 1).padStart(2, "0");
  const ano = d.getUTCFullYear();
  return `${dia}/${mes}/${ano}`;
}

// Normaliza qualquer entrada para yyyy-mm-dd (para inputs <input type="date">).
export function paraIsoDate(input: string | Date | undefined | null): string {
  if (!input) return "";
  const d = typeof input === "string" ? new Date(input) : input;
  if (isNaN(d.getTime())) return "";
  const dia = String(d.getUTCDate()).padStart(2, "0");
  const mes = String(d.getUTCMonth() + 1).padStart(2, "0");
  const ano = d.getUTCFullYear();
  return `${ano}-${mes}-${dia}`;
}

// Soma 2 anos a uma data (cálculo do término de mandato).
export function terminoMandato(dataConstituicao: string): string {
  const d = new Date(dataConstituicao);
  if (isNaN(d.getTime())) return "";
  d.setUTCFullYear(d.getUTCFullYear() + 2);
  return paraIsoDate(d);
}

// Calcula dias restantes para o término do mandato (negativo se vencido).
export function diasParaTermino(dataConstituicao: string): number {
  const fim = terminoMandato(dataConstituicao);
  if (!fim) return Infinity;
  const hoje = new Date();
  hoje.setUTCHours(0, 0, 0, 0);
  const f = new Date(fim);
  f.setUTCHours(0, 0, 0, 0);
  return Math.round((f.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

// Status derivado do mandato (para a lista de cursos).
export type SituacaoMandato = "ativo" | "vencendo" | "vencido" | "encerrado" | "sem_comite";

export function situacaoDoComite(status: string, dataConstituicao: string): SituacaoMandato {
  if (status === "encerrado") return "encerrado";
  const dias = diasParaTermino(dataConstituicao);
  if (dias < 0) return "vencido";
  if (dias <= 60) return "vencendo";
  return "ativo";
}
