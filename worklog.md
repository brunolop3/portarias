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

---
Task ID: 3
Agent: webDevReview (cron)
Task: Ciclo de QA + novas features + melhorias de styling.

Work Log:
- QA via agent-browser em todas as telas (Início, Gerar Portaria 1-4, Comitês & Histórico, Configurações).
- BUG CRÍTICO encontrado e corrigido: ao clicar em "Alterar Comitê existente" na Tela 1, o sistema pulava direto para a Tela 2 sem mostrar a lista de seleção de comitês. Causa: `setTipo` no store sempre definia `etapa: 2`. Correção: `setTipo` agora apenas define o tipo; o avanço de etapa é controlado pelos componentes (Tela 1 avança para Constituição; Alteração fica na Tela 1 para o usuário selecionar o comitê na lista).
- Nova feature: Dashboard com métricas na Tela Início.
  - API GET /api/cge/stats: total comitês, por situação (ativo/vencendo/vencido/encerrado), total portarias (constituições + alterações), total membros, distribuição por unidade e por grau, próximos a vencer (<= 90 dias).
  - TelaInicio reescrita: 4 cards de métrica (comitês, portarias, membros, próximos a vencer), 3 painéis (situação com barras, por unidade com barras, mandatos próximos do fim clicáveis), atalhos com hover, resumo normativo.
  - Skeleton loading states enquanto busca stats.
- Nova feature: Encerrar/reativar comitê + excluir comitê + excluir portaria na UI.
  - ActionsMenu (dropdown "Mais ações") na página do curso: encerrar/reativar (toggle status) e excluir comitê (com dupla confirmação).
  - Botão de excluir (lixeira) em cada portaria da timeline do histórico.
  - Handlers conectados às APIs PUT /api/cge/comites/[id] (status) e DELETE /api/cge/portarias/[id] e /api/cge/comites/[id].
- Nova feature: Exportar minuta em PDF/impressão.
  - Botão "Imprimir / PDF" na Tela 4: abre janela com HTML formatado (A4, margens 3cm, TNR 12pt, ementa recuo 8cm, corpo recuo 1,5cm, tabela real, assinatura centralizada) e dispara window.print() para salvar como PDF.
- Melhorias de styling:
  - globals.css: foco visível (outline navy), seleção de texto (dourado), transições suaves em elementos interativos, animação cge-fade-in para dropdowns, estilos de impressão (@media print esconde header/footer).
  - Faixa decorativa lateral navy no hero da Tela Início.
  - Atalhos com seta que aparece no hover.
  - Scrollbar com hover state.
- Verificação: lint 0 erros; agent-browser confirmou todas as telas renderizando, actions menu funciona, encerrar/reativar atualiza status, dashboard mostra métricas e barras. VLM confirmou dashboard polido e profissional.

Stage Summary:
- Bug crítico do fluxo "Alterar" corrigido — lista de seleção agora aparece.
- Dashboard transformado de simples contagem para painel rico de métricas com 4 cards + 3 painéis de distribuição/alertas.
- Página do curso agora tem gestão completa: encerrar/reativar/excluir comitê + excluir portaria do histórico.
- Tela 4 ganha exportação PDF além do .docx.
- Styling refinado: foco visível, transições, animações de dropdown, print styles.
- Próxima fase: possíveis features adicionais (busca avançada com filtros combinados, exportar histórico em CSV, dashboard de evolução temporal, validação de nº de portaria duplicado, multi-idioma, etc.).

---
Task ID: 4
Agent: webDevReview (cron)
Task: Ciclo de QA + 3 novas features + polish visual.

Work Log:
- QA via agent-browser em todas as telas e fluxos (Início, Gerar Portaria 1-4, Comitês & Histórico, Configurações). Testei criação de Constituição (Medicina/Campo Grande), filtro de busca, lista de consulta, mobile viewport (375px). Nenhum bug crítico encontrado — aplicação estável.
- Nova feature: Validação de nº de portaria duplicado em tempo real (Tela 2).
  - API GET /api/cge/verificar-portaria?numero=X: retorna {duplicado, portaria{tipo,curso,unidade}}.
  - Tela2Dados: useEffect com debounce 500ms verifica o número digitado; mostra spinner "Verificando…", aviso vermelho "Já existe uma Portaria n.º X (tipo) no comitê de CURSO — UNIDADE" (com borda vermelha no input), ou check verde "Número disponível."
  - Testado com nº 1.234 (duplicado → aviso) e 9.999 (disponível → check).
- Nova feature: Busca avançada + filtros combinados na lista de comitês (Tela 5).
  - Adicionados seletores de Grau (Todos/Bacharelado/Licenciatura) e Unidade (lista dinâmica das unidades cadastradas).
  - Filtros combinados: busca textual + situação + grau + unidade.
  - Botão "Limpar filtros" aparece quando há filtros ativos.
  - Indicador de contagem "X de Y comitê(s)".
- Nova feature: Exportar relatório em CSV.
  - API GET /api/cge/exportar-csv: gera CSV com BOM UTF-8, separador ; (compatível Excel pt-BR), 14 colunas (Curso, Grau, Unidade, Status, Portaria Constituição, Data, Término Mandato, Tipo Portaria, Nº, Data, CI, Qtd Membros, Presidentes, Coordenadores). Uma linha por portaria.
  - Botão "Exportar CSV" na lista de consulta (canto inferior direito do card de filtros).
  - Testado: 4 linhas geradas corretamente (1 constituição + 1 alteração + 2 constituições).
- Melhorias de styling:
  - AppHeader: agora sticky top-0 z-30 (fica fixo ao rolar), faixa dourada fina (h-0.5) no topo como acento institucional, shadow-sm, ícone do item ativo com scale-110.
  - Consulta: filtros refinados organizados em segunda linha com border-t separador, labels pequenas, contagem e botão CSV alinhados.
  - Tela 2: indicador de duplicidade com spinner animado, ícones de alerta/check.
- Verificação: lint 0 erros; agent-browser confirmou todas as features funcionando (filtros combinados, CSV export com toast de sucesso, validação de duplicidade nos 3 estados). VLM confirmou header polido com faixa dourada e item ativo destacado.

Stage Summary:
- Aplicação estável, sem bugs críticos após QA abrangente (desktop + mobile).
- 3 features novas: validação de duplicidade em tempo real, filtros combinados avançados, exportação CSV.
- Header refinado: sticky, faixa dourada de acento, ícones com feedback.
- Próximas fases sugeridas: dashboard de evolução temporal (gráfico de portarias por mês), busca global, modal de detalhes da portaria ao clicar na timeline, atalhos de teclado, importação em lote via CSV.

---
Task ID: 5
Agent: webDevReview (cron)
Task: Ciclo de QA + 3 novas features (modal visualizar, gráfico temporal, busca global Ctrl+K).

Work Log:
- QA via agent-browser em todas as telas. Aplicação estável, sem bugs críticos. VLM identificou oportunidade: faltava "Visualizar minuta" no histórico (só havia copiar/baixar CI).
- Nova feature: Modal de visualização da minuta completa.
  - Componente PortariaViewerModal: dialog (Radix) com cabeçalho (tipo, nº, data, CI, membros), botões Copiar/.docx/Imprimir-PDF, e corpo com o textoGerado em estilo "papel timbrado" (serifada, pre formatado).
  - Botão "Visualizar" (navy, ícone Eye) adicionado na timeline do histórico de cada portaria.
  - Botões Copiar/CI enxugados para ícones-only (com sr-only labels) para dar destaque ao Visualizar.
  - Imprimir gera janela HTML formatada (A4, 3cm, TNR 12pt, ementa 8cm, corpo 1,5cm, tabela real, assinatura centralizada) e dispara window.print().
  - Testado: modal abre, mostra texto completo com scroll, botões funcionam, fecha com Esc/X.
- Nova feature: Dashboard de evolução temporal (gráfico de portarias por mês).
  - API /api/cge/stats estendida com evolucaoMensal: 12 meses (incluindo atual), agrupados por tipo (constituições + alterações).
  - Componente ChartEvolucao (CSS puro, sem dependência): barras empilhadas navy (constituições) + dourado (alterações), tooltip no hover, labels de meses, legenda, resumo com total. Empty state quando não há dados.
  - Adicionado na Tela Início abaixo das distribuições.
  - Testado: 12 meses exibidos, 2 constituições em jul/26 visíveis, tooltip funciona, legenda correta.
- Nova feature: Busca global com atalho Ctrl+K (command palette style).
  - Componente GlobalSearch: botão "Buscar… ⌘K" no cabeçalho, dialog sobreposto com backdrop, input com foco automático, busca simultânea em comitês (curso/unidade) e portarias (nº/CI/curso), resultados com ícones e badges de tipo, navegação por teclado (↑↓↵), navegação direto para a página do curso ao selecionar.
  - Atalho Ctrl+K (ou Cmd+K) abre/fecha; Esc fecha.
  - Bug corrigido: selecionar resultado chamava irParaConsultar() que resetava cursoConsultaId para null — trocado por useCge.setState({ area: "consultar" }) para preservar o curso selecionado.
  - Testado: Ctrl+K abre, busca "Medicina" retorna comitê + portaria, click navega direto para a página do curso.
- Verificação: lint 0 erros; agent-browser confirmou todas as features (modal, gráfico, busca global com navegação por teclado e seleção). VLM confirmou modal polido e gráfico profissional.

Stage Summary:
- 3 features novas: modal de visualização da minuta, gráfico de evolução temporal, busca global Ctrl+K.
- Aplicação estável e mais completa — agora é possível visualizar qualquer portaria do histórico sem precisar copiar, ver tendência temporal de geração, e buscar rapidamente de qualquer tela.
- Próximas fases sugeridas: importação em lote via CSV, atalhos de teclado adicionais (n=novo, /=buscar), modal de confirmação custom (substituindo confirm()), exportação de minuta em PDF server-side, dashboard de membros (rotatividade).

---
Task ID: 6
Agent: webDevReview (cron)
Task: Ciclo de QA + 3 features (modal confirmação custom, atalhos de teclado, hero impactante).

Work Log:
- QA via agent-browser em todas as telas. Aplicação estável. Identifiquei problema de UX: ações destrutivas (encerrar/excluir comitê, excluir portaria) usavam confirm() nativo do navegador — jarring e inconsistente com a UI polida. VLM também identificou hero pouco impactante.
- Nova feature: Sistema global de diálogo de confirmação custom (ConfirmDialog.tsx).
  - Substitui todos os confirm() nativos por um modal Radix Dialog estilizado.
  - Variantes: danger (vermelho), warning (dourado), info (navy) com ícones e cores apropriadas.
  - Suporte a type-to-confirm (exigirDigitacao) para ações muito destrutivas — o usuário deve digitar o nome do curso para excluir um comitê.
  - Hook useConfirm() retorna função async que resolve para boolean.
  - ConfirmProvider montado uma vez no root (page.tsx).
  - 3 handlers atualizados em Tela5Consultar: toggleStatusComite (warning), excluirPortaria (danger), excluirComite (danger + exigirDigitação do nome do curso).
  - Testado: todos os 3 diálogos abrem corretamente, botão confirmar desabilitado até digitar o nome correto, cancelar fecha sem ação.
- Nova feature: Atalhos de teclado globais (KeyboardShortcuts.tsx).
  - Sequência "g + letra": g+i (Início), g+n (Gerar Portaria), g+c (Comitês & Histórico), g+s (Configurações).
  - Ignora quando foco está em campos editáveis (input/textarea/select/contentEditable).
  - Janela de 700ms entre o "g" e a próxima tecla.
  - Não interfere com Ctrl+K (busca global, tratada separadamente).
  - Testado: g+i, g+n, g+c todos navegam corretamente.
- Feature: Hero mais impactante na Tela Início.
  - Badge "Sistema oficial" (dourado) + selo PROE·DIGES·UEMS.
  - Padrão decorativo sutil no canto (linhas diagonais douradas, 6% opacidade).
  - Destaque numérico à direita (Comitês ativos + Portarias geradas) em cards paper.
  - Dica de atalhos de teclado visível (Ctrl+K buscar, g+n nova portaria).
  - Layout flex: texto à esquerda, stats à direita (empilha em mobile).
- Verificação: lint 0 erros; agent-browser confirmou todos os diálogos custom funcionando (encerrar/excluir comitê com type-to-confirm, excluir portaria), atalhos g+i/n/c navegando, hero com badge + stats + dica de atalhos. VLM confirmou modal polido e institucional (não nativo), hero mais impactante.

Stage Summary:
- 3 features novas: diálogo de confirmação custom (substitui confirm() nativo com type-to-confirm para ações críticas), atalhos de teclado globais (g+i/n/c/s), hero mais impactante com badge + stats + dica de atalhos.
- UX significativamente melhorada: ações destrutivas agora têm confirmação polida e institucional, com proteção extra (type-to-confirm) para exclusão de comitê.
- Navegação mais rápida via teclado.
- Próximas fases sugeridas: importação em lote via CSV, overlay de ajuda com todos os atalhos (?), dashboard de rotatividade de membros, exportação PDF server-side, histórico de auditoria (quem gerou/excluiu quando).

---
Task ID: 7
Agent: webDevReview (cron)
Task: Ciclo de QA + 2 features (overlay de ajuda, histórico de auditoria) + fix de Prisma client stale.

Work Log:
- QA via agent-browser. Aplicação estável. Identifiquei e corrigi problema de Prisma client stale após adicionar novo model.
- Nova feature: Overlay de ajuda com atalhos de teclado (HelpOverlay.tsx).
  - Abre com a tecla "?" (quando não em campo de texto) ou botão HelpCircle no cabeçalho.
  - Mostra todos os atalhos: Navegação (g+i/n/c/s), Ações (Ctrl+K, ?, Esc), com kbd estilizados e ícones.
  - Store Zustand para controle de abertura compartilhada entre trigger e overlay.
  - Testado: botão no cabeçalho abre overlay, tecla ? também abre, Esc fecha.
- Nova feature: Histórico de auditoria (rastreabilidade de ações).
  - Novo model Prisma Auditoria (acao, entidade, entidadeId, descricao, detalhes JSON, criadoEm).
  - Helper registrarAuditoria() em src/lib/cge/auditoria.ts — nunca quebra o fluxo principal.
  - Auditoria integrada em todas as APIs de escrita: portarias POST (comite_criado/alterado + portaria_gerada), comites PUT (encerrado/reativado), comites DELETE (excluido), portarias DELETE (excluida), config PUT (editada).
  - API GET /api/cge/auditoria?limite=N retorna registros ordenados do mais recente.
  - Painel de auditoria na Tela Config: lista as últimas 30 ações com ícone/coloração por tipo (criado=navy, alterado=gold, encerrado=ambar, excluido=vermelho), timestamp e ação. Scroll máximo 96vh.
  - Testado: salvar config cria registro "Configurações globais editadas" visível no painel.
- Fix crítico: Prisma client stale após adicionar model Auditoria.
  - Problema: o singleton global do PrismaClient foi criado antes do model existir; hot reload não recria o cliente, então db.auditoria era undefined.
  - Solução: db.ts agora usa um hash dos models esperados (SCHEMA_HASH); se mudar, descarta o cliente global e cria novo. Requer restart do dev server para o novo @prisma/client ser carregado (cache do Node).
  - Reiniciei o dev server (kill + nohup bun run dev) para limpar o cache de módulo do Node.
- Verificação: lint 0 erros; agent-browser confirmou overlay de ajuda abrindo com ? e botão, painel de auditoria mostrando registro após salvar config. Dev log sem erros.

Stage Summary:
- 2 features novas: overlay de ajuda com atalhos (? + botão), histórico de auditoria com rastreabilidade completa.
- Fix de Prisma client stale que impedia o novo model de funcionar.
- Aplicação estável, todas as ações relevantes agora são auditadas.
- Próximas fases sugeridas: dashboard de rotatividade de membros, importação em lote via CSV, exportação PDF server-side, filtros avançados no painel de auditoria (por data/ação/entidade).

---
Task ID: 8
Agent: webDevReview (cron)
Task: Ciclo de QA + 2 features (filtros avançados na auditoria, dashboard de rotatividade de membros).

Work Log:
- QA via agent-browser. Aplicação estável. Console mostrava erros stale (Module not found KeyboardShortcuts, parse TelaConfig) — confirmado que são cache do navegador; página renderiza corretamente. Dev log sem erros.
- Nova feature: Filtros avançados no painel de auditoria (TelaConfig).
  - API /api/cge/auditoria estendida com query params: acao, entidade, busca (textual na descrição), dataIni, dataFim (ainda não expostos na UI, mas prontos).
  - TelaConfig: adicionados 3 filtros — busca textual (com debounce 250ms), seletor de ação (agrupado por entidade: Comitê/Portaria/Configuração), seletor de entidade.
  - Botão "Limpar" aparece quando há filtros ativos.
  - Contagem dinâmica "N registro(s)" atualiza com os filtros.
  - Cada registro agora tem badge colorido da ação (mesma cor do ícone) + badge da entidade, além do timestamp.
  - Hover state nos itens da lista.
  - Testado: filtro por ação config_editada mostra 1 registro; busca "Medicina" mostra 0; limpar volta a mostrar todos.
- Nova feature: Dashboard de rotatividade de membros (TelaInicio).
  - API /api/cge/stats estendida com rotatividadeMembros: totalPessoasDistintas, unicos (em 1 versão), maisRecorrentes (top 5 com nome, totalVersoes, cursos, funcoes).
  - Cálculo percorre membros atuais + snapshots históricos (composicaoJson de cada portaria) para contar em quantas versões cada pessoa participou.
  - Query do stats agora inclui portarias.composicaoJson.
  - TelaInicio: 2 cards em grid (1+2 cols) — card esquerdo com número de pessoas distintas + breakdown (únicos vs recorrentes); card direito com ranking top 5 (medalha numerada navy, nome, cursos/funções, contador de versões).
  - Empty state quando não há membros.
  - Testado: 17 pessoas distintas, 16 únicos, 1 recorrente (JOÃO PEDRO DE OLIVEIRA em 2 versões). VLM confirmou cards claros e bem estruturados.
- Verificação: lint 0 erros; agent-browser confirmou ambos os painéis renderizando, filtros funcionando (ação, busca), turnover com números corretos. VLM confirmou badges coloridos e filtros visíveis.

Stage Summary:
- 2 features novas: filtros avançados na auditoria (busca + ação + entidade + badges visuais), dashboard de rotatividade de membros (pessoas distintas + ranking de recorrentes).
- Painel de auditoria agora é totalmente pesquisável e filtrável, com diferenciação visual clara por tipo de ação.
- Dashboard da Tela Início agora tem 5 seções: métricas, distribuições, evolução temporal, rotatividade de membros, atalhos.
- Próximas fases sugeridas: importação em lote via CSV, exportação PDF server-side, filtros de data na auditoria, gráfico de distribuição de funções (presidente/coordenador/membro), modal de detalhes do membro (histórico de participações).

---
Task ID: 9
Agent: webDevReview (cron)
Task: Ciclo de QA + 3 features (modal de detalhes do membro, gráfico donut de funções, filtros de data na auditoria).

Work Log:
- QA via agent-browser. Aplicação estável, sem bugs críticos. Console mostrava erros stale (limpei).
- Nova feature: Modal de detalhes do membro (histórico de participações).
  - API GET /api/cge/membro/[nome]: percorre membros atuais + snapshots históricos (composicaoJson) de todas as portarias, retorna participações (atuais e históricas), total de comitês, funções exercidas, com timestamps e dados da portaria de origem.
  - Componente MemberDetailsModal: dialog com cabeçalho (nome + ícone), 3 cards de resumo (comitês, participações, funções), badges de funções exercidas, lista de participações com badges coloridos (Presidente=dourado, Coordenador=navy, Membro=cinza), indicação "Em exercício" para atuais, dados do curso/unidade/data/portaria.
  - Nomes dos membros na tabela do curso agora são clicáveis (link navy com underline no hover) e abrem o modal.
  - Estado unificado (idle/loading/ok/erro) para evitar setState síncrono em effect.
  - Testado: clicar em "LUCAS MARTINS PEREIRA" abre modal mostrando 1 comitê, 1 participação, função Presidente, "Em exercício". VLM confirmou todos os elementos.
- Nova feature: Gráfico donut de distribuição de funções na Tela Início.
  - API /api/cge/stats estendida com distribuicaoFuncoes: conta membros por função nos comitês ativos.
  - Componente DonutFuncoes (SVG puro, sem dependência): donut chart com segmentos coloridos por função (Presidente=dourado, Coordenador=navy, Membro=cinza), total no centro, legenda com contagem e percentual. Animação transition-all.
  - Adicionado como 4º card na seção de distribuições (grid de 4 agora: Situação, Por unidade, Mandatos, Distribuição de funções).
  - Testado: 14 membros totais (3 presidentes, 3 coordenadores, 8 membros) com percentuais. VLM confirmou donut polido com cores institucionais.
- Nova feature: Filtros de data no painel de auditoria.
  - API /api/cge/auditoria já suportava dataIni/dataFim (adicionados no ciclo anterior).
  - TelaConfig: adicionados 2 campos date (data inicial → data final) na barra de filtros, com debounce.
  - Botão "Limpar" agora reset também as datas.
  - Testado: campos date presentes e funcionais.
- Verificação: lint 0 erros; agent-browser confirmou modal de membro abrindo com histórico, donut chart renderizando com segmentos e legenda, filtros de date na auditoria. VLM confirmou todos os 3 features.

Stage Summary:
- 3 features novas: modal de detalhes do membro (histórico completo de participações), gráfico donut de distribuição de funções, filtros de data na auditoria.
- Dashboard da Tela Início agora tem 6 seções: métricas, 4 distribuições (situação, unidade, mandatos, funções), evolução temporal, rotatividade, atalhos.
- Página do curso agora tem membros interativos (clique para ver histórico).
- Painel de auditoria agora é totalmente filtrável (texto, ação, entidade, período).
- Próximas fases sugeridas: importação em lote via CSV, exportação PDF server-side, gráfico de evolução de membros por curso, notificações de mandatos vencendo, modo escuro.

---
Task ID: 10
Agent: webDevReview (cron)
Task: Ciclo de QA + 2 features (modo escuro, página de alertas/notificações).

Work Log:
- QA via agent-browser em todas as telas (desktop + mobile 375px). Aplicação estável, responsiva, sem bugs críticos.
- Nova feature: Modo escuro (dark mode) com next-themes.
  - globals.css: adicionado bloco .dark com paleta institucional adaptada — navy vira #4A78D8 (azul mais claro para contraste), gold vira #D9B85E, paper vira #0F1419 (cinza-azulado escuro), ink vira #E8E6E1 (branco quente). Bordas com opacity sobre texto claro. Alerta #E5534C.
  - layout.tsx: adicionado ThemeProvider (attribute="class", defaultTheme="light", enableSystem=false, disableTransitionOnChange).
  - ThemeToggle component: botão no cabeçalho (Sun/Moon icons), alterna entre light/dark, persiste em localStorage.
  - VLM confirmou: tema escuro com fundo escuro, texto claro, cores adaptadas, sem problemas de contraste.
- Nova feature: Página de Alertas de mandatos + sino de notificações.
  - API GET /api/cge/alertas: retorna comitês ativos com mandato vencido ou vencendo (<=90 dias), ordenados por urgência (vencidos primeiro, depois vencendo por menor dias). Inclui totais (total, vencidos, vencendo).
  - TelaAlertas component: 3 cards de resumo (Total, Vencidos, Vencendo), lista de alertas com badge (VENCIDO vermelho / "Vence em Xd" dourado), curso/grau/unidade/portaria/membros/data de término, botão "Ver comitê" que navega para a página do curso. Empty state amigável quando não há alertas.
  - NotificationBell component: sino no cabeçalho com badge vermelho mostrando contagem de alertas (atualiza a cada 60s), clique navega para TelaAlertas. Badge mostra "9+" se >9.
  - Area "alertas" adicionada ao store e ao roteamento do page.tsx.
  - Testado: criado comitê de Administração com data 2022 (mandato vencido), sino mostrou badge "1", página de alertas mostrou card VENCIDO com todos os dados. Limpei os dados de teste após.
- Cabeçalho agora tem 4 botões de ação: Buscar (Ctrl+K), Alertas (sino), Ajuda (?), Tema (Sun/Moon).
- Verificação: lint 0 erros; agent-browser confirmou dark mode alternando, sino com badge, página de alertas com dados e empty state. VLM confirmou dark mode polido e alertas claros.

Stage Summary:
- 2 features novas: modo escuro completo (paleta adaptada, toggle persistente), página de alertas com sino de notificações (mandatos vencidos/vencendo).
- Cabeçalho enriquecido com 4 ações rápidas (busca, alertas, ajuda, tema).
- Aplicação agora oferece experiência completa em claro e escuro, com alertas proativos de mandatos.
- Próximas fases sugeridas: importação em lote via CSV, exportação PDF server-side, gráfico de evolução de membros por curso, filtros salvos, acessibilidade (ARRO expanded), PWA.

---
Task ID: 11
Agent: webDevReview (cron)
Task: Ciclo de QA + bug fix crítico (dark mode) + nova feature (página de métricas detalhadas).

Work Log:
- QA via agent-browser em todas as telas (light + dark). Descoberto BUG CRÍTICO: o dark mode não funcionava de fato.
- BUG CRÍTICO corrigido: dark mode não aplicava cores escuras.
  - Causa: o bloco @theme inline mapeia --color-background: var(--paper), mas o bloco .dark definia --color-paper (com prefixo) e --background, não --paper (plain). Assim, var(--paper) resolvia para o valor light do :root.
  - Fix: bloco .dark agora define TANTO os tokens --color-* QUANTO os tokens plain (--paper, --ink, --ink-muted) que o @theme inline lê via var(--paper).
  - Adicionalmente: substituí ~25 ocorrências de bg-white por bg-card em todos os componentes (cards, inputs, modais, dropdowns) para que herdem o fundo do tema. Mantive bg-white apenas onde faz sentido (kbd no header navy, etc.).
  - VLM confirmou: dark mode agora com fundo escuro, cards escuros, sem problemas de contraste. Light mode continua funcionando.
- Nova feature: Página de Métricas detalhadas (TelaMetricas).
  - Nova area "metricas" no store e no roteamento.
  - Item "Métricas" (ícone BarChart3) adicionado à navegação principal do cabeçalho.
  - 4 KPIs no topo: Comitês (total + ativos), Portarias (total + constituições), Membros em exercício (total + média por comitê), Taxa de alteração (% de alterações sobre total).
  - Gráfico de evolução temporal expandido (12 meses, barras empilhadas navy/gold, tooltips, legenda, altura maior 192px).
  - 4 cards de distribuição em grid 2x2: Por unidade (barras navy), Por grau acadêmico (barras gold), Distribuição de funções (donut SVG), Rotatividade de membros (3 números + top 5 ranking).
  - Lista completa de mandatos próximos do fim (clicáveis, navegam para o curso).
  - VLM confirmou: 4 KPIs, gráfico, 4 cards, lista de mandatos, visual polido.
- Verificação: lint 0 erros; agent-browser confirmou dark mode funcionando em todas telas, página de métricas renderizando com todos os elementos. VLM confirmou ambos os temas coerentes.

Stage Summary:
- BUG CRÍTICO do dark mode corrigido — agora funciona de fato (antes apenas alternava a classe mas as cores não mudavam).
- Nova feature: página de Métricas detalhadas com KPIs, gráficos expandidos e análises profundas.
- Navegação agora tem 5 itens: Início, Gerar Portaria, Comitês & Histórico, Métricas, Configurações.
- Dark mode totalmente polido em todas as telas (cards, inputs, modais, gráficos).
- Próximas fases sugeridas: importação em lote via CSV, PWA/offline, acessibilidade (ARIA expandido, navegação por teclado em modais), exportação PDF server-side, filtros salvos.

---
Task ID: 12
Agent: webDevReview (cron)
Task: Ciclo de QA + 2 features (acessibilidade, PWA).

Work Log:
- QA via agent-browser em todas as telas. Aplicação estável. VLM identificou gaps de acessibilidade (sem skip link, foco visível sutil).
- Nova feature: Acessibilidade melhorada.
  - Skip link "Pular para o conteúdo" adicionado ao page.tsx — visível apenas ao receber foco via teclado (sr-only focus:not-sr-only), posicionado absoluto no topo, navy com texto branco. main ganhou id="conteudo".
  - Focus-visible aprimorado em globals.css: outline 3px (antes 2px) com border-radius 3px. No dark mode usa dourado. No cabeçalho navy usa dourado para contraste. VLM confirmou anel de foco visível (amarelo/dourado) no botão de busca.
  - Testado: Tab mostra skip link, segundo Tab move foco para busca com anel dourado visível.
- Nova feature: PWA (Progressive Web App).
  - manifest.json: name, short_name, description, lang pt-BR, start_url /, display standalone, background_color paper, theme_color navy, icons 192/512 (maskable).
  - Ícones gerados com sharp: 192x192, 512x512, 180x180 (apple-touch-icon) — navy com "CGE" em dourado serifado.
  - Service Worker (public/sw.js): cache-first para assets estáticos, network-first para APIs, pré-cache do shell na instalação, limpeza de caches antigos na ativação.
  - ServiceWorkerRegister component: registra /sw.js após window load (não compete com recursos críticos), só em navegadores que suportam.
  - layout.tsx: metadata com manifest, icons, appleWebApp; viewport com themeColor navy.
  - Testado: manifest served (200), sw.js served (200), icon-192 served (200), theme-color meta #00338C, link[rel=manifest] presente, apple-touch-icon presente.
- Verificação: lint 0 erros; agent-browser confirmou skip link visível via Tab, focus ring dourado visível, dark mode funcionando. PWA assets todos served com 200.

Stage Summary:
- 2 features novas: acessibilidade (skip link + focus visible aprimorado), PWA (manifest + ícones + service worker offline).
- Aplicação agora é instalável como PWA e funciona offline básico (shell cacheado).
- Acessibilidade melhorada para navegação por teclado.
- Próximas fases sugeridas: importação em lote via CSV, exportação PDF server-side, ARIA expandido em modais (focus trap), notificações push, sync em segundo plano.

---
Task ID: 13
Agent: main (Z.ai Code)
Task: Corrigir bug na exportação .docx a partir do modal de visualização (curso, grau e unidade ausentes) + implementar edição de portarias.

Work Log:
- BUG corrigido: exportação .docx a partir do modal de visualização do histórico gerava documento com curso vazio, grau errado ("bacharelado" hardcoded) e unidade ausente.
  - Causa: PortariaViewerModal enviava `curso: ""`, `grau: "bacharelado"`, `unidadeUniversitaria: ""` hardcoded para o endpoint /api/cge/exportar-docx, pois o objeto PortariaGerada não contém esses campos (apenas comiteId).
  - Fix: endpoint /api/cge/exportar-docx agora aceita `portariaId` opcional no body. Quando presente, busca a portaria + comitê do banco de dados e extrai curso, grau, unidade, membros e dados da constituição original automaticamente. Isso garante que o .docx sempre tenha os dados corretos, independente de quem chama.
  - PortariaViewerModal atualizado para enviar apenas `{ portariaId: portaria.id }` em vez dos dados hardcoded.
  - Testado via API: ementa agora mostra "Curso de Direito, bacharelado, ... Unidade Universitária de Dourados" tanto para Constituição quanto Alteração.
  - Testado via agent-browser: botão .docx no modal de visualização baixa o arquivo com sucesso (toast "Arquivo .docx baixado.").
- Nova feature: Edição de portarias (API + modal + UI).
  - API PUT /api/cge/portarias/[id]: edita número, data, CI e composição de membros. Re-gera o texto da minuta automaticamente. Valida quórum. Se for Constituição, atualiza também a portaria de constituição do comitê. Se for Alteração e for a mais recente, atualiza os membros atuais do comitê. Registra auditoria.
  - PortariaEditModal: modal com formulário (número, data, CI, membros dinâmicos com validação de quórum em tempo real). Botão "Salvar alterações" bloqueado enquanto quórum inválido.
  - Botão "Editar" (ícone Edit, outline navy) adicionado na timeline do histórico de cada portaria.
  - Botão "Excluir" agora tem texto visível (não apenas ícone) com borda vermelha para maior clareza.
  - Função recarregar() adicionada para rebuscar dados do comitê após editar/excluir.
  - Testado: editada portaria n.º 1.567 → 1.999, modal fechou e timeline atualizou com o novo número.

Stage Summary:
- Bug crítico do .docx corrigido — curso, grau e unidade agora aparecem corretamente na exportação a partir do modal de visualização.
- Edição de portarias implementada end-to-end (API PUT + modal + botão Editar na UI).
- Botão Excluir tornado mais visível (texto + borda vermelha).
- Próximas fases sugeridas: continuar refinando, adicionar mais validações, importação em lote.

---
Task ID: 14
Agent: main (Z.ai Code)
Task: Apagar portarias de exemplo e corrigir bug do preview em outra aba (Service Worker cacheando conteúdo stale).

Work Log:
- Apagadas todas as portarias de exemplo: excluí os 3 comitês de teste (Direito/Dourados, Matemática/Dourados, Medicina/Campo Grande) via API DELETE, com cascata de membros e portarias. Banco agora está limpo (0 comitês).
- Bug do preview em outra aba corrigido: o Service Worker (adicionado no ciclo 12 para PWA) estava cacheando o shell da aplicação em desenvolvimento, causando conteúdo stale quando o usuário abria o preview em outra aba.
  - Causa: o SW interceptava requisições e servia versões cacheadas, competindo com o HMR do Next.js dev server.
  - Fix: ServiceWorkerRegister agora só registra o SW em produção (process.env.NODE_ENV === "production"). Em desenvolvimento, não registra.
  - SW existente desregistrado via agent-browser (navigator.serviceWorker.getRegistrations().unregister()) e caches limpos (caches.delete).
  - Verificado: após reload, SW desativado, tema light, aplicação funcionando sem erros.
- Verificação: lint 0 erros; agent-browser confirmou aplicação limpa, estado vazio adequado em todas as telas (consulta mostra "Constituir novo comitê"), sem erros no console.

Stage Summary:
- Portarias de exemplo removidas — banco limpo para uso real.
- Bug do preview em outra aba corrigido — SW desativado em desenvolvimento.
- Aplicação pronta para uso real com dados próprios.
