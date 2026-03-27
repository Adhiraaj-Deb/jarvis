/**
 * useElevenLabsQuota.js
 * Tracks ElevenLabs monthly character quota in localStorage.
 * Resets on the 1st of each month.
 * Free tier = 10,000 chars/month.
 *
 * NOTE: These are standalone exported functions (not a React hook)
 * to allow import from ttsService.js without React context.
 * The React hook useQuotaState() wraps them for UI binding.
 */

const STORAGE_KEY = 'jarvis_el_chars_used'
const MONTHLY_KEY = 'jarvis_el_reset_month'
const FREE_TIER_LIMIT = 10000

function getCurrentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}`
}

function checkAndReset() {
  const stored = localStorage.getItem(MONTHLY_KEY)
  const current = getCurrentMonth()
  if (stored !== current) {
    localStorage.setItem(MONTHLY_KEY, current)
    localStorage.setItem(STORAGE_KEY, '0')
  }
}

export function getCharsUsed() {
  checkAndReset()
  return parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10)
}

export function getQuotaRemaining() {
  return FREE_TIER_LIMIT - getCharsUsed()
}

export function deductQuota(chars) {
  const current = getCharsUsed()
  localStorage.setItem(STORAGE_KEY, String(current + chars))
}

export function getQuotaPercent() {
  return Math.min(100, Math.round((getCharsUsed() / FREE_TIER_LIMIT) * 100))
}
