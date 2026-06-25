/**
 * DiscoScreen
 *
 * Renders the canvas and the white flash overlay used for strobe effects.
 * Refs are forwarded from useDiscoCanvas so the hook has direct DOM access
 * without going through React's render cycle (critical for 60fps canvas).
 */

import styles from './DiscoScreen.module.css'

export function DiscoScreen({ canvasRef, flashOverlayRef }) {
  return (
    <div className={styles.disco}>
      <div className={styles.bgLayer} />
      <canvas ref={canvasRef} className={styles.canvas} />
      <div ref={flashOverlayRef} className={styles.flashOverlay} />
    </div>
  )
}
