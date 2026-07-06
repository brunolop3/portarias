# HANDOVER — Sistema de Geração de Portarias do CGE (UEMS/DIGES)

> Documento de handover para manutenção futura por pessoa sem contexto prévio.
> Última atualização: versão inicial.

## 1. Visão geral

Aplicação web para **registrar a constituição e a alteração dos Comitês de Gestão
do Enade (CGE)** de cada curso da UEMS e **gerar automaticamente a minuta da
Portaria** correspondente, pronta para encaminhamento ao Diário Oficial.

A aplicação tem **uma única rota visível** (`/`). A navegação entre as 5 áreas
(Início, Gerar Portaria, Comitês & Histórico, Configurações) é feita por estado
(Zustand), não por rotas do Next.js. O fluxo de "Gerar Portaria" percorre 4
etapas (Telas 1→4) dentro de um stepper.

### Escopo
- Cadastro de comitês por curso + unidade.
- Geração de minutas de **Constituição** e **Alteração** (templates fixos).
- Importação de CI (Comunicação Interna) via IA (VLM) — sugestões, sempre com
  confirmação manual.
- Exportação em **.docx** (formato compatível com envio ao Diário Oficial).
- Histórico consultável por curso, com linha do tempo de todas as portarias.
- Configurações globais editáveis (textos fixos das portarias).

## 2. Stack técnica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) |
| Linguagem | TypeScript 5 |
| Estilo | Tailwind CSS 4 + tokens institucionais UEMS |
| UI | shadcn/ui (restilizado) + Lucide icons |
| Estado | Zustand (cliente) |
| Banco | Prisma ORM + PostgreSQL (Supabase) — veja `MIGRACAO_SUPABASE.md` |
| Importação de CI | desativada (sem IA); preenchimento manual |
| Export .docx | biblioteca `docx` |

## 3. Arquitetura de pastas

```
src/
├─ app/
│  ├─ layout.tsx              # Fontes institucionais (Source Serif 4, Inter, IBM Plex Mono)
│  ├─ globals.css             # Tokens UEMS + estilos do "papel timbrado" da minuta
│  ├─ page.tsx                # Roteamento por estado (area + etapa)
│  └─ api/cge/
│     ├─ config/route.ts              # GET/PUT configurações globais
│     ├─ comites/route.ts             # GET lista / POST cria
│     ├─ comites/[id]/route.ts        # GET detalhe / PUT membros / DELETE
│     ├─ portarias/route.ts           # POST salvar (cria/altera comitê + grava histórico)
│     ├─ portarias/[id]/route.ts      # GET portaria / GET ?file=ci (download) / DELETE
│     ├─ importar-ci/route.ts         # POST multipart → VLM extrai dados da CI
│     └─ exportar-docx/route.ts       # POST PayloadMinuta → .docx
├─ components/cge/
│  ├─ AppShell.tsx            # Header navy + nav + footer sticky (logo DIGES)
│  ├─ Stepper.tsx             # Indicador 1→4
│  ├─ TelaInicio.tsx          # Dashboard com atalhos
│  ├─ Tela1Escolher.tsx       # Constituir / Alterar (lista de comitês)
│  ├─ Tela2Dados.tsx          # Dados + Importar CI
│  ├─ Tela3Membros.tsx        # Membros + validação de quórum
│  ├─ Tela4Geracao.tsx        # Preview + Copiar / .docx / Salvar
│  ├─ Tela5Consultar.tsx      # Lista + página do curso (timeline)
│  └─ TelaConfig.tsx          # Configurações globais
└─ lib/cge/
   ├─ types.ts                # Tipos compartilhados
   ├─ datas.ts                # dataPorExtenso, terminoMandato, situacaoDoComite
   ├─ quorum.ts               # validarQuorum (3-5 membros, 1 Pres, 1 Coord)
   ├─ templates.ts            # Templates A/B + gerarMinutaTexto / gerarMinutaHtml
   ├─ config.ts               # getConfig/updateConfig (seed padrão)
   ├─ mappers.ts              # Prisma → tipos da app
   └─ store.ts                # Zustand (area, etapa, formulário)
```

## 4. Modelo de dados (Prisma)

Ver `prisma/schema.prisma`. Quatro modelos:

- **Comite**: curso + grau + unidade + portaria de constituição (nº e data) +
  status. Relaciona-se com Membro[] e Portaria[].
- **Membro**: nome + função (Presidente / Coordenador nato / Membro) + comiteId.
- **Portaria**: log/histórico. tipo, nº, data, ciNumero, ciArquivoBytes (anexo),
  textoGerado (texto final), composicaoJson (snapshot dos membros), comiteId.
- **Configuracao**: única linha (id="default") com textos fixos.

Para mudar o schema: edite `prisma/schema.prisma` e rode `bun run db:push`.

## 5. Templates das minutas

Os templates estão em `src/lib/cge/templates.ts` e são **FIROSOS** — não devem
ser editados exceto por mudança de normativa institucional. A função
`gerarMinutaTexto(payload)` apenas substitui os campos entre `[colchetes]` pelos
valores reais.

Campos substituídos:
`numero_portaria`, `data_portaria`, `curso`, `grau`, `unidade_universitaria`,
`portaria_delegacao_competencia`, `resolucao_couni`, `data_deliberacao_431`,
`resolucao_homologacao_431`, `data_deliberacao_432`, `resolucao_homologacao_432`,
`ci_numero`, `TABELA_MEMBROS`, `nome_signatario`, `cargo_signatario` e, no
Template B, `portaria_constituicao_numero` + `portaria_constituicao_data`.

Datas aparecem por extenso (ex.: "15 de julho de 2026") — ver `dataPorExtenso`.

## 6. Validação de quórum

`src/lib/cge/quorum.ts` → `validarQuorum(membros)`:
- Total entre 3 e 5 (incluindo o coordenador, membro nato).
- Exatamente 1 Presidente.
- Exatamente 1 Coordenador(a) do Curso - Membro Nato.
- Demais = "Membro".
- Nomes não vazios.

A Tela 3 bloqueia o avanço enquanto inválido. A Tela 4 também bloqueia geração.
O backend re-valida indiretamente ao gerar o texto (snapshot dos membros).

## 7. Configurações globais

Texto fixo que pode mudar no futuro por nova normativa. Editável em
**Configurações** (não a cada portaria). Valores padrão atuais (jun/2026):

- Resolução CEPE-UEMS N.º 3.136/2026 (homologa Delib. 431)
- Resolução CEPE-UEMS N.º 3.137/2026 (homologa Delib. 432)
- Data das Deliberações: 28/05/2026
- Portaria de delegação: N.º 027, de 15/10/2024
- Resolução COUNI-UEMS N.º 479/2016
- Signatário: WALTER GUEDES DA SILVA — Pró-Reitor de Ensino - PROE/UEMS

Para restaurar o padrão: botão "Restaurar padrão" na tela de Configurações
(usa `CONFIG_PADRAO` em `src/lib/cge/config.ts`).

## 8. Importação de CI

Endpoint: `POST /api/cge/importar-ci` (multipart, campo `file`).

**Desativada.** Já foram avaliadas extração via IA de visão (z-ai-web-dev-sdk,
Google Gemini, LM Studio local, OpenRouter) — todas exigiam custo recorrente
(API paga) ou eram lentas/inviáveis demais (modelo local via LM Studio). O
endpoint hoje sempre responde com erro 501 pedindo preenchimento manual; o
frontend já trata isso como fallback normal (a importação nunca bloqueou o
preenchimento manual — ver `Tela2Dados.tsx`, `handleImportar`).

Se no futuro fizer sentido reativar, considerar: (a) extração por
regras/regex sobre o texto do documento (sem custo, mas frágil a variações de
redação das CIs), ou (b) uma API de IA paga, já que as gratuitas testadas se
mostraram lentas/instáveis demais para este uso.

A CI anexada é guardada no registro da Portaria (`ciArquivoBytes`) e pode ser
baixada da página do curso no histórico.

## 9. Identidade visual

Tokens em `src/app/globals.css` (bloco `:root`):

| Token | Hex | Uso |
|---|---|---|
| `--color-uems-navy` | `#00338C` | Cor primária: cabeçalho, botões primários |
| `--color-uems-navy-deep` | `#001F54` | Hover/ativos |
| `--color-uems-gold` | `#C8A84B` | Acento: item ativo do menu, destaques |
| `--color-paper` | `#F7F7F4` | Fundo geral |
| `--color-ink` | `#1A1D23` | Texto principal |
| `--color-ink-muted` | `#5B6472` | Texto secundário |
| `--color-alert` | `#B3261E` | Erros / quórum inválido |

Tipografia:
- **Display/títulos**: Source Serif 4 (serifada institucional) — classe `font-display`
- **Corpo/interface**: Inter — classe `font-body` (default)
- **Dados/números**: IBM Plex Mono — classe `font-data`

Regras de design (lista de bloqueio):
- Nunca usar roxo/indigo do tema shadcn padrão.
- Nunca colocar ícone em círculo/quadrado com fundo pastel.
- Cantos pequenos (4–6px), sombras mínimas.
- Logo DIGES completa (preto) só em fundo claro; no cabeçalho navy usa-se
  apenas o texto "DIGES" em serifada dourada.

O **preview da minuta** (Tela 4) tem tratamento distinto: fundo branco, borda
fina, tipografia serifada, margens generosas — simula papel timbrado. É o
elemento de assinatura visual da aplicação.

## 10. Como rodar localmente

```bash
cp .env.example .env  # configurar DATABASE_URL/DIRECT_URL (Supabase)
bun install           # instalar dependências (ou npm install, se bun não disponível)
bun run db:push       # sincronizar schema Prisma com o Postgres (Supabase)
bun run dev           # iniciar em http://localhost:3000
bun run lint          # checar qualidade do código
```

O banco é PostgreSQL via Supabase (veja `MIGRACAO_SUPABASE.md`). Não há
dependência de DINF — roda autônomo. A importação automática de CI está
desativada (ver seção 8); o preenchimento manual funciona normalmente.

## 11. Fluxos principais

### Constituir novo comitê
1. Início → "Gerar Portaria" → Tela 1: escolher "Constituir".
2. Tela 2: nº, data, curso, grau, unidade, CI (opcional: importar CI).
3. Tela 3: adicionar 3–5 membros com funções (valida quórum).
4. Tela 4: revisar minuta → Copiar / Baixar .docx / Salvar no histórico.
   - Ao salvar: cria o Comite + registra a Portaria (tipo Constituição).

### Alterar comitê existente
1. Tela 1: escolher "Alterar" → selecionar comitê da lista.
   - Nº e data da Portaria de Constituição original vêm pré-preenchidos
     (bloqueados) e são citados na minuta de Alteração.
2. Telas 2→4 iguais.
   - Ao salvar: atualiza membros do Comite + registra Portaria (tipo Alteração).

### Consultar
- "Comitês & Histórico": lista com busca/filtro por situação.
- Clicar num curso: página com comitê atual + linha do tempo de todas as
  portarias, com botões para copiar minuta e baixar CI.

## 12. Notas de manutenção

- **Adicionar/editar campo variável da minuta**: edite o template em
  `src/lib/cge/templates.ts` e o payload em `src/lib/cge/types.ts`. O backend
  re-gera o texto ao salvar (fonte de verdade), então o histórico sempre terá
  o texto institucional correto.
- **Mudar normativa**: edite em Configurações (na UI) ou `CONFIG_PADRAO` em
  `src/lib/cge/config.ts`.
- **Backup**: copie `db/custom.db`. O banco é SQLite, um único arquivo.
- **Privacidade**: nomes dos membros ficam no banco local. Não há exposição
  pública (acesso restrito a quem opera a aplicação).
