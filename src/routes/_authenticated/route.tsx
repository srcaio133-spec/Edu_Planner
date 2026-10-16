import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeButton } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { usePerfil } from "@/lib/dados";
import { ROLE_LABEL, rolePrincipal } from "@/lib/perfil";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/" });
    return { user: data.user };
  },
  component: Layout,
});

function Layout() {
  const { user } = Route.useRouteContext();
  const { data } = usePerfil(user.id);
  const perfil = data?.perfil ?? "aluno";
  const qc = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.dataset["perfil"] = perfil;
  }, [perfil]);

  async function sair() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar perfil={perfil} />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 items-center gap-3 border-b border-border bg-sidebar px-4">
            <SidebarTrigger />
            <div className="flex-1 truncate text-sm text-muted-foreground">
              {data ? `${data.nome || user.email} · ${ROLE_LABEL[rolePrincipal(data.roles)]}` : ""}
            </div>
            <ThemeButton />
            <Button variant="outline" className="rounded-xl" onClick={sair}><LogOut /> <span className="hidden sm:inline">Sair</span></Button>
          </header>
          <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6"><Outlet /></main>
        </div>
      </div>
    </SidebarProvider>
  );
}
