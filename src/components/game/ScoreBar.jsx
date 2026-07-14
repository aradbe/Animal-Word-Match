import { Group, Badge } from '@mantine/core'

function ScoreBar({ score, streak }) {
    return (
        <Group justify="center" gap="xl" wrap="nowrap" className="awm-score-row">
            <Badge size="xl" variant="light" color="blue" className="awm-score-badge">
                Score: {score}
            </Badge>
            <Badge
                size="xl"
                variant="light"
                color={streak > 1 ? 'sunny' : 'gray'}
                className="awm-score-badge"
            >
                Streak: {streak}
            </Badge>
        </Group>
    )
}

export default ScoreBar
