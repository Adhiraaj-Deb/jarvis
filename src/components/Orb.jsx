/**
 * Orb.jsx
 * The central animated orb — the primary visual of Jarvis.
 * States: dormant, activated, listening, processing, speaking, error
 */

import { useEffect, useRef } from 'react'
import { PIPELINE_STATES } from '../hooks/usePipeline.js'

const STATE_CONFIG = {
  [PIPELINE_STATES.DORMANT]: {
    glow: 'rgba(30, 130, 255, 0.3)',
    core: 'rgba(40, 90, 220, 0.9)',
    ring: 'rgba(80, 150, 255, 0.5)',
    pulse: '4s',
    label: 'dormant',
  },
  [PIPELINE_STATES.ACTIVATED]: {
    glow: 'rgba(0, 200, 255, 0.6)',
    core: 'rgba(0, 160, 255, 0.95)',
    ring: 'rgba(0, 220, 255, 0.7)',
    pulse: '0.4s',
    label: 'activated',
  },
  [PIPELINE_STATES.LISTENING]: {
    glow: 'rgba(0, 230, 160, 0.5)',
    core: 'rgba(0, 190, 130, 0.9)',
    ring: 'rgba(0, 255, 180, 0.6)',
    pulse: '0.8s',
    label: 'listening',
  },
  [PIPELINE_STATES.PROCESSING]: {
    glow: 'rgba(180, 100, 255, 0.5)',
    core: 'rgba(140, 80, 230, 0.9)',
    ring: 'rgba(200, 130, 255, 0.5)',
    pulse: '1s',
    label: 'processing',
  },
  [PIPELINE_STATES.SPEAKING]: {
    glow: 'rgba(0, 180, 255, 0.5)',
    core: 'rgba(0, 140, 220, 0.9)',
    ring: 'rgba(80, 200, 255, 0.6)',
    pulse: '0.6s',
    label: 'speaking',
  },
  [PIPELINE_STATES.ERROR]: {
    glow: 'rgba(255, 60, 60, 0.5)',
    core: 'rgba(200, 40, 40, 0.9)',
    ring: 'rgba(255, 100, 100, 0.5)',
    pulse: '0.3s',
    label: 'error',
  },
}

export default function Orb({ state, amplitude = 0, onClick }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const timeRef = useRef(0)
  const currentStateRef = useRef(state)
  const amplitudeRef = useRef(amplitude)

  useEffect(() => {
    currentStateRef.current = state
  }, [state])

  useEffect(() => {
    amplitudeRef.current = amplitude
  }, [amplitude])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    function draw(timestamp) {
      timeRef.current = timestamp / 1000
      const t = timeRef.current
      const s = currentStateRef.current
      const amp = amplitudeRef.current

      const W = canvas.width
      const H = canvas.height
      const cx = W / 2
      const cy = H / 2
      const baseR = Math.min(W, H) * 0.28

      ctx.clearRect(0, 0, W, H)

      const cfg = STATE_CONFIG[s] || STATE_CONFIG[PIPELINE_STATES.DORMANT]

      // Calculate pulse scale
      let pulseSpeed = 1 / parseFloat(cfg.pulse)
      let scale = 1 + 0.06 * Math.sin(t * pulseSpeed * Math.PI * 2)

      // Listening: waveform ripple
      if (s === PIPELINE_STATES.LISTENING || s === PIPELINE_STATES.SPEAKING) {
        scale = 1 + 0.06 * Math.sin(t * 4) + amp * 0.5
      }

      const r = baseR * scale

      // === Outer glow rings ===
      for (let i = 3; i >= 1; i--) {
        const ringR = r * (1 + i * 0.18)
        const alpha = (0.15 / i) * (s === PIPELINE_STATES.DORMANT ? 0.4 : 1)
        const gradient = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, ringR)
        gradient.addColorStop(0, cfg.glow.replace(/[\d.]+\)$/, `${alpha})`))
        gradient.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.arc(cx, cy, ringR, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()
      }

      // === Processing spinner ===
      if (s === PIPELINE_STATES.PROCESSING) {
        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(t * 3)
        ctx.strokeStyle = cfg.ring
        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.arc(0, 0, r * 1.15, 0, Math.PI * 1.5)
        ctx.stroke()
        ctx.restore()
      }

      // === Ring border ===
      ctx.beginPath()
      ctx.arc(cx, cy, r * 1.05, 0, Math.PI * 2)
      ctx.strokeStyle = cfg.ring
      ctx.lineWidth = 2
      ctx.stroke()

      // === Core sphere gradient ===
      const grad = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.25, r * 0.05, cx, cy, r)
      grad.addColorStop(0, 'rgba(220,240,255,0.95)')
      grad.addColorStop(0.3, cfg.core)
      grad.addColorStop(1, cfg.glow)

      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fillStyle = grad
      ctx.fill()

      // === Listening waveform bars ===
      if ((s === PIPELINE_STATES.LISTENING || s === PIPELINE_STATES.SPEAKING) && amp > 0.005) {
        const bars = 24
        ctx.save()
        ctx.translate(cx, cy)
        for (let i = 0; i < bars; i++) {
          const angle = (i / bars) * Math.PI * 2
          const barAmp = amp * 80 + 10 * Math.sin(t * 8 + i * 0.5)
          const innerR = r * 1.1
          ctx.strokeStyle = cfg.ring
          ctx.lineWidth = 2.5
          ctx.lineCap = 'round'
          ctx.beginPath()
          ctx.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR)
          ctx.lineTo(Math.cos(angle) * (innerR + barAmp), Math.sin(angle) * (innerR + barAmp))
          ctx.stroke()
        }
        ctx.restore()
      }

      // === Inner highlight sparkle ===
      ctx.beginPath()
      ctx.arc(cx - r * 0.28, cy - r * 0.28, r * 0.12, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.fill()

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  return (
    <div
      className="orb-container"
      onClick={onClick}
      title={state === PIPELINE_STATES.DORMANT ? 'Click to activate Jarvis' : 'Click to interrupt'}
    >
      <canvas
        ref={canvasRef}
        width={320}
        height={320}
        className="orb-canvas"
      />
    </div>
  )
}
