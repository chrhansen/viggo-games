import {
  advanceChickenHopGame as advanceCoreGame,
  createChickenHopGame as createCoreGame,
  resizeChickenHopGame as resizeCoreGame,
  snapshotChickenHopGame as snapshotCoreGame,
  startChickenHopRun,
  toggleChickenHopPause,
  type ChickenHopEvent,
  type ChickenHopGame as ChickenHopEngine,
  type ChickenHopMode,
} from "@viggo-games/chicken-hop-core";

export const CHICKEN_HOP_WORLD_SCALE = 0.5;

const worldUnits = (screenPixels: number) =>
  screenPixels / CHICKEN_HOP_WORLD_SCALE;

export interface ChickenHopInput {
  jump: boolean;
  left: boolean;
  right: boolean;
}

export interface ChickenHopPlayer {
  height: number;
  invulnerableFor: number;
  onGround: boolean;
  vx: number;
  vy: number;
  width: number;
  x: number;
  y: number;
}

export interface ChickenHopObstacle {
  color: string;
  height: number;
  id: number;
  kind: "block" | "book" | "plant" | "robot" | "shelf" | "step";
  width: number;
  x: number;
  y: number;
}

export interface ChickenHopPickup {
  id: number;
  kind: "corn" | "gold-corn";
  phase: number;
  radius: number;
  x: number;
  y: number;
}

export interface ChickenHopEgg {
  id: number;
  phase: number;
  radius: number;
  x: number;
  y: number;
}

export interface ChickenHopGame {
  best: number;
  corn: number;
  eggs: ChickenHopEgg[];
  elapsed: number;
  events: ChickenHopEvent[];
  flyFuel: number;
  flyFuelMax: number;
  floorY: number;
  hearts: [number, number];
  height: number;
  mode: ChickenHopMode;
  obstacles: ChickenHopObstacle[];
  pickups: ChickenHopPickup[];
  player: ChickenHopPlayer;
  score: number;
  scroll: number;
  width: number;
}

export type { ChickenHopEngine, ChickenHopEvent, ChickenHopMode };
export { startChickenHopRun, toggleChickenHopPause };

export function createChickenHopGame(
  width = 390,
  height = 700,
  seed = Date.now(),
): ChickenHopEngine {
  return createCoreGame({
    height: worldUnits(height),
    seed,
    width: worldUnits(width),
  });
}

export function resizeChickenHopGame(
  game: ChickenHopEngine,
  width: number,
  height: number,
) {
  resizeCoreGame(game, worldUnits(width), worldUnits(height));
}

export function advanceChickenHopGame(
  game: ChickenHopEngine,
  input: ChickenHopInput,
  rawDelta: number,
) {
  advanceCoreGame(game, { ...input, down: false }, rawDelta);
}

export function snapshotChickenHopGame(
  engine: ChickenHopEngine,
): ChickenHopGame {
  const game = snapshotCoreGame(engine);
  const visualWidth = worldUnits(30);
  const visualHeight = worldUnits(25);
  const playerX = game.player.x - (visualWidth - game.player.width) / 2;
  const playerY = game.player.y - (visualHeight - game.player.height);

  return {
    best: game.best,
    corn: game.corn,
    eggs: game.eggs
      .filter(({ smashed }) => !smashed)
      .map((egg) => ({
        id: egg.id,
        phase: egg.elapsed,
        radius: egg.radius,
        x: egg.x,
        y: egg.y,
      })),
    elapsed: game.elapsed,
    events: game.events,
    flyFuel: game.flyFuel,
    flyFuelMax: game.flyFuelMax,
    floorY: game.floorY,
    hearts: game.hearts,
    height: game.height,
    mode: game.mode,
    obstacles: [
      ...game.obstacles.map((obstacle) => ({
        color: obstacle.color,
        height: obstacle.height,
        id: obstacle.id,
        kind: obstacle.kind,
        width: obstacle.width,
        x: obstacle.x,
        y: obstacle.y,
      })),
      ...game.platforms.map((platform) => ({
        color: "#2EE59D",
        height:
          platform.kind === "step"
            ? platform.floorOffset
            : platform.height,
        id: platform.id,
        kind: platform.kind,
        width: platform.width,
        x: platform.x,
        y: platform.y,
      })),
    ],
    pickups: game.pickups
      .filter(({ taken }) => !taken)
      .map((pickup) => ({
        id: pickup.id,
        kind: pickup.kind,
        phase: pickup.elapsed,
        radius: pickup.radius,
        x: pickup.x,
        y: pickup.y,
      })),
    player: {
      height: visualHeight,
      invulnerableFor: game.player.invulnerableFor,
      onGround: game.player.onGround,
      vx: game.player.vx,
      vy: game.player.vy,
      width: visualWidth,
      x: playerX,
      y: playerY,
    },
    score: game.score,
    scroll: game.scroll,
    width: game.width,
  };
}
