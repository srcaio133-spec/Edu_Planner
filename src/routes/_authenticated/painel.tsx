import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ClipboardList, CalendarCheck, Clock, TrendingUp, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { ThemeButton } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { mediaPonderada, perfilDe, ROLE_LABEL, rolePrincipal, statusTarefa, type AppRole } from "@/lib/perfil";

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
  const [perfil, roles, tarefas, entregas, provas, notas] = await Promise.all([
    supabase.from("profiles").select("nome").eq("id", userId).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId),
    supabase.from("tarefas").select("id,prazo"),
    supabase.from("entregas").select("tarefa_id,status").eq("aluno_id", userId),
    supabase.from("provas").select("id,data,peso"),
    supabase.from("notas").select("prova_id,valor").eq("aluno_id", userId),
  ]);
  const roleList = (roles.data ?? []).map((r) => r.role as AppRole);
  const ent = new Map((entregas.data ?? []).map((e) => [e.tarefa_id, e.status]));
  const agora = new Date();
  const fimHoje = new Date(); fimHoje.setHours(23, 59, 59, 999);
  const st = (tarefas.data ?? []).map((t) => ({ prazo: new Date(t.prazo), s: statusTarefa(new Date(t.prazo), ent.get(t.id), agora) }));
  const pendentes = st.filter((t) => t.s !== "concluida").length;
  const hoje = st.filter((t) => t.s !== "concluida" && t.prazo >= agora && t.prazo <= fimHoje).length;
  const em7 = new Date(agora.getTime() + 7 * 864e5);
  const proximas = (provas.data ?? []).filter((p) => new Date(p.data) >= agora && new Date(p.data) <= em7).length;
  const pesos = new Map((provas.data ?? []).map((p) => [p.id, Number(p.peso)]));
  const media = mediaPonderada((notas.data ?? []).map((n) => ({ valor: Number(n.valor), peso: pesos.get(n.prova_id) ?? 1 })));
  return { nome: perfil.data?.nome ?? "", roles: roleList, pendentes, hoje, proximas, media, total: st.length };
}

function Painel() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ["painel", user.id], queryFn: () => carregar(user.id) });
  const perfil = data ? perfilDe(data.roles) : "aluno";

  useEffect(() => {
    document.documentElement.dataset["perfil"] = perfil;
  }, [perfil]);

  async function sair() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  const cards = [
    { t: "Tarefas pendentes", v: data?.pendentes, s: "tarefas para concluir", I: ClipboardList, bg: "bg-sky-soft text-primary" },
    { t: "Tarefas para hoje", v: data?.hoje, s: "não se esqueça!", I: CalendarCheck, bg: "bg-success-soft text-success" },
    { t: "Próximas provas", v: data?.proximas, s: "nos próximos 7 dias", I: Clock, bg: "bg-warning-soft text-warning" },
    { t: "Média geral", v: data?.media != null ? data.media.toFixed(1).replace(".", ",") : "—", s: "média ponderada", I: TrendingUp, bg: "bg-violet-soft text-violet" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border bg-sidebar px-6 py-4">
        <Logo subtitle="Organize seus estudos" />
        <div className="flex items-center gap-3">
          <ThemeButton />
          <Button variant="outline" className="rounded-xl" onClick={sair}><LogOut /> Sair</Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-6">
        <h1 className="text-3xl font-extrabold">Olá, {data?.nome.split(" ")[0] || "..."}! 👋</h1>
        <p className="mt-1 text-muted-foreground">
          {data ? ROLE_LABEL[rolePrincipal(data.roles)] + " · " : ""}Vamos organizar o seu dia e alcançar grandes conquistas.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(({ t, v, s, I, bg }) => (
            <div key={t} className="flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className={`grid size-14 place-items-center rounded-xl ${bg}`}><I className="size-7" /></div>
              <div>
                <div className="text-sm text-muted-foreground">{t}</div>
                {isLoading ? <Skeleton className="my-1 h-8 w-12" /> : <div className="text-3xl font-extrabold">{v}</div>}
                <div className="text-xs text-muted-foreground">{s}</div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
