import { describe, expect, it } from "vitest";

import {
  advanceChickenHopGame as advanceCoreGame,
  chickenColorIds,
  chickenDesignIds,
  createChickenHopGame as createCoreGame,
  emptyChickenHopInput,
  normalizeChickenName,
  randomChickenName,
  resizeChickenHopGame as resizeCoreGame,
  setChickenHopTimeMode,
  snapshotChickenHopGame as snapshotCoreGame,
  startChickenHopRun as startCoreRun,
  toggleChickenHopPause as toggleCorePause,
  type ChickenHopGame as ChickenHopCoreGame,
  type ChickenHopInput as ChickenHopCoreInput,
} from "@viggo-games/chicken-hop-core";
import {
  chickenColors,
  chickenDesigns,
} from "../../mobile/src/game/chicken-hop/customization";
import {
  advanceChickenHopGame as advanceMobileGame,
  createChickenHopGame as createMobileGame,
  snapshotChickenHopGame as snapshotMobileGame,
  startChickenHopRun as startMobileRun,
} from "../../mobile/src/game/chicken-hop/engine";

const idleInput = emptyChickenHopInput();

function disableSpawners(game: ChickenHopCoreGame) {
  game.obstacleSpawner = {
    cooldown: 999,
    needsLanding: false,
    runChunksLeft: 0,
  };
  game.platformSpawnerCooldown = 999;
  game.eggSpawnerCooldown = 999;
}

function placeFrontObstacle(game: ChickenHopCoreGame, id: number) {
  const player = game.player;
  player.x = game.leftBound + 100;
  player.y = game.floorY - player.height;
  player.vx = 0;
  player.vy = 0;
  player.onGround = true;
  player.ground = null;
  player.invulnerableFor = 0;
  game.obstacles = [
    {
      color: "#FFD166",
      height: 40,
      id,
      kind: "robot",
      width: 52,
      x: player.x + player.width - 16,
      y: game.floorY - 40,
    },
  ];
}

describe("Chicken Hop shared engine", () => {
  it("starts a clean run while preserving the best score", () => {
    const game = createCoreGame({ best: 500, height: 700, seed: 42, width: 390 });
    game.score = 321.9;
    game.corn = 8;

    startCoreRun(game);

    expect(game.mode).toBe("playing");
    expect(game.score).toBe(0);
    expect(game.best).toBe(500);
    expect(game.corn).toBe(0);
    expect(game.hearts).toEqual([100, 100]);
    expect(game.flyFuel).toBe(5);
    expect(game.events.map(({ type }) => type)).toEqual(["start"]);
  });

  it("produces identical browser and mobile state for the same input timeline", () => {
    const webGame = createCoreGame({ height: 1400, seed: 0x56494747, width: 780 });
    const mobileGame = createMobileGame(390, 700, 0x56494747);
    startCoreRun(webGame);
    startMobileRun(mobileGame);

    for (let frame = 0; frame < 240; frame += 1) {
      const input: ChickenHopCoreInput = {
        down: false,
        jump: frame >= 12 && frame < 40,
        left: frame >= 120 && frame < 155,
        right: frame < 95 || frame >= 180,
      };
      advanceCoreGame(webGame, input, 1 / 60);
      advanceMobileGame(mobileGame, input, 1 / 60);
    }

    expect(snapshotCoreGame(mobileGame)).toEqual(snapshotCoreGame(webGame));
  });

  it("emits semantic jump and flight events while consuming shared fuel", () => {
    const game = createCoreGame({ height: 700, seed: 42, width: 390 });
    startCoreRun(game);
    disableSpawners(game);

    advanceCoreGame(game, { ...idleInput, jump: true }, 1 / 60);
    expect(game.events.map(({ type }) => type)).toContain("jump");
    expect(game.player.onGround).toBe(false);

    const eventTypes: string[] = [];
    for (let frame = 0; frame < 20; frame += 1) {
      advanceCoreGame(game, { ...idleInput, jump: true }, 1 / 60);
      eventTypes.push(...game.events.map(({ type }) => type));
    }

    expect(eventTypes).toContain("flight-feather");
    expect(game.flyFuel).toBeLessThan(game.flyFuelMax);
  });

  it("pauses without advancing and shares all time modes", () => {
    const game = createCoreGame({ seed: 42 });
    startCoreRun(game);
    disableSpawners(game);
    toggleCorePause(game);
    const score = game.score;

    advanceCoreGame(game, idleInput, 1);
    expect(game.mode).toBe("paused");
    expect(game.score).toBe(score);

    toggleCorePause(game);
    setChickenHopTimeMode(game, "slow");
    expect(game.timeScale).toBe(0.55);
    setChickenHopTimeMode(game, "fast");
    expect(game.timeScale).toBe(1.6);
    setChickenHopTimeMode(game, "normal");
    expect(game.timeScale).toBe(1);
  });

  it("collects corn and smashes eggs with browser-canonical rewards", () => {
    const game = createCoreGame({ height: 700, seed: 42, width: 390 });
    startCoreRun(game);
    disableSpawners(game);
    const x = game.player.x + game.player.width / 2;
    const y = game.player.y + game.player.height / 2;
    game.pickups = [
      {
        elapsed: 0,
        id: 1,
        kind: "corn",
        radius: 15,
        taken: false,
        value: 1,
        x,
        y,
      },
      {
        elapsed: 0,
        id: 2,
        kind: "gold-corn",
        radius: 20,
        taken: false,
        value: 3,
        x,
        y,
      },
    ];
    game.corn = 1;
    game.eggs = [
      {
        elapsed: 0,
        id: 3,
        radius: 14,
        smashed: false,
        smashedFor: 0,
        x,
        y,
      },
    ];

    advanceCoreGame(game, idleInput, 0);

    expect(game.corn).toBe(4);
    expect(game.score).toBe(240);
    expect(game.pickups.every(({ taken }) => taken)).toBe(true);
    expect(game.eggs[0].smashed).toBe(true);
    expect(game.events.map(({ type }) => type)).toEqual(["corn", "corn", "egg"]);
  });

  it("uses both hearts before ending a run", () => {
    const game = createCoreGame({ height: 700, seed: 42, width: 390 });
    startCoreRun(game);
    disableSpawners(game);

    placeFrontObstacle(game, 1);
    advanceCoreGame(game, idleInput, 0);
    expect(game.hearts).toEqual([88, 100]);
    expect(game.events.map(({ type }) => type)).toEqual(["hurt"]);

    for (let hit = 2; hit <= 18; hit += 1) {
      placeFrontObstacle(game, hit);
      advanceCoreGame(game, idleInput, 0);
    }

    expect(game.hearts).toEqual([0, 0]);
    expect(game.heartIndex).toBe(1);
    expect(game.mode).toBe("gameover");
    expect(game.events.map(({ type }) => type)).toEqual(["hurt", "gameover"]);
  });

  it("lands safely on shared one-way platforms", () => {
    const game = createCoreGame({ height: 700, seed: 42, width: 390 });
    startCoreRun(game);
    disableSpawners(game);
    const platformY = game.floorY - 96;
    game.platforms = [
      {
        floorOffset: 96,
        height: 18,
        id: 1,
        kind: "shelf",
        width: 140,
        x: game.player.x - 20,
        y: platformY,
      },
    ];
    game.player.y = platformY - game.player.height - 10;
    game.player.vy = 300;
    game.player.onGround = false;

    advanceCoreGame(game, idleInput, 0.05);

    expect(game.player.onGround).toBe(true);
    expect(game.player.ground).toEqual({ id: 1, type: "platform" });
    expect(game.player.y).toBe(platformY - game.player.height);
    expect(game.hearts).toEqual([100, 100]);
  });

  it("spawns shared stairs and shelves from the canonical terrain rules", () => {
    const game = createCoreGame({ height: 700, seed: 42, width: 390 });
    startCoreRun(game);
    disableSpawners(game);
    game.terrain.runLeft = 2;
    game.platformSpawnerCooldown = 0;

    advanceCoreGame(game, idleInput, 0);

    expect(game.platforms.filter(({ kind }) => kind === "step")).toHaveLength(6);
    expect(game.platforms.filter(({ kind }) => kind === "shelf")).toHaveLength(1);
    expect(
      new Set(game.platforms.map(({ floorOffset }) => floorOffset)).size,
    ).toBeGreaterThan(1);
  });

  it("preserves floor-relative entities and support when resized", () => {
    const game = createCoreGame({ height: 700, seed: 42, width: 390 });
    startCoreRun(game);
    const previousFloorY = game.floorY;
    game.platforms = [
      {
        floorOffset: 96,
        height: 18,
        id: 1,
        kind: "shelf",
        width: 140,
        x: game.player.x - 20,
        y: game.floorY - 96,
      },
    ];
    game.player.ground = { id: 1, type: "platform" };
    game.player.onGround = true;
    game.player.y = game.platforms[0].y - game.player.height;
    game.pickups = [
      {
        elapsed: 0,
        id: 2,
        kind: "corn",
        radius: 15,
        taken: false,
        value: 1,
        x: 300,
        y: 400,
      },
    ];

    resizeCoreGame(game, 800, 360);

    const floorDelta = game.floorY - previousFloorY;
    expect(game.platforms[0].y).toBe(game.floorY - 96);
    expect(game.player.y).toBe(game.platforms[0].y - game.player.height);
    expect(game.pickups[0].y).toBe(400 + floorDelta);
  });

  it("creates detached snapshots for renderers", () => {
    const game = createCoreGame({ seed: 42 });
    const snapshot = snapshotCoreGame(game);

    snapshot.player.x = 0;
    snapshot.hearts[0] = 0;
    snapshot.obstacleSpawner.cooldown = 0;

    expect(game.player.x).not.toBe(0);
    expect(game.hearts[0]).toBe(100);
    expect(game.obstacleSpawner.cooldown).toBe(0.35);
  });

  it("projects shared entities into the native render model", () => {
    const engine = createMobileGame(390, 700, 42);
    startMobileRun(engine);
    engine.pickups[0] = {
      elapsed: 0,
      id: 1,
      kind: "corn",
      radius: 15,
      taken: true,
      value: 1,
      x: 200,
      y: 300,
    };
    engine.platforms[0] = {
      floorOffset: 96,
      height: 18,
      id: 2,
      kind: "shelf",
      width: 200,
      x: 400,
      y: engine.floorY - 96,
    };

    const rendered = snapshotMobileGame(engine);

    expect(rendered.pickups).toEqual([]);
    expect(rendered.obstacles).toContainEqual(
      expect.objectContaining({ id: 2, kind: "shelf" }),
    );
    expect(rendered.player.width).toBe(60);
  });
});

describe("Chicken Hop native customization", () => {
  it("matches the browser game's designs and color swatches", () => {
    expect(chickenDesigns.map(({ id }) => id)).toEqual(chickenDesignIds);
    expect(chickenColors.map(({ id }) => id)).toEqual(chickenColorIds);
    expect(chickenColors.map(({ id, swatch }) => [id, swatch])).toEqual([
      ["butter", "#FFF7EA"],
      ["red", "#FF3B30"],
      ["blue", "#4CC9F0"],
      ["green", "#2EE59D"],
      ["grape", "#9B5DE5"],
      ["charcoal", "#34324A"],
    ]);
  });

  it("normalizes names like the browser game and avoids repeats", () => {
    expect(normalizeChickenName("  Captain    Cluck  ")).toBe("Captain Cluck");
    expect(normalizeChickenName(" ")).toBe("Nugget");
    expect(randomChickenName("Nugget", () => 0)).toBe("Peep");
  });
});
