import { clamp, lerp } from "./math";
import {
  nextEntityId,
  nextRandom,
  randomBetween,
  randomInteger,
} from "./random";
import type {
  ChickenHopGame,
  ChickenHopObstacleKind,
  ChickenHopPlatform,
} from "./types";

const obstacleTypes = [
  { kind: "block", width: 46, height: 34, color: "#FF6A3D" },
  { kind: "book", width: 54, height: 22, color: "#2EE59D" },
  { kind: "robot", width: 52, height: 40, color: "#FFD166" },
  { kind: "plant", width: 42, height: 44, color: "#7EF08A" },
] as const;

function spawnPlatform(
  game: ChickenHopGame,
  width: number,
  y: number,
  x: number,
  kind: ChickenHopPlatform["kind"] = "shelf",
) {
  game.platforms.push({
    floorOffset: game.floorY - y,
    height: 18,
    id: nextEntityId(game),
    kind,
    width,
    x,
    y,
  });
}

function spawnStairs(
  game: ChickenHopGame,
  levelFrom: 0 | 1,
  levelTo: 0 | 1,
  startX: number,
) {
  const stepRise = 16;
  const stepWidth = 78;
  const liftFrom = levelFrom === 1 ? game.plateauLift : 0;
  const liftTo = levelTo === 1 ? game.plateauLift : 0;
  const delta = liftTo - liftFrom;
  if (delta === 0) return startX;

  const steps = clamp(Math.ceil(Math.abs(delta) / stepRise), 3, 7);
  const direction = Math.sign(delta);
  for (let index = 0; index < steps; index += 1) {
    const lift = liftFrom + direction * stepRise * (index + 1);
    spawnPlatform(
      game,
      stepWidth,
      game.floorY - Math.round(lift),
      startX + index * stepWidth,
      "step",
    );
  }
  return startX + steps * stepWidth;
}

function spawnObstacle(
  game: ChickenHopGame,
  width: number,
  height: number,
  kind: ChickenHopObstacleKind,
  color: string,
  x: number,
) {
  game.obstacles.push({
    color,
    height,
    id: nextEntityId(game),
    kind,
    width,
    x,
    y: game.floorY - height,
  });
}

function spawnCorn(game: ChickenHopGame, x: number) {
  game.pickups.push({
    elapsed: 0,
    id: nextEntityId(game),
    kind: "corn",
    radius: randomInteger(game, 14, 18),
    taken: false,
    value: 1,
    x,
    y: game.floorY - randomInteger(game, 64, 118),
  });
}

function spawnGoldCorn(game: ChickenHopGame, x: number) {
  game.pickups.push({
    elapsed: 0,
    id: nextEntityId(game),
    kind: "gold-corn",
    radius: randomInteger(game, 20, 26),
    taken: false,
    value: 3,
    x,
    y: game.floorY - randomInteger(game, 170, 250),
  });
}

function spawnEgg(game: ChickenHopGame, x: number) {
  const radius = randomInteger(game, 12, 15);
  game.eggs.push({
    elapsed: 0,
    id: nextEntityId(game),
    radius,
    smashed: false,
    smashedFor: 0,
    x,
    y: game.floorY - radius,
  });
}

function updateObstacleSpawner(game: ChickenHopGame, dt: number) {
  const spawner = game.obstacleSpawner;
  spawner.cooldown -= dt;
  let iterations = 0;
  while (spawner.cooldown <= 0 && iterations < 6) {
    iterations += 1;
    const speedFactor = lerp(1, 0.86, game.difficulty);

    if (spawner.runChunksLeft <= 0) {
      const startsRun = nextRandom(game) < lerp(0.5, 0.72, game.difficulty);
      if (!startsRun) {
        spawner.needsLanding = false;
        spawner.cooldown += randomBetween(game, 0.55, 1.25) * speedFactor;
        if (nextRandom(game) < 0.16) {
          spawner.cooldown += randomBetween(game, 0.7, 1.4) * speedFactor;
        }
        continue;
      }
      spawner.runChunksLeft = randomInteger(
        game,
        1,
        2 + (game.difficulty > 0.55 ? 1 : 0),
      );
      spawner.needsLanding = false;
    }

    let chunkSize = nextRandom(game) < lerp(0.3, 0.55, game.difficulty) ? 2 : 1;
    if (game.difficulty < 0.1) chunkSize = 1;

    const lastObstacle = game.obstacles[game.obstacles.length - 1];
    const lastEndX = lastObstacle
      ? lastObstacle.x + lastObstacle.width
      : null;
    const minimumSpacing = lerp(240, 180, game.difficulty);
    const airTime = (2 * Math.abs(game.jumpVelocity)) / game.gravity;
    const jumpTravel = game.speed * airTime;
    const reactionDistance = lerp(220, 140, game.difficulty);
    const landingSpacing = Math.max(
      game.player.width + 200,
      jumpTravel + reactionDistance,
    );
    const requiredSpacing = spawner.needsLanding
      ? landingSpacing
      : minimumSpacing;

    const chooseObstacle = () =>
      obstacleTypes[randomInteger(game, 0, obstacleTypes.length - 1)];
    const chooseSize = (type: (typeof obstacleTypes)[number]) => {
      const large = game.difficulty > 0.55 && nextRandom(game) < 0.12;
      return {
        type,
        width: large ? Math.floor(type.width * 1.25) : type.width,
        height: large ? Math.floor(type.height * 1.35) : type.height,
      };
    };

    let firstX = game.width + randomBetween(game, 40, 140);
    if (lastEndX !== null) {
      firstX = Math.max(firstX, lastEndX + requiredSpacing);
    }
    const first = chooseSize(chooseObstacle());
    spawnObstacle(
      game,
      first.width,
      first.height,
      first.type.kind,
      first.type.color,
      firstX,
    );
    let chunkEndX = firstX + first.width;

    if (chunkSize === 2) {
      const secondX =
        firstX + first.width + randomBetween(game, 40, 80);
      const second = chooseSize(chooseObstacle());
      spawnObstacle(
        game,
        second.width,
        second.height,
        second.type.kind,
        second.type.color,
        secondX,
      );
      chunkEndX = secondX + second.width;
    }

    if (nextRandom(game) < (chunkSize === 2 ? 0.38 : 0.62)) {
      spawnCorn(game, chunkEndX + randomBetween(game, 90, 240));
    }
    if (nextRandom(game) < lerp(0.02, 0.05, game.difficulty)) {
      spawnGoldCorn(game, chunkEndX + randomBetween(game, 240, 420));
    }

    spawner.runChunksLeft -= 1;
    if (spawner.runChunksLeft > 0) {
      spawner.needsLanding = true;
      spawner.cooldown += randomBetween(game, 0.2, 0.4) * speedFactor;
    } else {
      spawner.needsLanding = false;
      spawner.cooldown += randomBetween(game, 0.55, 1.1) * speedFactor;
    }
  }
}

function updatePlatformSpawner(game: ChickenHopGame, dt: number) {
  game.platformSpawnerCooldown -= dt;
  const spawner = game.obstacleSpawner;
  if (
    game.platformSpawnerCooldown > 0 ||
    spawner.needsLanding ||
    spawner.runChunksLeft !== 0
  ) {
    return;
  }

  const speedFactor = lerp(1, 0.86, game.difficulty);
  if (game.terrain.runLeft <= 0) {
    const startsRun = nextRandom(game) < lerp(0.42, 0.62, game.difficulty);
    if (!startsRun) {
      game.platformSpawnerCooldown =
        randomBetween(game, 1.3, 2.8) * speedFactor;
      return;
    }
    game.terrain.runLeft = randomInteger(game, 2, 4);
  }

  const lastObstacle = game.obstacles[game.obstacles.length - 1];
  const lastPlatform = game.platforms[game.platforms.length - 1];
  const lastEnd = Math.max(
    lastObstacle ? lastObstacle.x + lastObstacle.width : 0,
    lastPlatform ? lastPlatform.x + lastPlatform.width : 0,
  );
  const chainGap =
    game.terrain.runLeft >= 2
      ? randomBetween(game, 160, 240)
      : randomBetween(game, 280, 420);
  let x = Math.max(
    game.width + randomBetween(game, 180, 280),
    lastEnd + chainGap,
  );

  let nextLevel = game.terrain.level;
  if (game.terrain.level === 0) nextLevel = 1;
  else if (game.terrain.runLeft <= 1 && nextRandom(game) < 0.78) nextLevel = 0;

  if (nextLevel !== game.terrain.level) {
    x = spawnStairs(game, game.terrain.level, nextLevel, x) + 18;
  }

  if (nextLevel === 1) {
    const y = game.floorY - game.plateauLift;
    const width = randomInteger(game, 300, 460);
    spawnPlatform(game, width, y, x, "shelf");
    if (nextRandom(game) < 0.58) spawnCorn(game, x + width * 0.5);
    if (nextRandom(game) < 0.1) spawnGoldCorn(game, x + width * 0.65);
  }

  game.terrain.level = nextLevel;
  game.terrain.runLeft -= 1;
  game.platformSpawnerCooldown =
    (game.terrain.runLeft > 0
      ? randomBetween(game, 0.55, 0.95)
      : randomBetween(game, 2.2, 3.6)) * speedFactor;
}

function updateEggSpawner(game: ChickenHopGame, dt: number) {
  game.eggSpawnerCooldown -= dt;
  const spawner = game.obstacleSpawner;
  if (
    game.eggSpawnerCooldown > 0 ||
    spawner.needsLanding ||
    spawner.runChunksLeft !== 0
  ) {
    return;
  }

  const lastObstacle = game.obstacles[game.obstacles.length - 1];
  const lastPlatform = game.platforms[game.platforms.length - 1];
  const lastEgg = game.eggs[game.eggs.length - 1];
  const lastEnd = Math.max(
    lastObstacle ? lastObstacle.x + lastObstacle.width : 0,
    lastPlatform ? lastPlatform.x + lastPlatform.width : 0,
    lastEgg ? lastEgg.x + lastEgg.radius : 0,
  );
  const x = Math.max(
    game.width + randomBetween(game, 220, 380),
    lastEnd + randomBetween(game, 360, 560),
  );
  if (nextRandom(game) < 0.7) spawnEgg(game, x);
  game.eggSpawnerCooldown =
    randomBetween(game, 1.4, 2.8) * lerp(1, 0.86, game.difficulty);
}

export function updateChickenHopSpawners(
  game: ChickenHopGame,
  dt: number,
) {
  updateObstacleSpawner(game, dt);
  updatePlatformSpawner(game, dt);
  updateEggSpawner(game, dt);
}
