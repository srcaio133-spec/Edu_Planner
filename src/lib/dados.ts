import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { perfilDe, type AppRole } from "@/lib/perfil";

export function usePerfil(userId: string) {
  return useQuery({
    queryKey: ["perfil", userId],
    queryFn: async () => {
      const [p, r] = await Promise.all([
        supabase.from("profiles").select("nome,email,telefone,matricula").eq("id", userId).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
      ]);
      const roles = (r.data ?? []).map((x) => x.role as AppRole);
      return { ...(p.data ?? { nome: "", email: "", telefone: "", matricula: "" }), roles, perfil: perfilDe(roles) };
    },
  });
}

export function useTurmasDisciplinas() {
  return useQuery({
    queryKey: ["base"],
    queryFn: async () => {
      const [t, d] = await Promise.all([
        supabase.from("turmas").select("id,nome,ano_letivo").order("nome"),
        supabase.from("disciplinas").select("id,nome,cor").order("nome"),
      ]);
      return { turmas: t.data ?? [], disciplinas: d.data ?? [] };
    },
  });
}

export const fmtData = (s: string) =>
  new Date(s).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
export const fmtNota = (n: number | null) => (n == null ? "—" : n.toFixed(1).replace(".", ","));

/** Converte valor de <input type="datetime-local"> para ISO. */
export const localParaIso = (v: string) => new Date(v).toISOString();
