// @ts-nocheck -- código portado do kit EduPlanner; coberto pelos testes vitest
import { it } from "vitest";
// ============================================================================
// EDUPLANNER — IA — TESTES DAS FIGURAS (validação, segurança do SVG e medidas exatas)
// Como rodar:  node teste_figuras.ts   (Node 22.18+)   ou   deno run teste_figuras.ts
// ============================================================================
import assert from "node:assert/strict";
import { extrairFigurasDoTexto, fmt, renderizarFigura, validarFigura } from "@/lib/edumind/figuras";

let total = 0;
const teste = (nome: string, corpo: () => void) => it(nome, () => { corpo(); total++; });

const exemplos: Record<string, Record<string, unknown>> = {
  triangulo: { tipo: "triangulo", descricao: "Triângulo retângulo ABC de lados 3, 4 e 5", lados: { ab: 3, bc: 4, ca: 5 }, unidade: "cm", rotulos_angulos: { b: "90°" } },
  bequer: { tipo: "bequer", descricao: "Béquer de 250 mL com 200 mL de solução", itens: [{ capacidade_ml: 250, volume_ml: 200, legenda: "Solução de NaCl", soluto: "NaCl", massa_soluto: "10 g", solvente: "H2O", volume_solvente: "190 mL" }] },
  retangulo: { tipo: "retangulo", descricao: "Retângulo de 8 cm por 5 cm", largura: 8, altura: 5, unidade: "cm" },
  circulo: { tipo: "circulo", descricao: "Círculo de raio 4 cm", raio: 4, unidade: "cm" },
  reta: { tipo: "reta_numerica", descricao: "Reta de −5 a 5 com dois pontos", minimo: -5, maximo: 5, passo: 1, pontos: [{ valor: -3, rotulo: "A" }], intervalo: { de: -1, ate: 4, inclui_ate: true } },
  grafico: { tipo: "grafico_funcao", descricao: "Parábola de x² − 4x + 3", funcao: "quadratica", a: 1, b: -4, c: 3, x_minimo: -1, x_maximo: 5, mostrar_raizes: true, mostrar_vertice: true },
  barras: { tipo: "barras", descricao: "Barras com quatro valores", titulo: "Aprovação", categorias: ["A", "B", "C"], valores: [45, 62, 30], unidade: "%" },
};
const desenhar = (spec: unknown) => {
  const v = validarFigura(spec);
  assert.equal(v.ok, true, JSON.stringify(v));
  return renderizarFigura((v as { ok: true; valor: Parameters<typeof renderizarFigura>[0] }).valor);
};
/** Confere se as tags abrem e fecham corretamente (SVG bem formado). */
function bemFormado(svg: string): boolean {
  const pilha: string[] = [];
  for (const m of svg.matchAll(/<(\/?)([a-zA-Z]+)([^>]*?)(\/?)>/g)) {
    const [, fecha, nome, , autoFecha] = m;
    if (autoFecha) continue;
    if (fecha) { if (pilha.pop() !== nome) return false; } else pilha.push(nome);
  }
  return pilha.length === 0;
}

teste("os 7 tipos de figura são aceitos e desenhados em SVG bem formado", () => {
  for (const [nome, spec] of Object.entries(exemplos)) {
    const svg = desenhar(spec);
    assert.ok(svg.startsWith("<svg "), nome);
    assert.ok(bemFormado(svg), `SVG malformado: ${nome}`);
    assert.ok(!/NaN|Infinity|undefined/.test(svg), nome);
  }
});
teste("segurança: só elementos permitidos; sem script, link, evento ou imagem externa", () => {
  const permitidos = new Set(["svg", "title", "desc", "rect", "line", "polyline", "polygon", "circle", "text"]);
  for (const [nome, spec] of Object.entries(exemplos)) {
    const svg = desenhar(spec);
    for (const m of svg.matchAll(/<\/?([a-zA-Z]+)/g)) assert.ok(permitidos.has(m[1]), `${nome}: tag proibida ${m[1]}`);
    assert.ok(!/href|javascript:|on[a-z]+\s*=|<script|<image|<foreignObject|<use/i.test(svg), nome);
  }
});
teste("texto com < > & e aspas é escapado no SVG", () => {
  const svg = desenhar({ ...exemplos.retangulo, rotulo_largura: "a<b & \"c\"" });
  assert.ok(svg.includes("a&lt;b &amp; &quot;c&quot;"));
  assert.ok(!svg.includes("a<b"));
});
teste("triângulo 3-4-5 é desenhado em escala (proporção 3:4:5) com ângulo reto marcado", () => {
  const svg = desenhar(exemplos.triangulo);
  const p = /<polygon points="([^"]+)"/.exec(svg)![1].split(" ").map((s) => s.split(",").map(Number));
  const d = (i: number, j: number) => Math.hypot(p[i][0] - p[j][0], p[i][1] - p[j][1]);
  const [ab, bc, ca] = [d(0, 1), d(1, 2), d(2, 0)]; // polígono é A, B, C
  assert.ok(Math.abs(ab / bc - 3 / 4) < 0.01 && Math.abs(ca / bc - 5 / 4) < 0.01, `${ab} ${bc} ${ca}`);
  assert.ok(svg.includes(">3 cm<") && svg.includes(">4 cm<") && svg.includes(">5 cm<"));
  assert.equal((svg.match(/<polyline /g) ?? []).length, 1); // a marca do ângulo reto
});
teste("béquer: o nível do líquido é exatamente volume/capacidade e a fórmula ganha índice", () => {
  const svg = desenhar(exemplos.bequer);
  const m = /<rect x="[^"]+" y="[^"]+" width="[^"]+" height="([\d.]+)" fill="#BFE3FF"/.exec(svg)!;
  const alturaTotal = 212 - 58; // altura que representa a capacidade
  assert.ok(Math.abs(Number(m[1]) + 1.5 - 0.8 * alturaTotal) < 0.3, `altura ${m[1]}`);
  assert.ok(svg.includes(">200 mL<") && svg.includes("Solvente: H₂O (190 mL)") && svg.includes("Soluto: NaCl (10 g)"));
});
teste("retângulo 8 × 5 mantém a proporção", () => {
  const svg = desenhar(exemplos.retangulo);
  const m = /<rect x="[^"]+" y="[^"]+" width="([\d.]+)" height="([\d.]+)" fill="#E8F0FE"/.exec(svg)!;
  assert.ok(Math.abs(Number(m[1]) / Number(m[2]) - 8 / 5) < 0.01);
  assert.ok(svg.includes(">8 cm<") && svg.includes(">5 cm<"));
});
teste("gráfico: raízes e vértice corretos no texto", () => {
  const svg = desenhar(exemplos.grafico);
  assert.ok(svg.includes(">x = 1<") && svg.includes(">x = 3<") && svg.includes(">V(2; −1)<"));
});
teste("números em português: vírgula decimal e sinal de menos de verdade", () => {
  assert.equal(fmt(2), "2");
  assert.equal(fmt(-3.5), "−3,5");
  assert.equal(fmt(0.1 + 0.2), "0,3");
});

teste("medidas impossíveis ou fora dos limites são recusadas", () => {
  const casos: Record<string, unknown>[] = [
    { ...exemplos.triangulo, lados: { ab: 1, bc: 2, ca: 10 } },
    { ...exemplos.triangulo, lados: { ab: -3, bc: 4, ca: 5 } },
    { ...exemplos.triangulo, lados: { ab: 1, bc: 1, ca: 2 } },
    { ...exemplos.bequer, itens: [{ capacidade_ml: 250, volume_ml: 300 }] },
    { ...exemplos.bequer, itens: [] },
    { ...exemplos.bequer, itens: Array(4).fill({ capacidade_ml: 100, volume_ml: 50 }) },
    { ...exemplos.bequer, itens: [{ capacidade_ml: 100, volume_ml: 50, cor: "vermelho-sangue" }] },
    { ...exemplos.retangulo, largura: 100, altura: 1 },
    { ...exemplos.grafico, a: 0 },
    { ...exemplos.grafico, x_minimo: 5, x_maximo: 1 },
    { ...exemplos.reta, passo: 0.01 },
    { ...exemplos.barras, valores: [1, 2] },
    { ...exemplos.barras, valores: [0, 0, 0] },
    { ...exemplos.circulo, descricao: "" },
    { tipo: "hexagono", descricao: "figura inexistente" },
  ];
  for (const c of casos) assert.equal(validarFigura(c).ok, false, JSON.stringify(c).slice(0, 80));
  assert.equal(validarFigura(null).ok, false);
  assert.equal(validarFigura("texto").ok, false);
});
teste("rótulo com palavrão é recusado", () => {
  assert.equal(validarFigura({ ...exemplos.retangulo, rotulo_largura: "que merda" }).ok, false);
});

teste("extrairFigurasDoTexto: troca o bloco pelo marcador e devolve o SVG", () => {
  const texto = `Veja o triângulo:\n[[FIGURA]]${JSON.stringify(exemplos.triangulo)}[[/FIGURA]]\nO maior lado é a hipotenusa.`;
  const r = extrairFigurasDoTexto(texto);
  assert.equal(r.figuras.length, 1);
  assert.ok(r.texto.includes("⟦FIGURA 1⟧") && !r.texto.includes("[[FIGURA]]"));
  assert.ok(r.figuras[0].svg.startsWith("<svg "));
  assert.equal(r.figuras[0].descricao, "Triângulo retângulo ABC de lados 3, 4 e 5");
});
teste("extrairFigurasDoTexto: bloco inválido some, sem quebrar a resposta; limite de 3", () => {
  const ruim = "[[FIGURA]]{isso não é json}[[/FIGURA]]";
  const r1 = extrairFigurasDoTexto(`Texto ${ruim} fim`);
  assert.equal(r1.figuras.length, 0);
  assert.equal(r1.descartadas, 1);
  assert.ok(!r1.texto.includes("FIGURA]]"));
  const bom = `[[FIGURA]]${JSON.stringify(exemplos.circulo)}[[/FIGURA]]`;
  const r2 = extrairFigurasDoTexto([bom, bom, bom, bom].join("\n"));
  assert.equal(r2.figuras.length, 3);
  assert.equal(r2.descartadas, 1);
  const r3 = extrairFigurasDoTexto("Sobrou um [[FIGURA]] sem fechar");
  assert.ok(!r3.texto.includes("[[FIGURA]]"));
});

console.log(`\nTODOS OS TESTES DE FIGURAS PASSARAM (${total})`);
