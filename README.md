# viggo.games

Production/source-of-truth repo for `viggo.games`.

This repo owns:

- the homepage shell at `https://viggo.games/`
- the hosted game code under `https://viggo.games/games/<slug>/`
- the native Expo app under `mobile/`
- the GitHub Pages deploy for the custom domain
- current live games/slots: `chicken-hop`, `hunter-guy`, `burb`, `gunny`, `torpedo`

Do not treat the old single-game repos as deploy targets anymore. The game code that matters now lives here.

## Where code comes from

- Homepage UI source started in `chrhansen/viggo-games-lovable`
- Chicken Hop source was copied in from `chrhansen/chicken-hop`; local sibling repo: `/Users/chrh/dev/chicken-hop`
- Hunter Guy source was copied in from `chrhansen/hunter-guy`; local sibling repo: `/Users/chrh/dev/hunter-guy`
- Burb source is synced in from local authoring folder `/Users/chrh/dev/burb`
- Gunny source is synced in from local authoring folder `/Users/chrh/dev/gunny`
- Torpedo source is synced in from local authoring folder `/Users/chrh/dev/torpedo`

This repo is now the place to edit and deploy all of it.

The old Lovable repo is still useful as an upstream design/source reference. This repo keeps a `source-lovable` git remote for that purpose. If Lovable changes need to come over:

```sh
git fetch source-lovable
git diff <old-commit> <new-commit>
```

Then port the changes intentionally. Do not blindly overwrite repo-specific wiring in this repo.

## Repo map

- `.github/`
  - GitHub Actions config
  - Pages deploy workflow lives in `.github/workflows/pages.yml`
  - mobile web, shared-core, and native bundle checks live in `.github/workflows/mobile.yml`
- `public/`
  - static files shipped as-is
  - custom domain file lives in `public/CNAME`
- `public/games/`
  - hosted game payloads grouped by slug
- `games/chicken-hop/`
  - Chicken Hop browser entrypoint, Canvas renderer, web input, audio, and UI
- `packages/chicken-hop-core/`
  - platform-neutral Chicken Hop state, physics, spawning, collisions, and events
- `public/games/chicken-hop/`
  - Chicken Hop static stylesheet and operating notes copied into the build
- `public/games/hunter-guy/`
  - full Hunter Guy source
- `public/games/burb/`
  - deploy-ready Burb build at folder root
- `public/games/burb/source/`
  - editable Burb source snapshot synced from `/Users/chrh/dev/burb`
- `public/games/gunny/`
  - deploy-ready Gunny build at folder root
- `public/games/gunny/source/`
  - editable Gunny source snapshot synced from `/Users/chrh/dev/gunny`
- `public/games/torpedo/`
  - deploy-ready Torpedo build at folder root
- `public/games/torpedo/source/`
  - editable Torpedo source snapshot synced from `/Users/chrh/dev/torpedo`
- `scripts/`
  - build/deploy helper scripts
  - `prepare-pages.mjs` prepares and validates static route pages, `404.html`, `sitemap.xml`, and LLM crawler files after Vite builds
- `mobile/`
  - native React Native and Expo app for iOS and Android phones
  - owns its dependencies, build profiles, native assets, landing screen, and mobile CI gate
- `docs/seo.md`
  - search metadata, canonical URL, content, and post-deploy indexing rules
- `src/`
  - React/Vite homepage app
  - routing, cards, descriptive game landing pages, and on-demand iframe player
- `src/assets/`
  - homepage card art, using optimized WebP title images
- `src/components/`
  - homepage UI components
- `src/data/`
  - game registry data
  - `src/data/games.json` defines slug, label, SEO copy, image filename, controls, genre, and hosted URL paths
  - `src/data/games.ts` maps registry rows to imported homepage artwork and runtime URLs
- `src/hooks/`
  - shared React hooks
- `src/lib/`
  - shared utilities
  - `src/lib/app-base.ts` handles custom-domain vs GitHub Pages base paths
- `src/pages/`
  - homepage route, about route, game wrapper route, not-found route
- `src/test/`
  - Vitest setup and app tests
- `dist/`
  - build output only; do not edit by hand

## What to edit

- Homepage layout, card UI, iframe wrapper, routing:
  - edit files in `src/`
- Chicken Hop rules and tuning shared by browser and native:
  - edit `packages/chicken-hop-core/`
- Chicken Hop browser rendering, controls, audio, and browser persistence:
  - edit `games/chicken-hop/`
- Chicken Hop native rendering and phone controls:
  - edit `mobile/src/components/chicken-hop/` and the thin adapter in `mobile/src/game/chicken-hop/engine.ts`
- Other game-specific logic, controls, art, tuning:
  - edit files inside that game's folder under `public/games/<slug>/`
  - for bundled games like `burb`, `gunny`, and `torpedo`, edit `public/games/<slug>/source/` and rebuild the deploy files at folder root
- Game-specific docs:
  - keep them in `public/games/<slug>/README.md`
  - do not put game-specific operating notes in this top-level README

## Local dev

Install deps:

```sh
npm ci
```

Run the homepage app locally:

```sh
npm run dev
```

This serves the React shell and the bundled Chicken Hop browser entrypoint. Other static games are loaded from `public/games/...`.

If a specific game has its own preferred local workflow, use that game's README.

## Mobile app

The native app is separate from the Vite website renderer and does not use a WebView. Chicken Hop imports the same platform-neutral game engine as the browser build. Install and run it from its own folder:

```sh
cd mobile
npm ci
npm run ios
# or: npm run android
```

See `mobile/README.md` for the mobile gate, environment requirements, and child-directed product constraints.

## Analytics

- Umami is installed at the shell level in `index.html`
- Initial pageviews come from the standard Umami script
- Client-side route changes are tracked from the React shell
- Custom events currently tracked from the React shell:
  - `Game Start`
  - `Game Exit`

## Burb Sync

Local Burb work currently starts in `/Users/chrh/dev/burb`.

To refresh the vendored source snapshot in this repo:

```sh
rsync -a --delete \
  --exclude .git \
  --exclude node_modules \
  --exclude dist \
  /Users/chrh/dev/burb/ \
  /Users/chrh/dev/viggo-games/public/games/burb/source/
```

Then rebuild the deploy files with relative asset paths:

```sh
cd /Users/chrh/dev/viggo-games/public/games/burb/source
npm run build -- --base ./ --outDir /tmp/burb-dist
```

Copy `/tmp/burb-dist/index.html` and `/tmp/burb-dist/assets/` into `/Users/chrh/dev/viggo-games/public/games/burb/`.

## Gunny Sync

Local Gunny work currently starts in `/Users/chrh/dev/gunny`.

To refresh the vendored source snapshot in this repo:

```sh
rsync -a --delete \
  --exclude .git \
  --exclude node_modules \
  --exclude dist \
  /Users/chrh/dev/gunny/ \
  /Users/chrh/dev/viggo-games/public/games/gunny/source/
```

Then rebuild the deploy files with relative asset paths:

```sh
cd /Users/chrh/dev/viggo-games/public/games/gunny/source
npm run build -- --base ./ --outDir /tmp/gunny-dist
```

Copy `/tmp/gunny-dist/index.html` and `/tmp/gunny-dist/assets/` into `/Users/chrh/dev/viggo-games/public/games/gunny/`.

## Torpedo Sync

Local Torpedo work currently starts in `/Users/chrh/dev/torpedo`.

To refresh the vendored source snapshot in this repo:

```sh
rsync -a --delete \
  --exclude .git \
  --exclude node_modules \
  --exclude dist \
  /Users/chrh/dev/torpedo/ \
  /Users/chrh/dev/viggo-games/public/games/torpedo/source/
```

Then rebuild the deploy files with relative asset paths:

```sh
cd /Users/chrh/dev/viggo-games/public/games/torpedo/source
npm run build -- --base=./ --outDir /tmp/torpedo-dist
```

Copy `/tmp/torpedo-dist/index.html` and `/tmp/torpedo-dist/assets/` into `/Users/chrh/dev/viggo-games/public/games/torpedo/`.

## Adding a new game

1. Copy the full game source into `public/games/<slug>/` or `public/games/<slug>/source/` if the game needs a build step
2. Add or update `public/games/<slug>/README.md` with game-specific instructions
3. Add homepage title artwork to `src/assets/`
   - Title images are always WebP
   - Keep the source image sharp and high quality, but encode it for web delivery
   - Do not over-downsample; optimize format/quality before reducing dimensions
4. Register the game in `src/data/games.json` and map its artwork in `src/data/games.ts`
5. Point the game URL at `withBasePath("/games/<slug>/")`
6. Add accurate how-to steps, tips, image alt text, and a unique search title to the registry
7. If the game needs special iframe handling, update `src/pages/GamePage.tsx`
8. Run the gate
9. Push to `main` to deploy

Rules:

- Copy source, not just a production build
- If the game uses Vite or another bundler, keep deploy files at `public/games/<slug>/` and source under `public/games/<slug>/source/`
- Prefer relative asset paths inside each game folder so static hosting from `/games/<slug>/` works
- Keep each game's behavior/docs self-contained in its own folder

## Gate

```sh
npm run lint
npm run typecheck
npm run test
npm run build
```

`npm run build` also writes `dist/404.html` so SPA routes work on GitHub Pages.
It also writes static HTML entrypoints for each public route, `dist/sitemap.xml`, `dist/llms.txt`, `dist/llms-full.txt`, and SEO image copies under `dist/seo/`.
The build validates canonical URL shape, static fallback content, sitemap entries, and direct-game canonical tags. See `docs/seo.md` before changing public routes or metadata.

## Deploy

Pushes to `main` trigger GitHub Actions in `.github/workflows/pages.yml`.

Deploy flow:

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run test`
5. `npm run build`
6. upload `dist/`
7. deploy to GitHub Pages

Pages/domain notes:

- Preview/default Pages URL: `https://chrhansen.github.io/viggo-games/`
- Custom domain target: `https://viggo.games/`
- GitHub Pages must stay enabled on this repo and set to build from GitHub Actions
- `public/CNAME` must stay in place for the custom domain

## Notes For Future Agents

- This repo is the deploy target
- Local sibling repo for Chicken Hop: `/Users/chrh/dev/chicken-hop`
- Local sibling repo for Hunter Guy: `/Users/chrh/dev/hunter-guy`
- Local sibling repo for Burb: `/Users/chrh/dev/burb`
- Local sibling repo for Gunny: `/Users/chrh/dev/gunny`
- Local sibling repo for Torpedo: `/Users/chrh/dev/torpedo`
- `chicken-hop` is a Vite multi-page entry under `games/chicken-hop/`; `hunter-guy` remains hosted from `public/games/`
- Root homepage code and game source code are intentionally separate
- Burb authoring source lives at `/Users/chrh/dev/burb`; sync it into `public/games/burb/source/` before rebuilding deploy files
- Gunny authoring source lives at `/Users/chrh/dev/gunny`; sync it into `public/games/gunny/source/` before rebuilding deploy files
- Torpedo authoring source lives at `/Users/chrh/dev/torpedo`; sync it into `public/games/torpedo/source/` before rebuilding deploy files
- If syncing new Lovable work, diff it first and preserve repo-specific files like:
  - `src/data/games.ts`
  - `src/lib/app-base.ts`
  - `.github/workflows/pages.yml`
  - `public/CNAME`
  - `scripts/prepare-pages.mjs`
