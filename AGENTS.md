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
