CREATE TYPE public.categoria_exame AS ENUM ('enem','ssa','vestibular','concurso');
ALTER TABLE public.tarefas ADD COLUMN categoria public.categoria_exame;

CREATE TABLE public.edumind_mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  parts jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.edumind_mensagens TO authenticated;
GRANT ALL ON public.edumind_mensagens TO service_role;
ALTER TABLE public.edumind_mensagens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "edumind proprio" ON public.edumind_mensagens FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX ON public.edumind_mensagens(user_id, created_at);

CREATE OR REPLACE FUNCTION public.pode_gerir_questoes(_u uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.is_gestao(_u) OR public.has_role(_u,'professor') $$;

CREATE TABLE public.questoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria public.categoria_exame NOT NULL,
  area text NOT NULL,
  enunciado text NOT NULL,
  alternativas jsonb NOT NULL,
  autor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.questoes TO authenticated;
GRANT ALL ON public.questoes TO service_role;
ALTER TABLE public.questoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questoes leitura" ON public.questoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "questoes gerir" ON public.questoes FOR ALL TO authenticated USING (public.pode_gerir_questoes(auth.uid())) WITH CHECK (public.pode_gerir_questoes(auth.uid()));

CREATE TABLE public.questoes_gabarito (
  questao_id uuid PRIMARY KEY REFERENCES public.questoes(id) ON DELETE CASCADE,
  correta int NOT NULL CHECK (correta BETWEEN 0 AND 4),
  explicacao text NOT NULL DEFAULT ''
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.questoes_gabarito TO authenticated;
GRANT ALL ON public.questoes_gabarito TO service_role;
ALTER TABLE public.questoes_gabarito ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gabarito gerir" ON public.questoes_gabarito FOR ALL TO authenticated USING (public.pode_gerir_questoes(auth.uid())) WITH CHECK (public.pode_gerir_questoes(auth.uid()));

CREATE TABLE public.simulados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  categoria public.categoria_exame NOT NULL,
  duracao_min int NOT NULL DEFAULT 30,
  autor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.simulados TO authenticated;
GRANT ALL ON public.simulados TO service_role;
ALTER TABLE public.simulados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "simulados leitura" ON public.simulados FOR SELECT TO authenticated USING (true);
CREATE POLICY "simulados gerir" ON public.simulados FOR ALL TO authenticated USING (public.pode_gerir_questoes(auth.uid())) WITH CHECK (public.pode_gerir_questoes(auth.uid()));

CREATE TABLE public.simulado_questoes (
  simulado_id uuid NOT NULL REFERENCES public.simulados(id) ON DELETE CASCADE,
  questao_id uuid NOT NULL REFERENCES public.questoes(id) ON DELETE CASCADE,
  ordem int NOT NULL DEFAULT 0,
  PRIMARY KEY (simulado_id, questao_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.simulado_questoes TO authenticated;
GRANT ALL ON public.simulado_questoes TO service_role;
ALTER TABLE public.simulado_questoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sq leitura" ON public.simulado_questoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "sq gerir" ON public.simulado_questoes FOR ALL TO authenticated USING (public.pode_gerir_questoes(auth.uid())) WITH CHECK (public.pode_gerir_questoes(auth.uid()));

CREATE TABLE public.tentativas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  simulado_id uuid NOT NULL REFERENCES public.simulados(id) ON DELETE CASCADE,
  aluno_id uuid NOT NULL,
  respostas jsonb NOT NULL,
  acertos int NOT NULL,
  total int NOT NULL,
  nota numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tentativas TO authenticated;
GRANT ALL ON public.tentativas TO service_role;
ALTER TABLE public.tentativas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tentativas leitura" ON public.tentativas FOR SELECT TO authenticated USING (aluno_id = auth.uid() OR public.pode_gerir_questoes(auth.uid()));

-- Corrige no servidor e devolve gabarito + explicações apenas após o envio
CREATE OR REPLACE FUNCTION public.enviar_tentativa(_simulado uuid, _respostas jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _total int; _acertos int; _nota numeric; _id uuid; _res jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT count(*), count(*) FILTER (WHERE (_respostas->>sq.questao_id::text)::int = g.correta)
    INTO _total, _acertos
    FROM simulado_questoes sq JOIN questoes_gabarito g ON g.questao_id = sq.questao_id
   WHERE sq.simulado_id = _simulado;
  IF _total = 0 THEN RAISE EXCEPTION 'simulado vazio'; END IF;
  _nota := round(_acertos::numeric * 10 / _total, 1);
  INSERT INTO tentativas(simulado_id, aluno_id, respostas, acertos, total, nota)
    VALUES (_simulado, auth.uid(), _respostas, _acertos, _total, _nota) RETURNING id INTO _id;
  SELECT jsonb_object_agg(sq.questao_id, jsonb_build_object('correta', g.correta, 'explicacao', g.explicacao))
    INTO _res FROM simulado_questoes sq JOIN questoes_gabarito g ON g.questao_id = sq.questao_id
   WHERE sq.simulado_id = _simulado;
  RETURN jsonb_build_object('id', _id, 'acertos', _acertos, 'total', _total, 'nota', _nota, 'gabarito', _res);
END $$;
GRANT EXECUTE ON FUNCTION public.enviar_tentativa(uuid, jsonb) TO authenticated;

-- Dados de exemplo (questões autorais no estilo de cada prova)
DO $$
DECLARE s uuid; q uuid; i int := 0; r record;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('enem','Matemática','Uma loja oferece 20% de desconto em um produto de R$ 150,00 e, depois, mais 10% sobre o novo valor. Qual o preço final?','["R$ 105,00","R$ 108,00","R$ 112,50","R$ 115,00","R$ 120,00"]',1,'150 × 0,8 = 120; 120 × 0,9 = 108. Descontos sucessivos não se somam (não é 30%).'),
    ('enem','Linguagens','Na frase "O projeto foi aprovado, mas ainda faltam recursos", a conjunção "mas" estabelece relação de:','["adição","conclusão","oposição","explicação","condição"]',2,'"Mas" é conjunção adversativa: introduz ideia que contrasta com a anterior.'),
    ('enem','Ciências da Natureza','O processo pelo qual as plantas convertem energia luminosa em energia química é:','["respiração celular","fermentação","transpiração","fotossíntese","digestão"]',3,'Na fotossíntese, a luz é usada para produzir glicose a partir de CO₂ e água.'),
    ('ssa','História','A Revolução Pernambucana de 1817 teve como uma de suas principais características:','["defesa do absolutismo","proposta republicana e separatista","apoio à vinda da família real","luta pelo fim da Lei Áurea","aliança com Portugal"]',1,'O movimento proclamou uma república em Pernambuco, contestando o domínio português.'),
    ('ssa','Geografia','O clima predominante no Sertão pernambucano é o:','["equatorial","temperado","semiárido","subtropical","tropical de altitude"]',2,'O Sertão tem chuvas escassas e irregulares: clima semiárido.'),
    ('ssa','Biologia','Organela responsável pela respiração celular nas células eucarióticas:','["ribossomo","lisossomo","complexo golgiense","mitocôndria","centríolo"]',3,'A mitocôndria realiza a respiração aeróbia, gerando ATP.'),
    ('vestibular','Física','Um carro percorre 120 km em 1h30min. Sua velocidade média é:','["60 km/h","70 km/h","80 km/h","90 km/h","100 km/h"]',2,'v = 120 / 1,5 = 80 km/h.'),
    ('vestibular','Química','O número de prótons de um átomo define seu:','["número de massa","número atômico","número de nêutrons","isótopo","período"]',1,'Número atômico (Z) = quantidade de prótons.'),
    ('vestibular','Matemática','Se 2x + 5 = 17, então x vale:','["5","6","7","8","11"]',1,'2x = 12 → x = 6.'),
    ('concurso','Português','Assinale a alternativa com a grafia correta:','["excessão","exceção","esceção","exseção","excesão"]',1,'A forma correta é "exceção".'),
    ('concurso','Raciocínio Lógico','A negação de "Todos os servidores são pontuais" é:','["Nenhum servidor é pontual","Todos os servidores são impontuais","Algum servidor não é pontual","Algum servidor é pontual","Nenhum servidor é impontual"]',2,'A negação de "todo A é B" é "algum A não é B".'),
    ('concurso','Direito Constitucional','Segundo a Constituição de 1988, são Poderes da União:','["Executivo, Legislativo e Judiciário","Executivo, Legislativo e Ministério Público","Legislativo, Judiciário e Tribunal de Contas","Executivo, Judiciário e Polícia Federal","Executivo e Legislativo apenas"]',0,'Art. 2º: Legislativo, Executivo e Judiciário, independentes e harmônicos.')
  ) AS t(cat,area,enun,alts,cor,expl) LOOP
    INSERT INTO questoes(categoria,area,enunciado,alternativas) VALUES (r.cat::categoria_exame, r.area, r.enun, r.alts::jsonb) RETURNING id INTO q;
    INSERT INTO questoes_gabarito VALUES (q, r.cor, r.expl);
  END LOOP;
  FOR r IN SELECT * FROM (VALUES ('enem','Simulado ENEM — Básico'),('ssa','Simulado SSA (UPE)'),('vestibular','Simulado Vestibular'),('concurso','Simulado Concursos')) AS t(cat,tit) LOOP
    INSERT INTO simulados(titulo,categoria,duracao_min) VALUES (r.tit, r.cat::categoria_exame, 15) RETURNING id INTO s;
    INSERT INTO simulado_questoes(simulado_id,questao_id,ordem)
      SELECT s, id, row_number() OVER (ORDER BY created_at) FROM questoes WHERE categoria = r.cat::categoria_exame;
  END LOOP;
END $$;