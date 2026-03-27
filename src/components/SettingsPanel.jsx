/**
 * SettingsPanel.jsx
 * Slide-up settings drawer.
 * Accessible from the gear icon in the top-left corner.
 */

import { useState, useEffect } from 'react'

const PORCUPINE_DOCS = 'https://console.picovoice.ai/'
const OPENROUTER_MODELS = 'https://openrouter.ai/models?q=free'

export default function SettingsPanel({ isOpen, onClose, conversationHistory }) {
  const [sensitivity, setSensitivity] = useState(
    parseFloat(localStorage.getItem('jarvis_sensitivity') || '0.7')
  )
  const [ttsPreference, setTtsPreference] = useState(
    localStorage.getItem('jarvis_tts_pref') || 'auto'
  )
  const [commandLog, setCommandLog] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('jarvis_command_log') || '[]')
    } catch {
      return []
    }
  })

  useEffect(() => {
    if (isOpen) {
      try {
        setCommandLog(JSON.parse(localStorage.getItem('jarvis_command_log') || '[]'))
      } catch {
        setCommandLog([])
      }
    }
  }, [isOpen])

  function saveSensitivity(v) {
    setSensitivity(v)
    localStorage.setItem('jarvis_sensitivity', String(v))
  }

  function saveTtsPref(v) {
    setTtsPreference(v)
    localStorage.setItem('jarvis_tts_pref', v)
  }

  function clearLog() {
    localStorage.removeItem('jarvis_command_log')
    setCommandLog([])
  }

  const hasPorcupine = !!import.meta.env.VITE_PORCUPINE_KEY
  const hasElevenLabs = !!import.meta.env.VITE_ELEVENLABS_KEY

  // API status indicators derived from env vars
  const apiStatus = [
    { name: 'Deepgram STT', ok: !!import.meta.env.VITE_DEEPGRAM_KEY },
    { name: 'OpenRouter (Llama)', ok: !!import.meta.env.VITE_OPENROUTER_KEY_LLAMA },
    { name: 'OpenRouter (Qwen)', ok: !!import.meta.env.VITE_OPENROUTER_KEY_QWEN },
    { name: 'ElevenLabs TTS', ok: hasElevenLabs },
    { name: 'Porcupine Wake Word', ok: hasPorcupine },
  ]

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="settings-backdrop" onClick={onClose} />
      )}

      {/* Panel */}
      <div className={`settings-panel ${isOpen ? 'open' : ''}`}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="settings-close" onClick={onClose}>✕</button>
        </div>

        <div className="settings-body">

          {/* API Status */}
          <section className="settings-section">
            <h3>API Status</h3>
            {apiStatus.map((api) => (
              <div key={api.name} className="api-status-row">
                <span>{api.name}</span>
                <span className={`api-dot ${api.ok ? 'ok' : 'missing'}`}>
                  {api.ok ? '● Connected' : '○ Not configured'}
                </span>
              </div>
            ))}
            {!hasPorcupine && (
              <p className="settings-hint">
                Wake word is button-only mode.{' '}
                <a href={PORCUPINE_DOCS} target="_blank" rel="noopener noreferrer">
                  Get Porcupine key →
                </a>
              </p>
            )}
          </section>

          {/* Wake Word Sensitivity */}
          <section className="settings-section">
            <h3>Wake Word Sensitivity</h3>
            <div className="slider-row">
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={sensitivity}
                onChange={(e) => saveSensitivity(parseFloat(e.target.value))}
                className="settings-slider"
              />
              <span className="slider-value">{sensitivity.toFixed(2)}</span>
            </div>
            <p className="settings-hint">Higher = more sensitive, more false positives</p>
          </section>

          {/* TTS Preference */}
          <section className="settings-section">
            <h3>TTS Preference</h3>
            <div className="radio-group">
              {[
                { v: 'auto', label: 'Auto (recommended)' },
                { v: 'webspeech', label: 'Web Speech only (fastest, offline)' },
                { v: 'elevenlabs', label: 'ElevenLabs always (premium, quota)' },
              ].map(({ v, label }) => (
                <label key={v} className="radio-label">
                  <input
                    type="radio"
                    name="tts"
                    value={v}
                    checked={ttsPreference === v}
                    onChange={() => saveTtsPref(v)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </section>

          {/* Model Info */}
          <section className="settings-section">
            <h3>AI Models</h3>
            <div className="model-info">
              <div className="model-row">
                <span className="model-badge complex">Llama 3.3 70B</span>
                <span>Complex commands (search, define, explain)</span>
              </div>
              <div className="model-row">
                <span className="model-badge simple">GLM 4.5 Air</span>
                <span>Simple commands (open, play, time)</span>
              </div>
            </div>
          </section>

          {/* Conversation context */}
          <section className="settings-section">
            <h3>Conversation Context</h3>
            <p className="settings-hint">{conversationHistory?.length ?? 0} messages in current context</p>
          </section>

          {/* Command Log */}
          {commandLog.length > 0 && (
            <section className="settings-section">
              <div className="section-header-row">
                <h3>Recent Commands</h3>
                <button className="clear-btn" onClick={clearLog}>Clear</button>
              </div>
              <div className="command-log">
                {commandLog.slice(-10).reverse().map((cmd, i) => (
                  <p key={i} className="log-entry">
                    <span className="log-time">{cmd.time}</span> {cmd.text}
                  </p>
                ))}
              </div>
            </section>
          )}

        </div>
      </div>
    </>
  )
}
