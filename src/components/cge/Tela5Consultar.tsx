"use client";

import { useCge } from "@/lib/cge/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Search, ChevronRight, ChevronLeft, ArrowLeft, Users, FileText, Download,
  Calendar, History, UserCheck, AlertTriangle, Building2, GraduationCap,
  MoreVertical, Pause, Play, Trash2, Copy, Eye,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import type { Comite, PortariaGerada } from "@/lib/cge/types";
import { dataCurta, dataPorExtenso, diasParaTermino, situacaoDoComite, terminoMandato } from "@/lib/cge/datas";
import { ordenarMembrosParaTabela } from "@/lib/cge/quorum";
import { cn } from "@/lib/utils";
import { PortariaViewerModal } from "@/components/cge/PortariaViewerModal";
import { MemberDetailsModal } from "@/components/cge/MemberDetailsModal";
import { useConfirm } from "@/components/cge/ConfirmDialog";

// ===========================================================================
// Tela 5 — Consulta de comitês e histórico.
//   - Lista com busca/filtro por curso e/ou unidade, com situação do mandato.
//   - Página do curso: bloco "Comitê atual" + linha do tempo "Histórico".
// ===========================================================================

export function Tela5Consultar() {
  const cursoConsultaId = useCge((s) => s.cursoConsultaId);
  const setCursoConsultaId = useCge((s) => s.setCursoConsultaId);

  if (cursoConsultaId) {
    return <PaginaCurso id={cursoConsultaId} onBack={() => setCursoConsultaId(null)} />;
  }
  return <ListaCursos />;
}

// ---- Lista de cursos -------------------------------------------------------

function ListaCursos() {
  const setCursoConsultaId = useCge((s) => s.setCursoConsultaId);
  const irParaNovo = useCge((s) => s.irParaNovo);
  const [comites, setComites] = useState<Comite[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroSit, setFiltroSit] = useState<string>("todos");
  const [filtroGrau, setFiltroGrau] = useState<string>("todos");
  const [filtroUnidade, setFiltroUnidade] = useState<string>("todas");
  const [exportandoCsv, setExportandoCsv] = useState(false);

  useEffect(() => {
    fetch("/api/cge/comites")
      .then(async (r) => {
        const d = await r.json();
        if (Array.isArray(d)) {
          setComites(d);
          setErro(null);
        } else setErro(d.error || "Erro ao carregar.");
      })
      .catch(() => setErro("Falha de rede."))
      .finally(() => setLoading(false));
  }, []);

  // Lista de unidades distintas para o filtro (ordenada).
  const unidadesDisponiveis = Array.from(
    new Set(comites.map((c) => c.unidadeUniversitaria))
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));

  const filtrados = comites.filter((c) => {
    const q = busca.trim().toLowerCase();
    const matchBusca = !q ||
      c.curso.toLowerCase().includes(q) ||
      c.unidadeUniversitaria.toLowerCase().includes(q);
    const sit = situacaoDoComite(c.status, c.portariaConstituicaoData);
    const matchSit = filtroSit === "todos" || sit === filtroSit;
    const matchGrau = filtroGrau === "todos" || c.grau === filtroGrau;
    const matchUnidade = filtroUnidade === "todas" || c.unidadeUniversitaria === filtroUnidade;
    return matchBusca && matchSit && matchGrau && matchUnidade;
  });

  // Exporta relatório CSV completo (ignora filtros — é um relatório global).
  async function exportarCsv() {
    setExportandoCsv(true);
    try {
      const r = await fetch("/api/cge/exportar-csv");
      if (!r.ok) throw new Error("Falha ao gerar relatório.");
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cd = r.headers.get("Content-Disposition") || "";
      const m = cd.match(/filename="?([^";]+)"?/);
      a.download = m ? decodeURIComponent(m[1]) : "relatorio_cge.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Relatório CSV baixado.");
    } catch (e) {
      toast.error("Erro: " + (e as Error).message);
    } finally {
      setExportandoCsv(false);
    }
  }

  const contagem = comites.reduce((acc, c) => {
    const sit = situacaoDoComite(c.status, c.portariaConstituicaoData);
    acc[sit] = (acc[sit] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-[var(--color-ink)]">Comitês & Histórico</h1>
        <p className="text-sm text-[var(--color-ink-muted)] mt-1">
          Consulte o comitê atual e a linha do tempo de portarias de cada curso.
        </p>
      </div>

      {/* Filtros */}
      <Card className="rounded-md border p-4" style={{ borderColor: "rgba(26,29,35,0.12)" }}>
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por curso ou unidade..."
              className="w-full pl-8 pr-3 py-2 text-sm rounded-md border bg-card focus:outline-none focus:ring-1 focus:ring-[var(--color-uems-navy)]"
              style={{ borderColor: "rgba(26,29,35,0.16)" }}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <FiltroChip label="Todos" ativo={filtroSit === "todos"} onClick={() => setFiltroSit("todos")} />
            <FiltroChip label={`Ativos (${contagem.ativo || 0})`} ativo={filtroSit === "ativo"} onClick={() => setFiltroSit("ativo")} />
            <FiltroChip label={`Vencendo (${contagem.vencendo || 0})`} ativo={filtroSit === "vencendo"} onClick={() => setFiltroSit("vencendo")} />
            <FiltroChip label={`Vencidos (${contagem.vencido || 0})`} ativo={filtroSit === "vencido"} onClick={() => setFiltroSit("vencido")} />
            <FiltroChip label={`Encerrados (${contagem.encerrado || 0})`} ativo={filtroSit === "encerrado"} onClick={() => setFiltroSit("encerrado")} />
          </div>
        </div>

        {/* Filtros refinados (grau + unidade) + exportação CSV */}
        <div className="mt-3 pt-3 border-t flex flex-col sm:flex-row gap-3 sm:items-center justify-between" style={{ borderColor: "rgba(26,29,35,0.08)" }}>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-[var(--color-ink-muted)] whitespace-nowrap">Grau:</label>
              <select
                value={filtroGrau}
                onChange={(e) => setFiltroGrau(e.target.value)}
                className="text-xs rounded-md border bg-card px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[var(--color-uems-navy)]"
                style={{ borderColor: "rgba(26,29,35,0.16)" }}
              >
                <option value="todos">Todos</option>
                <option value="bacharelado">Bacharelado</option>
                <option value="licenciatura">Licenciatura</option>
              </select>
            </div>
            {unidadesDisponiveis.length > 0 && (
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-[var(--color-ink-muted)] whitespace-nowrap">Unidade:</label>
                <select
                  value={filtroUnidade}
                  onChange={(e) => setFiltroUnidade(e.target.value)}
                  className="text-xs rounded-md border bg-card px-2 py-1 max-w-[180px] focus:outline-none focus:ring-1 focus:ring-[var(--color-uems-navy)]"
                  style={{ borderColor: "rgba(26,29,35,0.16)" }}
                >
                  <option value="todas">Todas</option>
                  {unidadesDisponiveis.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            )}
            {(filtroGrau !== "todos" || filtroUnidade !== "todas" || busca) && (
              <button
                type="button"
                onClick={() => { setFiltroGrau("todos"); setFiltroUnidade("todas"); setBusca(""); }}
                className="text-xs text-[var(--color-uems-navy)] hover:underline"
              >
                Limpar filtros
              </button>
            )}
            <span className="text-xs text-[var(--color-ink-muted)] ml-auto sm:ml-0">
              {filtrados.length} de {comites.length} comitê(s)
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={exportarCsv}
            disabled={exportandoCsv || comites.length === 0}
            className="border-[rgba(26,29,35,0.2)] h-8"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            {exportandoCsv ? "Gerando..." : "Exportar CSV"}
          </Button>
        </div>
      </Card>

      {loading ? (
        <div className="p-10 text-center text-sm text-[var(--color-ink-muted)]">Carregando comitês...</div>
      ) : erro ? (
        <div className="p-10 text-center text-sm text-[var(--color-alert)]">{erro}</div>
      ) : filtrados.length === 0 ? (
        <Card className="rounded-md border p-10 text-center" style={{ borderColor: "rgba(26,29,35,0.12)" }}>
          <Users className="h-10 w-10 mx-auto text-[var(--color-ink-muted)] mb-3" />
          <p className="text-sm text-[var(--color-ink-muted)] mb-4">
            {comites.length === 0
              ? "Nenhum comitê cadastrado ainda. Comece constituindo o primeiro."
              : "Nenhum comitê encontrado com os filtros atuais."}
          </p>
          {comites.length === 0 && (
            <Button onClick={irParaNovo} className="bg-[var(--color-uems-navy)] hover:bg-[var(--color-uems-navy-deep)] text-white">
              Constituir novo comitê
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtrados.map((c) => {
            const sit = situacaoDoComite(c.status, c.portariaConstituicaoData);
            const dias = diasParaTermino(c.portariaConstituicaoData);
            const termino = terminoMandato(c.portariaConstituicaoData);
            return (
              <button key={c.id} type="button" onClick={() => setCursoConsultaId(c.id)}
                className="text-left rounded-md border bg-card p-5 transition-all hover:border-[var(--color-uems-navy)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-uems-navy)]"
                style={{ borderColor: "rgba(26,29,35,0.12)" }}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <h3 className="font-display text-base text-[var(--color-ink)] truncate">{c.curso}</h3>
                    <p className="text-xs text-[var(--color-ink-muted)] capitalize">{c.grau}</p>
                  </div>
                  <BadgeSituacao sit={sit} />
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center gap-2 text-[var(--color-ink-muted)]">
                    <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{c.unidadeUniversitaria}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--color-ink-muted)]">
                    <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="font-data text-xs">Portaria n.º {c.portariaConstituicaoNumero} · {dataCurta(c.portariaConstituicaoData)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--color-ink-muted)]">
                    <Users className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="text-xs">{c.membros.length} membro(s) em exercício</span>
                  </div>
                  {sit !== "encerrado" && (
                    <div className="flex items-center gap-2 text-[var(--color-ink-muted)]">
                      <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="text-xs">
                        Término do mandato: <span className="font-data">{dataCurta(termino)}</span>
                        {dias < 0 ? " (vencido)" : dias <= 60 ? ` · em ${dias}d` : ""}
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t flex items-center justify-end gap-1 text-xs text-[var(--color-uems-navy)]"
                  style={{ borderColor: "rgba(26,29,35,0.08)" }}>
                  Ver página do curso <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---- Página do curso -------------------------------------------------------

function PaginaCurso({ id, onBack }: { id: string; onBack: () => void }) {
  const irParaNovo = useCge((s) => s.irParaNovo);
  const selecionarComite = useCge((s) => s.selecionarComite);
  const setTipo = useCge((s) => s.setTipo);
  const setEtapa = useCge((s) => s.setEtapa);
  const [data, setData] = useState<{ comite: Comite; portarias: PortariaGerada[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  // Portaria selecionada para visualização no modal.
  const [portariaView, setPortariaView] = useState<PortariaGerada | null>(null);
  // Membro selecionado para visualização do histórico.
  const [membroView, setMembroView] = useState<string | null>(null);
  const confirmar = useConfirm();

  useEffect(() => {
    fetch(`/api/cge/comites/${id}`)
      .then(async (r) => {
        const d = await r.json();
        if (r.ok) { setData(d); setErro(null); }
        else setErro(d.error || "Erro ao carregar.");
      })
      .catch(() => setErro("Falha de rede."))
      .finally(() => setLoading(false));
  }, [id]);

  function handleAlterar() {
    if (!data) return;
    selecionarComite(data.comite);
    setTipo("Alteração");
    setEtapa(2);
    irParaNovo();
    // Como irParaNovo reseta o form, precisamos re-aplicar a seleção depois.
    setTimeout(() => {
      selecionarComite(data.comite);
      setTipo("Alteração");
      setEtapa(2);
    }, 0);
  }

  async function baixarCi(p: PortariaGerada) {
    if (!p.ciArquivoNome) {
      toast.info("Esta portaria não possui arquivo de CI anexado.");
      return;
    }
    const r = await fetch(`/api/cge/portarias/${p.id}?file=ci`);
    if (!r.ok) {
      toast.error("Não foi possível baixar a CI.");
      return;
    }
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = p.ciArquivoNome;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function copiarTexto(p: PortariaGerada) {
    try {
      await navigator.clipboard.writeText(p.textoGerado);
      toast.success("Minuta copiada.");
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }

  // Encerra (pausa) ou reativa o comitê. Apenas altera o status — não apaga
  // dados nem histórico, que permanecem disponíveis para consulta.
  async function toggleStatusComite() {
    if (!data) return;
    const novoStatus = data.comite.status === "ativo" ? "encerrado" : "ativo";
    if (novoStatus === "encerrado") {
      const ok = await confirmar({
        titulo: "Encerrar este comitê?",
        descricao:
          "O histórico será mantido, mas o comitê sairá da contagem de ativos. Esta ação pode ser desfeita a qualquer momento.",
        variant: "warning",
        confirmLabel: "Encerrar comitê",
      });
      if (!ok) return;
    }
    try {
      const r = await fetch(`/api/cge/comites/${data.comite.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membros: data.comite.membros, status: novoStatus }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.error || "Falha ao atualizar status.");
      }
      const atualizado = await r.json();
      setData({ ...data, comite: atualizado });
      toast.success(novoStatus === "encerrado" ? "Comitê encerrado." : "Comitê reativado.");
    } catch (e) {
      toast.error("Erro: " + (e as Error).message);
    }
  }

  // Exclui uma portaria do histórico. Pede confirmação. Não recria/remove
  // o comitê — apenas remove o registro de log.
  async function excluirPortaria(p: PortariaGerada) {
    const ok = await confirmar({
      titulo: `Excluir Portaria n.º ${p.numeroPortaria}?`,
      descricao:
        "Esta portaria será removida do histórico. O comitê não é afetado. Esta ação não pode ser desfeita.",
      variant: "danger",
      confirmLabel: "Excluir do histórico",
    });
    if (!ok) return;
    try {
      const r = await fetch(`/api/cge/portarias/${p.id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Falha ao excluir.");
      setData((d) => d ? { ...d, portarias: d.portarias.filter((x) => x.id !== p.id) } : d);
      toast.success("Portaria excluída do histórico.");
    } catch (e) {
      toast.error("Erro: " + (e as Error).message);
    }
  }

  // Exclui o comitê inteiro (com cascata de membros e portarias).
  // Ação destrutiva: exige digitação do nome do curso para confirmar.
  async function excluirComite() {
    if (!data) return;
    const ok = await confirmar({
      titulo: `Excluir definitivamente o comitê de ${data.comite.curso}?`,
      descricao:
        "Todos os membros e o histórico de portarias serão removidos permanentemente. Esta ação NÃO pode ser desfeita.",
      variant: "danger",
      confirmLabel: "Excluir comitê",
      exigirDigitacao: data.comite.curso,
    });
    if (!ok) return;
    try {
      const r = await fetch(`/api/cge/comites/${data.comite.id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Falha ao excluir comitê.");
      toast.success("Comitê excluído.");
      onBack();
    } catch (e) {
      toast.error("Erro: " + (e as Error).message);
    }
  }

  if (loading) {
    return <div className="p-10 text-center text-sm text-[var(--color-ink-muted)]">Carregando curso...</div>;
  }
  if (erro || !data) {
    return (
      <div className="p-10 text-center">
        <p className="text-sm text-[var(--color-alert)] mb-4">{erro || "Comitê não encontrado."}</p>
        <Button variant="outline" onClick={onBack} className="border-[rgba(26,29,35,0.2)]">Voltar à lista</Button>
      </div>
    );
  }

  const { comite, portarias } = data;
  const sit = situacaoDoComite(comite.status, comite.portariaConstituicaoData);
  const termino = terminoMandato(comite.portariaConstituicaoData);
  const dias = diasParaTermino(comite.portariaConstituicaoData);
  const membrosOrdenados = ordenarMembrosParaTabela(comite.membros);
  const portariasOrdenadas = [...portarias].sort(
    (a, b) => new Date(b.dataPortaria).getTime() - new Date(a.dataPortaria).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho da página do curso */}
      <div>
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-uems-navy)] mb-3">
          <ArrowLeft className="h-4 w-4" /> Voltar à lista
        </button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-2xl text-[var(--color-ink)]">{comite.curso}</h1>
            <p className="text-sm text-[var(--color-ink-muted)] capitalize mt-0.5 flex items-center gap-2">
              <GraduationCap className="h-4 w-4" /> {comite.grau} · {comite.unidadeUniversitaria}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <BadgeSituacao sit={sit} />
            <Button onClick={handleAlterar} size="sm"
              className="bg-[var(--color-uems-navy)] hover:bg-[var(--color-uems-navy-deep)] text-white">
              <FileText className="h-4 w-4 mr-1" /> Alterar este comitê
            </Button>
            <ActionsMenu
              status={comite.status}
              onToggleStatus={toggleStatusComite}
              onExcluir={excluirComite}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bloco: Comitê atual */}
        <Card className="rounded-md border lg:col-span-2" style={{ borderColor: "rgba(26,29,35,0.12)" }}>
          <div className="p-4 border-b flex items-center gap-2" style={{ borderColor: "rgba(26,29,35,0.08)" }}>
            <UserCheck className="h-4 w-4 text-[var(--color-uems-navy)]" />
            <h2 className="font-display text-base text-[var(--color-ink)]">Comitê atual</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoBox label="Portaria de Constituição" valor={`PROE-UEMS n.º ${comite.portariaConstituicaoNumero}`} sub={dataPorExtenso(comite.portariaConstituicaoData)} />
              <InfoBox label="Término do mandato" valor={dataCurta(termino)} sub={dias < 0 ? "Vencido" : `${dias} dias restantes`} alert={dias < 0} />
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--color-ink-muted)] mb-2">
                Membros em exercício <span className="normal-case font-normal">(clique no nome para ver o histórico)</span>
              </p>
              <div className="rounded-md border overflow-hidden" style={{ borderColor: "rgba(26,29,35,0.1)" }}>
                <table className="w-full text-sm">
                  <thead className="bg-[var(--color-paper)]">
                    <tr>
                      <th className="text-left px-3 py-2 text-xs font-medium text-[var(--color-ink-muted)]">Nome</th>
                      <th className="text-left px-3 py-2 text-xs font-medium text-[var(--color-ink-muted)]">Função</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "rgba(26,29,35,0.06)" }}>
                    {membrosOrdenados.map((m) => (
                      <tr key={m.id} className="hover:bg-[var(--color-paper)] transition-colors">
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => setMembroView(m.nome)}
                            className="text-[var(--color-uems-navy)] hover:underline text-left font-medium"
                            title="Ver histórico de participações"
                          >
                            {m.nome}
                          </button>
                        </td>
                        <td className="px-3 py-2 text-[var(--color-ink-muted)] text-xs">{m.funcao}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Card>

        {/* Bloco: Resumo */}
        <Card className="rounded-md border" style={{ borderColor: "rgba(26,29,35,0.12)" }}>
          <div className="p-4 border-b" style={{ borderColor: "rgba(26,29,35,0.08)" }}>
            <h2 className="font-display text-base text-[var(--color-ink)]">Resumo</h2>
          </div>
          <div className="p-4 space-y-3 text-sm">
            <ResumoLinha label="Total de membros" valor={`${comite.membros.length}`} />
            <ResumoLinha label="Portarias geradas" valor={`${portarias.length}`} />
            <ResumoLinha label="Constituições" valor={`${portarias.filter(p => p.tipo === "Constituição").length}`} />
            <ResumoLinha label="Alterações" valor={`${portarias.filter(p => p.tipo === "Alteração").length}`} />
            {dias < 0 && (
              <div className="flex items-start gap-2 text-xs text-[var(--color-alert)] mt-2 pt-2 border-t" style={{ borderColor: "rgba(26,29,35,0.08)" }}>
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                <span>Mandato vencido. Recomenda-se constituir novo comitê.</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Bloco: Histórico (linha do tempo) */}
      <Card className="rounded-md border" style={{ borderColor: "rgba(26,29,35,0.12)" }}>
        <div className="p-4 border-b flex items-center gap-2" style={{ borderColor: "rgba(26,29,35,0.08)" }}>
          <History className="h-4 w-4 text-[var(--color-uems-navy)]" />
          <h2 className="font-display text-base text-[var(--color-ink)]">Histórico de Portarias</h2>
          <span className="text-xs text-[var(--color-ink-muted)] ml-auto">{portarias.length} registro(s)</span>
        </div>
        {portariasOrdenadas.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--color-ink-muted)]">
            Nenhuma portaria registrada no histórico ainda.
          </div>
        ) : (
          <ol className="relative">
            {portariasOrdenadas.map((p, i) => (
              <li key={p.id} className="relative pl-10 pr-4 py-4 border-b last:border-b-0" style={{ borderColor: "rgba(26,29,35,0.06)" }}>
                {/* Marcador da timeline */}
                <span className={cn("absolute left-4 top-5 h-3 w-3 rounded-full border-2",
                  p.tipo === "Constituição" ? "bg-[var(--color-uems-gold)] border-[var(--color-uems-gold)]" : "bg-card border-[var(--color-uems-navy)]")} />
                {i < portariasOrdenadas.length - 1 && (
                  <span className="absolute left-[21px] top-9 bottom-0 w-px bg-[rgba(26,29,35,0.12)]" />
                )}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded uppercase tracking-wide",
                        p.tipo === "Constituição" ? "bg-[#FBF6E6] text-[#8a6d12]" : "bg-[#E6ECF5] text-[var(--color-uems-navy)]")}>
                        {p.tipo}
                      </span>
                      <span className="font-data text-sm text-[var(--color-ink)]">Portaria n.º {p.numeroPortaria}</span>
                      <span className="text-xs text-[var(--color-ink-muted)]">· {dataPorExtenso(p.dataPortaria)}</span>
                    </div>
                    <p className="text-xs text-[var(--color-ink-muted)] mb-2">
                      CI n.º {p.ciNumero} · {p.composicao.length} membro(s) nesta versão · salva em {dataCurta(p.criadoEm)}
                    </p>
                    {/* Composição desta versão (compacta) */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {ordenarMembrosParaTabela(p.composicao).map((m, idx) => (
                        <span key={idx} className="text-[11px] px-1.5 py-0.5 rounded bg-[var(--color-paper)] border text-[var(--color-ink-muted)]"
                          style={{ borderColor: "rgba(26,29,35,0.1)" }}>
                          {m.nome.split(" ").slice(0, 2).join(" ")}
                          {m.funcao === "Presidente" && " ★"}
                          {m.funcao.includes("Coordenador") && " ◆"}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0 items-center">
                    <Button size="sm" onClick={() => setPortariaView(p)}
                      className="bg-[var(--color-uems-navy)] hover:bg-[var(--color-uems-navy-deep)] text-white h-8">
                      <Eye className="h-3.5 w-3.5 mr-1" /> Visualizar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => copiarTexto(p)} className="border-[rgba(26,29,35,0.2)] h-8">
                      <Copy className="h-3.5 w-3.5" />
                      <span className="sr-only">Copiar minuta</span>
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => baixarCi(p)} disabled={!p.ciArquivoNome}
                      className="border-[rgba(26,29,35,0.2)] h-8 disabled:opacity-40" title="Baixar CI">
                      <Download className="h-3.5 w-3.5" />
                      <span className="sr-only">Baixar CI</span>
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => excluirPortaria(p)}
                      className="h-8 w-8 p-0 text-[var(--color-ink-muted)] hover:text-[var(--color-alert)] hover:bg-[var(--color-alert)]/10"
                      aria-label="Excluir portaria do histórico" title="Excluir do histórico">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>

      {/* Modal de visualização da minuta completa */}
      <PortariaViewerModal
        portaria={portariaView}
        aberto={!!portariaView}
        onFechar={() => setPortariaView(null)}
      />

      {/* Modal de detalhes do membro (histórico de participações) */}
      <MemberDetailsModal
        nome={membroView}
        aberto={!!membroView}
        onFechar={() => setMembroView(null)}
      />
    </div>
  );
}

// ---- Componentes auxiliares -------------------------------------------------

function FiltroChip({ label, ativo, onClick }: { label: string; ativo: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={cn("text-xs px-3 py-1.5 rounded-md border transition-colors",
        ativo
          ? "bg-[var(--color-uems-navy)] text-white border-[var(--color-uems-navy)]"
          : "bg-card text-[var(--color-ink-muted)] border-[rgba(26,29,35,0.16)] hover:border-[var(--color-uems-navy)]")}>
      {label}
    </button>
  );
}

function BadgeSituacao({ sit }: { sit: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    ativo: { label: "Ativo", cls: "bg-[#E6F0EA] text-[#1f6b3a]" },
    vencendo: { label: "Vencendo", cls: "bg-[#FBF6E6] text-[#8a6d12]" },
    vencido: { label: "Vencido", cls: "bg-[#FBEDED] text-[var(--color-alert)]" },
    encerrado: { label: "Encerrado", cls: "bg-[#EFEFEC] text-[var(--color-ink-muted)]" },
    sem_comite: { label: "Sem comitê", cls: "bg-[#EFEFEC] text-[var(--color-ink-muted)]" },
  };
  const m = map[sit] || map.ativo;
  return (
    <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded uppercase tracking-wide whitespace-nowrap", m.cls)}>
      {m.label}
    </span>
  );
}

function InfoBox({ label, valor, sub, alert }: { label: string; valor: string; sub?: string; alert?: boolean }) {
  return (
    <div className={cn("rounded-md border p-3", alert ? "border-[var(--color-alert)]/30 bg-[#FDF3F2]" : "border-[rgba(26,29,35,0.1)] bg-[var(--color-paper)]")}>
      <p className="text-[10px] uppercase tracking-wide text-[var(--color-ink-muted)]">{label}</p>
      <p className={cn("font-data text-sm mt-0.5", alert ? "text-[var(--color-alert)]" : "text-[var(--color-ink)]")}>{valor}</p>
      {sub && <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">{sub}</p>}
    </div>
  );
}

function ResumoLinha({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--color-ink-muted)]">{label}</span>
      <span className="font-data font-medium text-[var(--color-ink)]">{valor}</span>
    </div>
  );
}

// Menu de ações do comitê (encerrar/reativar + excluir). Fecha ao clicar fora.
function ActionsMenu({
  status,
  onToggleStatus,
  onExcluir,
}: {
  status: string;
  onToggleStatus: () => void;
  onExcluir: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [aberto]);

  const ativo = status === "ativo";

  return (
    <div className="relative" ref={ref}>
      <Button size="sm" variant="outline" onClick={() => setAberto((v) => !v)}
        className="border-[rgba(26,29,35,0.2)] h-8 w-8 p-0"
        aria-label="Mais ações" aria-haspopup="menu" aria-expanded={aberto}>
        <MoreVertical className="h-4 w-4" />
      </Button>
      {aberto && (
        <div role="menu" className="cge-anim-in absolute right-0 top-full mt-1 w-56 rounded-md border bg-card shadow-md z-20 py-1"
          style={{ borderColor: "rgba(26,29,35,0.14)" }}>
          <button type="button" role="menuitem"
            onClick={() => { setAberto(false); onToggleStatus(); }}
            className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-[var(--color-paper)] text-[var(--color-ink)]">
            {ativo ? <><Pause className="h-4 w-4" /> Encerrar comitê</> : <><Play className="h-4 w-4" /> Reativar comitê</>}
          </button>
          <div className="h-px bg-[rgba(26,29,35,0.08)] my-1" />
          <button type="button" role="menuitem"
            onClick={() => { setAberto(false); onExcluir(); }}
            className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-[var(--color-alert)]/10 text-[var(--color-alert)]">
            <Trash2 className="h-4 w-4" /> Excluir comitê
          </button>
        </div>
      )}
    </div>
  );
}
