/**
 * App.jsx
 * Main application layout.
 * Assembles all components and plugs in the pipeline hook.
 */

import { useState, useEffect, useCallback } from 'react'
import Orb from './components/Orb.jsx'
import StatusText from './components/StatusText.jsx'
import TranscriptDisplay from './components/TranscriptDisplay.jsx'
import ModeIndicator from './components/ModeIndicator.jsx'
import QuotaBar from './components/QuotaBar.jsx'
import SettingsPanel from './components/SettingsPanel.jsx'
import { usePipeline, PIPELINE_STATES } from './hooks/usePipeline.js'

export default function App() {
  const {
    pipelineState,
    isOnline,
    lastTranscript,
    lastReply,
    errorMessage,
    amplitude,
    activeTtsEngine,
    conversationHistory,
    activatePipeline,
    submitTextCommand,
    interrupt,
    requestPermission,
  } = usePipeline()

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [micGranted, setMicGranted] = useState(false)

  // Request mic + notification permission on first load
  useEffect(() => {
    requestPermission().then((ok) => setMicGranted(ok))
    // Request browser notification permission for reminders
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [requestPermission])

  // Log commands to localStorage
  useEffect(() => {
    if (!lastTranscript) return
    try {
      const log = JSON.parse(localStorage.getItem('jarvis_command_log') || '[]')
      log.push({
        text: lastTranscript,
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      })
      // Keep only last 50
      localStorage.setItem('jarvis_command_log', JSON.stringify(log.slice(-50)))
    } catch { /* ignore */ }
  }, [lastTranscript])

  const handleOrbClick = useCallback(() => {
    if (pipelineState === PIPELINE_STATES.DORMANT) {
      activatePipeline()
    } else {
      interrupt()
    }
  }, [pipelineState, activatePipeline, interrupt])

  // Keyboard shortcut: Space to activate/interrupt
  useEffect(() => {
    function onKey(e) {
      if (e.code === 'Space' && !settingsOpen && e.target === document.body) {
        e.preventDefault()
        handleOrbClick()
      }
      if (e.code === 'Escape') {
        setSettingsOpen(false)
        interrupt()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleOrbClick, settingsOpen, interrupt])

  const isDormant = pipelineState === PIPELINE_STATES.DORMANT

  return (
    <div className="app">
      {/* Background particles */}
      <div className="bg-grid" aria-hidden />

      {/* Top bar */}
      <header className="top-bar">
        <button
          className="icon-btn"
          onClick={() => setSettingsOpen(true)}
          title="Settings"
          aria-label="Open settings"
        >
          ⚙
        </button>
        <div className="logo">
          <span className="logo-j">J</span>arvis
        </div>
        <ModeIndicator isOnline={isOnline} />
      </header>

      {/* Main content */}
      <main className="main-content">
        {/* Orb */}
        <div className="orb-wrapper">
          <Orb
            state={pipelineState}
            amplitude={amplitude}
            onClick={handleOrbClick}
          />
          {isDormant && (
            <p className="orb-hint">
              {micGranted
                ? 'Press Space or click the orb to activate'
                : '⚠ Microphone permission required'}
            </p>
          )}
        </div>

        {/* Status */}
        <StatusText state={pipelineState} errorMessage={errorMessage} />

        {/* Transcript */}
        <TranscriptDisplay
          transcript={lastTranscript}
          reply={lastReply}
          ttsEngine={activeTtsEngine}
        />

        {/* Text Input & Shortcuts */}
        <div className="w-full max-w-md mx-auto mt-8 flex flex-col items-center gap-3">
          <form
            className="w-full px-4"
            onSubmit={(e) => {
              e.preventDefault()
              const val = e.target.elements.command.value
              submitTextCommand(val)
              e.target.reset()
            }}
          >
            <input
              type="text"
              name="command"
              placeholder="Or type a command..."
              autoComplete="off"
              disabled={!isDormant}
              className="w-full bg-white/5 border border-white/10 rounded-full py-3 px-6 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[#00aaff]/50 focus:bg-white/10 transition-all text-center disabled:opacity-0 disabled:pointer-events-none"
            />
          </form>
          
          {isDormant && (
            <div className="shortcuts-hint">
              <kbd>Space</kbd> Activate &nbsp;|&nbsp; <kbd>Esc</kbd> Interrupt
            </div>
          )}
        </div>
      </main>

      {/* Quota bar */}
      {import.meta.env.VITE_ELEVENLABS_KEY && <QuotaBar />}

      {/* Settings panel */}
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        conversationHistory={conversationHistory}
      />
    </div>
  )
}
