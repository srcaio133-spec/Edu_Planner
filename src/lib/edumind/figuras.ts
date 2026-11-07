// @ts-nocheck -- código portado do kit EduPlanner; coberto pelos testes vitest
// ============================================================================
// EDUPLANNER — IA — FIGURAS (validação + desenho em SVG, funções PURAS)
// ============================================================================
// A IA NÃO desenha pixels nem escreve SVG: ela descreve a figura em JSON (tipo + medidas) e
// ESTE código desenha, em escala, com as medidas exatas. Vantagens:
//   - o triângulo de lados 3, 4 e 5 sai com proporção 3:4:5 de verdade;
//   - o béquer com 200 mL de 250 mL enche exatamente 80% da altura;
//   - nada de texto errado dentro da imagem (modelos de imagem erram letras e números);
//   - segurança: o SVG é montado aqui, com texto escapado e SOMENTE elementos permitidos
//     (rect, line, polyline, polygon, circle, text). Sem script, sem link, sem imagem externa.
// Tipos: triangulo, bequer (1 a 3), retangulo, circulo, reta_numerica, grafico_funcao, barras.
// ============================================================================
import { contemPalavrao, normalizarTexto } from "./formatacao";

export type Resultado<T> = { ok: true; valor: T } | { ok: false; erro: string };

export interface Triangulo {
  tipo: "triangulo"; descricao: string; vertices: [string, string, string];
  lados: { ab: number; bc: number; ca: number }; unidade: string; mostrar_medidas: boolean;
  rotulos_lados: { ab?: string; bc?: string; ca?: string }; rotulos_angulos: { a?: string; b?: string; c?: string };
}
export interface ItemBequer {
  capacidade_ml: number; volume_ml: number; legenda: string; cor: string; soluto: string;
  massa_soluto: string; solvente: string; volume_solvente: string; particulas: boolean;
}
export interface Bequer { tipo: "bequer"; descricao: string; itens: ItemBequer[] }
export interface Retangulo {
  tipo: "retangulo"; descricao: string; largura: number; altura: number; unidade: string;
  rotulo_largura: string; rotulo_altura: string;
}
export interface Circulo { tipo: "circulo"; descricao: string; raio: number; unidade: string; mostrar: "raio" | "diametro"; rotulo: string }
export interface RetaNumerica {
  tipo: "reta_numerica"; descricao: string; minimo: number; maximo: number; passo: number;
  pontos: { valor: number; rotulo: string }[];
  intervalo: { de: number; ate: number; inclui_de: boolean; inclui_ate: boolean } | null;
}
export interface GraficoFuncao {
  tipo: "grafico_funcao"; descricao: string; funcao: "afim" | "quadratica"; a: number; b: number; c: number;
  x_minimo: number; x_maximo: number; mostrar_raizes: boolean; mostrar_vertice: boolean;
}
export interface Barras { tipo: "barras"; descricao: string; titulo: string; categorias: string[]; valores: number[]; unidade: string }
export type Figura = Triangulo | Bequer | Retangulo | Circulo | RetaNumerica | GraficoFuncao | Barras;

/** Texto que vai no prompt da IA: os formatos aceitos (fica junto do código para nunca ficar desatualizado). */
export const FORMATOS_DE_FIGURA = `Formatos de figura aceitos (JSON). Sempre inclua "descricao" (texto alternativo, até 300 caracteres). As medidas do desenho devem ser EXATAMENTE as do texto.
1) Triângulo (desenhado em escala): {"tipo":"triangulo","descricao":"...","vertices":["A","B","C"],"lados":{"ab":3,"bc":4,"ca":5},"unidade":"cm","rotulos_angulos":{"b":"90°"}}
2) Béquer, de 1 a 3 itens (cor: agua, azul, verde, amarelo, rosa ou incolor): {"tipo":"bequer","descricao":"...","itens":[{"capacidade_ml":250,"volume_ml":200,"legenda":"Solução","cor":"agua","soluto":"NaCl","massa_soluto":"10 g","solvente":"água","volume_solvente":"190 mL"}]}
3) Retângulo ou quadrado: {"tipo":"retangulo","descricao":"...","largura":8,"altura":5,"unidade":"cm"}
4) Círculo (mostrar: raio ou diametro): {"tipo":"circulo","descricao":"...","raio":4,"unidade":"cm","mostrar":"raio"}
5) Reta numérica: {"tipo":"reta_numerica","descricao":"...","minimo":-5,"maximo":5,"passo":1,"pontos":[{"valor":-2,"rotulo":"A"}],"intervalo":{"de":-1,"ate":4,"inclui_de":false,"inclui_ate":true}}
6) Gráfico de função (afim usa a e b; quadratica usa a, b e c): {"tipo":"grafico_funcao","descricao":"...","funcao":"quadratica","a":1,"b":-4,"c":3,"x_minimo":-1,"x_maximo":5,"mostrar_raizes":true,"mostrar_vertice":true}
7) Gráfico de barras: {"tipo":"barras","descricao":"...","titulo":"...","categorias":["A","B"],"valores":[10,20],"unidade":"%"}`;

// ----------------------------------------------------------------------------
// 1) VALIDAÇÃO (nunca confiar no que a IA devolve)
// ----------------------------------------------------------------------------
class ErroFigura extends Error {}
function exigir(condicao: unknown, mensagem: string): asserts condicao {
  if (!condicao) throw new ErroFigura(mensagem);
}
function objeto(v: unknown, nome: string): Record<string, unknown> {
  exigir(typeof v === "object" && v !== null && !Array.isArray(v), `${nome} deve ser um objeto`);
  return v as Record<string, unknown>;
}
function lerNumero(v: unknown, nome: string, min: number, max: number): number {
  exigir(typeof v === "number" && Number.isFinite(v), `${nome} deve ser um número`);
  exigir(v >= min && v <= max, `${nome} deve estar entre ${min} e ${max}`);
  return v;
}
/** Texto curto de rótulo: sem controle, no estilo Unicode do app, sem palavrão. Vazio é aceito. */
function lerTexto(v: unknown, nome: string, max: number): string {
  if (v === undefined || v === null) return "";
  exigir(typeof v === "string", `${nome} deve ser texto`);
  const t = normalizarTexto(v.replace(/[\u0000-\u001F\u007F]/g, " ")).replace(/\s+/g, " ").trim();
  exigir(t.length <= max, `${nome} pode ter no máximo ${max} caracteres`);
  exigir(!contemPalavrao(t), `${nome} contém linguagem imprópria`);
  return t;
}

const CORES_LIQUIDO = ["agua", "azul", "verde", "amarelo", "rosa", "incolor"];

function interpretar(entrada: unknown): Figura {
  const o = objeto(entrada, "figura");
  const descricao = lerTexto(o.descricao, "descricao", 300);
  exigir(descricao.length >= 5, "descricao é obrigatória (texto alternativo da figura)");
  const unidade = lerTexto(o.unidade, "unidade", 12);

  switch (o.tipo) {
    case "triangulo": {
      const l = objeto(o.lados, "lados");
      const ab = lerNumero(l.ab, "lados.ab", 0.01, 100000);
      const bc = lerNumero(l.bc, "lados.bc", 0.01, 100000);
      const ca = lerNumero(l.ca, "lados.ca", 0.01, 100000);
      exigir(ab + bc > ca * (1 + 1e-9) && bc + ca > ab * (1 + 1e-9) && ab + ca > bc * (1 + 1e-9), "as medidas não formam um triângulo");
      const s = (ab + bc + ca) / 2;
      exigir(Math.sqrt(Math.max(0, s * (s - ab) * (s - bc) * (s - ca))) > 1e-4 * Math.max(ab, bc, ca) ** 2, "triângulo achatado demais para desenhar");
      let vertices: [string, string, string] = ["A", "B", "C"];
      if (o.vertices !== undefined) {
        exigir(Array.isArray(o.vertices) && o.vertices.length === 3, "vertices deve ter 3 nomes");
        vertices = o.vertices.map((x: unknown, i: number) => lerTexto(x, `vertices[${i}]`, 3) || "ABC"[i]) as [string, string, string];
      }
      const rl = o.rotulos_lados === undefined ? {} : objeto(o.rotulos_lados, "rotulos_lados");
      const ra = o.rotulos_angulos === undefined ? {} : objeto(o.rotulos_angulos, "rotulos_angulos");
      return {
        tipo: "triangulo", descricao, vertices, lados: { ab, bc, ca }, unidade, mostrar_medidas: o.mostrar_medidas !== false,
        rotulos_lados: { ab: lerTexto(rl.ab, "rotulos_lados.ab", 20), bc: lerTexto(rl.bc, "rotulos_lados.bc", 20), ca: lerTexto(rl.ca, "rotulos_lados.ca", 20) },
        rotulos_angulos: { a: lerTexto(ra.a, "rotulos_angulos.a", 12), b: lerTexto(ra.b, "rotulos_angulos.b", 12), c: lerTexto(ra.c, "rotulos_angulos.c", 12) },
      };
    }
    case "bequer": {
      exigir(Array.isArray(o.itens) && o.itens.length >= 1 && o.itens.length <= 3, "itens deve ter de 1 a 3 béqueres");
      const itens = o.itens.map((bruto: unknown, i: number): ItemBequer => {
        const it = objeto(bruto, `itens[${i}]`);
        const capacidade_ml = lerNumero(it.capacidade_ml, "capacidade_ml", 10, 5000);
        const volume_ml = lerNumero(it.volume_ml, "volume_ml", 0, capacidade_ml);
        const cor = it.cor === undefined ? "agua" : String(it.cor);
        exigir(CORES_LIQUIDO.includes(cor), "cor do líquido inválida");
        const soluto = lerTexto(it.soluto, "soluto", 30);
        return {
          capacidade_ml, volume_ml, cor, soluto, legenda: lerTexto(it.legenda, "legenda", 40),
          massa_soluto: lerTexto(it.massa_soluto, "massa_soluto", 20), solvente: lerTexto(it.solvente, "solvente", 30),
          volume_solvente: lerTexto(it.volume_solvente, "volume_solvente", 20),
          particulas: typeof it.particulas === "boolean" ? it.particulas : soluto !== "",
        };
      });
      return { tipo: "bequer", descricao, itens };
    }
    case "retangulo": {
      const largura = lerNumero(o.largura, "largura", 0.01, 100000);
      const altura = lerNumero(o.altura, "altura", 0.01, 100000);
      exigir(Math.max(largura, altura) / Math.min(largura, altura) <= 15, "retângulo alongado demais para desenhar");
      return { tipo: "retangulo", descricao, largura, altura, unidade, rotulo_largura: lerTexto(o.rotulo_largura, "rotulo_largura", 20), rotulo_altura: lerTexto(o.rotulo_altura, "rotulo_altura", 20) };
    }
    case "circulo": {
      const mostrar = o.mostrar === "diametro" ? "diametro" : "raio";
      return { tipo: "circulo", descricao, raio: lerNumero(o.raio, "raio", 0.01, 100000), unidade, mostrar, rotulo: lerTexto(o.rotulo, "rotulo", 24) };
    }
    case "reta_numerica": {
      const minimo = lerNumero(o.minimo, "minimo", -1e6, 1e6);
      const maximo = lerNumero(o.maximo, "maximo", -1e6, 1e6);
      exigir(maximo > minimo, "maximo deve ser maior que minimo");
      const passo = lerNumero(o.passo, "passo", 1e-6, 1e6);
      exigir((maximo - minimo) / passo <= 40, "passo pequeno demais (no máximo 40 marcas)");
      const lista = o.pontos === undefined ? [] : o.pontos;
      exigir(Array.isArray(lista) && lista.length <= 6, "pontos aceita até 6 itens");
      const pontos = lista.map((p: unknown, i: number) => {
        const q = objeto(p, `pontos[${i}]`);
        return { valor: lerNumero(q.valor, `pontos[${i}].valor`, minimo, maximo), rotulo: lerTexto(q.rotulo, `pontos[${i}].rotulo`, 12) };
      });
      let intervalo: RetaNumerica["intervalo"] = null;
      if (o.intervalo !== undefined && o.intervalo !== null) {
        const iv = objeto(o.intervalo, "intervalo");
        const de = lerNumero(iv.de, "intervalo.de", minimo, maximo);
        const ate = lerNumero(iv.ate, "intervalo.ate", minimo, maximo);
        exigir(ate > de, "intervalo.ate deve ser maior que intervalo.de");
        intervalo = { de, ate, inclui_de: iv.inclui_de === true, inclui_ate: iv.inclui_ate === true };
      }
      return { tipo: "reta_numerica", descricao, minimo, maximo, passo, pontos, intervalo };
    }
    case "grafico_funcao": {
      exigir(o.funcao === "afim" || o.funcao === "quadratica", "funcao deve ser afim ou quadratica");
      const a = lerNumero(o.a, "a", -10000, 10000);
      const b = lerNumero(o.b, "b", -10000, 10000);
      const c = o.funcao === "quadratica" ? lerNumero(o.c, "c", -10000, 10000) : 0;
      exigir(o.funcao === "afim" || a !== 0, "em função quadrática, a não pode ser 0");
      const x_minimo = lerNumero(o.x_minimo, "x_minimo", -1000, 1000);
      const x_maximo = lerNumero(o.x_maximo, "x_maximo", -1000, 1000);
      exigir(x_maximo - x_minimo >= 0.5 && x_maximo - x_minimo <= 1000, "intervalo de x inválido");
      return { tipo: "grafico_funcao", descricao, funcao: o.funcao, a, b, c, x_minimo, x_maximo, mostrar_raizes: o.mostrar_raizes === true, mostrar_vertice: o.mostrar_vertice === true };
    }
    case "barras": {
      exigir(Array.isArray(o.categorias) && o.categorias.length >= 2 && o.categorias.length <= 8, "categorias deve ter de 2 a 8 itens");
      exigir(Array.isArray(o.valores) && o.valores.length === o.categorias.length, "valores deve ter o mesmo tamanho de categorias");
      const categorias = o.categorias.map((x: unknown, i: number) => lerTexto(x, `categorias[${i}]`, 14));
      const valores = o.valores.map((x: unknown, i: number) => lerNumero(x, `valores[${i}]`, 0, 1e9));
      exigir(valores.some((v: number) => v > 0), "ao menos um valor deve ser maior que zero");
      return { tipo: "barras", descricao, titulo: lerTexto(o.titulo, "titulo", 60), categorias, valores, unidade };
    }
    default:
      throw new ErroFigura("tipo de figura desconhecido");
  }
}

export function validarFigura(entrada: unknown): Resultado<Figura> {
  try {
    return { ok: true, valor: interpretar(entrada) };
  } catch (e) {
    if (e instanceof ErroFigura) return { ok: false, erro: e.message };
    throw e;
  }
}

// ----------------------------------------------------------------------------
// 2) DESENHO (SVG montado à mão: só rect, line, polyline, polygon, circle, text)
// ----------------------------------------------------------------------------
const COR = { traco: "#1F3A5F", preench: "#E8F0FE", destaque: "#1A5BD8", texto: "#111827", suave: "#6B7280", grade: "#E5E7EB", alerta: "#C2410C" };
const LIQUIDOS: Record<string, string> = { agua: "#BFE3FF", azul: "#9EC5FF", verde: "#B7E4C7", amarelo: "#FFE9A8", rosa: "#FFC9D6", incolor: "#F1F5F9" };
type Pt = [number, number];

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const n = (x: number) => String(Math.round(x * 10) / 10);
/** Número no padrão brasileiro: vírgula decimal e sinal de menos de verdade (−). */
export function fmt(x: number): string {
  return String(Math.round(x * 100) / 100).replace(".", ",").replace("-", "−");
}
const medida = (v: number, un: string) => `${fmt(v)}${un ? " " + un : ""}`;

const linha = (x1: number, y1: number, x2: number, y2: number, cor = COR.traco, larg = 1.6, tracejado = false) =>
  `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${cor}" stroke-width="${larg}" stroke-linecap="round"${tracejado ? ' stroke-dasharray="5 4"' : ""}/>`;
const pts = (p: Pt[]) => p.map(([x, y]) => `${n(x)},${n(y)}`).join(" ");
const poligono = (p: Pt[], preench: string, cor = COR.traco, larg = 2) =>
  `<polygon points="${pts(p)}" fill="${preench}" stroke="${cor}" stroke-width="${larg}" stroke-linejoin="round"/>`;
const polilinha = (p: Pt[], cor = COR.traco, larg = 2) =>
  `<polyline points="${pts(p)}" fill="none" stroke="${cor}" stroke-width="${larg}" stroke-linejoin="round" stroke-linecap="round"/>`;
const ponto = (cx: number, cy: number, r: number, preench: string, cor = COR.traco, larg = 1.6, opac = 1) =>
  `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${preench}" stroke="${cor}" stroke-width="${larg}"${opac < 1 ? ` fill-opacity="${opac}"` : ""}/>`;
const retang = (x: number, y: number, w: number, h: number, preench: string, cor = COR.traco, larg = 1.6) =>
  `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="${preench}" stroke="${cor}" stroke-width="${larg}"/>`;
interface OpTexto { tam?: number; ancora?: "start" | "middle" | "end"; negrito?: boolean; cor?: string }
const texto = (x: number, y: number, s: string, op: OpTexto = {}) =>
  `<text x="${n(x)}" y="${n(y)}" font-size="${op.tam ?? 13}" text-anchor="${op.ancora ?? "middle"}" fill="${op.cor ?? COR.texto}"${op.negrito ? ' font-weight="bold"' : ""}>${esc(s)}</text>`;

function moldura(w: number, h: number, titulo: string, descricao: string, corpo: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(descricao)}" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif">` +
    `<title>${esc(titulo)}</title><desc>${esc(descricao)}</desc>` +
    `<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="12" fill="#FFFFFF" stroke="${COR.grade}"/>${corpo}</svg>`;
}

/** Afasta o ponto p, a "dist" pixels, na direção oposta a "de". */
function afastar(p: Pt, de: Pt, dist: number): Pt {
  const dx = p[0] - de[0], dy = p[1] - de[1];
  const m = Math.hypot(dx, dy) || 1;
  return [p[0] + (dx / m) * dist, p[1] + (dy / m) * dist];
}

function desenharTriangulo(f: Triangulo): string {
  const { ab: c, bc: a, ca: b } = f.lados; // lado oposto a A = BC (a), a B = CA (b), a C = AB (c)
  const W = 400, H = 300;
  // B = (0,0), C = (a,0); A pela lei dos cossenos
  const ax = (a * a + c * c - b * b) / (2 * a);
  const ay = Math.sqrt(Math.max(0, c * c - ax * ax));
  const minX = Math.min(0, ax, a), maxX = Math.max(0, ax, a);
  const escala = Math.min(250 / (maxX - minX), 150 / ay);
  const ox = (W - (maxX - minX) * escala) / 2 - minX * escala;
  const oy = (H + ay * escala) / 2;
  const P = (x: number, y: number): Pt => [ox + x * escala, oy - y * escala];
  const A = P(ax, ay), B = P(0, 0), C = P(a, 0);
  const cen: Pt = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3];
  const [nA, nB, nC] = f.vertices;

  let s = poligono([A, B, C], COR.preench, COR.destaque, 2.4);
  // ângulos (lei dos cossenos) e marca de ângulo reto
  const graus = (x: number) => (Math.acos(Math.max(-1, Math.min(1, x))) * 180) / Math.PI;
  const angA = graus((b * b + c * c - a * a) / (2 * b * c));
  const angB = graus((a * a + c * c - b * b) / (2 * a * c));
  const angC = graus((a * a + b * b - c * c) / (2 * a * b));
  const marcaReto = (V: Pt, N1: Pt, N2: Pt) => {
    const u = (N: Pt): Pt => { const m = Math.hypot(N[0] - V[0], N[1] - V[1]) || 1; return [(N[0] - V[0]) / m, (N[1] - V[1]) / m]; };
    const u1 = u(N1), u2 = u(N2), t = 13;
    return polilinha([[V[0] + u1[0] * t, V[1] + u1[1] * t], [V[0] + (u1[0] + u2[0]) * t, V[1] + (u1[1] + u2[1]) * t], [V[0] + u2[0] * t, V[1] + u2[1] * t]], COR.destaque, 1.6);
  };
  if (Math.abs(angA - 90) < 0.6) s += marcaReto(A, B, C);
  if (Math.abs(angB - 90) < 0.6) s += marcaReto(B, A, C);
  if (Math.abs(angC - 90) < 0.6) s += marcaReto(C, A, B);

  // rótulos dos ângulos (só os informados)
  const rA = f.rotulos_angulos;
  const dentro = (V: Pt): Pt => afastar(V, cen, -34);
  for (const [V, rot] of [[A, rA.a], [B, rA.b], [C, rA.c]] as [Pt, string | undefined][]) {
    if (rot) { const p = dentro(V); s += texto(p[0], p[1] + 4, rot, { tam: 12, cor: COR.destaque }); }
  }
  // vértices
  for (const [V, nome] of [[A, nA], [B, nB], [C, nC]] as [Pt, string][]) {
    const p = afastar(V, cen, 16);
    s += texto(p[0], p[1] + 5, nome, { tam: 15, negrito: true });
  }
  // medidas dos lados
  if (f.mostrar_medidas) {
    const rl = f.rotulos_lados;
    const lado = (V1: Pt, V2: Pt, rot: string | undefined, valor: number) => {
      const mid: Pt = [(V1[0] + V2[0]) / 2, (V1[1] + V2[1]) / 2];
      const rotulo = rot || medida(valor, f.unidade);
      // afasta mais quando o lado é vertical (o texto é largo) para não encostar na linha
      const m = Math.hypot(mid[0] - cen[0], mid[1] - cen[1]) || 1;
      const nx = Math.abs(mid[0] - cen[0]) / m, ny = Math.abs(mid[1] - cen[1]) / m;
      const p = afastar(mid, cen, 10 + (rotulo.length * 3.4 + 4) * nx + 8 * ny);
      return texto(p[0], p[1] + 4, rotulo, { tam: 13 });
    };
    s += lado(A, B, rl.ab, c) + lado(B, C, rl.bc, a) + lado(C, A, rl.ca, b);
  }
  return moldura(W, H, "Triângulo " + nA + nB + nC, f.descricao, s);
}

function desenharBequer(f: Bequer): string {
  const N = f.itens.length, colL = 210, W = Math.max(340, colL * N + 30), H = 300;
  const rimY = 44, topoGrad = 58, fundo = 212, larg = 92;
  let s = "";
  f.itens.forEach((it, idx) => {
    const cx = 15 + colL * idx + colL / 2;
    const x0 = cx - larg / 2, x1 = cx + larg / 2;
    const yDe = (v: number) => fundo - (v / it.capacidade_ml) * (fundo - topoGrad);
    const yN = yDe(it.volume_ml);
    // líquido (por baixo das paredes)
    if (it.volume_ml > 0) s += retang(x0 + 1.5, yN, larg - 3, fundo - yN - 1.5, LIQUIDOS[it.cor], LIQUIDOS[it.cor], 0);
    // partículas do soluto (decorativas e determinísticas)
    if (it.particulas && it.volume_ml > 0 && fundo - yN > 22) {
      let seed = 11 + idx * 17;
      const rand = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
      for (let k = 0; k < 14; k++) s += ponto(x0 + 9 + rand() * (larg - 18), yN + 8 + rand() * (fundo - yN - 18), 2.4, COR.destaque, COR.destaque, 0, 0.7);
    }
    // superfície
    if (it.volume_ml > 0) s += linha(x0 + 1.5, yN, x1 - 1.5, yN, COR.destaque, 1.4);
    // paredes do béquer com borda
    s += polilinha([[x0 - 6, rimY], [x0, rimY + 3], [x0, fundo], [x1, fundo], [x1, rimY + 3], [x1 + 6, rimY]], COR.traco, 2.6);
    // graduação: marcas principais com número e secundárias no meio
    const passo = it.capacidade_ml <= 50 ? 10 : it.capacidade_ml <= 100 ? 20 : it.capacidade_ml <= 250 ? 50 : it.capacidade_ml <= 600 ? 100 : it.capacidade_ml <= 1000 ? 200 : 500;
    for (let v = passo; v <= it.capacidade_ml + 1e-9; v += passo) {
      s += linha(x0, yDe(v), x0 + 11, yDe(v), COR.traco, 1.4) + texto(x0 - 6, yDe(v) + 4, fmt(v), { tam: 10, ancora: "end", cor: COR.suave });
      if (v - passo / 2 > 0) s += linha(x0, yDe(v - passo / 2), x0 + 6, yDe(v - passo / 2), COR.traco, 1);
    }
    // rótulo do volume
    if (it.volume_ml > 0) {
      s += linha(x1 + 2, yN, x1 + 16, yN, COR.destaque, 1.4, true) + texto(x1 + 20, yN + 4, `${fmt(it.volume_ml)} mL`, { tam: 12, ancora: "start", negrito: true, cor: COR.destaque });
    }
    // legenda e dados da solução
    let y = fundo + 26;
    if (it.legenda) { s += texto(cx, y, it.legenda, { tam: 14, negrito: true }); y += 18; }
    if (it.soluto || it.solvente) {
      if (it.soluto) { s += texto(cx, y, `Soluto: ${it.soluto}${it.massa_soluto ? ` (${it.massa_soluto})` : ""}`, { tam: 11, cor: COR.suave }); y += 15; }
      if (it.solvente) { s += texto(cx, y, `Solvente: ${it.solvente}${it.volume_solvente ? ` (${it.volume_solvente})` : ""}`, { tam: 11, cor: COR.suave }); y += 15; }
      s += texto(cx, y, `Solução: ${fmt(it.volume_ml)} mL`, { tam: 11, cor: COR.suave });
    }
  });
  return moldura(W, H, "Béquer", f.descricao, s);
}

function desenharRetangulo(f: Retangulo): string {
  const W = 400, H = 300;
  const e = Math.min(250 / f.largura, 140 / f.altura);
  const w = f.largura * e, h = f.altura * e, x = (W - w) / 2 - 10, y = (H - h) / 2 - 8;
  let s = retang(x, y, w, h, COR.preench, COR.destaque, 2.4);
  // cotas: largura embaixo, altura à direita
  const yc = y + h + 16, xc = x + w + 16;
  s += linha(x, yc, x + w, yc, COR.traco, 1.2) + linha(x, yc - 5, x, yc + 5, COR.traco, 1.2) + linha(x + w, yc - 5, x + w, yc + 5, COR.traco, 1.2);
  s += texto(x + w / 2, yc + 20, f.rotulo_largura || medida(f.largura, f.unidade), { tam: 14 });
  s += linha(xc, y, xc, y + h, COR.traco, 1.2) + linha(xc - 5, y, xc + 5, y, COR.traco, 1.2) + linha(xc - 5, y + h, xc + 5, y + h, COR.traco, 1.2);
  s += texto(xc + 10, y + h / 2 + 5, f.rotulo_altura || medida(f.altura, f.unidade), { tam: 14, ancora: "start" });
  return moldura(W, H, f.largura === f.altura ? "Quadrado" : "Retângulo", f.descricao, s);
}

function desenharCirculo(f: Circulo): string {
  const W = 400, H = 300, cx = 200, cy = 150, r = 100;
  let s = ponto(cx, cy, r, COR.preench, COR.destaque, 2.4);
  if (f.mostrar === "diametro") {
    s += linha(cx - r, cy, cx + r, cy, COR.alerta, 2) + texto(cx, cy - 10, f.rotulo || `d = ${medida(2 * f.raio, f.unidade)}`, { tam: 14, negrito: true });
  } else {
    s += linha(cx, cy, cx + r, cy, COR.alerta, 2) + texto(cx + r / 2, cy - 10, f.rotulo || `r = ${medida(f.raio, f.unidade)}`, { tam: 14, negrito: true });
  }
  s += ponto(cx, cy, 3.5, COR.traco, COR.traco, 1);
  return moldura(W, H, "Círculo", f.descricao, s);
}

function desenharRetaNumerica(f: RetaNumerica): string {
  const W = 400, H = 170, x0 = 36, x1 = 364, y = 96;
  const X = (v: number) => x0 + ((v - f.minimo) / (f.maximo - f.minimo)) * (x1 - x0);
  let s = linha(x0 - 14, y, x1 + 14, y, COR.traco, 2) + poligono([[x1 + 20, y], [x1 + 10, y - 5], [x1 + 10, y + 5]], COR.traco, COR.traco, 1) + poligono([[x0 - 20, y], [x0 - 10, y - 5], [x0 - 10, y + 5]], COR.traco, COR.traco, 1);
  if (f.intervalo) {
    const iv = f.intervalo;
    s += linha(X(iv.de), y, X(iv.ate), y, COR.destaque, 7);
    s += ponto(X(iv.de), y, 5.5, iv.inclui_de ? COR.destaque : "#FFFFFF", COR.destaque, 2) + ponto(X(iv.ate), y, 5.5, iv.inclui_ate ? COR.destaque : "#FFFFFF", COR.destaque, 2);
  }
  const marcas = Math.round((f.maximo - f.minimo) / f.passo);
  const pxPorMarca = (x1 - x0) / marcas;
  const cada = Math.max(1, Math.ceil(30 / pxPorMarca));
  for (let k = 0; k <= marcas; k++) {
    const v = f.minimo + k * f.passo;
    s += linha(X(v), y - 6, X(v), y + 6, COR.traco, 1.4);
    if (k % cada === 0) s += texto(X(v), y + 24, fmt(v), { tam: 12 });
  }
  for (const p of f.pontos) {
    s += ponto(X(p.valor), y, 5, COR.alerta, "#FFFFFF", 1.5);
    if (p.rotulo) s += texto(X(p.valor), y - 16, p.rotulo, { tam: 14, negrito: true, cor: COR.alerta });
  }
  return moldura(W, H, "Reta numérica", f.descricao, s);
}

function passoBonito(intervalo: number, alvo = 8): number {
  const bruto = intervalo / alvo;
  const mag = Math.pow(10, Math.floor(Math.log10(bruto)));
  const fr = bruto / mag;
  return (fr < 1.5 ? 1 : fr < 3.5 ? 2 : fr < 7.5 ? 5 : 10) * mag;
}

function desenharGrafico(f: GraficoFuncao): string {
  const W = 400, H = 300, L = 48, R = 384, T = 22, Bt = 266;
  const fx = (x: number) => (f.funcao === "afim" ? f.a * x + f.b : f.a * x * x + f.b * x + f.c);
  const amostras = 120;
  const dados: Pt[] = [];
  for (let k = 0; k <= amostras; k++) { const x = f.x_minimo + ((f.x_maximo - f.x_minimo) * k) / amostras; dados.push([x, fx(x)]); }
  let yMin = Math.min(0, ...dados.map((d) => d[1])), yMax = Math.max(0, ...dados.map((d) => d[1]));
  if (yMax - yMin < 1e-6) { yMax += 1; yMin -= 1; }
  const folga = (yMax - yMin) * 0.08;
  yMin -= folga; yMax += folga;
  const X = (x: number) => L + ((x - f.x_minimo) / (f.x_maximo - f.x_minimo)) * (R - L);
  const Y = (y: number) => Bt - ((y - yMin) / (yMax - yMin)) * (Bt - T);
  const xAxisY = Math.min(Bt, Math.max(T, Y(0))), yAxisX = Math.min(R, Math.max(L, X(0)));
  let raizes: number[] = [];
  if (f.funcao === "afim") { if (f.a !== 0) raizes = [-f.b / f.a]; }
  else {
    const d = f.b * f.b - 4 * f.a * f.c;
    if (d === 0) raizes = [-f.b / (2 * f.a)];
    else if (d > 0) raizes = [(-f.b - Math.sqrt(d)) / (2 * f.a), (-f.b + Math.sqrt(d)) / (2 * f.a)].sort((p, q) => p - q);
  }
  let s = "";
  // grade e marcas
  const px = passoBonito(f.x_maximo - f.x_minimo), py = passoBonito(yMax - yMin);
  for (let x = Math.ceil(f.x_minimo / px) * px; x <= f.x_maximo + 1e-9; x += px) {
    s += linha(X(x), T, X(x), Bt, COR.grade, 1);
    const repete = f.mostrar_raizes && raizes.some((r) => Math.abs(r - x) < px * 0.3); // a raiz já tem rótulo próprio
    if (Math.abs(x) > 1e-9 && !repete) s += texto(X(x), Math.min(Bt + 14, xAxisY + 14), fmt(x), { tam: 10, cor: COR.suave });
  }
  for (let y = Math.ceil(yMin / py) * py; y <= yMax + 1e-9; y += py) {
    s += linha(L, Y(y), R, Y(y), COR.grade, 1);
    if (Math.abs(y) > 1e-9) s += texto(Math.max(L - 4, yAxisX - 5), Y(y) + 4, fmt(y), { tam: 10, ancora: "end", cor: COR.suave });
  }
  // eixos
  s += linha(L, xAxisY, R, xAxisY, COR.traco, 1.8) + linha(yAxisX, T, yAxisX, Bt, COR.traco, 1.8);
  s += texto(R - 2, xAxisY - 6, "x", { tam: 13, ancora: "end", negrito: true }) + texto(yAxisX + 8, T + 8, "y", { tam: 13, ancora: "start", negrito: true });
  // curva
  s += polilinha(dados.map(([x, y]) => [X(x), Y(y)] as Pt), COR.destaque, 2.6);
  // raízes e vértice
  if (f.mostrar_raizes) {
    for (const r of raizes) {
      if (r < f.x_minimo || r > f.x_maximo) continue;
      // o rótulo fica abaixo dos números do eixo (ou acima, se não houver espaço) para não se sobrepor a eles
      const yRotulo = xAxisY + 30 <= H - 6 ? xAxisY + 30 : xAxisY - 12;
      s += ponto(X(r), Y(0), 4.5, COR.alerta, "#FFFFFF", 1.5) + linha(X(r), Y(0) + 5, X(r), yRotulo - 12, COR.alerta, 1, true) + texto(X(r), yRotulo, `x = ${fmt(r)}`, { tam: 11, negrito: true, cor: COR.alerta });
    }
  }
  if (f.mostrar_vertice && f.funcao === "quadratica") {
    const xv = -f.b / (2 * f.a), yv = fx(xv);
    if (xv >= f.x_minimo && xv <= f.x_maximo) {
      s += ponto(X(xv), Y(yv), 4.5, "#047857", "#FFFFFF", 1.5) + texto(X(xv) + 8, Y(yv) + (f.a > 0 ? 16 : -8), `V(${fmt(xv)}; ${fmt(yv)})`, { tam: 11, ancora: "start", negrito: true, cor: "#047857" });
    }
  }
  return moldura(W, H, "Gráfico de função", f.descricao, s);
}

function desenharBarras(f: Barras): string {
  const W = 400, H = 300, L = 54, R = 384, T = 46, Bt = 246;
  const maxV = Math.max(...f.valores);
  const passo = passoBonito(maxV, 4);
  const topo = Math.ceil(maxV / passo) * passo;
  const Y = (v: number) => Bt - (v / topo) * (Bt - T);
  let s = "";
  if (f.titulo) s += texto(W / 2, 26, f.titulo, { tam: 15, negrito: true });
  for (let v = 0; v <= topo + 1e-9; v += passo) {
    s += linha(L, Y(v), R, Y(v), COR.grade, 1) + texto(L - 6, Y(v) + 4, fmt(v), { tam: 10, ancora: "end", cor: COR.suave });
  }
  const fatia = (R - L) / f.valores.length;
  f.valores.forEach((v, i) => {
    const w = Math.min(54, fatia * 0.6), x = L + fatia * i + (fatia - w) / 2;
    s += retang(x, Y(v), w, Bt - Y(v), COR.destaque, COR.destaque, 0);
    s += texto(x + w / 2, Y(v) - 6, `${fmt(v)}${f.unidade ? (f.unidade === "%" ? "%" : " " + f.unidade) : ""}`, { tam: 12, negrito: true });
    s += texto(x + w / 2, Bt + 18, f.categorias[i], { tam: 12 });
  });
  s += linha(L, Bt, R, Bt, COR.traco, 1.8) + linha(L, T, L, Bt, COR.traco, 1.8);
  return moldura(W, H, f.titulo || "Gráfico de barras", f.descricao, s);
}

/** Desenha a figura (já validada) e devolve o SVG como texto. */
export function renderizarFigura(f: Figura): string {
  let svg: string;
  switch (f.tipo) {
    case "triangulo": svg = desenharTriangulo(f); break;
    case "bequer": svg = desenharBequer(f); break;
    case "retangulo": svg = desenharRetangulo(f); break;
    case "circulo": svg = desenharCirculo(f); break;
    case "reta_numerica": svg = desenharRetaNumerica(f); break;
    case "grafico_funcao": svg = desenharGrafico(f); break;
    case "barras": svg = desenharBarras(f); break;
  }
  if (/NaN|Infinity|undefined/.test(svg)) throw new ErroFigura("a figura gerou valores inválidos");
  return svg;
}

// ----------------------------------------------------------------------------
// 3) FIGURAS DENTRO DE UMA RESPOSTA DE CONVERSA
// ----------------------------------------------------------------------------
export interface FiguraRenderizada { id: number; svg: string; descricao: string; spec: Figura }

/** Lê o primeiro objeto JSON de um texto. */
export function lerObjetoJson(texto: string): unknown {
  const ini = texto.indexOf("{"), fim = texto.lastIndexOf("}");
  if (ini === -1 || fim <= ini) throw new Error("JSON_NAO_ENCONTRADO");
  return JSON.parse(texto.slice(ini, fim + 1));
}

/**
 * Procura blocos [[FIGURA]]{json}[[/FIGURA]] no texto da IA, valida, desenha e troca cada bloco
 * pelo marcador ⟦FIGURA n⟧ (o app mostra a imagem nesse ponto). Blocos inválidos somem.
 */
export function extrairFigurasDoTexto(textoIA: string, maximo = 3): { texto: string; figuras: FiguraRenderizada[]; descartadas: number } {
  const figuras: FiguraRenderizada[] = [];
  let descartadas = 0;
  const saida = textoIA.replace(/\[\[FIGURA\]\]([\s\S]*?)\[\[\/FIGURA\]\]/g, (_m, corpo: string) => {
    if (figuras.length >= maximo) { descartadas++; return ""; }
    try {
      const v = validarFigura(lerObjetoJson(corpo));
      if (!v.ok) { descartadas++; return ""; }
      const svg = renderizarFigura(v.valor);
      const id = figuras.length + 1;
      figuras.push({ id, svg, descricao: v.valor.descricao, spec: v.valor });
      return `\n\n⟦FIGURA ${id}⟧\n\n`;
    } catch {
      descartadas++;
      return "";
    }
  });
  return { texto: saida.replace(/\[\[\/?FIGURA\]\]/g, "").replace(/\n{3,}/g, "\n\n").trim(), figuras, descartadas };
}
