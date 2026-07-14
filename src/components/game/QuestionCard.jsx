import { Image, Text } from '@mantine/core'
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
        <div>
            <div className="awm-question-image-frame">
                <Image
                    src={question.image_url}
                    alt=""
                    w="100%"
                    h="100%"
                    fit="contain"
                    fallbackSrc={IMAGE_FALLBACK}
                />
            </div>

            <Text size="xl" fw={800} ta="center" mt="sm">
                Which animal is this?
            </Text>
        </div>
    )
}

export default QuestionCard
