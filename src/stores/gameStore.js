import { makeAutoObservable, runInAction } from 'mobx'
import { shuffle } from '../utils/shuffle'
import { questionService, gameResultService } from '../services'
import { authStore } from './authStore'
// A Mobx store: holds the game's data + the rules to change it, separete from the UI.
const ROUND_SIZE = 10

class GameStore {
    // observable state
    questions = []
    currentIndex = 0
    selected = null
    score = 0
    streak = 0
    bestStreak = 0
    status = 'idle' // 'idle' | 'loading' | 'playing' | 'finished' | 'error'
    error = null
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
    async startRound() {
        this.status = 'loading'
        this.error = null
        try {
            const pool = await questionService.getAllQuestions()
            const round = shuffle(pool).slice(0, ROUND_SIZE)
            runInAction(() => {
                this.questions = round
                this.currentIndex = 0
                this.selected = null
                this.score = 0
                this.streak = 0
                this.bestStreak = 0
                this.status = 'playing'
            })   
        } catch(err) {
            runInAction(() => {
                this.error = 'Could not load questions. Please try again.'
                this.status = 'error'
            })
        }

         
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


    async saveResult() {
        if (!authStore.isLoggedIn) return   // guests play unsaved

        try {
            await gameResultService.saveGameResult({
                user_id: authStore.user.id,
                score: this.score,
                total_questions: this.totalQuestions,
                topic: null,   // round mixes topics/levels
                level: null,
            })
        } catch (err) {
            console.error('saveGameResult failed:', err)
        }
    }

    next() {
        if (this.isLast) {
            this.status = 'finished'
            this.saveResult()  
        } else {
            this.currentIndex += 1
            this.selected = null
        }
    }
}



export const gameStore = new GameStore()
