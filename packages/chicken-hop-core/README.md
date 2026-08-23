# Chicken Hop core

Platform-neutral rules engine used by both Chicken Hop renderers.

## Boundary

Core owns state transitions, physics, spawning, collisions, scoring, health, deterministic randomness, pause/time modes, and semantic events. It must not import DOM, Canvas, React, React Native, audio, storage, or device APIs.

Platform adapters own input collection, frame scheduling, rendering, effects, audio, persistence, lifecycle, and viewport projection.

## API

Import from `src/index.ts`:

- `createChickenHopGame(options)`
- `startChickenHopRun(game)`
- `advanceChickenHopGame(game, input, delta)`
- `toggleChickenHopPause(game)`
- `setChickenHopTimeMode(game, mode)`
- `resizeChickenHopGame(game, width, height)`
- `snapshotChickenHopGame(game)`

`advanceChickenHopGame` replaces `game.events` on every simulation step. A platform adapter must consume or publish events during that step; it must not assume events persist until a later render.

Use an explicit seed for reproducible simulations. The parity test drives browser-sized core state and the native adapter through the same input timeline and asserts identical snapshots.
