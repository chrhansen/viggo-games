import type {
  ChickenHopGame,
  ChickenHopInput,
  ChickenHopObstacle,
  ChickenHopPlayer,
} from "./types";
import { updateChickenHopSpawners } from "./spawners";

export type {
  ChickenHopEgg,
  ChickenHopGame,
  ChickenHopInput,
  ChickenHopMode,
  ChickenHopObstacle,
  ChickenHopPickup,
  ChickenHopPlayer,
} from "./types";

const tuning = {
  gravity: 2250,
  jumpVelocity: -735,
  acceleration: 2100,
  maxHorizontalVelocity: 330,
  flyVelocity: -390,
  flyDelay: 0.14,
  flyRefuelDelay: 0.75,
  damage: 20,
  playerWidth: 30,
  playerHeight: 25,
} as const;

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.max(minimum, Math.min(maximum, value));

const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;

const intersects = (
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

function worldMetrics(width: number, height: number) {
  const safeWidth = Math.max(280, width);
  const safeHeight = Math.max(360, height);

  return {
    width: safeWidth,
    height: safeHeight,
    floorY: Math.floor(safeHeight * 0.72),
    leftBound: Math.floor(safeWidth * 0.06),
    rightBound: Math.floor(safeWidth * 0.64),
  };
}

function createPlayer(metrics: ReturnType<typeof worldMetrics>): ChickenHopPlayer {
  return {
    x: metrics.leftBound + Math.floor(metrics.width * 0.15),
    y: metrics.floorY - tuning.playerHeight,
    vx: 0,
    vy: 0,
    width: tuning.playerWidth,
    height: tuning.playerHeight,
    onGround: true,
    groundObstacleId: null,
    jumpBuffer: 0,
    coyote: 0.1,
    flyHold: 0,
    invulnerableFor: 0,
  };
}

export function createChickenHopGame(width = 390, height = 700, seed = Date.now()): ChickenHopGame {
  const metrics = worldMetrics(width, height);

  return {
    mode: "ready",
    elapsed: 0,
    score: 0,
    best: 0,
    corn: 0,
    hearts: [100, 100],
    heartIndex: 0,
    flyFuel: 5,
    flyFuelMax: 5,
    flyRefuelFor: 0,
    speed: 245,
    difficulty: 0,
    scroll: 0,
    ...metrics,
    player: createPlayer(metrics),
    obstacles: [],
    pickups: [],
    eggs: [],
    obstacleTimer: 1.25,
    platformTimer: 1.35,
    pickupTimer: 1.75,
    eggTimer: 3.4,
    randomSeed: seed >>> 0,
    nextEntityId: 1,
    jumpWasHeld: false,
    feedback: null,
    feedbackId: 0,
  };
}

export function resizeChickenHopGame(game: ChickenHopGame, width: number, height: number) {
  const previousFloorY = game.floorY;
  const wasGrounded = game.player.onGround;
  const metrics = worldMetrics(width, height);
  const floorDelta = metrics.floorY - previousFloorY;
  Object.assign(game, metrics);
  game.player.x = clamp(game.player.x, game.leftBound, game.rightBound);
  for (const obstacle of game.obstacles) {
    obstacle.y =
      game.floorY - (obstacle.floorOffset ?? obstacle.height);
  }
  for (const pickup of game.pickups) pickup.y += floorDelta;
  for (const egg of game.eggs) egg.y = game.floorY - egg.radius * 1.1;

  if (wasGrounded) {
    const support = game.obstacles.find(
      (obstacle) => obstacle.id === game.player.groundObstacleId,
    );
    game.player.y = (support?.y ?? game.floorY) - game.player.height;
  } else {
    game.player.y = clamp(
      game.player.y + floorDelta,
      Math.floor(game.height * 0.06),
      game.floorY - game.player.height,
    );
  }
}

export function startChickenHopRun(game: ChickenHopGame) {
  const best = Math.max(game.best, Math.floor(game.score));
  const metrics = worldMetrics(game.width, game.height);
  Object.assign(game, {
    mode: "playing" as const,
    elapsed: 0,
    score: 0,
    best,
    corn: 0,
    hearts: [100, 100] as [number, number],
    heartIndex: 0 as const,
    flyFuel: game.flyFuelMax,
    flyRefuelFor: 0,
    speed: 245,
    difficulty: 0,
    scroll: 0,
    obstacles: [],
    pickups: [],
    eggs: [],
    obstacleTimer: 1.15,
    platformTimer: 1.35,
    pickupTimer: 1.6,
    eggTimer: 3.2,
    jumpWasHeld: false,
    feedback: null,
    ...metrics,
  });
  game.player = createPlayer(metrics);
}

export function toggleChickenHopPause(game: ChickenHopGame) {
  if (game.mode === "playing") game.mode = "paused";
  else if (game.mode === "paused") game.mode = "playing";
}

function setFeedback(game: ChickenHopGame, feedback: ChickenHopGame["feedback"]) {
  game.feedback = feedback;
  game.feedbackId += 1;
}

function moveWorld(game: ChickenHopGame, dt: number) {
  const shift = game.speed * dt;
  for (const obstacle of game.obstacles) obstacle.x -= shift;
  for (const pickup of game.pickups) {
    pickup.x -= shift;
    pickup.phase += dt * 6;
  }
  for (const egg of game.eggs) {
    egg.x -= shift;
    egg.phase += dt * 4;
  }
  game.obstacles = game.obstacles.filter((obstacle) => obstacle.x + obstacle.width > -60);
  game.pickups = game.pickups.filter((pickup) => pickup.x + pickup.radius > -60);
  game.eggs = game.eggs.filter((egg) => egg.x + egg.radius > -60);
}

function hurtPlayer(game: ChickenHopGame, obstacle: ChickenHopObstacle) {
  const player = game.player;
  if (player.invulnerableFor > 0) return;

  game.hearts[game.heartIndex] = Math.max(0, game.hearts[game.heartIndex] - tuning.damage);
  player.invulnerableFor = 1;
  player.vx = -245;
  player.vy = -330;
  player.onGround = false;
  player.groundObstacleId = null;
  player.x = clamp(obstacle.x - player.width - 8, game.leftBound, game.rightBound);
  setFeedback(game, "hurt");

  if (game.hearts[game.heartIndex] > 0) return;
  if (game.heartIndex === 0) {
    game.heartIndex = 1;
    player.invulnerableFor = 1.3;
    setFeedback(game, "life");
    return;
  }

  game.mode = "gameover";
  game.best = Math.max(game.best, Math.floor(game.score));
}

function resolveGround(game: ChickenHopGame, previousY: number, wasGrounded: boolean) {
  const player = game.player;
  const previousBottom = previousY + player.height;
  const bottom = player.y + player.height;
  let landed = false;

  if (player.groundObstacleId !== null && wasGrounded) {
    const support = game.obstacles.find((obstacle) => obstacle.id === player.groundObstacleId);
    const overlaps = support && player.x + player.width - 6 > support.x && player.x + 6 < support.x + support.width;
    if (support && overlaps) {
      player.y = support.y - player.height;
      player.vy = 0;
      player.onGround = true;
      landed = true;
    } else {
      player.groundObstacleId = null;
    }
  }

  if (!landed && player.vy >= 0) {
    for (const obstacle of game.obstacles) {
      const overlaps = player.x + player.width - 6 > obstacle.x && player.x + 6 < obstacle.x + obstacle.width;
      if (overlaps && previousBottom <= obstacle.y + 2 && bottom >= obstacle.y) {
        player.y = obstacle.y - player.height;
        player.vy = 0;
        player.onGround = true;
        player.groundObstacleId = obstacle.id;
        landed = true;
        break;
      }
    }
  }

  if (!landed && player.y + player.height >= game.floorY) {
    player.y = game.floorY - player.height;
    player.vy = 0;
    player.onGround = true;
    player.groundObstacleId = null;
    landed = true;
  }

  if (!landed) {
    player.onGround = false;
    player.groundObstacleId = null;
  }
}

function resolveEntityCollisions(game: ChickenHopGame) {
  const player = game.player;
  const horizontalInset = Math.max(4, player.width * 0.17);
  const verticalInset = Math.max(3, player.height * 0.16);
  const hitbox = {
    x: player.x + horizontalInset,
    y: player.y + verticalInset,
    width: player.width - horizontalInset * 2,
    height: player.height - verticalInset * 1.45,
  };

  for (const obstacle of game.obstacles) {
    if (obstacle.kind === "shelf" || obstacle.kind === "step") continue;
    if (!intersects(hitbox, obstacle) || player.groundObstacleId === obstacle.id) continue;
    const playerCenter = player.x + player.width / 2;
    const obstacleCenter = obstacle.x + obstacle.width / 2;
    if (playerCenter <= obstacleCenter && hitbox.y + hitbox.height > obstacle.y + 4) {
      hurtPlayer(game, obstacle);
      break;
    }
  }

  game.pickups = game.pickups.filter((pickup) => {
    const bobY = pickup.y + Math.sin(pickup.phase) * 5;
    const pickupBox = {
      x: pickup.x - pickup.radius,
      y: bobY - pickup.radius,
      width: pickup.radius * 2,
      height: pickup.radius * 2,
    };
    if (!intersects(hitbox, pickupBox)) return true;
    game.corn += pickup.value;
    game.score += 60 * pickup.value;
    setFeedback(game, "corn");
    return false;
  });

  game.eggs = game.eggs.filter((egg) => {
    const eggBox = {
      x: egg.x - egg.radius,
      y: egg.y - egg.radius,
      width: egg.radius * 2,
      height: egg.radius * 2,
    };
    if (!intersects(hitbox, eggBox)) return true;
    game.corn = Math.max(0, game.corn - 1);
    setFeedback(game, "egg");
    return false;
  });
}

export function advanceChickenHopGame(game: ChickenHopGame, input: ChickenHopInput, rawDt: number) {
  if (game.mode !== "playing") return;

  const dt = clamp(rawDt, 0, 1 / 20);
  const player = game.player;
  game.feedback = null;
  game.elapsed += dt;
  game.difficulty = clamp(game.difficulty + dt * 0.025, 0, 1);
  game.speed = lerp(245, 430, game.difficulty);
  game.scroll += game.speed * dt;
  game.score += dt * (18 + game.speed * 0.025);
  player.invulnerableFor = Math.max(0, player.invulnerableFor - dt);

  if (input.left) player.vx -= tuning.acceleration * dt;
  if (input.right) player.vx += tuning.acceleration * dt;
  if (!input.left && !input.right) player.vx *= Math.pow(0.0008, dt);
  player.vx = clamp(player.vx, -tuning.maxHorizontalVelocity, tuning.maxHorizontalVelocity);

  if (input.jump && !game.jumpWasHeld) player.jumpBuffer = 0.12;
  else player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);
  player.coyote = player.onGround ? 0.1 : Math.max(0, player.coyote - dt);
  player.flyHold = input.jump ? player.flyHold + dt : 0;

  if (player.jumpBuffer > 0 && player.coyote > 0) {
    player.jumpBuffer = 0;
    player.coyote = 0;
    player.onGround = false;
    player.groundObstacleId = null;
    player.vy = tuning.jumpVelocity;
  }

  const flying = input.jump && !player.onGround && player.flyHold > tuning.flyDelay && game.flyFuel > 0;
  if (flying) {
    game.flyFuel = Math.max(0, game.flyFuel - dt);
    game.flyRefuelFor = tuning.flyRefuelDelay;
    player.vy = lerp(player.vy, tuning.flyVelocity, 1 - Math.pow(0.002, dt));
  }

  const wasGrounded = player.onGround;
  const previousY = player.y;
  player.vy += tuning.gravity * dt;
  player.x = clamp(player.x + player.vx * dt, game.leftBound, game.rightBound);
  player.y += player.vy * dt;
  const ceiling = Math.floor(game.height * 0.06);
  if (player.y < ceiling) {
    player.y = ceiling;
    player.vy = Math.max(0, player.vy);
  }

  updateChickenHopSpawners(game, dt);
  moveWorld(game, dt);
  resolveGround(game, previousY, wasGrounded);
  resolveEntityCollisions(game);

  if (player.onGround && game.flyFuel < game.flyFuelMax) {
    game.flyRefuelFor = Math.max(0, game.flyRefuelFor - dt);
    if (game.flyRefuelFor <= 0) game.flyFuel = game.flyFuelMax;
  }

  game.jumpWasHeld = input.jump;
}

export function snapshotChickenHopGame(game: ChickenHopGame): ChickenHopGame {
  return {
    ...game,
    hearts: [game.hearts[0], game.hearts[1]],
    player: { ...game.player },
    obstacles: game.obstacles.map((obstacle) => ({ ...obstacle })),
    pickups: game.pickups.map((pickup) => ({ ...pickup })),
    eggs: game.eggs.map((egg) => ({ ...egg })),
  };
}
