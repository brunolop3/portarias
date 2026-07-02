"use client";

import { useCge } from "@/lib/cge/store";
import { AppHeader, AppFooter } from "@/components/cge/AppShell";
import { Stepper } from "@/components/cge/Stepper";
import { TelaInicio } from "@/components/cge/TelaInicio";
import { Tela1Escolher } from "@/components/cge/Tela1Escolher";
import { Tela2Dados } from "@/components/cge/Tela2Dados";
import { Tela3Membros } from "@/components/cge/Tela3Membros";
import { Tela4Geracao } from "@/components/cge/Tela4Geracao";
import { Tela5Consultar } from "@/components/cge/Tela5Consultar";
import { TelaConfig } from "@/components/cge/TelaConfig";
import { TelaAlertas } from "@/components/cge/TelaAlertas";
import { TelaMetricas } from "@/components/cge/TelaMetricas";
import { ConfirmProvider } from "@/components/cge/ConfirmDialog";
import { KeyboardShortcuts } from "@/components/cge/KeyboardShortcuts";
import { HelpOverlay } from "@/components/cge/HelpOverlay";

// ===========================================================================
// Roteamento interno por estado (single-route app).
//   - "inicio": dashboard
//   - "novo": fluxo das Telas 1→4 (com Stepper)
//   - "consultar": Tela 5 (lista + página do curso)
//   - "config": configurações globais
// ===========================================================================

export default function Home() {
  const area = useCge((s) => s.area);
  const etapa = useCge((s) => s.etapa);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-paper)]">
      <KeyboardShortcuts />
      <AppHeader />
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
        {area === "inicio" && <TelaInicio />}

        {area === "novo" && (
          <div>
            <Stepper />
            {etapa === 1 && <Tela1Escolher />}
            {etapa === 2 && <Tela2Dados />}
            {etapa === 3 && <Tela3Membros />}
            {etapa === 4 && <Tela4Geracao />}
          </div>
        )}

        {area === "consultar" && <Tela5Consultar />}
        {area === "config" && <TelaConfig />}
        {area === "alertas" && <TelaAlertas />}
        {area === "metricas" && <TelaMetricas />}
      </main>
      <AppFooter />
      <ConfirmProvider />
      <HelpOverlay />
    </div>
  );
}
