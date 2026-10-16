import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mediaPonderada } from "@/lib/perfil";
import { fmtNota, usePerfil } from "@/lib/dados";

export const Route = createFileRoute("/_authenticated/notas")({
  head: () => ({
    meta: [
      { title: "Notas — EduPlanner" },
      { name: "description", content: "Boletim com médias ponderadas por disciplina." },
      { property: "og:title", content: "Notas — EduPlanner" },
      { property: "og:description", content: "Boletim escolar no EduPlanner." },
    ],
  }),
  component: Notas,
});

function Notas() {
  const { user } = Route.useRouteContext();
  const { data: p } = usePerfil(user.id);
  const aluno = p?.perfil === "aluno";
  const { data } = useQuery({
    queryKey: ["notas", user.id, aluno],
    enabled: !!p,
    queryFn: async () => {
      let q = supabase.from("notas").select("aluno_id,valor,provas(titulo,peso,disciplinas(nome))");
      if (aluno) q = q.eq("aluno_id", user.id);
      const notas = (await q).data ?? [];
      const ids = [...new Set(notas.map((n) => n.aluno_id))];
      const nomes = new Map(((ids.length && !aluno ? (await supabase.from("profiles").select("id,nome").in("id", ids)).data : []) ?? []).map((x) => [x.id, x.nome]));
      const grupos = new Map<string, { aluno: string; disciplina: string; itens: { titulo: string; valor: number; peso: number }[] }>();
      for (const n of notas) {
        const disc = n.provas?.disciplinas?.nome ?? "—";
        const k = `${n.aluno_id}|${disc}`;
        if (!grupos.has(k)) grupos.set(k, { aluno: nomes.get(n.aluno_id) || "", disciplina: disc, itens: [] });
        grupos.get(k)!.itens.push({ titulo: n.provas?.titulo ?? "", valor: Number(n.valor), peso: Number(n.provas?.peso ?? 1) });
      }
      return [...grupos.values()].sort((a, b) => (a.aluno + a.disciplina).localeCompare(b.aluno + b.disciplina));
    },
  });
  const geral = mediaPonderada((data ?? []).flatMap((g) => g.itens));
  return (
    <>
      <h1 className="text-3xl font-extrabold">{aluno ? "Meu boletim" : "Notas lançadas"}</h1>
      {aluno && <p className="mt-1 text-muted-foreground">Média geral: <strong className="text-foreground">{fmtNota(geral)}</strong></p>}
      <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left"><tr>{!aluno && <th className="p-3">Aluno</th>}<th className="p-3">Disciplina</th><th className="p-3">Avaliações</th><th className="p-3 text-right">Média</th></tr></thead>
          <tbody>
            {(data ?? []).map((g) => {
              const m = mediaPonderada(g.itens);
              return (
                <tr key={g.aluno + g.disciplina} className="border-t border-border">
                  {!aluno && <td className="p-3">{g.aluno}</td>}
                  <td className="p-3 font-medium">{g.disciplina}</td>
                  <td className="p-3 text-muted-foreground">{g.itens.map((i) => `${i.titulo}: ${fmtNota(i.valor)}`).join(" · ")}</td>
                  <td className={`p-3 text-right font-bold ${m != null && m < 6 ? "text-destructive" : "text-success"}`}>{fmtNota(m)}</td>
                </tr>
              );
            })}
            {data && data.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Nenhuma nota lançada ainda.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
