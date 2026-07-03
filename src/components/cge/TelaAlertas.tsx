"use client";

import { useEffect, useState } from "react";
import { useCge } from "@/lib/cge/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle, CalendarClock, CheckCircle2, FileText,
  Users, GraduationCap, Building2, ChevronRight, Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { dataCurta } from "@/lib/cge/datas";

// ===========================================================================
// Tela de Alertas — centraliza mandatos vencidos e vencendo (<= 90 dias).
// Acessível pelo cabeçalho (sino) quando há alertas, ou via atalho/área.
// ===========================================================================

interface Alerta {
  id: string;
  curso: string;
  grau: string;
  unidade: string;
  portariaConstituicaoNumero: string;
  portariaConstituicaoData: string;
  terminoMandato: string;
  terminoFormatado: string;
  dias: number;
  situacao: string;
  totalMembros: number;
}

interface AlertasData {
  total: number;
  vencidos: number;
  vencendo: number;
  alertas: Alerta[];
}

export function TelaAlertas() {
  const setCursoConsultaId = useCge((s) => s.setCursoConsultaId);
  const irParaConsultar = useCge((s) => s.irParaConsultar);
  const [data, setData] = useState<AlertasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/cge/alertas")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Erro ao carregar.");
        setData(d);
      })
      .catch((e) => setErro((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  function verComite(id: string) {
    setCursoConsultaId(id);
    useCge.setState({ area: "consultar" });
  }

  if (loading) {
    return (
      <div className="p-10 text-center text-sm text-[var(--color-ink-muted)]">
        Carregando alertas...
      </div>
    );
  }

  if (erro) {
    return (
      <div className="p-10 text-center">
        <p className="text-sm text-[var(--color-alert)] mb-4">{erro}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-[var(--color-ink)] flex items-center gap-2">
          <Bell className="h-6 w-6 text-[var(--color-uems-navy)]" />
          Alertas de mandatos
        </h1>
        <p className="text-sm text-[var(--color-ink-muted)] mt-1">
          Comitês ativos com mandato vencido ou próximo do fim (90 dias).
        </p>
      </div>

      {/* Resumo */}
      {data && data.total > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="rounded-md border p-4" style={{ borderColor: "rgba(26,29,35,0.12)" }}>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-[var(--color-alert)]" />
              <span className="text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">Total de alertas</span>
            </div>
            <p className="font-display text-3xl text-[var(--color-alert)]">{data.total}</p>
          </Card>
          <Card className="rounded-md border p-4" style={{ borderColor: "rgba(26,29,35,0.12)" }}>
            <div className="flex items-center gap-2 mb-1">
              <CalendarClock className="h-4 w-4 text-[var(--color-alert)]" />
              <span className="text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">Vencidos</span>
            </div>
            <p className="font-display text-3xl text-[var(--color-alert)]">{data.vencidos}</p>
          </Card>
          <Card className="rounded-md border p-4" style={{ borderColor: "rgba(26,29,35,0.12)" }}>
            <div className="flex items-center gap-2 mb-1">
              <CalendarClock className="h-4 w-4 text-[#8a6d12]" />
              <span className="text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">Vencendo (90d)</span>
            </div>
            <p className="font-display text-3xl text-[#8a6d12]">{data.vencendo}</p>
          </Card>
        </div>
      )}

      {/* Lista de alertas */}
      {data && data.total === 0 ? (
        <Card className="rounded-md border p-10 text-center" style={{ borderColor: "rgba(26,29,35,0.12)" }}>
          <CheckCircle2 className="h-12 w-12 mx-auto text-[#1f6b3a] mb-3" />
          <h2 className="font-display text-lg text-[var(--color-ink)] mb-1">
            Nenhum alerta ativo
          </h2>
          <p className="text-sm text-[var(--color-ink-muted)] max-w-md mx-auto">
            Todos os comitês ativos estão com mandato vigente e nenhum vence nos
            próximos 90 dias.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {data?.alertas.map((a) => {
            const vencido = a.situacao === "vencido";
            return (
              <Card
                key={a.id}
                className="rounded-md border p-4 transition-colors hover:border-[var(--color-uems-navy)]"
                style={{
                  borderColor: vencido ? "rgba(179, 38, 30, 0.3)" : "rgba(26,29,35,0.12)",
                  background: vencido ? "rgba(179, 38, 30, 0.03)" : undefined,
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span
                        className={cn(
                          "text-[10px] font-medium px-2 py-0.5 rounded uppercase tracking-wide",
                          vencido
                            ? "bg-[#FBEDED] text-[var(--color-alert)]"
                            : "bg-[#FBF6E6] text-[#8a6d12]"
                        )}
                      >
                        {vencido ? "Vencido" : `Vence em ${a.dias}d`}
                      </span>
                      <h3 className="font-display text-base text-[var(--color-ink)] truncate">
                        {a.curso}
                      </h3>
                      <span className="text-xs text-[var(--color-ink-muted)] capitalize">{a.grau}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap text-xs text-[var(--color-ink-muted)]">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" /> {a.unidade}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" /> Portaria n.º {a.portariaConstituicaoNumero}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {a.totalMembros} membro(s)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wide text-[var(--color-ink-muted)]">
                        Término do mandato
                      </p>
                      <p className={cn(
                        "font-data text-sm font-medium",
                        vencido ? "text-[var(--color-alert)]" : "text-[#8a6d12]"
                      )}>
                        {a.terminoFormatado}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => verComite(a.id)}
                      className="border-[rgba(26,29,35,0.2)] h-8"
                    >
                      Ver comitê <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
