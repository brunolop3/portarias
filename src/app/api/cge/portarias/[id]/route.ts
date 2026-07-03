// GET  /api/cge/portarias/[id]          → retorna a portaria (texto + composição)
// GET  /api/cge/portarias/[id]?file=ci   → baixa o arquivo da CI anexado
// PUT  /api/cge/portarias/[id]          → edita a portaria (nº, data, CI, membros)
// DELETE /api/cge/portarias/[id]         → remove portaria do histórico
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { portariaPrismaParaTipo } from "@/lib/cge/mappers";
import { registrarAuditoria } from "@/lib/cge/auditoria";
import { gerarMinutaTexto } from "@/lib/cge/templates";
import { getConfig } from "@/lib/cge/config";
import { validarQuorum } from "@/lib/cge/quorum";
import type { Membro, TipoPortaria } from "@/lib/cge/types";

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

// PUT /api/cge/portarias/[id]
// Edita uma portaria existente: número, data, CI e/ou composição de membros.
// Re-gera o texto da minuta automaticamente com os novos dados.
// Se for Constituição, atualiza também a portaria de constituição do comitê.
// Se for Alteração e for a portaria mais recente, atualiza os membros atuais do comitê.
//
// Body JSON: { numeroPortaria, dataPortaria, ciNumero, membros: [{nome, funcao}] }
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { numeroPortaria, dataPortaria, ciNumero, membros = [] } = body;

    // Validações básicas.
    if (!numeroPortaria || !dataPortaria || !ciNumero) {
      return NextResponse.json(
        { error: "Número, data e CI são obrigatórios." },
        { status: 400 }
      );
    }

    // Busca a portaria atual + comitê relacionado.
    const portariaAtual = await db.portaria.findUnique({
      where: { id },
      include: { comite: { include: { membros: true } } },
    });
    if (!portariaAtual) {
      return NextResponse.json({ error: "Portaria não encontrada." }, { status: 404 });
    }

    const comite = portariaAtual.comite;
    const tipo = portariaAtual.tipo as TipoPortaria;
    const membrosTipados = membros as Membro[];

    // Valida quórum dos membros editados.
    const q = validarQuorum(membrosTipados);
    if (!q.valido) {
      return NextResponse.json(
        { error: "Quórum inválido: " + q.erros.join(" ") },
        { status: 400 }
      );
    }

    // Re-gera o texto da minuta com os dados atualizados.
    const cfg = await getConfig();
    const textoGerado = gerarMinutaTexto({
      tipo,
      numeroPortaria,
      dataPortaria,
      curso: comite.curso,
      grau: comite.grau as "bacharelado" | "licenciatura",
      unidadeUniversitaria: comite.unidadeUniversitaria,
      ciNumero,
      membros: membrosTipados,
      portariaConstituicaoNumero:
        tipo === "Alteração" ? comite.portariaConstituicaoNumero : undefined,
      portariaConstituicaoData:
        tipo === "Alteração" ? comite.portariaConstituicaoData.toISOString() : undefined,
      configuracao: cfg,
    });

    // Atualiza a portaria.
    const atualizada = await db.portaria.update({
      where: { id },
      data: {
        numeroPortaria,
        dataPortaria: new Date(dataPortaria),
        ciNumero,
        composicaoJson: JSON.stringify(membrosTipados),
        textoGerado,
      },
    });

    // Se for Constituição, atualiza também os dados de portaria de constituição do comitê.
    if (tipo === "Constituição") {
      await db.comite.update({
        where: { id: comite.id },
        data: {
          portariaConstituicaoNumero: numeroPortaria,
          portariaConstituicaoData: new Date(dataPortaria),
        },
      });
    }

    // Se for Alteração E for a portaria mais recente do comitê, atualiza os
    // membros atuais do comitê para refletir a composição editada.
    if (tipo === "Alteração") {
      const maisRecente = await db.portaria.findFirst({
        where: { comiteId: comite.id },
        orderBy: { criadoEm: "desc" },
      });
      if (maisRecente && maisRecente.id === id) {
        await db.membro.deleteMany({ where: { comiteId: comite.id } });
        await db.comite.update({
          where: { id: comite.id },
          data: {
            membros: {
              create: membrosTipados.map((m) => ({ nome: m.nome, funcao: m.funcao })),
            },
          },
        });
      }
    }

    // Auditoria.
    await registrarAuditoria(
      "portaria_gerada", // reutiliza a ação de portaria; descrição diferencia
      "portaria",
      `Portaria editada: n.º ${numeroPortaria} (${tipo}) — ${comite.curso}`,
      id,
      { numeroPortaria, tipo, comiteId: comite.id, edicao: true }
    );

    return NextResponse.json(portariaPrismaParaTipo(atualizada));
  } catch (e) {
    return NextResponse.json(
      { error: "Erro ao editar portaria: " + (e as Error).message },
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
    const portaria = await db.portaria.findUnique({ where: { id } });
    await db.portaria.delete({ where: { id } });
    if (portaria) {
      await registrarAuditoria(
        "portaria_excluida",
        "portaria",
        `Portaria excluída do histórico: n.º ${portaria.numeroPortaria} (${portaria.tipo})`,
        undefined,
        { numeroPortaria: portaria.numeroPortaria, tipo: portaria.tipo, comiteId: portaria.comiteId }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: "Erro ao excluir portaria: " + (e as Error).message },
      { status: 500 }
    );
  }
}
