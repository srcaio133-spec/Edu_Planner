
-- ===== Perfis e papéis =====
create type public.app_role as enum ('aluno','professor','secretaria','coordenacao','vice_diretor','diretor','admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null default '',
  email text,
  telefone text,
  matricula text,
  created_at timestamptz not null default now()
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_gestao(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id
    and role in ('secretaria','coordenacao','vice_diretor','diretor','admin'))
$$;

create policy "own roles" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.is_gestao(auth.uid()));
create policy "own profile read" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_gestao(auth.uid()));
create policy "own profile update" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- ===== Acadêmico =====
create table public.turmas (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ano_letivo int not null default extract(year from now())::int,
  created_at timestamptz not null default now()
);
create table public.disciplinas (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  cor text not null default 'blue',
  icone text not null default 'book'
);
create table public.turma_disciplinas (
  id uuid primary key default gen_random_uuid(),
  turma_id uuid not null references public.turmas(id) on delete cascade,
  disciplina_id uuid not null references public.disciplinas(id) on delete cascade,
  professor_id uuid,
  professor_nome text not null default '',
  unique (turma_id, disciplina_id)
);
create table public.matriculas (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null,
  turma_id uuid not null references public.turmas(id) on delete cascade,
  status text not null default 'ativa' check (status in ('ativa','trancada','encerrada')),
  created_at timestamptz not null default now(),
  unique (aluno_id, turma_id)
);
create index on public.matriculas(aluno_id);

create or replace function public.aluno_na_turma(_turma uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.matriculas where aluno_id = auth.uid() and turma_id = _turma and status = 'ativa')
$$;
create or replace function public.prof_da_turma(_turma uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.turma_disciplinas where professor_id = auth.uid() and turma_id = _turma)
$$;

create type public.prioridade as enum ('baixa','media','alta');
create table public.tarefas (
  id uuid primary key default gen_random_uuid(),
  turma_id uuid not null references public.turmas(id) on delete cascade,
  disciplina_id uuid not null references public.disciplinas(id) on delete cascade,
  professor_id uuid,
  titulo text not null check (char_length(titulo) between 1 and 200),
  descricao text,
  prazo timestamptz not null,
  prioridade public.prioridade not null default 'media',
  permite_anexo boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.tarefas(turma_id, prazo);

create type public.status_entrega as enum ('em_andamento','concluida');
create table public.entregas (
  id uuid primary key default gen_random_uuid(),
  tarefa_id uuid not null references public.tarefas(id) on delete cascade,
  aluno_id uuid not null,
  status public.status_entrega not null default 'em_andamento',
  concluida_em timestamptz,
  nota numeric(4,2) check (nota between 0 and 10),
  updated_at timestamptz not null default now(),
  unique (tarefa_id, aluno_id)
);

create table public.provas (
  id uuid primary key default gen_random_uuid(),
  turma_id uuid not null references public.turmas(id) on delete cascade,
  disciplina_id uuid not null references public.disciplinas(id) on delete cascade,
  titulo text not null,
  conteudo text,
  data timestamptz not null,
  peso numeric(4,2) not null default 1 check (peso > 0),
  created_at timestamptz not null default now()
);
create index on public.provas(turma_id, data);

create table public.notas (
  id uuid primary key default gen_random_uuid(),
  prova_id uuid not null references public.provas(id) on delete cascade,
  aluno_id uuid not null,
  valor numeric(4,2) not null check (valor between 0 and 10),
  lancada_em timestamptz not null default now(),
  unique (prova_id, aluno_id)
);
create index on public.notas(aluno_id);

create table public.eventos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  inicio timestamptz not null,
  tipo text not null default 'evento' check (tipo in ('evento','reuniao','prova','tarefa','pessoal','feriado')),
  oficial boolean not null default true,
  turma_id uuid references public.turmas(id) on delete cascade,
  dono_id uuid,
  created_at timestamptz not null default now()
);

create table public.notificacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  titulo text not null,
  lida boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.auditoria (
  id bigint generated always as identity primary key,
  user_id uuid,
  acao text not null,
  entidade text,
  entidade_id uuid,
  detalhes jsonb,
  created_at timestamptz not null default now()
);

-- grants
grant select on public.turmas, public.disciplinas to anon;
grant select on public.turmas, public.disciplinas, public.turma_disciplinas, public.matriculas, public.tarefas, public.provas, public.notas to authenticated;
grant insert, update, delete on public.turmas, public.disciplinas, public.turma_disciplinas, public.matriculas, public.tarefas, public.provas, public.notas to authenticated;
grant select, insert, update on public.entregas to authenticated;
grant select, insert, update, delete on public.eventos to authenticated;
grant select, update on public.notificacoes to authenticated;
grant select on public.auditoria to authenticated;
grant all on public.turmas, public.disciplinas, public.turma_disciplinas, public.matriculas, public.tarefas, public.entregas, public.provas, public.notas, public.eventos, public.notificacoes, public.auditoria to service_role;

alter table public.turmas enable row level security;
alter table public.disciplinas enable row level security;
alter table public.turma_disciplinas enable row level security;
alter table public.matriculas enable row level security;
alter table public.tarefas enable row level security;
alter table public.entregas enable row level security;
alter table public.provas enable row level security;
alter table public.notas enable row level security;
alter table public.eventos enable row level security;
alter table public.notificacoes enable row level security;
alter table public.auditoria enable row level security;

-- leitura pública mínima para o cadastro (nome da turma)
create policy "turmas leitura" on public.turmas for select to anon, authenticated using (true);
create policy "disciplinas leitura" on public.disciplinas for select to anon, authenticated using (true);
create policy "turmas gestao" on public.turmas for all to authenticated using (public.is_gestao(auth.uid())) with check (public.is_gestao(auth.uid()));
create policy "disciplinas gestao" on public.disciplinas for all to authenticated using (public.is_gestao(auth.uid())) with check (public.is_gestao(auth.uid()));

create policy "td leitura" on public.turma_disciplinas for select to authenticated
  using (public.aluno_na_turma(turma_id) or professor_id = auth.uid() or public.is_gestao(auth.uid()));
create policy "td gestao" on public.turma_disciplinas for all to authenticated using (public.is_gestao(auth.uid())) with check (public.is_gestao(auth.uid()));

create policy "matriculas leitura" on public.matriculas for select to authenticated
  using (aluno_id = auth.uid() or public.prof_da_turma(turma_id) or public.is_gestao(auth.uid()));
create policy "matriculas gestao" on public.matriculas for all to authenticated using (public.is_gestao(auth.uid())) with check (public.is_gestao(auth.uid()));

create policy "tarefas leitura" on public.tarefas for select to authenticated
  using (public.aluno_na_turma(turma_id) or public.prof_da_turma(turma_id) or public.is_gestao(auth.uid()));
create policy "tarefas professor" on public.tarefas for all to authenticated
  using (public.prof_da_turma(turma_id) or public.is_gestao(auth.uid()))
  with check (public.prof_da_turma(turma_id) or public.is_gestao(auth.uid()));

create policy "entregas leitura" on public.entregas for select to authenticated
  using (aluno_id = auth.uid() or exists (select 1 from public.tarefas t where t.id = tarefa_id and (public.prof_da_turma(t.turma_id) or public.is_gestao(auth.uid()))));
create policy "entregas aluno insere" on public.entregas for insert to authenticated
  with check (aluno_id = auth.uid() and nota is null and exists (select 1 from public.tarefas t where t.id = tarefa_id and public.aluno_na_turma(t.turma_id)));
create policy "entregas aluno atualiza" on public.entregas for update to authenticated
  using (aluno_id = auth.uid()) with check (aluno_id = auth.uid());
create policy "entregas professor" on public.entregas for update to authenticated
  using (exists (select 1 from public.tarefas t where t.id = tarefa_id and public.prof_da_turma(t.turma_id)));

-- aluno não pode se dar nota
create or replace function public.entregas_protege_nota()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.aluno_id = auth.uid() and new.nota is distinct from old.nota then
    raise exception 'Aluno não pode alterar a nota';
  end if;
  new.updated_at := now();
  new.concluida_em := case when new.status = 'concluida' then coalesce(new.concluida_em, now()) else null end;
  return new;
end $$;
create trigger trg_entregas_nota before update on public.entregas for each row execute function public.entregas_protege_nota();

create policy "provas leitura" on public.provas for select to authenticated
  using (public.aluno_na_turma(turma_id) or public.prof_da_turma(turma_id) or public.is_gestao(auth.uid()));
create policy "provas professor" on public.provas for all to authenticated
  using (public.prof_da_turma(turma_id) or public.is_gestao(auth.uid()))
  with check (public.prof_da_turma(turma_id) or public.is_gestao(auth.uid()));

create policy "notas leitura" on public.notas for select to authenticated
  using (aluno_id = auth.uid() or exists (select 1 from public.provas p where p.id = prova_id and (public.prof_da_turma(p.turma_id) or public.is_gestao(auth.uid()))));
create policy "notas professor" on public.notas for all to authenticated
  using (exists (select 1 from public.provas p where p.id = prova_id and public.prof_da_turma(p.turma_id)))
  with check (exists (select 1 from public.provas p where p.id = prova_id and public.prof_da_turma(p.turma_id)));

create policy "eventos leitura" on public.eventos for select to authenticated
  using ((oficial and (turma_id is null or public.aluno_na_turma(turma_id) or public.prof_da_turma(turma_id) or public.is_gestao(auth.uid()))) or dono_id = auth.uid());
create policy "eventos pessoais" on public.eventos for all to authenticated
  using (dono_id = auth.uid() and not oficial) with check (dono_id = auth.uid() and not oficial);
create policy "eventos gestao" on public.eventos for all to authenticated
  using (public.is_gestao(auth.uid())) with check (public.is_gestao(auth.uid()));

create policy "notif propria" on public.notificacoes for select to authenticated using (user_id = auth.uid());
create policy "notif marcar" on public.notificacoes for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "auditoria gestao" on public.auditoria for select to authenticated
  using (public.has_role(auth.uid(),'diretor') or public.has_role(auth.uid(),'vice_diretor') or public.has_role(auth.uid(),'admin'));

-- auditoria de notas
create or replace function public.audita_notas() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.auditoria(user_id, acao, entidade, entidade_id, detalhes)
  values (auth.uid(), tg_op, 'notas', coalesce(new.id, old.id),
    jsonb_build_object('antes', case when tg_op <> 'INSERT' then old.valor end, 'depois', case when tg_op <> 'DELETE' then new.valor end));
  return coalesce(new, old);
end $$;
create trigger trg_audita_notas after insert or update or delete on public.notas for each row execute function public.audita_notas();

-- ===== Dados de demonstração =====
insert into public.turmas(nome) values ('9º Ano A'),('1º Ano A'),('2º Ano B'),('3º Ano C');
insert into public.disciplinas(nome, cor, icone) values
 ('Matemática','blue','calculator'),('História','green','landmark'),('Português','purple','book-open'),('Física','amber','atom');
insert into public.turma_disciplinas(turma_id, disciplina_id, professor_nome)
select t.id, d.id, case d.nome when 'Matemática' then 'Prof. João Silva' when 'História' then 'Profª. Ana Souza' when 'Português' then 'Profª. Carla Lima' else 'Prof. Pedro Alves' end
from public.turmas t cross join public.disciplinas d;

insert into public.tarefas(turma_id, disciplina_id, titulo, descricao, prazo, prioridade)
select t.id, d.id, x.titulo, x.descr, date_trunc('day', now()) + x.off, x.prio::public.prioridade
from public.turmas t
cross join (values
  ('Matemática','Exercícios de Matemática','Lista 4: equações do 2º grau', interval '14 hours','alta'),
  ('História','Resumo - Revolução Francesa','Resumo de 1 página', interval '16 hours 30 minutes','media'),
  ('Português','Leitura - Dom Casmurro','Capítulos 1 a 10', interval '19 hours','baixa'),
  ('Física','Relatório de laboratório','Experimento de queda livre', interval '2 days 18 hours','alta'),
  ('Matemática','Lista de geometria','Áreas e perímetros', interval '4 days 12 hours','media'),
  ('Português','Redação dissertativa','Tema: tecnologia na escola', interval '6 days 23 hours','media'),
  ('História','Linha do tempo','Brasil Império', interval '-2 days 12 hours','baixa'),
  ('Física','Exercícios de cinemática','Lista 2', interval '-5 days 12 hours','media')
) as x(disc, titulo, descr, off, prio)
join public.disciplinas d on d.nome = x.disc;

insert into public.provas(turma_id, disciplina_id, titulo, conteudo, data, peso)
select t.id, d.id, x.titulo, x.cont, date_trunc('day', now()) + x.off, x.peso
from public.turmas t
cross join (values
  ('Matemática','Prova 1 - Matemática','Frações', interval '-75 days 8 hours', 2),
  ('História','Prova 1 - História','Idade Média', interval '-70 days 8 hours', 2),
  ('Português','Prova 1 - Português','Interpretação', interval '-65 days 8 hours', 2),
  ('Física','Prova 1 - Física','Grandezas', interval '-60 days 8 hours', 2),
  ('Matemática','Prova 2 - Matemática','Equações', interval '-40 days 8 hours', 2),
  ('História','Prova 2 - História','Renascimento', interval '-35 days 8 hours', 2),
  ('Português','Prova 2 - Português','Gramática', interval '-25 days 8 hours', 2),
  ('Física','Prova 2 - Física','Movimento', interval '-20 days 8 hours', 2),
  ('Matemática','Trabalho - Matemática','Estatística', interval '-8 days 8 hours', 1),
  ('Português','Seminário - Português','Literatura', interval '-4 days 8 hours', 1),
  ('Matemática','Prova 3 - Matemática','Funções', interval '3 days 8 hours', 3),
  ('História','Prova 3 - História','Revolução Francesa', interval '5 days 8 hours', 3),
  ('Física','Prova 3 - Física','Leis de Newton', interval '12 days 8 hours', 3)
) as x(disc, titulo, cont, off, peso)
join public.disciplinas d on d.nome = x.disc;

insert into public.eventos(titulo, inicio, tipo, oficial)
values ('Reunião de pais', date_trunc('day', now()) + interval '9 days 19 hours', 'reuniao', true),
       ('Feira de Ciências', date_trunc('day', now()) + interval '16 days 9 hours', 'evento', true);

-- ===== Cadastro: perfil + papel aluno + matrícula + notas demo =====
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_turma uuid;
begin
  insert into public.profiles(id, nome, email, telefone, matricula)
  values (new.id,
    coalesce(nullif(new.raw_user_meta_data->>'nome',''), nullif(new.raw_user_meta_data->>'full_name',''), split_part(new.email,'@',1)),
    new.email, left(new.raw_user_meta_data->>'telefone', 30), left(new.raw_user_meta_data->>'matricula', 30));
  -- Cadastro público SEMPRE cria aluno; outros perfis são atribuídos pela gestão.
  insert into public.user_roles(user_id, role) values (new.id, 'aluno');

  begin v_turma := (new.raw_user_meta_data->>'turma_id')::uuid; exception when others then v_turma := null; end;
  if v_turma is null or not exists (select 1 from public.turmas where id = v_turma) then
    select id into v_turma from public.turmas order by nome limit 1;
  end if;
  if v_turma is not null then
    insert into public.matriculas(aluno_id, turma_id) values (new.id, v_turma);
    -- DEMO: notas das avaliações já realizadas, para o painel não ficar vazio
    insert into public.notas(prova_id, aluno_id, valor, lancada_em)
    select p.id, new.id, round((6 + random()*4)::numeric, 1), p.data + interval '3 days'
    from public.provas p where p.turma_id = v_turma and p.data < now();
    -- DEMO: algumas tarefas antigas já concluídas
    insert into public.entregas(tarefa_id, aluno_id, status, concluida_em)
    select t.id, new.id, 'concluida', t.prazo - interval '1 day'
    from public.tarefas t where t.turma_id = v_turma and t.prazo < now() - interval '4 days';
    insert into public.notificacoes(user_id, titulo) values
      (new.id, 'Bem-vindo ao EduPlanner!'), (new.id, 'Prova de Matemática em breve'), (new.id, 'Nova tarefa de Física publicada');
  end if;
  insert into public.auditoria(user_id, acao, entidade, entidade_id) values (new.id, 'CADASTRO', 'usuarios', new.id);
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();
