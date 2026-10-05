import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createBurbGame, emptyBurbInput } from '../../games/burb/core/engine';
import { RIDER_RADIUS } from '../../games/burb/core/collisions';
import { createBurbTouchInput } from '../../mobile/src/game/burb/touch-input';

function ride(frames: number, input = emptyBurbInput()) {
  const game = createBurbGame();
  game.setActive(true);
  for (let frame = 0; frame < frames; frame++) game.step(1 / 60, input);
  return game;
}

describe('Burb shared rules', () => {
  it('preserves browser cruise, acceleration and braking speeds', () => {
    expect(ride(300).state.speed).toBe(12);
    expect(ride(300, { ...emptyBurbInput(), accelerate: true }).state.speed).toBeCloseTo(18.5, 5);
    expect(ride(300, { ...emptyBurbInput(), brake: true }).state.speed).toBeCloseTo(5.5, 5);
    expect(ride(300, { ...emptyBurbInput(), accelerate: true, brake: true }).state.speed).toBe(12);
  });

  it('turns freely off the route, with opposite steering and camera lean', () => {
    const left = ride(90, { ...emptyBurbInput(), left: true }).state;
    const right = ride(90, { ...emptyBurbInput(), right: true }).state;
    expect(left.position.x).toBeGreaterThan(0);
    expect(right.position.x).toBeLessThan(0);
    expect(left.heading + right.heading).toBeCloseTo(Math.PI * 2);
    expect(left.roll).toBeGreaterThan(0);
    expect(right.roll).toBeLessThan(0);
    expect(ride(1000, { ...emptyBurbInput(), right: true }).state.heading).toBeGreaterThanOrEqual(0);
  });

  it('stops at a tree, loses speed and can steer away', () => {
    const game = createBurbGame({ colliders: [{ kind: 'circle', center: { x: 0, z: 3 }, radius: 0.3 }] });
    game.setActive(true);
    for (let frame = 0; frame < 60; frame++) game.step(1 / 60, emptyBurbInput());
    expect(game.state.position.z).toBeCloseTo(3 - RIDER_RADIUS - 0.3, 3);
    expect(game.state.speed).toBeLessThan(0.01);
    const stopped = { ...game.state.position };
    for (let frame = 0; frame < 180; frame++) game.step(1 / 60, { ...emptyBurbInput(), right: true });
    expect(Math.hypot(game.state.position.x - stopped.x, game.state.position.z - stopped.z)).toBeGreaterThan(5);
    expect(game.state.speed).toBeGreaterThan(10);
  });

  it('grounds on the shared surface and widens the camera with speed', () => {
    const game = createBurbGame({ surfaceHeight: ({ x, z }) => x + z * 0.01 });
    game.setActive(true);
    game.step(0.05, { ...emptyBurbInput(), accelerate: true });
    expect(game.state.position.y).toBe(game.state.position.x + game.state.position.z * 0.01);
    expect(game.state.fov).toBeGreaterThan(74);
  });

  it('freezes while paused, ignores invalid time, and caps resume deltas', () => {
    const game = ride(60);
    game.setActive(false);
    const before = structuredClone(game.state);
    game.step(30, { ...emptyBurbInput(), accelerate: true, right: true });
    expect(game.state).toEqual(before);
    game.setActive(true);
    const elapsed = game.state.elapsed;
    for (const delta of [0, -1, NaN, Infinity]) game.step(delta, emptyBurbInput());
    expect(game.state.elapsed).toBe(elapsed);
    game.step(30, emptyBurbInput());
    expect(game.state.elapsed).toBeCloseTo(elapsed + 0.05);
  });

  it('retains browser tilt smoothing and gives buttons precedence', () => {
    const game = ride(100, { ...emptyBurbInput(), tilt: 1, left: true });
    expect(game.state.tiltSteer).toBeCloseTo(1, 5);
    expect(game.state.steer).toBeCloseTo(-1, 4);
    game.setActive(false);
    expect(game.state.tiltSteer).toBe(0);
  });

  it('keeps the core independent of graphics, browser and native APIs', () => {
    for (const file of fs.readdirSync('games/burb/core').filter(name => name.endsWith('.ts'))) {
      const source = fs.readFileSync(path.join('games/burb/core', file), 'utf8');
      expect(source).not.toMatch(/\b(document|window|requestAnimationFrame|three|react-native|expo)\b/);
    }
  });
});

describe('Burb native input parity', () => {
  it('matches browser input through acceleration, corners, releases, and simultaneous touches', () => {
    const browser = createBurbGame();
    const native = createBurbGame();
    const touch = createBurbTouchInput();
    browser.setActive(true); native.setActive(true);
    for (let frame = 0; frame < 600; frame++) {
      if (frame === 0) touch.hold('accelerate', ['speed']);
      if (frame === 60) touch.hold('right', ['steer']);
      if (frame === 180) touch.release(['speed']);
      if (frame === 240) touch.release(['steer']);
      if (frame === 300) { touch.hold('left', ['steer']); touch.hold('brake', ['speed']); }
      if (frame === 480) touch.reset();
      browser.step(1 / 60, {
        ...emptyBurbInput(), accelerate: frame < 180, right: frame >= 60 && frame < 240,
        left: frame >= 300 && frame < 480, brake: frame >= 300 && frame < 480,
      });
      native.step(1 / 60, touch.input);
      expect(native.state).toEqual(browser.state);
    }
  });

  it('releases only the lifted finger and clears every held control on pause/cancel', () => {
    const touch = createBurbTouchInput();
    touch.hold('left', ['a', 'b']); touch.hold('accelerate', ['c']);
    touch.release(['a']);
    expect(touch.input.left).toBe(true);
    touch.release(['b']);
    expect(touch.input.left).toBe(false);
    expect(touch.input.accelerate).toBe(true);
    touch.reset();
    expect(touch.input).toEqual(emptyBurbInput());
    touch.hold('right', ['a']); touch.release(['a']);
    expect(touch.input).toEqual(emptyBurbInput());
  });
});
