/**
 * useDiscoCanvas
 *
 * Drives the full canvas animation:
 *   - 500 glowing particles
 *   - Central radial pulse
 *   - 6 spinning laser arms
 *   - Canvas inline flash
 *   - Background hue chaos
 *   - DOM flash overlay (strobe)
 *
 * strobeIntensity ramps from 0 → 1 over ~60 seconds, escalating every
 * visual effect continuously.
 *
 * Returns: { canvasRef, flashOverlayRef, startAnimation }
 */

import { useRef, useCallback } from 'react'
import { Particle } from '../utils/Particle'

const PARTICLE_COUNT = 500
const LASER_ARMS     = 6

export function useDiscoCanvas() {
  const canvasRef       = useRef(null)
  const flashOverlayRef = useRef(null)
  const animFrameRef    = useRef(null)
  const particlesRef    = useRef([])
  const timeRef         = useRef(0)
  const strobeRef       = useRef(0)        // 0–1
  const flashIntervalRef = useRef(90)      // ms, shrinks over time
  const strobeTimerRef  = useRef(null)
  const startedRef      = useRef(false)

  // ── Canvas resize ──────────────────────────────────────────────────────────
  function resizeCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight
    // Update particle boundaries
    particlesRef.current.forEach(p =>
      p.setDimensions(canvas.width, canvas.height)
    )
  }

  // ── Init particles ─────────────────────────────────────────────────────────
  function initParticles() {
    const canvas = canvasRef.current
    if (!canvas) return
    particlesRef.current = Array.from(
      { length: PARTICLE_COUNT },
      () => new Particle(canvas.width, canvas.height)
    )
  }

  // ── DOM flash (strobe overlay) ─────────────────────────────────────────────
  function triggerDOMFlash() {
    const overlay = flashOverlayRef.current
    if (!overlay) return
    overlay.style.opacity = 0.3 + strobeRef.current * 0.7
    setTimeout(() => {
      if (overlay) overlay.style.opacity = 0
    }, 30 + Math.random() * 40)
  }

  function scheduleStrobe() {
    if (!startedRef.current) return
    triggerDOMFlash()
    if (Math.random() < strobeRef.current * 0.6) {
      setTimeout(triggerDOMFlash, 55)
    }
    flashIntervalRef.current = Math.max(22, flashIntervalRef.current - 0.5)
    const next = flashIntervalRef.current + Math.random() * flashIntervalRef.current * 0.5
    strobeTimerRef.current = setTimeout(scheduleStrobe, next)
  }

  // ── Canvas inline flash ────────────────────────────────────────────────────
  function canvasFlash(ctx, canvas) {
    const intensity = 0.15 + strobeRef.current * 0.45 + Math.random() * 0.2
    ctx.fillStyle = `rgba(255,255,255,${intensity})`
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  // ── Main animation loop ────────────────────────────────────────────────────
  function animate() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    timeRef.current++
    const time = timeRef.current

    // Ramp strobe intensity over ~60s (60fps × 3600 = 60s)
    strobeRef.current = Math.min(1, time / 3600)
    const si = strobeRef.current

    // Trail fade
    const fade = 0.30 - si * 0.15
    ctx.fillStyle = `rgba(10,3,25,${fade})`
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Particles
    particlesRef.current.forEach(p => {
      p.update()
      p.draw(ctx, time)
    })

    // Central radial pulse
    const cx    = canvas.width  / 2
    const cy    = canvas.height / 2
    const pulse = Math.sin(time * 0.32) * 90 + 170
    const grad  = ctx.createRadialGradient(cx, cy, 30, cx, cy, pulse)
    grad.addColorStop(0,   'rgba(255,20,180,0.9)')
    grad.addColorStop(0.5, 'rgba(0,200,255,0.3)')
    grad.addColorStop(1,   'transparent')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(cx, cy, pulse, 0, Math.PI * 2)
    ctx.fill()

    // Spinning laser arms
    const angle0 = (time * 0.018) % (Math.PI * 2)
    for (let i = 0; i < LASER_ARMS; i++) {
      const a   = angle0 + (i / LASER_ARMS) * Math.PI * 2
      const hue = (time * 3 + i * 60) % 360
      ctx.save()
      ctx.strokeStyle = `hsla(${hue}, 100%, 70%, ${0.35 + si * 0.3})`
      ctx.lineWidth   = 2 + si * 3
      ctx.shadowColor = `hsl(${hue}, 100%, 60%)`
      ctx.shadowBlur  = 30 + si * 40
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(
        cx + Math.cos(a) * Math.max(canvas.width, canvas.height),
        cy + Math.sin(a) * Math.max(canvas.width, canvas.height)
      )
      ctx.stroke()
      ctx.restore()
    }

    // Canvas inline flash (probability escalates)
    if (Math.random() < 0.45 + si * 0.45) canvasFlash(ctx, canvas)

    // Background hue chaos
    if (Math.random() < 0.4 + si * 0.5) {
      document.body.style.background =
        `hsl(${Math.floor(Math.random() * 360)}, 95%, ${4 + si * 4}%)`
    }

    animFrameRef.current = requestAnimationFrame(animate)
  }

  // ── Public: start everything ───────────────────────────────────────────────
  const startAnimation = useCallback(() => {
    if (startedRef.current) return
    startedRef.current = true

    resizeCanvas()
    initParticles()
    animate()
    scheduleStrobe()

    window.addEventListener('resize', resizeCanvas)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { canvasRef, flashOverlayRef, startAnimation }
}
