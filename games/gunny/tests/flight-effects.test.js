import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { advanceStars, STAR_DEPTH, STAR_BEHIND, raiderBlastDamage } from "../src/flight-effects.js";
import { createStars } from "../src/entities.js";
import { runtimeMethods } from "../src/mission-runtime.js";
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
  const game = {
    player: { mesh: { position: { z: -42000 } } },
    starField: createStars(), nearStars: createStars(1100, true), lastStarPlayerZ: -41958,
    earth: new THREE.Object3D(), moon: new THREE.Object3D(),
  };
  const farPositions = game.starField.geometry.attributes.position.array.slice();
  runtimeMethods.updateBackdrop.call(game, 1);
  assert.equal(game.starField.position.z, -42000);
  assert.equal(game.nearStars.position.z, -42000);
  assert.deepEqual(game.starField.geometry.attributes.position.array, farPositions);
});

test("blast damage falls off and expires; escaped ships stay safe", () => {
  assert.ok(raiderBlastDamage(2, 0.3) > raiderBlastDamage(10, 0.6));
  assert.equal(raiderBlastDamage(20, 0.6), 0);
  assert.equal(raiderBlastDamage(0, 0.7), 0);
  assert.equal(raiderBlastDamage(10, 0.01), 0);
});

test("raider blast damages once, decorative explosions never damage, expiry cleans up", () => {
  let health = 100;
  const game = {
    scene: new THREE.Scene(), explosions: [],
    player: { mesh: new THREE.Object3D() },
    damagePlayer: (damage) => { health -= damage; },
  };
  runtimeMethods.spawnExplosion.call(game, new THREE.Vector3(), 0xffb96e, 3.8, true);
  runtimeMethods.updateExplosions.call(game, 0.02);
  assert.equal(health, 86);
  runtimeMethods.updateExplosions.call(game, 0.3);
  assert.equal(health, 86);
  runtimeMethods.spawnExplosion.call(game, new THREE.Vector3(), 0xffffff, 1.4);
  runtimeMethods.updateExplosions.call(game, 0.1);
  assert.equal(health, 86);
  runtimeMethods.updateExplosions.call(game, 1);
  assert.equal(game.explosions.length, 0);
  assert.equal(game.scene.children.length, 0);
});

test("final raider blast resolves before mission success; lethal blast loses", () => {
  let result;
  const game = {
    state: { health: 10, kills: 12 }, explosions: [{ raiderBlast: true, age: 0 }],
    finishMission: (won) => { result = won; },
  };
  runtimeMethods.checkMissionState.call(game);
  assert.equal(result, undefined);
  game.state.health = 0;
  runtimeMethods.checkMissionState.call(game);
  assert.equal(result, false);
  game.state.health = 10;
  game.explosions = [];
  runtimeMethods.checkMissionState.call(game);
  assert.equal(result, true);
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
      healthValue: { classList: { toggle: (_, value) => { critical = value; } } },
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
