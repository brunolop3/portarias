"use client";

import { useCge, type Etapa } from "@/lib/cge/store";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const ETAPAS: { n: Etapa; label: string }[] = [
  { n: 1, label: "Operação" },
  { n: 2, label: "Dados da Portaria" },
  { n: 3, label: "Membros" },
  { n: 4, label: "Gerar & Exportar" },
];

// Indicador de progresso do fluxo (Tela 1 → 4). Mostra a etapa atual e
// permite voltar clicando (desde que os dados mínimos existam).
export function Stepper() {
  const etapa = useCge((s) => s.etapa);
  const setEtapa = useCge((s) => s.setEtapa);
  const tipo = useCge((s) => s.tipo);

  return (
    <ol className="flex items-center w-full mb-6 select-none">
      {ETAPAS.map((e, i) => {
        const ativa = etapa === e.n;
        const concluida = etapa > e.n;
        const podeIr = e.n === 1 || (e.n === 2 && !!tipo) || (e.n === 3 && !!tipo);
        return (
          <li key={e.n} className="flex items-center flex-1 last:flex-none">
            <button
              type="button"
              disabled={!podeIr}
              onClick={() => podeIr && setEtapa(e.n)}
              className={cn(
                "flex items-center gap-2 group",
                podeIr ? "cursor-pointer" : "cursor-not-allowed"
              )}
              aria-current={ativa ? "step" : undefined}
            >
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-data transition-colors",
                  ativa && "bg-[var(--color-uems-navy)] text-white border-[var(--color-uems-navy)]",
                  concluida && "bg-[var(--color-uems-gold)] text-[var(--color-uems-navy-deep)] border-[var(--color-uems-gold)]",
                  !ativa && !concluida && "bg-card text-[var(--color-ink-muted)] border-[rgba(26,29,35,0.2)]"
                )}
              >
                {concluida ? <Check className="h-3.5 w-3.5" /> : e.n}
              </span>
              <span
                className={cn(
                  "text-sm hidden sm:inline",
                  ativa ? "text-[var(--color-ink)] font-medium" : "text-[var(--color-ink-muted)]"
                )}
              >
                {e.label}
              </span>
            </button>
            {i < ETAPAS.length - 1 && (
              <span
                className={cn(
                  "h-px flex-1 mx-2 sm:mx-3",
                  etapa > e.n ? "bg-[var(--color-uems-gold)]" : "bg-[rgba(26,29,35,0.15)]"
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
