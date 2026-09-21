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

- Player shots travel forward from the ship nose; raider shots also originate at their forward muzzle.
- Raiders take `2` hits each.
- Raider collisions damage the hull.
- Satellite collisions damage the hull.
- Raider shots damage the hull.
- Destroyed raiders release a short expanding blast. Each blast can damage your hull once, with less damage near its edge. Steer away before reaching it; the final kill's blast must clear before victory.
- Explosions use turbulent glowing particles, spark trails, and tumbling fragments that cool and fade. A brief flash lights nearby ships. Small weapon impacts use shorter bursts; visual debris lasts longer than the unchanged 0.7-second damage window.
- Hull and score update live in the HUD.
- At a displayed 10% hull or less, the entire Hull readout pulses red and a short beep repeats once per second during play. Audio starts through the launch gesture and stays silent while the game is unfocused; reduced-motion users see a steady red highlight.

### World motion

- Ship flies continuously forward.
- Camera trails behind and gently follows steering.
- A fixed pool of nearby stars recycles behind the camera to ahead of the ship, indefinitely. Perspective makes nearby stars move faster; distant stars stay in a separate background layer.
- Earth has mapped continents, ocean reflections, polar ice, cloud shadows, night-side city lights, and a thin sunlit atmosphere. Its tilted surface turns once every 30 minutes. Clouds and their shadows turn with the surface and are blended in the same opaque shader, avoiding closely overlapping cloud geometry on mobile GPUs.
- The cratered Moon orbits Earth once every four minutes and keeps the same face toward Earth. Orbit distances and time scales are compressed for gameplay; this is not an astronomical simulation. The pair stays camera-relative during flight and reframes for portrait screens.

## Features

- Third-person 3D browser flight.
- Earth, orbiting moon, soft stars, sunlit shading, and engine glow against dark space.
- Forward fill lighting keeps raiders and satellites readable in-flight.
- Ivory interceptor with a contoured fuselage, swept wings, framed glass cockpit, vented equipment panels, and recessed twin engines. Raiders use red armor and a distinct forward-swept wing shape.
- Satellites have exposed blue solar cells in open frames, gold thermal blankets, radiator panels, a curved dish and feed supports, camera optics, and antennas. They tumble slowly through space.
- Metal and glass reflect a generated Sun/Earth lighting environment. Engine flicker affects exhaust only; damage flashes are isolated to the player.
- Static model parts are batched by material and shared between spawns to keep draw calls and allocations low.
- Compact dismissible mission card leaves more screen space for play. On touch devices and narrow screens it automatically closes five seconds after launch; the × button still closes it immediately.
- Locally bundled Earth and Moon imagery; procedural solar panels and glow textures.
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

`npm test --workspace gunny` runs the starfield, blast, orbit, spacecraft, effect-cleanup, and mobile help/hull-warning checks. The root `npm test` includes them too. `npm run build` at the root bundles all five games, including `dist/games/gunny/` and the planet images. Do not copy or commit generated bundles.

## Tech

- Vite
- Three.js
- Plain JS modules
- CSS HUD + overlays
- Local planet maps from [Solar System Scope](https://www.solarsystemscope.com/textures/) under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); see [asset credits](assets/README.md)
- Procedural data textures and GPU particle shaders; no new dependencies

## Project Shape

- `src/game.js`: renderer, scene setup, DOM wiring
- `src/mission-runtime.js`: gameplay loop, spawning, combat, damage
- `src/flight-effects.js`: nearby star recycling and raider blast damage
- `src/hull-warning.js`: low-hull warning sound
- `src/entities.js`: star/projectile builders and craft exports
- `src/spacecraft.js`, `src/satellite.js`: fighter, raider, and satellite models
- `src/vehicle-geometry.js`, `src/vehicle-materials.js`: model geometry, batching, surface materials, and reflections
- `src/planets.js`: Earth, cloud, atmosphere, and Moon shaders
- `src/planet-motion.js`: rotation, lunar orbit, and screen framing
- `src/explosions.js`: fire particles, sparks, debris, and GPU cleanup
- `src/procedural-textures.js`, `src/glow-texture.js`: solar cells, thermal foil, hull panels, and glow textures
- `src/style.css`: HUD and menu styling

## Current Scope

Prototype slice. Low-hull warning sound only; no levels, no save system, no multiplayer.
