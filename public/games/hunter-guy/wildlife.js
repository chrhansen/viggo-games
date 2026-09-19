import * as THREE from "three";
import { buildFox, buildDeer, buildBear, animateAnimal } from "./animal-models.js";

const FOX_COUNT = 14;
const DEER_COUNT = 10;
const BEAR_COUNT = 5;
const ANIMAL_SPEED_SCALE = 0.5;

function rand(min, max) {
  return THREE.MathUtils.randFloat(min, max);
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
        heightOffset: 0,
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
        heightOffset: 0,
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
        heightOffset: 0,
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

        animal.group.rotation.y = -animal.direction;
      }

      animateAnimal(animal, delta);
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
