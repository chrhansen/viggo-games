import {
  CHICKEN_HOP_WORLD_SCALE,
  type ChickenHopGame,
} from "../../game/chicken-hop/engine";

export interface FeatherParticle {
  bornAt: number;
  id: number;
  lifetime: number;
  rotation: number;
  size: number;
  spin: number;
  vx: number;
  vy: number;
  x: number;
  y: number;
}

export interface FeatherState {
  lastFlightBurstAt: number;
  nextParticleId: number;
  particles: FeatherParticle[];
}

export const createFeatherState = (): FeatherState => ({
  lastFlightBurstAt: Number.NEGATIVE_INFINITY,
  nextParticleId: 1,
  particles: [],
});

const worldUnits = (screenPixels: number) =>
  screenPixels / CHICKEN_HOP_WORLD_SCALE;

const randomUnit = (seed: number) => {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
};

const randomBetween = (seed: number, minimum: number, maximum: number) =>
  minimum + randomUnit(seed) * (maximum - minimum);

export function advanceFeatherState(
  state: FeatherState,
  previous: ChickenHopGame,
  game: ChickenHopGame,
): FeatherState {
  if (game.mode === "ready" || game.elapsed < previous.elapsed) {
    if (
      state.particles.length === 0 &&
      state.lastFlightBurstAt === Number.NEGATIVE_INFINITY
    ) {
      return state;
    }
    return {
      ...state,
      lastFlightBurstAt: Number.NEGATIVE_INFINITY,
      particles: [],
    };
  }

  const jumped =
    previous.player.onGround &&
    !game.player.onGround &&
    game.player.vy < 0;
  const flying =
    !game.player.onGround &&
    previous.flyFuel > game.flyFuel;
  const hurt =
    game.feedback === "hurt" &&
    game.feedbackId !== previous.feedbackId;
  const spawned: FeatherParticle[] = [];
  let nextParticleId = state.nextParticleId;
  let lastFlightBurstAt = state.lastFlightBurstAt;

  const spawnBurst = (count: number, x: number, y: number) => {
    for (let index = 0; index < count; index += 1) {
      const id = nextParticleId;
      nextParticleId += 1;
      const seed = id + game.elapsed * 997;
      spawned.push({
        bornAt: game.elapsed,
        id,
        lifetime: randomBetween(seed + 1, 0.42, 0.7),
        rotation: randomBetween(seed + 2, -55, 55),
        size: worldUnits(randomBetween(seed + 3, 8, 13)),
        spin: randomBetween(seed + 4, -380, 380),
        vx: worldUnits(randomBetween(seed + 5, -220, 220)),
        vy: worldUnits(randomBetween(seed + 6, -440, -130)),
        x,
        y,
      });
    }
  };

  const originX = game.player.x + game.player.width * 0.48;
  const originY = game.player.y + game.player.height * 0.62;
  if (jumped) spawnBurst(9, originX, originY);
  if (flying && game.elapsed - lastFlightBurstAt >= 0.11) {
    spawnBurst(3, originX, originY);
    lastFlightBurstAt = game.elapsed;
  }
  if (hurt) spawnBurst(11, originX, originY);

  const particles = state.particles.filter(
    (feather) => game.elapsed - feather.bornAt < feather.lifetime,
  );
  if (
    spawned.length === 0 &&
    particles.length === state.particles.length &&
    lastFlightBurstAt === state.lastFlightBurstAt
  ) {
    return state;
  }

  return {
    lastFlightBurstAt,
    nextParticleId,
    particles: [...particles, ...spawned].slice(-56),
  };
}

export function featherPose(feather: FeatherParticle, elapsed: number) {
  const age = Math.max(0, elapsed - feather.bornAt);
  const progress = Math.min(1, age / feather.lifetime);

  return {
    opacity: (1 - progress) * 0.86,
    rotation: feather.rotation + feather.spin * age,
    x: feather.x + feather.vx * age,
    y: feather.y + feather.vy * age + worldUnits(760) * age * age,
  };
}
