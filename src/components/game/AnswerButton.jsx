import { Button } from '@mantine/core'

const STATUS_PROPS = {
    idle:    { variant: 'outline', color: 'blue' },
    correct: { color: 'green' },
    wrong:   { color: 'red' },
    muted:   { variant: 'default' },
}

function AnswerButton({ word, onSelect, disabled, status = 'idle' }) {
    return (
        <Button
            {...STATUS_PROPS[status]}
            onClick={() => onSelect(word)}
            fullWidth
            size="lg"
            style={{ pointerEvents: disabled ? 'none' : 'auto' }}
        >
            {word}
        </Button>
    )
}

export default AnswerButton
