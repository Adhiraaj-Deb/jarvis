/**
 * deepgramService.js
 * Handles Speech-to-Text via Deepgram Nova-2.
 * Sends a PCM/WAV audio blob and returns the transcribed string.
 */

const DEEPGRAM_KEY = import.meta.env.VITE_DEEPGRAM_KEY

/**
 * Transcribe a Blob/File of audio using Deepgram Nova-2.
 * @param {Blob} audioBlob  - audio/wav or audio/webm blob
 * @returns {Promise<string>} - transcribed text
 */
export async function transcribeAudio(audioBlob) {
  if (!DEEPGRAM_KEY) throw new Error('Deepgram API key not configured')

  const arrayBuffer = await audioBlob.arrayBuffer()

  const response = await fetch(
    'https://api.deepgram.com/v1/listen?model=nova-2&language=en&smart_format=true&punctuate=true',
    {
      method: 'POST',
      headers: {
        Authorization: `Token ${DEEPGRAM_KEY}`,
        'Content-Type': audioBlob.type || 'audio/wav',
      },
      body: arrayBuffer,
      signal: AbortSignal.timeout(10000), // 10s timeout
    }
  )

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Deepgram error ${response.status}: ${err}`)
  }

  const data = await response.json()
  const transcript =
    data?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? ''

  return transcript.trim()
}
