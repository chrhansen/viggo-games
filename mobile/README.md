# Viggo Games Mobile

Native iOS and Android app built with React Native and Expo. The current checkpoint contains only the native splash and game-selector landing screen. It does not embed the website and it does not ship game code yet.

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
- Chicken Hop is the first planned native game, but it is intentionally excluded until the landing screen is approved.

Any future analytics, third-party SDK, account, communication, or external-link feature needs a child-privacy review before implementation.
