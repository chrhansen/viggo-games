# viggo.games

Self-contained source repository for the website, all five games, and the native Expo app. Games are ordinary tracked folders, not Git submodules. No sibling checkout, external source remote, or manual source synchronization is required.

## Repository map

| Folder | Purpose |
| --- | --- |
| `games/chicken-hop/` | Chicken Hop browser renderer, controls, audio, styles, and entrypoint |
| `games/chicken-hop/core/` | Platform-neutral Chicken Hop rules shared by browser and native |
| `games/hunter-guy/` | Hunter Guy source, procedural forest, animals, controls, and audio |
| `games/burb/` | Burb source, scenery, bike controls, and collisions |
| `games/gunny/` | Gunny source, starfield, combat, and hull warnings |
| `games/torpedo/` | Torpedo source, submarine combat, interior rooms, and artwork |
| `src/` | React website, game cards, descriptive landing pages, and iframe player |
| `mobile/` | Native Expo shell, Chicken Hop and Hunter Guy rendering/controls |
| `public/` | Website static files, including `CNAME`; no copied game builds |
| `scripts/` | Build and deployment validation |
| `.github/workflows/` | Website deployment and mobile checks |
| `docs/seo.md` | Search metadata, canonical URLs, and indexing rules |
| `dist/` | Generated website and all five games; ignored by Git |

Each game's README describes its controls, architecture, and maintenance. Native platform adapters stay under `mobile/`; shared gameplay rules live under each ported game’s `core/` directory.

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

The native app uses React Native rather than a WebView. It consumes the local shared Chicken Hop core and Hunter Guy engine/scene and keeps a separate dependency lockfile to isolate Expo/React Native versions:

```sh
cd mobile
npm ci
npm run ios
# or: npm run android
```

The entire repository must be checked out; the core dependency resolves to `../games/chicken-hop/core/` within it. See [mobile/README.md](mobile/README.md) for platform requirements, native checks, and child-directed product constraints.

## What to edit

- Game logic, controls, artwork, tuning, and documentation: `games/<slug>/`.
- Shared Chicken Hop rules: `games/chicken-hop/core/`; retain browser/native parity coverage.
- Shared Hunter Guy rules and 3D scene: `games/hunter-guy/core/` and `games/hunter-guy/scene.js`.
- Native rendering and phone lifecycle: `mobile/src/`.
- Website layout, navigation, and embedded-player behavior: `src/`.
- Game registry and SEO copy: `src/data/games.json`; artwork mapping: `src/data/games.ts`.
- Website card art: optimized WebP files in `src/assets/`.

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

The website's Umami integration in `index.html` tracks pageviews and the `Game Start`/`Game Exit` events. The native app has no analytics.
