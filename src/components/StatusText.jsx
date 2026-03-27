/**
 * StatusText.jsx
 * Single-line status display below the orb.
 */
import { PIPELINE_STATES } from '../hooks/usePipeline.js'

const STATUS_MESSAGES = {
  [PIPELINE_STATES.DORMANT]: 'Say "Jarvis" or press the orb',
  [PIPELINE_STATES.ACTIVATED]: 'Activated — listening...',
  [PIPELINE_STATES.LISTENING]: 'Listening...',
  [PIPELINE_STATES.PROCESSING]: 'Thinking...',
  [PIPELINE_STATES.SPEAKING]: 'Speaking...',
  [PIPELINE_STATES.ERROR]: 'Something went wrong',
}

const STATE_COLORS = {
  [PIPELINE_STATES.DORMANT]: '#4a7aff',
  [PIPELINE_STATES.ACTIVATED]: '#00d4ff',
  [PIPELINE_STATES.LISTENING]: '#00e6a0',
  [PIPELINE_STATES.PROCESSING]: '#b464ff',
  [PIPELINE_STATES.SPEAKING]: '#00b4e6',
  [PIPELINE_STATES.ERROR]: '#ff4444',
}

export default function StatusText({ state, errorMessage }) {
  const text = state === PIPELINE_STATES.ERROR && errorMessage
    ? errorMessage
    : STATUS_MESSAGES[state] || 'Ready'

  return (
    <p
      className="status-text"
      style={{ color: STATE_COLORS[state] || '#4a7aff' }}
    >
      {text}
    </p>
  )
}
