# Migração para Supabase

Este guia explica como migrar o banco de dados do SQLite local para o Supabase (PostgreSQL gerenciado).

## Pré-requisitos

1. Conta no [Supabase](https://supabase.com) (plano gratuito é suficiente)
2. Node.js/Bun instalado
3. Projeto clonado localmente

## Passo a passo

### 1. Criar projeto no Supabase

1. Acesse https://supabase.com e faça login
2. Clique em **New Project**
3. Escolha um nome (ex: `portarias-cge`)
4. Defina uma senha forte para o banco de dados
5. Escolha a região mais próxima (ex: South America - São Paulo)
6. Clique em **Create new project** e aguarde a provisionação

### 2. Obter a string de conexão

1. No painel do Supabase, vá em **Project Settings** (ícone de engrenagem)
2. Clique em **Database**
3. Na seção **Connection string**, escolha **URI**
4. Selecione a aba **Transaction** (pooler) — recomendada para aplicações web
5. Copie a URL. Ela terá o formato:
   ```
   postgresql://postgres.[PROJETO]:[SENHA]@aws-0-[REGIAO].pooler.supabase.com:6543/postgres
   ```
6. Substitua `[SENHA]` pela senha definida no passo 1

### 3. Configurar o arquivo `.env`

1. Copie o arquivo `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```
2. Edite o `.env` e cole sua string de conexão completa:
   ```
   DATABASE_URL="postgresql://postgres.abc123:sua_senha@aws-0-sa-east-1.pooler.supabase.com:6543/postgres"
   ```

### 4. Confirmar o provider no schema

O `prisma/schema.prisma` já está configurado para PostgreSQL:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 5. Criar as tabelas no Supabase

```bash
bun run db:push
```

Este comando lê o schema do Prisma e cria todas as tabelas no Supabase:
- `Comite`
- `Membro`
- `Portaria`
- `Configuracao`
- `Auditoria`

### 6. Gerar o Prisma Client

```bash
bun run db:generate
```

### 7. Reiniciar a aplicação

```bash
bun run dev
```

A aplicação agora está conectada ao Supabase. Todos os dados (comitês, portarias, membros, configurações) serão persistidos no PostgreSQL.

## Migração de dados existentes (opcional)

Se você tem dados no SQLite local que deseja migrar para o Supabase:

1. Exporte os dados do SQLite:
   ```bash
   # Usando sqlite3 CLI
   sqlite3 db/custom.db .dump > backup.sql
   ```

2. Ajuste a sintaxe SQL de SQLite para PostgreSQL (tipos, auto-increment, etc.)

3. No painel do Supabase, vá em **SQL Editor** e cole/execute o script ajustado

Alternativamente, use uma ferramenta como [pgloader](https://pgloader.io/) para migração automatizada.

## Voltar para SQLite (desenvolvimento local)

Se precisar voltar ao SQLite para desenvolvimento local:

1. Edite `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

2. Edite `.env`:
   ```
   DATABASE_URL="file:./dev.db"
   ```

3. Rode:
   ```bash
   bun run db:push
   ```

## Notas

- O Supabase free tier permite até 500MB de banco e 2 projetos gratuitos
- A conexão via pooler (porta 6543) é recomendada para aplicações web
- Para conexão direta (sem pooler), use a porta 5432
- O Prisma é compatível com Supabase sem configurações adicionais
- Os campos `Bytes` (arquivos de CI) funcionam como `bytea` no PostgreSQL
