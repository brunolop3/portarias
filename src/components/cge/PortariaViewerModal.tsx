"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Download, Printer, X } from "lucide-react";
import { toast } from "sonner";
import type { PortariaGerada } from "@/lib/cge/types";
import { dataPorExtenso, dataCurta } from "@/lib/cge/datas";

// ===========================================================================
// Modal de visualização da minuta completa de uma Portaria.
// Mostra o texto exato gerado (textoGerado) em estilo "papel timbrado",
// com botões para copiar, baixar .docx e imprimir/PDF.
// ===========================================================================

export function PortariaViewerModal({
  portaria,
  aberto,
  onFechar,
}: {
  portaria: PortariaGerada | null;
  aberto: boolean;
  onFechar: () => void;
}) {
  if (!portaria) return null;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(portaria!.textoGerado);
      toast.success("Minuta copiada para a área de transferência.");
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }

  async function baixarDocx() {
    // Envia apenas o portariaId — o backend busca todos os dados (curso,
    // grau, unidade, membros, config) do banco, garantindo que o .docx
    // seja gerado com os dados corretos e completos.
    toast.loading("Gerando .docx...", { id: "docx-view" });
    try {
      const r = await fetch("/api/cge/exportar-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portariaId: portaria!.id }),
      });
      if (!r.ok) throw new Error("Falha ao gerar .docx");
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Portaria_PROE-UEMS_${portaria!.numeroPortaria.replace(/[^\d]/g, "_")}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Arquivo .docx baixado.", { id: "docx-view" });
    } catch (e) {
      toast.error((e as Error).message, { id: "docx-view" });
    }
  }

  function imprimir() {
    const w = window.open("", "_blank", "width=820,height=1000");
    if (!w) {
      toast.error("Pop-up bloqueado. Permita pop-ups para imprimir.");
      return;
    }
    const esc = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const linhas = portaria!.textoGerado.split("\n");
    const blocos: string[] = [];
    let tabela: string[] = [];
    function flush() {
      if (tabela.length === 0) return;
      const rows = tabela
        .map((l) => {
          const [n, f] = l.split(" | ");
          return `<tr><td>${esc(n || "")}</td><td>${esc(f || "")}</td></tr>`;
        })
        .join("");
      blocos.push(
        `<table><thead><tr><th>Nome do integrante</th><th>Função</th></tr></thead><tbody>${rows}</tbody></table>`
      );
      tabela = [];
    }
    for (const l of linhas) {
      const t = l.trim();
      if (!t) continue;
      if (t.includes(" | ")) {
        tabela.push(t);
        continue;
      }
      flush();
      if (t.startsWith("PORTARIA PROE-UEMS"))
        blocos.push(`<p class="titulo">${esc(t)}</p>`);
      else if (
        t.startsWith("Constitui o Comitê") ||
        t.startsWith("Altera os membros")
      )
        blocos.push(`<p class="ementa">${esc(t)}</p>`);
      else if (t === "RESOLVE:")
        blocos.push(`<p class="corpo resolve">${esc(t)}</p>`);
      else blocos.push(`<p class="corpo">${esc(t)}</p>`);
    }
    flush();
    w.document.open();
    w.document.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"/>
<title>Portaria n.º ${portaria!.numeroPortaria}</title>
<style>
@page { size: A4; margin: 3cm; }
body { font-family: "Times New Roman", Georgia, serif; font-size: 12pt; color: #1A1D23; line-height: 1.5; margin: 0; }
.timbre { text-align: center; margin-bottom: 1.2rem; } .timbre p { margin: 0; } .timbre .u { font-weight: bold; }
.titulo { font-weight: bold; margin: 1rem 0 0.8rem 0; }
.ementa { margin-left: 8cm; text-align: justify; margin-bottom: 0.8rem; }
.corpo { text-align: justify; text-indent: 1.5cm; margin: 0 0 0.6rem 0; }
.resolve { font-weight: bold; }
table { width: 100%; border-collapse: collapse; margin: 0.4rem 0 0.8rem 0; }
th, td { border: 1px solid #888; padding: 0.3rem 0.5rem; font-size: 11pt; text-align: left; }
th { background: #F2F2EE; font-weight: bold; }
.ass { text-align: center; margin-top: 1.6rem; } .ass .nome { font-weight: bold; text-transform: uppercase; }
</style></head><body>
<div class="timbre"><p class="u">UNIVERSIDADE ESTADUAL DE MATO GROSSO DO SUL</p>
<p>PRÓ-REITORIA DE ENSINO — PROE</p><p>DIVISÃO DE GESTÃO DO ENADE E INDICADORES DA EDUCAÇÃO SUPERIOR — DIGES</p></div>
${blocos.join("\n")}
<script>window.onload=function(){setTimeout(function(){window.print();},300);};</script>
</body></html>`);
    w.document.close();
  }

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden flex flex-col gap-0">
        <DialogHeader className="px-5 py-4 border-b bg-[var(--color-paper)]" style={{ borderColor: "rgba(26,29,35,0.1)" }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded uppercase tracking-wide ${
                    portaria.tipo === "Constituição"
                      ? "bg-[#FBF6E6] text-[#8a6d12]"
                      : "bg-[#E6ECF5] text-[var(--color-uems-navy)]"
                  }`}
                >
                  {portaria.tipo}
                </span>
                <DialogTitle className="font-display text-lg text-[var(--color-ink)]">
                  Portaria n.º {portaria.numeroPortaria}
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-[var(--color-ink-muted)]">
                {dataPorExtenso(portaria.dataPortaria)} · CI n.º {portaria.ciNumero} ·{" "}
                {portaria.composicao.length} membro(s) · salva em {dataCurta(portaria.criadoEm)}
              </DialogDescription>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="outline" onClick={copiar} className="border-[rgba(26,29,35,0.2)] h-8">
              <Copy className="h-3.5 w-3.5 mr-1" /> Copiar
            </Button>
            <Button size="sm" variant="outline" onClick={baixarDocx} className="border-[rgba(26,29,35,0.2)] h-8">
              <Download className="h-3.5 w-3.5 mr-1" /> .docx
            </Button>
            <Button size="sm" variant="outline" onClick={imprimir} className="border-[rgba(26,29,35,0.2)] h-8">
              <Printer className="h-3.5 w-3.5 mr-1" /> Imprimir / PDF
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto scroll-thin bg-card">
          <pre className="portaria-paper whitespace-pre-wrap font-serif" style={{ margin: 0, borderRadius: 0, border: "none" }}>
            {portaria.textoGerado}
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  );
}
