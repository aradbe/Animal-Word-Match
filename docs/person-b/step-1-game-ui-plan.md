# Step 1 (B1) — Game UI on 5 mock questions

**Owner:** Person B (Guy) · **Stage:** B1 · Thu · **Branch:** `guy-branch` → PR into `develop`

> **Done when (from the team plan):** _"Can answer and advance."_
> A single question is shown, you pick one of 4 shuffled answers, you get correct/wrong
> feedback, and you can move to the next question — running on 5 mock questions that
> match the agreed `question` contract.

---

## How we work this step (our agreement)

- We go **one sub-step at a time**. I do not build the whole thing at once.
- After each sub-step I **stop**, explain the code I wrote, and you review it and run it.
- We only continue to the next sub-step when **you say you understand it**.
- I stay strictly inside **your** code area (see boundary below). I do not touch A's or
  C's files. The one shared file (the router) we handle by asking C, not by editing quietly.
- If something is genuinely a B2–B5 concern, I **stop and flag it** instead of building it.

---

## Your code boundary (now and forever)

Everything Person B owns lives in **one folder**:

```
src/features/game/
├── pages/
│   └── GamePage.jsx          # the screen that runs a round
├── components/
│   ├── QuestionCard.jsx      # shows the image + prompt
│   └── AnswerButton.jsx      # one answer choice
├── data/
│   └── mockQuestions.js      # 5 fake questions matching the contract
└── lib/
    └── shuffle.js            # tiny helper to shuffle the 4 answers
```

- I will **never** create or edit files outside `src/features/game/` for your tasks,
  except: adding your route needs one line in the router (C's file). We will **coordinate
  that with C**, not sneak it in.
- Later stages keep growing *inside this same folder* (the MobX store, results screen,
  progress page, `gameResultService` consumer). One folder = your lane.

---

## The `question` contract we build against (do not change it)

Straight from the team plan. Our mocks use the **exact** same shape, so when Person A's
real `questionService` is ready in B3, **no UI code changes**:

```js
question: {
  id,                         // string/number
  image_url,                  // string URL to the animal image
  correct_word,               // string, the right answer
  distractors: [w1, w2, w3],  // 3 wrong words, never equal to correct_word
  level,                      // 1 | 2 | 3
  topic,                      // string, e.g. "farm"
  created_at,                 // ISO timestamp string
}
```

---

## Agreed animal topics (the `topic` field)

Six fixed categories. The `topic` value (lowercase, one word) is what goes in the DB/contract;
the label is display-only. **Distractors always come from the same topic** so wrong answers are
plausible.

| `topic` | Label | Example animals |
|---|---|---|
| `farm` | Farm animals | cow, pig, horse, sheep, chicken, duck, goat |
| `sea` | Sea animals | dolphin, whale, shark, octopus, crab, seahorse |
| `jungle` | Jungle animals | monkey, tiger, snake, gorilla, parrot, frog |
| `safari` | Safari animals | lion, elephant, giraffe, zebra, rhino, hippo |
| `forest` | Forest animals | bear, fox, deer, owl, squirrel, rabbit |
| `birds` | Birds | eagle, penguin, flamingo, peacock, ostrich, owl |

> This is a **shared product decision** — confirm with A (fills the pool) and C (admin dropdown).
> Possible later extensions if time permits: `bugs`, `polar`.
> For B1 mock data we only use **2 of these** (e.g. `farm` + `sea`) to prove the UI.

---

## Explicitly OUT of scope for B1 (do NOT build yet)

These belong to later stages — if I catch myself reaching for them, I stop:

| Not now | Belongs to |
|---|---|
| MobX game store | **B2** |
| Score, streak, progress bar | **B2** |
| 10-question round + real results screen | **B2** |
| Real `questionService` / Supabase data | **B3** |
| Loading / error / missing-image states | **B3** |
| `game_results` table, saving, My Progress page | **B4** |
| Mobile polish, animations, confetti, sound | **B5** |

For B1 we use plain React **local state** (`useState`) — that is correct and intentional.
Introducing MobX here would be jumping into B2.

---

## Dependency note (so we're not blocked)

B1 normally starts after C's scaffold (Router + `MantineProvider`) is merged. That scaffold
is **not in the repo yet** (repo is still the default Vite template). Two ways to proceed —
my recommendation first:

1. **(Recommended) Build the game module self-contained now**, and preview it by temporarily
   rendering `<GamePage />` inside a local `<MantineProvider>` in `main.jsx`. When C's scaffold
   lands, we delete that temporary wrapper and plug `GamePage` into the real router. Nothing in
   `src/features/game/` changes — only the throwaway preview harness.
2. **Wait for C's scaffold**, then start. Safer for git, but idle now.

I'll assume option 1 unless you tell me otherwise, and I'll keep the temporary harness clearly
marked so we remember to remove it.

---

## The slow sub-steps

Each row is a separate, reviewable chunk. We do **one, then pause**.

### Sub-step 1 — Mock data
- Create `data/mockQuestions.js`: an array of **5** questions matching the contract exactly.
- Pure data, no logic. Real animal topics, valid `image_url`s, 3 distractors each.
- **You review:** the shape matches the contract; the data reads sensibly.

### Sub-step 2 — Show one question (static, no clicking)
- `QuestionCard.jsx`: renders the image + a prompt ("Which animal is this?").
- `AnswerButton.jsx`: renders one answer word as a button.
- `shuffle.js`: tiny helper so the correct answer isn't always in the same spot.
- `GamePage.jsx`: shows question #1's image and its 4 shuffled answer buttons — **not clickable yet**.
- **You review:** you can see one question with 4 answers on screen.

### Sub-step 3 — Answer it (feedback)
- Clicking an answer marks it correct (green) or wrong (red), reveals the right one,
  and locks the buttons so you can't answer twice.
- Local `useState` only.
- **You review:** clicking gives clear right/wrong feedback.

### Sub-step 4 — Advance
- After answering, a **Next** button appears and moves to the next question (answers
  re-shuffled per question).
- After the 5th question, show a simple **placeholder** end message (e.g. "Round complete")
  — **not** the real results/score screen (that's B2).
- **You review:** you can play all 5 mock questions start to finish. ✅ **B1 done-when met.**

### Sub-step 5 — Tidy + run
- Light Mantine styling so it looks intentional (still simple).
- Confirm it runs with `npm run dev`, no console errors.
- **You review:** we run it together, then decide whether to open the PR into `develop`.

---

## Definition of Done for B1 (from team plan, trimmed to this stage)

- [ ] Runs locally with `npm run dev`, no console errors
- [ ] 5 mock questions, each with 4 shuffled answers
- [ ] Can answer → get feedback → advance through all 5
- [ ] All new code lives under `src/features/game/`
- [ ] No secrets, no Supabase, no MobX (correct for B1)
- [ ] Reviewed by you (and, before merge, one teammate per team rules)

---

## What I will NOT do without asking you first

- Touch any file outside `src/features/game/` (router line is a coordinated exception).
- Add libraries beyond what's already in `package.json`.
- Start any B2–B5 work.
- Commit or push, or open a PR.
