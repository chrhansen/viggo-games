# Viggo Games Mobile

Native iOS and Android app built with React Native and Expo. It includes the native splash, game selector, game detail pages, and playable native Chicken Hop and Hunter Guy. It does not embed the website.

Read this when developing either native game, checking browser/native ownership,
or delivering an iPhone beta or Expo update.

## Delivery status

As of **2026-10-01**, **Viggo Games 0.1.0 (7)** is available to the internal
`Team (Expo)` TestFlight group. It includes both Chicken Hop and Hunter Guy in one
iOS app with bundle identifier `games.viggo`. The owner received the invitation,
reported that the earlier build (6) looked good, and approved merging the implementation.
Install from the TestFlight invitation, choose a game, then tap **Play now** on its
detail page.
There is no public App Store release yet.

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
native fingerprint changes require the next TestFlight binary; they have not been
published as an Expo update to build (7).
The refreshed dependency set passes Expo Doctor's 20 checks and both native exports.

Both games also have Android implementations and passing Android export checks.
An Android device/store build has not been delivered in this work. Burb, Gunny and
Torpedo have preview detail pages in the native selector; their browser games work,
but they have not been ported to React Native.

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

Select a mission to open its detail page with artwork, instructions, touch controls
and tips. Descriptions and gameplay instructions come from the website's shared
`../src/data/games.json`; phone controls stay native. Only **Play now** opens a
playable game. Missions not yet ported show details with **Coming to mobile**.

Swipe-back navigation is disabled throughout the native stack, so horizontal drags
remain game input. The top-left game arrow and Android back button show an exit
confirmation. Games pause while the dialog is open; **Keep playing** resumes a
previously active game, and **Exit game** ends it and returns to its detail page.
Canceling from a paused game leaves it paused. A direct game link without navigation
history returns to the arcade after confirmation.

## Product constraints

- Phones only for the first release. iPad support is disabled; Android layouts target compact phone screens.
- Child-directed app: no analytics, advertising, accounts, external links, or data collection. Production requests no runtime permissions; development clients may request local-network access to reach Metro.
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
The forest follows the finger on both axes; shared `lookDelta` sets touch look speed
to 0.0021 radians per pixel, half the previous speed.
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
or install a new app. Pushing to GitHub `main` runs CI and deploys the website only.
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
