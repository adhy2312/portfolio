# Adhithya Mohan's Living Portfolio

Welcome to the source code of my digital consciousness. This isn't just a static portfolio or a standard digital resume—it's an interactive, living, self-aware entity built to react, remember, and evolve alongside my journey.

## 🚀 How I Built It From Scratch

My philosophy has always been *"Namakk sett aakam"* (Let's make it happen). When designing this site, I wanted it to feel cinematic, deeply technical, and undeniably human. 

### Phase 1: The Foundation & The Pipeline
I wired up a custom **React** frontend to a headless **Sanity CMS** backend. I didn't want to hardcode my accomplishments; instead, I created structured schemas for Projects, Achievements, Skills, and even my Contact info. A custom script migrated all my raw data into the cloud, ensuring my portfolio can be updated from anywhere without touching a Git repository.

### Phase 2: Aesthetics vs. Hardware
I started with heavy visual effects like "Liquid Glass" and SVG `feTurbulence` for digital sensor grain, but it was mining GPU power on scroll. I refactored it, replacing the heavy math with microscopic CSS linear gradients and hardware-accelerated `translate3d` layering. The result is a buttery smooth 60fps experience that still looks cinematic.

### Phase 3: Making It Rain
I integrated the OpenWeatherMap API to fetch the real-time weather in Thiruvananthapuram, Kerala. If it's raining in my city, a custom HTML5 Canvas physics engine (`RainDroplets.js`) simulates water droplets sliding down the glass of the navbar on your screen.

### Phase 4: Spotify Integration
To share my late-night coding vibes, I built a "Now Playing" widget using the Spotify Web API. Because access tokens expire every hour, I wrote a Vercel serverless function (`api/spotify.js`) to securely refresh the token on the fly. You can even click the widget to hear a 30-second audio preview of what I'm listening to.

### Phase 5: The Digital Consciousness
I realized a perfect machine feels empty, so I built a soul. 
- **Late Night Loneliness Mode**: If you visit between 11 PM and 5 AM, the entire CSS shifts. The site desaturates, the breathing animations slow down, and the atmosphere becomes quiet and exhausted.
- **The Digital Soul**: A tiny, faintly glowing orb watches your cursor. If you stay still, it approaches you. As you interact more with the site, its "Trust Level" increases until it rests comfortably on your cursor.
- **Digital Scars**: Instead of a standard GitHub stats section, I built a graveyard of my failures and broken code, acknowledging that engineering is built on mistakes.
- **Haptic Engine**: Provides physical tactile feedback on mobile devices using the `navigator.vibrate` API when interacting with the UI, which actively scales back if your device's battery drops to preserve energy.
- **Immersive Engine**: Amplifies the visual experience by tying the biological "Heartbeat" and "Adrenaline" levels of the visitor to CSS variables in real-time, completely shifting atmospheric hues and dimming the UI based on systemic fatigue.

### Phase 6: Mini-Adhy (The AI Twin)
I integrated the Google Gemini API to create "Mini-Adhy", a floating AI chatbot that thinks and speaks like me. To make it smart, it dynamically fetches my entire life history from the Sanity CMS and injects it into its system prompt. When I hit API token limits, I wrote an intelligent slicing algorithm to compress the persona and feed it only the most recent conversation context, saving 70% in token usage.

---

## 🧠 The Backend Pipeline System

- **Frontend Core**: React 19, Framer Motion 12, Three.js
- **Symbiotic Architecture**: A single unified RAF loop (`NervousSystem.js`), a Web Worker for psychological processing (`LifeEngine`), a hardware-aware `HapticEngine`, and an `ImmersiveEngine` driving raw CSS root variables.
- **Content Management**: Sanity CMS (Headless data architecture)
- **Serverless API**: Vercel Serverless Functions
- **AI Engine**: Google Gemini API (with rate-limit backoffs and dynamic context injection)
- **External APIs**: Spotify Web API (OAuth), OpenWeatherMap API

---

## 🕵️‍♂️ Hidden Features & Secrets

This portfolio is meant to be explored. Here are the hidden things you can find:

### The CLI / Language Terminal Code Words
Open the terminal widget and type any of these commands:
- `help`, `about`, `skills`, `contact`, `ping`, `date`, `whoami`, `ls`, `clear`
- `sudo rm -rf /` (Nice try)
- `party` (Activates party lights)
- `gravity` (Disables the physics engine, making the UI fall apart)
- `barrelroll` (Does a literal barrel roll)
- `matrix` (Triggers digital rain)
- `zoomout` (Shrinks to the quantum realm)
- `vibe`, `coffee`, `thanos` (Half the DOM turns to dust)
- `glitch`, `rickroll`, `konami`, `adhy`
- `tictactoe` / `game` (Launches the hidden Tic-Tac-Toe / Zip Game)



### Easter Eggs
- **The Konami Code**: Type `↑ ↑ ↓ ↓ ← → ← → B A` anywhere on the site.
- **The Logo Game**: Click the "ADHY" logo in the navbar exactly 5 times to trigger a hidden game against an AI.
- **X-Ray Mode**: Click the small activity icon in the navbar. It strips away CSS to reveal bare DOM wireframes and pops up green terminal tooltips explaining the underlying tech stack of each component.
- **The Seed of Life (Digital Permanence)**: At the bottom of the footer is a tiny digital seed. It mathematically calculates its age from the site's genesis date. Over 5 real-world years, it will grow from a seed into a mature Mango tree. (Hint: Click it 4 times consecutively to rapidly age it by 1 year).
- **Battery Symbiosis**: The site uses the `navigator.getBattery()` API. If your device drops below 20% battery, the portfolio will intentionally strip away heavy background animations and drop into a pitch-black void to help you save power.
- **The Hive Mind**: A dedicated dock button that opens a sensory HUD, allowing you to see the AI's internal state, active location, and system variables in real-time.

---

*Built with late-night coding sessions, caffeine, and absolute passion in Kerala.*
