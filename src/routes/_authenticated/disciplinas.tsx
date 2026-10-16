import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePerfil, useTurmasDisciplinas } from "@/lib/dados";

export const Route = createFileRoute("/_authenticated/disciplinas")({
  head: () => ({
    meta: [
      { title: "Disciplinas — EduPlanner" },
      { name: "description", content: "Cadastro das disciplinas da escola." },
      { property: "og:title", content: "Disciplinas — EduPlanner" },
      { property: "og:description", content: "Gestão de disciplinas no EduPlanner." },
    ],
  }),
  component: Disciplinas,
});

function Disciplinas() {
  const { user } = Route.useRouteContext();
  const { data: p } = usePerfil(user.id);
  const { data } = useTurmasDisciplinas();
  const qc = useQueryClient();
  const [nome, setNome] = useState("");
  if (p && p.perfil !== "gestao") return <p className="text-muted-foreground">Área restrita à gestão escolar.</p>;
  async function criar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    const { error } = await supabase.from("disciplinas").insert({ nome: nome.trim() });
    if (error) return toast.error(error.message);
    setNome(""); toast.success("Disciplina criada"); qc.invalidateQueries({ queryKey: ["base"] });
  }
  async function excluir(id: string) {
    if (!confirm("Excluir esta disciplina?")) return;
    const { error } = await supabase.from("disciplinas").delete().eq("id", id);
    if (error) return toast.error("Não foi possível excluir: há registros vinculados.");
    qc.invalidateQueries({ queryKey: ["base"] });
  }
  return (
    <>
      <h1 className="text-3xl font-extrabold">Disciplinas</h1>
      <form onSubmit={criar} className="mt-4 flex max-w-md gap-2">
        <Input placeholder="Ex.: Matemática" value={nome} onChange={(e) => setNome(e.target.value)} />
        <Button type="submit" className="rounded-xl"><Plus /> Criar</Button>
      </form>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data?.disciplinas.map((d) => (
          <div key={d.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 font-semibold shadow-card">
            {d.nome}<Button size="icon" variant="ghost" aria-label="Excluir" onClick={() => excluir(d.id)}><Trash2 /></Button>
          </div>
        ))}
      </div>
    </>
  );
}
