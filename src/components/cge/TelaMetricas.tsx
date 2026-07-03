"use client";

import { useEffect, useState } from "react";
import { useCge } from "@/lib/cge/store";
import { Card } from "@/components/ui/card";
import {
  TrendingUp, Users, FileStack, Calendar, Building2, GraduationCap,
  Award, Activity, BarChart3, Clock,
} from "lucide-react";
import { dataCurta } from "@/lib/cge/datas";
import { cn } from "@/lib/utils";

// ===========================================================================
// Tela de Métricas detalhadas — dashboard expandido com gráficos e análises
// mais profundas que o resumo da Tela Início.
// ===========================================================================

interface Stats {
  totalComites: number;
  porSituacao: Record<string, number>;
  totalPortarias: number;
  totalConstituicoes: number;
  totalAlteracoes: number;
  totalMembros: number;
  porUnidade: { unidade: string; total: number }[];
  porGrau: { grau: string; total: number }[];
  proximosVencer: {
    id: string;
    curso: string;
    unidade: string;
    termino: string;
    dias: number;
  }[];
  evolucaoMensal: {
    chave: string;
    label: string;
    constituicoes: number;
    alteracoes: number;
  }[];
  rotatividadeMembros: {
    totalPessoasDistintas: number;
    unicos: number;
    maisRecorrentes: {
      nome: string;
      totalVersoes: number;
      totalCursos: number;
      cursos: string[];
      funcoes: string[];
    }[];
  };
  distribuicaoFuncoes: { funcao: string; total: number }[];
}

export function TelaMetricas() {
  const setCursoConsultaId = useCge((s) => s.setCursoConsultaId);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cge/stats")
      .then((r) => r.json())
      .then((d) => { if (d && !d.error) setStats(d); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-10 text-center text-sm text-[var(--color-ink-muted)]">
        Carregando métricas...
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-10 text-center text-sm text-[var(--color-alert)]">
        Erro ao carregar métricas.
      </div>
    );
  }

  const totalMembrosFuncoes = stats.distribuicaoFuncoes.reduce((a, d) => a + d.total, 0);
  const taxaAlteracao = stats.totalPortarias > 0
    ? Math.round((stats.totalAlteracoes / stats.totalPortarias) * 100)
    : 0;
  const mediaMembrosPorComite = stats.totalComites > 0
    ? (stats.totalMembros / stats.totalComites).toFixed(1)
    : "0";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-[var(--color-ink)] flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-[var(--color-uems-navy)]" />
          Métricas detalhadas
        </h1>
        <p className="text-sm text-[var(--color-ink-muted)] mt-1">
          Análise aprofundada dos comitês, portarias e membros.
        </p>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={<Users className="h-5 w-5" />} label="Comitês" value={stats.totalComites} hint={`${stats.porSituacao.ativo ?? 0} ativos`} />
        <Kpi icon={<FileStack className="h-5 w-5" />} label="Portarias" value={stats.totalPortarias} hint={`${stats.totalConstituicoes} constituições`} />
        <Kpi icon={<Users className="h-5 w-5" />} label="Membros em exercício" value={stats.totalMembros} hint={`média de ${mediaMembrosPorComite} por comitê`} />
        <Kpi icon={<Activity className="h-5 w-5" />} label="Taxa de alteração" value={`${taxaAlteracao}%`} hint={`${stats.totalAlteracoes} alterações`} />
      </div>

      {/* Evolução temporal — versão expandida */}
      <Card className="rounded-md border p-5" style={{ borderColor: "rgba(26,29,35,0.12)" }}>
        <h3 className="font-display text-base text-[var(--color-ink)] mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[var(--color-uems-navy)]" />
          Evolução de portarias geradas (12 meses)
        </h3>
        <ChartEvolucaoExpandido dados={stats.evolucaoMensal} />
      </Card>

      {/* Grid de análises */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Distribuição por unidade */}
        <Card className="rounded-md border p-5" style={{ borderColor: "rgba(26,29,35,0.12)" }}>
          <h3 className="font-display text-base text-[var(--color-ink)] mb-4 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[var(--color-uems-navy)]" />
            Distribuição por unidade
          </h3>
          {stats.porUnidade.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-muted)] text-center py-4">Sem dados.</p>
          ) : (
            <div className="space-y-3">
              {stats.porUnidade.map((u) => {
                const max = Math.max(...stats.porUnidade.map((x) => x.total));
                return (
                  <div key={u.unidade}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-[var(--color-ink)] truncate">{u.unidade}</span>
                      <span className="font-data text-[var(--color-ink-muted)]">{u.total} comitê(s)</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--color-muted)] overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${(u.total / max) * 100}%`, background: "var(--color-uems-navy)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Distribuição por grau */}
        <Card className="rounded-md border p-5" style={{ borderColor: "rgba(26,29,35,0.12)" }}>
          <h3 className="font-display text-base text-[var(--color-ink)] mb-4 flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-[var(--color-uems-navy)]" />
            Distribuição por grau acadêmico
          </h3>
          {stats.porGrau.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-muted)] text-center py-4">Sem dados.</p>
          ) : (
            <div className="space-y-3">
              {stats.porGrau.map((g) => {
                const total = stats.porGrau.reduce((a, x) => a + x.total, 0);
                const pct = Math.round((g.total / total) * 100);
                return (
                  <div key={g.grau}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-[var(--color-ink)] capitalize">{g.grau}</span>
                      <span className="font-data text-[var(--color-ink-muted)]">{g.total} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--color-muted)] overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: "var(--color-uems-gold)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Distribuição de funções — donut */}
        <Card className="rounded-md border p-5" style={{ borderColor: "rgba(26,29,35,0.12)" }}>
          <h3 className="font-display text-base text-[var(--color-ink)] mb-4 flex items-center gap-2">
            <Award className="h-4 w-4 text-[var(--color-uems-navy)]" />
            Distribuição de funções
          </h3>
          {stats.distribuicaoFuncoes.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-muted)] text-center py-4">Sem dados.</p>
          ) : (
            <DonutFuncoes dados={stats.distribuicaoFuncoes} total={totalMembrosFuncoes} />
          )}
        </Card>

        {/* Rotatividade — top membros */}
        <Card className="rounded-md border p-5" style={{ borderColor: "rgba(26,29,35,0.12)" }}>
          <h3 className="font-display text-base text-[var(--color-ink)] mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-[var(--color-uems-navy)]" />
            Rotatividade de membros
          </h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center">
              <p className="font-display text-2xl text-[var(--color-uems-navy)]">{stats.rotatividadeMembros.totalPessoasDistintas}</p>
              <p className="text-[10px] uppercase tracking-wide text-[var(--color-ink-muted)]">Pessoas</p>
            </div>
            <div className="text-center">
              <p className="font-display text-2xl text-[#1f6b3a]">{stats.rotatividadeMembros.totalPessoasDistintas - stats.rotatividadeMembros.unicos}</p>
              <p className="text-[10px] uppercase tracking-wide text-[var(--color-ink-muted)]">Recorrentes</p>
            </div>
            <div className="text-center">
              <p className="font-display text-2xl text-[#8a6d12]">{stats.rotatividadeMembros.unicos}</p>
              <p className="text-[10px] uppercase tracking-wide text-[var(--color-ink-muted)]">Únicos</p>
            </div>
          </div>
          {stats.rotatividadeMembros.maisRecorrentes.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--color-ink-muted)] mb-2">Top 5 mais recorrentes</p>
              <ul className="space-y-1.5">
                {stats.rotatividadeMembros.maisRecorrentes.map((m, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-uems-navy)] text-white text-[10px] font-data flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-[var(--color-ink)] truncate flex-1">{m.nome}</span>
                    <span className="font-data text-xs text-[var(--color-ink-muted)]">{m.totalVersoes}x</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>

      {/* Próximos a vencer — lista completa */}
      <Card className="rounded-md border p-5" style={{ borderColor: "rgba(26,29,35,0.12)" }}>
        <h3 className="font-display text-base text-[var(--color-ink)] mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#8a6d12]" />
          Mandatos próximos do fim (90 dias)
        </h3>
        {stats.proximosVencer.length === 0 ? (
          <p className="text-sm text-[var(--color-ink-muted)] text-center py-4">
            Nenhum mandato vence nos próximos 90 dias.
          </p>
        ) : (
          <ul className="space-y-2">
            {stats.proximosVencer.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => { setCursoConsultaId(p.id); useCge.setState({ area: "consultar" }); }}
                  className="w-full text-left rounded-md border border-[rgba(26,29,35,0.1)] bg-[var(--color-paper)] p-3 hover:border-[var(--color-uems-navy)] transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--color-ink)] truncate">{p.curso}</p>
                      <p className="text-xs text-[var(--color-ink-muted)] truncate">{p.unidade}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-data text-[#8a6d12] bg-[#FBF6E6] px-2 py-0.5 rounded">
                        {p.dias}d
                      </span>
                      <p className="text-[11px] text-[var(--color-ink-muted)] mt-0.5 font-data">{dataCurta(p.termino)}</p>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Kpi({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string | number; hint: string }) {
  return (
    <Card className="rounded-md border p-4" style={{ borderColor: "rgba(26,29,35,0.12)" }}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs text-[var(--color-ink-muted)] uppercase tracking-wide">{label}</span>
        <span className="text-[var(--color-uems-navy)]">{icon}</span>
      </div>
      <p className="font-display text-3xl text-[var(--color-uems-navy)]">{value}</p>
      <p className="text-[11px] text-[var(--color-ink-muted)] mt-1 truncate">{hint}</p>
    </Card>
  );
}

function ChartEvolucaoExpandido({ dados }: { dados: { chave: string; label: string; constituicoes: number; alteracoes: number }[] }) {
  const max = Math.max(1, ...dados.map((d) => d.constituicoes + d.alteracoes));
  return (
    <div>
      <div className="flex items-end justify-between gap-2 h-48 mb-2">
        {dados.map((d) => {
          const alturaCons = (d.constituicoes / max) * 100;
          const alturaAlt = (d.alteracoes / max) * 100;
          const total = d.constituicoes + d.alteracoes;
          return (
            <div key={d.chave} className="flex-1 flex flex-col items-center justify-end h-full group relative">
              {total > 0 && (
                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <div className="bg-[var(--color-ink)] text-white text-[11px] rounded px-2 py-1 whitespace-nowrap shadow-md">
                    <div>{d.constituicoes} constit.</div>
                    <div>{d.alteracoes} alter.</div>
                  </div>
                </div>
              )}
              <div className="w-full max-w-[36px] flex flex-col justify-end h-full">
                {d.alteracoes > 0 && (
                  <div className="w-full rounded-t-sm transition-all duration-300"
                    style={{ height: `${alturaAlt}%`, background: "var(--color-uems-gold)" }} />
                )}
                {d.constituicoes > 0 && (
                  <div className="w-full transition-all duration-300"
                    style={{
                      height: `${alturaCons}%`,
                      background: "var(--color-uems-navy)",
                      borderTopLeftRadius: d.alteracoes > 0 ? 0 : "2px",
                      borderTopRightRadius: d.alteracoes > 0 ? 0 : "2px",
                    }} />
                )}
                {total === 0 && (
                  <div className="w-full" style={{ height: "2px", background: "rgba(26,29,35,0.08)" }} />
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between gap-2 border-t pt-2" style={{ borderColor: "rgba(26,29,35,0.08)" }}>
        {dados.map((d) => (
          <div key={d.chave} className="flex-1 text-center">
            <span className="text-[10px] text-[var(--color-ink-muted)] font-data">{d.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "var(--color-uems-navy)" }} />
          <span className="text-[var(--color-ink-muted)]">Constituições</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "var(--color-uems-gold)" }} />
          <span className="text-[var(--color-ink-muted)]">Alterações</span>
        </span>
      </div>
    </div>
  );
}

function DonutFuncoes({ dados, total }: { dados: { funcao: string; total: number }[]; total: number }) {
  const corFuncao = (funcao: string) => {
    if (funcao === "Presidente") return "var(--color-uems-gold)";
    if (funcao.includes("Coordenador")) return "var(--color-uems-navy)";
    return "var(--color-ink-muted)";
  };
  const labelCurto = (funcao: string) => {
    if (funcao === "Presidente") return "Presidentes";
    if (funcao.includes("Coordenador")) return "Coordenadores";
    return "Membros";
  };
  const raio = 42;
  const circunferencia = 2 * Math.PI * raio;
  const segmentos = dados.reduce<{
    items: { funcao: string; comprimento: number; offset: number }[];
    acc: number;
  }>(
    (res, d) => {
      const comprimento = (d.total / total) * circunferencia;
      res.items.push({ funcao: d.funcao, comprimento, offset: res.acc });
      res.acc += comprimento;
      return res;
    },
    { items: [], acc: 0 }
  ).items;

  return (
    <div className="flex items-center gap-4">
      <svg width="110" height="110" viewBox="0 0 110 110" className="flex-shrink-0">
        <circle cx="55" cy="55" r={raio} fill="none" stroke="var(--color-muted)" strokeWidth="14" />
        {segmentos.map((s, i) => (
          <circle key={i} cx="55" cy="55" r={raio} fill="none"
            stroke={corFuncao(s.funcao)} strokeWidth="14"
            strokeDasharray={`${s.comprimento} ${circunferencia - s.comprimento}`}
            strokeDashoffset={-s.offset}
            transform="rotate(-90 55 55)"
            className="transition-all duration-500" />
        ))}
        <text x="55" y="50" textAnchor="middle" className="font-display fill-[var(--color-ink)]" style={{ fontSize: "20px" }}>{total}</text>
        <text x="55" y="66" textAnchor="middle" className="fill-[var(--color-ink-muted)]" style={{ fontSize: "9px" }}>membros</text>
      </svg>
      <div className="flex-1 space-y-2">
        {dados.map((d, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: corFuncao(d.funcao) }} />
              <span className="text-[var(--color-ink)]">{labelCurto(d.funcao)}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="font-data font-medium text-[var(--color-ink)]">{d.total}</span>
              <span className="text-[10px] text-[var(--color-ink-muted)]">({Math.round((d.total / total) * 100)}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
