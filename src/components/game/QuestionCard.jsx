import { AspectRatio, Card, Image, Text } from '@mantine/core'

function QuestionCard({ question }) {
    return (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Card.Section>
                <AspectRatio ratio={4 / 3}>
                    <Image
                        src={question.image_url}
                        alt=""
                        fit="cover"
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
