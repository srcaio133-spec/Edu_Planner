# School Sparkle

EDUPLANNER — ESPECIFICAÇÃO COMPLETA DO SISTEMA WEB ESCOLAR

1. Visão geral do projeto

Desenvolva um sistema web completo chamado EduPlanner, uma plataforma de organização, acompanhamento e gestão escolar destinada a instituições de ensino.

O EduPlanner deve centralizar em um único ambiente digital informações que normalmente ficam espalhadas em agendas, cadernos, grupos de mensagens, arquivos, planilhas e diferentes sistemas.

O sistema deverá atender principalmente três grandes grupos de usuários:

Aluno

Professor

Gestão Escolar / Secretaria, incluindo Direção, Vice-Direção, Secretaria e funções administrativas.

É importante compreender que alunos e professores não devem ser tratados como uma única categoria genérica de “usuários” na interface. Eles possuem perfis, permissões, dashboards e funcionalidades diferentes.

No banco de dados, entretanto, pode existir uma entidade central de autenticação chamada usuarios, contendo identificação e credenciais, desde que exista um controle de perfil/permissão que diferencie claramente aluno, professor, secretaria, diretor, vice-diretor e administrador. A interface e o sistema de permissões devem tratar cada perfil de maneira independente.

O objetivo é criar uma aplicação com aparência profissional, facilidade de uso, boa organização visual, segurança, escalabilidade e integração completa com banco de dados PostgreSQL.

2. Propósito do sistema

O EduPlanner tem como objetivo resolver principalmente problemas relacionados à organização e ao acompanhamento da rotina escolar.

Entre os problemas que devem ser considerados estão:

esquecimento de tarefas;

perda de prazos;

dificuldade de acompanhar provas;

informações espalhadas em diferentes locais;

dificuldade para acompanhar notas;

dificuldade para identificar matérias que precisam de maior atenção;

dificuldade dos professores em acompanhar tarefas e entregas;

falta de centralização das informações escolares;

dificuldade da gestão em acompanhar indicadores da instituição.

O sistema deve transformar essas informações em uma plataforma integrada. O material do projeto estabelece exatamente essa proposta de centralização de matérias, tarefas, provas, notas, calendário, avisos, notificações e desempenho.

3. Arquitetura geral

A aplicação deve seguir uma arquitetura Full Stack.

Front-end

Utilizar:

HTML5

CSS3

JavaScript

componentes reutilizáveis

responsividade

acessibilidade

tema claro e escuro

Back-end

Utilizar:

Node.js

Express

API REST

autenticação JWT

controle RBAC

validação das requisições

Banco de dados

Utilizar:

PostgreSQL

UUID

Foreign Keys

Constraints

Índices

Transações

auditoria

estrutura preparada para LGPD

Arquitetura

O fluxo principal deve ser:

Frontend → API → regras de negócio → PostgreSQL

Nunca permitir que o frontend se conecte diretamente ao PostgreSQL.

4. Identidade visual

A interface deve seguir fielmente o estilo das telas fornecidas como referência.

O projeto possui estética moderna, limpa, educacional e profissional.

A linguagem visual deve utilizar:

cards com bordas suaves;

fundo claro;

bastante espaço em branco;

ícones lineares;

tipografia moderna;

sidebar;

dashboards;

gráficos;

tabelas;

indicadores;

badges;

botões arredondados;

sombras muito leves.

A identidade deve lembrar uma plataforma SaaS educacional profissional.

5. Identidade de cores por perfil

Um ponto obrigatório da implementação é que o sistema altere sua identidade visual de acordo com o perfil autenticado.

Aluno

A identidade visual do aluno deve utilizar azul.

Cor principal:

#2563EB

Cor secundária:

#0D3B8E

O ícone do livro da logo deve permanecer predominantemente azul.

O menu lateral, ícones principais e elementos de destaque devem seguir essa identidade.

Professor

A identidade visual do professor deve utilizar roxo.

Cor principal:

#6D4AFF

ou uma tonalidade semelhante ao roxo utilizada no layout de referência.

Ao entrar como professor:

a logo do livro deve mudar para roxo;

os ícones principais devem assumir roxo;

botões principais devem assumir roxo;

estados ativos do menu devem usar roxo;

gráficos e indicadores principais podem utilizar roxo.

Essa mudança deve ocorrer automaticamente de acordo com o perfil autenticado.

Gestão / Secretaria / Direção

A identidade visual da gestão deve possuir uma identidade própria, mais administrativa e institucional.

Sugestão:

azul-marinho;

roxo escuro;

azul institucional;

verde para indicadores positivos;

laranja para alertas.

A gestão deve transmitir sensação de controle, administração, confiabilidade e monitoramento.

6. Logo

A logo principal do EduPlanner deve representar um livro aberto.

Características:

livro aberto;

contorno azul;

linhas internas representando texto;

aparência moderna;

fundo transparente;

possibilidade de alteração de cor através de CSS/SVG.

É importante que a logo seja construída preferencialmente como SVG para permitir mudança dinâmica de cor.

Exemplo:

Aluno:

#2563EB

Professor:

#6D4AFF

Gestão:

#312E81

A IA deverá evitar transformar a logo em uma imagem raster fixa quando uma versão SVG reutilizável puder ser utilizada.

7. Tela de login

A tela de login deve seguir o layout visual fornecido anteriormente.

Ela deve possuir duas grandes áreas.

Lado esquerdo

Painel institucional.

Elementos:

fundo em gradiente azul;

logo do EduPlanner;

livro centralizado;

nome “EduPlanner”;

frase:

“Organize seus estudos.
Alcance seus objetivos.”

elementos decorativos discretos;

calendário;

lápis;

gráfico;

capelo;

livros;

calendário de mesa;

materiais escolares.

O gradiente deve ir de um azul mais escuro no topo para um azul ligeiramente mais claro na parte inferior.

Lado direito

Formulário:

título “Bem-vindo de volta!”;

subtítulo;

campo E-mail;

campo Senha;

mostrar/ocultar senha;

lembrar-me;

esqueci minha senha;

botão Entrar;

Google;

Microsoft;

cadastro.

Adicionar botão:

“Tema”

Esse botão deve permitir alternar entre:

tema claro;

tema escuro.

8. Cadastro

A página de cadastro deve possuir aparência equivalente à tela de login.

Campos:

nome completo;

e-mail;

senha;

confirmação de senha;

matrícula, quando aplicável;

perfil;

telefone;

turma, quando aplicável.

O usuário não deve poder escolher livremente perfis administrativos de alto nível.

Por exemplo:

Aluno → pode ser cadastrado conforme as regras da instituição.

Professor → pode ser cadastrado pela secretaria.

Secretaria → somente gestão autorizada.

Diretor → somente administrador autorizado.

Vice-diretor → somente administrador autorizado.

Nunca permitir que um usuário simplesmente escolha “Diretor” no formulário público de cadastro.

9. Dashboard do aluno

O dashboard do aluno deve seguir o modelo visual apresentado.

No topo:

“Olá, Caio! 👋”

Abaixo:

“Vamos organizar o seu dia e alcançar grandes conquistas.”

Cards superiores:

Tarefas pendentes

Mostrar:

quantidade;

texto secundário;

barra de progresso.

Tarefas para hoje

Mostrar:

quantidade;

prioridade;

progresso.

Próximas provas

Mostrar:

número;

período;

indicação de proximidade.

Média geral

Mostrar:

média;

evolução;

indicador positivo ou negativo.

10. Tarefas do aluno

Criar seção:

Minhas Tarefas

Cada tarefa deve mostrar:

título;

disciplina;

prazo;

horário;

prioridade;

status;

professor;

arquivos;

botão de concluir.

Estados:

pendente;

em andamento;

concluída;

atrasada.

Prioridades:

baixa;

média;

alta.

Permitir:

filtrar;

pesquisar;

ordenar;

visualizar;

concluir;

anexar arquivo quando permitido.

Esses campos já fazem parte da concepção original das tarefas do EduPlanner.

11. Calendário do aluno

O calendário deve mostrar:

provas;

tarefas;

trabalhos;

eventos;

reuniões;

atividades;

prazos;

compromissos.

Visualizações:

mensal;

semanal;

diária.

Eventos oficiais da escola devem ser diferentes de eventos pessoais do aluno.

Exemplo:

Eventos oficiais:
“Prova de Matemática”

Eventos pessoais:
“Estudar Matemática”

O calendário deve permitir distinguir visualmente cada tipo.

12. Área de matérias

Cada matéria deve possuir:

nome;

professor;

média;

progresso;

próximas atividades;

materiais;

arquivos.

Exemplo:

Matemática — 80%

História — 65%

Português — 90%

Física — 70%

13. Provas e notas

O aluno deve conseguir:

visualizar provas;

visualizar data;

visualizar matéria;

visualizar nota;

visualizar média;

visualizar peso;

acompanhar evolução.

Professor poderá:

criar avaliação;

definir peso;

lançar notas;

editar notas;

visualizar alunos.

A documentação original já define o registro de provas com nome, matéria, data, conteúdo, peso e turma.

14. Desempenho

Criar uma área visual de desempenho contendo:

média geral;

média por disciplina;

evolução temporal;

tarefas concluídas;

tarefas pendentes;

provas;

frequência;

gráficos.

Não utilizar somente números.

Utilizar também:

gráficos;

barras de progresso;

indicadores;

comparações com períodos anteriores.

O objetivo é permitir que o aluno entenda sua evolução, não apenas veja sua nota.

15. Sistema de desafios

Criar uma área de gamificação.

Professor cria:

nome;

descrição;

período;

pontos;

turma;

recompensa.

Exemplos:

“Leitor Nota 10”

“Matemática em Ação”

“Presença Nota 10”

“Desafio Criativo”

As recompensas podem ser:

pontos;

doces;

chocolate;

medalhas;

reconhecimento;

outros prêmios definidos pela escola.

Aluno:

Participar → concluir → ganhar pontos → ranking → recompensa.

16. Dashboard do professor

O layout do professor deve ser visualmente semelhante ao dashboard do aluno, mas com identidade roxa.

No topo:

“Olá, Professor João! 👋”

Subtítulo:

“Aqui está o resumo das suas turmas e atividades.”

Cards:

Turmas

4 turmas ativas.

Tarefas criadas

12 esta semana.

Entregas

28 esta semana.

Média geral das turmas

7,8.

17. Tarefas do professor

Professor poderá:

criar tarefa;

editar;

excluir;

definir prazo;

escolher turma;

escolher matéria;

receber entregas;

corrigir;

dar nota.

Cada tarefa deve apresentar:

turma;

disciplina;

prazo;

quantidade entregue;

quantidade pendente;

status.

18. Entregas por turma

Criar um painel visual:

9º Ano A — 85%

2º Ano B — 70%

1º Ano A — 92%

3º Ano C — 60%

Esses indicadores devem vir do banco de dados.

Não utilizar números fixos no sistema final.

19. Avisos do professor

Professor poderá enviar:

comunicados;

lembretes;

alterações de prova;

informações sobre trabalhos;

informações de aula.

Os avisos devem poder ser destinados a:

turma específica;

várias turmas;

todos os alunos permitidos.

20. Comunicação

Criar área de comunicação interna.

Aluno poderá conversar com:

professor;

representante;

coordenação.

Professor poderá conversar com:

representantes;

vice-representantes;

coordenação.

A comunicação deve ser restrita por regras de permissão.

Não criar um chat público indiscriminado entre todos os usuários.

21. Gestão e Secretaria

A área de gestão deve ser considerada uma categoria administrativa separada da experiência de alunos e professores.

Perfil institucional:

Gestão & Secretaria

Inclui:

Diretor;

Vice-Diretor;

Secretaria;

Coordenação, quando aplicável.

O menu de gestão não deve possuir uma opção genérica chamada “Usuários” como principal módulo operacional da escola se a intenção é trabalhar especificamente com entidades escolares.

Em vez disso, utilizar:

Alunos;

Professores;

Turmas;

Disciplinas;

Matrículas;

Calendário Escolar;

Horários;

Avaliações;

Documentos;

Relatórios;

Auditoria;

Logs;

Backup;

Configurações.

A entidade técnica usuarios pode continuar existindo no banco para autenticação, mas a interface deve apresentar as entidades escolares separadamente.

22. Dashboard da gestão

O dashboard administrativo deve mostrar:

Total de alunos

Exemplo:

1.248

Total de professores

87

Total de turmas

36

Total de disciplinas

52

Taxa de frequência

92,4%

23. Indicadores

Gráficos:

Frequência por turma

Comparar turmas.

Desempenho geral

Mostrar:

aprovados;

em recuperação;

reprovados.

Atividades recentes

Registrar:

matrícula criada;

turma atualizada;

nota lançada;

relatório gerado;

backup realizado.

24. Solicitações pendentes

A gestão deve visualizar solicitações que exigem aprovação.

Exemplos:

aprovação de matrícula;

cadastro de professor;

emissão de declaração;

alteração de turma;

outros fluxos administrativos.

Botões:

Aprovar;

Rejeitar.

25. Calendário escolar da gestão

Diferente do calendário do aluno.

Permitir registrar:

reuniões;

provas;

férias;

eventos;

reuniões pedagógicas;

conselhos de classe;

períodos de matrícula;

datas institucionais.

26. Relatórios

A gestão deve possuir relatórios:

desempenho;

frequência;

notas;

turmas;

professores;

matrículas;

atividades;

indicadores institucionais.

Possibilitar:

visualização;

filtro por período;

filtro por turma;

exportação PDF;

exportação CSV/XLSX, quando implementado.

27. Auditoria e segurança

Criar uma área administrativa chamada:

Auditoria LGPD

Exibir:

acessos;

alterações;

tentativas de login;

falhas de autenticação;

alterações de permissões;

exclusões;

alterações de notas;

alterações de matrícula.

O sistema deve armazenar logs sem expor informações desnecessárias.

28. Segurança

Implementar:

hash de senha com Argon2id ou bcrypt;

JWT para autenticação da API;

refresh token com rotação, se utilizado;

RBAC;

validação de entrada;

prepared statements;

proteção contra SQL Injection;

proteção contra XSS;

CSRF quando houver autenticação baseada em cookie;

rate limiting;

bloqueio temporário após tentativas suspeitas;

expiração de sessão;

HTTPS em produção;

headers de segurança;

CORS restritivo;

armazenamento seguro de segredos;

logs de auditoria.

Nunca armazenar senhas em texto puro.

29. Proteção de dados

O sistema deve seguir princípios da LGPD, incluindo:

minimização de dados;

finalidade;

segurança;

controle de acesso;

rastreabilidade;

retenção;

anonimização quando aplicável;

controle de consentimento quando necessário.

Dados acadêmicos não devem ficar acessíveis a qualquer usuário.

Um aluno deve visualizar seus próprios dados.

Um professor deve visualizar somente informações relacionadas às suas turmas e responsabilidades.

A secretaria deve acessar dados administrativos conforme sua função.

Diretor e Vice-Diretor devem possuir maior visibilidade institucional.

30. Banco de dados

Utilizar PostgreSQL.

Entidades principais:

usuarios;

perfis;

alunos;

professores;

funcionarios;

turmas;

disciplinas;

matriculas;

aulas;

tarefas;

entregas;

provas;

notas;

frequencias;

desafios;

participantes_desafios;

recompensas;

avisos;

notificacoes;

eventos;

mensagens;

anexos;

relatorios;

logs_acesso;

auditoria;

consentimentos;

sessoes.

A estrutura deve utilizar chaves estrangeiras e integridade referencial.

31. Regra fundamental de integração

A IA que implementar o sistema deve evitar utilizar informações “fake” no produto final.

Todos os números exibidos nos dashboards devem ser obtidos por consultas ao PostgreSQL.

Exemplo:

O card:

“Tarefas pendentes — 8”

não deve possuir o número 8 hardcoded.

Deve executar uma consulta equivalente a:

contar tarefas pendentes do aluno autenticado.

O mesmo vale para:

notas;

média;

frequência;

quantidade de alunos;

quantidade de professores;

tarefas;

entregas;

desafios;

avisos;

eventos;

relatórios.

32. Integração dinâmica de perfil

Após autenticação:

API identifica o usuário;

API identifica o perfil;

API gera o token;

Frontend recebe o perfil;

Frontend carrega o dashboard correspondente;

Frontend altera a identidade visual;

API restringe as rotas conforme RBAC.

Exemplo:

Aluno:

perfil = aluno
tema = azul
dashboard = aluno


Professor:

perfil = professor
tema = roxo
dashboard = professor


Diretor:

perfil = diretor
tema = institucional
dashboard = gestão


Secretaria:

perfil = secretaria
tema = institucional
dashboard = gestão administrativa


Vice-Diretor:

perfil = vice_diretor
tema = institucional
dashboard = gestão


33. Logo dinâmica

A logo do livro deve ser SVG ou elemento que permita alteração de cor.

Aluno

Livro azul.

Professor

Livro roxo.

Gestão

Livro em azul-marinho ou roxo institucional.

A mudança deve ser automática de acordo com o perfil.

Não criar três aplicações independentes.

Criar uma única aplicação com sistema de temas/perfis.

34. Tema claro e escuro

O sistema deve possuir botão:

Tema

Ao clicar:

Tema claro:

fundo branco;

cards brancos;

textos escuros;

bordas claras.

Tema escuro:

fundo escuro;

cards escuros;

textos claros;

bordas escuras;

cores de destaque preservadas.

A preferência deve ser armazenada no navegador para que o sistema lembre a escolha do usuário.

35. Responsividade

O sistema deve funcionar em:

desktop;

notebook;

tablet;

celular.

Desktop:

sidebar lateral.

Tablet:

sidebar reduzida ou recolhível.

Celular:

menu inferior ou menu lateral recolhível.

36. Experiência de usuário

O sistema deve ser simples mesmo possuindo muitas funções.

Evitar:

excesso de menus;

telas confusas;

botões sem finalidade;

informações duplicadas.

Utilizar:

hierarquia visual;

cards;

filtros;

pesquisa;

feedback visual;

estados de carregamento;

mensagens de erro claras;

confirmações antes de ações importantes.

37. Estado de carregamento

Sempre que uma consulta ao backend estiver sendo executada:

mostrar:

skeleton;

spinner;

mensagem de carregamento.

Não deixar a tela aparentar estar travada.

38. Tratamento de erros

Exemplo:

Se o login falhar:

“E-mail ou senha inválidos.”

Não informar:

“E-mail existe, mas senha está errada.”

Isso evita vazamento de informação.

39. Implementação final esperada

A IA deverá produzir:

Frontend completo;

CSS externo;

JavaScript modular;

Backend Node.js + Express;

API REST;

PostgreSQL;

JWT;

RBAC;

auditoria;

controle de permissões;

sistema de tarefas;

calendário;

notas;

frequência;

desafios;

recompensas;

avisos;

notificações;

mensagens;

relatórios;

gestão escolar;

secretaria;

direção;

vice-direção;

modo escuro;

identidade visual por perfil.

40. Regra visual final

A referência visual deve ser seguida sem simplesmente copiar elementos de forma desorganizada.

A experiência deve transmitir:

Aluno → organização e aprendizado

Professor → acompanhamento e produtividade

Gestão → controle, indicadores e administração

Cada perfil deve parecer parte do mesmo produto, mas possuir identidade própria.

O dashboard do professor mostrado como referência deve servir como padrão visual para a área docente: sidebar branca, identidade roxa, cards superiores com métricas, tarefas recentes, entregas por turma, avisos recentes e próximos compromissos.

A área do aluno deve manter a mesma linguagem, mas com identidade azul.

A área de gestão/secretaria deve seguir a mesma linguagem visual, porém com um dashboard institucional mais completo e focado em indicadores.

A plataforma deve parecer um único produto profissional chamado EduPlanner, e não três sistemas diferentes.

41. Prioridade de desenvolvimento

Implemente na seguinte ordem:

Fase 1

Autenticação + banco + perfis.

Fase 2

Dashboard do aluno.

Fase 3

Dashboard do professor.

Fase 4

Gestão e Secretaria.

Fase 5

Tarefas + notas + provas + calendário.

Fase 6

Desafios + recompensas + notificações.

Fase 7

Relatórios + auditoria + LGPD.

Fase 8

Refinamento visual + responsividade + acessibilidade.

O resultado final deve ser um sistema escolar funcional, conectado ao PostgreSQL, com dados reais, interfaces específicas por perfil e navegação completa entre os módulos.@secret:LOGO_DEV_PUBLISHABLE_KEY @secret:LOGO_DEV_PUBLISHABLE_KEY @secret:LOGO_DEV_PUBLISHABLE_KEY @secret:LOGO_DEV_PUBLISHABLE_KEY

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/58a914f7-13d8-4e3e-9cea-df2345abfd3a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
