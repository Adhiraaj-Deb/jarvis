/**
 * QuotaBar.jsx
 * ElevenLabs monthly character quota progress bar.
 * Shown at the bottom of the screen.
 */

import { useState, useEffect } from 'react'
import { getCharsUsed, getQuotaPercent } from '../hooks/useElevenLabsQuota.js'

const FREE_TIER_LIMIT = 10000

export default function QuotaBar() {
  const [charsUsed, setCharsUsed] = useState(getCharsUsed())

  // Refresh on focus (after TTS may have used quota)
  useEffect(() => {
    const refresh = () => setCharsUsed(getCharsUsed())
    window.addEventListener('focus', refresh)
    const interval = setInterval(refresh, 5000)
    return () => {
      window.removeEventListener('focus', refresh)
      clearInterval(interval)
    }
  }, [])

  const pct = Math.min(100, Math.round((charsUsed / FREE_TIER_LIMIT) * 100))
  const remaining = FREE_TIER_LIMIT - charsUsed
  const isLow = remaining < 2000
  const isDepleted = remaining <= 0

  return (
    <div className="quota-bar-container">
      <div className="quota-bar-label">
        <span>ElevenLabs quota</span>
        <span className={isLow ? 'quota-low' : ''}>
          {isDepleted ? 'Depleted — using Web Speech' : `${remaining.toLocaleString()} chars remaining`}
        </span>
      </div>
      <div className="quota-bar-track">
        <div
          className={`quota-bar-fill ${isLow ? 'low' : ''} ${isDepleted ? 'depleted' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
