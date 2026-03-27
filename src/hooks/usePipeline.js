/**
 * usePipeline.js
 * The core Jarvis pipeline state machine.
 *
 * Pipeline states:
 *   dormant → activated → listening → processing → speaking → dormant
 *               ↑                                                  |
 *               └──────────────────────────────────────────────────┘
 *
 * Trigger flow:
 *   1. Wake word OR button press → 'activated'
 *   2. Audio capture begins → 'listening'
 *   3. Silence detected, audio sent to Deepgram → 'processing'
 *   4. AI response + action executed, TTS begins → 'speaking'
 *   5. TTS ends → back to 'dormant' (listening for wake word)
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useAudioCapture } from './useAudioCapture.js'
import { transcribeAudio } from '../services/deepgramService.js'
import { callAI } from '../services/openrouterService.js'
import { speak, stopAll } from '../services/ttsService.js'
import { matchOfflineCommand } from '../engine/offlineCommands.js'
import { getComplexity } from '../engine/intentRouter.js'
import { executeAction, executeOfflineAction } from '../engine/actionEngine.js'

export const PIPELINE_STATES = {
  DORMANT: 'dormant',
  ACTIVATED: 'activated',
  LISTENING: 'listening',
  PROCESSING: 'processing',
  SPEAKING: 'speaking',
  ERROR: 'error',
}

export function usePipeline() {
  const [pipelineState, setPipelineState] = useState(PIPELINE_STATES.DORMANT)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [lastTranscript, setLastTranscript] = useState('')
  const [lastReply, setLastReply] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [amplitude, setAmplitude] = useState(0)
  const [activeTtsEngine, setActiveTtsEngine] = useState('')

  const conversationHistory = useRef([])
  const { startRecording, stopRecording, requestPermission } = useAudioCapture()

  // Monitor network status
  useEffect(() => {
    const onOnline = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  /** Handle timer firing */
  const onTimerFired = useCallback((message) => {
    speak(message, 'short', () => setPipelineState(PIPELINE_STATES.SPEAKING), () => setPipelineState(PIPELINE_STATES.DORMANT), setActiveTtsEngine)
  }, [])

  /** Sets error state with a message, then recovers after 3s */
  const setError = useCallback((msg) => {
    setErrorMessage(msg)
    setPipelineState(PIPELINE_STATES.ERROR)
    setTimeout(() => {
      setPipelineState(PIPELINE_STATES.DORMANT)
      setErrorMessage('')
    }, 4000)
  }, [])

  /**
   * Extracted logic for processing a transcript (from voice or text)
   */
  const processTranscript = useCallback(async (transcript) => {
    // Check "reset context" commands
    const lower = transcript.toLowerCase()
    if (lower.includes('start over') || lower.includes('forget that') || lower.includes('reset')) {
      conversationHistory.current = []
      const reply = "Got it, I've cleared our conversation context."
      setLastReply(reply)
      speak(reply, 'short', () => setPipelineState(PIPELINE_STATES.SPEAKING), () => setPipelineState(PIPELINE_STATES.DORMANT), setActiveTtsEngine)
      return
    }

    // Check "try again" (re-run last user command)
    if (lower.includes('try again') || lower.includes('do that again')) {
      const history = conversationHistory.current
      let lastUserMsg = ''
      for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].role === 'user') {
          lastUserMsg = history[i].content
          break
        }
      }
      if (lastUserMsg) {
        transcript = lastUserMsg
        setLastTranscript(`(Retrying: "${transcript}")`)
      } else {
        const reply = "I don't have a previous command to try again."
        setLastReply(reply)
        speak(reply, 'short', () => setPipelineState(PIPELINE_STATES.SPEAKING), () => setPipelineState(PIPELINE_STATES.DORMANT), setActiveTtsEngine)
        return
      }
    }

    // Check "repeat that" (re-speak last AI reply)
    if (lower.includes('repeat that') || lower.includes('say that again') || lower.includes('what did you say')) {
      const history = conversationHistory.current
      let lastAiMsg = ''
      for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].role === 'assistant') {
          lastAiMsg = history[i].content
          break
        }
      }
      const reply = lastAiMsg || "I haven't said anything yet."
      setLastReply(reply)
      speak(reply, reply.length > 80 ? 'medium' : 'short', () => setPipelineState(PIPELINE_STATES.SPEAKING), () => setPipelineState(PIPELINE_STATES.DORMANT), setActiveTtsEngine)
      return
    }

    // Check offline patterns first
    const offlineResult = matchOfflineCommand(transcript)
    if (offlineResult.matched) {
      const { reply, action, payload } = offlineResult
      setLastReply(reply)
      executeOfflineAction(action, payload, onTimerFired)
      speak(reply, 'short', () => setPipelineState(PIPELINE_STATES.SPEAKING), () => {
        setPipelineState(PIPELINE_STATES.DORMANT)
      }, setActiveTtsEngine)
      return
    }

    // Needs internet
    if (!isOnline) {
      const reply = "I need an internet connection for that."
      setLastReply(reply)
      speak(reply, 'short', () => setPipelineState(PIPELINE_STATES.SPEAKING), () => setPipelineState(PIPELINE_STATES.DORMANT), setActiveTtsEngine)
      return
    }

    // --- Step 5: AI Call ---
    const complexity = getComplexity(transcript)
    let aiResponse
    try {
      aiResponse = await callAI(transcript, complexity, conversationHistory.current)
    } catch (err) {
      console.error('AI error:', err)
      const fallbackReply = "I'm having trouble connecting to my brain right now. Please try again."
      setLastReply(fallbackReply)
      speak(fallbackReply, 'short', () => setPipelineState(PIPELINE_STATES.SPEAKING), () => setPipelineState(PIPELINE_STATES.DORMANT), setActiveTtsEngine)
      return
    }

    // --- Step 6: Update conversation history ---
    conversationHistory.current = [
      ...conversationHistory.current,
      { role: 'user', content: transcript },
      { role: 'assistant', content: aiResponse.reply },
    ].slice(-12) // keep last 6 turns (12 messages)

    // --- Step 7: Execute action ---
    executeAction(aiResponse, onTimerFired)

    // --- Step 8: Speak reply ---
    const replyText = aiResponse.reply || "Done."
    setLastReply(replyText)

    speak(
      replyText,
      aiResponse.reply_length || 'medium',
      () => setPipelineState(PIPELINE_STATES.SPEAKING),
      () => setPipelineState(PIPELINE_STATES.DORMANT),
      setActiveTtsEngine
    )
  }, [isOnline, onTimerFired])

  /**
   * The full pipeline: activate → listen → transcribe → AI → action → speak
   */
  const activatePipeline = useCallback(async () => {
    // Prevent double activation
    if (pipelineState !== PIPELINE_STATES.DORMANT) return

    // --- Step 1: Activated ---
    setPipelineState(PIPELINE_STATES.ACTIVATED)
    setLastTranscript('')
    setLastReply('')
    setErrorMessage('')

    // --- Step 2: Listening ---
    setPipelineState(PIPELINE_STATES.LISTENING)

    let audioBlob = null
    try {
      audioBlob = await new Promise((resolve, reject) => {
        startRecording(
          (blob) => resolve(blob),
          (reason) => {
            if (reason === 'permission_denied') reject(new Error('Microphone permission denied'))
          },
          (rms) => setAmplitude(rms)
        )
      })
    } catch (err) {
      setError(err.message)
      return
    }

    setAmplitude(0)

    if (!audioBlob || audioBlob.size < 1000) {
      setPipelineState(PIPELINE_STATES.DORMANT)
      return
    }

    // --- Step 3: Processing (STT) ---
    setPipelineState(PIPELINE_STATES.PROCESSING)

    let transcript = ''
    try {
      if (isOnline) {
        transcript = await transcribeAudio(audioBlob)
      } else {
        // Offline: try Web Speech Recognition
        transcript = await webSpeechFallbackSTT()
      }
    } catch (err) {
      // STT failed — try Web Speech Recognition as fallback
      try {
        transcript = await webSpeechFallbackSTT()
      } catch {
        setError("I couldn't hear that clearly. Please try again.")
        return
      }
    }

    if (!transcript || transcript.length < 2) {
      setPipelineState(PIPELINE_STATES.DORMANT)
      return
    }

    setLastTranscript(transcript)
    await processTranscript(transcript)
  }, [pipelineState, isOnline, startRecording, setError, processTranscript])

  /**
   * Skips STT and processes a typed text command directly
   */
  const submitTextCommand = useCallback(async (text) => {
    if (pipelineState !== PIPELINE_STATES.DORMANT) return
    const trimmed = text.trim()
    if (!trimmed) return

    setPipelineState(PIPELINE_STATES.ACTIVATED)
    setLastTranscript('')
    setLastReply('')
    setErrorMessage('')

    await new Promise((r) => setTimeout(r, 100))

    setPipelineState(PIPELINE_STATES.PROCESSING)
    setLastTranscript(trimmed)
    
    await processTranscript(trimmed)
  }, [pipelineState, processTranscript])

  /** Interrupt — stop everything and return to dormant */
  const interrupt = useCallback(() => {
    stopRecording()
    stopAll()
    setPipelineState(PIPELINE_STATES.DORMANT)
    setAmplitude(0)
  }, [stopRecording])

  return {
    pipelineState,
    isOnline,
    lastTranscript,
    lastReply,
    errorMessage,
    amplitude,
    activeTtsEngine,
    conversationHistory: conversationHistory.current,
    activatePipeline,
    submitTextCommand,
    interrupt,
    requestPermission,
  }
}

/** Fallback STT using Web Speech Recognition API */
function webSpeechFallbackSTT() {
  return new Promise((resolve, reject) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      reject(new Error('No STT available'))
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-IN'
    recognition.maxAlternatives = 1
    recognition.onresult = (e) => resolve(e.results[0][0].transcript)
    recognition.onerror = () => reject(new Error('Web Speech recognition error'))
    recognition.start()
    setTimeout(() => recognition.stop(), 8000)
  })
}
