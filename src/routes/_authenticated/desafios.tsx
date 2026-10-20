import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trophy, Gift, Medal } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePerfil, useTurmasDisciplinas } from "@/lib/dados";

export const Route = createFileRoute("/_authenticated/desafios")({
  head: () => ({
    meta: [
      { title: "Desafios e recompensas — EduPlanner" },
      { name: "description", content: "Complete desafios, ganhe pontos e troque por recompensas." },
      { property: "og:title", content: "Desafios e recompensas — EduPlanner" },
      { property: "og:description", content: "Gamificação escolar no EduPlanner." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Desafios,
});

const sel = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";
const TIPO = { tarefas: "Tarefas concluídas", simulado: "Melhor nota em simulado", manual: "Concedido pelo professor" } as const;

function Desafios() {
  const { user } = Route.useRouteContext();
  const { data: p } = usePerfil(user.id);
  const aluno = p?.perfil === "aluno";
  const gestao = p?.perfil === "gestao";
  const qc = useQueryClient();
  const [novo, setNovo] = useState<"desafio" | "recompensa" | null>(null);
  const [conceder, setConceder] = useState<{ id: string; titulo: string } | null>(null);

  const { data } = useQuery({
    queryKey: ["desafios", user.id],
    enabled: !!p,
    queryFn: async () => {
      const [d, r, c, saldo, mat] = await Promise.all([
        supabase.from("desafios").select("*,turmas(nome)").eq("ativo", true).order("created_at"),
        supabase.from("recompensas").select("*").eq("ativo", true).order("custo"),
        supabase.from("desafio_conclusoes").select("desafio_id").eq("aluno_id", user.id),
        supabase.rpc("saldo_pontos", { _aluno: user.id }),
        supabase.from("matriculas").select("turma_id").eq("aluno_id", user.id).eq("status", "ativa").maybeSingle(),
      ]);
      const prog = aluno ? await Promise.all((d.data ?? []).map((x) => supabase.rpc("progresso_desafio", { _desafio: x.id, _aluno: user.id }).then((r) => Number(r.data ?? 0)))) : [];
      const ranking = mat.data?.turma_id ? (await supabase.rpc("ranking_turma", { _turma: mat.data.turma_id })).data ?? [] : [];
      return {
        desafios: (d.data ?? []).map((x, i) => ({ ...x, progresso: prog[i] ?? 0, feito: (c.data ?? []).some((k) => k.desafio_id === x.id) })),
        recompensas: r.data ?? [], saldo: saldo.data ?? 0, ranking,
      };
    },
  });
  const recarregar = () => qc.invalidateQueries({ queryKey: ["desafios"] });

  async function resgatar(id: string) {
    const { data: pts, error } = await supabase.rpc("resgatar_desafio", { _desafio: id });
    if (error) { toast.error(error.message); return; }
    toast.success(`+${pts} pontos!`); recarregar();
  }
  async function trocar(id: string) {
    const { error } = await supabase.rpc("trocar_recompensa", { _recompensa: id });
    if (error) { toast.error(error.message); return; }
    toast.success("Recompensa resgatada! Procure a secretaria."); recarregar();
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold">Desafios e recompensas</h1>
        <div className="flex gap-2">
          {aluno && <span className="flex items-center gap-1 rounded-xl bg-warning-soft px-3 py-2 font-bold text-warning"><Trophy className="size-5" /> {data?.saldo ?? 0} pontos</span>}
          {!aluno && <Button className="rounded-xl" onClick={() => setNovo("desafio")}><Plus /> Novo desafio</Button>}
          {gestao && <Button variant="outline" className="rounded-xl" onClick={() => setNovo("recompensa")}><Plus /> Nova recompensa</Button>}
        </div>
      </div>

      <h2 className="mt-6 font-bold">Desafios</h2>
      <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.desafios.map((d) => {
          const pct = d.tipo === "manual" ? (d.feito ? 100 : 0) : Math.min(100, (d.progresso / Number(d.meta)) * 100);
          return (
            <div key={d.id} className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between"><span className="font-bold">{d.titulo}</span><span className="rounded-full bg-warning-soft px-2 text-xs font-bold text-warning">+{d.pontos}</span></div>
              <p className="text-sm text-muted-foreground">{d.descricao} · {TIPO[d.tipo as keyof typeof TIPO]}{d.turmas?.nome ? ` · ${d.turmas.nome}` : ""}</p>
              {aluno && d.tipo !== "manual" && <><Progress value={pct} /><span className="text-xs text-muted-foreground">{d.progresso} de {Number(d.meta)}</span></>}
              {aluno && (d.feito ? <span className="font-semibold text-success">Concluído ✓</span>
                : d.tipo !== "manual" && <Button size="sm" className="mt-auto rounded-xl" disabled={pct < 100} onClick={() => resgatar(d.id)}>Resgatar pontos</Button>)}
              {!aluno && <Button size="sm" variant="outline" className="mt-auto rounded-xl" onClick={() => setConceder(d)}><Medal /> Conceder a aluno</Button>}
            </div>
          );
        })}
      </div>

      <h2 className="mt-6 font-bold">Recompensas</h2>
      <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.recompensas.map((r) => (
          <div key={r.id} className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center gap-2 font-bold"><Gift className="size-5 text-violet" />{r.titulo}</div>
            <p className="text-sm text-muted-foreground">{r.descricao}</p>
            <p className="text-sm">{r.custo} pontos{r.estoque != null ? ` · ${r.estoque} disponíveis` : ""}</p>
            {aluno && <Button size="sm" className="mt-auto rounded-xl" disabled={(data?.saldo ?? 0) < r.custo || r.estoque === 0} onClick={() => trocar(r.id)}>Trocar</Button>}
          </div>
        ))}
      </div>

      {!!data?.ranking.length && (
        <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-card">
          <h2 className="mb-2 font-bold">Ranking da turma</h2>
          {data.ranking.map((r, i) => (
            <div key={r.aluno_id} className={`flex justify-between border-t border-border py-2 text-sm ${r.aluno_id === user.id ? "font-bold text-primary" : ""}`}><span>{i + 1}º {r.nome}</span><span>{r.pontos} pts</span></div>
          ))}
        </section>
      )}
      {novo && <Novo tipo={novo} onClose={() => setNovo(null)} onSaved={recarregar} />}
      {conceder && <Conceder desafio={conceder} onClose={() => setConceder(null)} />}
    </>
  );
}

function Novo({ tipo, onClose, onSaved }: { tipo: "desafio" | "recompensa"; onClose: () => void; onSaved: () => void }) {
  const { data: base } = useTurmasDisciplinas();
  const [f, setF] = useState({ titulo: "", descricao: "", tipo: "tarefas", meta: "5", pontos: "20", turma_id: "", custo: "50", estoque: "" });
  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!f.titulo) { toast.error("Informe o título."); return; }
    const { error } = tipo === "desafio"
      ? await supabase.from("desafios").insert({ titulo: f.titulo, descricao: f.descricao, tipo: f.tipo, meta: Number(f.meta) || 1, pontos: Number(f.pontos) || 10, turma_id: f.turma_id || null })
      : await supabase.from("recompensas").insert({ titulo: f.titulo, descricao: f.descricao, custo: Number(f.custo) || 10, estoque: f.estoque ? Number(f.estoque) : null });
    if (error) { toast.error(error.message); return; }
    toast.success("Salvo"); onSaved(); onClose();
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{tipo === "desafio" ? "Novo desafio" : "Nova recompensa"}</DialogTitle></DialogHeader>
        <form onSubmit={salvar} className="space-y-3">
          <div><Label>Título</Label><Input value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} /></div>
          <div><Label>Descrição</Label><Input value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} /></div>
          {tipo === "desafio" ? (
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Tipo</Label><select className={sel} value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value })}>{Object.entries(TIPO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
              <div><Label>Meta</Label><Input value={f.meta} onChange={(e) => setF({ ...f, meta: e.target.value })} disabled={f.tipo === "manual"} /></div>
              <div><Label>Pontos</Label><Input value={f.pontos} onChange={(e) => setF({ ...f, pontos: e.target.value })} /></div>
              <div><Label>Turma</Label><select className={sel} value={f.turma_id} onChange={(e) => setF({ ...f, turma_id: e.target.value })}><option value="">Todas</option>{base?.turmas.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}</select></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Custo (pontos)</Label><Input value={f.custo} onChange={(e) => setF({ ...f, custo: e.target.value })} /></div>
              <div><Label>Estoque (vazio = ilimitado)</Label><Input value={f.estoque} onChange={(e) => setF({ ...f, estoque: e.target.value })} /></div>
            </div>
          )}
          <Button type="submit" className="w-full rounded-xl">Salvar</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Conceder({ desafio, onClose }: { desafio: { id: string; titulo: string }; onClose: () => void }) {
  const [aluno, setAluno] = useState("");
  const { data } = useQuery({
    queryKey: ["alunos-visiveis"],
    queryFn: async () => {
      const ids = [...new Set(((await supabase.from("matriculas").select("aluno_id").eq("status", "ativa")).data ?? []).map((m) => m.aluno_id))];
      return ids.length ? (await supabase.from("profiles").select("id,nome").in("id", ids).order("nome")).data ?? [] : [];
    },
  });
  async function ok() {
    if (!aluno) return;
    const { error } = await supabase.rpc("conceder_desafio", { _desafio: desafio.id, _aluno: aluno });
    if (error) { toast.error(error.message); return; }
    toast.success("Pontos concedidos"); onClose();
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Conceder: {desafio.titulo}</DialogTitle></DialogHeader>
        <select className={sel} value={aluno} onChange={(e) => setAluno(e.target.value)} aria-label="Aluno"><option value="">Selecione o aluno</option>{data?.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}</select>
        <Button className="rounded-xl" onClick={ok} disabled={!aluno}>Conceder</Button>
      </DialogContent>
    </Dialog>
  );
}
