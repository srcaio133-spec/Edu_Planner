import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePerfil } from "@/lib/dados";

export const Route = createFileRoute("/_authenticated/turmas")({
  head: () => ({
    meta: [
      { title: "Turmas — EduPlanner" },
      { name: "description", content: "Cadastro de turmas, matrículas e professores." },
      { property: "og:title", content: "Turmas — EduPlanner" },
      { property: "og:description", content: "Gestão de turmas no EduPlanner." },
    ],
  }),
  component: Turmas,
});

function Turmas() {
  const { user } = Route.useRouteContext();
  const { data: p } = usePerfil(user.id);
  const qc = useQueryClient();
  const [nome, setNome] = useState("");
  const [aberta, setAberta] = useState<{ id: string; nome: string } | null>(null);
  const { data } = useQuery({
    queryKey: ["turmas-gestao"],
    queryFn: async () => {
      const [t, m] = await Promise.all([supabase.from("turmas").select("*").order("nome"), supabase.from("matriculas").select("turma_id")]);
      const cont = new Map<string, number>();
      (m.data ?? []).forEach((x) => cont.set(x.turma_id, (cont.get(x.turma_id) ?? 0) + 1));
      return (t.data ?? []).map((x) => ({ ...x, alunos: cont.get(x.id) ?? 0 }));
    },
  });
  if (p && p.perfil !== "gestao") return <p className="text-muted-foreground">Área restrita à gestão escolar.</p>;
  const recarregar = () => { qc.invalidateQueries({ queryKey: ["turmas-gestao"] }); qc.invalidateQueries({ queryKey: ["base"] }); };

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    const { error } = await supabase.from("turmas").insert({ nome: nome.trim() });
    if (error) { toast.error(error.message); return; }
    setNome(""); toast.success("Turma criada"); recarregar();
  }
  async function excluir(id: string) {
    if (!confirm("Excluir esta turma?")) return;
    const { error } = await supabase.from("turmas").delete().eq("id", id);
    if (error) { toast.error("Não foi possível excluir: a turma possui registros vinculados."); return; }
    recarregar();
  }
  return (
    <>
      <h1 className="text-3xl font-extrabold">Turmas</h1>
      <form onSubmit={criar} className="mt-4 flex max-w-md gap-2">
        <Input placeholder="Ex.: 9º Ano A" value={nome} onChange={(e) => setNome(e.target.value)} />
        <Button type="submit" className="rounded-xl"><Plus /> Criar</Button>
      </form>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(data ?? []).map((t) => (
          <div key={t.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="flex items-start justify-between"><div><div className="font-bold">{t.nome}</div><div className="text-sm text-muted-foreground">{t.ano_letivo} · {t.alunos} aluno(s)</div></div>
              <Button size="icon" variant="ghost" aria-label="Excluir" onClick={() => excluir(t.id)}><Trash2 /></Button></div>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => setAberta(t)}><UserPlus /> Alunos e professores</Button>
          </div>
        ))}
      </div>
      {aberta && <GerirTurma turma={aberta} onClose={() => { setAberta(null); recarregar(); }} />}
    </>
  );
}

function GerirTurma({ turma, onClose }: { turma: { id: string; nome: string }; onClose: () => void }) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["gerir", turma.id],
    queryFn: async () => {
      const [m, td, perfis, roles, disc] = await Promise.all([
        supabase.from("matriculas").select("id,aluno_id").eq("turma_id", turma.id),
        supabase.from("turma_disciplinas").select("id,disciplina_id,professor_id,disciplinas(nome)").eq("turma_id", turma.id),
        supabase.from("profiles").select("id,nome,email").order("nome"),
        supabase.from("user_roles").select("user_id,role"),
        supabase.from("disciplinas").select("id,nome").order("nome"),
      ]);
      const r = roles.data ?? [];
      const ps = perfis.data ?? [];
      return {
        matriculas: m.data ?? [], vinculos: td.data ?? [], disciplinas: disc.data ?? [],
        alunos: ps.filter((x) => r.some((y) => y.user_id === x.id && y.role === "aluno")),
        professores: ps.filter((x) => r.some((y) => y.user_id === x.id && y.role === "professor")),
        nome: new Map(ps.map((x) => [x.id, x.nome || x.email || "—"])),
      };
    },
  });
  const [aluno, setAluno] = useState("");
  const [disc, setDisc] = useState("");
  const [prof, setProf] = useState("");
  const rec = () => qc.invalidateQueries({ queryKey: ["gerir", turma.id] });
  async function op(promise: PromiseLike<{ error: { message: string } | null }>) {
    const { error } = await promise; if (error) toast.error(error.message); else rec();
  }
  const sel = "h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm";
  const livres = (data?.alunos ?? []).filter((a) => !data?.matriculas.some((m) => m.aluno_id === a.id));
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{turma.nome}</DialogTitle></DialogHeader>
        <h3 className="font-semibold">Alunos matriculados</h3>
        <div className="flex gap-2">
          <select className={sel} value={aluno} onChange={(e) => setAluno(e.target.value)}><option value="">Selecione um aluno</option>{livres.map((a) => <option key={a.id} value={a.id}>{a.nome || a.email}</option>)}</select>
          <Button disabled={!aluno} onClick={() => { op(supabase.from("matriculas").insert({ turma_id: turma.id, aluno_id: aluno })); setAluno(""); }}>Matricular</Button>
        </div>
        <div className="max-h-40 overflow-auto">
          {data?.matriculas.map((m) => <div key={m.id} className="flex items-center justify-between border-t border-border py-1.5 text-sm">{data.nome.get(m.aluno_id) ?? "Aluno"}<button aria-label="Remover" onClick={() => op(supabase.from("matriculas").delete().eq("id", m.id))}><X className="size-4" /></button></div>)}
          {data?.matriculas.length === 0 && <p className="text-sm text-muted-foreground">Nenhum aluno.</p>}
        </div>
        <h3 className="mt-2 font-semibold">Disciplinas e professores</h3>
        <div className="flex flex-wrap gap-2">
          <select className={sel} value={disc} onChange={(e) => setDisc(e.target.value)}><option value="">Disciplina</option>{data?.disciplinas.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}</select>
          <select className={sel} value={prof} onChange={(e) => setProf(e.target.value)}><option value="">Professor</option>{data?.professores.map((d) => <option key={d.id} value={d.id}>{d.nome || d.email}</option>)}</select>
          <Button disabled={!disc} onClick={() => { op(supabase.from("turma_disciplinas").insert({ turma_id: turma.id, disciplina_id: disc, professor_id: prof || null, professor_nome: prof ? data?.nome.get(prof) ?? "" : "" })); setDisc(""); setProf(""); }}>Vincular</Button>
        </div>
        <div className="max-h-40 overflow-auto">
          {data?.vinculos.map((v) => <div key={v.id} className="flex items-center justify-between border-t border-border py-1.5 text-sm">{v.disciplinas?.nome} · {v.professor_id ? data.nome.get(v.professor_id) : "sem professor"}<button aria-label="Remover" onClick={() => op(supabase.from("turma_disciplinas").delete().eq("id", v.id))}><X className="size-4" /></button></div>)}
        </div>
      </DialogContent>
    </Dialog>
  );
}
