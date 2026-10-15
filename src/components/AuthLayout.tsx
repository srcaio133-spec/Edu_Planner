import type { ReactNode } from "react";
import { CalendarDays, GraduationCap, Pencil, BarChart3, CheckCircle2, Moon, Sun } from "lucide-react";
import { BookMark } from "@/components/Logo";
import { useTheme } from "@/lib/theme";
import materiais from "@/assets/login-materiais.png";

export function ThemeButton() {
  const { dark, toggle } = useTheme();
  return (
    <button type="button" onClick={toggle} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-card hover:bg-muted" aria-label="Alternar tema claro/escuro">
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />} Tema
    </button>
  );
}

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-card">
      <aside className="relative hidden w-[44%] max-w-[620px] flex-col items-center overflow-hidden bg-gradient-brand px-10 pb-0 pt-24 text-on-brand lg:flex">
        <div className="pointer-events-none absolute inset-0 opacity-15" aria-hidden>
          <CalendarDays className="absolute left-16 top-20 size-14" strokeWidth={1.2} />
          <GraduationCap className="absolute right-20 top-24 size-14" strokeWidth={1.2} />
          <Pencil className="absolute left-10 top-[38%] size-10" strokeWidth={1.2} />
          <BarChart3 className="absolute right-14 top-[45%] size-12" strokeWidth={1.2} />
          <CheckCircle2 className="absolute left-14 top-[55%] size-10" strokeWidth={1.2} />
          <GraduationCap className="absolute bottom-10 right-1/3 size-12" strokeWidth={1.2} />
        </div>
        <BookMark className="size-20 text-on-brand" />
        <h1 className="mt-4 text-5xl font-extrabold tracking-tight">EduPlanner</h1>
        <p className="mt-5 text-center text-lg font-medium leading-relaxed opacity-90">
          Organize seus estudos.<br />Alcance seus objetivos.
        </p>
        <img src={materiais} alt="Livros, calendário de mesa e lápis" width={1024} height={640} className="mt-auto w-full max-w-md drop-shadow-2xl" />
      </aside>
      <main className="relative flex flex-1 flex-col">
        <div className="flex justify-end p-6"><ThemeButton /></div>
        <div className="flex flex-1 items-center justify-center px-6 pb-12">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </main>
    </div>
  );
}

export function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
  );
}
export function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden><path fill="#F25022" d="M1 1h10v10H1z"/><path fill="#7FBA00" d="M13 1h10v10H13z"/><path fill="#00A4EF" d="M1 13h10v10H1z"/><path fill="#FFB900" d="M13 13h10v10H13z"/></svg>
  );
}
