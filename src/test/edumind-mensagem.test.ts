import { describe, expect, it } from "vitest";
import { separarFiguras } from "@/components/MensagemEduMind";

describe("separarFiguras", () => {
  it("extrai a figura entre o texto", () => {
    const p = separarFiguras('Veja:[[FIGURA]]{"tipo":"circulo","raio":4}[[/FIGURA]]Fim');
    expect(p.map((x) => x.tipo)).toEqual(["texto", "figura", "texto"]);
  });
  it("esconde figura ainda incompleta durante o streaming", () => {
    expect(separarFiguras('Olá [[FIGURA]]{"tipo":"cir')).toEqual([{ tipo: "texto", texto: "Olá " }]);
  });
});
