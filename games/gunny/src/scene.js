import * as THREE from 'three';
import { GunnyEngine } from '../core/engine.js';
import { createPlayerShip, createEnemyShip, createSatellite, createProjectile, createStars } from './entities.js';
import { createPlanet, SUN_DIRECTION } from './planets.js';
import { advanceStars } from './flight-effects.js';
import { updatePlanets } from './planet-motion.js';
import { updateCraftAppearance } from './spacecraft.js';
import { createExplosion, updateExplosion, disposeExplosion } from './explosions.js';
import { createSpaceReflections } from './vehicle-materials.js';

export function createGunnyScene({ aspect, loadTexture, renderer, engine = new GunnyEngine() }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020408);
  const reflections = renderer ? createSpaceReflections(renderer) : null;
  scene.environment = reflections?.texture ?? null;
  scene.environmentIntensity = 0.85;
  const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 2400);
  const sun = new THREE.DirectionalLight(0xfff2cc, 1.65);
  sun.position.copy(SUN_DIRECTION).multiplyScalar(150);
  const rim = new THREE.PointLight(0x6ec5ff, 28, 300, 2);
  rim.position.set(-120, -50, -320);
  const cockpitFill = new THREE.PointLight(0x7fcfff, 10, 90, 2);
  cockpitFill.position.set(0, 8, 12);
  const forwardFill = new THREE.SpotLight(0xc7e6ff, 120, 240, Math.PI / 4.8, 0.68, 1.5);
  const blastLight = new THREE.PointLight(0xffa15c, 0, 65, 2);
  scene.add(new THREE.HemisphereLight(0x90d4ff, 0x09131d, 1.8), sun, rim, cockpitFill,
    forwardFill, forwardFill.target, blastLight);
  const player = createPlayerShip();
  const starField = createStars();
  const nearStars = createStars(1100, true);
  const earth = createPlanet(58, 'earth', loadTexture);
  const moon = createPlanet(16, 'moon', loadTexture);
  scene.add(player, starField, nearStars, earth, moon);
  let lastPlayerZ = 0;
  let previewTime = 0;
  let disposed = false;
  const objects = new Map();

  function apply(mesh, entity) {
    mesh.position.copy(entity.position);
    if (entity.rotation) mesh.rotation.set(entity.rotation.x, entity.rotation.y, entity.rotation.z);
    if (entity.scale !== undefined) mesh.scale.setScalar(entity.scale);
  }

  function sync(delta = 0) {
    if (disposed) return;
    apply(player, engine.player);
    const visualTime = engine.state.time + previewTime;
    updateCraftAppearance(player, visualTime, engine.player.damageFlash);
    const keep = new Set();
    function collect(entities, build, update) {
      for (const entity of entities) {
        keep.add(entity.id);
        if (!objects.has(entity.id)) {
          const mesh = build(entity);
          scene.add(mesh);
          objects.set(entity.id, mesh);
        }
        const mesh = objects.get(entity.id);
        apply(mesh, entity);
        update?.(mesh, entity);
      }
    }
    collect(engine.enemies, createEnemyShip, (mesh, enemy) => updateCraftAppearance(mesh, engine.state.time + enemy.phase));
    collect(engine.satellites, createSatellite);
    collect(engine.playerShots, () => createProjectile(0x7af6ff, 0.3));
    collect(engine.enemyShots, () => createProjectile(0xff925d, 0.38));
    blastLight.intensity = 0;
    collect(engine.explosions.filter(e => e.life > previewTime), e => createExplosion(e.color, e.large), (mesh, e) => {
      updateExplosion(mesh, e.age + previewTime);
      const intensity = e.large ? 1800 * Math.exp(-(e.age + previewTime) * 16) : 0;
      if (intensity > blastLight.intensity) { blastLight.intensity = intensity; blastLight.position.copy(e.position); }
    });
    for (const [id, mesh] of objects) {
      if (keep.has(id)) continue;
      releaseDynamic(mesh);
      objects.delete(id);
    }
    const position = engine.player.position;
    advanceStars(nearStars.geometry.attributes.position.array, lastPlayerZ - position.z);
    nearStars.geometry.attributes.position.needsUpdate = true;
    starField.position.z = nearStars.position.z = lastPlayerZ = position.z;
    updatePlanets(earth, moon, visualTime, position.z, camera.aspect);
    camera.position.lerp(cameraPosition(), 0.08 + delta);
    forwardFill.position.lerp(new THREE.Vector3(position.x * 0.28, position.y * 0.18 + 5.4, position.z + 20), 0.14 + delta);
    forwardFill.target.position.lerp(new THREE.Vector3(position.x * 0.34, position.y * 0.24 + 0.9, position.z - 125), 0.18 + delta);
    forwardFill.target.updateMatrixWorld();
    camera.lookAt(position.x, position.y + 1.1, position.z - 34);
  }

  function releaseDynamic(mesh) {
    if (mesh.userData.fire) disposeExplosion(mesh);
    else {
      mesh.removeFromParent();
      if (mesh.isMesh) { mesh.geometry.dispose(); mesh.material.dispose(); }
    }
  }

  function cameraPosition() {
    const p = engine.player.position;
    const wide = THREE.MathUtils.clamp((camera.aspect - 1) / 0.5, 0, 1);
    return new THREE.Vector3(p.x * THREE.MathUtils.lerp(1, 0.22, wide),
      p.y * 0.18 + 4.2, p.z + 16 / Math.min(1, camera.aspect));
  }

  function resetCamera() {
    previewTime = 0;
    const p = engine.player.position;
    camera.position.copy(cameraPosition());
    forwardFill.position.set(p.x * 0.28, p.y * 0.18 + 5.4, p.z + 20);
    forwardFill.target.position.set(p.x * 0.34, p.y * 0.24 + 0.9, p.z - 125);
    sync();
  }
  resetCamera();
  return {
    scene, camera, engine, sync, resetCamera,
    step(delta, input) { sync(engine.step(delta, input)); },
    preview(delta) { previewTime += delta; sync(delta); },
    resize(width, height) { camera.aspect = width / height; camera.updateProjectionMatrix(); resetCamera(); },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const mesh of objects.values()) releaseDynamic(mesh);
      objects.clear();
      // Craft templates share static GPU resources across contexts; only player damage materials are unique.
      for (const material of player.userData.damageMaterials) material.dispose();
      for (const object of [starField, nearStars, earth, moon]) object.traverse(part => {
        part.geometry?.dispose();
        const material = part.material;
        if (!material) return;
        for (const uniform of Object.values(material.uniforms ?? {})) {
          if (uniform.value?.isTexture) uniform.value.dispose();
        }
        material.dispose();
      });
      reflections?.dispose();
      scene.clear();
    },
  };
}
