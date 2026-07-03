"use client";

import { create } from "zustand";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info, AlertCircle } from "lucide-react";

// ===========================================================================
// Sistema global de diálogo de confirmação.
// Substitui o confirm() nativo do navegador por um modal institucional
// estilizado, com suporte a variantes (perigo, aviso, info), título,
// descrição, e botões customizáveis.
//
// Uso:
//   const confirmar = useConfirm();
//   const ok = await confirmar({
//     titulo: "Encerrar comitê?",
//     descricao: "O histórico será mantido...",
//     variant: "danger",
//     confirmLabel: "Encerrar",
//   });
//   if (ok) { ... }
// ===========================================================================

type Variant = "danger" | "warning" | "info";

interface ConfirmOptions {
  titulo: string;
  descricao?: string;
  variant?: Variant;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Segunda confirmação (digite algo) para ações muito destrutivas. */
  exigirDigitacao?: string;
}

interface ConfirmState {
  aberto: boolean;
  opts: ConfirmOptions;
  resolve: ((v: boolean) => void) | null;
  textoDigitado: string;
  abrir: (opts: ConfirmOptions) => Promise<boolean>;
  fechar: (resultado: boolean) => void;
  setTexto: (t: string) => void;
}

const useConfirmStore = create<ConfirmState>((set, get) => ({
  aberto: false,
  opts: { titulo: "" },
  resolve: null,
  textoDigitado: "",
  abrir: (opts) =>
    new Promise<boolean>((resolve) => {
      set({ aberto: true, opts, resolve, textoDigitado: "" });
    }),
  fechar: (resultado) => {
    const r = get().resolve;
    set({ aberto: false, resolve: null, textoDigitado: "" });
    r?.(resultado);
  },
  setTexto: (t) => set({ textoDigitado: t }),
}));

// Hook para disparar confirmações.
export function useConfirm() {
  return useConfirmStore((s) => s.abrir);
}

// Componente que renderiza o modal — deve ser montado uma única vez no root.
export function ConfirmProvider() {
  const { aberto, opts, fechar, textoDigitado, setTexto } = useConfirmStore();
  const variant = opts.variant ?? "warning";
  const exigirDig = opts.exigirDigitacao;
  const podeConfirmar = !exigirDig || textoDigitado.trim() === exigirDig;

  const iconConfig = {
    danger: { Icon: AlertTriangle, color: "var(--color-alert)", bg: "#FDF3F2" },
    warning: { Icon: AlertTriangle, color: "#8a6d12", bg: "#FBF6E6" },
    info: { Icon: Info, color: "var(--color-uems-navy)", bg: "#E6ECF5" },
  }[variant];

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && fechar(false)}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-background">
        <DialogHeader className="sr-only">
          <DialogTitle>{opts.titulo}</DialogTitle>
          <DialogDescription>{opts.descricao}</DialogDescription>
        </DialogHeader>
        <div className="p-5">
          <div className="flex gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-md flex-shrink-0"
              style={{ background: iconConfig.bg }}
            >
              <iconConfig.Icon className="h-5 w-5" style={{ color: iconConfig.color }} />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-base text-[var(--color-ink)] leading-tight">
                {opts.titulo}
              </h2>
              {opts.descricao && (
                <p className="text-sm text-[var(--color-ink-muted)] mt-1.5 leading-relaxed">
                  {opts.descricao}
                </p>
              )}
            </div>
          </div>

          {exigirDig && (
            <div className="mt-4">
              <p className="text-xs text-[var(--color-ink-muted)] mb-1.5">
                Para confirmar, digite <strong className="text-[var(--color-ink)]">{exigirDig}</strong>:
              </p>
              <input
                value={textoDigitado}
                onChange={(e) => setTexto(e.target.value)}
                autoFocus
                className="w-full rounded-md border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-uems-navy)] font-data"
                style={{ borderColor: "rgba(26,29,35,0.16)" }}
                placeholder={exigirDig}
              />
            </div>
          )}
        </div>
        <DialogFooter className="px-5 py-3 border-t bg-[var(--color-paper)] flex-row justify-end gap-2" style={{ borderColor: "rgba(26,29,35,0.08)" }}>
          <Button
            variant="outline"
            onClick={() => fechar(false)}
            className="border-[rgba(26,29,35,0.2)]"
          >
            {opts.cancelLabel ?? "Cancelar"}
          </Button>
          <Button
            onClick={() => fechar(true)}
            disabled={!podeConfirmar}
            className={
              variant === "danger"
                ? "bg-[var(--color-alert)] hover:bg-[#8a1e18] text-white disabled:opacity-50"
                : "bg-[var(--color-uems-navy)] hover:bg-[var(--color-uems-navy-deep)] text-white disabled:opacity-50"
            }
          >
            {opts.confirmLabel ?? "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
