# Burb

Browser cycling game. Live deploy files at this folder root. Editable app source in `source/`.

## Deployment

- Production URL: `https://viggo.games/games/burb/`
- Embedded on homepage route: `https://viggo.games/burb`
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
  - vendored TypeScript + Three.js source snapshot synced from `/Users/chrh/dev/burb`

## Sync From Local Burb

Refresh the vendored source copy from the local authoring folder:

```bash
rsync -a --delete \
  --exclude .git \
  --exclude node_modules \
  --exclude dist \
  /Users/chrh/dev/burb/ \
  /Users/chrh/dev/viggo-games/public/games/burb/source/
```

## Local Dev

Use the source app:

```bash
cd /Users/chrh/dev/viggo-games/public/games/burb/source
npm install
npm run dev
```

## Rebuild Deploy Files

Build from `source/` with a relative base so the game works from `/games/burb/`:

```bash
cd /Users/chrh/dev/viggo-games/public/games/burb/source
npm run build -- --base ./ --outDir /tmp/burb-dist
```

Then copy `/tmp/burb-dist/index.html` plus `/tmp/burb-dist/assets/` into `/Users/chrh/dev/viggo-games/public/games/burb/`.

## Controls

- `W` / `ArrowUp`: faster
- `S` / `ArrowDown`: slower
- `A` / `ArrowLeft`: steer left
- `D` / `ArrowRight`: steer right
- Touch: `Left`, `Right`, `Fast`, `Slow`

## Source Notes

- Original source README lives at `source/README.md`
- The homepage card art/registry live outside this folder in:
  - `/Users/chrh/dev/viggo-games/src/assets/burb.png`
  - `/Users/chrh/dev/viggo-games/src/data/games.ts`
