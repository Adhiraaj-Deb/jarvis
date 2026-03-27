/**
 * TranscriptDisplay.jsx
 * Shows the last transcript and AI reply with fade-out after 8 seconds.
 */
import { useEffect, useState } from 'react'

export default function TranscriptDisplay({ transcript, reply, ttsEngine }) {
  const [visible, setVisible] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    if (!transcript && !reply) return
    setVisible(true)
    setFadeOut(false)

    const fadeTimer = setTimeout(() => setFadeOut(true), 8000)
    const hideTimer = setTimeout(() => setVisible(false), 9000)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(hideTimer)
    }
  }, [transcript, reply])

  if (!visible) return null

  return (
    <div className={`transcript-container ${fadeOut ? 'fade-out' : ''}`}>
      {transcript && (
        <div className="transcript-user">
          <span className="transcript-label">You</span>
          <p className="transcript-text">{transcript}</p>
        </div>
      )}
      {reply && (
        <div className="transcript-jarvis">
          <span className="transcript-label">
            Jarvis
            {ttsEngine && (
              <span className="tts-badge">
                {ttsEngine === 'elevenlabs' ? '✦ EL' : ttsEngine === 'webspeech' ? '◎ WS' : '◉ KO'}
              </span>
            )}
          </span>
          <p className="transcript-text">{reply}</p>
        </div>
      )}
    </div>
  )
}
