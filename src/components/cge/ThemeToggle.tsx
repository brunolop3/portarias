"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

// ===========================================================================
// Botão de alternância de tema (claro/escuro).
// Usa next-themes para persistir a preferência em localStorage.
// ===========================================================================

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  // Inicia mostrando o ícone de "claro" (Moon, para alternar para escuro).
  // Após o primeiro clique, o theme é definido e o ícone se ajusta.
  // Isso evita hydration mismatch e setState em effect.
  const escuro = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(escuro ? "light" : "dark")}
      className="flex items-center justify-center h-8 w-8 rounded-md border border-white/15 text-white/60 hover:text-white hover:bg-white/5 transition-colors"
      title={escuro ? "Mudar para tema claro" : "Mudar para tema escuro"}
      aria-label={escuro ? "Ativar tema claro" : "Ativar tema escuro"}
    >
      {escuro ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
