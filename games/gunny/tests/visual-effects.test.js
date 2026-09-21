import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { moonOrbitPosition, updatePlanets, MOON_ORBIT_SECONDS, MOON_ORBIT_RADIUS, EARTH_DAY_SECONDS } from "../src/planet-motion.js";
import { createExplosion, updateExplosion, disposeExplosion } from "../src/explosions.js";
import { runtimeMethods } from "../src/mission-runtime.js";
import { GunnyGame } from "../src/game.js";
import { createPlanet } from "../src/planets.js";

test("Earth renders clouds with its opaque surface, without an overlapping cloud shell", t => {
  t.mock.method(THREE.TextureLoader.prototype, "load", () => new THREE.Texture());
  const earth = createPlanet(58, "earth");
  assert.equal(earth.children.length, 2);
  assert.equal(earth.userData.clouds, undefined);
  assert.equal(earth.userData.body.material.transparent, false);
  assert.ok(earth.userData.body.material.uniforms.clouds.value.isTexture);
  earth.traverse(part => {
    part.geometry?.dispose();
    part.material?.dispose();
  });
});

function planets() {
  const earth = new THREE.Group();
  earth.userData.body = new THREE.Object3D();
  return { earth, moon: new THREE.Object3D() };
}

test("Moon completes a closed orbit, clears Earth, and keeps the same face toward it", () => {
  const { earth, moon } = planets();
  const start = new THREE.Vector3().copy(moonOrbitPosition(0));
  const end = new THREE.Vector3().copy(moonOrbitPosition(MOON_ORBIT_SECONDS));
  assert.ok(start.distanceTo(end) < 1e-10);
  for (let time = 0; time <= MOON_ORBIT_SECONDS; time += 3) {
    updatePlanets(earth, moon, time, -time * 42);
    assert.ok(Math.abs(moon.position.distanceTo(earth.position) - MOON_ORBIT_RADIUS) < 1e-10);
    const facing = moon.getWorldDirection(new THREE.Vector3());
    const towardEarth = earth.position.clone().sub(moon.position).normalize();
    assert.ok(facing.dot(towardEarth) > 0.99999);
  }
});

test("Earth turns slowly and reset is deterministic", () => {
  const { earth, moon } = planets();
  updatePlanets(earth, moon, 0, 0);
  const start = earth.userData.body.rotation.y;
  const initialMoon = moon.position.clone();
  updatePlanets(earth, moon, 60, -2520);
  const rotation = earth.userData.body.rotation.y - start;
  assert.ok(rotation < 0.03 * 60 / 5);
  assert.ok(Math.abs(rotation - 60 * Math.PI * 2 / EARTH_DAY_SECONDS) < 1e-10);
  updatePlanets(earth, moon, 0, 0);
  assert.equal(earth.userData.body.rotation.y, start);
  assert.deepEqual(moon.position, initialMoon);
});

test("planet motion is independent of frame rate and stays camera-relative after long travel", () => {
  const a = planets(), b = planets();
  for (let frame = 0; frame <= 3600; frame++) updatePlanets(a.earth, a.moon, frame / 60, -42000);
  updatePlanets(b.earth, b.moon, 60, -42000);
  assert.deepEqual(a.moon.position, b.moon.position);
  assert.equal(a.earth.position.z, -42430);
  updatePlanets(a.earth, a.moon, 60, 0);
  assert.ok(Math.abs(b.moon.position.z - a.moon.position.z + 42000) < 1e-10);
});

test("explosion debris travels outward, cools, fades, and releases all GPU resources", () => {
  const explosion = createExplosion(0xffb96e);
  const debris = explosion.userData.debris;
  updateExplosion(explosion, 0.5);
  const moved = new THREE.Matrix4();
  debris.getMatrixAt(0, moved);
  assert.ok(new THREE.Vector3().setFromMatrixPosition(moved).length() > 0.9);
  assert.ok(debris.material.emissiveIntensity < 0.1);
  updateExplosion(explosion, 1.25);
  assert.equal(debris.material.opacity, 0);
  const scene = new THREE.Scene();
  scene.add(explosion);
  let resources = 0, disposed = 0;
  explosion.traverse((part) => {
    for (const resource of [part.geometry, part.material, part.isInstancedMesh ? part : null]) {
      if (!resource) continue;
      resources++;
      resource.addEventListener("dispose", () => disposed++);
    }
  });
  disposeExplosion(explosion);
  assert.equal(disposed, resources);
  assert.equal(scene.children.length, 0);
});

test("lingering visual debris cannot damage the player after the original blast window", () => {
  let damage = 0;
  const game = { scene: new THREE.Scene(), explosions: [], player: { mesh: new THREE.Object3D() },
    damagePlayer: (amount) => { damage += amount; } };
  game.player.mesh.position.x = 100;
  runtimeMethods.spawnExplosion.call(game, new THREE.Vector3(), 0xffb96e, 3.8, true);
  runtimeMethods.updateExplosions.call(game, 0.71);
  game.player.mesh.position.x = 0;
  runtimeMethods.updateExplosions.call(game, 0.1);
  assert.equal(damage, 0);
  assert.equal(game.explosions.length, 1);
  runtimeMethods.updateExplosions.call(game, 0.5);
  assert.equal(game.explosions.length, 0);
});

test("restarting mid-explosion releases fragments and resets the flash light", () => {
  const mesh = createExplosion(0xffb96e);
  let disposed = false;
  mesh.userData.debris.addEventListener("dispose", () => { disposed = true; });
  const game = { scene: new THREE.Scene(), player: { shots: [] }, enemies: [], enemyShots: [],
    satellites: [], explosions: [{ mesh }], blastLight: { intensity: 100 } };
  game.scene.add(mesh);
  GunnyGame.prototype.clearDynamicObjects.call(game);
  assert.equal(game.explosions.length, 0);
  assert.equal(game.blastLight.intensity, 0);
  assert.equal(disposed, true);
});

test("final kill wins when the damaging blast expires while decorative debris remains", () => {
  let result;
  const game = { scene: new THREE.Scene(), explosions: [], player: { mesh: new THREE.Object3D() },
    state: { health: 100, kills: 12 }, damagePlayer: () => {}, finishMission: (won) => { result = won; } };
  game.player.mesh.position.x = 100;
  runtimeMethods.spawnExplosion.call(game, new THREE.Vector3(), 0xffb96e, 3.8, true);
  runtimeMethods.updateExplosions.call(game, 0.69);
  runtimeMethods.checkMissionState.call(game);
  assert.equal(result, undefined);
  runtimeMethods.updateExplosions.call(game, 0.02);
  runtimeMethods.checkMissionState.call(game);
  assert.equal(result, true);
  assert.equal(game.explosions.length, 1);
  assert.ok(game.explosions[0].life > 0);
  disposeExplosion(game.explosions[0].mesh);
});
