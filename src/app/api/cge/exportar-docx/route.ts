// POST /api/cge/exportar-docx
// Body: PayloadMinuta (JSON)
// Retorna: arquivo .docx com a minuta formatada (pronto para publicação no Diário Oficial).
//
// ===========================================================================
// ESPECIFICAÇÃO DE FORMATAÇÃO (aplicar de forma EXATA e CONSISTENTE):
//   Página: A4, margens 3 cm todos os lados, fonte Times New Roman 12pt.
//   Timbre: 3 linhas centralizadas (1ª em negrito).
//   Título: negrito, esquerda, sem recuo.
//   Ementa ("Constitui..."/"Altera..."): recuo esquerdo 8 cm, primeira linha 0,
//     justificado, sem negrito (bloco estreito à direita).
//   Corpo (preâmbulo, CONSIDERANDO, RESOLVE:, artigos): justificado, recuo de
//     primeira linha 1,5 cm, recuo esquerdo 0, espaçamento simples (1,0), uma
//     linha em branco entre cada parágrafo. "RESOLVE:" em negrito.
//   Tabela de membros: tabela real, 2 colunas, cabeçalho negrito, na margem
//     normal (sem herdar recuo de 1,5 cm).
//   Assinatura: CENTRALIZADA, nome em negrito MAIÚSCULAS, cargo normal na linha
//     de baixo.
//   Parágrafos vazios espaçadores: sem alinhamento especial (neutros).
//   NUNCA incluir anotações internas de quórum no texto final.
// ===========================================================================
import { NextRequest, NextResponse } from "next/server";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  LineRuleType,
} from "docx";
import { getConfig } from "@/lib/cge/config";
import { ordenarMembrosParaTabela } from "@/lib/cge/quorum";
import { dataPorExtenso } from "@/lib/cge/datas";
import type { PayloadMinuta, Membro } from "@/lib/cge/types";

// --- Constantes de formatação (em twips; 1 cm = 567 twips) ----------------
const FONT = "Times New Roman";
const SIZE = 24; // 12 pt (half-points)
const MARGIN_CM = 3; // margens
const MARGIN_TW = MARGIN_CM * 567; // 1701
const INDENT_FIRSTLINE = Math.round(1.5 * 567); // 1,5 cm ≈ 850
const INDENT_EMENTA = 8 * 567; // 8 cm = 4536
const LINE_SINGLE = 240; // espaçamento simples (1,0)
const BLANK_LINE = 240; // uma linha em branco (12 pt)

// --- Helpers de parágrafo --------------------------------------------------

// TextRun padrão: TNR 12pt.
function run(text: string, bold = false): TextRun {
  return new TextRun({ text, bold, font: FONT, size: SIZE });
}

// Parágrafo do corpo: justificado, recuo de 1ª linha 1,5 cm, espaçamento
// simples, uma linha em branco após. Mesma formatação em TODOS os parágrafos
// do corpo (preâmbulo, CONSIDERANDO, RESOLVE:, artigos).
function paraCorpo(text: string, bold = false): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: LINE_SINGLE, lineRule: LineRuleType.AUTO, after: BLANK_LINE },
    indent: { firstLine: INDENT_FIRSTLINE },
    children: [run(text, bold)],
  });
}

// Ementa: recuo esquerdo 8 cm, sem recuo de 1ª linha, justificado, sem negrito.
// O efeito é um bloco de texto estreito posicionado à direita da página.
function paraEmenta(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: LINE_SINGLE, lineRule: LineRuleType.AUTO, after: BLANK_LINE },
    indent: { left: INDENT_EMENTA },
    children: [run(text, false)],
  });
}

// Título da Portaria: negrito, esquerda, sem recuo.
function paraTitulo(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: LINE_SINGLE, lineRule: LineRuleType.AUTO, after: BLANK_LINE },
    children: [run(text, true)],
  });
}

// Linha do timbre: centralizada. primeira linha em negrito.
function paraTimbre(text: string, bold = false): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { line: LINE_SINGLE, lineRule: LineRuleType.AUTO, after: 0 },
    children: [run(text, bold)],
  });
}

// Linha da assinatura: centralizada.
function paraAssinatura(text: string, bold = false): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { line: LINE_SINGLE, lineRule: LineRuleType.AUTO, after: 0 },
    children: [run(text, bold)],
  });
}

// Parágrafo vazio espaçador: SEM alinhamento especial (neutro/padrão).
function spacer(): Paragraph {
  return new Paragraph({
    spacing: { line: LINE_SINGLE, lineRule: LineRuleType.AUTO },
    children: [],
  });
}

// Parágrafo de célula da tabela: sem recuo, esquerda, espaçamento simples,
// sem espaço após. 12pt TNR.
function paraCell(text: string, bold = false): Paragraph {
  return new Paragraph({
    spacing: { line: LINE_SINGLE, lineRule: LineRuleType.AUTO, after: 0 },
    children: [run(text, bold)],
  });
}

// --- Tabela de membros -----------------------------------------------------
// Tabela real (elemento de tabela do Word), alinhada à margem normal da página.
function tabelaMembros(membros: Membro[]): Table {
  const ordenados = ordenarMembrosParaTabela(membros);
  const borda = { style: BorderStyle.SINGLE, size: 6, color: "888888" };
  const header = new TableRow({
    children: [
      new TableCell({
        width: { size: 65, type: WidthType.PERCENTAGE },
        shading: { fill: "F2F2EE" },
        children: [paraCell("Nome do integrante", true)],
      }),
      new TableCell({
        width: { size: 35, type: WidthType.PERCENTAGE },
        shading: { fill: "F2F2EE" },
        children: [paraCell("Função", true)],
      }),
    ],
  });
  const rows = ordenados.map(
    (m) =>
      new TableRow({
        children: [
          new TableCell({ children: [paraCell(m.nome, false)] }),
          new TableCell({ children: [paraCell(m.funcao, false)] }),
        ],
      })
  );
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: borda,
      bottom: borda,
      left: borda,
      right: borda,
      insideHorizontal: borda,
      insideVertical: borda,
    },
    rows: [header, ...rows],
  });
}

// --- Rota ------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as PayloadMinuta;
    const c = await getConfig();

    const grauTexto = payload.grau === "bacharelado" ? "bacharelado" : "licenciatura";
    const children: (Paragraph | Table)[] = [];

    // ---- Timbre (topo) ----
    children.push(paraTimbre("UNIVERSIDADE ESTADUAL DE MATO GROSSO DO SUL", true));
    children.push(paraTimbre("PRÓ-REITORIA DE ENSINO — PROE", false));
    children.push(paraTimbre("DIRETORIA DE GESTÃO DO ENSINO — DIGES", false));
    children.push(spacer()); // linha em branco após o timbre (neutra)

    // ---- Título da Portaria ----
    children.push(
      paraTitulo(
        `PORTARIA PROE-UEMS n.º ${payload.numeroPortaria}, de ${dataPorExtenso(payload.dataPortaria)}.`
      )
    );

    // ---- Ementa (recuo de 8 cm) ----
    const ementa =
      payload.tipo === "Constituição"
        ? `Constitui o Comitê de Gestão do Enade do Curso de ${payload.curso}, ${grauTexto}, da Universidade Estadual de Mato Grosso do Sul, ofertado na Unidade Universitária de ${payload.unidadeUniversitaria}.`
        : `Altera os membros do Comitê de Gestão do Enade do Curso de ${payload.curso}, ${grauTexto}, da Universidade Estadual de Mato Grosso do Sul, ofertado na Unidade Universitária de ${payload.unidadeUniversitaria}.`;
    children.push(paraEmenta(ementa));

    // ---- Preâmbulo (mesma formatação do corpo) ----
    children.push(
      paraCorpo(
        `Por delegação de competência do Magnífico Reitor da UEMS, conforme ${c.portariaDelegacaoCompetencia},`
      )
    );
    children.push(
      paraCorpo(
        `O PRÓ-REITOR DE ENSINO DA UNIVERSIDADE ESTADUAL DE MATO GROSSO DO SUL, no uso de suas atribuições que lhes são conferidas pelo Regimento Geral e ${c.resolucaoCouni}, e,`
      )
    );

    // ---- CONSIDERANDO ----
    children.push(
      paraCorpo(
        `CONSIDERANDO a Deliberação CE/CEPE-UEMS Nº 431, de ${dataPorExtenso(c.dataDeliberacao431)}, homologada pela ${c.resolucaoHomologacao431}, que aprovam a Política de Gestão do Exame Nacional dos Estudantes (Enade) na Universidade Estadual de Mato Grosso do Sul;`
      )
    );
    children.push(
      paraCorpo(
        `CONSIDERANDO a Deliberação CE/CEPE-UEMS Nº 432, de ${dataPorExtenso(c.dataDeliberacao432)}, homologada pela ${c.resolucaoHomologacao432}, que aprovam o Regulamento dos Comitês de Gestão do Exame Nacional dos Estudantes (Enade) na Universidade Estadual de Mato Grosso do Sul; e`
      )
    );
    children.push(
      paraCorpo(
        `CONSIDERANDO a CI n.º ${payload.ciNumero}, da Coordenação do Curso de ${payload.curso}, ofertado na Unidade Universitária de ${payload.unidadeUniversitaria}, que informa os membros do Comitê de Gestão do Enade eleitos pelo colegiado,`
      )
    );

    // ---- RESOLVE: (negrito, mesma formatação do corpo) ----
    children.push(paraCorpo("RESOLVE:", true));

    // ---- Art. 1º ----
    if (payload.tipo === "Constituição") {
      children.push(
        paraCorpo(
          `Art. 1.º Constituir o Comitê de Gestão do Enade do curso de ${payload.curso}, ${grauTexto}, da Universidade Estadual de Mato Grosso do Sul, ofertado na Unidade Universitária de ${payload.unidadeUniversitaria}.`
        )
      );
      children.push(
        paraCorpo(
          "Art. 2.º O Comitê de que trata esta Portaria fica constituído com os seguintes membros:"
        )
      );
    } else {
      const consNum = payload.portariaConstituicaoNumero || "";
      const consData = dataPorExtenso(payload.portariaConstituicaoData);
      children.push(
        paraCorpo(
          `Art. 1.º Alterar os membros do Comitê de Gestão do Enade do curso de ${payload.curso}, ${grauTexto}, da Universidade Estadual de Mato Grosso do Sul, ofertado na Unidade Universitária de ${payload.unidadeUniversitaria}, constituído pela Portaria PROE-UEMS n.º ${consNum}, de ${consData}.`
        )
      );
      children.push(
        paraCorpo(
          `Art. 2.º O Comitê de que trata esta Portaria passa a vigorar com os seguintes membros até a data de término do mandato estabelecida na Portaria PROE-UEMS n.º ${consNum}, de ${consData} (Portaria de constituição):`
        )
      );
    }

    // ---- Tabela de membros (na margem normal; spacer neutro após) ----
    children.push(tabelaMembros(payload.membros));
    children.push(spacer());

    // ---- Art. 3º ----
    children.push(
      paraCorpo(
        "Art. 3.º Fica este Comitê comprometido com a realização da gestão do Enade, conforme previsto nas normativas institucionais vigentes."
      )
    );

    // ---- Art. 4º (e 5º) ----
    if (payload.tipo === "Constituição") {
      children.push(
        paraCorpo(
          "Art. 4.º A duração do mandato dos membros do Comitê de Gestão do Enade será de 2 (dois) anos, permitida a recondução de no máximo 50% (cinquenta por cento) de seus membros ao término de cada mandato."
        )
      );
      children.push(
        paraCorpo(
          "Art. 5.º Esta Portaria entra em vigor a partir da data de sua publicação."
        )
      );
    } else {
      children.push(
        paraCorpo(
          "Art. 4.º Esta Portaria entra em vigor a partir da data de sua publicação."
        )
      );
    }

    // ---- Assinatura (centralizada) ----
    children.push(spacer()); // separação neutra antes da assinatura
    children.push(paraAssinatura(c.nomeSignatario.toUpperCase(), true)); // nome em negrito MAIÚSCULAS
    children.push(paraAssinatura(c.cargoSignatario, false)); // cargo normal

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              size: { width: 11906, height: 16838 }, // A4 (twips)
              margin: {
                top: MARGIN_TW,
                right: MARGIN_TW,
                bottom: MARGIN_TW,
                left: MARGIN_TW,
              },
            },
          },
          children,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const nomeArquivo = `Portaria_PROE-UEMS_${payload.numeroPortaria.replace(/[^\d]/g, "_")}.docx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(nomeArquivo)}"`,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Erro ao gerar .docx: " + (e as Error).message },
      { status: 500 }
    );
  }
}
