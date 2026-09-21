import { describe, expect, it } from 'vitest';
import { createHunterGame, LOOK_RANGE, touchMoveVector, weaponStats } from '../../games/hunter-guy/core/engine.js';

function activeGame(seed = 42) {
  const game = createHunterGame({ seed });
  game.setActive(true);
  return game;
}
function advance(game: ReturnType<typeof createHunterGame>, seconds: number) {
  for (let t = 0; t < seconds; t += 0.05) game.step(0.05);
}

describe('Hunter Guy shared engine', () => {
  it('replays the same input timeline deterministically without browser or native APIs', () => {
    const browser = activeGame();
    const native = activeGame();
    for (let frame = 0; frame < 600; frame++) {
      for (const game of [browser, native]) {
        game.look(frame * 0.01, 0.1);
        game.step(1 / 60, { forward: 1, strafe: frame % 3 === 0 ? 1 : 0 });
        if (frame % 60 === 0) game.fire({ animalIndex: Math.floor(frame / 60), distance: 10 });
      }
    }
    expect(native.state).toEqual(browser.state);
    expect(native.state.score).toBe(10);
    expect(native.state.player.z).not.toBe(0);
    expect(createHunterGame({ seed: 43 }).state.animals).not.toEqual(createHunterGame({ seed: 42 }).state.animals);
  });
  it('preserves population and bear durability', () => {
    const game = activeGame();
    expect(game.state.animals.filter(a => a.type === 'fox')).toHaveLength(14);
    expect(game.state.animals.filter(a => a.type === 'deer')).toHaveLength(10);
    expect(game.state.animals.filter(a => a.type === 'bear')).toHaveLength(5);
    const index = game.state.animals.findIndex(a => a.type === 'bear');
    game.fire({ animalIndex: index, distance: 4 });
    expect(game.state.animals[index].hp).toBe(1);
    expect(game.state.score).toBe(0);
    expect(game.fire({ animalIndex: index, distance: 4 })).toBe(false);
    advance(game, 0.3);
    game.fire({ animalIndex: index, distance: 4 });
    expect(game.state.animals[index].alive).toBe(false);
    expect(game.state.score).toBe(1);
    advance(game, 0.3);
    game.fire({ animalIndex: index, distance: 4 });
    expect(game.state.score).toBe(1);
  });
  it.each(['rifle', 'bow', 'knife'] as const)('%s enforces range and shared cooldown', weapon => {
    const game = activeGame(); game.setWeapon(weapon);
    const range = weaponStats[weapon].range;
    game.fire({ animalIndex: 0, distance: range + 0.01 });
    expect(game.state.score).toBe(0);
    game.setWeapon('rifle');
    expect(game.fire({ animalIndex: 0, distance: 1 })).toBe(false);
    advance(game, 1);
    game.setWeapon(weapon); game.fire({ animalIndex: 0, distance: range });
    expect(game.state.score).toBe(1);
  });
  it('squirt scares animals without damage or score', () => {
    const game = activeGame(); game.setWeapon('squirt');
    game.fire({ animalIndex: 0, distance: 3 });
    expect(game.state.animals[0]).toMatchObject({ alive: true, hp: 1, moving: true, scaredFor: 2.7 });
    expect(game.state.score).toBe(0);
    advance(game, 3);
    expect(game.state.animals[0].scaredFor).toBeLessThanOrEqual(0);
  });
  it('pause freezes time, wildlife, patrols, cooldown and player; resume does not catch up', () => {
    const game = activeGame(); game.fire(); game.setActive(false);
    const paused = structuredClone(game.state);
    game.step(30, { forward: 1 }); game.look(2, 2);
    expect(game.fire({ animalIndex: 0, distance: 1 })).toBe(false);
    expect(game.state).toEqual(paused);
    game.setActive(true); game.step(30, { forward: 1 });
    expect(game.state.time).toBeCloseTo(0.1);
    expect(Math.hypot(game.state.player.x, game.state.player.z)).toBeCloseTo(1);
  });
  it('normalizes diagonal movement, clamps pitch and slides against world obstacles', () => {
    const game = activeGame(); game.look(0, 10);
    expect(game.state.player.pitch).toBe(LOOK_RANGE);
    game.step(0.1, { forward: 1, strafe: 1 });
    expect(Math.hypot(game.state.player.x, game.state.player.z)).toBeCloseTo(1);
    const blocked = createHunterGame({ colliders: [{ x: 0, z: -1, radius: 0.3 }] });
    blocked.setActive(true); blocked.step(0.1, { forward: 1 });
    expect(blocked.state.player.z).toBeGreaterThan(-0.36);
    expect(touchMoveVector(0.1, -0.1)).toEqual({ x: 0, y: 0 });
    expect(Math.hypot(...Object.values(touchMoveVector(1, 1)))).toBeCloseTo(1);
  });
  it('rejects invalid hit distances and keeps missing shots harmless', () => {
    for (const distance of [-1, NaN, Infinity]) {
      const game = activeGame(); game.fire({ animalIndex: 0, distance });
      expect(game.state.score).toBe(0);
    }
  });
});
