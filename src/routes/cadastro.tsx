import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [
      { title: "Criar conta — EduPlanner" },
      { name: "description", content: "Cadastre-se como aluno no EduPlanner." },
      { property: "og:title", content: "Criar conta — EduPlanner" },
      { property: "og:description", content: "Cadastro de alunos no EduPlanner." },
    ],
  }),
  component: Cadastro,
});

const schema = z
  .object({
    nome: z.string().trim().min(3, "Informe seu nome completo").max(120),
    email: z.string().trim().email("E-mail inválido").max(255),
    telefone: z.string().trim().max(20).optional(),
    matricula: z.string().trim().max(30).optional(),
    turma_id: z.string().uuid("Escolha sua turma"),
    senha: z.string().min(10, "A senha precisa ter ao menos 10 caracteres").max(72),
    confirmar: z.string(),
  })
  .refine((d) => d.senha === d.confirmar, { message: "As senhas não conferem", path: ["confirmar"] });

function Cadastro() {
  const [turmas, setTurmas] = useState<{ id: string; nome: string }[]>([]);
  const [f, setF] = useState({ nome: "", email: "", telefone: "", matricula: "", turma_id: "", senha: "", confirmar: "" });
  const [erros, setErros] = useState<Record<string, string>>({});
  const [carregando, setCarregando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erroGeral, setErroGeral] = useState("");

  useEffect(() => {
    supabase.from("turmas").select("id,nome").order("nome").then(({ data }) => setTurmas(data ?? []));
  }, []);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErroGeral("");
    const r = schema.safeParse(f);
    if (!r.success) {
      setErros(Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message])));
      return;
    }
    setErros({});
    setCarregando(true);
    const { error } = await supabase.auth.signUp({
      email: r.data.email,
      password: r.data.senha,
      options: {
        emailRedirectTo: window.location.origin,
        data: { nome: r.data.nome, telefone: r.data.telefone, matricula: r.data.matricula, turma_id: r.data.turma_id },
      },
    });
    setCarregando(false);
    if (error) return setErroGeral("Não foi possível concluir o cadastro. Verifique os dados e tente novamente.");
    setEnviado(true);
  }

  if (enviado)
    return (
      <AuthLayout>
        <div className="text-center">
          <MailCheck className="mx-auto size-14 text-primary" />
          <h2 className="mt-4 text-2xl font-extrabold">Confira seu e-mail</h2>
          <p className="mt-2 text-muted-foreground">Enviamos um link de confirmação para <b>{f.email}</b>. Depois de confirmar, é só entrar.</p>
          <Button asChild variant="hero" className="mt-6 h-12 w-full"><Link to="/">Ir para o login</Link></Button>
        </div>
      </AuthLayout>
    );

  const campo = (k: keyof typeof f, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={k}>{label}</Label>
      <Input id={k} value={f[k]} onChange={set(k)} className="h-11 rounded-xl" aria-invalid={!!erros[k]} {...props} />
      {erros[k] && <p className="text-xs text-destructive">{erros[k]}</p>}
    </div>
  );

  return (
    <AuthLayout>
      <h2 className="text-center text-3xl font-extrabold tracking-tight">Crie sua conta</h2>
      <p className="mt-2 text-center text-muted-foreground">Cadastro de alunos. Professores e equipe são cadastrados pela secretaria.</p>
      <form onSubmit={enviar} className="mt-6 space-y-3" noValidate>
        {campo("nome", "Nome completo", { autoComplete: "name" })}
        {campo("email", "E-mail", { type: "email", autoComplete: "email" })}
        <div className="grid grid-cols-2 gap-3">
          {campo("telefone", "Telefone", { type: "tel", autoComplete: "tel" })}
          {campo("matricula", "Matrícula")}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="perfil">Perfil</Label>
            <Input id="perfil" value="Aluno" disabled className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="turma_id">Turma</Label>
            <select id="turma_id" value={f.turma_id} onChange={set("turma_id")} className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm">
              <option value="">Selecione</option>
              {turmas.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
            {erros["turma_id"] && <p className="text-xs text-destructive">{erros["turma_id"]}</p>}
          </div>
        </div>
        {campo("senha", "Senha", { type: "password", autoComplete: "new-password" })}
        {campo("confirmar", "Confirmar senha", { type: "password", autoComplete: "new-password" })}
        {erroGeral && <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-destructive">{erroGeral}</p>}
        <Button type="submit" variant="hero" className="h-12 w-full text-base" disabled={carregando}>
          {carregando && <Loader2 className="animate-spin" />} Criar conta
        </Button>
      </form>
      <p className="mt-6 text-center text-muted-foreground">Já tem conta? <Link to="/" className="font-semibold text-primary hover:underline">Entrar</Link></p>
    </AuthLayout>
  );
}
