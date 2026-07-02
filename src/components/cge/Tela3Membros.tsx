"use client";

import { useCge } from "@/lib/cge/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Plus, Trash2, UserCog, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { validarQuorum, MIN_MEMBROS, MAX_MEMBROS } from "@/lib/cge/quorum";
import type { FuncaoMembro } from "@/lib/cge/types";
import { cn } from "@/lib/utils";

// ===========================================================================
// Tela 3 — Membros do Comitê.
//   Formulário dinâmico com validação de quórum em tempo real:
//     - mínimo 3, máximo 5 membros (incluindo o coordenador nato)
//     - exatamente 1 Presidente
//     - exatamente 1 Coordenador(a) do Curso - Membro Nato
//   O botão "Avançar" fica bloqueado enquanto o quórum for inválido.
// ===========================================================================

const FUNCOES: FuncaoMembro[] = [
  "Presidente",
  "Coordenador(a) do Curso - Membro Nato",
  "Membro",
];

export function Tela3Membros() {
  const { membros, addMembro, removeMembro, atualizarMembro, setEtapa } = useCge();
  const q = validarQuorum(membros);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl text-[var(--color-ink)]">Membros do Comitê</h1>
          <p className="text-sm text-[var(--color-ink-muted)] mt-1">
            Informe o nome e a função de cada membro. O quórum é validado em tempo real.
          </p>
        </div>
        <Button onClick={addMembro} disabled={membros.length >= MAX_MEMBROS}
          className="bg-[var(--color-uems-navy)] hover:bg-[var(--color-uems-navy-deep)] text-white disabled:opacity-50">
          <Plus className="h-4 w-4 mr-1" /> Adicionar membro
        </Button>
      </div>

      {/* Painel de quórum */}
      <Card className={cn(
        "rounded-md border p-4",
        q.valido ? "border-[#1f6b3a]/30 bg-[#F4FAF6]" : "border-[var(--color-alert)]/30 bg-[#FDF3F2]"
      )}>
        <div className="flex items-start gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <UserCog className={cn("h-5 w-5", q.valido ? "text-[#1f6b3a]" : "text-[var(--color-alert)]")} />
            <span className="font-display text-base text-[var(--color-ink)]">Quórum</span>
          </div>
          <div className="flex items-center gap-4 text-sm flex-wrap">
            <Contador label="Total" valor={q.total} min={MIN_MEMBROS} max={MAX_MEMBROS} ok={q.total >= MIN_MEMBROS && q.total <= MAX_MEMBROS} />
            <Contador label="Presidentes" valor={q.presidentes} min={1} max={1} ok={q.presidentes === 1} />
            <Contador label="Coordenadores" valor={q.coordenadores} min={1} max={1} ok={q.coordenadores === 1} />
            <Contador label="Membros" valor={q.membrosSimples} ok={true} />
          </div>
        </div>

        {q.valido ? (
          <div className="mt-3 flex items-center gap-2 text-sm text-[#1f6b3a]">
            <CheckCircle2 className="h-4 w-4" />
            <span>Composição válida. Você já pode gerar a minuta.</span>
          </div>
        ) : (
          <ul className="mt-3 space-y-1">
            {q.erros.map((e, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-alert)]">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{e}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 flex items-start gap-2 text-xs text-[var(--color-ink-muted)]">
          <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
          <span>
            Regra: Art. 4.º do Regulamento dos Comitês (Deliberação CE/CEPE-UEMS Nº 432/2026,
            homologada pela Resolução CEPE-UEMS N.º 3.137/2026). O coordenador do curso é
            membro nato; o presidente é eleito entre os pares.
          </span>
        </div>
      </Card>

      {/* Lista de membros */}
      {membros.length === 0 ? (
        <Card className="rounded-md border p-10 text-center" style={{ borderColor: "rgba(26,29,35,0.12)" }}>
          <p className="text-sm text-[var(--color-ink-muted)]">
            Nenhum membro adicionado. Clique em "Adicionar membro" ou importe uma CI na etapa anterior.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {membros.map((m, i) => (
            <Card key={m.id} className="rounded-md border p-4" style={{ borderColor: "rgba(26,29,35,0.12)" }}>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-1">
                  <span className="text-xs text-[var(--color-ink-muted)] font-data">#{i + 1}</span>
                </div>
                <div className="sm:col-span-7">
                  <label className="block text-xs font-medium text-[var(--color-ink)] mb-1.5">Nome completo</label>
                  <input
                    value={m.nome}
                    onChange={(e) => atualizarMembro(m.id, { nome: e.target.value })}
                    placeholder="Nome do membro"
                    className="w-full rounded-md border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-uems-navy)]"
                    style={{ borderColor: "rgba(26,29,35,0.16)" }}
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-medium text-[var(--color-ink)] mb-1.5">Função</label>
                  <select
                    value={m.funcao}
                    onChange={(e) => atualizarMembro(m.id, { funcao: e.target.value as FuncaoMembro })}
                    className="w-full rounded-md border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-uems-navy)]"
                    style={{ borderColor: "rgba(26,29,35,0.16)" }}
                  >
                    {FUNCOES.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-1 flex justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMembro(m.id)}
                    className="text-[var(--color-alert)] hover:bg-[var(--color-alert)]/10 h-9 w-9"
                    aria-label="Remover membro"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Navegação */}
      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => setEtapa(2)} className="text-[var(--color-ink-muted)]">
          <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <Button
          disabled={!q.valido}
          onClick={() => setEtapa(4)}
          className="bg-[var(--color-uems-navy)] hover:bg-[var(--color-uems-navy-deep)] text-white disabled:opacity-50"
        >
          Gerar minuta <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

function Contador({
  label,
  valor,
  min,
  max,
  ok,
}: {
  label: string;
  valor: number;
  min?: number;
  max?: number;
  ok: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[var(--color-ink-muted)]">{label}:</span>
      <span className={cn("font-data font-semibold px-1.5 py-0.5 rounded",
        ok ? "text-[#1f6b3a]" : "text-[var(--color-alert)]")}>
        {valor}
      </span>
      {min !== undefined && max !== undefined && (
        <span className="text-xs text-[var(--color-ink-muted)]">({min}–{max})</span>
      )}
    </div>
  );
}
