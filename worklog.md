# Worklog — Projeto CGE/UEMS Portarias

---
Task ID: 1
Agent: main (Z.ai Code)
Task: Construir do zero a aplicação de Geração de Portarias do CGE (UEMS/DIGES) conforme especificação em PROMPT_GLM_Portarias_CGE_do_Zero.md.

Work Log:
- Analisei o documento de especificação (PROMPT_GLM_Portarias_CGE_do_Zero.md) enviado pelo usuário no cge.zip.
- Copiei as logos da DIGES para public/ (diges-logo.png e diges-logo-transparente.png).
- Instalei a biblioteca `docx` para exportação de minutas em Word.
- Escrevi o schema Prisma (Comite, Membro, Portaria, Configuracao) e rodei db:push.
- Configurei a identidade visual UEMS em globals.css: tokens navy/gold/paper/ink/alert no :root, tipografia Source Serif 4 (display) + Inter (corpo) + IBM Plex Mono (dados), raio pequeno (6px), estilo "papel timbrado" para o preview da minuta.
- Atualizei layout.tsx com as 3 fontes institucionais e metadata em português (favicon = logo DIGES).
- Criei as APIs backend:
  - /api/cge/config (GET/PUT, com seed padrão)
  - /api/cge/comites (GET/POST) e /api/cge/comites/[id] (GET/PUT/DELETE)
  - /api/cge/portarias (POST — cria/altera comitê + grava histórico, re-gera texto no servidor) e /api/cge/portarias/[id] (GET, GET ?file=ci para download da CI, DELETE)
  - /api/cge/importar-ci (POST multipart → VLM z-ai-web-dev-sdk extrai CI/membros/curso/unidade; resultado é sempre sugestão)
  - /api/cge/exportar-docx (POST PayloadMinuta → .docx com timbre, tabela de membros, assinatura)
- Implementei a lógica central em src/lib/cge/:
  - types.ts, datas.ts (dataPorExtenso, terminoMandato, situacaoDoComite), quorum.ts (validarQuorum 3-5, 1 Pres, 1 Coord), templates.ts (Templates A/B fixos + gerarMinutaTexto/Html), config.ts, mappers.ts, store.ts (Zustand).
- Construí o frontend (single-route, navegação por estado):
  - AppShell (header navy + nav com barra dourada de item ativo + footer sticky com logo DIGES)
  - Stepper (1→4)
  - TelaInicio (dashboard com atalhos + resumo normativo)
  - Tela1Escolher (Constituir/Alterar + lista de comitês com busca)
  - Tela2Dados (dados da portaria + Importar CI com painel de sugestões destacadas)
  - Tela3Membros (formulário dinâmico + validação de quórum em tempo real)
  - Tela4Geracao (preview "papel timbrado" + Copiar/Baixar .docx/Salvar)
  - Tela5Consultar (lista com filtros + página do curso com comitê atual + linha do tempo)
  - TelaConfig (configurações globais editáveis + restaurar padrão)
- Corrigi bug de identidade visual: variáveis UEMS estavam em @theme inline (Tailwind 4) que não emite para :root; adicionei-as ao :root para que var(--color-uems-navy) funcionasse em estilos inline.
- Corrigi UX do campo "Unidade Universitária": placeholder e helper text agora deixam claro que o template já acrescenta "Unidade Universitária de".
- Rodei lint (0 erros) e verifiquei com agent-browser: todas as telas renderizam, navegação funciona, API de criação/alteração/histórico/.docx testada com sucesso.
- Validei visual com VLM: cabeçalho navy confirmado, badges com cores institucionais, sem ícones em círculos pastel, tipografia serifada, rodapé sticky com logo DIGES.
- Criei dados de teste (curso Direito/Dourados) via API: 1 Constituição + 1 Alteração, verificando que a Alteração cita corretamente a Portaria de Constituição original.

Stage Summary:
- Aplicação completa e funcional, com identidade visual UEMS rigorosamente conforme especificação.
- Todos os critérios de aceite funcionais e visuais atendidos (conferidos via agent-browser + VLM).
- Backend é a fonte de verdade do texto da minuta (re-gera ao salvar), garantindo fidelidade ao template institucional.
- HANDOVER.md criado documentando arquitetura, templates, modelo de dados, identidade visual e como rodar.
- Screenshots das telas principais em /home/z/my-project/download/ (01-inicio, 02-consulta-lista, 03-curso-detalhe, 04-config, 05-tela1).
- Próxima fase (cron webDevReview): adicionar mais features (ex.: edição/exclusão de comitê na UI, exportar minuta em PDF, dashboard com métricas, busca avançada, validação de número de portaria duplicado, etc.) e refinar detalhes visuais.

---
Task ID: 2
Agent: main (Z.ai Code)
Task: Aplicar adendo de formatação do .docx (A4, margens 3cm, TNR 12pt, ementa recuo 8cm, corpo recuo 1,5cm + espaçamento simples, assinatura centralizada, tabela real, sem notas de quórum) e remover todas as logos da UI (manter apenas texto "DIGES" dourado).

Work Log:
- Reescrevi completamente /api/cge/exportar-docx com helpers tipados (paraCorpo, paraEmenta, paraTitulo, paraTimbre, paraAssinatura, spacer, paraCell) aplicando formatação EXATA e CONSISTENTE:
  - Página A4 (11906×16838 twips), margens 3cm (1701 twips) todos os lados.
  - Fonte Times New Roman 12pt (size 24) em todo o documento.
  - Timbre: 3 linhas centralizadas, 1ª em negrito.
  - Título: negrito, esquerda, sem recuo.
  - Ementa: recuo esquerdo 8cm (4536 twips), sem recuo de 1ª linha, justificado, sem negrito.
  - Corpo (preâmbulo, CONSIDERANDO, RESOLVE:, artigos): justificado, recuo de 1ª linha 1,5cm (851 twips), espaçamento simples (line 240), uma linha em branco após (after 240). "RESOLVE:" em negrito.
  - Tabela de membros: tabela real, 2 colunas, cabeçalho negrito, na margem normal (sem herdar recuo).
  - Assinatura: CENTRALIZADA, nome negrito MAIÚSCULAS, cargo normal.
  - Parágrafos vazios espaçadores: sem alinhamento (neutros).
  - Nenhuma anotação de quórum no texto.
- Encontrei e corrigi bug crítico: nesta versão do `docx` (9.7.1), AlignmentType.CENTERED NÃO EXISTE (é undefined), fazendo o alinhamento centralizado ser omitido no XML. Corrigi para AlignmentType.CENTER (valor "center").
- Removi todas as logos da UI:
  - layout.tsx: removido o favicon (icons.icon = "/diges-logo.png").
  - AppShell.tsx (footer): removido <img diges-logo-transparente.png>, substituído por texto "DIGES" dourado + subtítulo.
  - Tela4Geracao.tsx (timbre do preview): removido <img>, substituído por texto "DIGES" dourado.
  - Removido public/logo.svg (placeholder do Z.ai).
- Verificação do .docx via inspeção XML: todos os 31 (Constituição) / 32 (Alteração) parágrafos com formatação correta e consistente (alinhamento, recuo, espaçamento, negrito conferidos um a um).
- Verificação visual via VLM (LibreOffice → PDF → imagem): todos os 7 itens do checklist confirmados — ementa com recuo 8cm à direita, corpo consistente com recuo 1,5cm e espaçamento simples, assinatura centralizada, tabela real, sem notas de quórum, parágrafos vazios neutros.
- Verificação UI via VLM: nenhuma imagem/logo no cabeçalho ou rodapé; apenas texto "DIGES" dourado.
- Lint: 0 erros.

Stage Summary:
- Formatação do .docx agora segue EXATAMENTE a especificação institucional, com consistência em todo o documento (o problema de variação entre seções foi resolvido).
- Bug do AlignmentType.CENTERED corrigido — assinatura e timbre agora centralizam corretamente.
- UI sem nenhuma logo — apenas o texto "DIGES" dourado (cabeçalho, rodapé e timbre do preview).
- Documentos de teste (Constituição + Alteração) gerados e conferidos linha a linha (XML + visual).
- Próxima fase: continuar refinando detalhes e adicionando features conforme cron webDevReview.
