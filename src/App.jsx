/**
 * App
 *
 * Orchestrates the two screens and wires the audio + canvas systems together.
 *
 * Execution order on first gesture:
 *  1. unlockAndPlay()   — audio starts, synchronous, inside gesture call stack
 *  2. requestFullscreen — async internally; audio already running
 *  3. startAnimation()  — canvas loop + strobe begin
 *  4. setStarted(true)  — React re-render swaps LandingScreen → DiscoScreen
 *  5. beforeunload guard — prevents accidental navigation away
 */

import { useState, useCallback, useEffect } from 'react'
import { LandingScreen } from './components/LandingScreen'
import { DiscoScreen }   from './components/DiscoScreen'
import { useAudioEngine } from './hooks/useAudioEngine'
import { useDiscoCanvas } from './hooks/useDiscoCanvas'

export default function App() {
  const [started, setStarted] = useState(false)

  const { preloadAudio, unlockAndPlay } = useAudioEngine()
  const { canvasRef, flashOverlayRef, startAnimation } = useDiscoCanvas()

  // Kick off XHR preload immediately at mount — no gesture needed for network I/O
  useEffect(() => {
    preloadAudio()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Guard: only the very first invocation does anything
  const startedRef = useCallback(() => {
    // using a module-level flag avoids stale closure issues
  }, [])

  const handleStart = useCallback(() => {
    // Already started — no-op (handles duplicate events from pointer/touch/click)
    if (started) return

    // ① AUDIO — must be the very first thing, synchronously inside the gesture
    unlockAndPlay()

    // ② Fullscreen request (async internally — audio already unlocked above)
    try {
      document.documentElement.requestFullscreen?.()
    } catch (_) { /* non-critical */ }

    // ③ Canvas animation
    startAnimation()

    // ④ Flip to disco screen
    setStarted(true)

    // ⑤ Exit blocker
    window.addEventListener('beforeunload', (e) => {
      e.preventDefault()
      e.returnValue = ''
    }, { once: true })
  }, [started, unlockAndPlay, startAnimation])

  return (
    <>
      {!started && <LandingScreen onStart={handleStart} />}
      {/* DiscoScreen is always mounted once started so canvas ref stays valid */}
      {started  && (
        <DiscoScreen
          canvasRef={canvasRef}
          flashOverlayRef={flashOverlayRef}
        />
      )}
    </>
  )
}
