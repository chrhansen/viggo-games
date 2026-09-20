import * as THREE from 'three';

const randomBetween = (min, max) => min + Math.random() * (max - min);

export function createOceanEnvironment(world) {
  const environment = {
    floorChunks: [],
    bubbles: [],
    details: [],
    lightShafts: []
  };

  createSeafloor(world, environment);
  createBubbles(world, environment);
  createLightShafts(world, environment);
  createOceanDetails(world, environment);

  return environment;
}

export function updateOceanEnvironment(environment, player, delta) {
  for (const floor of environment.floorChunks) {
    if (floor.position.z > player.position.z + 210) {
      floor.position.z -= 960;
    }
  }

  for (const bubble of environment.bubbles) {
    bubble.position.y += bubble.userData.speed * delta;
    bubble.position.z += player.forwardSpeed * delta * 0.28;
    bubble.position.x += Math.sin(performance.now() * 0.001 + bubble.userData.phase) * delta * 0.14;
    if (bubble.position.y > 22 || bubble.position.z > player.position.z + 55) {
      resetBubble(bubble, player.position.z);
    }
  }

  for (const detail of environment.details) {
    if (detail.position.z > player.position.z + 80) {
      resetDetail(detail, player.position.z);
    }
  }

  for (const shaft of environment.lightShafts) {
    if (shaft.position.z > player.position.z + 90) {
      shaft.position.z = player.position.z - randomBetween(160, 260);
      shaft.position.x = randomBetween(-68, 68);
    }
  }
}

function createSeafloor(world, environment) {
  const floorGeometry = new THREE.PlaneGeometry(320, 320, 24, 24);
  const positions = floorGeometry.attributes.position;
  for (let i = 0; i < positions.count; i += 1) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    positions.setZ(i, Math.sin(x * 0.08) * 1.8 + Math.cos(y * 0.06) * 1.2);
  }
  positions.needsUpdate = true;
  floorGeometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color: '#17495a',
    roughness: 0.92,
    metalness: 0.05
  });

  for (const z of [-320, 0, 320]) {
    const floor = new THREE.Mesh(floorGeometry, material);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, -18, z);
    environment.floorChunks.push(floor);
    world.add(floor);
  }
}

function createBubbles(world, environment) {
  const material = new THREE.MeshBasicMaterial({
    color: '#b9f4ff',
    transparent: true,
    opacity: 0.38
  });

  for (let i = 0; i < 190; i += 1) {
    const bubble = new THREE.Mesh(new THREE.SphereGeometry(randomBetween(0.035, 0.13), 8, 8), material);
    bubble.userData.speed = randomBetween(0.8, 2.4);
    bubble.userData.phase = randomBetween(0, Math.PI * 2);
    resetBubble(bubble, 0);
    environment.bubbles.push(bubble);
    world.add(bubble);
  }
}

function createLightShafts(world, environment) {
  const material = new THREE.MeshBasicMaterial({
    color: '#8bd8e8',
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  for (let i = 0; i < 11; i += 1) {
    const shaft = new THREE.Mesh(new THREE.ConeGeometry(randomBetween(7, 15), 90, 18, 1, true), material);
    shaft.position.set(randomBetween(-68, 68), 30, randomBetween(-220, 55));
    shaft.rotation.z = randomBetween(-0.18, 0.18);
    shaft.rotation.x = randomBetween(-0.08, 0.08);
    environment.lightShafts.push(shaft);
    world.add(shaft);
  }
}

function createOceanDetails(world, environment) {
  const rockMaterial = new THREE.MeshStandardMaterial({ color: '#315a5f', roughness: 0.85 });
  const kelpMaterial = new THREE.MeshStandardMaterial({ color: '#2c7563', roughness: 0.72 });
  const metalMaterial = new THREE.MeshStandardMaterial({ color: '#53666a', roughness: 0.66, metalness: 0.35 });

  for (let i = 0; i < 58; i += 1) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(randomBetween(0.4, 1.7), 0), rockMaterial);
    rock.scale.set(randomBetween(0.8, 1.9), randomBetween(0.35, 0.95), randomBetween(0.7, 1.5));
    rock.userData.detailType = 'rock';
    resetDetail(rock, 0);
    environment.details.push(rock);
    world.add(rock);
  }

  for (let i = 0; i < 36; i += 1) {
    const kelp = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.16, randomBetween(2.4, 5.2), 6), kelpMaterial);
    kelp.userData.detailType = 'kelp';
    resetDetail(kelp, 0);
    environment.details.push(kelp);
    world.add(kelp);
  }

  for (let i = 0; i < 12; i += 1) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(randomBetween(0.7, 1.2), 0.06, 8, 18, Math.PI), metalMaterial);
    rib.userData.detailType = 'rib';
    resetDetail(rib, 0);
    rib.rotation.z = Math.PI / 2;
    environment.details.push(rib);
    world.add(rib);
  }
}

function resetBubble(bubble, playerZ) {
  bubble.position.set(randomBetween(-85, 85), randomBetween(-17, 20), playerZ - randomBetween(45, 190));
}

function resetDetail(detail, playerZ) {
  detail.position.set(randomBetween(-115, 115), -17.7, playerZ - randomBetween(65, 260));
  if (detail.userData.detailType === 'kelp') {
    detail.position.y = -15.6;
    detail.rotation.set(randomBetween(-0.16, 0.16), 0, randomBetween(-0.14, 0.14));
    return;
  }
  if (detail.userData.detailType === 'rib') {
    detail.rotation.set(randomBetween(-0.2, 0.2), randomBetween(0, Math.PI), Math.PI / 2);
    return;
  }
  detail.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
}
