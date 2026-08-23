import { describe, expect, it } from "vitest";

import {
  advanceFeatherState,
  createFeatherState,
  featherPose,
  type FeatherParticle,
} from "../../mobile/src/components/chicken-hop/chicken-hop-feather-model";
import {
  advanceChickenHopGame,
  CHICKEN_HOP_WORLD_SCALE,
  createChickenHopGame,
  snapshotChickenHopGame,
  startChickenHopRun,
  type ChickenHopEvent,
  type ChickenHopGame,
} from "../../mobile/src/game/chicken-hop/engine";

const runningGame = () => {
  const engine = createChickenHopGame(390, 700, 42);
  startChickenHopRun(engine);
  return { engine, game: snapshotChickenHopGame(engine) };
};

function withEvent(
  previous: ChickenHopGame,
  event: Omit<ChickenHopEvent, "id">,
): ChickenHopGame {
  const id =
    previous.events.reduce(
      (latest, current) => Math.max(latest, current.id),
      0,
    ) + 1;
  return {
    ...previous,
    elapsed: previous.elapsed + 0.01,
    events: [{ id, ...event }],
  };
}

describe("Chicken Hop native feathers", () => {
  it("turns the shared jump event into a deterministic nine-feather burst", () => {
    const { engine, game: previous } = runningGame();

    advanceChickenHopGame(
      engine,
      { jump: true, left: false, right: false },
      1 / 60,
    );
    const game = snapshotChickenHopGame(engine);
    const state = advanceFeatherState(createFeatherState(), previous, game);

    expect(game.events.map(({ type }) => type)).toContain("jump");
    expect(state.particles).toHaveLength(9);
    expect(state.particles.map(({ id }) => id)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9,
    ]);
    for (const feather of state.particles) {
      expect(feather.size * CHICKEN_HOP_WORLD_SCALE).toBeGreaterThanOrEqual(8);
      expect(feather.size * CHICKEN_HOP_WORLD_SCALE).toBeLessThanOrEqual(13);
    }
  });

  it("consumes every shared flight event exactly once", () => {
    const { game: previous } = runningGame();
    const firstFlight = withEvent(previous, {
      type: "flight-feather",
      x: 200,
      y: 300,
    });
    const firstState = advanceFeatherState(
      createFeatherState(),
      previous,
      firstFlight,
    );
    expect(firstState.particles).toHaveLength(3);

    const duplicate = { ...firstFlight, elapsed: firstFlight.elapsed + 0.01 };
    expect(advanceFeatherState(firstState, firstFlight, duplicate)).toBe(firstState);

    const nextFlight = withEvent(duplicate, {
      type: "flight-feather",
      x: 202,
      y: 298,
    });
    const nextState = advanceFeatherState(firstState, duplicate, nextFlight);
    expect(nextState.particles).toHaveLength(6);

    const coasting = {
      ...nextFlight,
      elapsed: nextFlight.elapsed + 0.01,
      events: [],
    };
    expect(advanceFeatherState(nextState, nextFlight, coasting)).toBe(nextState);
  });

  it("emits hurt feathers, caps the field, expires particles, and resets runs", () => {
    const { game: previous } = runningGame();
    const hurtGame = withEvent(previous, { type: "hurt" });
    const hurtState = advanceFeatherState(
      createFeatherState(),
      previous,
      hurtGame,
    );
    expect(hurtState.particles).toHaveLength(11);

    const crowdedState = {
      ...hurtState,
      particles: Array.from({ length: 55 }, (_, index) => ({
        ...hurtState.particles[0],
        id: index + 1,
      })),
      nextParticleId: 56,
    };
    const nextHurt = withEvent(hurtGame, { type: "hurt" });
    const cappedState = advanceFeatherState(crowdedState, hurtGame, nextHurt);
    expect(cappedState.particles).toHaveLength(56);
    expect(cappedState.nextParticleId).toBe(67);

    const expiredGame = {
      ...nextHurt,
      elapsed: 1,
      events: [],
    };
    const expiredState = advanceFeatherState(
      cappedState,
      nextHurt,
      expiredGame,
    );
    expect(expiredState.particles).toHaveLength(0);

    const restartedGame = {
      ...expiredGame,
      elapsed: 0,
      events: [{ id: cappedState.lastEventId + 1, type: "start" as const }],
    };
    const resetState = advanceFeatherState(
      cappedState,
      expiredGame,
      restartedGame,
    );
    expect(resetState.particles).toHaveLength(0);
    expect(resetState.lastEventId).toBe(cappedState.lastEventId + 1);
  });

  it("computes particle position, spin, and fade from elapsed game time", () => {
    const feather: FeatherParticle = {
      bornAt: 0,
      id: 1,
      lifetime: 1,
      rotation: 10,
      size: 20,
      spin: 20,
      vx: 4,
      vy: -8,
      x: 2,
      y: 3,
    };

    expect(featherPose(feather, 0.5)).toEqual({
      opacity: 0.43,
      rotation: 20,
      x: 4,
      y: 379,
    });
  });
});
