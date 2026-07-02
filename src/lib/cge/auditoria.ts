// ===========================================================================
// Helper de auditoria — registra ações relevantes na tabela Auditoria.
// Cada chamada cria um registro imutável com timestamp, para rastreabilidade.
// ===========================================================================

import { db } from "@/lib/db";

export type AcaoAuditoria =
  | "comite_criado"
  | "comite_alterado"
  | "comite_encerrado"
  | "comite_reativado"
  | "comite_excluido"
  | "portaria_gerada"
  | "portaria_excluida"
  | "config_editada";

export type EntidadeAuditoria = "comite" | "portaria" | "config";

export async function registrarAuditoria(
  acao: AcaoAuditoria,
  entidade: EntidadeAuditoria,
  descricao: string,
  entidadeId?: string,
  detalhes?: Record<string, unknown>
): Promise<void> {
  try {
    await db.auditoria.create({
      data: {
        acao,
        entidade,
        entidadeId: entidadeId ?? null,
        descricao,
        detalhes: detalhes ? JSON.stringify(detalhes) : null,
      },
    });
  } catch (e) {
    // Auditoria nunca deve quebrar o fluxo principal — apenas loga no console.
    console.error("[auditoria] Falha ao registrar:", (e as Error).message);
  }
}
