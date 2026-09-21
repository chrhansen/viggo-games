import * as THREE from "three";
import { natureTexture, seededRandom, windMaterial } from "./nature-materials.js";

export function createForest(scene, terrainHeight, treeCount, clearingRadius) {
  const random = seededRandom(407);
  const rand = (min, max) => min + random() * (max - min);
  const dummy = new THREE.Object3D();
  const tint = new THREE.Color();
  const colliders = [];
  function batch(geometry, material, count, shadows = false) {
    const mesh = new THREE.InstancedMesh(geometry, material, count);
    mesh.castShadow = shadows;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  }
  function place(mesh, index, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0) {
    dummy.position.set(x, y, z);
    dummy.scale.set(sx, sy, sz);
    dummy.rotation.set(rx, ry, rz);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
  }
  const bark = natureTexture("bark");
  bark.repeat.set(2, 4);
  const wood = new THREE.MeshStandardMaterial({ color: 0x72624e, map: bark, bumpMap: bark, bumpScale: 0.14, roughness: 1 });
  const trunks = batch(new THREE.CylinderGeometry(0.015, 1, 1, 8), wood, treeCount, true);
  const branches = batch(new THREE.CylinderGeometry(0.2, 0.65, 1, 5), wood, treeCount * 5);
  const canopyMaterial = (kind) => new THREE.MeshStandardMaterial({
    map: natureTexture(kind), alphaTest: 0.38, side: THREE.DoubleSide, roughness: 1,
  });
  const foliage = batch(new THREE.PlaneGeometry(1, 1), canopyMaterial("needles"), treeCount * 14);
  const leaves = batch(new THREE.PlaneGeometry(1, 1), canopyMaterial("leaves"), treeCount * 12);
  let branchIndex = 0;
  let pineIndex = 0;
  let leafIndex = 0;
  for (let i = 0; i < treeCount; i++) {
    let x, z;
    do { x = rand(-177, 177); z = rand(-177, 177); } while (Math.hypot(x, z) < clearingRadius);
    const y = terrainHeight(x, z);
    const height = rand(9, 18);
    const width = rand(0.23, 0.48);
    const broadleaf = random() > 0.65;
    colliders.push({ x, z, radius: width });
    place(trunks, i, x, y + height / 2, z, width, height, width, 0, rand(0, 6));
    for (let j = 0; j < 5; j++) {
      const angle = j * 2.399 + i;
      const level = 0.35 + j * 0.11;
      const reach = (1 - level) * height * (broadleaf ? 0.46 : 0.36);
      place(branches, branchIndex++, x + Math.cos(angle) * reach / 2, y + height * level, z + Math.sin(angle) * reach / 2,
        width * 0.35, reach, width * 0.35, Math.sin(angle) * 1.1, 0, -Math.cos(angle) * 1.1);
    }
    if (broadleaf) {
      for (let j = 0; j < 12; j++) {
        const angle = rand(0, Math.PI * 2);
        const radius = rand(0.2, 3.5);
        place(leaves, leafIndex, x + Math.cos(angle) * radius, y + height * 0.76 + rand(-1.5, 3), z + Math.sin(angle) * radius,
          rand(3, 5), rand(2.8, 4.3), 1, rand(-1, 1), angle, rand(-0.7, 0.7));
        leaves.setColorAt(leafIndex++, tint.setHSL(rand(0.20, 0.28), 0.3, rand(0.54, 0.8)));
      }
    } else {
      for (let j = 0; j < 14; j++) {
        const level = j / 14;
        const radius = (1 - level) * height * 0.23;
        const angle = j * 2.399;
        place(foliage, pineIndex, x + Math.cos(angle) * radius * 0.5, y + height * (0.33 + level * 0.72), z + Math.sin(angle) * radius * 0.5,
          radius * 1.7 + 0.4, radius * 1.5 + 0.7, 1, -0.4 + rand(-0.25, 0.25), -angle, rand(-0.3, 0.3));
        foliage.setColorAt(pineIndex++, tint.setHSL(rand(0.26, 0.32), 0.2, rand(0.53, 0.8)));
      }
    }
  }
  foliage.count = pineIndex;
  leaves.count = leafIndex;

  const grassGeometry = new THREE.PlaneGeometry(0.07, 0.75, 1, 3);
  const points = grassGeometry.attributes.position;
  for (let i = 0; i < points.count; i++) {
    const t = points.getY(i) / 0.75 + 0.5;
    points.setX(i, points.getX(i) * (1 - t * 0.92) + t * t * 0.17);
    points.setY(i, points.getY(i) + 0.375);
  }
  grassGeometry.computeVertexNormals();
  const grassWind = windMaterial(null, 0.2);

  const grass = batch(grassGeometry, grassWind.material, 18000);
  for (let i = 0; i < grass.count; i++) {
    const angle = rand(0, Math.PI * 2);
    const radius = i < 6500 ? Math.sqrt(random()) * 48 : Math.sqrt(random()) * 245;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const path = Math.abs(x - Math.sin(z * 0.032) * 8) < 2.1;
    const scale = path ? rand(0.07, 0.2) : rand(0.35, 1.1);
    place(grass, i, x, terrainHeight(x, z) - 0.01, z, rand(0.6, 1.6), scale, 1, 0, angle);
    grass.setColorAt(i, tint.setHSL(rand(0.19, 0.27), rand(0.25, 0.48), rand(0.18, 0.36)));
  }
  const stone = new THREE.MeshStandardMaterial({ color: 0x82837a, map: natureTexture("ground"), roughness: 1, flatShading: true });
  const rocks = batch(new THREE.IcosahedronGeometry(1, 1), stone, 140);
  for (let i = 0; i < rocks.count; i++) {
    const x = rand(-180, 180), z = rand(-180, 180), size = rand(0.15, 1.1);
    place(rocks, i, x, terrainHeight(x, z), z, size * 1.5, size * 0.7, size, rand(0, 3), rand(0, 6));
    rocks.setColorAt(i, tint.setHSL(0.16, 0.08, rand(0.45, 0.75)));
  }
  const logs = batch(new THREE.CylinderGeometry(0.22, 0.3, 4, 9), wood, 20);
  for (let i = 0; i < logs.count; i++) {
    const x = rand(-170, 170), z = rand(-170, 170);
    place(logs, i, x, terrainHeight(x, z) + 0.23, z, 1, rand(0.7, 1.7), 1, Math.PI / 2, 0, rand(0, 6));
  }
  return { colliders, update(time) { grassWind.time.value = time; } };
}

export function createSky(scene) {
  const texture = natureTexture("sky");
  scene.add(new THREE.Mesh(
    new THREE.SphereGeometry(500, 16, 12),
    new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide, depthWrite: false })
  ));
}
