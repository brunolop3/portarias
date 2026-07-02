"use client";

import { useCge } from "@/lib/cge/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  PlusCircle, ListChecks, Settings, FileText, BookOpen, ShieldCheck,
  Users, FileStack, TrendingUp, CalendarClock, GraduationCap, Building2,
  AlertTriangle, ArrowRight, CheckCircle2, Clock, XCircle, UserCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { Comite } from "@/lib/cge/types";
import { dataCurta } from "@/lib/cge/datas";

// ===========================================================================
// Tela inicial (dashboard). Apresenta métricas, atalhos e alertas.
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

export function TelaInicio() {
  const irParaNovo = useCge((s) => s.irParaNovo);
  const irParaConsultar = useCge((s) => s.irParaConsultar);
  const setArea = useCge((s) => s.setArea);
  const setCursoConsultaId = useCge((s) => s.setCursoConsultaId);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cge/stats")
      .then((r) => r.json())
      .then((d) => {
        if (d && !d.error) setStats(d);
      })
      .finally(() => setLoading(false));
  }, []);

  const situacao = stats?.porSituacao ?? { ativo: 0, vencendo: 0, vencido: 0, encerrado: 0 };
  const maxUnidade = Math.max(1, ...(stats?.porUnidade.map((u) => u.total) ?? [1]));

  return (
    <div className="space-y-8">
      {/* Hero institucional */}
      <section className="rounded-md border bg-card overflow-hidden relative"
        style={{ borderColor: "rgba(26,29,35,0.12)" }}>
        {/* Faixa decorativa lateral navy */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ background: "var(--color-uems-navy)" }} />
        {/* Padrão decorativo sutil no canto (linhas diagonais douradas) */}
        <div className="absolute right-0 top-0 w-40 h-40 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, var(--color-uems-gold) 0, var(--color-uems-gold) 1px, transparent 1px, transparent 10px)",
          }}
        />
        <div className="relative p-6 sm:p-8 pl-8">
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded uppercase tracking-wider"
                  style={{ background: "#FBF6E6", color: "#8a6d12" }}>
                  <ShieldCheck className="h-3 w-3" /> Sistema oficial
                </span>
                <span className="text-[10px] text-[var(--color-ink-muted)] font-data uppercase tracking-wider">
                  PROE · DIGES · UEMS
                </span>
              </div>
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
              {/* Dica de atalho */}
              <div className="mt-4 flex items-center gap-2 text-xs text-[var(--color-ink-muted)]">
                <kbd className="font-data bg-[var(--color-muted)] px-1.5 py-0.5 rounded border" style={{ borderColor: "rgba(26,29,35,0.15)" }}>Ctrl</kbd>
                <span>+</span>
                <kbd className="font-data bg-[var(--color-muted)] px-1.5 py-0.5 rounded border" style={{ borderColor: "rgba(26,29,35,0.15)" }}>K</kbd>
                <span>para buscar ·</span>
                <kbd className="font-data bg-[var(--color-muted)] px-1.5 py-0.5 rounded border" style={{ borderColor: "rgba(26,29,35,0.15)" }}>g</kbd>
                <span>+</span>
                <kbd className="font-data bg-[var(--color-muted)] px-1.5 py-0.5 rounded border" style={{ borderColor: "rgba(26,29,35,0.15)" }}>n</kbd>
                <span>para nova portaria</span>
              </div>
            </div>
            {/* Destaque numérico à direita */}
            {!loading && stats && (
              <div className="lg:w-56 flex-shrink-0 grid grid-cols-2 lg:grid-cols-1 gap-3">
                <div className="rounded-md border p-3" style={{ borderColor: "rgba(26,29,35,0.1)", background: "var(--color-paper)" }}>
                  <p className="text-[10px] uppercase tracking-wide text-[var(--color-ink-muted)]">Comitês ativos</p>
                  <p className="font-display text-2xl text-[var(--color-uems-navy)] mt-0.5">
                    {stats.porSituacao.ativo ?? 0}
                  </p>
                </div>
                <div className="rounded-md border p-3" style={{ borderColor: "rgba(26,29,35,0.1)", background: "var(--color-paper)" }}>
                  <p className="text-[10px] uppercase tracking-wide text-[var(--color-ink-muted)]">Portarias geradas</p>
                  <p className="font-display text-2xl text-[var(--color-uems-navy)] mt-0.5">
                    {stats.totalPortarias}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Painel de métricas */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg text-[var(--color-ink)] flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[var(--color-uems-navy)]" />
            Visão geral
          </h2>
          {!loading && stats && (
            <span className="text-xs text-[var(--color-ink-muted)] font-data">
              Atualizado agora
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-md border animate-pulse bg-[var(--color-muted)]"
                style={{ borderColor: "rgba(26,29,35,0.08)" }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              icon={<Users className="h-5 w-5" />}
              label="Comitês cadastrados"
              value={stats?.totalComites ?? 0}
              hint={`${situacao.ativo} ativos`}
              tone="navy"
            />
            <MetricCard
              icon={<FileStack className="h-5 w-5" />}
              label="Portarias geradas"
              value={stats?.totalPortarias ?? 0}
              hint={`${stats?.totalConstituicoes ?? 0} constituições · ${stats?.totalAlteracoes ?? 0} alterações`}
              tone="gold"
            />
            <MetricCard
              icon={<Users className="h-5 w-5" />}
              label="Membros em exercício"
              value={stats?.totalMembros ?? 0}
              hint="Comitês ativos"
              tone="navy"
            />
            <MetricCard
              icon={<CalendarClock className="h-5 w-5" />}
              label="Próximos a vencer"
              value={(stats?.proximosVencer.length ?? 0)}
              hint="Em até 90 dias"
              tone={(stats?.proximosVencer.length ?? 0) > 0 ? "alert" : "muted"}
            />
          </div>
        )}
      </section>

      {/* Distribuições + Alertas */}
      {!loading && stats && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Situação dos comitês */}
          <Card className="rounded-md border p-5" style={{ borderColor: "rgba(26,29,35,0.12)" }}>
            <h3 className="font-display text-base text-[var(--color-ink)] mb-4">Situação dos comitês</h3>
            <div className="space-y-3">
              <SituacaoBar label="Ativos" valor={situacao.ativo} total={stats.totalComites} cor="#1f6b3a" />
              <SituacaoBar label="Vencendo" valor={situacao.vencendo} total={stats.totalComites} cor="#8a6d12" />
              <SituacaoBar label="Vencidos" valor={situacao.vencido} total={stats.totalComites} cor="var(--color-alert)" />
              <SituacaoBar label="Encerrados" valor={situacao.encerrado} total={stats.totalComites} cor="var(--color-ink-muted)" />
            </div>
          </Card>

          {/* Por unidade */}
          <Card className="rounded-md border p-5" style={{ borderColor: "rgba(26,29,35,0.12)" }}>
            <h3 className="font-display text-base text-[var(--color-ink)] mb-4 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[var(--color-uems-navy)]" />
              Por unidade universitária
            </h3>
            {stats.porUnidade.length === 0 ? (
              <EmptyMini text="Nenhuma unidade cadastrada." />
            ) : (
              <div className="space-y-2.5">
                {stats.porUnidade.slice(0, 5).map((u) => (
                  <div key={u.unidade}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-[var(--color-ink)] truncate">{u.unidade}</span>
                      <span className="font-data text-[var(--color-ink-muted)] ml-2">{u.total}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--color-muted)] overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${(u.total / maxUnidade) * 100}%`, background: "var(--color-uems-navy)" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Próximos a vencer */}
          <Card className="rounded-md border p-5" style={{ borderColor: "rgba(26,29,35,0.12)" }}>
            <h3 className="font-display text-base text-[var(--color-ink)] mb-4 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[#8a6d12]" />
              Mandatos próximos do fim
            </h3>
            {stats.proximosVencer.length === 0 ? (
              <EmptyMini text="Nenhum mandato vence nos próximos 90 dias." icon={<CheckCircle2 className="h-5 w-5 text-[#1f6b3a] mb-1.5" />} />
            ) : (
              <ul className="space-y-2.5">
                {stats.proximosVencer.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => { setCursoConsultaId(p.id); irParaConsultar(); }}
                      className="w-full text-left rounded-md border border-[rgba(26,29,35,0.1)] bg-[var(--color-paper)] p-3 hover:border-[var(--color-uems-navy)] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[var(--color-ink)] truncate">{p.curso}</p>
                          <p className="text-xs text-[var(--color-ink-muted)] truncate">{p.unidade}</p>
                        </div>
                        <span className="text-xs font-data text-[#8a6d12] whitespace-nowrap bg-[#FBF6E6] px-2 py-0.5 rounded">
                          {p.dias}d
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--color-ink-muted)] mt-1 font-data">
                        Término: {dataCurta(p.termino)}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Distribuição de funções */}
          <Card className="rounded-md border p-5" style={{ borderColor: "rgba(26,29,35,0.12)" }}>
            <h3 className="font-display text-base text-[var(--color-ink)] mb-4 flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-[var(--color-uems-navy)]" />
              Distribuição de funções
            </h3>
            {stats.distribuicaoFuncoes.length === 0 ? (
              <EmptyMini text="Nenhum membro em exercício." />
            ) : (
              <DonutFuncoes dados={stats.distribuicaoFuncoes} />
            )}
          </Card>
        </section>
      )}

      {/* Evolução temporal — portarias por mês (últimos 12 meses) */}
      {!loading && stats && (
        <section>
          <Card className="rounded-md border p-5" style={{ borderColor: "rgba(26,29,35,0.12)" }}>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="font-display text-base text-[var(--color-ink)] flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[var(--color-uems-navy)]" />
                Portarias geradas por mês
              </h3>
              <div className="flex items-center gap-4 text-xs">
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
            <ChartEvolucao dados={stats.evolucaoMensal} />
          </Card>
        </section>
      )}

      {/* Rotatividade de membros */}
      {!loading && stats && stats.rotatividadeMembros && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="rounded-md border p-5 lg:col-span-1" style={{ borderColor: "rgba(26,29,35,0.12)" }}>
            <h3 className="font-display text-base text-[var(--color-ink)] mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-[var(--color-uems-navy)]" />
              Rotatividade de membros
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-[var(--color-ink-muted)] uppercase tracking-wide">Pessoas distintas</p>
                <p className="font-display text-3xl text-[var(--color-uems-navy)] mt-0.5">
                  {stats.rotatividadeMembros.totalPessoasDistintas}
                </p>
                <p className="text-[11px] text-[var(--color-ink-muted)] mt-0.5">que já participaram de um CGE</p>
              </div>
              <div className="pt-3 border-t" style={{ borderColor: "rgba(26,29,35,0.08)" }}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--color-ink-muted)]">Em apenas 1 versão</span>
                  <span className="font-data font-medium text-[var(--color-ink)]">
                    {stats.rotatividadeMembros.unicos}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1.5">
                  <span className="text-[var(--color-ink-muted)]">Recorrentes</span>
                  <span className="font-data font-medium text-[var(--color-ink)]">
                    {stats.rotatividadeMembros.totalPessoasDistintas - stats.rotatividadeMembros.unicos}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="rounded-md border p-5 lg:col-span-2" style={{ borderColor: "rgba(26,29,35,0.12)" }}>
            <h3 className="font-display text-base text-[var(--color-ink)] mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[var(--color-uems-navy)]" />
              Membros mais recorrentes
            </h3>
            {stats.rotatividadeMembros.maisRecorrentes.length === 0 ? (
              <EmptyMini text="Nenhum membro cadastrado ainda." />
            ) : (
              <ul className="space-y-2">
                {stats.rotatividadeMembros.maisRecorrentes.map((m, i) => (
                  <li key={i} className="flex items-center gap-3 rounded-md border border-[rgba(26,29,35,0.08)] bg-[var(--color-paper)] p-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-uems-navy)] text-white text-xs font-data flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--color-ink)] truncate">{m.nome}</p>
                      <p className="text-[11px] text-[var(--color-ink-muted)] truncate">
                        {m.cursos.join(", ")} · {m.funcoes.join(", ")}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-data text-sm font-medium text-[var(--color-uems-navy)]">{m.totalVersoes}</p>
                      <p className="text-[10px] text-[var(--color-ink-muted)] uppercase">versões</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>
      )}

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

// ---- Subcomponentes --------------------------------------------------------

function MetricCard({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  hint?: string;
  tone: "navy" | "gold" | "alert" | "muted";
}) {
  const toneCls = {
    navy: "text-[var(--color-uems-navy)]",
    gold: "text-[#8a6d12]",
    alert: "text-[var(--color-alert)]",
    muted: "text-[var(--color-ink-muted)]",
  }[tone];
  return (
    <Card className="rounded-md border p-4 relative overflow-hidden" style={{ borderColor: "rgba(26,29,35,0.12)" }}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs text-[var(--color-ink-muted)] uppercase tracking-wide">{label}</span>
        <span className={toneCls}>{icon}</span>
      </div>
      <p className={`font-display text-3xl ${toneCls}`}>{value}</p>
      {hint && <p className="text-[11px] text-[var(--color-ink-muted)] mt-1 truncate">{hint}</p>}
    </Card>
  );
}

function SituacaoBar({ label, valor, total, cor }: { label: string; valor: number; total: number; cor: string }) {
  const pct = total > 0 ? (valor / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="text-[var(--color-ink)]">{label}</span>
        <span className="font-data text-[var(--color-ink-muted)]">{valor}</span>
      </div>
      <div className="h-2 rounded-full bg-[var(--color-muted)] overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: cor }} />
      </div>
    </div>
  );
}

function EmptyMini({ text, icon }: { text: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-4 text-center">
      {icon}
      <p className="text-xs text-[var(--color-ink-muted)]">{text}</p>
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
      className="group text-left rounded-md border bg-card p-5 transition-all hover:border-[var(--color-uems-navy)] hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-uems-navy)]"
      style={{ borderColor: "rgba(26,29,35,0.12)" }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-[var(--color-uems-navy)]">
          {icon}
          <span className="font-display text-base text-[var(--color-ink)]">{titulo}</span>
        </div>
        <ArrowRight className="h-4 w-4 text-[var(--color-ink-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">{desc}</p>
    </button>
  );
}

// Gráfico de barras empilhadas (CSS puro, sem dependência externa) mostrando
// constituições + alterações por mês. Tooltip no hover mostra os valores.
function ChartEvolucao({
  dados,
}: {
  dados: { chave: string; label: string; constituicoes: number; alteracoes: number }[];
}) {
  const max = Math.max(1, ...dados.map((d) => d.constituicoes + d.alteracoes));
  const totalCons = dados.reduce((a, d) => a + d.constituicoes, 0);
  const totalAlt = dados.reduce((a, d) => a + d.alteracoes, 0);
  const vazio = totalCons + totalAlt === 0;

  if (vazio) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <CheckCircle2 className="h-6 w-6 text-[var(--color-ink-muted)]/40 mb-2" />
        <p className="text-sm text-[var(--color-ink-muted)]">
          Nenhuma portaria gerada nos últimos 12 meses.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Barras */}
      <div className="flex items-end justify-between gap-1 sm:gap-2 h-40 mb-2">
        {dados.map((d) => {
          const total = d.constituicoes + d.alteracoes;
          const alturaCons = (d.constituicoes / max) * 100;
          const alturaAlt = (d.alteracoes / max) * 100;
          const haDados = total > 0;
          return (
            <div key={d.chave} className="flex-1 flex flex-col items-center justify-end h-full group relative">
              {/* Tooltip */}
              {haDados && (
                <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <div className="bg-[var(--color-ink)] text-white text-[11px] rounded px-2 py-1 whitespace-nowrap shadow-md">
                    <div>{d.constituicoes} constit.</div>
                    <div>{d.alteracoes} alter.</div>
                  </div>
                </div>
              )}
              <div className="w-full max-w-[28px] flex flex-col justify-end h-full" style={{ minHeight: "2px" }}>
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
                {!haDados && (
                  <div className="w-full" style={{ height: "2px", background: "rgba(26,29,35,0.08)" }} />
                )}
              </div>
            </div>
          );
        })}
      </div>
      {/* Labels dos meses */}
      <div className="flex items-center justify-between gap-1 sm:gap-2 border-t pt-2" style={{ borderColor: "rgba(26,29,35,0.08)" }}>
        {dados.map((d) => (
          <div key={d.chave} className="flex-1 text-center">
            <span className="text-[10px] text-[var(--color-ink-muted)] font-data">{d.label}</span>
          </div>
        ))}
      </div>
      {/* Resumo */}
      <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-[var(--color-ink-muted)]" style={{ borderColor: "rgba(26,29,35,0.08)" }}>
        <span>Últimos 12 meses</span>
        <span>
          Total: <strong className="text-[var(--color-ink)] font-data">{totalCons + totalAlt}</strong>{" "}
          ({totalCons} constituições · {totalAlt} alterações)
        </span>
      </div>
    </div>
  );
}

// Donut chart (SVG puro) mostrando a distribuição de funções nos comitês
// ativos. Cada função tem uma cor institucional: Presidente=dourado,
// Coordenador=navy, Membro=cinza.
function DonutFuncoes({ dados }: { dados: { funcao: string; total: number }[] }) {
  const total = dados.reduce((a, d) => a + d.total, 0);
  if (total === 0) return null;

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

  // Calcula os segmentos do donut (stroke-dasharray) — usa reduce para
  // acumular offsets sem mutação de variável externa.
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
      {/* SVG donut */}
      <svg width="110" height="110" viewBox="0 0 110 110" className="flex-shrink-0">
        <circle cx="55" cy="55" r={raio} fill="none" stroke="var(--color-muted)" strokeWidth="14" />
        {segmentos.map((s, i) => (
          <circle
            key={i}
            cx="55"
            cy="55"
            r={raio}
            fill="none"
            stroke={corFuncao(s.funcao)}
            strokeWidth="14"
            strokeDasharray={`${s.comprimento} ${circunferencia - s.comprimento}`}
            strokeDashoffset={-s.offset}
            transform="rotate(-90 55 55)"
            className="transition-all duration-500"
          />
        ))}
        <text x="55" y="50" textAnchor="middle" className="font-display fill-[var(--color-ink)]" style={{ fontSize: "20px" }}>
          {total}
        </text>
        <text x="55" y="66" textAnchor="middle" className="fill-[var(--color-ink-muted)]" style={{ fontSize: "9px" }}>
          membros
        </text>
      </svg>
      {/* Legenda com valores */}
      <div className="flex-1 space-y-2">
        {dados.map((d, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: corFuncao(d.funcao) }} />
              <span className="text-[var(--color-ink)]">{labelCurto(d.funcao)}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="font-data font-medium text-[var(--color-ink)]">{d.total}</span>
              <span className="text-[10px] text-[var(--color-ink-muted)]">
                ({Math.round((d.total / total) * 100)}%)
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
