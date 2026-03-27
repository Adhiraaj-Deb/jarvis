/**
 * actionEngine.js
 * Executes intents returned by the AI model.
 *
 * Intents handled:
 *   open_app       → opens a web URL for the app
 *   play_music     → opens Spotify or YouTube with the song/artist query
 *   search_web     → Google search
 *   set_reminder   → schedules a timed reminder via setTimeout + TTS
 *   define_word    → no action needed (TTS handles the spoken answer)
 *   general_reply  → no action needed
 */

/** Active timers store: supports multiple simultaneous reminders */
const activeTimers = new Map()
let timerIdCounter = 0

/**
 * Execute an action from the AI JSON response.
 * @param {Object} aiResponse
 * @param {function} onTimerFired - called with message string when a reminder fires
 */
export function executeAction(aiResponse, onTimerFired) {
  const { intent, action } = aiResponse

  switch (intent) {
    case 'open_app':
      return handleOpenApp(action)
    case 'play_music':
      return handlePlayMusic(action)
    case 'search_web':
      return handleWebSearch(action)
    case 'set_reminder':
    case 'set_alarm':
      return handleReminder(action, aiResponse, onTimerFired)
    // define_word and general_reply: TTS already handles speaking the reply
    default:
      break
  }
}

// ─────────────────────────────────────────────
// Open App
// ─────────────────────────────────────────────
function handleOpenApp(action) {
  const target = (action?.target || '').toLowerCase()
  const query  = action?.query

  // If a query is also provided, do a media search instead of just opening
  if (target.includes('spotify') && query) {
    window.open(`https://open.spotify.com/search/${encodeURIComponent(query)}`, '_blank', 'noopener')
    return
  }
  if (target.includes('youtube') && query) {
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, '_blank', 'noopener')
    return
  }

  const urlMap = {
    spotify:    'https://open.spotify.com',
    youtube:    'https://www.youtube.com',
    whatsapp:   'https://web.whatsapp.com',
    maps:       'https://maps.google.com',
    gmail:      'https://mail.google.com',
    email:      'https://mail.google.com',
    calculator: 'https://www.google.com/search?q=calculator',
    instagram:  'https://www.instagram.com',
    twitter:    'https://twitter.com',
    reddit:     'https://www.reddit.com',
    netflix:    'https://www.netflix.com',
  }

  // Match partial target strings (e.g. "google maps" → maps)
  const matchedKey = Object.keys(urlMap).find(k => target.includes(k))
  const url = action?.url || (matchedKey ? urlMap[matchedKey] : null)

  if (url) {
    window.open(url, '_blank', 'noopener')
  } else if (target) {
    // Last resort: Google search for the app
    window.open(`https://www.google.com/search?q=${encodeURIComponent(target)}`, '_blank', 'noopener')
  }
}

// ─────────────────────────────────────────────
// Play Music / Video
// ─────────────────────────────────────────────
function handlePlayMusic(action) {
  const target = (action?.target || '').toLowerCase()
  const query  = action?.query

  if (!query) {
    // No song specified — just open the platform
    if (target.includes('youtube')) {
      window.open('https://www.youtube.com', '_blank', 'noopener')
    } else {
      window.open('https://open.spotify.com', '_blank', 'noopener')
    }
    return
  }

  if (target.includes('youtube')) {
    // YouTube search — user can click to play
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, '_blank', 'noopener')
  } else {
    // Default to Spotify search
    window.open(`https://open.spotify.com/search/${encodeURIComponent(query)}`, '_blank', 'noopener')
  }
}

// ─────────────────────────────────────────────
// Web Search
// ─────────────────────────────────────────────
function handleWebSearch(action) {
  const query = action?.query || action?.url || ''
  if (!query) return

  if (query.startsWith('http')) {
    window.open(query, '_blank', 'noopener')
  } else {
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank', 'noopener')
  }
}

// ─────────────────────────────────────────────
// Reminder / Timer System (full time-awareness)
// ─────────────────────────────────────────────
function handleReminder(action, aiResponse, onTimerFired) {
  // The AI provides duration_ms directly (it already did the time math from the prompt)
  let ms = action?.duration_ms

  // Fallback: try to parse from the reply or query text if AI omitted duration_ms
  if (!ms || ms <= 0) {
    ms = parseDurationFromText(action?.query || aiResponse?.reply || '')
  }

  if (!ms || ms <= 0) {
    console.warn('Reminder: could not determine duration', action)
    return
  }

  const reminderText = action?.query || 'Your reminder is ready!'
  const timerId = ++timerIdCounter

  // Save to localStorage so it survives soft refreshes (not hard reloads)
  const reminders = getStoredReminders()
  reminders.push({
    id: timerId,
    text: reminderText,
    firesAt: Date.now() + ms,
  })
  saveReminders(reminders)

  const handle = setTimeout(() => {
    activeTimers.delete(timerId)
    // Remove from storage
    const updated = getStoredReminders().filter(r => r.id !== timerId)
    saveReminders(updated)
    // Notify user
    onTimerFired?.(`Reminder: ${reminderText}`)
    // Browser notification if permission granted
    if (Notification.permission === 'granted') {
      new Notification('Jarvis Reminder', { body: reminderText, icon: '/favicon.svg' })
    }
  }, ms)

  activeTimers.set(timerId, handle)
  console.info(`Reminder #${timerId} set for ${ms}ms: "${reminderText}"`)
}

/**
 * Parses a duration from natural language text.
 * Supports: "10 seconds", "2 minutes", "1 hour", "3 hours", "1 day"
 */
export function parseDurationFromText(text) {
  if (!text) return 0
  const lower = text.toLowerCase()

  let totalMs = 0

  const patterns = [
    { regex: /(\d+(?:\.\d+)?)\s*(?:day|days)/,    factor: 86400000 },
    { regex: /(\d+(?:\.\d+)?)\s*(?:hour|hours|hr|hrs)/, factor: 3600000 },
    { regex: /(\d+(?:\.\d+)?)\s*(?:minute|minutes|min|mins)/, factor: 60000 },
    { regex: /(\d+(?:\.\d+)?)\s*(?:second|seconds|sec|secs)/, factor: 1000 },
  ]

  for (const { regex, factor } of patterns) {
    const match = lower.match(regex)
    if (match) totalMs += parseFloat(match[1]) * factor
  }

  return totalMs
}

/** Cancel all active in-memory timers */
export function cancelAllReminders() {
  for (const handle of activeTimers.values()) clearTimeout(handle)
  activeTimers.clear()
}

// ─────────────────────────────────────────────
// Offline Action Handler
// ─────────────────────────────────────────────
export function executeOfflineAction(action, payload, onTimerFired) {
  switch (action) {
    case 'open_url':
      if (payload) window.open(payload, '_blank', 'noopener')
      break
    case 'set_timer':
      if (payload > 0) {
        const handle = setTimeout(() => {
          onTimerFired?.('Your timer is done!')
        }, payload)
        activeTimers.set(++timerIdCounter, handle)
      }
      break
    case 'play_music':
      window.open('https://open.spotify.com', '_blank', 'noopener')
      break
    default:
      break
  }
}

// ─────────────────────────────────────────────
// localStorage helpers
// ─────────────────────────────────────────────
function getStoredReminders() {
  try {
    return JSON.parse(localStorage.getItem('jarvis_reminders') || '[]')
  } catch { return [] }
}

function saveReminders(list) {
  try {
    localStorage.setItem('jarvis_reminders', JSON.stringify(list))
  } catch { /* ignore */ }
}
