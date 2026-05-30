# Torpedo

Torpedo is a browser-based first-person submarine game prototype. It was built as a kid-friendly arcade game: you are leading a submarine patrol under the ocean while enemy submarines approach from the front and fire torpedoes.

The player submarine has fictional windows, even though real military submarines do not. The front window is the main combat view, the side windows let you look port or starboard, and the periscope gives a tighter forward view.

## How The Game Works

You lead the point of a V-shaped formation. Three helper submarines travel off your port side and three travel off your starboard side, each one farther out and slightly farther back. You usually cannot see the helper submarines because they are behind and off to the sides, but you can see their torpedoes streak forward during combat.

Enemy submarines spawn in front of the formation so they can be seen through the front view. They move toward you and shoot torpedoes. Your job is to dodge incoming torpedoes and fire back. Torpedoes travel nose-first like spears, with a bubble trail behind them.

Press `V` to leave first-person combat and enter the submarine plan view. This is a pause mode: enemies do not attack while you are walking around inside. From the plan view, you can enter rooms:

- Steering room: hold course
- Sonar room: ping sonar
- Bunk room: take a nap
- Galley: eat
- Engine room: repair the engine if it is broken

## Controls

- Arrow keys or WASD: dodge in combat
- Space: fire a torpedo
- `1`: front window
- `2`: port windows
- `3`: starboard windows
- `P`: periscope
- `V`: open the paused submarine plan, or return to combat from the plan
- Enter or Space on the plan: enter the selected room
- Enter or Space inside a room: use that room's station
- Escape or `V` inside a room: return to the plan

## Core Technologies

- Vite: local dev server and production build
- Three.js: 3D underwater combat scene, submarines, torpedoes, seafloor, bubbles, and lighting
- Plain JavaScript modules: game state, combat logic, helper formation, interior navigation, and smoke testing
- CSS: cockpit frames, submarine interior plan, room scenes, HUD, and responsive layout
- Chrome DevTools Protocol smoke test: launches local Chrome, runs the game, checks rendering, and verifies the main interaction flow

## Run Locally

```sh
npm install
npm run dev
```

Open the local URL that Vite prints. By default it is:

```text
http://127.0.0.1:5173/
```

## Build

```sh
npm run build
```

The build output goes to `dist/`.

## Verify

```sh
npm run smoke
```

The smoke test starts a temporary Vite server, opens Chrome headlessly, exercises desktop and mobile viewports, and verifies:

- game renders to the canvas
- combat view switches work
- periscope mode opens
- submarine interior opens as pause mode
- room entry and room action flow works
- returning to combat works

If Chrome is installed somewhere unusual, set `CHROME_PATH`:

```sh
CHROME_PATH="/path/to/chrome" npm run smoke
```
