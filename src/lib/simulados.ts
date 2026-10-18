export type Categoria = "enem" | "ssa" | "vestibular" | "concurso";
export const CATEGORIAS: { id: Categoria; nome: string }[] = [
  { id: "enem", nome: "ENEM" },
  { id: "ssa", nome: "SSA (UPE)" },
  { id: "vestibular", nome: "Vestibulares" },
  { id: "concurso", nome: "Concursos" },
];
export const LETRAS = ["A", "B", "C", "D", "E"];

/** Nota de 0 a 10 com uma casa decimal (igual à correção do servidor). */
export function notaSimulado(acertos: number, total: number): number {
  if (!total) return 0;
  return Math.round((acertos * 100) / total) / 10;
}
