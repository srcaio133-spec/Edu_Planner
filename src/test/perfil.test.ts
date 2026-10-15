import { describe, expect, it } from "vitest";
import { mediaPonderada, perfilDe, statusTarefa } from "@/lib/perfil";

describe("perfil", () => {
  it("diretor usa a identidade de gestão mesmo sendo professor", () => {
    expect(perfilDe(["professor", "diretor"])).toBe("gestao");
  });
  it("professor usa identidade de professor", () => {
    expect(perfilDe(["professor"])).toBe("professor");
  });
  it("sem papel vira aluno", () => {
    expect(perfilDe([])).toBe("aluno");
  });
});

describe("status de tarefa", () => {
  const agora = new Date("2026-10-15T12:00:00Z");
  it("prazo vencido sem conclusão é atrasada", () => {
    expect(statusTarefa(new Date("2026-10-14T12:00:00Z"), "em_andamento", agora)).toBe("atrasada");
  });
  it("concluída prevalece sobre prazo vencido", () => {
    expect(statusTarefa(new Date("2026-10-14T12:00:00Z"), "concluida", agora)).toBe("concluida");
  });
  it("futura sem entrega é pendente", () => {
    expect(statusTarefa(new Date("2026-10-16T12:00:00Z"), null, agora)).toBe("pendente");
  });
});

describe("média", () => {
  it("pondera pelo peso", () => {
    expect(mediaPonderada([{ valor: 10, peso: 3 }, { valor: 6, peso: 1 }])).toBe(9);
  });
});
