# Viggo Games Mobile

Native iOS and Android app built with React Native and Expo. It includes the native splash, game selector, and the first playable native Chicken Hop slice. It does not embed the website.

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

Mobile CI runs this gate plus the root web/test gate for changes to the mobile app, shared Chicken Hop core, browser adapter, parity tests, or the workflow itself.

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
