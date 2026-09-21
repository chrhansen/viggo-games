# Hunter Guy shared engine

`engine.js` owns the session, player movement, terrain grounding, pause, weapon selection,
cooldowns, range validation, damage, tagging, score and status messages. `wildlife.js`
owns seeded spawning, roaming, idle/scared behavior and animal health. `collisions.js`
owns movement collision and sliding. No file in this directory uses Three.js, React,
DOM, audio or native APIs.

The scene adapter supplies the same seeded forest colliders on both platforms and
raycasts against the same animated animal meshes. Hits enter the engine as an animal
index and distance. Rendering never decides damage or score.

Use `createHunterGame({ seed, colliders })`, `setActive`, `look`, `step(delta, input)`
and `fire(hit)`. Time advances only while active and clamps long frames to 100ms;
backgrounding pauses without catching up on return. State remains in memory for the
current hunt; leaving the game starts a fresh session next time.

`../scene.js` is also shared: Three.js terrain, forest, camera, animal animation,
raycasting and tool effects. The browser supplies WebGL/DOM/WebAudio; native supplies
Expo GL, downloaded bundled textures, React Native controls and Expo Audio. Android
surface recreation reuses the existing engine and pauses for explicit resume.

Run the root gate. `src/test/hunter-engine.test.ts` covers gameplay rules;
`hunter-scene.test.ts` covers portrait/landscape parity, real mesh hits and scene
recreation. `hunter-collisions.test.ts` covers collision boundaries and sliding.
