import ReactMarkdown from "react-markdown";
import { FiguraSvg } from "@/components/FiguraSvg";
import { contemPalavrao, normalizarTexto } from "@/lib/edumind/formatacao";
import { lerObjetoJson } from "@/lib/edumind/figuras";

type Pedaco = { tipo: "texto"; texto: string } | { tipo: "figura"; spec: unknown };

/** Separa o texto da IA em trechos de Markdown e blocos [[FIGURA]]{json}[[/FIGURA]]. Bloco ainda incompleto (durante o streaming) fica oculto. */
export function separarFiguras(texto: string): Pedaco[] {
  const out: Pedaco[] = [];
  let resto = texto;
  while (resto) {
    const i = resto.indexOf("[[FIGURA]]");
    if (i === -1) { out.push({ tipo: "texto", texto: resto }); break; }
    if (i > 0) out.push({ tipo: "texto", texto: resto.slice(0, i) });
    const j = resto.indexOf("[[/FIGURA]]", i);
    if (j === -1) break; // figura ainda chegando
    try { out.push({ tipo: "figura", spec: lerObjetoJson(resto.slice(i + 10, j)) }); } catch { /* bloco inválido some */ }
    resto = resto.slice(j + 11);
  }
  return out;
}

export function MensagemEduMind({ texto }: { texto: string }) {
  if (contemPalavrao(texto)) return <p className="text-sm text-muted-foreground">Esta resposta foi ocultada por conter linguagem imprópria. Tente perguntar de novo.</p>;
  return (
    <>
      {separarFiguras(texto).map((p, i) =>
        p.tipo === "figura" ? <FiguraSvg key={i} spec={p.spec} /> : <ReactMarkdown key={i}>{normalizarTexto(p.texto)}</ReactMarkdown>,
      )}
    </>
  );
}
