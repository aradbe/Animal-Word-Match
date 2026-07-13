# Game feature — code guide (B1 + B2 + B3 + B4 + B5)

A file-by-file explanation of Person B's game feature: **B1** (game UI), **B2** (MobX store:
score/streak/round/results), **B3** (real questions from Supabase + loading/error/broken-image),
**B4** (save results + My Progress), and **B5** (theme + mobile + confetti + animations).
Integrated into Ilan's (C) scaffold and arad's (A) Supabase.

> **Status:** B1–B5 complete (code). Warm/playful theme applied app-wide; game fetches real
> questions from Supabase, tracks score/streak, saves results for logged-in users, My Progress
> lists history, confetti + answer animations for delight, mobile-friendly, back-to-menu buttons.
> NOTE: real saving only persists once Ilan wires **real Supabase auth** (his `authService` is
> still a localStorage mock — mock-logged-in saves fail gracefully). Also: login accounts live in
> localStorage per-browser, so you can only log in from the browser you signed up in until real
> Supabase auth lands.

---

## Where the files live (flat structure, adopted from C)

```
src/data/mockQuestions.js             5 questions, exported as MOCK_QUESTIONS (single source)
src/utils/shuffle.js                  randomizes the 4 answers
src/stores/gameStore.js               MobX store — all game state + rules (the brain)
src/components/game/GamePage.jsx      the screen — an observer that displays the store
src/components/game/QuestionCard.jsx  the animal image + prompt
src/components/game/AnswerButton.jsx  one clickable answer
src/components/game/ScoreBar.jsx      live score + streak badges
src/components/game/ResultsCard.jsx   end-of-round result + "Play again"
src/pages/GameRoundPage.jsx           C's route page (/game/play) — renders <GamePage/>
```

**How it reaches the screen:** C's `AppRouter` maps `/game/play` → `GameRoundPage` →
`<GamePage/>`. Mantine works because `App.jsx` wraps `<AppRouter/>` in `<MantineProvider>`
and `main.jsx` imports `@mantine/core/styles.css`.

**The B2 shift:** in B1 the game state lived in `GamePage` via `useState`. In B2 it moved into
`gameStore` (MobX), and `GamePage` became a pure `observer` that just reads the store and calls
its actions.

---

## `src/data/mockQuestions.js`

Array of 5 objects matching the **`question` contract**:
`{ id, image_url, correct_word, distractors:[3], level:1-3, topic, created_at }`.

- Exported as **`MOCK_QUESTIONS`** — the single source; both `gameStore` and C's
  `questionService` import it.
- Topics: `farm` (cow, horse, chicken) + `sea` (dolphin, octopus).
- Images are **Wikimedia Commons** URLs (stable; Pollinations/loremflickr were rejected).
- Same shape as the contract, so the B3 switch to `questionService.getQuestions()` changes no UI.

---

## `src/utils/shuffle.js`

Pure Fisher–Yates shuffle; returns a new array. Exists so the correct answer (always first in
`[correct_word, ...distractors]`) lands in a random position each question.

---

## `src/stores/gameStore.js`  ← the brain (B2)

A MobX store: **all game state + the rules to change it**, separate from the UI. One shared
instance (`export const gameStore = new GameStore()`), in-memory, resets on refresh.

- **Observable state:** `questions`, `currentIndex`, `selected`, `score`, `streak`,
  `bestStreak`, `status` (`'idle' | 'playing' | 'finished'`).
- **`makeAutoObservable(this)`** in the constructor makes fields observable, getters computed,
  methods actions.
- **Computeds:** `currentQuestion`, `totalQuestions`, `isLast`, `answered`.
- **Actions:** `startRound(questions = MOCK_QUESTIONS)` (reset + play), `selectAnswer(word)`
  (records the pick, updates score/streak; wrong answer resets streak), `next()` (advance or
  finish).
- Per-user? No — it's one instance in the browser holding the *current session*. Persistent
  per-account results are a separate concern (B4, `game_results`).

---

## `src/components/game/GamePage.jsx`  ← the screen (observer)

Wrapped in **`observer(...)`** so it auto-re-renders when any store value it reads changes.
Holds **no** game state of its own.

- On mount: `useEffect(() => gameStore.startRound(), [])`.
- Reads `gameStore.currentQuestion / currentIndex / totalQuestions / answered / selected /
  status / isLast / score / streak / bestStreak`.
- Click an answer → `gameStore.selectAnswer(word)`; Next → `gameStore.next()`.
- **`useMemo`** still shuffles answers per question (random → must stay out of a MobX computed).
- Guards: `if (!question) return null` for the first frame before `startRound` runs.
- Renders `<ScoreBar/>`, `<QuestionCard/>`, the `<AnswerButton/>` list, feedback, and — when
  `status === 'finished'` — `<ResultsCard/>`.
- Has a top-of-file comment block summarizing current state for the team.

---

## `src/components/game/QuestionCard.jsx`

Presentational. `Card` + `Card.Section` + **`AspectRatio ratio={4/3}`** so every image box is
the same size regardless of the source photo. `alt=""` (decorative — must not leak the answer).

## `src/components/game/AnswerButton.jsx`

One answer. `STATUS_PROPS` maps `idle/correct/wrong/muted` → Mantine `Button` props. **Lock
gotcha:** doesn't use Mantine's `disabled` (which greys out and hides the color); locks with
`style={{ pointerEvents: disabled ? 'none' : 'auto' }}`.

## `src/components/game/ScoreBar.jsx`  (B2)

Dumb, prop-driven (`score`, `streak`). Two Mantine `Badge`s in a `Group` — score (blue) and
streak (orange when `streak > 1`, else grey). `GamePage` (observer) feeds fresh values, so it
updates live.

## `src/components/game/ResultsCard.jsx`  (B2)

Dumb, prop-driven (`score`, `total`, `bestStreak`, `onPlayAgain`). Shows `score / total`, best
streak, and a **Play again** button that calls `gameStore.startRound()`.

---

## The core loop (B2)

```
click "horse"
  → AnswerButton → gameStore.selectAnswer('horse')   (an ACTION)
  → store mutates selected/score/streak
  → observer components (GamePage) auto re-render
  → buttons recolor, ScoreBar updates, feedback + Next appear
```

Store = **what's true**; components = **how it looks**; MobX keeps them in sync.

---

## B3 — real data & async states

The game now loads **real questions from Supabase**, with proper async handling.

- **`questionService.getAllQuestions()`** (`src/services/questionService.js`) now queries
  `supabase.from("questions").select("*")`. On any error (network/RLS/bad key) or an empty table
  it returns `MOCK_QUESTIONS` — it **never throws**, so the game never blocks (team rule).
- **`gameStore.startRound()` is now `async`:** sets `status = 'loading'`, `await`s
  `questionService.getAllQuestions()`, then `shuffle(pool).slice(0, ROUND_SIZE)` builds the round
  and sets `status = 'playing'`. On failure → `status = 'error'` + `error` message. Store now has
  a `status` of `'idle' | 'loading' | 'playing' | 'finished' | 'error'` and an `error` field.
  State changed **after an `await` is wrapped in `runInAction`** (MobX requirement).
- **`GamePage`** renders per status: `loading` → centered `<Loader/>`; `error` → message +
  **Try again** (`startRound()`); then the `finished` / `!question` / playing screens. Order of the
  early returns matters (loading → error → finished → `!question` → playing).
- **`QuestionCard`** has `fallbackSrc={IMAGE_FALLBACK}` — an **inline SVG data URI** placeholder
  ("Image unavailable") shown if a question's `image_url` fails to load. Inline so the fallback
  itself can't 404.
- **Verified:** the Network tab shows the `questions?select=*` request to Supabase (200). React
  StrictMode double-fires the fetch in dev — harmless.

---

## B4 — save results & My Progress

Tracks each finished round to `game_results` for logged-in users, and shows the history.

- **`gameResultService`** (`src/services/gameResultService.js`, exported via `services/index.js`):
  - `saveGameResult(result)` → `supabase.from("game_results").insert(...).select().single()`;
    throws on error (caller handles).
  - `getUserProgress(userId)` → `select * where user_id eq, order created_at desc`; returns `[]`.
- **`gameStore.saveResult()`** — called from `next()` when the round finishes. Guards with
  `if (!authStore.isLoggedIn) return` (**guests play unsaved**); otherwise inserts
  `{ user_id: authStore.user.id, score, total_questions, topic: null, level: null }` in a
  `try/catch` so a failed save **never breaks the game**. Fire-and-forget (not awaited in `next()`).
- **`ProgressPage`** (`src/pages/ProgressPage.jsx`, behind `ProtectedRoute`) — an `observer` that
  fetches `getUserProgress(authStore.user.id)` once on mount with local `useState`, and renders one
  of four states: **loading** (Loader), **error** (red text), **empty** ("No games yet"), or a
  **list** of result Cards (`score / total` + date). Uses an `active` cleanup flag.
- **The catch (still open):** `game_results` needs a REAL Supabase auth session (`auth.uid() =
  user_id` RLS + `user_id → profiles` FK). Ilan's auth is still a **localStorage mock**, so a
  mock-logged-in save currently **fails gracefully** (logged, game unaffected) and Progress shows
  the empty state. Real persistence lights up when Ilan wires real Supabase auth. `topic`/`level`
  saved as `null` because a round mixes them (columns nullable).

---

## B5 — theme, mobile, confetti & animations

- **Theme (`src/theme.js`)** — `createTheme` with the warm/playful palette from the agreed mockup:
  `primaryColor: "brandTeal"`, custom colors `brandTeal` / `coral` / `sunny`, `defaultRadius: "lg"`,
  Fredoka font. Applied via `<MantineProvider theme={theme}>` in `App.jsx`. Cream body background in
  `index.css`; Fredoka `<link>` in `index.html`. Because the game uses Mantine tokens, it re-skins
  automatically. (theme.js, App.jsx, index.html, index.css are shared/C's files — coordinated.)
- **Themed pages** — `WelcomePage`, `GameStartPage`, and the `AuthModal` switch-link were converted
  from plain HTML to Mantine components (C's files; logic untouched, only presentation).
- **Confetti (`ResultsCard`)** — `canvas-confetti` (new dependency). A `useEffect` fires confetti on
  the results screen only for a score ≥ 50% (bigger burst for a perfect score), and skips it under
  `prefers-reduced-motion`. NOTE: if the demo machine has macOS "Reduce motion" ON, no confetti.
- **Answer animations (`AnswerButton.jsx` + `AnswerButton.css`)** — `.answer-correct` pulses,
  `.answer-wrong` shakes (CSS keyframes, class chosen by `status`), disabled under reduced motion.
  Idle answer color changed to `brandTeal` to match the theme.
- **QuestionCard** — removed the white `<Card>` wrapper; now a rounded `<Image>` (radius lg) inside
  `AspectRatio` with the prompt on the cream background (no white band/border line).
- **Back-to-menu buttons** — added on the game screen ("← Menu"), `ResultsCard` ("Back to menu"),
  `ProgressPage` ("← Back to menu"), and `GameStartPage` — all `navigate('/')`. Results + Next
  buttons made `fullWidth` for mobile.
- **My Progress summary** — ProgressPage shows **Games played** + **Best score** (by ratio) above
  the recent-games list.

---

## Integration notes

- **Ilan (C):** temporary harness gone; `main.jsx` renders `<App/>`, `App.jsx` provides
  `<MantineProvider>`, `index.css` trimmed. Game files moved into the flat structure.
- **arad (A) — merged:** `src/lib/supabase.js` (Supabase client, reads `VITE_SUPABASE_URL` +
  `VITE_SUPABASE_PUBLISHABLE_KEY` from `.env`), `supabase/setup.sql` (profiles/questions/
  game_results tables + RLS + the same 5 seeded questions), `.env.example`. `.env` is gitignored.
  `supabase.js` isn't imported yet — it gets used in **B3**.
- C's `questionService` (async, simulated `wait()` delay) is the B3 target for reading questions.
- Schema note for B4: A's `game_results` uses `created_at` (+ a `topic` column) rather than the
  doc's `played_at` — match A's real schema when saving.
