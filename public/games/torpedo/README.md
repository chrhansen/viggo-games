# Torpedo

First-person submarine game. Live deploy files at this folder root. Editable app source in `source/`.

## Deployment

- Production URL: `https://viggo.games/games/torpedo/`
- Embedded on homepage route: `https://viggo.games/torpedo`
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
  - vendored Three.js source snapshot synced from `/Users/chrh/dev/torpedo`

## Sync From Local Torpedo

Refresh the vendored source copy from the local authoring folder:

```bash
rsync -a --delete \
  --exclude .git \
  --exclude node_modules \
  --exclude dist \
  /Users/chrh/dev/torpedo/ \
  /Users/chrh/dev/viggo-games/public/games/torpedo/source/
```

## Local Dev

Use the source app:

```bash
cd /Users/chrh/dev/viggo-games/public/games/torpedo/source
npm install
npm run dev
```

## Rebuild Deploy Files

Build from `source/` with a relative base so the game works from `/games/torpedo/`:

```bash
cd /Users/chrh/dev/viggo-games/public/games/torpedo/source
npm run build -- --base=./ --outDir /tmp/torpedo-dist
```

Then copy `/tmp/torpedo-dist/index.html` plus `/tmp/torpedo-dist/assets/` into `/Users/chrh/dev/viggo-games/public/games/torpedo/`.

## Controls

- `WASD` or arrows: dodge in combat
- `Space`: fire a torpedo
- `1`: front window
- `2`: port windows
- `3`: starboard windows
- `P`: periscope
- `V`: open the paused submarine plan, or return to combat
- Enter or Space on the plan: enter the selected room
- Enter or Space inside a room: use that room's station
- Escape or `V` inside a room: return to the plan

## Source Notes

- Original source README lives at `source/README.md`
- Homepage card art/registry live outside this folder in:
  - `/Users/chrh/dev/viggo-games/src/assets/torpedo.webp`
  - `/Users/chrh/dev/viggo-games/src/data/games.json`
