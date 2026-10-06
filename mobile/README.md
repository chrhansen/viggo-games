# Viggo Games Mobile

Native iOS and Android app built with React Native and Expo. It includes the native splash, game selector, game detail pages, and playable native Chicken Hop, Hunter Guy, Burb and Gunny. It does not embed the website.

Read this when developing a native game, checking browser/native ownership,
or delivering an iPhone beta or Expo update.

## Delivery status

Gunny and About are embedded in signed **Viggo Games 0.1.0 (13)**, built on
**2026-10-06** from commit `7d010e5d33978f31472dbbf3df2becd9dadb795e`.
EAS build ID: `52175aa7-940d-4607-92a4-ee72fc880812`. The archive was checked for
build (13), Gunny's mission and shared engine, About's copy, all five planet maps,
warning audio and Viggo's portrait with matching asset hashes. Its native runtime
is `2d12d4f252db8585180dff1ba16c1e66bc2e25b8`, on the `testflight` channel.
Apple accepted the direct `altool` upload with no errors, delivery ID
`cfa89875-7fbb-470e-81b8-43cf7728c0ab`, and reports `VALID` and `IN_BETA_TESTING`.
The automatic internal **Team (Expo)** group includes build (13); its testing
notes are saved and verified. Install through **TestFlight → Viggo Games → Update**.
The full web/mobile gates passed, including 183 tests, both native exports and
Expo Doctor's 20 checks. Gunny's GPU, touch feel, rotation and background/resume
still need physical iPhone acceptance.

Burb's landscape motion steering is embedded in signed **Viggo Games 0.1.0 (12)**,
built on **2026-10-05** from commit `89b1b9843c191da7d5e1ed090e8544ce3be22068`.
EAS build ID: `1402e533-e880-4c6f-ae1f-9c5df315e544`. The archive was checked for
build (12), the native motion module, its permission prompt, embedded tilt controls
and all seven Burb textures with matching hashes. Its native runtime is
`2d12d4f252db8585180dff1ba16c1e66bc2e25b8`; the added sensor module and permission
require a new TestFlight installer. Apple's `altool` accepted the upload with no
errors, delivery ID `53b39dde-1aaa-47eb-a957-367f58771460`. Apple reports `VALID`
and `IN_BETA_TESTING`, available to the automatic internal `Team (Expo)` group.
Install through **TestFlight → Viggo Games → Update**. The full web and mobile
gates passed. Christian tested build (12) on his iPhone and reported that it looked
great. Broader rotation, background/resume and GPU checks remain part of beta testing.

Burb is embedded in signed **Viggo Games 0.1.0 (11)**, built on **2026-10-05**
from commit `0425ed446fb6d23f4712734d6071217bd711c918`. EAS build ID:
`31286b3f-917c-40b1-bd1b-45567276f108`. The archive was checked for build number
(11), Burb's game screen and all seven texture assets, with matching hashes.
Expo submission `17be83cb-15a6-46c7-9e55-ad57cda98cd9` remained queued and was
canceled. The same signed installer was uploaded directly using Apple's `altool`,
with delivery ID `09c616c4-1a92-4395-8fef-f9b4bdde44be`. Apple reports `VALID`
and `IN_BETA_TESTING` for build (11), available to the automatic internal
`Team (Expo)` group. Install through **TestFlight → Viggo Games → Update**.
This installer contains Burb from first launch. Christian reported a good first
start; broader native GPU, touch and lifecycle acceptance remain pending.

An iOS Expo update was published on **2026-10-05**:
`01a10cd1-e2b5-7879-9911-e9c971734c61` to `testflight`, update group
`2fdfbf9e-c0f4-45a3-abb0-a492fb41b1d2`, from commit
`30967a272898401ba92b658749ee4b60e4089e4b`. Its native fingerprint matches the
installed TestFlight build (10): `c404e832f1b7cc4edea477b323923d99615c688d`.
The update endpoint serves this update for the installed iOS runtime. Its uploaded
bundle and all seven Burb textures were downloaded and verified against their hashes.
The update adds Burb's **Play now** route, shared browser/native engine and scene,
and native touch controls. Christian reported Burb was still unavailable in the
installed app. Expo insights recorded no installs at the time of investigation.
The actual build (10) archive has updates enabled, the correct URL/channel, and a
matching embedded runtime. Without device update logs, the cause of the missing
download remains unconfirmed. Build (11) above delivers Burb in a replacement
TestFlight installer. Simulator.app was unavailable, so Christian requested iPhone
delivery.

As of **2026-10-04**, **Viggo Games 0.1.0 (10)** is available to the internal
`Team (Expo)` TestFlight group. It includes both Chicken Hop and Hunter Guy in one
iOS app with bundle identifier `games.viggo`. Christian installed build (10),
reported that it looked good on iPhone, and approved merging the changes to `main`.
Install from the TestFlight invitation, choose a game, then tap **Play now** on its
detail page.
There is no public App Store release yet.

Build **0.1.0 (10)** embedded the full game title images, solid black arcade/detail
background and Hunter Guy scenery that follows the finger on both axes. Its original
selector marked Burb, Gunny and Torpedo **Coming Soon**. The Burb Expo update above
removes that overlay from Burb. Browser controls remain unchanged.
The owner reported no visible change after the build (9) Expo update, so this new
installer delivers the changes through **TestFlight → Viggo Games → Update**.
The full web and mobile gates passed for the source used in this build. The signed
archive was checked for version (10) and the updated background bundle. Christian's
iPhone check provides basic device acceptance; broader GPU and lifecycle testing
remains part of beta testing.

EAS build ID: `4075d4f0-0bc1-44fe-9e38-2aa32dae94e6`, built from commit
`e90c7b7dab54130757a6fdd4691ef871a0069741`. The signed installer was uploaded using
Apple's `altool`, with delivery ID `e5be1ea4-5b3e-444f-8051-2d0dbea57fef`. Apple
reports `VALID` and `IN_BETA_TESTING` for build (10).

On **2026-10-04**, iOS Expo update
`ec66dda1-f070-40ee-b9cb-30b6f5a5a3d0` was published to `testflight` for build (9).
It replaces the decorative arcade/detail background with solid black and makes
Hunter Guy scenery follow the finger horizontally, vertically and diagonally.
Browser directions remain unchanged. The native fingerprint matches build (9):
`c404e832f1b7cc4edea477b323923d99615c688d`. The update endpoint was verified to serve
iOS update `01a107ea-d53f-796d-97f8-ba3a345ec4f2` for that runtime and channel.
The full web and mobile gates passed. This update left the TestFlight build number
at (9); build (10) now includes these changes in its installer.

Build **0.1.0 (9)** shows full game title images without text or shade overlays;
only Burb, Gunny and Torpedo retain **Coming Soon**. Hunter Guy's native vertical
drag in the original installer aims up when dragging up and down when dragging
down; the Expo update above replaces that behavior. Browser directions
and horizontal touch input are unchanged. The full web and mobile gates passed,
including Expo Doctor's 20 checks and both native exports. The updated selector
also loaded in the iPhone simulator; physical-device touch testing is pending.

EAS build ID: `cf4bac87-9e49-49ba-a92d-6253b55853bd`. The signed installer was
uploaded directly using Apple's `altool`, with delivery ID
`1b87f655-8af9-4263-bda7-a907f5375bac`. Apple reports `VALID` and
`IN_BETA_TESTING`. Install through **TestFlight → Viggo Games → Update**.

On **2026-10-01**, iOS Expo update
`ba8ab6ba-8b41-45d0-a4c9-a02dd8cd3298` was published to `testflight` for build (6).
It fixes Hunter Guy look directions, halves touch look speed, disables swipe-back,
adds confirmed game exits, and opens shared game details before play. Open the app
online to download the update, then fully close and reopen it to apply it.

A new signed **0.1.0 (7)** TestFlight installer was also built on **2026-10-01**
using the current source and EAS configuration. Its automatic Expo submission
`d873be87-c08c-417a-855b-b3932b903fa7` stalled in the upload queue and was canceled.
The same signed build was uploaded directly using Apple's `altool`, with delivery
ID `702302e7-ae11-4568-aa07-67542ca9ba98`. Apple processing completed; App Store
Connect reports `VALID` and `IN_BETA_TESTING`. Build ID:
`8c09ddf6-56eb-40ea-bd4b-dae5797cb303`. Install it from
**TestFlight → Viggo Games → Update**. This is a new installer, unlike the Expo
update for build (6). Device testing of build (7) is still pending.

After build (7) was signed, the repository's Expo SDK 57 patch dependencies were
refreshed to satisfy the current mobile dependency checks. Build (7) includes all
the game and navigation fixes above, but predates those dependency updates. Their
native fingerprint changes are included in TestFlight build (9); they have not been
published as an Expo update to build (7). Install build (9) to receive these changes.
The refreshed dependency set passes Expo Doctor's 20 checks and both native exports.

All four native games have Android implementations and passing Android export
checks. An Android device/store build has not been delivered. Gunny and the About
page were delivered in TestFlight build (13) on **2026-10-06**; their native device
acceptance remains pending.
Torpedo retains a preview detail page and has not been ported.

## Stack

- Expo SDK 57
- React Native and TypeScript
- Expo Router
- EAS development, development-simulator, preview, testflight, and production profiles
- npm

## Run

```sh
cd mobile
npm ci
npm run ios
npm run android
```

Use Node.js 22.12 or later and npm. Check out the whole repository: the mobile
lockfile resolves local game packages from `../games/`. `npm run ios` needs Xcode.
`npm run android` needs Android Studio, a JDK, and the Android SDK. The project is
already linked to `@viggo-games/viggo-games` for EAS builds. Use the native commands
above or a development build; Expo Go is not the validation target for this app.

## Gate

```sh
npm run lint
npm run typecheck
npm run doctor
npm run export:native
```

Mobile CI runs this gate plus the root web/test gate for changes to the mobile app, shared game engines/scenes, browser adapters, parity tests, or the workflow itself.

`package.json` overrides only `xcode`'s deprecated `uuid` dependency. Remove that override once Expo's config plugins adopt an `xcode` release that no longer depends on `uuid@7`.

## Game navigation

The arcade and game detail pages use a solid black background, without decorative
glows, arcs or grid lines.

The selector shows each full title image at its original aspect ratio. Only
Torpedo has a **Coming Soon** overlay; playable games have no text or
shade over their artwork. Tap any image to open its detail page.

Select a mission to open its detail page with artwork, instructions, touch controls
and tips. Descriptions and gameplay instructions come from the website's shared
`../src/data/games.json`; phone controls stay native. Only **Play now** opens a
playable game. Missions not yet ported show details with **Coming to mobile**.

An **About Viggo.games** button appears below the full game list and on each game
detail page. About shares the website's `../src/data/about.json` copy and Viggo
portrait. The source address is selectable text on native, preserving the app's
existing restriction on external links. Back returns to the previous page, or the
arcade when opened directly.

Swipe-back navigation is disabled throughout the native stack, so horizontal drags
remain game input. The top-left game arrow and Android back button show an exit
confirmation. Games pause while the dialog is open; **Keep playing** resumes a
previously active game, and **Exit game** ends it and returns to its detail page.
Canceling from a paused game leaves it paused. A direct game link without navigation
history returns to the arcade after confirmation.

## Product constraints

- Phones only for the first release. iPad support is disabled; Android layouts target compact phone screens.
- Child-directed app: no analytics, advertising, accounts, external links, or data collection. Burb requests motion access for landscape steering; readings stay on the device and are not retained. Development clients may request local-network access to reach Metro.
- No WebView. Games must be implemented with React Native and Expo-compatible native libraries.
- Chicken Hop uses React Native views around the same platform-neutral TypeScript engine as the browser game. It does not reuse the browser Canvas renderer or a WebView.

Any future analytics, third-party SDK, account, communication, or external-link feature needs a child-privacy review before implementation.

## Chicken Hop

Open Chicken Hop's details, tap **Play now**, name the chicken, and choose one of four designs and six colors before starting the run. The chosen look stays active for the current game screen.

- Hold left or right to move.
- Tap Hop to jump; keep holding it while airborne to fly.
- Land on obstacle tops, climb the green stairs, and run across one-way shelves. Walking off a shelf returns the chicken to the floor.
- Front collisions with clutter drain two 100-point hearts; stairs and shelves are safe.
- Regular corn gives `+1 Corn` and `+60 Score`; gold corn gives `+3 Corn` and `+180 Score`.
- Eggs remove one corn, never health, and never reduce corn below zero.
- Flight has five seconds of fuel and refills after resting on a landing surface.
- Jumping and flying shed animated feathers.
- The room and hazards use a 50% world camera while the chicken keeps its original on-screen size.
- The game toolbar has a high-contrast pause/resume button.
- Leaving the app pauses an active run automatically.

This review slice intentionally defers sound effects, persistent personalization, and persistent best-score storage. Those should follow after the native movement and game feel are approved.

## Chicken Hop architecture

- `../games/chicken-hop/core/`: shared state, deterministic random stream, physics, movement, spawning, collision rules, scoring, health, pause/time modes, and semantic game events, all within this repository.
- `src/game/chicken-hop/engine.ts`: native adapter. Converts phone pixels to the 50% world camera and projects shared state into the React Native render model.
- `src/components/chicken-hop/`: native renderer and native-only effects.
- `../games/chicken-hop/`: browser Canvas renderer, browser controls, WebAudio, and local storage UI.
- `metro.config.js`: lets Metro watch and bundle the shared package outside `mobile/`.

Browser and mobile parity is covered by a seeded input-timeline test in `../src/test/chicken-hop-engine.test.ts`. A gameplay rule belongs in the shared package unless it requires a browser or React Native API.

## Hunter Guy

Hunter Guy is the second playable game. Its platform-neutral JavaScript engine lives
in `../games/hunter-guy/core/`; browser and native also share the Three.js scene,
forest, models, animation, raycasts, textures and weapon effects. Both use Three.js
0.160.0. `src/game/hunter-guy/renderer.ts` adapts Expo GL and bundled image assets;
`src/app/hunter-guy.tsx` supplies the native HUD and lifecycle. There is no WebView.

Move with the left joystick, drag the scene to aim, choose a belt tool and tap Use
Tool. Fox/deer take one tag, bears take two; water scares animals without damage.
Dragging moves the forest with the finger on both axes, as if grabbing and moving
the image. Native `nativeLookDelta` passes both axes directly to shared `lookDelta`;
browser touch direction stays unchanged. Touch look speed remains 0.0021 radians
per pixel, half the original speed. The look regression tests project a scene
landmark onto the screen to verify horizontal, vertical and diagonal dragging.
Native supports simultaneous move/look/fire, portrait and landscape, explicit pause,
and automatic background pause. Android surface recreation preserves the current
hunt. Rotation recreates the graphics surface with the new aspect ratio and pauses
without resetting the hunt. Scores reset when leaving the game. Native shadows are
disabled and scene pixel ratio is capped at 1.25 for phone performance; the HUD keeps
full resolution. Paused scenes do not redraw. Optional browser motion aiming is not
requested on native.

Expo Audio plays bundled versions of the browser's procedural tool sounds. No
microphone permission or background audio is enabled. The root `hunter-engine`,
`hunter-scene`, `hunter-collisions`, `hunter-look-controls`, mobile selector and
`mobile-game-navigation` tests cover shared rules, controls, detail routing and
confirmed exits. Device testing is still required for touch feel and GPU performance.

Native verification has a simulator rendering finding: the iOS 26.5 simulator
shows missing near-ground triangles. It persists with an unlit material, fog disabled,
backface culling disabled, and the sky drawn first. Its OpenGL renderer runs in
software. The owner reported that the delivered iPhone beta looked good; that is a
basic device check, not exhaustive GPU or lifecycle coverage. Continue checking the
ground, simultaneous controls, rotation, and background/resume during beta testing.
The browser scene renders correctly.

## Burb

Open Burb's details, tap **Play now**, then **Start ride**. Hold Left or Right to
steer in portrait. In landscape, allow motion access, hold the phone upright with
the screen facing you, and twist slightly clockwise to steer right or
counterclockwise to steer left. Steering measures roll around the axis perpendicular
to the screen; forward/backward pitch does not steer. A 2° dead zone avoids jitter;
18° gives full steering. The neutral hold is centered at ride start/resume and
after changing landscape direction. Tap **Center tilt** to center your current hold.
Fast and Slow remain touch buttons in both orientations; release to cruise.
If motion access is denied or sensors are unavailable, steering buttons remain
available. The paused landscape card can open motion settings.

- `../games/burb/core/`: one engine for speed, throttle, steering smoothing,
  heading, lean, collisions, surface grounding, field of view and pause/time rules.
  No Three.js, DOM, React Native or device APIs.
- `../games/burb/src/scene.ts`: shared road, terrain, collision placement,
  mountains, trees, sky, cockpit and camera animation. The browser and native
  adapters call the same `step(delta, input)` loop.
- `src/game/burb/renderer.ts`: Expo GL renderer and locally bundled texture assets.
- `src/game/burb/touch-input.ts` and `src/components/burb/`: touch collection.
- `src/game/burb/motion-input.ts` and `src/hooks/use-burb-motion.ts`: native motion
  subscription, permission handling, calibration and orientation-aware input mode.
- `src/app/burb.tsx`: HUD, start/pause, confirmed exit and app lifecycle.

Rotation resizes the existing graphics view and clears held touch input while the
ride keeps playing. Graphics recreation preserves the same engine and its running
or paused state. Backgrounding and explicit pause stop the bike; Continue resumes
from the same position. The native layout event supplies pixel dimensions to the
renderer and shared camera; Expo GL's initial JavaScript buffer dimensions are not
used to detect later resizes.
Sensors run only during an active landscape ride, at about 30 samples/second.
Gravity is separated from hand acceleration; flat/invalid readings and samples
older than 250ms clear tilt. Portrait, pause, background and exit stop sampling
and clear tilt input. Game physics and steering smoothing remain in the shared engine.
Paused scenes do not redraw. Native pixel ratio is capped at 1.25; HUD and controls
retain full resolution. Metro and native TypeScript resolve shared scene imports
against the app's Three.js 0.160.0 instance. Browser Burb retains its own version.

Native PNG textures are baked from the browser's deterministic canvas recipes.
After texture changes, run the root Vite server and
`node scripts/bake-burb-textures.mjs` from the repository root. Verify with
`node scripts/bake-burb-textures.mjs --check`. Commit the generated source assets.
The engine, scene and input regressions in `../src/test/burb-*.test.ts` cover speed,
steering, collision recovery, pause, time clamping, portrait/landscape parity and
graphics recreation. Continue native GPU, simultaneous touch, rotation and
background/resume checks on iPhone during beta testing.

## Gunny

Open Gunny's details, tap **Play now**, then **Launch mission**. Hold the arrows to
steer left/right/up/down and hold Fire at the same time. Destroy 12 two-hit raiders,
dodge satellites and expanding blasts, and keep the hull above zero. The HUD shows
hull, score, kills and distance. At displayed 10% hull, a red warning pulses and the
browser's 740Hz warning repeats once per second; reduced-motion users see steady red.
Pause, background, confirmed exit and mission completion stop held input and warning
audio. Rotation clears held touch input while the mission and warning keep running.
Resume preserves the mission; Restart resets it.

- `../games/gunny/core/`: platform-neutral flight, spawning, shots, collision damage,
  score, blast windows, win/loss and pause/time rules. No Three.js or device APIs.
- `../games/gunny/src/scene.js`: shared spacecraft, satellites, planet shaders,
  starfield, lighting, camera and explosion projection.
- `src/game/gunny/renderer.ts`: Expo GL and five locally bundled planet maps.
- `src/game/gunny/touch-input.ts` and `src/components/gunny/`: simultaneous held input.
- `src/game/gunny/hull-warning.ts`: Expo Audio and accessible warning motion.
- `src/app/gunny.tsx`: native HUD, launch/restart, pause, confirmed exit and lifecycle.

Native resolution is capped at 1.25 device pixels per point; controls/HUD keep full
resolution. Rotation resizes the existing graphics view while play continues.
The shared engine and its running or paused state survive graphics recreation.
Backgrounding pauses the mission, and paused scenes do not redraw. Metro
uses the app's Three.js 0.160.0 instance for the renderer and all shared scene imports.
Portrait framing follows the ship horizontally and widens its view so both flight
bounds remain visible; landscape retains the browser's chase camera.
Planet maps and source attribution are available offline. No new native module or
permission is required. Regenerate the procedural warning with the root command
`node scripts/bake-gunny-audio.mjs` and verify with `--check`.

`../src/test/mobile-game-rotation.test.ts` exercises both native screens and adapters
with their real shared engines and scenes: portrait/landscape changes, viewport and
camera sizing, graphics recreation, deliberate pause, background/resume and graphics
failure. Native GL and sensor behavior still need iPhone verification during beta testing.

Root `gunny-engine`, Gunny's Node regressions, mobile navigation and About tests
cover shared rules, seeded browser/native parity, multitouch cancellation, restart,
scene disposal, portrait flight-bound framing and portrait/landscape recreation. iOS/Android exports and Expo
Doctor pass. The installed simulator has no accessible Simulator.app UI, so native
GPU, touch feel, rotation and background/resume still need iPhone verification.

## Expo and TestFlight beta delivery

Expo project: `@viggo-games/viggo-games`, owned by the Viggo Games organization.
The `testflight` profile is an App Store distribution build on the dedicated
`testflight` update channel, using the `preview` EAS environment. This uploads a
beta for TestFlight; it does not submit a public App Store release for review.

```sh
# From mobile/
npm run build:testflight
npm run submit:testflight -- --id <successful-build-id> --non-interactive
npm run update:testflight -- --message "Describe the tested change"
```

Apple signing, provisioning, the App Store Connect app, and the existing upload API
key are configured for this project. Reuse the saved credentials; the initial setup
did not require a new Apple API key. Apple login/2FA may be needed when signing
credentials expire or change. Keep credentials in Apple/Expo's secure stores,
never in this repository.

Install the new beta through TestFlight first. EAS Update can then deliver compatible
JavaScript and asset updates when the app restarts. Adding native modules (including
the initial Expo GL/audio/updates addition) requires another TestFlight build.
Fingerprint runtime versions prevent incompatible updates reaching older binaries.
Production has its own channel; do not publish there until device testing is approved.

Before an update, compare fingerprints with the installed TestFlight build using
`npx eas-cli@24.7.0 fingerprint:compare --build-id <build-id> --environment preview`.
The October 1 update used a clean source snapshot and build (6)'s EAS configuration:
all native source hashes matched, while later submission settings changed the
`eas.json` hash. Its verified runtime is
`1d1081ffeaf37d7efd25d9ca7183a33031ed32cb`. A clean snapshot also keeps generated
local `ios/` files out of the managed fingerprint. Native hash changes require a
new TestFlight build.

EAS Build produces the signed binary; EAS Submit uploads it to Apple for TestFlight
processing and invitation-based installation. EAS Update sends compatible JavaScript
and assets to an already installed build; it does not create a TestFlight invitation
or install a new app. It also leaves the TestFlight build number unchanged and does
not create a new TestFlight version or its notification email. A visible TestFlight
update requires a new signed installer. Pushing to GitHub `main` runs CI and deploys
the website only.
Public App Store submission is a separate step after beta testing.

EAS manages build numbers remotely. The TestFlight submit profile links App Store
Connect app `6814593296` and Apple team `DVPJZW992F` (Christian Hansen). Internal
group `Team (Expo)` automatically receives all builds through App Store Connect.
Leave `groups` out of the submit profile: explicitly assigning this automatic
internal group makes Fastlane report an error after the upload succeeds. Verify
the build and tester status in App Store Connect before retrying an upload.
The existing App Store Connect upload key is assigned to this
app in the Viggo Games Expo organization's encrypted credential store; no private
key belongs in this repository. Subsequent submissions can use `--non-interactive`.
