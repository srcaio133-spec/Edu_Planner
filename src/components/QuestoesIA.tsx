import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FiguraSvg } from "@/components/FiguraSvg";
import { useTurmasDisciplinas } from "@/lib/dados";
import { CATEGORIAS, LETRAS, type Categoria } from "@/lib/simulados";

const sel = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

export function GerarQuestoesIA({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { data: base } = useTurmasDisciplinas();
  const { data: conteudos } = useQuery({ queryKey: ["conteudos"], queryFn: async () => (await supabase.from("conteudos").select("id,titulo,disciplina_id").order("ordem")).data ?? [] });
  const [f, setF] = useState({ disciplina_id: "", conteudo_id: "", categoria: "enem" as Categoria, quantidade: 3 });
  const [gerando, setGerando] = useState(false);
  async function gerar() {
    if (!f.disciplina_id) { toast.error("Escolha a disciplina."); return; }
    setGerando(true);
    try {
      const { data: s } = await supabase.auth.getSession();
      const r = await fetch("/api/questoes-ia", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${s.session?.access_token ?? ""}` },
        body: JSON.stringify({ ...f, conteudo_id: f.conteudo_id || null }),
      });
      const j = (await r.json()) as { salvas?: number; error?: string };
      if (!r.ok) { toast.error(j.error ?? "Erro ao gerar."); return; }
      toast.success(`${j.salvas} questão(ões) geradas. Revise antes de usar.`);
      qc.invalidateQueries({ queryKey: ["revisao"] });
      onClose();
    } finally { setGerando(false); }
  }
  return (
    <Dialog open onOpenChange={(o) => !o && !gerando && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Gerar questões com EduMind</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Disciplina</Label><select className={sel} value={f.disciplina_id} onChange={(e) => setF({ ...f, disciplina_id: e.target.value, conteudo_id: "" })}><option value="">Selecione</option>{base?.disciplinas.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}</select></div>
          <div><Label>Conteúdo</Label><select className={sel} value={f.conteudo_id} onChange={(e) => setF({ ...f, conteudo_id: e.target.value })}><option value="">Qualquer</option>{conteudos?.filter((c) => c.disciplina_id === f.disciplina_id).map((c) => <option key={c.id} value={c.id}>{c.titulo}</option>)}</select></div>
          <div><Label>Estilo</Label><select className={sel} value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value as Categoria })}>{CATEGORIAS.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>
          <div><Label>Quantidade</Label><select className={sel} value={f.quantidade} onChange={(e) => setF({ ...f, quantidade: Number(e.target.value) })}>{[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}</select></div>
        </div>
        <p className="text-xs text-muted-foreground">As questões entram “em revisão”: só aparecem para os alunos depois que você aprovar.</p>
        <Button className="rounded-xl" onClick={gerar} disabled={gerando}>{gerando ? <><Loader2 className="animate-spin" /> Gerando…</> : "Gerar"}</Button>
      </DialogContent>
    </Dialog>
  );
}

export function RevisarQuestoes({ simulados }: { simulados: { id: string; titulo: string; categoria: Categoria }[] }) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["revisao"],
    queryFn: async () => {
      const q = (await supabase.from("questoes").select("id,area,categoria,enunciado,alternativas,figura,conteudos(titulo)").eq("status", "em_revisao").order("created_at")).data ?? [];
      const g = q.length ? (await supabase.from("questoes_gabarito").select("questao_id,correta,explicacao").in("questao_id", q.map((x) => x.id))).data ?? [] : [];
      return q.map((x) => ({ ...x, gab: g.find((y) => y.questao_id === x.id) }));
    },
  });
  async function aprovar(id: string, categoria: Categoria) {
    const { error } = await supabase.from("questoes").update({ status: "aprovada" }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    const s = simulados.find((x) => x.categoria === categoria && !x.titulo.startsWith("Simulado de "));
    if (s) await supabase.from("simulado_questoes").insert({ simulado_id: s.id, questao_id: id, ordem: 99 });
    toast.success(s ? `Aprovada e adicionada a "${s.titulo}"` : "Aprovada");
    qc.invalidateQueries({ queryKey: ["revisao"] }); qc.invalidateQueries({ queryKey: ["simulados"] });
  }
  async function descartar(id: string) {
    await supabase.from("questoes").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["revisao"] });
  }
  if (!data?.length) return null;
  return (
    <section className="mt-6 rounded-2xl border border-warning bg-warning-soft/30 p-4">
      <h2 className="font-bold">Questões em revisão ({data.length})</h2>
      {data.map((q) => (
        <div key={q.id} className="mt-3 rounded-xl bg-card p-4">
          <div className="text-xs text-muted-foreground">{q.area}{q.conteudos ? ` · ${q.conteudos.titulo}` : ""} · {CATEGORIAS.find((c) => c.id === q.categoria)?.nome}</div>
          <p className="mt-1 font-medium">{q.enunciado}</p>
          {q.figura ? <FiguraSvg spec={q.figura} className="max-w-sm" /> : null}
          <ol className="mt-2 space-y-1 text-sm">{(q.alternativas as string[]).map((a, k) => <li key={k} className={k === q.gab?.correta ? "font-semibold text-success" : ""}>{LETRAS[k]}) {a}</li>)}</ol>
          <p className="mt-2 text-sm text-muted-foreground">{q.gab?.explicacao}</p>
          <div className="mt-2 flex gap-2">
            <Button size="sm" onClick={() => aprovar(q.id, q.categoria)}><Check /> Aprovar</Button>
            <Button size="sm" variant="outline" onClick={() => descartar(q.id)}><Trash2 /> Descartar</Button>
          </div>
        </div>
      ))}
    </section>
  );
}
