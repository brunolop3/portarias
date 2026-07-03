// ===========================================================================
// Conversores entre o modelo Prisma e os tipos da aplicação.
// ===========================================================================

import type { Comite as ComitePrisma, Membro as MembroPrisma, Portaria as PortariaPrisma } from "@prisma/client";
import type { Comite, Membro, PortariaGerada } from "./types";
import { paraIsoDate } from "./datas";

export function membroPrismaParaTipo(m: MembroPrisma): Membro {
  return {
    id: m.id,
    nome: m.nome,
    funcao: m.funcao as Membro["funcao"],
  };
}

export function comitePrismaParaTipo(
  c: ComitePrisma & { membros?: MembroPrisma[] }
): Comite {
  return {
    id: c.id,
    curso: c.curso,
    grau: c.grau as Comite["grau"],
    unidadeUniversitaria: c.unidadeUniversitaria,
    portariaConstituicaoNumero: c.portariaConstituicaoNumero,
    portariaConstituicaoData: paraIsoDate(c.portariaConstituicaoData),
    status: c.status as Comite["status"],
    membros: (c.membros ?? []).map(membroPrismaParaTipo),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

export function portariaPrismaParaTipo(p: PortariaPrisma): PortariaGerada {
  let composicao: Membro[] = [];
  try {
    composicao = JSON.parse(p.composicaoJson);
  } catch {
    composicao = [];
  }
  return {
    id: p.id,
    tipo: p.tipo as PortariaGerada["tipo"],
    numeroPortaria: p.numeroPortaria,
    dataPortaria: paraIsoDate(p.dataPortaria),
    ciNumero: p.ciNumero,
    ciArquivoNome: p.ciArquivoNome,
    comiteId: p.comiteId,
    textoGerado: p.textoGerado,
    composicao,
    criadoEm: p.criadoEm.toISOString(),
  };
}
