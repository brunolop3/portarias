"use client";

import { useEffect } from "react";
import { useCge } from "@/lib/cge/store";

// ===========================================================================
// Atalhos de teclado globais (não interferem em campos de texto).
//   g i  → Início
//   g n  → Gerar Portaria (novo fluxo)
//   g c  → Comitês & Histórico
//   g s  → Configurações
//   ?    → mostra dica de atalhos (apenas console/placeholder; futuro: overlay)
//
// A busca global (Ctrl+K) é tratada no próprio GlobalSearch.
// ===========================================================================

export function KeyboardShortcuts() {
  const setArea = useCge((s) => s.setArea);
  const irParaNovo = useCge((s) => s.irParaNovo);
  const irParaConsultar = useCge((s) => s.irParaConsultar);

  useEffect(() => {
    let esperandoG = false;
    let timeoutG: ReturnType<typeof setTimeout> | null = null;

    function handler(e: KeyboardEvent) {
      // Ignora se o foco está em campo editável.
      const t = e.target as HTMLElement;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.tagName === "SELECT" ||
          t.isContentEditable)
      ) {
        return;
      }
      // Ignora se algum modificador está pressionado (exceto para combos próprios).
      if (e.altKey || e.metaKey) return;

      // Sequência "g <letra>".
      if (e.key.toLowerCase() === "g" && !esperandoG) {
        esperandoG = true;
        if (timeoutG) clearTimeout(timeoutG);
        timeoutG = setTimeout(() => {
          esperandoG = false;
        }, 700);
        return;
      }
      if (esperandoG) {
        esperandoG = false;
        if (timeoutG) clearTimeout(timeoutG);
        const k = e.key.toLowerCase();
        if (k === "i") {
          e.preventDefault();
          setArea("inicio");
        } else if (k === "n") {
          e.preventDefault();
          irParaNovo();
        } else if (k === "c") {
          e.preventDefault();
          irParaConsultar();
        } else if (k === "s") {
          e.preventDefault();
          setArea("config");
        }
        return;
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setArea, irParaNovo, irParaConsultar]);

  return null;
}
