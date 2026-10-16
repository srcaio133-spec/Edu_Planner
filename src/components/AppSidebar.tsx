import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, ClipboardList, FileText, GraduationCap, CalendarDays, School, BookOpen, UserRound } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { Logo, BookMark } from "@/components/Logo";
import type { Perfil } from "@/lib/perfil";

type Item = { title: string; url: string; icon: typeof LayoutDashboard; perfis: Perfil[] };
const ITENS: Item[] = [
  { title: "Painel", url: "/painel", icon: LayoutDashboard, perfis: ["aluno", "professor", "gestao"] },
  { title: "Tarefas", url: "/tarefas", icon: ClipboardList, perfis: ["aluno", "professor", "gestao"] },
  { title: "Provas", url: "/provas", icon: FileText, perfis: ["aluno", "professor", "gestao"] },
  { title: "Notas", url: "/notas", icon: GraduationCap, perfis: ["aluno", "professor", "gestao"] },
  { title: "Agenda", url: "/agenda", icon: CalendarDays, perfis: ["aluno", "professor", "gestao"] },
  { title: "Turmas", url: "/turmas", icon: School, perfis: ["gestao"] },
  { title: "Disciplinas", url: "/disciplinas", icon: BookOpen, perfis: ["gestao"] },
  { title: "Meu perfil", url: "/perfil", icon: UserRound, perfis: ["aluno", "professor", "gestao"] },
];

export function AppSidebar({ perfil }: { perfil: Perfil }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">{collapsed ? <BookMark className="size-7 text-primary" /> : <Logo subtitle="Organize seus estudos" />}</SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {ITENS.filter((i) => i.perfis.includes(perfil)).map((i) => (
                <SidebarMenuItem key={i.url}>
                  <SidebarMenuButton asChild isActive={path === i.url} tooltip={i.title}>
                    <Link to={i.url}><i.icon /><span>{i.title}</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
