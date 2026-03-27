/**
 * ttsService.js
 * 3-tier hybrid TTS router.
 *
 * Tier 1 — Web Speech API:   reply_length = 'short' OR < 80 chars
 * Tier 2 — (Reserved for Kokoro ONNX, falls to Web Speech for now)
 * Tier 3 — ElevenLabs:       reply_length = 'long' OR > 400 chars
 *
 * Routes based on reply_length and quota availability.
 */

import { speakElevenLabs, stopElevenLabs, countChars } from './elevenLabsService.js'
import { speakWebSpeech, stopWebSpeech } from './webSpeechService.js'
import { getQuotaRemaining, deductQuota } from '../hooks/useElevenLabsQuota.js'

/**
 * Speak text using the appropriate TTS tier.
 * @param {string} text
 * @param {'short'|'medium'|'long'} replyLength - from AI JSON
 * @param {function} onStart
 * @param {function} onEnd
 * @param {function} onTierUsed - optional cb(tier: string)
 */
export async function speak(text, replyLength, onStart, onEnd, onTierUsed) {
  stopAll()

  const charCount = text?.length ?? 0
  const quotaRemaining = getQuotaRemaining()

  // Determine tier
  let tier

  if (replyLength === 'short' || charCount < 80) {
    tier = 'webspeech'
  } else if (replyLength === 'long' || charCount > 400) {
    // Use ElevenLabs only if quota available
    if (quotaRemaining >= charCount && import.meta.env.VITE_ELEVENLABS_KEY) {
      tier = 'elevenlabs'
    } else {
      tier = 'webspeech' // quota exhausted — degrade gracefully
    }
  } else {
    // medium — use Web Speech (Kokoro reserved for future)
    tier = 'webspeech'
  }

  onTierUsed?.(tier)

  if (tier === 'elevenlabs') {
    try {
      await speakElevenLabs(text, onStart, onEnd)
      deductQuota(countChars(text))
    } catch (err) {
      console.warn('ElevenLabs failed, falling back to Web Speech:', err.message)
      speakWebSpeech(text, onStart, onEnd)
    }
  } else {
    speakWebSpeech(text, onStart, onEnd)
  }
}

/** Stop all active TTS playback */
export function stopAll() {
  stopElevenLabs()
  stopWebSpeech()
}
