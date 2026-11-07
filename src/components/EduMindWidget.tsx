import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { MensagemEduMind } from "@/components/MensagemEduMind";
import { Brain, Send, Square, X, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import type { Perfil } from "@/lib/perfil";

const SUGESTOES: Record<Perfil, string[]> = {
  aluno: ["Monte meu plano de estudos para esta semana", "Me faça 3 questões estilo ENEM de Matemática", "Explique a fotossíntese passo a passo", "Crie flashcards para minha próxima prova"],
  professor: ["Crie 5 questões estilo SSA com gabarito comentado", "Monte um plano de aula de 50 min sobre funções", "Sugira uma rubrica de redação ENEM"],
  gestao: ["Faça um resumo executivo das atividades da semana", "Como identificar alunos em risco de reprovação?"],
};

export function EduMindWidget({ userId, perfil }: { userId: string; perfil: Perfil }) {
  const [aberto, setAberto] = useState(false);
  const [pendente, setPendente] = useState<string | null>(null);
  useEffect(() => {
    const h = (e: Event) => { setPendente((e as CustomEvent<string>).detail); setAberto(true); };
    window.addEventListener("edumind:perguntar", h);
    return () => window.removeEventListener("edumind:perguntar", h);
  }, []);
  const [inicial, setInicial] = useState<UIMessage[] | null>(null);

  useEffect(() => {
    if (!aberto || inicial) return;
    supabase.from("edumind_mensagens").select("id,role,parts").eq("user_id", userId).order("created_at").limit(100)
      .then(({ data }) => setInicial((data ?? []).map((m) => ({ id: m.id, role: m.role as "user" | "assistant", parts: m.parts as UIMessage["parts"] }))));
  }, [aberto, inicial, userId]);

  return (
    <>
      {!aberto && (
        <button onClick={() => setAberto(true)} aria-label="Abrir EduMind"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-gradient-button px-4 py-3 font-semibold text-on-brand shadow-card transition hover:scale-105">
          <Brain className="size-5" /> EduMind
        </button>
      )}
      {aberto && (
        <div className="fixed bottom-0 right-0 z-50 flex h-[85vh] w-full flex-col overflow-hidden border border-border bg-card shadow-card sm:bottom-5 sm:right-5 sm:h-[600px] sm:w-[400px] sm:rounded-2xl">
          {inicial ? <Chat key="chat" pendente={pendente} onConsumido={() => setPendente(null)} inicial={inicial} perfil={perfil} userId={userId} onClose={() => setAberto(false)} onReset={() => setInicial([])} />
            : <div className="grid flex-1 place-items-center text-sm text-muted-foreground">Carregando…</div>}
        </div>
      )}
    </>
  );
}

function Chat({ inicial, perfil, userId, onClose, onReset, pendente, onConsumido }: { pendente: string | null; onConsumido: () => void; inicial: UIMessage[]; perfil: Perfil; userId: string; onClose: () => void; onReset: () => void }) {
  const transport = useMemo(() => new DefaultChatTransport({
    api: "/api/edumind",
    headers: async (): Promise<Record<string, string>> => {
      const { data } = await supabase.auth.getSession();
      return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {};
    },
  }), []);
  const { messages, sendMessage, status, stop, error, setMessages } = useChat({ messages: inicial, transport });
  const [txt, setTxt] = useState("");
  const ta = useRef<HTMLTextAreaElement>(null);
  const fim = useRef<HTMLDivElement>(null);
  const ocupado = status === "submitted" || status === "streaming";

  useEffect(() => { fim.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, status]);
  useEffect(() => { if (!ocupado) ta.current?.focus(); }, [ocupado]);

  useEffect(() => {
    if (pendente && !ocupado) { sendMessage({ text: pendente }); onConsumido(); }
  }, [pendente, ocupado, sendMessage, onConsumido]);
  function enviar(t: string) {
    if (!t.trim() || ocupado) return;
    sendMessage({ text: t.trim() });
    setTxt("");
  }
  async function nova() {
    if (!confirm("Apagar a conversa e começar outra?")) return;
    await supabase.from("edumind_mensagens").delete().eq("user_id", userId);
    setMessages([]); onReset();
  }

  return (
    <>
      <div className="flex items-center gap-2 bg-gradient-brand px-4 py-3 text-on-brand">
        <Brain className="size-6" />
        <div className="flex-1"><div className="font-bold leading-tight">EduMind</div><div className="text-xs opacity-80">Sua IA educacional</div></div>
        <Button size="icon" variant="ghost" className="text-on-brand hover:bg-white/10" aria-label="Nova conversa" onClick={nova}><RotateCcw /></Button>
        <Button size="icon" variant="ghost" className="text-on-brand hover:bg-white/10" aria-label="Fechar" onClick={onClose}><X /></Button>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Olá! Sou o EduMind. Conheço suas tarefas, provas e notas. Como posso ajudar?</p>
            {SUGESTOES[perfil].map((s) => (
              <button key={s} onClick={() => enviar(s)} className="block w-full rounded-xl border border-border px-3 py-2 text-left text-sm hover:bg-accent">{s}</button>
            ))}
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "ml-8 rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground" : "prose prose-sm max-w-none text-sm text-foreground dark:prose-invert"}>
            {m.parts.map((p, i) => p.type === "text" ? (m.role === "user" ? <span key={i} className="whitespace-pre-wrap">{p.text}</span> : <MensagemEduMind key={i} texto={p.text} />) : null)}
          </div>
        ))}
        {status === "submitted" && <div className="text-sm text-muted-foreground animate-pulse">EduMind está pensando…</div>}
        {error && <div className="rounded-xl bg-danger-soft p-2 text-sm text-destructive">{(() => { try { return JSON.parse(error.message).error as string; } catch { return error.message || "Não foi possível responder."; } })()}</div>}
        <div ref={fim} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); enviar(txt); }} className="flex items-end gap-2 border-t border-border p-3">
        <textarea ref={ta} value={txt} rows={1} placeholder="Pergunte ao EduMind…"
          onChange={(e) => setTxt(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(txt); } }}
          className="max-h-32 min-h-10 flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        {ocupado ? <Button type="button" size="icon" variant="outline" aria-label="Parar" onClick={() => stop()}><Square /></Button>
          : <Button type="submit" size="icon" aria-label="Enviar" disabled={!txt.trim()}><Send /></Button>}
      </form>
    </>
  );
}
