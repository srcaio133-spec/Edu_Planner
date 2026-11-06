# EduMind no estilo ChatGPT/Claude, com figuras e conteúdos reais por disciplina

Observação: as 12 perguntas de exemplo já foram trocadas na rodada anterior por 16 questões ligadas às disciplinas (Matemática, Português, História, Física). Esta rodada aprofunda isso usando o seu kit.

## 1. Conteúdos de cada disciplina (o que o aluno estuda)
- Novo cadastro de **Conteúdos** por disciplina (ex.: Matemática → Funções do 1º grau, Equações do 2º grau, Porcentagem, Geometria plana; Física → Cinemática, Leis de Newton, Energia, Eletricidade; Português → Crase, Concordância, Classes de palavras, Interpretação; História → Brasil Colônia, Império, Era Vargas, Redemocratização).
- Gestão/professores editam os conteúdos na página Disciplinas.
- Provas e tarefas ganham campo opcional "conteúdo", para o sistema saber o que cai em cada avaliação.

## 2. Banco de questões ampliado e ligado aos conteúdos
- Substituir as 16 questões atuais por cerca de **40 questões autorais** (≈10 por disciplina), cada uma ligada a um conteúdo e com explicação, distribuídas em ENEM, SSA, vestibular e concurso.
- Algumas questões com **figura** (triângulo, gráfico de função, béquer, barras), desenhadas pelo app.
- Simulados refeitos por categoria e também **um simulado por disciplina**; filtro por conteúdo na página Simulados.

## 3. EduMind no modo de operação do ChatGPT/Claude (do seu kit)
- Respostas no estilo tutor: título curto, passo a passo, negrito, listas e tabelas, encerrando com uma pergunta de checagem.
- **Matemática e química com símbolos** (2², H₂O, √, ≤): o servidor corrige `2^2`, `H2O` e LaTeX automaticamente.
- **Figuras desenhadas em escala** dentro do chat, os 7 tipos da sua galeria: triângulo, béquer (solução e diluição), retângulo, círculo, reta numérica, gráfico afim/quadrático e barras. A IA descreve a figura e o app desenha, então os números saem sempre certos.
- **Filtro de palavrões**: avisa o aluno com educação e nunca deixa a IA responder com palavrão.
- Contexto real: conteúdos das próximas provas e tarefas, desempenho por conteúdo (onde o aluno erra nos simulados) para sugerir o que revisar.
- Botão no simulado: "Explicar com EduMind" em cada questão corrigida.
- **Gerar questões com IA** (professor): escolhe disciplina, conteúdo, estilo e quantidade (1 a 5); as questões entram como "em revisão" e o professor aprova antes de irem para os simulados.

## Detalhes técnicos
- Tabela `conteudos` (disciplina_id, titulo, ordem) com RLS: leitura autenticada, escrita por quem gerencia questões; coluna `conteudo_id` opcional em `questoes`, `provas`, `tarefas`; coluna `status` ('aprovada'|'em_revisao') e `figura jsonb` em `questoes`.
- Portar do kit, adaptados ao projeto (sem Edge Functions): `formatacao.ts` (Unicode + filtro) e `figuras.ts` (validação + SVG) para `src/lib/edumind/`, usados no servidor (`/api/edumind`) e no componente de mensagem; blocos ```figura {json}``` extraídos e renderizados como SVG sanitizado.
- Prompt do tutor do kit (`prompts.ts`) incorporado às instruções do EduMind, mantendo o modelo atual e o streaming.
- Geração de questões: novo endpoint de servidor autenticado com saída estruturada (schema estrito), só para professor/gestão.
- Testes vitest portados do kit para formatação e figuras.
- Seed de conteúdos e questões aplicado no banco; verificação no navegador do chat com uma figura e de um simulado por disciplina.
