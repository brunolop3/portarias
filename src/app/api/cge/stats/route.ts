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
      include: { membros: true, _count: { select: { portarias: true } } },
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
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Erro ao calcular estatísticas: " + (e as Error).message },
      { status: 500 }
    );
  }
}
