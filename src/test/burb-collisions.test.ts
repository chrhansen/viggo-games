import { describe, expect, it } from 'vitest';
import { createRideCollisions, obstaclePush, RIDER_RADIUS, type Obstacle } from '../../games/burb/src/collisions';

const tree: Obstacle = { kind: 'circle', center: { x: 0, z: 0 }, radius: 0.3 };
const mountain: Obstacle = { kind: 'polygon', points: [{ x: 0, z: -8 }, { x: 12, z: -8 }, { x: 12, z: 8 }, { x: 0, z: 8 }] };

describe('Burb ride collisions', () => {
  it('prevents tunneling through a thin tree at high speed', () => {
    const position = { x: -5, z: 0 };
    const result = createRideCollisions([tree]).move(position, 12, 0);
    expect(position.x).toBeCloseTo(-RIDER_RADIUS - 0.3, 3);
    expect(result.collided).toBe(true);
  });
  it('stops at the visible mountain footprint, not its bounding circle', () => {
    const world = createRideCollisions([mountain]);
    const position = { x: -4, z: 0 };
    world.move(position, 20, 0);
    expect(position.x).toBeCloseTo(-RIDER_RADIUS, 3);
    const clear = { x: -4, z: 10 };
    expect(world.move(clear, 20, 0).collided).toBe(false);
    expect(clear.x).toBeCloseTo(16);
  });
  it('slides along the mountain face and can steer away after stopping', () => {
    const world = createRideCollisions([mountain]);
    const position = { x: -1, z: 0 };
    world.move(position, 1, 3);
    expect(position.x).toBeCloseTo(-RIDER_RADIUS, 3);
    expect(position.z).toBeCloseTo(3);
    expect(world.move(position, -3, 0).collided).toBe(false);
    expect(position.x).toBeLessThan(-3);
  });
  it('resolves overlap and handles polygon corners', () => {
    const world = createRideCollisions([mountain]);
    const position = { x: 0.2, z: 0 };
    world.move(position, 0, 0);
    expect(obstaclePush(position, mountain)).toBeNull();
    const corner = { x: -2, z: -10 };
    world.move(corner, 3, 3);
    expect(obstaclePush(corner, mountain)).toBeNull();
  });
  it('does not squeeze through overlapping obstacles', () => {
    const obstacles: Obstacle[] = [tree, { kind: 'circle', center: { x: 0, z: 1.4 }, radius: 0.3 }];
    const position = { x: -4, z: 0.7 };
    createRideCollisions(obstacles).move(position, 8, 0);
    expect(position.x).toBeLessThan(0);
    expect(obstacles.every((obstacle) => !obstaclePush(position, obstacle))).toBe(true);
  });
});
