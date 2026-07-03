// ===========================================================================
// Tipos compartilhados da aplicação CGE/UEMS.
// Centraliza os contratos de dados usados pelo frontend e pelo backend.
// ===========================================================================

export type Grau = "bacharelado" | "licenciatura";

export type FuncaoMembro =
  | "Presidente"
  | "Coordenador(a) do Curso - Membro Nato"
  | "Membro";

export type TipoPortaria = "Constituição" | "Alteração";

export type StatusComite = "ativo" | "encerrado";

// Membro conforme aparece no formulário e nas minutas.
export interface Membro {
  id: string; // id temporário no cliente; id real ao vir do banco
  nome: string;
  funcao: FuncaoMembro;
}

// Comitê (curso + unidade) com sua portaria de constituição e membros atuais.
export interface Comite {
  id: string;
  curso: string;
  grau: Grau;
  unidadeUniversitaria: string;
  portariaConstituicaoNumero: string;
  portariaConstituicaoData: string; // ISO date (yyyy-mm-dd)
  status: StatusComite;
  membros: Membro[];
  createdAt: string;
  updatedAt: string;
}

// Registro de Portaria gerada (histórico).
export interface PortariaGerada {
  id: string;
  tipo: TipoPortaria;
  numeroPortaria: string;
  dataPortaria: string; // ISO date
  ciNumero: string;
  ciArquivoNome?: string | null;
  comiteId: string;
  textoGerado: string;
  composicao: Membro[];
  criadoEm: string;
}

// Configurações globais editáveis (texto fixo das portarias).
export interface ConfiguracaoCGE {
  id: string;
  resolucaoHomologacao431: string;
  resolucaoHomologacao432: string;
  dataDeliberacao431: string; // ISO date
  dataDeliberacao432: string; // ISO date
  portariaDelegacaoCompetencia: string;
  resolucaoCouni: string;
  nomeSignatario: string;
  cargoSignatario: string;
}

// Payload usado para gerar a minuta (Tela 4). Reúne todos os campos variáveis.
export interface PayloadMinuta {
  tipo: TipoPortaria;
  numeroPortaria: string;
  dataPortaria: string; // ISO date
  curso: string;
  grau: Grau;
  unidadeUniversitaria: string;
  ciNumero: string;
  membros: Membro[];
  // Apenas para Alteração:
  portariaConstituicaoNumero?: string;
  portariaConstituicaoData?: string; // ISO date
  configuracao: ConfiguracaoCGE;
}

// Resultado da extração da CI via LLM.
export interface ExtracaoCI {
  ciNumero?: string;
  curso?: string;
  unidadeUniversitaria?: string;
  membros: { nome: string; funcao: string }[];
  textoExtraido?: string;
  avisos?: string[];
}
