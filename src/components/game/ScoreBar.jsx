import { Group, Badge } from '@mantine/core'

function ScoreBar({ score, streak }) {
    return (
        <Group justify="space-between">
            <Badge size="lg" variant="light" color="blue">
                Score: {score}
            </Badge>
            <Badge size="lg" variant="light" color={streak > 1 ? 'orange' : 'gray'}>
                Streak: {streak}
            </Badge>
        </Group>
    )
}

export default ScoreBar