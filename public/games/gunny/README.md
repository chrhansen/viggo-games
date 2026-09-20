# Gunny

Browser space shooter. Deploy files at this folder root. Authoritative editable source in `source/`.

## Deployment

- Production URL: `https://viggo.games/games/gunny/`
- Embedded on homepage route: `https://viggo.games/gunny/`
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
  - current editable game source

## Source of Truth

Edit `source/` here. `/Users/chrh/dev/gunny` is a historical authoring copy; compare and port changes deliberately rather than overwriting current gameplay work.

## Local Dev

Use the source app:

```bash
cd /Users/chrh/dev/viggo-games/public/games/gunny/source
npm install
npm run dev
```

## Rebuild Deploy Files

Build from `source/` with a relative base so the game works from `/games/gunny/`:

```bash
cd /Users/chrh/dev/viggo-games/public/games/gunny/source
npm run build -- --base ./ --outDir /tmp/gunny-dist
```

Then copy `/tmp/gunny-dist/index.html` plus `/tmp/gunny-dist/assets/` into `/Users/chrh/dev/viggo-games/public/games/gunny/`.

## Controls

- `WASD` or arrows: steer
- `Space`: fire
- Hold mouse button: fire
- Touch controls: steer + fire
- All buttons block text selection and iOS long-press callouts.

## Goal

- Drop 12 raiders before hull hits zero
- Avoid satellites while pushing score
- Keep clear of expanding raider explosions: each blast can damage your hull once, with less damage near its edge. The final blast resolves before victory.
- At 10% hull or less, the hull percentage flashes red and beeps once a second during focused play. Reduced-motion settings use steady red.
- Nearby stars continuously recycle ahead of the ship; distant stars remain in the background. The fixed pool does not grow during long flights.

## Verification

Run `npm test` in `source/` for lightweight single-process starfield, blast-damage, and hull-warning regression checks. Run `npm run build -- --base ./` to rebuild. Verify visual motion, sound, and touch controls in a browser when local game rendering is appropriate.

## Source Notes

- Original source README lives at `source/README.md`
- Homepage card art/registry live outside this folder in:
  - `/Users/chrh/dev/viggo-games/src/assets/gunny.webp`
  - `/Users/chrh/dev/viggo-games/src/data/games.ts`
