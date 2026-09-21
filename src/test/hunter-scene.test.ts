import { describe, expect, it } from 'vitest';
import { DataTexture } from 'three';
import { configureNatureTextures } from '../../games/hunter-guy/nature-materials.js';
import { createHunterScene } from '../../games/hunter-guy/scene.js';

configureNatureTextures(() => new DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1));

describe('Hunter Guy shared scene adapters', () => {
  it('projects the same input timeline at phone and browser aspect ratios', () => {
    const browser = createHunterScene({ aspect: 16 / 9 });
    const phone = createHunterScene({ aspect: 9 / 16 });
    try {
      for (const scene of [browser, phone]) {
        scene.engine.setActive(true);
        for (let frame = 0; frame < 180; frame++) {
          scene.engine.look(frame * 0.01, 0.1);
          scene.step(1 / 60, { forward: 1, strafe: 0.5 });
          if (frame % 60 === 0) scene.fire();
        }
      }
      expect(phone.engine.state).toEqual(browser.engine.state);
      expect(phone.camera.position.toArray()).toEqual(browser.camera.position.toArray());
    } finally { browser.dispose(); phone.dispose(); }
  });
  it('uses shared animated meshes to tag and excludes already tagged animals', () => {
    const game = createHunterScene();
    try {
      game.engine.setActive(true);
      const player = game.engine.state.player;
      game.engine.state.animals.forEach((animal, index) => {
        animal.group.position.x = index ? 80 : 0;
        animal.group.position.z = index ? 80 : -4;
        animal.group.position.y = player.y - 0.66;
        animal.group.rotation.y = 0;
      });
      game.sync();
      expect(game.fire()).toBe(true);
      expect(game.engine.state.score).toBe(1);
      expect(game.engine.state.animals[0].alive).toBe(false);
      for (let i = 0; i < 5; i++) game.step(0.1);
      game.fire();
      expect(game.engine.state.score).toBe(1);
    } finally { game.dispose(); }
  });
  it('retains gameplay across GL surface recreation and starts paused', () => {
    const old = createHunterScene();
    old.engine.setActive(true);
    old.step(0.1, { forward: 1 });
    old.engine.state.score = 3;
    old.engine.setActive(false);
    const engine = old.engine;
    const before = structuredClone(engine.state);
    old.dispose();
    const recreated = createHunterScene({ engine });
    try {
      recreated.step(1);
      expect(recreated.engine.state).toEqual(before);
      expect(recreated.camera.position.z).toBe(before.player.z);
      recreated.engine.setActive(true); recreated.step(0.1, { forward: 1 });
      expect(recreated.engine.state.score).toBe(3);
      expect(recreated.engine.state.player.z).toBeLessThan(before.player.z);
    } finally { recreated.dispose(); }
  });
});
