"use client";

import { useEffect, useState } from "react";
import { useCge } from "@/lib/cge/store";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

// ===========================================================================
// Sino de notificações no cabeçalho.
// Mostra um badge com o número de alertas (mandatos vencendo/vencidos).
// Clique navega para a Tela de Alertas.
// ===========================================================================

export function NotificationBell() {
  const setArea = useCge((s) => s.setArea);
  const area = useCge((s) => s.area);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let cancelado = false;
    function carregar() {
      fetch("/api/cge/alertas")
        .then((r) => r.json())
        .then((d) => {
          if (!cancelado && typeof d.total === "number") setTotal(d.total);
        })
        .catch(() => {});
    }
    carregar();
    // Recarrega a cada 60s.
    const t = setInterval(carregar, 60000);
    return () => {
      cancelado = true;
      clearInterval(t);
    };
  }, []);

  const ativo = area === "alertas";

  return (
    <button
      type="button"
      onClick={() => setArea("alertas")}
      className={cn(
        "relative flex items-center justify-center h-8 w-8 rounded-md border transition-colors",
        ativo
          ? "border-white/40 text-white bg-white/10"
          : "border-white/15 text-white/60 hover:text-white hover:bg-white/5"
      )}
      title="Alertas de mandatos"
      aria-label="Ver alertas de mandatos"
    >
      <Bell className="h-4 w-4" />
      {total > 0 && (
        <span
          className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
          style={{ background: "var(--color-alert)" }}
        >
          {total > 9 ? "9+" : total}
        </span>
      )}
    </button>
  );
}
