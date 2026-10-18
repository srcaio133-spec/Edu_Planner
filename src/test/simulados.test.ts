import { describe, expect, it } from "vitest";
import { notaSimulado } from "@/lib/simulados";

describe("notaSimulado", () => {
  it("3 de 3 acertos vale 10", () => expect(notaSimulado(3, 3)).toBe(10));
  it("2 de 3 acertos vale 6,7", () => expect(notaSimulado(2, 3)).toBe(6.7));
  it("sem questões vale 0", () => expect(notaSimulado(0, 0)).toBe(0));
});
