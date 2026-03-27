/**
 * openrouterService.js
 * Sends requests to OpenRouter using the OpenAI-compatible API.
 * Routes between Llama 3.3 70B (complex) and GLM 4.5 Air (simple).
 */

const LLAMA_KEY = import.meta.env.VITE_OPENROUTER_KEY_LLAMA
const QWEN_KEY  = import.meta.env.VITE_OPENROUTER_KEY_QWEN
const LLAMA_MODEL = import.meta.env.VITE_LLAMA_MODEL_ID || 'meta-llama/llama-3.3-70b-instruct:free'
const FAST_MODEL  = import.meta.env.VITE_QWEN_MODEL_ID  || 'zhipu/glm-4.5-air:free'

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1'

/**
 * Jarvis system prompt.
 * NOTE: We do NOT use response_format:json_object because many free models (GLM, etc.)
 * don't support it and return garbage. Instead, we enforce JSON via the prompt itself.
 */
const SYSTEM_PROMPT = `You are Jarvis, a personal AI voice assistant.
You MUST reply with ONLY a raw JSON object. No markdown, no code fences, no explanation.

JSON schema:
{
  "intent": "open_app | play_music | spotify_pause | spotify_skip | spotify_previous | spotify_volume | search_web | define_word | set_reminder | get_time | get_date | general_reply",
  "action": {
    "type": "app_launch | media_play | spotify_control | web_search | reminder | none",
    "target": "free string — app name, platform name, or null",
    "query": "song name / search term / reminder text / volume_percent / null",
    "duration_ms": null
  },
  "reply": "What Jarvis says aloud. Plain text only. Be concise and natural.",
  "reply_length": "short | medium | long"
}

Rules:
- reply_length: short = <80 chars, medium = 80-400, long = >400
- For playing music: intent=play_music, target=spotify OR youtube, query=song or artist name. ALWAYS fill query.
- For YouTube video: same — intent=play_music, target=youtube, query=video title.
- For pausing Spotify: intent=spotify_pause
- For skipping Spotify: intent=spotify_skip
- For previous Spotify song: intent=spotify_previous
- For setting Spotify volume: intent=spotify_volume, query=number (0-100)
- For definitions / factual questions: intent=define_word OR general_reply. Put the answer in reply.
- For reminders: intent=set_reminder, action.query=what to remind about, action.duration_ms=milliseconds until reminder fires (e.g. 10 seconds = 10000, 1 minute = 60000, 1 hour = 360000).
- NEVER put markdown, bullet points, or asterisks in the reply field.
- The reply field must be something you would say aloud in a conversation.`

/**
 * Strip markdown code fences that some models add despite instructions.
 */
function stripFences(raw) {
  return raw.replace(/^```[a-z]*\n?/i, '').replace(/```\s*$/i, '').trim()
}

/**
 * Call the AI brain.
 * @param {string} transcript
 * @param {'simple'|'complex'} complexity
 * @param {Array} conversationHistory
 * @returns {Promise<Object>}
 */
export async function callAI(transcript, complexity = 'complex', conversationHistory = []) {
  const useComplex = complexity === 'complex'
  const apiKey = useComplex ? LLAMA_KEY : QWEN_KEY
  const model  = useComplex ? LLAMA_MODEL : FAST_MODEL

  // Append a hard JSON reminder to every user message — works on all models
  const userMessage = `${transcript}\n\n[Respond with ONLY a valid JSON object matching the schema. No markdown, no extra text.]`

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...conversationHistory.slice(-6),
    { role: 'user', content: userMessage },
  ]

  let response = null
  let lastError = null

  // 3-attempt retry with backoff
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://jarvis.synalpy.local',
          'X-Title': 'Jarvis Voice Assistant',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.2,
          max_tokens: 600,
          // NOTE: response_format omitted — incompatible with GLM and other free models
        }),
        signal: AbortSignal.timeout(20000),
      })

      if (response.ok) break

      const errText = await response.text()
      lastError = new Error(`OpenRouter ${response.status}: ${errText}`)
      console.warn(`Attempt ${attempt} failed: ${response.status}. Retrying...`)
      await new Promise(r => setTimeout(r, 800 * attempt))
    } catch (err) {
      lastError = err
      console.warn(`Attempt ${attempt} network error: ${err.message}. Retrying...`)
      await new Promise(r => setTimeout(r, 800 * attempt))
    }
  }

  if (!response || !response.ok) {
    // Primary model failed 3 times — fall back to fast model
    if (useComplex) {
      console.warn('Complex model failed, falling back to fast model:', lastError?.message)
      return callAI(transcript, 'simple', conversationHistory)
    }
    throw lastError || new Error('Network failure after 3 retries')
  }

  const data = await response.json()
  const raw  = data.choices?.[0]?.message?.content ?? ''
  const cleaned = stripFences(raw)

  try {
    const parsed = JSON.parse(cleaned)
    parsed._model = model
    return parsed
  } catch {
    console.warn('AI returned non-JSON, wrapping as general_reply:', cleaned)
    return {
      intent: 'general_reply',
      action: { type: 'none', target: null, query: null, duration_ms: null },
      reply: cleaned || "I didn't quite get that. Could you try again?",
      reply_length: cleaned.length > 400 ? 'long' : cleaned.length > 80 ? 'medium' : 'short',
      _model: model,
    }
  }
}
