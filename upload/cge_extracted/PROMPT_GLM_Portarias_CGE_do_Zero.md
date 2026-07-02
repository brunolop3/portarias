# Prompt para GLM 5.2 — App de Geração de Portarias do CGE (do zero, escopo único)

> Este é um projeto novo, construído do zero. Não é uma continuação de nenhuma versão
> anterior. O escopo desta aplicação é **apenas** o módulo de Portarias do Comitê de
> Gestão do Enade (CGE) — nada de hub geral, e-mail, agenda ou login multiusuário.

## Contexto

Sou servidor da PROE (Pró-Reitoria de Ensino) da UEMS (Universidade Estadual de Mato
Grosso do Sul), atuando na DIND/DIGES. Preciso de uma aplicação web para **registrar a
constituição e a alteração dos Comitês de Gestão do Enade (CGE)** de cada curso da
universidade e **gerar automaticamente a minuta da Portaria** correspondente, pronta para
encaminhamento à publicação no Diário Oficial.

O usuário da aplicação deve preencher **apenas os dados específicos daquele comitê**
(curso, unidade, membros, número/data da portaria etc.). Todo o restante do texto — que é
sempre igual, pois decorre de normativas institucionais fixas — deve ser gerado
automaticamente, sem risco de erro de digitação ou de omissão de cláusula.

Não tenho apoio da diretoria de TI (DINF) e não sou desenvolvedor por formação (sou
graduado em Direito). O código será mantido por mim com apoio de IA, então a aplicação
precisa ser simples de operar e MUITO bem documentada para manutenção futura.

## Objetivo da aplicação

1. Permitir cadastrar um **Comitê de Gestão do Enade (CGE)** por curso/unidade, com seus
   membros.
2. Gerar automaticamente o texto completo de duas minutas de Portaria:
   - **Portaria de Constituição** (primeira formação do comitê)
   - **Portaria de Alteração** (troca de membros de um comitê já existente)
3. Manter um **histórico** dos comitês e das portarias já geradas, para que, ao gerar uma
   Alteração, o sistema já saiba automaticamente qual foi a Portaria de Constituição
   original daquele curso/unidade (número e data), sem eu precisar digitar de novo.
4. Exportar a minuta final em formato pronto para encaminhamento (no mínimo: texto
   formatado para copiar/colar em documento oficial; idealmente: arquivo .docx com a
   formatação análoga ao modelo institucional, já que a peça será enviada para publicação
   no Diário Oficial).
5. Permitir **importar a CI (Comunicação Interna)** enviada pela Coordenação do Curso —
   documento que informa os membros do comitê eleitos pelo colegiado — e extrair
   automaticamente dela os dados necessários para preencher o formulário, reduzindo
   digitação manual.
6. Oferecer uma **página por curso** que mostre, num só lugar, o comitê atual (membros em
   exercício e dados da Portaria vigente) e o histórico completo de todas as Portarias já
   publicadas para aquele curso (constituições e alterações), permitindo consultar
   rapidamente "quem é/foi o comitê deste curso" sem precisar procurar em Diário Oficial.

## Modelo de dados

### Entidade: Comitê (por curso + unidade)
- `curso` (texto)
- `grau` (enum: "bacharelado" | "licenciatura")
- `unidade_universitaria` (texto — nome da Unidade Universitária que oferta o curso)
- `portaria_constituicao_numero` (texto/numérico)
- `portaria_constituicao_data` (data)
- `data_termino_mandato` (calculado automaticamente = data de constituição + 2 anos —
  usado só como referência interna/alerta, não aparece na Portaria de Alteração salvo
  quando fizer sentido)
- `membros_atuais` (lista — ver Entidade Membro)
- `status` (enum: "ativo" | "encerrado")

### Entidade: Membro (dentro de um Comitê)
- `nome` (texto)
- `funcao` (enum: "Presidente" | "Coordenador(a) do Curso - Membro Nato" | "Membro")

**Regra de quórum (obrigatória, validar no formulário):**
- Total de membros do comitê (incluindo o coordenador, que é membro nato) deve ser
  **no mínimo 3 e no máximo 5**, conforme o Art. 4º do Regulamento dos Comitês de Gestão
  do Enade (Deliberação CE/CEPE-UEMS Nº 432/2026), na redação dada pela Resolução
  CEPE-UEMS Nº 3.137, de 16 de junho de 2026, que homologou essa Deliberação com
  alterações.
- Deve haver exatamente 1 "Presidente" (eleito entre os pares do Comitê) e exatamente 1
  "Coordenador(a) do Curso - Membro Nato"; os demais são "Membro".
- Bloquear a geração da minuta se o quórum não for respeitado, com mensagem de erro
  explicando a regra.

### Entidade: Portaria gerada (log/histórico)
- `tipo` (enum: "Constituição" | "Alteração")
- `numero_portaria` (texto — ex.: "1.234")
- `data_portaria` (data)
- `ci_numero` (texto — número da Comunicação Interna da coordenação do curso que informa
  os membros eleitos)
- `ci_arquivo` (arquivo — cópia do PDF/imagem/docx da CI original recebida, guardada para
  consulta e auditoria futura)
- `comite_id` (referência ao Comitê)
- `texto_gerado` (o texto final da minuta, para consulta futura)
- `criado_em` (timestamp)

### Configurações globais (editáveis em uma tela de administração, não a cada portaria)
Esses dados são fixos hoje mas podem mudar no futuro se houver nova normativa — por isso
devem ficar em uma área de configuração, não no código-fonte:
- `resolucao_homologacao_431` (Resolução que homologa, com alterações, a Deliberação
  CE/CEPE-UEMS Nº 431 — Política de Gestão do Enade — hoje: **Resolução CEPE-UEMS Nº
  3.136, de 16 de junho de 2026**)
- `resolucao_homologacao_432` (Resolução que homologa, com alterações, a Deliberação
  CE/CEPE-UEMS Nº 432 — Regulamento dos Comitês de Gestão do Enade — hoje: **Resolução
  CEPE-UEMS Nº 3.137, de 16 de junho de 2026**)
- `data_deliberacao_431` e `data_deliberacao_432` (hoje: 28/05/2026)
- `portaria_delegacao_competencia` (hoje: "Portaria N.º 027, de 15 de outubro de 2024")
- `resolucao_couni` (hoje: "Resolução COUNI-UEMS N.º 479, de 23 de junho de 2016")
- `nome_signatario` (hoje: "WALTER GUEDES DA SILVA")
- `cargo_signatario` (hoje: "Pró-Reitor de Ensino - PROE/UEMS")

## Importação automática da CI

A Coordenação do Curso normalmente encaminha a CI (Comunicação Interna) em PDF, foto/
print ou documento Word, informando o número da CI e os membros eleitos pelo colegiado
(nomes e funções). Hoje esses dados são digitados manualmente na Portaria — a aplicação
deve eliminar essa etapa manual sempre que possível.

### Como deve funcionar
1. Na Tela 2 (Dados da Portaria), incluir um botão "Importar CI" que aceita upload de
   PDF, imagem (foto/print) ou .docx.
2. Extrair o texto do arquivo (OCR se for imagem/PDF escaneado; extração direta de texto
   se for PDF nativo ou .docx).
3. A partir do texto extraído, usar um modelo de linguagem (ex.: API da Anthropic/Claude,
   já que costumo trabalhar com esse provedor) para identificar e estruturar:
   - Número da CI
   - Nome do curso e Unidade Universitária (quando mencionados na CI)
   - Lista de membros eleitos, com nome e função (Presidente, Coordenador, Membro)
4. **Nunca preencher o formulário automaticamente sem revisão.** Os dados extraídos devem
   aparecer destacados como "sugestão importada da CI" nos campos correspondentes, para
   que eu confirme ou corrija manualmente antes de gerar a minuta. Isso evita que um erro
   de leitura do documento (nome mal reconhecido, função trocada) vá parar direto na
   Portaria publicada no Diário Oficial.
5. Guardar o arquivo original da CI anexado ao registro da Portaria gerada (campo
   `ci_arquivo`), para consulta futura em caso de dúvida ou auditoria.
6. Se a extração falhar ou vier incompleta (ex.: CI manuscrita, imagem de baixa
   qualidade), o sistema deve permitir seguir normalmente com preenchimento 100% manual —
   a importação é um atalho, nunca um bloqueio.

### Observação técnica
Como o formato das CIs varia de coordenação para coordenação (não há um padrão rígido de
redação), a extração deve ser feita por interpretação de linguagem natural do texto, e não
por regras fixas de posição/regex — use um modelo de linguagem para essa etapa.

## Fluxo da aplicação

### Tela 1 — Escolher tipo de operação
- "Constituir novo Comitê" ou "Alterar Comitê existente"
- Se "Alterar": exibir lista/busca dos comitês já cadastrados (por curso + unidade) e, ao
  selecionar, **auto-preencher** número e data da Portaria de Constituição original — o
  usuário não digita isso manualmente.

### Tela 2 — Dados da Portaria
Campos:
- Número da nova Portaria
- Data da nova Portaria
- Curso, grau e Unidade Universitária (se for Alteração, vêm preenchidos e bloqueados
  para edição, pois já existem no cadastro do comitê)
- Número da CI da coordenação do curso que informa os membros eleitos
- Botão "Importar CI" para preencher automaticamente este número e, junto com a Tela 3,
  sugerir os membros identificados no documento

### Tela 3 — Membros do Comitê
- Formulário dinâmico para adicionar/remover membros (nome + função), com validação de
  quórum em tempo real (mostrar contador "X de 3 a 5 membros, incluindo o coordenador" e
  travar o botão de gerar enquanto a regra não for atendida).

### Tela 4 — Geração e exportação
- Botão "Gerar minuta" → gera o texto completo pronto (ver templates abaixo), com todos os
  campos substituídos.
- Exibir preview do texto final.
- Botões: "Copiar texto", "Baixar como .docx" (formatação simples, compatível com envio
  para publicação), "Salvar no histórico".
- Ao salvar, gravar o registro na entidade "Portaria gerada" e atualizar o Comitê
  correspondente (se Constituição: cria o comitê; se Alteração: atualiza a lista de
  membros atuais do comitê, mantendo o histórico de portarias anteriores).

### Tela 5 — Página do Curso (comitê atual + histórico)
Área de consulta, separada do fluxo de geração de minutas, para responder rapidamente
"quem é/foi o Comitê de Gestão do Enade deste curso":

- **Lista de cursos cadastrados**: busca/filtro por nome do curso e/ou Unidade
  Universitária, mostrando também o status do comitê (ativo / mandato vencendo / sem
  comitê cadastrado).
- **Página do curso** (ao clicar em um curso da lista):
  - **Bloco "Comitê atual"**: membros em exercício (nome + função), Portaria de
    Constituição vigente (número/data) ou, se já houve Alteração, também a última
    Portaria de Alteração que atualizou a composição, e a data prevista de término do
    mandato (constituição + 2 anos).
  - **Bloco "Histórico"**: linha do tempo com todas as Portarias já geradas para aquele
    curso, em ordem cronológica — tipo (Constituição/Alteração), número, data,
    composição do comitê naquela versão, e links para: baixar/ver a minuta gerada
    (`texto_gerado`) e ver o arquivo da CI que originou aquela Portaria (`ci_arquivo`).
  - Deve ser possível acessar essa página tanto navegando pela lista quanto diretamente a
    partir da Tela 1 (ao escolher "Alterar Comitê existente" para aquele curso).

## Templates oficiais (usar EXATAMENTE este texto — não reescrever, apenas substituir os
campos entre colchetes)

### Template A — CONSTITUIÇÃO

```
PORTARIA PROE-UEMS n.º [numero_portaria], de [data_portaria].

Constitui o Comitê de Gestão do Enade do Curso de [curso], [grau], da Universidade
Estadual de Mato Grosso do Sul, ofertado na Unidade Universitária de [unidade_universitaria].

Por delegação de competência do Magnífico Reitor da UEMS, conforme [portaria_delegacao_competencia],
O PRÓ-REITOR DE ENSINO DA UNIVERSIDADE ESTADUAL DE MATO GROSSO DO SUL, no uso de suas
atribuições que lhes são conferidas pelo Regimento Geral e [resolucao_couni], e,

CONSIDERANDO a Deliberação CE/CEPE-UEMS Nº 431, de [data_deliberacao_431], homologada pela
[resolucao_homologacao_431], que aprovam a Política de Gestão do Exame Nacional dos
Estudantes (Enade) na Universidade Estadual de Mato Grosso do Sul;

CONSIDERANDO a Deliberação CE/CEPE-UEMS Nº 432, de [data_deliberacao_432], homologada pela
[resolucao_homologacao_432], que aprovam o Regulamento dos Comitês de Gestão do Exame
Nacional dos Estudantes (Enade) na Universidade Estadual de Mato Grosso do Sul; e

CONSIDERANDO a CI n.º [ci_numero], da Coordenação do Curso de [curso], ofertado na
Unidade Universitária de [unidade_universitaria], que informa os membros do Comitê de
Gestão do Enade eleitos pelo colegiado,

RESOLVE:

Art. 1.º Constituir o Comitê de Gestão do Enade do curso de [curso], [grau], da
Universidade Estadual de Mato Grosso do Sul, ofertado na Unidade Universitária de
[unidade_universitaria].

Art. 2.º O Comitê de que trata esta Portaria fica constituído com os seguintes membros:

[TABELA: Nome dos integrantes | Função]

Art. 3.º Fica este Comitê comprometido com a realização da gestão do Enade, conforme
previsto nas normativas institucionais vigentes.

Art. 4.º A duração do mandato dos membros do Comitê de Gestão do Enade será de 2 (dois)
anos, permitida a recondução de no máximo 50% (cinquenta por cento) de seus membros ao
término de cada mandato.

Art. 5.º Esta Portaria entra em vigor a partir da data de sua publicação.

[nome_signatario]
[cargo_signatario]
```

### Template B — ALTERAÇÃO

```
PORTARIA PROE-UEMS n.º [numero_portaria], de [data_portaria].

Altera os membros do Comitê de Gestão do Enade do Curso de [curso], [grau], da
Universidade Estadual de Mato Grosso do Sul, ofertado na Unidade Universitária de
[unidade_universitaria].

Por delegação de competência do Magnífico Reitor da UEMS, conforme [portaria_delegacao_competencia],
O PRÓ-REITOR DE ENSINO DA UNIVERSIDADE ESTADUAL DE MATO GROSSO DO SUL, no uso de suas
atribuições que lhes são conferidas pelo Regimento Geral e [resolucao_couni], e,

CONSIDERANDO a Deliberação CE/CEPE-UEMS Nº 431, de [data_deliberacao_431], homologada pela
[resolucao_homologacao_431], que aprovam a Política de Gestão do Exame Nacional dos
Estudantes (Enade) na Universidade Estadual de Mato Grosso do Sul;

CONSIDERANDO a Deliberação CE/CEPE-UEMS Nº 432, de [data_deliberacao_432], homologada pela
[resolucao_homologacao_432], que aprovam o Regulamento dos Comitês de Gestão do Exame
Nacional dos Estudantes (Enade) na Universidade Estadual de Mato Grosso do Sul; e

CONSIDERANDO a CI n.º [ci_numero], da Coordenação do Curso de [curso], ofertado na
Unidade Universitária de [unidade_universitaria], que informa os membros do Comitê de
Gestão do Enade eleitos pelo colegiado,

RESOLVE:

Art. 1.º Alterar os membros do Comitê de Gestão do Enade do curso de [curso], [grau], da
Universidade Estadual de Mato Grosso do Sul, ofertado na Unidade Universitária de
[unidade_universitaria], constituído pela Portaria PROE-UEMS n.º
[portaria_constituicao_numero], de [portaria_constituicao_data].

Art. 2.º O Comitê de que trata esta Portaria passa a vigorar com os seguintes membros até
a data de término do mandato estabelecida na Portaria PROE-UEMS n.º
[portaria_constituicao_numero], de [portaria_constituicao_data] (Portaria de
constituição):

[TABELA: Nome dos integrantes | Função]

Art. 3.º Fica este Comitê comprometido com a realização da gestão do Enade, conforme
previsto nas normativas institucionais vigentes.

Art. 4.º Esta Portaria entra em vigor a partir da data de sua publicação.

[nome_signatario]
[cargo_signatario]
```

**Observações sobre os templates:**
- A tabela de membros deve seguir sempre a ordem: Presidente → Coordenador(a) do Curso -
  Membro Nato → demais Membros.
- Datas devem ser formatadas por extenso quando fizer sentido institucionalmente (ex.:
  "28 de maio de 2026") — usar essa formatação também para `data_portaria` e
  `portaria_constituicao_data` no texto final, mesmo que o campo seja capturado como data
  no formulário.
- Não alterar nenhuma palavra do texto fixo dos templates além das substituições
  indicadas entre colchetes.

## Identidade visual — seguir à risca (não deixar em aberto para o modelo "decidir")

A parte funcional acima é a prioridade, mas a aparência da aplicação **precisa** seguir
este sistema de design específico desde a primeira versão. Não usar o tema/paleta padrão
do shadcn/ui, do Tailwind ou de qualquer template genérico — construir sobre esta
identidade desde o início.

### Paleta (tokens nomeados — nunca hexadecimais soltos no meio do código)

| Token | Hex | Uso |
|---|---|---|
| `uems-navy` | `#00338C` | Cor primária institucional: menu/cabeçalho, botões primários |
| `uems-navy-deep` | `#001F54` | Hover/estados ativos sobre navy |
| `uems-gold` | `#C8A84B` | Acento pontual — item ativo do menu, destaques. NÃO usar como fundo de card nem em botões grandes |
| `paper` | `#F7F7F4` | Fundo geral das telas (branco levemente quente, não cinza-azulado genérico) |
| `ink` | `#1A1D23` | Texto principal |
| `ink-muted` | `#5B6472` | Texto secundário/legendas |
| `alert` | `#B3261E` | Estados de erro/quórum inválido |

### Tipografia

- **Display/títulos** (nomes de tela, número da Portaria em destaque): serifada
  institucional — `Source Serif 4` ou `Lora`. Justificativa: o sistema lida com atos
  oficiais, e uma serifada bem aplicada comunica formalidade em vez de parecer um SaaS
  genérico.
- **Corpo/interface** (menus, formulários, textos de apoio): `Inter` ou `IBM Plex Sans`.
- **Dados/números** (números de portaria, datas): `IBM Plex Mono`.
- Definir uma escala tipográfica com pelo menos 5 níveis de tamanho/peso — evitar que a
  maior parte do texto fique no mesmo peso/tamanho.

### Layout

- **Menu de navegação** (entre as 5 telas/áreas): fundo sólido `uems-navy`, sem gradiente.
  Item ativo com barra fina `uems-gold`.
- **Cards e formulários**: borda de 1px sólida (`ink` a ~10% de opacidade), cantos com
  raio pequeno (4–6px, não 16–20px), sombra mínima ou nenhuma. A referência de sensação é
  "sistema de gestão pública", não "landing page de SaaS de IA".
- **Ícones**: nunca colocar ícone dentro de círculo/quadrado com fundo pastel colorido
  (padrão visual mais reconhecível de "dashboard gerado por IA"). Usar ícones lineares
  simples ao lado do texto, sem container decorativo.
- **Preview da minuta de Portaria (Tela 4)**: tratamento visual distinto do resto da
  aplicação — fundo `paper`, borda fina, tipografia serifada, margens generosas simulando
  papel timbrado. Este é o elemento de assinatura visual da aplicação: o momento em que
  ela deliberadamente parece "documento oficial".

### Motion

Usar transições apenas em: abertura de modal/diálogo, troca de tela/etapa, estados de
carregamento. Nada de fade-in/slide-in decorativo em cards ou listas estáticas — isso
reforça a sensação de app genérico gerado por IA.

### Lista de bloqueio (não fazer em hipótese alguma)

- Ícone em círculo/quadrado pastel repetido em cards
- Gradientes decorativos genéricos (inclusive na tela inicial/login, se houver)
- Emoji no lugar de ícone
- Qualquer logo, favicon ou nome de classe CSS que não seja da UEMS/DIGES (não deixar
  nenhum asset de placeholder de ferramenta de desenvolvimento)
- Roxo/indigo do tema padrão do shadcn em qualquer estado — toda cor "azul" do sistema
  deve resolver para `uems-navy`

### Logo oficial da DIGES

Os arquivos serão fornecidos e devem ser colocados em `public/`:
- `public/diges-logo.png` (arquivo original, wordmark "DIGES" em preto com faixa de
  subtítulo, fundo branco sólido)
- `public/diges-logo-transparente.png` (mesma logo com fundo removido)

**Atenção**: a logo é preto sobre fundo transparente na versão tratada — **não tem
contraste sobre fundo navy escuro**. Não usá-la diretamente sobre o menu/cabeçalho navy.
Usar:
- No topo da aplicação (se o cabeçalho for de fundo claro/`paper`): logo completa.
- Se o cabeçalho for navy: usar apenas o texto "DIGES" em tipografia serifada, branco ou
  `uems-gold`, e reservar a logo completa (com a faixa de subtítulo) para o preview da
  Portaria/rodapé, onde o fundo é `paper`.
- Favicon: versão simplificada/recortada da logo sobre fundo `uems-navy` (a peça completa
  é larga demais para 32×32px).
- Não distorcer, não recolorir, não separar a faixa do subtítulo do restante da peça.

## Requisitos não funcionais

1. **Documentação de handover obrigatória**: gerar um `HANDOVER.md` explicando a
   arquitetura, onde ficam os templates/configurações fixas, como adicionar/editar campos,
   como funciona a identidade visual (paleta/tipografia como tokens), e como rodar o
   projeto localmente — escrito para uma pessoa sem nenhum contexto prévio assumir a
   manutenção.
2. Comentários explicativos no código, especialmente na lógica de geração do texto e nas
   validações de quórum.
3. Interface simples, em português, sem jargão técnico, pois será usada por servidores da
   PROE sem conhecimento técnico.
4. Não depender de infraestrutura da diretoria de TI (DINF) — a solução deve poder ser
   hospedada/operada de forma autônoma.
5. Tratar dados dos membros (nomes) com cuidado — não expor publicamente o histórico de
   comitês; acesso restrito a quem opera a aplicação.

## Critérios de aceite

### Funcionais
- [ ] Selecionar "Constituir" gera corretamente o Template A com todos os campos
      substituídos e tabela de membros correta.
- [ ] Selecionar "Alterar" para um comitê já cadastrado preenche automaticamente o número
      e a data da Portaria de Constituição original, sem exigir digitação manual.
- [ ] O sistema bloqueia a geração se o comitê tiver menos de 3 ou mais de 5 membros
      (contando o coordenador, membro nato), ou se faltar Presidente ou Coordenador.
- [ ] O texto gerado é idêntico ao modelo institucional, palavra por palavra, exceto pelos
      campos variáveis.
- [ ] É possível baixar/copiar a minuta final pronta para encaminhamento.
- [ ] É possível importar um arquivo de CI (PDF, imagem ou docx) e o sistema sugere
      número da CI e membros extraídos, sempre exigindo confirmação manual antes de
      gerar a minuta.
- [ ] Existe um histórico consultável de comitês e portarias já geradas.
- [ ] Cada curso tem uma página própria mostrando o comitê atual (membros e Portaria
      vigente) e a linha do tempo completa de todas as Portarias já geradas para ele,
      com acesso à minuta e à CI de cada uma.
- [ ] O projeto inclui HANDOVER.md.

### Visuais (conferir antes de considerar a tarefa concluída)
- [ ] Nenhuma cor roxa/indigo do tema padrão do shadcn aparece em nenhuma tela.
- [ ] Nenhum ícone está dentro de um círculo/quadrado com fundo pastel.
- [ ] A logo da DIGES aparece corretamente (sem perder contraste) em todos os lugares
      onde é usada.
- [ ] Não há nenhum asset, favicon ou nome de classe CSS de placeholder de ferramenta de
      desenvolvimento (ex.: logos ou nomes genéricos que não sejam da UEMS/DIGES).
- [ ] Tirar screenshots de cada tela principal (Tela 1 a 5) ao final, para conferência.
