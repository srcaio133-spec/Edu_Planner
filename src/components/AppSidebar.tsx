import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, ClipboardList, FileText, GraduationCap, CalendarDays, School, BookOpen, UserRound, Trophy, Users, UserPlus, BarChart3, CheckSquare, Award, Megaphone } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { Logo, BookMark } from "@/components/Logo";
import type { Perfil } from "@/lib/perfil";

type Item = { title: string; url: string; icon: typeof LayoutDashboard; perfis: Perfil[] };
const TODOS: Perfil[] = ["aluno", "professor", "gestao"];
const ESTUDO: Item[] = [
  { title: "Painel", url: "/painel", icon: LayoutDashboard, perfis: TODOS },
  { title: "Tarefas", url: "/tarefas", icon: ClipboardList, perfis: TODOS },
  { title: "Provas", url: "/provas", icon: FileText, perfis: TODOS },
  { title: "Notas", url: "/notas", icon: GraduationCap, perfis: TODOS },
  { title: "Chamada", url: "/frequencia", icon: CheckSquare, perfis: ["professor", "gestao"] },
  { title: "Simulados", url: "/simulados", icon: Trophy, perfis: TODOS },
  { title: "Desafios", url: "/desafios", icon: Award, perfis: TODOS },
  { title: "Agenda", url: "/agenda", icon: CalendarDays, perfis: TODOS },
  { title: "Comunicados", url: "/comunicados", icon: Megaphone, perfis: TODOS },
  { title: "Meu perfil", url: "/perfil", icon: UserRound, perfis: TODOS },
];
const GESTAO: Item[] = [
  { title: "Desempenho por turma", url: "/desempenho", icon: BarChart3, perfis: ["gestao"] },
  { title: "Matrículas", url: "/matriculas", icon: UserPlus, perfis: ["gestao"] },
  { title: "Turmas", url: "/turmas", icon: School, perfis: ["gestao"] },
  { title: "Disciplinas", url: "/disciplinas", icon: BookOpen, perfis: ["gestao"] },
  { title: "Usuários e papéis", url: "/usuarios", icon: Users, perfis: ["gestao"] },
];

export function AppSidebar({ perfil }: { perfil: Perfil }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });
  const grupo = (label: string, itens: Item[]) => {
    const vis = itens.filter((i) => i.perfis.includes(perfil));
    if (!vis.length) return null;
    return (
      <SidebarGroup>
        <SidebarGroupLabel>{label}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {vis.map((i) => (
              <SidebarMenuItem key={i.url}>
                <SidebarMenuButton asChild isActive={path === i.url} tooltip={i.title}>
                  <Link to={i.url}><i.icon /><span>{i.title}</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">{collapsed ? <BookMark className="size-7 text-primary" /> : <Logo subtitle="Organize seus estudos" />}</SidebarHeader>
      <SidebarContent>
        {grupo("Menu", ESTUDO)}
        {grupo("Gestão", GESTAO)}
      </SidebarContent>
    </Sidebar>
  );
}
