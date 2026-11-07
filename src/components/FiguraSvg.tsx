import { useMemo } from "react";
import { renderizarFigura, validarFigura, type Figura } from "@/lib/edumind/figuras";

/** Desenha uma figura (triângulo, béquer, gráfico...) a partir da especificação validada. */
export function FiguraSvg({ spec, className }: { spec: unknown; className?: string }) {
  const r = useMemo(() => {
    const v = validarFigura(spec);
    if (!v.ok) return null;
    return { svg: renderizarFigura(v.valor as Figura), descricao: (v.valor as Figura).descricao };
  }, [spec]);
  if (!r) return null;
  // SVG gerado pelo nosso código a partir de números/textos validados e escapados (não vem da IA).
  return (
    <figure className={`my-3 overflow-hidden rounded-xl border border-border bg-white p-2 ${className ?? ""}`} role="img" aria-label={r.descricao}>
      <div className="[&>svg]:mx-auto [&>svg]:h-auto [&>svg]:max-w-full" dangerouslySetInnerHTML={{ __html: r.svg }} />
    </figure>
  );
}
