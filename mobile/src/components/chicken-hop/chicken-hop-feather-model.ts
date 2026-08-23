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
  lastEventId: number;
  nextParticleId: number;
  particles: FeatherParticle[];
}

export const createFeatherState = (): FeatherState => ({
  lastEventId: 0,
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
    const lastEventId = game.events.reduce(
      (latest, event) => Math.max(latest, event.id),
      state.lastEventId,
    );
    if (state.particles.length === 0 && lastEventId === state.lastEventId) return state;
    return {
      ...state,
      lastEventId,
      particles: [],
    };
  }

  const spawned: FeatherParticle[] = [];
  let nextParticleId = state.nextParticleId;
  let lastEventId = state.lastEventId;

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

  for (const event of game.events) {
    if (event.id <= state.lastEventId) continue;
    lastEventId = Math.max(lastEventId, event.id);
    const originX = event.x ?? game.player.x + game.player.width * 0.48;
    const originY = event.y ?? game.player.y + game.player.height * 0.62;
    if (event.type === "jump") spawnBurst(9, originX, originY);
    else if (event.type === "flight-feather") spawnBurst(3, originX, originY);
    else if (event.type === "hurt") spawnBurst(11, originX, originY);
    else if (event.type === "corn") spawnBurst(8, originX, originY);
  }

  const particles = state.particles.filter(
    (feather) => game.elapsed - feather.bornAt < feather.lifetime,
  );
  if (
    spawned.length === 0 &&
    particles.length === state.particles.length &&
    lastEventId === state.lastEventId
  ) {
    return state;
  }

  return {
    lastEventId,
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
