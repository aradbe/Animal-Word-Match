import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Container, Stack, Title, Text, Loader, Center, Card, Group } from '@mantine/core'
import { authStore } from '../stores/authStore'
import { gameResultService } from '../services'

const ProgressPage = observer(function ProgressPage() {
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

    return (
        <Container size="sm" py="xl">
            <Stack gap="lg">
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
                )}
            </Stack>
        </Container>
    )
})

export default ProgressPage
