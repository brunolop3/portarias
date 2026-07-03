import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  __prismaSchemaHash?: string
}

// Hash simples dos nomes de models presentes no schema — se mudar (ex.: novo
// model Auditoria adicionado), o cliente global é descartado e recriado.
// Isso resolve o problema de cliente stale em hot reload do dev server.
const MODELS_ESPERADOS = ["Comite", "Membro", "Portaria", "Configuracao", "Auditoria"]
const SCHEMA_HASH = MODELS_ESPERADOS.join("|")

if (globalForPrisma.__prismaSchemaHash !== SCHEMA_HASH) {
  // Schema mudou — descarta cliente global antigo.
  globalForPrisma.prisma = undefined
  globalForPrisma.__prismaSchemaHash = SCHEMA_HASH
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db