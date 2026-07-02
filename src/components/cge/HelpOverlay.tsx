"use client";

import { useEffect } from "react";
import { create } from "zustand";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Keyboard, Search, FileText, ListChecks, Home, Settings, PlusCircle, ArrowLeft, HelpCircle } from "lucide-react";

// Store mínimo para controlar a abertura do overlay a partir de qualquer
// botão de gatilho (header) ou da tecla "?".
const useHelpStore = create<{ aberto: boolean; set: (v: boolean) => void }>((set) => ({
  aberto: false,
  set: (v) => set({ aberto: v }),
}));

// ===========================================================================
// Overlay de ajuda com todos os atalhos de teclado.
// Abre com a tecla "?" (quando não está em campo de texto) e fecha com Esc.
// ===========================================================================

interface Atalho {
  teclas: string[];
  descricao: string;
  icone: React.ComponentType<{ className?: string }>;
}

const ATALHOS_NAV: Atalho[] = [
  { teclas: ["g", "i"], descricao: "Ir para Início", icone: Home },
  { teclas: ["g", "n"], descricao: "Gerar nova Portaria", icone: PlusCircle },
  { teclas: ["g", "c"], descricao: "Comitês & Histórico", icone: ListChecks },
  { teclas: ["g", "s"], descricao: "Configurações", icone: Settings },
];

const ATALHOS_ACOES: Atalho[] = [
  { teclas: ["Ctrl", "K"], descricao: "Busca global (comitês e portarias)", icone: Search },
  { teclas: ["?"], descricao: "Mostrar esta ajuda", icone: Keyboard },
  { teclas: ["Esc"], descricao: "Fechar diálogo / overlay", icone: ArrowLeft },
];

export function HelpOverlay() {
  const aberto = useHelpStore((s) => s.aberto);
  const setAberto = useHelpStore((s) => s.set);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      const emCampo =
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.tagName === "SELECT" ||
          t.isContentEditable);
      if (emCampo) return;
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setAberto(!aberto);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [aberto, setAberto]);

  function Kbd({ teclas }: { teclas: string[] }) {
    return (
      <span className="flex items-center gap-1">
        {teclas.map((t, i) => (
          <span key={i} className="flex items-center gap-1">
            <kbd
              className="font-data text-xs bg-white border rounded px-1.5 py-0.5 text-[var(--color-ink)] shadow-sm"
              style={{ borderColor: "rgba(26,29,35,0.18)", minWidth: "1.5rem", textAlign: "center" }}
            >
              {t}
            </kbd>
            {i < teclas.length - 1 && <span className="text-[var(--color-ink-muted)] text-xs">+</span>}
          </span>
        ))}
      </span>
    );
  }

  return (
    <Dialog open={aberto} onOpenChange={(o) => setAberto(o)}>
      <DialogContent className="max-w-lg p-0 overflow-hidden cge-anim-in">
        <DialogHeader className="sr-only">
          <DialogTitle>Atalhos de teclado</DialogTitle>
          <DialogDescription>Lista de atalhos disponíveis na aplicação.</DialogDescription>
        </DialogHeader>
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#E6ECF5]">
              <Keyboard className="h-5 w-5 text-[var(--color-uems-navy)]" />
            </div>
            <div>
              <h2 className="font-display text-base text-[var(--color-ink)] leading-tight">
                Atalhos de teclado
              </h2>
              <p className="text-xs text-[var(--color-ink-muted)]">
                Pressione as teclas em sequência para navegar rapidamente.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <h3 className="text-[10px] uppercase tracking-wider text-[var(--color-ink-muted)] mb-2 font-medium">
                Navegação
              </h3>
              <ul className="space-y-2">
                {ATALHOS_NAV.map((a) => {
                  const Icon = a.icone;
                  return (
                    <li key={a.descricao} className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-sm text-[var(--color-ink)]">
                        <Icon className="h-4 w-4 text-[var(--color-ink-muted)]" />
                        {a.descricao}
                      </span>
                      <Kbd teclas={a.teclas} />
                    </li>
                  );
                })}
              </ul>
            </div>

            <div>
              <h3 className="text-[10px] uppercase tracking-wider text-[var(--color-ink-muted)] mb-2 font-medium">
                Ações
              </h3>
              <ul className="space-y-2">
                {ATALHOS_ACOES.map((a) => {
                  const Icon = a.icone;
                  return (
                    <li key={a.descricao} className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-sm text-[var(--color-ink)]">
                        <Icon className="h-4 w-4 text-[var(--color-ink-muted)]" />
                        {a.descricao}
                      </span>
                      <Kbd teclas={a.teclas} />
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t text-xs text-[var(--color-ink-muted)]" style={{ borderColor: "rgba(26,29,35,0.08)" }}>
            <p>
              Dica: os atalhos de navegação usam <strong>g</strong> como tecla modificadora.
              Pressione <strong>g</strong> e, em seguida, a letra da área desejada.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Botão de gatilho para o header — abre o overlay de ajuda.
export function HelpTrigger() {
  const set = useHelpStore((s) => s.set);
  return (
    <button
      type="button"
      onClick={() => set(true)}
      className="flex items-center justify-center h-8 w-8 rounded-md border border-white/15 text-white/60 hover:text-white hover:bg-white/5 transition-colors"
      title="Atalhos de teclado (?)"
      aria-label="Mostrar atalhos de teclado"
    >
      <HelpCircle className="h-4 w-4" />
    </button>
  );
}
