import { cn } from "@/lib/utils";

/** Livro aberto em SVG: herda a cor via `currentColor` (muda por perfil). */
export function BookMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 40" fill="none" className={cn("size-9", className)} aria-hidden="true">
      <path d="M24 9c-5-4-12-5-19-4v28c7-1 14 0 19 4 5-4 12-5 19-4V5c-7-1-14 0-19 4Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" fill="currentColor" fillOpacity="0.08" />
      <path d="M24 9v28" stroke="currentColor" strokeWidth="3" />
      <path d="M10 13h9M10 19h9M10 25h7M29 13h9M29 19h9M29 25h7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ subtitle, className, inverse }: { subtitle?: string; className?: string; inverse?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <BookMark className={inverse ? "text-on-brand" : "text-primary"} />
      <div className="leading-tight">
        <div className={cn("text-xl font-extrabold tracking-tight", inverse ? "text-on-brand" : "text-brand-deep dark:text-foreground")}>
          Edu<span className={inverse ? "" : "text-primary"}>Planner</span>
        </div>
        {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
      </div>
    </div>
  );
}
