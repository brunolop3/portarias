// GET /api/cge/auditoria
// Retorna os registros de auditoria (ações relevantes), ordenados do mais
// recente para o mais antigo. Suporta ?limite=N (padrão 50, máx 200).
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paraIsoDate } from "@/lib/cge/datas";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const limite = Math.min(200, Math.max(1, parseInt(url.searchParams.get("limite") || "50", 10)));
    const registros = await db.auditoria.findMany({
      orderBy: { criadoEm: "desc" },
      take: limite,
    });
    return NextResponse.json(
      registros.map((r) => ({
        id: r.id,
        acao: r.acao,
        entidade: r.entidade,
        entidadeId: r.entidadeId,
        descricao: r.descricao,
        detalhes: r.detalhes,
        criadoEm: paraIsoDate(r.criadoEm) + "T" + r.criadoEm.toISOString().split("T")[1],
      }))
    );
  } catch (e) {
    return NextResponse.json(
      { error: "Erro ao carregar auditoria: " + (e as Error).message },
      { status: 500 }
    );
  }
}
