import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova senha — EduPlanner" },
      { name: "description", content: "Defina uma nova senha para sua conta EduPlanner." },
      { property: "og:title", content: "Nova senha — EduPlanner" },
      { property: "og:description", content: "Recuperação de senha do EduPlanner." },
    ],
  }),
  component: Reset,
});

function Reset() {
  const navigate = useNavigate();
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (senha.length < 10) return setErro("A senha precisa ter ao menos 10 caracteres.");
    const { error } = await supabase.auth.updateUser({ password: senha });
    if (error) return setErro("Link expirado ou inválido. Solicite um novo.");
    toast.success("Senha alterada!");
    navigate({ to: "/painel", replace: true });
  }
  return (
    <AuthLayout>
      <h2 className="text-center text-3xl font-extrabold">Definir nova senha</h2>
      <form onSubmit={salvar} className="mt-6 space-y-4">
        <Input type="password" placeholder="Nova senha" value={senha} onChange={(e) => setSenha(e.target.value)} className="h-12 rounded-xl" autoComplete="new-password" />
        {erro && <p className="text-sm text-destructive">{erro}</p>}
        <Button type="submit" variant="hero" className="h-12 w-full">Salvar</Button>
      </form>
    </AuthLayout>
  );
}
