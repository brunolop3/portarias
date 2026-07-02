"use client";

// ===========================================================================
// Store global da aplicação CGE. Centraliza o fluxo das Telas 1–4 e os dados
// do formulário, além da área de consulta (Tela 5) e configurações.
//
// A navegação entre as 5 áreas é feita por estado (não por rotas), pois a
// aplicação tem uma única rota visível ("/").
// ===========================================================================

import { create } from "zustand";
import type {
  Comite,
  Membro,
  TipoPortaria,
  Grau,
  ConfiguracaoCGE,
} from "@/lib/cge/types";

export type Area = "inicio" | "novo" | "consultar" | "config" | "alertas";

// Etapas dentro do fluxo "novo" (Tela 1 → 2 → 3 → 4).
export type Etapa = 1 | 2 | 3 | 4;

interface FormState {
  // Tela 1
  tipo: TipoPortaria | null;
  comiteSelecionadoId: string | null;
  // Tela 2
  numeroPortaria: string;
  dataPortaria: string; // ISO yyyy-mm-dd
  curso: string;
  grau: Grau | "";
  unidade: string;
  ciNumero: string;
  ciArquivo: File | null;
  ciArquivoNome: string | null; // nome de arquivo já salvo (ao editar histórico)
  // Importação da CI (sugestões destacadas)
  sugestaoCi: {
    ciNumero?: string;
    curso?: string;
    unidade?: string;
    membros?: { nome: string; funcao: string }[];
  } | null;
  // Tela 3
  membros: Membro[];
  // Tela 4
  textoGerado: string;
  // Snapshot do comitê selecionado (para Alteração pré-preencher campos)
  comiteSnapshot: Comite | null;
}

interface CgeState extends FormState {
  area: Area;
  etapa: Etapa;
  config: ConfiguracaoCGE | null;
  // Curso selecionado para a página de consulta (Tela 5).
  cursoConsultaId: string | null;

  // Ações de navegação
  setArea: (a: Area) => void;
  irParaNovo: () => void;
  irParaConsultar: () => void;
  setEtapa: (e: Etapa) => void;

  // Ações do formulário
  setTipo: (t: TipoPortaria) => void;
  selecionarComite: (c: Comite | null) => void;
  setCampo: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  setMembros: (m: Membro[]) => void;
  addMembro: () => void;
  removeMembro: (id: string) => void;
  atualizarMembro: (id: string, patch: Partial<Membro>) => void;
  aplicarSugestaoCi: () => void;

  // Reset
  resetForm: () => void;

  // Config
  setConfig: (c: ConfiguracaoCGE | null) => void;

  // Consulta
  setCursoConsultaId: (id: string | null) => void;
}

const FORM_INICIAL: FormState = {
  tipo: null,
  comiteSelecionadoId: null,
  numeroPortaria: "",
  dataPortaria: "",
  curso: "",
  grau: "",
  unidade: "",
  ciNumero: "",
  ciArquivo: null,
  ciArquivoNome: null,
  sugestaoCi: null,
  membros: [],
  textoGerado: "",
  comiteSnapshot: null,
};

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export const useCge = create<CgeState>((set, get) => ({
  area: "inicio",
  etapa: 1,
  config: null,
  cursoConsultaId: null,
  ...FORM_INICIAL,

  setArea: (a) => set({ area: a }),
  irParaNovo: () =>
    set({ area: "novo", etapa: 1, ...FORM_INICIAL }),
  irParaConsultar: () => set({ area: "consultar", cursoConsultaId: null }),
  setEtapa: (e) => set({ etapa: e }),

  // setTipo apenas define o tipo. O avanço de etapa é controlado pelos
  // componentes (Tela 1 avança para Constituição; Alteração fica na Tela 1
  // para o usuário selecionar o comitê na lista).
  setTipo: (t) => set({ tipo: t }),
  selecionarComite: (c) => {
    if (!c) {
      set({
        comiteSelecionadoId: null,
        comiteSnapshot: null,
        curso: "",
        grau: "",
        unidade: "",
      });
      return;
    }
    // Pré-preenche curso/grau/unidade (bloqueados) e guarda o snapshot
    // com a portaria de constituição original (para a minuta de Alteração).
    set({
      comiteSelecionadoId: c.id,
      comiteSnapshot: c,
      curso: c.curso,
      grau: c.grau,
      unidade: c.unidadeUniversitaria,
      // Sugere os membros atuais como ponto de partida editável.
      membros: c.membros.map((m) => ({ ...m })),
    });
  },

  setCampo: (k, v) => set({ [k]: v } as Partial<CgeState>),

  setMembros: (m) => set({ membros: m }),
  addMembro: () =>
    set((s) => ({
      membros: [...s.membros, { id: uid(), nome: "", funcao: "Membro" }],
    })),
  removeMembro: (id) =>
    set((s) => ({ membros: s.membros.filter((m) => m.id !== id) })),
  atualizarMembro: (id, patch) =>
    set((s) => ({
      membros: s.membros.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    })),

  aplicarSugestaoCi: () => {
    const sug = get().sugestaoCi;
    if (!sug) return;
    const patch: Partial<FormState> = {};
    if (sug.ciNumero) patch.ciNumero = sug.ciNumero;
    if (sug.curso && !get().curso) patch.curso = sug.curso;
    if (sug.unidade && !get().unidade) patch.unidade = sug.unidade;
    if (sug.membros && sug.membros.length > 0) {
      patch.membros = sug.membros.map((m) => ({
        id: uid(),
        nome: m.nome,
        funcao: m.funcao as Membro["funcao"],
      }));
    }
    set(patch as Partial<CgeState>);
  },

  resetForm: () => set({ ...FORM_INICIAL, etapa: 1, tipo: null }),

  setConfig: (c) => set({ config: c }),
  setCursoConsultaId: (id) => set({ cursoConsultaId: id }),
}));
