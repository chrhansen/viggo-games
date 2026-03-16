# Gunny

Browser 3D space shooter. Kid-friendly prototype. Third-person camera. Fly past Earth and the moon. Blast raiders. Dodge satellites.

## What The Game Is

You pilot one ship through open space while the camera follows from behind. Enemy raiders spawn ahead and fire back. Satellites drift through the sector as moving obstacles. The mission ends when you destroy enough raiders or your hull reaches zero.

## How It Functions

### Mission loop

1. Launch mission.
2. Ship moves forward through space automatically.
3. You steer left, right, up, down.
4. You fire at incoming raiders.
5. Raiders and satellites spawn ahead of you and move into your flight path.
6. Score goes up when raiders are destroyed.
7. Mission clears after `12` raider kills.
8. Mission fails if hull reaches `0%`.

### Combat + damage

- Player shots travel forward from the ship nose.
- Raiders take `2` hits each.
- Raider collisions damage the hull.
- Satellite collisions damage the hull.
- Raider shots damage the hull.
- Hull and score update live in the HUD.

### World motion

- Ship flies continuously forward.
- Camera trails behind and gently follows steering.
- Starfield scrolls with motion.
- Earth stays nearby with cloud layer, atmosphere glow, and night-light detail.
- Moon stays in view with crater texture.

## Features

- Third-person 3D browser flight.
- Earth, moon, stars, fog, cinematic lighting.
- Forward fill lighting keeps raiders and satellites readable in-flight.
- Detailed player ship, raider ships, and satellites.
- Procedural textures for planets and solar panels.
- HUD for hull, score, kills, and distance.
- Start screen and restart flow.
- Keyboard, mouse, and touch controls.
- Mobile-friendly touch buttons.

## Controls

- `WASD` or arrow keys: steer
- `Space`: fire
- Hold mouse button: fire
- Touch buttons: steer + fire

## Run Locally

```bash
npm install
npm run dev
```

Open the local Vite URL in a browser. Default: `http://localhost:5173/`.

## Build

```bash
npm run build
```

## Tech

- Vite
- Three.js
- Plain JS modules
- CSS HUD + overlays
- Procedural canvas textures, no external art assets

## Project Shape

- `src/game.js`: renderer, scene setup, DOM wiring
- `src/mission-runtime.js`: gameplay loop, spawning, combat, damage
- `src/entities.js`: ship, raider, satellite, planet builders
- `src/procedural-textures.js`: Earth, moon, solar panel texture generation
- `src/style.css`: HUD and menu styling

## Current Scope

Prototype slice. No sound, no levels, no save system, no multiplayer, no asset pipeline yet.
