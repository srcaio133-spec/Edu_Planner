CREATE TABLE public.conteudos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  disciplina_id uuid NOT NULL REFERENCES public.disciplinas(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  ordem int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (disciplina_id, titulo)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conteudos TO authenticated;
GRANT ALL ON public.conteudos TO service_role;
ALTER TABLE public.conteudos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conteudos leitura" ON public.conteudos FOR SELECT TO authenticated USING (true);
CREATE POLICY "conteudos gerir" ON public.conteudos FOR ALL TO authenticated USING (public.pode_gerir_questoes(auth.uid())) WITH CHECK (public.pode_gerir_questoes(auth.uid()));

ALTER TABLE public.questoes ADD COLUMN conteudo_id uuid REFERENCES public.conteudos(id) ON DELETE SET NULL;
ALTER TABLE public.questoes ADD COLUMN status text NOT NULL DEFAULT 'aprovada' CHECK (status IN ('aprovada','em_revisao'));
ALTER TABLE public.questoes ADD COLUMN figura jsonb;
ALTER TABLE public.provas ADD COLUMN conteudo_id uuid REFERENCES public.conteudos(id) ON DELETE SET NULL;
ALTER TABLE public.tarefas ADD COLUMN conteudo_id uuid REFERENCES public.conteudos(id) ON DELETE SET NULL;

-- Alunos só veem questões aprovadas; quem gerencia vê também as em revisão
DROP POLICY "questoes leitura" ON public.questoes;
CREATE POLICY "questoes leitura" ON public.questoes FOR SELECT TO authenticated USING (status = 'aprovada' OR public.pode_gerir_questoes(auth.uid()));

-- Desempenho do aluno por conteúdo nos simulados
CREATE OR REPLACE FUNCTION public.desempenho_por_conteudo(_aluno uuid) RETURNS TABLE(disciplina text, conteudo text, acertos int, total int)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF _aluno <> auth.uid() AND NOT pode_gerir_questoes(auth.uid()) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  RETURN QUERY
  SELECT d.nome, c.titulo,
         count(*) FILTER (WHERE (t.respostas->>q.id::text)::int = g.correta)::int, count(*)::int
    FROM tentativas t
    JOIN simulado_questoes sq ON sq.simulado_id = t.simulado_id
    JOIN questoes q ON q.id = sq.questao_id
    JOIN questoes_gabarito g ON g.questao_id = q.id
    LEFT JOIN conteudos c ON c.id = q.conteudo_id
    LEFT JOIN disciplinas d ON d.id = q.disciplina_id
   WHERE t.aluno_id = _aluno
   GROUP BY d.nome, c.titulo;
END $$;
GRANT EXECUTE ON FUNCTION public.desempenho_por_conteudo(uuid) TO authenticated;