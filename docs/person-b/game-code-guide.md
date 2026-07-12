# Game feature — code guide (B1, post-integration)

A file-by-file explanation of Person B's game feature after **B1** (game UI on 5 mock
questions, styled with Mantine) **and** integration into Ilan's (Person C) scaffold.
Update this doc at the end of each future stage (B2–B5).

> **Status:** B1 complete + integrated. The game renders through C's router at
> `/#/game/play`. No score/streak yet (B2), still reads mock data directly (B3 swaps
> to `questionService`).

---

## Where the files live now (flat structure, adopted from C)

```
src/data/mockQuestions.js        the raw material — 5 questions, exported as MOCK_QUESTIONS
src/utils/shuffle.js             a tool — randomizes the 4 answers
src/components/game/QuestionCard.jsx  a brick — shows the animal image + prompt
src/components/game/AnswerButton.jsx  a brick — one clickable answer
src/components/game/GamePage.jsx      the screen — holds state, wires bricks + tool
src/pages/GameRoundPage.jsx      C's route page (/game/play) — just renders <GamePage/>
```

Data flows **down** (page → components via props); events flow **up** (button click →
page via a callback). The page is the brain; the components are simple and reusable.

**How it reaches the screen:** C's `AppRouter` maps `/game/play` → `GameRoundPage` →
which renders `<GamePage/>`. Mantine works because `App.jsx` wraps `<AppRouter/>` in
`<MantineProvider>` and `main.jsx` imports `@mantine/core/styles.css`.

---

## `src/data/mockQuestions.js`

An array of 5 objects, each matching the agreed **`question` contract** exactly:

```
{ id, image_url, correct_word, distractors: [3 words], level: 1-3, topic, created_at }
```

- Exported as **`MOCK_QUESTIONS`** — this is the **single source** for the whole app.
  Both `GamePage` and C's `questionService` import it (we replaced C's Lion/Elephant
  sample data with these).
- Topics used: `farm` (cow, horse, chicken) + `sea` (dolphin, octopus).
- `image_url` points at **Wikimedia Commons** photos (stable + fast). We first tried
  Pollinations (too slow / failed) and loremflickr (flaky 500s) — Wikimedia won.
- Because the shape matches the contract, when the game switches to
  `questionService.getQuestions()` in **B3**, **no UI code changes**.

---

## `src/utils/shuffle.js`

A pure helper (no React). Fisher–Yates shuffle; returns a **new** array, doesn't
mutate the input.

- **Why it exists:** the answers are built as `[correct_word, ...distractors]`, so the
  correct answer would always be first. Shuffling puts it in a random position each
  question, so you can't win by always clicking the top button.

---

## `src/components/game/QuestionCard.jsx`

Presentational. Shows the animal image + the prompt. Props: `question`.

- **Mantine `Card`** — rounded, bordered container with a soft shadow.
- **`Card.Section`** — makes the image span edge-to-edge (ignores card padding).
- **`AspectRatio ratio={4/3}`** — locks the image box to a fixed shape so its height
  tracks its width. This is why every question shows an **identically sized** image,
  regardless of the source photo's dimensions. `Image fit="cover"` fills + crops it.
- **`alt=""`** — the image is intentionally decorative; putting the animal name in `alt`
  would leak the answer to screen readers.

---

## `src/components/game/AnswerButton.jsx`

Presentational + reports clicks. Props: `word`, `onSelect`, `disabled`, `status`.

- **`STATUS_PROPS`** maps each status to Mantine `Button` props:
  `idle` → outline blue, `correct` → filled green, `wrong` → filled red,
  `muted` → subtle grey.
- **`onClick={() => onSelect(word)}`** — tells the page which word was picked
  (the page passes its `setSelected` in as `onSelect`).
- **The lock gotcha:** we do **not** use Mantine's `disabled` prop, because it greys the
  button out and would hide the green/red feedback. Instead we lock with
  `style={{ pointerEvents: disabled ? 'none' : 'auto' }}` — this stops any further
  clicking (so you can't change your answer) while keeping the colors visible.

---

## `src/components/game/GamePage.jsx`

The screen and the brain. Holds all state and logic; renders the components inside a
Mantine layout.

**State (the only things it "remembers"):**
- `index` — which question (0-based). `question = MOCK_QUESTIONS[index]`.
- `selected` — the word you clicked, or `null` if unanswered.
- `finished` — `true` after the last question → swaps in the end screen.

**Derived values (computed, not stored):**
- `isLast` — are we on the last question? (controls "Next" vs "Finish")
- `answered` — `selected !== null`? (locks buttons, shows feedback)
- `answers` — `useMemo(shuffle([...]), [question])` — shuffled **once per question**,
  not on every render, so the buttons don't reshuffle when you click.

**Functions:**
- `getStatus(word)` — returns `idle` / `correct` / `wrong` / `muted` for a button.
  Before answering, everyone is `idle`. After, the correct word is always `correct`
  (revealed), your pick (if wrong) is `wrong`, the rest are `muted`.
- `handleNext()` — if last → `setFinished(true)`; else advance `index` and reset
  `selected` to `null` (fresh question).

**Layout (Mantine):**
- `Container size="sm"` centers + caps width; `Stack` gives even vertical spacing.
- Progress line is plain `Text` ("Question X of 5") — the real **progress bar** is B2.
- End screen is a placeholder `Title` + `Text` — the real **score/results** screen is B2.

> **Note for B2:** the plan is to move `index`/`selected`/`finished`/score/streak out of
> this component and into a MobX store at `src/stores/gameStore.js` (next to C's
> `authStore.js`), and make `GamePage` an `observer`.

---

## The core loop (one picture)

```
click "horse"
  → AnswerButton runs onSelect('horse')
  → = GamePage's setSelected('horse')
  → GamePage re-renders: selected='horse', answered=true
  → getStatus() recolors each button; feedback + Next appear
```

This "state lives up in the page, children get props down and send events up" is the
central React pattern the whole feature is built on.

---

## Integration notes (done)

- The temporary preview harness is **gone**. `main.jsx` renders `<App/>` (C's router),
  `App.jsx` provides `<MantineProvider>`, and `index.css` was trimmed (with Ilan's OK)
  to remove the Vite template `#root`/`h1`/`h2` rules that fought Mantine.
- Game files were moved out of the old `src/features/game/` into C's flat structure.
- C's `questionService` (async, with a simulated `wait()` delay) is available for **B3**.
