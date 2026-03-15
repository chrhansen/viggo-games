# viggo.games

Production/source-of-truth repo for `viggo.games`.

This repo owns:

- the homepage shell at `https://viggo.games/`
- the hosted game code under `https://viggo.games/games/<slug>/`
- the GitHub Pages deploy for the custom domain
- current live games/slots: `chicken-hop`, `hunter-guy`, `burb`, `gunny`

Do not treat the old single-game repos as deploy targets anymore. The game code that matters now lives here.

## Where code comes from

- Homepage UI source started in `chrhansen/viggo-games-lovable`
- Chicken Hop source was copied in from `chrhansen/chicken-hop`
- Hunter Guy source was copied in from `chrhansen/hunter-guy`
- Burb source is synced in from local authoring folder `/Users/chrh/dev/burb`
- Gunny source is synced in from local authoring folder `/Users/chrh/dev/gunny`

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
- `public/`
  - static files shipped as-is
  - custom domain file lives in `public/CNAME`
- `public/games/`
  - hosted game payloads grouped by slug
- `public/games/chicken-hop/`
  - full Chicken Hop source
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
- `scripts/`
  - build/deploy helper scripts
  - `prepare-pages.mjs` copies `dist/index.html` to `dist/404.html`
- `src/`
  - React/Vite homepage app
  - routing, cards, iframe wrapper
- `src/assets/`
  - homepage card art, including `gunny.png`
- `src/components/`
  - homepage UI components
- `src/data/`
  - game registry data
  - `src/data/games.ts` defines slug, label, image, color, hosted URL
- `src/hooks/`
  - shared React hooks
- `src/lib/`
  - shared utilities
  - `src/lib/app-base.ts` handles custom-domain vs GitHub Pages base paths
- `src/pages/`
  - homepage route, game wrapper route, not-found route
- `src/test/`
  - Vitest setup and app tests
- `dist/`
  - build output only; do not edit by hand

## What to edit

- Homepage layout, card UI, iframe wrapper, routing:
  - edit files in `src/`
- Game-specific logic, controls, art, tuning:
  - edit files inside that game's folder under `public/games/<slug>/`
  - for bundled games like `burb` and `gunny`, edit `public/games/<slug>/source/` and rebuild the deploy files at folder root
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

This serves the React shell. The static games are loaded from `public/games/...`.

If a specific game has its own preferred local workflow, use that game's README.

## Analytics

- Plausible is installed at the shell level in `index.html`
- SPA pageviews are handled by the Plausible script
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

## Adding a new game

1. Copy the full game source into `public/games/<slug>/` or `public/games/<slug>/source/` if the game needs a build step
2. Add or update `public/games/<slug>/README.md` with game-specific instructions
3. Add homepage artwork to `src/assets/`
4. Register the game in `src/data/games.ts`
5. Point the game URL at `withBasePath("/games/<slug>/")`
6. If the game needs special iframe handling, update `src/pages/GamePage.tsx`
7. Run the gate
8. Push to `main` to deploy

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
- `chicken-hop` and `hunter-guy` are hosted from subfolders here
- Root homepage code and game source code are intentionally separate
- Burb authoring source lives at `/Users/chrh/dev/burb`; sync it into `public/games/burb/source/` before rebuilding deploy files
- Gunny authoring source lives at `/Users/chrh/dev/gunny`; sync it into `public/games/gunny/source/` before rebuilding deploy files
- If syncing new Lovable work, diff it first and preserve repo-specific files like:
  - `src/data/games.ts`
  - `src/lib/app-base.ts`
  - `.github/workflows/pages.yml`
  - `public/CNAME`
  - `scripts/prepare-pages.mjs`
