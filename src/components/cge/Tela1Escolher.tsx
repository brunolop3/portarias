"use client";

import { useCge } from "@/lib/cge/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FilePlus2, FileEdit, Search, ChevronRight, Users } from "lucide-react";
import { useEffect, useState } from "react";
import type { Comite } from "@/lib/cge/types";
import { dataCurta, situacaoDoComite } from "@/lib/cge/datas";
import { cn } from "@/lib/utils";

// ===========================================================================
// Tela 1 — Escolher tipo de operação.
//   - "Constituir novo Comitê" → segue direto para a Tela 2.
//   - "Alterar Comitê existente" → lista/busca comitês; ao selecionar,
//     auto-preenche número e data da Portaria de Constituição original.
// ===========================================================================

export function Tela1Escolher() {
  const tipo = useCge((s) => s.tipo);
  const setTipo = useCge((s) => s.setTipo);
  const selecionarComite = useCge((s) => s.selecionarComite);
  const setEtapa = useCge((s) => s.setEtapa);
  const irParaConsultar = useCge((s) => s.irParaConsultar);

  const [comites, setComites] = useState<Comite[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/cge/comites")
      .then(async (r) => {
        const d = await r.json();
        if (Array.isArray(d)) {
          setComites(d);
          setErro(null);
        } else {
          setErro(d.error || "Erro ao carregar comitês.");
        }
      })
      .catch(() => setErro("Falha de rede ao carregar comitês."))
      .finally(() => setLoading(false));
  }, []);

  const filtrados = comites.filter((c) => {
    const q = busca.trim().toLowerCase();
    if (!q) return true;
    return (
      c.curso.toLowerCase().includes(q) ||
      c.unidadeUniversitaria.toLowerCase().includes(q)
    );
  });

  function handleSelecionar(c: Comite) {
    selecionarComite(c);
    setTipo("Alteração");
    setEtapa(2);
  }

  // Para Constituição: define o tipo e avança direto para a Tela 2.
  function handleConstituir() {
    setTipo("Constituição");
    setEtapa(2);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-[var(--color-ink)]">Nova Portaria</h1>
        <p className="text-sm text-[var(--color-ink-muted)] mt-1">
          Selecione o tipo de operação para iniciar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Constituir */}
        <button
          type="button"
          onClick={handleConstituir}
          className={cn(
            "text-left rounded-md border bg-card p-5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-uems-navy)]",
            tipo === "Constituição"
              ? "border-[var(--color-uems-navy)] ring-1 ring-[var(--color-uems-navy)]"
              : "hover:border-[var(--color-uems-navy)]"
          )}
          style={tipo === "Constituição" ? undefined : { borderColor: "rgba(26,29,35,0.12)" }}
        >
          <div className="flex items-start gap-3">
            <FilePlus2 className="h-6 w-6 text-[var(--color-uems-navy)] flex-shrink-0" />
            <div>
              <h2 className="font-display text-lg text-[var(--color-ink)]">Constituir novo Comitê</h2>
              <p className="text-sm text-[var(--color-ink-muted)] mt-1 leading-relaxed">
                Primeira formação do CGE de um curso. Gera a Portaria de Constituição
                com mandato de 2 anos.
              </p>
            </div>
          </div>
        </button>

        {/* Alterar */}
        <button
          type="button"
          onClick={() => setTipo("Alteração")}
          className={cn(
            "text-left rounded-md border bg-card p-5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-uems-navy)]",
            tipo === "Alteração"
              ? "border-[var(--color-uems-navy)] ring-1 ring-[var(--color-uems-navy)]"
              : "hover:border-[var(--color-uems-navy)]"
          )}
          style={tipo === "Alteração" ? undefined : { borderColor: "rgba(26,29,35,0.12)" }}
        >
          <div className="flex items-start gap-3">
            <FileEdit className="h-6 w-6 text-[var(--color-uems-navy)] flex-shrink-0" />
            <div>
              <h2 className="font-display text-lg text-[var(--color-ink)]">Alterar Comitê existente</h2>
              <p className="text-sm text-[var(--color-ink-muted)] mt-1 leading-relaxed">
                Troca de membros de um comitê já constituído. O sistema traz
                automaticamente a Portaria de Constituição original.
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Se escolheu Constituição, mostra botão para avançar */}
      {tipo === "Constituição" && (
        <div className="flex justify-end">
          <Button
            onClick={() => setEtapa(2)}
            className="bg-[var(--color-uems-navy)] hover:bg-[var(--color-uems-navy-deep)] text-white"
          >
            Avançar <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Se escolheu Alteração, mostra a lista de comitês */}
      {tipo === "Alteração" && (
        <Card className="rounded-md border" style={{ borderColor: "rgba(26,29,35,0.12)" }}>
          <div className="p-4 border-b" style={{ borderColor: "rgba(26,29,35,0.08)" }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-base text-[var(--color-ink)]">Selecione o comitê a alterar</h3>
                <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                  A Portaria de Constituição original (número e data) será preenchida automaticamente.
                </p>
              </div>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]" />
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por curso ou unidade..."
                  className="w-full sm:w-72 pl-8 pr-3 py-2 text-sm rounded-md border bg-card focus:outline-none focus:ring-1 focus:ring-[var(--color-uems-navy)]"
                  style={{ borderColor: "rgba(26,29,35,0.16)" }}
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-[var(--color-ink-muted)]">Carregando comitês...</div>
          ) : erro ? (
            <div className="p-8 text-center text-sm text-[var(--color-alert)]">{erro}</div>
          ) : filtrados.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-8 w-8 mx-auto text-[var(--color-ink-muted)] mb-2" />
              <p className="text-sm text-[var(--color-ink-muted)]">
                {comites.length === 0
                  ? "Nenhum comitê cadastrado ainda. Constitua um novo comitê primeiro."
                  : "Nenhum comitê encontrado para a busca."}
              </p>
              {comites.length === 0 && (
                <Button
                  variant="outline"
                  className="mt-3 border-[rgba(26,29,35,0.2)]"
                  onClick={() => setTipo("Constituição")}
                >
                  Constituir novo comitê
                </Button>
              )}
            </div>
          ) : (
            <ul className="divide-y max-h-96 overflow-y-auto scroll-thin" style={{ borderColor: "rgba(26,29,35,0.08)" }}>
              {filtrados.map((c) => {
                const sit = situacaoDoComite(c.status, c.portariaConstituicaoData);
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => handleSelecionar(c)}
                      className="w-full text-left p-4 hover:bg-[var(--color-paper)] transition-colors focus:outline-none focus-visible:bg-[var(--color-paper)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-[var(--color-ink)] truncate">
                            {c.curso} <span className="text-[var(--color-ink-muted)] font-normal">· {c.grau}</span>
                          </p>
                          <p className="text-xs text-[var(--color-ink-muted)] mt-0.5 truncate">
                            {c.unidadeUniversitaria}
                          </p>
                          <p className="text-xs text-[var(--color-ink-muted)] mt-1 font-data">
                            Constituído pela Portaria PROE-UEMS n.º {c.portariaConstituicaoNumero}, de {dataCurta(c.portariaConstituicaoData)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <BadgeSituacao sit={sit} />
                          <ChevronRight className="h-4 w-4 text-[var(--color-ink-muted)]" />
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="p-3 border-t text-right" style={{ borderColor: "rgba(26,29,35,0.08)" }}>
            <Button variant="ghost" size="sm" onClick={irParaConsultar} className="text-[var(--color-ink-muted)]">
              Ver página de consulta completa
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function BadgeSituacao({ sit }: { sit: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    ativo: { label: "Ativo", cls: "bg-[#E6F0EA] text-[#1f6b3a]" },
    vencendo: { label: "Vencendo", cls: "bg-[#FBF6E6] text-[#8a6d12]" },
    vencido: { label: "Vencido", cls: "bg-[#FBEDED] text-[var(--color-alert)]" },
    encerrado: { label: "Encerrado", cls: "bg-[#EFEFEC] text-[var(--color-ink-muted)]" },
    sem_comite: { label: "Sem comitê", cls: "bg-[#EFEFEC] text-[var(--color-ink-muted)]" },
  };
  const m = map[sit] || map.ativo;
  return (
    <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded uppercase tracking-wide", m.cls)}>
      {m.label}
    </span>
  );
}
