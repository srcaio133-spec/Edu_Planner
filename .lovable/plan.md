# Gestão completa, Fase 6 e teste de ponta a ponta

## 1. Papéis e permissões (gestão atribui perfis)
- Nova página **Usuários** (só gestão): lista todas as contas com busca, papel atual e botão para trocar papel (aluno, professor, secretaria, coordenação, vice-diretor, diretor).
- Só diretor/admin podem conceder papéis de direção; secretaria/coordenação atribuem aluno e professor. Ninguém altera o próprio papel.
- Toda troca de papel fica registrada na auditoria.
- Acesso aos dados revisado por papel: aluno vê só os próprios dados; professor só alunos das suas turmas; secretaria/coordenação veem dados acadêmicos; auditoria apenas direção.

## 2. Matrículas conectadas
- Página **Matrículas** (gestão): criar matrícula escolhendo aluno + turma, trancar/reativar, transferir de turma. O aluno passa a ver automaticamente as disciplinas da turma.
- Card **Matrículas ativas** no painel da gestão.

## 3. Acompanhamento por turma (diretor)
- Página **Desempenho por turma**: escolher turma e ver tabela de alunos com média ponderada, % de frequência, tarefas concluídas/atrasadas; destaque em vermelho para média < 6 ou frequência < 75%; resumo da turma no topo.
- Nova **Frequência**: professor faz a chamada por aula (turma + disciplina + data, presente/falta) na página de Turmas/Provas; aluno vê sua frequência no Boletim.

## 4. Fase 6 — Desafios, recompensas e comunicação
- **Desafios**: professor/gestão criam desafios (ex.: "Concluir 5 tarefas", "Nota ≥ 8 em simulado", ou manual) com pontos; progresso calculado a partir dos dados reais; aluno resgata pontos ao concluir.
- **Recompensas**: catálogo criado pela gestão (ex.: medalhas, vantagens), aluno troca pontos; ranking da turma.
- **Comunicação interna**: comunicados com destino (escola, turma ou perfil). Professores enviam como rascunho → **secretaria aprova ou rejeita** (com motivo) → só depois aparece para os destinatários e gera notificação. Gestão publica direto.
- **Notificações**: sino no topo com contador e lista, marcando como lida.

## 5. Simulados com conteúdo das disciplinas
- Remover as 12 questões de exemplo e cadastrar um banco novo ligado às **disciplinas reais** do sistema (cerca de 4 questões por disciplina cadastrada, por categoria ENEM/SSA/vestibular/concurso), autorais e com explicação.
- Questões passam a ter disciplina; filtro por disciplina na página.
- EduMind recebe no contexto as disciplinas da turma do aluno e os conteúdos das próximas provas, priorizando o que ele realmente estuda.

## 6. Contas de teste e verificação completa
- Criar 3 contas confirmadas: aluno, professor e secretaria (e-mails de teste, senha informada no chat ao final).
- Rodar no navegador: secretaria cria turma → matricula o aluno → vincula o professor à disciplina; professor cria tarefa e lança nota e frequência; aluno vê tarefa, nota e frequência no painel; diretor/secretaria veem totais e desempenho. Também envio e aprovação de um comunicado. Prints de cada etapa.

## Detalhes técnicos
- Funções security definer `definir_papel(_user, _role)` com checagem hierárquica + auditoria; `user_roles` continua sem escrita direta.
- Novas tabelas (com GRANT + RLS): `frequencias`, `desafios`, `desafio_conclusoes`, `recompensas`, `resgates`, `pontos` (view/saldo calculado), `comunicados` (status rascunho/pendente/aprovado/rejeitado, aprovado_por). Coluna `disciplina_id` em `questoes`.
- Trigger: comunicado aprovado → insere em `notificacoes` para os destinatários; desafio concluído → crédito de pontos.
- RLS de `auditoria` restrita à direção; secretaria ganha leitura de profiles/matrículas via `is_gestao`.
- Novas rotas em `_authenticated/`: usuarios, matriculas, desempenho, desafios, recompensas, comunicados; itens adicionados em AppSidebar por perfil.
- Testes vitest: regra de hierarquia de papéis, cálculo de frequência (%), alerta (média < 6 / freq < 75%), saldo de pontos.
- Contas de teste criadas via admin no servidor durante a verificação; fluxo validado com Playwright.
