# Gunny

Browser space shooter. Deploy files at this folder root. Editable source snapshot in `source/`.

## Deployment

- Production URL: `https://viggo.games/games/gunny/`
- Embedded on homepage route: `https://viggo.games/gunny`
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
  - vendored source snapshot synced from `/Users/chrh/dev/gunny`

## Sync From Local Gunny

Refresh the vendored source copy from the local authoring folder:

```bash
rsync -a --delete \
  --exclude .git \
  --exclude node_modules \
  --exclude dist \
  /Users/chrh/dev/gunny/ \
  /Users/chrh/dev/viggo-games/public/games/gunny/source/
```

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

## Goal

- Drop 12 raiders before hull hits zero
- Avoid satellites while pushing score

## Source Notes

- Original source README lives at `source/README.md`
- Homepage card art/registry live outside this folder in:
  - `/Users/chrh/dev/viggo-games/src/assets/gunny.png`
  - `/Users/chrh/dev/viggo-games/src/data/games.ts`
