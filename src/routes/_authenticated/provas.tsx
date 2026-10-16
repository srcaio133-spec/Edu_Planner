import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, PenLine } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fmtData, localParaIso, usePerfil, useTurmasDisciplinas } from "@/lib/dados";

export const Route = createFileRoute("/_authenticated/provas")({
  head: () => ({
    meta: [
      { title: "Provas — EduPlanner" },
      { name: "description", content: "Calendário de provas e lançamento de notas." },
      { property: "og:title", content: "Provas — EduPlanner" },
      { property: "og:description", content: "Provas por turma e disciplina." },
    ],
  }),
  component: Provas,
});

function Provas() {
  const { user } = Route.useRouteContext();
  const { data: p } = usePerfil(user.id);
  const gere = p?.perfil === "professor" || p?.perfil === "gestao";
  const qc = useQueryClient();
  const [nova, setNova] = useState(false);
  const [lancar, setLancar] = useState<{ id: string; turma_id: string; titulo: string } | null>(null);
  const { data } = useQuery({
    queryKey: ["provas"],
    queryFn: async () => (await supabase.from("provas").select("*,disciplinas(nome),turmas(nome)").order("data")).data ?? [],
  });
  const recarregar = () => qc.invalidateQueries({ queryKey: ["provas"] });
  async function excluir(id: string) {
    if (!confirm("Excluir esta prova?")) return;
    const { error } = await supabase.from("provas").delete().eq("id", id);
    if (error) return toast.error(error.message);
    recarregar();
  }
  const agora = Date.now();
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold">Provas</h1>
        {gere && <Button className="rounded-xl" onClick={() => setNova(true)}><Plus /> Nova prova</Button>}
      </div>
      <div className="mt-4 space-y-3">
        {(data ?? []).map((pr) => (
          <div key={pr.id} className={`flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card ${new Date(pr.data).getTime() < agora ? "opacity-70" : ""}`}>
            <div className="min-w-0 flex-1">
              <div className="font-semibold">{pr.titulo}</div>
              <div className="text-sm text-muted-foreground">{pr.disciplinas?.nome} · {pr.turmas?.nome} · {fmtData(pr.data)} · peso {String(pr.peso).replace(".", ",")}</div>
              {pr.conteudo && <p className="mt-1 text-sm">Conteúdo: {pr.conteudo}</p>}
            </div>
            {gere && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setLancar(pr)}><PenLine /> Notas</Button>
                <Button size="icon" variant="ghost" aria-label="Excluir" onClick={() => excluir(pr.id)}><Trash2 /></Button>
              </div>
            )}
          </div>
        ))}
        {data && data.length === 0 && <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">Nenhuma prova cadastrada.</p>}
      </div>
      {nova && <NovaProva onClose={() => setNova(false)} onSaved={recarregar} />}
      {lancar && <LancarNotas prova={lancar} onClose={() => setLancar(null)} />}
    </>
  );
}

function NovaProva({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { data: base } = useTurmasDisciplinas();
  const [f, setF] = useState({ titulo: "", conteudo: "", turma_id: "", disciplina_id: "", data: "", peso: "1" });
  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!f.titulo || !f.turma_id || !f.disciplina_id || !f.data) return toast.error("Preencha todos os campos obrigatórios.");
    const { error } = await supabase.from("provas").insert({ ...f, data: localParaIso(f.data), peso: Number(f.peso.replace(",", ".")) || 1 });
    if (error) return toast.error(error.message);
    toast.success("Prova criada"); onSaved(); onClose();
  }
  const sel = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova prova</DialogTitle></DialogHeader>
        <form onSubmit={salvar} className="space-y-3">
          <div><Label>Título</Label><Input value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} /></div>
          <div><Label>Conteúdo</Label><Textarea value={f.conteudo} onChange={(e) => setF({ ...f, conteudo: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Turma</Label><select className={sel} value={f.turma_id} onChange={(e) => setF({ ...f, turma_id: e.target.value })}><option value="">Selecione</option>{base?.turmas.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}</select></div>
            <div><Label>Disciplina</Label><select className={sel} value={f.disciplina_id} onChange={(e) => setF({ ...f, disciplina_id: e.target.value })}><option value="">Selecione</option>{base?.disciplinas.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}</select></div>
            <div><Label>Data</Label><Input type="datetime-local" value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} /></div>
            <div><Label>Peso</Label><Input value={f.peso} onChange={(e) => setF({ ...f, peso: e.target.value })} /></div>
          </div>
          <Button type="submit" className="w-full rounded-xl">Salvar</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LancarNotas({ prova, onClose }: { prova: { id: string; turma_id: string; titulo: string }; onClose: () => void }) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["lancar", prova.id],
    queryFn: async () => {
      const m = (await supabase.from("matriculas").select("aluno_id").eq("turma_id", prova.turma_id).eq("status", "ativa")).data ?? [];
      const ids = m.map((x) => x.aluno_id);
      const [perf, notas] = await Promise.all([
        ids.length ? supabase.from("profiles").select("id,nome").in("id", ids) : Promise.resolve({ data: [] as { id: string; nome: string }[] }),
        supabase.from("notas").select("id,aluno_id,valor").eq("prova_id", prova.id),
      ]);
      const nomes = new Map((perf.data ?? []).map((x) => [x.id, x.nome]));
      const n = new Map((notas.data ?? []).map((x) => [x.aluno_id, x]));
      return ids.map((id) => ({ id, nome: nomes.get(id) || "Aluno", nota: n.get(id) }));
    },
  });
  const [valores, setValores] = useState<Record<string, string>>({});
  async function salvar() {
    for (const a of data ?? []) {
      const v = valores[a.id];
      if (v == null || v === "") continue;
      const valor = Number(v.replace(",", "."));
      if (isNaN(valor) || valor < 0 || valor > 10) return toast.error(`Nota inválida para ${a.nome} (0 a 10).`);
      const { error } = a.nota
        ? await supabase.from("notas").update({ valor }).eq("id", a.nota.id)
        : await supabase.from("notas").insert({ prova_id: prova.id, aluno_id: a.id, valor });
      if (error) return toast.error(error.message);
    }
    toast.success("Notas salvas");
    qc.invalidateQueries({ queryKey: ["lancar", prova.id] });
    qc.invalidateQueries({ queryKey: ["notas"] });
    onClose();
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Notas — {prova.titulo}</DialogTitle></DialogHeader>
        {data?.length === 0 && <p className="text-sm text-muted-foreground">Nenhum aluno matriculado nesta turma.</p>}
        <div className="max-h-96 space-y-2 overflow-auto">
          {data?.map((a) => (
            <div key={a.id} className="flex items-center gap-3"><span className="flex-1 text-sm">{a.nome}</span>
              <Input className="w-24" placeholder="0–10" defaultValue={a.nota ? String(a.nota.valor).replace(".", ",") : ""} onChange={(e) => setValores({ ...valores, [a.id]: e.target.value })} />
            </div>
          ))}
        </div>
        {!!data?.length && <Button className="rounded-xl" onClick={salvar}>Salvar notas</Button>}
      </DialogContent>
    </Dialog>
  );
}
