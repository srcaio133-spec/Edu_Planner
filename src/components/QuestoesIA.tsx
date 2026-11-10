import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Check, Trash2, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
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
      toast.success(`${j.salvas} questão(ões) enviadas para a revisão da secretaria.`);
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
        <p className="text-xs text-muted-foreground">As questões entram “em revisão”: vão para a fila da secretaria e só aparecem para os alunos depois de aprovadas.</p>
        <Button className="rounded-xl" onClick={gerar} disabled={gerando}>{gerando ? <><Loader2 className="animate-spin" /> Gerando…</> : "Gerar"}</Button>
      </DialogContent>
    </Dialog>
  );
}

type Sim = { id: string; titulo: string; categoria: Categoria };

export function RevisarQuestoes({ simulados }: { simulados: Sim[] }) {
  const qc = useQueryClient();
  const [rejeitando, setRejeitando] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");
  const [destino, setDestino] = useState<Record<string, string>>({});
  const { data } = useQuery({
    queryKey: ["revisao"],
    queryFn: async () => {
      const q = (await supabase.from("questoes").select("id,area,categoria,enunciado,alternativas,figura,autor_id,disciplina_id,conteudos(titulo)").eq("status", "em_revisao").order("created_at")).data ?? [];
      const ids = q.map((x) => x.id);
      const autores = [...new Set(q.map((x) => x.autor_id).filter(Boolean))] as string[];
      const [g, a] = await Promise.all([
        ids.length ? supabase.from("questoes_gabarito").select("questao_id,correta,explicacao").in("questao_id", ids) : Promise.resolve({ data: [] }),
        autores.length ? supabase.from("profiles").select("id,nome").in("id", autores) : Promise.resolve({ data: [] }),
      ]);
      return q.map((x) => ({ ...x, gab: (g.data ?? []).find((y) => y.questao_id === x.id), autor: (a.data ?? []).find((y) => y.id === x.autor_id)?.nome }));
    },
  });
  const padrao = (cat: Categoria) => simulados.find((x) => x.categoria === cat && !x.titulo.startsWith("Simulado de "))?.id ?? "";
  async function avaliar(id: string, aprovar: boolean, sim?: string) {
    const { error } = await supabase.rpc("avaliar_questao", { _id: id, _aprovar: aprovar, _motivo: aprovar ? "" : motivo.trim(), _simulado: (aprovar && sim) || null as never });
    if (error) { toast.error(error.message); return; }
    toast.success(aprovar ? "Questão aprovada" : "Questão rejeitada; o autor foi avisado");
    setRejeitando(null); setMotivo("");
    qc.invalidateQueries({ queryKey: ["revisao"] }); qc.invalidateQueries({ queryKey: ["simulados"] });
  }
  return (
    <section className="mt-6 rounded-2xl border border-warning bg-warning-soft/30 p-4">
      <h2 className="font-bold">Questões para revisar ({data?.length ?? 0})</h2>
      {data && !data.length && <p className="mt-1 text-sm text-muted-foreground">Nenhuma questão esperando revisão.</p>}
      {data?.map((q) => {
        const sim = destino[q.id] ?? padrao(q.categoria);
        return (
        <div key={q.id} className="mt-3 rounded-xl bg-card p-4">
          <div className="text-xs text-muted-foreground">{q.area}{q.conteudos ? ` · ${q.conteudos.titulo}` : ""} · {CATEGORIAS.find((c) => c.id === q.categoria)?.nome}{q.autor ? ` · por ${q.autor}` : ""}</div>
          <p className="mt-1 font-medium">{q.enunciado}</p>
          {q.figura ? <FiguraSvg spec={q.figura} className="max-w-sm" /> : null}
          <ol className="mt-2 space-y-1 text-sm">{(q.alternativas as string[]).map((a, k) => <li key={k} className={k === q.gab?.correta ? "font-semibold text-success" : ""}>{LETRAS[k]}) {a}{k === q.gab?.correta ? " ✓" : ""}</li>)}</ol>
          <p className="mt-2 text-sm text-muted-foreground">{q.gab?.explicacao}</p>
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <div className="min-w-56"><Label htmlFor={`sim-${q.id}`} className="text-xs">Incluir no simulado</Label>
              <select id={`sim-${q.id}`} className={sel} value={sim} onChange={(e) => setDestino({ ...destino, [q.id]: e.target.value })}><option value="">Nenhum (só banco de questões)</option>{simulados.map((s) => <option key={s.id} value={s.id}>{s.titulo}</option>)}</select></div>
            <Button size="sm" onClick={() => avaliar(q.id, true, sim)}><Check /> Aprovar</Button>
            <Button size="sm" variant="outline" onClick={() => { setRejeitando(q.id); setMotivo(""); }}><X /> Rejeitar</Button>
          </div>
        </div>);
      })}
      {rejeitando && (
        <Dialog open onOpenChange={(o) => !o && setRejeitando(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Rejeitar questão</DialogTitle></DialogHeader>
            <Label htmlFor="motivo">Motivo (o autor verá)</Label>
            <Textarea id="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={500} placeholder="Ex.: gabarito incorreto, enunciado ambíguo…" />
            <Button disabled={!motivo.trim()} onClick={() => avaliar(rejeitando, false)}>Confirmar rejeição</Button>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}

const SELO: Record<string, { t: string; c: string }> = {
  em_revisao: { t: "Em revisão", c: "bg-warning-soft text-warning" },
  aprovada: { t: "Aprovada", c: "bg-success-soft text-success" },
  rejeitada: { t: "Rejeitada", c: "bg-destructive/10 text-destructive" },
};

export function MinhasQuestoes({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["revisao", "minhas", userId],
    queryFn: async () => (await supabase.from("questoes").select("id,enunciado,status,motivo_rejeicao,area,created_at").eq("autor_id", userId).order("created_at", { ascending: false }).limit(30)).data ?? [],
  });
  async function excluir(id: string) {
    const { error } = await supabase.from("questoes").delete().eq("id", id);
    if (error) { toast.error("Não foi possível excluir."); return; }
    qc.invalidateQueries({ queryKey: ["revisao"] });
  }
  if (!data?.length) return null;
  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-card">
      <h2 className="font-bold">Minhas questões</h2>
      <p className="text-xs text-muted-foreground">Questões novas só aparecem para os alunos depois que a secretaria aprovar.</p>
      {data.map((q) => (
        <div key={q.id} className="mt-2 flex items-start gap-3 border-t border-border pt-2 text-sm">
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${SELO[q.status]?.c ?? ""}`}>{SELO[q.status]?.t ?? q.status}</span>
          <div className="flex-1"><p className="line-clamp-2">{q.enunciado}</p>{q.status === "rejeitada" && q.motivo_rejeicao && <p className="mt-0.5 text-xs text-destructive">Motivo: {q.motivo_rejeicao}</p>}</div>
          {q.status !== "aprovada" && <Button size="icon" variant="ghost" aria-label="Excluir questão" onClick={() => excluir(q.id)}><Trash2 className="size-4" /></Button>}
        </div>
      ))}
    </section>
  );
}
