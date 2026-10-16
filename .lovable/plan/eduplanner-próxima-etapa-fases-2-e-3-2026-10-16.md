# EduPlanner — Próxima etapa (Fases 2 e 3)

Base pronta: login/cadastro, perfis, banco com turmas, disciplinas, tarefas, entregas, provas, notas, eventos e notificações, e um painel inicial.

## O que será construído agora

1. **Menu lateral do sistema** (muda conforme o perfil: aluno, professor, gestão), com botão de sair, tema claro/escuro e versão para celular.
2. **Painel por perfil**
   - Aluno: cartões de resumo + próximas tarefas e provas.
   - Professor: suas turmas, tarefas recentes e entregas pendentes.
   - Gestão: totais de alunos, turmas, professores e atividades.
3. **Tarefas**
   - Aluno: lista com filtros (pendente, em andamento, concluída, atrasada), marcar como em andamento/concluída.
   - Professor: criar, editar e excluir tarefas por turma e disciplina; ver quem entregou.
4. **Provas e notas**
   - Aluno: próximas provas e boletim com média ponderada por disciplina.
   - Professor: criar provas e lançar notas por aluno.
5. **Agenda/Calendário**: visão mensal com provas, tarefas e eventos; aluno pode criar lembretes pessoais.
6. **Gestão**: cadastro de turmas e disciplinas, matrícula de alunos e vínculo de professores.
7. **Perfil**: editar nome e telefone.

Fases seguintes (desafios, recompensas, relatórios, auditoria, LGPD) ficam para a próxima rodada.

## Detalhes técnicos

- Layout compartilhado em `_authenticated/route.tsx` envolvendo `<Outlet />` com sidebar shadcn; rotas: `/painel`, `/tarefas`, `/provas`, `/notas`, `/agenda`, `/turmas`, `/disciplinas`, `/perfil`.
- Hook `usePerfil` (roles via `user_roles`) com React Query; itens de menu filtrados por perfil.
- Dados lidos/escritos pelo cliente com as políticas de acesso já existentes; ajustes de política apenas se algum fluxo falhar (ex.: gestão matricular alunos precisa listar perfis — já permitido por `is_gestao`).
- Testes em `src/test/perfil.test.ts` para regras de status e média.
- `head()` próprio em cada rota nova.
