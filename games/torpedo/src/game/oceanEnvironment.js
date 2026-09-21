import * as THREE from 'three';
import { surfaceTexture } from './surfaceTextures.js';

const randomBetween = (min, max) => min + Math.random() * (max - min);
const FLOOR_SIZE = 320;

function seafloorHeight(x, z) {
  const phase = z * Math.PI * 2 / FLOOR_SIZE;
  return -18 + Math.sin(x * 0.055 + Math.sin(phase * 2)) * 1.25
    + Math.cos(phase * 3) * 0.65 + Math.sin(x * 0.14 + phase * 6) * 0.22;
}

export function createOceanEnvironment(world) {
  const environment = { floorChunks: [], bubbles: [], details: [], elapsed: 0 };
  createSeafloor(world, environment);
  createBubbles(world, environment);
  createOceanDetails(world, environment);
  return environment;
}

export function updateOceanEnvironment(environment, player, delta) {
  environment.elapsed += delta;
  for (const floor of environment.floorChunks) {
    // Keep the same three seamless tiles around the player, including after restart.
    floor.position.z = Math.round(player.position.z / FLOOR_SIZE) * FLOOR_SIZE + floor.userData.offset;
  }
  for (const bubble of environment.bubbles) {
    bubble.position.y += bubble.userData.speed * delta;
    bubble.position.z += player.forwardSpeed * delta * 0.28;
    bubble.position.x += Math.sin(environment.elapsed + bubble.userData.phase) * delta * 0.14;
    if (bubble.position.y > 22 || bubble.position.z > player.position.z + 55 || bubble.position.z < player.position.z - 260) {
      resetBubble(bubble, player.position.z);
    }
  }
  for (const detail of environment.details) {
    if (detail.position.z > player.position.z + 80 || detail.position.z < player.position.z - 300) {
      resetDetail(detail, player.position.z);
    }
    if (detail.userData.detailType === 'kelp') {
      detail.rotation.z = Math.sin(environment.elapsed * 0.65 + detail.userData.phase) * 0.09;
      detail.rotation.x = Math.cos(environment.elapsed * 0.45 + detail.userData.phase) * 0.05;
    }
  }
}

function createSeafloor(world, environment) {
  const geometry = new THREE.PlaneGeometry(FLOOR_SIZE, FLOOR_SIZE, 96, 96);
  geometry.rotateX(-Math.PI / 2);
  const positions = geometry.attributes.position;
  const colors = [];
  const sand = new THREE.Color('#8c9580');
  const silt = new THREE.Color('#556d63');
  for (let i = 0; i < positions.count; i += 1) {
    const x = positions.getX(i);
    const z = positions.getZ(i);
    const height = seafloorHeight(x, z);
    positions.setY(i, height);
    const color = silt.clone().lerp(sand, THREE.MathUtils.clamp((height + 20) / 4, 0, 1));
    colors.push(color.r, color.g, color.b);
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({
    map: surfaceTexture('sand'), bumpMap: surfaceTexture('sand'), bumpScale: 0.16,
    vertexColors: true, roughness: 0.98, metalness: 0
  });
  for (const z of [-FLOOR_SIZE, 0, FLOOR_SIZE]) {
    const floor = new THREE.Mesh(geometry, material);
    floor.position.z = z;
    floor.userData.offset = z;
    environment.floorChunks.push(floor);
    world.add(floor);
  }
}

function createBubbles(world, environment) {
  const geometry = new THREE.SphereGeometry(1, 7, 6);
  const material = new THREE.MeshBasicMaterial({ color: '#adc7c4', transparent: true, opacity: 0.2, depthWrite: false });
  for (let i = 0; i < 190; i += 1) {
    const bubble = new THREE.Mesh(geometry, material);
    bubble.scale.setScalar(randomBetween(0.025, 0.09));
    bubble.userData.speed = randomBetween(0.35, 1.4);
    bubble.userData.phase = randomBetween(0, Math.PI * 2);
    resetBubble(bubble, 0);
    environment.bubbles.push(bubble);
    world.add(bubble);
  }
}

function kelpGeometry() {
  const geometry = new THREE.PlaneGeometry(0.48, 1, 3, 16);
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i += 1) {
    const height = positions.getY(i) + 0.5;
    positions.setXYZ(i,
      positions.getX(i) * Math.sin(Math.PI * height) + Math.sin(height * 7) * height * 0.24,
      height, Math.sin(height * 10) * 0.12 * height);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function createOceanDetails(world, environment) {
  const rockMaterial = new THREE.MeshStandardMaterial({
    color: '#667970', map: surfaceTexture('steel'), bumpMap: surfaceTexture('steel'), bumpScale: 0.12, roughness: 0.97
  });
  const rockGeometry = new THREE.IcosahedronGeometry(1, 2);
  const positions = rockGeometry.attributes.position;
  for (let i = 0; i < positions.count; i += 1) {
    const point = new THREE.Vector3().fromBufferAttribute(positions, i);
    const erosion = 1 + Math.sin(point.x * 9 + point.y * 5) * Math.cos(point.z * 8) * 0.16;
    point.multiplyScalar(erosion);
    positions.setXYZ(i, point.x, point.y, point.z);
  }
  rockGeometry.computeVertexNormals();
  for (let i = 0; i < 76; i += 1) {
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
    const size = randomBetween(0.3, 2.3);
    rock.scale.set(size * randomBetween(1, 1.9), size * randomBetween(0.35, 0.7), size);
    rock.userData.detailType = 'rock';
    resetDetail(rock, 0);
    environment.details.push(rock);
    world.add(rock);
  }
  const leafGeometry = kelpGeometry();
  const kelpMaterial = new THREE.MeshStandardMaterial({ color: '#3e6042', roughness: 0.86, side: THREE.DoubleSide });
  for (let i = 0; i < 36; i += 1) {
    const kelp = new THREE.Group();
    for (let blade = 0; blade < 3; blade += 1) {
      const leaf = new THREE.Mesh(leafGeometry, kelpMaterial);
      leaf.scale.set(randomBetween(0.7, 1.5), randomBetween(1.8, 4.6), 1);
      leaf.rotation.y = blade * Math.PI / 3;
      leaf.position.x = (blade - 1) * 0.18;
      kelp.add(leaf);
    }
    kelp.userData.detailType = 'kelp';
    kelp.userData.phase = Math.random() * Math.PI * 2;
    resetDetail(kelp, 0);
    environment.details.push(kelp);
    world.add(kelp);
  }
}

function resetBubble(bubble, playerZ) {
  bubble.position.set(randomBetween(-85, 85), randomBetween(-17, 20), playerZ - randomBetween(45, 190));
}

function resetDetail(detail, playerZ) {
  const x = randomBetween(-100, 100);
  const z = playerZ - randomBetween(25, 260);
  detail.position.set(x, seafloorHeight(x, z) - 0.12, z);
  detail.rotation.set(0, randomBetween(0, Math.PI * 2), 0);
}
