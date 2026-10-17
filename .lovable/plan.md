# EduMind + Simulados ENEM/SSA/Vestibulares/Concursos

## O que será construído

1. **EduMind — assistente de IA flutuante**
   - Botão redondo no canto inferior direito, visível em todas as páginas logadas.
   - Abre um painel de chat com respostas em tempo real (texto aparecendo aos poucos).
   - Personalidade por perfil: aluno (tutor que explica passo a passo, monta plano de estudos, simulados e flashcards), professor (gera questões com gabarito, planos de aula, pareceres), gestão (resumos de turmas e alertas de alunos com notas baixas).
   - Usa dados reais do usuário: tarefas próximas, provas agendadas, notas e médias, disciplinas da turma.
   - Histórico de conversas salvo; botão "Nova conversa"; sugestões rápidas.
   - Regras de segurança: não faz a tarefa pelo aluno sem explicar, não expõe dados de outros alunos.

2. **Painéis com dados reais** — revisar os cards do Painel para todos os números virem do banco filtrados corretamente (ex.: professor conta só suas turmas, gestão conta professores reais) e adicionar card de desempenho nos simulados.

3. **Simulados ENEM, SSA (UPE), Vestibulares e Concursos** — nova página "Simulados" no menu
   - Categorias: ENEM, SSA, Vestibulares, Concursos; filtro por área/matéria.
   - Banco de questões de múltipla escolha (A–E) com gabarito e explicação.
   - Professor/gestão cadastram questões e montam simulados; também podem pedir ao EduMind para gerar questões no estilo da prova escolhida.
   - Aluno resolve com cronômetro, vê nota, acertos por matéria e explicações; histórico de tentativas.
   - Tarefas também ganham etiqueta opcional de categoria (ENEM, SSA, Vestibular, Concurso).
   - Algumas questões de exemplo já cadastradas (autorais, no estilo de cada prova — não cópia de provas oficiais).

## Detalhes técnicos
- Tabelas: `ai_conversas`, `ai_mensagens` (dono = usuário, RLS própria); `questoes` (categoria enum enem/ssa/vestibular/concurso, area, enunciado, alternativas jsonb, correta, explicacao); `simulados`, `simulado_questoes`, `tentativas` (respostas jsonb, acertos, nota). Coluna `categoria` opcional em `tarefas`. Gabarito correto só lido após envio (função security definer que corrige a tentativa).
- Chat via rota de servidor com streaming chamando Lovable AI Gateway (google/gemini-3-flash-preview), autenticação do usuário verificada, contexto montado no servidor com o cliente do usuário (RLS aplica). Geração de questões via tool calling com saída estruturada.
- Componente `EduMindWidget` montado no layout `_authenticated/route.tsx`; item "Simulados" em AppSidebar.
- Testes: cálculo de nota da tentativa.
