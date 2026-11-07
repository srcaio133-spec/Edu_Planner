// @ts-nocheck -- código portado do kit EduPlanner; coberto pelos testes vitest
// ============================================================================
// EDUPLANNER — IA — FORMATAÇÃO DO TEXTO E FILTRO DE PALAVRÕES (funções PURAS)
// ============================================================================
// 1) normalizarTexto(): garante que a matemática e a química saiam como numa conversa
//    com Claude ou ChatGPT, em texto simples com símbolos Unicode:
//        2^2  ->  2²        x^{n+1} -> xⁿ⁺¹      H_2O / H2O -> H₂O      \frac{1}{2} -> 1/2
//        \times -> ×        \sqrt{x} -> √x       <= -> ≤                 \Delta -> Δ
//    A IA é instruída a escrever assim, mas esta função CORRIGE qualquer escorregão.
// 2) contemPalavrao(): detecta palavrões em português e inglês (inclusive disfarçados:
//    p0rra, c.a.r.a.l.h.o, caaaralho) tanto no texto do estudante quanto na resposta da IA.
// ============================================================================

// ---------------------------------------------------------------------------
// Sobrescritos e subscritos
// ---------------------------------------------------------------------------
const SUP: Record<string, string> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
  "+": "⁺", "-": "⁻", "−": "⁻", "=": "⁼", "(": "⁽", ")": "⁾",
  "n": "ⁿ", "i": "ⁱ", "x": "ˣ", "y": "ʸ", "a": "ᵃ", "b": "ᵇ", "c": "ᶜ", "d": "ᵈ", "e": "ᵉ", "k": "ᵏ", "m": "ᵐ", "t": "ᵗ",
};
const SUB: Record<string, string> = {
  "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
  "+": "₊", "-": "₋", "−": "₋", "=": "₌", "(": "₍", ")": "₎",
  "a": "ₐ", "e": "ₑ", "o": "ₒ", "x": "ₓ", "h": "ₕ", "k": "ₖ", "l": "ₗ", "m": "ₘ", "n": "ₙ", "p": "ₚ", "s": "ₛ", "t": "ₜ",
  "i": "ᵢ", "j": "ⱼ", "r": "ᵣ", "u": "ᵤ", "v": "ᵥ",
};
function converter(texto: string, mapa: Record<string, string>): string | null {
  let r = "";
  for (const ch of texto) {
    const v = mapa[ch];
    if (!v) return null; // algum caractere não existe como sobrescrito/subscrito
    r += v;
  }
  return r;
}
export const paraSobrescrito = (s: string) => converter(s, SUP);
export const paraSubscrito = (s: string) => converter(s, SUB);

// ---------------------------------------------------------------------------
// Comandos LaTeX -> Unicode
// ---------------------------------------------------------------------------
const SIMBOLOS: Record<string, string> = {
  times: "×", cdot: "·", div: "÷", pm: "±", mp: "∓", leq: "≤", le: "≤", geq: "≥", ge: "≥", neq: "≠", ne: "≠",
  approx: "≈", equiv: "≡", sim: "∼", propto: "∝", pi: "π", Delta: "Δ", delta: "δ", alpha: "α", beta: "β",
  gamma: "γ", Gamma: "Γ", theta: "θ", lambda: "λ", mu: "μ", omega: "ω", Omega: "Ω", sigma: "σ", Sigma: "Σ",
  rho: "ρ", phi: "φ", epsilon: "ε", varepsilon: "ε", infty: "∞", rightarrow: "→", to: "→", leftarrow: "←",
  Rightarrow: "⇒", Leftarrow: "⇐", leftrightarrow: "↔", Leftrightarrow: "⇔", rightleftharpoons: "⇌",
  uparrow: "↑", downarrow: "↓", degree: "°", circ: "°", sum: "∑", prod: "∏", int: "∫", partial: "∂",
  nabla: "∇", in: "∈", notin: "∉", subset: "⊂", subseteq: "⊆", supset: "⊃", cup: "∪", cap: "∩",
  emptyset: "∅", varnothing: "∅", forall: "∀", exists: "∃", neg: "¬", land: "∧", lor: "∨", perp: "⊥",
  parallel: "∥", angle: "∠", triangle: "△", ldots: "…", dots: "…", cdots: "…", quad: " ", qquad: " ",
  sin: "sen", cos: "cos", tan: "tg", log: "log", ln: "ln", lim: "lim", max: "máx", min: "mín",
};
const COMANDOS_DE_TEXTO = new Set(["text", "textbf", "textit", "mathrm", "mathbf", "mathit", "mathbb", "mathcal", "operatorname", "mbox", "boldsymbol", "overline", "underline"]);
const COMANDOS_DESCARTADOS = new Set(["left", "right", "big", "Big", "bigg", "Bigg", "displaystyle", "limits"]);

/** Lê um grupo {...} (com chaves aninhadas) a partir de pos. Devolve [conteúdo, posição seguinte]. */
function lerGrupo(texto: string, pos: number): [string | null, number] {
  let i = pos;
  while (i < texto.length && texto[i] === " ") i++;
  if (texto[i] === "{") {
    let nivel = 0;
    for (let j = i; j < texto.length; j++) {
      if (texto[j] === "{") nivel++;
      else if (texto[j] === "}" && --nivel === 0) return [texto.slice(i + 1, j), j + 1];
    }
    return [null, pos];
  }
  if (i < texto.length && /[\p{L}\p{N}]/u.test(texto[i])) return [texto[i], i + 1]; // \frac12
  return [null, pos];
}

const ehSimples = (s: string) => /^[\p{L}\p{N}.,²³]{1,4}$/u.test(s.trim());
const comParenteses = (s: string) => (ehSimples(s) ? s.trim() : `(${s.trim()})`);
const fracao = (a: string, b: string) => `${comParenteses(a)}/${comParenteses(b)}`;
function raiz(indice: string | null, radicando: string): string {
  const r = radicando.trim();
  const corpo = ehSimples(r) ? r : `(${r})`;
  if (indice === null || indice.trim() === "2") return `√${corpo}`;
  if (indice.trim() === "3") return `∛${corpo}`;
  if (indice.trim() === "4") return `∜${corpo}`;
  const sup = paraSobrescrito(indice.trim());
  return sup ? `${sup}√${corpo}` : `raiz de índice ${indice.trim()} de ${corpo}`;
}

function processarComandos(texto: string): string {
  let saida = "";
  let i = 0;
  while (i < texto.length) {
    if (texto[i] !== "\\") { saida += texto[i++]; continue; }
    const m = /^\\([a-zA-Z]+|[%{}&$#_,;:! ])/.exec(texto.slice(i));
    if (!m) { saida += texto[i++]; continue; }
    const cmd = m[1];
    let j = i + m[0].length;
    if (cmd === "frac" || cmd === "dfrac" || cmd === "tfrac") {
      const [a, j1] = lerGrupo(texto, j);
      const [b, j2] = a === null ? [null, j1] : lerGrupo(texto, j1);
      if (a !== null && b !== null) { saida += fracao(processarComandos(a), processarComandos(b)); i = j2; continue; }
    } else if (cmd === "sqrt") {
      let indice: string | null = null;
      if (texto[j] === "[") {
        const fim = texto.indexOf("]", j);
        if (fim > j) { indice = texto.slice(j + 1, fim); j = fim + 1; }
      }
      const [a, j1] = lerGrupo(texto, j);
      if (a !== null) { saida += raiz(indice, processarComandos(a)); i = j1; continue; }
    } else if (COMANDOS_DE_TEXTO.has(cmd)) {
      const [a, j1] = lerGrupo(texto, j);
      if (a !== null) { saida += processarComandos(a); i = j1; continue; }
    }
    if (cmd in SIMBOLOS) saida += SIMBOLOS[cmd];
    else if (COMANDOS_DESCARTADOS.has(cmd)) { /* descarta */ }
    else if (/^[,;:! ]$/.test(cmd)) saida += " ";
    else if (/^[%{}&$#_]$/.test(cmd)) saida += cmd;
    // comando desconhecido: descarta a barra e o nome, mantendo o texto ao redor
    i = j;
  }
  return saida;
}

function transformarTrecho(trecho: string): string {
  let t = trecho;
  // 1) delimitadores de fórmula LaTeX: $$...$$, \[...\], \(...\) e $...$ (este só se tiver cara de fórmula)
  t = t.replace(/\$\$([\s\S]+?)\$\$/g, (_m, x) => x);
  t = t.replace(/\\\[([\s\S]+?)\\\]/g, (_m, x) => x);
  t = t.replace(/\\\(([\s\S]+?)\\\)/g, (_m, x) => x);
  t = t.replace(/\$([^$\n]{1,200}?)\$/g, (m, x) => (/[\\^_{}]/.test(x) ? x : m)); // "R$ 5 e R$ 10" fica intacto

  // 2) comandos (\frac, \sqrt, \times, \Delta...)
  t = processarComandos(t);

  // 3) cargas elétricas e potências: Fe^3+ , SO4^2- , x^2 , 10^-3 , x^{n+1}
  t = t.replace(/\^\s*\{?°\}?/g, "°");
  // carga: o sinal NÃO pode ser seguido de letra, dígito ou "(" (senão é conta: 10^-3, a^2-b^2)
  t = t.replace(/\^\{?(\d*[+\-−])\}?(?![A-Za-z0-9(])/g, (m, x) => paraSobrescrito(x) ?? m);
  t = t.replace(/\^\{([^{}]*)\}/g, (_m, x) => paraSobrescrito(String(x).trim()) ?? ` elevado a (${String(x).trim()})`);
  t = t.replace(/\^\(([^()]*)\)/g, (_m, x) => paraSobrescrito(`(${String(x).trim()})`) ?? ` elevado a (${String(x).trim()})`);
  t = t.replace(/\^(-?\d+|[A-Za-z])/g, (_m, x) => paraSobrescrito(String(x)) ?? ` elevado a ${x}`);

  // 4) índices: H_2O , x_1 , x_{max}
  t = t.replace(/_\{([^{}]*)\}/g, (_m, x) => paraSubscrito(String(x).trim()) ?? `(${String(x).trim()})`);
  t = t.replace(/(?<=[A-Za-z0-9)])_(\d+)/g, (m, x) => paraSubscrito(String(x)) ?? m);
  t = t.replace(/(?<=[A-Za-z0-9)])_([a-z])(?![A-Za-z0-9])/g, (m, x) => paraSubscrito(String(x)) ?? m);

  // 5) operadores escritos com teclado
  t = t.replace(/<=>/g, "⇌").replace(/<->/g, "↔").replace(/->/g, "→").replace(/=>/g, "⇒");
  t = t.replace(/>=/g, "≥").replace(/<=/g, "≤").replace(/!=/g, "≠");
  t = t.replace(/(\d)\s*\*\s*(?=\d)/g, "$1 × ");
  t = t.replace(/\bsqrt\(([^()]*)\)/g, (_m, x) => (ehSimples(String(x)) ? `√${String(x).trim()}` : `√(${String(x).trim()})`));

  // 6) unidades comuns sem expoente: cm2 -> cm², m3 -> m³, m/s2 -> m/s²
  t = t.replace(/\b(mm|cm|dm|km|m|ha)([23])\b/g, (_m, u, n) => u + (paraSobrescrito(n) ?? n));
  t = t.replace(/\bm\/s2\b/g, "m/s²");

  return t.replace(/[ \t]{2,}/g, " ");
}

/** Converte LaTeX e notações com ^ e _ para símbolos Unicode (fora de blocos de código). */
export function normalizarMatematica(texto: string): string {
  const partes = texto.split("```");
  return partes.map((p, i) => (i % 2 === 0 ? transformarTrecho(p) : p)).join("```");
}

// ---------------------------------------------------------------------------
// Química: H2O -> H₂O, Ca(OH)2 -> Ca(OH)₂, 2H2SO4 -> 2H₂SO₄
// ---------------------------------------------------------------------------
const ELEMENTOS = new Set(
  ("H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr").split(" "),
);
// Moléculas de um só elemento que costumam aparecer com índice.
const SIMPLES_COM_INDICE = new Set(["H2", "N2", "O2", "O3", "F2", "Cl2", "Br2", "I2", "P4", "S8"]);

/** Lê uma fórmula (com parênteses) validando os símbolos dos elementos. Devolve null se não for fórmula. */
function lerFormula(f: string): { grupos: number; temDigito: boolean; saida: string } | null {
  let i = 0, grupos = 0, temDigito = false, saida = "";
  // Lê um índice numérico (até 2 dígitos, para não confundir siglas como SP2025 com fórmulas).
  const lerNumero = (): boolean => {
    let n = "";
    while (i < f.length && /\d/.test(f[i])) n += f[i++];
    if (n.length > 2) return false;
    if (n) { temDigito = true; saida += paraSubscrito(n) ?? n; }
    return true;
  };
  const lerElemento = (): boolean => {
    const dois = f.slice(i, i + 2);
    if (/^[A-Z][a-z]$/.test(dois) && ELEMENTOS.has(dois)) { saida += dois; i += 2; return true; }
    if (/^[A-Z]$/.test(f[i] ?? "") && ELEMENTOS.has(f[i])) { saida += f[i]; i++; return true; }
    return false;
  };
  while (i < f.length) {
    if (f[i] === "(") {
      saida += "("; i++; grupos++;
      let dentro = 0;
      while (i < f.length && f[i] !== ")") {
        if (!lerElemento() || !lerNumero()) return null;
        dentro++;
      }
      if (f[i] !== ")" || dentro === 0) return null;
      saida += ")"; i++;
      if (!lerNumero()) return null;
    } else {
      if (!lerElemento()) return null;
      grupos++;
      if (!lerNumero()) return null;
    }
  }
  return { grupos, temDigito, saida };
}

/** Coloca índices em fórmulas químicas reconhecíveis (só com símbolos de elementos reais). */
export function formatarQuimica(texto: string): string {
  const contar = (s: string, c: string) => s.split(c).length - 1;
  const partes = texto.split("```");
  return partes.map((p, i) => (i % 2 === 1 ? p : p.replace(
    /(?<![A-Za-z0-9_])(\d*)([A-Z][A-Za-z0-9()]*)(?![A-Za-z0-9_(])/g,
    (m, coef: string, formula: string) => {
      if (!/\d/.test(formula)) return m;
      let f = formula;
      let resto = "";
      // estado físico no fim: H2O(l), CO2(g), NaCl(aq)
      const estado = /\((?:s|l|g|aq)\)$/.exec(f);
      if (estado) { resto = estado[0]; f = f.slice(0, -resto.length); }
      // parêntese de fechamento que pertence à frase, não à fórmula: "(H2O)"
      while (f.endsWith(")") && contar(f, ")") > contar(f, "(")) { resto = ")" + resto; f = f.slice(0, -1); }
      const r = lerFormula(f);
      if (!r || !r.temDigito) return m;
      if (r.grupos < 2 && !SIMPLES_COM_INDICE.has(f)) return m;
      return coef + r.saida + resto;
    },
  ))).join("```");
}

/** Normalização completa: LaTeX/^/_ -> Unicode, depois fórmulas químicas. */
export function normalizarTexto(texto: string): string {
  return formatarQuimica(normalizarMatematica(texto));
}

// ---------------------------------------------------------------------------
// Filtro de palavrões (português e inglês)
// ---------------------------------------------------------------------------
// Lista INICIAL, em minúsculas e sem acento. Pode ser ampliada pela variável
// IA_PALAVROES_EXTRAS (lista separada por vírgulas). "cu" sozinho NÃO entra: é o símbolo do
// cobre (Cu); só as expressões ofensivas (ex.: "tomar no cu"), em minúsculas, são detectadas.
const PALAVROES = [
  "porra", "caralho", "carai", "merda", "merdinha", "bosta", "puta", "puto", "putaria", "putinha", "puteiro",
  "foda", "foder", "fodido", "fodida", "fodeu", "fodendo", "fodase", "buceta", "bucetinha", "xoxota", "xereca",
  "cuzao", "cuzona", "viado", "viadinho", "arrombado", "arrombada", "punheta", "siririca", "pqp", "fdp", "vsf", "vtnc",
  "fuck", "fucking", "fucker", "motherfucker", "shit", "bullshit", "bitch", "asshole", "cunt",
];
const EXPRESSOES = ["filho da puta", "filha da puta", "vai se foder", "vai tomar no", "foda se", "puta que pariu", "puta merda"];

function paraFiltro(texto: string): string {
  return texto
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/0/g, "o").replace(/1/g, "i").replace(/3/g, "e").replace(/4/g, "a")
    .replace(/5/g, "s").replace(/7/g, "t").replace(/@/g, "a").replace(/\$/g, "s");
}
const escapar = (c: string) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Cada letra pode repetir (caaaralho) e pode haver pontos, hífens, asteriscos ou "_" entre as letras (c.a.r.a.l.h.o).
const montar = (palavra: string) =>
  new RegExp(
    "(?<![a-z])" +
      palavra.split(" ").map((p) => p.split("").map((c) => escapar(c) + "+").join("[.\\-_*]*")).join("\\s+") +
      "(?:s|es)?(?![a-z])",
  );

let regexes: RegExp[] | null = null;
let chaveExtras = "";
function regexesAtuais(extras: string): RegExp[] {
  if (regexes && chaveExtras === extras) return regexes;
  const lista = [...PALAVROES, ...EXPRESSOES, ...extras.split(",").map((x) => paraFiltro(x.trim())).filter(Boolean)];
  regexes = lista.map(montar);
  chaveExtras = extras;
  return regexes;
}

/** true se o texto contém palavrão (português ou inglês), mesmo disfarçado. */
export function contemPalavrao(texto: string, extras = ""): boolean {
  const t = paraFiltro(texto);
  if (regexesAtuais(extras).some((r) => r.test(t))) return true;
  // Expressões com "cu" só valem em minúsculas no texto original (Cu = cobre não é palavrão).
  return /\b(no|do|meu|seu|teu)\s+cu\b/.test(texto);
}
