import * as THREE from "three";
import { createHunterGame } from "./core/engine.js";
import { terrainHeight } from "./core/world.js";
import { createWildlifeView } from "./wildlife.js";
import { createForest, createSky } from "./forest.js";
import { natureTexture } from "./nature-materials.js";
import { createWeaponEffects } from "./weapon-effects.js";
import { disposeObject } from "./dispose.js";

export function createHunterScene({ aspect = 1, seed = 112, engine: existingEngine } = {}) {
  const TREE_COUNT = 540;
  const PLAYER_CLEARING_RADIUS = 14;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xb9ccca, 65, 290);

  const camera = new THREE.PerspectiveCamera(
    72,
    aspect,
    0.1,
    1000
  );
  camera.rotation.order = "YXZ";
  scene.add(camera);

  const hemiLight = new THREE.HemisphereLight(0xc3d9ed, 0x5b6040, 1.8);
  scene.add(hemiLight);

  const sun = new THREE.DirectionalLight(0xffe3b0, 2.5);
  sun.position.set(-45, 65, -35);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 1024;
  sun.shadow.mapSize.height = 1024;
  sun.shadow.camera.left = -48;
  sun.shadow.camera.right = 48;
  sun.shadow.camera.top = 48;
  sun.shadow.camera.bottom = -48;
  sun.shadow.bias = -0.0003;
  sun.shadow.normalBias = 0.035;
  scene.add(sun);
  scene.add(sun.target);

  createSky(scene);

  const terrainGeo = new THREE.PlaneGeometry(420, 420, 88, 88);
  terrainGeo.rotateX(-Math.PI / 2);
  const terrainPos = terrainGeo.attributes.position;
  for (let i = 0; i < terrainPos.count; i += 1) {
    const x = terrainPos.getX(i);
    const z = terrainPos.getZ(i);
    terrainPos.setY(i, terrainHeight(x, z));
  }
  terrainGeo.computeVertexNormals();
  const groundTexture = natureTexture("ground");
  groundTexture.repeat.set(95, 95);
  const groundColors = [];
  const groundTint = new THREE.Color();
  for (let i = 0; i < terrainPos.count; i++) {
    const x = terrainPos.getX(i), z = terrainPos.getZ(i);
    const path = Math.exp(-Math.pow((x - Math.sin(z * 0.032) * 8) / 3, 2));
    groundTint.set(0x5b6940).lerp(new THREE.Color(0x998369), path * 0.8);
    groundTint.multiplyScalar(0.88 + Math.sin(x * 0.3) * Math.cos(z * 0.25) * 0.12);
    groundColors.push(groundTint.r, groundTint.g, groundTint.b);
  }
  terrainGeo.setAttribute("color", new THREE.Float32BufferAttribute(groundColors, 3));
  const terrain = new THREE.Mesh(
    terrainGeo,
    new THREE.MeshStandardMaterial({
      map: groundTexture,
      bumpMap: groundTexture,
      bumpScale: 0.08,
      vertexColors: true,
      roughness: 0.9,
      metalness: 0,
    })
  );
  terrain.receiveShadow = true;
  scene.add(terrain);

  const forest = createForest(scene, terrainHeight, TREE_COUNT, PLAYER_CLEARING_RADIUS);

  const engine = existingEngine ?? createHunterGame({ seed, colliders: forest.colliders });
  const wildlife = createWildlifeView(scene, engine.state.animals);
  const hunters = [];
  const hunterMat = new THREE.MeshStandardMaterial({ color: 0x6f4f2f, roughness: 0.86 });
  const jacketMat = new THREE.MeshStandardMaterial({ color: 0x3f5f2d, roughness: 0.9 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xe1b38c, roughness: 0.8 });

  for (const hunter of engine.state.hunters) {
    const group = new THREE.Group();

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.0, 0.35), jacketMat);
    torso.position.y = 1.45;
    torso.castShadow = true;
    group.add(torso);

    const legs = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.9, 0.32), hunterMat);
    legs.position.y = 0.63;
    legs.castShadow = true;
    group.add(legs);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 14), skinMat);
    head.position.y = 2.18;
    head.castShadow = true;
    group.add(head);

    const hat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.26, 0.17, 16),
      new THREE.MeshStandardMaterial({ color: 0x4a3622 })
    );
    hat.position.y = 2.34;
    group.add(hat);

    scene.add(group);
    hunters.push({ group, hunter });
  }


  const weaponEffects = createWeaponEffects(scene, camera);
  const raycaster = new THREE.Raycaster();
  const center = new THREE.Vector2();
  function sync(delta = 0) {
    const { player } = engine.state;
    camera.position.set(player.x, player.y, player.z);
    camera.rotation.set(player.pitch, player.yaw, 0, "YXZ");
    wildlife.update(delta);
    for (const { group, hunter } of hunters) {
      group.position.copy(hunter.group.position);
      group.rotation.y = hunter.group.rotation.y;
    }
    weaponEffects.setWeapon(engine.state.selectedWeapon);
    weaponEffects.update(delta, engine.state.time);
    forest.update(engine.state.time);
    sun.position.set(player.x - 45, player.y + 65, player.z - 35);
    sun.target.position.copy(camera.position);
    scene.updateMatrixWorld(true);
  }
  function fire() {
    sync();
    raycaster.setFromCamera(center, camera);
    const hit = raycaster.intersectObjects(wildlife.hitMeshes, false)
      .find((entry) => engine.state.animals[entry.object.userData.animalIndex].alive);
    const fired = engine.fire(hit ? { animalIndex: hit.object.userData.animalIndex, distance: hit.distance } : undefined);
    if (fired) weaponEffects.fire(engine.state.selectedWeapon);
    return fired;
  }
  function step(delta, input) {
    engine.step(delta, input);
    sync(engine.state.active ? Math.min(delta, 0.1) : 0);
  }
  function resize(width, height) {
    camera.aspect = width / Math.max(1, height);
    camera.updateProjectionMatrix();
  }
  sync();
  return { engine, scene, camera, fire, step, sync, resize, dispose: () => disposeObject(scene) };
}
