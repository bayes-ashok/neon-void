/**
 * useAudioEngine
 *
 * Bulletproof mobile audio strategy:
 *
 *  PRELOAD (page load, no gesture needed):
 *    XHR fetches music.mp3 into an ArrayBuffer.
 *    A temporary AudioContext pre-decodes it into an AudioBuffer so it
 *    is ready before the user ever taps. XHR is used instead of fetch()
 *    because it is more reliable inside iOS WKWebView and older Android
 *    WebViews where fetch() Promise chains can silently stall.
 *
 *  UNLOCK + PLAY (inside pointerdown — synchronous, zero async gap):
 *    1. Create a NEW AudioContext inside the gesture. A context created
 *       inside a user gesture is immediately in "running" state on every
 *       browser including iOS Safari 9–17. No .resume() call needed.
 *    2. Play a 1-sample silent buffer — hardware activation trick for
 *       Safari < 13 that stamps the context as "user activated".
 *    3. If audioBuffer is ready → spawn all 5 nodes immediately (fast path).
 *       If xhrBuffer arrived but decode isn't done → decodeAudioData with
 *       old-style callback; context already unlocked so playback works.
 *       If XHR still in flight → poll every 50 ms; context stays unlocked.
 *
 *  Returns: { preloadAudio, unlockAndPlay }
 *    preloadAudio  — call once at mount
 *    unlockAndPlay — call synchronously inside the gesture handler
 */

import { useRef } from 'react'
import { AUDIO_SRC, AUDIO_OFFSETS, INSTANCE_COUNT } from '../utils/audioConstants'

export function useAudioEngine() {
  const xhrBufferRef   = useRef(null)  // raw ArrayBuffer from XHR
  const audioBufferRef = useRef(null)  // decoded AudioBuffer
  const audioCtxRef    = useRef(null)  // created inside gesture

  // ── XHR preload ────────────────────────────────────────────────────────────
  function preloadAudio() {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', AUDIO_SRC, true)
    xhr.responseType = 'arraybuffer'

    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        console.warn('[Audio] XHR failed, status:', xhr.status)
        return
      }

      xhrBufferRef.current = xhr.response

      // Pre-decode in a temporary context — if it finishes before the tap,
      // unlockAndPlay() skips decode entirely (fastest path).
      try {
        const ACtx    = window.AudioContext || window.webkitAudioContext
        const tempCtx = new ACtx()
        // slice() clones the buffer — decodeAudioData consumes its input
        tempCtx.decodeAudioData(
          xhrBufferRef.current.slice(0),
          (decoded) => {
            audioBufferRef.current = decoded
            tempCtx.close()
            console.log('[Audio] Pre-decoded OK, duration:', decoded.duration.toFixed(2) + 's')
          },
          (err) => {
            console.warn('[Audio] Pre-decode failed, will decode at gesture time:', err)
          }
        )
      } catch (e) {
        console.warn('[Audio] Temp context creation failed:', e)
      }
    }

    xhr.onerror = () => console.warn('[Audio] XHR network error')
    xhr.send()
  }

  // ── Spawn all 5 looping nodes from a decoded AudioBuffer ──────────────────
  function spawnAllNodes(buf) {
    const audioCtx = audioCtxRef.current
    const duration = buf.duration

    for (let i = 0; i < INSTANCE_COUNT; i++) {
      try {
        const source      = audioCtx.createBufferSource()
        source.buffer     = buf
        source.loop       = true
        source.loopStart  = 0
        source.loopEnd    = duration
        source.connect(audioCtx.destination)
        // start(when=0, offset) — synchronous, no Promise, no waiting
        source.start(0, AUDIO_OFFSETS[i] % duration)
        console.log('[Audio] Node', i, 'started at offset', AUDIO_OFFSETS[i] % duration + 's')
      } catch (e) {
        console.error('[Audio] Node', i, 'failed to start:', e)
      }
    }
  }

  // ── Main unlock + play — must be called synchronously inside gesture ───────
  function unlockAndPlay() {
    // Step 1: Create AudioContext INSIDE the gesture.
    // This guarantees "running" state on iOS Safari 9–17 and Android Chrome.
    try {
      const ACtx        = window.AudioContext || window.webkitAudioContext
      audioCtxRef.current = new ACtx()
    } catch (e) {
      console.error('[Audio] AudioContext creation failed:', e)
      return
    }

    const audioCtx = audioCtxRef.current

    // Step 2: Silent 1-sample buffer — activates audio hardware on Safari < 13.
    // Completely synchronous, costs nothing.
    try {
      const silentBuf = audioCtx.createBuffer(1, 1, 22050)
      const silentSrc = audioCtx.createBufferSource()
      silentSrc.buffer = silentBuf
      silentSrc.connect(audioCtx.destination)
      silentSrc.start(0)
      silentSrc.stop(audioCtx.currentTime + 0.001)
    } catch (e) { /* non-fatal */ }

    // Step 3: Play real audio — three paths depending on preload state
    if (audioBufferRef.current) {
      // Fast path: already decoded
      spawnAllNodes(audioBufferRef.current)

    } else if (xhrBufferRef.current) {
      // Medium path: XHR done but decode not yet complete
      console.log('[Audio] Decoding from XHR buffer at gesture time...')
      try {
        audioCtx.decodeAudioData(
          xhrBufferRef.current.slice(0),
          (decoded) => {
            audioBufferRef.current = decoded
            spawnAllNodes(decoded)
          },
          (err) => console.error('[Audio] decodeAudioData failed:', err)
        )
      } catch (e) {
        console.error('[Audio] decodeAudioData threw:', e)
      }

    } else {
      // Slow path: XHR still in flight — poll until data arrives.
      // Context is already unlocked from step 1, so playback will work.
      console.warn('[Audio] XHR still in flight — polling for data...')
      const interval = setInterval(() => {
        if (audioBufferRef.current) {
          clearInterval(interval)
          spawnAllNodes(audioBufferRef.current)
        } else if (xhrBufferRef.current) {
          clearInterval(interval)
          audioCtx.decodeAudioData(
            xhrBufferRef.current.slice(0),
            (decoded) => {
              audioBufferRef.current = decoded
              spawnAllNodes(decoded)
            },
            (e) => console.error('[Audio] Late decode failed:', e)
          )
        }
      }, 50)
    }
  }

  return { preloadAudio, unlockAndPlay }
}
