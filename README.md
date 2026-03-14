# viggo.games

Umbrella repo for the `viggo.games` homepage plus the hosted game builds.

## Structure

- `src/`: React/Vite homepage from `viggo-games-lovable`
- `public/games/chicken-hop/`: static Chicken Hop game
- `public/games/hunter-guy/`: static Hunter Guy game

## Local dev

```sh
npm ci
npm run dev
```

## Gate

```sh
npm run lint
npm run typecheck
npm run test
npm run build
```

`npm run build` also writes `dist/404.html` so SPA routes work on GitHub Pages.

## Deploy

GitHub Actions builds and deploys `dist/` to Pages.

- Preview/default Pages URL: `https://chrhansen.github.io/viggo-games/`
- Custom domain target: `https://viggo.games/`
