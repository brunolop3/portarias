"use client";

import { useCge } from "@/lib/cge/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, Copy, Download, Save, FileText, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { gerarMinutaTexto } from "@/lib/cge/templates";
import { validarQuorum } from "@/lib/cge/quorum";
import type { PayloadMinuta } from "@/lib/cge/types";

// ===========================================================================
// Tela 4 — Geração e exportação da minuta.
//   - Gera o texto (cliente, via templates) para preview imediato.
//   - Botões: Copiar texto, Baixar .docx, Salvar no histórico.
//   - Ao salvar: POST /api/cge/portarias (re-gera o texto no servidor para
//     garantir fidelidade) e atualiza/cria o comitê conforme o tipo.
// ===========================================================================

export function Tela4Geracao() {
  const s = useCge();
  const {
    tipo, numeroPortaria, dataPortaria, curso, grau, unidade, ciNumero, ciArquivo,
    membros, comiteSelecionadoId, comiteSnapshot,
    config, setEtapa, resetForm, setArea, irParaConsultar,
  } = s;

  const q = validarQuorum(membros);
  const [salvando, setSalvando] = useState(false);
  const [salvoId, setSalvoId] = useState<string | null>(null);

  // Payload que seria enviado ao backend.
  const payload: PayloadMinuta | null = useMemo(() => {
    if (!config || !tipo) return null;
    return {
      tipo,
      numeroPortaria,
      dataPortaria,
      curso,
      grau: grau as "bacharelado" | "licenciatura",
      unidadeUniversitaria: unidade,
      ciNumero,
      membros,
      portariaConstituicaoNumero: comiteSnapshot?.portariaConstituicaoNumero,
      portariaConstituicaoData: comiteSnapshot?.portariaConstituicaoData,
      configuracao: config,
    };
  }, [config, tipo, numeroPortaria, dataPortaria, curso, grau, unidade, ciNumero, membros, comiteSnapshot]);

  // Texto gerado localmente (apenas para preview). O servidor re-gera ao salvar.
  const texto = useMemo(() => (payload ? gerarMinutaTexto(payload) : ""), [payload]);

  // Carrega config se ainda não estiver.
  useEffect(() => {
    if (!config) {
      fetch("/api/cge/config").then((r) => r.json()).then((c) => {
        if (c && !c.error) useCge.getState().setConfig(c);
      });
    }
  }, [config]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      toast.success("Minuta copiada para a área de transferência.");
    } catch {
      toast.error("Não foi possível copiar. Selecione o texto manualmente.");
    }
  }

  async function baixarDocx() {
    if (!payload) return;
    toast.loading("Gerando .docx...", { id: "docx" });
    try {
      const r = await fetch("/api/cge/exportar-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.error || "Falha ao gerar .docx");
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Portaria_PROE-UEMS_${numeroPortaria.replace(/[^\d]/g, "_")}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Arquivo .docx baixado.", { id: "docx" });
    } catch (e) {
      toast.error((e as Error).message, { id: "docx" });
    }
  }

  async function salvar() {
    if (!payload) return;
    setSalvando(true);
    try {
      const fd = new FormData();
      fd.append("payload", JSON.stringify({
        ...payload,
        comiteId: comiteSelecionadoId,
      }));
      if (ciArquivo) fd.append("ciArquivo", ciArquivo);
      const r = await fetch("/api/cge/portarias", { method: "POST", body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Falha ao salvar.");
      setSalvoId(d.portaria?.id ?? null);
      toast.success(
        tipo === "Constituição"
          ? "Portaria de Constituição salva e comitê criado no histórico."
          : "Portaria de Alteração salva e comitê atualizado."
      );
    } catch (e) {
      toast.error("Erro ao salvar: " + (e as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  if (!q.valido) {
    return (
      <Card className="rounded-md border border-[var(--color-alert)]/30 bg-[#FDF3F2] p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-[var(--color-alert)] flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="font-display text-base text-[var(--color-ink)]">Composição inválida</h2>
            <p className="text-sm text-[var(--color-ink-muted)] mt-1 mb-3">
              A geração da minuta está bloqueada porque o quórum não foi atendido.
            </p>
            <ul className="text-sm text-[var(--color-alert)] space-y-1 mb-4">
              {q.erros.map((e, i) => <li key={i}>• {e}</li>)}
            </ul>
            <Button onClick={() => setEtapa(3)} variant="outline" className="border-[rgba(26,29,35,0.2)]">
              Voltar e corrigir membros
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl text-[var(--color-ink)]">Minuta gerada</h1>
          <p className="text-sm text-[var(--color-ink-muted)] mt-1">
            Revise o texto, copie, baixe em .docx ou salve no histórico do comitê.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={copiar} className="border-[rgba(26,29,35,0.2)]">
            <Copy className="h-4 w-4 mr-1.5" /> Copiar texto
          </Button>
          <Button variant="outline" onClick={baixarDocx} className="border-[rgba(26,29,35,0.2)]">
            <Download className="h-4 w-4 mr-1.5" /> Baixar .docx
          </Button>
          <Button
            onClick={salvar}
            disabled={salvando || !!salvoId}
            className="bg-[var(--color-uems-navy)] hover:bg-[var(--color-uems-navy-deep)] text-white disabled:opacity-60"
          >
            {salvoId ? <><CheckCircle2 className="h-4 w-4 mr-1.5" /> Salvo no histórico</> :
              salvando ? <><RefreshCw className="h-4 w-4 mr-1.5 animate-spin" /> Salvando...</> :
              <><Save className="h-4 w-4 mr-1.5" /> Salvar no histórico</>}
          </Button>
        </div>
      </div>

      {/* Painel "papel timbrado" — elemento de assinatura visual da aplicação. */}
      <Card className="rounded-md border overflow-hidden" style={{ borderColor: "rgba(26,29,35,0.14)" }}>
        {/* Cabeçalho timbrado */}
        <div className="bg-[var(--color-paper)] border-b px-6 py-4 flex items-center justify-between"
          style={{ borderColor: "rgba(26,29,35,0.1)" }}>
          <div className="flex items-center gap-3">
            <img src="/diges-logo-transparente.png" alt="DIGES" className="h-7 w-auto" />
            <div className="text-[10px] uppercase tracking-wide text-[var(--color-ink-muted)] leading-tight">
              Universidade Estadual de Mato Grosso do Sul<br />
              Pró-Reitoria de Ensino · DIGES
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block text-[10px] font-data px-2 py-0.5 rounded bg-[var(--color-uems-navy)] text-white">
              {tipo === "Constituição" ? "CONSTITUIÇÃO" : "ALTERAÇÃO"}
            </span>
          </div>
        </div>

        {/* Corpo da minuta */}
        <div className="bg-white">
          <pre className="portaria-paper whitespace-pre-wrap font-serif max-h-[60vh] overflow-y-auto scroll-thin"
            style={{ margin: 0, borderRadius: 0 }}>
            {texto}
          </pre>
        </div>
      </Card>

      {/* Pós-salvamento */}
      {salvoId && (
        <Card className="rounded-md border border-[#1f6b3a]/30 bg-[#F4FAF6] p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-[#1f6b3a] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-[var(--color-ink)] font-medium">Portaria salva no histórico.</p>
              <p className="text-xs text-[var(--color-ink-muted)] mt-1">
                O comitê foi {tipo === "Constituição" ? "criado" : "atualizado"} e a minuta está disponível
                na página de consulta do curso, junto com a CI anexada.
              </p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={() => { resetForm(); setArea("inicio"); }}
                  className="bg-[var(--color-uems-navy)] hover:bg-[var(--color-uems-navy-deep)] text-white">
                  <FileText className="h-4 w-4 mr-1" /> Gerar outra portaria
                </Button>
                <Button size="sm" variant="outline" onClick={irParaConsultar}
                  className="border-[rgba(26,29,35,0.2)]">
                  Ver no histórico
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Navegação */}
      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => setEtapa(3)} className="text-[var(--color-ink-muted)]">
          <ChevronLeft className="h-4 w-4 mr-1" /> Voltar para membros
        </Button>
      </div>
    </div>
  );
}
