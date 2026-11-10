ALTER TABLE public.questoes DROP CONSTRAINT IF EXISTS questoes_status_check;
ALTER TABLE public.questoes ADD CONSTRAINT questoes_status_check CHECK (status IN ('aprovada','em_revisao','rejeitada'));
ALTER TABLE public.questoes ADD COLUMN IF NOT EXISTS motivo_rejeicao text, ADD COLUMN IF NOT EXISTS revisado_por uuid, ADD COLUMN IF NOT EXISTS revisado_em timestamptz;

CREATE OR REPLACE FUNCTION public.questoes_forca_revisao() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_gestao(auth.uid()) THEN
    NEW.status := 'em_revisao'; NEW.autor_id := auth.uid();
    NEW.motivo_rejeicao := NULL; NEW.revisado_por := NULL; NEW.revisado_em := NULL;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS questoes_forca_revisao ON public.questoes;
CREATE TRIGGER questoes_forca_revisao BEFORE INSERT ON public.questoes FOR EACH ROW EXECUTE FUNCTION public.questoes_forca_revisao();

DROP POLICY IF EXISTS "questoes gerir" ON public.questoes;
DROP POLICY IF EXISTS "questoes leitura" ON public.questoes;
CREATE POLICY "questoes leitura" ON public.questoes FOR SELECT TO authenticated
  USING (status = 'aprovada' OR public.is_gestao(auth.uid()) OR autor_id = auth.uid());
CREATE POLICY "questoes inserir" ON public.questoes FOR INSERT TO authenticated
  WITH CHECK (public.pode_gerir_questoes(auth.uid()));
CREATE POLICY "questoes gestao altera" ON public.questoes FOR UPDATE TO authenticated
  USING (public.is_gestao(auth.uid())) WITH CHECK (public.is_gestao(auth.uid()));
CREATE POLICY "questoes excluir" ON public.questoes FOR DELETE TO authenticated
  USING (public.is_gestao(auth.uid()) OR (autor_id = auth.uid() AND status <> 'aprovada'));

DROP POLICY IF EXISTS "sq gerir" ON public.simulado_questoes;
CREATE POLICY "sq gerir" ON public.simulado_questoes FOR ALL TO authenticated
  USING (public.is_gestao(auth.uid())) WITH CHECK (public.is_gestao(auth.uid()));

CREATE OR REPLACE FUNCTION public.avaliar_questao(_id uuid, _aprovar boolean, _motivo text, _simulado uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE q public.questoes%ROWTYPE;
BEGIN
  IF NOT public.is_gestao(auth.uid()) THEN RAISE EXCEPTION 'Apenas a gestão avalia questões'; END IF;
  SELECT * INTO q FROM public.questoes WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Questão não encontrada'; END IF;
  IF q.status <> 'em_revisao' THEN RAISE EXCEPTION 'Questão já avaliada'; END IF;
  IF NOT _aprovar AND coalesce(btrim(_motivo), '') = '' THEN RAISE EXCEPTION 'Informe o motivo da rejeição'; END IF;
  UPDATE public.questoes SET status = CASE WHEN _aprovar THEN 'aprovada' ELSE 'rejeitada' END,
    motivo_rejeicao = CASE WHEN _aprovar THEN NULL ELSE btrim(_motivo) END,
    revisado_por = auth.uid(), revisado_em = now() WHERE id = _id;
  IF _aprovar AND _simulado IS NOT NULL THEN
    INSERT INTO public.simulado_questoes (simulado_id, questao_id, ordem)
    VALUES (_simulado, _id, coalesce((SELECT max(ordem) + 1 FROM public.simulado_questoes WHERE simulado_id = _simulado), 1))
    ON CONFLICT DO NOTHING;
  END IF;
  IF q.autor_id IS NOT NULL AND q.autor_id <> auth.uid() THEN
    INSERT INTO public.notificacoes (user_id, titulo) VALUES (q.autor_id,
      CASE WHEN _aprovar THEN 'Sua questão foi aprovada e já está nos simulados'
           ELSE 'Sua questão foi rejeitada: ' || left(btrim(_motivo), 120) END);
  END IF;
  INSERT INTO public.auditoria (user_id, acao, entidade, entidade_id, detalhes)
  VALUES (auth.uid(), CASE WHEN _aprovar THEN 'questao_aprovada' ELSE 'questao_rejeitada' END, 'questoes', _id,
          jsonb_build_object('motivo', _motivo, 'simulado', _simulado));
END $$;
REVOKE ALL ON FUNCTION public.avaliar_questao(uuid, boolean, text, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.avaliar_questao(uuid, boolean, text, uuid) TO authenticated;