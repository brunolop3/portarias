"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Save, Plus, Trash2, AlertTriangle, CheckCircle2, FileText } from "lucide-react";
import { toast } from "sonner";
import type { PortariaGerada, Membro, FuncaoMembro } from "@/lib/cge/types";
import { validarQuorum, MIN_MEMBROS, MAX_MEMBROS } from "@/lib/cge/quorum";
import { cn } from "@/lib/utils";

// ===========================================================================
// Modal de edição de uma Portaria existente.
// Permite editar: número, data, CI e composição de membros.
// O texto da minuta é re-gerado automaticamente no backend ao salvar.
// ===========================================================================

const FUNCOES: FuncaoMembro[] = [
  "Presidente",
  "Coordenador(a) do Curso - Membro Nato",
  "Membro",
];

export function PortariaEditModal({
  portaria,
  aberto,
  onFechar,
  onSalvo,
}: {
  portaria: PortariaGerada | null;
  aberto: boolean;
  onFechar: () => void;
  onSalvo: () => void;
}) {
  const [numeroPortaria, setNumeroPortaria] = useState("");
  const [dataPortaria, setDataPortaria] = useState("");
  const [ciNumero, setCiNumero] = useState("");
  const [membros, setMembros] = useState<Membro[]>([]);
  const [salvando, setSalvando] = useState(false);

  // Inicializa o formulário quando a portaria muda.
  useEffect(() => {
    if (portaria) {
      setNumeroPortaria(portaria.numeroPortaria);
      setDataPortaria(portaria.dataPortaria);
      setCiNumero(portaria.ciNumero);
      setMembros(portaria.composicao.map((m) => ({ ...m })));
    }
  }, [portaria]);

  const q = validarQuorum(membros);

  function addMembro() {
    setMembros((m) => [...m, { id: Math.random().toString(36).slice(2), nome: "", funcao: "Membro" }]);
  }
  function removeMembro(id: string) {
    setMembros((m) => m.filter((x) => x.id !== id));
  }
  function atualizarMembro(id: string, patch: Partial<Membro>) {
    setMembros((m) => m.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  async function salvar() {
    if (!portaria) return;
    if (!numeroPortaria.trim() || !dataPortaria || !ciNumero.trim()) {
      toast.error("Preencha número, data e CI.");
      return;
    }
    if (!q.valido) {
      toast.error("Quórum inválido. Corrija a composição antes de salvar.");
      return;
    }
    setSalvando(true);
    try {
      const r = await fetch(`/api/cge/portarias/${portaria.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numeroPortaria: numeroPortaria.trim(),
          dataPortaria,
          ciNumero: ciNumero.trim(),
          membros,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Falha ao editar.");
      toast.success("Portaria editada. A minuta foi re-gerada com os novos dados.");
      onSalvo();
      onFechar();
    } catch (e) {
      toast.error("Erro: " + (e as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  if (!portaria) return null;

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden flex flex-col gap-0">
        <DialogHeader className="px-5 py-4 border-b bg-[var(--color-paper)]" style={{ borderColor: "rgba(26,29,35,0.1)" }}>
          <DialogTitle className="font-display text-lg text-[var(--color-ink)] flex items-center gap-2">
            <FileText className="h-5 w-5 text-[var(--color-uems-navy)]" />
            Editar Portaria n.º {portaria.numeroPortaria}
          </DialogTitle>
          <DialogDescription className="text-xs text-[var(--color-ink-muted)]">
            {portaria.tipo} · O texto da minuta será re-gerado automaticamente ao salvar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto scroll-thin p-5 space-y-5">
          {/* Dados da portaria */}
          <div>
            <h3 className="text-[10px] uppercase tracking-wider text-[var(--color-ink-muted)] mb-3 font-medium">
              Identificação
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--color-ink)] mb-1.5">
                  Número da Portaria
                </label>
                <input
                  value={numeroPortaria}
                  onChange={(e) => setNumeroPortaria(e.target.value)}
                  className="w-full rounded-md border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-uems-navy)]"
                  style={{ borderColor: "rgba(26,29,35,0.16)" }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-ink)] mb-1.5">
                  Data da Portaria
                </label>
                <input
                  type="date"
                  value={dataPortaria}
                  onChange={(e) => setDataPortaria(e.target.value)}
                  className="w-full rounded-md border bg-card px-3 py-2 text-sm font-data focus:outline-none focus:ring-1 focus:ring-[var(--color-uems-navy)]"
                  style={{ borderColor: "rgba(26,29,35,0.16)" }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-ink)] mb-1.5">
                  Número da CI
                </label>
                <input
                  value={ciNumero}
                  onChange={(e) => setCiNumero(e.target.value)}
                  className="w-full rounded-md border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-uems-navy)]"
                  style={{ borderColor: "rgba(26,29,35,0.16)" }}
                />
              </div>
            </div>
          </div>

          {/* Membros */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] uppercase tracking-wider text-[var(--color-ink-muted)] font-medium">
                Composição do comitê
              </h3>
              <Button
                size="sm"
                variant="outline"
                onClick={addMembro}
                disabled={membros.length >= MAX_MEMBROS}
                className="border-[rgba(26,29,35,0.2)] h-7 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" /> Adicionar
              </Button>
            </div>

            {/* Validação de quórum */}
            <div className={cn(
              "rounded-md border p-3 mb-3 text-xs",
              q.valido ? "border-[#1f6b3a]/30 bg-[#F4FAF6]" : "border-[var(--color-alert)]/30 bg-[#FDF3F2]"
            )}>
              <div className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1">
                  <span className="text-[var(--color-ink-muted)]">Total:</span>
                  <span className={cn("font-data font-semibold", q.total >= MIN_MEMBROS && q.total <= MAX_MEMBROS ? "text-[#1f6b3a]" : "text-[var(--color-alert)]")}>
                    {q.total}
                  </span>
                  <span className="text-[var(--color-ink-muted)]">({MIN_MEMBROS}–{MAX_MEMBROS})</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-[var(--color-ink-muted)]">Presidentes:</span>
                  <span className={cn("font-data font-semibold", q.presidentes === 1 ? "text-[#1f6b3a]" : "text-[var(--color-alert)]")}>{q.presidentes}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-[var(--color-ink-muted)]">Coordenadores:</span>
                  <span className={cn("font-data font-semibold", q.coordenadores === 1 ? "text-[#1f6b3a]" : "text-[var(--color-alert)]")}>{q.coordenadores}</span>
                </span>
              </div>
              {!q.valido && (
                <ul className="mt-2 space-y-0.5">
                  {q.erros.map((e, i) => (
                    <li key={i} className="flex items-start gap-1 text-[var(--color-alert)]">
                      <AlertTriangle className="h-3 w-3 flex-shrink-0 mt-0.5" /> {e}
                    </li>
                  ))}
                </ul>
              )}
              {q.valido && (
                <p className="mt-1.5 flex items-center gap-1 text-[#1f6b3a]">
                  <CheckCircle2 className="h-3 w-3" /> Composição válida.
                </p>
              )}
            </div>

            {/* Lista de membros */}
            <div className="space-y-2">
              {membros.map((m, i) => (
                <div key={m.id} className="grid grid-cols-12 gap-2 items-center">
                  <span className="col-span-1 text-xs text-[var(--color-ink-muted)] font-data">{i + 1}</span>
                  <input
                    value={m.nome}
                    onChange={(e) => atualizarMembro(m.id, { nome: e.target.value })}
                    placeholder="Nome do membro"
                    className="col-span-7 rounded-md border bg-card px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-uems-navy)]"
                    style={{ borderColor: "rgba(26,29,35,0.16)" }}
                  />
                  <select
                    value={m.funcao}
                    onChange={(e) => atualizarMembro(m.id, { funcao: e.target.value as FuncaoMembro })}
                    className="col-span-3 rounded-md border bg-card px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-uems-navy)]"
                    style={{ borderColor: "rgba(26,29,35,0.16)" }}
                  >
                    {FUNCOES.map((f) => (
                      <option key={f} value={f}>{f === "Coordenador(a) do Curso - Membro Nato" ? "Coordenador" : f}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeMembro(m.id)}
                    className="col-span-1 flex items-center justify-center h-8 w-8 rounded-md text-[var(--color-ink-muted)] hover:text-[var(--color-alert)] hover:bg-[var(--color-alert)]/10"
                    aria-label="Remover membro"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rodapé com ações */}
        <div className="px-5 py-3 border-t bg-[var(--color-paper)] flex justify-end gap-2" style={{ borderColor: "rgba(26,29,35,0.08)" }}>
          <Button variant="outline" onClick={onFechar} className="border-[rgba(26,29,35,0.2)]">
            Cancelar
          </Button>
          <Button
            onClick={salvar}
            disabled={salvando || !q.valido}
            className="bg-[var(--color-uems-navy)] hover:bg-[var(--color-uems-navy-deep)] text-white disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-1.5" />
            {salvando ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
