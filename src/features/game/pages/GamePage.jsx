import { useMemo, useState } from 'react'
import { Container, Stack, Text, Title, Button } from '@mantine/core'
import { mockQuestions } from '../data/mockQuestions'
import { shuffle } from '../lib/shuffle'
import QuestionCard from '../components/QuestionCard'
import AnswerButton from '../components/AnswerButton'

function GamePage() {
    const [index, setIndex] = useState(0)
    const [selected, setSelected] = useState(null)
    const [finished, setFinished] = useState(false)

    const question = mockQuestions[index]
    const isLast = index === mockQuestions.length - 1
    const answered = selected !== null

    const answers = useMemo(
        () => shuffle([question.correct_word, ...question.distractors]),
        [question]
    )

    function getStatus(word) {
        if (!answered) return 'idle'
        if (word === question.correct_word) return 'correct'
        if (word === selected) return 'wrong'
        return 'muted'
    }

    function handleNext() {
        if (isLast) {
            setFinished(true)
        } else {
            setIndex(index + 1)
            setSelected(null)
        }
    }

    // End of round — placeholder only. Real score/results screen is B2.
    if (finished) {
        return (
            <Container size="sm" py="xl">
                <Stack align="center" gap="md">
                    <Title order={2}>Round complete! 🎉</Title>
                    <Text c="dimmed">(Score and results screen come in B2.)</Text>
                </Stack>
            </Container>
        )
    }

    return (
        <Container size="sm" py="xl">
            <Stack gap="lg">
                <Text ta="center" fw={500} c="dimmed">
                    Question {index + 1} of {mockQuestions.length}
                </Text>

                <QuestionCard question={question} />

                <Stack gap="sm">
                    {answers.map((word) => (
                        <AnswerButton
                            key={word}
                            word={word}
                            status={getStatus(word)}
                            disabled={answered}
                            onSelect={setSelected}
                        />
                    ))}
                </Stack>

                {answered && (
                    <Stack align="center" gap="sm">
                        <Text fw={700} c={selected === question.correct_word ? 'green' : 'red'}>
                            {selected === question.correct_word ? 'Correct!' : 'Oops, wrong!'}
                        </Text>
                        <Button onClick={handleNext} size="md">
                            {isLast ? 'Finish' : 'Next'}
                        </Button>
                    </Stack>
                )}
            </Stack>
        </Container>
    )
}

export default GamePage
