import { Button } from '@mantine/core'
import './AnswerButton.css'

const STATUS_PROPS = {
    idle:    { variant: 'default' },
    correct: { color: 'green' },
    wrong:   { color: 'red' },
    muted:   { variant: 'default' },
}

// Which animation class to add for each status
const ANIM_CLASS = {
    correct: 'answer-correct',
    wrong: 'answer-wrong',
}

function AnswerButton({ word, onSelect, disabled, status = 'idle' }) {
    const className = [
        'answer-button',
        `answer-button-${status}`,
        ANIM_CLASS[status],
    ].filter(Boolean).join(' ')

    return (
        <Button
            {...STATUS_PROPS[status]}
            className={className}
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
