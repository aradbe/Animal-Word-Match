# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start Vite dev server (HashRouter → open http://localhost:5173/#/)
npm run build     # production build to dist/
npm run lint      # ESLint over the repo
npm run preview   # serve the production build locally
```

There is **no test runner configured** (no `test` script, no test framework installed). "Verifying"
a change means running the app and exercising the flow, plus `npm run build` (which surfaces
compile/import errors fast).

## What this is

A kids' "guess the animal" web game built for a React-module hackathon. An animal image is shown with
4 shuffled word choices; the player picks the right one. Questions are meant to be AI-generated and
stored in Supabase; admins manage the pool; logged-in players get saved progress; guests can play
unsaved.

Stack: **Vite + React 19 (plain JavaScript/JSX, not TypeScript)**, **Mantine** UI, **MobX** state,
**react-router-dom v7 (HashRouter)**, **Supabase** as the planned backend.

## Architecture (the parts that span multiple files)

**Service layer is mandatory — components never call Supabase (or any backend) directly.**
All data access goes through `src/services/*`, re-exported via `src/services/index.js`:
- `questionService` — `getQuestions(level, amount)`, `getAllQuestions()`, `generateQuestion(topic, level)`, `deleteQuestion(id)`
- `authService` — signup/login/logout/session/profile (currently stub comments)
- `gameResultService` — save result / get progress (currently stub comments)

Today these are backed by **in-memory mock data** (`src/data/mockQuestions.js`, exported as
`MOCK_QUESTIONS`) with an artificial `await wait()` delay (`src/services/mockApi.js`) that simulates
API latency so loading states can be built now. **The whole point:** real Supabase calls will be
dropped *inside* these service functions later, changing **no UI code**. Keep this boundary intact —
put data logic in services, not components.

**Data contracts (agreed team-wide, do not change shapes):**
- `question { id, image_url, correct_word, distractors: [3 words, never the answer], level: 1-3, topic, created_at }`
- `profile { id, display_name, role: 'kid' | 'admin' }`
- `game_result { id, user_id, score, total_questions, level, played_at }`

**Routing (`src/router/AppRouter.jsx`) uses `HashRouter` deliberately** — the app deploys to GitHub
Pages, which needs hash URLs. Routes: `/` (Welcome), `/game` (start screen), `/game/play` (the round),
`/results`, `/progress` (ProtectedRoute), `/admin` (AdminRoute), `/access-denied`, `*` (NotFound).
`ProtectedRoute`/`AdminRoute` currently gate on **hard-coded booleans** — they are stubs to be wired
to the auth MobX store; real auth is enforced by Supabase RLS + the Edge Function, never by UI hiding
alone.

**State: MobX.** Stores live in `src/stores/` (e.g. `authStore`, `gameStore`). A store is a class with
`makeAutoObservable(this)` exported as a single instance; components read it and must be wrapped in
`observer` (from `mobx-react-lite`) to react to changes. Game/session state is in-memory and resets on
refresh — persistence is a separate concern handled via `gameResultService` → Supabase.

**Mantine** is provided once: `<MantineProvider>` wraps `<AppRouter/>` in `src/App.jsx`, and
`@mantine/core/styles.css` is imported in `src/main.jsx`. Any component using Mantine must render inside
that provider.

## File organization

Flat, grouped by type (chosen by the team over a `features/` layout): `src/pages/` (route screens),
`src/components/` (reusable UI, with feature subfolders like `components/game/`), `src/router/`,
`src/services/`, `src/stores/`, `src/data/`, `src/utils/`. There is intentionally **no `src/features/`**.

## Conventions & gotchas

- **JavaScript, not TypeScript.** Editor IntelliSense relies on `@types/react` + a root `jsconfig.json`.
- Many scaffold files contain **Hebrew comments** left as TODO/《design intent》 notes — they are not
  instructions to you.
- `vite.config.js` has **no `base` set** — GitHub Pages deployment will require adding
  `base: '/Animal-Word-Match/'` (or the repo path). Not yet done.
- No Supabase client is wired yet; frontend must use only the Supabase URL + anon key (Gemini/API keys
  live in Edge Function secrets, never in the frontend). `.env` is gitignored; commit only `.env.example`.
- Design/plan docs for the game feature live in `docs/person-b/`.
