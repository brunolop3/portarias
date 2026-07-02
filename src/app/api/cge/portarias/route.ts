// POST /api/cge/portarias
// Salva uma portaria gerada no histórico. Cria/atualiza o comitê conforme o tipo:
//   - Constituição: cria o comitê (curso + unidade + portaria de constituição).
//   - Alteração: atualiza a lista de membros do comitê existente.
// Aceita multipart/form-data quando há arquivo da CI anexado, ou JSON puro.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comitePrismaParaTipo, portariaPrismaParaTipo } from "@/lib/cge/mappers";
import { gerarMinutaTexto } from "@/lib/cge/templates";
import { getConfig } from "@/lib/cge/config";
import { registrarAuditoria } from "@/lib/cge/auditoria";
import type { TipoPortaria, Membro } from "@/lib/cge/types";

async function readBody(req: NextRequest) {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("multipart/form-data")) {
    const form = await req.formData();
    const payloadStr = String(form.get("payload") || "{}");
    const payload = JSON.parse(payloadStr);
    const file = form.get("ciArquivo") as File | null;
    return { payload, file };
  }
  const payload = await req.json();
  return { payload, file: null };
}

export async function POST(req: NextRequest) {
  try {
    const { payload, file } = await readBody(req);

    const tipo = payload.tipo as TipoPortaria;
    const numeroPortaria = payload.numeroPortaria as string;
    const dataPortaria = payload.dataPortaria as string; // ISO
    const ciNumero = payload.ciNumero as string;
    const curso = payload.curso as string;
    const grau = payload.grau as string;
    const unidade = payload.unidadeUniversitaria as string;
    const membros = (payload.membros ?? []) as Membro[];
    const portariaConstituicaoNumero = payload.portariaConstituicaoNumero as string | undefined;
    const portariaConstituicaoData = payload.portariaConstituicaoData as string | undefined;

    if (!numeroPortaria || !dataPortaria || !ciNumero || !curso || !grau || !unidade) {
      return NextResponse.json(
        { error: "Dados insuficientes para salvar a portaria." },
        { status: 400 }
      );
    }

    const cfg = await getConfig();
    // Re-gera o texto da minuta no servidor (fonte de verdade), garantindo
    // que o que fica no histórico seja exatamente o texto institucional.
    const textoGerado = gerarMinutaTexto({
      tipo,
      numeroPortaria,
      dataPortaria,
      curso,
      grau: grau as "bacharelado" | "licenciatura",
      unidadeUniversitaria: unidade,
      ciNumero,
      membros,
      portariaConstituicaoNumero,
      portariaConstituicaoData,
      configuracao: cfg,
    });

    let comiteId: string;

    if (tipo === "Constituição") {
      // Cria o comitê.
      const novo = await db.comite.create({
        data: {
          curso,
          grau,
          unidadeUniversitaria: unidade,
          portariaConstituicaoNumero: numeroPortaria,
          portariaConstituicaoData: new Date(dataPortaria),
          status: "ativo",
          membros: {
            create: membros.map((m) => ({ nome: m.nome, funcao: m.funcao })),
          },
        },
      });
      comiteId = novo.id;
    } else {
      // Alteração: precisa de comitê existente.
      if (!payload.comiteId) {
        return NextResponse.json(
          { error: "Alteração exige um comitê existente (comiteId)." },
          { status: 400 }
        );
      }
      comiteId = payload.comiteId;
      // Substitui membros.
      await db.membro.deleteMany({ where: { comiteId } });
      await db.comite.update({
        where: { id: comiteId },
        data: {
          membros: {
            create: membros.map((m) => ({ nome: m.nome, funcao: m.funcao })),
          },
        },
      });
    }

    // Salva o registro da portaria no histórico.
    let ciArquivoNome: string | null = null;
    let ciArquivoMime: string | null = null;
    let ciArquivoBytes: Buffer | null = null;
    if (file) {
      ciArquivoNome = file.name;
      ciArquivoMime = file.type || "application/octet-stream";
      ciArquivoBytes = Buffer.from(await file.arrayBuffer());
    }

    const portaria = await db.portaria.create({
      data: {
        tipo,
        numeroPortaria,
        dataPortaria: new Date(dataPortaria),
        ciNumero,
        ciArquivoNome,
        ciArquivoMime,
        ciArquivoBytes: ciArquivoBytes ?? undefined,
        comiteId,
        textoGerado,
        composicaoJson: JSON.stringify(membros),
      },
      include: { comite: { include: { membros: true } } },
    });

    // Auditoria
    await registrarAuditoria(
      tipo === "Constituição" ? "comite_criado" : "comite_alterado",
      "comite",
      `${tipo === "Constituição" ? "Comitê criado" : "Comitê alterado"}: ${curso} (${unidade}) — Portaria n.º ${numeroPortaria}`,
      comiteId,
      { tipo, numeroPortaria, curso, unidade, ciNumero, membros: membros.length }
    );
    await registrarAuditoria(
      "portaria_gerada",
      "portaria",
      `Portaria de ${tipo} n.º ${numeroPortaria} gerada para ${curso}`,
      portaria.id,
      { tipo, numeroPortaria, comiteId, curso }
    );

    return NextResponse.json(
      {
        portaria: portariaPrismaParaTipo(portaria),
        comite: comitePrismaParaTipo(portaria.comite),
      },
      { status: 201 }
    );
  } catch (e) {
    return NextResponse.json(
      { error: "Erro ao salvar portaria: " + (e as Error).message },
      { status: 500 }
    );
  }
}
