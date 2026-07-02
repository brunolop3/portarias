// GET /api/cge/verificar-portaria?numero=1.234&ignorarId=xxx
// Verifica se já existe uma portaria com o número informado (em qualquer
// comitê). Retorna { duplicado: boolean, comite?: {curso, unidade, tipo} }.
//
// Usado pela Tela 2 para avisar o usuário em tempo real que o número da
// portaria já foi usado — evita duplicidade no histórico/DOU.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const numero = (url.searchParams.get("numero") || "").trim();
    const ignorarId = url.searchParams.get("ignorarId"); // id da portaria atual, ao editar

    if (!numero) {
      return NextResponse.json({ duplicado: false });
    }

    const where: { numeroPortaria: string; id?: { not: string } } = {
      numeroPortaria: numero,
    };
    if (ignorarId) where.id = { not: ignorarId };

    const existente = await db.portaria.findFirst({
      where,
      include: { comite: { select: { curso: true, unidadeUniversitaria: true } } },
    });

    if (!existente) {
      return NextResponse.json({ duplicado: false });
    }

    return NextResponse.json({
      duplicado: true,
      portaria: {
        id: existente.id,
        tipo: existente.tipo,
        numeroPortaria: existente.numeroPortaria,
        dataPortaria: existente.dataPortaria,
        curso: existente.comite.curso,
        unidade: existente.comite.unidadeUniversitaria,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Erro ao verificar: " + (e as Error).message },
      { status: 500 }
    );
  }
}
