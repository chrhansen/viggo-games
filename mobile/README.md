# Viggo Games Mobile

Native iOS and Android app built with React Native and Expo. It includes the native splash, game selector, and playable native Chicken Hop and Hunter Guy. It does not embed the website.

## Stack

- Expo SDK 57
- React Native and TypeScript
- Expo Router
- EAS development, preview, and production profiles
- npm

## Run

```sh
cd mobile
npm ci
npm run ios
npm run android
```

`npm run ios` needs Xcode. `npm run android` needs Android Studio, a JDK, and the Android SDK. EAS can build either platform after this project is linked to an Expo account.

## Gate

```sh
npm run lint
npm run typecheck
npm run doctor
npm run export:native
```

Mobile CI runs this gate plus the root web/test gate for changes to the mobile app, shared game engines/scenes, browser adapters, parity tests, or the workflow itself.

`package.json` overrides only `xcode`'s deprecated `uuid` dependency. Remove that override once Expo's config plugins adopt an `xcode` release that no longer depends on `uuid@7`.

## Product constraints

- Phones only for the first release. iPad support is disabled; Android layouts target compact phone screens.
- Child-directed app: no analytics, advertising, accounts, external links, or data collection. Production requests no runtime permissions; development clients may request local-network access to reach Metro.
- No WebView. Games must be implemented with React Native and Expo-compatible native libraries.
- Chicken Hop uses React Native views around the same platform-neutral TypeScript engine as the browser game. It does not reuse the browser Canvas renderer or a WebView.

Any future analytics, third-party SDK, account, communication, or external-link feature needs a child-privacy review before implementation.

## Chicken Hop

Tap Chicken Hop on the selector, name the chicken, and choose one of four designs and six colors before starting the run. The chosen look stays active for the current game screen.

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
Native supports simultaneous move/look/fire, portrait and landscape, explicit pause,
and automatic background pause. Android surface recreation preserves the current
hunt. Rotation recreates the graphics surface with the new aspect ratio and pauses
without resetting the hunt. Scores reset when leaving the game. Native shadows are
disabled and scene pixel ratio is capped at 1.25 for phone performance; the HUD keeps
full resolution. Paused scenes do not redraw. Optional browser motion aiming is not
requested on native.

Expo Audio plays bundled versions of the browser's procedural tool sounds. No
microphone permission or background audio is enabled. The root `hunter-engine`,
`hunter-scene`, `hunter-collisions` and mobile selector tests cover shared rules and
integration. Device testing is still required for touch feel and GPU performance.

Native verification currently has an open rendering finding: the iOS 26.5 simulator
shows missing near-ground triangles. It persists with an unlit material, fog disabled,
backface culling disabled, and the sky drawn first. Its OpenGL renderer runs in
software; whether this also affects physical devices is not yet verified. Check the
ground, simultaneous controls, rotation, and background/resume on the first TestFlight
build before approving the beta. The browser scene renders correctly.

## Expo and TestFlight beta delivery

Expo project: `@viggo-games/viggo-games`, owned by the Viggo Games organization.
The `testflight` profile is an App Store distribution build on the dedicated
`testflight` update channel, using the `preview` EAS environment. This uploads a
beta for TestFlight; it does not submit a public App Store release for review.

```sh
npm run build:testflight
npm run submit:testflight -- --id <successful-build-id>
npm run update:testflight -- --message "Describe the tested change"
```

The first build requires Apple Developer access to register `games.viggo`, create a
distribution certificate/provisioning profile, and select or create its App Store
Connect app. Submission may also require Apple login/2FA or an App Store Connect API
key. Keep credentials in Apple/Expo's secure stores, never in this repository.

Install the new beta through TestFlight first. EAS Update can then deliver compatible
JavaScript and asset updates when the app restarts. Adding native modules (including
the initial Expo GL/audio/updates addition) requires another TestFlight build.
Fingerprint runtime versions prevent incompatible updates reaching older binaries.
Production has its own channel; do not publish there until device testing is approved.

EAS manages build numbers remotely. When the Apple app is linked, set its numeric
`ascAppId` under `submit.testflight.ios` in `eas.json` to make subsequent submissions
noninteractive. Do not guess the ID or select a different developer team.
