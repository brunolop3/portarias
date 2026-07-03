// GET /api/cge/alertas
// Retorna todos os comitês ativos com situação de mandato que requer atenção:
//   - vencido (mandato já expirou)
//   - vencendo (expira em <= 90 dias)
//   - ativo (expira em > 90 dias — incluído para contexto, mas não é alerta)
// Ordena por urgência: vencidos primeiro, depois vencendo (menor dias primeiro).
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { situacaoDoComite, diasParaTermino, paraIsoDate, dataCurta } from "@/lib/cge/datas";

export async function GET() {
  try {
    const comites = await db.comite.findMany({
      where: { status: "ativo" },
      include: { membros: true },
      orderBy: [{ curso: "asc" }],
    });

    const alertas = comites
      .map((c) => {
        const dias = diasParaTermino(c.portariaConstituicaoData);
        const termino = new Date(c.portariaConstituicaoData);
        termino.setUTCFullYear(termino.getUTCFullYear() + 2);
        return {
          id: c.id,
          curso: c.curso,
          grau: c.grau,
          unidade: c.unidadeUniversitaria,
          portariaConstituicaoNumero: c.portariaConstituicaoNumero,
          portariaConstituicaoData: paraIsoDate(c.portariaConstituicaoData),
          terminoMandato: paraIsoDate(termino),
          terminoFormatado: dataCurta(termino),
          dias,
          situacao: situacaoDoComite(c.status, c.portariaConstituicaoData),
          totalMembros: c.membros.length,
        };
      })
      .filter((a) => a.situacao === "vencido" || a.situacao === "vencendo" || a.situacao === "vencido")
      // Mantém apenas vencidos e vencendo (alertas reais).
      .filter((a) => a.situacao === "vencido" || a.situacao === "vencendo");

    // Ordena: vencidos primeiro (mais antigo primeiro), depois vencendo (menos dias primeiro).
    alertas.sort((a, b) => {
      if (a.situacao === "vencido" && b.situacao !== "vencido") return -1;
      if (a.situacao !== "vencido" && b.situacao === "vencido") return 1;
      return a.dias - b.dias;
    });

    return NextResponse.json({
      total: alertas.length,
      vencidos: alertas.filter((a) => a.situacao === "vencido").length,
      vencendo: alertas.filter((a) => a.situacao === "vencendo").length,
      alertas,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Erro ao carregar alertas: " + (e as Error).message },
      { status: 500 }
    );
  }
}
