<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Signed-in pages live under src/routes/_authenticated/ and share the sidebar layout in its route.tsx; menu items per profile are defined in src/components/AppSidebar.tsx (single source for navigation).
- Shared data hooks (profile/roles, turmas/disciplinas) live in src/lib/dados.ts so pages reuse the same query keys.
- EduMind AI chat streams from the server route src/routes/api/edumind.ts (verifies the bearer, builds context with the user's RLS-scoped client, one persisted conversation per user); the widget is mounted once in _authenticated/route.tsx.
- Simulado answer keys live in questoes_gabarito (staff-only RLS); students are graded only through the enviar_tentativa security-definer function so answers never reach the browser before submission.
- Role changes go only through the definir_papel security-definer function (hierarchy: secretaria/coordenação assign aluno/professor; direção also assigns management roles; never self) and are audited; user_roles has no direct write policies.
- Points, challenge completion, reward redemption and announcement approval are enforced in security-definer functions (resgatar_desafio, trocar_recompensa, avaliar_comunicado); a BEFORE INSERT trigger forces professor announcements to "pendente".
- EduMind grounds explanations in each topic's study material (conteudos.resumo, edited by management on Disciplinas); students only get topics of their class subjects.
- EduMind figures: the model emits [[FIGURA]]{json}[[/FIGURA]] specs; src/lib/edumind/figuras.ts (ported from the user's kit) validates and draws the SVG, so measurements are always exact; never render model-written SVG/HTML.
- AI-generated questions are saved with status "em_revisao" and only reach students after staff approval (RLS hides non-approved questions from students).
