import { useEffect, useMemo, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { useNavigate } from 'react-router-dom'
import { Container, SimpleGrid, Stack, Text, Title, Button, Loader, Center } from '@mantine/core'
import { gameStore } from '../../stores/gameStore'
import { shuffle } from '../../utils/shuffle'
import QuestionCard from './QuestionCard'
import AnswerButton from './AnswerButton'
import ScoreBar from './ScoreBar'
import ResultsCard from './ResultsCard'
import './GamePage.css'

// An observer component that just displays the store and calls its actions

/*
  Current state (B2) — game screen, for the team before the merge:
  - GamePage is a MobX observer and reads ALL game state from gameStore (src/stores/gameStore.js).
    No more useState for game state — index, selection, score, streak, bestStreak and status live in the store.
  - Data currently comes from mock (MOCK_QUESTIONS), NOT questionService. The switch to questionService is B3.
  - ScoreBar shows live score/streak; ResultsCard shows the final result + a "Play again" button (calls startRound).
  - Rendered via C's router: GameRoundPage at /game/play (inside MantineProvider).
  Next: B3 = switch to questionService + loading/error states, B4 = save results (game_results), B5 = polish/mobile.
*/

const GamePage = observer(function GamePage() {
    const navigate = useNavigate()
    const startedRef = useRef(false)

    useEffect(() => {
        // Guard against React StrictMode running this effect twice in dev,
        // which would fetch two different random rounds and flash the image.
        if (startedRef.current) return
        startedRef.current = true
        gameStore.startRound()
    }, [])

    const question = gameStore.currentQuestion

    const answers = useMemo(
        () => (question ? shuffle([question.correct_word, ...question.distractors]) : []),
        [question]
    )



    function getStatus(word) {
        if (!gameStore.answered) return 'idle'
        if (word === question.correct_word) return 'correct'
        if (word === gameStore.selected) return 'wrong'
        return 'muted'
    }

    // Loading - questions being fetched
    if (gameStore.status === 'loading') {
        return (
            <Center h="60vh">
                <Loader size="lg"/>
            </Center>
        )
    }

    // Error - fetch failed
    if (gameStore.status === 'error') {
        return (
            <Container size="sm" py="xl">
                <Stack align="center" gap="md">
                    <Title order={3}>Something went wrong</Title>
                    <Text c="dimmed">{gameStore.error}</Text>
                    <Button onClick={() => gameStore.startRound()}>Try again</Button>
                </Stack>
            </Container>
        )
    }

    // End of round — placeholder only. Real score/results screen is B2.
    if (gameStore.status === 'finished') {
        return (
            <Container size="sm" py="xl">
                <ResultsCard
                    score={gameStore.score}
                    total={gameStore.totalQuestions}
                    bestStreak={gameStore.bestStreak}
                    onPlayAgain={() => gameStore.startRound()}
                    onBackToMenu={() => navigate('/')}
                />
            </Container>
        )
    }

    if (!question) {
        return null
    }

    return (
        <Container size="md" py="md" className="awm-game-container">
            <Stack gap="sm">
                <Button
                    variant="light"
                    color="brandTeal"
                    onClick={() => navigate('/')}
                    className="awm-menu-button"
                    style={{ alignSelf: 'center' }}
                >
                    ← Menu
                </Button>
                <ScoreBar score={gameStore.score} streak={gameStore.streak}/>
                <Text ta="center" fw={700} c="dimmed" className="awm-question-count">
                    Question {gameStore.currentIndex + 1} of {gameStore.totalQuestions}
                </Text>

                <Stack key={gameStore.currentIndex} gap="sm" className="awm-question">
                    <QuestionCard question={question} />

                    <SimpleGrid cols={2} spacing="sm" className="awm-answers-grid">
                        {answers.map((word) => (
                            <AnswerButton
                                key={word}
                                word={word}
                                status={getStatus(word)}
                                disabled={gameStore.answered}
                                onSelect={(w) => gameStore.selectAnswer(w)}
                            />
                        ))}
                    </SimpleGrid>
                </Stack>

                {gameStore.answered && (
                    <Stack align="center" gap="sm">
                        <Text fw={700} c={gameStore.selected === question.correct_word ? 'green' : 'red'}>
                            {gameStore.selected === question.correct_word ? 'Correct!' : 'Oops, wrong!'}
                        </Text>
                        <Button onClick={() => gameStore.next()} size="md" fullWidth>
                            {gameStore.isLast ? 'Finish' : 'Next'}
                        </Button>
                    </Stack>
                )}
            </Stack>
        </Container>
    )
})

export default GamePage
