# Burb Ride

Small browser cycling game prototype. First-person road riding, visible cockpit, stylized low-poly scenery, browser-only stack.

## What we have

- Vite + TypeScript + Three.js app
- Free first-person riding with world-space steering
- Detailed bike cockpit with bars, fork, wheel, cables, computer mount, and fitted ride height
- Asphalt road loop with lane markings and gravel shoulders
- Shared ground plane for grass, road, trees, posts, mountains, and rider position
- Varied low-poly trees, shrubs, roadside posts, mountains, clouds, and sky dome
- Foliage placement keeps clear of the full road loop, including tight nearby segments
- Large roadside signboard that says `67 mph` with a small `haha`
- HUD speed meter plus a dismissible helper card
- Keyboard + touch controls

## How It Works

- The visible road is built from a closed spline, but rider movement is not locked to the spline.
- The bike moves freely over the world in any heading while the road remains a visual route through the map.
- A single shared ground level anchors terrain and scenery so props do not float above or sink below the scene.
- Roadside foliage checks clearance against the full road loop and moves outward or skips placement when it would overlap the asphalt.
- The cockpit rig is attached to the camera and fitted so the lowest bike geometry sits on top of the ground plane.
- Road, grass, sky, clouds, and sign graphics are generated procedurally with simple geometry and canvas textures.

## Start

Requirements:

- Node.js
- npm

Install:

```bash
npm install
```

Run dev server:

```bash
npm run dev
```

Open the local URL printed by Vite.

If you want the same fixed URL used during testing or while collaborating on live edits:

```bash
npm run dev -- --host 127.0.0.1 --port 4173 --strictPort
```

Then open:

```text
http://127.0.0.1:4173/
```

`--strictPort` keeps the URL stable. If port `4173` is busy, Vite exits instead of silently moving to a different port.

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

## Current behavior

- Steering rotates the bike freely in world space with no heading clamp
- Bike can ride anywhere on the map instead of snapping to a lane
- Handlebar visuals follow steering while keeping the riding direction logic separate
- Camera can lean slightly while steering
- The route is a visible closed road loop built on the shared ground plane
- The helper panel in the top-right corner can be dismissed with `X`

## Build

Production build:

```bash
npm run build
```
