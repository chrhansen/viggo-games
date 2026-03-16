# Hunter Guy (Browser Prototype)

Simple first-person browser game.
Player in forest.
Tools on belt.
Targets: foxes, deer, bears.

Source of truth: this folder inside `chrhansen/viggo-games`.

## Stack

- Vanilla HTML/CSS/JS
- `three.js` from CDN import map (no npm install)
- Custom first-person controls with pointer lock + touch input
- Web Audio API (procedural tool SFX)

## Run

Use a local server (not `file://`):

```bash
cd /Users/chrh/dev/viggo-games/public/games/hunter-guy
python3 -m http.server 4173
```

Open `http://127.0.0.1:4173`.
If behavior looks stale, hard refresh (`Cmd+Shift+R`).

## Deployment

- Production URL: `https://viggo.games/games/hunter-guy/`
- Embedded on homepage route: `https://viggo.games/hunter-guy`
- Repo owner: `chrhansen/viggo-games`
- Hosting: GitHub Pages from the umbrella repo
- Deploy workflow: `/Users/chrh/dev/viggo-games/.github/workflows/pages.yml`
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
  - import map for `three` and addons
- `style.css`
  - UI styling (HUD, crosshair, overlay, belt, touch controls)
  - top-positioned weapon belt
  - dismissible controls helper card
- `game.js`
  - Scene/camera/lights/terrain/trees
  - Raycast hit handling and score updates
  - Dense tree population with a small spawn clearing
  - Main animation loop
  - controls card auto-hide timing
- `player-controls.js`
  - Desktop pointer-lock look + keyboard movement
  - Touch D-pad movement + drag-to-look
  - Device orientation look offset on supported phones/tablets
  - Relative motion baseline + rotation-aware device look handling
  - session active hook used by helper-card timing
- `wildlife.js`
  - Animal models/spawn counts
  - Animal roaming behavior
  - Damage/HP logic (`applyDamage`)
  - Scare logic (`squirt`)
- `weapon-effects.js`
  - Rifle sparks + tracer
  - Bow arrow projectile
  - Knife first-person rig + slash animation
  - Squirt spray particles
- `weapon-sfx.js`
  - Procedural SFX for rifle, bow, knife, and squirt gun
  - Lazy audio init + browser-safe warmup/resume on user click

## Current Defaults

- Tree density: `TREE_COUNT = 540` (`game.js`)
- Spawn clearing: `PLAYER_CLEARING_RADIUS = 14` (`game.js`)
- Knife reach: `weaponStats.knife.range = 5` (`game.js`)
- Wildlife pace: `ANIMAL_SPEED_SCALE = 0.5` (`wildlife.js`)
- Wildlife move/idle windows: `moveMin/moveMax` + `idleMin/idleMax` per species (`wildlife.js`)

## Tuning Knobs (fast edits)

- Look up/down range: `LOOK_RANGE_RADIANS` in `game.js`
- Turn speed: `turnSpeed` in `player-controls.js`
- Animal counts and speed scale: constants in `wildlife.js`
- Bear/deer/fox HP and behavior: spawn options in `wildlife.js`
- Weapon cooldown/range: `weaponStats` in `game.js`

## Notes For Next Agent

- Keep controls kid-simple.
- Desktop turning stays on horizontal plane only.
- Preserve static-server workflow unless build tooling is added on purpose.
