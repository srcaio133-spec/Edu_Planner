import type { AppRole } from "@/lib/perfil";

const DIRECAO: AppRole[] = ["diretor", "vice_diretor", "admin"];
const GESTAO: AppRole[] = ["secretaria", "coordenacao", ...DIRECAO];

/** Espelha a regra do servidor (definir_papel): quem pode dar `novo` a alguém que hoje tem `alvo`. */
export function podeDefinirPapel(meus: AppRole[], alvo: AppRole[], novo: AppRole, mesmo = false): boolean {
  if (mesmo) return false;
  if (!meus.some((r) => GESTAO.includes(r))) return false;
  const direcao = meus.some((r) => DIRECAO.includes(r));
  if ((DIRECAO.includes(novo) || alvo.some((r) => DIRECAO.includes(r))) && !direcao) return false;
  if (novo === "admin" && !meus.includes("admin")) return false;
  return true;
}

/** Percentual de presença (0–100) ou null sem registros. */
export function percentualFrequencia(registros: { presente: boolean }[]): number | null {
  if (!registros.length) return null;
  return Math.round((registros.filter((r) => r.presente).length * 1000) / registros.length) / 10;
}

/** Aluno em alerta: média abaixo de 6 ou frequência abaixo de 75%. */
export function emAlerta(media: number | null, freq: number | null): boolean {
  return (media != null && media < 6) || (freq != null && freq < 75);
}

export function saldoPontos(ganhos: number[], gastos: number[]): number {
  return ganhos.reduce((a, b) => a + b, 0) - gastos.reduce((a, b) => a + b, 0);
}

/** Espelha avaliar_questao: só a gestão avalia; rejeitar exige motivo; só questões em revisão. */
export function podeAvaliarQuestao(meus: AppRole[], status: string, aprovar: boolean, motivo = ""): boolean {
  if (!meus.some((r) => GESTAO.includes(r))) return false;
  if (status !== "em_revisao") return false;
  return aprovar || motivo.trim().length > 0;
}
