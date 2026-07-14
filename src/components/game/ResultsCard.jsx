import { Card, Stack, Title, Text, Badge, Button } from '@mantine/core'
import { useEffect } from 'react'
import confetti from 'canvas-confetti'

function ResultsCard({ score, total, bestStreak, onPlayAgain, onBackToMenu }) {

    useEffect(() => {
        // Skip the animation for users who prefer reduced motion.
        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

        // Only celebrate a good round (half or better).
        const ratio = total > 0 ? score / total : 0
        if (ratio < 0.5) return

        // A perfect score gets a bigger burst.
        const isPerfect = score === total
        confetti({
            particleCount: isPerfect ? 200 : 120,
            spread: isPerfect ? 100 : 70,
            origin: { y: 0.6 },
        })

        return () => {
            confetti.reset?.()
        }
    }, [score, total])

    return (
        <Card shadow="sm" padding="xl" radius="md" withBorder>
            <Stack align="center" gap="md">
                <Title order={2}>Round complete!</Title>

                <Text size="xl" fw={700}>
                    You scored {score} / {total}
                </Text>

                <Badge size="lg" variant="light" color="orange">
                    Best streak: {bestStreak}
                </Badge>

                <Stack w="100%" gap="sm">
                    <Button size="md" fullWidth onClick={onPlayAgain}>
                        Play again
                    </Button>
                    <Button size="md" fullWidth variant="light" onClick={onBackToMenu}>
                        Back to menu
                    </Button>
                </Stack>
            </Stack>
        </Card>
    )
}

export default ResultsCard
