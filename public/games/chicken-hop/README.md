# Chicken Hop: House Run

Tiny browser game. Keyboard + touch. No build step.

## Play

1. Open `index.html` in a browser.
2. Press `Enter` (or tap `Tap to start` on touch devices).

If your browser blocks audio when opened from a file, run a local server:

```bash
cd /Users/chrh/dev/chicken-hop
python3 -m http.server 5173
```

Then open `http://localhost:5173`.

## Deployment

- Production URL (custom domain): `https://viggo.games`
- GitHub Pages URL: `https://chrhansen.github.io/chicken-hop/` (redirects to `https://viggo.games/`)
- Hosting: GitHub Pages
- Deployment: GitHub Actions workflow at `.github/workflows/pages.yml`
- Trigger: every push to `main` (or manual `workflow_dispatch`)
- Flow: checkout -> configure Pages -> upload repo as artifact -> deploy with `actions/deploy-pages`
- Custom domain: GitHub Pages is configured to serve this project on `viggo.games`

## Controls

- Move: `Left/Right` or `A/D`
- Jump: `Space` (or tap `Up` / `W`)
- Fly (5s): hold `Up` / `W`
- Speed: `1` slow-mo, `2` normal, `3` fast
- Drop from shelves: `Down` or `S`
- Pause: `P`
- Restart: `R`

Touch controls (auto-shown on phone/tablet):
- `◀` / `▶`: move
- `▲`: jump, hold to fly
- `▼`: drop from shelf/step
- `Pause`: pause/resume
- `Restart`: restart run
- Overlay CTA button: tap to start/continue/retry

## Game Rules

- The chicken runs inside a house lane. World scrolls right-to-left.
- Obstacles are solid blocks you can jump onto.
- Shelves/steps are one-way platforms you can stand on, then drop from.

## Lives / Health

- You start with 2 lives (2 hearts).
- Each heart has 100 health.
- Running into an obstacle from the front drains health.
- When a heart hits 0, you lose a life and continue on the next heart.
- When both hearts are empty: game over.

Obstacle safety rules:
- Landing on top of an obstacle is safe (no damage).
- Damage triggers only when colliding from the front/side in the running path.

## Corn / Eggs / Score

HUD values:
- `Corn`: your corn counter (what eggs reduce, what corn increases).
- `Score`: distance score + corn bonus.
- `Best`: best `Score` saved in your browser.

Corn:
- Regular corn pickup: `+1 Corn`, `+60 Score`.
- Giant gold corn pickup (rare, higher up): `+3 Corn`, `+180 Score`.

Eggs:
- Eggs sit on the floor.
- If you run into an egg: `-1 Corn` (min 0).
- Eggs do not affect health.

## Flight

- Tap `Up/W`: normal jump (like before).
- Hold `Up/W` while airborne: flight starts after a short hold.
- While flying you drift upward while the key is held.
- Flight fuel: 5 seconds max per charge.
- Refuel: land on the ground and wait ~0.75s after the last flight moment, then fuel refills to 5 seconds.

## Shelves / Stairs

- Plateau shelves spawn at a constant height.
- Stair runs connect floor <-> plateau.
- Steps are connected visually and function as small one-way platforms.
- Drop through shelves/steps with `Down/S`.

## Code Map

- `index.html`
  - Canvas + HUD + overlay UI.
  - Start screen inputs: chicken name, design, color.
- `styles.css`
  - UI styling only.
- `game.js`
  - Everything else: input, state, physics, spawning, collisions, render, audio.

## How The Code Fits Together (`game.js`)

Main loop:
- `frame()` uses `requestAnimationFrame`.
- Each frame: `update(dt)` then `render()`.

Input:
- `keydown/keyup` maintain `keys` set.
- Touch buttons maintain a parallel `touchState` (`left/right/jump/down`) with multi-touch pointer tracking.
- `P` or touch `Pause` toggles pause, clears keyboard + touch input to avoid stuck movement.
- `R` resets run.
- `Enter` or overlay CTA starts from title/gameover.

State (high level):
- `state.mode`: `title` | `playing` | `paused` | `gameover`
- `state.score`: distance + bonus points
- `state.best`: saved best score (`localStorage` key `chicken_hop_best_v1`)
- `state.corn`: corn counter
- `state.hearts`: `[hp1, hp2]` with smoothing for heart fill
- `state.flyFuel`: flight fuel (0..5 seconds) + `flyRefuelCd`
- `state.name`, `state.design`, `state.color`: customization (saved)

World:
- `world.floorY`, `world.leftBound`, `world.rightBound`: computed from canvas each update
- `world.scroll`: used for parallax/pattern motion in `drawRoom()`

Entities:
- `player`: position/velocity, jump buffer/coyote time, invuln timer, platform grounding, flight hold timer
- `obstacles[]`: blocks that scroll left; can be stood on; damage only from front
- `platforms[]`: shelves and steps (one-way platforms)
- `pickups[]`: corn objects
  - `kind: 'corn' | 'big'`
  - `value: 1 | 3`
- `eggs[]`: floor hazards; smash on contact; reduce `Corn`
- `particles[]`: feathers/dust/yolk

Spawning:
- Obstacles spawn in "chunks" (1-2) with a forced landing gap between chunks.
- Shelves/stairs spawn in readable segments between obstacle runs.
- Eggs spawn mostly during breaks.
- Giant corn spawns rarely (and higher than regular corn).

Collisions (order matters):
- One-way platform landing check (steps/shelves).
- Safe landing on obstacles (top surface).
- Floor landing.
- Obstacle damage check (front-only; skip if standing on that obstacle).
- Pickup collection (corn adds; eggs subtract corn and smash).

Rendering:
- `render()` order:
  - `drawRoom()`
  - `drawPlatforms()`
  - `drawEggs()`
  - `drawPickups()`
  - `drawObstacles()`
  - `drawPlayer()`
  - `drawParticles()`
  - `drawNameTag()`
  - `drawForeground()`

Audio:
- WebAudio synth in `Sfx`.
- Uses a resume queue so sounds fire reliably after the first user gesture.
- Cluck SFX: holding right clucks faster, holding left clucks slower.

Persistence (`localStorage`):
- `chicken_hop_best_v1`: best score
- `chicken_hop_name_v1`: chicken name
- `chicken_hop_look_v1`: `{ design, color }`

## Tuning Cheatsheet

Useful knobs in `game.js`:
- Jump/feel: `world.gravity`, `world.jumpVel`
- Flight: `state.flyFuelMax`, `state.flyRefuelDelay`, flight target vy in `isFlying` block
- Damage: `hurt(obstacle, amount = 12)` amount + `player.invuln`
- Lives: `state.heartsMax` and initialization in `resetRun()`
- Obstacle fairness: spawner section in `update(dt)`
- Plateau height: `world.plateauLift`
- Egg frequency: `eggSpawner.cd` range and spawn chance
- Giant corn rarity: `spawnBigCorn()` calls near obstacle/shelf spawns

## Chicken Name

Type a name on the start screen (or hit Random). It saves in your browser.

## Chicken Look

Pick a design + color on the start screen. It saves in your browser.
