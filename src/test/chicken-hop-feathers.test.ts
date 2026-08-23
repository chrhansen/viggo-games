import { describe, expect, it } from "vitest";

import {
  advanceFeatherState,
  createFeatherState,
  featherPose,
  type FeatherParticle,
} from "../../mobile/src/components/chicken-hop/chicken-hop-feather-model";
import {
  CHICKEN_HOP_WORLD_SCALE,
  createChickenHopGame,
  snapshotChickenHopGame,
  startChickenHopRun,
} from "../../mobile/src/game/chicken-hop/engine";

const runningGame = () => {
  const game = createChickenHopGame(390, 700, 42);
  startChickenHopRun(game);
  return game;
};

describe("Chicken Hop native feathers", () => {
  it("emits a deterministic nine-feather burst when the chicken jumps", () => {
    const previous = runningGame();
    const game = snapshotChickenHopGame(previous);
    game.elapsed = 1 / 60;
    game.player.onGround = false;
    game.player.vy = -500;

    const state = advanceFeatherState(createFeatherState(), previous, game);

    expect(state.particles).toHaveLength(9);
    expect(state.particles.map(({ id }) => id)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9,
    ]);
    for (const feather of state.particles) {
      expect(feather.size * CHICKEN_HOP_WORLD_SCALE).toBeGreaterThanOrEqual(8);
      expect(feather.size * CHICKEN_HOP_WORLD_SCALE).toBeLessThanOrEqual(13);
    }
  });

  it("throttles repeated flight bursts and stops when fuel use stops", () => {
    const previous = runningGame();
    previous.player.onGround = false;
    const firstFlight = snapshotChickenHopGame(previous);
    firstFlight.elapsed = 0.2;
    firstFlight.flyFuel -= 0.1;

    const firstState = advanceFeatherState(
      createFeatherState(),
      previous,
      firstFlight,
    );
    expect(firstState.particles).toHaveLength(3);

    const throttledFlight = snapshotChickenHopGame(firstFlight);
    throttledFlight.elapsed = 0.25;
    throttledFlight.flyFuel -= 0.1;
    const throttledState = advanceFeatherState(
      firstState,
      firstFlight,
      throttledFlight,
    );
    expect(throttledState).toBe(firstState);

    const nextFlight = snapshotChickenHopGame(throttledFlight);
    nextFlight.elapsed = 0.32;
    nextFlight.flyFuel -= 0.1;
    const nextState = advanceFeatherState(
      throttledState,
      throttledFlight,
      nextFlight,
    );
    expect(nextState.particles).toHaveLength(6);

    const coasting = snapshotChickenHopGame(nextFlight);
    coasting.elapsed = 0.36;
    expect(advanceFeatherState(nextState, nextFlight, coasting)).toBe(nextState);
  });

  it("emits hurt feathers, caps the field, expires particles, and resets runs", () => {
    const previous = runningGame();
    const hurtGame = snapshotChickenHopGame(previous);
    hurtGame.elapsed = 0.01;
    hurtGame.feedback = "hurt";
    hurtGame.feedbackId += 1;
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
    const nextHurt = snapshotChickenHopGame(hurtGame);
    nextHurt.elapsed = 0.02;
    nextHurt.feedbackId += 1;
    const cappedState = advanceFeatherState(crowdedState, hurtGame, nextHurt);
    expect(cappedState.particles).toHaveLength(56);
    expect(cappedState.nextParticleId).toBe(67);

    const expiredGame = snapshotChickenHopGame(nextHurt);
    expiredGame.elapsed = 1;
    expiredGame.feedback = null;
    const expiredState = advanceFeatherState(
      cappedState,
      nextHurt,
      expiredGame,
    );
    expect(expiredState.particles).toHaveLength(0);

    expiredState.lastFlightBurstAt = 0.5;
    const readyGame = snapshotChickenHopGame(expiredGame);
    readyGame.mode = "ready";
    const resetState = advanceFeatherState(
      expiredState,
      expiredGame,
      readyGame,
    );
    expect(resetState.particles).toHaveLength(0);
    expect(resetState.lastFlightBurstAt).toBe(Number.NEGATIVE_INFINITY);
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
