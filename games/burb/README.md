# Burb Ride

Source of truth: this folder in `chrhansen/viggo-games`.

Small browser cycling game prototype. First-person road riding, visible cockpit, stylized low-poly scenery, browser-only stack.

Burb has not been ported to the React Native app. Its card in Viggo Games is a
locked preview; phone/touch support here refers to the browser. See the
[repository platform overview](../../README.md#game-availability).

## What we have

- Vite + TypeScript + Three.js app
- Free first-person riding with world-space steering
- Detailed bike cockpit with bars, fork, wheel, cables, computer mount, and fitted ride height
- Asphalt road loop with lane markings and gravel shoulders
- Shared ground plane for grass, road, trees, posts, mountains, and rider position
- Textured tree trunks, irregular pine foliage, shrubs, roadside posts, green foothills, ridged mountains with surface snow, clouds, and sky dome
- Foliage placement keeps clear of the full road loop, including tight nearby segments
- Large roadside signboard that says `67 mph` with a small `haha`
- HUD speed meter plus a dismissible helper card
- Keyboard, touch, and phone/tablet tilt controls

## How It Works

- The visible road is built from a closed spline, but rider movement is not locked to the spline.
- The bike moves freely over the world in any heading while the road remains a visual route through the map.
- A single shared ground level anchors terrain and scenery so props do not float above or sink below the scene.
- Roadside foliage checks clearance against the full road loop and moves outward or skips placement when it would overlap the asphalt.
- The cockpit rig is attached to the camera and fitted so the lowest bike geometry sits on top of the ground plane.
- Phone and tablet tilt steering reads gravity from `devicemotion`, normalizes for portrait or landscape, and ignores yaw-style look-around rotation.
- Road, grass, sky, clouds, and sign graphics are generated procedurally with simple geometry and canvas textures.

## Start

From the repository root (Node.js 22.12 or later):

```sh
npm ci
npm run dev
```

Open `http://localhost:8080/games/burb/`. A standalone server is also available with `npm run dev --workspace burb -- --port 4174`.

For a standalone server behind an HTTPS reverse proxy, set a comma-separated host allowlist in `games/burb/.env`:

```text
BURB_ALLOWED_HOSTS=your-proxy-hostname
```

## Controls

Keyboard:

- `W` or `ArrowUp`: go faster
- `S` or `ArrowDown`: slow down
- `A` or `ArrowLeft`: steer left
- `D` or `ArrowRight`: steer right

Touch:

- `Left`: steer left
- `Right`: steer right
- `Fast`: go faster
- `Slow`: slow down
- `Enable tilt`: allow motion access, hold the device upright to center it, then lean 30-45 degrees left or right to steer

Tilt steering notes:

- Mobile browsers may ask for motion permission the first time
- Tilt steering needs a secure context such as `https://` or localhost
- `Recenter tilt` resets neutral steering if the device angle changes
- Over Tailscale Serve, use the HTTPS `*.ts.net` URL so motion access stays available on phone/tablet

## Current behavior

- Steering rotates the bike freely in world space with no heading clamp
- Bike can leave the road freely, but stops or slides around tree trunks and mountain bases. Speed drops on impact, and steering can turn the bike away.
- Handlebar visuals follow steering while keeping the riding direction logic separate
- Camera can lean slightly while steering
- The route is a visible closed road loop built on the shared ground plane
- The helper panel in the top-right corner can be dismissed with `X`
- On touch devices, tilt steering can be enabled without using yaw to turn the bike

## Build

From the repository root, `npm run build` compiles every game into `dist/`, including `dist/games/burb/`. Nothing is copied into public folders.

## Collision and scenery detail

- Bike movement stops or slides against tree trunks and mountain bases, with speed reduced on impact. Steering remains available to ride away.
- Collision uses a local spatial grid and small movement steps to avoid crossing thin trunks at high speed. Mountain boundaries follow their generated base geometry, including overlapping foothills.
- The full road loop and shoulders are kept clear of mountain footprints. Shrubs, roadside posts, and signs remain decorative.
- Mountains use vertex colors for green lower slopes, ridged rock, and uneven snow lines on the actual peaks. Trees have shared bark texture, tapered trunks, and irregular layered foliage. No extra animated foliage or shadows.
- `src/collisions.ts` owns movement constraints; `mountains.ts` owns peak geometry and bounds; `tree-detail.ts` owns bark and pine detail; `route.ts` owns the shared route and surface sampling.
- Regression tests: run `npm test -- src/test/burb-collisions.test.ts` from the umbrella repository. Run Burb's own build to typecheck its source.

The entire game, including HUD text, help, tilt status, and touch controls, blocks text selection and iOS long-press callouts.
