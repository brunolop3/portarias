// POST /api/cge/exportar-docx
// Body: PayloadMinuta (JSON)
// Retorna: arquivo .docx com a minuta formatada (pronto para publicação).
//
// Usa a biblioteca `docx` para montar um documento com:
//   - título centralizado em negrito
//   - parágrafos justificados
//   - tabela de membros com bordas
//   - assinatura à direita
// A formatação é simples e compatível com envio para o Diário Oficial.
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
  HeadingLevel,
} from "docx";
import { gerarMinutaTexto } from "@/lib/cge/templates";
import { getConfig } from "@/lib/cge/config";
import { ordenarMembrosParaTabela } from "@/lib/cge/quorum";
import { dataPorExtenso } from "@/lib/cge/datas";
import type { PayloadMinuta, Membro } from "@/lib/cge/types";

function p(text: string, opts: { bold?: boolean; align?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {}) {
  return new Paragraph({
    alignment: opts.align,
    spacing: { after: 200, line: 360 },
    children: [new TextRun({ text, bold: opts.bold, font: "Times New Roman", size: 24 })],
  });
}

function headingCenter(text: string) {
  return new Paragraph({
    alignment: AlignmentType.CENTERED,
    spacing: { after: 300, line: 360 },
    children: [new TextRun({ text, bold: true, font: "Times New Roman", size: 26 })],
  });
}

function tabelaMembros(membros: Membro[]) {
  const ordenados = ordenarMembrosParaTabela(membros);
  const borda = { style: BorderStyle.SINGLE, size: 6, color: "999999" };
  const header = new TableRow({
    children: [
      new TableCell({
        width: { size: 65, type: WidthType.PERCENTAGE },
        shading: { fill: "F2F2EE" },
        children: [p("Nome do integrante", { bold: true })],
      }),
      new TableCell({
        width: { size: 35, type: WidthType.PERCENTAGE },
        shading: { fill: "F2F2EE" },
        children: [p("Função", { bold: true })],
      }),
    ],
  });
  const rows = ordenados.map(
    (m) =>
      new TableRow({
        children: [
          new TableCell({ children: [p(m.nome)] }),
          new TableCell({ children: [p(m.funcao)] }),
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

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as PayloadMinuta;
    // Re-busca config para usar valores atuais.
    const cfg = await getConfig();
    const payloadCompleto: PayloadMinuta = { ...payload, configuracao: cfg };

    // Garante texto do servidor (fonte de verdade).
    const _texto = gerarMinutaTexto(payloadCompleto);

    const c = cfg;
    const children: (Paragraph | Table)[] = [];

    // Cabeçalho (timbre simplificado — papel timbrado).
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [
          new TextRun({ text: "UNIVERSIDADE ESTADUAL DE MATO GROSSO DO SUL", bold: true, font: "Times New Roman", size: 24 }),
        ],
      })
    );
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [
          new TextRun({ text: "PRÓ-REITORIA DE ENSINO — PROE", font: "Times New Roman", size: 22 }),
        ],
      })
    );
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [
          new TextRun({ text: "DIRETORIA DE GESTÃO DO ENSINO — DIGES", font: "Times New Roman", size: 22 }),
        ],
      })
    );

    // Título da portaria.
    children.push(
      headingCenter(
        `PORTARIA PROE-UEMS n.º ${payload.numeroPortaria}, de ${dataPorExtenso(payload.dataPortaria)}.`
      )
    );

    // Premâmbulo (considerando + resolve).
    const grauTexto = payload.grau === "bacharelado" ? "bacharelado" : "licenciatura";
    const preambulo = payload.tipo === "Constituição"
      ? `Constitui o Comitê de Gestão do Enade do Curso de ${payload.curso}, ${grauTexto}, da Universidade Estadual de Mato Grosso do Sul, ofertado na Unidade Universitária de ${payload.unidadeUniversitaria}.`
      : `Altera os membros do Comitê de Gestão do Enade do Curso de ${payload.curso}, ${grauTexto}, da Universidade Estadual de Mato Grosso do Sul, ofertado na Unidade Universitária de ${payload.unidadeUniversitaria}.`;
    children.push(p(preambulo, { align: AlignmentType.JUSTIFIED }));

    children.push(
      p(
        `Por delegação de competência do Magnífico Reitor da UEMS, conforme ${c.portariaDelegacaoCompetencia},`,
        { align: AlignmentType.JUSTIFIED }
      )
    );
    children.push(
      p(
        `O PRÓ-REITOR DE ENSINO DA UNIVERSIDADE ESTADUAL DE MATO GROSSO DO SUL, no uso de suas atribuições que lhes são conferidas pelo Regimento Geral e ${c.resolucaoCouni}, e,`,
        { align: AlignmentType.JUSTIFIED }
      )
    );

    children.push(
      p(
        `CONSIDERANDO a Deliberação CE/CEPE-UEMS Nº 431, de ${dataPorExtenso(c.dataDeliberacao431)}, homologada pela ${c.resolucaoHomologacao431}, que aprovam a Política de Gestão do Exame Nacional dos Estudantes (Enade) na Universidade Estadual de Mato Grosso do Sul;`,
        { align: AlignmentType.JUSTIFIED }
      )
    );
    children.push(
      p(
        `CONSIDERANDO a Deliberação CE/CEPE-UEMS Nº 432, de ${dataPorExtenso(c.dataDeliberacao432)}, homologada pela ${c.resolucaoHomologacao432}, que aprovam o Regulamento dos Comitês de Gestão do Exame Nacional dos Estudantes (Enade) na Universidade Estadual de Mato Grosso do Sul; e`,
        { align: AlignmentType.JUSTIFIED }
      )
    );
    children.push(
      p(
        `CONSIDERANDO a CI n.º ${payload.ciNumero}, da Coordenação do Curso de ${payload.curso}, ofertado na Unidade Universitária de ${payload.unidadeUniversitaria}, que informa os membros do Comitê de Gestão do Enade eleitos pelo colegiado,`,
        { align: AlignmentType.JUSTIFIED }
      )
    );

    children.push(p("RESOLVE:", { align: AlignmentType.JUSTIFIED, bold: true }));

    // Art. 1º
    if (payload.tipo === "Constituição") {
      children.push(
        p(
          `Art. 1.º Constituir o Comitê de Gestão do Enade do curso de ${payload.curso}, ${grauTexto}, da Universidade Estadual de Mato Grosso do Sul, ofertado na Unidade Universitária de ${payload.unidadeUniversitaria}.`,
          { align: AlignmentType.JUSTIFIED }
        )
      );
      children.push(
        p("Art. 2.º O Comitê de que trata esta Portaria fica constituído com os seguintes membros:", {
          align: AlignmentType.JUSTIFIED,
        })
      );
    } else {
      const consNum = payload.portariaConstituicaoNumero || "";
      const consData = dataPorExtenso(payload.portariaConstituicaoData);
      children.push(
        p(
          `Art. 1.º Alterar os membros do Comitê de Gestão do Enade do curso de ${payload.curso}, ${grauTexto}, da Universidade Estadual de Mato Grosso do Sul, ofertado na Unidade Universitária de ${payload.unidadeUniversitaria}, constituído pela Portaria PROE-UEMS n.º ${consNum}, de ${consData}.`,
          { align: AlignmentType.JUSTIFIED }
        )
      );
      children.push(
        p(
          `Art. 2.º O Comitê de que trata esta Portaria passa a vigorar com os seguintes membros até a data de término do mandato estabelecida na Portaria PROE-UEMS n.º ${consNum}, de ${consData} (Portaria de constituição):`,
          { align: AlignmentType.JUSTIFIED }
        )
      );
    }

    // Tabela de membros.
    children.push(tabelaMembros(payload.membros));
    children.push(new Paragraph({ spacing: { after: 200 }, children: [] }));

    children.push(
      p(
        "Art. 3.º Fica este Comitê comprometido com a realização da gestão do Enade, conforme previsto nas normativas institucionais vigentes.",
        { align: AlignmentType.JUSTIFIED }
      )
    );

    if (payload.tipo === "Constituição") {
      children.push(
        p(
          "Art. 4.º A duração do mandato dos membros do Comitê de Gestão do Enade será de 2 (dois) anos, permitida a recondução de no máximo 50% (cinquenta por cento) de seus membros ao término de cada mandato.",
          { align: AlignmentType.JUSTIFIED }
        )
      );
      children.push(
        p("Art. 5.º Esta Portaria entra em vigor a partir da data de sua publicação.", {
          align: AlignmentType.JUSTIFIED,
        })
      );
    } else {
      children.push(
        p("Art. 4.º Esta Portaria entra em vigor a partir da data de sua publicação.", {
          align: AlignmentType.JUSTIFIED,
        })
      );
    }

    // Assinatura.
    children.push(new Paragraph({ spacing: { before: 600 }, children: [] }));
    children.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: c.nomeSignatario, bold: true, font: "Times New Roman", size: 24 })],
      })
    );
    children.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: c.cargoSignatario, font: "Times New Roman", size: 22 })],
      })
    );

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: { top: 1701, right: 1701, bottom: 1701, left: 1701 },
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
