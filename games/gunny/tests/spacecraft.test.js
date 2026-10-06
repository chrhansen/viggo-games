import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { createPlayerShip, createEnemyShip, updateCraftAppearance } from "../src/spacecraft.js";
import { createSatellite } from "../src/satellite.js";
import { GunnyEngine } from "../core/engine.js";
import { muzzlePosition } from "../core/math.js";

test("solar cells remain exposed from either side of the satellite's open frames", () => {
  const satellite = createSatellite();
  satellite.updateMatrixWorld(true);
  for (const x of [-4.6, -2.7, 2.7, 4.6]) {
    for (const side of [-1, 1]) {
      const ray = new THREE.Raycaster(new THREE.Vector3(x, 0.3, side * 10), new THREE.Vector3(0, 0, -side));
      const hit = ray.intersectObject(satellite, true)[0];
      assert.equal(hit?.object.name, "solar-cells");
    }
  }
});

test("engine flicker keeps nozzles and thrust centers fixed", () => {
  for (const ship of [createPlayerShip(), createEnemyShip()]) {
    const glow = ship.userData.engineGlow;
    const origins = glow.children.map((jet) => jet.position.clone());
    for (const time of [0, 0.1, 0.5, 1, 60]) {
      updateCraftAppearance(ship, time);
      assert.deepEqual(glow.scale.toArray(), [1, 1, 1]);
      glow.children.forEach((jet, i) => {
        assert.deepEqual(jet.position, origins[i]);
        assert.equal(jet.scale.x, 1);
        assert.equal(jet.scale.y, 1);
        assert.ok(jet.scale.z > 0.85 && jet.scale.z < 1.15);
      });
    }
  }
});

test("player damage flashes do not change other craft or leave the cockpit glowing", () => {
  const first = createPlayerShip(), second = createPlayerShip(), raider = createEnemyShip();
  const glass = raider.getObjectByName("cockpit-glass").material;
  updateCraftAppearance(first, 1, 1);
  assert.ok(first.userData.damageMaterials.every((material) => material.emissiveIntensity > 0));
  assert.ok(second.userData.damageMaterials.every((material) => material.emissiveIntensity === 0));
  assert.equal(glass.emissive.getHex(), 0);
  updateCraftAppearance(first, 2, 0);
  assert.ok(first.userData.damageMaterials.every((material) => material.emissiveIntensity === 0));
});

test("shots emerge from the craft nose in world space, including a turned raider", () => {
  const game = new GunnyEngine();
  game.player.position = { x: 4, y: 2, z: -120 };
  game.firePlayerShot();
  assert.deepEqual(Object.values(game.playerShots[0].position), [4, 2, -125.1]);
  game.spawnEnemy();
  const raider = game.enemies[0];
  raider.position = { x: 0, y: 0, z: -150 };
  game.fireEnemyShot(raider);
  assert.ok(Math.abs(game.enemyShots[0].position.z + 146.72) < 1e-10);
  assert.ok(game.enemyShots[0].velocity.z > 0);
  for (const factory of [createPlayerShip, createEnemyShip]) {
    const mesh = factory();
    mesh.position.set(4, 2, -120);
    for (const angles of [[0.2, -0.3, 0.4], [-0.2, Math.PI, -0.5]]) {
      mesh.rotation.set(...angles);
      const expected = mesh.localToWorld(new THREE.Vector3().fromArray(mesh.userData.muzzle));
      const actual = muzzlePosition({ position: mesh.position, rotation: mesh.rotation, scale: mesh.scale.x }, mesh.userData.muzzle[2]);
      assert.ok(expected.distanceTo(new THREE.Vector3().copy(actual)) < 1e-10);
    }
  }
});

test("repeated spawns reuse baked geometry while retaining independent transforms", () => {
  for (const factory of [createEnemyShip, createSatellite]) {
    const first = factory(), second = factory();
    const meshes = [];
    first.traverse((node) => { if (node.isMesh) meshes.push(node); });
    const copies = [];
    second.traverse((node) => { if (node.isMesh) copies.push(node); });
    assert.ok(meshes.length < 16);
    meshes.forEach((mesh, i) => assert.equal(mesh.geometry, copies[i].geometry));
    first.position.x = 100;
    assert.equal(second.position.x, 0);
  }
});
