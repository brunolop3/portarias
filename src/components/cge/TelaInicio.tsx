"use client";

import { useCge } from "@/lib/cge/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, ListChecks, Settings, FileText, BookOpen, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import type { Comite } from "@/lib/cge/types";

// ===========================================================================
// Tela inicial (dashboard). Apresenta o sistema e atalhos para as 3 áreas.
// ===========================================================================

export function TelaInicio() {
  const irParaNovo = useCge((s) => s.irParaNovo);
  const irParaConsultar = useCge((s) => s.irParaConsultar);
  const setArea = useCge((s) => s.setArea);
  const [comites, setComites] = useState<Comite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cge/comites")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setComites(d);
      })
      .finally(() => setLoading(false));
  }, []);

  const ativos = comites.filter((c) => c.status === "ativo").length;

  return (
    <div className="space-y-8">
      {/* Hero institucional */}
      <section className="rounded-md border bg-white p-6 sm:p-8"
        style={{ borderColor: "rgba(26,29,35,0.12)" }}>
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wider text-[var(--color-ink-muted)] mb-2 font-data">
              PROE · DIGES · UEMS
            </p>
            <h1 className="font-display text-2xl sm:text-3xl text-[var(--color-ink)] leading-tight">
              Geração de Portarias dos Comitês de Gestão do Enade
            </h1>
            <p className="mt-3 text-[var(--color-ink-muted)] max-w-2xl leading-relaxed">
              Registre a constituição e a alteração dos CGE de cada curso e gere
              automaticamente a minuta da Portaria, pronta para encaminhamento ao
              Diário Oficial. Importe a CI da Coordenação do Curso e mantenha o
              histórico completo de cada comitê.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={irParaNovo} className="bg-[var(--color-uems-navy)] hover:bg-[var(--color-uems-navy-deep)] text-white">
                <PlusCircle className="h-4 w-4 mr-2" /> Gerar nova Portaria
              </Button>
              <Button variant="outline" onClick={irParaConsultar}
                className="border-[rgba(26,29,35,0.2)] text-[var(--color-ink)] hover:bg-[var(--color-muted)]">
                <ListChecks className="h-4 w-4 mr-2" /> Consultar comitês
              </Button>
            </div>
          </div>
          <div className="lg:w-64 flex-shrink-0">
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-4 border rounded-md" style={{ borderColor: "rgba(26,29,35,0.12)" }}>
                <p className="text-xs text-[var(--color-ink-muted)]">Comitês cadastrados</p>
                <p className="font-display text-3xl text-[var(--color-uems-navy)] mt-1">
                  {loading ? "—" : comites.length}
                </p>
              </Card>
              <Card className="p-4 border rounded-md" style={{ borderColor: "rgba(26,29,35,0.12)" }}>
                <p className="text-xs text-[var(--color-ink-muted)]">Ativos</p>
                <p className="font-display text-3xl text-[var(--color-uems-navy)] mt-1">
                  {loading ? "—" : ativos}
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Atalhos */}
      <section>
        <h2 className="font-display text-lg text-[var(--color-ink)] mb-4">Atalhos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Atalho
            icon={<PlusCircle className="h-5 w-5" />}
            titulo="Constituir / Alterar comitê"
            desc="Inicie o fluxo de geração de minuta. Importe a CI, informe os membros e exporte a Portaria."
            onClick={irParaNovo}
          />
          <Atalho
            icon={<ListChecks className="h-5 w-5" />}
            titulo="Comitês & Histórico"
            desc="Consulte por curso/unidade, veja o comitê atual e a linha do tempo de todas as portarias geradas."
            onClick={irParaConsultar}
          />
          <Atalho
            icon={<Settings className="h-5 w-5" />}
            titulo="Configurações"
            desc="Edite os textos fixos das portarias (resoluções homologatórias, signatário, delegação de competência)."
            onClick={() => setArea("config")}
          />
        </div>
      </section>

      {/* Resumo normativo */}
      <section className="rounded-md border bg-[var(--color-paper)] p-5 sm:p-6"
        style={{ borderColor: "rgba(26,29,35,0.12)" }}>
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-[var(--color-uems-navy)] flex-shrink-0 mt-0.5" />
          <div className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
            <p className="font-medium text-[var(--color-ink)] mb-1">Base normativa vigente</p>
            <p>
              Os textos das minutas seguem a Deliberação CE/CEPE-UEMS Nº 431 (Política de Gestão
              do Enade) e Nº 432 (Regulamento dos Comitês), homologadas pelas Resoluções
              CEPE-UEMS N.º 3.136 e 3.137, de 16 de junho de 2026. Quórum: 3 a 5 membros,
              incluindo o coordenador (membro nato), com 1 Presidente eleito.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function Atalho({
  icon,
  titulo,
  desc,
  onClick,
}: {
  icon: React.ReactNode;
  titulo: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left rounded-md border bg-white p-5 transition-colors hover:border-[var(--color-uems-navy)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-uems-navy)]"
      style={{ borderColor: "rgba(26,29,35,0.12)" }}
    >
      <div className="flex items-center gap-2 text-[var(--color-uems-navy)] mb-2">
        {icon}
        <span className="font-display text-base text-[var(--color-ink)]">{titulo}</span>
      </div>
      <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">{desc}</p>
    </button>
  );
}
