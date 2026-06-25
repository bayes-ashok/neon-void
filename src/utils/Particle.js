/**
 * Particle — a single glowing orb used in the disco animation.
 * Pure vanilla class; instantiated and managed by useDiscoCanvas hook.
 */
export class Particle {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth
    this.canvasHeight = canvasHeight
    this.reset(true)
  }

  reset(scatter = false) {
    const w = this.canvasWidth
    const h = this.canvasHeight
    this.x = scatter
      ? Math.random() * w
      : w / 2 + (Math.random() - 0.5) * 300
    this.y = scatter
      ? Math.random() * h * 0.7
      : h / 2 + (Math.random() - 0.5) * 300
    this.size    = Math.random() * 8 + 2
    this.speedX  = Math.random() * 7 - 3.5
    this.speedY  = Math.random() * 7 - 3.5
    this.hue     = Math.random() * 360
    this.life    = 160 + Math.random() * 60
    this.maxLife = this.life
  }

  update() {
    this.x    += this.speedX
    this.y    += this.speedY
    this.life -= 1.8
    if (this.life <= 0) this.reset()
  }

  draw(ctx, time) {
    ctx.save()
    ctx.globalAlpha = Math.max(0, this.life / this.maxLife)
    ctx.fillStyle   = `hsl(${(this.hue + time * 5) % 360}, 100%, 95%)`
    ctx.shadowBlur  = 35
    ctx.shadowColor = `hsl(${this.hue}, 100%, 70%)`
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  // Update canvas dimensions on resize
  setDimensions(w, h) {
    this.canvasWidth  = w
    this.canvasHeight = h
  }
}
