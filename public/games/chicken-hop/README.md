# Chicken Hop: House Run

Browser and native game with one shared rules engine and separate platform renderers.

Source of truth: `chrhansen/viggo-games`.

## Play in a browser

From the repo root:

```sh
npm ci
npm run dev
```

Open `http://localhost:8080/games/chicken-hop/`.

## Controls

- Move: `Left/Right` or `A/D`
- Jump: `Space`, `Up`, or `W`
- Fly: hold the jump control while airborne
- Drop from shelves: `Down` or `S`
- Speed: `1` slow, `2` normal, `3` fast
- Pause: `P`
- Restart: `R`

Touch devices show move, jump/fly, drop, pause, and restart controls.

## Shared rules

- Two 100-point hearts; front collisions deal 12 damage.
- Obstacle tops, steps, and shelves are safe landing surfaces.
- Regular corn gives `+1 Corn` and `+60 Score`.
- Gold corn gives `+3 Corn` and `+180 Score`.
- Eggs remove one corn, never health, and never reduce corn below zero.
- Flight has five seconds of fuel and refills after resting on a landing surface.
- Obstacles spawn in clearable chunks with landing gaps.
- Plateau shelves use stairs and one-way platform collision.

## Architecture

The browser and React Native app both call `packages/chicken-hop-core/src/`.
The core is pure TypeScript: no DOM, Canvas, React, or React Native imports.

Shared core owns:

- game state and deterministic random stream
- input-to-movement rules
- jump, flight, gravity, and platform physics
- obstacles, stairs, shelves, corn, and egg spawning
- collisions, health, score, pause, and time modes
- semantic events such as `jump`, `flight-feather`, `land`, `hurt`, and `corn`
- chicken profile option IDs, name normalization, and random-name selection

Browser-only files under `games/chicken-hop/` own:

- `game.ts`: browser loop and adapter wiring
- `canvas-*.ts`: Canvas rendering, renderer palettes, and browser particles
- `web-input.ts`: keyboard and pointer controls
- `web-audio.ts`: WebAudio effects
- `web-ui.ts`: DOM UI and local storage
- `index.html`: browser entrypoint

Native-only files under `mobile/` own:

- React Native rendering and controls
- the 50% world camera projection
- native feather rendering
- phone lifecycle behavior, including auto-pause

`public/games/chicken-hop/styles.css` remains a static browser asset. Vite bundles the browser TypeScript entry and writes `dist/games/chicken-hop/index.html`.

## Changing behavior

A gameplay rule belongs in `packages/chicken-hop-core/src/`. Add or update its parity coverage in `src/test/chicken-hop-engine.test.ts`, then run both gates:

```sh
npm run lint
npm run typecheck
npm run test
npm run build

cd mobile
npm run lint
npm run typecheck
npm run export:native
```

Renderer, input-device, audio, storage, and lifecycle changes stay in their platform folder.

## Persistence

The browser stores:

- `chicken_hop_best_v1`: best score
- `chicken_hop_name_v1`: chicken name
- `chicken_hop_look_v1`: design and color

## Deployment

- Production game: `https://viggo.games/games/chicken-hop/`
- Homepage route: `https://viggo.games/chicken-hop/`
- Workflow: `.github/workflows/pages.yml`
- Trigger: push to `main`
