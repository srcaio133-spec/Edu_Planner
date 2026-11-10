import { describe, expect, it } from "vitest";
import { emAlerta, percentualFrequencia, podeDefinirPapel, saldoPontos } from "@/lib/regras";

describe("podeDefinirPapel", () => {
  it("secretaria torna aluno professor", () => expect(podeDefinirPapel(["secretaria"], ["aluno"], "professor")).toBe(true));
  it("secretaria não cria diretor", () => expect(podeDefinirPapel(["secretaria"], ["aluno"], "diretor")).toBe(false));
  it("secretaria não altera um diretor", () => expect(podeDefinirPapel(["secretaria"], ["diretor"], "aluno")).toBe(false));
  it("diretor cria vice-diretor", () => expect(podeDefinirPapel(["diretor"], ["professor"], "vice_diretor")).toBe(true));
  it("ninguém altera o próprio papel", () => expect(podeDefinirPapel(["diretor"], ["diretor"], "aluno", true)).toBe(false));
  it("professor não define papéis", () => expect(podeDefinirPapel(["professor"], ["aluno"], "professor")).toBe(false));
});

describe("frequência e alertas", () => {
  it("3 presenças em 4 aulas = 75%", () => expect(percentualFrequencia([{ presente: true }, { presente: true }, { presente: true }, { presente: false }])).toBe(75));
  it("sem aulas = null", () => expect(percentualFrequencia([])).toBeNull());
  it("média 5,9 gera alerta", () => expect(emAlerta(5.9, 90)).toBe(true));
  it("frequência 74% gera alerta", () => expect(emAlerta(8, 74)).toBe(true));
  it("média 6 e frequência 75% não gera alerta", () => expect(emAlerta(6, 75)).toBe(false));
});

describe("saldoPontos", () => {
  it("50 + 40 ganhos − 30 gastos = 60", () => expect(saldoPontos([50, 40], [30])).toBe(60));
});

import { podeAvaliarQuestao } from "@/lib/regras";
describe("fila de revisão de questões", () => {
  it("professor não aprova questões", () => expect(podeAvaliarQuestao(["professor"], "em_revisao", true)).toBe(false));
  it("secretaria aprova questão em revisão", () => expect(podeAvaliarQuestao(["secretaria"], "em_revisao", true)).toBe(true));
  it("rejeitar exige motivo", () => {
    expect(podeAvaliarQuestao(["secretaria"], "em_revisao", false, "  ")).toBe(false);
    expect(podeAvaliarQuestao(["secretaria"], "em_revisao", false, "Gabarito errado")).toBe(true);
  });
  it("questão já aprovada não volta à fila", () => expect(podeAvaliarQuestao(["diretor"], "aprovada", true)).toBe(false));
});
