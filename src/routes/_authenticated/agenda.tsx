import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePerfil } from "@/lib/dados";

export const Route = createFileRoute("/_authenticated/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda — EduPlanner" },
      { name: "description", content: "Calendário mensal com provas, tarefas e eventos." },
      { property: "og:title", content: "Agenda — EduPlanner" },
      { property: "og:description", content: "Agenda escolar no EduPlanner." },
    ],
  }),
  component: Agenda,
});

type Item = { id: string; titulo: string; data: Date; tipo: "prova" | "tarefa" | "evento" | "lembrete"; meu?: boolean };
const COR = { prova: "bg-warning-soft text-warning", tarefa: "bg-sky-soft text-primary", evento: "bg-violet-soft text-violet", lembrete: "bg-success-soft text-success" };
const chave = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

function Agenda() {
  const { user } = Route.useRouteContext();
  const { data: p } = usePerfil(user.id);
  const qc = useQueryClient();
  const [mes, setMes] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [sel, setSel] = useState<Date>(new Date());
  const [titulo, setTitulo] = useState("");
  const { data } = useQuery({
    queryKey: ["agenda", user.id],
    queryFn: async () => {
      const [t, pr, e] = await Promise.all([
        supabase.from("tarefas").select("id,titulo,prazo"),
        supabase.from("provas").select("id,titulo,data"),
        supabase.from("eventos").select("id,titulo,inicio,oficial,dono_id"),
      ]);
      const itens: Item[] = [
        ...(t.data ?? []).map((x) => ({ id: x.id, titulo: x.titulo, data: new Date(x.prazo), tipo: "tarefa" as const })),
        ...(pr.data ?? []).map((x) => ({ id: x.id, titulo: x.titulo, data: new Date(x.data), tipo: "prova" as const })),
        ...(e.data ?? []).map((x) => ({ id: x.id, titulo: x.titulo, data: new Date(x.inicio), tipo: x.oficial ? ("evento" as const) : ("lembrete" as const), meu: x.dono_id === user.id && !x.oficial })),
      ];
      return itens;
    },
  });
  const porDia = new Map<string, Item[]>();
  for (const i of data ?? []) { const k = chave(i.data); porDia.set(k, [...(porDia.get(k) ?? []), i]); }

  const inicio = new Date(mes); inicio.setDate(1 - mes.getDay());
  const dias = Array.from({ length: 42 }, (_, i) => new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i));
  const hoje = chave(new Date());
  const doDia = porDia.get(chave(sel)) ?? [];

  async function adicionar(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return;
    const d = new Date(sel); d.setHours(9, 0, 0, 0);
    const oficial = p?.perfil === "gestao";
    const { error } = await supabase.from("eventos").insert({ titulo: titulo.trim(), inicio: d.toISOString(), oficial, dono_id: user.id, tipo: oficial ? "evento" : "lembrete" });
    if (error) { toast.error(error.message); return; }
    setTitulo(""); toast.success(oficial ? "Evento criado" : "Lembrete criado");
    qc.invalidateQueries({ queryKey: ["agenda"] });
  }
  async function remover(id: string) {
    const { error } = await supabase.from("eventos").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["agenda"] });
  }

  return (
    <>
      <h1 className="text-3xl font-extrabold">Agenda</h1>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
        <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <Button size="icon" variant="ghost" aria-label="Mês anterior" onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))}><ChevronLeft /></Button>
            <h2 className="font-bold capitalize">{mes.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</h2>
            <Button size="icon" variant="ghost" aria-label="Próximo mês" onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))}><ChevronRight /></Button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => <div key={d}>{d}</div>)}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {dias.map((d) => {
              const k = chave(d); const its = porDia.get(k) ?? [];
              return (
                <button key={k} onClick={() => setSel(d)} className={`min-h-16 rounded-lg border p-1 text-left text-xs ${k === chave(sel) ? "border-primary" : "border-border"} ${d.getMonth() !== mes.getMonth() ? "opacity-40" : ""}`}>
                  <div className={`font-semibold ${k === hoje ? "text-primary" : ""}`}>{d.getDate()}</div>
                  {its.slice(0, 2).map((i) => <div key={i.id} className={`mt-0.5 truncate rounded px-1 ${COR[i.tipo]}`}>{i.titulo}</div>)}
                  {its.length > 2 && <div className="text-muted-foreground">+{its.length - 2}</div>}
                </button>
              );
            })}
          </div>
        </section>
        <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <h2 className="font-bold">{sel.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</h2>
          <div className="mt-3 space-y-2">
            {doDia.map((i) => (
              <div key={i.id} className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${COR[i.tipo]}`}>
                <span><span className="font-semibold capitalize">{i.tipo}:</span> {i.titulo}</span>
                {(i.meu || (p?.perfil === "gestao" && i.tipo === "evento")) && <button aria-label="Remover" onClick={() => remover(i.id)}><Trash2 className="size-4" /></button>}
              </div>
            ))}
            {doDia.length === 0 && <p className="text-sm text-muted-foreground">Nada marcado para este dia.</p>}
          </div>
          <form onSubmit={adicionar} className="mt-4 flex gap-2">
            <Input placeholder={p?.perfil === "gestao" ? "Novo evento oficial" : "Novo lembrete"} value={titulo} onChange={(e) => setTitulo(e.target.value)} />
            <Button size="icon" type="submit" aria-label="Adicionar"><Plus /></Button>
          </form>
        </section>
      </div>
    </>
  );
}
