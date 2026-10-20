import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Check, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fmtData, usePerfil, useTurmasDisciplinas } from "@/lib/dados";

export const Route = createFileRoute("/_authenticated/comunicados")({
  head: () => ({
    meta: [
      { title: "Comunicados — EduPlanner" },
      { name: "description", content: "Comunicação interna com aprovação da secretaria." },
      { property: "og:title", content: "Comunicados — EduPlanner" },
      { property: "og:description", content: "Avisos para a escola, turmas e perfis." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Comunicados,
});

const sel = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";
const STATUS: Record<string, string> = { pendente: "bg-warning-soft text-warning", aprovado: "bg-success-soft text-success", rejeitado: "bg-danger-soft text-destructive" };

function Comunicados() {
  const { user } = Route.useRouteContext();
  const { data: p } = usePerfil(user.id);
  const gestao = p?.perfil === "gestao";
  const pode = p?.perfil === "professor" || gestao;
  const qc = useQueryClient();
  const [novo, setNovo] = useState(false);
  const { data } = useQuery({
    queryKey: ["comunicados"],
    queryFn: async () => (await supabase.from("comunicados").select("*,turmas(nome)").order("created_at", { ascending: false })).data ?? [],
  });
  const recarregar = () => qc.invalidateQueries({ queryKey: ["comunicados"] });
  async function avaliar(id: string, aprovar: boolean) {
    const motivo = aprovar ? null : prompt("Motivo da rejeição:");
    if (!aprovar && !motivo) return;
    const { error } = await supabase.rpc("avaliar_comunicado", { _id: id, _aprovar: aprovar, ...(motivo ? { _motivo: motivo } : {}) });
    if (error) { toast.error(error.message); return; }
    toast.success(aprovar ? "Comunicado publicado" : "Comunicado rejeitado"); recarregar();
  }
  const pendentes = (data ?? []).filter((c) => c.status === "pendente");
  const destino = (c: NonNullable<typeof data>[number]) => c.destino === "escola" ? "Toda a escola" : c.destino === "turma" ? `Turma ${c.turmas?.nome ?? ""}` : `Perfil: ${c.perfil_destino}`;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold">Comunicados</h1>
        {pode && <Button className="rounded-xl" onClick={() => setNovo(true)}><Plus /> Novo comunicado</Button>}
      </div>
      {p?.perfil === "professor" && <p className="mt-1 text-sm text-muted-foreground">Seus comunicados são publicados após aprovação da secretaria.</p>}
      {gestao && pendentes.length > 0 && (
        <section className="mt-4 rounded-2xl border border-warning bg-warning-soft/40 p-4">
          <h2 className="font-bold">Aguardando aprovação ({pendentes.length})</h2>
          {pendentes.map((c) => (
            <div key={c.id} className="mt-2 flex flex-wrap items-center gap-3 rounded-xl bg-card p-3">
              <div className="min-w-0 flex-1"><div className="font-semibold">{c.titulo}</div><div className="text-sm text-muted-foreground">{destino(c)} · {c.corpo}</div></div>
              <Button size="sm" onClick={() => avaliar(c.id, true)}><Check /> Aprovar</Button>
              <Button size="sm" variant="outline" onClick={() => avaliar(c.id, false)}><X /> Rejeitar</Button>
            </div>
          ))}
        </section>
      )}
      <div className="mt-4 space-y-3">
        {(data ?? []).filter((c) => !(gestao && c.status === "pendente")).map((c) => (
          <article key={c.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="flex-1 font-bold">{c.titulo}</h3>
              {(c.autor_id === user.id || gestao) && <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS[c.status]}`}>{c.status}</span>}
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm">{c.corpo}</p>
            <p className="mt-2 text-xs text-muted-foreground">{destino(c)} · {fmtData(c.publicado_em ?? c.created_at)}{c.motivo ? ` · Motivo: ${c.motivo}` : ""}</p>
          </article>
        ))}
        {data && data.length === 0 && <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">Nenhum comunicado.</p>}
      </div>
      {novo && <Novo gestao={gestao} userId={user.id} onClose={() => setNovo(false)} onSaved={recarregar} />}
    </>
  );
}

function Novo({ gestao, userId, onClose, onSaved }: { gestao: boolean; userId: string; onClose: () => void; onSaved: () => void }) {
  const { data: base } = useTurmasDisciplinas();
  const { data: minhas } = useQuery({
    queryKey: ["minhas-turmas", userId],
    enabled: !gestao,
    queryFn: async () => (await supabase.from("turma_disciplinas").select("turma_id").eq("professor_id", userId)).data ?? [],
  });
  const turmas = gestao ? base?.turmas : base?.turmas.filter((t) => minhas?.some((m) => m.turma_id === t.id));
  const [f, setF] = useState({ titulo: "", corpo: "", destino: "escola", turma_id: "", perfil_destino: "aluno" });
  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!f.titulo || !f.corpo) { toast.error("Preencha título e mensagem."); return; }
    if (f.destino === "turma" && !f.turma_id) { toast.error("Escolha a turma."); return; }
    const { error } = await supabase.from("comunicados").insert({
      titulo: f.titulo, corpo: f.corpo, destino: f.destino, autor_id: userId,
      turma_id: f.destino === "turma" ? f.turma_id : null, perfil_destino: f.destino === "perfil" ? f.perfil_destino : null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(gestao ? "Comunicado publicado" : "Enviado para aprovação da secretaria"); onSaved(); onClose();
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo comunicado</DialogTitle></DialogHeader>
        <form onSubmit={salvar} className="space-y-3">
          <div><Label htmlFor="c-titulo">Título</Label><Input id="c-titulo" value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} /></div>
          <div><Label htmlFor="c-corpo">Mensagem</Label><Textarea id="c-corpo" value={f.corpo} onChange={(e) => setF({ ...f, corpo: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Destino</Label><select className={sel} value={f.destino} onChange={(e) => setF({ ...f, destino: e.target.value })}>
              {gestao && <option value="escola">Toda a escola</option>}{!gestao && <option value="escola">Toda a escola</option>}
              <option value="turma">Uma turma</option><option value="perfil">Um perfil</option></select></div>
            {f.destino === "turma" && <div><Label>Turma</Label><select className={sel} value={f.turma_id} onChange={(e) => setF({ ...f, turma_id: e.target.value })}><option value="">Selecione</option>{turmas?.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}</select></div>}
            {f.destino === "perfil" && <div><Label>Perfil</Label><select className={sel} value={f.perfil_destino} onChange={(e) => setF({ ...f, perfil_destino: e.target.value })}><option value="aluno">Alunos</option><option value="professor">Professores</option><option value="gestao">Gestão</option></select></div>}
          </div>
          <Button type="submit" className="w-full rounded-xl">{gestao ? "Publicar" : "Enviar para aprovação"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
