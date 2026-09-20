# Burb

Browser cycling game. Live deploy files at this folder root. Editable app source in `source/`.

## Deployment

- Production URL: `https://viggo.games/games/burb/`
- Embedded on homepage route: `https://viggo.games/burb/`
- Repo owner: `chrhansen/viggo-games`
- Hosting: GitHub Pages from the umbrella repo
- Deploy workflow: `/Users/chrh/dev/viggo-games/.github/workflows/pages.yml`
- Trigger: push to `main` in `chrhansen/viggo-games`

## Folder Layout

- `index.html`
  - deploy entrypoint served by GitHub Pages
- `assets/`
  - built JS/CSS emitted by Vite with relative asset paths
- `source/`
  - authoritative TypeScript + Three.js source for the deployed game

## Source of Truth

Edit `source/` in this repository. `/Users/chrh/dev/burb` is a historical authoring copy; do not sync it over this folder wholesale. Compare any changes there and port them deliberately so current collision and scenery work is preserved.

## Local Dev

Use the source app:

```bash
cd /Users/chrh/dev/viggo-games/public/games/burb/source
npm ci
npm run dev -- --port 4174
```

Open `http://127.0.0.1:4174/`; port 4173 can remain available for Hunter Guy.

If you need motion access over a remote HTTPS host such as Tailscale Serve, add a local `.env` in `source/`:

```bash
BURB_ALLOWED_HOSTS=macbook-pro-1.tailcc07d5.ts.net
```

## Rebuild Deploy Files

Build from `source/` with a relative base so the game works from `/games/burb/`:

```bash
cd /Users/chrh/dev/viggo-games/public/games/burb/source
npm run build -- --base ./ --outDir /tmp/burb-dist
```

Then copy `/tmp/burb-dist/index.html` plus the referenced files in `/tmp/burb-dist/assets/` into this folder. Remove superseded generated bundles with `trash`. Commit the source, rebuilt entrypoint, and assets together. Run the root repository gate before publishing.

## Controls

- `W` / `ArrowUp`: faster
- `S` / `ArrowDown`: slower
- `A` / `ArrowLeft`: steer left
- `D` / `ArrowRight`: steer right
- Touch: `Left`, `Right`, `Fast`, `Slow`
- Touch tilt: `Enable tilt`, hold upright to center, lean left/right to steer
- Control labels disable text selection and iOS touch callouts so holding a button does not bring up copy/paste menus.

## Source Notes

- Original source README lives at `source/README.md`
- The homepage card art/registry live outside this folder in:
  - `/Users/chrh/dev/viggo-games/src/assets/burb.webp`
  - `/Users/chrh/dev/viggo-games/src/data/games.ts`

## Collision and scenery detail

- Bike movement stops or slides against tree trunks and mountain bases, with speed reduced on impact. Steering remains available to ride away.
- Collision uses a local spatial grid and small movement steps to avoid crossing thin trunks at high speed. Mountain boundaries follow their generated base geometry, including overlapping foothills.
- The full road loop and shoulders are kept clear of mountain footprints. Shrubs, roadside posts, and signs remain decorative.
- Mountains use vertex colors for green lower slopes, ridged rock, and uneven snow lines on the actual peaks. Trees have shared bark texture, tapered trunks, and irregular layered foliage. No extra animated foliage or shadows.
- `source/src/collisions.ts` owns movement constraints; `mountains.ts` owns peak geometry and bounds; `tree-detail.ts` owns bark and pine detail; `route.ts` owns the shared route and surface sampling.
- Regression tests: run `npm test -- src/test/burb-collisions.test.ts` from the umbrella repository. Run Burb's own build to typecheck its source.
