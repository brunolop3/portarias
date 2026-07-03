// GET /api/cge/exportar-csv
// Gera um relatório CSV com todos os comitês e suas portarias, para uso
// institucional (auditoria, prestação de contas, levantamento histórico).
//
// Colunas: Curso | Grau | Unidade | Status | Portaria Constituição |
//          Data Constituição | Término Mandato | Tipo Portaria | Nº Portaria |
//          Data Portaria | Nº CI | Qtd Membros | Presidentes | Coordenadores
//
// Usa ponto-e-vírgula (;) como separador (compatível com Excel pt-BR) e
// BOM UTF-8 para acentuação correta ao abrir no Excel.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dataCurta, paraIsoDate, terminoMandato } from "@/lib/cge/datas";

function csvCell(s: string | number | null | undefined): string {
  const v = s === null || s === undefined ? "" : String(s);
  // Envolve em aspas e duplica aspas internas.
  return `"${v.replace(/"/g, '""')}"`;
}

export async function GET() {
  try {
    const comites = await db.comite.findMany({
      include: {
        membros: true,
        portarias: { orderBy: { dataPortaria: "asc" } },
      },
      orderBy: [{ curso: "asc" }, { unidadeUniversitaria: "asc" }],
    });

    const header = [
      "Curso",
      "Grau",
      "Unidade Universitária",
      "Status",
      "Portaria de Constituição (nº)",
      "Data Constituição",
      "Término do Mandato",
      "Tipo de Portaria",
      "Nº Portaria",
      "Data Portaria",
      "Nº CI",
      "Qtd Membros (versão)",
      "Presidente(s)",
      "Coordenador(es)",
    ];

    const linhas: string[] = [header.map(csvCell).join(";")];

    for (const c of comites) {
      const termino = terminoMandato(c.portariaConstituicaoData);
      const terminoStr = dataCurta(termino);
      // Se o comitê não tem portarias (caso raro), ainda assim gera 1 linha.
      if (c.portarias.length === 0) {
        linhas.push(
          [
            c.curso,
            c.grau,
            c.unidadeUniversitaria,
            c.status,
            c.portariaConstituicaoNumero,
            dataCurta(c.portariaConstituicaoData),
            terminoStr,
            "—",
            "—",
            "—",
            "—",
            String(c.membros.length),
            c.membros.filter((m) => m.funcao === "Presidente").map((m) => m.nome).join(", "),
            c.membros.filter((m) => m.funcao.includes("Coordenador")).map((m) => m.nome).join(", "),
          ]
            .map(csvCell)
            .join(";")
        );
        continue;
      }
      for (const p of c.portarias) {
        let composicao: { nome: string; funcao: string }[] = [];
        try {
          composicao = JSON.parse(p.composicaoJson);
        } catch {
          composicao = [];
        }
        linhas.push(
          [
            c.curso,
            c.grau,
            c.unidadeUniversitaria,
            c.status,
            c.portariaConstituicaoNumero,
            dataCurta(c.portariaConstituicaoData),
            terminoStr,
            p.tipo,
            p.numeroPortaria,
            dataCurta(p.dataPortaria),
            p.ciNumero,
            String(composicao.length),
            composicao.filter((m) => m.funcao === "Presidente").map((m) => m.nome).join(", "),
            composicao.filter((m) => m.funcao.includes("Coordenador")).map((m) => m.nome).join(", "),
          ]
            .map(csvCell)
            .join(";")
        );
      }
    }

    // BOM UTF-8 + conteúdo.
    const csv = "\uFEFF" + linhas.join("\r\n");
    const nomeArquivo = `Relatorio_CGE_UEMS_${paraIsoDate(new Date())}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(nomeArquivo)}"`,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Erro ao gerar CSV: " + (e as Error).message },
      { status: 500 }
    );
  }
}
