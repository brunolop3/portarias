"use client";

import { useCge } from "@/lib/cge/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Upload, FileText, Sparkles, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { ExtracaoCI } from "@/lib/cge/types";
import { cn } from "@/lib/utils";

// ===========================================================================
// Tela 2 — Dados da Portaria.
//   Campos: número, data, curso/grau/unidade (bloqueados se Alteração),
//   número da CI, e botão "Importar CI" que envia o arquivo ao backend
//   (VLM) e devolve sugestões destacadas para confirmação manual.
// ===========================================================================

export function Tela2Dados() {
  const s = useCge();
  const {
    tipo,
    curso, grau, unidade,
    numeroPortaria, dataPortaria, ciNumero,
    setCampo, setEtapa,
    comiteSnapshot,
    ciArquivo,
    sugestaoCi, aplicarSugestaoCi,
  } = s;
  const [importando, setImportando] = useState(false);
  const [ciAnexada, setCiAnexada] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const bloqueadoCurso = tipo === "Alteração";

  function validarAvanco(): boolean {
    if (!numeroPortaria.trim()) return false;
    if (!dataPortaria) return false;
    if (!curso.trim() || !grau || !unidade.trim()) return false;
    if (!ciNumero.trim()) return false;
    return true;
  }

  async function handleImportar(file: File) {
    setImportando(true);
    setCiAnexada(file);
    setCampo("ciArquivo", file);
    const tLoading = toast.loading("Lendo a CI e extraindo dados com IA...");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/cge/importar-ci", { method: "POST", body: fd });
      const d: ExtracaoCI & { error?: string } = await r.json();
      if (!r.ok) {
        toast.dismiss(tLoading);
        toast.error(d.error || "Falha ao importar CI. Preencha manualmente.");
        return;
      }
      toast.dismiss(tLoading);
      // Guarda como sugestão (não preenche direto — usuário confirma).
      setCampo("sugestaoCi", d);
      if (d.membros && d.membros.length > 0) {
        toast.success(`CI processada: ${d.membros.length} membro(s) sugerido(s). Revise na próxima etapa.`);
      } else {
        toast.info("CI processada, mas não foram identificados membros. Preencha manualmente.");
      }
      if (d.avisos && d.avisos.length) {
        d.avisos.forEach((a) => toast.warning(a));
      }
    } catch (e) {
      toast.dismiss(tLoading);
      toast.error("Erro de rede ao importar CI: " + (e as Error).message);
    } finally {
      setImportando(false);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleImportar(f);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-[var(--color-ink)]">
          Dados da Portaria {tipo === "Alteração" ? "de Alteração" : "de Constituição"}
        </h1>
        <p className="text-sm text-[var(--color-ink-muted)] mt-1">
          Informe os dados específicos desta portaria. {bloqueadoCurso && "O curso/unidade vêm do comitê selecionado e não podem ser editados."}
        </p>
      </div>

      {/* Bloco: Importar CI */}
      <Card className="rounded-md border p-5" style={{ borderColor: "rgba(26,29,35,0.12)" }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--color-uems-navy)]/10">
              <Sparkles className="h-5 w-5 text-[var(--color-uems-navy)]" />
            </div>
            <div>
              <h2 className="font-display text-base text-[var(--color-ink)]">Importar CI da Coordenação</h2>
              <p className="text-sm text-[var(--color-ink-muted)] mt-0.5 max-w-xl leading-relaxed">
                Anexe a CI (PDF, imagem ou .docx). O sistema lê o documento e sugere o número
                da CI e os membros eleitos. <strong>Tudo é sugestão</strong> — revise antes de gerar a minuta.
              </p>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.webp,.gif,.bmp,.txt"
            onChange={onFileChange}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            disabled={importando}
            onClick={() => fileRef.current?.click()}
            className="border-[var(--color-uems-navy)] text-[var(--color-uems-navy)] hover:bg-[var(--color-uems-navy)]/5"
          >
            {importando ? (
              <><Sparkles className="h-4 w-4 mr-2 animate-pulse" /> Processando...</>
            ) : (
              <><Upload className="h-4 w-4 mr-2" /> Importar CI</>
            )}
          </Button>
        </div>

        {ciAnexada && (
          <div className="mt-4 flex items-center gap-2 text-sm text-[var(--color-ink-muted)] rounded-md border bg-[var(--color-paper)] p-2.5"
            style={{ borderColor: "rgba(26,29,35,0.1)" }}>
            <FileText className="h-4 w-4 text-[var(--color-uems-navy)]" />
            <span className="truncate">{ciAnexada.name}</span>
            <span className="text-xs">({(ciAnexada.size / 1024).toFixed(0)} KB)</span>
          </div>
        )}

        {sugestaoCi && (
          <div className="mt-4 rounded-md border border-[var(--color-uems-gold)]/40 bg-[#FBF6E6] p-4">
            <div className="flex items-start gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-[#8a6d12] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[var(--color-ink)]">
                <strong>Sugestões importadas da CI.</strong> Clique em "Aplicar sugestões" para preencher os
                campos (não sobrescreve o que já estiver preenchido). Revise tudo antes de avançar.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm mb-3">
              <Sugestao label="Número da CI" valor={sugestaoCi.ciNumero} />
              <Sugestao label="Curso" valor={sugestaoCi.curso} />
              <Sugestao label="Unidade" valor={sugestaoCi.unidade} />
            </div>
            {sugestaoCi.membros && sugestaoCi.membros.length > 0 && (
              <div className="mb-3">
                <p className="text-xs uppercase tracking-wide text-[var(--color-ink-muted)] mb-1.5">
                  {sugestaoCi.membros.length} membro(s) sugerido(s):
                </p>
                <ul className="text-sm space-y-1">
                  {sugestaoCi.membros.map((m, i) => (
                    <li key={i} className="flex gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#1f6b3a] flex-shrink-0 mt-0.5" />
                      <span><strong>{m.nome || "—"}</strong> — {m.funcao}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex gap-2">
              <Button size="sm" onClick={() => { aplicarSugestaoCi(); toast.success("Sugestões aplicadas. Revise os campos e avance."); }}
                className="bg-[var(--color-uems-navy)] hover:bg-[var(--color-uems-navy-deep)] text-white">
                Aplicar sugestões
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setCampo("sugestaoCi", null)}
                className="text-[var(--color-ink-muted)]">
                Descartar
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Bloco: Dados da portaria */}
      <Card className="rounded-md border p-5" style={{ borderColor: "rgba(26,29,35,0.12)" }}>
        <h2 className="font-display text-base text-[var(--color-ink)] mb-4">Identificação da portaria</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Número da nova Portaria" required>
            <input
              value={numeroPortaria}
              onChange={(e) => setCampo("numeroPortaria", e.target.value)}
              placeholder="Ex.: 1.234"
              className={inputCls}
            />
          </Field>
          <Field label="Data da nova Portaria" required>
            <input
              type="date"
              value={dataPortaria}
              onChange={(e) => setCampo("dataPortaria", e.target.value)}
              className={cn(inputCls, "font-data")}
            />
          </Field>
          <Field label="Número da CI da Coordenação" required>
            <input
              value={ciNumero}
              onChange={(e) => setCampo("ciNumero", e.target.value)}
              placeholder="Ex.: 123/2026"
              className={inputCls}
            />
          </Field>
        </div>
      </Card>

      {/* Bloco: Curso / unidade */}
      <Card className="rounded-md border p-5" style={{ borderColor: "rgba(26,29,35,0.12)" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-base text-[var(--color-ink)]">Curso e Unidade</h2>
          {bloqueadoCurso && (
            <span className="text-xs text-[var(--color-ink-muted)]">Campos bloqueados (comitê existente)</span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Curso" required>
            <input
              value={curso}
              disabled={bloqueadoCurso}
              onChange={(e) => setCampo("curso", e.target.value)}
              placeholder="Ex.: Direito"
              className={cn(inputCls, bloqueadoCurso && "bg-[var(--color-muted)] text-[var(--color-ink-muted)]")}
            />
          </Field>
          <Field label="Grau" required>
            <select
              value={grau}
              disabled={bloqueadoCurso}
              onChange={(e) => setCampo("grau", e.target.value as "bacharelado" | "licenciatura" | "")}
              className={cn(inputCls, bloqueadoCurso && "bg-[var(--color-muted)] text-[var(--color-ink-muted)]")}
            >
              <option value="">Selecione...</option>
              <option value="bacharelado">Bacharelado</option>
              <option value="licenciatura">Licenciatura</option>
            </select>
          </Field>
          <Field label="Unidade Universitária" required className="sm:col-span-2">
            <input
              value={unidade}
              disabled={bloqueadoCurso}
              onChange={(e) => setCampo("unidade", e.target.value)}
              placeholder="Ex.: Dourados"
              className={cn(inputCls, bloqueadoCurso && "bg-[var(--color-muted)] text-[var(--color-ink-muted)]")}
            />
            <p className="text-[11px] text-[var(--color-ink-muted)] mt-1">
              Informe apenas o nome/cidade da Unidade (ex.: "Dourados"). A minuta
              acrescenta "Unidade Universitária de" automaticamente.
            </p>
          </Field>
        </div>
      </Card>

      {/* Em Alteração, mostra a portaria de constituição original */}
      {bloqueadoCurso && comiteSnapshot && (
        <Card className="rounded-md border p-4 bg-[var(--color-paper)]" style={{ borderColor: "rgba(26,29,35,0.12)" }}>
          <p className="text-xs uppercase tracking-wide text-[var(--color-ink-muted)] mb-1">Portaria de Constituição original</p>
          <p className="text-sm text-[var(--color-ink)] font-data">
            PROE-UEMS n.º {comiteSnapshot.portariaConstituicaoNumero}, de{" "}
            {new Date(comiteSnapshot.portariaConstituicaoData).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
          <p className="text-xs text-[var(--color-ink-muted)] mt-1">
            Estes dados serão citados na minuta de Alteração (Art. 1.º). Não é necessário digitá-los.
          </p>
        </Card>
      )}

      {/* Navegação */}
      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => setEtapa(1)} className="text-[var(--color-ink-muted)]">
          <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <Button
          disabled={!validarAvanco()}
          onClick={() => setEtapa(3)}
          className="bg-[var(--color-uems-navy)] hover:bg-[var(--color-uems-navy-deep)] text-white disabled:opacity-50"
        >
          Avançar para membros <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-uems-navy)] focus:border-[var(--color-uems-navy)]";

function Field({
  label,
  required,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-[var(--color-ink)] mb-1.5">
        {label} {required && <span className="text-[var(--color-alert)]">*</span>}
      </label>
      {children}
    </div>
  );
}

function Sugestao({ label, valor }: { label: string; valor?: string }) {
  return (
    <div className="rounded-md border border-[rgba(26,29,35,0.1)] bg-white p-2.5">
      <p className="text-[10px] uppercase tracking-wide text-[var(--color-ink-muted)]">{label}</p>
      <p className="text-sm text-[var(--color-ink)] truncate">{valor || "—"}</p>
    </div>
  );
}
