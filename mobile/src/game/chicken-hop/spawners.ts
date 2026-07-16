import type { ChickenHopGame, ChickenHopObstacle } from "./types";

const obstacleLooks = [
  { kind: "block", width: 46, height: 34, color: "#FF6A3D" },
  { kind: "book", width: 58, height: 22, color: "#2EE59D" },
  { kind: "robot", width: 52, height: 42, color: "#FFD166" },
  { kind: "plant", width: 44, height: 48, color: "#7EF08A" },
] as const;

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.max(minimum, Math.min(maximum, value));

const lerp = (from: number, to: number, amount: number) =>
  from + (to - from) * amount;

function nextRandom(game: ChickenHopGame) {
  game.randomSeed =
    (Math.imul(game.randomSeed, 1664525) + 1013904223) >>> 0;
  return game.randomSeed / 4294967296;
}

function randomBetween(
  game: ChickenHopGame,
  minimum: number,
  maximum: number,
) {
  return minimum + nextRandom(game) * (maximum - minimum);
}

function nextId(game: ChickenHopGame) {
  const id = game.nextEntityId;
  game.nextEntityId += 1;
  return id;
}

function furthestTerrainEdge(game: ChickenHopGame) {
  return game.obstacles.reduce(
    (furthest, obstacle) =>
      Math.max(furthest, obstacle.x + obstacle.width),
    0,
  );
}

function pushObstacle(
  game: ChickenHopGame,
  obstacle: Omit<ChickenHopObstacle, "id">,
) {
  game.obstacles.push({ id: nextId(game), ...obstacle });
}

function spawnObstacle(game: ChickenHopGame) {
  const look =
    obstacleLooks[Math.floor(nextRandom(game) * obstacleLooks.length)];
  const scale =
    game.difficulty > 0.55 && nextRandom(game) < 0.12 ? 1.2 : 1;
  const width = Math.round(look.width * scale);
  const height = Math.round(look.height * scale);
  const x = Math.max(
    game.width + randomBetween(game, 36, 110),
    furthestTerrainEdge(game) + randomBetween(game, 86, 142),
  );

  pushObstacle(game, {
    kind: look.kind,
    color: look.color,
    x,
    y: game.floorY - height,
    width,
    height,
    floorOffset: height,
  });

  if (game.difficulty > 0.28 && nextRandom(game) < 0.24) {
    const secondLook =
      obstacleLooks[Math.floor(nextRandom(game) * obstacleLooks.length)];
    pushObstacle(game, {
      kind: secondLook.kind,
      color: secondLook.color,
      x: x + width + randomBetween(game, 42, 68),
      y: game.floorY - secondLook.height,
      width: secondLook.width,
      height: secondLook.height,
      floorOffset: secondLook.height,
    });
  }
}

function spawnPlatformRun(game: ChickenHopGame) {
  const lift = clamp(Math.round(game.height * 0.17), 78, 112);
  const stepCount = 4;
  const stepWidth = clamp(Math.round(game.width * 0.16), 58, 76);
  let x = Math.max(
    game.width + randomBetween(game, 110, 190),
    furthestTerrainEdge(game) + randomBetween(game, 150, 230),
  );

  for (let index = 1; index <= stepCount; index += 1) {
    const floorOffset = Math.round((lift * index) / stepCount);
    pushObstacle(game, {
      kind: "step",
      color: "#2EE59D",
      x,
      y: game.floorY - floorOffset,
      width: stepWidth,
      height: floorOffset,
      floorOffset,
    });
    x += stepWidth;
  }

  x += 16;
  const shelfWidth = clamp(
    Math.round(randomBetween(game, game.width * 0.5, game.width * 0.78)),
    190,
    360,
  );
  const shelfY = game.floorY - lift;
  pushObstacle(game, {
    kind: "shelf",
    color: "#2EE59D",
    x,
    y: shelfY,
    width: shelfWidth,
    height: 18,
    floorOffset: lift,
  });

  if (nextRandom(game) < 0.68) {
    game.pickups.push({
      id: nextId(game),
      kind: "corn",
      value: 1,
      x: x + shelfWidth * randomBetween(game, 0.36, 0.7),
      y: shelfY - randomBetween(game, 38, 54),
      radius: 15,
      phase: randomBetween(game, 0, Math.PI * 2),
    });
  }
}

function spawnPickup(game: ChickenHopGame) {
  const isGold = game.elapsed > 8 && nextRandom(game) < 0.09;
  const radius = isGold ? 20 : 15;
  const lift = isGold
    ? randomBetween(game, 150, 220)
    : randomBetween(game, 72, 128);
  game.pickups.push({
    id: nextId(game),
    kind: isGold ? "gold-corn" : "corn",
    value: isGold ? 3 : 1,
    x: game.width + randomBetween(game, 80, 180),
    y: game.floorY - lift,
    radius,
    phase: randomBetween(game, 0, Math.PI * 2),
  });
}

function spawnEgg(game: ChickenHopGame) {
  const radius = randomBetween(game, 12, 15);
  game.eggs.push({
    id: nextId(game),
    x: game.width + randomBetween(game, 120, 220),
    y: game.floorY - radius * 1.1,
    radius,
    phase: randomBetween(game, 0, Math.PI * 2),
  });
}

export function updateChickenHopSpawners(
  game: ChickenHopGame,
  dt: number,
) {
  game.obstacleTimer -= dt;
  game.platformTimer -= dt;
  game.pickupTimer -= dt;
  game.eggTimer -= dt;

  if (game.obstacleTimer <= 0) {
    spawnObstacle(game);
    game.obstacleTimer =
      randomBetween(game, 1.18, 1.72) *
      lerp(1, 0.82, game.difficulty);
  }
  if (game.platformTimer <= 0) {
    spawnPlatformRun(game);
    game.platformTimer =
      randomBetween(game, 4.8, 7.2) *
      lerp(1, 0.88, game.difficulty);
  }
  if (game.pickupTimer <= 0) {
    spawnPickup(game);
    game.pickupTimer = randomBetween(game, 1.45, 2.35);
  }
  if (game.eggTimer <= 0) {
    spawnEgg(game);
    game.eggTimer = randomBetween(game, 3.1, 5.1);
  }
}
