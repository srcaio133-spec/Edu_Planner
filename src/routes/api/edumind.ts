import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import type { Database } from "@/integrations/supabase/types";
import { createRunIdFetch } from "@/lib/edumind/run-id.server";
import { PROMPT_TUTOR } from "@/lib/edumind/prompts";
import { contemPalavrao } from "@/lib/edumind/formatacao";

const PAPEL: Record<string, string> = {
  aluno: "Você é o EduMind, tutor educacional de um aluno do ensino médio brasileiro. Use o método socrático: explique passo a passo, faça perguntas que guiem o raciocínio e não entregue respostas de tarefas avaliativas sem explicar. Ajude com planos de estudo, resumos, flashcards e questões no estilo ENEM, SSA (UPE), vestibulares e concursos.",
  professor: "Você é o EduMind, copiloto pedagógico de um professor. Gere questões com gabarito comentado, planos de aula estruturados (objetivos, desenvolvimento, atividades, avaliação), rubricas e pareceres descritivos. Pode criar itens no estilo ENEM/SSA/vestibulares/concursos.",
  gestao: "Você é o EduMind, assistente da gestão escolar. Produza resumos executivos, diagnósticos por turma e alertas de alunos em risco a partir dos dados fornecidos.",
};

export const Route = createFileRoute("/api/edumind")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace(/^Bearer /i, "");
        if (!token) return new Response("Não autenticado", { status: 401 });
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
        const sb = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: { headers: { Authorization: `Bearer ${token}`, apikey: key } },
        });
        const { data: u } = await sb.auth.getUser(token);
        if (!u.user) return new Response("Não autenticado", { status: 401 });
        const uid = u.user.id;

        const { messages } = (await request.json()) as { messages: UIMessage[] };
        const last = messages[messages.length - 1];
        const textoUser = last?.parts.map((p) => (p.type === "text" ? p.text : "")).join(" ") ?? "";
        if (last?.role === "user" && contemPalavrao(textoUser)) {
          return Response.json({ error: "Vamos manter a conversa respeitosa 🙂 Reescreva sua pergunta sem palavrões, por favor." }, { status: 422 });
        }
        if (last?.role === "user") {
          const { error } = await sb.from("edumind_mensagens").insert({ user_id: uid, role: "user", parts: last.parts as never });
          if (error) console.error("edumind save user", error);
        }

        // Contexto real do usuário (RLS aplica)
        const agora = new Date().toISOString();
        const [roles, prof, tarefas, provas, notas, tent, discs, freq, desemp, conts] = await Promise.all([
          sb.from("user_roles").select("role").eq("user_id", uid),
          sb.from("profiles").select("nome").eq("id", uid).maybeSingle(),
          sb.from("tarefas").select("titulo,prazo,categoria,disciplinas(nome)").gte("prazo", agora).order("prazo").limit(10),
          sb.from("provas").select("titulo,data,conteudo,disciplinas(nome),conteudos(titulo)").gte("data", agora).order("data").limit(10),
          sb.from("notas").select("valor,provas(titulo,disciplinas(nome))").eq("aluno_id", uid).limit(30),
          sb.from("tentativas").select("nota,acertos,total,simulados(titulo)").eq("aluno_id", uid).order("created_at", { ascending: false }).limit(5),
          sb.from("turma_disciplinas").select("professor_nome,disciplinas(nome),turmas(nome)").limit(30),
          sb.from("frequencias").select("presente").eq("aluno_id", uid),
          sb.rpc("desempenho_por_conteudo", { _aluno: uid }),
          sb.from("conteudos").select("titulo,disciplinas(nome)").order("ordem"),
        ]);
        const rs = (roles.data ?? []).map((r) => r.role);
        const perfil = rs.some((r) => ["admin", "diretor", "vice_diretor", "secretaria", "coordenacao"].includes(r)) ? "gestao" : rs.includes("professor") ? "professor" : "aluno";
        const contexto = JSON.stringify({
          nome: prof.data?.nome, data_hoje: agora.slice(0, 10),
          disciplinas_da_turma: (discs.data ?? []).map((d) => ({ disciplina: d.disciplinas?.nome, professor: d.professor_nome, turma: d.turmas?.nome })),
          frequencia_percentual: freq.data?.length ? Math.round((freq.data.filter((f) => f.presente).length * 100) / freq.data.length) : null,
          conteudos_por_disciplina: (conts.data ?? []).reduce<Record<string, string[]>>((acc, c) => { const d = c.disciplinas?.nome ?? "—"; (acc[d] ??= []).push(c.titulo); return acc; }, {}),
          desempenho_simulados_por_conteudo: desemp.data,
          proximas_tarefas: tarefas.data, proximas_provas: provas.data, minhas_notas: notas.data, simulados_recentes: tent.data,
        });
        const instructions = `${PROMPT_TUTOR}

PAPEL NESTA CONVERSA
${PAPEL[perfil]}
Nunca revele dados de outros alunos.
Priorize as disciplinas da turma e os conteúdos das próximas provas: é o que o aluno realmente estuda. Questões e exemplos devem ser dessas disciplinas e conteúdos. Use o desempenho por conteúdo para sugerir o que revisar (onde há mais erros).
Dados reais do usuário no EduPlanner (use quando relevante): ${contexto}`;

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("IA não configurada", { status: 500 });
        const run = createRunIdFetch();
        const provider = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey,
          headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
          fetch: run.fetch,
        });
        const result = streamText({
          model: provider.responses("openai/gpt-6-astra"),
          instructions,
          messages: await convertToModelMessages(messages),
          abortSignal: request.signal,
          providerOptions: {
            openai: { store: false, forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", include: ["reasoning.encrypted_content"] },
          },
        });
        return result.toUIMessageStreamResponse({
          originalMessages: messages,
          onFinish: async ({ responseMessage }) => {
            const parts = responseMessage.parts.filter((p) => p.type === "text");
            if (!parts.length) return;
            const { error } = await sb.from("edumind_mensagens").insert({ user_id: uid, role: "assistant", parts: parts as never });
            if (error) console.error("edumind save assistant", error);
          },
          onError: (e) => {
            console.error(e);
            const s = (e as { statusCode?: number })?.statusCode;
            if (s === 402) return "Os créditos de IA acabaram. Peça ao responsável para recarregar.";
            if (s === 429) return "Muitas perguntas seguidas. Aguarde alguns segundos.";
            return "O EduMind não conseguiu responder agora. Tente novamente.";
          },
        });
      },
    },
  },
});
