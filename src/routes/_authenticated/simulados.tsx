import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Plus, Play, Timer, CheckCircle2, XCircle, Trophy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePerfil, fmtData, fmtNota, useTurmasDisciplinas } from "@/lib/dados";
import { CATEGORIAS, LETRAS, type Categoria } from "@/lib/simulados";

export const Route = createFileRoute("/_authenticated/simulados")({
  head: () => ({
    meta: [
      { title: "Simulados ENEM, SSA, Vestibulares e Concursos — EduPlanner" },
      { name: "description", content: "Resolva simulados no estilo ENEM, SSA, vestibulares e concursos com correção e explicações." },
      { property: "og:title", content: "Simulados — EduPlanner" },
      { property: "og:description", content: "Simulados ENEM, SSA, vestibulares e concursos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Simulados,
});

type Questao = { id: string; area: string; enunciado: string; alternativas: string[] };
type Resultado = { acertos: number; total: number; nota: number; gabarito: Record<string, { correta: number; explicacao: string }> };

function Simulados() {
  const { user } = Route.useRouteContext();
  const { data: p } = usePerfil(user.id);
  const gere = p?.perfil === "professor" || p?.perfil === "gestao";
  const [cat, setCat] = useState<Categoria | "todos">("todos");
  const [fazendo, setFazendo] = useState<{ id: string; titulo: string; duracao_min: number } | null>(null);
  const [nova, setNova] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["simulados"],
    queryFn: async () => {
      const [s, t] = await Promise.all([
        supabase.from("simulados").select("id,titulo,categoria,duracao_min,simulado_questoes(questoes(disciplina_id))").order("created_at"),
        supabase.from("tentativas").select("id,simulado_id,nota,acertos,total,created_at").eq("aluno_id", user.id).order("created_at", { ascending: false }),
      ]);
      return { simulados: s.data ?? [], tentativas: t.data ?? [] };
    },
  });
  const { data: base } = useTurmasDisciplinas();
  const [disc, setDisc] = useState("");
  const lista = (data?.simulados ?? []).filter((s) => (cat === "todos" || s.categoria === cat)
    && (!disc || s.simulado_questoes.some((x) => x.questoes?.disciplina_id === disc)));

  if (fazendo) return <Resolver sim={fazendo} onSair={() => setFazendo(null)} />;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Simulados</h1>
          <p className="text-muted-foreground">ENEM, SSA, vestibulares e concursos.</p>
        </div>
        {gere && <Button className="rounded-xl" onClick={() => setNova(true)}><Plus /> Nova questão</Button>}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <select aria-label="Disciplina" className="h-9 rounded-full border border-input bg-background px-3 text-sm" value={disc} onChange={(e) => setDisc(e.target.value)}>
          <option value="">Todas as disciplinas</option>
          {base?.disciplinas.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
        </select>
        {[{ id: "todos", nome: "Todos" } as const, ...CATEGORIAS].map((c) => (
          <Button key={c.id} size="sm" variant={cat === c.id ? "default" : "outline"} className="rounded-full" onClick={() => setCat(c.id)}>{c.nome}</Button>
        ))}
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading && [1, 2, 3].map((i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
        {lista.map((s) => {
          const ts = (data?.tentativas ?? []).filter((t) => t.simulado_id === s.id);
          const melhor = ts.length ? Math.max(...ts.map((t) => Number(t.nota))) : null;
          const n = s.simulado_questoes.length;
          return (
            <div key={s.id} className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-card">
              <span className="w-fit rounded-full bg-sky-soft px-2 py-0.5 text-xs font-semibold text-primary">{CATEGORIAS.find((c) => c.id === s.categoria)?.nome}</span>
              <h2 className="mt-2 font-bold">{s.titulo}</h2>
              <p className="text-sm text-muted-foreground">{n} questões · {s.duracao_min} min</p>
              {melhor != null && <p className="mt-1 flex items-center gap-1 text-sm"><Trophy className="size-4 text-warning" /> Melhor nota: {fmtNota(melhor)} ({ts.length} tentativa{ts.length > 1 ? "s" : ""})</p>}
              <Button className="mt-auto rounded-xl pt-2" disabled={!n} onClick={() => setFazendo(s)}><Play /> Iniciar</Button>
            </div>
          );
        })}
        {data && lista.length === 0 && <p className="col-span-full rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">Nenhum simulado nesta categoria.</p>}
      </div>
      {!!data?.tentativas.length && (
        <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-card">
          <h2 className="mb-2 font-bold">Meu histórico</h2>
          {data.tentativas.slice(0, 10).map((t) => (
            <div key={t.id} className="flex justify-between border-t border-border py-2 text-sm">
              <span>{data.simulados.find((s) => s.id === t.simulado_id)?.titulo}</span>
              <span className="text-muted-foreground">{t.acertos}/{t.total} · nota {fmtNota(Number(t.nota))} · {fmtData(t.created_at)}</span>
            </div>
          ))}
        </section>
      )}
      {nova && <NovaQuestao simulados={data?.simulados ?? []} onClose={() => setNova(false)} />}
    </>
  );
}

function Resolver({ sim, onSair }: { sim: { id: string; titulo: string; duracao_min: number }; onSair: () => void }) {
  const qc = useQueryClient();
  const [resp, setResp] = useState<Record<string, number>>({});
  const [res, setRes] = useState<Resultado | null>(null);
  const [resta, setResta] = useState(sim.duracao_min * 60);
  const { data: qs } = useQuery({
    queryKey: ["simulado", sim.id],
    queryFn: async () => {
      const { data } = await supabase.from("simulado_questoes").select("ordem,questoes(id,area,enunciado,alternativas)").eq("simulado_id", sim.id).order("ordem");
      return (data ?? []).map((x) => x.questoes as unknown as Questao).filter(Boolean);
    },
  });

  async function enviar() {
    const { data, error } = await supabase.rpc("enviar_tentativa", { _simulado: sim.id, _respostas: resp });
    if (error) { toast.error("Não foi possível enviar. Tente novamente."); return; }
    setRes(data as unknown as Resultado);
    qc.invalidateQueries({ queryKey: ["simulados"] });
    qc.invalidateQueries({ queryKey: ["painel"] });
  }

  useEffect(() => {
    if (res) return;
    if (resta <= 0) { toast.info("Tempo esgotado! Enviando respostas."); void enviar(); return; }
    const t = setTimeout(() => setResta((r) => r - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resta, res]);

  const mm = String(Math.floor(resta / 60)).padStart(2, "0");
  const ss = String(resta % 60).padStart(2, "0");

  return (
    <>
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 bg-background py-2">
        <h1 className="text-2xl font-extrabold">{sim.titulo}</h1>
        {res ? <span className="rounded-xl bg-success-soft px-3 py-1 font-bold text-success">Nota {fmtNota(Number(res.nota))} · {res.acertos}/{res.total}</span>
          : <span className={`flex items-center gap-1 rounded-xl px-3 py-1 font-mono font-bold ${resta < 60 ? "bg-danger-soft text-destructive" : "bg-sky-soft text-primary"}`}><Timer className="size-4" />{mm}:{ss}</span>}
      </div>
      <div className="mt-4 space-y-4">
        {!qs && <Skeleton className="h-40 rounded-2xl" />}
        {qs?.map((q, i) => {
          const g = res?.gabarito[q.id];
          return (
            <div key={q.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="text-xs font-semibold text-muted-foreground">Questão {i + 1} · {q.area}</div>
              <p className="mt-1 font-medium">{q.enunciado}</p>
              <div className="mt-3 space-y-2">
                {q.alternativas.map((a, j) => {
                  const marcada = resp[q.id] === j;
                  const cls = g ? (j === g.correta ? "border-success bg-success-soft" : marcada ? "border-destructive bg-danger-soft" : "border-border")
                    : marcada ? "border-primary bg-sky-soft" : "border-border hover:bg-accent";
                  return (
                    <button key={j} disabled={!!res} onClick={() => setResp({ ...resp, [q.id]: j })} className={`flex w-full gap-2 rounded-xl border px-3 py-2 text-left text-sm ${cls}`}>
                      <b>{LETRAS[j]})</b> {a}
                    </button>
                  );
                })}
              </div>
              {g && (
                <p className="mt-3 flex gap-2 text-sm">
                  {resp[q.id] === g.correta ? <CheckCircle2 className="size-5 shrink-0 text-success" /> : <XCircle className="size-5 shrink-0 text-destructive" />}
                  <span><b>Gabarito {LETRAS[g.correta]}.</b> {g.explicacao}</span>
                </p>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex gap-2">
        {!res && <Button className="rounded-xl" onClick={() => { if (Object.keys(resp).length < (qs?.length ?? 0) && !confirm("Há questões sem resposta. Enviar mesmo assim?")) return; void enviar(); }}>Enviar respostas</Button>}
        <Button variant="outline" className="rounded-xl" onClick={() => { if (!res && !confirm("Sair sem enviar?")) return; onSair(); }}>Voltar</Button>
      </div>
    </>
  );
}

function NovaQuestao({ simulados, onClose }: { simulados: { id: string; titulo: string; categoria: Categoria }[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [f, setF] = useState({ categoria: "enem" as Categoria, area: "", enunciado: "", alts: ["", "", "", "", ""], correta: 0, explicacao: "", simulado_id: "" });
  const sel = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";
  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!f.area || !f.enunciado || f.alts.some((a) => !a.trim())) { toast.error("Preencha área, enunciado e as 5 alternativas."); return; }
    const { data: q, error } = await supabase.from("questoes").insert({ categoria: f.categoria, area: f.area, enunciado: f.enunciado, alternativas: f.alts }).select("id").single();
    if (error || !q) { toast.error("Não foi possível salvar."); return; }
    const g = await supabase.from("questoes_gabarito").insert({ questao_id: q.id, correta: f.correta, explicacao: f.explicacao });
    if (g.error) { toast.error("Não foi possível salvar o gabarito."); return; }
    if (f.simulado_id) await supabase.from("simulado_questoes").insert({ simulado_id: f.simulado_id, questao_id: q.id, ordem: 99 });
    toast.success("Questão criada");
    qc.invalidateQueries({ queryKey: ["simulados"] });
    onClose();
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nova questão</DialogTitle></DialogHeader>
        <p className="text-xs text-muted-foreground">Dica: peça ao EduMind para gerar questões no estilo da prova e cole aqui.</p>
        <form onSubmit={salvar} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Categoria</Label><select className={sel} value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value as Categoria })}>{CATEGORIAS.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>
            <div><Label>Área / matéria</Label><Input value={f.area} onChange={(e) => setF({ ...f, area: e.target.value })} /></div>
          </div>
          <div><Label>Enunciado</Label><Textarea value={f.enunciado} onChange={(e) => setF({ ...f, enunciado: e.target.value })} /></div>
          {f.alts.map((a, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="radio" name="correta" checked={f.correta === i} onChange={() => setF({ ...f, correta: i })} aria-label={`Correta ${LETRAS[i]}`} />
              <b className="w-4">{LETRAS[i]}</b>
              <Input value={a} onChange={(e) => { const alts = [...f.alts]; alts[i] = e.target.value; setF({ ...f, alts }); }} />
            </div>
          ))}
          <div><Label>Explicação</Label><Textarea value={f.explicacao} onChange={(e) => setF({ ...f, explicacao: e.target.value })} /></div>
          <div><Label>Adicionar ao simulado</Label><select className={sel} value={f.simulado_id} onChange={(e) => setF({ ...f, simulado_id: e.target.value })}><option value="">Nenhum</option>{simulados.filter((s) => s.categoria === f.categoria).map((s) => <option key={s.id} value={s.id}>{s.titulo}</option>)}</select></div>
          <Button type="submit" className="w-full rounded-xl">Salvar</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
