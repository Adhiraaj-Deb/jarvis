/**
 * spotifyService.js
 * Full Spotify OAuth + Playback Control service.
 *
 * Authentication: PKCE Authorization Code Flow via Vercel backend.
 * Tokens are stored in localStorage and refreshed automatically.
 * Requires Spotify Premium for playback control (play, pause, skip).
 */

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID
const REDIRECT_URI_PROD = window.location.origin + '/api/spotify/callback'

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'jarvis_spotify_access',
  REFRESH_TOKEN: 'jarvis_spotify_refresh',
  EXPIRES_AT: 'jarvis_spotify_expires',
}

// ─────────────────────────────────────────────
// Token Storage Helpers
// ─────────────────────────────────────────────
function saveTokens({ access_token, refresh_token, expires_in }) {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token)
  if (refresh_token) localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh_token)
  localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, String(Date.now() + expires_in * 1000))
}

function getAccessToken() {
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
}

function getRefreshToken() {
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
}

function isTokenExpired() {
  const expiresAt = localStorage.getItem(STORAGE_KEYS.EXPIRES_AT)
  if (!expiresAt) return true
  // Treat as expired 60s before actual expiry to avoid race conditions
  return Date.now() > parseInt(expiresAt) - 60000
}

function clearTokens() {
  Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k))
}

// ─────────────────────────────────────────────
// Connection Check
// ─────────────────────────────────────────────
export function isSpotifyConnected() {
  return !!getAccessToken() && !!getRefreshToken()
}

// ─────────────────────────────────────────────
// OAuth Login — opens popup to Vercel /api/spotify/auth
// ─────────────────────────────────────────────
export function connectSpotify() {
  return new Promise((resolve, reject) => {
    const popup = window.open(
      '/api/spotify/auth',
      'SpotifyLogin',
      'width=500,height=650,scrollbars=yes'
    )

    if (!popup) {
      reject(new Error('Popup blocked. Please allow popups for this site.'))
      return
    }

    // Listen for tokens sent back by the callback page via postMessage
    function handleMessage(event) {
      if (event.data?.type === 'SPOTIFY_TOKENS') {
        window.removeEventListener('message', handleMessage)
        clearInterval(pollClosed)
        const tokens = event.data.tokens
        if (tokens?.access_token) {
          saveTokens(tokens)
          resolve(true)
        } else {
          reject(new Error('Spotify auth failed — no tokens received'))
        }
      }
    }

    // Also detect if user simply closes the popup
    const pollClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(pollClosed)
        window.removeEventListener('message', handleMessage)
        reject(new Error('Spotify login cancelled'))
      }
    }, 500)

    window.addEventListener('message', handleMessage)
  })
}

// ─────────────────────────────────────────────
// Token Refresh
// ─────────────────────────────────────────────
async function refreshAccessToken() {
  const refreshToken = getRefreshToken()
  if (!refreshToken) throw new Error('No refresh token available')

  const res = await fetch('/api/spotify/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })

  if (!res.ok) {
    clearTokens() // Force re-login
    throw new Error('Token refresh failed — please reconnect Spotify')
  }

  const data = await res.json()
  saveTokens({ access_token: data.access_token, refresh_token: null, expires_in: data.expires_in })
  return data.access_token
}

// ─────────────────────────────────────────────
// Authenticated Spotify API Call
// ─────────────────────────────────────────────
async function spotifyFetch(path, options = {}) {
  let token = getAccessToken()
  if (!token) throw new Error('Not connected to Spotify')

  if (isTokenExpired()) {
    token = await refreshAccessToken()
  }

  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })

  // 204 No Content is a valid success for play/pause/skip
  if (res.status === 204) return null

  if (res.status === 401) {
    // Token rejected — try one refresh, then fail
    token = await refreshAccessToken()
    const retry = await fetch(`https://api.spotify.com/v1${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    })
    if (retry.status === 204) return null
    if (!retry.ok) throw new Error(`Spotify API error: ${retry.status}`)
    return retry.json()
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Spotify API error: ${res.status}`)
  }

  return res.json()
}

// ─────────────────────────────────────────────
// Search for a track, return the best match URI
// ─────────────────────────────────────────────
async function searchTrack(query) {
  const data = await spotifyFetch(`/search?q=${encodeURIComponent(query)}&type=track&limit=1`)
  const track = data?.tracks?.items?.[0]
  if (!track) throw new Error(`No track found for "${query}"`)
  return { uri: track.uri, name: track.name, artist: track.artists?.[0]?.name }
}

// ─────────────────────────────────────────────
// Playback Control — Public API
// ─────────────────────────────────────────────

/** Play a specific song by name/query */
export async function playSong(query) {
  const { uri, name, artist } = await searchTrack(query)
  await spotifyFetch('/me/player/play', {
    method: 'PUT',
    body: JSON.stringify({ uris: [uri] }),
  })
  return `Playing ${name} by ${artist} on Spotify.`
}

/** Pause playback */
export async function pausePlayback() {
  await spotifyFetch('/me/player/pause', { method: 'PUT' })
  return 'Paused Spotify.'
}

/** Resume playback */
export async function resumePlayback() {
  await spotifyFetch('/me/player/play', { method: 'PUT' })
  return 'Resuming playback.'
}

/** Skip to next track */
export async function skipToNext() {
  await spotifyFetch('/me/player/next', { method: 'POST' })
  return 'Skipped to the next song.'
}

/** Skip to previous track */
export async function skipToPrevious() {
  await spotifyFetch('/me/player/previous', { method: 'POST' })
  return 'Going back to the previous song.'
}

/** Get the currently playing track */
export async function getCurrentlyPlaying() {
  const data = await spotifyFetch('/me/player/currently-playing')
  if (!data || !data.item) return 'Nothing is currently playing.'
  const { name, artists } = data.item
  return `Currently playing ${name} by ${artists.map(a => a.name).join(', ')}.`
}

/** Set volume (0-100) */
export async function setVolume(percent) {
  const vol = Math.max(0, Math.min(100, percent))
  await spotifyFetch(`/me/player/volume?volume_percent=${vol}`, { method: 'PUT' })
  return `Volume set to ${vol}%.`
}

/**
 * Master action dispatcher — called by the action engine.
 * Handles the full intent string from AI.
 * @param {string} target - e.g. 'play', 'pause', 'skip', 'previous', 'current'
 * @param {string} query  - song name (for 'play' intent)
 */
export async function spotifyAction(target, query) {
  const t = (target || '').toLowerCase()

  if (t === 'play' && query) return playSong(query)
  if (t === 'play') return resumePlayback()
  if (t === 'pause' || t === 'stop') return pausePlayback()
  if (t === 'resume') return resumePlayback()
  if (t === 'skip' || t === 'next') return skipToNext()
  if (t === 'previous' || t === 'prev' || t === 'back') return skipToPrevious()
  if (t === 'current' || t === 'what' || t === 'now') return getCurrentlyPlaying()

  // Fallback: treat target as a song search query
  if (query) return playSong(query)
  return playSong(target)
}

export function disconnectSpotify() {
  clearTokens()
}
