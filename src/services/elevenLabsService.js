/**
 * elevenLabsService.js
 * Tier 3 TTS using ElevenLabs API.
 * Used for long-form, high-quality voice output.
 */

const EL_KEY = import.meta.env.VITE_ELEVENLABS_KEY
const EL_VOICE = import.meta.env.VITE_ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'

let currentAudio = null

/**
 * Speak text via ElevenLabs TTS.
 * @param {string} text
 * @param {function} onStart - called when audio starts playing
 * @param {function} onEnd - called when audio finishes
 * @returns {Promise<void>}
 */
export async function speakElevenLabs(text, onStart, onEnd) {
  if (!EL_KEY) throw new Error('ElevenLabs API key not configured')

  stopElevenLabs()

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${EL_VOICE}/stream`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': EL_KEY,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
      signal: AbortSignal.timeout(20000),
    }
  )

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`ElevenLabs error ${response.status}: ${err}`)
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)

  currentAudio = new Audio(url)
  currentAudio.onplay = () => onStart?.()
  currentAudio.onended = () => {
    URL.revokeObjectURL(url)
    currentAudio = null
    onEnd?.()
  }
  currentAudio.onerror = () => {
    URL.revokeObjectURL(url)
    currentAudio = null
    onEnd?.()
  }

  await currentAudio.play()
}

/** Stop any playing ElevenLabs audio instantly */
export function stopElevenLabs() {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }
}

/**
 * Get approximate character count for quota tracking.
 * ElevenLabs counts characters in text (including spaces).
 */
export function countChars(text) {
  return text?.length ?? 0
}
