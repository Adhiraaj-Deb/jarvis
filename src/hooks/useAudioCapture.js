/**
 * useAudioCapture.js
 * Manages microphone access and audio recording.
 * Records audio after wake word fires, stops on silence or max duration.
 * Returns a Blob suitable for Deepgram.
 */

import { useRef, useCallback } from 'react'

const SILENCE_THRESHOLD = 0.01    // RMS below this = silence
const SILENCE_DURATION_MS = 1500  // Stop after 1.5s of silence
const MAX_RECORD_MS = 10000       // Never record more than 10s

export function useAudioCapture() {
  const streamRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const silenceTimerRef = useRef(null)
  const analyserNodeRef = useRef(null)
  const audioCtxRef = useRef(null)
  const animFrameRef = useRef(null)
  const maxTimerRef = useRef(null)

  /** Request mic permission once */
  const requestPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      streamRef.current = stream
      return true
    } catch (err) {
      console.error('Microphone permission denied:', err)
      return false
    }
  }, [])

  /**
   * Start recording. Automatically stops on silence or max duration.
   * @param {function} onDataAvailable - called with final Blob
   * @param {function} onStop - called when recording ends
   * @param {function} onAmplitude - called with current RMS (0-1) for waveform
   */
  const startRecording = useCallback(async (onDataAvailable, onStop, onAmplitude) => {
    // Get fresh stream if needed
    if (!streamRef.current || !streamRef.current.active) {
      const ok = await requestPermission()
      if (!ok) {
        onStop?.('permission_denied')
        return
      }
    }

    chunksRef.current = []

    // Set up AudioContext analyser for silence detection
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      const audioCtx = new AudioContext({ sampleRate: 16000 })
      const source = audioCtx.createMediaStreamSource(streamRef.current)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 512
      source.connect(analyser)
      audioCtxRef.current = audioCtx
      analyserNodeRef.current = analyser
    }
    
    if (audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume()
    }

    const analyser = analyserNodeRef.current

    // Set up MediaRecorder
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm'

    const recorder = new MediaRecorder(streamRef.current, { mimeType })
    mediaRecorderRef.current = recorder

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = () => {
      clearTimeout(silenceTimerRef.current)
      clearTimeout(maxTimerRef.current)
      cancelAnimationFrame(animFrameRef.current)
      // We no longer close the audioCtx here, we keep it alive for the next recording
      // audioCtx.close()

      const blob = new Blob(chunksRef.current, { type: mimeType })
      chunksRef.current = []
      onDataAvailable?.(blob)
      onStop?.('complete')
    }

    recorder.start(100) // collect chunks every 100ms

    // Silence detection loop
    const dataArray = new Uint8Array(analyser.frequencyBinCount)

    function checkSilence() {
      analyser.getByteTimeDomainData(dataArray)
      // Compute RMS
      let sum = 0
      for (let i = 0; i < dataArray.length; i++) {
        const v = (dataArray[i] - 128) / 128
        sum += v * v
      }
      const rms = Math.sqrt(sum / dataArray.length)
      onAmplitude?.(rms)

      if (rms < SILENCE_THRESHOLD) {
        if (!silenceTimerRef.current) {
          silenceTimerRef.current = setTimeout(() => {
            stopRecording()
          }, SILENCE_DURATION_MS)
        }
      } else {
        // Reset silence timer on sound
        clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = null
      }

      animFrameRef.current = requestAnimationFrame(checkSilence)
    }

    checkSilence()

    // Hard stop after max duration
    maxTimerRef.current = setTimeout(() => {
      stopRecording()
    }, MAX_RECORD_MS)
  }, [requestPermission])

  const stopRecording = useCallback(() => {
    clearTimeout(silenceTimerRef.current)
    clearTimeout(maxTimerRef.current)
    silenceTimerRef.current = null
    maxTimerRef.current = null
    cancelAnimationFrame(animFrameRef.current)

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  const releaseStream = useCallback(() => {
    stopRecording()
    if (audioCtxRef.current) {
      audioCtxRef.current.close()
      audioCtxRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [stopRecording])

  return { requestPermission, startRecording, stopRecording, releaseStream }
}
