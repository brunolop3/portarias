"use client";

import { useCge, type Area } from "@/lib/cge/store";
import { FileText, ListChecks, Settings, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlobalSearch } from "@/components/cge/GlobalSearch";
import { HelpTrigger } from "@/components/cge/HelpOverlay";

// ===========================================================================
// Cabeçalho institucional: faixa navy sólida com DIGES em serifada dourada.
// A logo completa (preto sobre transparente) só aparece em fundos claros,
// por isso no cabeçalho navy usamos apenas o texto "DIGES" em serifada.
// ===========================================================================

interface NavItem {
  area: Area;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV: NavItem[] = [
  { area: "inicio", label: "Início", icon: FileText },
  { area: "novo", label: "Gerar Portaria", icon: PlusCircle },
  { area: "consultar", label: "Comitês & Histórico", icon: ListChecks },
  { area: "config", label: "Configurações", icon: Settings },
];

export function AppHeader() {
  const area = useCge((s) => s.area);
  const setArea = useCge((s) => s.setArea);
  const irParaNovo = useCge((s) => s.irParaNovo);
  const irParaConsultar = useCge((s) => s.irParaConsultar);

  function handleClick(item: NavItem) {
    if (item.area === "novo") irParaNovo();
    else if (item.area === "consultar") irParaConsultar();
    else setArea(item.area);
  }

  return (
    <header
      className="w-full sticky top-0 z-30 shadow-sm"
      style={{ background: "var(--color-uems-navy)", color: "#fff" }}
    >
      {/* Faixa dourada fina no topo — acento institucional */}
      <div className="h-0.5" style={{ background: "var(--color-uems-gold)" }} />
      {/* Linha superior: selo institucional */}
      <div className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-2 flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-3 min-w-0">
            <span className="font-display text-xl sm:text-2xl tracking-wide whitespace-nowrap"
              style={{ color: "var(--color-uems-gold)" }}>
              DIGES
            </span>
            <span className="text-[11px] sm:text-xs text-white/70 leading-tight truncate">
              Diretoria de Gestão do Ensino · PROE/UEMS
            </span>
          </div>
          <span className="hidden sm:inline text-[11px] text-white/50 font-data whitespace-nowrap">
            Portarias do CGE
          </span>
          <GlobalSearch />
          <HelpTrigger />
        </div>
      </div>

      {/* Navegação principal */}
      <nav className="mx-auto max-w-6xl px-2 sm:px-6">
        <ul className="flex items-stretch overflow-x-auto scroll-thin">
          {NAV.map((item) => {
            const Icon = item.icon;
            const ativo = area === item.area;
            return (
              <li key={item.area} className="flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleClick(item)}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-3 text-sm transition-colors",
                    "hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-uems-gold)]",
                    ativo ? "text-white" : "text-white/70 hover:text-white"
                  )}
                  aria-current={ativo ? "page" : undefined}
                >
                  <Icon className={cn("h-4 w-4 transition-transform", ativo && "scale-110")} aria-hidden />
                  <span className="whitespace-nowrap">{item.label}</span>
                  {ativo && <span className="nav-active-bar" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}

export function AppFooter() {
  return (
    <footer
      className="mt-auto border-t"
      style={{
        background: "var(--color-paper)",
        borderColor: "rgba(26,29,35,0.10)",
      }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Apenas o texto "DIGES" em dourado — sem logo (sem contraste sobre fundo claro) */}
          <span
            className="font-display text-xl tracking-wide"
            style={{ color: "var(--color-uems-gold)" }}
          >
            DIGES
          </span>
          <span className="hidden sm:inline text-[10px] uppercase tracking-wide text-[var(--color-ink-muted)] leading-tight">
            Diretoria de Gestão<br />do Ensino · PROE/UEMS
          </span>
        </div>
        <p className="text-xs text-[var(--color-ink-muted)] leading-snug max-w-md">
          Universidade Estadual de Mato Grosso do Sul · Pró-Reitoria de Ensino (PROE) ·
          Diretoria de Gestão do Ensino (DIGES). Sistema interno de geração de Portarias do CGE.
        </p>
      </div>
    </footer>
  );
}
