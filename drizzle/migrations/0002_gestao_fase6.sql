-- Papéis -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_direcao(_u uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT exists (SELECT 1 FROM user_roles WHERE user_id=_u AND role IN ('diretor','vice_diretor','admin')) $$;

CREATE OR REPLACE FUNCTION public.definir_papel(_user uuid, _role public.app_role) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _antes jsonb;
BEGIN
  IF NOT is_gestao(auth.uid()) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  IF _user = auth.uid() THEN RAISE EXCEPTION 'Você não pode alterar o próprio papel'; END IF;
  IF (_role IN ('diretor','vice_diretor','admin') OR is_direcao(_user)) AND NOT is_direcao(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas a direção altera papéis de direção';
  END IF;
  IF _role = 'admin' AND NOT has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Apenas administradores concedem admin'; END IF;
  SELECT jsonb_agg(role) INTO _antes FROM user_roles WHERE user_id=_user;
  DELETE FROM user_roles WHERE user_id=_user;
  INSERT INTO user_roles(user_id, role) VALUES (_user, _role);
  INSERT INTO auditoria(user_id, acao, entidade, entidade_id, detalhes)
    VALUES (auth.uid(), 'DEFINIR_PAPEL', 'user_roles', _user, jsonb_build_object('antes', _antes, 'depois', _role));
END $$;
GRANT EXECUTE ON FUNCTION public.definir_papel(uuid, public.app_role) TO authenticated;

-- Frequência ---------------------------------------------------------
CREATE TABLE public.frequencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id uuid NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  disciplina_id uuid NOT NULL REFERENCES public.disciplinas(id) ON DELETE CASCADE,
  aluno_id uuid NOT NULL,
  data date NOT NULL,
  presente boolean NOT NULL DEFAULT true,
  UNIQUE (turma_id, disciplina_id, aluno_id, data)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.frequencias TO authenticated;
GRANT ALL ON public.frequencias TO service_role;
ALTER TABLE public.frequencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "freq leitura" ON public.frequencias FOR SELECT TO authenticated USING (aluno_id = auth.uid() OR public.prof_da_turma(turma_id) OR public.is_gestao(auth.uid()));
CREATE POLICY "freq escrita" ON public.frequencias FOR ALL TO authenticated USING (public.prof_da_turma(turma_id) OR public.is_gestao(auth.uid())) WITH CHECK (public.prof_da_turma(turma_id) OR public.is_gestao(auth.uid()));

-- Desafios e recompensas --------------------------------------------
CREATE TABLE public.desafios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descricao text,
  tipo text NOT NULL DEFAULT 'manual' CHECK (tipo IN ('tarefas','simulado','manual')),
  meta numeric NOT NULL DEFAULT 1,
  pontos int NOT NULL DEFAULT 10 CHECK (pontos > 0),
  turma_id uuid REFERENCES public.turmas(id) ON DELETE CASCADE,
  autor_id uuid,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.desafios TO authenticated;
GRANT ALL ON public.desafios TO service_role;
ALTER TABLE public.desafios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "desafios leitura" ON public.desafios FOR SELECT TO authenticated USING (turma_id IS NULL OR public.aluno_na_turma(turma_id) OR public.pode_gerir_questoes(auth.uid()));
CREATE POLICY "desafios gerir" ON public.desafios FOR ALL TO authenticated USING (public.pode_gerir_questoes(auth.uid())) WITH CHECK (public.pode_gerir_questoes(auth.uid()));

CREATE TABLE public.desafio_conclusoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  desafio_id uuid NOT NULL REFERENCES public.desafios(id) ON DELETE CASCADE,
  aluno_id uuid NOT NULL,
  pontos int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (desafio_id, aluno_id)
);
GRANT SELECT ON public.desafio_conclusoes TO authenticated;
GRANT ALL ON public.desafio_conclusoes TO service_role;
ALTER TABLE public.desafio_conclusoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conclusoes leitura" ON public.desafio_conclusoes FOR SELECT TO authenticated USING (aluno_id = auth.uid() OR public.pode_gerir_questoes(auth.uid()));

CREATE TABLE public.recompensas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descricao text,
  custo int NOT NULL CHECK (custo > 0),
  estoque int,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recompensas TO authenticated;
GRANT ALL ON public.recompensas TO service_role;
ALTER TABLE public.recompensas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recompensas leitura" ON public.recompensas FOR SELECT TO authenticated USING (true);
CREATE POLICY "recompensas gerir" ON public.recompensas FOR ALL TO authenticated USING (public.is_gestao(auth.uid())) WITH CHECK (public.is_gestao(auth.uid()));

CREATE TABLE public.resgates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recompensa_id uuid NOT NULL REFERENCES public.recompensas(id) ON DELETE CASCADE,
  aluno_id uuid NOT NULL,
  custo int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.resgates TO authenticated;
GRANT ALL ON public.resgates TO service_role;
ALTER TABLE public.resgates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "resgates leitura" ON public.resgates FOR SELECT TO authenticated USING (aluno_id = auth.uid() OR public.is_gestao(auth.uid()));

CREATE OR REPLACE FUNCTION public.saldo_pontos(_aluno uuid) RETURNS int LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT (coalesce((SELECT sum(pontos) FROM desafio_conclusoes WHERE aluno_id=_aluno),0)
        - coalesce((SELECT sum(custo) FROM resgates WHERE aluno_id=_aluno),0))::int $$;

CREATE OR REPLACE FUNCTION public.progresso_desafio(_desafio uuid, _aluno uuid) RETURNS numeric
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE d desafios;
BEGIN
  SELECT * INTO d FROM desafios WHERE id=_desafio;
  IF d.tipo = 'tarefas' THEN
    RETURN (SELECT count(*) FROM entregas WHERE aluno_id=_aluno AND status='concluida');
  ELSIF d.tipo = 'simulado' THEN
    RETURN coalesce((SELECT max(nota) FROM tentativas WHERE aluno_id=_aluno),0);
  END IF;
  RETURN 0;
END $$;

CREATE OR REPLACE FUNCTION public.resgatar_desafio(_desafio uuid) RETURNS int
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE d desafios;
BEGIN
  SELECT * INTO d FROM desafios WHERE id=_desafio AND ativo;
  IF d.id IS NULL THEN RAISE EXCEPTION 'Desafio indisponível'; END IF;
  IF d.turma_id IS NOT NULL AND NOT aluno_na_turma(d.turma_id) THEN RAISE EXCEPTION 'Desafio de outra turma'; END IF;
  IF d.tipo = 'manual' THEN RAISE EXCEPTION 'Este desafio é concedido pelo professor'; END IF;
  IF progresso_desafio(_desafio, auth.uid()) < d.meta THEN RAISE EXCEPTION 'Meta ainda não atingida'; END IF;
  INSERT INTO desafio_conclusoes(desafio_id, aluno_id, pontos) VALUES (_desafio, auth.uid(), d.pontos);
  INSERT INTO notificacoes(user_id, titulo) VALUES (auth.uid(), 'Desafio concluído: +' || d.pontos || ' pontos');
  RETURN d.pontos;
END $$;

CREATE OR REPLACE FUNCTION public.conceder_desafio(_desafio uuid, _aluno uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE d desafios;
BEGIN
  IF NOT pode_gerir_questoes(auth.uid()) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  SELECT * INTO d FROM desafios WHERE id=_desafio;
  INSERT INTO desafio_conclusoes(desafio_id, aluno_id, pontos) VALUES (_desafio, _aluno, d.pontos) ON CONFLICT DO NOTHING;
  INSERT INTO notificacoes(user_id, titulo) VALUES (_aluno, 'Você ganhou ' || d.pontos || ' pontos: ' || d.titulo);
END $$;

CREATE OR REPLACE FUNCTION public.trocar_recompensa(_recompensa uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r recompensas;
BEGIN
  SELECT * INTO r FROM recompensas WHERE id=_recompensa AND ativo FOR UPDATE;
  IF r.id IS NULL THEN RAISE EXCEPTION 'Recompensa indisponível'; END IF;
  IF r.estoque IS NOT NULL AND r.estoque <= 0 THEN RAISE EXCEPTION 'Esgotada'; END IF;
  IF saldo_pontos(auth.uid()) < r.custo THEN RAISE EXCEPTION 'Pontos insuficientes'; END IF;
  INSERT INTO resgates(recompensa_id, aluno_id, custo) VALUES (_recompensa, auth.uid(), r.custo);
  IF r.estoque IS NOT NULL THEN UPDATE recompensas SET estoque = estoque - 1 WHERE id=_recompensa; END IF;
END $$;

CREATE OR REPLACE FUNCTION public.ranking_turma(_turma uuid) RETURNS TABLE(aluno_id uuid, nome text, pontos int)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT (aluno_na_turma(_turma) OR prof_da_turma(_turma) OR is_gestao(auth.uid())) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  RETURN QUERY SELECT m.aluno_id, split_part(p.nome,' ',1), saldo_pontos(m.aluno_id) + coalesce((SELECT sum(custo) FROM resgates r WHERE r.aluno_id=m.aluno_id),0)::int
    FROM matriculas m JOIN profiles p ON p.id=m.aluno_id WHERE m.turma_id=_turma AND m.status='ativa' ORDER BY 3 DESC LIMIT 20;
END $$;
GRANT EXECUTE ON FUNCTION public.saldo_pontos(uuid), public.progresso_desafio(uuid,uuid), public.resgatar_desafio(uuid), public.conceder_desafio(uuid,uuid), public.trocar_recompensa(uuid), public.ranking_turma(uuid) TO authenticated;

-- Comunicados --------------------------------------------------------
CREATE TABLE public.comunicados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  corpo text NOT NULL,
  destino text NOT NULL DEFAULT 'escola' CHECK (destino IN ('escola','turma','perfil')),
  turma_id uuid REFERENCES public.turmas(id) ON DELETE CASCADE,
  perfil_destino text CHECK (perfil_destino IN ('aluno','professor','gestao')),
  autor_id uuid NOT NULL DEFAULT auth.uid(),
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aprovado','rejeitado')),
  motivo text,
  aprovado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  publicado_em timestamptz
);
GRANT SELECT, INSERT, DELETE ON public.comunicados TO authenticated;
GRANT ALL ON public.comunicados TO service_role;
ALTER TABLE public.comunicados ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.comunicado_para_mim(c public.comunicados) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT c.status='aprovado' AND (
    c.destino='escola'
    OR (c.destino='turma' AND (aluno_na_turma(c.turma_id) OR prof_da_turma(c.turma_id)))
    OR (c.destino='perfil' AND (
         (c.perfil_destino='aluno' AND has_role(auth.uid(),'aluno'))
      OR (c.perfil_destino='professor' AND has_role(auth.uid(),'professor'))
      OR (c.perfil_destino='gestao' AND is_gestao(auth.uid())))))
$$;
CREATE POLICY "comunicados leitura" ON public.comunicados FOR SELECT TO authenticated
  USING (autor_id = auth.uid() OR public.is_gestao(auth.uid()) OR public.comunicado_para_mim(comunicados));
CREATE POLICY "comunicados envio" ON public.comunicados FOR INSERT TO authenticated
  WITH CHECK (autor_id = auth.uid() AND public.pode_gerir_questoes(auth.uid())
    AND (destino <> 'turma' OR public.prof_da_turma(turma_id) OR public.is_gestao(auth.uid())));
CREATE POLICY "comunicados apagar" ON public.comunicados FOR DELETE TO authenticated
  USING ((autor_id = auth.uid() AND status <> 'aprovado') OR public.is_gestao(auth.uid()));

CREATE OR REPLACE FUNCTION public.notificar_comunicado(_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c comunicados;
BEGIN
  SELECT * INTO c FROM comunicados WHERE id=_id;
  INSERT INTO notificacoes(user_id, titulo)
  SELECT DISTINCT u, 'Comunicado: ' || c.titulo FROM (
    SELECT id AS u FROM profiles WHERE c.destino='escola'
    UNION SELECT aluno_id FROM matriculas WHERE c.destino='turma' AND turma_id=c.turma_id AND status='ativa'
    UNION SELECT professor_id FROM turma_disciplinas WHERE c.destino='turma' AND turma_id=c.turma_id AND professor_id IS NOT NULL
    UNION SELECT user_id FROM user_roles WHERE c.destino='perfil' AND (
         (c.perfil_destino='aluno' AND role='aluno') OR (c.perfil_destino='professor' AND role='professor')
      OR (c.perfil_destino='gestao' AND role IN ('secretaria','coordenacao','vice_diretor','diretor','admin')))
  ) x WHERE u IS NOT NULL AND u <> c.autor_id;
END $$;

-- Gestão publica direto; professor fica pendente de aprovação
CREATE OR REPLACE FUNCTION public.comunicados_status() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  NEW.autor_id := auth.uid();
  IF is_gestao(auth.uid()) THEN
    NEW.status := 'aprovado'; NEW.aprovado_por := auth.uid(); NEW.publicado_em := now();
  ELSE
    NEW.status := 'pendente'; NEW.aprovado_por := NULL; NEW.publicado_em := NULL;
    INSERT INTO notificacoes(user_id, titulo)
      SELECT user_id, 'Comunicado aguardando aprovação: ' || NEW.titulo FROM user_roles WHERE role IN ('secretaria','coordenacao','diretor');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_comunicados_status BEFORE INSERT ON public.comunicados FOR EACH ROW EXECUTE FUNCTION public.comunicados_status();
CREATE OR REPLACE FUNCTION public.comunicados_pos() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN IF NEW.status='aprovado' THEN PERFORM notificar_comunicado(NEW.id); END IF; RETURN NEW; END $$;
CREATE TRIGGER trg_comunicados_pos AFTER INSERT ON public.comunicados FOR EACH ROW EXECUTE FUNCTION public.comunicados_pos();

CREATE OR REPLACE FUNCTION public.avaliar_comunicado(_id uuid, _aprovar boolean, _motivo text DEFAULT NULL) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c comunicados;
BEGIN
  IF NOT is_gestao(auth.uid()) THEN RAISE EXCEPTION 'Apenas a secretaria/gestão aprova comunicados'; END IF;
  SELECT * INTO c FROM comunicados WHERE id=_id AND status='pendente';
  IF c.id IS NULL THEN RAISE EXCEPTION 'Comunicado não está pendente'; END IF;
  UPDATE comunicados SET status = CASE WHEN _aprovar THEN 'aprovado' ELSE 'rejeitado' END,
    motivo = _motivo, aprovado_por = auth.uid(), publicado_em = CASE WHEN _aprovar THEN now() END WHERE id=_id;
  INSERT INTO notificacoes(user_id, titulo) VALUES (c.autor_id,
    CASE WHEN _aprovar THEN 'Seu comunicado foi aprovado: ' ELSE 'Seu comunicado foi rejeitado: ' END || c.titulo);
  IF _aprovar THEN PERFORM notificar_comunicado(_id); END IF;
  INSERT INTO auditoria(user_id, acao, entidade, entidade_id, detalhes)
    VALUES (auth.uid(), CASE WHEN _aprovar THEN 'APROVAR' ELSE 'REJEITAR' END, 'comunicados', _id, jsonb_build_object('motivo', _motivo));
END $$;
GRANT EXECUTE ON FUNCTION public.avaliar_comunicado(uuid, boolean, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.notificar_comunicado(uuid) FROM PUBLIC, anon, authenticated;

-- Questões por disciplina --------------------------------------------
ALTER TABLE public.questoes ADD COLUMN disciplina_id uuid REFERENCES public.disciplinas(id) ON DELETE SET NULL;