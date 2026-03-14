# Burb Ride

Small browser cycling game prototype. First-person road riding, visible cockpit, stylized low-poly scenery, browser-only stack.

## What we have

- Vite + TypeScript + Three.js app
- First-person camera with mild camera lean
- Detailed bike cockpit with steering bars, fork, wheel, cables, and computer mount
- Raised asphalt road with bright lane markings and gravel shoulders
- Irregular 3D road loop with mixed bends
- Varied trees, roadside posts, mountains, clouds, and sky dome
- Keyboard + touch controls

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

If you want the same fixed URL used during testing:

```bash
npm run dev -- --host 127.0.0.1 --port 4173 --strictPort
```

Then open:

```text
http://127.0.0.1:4173/
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

## Current behavior

- Steering yaws the cockpit left/right around a vertical axis
- Bike stays visually upright; the camera can lean slightly while steering
- Steering biases your line across the road, then recenters when released
- Riding far enough off the asphalt slows you down
- The route is a closed loop with a wider, clearer road surface than the original prototype

## Build

Production build:

```bash
npm run build
```
