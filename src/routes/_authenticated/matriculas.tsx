import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useTurmasDisciplinas } from "@/lib/dados";

export const Route = createFileRoute("/_authenticated/matriculas")({
  head: () => ({
    meta: [
      { title: "Matrículas — EduPlanner" },
      { name: "description", content: "Matricule, transfira e tranque alunos nas turmas." },
      { property: "og:title", content: "Matrículas — EduPlanner" },
      { property: "og:description", content: "Gestão de matrículas escolares." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Matriculas,
});

const sel = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

function Matriculas() {
  const qc = useQueryClient();
  const { data: base } = useTurmasDisciplinas();
  const [f, setF] = useState({ aluno_id: "", turma_id: "" });
  const { data, isLoading } = useQuery({
    queryKey: ["matriculas"],
    queryFn: async () => {
      const [m, alunos] = await Promise.all([
        supabase.from("matriculas").select("id,aluno_id,turma_id,status,created_at,turmas(nome)").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id").eq("role", "aluno"),
      ]);
      const ids = [...new Set([...(alunos.data ?? []).map((a) => a.user_id), ...(m.data ?? []).map((x) => x.aluno_id)])];
      const perf = ids.length ? (await supabase.from("profiles").select("id,nome,email").in("id", ids)).data ?? [] : [];
      const nomes = new Map(perf.map((p) => [p.id, p]));
      const alunoIds = new Set((alunos.data ?? []).map((a) => a.user_id));
      return { matriculas: m.data ?? [], nomes, alunos: perf.filter((p) => alunoIds.has(p.id)).sort((a, b) => a.nome.localeCompare(b.nome)) };
    },
  });
  const recarregar = () => { qc.invalidateQueries({ queryKey: ["matriculas"] }); qc.invalidateQueries({ queryKey: ["painel"] }); };

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    if (!f.aluno_id || !f.turma_id) { toast.error("Escolha o aluno e a turma."); return; }
    if (data?.matriculas.some((m) => m.aluno_id === f.aluno_id && m.status === "ativa")) {
      toast.error("Este aluno já tem matrícula ativa. Use “Transferir”."); return;
    }
    const { error } = await supabase.from("matriculas").insert(f);
    if (error) { toast.error(error.message); return; }
    toast.success("Matrícula criada"); setF({ aluno_id: "", turma_id: "" }); recarregar();
  }
  async function status(id: string, s: string) {
    const { error } = await supabase.from("matriculas").update({ status: s }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    recarregar();
  }
  async function transferir(id: string, turma_id: string) {
    const { error } = await supabase.from("matriculas").update({ turma_id }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Aluno transferido"); recarregar();
  }

  return (
    <>
      <h1 className="text-3xl font-extrabold">Matrículas</h1>
      <p className="mt-1 text-muted-foreground">{data?.matriculas.filter((m) => m.status === "ativa").length ?? 0} matrículas ativas. O aluno passa a ver as disciplinas, tarefas e provas da turma.</p>
      <form onSubmit={criar} className="mt-4 grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-card sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div><Label htmlFor="m-aluno">Aluno</Label><select id="m-aluno" className={sel} value={f.aluno_id} onChange={(e) => setF({ ...f, aluno_id: e.target.value })}><option value="">Selecione</option>{data?.alunos.map((a) => <option key={a.id} value={a.id}>{a.nome || a.email}</option>)}</select></div>
        <div><Label htmlFor="m-turma">Turma</Label><select id="m-turma" className={sel} value={f.turma_id} onChange={(e) => setF({ ...f, turma_id: e.target.value })}><option value="">Selecione</option>{base?.turmas.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}</select></div>
        <Button type="submit" className="rounded-xl">Matricular</Button>
      </form>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left"><tr><th className="p-3">Aluno</th><th className="p-3">Turma</th><th className="p-3">Situação</th><th className="p-3">Ações</th></tr></thead>
          <tbody>
            {isLoading && <tr><td colSpan={4} className="p-3"><Skeleton className="h-8" /></td></tr>}
            {data?.matriculas.map((m) => (
              <tr key={m.id} className="border-t border-border">
                <td className="p-3 font-medium">{data.nomes.get(m.aluno_id)?.nome || "Aluno"}</td>
                <td className="p-3">
                  <select aria-label="Transferir de turma" className="h-9 rounded-md border border-input bg-background px-2" value={m.turma_id} onChange={(e) => transferir(m.id, e.target.value)}>
                    {base?.turmas.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                  </select>
                </td>
                <td className={`p-3 font-semibold ${m.status === "ativa" ? "text-success" : "text-warning"}`}>{m.status === "ativa" ? "Ativa" : "Trancada"}</td>
                <td className="p-3">
                  {m.status === "ativa"
                    ? <Button size="sm" variant="outline" onClick={() => status(m.id, "trancada")}>Trancar</Button>
                    : <Button size="sm" variant="outline" onClick={() => status(m.id, "ativa")}>Reativar</Button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
