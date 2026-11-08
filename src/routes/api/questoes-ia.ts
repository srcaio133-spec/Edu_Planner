import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { createOpenAI } from "@ai-sdk/openai";
import { Output, streamText } from "ai";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { createRunIdFetch } from "@/lib/edumind/run-id.server";
import { FORMATOS_DE_FIGURA, validarFigura } from "@/lib/edumind/figuras";
import { contemPalavrao, normalizarTexto } from "@/lib/edumind/formatacao";

const Pedido = z.object({
  disciplina_id: z.string().uuid(),
  conteudo_id: z.string().uuid().nullable(),
  categoria: z.enum(["enem", "ssa", "vestibular", "concurso"]),
  quantidade: z.number().int().min(1).max(5),
});

const Saida = z.object({
  questoes: z.array(z.object({
    enunciado: z.string(),
    alternativas: z.array(z.string()),
    correta: z.number().int(),
    explicacao: z.string(),
    figura_json: z.string().nullable(),
  })),
});

export const Route = createFileRoute("/api/questoes-ia")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace(/^Bearer /i, "");
        if (!token) return Response.json({ error: "Não autenticado" }, { status: 401 });
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
        const sb = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: { headers: { Authorization: `Bearer ${token}`, apikey: key } },
        });
        const { data: u } = await sb.auth.getUser(token);
        if (!u.user) return Response.json({ error: "Não autenticado" }, { status: 401 });
        const { data: pode } = await sb.rpc("pode_gerir_questoes", { _u: u.user.id });
        if (!pode) return Response.json({ error: "Apenas professores e gestão geram questões." }, { status: 403 });

        const p = Pedido.safeParse(await request.json());
        if (!p.success) return Response.json({ error: "Pedido inválido" }, { status: 400 });
        const [d, c] = await Promise.all([
          sb.from("disciplinas").select("nome").eq("id", p.data.disciplina_id).single(),
          p.data.conteudo_id ? sb.from("conteudos").select("titulo").eq("id", p.data.conteudo_id).single() : Promise.resolve({ data: null }),
        ]);
        if (!d.data) return Response.json({ error: "Disciplina não encontrada" }, { status: 404 });

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return Response.json({ error: "IA não configurada" }, { status: 500 });
        const run = createRunIdFetch();
        const provider = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1", apiKey,
          headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" }, fetch: run.fetch,
        });
        const estilo = { enem: "ENEM", ssa: "SSA (UPE)", vestibular: "vestibular", concurso: "concurso público" }[p.data.categoria];
        try {
          const result = streamText({
            model: provider.responses("openai/gpt-6-astra"),
            instructions: `Você elabora questões INÉDITAS para estudantes brasileiros do Ensino Médio, no ESTILO do exame pedido, sem copiar provas reais.
Cada questão: enunciado claro, exatamente 5 alternativas (sem letras no texto), apenas UMA correta (índice 0 a 4 em "correta"), explicação passo a passo.
Use símbolos Unicode (x², H₂O, √, ≤); nunca LaTeX, ^ ou _. Nunca palavrões.
Se uma figura ajudar, preencha "figura_json" com UM objeto JSON (texto) num dos formatos abaixo; senão use null. As medidas devem ser exatamente as do enunciado.
${FORMATOS_DE_FIGURA}`,
            prompt: `Crie ${p.data.quantidade} questão(ões) de ${d.data.nome}${c.data ? `, conteúdo "${c.data.titulo}"` : ""}, estilo ${estilo}.`,
            output: Output.object({ schema: Saida }),
            abortSignal: request.signal,
            providerOptions: { openai: { store: false, forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", include: ["reasoning.encrypted_content"] } },
          });
          const out = await result.output;
          const linhas = out.questoes
            .filter((q) => q.alternativas.length === 5 && q.correta >= 0 && q.correta <= 4)
            .filter((q) => !contemPalavrao(q.enunciado + q.alternativas.join(" ") + q.explicacao))
            .map((q) => {
              let figura: unknown = null;
              if (q.figura_json) { try { const v = validarFigura(JSON.parse(q.figura_json)); if (v.ok) figura = v.valor; } catch { /* ignora */ } }
              return { ...q, figura, enunciado: normalizarTexto(q.enunciado), alternativas: q.alternativas.map(normalizarTexto), explicacao: normalizarTexto(q.explicacao) };
            });
          let salvas = 0;
          for (const q of linhas) {
            const ins = await sb.from("questoes").insert({
              categoria: p.data.categoria, area: d.data.nome, enunciado: q.enunciado, alternativas: q.alternativas,
              disciplina_id: p.data.disciplina_id, conteudo_id: p.data.conteudo_id, figura: q.figura as never, status: "em_revisao", autor_id: u.user.id,
            }).select("id").single();
            if (ins.error || !ins.data) { console.error(ins.error); continue; }
            const g = await sb.from("questoes_gabarito").insert({ questao_id: ins.data.id, correta: q.correta, explicacao: q.explicacao });
            if (g.error) console.error(g.error); else salvas++;
          }
          return Response.json({ salvas });
        } catch (e) {
          console.error(e);
          const s = (e as { statusCode?: number })?.statusCode;
          if (s === 402) return Response.json({ error: "Os créditos de IA acabaram." }, { status: 402 });
          if (s === 429) return Response.json({ error: "Muitos pedidos seguidos. Aguarde um pouco." }, { status: 429 });
          return Response.json({ error: "Não foi possível gerar as questões agora." }, { status: 500 });
        }
      },
    },
  },
});
