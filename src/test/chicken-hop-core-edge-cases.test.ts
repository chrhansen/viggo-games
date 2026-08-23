import { describe, expect, it } from "vitest";

import {
  advanceChickenHopGame,
  createChickenHopGame,
  emptyChickenHopInput,
  startChickenHopRun,
  type ChickenHopGame,
} from "@viggo-games/chicken-hop-core";

const idleInput = emptyChickenHopInput();

function createRunningGame() {
  const game = createChickenHopGame({ height: 700, seed: 42, width: 390 });
  startChickenHopRun(game);
  game.obstacleSpawner = {
    cooldown: 999,
    needsLanding: false,
    runChunksLeft: 0,
  };
  game.platformSpawnerCooldown = 999;
  game.eggSpawnerCooldown = 999;
  return game;
}

function frontObstacle(game: ChickenHopGame, id: number) {
  return {
    color: "#FFD166",
    height: 40,
    id,
    kind: "robot" as const,
    width: 52,
    x: game.player.x + game.player.width - 16,
    y: game.floorY - 40,
  };
}

describe("Chicken Hop shared engine edge cases", () => {
  it("drops through a one-way platform and lands back on the floor", () => {
    const game = createRunningGame();
    const platformY = game.floorY - 96;
    game.platforms = [
      {
        floorOffset: 96,
        height: 18,
        id: 1,
        kind: "shelf",
        width: 160,
        x: game.player.x - 30,
        y: platformY,
      },
    ];
    game.player.ground = { id: 1, type: "platform" };
    game.player.onGround = true;
    game.player.y = platformY - game.player.height;

    advanceChickenHopGame(game, { ...idleInput, down: true }, 1 / 60);

    expect(game.player.onGround).toBe(false);
    expect(game.player.ground).toBeNull();
    expect(game.player.dropThroughFor).toBeGreaterThan(0);
    expect(game.player.y).toBeGreaterThan(platformY - game.player.height);

    for (let frame = 0; frame < 90 && !game.player.onGround; frame += 1) {
      advanceChickenHopGame(game, idleInput, 1 / 60);
    }

    expect(game.player.onGround).toBe(true);
    expect(game.player.ground).toBeNull();
    expect(game.player.y).toBe(game.floorY - game.player.height);
  });

  it("lands safely on obstacle tops without taking front-collision damage", () => {
    const game = createRunningGame();
    game.obstacles = [
      {
        ...frontObstacle(game, 1),
        width: 140,
        x: game.player.x - 30,
      },
    ];
    const obstacle = game.obstacles[0];
    game.player.y = obstacle.y - game.player.height - 10;
    game.player.vy = 300;
    game.player.onGround = false;

    advanceChickenHopGame(game, idleInput, 0.05);

    expect(game.player.onGround).toBe(true);
    expect(game.player.ground).toEqual({ id: 1, type: "obstacle" });
    expect(game.player.y).toBe(obstacle.y - game.player.height);
    expect(game.hearts).toEqual([100, 100]);
    expect(game.events.map(({ type }) => type)).toContain("land");
  });

  it("ignores rear collisions and shields repeated hits during invulnerability", () => {
    const game = createRunningGame();
    game.obstacles = [
      {
        ...frontObstacle(game, 1),
        x: game.player.x - 30,
      },
    ];

    advanceChickenHopGame(game, idleInput, 0);
    expect(game.hearts).toEqual([100, 100]);

    game.obstacles = [frontObstacle(game, 2)];
    advanceChickenHopGame(game, idleInput, 0);
    expect(game.hearts).toEqual([88, 100]);

    game.obstacles = [frontObstacle(game, 3)];
    advanceChickenHopGame(game, idleInput, 0);
    expect(game.hearts).toEqual([88, 100]);
    expect(game.events).toEqual([]);
  });

  it("forces a clear landing gap between obstacle-run chunks", () => {
    const game = createRunningGame();
    game.obstacleSpawner = {
      cooldown: 0,
      needsLanding: false,
      runChunksLeft: 2,
    };

    advanceChickenHopGame(game, idleInput, 0);
    expect(game.obstacles).toHaveLength(1);
    expect(game.obstacleSpawner).toMatchObject({
      needsLanding: true,
      runChunksLeft: 1,
    });

    const first = game.obstacles[0];
    game.obstacleSpawner.cooldown = 0;
    advanceChickenHopGame(game, idleInput, 0);

    const second = game.obstacles[1];
    const airTime = (2 * Math.abs(game.jumpVelocity)) / game.gravity;
    const landingGap = Math.max(
      game.player.width + 200,
      game.speed * airTime + 220,
    );
    expect(second.x - (first.x + first.width)).toBeGreaterThanOrEqual(landingGap);
    expect(game.obstacleSpawner).toMatchObject({
      needsLanding: false,
      runChunksLeft: 0,
    });
  });

  it("takes both deterministic obstacle-run start outcomes", () => {
    const starting = createRunningGame();
    starting.randomSeed = 42;
    starting.obstacleSpawner.cooldown = 0;
    advanceChickenHopGame(starting, idleInput, 0);

    expect(starting.obstacles).toHaveLength(1);
    expect(starting.obstacleSpawner.cooldown).toBeGreaterThan(0);

    const skipping = createRunningGame();
    skipping.randomSeed = 1000;
    skipping.obstacleSpawner.cooldown = 0;
    advanceChickenHopGame(skipping, idleInput, 0);

    expect(skipping.obstacles).toHaveLength(0);
    expect(skipping.obstacleSpawner).toMatchObject({
      needsLanding: false,
      runChunksLeft: 0,
    });
    expect(skipping.obstacleSpawner.cooldown).toBeGreaterThan(0);
  });

  it("refuels on elevated support and emits direction-specific clucks", () => {
    const game = createRunningGame();
    game.platforms = [
      {
        floorOffset: 96,
        height: 18,
        id: 1,
        kind: "shelf",
        width: 200,
        x: game.player.x - 40,
        y: game.floorY - 96,
      },
    ];
    game.player.ground = { id: 1, type: "platform" };
    game.player.onGround = true;
    game.player.y = game.platforms[0].y - game.player.height;
    game.flyFuel = 1;
    game.flyRefuelFor = 0.01;

    advanceChickenHopGame(game, { ...idleInput, right: true }, 0.05);

    expect(game.flyFuel).toBe(game.flyFuelMax);
    expect(game.events.map(({ type }) => type)).toContain("cluck-fast");

    game.player.cluckCooldown = 0;
    advanceChickenHopGame(game, { ...idleInput, left: true }, 0);
    expect(game.events.map(({ type }) => type)).toContain("cluck-slow");
  });

  it("cleans off-screen entities and expires smashed eggs", () => {
    const game = createRunningGame();
    game.obstacles = [
      { ...frontObstacle(game, 1), x: -200 },
      { ...frontObstacle(game, 2), x: 500 },
    ];
    game.platforms = [
      {
        floorOffset: 96,
        height: 18,
        id: 3,
        kind: "shelf",
        width: 140,
        x: -220,
        y: game.floorY - 96,
      },
      {
        floorOffset: 96,
        height: 18,
        id: 4,
        kind: "shelf",
        width: 140,
        x: 500,
        y: game.floorY - 96,
      },
    ];
    game.pickups = [
      {
        elapsed: 0,
        id: 5,
        kind: "corn",
        radius: 15,
        taken: false,
        value: 1,
        x: -100,
        y: game.floorY - 80,
      },
      {
        elapsed: 0,
        id: 6,
        kind: "corn",
        radius: 15,
        taken: false,
        value: 1,
        x: 500,
        y: game.floorY - 80,
      },
    ];
    game.eggs = [
      {
        elapsed: 0,
        id: 7,
        radius: 14,
        smashed: false,
        smashedFor: 0,
        x: -100,
        y: game.floorY - 14,
      },
      {
        elapsed: 0,
        id: 8,
        radius: 14,
        smashed: true,
        smashedFor: 0.59,
        x: 500,
        y: game.floorY - 14,
      },
      {
        elapsed: 0,
        id: 9,
        radius: 14,
        smashed: false,
        smashedFor: 0,
        x: 550,
        y: game.floorY - 14,
      },
    ];

    advanceChickenHopGame(game, idleInput, 0.05);

    expect(game.obstacles.map(({ id }) => id)).toEqual([2]);
    expect(game.platforms.map(({ id }) => id)).toEqual([4]);
    expect(game.pickups.map(({ id }) => id)).toEqual([6]);
    expect(game.eggs.map(({ id }) => id)).toEqual([9]);
  });

  it("supports descending terrain runs", () => {
    const game = createRunningGame();
    game.randomSeed = 42;
    game.terrain = { level: 1, runLeft: 1 };
    game.platformSpawnerCooldown = 0;

    advanceChickenHopGame(game, idleInput, 0);

    expect(game.terrain).toEqual({ level: 0, runLeft: 0 });
    expect(game.platforms).not.toHaveLength(0);
    expect(game.platforms.every(({ kind }) => kind === "step")).toBe(true);
    expect(game.platforms[0].floorOffset).toBeLessThan(game.plateauLift);
  });

  it("takes both deterministic egg-spawner outcomes", () => {
    const spawning = createRunningGame();
    spawning.randomSeed = 42;
    spawning.eggSpawnerCooldown = 0;
    advanceChickenHopGame(spawning, idleInput, 0);

    expect(spawning.eggs).toHaveLength(1);
    expect(spawning.eggSpawnerCooldown).toBeGreaterThan(0);

    const skipping = createRunningGame();
    skipping.randomSeed = 3;
    skipping.eggSpawnerCooldown = 0;
    advanceChickenHopGame(skipping, idleInput, 0);

    expect(skipping.eggs).toHaveLength(0);
    expect(skipping.eggSpawnerCooldown).toBeGreaterThan(0);
  });
});
