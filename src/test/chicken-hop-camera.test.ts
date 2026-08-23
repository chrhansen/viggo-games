import { describe, expect, it } from "vitest";

import {
  advanceChickenHopGame,
  CHICKEN_HOP_WORLD_SCALE,
  createChickenHopGame,
  snapshotChickenHopGame,
  startChickenHopRun,
} from "../../mobile/src/game/chicken-hop/engine";

const idleInput = { jump: false, left: false, right: false };

describe("Chicken Hop native camera", () => {
  it("zooms the world to 50 percent while preserving the chicken's screen size", () => {
    const engine = createChickenHopGame(390, 700, 42);
    const game = snapshotChickenHopGame(engine);

    expect(CHICKEN_HOP_WORLD_SCALE).toBe(0.5);
    expect(game.width * CHICKEN_HOP_WORLD_SCALE).toBe(390);
    expect(game.height * CHICKEN_HOP_WORLD_SCALE).toBe(700);
    expect(game.player.width * CHICKEN_HOP_WORLD_SCALE).toBe(30);
    expect(game.player.height * CHICKEN_HOP_WORLD_SCALE).toBe(25);
  });

  it("keeps score pace and off-screen cleanup stable in scaled world units", () => {
    const game = createChickenHopGame(390, 700, 42);
    startChickenHopRun(game);
    game.obstacleSpawner.cooldown = 999;
    game.platformSpawnerCooldown = 999;
    game.eggSpawnerCooldown = 999;
    game.obstacles = [
      {
        bob: 0,
        id: 1,
        kind: "robot",
        color: "#FFD166",
        x: -100,
        y: 0,
        width: 52,
        height: 42,
      },
      {
        bob: 0,
        id: 2,
        kind: "robot",
        color: "#FFD166",
        x: -70,
        y: 0,
        width: 52,
        height: 42,
      },
    ];

    advanceChickenHopGame(game, idleInput, 0.05);

    expect(game.score).toBeCloseTo(
      0.05 * (20 + game.speed * 0.02),
    );
    expect(game.obstacles.map(({ id }) => id)).toEqual([2]);
  });
});
