import { findGroundSurface } from "./entities";
import { emitChickenHopEvent } from "./events";
import { clamp, intersects } from "./math";
import type {
  ChickenHopGame,
  ChickenHopObstacle,
} from "./types";

function landPlayer(
  game: ChickenHopGame,
  surface: { id: number; y: number },
  type: "obstacle" | "platform",
  wasOnGround: boolean,
) {
  const player = game.player;
  player.y = surface.y - player.height;
  player.vy = 0;
  player.onGround = true;
  player.ground = { id: surface.id, type };
  if (!wasOnGround) {
    emitChickenHopEvent(game, "land", {
      x: player.x + player.width * 0.4,
      y: surface.y + 2,
    });
  }
}

export function resolveChickenHopGround(
  game: ChickenHopGame,
  previousY: number,
  wasOnGround: boolean,
) {
  const player = game.player;
  const support = findGroundSurface(game, player.ground);
  if (support && player.onGround) {
    const overlaps =
      player.x + player.width > support.x + 6 &&
      player.x < support.x + support.width - 6;
    if (overlaps) {
      player.y = support.y - player.height;
      player.vy = 0;
      return;
    }
    player.ground = null;
    player.onGround = false;
    player.vy = Math.max(player.vy, 80);
  } else if (player.ground) {
    player.ground = null;
  }

  let landed = false;
  const previousBottom = previousY + player.height;
  const bottom = player.y + player.height;

  if (player.vy >= 0 && player.dropThroughFor <= 0) {
    for (const platform of game.platforms) {
      if (bottom < platform.y || previousBottom > platform.y) continue;
      const overlaps =
        player.x + player.width - 6 > platform.x &&
        player.x + 6 < platform.x + platform.width;
      if (!overlaps || previousBottom > platform.y || bottom < platform.y) {
        continue;
      }
      landPlayer(game, platform, "platform", wasOnGround);
      landed = true;
      break;
    }
  }

  if (!landed && player.vy >= 0) {
    for (const obstacle of game.obstacles) {
      if (bottom < obstacle.y || previousBottom > obstacle.y) continue;
      const overlaps =
        player.x + player.width - 6 > obstacle.x &&
        player.x + 6 < obstacle.x + obstacle.width;
      if (!overlaps || previousBottom > obstacle.y || bottom < obstacle.y) {
        continue;
      }
      landPlayer(game, obstacle, "obstacle", wasOnGround);
      landed = true;
      break;
    }
  }

  if (!landed && player.y + player.height >= game.floorY) {
    player.y = game.floorY - player.height;
    if (!wasOnGround && player.vy > 0) {
      emitChickenHopEvent(game, "land", {
        x: player.x + player.width * 0.4,
        y: game.floorY,
      });
    }
    player.vy = 0;
    player.onGround = true;
    player.ground = null;
    landed = true;
  }

  if (!landed && !player.ground) player.onGround = false;
}

function endChickenHopRun(game: ChickenHopGame) {
  game.mode = "gameover";
  game.best = Math.max(game.best, Math.floor(game.score));
  emitChickenHopEvent(game, "gameover");
}

function hurtPlayer(game: ChickenHopGame, obstacle: ChickenHopObstacle) {
  const player = game.player;
  if (player.invulnerableFor > 0 || game.mode !== "playing") return;

  const obstacleCenter = obstacle.x + obstacle.width * 0.5;
  game.hearts[game.heartIndex] = Math.max(
    0,
    game.hearts[game.heartIndex] - 12,
  );
  player.invulnerableFor = 1;
  const direction =
    player.x + player.width * 0.5 < obstacleCenter ? -1 : 1;
  player.vx = 320 * direction;
  player.vy = Math.min(player.vy, -380);
  player.onGround = false;
  player.ground = null;
  player.x =
    direction < 0
      ? obstacle.x - player.width - 10
      : obstacle.x + obstacle.width + 10;
  player.x = clamp(player.x, game.leftBound, game.rightBound);
  emitChickenHopEvent(game, "hurt", {
    x: player.x + player.width * 0.55,
    y: player.y + player.height * 0.55,
  });

  if (game.hearts[game.heartIndex] > 0) return;
  if (game.heartIndex === 0) {
    game.hearts[0] = 0;
    game.heartIndex = 1;
    game.hearts[1] = 100;
    player.invulnerableFor = 1.2;
    emitChickenHopEvent(game, "life");
    return;
  }
  endChickenHopRun(game);
}

export function resolveChickenHopInteractions(game: ChickenHopGame) {
  const player = game.player;
  const hitbox = {
    height: player.height - 10,
    width: player.width - 16,
    x: player.x + 8,
    y: player.y + 8,
  };

  for (const obstacle of game.obstacles) {
    if (!intersects(hitbox, obstacle)) continue;
    if (
      player.ground?.type === "obstacle" &&
      player.ground.id === obstacle.id &&
      player.onGround
    ) {
      continue;
    }
    const aboveTop = hitbox.y + hitbox.height <= obstacle.y + 4;
    const fromFront =
      player.x + player.width * 0.5 <=
      obstacle.x + obstacle.width * 0.5;
    if (aboveTop || !fromFront) continue;
    hurtPlayer(game, obstacle);
    break;
  }

  for (const pickup of game.pickups) {
    if (pickup.taken) continue;
    const pickupBox = {
      height: pickup.radius * 2,
      width: pickup.radius * 2,
      x: pickup.x - pickup.radius,
      y: pickup.y - pickup.radius,
    };
    if (!intersects(hitbox, pickupBox)) continue;
    pickup.taken = true;
    game.corn += pickup.value;
    game.score += 60 * pickup.value;
    emitChickenHopEvent(game, "corn", {
      value: pickup.value,
      x: pickup.x,
      y: pickup.y,
    });
  }

  for (const egg of game.eggs) {
    if (egg.smashed) continue;
    const eggBox = {
      height: egg.radius * 2,
      width: egg.radius * 2,
      x: egg.x - egg.radius,
      y: egg.y - egg.radius,
    };
    if (!intersects(hitbox, eggBox)) continue;
    egg.smashed = true;
    egg.smashedFor = 0;
    game.corn = Math.max(0, game.corn - 1);
    emitChickenHopEvent(game, "egg", { x: egg.x, y: egg.y });
  }
}
