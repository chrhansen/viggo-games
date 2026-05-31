# Torpedo

Torpedo is a browser-based first-person submarine game prototype. It is a kid-friendly arcade game: you lead a submarine patrol under the ocean while enemy submarines approach from the front and fire torpedoes.

The player submarine has fictional windows, even though real military submarines do not. The front window is the main combat view, the side windows let you look port or starboard, and the periscope gives a tighter forward view.

## How The Game Works

You lead the point of a V-shaped formation. Three helper submarines travel off your port side and three travel off your starboard side, each one farther out and slightly farther back. You usually cannot see the helper submarines because they are behind and off to the sides, but you can see their torpedoes streak forward during combat.

Enemy submarines spawn in front of the formation so they can be seen through the front view. They are elongated submarine models with conning towers, fins, propellers, hatches, rails, and torpedo tubes. They move toward you and shoot torpedoes. Your job is to steer across a wide combat window, line up off-center enemies, dodge incoming torpedoes, and fire back. Torpedoes travel nose-first with a bubble trail behind them.

The player submarine has a tougher hull with `160` hull points. If the hull gets badly damaged, the engine can be hit and the submarine slows down until repaired in the engine room.

After enough regular enemies are defeated, a giant enemy submarine enters the patrol route. Giant submarines take a randomized number of hits to sink and fire three-torpedo salvos. When one is destroyed, a small enemy sub breaks loose and sinks toward the bottom. Sail over that sinking sub to collect bonus points, then regular enemies resume. Sink five giant submarines and collect their prizes to advance to level two.

Press `V` or the on-screen `Rooms` button to leave first-person combat and enter the submarine plan view. This is a pause mode: enemies do not attack while you are walking around inside. From the plan view, you can enter rooms:

- Control room: hold course
- Sonar room: ping sonar
- Crew quarters: rest
- Galley: eat a meal
- Engine room: repair the engine if it is broken

The submarine plan uses the same compartment images as the inside-room view. The current room images are `1216x864` (`38:27`, about `1.407:1`), and both overview rooms and full room views are sized to that same wider-than-tall aspect ratio so the art is not distorted.

## Controls

- Arrow keys or WASD: dodge in combat
- Space: fire a torpedo
- `1`: front window
- `2`: port windows
- `3`: starboard windows
- `P`: periscope
- `V`: open the paused submarine plan, or return to combat from the plan
- Drag the submarine plan: slide the longer submarine overview left or right
- Click a room in the plan: enter that room directly
- Enter or Space on the plan: enter the selected room
- Enter or Space inside a room: use that room's station
- Escape or `V` inside a room: return to the plan

On a phone or tablet, use the bottom controls:

- Arrow pad: dodge up, down, port, and starboard
- Fire: launch a torpedo
- Scope: enter or leave periscope view
- Rooms: enter the submarine interior
- Drag the submarine map or tap a room directly to enter it
- Prev, Next, and Enter / Use: move between rooms and use stations
- Motion: request phone sensor permission, then tilt the phone to steer. Tilting right moves right, and tilting down moves down.

Phone motion controls need a secure browser context. On iOS Safari, that means HTTPS. The motion button reports the current state:

- `Motion`: motion control is off
- `Move Phone`: permission was granted and the game is waiting for sensor events
- `Tilt On`: device orientation events are connected
- `No Signal`: permission was granted but no sensor events arrived
- `Needs HTTPS`: the page is not running in a secure context
- `Unavailable` or `Denied`: the browser cannot provide orientation events, or permission was denied

All on-screen buttons and their text are non-selectable so touch controls do not accidentally highlight text while playing.

## Core Technologies

- Vite: local dev server and production build
- Three.js: 3D underwater combat scene, submarines, torpedoes, seafloor, bubbles, and lighting
- Plain JavaScript modules: combat state, boss progression, input handling, helper formation, interior navigation, and room actions
- CSS: cockpit frames, mobile controls, submarine interior plan, room scenes, HUD, and responsive layout
- Chrome DevTools Protocol smoke test: launches local Chrome, runs the game, checks rendering, and verifies desktop and mobile flows

## Run Locally

```sh
npm install
npm run dev
```

Open the local URL that Vite prints. By default it is:

```text
http://127.0.0.1:5173/
```

## Run On A Phone

For phone testing on the local network or over Tailscale, start Vite on an external interface:

```sh
npm run dev -- --host 0.0.0.0 --port 5174
```

To make iOS motion controls work through Tailscale, serve the local Vite server through Tailscale HTTPS:

```sh
tailscale serve --bg http://127.0.0.1:5174
```

Then open the HTTPS MagicDNS URL for this laptop on the phone. This repo allows the current Tailscale host in `vite.config.js`:

```text
macbook-pro-1.tailcc07d5.ts.net
```

If the Tailscale host name changes, update `server.allowedHosts` in `vite.config.js`.

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
- hull starts at `160`
- boss ladder HUD starts at `Boss 0/5`
- combat view switches work
- phone controls and fire button work
- motion permission, sensor events, swapped tilt axes, and motion shutoff work
- periscope mode opens and closes from the phone button
- submarine interior opens as pause mode
- the submarine overview scrolls and can be dragged on mobile
- room image frames match the `1216x864` compartment art ratio
- direct room tapping, room entry, and room action flow work
- returning to combat works

If Chrome is installed somewhere unusual, set `CHROME_PATH`:

```sh
CHROME_PATH="/path/to/chrome" npm run smoke
```
