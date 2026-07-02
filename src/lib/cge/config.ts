// ===========================================================================
// Acesso à configuração global (texto fixo das portarias).
// Mantém sempre uma única linha na tabela Configuracao (id = "default"),
// criando com os valores institucionais atuais caso ainda não exista.
// ===========================================================================

import { db } from "@/lib/db";
import type { ConfiguracaoCGE } from "./types";
import { paraIsoDate } from "./datas";

// Valores institucionais atuais (junho/2026).
// Se houver nova normativa no futuro, o usuário edita pela tela de Configurações.
export const CONFIG_PADRAO = {
  resolucaoHomologacao431: "Resolução CEPE-UEMS N.º 3.136, de 16 de junho de 2026",
  resolucaoHomologacao432: "Resolução CEPE-UEMS N.º 3.137, de 16 de junho de 2026",
  dataDeliberacao431: "2026-05-28",
  dataDeliberacao432: "2026-05-28",
  portariaDelegacaoCompetencia: "Portaria N.º 027, de 15 de outubro de 2024",
  resolucaoCouni: "Resolução COUNI-UEMS N.º 479, de 23 de junho de 2016",
  nomeSignatario: "WALTER GUEDES DA SILVA",
  cargoSignatario: "Pró-Reitor de Ensino - PROE/UEMS",
};

export async function getConfig(): Promise<ConfiguracaoCGE> {
  let row = await db.configuracao.findUnique({ where: { id: "default" } });
  if (!row) {
    row = await db.configuracao.create({
      data: {
        id: "default",
        ...CONFIG_PADRAO,
        dataDeliberacao431: new Date(CONFIG_PADRAO.dataDeliberacao431),
        dataDeliberacao432: new Date(CONFIG_PADRAO.dataDeliberacao432),
      },
    });
  }
  return {
    id: row.id,
    resolucaoHomologacao431: row.resolucaoHomologacao431,
    resolucaoHomologacao432: row.resolucaoHomologacao432,
    dataDeliberacao431: paraIsoDate(row.dataDeliberacao431),
    dataDeliberacao432: paraIsoDate(row.dataDeliberacao432),
    portariaDelegacaoCompetencia: row.portariaDelegacaoCompetencia,
    resolucaoCouni: row.resolucaoCouni,
    nomeSignatario: row.nomeSignatario,
    cargoSignatario: row.cargoSignatario,
  };
}

export async function updateConfig(
  dados: Omit<ConfiguracaoCGE, "id">
): Promise<ConfiguracaoCGE> {
  const row = await db.configuracao.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      resolucaoHomologacao431: dados.resolucaoHomologacao431,
      resolucaoHomologacao432: dados.resolucaoHomologacao432,
      dataDeliberacao431: new Date(dados.dataDeliberacao431),
      dataDeliberacao432: new Date(dados.dataDeliberacao432),
      portariaDelegacaoCompetencia: dados.portariaDelegacaoCompetencia,
      resolucaoCouni: dados.resolucaoCouni,
      nomeSignatario: dados.nomeSignatario,
      cargoSignatario: dados.cargoSignatario,
    },
    update: {
      resolucaoHomologacao431: dados.resolucaoHomologacao431,
      resolucaoHomologacao432: dados.resolucaoHomologacao432,
      dataDeliberacao431: new Date(dados.dataDeliberacao431),
      dataDeliberacao432: new Date(dados.dataDeliberacao432),
      portariaDelegacaoCompetencia: dados.portariaDelegacaoCompetencia,
      resolucaoCouni: dados.resolucaoCouni,
      nomeSignatario: dados.nomeSignatario,
      cargoSignatario: dados.cargoSignatario,
    },
  });
  return {
    id: row.id,
    resolucaoHomologacao431: row.resolucaoHomologacao431,
    resolucaoHomologacao432: row.resolucaoHomologacao432,
    dataDeliberacao431: paraIsoDate(row.dataDeliberacao431),
    dataDeliberacao432: paraIsoDate(row.dataDeliberacao432),
    portariaDelegacaoCompetencia: row.portariaDelegacaoCompetencia,
    resolucaoCouni: row.resolucaoCouni,
    nomeSignatario: row.nomeSignatario,
    cargoSignatario: row.cargoSignatario,
  };
}
