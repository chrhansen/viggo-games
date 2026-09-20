import {
  resolveChickenHopGround,
  resolveChickenHopInteractions,
} from "./collisions";
import { findGroundSurface, moveChickenHopWorld } from "./entities";
import { emitChickenHopEvent } from "./events";
import { clamp, lerp } from "./math";
import { randomBetween, randomInteger } from "./random";
import { updateChickenHopSpawners } from "./spawners";
import type {
  ChickenHopGame,
  ChickenHopInput,
  ChickenHopPlayer,
  ChickenHopTimeMode,
  CreateChickenHopOptions,
} from "./types";

const PLAYER_WIDTH = 54;
const PLAYER_HEIGHT = 44;

export const emptyChickenHopInput = (): ChickenHopInput => ({
  down: false,
  jump: false,
  left: false,
  right: false,
});

function worldMetrics(width: number, height: number) {
  const safeWidth = Math.max(320, width);
  const safeHeight = Math.max(240, height);
  return {
    floorY: Math.floor(safeHeight * 0.78),
    height: safeHeight,
    leftBound: Math.floor(safeWidth * 0.08),
    plateauLift: 96,
    rightBound: Math.floor(safeWidth * 0.62),
    width: safeWidth,
  };
}

function createPlayer(
  metrics: ReturnType<typeof worldMetrics>,
): ChickenHopPlayer {
  return {
    animation: 0,
    cluckCooldown: 0,
    coyote: 0,
    dropThroughFor: 0,
    flyHold: 0,
    ground: null,
    height: PLAYER_HEIGHT,
    invulnerableFor: 0,
    jumpBuffer: 0,
    onGround: true,
    vx: 0,
    vy: 0,
    width: PLAYER_WIDTH,
    x: metrics.leftBound + Math.floor(metrics.width * 0.16),
    y: metrics.floorY - PLAYER_HEIGHT,
  };
}

export function createChickenHopGame(
  options: CreateChickenHopOptions = {},
): ChickenHopGame {
  const metrics = worldMetrics(options.width ?? 960, options.height ?? 540);
  const game: ChickenHopGame = {
    best: Math.max(0, Math.floor(options.best ?? 0)),
    corn: 0,
    difficulty: 0,
    eggSpawnerCooldown: 1.2,
    eggs: [],
    elapsed: 0,
    eventSequence: 0,
    events: [],
    flyFeatherCooldown: 0,
    flyFuel: 5,
    flyFuelMax: 5,
    flyRefuelDelay: 0.75,
    flyRefuelFor: 0,
    gravity: 2400,
    heartIndex: 0,
    hearts: [100, 100],
    mode: "ready",
    nextEntityId: 1,
    obstacleSpawner: {
      cooldown: 0.35,
      needsLanding: false,
      runChunksLeft: 0,
    },
    obstacles: [],
    pickups: [],
    platformSpawnerCooldown: 1.4,
    platforms: [],
    player: createPlayer(metrics),
    randomSeed: (options.seed ?? Date.now()) >>> 0,
    roomHue: 22,
    roomHueAccent: 160,
    roomHueAccentTwo: 320,
    score: 0,
    scroll: 0,
    speed: 360,
    terrain: { level: 0, runLeft: 0 },
    timeMode: "normal",
    timeScale: 1,
    jumpVelocity: -760,
    ...metrics,
  } as ChickenHopGame;
  randomizeRoom(game);
  return game;
}

function randomizeRoom(game: ChickenHopGame) {
  game.roomHue = randomInteger(game, 14, 34);
  game.roomHueAccent =
    (game.roomHue + randomInteger(game, 110, 190)) % 360;
  game.roomHueAccentTwo =
    (game.roomHue + randomInteger(game, 220, 300)) % 360;
}

function resetChickenHopRun(game: ChickenHopGame) {
  const metrics = worldMetrics(game.width, game.height);
  Object.assign(game, metrics, {
    corn: 0,
    difficulty: 0,
    eggSpawnerCooldown: 1.2,
    eggs: [],
    elapsed: 0,
    events: [],
    flyFeatherCooldown: 0,
    flyFuel: game.flyFuelMax,
    flyRefuelFor: 0,
    heartIndex: 0 as const,
    hearts: [100, 100] as [number, number],
    obstacleSpawner: {
      cooldown: 0.35,
      needsLanding: false,
      runChunksLeft: 0,
    },
    obstacles: [],
    pickups: [],
    platformSpawnerCooldown: 1.4,
    platforms: [],
    score: 0,
    scroll: 0,
    speed: 360,
    terrain: { level: 0 as const, runLeft: 0 },
  });
  game.player = createPlayer(metrics);
  randomizeRoom(game);
}

export function startChickenHopRun(game: ChickenHopGame) {
  game.best = Math.max(game.best, Math.floor(game.score));
  resetChickenHopRun(game);
  game.mode = "playing";
  emitChickenHopEvent(game, "start");
}

export function toggleChickenHopPause(game: ChickenHopGame) {
  if (game.mode === "playing") game.mode = "paused";
  else if (game.mode === "paused") game.mode = "playing";
}

export function setChickenHopTimeMode(
  game: ChickenHopGame,
  mode: ChickenHopTimeMode,
) {
  game.timeMode = mode;
  game.timeScale = mode === "slow" ? 0.55 : mode === "fast" ? 1.6 : 1;
}

export function resizeChickenHopGame(
  game: ChickenHopGame,
  width: number,
  height: number,
) {
  const previousFloorY = game.floorY;
  const wasOnGround = game.player.onGround;
  const metrics = worldMetrics(width, height);
  const floorDelta = metrics.floorY - previousFloorY;
  Object.assign(game, metrics);

  for (const obstacle of game.obstacles) {
    obstacle.y = game.floorY - obstacle.height;
  }
  for (const platform of game.platforms) {
    platform.y = game.floorY - platform.floorOffset;
  }
  for (const pickup of game.pickups) pickup.y += floorDelta;
  for (const egg of game.eggs) egg.y = game.floorY - egg.radius;

  game.player.x = clamp(game.player.x, game.leftBound, game.rightBound);
  if (wasOnGround) {
    const support = findGroundSurface(game, game.player.ground);
    game.player.y = (support?.y ?? game.floorY) - game.player.height;
  } else {
    game.player.y = clamp(
      game.player.y + floorDelta,
      Math.floor(game.height * 0.06),
      game.floorY - game.player.height,
    );
  }
}

export function advanceChickenHopGame(
  game: ChickenHopGame,
  input: ChickenHopInput,
  rawDelta: number,
) {
  game.events = [];
  if (game.mode !== "playing") return;

  const realDelta = clamp(rawDelta, 0, 1 / 20);
  const dt = clamp(realDelta * game.timeScale, 0, 1 / 15);
  game.elapsed += dt;
  game.difficulty = clamp(game.difficulty + dt * 0.035, 0, 1);
  game.speed = lerp(360, 620, game.difficulty);
  game.score += dt * (20 + game.speed * 0.02);

  const player = game.player;
  player.invulnerableFor = Math.max(0, player.invulnerableFor - dt);
  player.cluckCooldown = Math.max(0, player.cluckCooldown - dt);
  player.dropThroughFor = Math.max(0, player.dropThroughFor - dt);
  game.flyFeatherCooldown = Math.max(0, game.flyFeatherCooldown - dt);

  const acceleration = 2400;
  const maximumVelocity = 360;
  if (input.left) player.vx -= acceleration * dt;
  if (input.right) player.vx += acceleration * dt;
  if (!input.left && !input.right) player.vx *= Math.pow(0.0006, dt);
  player.vx = clamp(player.vx, -maximumVelocity, maximumVelocity);

  if (input.jump) player.jumpBuffer = 0.12;
  else player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);
  player.coyote = player.onGround
    ? 0.1
    : Math.max(0, player.coyote - dt);
  player.flyHold = input.jump ? player.flyHold + dt : 0;

  if (player.jumpBuffer > 0 && player.coyote > 0) {
    player.jumpBuffer = 0;
    player.coyote = 0;
    player.onGround = false;
    player.ground = null;
    player.vy = game.jumpVelocity;
    emitChickenHopEvent(game, "jump", {
      x: player.x + player.width * 0.6,
      y: player.y + player.height * 0.5,
    });
  }

  const flying =
    input.jump &&
    !player.onGround &&
    player.flyHold > 0.14 &&
    game.flyFuel > 0;
  if (flying) {
    game.flyFuel = Math.max(0, game.flyFuel - dt);
    game.flyRefuelFor = game.flyRefuelDelay;
    player.vy = lerp(player.vy, -420, 1 - Math.pow(0.001, dt));
    if (game.flyFeatherCooldown <= 0) {
      emitChickenHopEvent(game, "flight-feather", {
        x: player.x + player.width * 0.45,
        y: player.y + player.height * 0.75,
      });
      game.flyFeatherCooldown = 0.11;
    }
  }

  if (
    player.onGround &&
    (input.right || input.left) &&
    player.cluckCooldown <= 0
  ) {
    const type = input.right ? "cluck-fast" : "cluck-slow";
    emitChickenHopEvent(game, type);
    player.cluckCooldown = input.right
      ? randomBetween(game, 0.14, 0.22)
      : randomBetween(game, 0.26, 0.4);
  }

  if (input.down && player.onGround && player.ground) {
    player.dropThroughFor = 0.35;
    player.ground = null;
    player.onGround = false;
    player.vy = Math.max(player.vy, 120);
  }

  const wasOnGround = player.onGround;
  const previousY = player.y;
  player.vy += game.gravity * dt;
  player.x = clamp(
    player.x + player.vx * dt,
    game.leftBound,
    game.rightBound,
  );
  player.y += player.vy * dt;
  const ceiling = Math.floor(game.height * 0.06);
  if (player.y < ceiling) {
    player.y = ceiling;
    player.vy = Math.max(player.vy, 0);
  }

  updateChickenHopSpawners(game, dt);
  moveChickenHopWorld(game, dt);
  resolveChickenHopGround(game, previousY, wasOnGround);

  if (game.flyFuel < game.flyFuelMax && player.onGround) {
    game.flyRefuelFor = Math.max(0, game.flyRefuelFor - dt);
    if (game.flyRefuelFor <= 0) game.flyFuel = game.flyFuelMax;
  }

  const runSpeed = player.onGround
    ? Math.abs(player.vx) / 220 + 1
    : 0.4;
  player.animation += dt * runSpeed;
  resolveChickenHopInteractions(game);
}

export function snapshotChickenHopGame(game: ChickenHopGame): ChickenHopGame {
  return {
    ...game,
    eggs: game.eggs.map((egg) => ({ ...egg })),
    events: game.events.map((event) => ({ ...event })),
    hearts: [game.hearts[0], game.hearts[1]],
    obstacleSpawner: { ...game.obstacleSpawner },
    obstacles: game.obstacles.map((obstacle) => ({ ...obstacle })),
    pickups: game.pickups.map((pickup) => ({ ...pickup })),
    platforms: game.platforms.map((platform) => ({ ...platform })),
    player: {
      ...game.player,
      ground: game.player.ground ? { ...game.player.ground } : null,
    },
    terrain: { ...game.terrain },
  };
}
