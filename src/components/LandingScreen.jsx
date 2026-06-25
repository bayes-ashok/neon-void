/**
 * LandingScreen
 *
 * Renders the NEON VOID title, GET STARTED button, and sound note.
 * Handles the three-event gesture strategy for mobile audio unlock:
 *   pointerdown → primary (earliest signal, iOS Safari 13+, Android Chrome)
 *   touchstart  → fallback (iOS Safari < 13); preventDefault blocks ghost click
 *   click       → final fallback (desktop edge cases)
 *
 * onStart() is called synchronously inside each handler. The `started` ref
 * in the parent ensures only the first invocation does anything.
 */

import { useEffect, useRef } from 'react'
import styles from './LandingScreen.module.css'

export function LandingScreen({ onStart }) {
  const btnRef = useRef(null)

  useEffect(() => {
    const btn = btnRef.current
    if (!btn) return

    function handlePointerDown() {
      // Primary: fires earliest on all modern mobile browsers
      onStart()
    }

    function handleTouchStart(e) {
      // Fallback for iOS Safari < 13
      // preventDefault stops the synthetic click ~300ms later
      e.preventDefault()
      onStart()
    }

    function handleClick() {
      // Final fallback for desktop or any browser that missed the above
      onStart()
    }

    btn.addEventListener('pointerdown', handlePointerDown, { passive: true, once: true })
    btn.addEventListener('touchstart',  handleTouchStart,  { passive: false, once: true })
    btn.addEventListener('click',       handleClick,       { once: true })

    return () => {
      btn.removeEventListener('pointerdown', handlePointerDown)
      btn.removeEventListener('touchstart',  handleTouchStart)
      btn.removeEventListener('click',       handleClick)
    }
  }, [onStart])

  return (
    <div className={styles.landing}>
      <h1 className={styles.title}>NEON VOID</h1>
      <button
        ref={btnRef}
        id="start-btn"
        className={styles.startBtn}
        type="button"
      >
        GET STARTED
      </button>
      <p className={styles.soundNote}>
        🔊 TURN ON FULL SOUND FOR A BETTER EXPERIENCE
      </p>
    </div>
  )
}
