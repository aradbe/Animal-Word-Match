# Game feature — code guide (B1 + B2 + B3)

A file-by-file explanation of Person B's game feature after **B1** (game UI), **B2** (MobX
store: score/streak/round/results), and **B3** (real questions from Supabase + loading/error/
broken-image states). Integrated into Ilan's (Person C) scaffold and arad's (Person A) Supabase.
Update this doc at the end of each future stage (B4–B5).

> **Status:** B1 + B2 + B3 complete. Game renders through C's router at `/#/game/play`, powered
> by a MobX store, fetching **real questions from Supabase** (via `questionService`, with a mock
> fallback), with loading spinner, error+retry, and a broken-image placeholder. Verified live in
> the Network tab. Next: **B4** (save results to `game_results`, My Progress page).

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
