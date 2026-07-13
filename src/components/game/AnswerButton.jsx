import { Button } from '@mantine/core'
import './AnswerButton.css'

const STATUS_PROPS = {
    idle:    { variant: 'outline', color: 'brandTeal' },
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
    return (
        <Button
            {...STATUS_PROPS[status]}
            className={ANIM_CLASS[status]}
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
