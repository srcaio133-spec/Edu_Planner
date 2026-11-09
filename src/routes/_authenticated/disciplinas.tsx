import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
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
    if (error) { toast.error(error.message); return; }
    setNome(""); toast.success("Disciplina criada"); qc.invalidateQueries({ queryKey: ["base"] });
  }
  async function excluir(id: string) {
    if (!confirm("Excluir esta disciplina?")) return;
    const { error } = await supabase.from("disciplinas").delete().eq("id", id);
    if (error) { toast.error("Não foi possível excluir: há registros vinculados."); return; }
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
          <div key={d.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="flex items-center justify-between font-semibold">{d.nome}<Button size="icon" variant="ghost" aria-label="Excluir" onClick={() => excluir(d.id)}><Trash2 /></Button></div>
            <Conteudos disciplinaId={d.id} />
          </div>
        ))}
      </div>
    </>
  );
}

function Conteudos({ disciplinaId }: { disciplinaId: string }) {
  const qc = useQueryClient();
  const [titulo, setTitulo] = useState("");
  const { data } = useQuery({ queryKey: ["conteudos"], queryFn: async () => (await supabase.from("conteudos").select("id,titulo,disciplina_id,resumo").order("ordem")).data ?? [] });
  const lista = (data ?? []).filter((c) => c.disciplina_id === disciplinaId);
  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return;
    const { error } = await supabase.from("conteudos").insert({ disciplina_id: disciplinaId, titulo: titulo.trim(), ordem: lista.length });
    if (error) { toast.error("Não foi possível adicionar (talvez já exista)."); return; }
    setTitulo(""); qc.invalidateQueries({ queryKey: ["conteudos"] });
  }
  const [editando, setEditando] = useState<string | null>(null);
  const [resumo, setResumo] = useState("");
  async function salvarResumo() {
    const { error } = await supabase.from("conteudos").update({ resumo: resumo.trim() || null }).eq("id", editando!);
    if (error) { toast.error("Não foi possível salvar."); return; }
    toast.success("Material salvo."); setEditando(null); qc.invalidateQueries({ queryKey: ["conteudos"] });
  }
  async function del(id: string) {
    await supabase.from("conteudos").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["conteudos"] });
  }
  return (
    <div className="mt-2">
      <div className="text-xs text-muted-foreground">Conteúdos</div>
      <div className="mt-1 flex flex-wrap gap-1">
        {lista.map((c) => (
          <span key={c.id} className="flex items-center gap-1 rounded-full bg-sky-soft px-2 py-0.5 text-xs text-primary">
            <button className="underline-offset-2 hover:underline" title="Editar material de estudo" onClick={() => { setEditando(c.id); setResumo(c.resumo ?? ""); }}>{c.titulo}{c.resumo ? "" : " ⚠"}</button>
            <button aria-label={`Remover ${c.titulo}`} onClick={() => del(c.id)}><X className="size-3" /></button></span>
        ))}
      </div>
      {editando && lista.some((c) => c.id === editando) && (
        <div className="mt-2 space-y-1">
          <label className="text-xs text-muted-foreground" htmlFor={`res-${editando}`}>Material de estudo de “{lista.find((c) => c.id === editando)?.titulo}” (EduMind usa este texto para explicar)</label>
          <textarea id={`res-${editando}`} className="min-h-28 w-full rounded-md border bg-background p-2 text-sm" value={resumo} onChange={(e) => setResumo(e.target.value)} maxLength={4000} />
          <div className="flex gap-1"><Button size="sm" onClick={salvarResumo}>Salvar</Button><Button size="sm" variant="ghost" onClick={() => setEditando(null)}>Cancelar</Button></div>
        </div>
      )}
      <form onSubmit={add} className="mt-2 flex gap-1"><Input className="h-8 text-sm" placeholder="Novo conteúdo" value={titulo} onChange={(e) => setTitulo(e.target.value)} /><Button size="sm" type="submit" variant="outline">Adicionar</Button></form>
    </div>
  );
}
