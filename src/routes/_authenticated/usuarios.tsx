import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { usePerfil } from "@/lib/dados";
import { ROLE_LABEL, rolePrincipal, type AppRole } from "@/lib/perfil";
import { podeDefinirPapel } from "@/lib/regras";

export const Route = createFileRoute("/_authenticated/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuários e papéis — EduPlanner" },
      { name: "description", content: "Gestão de contas e permissões da escola." },
      { property: "og:title", content: "Usuários — EduPlanner" },
      { property: "og:description", content: "Atribuição de papéis por perfil." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Usuarios,
});

const PAPEIS: AppRole[] = ["aluno", "professor", "secretaria", "coordenacao", "vice_diretor", "diretor", "admin"];

function Usuarios() {
  const { user } = Route.useRouteContext();
  const { data: eu } = usePerfil(user.id);
  const qc = useQueryClient();
  const [busca, setBusca] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["usuarios"],
    queryFn: async () => {
      const [p, r] = await Promise.all([
        supabase.from("profiles").select("id,nome,email,matricula").order("nome"),
        supabase.from("user_roles").select("user_id,role"),
      ]);
      const roles = new Map<string, AppRole[]>();
      for (const x of r.data ?? []) roles.set(x.user_id, [...(roles.get(x.user_id) ?? []), x.role as AppRole]);
      return (p.data ?? []).map((u) => ({ ...u, roles: roles.get(u.id) ?? [] }));
    },
  });
  async function definir(id: string, role: AppRole) {
    const { error } = await supabase.rpc("definir_papel", { _user: id, _role: role });
    if (error) { toast.error(error.message); return; }
    toast.success("Papel atualizado");
    qc.invalidateQueries({ queryKey: ["usuarios"] });
  }
  const meus = eu?.roles ?? [];
  const lista = (data ?? []).filter((u) => `${u.nome} ${u.email}`.toLowerCase().includes(busca.toLowerCase()));
  return (
    <>
      <h1 className="text-3xl font-extrabold">Usuários e papéis</h1>
      <p className="mt-1 text-muted-foreground">Secretaria e coordenação definem alunos e professores; a direção define também os papéis de gestão.</p>
      <Input className="mt-4 max-w-sm" placeholder="Buscar por nome ou e-mail" value={busca} onChange={(e) => setBusca(e.target.value)} />
      <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left"><tr><th className="p-3">Nome</th><th className="p-3">E-mail</th><th className="p-3">Papel</th></tr></thead>
          <tbody>
            {isLoading && <tr><td colSpan={3} className="p-3"><Skeleton className="h-8" /></td></tr>}
            {lista.map((u) => {
              const atual = rolePrincipal(u.roles);
              const opcoes = PAPEIS.filter((r) => r === atual || podeDefinirPapel(meus, u.roles, r, u.id === user.id));
              return (
                <tr key={u.id} className="border-t border-border">
                  <td className="p-3 font-medium">{u.nome || "—"}</td>
                  <td className="p-3 text-muted-foreground">{u.email}</td>
                  <td className="p-3">
                    <select aria-label={`Papel de ${u.nome}`} className="h-9 rounded-md border border-input bg-background px-2" value={atual}
                      disabled={opcoes.length <= 1} onChange={(e) => definir(u.id, e.target.value as AppRole)}>
                      {opcoes.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
