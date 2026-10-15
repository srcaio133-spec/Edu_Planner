export type AppRole = "aluno" | "professor" | "secretaria" | "coordenacao" | "vice_diretor" | "diretor" | "admin";
export type Perfil = "aluno" | "professor" | "gestao";

const GESTAO: AppRole[] = ["admin", "diretor", "vice_diretor", "secretaria", "coordenacao"];

/** Perfil principal: gestão > professor > aluno. */
export function perfilDe(roles: AppRole[]): Perfil {
  if (roles.some((r) => GESTAO.includes(r))) return "gestao";
  if (roles.includes("professor")) return "professor";
  return "aluno";
}

export const ROLE_LABEL: Record<AppRole, string> = {
  aluno: "Aluno",
  professor: "Professor",
  secretaria: "Secretaria",
  coordenacao: "Coordenação",
  vice_diretor: "Vice-Diretor",
  diretor: "Diretor",
  admin: "Administrador",
};

export function rolePrincipal(roles: AppRole[]): AppRole {
  const ordem: AppRole[] = ["admin", "diretor", "vice_diretor", "secretaria", "coordenacao", "professor", "aluno"];
  return ordem.find((r) => roles.includes(r)) ?? "aluno";
}

export type StatusTarefa = "pendente" | "em_andamento" | "concluida" | "atrasada";

/** Status derivado do prazo + entrega do aluno. */
export function statusTarefa(prazo: Date, entrega: "em_andamento" | "concluida" | null | undefined, agora = new Date()): StatusTarefa {
  if (entrega === "concluida") return "concluida";
  if (prazo.getTime() < agora.getTime()) return "atrasada";
  if (entrega === "em_andamento") return "em_andamento";
  return "pendente";
}

/** Média ponderada pelo peso; null quando não há notas. */
export function mediaPonderada(itens: { valor: number; peso: number }[]): number | null {
  const soma = itens.reduce((s, i) => s + i.peso, 0);
  if (!soma) return null;
  return itens.reduce((s, i) => s + i.valor * i.peso, 0) / soma;
}
