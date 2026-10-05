import { describe, expect, it, vi } from 'vitest';
import { createBurbScene } from '../../games/burb/src/scene';
import { emptyBurbInput } from '../../games/burb/core/engine';
import { createBurbTouchInput } from '../../mobile/src/game/burb/touch-input';
import { Texture } from 'three';

const textures = () => new Texture();

describe('Burb shared scene', () => {
  it('shares route, world collisions, cockpit and camera pose across portrait/landscape adapters', () => {
    const browser = createBurbScene({ aspect: 16 / 9, textures });
    const phone = createBurbScene({ aspect: 9 / 19.5, textures });
    const touch = createBurbTouchInput();
    expect(phone.colliders).toEqual(browser.colliders);
    expect(phone.colliders.length).toBeGreaterThan(100);
    browser.engine.setActive(true); phone.engine.setActive(true);
    touch.hold('right', ['steer']); touch.hold('accelerate', ['speed']);
    for (let frame = 0; frame < 180; frame++) {
      browser.step(1 / 60, { ...emptyBurbInput(), right: true, accelerate: true });
      phone.step(1 / 60, touch.input);
      expect(phone.engine.state).toEqual(browser.engine.state);
      expect(phone.camera.position.toArray()).toEqual(browser.camera.position.toArray());
      expect(phone.camera.quaternion.toArray()).toEqual(browser.camera.quaternion.toArray());
      expect(phone.handlebars.steerPivot.rotation.toArray()).toEqual(browser.handlebars.steerPivot.rotation.toArray());
    }
    phone.resize(844, 390);
    expect(phone.camera.aspect).toBe(844 / 390);
    browser.dispose(); phone.dispose();
  });

  it('recreates the graphics surface without resetting the ride and releases GPU resources once', () => {
    const first = createBurbScene({ aspect: 1, textures });
    first.engine.setActive(true);
    first.step(0.05, emptyBurbInput());
    const dispose = vi.spyOn(first.handlebars.referencePoint.geometry, 'dispose');
    first.dispose(); first.dispose();
    expect(dispose).toHaveBeenCalledOnce();
    const state = structuredClone(first.engine.state);
    first.step(0.05, emptyBurbInput());
    expect(first.engine.state).toEqual(state);
    const second = createBurbScene({ aspect: 2, textures, engine: first.engine });
    expect(second.engine).toBe(first.engine);
    expect(second.engine.state).toEqual(state);
    expect(second.camera.position.toArray()).toEqual(first.camera.position.toArray());
    second.engine.setActive(true);
    second.step(0.05, emptyBurbInput());
    expect(second.engine.state.elapsed).toBeGreaterThan(state.elapsed);
    second.dispose();
  });
});
