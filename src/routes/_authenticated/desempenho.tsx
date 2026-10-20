import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtNota, useTurmasDisciplinas } from "@/lib/dados";
import { mediaPonderada, statusTarefa } from "@/lib/perfil";
import { emAlerta, percentualFrequencia } from "@/lib/regras";

export const Route = createFileRoute("/_authenticated/desempenho")({
  head: () => ({
    meta: [
      { title: "Desempenho por turma — EduPlanner" },
      { name: "description", content: "Notas, frequência e tarefas de cada aluno por turma." },
      { property: "og:title", content: "Desempenho por turma — EduPlanner" },
      { property: "og:description", content: "Acompanhamento da direção por classe." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Desempenho,
});

function Desempenho() {
  const { data: base } = useTurmasDisciplinas();
  const [turma, setTurma] = useState("");
  const turmaId = turma || base?.turmas[0]?.id || "";
  const { data, isLoading } = useQuery({
    queryKey: ["desempenho", turmaId],
    enabled: !!turmaId,
    queryFn: async () => {
      const m = (await supabase.from("matriculas").select("aluno_id").eq("turma_id", turmaId).eq("status", "ativa")).data ?? [];
      const ids = m.map((x) => x.aluno_id);
      if (!ids.length) return [];
      const [perf, provas, tarefas, freq] = await Promise.all([
        supabase.from("profiles").select("id,nome").in("id", ids),
        supabase.from("provas").select("id,peso,notas(aluno_id,valor)").eq("turma_id", turmaId),
        supabase.from("tarefas").select("id,prazo,entregas(aluno_id,status)").eq("turma_id", turmaId),
        supabase.from("frequencias").select("aluno_id,presente").eq("turma_id", turmaId),
      ]);
      const agora = new Date();
      return ids.map((id) => {
        const notas = (provas.data ?? []).flatMap((p) => p.notas.filter((n) => n.aluno_id === id).map((n) => ({ valor: Number(n.valor), peso: Number(p.peso) })));
        const st = (tarefas.data ?? []).map((t) => statusTarefa(new Date(t.prazo), t.entregas.find((e) => e.aluno_id === id)?.status, agora));
        const media = mediaPonderada(notas);
        const f = percentualFrequencia((freq.data ?? []).filter((x) => x.aluno_id === id));
        return {
          id, nome: perf.data?.find((p) => p.id === id)?.nome || "Aluno", media, freq: f,
          concluidas: st.filter((s) => s === "concluida").length, atrasadas: st.filter((s) => s === "atrasada").length, total: st.length,
          alerta: emAlerta(media, f),
        };
      }).sort((a, b) => a.nome.localeCompare(b.nome));
    },
  });
  const medias = (data ?? []).map((a) => a.media).filter((x): x is number => x != null);
  const freqs = (data ?? []).map((a) => a.freq).filter((x): x is number => x != null);
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
  const resumo = [
    { t: "Alunos", v: String(data?.length ?? 0) },
    { t: "Média da turma", v: fmtNota(avg(medias)) },
    { t: "Frequência média", v: freqs.length ? `${avg(freqs)!.toFixed(1).replace(".", ",")}%` : "—" },
    { t: "Alunos em alerta", v: String((data ?? []).filter((a) => a.alerta).length) },
  ];
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold">Desempenho por turma</h1>
        <select aria-label="Turma" className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={turmaId} onChange={(e) => setTurma(e.target.value)}>
          {base?.turmas.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
        </select>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        {resumo.map((r) => (
          <div key={r.t} className="rounded-2xl border border-border bg-card p-4 shadow-card"><div className="text-sm text-muted-foreground">{r.t}</div><div className="text-2xl font-extrabold">{isLoading ? <Skeleton className="h-8 w-12" /> : r.v}</div></div>
        ))}
      </div>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left"><tr><th className="p-3">Aluno</th><th className="p-3 text-right">Média</th><th className="p-3 text-right">Frequência</th><th className="p-3 text-right">Tarefas concluídas</th><th className="p-3 text-right">Atrasadas</th></tr></thead>
          <tbody>
            {data?.map((a) => (
              <tr key={a.id} className={`border-t border-border ${a.alerta ? "bg-danger-soft" : ""}`}>
                <td className="p-3 font-medium">{a.alerta && <AlertTriangle className="mr-1 inline size-4 text-destructive" aria-label="Em alerta" />}{a.nome}</td>
                <td className={`p-3 text-right font-bold ${a.media != null && a.media < 6 ? "text-destructive" : ""}`}>{fmtNota(a.media)}</td>
                <td className={`p-3 text-right ${a.freq != null && a.freq < 75 ? "font-bold text-destructive" : ""}`}>{a.freq == null ? "—" : `${String(a.freq).replace(".", ",")}%`}</td>
                <td className="p-3 text-right">{a.concluidas}/{a.total}</td>
                <td className={`p-3 text-right ${a.atrasadas ? "text-destructive" : ""}`}>{a.atrasadas}</td>
              </tr>
            ))}
            {data && data.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Nenhum aluno matriculado nesta turma.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Em vermelho: média abaixo de 6 ou frequência abaixo de 75%.</p>
    </>
  );
}
