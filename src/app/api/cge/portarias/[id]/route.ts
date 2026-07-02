// GET  /api/cge/portarias/[id]          → retorna a portaria (texto + composição)
// GET  /api/cge/portarias/[id]?file=ci   → baixa o arquivo da CI anexado
// DELETE /api/cge/portarias/[id]         → remove portaria do histórico
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { portariaPrismaParaTipo } from "@/lib/cge/mappers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const wantFile = url.searchParams.get("file") === "ci";

    const row = await db.portaria.findUnique({ where: { id } });
    if (!row) {
      return NextResponse.json({ error: "Portaria não encontrada." }, { status: 404 });
    }

    if (wantFile) {
      if (!row.ciArquivoBytes) {
        return NextResponse.json(
          { error: "Esta portaria não possui arquivo de CI anexado." },
          { status: 404 }
        );
      }
      return new NextResponse(row.ciArquivoBytes, {
        status: 200,
        headers: {
          "Content-Type": row.ciArquivoMime || "application/octet-stream",
          "Content-Disposition": `inline; filename="${encodeURIComponent(
            row.ciArquivoNome || "ci"
          )}"`,
        },
      });
    }

    return NextResponse.json(portariaPrismaParaTipo(row));
  } catch (e) {
    return NextResponse.json(
      { error: "Erro ao carregar portaria: " + (e as Error).message },
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
    await db.portaria.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: "Erro ao excluir portaria: " + (e as Error).message },
      { status: 500 }
    );
  }
}
