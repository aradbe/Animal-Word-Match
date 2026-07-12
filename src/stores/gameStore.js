import { makeAutoObservable } from 'mobx'
import { MOCK_QUESTIONS } from '../data/mockQuestions'

class GameStore {
    // observable state
    questions = []
    currentIndex = 0
    selected = null
    score = 0
    streak = 0
    bestStreak = 0
    status = 'idle' // 'idle' | 'playing' | 'finished'

    constructor() {
    makeAutoObservable(this)
    }

    // ---- computed values ----
    get currentQuestion() {
        return this.questions[this.currentIndex]
    }
    get totalQuestions() {
        return this.questions.length
    }
    get isLast() {
        return this.currentIndex === this.questions.length - 1
    }
    get answered() {
        return this.selected !== null
    }

    // ---- actions ----
    startRound(questions = MOCK_QUESTIONS) {
        this.questions = questions
        this.currentIndex = 0
        this.selected = null
        this.score = 0
        this.streak = 0
        this.bestStreak = 0
        this.status = 'playing' 
    }

    selectAnswer(word) {
        if (this.answered) {
            return
        }
        this.selected = word
        if (word === this.currentQuestion.correct_word) {
            this.score += 1
            this.streak += 1
            if (this.streak > this.bestStreak) {
                this.bestStreak = this.streak
            }
        } else {
            this.streak = 0
        }
    }


    next() {
        if (this.isLast) {
            this.status = 'finished'
        } else {
            this.currentIndex += 1
            this.selected = null
        }
    }
}



export const gameStore = new GameStore()
