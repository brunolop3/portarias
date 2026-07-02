// ===========================================================================
// Gerador da minuta de Portaria.
//
// Os templates abaixo são FIROSOS e institucionais. A ÚNICA coisa que esta
// função faz é substituir os campos entre colchetes pelos valores reais.
// Nenhuma palavra do texto fixo pode ser alterada.
//
// Fonte: PROMPT_GLM_Portarias_CGE_do_Zero.md (Template A e B).
// ===========================================================================

import type { PayloadMinuta } from "./types";
import { dataPorExtenso } from "./datas";
import { ordenarMembrosParaTabela } from "./quorum";

// Monta a tabela de membros como texto simples (Nome | Função), já ordenada.
function tabelaMembrosTexto(membros: PayloadMinuta["membros"]): string {
  const ordenados = ordenarMembrosParaTabela(membros);
  const linhas = ordenados.map((m) => `${m.nome} | ${m.funcao}`);
  return linhas.join("\n");
}

// Monta a tabela de membros em HTML (para o preview e para o .docx).
export function tabelaMembrosHtml(membros: PayloadMinuta["membros"]): string {
  const ordenados = ordenarMembrosParaTabela(membros);
  const linhas = ordenados
    .map((m) => `<tr><td>${escapeHtml(m.nome)}</td><td>${escapeHtml(m.funcao)}</td></tr>`)
    .join("");
  return `<table><thead><tr><th>Nome do integrante</th><th>Função</th></tr></thead><tbody>${linhas}</tbody></table>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Substitui todas as ocorrências de [campo] pelo valor correspondente.
function substituir(
  template: string,
  valores: Record<string, string>
): string {
  let out = template;
  for (const [chave, valor] of Object.entries(valores)) {
    // Substitui o placeholder [chave] pelo valor (escape de $ para replace).
    out = out.split(`[${chave}]`).join(valor);
  }
  return out;
}

// ===========================================================================
// Template A — CONSTITUIÇÃO
// ===========================================================================
const TEMPLATE_CONSTITUICAO = `PORTARIA PROE-UEMS n.º [numero_portaria], de [data_portaria].

Constitui o Comitê de Gestão do Enade do Curso de [curso], [grau], da Universidade Estadual de Mato Grosso do Sul, ofertado na Unidade Universitária de [unidade_universitaria].

Por delegação de competência do Magnífico Reitor da UEMS, conforme [portaria_delegacao_competencia],
O PRÓ-REITOR DE ENSINO DA UNIVERSIDADE ESTADUAL DE MATO GROSSO DO SUL, no uso de suas atribuições que lhes são conferidas pelo Regimento Geral e [resolucao_couni], e,

CONSIDERANDO a Deliberação CE/CEPE-UEMS Nº 431, de [data_deliberacao_431], homologada pela [resolucao_homologacao_431], que aprovam a Política de Gestão do Exame Nacional dos Estudantes (Enade) na Universidade Estadual de Mato Grosso do Sul;

CONSIDERANDO a Deliberação CE/CEPE-UEMS Nº 432, de [data_deliberacao_432], homologada pela [resolucao_homologacao_432], que aprovam o Regulamento dos Comitês de Gestão do Exame Nacional dos Estudantes (Enade) na Universidade Estadual de Mato Grosso do Sul; e

CONSIDERANDO a CI n.º [ci_numero], da Coordenação do Curso de [curso], ofertado na Unidade Universitária de [unidade_universitaria], que informa os membros do Comitê de Gestão do Enade eleitos pelo colegiado,

RESOLVE:

Art. 1.º Constituir o Comitê de Gestão do Enade do curso de [curso], [grau], da Universidade Estadual de Mato Grosso do Sul, ofertado na Unidade Universitária de [unidade_universitaria].

Art. 2.º O Comitê de que trata esta Portaria fica constituído com os seguintes membros:

[TABELA_MEMBROS]

Art. 3.º Fica este Comitê comprometido com a realização da gestão do Enade, conforme previsto nas normativas institucionais vigentes.

Art. 4.º A duração do mandato dos membros do Comitê de Gestão do Enade será de 2 (dois) anos, permitida a recondução de no máximo 50% (cinquenta por cento) de seus membros ao término de cada mandato.

Art. 5.º Esta Portaria entra em vigor a partir da data de sua publicação.

[nome_signatario]
[cargo_signatario]`;

// ===========================================================================
// Template B — ALTERAÇÃO
// ===========================================================================
const TEMPLATE_ALTERACAO = `PORTARIA PROE-UEMS n.º [numero_portaria], de [data_portaria].

Altera os membros do Comitê de Gestão do Enade do Curso de [curso], [grau], da Universidade Estadual de Mato Grosso do Sul, ofertado na Unidade Universitária de [unidade_universitaria].

Por delegação de competência do Magnífico Reitor da UEMS, conforme [portaria_delegacao_competencia],
O PRÓ-REITOR DE ENSINO DA UNIVERSIDADE ESTADUAL DE MATO GROSSO DO SUL, no uso de suas atribuições que lhes são conferidas pelo Regimento Geral e [resolucao_couni], e,

CONSIDERANDO a Deliberação CE/CEPE-UEMS Nº 431, de [data_deliberacao_431], homologada pela [resolucao_homologacao_431], que aprovam a Política de Gestão do Exame Nacional dos Estudantes (Enade) na Universidade Estadual de Mato Grosso do Sul;

CONSIDERANDO a Deliberação CE/CEPE-UEMS Nº 432, de [data_deliberacao_432], homologada pela [resolucao_homologacao_432], que aprovam o Regulamento dos Comitês de Gestão do Exame Nacional dos Estudantes (Enade) na Universidade Estadual de Mato Grosso do Sul; e

CONSIDERANDO a CI n.º [ci_numero], da Coordenação do Curso de [curso], ofertado na Unidade Universitária de [unidade_universitaria], que informa os membros do Comitê de Gestão do Enade eleitos pelo colegiado,

RESOLVE:

Art. 1.º Alterar os membros do Comitê de Gestão do Enade do curso de [curso], [grau], da Universidade Estadual de Mato Grosso do Sul, ofertado na Unidade Universitária de [unidade_universitaria], constituído pela Portaria PROE-UEMS n.º [portaria_constituicao_numero], de [portaria_constituicao_data].

Art. 2.º O Comitê de que trata esta Portaria passa a vigorar com os seguintes membros até a data de término do mandato estabelecida na Portaria PROE-UEMS n.º [portaria_constituicao_numero], de [portaria_constituicao_data] (Portaria de constituição):

[TABELA_MEMBROS]

Art. 3.º Fica este Comitê comprometido com a realização da gestão do Enade, conforme previsto nas normativas institucionais vigentes.

Art. 4.º Esta Portaria entra em vigor a partir da data de sua publicação.

[nome_signatario]
[cargo_signatario]`;

// ===========================================================================
// Gera o texto final da minuta (texto simples, com tabela como linhas).
// ===========================================================================
export function gerarMinutaTexto(p: PayloadMinuta): string {
  const c = p.configuracao;
  const valores: Record<string, string> = {
    numero_portaria: p.numeroPortaria,
    data_portaria: dataPorExtenso(p.dataPortaria),
    curso: p.curso,
    grau: p.grau,
    unidade_universitaria: p.unidadeUniversitaria,
    portaria_delegacao_competencia: c.portariaDelegacaoCompetencia,
    resolucao_couni: c.resolucaoCouni,
    data_deliberacao_431: dataPorExtenso(c.dataDeliberacao431),
    resolucao_homologacao_431: c.resolucaoHomologacao431,
    data_deliberacao_432: dataPorExtenso(c.dataDeliberacao432),
    resolucao_homologacao_432: c.resolucaoHomologacao432,
    ci_numero: p.ciNumero,
    TABELA_MEMBROS: tabelaMembrosTexto(p.membros),
    nome_signatario: c.nomeSignatario,
    cargo_signatario: c.cargoSignatario,
  };

  if (p.tipo === "Alteração") {
    valores.portaria_constituicao_numero = p.portariaConstituicaoNumero ?? "";
    valores.portaria_constituicao_data = dataPorExtenso(p.portariaConstituicaoData);
    return substituir(TEMPLATE_ALTERACAO, valores);
  }
  return substituir(TEMPLATE_CONSTITUICAO, valores);
}

// ===========================================================================
// Gera a minuta em HTML (para preview na Tela 4 e para o .docx).
// ===========================================================================
export function gerarMinutaHtml(p: PayloadMinuta): string {
  // Reaproveita o gerador de texto e depois troca o bloco da tabela por HTML.
  const texto = gerarMinutaTexto(p);
  const tabelaHtml = tabelaMembrosHtml(p.membros);
  // Substitui o bloco "Nome | Função\n..." pelo <table> HTML.
  // O bloco começa após "Art. 2.º ... membros:\n\n" e termina antes do próximo "Art.".
  // Em vez de regex complexo, reconstruímos parágrafo a parágrafo.
  const partes = texto.split("\n\n");
  const html = partes
    .map((parte) => {
      // Detecta o bloco da tabela (linhas "Nome | Função").
      if (parte.includes(" | ")) {
        return tabelaHtml;
      }
      // Escapa e envolve em <p>. Trata assinatura (últimas 2 linhas) separadamente.
      const linhas = parte.split("\n");
      if (linhas.length === 2 && parte.match(/\n/)) {
        // Possível assinatura: nome \n cargo.
        const nome = escapeHtml(linhas[0]);
        const cargo = escapeHtml(linhas[1]);
        return `<p class="ass"><span class="nome">${nome}</span><br/>${cargo}</p>`;
      }
      return `<p>${escapeHtml(parte).replace(/\n/g, "<br/>")}</p>`;
    })
    .join("\n");

  return html;
}
