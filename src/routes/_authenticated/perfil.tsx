import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePerfil } from "@/lib/dados";
import { ROLE_LABEL } from "@/lib/perfil";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({
    meta: [
      { title: "Meu perfil — EduPlanner" },
      { name: "description", content: "Atualize seus dados pessoais." },
      { property: "og:title", content: "Meu perfil — EduPlanner" },
      { property: "og:description", content: "Dados pessoais no EduPlanner." },
    ],
  }),
  component: Perfil,
});

function Perfil() {
  const { user } = Route.useRouteContext();
  const { data } = usePerfil(user.id);
  const qc = useQueryClient();
  const [nome, setNome] = useState("");
  const [tel, setTel] = useState("");
  useEffect(() => { if (data) { setNome(data.nome); setTel(data.telefone ?? ""); } }, [data]);
  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return toast.error("Informe seu nome.");
    const { error } = await supabase.from("profiles").update({ nome: nome.trim(), telefone: tel.trim() || null }).eq("id", user.id);
    if (error) return toast.error(error.message);
    toast.success("Perfil atualizado");
    qc.invalidateQueries({ queryKey: ["perfil", user.id] });
  }
  return (
    <>
      <h1 className="text-3xl font-extrabold">Meu perfil</h1>
      <form onSubmit={salvar} className="mt-4 max-w-md space-y-3 rounded-2xl border border-border bg-card p-5 shadow-card">
        <div><Label>E-mail</Label><Input value={data?.email ?? user.email ?? ""} disabled /></div>
        <div><Label>Perfil</Label><Input value={(data?.roles ?? []).map((r) => ROLE_LABEL[r]).join(", ")} disabled /></div>
        {data?.matricula && <div><Label>Matrícula</Label><Input value={data.matricula} disabled /></div>}
        <div><Label>Nome</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} /></div>
        <div><Label>Telefone</Label><Input value={tel} onChange={(e) => setTel(e.target.value)} /></div>
        <Button type="submit" className="rounded-xl">Salvar</Button>
      </form>
    </>
  );
}
