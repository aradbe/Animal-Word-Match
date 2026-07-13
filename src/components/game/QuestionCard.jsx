import { AspectRatio, Card, Image, Text } from '@mantine/core'
// Shown if a question's image_url fails to load.
const IMAGE_FALLBACK =
    'data:image/svg+xml;charset=utf-8,' +
    encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='450'>
            <rect width='100%' height='100%' fill='#e9ecef'/>
            <text x='50%' y='50%' font-size='28' fill='#868e96'
                  text-anchor='middle' dominant-baseline='middle'>Image unavailable</text>
        </svg>`
    )

function QuestionCard({ question }) {
    return (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Card.Section>
                <AspectRatio ratio={4 / 3}>
                    <Image
                        src={question.image_url}
                        alt=""
                        fit="cover"
                        fallbackSrc={IMAGE_FALLBACK}
                    />
                </AspectRatio>
            </Card.Section>

            <Text size="xl" fw={700} ta="center" mt="md">
                Which animal is this?
            </Text>
        </Card>
    )
}

export default QuestionCard
