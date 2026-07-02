// ===========================================================================
// Validação de quórum do Comitê de Gestão do Enade.
//
// Regra (Art. 4º do Regulamento dos Comitês — Deliberação CE/CEPE-UEMS Nº
// 432/2026, na redação da Resolução CEPE-UEMS Nº 3.137/2026):
//   - Total de membros entre 3 e 5 (inclusive), contando o coordenador nato.
//   - Exatamente 1 Presidente.
//   - Exatamente 1 Coordenador(a) do Curso - Membro Nato.
//   - Os demais são "Membro".
// ===========================================================================

import type { Membro } from "./types";

export const MIN_MEMBROS = 3;
export const MAX_MEMBROS = 5;

export interface ResultadoQuorum {
  valido: boolean;
  total: number;
  presidentes: number;
  coordenadores: number;
  membrosSimples: number;
  erros: string[];
}

export function validarQuorum(membros: Membro[]): ResultadoQuorum {
  const total = membros.length;
  const presidentes = membros.filter((m) => m.funcao === "Presidente").length;
  const coordenadores = membros.filter(
    (m) => m.funcao === "Coordenador(a) do Curso - Membro Nato"
  ).length;
  const membrosSimples = membros.filter((m) => m.funcao === "Membro").length;

  const erros: string[] = [];

  if (total < MIN_MEMBROS) {
    erros.push(
      `O comitê deve ter no mínimo ${MIN_MEMBROS} membros (incluindo o coordenador, membro nato). Atual: ${total}.`
    );
  }
  if (total > MAX_MEMBROS) {
    erros.push(
      `O comitê deve ter no máximo ${MAX_MEMBROS} membros. Atual: ${total}.`
    );
  }
  if (presidentes !== 1) {
    erros.push(
      `Deve haver exatamente 1 Presidente (eleito entre os pares). Atual: ${presidentes}.`
    );
  }
  if (coordenadores !== 1) {
    erros.push(
      `Deve haver exatamente 1 Coordenador(a) do Curso - Membro Nato. Atual: ${coordenadores}.`
    );
  }

  // Consistência: a soma das funções deve bater com o total.
  if (presidentes + coordenadores + membrosSimples !== total) {
    erros.push("A composição do comitê está inconsistente.");
  }

  // Nomes não podem estar vazios.
  const nomesVazios = membros.filter((m) => !m.nome || !m.nome.trim()).length;
  if (nomesVazios > 0) {
    erros.push(`Há ${nomesVazios} membro(s) sem nome preenchido.`);
  }

  return {
    valido: erros.length === 0,
    total,
    presidentes,
    coordenadores,
    membrosSimples,
    erros,
  };
}

// Ordena os membros para a tabela da minuta:
//   1. Presidente
//   2. Coordenador(a) do Curso - Membro Nato
//   3. Demais Membros (em ordem alfabética)
export function ordenarMembrosParaTabela(membros: Membro[]): Membro[] {
  const rank: Record<string, number> = {
    Presidente: 0,
    "Coordenador(a) do Curso - Membro Nato": 1,
    Membro: 2,
  };
  return [...membros].sort((a, b) => {
    const ra = rank[a.funcao] ?? 99;
    const rb = rank[b.funcao] ?? 99;
    if (ra !== rb) return ra - rb;
    return a.nome.localeCompare(b.nome, "pt-BR");
  });
}
