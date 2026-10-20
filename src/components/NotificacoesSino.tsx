import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { fmtData } from "@/lib/dados";

export function NotificacoesSino({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["notificacoes", userId],
    refetchInterval: 60_000,
    queryFn: async () => (await supabase.from("notificacoes").select("id,titulo,lida,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(20)).data ?? [],
  });
  const naoLidas = (data ?? []).filter((n) => !n.lida).length;
  async function marcarTodas() {
    await supabase.from("notificacoes").update({ lida: true }).eq("user_id", userId).eq("lida", false);
    qc.invalidateQueries({ queryKey: ["notificacoes", userId] });
  }
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notificações (${naoLidas} não lidas)`}>
          <Bell />
          {naoLidas > 0 && <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">{naoLidas}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border p-3"><span className="font-bold">Notificações</span>{naoLidas > 0 && <button className="text-xs text-primary" onClick={marcarTodas}>Marcar todas como lidas</button>}</div>
        <div className="max-h-80 overflow-y-auto">
          {(data ?? []).map((n) => (
            <div key={n.id} className={`border-b border-border p-3 text-sm last:border-0 ${n.lida ? "text-muted-foreground" : "font-medium"}`}>{n.titulo}<div className="text-xs text-muted-foreground">{fmtData(n.created_at)}</div></div>
          ))}
          {data?.length === 0 && <p className="p-4 text-sm text-muted-foreground">Nada por aqui.</p>}
        </div>
      </PopoverContent>
    </Popover>
  );
}
