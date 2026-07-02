// GET /api/cge/membro/[nome]
// Retorna o histórico de participações de uma pessoa em comitês, consultando
// os membros atuais e os snapshots históricos (composicaoJson de cada portaria).
// O parâmetro [nome] vem URL-encoded; a busca é case-insensitive e por match
// exato do nome normalizado (trim + upper).
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paraIsoDate, dataCurta } from "@/lib/cge/datas";

interface Participacao {
  comiteId: string;
  curso: string;
  unidade: string;
  grau: string;
  funcao: string;
  origem: "atual" | "historica";
  dataPortaria?: string;
  tipoPortaria?: string;
  numeroPortaria?: string;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ nome: string }> }
) {
  try {
    const { nome } = await params;
    const nomeBusca = decodeURIComponent(nome).trim().toUpperCase();
    if (!nomeBusca) {
      return NextResponse.json({ error: "Nome não informado." }, { status: 400 });
    }

    const comites = await db.comite.findMany({
      include: {
        membros: true,
        portarias: {
          orderBy: { dataPortaria: "asc" },
          select: { tipo: true, numeroPortaria: true, dataPortaria: true, composicaoJson: true },
        },
      },
    });

    const participacoes: Participacao[] = [];
    const comitesIds = new Set<string>();

    for (const c of comites) {
      // Membro atual?
      const membroAtual = c.membros.find(
        (m) => m.nome.trim().toUpperCase() === nomeBusca
      );
      if (membroAtual) {
        participacoes.push({
          comiteId: c.id,
          curso: c.curso,
          unidade: c.unidadeUniversitaria,
          grau: c.grau,
          funcao: membroAtual.funcao,
          origem: "atual",
        });
        comitesIds.add(c.id);
      }

      // Snapshots históricos (cada portaria).
      for (const p of c.portarias) {
        try {
          const comp = JSON.parse(p.composicaoJson) as Array<{
            nome: string;
            funcao: string;
          }>;
          const membroHist = comp.find(
            (m) => m.nome.trim().toUpperCase() === nomeBusca
          );
          if (membroHist) {
            participacoes.push({
              comiteId: c.id,
              curso: c.curso,
              unidade: c.unidadeUniversitaria,
              grau: c.grau,
              funcao: membroHist.funcao,
              origem: "historica",
              dataPortaria: paraIsoDate(p.dataPortaria),
              tipoPortaria: p.tipo,
              numeroPortaria: p.numeroPortaria,
            });
            comitesIds.add(c.id);
          }
        } catch {
          // ignore parse errors
        }
      }
    }

    if (participacoes.length === 0) {
      return NextResponse.json({
        nome: decodeURIComponent(nome),
        totalComites: 0,
        totalParticipacoes: 0,
        participacoes: [],
      });
    }

    // Deduplica participações históricas idênticas (mesma portaria).
    const vistos = new Set<string>();
    const unicas = participacoes.filter((p) => {
      const key = `${p.comiteId}|${p.origem}|${p.numeroPortaria || ""}|${p.funcao}`;
      if (vistos.has(key)) return false;
      vistos.add(key);
      return true;
    });

    // Ordena: atuais primeiro, depois históricas por data.
    unicas.sort((a, b) => {
      if (a.origem === "atual" && b.origem !== "atual") return -1;
      if (a.origem !== "atual" && b.origem === "atual") return 1;
      if (a.dataPortaria && b.dataPortaria) {
        return new Date(b.dataPortaria).getTime() - new Date(a.dataPortaria).getTime();
      }
      return a.curso.localeCompare(b.curso, "pt-BR");
    });

    // Resumo de funções exercidas.
    const funcoes = new Map<string, number>();
    for (const p of unicas) {
      funcoes.set(p.funcao, (funcoes.get(p.funcao) || 0) + 1);
    }

    return NextResponse.json({
      nome: decodeURIComponent(nome),
      totalComites: comitesIds.size,
      totalParticipacoes: unicas.length,
      funcoes: Array.from(funcoes.entries()).map(([funcao, total]) => ({ funcao, total })),
      participacoes: unicas.map((p) => ({
        ...p,
        dataPortariaFormatada: p.dataPortaria ? dataCurta(p.dataPortaria) : undefined,
      })),
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Erro ao buscar histórico do membro: " + (e as Error).message },
      { status: 500 }
    );
  }
}
