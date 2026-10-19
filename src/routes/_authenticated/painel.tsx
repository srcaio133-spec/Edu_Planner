import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, CalendarCheck, Clock, TrendingUp, School, Users, BookOpen, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { mediaPonderada, statusTarefa } from "@/lib/perfil";
import { fmtData, fmtNota, usePerfil } from "@/lib/dados";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Painel — EduPlanner" },
      { name: "description", content: "Seu resumo de tarefas, provas e notas." },
      { property: "og:title", content: "Painel — EduPlanner" },
      { property: "og:description", content: "Resumo escolar no EduPlanner." },
    ],
  }),
  component: Painel,
});

async function carregar(userId: string) {
  const [tarefas, entregas, provas, notas, turmas, matriculas, roles, tentativas] = await Promise.all([
    supabase.from("tarefas").select("id,titulo,prazo,disciplinas(nome)").order("prazo"),
    supabase.from("entregas").select("tarefa_id,aluno_id,status"),
    supabase.from("provas").select("id,titulo,data,peso,disciplinas(nome)").order("data"),
    supabase.from("notas").select("prova_id,valor").eq("aluno_id", userId),
    supabase.from("turmas").select("id", { count: "exact", head: true }),
    supabase.from("matriculas").select("aluno_id").eq("status", "ativa"),
    supabase.from("user_roles").select("user_id,role").eq("role", "professor"),
    supabase.from("tentativas").select("nota").eq("aluno_id", userId),
  ]);
  const notasSim = (tentativas.data ?? []).map((t) => Number(t.nota));
  const minhas = new Map((entregas.data ?? []).filter((e) => e.aluno_id === userId).map((e) => [e.tarefa_id, e.status]));
  const agora = new Date();
  const fimHoje = new Date(); fimHoje.setHours(23, 59, 59, 999);
  const em7 = new Date(agora.getTime() + 7 * 864e5);
  const ts = (tarefas.data ?? []).map((t) => ({ ...t, s: statusTarefa(new Date(t.prazo), minhas.get(t.id), agora) }));
  const pesos = new Map((provas.data ?? []).map((p) => [p.id, Number(p.peso)]));
  const proxProvas = (provas.data ?? []).filter((p) => new Date(p.data) >= agora);
  return {
    tarefas: ts,
    pendentes: ts.filter((t) => t.s !== "concluida").length,
    hoje: ts.filter((t) => t.s !== "concluida" && new Date(t.prazo) >= agora && new Date(t.prazo) <= fimHoje).length,
    proximas: proxProvas.filter((p) => new Date(p.data) <= em7).length,
    proxProvas,
    media: mediaPonderada((notas.data ?? []).map((n) => ({ valor: Number(n.valor), peso: pesos.get(n.prova_id) ?? 1 }))),
    concluidasTurma: (entregas.data ?? []).filter((e) => e.status === "concluida").length,
    totalTurmas: turmas.count ?? 0,
    totalAlunos: new Set((matriculas.data ?? []).map((m) => m.aluno_id)).size,
    totalProfessores: new Set((roles.data ?? []).map((r) => r.user_id)).size,
    totalProvas: (provas.data ?? []).length,
    simulados: notasSim.length,
    mediaSimulados: notasSim.length ? notasSim.reduce((a, b) => a + b, 0) / notasSim.length : null,
  };
}

function Card({ t, v, s, I, bg, loading }: { t: string; v: React.ReactNode; s: string; I: typeof Clock; bg: string; loading: boolean }) {
  return (
    <div className="flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className={`grid size-14 shrink-0 place-items-center rounded-xl ${bg}`}><I className="size-7" /></div>
      <div>
        <div className="text-sm text-muted-foreground">{t}</div>
        {loading ? <Skeleton className="my-1 h-8 w-12" /> : <div className="text-3xl font-extrabold">{v}</div>}
        <div className="text-xs text-muted-foreground">{s}</div>
      </div>
    </div>
  );
}

function Painel() {
  const { user } = Route.useRouteContext();
  const { data: p } = usePerfil(user.id);
  const { data, isLoading } = useQuery({ queryKey: ["painel", user.id], queryFn: () => carregar(user.id) });
  const perfil = p?.perfil ?? "aluno";

  const cards =
    perfil === "gestao"
      ? [
          { t: "Turmas", v: data?.totalTurmas, s: "cadastradas", I: School, bg: "bg-sky-soft text-primary" },
          { t: "Alunos", v: data?.totalAlunos, s: "matriculados", I: Users, bg: "bg-success-soft text-success" },
          { t: "Professores", v: data?.totalProfessores, s: "ativos", I: BookOpen, bg: "bg-warning-soft text-warning" },
          { t: "Atividades", v: (data?.tarefas.length ?? 0) + (data?.totalProvas ?? 0), s: "tarefas e provas", I: FileText, bg: "bg-violet-soft text-violet" },
        ]
      : perfil === "professor"
        ? [
            { t: "Tarefas criadas", v: data?.tarefas.length, s: "nas suas turmas", I: ClipboardList, bg: "bg-sky-soft text-primary" },
            { t: "Entregas concluídas", v: data?.concluidasTurma, s: "pelos alunos", I: CalendarCheck, bg: "bg-success-soft text-success" },
            { t: "Próximas provas", v: data?.proximas, s: "nos próximos 7 dias", I: Clock, bg: "bg-warning-soft text-warning" },
            { t: "Provas", v: data?.totalProvas, s: "cadastradas", I: FileText, bg: "bg-violet-soft text-violet" },
          ]
        : [
            { t: "Tarefas pendentes", v: data?.pendentes, s: "tarefas para concluir", I: ClipboardList, bg: "bg-sky-soft text-primary" },
            { t: "Tarefas para hoje", v: data?.hoje, s: "não se esqueça!", I: CalendarCheck, bg: "bg-success-soft text-success" },
            { t: "Próximas provas", v: data?.proximas, s: "nos próximos 7 dias", I: Clock, bg: "bg-warning-soft text-warning" },
            { t: "Média geral", v: fmtNota(data?.media ?? null), s: "média ponderada", I: TrendingUp, bg: "bg-violet-soft text-violet" },
            { t: "Simulados", v: fmtNota(data?.mediaSimulados ?? null), s: `${data?.simulados ?? 0} feitos · média`, I: FileText, bg: "bg-sky-soft text-primary" },
          ];

  return (
    <>
      <h1 className="text-3xl font-extrabold">Olá, {p?.nome.split(" ")[0] || "..."}! 👋</h1>
      <p className="mt-1 text-muted-foreground">Vamos organizar o seu dia e alcançar grandes conquistas.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => <Card key={c.t} {...c} loading={isLoading} />)}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Próximas tarefas</h2><Link to="/tarefas" className="text-sm text-primary">Ver todas</Link></div>
          {(data?.tarefas ?? []).filter((t) => t.s !== "concluida").slice(0, 5).map((t) => (
            <div key={t.id} className="flex justify-between border-t border-border py-2 text-sm"><span>{t.titulo} <span className="text-muted-foreground">· {t.disciplinas?.nome}</span></span><span className={t.s === "atrasada" ? "text-destructive" : "text-muted-foreground"}>{fmtData(t.prazo)}</span></div>
          ))}
          {data && data.tarefas.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma tarefa por aqui.</p>}
        </section>
        <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Próximas provas</h2><Link to="/provas" className="text-sm text-primary">Ver todas</Link></div>
          {(data?.proxProvas ?? []).slice(0, 5).map((pr) => (
            <div key={pr.id} className="flex justify-between border-t border-border py-2 text-sm"><span>{pr.titulo} <span className="text-muted-foreground">· {pr.disciplinas?.nome}</span></span><span className="text-muted-foreground">{fmtData(pr.data)}</span></div>
          ))}
          {data && data.proxProvas.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma prova agendada.</p>}
        </section>
      </div>
    </>
  );
}
