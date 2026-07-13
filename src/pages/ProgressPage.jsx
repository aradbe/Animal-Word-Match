import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useNavigate } from 'react-router-dom'
import { Container, Stack, Title, Text, Loader, Center, Card, Group, Button } from '@mantine/core'
import { authStore } from '../stores/authStore'
import { gameResultService } from '../services'

const ProgressPage = observer(function ProgressPage() {
    const navigate = useNavigate()
    const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error'
    const [results, setResults] = useState([])

    useEffect(() => {
        let active = true

        async function load() {
            setStatus('loading')
            try {
                const data = await gameResultService.getUserProgress(authStore.user.id)
                if (active) {
                    setResults(data)
                    setStatus('ready')
                }
            } catch (err) {
                console.error('getUserProgress failed:', err)
                if (active) setStatus('error')
            }
        }

        load()
        return () => { active = false } // ignore the result if we unmounted
    }, [])

    // Summary stats derived from the fetched results
    const gamesPlayed = results.length
    const best = results.length > 0
        ? results.reduce((top, r) =>
            r.score / r.total_questions > top.score / top.total_questions ? r : top)
        : null

    return (
        <Container size="sm" py="xl">
            <Stack gap="lg">
                <Button variant="subtle" onClick={() => navigate('/')} style={{ alignSelf: 'flex-start' }}>
                    ← Back to menu
                </Button>
                <Title order={2}>My Progress</Title>

                {status === 'loading' && (
                    <Center h="40vh"><Loader /></Center>
                )}

                {status === 'error' && (
                    <Text c="red">Could not load your progress. Please try again.</Text>
                )}

                {status === 'ready' && results.length === 0 && (
                    <Text c="dimmed">No games yet — play a round to see your results here!</Text>
                )}

                {status === 'ready' && results.length > 0 && (
                    <>
                        <Card withBorder padding="md" radius="md">
                            <Group justify="space-around">
                                <Stack gap={0} align="center">
                                    <Text size="xl" fw={700}>{gamesPlayed}</Text>
                                    <Text size="sm" c="dimmed">Games played</Text>
                                </Stack>
                                <Stack gap={0} align="center">
                                    <Text size="xl" fw={700}>{best.score} / {best.total_questions}</Text>
                                    <Text size="sm" c="dimmed">Best score</Text>
                                </Stack>
                            </Group>
                        </Card>

                        <Text fw={600} size="sm" c="dimmed">Recent games</Text>
                        <Stack gap="sm">
                            {results.map((r) => (
                                <Card key={r.id} withBorder padding="md" radius="md">
                                    <Group justify="space-between">
                                        <Text fw={600}>{r.score} / {r.total_questions}</Text>
                                        <Text size="sm" c="dimmed">
                                            {new Date(r.created_at).toLocaleDateString()}
                                        </Text>
                                    </Group>
                                </Card>
                            ))}
                        </Stack>
                    </>
                )}
            </Stack>
        </Container>
    )
})

export default ProgressPage
