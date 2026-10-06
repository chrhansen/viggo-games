import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { GunnyEngine, emptyGunnyInput } from '../../games/gunny/core/engine.js';
import { GunnyGame } from '../../games/gunny/src/game.js';
import { createGunnyScene } from '../../games/gunny/src/scene.js';
import { createGunnyTouchInput } from '../../mobile/src/game/gunny/touch-input';

function random(seed = 42) {
  return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
}
function snapshot(engine: GunnyEngine) {
  return JSON.parse(JSON.stringify({ state: engine.state, player: engine.player, enemies: engine.enemies,
    satellites: engine.satellites, playerShots: engine.playerShots, enemyShots: engine.enemyShots, explosions: engine.explosions }));
}
function safeFlight() {
  const engine = new GunnyEngine({ random: random() });
  engine.start(); engine.enemySpawnTimer = engine.satelliteSpawnTimer = Infinity;
  return engine;
}
const makeScene = (engine: GunnyEngine, aspect = 1) => createGunnyScene({ aspect, engine, loadTexture: () => new THREE.Texture() });

describe('Gunny shared gameplay', () => {
  it('clamps flight bounds and preserves forward speed, scoring distance and fire cooldown', () => {
    const engine = safeFlight();
    for (let i = 0; i < 120; i++) engine.step(1 / 60, { ...emptyGunnyInput(), right: true, up: true, fire: true });
    expect(engine.player.position.x).toBe(24);
    expect(engine.player.position.y).toBe(17);
    expect(engine.player.position.z).toBeCloseTo(-84);
    expect(engine.state.distance).toBeCloseTo(285.6);
    expect(engine.playerShots.length).toBeGreaterThan(0);
    expect(engine.player.cooldown).toBeGreaterThan(0);
    expect(engine.player.cooldown).toBeLessThanOrEqual(0.16);
  });

  it('requires two hits per raider, grants 150 points and makes the final blast resolve before victory', () => {
    const engine = safeFlight();
    engine.state.kills = 11;
    engine.spawnEnemy();
    const enemy = engine.enemies[0];
    enemy.position = { x: 0, y: 0, z: -50 };
    for (let hit = 0; hit < 2; hit++) {
      engine.firePlayerShot(); engine.playerShots.at(-1)!.position = { ...enemy.position };
      engine.updateProjectiles(0);
    }
    expect(engine.enemies).toHaveLength(0);
    expect(engine.state).toMatchObject({ kills: 12, score: 150, result: null });
    engine.checkMissionState(); expect(engine.state.result).toBeNull();
    engine.updateExplosions(0.71); engine.checkMissionState();
    expect(engine.state.result).toBe('win');
    expect(engine.explosions.some(e => e.large)).toBe(true);
  });

  it('applies six hull points for a raider shot and ends lethal missions without advancing afterward', () => {
    const engine = safeFlight();
    engine.spawnEnemy(); engine.fireEnemyShot(engine.enemies[0]);
    engine.enemyShots[0].position = { ...engine.player.position };
    engine.updateProjectiles(0);
    expect(engine.state.health).toBe(94);
    engine.damagePlayer(100); engine.checkMissionState();
    expect(engine.state).toMatchObject({ health: 0, finished: true, active: false, result: 'lose' });
    const ended = snapshot(engine); engine.step(1, { ...emptyGunnyInput(), fire: true });
    expect(snapshot(engine)).toEqual(ended);
  });

  it('preserves collision damage for satellites and raiders', () => {
    const satellite = safeFlight(); satellite.spawnSatellite();
    satellite.satellites[0].position = { x: 0, y: 0, z: -0.42 };
    satellite.step(0.01); expect(satellite.state.health).toBe(80);
    const raider = safeFlight(); raider.spawnEnemy();
    raider.enemies[0].position = { x: 0, y: 0, z: -0.42 };
    raider.step(0.01); expect(raider.state.health).toBe(58);
  });

  it('freezes paused state, rejects invalid deltas and clamps time after a long interruption', () => {
    const engine = safeFlight(); engine.step(0.02); engine.setActive(false);
    const before = snapshot(engine);
    engine.step(5, { ...emptyGunnyInput(), fire: true });
    expect(snapshot(engine)).toEqual(before);
    engine.setActive(true);
    for (const invalid of [NaN, Infinity, -1, 0]) engine.step(invalid);
    expect(engine.state.time).toBe(before.state.time);
    engine.step(10); expect(engine.state.time).toBeCloseTo(before.state.time + 0.033);
    engine.start(); expect(engine.state).toMatchObject({ health: 100, score: 0, kills: 0, distance: 0, active: true });
    expect(engine.playerShots).toHaveLength(0); expect(engine.explosions).toHaveLength(0);
  });

  it('keeps engine dependencies independent of graphics, devices and wall-clock time', () => {
    for (const name of ['engine.js', 'math.js']) {
      const source = fs.readFileSync(`games/gunny/core/${name}`, 'utf8');
      expect(source).not.toMatch(/three|window|document|performance|Date\.|react-native|\bexpo\b/);
    }
  });
});

describe('Gunny platform parity and lifecycle', () => {
  it('runs the actual browser adapter and native touch input through the same seeded timeline', () => {
    class BrowserFixture extends GunnyGame {
      setupRenderer() { this.renderer = { setAnimationLoop() {}, render() {} }; }
      setupScene() { this.game = makeScene(this.engine); }
      bindEvents() {}
    }
    document.body.innerHTML = '<div class="stat"><span id="healthValue"></span></div>' +
      ['introPanel', 'statusPanel', 'missionCard', 'scoreValue', 'killsValue', 'distanceValue'].map(id => `<div id="${id}"></div>`).join('');
    const dom = Object.fromEntries([...document.querySelectorAll('[id]')].map(element => [element.id, element]));
    const browser = new BrowserFixture(dom);
    browser.engine.random = random();
    window.matchMedia = () => ({ matches: false }) as MediaQueryList;
    browser.startMission();
    const nativeEngine = new GunnyEngine({ random: random() }); nativeEngine.start();
    const native = makeScene(nativeEngine);
    const touch = createGunnyTouchInput();
    browser.clock = { getDelta: () => 1 / 60 };
    try {
      for (let frame = 0; frame < 900; frame++) {
        const actions = frame % 180 < 60 ? ['right', 'up', 'fire'] : frame % 180 < 120 ? ['left', 'down', 'fire'] : ['fire'];
        browser.actions.clear(); touch.reset();
        for (const action of actions) { browser.setAction(action, true); touch.hold(action as keyof typeof touch.input, [action]); }
        browser.animate(); native.step(1 / 60, touch.input);
        expect(snapshot(nativeEngine)).toEqual(snapshot(browser.engine));
      }
      expect(nativeEngine.state.distance).toBeGreaterThan(0);
    } finally { browser.game.dispose(); native.dispose(); }
  });

  it('preserves the mission and regenerates visuals through portrait/landscape surface recreation', () => {
    const engine = safeFlight(); let scene = makeScene(engine, 0.5);
    for (let i = 0; i < 60; i++) scene.step(1 / 60, { ...emptyGunnyInput(), fire: true });
    engine.spawnEnemy(); engine.spawnSatellite();
    engine.spawnExplosion({ x: 10, y: 2, z: -50 }, 0xffb96e, 3.8, true);
    scene.sync(); engine.setActive(false);
    const paused = snapshot(engine);
    scene.dispose(); scene.dispose(); scene = makeScene(engine, 2);
    expect(snapshot(engine)).toEqual(paused);
    expect(scene.camera.aspect).toBe(2);
    scene.step(5, emptyGunnyInput()); expect(snapshot(engine)).toEqual(paused);
    engine.setActive(true); scene.step(0.02);
    expect(engine.player.position.z).toBeLessThan(paused.player.position.z);
    expect(engine.state.score).toBe(paused.state.score);
    scene.dispose();
  });

  it('holds diagonal movement and fire simultaneously; releasing one finger preserves other holds', () => {
    const touch = createGunnyTouchInput();
    touch.hold('right', ['r1', 'r2']); touch.hold('up', ['u']); touch.hold('fire', ['f']);
    touch.release(['r1']); expect(touch.input).toMatchObject({ right: true, up: true, fire: true });
    touch.release(['r2', 'u']); expect(touch.input).toMatchObject({ right: false, up: false, fire: true });
    touch.reset(); expect(touch.input).toEqual(emptyGunnyInput());
  });

  it('keeps the ship in portrait framing at both flight bounds, after resize and surface recreation', () => {
    const engine = safeFlight();
    let game = makeScene(engine, 393 / 852);
    function checkFraming() {
      game.scene.updateMatrixWorld(true); game.camera.updateMatrixWorld();
      const ship = game.scene.children.find(child => child.userData.damageMaterials)!;
      const box = new THREE.Box3().setFromObject(ship);
      for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
        expect(Math.abs(new THREE.Vector3(x, y, z).project(game.camera).x)).toBeLessThan(1);
      }
    }
    try {
      for (const direction of ['right', 'left'] as const) {
        for (let frame = 0; frame < 180; frame++) {
          game.step(1 / 60, { ...emptyGunnyInput(), [direction]: true }); checkFraming();
        }
        expect(Math.abs(engine.player.position.x)).toBe(24);
        engine.setActive(false); const paused = snapshot(engine);
        game.resize(852, 393); game.resize(393, 852); checkFraming();
        game.dispose(); game = makeScene(engine, 393 / 852); checkFraming();
        expect(snapshot(engine)).toEqual(paused); engine.setActive(true);
      }
    } finally { game.dispose(); }
  });
});
