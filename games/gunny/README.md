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
- Destroyed raiders release a short expanding blast. Each blast can damage your hull once, with less damage near its edge. Steer away before reaching it; the final kill's blast must clear before victory.
- Hull and score update live in the HUD.
- At 10% hull or less, the percentage pulses red and a short beep repeats once per second during play. Audio starts through the launch gesture and stays silent while the game is unfocused; reduced-motion users see steady red.

### World motion

- Ship flies continuously forward.
- Camera trails behind and gently follows steering.
- A fixed pool of nearby stars recycles behind the camera to ahead of the ship, indefinitely. Perspective makes nearby stars move faster; distant stars stay in a separate background layer.
- Earth stays nearby with cloud layer, atmosphere glow, and night-light detail.
- Moon stays in view with crater texture.

## Features

- Third-person 3D browser flight.
- Earth, moon, stars, fog, cinematic lighting.
- Forward fill lighting keeps raiders and satellites readable in-flight.
- Detailed player ship, raider ships, and satellites.
- Compact dismissible mission card leaves more screen space for play.
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
- All buttons disable text selection and iOS long-press callouts.

## Run and verify

From the repository root:

```sh
npm ci
npm run dev
```

Open `http://localhost:8080/games/gunny/`. A standalone server is available with `npm run dev --workspace gunny -- --host 127.0.0.1 --port 4175`.

`npm test --workspace gunny` runs the lightweight starfield, blast, and hull-warning checks. The root `npm test` includes them too. `npm run build` at the root bundles all five games, including `dist/games/gunny/`. Do not copy or commit generated bundles.

## Tech

- Vite
- Three.js
- Plain JS modules
- CSS HUD + overlays
- Procedural canvas textures, no external art assets

## Project Shape

- `src/game.js`: renderer, scene setup, DOM wiring
- `src/mission-runtime.js`: gameplay loop, spawning, combat, damage
- `src/flight-effects.js`: nearby star recycling and raider blast damage
- `src/hull-warning.js`: low-hull warning sound
- `src/entities.js`: ship, raider, satellite, planet builders
- `src/procedural-textures.js`: Earth, moon, solar panel texture generation
- `src/style.css`: HUD and menu styling

## Current Scope

Prototype slice. Low-hull warning sound only; no levels, no save system, no multiplayer, no asset pipeline yet.
