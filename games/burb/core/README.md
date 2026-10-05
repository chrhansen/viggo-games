# Burb shared engine

Read when changing Burb's riding rules or browser/native adapters.

`engine.ts` owns speed, throttle, steering and tilt smoothing, heading, lean,
collision response, surface grounding, field of view and pause/time handling.
`collisions.ts` owns the spatial grid, movement substeps and obstacle sliding.
Neither imports graphics, DOM, React, native or device APIs.

Use `createBurbGame({ position, heading, colliders, surfaceHeight })`,
`emptyBurbInput()`, `setActive(active)` and `step(deltaSeconds, input)`.
The shared scene supplies the start pose, scenery colliders and route surface
sampler. Input contains held left/right/accelerate/brake buttons and optional tilt
in [-1, 1]. Buttons take precedence over tilt. Time advances only while active,
ignores invalid/non-positive deltas and clamps long frames to 50ms.

`../src/scene.ts` also shares world geometry and camera/cockpit presentation.
Browser and native supply texture factories, rendering contexts, controls and
frame scheduling. Native preserves the engine while recreating its GL surface;
leaving the game creates a fresh ride next time.

Run the root and mobile gates. `src/test/burb-engine.test.ts` verifies riding rules
and browser/native input timelines; `burb-scene.test.ts` verifies the shared world,
camera/cockpit parity and graphics recreation; `burb-collisions.test.ts` verifies
collision boundaries and sliding.
