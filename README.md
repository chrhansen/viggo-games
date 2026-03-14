# viggo.games

Production/source-of-truth repo for `viggo.games`.

This repo owns:

- the homepage shell at `https://viggo.games/`
- the hosted game code under `https://viggo.games/games/<slug>/`
- the GitHub Pages deploy for the custom domain

Do not treat the old single-game repos as deploy targets anymore. The game code that matters now lives here.

## Where code comes from

- Homepage UI source started in `chrhansen/viggo-games-lovable`
- Chicken Hop source was copied in from `chrhansen/chicken-hop`
- Hunter Guy source was copied in from `chrhansen/hunter-guy`

This repo is now the place to edit and deploy all of it.

The old Lovable repo is still useful as an upstream design/source reference. This repo keeps a `source-lovable` git remote for that purpose. If Lovable changes need to come over:

```sh
git fetch source-lovable
git diff <old-commit> <new-commit>
```

Then port the changes intentionally. Do not blindly overwrite repo-specific wiring in this repo.

## Repo map

- `src/`
  - React/Vite homepage app
  - game hub cards
  - fullscreen game wrapper route
- `src/data/games.ts`
  - registry for games shown on the homepage
  - slug, label, image, color, hosted URL
- `src/lib/app-base.ts`
  - base-path handling so the site works on both the custom domain and the GitHub Pages fallback URL
- `src/assets/`
  - card art / homepage assets
- `public/games/chicken-hop/`
  - full Chicken Hop source
- `public/games/hunter-guy/`
  - full Hunter Guy source
- `public/CNAME`
  - custom domain for GitHub Pages
- `.github/workflows/pages.yml`
  - build + deploy workflow
- `scripts/prepare-pages.mjs`
  - copies `dist/index.html` to `dist/404.html` so SPA routes work on GitHub Pages
- `dist/`
  - build output only; do not edit by hand

## What to edit

- Homepage layout, card UI, iframe wrapper, routing:
  - edit files in `src/`
- Game-specific logic, controls, art, tuning:
  - edit files inside that game's folder under `public/games/<slug>/`
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

## Adding a new game

1. Copy the full game source into `public/games/<slug>/`
2. Add or update `public/games/<slug>/README.md` with game-specific instructions
3. Add homepage artwork to `src/assets/`
4. Register the game in `src/data/games.ts`
5. Point the game URL at `withBasePath("/games/<slug>/")`
6. If the game needs special iframe handling, update `src/pages/GamePage.tsx`
7. Run the gate
8. Push to `main` to deploy

Rules:

- Copy source, not just a production build
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
- If syncing new Lovable work, diff it first and preserve repo-specific files like:
  - `src/data/games.ts`
  - `src/lib/app-base.ts`
  - `.github/workflows/pages.yml`
  - `public/CNAME`
  - `scripts/prepare-pages.mjs`
