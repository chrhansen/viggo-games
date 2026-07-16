import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  chickenColors,
  chickenDesigns,
  normalizeChickenName,
  randomChickenName,
} from "../../mobile/src/game/chicken-hop/customization";
import {
  advanceChickenHopGame,
  createChickenHopGame,
  resizeChickenHopGame,
  snapshotChickenHopGame,
  startChickenHopRun,
  toggleChickenHopPause,
} from "../../mobile/src/game/chicken-hop/engine";

const idleInput = { jump: false, left: false, right: false };

function disableSpawners(game: ReturnType<typeof createChickenHopGame>) {
  game.obstacleTimer = 999;
  game.platformTimer = 999;
  game.pickupTimer = 999;
  game.eggTimer = 999;
}

describe("Chicken Hop native engine", () => {
  it("starts a clean run while preserving the best score", () => {
    const game = createChickenHopGame(390, 700, 42);
    game.score = 321.9;
    game.best = 500;
    game.corn = 8;

    startChickenHopRun(game);

    expect(game.mode).toBe("playing");
    expect(game.score).toBe(0);
    expect(game.best).toBe(500);
    expect(game.corn).toBe(0);
    expect(game.hearts).toEqual([100, 100]);
    expect(game.flyFuel).toBe(5);
  });

  it("uses a chicken collision size that is 35 percent smaller", () => {
    const game = createChickenHopGame(390, 700, 42);

    expect(game.player.width).toBe(30);
    expect(game.player.height).toBe(25);
  });

  it("jumps on a new press and uses fuel while the button stays held", () => {
    const game = createChickenHopGame(390, 700, 42);
    startChickenHopRun(game);
    disableSpawners(game);
    const startY = game.player.y;

    for (let frame = 0; frame < 20; frame += 1) {
      advanceChickenHopGame(game, { ...idleInput, jump: true }, 1 / 60);
    }

    expect(game.player.y).toBeLessThan(startY);
    expect(game.player.onGround).toBe(false);
    expect(game.flyFuel).toBeLessThan(game.flyFuelMax);
  });

  it("pauses without advancing and resumes the same run", () => {
    const game = createChickenHopGame(390, 700, 42);
    startChickenHopRun(game);
    disableSpawners(game);
    toggleChickenHopPause(game);
    const score = game.score;

    advanceChickenHopGame(game, idleInput, 1);

    expect(game.mode).toBe("paused");
    expect(game.score).toBe(score);
    toggleChickenHopPause(game);
    expect(game.mode).toBe("playing");
  });

  it("refills flight fuel after resting on the floor", () => {
    const game = createChickenHopGame(390, 700, 42);
    startChickenHopRun(game);
    disableSpawners(game);
    game.flyFuel = 1.5;
    game.flyRefuelFor = 0.04;

    advanceChickenHopGame(game, idleInput, 0.05);

    expect(game.flyFuel).toBe(game.flyFuelMax);
  });

  it("collects regular and gold corn for the correct rewards", () => {
    const game = createChickenHopGame(390, 700, 42);
    startChickenHopRun(game);
    disableSpawners(game);
    const { player } = game;
    game.pickups = [
      {
        id: 1,
        kind: "corn",
        value: 1,
        x: player.x + player.width / 2,
        y: player.y + player.height / 2,
        radius: 15,
        phase: 0,
      },
      {
        id: 2,
        kind: "gold-corn",
        value: 3,
        x: player.x + player.width / 2,
        y: player.y + player.height / 2,
        radius: 20,
        phase: 0,
      },
    ];

    advanceChickenHopGame(game, idleInput, 0);

    expect(game.corn).toBe(4);
    expect(game.score).toBe(240);
    expect(game.pickups).toHaveLength(0);
  });

  it("spawns regular and gold corn with their matching values", () => {
    const spawnPickup = (seed: number) => {
      const game = createChickenHopGame(390, 700, seed);
      startChickenHopRun(game);
      game.elapsed = 9;
      game.obstacleTimer = 999;
      game.pickupTimer = 0;
      game.eggTimer = 999;
      advanceChickenHopGame(game, idleInput, 0);
      return game.pickups[0];
    };

    expect(spawnPickup(42)).toMatchObject({ kind: "corn", value: 1 });
    expect(spawnPickup(1972)).toMatchObject({ kind: "gold-corn", value: 3 });
  });

  it("lets eggs remove one corn without making the counter negative", () => {
    const game = createChickenHopGame(390, 700, 42);
    startChickenHopRun(game);
    disableSpawners(game);
    game.corn = 2;
    const { player } = game;
    game.eggs = [
      {
        id: 1,
        x: player.x + player.width / 2,
        y: player.y + player.height / 2,
        radius: 14,
        phase: 0,
      },
    ];

    advanceChickenHopGame(game, idleInput, 0);

    expect(game.corn).toBe(1);
    expect(game.eggs).toHaveLength(0);

    game.corn = 0;
    game.eggs = [
      {
        id: 2,
        x: player.x + player.width / 2,
        y: player.y + player.height / 2,
        radius: 14,
        phase: 0,
      },
    ];
    advanceChickenHopGame(game, idleInput, 0);
    expect(game.corn).toBe(0);
  });

  it("preserves floor-relative positions across orientation changes", () => {
    const game = createChickenHopGame(390, 700, 42);
    startChickenHopRun(game);
    const previousFloorY = game.floorY;
    game.player.onGround = false;
    game.player.y = 300;
    game.pickups = [
      { id: 1, kind: "corn", value: 1, x: 300, y: 400, radius: 15, phase: 0 },
    ];
    game.eggs = [{ id: 2, x: 320, y: 480, radius: 14, phase: 0 }];

    resizeChickenHopGame(game, 800, 360);

    const floorDelta = game.floorY - previousFloorY;
    expect(game.player.y).toBe(300 + floorDelta);
    expect(game.pickups[0].y).toBe(400 + floorDelta);
    expect(game.eggs[0].y).toBe(game.floorY - game.eggs[0].radius * 1.1);
  });

  it("treats obstacle tops as safe landing surfaces", () => {
    const game = createChickenHopGame(390, 700, 42);
    startChickenHopRun(game);
    disableSpawners(game);
    game.obstacles = [
      {
        id: 1,
        kind: "block",
        color: "#FF6A3D",
        x: game.player.x - 20,
        y: game.floorY - 34,
        width: 110,
        height: 34,
      },
    ];
    game.player.y = game.obstacles[0].y - game.player.height - 10;
    game.player.vy = 300;
    game.player.onGround = false;

    advanceChickenHopGame(game, idleInput, 0.05);

    expect(game.player.onGround).toBe(true);
    expect(game.player.groundObstacleId).toBe(1);
    expect(game.player.y).toBe(game.obstacles[0].y - game.player.height);
    expect(game.hearts).toEqual([100, 100]);
  });

  it("spawns web-style stairs and an elevated shelf", () => {
    const game = createChickenHopGame(390, 700, 42);
    startChickenHopRun(game);
    disableSpawners(game);
    game.obstacles = [
      {
        id: 100,
        kind: "book",
        color: "#2EE59D",
        x: game.width + 280,
        y: game.floorY - 22,
        width: 58,
        height: 22,
      },
    ];
    game.platformTimer = 0;

    advanceChickenHopGame(game, idleInput, 0);

    const steps = game.obstacles.filter(({ kind }) => kind === "step");
    const shelves = game.obstacles.filter(({ kind }) => kind === "shelf");
    expect(steps).toHaveLength(4);
    expect(shelves).toHaveLength(1);
    expect(new Set(steps.map(({ floorOffset }) => floorOffset)).size).toBe(4);
    expect(steps[0].x).toBeGreaterThan(
      game.obstacles[0].x + game.obstacles[0].width,
    );
    expect(shelves[0].y).toBeLessThan(game.floorY - shelves[0].height);
    expect(game.platformTimer).toBeGreaterThanOrEqual(4.8);
    expect(game.platformTimer).toBeLessThanOrEqual(7.2);
    expect(game.pickups).toHaveLength(1);
    expect(game.pickups[0]).toMatchObject({ kind: "corn", value: 1 });
    expect(game.pickups[0].y).toBeLessThan(shelves[0].y);
  });

  it("sometimes leaves an elevated shelf clear of corn", () => {
    const game = createChickenHopGame(390, 700, 1);
    startChickenHopRun(game);
    disableSpawners(game);
    game.platformTimer = 0;

    advanceChickenHopGame(game, idleInput, 0);

    expect(game.obstacles.some(({ kind }) => kind === "shelf")).toBe(true);
    expect(game.pickups).toHaveLength(0);
  });

  it("lands safely on every stair height", () => {
    const game = createChickenHopGame(390, 700, 42);
    startChickenHopRun(game);
    disableSpawners(game);
    game.platformTimer = 0;
    advanceChickenHopGame(game, idleInput, 0);
    disableSpawners(game);

    const steps = game.obstacles.filter(({ kind }) => kind === "step");
    for (const step of steps) {
      const activeStep = { ...step, x: game.player.x - 5 };
      game.obstacles = [activeStep];
      game.player.y = step.y - game.player.height - 8;
      game.player.vx = 0;
      game.player.vy = 300;
      game.player.onGround = false;
      game.player.groundObstacleId = null;

      advanceChickenHopGame(game, idleInput, 0.04);

      expect(game.player.onGround).toBe(true);
      expect(game.player.groundObstacleId).toBe(activeStep.id);
      expect(game.player.y).toBe(activeStep.y - game.player.height);
      expect(game.hearts).toEqual([100, 100]);
    }
  });

  it("lands on a shelf and falls after walking off its edge", () => {
    const game = createChickenHopGame(390, 700, 42);
    startChickenHopRun(game);
    disableSpawners(game);
    game.obstacles = [
      {
        id: 1,
        kind: "shelf",
        color: "#2EE59D",
        x: game.player.x - 20,
        y: game.floorY - 100,
        width: 120,
        height: 18,
        floorOffset: 100,
      },
    ];
    game.player.y =
      game.obstacles[0].y - game.player.height - 12;
    game.player.vy = 360;
    game.player.onGround = false;

    advanceChickenHopGame(game, idleInput, 0.05);

    expect(game.player.onGround).toBe(true);
    expect(game.player.groundObstacleId).toBe(1);
    expect(game.player.y).toBe(
      game.obstacles[0].y - game.player.height,
    );

    game.obstacles[0].x =
      game.player.x + game.player.width + 24;
    advanceChickenHopGame(game, idleInput, 1 / 60);

    expect(game.player.onGround).toBe(false);
    expect(game.player.groundObstacleId).toBeNull();
    expect(game.player.vy).toBeGreaterThan(0);
  });

  it("treats shelves as one-way surfaces when jumping from below", () => {
    const game = createChickenHopGame(390, 700, 42);
    startChickenHopRun(game);
    disableSpawners(game);
    game.obstacles = [
      {
        id: 1,
        kind: "shelf",
        color: "#2EE59D",
        x: game.player.x - 20,
        y: game.floorY - 100,
        width: 120,
        height: 18,
        floorOffset: 100,
      },
    ];
    game.player.y = game.obstacles[0].y + 6;
    game.player.vy = -420;
    game.player.onGround = false;

    advanceChickenHopGame(game, idleInput, 1 / 60);

    expect(game.player.onGround).toBe(false);
    expect(game.player.groundObstacleId).toBeNull();
    expect(game.player.y).toBeLessThan(game.obstacles[0].y + 6);
    expect(game.hearts).toEqual([100, 100]);
  });

  it("keeps a supported chicken on the same shelf after rotation", () => {
    const game = createChickenHopGame(390, 700, 42);
    startChickenHopRun(game);
    game.obstacles = [
      {
        id: 1,
        kind: "shelf",
        color: "#2EE59D",
        x: game.player.x - 20,
        y: game.floorY - 100,
        width: 120,
        height: 18,
        floorOffset: 100,
      },
    ];
    game.player.onGround = true;
    game.player.groundObstacleId = 1;
    game.player.y = game.obstacles[0].y - game.player.height;

    resizeChickenHopGame(game, 800, 360);

    expect(game.obstacles[0].y).toBe(game.floorY - 100);
    expect(game.player.y).toBe(
      game.obstacles[0].y - game.player.height,
    );
  });

  it("uses obstacle height as the resize fallback and returns missing support to the floor", () => {
    const game = createChickenHopGame(390, 700, 42);
    startChickenHopRun(game);
    game.obstacles = [
      {
        id: 1,
        kind: "block",
        color: "#FF6A3D",
        x: game.player.x - 20,
        y: game.floorY - 34,
        width: 110,
        height: 34,
      },
    ];
    game.player.onGround = true;
    game.player.groundObstacleId = 2;

    resizeChickenHopGame(game, 800, 360);

    expect(game.obstacles[0].y).toBe(game.floorY - 34);
    expect(game.player.y).toBe(game.floorY - game.player.height);
  });

  it("uses both hearts before ending the run on repeated front hits", () => {
    const game = createChickenHopGame(390, 700, 42);
    startChickenHopRun(game);
    disableSpawners(game);

    for (let hit = 0; hit < 10; hit += 1) {
      game.player.x = game.leftBound + 50;
      game.player.y = game.floorY - game.player.height;
      game.player.vx = 0;
      game.player.vy = 0;
      game.player.onGround = true;
      game.player.groundObstacleId = null;
      game.player.invulnerableFor = 0;
      game.obstacles = [
        {
          id: hit + 1,
          kind: "robot",
          color: "#FFD166",
          x: game.player.x + game.player.width - 8,
          y: game.floorY - 42,
          width: 52,
          height: 42,
        },
      ];
      advanceChickenHopGame(game, idleInput, 0);
    }

    expect(game.hearts).toEqual([0, 0]);
    expect(game.heartIndex).toBe(1);
    expect(game.mode).toBe("gameover");
  });

  it("drains one fifth of a heart per unshielded front hit", () => {
    const game = createChickenHopGame(390, 700, 42);
    startChickenHopRun(game);
    disableSpawners(game);
    game.obstacles = [
      {
        id: 1,
        kind: "robot",
        color: "#FFD166",
        x: game.player.x + game.player.width - 8,
        y: game.floorY - 42,
        width: 52,
        height: 42,
      },
    ];

    advanceChickenHopGame(game, idleInput, 0);

    expect(game.hearts).toEqual([80, 100]);
    expect(game.player.invulnerableFor).toBeGreaterThan(0);
    expect(game.mode).toBe("playing");
  });

  it("creates detached snapshots for React rendering", () => {
    const game = createChickenHopGame(390, 700, 42);
    const snapshot = snapshotChickenHopGame(game);

    snapshot.player.x = 0;
    snapshot.hearts[0] = 0;

    expect(game.player.x).not.toBe(0);
    expect(game.hearts[0]).toBe(100);
  });
});

describe("Chicken Hop native customization", () => {
  it("matches the web game's designs and color swatches", () => {
    expect(chickenDesigns.map(({ id }) => id)).toEqual([
      "classic",
      "spots",
      "flame",
      "robot",
    ]);
    expect(chickenColors.map(({ id, swatch }) => [id, swatch])).toEqual([
      ["butter", "#FFF7EA"],
      ["red", "#FF3B30"],
      ["blue", "#4CC9F0"],
      ["green", "#2EE59D"],
      ["grape", "#9B5DE5"],
      ["charcoal", "#34324A"],
    ]);
  });

  it("normalizes names like the web game and avoids repeating random names", () => {
    expect(normalizeChickenName("  Captain    Cluck  ")).toBe("Captain Cluck");
    expect(normalizeChickenName(" ")).toBe("Nugget");
    expect(randomChickenName("Nugget", () => 0)).toBe("Peep");
  });
});

describe("Chicken Hop native presentation regressions", () => {
  const mobileRoot = path.resolve(process.cwd(), "mobile", "src");

  it("renders kernels without corn-cob emoji artwork", () => {
    const scene = fs.readFileSync(
      path.join(mobileRoot, "components", "chicken-hop", "chicken-hop-scene.tsx"),
      "utf8",
    );
    const hud = fs.readFileSync(
      path.join(mobileRoot, "components", "chicken-hop", "chicken-hop-hud.tsx"),
      "utf8",
    );

    expect(scene).not.toContain("🌽");
    expect(hud).not.toContain("🌽");
    expect(scene).toContain("CornKernel");
    expect(hud).toContain("CornKernel");
  });

  it("draws the game edge-to-edge while insetting interactive controls", () => {
    const screen = fs.readFileSync(
      path.join(mobileRoot, "app", "chicken-hop.tsx"),
      "utf8",
    );

    expect(screen).toContain("useSafeAreaInsets");
    expect(screen).not.toContain("<SafeAreaView");
    expect(screen).toContain("safeLeft={insets.left}");
    expect(screen).toContain("safeRight={insets.right}");
  });
});
