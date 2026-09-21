# Hunter Guy — browser and native

First-person forest game with a shared engine and Three.js scene for the browser and native iOS/Android app.
Player in forest.
Tools on belt.
Targets: foxes, deer, bears.

Source of truth: this folder inside `chrhansen/viggo-games`.

## Stack

- Vanilla HTML/CSS/JS
- `three.js` installed through the root npm workspace and bundled by Vite
- Custom first-person controls with pointer lock + touch input
- Web Audio API (procedural tool SFX)

## Run

From the repository root:

```sh
npm ci
npm run dev
```

Open `http://localhost:8080/games/hunter-guy/`. For a standalone server, use `npm run dev --workspace hunter-guy` after the root install.
If behavior looks stale, hard refresh (`Cmd+Shift+R`).

## Deployment

- Production URL: `https://viggo.games/games/hunter-guy/`
- Embedded on homepage route: `https://viggo.games/hunter-guy/`
- Repo owner: `chrhansen/viggo-games`
- Hosting: GitHub Pages from the umbrella repo
- Deploy workflow: `.github/workflows/pages.yml`
- Trigger: push to `main` in `chrhansen/viggo-games`

## Controls

- Desktop
  - Click `Start Hunt` (or canvas) to lock cursor
  - Mouse: look around (pitch limited to +/-15 degrees)
  - `W` / `Up`: move forward
  - `S` / `Down`: move backward
  - `A` / `Left`: turn left
  - `D` / `Right`: turn right
  - `1-4`: switch belt tool
  - Left mouse: use selected tool
- Touch display
  - Tap `Start Hunt`
  - Left D-pad: move forward/back/strafe
  - Drag on the view: look around
  - Turn phone/tablet: extra relative look input when motion access is allowed
  - `Use Tool`: use selected tool
  - Belt buttons: switch belt tool

## Motion Look

- Motion look is additive on touch devices: drag sets the main aim, device motion adds extra yaw/pitch on top.
- Motion input is relative to the device pose when the session starts.
- Portrait/landscape changes recenter the motion baseline, then continue from the new pose.
- Pitch still respects the game look clamp; motion helps with fine aim, not full free-fly roll.

## UI Notes

- Weapon belt lives at the top of the screen to avoid overlap with mobile touch controls
- Controls helper card can be closed with `x`
- Controls helper card auto-hides about 10 seconds after a hunt session starts

## Gameplay Rules

- Fox: 1 hit to tag
- Deer: 1 hit to tag
- Bear: 2 hits to tag
- Squirt gun: scares animals (no damage)
- Animals alternate between roaming and standing still
- Knife range is tuned up for easier close hits (`range: 5`)
- Score tracks total tagged animals

## Project Map

- `index.html`
  - HUD, belt buttons, start overlay
  - Vite bundles local `three` and addon imports
- `style.css`
  - UI styling (HUD, crosshair, overlay, belt, touch controls)
  - top-positioned weapon belt
  - dismissible controls helper card
- `core/`
  - Platform-neutral seeded gameplay: movement, collisions, animals, patrols, tools, score and pause
  - See [shared engine documentation](core/README.md)
- `scene.js`
  - Shared camera, lights, terrain, forest, raycast hit detection and visual synchronization
- `game.js`
  - Browser WebGL, texture loading, DOM HUD, controls and audio adapter
- `collisions.js`
  - Compatibility export for the shared collision module
- `player-controls.js`
  - Desktop pointer-lock look + keyboard movement
  - Touch D-pad movement + drag-to-look
  - Device orientation look offset on supported phones/tablets
  - Relative motion baseline + rotation-aware device look handling
  - session active hook used by helper-card timing
- `forest.js`
  - Instanced pine and broadleaf trees, grass, rocks, fallen logs, and a static sky
- `nature-materials.js`
  - Platform-supplied shared texture loading and grass wind shader
- `animal-models.js`
  - Rounded fox, deer, and bear anatomy, facial details, antlers, paws, and animated legs
- `wildlife.js`
  - Shared animal renderer driven exclusively by core state
- `weapon-effects.js`
  - Rifle sparks + tracer
  - Bow arrow projectile
  - Knife first-person rig + slash animation
  - Squirt spray particles
- `weapon-sfx.js`
  - Procedural SFX for rifle, bow, knife, and squirt gun
  - Lazy audio init + browser-safe warmup/resume on user click

## Visual Detail

- Textures are bundled PNG assets generated from the original seeded Canvas artwork in `texture-art.js`. With the root dev server running, regenerate using `node scripts/bake-hunter-textures.mjs`; generate native sounds from the browser synthesis with `node scripts/bake-hunter-audio.mjs`.
- Trees, foliage, grass, rocks, and logs use shared instanced geometry.
- Pine and broadleaf canopies, tapered trunks, textured ground, and a worn trail add depth. Grass sways; canopies and clouds stay static. Animals have alternating leg movement, subtle body/head motion, and fox tail sway.
- Fur bump maps, eyes, muzzles, ears, branched antlers, hooves, claws, and lower-resolution rounded bodies distinguish the animals.
- Warm sunlight and atmospheric haze follow the player. Browser rendering includes a 1024px shadow map; native disables shadow maps to reduce phone GPU cost.
- Rendering uses 18,000 grass blades, 14 pine / 12 broadleaf foliage cards per tree, and a maximum 1.25 pixel ratio. Foliage casts no shadows.
- The player collides with tree trunks, living animals, and hunters, sliding around them. Grass, rocks, logs, and foliage remain decorative.
- Collision uses a static tree grid, moving body circles, and movement substeps to prevent crossing trunks during slow frames. Tagged animals stop blocking movement.

## Current Defaults

- Tree density: `TREE_COUNT = 540` (`scene.js`)
- Spawn clearing: `PLAYER_CLEARING_RADIUS = 14` (`scene.js`)
- Knife reach: `weaponStats.knife.range = 5` (`core/engine.js`)
- Human patrol pace: `0.4` (`core/engine.js`), 40% of the original speed
- Wildlife pace: `ANIMAL_SPEED_SCALE = 0.5` (`core/wildlife.js`)
- Wildlife move/idle windows: `moveMin/moveMax` + `idleMin/idleMax` per species (`core/wildlife.js`)

## Tuning Knobs (fast edits)

- Look up/down range: `LOOK_RANGE` in `core/world.js`
- Turn speed: `turnSpeed` in `player-controls.js`
- Animal counts and speed scale: constants in `core/wildlife.js`
- Bear/deer/fox HP and behavior: spawn options in `core/wildlife.js`
- Weapon cooldown/range: `weaponStats` in `core/engine.js`

## Notes For Next Agent

- Keep controls kid-simple.
- Desktop turning stays on horizontal plane only.
- Use the root npm install and build; generated files belong in `dist/`.

## Verification

From the repository root, run `npm test -- src/test/hunter-collisions.test.ts` for movement regressions. The full gate is `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.

Also open the game to check rendering, grass sway, animal gait, slow human patrols, and movement against trunks and live animals. Use a browser with pointer-lock support for desktop play; embedded previews may reject mouse capture.

## Native phones

The Expo app in `../../mobile/` imports this package directly. Hunter Guy is playable
from its game selector on iOS and Android, in portrait and landscape. Native controls
use simultaneous touch tracking: left joystick moves, dragging the scene aims, and
the right button uses the selected tool. Native uses touch aiming; the optional
browser device-orientation enhancement remains browser-only. App backgrounding and
leaving the screen pause the hunt. Tool audio honors the phone's silent mode.

TestFlight and Expo update delivery are documented in `../../mobile/README.md`.
