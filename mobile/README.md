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

## Product constraints

- Phones only for the first release. iPad support is disabled; Android layouts target compact phone screens.
- Child-directed app: no analytics, advertising, accounts, external links, or data collection. Production requests no runtime permissions; development clients may request local-network access to reach Metro.
- No WebView. Games must be implemented with React Native and Expo-compatible native libraries.
- Chicken Hop is implemented with React Native views and a TypeScript game engine; it does not reuse the browser canvas or WebView.

Any future analytics, third-party SDK, account, communication, or external-link feature needs a child-privacy review before implementation.

## Chicken Hop

Tap Chicken Hop on the selector, name the chicken, and choose one of four designs and six colors before starting the run. The chosen look stays active for the current game screen.

- Hold left or right to move.
- Tap Hop to jump; keep holding it while airborne to fly.
- Land on obstacle tops safely. Front collisions drain two 100-point hearts.
- Regular corn gives `+1 Corn` and `+60 Score`; gold corn gives `+3 Corn` and `+180 Score`.
- Eggs remove one corn, never health, and never reduce corn below zero.
- Flight has five seconds of fuel and refills after resting on the floor.
- Leaving the app pauses an active run automatically.

This review slice intentionally defers shelves and stairs, sound effects, particles, persistent personalization, and persistent best-score storage. Those should follow after the native movement and game feel are approved.
