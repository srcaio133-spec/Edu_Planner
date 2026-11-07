// @ts-nocheck -- código portado do kit EduPlanner; coberto pelos testes vitest
import { it } from "vitest";
// ============================================================================
// EDUPLANNER — IA — TESTES DA FORMATAÇÃO E DO FILTRO DE PALAVRÕES (sem rede, sem banco)
// Como rodar:  node teste_formatacao.ts   (Node 22.18+)   ou   deno run teste_formatacao.ts
// ============================================================================
import assert from "node:assert/strict";
import { contemPalavrao, formatarQuimica, normalizarTexto } from "@/lib/edumind/formatacao";

let total = 0;
const teste = (nome: string, corpo: () => void) => it(nome, () => { corpo(); total++; });
const igual = (entrada: string, esperado: string) => assert.equal(normalizarTexto(entrada), esperado, `entrada: ${entrada}`);

teste("potências com ^ viram sobrescritos (2^2 -> 2²)", () => {
  igual("2^2", "2²");
  igual("x^3 + y^2", "x³ + y²");
  igual("10^-3", "10⁻³");
  igual("10^{-3}", "10⁻³");
  igual("x^{n+1}", "xⁿ⁺¹");
  igual("(a+b)^2 = a^2 + 2ab + b^2", "(a+b)² = a² + 2ab + b²");
});
teste("expoente que não existe em Unicode vira texto, nunca fica com ^", () => {
  igual("x^{q}", "x elevado a (q)");
  assert.equal(normalizarTexto("x^{abc q}").includes("^"), false);
});
teste("delimitadores LaTeX somem e o conteúdo é convertido", () => {
  igual("A área é $x^2 + 3x$ cm.", "A área é x² + 3x cm.");
  igual("$$\\frac{1}{2}$$", "1/2");
  igual("\\(\\Delta = b^2 - 4ac\\)", "Δ = b² - 4ac");
  igual("\\[ 3 \\times 4 = 12 \\]", " 3 × 4 = 12 ");
});
teste("dinheiro com cifrão NÃO é confundido com fórmula", () => {
  igual("Custa R$ 5 e depois R$ 10.", "Custa R$ 5 e depois R$ 10.");
});
teste("frações, raízes e símbolos do LaTeX", () => {
  igual("\\frac{a+b}{2}", "(a+b)/2");
  igual("\\frac{3}{4}", "3/4");
  igual("\\frac{x^2+1}{x-1}", "(x²+1)/(x-1)");
  igual("\\sqrt{16}", "√16");
  igual("\\sqrt{x+1}", "√(x+1)");
  igual("\\sqrt[3]{8}", "∛8");
  igual("a \\times b \\cdot c \\div d \\pm e", "a × b · c ÷ d ± e");
  igual("x \\leq 3 \\text{ e } y \\geq 2 \\neq 0", "x ≤ 3 e y ≥ 2 ≠ 0");
  igual("\\pi r^2 \\approx 3,14", "π r² ≈ 3,14");
  igual("\\text{kg}\\cdot\\text{m}/\\text{s}^2", "kg·m/s²");
  igual("30^\\circ", "30°");
  igual("A \\rightarrow B \\rightleftharpoons C", "A → B ⇌ C");
});
teste("índices com _ viram subscritos", () => {
  igual("H_2O", "H₂O");
  igual("x_1 + x_2", "x₁ + x₂");
  igual("v_{max}", "vₘₐₓ");
});
teste("operadores escritos no teclado", () => {
  igual("x >= 3 e y <= 2 e z != 0", "x ≥ 3 e y ≤ 2 e z ≠ 0");
  igual("A -> B", "A → B");
  igual("2*3", "2 × 3");
  igual("sqrt(16) e sqrt(x+1)", "√16 e √(x+1)");
});
teste("unidades comuns ganham expoente", () => {
  igual("10 cm2, 5 m3 e 9,8 m/s2", "10 cm², 5 m³ e 9,8 m/s²");
});
teste("blocos de código ficam intactos", () => {
  const t = "```\nx^2 e H2O\n```";
  assert.equal(normalizarTexto(t), t);
});
teste("a normalização é idempotente (aplicar duas vezes dá o mesmo)", () => {
  for (const t of ["2^2 e H2O", "\\frac{1}{2} x^{n+1}", "Fe^3+ e SO4^2-", "R$ 5"]) {
    assert.equal(normalizarTexto(normalizarTexto(t)), normalizarTexto(t), t);
  }
});

teste("fórmulas químicas ganham índices (H2O -> H₂O)", () => {
  igual("A água (H2O) tem 2H2O por reação", "A água (H₂O) tem 2H₂O por reação");
  igual("CO2, C6H12O6 e Ca(OH)2", "CO₂, C₆H₁₂O₆ e Ca(OH)₂");
  igual("2H2SO4 + O2 + Cl2", "2H₂SO₄ + O₂ + Cl₂");
  igual("N2 + 3H2 <=> 2NH3", "N₂ + 3H₂ ⇌ 2NH₃");
});
teste("cargas de íons", () => {
  igual("Fe^3+ e Cu^2+", "Fe³⁺ e Cu²⁺");
  igual("SO4^2-", "SO₄²⁻");
});
teste("NÃO altera o que não é fórmula: pontos, siglas, símbolos soltos", () => {
  for (const t of ["V1 e V2", "P2", "A4", "R2D2", "Cu", "NaCl", "CO", "Fase 2", "SP2025", "ENEM2024", "Questão 12"]) {
    assert.equal(formatarQuimica(t), t, t);
  }
});

teste("palavrões em português e inglês são detectados, inclusive disfarçados", () => {
  for (const t of [
    "isso é uma merda", "PORRA!", "p0rra", "c.a.r.a.l.h.o", "caaaaralho", "vai tomar no cu", "Filho da puta",
    "fuck you", "Que bosta", "fdp", "vai se foder", "foda-se", "m3rda", "vsf", "você é um arrombado",
  ]) assert.equal(contemPalavrao(t), true, t);
});
teste("palavras comuns e a química NÃO são bloqueadas (sem falso positivo)", () => {
  for (const t of [
    "O computador usa cobre (Cu) e ouro", "A massa do Cu é 63,5 u", "putrefação da matéria orgânica", "A classe operária",
    "Mercado financeiro e disputa de terras", "A reputação do cuidado", "Cogumelo shiitake", "Putin e a política", "assistência social",
    "Calcule a área do triângulo", "A salada de frutas", "Scunthorpe", "Cuidado com o cálculo",
  ]) assert.equal(contemPalavrao(t), false, t);
});
teste("lista extra por configuração (IA_PALAVROES_EXTRAS)", () => {
  assert.equal(contemPalavrao("que zoeira"), false);
  assert.equal(contemPalavrao("que zoeira", "zoeira, outra"), true);
});

console.log(`\nTODOS OS TESTES DE FORMATAÇÃO PASSARAM (${total})`);
