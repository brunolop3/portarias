"use client";

import { useCge } from "@/lib/cge/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Save, RotateCcw, Settings as SettingsIcon, ShieldCheck, Calendar, History, FileText, Users, Trash2, Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { ConfiguracaoCGE } from "@/lib/cge/types";
import { CONFIG_PADRAO } from "@/lib/cge/config";

interface RegistroAuditoria {
  id: string;
  acao: string;
  entidade: string;
  entidadeId: string | null;
  descricao: string;
  detalhes: string | null;
  criadoEm: string;
}

// ===========================================================================
// Tela de Configurações globais.
//   Textos fixos das portarias que podem mudar no futuro por nova normativa.
//   Não são solicitados a cada portaria — ficam aqui.
// ===========================================================================

export function TelaConfig() {
  const { config, setConfig } = useCge();
  const [form, setForm] = useState<ConfiguracaoCGE | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [auditoria, setAuditoria] = useState<RegistroAuditoria[]>([]);
  const [carregandoAud, setCarregandoAud] = useState(true);

  useEffect(() => {
    if (config) { setForm(config); return; }
    fetch("/api/cge/config")
      .then((r) => r.json())
      .then((c) => { if (c && !c.error) { setForm(c); setConfig(c); } });
  }, [config, setConfig]);

  useEffect(() => {
    fetch("/api/cge/auditoria?limite=30")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setAuditoria(d); })
      .finally(() => setCarregandoAud(false));
  }, [salvando]); // recarrega após salvar config

  function set<K extends keyof ConfiguracaoCGE>(k: K, v: ConfiguracaoCGE[K]) {
    setForm((f) => (f ? { ...f, [k]: v } : f));
  }

  async function salvar() {
    if (!form) return;
    setSalvando(true);
    try {
      const r = await fetch("/api/cge/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Falha ao salvar.");
      setConfig(d);
      setForm(d);
      toast.success("Configurações salvas. As novas minutas já usarão estes valores.");
    } catch (e) {
      toast.error("Erro ao salvar: " + (e as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  function restaurarPadrao() {
    setForm({
      id: "default",
      ...CONFIG_PADRAO,
    } as ConfiguracaoCGE);
    toast.info("Valores padrão restaurados. Clique em Salvar para confirmar.");
  }

  if (!form) {
    return <div className="p-10 text-center text-sm text-[var(--color-ink-muted)]">Carregando configurações...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl text-[var(--color-ink)]">Configurações</h1>
          <p className="text-sm text-[var(--color-ink-muted)] mt-1">
            Textos fixos das portarias. Editáveis apenas aqui — não a cada portaria.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={restaurarPadrao} className="border-[rgba(26,29,35,0.2)]">
            <RotateCcw className="h-4 w-4 mr-1.5" /> Restaurar padrão
          </Button>
          <Button onClick={salvar} disabled={salvando}
            className="bg-[var(--color-uems-navy)] hover:bg-[var(--color-uems-navy-deep)] text-white">
            <Save className="h-4 w-4 mr-1.5" /> {salvando ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      <Card className="rounded-md border p-5" style={{ borderColor: "rgba(26,29,35,0.12)" }}>
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="h-4 w-4 text-[var(--color-uems-navy)]" />
          <h2 className="font-display text-base text-[var(--color-ink)]">Resoluções homologatórias</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Resolução que homologa a Deliberação Nº 431 (Política de Gestão do Enade)">
            <textarea value={form.resolucaoHomologacao431} onChange={(e) => set("resolucaoHomologacao431", e.target.value)} rows={2} className={inputCls} />
          </Field>
          <Field label="Resolução que homologa a Deliberação Nº 432 (Regulamento dos Comitês)">
            <textarea value={form.resolucaoHomologacao432} onChange={(e) => set("resolucaoHomologacao432", e.target.value)} rows={2} className={inputCls} />
          </Field>
          <Field label="Data da Deliberação Nº 431">
            <input type="date" value={form.dataDeliberacao431} onChange={(e) => set("dataDeliberacao431", e.target.value)} className={`${inputCls} font-data`} />
          </Field>
          <Field label="Data da Deliberação Nº 432">
            <input type="date" value={form.dataDeliberacao432} onChange={(e) => set("dataDeliberacao432", e.target.value)} className={`${inputCls} font-data`} />
          </Field>
        </div>
      </Card>

      <Card className="rounded-md border p-5" style={{ borderColor: "rgba(26,29,35,0.12)" }}>
        <div className="flex items-center gap-2 mb-4">
          <SettingsIcon className="h-4 w-4 text-[var(--color-uems-navy)]" />
          <h2 className="font-display text-base text-[var(--color-ink)]">Atos e signatário</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Portaria de delegação de competência do Reitor" className="sm:col-span-2">
            <input value={form.portariaDelegacaoCompetencia} onChange={(e) => set("portariaDelegacaoCompetencia", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Resolução COUNI (Regimento Geral)" className="sm:col-span-2">
            <input value={form.resolucaoCouni} onChange={(e) => set("resolucaoCouni", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Nome do signatário">
            <input value={form.nomeSignatario} onChange={(e) => set("nomeSignatario", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Cargo do signatário">
            <input value={form.cargoSignatario} onChange={(e) => set("cargoSignatario", e.target.value)} className={inputCls} />
          </Field>
        </div>
      </Card>

      <Card className="rounded-md border p-4 bg-[var(--color-paper)]" style={{ borderColor: "rgba(26,29,35,0.12)" }}>
        <div className="flex items-start gap-3">
          <Calendar className="h-4 w-4 text-[var(--color-uems-navy)] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
            <strong className="text-[var(--color-ink)]">Atenção:</strong> alterar estes valores muda o texto de TODAS as novas minutas
            geradas a partir de agora. As portarias já salvas no histórico mantêm o texto que tinham quando foram geradas.
            Datas aparecem por extenso nas minutas (ex.: "28 de maio de 2026").
          </p>
        </div>
      </Card>

      {/* Histórico de auditoria */}
      <Card className="rounded-md border" style={{ borderColor: "rgba(26,29,35,0.12)" }}>
        <div className="p-4 border-b flex items-center gap-2" style={{ borderColor: "rgba(26,29,35,0.08)" }}>
          <History className="h-4 w-4 text-[var(--color-uems-navy)]" />
          <h2 className="font-display text-base text-[var(--color-ink)]">Histórico de auditoria</h2>
          <span className="text-xs text-[var(--color-ink-muted)] ml-auto">Últimas 30 ações</span>
        </div>
        {carregandoAud ? (
          <div className="p-6 text-center text-sm text-[var(--color-ink-muted)]">Carregando...</div>
        ) : auditoria.length === 0 ? (
          <div className="p-6 text-center text-sm text-[var(--color-ink-muted)]">
            Nenhuma ação registrada ainda.
          </div>
        ) : (
          <ul className="divide-y max-h-96 overflow-y-auto scroll-thin" style={{ borderColor: "rgba(26,29,35,0.06)" }}>
            {auditoria.map((r) => {
              const Icon = iconeAcao(r.acao);
              const cor = corAcao(r.acao);
              return (
                <li key={r.id} className="p-3 flex items-start gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md flex-shrink-0 mt-0.5"
                    style={{ background: cor + "1a" }}>
                    <Icon className="h-3.5 w-3.5" style={{ color: cor }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-[var(--color-ink)] leading-snug">{r.descricao}</p>
                    <p className="text-[11px] text-[var(--color-ink-muted)] mt-0.5 font-data">
                      {new Date(r.criadoEm).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      <span className="mx-1">·</span>
                      <span className="uppercase tracking-wide">{r.acao.replace(/_/g, " ")}</span>
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

function iconeAcao(acao: string): React.ComponentType<{ className?: string }> {
  if (acao.includes("comite")) return Users;
  if (acao.includes("portaria")) return FileText;
  if (acao.includes("encerrado")) return Pause;
  if (acao.includes("reativado")) return Play;
  if (acao.includes("excluid")) return Trash2;
  if (acao.includes("config")) return SettingsIcon;
  return History;
}

function corAcao(acao: string): string {
  if (acao.includes("excluid")) return "var(--color-alert)";
  if (acao.includes("encerrado")) return "#8a6d12";
  if (acao.includes("criado") || acao.includes("gerada") || acao.includes("reativado")) return "var(--color-uems-navy)";
  if (acao.includes("alterado")) return "var(--color-uems-gold)";
  return "var(--color-ink-muted)";
}

const inputCls =
  "w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-uems-navy)] focus:border-[var(--color-uems-navy)] resize-none";

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-[var(--color-ink)] mb-1.5">{label}</label>
      {children}
    </div>
  );
}
