# viggo.games

Self-contained source repository for the website, all five games, and the native Expo app. Games are ordinary tracked folders, not Git submodules. No sibling checkout, external source remote, or manual source synchronization is required.

## Repository map

| Folder | Purpose |
| --- | --- |
| `games/chicken-hop/` | Chicken Hop browser renderer, controls, audio, styles, and entrypoint |
| `games/chicken-hop/core/` | Platform-neutral Chicken Hop rules shared by browser and native |
| `games/hunter-guy/` | Shared Hunter Guy engine/Three.js scene/assets and browser adapters |
| `games/hunter-guy/core/` | Platform-neutral Hunter Guy gameplay shared by browser and native |
| `games/burb/` | Shared Burb engine, Three.js scene, texture recipes and browser controls |
| `games/burb/core/` | Platform-neutral Burb movement, speed, steering and collisions |
| `games/gunny/` | Shared Gunny engine, Three.js scene, models, planet assets and browser adapter |
| `games/gunny/core/` | Platform-neutral Gunny flight, combat, spawning and mission rules |
| `games/torpedo/` | Torpedo source, submarine combat, interior rooms, and artwork |
| `src/` | React website, game cards, descriptive landing pages, and iframe player |
| `mobile/` | Native Expo shell, About page, and four games with native rendering/controls |
| `public/` | Website static files, including `CNAME`; no copied game builds |
| `scripts/` | Build and deployment validation |
| `.github/workflows/` | Website deployment and mobile checks |
| `docs/seo.md` | Search metadata, canonical URLs, and indexing rules |
| `dist/` | Generated website and all five games; ignored by Git |

Each game's README describes its controls, architecture, and maintenance. Native platform adapters stay under `mobile/`; shared gameplay rules live under each ported game’s `core/` directory.

## Game availability

| Game | Browser | React Native app |
| --- | --- | --- |
| [Chicken Hop](games/chicken-hop/README.md) | Playable | Playable on iOS/Android; shared rules, separate renderers |
| [Hunter Guy](games/hunter-guy/README.md) | Playable | Playable on iOS/Android; shared rules, Three.js scene, models and assets |
| [Burb](games/burb/README.md) | Playable | Playable on iOS/Android; shared engine and Three.js scene; landscape tilt in iOS TestFlight build (12) |
| [Gunny](games/gunny/README.md) | Playable | Native iOS/Android implementation; shared engine and Three.js scene; iOS TestFlight build (13), device acceptance pending |
| [Torpedo](games/torpedo/README.md) | Playable | Detail preview; not ported |

Chicken Hop, Hunter Guy, Burb and Gunny are included in one **Viggo Games** iOS app.
Internal TestFlight beta **0.1.0 (13)** is available as of **2026-10-06**, with
Gunny's native mission and touch controls, plus About below the game list and on
every game detail page. The signed installer and bundled assets were verified;
Apple reports `VALID` and `IN_BETA_TESTING` for the internal **Team (Expo)** group.
Install through **TestFlight → Viggo Games → Update**. Gunny's physical iPhone
acceptance remains pending.
Internal TestFlight beta **0.1.0 (12)** was delivered on **2026-10-05**, with
Burb landscape roll steering, portrait buttons and **Center Tilt**. Install through
**TestFlight → Viggo Games → Update**. The signed installer includes the native
motion module and permission prompt. Christian tested build (12) on his iPhone
and reported that it looked great; broader beta testing remains ongoing.
Christian reported that Burb in build (11) was a good first start. That installer
embedded Burb after a compatible Expo update did not appear in the installed app.
Internal TestFlight beta **0.1.0 (10)** is available as of **2026-10-04**, with full game title
images, a solid black arcade/detail background, and Hunter Guy scenery that follows
the finger on both axes. Christian installed build (10) and reported that it looked
good on iPhone; this is basic device acceptance, with broader beta testing ongoing.
This is not a public App Store release. Android implementation and bundle checks
are complete; Android device testing and store distribution remain pending.

## Install and develop

Use Node.js 22.12 or later and npm. From the repository root:

```sh
npm ci
npm run dev
```

The root lockfile installs all browser-game workspaces. One server serves the website and every game:

- `http://localhost:8080/`
- `http://localhost:8080/games/chicken-hop/`
- `http://localhost:8080/games/hunter-guy/`
- `http://localhost:8080/games/burb/`
- `http://localhost:8080/games/gunny/`
- `http://localhost:8080/games/torpedo/`

If needed, run only one standalone game using `npm run dev --workspace gunny` (also supported for `burb`, `hunter-guy`, and `torpedo`). Stop local servers when testing is finished.

Games retain their own declared library versions. Hunter Guy's Three.js is installed and bundled locally. Third-party packages still come from npm; optional Google Fonts and website analytics are network services, not external game-source dependencies.

## Build and verify

```sh
npm run lint
npm run typecheck
npm test -- --maxWorkers=1
npm run build
```

The tests include Gunny's lightweight Node checks followed by the website and game regressions. Typechecking includes Burb's stricter configuration. A single Vite build compiles all five game entrypoints from `games/` and writes playable pages to `dist/games/<slug>/`. Do not commit generated bundles or copy files into `public/games/`.

The build also prepares and validates descriptive route pages, canonical tags, `404.html`, `sitemap.xml`, `llms.txt`, `llms-full.txt`, and SEO artwork. Run `npm run preview` to serve the built site. See [SEO documentation](docs/seo.md) before changing routes or metadata.

## Native app

The native app uses Expo SDK 57, React Native and TypeScript, without a WebView. It consumes the local shared Chicken Hop core, Hunter Guy engine/scene and Burb engine/scene and keeps a separate dependency lockfile to isolate Expo/React Native versions:

```sh
cd mobile
npm ci
npm run ios
# or: npm run android
```

The entire repository must be checked out; local game dependencies resolve to `../games/chicken-hop/core/`, `../games/hunter-guy/` and `../games/burb/` within it. See [mobile/README.md](mobile/README.md) for platform requirements, native checks, and child-directed product constraints.

For iPhone installation, accept the internal TestFlight invitation and install
**Viggo Games**, then select Hunter Guy or Chicken Hop and tap **Play now** on its
detail page. See [beta delivery](mobile/README.md#expo-and-testflight-beta-delivery)
for EAS Build, TestFlight submission and compatible JavaScript/asset updates.

## What to edit

- Game logic, controls, artwork, tuning, and documentation: `games/<slug>/`.
- Shared Chicken Hop rules: `games/chicken-hop/core/`; retain browser/native parity coverage.
- Shared Hunter Guy rules and 3D scene: `games/hunter-guy/core/` and `games/hunter-guy/scene.js`.
- Shared Burb rules and 3D scene: `games/burb/core/` and `games/burb/src/scene.ts`; regenerate native textures after editing `games/burb/src/texture-art.ts`.
- Native rendering and phone lifecycle: `mobile/src/`.
- Website layout, navigation, and embedded-player behavior: `src/`.
- Shared website/mobile descriptions, how-to steps and tips, plus website routes and SEO copy: `src/data/games.json`; website artwork mapping: `src/data/games.ts`.
- Website card art: optimized WebP files in `src/assets/`.
- Website favicon: `public/favicon.ico`, resized from the iPhone VG artwork in
  `mobile/assets/app-icon.png`. Regenerate with ImageMagick:
  `magick mobile/assets/app-icon.png -define icon:auto-resize=64,48,32,16 public/favicon.ico`.

Keep edits in this repository. There is no external authoring folder or source-sync step.

## Adding a game

1. Add its full source and README to `games/<slug>/`.
2. If it needs package dependencies, add its package manifest to root `workspaces` and update the root lockfile with `npm install`.
3. Add its HTML entrypoint to `vite.config.ts`.
4. Register its route, controls, genre, SEO copy, and artwork in `src/data/games.json` and `src/data/games.ts`.
5. Keep the direct playable URL at `/games/<slug>/`, with the descriptive landing page at `/<slug>/`.
6. Run the full gate above. Generated output belongs only in `dist/`.

Prefer relative imports and asset paths so games also work under a GitHub Pages base path.

## Deployment

Pushes to `main` trigger `.github/workflows/pages.yml`: install from the root lockfile, lint, typecheck, test, build all games, and deploy `dist/` to GitHub Pages.

- Production: `https://viggo.games/`
- Pages preview: `https://chrhansen.github.io/viggo-games/`
- Preserve `public/CNAME` and GitHub Pages' Actions configuration.
- `.github/workflows/mobile.yml` validates shared gameplay and native bundles.

Pushing to `main` deploys the website and runs mobile checks; it does not publish a
new phone binary or Expo update. Mobile delivery is a separate, explicit EAS step
under `@viggo-games/viggo-games`. TestFlight uses the `testflight` update channel;
public App Store release remains a separate decision after beta testing.

The website's Umami integration in `index.html` tracks pageviews and the `Game Start`/`Game Exit` events. The native app has no analytics.
