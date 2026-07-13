import { makeAutoObservable, runInAction } from "mobx";

import { questionService, gameResultService } from "../services";

import { authStore } from "./authStore";

const ROUND_SIZE = 10;

class GameStore {
  questions = [];

  currentIndex = 0;
  selected = null;

  score = 0;
  streak = 0;
  bestStreak = 0;

  /*
   * The options selected on the game setup page.
   * Null means a mixed game.
   */
  selectedTopic = null;
  selectedLevel = null;

  /*
   * The options actually used by the current round.
   * These values are saved with the game result.
   */
  roundTopic = null;
  roundLevel = null;

  status = "idle";
  error = null;

  constructor() {
    makeAutoObservable(this);
  }

  get currentQuestion() {
    return this.questions[this.currentIndex];
  }

  get totalQuestions() {
    return this.questions.length;
  }

  get isLast() {
    return (
      this.questions.length > 0 &&
      this.currentIndex === this.questions.length - 1
    );
  }

  get answered() {
    return this.selected !== null;
  }

  setRoundOptions({ topic = null, level = null }) {
    this.selectedTopic = topic || null;

    this.selectedLevel =
      level === null || level === undefined ? null : Number(level);
  }

  async startRound() {
    this.status = "loading";
    this.error = null;

    try {
      /*
       * Guests always receive a mixed round.
       *
       * Registered users receive the selected topic
       * and level. They can also choose a mixed round.
       */
      const shouldUseFilters =
        authStore.isLoggedIn && this.selectedTopic && this.selectedLevel;

      const topic = shouldUseFilters ? this.selectedTopic : null;

      const level = shouldUseFilters ? this.selectedLevel : null;

      const round = await questionService.getQuestionsByFilters({
        topic,
        level,
        amount: ROUND_SIZE,
      });

      if (round.length === 0) {
        throw new Error("No questions were found for this topic and level.");
      }

      runInAction(() => {
        this.questions = round;

        this.currentIndex = 0;
        this.selected = null;

        this.score = 0;
        this.streak = 0;
        this.bestStreak = 0;

        this.roundTopic = topic;
        this.roundLevel = level;

        this.status = "playing";
      });
    } catch (error) {
      runInAction(() => {
        this.questions = [];

        this.error =
          error instanceof Error
            ? error.message
            : "Could not load questions. Please try again.";

        this.status = "error";
      });
    }
  }

  selectAnswer(word) {
    if (this.answered || !this.currentQuestion) {
      return;
    }

    this.selected = word;

    if (word === this.currentQuestion.correct_word) {
      this.score += 1;
      this.streak += 1;

      if (this.streak > this.bestStreak) {
        this.bestStreak = this.streak;
      }
    } else {
      this.streak = 0;
    }
  }

  async saveResult() {
    // Guests can play, but their result is not saved.
    if (!authStore.isLoggedIn) {
      return;
    }

    try {
      await gameResultService.saveGameResult({
        user_id: authStore.user.id,

        score: this.score,

        total_questions: this.totalQuestions,

        topic: this.roundTopic,

        level: this.roundLevel,
      });
    } catch (error) {
      console.error("saveGameResult failed:", error);
    }
  }

  next() {
    if (!this.answered) {
      return;
    }

    if (this.isLast) {
      this.status = "finished";
      this.saveResult();
      return;
    }

    this.currentIndex += 1;
    this.selected = null;
  }
}

export const gameStore = new GameStore();
