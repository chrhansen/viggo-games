import { describe, expect, it } from "vitest";

import {
  advanceChickenHopGame,
  CHICKEN_HOP_WORLD_SCALE,
  createChickenHopGame,
  startChickenHopRun,
} from "../../mobile/src/game/chicken-hop/engine";

const idleInput = { jump: false, left: false, right: false };
const toWorld = (screenPixels: number) =>
  screenPixels / CHICKEN_HOP_WORLD_SCALE;

describe("Chicken Hop native camera", () => {
  it("zooms the world to 50 percent while preserving the chicken's screen size", () => {
    const game = createChickenHopGame(390, 700, 42);

    expect(CHICKEN_HOP_WORLD_SCALE).toBe(0.5);
    expect(game.width * CHICKEN_HOP_WORLD_SCALE).toBe(390);
    expect(game.height * CHICKEN_HOP_WORLD_SCALE).toBe(700);
    expect(game.player.width * CHICKEN_HOP_WORLD_SCALE).toBe(30);
    expect(game.player.height * CHICKEN_HOP_WORLD_SCALE).toBe(25);
  });

  it("keeps score pace and off-screen cleanup stable in scaled world units", () => {
    const game = createChickenHopGame(390, 700, 42);
    startChickenHopRun(game);
    game.obstacleTimer = 999;
    game.platformTimer = 999;
    game.pickupTimer = 999;
    game.eggTimer = 999;
    game.obstacles = [
      {
        id: 1,
        kind: "robot",
        color: "#FFD166",
        x: toWorld(-60) - 52,
        y: 0,
        width: 52,
        height: 42,
      },
      {
        id: 2,
        kind: "robot",
        color: "#FFD166",
        x: toWorld(-60) + 30 - 52,
        y: 0,
        width: 52,
        height: 42,
      },
    ];

    advanceChickenHopGame(game, idleInput, 0.05);

    expect(game.score).toBeCloseTo(
      0.05 * (18 + game.speed * CHICKEN_HOP_WORLD_SCALE * 0.025),
    );
    expect(game.obstacles.map(({ id }) => id)).toEqual([2]);
  });
});
