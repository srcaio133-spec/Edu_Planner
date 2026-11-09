# Fila de revisão de questões geradas por IA

## O que muda para quem usa
- **Professor:** ao clicar em "Gerar com IA", as questões vão para a fila de revisão. Ele acompanha as próprias questões em "Minhas questões", com o selo Em revisão, Aprovada ou Rejeitada, e vê o motivo de cada rejeição. Ele não aprova nem as próprias questões nem as de outros.
- **Secretaria (e o restante da gestão):** a fila "Questões para revisar" fica na página Simulados e mostra quantas questões estão esperando. Cada questão aparece completa, com enunciado, alternativas, figura, resposta certa e explicação, além do autor, da disciplina e do conteúdo. A secretaria pode:
  - **Aprovar:** escolhe em qual simulado a questão entra (por padrão, o simulado da mesma prova).
  - **Rejeitar:** precisa escrever o motivo.
- **Aluno:** só vê questões aprovadas nos simulados. As que estão em revisão ou foram rejeitadas nunca aparecem.
- O autor recebe uma notificação no sino quando a questão é aprovada ou rejeitada. Cada decisão fica registrada no histórico de ações do sistema.

## Detalhes técnicos
- Migração:
  - adiciona o status `rejeitada` e as colunas `motivo_rejeicao`, `revisado_por` e `revisado_em` em `questoes`;
  - cria a função security definer `avaliar_questao(_id, _aprovar, _motivo, _simulado)`. Ela só aceita usuários de gestão (`is_gestao`), exige motivo para rejeitar, só avalia questões em revisão, inclui a questão em `simulado_questoes` quando for aprovada, notifica o autor e grava a decisão na auditoria;
  - troca as permissões de escrita na tabela para que professores não consigam mudar o status diretamente. Eles continuam podendo inserir questões apenas com status `em_revisao`, e um trigger força esse status ao inserir para quem não é gestão;
  - permite que o autor leia as próprias questões (inclusive rejeitadas), que a gestão leia todas e que alunos leiam só as aprovadas;
  - em `simulado_questoes`, apenas a gestão pode vincular questões a simulados.
- `QuestoesIA.tsx`:
  - `RevisarQuestoes` passa a ser visível só para a gestão e chama a função `avaliar_questao` (diálogo com motivo obrigatório ao rejeitar);
  - novo componente `MinhasQuestoes` para o professor.
- `questoes-ia.ts`: continua salvando as questões como `em_revisao` e devolve a quantidade criada, que aparece em um aviso para o professor.
- O formulário manual "Nova questão" usado por professores também passa pela fila. A gestão continua publicando direto.
- Testes: um teste da regra de quem aprova (só a gestão) e de que rejeitar exige motivo, em `src/test/regras.test.ts`. Depois, uma verificação ponta a ponta: o professor gera uma questão, a secretaria rejeita uma e aprova outra, e o aluno vê só a aprovada no simulado.
