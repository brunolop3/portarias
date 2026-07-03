// GET /api/cge/auditoria
// Retorna os registros de auditoria (ações relevantes), ordenados do mais
// recente para o mais antigo.
//
// Query params:
//   limite=N        — número máximo de registros (padrão 50, máx 200)
//   acao=XXX        — filtra por ação exata (ex.: comite_criado, portaria_gerada)
//   entidade=XXX    — filtra por entidade (comite, portaria, config)
//   busca=XXX       — busca textual na descrição (case-insensitive)
//   dataIni=YYYY-MM-DD — filtra registros a partir da data (inclusive)
//   dataFim=YYYY-MM-DD — filtra registros até a data (inclusive)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paraIsoDate } from "@/lib/cge/datas";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const limite = Math.min(200, Math.max(1, parseInt(url.searchParams.get("limite") || "50", 10)));
    const acao = url.searchParams.get("acao");
    const entidade = url.searchParams.get("entidade");
    const busca = url.searchParams.get("busca")?.trim();
    const dataIni = url.searchParams.get("dataIni");
    const dataFim = url.searchParams.get("dataFim");

    // Constrói o where dinamicamente.
    // biome-ignore lint/suspicious/noExplicitAny: Prisma where é dinâmico
    const where: any = {};
    if (acao) where.acao = acao;
    if (entidade) where.entidade = entidade;
    if (busca) {
      where.descricao = { contains: busca };
    }
    if (dataIni || dataFim) {
      where.criadoEm = {};
      if (dataIni) {
        const di = new Date(dataIni);
        di.setUTCHours(0, 0, 0, 0);
        where.criadoEm.gte = di;
      }
      if (dataFim) {
        const df = new Date(dataFim);
        df.setUTCHours(23, 59, 59, 999);
        where.criadoEm.lte = df;
      }
    }

    const registros = await db.auditoria.findMany({
      where,
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
