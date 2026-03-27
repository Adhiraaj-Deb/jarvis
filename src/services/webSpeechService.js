/**
 * webSpeechService.js
 * Tier 1 TTS — uses the browser's built-in SpeechSynthesis API.
 * Zero cost, zero latency, works offline.
 * Used for short replies and all offline responses.
 */

let utterance = null

/**
 * Speak text using SpeechSynthesis.
 * @param {string} text
 * @param {function} onStart
 * @param {function} onEnd
 */
export function speakWebSpeech(text, onStart, onEnd) {
  stopWebSpeech()

  if (!window.speechSynthesis) {
    console.warn('Web Speech API not available')
    onEnd?.()
    return
  }

  utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 1.05
  utterance.pitch = 0.95
  utterance.volume = 1.0

  // Prefer a slightly deeper voice if available
  const voices = window.speechSynthesis.getVoices()
  const preferred = voices.find(
    (v) =>
      v.lang.startsWith('en') &&
      (v.name.includes('Google') || v.name.includes('Male') || v.name.includes('David'))
  )
  if (preferred) utterance.voice = preferred

  utterance.onstart = () => onStart?.()
  utterance.onend = () => {
    utterance = null
    onEnd?.()
  }
  utterance.onerror = () => {
    utterance = null
    onEnd?.()
  }

  window.speechSynthesis.speak(utterance)
}

export function stopWebSpeech() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
  utterance = null
}
