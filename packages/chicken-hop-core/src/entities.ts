import type {
  ChickenHopGame,
  ChickenHopGroundRef,
  ChickenHopObstacle,
  ChickenHopPlatform,
} from "./types";

export type ChickenHopSurface = ChickenHopObstacle | ChickenHopPlatform;

export function findGroundSurface(
  game: ChickenHopGame,
  ground: ChickenHopGroundRef | null,
): ChickenHopSurface | undefined {
  if (!ground) return undefined;
  return ground.type === "obstacle"
    ? game.obstacles.find(({ id }) => id === ground.id)
    : game.platforms.find(({ id }) => id === ground.id);
}

export function moveChickenHopWorld(game: ChickenHopGame, dt: number) {
  const shift = game.speed * dt;
  game.scroll += shift;

  for (const obstacle of game.obstacles) obstacle.x -= shift;
  game.obstacles = game.obstacles.filter(
    (obstacle) => obstacle.x + obstacle.width >= -40,
  );

  for (const platform of game.platforms) platform.x -= shift;
  game.platforms = game.platforms.filter(
    (platform) => platform.x + platform.width >= -60,
  );

  for (const pickup of game.pickups) {
    pickup.x -= shift;
    pickup.elapsed += dt;
  }
  game.pickups = game.pickups.filter(
    (pickup) => pickup.x + pickup.radius >= -60,
  );

  for (const egg of game.eggs) {
    egg.x -= shift;
    egg.elapsed += dt;
    if (egg.smashed) egg.smashedFor += dt;
  }
  game.eggs = game.eggs.filter(
    (egg) =>
      egg.x + egg.radius >= -60 &&
      (!egg.smashed || egg.smashedFor <= 0.6),
  );
}
