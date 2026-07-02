// GET  /api/cge/config  → retorna configuração global (criando padrão se vazio)
// PUT  /api/cge/config  → atualiza configuração global
import { NextRequest, NextResponse } from "next/server";
import { getConfig, updateConfig } from "@/lib/cge/config";
import type { ConfiguracaoCGE } from "@/lib/cge/types";

export async function GET() {
  try {
    const cfg = await getConfig();
    return NextResponse.json(cfg);
  } catch (e) {
    return NextResponse.json(
      { error: "Erro ao carregar configurações: " + (e as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as Omit<ConfiguracaoCGE, "id">;
    // Validação mínima dos campos obrigatórios.
    const campos: (keyof typeof body)[] = [
      "resolucaoHomologacao431",
      "resolucaoHomologacao432",
      "dataDeliberacao431",
      "dataDeliberacao432",
      "portariaDelegacaoCompetencia",
      "resolucaoCouni",
      "nomeSignatario",
      "cargoSignatario",
    ];
    for (const c of campos) {
      if (!body[c] || String(body[c]).trim() === "") {
        return NextResponse.json(
          { error: `Campo obrigatório ausente: ${c}` },
          { status: 400 }
        );
      }
    }
    const cfg = await updateConfig(body);
    return NextResponse.json(cfg);
  } catch (e) {
    return NextResponse.json(
      { error: "Erro ao salvar configurações: " + (e as Error).message },
      { status: 500 }
    );
  }
}
