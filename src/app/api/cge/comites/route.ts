// GET  /api/cge/comites              → lista todos os comitês (com membros)
// POST /api/cge/comites              → cria um comitê (usado ao salvar Constituição)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comitePrismaParaTipo } from "@/lib/cge/mappers";
import type { Comite } from "@/lib/cge/types";

export async function GET() {
  try {
    const rows = await db.comite.findMany({
      include: { membros: true },
      orderBy: [{ curso: "asc" }, { unidadeUniversitaria: "asc" }],
    });
    const lista: Comite[] = rows.map(comitePrismaParaTipo);
    return NextResponse.json(lista);
  } catch (e) {
    return NextResponse.json(
      { error: "Erro ao listar comitês: " + (e as Error).message },
      { status: 500 }
    );
  }
}

// Body esperado para POST (criar comitê a partir de uma Constituição):
// {
//   curso, grau, unidadeUniversitaria,
//   portariaConstituicaoNumero, portariaConstituicaoData,
//   status?, membros: [{nome, funcao}]
// }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      curso,
      grau,
      unidadeUniversitaria,
      portariaConstituicaoNumero,
      portariaConstituicaoData,
      status = "ativo",
      membros = [],
    } = body;

    if (!curso || !grau || !unidadeUniversitaria) {
      return NextResponse.json(
        { error: "Curso, grau e Unidade Universitária são obrigatórios." },
        { status: 400 }
      );
    }
    if (!portariaConstituicaoNumero || !portariaConstituicaoData) {
      return NextResponse.json(
        { error: "Número e data da Portaria de Constituição são obrigatórios." },
        { status: 400 }
      );
    }

    // Evita duplicar curso + unidade.
    const existente = await db.comite.findUnique({
      where: {
        curso_unidadeUniversitaria: { curso, unidadeUniversitaria },
      },
    });
    if (existente) {
      return NextResponse.json(
        {
          error:
            "Já existe um comitê cadastrado para este curso nesta Unidade Universitária.",
        },
        { status: 409 }
      );
    }

    const novo = await db.comite.create({
      data: {
        curso,
        grau,
        unidadeUniversitaria,
        portariaConstituicaoNumero,
        portariaConstituicaoData: new Date(portariaConstituicaoData),
        status,
        membros: {
          create: membros.map((m: { nome: string; funcao: string }) => ({
            nome: m.nome,
            funcao: m.funcao,
          })),
        },
      },
      include: { membros: true },
    });

    return NextResponse.json(comitePrismaParaTipo(novo), { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: "Erro ao criar comitê: " + (e as Error).message },
      { status: 500 }
    );
  }
}
