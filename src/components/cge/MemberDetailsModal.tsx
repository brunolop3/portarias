"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Users, FileText, MapPin, Calendar, Award, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { dataPorExtenso } from "@/lib/cge/datas";

// ===========================================================================
// Modal de detalhes de um membro — mostra o histórico de participações
// em comitês (atuais e históricas, via snapshots das portarias).
// ===========================================================================

interface Participacao {
  comiteId: string;
  curso: string;
  unidade: string;
  grau: string;
  funcao: string;
  origem: "atual" | "historica";
  dataPortaria?: string;
  dataPortariaFormatada?: string;
  tipoPortaria?: string;
  numeroPortaria?: string;
}

interface MembroDetalhes {
  nome: string;
  totalComites: number;
  totalParticipacoes: number;
  funcoes: { funcao: string; total: number }[];
  participacoes: Participacao[];
}

type EstadoModal = "idle" | "loading" | "ok" | "erro";

export function MemberDetailsModal({
  nome,
  aberto,
  onFechar,
  onNavigateToComite,
}: {
  nome: string | null;
  aberto: boolean;
  onFechar: () => void;
  onNavigateToComite?: (comiteId: string) => void;
}) {
  // Estado unificado para evitar setState síncrono em effect.
  const [estado, setEstado] = useState<EstadoModal>("idle");
  const [dados, setDados] = useState<MembroDetalhes | null>(null);
  const [erroMsg, setErroMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!nome || !aberto) return;
    let cancelado = false;
    // Inicia o fetch imediatamente (sem setState síncrono no corpo do effect).
    const promise = fetch(`/api/cge/membro/${encodeURIComponent(nome)}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Falha ao carregar.");
        return d as MembroDetalhes;
      });

    // Marca como loading no próximo tick (evita warning de setState em effect).
    Promise.resolve().then(() => {
      if (!cancelado) {
        setEstado("loading");
        setDados(null);
        setErroMsg(null);
      }
    });

    promise
      .then((d) => {
        if (!cancelado) {
          setDados(d);
          setEstado("ok");
        }
      })
      .catch((e) => {
        if (!cancelado) {
          setErroMsg((e as Error).message);
          setEstado("erro");
        }
      });

    return () => {
      cancelado = true;
    };
  }, [nome, aberto]);

  const loading = estado === "loading";

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 overflow-hidden flex flex-col gap-0 bg-background">
        <DialogHeader className="px-5 py-4 border-b bg-[var(--color-paper)]" style={{ borderColor: "rgba(26,29,35,0.1)" }}>
          <DialogTitle className="font-display text-lg text-[var(--color-ink)] flex items-center gap-2">
            <Users className="h-5 w-5 text-[var(--color-uems-navy)]" />
            {nome || "Membro"}
          </DialogTitle>
          <DialogDescription className="text-xs text-[var(--color-ink-muted)]">
            Histórico de participações em Comitês de Gestão do Enade
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto scroll-thin">
          {loading ? (
            <div className="p-10 text-center">
              <div className="inline-block h-6 w-6 border-2 border-[var(--color-uems-navy)] border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm text-[var(--color-ink-muted)]">Carregando histórico…</p>
            </div>
          ) : estado === "erro" ? (
            <div className="p-8 text-center">
              <p className="text-sm text-[var(--color-alert)]">{erroMsg}</p>
            </div>
          ) : !dados ? (
            <div className="p-8 text-center text-sm text-[var(--color-ink-muted)]">Nenhum dado.</div>
          ) : dados.totalParticipacoes === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-8 w-8 mx-auto text-[var(--color-ink-muted)]/40 mb-2" />
              <p className="text-sm text-[var(--color-ink-muted)]">
                Nenhuma participação encontrada para <strong>{dados.nome}</strong>.
              </p>
            </div>
          ) : (
            <div className="p-5 space-y-4">
              {/* Resumo */}
              <div className="grid grid-cols-3 gap-3">
                <ResumoCard label="Comitês" valor={dados.totalComites} />
                <ResumoCard label="Participações" valor={dados.totalParticipacoes} />
                <ResumoCard label="Funções distintas" valor={dados.funcoes.length} />
              </div>

              {/* Funções exercidas */}
              {dados.funcoes.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {dados.funcoes.map((f) => (
                    <span
                      key={f.funcao}
                      className={cn(
                        "text-[11px] px-2 py-1 rounded-md border",
                        f.funcao === "Presidente"
                          ? "bg-[#FBF6E6] text-[#8a6d12] border-[#8a6d12]/20"
                          : f.funcao.includes("Coordenador")
                          ? "bg-[#E6ECF5] text-[var(--color-uems-navy)] border-[var(--color-uems-navy)]/20"
                          : "bg-[var(--color-paper)] text-[var(--color-ink-muted)] border-[rgba(26,29,35,0.1)]"
                      )}
                    >
                      {f.funcao} · {f.total}x
                    </span>
                  ))}
                </div>
              )}

              {/* Linha do tempo de participações */}
              <div>
                <h3 className="text-[10px] uppercase tracking-wider text-[var(--color-ink-muted)] mb-2 font-medium">
                  Participações
                </h3>
                <ul className="space-y-2">
                  {dados.participacoes.map((p, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        disabled={!onNavigateToComite}
                        onClick={() => onNavigateToComite?.(p.comiteId)}
                        className={cn(
                          "w-full text-left rounded-md border p-3 transition-colors",
                          onNavigateToComite
                            ? "hover:border-[var(--color-uems-navy)] cursor-pointer"
                            : "cursor-default"
                        )}
                        style={{
                          borderColor: p.origem === "atual" ? "var(--color-uems-navy)" : "rgba(26,29,35,0.1)",
                          background: p.origem === "atual" ? "#F4F7FC" : "var(--color-paper)",
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className={cn(
                                "text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wide",
                                p.funcao === "Presidente"
                                  ? "bg-[#FBF6E6] text-[#8a6d12]"
                                  : p.funcao.includes("Coordenador")
                                  ? "bg-[#E6ECF5] text-[var(--color-uems-navy)]"
                                  : "bg-card text-[var(--color-ink-muted)]"
                              )}>
                                {p.funcao}
                              </span>
                              {p.origem === "atual" && (
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wide bg-[#E6F0EA] text-[#1f6b3a]">
                                  Em exercício
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-medium text-[var(--color-ink)] truncate">
                              {p.curso}
                            </p>
                            <p className="text-xs text-[var(--color-ink-muted)] flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3" /> {p.unidade}
                              <span className="mx-1">·</span>
                              <span className="capitalize">{p.grau}</span>
                            </p>
                          </div>
                          {p.origem === "historica" && p.dataPortariaFormatada && (
                            <div className="text-right flex-shrink-0">
                              <p className="text-[11px] text-[var(--color-ink-muted)] font-data flex items-center gap-1 justify-end">
                                <Calendar className="h-3 w-3" /> {p.dataPortariaFormatada}
                              </p>
                              <p className="text-[10px] text-[var(--color-ink-muted)] mt-0.5">
                                Portaria n.º {p.numeroPortaria}
                              </p>
                            </div>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ResumoCard({ label, valor }: { label: string; valor: number }) {
  return (
    <div className="rounded-md border p-3 text-center" style={{ borderColor: "rgba(26,29,35,0.1)", background: "var(--card)" }}>
      <p className="font-display text-2xl text-[var(--color-uems-navy)]">{valor}</p>
      <p className="text-[10px] uppercase tracking-wide text-[var(--color-ink-muted)] mt-0.5">{label}</p>
    </div>
  );
}
