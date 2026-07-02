"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useCge } from "@/lib/cge/store";
import { Search, X, CornerDownLeft, FileText, Users, ArrowRight } from "lucide-react";
import type { Comite, PortariaGerada } from "@/lib/cge/types";
import { dataCurta, situacaoDoComite } from "@/lib/cge/datas";
import { cn } from "@/lib/utils";

// ===========================================================================
// Busca global com atalho Ctrl+K (ou Cmd+K no Mac).
// Abre um dialog sobreposto (command palette style) que busca simultaneamente
// em comitês (por curso/unidade) e em portarias (por número/CI). Ao selecionar
// um resultado, navega para a página correspondente.
// ===========================================================================

interface ResultadoComite {
  tipo: "comite";
  comite: Comite;
}
interface ResultadoPortaria {
  tipo: "portaria";
  portaria: PortariaGerada;
  comite?: Comite;
}
type Resultado = ResultadoComite | ResultadoPortaria;

export function GlobalSearch() {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const [comites, setComites] = useState<Comite[]>([]);
  const [portarias, setPortarias] = useState<{ portaria: PortariaGerada; comite?: Comite }[]>([]);
  const [indiceFoco, setIndiceFoco] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const setCursoConsultaId = useCge((s) => s.setCursoConsultaId);

  // Atalho Ctrl+K / Cmd+K para abrir; Esc para fechar.
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setAberto((v) => !v);
      } else if (e.key === "Escape" && aberto) {
        setAberto(false);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [aberto]);

  // Carrega dados quando abre pela primeira vez.
  useEffect(() => {
    if (!aberto || (comites.length === 0 && portarias.length === 0)) {
      Promise.all([
        fetch("/api/cge/comites").then((r) => r.json()),
        fetch("/api/cge/stats").then((r) => r.json()),
      ]).then(([cs, _st]) => {
        if (Array.isArray(cs)) {
          setComites(cs);
          // Para portarias, buscamos cada comitê e suas portarias.
          Promise.all(
            cs.map((c: Comite) =>
              fetch(`/api/cge/comites/${c.id}`).then((r) => r.json())
            )
          ).then((detalhes) => {
            const todas: { portaria: PortariaGerada; comite?: Comite }[] = [];
            detalhes.forEach((d, i) => {
              if (d && d.portarias && d.comite) {
                d.portarias.forEach((p: PortariaGerada) =>
                  todas.push({ portaria: p, comite: d.comite })
                );
              }
            });
            setPortarias(todas);
          });
        }
      });
    }
  }, [aberto, comites.length, portarias.length]);

  // Foca o input ao abrir.
  useEffect(() => {
    if (aberto) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [aberto]);

  // Filtra resultados pela busca.
  const resultados = useMemo<Resultado[]>(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return [];
    const rc: Resultado[] = comites
      .filter(
        (c) =>
          c.curso.toLowerCase().includes(q) ||
          c.unidadeUniversitaria.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map((c) => ({ tipo: "comite", comite: c }));
    const rp: Resultado[] = portarias
      .filter(
        ({ portaria, comite }) =>
          portaria.numeroPortaria.toLowerCase().includes(q) ||
          portaria.ciNumero.toLowerCase().includes(q) ||
          (comite?.curso.toLowerCase().includes(q) ?? false)
      )
      .slice(0, 5)
      .map(({ portaria, comite }) => ({ tipo: "portaria", portaria, comite }));
    return [...rc, ...rp];
  }, [busca, comites, portarias]);

  // Reset do índice focado quando a busca muda — feito inline no onChange
  // para evitar setState síncrono em effect.

  // Navegação por teclado dentro dos resultados.
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndiceFoco((i) => Math.min(i + 1, resultados.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndiceFoco((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && resultados[indiceFoco]) {
      e.preventDefault();
      selecionar(resultados[indiceFoco]);
    }
  }

  function selecionar(r: Resultado) {
    if (r.tipo === "comite") {
      setCursoConsultaId(r.comite.id);
    } else if (r.comite) {
      setCursoConsultaId(r.comite.id);
      // O modal de visualização da portaria fica acessível na página do curso.
    }
    // Navega para a área de consulta SEM resetar cursoConsultaId
    // (irParaConsultar resetaria para null).
    useCge.setState({ area: "consultar" });
    setAberto(false);
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="hidden sm:flex items-center gap-2 text-xs text-white/60 hover:text-white border border-white/15 rounded-md px-2.5 py-1.5 transition-colors hover:bg-white/5"
        title="Buscar (Ctrl+K)"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Buscar…</span>
        <kbd className="font-data text-[10px] bg-white/10 px-1 py-0.5 rounded">⌘K</kbd>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Busca global"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setAberto(false)}
      />
      {/* Dialog */}
      <div className="cge-anim-in relative w-full max-w-xl rounded-md border bg-white shadow-xl overflow-hidden"
        style={{ borderColor: "rgba(26,29,35,0.14)" }}>
        {/* Input */}
        <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "rgba(26,29,35,0.1)" }}>
          <Search className="h-4 w-4 text-[var(--color-ink-muted)] flex-shrink-0" />
          <input
            ref={inputRef}
            value={busca}
            onChange={(e) => { setBusca(e.target.value); setIndiceFoco(0); }}
            onKeyDown={onKeyDown}
            placeholder="Buscar por curso, unidade, nº de portaria ou CI…"
            className="flex-1 bg-transparent text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setAberto(false)}
            className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] p-1 rounded"
            aria-label="Fechar busca"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {/* Resultados */}
        <div className="max-h-[50vh] overflow-y-auto scroll-thin">
          {!busca.trim() ? (
            <div className="px-4 py-8 text-center">
              <Search className="h-8 w-8 mx-auto text-[var(--color-ink-muted)]/40 mb-2" />
              <p className="text-sm text-[var(--color-ink-muted)]">
                Digite para buscar em comitês e portarias.
              </p>
              <p className="text-xs text-[var(--color-ink-muted)]/70 mt-1">
                Atalho: <kbd className="font-data bg-[var(--color-muted)] px-1 rounded">Ctrl</kbd> +{" "}
                <kbd className="font-data bg-[var(--color-muted)] px-1 rounded">K</kbd>
              </p>
            </div>
          ) : resultados.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-[var(--color-ink-muted)]">
                Nenhum resultado para "<strong>{busca}</strong>".
              </p>
            </div>
          ) : (
            <ul role="listbox">
              {resultados.map((r, i) => {
                const focado = i === indiceFoco;
                return (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => selecionar(r)}
                      onMouseEnter={() => setIndiceFoco(i)}
                      className={cn(
                        "w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors",
                        focado ? "bg-[var(--color-paper)]" : "hover:bg-[var(--color-paper)]"
                      )}
                    >
                      <span className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-md flex-shrink-0",
                        r.tipo === "comite"
                          ? "bg-[#E6ECF5] text-[var(--color-uems-navy)]"
                          : "bg-[#FBF6E6] text-[#8a6d12]"
                      )}>
                        {r.tipo === "comite" ? <Users className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        {r.tipo === "comite" ? (
                          <>
                            <p className="text-sm text-[var(--color-ink)] truncate font-medium">
                              {r.comite.curso} <span className="text-[var(--color-ink-muted)] font-normal">· {r.comite.grau}</span>
                            </p>
                            <p className="text-xs text-[var(--color-ink-muted)] truncate">
                              {r.comite.unidadeUniversitaria} · Portaria n.º {r.comite.portariaConstituicaoNumero}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-[var(--color-ink)] truncate font-medium">
                              Portaria n.º {r.portaria.numeroPortaria}{" "}
                              <span className={cn(
                                "text-[10px] font-medium px-1.5 py-0.5 rounded uppercase ml-1",
                                r.portaria.tipo === "Constituição"
                                  ? "bg-[#FBF6E6] text-[#8a6d12]"
                                  : "bg-[#E6ECF5] text-[var(--color-uems-navy)]"
                              )}>{r.portaria.tipo}</span>
                            </p>
                            <p className="text-xs text-[var(--color-ink-muted)] truncate">
                              {r.comite?.curso} · CI n.º {r.portaria.ciNumero} · {dataCurta(r.portaria.dataPortaria)}
                            </p>
                          </>
                        )}
                      </div>
                      {focado && <CornerDownLeft className="h-3.5 w-3.5 text-[var(--color-ink-muted)] flex-shrink-0" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {/* Rodapé com dica */}
        <div className="px-4 py-2 border-t bg-[var(--color-paper)] flex items-center justify-between text-[11px] text-[var(--color-ink-muted)]"
          style={{ borderColor: "rgba(26,29,35,0.08)" }}>
          <span className="flex items-center gap-1">
            <ArrowRight className="h-3 w-3" /> Navegação:
            <kbd className="font-data bg-white px-1 rounded border" style={{ borderColor: "rgba(26,29,35,0.15)" }}>↑</kbd>
            <kbd className="font-data bg-white px-1 rounded border" style={{ borderColor: "rgba(26,29,35,0.15)" }}>↓</kbd>
            <kbd className="font-data bg-white px-1 rounded border" style={{ borderColor: "rgba(26,29,35,0.15)" }}>↵</kbd>
          </span>
          <span>{resultados.length} resultado(s)</span>
        </div>
      </div>
    </div>
  );
}
