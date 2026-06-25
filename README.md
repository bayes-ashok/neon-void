# NEON VOID — React

A fullscreen rave/disco experience with layered audio chaos, particle systems,
spinning laser arms, and an escalating strobe effect.

---

## Project Structure

```
neon-void/
├── index.html                      # Vite entry, Google Fonts, viewport
├── vite.config.js                  # Vite + React plugin config
├── package.json
│
├── public/
│   └── music.mp3                   # ← PUT YOUR AUDIO FILE HERE
│
└── src/
    ├── main.jsx                    # React root mount
    ├── App.jsx                     # Orchestrator: audio + canvas + screen swap
    │
    ├── components/
    │   ├── LandingScreen.jsx       # Title, GET STARTED button, gesture handlers
    │   ├── LandingScreen.module.css
    │   ├── DiscoScreen.jsx         # Canvas + flash overlay
    │   └── DiscoScreen.module.css
    │
    ├── hooks/
    │   ├── useAudioEngine.js       # Bulletproof mobile audio (XHR + Web Audio API)
    │   └── useDiscoCanvas.js       # Canvas animation loop (particles, lasers, strobe)
    │
    ├── utils/
    │   ├── audioConstants.js       # AUDIO_SRC, OFFSETS, INSTANCE_COUNT
    │   └── Particle.js             # Particle class (pure canvas, no React)
    │
    └── styles/
        └── global.css              # CSS reset, :root vars, body/html base
```

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Add your audio file

Place `music.mp3` inside the `public/` folder:

```
public/music.mp3
```

The path is configured in `src/utils/audioConstants.js`:

```js
export const AUDIO_SRC = '/music.mp3'
```

### 3. Run locally

```bash
npm run dev
```

Opens at `http://localhost:3000`

### 4. Build for production

```bash
npm run build
npm run preview   # preview the production build locally
```

---

## Audio System

`useAudioEngine` uses the **Web Audio API** with a bulletproof mobile strategy:

**Preload (page load, no gesture)**
- XHR loads `music.mp3` into an `ArrayBuffer` immediately
- A temporary `AudioContext` pre-decodes it into an `AudioBuffer`
- By the time the user taps, audio is ready to play with zero delay

**Unlock + Play (synchronously inside `pointerdown`)**
1. New `AudioContext` created *inside* the gesture — immediately `running` on iOS
2. Silent 1-sample buffer played — activates hardware on Safari < 13
3. 5 `AudioBufferSourceNode`s started at offsets `[0, 1, 2, 3, 4]` seconds
4. Each node loops forever — creates a layered, echoing rave soundscape

**Fallback paths**
- XHR arrived but decode not done → `decodeAudioData` callback; context already unlocked
- XHR still in flight → polls every 50ms; plays when data arrives

**Event strategy**
- `pointerdown` — primary (fires 50–300ms before `click` on mobile)
- `touchstart` — fallback for iOS Safari < 13 (with `preventDefault`)
- `click` — final fallback for desktop

---

## Visual System

`useDiscoCanvas` drives a `requestAnimationFrame` loop:

| Effect | Detail |
|---|---|
| Particles | 500 glowing orbs, hue-shifted per frame |
| Radial pulse | Central gradient bloom, sine-animated radius |
| Laser arms | 6 spinning beams with glow, rotating from center |
| Canvas flash | White fill at escalating opacity/frequency |
| DOM strobe | Flash overlay div toggled at up to ~45 Hz |
| BG chaos | `document.body.background` hue randomised per frame |

`strobeIntensity` ramps 0 → 1 over ~60 seconds, escalating every effect.

---

## Customisation

| What | Where |
|---|---|
| Audio file path | `src/utils/audioConstants.js` → `AUDIO_SRC` |
| Number of audio layers | `src/utils/audioConstants.js` → `AUDIO_OFFSETS` |
| Particle count | `src/hooks/useDiscoCanvas.js` → `PARTICLE_COUNT` |
| Laser arm count | `src/hooks/useDiscoCanvas.js` → `LASER_ARMS` |
| Strobe ramp speed | `src/hooks/useDiscoCanvas.js` → `time / 3600` divisor |
| Colours / fonts | `src/styles/global.css` → `:root` vars |
