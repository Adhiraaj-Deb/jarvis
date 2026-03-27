/**
 * offlineCommands.js
 * Deterministic pattern matcher for offline commands.
 * No AI or internet required. Fuzzy keyword matching.
 *
 * Returns: { matched: bool, reply: string, action: string, payload: any }
 */

/** Keyword groups for each offline command category */
const PATTERNS = [
  {
    id: 'get_time',
    keywords: ['time', 'what time', "what's the time", 'current time'],
    handler: () => {
      const now = new Date()
      const time = now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
      return {
        reply: `It's ${time}.`,
        action: 'none',
        payload: null,
      }
    },
  },
  {
    id: 'get_date',
    keywords: ['date', "today's date", 'what date', 'current date', "what's today"],
    handler: () => {
      const now = new Date()
      const date = now.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
      return {
        reply: `Today is ${date}.`,
        action: 'none',
        payload: null,
      }
    },
  },
  {
    id: 'get_day',
    keywords: ['day', 'what day', 'which day', "what's the day"],
    handler: () => {
      const day = new Date().toLocaleDateString('en-IN', { weekday: 'long' })
      return {
        reply: `Today is ${day}.`,
        action: 'none',
        payload: null,
      }
    },
  },
  {
    id: 'stop_music',
    keywords: ['stop music', 'pause music', 'pause', 'stop playing', 'stop'],
    handler: () => ({
      reply: 'Stopping playback.',
      action: 'stop_music',
      payload: null,
    }),
  },
  {
    id: 'play_music',
    keywords: ['play music', 'play some music', 'shuffle music', 'play songs'],
    handler: () => ({
      reply: 'Playing music.',
      action: 'play_music',
      payload: null,
    }),
  },
  {
    id: 'open_spotify',
    keywords: ['open spotify', 'launch spotify', 'start spotify'],
    handler: () => ({
      reply: 'Opening Spotify.',
      action: 'open_url',
      payload: 'https://open.spotify.com',
    }),
  },
  {
    id: 'open_youtube',
    keywords: ['open youtube', 'launch youtube', 'go to youtube'],
    handler: () => ({
      reply: 'Opening YouTube.',
      action: 'open_url',
      payload: 'https://www.youtube.com',
    }),
  },
  {
    id: 'open_maps',
    keywords: ['open maps', 'launch maps', 'google maps', 'open google maps'],
    handler: () => ({
      reply: 'Opening Google Maps.',
      action: 'open_url',
      payload: 'https://maps.google.com',
    }),
  },
  {
    id: 'open_whatsapp',
    keywords: ['open whatsapp', 'launch whatsapp', 'go to whatsapp'],
    handler: () => ({
      reply: 'Opening WhatsApp.',
      action: 'open_url',
      payload: 'https://web.whatsapp.com',
    }),
  },
  {
    id: 'open_gmail',
    keywords: ['open gmail', 'open email', 'launch gmail', 'check email'],
    handler: () => ({
      reply: 'Opening Gmail.',
      action: 'open_url',
      payload: 'https://mail.google.com',
    }),
  },
  {
    id: 'set_timer',
    keywords: ['set a timer', 'timer for', 'start a timer', 'countdown', 'remind me', 'set reminder'],
    handler: (text) => {
      // Parse all time units: days, hours, minutes, seconds
      let totalMs = 0
      const patterns = [
        { regex: /(\d+(?:\.\d+)?)\s*(?:day|days)/, factor: 86400000 },
        { regex: /(\d+(?:\.\d+)?)\s*(?:hour|hours|hr|hrs)/, factor: 3600000 },
        { regex: /(\d+(?:\.\d+)?)\s*(?:minute|minutes|min|mins)/, factor: 60000 },
        { regex: /(\d+(?:\.\d+)?)\s*(?:second|seconds|sec|secs)/, factor: 1000 },
      ]
      const labels = []
      for (const { regex, factor } of patterns) {
        const match = text.match(regex)
        if (match) {
          const num = parseFloat(match[1])
          totalMs += num * factor
          labels.push(match[0].trim())
        }
      }
      if (totalMs <= 0) return { reply: "How long should the timer be?", action: 'none', payload: null }
      return {
        reply: `Timer set for ${labels.join(' and ')}.`,
        action: 'set_timer',
        payload: totalMs,
      }
    },
  },
  {
    id: 'volume_up',
    keywords: ['volume up', 'turn up', 'louder', 'increase volume'],
    handler: () => ({
      reply: 'Volume up.',
      action: 'volume_up',
      payload: null,
    }),
  },
  {
    id: 'volume_down',
    keywords: ['volume down', 'turn down', 'quieter', 'decrease volume', 'lower volume'],
    handler: () => ({
      reply: 'Volume down.',
      action: 'volume_down',
      payload: null,
    }),
  },
  {
    id: 'mute',
    keywords: ['mute', 'silence', 'quiet'],
    handler: () => ({
      reply: 'Muted.',
      action: 'mute',
      payload: null,
    }),
  },
]

/**
 * Normalise text for matching.
 */
function normalise(text) {
  return text.toLowerCase().replace(/[^\w\s]/g, '').trim()
}

/**
 * Compute a confidence score: how many keyword tokens appear in the text.
 */
function score(keyword, normalisedText) {
  const kTokens = keyword.split(' ')
  const hits = kTokens.filter((t) => normalisedText.includes(t)).length
  return hits / kTokens.length
}

/**
 * Try to match the transcript against offline patterns.
 * @param {string} transcript
 * @returns {{ matched: boolean, reply?: string, action?: string, payload?: any }}
 */
export function matchOfflineCommand(transcript) {
  const norm = normalise(transcript)
  let best = null
  let bestScore = 0

  for (const pattern of PATTERNS) {
    for (const keyword of pattern.keywords) {
      const s = score(keyword, norm)
      if (s > bestScore) {
        bestScore = s
        best = pattern
      }
    }
  }

  const THRESHOLD = 0.75

  if (best && bestScore >= THRESHOLD) {
    const result = best.handler(norm)
    return { matched: true, intent: best.id, ...result }
  }

  return { matched: false }
}
