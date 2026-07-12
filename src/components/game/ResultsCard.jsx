import { Card, Stack, Title, Text, Badge, Button } from '@mantine/core'

function ResultsCard({ score, total, bestStreak, onPlayAgain }) {
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

                <Button size="md" onClick={onPlayAgain}>
                    Play again
                </Button>
            </Stack>
        </Card>
    )
}

export default ResultsCard