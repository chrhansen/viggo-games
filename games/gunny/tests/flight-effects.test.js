import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { advanceStars, STAR_DEPTH, STAR_BEHIND, raiderBlastDamage } from "../src/flight-effects.js";
import { createStars } from "../src/entities.js";
import { GunnyEngine } from "../core/engine.js";
import { createGunnyScene } from "../src/scene.js";
import { GunnyGame } from "../src/game.js";

test("nearby star pool stays populated through hours of travel and a restart", () => {
  const field = createStars(1100, true);
  const positions = field.geometry.attributes.position.array;
  const original = positions.slice();
  for (let second = 0; second < 7200; second += 1) {
    advanceStars(positions, 42);
    let ahead = 0;
    for (let i = 2; i < positions.length; i += 3) {
      assert.ok(positions[i] >= -STAR_DEPTH && positions[i] < STAR_BEHIND);
      if (positions[i] < -50) ahead++;
    }
    assert.ok(ahead > 900);
  }
  advanceStars(positions, -42 * 7200);
  for (let i = 0; i < positions.length; i++) {
    assert.ok(Math.abs(positions[i] - original[i]) < 0.02);
  }
  field.geometry.dispose();
  field.material.dispose();
});

test("backdrop follows the ship, near stars move locally and far stars stay fixed", () => {
  const engine = new GunnyEngine();
  const game = createGunnyScene({ aspect: 1, engine, loadTexture: () => new THREE.Texture() });
  const fields = game.scene.children.filter(child => child.isPoints);
  const farPositions = fields[0].geometry.attributes.position.array.slice();
  engine.player.position.z = -42000;
  game.sync(1);
  assert.equal(fields[0].position.z, -42000);
  assert.equal(fields[1].position.z, -42000);
  assert.deepEqual(fields[0].geometry.attributes.position.array, farPositions);
  game.dispose();
});

test("blast damage falls off and expires; escaped ships stay safe", () => {
  assert.ok(raiderBlastDamage(2, 0.3) > raiderBlastDamage(10, 0.6));
  assert.equal(raiderBlastDamage(20, 0.6), 0);
  assert.equal(raiderBlastDamage(0, 0.7), 0);
  assert.equal(raiderBlastDamage(10, 0.01), 0);
});

test("raider blast damages once, decorative explosions never damage, expiry cleans up", () => {
  const game = new GunnyEngine();
  game.spawnExplosion({ x: 0, y: 0, z: 0 }, 0xffb96e, 3.8, true);
  game.updateExplosions(0.02);
  assert.equal(game.state.health, 86);
  game.updateExplosions(0.3);
  assert.equal(game.state.health, 86);
  game.spawnExplosion({ x: 0, y: 0, z: 0 }, 0xffffff, 1.4);
  game.updateExplosions(0.1);
  assert.equal(game.state.health, 86);
  game.updateExplosions(1);
  assert.equal(game.explosions.length, 0);
});

test("final raider blast resolves before mission success; lethal blast loses", () => {
  const game = new GunnyEngine();
  game.start();
  game.state.health = 10;
  game.state.kills = 12;
  game.spawnExplosion({ x: 100, y: 0, z: 0 }, 0xffb96e, 3.8, true);
  game.checkMissionState();
  assert.equal(game.state.result, null);
  game.state.health = 0;
  game.checkMissionState();
  assert.equal(game.state.result, 'lose');
  game.state.health = 10;
  game.explosions = [];
  game.checkMissionState();
  assert.equal(game.state.result, 'win');
});

test("hull warning covers 10% threshold, stops at mission end and silences on blur", () => {
  let critical;
  let audible;
  const previousDocument = globalThis.document;
  globalThis.document = { hidden: false, hasFocus: () => true };
  const game = {
    started: true, finished: false,
    state: { health: 10, score: 0, kills: 0, distance: 0 },
    dom: {
      healthValue: { closest: () => ({ classList: { toggle: (_, value) => { critical = value; } } }) },
      scoreValue: {}, killsValue: {}, distanceValue: {},
    },
    hullWarning: { update: (value) => { audible = value; } },
  };
  try {
    GunnyGame.prototype.updateHud.call(game);
    assert.equal(critical, true);
    assert.equal(audible, true);
    globalThis.document.hasFocus = () => false;
    GunnyGame.prototype.updateHud.call(game);
    assert.equal(audible, false);
    game.state.health = 11;
    GunnyGame.prototype.updateHud.call(game);
    assert.equal(critical, false);
    game.state.health = 10;
    game.finished = true;
    GunnyGame.prototype.updateHud.call(game);
    assert.equal(critical, false);
  } finally {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  }
});
