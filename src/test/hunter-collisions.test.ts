import { describe, expect, it } from "vitest";
import { createCollisionWorld, movingBodyCircles, PLAYER_RADIUS } from "../../public/games/hunter-guy/collisions.js";

const position = (x: number, z: number) => ({ x, y: 3, z });

describe("Hunter Guy player collisions", () => {
  it("stops at a thin trunk even when a movement crosses it in one frame", () => {
    const world = createCollisionWorld([{ x: 0, z: 0, radius: 0.23 }], () => [], 180);
    const player = position(-4, 0);
    world.move(player, 8, 0);
    expect(player.x).toBeCloseTo(-0.23 - PLAYER_RADIUS, 3);
    expect(player.z).toBe(0);
    expect(player.y).toBe(3);
  });

  it("slides along a trunk while moving diagonally", () => {
    const world = createCollisionWorld([{ x: 0, z: 0, radius: 0.5 }], () => [], 180);
    const player = position(-1, 0);
    world.move(player, 1, 1);
    expect(player.z).toBeGreaterThan(0.8);
    expect(Math.hypot(player.x, player.z)).toBeGreaterThanOrEqual(0.85);
  });

  it("checks trunks across grid cell boundaries and handles tight gaps", () => {
    const trunks = [{ x: 8, z: -0.5, radius: 0.4 }, { x: 8, z: 0.5, radius: 0.4 }];
    const world = createCollisionWorld(trunks, () => [], 180);
    const player = position(6, 0);
    world.move(player, 4, 0);
    expect(player.x).toBeLessThan(8);
    for (const trunk of trunks) expect(Math.hypot(player.x - trunk.x, player.z - trunk.z)).toBeGreaterThanOrEqual(0.7499);
  });

  it("resolves a moving body entering a stationary player and releases its old location", () => {
    const body = { x: 0, z: 0, radius: 0.6 };
    const world = createCollisionWorld([], () => [body], 180);
    const player = position(0.1, 0);
    world.move(player, 0, 0);
    expect(player.x).toBeCloseTo(0.95, 3);
    body.z = 10;
    world.move(player, -2, 0);
    expect(player.x).toBeCloseTo(-1.05, 3);
  });

  it("keeps the player's full radius inside the world", () => {
    const world = createCollisionWorld([], () => [], 180);
    const player = position(179, -179);
    world.move(player, 3, -3);
    expect(player.x).toBe(180 - PLAYER_RADIUS);
    expect(player.z).toBe(-180 + PLAYER_RADIUS);
  });

  it("uses the animals' orientation, excludes tagged animals, and includes hunters", () => {
    const animal = { type: "deer", alive: true, group: { visible: true, position: { x: 2, z: 3 }, rotation: { y: Math.PI / 2 } } };
    const hunters = [{ group: { position: { x: 5, z: 6 } } }];
    const circles = movingBodyCircles([animal], hunters);
    expect(circles).toHaveLength(4);
    expect(circles[0].x).toBeCloseTo(2);
    expect(circles[0].z).toBeCloseTo(3.7);
    animal.alive = false;
    expect(movingBodyCircles([animal], hunters)).toEqual([{ x: 5, z: 6, radius: 0.43 }]);
  });
});
