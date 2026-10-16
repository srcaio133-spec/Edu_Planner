import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, Pencil, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { statusTarefa, type StatusTarefa } from "@/lib/perfil";
import { fmtData, localParaIso, usePerfil, useTurmasDisciplinas } from "@/lib/dados";

export const Route = createFileRoute("/_authenticated/tarefas")({
  head: () => ({
    meta: [
      { title: "Tarefas — EduPlanner" },
      { name: "description", content: "Acompanhe e gerencie tarefas escolares." },
      { property: "og:title", content: "Tarefas — EduPlanner" },
      { property: "og:description", content: "Tarefas por turma e disciplina." },
    ],
  }),
  component: Tarefas,
});

const ROTULO: Record<StatusTarefa, string> = { pendente: "Pendente", em_andamento: "Em andamento", concluida: "Concluída", atrasada: "Atrasada" };
const COR: Record<StatusTarefa, string> = { pendente: "bg-sky-soft text-primary", em_andamento: "bg-warning-soft text-warning", concluida: "bg-success-soft text-success", atrasada: "bg-danger-soft text-destructive" };

type Tarefa = { id: string; titulo: string; descricao: string | null; prazo: string; prioridade: "baixa" | "media" | "alta"; turma_id: string; disciplina_id: string };

function Tarefas() {
  const { user } = Route.useRouteContext();
  const { data: p } = usePerfil(user.id);
  const gere = p?.perfil === "professor" || p?.perfil === "gestao";
  const qc = useQueryClient();
  const [filtro, setFiltro] = useState<StatusTarefa | "todas">("todas");
  const [edit, setEdit] = useState<Partial<Tarefa> | null>(null);
  const [verEntregas, setVerEntregas] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["tarefas", user.id],
    queryFn: async () => {
      const [t, e] = await Promise.all([
        supabase.from("tarefas").select("*,disciplinas(nome),turmas(nome)").order("prazo"),
        supabase.from("entregas").select("id,tarefa_id,aluno_id,status"),
      ]);
      return { tarefas: t.data ?? [], entregas: e.data ?? [] };
    },
  });
  const minhas = new Map((data?.entregas ?? []).filter((e) => e.aluno_id === user.id).map((e) => [e.tarefa_id, e]));
  const lista = (data?.tarefas ?? []).map((t) => ({ ...t, s: statusTarefa(new Date(t.prazo), minhas.get(t.id)?.status) }));
  const visiveis = lista.filter((t) => filtro === "todas" || t.s === filtro);
  const recarregar = () => qc.invalidateQueries({ queryKey: ["tarefas"] }).then(() => qc.invalidateQueries({ queryKey: ["painel"] }));

  async function marcar(tarefaId: string, status: "em_andamento" | "concluida") {
    const e = minhas.get(tarefaId);
    const concluida_em = status === "concluida" ? new Date().toISOString() : null;
    const { error } = e
      ? await supabase.from("entregas").update({ status, concluida_em }).eq("id", e.id)
      : await supabase.from("entregas").insert({ tarefa_id: tarefaId, aluno_id: user.id, status, concluida_em });
    if (error) return toast.error(error.message);
    toast.success(status === "concluida" ? "Tarefa concluída!" : "Tarefa em andamento");
    recarregar();
  }

  async function excluir(id: string) {
    if (!confirm("Excluir esta tarefa?")) return;
    const { error } = await supabase.from("tarefas").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Tarefa excluída");
    recarregar();
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold">Tarefas</h1>
        {gere && <Button className="rounded-xl" onClick={() => setEdit({ prioridade: "media" })}><Plus /> Nova tarefa</Button>}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {(["todas", "pendente", "em_andamento", "concluida", "atrasada"] as const).map((f) => (
          <Button key={f} size="sm" variant={filtro === f ? "default" : "outline"} className="rounded-full" onClick={() => setFiltro(f)}>
            {f === "todas" ? "Todas" : ROTULO[f]}
          </Button>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {visiveis.map((t) => (
          <div key={t.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 font-semibold">{t.titulo}
                {!gere && <span className={`rounded-full px-2 py-0.5 text-xs ${COR[t.s]}`}>{ROTULO[t.s]}</span>}
                <Badge variant="outline">{t.prioridade}</Badge>
              </div>
              <div className="text-sm text-muted-foreground">{t.disciplinas?.nome} · {t.turmas?.nome} · prazo {fmtData(t.prazo)}</div>
              {t.descricao && <p className="mt-1 text-sm">{t.descricao}</p>}
            </div>
            {gere ? (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setVerEntregas(t.id)}><Users /> {(data?.entregas ?? []).filter((e) => e.tarefa_id === t.id && e.status === "concluida").length}</Button>
                <Button size="icon" variant="ghost" aria-label="Editar" onClick={() => setEdit(t)}><Pencil /></Button>
                <Button size="icon" variant="ghost" aria-label="Excluir" onClick={() => excluir(t.id)}><Trash2 /></Button>
              </div>
            ) : t.s !== "concluida" ? (
              <div className="flex gap-2">
                {t.s !== "em_andamento" && <Button size="sm" variant="outline" onClick={() => marcar(t.id, "em_andamento")}>Iniciar</Button>}
                <Button size="sm" onClick={() => marcar(t.id, "concluida")}>Concluir</Button>
              </div>
            ) : null}
          </div>
        ))}
        {data && visiveis.length === 0 && <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">Nenhuma tarefa encontrada.</p>}
      </div>
      {edit && <FormTarefa inicial={edit} userId={user.id} onClose={() => setEdit(null)} onSaved={recarregar} />}
      <EntregasDialog tarefaId={verEntregas} onClose={() => setVerEntregas(null)} entregas={data?.entregas ?? []} />
    </>
  );
}

function EntregasDialog({ tarefaId, onClose, entregas }: { tarefaId: string | null; onClose: () => void; entregas: { tarefa_id: string; aluno_id: string; status: string }[] }) {
  const lista = entregas.filter((e) => e.tarefa_id === tarefaId);
  const { data: nomes } = useQuery({
    queryKey: ["nomes", lista.map((l) => l.aluno_id).join()],
    enabled: !!tarefaId && lista.length > 0,
    queryFn: async () => new Map(((await supabase.from("profiles").select("id,nome").in("id", lista.map((l) => l.aluno_id))).data ?? []).map((x) => [x.id, x.nome])),
  });
  return (
    <Dialog open={!!tarefaId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Entregas</DialogTitle></DialogHeader>
        {lista.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum aluno iniciou esta tarefa.</p> : lista.map((e) => (
          <div key={e.aluno_id} className="flex justify-between border-t border-border py-2 text-sm"><span>{nomes?.get(e.aluno_id) || "Aluno"}</span><span>{e.status === "concluida" ? "Concluída" : "Em andamento"}</span></div>
        ))}
      </DialogContent>
    </Dialog>
  );
}

const paraLocal = (iso?: string) => (iso ? new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16) : "");

function FormTarefa({ inicial, userId, onClose, onSaved }: { inicial: Partial<Tarefa>; userId: string; onClose: () => void; onSaved: () => void }) {
  const { data: base } = useTurmasDisciplinas();
  const [f, setF] = useState({ ...inicial, prazo: paraLocal(inicial.prazo) });
  const [salvando, setSalvando] = useState(false);
  async function salvar(ev: React.FormEvent) {
    ev.preventDefault();
    if (!f.titulo || !f.turma_id || !f.disciplina_id || !f.prazo) return toast.error("Preencha título, turma, disciplina e prazo.");
    setSalvando(true);
    const row = { titulo: f.titulo, descricao: f.descricao ?? null, turma_id: f.turma_id, disciplina_id: f.disciplina_id, prazo: localParaIso(f.prazo), prioridade: f.prioridade ?? "media" };
    const { error } = inicial.id
      ? await supabase.from("tarefas").update(row).eq("id", inicial.id)
      : await supabase.from("tarefas").insert({ ...row, professor_id: userId });
    setSalvando(false);
    if (error) return toast.error(error.message);
    toast.success("Tarefa salva");
    onSaved(); onClose();
  }
  const sel = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{inicial.id ? "Editar tarefa" : "Nova tarefa"}</DialogTitle></DialogHeader>
        <form onSubmit={salvar} className="space-y-3">
          <div><Label>Título</Label><Input value={f.titulo ?? ""} onChange={(e) => setF({ ...f, titulo: e.target.value })} /></div>
          <div><Label>Descrição</Label><Textarea value={f.descricao ?? ""} onChange={(e) => setF({ ...f, descricao: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Turma</Label><select className={sel} value={f.turma_id ?? ""} onChange={(e) => setF({ ...f, turma_id: e.target.value })}><option value="">Selecione</option>{base?.turmas.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}</select></div>
            <div><Label>Disciplina</Label><select className={sel} value={f.disciplina_id ?? ""} onChange={(e) => setF({ ...f, disciplina_id: e.target.value })}><option value="">Selecione</option>{base?.disciplinas.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}</select></div>
            <div><Label>Prazo</Label><Input type="datetime-local" value={f.prazo} onChange={(e) => setF({ ...f, prazo: e.target.value })} /></div>
            <div><Label>Prioridade</Label><select className={sel} value={f.prioridade} onChange={(e) => setF({ ...f, prioridade: e.target.value as Tarefa["prioridade"] })}><option value="baixa">Baixa</option><option value="media">Média</option><option value="alta">Alta</option></select></div>
          </div>
          <Button type="submit" className="w-full rounded-xl" disabled={salvando}>Salvar</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
