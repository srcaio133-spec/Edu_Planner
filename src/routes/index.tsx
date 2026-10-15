import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Lock, LogIn, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { AuthLayout, GoogleIcon, MicrosoftIcon } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Entrar — EduPlanner" },
      { name: "description", content: "Acesse o EduPlanner: tarefas, provas, notas e calendário escolar em um só lugar." },
      { property: "og:title", content: "Entrar — EduPlanner" },
      { property: "og:description", content: "Organize seus estudos. Alcance seus objetivos." },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [ver, setVer] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/painel", replace: true });
    });
  }, [navigate]);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
    setCarregando(false);
    if (error) {
      setErro(error.message.toLowerCase().includes("confirm") ? "Confirme seu e-mail antes de entrar." : "E-mail ou senha inválidos.");
      return;
    }
    navigate({ to: "/painel", replace: true });
  }

  async function social(p: "google" | "microsoft") {
    const r = await lovable.auth.signInWithOAuth(p, { redirect_uri: window.location.origin });
    if (r.error) {
      toast.error("Não foi possível entrar. Tente novamente.");
      return;
    }
    if (r.redirected) return;
    navigate({ to: "/painel", replace: true });
  }

  async function esqueci() {
    if (!email.trim()) return setErro("Informe seu e-mail acima para recuperar a senha.");
    await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
    toast.success("Se o e-mail estiver cadastrado, você receberá um link de recuperação.");
  }

  return (
    <AuthLayout>
      <div className="text-center">
        <h2 className="text-3xl font-extrabold tracking-tight">Bem-vindo de volta!</h2>
        <p className="mt-2 text-muted-foreground">Faça login para continuar organizando seus estudos.</p>
      </div>
      <form onSubmit={entrar} className="mt-8 space-y-4" noValidate>
        <label className="relative block">
          <span className="sr-only">E-mail</span>
          <Mail className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input type="email" required autoComplete="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} className="h-14 rounded-xl pl-12 text-base" />
        </label>
        <label className="relative block">
          <span className="sr-only">Senha</span>
          <Lock className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input type={ver ? "text" : "password"} required autoComplete="current-password" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} className="h-14 rounded-xl px-12 text-base" />
          <button type="button" onClick={() => setVer(!ver)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label={ver ? "Ocultar senha" : "Mostrar senha"}>
            {ver ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        </label>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-muted-foreground"><Checkbox defaultChecked /> Lembrar-me</label>
          <button type="button" onClick={esqueci} className="font-semibold text-primary hover:underline">Esqueci minha senha</button>
        </div>
        {erro && <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-destructive">{erro}</p>}
        <Button type="submit" variant="hero" className="h-14 w-full text-base" disabled={carregando}>
          {carregando ? <Loader2 className="animate-spin" /> : <LogIn />} Entrar
        </Button>
      </form>
      <div className="my-6 flex items-center gap-3 text-sm text-muted-foreground"><span className="h-px flex-1 bg-border" />ou<span className="h-px flex-1 bg-border" /></div>
      <div className="space-y-3">
        <Button variant="outline" className="h-12 w-full rounded-xl bg-card font-semibold" onClick={() => social("google")}><GoogleIcon /> Entrar com Google</Button>
        <Button variant="outline" className="h-12 w-full rounded-xl bg-card font-semibold" onClick={() => social("microsoft")}><MicrosoftIcon /> Entrar com Microsoft</Button>
      </div>
      <p className="mt-8 text-center text-muted-foreground">
        Ainda não tem uma conta? <Link to="/cadastro" className="font-semibold text-primary hover:underline">Cadastre-se</Link>
      </p>
    </AuthLayout>
  );
}
