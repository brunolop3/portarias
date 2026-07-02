// GET /api/cge/stats
// Retorna métricas agregadas para o dashboard da Tela Início:
//   - totais de comitês por situação (ativo, vencendo, vencido, encerrado)
//   - total de portarias geradas (constituições + alterações)
//   - distribuição por unidade universitária
//   - distribuição por grau
//   - próximos comitês a vencer (mandato terminando em <= 90 dias)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { situacaoDoComite, diasParaTermino, paraIsoDate, dataCurta } from "@/lib/cge/datas";

export async function GET() {
  try {
    const comites = await db.comite.findMany({
      include: {
        membros: true,
        portarias: { select: { composicaoJson: true } },
        _count: { select: { portarias: true } },
      },
    });
    const totalPortarias = await db.portaria.count();
    const totalConstituicoes = await db.portaria.count({ where: { tipo: "Constituição" } });
    const totalAlteracoes = await db.portaria.count({ where: { tipo: "Alteração" } });

    // Contagem por situação
    const porSituacao: Record<string, number> = {
      ativo: 0,
      vencendo: 0,
      vencido: 0,
      encerrado: 0,
    };
    // Distribuição por unidade
    const porUnidade: Record<string, number> = {};
    // Distribuição por grau
    const porGrau: Record<string, number> = {};
    // Próximos a vencer (<= 90 dias, > 0)
    const proximosVencer: Array<{
      id: string;
      curso: string;
      unidade: string;
      termino: string;
      dias: number;
    }> = [];

    for (const c of comites) {
      const sit = situacaoDoComite(c.status, c.portariaConstituicaoData);
      porSituacao[sit] = (porSituacao[sit] || 0) + 1;

      porUnidade[c.unidadeUniversitaria] = (porUnidade[c.unidadeUniversitaria] || 0) + 1;
      porGrau[c.grau] = (porGrau[c.grau] || 0) + 1;

      if (c.status === "ativo") {
        const dias = diasParaTermino(c.portariaConstituicaoData);
        if (dias > 0 && dias <= 90) {
          const termino = new Date(c.portariaConstituicaoData);
          termino.setUTCFullYear(termino.getUTCFullYear() + 2);
          proximosVencer.push({
            id: c.id,
            curso: c.curso,
            unidade: c.unidadeUniversitaria,
            termino: paraIsoDate(termino),
            dias,
          });
        }
      }
    }

    proximosVencer.sort((a, b) => a.dias - b.dias);

    // Total de membros cadastrados (snapshot atual de cada comitê ativo)
    const totalMembros = comites
      .filter((c) => c.status === "ativo")
      .reduce((acc, c) => acc + c.membros.length, 0);

    return NextResponse.json({
      totalComites: comites.length,
      porSituacao,
      totalPortarias,
      totalConstituicoes,
      totalAlteracoes,
      totalMembros,
      porUnidade: Object.entries(porUnidade)
        .map(([unidade, total]) => ({ unidade, total }))
        .sort((a, b) => b.total - a.total),
      porGrau: Object.entries(porGrau).map(([grau, total]) => ({ grau, total })),
      proximosVencer: proximosVencer.slice(0, 5),
      // Evolução temporal: portarias por mês (últimos 12 meses a partir do
      // mês da portaria mais antiga, ou dos últimos 12 meses corridos).
      evolucaoMensal: await calcularEvolucaoMensal(),
      // Rotatividade de membros: quantas vezes cada nome apareceu em
      // composições distintas (snapshot de cada portaria).
      rotatividadeMembros: calcularRotatividade(comites),
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Erro ao calcular estatísticas: " + (e as Error).message },
      { status: 500 }
    );
  }
}

// Calcula portarias geradas por mês (agrupadas por tipo), dos últimos 12
// meses (incluindo o mês atual). Retorna array ordenado cronologicamente.
async function calcularEvolucaoMensal() {
  const portarias = await db.portaria.findMany({
    select: { tipo: true, dataPortaria: true },
  });
  const agora = new Date();
  const meses: { chave: string; label: string; constituicoes: number; alteracoes: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(agora.getUTCFullYear(), agora.getUTCMonth() - i, 1);
    const chave = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    meses.push({ chave, label, constituicoes: 0, alteracoes: 0 });
  }
  const mapa = new Map(meses.map((m) => [m.chave, m]));
  for (const p of portarias) {
    const d = new Date(p.dataPortaria);
    const chave = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const m = mapa.get(chave);
    if (!m) continue;
    if (p.tipo === "Constituição") m.constituicoes++;
    else m.alteracoes++;
  }
  return meses;
}

// Calcula rotatividade de membros: para cada nome que já apareceu em qualquer
// composição (snapshot das portarias), conta em quantas versões distintas
// participou. Membros que apareceram só 1 vez são "novos/únicos"; os que
// apareceram em várias versões indicam continuidade.
function calcularRotatividade(
  comites: Array<{
    id: string;
    curso: string;
    unidadeUniversitaria: string;
    membros: Array<{ nome: string; funcao: string }>;
    portarias: Array<{ composicaoJson: string }>;
  }>
) {
  // Mapa: nome normalizado → { totalComites, totalVersoes, cursos: Set }
  const mapa = new Map<
    string,
    { nome: string; totalVersoes: number; cursos: Set<string>; funcoes: Set<string> }
  >();

  for (const c of comites) {
    // Snapshot atual (membros atuais).
    for (const m of c.membros) {
      const key = m.nome.trim().toUpperCase();
      if (!key) continue;
      if (!mapa.has(key)) {
        mapa.set(key, { nome: m.nome.trim(), totalVersoes: 0, cursos: new Set(), funcoes: new Set() });
      }
      const entry = mapa.get(key)!;
      entry.cursos.add(c.curso);
      entry.funcoes.add(m.funcao);
    }
    // Snapshots históricos (de cada portaria).
    for (const p of c.portarias) {
      try {
        const comp = JSON.parse(p.composicaoJson) as Array<{ nome: string; funcao: string }>;
        for (const m of comp) {
          const key = m.nome.trim().toUpperCase();
          if (!key) continue;
          if (!mapa.has(key)) {
            mapa.set(key, { nome: m.nome.trim(), totalVersoes: 0, cursos: new Set(), funcoes: new Set() });
          }
          const entry = mapa.get(key)!;
          entry.totalVersoes++;
          entry.cursos.add(c.curso);
          entry.funcoes.add(m.funcao);
        }
      } catch {
        // ignore parse errors
      }
    }
  }

  // Converte para array e ordena por totalVersoes (mais recorrentes primeiro).
  const lista = Array.from(mapa.values()).map((e) => ({
    nome: e.nome,
    totalVersoes: e.totalVersoes,
    totalCursos: e.cursos.size,
    cursos: Array.from(e.cursos),
    funcoes: Array.from(e.funcoes),
  }));
  lista.sort((a, b) => b.totalVersoes - a.totalVersoes);

  return {
    totalPessoasDistintas: lista.length,
    // Top 5 mais recorrentes (participaram de mais versões).
    maisRecorrentes: lista.slice(0, 5),
    // Membros que apareceram em apenas 1 versão (novos ou substituídos).
    unicos: lista.filter((m) => m.totalVersoes === 1).length,
  };
}
