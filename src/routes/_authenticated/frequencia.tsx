import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePerfil } from "@/lib/dados";

export const Route = createFileRoute("/_authenticated/frequencia")({
  head: () => ({
    meta: [
      { title: "Chamada — EduPlanner" },
      { name: "description", content: "Registre a frequência dos alunos por aula." },
      { property: "og:title", content: "Chamada — EduPlanner" },
      { property: "og:description", content: "Frequência escolar por turma e disciplina." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Frequencia,
});

const sel = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

function Frequencia() {
  const { user } = Route.useRouteContext();
  const { data: p } = usePerfil(user.id);
  const qc = useQueryClient();
  const [aula, setAula] = useState("");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [pres, setPres] = useState<Record<string, boolean>>({});

  const { data: aulas } = useQuery({
    queryKey: ["minhas-aulas", user.id, p?.perfil],
    enabled: !!p,
    queryFn: async () => {
      let q = supabase.from("turma_disciplinas").select("turma_id,disciplina_id,turmas(nome),disciplinas(nome)");
      if (p?.perfil === "professor") q = q.eq("professor_id", user.id);
      return (await q).data ?? [];
    },
  });
  const [turma_id, disciplina_id] = aula.split("|");
  const { data: alunos } = useQuery({
    queryKey: ["chamada", aula, data],
    enabled: !!aula,
    queryFn: async () => {
      const m = (await supabase.from("matriculas").select("aluno_id").eq("turma_id", turma_id!).eq("status", "ativa")).data ?? [];
      const ids = m.map((x) => x.aluno_id);
      if (!ids.length) return [];
      const [perf, f] = await Promise.all([
        supabase.from("profiles").select("id,nome").in("id", ids),
        supabase.from("frequencias").select("aluno_id,presente").eq("turma_id", turma_id!).eq("disciplina_id", disciplina_id!).eq("data", data),
      ]);
      return ids.map((id) => ({ id, nome: perf.data?.find((x) => x.id === id)?.nome || "Aluno", presente: f.data?.find((x) => x.aluno_id === id)?.presente ?? true }));
    },
  });
  useEffect(() => { setPres(Object.fromEntries((alunos ?? []).map((a) => [a.id, a.presente]))); }, [alunos]);

  async function salvar() {
    const rows = (alunos ?? []).map((a) => ({ turma_id: turma_id!, disciplina_id: disciplina_id!, aluno_id: a.id, data, presente: pres[a.id] ?? true }));
    const { error } = await supabase.from("frequencias").upsert(rows, { onConflict: "turma_id,disciplina_id,aluno_id,data" });
    if (error) { toast.error(error.message); return; }
    toast.success("Chamada salva");
    qc.invalidateQueries({ queryKey: ["desempenho"] });
  }

  return (
    <>
      <h1 className="text-3xl font-extrabold">Chamada</h1>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div><Label htmlFor="f-aula">Turma e disciplina</Label>
          <select id="f-aula" className={sel} value={aula} onChange={(e) => setAula(e.target.value)}>
            <option value="">Selecione</option>
            {aulas?.map((a) => <option key={a.turma_id + a.disciplina_id} value={`${a.turma_id}|${a.disciplina_id}`}>{a.turmas?.nome} · {a.disciplinas?.nome}</option>)}
          </select>
        </div>
        <div><Label htmlFor="f-data">Data da aula</Label><Input id="f-data" type="date" value={data} onChange={(e) => setData(e.target.value)} /></div>
      </div>
      {aulas && aulas.length === 0 && <p className="mt-4 text-sm text-muted-foreground">Você ainda não está vinculado a nenhuma turma/disciplina. A gestão faz isso em Turmas.</p>}
      {aula && (
        <div className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-card">
          {alunos?.length === 0 && <p className="text-sm text-muted-foreground">Nenhum aluno matriculado.</p>}
          {alunos?.map((a) => (
            <label key={a.id} className="flex items-center justify-between border-b border-border py-2 text-sm last:border-0">
              <span>{a.nome}</span>
              <span className="flex items-center gap-2">
                <span className={pres[a.id] ? "text-success" : "text-destructive"}>{pres[a.id] ? "Presente" : "Falta"}</span>
                <input type="checkbox" className="size-5" checked={pres[a.id] ?? true} onChange={(e) => setPres({ ...pres, [a.id]: e.target.checked })} aria-label={`Presença de ${a.nome}`} />
              </span>
            </label>
          ))}
          {!!alunos?.length && <Button className="mt-3 rounded-xl" onClick={salvar}>Salvar chamada</Button>}
        </div>
      )}
    </>
  );
}
