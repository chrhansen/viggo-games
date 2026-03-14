import * as THREE from "three";

const FOX_COUNT = 14;
const DEER_COUNT = 10;
const BEAR_COUNT = 5;
const ANIMAL_SPEED_SCALE = 0.5;

function rand(min, max) {
  return THREE.MathUtils.randFloat(min, max);
}

function buildFox() {
  const group = new THREE.Group();
  const foxOrange = new THREE.MeshStandardMaterial({ color: 0xcf5f1b, roughness: 0.75 });
  const foxWhite = new THREE.MeshStandardMaterial({ color: 0xf9e9d8, roughness: 0.85 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.55, 0.58), foxOrange);
  body.position.y = 0.38;
  body.castShadow = true;
  group.add(body);

  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.33, 0.44), foxWhite);
  chest.position.set(0.1, 0.26, 0);
  group.add(chest);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.38, 0.44), foxOrange);
  head.position.set(0.74, 0.52, 0);
  head.castShadow = true;
  group.add(head);

  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.92, 7), foxOrange);
  tail.position.set(-0.72, 0.52, 0);
  tail.rotation.z = -Math.PI / 2.2;
  tail.castShadow = true;
  group.add(tail);

  return { group, hitMeshes: [body, head, tail] };
}

function buildDeer() {
  const group = new THREE.Group();
  const coat = new THREE.MeshStandardMaterial({ color: 0x9a6f45, roughness: 0.85 });
  const cream = new THREE.MeshStandardMaterial({ color: 0xe8d7ba, roughness: 0.86 });
  const antlerMat = new THREE.MeshStandardMaterial({ color: 0x8f7b59, roughness: 0.88 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.82, 0.62), coat);
  body.position.y = 0.66;
  body.castShadow = true;
  group.add(body);

  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.53, 0.28), coat);
  neck.position.set(0.84, 0.95, 0);
  neck.rotation.z = -0.25;
  neck.castShadow = true;
  group.add(neck);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.34, 0.3), cream);
  head.position.set(1.2, 1.05, 0);
  head.castShadow = true;
  group.add(head);

  const earL = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.18, 0.05), coat);
  earL.position.set(1.34, 1.28, 0.1);
  earL.rotation.z = 0.2;
  group.add(earL);

  const earR = earL.clone();
  earR.position.z = -0.1;
  earR.rotation.z = -0.2;
  group.add(earR);

  const antlerL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.25, 0.04), antlerMat);
  antlerL.position.set(1.28, 1.44, 0.09);
  antlerL.rotation.z = -0.18;
  group.add(antlerL);

  const antlerR = antlerL.clone();
  antlerR.position.z = -0.09;
  antlerR.rotation.z = 0.18;
  group.add(antlerR);

  const legGeo = new THREE.CylinderGeometry(0.06, 0.07, 0.78, 8);
  const legOffsets = [
    [0.62, 0.32],
    [0.62, -0.32],
    [-0.62, 0.32],
    [-0.62, -0.32],
  ];
  legOffsets.forEach(([x, z]) => {
    const leg = new THREE.Mesh(legGeo, coat);
    leg.position.set(x, 0.33, z);
    leg.castShadow = true;
    group.add(leg);
  });

  return { group, hitMeshes: [body, neck, head] };
}

function buildBear() {
  const group = new THREE.Group();
  const fur = new THREE.MeshStandardMaterial({ color: 0x5b432e, roughness: 0.92 });
  const snout = new THREE.MeshStandardMaterial({ color: 0xa38460, roughness: 0.85 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(2.25, 1.16, 0.92), fur);
  body.position.y = 0.92;
  body.castShadow = true;
  group.add(body);

  const shoulder = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.72, 0.84), fur);
  shoulder.position.set(0.88, 1.2, 0);
  shoulder.castShadow = true;
  group.add(shoulder);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.37, 12, 12), fur);
  head.position.set(1.38, 1.25, 0);
  head.castShadow = true;
  group.add(head);

  const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.22), snout);
  muzzle.position.set(1.62, 1.2, 0);
  group.add(muzzle);

  const earL = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), fur);
  earL.position.set(1.18, 1.56, 0.2);
  group.add(earL);

  const earR = earL.clone();
  earR.position.z = -0.2;
  group.add(earR);

  const legGeo = new THREE.CylinderGeometry(0.16, 0.18, 0.78, 8);
  const legOffsets = [
    [0.72, 0.36],
    [0.72, -0.36],
    [-0.72, 0.36],
    [-0.72, -0.36],
  ];
  legOffsets.forEach(([x, z]) => {
    const leg = new THREE.Mesh(legGeo, fur);
    leg.position.set(x, 0.38, z);
    leg.castShadow = true;
    group.add(leg);
  });

  return { group, hitMeshes: [body, shoulder, head, muzzle] };
}

function animalName(type) {
  if (type === "fox") {
    return "Fox";
  }
  if (type === "deer") {
    return "Deer";
  }
  return "Bear";
}

export function createWildlife({ scene, terrainHeight, randomInWorld, clampToWorld, worldHalf }) {
  const animals = [];
  const hitMeshes = [];

  function registerMeshes(animal, meshes) {
    meshes.forEach((mesh) => {
      mesh.userData.animal = animal;
      hitMeshes.push(mesh);
    });
  }

  function spawnAnimal(type, options, buildFn) {
    const { group, hitMeshes: meshes } = buildFn();
    const x = randomInWorld(options.pad);
    const z = randomInWorld(options.pad);
    group.position.set(x, terrainHeight(x, z) + options.heightOffset, z);
    group.rotation.y = Math.random() * Math.PI * 2;
    scene.add(group);

    const speed = rand(options.speedMin, options.speedMax);
    const animal = {
      type,
      name: animalName(type),
      hp: options.hp,
      maxHp: options.hp,
      alive: true,
      group,
      direction: Math.random() * Math.PI * 2,
      turnTimer: rand(options.turnMin, options.turnMax),
      speed,
      baseSpeed: speed,
      scaredFor: 0,
      heightOffset: options.heightOffset,
      turnMin: options.turnMin,
      turnMax: options.turnMax,
      scareBoost: options.scareBoost,
      edgeBuffer: options.edgeBuffer,
      moveMin: options.moveMin,
      moveMax: options.moveMax,
      idleMin: options.idleMin,
      idleMax: options.idleMax,
      moving: Math.random() >= 0.5,
      moveStateTimer: 0,
    };
    animal.moveStateTimer = animal.moving
      ? rand(animal.moveMin, animal.moveMax)
      : rand(animal.idleMin, animal.idleMax);
    animals.push(animal);
    registerMeshes(animal, meshes);
  }

  for (let i = 0; i < FOX_COUNT; i += 1) {
    spawnAnimal(
      "fox",
      {
        hp: 1,
        pad: 28,
        speedMin: 2.2,
        speedMax: 3.2,
        heightOffset: 0.18,
        turnMin: 0.9,
        turnMax: 2.3,
        scareBoost: 1.8,
        edgeBuffer: 6,
        moveMin: 1.1,
        moveMax: 2.1,
        idleMin: 0.9,
        idleMax: 1.9,
      },
      buildFox
    );
  }

  for (let i = 0; i < DEER_COUNT; i += 1) {
    spawnAnimal(
      "deer",
      {
        hp: 1,
        pad: 34,
        speedMin: 1.6,
        speedMax: 2.4,
        heightOffset: 0.06,
        turnMin: 1.2,
        turnMax: 2.8,
        scareBoost: 1.45,
        edgeBuffer: 8,
        moveMin: 1.4,
        moveMax: 2.6,
        idleMin: 1.2,
        idleMax: 2.4,
      },
      buildDeer
    );
  }

  for (let i = 0; i < BEAR_COUNT; i += 1) {
    spawnAnimal(
      "bear",
      {
        hp: 2,
        pad: 42,
        speedMin: 1.2,
        speedMax: 1.8,
        heightOffset: 0.1,
        turnMin: 1.5,
        turnMax: 3.3,
        scareBoost: 1.2,
        edgeBuffer: 10,
        moveMin: 1.7,
        moveMax: 3.1,
        idleMin: 1.5,
        idleMax: 2.9,
      },
      buildBear
    );
  }

  function applyDamage(animal, amount) {
    if (!animal || !animal.alive) {
      return { hit: false };
    }
    animal.hp -= amount;
    if (animal.hp <= 0) {
      animal.alive = false;
      animal.group.visible = false;
      return { hit: true, killed: true, animal };
    }
    animal.scaredFor = Math.max(animal.scaredFor, 2);
    animal.turnTimer = 0.08;
    animal.speed = Math.min(animal.baseSpeed + 1.05, animal.baseSpeed * 2);
    animal.moving = true;
    animal.moveStateTimer = rand(animal.moveMin, animal.moveMax);
    return { hit: true, killed: false, animal, hp: animal.hp };
  }

  function squirt(animal) {
    if (!animal || !animal.alive) {
      return false;
    }
    animal.scaredFor = Math.max(animal.scaredFor, 2.7);
    animal.turnTimer = 0.08;
    animal.speed = Math.min(animal.baseSpeed * animal.scareBoost + 0.6, animal.baseSpeed * 2.2);
    animal.moving = true;
    animal.moveStateTimer = rand(animal.moveMin, animal.moveMax);
    return true;
  }

  function update(delta) {
    animals.forEach((animal) => {
      if (!animal.alive) {
        return;
      }

      const scared = animal.scaredFor > 0;
      if (!scared) {
        animal.moveStateTimer -= delta;
        if (animal.moveStateTimer <= 0) {
          animal.moving = !animal.moving;
          animal.moveStateTimer = animal.moving
            ? rand(animal.moveMin, animal.moveMax)
            : rand(animal.idleMin, animal.idleMax);
          if (animal.moving) {
            animal.turnTimer = Math.min(animal.turnTimer, 0.15);
          }
        }
      } else {
        animal.moving = true;
      }

      if (animal.moving || scared) {
        animal.turnTimer -= delta;
        if (animal.turnTimer <= 0) {
          const turnRange = scared ? 1.25 : 0.82;
          animal.direction += rand(-turnRange, turnRange);
          animal.turnTimer = rand(animal.turnMin, animal.turnMax);
        }

        const speedBoost = scared ? animal.scareBoost : 1;
        const step = animal.speed * speedBoost * delta * ANIMAL_SPEED_SCALE;
        animal.group.position.x += Math.cos(animal.direction) * step;
        animal.group.position.z += Math.sin(animal.direction) * step;

        if (
          Math.abs(animal.group.position.x) > worldHalf - animal.edgeBuffer ||
          Math.abs(animal.group.position.z) > worldHalf - animal.edgeBuffer
        ) {
          animal.direction += Math.PI * 0.72;
        }

        animal.group.rotation.y = -animal.direction + Math.PI / 2;
      }

      clampToWorld(animal.group);
      animal.group.position.y =
        terrainHeight(animal.group.position.x, animal.group.position.z) + animal.heightOffset;

      if (scared) {
        animal.scaredFor -= delta;
      } else {
        animal.speed = THREE.MathUtils.lerp(animal.speed, animal.baseSpeed, Math.min(1, delta * 2));
      }
    });
  }

  return { animals, hitMeshes, applyDamage, squirt, update };
}
