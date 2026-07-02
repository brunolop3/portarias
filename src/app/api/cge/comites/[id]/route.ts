// GET    /api/cge/comites/[id]  → comitê + membros + histórico de portarias
// PUT    /api/cge/comites/[id]  → atualiza membros (usado ao salvar Alteração)
// DELETE /api/cge/comites/[id]  → remove comitê (e membros/portarias em cascata)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comitePrismaParaTipo, portariaPrismaParaTipo } from "@/lib/cge/mappers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const row = await db.comite.findUnique({
      where: { id },
      include: {
        membros: true,
        portarias: { orderBy: { criadoEm: "desc" } },
      },
    });
    if (!row) {
      return NextResponse.json({ error: "Comitê não encontrado." }, { status: 404 });
    }
    const comite = comitePrismaParaTipo(row);
    const portarias = row.portarias.map(portariaPrismaParaTipo);
    return NextResponse.json({ comite, portarias });
  } catch (e) {
    return NextResponse.json(
      { error: "Erro ao carregar comitê: " + (e as Error).message },
      { status: 500 }
    );
  }
}

// PUT: substitui inteiramente a lista de membros do comitê.
// Body: { membros: [{nome, funcao}], status? }
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const membros: { nome: string; funcao: string }[] = body.membros ?? [];
    const status = body.status;

    const existente = await db.comite.findUnique({ where: { id } });
    if (!existente) {
      return NextResponse.json({ error: "Comitê não encontrado." }, { status: 404 });
    }

    // Apaga membros antigos e recria (snapshot da nova composição).
    await db.membro.deleteMany({ where: { comiteId: id } });
    const atualizado = await db.comite.update({
      where: { id },
      data: {
        status: status ?? existente.status,
        membros: {
          create: membros.map((m) => ({ nome: m.nome, funcao: m.funcao })),
        },
      },
      include: { membros: true },
    });

    return NextResponse.json(comitePrismaParaTipo(atualizado));
  } catch (e) {
    return NextResponse.json(
      { error: "Erro ao atualizar comitê: " + (e as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.comite.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: "Erro ao excluir comitê: " + (e as Error).message },
      { status: 500 }
    );
  }
}
